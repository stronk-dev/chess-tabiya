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
  loadJobLease,
  parseDurableJob,
  recordEvidenceProviderResponse,
  requestEvidenceProvider,
  settleEvidenceJob,
} from "../d2802-pack-capability-sixteenth-author-repair/model.mjs";

// The durable evidence-job model was cut out of rfc/pack-capability-contract.md on 2026-09-06 and
// carried, byte for byte, into the successor draft below. This reproducer is repointed and asserts
// nothing new: D3002-D3008 remain open against the same bytes in their new home.
const rfc = readFileSync("rfc/evidence-job-durability.md", "utf8") + readFileSync("planning/pack-capability-contract/review-history.md", "utf8");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n## §3\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const fen = "8/8/8/8/8/8/8/K6k w - - 0 1";

function request() {
  return {
    schema: "evidence_job_request@1",
    runId: "run-a",
    nodeId: "node-a",
    fen,
    kind: "eval",
    depth: 12,
    movetime: null,
    multiPv: null,
    timeoutMs: null,
    objectiveRequest: null,
  };
}

function database({
  origin = "explicit_analysis",
  expiresAt = "2099-01-01T00:00:00.000Z",
} = {}) {
  const consumer = {
    explicit_analysis: "runtime.analysis",
    story_completion: "review.story_evidence",
    run_enrichment: "runtime.background_evidence",
  }[origin];
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  db.exec(ddl);
  db.exec("CREATE TABLE evidence_run_images (run_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,run_json TEXT NOT NULL) STRICT;");
  db.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
  const run = parseRunSnapshot({
    runId: "run-a",
    revision: 4,
    feedbackPolicy: "attempt_end",
    nodes: [{ id: "node-a", fen }],
    events: [],
  });
  db.prepare("INSERT INTO evidence_run_images(run_id,revision,run_json) VALUES (?,?,?)")
    .run("run-a", 4, JSON.stringify(run));
  const batch = parseEvidenceBatchRequest({
    schema: "evidence_batch_request@1",
    runId: "run-a",
    origin,
    jobs: [request()],
  });
  const job = batch.jobs[0];
  db.prepare("INSERT INTO evidence_job_batches (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at) VALUES (?,?,?,?,?,?,?,?)")
    .run("batch-a", "run-a", origin, "key", JSON.stringify(batch), batchRequestDigest(batch), 1, "2026-09-05T12:00:00.000Z");
  db.prepare("INSERT INTO evidence_jobs (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,job_request_digest,request_json,state,attempt_count,admitted_at,lease_owner,lease_expires_at,lease_generation) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
    .run("job-a", "batch-a", 0, "run-a", "node-a", origin, consumer,
      "evidence.stockfish_analysis", jobRequestDigest(job), JSON.stringify(job), "running", 1,
      "2026-09-05T12:00:00.000Z", "worker-a", expiresAt, 7);
  return db;
}

const payload = '{"kind":"eval","source":"engine_validated","values":{"centipawns":10,"depth":12,"engineId":"stockfish-analysis","requestedDepth":12}}';

function providerUnavailableSettlement(kind) {
  return {
    kind,
    ...(kind === "empty" ? { reason: "provider_unavailable" } : {}),
    availability: {
      state: "unavailable",
      instanceIds: ["stockfish-analysis"],
      reason: "network",
    },
  };
}

function terminalRow(db, state, settlement) {
  return {
    ...db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get(),
    state,
    lease_owner: null,
    lease_expires_at: null,
    settled_at: "2026-09-06T00:00:00.000Z",
    settlement_json: JSON.stringify(settlement),
  };
}

function providerResult(db) {
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const providerRequest = requestEvidenceProvider(lease);
  return {
    lease,
    result: recordEvidenceProviderResponse(providerRequest, payload),
  };
}

test("D3002 the executable success arm rejects the RFC's acquisition field", () => {
  const db = database();
  const { lease, result } = providerResult(db);
  assert.equal(settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: null }), 1);
  const row = db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get();
  const stored = JSON.parse(row.settlement_json);
  assert.ok(stored.provider);
  assert.equal(stored.acquisition, undefined);
  const declared = { ...stored, acquisition: stored.provider };
  delete declared.provider;
  assert.throws(() => parseDurableJob({ ...row, settlement_json: JSON.stringify(declared) }), /settlement:shape/u);
  db.close();
});

test("D3003 caller-shaped availability and failure JSON mints claimed real receipts", () => {
  const db = database();
  const row = db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get();
  const basis = {
    kind: "provider_unavailable",
    availability: {
      state: "unavailable",
      instanceIds: ["stockfish-analysis"],
      reason: "network",
    },
    failure: {
      kind: "source_failure",
      operation: "stockfish.position_evaluation@1",
      normalizedRequestDigest: row.job_request_digest,
      failedAt: "2026-09-06T00:00:00.000Z",
      reason: "provider_unavailable",
    },
  };
  const parsed = parseDurableJob({
    ...row,
    state: "retry_wait",
    lease_owner: null,
    lease_expires_at: null,
    next_attempt_at: "2026-09-06T00:01:00.000Z",
    retry_basis_json: JSON.stringify(basis),
  });
  assert.equal(parsed.state, "retry_wait");
  db.close();
});

test("D3004 every origin accepts the opposite provider-off terminal effect", () => {
  const explicit = database({ origin: "explicit_analysis" });
  assert.equal(parseDurableJob(terminalRow(explicit, "settled_empty", providerUnavailableSettlement("empty"))).state, "settled_empty");
  explicit.close();

  for (const origin of ["story_completion", "run_enrichment"]) {
    const db = database({ origin });
    assert.equal(parseDurableJob(terminalRow(db, "settled_unavailable", providerUnavailableSettlement("unavailable"))).state, "settled_unavailable");
    db.close();
  }
});

test("D3005 retry parsing validates one basis but returns substituted bytes", () => {
  const db = database();
  const row = db.prepare("SELECT * FROM evidence_jobs WHERE id='job-a'").get();
  const retryBasis = JSON.stringify({ kind: "shutdown" });
  const parsed = parseDurableJob({
    ...row,
    state: "retry_wait",
    lease_owner: null,
    lease_expires_at: null,
    next_attempt_at: "2026-09-06T00:01:00.000Z",
    retry_basis_json: retryBasis,
  });
  assert.equal(parsed.retry_basis_json, "{}");
  assert.notEqual(parsed.retry_basis_json, retryBasis);
  db.close();
});

test("D3006 provider execution starts after the durable lease expiry changes", () => {
  const db = database();
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  db.prepare("UPDATE evidence_jobs SET lease_expires_at='2000-01-01T00:00:00.000Z' WHERE id='job-a'").run();
  const providerRequest = requestEvidenceProvider(lease);
  assert.equal(providerRequest.jobId, "job-a");
  db.close();
});

test("D3007 a future process timestamp settles before its recorded retrieval", () => {
  const db = database();
  const lease = loadJobLease(db, { jobId: "job-a", owner: "worker-a" });
  const providerRequest = requestEvidenceProvider(lease);
  const RealDate = globalThis.Date;
  globalThis.Date = class extends RealDate {
    constructor(...args) { super(...(args.length === 0 ? ["2050-01-01T00:00:00.000Z"] : args)); }
    static now() { return RealDate.parse("2050-01-01T00:00:00.000Z"); }
  };
  let result;
  try { result = recordEvidenceProviderResponse(providerRequest, payload); }
  finally { globalThis.Date = RealDate; }
  assert.equal(settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: null }), 1);
  const row = db.prepare("SELECT settled_at,settlement_json FROM evidence_jobs WHERE id='job-a'").get();
  const stored = JSON.parse(row.settlement_json);
  assert.ok(Date.parse(stored.provider.retrievedAt) > Date.parse(row.settled_at));
  db.close();
});

test("D3008 settlement ignores a rewritten parent batch request and digest", () => {
  const db = database();
  const { lease, result } = providerResult(db);
  db.prepare("UPDATE evidence_job_batches SET request_json=?,request_digest=?,job_count=? WHERE id='batch-a'")
    .run('{"attacker":true}', "sha256:attacker", 16);
  assert.equal(settleEvidenceJob(db, { lease, providerResult: result, objectiveProposal: null }), 1);
  assert.equal(db.prepare("SELECT state FROM evidence_jobs WHERE id='job-a'").get().state, "settled_success");
  db.close();
});
