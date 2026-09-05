import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { commitMove, createRun, type DrillRun } from "../../packages/runtime/src/index.js";
import { afterEach, describe, expect, it } from "vitest";

import { LONGITUDINAL_SOURCE_MUTATION_OPERATIONS } from "../d2598-longitudinal-seventh-author-repair/contract.js";
import type { LockedSourceRecord } from "../d2718-longitudinal-eighth-author-repair/contract.js";
import { LongitudinalContractStore, parseDurableJobRow } from "./contract.js";

const roots: string[] = [];
const digest = `sha256:${"a".repeat(64)}` as const;
const at = "2026-09-05T00:00:00.000Z";

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function path(name = "longitudinal.sqlite"): string {
  const root = mkdtempSync(join(tmpdir(), "tabiya-longitudinal-ninth-"));
  roots.push(root);
  return join(root, name);
}

function run(id = "run"): DrillRun {
  const created = createRun({
    id,
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
  return { run: value, ownerLearnerId: "learner", moveAuthorship: null, structureAttribution: "single_player", ...overrides };
}

describe("longitudinal-store ninth author repair", () => {
  it("D2779/D2780 reads source, owner and journal absence only from one SQLite authority", () => {
    const file = path();
    const store = new LongitudinalContractStore(file);
    const value = run();
    store.seedSourceFixture(record(value), false);

    const source = store.sourceImage(value.id, value.events.length);
    expect(source.runPrefix.ownerLearnerId).toBe("learner");
    expect(source.moveAuthorship).toEqual([{ eventSeq: 2, nodeId: "run:node:1", learnerId: "learner" }]);
    expect(() => store.sourceImage(value.id, value.events.length + 1)).toThrow(/SOURCE_CUT_INVALID/u);

    store.seedSourceFixture(record(value, { moveAuthorship: [] }), true);
    expect(() => store.sourceImage(value.id, value.events.length)).toThrow(/AUTHORSHIP_POPULATION_MISMATCH/u);
    store.seedSourceFixture(record(value, {
      moveAuthorship: [{ eventSeq: 2, nodeId: "run:node:1", learnerId: "other" }],
      structureAttribution: "single_player",
    }), true);
    expect(() => store.sourceImage(value.id, value.events.length)).toThrow(/STRUCTURE_AUTHORSHIP_CONTRADICTION/u);
    store.close();
  });

  it("D2781 executes the closed mutation population and rollback cannot leave a receipt", () => {
    const store = new LongitudinalContractStore(path());
    store.seedSourceFixture(record(run()), false);
    for (const operation of LONGITUDINAL_SOURCE_MUTATION_OPERATIONS) store.recordSourceMutation(operation.symbol, "run");
    expect(store.mutationReceipts()).toEqual([...LONGITUDINAL_SOURCE_MUTATION_OPERATIONS].sort((left, right) => left.symbol.localeCompare(right.symbol)));
    expect(() => store.recordSourceMutation("SQLiteRunStorage#create", "run", true)).toThrow(/INJECTED_FAILURE/u);
    expect(store.mutationReceipts()).toHaveLength(11);
    expect(() => store.recordSourceMutation("SQLiteRunStorage#create", "missing")).toThrow(/SOURCE_RUN_UNKNOWN/u);
    store.close();
  });

  it("D2782 parses every job field, observes SQLite time and refuses a copied claim", () => {
    const file = path();
    const store = new LongitudinalContractStore(file);
    const value = run();
    store.seedSourceFixture(record(value), false);
    store.requestJob(value.id, "learner", value.events.length, 1);
    const claim = store.claimJob(value.id, "learner", "worker");
    expect(() => store.assertCurrentClaim(claim)).not.toThrow();
    expect(() => store.assertCurrentClaim(structuredClone(claim))).toThrow(/WRONG_DATABASE/u);

    const corrupt = new DatabaseSync(file);
    corrupt.prepare("UPDATE longitudinal_jobs SET lease_expires_at=? WHERE run_id=?").run("2099-01-01T00:00:00.000Z", value.id);
    expect(() => store.assertCurrentClaim(claim)).toThrow(/STALE_CLAIM/u);
    corrupt.prepare("UPDATE longitudinal_jobs SET lease_expires_at=? WHERE run_id=?").run("2000-01-01T00:00:00.000Z", value.id);
    corrupt.close();
    expect(() => store.assertCurrentClaim(claim)).toThrow(/STALE_CLAIM/u);
    expect(() => parseDurableJobRow({ ...store.readJob(value.id, "learner"), retryCount: -1 })).toThrow(/JOB_ROW_INVALID/u);
    store.close();
  });

  it("D2785 parses all five job states with exact state-specific fields", () => {
    const base = {
      runId: "run", learnerId: "learner", requestedSeq: 2,
      requestedSourceDigest: `sha256:${"b".repeat(64)}`, completedSeq: 0,
      derivedRev: 1, claimGeneration: 1, retryCount: 0,
      claimedRequestedSeq: null, claimedSourceDigest: null, claimToken: null, claimedBy: null,
      leaseExpiresAt: null, nextAttemptAt: null, failureCode: null,
    } as const;
    expect(parseDurableJobRow({ ...base, state: "pending" }).state).toBe("pending");
    expect(parseDurableJobRow({ ...base, state: "complete", completedSeq: 2 }).state).toBe("complete");
    expect(parseDurableJobRow({ ...base, state: "retry_wait", nextAttemptAt: "2026-09-05T01:00:00.000Z", failureCode: "derivation_failed" }).state).toBe("retry_wait");
    expect(parseDurableJobRow({ ...base, state: "quarantined", failureCode: "snapshot_invalid" }).state).toBe("quarantined");
    expect(parseDurableJobRow({
      ...base, state: "running", claimedRequestedSeq: 2,
      claimedSourceDigest: base.requestedSourceDigest, claimToken: "token", claimedBy: "worker",
      leaseExpiresAt: "2026-09-05T01:00:00.000Z",
    }).state).toBe("running");
    expect(() => parseDurableJobRow({ ...base, state: "retry_wait", failureCode: "derivation_failed" })).toThrow(/JOB_ROW_INVALID/u);
  });

  it("D2786 reloads current source truth before accepting a live claim", () => {
    const store = new LongitudinalContractStore(path());
    const value = run();
    store.seedSourceFixture(record(value), false);
    store.requestJob(value.id, "learner", value.events.length, 1);
    const claim = store.claimJob(value.id, "learner", "worker");
    store.seedSourceFixture(record(value, {
      moveAuthorship: [{ eventSeq: 2, nodeId: "run:node:1", learnerId: "learner" }],
      structureAttribution: "unattributable_shared",
    }), true);
    expect(() => store.assertCurrentClaim(claim)).toThrow(/STALE_CLAIM/u);
    store.close();
  });

  it("D2788 refuses to acquire an old source digest after durable source truth changes", () => {
    const store = new LongitudinalContractStore(path());
    const value = run();
    store.seedSourceFixture(record(value), false);
    store.requestJob(value.id, "learner", value.events.length, 1);
    store.seedSourceFixture(record(value, {
      moveAuthorship: [{ eventSeq: 2, nodeId: "run:node:1", learnerId: "learner" }],
      structureAttribution: "unattributable_shared",
    }), true);
    expect(() => store.claimJob(value.id, "learner", "worker")).toThrow(/CLAIM_SOURCE_CHANGED/u);
    store.close();
  });

  it("D2783 invalidates by durable CAS, survives restart, is idempotent and fences the old claim", () => {
    const file = path();
    const first = new LongitudinalContractStore(file);
    const value = run();
    first.seedSourceFixture(record(value), false);
    first.requestJob(value.id, "learner", value.events.length, 1);
    const oldClaim = first.claimJob(value.id, "learner", "worker");

    first.seedSourceFixture(record(value, {
      moveAuthorship: [{ eventSeq: 2, nodeId: "run:node:1", learnerId: "learner" }],
      structureAttribution: "unattributable_shared",
    }), true);
    const invalidated = first.invalidateForCurrentSource(value.id, "learner", value.events.length);
    expect(invalidated).toMatchObject({ state: "pending", claimGeneration: oldClaim.generation + 1 });
    expect(() => first.assertCurrentClaim(oldClaim)).toThrow(/STALE_CLAIM/u);
    expect(first.invalidateForCurrentSource(value.id, "learner", value.events.length)).toEqual(invalidated);
    first.close();

    const reopened = new LongitudinalContractStore(file);
    expect(reopened.readJob(value.id, "learner")).toEqual(invalidated);
    reopened.close();
  });

  it("D2784 refuses source and claim capabilities issued by an equal independent database", () => {
    const value = run();
    const storeA = new LongitudinalContractStore(path("a.sqlite"));
    const storeB = new LongitudinalContractStore(path("b.sqlite"));
    for (const store of [storeA, storeB]) {
      store.seedSourceFixture(record(value), false);
      store.requestJob(value.id, "learner", value.events.length, 1);
    }
    const sourceA = storeA.sourceImage(value.id, value.events.length);
    const sourceB = storeB.sourceImage(value.id, value.events.length);
    const claimA = storeA.claimJob(value.id, "learner", "worker");
    const claimB = storeB.claimJob(value.id, "learner", "worker");

    expect(storeA.sourceDigest(sourceA)).toBe(storeB.sourceDigest(sourceB));
    expect(() => storeA.sourceDigest(sourceB)).toThrow(/WRONG_DATABASE/u);
    expect(() => storeA.assertCurrentClaim(claimB)).toThrow(/WRONG_DATABASE/u);
    expect(() => storeA.assertCurrentClaim(claimA)).not.toThrow();
    storeA.close();
    storeB.close();
  });
});
