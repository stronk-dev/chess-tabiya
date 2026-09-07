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
} from "../d2673-pack-capability-thirteenth-author-repair/model.mjs";

// Repointed 2026-09-06: the durable evidence-job model, the operation census and criteria
// 20-30 were cut out of rfc/pack-capability-contract.md byte-for-byte into the successor
// draft; the review narrative moved to review-history.md. This reproducer asserts nothing
// new -- it reads the same bytes in their new homes.
const rfc = readFileSync("rfc/evidence-job-durability.md", "utf8") + readFileSync("planning/pack-capability-contract/review-history.md", "utf8");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n## §3\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const fen = "8/8/8/8/8/8/8/K6k w - - 0 1";

function request() {
  return {
    schema: "evidence_job_request@1", runId: "run-a", nodeId: "node-a", fen, kind: "eval",
    depth: 12, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null,
  };
}

function success() {
  return {
    kind: "success",
    payload: { kind: "eval", source: "engine_validated", values: { cp: 10 } },
    objectiveProposal: null,
    acquisition: {
      operation: "stockfish.position_evaluation@1", provider: "stockfish", endpoint: "uci:stockfish",
      requestedIdentity: { id: "stockfish", version: "18" }, actualIdentity: { id: "stockfish", version: "18" },
      generation: 3, requestedAt: "2026-09-04T20:00:00Z", retrievedAt: "2026-09-04T20:00:01Z",
      normalizedRequestDigest: `sha256:${"a".repeat(64)}`, responseDigest: `sha256:${"b".repeat(64)}`,
    },
  };
}

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  db.exec(ddl);
  db.exec("CREATE TABLE evidence_run_images (run_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,run_json TEXT NOT NULL) STRICT;");
  db.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
  const run = parseRunSnapshot({ runId: "run-a", revision: 4, feedbackPolicy: "attempt_end", nodes: [{ id: "node-a", fen }], events: [] });
  db.prepare("INSERT INTO evidence_run_images(run_id,revision,run_json) VALUES (?,?,?)").run("run-a", 4, JSON.stringify(run));
  const batch = parseEvidenceBatchRequest({ schema: "evidence_batch_request@1", runId: "run-a", origin: "explicit_analysis", jobs: [request()] });
  const job = batch.jobs[0];
  db.prepare(`INSERT INTO evidence_job_batches
    (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?)`).run("batch-a", "run-a", "explicit_analysis", "key", JSON.stringify(batch), batchRequestDigest(batch), 1, "now");
  db.prepare(`INSERT INTO evidence_jobs
    (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
     job_request_digest,request_json,state,attempt_count,admitted_at,lease_owner,lease_expires_at,lease_generation)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      "job-a", "batch-a", 0, "run-a", "node-a", "explicit_analysis", "runtime.analysis",
      "evidence.stockfish_analysis", jobRequestDigest(job), JSON.stringify(job), "running", 1,
      "now", "worker-a", "later", 7,
    );
  return { db, run };
}

test("D2742 run and job leases cross application-database authorities", () => {
  const left = database();
  const right = database();
  const foreignJobLease = loadJobLease(left.db, { jobId: "job-a", owner: "worker-a" });
  assert.equal(settleEvidenceJob(right.db, { lease: foreignJobLease, settlement: success() }), 1);
  const foreignRunLease = acquireRunLease(left.db, { runId: "run-a", owner: "writer-a" });
  assert.equal(applyStoredEvidenceAndConsumeJob(right.db, { runLease: foreignRunLease, jobId: "job-a" }).replay, false);
  left.db.close();
  right.db.close();
});

test("D2743 settlement accepts a result crossed from its job and malformed acquisition authority", () => {
  const { db } = database();
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const crossed = success();
  crossed.payload = { kind: "tablebase", source: "tablebase_exact", values: { dtz: 1 } };
  crossed.acquisition.generation = 999;
  crossed.acquisition.endpoint = "";
  crossed.acquisition.requestedAt = "not-an-instant";
  crossed.acquisition.requestedIdentity = {};
  crossed.acquisition.actualIdentity = {};
  crossed.acquisition.normalizedRequestDigest = `sha256:${"c".repeat(64)}`;
  assert.equal(settleEvidenceJob(db, { lease, settlement: crossed }), 1);
  db.close();
});

test("D2744 the claimed complete success authority cannot represent an objective proposal", () => {
  const withObjective = success();
  withObjective.objectiveProposal = { nodeId: "node-a", evidenceRefs: ["engine:job-a"] };
  assert.throws(() => parseStoredSuccess(withObjective), /objective-fixture-not-modeled/u);
});

test("D2745 consumed replay returns after its stored request and settlement become corrupt", () => {
  const { db } = database();
  settleEvidenceJob(db, { lease: loadJobLease(db, { jobId: "job-a", owner: "worker-a" }), settlement: success() });
  applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-a" }), jobId: "job-a" });
  db.prepare("UPDATE evidence_jobs SET request_json='{}', settlement_json='{}' WHERE id='job-a'").run();
  assert.equal(applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }), jobId: "job-a" }).replay, true);
  db.close();
});

test("D2746 application replay accepts receipt revisions unrelated to the retained transition", () => {
  const { db } = database();
  settleEvidenceJob(db, { lease: loadJobLease(db, { jobId: "job-a", owner: "worker-a" }), settlement: success() });
  applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-a" }), jobId: "job-a" });
  const receipt = JSON.parse(db.prepare("SELECT application_receipt_json FROM evidence_jobs WHERE id='job-a'").get().application_receipt_json);
  receipt.fromRevision = 900;
  receipt.toRevision = 901;
  db.prepare("UPDATE evidence_jobs SET application_receipt_json=? WHERE id='job-a'").run(JSON.stringify(receipt));
  assert.equal(applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }), jobId: "job-a" }).receipt.toRevision, 901);
  db.close();
});

test("D2747 batch replay trusts a caller snapshot after durable run truth changed", () => {
  const { db, run } = database();
  const changed = parseRunSnapshot({ runId: "run-a", revision: 5, feedbackPolicy: "attempt_end", nodes: [{ id: "node-b", fen }], events: [] });
  db.prepare("UPDATE evidence_run_images SET revision=?,run_json=? WHERE run_id='run-a'").run(5, JSON.stringify(changed));
  assert.deepEqual(replayStoredBatch(db, { batchId: "batch-a", runSnapshot: run }).jobIds, ["job-a"]);
  db.close();
});
