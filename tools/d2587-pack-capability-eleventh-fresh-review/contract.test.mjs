// Disposable fresh-review falsifiers for D2587-D2592. Not production behavior.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { Worker } from "node:worker_threads";
import {
  applicationReceipt,
  batchRequestDigest,
  jobRequestDigest,
  parseEvidenceBatchRequest,
  parseEvidenceJobRequest,
  validateStoredBatch,
} from "../d2563-pack-capability-eleventh-author-repair/model.mjs";

const read = (path) => readFileSync(path, "utf8");
// Repointed 2026-09-06: the durable evidence-job model, the operation census and criteria
// 20-30 were cut out of rfc/pack-capability-contract.md byte-for-byte into the successor
// draft; the review narrative moved to review-history.md. This reproducer asserts nothing
// new -- it reads the same bytes in their new homes.
const rfc = read("planning/pack-capability-contract/evidence-job-durability.md") + read("planning/pack-capability-contract/review-history.md");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n## §3\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const fen = "8/8/8/8/8/8/8/K6k w - - 0 1";

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

function rows(parsed) {
  const batchRow = {
    id: "batch-a",
    run_id: parsed.runId,
    origin: parsed.origin,
    request_json: JSON.stringify(parsed),
    request_digest: batchRequestDigest(parsed),
    job_count: parsed.jobs.length,
  };
  const request = parsed.jobs[0];
  const consumer = parsed.origin === "explicit_analysis"
    ? "runtime.analysis"
    : parsed.origin === "story_completion"
      ? "review.story_evidence"
      : "runtime.background_evidence";
  const jobRows = [{
    id: "job-a",
    batch_id: batchRow.id,
    batch_ordinal: 0,
    run_id: parsed.runId,
    node_id: request.nodeId,
    origin: parsed.origin,
    consumer_id: consumer,
    provider_operation_id: "evidence.stockfish_analysis",
    job_request_digest: jobRequestDigest(request),
    request_json: JSON.stringify(request),
  }];
  return { batchRow, jobRows };
}

test("D2587: a valid immediate-guard append is rejected as beyond the settlement", () => {
  const service = read("apps/server/src/service.ts");
  const guard = read("apps/server/src/guard.ts");
  assert.match(service, /feedbackPolicy === "immediate_guard"[\s\S]*applyRecordedEngineGuard[\s\S]*\.\.\.guarded\.emitted/u);
  assert.match(guard, /type: "feedback\.generated"/u);

  const request = { id: "job-a", runId: "run-a", nodeId: "node-a", kind: "eval" };
  const settlement = {
    kind: "success",
    payload: { kind: "eval", values: { cp: 10 } },
    objectiveProposal: null,
    acquisition: {},
  };
  const events = [
    { seq: 7, type: "evidence.attached", data: { nodeId: "node-a", evidenceRefs: ["engine:job-a"], payload: settlement.payload } },
    { seq: 8, type: "feedback.generated", data: { nodeId: "node-a", evidenceRefs: ["engine:job-a"] } },
  ];
  assert.throws(
    () => applicationReceipt({ job: request, settlement, fromRevision: 3, toRevision: 4, events }),
    /beyond stored success/u,
  );
});

test("D2588: objective subrequests are neither exact nor deeply immutable", () => {
  const incomplete = {
    runId: "run-a",
    nodeId: "node-a",
    fen,
    extra: "accepted",
    policyConfig: { mode: "before" },
  };
  const parsed = parseEvidenceJobRequest(job("run-a", { objectiveRequest: incomplete }));
  const before = jobRequestDigest(parsed);
  parsed.objectiveRequest.policyConfig.mode = "after";
  const after = jobRequestDigest(parsed);
  assert.notEqual(after, before, "one branded object changed canonical identity after admission");
  assert.equal(parsed.objectiveRequest.extra, "accepted");
  for (const required of ["packId", "packDigest", "objectiveState", "evidenceRefs"]) {
    assert.equal(Object.hasOwn(parsed.objectiveRequest, required), false);
  }
});

test("D2589: receipt construction accepts events absent from any retained run journal", () => {
  const request = { id: "job-a", runId: "run-a", nodeId: "node-a", kind: "eval" };
  const settlement = {
    kind: "success",
    payload: { kind: "eval", values: { cp: 10 } },
    objectiveProposal: null,
    acquisition: {},
  };
  const invented = [{
    seq: 900,
    type: "evidence.attached",
    data: { nodeId: "node-a", evidenceRefs: ["engine:job-a"], payload: settlement.payload },
  }];
  const receipt = applicationReceipt({
    job: request,
    settlement,
    fromRevision: 40,
    toRevision: 41,
    events: invented,
  });
  assert.deepEqual(
    [receipt.fromRevision, receipt.toRevision, receipt.firstEventSeq, receipt.lastEventSeq],
    [40, 41, 900, 900],
  );
  assert.equal(applicationReceipt.length, 1, "no before/after run or journal operand exists");
});

test("D2590: a same-node/FEN map branded as another run passes the stored-batch join", () => {
  const parsed = parseEvidenceBatchRequest(batch());
  const stored = rows(parsed);
  const foreignRunNodes = new Map([["node-a", fen]]);
  foreignRunNodes.runId = "run-b";
  assert.deepEqual(validateStoredBatch({ ...stored, nodeFenById: foreignRunNodes }), parsed);
});

test("D2591: the concurrent authority rejects both non-explicit origins", async () => {
  for (const origin of ["story_completion", "run_enrichment"]) {
    const directory = mkdtempSync(join(tmpdir(), `tabiya-f3-origin-${origin}-`));
    const path = join(directory, "origin.sqlite");
    const database = new DatabaseSync(path);
    database.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
    database.exec(ddl);
    database.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
    database.close();
    const gate = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
    const state = new Int32Array(gate);
    const worker = new Worker(
      new URL("../d2563-pack-capability-eleventh-author-repair/concurrent-worker.mjs", import.meta.url),
      { workerData: { path, gate, key: `key-${origin}`, request: JSON.stringify(batch(origin)) } },
    );
    const outcome = new Promise((resolve, reject) => {
      worker.once("message", resolve);
      worker.once("error", reject);
    });
    while (Atomics.load(state, 1) < 1) await new Promise((resolve) => setTimeout(resolve, 1));
    Atomics.store(state, 0, 1);
    Atomics.notify(state, 0, 1);
    try {
      await assert.rejects(outcome, /CHECK constraint failed/u);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  }
});

test("D2592: the exact durable schema permits result-sequence reuse after rewind", () => {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  database.exec(ddl);
  database.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
  const insertBatch = database.prepare(`INSERT INTO evidence_job_batches
    (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?)`);
  const insertJob = database.prepare(`INSERT INTO evidence_jobs
    (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
     job_request_digest,request_json,state,attempt_count,admitted_at,result_seq)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  for (const suffix of ["old", "new"]) {
    insertBatch.run(`batch-${suffix}`, "run-a", "explicit_analysis", `key-${suffix}`, "{}", `digest-${suffix}`, 1, "now");
  }
  insertJob.run("job-old", "batch-old", 0, "run-a", "node-a", "explicit_analysis", "runtime.analysis", "evidence.stockfish_analysis", "digest-old", "{}", "settled_success", 0, "now", 1);
  database.exec("UPDATE evidence_jobs SET state='cancelled', result_seq=NULL WHERE id='job-old'");
  insertJob.run("job-new", "batch-new", 0, "run-a", "node-b", "explicit_analysis", "runtime.analysis", "evidence.stockfish_analysis", "digest-new", "{}", "settled_success", 0, "now", 1);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM evidence_jobs WHERE run_id='run-a' AND result_seq=1").get().count, 1);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM evidence_jobs WHERE id='job-old' AND result_seq IS NULL").get().count, 1);
  database.close();
});
