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

function canonicalPayload(kind = "eval") {
  if (kind === "tablebase") {
    return `{"kind":"tablebase","source":"tablebase_exact","values":{"category":"draw","dtz":0,"fen":"${fen}","pieceCount":2,"preciseDtz":0,"sourceId":"tablebase-primary"}}`;
  }
  return '{"kind":"eval","source":"engine_validated","values":{"centipawns":10,"depth":12,"engineId":"stockfish-analysis","requestedDepth":12}}';
}

function settle(db, kind = "eval", raw = canonicalPayload(kind)) {
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const providerRequest = requestEvidenceProvider(lease);
  const result = recordEvidenceProviderResponse(providerRequest, raw);
  return settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: null });
}

function unavailableAvailability() {
  return { state: "unavailable", instanceIds: ["stockfish-analysis"], reason: "network" };
}

function failure(row) {
  return {
    kind: "source_failure", operation: "stockfish.position_evaluation@1",
    normalizedRequestDigest: row.job_request_digest, failedAt: "2026-09-05T12:01:00.000Z", reason: "provider_unavailable",
  };
}

test("D2802 response payloads are joined to request operands and provider identity", () => {
  const engine = database();
  const lease = loadJobLease(engine, { jobId: "job-a", owner: "worker-a" });
  const providerRequest = requestEvidenceProvider(lease);
  assert.throws(() => recordEvidenceProviderResponse(providerRequest, '{"kind":"eval","source":"engine_validated","values":{"centipawns":10,"depth":99,"engineId":"attacker","requestedDepth":99}}'), /crossed/u);
  engine.close();

  const tablebase = database({ kind: "tablebase" });
  const tablebaseLease = loadJobLease(tablebase, { jobId: "job-a", owner: "worker-a" });
  const tablebaseRequest = requestEvidenceProvider(tablebaseLease);
  assert.throws(() => recordEvidenceProviderResponse(tablebaseRequest, '{"kind":"tablebase","source":"tablebase_exact","values":{"category":"win","dtz":99,"fen":"attacker-fen","pieceCount":7,"preciseDtz":99,"sourceId":"attacker"}}'), /crossed/u);
  assert.equal(settle(tablebase, "tablebase"), 1);
  tablebase.close();
});

test("D2803 only the shared RFC-8785 canonical response image is admitted", () => {
  const db = database();
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const providerRequest = requestEvidenceProvider(lease);
  const reordered = '{"source":"engine_validated","values":{"requestedDepth":12,"engineId":"stockfish-analysis","depth":12,"centipawns":10},"kind":"eval"}';
  assert.throws(() => recordEvidenceProviderResponse(providerRequest, reordered), /noncanonical/u);
  assert.equal(settle(db), 1);
  db.close();
});

test("D2804 retry basis is an exact provider, shutdown or expired-lease union", () => {
  const db = database();
  const row = db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get();
  const base = { ...row, state: "retry_wait", lease_owner: null, lease_expires_at: null, next_attempt_at: "2026-09-06T00:00:00.000Z" };
  assert.throws(() => parseDurableJob({ ...base, retry_basis_json: '{"attacker":true}' }), /retry/u);
  assert.equal(parseDurableJob({ ...base, retry_basis_json: JSON.stringify({ kind: "provider_unavailable", availability: unavailableAvailability(), failure: failure(row) }) }).state, "retry_wait");
  assert.equal(parseDurableJob({ ...base, retry_basis_json: '{"kind":"shutdown"}' }).state, "retry_wait");
  db.close();
});

test("D2805 terminal unavailable states require their exact availability and failure authority", () => {
  const db = database();
  const row = db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get();
  const base = { ...row, lease_owner: null, lease_expires_at: null, settled_at: "2026-09-05T13:00:00.000Z" };
  assert.throws(() => parseDurableJob({ ...base, state: "settled_empty", settlement_json: '{"kind":"empty","reason":"provider_unavailable"}' }), /shape/u);
  assert.throws(() => parseDurableJob({ ...base, state: "settled_unavailable", settlement_json: '{"kind":"unavailable","reason":"provider_unavailable"}' }), /shape/u);
  assert.throws(() => parseDurableJob({ ...base, state: "settled_unavailable", settlement_json: JSON.stringify({ kind: "unavailable", availability: { state: "unavailable", instanceIds: ["attacker"], reason: "network" } }) }), /instance-crossed/u);
  assert.equal(parseDurableJob({ ...base, state: "settled_empty", settlement_json: JSON.stringify({ kind: "empty", reason: "provider_unavailable", availability: unavailableAvailability(), failure: failure(row) }) }).state, "settled_empty");
  assert.equal(parseDurableJob({ ...base, state: "settled_unavailable", settlement_json: JSON.stringify({ kind: "unavailable", availability: unavailableAvailability() }) }).state, "settled_unavailable");
  db.close();
});

test("D2806 origin fixes both consumer and kind-selected provider operation", () => {
  const db = database();
  const row = db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get();
  assert.throws(() => parseDurableJob({ ...row, origin: "story_completion", consumer_id: "runtime.analysis", provider_operation_id: "evidence.tablebase_probe" }), /routing-crossed/u);
  assert.equal(parseDurableJob(row).state, "running");
  db.close();
});

test("D2807 provider request and retrieval must both occur inside the exact lease", () => {
  const db = database({ expiresAt: "2099-01-01T00:00:00.000Z" });
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const providerRequest = requestEvidenceProvider(lease);
  const RealDate = globalThis.Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length === 0 ? ["2100-01-01T00:00:00.000Z"] : args)); }
    static now() { return RealDate.parse("2100-01-01T00:00:00.000Z"); }
  };
  let result;
  try { result = recordEvidenceProviderResponse(providerRequest, canonicalPayload()); }
  finally { globalThis.Date = RealDate; }
  assert.throws(() => settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: null }), /after-lease/u);
  db.close();
});

test("D2808 retained transitions reject update and direct deletion at the storage boundary", () => {
  const db = database();
  settle(db);
  applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-a" }), jobId: "job-a" });
  assert.throws(() => db.prepare("UPDATE evidence_run_transitions SET from_revision=899,to_revision=900 WHERE job_id='job-a'").run(), /IMMUTABLE/u);
  assert.throws(() => db.prepare("DELETE FROM evidence_run_transitions WHERE job_id='job-a'").run(), /IMMUTABLE/u);
  const replay = applyStoredEvidenceAndConsumeJob(db, { runLease: acquireRunLease(db, { runId: "run-a", owner: "writer-b" }), jobId: "job-a" });
  assert.equal(replay.replay, true);
  db.close();
});
