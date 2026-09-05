import { readFileSync } from "node:fs";

import { commitMove, createRun, type DrillRun } from "../../packages/runtime/src/index.js";
import { describe, expect, it } from "vitest";

import { LONGITUDINAL_SOURCE_MUTATION_OPERATIONS, type DurableLongitudinalJob } from "../d2598-longitudinal-seventh-author-repair/contract.js";
import {
  LockedLongitudinalSourceStore,
  assertCurrentClaim,
  compileSourceMutationTransactions,
  invalidateForSourceImage,
  sourceDigestV4,
  type CompleteClaimReceipt,
  type LockedSourceRecord,
  type LongitudinalSourceImageV4,
} from "../d2718-longitudinal-eighth-author-repair/contract.js";

const at = "2026-09-05T00:00:00.000Z";
const digest = `sha256:${"a".repeat(64)}` as const;

function run(): DrillRun {
  const created = createRun({
    id: "review-run",
    session: {
      kind: "position",
      start: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", side: "white" },
      feedbackPolicy: "attempt_end",
      opponentPolicy: { mode: "human_common", targetElo: 1500 },
    },
    sessionDigest: digest,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
    seed: 1,
    createdAt: at,
  });
  return commitMove(created, "e2e4", { at }).run;
}

function record(value: DrillRun, overrides: Partial<LockedSourceRecord> = {}): LockedSourceRecord {
  return {
    run: value,
    ownerLearnerId: "learner",
    moveAuthorship: null,
    structureAttribution: "single_player",
    ...overrides,
  };
}

function image(store: LockedLongitudinalSourceStore, value: DrillRun): LongitudinalSourceImageV4 {
  return store.sourceImage(value.id, value.events.length);
}

function runningJob(source: LongitudinalSourceImageV4): DurableLongitudinalJob {
  return {
    runId: source.runPrefix.runId,
    learnerId: source.ownerLearnerId,
    requestedSeq: source.runPrefix.requestedSeq,
    requestedSourceDigest: sourceDigestV4(source),
    completedSeq: 0,
    derivedRev: 1,
    claimGeneration: 4,
    retryCount: 0,
    state: "running",
    claimedRequestedSeq: source.runPrefix.requestedSeq,
    claimedSourceDigest: sourceDigestV4(source),
    claimToken: "token",
    claimedBy: "worker",
    leaseExpiresAt: "2000-01-01T01:00:00.000Z",
    nextAttemptAt: null,
    failureCode: null,
  };
}

function receipt(source: LongitudinalSourceImageV4): CompleteClaimReceipt {
  return {
    runId: source.runPrefix.runId,
    learnerId: source.ownerLearnerId,
    claimedRequestedSeq: source.runPrefix.requestedSeq,
    claimedSourceDigest: sourceDigestV4(source),
    derivedRev: 1,
    generation: 4,
    token: "token",
    worker: "worker",
  };
}

function unreachableStorageSource(): string {
  const methods = LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.map((row) => {
    const method = row.symbol.slice("SQLiteRunStorage#".length);
    return `${method}() {
      this.#database.exec("BEGIN IMMEDIATE");
      if (false) this.#upsertLongitudinalWatermark({ symbol: "${row.symbol}", effect: "${row.effect}" });
      return;
      this.#database.exec("COMMIT");
    }`;
  });
  return `class SQLiteRunStorage { ${methods.join("\n")} }`;
}

describe("longitudinal-store eighth fresh independent review", () => {
  it("D2779 and D2780 let a caller invent the storage record, owner and absence of collaboration", () => {
    const replayed = JSON.parse(JSON.stringify(run())) as DrillRun;
    const invented = new LockedLongitudinalSourceStore([record(replayed, {
      ownerLearnerId: "attacker",
      moveAuthorship: null,
      structureAttribution: "single_player",
    })]);

    const source = image(invented, replayed);
    expect(source.ownerLearnerId).toBe("attacker");
    expect(source.moveAuthorship).toEqual([{
      eventSeq: 2,
      nodeId: "review-run:node:1",
      learnerId: "attacker",
    }]);
    expect(sourceDigestV4(source)).toMatch(/^sha256:[0-9a-f]{64}$/u);
  });

  it("D2781 accepts unreachable descriptors in caller-provided source while production has none", () => {
    expect(compileSourceMutationTransactions(unreachableStorageSource())).toHaveLength(11);

    const production = readFileSync("apps/server/src/storage.ts", "utf8");
    expect(production).not.toContain("#upsertLongitudinalWatermark");
    expect(production).not.toContain("longitudinalSourceImageV4");
  });

  it("D2782 accepts caller-authored invalid running residue under a caller-authored historical clock", () => {
    const value = run();
    const source = image(new LockedLongitudinalSourceStore([record(value)]), value);
    const invalid = {
      ...runningJob(source),
      completedSeq: 999,
      retryCount: -1,
      nextAttemptAt: "2099-01-01T00:00:00.000Z",
      failureCode: "snapshot_invalid",
    } as unknown as DurableLongitudinalJob;
    const copiedReceipt = JSON.parse(JSON.stringify(receipt(source))) as CompleteClaimReceipt;

    expect(Date.now()).toBeGreaterThan(Date.parse("2000-01-01T01:00:00.000Z"));
    expect(() => assertCurrentClaim(invalid, copiedReceipt, source, "1999-01-01T00:00:00.000Z")).not.toThrow();
  });

  it("D2783 invalidates a structural job without a database mutation, lock or compare-and-swap", () => {
    const value = run();
    const prior = image(new LockedLongitudinalSourceStore([record(value)]), value);
    const next = image(new LockedLongitudinalSourceStore([record(value, {
      moveAuthorship: [{ eventSeq: 2, nodeId: "review-run:node:1", learnerId: "learner" }],
      structureAttribution: "unattributable_shared",
    })]), value);
    const copiedJob = JSON.parse(JSON.stringify(runningJob(prior))) as DurableLongitudinalJob;

    expect(invalidateForSourceImage(copiedJob, prior, next)).toMatchObject({
      state: "pending",
      claimGeneration: 5,
      requestedSourceDigest: sourceDigestV4(next),
    });
  });

  it("D2784 allows an equal source image from another store authority to satisfy a claim", () => {
    const value = run();
    const sourceA = image(new LockedLongitudinalSourceStore([record(value)]), value);
    const sourceB = image(new LockedLongitudinalSourceStore([record(value)]), value);

    expect(sourceA).not.toBe(sourceB);
    expect(sourceDigestV4(sourceA)).toBe(sourceDigestV4(sourceB));
    expect(() => assertCurrentClaim(runningJob(sourceA), receipt(sourceA), sourceB, "1999-01-01T00:00:00.000Z")).not.toThrow();
  });
});
