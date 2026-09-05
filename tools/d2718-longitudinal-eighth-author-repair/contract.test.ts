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
} from "./contract.js";

const at = "2026-09-05T00:00:00.000Z";
const digest = `sha256:${"a".repeat(64)}` as const;

function run(kind: "position" | "imported" = "position"): DrillRun {
  const created = createRun({
    id: `${kind}-run`,
    session: {
      kind,
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

function image(value = run()): LongitudinalSourceImageV4 {
  return new LockedLongitudinalSourceStore([record(value)]).sourceImage(value.id, value.events.length);
}

function runningJob(source: LongitudinalSourceImageV4): DurableLongitudinalJob {
  return Object.freeze({
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
    leaseExpiresAt: "2026-09-05T01:00:00.000Z",
    nextAttemptAt: null,
    failureCode: null,
  });
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

function storageSource(): string {
  const methods = LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.map((row) => {
    const method = row.symbol.slice("SQLiteRunStorage#".length);
    return `${method}() { this.#database.exec("BEGIN IMMEDIATE"); this.#upsertLongitudinalWatermark({ symbol: "${row.symbol}", effect: "${row.effect}" }); this.#database.exec("COMMIT"); }`;
  });
  return `class SQLiteRunStorage { ${methods.join("\n")} }`;
}

describe("longitudinal-store eighth author repair", () => {
  it("D2718 consumes an actual replay-valid runtime prefix and seals no parallel event vocabulary", () => {
    const value = run();
    const sealed = image(value);
    expect(sealed.runPrefix.events).toEqual(value.events);
    expect(sealed.runPrefix.events[1]?.type).toBe("move.committed");
    expect(sealed.runPrefix.events[1]).toHaveProperty("data.node.id", `${value.id}:node:1`);
    expect(() => new LockedLongitudinalSourceStore([{ ...record(value), run: { ...value, events: [{ seq: 1, type: "invented", at, data: {} }] as never } }])).toThrow();
  });

  it("D2719 requires a complete exact authorship population and consistent single-player attribution", () => {
    const value = run();
    expect(() => new LockedLongitudinalSourceStore([record(value, { moveAuthorship: [] })]).sourceImage(value.id, value.events.length)).toThrow(/AUTHORSHIP_POPULATION_MISMATCH/u);
    expect(() => new LockedLongitudinalSourceStore([record(value, {
      moveAuthorship: [{ eventSeq: 2, nodeId: `${value.id}:node:1`, learnerId: "other" }],
    })]).sourceImage(value.id, value.events.length)).toThrow(/STRUCTURE_AUTHORSHIP_CONTRADICTION/u);
  });

  it("D2723 derives imported mainline length from the immutable replayed primary branch", () => {
    const imported = run("imported");
    const sealed = image(imported);
    expect(sealed.importedMainlinePlies).toBe(1);
    expect(image(run("position")).importedMainlinePlies).toBeNull();
  });

  it("D2720 derives exact descriptors from calls inside matching storage transactions", () => {
    expect(compileSourceMutationTransactions(storageSource())).toHaveLength(11);
    const commentsOnly = `class SQLiteRunStorage { placeholder() {} }\n${LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.map((row) => `// this.#upsertLongitudinalWatermark({ symbol: "${row.symbol}", effect: "${row.effect}" })`).join("\n")}`;
    expect(() => compileSourceMutationTransactions(commentsOnly)).toThrow(/OPERATION_MISMATCH/u);
    expect(() => compileSourceMutationTransactions(storageSource().replace('this.#database.exec("COMMIT");', 'this.#database.exec("ROLLBACK");'))).toThrow(/TRANSACTION_INVALID/u);
  });

  it("D2721 binds cut, revision, lease and current sealed owner/source truth", () => {
    const source = image();
    const job = runningJob(source);
    const claim = receipt(source);
    expect(() => assertCurrentClaim(job, claim, source, "2026-09-05T00:30:00.000Z")).not.toThrow();
    expect(() => assertCurrentClaim({ ...job, requestedSeq: job.requestedSeq + 1 }, claim, source, "2026-09-05T00:30:00.000Z")).toThrow(/STALE_CLAIM/u);
    expect(() => assertCurrentClaim({ ...job, derivedRev: 2 }, claim, source, "2026-09-05T00:30:00.000Z")).toThrow(/STALE_CLAIM/u);
    expect(() => assertCurrentClaim(job, claim, source, "2026-09-05T01:00:00.000Z")).toThrow(/STALE_CLAIM/u);
  });

  it("D2722 refuses a source image whose run or owner differs from the job subject", () => {
    const prior = image();
    const shared = new LockedLongitudinalSourceStore([record(run(), {
      moveAuthorship: [{ eventSeq: 2, nodeId: "position-run:node:1", learnerId: "learner" }],
      structureAttribution: "unattributable_shared",
    })]).sourceImage("position-run", 2);
    const crossedRun = { ...runningJob(prior), runId: "different" } satisfies DurableLongitudinalJob;
    const crossedOwner = { ...runningJob(prior), learnerId: "different" } satisfies DurableLongitudinalJob;
    expect(() => invalidateForSourceImage(crossedRun, prior, shared)).toThrow(/SUBJECT_MISMATCH/u);
    expect(() => invalidateForSourceImage(crossedOwner, prior, shared)).toThrow(/SUBJECT_MISMATCH/u);
    expect(invalidateForSourceImage(runningJob(prior), prior, shared)).toMatchObject({ state: "pending", claimGeneration: 5 });
  });
});
