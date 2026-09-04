// Disposable twelfth-author contract model for D2587-D2592. Not production behavior.
import crypto from "node:crypto";
import { isDeepStrictEqual } from "node:util";

const parsedJobs = new WeakSet();
const parsedBatches = new WeakSet();
const parsedRuns = new WeakSet();
const guardOutcomes = new WeakSet();
const applicationResults = new WeakSet();

const JOB_KEYS = ["depth", "fen", "kind", "movetime", "multiPv", "nodeId", "objectiveRequest", "runId", "schema", "timeoutMs"];
const BATCH_KEYS = ["jobs", "origin", "runId", "schema"];
const OBJECTIVE_KEYS = ["evidenceRefs", "fen", "nodeId", "objectiveState", "packDigest", "packId", "policyConfig", "runId"];
const POLICY_KEYS = ["locus", "seedMode"];
const LOCUS_KEYS = ["engineIds", "executedAt", "modelIds"];
const VERSIONED_POLICY_KEYS = ["id", "version"];
const RUN_KEYS = ["events", "feedbackPolicy", "nodes", "revision", "runId"];
const NODE_KEYS = ["fen", "id"];
const EVENT_KEYS = ["data", "seq", "type"];
const KINDS = new Set(["bestline", "eval", "tablebase", "wdl"]);
const ORIGINS = new Set(["explicit_analysis", "story_completion", "run_enrichment"]);
const OBJECTIVE_STATES = new Set(["active", "preserved", "degraded", "failed", "achieved", "transitioned"]);
const FEEDBACK_POLICIES = new Set(["delayed_checkpoint", "segment_end", "attempt_end", "immediate_guard"]);

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

function nonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) fail(`${label} must be a non-negative safe integer`);
  return value;
}

function optionalPositive(value, label) {
  if (value !== null && (!Number.isSafeInteger(value) || value < 1)) fail(`${label} must be null or positive`);
  return value;
}

function deepCopyFreeze(value) {
  if (Array.isArray(value)) return Object.freeze(value.map(deepCopyFreeze));
  if (value !== null && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, member]) => [key, deepCopyFreeze(member)])));
  }
  if (["string", "number", "boolean", "undefined"].includes(typeof value) || value === null) return value;
  fail("value is outside the immutable data domain");
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

function parseVersionedPolicies(input, label) {
  if (!Array.isArray(input)) fail(`${label} must be an array`);
  return Object.freeze(input.map((entry, index) => {
    exactKeys(entry, VERSIONED_POLICY_KEYS, `${label}[${index}]`);
    return Object.freeze({ id: nonEmptyString(entry.id, `${label}[${index}].id`), version: nonEmptyString(entry.version, `${label}[${index}].version`) });
  }));
}

function parseObjectiveRequest(input, identity) {
  exactKeys(input, OBJECTIVE_KEYS, "objective request");
  if (input.runId !== identity.runId || input.nodeId !== identity.nodeId || input.fen !== identity.fen) fail("objectiveRequest identity crossed job request");
  const packId = nonEmptyString(input.packId, "objectiveRequest.packId");
  const packDigest = nonEmptyString(input.packDigest, "objectiveRequest.packDigest");
  if (!OBJECTIVE_STATES.has(input.objectiveState)) fail("objectiveRequest objectiveState is invalid");
  if (!Array.isArray(input.evidenceRefs) || input.evidenceRefs.some((ref) => typeof ref !== "string" || ref.length === 0)) fail("objectiveRequest evidenceRefs are invalid");
  exactKeys(input.policyConfig, POLICY_KEYS, "objectiveRequest.policyConfig");
  if (!new Set(["fixed", "per_run", "per_branch"]).has(input.policyConfig.seedMode)) fail("objectiveRequest seedMode is invalid");
  exactKeys(input.policyConfig.locus, LOCUS_KEYS, "objectiveRequest.policyConfig.locus");
  if (!new Set(["browser", "server"]).has(input.policyConfig.locus.executedAt)) fail("objectiveRequest execution locus is invalid");
  return deepCopyFreeze({
    runId: identity.runId,
    packId,
    packDigest,
    nodeId: identity.nodeId,
    fen: identity.fen,
    objectiveState: input.objectiveState,
    evidenceRefs: input.evidenceRefs,
    policyConfig: {
      seedMode: input.policyConfig.seedMode,
      locus: {
        executedAt: input.policyConfig.locus.executedAt,
        engineIds: parseVersionedPolicies(input.policyConfig.locus.engineIds, "engineIds"),
        modelIds: parseVersionedPolicies(input.policyConfig.locus.modelIds, "modelIds"),
      },
    },
  });
}

export function parseEvidenceJobRequest(input) {
  exactKeys(input, JOB_KEYS, "job request");
  if (input.schema !== "evidence_job_request@1") fail("unsupported job request schema");
  const runId = nonEmptyString(input.runId, "runId");
  const nodeId = nonEmptyString(input.nodeId, "nodeId");
  const fen = nonEmptyString(input.fen, "fen");
  if (!KINDS.has(input.kind)) fail("unsupported evidence kind");
  const depth = optionalPositive(input.depth, "depth");
  const movetime = optionalPositive(input.movetime, "movetime");
  const multiPv = optionalPositive(input.multiPv, "multiPv");
  const timeoutMs = optionalPositive(input.timeoutMs, "timeoutMs");
  if (input.kind === "tablebase" ? depth !== null || movetime !== null : (depth === null) === (movetime === null)) fail("evidence search bound does not match kind");
  const objectiveRequest = input.objectiveRequest === null ? null : parseObjectiveRequest(input.objectiveRequest, { runId, nodeId, fen });
  const parsed = deepCopyFreeze({ schema: "evidence_job_request@1", runId, nodeId, fen, kind: input.kind, depth, movetime, multiPv, timeoutMs, objectiveRequest });
  parsedJobs.add(parsed);
  return parsed;
}

export function parseEvidenceBatchRequest(input) {
  exactKeys(input, BATCH_KEYS, "batch request");
  if (input.schema !== "evidence_batch_request@1") fail("unsupported batch request schema");
  const runId = nonEmptyString(input.runId, "runId");
  if (!ORIGINS.has(input.origin)) fail("unsupported batch origin");
  if (!Array.isArray(input.jobs) || input.jobs.length < 1 || input.jobs.length > 16) fail("batch requires 1-16 jobs");
  const jobs = Object.freeze(input.jobs.map(parseEvidenceJobRequest));
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

export function consumerForOrigin(origin) {
  if (!ORIGINS.has(origin)) fail("unsupported batch origin");
  return origin === "explicit_analysis" ? "runtime.analysis" : origin === "story_completion" ? "review.story_evidence" : "runtime.background_evidence";
}

function operationForKind(kind) {
  return kind === "tablebase" ? "evidence.tablebase_probe" : "evidence.stockfish_analysis";
}

export function parseRunSnapshot(input) {
  exactKeys(input, RUN_KEYS, "run snapshot");
  const runId = nonEmptyString(input.runId, "run snapshot id");
  const revision = nonNegativeInteger(input.revision, "run snapshot revision");
  if (!FEEDBACK_POLICIES.has(input.feedbackPolicy)) fail("run feedback policy is invalid");
  if (!Array.isArray(input.nodes) || input.nodes.length === 0) fail("run snapshot requires nodes");
  const nodes = input.nodes.map((node, index) => {
    exactKeys(node, NODE_KEYS, `run node ${index}`);
    return { id: nonEmptyString(node.id, `run node ${index} id`), fen: nonEmptyString(node.fen, `run node ${index} fen`) };
  });
  if (new Set(nodes.map((node) => node.id)).size !== nodes.length) fail("run snapshot has duplicate node ids");
  if (!Array.isArray(input.events)) fail("run snapshot events must be an array");
  const events = input.events.map((event, index) => {
    exactKeys(event, EVENT_KEYS, `run event ${index}`);
    if (!Number.isSafeInteger(event.seq) || event.seq !== index + 1) fail("run event sequence is not the retained journal order");
    return { seq: event.seq, type: nonEmptyString(event.type, `run event ${index} type`), data: deepCopyFreeze(event.data) };
  });
  const parsed = deepCopyFreeze({ runId, revision, feedbackPolicy: input.feedbackPolicy, nodes, events });
  parsedRuns.add(parsed);
  return parsed;
}

export function validateStoredBatch({ batchRow, jobRows, runSnapshot }) {
  if (!parsedRuns.has(runSnapshot)) fail("stored batch requires a parsed run snapshot");
  const batch = parseEvidenceBatchRequest(JSON.parse(batchRow.request_json));
  if (runSnapshot.runId !== batch.runId) fail("job request crossed run snapshot identity");
  if (batchRow.run_id !== batch.runId || batchRow.origin !== batch.origin || batchRow.job_count !== batch.jobs.length || batchRow.request_digest !== batchRequestDigest(batch)) fail("batch columns crossed canonical request");
  const ordered = [...jobRows].sort((a, b) => a.batch_ordinal - b.batch_ordinal);
  if (ordered.length !== batch.jobs.length) fail("stored child cardinality crossed batch request");
  const nodeFenById = new Map(runSnapshot.nodes.map((node) => [node.id, node.fen]));
  ordered.forEach((row, ordinal) => {
    if (row.batch_id !== batchRow.id || row.batch_ordinal !== ordinal || row.run_id !== batch.runId || row.origin !== batch.origin || row.consumer_id !== consumerForOrigin(batch.origin)) fail("child columns crossed batch identity");
    const request = parseEvidenceJobRequest(JSON.parse(row.request_json));
    const expected = batch.jobs[ordinal];
    if (canonical(request) !== canonical(expected) || row.job_request_digest !== jobRequestDigest(request) || row.node_id !== request.nodeId || row.provider_operation_id !== operationForKind(request.kind)) fail("child request crossed indexed batch member");
    if (nodeFenById.get(request.nodeId) !== request.fen) fail("job request crossed immutable node FEN");
  });
  return batch;
}

function evidenceRef(job) {
  return `${job.kind === "tablebase" ? "tablebase" : "engine"}:${job.id}`;
}

export function deriveRecordedGuardOutcome({ beforeRun, job, emitted }) {
  if (!parsedRuns.has(beforeRun)) fail("guard outcome requires a parsed before-run snapshot");
  if (beforeRun.runId !== job.runId) fail("guard outcome crossed run identity");
  if (beforeRun.feedbackPolicy !== "immediate_guard") fail("guard outcome supplied outside immediate_guard");
  if (!Array.isArray(emitted)) fail("guard emitted events must be an array");
  const ref = evidenceRef(job);
  const normalized = emitted.map((event) => {
    if (event?.type !== "feedback.generated" || event.data?.nodeId !== job.nodeId || !Array.isArray(event.data.evidenceRefs) || !event.data.evidenceRefs.includes(ref)) fail("guard event crossed application evidence");
    return deepCopyFreeze({ type: event.type, data: event.data });
  });
  const outcome = deepCopyFreeze({ runId: beforeRun.runId, fromRevision: beforeRun.revision, jobId: job.id, emitted: normalized });
  guardOutcomes.add(outcome);
  return outcome;
}

function assertJournalPrefix(beforeRun, afterRun) {
  if (afterRun.events.length < beforeRun.events.length) fail("run journal was truncated");
  if (!isDeepStrictEqual(afterRun.events.slice(0, beforeRun.events.length), beforeRun.events)) fail("retained run journal prefix changed");
}

export function applyEvidenceAndConsumeJob({ beforeRun, job, settlement, guardOutcome = null }) {
  if (!parsedRuns.has(beforeRun)) fail("application requires a parsed before-run snapshot");
  if (job.runId !== beforeRun.runId) fail("application crossed run identity");
  if (settlement?.kind !== "success") fail("application requires a stored success settlement");
  if (guardOutcome !== null) {
    if (!guardOutcomes.has(guardOutcome)) fail("application requires a recorded guard outcome");
    if (guardOutcome.runId !== beforeRun.runId || guardOutcome.fromRevision !== beforeRun.revision || guardOutcome.jobId !== job.id) fail("guard outcome crossed application transition");
  } else if (beforeRun.feedbackPolicy === "immediate_guard") {
    fail("immediate_guard requires its complete recorded guard outcome, including honest empty");
  }
  const ref = evidenceRef(job);
  const appended = [{ type: "evidence.attached", data: { nodeId: job.nodeId, evidenceRefs: [ref], payload: settlement.payload } }];
  if (settlement.objectiveProposal !== null) {
    if (settlement.objectiveProposal?.nodeId !== job.nodeId || !Array.isArray(settlement.objectiveProposal.evidenceRefs) || !settlement.objectiveProposal.evidenceRefs.includes(ref)) fail("objective proposal crossed stored success");
    appended.push({ type: "objective.state_changed", data: settlement.objectiveProposal });
  }
  if (guardOutcome !== null) appended.push(...guardOutcome.emitted);
  const firstEventSeq = beforeRun.events.length + 1;
  const sequenced = appended.map((event, index) => ({ seq: firstEventSeq + index, ...event }));
  const afterRun = parseRunSnapshot({ ...beforeRun, revision: beforeRun.revision + 1, events: [...beforeRun.events, ...sequenced] });
  assertJournalPrefix(beforeRun, afterRun);
  const suffix = afterRun.events.slice(beforeRun.events.length);
  const receipt = deepCopyFreeze({
    schema: "evidence_application_receipt@1",
    jobId: job.id,
    runId: job.runId,
    nodeId: job.nodeId,
    fromRevision: beforeRun.revision,
    toRevision: afterRun.revision,
    firstEventSeq,
    lastEventSeq: afterRun.events.at(-1).seq,
    eventDigest: digest("chess-tabiya/evidence-application/v1", suffix),
  });
  const result = deepCopyFreeze({ beforeRun, afterRun, receipt, consumedJob: { ...job, state: "consumed", settlement, applicationReceipt: receipt } });
  applicationResults.add(result);
  return result;
}

export function assertApplicationResult(result) {
  if (!applicationResults.has(result)) fail("application result was not transaction-constructed");
  assertJournalPrefix(result.beforeRun, result.afterRun);
  const suffix = result.afterRun.events.slice(result.beforeRun.events.length);
  if (result.receipt.eventDigest !== digest("chess-tabiya/evidence-application/v1", suffix)) fail("application receipt no longer matches retained journal");
  return result;
}

export function settleSuccessWithSequence(database, { jobId, runId, settlement }) {
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("INSERT INTO evidence_result_sequences(run_id,next_result_seq) VALUES (?,1) ON CONFLICT(run_id) DO NOTHING").run(runId);
    const row = database.prepare("SELECT next_result_seq FROM evidence_result_sequences WHERE run_id=?").get(runId);
    const sequence = row.next_result_seq;
    database.prepare("UPDATE evidence_result_sequences SET next_result_seq=next_result_seq+1 WHERE run_id=? AND next_result_seq=?").run(runId, sequence);
    const updated = database.prepare("UPDATE evidence_jobs SET state='settled_success', result_seq=?, settled_at=?, settlement_json=? WHERE id=? AND run_id=? AND state='running'").run(sequence, "now", JSON.stringify(settlement), jobId, runId);
    if (updated.changes !== 1) fail("settlement lost its durable job CAS");
    database.exec("COMMIT");
    return sequence;
  } catch (error) {
    try { database.exec("ROLLBACK"); } catch { /* retain primary error */ }
    throw error;
  }
}
