import assert from "node:assert/strict";
import crypto from "node:crypto";
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
} from "../d2771-pack-capability-fifteenth-author-repair/model.mjs";

// Repointed 2026-09-06: the durable evidence-job model, the operation census and criteria
// 20-30 were cut out of rfc/pack-capability-contract.md byte-for-byte into the successor
// draft; the review narrative moved to review-history.md. This reproducer asserts nothing
// new -- it reads the same bytes in their new homes.
const rfc = readFileSync("planning/pack-capability-contract/evidence-job-durability.md", "utf8") + readFileSync("planning/pack-capability-contract/review-history.md", "utf8");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n## §3\./u)?.[1] ?? "";
// This review reproduces the pre-sixteenth-repair schema. Later RFC amendments must not silently
// repair the historical falsifier before the successor author target runs.
const ddl = (section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "")
  .replace(/\nCREATE TRIGGER evidence_run_transitions_no_update[\s\S]*$/u, "");
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

function payload(kind = "eval") {
  if (kind === "eval") return { kind, source: "engine_validated", values: { engineId: "stockfish-analysis", requestedDepth: 12, centipawns: 10, depth: 12 } };
  return { kind, source: "tablebase_exact", values: { fen, pieceCount: 2, category: "draw", dtz: 0, preciseDtz: 0, sourceId: "tablebase-primary" } };
}

function settle(db, raw, kind = "eval") {
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const providerRequest = requestEvidenceProvider(lease);
  const result = recordEvidenceProviderResponse(providerRequest, raw ?? JSON.stringify(payload(kind)));
  return settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: null });
}

function consume(db) {
  settle(db);
  return applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-a" }), jobId: "job-a" });
}

function digest(prefix, value) {
  return `sha256:${crypto.createHash("sha256").update(`${prefix}\0${typeof value === "string" ? value : JSON.stringify(value)}`).digest("hex")}`;
}

test("D2802 provider payload operands can contradict the exact stored request and instance", () => {
  const engine = database();
  assert.equal(settle(engine, JSON.stringify({ kind: "eval", source: "engine_validated", values: { engineId: "attacker", requestedDepth: 99, centipawns: 10, depth: 99 } })), 1);
  engine.close();

  const tablebase = database({ kind: "tablebase" });
  assert.equal(settle(tablebase, JSON.stringify({ kind: "tablebase", source: "tablebase_exact", values: { fen: "attacker-fen", pieceCount: 7, category: "win", dtz: 99, preciseDtz: 99, sourceId: "attacker" } }), "tablebase"), 1);
  tablebase.close();
});

test("D2803 response bytes are round-trip JSON, not one canonical byte image", () => {
  const db = database();
  const noncanonical = '{"source":"engine_validated","values":{"requestedDepth":12,"engineId":"stockfish-analysis","depth":12,"centipawns":10},"kind":"eval"}';
  assert.equal(settle(db, noncanonical), 1);
  db.close();
});

test("D2804 retry_wait accepts an arbitrary untyped retry basis", () => {
  const db = database();
  const row = db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get();
  const crossed = { ...row, state: "retry_wait", lease_owner: null, lease_expires_at: null, next_attempt_at: "2026-09-06T00:00:00.000Z", retry_basis_json: '{"attacker":true}' };
  assert.equal(parseDurableJob(crossed).state, "retry_wait");
  db.close();
});

test("D2805 unavailable terminal states accept shapes the RFC does not declare", () => {
  const db = database();
  const row = db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get();
  const base = { ...row, lease_owner: null, lease_expires_at: null, settled_at: "2026-09-05T13:00:00.000Z" };
  assert.equal(parseDurableJob({ ...base, state: "settled_empty", settlement_json: '{"kind":"empty","reason":"provider_unavailable"}' }).state, "settled_empty");
  assert.equal(parseDurableJob({ ...base, state: "settled_unavailable", settlement_json: '{"kind":"unavailable","reason":"provider_unavailable"}' }).state, "settled_unavailable");
  db.close();
});

test("D2806 the exhaustive row parser accepts crossed origin, consumer and operation identity", () => {
  const db = database();
  const row = db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get();
  const crossed = { ...row, origin: "story_completion", consumer_id: "runtime.analysis", provider_operation_id: "evidence.tablebase_probe" };
  assert.equal(parseDurableJob(crossed).state, "running");
  db.close();
});

test("D2807 a provider response timestamp after lease expiry still settles", () => {
  const db = database({ expiresAt: "2099-01-01T00:00:00.000Z" });
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const providerRequest = requestEvidenceProvider(lease);
  const RealDate = globalThis.Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length === 0 ? ["2100-01-01T00:00:00.000Z"] : args)); }
    static now() { return RealDate.parse("2100-01-01T00:00:00.000Z"); }
  };
  let result;
  try { result = recordEvidenceProviderResponse(providerRequest, JSON.stringify(payload())); }
  finally { globalThis.Date = RealDate; }
  assert.equal(settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: null }), 1);
  db.close();
});

test("D2808 the claimed immutable transition can be coherently rewritten in place", () => {
  const db = database();
  consume(db);
  const transition = db.prepare("SELECT * FROM evidence_run_transitions WHERE job_id='job-a'").get();
  const before = JSON.parse(transition.before_run_json);
  const after = JSON.parse(transition.after_run_json);
  before.revision = 899;
  after.revision = 900;
  const beforeDigest = digest("chess-tabiya/run-image/v1", JSON.stringify(before));
  const afterDigest = digest("chess-tabiya/run-image/v1", JSON.stringify(after));
  const subject = { runId: "run-a", jobId: "job-a", fromRevision: 899, toRevision: 900, beforeRunDigest: beforeDigest, afterRunDigest: afterDigest, firstEventSeq: transition.first_event_seq, lastEventSeq: transition.last_event_seq, eventDigest: transition.event_digest };
  const rewrittenDigest = digest("chess-tabiya/evidence-transition/v1", subject);
  const receipt = JSON.parse(db.prepare("SELECT application_receipt_json FROM evidence_jobs WHERE id='job-a'").get().application_receipt_json);
  Object.assign(receipt, { fromRevision: 899, toRevision: 900, transitionDigest: rewrittenDigest });
  db.prepare("UPDATE evidence_run_transitions SET from_revision=?,to_revision=?,before_run_json=?,before_run_digest=?,after_run_json=?,after_run_digest=?,transition_digest=?,committed_at='attacker' WHERE job_id='job-a'")
    .run(899, 900, JSON.stringify(before), beforeDigest, JSON.stringify(after), afterDigest, rewrittenDigest);
  db.prepare("UPDATE evidence_run_images SET revision=900,run_json=? WHERE run_id='run-a'").run(JSON.stringify(after));
  db.prepare("UPDATE evidence_jobs SET application_receipt_json=? WHERE id='job-a'").run(JSON.stringify(receipt));
  const replay = applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }), jobId: "job-a" });
  assert.equal(replay.replay, true);
  assert.equal(replay.receipt.fromRevision, 899);
  db.close();
});
