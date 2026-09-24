/**
 * The durable queued-evidence contract (rfc/evidence-job-durability.md §2).
 *
 * This module owns the closed vocabularies, the exact v1 request images and their two digest
 * authorities, the provider acquisition/availability/failure receipts, the settlement and retry
 * unions and the one exhaustive `evidence_jobs` row parser. Storage (`evidence-job-store.ts`) is
 * the only writer; every read, replay and settlement path goes through `parseEvidenceJobRow`.
 *
 * Nothing here creates chess truth: payloads are the provider's, parsed and joined to the stored
 * request and the compiled provider instance before they may be sealed.
 */
import { createHash } from "node:crypto";

import {
  isCanonicalUtcIso,
  type EvidenceKind,
  type EvidencePayload,
  type ObjectiveEvidenceProposal,
  type ObjectiveEvidenceRequest,
  type ObjectiveState,
  type ProviderSourceFailureReason,
} from "@chess-tabiya/runtime";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { ServerError } from "./errors.js";
import { countFenPieces } from "./sourcing/chess-facts.js";

// ---------------------------------------------------------------------------------------------
// Closed vocabularies and the two routing maps (re-derived on every read, [[D2806]])
// ---------------------------------------------------------------------------------------------

export const EVIDENCE_ORIGINS = Object.freeze(["explicit_analysis", "story_completion", "run_enrichment"] as const);
export type EvidenceOrigin = (typeof EVIDENCE_ORIGINS)[number];

export const EVIDENCE_JOB_CONSUMERS = Object.freeze(["runtime.analysis", "review.story_evidence", "runtime.background_evidence"] as const);
export type EvidenceJobConsumerId = (typeof EVIDENCE_JOB_CONSUMERS)[number];

export const QUEUED_PROVIDER_OPERATIONS = Object.freeze(["evidence.stockfish_analysis", "evidence.tablebase_probe"] as const);
export type QueuedProviderOperationId = (typeof QUEUED_PROVIDER_OPERATIONS)[number];

export const EVIDENCE_JOB_STATES = Object.freeze([
  "admitted", "running", "retry_wait", "settled_success", "settled_empty", "settled_unavailable", "cancelled", "consumed",
] as const);
export type EvidenceJobState = (typeof EVIDENCE_JOB_STATES)[number];

const EVIDENCE_KINDS = Object.freeze(["eval", "wdl", "bestline", "tablebase"] as const);
const OBJECTIVE_STATES: readonly ObjectiveState[] = Object.freeze(["active", "preserved", "degraded", "failed", "achieved", "transitioned"]);
const FAILURE_REASONS: readonly ProviderSourceFailureReason[] = Object.freeze(["provider_unavailable", "deadline_exceeded", "queue_full", "cancelled", "invalid_response", "identity_mismatch"]);

/** One exhaustive function: the sealed origin fixes the compiled consumer ([[D2591]]). */
export function consumerForOrigin(origin: EvidenceOrigin): EvidenceJobConsumerId {
  switch (origin) {
    case "explicit_analysis": return "runtime.analysis";
    case "story_completion": return "review.story_evidence";
    case "run_enrichment": return "runtime.background_evidence";
  }
}

/** Kinds are total and disjoint over the two queued provider operations (criterion 21). */
export function operationForKind(kind: EvidenceKind): QueuedProviderOperationId {
  switch (kind) {
    case "eval":
    case "wdl":
    case "bestline":
      return "evidence.stockfish_analysis";
    case "tablebase":
      return "evidence.tablebase_probe";
  }
}

/** The declared origin→terminal provider-off effect ([[D3004]]). */
export function providerOffTerminal(origin: EvidenceOrigin): "settled_unavailable" | "settled_empty" {
  return origin === "explicit_analysis" ? "settled_unavailable" : "settled_empty";
}

// ---------------------------------------------------------------------------------------------
// Parsing primitives
// ---------------------------------------------------------------------------------------------

export class EvidenceJobCorrupt extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceJobCorrupt";
  }
}

function corrupt(message: string): never {
  throw new EvidenceJobCorrupt(message);
}

type Json = Readonly<Record<string, unknown>>;

function record(value: unknown, label: string): Json {
  if (value === null || typeof value !== "object" || Array.isArray(value)) corrupt(`${label} must be an object`);
  return value as Json;
}

function exactKeys(value: Json, required: readonly string[], optional: readonly string[], label: string): void {
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) corrupt(`${label} has unknown key ${key}`);
  for (const key of required) if (!Object.hasOwn(value, key)) corrupt(`${label} is missing ${key}`);
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value === "") corrupt(`${label} must be a non-empty string`);
  return value;
}

function instant(value: unknown, label: string): string {
  if (!isCanonicalUtcIso(value)) corrupt(`${label} must be a canonical UTC instant`);
  return value as string;
}

function positiveOrNull(value: unknown, label: string, maximum = Number.MAX_SAFE_INTEGER): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > maximum) corrupt(`${label} must be null or an integer 1..${maximum}`);
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) corrupt(`${label} is not one of ${allowed.join(", ")}`);
  return value as T;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value as object)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function assertFen(fen: string, label: string): void {
  const fields = fen.split(" ");
  if (fields.length !== 6 || !/^[prnbqkPRNBQK1-8/]+$/u.test(fields[0]!) || (fields[1] !== "w" && fields[1] !== "b")) corrupt(`${label} is not a FEN`);
}

function sha256(prefix: string, bytes: string): string {
  return createHash("sha256").update(prefix, "utf8").update(bytes, "utf8").digest("hex");
}

// ---------------------------------------------------------------------------------------------
// Request images and their digest authorities ([[D2544]], [[D2565]], [[D2588]])
// ---------------------------------------------------------------------------------------------

export interface EvidenceJobRequestV1 {
  readonly schema: "evidence_job_request@1";
  readonly runId: string;
  readonly nodeId: string;
  readonly fen: string;
  readonly kind: EvidenceKind;
  readonly depth: number | null;
  readonly movetime: number | null;
  readonly multiPv: number | null;
  readonly timeoutMs: number | null;
  readonly objectiveRequest: ObjectiveEvidenceRequest | null;
}

export interface EvidenceBatchRequestV1 {
  readonly schema: "evidence_batch_request@1";
  readonly runId: string;
  readonly origin: EvidenceOrigin;
  readonly jobs: readonly [EvidenceJobRequestV1, ...EvidenceJobRequestV1[]];
}

declare const parsedJob: unique symbol;
declare const parsedBatch: unique symbol;
export type ParsedEvidenceJobRequest = EvidenceJobRequestV1 & { readonly [parsedJob]: true };
export type ParsedEvidenceBatchRequest = Omit<EvidenceBatchRequestV1, "jobs"> & {
  readonly jobs: readonly [ParsedEvidenceJobRequest, ...ParsedEvidenceJobRequest[]];
  readonly [parsedBatch]: true;
};

const PARSED_JOBS = new WeakSet<object>();
const PARSED_BATCHES = new WeakSet<object>();

const OBJECTIVE_KEYS = Object.freeze(["runId", "packId", "packDigest", "nodeId", "fen", "objectiveState", "evidenceRefs", "policyConfig"]);

function parseVersioned(value: unknown, label: string): { readonly id: string; readonly version: string } {
  const item = record(value, label);
  exactKeys(item, ["id", "version"], [], label);
  return { id: text(item.id, `${label}.id`), version: text(item.version, `${label}.version`) };
}

function parseObjectiveRequest(value: unknown, job: { readonly runId: string; readonly nodeId: string; readonly fen: string }): ObjectiveEvidenceRequest {
  const item = record(value, "objectiveRequest");
  exactKeys(item, OBJECTIVE_KEYS, [], "objectiveRequest");
  const runId = text(item.runId, "objectiveRequest.runId");
  const nodeId = text(item.nodeId, "objectiveRequest.nodeId");
  const fen = text(item.fen, "objectiveRequest.fen");
  if (runId !== job.runId || nodeId !== job.nodeId || fen !== job.fen) corrupt("objectiveRequest crosses the job's run/node/FEN identity");
  if (!Array.isArray(item.evidenceRefs) || item.evidenceRefs.some((reference) => typeof reference !== "string" || reference === "")) corrupt("objectiveRequest.evidenceRefs must be strings");
  const policy = record(item.policyConfig, "objectiveRequest.policyConfig");
  exactKeys(policy, ["seedMode", "locus"], [], "objectiveRequest.policyConfig");
  const locus = record(policy.locus, "objectiveRequest.policyConfig.locus");
  exactKeys(locus, ["executedAt", "engineIds", "modelIds"], [], "objectiveRequest.policyConfig.locus");
  if (!Array.isArray(locus.engineIds) || !Array.isArray(locus.modelIds)) corrupt("objectiveRequest locus ids must be arrays");
  return deepFreeze({
    runId,
    packId: text(item.packId, "objectiveRequest.packId"),
    packDigest: text(item.packDigest, "objectiveRequest.packDigest"),
    nodeId,
    fen,
    objectiveState: oneOf(item.objectiveState, OBJECTIVE_STATES, "objectiveRequest.objectiveState"),
    evidenceRefs: [...(item.evidenceRefs as string[])],
    policyConfig: {
      seedMode: oneOf(policy.seedMode, ["fixed", "per_run", "per_branch"] as const, "objectiveRequest.policyConfig.seedMode"),
      locus: {
        executedAt: oneOf(locus.executedAt, ["browser", "server"] as const, "objectiveRequest.policyConfig.locus.executedAt"),
        engineIds: (locus.engineIds as unknown[]).map((entry, index) => parseVersioned(entry, `engineIds[${index}]`)),
        modelIds: (locus.modelIds as unknown[]).map((entry, index) => parseVersioned(entry, `modelIds[${index}]`)),
      },
    },
  }) as ObjectiveEvidenceRequest;
}

/** The exact v1 job parser: the only constructor of the brand the digest functions accept. */
export function parseEvidenceJobRequest(raw: unknown): ParsedEvidenceJobRequest {
  const item = record(raw, "evidence job request");
  exactKeys(item, ["schema", "runId", "nodeId", "fen", "kind", "depth", "movetime", "multiPv", "timeoutMs", "objectiveRequest"], [], "evidence job request");
  if (item.schema !== "evidence_job_request@1") corrupt("evidence job request has the wrong schema literal");
  const runId = text(item.runId, "runId");
  const nodeId = text(item.nodeId, "nodeId");
  const fen = text(item.fen, "fen");
  assertFen(fen, "fen");
  const kind = oneOf(item.kind, EVIDENCE_KINDS, "kind");
  const depth = positiveOrNull(item.depth, "depth", 99);
  const movetime = positiveOrNull(item.movetime, "movetime", 600_000);
  const multiPv = positiveOrNull(item.multiPv, "multiPv", 64);
  const timeoutMs = positiveOrNull(item.timeoutMs, "timeoutMs", 3_600_000);
  if (kind === "tablebase") {
    if (depth !== null || movetime !== null || multiPv !== null) corrupt("tablebase jobs take no engine search bound");
  } else if ((depth === null) === (movetime === null)) {
    corrupt("engine evidence jobs require exactly one of depth or movetime");
  }
  const objectiveRequest = item.objectiveRequest === null ? null : parseObjectiveRequest(item.objectiveRequest, { runId, nodeId, fen });
  const parsed = Object.freeze({ schema: "evidence_job_request@1" as const, runId, nodeId, fen, kind, depth, movetime, multiPv, timeoutMs, objectiveRequest });
  PARSED_JOBS.add(parsed);
  return parsed as ParsedEvidenceJobRequest;
}

/** The exact v1 batch parser: 1–16 parsed jobs, all on the batch's run. */
export function parseEvidenceBatchRequest(raw: unknown): ParsedEvidenceBatchRequest {
  const item = record(raw, "evidence batch request");
  exactKeys(item, ["schema", "runId", "origin", "jobs"], [], "evidence batch request");
  if (item.schema !== "evidence_batch_request@1") corrupt("evidence batch request has the wrong schema literal");
  const runId = text(item.runId, "batch runId");
  const origin = oneOf(item.origin, EVIDENCE_ORIGINS, "origin");
  if (!Array.isArray(item.jobs) || item.jobs.length < 1 || item.jobs.length > 16) corrupt("evidence batches carry 1-16 jobs");
  const jobs = (item.jobs as unknown[]).map(parseEvidenceJobRequest);
  if (jobs.some((job) => job.runId !== runId)) corrupt("a batch job names a different run");
  const parsed = Object.freeze({ schema: "evidence_batch_request@1" as const, runId, origin, jobs: Object.freeze(jobs) });
  PARSED_BATCHES.add(parsed);
  return parsed as unknown as ParsedEvidenceBatchRequest;
}

export function evidenceJobRequestBytes(request: ParsedEvidenceJobRequest): string {
  if (!PARSED_JOBS.has(request)) throw new TypeError("evidence job digests accept only the exact v1 parser's result");
  return canonicalizeJson(request);
}

export function evidenceBatchRequestBytes(request: ParsedEvidenceBatchRequest): string {
  if (!PARSED_BATCHES.has(request)) throw new TypeError("evidence batch digests accept only the exact v1 parser's result");
  return canonicalizeJson(request);
}

/** The sole writer and verifier of `evidence_jobs.job_request_digest`. */
export function evidenceJobRequestDigest(request: ParsedEvidenceJobRequest): string {
  return sha256("chess-tabiya/evidence-job-request/v1\0", evidenceJobRequestBytes(request));
}

/** The sole writer and verifier of `evidence_job_batches.request_digest`. */
export function evidenceBatchRequestDigest(request: ParsedEvidenceBatchRequest): string {
  return sha256("chess-tabiya/evidence-batch-request/v1\0", evidenceBatchRequestBytes(request));
}

// ---------------------------------------------------------------------------------------------
// Provider receipts, availability and failure (the queue gateway's exchange vocabulary)
// ---------------------------------------------------------------------------------------------

/** The provider interval sealed by the queue gateway under one exact durable lease ([[D2807]]). */
export interface EvidenceAcquisitionReceipt {
  readonly schema: "evidence_acquisition@1";
  readonly operation: QueuedProviderOperationId;
  readonly instance: string;
  readonly jobId: string;
  readonly leaseGeneration: number;
  readonly jobRequestDigest: string;
  readonly requestedAt: string;
  readonly retrievedAt: string;
  readonly responseDigest: string;
}

export interface EvidenceProviderAvailability {
  readonly state: "unavailable" | "cached_exact_only";
  readonly operation: QueuedProviderOperationId;
  readonly instances: readonly [string];
  readonly observedAt: string;
}

export interface EvidenceProviderFailure {
  readonly kind: "source_failure";
  readonly operation: QueuedProviderOperationId;
  readonly jobRequestDigest: string;
  readonly failedAt: string;
  readonly reason: ProviderSourceFailureReason;
  readonly providerDetail?: string;
}

export type DurableEvidenceSettlement =
  | { readonly kind: "success"; readonly payload: EvidencePayload; readonly objectiveProposal: ObjectiveEvidenceProposal | null; readonly acquisition: EvidenceAcquisitionReceipt }
  | { readonly kind: "empty"; readonly reason: "capability_not_configured" | "not_applicable" }
  | { readonly kind: "empty"; readonly reason: "provider_unavailable"; readonly availability: EvidenceProviderAvailability; readonly failure?: EvidenceProviderFailure }
  | { readonly kind: "unavailable"; readonly availability: EvidenceProviderAvailability; readonly failure?: EvidenceProviderFailure }
  | { readonly kind: "cancelled"; readonly reason: "caller" | "superseded" };

export type EvidenceRetryBasis =
  | { readonly kind: "provider_unavailable"; readonly availability: EvidenceProviderAvailability; readonly failure?: EvidenceProviderFailure }
  | { readonly kind: "shutdown" }
  | { readonly kind: "expired_lease"; readonly failure?: EvidenceProviderFailure };

export interface EvidenceApplicationReceiptV1 {
  readonly schema: "evidence_application_receipt@2";
  readonly jobId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly fromRevision: number;
  readonly toRevision: number;
  readonly firstEventSeq: number;
  readonly lastEventSeq: number;
  readonly eventDigest: `sha256:${string}`;
  readonly transitionDigest: `sha256:${string}`;
}

/**
 * The job subject every provider receipt is joined to. `instance`, when present, is the compiled
 * provider instance at write time; stored rows carry their own instance and are re-joined to it.
 */
export interface EvidenceJobSubject {
  readonly jobId: string;
  readonly operation: QueuedProviderOperationId;
  readonly jobRequestDigest: string;
  readonly instance?: string;
}

export function parseAvailability(value: unknown, subject: Pick<EvidenceJobSubject, "operation" | "instance">): EvidenceProviderAvailability {
  const item = record(value, "availability");
  exactKeys(item, ["state", "operation", "instances", "observedAt"], [], "availability");
  const state = oneOf(item.state, ["unavailable", "cached_exact_only"] as const, "availability.state");
  if (item.operation !== subject.operation) corrupt("availability names another provider operation");
  if (!Array.isArray(item.instances) || item.instances.length !== 1 || typeof item.instances[0] !== "string" || item.instances[0] === ""
    || (subject.instance !== undefined && item.instances[0] !== subject.instance)) corrupt("availability instance set is not the compiled singleton provider");
  const instance = item.instances[0] as string;
  return deepFreeze({ state, operation: subject.operation, instances: [instance] as const, observedAt: instant(item.observedAt, "availability.observedAt") });
}

export function parseFailure(value: unknown, subject: Pick<EvidenceJobSubject, "operation" | "jobRequestDigest">): EvidenceProviderFailure {
  const item = record(value, "failure");
  exactKeys(item, ["kind", "operation", "jobRequestDigest", "failedAt", "reason"], ["providerDetail"], "failure");
  if (item.kind !== "source_failure") corrupt("failure is not a provider source failure");
  if (item.operation !== subject.operation || item.jobRequestDigest !== subject.jobRequestDigest) corrupt("failure belongs to another exchange operation or request");
  if (item.providerDetail !== undefined && typeof item.providerDetail !== "string") corrupt("failure.providerDetail must be a string");
  return deepFreeze({
    kind: "source_failure" as const,
    operation: subject.operation,
    jobRequestDigest: subject.jobRequestDigest,
    failedAt: instant(item.failedAt, "failure.failedAt"),
    reason: oneOf(item.reason, FAILURE_REASONS, "failure.reason"),
    ...(item.providerDetail === undefined ? {} : { providerDetail: item.providerDetail as string }),
  });
}

function parseAcquisition(value: unknown, subject: EvidenceJobSubject & { readonly leaseGeneration?: number }): EvidenceAcquisitionReceipt {
  const item = record(value, "acquisition");
  exactKeys(item, ["schema", "operation", "instance", "jobId", "leaseGeneration", "jobRequestDigest", "requestedAt", "retrievedAt", "responseDigest"], [], "acquisition");
  if (item.schema !== "evidence_acquisition@1") corrupt("acquisition has the wrong schema literal");
  if (item.operation !== subject.operation || item.jobId !== subject.jobId || item.jobRequestDigest !== subject.jobRequestDigest) corrupt("acquisition is not joined to this job's operation and request");
  const instance = text(item.instance, "acquisition.instance");
  if (subject.instance !== undefined && instance !== subject.instance) corrupt("acquisition names another provider instance");
  if (typeof item.leaseGeneration !== "number" || !Number.isSafeInteger(item.leaseGeneration) || item.leaseGeneration < 1) corrupt("acquisition.leaseGeneration must be a positive integer");
  if (subject.leaseGeneration !== undefined && item.leaseGeneration !== subject.leaseGeneration) corrupt("acquisition was issued under another lease generation");
  const requestedAt = instant(item.requestedAt, "acquisition.requestedAt");
  const retrievedAt = instant(item.retrievedAt, "acquisition.retrievedAt");
  if (retrievedAt < requestedAt) corrupt("acquisition retrieval precedes its request");
  if (typeof item.responseDigest !== "string" || !/^[0-9a-f]{64}$/u.test(item.responseDigest)) corrupt("acquisition.responseDigest must be lowercase SHA-256");
  return deepFreeze({
    schema: "evidence_acquisition@1" as const,
    operation: subject.operation,
    instance,
    jobId: subject.jobId,
    leaseGeneration: item.leaseGeneration,
    jobRequestDigest: subject.jobRequestDigest,
    requestedAt,
    retrievedAt,
    responseDigest: item.responseDigest,
  });
}

// ---------------------------------------------------------------------------------------------
// Kind-specific payload authority ([[D2773]], [[D2802]], [[D2803]])
// ---------------------------------------------------------------------------------------------

/** RFC-8785 response bytes and their digest; a payload whose bytes differ is refused. */
export function evidenceResponseDigest(payload: EvidencePayload): string {
  return sha256("chess-tabiya/evidence-response/v1\0", canonicalizeJson(payload));
}

function integer(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) corrupt(`${label} must be an integer`);
  return value;
}

function searchProvenance(values: Json, request: EvidenceJobRequestV1, instance: string): void {
  if (values.engineId !== instance) corrupt("engine payload names another engine than the compiled provider");
  if (request.depth !== null) {
    if (values.requestedDepth !== request.depth || Object.hasOwn(values, "requestedMovetimeMs")) corrupt("engine payload search bound differs from the stored request");
  } else if (values.requestedMovetimeMs !== request.movetime || Object.hasOwn(values, "requestedDepth")) {
    corrupt("engine payload search bound differs from the stored request");
  }
  if (values.depth !== undefined) integer(values.depth, "depth");
}

/**
 * Parse one provider payload against its stored request and compiled provider instance. The
 * result is the same bytes (RFC-8785) the acquisition receipt digests; any crossed operand fails.
 */
export function parseEvidencePayload(raw: unknown, request: EvidenceJobRequestV1, instance: string): EvidencePayload {
  const item = record(raw, "payload");
  exactKeys(item, ["kind", "source", "values"], [], "payload");
  if (item.kind !== request.kind) corrupt("payload kind differs from the stored request");
  const values = record(item.values, "payload.values");
  const provenance = ["engineId", "requestedDepth", "requestedMovetimeMs", "depth"];
  switch (request.kind) {
    case "eval": {
      if (item.source !== "engine_validated") corrupt("eval evidence must be engine_validated");
      exactKeys(values, ["engineId"], [...provenance, "centipawns", "mateIn", "perspective", "bestMoveUci"], "eval values");
      searchProvenance(values, request, instance);
      if ((values.centipawns === undefined) === (values.mateIn === undefined)) corrupt("eval carries exactly one of centipawns or mateIn");
      integer(values.centipawns ?? values.mateIn, "eval score");
      if (values.perspective !== undefined && values.perspective !== "white") corrupt("eval perspective must be white");
      if (values.bestMoveUci !== undefined && (typeof values.bestMoveUci !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(values.bestMoveUci))) corrupt("eval bestMoveUci must be UCI");
      break;
    }
    case "wdl": {
      if (item.source !== "engine_validated") corrupt("wdl evidence must be engine_validated");
      exactKeys(values, ["engineId", "win", "draw", "loss"], provenance, "wdl values");
      searchProvenance(values, request, instance);
      for (const key of ["win", "draw", "loss"] as const) if (integer(values[key], key) < 0) corrupt(`${key} must be non-negative`);
      break;
    }
    case "bestline": {
      if (item.source !== "engine_validated") corrupt("bestline evidence must be engine_validated");
      exactKeys(values, ["engineId", "movesUci"], [...provenance, "multiPv"], "bestline values");
      searchProvenance(values, request, instance);
      if (!Array.isArray(values.movesUci) || values.movesUci.length === 0 || values.movesUci.some((move) => typeof move !== "string" || !/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(move))) corrupt("bestline movesUci must be a non-empty UCI line");
      break;
    }
    case "tablebase": {
      if (item.source !== "tablebase_exact") corrupt("tablebase evidence must be tablebase_exact");
      exactKeys(values, ["fen", "pieceCount", "category", "dtz", "preciseDtz", "sourceId"], [], "tablebase values");
      if (values.fen !== request.fen) corrupt("tablebase payload names another FEN");
      if (values.sourceId !== instance) corrupt("tablebase payload names another source");
      if (values.pieceCount !== countFenPieces(request.fen)) corrupt("tablebase pieceCount is not derived from the stored FEN");
      text(values.category, "category");
      for (const key of ["dtz", "preciseDtz"] as const) if (values[key] !== null && (typeof values[key] !== "number" || !Number.isFinite(values[key]))) corrupt(`${key} must be a number or null`);
      break;
    }
  }
  const payload = deepFreeze(JSON.parse(canonicalizeJson(item)) as EvidencePayload);
  return payload;
}

export function parseObjectiveProposal(value: unknown, request: EvidenceJobRequestV1, jobEvidenceRef: string): ObjectiveEvidenceProposal | null {
  if (value === null) return null;
  if (request.objectiveRequest === null) corrupt("an objective proposal exists for a job with no objective request");
  const item = record(value, "objectiveProposal");
  exactKeys(item, ["nodeId", "from", "to", "evidenceRefs"], [], "objectiveProposal");
  if (item.nodeId !== request.nodeId) corrupt("objective proposal names another node");
  const from = oneOf(item.from, OBJECTIVE_STATES, "objectiveProposal.from");
  const to = oneOf(item.to, OBJECTIVE_STATES, "objectiveProposal.to");
  if (from !== request.objectiveRequest.objectiveState) corrupt("objective proposal does not start from the requested objective state");
  if (!Array.isArray(item.evidenceRefs) || item.evidenceRefs.length === 0 || item.evidenceRefs.some((reference) => typeof reference !== "string")) corrupt("objective proposal requires evidence refs");
  const refs = item.evidenceRefs as string[];
  const authorized = new Set([...request.objectiveRequest.evidenceRefs, jobEvidenceRef]);
  if (new Set(refs).size !== refs.length || refs.some((reference) => !authorized.has(reference)) || !refs.includes(jobEvidenceRef)) {
    corrupt("objective proposal evidence is not the authorized prior-plus-job set");
  }
  return deepFreeze({ nodeId: request.nodeId, from, to, evidenceRefs: [...refs] as [string, ...string[]] });
}

// ---------------------------------------------------------------------------------------------
// Settlement and retry unions ([[D2804]], [[D2805]], [[D3002]], [[D3004]], [[D3005]])
// ---------------------------------------------------------------------------------------------

export function parseRetryBasis(value: unknown, subject: EvidenceJobSubject): EvidenceRetryBasis {
  const item = record(value, "retry basis");
  switch (item.kind) {
    case "provider_unavailable":
      exactKeys(item, ["kind", "availability"], ["failure"], "provider_unavailable retry basis");
      return deepFreeze({ kind: "provider_unavailable" as const, availability: parseAvailability(item.availability, subject), ...(item.failure === undefined ? {} : { failure: parseFailure(item.failure, subject) }) });
    case "shutdown":
      exactKeys(item, ["kind"], [], "shutdown retry basis");
      return deepFreeze({ kind: "shutdown" as const });
    case "expired_lease":
      exactKeys(item, ["kind"], ["failure"], "expired_lease retry basis");
      return deepFreeze({ kind: "expired_lease" as const, ...(item.failure === undefined ? {} : { failure: parseFailure(item.failure, subject) }) });
    default:
      return corrupt("retry basis is not one of provider_unavailable, shutdown, expired_lease");
  }
}

/**
 * Parse one stored settlement for the given durable state and origin. The origin fixes which
 * terminal absence arm is lawful: explicit analysis is `unavailable`, Story/enrichment is
 * `empty/provider_unavailable`; the crossed arms are corrupt storage.
 */
export function parseSettlement(value: unknown, state: EvidenceJobState, origin: EvidenceOrigin, request: EvidenceJobRequestV1, subject: EvidenceJobSubject): DurableEvidenceSettlement {
  const item = record(value, "settlement");
  switch (state) {
    case "settled_success":
    case "consumed": {
      if (item.kind !== "success") corrupt(`${state} requires the success settlement arm`);
      exactKeys(item, ["kind", "payload", "objectiveProposal", "acquisition"], [], "success settlement");
      const acquisition = parseAcquisition(item.acquisition, subject);
      const payload = parseEvidencePayload(item.payload, request, acquisition.instance);
      if (evidenceResponseDigest(payload) !== acquisition.responseDigest) corrupt("success payload bytes differ from the acquisition response digest");
      const jobRef = evidenceRefForJob(request.kind, subject.jobId);
      return deepFreeze({ kind: "success" as const, payload, objectiveProposal: parseObjectiveProposal(item.objectiveProposal, request, jobRef), acquisition });
    }
    case "settled_empty": {
      if (item.kind !== "empty") corrupt("settled_empty requires an empty settlement arm");
      if (item.reason === "provider_unavailable") {
        if (origin === "explicit_analysis") corrupt("explicit analysis never settles provider unavailability as empty");
        exactKeys(item, ["kind", "reason", "availability"], ["failure"], "provider_unavailable empty settlement");
        return deepFreeze({ kind: "empty" as const, reason: "provider_unavailable" as const, availability: parseAvailability(item.availability, subject), ...(item.failure === undefined ? {} : { failure: parseFailure(item.failure, subject) }) });
      }
      exactKeys(item, ["kind", "reason"], [], "empty settlement");
      return deepFreeze({ kind: "empty" as const, reason: oneOf(item.reason, ["capability_not_configured", "not_applicable"] as const, "empty reason") });
    }
    case "settled_unavailable": {
      if (item.kind !== "unavailable") corrupt("settled_unavailable requires the unavailable settlement arm");
      if (origin !== "explicit_analysis") corrupt("only explicit analysis settles as unavailable");
      exactKeys(item, ["kind", "availability"], ["failure"], "unavailable settlement");
      return deepFreeze({ kind: "unavailable" as const, availability: parseAvailability(item.availability, subject), ...(item.failure === undefined ? {} : { failure: parseFailure(item.failure, subject) }) });
    }
    case "cancelled": {
      if (item.kind !== "cancelled") corrupt("cancelled requires the cancelled settlement arm");
      exactKeys(item, ["kind", "reason"], [], "cancelled settlement");
      return deepFreeze({ kind: "cancelled" as const, reason: oneOf(item.reason, ["caller", "superseded"] as const, "cancel reason") });
    }
    default:
      return corrupt(`${state} carries no settlement`);
  }
}

export function evidenceRefForJob(kind: EvidenceKind, jobId: string): string {
  return kind === "tablebase" ? `tablebase:${jobId}` : `engine:${jobId}`;
}

export function parseApplicationReceipt(value: unknown, subject: { readonly jobId: string; readonly runId: string; readonly nodeId: string }): EvidenceApplicationReceiptV1 {
  const item = record(value, "application receipt");
  exactKeys(item, ["schema", "jobId", "runId", "nodeId", "fromRevision", "toRevision", "firstEventSeq", "lastEventSeq", "eventDigest", "transitionDigest"], [], "application receipt");
  if (item.schema !== "evidence_application_receipt@2") corrupt("application receipt has the wrong schema literal");
  if (item.jobId !== subject.jobId || item.runId !== subject.runId || item.nodeId !== subject.nodeId) corrupt("application receipt belongs to another job, run or node");
  const fromRevision = integer(item.fromRevision, "fromRevision");
  const toRevision = integer(item.toRevision, "toRevision");
  const firstEventSeq = integer(item.firstEventSeq, "firstEventSeq");
  const lastEventSeq = integer(item.lastEventSeq, "lastEventSeq");
  if (fromRevision < 0 || toRevision !== fromRevision + 1) corrupt("application receipt revisions are not one step");
  if (firstEventSeq < 1 || lastEventSeq < firstEventSeq) corrupt("application receipt event range is empty");
  for (const key of ["eventDigest", "transitionDigest"] as const) {
    if (typeof item[key] !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(item[key] as string)) corrupt(`${key} must be sha256:<hex>`);
  }
  return deepFreeze({
    schema: "evidence_application_receipt@2" as const,
    jobId: subject.jobId,
    runId: subject.runId,
    nodeId: subject.nodeId,
    fromRevision,
    toRevision,
    firstEventSeq,
    lastEventSeq,
    eventDigest: item.eventDigest as `sha256:${string}`,
    transitionDigest: item.transitionDigest as `sha256:${string}`,
  });
}

// ---------------------------------------------------------------------------------------------
// The one exhaustive `evidence_jobs` row parser ([[D2771]], [[D2775]], [[D2806]])
// ---------------------------------------------------------------------------------------------

export const EVIDENCE_JOB_COLUMNS = Object.freeze([
  "id", "batch_id", "batch_ordinal", "run_id", "node_id", "origin", "consumer_id", "provider_operation_id",
  "job_request_digest", "request_json", "state", "attempt_count", "admitted_at", "lease_owner", "lease_expires_at",
  "lease_generation", "next_attempt_at", "retry_basis_json", "settled_at", "result_seq", "settlement_json",
  "consumed_at", "application_receipt_json",
] as const);

interface EvidenceJobCommon {
  readonly id: string;
  readonly batchId: string;
  readonly batchOrdinal: number;
  readonly runId: string;
  readonly nodeId: string;
  readonly origin: EvidenceOrigin;
  readonly consumerId: EvidenceJobConsumerId;
  readonly providerOperationId: QueuedProviderOperationId;
  readonly jobRequestDigest: string;
  readonly requestJson: string;
  readonly request: ParsedEvidenceJobRequest;
  readonly attemptCount: number;
  readonly admittedAt: string;
  readonly leaseGeneration: number;
}

export type EvidenceJobRow =
  | (EvidenceJobCommon & { readonly state: "admitted" })
  | (EvidenceJobCommon & { readonly state: "running"; readonly leaseOwner: string; readonly leaseExpiresAt: string })
  | (EvidenceJobCommon & { readonly state: "retry_wait"; readonly nextAttemptAt: string; readonly retryBasis: EvidenceRetryBasis; readonly retryBasisJson: string })
  | (EvidenceJobCommon & { readonly state: "settled_success"; readonly settledAt: string; readonly resultSeq: number; readonly settlement: Extract<DurableEvidenceSettlement, { kind: "success" }>; readonly settlementJson: string })
  | (EvidenceJobCommon & { readonly state: "settled_empty"; readonly settledAt: string; readonly settlement: Extract<DurableEvidenceSettlement, { kind: "empty" }>; readonly settlementJson: string })
  | (EvidenceJobCommon & { readonly state: "settled_unavailable"; readonly settledAt: string; readonly settlement: Extract<DurableEvidenceSettlement, { kind: "unavailable" }>; readonly settlementJson: string })
  | (EvidenceJobCommon & { readonly state: "cancelled"; readonly settledAt: string; readonly settlement: Extract<DurableEvidenceSettlement, { kind: "cancelled" }>; readonly settlementJson: string })
  | (EvidenceJobCommon & { readonly state: "consumed"; readonly settledAt: string; readonly resultSeq: number; readonly consumedAt: string; readonly settlement: Extract<DurableEvidenceSettlement, { kind: "success" }>; readonly settlementJson: string; readonly receipt: EvidenceApplicationReceiptV1; readonly receiptJson: string });

function nullColumns(row: Json, columns: readonly string[], state: string): void {
  for (const column of columns) if (row[column] !== null) corrupt(`${state} row forbids ${column}`);
}

function presentText(row: Json, column: string, state: string): string {
  if (typeof row[column] !== "string" || row[column] === "") corrupt(`${state} row requires ${column}`);
  return row[column] as string;
}

function parseJsonColumn(row: Json, column: string): unknown {
  try {
    return JSON.parse(row[column] as string) as unknown;
  } catch {
    return corrupt(`${column} is not JSON`);
  }
}

/**
 * Parse a complete 23-column `evidence_jobs` row: every state-specific column is required or
 * forbidden, both routing maps are re-derived and every receipt is re-joined to the row.
 */
export function parseEvidenceJobRow(raw: unknown): EvidenceJobRow {
  const row = record(raw, "evidence_jobs row");
  const keys = Object.keys(row).sort();
  if (keys.length !== EVIDENCE_JOB_COLUMNS.length || [...EVIDENCE_JOB_COLUMNS].sort().some((column, index) => column !== keys[index])) corrupt("evidence_jobs row does not carry exactly the 23 owned columns");
  const origin = oneOf(row.origin, EVIDENCE_ORIGINS, "origin");
  const consumerId = oneOf(row.consumer_id, EVIDENCE_JOB_CONSUMERS, "consumer_id");
  if (consumerId !== consumerForOrigin(origin)) corrupt("stored consumer is not the one its origin derives");
  const requestJson = presentText(row, "request_json", "evidence job");
  const request = parseEvidenceJobRequest(parseJsonColumn(row, "request_json"));
  if (evidenceJobRequestBytes(request) !== requestJson) corrupt("request_json is not the canonical request image");
  if (evidenceJobRequestDigest(request) !== row.job_request_digest) corrupt("job_request_digest does not verify");
  const providerOperationId = oneOf(row.provider_operation_id, QUEUED_PROVIDER_OPERATIONS, "provider_operation_id");
  if (providerOperationId !== operationForKind(request.kind)) corrupt("stored provider operation is not the one the request kind derives");
  if (row.run_id !== request.runId || row.node_id !== request.nodeId) corrupt("row run/node columns cross the parsed request");
  const attemptCount = integer(row.attempt_count, "attempt_count");
  const leaseGeneration = integer(row.lease_generation, "lease_generation");
  const batchOrdinal = integer(row.batch_ordinal, "batch_ordinal");
  if (attemptCount < 0 || leaseGeneration < 0 || batchOrdinal < 0 || batchOrdinal > 15) corrupt("counters are out of range");
  const common: EvidenceJobCommon = {
    id: text(row.id, "id"),
    batchId: text(row.batch_id, "batch_id"),
    batchOrdinal,
    runId: request.runId,
    nodeId: request.nodeId,
    origin,
    consumerId,
    providerOperationId,
    jobRequestDigest: row.job_request_digest as string,
    requestJson,
    request,
    attemptCount,
    admittedAt: instant(row.admitted_at, "admitted_at"),
    leaseGeneration,
  };
  const subject: EvidenceJobSubject = { jobId: common.id, operation: providerOperationId, jobRequestDigest: common.jobRequestDigest };
  const state = oneOf(row.state, EVIDENCE_JOB_STATES, "state");
  const lease = ["lease_owner", "lease_expires_at"];
  const retry = ["next_attempt_at", "retry_basis_json"];
  const settled = ["settled_at", "settlement_json"];
  const consumed = ["consumed_at", "application_receipt_json"];
  const settlement = (): DurableEvidenceSettlement => parseSettlement(parseJsonColumn(row, "settlement_json"), state, origin, request, subject);
  const canonical = (column: string, value: unknown): string => {
    const bytes = canonicalizeJson(value);
    if (row[column] !== bytes) corrupt(`${column} is not the canonical image of its parsed value`);
    return bytes;
  };
  switch (state) {
    case "admitted":
      nullColumns(row, [...lease, ...retry, ...settled, "result_seq", ...consumed], state);
      return deepFreeze({ ...common, state });
    case "running":
      nullColumns(row, [...retry, ...settled, "result_seq", ...consumed], state);
      if (leaseGeneration < 1 || attemptCount < 1) corrupt("a running row was claimed at least once");
      return deepFreeze({ ...common, state, leaseOwner: presentText(row, "lease_owner", state), leaseExpiresAt: instant(row.lease_expires_at, "lease_expires_at") });
    case "retry_wait": {
      nullColumns(row, [...lease, ...settled, "result_seq", ...consumed], state);
      const retryBasis = parseRetryBasis(parseJsonColumn(row, "retry_basis_json"), subject);
      return deepFreeze({ ...common, state, nextAttemptAt: instant(row.next_attempt_at, "next_attempt_at"), retryBasis, retryBasisJson: canonical("retry_basis_json", retryBasis) });
    }
    case "settled_success": {
      nullColumns(row, [...lease, ...retry, ...consumed], state);
      const parsed = settlement() as Extract<DurableEvidenceSettlement, { kind: "success" }>;
      const resultSeq = integer(row.result_seq, "result_seq");
      if (resultSeq < 1) corrupt("result_seq must be positive");
      return deepFreeze({ ...common, state, settledAt: instant(row.settled_at, "settled_at"), resultSeq, settlement: parsed, settlementJson: canonical("settlement_json", parsed) });
    }
    case "settled_empty":
    case "settled_unavailable":
    case "cancelled": {
      nullColumns(row, [...lease, ...retry, "result_seq", ...consumed], state);
      const parsed = settlement();
      return deepFreeze({ ...common, state, settledAt: instant(row.settled_at, "settled_at"), settlement: parsed, settlementJson: canonical("settlement_json", parsed) }) as EvidenceJobRow;
    }
    case "consumed": {
      nullColumns(row, [...lease, ...retry], state);
      const parsed = settlement() as Extract<DurableEvidenceSettlement, { kind: "success" }>;
      const resultSeq = integer(row.result_seq, "result_seq");
      const receipt = parseApplicationReceipt(parseJsonColumn(row, "application_receipt_json"), { jobId: common.id, runId: common.runId, nodeId: common.nodeId });
      return deepFreeze({
        ...common,
        state,
        settledAt: instant(row.settled_at, "settled_at"),
        resultSeq,
        consumedAt: instant(row.consumed_at, "consumed_at"),
        settlement: parsed,
        settlementJson: canonical("settlement_json", parsed),
        receipt,
        receiptJson: canonical("application_receipt_json", receipt),
      });
    }
  }
}

/** Storage-boundary translation of a corrupt durable row into the typed refusal. */
export function evidenceJobCorrupt(error: EvidenceJobCorrupt): ServerError {
  return new ServerError("EVIDENCE_JOB_CORRUPT", `Stored evidence job is corrupt: ${error.message}`, { cause: error });
}
