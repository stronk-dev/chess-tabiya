import { describe, expect, it } from "vitest";

import {
  assertParsedLongitudinalReadQuery,
  LONGITUDINAL_SOURCE_MUTATION_OPERATIONS,
  REVISION_ONE_IMPORTED_MAINLINE_DISPOSITION,
  invalidateForSourceImage,
  parseLongitudinalDenominatorRow,
  parseLongitudinalObservationRow,
  parseLongitudinalReadQuery,
  parseLongitudinalStructureStatRow,
  revisionOnePersonalPlayAdmitted,
  sourceDigestV2,
  taintStructureAttribution,
  type LongitudinalSourceImageV2,
  type ProjectionAdmission,
} from "./contract.js";

const admissions: readonly ProjectionAdmission[] = Object.freeze([
  { id: "rules.structural.event.backward_pawn", version: 1, pairs: [{ semanticSign: "gained", sourceSign: "gained" }] },
  { id: "derived.semantic_avoidance.backward_pawn", version: 1, pairs: [{ semanticSign: "avoided", sourceSign: "gained" }] },
]);
const at = "2026-09-04T00:00:00.000Z";
const moveRef = Object.freeze({ kind: "move" as const, nodeId: "node-1", eventSeq: 2 });
const source = (structureAttribution: LongitudinalSourceImageV2["structureAttribution"]): LongitudinalSourceImageV2 => Object.freeze({
  version: 2, runPrefix: { id: "run", events: [{ seq: 1 }, { seq: 2 }] }, ownerLearnerId: "learner",
  moveAuthorship: [{ eventSeq: 2, nodeId: "node-1", learnerId: "learner" }], importedMainlinePlies: null, structureAttribution,
});

describe("D2570/D2574 complete source-mutation truth", () => {
  it("invalidates a complete job at the same event head when collaboration taints structure", () => {
    expect(LONGITUDINAL_SOURCE_MUTATION_OPERATIONS).toContain("createLiveSession");
    expect(LONGITUDINAL_SOURCE_MUTATION_OPERATIONS).toContain("grantRole");
    const prior = source("single_player");
    const next = source(taintStructureAttribution(prior.structureAttribution));
    const complete = Object.freeze({ requestedSeq: 2, requestedSourceDigest: sourceDigestV2(prior), completedSeq: 2, state: "complete" as const, claimGeneration: 4 });
    expect(invalidateForSourceImage(complete, prior, next)).toEqual({ requestedSeq: 2, requestedSourceDigest: sourceDigestV2(next), completedSeq: 0, state: "pending", claimGeneration: 5 });
    expect(invalidateForSourceImage(complete, prior, prior)).toBe(complete);
  });

  it("never upgrades shared or legacy-unattributable history back to single-player", () => {
    expect(taintStructureAttribution("single_player")).toBe("unattributable_shared");
    expect(taintStructureAttribution("unattributable_shared")).toBe("unattributable_shared");
    expect(taintStructureAttribution("unattributable_legacy")).toBe("unattributable_legacy");
    expect(sourceDigestV2(source("unattributable_legacy"))).not.toBe(sourceDigestV2(source("single_player")));
  });
});

describe("D2571 exact parsed row families", () => {
  const denominator = { learnerId: "learner", runId: "run", phase: "middlegame", decisionClass: "played", decisions: 3, observedAt: at, derivedRev: 1 };
  it("parses immutable denominators, observations and structure rows", () => {
    expect(parseLongitudinalDenominatorRow(denominator)).toEqual(denominator);
    expect(parseLongitudinalObservationRow({ ...denominator, projectionId: admissions[0]!.id, projectionVersion: 1, semanticSign: "gained", sourceSign: "gained", sessionKind: "position", packId: null, opportunities: 1, occurred: 1, alternativeShareSum: 0.5, occurredRefs: [moveRef], opportunityRefs: [moveRef] }, admissions)).toMatchObject({ projectionId: admissions[0]!.id, occurredRefs: [moveRef] });
    expect(parseLongitudinalStructureStatRow({ learnerId: "learner", runId: "run", rootKey: "root", rootNodeId: "node-0", sessionKind: "position", packId: null, branchCount: 1, rewoundCount: 0, forkedCount: 0, groupCount: 0, outcomeCount: 0, observedAt: at, derivedRev: 1 })).toMatchObject({ rootKey: "root", branchCount: 1 });
  });

  it("refuses extra fields, unknown projection/signs and forged reference cardinality", () => {
    expect(() => parseLongitudinalDenominatorRow({ ...denominator, sentence: "guess" })).toThrow(/DENOMINATOR_INVALID/u);
    const base = { ...denominator, projectionId: admissions[0]!.id, projectionVersion: 1, semanticSign: "gained", sourceSign: "gained", sessionKind: "position", packId: null, opportunities: 1, occurred: 1, alternativeShareSum: 0.5, occurredRefs: [moveRef], opportunityRefs: [moveRef] };
    expect(() => parseLongitudinalObservationRow({ ...base, projectionId: "unknown" }, admissions)).toThrow(/PROJECTION_SIGN_UNKNOWN/u);
    expect(() => parseLongitudinalObservationRow({ ...base, occurredRefs: [] }, admissions)).toThrow(/REF_COUNT_MISMATCH/u);
    expect(() => parseLongitudinalObservationRow({ ...base, opportunityRefs: [{ ...moveRef, nodeId: "other" }] }, admissions)).toThrow(/OCCURRED_NOT_OPPORTUNITY/u);
    expect(() => parseLongitudinalStructureStatRow({ learnerId: "learner", runId: "run", rootKey: "root", rootNodeId: "node", sessionKind: "pack", packId: null, branchCount: 1, rewoundCount: 0, forkedCount: 0, groupCount: 0, outcomeCount: 0, observedAt: at, derivedRev: 1 })).toThrow(/PACK_PROVENANCE_INVALID/u);
  });
});

describe("D2572 revision-one import truth", () => {
  it("keeps imported mainline decisions observed-only without future subject fields", () => {
    expect(REVISION_ONE_IMPORTED_MAINLINE_DISPOSITION).toBe("observed_only");
    expect(revisionOnePersonalPlayAdmitted("game")).toBe(false);
    expect(revisionOnePersonalPlayAdmitted("played")).toBe(true);
    expect(revisionOnePersonalPlayAdmitted("predicted")).toBe(false);
  });
});

describe("D2573 closed query parser", () => {
  const query = { learnerId: "learner", derivationRev: 1, through: { kind: "runs", cuts: [{ runId: "b", requestedSeq: 2 }, { runId: "a", requestedSeq: 1 }] }, filter: { phases: ["middlegame", "opening"], projections: [{ id: admissions[0]!.id, version: 1, semanticSign: "gained", sourceSign: "gained" }] } };
  it("parses JSON and returns one stable branded domain query", () => {
    const parsed = parseLongitudinalReadQuery(JSON.parse(JSON.stringify(query)), admissions);
    expect(() => assertParsedLongitudinalReadQuery(parsed)).not.toThrow();
    expect(() => assertParsedLongitudinalReadQuery(query)).toThrow(/QUERY_UNPARSED/u);
    expect(parsed.through).toEqual({ kind: "runs", cuts: [{ runId: "a", requestedSeq: 1 }, { runId: "b", requestedSeq: 2 }] });
    expect(parsed.filter.phases).toEqual(["middlegame", "opening"]);
  });

  it("refuses empty, duplicate, unknown, contradictory and extra inputs", () => {
    expect(() => parseLongitudinalReadQuery({ ...query, filter: { phases: [] } }, admissions)).toThrow(/FILTER_PHASE_INVALID/u);
    expect(() => parseLongitudinalReadQuery({ ...query, filter: { phases: ["opening", "opening"] } }, admissions)).toThrow(/FILTER_PHASE_INVALID/u);
    expect(() => parseLongitudinalReadQuery({ ...query, filter: { projections: [{ id: "unknown", version: 1 }] } }, admissions)).toThrow(/FILTER_PROJECTION_UNKNOWN/u);
    expect(() => parseLongitudinalReadQuery({ ...query, filter: { packIds: ["pack"], sessionKinds: ["imported"] } }, admissions)).toThrow(/FILTER_CONTRADICTORY/u);
    expect(() => parseLongitudinalReadQuery({ ...query, extra: true }, admissions)).toThrow(/QUERY_INVALID/u);
    expect(() => parseLongitudinalReadQuery({ ...query, filter: { mystery: ["x"] } }, admissions)).toThrow(/FILTER_INVALID/u);
  });
});
