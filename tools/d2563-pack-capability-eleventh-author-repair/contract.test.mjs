// Disposable eleventh author model for D2563-D2569. It is not production behavior.
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
  rewindEvidenceRow,
  validateStoredBatch,
} from "./model.mjs";

const rfc = readFileSync("rfc/pack-capability-contract.md", "utf8");
const section = rfc.match(/#### §5\.2 Queued evidence([\s\S]*?)\n### §6\./u)?.[1] ?? "";
const ddl = section.match(/```sql\n([\s\S]*?)\n```/u)?.[1] ?? "";

function job(runId = "run-a", overrides = {}) {
  return { schema: "evidence_job_request@1", runId, nodeId: "node-a", fen: "8/8/8/8/8/8/8/K6k w - - 0 1", kind: "eval", depth: 12, movetime: null, multiPv: null, timeoutMs: null, objectiveRequest: null, ...overrides };
}

function batch(jobs = [job()]) {
  return { schema: "evidence_batch_request@1", runId: "run-a", origin: "explicit_analysis", jobs };
}

function rows(parsed) {
  const batchRow = { id: "batch-a", run_id: parsed.runId, origin: parsed.origin, request_json: JSON.stringify(parsed), request_digest: batchRequestDigest(parsed), job_count: parsed.jobs.length };
  const jobRows = parsed.jobs.map((request, batch_ordinal) => ({ id: `job-${batch_ordinal}`, batch_id: batchRow.id, batch_ordinal, run_id: parsed.runId, node_id: request.nodeId, origin: parsed.origin, consumer_id: "runtime.analysis", provider_operation_id: request.kind === "tablebase" ? "evidence.tablebase_probe" : "evidence.stockfish_analysis", job_request_digest: jobRequestDigest(request), request_json: JSON.stringify(request) }));
  return { batchRow, jobRows };
}

test("D2563/D2564: the strict protocol makes lease and application receipts mandatory", () => {
  const protocol = readFileSync("tools/d2563-pack-capability-eleventh-author-repair/protocol.typecheck.ts", "utf8");
  assert.match(protocol, /state: "running"; leaseExpiresAt: string; lease: LeaseReceipt/u);
  assert.match(protocol, /state: "consumed"[\s\S]*applicationReceipt: ApplicationReceipt/u);
  assert.match(protocol, /@ts-expect-error a running job has no owner-only authority/u);
  assert.match(protocol, /@ts-expect-error consumed success cannot omit its application receipt/u);
});

test("D2565: only parsed closed request values can be digested", () => {
  const parsed = parseEvidenceJobRequest(job());
  assert.match(jobRequestDigest(parsed), /^sha256:[0-9a-f]{64}$/u);
  assert.throws(() => parseEvidenceJobRequest({ ...job(), extra: true }), /unknown or missing keys/u);
  assert.throws(() => parseEvidenceJobRequest({ ...job(), schema: "wrong" }), /unsupported job request schema/u);
  assert.throws(() => jobRequestDigest(job()), /must be parsed/u);
  assert.throws(() => parseEvidenceBatchRequest(batch([job("run-b")])), /crossed batch/u);
});

test("D2566: the storage join binds columns, requests, digests, node and FEN", () => {
  const parsed = parseEvidenceBatchRequest(batch());
  const valid = rows(parsed);
  const nodes = new Map([["node-a", parsed.jobs[0].fen]]);
  assert.deepEqual(validateStoredBatch({ ...valid, nodeFenById: nodes }), parsed);
  assert.throws(() => validateStoredBatch({ batchRow: { ...valid.batchRow, run_id: "run-b" }, jobRows: valid.jobRows, nodeFenById: nodes }), /batch columns crossed/u);
  assert.throws(() => validateStoredBatch({ batchRow: valid.batchRow, jobRows: [{ ...valid.jobRows[0], request_json: JSON.stringify(job("run-b")) }], nodeFenById: nodes }), /job runId crossed|child request crossed/u);
  assert.throws(() => validateStoredBatch({ ...valid, nodeFenById: new Map([["node-a", "different fen"]]) }), /immutable node FEN/u);
});

test("D2567: rewind mutates the complete cancellable row and preserves terminal rows", () => {
  const running = Object.freeze({ state: "running", lease_owner: "worker-a", lease_expires_at: "later", lease_generation: 4, next_attempt_at: null, retry_basis_json: null, result_seq: null, settlement_json: null, application_receipt_json: null });
  const cancelled = rewindEvidenceRow(running);
  assert.deepEqual(cancelled, { ...running, state: "cancelled", lease_owner: null, lease_expires_at: null, lease_generation: 5, next_attempt_at: null, retry_basis_json: null, result_seq: null, settlement_json: { kind: "cancelled", reason: "superseded" }, application_receipt_json: null });
  const success = Object.freeze({ ...running, state: "settled_success", lease_owner: null, lease_expires_at: null, result_seq: 7, settlement_json: { kind: "success", payload: {} } });
  assert.deepEqual(rewindEvidenceRow(success), { ...success, state: "cancelled", result_seq: null, settlement_json: { kind: "cancelled", reason: "superseded" } });
  for (const state of ["settled_empty", "settled_unavailable", "cancelled", "consumed"]) {
    const row = Object.freeze({ state, audit: state });
    assert.equal(rewindEvidenceRow(row), row);
  }
});

test("D2568: the receipt binds forward revision and exact stored-success events", () => {
  const request = { id: "job-a", runId: "run-a", nodeId: "node-a", kind: "eval" };
  const settlement = { kind: "success", payload: { kind: "eval", values: { cp: 10 } }, objectiveProposal: null, acquisition: {} };
  const events = [{ seq: 7, type: "evidence.attached", data: { nodeId: "node-a", evidenceRefs: ["engine:job-a"], payload: settlement.payload } }];
  const receipt = applicationReceipt({ job: request, settlement, fromRevision: 3, toRevision: 4, events });
  assert.deepEqual([receipt.runId, receipt.nodeId, receipt.firstEventSeq, receipt.lastEventSeq], ["run-a", "node-a", 7, 7]);
  assert.throws(() => applicationReceipt({ job: request, settlement, fromRevision: 4, toRevision: 3, events }), /advance exactly once/u);
  assert.throws(() => applicationReceipt({ job: request, settlement, fromRevision: 3, toRevision: 4, events: [{ ...events[0], data: { ...events[0].data, nodeId: "node-b" } }] }), /crossed stored success/u);
  assert.throws(() => applicationReceipt({ job: request, settlement, fromRevision: 3, toRevision: 4, events: [...events, { seq: 8, type: "unrelated", data: {} }] }), /beyond stored success/u);
});

test("D2569: concurrent first flight constructs UUIDs once and replay constructs none", async () => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-f3-eleventh-"));
  const path = join(directory, "race.sqlite");
  const database = new DatabaseSync(path);
  database.exec("PRAGMA foreign_keys=ON; CREATE TABLE drill_runs (id TEXT PRIMARY KEY) STRICT;");
  database.exec(ddl);
  database.exec("INSERT INTO drill_runs(id) VALUES ('run-a')");
  database.close();
  const request = JSON.stringify(batch());
  const gate = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 2);
  const start = new Int32Array(gate);
  const launch = () => new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./concurrent-worker.mjs", import.meta.url), { workerData: { path, gate, key: "key-a", request } });
    worker.once("message", resolve);
    worker.once("error", reject);
  });
  try {
    const pending = [launch(), launch()];
    while (Atomics.load(start, 1) < 2) await new Promise((resolve) => setTimeout(resolve, 1));
    Atomics.store(start, 0, 1);
    Atomics.notify(start, 0, 2);
    const results = await Promise.all(pending);
    assert.equal(new Set(results.map((result) => result.id)).size, 1);
    assert.equal(results.filter((result) => result.winner).length, 1);
    assert.deepEqual(results.map((result) => result.constructedIds).sort(), [0, 2]);
    assert.match(results[0].id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
    assert.deepEqual(results[0].jobIds, results[1].jobIds);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
