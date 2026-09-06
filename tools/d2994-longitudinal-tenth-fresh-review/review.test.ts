import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { canonicalizeJson } from "../../packages/schema/src/drill-pack/digest.js";
import { commitMove, createRun, type DrillRun } from "../../packages/runtime/src/index.js";
import { afterEach, describe, expect, it } from "vitest";

import { LONGITUDINAL_SOURCE_MUTATION_OPERATIONS } from "../d2598-longitudinal-seventh-author-repair/contract.js";
import type { LockedSourceRecord } from "../d2718-longitudinal-eighth-author-repair/contract.js";
import {
  LongitudinalContractStore,
  parseDurableJobRow,
} from "../d2779-longitudinal-ninth-author-repair/contract.js";

const roots: string[] = [];
const sessionDigest = `sha256:${"a".repeat(64)}` as const;
const at = "2026-09-06T00:00:00.000Z";

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function databasePath(name = "longitudinal.sqlite"): string {
  const root = mkdtempSync(join(tmpdir(), "tabiya-longitudinal-tenth-review-"));
  roots.push(root);
  return join(root, name);
}

function run(id = "review-run"): DrillRun {
  const created = createRun({
    id,
    session: {
      kind: "position",
      start: {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        side: "white",
      },
      feedbackPolicy: "attempt_end",
      opponentPolicy: { mode: "human_common", targetElo: 1500 },
    },
    sessionDigest,
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

const baseJob = {
  runId: "run",
  learnerId: "learner",
  requestedSeq: 2,
  requestedSourceDigest: `sha256:${"b".repeat(64)}`,
  completedSeq: 0,
  derivedRev: 1,
  claimGeneration: 1,
  retryCount: 0,
  claimedRequestedSeq: null,
  claimedSourceDigest: null,
  claimToken: null,
  claimedBy: null,
  leaseExpiresAt: null,
  nextAttemptAt: null,
  failureCode: null,
} as const;

describe("D2994-D3001 longitudinal-store tenth fresh independent review", () => {
  it("D2994 all eleven source mutations leave source and job state byte-identical", () => {
    const store = new LongitudinalContractStore(databasePath());
    const value = run();
    store.seedSourceFixture(record(value), false);
    const beforeSource = store.sourceDigest(store.sourceImage(value.id, value.events.length));
    const beforeJob = store.requestJob(value.id, "learner", value.events.length, 1);

    for (const operation of LONGITUDINAL_SOURCE_MUTATION_OPERATIONS) {
      store.recordSourceMutation(operation.symbol, value.id);
    }

    expect(store.sourceDigest(store.sourceImage(value.id, value.events.length))).toBe(beforeSource);
    expect(store.readJob(value.id, "learner")).toEqual(beforeJob);
    expect(store.mutationReceipts()).toHaveLength(11);
    store.close();
  });

  it("D2995 an identical request cancels a healthy live claim", () => {
    const store = new LongitudinalContractStore(databasePath());
    const value = run();
    store.seedSourceFixture(record(value), false);
    store.requestJob(value.id, "learner", value.events.length, 1);
    const claim = store.claimJob(value.id, "learner", "worker");

    const duplicate = store.requestJob(value.id, "learner", value.events.length, 1);
    expect(duplicate).toMatchObject({ state: "pending", claimGeneration: claim.generation + 1 });
    expect(() => store.assertCurrentClaim(claim)).toThrow(/STALE_CLAIM/u);
    store.close();
  });

  it("D2996 caller-selected invalidation regresses the durable high-water mark", () => {
    const store = new LongitudinalContractStore(databasePath());
    const value = run();
    store.seedSourceFixture(record(value), false);
    expect(store.requestJob(value.id, "learner", value.events.length, 1).requestedSeq).toBe(2);

    expect(store.invalidateForCurrentSource(value.id, "learner", 1)).toMatchObject({
      requestedSeq: 1,
      completedSeq: 0,
      state: "pending",
    });
    store.close();
  });

  it("D2997 the exact parser admits impossible completion and failure-budget states", () => {
    expect(parseDurableJobRow({ ...baseJob, state: "pending", completedSeq: 1 })).toMatchObject({
      state: "pending",
      completedSeq: 1,
    });
    expect(parseDurableJobRow({
      ...baseJob,
      state: "retry_wait",
      failureCode: "snapshot_invalid",
      nextAttemptAt: "2026-09-06T00:01:00.000Z",
    })).toMatchObject({ state: "retry_wait", retryCount: 0, failureCode: "snapshot_invalid" });
    expect(parseDurableJobRow({
      ...baseJob,
      state: "quarantined",
      failureCode: "derivation_failed",
    })).toMatchObject({ state: "quarantined", retryCount: 0, failureCode: "derivation_failed" });
  });

  it("D2998 SQL admits partial claims and claimJob can commit an unreadable empty worker", () => {
    const firstPath = databasePath("partial.sqlite");
    const first = new LongitudinalContractStore(firstPath);
    const value = run("partial-run");
    first.seedSourceFixture(record(value), false);
    first.requestJob(value.id, "learner", value.events.length, 1);
    const writer = new DatabaseSync(firstPath);
    expect(() => writer.prepare(
      "UPDATE longitudinal_jobs SET claimed_by='worker' WHERE run_id=? AND learner_id=?",
    ).run(value.id, "learner")).not.toThrow();
    writer.close();
    expect(() => first.readJob(value.id, "learner")).toThrow(/JOB_ROW_INVALID/u);
    first.close();

    const second = new LongitudinalContractStore(databasePath("empty-worker.sqlite"));
    const other = run("empty-worker-run");
    second.seedSourceFixture(record(other), false);
    second.requestJob(other.id, "learner", other.events.length, 1);
    expect(second.claimJob(other.id, "learner", "")).toMatchObject({ worker: "" });
    expect(() => second.readJob(other.id, "learner")).toThrow(/JOB_ROW_INVALID/u);
    second.close();
  });

  it("D2999 due retries and expired running work are not claimable", () => {
    const retryPath = databasePath("retry.sqlite");
    const retryStore = new LongitudinalContractStore(retryPath);
    const retryRun = run("retry-run");
    retryStore.seedSourceFixture(record(retryRun), false);
    retryStore.requestJob(retryRun.id, "learner", retryRun.events.length, 1);
    const retryWriter = new DatabaseSync(retryPath);
    retryWriter.prepare(`UPDATE longitudinal_jobs SET state='retry_wait',retry_count=1,
      next_attempt_at='2000-01-01T00:00:00.000Z',failure_code='derivation_failed'
      WHERE run_id=? AND learner_id=?`).run(retryRun.id, "learner");
    retryWriter.close();
    expect(() => retryStore.claimJob(retryRun.id, "learner", "worker")).toThrow(/NOT_CLAIMABLE/u);
    retryStore.close();

    const expiredPath = databasePath("expired.sqlite");
    const expiredStore = new LongitudinalContractStore(expiredPath);
    const expiredRun = run("expired-run");
    expiredStore.seedSourceFixture(record(expiredRun), false);
    expiredStore.requestJob(expiredRun.id, "learner", expiredRun.events.length, 1);
    expiredStore.claimJob(expiredRun.id, "learner", "old-worker");
    const expiredWriter = new DatabaseSync(expiredPath);
    expiredWriter.prepare("UPDATE longitudinal_jobs SET lease_expires_at=? WHERE run_id=? AND learner_id=?")
      .run("2000-01-01T00:00:00.000Z", expiredRun.id, "learner");
    expiredWriter.close();
    expect(() => expiredStore.claimJob(expiredRun.id, "learner", "new-worker")).toThrow(/NOT_CLAIMABLE/u);
    expiredStore.close();
  });

  it("D3000 the required journal-less legacy source fails while the crossed arm passes", () => {
    const store = new LongitudinalContractStore(databasePath());
    const value = run();
    store.seedSourceFixture(record(value, { structureAttribution: "unattributable_legacy" }), false);
    expect(() => store.sourceImage(value.id, value.events.length)).toThrow(/AUTHORSHIP_AUTHORITY_MISSING/u);

    store.seedSourceFixture(record(value, {
      moveAuthorship: [{ eventSeq: 2, nodeId: `${value.id}:node:1`, learnerId: "learner" }],
      structureAttribution: "unattributable_legacy",
    }), true);
    expect(store.sourceImage(value.id, value.events.length).structureAttribution).toBe("unattributable_legacy");
    store.close();
  });

  it("D3001 the repair changes the normative source identity from v4 to undeclared v5", () => {
    const source = readFileSync("tools/d2779-longitudinal-ninth-author-repair/contract.ts", "utf8");
    expect(source).toMatch(/interface LongitudinalSourceImageV5/u);
    expect(source).toMatch(/tabiya\.longitudinal-source\.v5\\0/u);

    const value = { version: 5, runPrefix: { runId: "r" } };
    const hash = (version: 4 | 5): string => createHash("sha256")
      .update(`tabiya.longitudinal-source.v${version}\0`, "utf8")
      .update(canonicalizeJson(value), "utf8")
      .digest("hex");
    expect(hash(5)).not.toBe(hash(4));
  });
});
