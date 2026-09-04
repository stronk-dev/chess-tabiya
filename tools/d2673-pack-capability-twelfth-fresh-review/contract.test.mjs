import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { Worker } from "node:worker_threads";

import {
  applyEvidenceAndConsumeJob,
  deriveRecordedGuardOutcome,
  parseRunSnapshot,
  settleSuccessWithSequence,
} from "../d2587-pack-capability-twelfth-author-repair/model.mjs";

const rfc = readFileSync("rfc/pack-capability-contract.md", "utf8");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n### §6\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";
const fen = "8/8/8/8/8/8/8/K6k w - - 0 1";

function run(feedbackPolicy = "attempt_end") {
  return parseRunSnapshot({ runId: "run-a", revision: 4, feedbackPolicy, nodes: [{ id: "node-a", fen }], events: [] });
}

function job(nodeId = "node-a") {
  return { id: "job-a", runId: "run-a", nodeId, kind: "eval" };
}

function incompleteSettlement() {
  return { kind: "success", payload: { kind: "eval", values: { cp: 10 } }, objectiveProposal: null, acquisition: {} };
}

function batch() {
  return {
    schema: "evidence_batch_request@1",
    runId: "run-a",
    origin: "explicit_analysis",
    jobs: [{
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
    }],
  };
}

async function launchWorker(path, key) {
  const gate = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
  const state = new Int32Array(gate);
  const worker = new Worker(
    new URL("../d2587-pack-capability-twelfth-author-repair/concurrent-worker.mjs", import.meta.url),
    { workerData: { path, gate, key, request: JSON.stringify(batch()) } },
  );
  const outcome = new Promise((resolve, reject) => {
    worker.once("message", resolve);
    worker.once("error", reject);
    worker.once("exit", (code) => { if (code !== 0) reject(new Error(`worker exited ${code}`)); });
  });
  while (Atomics.load(state, 1) < 1) await new Promise((resolve) => setTimeout(resolve, 1));
  Atomics.store(state, 0, 1);
  Atomics.notify(state, 0, 1);
  return outcome;
}

test("D2673 caller-supplied guard output is branded without invoking the registered guard", () => {
  const beforeRun = run("immediate_guard");
  const empty = deriveRecordedGuardOutcome({ beforeRun, job: job(), emitted: [] });
  assert.deepEqual(empty.emitted, []);
  const invented = deriveRecordedGuardOutcome({
    beforeRun,
    job: job(),
    emitted: [{
      type: "feedback.generated",
      data: { nodeId: "node-a", evidenceRefs: ["engine:job-a"], message: "caller chose this feedback", undeclared: true },
    }],
  });
  assert.equal(invented.emitted[0].data.message, "caller chose this feedback");
  assert.equal(deriveRecordedGuardOutcome.length, 1);
});

test("D2674 application accepts an invented job for a node absent from the parsed run", () => {
  const result = applyEvidenceAndConsumeJob({
    beforeRun: run(),
    job: job("node-never-in-run"),
    settlement: incompleteSettlement(),
  });
  assert.equal(result.afterRun.events[0].data.nodeId, "node-never-in-run");
  assert.equal(result.consumedJob.state, "consumed");
  assert.equal(result.beforeRun.nodes.some((node) => node.id === "node-never-in-run"), false);
});

test("D2675 success settlement parsing is bypassed by both author operations", () => {
  const runtimeTypes = readFileSync("packages/runtime/src/types.ts", "utf8");
  assert.match(runtimeTypes, /interface EvidencePayload[\s\S]*readonly source: EvidenceSource/u);
  const result = applyEvidenceAndConsumeJob({ beforeRun: run(), job: job(), settlement: incompleteSettlement() });
  assert.equal(Object.hasOwn(result.afterRun.events[0].data.payload, "source"), false);
  assert.deepEqual(result.consumedJob.settlement.acquisition, {});
});

test("D2676 settlement ignores the required lease generation owner and request receipt", () => {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  database.exec(ddl);
  database.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
  database.prepare(`INSERT INTO evidence_job_batches
    (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at)
    VALUES (?,?,?,?,?,?,?,?)`).run("batch-a", "run-a", "explicit_analysis", "key", "{}", "digest", 1, "now");
  database.prepare(`INSERT INTO evidence_jobs
    (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,
     job_request_digest,request_json,state,attempt_count,admitted_at,lease_owner,lease_expires_at,lease_generation)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      "job-a", "batch-a", 0, "run-a", "node-a", "explicit_analysis", "runtime.analysis",
      "evidence.stockfish_analysis", "actual-request-digest", "{}", "running", 1, "now",
      "worker-that-owns-the-lease", "later", 9,
    );
  assert.equal(settleSuccessWithSequence(database, {
    jobId: "job-a",
    runId: "run-a",
    settlement: incompleteSettlement(),
    inventedIgnoredFields: true,
  }), 1);
  const row = database.prepare("SELECT state,result_seq,lease_owner,lease_generation FROM evidence_jobs WHERE id='job-a'").get();
  assert.deepEqual({ ...row }, { state: "settled_success", result_seq: 1, lease_owner: "worker-that-owns-the-lease", lease_generation: 9 });
  database.close();
});

test("D2677 idempotent replay returns a corrupted stored child without validation", async () => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-f3-replay-corruption-"));
  const path = join(directory, "replay.sqlite");
  try {
    const database = new DatabaseSync(path);
    database.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
    database.exec(ddl);
    database.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
    database.close();
    const first = await launchWorker(path, "same-key");
    assert.equal(first.winner, true);
    const corrupt = new DatabaseSync(path);
    corrupt.prepare("UPDATE evidence_jobs SET request_json='{}', job_request_digest='forged' WHERE id=?").run(first.jobIds[0]);
    corrupt.close();
    const replay = await launchWorker(path, "same-key");
    assert.equal(replay.winner, false);
    assert.deepEqual(replay.jobIds, first.jobIds);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the RFC promises all five boundaries crossed by the author model", () => {
  assert.match(rfc, /invokes the registered\s+`applyRecordedEngineGuard` authority/u);
  assert.match(rfc, /parsed CAS-owned before-run, stored job and\s+stored success/u);
  assert.match(rfc, /Success persists payload,\s+acquisition and `objectiveProposal`/u);
  assert.match(rfc, /lease\/generation\/request check/u);
  assert.match(rfc, /response loss followed by replay[\s\S]*returns the stored batch and ids/iu);
});
