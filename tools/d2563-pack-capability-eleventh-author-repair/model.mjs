import crypto from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const parsedJobs = new WeakSet();
const parsedBatches = new WeakSet();
const jobKeys = ["depth", "fen", "kind", "movetime", "multiPv", "nodeId", "objectiveRequest", "runId", "schema", "timeoutMs"];
const batchKeys = ["jobs", "origin", "runId", "schema"];
const kinds = new Set(["bestline", "eval", "tablebase", "wdl"]);
const origins = new Set(["explicit_analysis", "story_completion", "run_enrichment"]);

function fail(message) {
  throw new TypeError(message);
}

function exactKeys(value, expected, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  const actual = Object.keys(value).sort();
  if (!isDeepStrictEqual(actual, expected)) fail(`${label} has unknown or missing keys`);
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) fail(`${label} must be a non-empty string`);
  return value;
}

function optionalPositive(value, label) {
  if (value !== null && (!Number.isSafeInteger(value) || value < 1)) fail(`${label} must be null or positive`);
  return value;
}

function canonical(value) {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  fail("outside canonical JSON domain");
}

function digest(prefix, value) {
  return `sha256:${crypto.createHash("sha256").update(`${prefix}\0`, "utf8").update(canonical(value), "utf8").digest("hex")}`;
}

export function parseEvidenceJobRequest(input) {
  exactKeys(input, jobKeys, "job request");
  if (input.schema !== "evidence_job_request@1") fail("unsupported job request schema");
  const runId = nonEmptyString(input.runId, "runId");
  const nodeId = nonEmptyString(input.nodeId, "nodeId");
  const fen = nonEmptyString(input.fen, "fen");
  if (!kinds.has(input.kind)) fail("unsupported evidence kind");
  const depth = optionalPositive(input.depth, "depth");
  const movetime = optionalPositive(input.movetime, "movetime");
  const multiPv = optionalPositive(input.multiPv, "multiPv");
  const timeoutMs = optionalPositive(input.timeoutMs, "timeoutMs");
  if (input.kind === "tablebase" ? depth !== null || movetime !== null : (depth === null) === (movetime === null)) {
    fail("evidence search bound does not match kind");
  }
  if (input.objectiveRequest !== null) {
    if (typeof input.objectiveRequest !== "object" || input.objectiveRequest === null || Array.isArray(input.objectiveRequest)) fail("objectiveRequest must be an object or null");
    if (input.objectiveRequest.runId !== runId || input.objectiveRequest.nodeId !== nodeId || input.objectiveRequest.fen !== fen) fail("objectiveRequest identity crossed job request");
  }
  const parsed = Object.freeze({
    schema: "evidence_job_request@1",
    runId,
    nodeId,
    fen,
    kind: input.kind,
    depth,
    movetime,
    multiPv,
    timeoutMs,
    objectiveRequest: input.objectiveRequest === null ? null : Object.freeze(structuredClone(input.objectiveRequest)),
  });
  parsedJobs.add(parsed);
  return parsed;
}

export function parseEvidenceBatchRequest(input) {
  exactKeys(input, batchKeys, "batch request");
  if (input.schema !== "evidence_batch_request@1") fail("unsupported batch request schema");
  const runId = nonEmptyString(input.runId, "runId");
  if (!origins.has(input.origin)) fail("unsupported batch origin");
  if (!Array.isArray(input.jobs) || input.jobs.length < 1 || input.jobs.length > 16) fail("batch requires 1-16 jobs");
  const jobs = Object.freeze(input.jobs.map((job) => parseEvidenceJobRequest(job)));
  if (jobs.some((job) => job.runId !== runId)) fail("job runId crossed batch request");
  const parsed = Object.freeze({ schema: "evidence_batch_request@1", runId, origin: input.origin, jobs });
  parsedBatches.add(parsed);
  return parsed;
}

export function jobRequestDigest(request) {
  if (!parsedJobs.has(request)) fail("job request must be parsed before digesting");
  return digest("chess-tabiya/evidence-job-request/v1", request);
}

export function batchRequestDigest(request) {
  if (!parsedBatches.has(request)) fail("batch request must be parsed before digesting");
  return digest("chess-tabiya/evidence-batch-request/v1", request);
}

function expectedConsumer(origin) {
  return origin === "explicit_analysis" ? "runtime.analysis" : origin === "story_completion" ? "review.story_evidence" : "runtime.background_evidence";
}

function expectedOperation(kind) {
  return kind === "tablebase" ? "evidence.tablebase_probe" : "evidence.stockfish_analysis";
}

export function validateStoredBatch({ batchRow, jobRows, nodeFenById }) {
  const batch = parseEvidenceBatchRequest(JSON.parse(batchRow.request_json));
  if (batchRow.run_id !== batch.runId || batchRow.origin !== batch.origin || batchRow.job_count !== batch.jobs.length || batchRow.request_digest !== batchRequestDigest(batch)) fail("batch columns crossed canonical request");
  const ordered = [...jobRows].sort((a, b) => a.batch_ordinal - b.batch_ordinal);
  if (ordered.length !== batch.jobs.length) fail("stored child cardinality crossed batch request");
  ordered.forEach((row, ordinal) => {
    if (row.batch_id !== batchRow.id || row.batch_ordinal !== ordinal || row.run_id !== batch.runId || row.origin !== batch.origin || row.consumer_id !== expectedConsumer(batch.origin)) fail("child columns crossed batch identity");
    const request = parseEvidenceJobRequest(JSON.parse(row.request_json));
    const expected = batch.jobs[ordinal];
    if (canonical(request) !== canonical(expected) || row.job_request_digest !== jobRequestDigest(request) || row.node_id !== request.nodeId || row.provider_operation_id !== expectedOperation(request.kind)) fail("child request crossed indexed batch member");
    if (nodeFenById.get(request.nodeId) !== request.fen) fail("job request crossed immutable node FEN");
  });
  return batch;
}

export function rewindEvidenceRow(row) {
  const cancellable = new Set(["admitted", "running", "retry_wait", "settled_success"]);
  const terminal = new Set(["settled_empty", "settled_unavailable", "cancelled", "consumed"]);
  if (terminal.has(row.state)) return row;
  if (!cancellable.has(row.state)) fail("unknown durable evidence state");
  return Object.freeze({
    ...row,
    state: "cancelled",
    lease_owner: null,
    lease_expires_at: null,
    lease_generation: row.state === "running" ? row.lease_generation + 1 : row.lease_generation,
    next_attempt_at: null,
    retry_basis_json: null,
    result_seq: null,
    settlement_json: Object.freeze({ kind: "cancelled", reason: "superseded" }),
    application_receipt_json: null,
  });
}

function evidenceRef(job) {
  return `${job.kind === "tablebase" ? "tablebase" : "engine"}:${job.id}`;
}

export function applicationReceipt({ job, settlement, fromRevision, toRevision, events }) {
  if (settlement?.kind !== "success") fail("application requires a stored success settlement");
  if (!Number.isSafeInteger(fromRevision) || toRevision !== fromRevision + 1) fail("application revision must advance exactly once");
  if (!Array.isArray(events) || events.length === 0) fail("application events required");
  const sequences = events.map((event) => event.seq);
  if (sequences.some((seq, index) => !Number.isSafeInteger(seq) || (index > 0 && seq !== sequences[index - 1] + 1))) fail("application events must be contiguous");
  const ref = evidenceRef(job);
  const attached = events[0];
  if (attached.type !== "evidence.attached" || attached.data?.nodeId !== job.nodeId || !isDeepStrictEqual(attached.data.evidenceRefs, [ref]) || !isDeepStrictEqual(attached.data.payload, settlement.payload)) fail("attached event crossed stored success");
  if (settlement.objectiveProposal === null) {
    if (events.length !== 1) fail("application emitted events beyond stored success");
  } else {
    if (events.length !== 2) fail("objective proposal requires one exact objective event");
    const objective = events[1];
    if (objective.type !== "objective.state_changed" || objective.data?.nodeId !== job.nodeId || !isDeepStrictEqual(objective.data, settlement.objectiveProposal)) fail("objective event crossed stored proposal");
    if (!objective.data.evidenceRefs.includes(ref)) fail("objective event omits job evidence reference");
  }
  return Object.freeze({
    schema: "evidence_application_receipt@1",
    jobId: job.id,
    runId: job.runId,
    nodeId: job.nodeId,
    fromRevision,
    toRevision,
    firstEventSeq: sequences[0],
    lastEventSeq: sequences.at(-1),
    eventDigest: digest("chess-tabiya/evidence-application/v1", events),
  });
}
