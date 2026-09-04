import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  LONGITUDINAL_PROJECTION_ADMISSIONS,
  LONGITUDINAL_SOURCE_MUTATION_OPERATIONS,
  assertCurrentClaim,
  compileSourceMutationOperations,
  constructLongitudinalSourceImage,
  invalidateForSourceImage,
  parseLongitudinalObservationRow,
  parseLongitudinalReadQuery,
  parseRunReplayPrefix,
  projectLongitudinalObservation,
  sourceDigestV3,
  type DurableLongitudinalJob,
  type LongitudinalSourceImageV3,
} from "./contract.js";

const at = "2026-09-04T00:00:00.000Z";
const projection = LONGITUDINAL_PROJECTION_ADMISSIONS.find((row) => row.id === "rules.structural.event.backward_pawn")!;
const moveRef = (eventSeq: number, nodeId: string) => Object.freeze({ kind: "move" as const, nodeId, eventSeq });

function observation(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    learnerId: "learner", runId: "run", phase: "middlegame", decisionClass: "played",
    decisions: 2, observedAt: at, derivedRev: 1, projectionId: projection.id,
    projectionVersion: projection.version, semanticSign: "gained", sourceSign: "gained",
    sessionKind: "position", packId: null, opportunities: 1, occurred: 0,
    alternativeShareSum: 0, occurredRefs: [], opportunityRefs: [moveRef(2, "node-1")],
    ...overrides,
  };
}

function prefix(runId = "run") {
  return parseRunReplayPrefix({
    runId, ownerLearnerId: "learner", requestedSeq: 2,
    events: [
      { seq: 1, type: "run.started", nodeId: null },
      { seq: 2, type: "move.committed", nodeId: "node-1" },
    ],
  });
}

function image(structureAttribution: LongitudinalSourceImageV3["structureAttribution"] = "single_player") {
  return constructLongitudinalSourceImage({
    runPrefix: prefix(), ownerLearnerId: "learner",
    moveAuthorship: [{ eventSeq: 2, nodeId: "node-1", learnerId: "learner" }],
    importedMainlinePlies: null, structureAttribution,
  });
}

const emptyClaim = {
  claimedRequestedSeq: null, claimedSourceDigest: null, claimToken: null, claimedBy: null,
  leaseExpiresAt: null,
} as const;

function job(source: LongitudinalSourceImageV3, state: DurableLongitudinalJob["state"]): DurableLongitudinalJob {
  const base = {
    runId: "run", learnerId: "learner", requestedSeq: 2, requestedSourceDigest: sourceDigestV3(source),
    completedSeq: state === "complete" ? 2 : 0, derivedRev: 1, claimGeneration: 4,
    retryCount: state === "retry_wait" || state === "quarantined" ? 2 : 0,
  } as const;
  if (state === "running") return Object.freeze({ ...base, state, claimedRequestedSeq: 2, claimedSourceDigest: sourceDigestV3(source), claimToken: "old-token", claimedBy: "worker-a", leaseExpiresAt: "later", nextAttemptAt: null, failureCode: null });
  if (state === "retry_wait") return Object.freeze({ ...base, ...emptyClaim, state, nextAttemptAt: "later", failureCode: "derivation_failed" });
  if (state === "quarantined") return Object.freeze({ ...base, ...emptyClaim, state, nextAttemptAt: null, failureCode: "snapshot_invalid" });
  return Object.freeze({ ...base, ...emptyClaim, state, nextAttemptAt: null, failureCode: null });
}

describe("longitudinal-store seventh author repair", () => {
  it("D2598 enforces 0 < opportunities <= decisions in parser, projector and SQL", () => {
    expect(parseLongitudinalObservationRow(observation())).toMatchObject({ decisions: 2, opportunities: 1 });
    expect(projectLongitudinalObservation(observation())).toMatchObject({ opportunityRefs: [moveRef(2, "node-1")] });
    expect(() => parseLongitudinalObservationRow(observation({ decisions: 1, opportunities: 2, opportunityRefs: [moveRef(1, "a"), moveRef(2, "b")] }))).toThrow(/COUNTS_INVALID/u);
    expect(readFileSync("rfc/longitudinal-store.md", "utf8")).toMatch(/CHECK \(opportunities > 0 AND opportunities <= decisions\)/u);
  });

  it("D2599 closes row and query admission over the literal immutable registry", () => {
    expect(LONGITUDINAL_PROJECTION_ADMISSIONS.length).toBe(59);
    expect(Object.isFrozen(LONGITUDINAL_PROJECTION_ADMISSIONS)).toBe(true);
    expect(() => parseLongitudinalObservationRow(observation({ projectionId: "invented.editorial.grade", projectionVersion: 77, semanticSign: "state", sourceSign: "state" }))).toThrow(/PROJECTION_SIGN_UNKNOWN/u);
    expect(() => parseLongitudinalReadQuery({ learnerId: "learner", derivationRev: 1, through: { kind: "all_complete" }, filter: { projections: [{ id: "invented.editorial.grade", version: 77 }] } })).toThrow(/FILTER_PROJECTION_UNKNOWN/u);
  });

  it("D2600 seals exact replay-joined immutable source identity", () => {
    const callerAuthorship = [{ eventSeq: 2, nodeId: "node-1", learnerId: "learner" }];
    const sealed = constructLongitudinalSourceImage({ runPrefix: prefix(), ownerLearnerId: "learner", moveAuthorship: callerAuthorship, importedMainlinePlies: null, structureAttribution: "single_player" });
    const before = sourceDigestV3(sealed);
    callerAuthorship[0]!.nodeId = "forged";
    expect(sourceDigestV3(sealed)).toBe(before);
    expect(Object.isFrozen(sealed.moveAuthorship[0])).toBe(true);
    expect(() => constructLongitudinalSourceImage({ runPrefix: { ...prefix() }, ownerLearnerId: "learner", moveAuthorship: [], importedMainlinePlies: null, structureAttribution: "single_player" })).toThrow(/PREFIX_UNPARSED/u);
    expect(() => constructLongitudinalSourceImage({ runPrefix: prefix(), ownerLearnerId: "learner", moveAuthorship: [{ eventSeq: 2, nodeId: "foreign", learnerId: "learner" }], importedMainlinePlies: null, structureAttribution: "single_player" })).toThrow(/AUTHORSHIP_PREFIX_MISMATCH/u);
    expect(() => constructLongitudinalSourceImage({ runPrefix: prefix(), ownerLearnerId: "learner", moveAuthorship: [{ eventSeq: 2, nodeId: "node-1", learnerId: "learner" }, { eventSeq: 2, nodeId: "node-1", learnerId: "learner" }], importedMainlinePlies: null, structureAttribution: "single_player" })).toThrow(/AUTHORSHIP_INVALID/u);
    expect(() => sourceDigestV3({ ...sealed })).toThrow(/SOURCE_UNSEALED/u);
  });

  it("D2601 compiles the exact co-located mutation population and rejects missing/surplus rows", () => {
    const productionImage = LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.map((row) => `longitudinalSourceMutation({ symbol: "${row.symbol}", effect: "${row.effect}" })`).join("\n");
    expect(compileSourceMutationOperations(productionImage)).toHaveLength(11);
    expect(LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.some((row) => row.symbol.includes("startupLegacyClassification"))).toBe(false);
    expect(() => compileSourceMutationOperations(productionImage.split("\n").slice(1).join("\n"))).toThrow(/OPERATION_MISMATCH/u);
    expect(() => compileSourceMutationOperations(`${productionImage}\nlongitudinalSourceMutation({ symbol: "invented", effect: "always" })`)).toThrow(/OPERATION_MISMATCH/u);
  });

  it("D2602 resets every non-pending durable state and rejects every old claim action", () => {
    const prior = image("single_player");
    const next = image("unattributable_shared");
    const pending = job(prior, "pending");
    expect(invalidateForSourceImage(pending, prior, prior)).toBe(pending);
    for (const state of ["complete", "running", "retry_wait", "quarantined"] as const) {
      const original = job(prior, state);
      const reset = invalidateForSourceImage(original, prior, next);
      expect(reset).toMatchObject({ state: "pending", completedSeq: 0, claimGeneration: 5, retryCount: 0, claimToken: null, claimedBy: null, leaseExpiresAt: null, nextAttemptAt: null, failureCode: null });
      expect(() => assertCurrentClaim(reset, { runId: "run", learnerId: "learner", generation: 4, token: "old-token", worker: "worker-a", sourceDigest: sourceDigestV3(prior) })).toThrow(/STALE_CLAIM/u);
    }
  });
});
