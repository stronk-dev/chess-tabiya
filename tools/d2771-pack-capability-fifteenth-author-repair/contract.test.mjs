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
  parseDurableJob,
  recordEvidenceProviderResponse,
  requestEvidenceProvider,
  settleEvidenceJob,
} from "./model.mjs";

// Repointed 2026-09-06: the durable evidence-job model, the operation census and criteria
// 20-30 were cut out of rfc/pack-capability-contract.md byte-for-byte into the successor
// draft; the review narrative moved to review-history.md. This reproducer asserts nothing
// new -- it reads the same bytes in their new homes.
const rfc = readFileSync("rfc/evidence-job-durability.md", "utf8") + readFileSync("planning/pack-capability-contract/review-history.md", "utf8");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n## §3\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const fen = "8/8/8/8/8/8/8/K6k w - - 0 1";

function objectiveRequest() {
  return {
    runId: "run-a", packId: "pack-a", packDigest: "sha256:pack", nodeId: "node-a", fen,
    objectiveState: "active", evidenceRefs: ["theory:prior"],
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [{ id: "stockfish", version: "18" }], modelIds: [] } },
  };
}
function request(kind = "eval", objective = null) {
  return {
    schema: "evidence_job_request@1", runId: "run-a", nodeId: "node-a", fen, kind,
    depth: kind === "tablebase" ? null : 12, movetime: null, multiPv: null, timeoutMs: null,
    objectiveRequest: objective,
  };
}
function payload(kind = "eval") {
  if (kind === "eval") return { kind, source: "engine_validated", values: { engineId: "stockfish-analysis", requestedDepth: 12, centipawns: 10, depth: 12 } };
  if (kind === "wdl") return { kind, source: "engine_validated", values: { engineId: "stockfish-analysis", requestedDepth: 12, win: 400, draw: 500, loss: 100, depth: 12 } };
  if (kind === "bestline") return { kind, source: "engine_validated", values: { engineId: "stockfish-analysis", requestedDepth: 12, movesUci: ["a1a2"], depth: 12 } };
  return { kind, source: "tablebase_exact", values: { fen, pieceCount: 2, category: "draw", dtz: 0, preciseDtz: 0, sourceId: "tablebase-primary" } };
}

function database({ kind = "eval", objective = false, expiresAt = "2099-01-01T00:00:00.000Z" } = {}) {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  db.exec(ddl);
  db.exec("CREATE TABLE evidence_run_images (run_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,run_json TEXT NOT NULL) STRICT;");
  db.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
  const run = parseRunSnapshot({ runId: "run-a", revision: 4, feedbackPolicy: "attempt_end", nodes: [{ id: "node-a", fen }], events: [] });
  db.prepare("INSERT INTO evidence_run_images(run_id,revision,run_json) VALUES (?,?,?)").run("run-a", 4, JSON.stringify(run));
  const batch = parseEvidenceBatchRequest({ schema: "evidence_batch_request@1", runId: "run-a", origin: "explicit_analysis", jobs: [request(kind, objective ? objectiveRequest() : null)] });
  const job = batch.jobs[0];
  db.prepare("INSERT INTO evidence_job_batches (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at) VALUES (?,?,?,?,?,?,?,?)")
    .run("batch-a", "run-a", "explicit_analysis", "key", JSON.stringify(batch), batchRequestDigest(batch), 1, "2026-09-05T12:00:00.000Z");
  db.prepare("INSERT INTO evidence_jobs (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,job_request_digest,request_json,state,attempt_count,admitted_at,lease_owner,lease_expires_at,lease_generation) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run("job-a", "batch-a", 0, "run-a", "node-a", "explicit_analysis", "runtime.analysis", kind === "tablebase" ? "evidence.tablebase_probe" : "evidence.stockfish_analysis", jobRequestDigest(job), JSON.stringify(job), "running", 1, "2026-09-05T12:00:00.000Z", "worker-a", expiresAt, 7);
  return db;
}

function providerResult(lease, kind = "eval") {
  const providerRequest = requestEvidenceProvider(lease);
  return recordEvidenceProviderResponse(providerRequest, JSON.stringify(payload(kind)));
}
function settle(db, { kind = "eval", objectiveProposal = null } = {}) {
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  settleEvidenceJob(db, { lease, providerResult: providerResult(lease, kind), objectiveProposal });
  return lease;
}
function consume(db, options = {}) {
  settle(db, options);
  return applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-a" }), jobId: "job-a" });
}

test("D2771/D2775 one complete state parser rejects impossible durable residue", () => {
  const db = database();
  consume(db);
  db.prepare("UPDATE evidence_jobs SET result_seq=NULL,settled_at=NULL,consumed_at=NULL,lease_owner='resurrected',lease_expires_at='2099-01-01T00:00:00.000Z' WHERE id='job-a'").run();
  assert.throws(() => parseDurableJob(db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get()), /(must-be-null|required)/u);
  assert.throws(() => applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }), jobId: "job-a" }), /(must-be-null|required)/u);
  db.close();
});

test("D2772 expired leases neither load nor settle after storage expiry changes", () => {
  const expired = database({ expiresAt: "2000-01-01T00:00:00.000Z" });
  assert.throws(() => loadJobLease(expired, { jobId: "job-a", owner: "worker-a" }), /expired/u);
  expired.close();
  const db = database();
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const result = providerResult(lease);
  db.prepare("UPDATE evidence_jobs SET lease_expires_at='2000-01-01T00:00:00.000Z' WHERE id='job-a'").run();
  assert.throws(() => settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: null }), /(expired|lease-cas)/u);
  db.close();
});

test("D2773 sealed canonical provider bytes and kind-specific parsers own all four payloads", () => {
  for (const kind of ["eval", "wdl", "bestline", "tablebase"]) {
    const db = database({ kind });
    const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
    const result = providerResult(lease, kind);
    assert.throws(() => settleEvidenceJob(db, { lease, providerResult: { ...result }, objectiveProposal: null }), /authority/u);
    assert.equal(settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: null }), 1);
    const stored = JSON.parse(db.prepare("SELECT settlement_json FROM evidence_jobs WHERE id='job-a'").get().settlement_json);
    assert.equal(stored.provider.responseDigest, result.responseDigest);
    assert.deepEqual(stored.payload, payload(kind));
    db.close();
  }
  const db = database();
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const providerRequest = requestEvidenceProvider(lease);
  assert.throws(() => recordEvidenceProviderResponse(providerRequest, JSON.stringify({ kind: "eval", source: "engine_validated", values: { invented: "truth" } })), /payload/u);
  db.close();
});

test("D2778 provider responses remain bound to the exact database-issued lease", () => {
  const left = database();
  const right = database();
  const leftLease = loadJobLease(left, { jobId: "job-a", owner: "worker-a" });
  const rightLease = loadJobLease(right, { jobId: "job-a", owner: "worker-a" });
  const leftResult = providerResult(leftLease);
  assert.throws(() => settleEvidenceJob(right, { lease: rightLease, providerResult: leftResult, objectiveProposal: null }), /authority/u);
  left.close();
  right.close();
});

test("D2774 objective proposal equals the request state and authorized evidence set", () => {
  const db = database({ objective: true });
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const result = providerResult(lease);
  assert.throws(() => settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: { nodeId: "node-a", from: "failed", to: "achieved", evidenceRefs: ["theory:prior", "engine:job-a", "attacker:claim"] } }), /objective-proposal/u);
  assert.equal(settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: { nodeId: "node-a", from: "active", to: "achieved", evidenceRefs: ["theory:prior", "engine:job-a"] } }), 1);
  db.close();
});

test("D2776 immutable transition authority rejects a coordinated current-image and receipt rewrite", () => {
  const db = database();
  consume(db);
  const image = JSON.parse(db.prepare("SELECT run_json FROM evidence_run_images WHERE run_id='run-a'").get().run_json);
  image.revision = 900;
  const receipt = JSON.parse(db.prepare("SELECT application_receipt_json FROM evidence_jobs WHERE id='job-a'").get().application_receipt_json);
  receipt.fromRevision = 899;
  receipt.toRevision = 900;
  db.prepare("UPDATE evidence_run_images SET revision=900,run_json=? WHERE run_id='run-a'").run(JSON.stringify(image));
  db.prepare("UPDATE evidence_jobs SET application_receipt_json=? WHERE id='job-a'").run(JSON.stringify(receipt));
  assert.throws(() => applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }), jobId: "job-a" }), /transition/u);
  db.close();
});

test("D2777 terminal clocks are observed canonical instants and ordered", () => {
  const db = database();
  consume(db);
  const row = db.prepare("SELECT admitted_at,settled_at,consumed_at FROM evidence_jobs WHERE id='job-a'").get();
  assert.notEqual(row.settled_at, "now");
  assert.notEqual(row.consumed_at, "now");
  assert.equal(new Date(row.settled_at).toISOString(), row.settled_at);
  assert.equal(new Date(row.consumed_at).toISOString(), row.consumed_at);
  assert.ok(Date.parse(row.settled_at) <= Date.parse(row.consumed_at));
  db.close();
});

test("response-loss replay validates the stored transition and returns its retained after-image", () => {
  const db = database();
  const first = consume(db);
  const replay = applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }), jobId: "job-a" });
  assert.equal(replay.replay, true);
  assert.deepEqual(replay.receipt, first.receipt);
  assert.deepEqual(replay.afterRun, first.afterRun);
  db.close();
});
