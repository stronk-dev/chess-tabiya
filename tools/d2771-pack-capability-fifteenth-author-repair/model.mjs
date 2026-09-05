// Disposable fifteenth-author contract model for D2771-D2777. Not production behavior.
import crypto from "node:crypto";

import {
  jobRequestDigest,
  parseEvidenceJobRequest,
  parseRunSnapshot,
  validateStoredBatch,
} from "../d2587-pack-capability-twelfth-author-repair/model.mjs";

const runLeaseDatabases = new WeakMap();
const jobLeaseDatabases = new WeakMap();
const providerRequests = new WeakSet();
const providerRequestLeases = new WeakMap();
const providerResults = new WeakSet();
const OBJECTIVE_STATES = new Set(["active", "preserved", "degraded", "failed", "achieved", "transitioned"]);
const JOB_KEYS = [
  "admitted_at", "application_receipt_json", "attempt_count", "batch_id", "batch_ordinal",
  "consumed_at", "consumer_id", "id", "job_request_digest", "lease_expires_at",
  "lease_generation", "lease_owner", "next_attempt_at", "node_id", "origin",
  "provider_operation_id", "request_json", "result_seq", "retry_basis_json", "run_id",
  "settled_at", "settlement_json", "state",
];

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
function digest(prefix, value) {
  return `sha256:${crypto.createHash("sha256").update(`${prefix}\0${typeof value === "string" ? value : JSON.stringify(value)}`).digest("hex")}`;
}
function canonicalInstant(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) fail(`${label}:instant`);
  return value;
}
function databaseNow(database) {
  const row = database.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now') AS instant").get();
  return canonicalInstant(row.instant, "database-clock");
}
function positiveSafeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 1) fail(`${label}:positive-safe-integer`);
  return value;
}
function nullable(value, predicate, label) {
  if (value !== null && !predicate(value)) fail(`${label}:value`);
  return value;
}
function nonEmpty(value) { return typeof value === "string" && value.length > 0; }
function exactNulls(row, keys, label) {
  for (const key of keys) if (row[key] !== null) fail(`${label}:${key}:must-be-null`);
}
function exactPresent(row, keys, label) {
  for (const key of keys) if (row[key] === null) fail(`${label}:${key}:required`);
}

function parseEngineSearch(values, allowedExtra) {
  const allowed = new Set(["engineId", "requestedDepth", "requestedMovetimeMs", "depth", ...allowedExtra]);
  if (Object.keys(values).some((key) => !allowed.has(key))) fail("payload:values:extra");
  if (!nonEmpty(values.engineId) || (values.requestedDepth === undefined) === (values.requestedMovetimeMs === undefined)) fail("payload:search");
  if (values.requestedDepth !== undefined) positiveSafeInteger(values.requestedDepth, "payload.requestedDepth");
  if (values.requestedMovetimeMs !== undefined) positiveSafeInteger(values.requestedMovetimeMs, "payload.requestedMovetimeMs");
  if (values.depth !== undefined) positiveSafeInteger(values.depth, "payload.depth");
}
function uci(value) { return typeof value === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(value); }

export function parseEvidencePayload(value, expectedKind) {
  exactKeys(value, ["kind", "source", "values"], "payload");
  if (value.kind !== expectedKind || value.values === null || typeof value.values !== "object" || Array.isArray(value.values)) fail("payload:kind");
  const values = value.values;
  if (expectedKind === "eval") {
    if (value.source !== "engine_validated") fail("payload:source");
    parseEngineSearch(values, ["bestMoveUci", "centipawns", "mateIn"]);
    if ((values.centipawns === undefined) === (values.mateIn === undefined)) fail("payload:eval-score");
    const score = values.centipawns ?? values.mateIn;
    if (!Number.isSafeInteger(score) || (values.bestMoveUci !== undefined && !uci(values.bestMoveUci))) fail("payload:eval-value");
  } else if (expectedKind === "wdl") {
    if (value.source !== "engine_validated") fail("payload:source");
    parseEngineSearch(values, ["win", "draw", "loss"]);
    for (const key of ["win", "draw", "loss"]) if (!Number.isSafeInteger(values[key]) || values[key] < 0) fail("payload:wdl-value");
    if (values.win + values.draw + values.loss !== 1000) fail("payload:wdl-sum");
  } else if (expectedKind === "bestline") {
    if (value.source !== "engine_validated") fail("payload:source");
    parseEngineSearch(values, ["movesUci"]);
    if (!Array.isArray(values.movesUci) || values.movesUci.length === 0 || values.movesUci.some((move) => !uci(move))) fail("payload:bestline-value");
  } else if (expectedKind === "tablebase") {
    if (value.source !== "tablebase_exact") fail("payload:source");
    exactKeys(values, ["category", "dtz", "fen", "pieceCount", "preciseDtz", "sourceId"], "payload.tablebase");
    if (!nonEmpty(values.fen) || !Number.isSafeInteger(values.pieceCount) || values.pieceCount < 2 || values.pieceCount > 7 || !["win", "syzygy-win", "maybe-win", "cursed-win", "draw", "blessed-loss", "maybe-loss", "syzygy-loss", "loss", "unknown"].includes(values.category) || !nonEmpty(values.sourceId)) fail("payload:tablebase-value");
    nullable(values.dtz, Number.isFinite, "payload.dtz");
    nullable(values.preciseDtz, Number.isFinite, "payload.preciseDtz");
  } else fail("payload:kind");
  return frozenCopy(value);
}

function expectedProvider(request) {
  return request.kind === "tablebase"
    ? { operation: "syzygy.position@1", instanceId: "tablebase-primary" }
    : { operation: "stockfish.position_evaluation@1", instanceId: "stockfish-analysis" };
}

export function requestEvidenceProvider(lease) {
  const database = jobLeaseDatabases.get(lease);
  if (!database) fail("provider-request:lease-authority");
  const row = parseDurableJob(database.prepare("SELECT * FROM evidence_jobs WHERE id=?").get(lease.jobId));
  if (row.state !== "running" || row.lease_owner !== lease.owner || row.lease_generation !== lease.generation || row.job_request_digest !== lease.requestDigest) fail("provider-request:lease-crossed");
  const expected = expectedProvider(row.request);
  const request = Object.freeze({
    jobId: row.id,
    kind: row.request.kind,
    operation: expected.operation,
    instanceId: expected.instanceId,
    generation: row.lease_generation,
    normalizedRequestDigest: row.job_request_digest,
    requestedAt: databaseNow(database),
  });
  providerRequests.add(request);
  providerRequestLeases.set(request, lease);
  return request;
}

export function recordEvidenceProviderResponse(request, rawResponse) {
  if (!providerRequests.has(request)) fail("provider-response:request-authority");
  if (typeof rawResponse !== "string") fail("provider-response:bytes");
  let decoded;
  try { decoded = JSON.parse(rawResponse); } catch { fail("provider-response:json"); }
  const payload = parseEvidencePayload(decoded, request.kind);
  if (JSON.stringify(payload) !== rawResponse) fail("provider-response:noncanonical");
  const result = Object.freeze({
    request,
    rawResponse,
    payload,
    responseDigest: digest("chess-tabiya/provider-response/v1", rawResponse),
    retrievedAt: new Date().toISOString(),
  });
  providerResults.add(result);
  return result;
}

function parseObjectiveProposal(value, request, evidenceRef) {
  if (value === null) return null;
  exactKeys(value, ["evidenceRefs", "from", "nodeId", "to"], "objective-proposal");
  if (request.objectiveRequest === null || value.nodeId !== request.nodeId || value.from !== request.objectiveRequest.objectiveState || !OBJECTIVE_STATES.has(value.to) || value.to === value.from) fail("objective-proposal:state");
  const expectedRefs = [...new Set([...request.objectiveRequest.evidenceRefs, evidenceRef])];
  if (!Array.isArray(value.evidenceRefs) || JSON.stringify(value.evidenceRefs) !== JSON.stringify(expectedRefs)) fail("objective-proposal:refs");
  return frozenCopy(value);
}

function parseStoredSuccess(input, request, row) {
  exactKeys(input, ["kind", "objectiveProposal", "payload", "provider"], "settlement");
  if (input.kind !== "success") fail("settlement:kind");
  exactKeys(input.provider, ["generation", "instanceId", "normalizedRequestDigest", "operation", "rawResponse", "requestedAt", "responseDigest", "retrievedAt"], "settlement.provider");
  const expected = expectedProvider(request);
  if (input.provider.operation !== expected.operation || input.provider.instanceId !== expected.instanceId || input.provider.generation !== row.lease_generation || input.provider.normalizedRequestDigest !== row.job_request_digest) fail("settlement:provider-crossed");
  const requestedAt = canonicalInstant(input.provider.requestedAt, "settlement.requestedAt");
  const retrievedAt = canonicalInstant(input.provider.retrievedAt, "settlement.retrievedAt");
  if (Date.parse(retrievedAt) < Date.parse(requestedAt) || digest("chess-tabiya/provider-response/v1", input.provider.rawResponse) !== input.provider.responseDigest) fail("settlement:provider-bytes");
  let decoded;
  try { decoded = JSON.parse(input.provider.rawResponse); } catch { fail("settlement:provider-json"); }
  const payload = parseEvidencePayload(decoded, request.kind);
  if (JSON.stringify(payload) !== input.provider.rawResponse || JSON.stringify(payload) !== JSON.stringify(input.payload)) fail("settlement:payload-crossed");
  const evidenceRef = `${request.kind === "tablebase" ? "tablebase" : "engine"}:${row.id}`;
  return frozenCopy({ kind: "success", payload, objectiveProposal: parseObjectiveProposal(input.objectiveProposal, request, evidenceRef), provider: { ...input.provider, requestedAt, retrievedAt } });
}

function parseOtherSettlement(input, state) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) fail("settlement:shape");
  if (state === "settled_empty") {
    exactKeys(input, ["kind", "reason"], "settlement.empty");
    if (input.kind !== "empty" || !["capability_not_configured", "not_applicable", "provider_unavailable"].includes(input.reason)) fail("settlement:empty");
  } else if (state === "settled_unavailable") {
    exactKeys(input, ["kind", "reason"], "settlement.unavailable");
    if (input.kind !== "unavailable" || input.reason !== "provider_unavailable") fail("settlement:unavailable");
  } else if (state === "cancelled") {
    exactKeys(input, ["kind", "reason"], "settlement.cancelled");
    if (input.kind !== "cancelled" || !["caller", "superseded"].includes(input.reason)) fail("settlement:cancelled");
  } else fail("settlement:state");
  return frozenCopy(input);
}

export function parseDurableJob(row) {
  exactKeys(row, JOB_KEYS, "evidence-job-row");
  if (!["admitted", "running", "retry_wait", "settled_success", "settled_empty", "settled_unavailable", "cancelled", "consumed"].includes(row.state)) fail("evidence-job-row:state");
  for (const key of ["id", "batch_id", "run_id", "node_id", "origin", "consumer_id", "provider_operation_id", "job_request_digest", "request_json"]) if (!nonEmpty(row[key])) fail(`evidence-job-row:${key}`);
  if (!Number.isSafeInteger(row.batch_ordinal) || row.batch_ordinal < 0 || !Number.isSafeInteger(row.attempt_count) || row.attempt_count < 0 || !Number.isSafeInteger(row.lease_generation) || row.lease_generation < 0) fail("evidence-job-row:integer");
  canonicalInstant(row.admitted_at, "evidence-job-row.admitted_at");
  const request = parseEvidenceJobRequest(JSON.parse(row.request_json));
  if (jobRequestDigest(request) !== row.job_request_digest || request.runId !== row.run_id || request.nodeId !== row.node_id) fail("evidence-job-row:request-crossed");
  const noLease = ["lease_owner", "lease_expires_at"];
  const noRetry = ["next_attempt_at", "retry_basis_json"];
  const noTerminal = ["settled_at", "result_seq", "settlement_json", "consumed_at", "application_receipt_json"];
  let settlement = null;
  if (row.state === "admitted") exactNulls(row, [...noLease, ...noRetry, ...noTerminal], "admitted");
  else if (row.state === "running") {
    exactPresent(row, noLease, "running");
    exactNulls(row, [...noRetry, ...noTerminal], "running");
    if (!nonEmpty(row.lease_owner)) fail("running:lease-owner");
    canonicalInstant(row.lease_expires_at, "running.lease_expires_at");
  } else if (row.state === "retry_wait") {
    exactNulls(row, [...noLease, ...noTerminal], "retry_wait");
    exactPresent(row, noRetry, "retry_wait");
    canonicalInstant(row.next_attempt_at, "retry_wait.next_attempt_at");
    JSON.parse(row.retry_basis_json);
  } else if (row.state === "settled_success" || row.state === "consumed") {
    exactNulls(row, [...noLease, ...noRetry], row.state);
    exactPresent(row, ["settled_at", "result_seq", "settlement_json"], row.state);
    canonicalInstant(row.settled_at, `${row.state}.settled_at`);
    positiveSafeInteger(row.result_seq, `${row.state}.result_seq`);
    settlement = parseStoredSuccess(JSON.parse(row.settlement_json), request, row);
    if (row.state === "settled_success") exactNulls(row, ["consumed_at", "application_receipt_json"], row.state);
    else {
      exactPresent(row, ["consumed_at", "application_receipt_json"], row.state);
      const consumedAt = canonicalInstant(row.consumed_at, "consumed.consumed_at");
      if (Date.parse(consumedAt) < Date.parse(row.settled_at)) fail("consumed:clock-order");
    }
  } else {
    exactNulls(row, [...noLease, ...noRetry, "result_seq", "consumed_at", "application_receipt_json"], row.state);
    exactPresent(row, ["settled_at", "settlement_json"], row.state);
    canonicalInstant(row.settled_at, `${row.state}.settled_at`);
    settlement = parseOtherSettlement(JSON.parse(row.settlement_json), row.state);
  }
  return Object.freeze({ ...row, request, settlement });
}

export function acquireRunLease(database, { runId, owner }) {
  const row = database.prepare("SELECT revision FROM evidence_run_images WHERE run_id=?").get(runId);
  if (!row || !nonEmpty(owner) || !Number.isSafeInteger(row.revision)) fail("run-lease:missing");
  const lease = Object.freeze({ runId, owner, revision: row.revision });
  runLeaseDatabases.set(lease, database);
  return lease;
}

export function loadJobLease(database, { jobId, owner }) {
  const row = parseDurableJob(database.prepare("SELECT * FROM evidence_jobs WHERE id=?").get(jobId));
  const now = databaseNow(database);
  if (row.state !== "running" || row.lease_owner !== owner || Date.parse(row.lease_expires_at) <= Date.parse(now)) fail("job-lease:missing-or-expired");
  const lease = Object.freeze({ jobId, runId: row.run_id, owner, generation: row.lease_generation, requestDigest: row.job_request_digest, expiresAt: row.lease_expires_at });
  jobLeaseDatabases.set(lease, database);
  return lease;
}

export function settleEvidenceJob(database, input) {
  exactKeys(input, ["lease", "objectiveProposal", "providerResult"], "settle-input");
  const { lease, providerResult } = input;
  if (jobLeaseDatabases.get(lease) !== database || !providerResults.has(providerResult) || !providerRequests.has(providerResult.request) || providerRequestLeases.get(providerResult.request) !== lease) fail("settle:authority");
  database.exec("BEGIN IMMEDIATE");
  try {
    const now = databaseNow(database);
    const row = parseDurableJob(database.prepare("SELECT * FROM evidence_jobs WHERE id=?").get(lease.jobId));
    if (row.state !== "running" || row.run_id !== lease.runId || row.lease_owner !== lease.owner || row.lease_generation !== lease.generation || row.job_request_digest !== lease.requestDigest || row.lease_expires_at !== lease.expiresAt || Date.parse(row.lease_expires_at) <= Date.parse(now)) fail("settle:lease-cas-or-expired");
    if (providerResult.request.jobId !== row.id || providerResult.request.kind !== row.request.kind || providerResult.request.generation !== row.lease_generation || providerResult.request.normalizedRequestDigest !== row.job_request_digest) fail("settle:provider-crossed");
    const expected = expectedProvider(row.request);
    if (providerResult.request.operation !== expected.operation || providerResult.request.instanceId !== expected.instanceId || digest("chess-tabiya/provider-response/v1", providerResult.rawResponse) !== providerResult.responseDigest) fail("settle:provider-crossed");
    const evidenceRef = `${row.request.kind === "tablebase" ? "tablebase" : "engine"}:${row.id}`;
    const stored = frozenCopy({
      kind: "success",
      payload: providerResult.payload,
      objectiveProposal: parseObjectiveProposal(input.objectiveProposal, row.request, evidenceRef),
      provider: {
        operation: providerResult.request.operation,
        instanceId: providerResult.request.instanceId,
        generation: providerResult.request.generation,
        normalizedRequestDigest: providerResult.request.normalizedRequestDigest,
        requestedAt: providerResult.request.requestedAt,
        retrievedAt: providerResult.retrievedAt,
        responseDigest: providerResult.responseDigest,
        rawResponse: providerResult.rawResponse,
      },
    });
    parseStoredSuccess(stored, row.request, row);
    database.prepare("INSERT INTO evidence_result_sequences(run_id,next_result_seq) VALUES (?,1) ON CONFLICT(run_id) DO NOTHING").run(row.run_id);
    const sequence = database.prepare("SELECT next_result_seq FROM evidence_result_sequences WHERE run_id=?").get(row.run_id).next_result_seq;
    const updated = database.prepare("UPDATE evidence_jobs SET state='settled_success',result_seq=?,settled_at=?,settlement_json=?,lease_owner=NULL,lease_expires_at=NULL WHERE id=? AND run_id=? AND state='running' AND lease_owner=? AND lease_generation=? AND lease_expires_at=? AND job_request_digest=?")
      .run(sequence, now, JSON.stringify(stored), row.id, row.run_id, lease.owner, lease.generation, lease.expiresAt, lease.requestDigest);
    if (updated.changes !== 1) fail("settle:cas");
    const advanced = database.prepare("UPDATE evidence_result_sequences SET next_result_seq=next_result_seq+1 WHERE run_id=? AND next_result_seq=?").run(row.run_id, sequence);
    if (advanced.changes !== 1) fail("settle:sequence-cas");
    parseDurableJob(database.prepare("SELECT * FROM evidence_jobs WHERE id=?").get(row.id));
    database.exec("COMMIT");
    return sequence;
  } catch (error) { try { database.exec("ROLLBACK"); } catch { /* retain primary */ } throw error; }
}

function registeredGuard({ run, job, evidenceRef }) {
  if (run.feedbackPolicy !== "immediate_guard") return [];
  return [{ type: "feedback.generated", data: { nodeId: job.nodeId, evidenceRefs: [evidenceRef], message: "registered guard result" } }];
}
function runBytes(run) { return JSON.stringify(run); }
function runDigest(run) { return digest("chess-tabiya/run-image/v1", runBytes(run)); }
function transitionDigest(value) { return digest("chess-tabiya/evidence-transition/v1", value); }

function parseReceipt(value) {
  exactKeys(value, ["eventDigest", "firstEventSeq", "fromRevision", "jobId", "lastEventSeq", "nodeId", "runId", "schema", "toRevision", "transitionDigest"], "receipt");
  if (value.schema !== "evidence_application_receipt@2" || !/^sha256:[0-9a-f]{64}$/u.test(value.eventDigest) || !/^sha256:[0-9a-f]{64}$/u.test(value.transitionDigest)) fail("receipt:value");
  return frozenCopy(value);
}

function validateStoredTransition(database, job, currentRun) {
  const receipt = parseReceipt(JSON.parse(job.application_receipt_json));
  const transition = database.prepare("SELECT * FROM evidence_run_transitions WHERE job_id=?").get(job.id);
  if (!transition) fail("transition:missing");
  const beforeRun = parseRunSnapshot(JSON.parse(transition.before_run_json));
  const afterRun = parseRunSnapshot(JSON.parse(transition.after_run_json));
  if (transition.run_id !== job.run_id || transition.job_id !== job.id || transition.from_revision !== beforeRun.revision || transition.to_revision !== afterRun.revision || afterRun.revision !== beforeRun.revision + 1 || transition.before_run_digest !== runDigest(beforeRun) || transition.after_run_digest !== runDigest(afterRun)) fail("transition:image-crossed");
  const suffix = afterRun.events.filter((event) => event.seq >= transition.first_event_seq && event.seq <= transition.last_event_seq);
  const eventDigest = digest("chess-tabiya/evidence-application/v1", suffix);
  const subject = { runId: transition.run_id, jobId: transition.job_id, fromRevision: transition.from_revision, toRevision: transition.to_revision, beforeRunDigest: transition.before_run_digest, afterRunDigest: transition.after_run_digest, firstEventSeq: transition.first_event_seq, lastEventSeq: transition.last_event_seq, eventDigest };
  if (transition.event_digest !== eventDigest || transition.transition_digest !== transitionDigest(subject) || receipt.transitionDigest !== transition.transition_digest || receipt.runId !== transition.run_id || receipt.jobId !== transition.job_id || receipt.nodeId !== job.node_id || receipt.fromRevision !== transition.from_revision || receipt.toRevision !== transition.to_revision || receipt.firstEventSeq !== transition.first_event_seq || receipt.lastEventSeq !== transition.last_event_seq || receipt.eventDigest !== eventDigest) fail("transition:receipt-crossed");
  const currentSuffix = currentRun.events.filter((event) => event.seq >= transition.first_event_seq && event.seq <= transition.last_event_seq);
  if (currentRun.revision < afterRun.revision || digest("chess-tabiya/evidence-application/v1", currentSuffix) !== eventDigest) fail("transition:current-run-crossed");
  return { receipt, afterRun };
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
    const job = parseDurableJob(database.prepare("SELECT * FROM evidence_jobs WHERE id=? AND run_id=?").get(jobId, runLease.runId));
    const node = beforeRun.nodes.find((candidate) => candidate.id === job.request.nodeId);
    if (!node || node.fen !== job.request.fen) fail("apply:node-join");
    if (job.state === "consumed") {
      const replay = validateStoredTransition(database, job, beforeRun);
      database.exec("COMMIT");
      return Object.freeze({ replay: true, receipt: replay.receipt, afterRun: replay.afterRun });
    }
    if (job.state !== "settled_success") fail("apply:job-state");
    const ref = `${job.request.kind === "tablebase" ? "tablebase" : "engine"}:${job.id}`;
    const appended = [{ type: "evidence.attached", data: { nodeId: job.request.nodeId, evidenceRefs: [ref], payload: job.settlement.payload } }];
    if (job.settlement.objectiveProposal !== null) appended.push({ type: "objective.state_changed", data: job.settlement.objectiveProposal });
    appended.push(...registeredGuard({ run: beforeRun, job: job.request, evidenceRef: ref }));
    const first = beforeRun.events.length + 1;
    const suffix = appended.map((event, index) => ({ seq: first + index, ...event }));
    const afterRun = parseRunSnapshot({ ...beforeRun, revision: beforeRun.revision + 1, events: [...beforeRun.events, ...suffix] });
    const eventDigest = digest("chess-tabiya/evidence-application/v1", suffix);
    const subject = { runId: job.run_id, jobId: job.id, fromRevision: beforeRun.revision, toRevision: afterRun.revision, beforeRunDigest: runDigest(beforeRun), afterRunDigest: runDigest(afterRun), firstEventSeq: first, lastEventSeq: suffix.at(-1).seq, eventDigest };
    const sealedTransitionDigest = transitionDigest(subject);
    const receipt = frozenCopy({ schema: "evidence_application_receipt@2", jobId: job.id, runId: job.run_id, nodeId: job.node_id, fromRevision: subject.fromRevision, toRevision: subject.toRevision, firstEventSeq: subject.firstEventSeq, lastEventSeq: subject.lastEventSeq, eventDigest, transitionDigest: sealedTransitionDigest });
    database.prepare("INSERT INTO evidence_run_transitions(run_id,job_id,from_revision,to_revision,before_run_json,before_run_digest,after_run_json,after_run_digest,first_event_seq,last_event_seq,event_digest,transition_digest,committed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)")
      .run(job.run_id, job.id, subject.fromRevision, subject.toRevision, runBytes(beforeRun), subject.beforeRunDigest, runBytes(afterRun), subject.afterRunDigest, subject.firstEventSeq, subject.lastEventSeq, eventDigest, sealedTransitionDigest, databaseNow(database));
    const runUpdated = database.prepare("UPDATE evidence_run_images SET revision=?,run_json=? WHERE run_id=? AND revision=?").run(afterRun.revision, runBytes(afterRun), runLease.runId, runLease.revision);
    const consumedAt = databaseNow(database);
    const jobUpdated = database.prepare("UPDATE evidence_jobs SET state='consumed',consumed_at=?,application_receipt_json=? WHERE id=? AND state='settled_success' AND job_request_digest=?").run(consumedAt, JSON.stringify(receipt), job.id, job.job_request_digest);
    if (runUpdated.changes !== 1 || jobUpdated.changes !== 1) fail("apply:cas");
    const consumed = parseDurableJob(database.prepare("SELECT * FROM evidence_jobs WHERE id=?").get(job.id));
    validateStoredTransition(database, consumed, afterRun);
    database.exec("COMMIT");
    return Object.freeze({ replay: false, receipt, afterRun });
  } catch (error) { try { database.exec("ROLLBACK"); } catch { /* retain primary */ } throw error; }
}

export function replayStoredBatch(database, input) {
  exactKeys(input, ["batchId"], "replay-input");
  const batchRow = database.prepare("SELECT * FROM evidence_job_batches WHERE id=?").get(input.batchId);
  if (!batchRow) fail("replay:batch-missing");
  const image = database.prepare("SELECT run_json FROM evidence_run_images WHERE run_id=?").get(batchRow.run_id);
  if (!image) fail("replay:run-missing");
  const runSnapshot = parseRunSnapshot(JSON.parse(image.run_json));
  const jobRows = database.prepare("SELECT * FROM evidence_jobs WHERE batch_id=? ORDER BY batch_ordinal").all(input.batchId);
  for (const row of jobRows) parseDurableJob(row);
  validateStoredBatch({ batchRow, jobRows, runSnapshot });
  return Object.freeze({ batchId: input.batchId, jobIds: Object.freeze(jobRows.map((row) => row.id)) });
}
