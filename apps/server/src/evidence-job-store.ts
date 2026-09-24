/**
 * The durable queued-evidence storage authority (rfc/evidence-job-durability.md §2, migration 27).
 *
 * `EvidenceJobStore` is the one owner of `evidence_job_batches`, `evidence_jobs`,
 * `evidence_result_sequences` and `evidence_run_transitions`. It shares the application database
 * connection with `SQLiteRunStorage`: standalone admission and worker transitions open their own
 * `BEGIN IMMEDIATE`; run-coupled effects (`…InTransaction`) run inside `SQLiteRunStorage#save`'s
 * one watermarked transaction. Every read goes through the exhaustive row parser.
 *
 * Leases are capabilities issued by one store instance for one database ([[D2742]]); a provider
 * request, delivery or failure is sealed to the exact lease that began it ([[D2778]]). Every
 * instant is read from one canonical clock, never from a caller.
 */
import { createHash, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

import {
  attachEvidence,
  applyObjectiveEvidenceProposal,
  isCanonicalUtcIso,
  type DrillRun,
  type DrillRunEvent,
  type EvidencePayload,
  type MutationResult,
  type ObjectiveEvidenceProposal,
  type ProviderSourceFailureReason,
} from "@chess-tabiya/runtime";
import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";

import { ServerError } from "./errors.js";
import {
  EVIDENCE_JOB_COLUMNS,
  EvidenceJobCorrupt,
  consumerForOrigin,
  evidenceBatchRequestBytes,
  evidenceBatchRequestDigest,
  evidenceJobCorrupt,
  evidenceJobRequestBytes,
  evidenceJobRequestDigest,
  evidenceRefForJob,
  evidenceResponseDigest,
  operationForKind,
  parseEvidenceBatchRequest,
  parseEvidenceJobRow,
  parseEvidencePayload,
  parseObjectiveProposal,
  providerOffTerminal,
  type DurableEvidenceSettlement,
  type EvidenceAcquisitionReceipt,
  type EvidenceApplicationReceiptV1,
  type EvidenceJobRow,
  type EvidenceOrigin,
  type EvidenceProviderAvailability,
  type EvidenceProviderFailure,
  type EvidenceRetryBasis,
  type ParsedEvidenceBatchRequest,
  type QueuedProviderOperationId,
} from "./evidence-jobs.js";

/** Migration 27's exact DDL (rfc/evidence-job-durability.md §2). */
export const EVIDENCE_JOB_MIGRATION_SQL = `
CREATE TABLE evidence_job_batches (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  origin TEXT NOT NULL CHECK (origin IN
    ('explicit_analysis','story_completion','run_enrichment')),
  idempotency_key TEXT NOT NULL,
  request_json TEXT NOT NULL,
  request_digest TEXT NOT NULL,
  job_count INTEGER NOT NULL CHECK (job_count >= 1 AND job_count <= 16),
  admitted_at TEXT NOT NULL,
  UNIQUE (id, run_id, origin),
  UNIQUE (run_id, origin, idempotency_key)
) STRICT;

CREATE TABLE evidence_result_sequences (
  run_id TEXT PRIMARY KEY REFERENCES drill_runs(id) ON DELETE CASCADE,
  next_result_seq INTEGER NOT NULL CHECK (next_result_seq >= 1)
) STRICT;

CREATE TABLE evidence_jobs (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES evidence_job_batches(id) ON DELETE CASCADE,
  batch_ordinal INTEGER NOT NULL CHECK (batch_ordinal >= 0 AND batch_ordinal < 16),
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN
    ('explicit_analysis','story_completion','run_enrichment')),
  consumer_id TEXT NOT NULL CHECK (consumer_id IN
    ('runtime.analysis','review.story_evidence','runtime.background_evidence')),
  provider_operation_id TEXT NOT NULL CHECK (provider_operation_id IN
    ('evidence.stockfish_analysis','evidence.tablebase_probe')),
  job_request_digest TEXT NOT NULL,
  request_json TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN
    ('admitted','running','retry_wait','settled_success','settled_empty',
     'settled_unavailable','cancelled','consumed')),
  attempt_count INTEGER NOT NULL CHECK (attempt_count >= 0),
  admitted_at TEXT NOT NULL,
  lease_owner TEXT,
  lease_expires_at TEXT,
  lease_generation INTEGER NOT NULL DEFAULT 0 CHECK (lease_generation >= 0),
  next_attempt_at TEXT,
  retry_basis_json TEXT,
  settled_at TEXT,
  result_seq INTEGER,
  settlement_json TEXT,
  consumed_at TEXT,
  application_receipt_json TEXT,
  CHECK (
    (origin='explicit_analysis' AND consumer_id='runtime.analysis') OR
    (origin='story_completion' AND consumer_id='review.story_evidence') OR
    (origin='run_enrichment' AND consumer_id='runtime.background_evidence')
  ),
  FOREIGN KEY (batch_id, run_id, origin)
    REFERENCES evidence_job_batches(id, run_id, origin) ON DELETE CASCADE,
  UNIQUE (batch_id, batch_ordinal),
  UNIQUE (run_id, result_seq)
) STRICT;

CREATE TABLE evidence_run_transitions (
  run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL UNIQUE REFERENCES evidence_jobs(id) ON DELETE CASCADE,
  from_revision INTEGER NOT NULL CHECK (from_revision >= 0),
  to_revision INTEGER NOT NULL CHECK (to_revision = from_revision + 1),
  before_run_json TEXT NOT NULL,
  before_run_digest TEXT NOT NULL,
  after_run_json TEXT NOT NULL,
  after_run_digest TEXT NOT NULL,
  first_event_seq INTEGER NOT NULL CHECK (first_event_seq >= 1),
  last_event_seq INTEGER NOT NULL CHECK (last_event_seq >= first_event_seq),
  event_digest TEXT NOT NULL,
  transition_digest TEXT NOT NULL,
  committed_at TEXT NOT NULL,
  PRIMARY KEY (run_id, to_revision)
) STRICT;

CREATE TRIGGER evidence_run_transitions_no_update
BEFORE UPDATE ON evidence_run_transitions
BEGIN SELECT RAISE(ABORT, 'EVIDENCE_TRANSITION_IMMUTABLE'); END;

CREATE TRIGGER evidence_run_transitions_no_direct_delete
BEFORE DELETE ON evidence_run_transitions
WHEN EXISTS (SELECT 1 FROM drill_runs WHERE id=OLD.run_id)
  AND EXISTS (SELECT 1 FROM evidence_jobs WHERE id=OLD.job_id)
BEGIN SELECT RAISE(ABORT, 'EVIDENCE_TRANSITION_IMMUTABLE'); END;

CREATE INDEX evidence_jobs_claimable ON evidence_jobs(state, next_attempt_at, admitted_at);
CREATE INDEX evidence_jobs_run_state ON evidence_jobs(run_id, state);
`;

export const EVIDENCE_JOB_TABLES = Object.freeze(["evidence_job_batches", "evidence_jobs", "evidence_result_sequences", "evidence_run_transitions"] as const);

export interface EvidenceRetryPolicy {
  /** Claims allowed before provider unavailability becomes terminal. */
  readonly maxAttempts: number;
  readonly retryDelayMs: number;
}

/** Library default; the application composes `APPLICATION_EVIDENCE_RETRY_POLICY`. */
export const DEFAULT_EVIDENCE_RETRY_POLICY: EvidenceRetryPolicy = Object.freeze({ maxAttempts: 3, retryDelayMs: 250 });
/** The deployed operation policy: four claims, five seconds apart, then the origin's terminal effect. */
export const APPLICATION_EVIDENCE_RETRY_POLICY: EvidenceRetryPolicy = Object.freeze({ maxAttempts: 4, retryDelayMs: 5_000 });

export interface EvidenceJobStoreOptions {
  /** Canonical-instant clock; defaults to the database's own `strftime` clock. */
  readonly now?: () => string;
}

/** The sealed claim receipt ([[D2543]], [[D2563]]). Only the issuing store recognises it. */
export interface EvidenceJobLease {
  readonly jobId: string;
  readonly leaseOwner: string;
  readonly leaseGeneration: number;
  readonly jobRequestDigest: string;
  readonly leaseExpiresAt: string;
  readonly job: Extract<EvidenceJobRow, { state: "running" }>;
}

export interface EvidenceProviderRequest {
  readonly lease: EvidenceJobLease;
  readonly requestedAt: string;
}

export interface EvidenceProviderDelivery {
  readonly lease: EvidenceJobLease;
  readonly payload: EvidencePayload;
  readonly acquisition: EvidenceAcquisitionReceipt;
}

export interface EvidenceProviderFailureDelivery {
  readonly lease: EvidenceJobLease;
  readonly failure: EvidenceProviderFailure;
}

export interface AdmittedEvidenceBatch {
  readonly batchId: string;
  readonly runId: string;
  readonly origin: EvidenceOrigin;
  readonly jobs: readonly { readonly id: string; readonly nodeId: string; readonly kind: string; readonly state: EvidenceJobRow["state"] }[];
  /** UUID constructions this call performed: `1 + jobs` on first admission, `0` on replay. */
  readonly constructions: number;
  readonly replayed: boolean;
}

export interface StagedEvidenceResult {
  readonly seq: number;
  readonly jobId: string;
  readonly runId: string;
  readonly nodeId: string;
  readonly evidenceRefs: readonly [string];
  readonly payload: EvidencePayload;
  readonly objectiveProposal?: ObjectiveEvidenceProposal;
}

export interface EvidenceResultPage {
  readonly results: readonly StagedEvidenceResult[];
  readonly nextSeq: number;
}

/** The registered recorded-guard authority; storage invokes it, callers never supply events. */
export type RecordedGuardAuthority = (run: DrillRun, nodeId: string, evidenceRefs: readonly string[], at: string) => MutationResult;

export type EvidenceApplication = MutationResult & { readonly receipt: EvidenceApplicationReceiptV1; readonly replayed: boolean };

function digest(prefix: string, value: unknown): `sha256:${string}` {
  return `sha256:${createHash("sha256").update(prefix, "utf8").update(canonicalizeJson(value), "utf8").digest("hex")}`;
}

function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function runImageDigest(run: DrillRun): `sha256:${string}` {
  return digest("chess-tabiya/evidence-run-image/v1\0", plain(run));
}

function eventDigest(events: readonly DrillRunEvent[]): `sha256:${string}` {
  return digest("chess-tabiya/evidence-application/v1\0", plain(events));
}

function transitionDigest(image: {
  readonly jobId: string; readonly runId: string; readonly fromRevision: number; readonly toRevision: number;
  readonly beforeRunDigest: string; readonly afterRunDigest: string; readonly firstEventSeq: number; readonly lastEventSeq: number; readonly eventDigest: string;
}): `sha256:${string}` {
  return digest("chess-tabiya/evidence-transition/v1\0", image);
}

function addMs(at: string, ms: number): string {
  return new Date(Date.parse(at) + ms).toISOString();
}

function sameJson(left: unknown, right: unknown): boolean {
  return canonicalizeJson(plain(left)) === canonicalizeJson(plain(right));
}

function conflict(message: string): ServerError {
  return new ServerError("IDEMPOTENCY_CONFLICT", message);
}

export class EvidenceJobStore {
  readonly #database: DatabaseSync;
  readonly #clock: (() => string) | undefined;
  readonly #leases = new WeakSet<object>();
  readonly #requests = new WeakSet<object>();
  readonly #deliveries = new WeakSet<object>();
  readonly #failures = new WeakSet<object>();

  constructor(database: DatabaseSync, options: EvidenceJobStoreOptions = {}) {
    this.#database = database;
    this.#clock = options.now;
  }

  /** One canonical transaction instant ([[D2777]]). */
  now(): string {
    const value = this.#clock === undefined
      ? (this.#database.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now') AS now").get() as { readonly now: string }).now
      : this.#clock();
    if (!isCanonicalUtcIso(value)) throw new TypeError("the evidence clock must yield canonical UTC instants");
    return value;
  }

  // -------------------------------------------------------------------------------------------
  // Row access: the exhaustive parser on every path
  // -------------------------------------------------------------------------------------------

  #parse(raw: unknown): EvidenceJobRow {
    try {
      return parseEvidenceJobRow(raw);
    } catch (error) {
      if (error instanceof EvidenceJobCorrupt) throw evidenceJobCorrupt(error);
      throw error;
    }
  }

  #row(jobId: string): EvidenceJobRow | undefined {
    const raw = this.#database.prepare(`SELECT ${EVIDENCE_JOB_COLUMNS.join(",")} FROM evidence_jobs WHERE id=?`).get(jobId);
    return raw === undefined ? undefined : this.#parse(raw);
  }

  job(jobId: string): EvidenceJobRow | undefined {
    return this.#row(jobId);
  }

  jobsForRun(runId: string): readonly EvidenceJobRow[] {
    const rows = this.#database.prepare(`SELECT ${EVIDENCE_JOB_COLUMNS.join(",")} FROM evidence_jobs WHERE run_id=? ORDER BY admitted_at, rowid`).all(runId);
    return Object.freeze(rows.map((row) => this.#parse(row)));
  }

  #transaction<T>(body: () => T): T {
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      const result = body();
      this.#database.exec("COMMIT");
      return result;
    } catch (error) {
      try { this.#database.exec("ROLLBACK"); } catch { /* keep the primary failure */ }
      if (error instanceof EvidenceJobCorrupt) throw evidenceJobCorrupt(error);
      if (error instanceof ServerError) throw error;
      if (error instanceof Error && /database is locked|SQLITE_BUSY/u.test(error.message)) {
        throw new ServerError("STORAGE_FAILURE", "Evidence storage is busy; retry", { cause: error, details: { retryable: true } });
      }
      throw error;
    }
  }

  // -------------------------------------------------------------------------------------------
  // Admission ([[D2545]], [[D2569]], [[D2591]], [[D2677]], [[D2747]], [[D2590]])
  // -------------------------------------------------------------------------------------------

  /** The durable run image as stored now, loaded internally (never caller-supplied). */
  #storedRun(runId: string): DrillRun {
    const row = this.#database.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(runId) as { readonly snapshot_json?: unknown } | undefined;
    if (row === undefined || typeof row.snapshot_json !== "string") throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);
    return JSON.parse(row.snapshot_json) as DrillRun;
  }

  #assertNodes(run: DrillRun, request: ParsedEvidenceBatchRequest): void {
    if (run.id !== request.runId) throw new EvidenceJobCorrupt("batch request names another run than the stored run image");
    for (const job of request.jobs) {
      const node = run.nodes.find((candidate) => candidate.id === job.nodeId);
      if (node === undefined) throw new ServerError("INVALID_REQUEST", `Unknown evidence node: ${job.nodeId}`);
      if (node.fen !== job.fen) throw new EvidenceJobCorrupt(`job FEN for ${job.nodeId} differs from the stored node`);
    }
  }

  /**
   * Validate one complete persisted batch against its children and the durable run image
   * ([[D2542]], [[D2566]], [[D2677]], [[D2747]]).
   */
  #validatedBatch(batchId: string): AdmittedEvidenceBatch {
    const batch = this.#database.prepare("SELECT id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at FROM evidence_job_batches WHERE id=?").get(batchId) as Record<string, unknown> | undefined;
    if (batch === undefined) throw new EvidenceJobCorrupt(`batch ${batchId} is missing`);
    const request = parseEvidenceBatchRequest(JSON.parse(String(batch.request_json)));
    if (evidenceBatchRequestBytes(request) !== batch.request_json || evidenceBatchRequestDigest(request) !== batch.request_digest) throw new EvidenceJobCorrupt("batch request bytes or digest do not verify");
    if (batch.run_id !== request.runId || batch.origin !== request.origin || batch.job_count !== request.jobs.length) throw new EvidenceJobCorrupt("batch columns cross the parsed request");
    const rows = this.#database.prepare(`SELECT ${EVIDENCE_JOB_COLUMNS.join(",")} FROM evidence_jobs WHERE batch_id=? ORDER BY batch_ordinal`).all(batchId).map((row) => parseEvidenceJobRow(row));
    if (rows.length !== request.jobs.length) throw new EvidenceJobCorrupt("batch child population differs from job_count");
    rows.forEach((row, index) => {
      const member = request.jobs[index]!;
      if (row.batchOrdinal !== index || row.runId !== request.runId || row.origin !== request.origin
        || row.consumerId !== consumerForOrigin(request.origin) || row.providerOperationId !== operationForKind(member.kind)
        || row.requestJson !== evidenceJobRequestBytes(member) || row.jobRequestDigest !== evidenceJobRequestDigest(member) || row.nodeId !== member.nodeId) {
        throw new EvidenceJobCorrupt(`batch child ${index} is not its indexed batch member`);
      }
    });
    this.#assertNodes(this.#storedRun(request.runId), request);
    return Object.freeze({
      batchId,
      runId: request.runId,
      origin: request.origin,
      jobs: Object.freeze(rows.map((row) => Object.freeze({ id: row.id, nodeId: row.nodeId, kind: row.request.kind, state: row.state }))),
      constructions: 0,
      replayed: true,
    });
  }

  /** The row is a validated, correctly indexed member of its complete parent batch ([[D3008]]). */
  #assertMember(row: EvidenceJobRow): void {
    const batch = this.#validatedBatch(row.batchId);
    if (batch.jobs[row.batchOrdinal]?.id !== row.id) throw new EvidenceJobCorrupt("job is not its parent batch's indexed member");
  }

  #batchIdForKey(runId: string, origin: EvidenceOrigin, key: string): string | undefined {
    const row = this.#database.prepare("SELECT id, request_digest FROM evidence_job_batches WHERE run_id=? AND origin=? AND idempotency_key=?").get(runId, origin, key) as { readonly id: string } | undefined;
    return row?.id;
  }

  #insertBatch(request: ParsedEvidenceBatchRequest, key: string): AdmittedEvidenceBatch {
    this.#assertNodes(this.#storedRun(request.runId), request);
    const at = this.now();
    // UUID construction happens here, inside the absence arm, after the unique-key read.
    const batchId = randomUUID();
    const consumer = consumerForOrigin(request.origin);
    this.#database.prepare("INSERT INTO evidence_job_batches (id,run_id,origin,idempotency_key,request_json,request_digest,job_count,admitted_at) VALUES (?,?,?,?,?,?,?,?)")
      .run(batchId, request.runId, request.origin, key, evidenceBatchRequestBytes(request), evidenceBatchRequestDigest(request), request.jobs.length, at);
    const insert = this.#database.prepare(`INSERT INTO evidence_jobs (id,batch_id,batch_ordinal,run_id,node_id,origin,consumer_id,provider_operation_id,job_request_digest,request_json,state,attempt_count,admitted_at,lease_generation)
      VALUES (?,?,?,?,?,?,?,?,?,?,'admitted',0,?,0)`);
    const jobs = request.jobs.map((member, ordinal) => {
      const id = randomUUID();
      insert.run(id, batchId, ordinal, request.runId, member.nodeId, request.origin, consumer, operationForKind(member.kind), evidenceJobRequestDigest(member), evidenceJobRequestBytes(member), at);
      return Object.freeze({ id, nodeId: member.nodeId, kind: member.kind, state: "admitted" as const });
    });
    return Object.freeze({ batchId, runId: request.runId, origin: request.origin, jobs: Object.freeze(jobs), constructions: 1 + jobs.length, replayed: false });
  }

  /**
   * `admitEvidenceBatchInTransaction` — the one admission operation. The caller already holds
   * `BEGIN IMMEDIATE`. Equal bytes replay the validated stored batch; unequal bytes refuse with
   * `IDEMPOTENCY_CONFLICT`; absence constructs and inserts the whole batch.
   */
  admitEvidenceBatchInTransaction(input: { readonly idempotencyKey: string; readonly request: unknown }): AdmittedEvidenceBatch {
    let request: ParsedEvidenceBatchRequest;
    try {
      request = parseEvidenceBatchRequest(input.request);
    } catch (error) {
      if (error instanceof EvidenceJobCorrupt) throw new ServerError("INVALID_REQUEST", error.message);
      throw error;
    }
    if (input.idempotencyKey === "") throw new ServerError("INVALID_REQUEST", "idempotency key is required");
    const existing = this.#batchIdForKey(request.runId, request.origin, input.idempotencyKey);
    if (existing !== undefined) {
      const stored = this.#database.prepare("SELECT request_digest FROM evidence_job_batches WHERE id=?").get(existing) as { readonly request_digest: string };
      if (stored.request_digest !== evidenceBatchRequestDigest(request)) throw conflict("This idempotency key was already used for a different evidence request");
      return this.#validatedBatch(existing);
    }
    return this.#insertBatch(request, input.idempotencyKey);
  }

  /**
   * Internal producers (Story, enrichment) derive their plan only on first admission: an existing
   * key replays its validated stored batch without re-deriving from mutable run state.
   */
  admitInternalIfAbsentInTransaction(input: { readonly runId: string; readonly origin: Exclude<EvidenceOrigin, "explicit_analysis">; readonly idempotencyKey: string; readonly plan: () => unknown }): AdmittedEvidenceBatch | undefined {
    const existing = this.#batchIdForKey(input.runId, input.origin, input.idempotencyKey);
    if (existing !== undefined) return this.#validatedBatch(existing);
    const raw = input.plan();
    if (raw === undefined) return undefined;
    const request = parseEvidenceBatchRequest(raw);
    if (request.runId !== input.runId || request.origin !== input.origin) throw new TypeError("internal plan crosses its run or origin");
    return this.#insertBatch(request, input.idempotencyKey);
  }

  admitEvidenceBatch(input: { readonly idempotencyKey: string; readonly request: unknown }): AdmittedEvidenceBatch {
    return this.#transaction(() => this.admitEvidenceBatchInTransaction(input));
  }

  admitInternalIfAbsent(input: Parameters<EvidenceJobStore["admitInternalIfAbsentInTransaction"]>[0]): AdmittedEvidenceBatch | undefined {
    return this.#transaction(() => this.admitInternalIfAbsentInTransaction(input));
  }

  /** Replay by durable batch identity only; the run image is loaded internally. */
  batch(batchId: string): AdmittedEvidenceBatch {
    return this.#transaction(() => this.#validatedBatch(batchId));
  }

  // -------------------------------------------------------------------------------------------
  // Claim, provider interval, settlement ([[D2543]], [[D2772]], [[D2807]], [[D3006]], [[D3007]])
  // -------------------------------------------------------------------------------------------

  #lease(row: Extract<EvidenceJobRow, { state: "running" }>): EvidenceJobLease {
    const lease = Object.freeze({ jobId: row.id, leaseOwner: row.leaseOwner, leaseGeneration: row.leaseGeneration, jobRequestDigest: row.jobRequestDigest, leaseExpiresAt: row.leaseExpiresAt, job: row });
    this.#leases.add(lease);
    return lease;
  }

  /** Compare-and-swap the oldest claimable row to `running`, incrementing generation and attempts. */
  claimNext(leaseOwner: string, leaseMs: number): EvidenceJobLease | undefined {
    if (leaseOwner === "" || !Number.isSafeInteger(leaseMs) || leaseMs < 1) throw new TypeError("claim requires an owner and a positive lease");
    return this.#transaction(() => {
      const now = this.now();
      const candidate = this.#database.prepare(`SELECT id FROM evidence_jobs WHERE state='admitted' OR (state='retry_wait' AND next_attempt_at<=?)
        ORDER BY admitted_at, rowid LIMIT 1`).get(now) as { readonly id: string } | undefined;
      if (candidate === undefined) return undefined;
      const before = this.#row(candidate.id)!;
      const changed = this.#database.prepare(`UPDATE evidence_jobs SET state='running', lease_owner=?, lease_expires_at=?, lease_generation=lease_generation+1,
          attempt_count=attempt_count+1, next_attempt_at=NULL, retry_basis_json=NULL
        WHERE id=? AND state=? AND lease_generation=?`).run(leaseOwner, addMs(now, leaseMs), before.id, before.state, before.leaseGeneration);
      if (changed.changes !== 1) return undefined;
      return this.#lease(this.#row(before.id) as Extract<EvidenceJobRow, { state: "running" }>);
    });
  }

  /** Re-read the row and require the exact live lease under the current clock. */
  #live(lease: EvidenceJobLease, now: string): Extract<EvidenceJobRow, { state: "running" }> | undefined {
    if (!this.#leases.has(lease)) throw new TypeError("this lease was not issued by this evidence store");
    const row = this.#row(lease.jobId);
    if (row?.state !== "running" || row.leaseOwner !== lease.leaseOwner || row.leaseGeneration !== lease.leaseGeneration
      || row.jobRequestDigest !== lease.jobRequestDigest || row.leaseExpiresAt !== lease.leaseExpiresAt || now >= row.leaseExpiresAt) return undefined;
    return row;
  }

  /** Provider work begins only under a current database-owned lease ([[D3006]]). */
  beginProviderRequest(lease: EvidenceJobLease): EvidenceProviderRequest | undefined {
    const now = this.now();
    const row = this.#live(lease, now);
    if (row === undefined) return undefined;
    // The job rejoins its complete parent batch authority before any provider work ([[D3008]]).
    try {
      this.#assertMember(row);
    } catch (error) {
      if (error instanceof EvidenceJobCorrupt) throw evidenceJobCorrupt(error);
      throw error;
    }
    const request = Object.freeze({ lease, requestedAt: now });
    this.#requests.add(request);
    return request;
  }

  /**
   * Seal one provider response under its request: retrieval is observed on the same clock and must
   * fall inside the lease; the payload is parsed against the stored request and compiled instance.
   */
  completeProviderRequest(request: EvidenceProviderRequest, raw: unknown, instance: string): EvidenceProviderDelivery {
    if (!this.#requests.has(request)) throw new TypeError("this provider request was not issued by this evidence store");
    const retrievedAt = this.now();
    const job = request.lease.job;
    if (retrievedAt > request.lease.leaseExpiresAt) throw new EvidenceProviderLate();
    const payload = parseEvidencePayload(raw, job.request, instance);
    const acquisition: EvidenceAcquisitionReceipt = Object.freeze({
      schema: "evidence_acquisition@1",
      operation: job.providerOperationId,
      instance,
      jobId: job.id,
      leaseGeneration: request.lease.leaseGeneration,
      jobRequestDigest: job.jobRequestDigest,
      requestedAt: request.requestedAt,
      retrievedAt,
      responseDigest: evidenceResponseDigest(payload),
    });
    const delivery = Object.freeze({ lease: request.lease, payload, acquisition });
    this.#deliveries.add(delivery);
    return delivery;
  }

  /** Seal a real provider failure for this exact operation/request ([[D3003]]). */
  failProviderRequest(request: EvidenceProviderRequest, reason: ProviderSourceFailureReason, providerDetail?: string): EvidenceProviderFailureDelivery {
    if (!this.#requests.has(request)) throw new TypeError("this provider request was not issued by this evidence store");
    const job = request.lease.job;
    const failure: EvidenceProviderFailure = Object.freeze({
      kind: "source_failure",
      operation: job.providerOperationId,
      jobRequestDigest: job.jobRequestDigest,
      failedAt: this.now(),
      reason,
      ...(providerDetail === undefined ? {} : { providerDetail: providerDetail.slice(0, 500) }),
    });
    const sealed = Object.freeze({ lease: request.lease, failure });
    this.#failures.add(sealed);
    return sealed;
  }

  #writeSettled(row: EvidenceJobRow, lease: EvidenceJobLease | undefined, state: "settled_success" | "settled_empty" | "settled_unavailable", settlement: DurableEvidenceSettlement, at: string, resultSeq: number | null): boolean {
    const changed = this.#database.prepare(`UPDATE evidence_jobs SET state=?, lease_owner=NULL, lease_expires_at=NULL, next_attempt_at=NULL, retry_basis_json=NULL,
        settled_at=?, result_seq=?, settlement_json=?
      WHERE id=? AND state='running' AND lease_owner=? AND lease_generation=? AND job_request_digest=? AND lease_expires_at=?`)
      .run(state, at, resultSeq, canonicalizeJson(settlement), row.id, lease?.leaseOwner ?? null, lease?.leaseGeneration ?? -1, lease?.jobRequestDigest ?? "", lease?.leaseExpiresAt ?? "");
    return changed.changes === 1;
  }

  /** Allocate/increment the durable per-run result counter; never `MAX(result_seq)` ([[D2592]]). */
  #allocateResultSeq(runId: string): number {
    this.#database.prepare("INSERT INTO evidence_result_sequences (run_id,next_result_seq) VALUES (?,1) ON CONFLICT(run_id) DO NOTHING").run(runId);
    const row = this.#database.prepare("SELECT next_result_seq FROM evidence_result_sequences WHERE run_id=?").get(runId) as { readonly next_result_seq: number };
    this.#database.prepare("UPDATE evidence_result_sequences SET next_result_seq=next_result_seq+1 WHERE run_id=? AND next_result_seq=?").run(runId, row.next_result_seq);
    return row.next_result_seq;
  }

  /**
   * `settleEvidenceJob` success arm: the lease is live on the settlement clock, the sealed provider
   * interval lies within it and before settlement, the payload and proposal re-parse against the
   * stored job, and the result sequence is allocated in the same transaction. Returns the sequence,
   * or `undefined` when the lease went stale (the late result is discarded).
   */
  settleSuccess(delivery: EvidenceProviderDelivery, proposal: ObjectiveEvidenceProposal | null): number | undefined {
    if (!this.#deliveries.has(delivery)) throw new TypeError("this provider delivery was not sealed by this evidence store");
    return this.#transaction(() => {
      const now = this.now();
      const row = this.#live(delivery.lease, now);
      if (row === undefined) return undefined;
      this.#assertMember(row);
      const { acquisition } = delivery;
      if (acquisition.leaseGeneration !== row.leaseGeneration || acquisition.retrievedAt > row.leaseExpiresAt || acquisition.retrievedAt > now || acquisition.requestedAt > acquisition.retrievedAt) return undefined;
      const payload = parseEvidencePayload(plain(delivery.payload), row.request, acquisition.instance);
      if (evidenceResponseDigest(payload) !== acquisition.responseDigest) throw new EvidenceJobCorrupt("delivery payload differs from its sealed response digest");
      const objectiveProposal = parseObjectiveProposal(proposal === null ? null : plain(proposal), row.request, evidenceRefForJob(row.request.kind, row.id));
      const seq = this.#allocateResultSeq(row.runId);
      const settlement: DurableEvidenceSettlement = { kind: "success", payload, objectiveProposal, acquisition };
      if (!this.#writeSettled(row, delivery.lease, "settled_success", settlement, now, seq)) throw new EvidenceJobCorrupt("lease changed inside the settlement transaction");
      this.#row(row.id); // the written row must parse
      return seq;
    });
  }

  #availability(row: EvidenceJobRow, now: string, instance: string): EvidenceProviderAvailability {
    return Object.freeze({ state: "unavailable", operation: row.providerOperationId, instances: Object.freeze([instance]) as unknown as readonly [string], observedAt: now });
  }

  /**
   * Provider unavailability: `retry_wait` under the compiled policy, then the origin's terminal
   * effect (`settled_unavailable` for explicit analysis, `settled_empty/provider_unavailable`
   * otherwise). A failure, when present, is the sealed one; none is ever synthesized.
   */
  settleProviderUnavailable(lease: EvidenceJobLease, failure: EvidenceProviderFailureDelivery | undefined, policy: EvidenceRetryPolicy, instance: string): EvidenceJobRow["state"] | undefined {
    if (failure !== undefined && (!this.#failures.has(failure) || failure.lease !== lease)) throw new TypeError("provider failures must be sealed under this exact lease");
    return this.#transaction(() => {
      const now = this.now();
      const row = this.#live(lease, now);
      if (row === undefined) return undefined;
      const availability = this.#availability(row, now, instance);
      const real = failure === undefined ? {} : { failure: failure.failure };
      if (row.attemptCount < policy.maxAttempts) {
        const basis: EvidenceRetryBasis = { kind: "provider_unavailable", availability, ...real };
        this.#retry(row, lease, basis, addMs(now, policy.retryDelayMs));
        return "retry_wait";
      }
      const terminal = providerOffTerminal(row.origin);
      const settlement: DurableEvidenceSettlement = terminal === "settled_unavailable"
        ? { kind: "unavailable", availability, ...real }
        : { kind: "empty", reason: "provider_unavailable", availability, ...real };
      if (!this.#writeSettled(row, lease, terminal, settlement, now, null)) throw new EvidenceJobCorrupt("lease changed inside the settlement transaction");
      this.#row(row.id);
      return terminal;
    });
  }

  /** Honest absence without a provider call: capability not configured or not applicable. */
  settleEmpty(lease: EvidenceJobLease, reason: "capability_not_configured" | "not_applicable"): boolean {
    return this.#transaction(() => {
      const now = this.now();
      const row = this.#live(lease, now);
      if (row === undefined) return false;
      return this.#writeSettled(row, lease, "settled_empty", { kind: "empty", reason }, now, null);
    });
  }

  #retry(row: EvidenceJobRow, lease: EvidenceJobLease | undefined, basis: EvidenceRetryBasis, nextAttemptAt: string): void {
    const changed = lease === undefined
      ? this.#database.prepare(`UPDATE evidence_jobs SET state='retry_wait', lease_owner=NULL, lease_expires_at=NULL, next_attempt_at=?, retry_basis_json=?
          WHERE id=? AND state='running' AND lease_generation=?`).run(nextAttemptAt, canonicalizeJson(basis), row.id, row.leaseGeneration)
      : this.#database.prepare(`UPDATE evidence_jobs SET state='retry_wait', lease_owner=NULL, lease_expires_at=NULL, next_attempt_at=?, retry_basis_json=?
          WHERE id=? AND state='running' AND lease_owner=? AND lease_generation=? AND job_request_digest=? AND lease_expires_at=?`)
        .run(nextAttemptAt, canonicalizeJson(basis), row.id, lease.leaseOwner, lease.leaseGeneration, lease.jobRequestDigest, lease.leaseExpiresAt);
    if (changed.changes !== 1) throw new EvidenceJobCorrupt("lease changed inside the retry transaction");
    this.#row(row.id);
  }

  /** Shutdown returns leased work to `retry_wait`; it is never terminal ([[D2520]]). */
  returnForShutdown(lease: EvidenceJobLease): boolean {
    return this.#transaction(() => {
      const now = this.now();
      const row = this.#live(lease, now);
      if (row === undefined) return false;
      this.#retry(row, lease, { kind: "shutdown" }, now);
      return true;
    });
  }

  /** Restart recovery: every expired `running` lease returns to `retry_wait` with its basis. */
  recoverExpiredLeases(): number {
    return this.#transaction(() => {
      const now = this.now();
      const expired = this.#database.prepare("SELECT id FROM evidence_jobs WHERE state='running' AND lease_expires_at<=?").all(now) as unknown as readonly { readonly id: string }[];
      for (const { id } of expired) this.#retry(this.#row(id)!, undefined, { kind: "expired_lease" }, now);
      return expired.length;
    });
  }

  /** Caller cancellation of one non-terminal job. */
  cancel(jobId: string): boolean {
    return this.#transaction(() => {
      const row = this.#row(jobId);
      if (row === undefined || !["admitted", "running", "retry_wait"].includes(row.state)) return false;
      this.#cancelRow(row, "caller", this.now());
      return true;
    });
  }

  #cancelRow(row: EvidenceJobRow, reason: "caller" | "superseded", at: string): void {
    const changed = this.#database.prepare(`UPDATE evidence_jobs SET state='cancelled', lease_owner=NULL, lease_expires_at=NULL,
        lease_generation=lease_generation+?, next_attempt_at=NULL, retry_basis_json=NULL, settled_at=?, result_seq=NULL, settlement_json=?
      WHERE id=? AND state=? AND lease_generation=?`)
      .run(row.state === "running" ? 1 : 0, at, canonicalizeJson({ kind: "cancelled", reason }), row.id, row.state, row.leaseGeneration);
    if (changed.changes !== 1) throw new ServerError("STORAGE_FAILURE", "Evidence job changed during cancellation; retry", { details: { retryable: true } });
  }

  /**
   * The rewind half of `commitRewindWithEvidenceCancellation`: admitted/running/retry-wait and
   * staged success rows on pruned nodes become `cancelled/superseded`; terminal audit rows are
   * retained byte-identically ([[D2546]], [[D2567]]). Returns the cancelled ids.
   */
  cancelPrunedInTransaction(runId: string, prunedNodeIds: readonly string[]): readonly string[] {
    if (prunedNodeIds.length === 0) return Object.freeze([]);
    const pruned = new Set(prunedNodeIds);
    const at = this.now();
    const cancelled: string[] = [];
    for (const row of this.jobsForRun(runId)) {
      if (!pruned.has(row.nodeId)) continue;
      if (row.state === "admitted" || row.state === "running" || row.state === "retry_wait" || row.state === "settled_success") {
        this.#cancelRow(row, "superseded", at);
        cancelled.push(row.id);
      }
    }
    return Object.freeze(cancelled);
  }

  // -------------------------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------------------------

  #staged(row: Extract<EvidenceJobRow, { state: "settled_success" | "consumed" }>): StagedEvidenceResult {
    const reference = evidenceRefForJob(row.request.kind, row.id);
    return Object.freeze({
      seq: row.resultSeq,
      jobId: row.id,
      runId: row.runId,
      nodeId: row.nodeId,
      evidenceRefs: Object.freeze([reference]) as readonly [string],
      payload: row.settlement.payload,
      ...(row.settlement.objectiveProposal === null ? {} : { objectiveProposal: row.settlement.objectiveProposal }),
    });
  }

  /** Unconsumed successful rows after `sinceSeq`; `nextSeq` never rewinds with cancellation. */
  page(runId: string, sinceSeq = 0): EvidenceResultPage {
    const rows = this.#database.prepare(`SELECT ${EVIDENCE_JOB_COLUMNS.join(",")} FROM evidence_jobs WHERE run_id=? AND state='settled_success' AND result_seq>? ORDER BY result_seq`).all(runId, sinceSeq);
    const allocated = this.#database.prepare("SELECT next_result_seq FROM evidence_result_sequences WHERE run_id=?").get(runId) as { readonly next_result_seq?: number } | undefined;
    return Object.freeze({
      results: Object.freeze(rows.map((raw) => this.#staged(this.#parse(raw) as Extract<EvidenceJobRow, { state: "settled_success" }>))),
      nextSeq: Math.max(sinceSeq, (allocated?.next_result_seq ?? 1) - 1),
    });
  }

  resultRow(runId: string, seq: number): Extract<EvidenceJobRow, { state: "settled_success" | "consumed" }> | undefined {
    const raw = this.#database.prepare(`SELECT ${EVIDENCE_JOB_COLUMNS.join(",")} FROM evidence_jobs WHERE run_id=? AND result_seq=?`).get(runId, seq);
    if (raw === undefined) return undefined;
    const row = this.#parse(raw);
    return row.state === "settled_success" || row.state === "consumed" ? row : undefined;
  }

  result(runId: string, seq: number): StagedEvidenceResult | undefined {
    const row = this.resultRow(runId, seq);
    return row?.state === "settled_success" ? this.#staged(row) : undefined;
  }

  /** Earliest instant any retry becomes claimable, or `undefined` when nothing waits. */
  nextRetryAt(): string | undefined {
    const row = this.#database.prepare("SELECT MIN(next_attempt_at) AS at FROM evidence_jobs WHERE state='retry_wait'").get() as { readonly at?: string | null };
    return row.at ?? undefined;
  }

  pendingCount(): number {
    const row = this.#database.prepare("SELECT count(*) AS total FROM evidence_jobs WHERE state IN ('admitted','running','retry_wait')").get() as { readonly total: number };
    return Number(row.total);
  }

  // -------------------------------------------------------------------------------------------
  // Application and consumption ([[D2547]], [[D2587]]–[[D2589]], [[D2673]]–[[D2676]], [[D2745]], [[D2746]], [[D2776]], [[D2808]])
  // -------------------------------------------------------------------------------------------

  #assertTriggers(): void {
    const names = new Set((this.#database.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='evidence_run_transitions'").all() as unknown as readonly { readonly name: string }[]).map((row) => row.name));
    if (!names.has("evidence_run_transitions_no_update") || !names.has("evidence_run_transitions_no_direct_delete")) throw new EvidenceJobCorrupt("evidence transition history is not append-only");
  }

  /** Replay a consumed row after response loss: every column rejoins the retained transition. */
  #replayConsumed(row: Extract<EvidenceJobRow, { state: "consumed" }>, current: DrillRun): EvidenceApplication {
    this.#assertTriggers();
    const transition = this.#database.prepare("SELECT * FROM evidence_run_transitions WHERE job_id=?").get(row.id) as Record<string, unknown> | undefined;
    if (transition === undefined) throw new EvidenceJobCorrupt("consumed row has no retained transition");
    const receipt = row.receipt;
    const before = JSON.parse(String(transition.before_run_json)) as DrillRun;
    const after = JSON.parse(String(transition.after_run_json)) as DrillRun;
    const events = after.events.filter((event) => event.seq >= receipt.firstEventSeq && event.seq <= receipt.lastEventSeq);
    const expected = {
      run_id: row.runId,
      from_revision: receipt.fromRevision,
      to_revision: receipt.toRevision,
      first_event_seq: receipt.firstEventSeq,
      last_event_seq: receipt.lastEventSeq,
      event_digest: receipt.eventDigest,
      transition_digest: receipt.transitionDigest,
      before_run_digest: runImageDigest(before),
      after_run_digest: runImageDigest(after),
    };
    for (const [column, value] of Object.entries(expected)) if (transition[column] !== value) throw new EvidenceJobCorrupt(`transition ${column} does not join the application receipt`);
    if (!isCanonicalUtcIso(transition.committed_at) || transition.committed_at !== row.consumedAt) throw new EvidenceJobCorrupt("transition clock is not the consumption instant");
    this.#assertSuffix(before, after, receipt.firstEventSeq, receipt.lastEventSeq);
    if (events.length !== receipt.lastEventSeq - receipt.firstEventSeq + 1 || eventDigest(events) !== receipt.eventDigest) throw new EvidenceJobCorrupt("receipt event range does not verify");
    if (transitionDigest({ jobId: row.id, runId: row.runId, fromRevision: receipt.fromRevision, toRevision: receipt.toRevision, beforeRunDigest: expected.before_run_digest, afterRunDigest: expected.after_run_digest, firstEventSeq: receipt.firstEventSeq, lastEventSeq: receipt.lastEventSeq, eventDigest: receipt.eventDigest }) !== receipt.transitionDigest) {
      throw new EvidenceJobCorrupt("transition digest does not verify");
    }
    if (!this.#appliedEventsCarry(row, events)) throw new EvidenceJobCorrupt("consumed events do not carry this job's evidence reference");
    const currentSlice = current.events.filter((event) => event.seq >= receipt.firstEventSeq && event.seq <= receipt.lastEventSeq);
    if (!sameJson(currentSlice, events)) throw new EvidenceJobCorrupt("the current run no longer retains the applied journal range");
    return Object.freeze({ run: current, emitted: Object.freeze(currentSlice), receipt, replayed: true });
  }

  #assertSuffix(before: DrillRun, after: DrillRun, first: number, last: number): void {
    const tail = before.events.at(-1)?.seq ?? 0;
    if (!sameJson(after.events.slice(0, before.events.length), before.events)) throw new EvidenceJobCorrupt("the after-run does not retain the before-run journal");
    const suffix = after.events.slice(before.events.length);
    if (suffix.length === 0 || first !== tail + 1 || last !== tail + suffix.length || suffix.some((event, index) => event.seq !== tail + 1 + index)) {
      throw new EvidenceJobCorrupt("the appended journal suffix is not contiguous after the before-run tail");
    }
  }

  #appliedEventsCarry(row: EvidenceJobRow, events: readonly DrillRunEvent[]): boolean {
    const reference = evidenceRefForJob(row.request.kind, row.id);
    const attached = events.find((event) => event.type === "evidence.attached");
    if (attached === undefined || attached.data.nodeId !== row.nodeId || !attached.data.evidenceRefs.includes(reference)) return false;
    const objective = events.find((event) => event.type === "objective.state_changed");
    return objective === undefined || objective.data.evidenceRefs.includes(reference);
  }

  /**
   * Resolve the application for one result sequence against the CAS-owned before-run. A consumed
   * row returns its validated stored result; a success row derives every event from the stored
   * settlement plus the registered guard. The returned `commit` performs the transition insert and
   * the success→consumed CAS inside the caller's save transaction.
   */
  applicationInTransaction(input: { readonly before: DrillRun; readonly resultSeq: number; readonly at: string; readonly guard: RecordedGuardAuthority }):
    | { readonly kind: "replay"; readonly result: EvidenceApplication }
    | { readonly kind: "apply"; readonly run: DrillRun; readonly commit: () => EvidenceApplication } {
    const { before } = input;
    const row = this.resultRow(before.id, input.resultSeq);
    if (row === undefined) throw new ServerError("EVIDENCE_RESULT_NOT_FOUND", `Unknown staged evidence result: ${input.resultSeq}`);
    if (row.state === "consumed") return { kind: "replay", result: this.#replayConsumed(row, before) };
    const node = before.nodes.find((candidate) => candidate.id === row.nodeId);
    if (node === undefined || node.fen !== row.request.fen) throw new EvidenceJobCorrupt("staged evidence names a node absent from the CAS-owned run");
    const reference = evidenceRefForJob(row.request.kind, row.id);
    const refs = Object.freeze([reference]);
    const attached = attachEvidence(before, row.nodeId, refs, row.settlement.payload, input.at);
    const proposal = row.settlement.objectiveProposal;
    const upgraded = proposal === null ? attached : applyObjectiveEvidenceProposal(attached.run, proposal, input.at);
    const guarded = before.feedbackPolicy === "immediate_guard" ? input.guard(upgraded.run, row.nodeId, refs, input.at) : upgraded;
    const after = guarded.run;
    const firstEventSeq = (before.events.at(-1)?.seq ?? 0) + 1;
    const lastEventSeq = after.events.at(-1)?.seq ?? 0;
    this.#assertSuffix(before, after, firstEventSeq, lastEventSeq);
    const suffix = Object.freeze(after.events.slice(before.events.length));
    if (!this.#appliedEventsCarry(row, suffix)) throw new EvidenceJobCorrupt("application events do not carry this job's evidence reference");
    const commit = (): EvidenceApplication => {
      this.#assertTriggers();
      const at = this.now();
      const previous = this.#database.prepare("SELECT MAX(to_revision) AS revision FROM evidence_run_transitions WHERE run_id=?").get(before.id) as { readonly revision: number | null };
      const fromRevision = previous.revision ?? 0;
      const toRevision = fromRevision + 1;
      const beforeRunDigest = runImageDigest(before);
      const afterRunDigest = runImageDigest(after);
      const events = eventDigest(suffix);
      const transition = transitionDigest({ jobId: row.id, runId: before.id, fromRevision, toRevision, beforeRunDigest, afterRunDigest, firstEventSeq, lastEventSeq, eventDigest: events });
      this.#database.prepare(`INSERT INTO evidence_run_transitions (run_id,job_id,from_revision,to_revision,before_run_json,before_run_digest,after_run_json,after_run_digest,first_event_seq,last_event_seq,event_digest,transition_digest,committed_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(before.id, row.id, fromRevision, toRevision, JSON.stringify(before), beforeRunDigest, JSON.stringify(after), afterRunDigest, firstEventSeq, lastEventSeq, events, transition, at);
      const receipt: EvidenceApplicationReceiptV1 = Object.freeze({ schema: "evidence_application_receipt@2", jobId: row.id, runId: before.id, nodeId: row.nodeId, fromRevision, toRevision, firstEventSeq, lastEventSeq, eventDigest: events, transitionDigest: transition });
      const changed = this.#database.prepare(`UPDATE evidence_jobs SET state='consumed', consumed_at=?, application_receipt_json=? WHERE id=? AND state='settled_success' AND result_seq=?`)
        .run(at, canonicalizeJson(receipt), row.id, row.resultSeq);
      if (changed.changes !== 1) throw new EvidenceJobCorrupt("staged evidence changed inside the application transaction");
      this.#row(row.id);
      return Object.freeze({ run: after, emitted: suffix, receipt, replayed: false });
    };
    return { kind: "apply", run: after, commit };
  }
}

/** A provider response retrieved after its exact lease expiry is stale ([[D2807]]). */
export class EvidenceProviderLate extends Error {
  constructor() {
    super("provider response arrived after the job lease expired");
    this.name = "EvidenceProviderLate";
  }
}
