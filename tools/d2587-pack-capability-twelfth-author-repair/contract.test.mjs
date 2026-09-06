import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { Worker } from "node:worker_threads";
import {
  applyEvidenceAndConsumeJob,
  assertApplicationResult,
  batchRequestDigest,
  consumerForOrigin,
  deriveRecordedGuardOutcome,
  jobRequestDigest,
  parseEvidenceBatchRequest,
  parseEvidenceJobRequest,
  parseRunSnapshot,
  settleSuccessWithSequence,
  validateStoredBatch,
} from "./model.mjs";

// Repointed 2026-09-06: the durable evidence-job model, the operation census and criteria
// 20-30 were cut out of rfc/pack-capability-contract.md byte-for-byte into the successor
// draft; the review narrative moved to review-history.md. This reproducer asserts nothing
// new -- it reads the same bytes in their new homes.
const rfc = readFileSync("planning/pack-capability-contract/evidence-job-durability.md", "utf8") + readFileSync("planning/pack-capability-contract/review-history.md", "utf8");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n## §3\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const fen = "8/8/8/8/8/8/8/K6k w - - 0 1";

function objective(overrides = {}) {
  return {
    runId: "run-a",
    packId: "pack-a",
    packDigest: "sha256:pack",
    nodeId: "node-a",
    fen,
    objectiveState: "active",
    evidenceRefs: [],
    policyConfig: {
      seedMode: "per_run",
      locus: { executedAt: "server", engineIds: [{ id: "sf", version: "18" }], modelIds: [] },
    },
    ...overrides,
  };
}

function job(runId = "run-a", overrides = {}) {
  return {
    schema: "evidence_job_request@1",
    runId,
    nodeId: "node-a",
    fen,
    kind: "eval",
    depth: 12,
    movetime: null,
    multiPv: null,
    timeoutMs: null,
    objectiveRequest: null,
    ...overrides,
  };
}

function batch(origin = "explicit_analysis") {
  return { schema: "evidence_batch_request@1", runId: "run-a", origin, jobs: [job()] };
}

function run(runId = "run-a", feedbackPolicy = "attempt_end") {
  return parseRunSnapshot({ runId, revision: 4, feedbackPolicy, nodes: [{ id: "node-a", fen }], events: [] });
}

function storedRows(parsed) {
  const batchRow = {
    id: "batch-a",
    run_id: parsed.runId,
    origin: parsed.origin,
    request_json: JSON.stringify(parsed),
    request_digest: batchRequestDigest(parsed),
    job_count: parsed.jobs.length,
  };
  const request = parsed.jobs[0];
  return {
    batchRow,
    jobRows: [{
      id: "job-a",
      batch_id: batchRow.id,
      batch_ordinal: 0,
      run_id: parsed.runId,
      node_id: request.nodeId,
      origin: parsed.origin,
      consumer_id: consumerForOrigin(parsed.origin),
      provider_operation_id: "evidence.stockfish_analysis",
      job_request_digest: jobRequestDigest(request),
      request_json: JSON.stringify(request),
    }],
  };
}

function settlement() {
  return { kind: "success", payload: { kind: "eval", values: { cp: 10 } }, objectiveProposal: null, acquisition: {} };
}

test("D2587/D2589: the transaction derives and receipts the complete guarded journal suffix", () => {
  const beforeRun = run("run-a", "immediate_guard");
  const storedJob = { id: "job-a", runId: "run-a", nodeId: "node-a", kind: "eval" };
  const guardOutcome = deriveRecordedGuardOutcome({
    beforeRun,
    job: storedJob,
    emitted: [{ type: "feedback.generated", data: { nodeId: "node-a", evidenceRefs: ["engine:job-a"], message: "recorded guard" } }],
  });
  const result = applyEvidenceAndConsumeJob({ beforeRun, job: storedJob, settlement: settlement(), guardOutcome });
  assert.deepEqual(result.afterRun.events.map((event) => event.type), ["evidence.attached", "feedback.generated"]);
  assert.deepEqual([result.receipt.fromRevision, result.receipt.toRevision, result.receipt.firstEventSeq, result.receipt.lastEventSeq], [4, 5, 1, 2]);
  assert.equal(assertApplicationResult(result), result);
  assert.throws(() => applyEvidenceAndConsumeJob({ beforeRun, job: storedJob, settlement: settlement() }), /requires its complete recorded guard outcome/u);
  assert.throws(() => assertApplicationResult({ ...result, afterRun: run("run-a") }), /not transaction-constructed/u);
  assert.equal(applyEvidenceAndConsumeJob.length, 1, "the operation accepts no caller revision or event array");
});

test("D2588: objective requests are exact, recursively parsed and deeply immutable", () => {
  const mutable = objective();
  const parsed = parseEvidenceJobRequest(job("run-a", { objectiveRequest: mutable }));
  const before = jobRequestDigest(parsed);
  mutable.policyConfig.locus.engineIds[0].version = "forged";
  mutable.evidenceRefs.push("engine:forged");
  assert.equal(jobRequestDigest(parsed), before);
  assert.equal(parsed.objectiveRequest.policyConfig.locus.engineIds[0].version, "18");
  assert.equal(Object.isFrozen(parsed.objectiveRequest.policyConfig.locus.engineIds[0]), true);
  assert.throws(() => parseEvidenceJobRequest(job("run-a", { objectiveRequest: { ...objective(), extra: true } })), /unknown or missing keys/u);
  const { packId: _packId, ...missing } = objective();
  assert.throws(() => parseEvidenceJobRequest(job("run-a", { objectiveRequest: missing })), /unknown or missing keys/u);
  assert.throws(() => parseEvidenceJobRequest(job("run-a", { objectiveRequest: objective({ policyConfig: { seedMode: "per_run", locus: { executedAt: "server", engineIds: [{ id: "sf", version: "18", extra: true }], modelIds: [] } } }) })), /unknown or missing keys/u);
});

test("D2590: stored children join the exact parsed snapshot and reject an equal foreign run", () => {
  const parsed = parseEvidenceBatchRequest(batch());
  const stored = storedRows(parsed);
  assert.deepEqual(validateStoredBatch({ ...stored, runSnapshot: run("run-a") }), parsed);
  assert.throws(() => validateStoredBatch({ ...stored, runSnapshot: run("run-b") }), /crossed run snapshot identity/u);
  assert.throws(() => validateStoredBatch({ ...stored, runSnapshot: { ...run("run-a") } }), /parsed run snapshot/u);
});

test("D2591: first flight and replay work for all three origin-derived consumers", async () => {
  for (const origin of ["explicit_analysis", "story_completion", "run_enrichment"]) {
    const directory = mkdtempSync(join(tmpdir(), `tabiya-f3-origin-${origin}-`));
    const path = join(directory, "origin.sqlite");
    const database = new DatabaseSync(path);
    database.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
    database.exec(ddl);
    database.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
    database.close();
    const gate = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
    const state = new Int32Array(gate);
    const launch = () => new Promise((resolve, reject) => {
      const worker = new Worker(new URL("./concurrent-worker.mjs", import.meta.url), { workerData: { path, gate, key: `key-${origin}`, request: JSON.stringify(batch(origin)) } });
      let result;
      worker.once("message", (message) => { result = message; });
      worker.once("error", reject);
      worker.once("exit", (code) => code === 0 ? resolve(result) : reject(new Error(`worker exited ${code}`)));
    });
    try {
      const pending = [launch(), launch()];
      while (Atomics.load(state, 1) < 2) await new Promise((resolve) => setTimeout(resolve, 1));
      Atomics.store(state, 0, 1);
      Atomics.notify(state, 0, 2);
      const results = await Promise.all(pending);
      assert.equal(results.filter((result) => result.winner).length, 1);
      assert.deepEqual(results.map((result) => result.constructedIds).sort(), [0, 2]);
      const check = new DatabaseSync(path);
      assert.equal(check.prepare("SELECT consumer_id FROM evidence_jobs").get().consumer_id, consumerForOrigin(origin));
      check.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

test("D2592: durable sequence allocation never reuses a rewound success after restart", () => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-f3-result-sequence-"));
  const path = join(directory, "result.sqlite");
  try {
    let database = new DatabaseSync(path);
    database.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
    database.exec(ddl);
    database.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
    const insertBatch = database.prepare(`INSERT INTO evidence_job_batches
      (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
      VALUES (?,?,?,?,?,?,?,?)`);
    const insertJob = database.prepare(`INSERT INTO evidence_jobs
      (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
       job_request_digest,request_json,state,attempt_count,admitted_at,lease_generation)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    for (const suffix of ["old", "new"]) insertBatch.run(`batch-${suffix}`, "run-a", "explicit_analysis", `key-${suffix}`, "{}", `digest-${suffix}`, 1, "now");
    insertJob.run("job-old", "batch-old", 0, "run-a", "node-a", "explicit_analysis", "runtime.analysis", "evidence.stockfish_analysis", "digest-old", "{}", "running", 1, "now", 1);
    assert.equal(settleSuccessWithSequence(database, { jobId: "job-old", runId: "run-a", settlement: settlement() }), 1);
    database.exec("UPDATE evidence_jobs SET state='cancelled', result_seq=NULL, settlement_json='{}' WHERE id='job-old'");
    database.close();
    database = new DatabaseSync(path);
    database.exec("PRAGMA foreign_keys=ON");
    database.prepare(`INSERT INTO evidence_jobs
      (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
       job_request_digest,request_json,state,attempt_count,admitted_at,lease_generation)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run("job-new", "batch-new", 0, "run-a", "node-b", "explicit_analysis", "runtime.analysis", "evidence.stockfish_analysis", "digest-new", "{}", "running", 1, "now", 1);
    assert.equal(settleSuccessWithSequence(database, { jobId: "job-new", runId: "run-a", settlement: settlement() }), 2);
    assert.equal(database.prepare("SELECT next_result_seq FROM evidence_result_sequences WHERE run_id='run-a'").get().next_result_seq, 3);
    database.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the twelfth repair retains the complete eleventh-author target", () => {
  assert.match(readFileSync("Makefile", "utf8"), /pack-capability-twelfth-author-repair: pack-capability-eleventh-author-repair/u);
});
