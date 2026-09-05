// Disposable fourteenth-author contract model for D2742-D2747. Not production behavior.
import crypto from "node:crypto";

import { jobRequestDigest, parseEvidenceJobRequest, parseRunSnapshot, validateStoredBatch } from "../d2587-pack-capability-twelfth-author-repair/model.mjs";

const runLeaseDatabases = new WeakMap();
const jobLeaseDatabases = new WeakMap();
const OBJECTIVE_STATES = new Set(["active", "preserved", "degraded", "failed", "achieved", "transitioned"]);
const ACQUISITION_KEYS = ["actualIdentity", "endpoint", "generation", "normalizedRequestDigest", "operation", "provider", "requestedAt", "requestedIdentity", "responseDigest", "retrievedAt"];

function fail(message) { throw new TypeError(message); }
function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) fail(`${label}:shape`);
}
function frozenCopy(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(frozenCopy));
  if (value !== null && typeof value === "object") return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, member]) => [key, frozenCopy(member)])));
  if (value === null || ["string", "number", "boolean"].includes(typeof value)) return value;
  fail("canonical:value");
}
function digest(prefix, value) { return `sha256:${crypto.createHash("sha256").update(`${prefix}\0${JSON.stringify(value)}`).digest("hex")}`; }
function canonicalInstant(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) fail(`${label}:instant`);
  return value;
}
function parseIdentity(value, label) {
  exactKeys(value, ["id", "version"], label);
  if (typeof value.id !== "string" || value.id.length === 0 || typeof value.version !== "string" || value.version.length === 0) fail(`${label}:value`);
  return frozenCopy(value);
}
function parseObjectiveProposal(value) {
  if (value === null) return null;
  exactKeys(value, ["evidenceRefs", "from", "nodeId", "to"], "objective-proposal");
  if (typeof value.nodeId !== "string" || value.nodeId.length === 0 || !OBJECTIVE_STATES.has(value.from) || !OBJECTIVE_STATES.has(value.to) || value.from === value.to) fail("objective-proposal:value");
  if (!Array.isArray(value.evidenceRefs) || value.evidenceRefs.length === 0 || value.evidenceRefs.some((ref) => typeof ref !== "string" || ref.length === 0) || new Set(value.evidenceRefs).size !== value.evidenceRefs.length) fail("objective-proposal:refs");
  return frozenCopy(value);
}

export function parseStoredSuccess(input) {
  exactKeys(input, ["acquisition", "kind", "objectiveProposal", "payload"], "settlement");
  if (input.kind !== "success") fail("settlement:kind");
  exactKeys(input.payload, ["kind", "source", "values"], "payload");
  if (!["bestline", "eval", "tablebase", "wdl"].includes(input.payload.kind) || !["engine_validated", "tablebase_exact"].includes(input.payload.source) || input.payload.values === null || typeof input.payload.values !== "object" || Array.isArray(input.payload.values)) fail("payload:value");
  exactKeys(input.acquisition, ACQUISITION_KEYS, "acquisition");
  const requestedAt = canonicalInstant(input.acquisition.requestedAt, "acquisition.requestedAt");
  const retrievedAt = canonicalInstant(input.acquisition.retrievedAt, "acquisition.retrievedAt");
  if (Date.parse(retrievedAt) < Date.parse(requestedAt) || typeof input.acquisition.endpoint !== "string" || input.acquisition.endpoint.length === 0 || !Number.isSafeInteger(input.acquisition.generation) || input.acquisition.generation < 1 || !/^sha256:[0-9a-f]{64}$/u.test(input.acquisition.normalizedRequestDigest) || !/^sha256:[0-9a-f]{64}$/u.test(input.acquisition.responseDigest)) fail("acquisition:value");
  const acquisition = frozenCopy({ ...input.acquisition, requestedAt, retrievedAt, requestedIdentity: parseIdentity(input.acquisition.requestedIdentity, "acquisition.requestedIdentity"), actualIdentity: parseIdentity(input.acquisition.actualIdentity, "acquisition.actualIdentity") });
  return frozenCopy({ kind: "success", payload: input.payload, objectiveProposal: parseObjectiveProposal(input.objectiveProposal), acquisition });
}

function expectedProvider(request) {
  return request.kind === "tablebase" ? { operation: "syzygy.position@1", provider: "syzygy", source: "tablebase_exact" } : { operation: "stockfish.position_evaluation@1", provider: "stockfish", source: "engine_validated" };
}
function assertSuccessForJob(success, request, row) {
  const expected = expectedProvider(request);
  if (success.payload.kind !== request.kind || success.payload.source !== expected.source || success.acquisition.operation !== expected.operation || success.acquisition.provider !== expected.provider || success.acquisition.generation !== row.lease_generation || success.acquisition.normalizedRequestDigest !== row.job_request_digest || row.provider_operation_id !== (request.kind === "tablebase" ? "evidence.tablebase_probe" : "evidence.stockfish_analysis")) fail("settlement:job-crossed");
  if (success.objectiveProposal !== null) {
    const ref = `${request.kind === "tablebase" ? "tablebase" : "engine"}:${row.id}`;
    if (request.objectiveRequest === null || success.objectiveProposal.nodeId !== request.nodeId || !success.objectiveProposal.evidenceRefs.includes(ref)) fail("settlement:objective-crossed");
  }
}

export function acquireRunLease(database, { runId, owner }) {
  const row = database.prepare("SELECT revision FROM evidence_run_images WHERE run_id=?").get(runId);
  if (!row || typeof owner !== "string" || owner.length === 0) fail("run-lease:missing");
  const lease = Object.freeze({ runId, owner, revision: row.revision });
  runLeaseDatabases.set(lease, database);
  return lease;
}
export function loadJobLease(database, { jobId, owner }) {
  const row = database.prepare("SELECT run_id,lease_owner,lease_generation,job_request_digest,state FROM evidence_jobs WHERE id=?").get(jobId);
  if (!row || row.state !== "running" || row.lease_owner !== owner) fail("job-lease:missing");
  const lease = Object.freeze({ jobId, runId: row.run_id, owner, generation: row.lease_generation, requestDigest: row.job_request_digest });
  jobLeaseDatabases.set(lease, database);
  return lease;
}

export function settleEvidenceJob(database, input) {
  exactKeys(input, ["lease", "settlement"], "settle-input");
  const { lease } = input;
  if (jobLeaseDatabases.get(lease) !== database) fail("settle:database-authority");
  database.exec("BEGIN IMMEDIATE");
  try {
    const row = database.prepare("SELECT id,run_id,provider_operation_id,job_request_digest,request_json,state,lease_owner,lease_generation FROM evidence_jobs WHERE id=?").get(lease.jobId);
    if (!row || row.run_id !== lease.runId || row.state !== "running" || row.lease_owner !== lease.owner || row.lease_generation !== lease.generation || row.job_request_digest !== lease.requestDigest) fail("settle:lease-cas");
    const request = parseEvidenceJobRequest(JSON.parse(row.request_json));
    if (jobRequestDigest(request) !== row.job_request_digest || request.runId !== row.run_id) fail("settle:request-corrupt");
    const parsed = parseStoredSuccess(input.settlement);
    assertSuccessForJob(parsed, request, row);
    database.prepare("INSERT INTO evidence_result_sequences(run_id,next_result_seq) VALUES (?,1) ON CONFLICT(run_id) DO NOTHING").run(lease.runId);
    const sequence = database.prepare("SELECT next_result_seq FROM evidence_result_sequences WHERE run_id=?").get(lease.runId).next_result_seq;
    const updated = database.prepare(`UPDATE evidence_jobs SET state='settled_success',result_seq=?,settled_at='now',settlement_json=?,lease_owner=NULL,lease_expires_at=NULL WHERE id=? AND run_id=? AND state='running' AND lease_owner=? AND lease_generation=? AND job_request_digest=?`).run(sequence, JSON.stringify(parsed), lease.jobId, lease.runId, lease.owner, lease.generation, lease.requestDigest);
    if (updated.changes !== 1) fail("settle:cas");
    const advanced = database.prepare("UPDATE evidence_result_sequences SET next_result_seq=next_result_seq+1 WHERE run_id=? AND next_result_seq=?").run(lease.runId, sequence);
    if (advanced.changes !== 1) fail("settle:sequence-cas");
    database.exec("COMMIT");
    return sequence;
  } catch (error) { try { database.exec("ROLLBACK"); } catch { /* retain primary error */ } throw error; }
}

function registeredGuard({ run, job, evidenceRef }) {
  if (run.feedbackPolicy !== "immediate_guard") return [];
  return [{ type: "feedback.generated", data: { nodeId: job.nodeId, evidenceRefs: [evidenceRef], message: "registered guard result" } }];
}
function validateReceipt(receipt, retainedRun, job, suffix) {
  exactKeys(receipt, ["eventDigest", "firstEventSeq", "fromRevision", "jobId", "lastEventSeq", "nodeId", "runId", "schema", "toRevision"], "receipt");
  const nodeId = job.nodeId ?? job.node_id;
  if (receipt.schema !== "evidence_application_receipt@1" || receipt.jobId !== job.id || receipt.runId !== retainedRun.runId || receipt.nodeId !== nodeId || receipt.toRevision !== retainedRun.revision || receipt.fromRevision !== retainedRun.revision - 1 || receipt.toRevision !== receipt.fromRevision + 1 || receipt.firstEventSeq !== suffix[0]?.seq || receipt.lastEventSeq !== suffix.at(-1)?.seq || receipt.eventDigest !== digest("chess-tabiya/evidence-application/v1", suffix)) fail("receipt:crossed");
}
function loadAndValidateStoredJob(row, run) {
  const request = parseEvidenceJobRequest(JSON.parse(row.request_json));
  if (jobRequestDigest(request) !== row.job_request_digest || request.runId !== row.run_id || request.nodeId !== row.node_id) fail("apply:request-corrupt");
  const node = run.nodes.find((candidate) => candidate.id === request.nodeId);
  if (!node || node.fen !== request.fen) fail("apply:node-join");
  const settlement = parseStoredSuccess(JSON.parse(row.settlement_json));
  assertSuccessForJob(settlement, request, row);
  return { request, settlement };
}

export function applyStoredEvidenceAndConsumeJob(database, input) {
  exactKeys(input, ["jobId", "runLease"], "apply-input");
  const { runLease, jobId } = input;
  if (runLeaseDatabases.get(runLease) !== database) fail("apply:database-authority");
  database.exec("BEGIN IMMEDIATE");
  try {
    const image = database.prepare("SELECT revision,run_json FROM evidence_run_images WHERE run_id=?").get(runLease.runId);
    if (!image || image.revision !== runLease.revision) fail("apply:run-cas");
    const beforeRun = parseRunSnapshot(JSON.parse(image.run_json));
    const row = database.prepare("SELECT id,run_id,node_id,provider_operation_id,job_request_digest,request_json,state,settlement_json,lease_generation,application_receipt_json FROM evidence_jobs WHERE id=? AND run_id=?").get(jobId, runLease.runId);
    if (!row) fail("apply:job-missing");
    const { request, settlement } = loadAndValidateStoredJob(row, beforeRun);
    if (row.state === "consumed") {
      const receipt = JSON.parse(row.application_receipt_json);
      const suffix = beforeRun.events.filter((event) => event.seq >= receipt.firstEventSeq && event.seq <= receipt.lastEventSeq);
      validateReceipt(receipt, beforeRun, row, suffix);
      database.exec("COMMIT");
      return Object.freeze({ replay: true, receipt: frozenCopy(receipt), afterRun: beforeRun });
    }
    if (row.state !== "settled_success" || row.application_receipt_json !== null) fail("apply:job-state");
    const ref = `${request.kind === "tablebase" ? "tablebase" : "engine"}:${row.id}`;
    const appended = [{ type: "evidence.attached", data: { nodeId: request.nodeId, evidenceRefs: [ref], payload: settlement.payload } }];
    if (settlement.objectiveProposal !== null) appended.push({ type: "objective.state_changed", data: settlement.objectiveProposal });
    appended.push(...registeredGuard({ run: beforeRun, job: request, evidenceRef: ref }));
    const first = beforeRun.events.length + 1;
    const suffix = appended.map((event, index) => ({ seq: first + index, ...event }));
    const afterRun = parseRunSnapshot({ ...beforeRun, revision: beforeRun.revision + 1, events: [...beforeRun.events, ...suffix] });
    const receipt = frozenCopy({ schema: "evidence_application_receipt@1", jobId: row.id, runId: row.run_id, nodeId: row.node_id, fromRevision: beforeRun.revision, toRevision: afterRun.revision, firstEventSeq: first, lastEventSeq: suffix.at(-1).seq, eventDigest: digest("chess-tabiya/evidence-application/v1", suffix) });
    validateReceipt(receipt, afterRun, row, suffix);
    const runUpdated = database.prepare("UPDATE evidence_run_images SET revision=?,run_json=? WHERE run_id=? AND revision=?").run(afterRun.revision, JSON.stringify(afterRun), runLease.runId, runLease.revision);
    const jobUpdated = database.prepare("UPDATE evidence_jobs SET state='consumed',consumed_at='now',application_receipt_json=? WHERE id=? AND state='settled_success' AND job_request_digest=?").run(JSON.stringify(receipt), row.id, row.job_request_digest);
    if (runUpdated.changes !== 1 || jobUpdated.changes !== 1) fail("apply:cas");
    database.exec("COMMIT");
    return Object.freeze({ replay: false, receipt, afterRun });
  } catch (error) { try { database.exec("ROLLBACK"); } catch { /* retain primary error */ } throw error; }
}

export function replayStoredBatch(database, input) {
  exactKeys(input, ["batchId"], "replay-input");
  const batchRow = database.prepare("SELECT * FROM evidence_job_batches WHERE id=?").get(input.batchId);
  if (!batchRow) fail("replay:batch-missing");
  const image = database.prepare("SELECT run_json FROM evidence_run_images WHERE run_id=?").get(batchRow.run_id);
  if (!image) fail("replay:run-missing");
  const runSnapshot = parseRunSnapshot(JSON.parse(image.run_json));
  const jobRows = database.prepare("SELECT * FROM evidence_jobs WHERE batch_id=? ORDER BY batch_ordinal").all(input.batchId);
  validateStoredBatch({ batchRow, jobRows, runSnapshot });
  return Object.freeze({ batchId: input.batchId, jobIds: Object.freeze(jobRows.map((row) => row.id)) });
}
