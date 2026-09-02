// Disposable tenth author contract for D2542-D2547. It validates RFC bytes, not production.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { Worker } from "node:worker_threads";
import { applicationReceipt, batchRequestDigest, jobRequestDigest, rewindState } from "./model.mjs";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/pack-capability-contract.md");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n### §6\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const authority = JSON.parse(read("tools/d2524-pack-capability-ninth-author-repair/admission-authority.json"));

function prepare(path = ":memory:") {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  db.exec(ddl);
  db.exec("INSERT INTO drill_runs(id) VALUES ('run-a'),('run-b')");
  return db;
}

function jobRequest() {
  return { schema: "evidence_job_request@1", runId: "run-a", nodeId: "node-a", fen: "8/8/8/8/8/8/8/K6k w - - 0 1", kind: "eval", depth: null, movetime: 100, multiPv: null, timeoutMs: null, objectiveRequest: null };
}

function batchRequest(job = jobRequest()) {
  return { schema: "evidence_batch_request@1", runId: "run-a", origin: "explicit_analysis", jobs: [job] };
}

test("D2542: the composite parent identity rejects a crossed child", () => {
  const db = prepare();
  const job = jobRequest();
  const batch = batchRequest(job);
  db.prepare(`INSERT INTO evidence_job_batches
    (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?)`).run("batch-a", "run-a", "explicit_analysis", "key-a", JSON.stringify(batch), batchRequestDigest(batch), 1, "2026-09-02T12:00:00Z");
  assert.throws(() => db.prepare(`INSERT INTO evidence_jobs
    (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
     job_request_digest,request_json,state,attempt_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run("job-a", "batch-a", 0, "run-b", "node-a",
      "story_completion", "review.story_evidence", "evidence.stockfish_analysis",
      jobRequestDigest(job), JSON.stringify(job), "admitted", 0, "2026-09-02T12:00:00Z"), /FOREIGN KEY/u);
  db.close();
  assert.match(section, /child ordinals are exactly contiguous `0\.\.job_count-1`/u);
});

test("D2543: every reclaim changes the durable lease generation", () => {
  const db = prepare();
  const job = jobRequest();
  const batch = batchRequest(job);
  db.prepare(`INSERT INTO evidence_job_batches
    (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?)`).run("batch-a", "run-a", "explicit_analysis", "key-a", JSON.stringify(batch), batchRequestDigest(batch), 1, "2026-09-02T12:00:00Z");
  db.prepare(`INSERT INTO evidence_jobs
    (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
     job_request_digest,request_json,state,attempt_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run("job-a", "batch-a", 0, "run-a", "node-a",
      "explicit_analysis", "runtime.analysis", "evidence.stockfish_analysis",
      jobRequestDigest(job), JSON.stringify(job), "admitted", 0, "2026-09-02T12:00:00Z");
  const claim = () => db.prepare(`UPDATE evidence_jobs SET state='running', lease_owner='worker-a',
    lease_expires_at='later', lease_generation=lease_generation+1 WHERE id='job-a'
    RETURNING lease_generation`).get().lease_generation;
  assert.equal(claim(), 1);
  db.exec("UPDATE evidence_jobs SET state='retry_wait', lease_owner=NULL, lease_expires_at=NULL, next_attempt_at='now', retry_basis_json='{}' WHERE id='job-a'");
  assert.equal(claim(), 2);
  db.close();
});

test("D2544: exact prefixes make key order irrelevant and job/batch domains distinct", () => {
  const job = jobRequest();
  const reordered = { kind: job.kind, schema: job.schema, fen: job.fen, nodeId: job.nodeId, runId: job.runId, objectiveRequest: null, timeoutMs: null, multiPv: null, movetime: 100, depth: null };
  assert.equal(jobRequestDigest(job), jobRequestDigest(reordered));
  assert.notEqual(jobRequestDigest(job), batchRequestDigest(job));
  assert.match(section, /chess-tabiya\/evidence-job-request\/v1\\0/u);
});

test("D2545: two SQLite connections return one persisted batch id", async () => {
  assert.equal(authority.batchId.constructor, "crypto.randomUUID");
  assert.equal(authority.concurrentAdmission.transaction, "BEGIN IMMEDIATE");
  const directory = mkdtempSync(join(tmpdir(), "tabiya-f3-"));
  const path = join(directory, "race.sqlite");
  const db = prepare(path);
  db.close();
  const job = jobRequest();
  const batch = batchRequest(job);
  const gate = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
  const start = new Int32Array(gate);
  const launch = (candidate) => new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./concurrent-worker.mjs", import.meta.url), { workerData: {
      path, gate, candidate, request: JSON.stringify(batch), digest: batchRequestDigest(batch),
      jobRequest: JSON.stringify(job), jobDigest: jobRequestDigest(job),
    } });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
  try {
    const pending = [launch("batch-a"), launch("batch-b")];
    while (Atomics.load(start, 1) < 2) await new Promise((resolve) => setTimeout(resolve, 1));
    Atomics.store(start, 0, 1);
    Atomics.notify(start, 0, 2);
    const results = await Promise.all(pending);
    assert.equal(new Set(results.map((result) => result.id)).size, 1);
    assert.equal(results.filter((result) => result.winner).length, 1);
    const check = new DatabaseSync(path);
    assert.equal(check.prepare("SELECT count(*) AS n FROM evidence_job_batches").get().n, 1);
    assert.equal(check.prepare("SELECT count(*) AS n FROM evidence_jobs").get().n, 1);
    check.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("D2546: rewind defines every durable source state", () => {
  assert.deepEqual(Object.fromEntries([
    "admitted", "running", "retry_wait", "settled_success", "settled_empty",
    "settled_unavailable", "cancelled", "consumed",
  ].map((state) => [state, rewindState(state)])), {
    admitted: "cancelled", running: "cancelled", retry_wait: "cancelled",
    settled_success: "cancelled", settled_empty: "settled_empty",
    settled_unavailable: "settled_unavailable", cancelled: "cancelled", consumed: "consumed",
  });
  assert.doesNotMatch(section, /pending\/running\/staged/u);
});

test("D2547: application receipts bind a non-empty contiguous exact event range", () => {
  const events = [{ seq: 7, type: "evidence.attached" }, { seq: 8, type: "objective.state_changed" }];
  const receipt = applicationReceipt({ jobId: "job-a", runId: "run-a", nodeId: "node-a", fromRevision: 3, toRevision: 4, events });
  assert.deepEqual([receipt.firstEventSeq, receipt.lastEventSeq], [7, 8]);
  assert.match(receipt.eventDigest, /^sha256:[0-9a-f]{64}$/u);
  assert.throws(() => applicationReceipt({ jobId: "job-a", runId: "run-a", nodeId: "node-a", fromRevision: 3, toRevision: 4, events: [{ seq: 7 }, { seq: 9 }] }));
  assert.match(section, /missing, crossed or digest-mismatched range is corrupt storage/u);
});
