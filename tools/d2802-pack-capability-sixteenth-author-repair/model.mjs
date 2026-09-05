// Disposable sixteenth-author contract model for D2802-D2808. Not production behavior.
import {
  acquireRunLease as acquireBaseRunLease,
  applyStoredEvidenceAndConsumeJob as applyBaseStoredEvidenceAndConsumeJob,
  loadJobLease as loadBaseJobLease,
  parseDurableJob as parseBaseDurableJob,
  recordEvidenceProviderResponse as recordBaseEvidenceProviderResponse,
  requestEvidenceProvider as requestBaseEvidenceProvider,
  settleEvidenceJob as settleBaseEvidenceJob,
} from "../d2771-pack-capability-fifteenth-author-repair/model.mjs";

const ORIGIN_CONSUMER = Object.freeze({
  explicit_analysis: "runtime.analysis",
  story_completion: "review.story_evidence",
  run_enrichment: "runtime.background_evidence",
});

const FAILURE_REASONS = new Set([
  "provider_unavailable",
  "deadline_exceeded",
  "queue_full",
  "cancelled",
  "invalid_response",
  "identity_mismatch",
]);
const leaseDatabases = new WeakMap();
const leaseRequests = new WeakMap();
const providerRequestJobs = new WeakMap();

function fail(message) { throw new TypeError(message); }

function exactKeys(value, keys, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join("\0") !== [...keys].sort().join("\0")) {
    fail(`${label}:shape`);
  }
}

function nonEmpty(value) { return typeof value === "string" && value.length > 0; }

function canonicalInstant(value, label) {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    fail(`${label}:instant`);
  }
  return value;
}

function assertUnicodeScalarString(value) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) fail("canonical-json:lone-high-surrogate");
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) fail("canonical-json:lone-low-surrogate");
  }
}

// Exact executable stand-in for @chess-tabiya/schema/drill-pack canonicalizeJson.
function canonicalizeJson(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) fail("canonical-json:number");
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    assertUnicodeScalarString(value);
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalizeJson).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => {
      assertUnicodeScalarString(key);
      return `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`;
    }).join(",")}}`;
  }
  fail(`canonical-json:${typeof value}`);
}

function expectedProvider(request) {
  return request.kind === "tablebase"
    ? { operation: "evidence.tablebase_probe", exchangeOperation: "syzygy.position@1", instanceId: "tablebase-primary" }
    : { operation: "evidence.stockfish_analysis", exchangeOperation: "stockfish.position_evaluation@1", instanceId: "stockfish-analysis" };
}

function fenPieceCount(fen) {
  const placement = fen.split(" ", 1)[0];
  if (!/^(?:[prnbqkPRNBQK1-8]+\/){7}[prnbqkPRNBQK1-8]+$/u.test(placement)) fail("payload:tablebase-fen");
  return [...placement].filter((member) => /[prnbqk]/iu.test(member)).length;
}

function assertPayloadRequestJoin(payload, request, providerRequest) {
  const values = payload.values;
  if (payload.kind === "tablebase") {
    if (values.fen !== request.fen || values.sourceId !== providerRequest.instanceId
      || values.pieceCount !== fenPieceCount(request.fen)) fail("payload:tablebase-request-crossed");
    return;
  }
  if (values.engineId !== providerRequest.instanceId) fail("payload:engine-instance-crossed");
  if (request.depth !== null) {
    if (values.requestedDepth !== request.depth || values.requestedMovetimeMs !== undefined) fail("payload:depth-crossed");
  } else if (request.movetime !== null) {
    if (values.requestedMovetimeMs !== request.movetime || values.requestedDepth !== undefined) fail("payload:movetime-crossed");
  } else fail("payload:search-bound-missing");
}

function parseAvailability(value, request) {
  if (value?.state === "cached_exact_only") {
    exactKeys(value, ["instanceIds", "state"], "availability.cached-exact");
  } else if (value?.state === "unavailable") {
    exactKeys(value, ["instanceIds", "reason", "state"], "availability.unavailable");
    if (!["startup", "process_exit", "timeout", "network", "rate_limited", "overloaded", "authentication", "protocol", "cancelled_by_shutdown", "not_configured"].includes(value.reason)) fail("availability:reason");
  } else fail("availability:state");
  if (!Array.isArray(value.instanceIds) || value.instanceIds.length === 0
    || value.instanceIds.some((id) => !nonEmpty(id)) || new Set(value.instanceIds).size !== value.instanceIds.length) fail("availability:instances");
  if (value.instanceIds.length !== 1 || value.instanceIds[0] !== expectedProvider(request).instanceId) fail("availability:instance-crossed");
  return value;
}

function parseFailure(value, request, row) {
  const keys = value?.providerDetail === undefined
    ? ["failedAt", "kind", "normalizedRequestDigest", "operation", "reason"]
    : ["failedAt", "kind", "normalizedRequestDigest", "operation", "providerDetail", "reason"];
  exactKeys(value, keys, "provider-failure");
  const expected = expectedProvider(request);
  if (value.kind !== "source_failure" || value.operation !== expected.exchangeOperation
    || value.normalizedRequestDigest !== row.job_request_digest || !FAILURE_REASONS.has(value.reason)) fail("provider-failure:crossed");
  canonicalInstant(value.failedAt, "provider-failure.failedAt");
  if (value.providerDetail !== undefined && (!nonEmpty(value.providerDetail) || value.providerDetail.length > 512)) fail("provider-failure:detail");
  return value;
}

function parseRetryBasis(value, request, row) {
  if (value?.kind === "provider_unavailable") {
    const keys = value.failure === undefined ? ["availability", "kind"] : ["availability", "failure", "kind"];
    exactKeys(value, keys, "retry.provider-unavailable");
    parseAvailability(value.availability, request);
    if (value.failure !== undefined) parseFailure(value.failure, request, row);
  } else if (value?.kind === "shutdown") {
    exactKeys(value, ["kind"], "retry.shutdown");
  } else if (value?.kind === "expired_lease") {
    const keys = value.failure === undefined ? ["kind"] : ["failure", "kind"];
    exactKeys(value, keys, "retry.expired-lease");
    if (value.failure !== undefined) parseFailure(value.failure, request, row);
  } else fail("retry:kind");
  return value;
}

function parseUnavailableSettlement(value, state, request, row) {
  if (state === "settled_empty" && ["capability_not_configured", "not_applicable"].includes(value?.reason)) {
    exactKeys(value, ["kind", "reason"], "settlement.empty");
    if (value.kind !== "empty") fail("settlement.empty:kind");
    return value;
  }
  if (state === "settled_empty" && value?.reason === "provider_unavailable") {
    const keys = value.failure === undefined ? ["availability", "kind", "reason"] : ["availability", "failure", "kind", "reason"];
    exactKeys(value, keys, "settlement.empty-provider");
    if (value.kind !== "empty") fail("settlement.empty-provider:kind");
  } else if (state === "settled_unavailable") {
    const keys = value?.failure === undefined ? ["availability", "kind"] : ["availability", "failure", "kind"];
    exactKeys(value, keys, "settlement.unavailable");
    if (value.kind !== "unavailable") fail("settlement.unavailable:kind");
  } else fail("settlement:unavailable-arm");
  parseAvailability(value.availability, request);
  if (value.failure !== undefined) parseFailure(value.failure, request, row);
  return value;
}

function baseCompatibleRow(row) {
  if (row.state === "retry_wait") return { ...row, retry_basis_json: "{}" };
  if (row.state === "settled_empty") return { ...row, settlement_json: JSON.stringify({ kind: "empty", reason: "not_applicable" }) };
  if (row.state === "settled_unavailable") return { ...row, settlement_json: JSON.stringify({ kind: "unavailable", reason: "provider_unavailable" }) };
  return row;
}

export function parseDurableJob(row) {
  const parsed = parseBaseDurableJob(baseCompatibleRow(row));
  const expected = expectedProvider(parsed.request);
  if (ORIGIN_CONSUMER[row.origin] !== row.consumer_id || row.provider_operation_id !== expected.operation) fail("evidence-job-row:routing-crossed");
  if (row.state === "retry_wait") parseRetryBasis(JSON.parse(row.retry_basis_json), parsed.request, row);
  if (row.state === "settled_empty" || row.state === "settled_unavailable") {
    const settlement = parseUnavailableSettlement(JSON.parse(row.settlement_json), row.state, parsed.request, row);
    return Object.freeze({ ...parsed, ...row, settlement });
  }
  return parsed;
}

export const acquireRunLease = acquireBaseRunLease;

export function loadJobLease(database, input) {
  const lease = loadBaseJobLease(database, input);
  const job = parseDurableJob(database.prepare("SELECT * FROM evidence_jobs WHERE id=?").get(lease.jobId));
  leaseDatabases.set(lease, database);
  leaseRequests.set(lease, job.request);
  return lease;
}

export function requestEvidenceProvider(lease) {
  const jobRequest = leaseRequests.get(lease);
  if (!jobRequest) fail("provider-request:lease-authority");
  const request = requestBaseEvidenceProvider(lease);
  providerRequestJobs.set(request, jobRequest);
  return request;
}

export function recordEvidenceProviderResponse(request, rawResponse) {
  let decoded;
  try { decoded = JSON.parse(rawResponse); } catch { fail("provider-response:json"); }
  if (canonicalizeJson(decoded) !== rawResponse) fail("provider-response:noncanonical");
  const result = recordBaseEvidenceProviderResponse(request, rawResponse);
  const jobRequest = providerRequestJobs.get(request);
  if (!jobRequest) fail("provider-response:request-authority");
  assertPayloadRequestJoin(result.payload, jobRequest, request);
  return result;
}

export function settleEvidenceJob(database, input) {
  const { lease, providerResult } = input;
  if (leaseDatabases.get(lease) !== database) fail("settle:database-authority");
  if (Date.parse(providerResult.request.requestedAt) > Date.parse(lease.expiresAt)
    || Date.parse(providerResult.retrievedAt) > Date.parse(lease.expiresAt)) fail("settle:provider-after-lease");
  const row = parseDurableJob(database.prepare("SELECT * FROM evidence_jobs WHERE id=?").get(lease.jobId));
  assertPayloadRequestJoin(providerResult.payload, row.request, providerResult.request);
  return settleBaseEvidenceJob(database, input);
}

export function installTransitionAuthority(database) {
  database.exec(`
    CREATE TRIGGER IF NOT EXISTS evidence_run_transitions_no_update
    BEFORE UPDATE ON evidence_run_transitions
    BEGIN SELECT RAISE(ABORT, 'EVIDENCE_TRANSITION_IMMUTABLE'); END;
    CREATE TRIGGER IF NOT EXISTS evidence_run_transitions_no_direct_delete
    BEFORE DELETE ON evidence_run_transitions
    WHEN EXISTS (SELECT 1 FROM drill_runs WHERE id=OLD.run_id)
      AND EXISTS (SELECT 1 FROM evidence_jobs WHERE id=OLD.job_id)
    BEGIN SELECT RAISE(ABORT, 'EVIDENCE_TRANSITION_IMMUTABLE'); END;
  `);
}

export function applyStoredEvidenceAndConsumeJob(database, input) {
  installTransitionAuthority(database);
  return applyBaseStoredEvidenceAndConsumeJob(database, input);
}
