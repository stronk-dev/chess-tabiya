// Disposable ninth fresh-review instrument for D2542-D2547. Green reproduces blockers.
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");
const authorTest = read("tools/d2524-pack-capability-ninth-author-repair/contract.test.mjs");
const authority = JSON.parse(read("tools/d2524-pack-capability-ninth-author-repair/admission-authority.json"));
const queueSection = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n### §6\./u)?.[1] ?? "";
const ddl = queueSection.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  db.exec(ddl);
  db.exec("INSERT INTO drill_runs(id) VALUES ('run-a'), ('run-b')");
  return db;
}

function insertBatch(db) {
  db.prepare(`INSERT INTO evidence_job_batches
    (id, run_id, origin, idempotency_key, request_digest, admitted_at)
    VALUES (?, ?, ?, ?, ?, ?)`)
    .run("batch-a", "run-a", "explicit_analysis", "key-a", "digest-a", "2026-09-02T12:00:00Z");
}

function insertJob(db, overrides = {}) {
  const row = {
    id: "job-a", batchId: "batch-a", ordinal: 0, runId: "run-a", nodeId: "node-a",
    origin: "explicit_analysis", consumer: "runtime.analysis",
    operation: "evidence.stockfish_analysis", jobDigest: "job-digest", request: "{}",
    state: "admitted", attemptCount: 0, admittedAt: "2026-09-02T12:00:00Z",
    resultSeq: null, settlement: null, consumedAt: null,
    ...overrides,
  };
  db.prepare(`INSERT INTO evidence_jobs
    (id, batch_id, batch_ordinal, run_id, node_id, origin, consumer_id,
     provider_operation_id, job_request_digest, request_json, state, attempt_count,
     admitted_at, result_seq, settlement_json, consumed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(row.id, row.batchId, row.ordinal, row.runId, row.nodeId, row.origin, row.consumer,
      row.operation, row.jobDigest, row.request, row.state, row.attemptCount, row.admittedAt,
      row.resultSeq, row.settlement, row.consumedAt);
}

test("D2542: DDL accepts a job whose run and origin disagree with its parent batch", () => {
  const db = database();
  insertBatch(db);
  assert.doesNotThrow(() => insertJob(db, {
    runId: "run-b", origin: "story_completion", consumer: "review.story_evidence",
  }));
  const row = db.prepare(`SELECT b.run_id AS batch_run, b.origin AS batch_origin,
    j.run_id AS job_run, j.origin AS job_origin
    FROM evidence_jobs j JOIN evidence_job_batches b ON b.id=j.batch_id`).get();
  assert.deepEqual({ ...row }, {
    batch_run: "run-a", batch_origin: "explicit_analysis",
    job_run: "run-b", job_origin: "story_completion",
  });
});

test("D2543: the promised lease generation has no durable field", () => {
  assert.match(queueSection, /lease, generation, job request digest/u);
  assert.doesNotMatch(ddl, /lease_(?:generation|token)|generation INTEGER/u);
  const beforeExpiry = { state: "running", leaseOwner: "worker-a" };
  const afterSameOwnerReclaim = { state: "running", leaseOwner: "worker-a" };
  assert.deepEqual(beforeExpiry, afterSameOwnerReclaim);
});

test("D2544: request digests have no exact canonical preimage", () => {
  assert.match(queueSection, /both canonical job and batch\s+digests are rechecked/u);
  assert.doesNotMatch(queueSection, /(?:job|batch)RequestV1|requestDigestPreimage|canonicalRequestBytes/u);
  const left = JSON.stringify({ nodeId: "node-a", kind: "eval" });
  const right = JSON.stringify({ kind: "eval", nodeId: "node-a" });
  assert.notEqual(crypto.createHash("sha256").update(left).digest("hex"),
    crypto.createHash("sha256").update(right).digest("hex"));
});

test("D2545: same-key concurrency and batch identity are not in the author authority", () => {
  assert.equal(authority.jobId.constructor, "crypto.randomUUID");
  assert.equal(authority.batchId, undefined);
  assert.doesNotMatch(authorTest, /Promise\.all|worker_threads|DatabaseSync|two.connection|concurrent/u);
  const admission = queueSection.match(/#### Admission identity and replay([\s\S]*?)#### The one run\/job transaction owner/u)?.[1] ?? "";
  assert.doesNotMatch(admission, /ON CONFLICT|BEGIN IMMEDIATE|constraint loser|re-read after/u);
});

test("D2546: rewind cancellation uses two state names absent from the durable union", () => {
  assert.match(queueSection, /pruned-node pending\/running\/staged jobs/u);
  const states = ddl.match(/state IN\s*\(([\s\S]*?)\)\)/u)?.[1] ?? "";
  assert.doesNotMatch(states, /pending|staged/u);
  assert.match(states, /settled_success/u);
  assert.doesNotMatch(queueSection, /settled_success[^\n]{0,120}rewind|rewind[^\n]{0,120}settled_success/u);
});

test("D2547: DDL accepts a consumed job without an application receipt", () => {
  assert.doesNotMatch(ddl, /applied_(?:revision|event|digest)|event_(?:start|end)_seq/u);
  const db = database();
  insertBatch(db);
  assert.doesNotThrow(() => insertJob(db, {
    state: "consumed",
    resultSeq: 1,
    settlement: JSON.stringify({ kind: "success", payload: {}, objectiveProposal: null, acquisition: {} }),
    consumedAt: "2026-09-02T12:01:00Z",
  }));
  assert.equal(db.prepare("SELECT state FROM evidence_jobs WHERE id='job-a'").get().state, "consumed");
  assert.match(rfc, /unattached consumed\s+rows/u);
});
