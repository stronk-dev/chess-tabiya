import crypto from "node:crypto";

import {
  parseEvidenceJobRequest,
  parseRunSnapshot,
  validateStoredBatch,
} from "../d2587-pack-capability-twelfth-author-repair/model.mjs";

const runLeases = new WeakSet();
const jobLeases = new WeakSet();

function fail(message) {
  throw new TypeError(message);
}

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) fail(`${label}:shape`);
}

function frozenCopy(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(frozenCopy));
  if (value !== null && typeof value === "object") return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, member]) => [key, frozenCopy(member)])));
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  fail("canonical:value");
}

function digest(prefix, value) {
  return `sha256:${crypto.createHash("sha256").update(`${prefix}\0${JSON.stringify(value)}`).digest("hex")}`;
}

const ACQUISITION_KEYS = ["actualIdentity", "endpoint", "generation", "normalizedRequestDigest", "operation", "provider", "requestedAt", "requestedIdentity", "responseDigest", "retrievedAt"];

export function parseStoredSuccess(input) {
  exactKeys(input, ["acquisition", "kind", "objectiveProposal", "payload"], "settlement");
  if (input.kind !== "success") fail("settlement:kind");
  exactKeys(input.payload, ["kind", "source", "values"], "payload");
  if (!["bestline", "eval", "tablebase", "wdl"].includes(input.payload.kind) ||
      !["engine_validated", "human_model_predicted", "tablebase_exact"].includes(input.payload.source) ||
      input.payload.values === null || typeof input.payload.values !== "object" || Array.isArray(input.payload.values)) fail("payload:value");
  exactKeys(input.acquisition, ACQUISITION_KEYS, "acquisition");
  if (input.acquisition.operation !== "stockfish.position_evaluation@1" || input.acquisition.provider !== "stockfish" ||
      !Number.isSafeInteger(input.acquisition.generation) || input.acquisition.generation < 1 ||
      !/^sha256:[0-9a-f]{64}$/u.test(input.acquisition.normalizedRequestDigest) ||
      !/^sha256:[0-9a-f]{64}$/u.test(input.acquisition.responseDigest)) fail("acquisition:value");
  if (input.objectiveProposal !== null) fail("settlement:objective-fixture-not-modeled");
  return frozenCopy(input);
}

export function acquireRunLease(database, { runId, owner }) {
  const row = database.prepare("SELECT revision FROM evidence_run_images WHERE run_id=?").get(runId);
  if (!row || typeof owner !== "string" || owner.length === 0) fail("run-lease:missing");
  const lease = Object.freeze({ runId, owner, revision: row.revision });
  runLeases.add(lease);
  return lease;
}

export function loadJobLease(database, { jobId, owner }) {
  const row = database.prepare("SELECT run_id,lease_owner,lease_generation,job_request_digest,state FROM evidence_jobs WHERE id=?").get(jobId);
  if (!row || row.state !== "running" || row.lease_owner !== owner) fail("job-lease:missing");
  const lease = Object.freeze({ jobId, runId: row.run_id, owner, generation: row.lease_generation, requestDigest: row.job_request_digest });
  jobLeases.add(lease);
  return lease;
}

export function settleEvidenceJob(database, input) {
  exactKeys(input, ["lease", "settlement"], "settle-input");
  const { lease, settlement } = input;
  if (!jobLeases.has(lease)) fail("settle:lease");
  const parsed = parseStoredSuccess(settlement);
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("INSERT INTO evidence_result_sequences(run_id,next_result_seq) VALUES (?,1) ON CONFLICT(run_id) DO NOTHING").run(lease.runId);
    const sequence = database.prepare("SELECT next_result_seq FROM evidence_result_sequences WHERE run_id=?").get(lease.runId).next_result_seq;
    const updated = database.prepare(`UPDATE evidence_jobs SET state='settled_success',result_seq=?,settled_at='now',settlement_json=?,lease_owner=NULL,lease_expires_at=NULL
      WHERE id=? AND run_id=? AND state='running' AND lease_owner=? AND lease_generation=? AND job_request_digest=?`).run(
      sequence, JSON.stringify(parsed), lease.jobId, lease.runId, lease.owner, lease.generation, lease.requestDigest,
    );
    if (updated.changes !== 1) fail("settle:cas");
    database.prepare("UPDATE evidence_result_sequences SET next_result_seq=next_result_seq+1 WHERE run_id=? AND next_result_seq=?").run(lease.runId, sequence);
    database.exec("COMMIT");
    return sequence;
  } catch (error) {
    try { database.exec("ROLLBACK"); } catch { /* retain primary error */ }
    throw error;
  }
}

function registeredGuard({ run, job, evidenceRef }) {
  if (run.feedbackPolicy !== "immediate_guard") return [];
  return [{ type: "feedback.generated", data: { nodeId: job.nodeId, evidenceRefs: [evidenceRef], message: "registered guard result" } }];
}

function validateReceipt(receipt, run, job, suffix) {
  exactKeys(receipt, ["eventDigest", "firstEventSeq", "fromRevision", "jobId", "lastEventSeq", "nodeId", "runId", "schema", "toRevision"], "receipt");
  if (receipt.schema !== "evidence_application_receipt@1" || receipt.jobId !== job.id || receipt.runId !== run.runId || receipt.nodeId !== job.nodeId ||
      receipt.toRevision !== receipt.fromRevision + 1 || receipt.firstEventSeq !== suffix[0]?.seq || receipt.lastEventSeq !== suffix.at(-1)?.seq ||
      receipt.eventDigest !== digest("chess-tabiya/evidence-application/v1", suffix)) fail("receipt:crossed");
}

export function applyStoredEvidenceAndConsumeJob(database, input) {
  exactKeys(input, ["jobId", "runLease"], "apply-input");
  const { runLease, jobId } = input;
  if (!runLeases.has(runLease)) fail("apply:run-lease");
  database.exec("BEGIN IMMEDIATE");
  try {
    const image = database.prepare("SELECT revision,run_json FROM evidence_run_images WHERE run_id=?").get(runLease.runId);
    if (!image || image.revision !== runLease.revision) fail("apply:run-cas");
    const beforeRun = parseRunSnapshot(JSON.parse(image.run_json));
    const row = database.prepare("SELECT id,run_id,node_id,request_json,state,settlement_json FROM evidence_jobs WHERE id=? AND run_id=?").get(jobId, runLease.runId);
    if (!row) fail("apply:job-missing");
    if (row.state === "consumed") {
      const receipt = JSON.parse(database.prepare("SELECT application_receipt_json FROM evidence_jobs WHERE id=?").get(jobId).application_receipt_json);
      const suffix = beforeRun.events.filter((event) => event.seq >= receipt.firstEventSeq && event.seq <= receipt.lastEventSeq);
      validateReceipt(receipt, beforeRun, { id: row.id, nodeId: row.node_id }, suffix);
      database.exec("COMMIT");
      return Object.freeze({ replay: true, receipt: frozenCopy(receipt), afterRun: beforeRun });
    }
    if (row.state !== "settled_success") fail("apply:job-state");
    const request = parseEvidenceJobRequest(JSON.parse(row.request_json));
    const node = beforeRun.nodes.find((candidate) => candidate.id === request.nodeId);
    if (!node || node.fen !== request.fen || row.node_id !== request.nodeId || row.run_id !== request.runId) fail("apply:node-join");
    const settlement = parseStoredSuccess(JSON.parse(row.settlement_json));
    const ref = `${request.kind === "tablebase" ? "tablebase" : "engine"}:${row.id}`;
    const appended = [{ type: "evidence.attached", data: { nodeId: request.nodeId, evidenceRefs: [ref], payload: settlement.payload } }, ...registeredGuard({ run: beforeRun, job: request, evidenceRef: ref })];
    const first = beforeRun.events.length + 1;
    const suffix = appended.map((event, index) => ({ seq: first + index, ...event }));
    const afterRun = parseRunSnapshot({ ...beforeRun, revision: beforeRun.revision + 1, events: [...beforeRun.events, ...suffix] });
    const receipt = frozenCopy({ schema: "evidence_application_receipt@1", jobId: row.id, runId: row.run_id, nodeId: row.node_id, fromRevision: beforeRun.revision, toRevision: afterRun.revision, firstEventSeq: first, lastEventSeq: suffix.at(-1).seq, eventDigest: digest("chess-tabiya/evidence-application/v1", suffix) });
    const runUpdated = database.prepare("UPDATE evidence_run_images SET revision=?,run_json=? WHERE run_id=? AND revision=?").run(afterRun.revision, JSON.stringify(afterRun), runLease.runId, runLease.revision);
    const jobUpdated = database.prepare("UPDATE evidence_jobs SET state='consumed',consumed_at='now',application_receipt_json=? WHERE id=? AND state='settled_success'").run(JSON.stringify(receipt), row.id);
    if (runUpdated.changes !== 1 || jobUpdated.changes !== 1) fail("apply:cas");
    database.exec("COMMIT");
    return Object.freeze({ replay: false, receipt, afterRun });
  } catch (error) {
    try { database.exec("ROLLBACK"); } catch { /* retain primary error */ }
    throw error;
  }
}

export function replayStoredBatch(database, input) {
  exactKeys(input, ["batchId", "runSnapshot"], "replay-input");
  const { batchId, runSnapshot } = input;
  const batchRow = database.prepare("SELECT * FROM evidence_job_batches WHERE id=?").get(batchId);
  if (!batchRow) fail("replay:batch-missing");
  const jobRows = database.prepare("SELECT * FROM evidence_jobs WHERE batch_id=? ORDER BY batch_ordinal").all(batchId);
  validateStoredBatch({ batchRow, jobRows, runSnapshot });
  return Object.freeze({ batchId, jobIds: Object.freeze(jobRows.map((row) => row.id)) });
}
