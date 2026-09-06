import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import {
  batchRequestDigest,
  jobRequestDigest,
  parseEvidenceBatchRequest,
  parseRunSnapshot,
} from "../d2587-pack-capability-twelfth-author-repair/model.mjs";
import {
  acquireRunLease,
  applyStoredEvidenceAndConsumeJob,
  loadJobLease,
  parseStoredSuccess,
  replayStoredBatch,
  settleEvidenceJob,
} from "./model.mjs";

// Repointed 2026-09-06: the durable evidence-job model, the operation census and criteria
// 20-30 were cut out of rfc/pack-capability-contract.md byte-for-byte into the successor
// draft; the review narrative moved to review-history.md. This reproducer asserts nothing
// new -- it reads the same bytes in their new homes.
const rfc = readFileSync("planning/pack-capability-contract/evidence-job-durability.md", "utf8") + readFileSync("planning/pack-capability-contract/review-history.md", "utf8");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n## §3\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const fen = "8/8/8/8/8/8/8/K6k w - - 0 1";

function request(nodeId = "node-a") {
  return {
    schema: "evidence_job_request@1", runId: "run-a", nodeId, fen, kind: "eval",
    depth: 12, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null,
  };
}

function settlement() {
  return {
    kind: "success",
    payload: { kind: "eval", source: "engine_validated", values: { cp: 10 } },
    objectiveProposal: null,
    acquisition: {
      operation: "stockfish.position_evaluation@1",
      provider: "stockfish",
      endpoint: "uci:stockfish",
      requestedIdentity: { id: "stockfish", version: "18" },
      actualIdentity: { id: "stockfish", version: "18" },
      generation: 3,
      requestedAt: "2026-09-04T20:00:00Z",
      retrievedAt: "2026-09-04T20:00:01Z",
      normalizedRequestDigest: `sha256:${"a".repeat(64)}`,
      responseDigest: `sha256:${"b".repeat(64)}`,
    },
  };
}

function database(feedbackPolicy = "immediate_guard", nodeId = "node-a") {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  db.exec(ddl);
  db.exec("CREATE TABLE evidence_run_images (run_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,run_json TEXT NOT NULL) STRICT;");
  db.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
  const run = parseRunSnapshot({ runId: "run-a", revision: 4, feedbackPolicy, nodes: [{ id: "node-a", fen }], events: [] });
  db.prepare("INSERT INTO evidence_run_images(run_id,revision,run_json) VALUES (?,?,?)").run("run-a", 4, JSON.stringify(run));
  const parsedBatch = parseEvidenceBatchRequest({ schema: "evidence_batch_request@1", runId: "run-a", origin: "explicit_analysis", jobs: [request(nodeId)] });
  const parsedJob = parsedBatch.jobs[0];
  db.prepare(`INSERT INTO evidence_job_batches
    (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?)`).run("batch-a", "run-a", "explicit_analysis", "key", JSON.stringify(parsedBatch), batchRequestDigest(parsedBatch), 1, "now");
  db.prepare(`INSERT INTO evidence_jobs
    (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
     job_request_digest,request_json,state,attempt_count,admitted_at,lease_owner,lease_expires_at,lease_generation)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      "job-a", "batch-a", 0, "run-a", nodeId, "explicit_analysis", "runtime.analysis",
      "evidence.stockfish_analysis", jobRequestDigest(parsedJob), JSON.stringify(parsedJob), "running", 1,
      "now", "worker-a", "later", 7,
    );
  return { db, run };
}

test("D2673 guard output is invoked internally and cannot be supplied by the caller", () => {
  const { db } = database();
  const jobLease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  settleEvidenceJob(db, { lease: jobLease, settlement: settlement() });
  const runLease = acquireRunLease(db, { runId: "run-a", owner: "writer-a" });
  assert.throws(() => applyStoredEvidenceAndConsumeJob(db, { runLease, jobId: "job-a", emitted: [{ type: "forged" }] }), /apply-input:shape/u);
  const result = applyStoredEvidenceAndConsumeJob(db, { runLease, jobId: "job-a" });
  assert.deepEqual(result.afterRun.events.map((event) => event.type), ["evidence.attached", "feedback.generated"]);
  assert.equal(result.afterRun.events[1].data.message, "registered guard result");
  db.close();
});

test("D2674 stored job node and FEN must join the CAS-owned run", () => {
  const { db } = database("attempt_end", "node-never-in-run");
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  settleEvidenceJob(db, { lease, settlement: settlement() });
  const runLease = acquireRunLease(db, { runId: "run-a", owner: "writer-a" });
  assert.throws(() => applyStoredEvidenceAndConsumeJob(db, { runLease, jobId: "job-a" }), /apply:node-join/u);
  assert.equal(db.prepare("SELECT state FROM evidence_jobs WHERE id='job-a'").get().state, "settled_success");
  assert.equal(db.prepare("SELECT revision FROM evidence_run_images WHERE run_id='run-a'").get().revision, 4);
  db.close();
});

test("D2675/D2676 settlement requires exact success plus sealed lease CAS and clears the lease", () => {
  const { db } = database("attempt_end");
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  assert.throws(() => parseStoredSuccess({ ...settlement(), payload: { kind: "eval", values: { cp: 10 } } }), /payload:shape/u);
  assert.throws(() => settleEvidenceJob(db, { lease: { ...lease }, settlement: settlement() }), /settle:lease/u);
  assert.equal(settleEvidenceJob(db, { lease, settlement: settlement() }), 1);
  const row = db.prepare("SELECT state,result_seq,lease_owner,lease_expires_at FROM evidence_jobs WHERE id='job-a'").get();
  assert.deepEqual({ ...row }, { state: "settled_success", result_seq: 1, lease_owner: null, lease_expires_at: null });
  assert.throws(() => settleEvidenceJob(db, { lease, settlement: settlement() }), /settle:cas/u);
  db.close();
});

test("D2677 replay validates every persisted child before returning ids", () => {
  const { db, run } = database("attempt_end");
  assert.deepEqual(replayStoredBatch(db, { batchId: "batch-a", runSnapshot: run }).jobIds, ["job-a"]);
  db.prepare("UPDATE evidence_jobs SET request_json='{}',job_request_digest='forged' WHERE id='job-a'").run();
  assert.throws(() => replayStoredBatch(db, { batchId: "batch-a", runSnapshot: run }), /job request.*shape|unknown or missing keys/u);
  db.close();
});

test("apply, consume and response-loss replay are one validated transaction result", () => {
  const { db } = database("attempt_end");
  settleEvidenceJob(db, { lease: loadJobLease(db, { jobId: "job-a", owner: "worker-a" }), settlement: settlement() });
  const first = applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-a" }), jobId: "job-a" });
  assert.equal(first.replay, false);
  assert.equal(db.prepare("SELECT state FROM evidence_jobs WHERE id='job-a'").get().state, "consumed");
  const replay = applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }), jobId: "job-a" });
  assert.equal(replay.replay, true);
  assert.deepEqual(replay.receipt, first.receipt);
  db.prepare("UPDATE evidence_jobs SET application_receipt_json='{}' WHERE id='job-a'").run();
  assert.throws(() => applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-c" }), jobId: "job-a" }), /receipt:shape/u);
  db.close();
});

test("the thirteenth repair retains the twelfth fresh-review target", () => {
  assert.match(readFileSync("Makefile", "utf8"), /pack-capability-thirteenth-author-repair: pack-capability-twelfth-fresh-review/u);
  for (const id of ["D2673", "D2674", "D2675", "D2676", "D2677"]) assert.match(rfc, new RegExp(`\\[\\[${id}\\]\\]`, "u"));
});
