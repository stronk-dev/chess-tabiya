import { readFileSync } from "node:fs";

import { createRun } from "../../packages/runtime/src/runtime.js";
import { describe, expect, it } from "vitest";

import {
  LONGITUDINAL_SOURCE_MUTATION_OPERATIONS,
  assertCurrentClaim,
  compileSourceMutationOperations,
  constructLongitudinalSourceImage,
  invalidateForSourceImage,
  parseRunReplayPrefix,
  sourceDigestV3,
  type DurableLongitudinalJob,
  type LongitudinalSourceImageV3,
} from "../d2598-longitudinal-seventh-author-repair/contract.js";

const digest = `sha256:${"a".repeat(64)}` as const;

function modeledPrefix(runId = "run") {
  return parseRunReplayPrefix({
    runId,
    ownerLearnerId: "learner",
    requestedSeq: 2,
    events: [
      { seq: 1, type: "run.started", nodeId: null },
      { seq: 2, type: "move.committed", nodeId: "node-1" },
    ],
  });
}

function image(runId = "run"): LongitudinalSourceImageV3 {
  return constructLongitudinalSourceImage({
    runPrefix: modeledPrefix(runId),
    ownerLearnerId: "learner",
    moveAuthorship: [{ eventSeq: 2, nodeId: "node-1", learnerId: "learner" }],
    importedMainlinePlies: null,
    structureAttribution: "single_player",
  });
}

function runningJob(source: LongitudinalSourceImageV3, runId = "run"): DurableLongitudinalJob {
  return Object.freeze({
    runId,
    learnerId: "learner",
    requestedSeq: 2,
    requestedSourceDigest: sourceDigestV3(source),
    completedSeq: 0,
    derivedRev: 1,
    claimGeneration: 4,
    retryCount: 0,
    state: "running",
    claimedRequestedSeq: 2,
    claimedSourceDigest: sourceDigestV3(source),
    claimToken: "token",
    claimedBy: "worker",
    leaseExpiresAt: "1970-01-01T00:00:00.000Z",
    nextAttemptAt: null,
    failureCode: null,
  });
}

describe("longitudinal-store seventh fresh independent review", () => {
  it("D2718 rejects the real replay event shape while accepting an invented flattened stream", () => {
    const run = createRun({
      id: "real-run",
      session: {
        kind: "position",
        start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" },
        feedbackPolicy: "attempt_end",
        opponentPolicy: { mode: "human_common", targetElo: 1500 },
      },
      sessionDigest: digest,
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      seed: 1,
      createdAt: "2026-09-05T00:00:00.000Z",
    });

    expect(() => parseRunReplayPrefix({
      runId: run.id,
      ownerLearnerId: "learner",
      requestedSeq: run.events.length,
      events: run.events,
    })).toThrow(/PREFIX_INVALID/u);

    expect(parseRunReplayPrefix({
      runId: "invented",
      ownerLearnerId: "learner",
      requestedSeq: 1,
      events: [{ seq: 1, type: "not.a.runtime.event", nodeId: "invented-node" }],
    }).events[0]?.type).toBe("not.a.runtime.event");
  });

  it("D2719 seals incomplete authorship and impossible import bounds as authoritative source truth", () => {
    const noAuthorship = constructLongitudinalSourceImage({
      runPrefix: modeledPrefix(),
      ownerLearnerId: "learner",
      moveAuthorship: [],
      importedMainlinePlies: 999,
      structureAttribution: "single_player",
    });

    expect(noAuthorship.moveAuthorship).toEqual([]);
    expect(noAuthorship.importedMainlinePlies).toBe(999);
    expect(sourceDigestV3(noAuthorship)).toMatch(/^sha256:[0-9a-f]{64}$/u);
  });

  it("D2720 accepts comment text as the complete production transaction population", () => {
    const commentsOnly = LONGITUDINAL_SOURCE_MUTATION_OPERATIONS
      .map((row) => `// longitudinalSourceMutation({ symbol: "${row.symbol}", effect: "${row.effect}" })`)
      .join("\n");

    expect(compileSourceMutationOperations(commentsOnly)).toHaveLength(11);
    expect(commentsOnly).not.toMatch(/^[^/]*longitudinalSourceMutation/gmu);
  });

  it("D2721 calls an expired, wrong-cut, wrong-revision receipt current", () => {
    const source = image();
    const current = Object.freeze({
      ...runningJob(source),
      requestedSeq: 3,
      derivedRev: 2,
    }) satisfies DurableLongitudinalJob;

    expect(() => assertCurrentClaim(current, {
      runId: "run",
      learnerId: "learner",
      generation: 4,
      token: "token",
      worker: "worker",
      sourceDigest: sourceDigestV3(source),
    })).not.toThrow();
  });

  it("D2722 invalidates a job from a sealed image belonging to a different run", () => {
    const prior = image("source-run");
    const next = constructLongitudinalSourceImage({
      runPrefix: modeledPrefix("source-run"),
      ownerLearnerId: "learner",
      moveAuthorship: [{ eventSeq: 2, nodeId: "node-1", learnerId: "learner" }],
      importedMainlinePlies: null,
      structureAttribution: "unattributable_shared",
    });
    const crossed = Object.freeze({
      ...runningJob(prior, "different-job-run"),
      learnerId: "different-job-owner",
    }) satisfies DurableLongitudinalJob;

    expect(invalidateForSourceImage(crossed, prior, next)).toMatchObject({
      runId: "different-job-run",
      learnerId: "different-job-owner",
      requestedSourceDigest: sourceDigestV3(next),
      state: "pending",
    });
  });

  it("binds every reproduced boundary to the current RFC promise", () => {
    const rfc = readFileSync("rfc/longitudinal-store.md", "utf8");
    expect(rfc).toMatch(/exact closed `\{runId,ownerLearnerId,requestedSeq,events\}` result of the\s+shipped `readBackReplay` authority/u);
    expect(rfc).toMatch(/one authorship row for every prefix user commit/u);
    expect(rfc).toMatch(/descriptor calls the\s+watermark update inside the same database transaction/u);
    expect(rfc).toMatch(/full ownership\/source-digest CAS/u);
    expect(rfc).toMatch(/raw\/spread\/crossed/u);
  });
});
