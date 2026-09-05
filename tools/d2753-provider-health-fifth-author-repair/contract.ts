// DISPOSABLE author contract for D2753-D2760. Not production code.
import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import { APPLICATION_CONSUMER_DECLARATIONS } from "./application-consumers.js";

export const EXCHANGE_OPERATION_IDS = Object.freeze([
  "stockfish.legal_root_table@1",
  "stockfish.position_evaluation@1",
  "maia.policy_page@1",
  "syzygy.position@1",
  "lichess_explorer.position_page@1",
  "external_voice.render@1",
  "external_voice.reasoning_review@1",
  "external_tts.synthesize@1",
] as const);
export type ExchangeOperationId = (typeof EXCHANGE_OPERATION_IDS)[number];

export const PROVIDER_INSTANCE_IDS = Object.freeze([
  "stockfish-play",
  "stockfish-analysis",
  "maia-inference",
  "tablebase-primary",
  "explorer-primary",
  "external-voice",
  "external-tts",
] as const);
export type ProviderInstanceId = (typeof PROVIDER_INSTANCE_IDS)[number];

export const APPLICATION_PROVIDER_OPERATION_IDS = Object.freeze([
  "opponent.stockfish_play",
  "opponent.maia_inference",
  "evidence.stockfish_analysis",
  "evidence.tablebase_probe",
  "evidence.explorer_query",
  "render.voice",
  "render.voice_compare",
  "render.voice_story",
  "review.reasoning",
  "render.speech",
] as const);
export type ApplicationProviderOperationId = (typeof APPLICATION_PROVIDER_OPERATION_IDS)[number];
export type FailureReason = "startup" | "process_exit" | "timeout" | "network" | "rate_limited" | "overloaded" | "authentication" | "protocol";

const EXCHANGE_INSTANCE: Readonly<Record<ExchangeOperationId, ProviderInstanceId>> = Object.freeze({
  "stockfish.legal_root_table@1": "stockfish-play",
  "stockfish.position_evaluation@1": "stockfish-analysis",
  "maia.policy_page@1": "maia-inference",
  "syzygy.position@1": "tablebase-primary",
  "lichess_explorer.position_page@1": "explorer-primary",
  "external_voice.render@1": "external-voice",
  "external_voice.reasoning_review@1": "external-voice",
  "external_tts.synthesize@1": "external-tts",
});

export interface ApplicationStageDeclaration {
  readonly stageId: string;
  readonly instanceId: ProviderInstanceId;
  readonly exchangeOperation: ExchangeOperationId;
  readonly fallback: "none" | "deterministic_renderer" | "browser_speech_or_text";
}
export interface ApplicationOperationDeclaration {
  readonly operationId: ApplicationProviderOperationId;
  readonly consumer: string;
  readonly deadline: "consumer_budget";
  readonly stages: readonly ApplicationStageDeclaration[];
}

const compiledOperations = new WeakSet<object>();
function exactKeys(value: object, expected: readonly string[], code: string): void {
  const actual = Object.keys(value).sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== [...expected].sort()[index])) throw new TypeError(code);
}

export function compileApplicationOperations(): readonly ApplicationOperationDeclaration[] {
  const expected = new Set<string>(APPLICATION_PROVIDER_OPERATION_IDS);
  const seen = new Set<string>();
  const rows = APPLICATION_CONSUMER_DECLARATIONS.map((raw) => {
    exactKeys(raw, ["consumer", "exchangeOperation", "fallback", "instanceId", "operationId", "stageId"], "APPLICATION_CONSUMER_SHAPE");
    if (!expected.has(raw.operationId) || seen.has(raw.operationId)) throw new TypeError("APPLICATION_OPERATION_SET_MISMATCH");
    if (EXCHANGE_INSTANCE[raw.exchangeOperation] !== raw.instanceId) throw new TypeError("EXCHANGE_INSTANCE_MISMATCH");
    seen.add(raw.operationId);
    const stage = Object.freeze({ stageId: raw.stageId, instanceId: raw.instanceId, exchangeOperation: raw.exchangeOperation, fallback: raw.fallback });
    const row = Object.freeze({ operationId: raw.operationId, consumer: raw.consumer, deadline: "consumer_budget" as const, stages: Object.freeze([stage]) });
    compiledOperations.add(row);
    return row;
  });
  if (seen.size !== expected.size) throw new TypeError("APPLICATION_OPERATION_SET_MISMATCH");
  return Object.freeze(rows);
}

export type ProviderStageRequest = Readonly<{
  operation: ExchangeOperationId;
  instanceId: ProviderInstanceId;
  generation: string;
  normalizedRequestDigest: string;
}>;
export type ProviderDelivery<T> = Readonly<ProviderStageRequest & { payload: T; responseDigest: string }>;
export type ProviderFailure = Readonly<ProviderStageRequest & { reason: FailureReason }>;
const requests = new WeakSet<object>();
const deliveries = new WeakSet<object>();
const failures = new WeakSet<object>();

function safeText(value: string, code: string): string {
  if (value.length === 0 || value.length > 512 || !/^[\x20-\x7e]+$/u.test(value)) throw new TypeError(code);
  return value;
}
function safeMonotonic(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) throw new TypeError("MONOTONIC_TIME_INVALID");
  return value;
}

/** Test stand-in for the provider-exchange scheduler; provider health can assert but not mint these values. */
export class ProviderExchangeHarness {
  request(operation: ExchangeOperationId, generation: string, normalizedRequestDigest: string): ProviderStageRequest {
    const value = Object.freeze({ operation, instanceId: EXCHANGE_INSTANCE[operation], generation: safeText(generation, "GENERATION_INVALID"), normalizedRequestDigest: safeText(normalizedRequestDigest, "REQUEST_DIGEST_INVALID") });
    requests.add(value);
    return value;
  }
  success<T>(request: ProviderStageRequest, payload: T, responseDigest: string): ProviderDelivery<T> {
    assertRequest(request);
    const value = deepFreeze({ ...request, payload, responseDigest: safeText(responseDigest, "RESPONSE_DIGEST_INVALID") });
    deliveries.add(value);
    return value;
  }
  failure(request: ProviderStageRequest, reason: FailureReason): ProviderFailure {
    assertRequest(request);
    const value = Object.freeze({ ...request, reason });
    failures.add(value);
    return value;
  }
}
function assertRequest(value: unknown): asserts value is ProviderStageRequest {
  if (typeof value !== "object" || value === null || !requests.has(value)) throw new TypeError("PROVIDER_REQUEST_NOT_SEALED");
}
function assertDelivery(value: unknown): asserts value is ProviderDelivery<unknown> {
  if (typeof value !== "object" || value === null || !deliveries.has(value)) throw new TypeError("PROVIDER_DELIVERY_NOT_SEALED");
}
function assertFailure(value: unknown): asserts value is ProviderFailure {
  if (typeof value !== "object" || value === null || !failures.has(value)) throw new TypeError("PROVIDER_FAILURE_NOT_SEALED");
}

export type StageSettlement<T = unknown> =
  | Readonly<{ kind: "success"; stageId: string; request: ProviderStageRequest; delivery: ProviderDelivery<T> }>
  | Readonly<{ kind: "failed"; stageId: string; request: ProviderStageRequest; failure: ProviderFailure }>
  | Readonly<{ kind: "cancelled"; stageId: string; reason: "caller" | "superseded" | "shutdown" }>;
export type ApplicationProviderOutcome<T = unknown> =
  | Readonly<{ kind: "complete"; value: T; settlements: readonly StageSettlement[] }>
  | Readonly<{ kind: "fallback"; value: T; settlements: readonly StageSettlement[]; source: "deterministic_renderer" | "browser_speech_or_text" }>
  | Readonly<{ kind: "unavailable"; settlements: readonly StageSettlement[] }>
  | Readonly<{ kind: "cancelled"; settlements: readonly StageSettlement[]; reason: "caller" | "superseded" | "shutdown" }>;

function sameRequest(left: ProviderStageRequest, right: ProviderStageRequest): boolean {
  return left.operation === right.operation && left.instanceId === right.instanceId && left.generation === right.generation && left.normalizedRequestDigest === right.normalizedRequestDigest;
}
export function settleOperation<T>(declaration: ApplicationOperationDeclaration, settlements: readonly StageSettlement<T>[], fallbackValue?: T): ApplicationProviderOutcome<T> {
  if (!compiledOperations.has(declaration)) throw new TypeError("APPLICATION_OPERATION_NOT_COMPILED");
  if (settlements.length !== declaration.stages.length) throw new TypeError("STAGE_SETTLEMENT_CARDINALITY");
  for (let index = 0; index < settlements.length; index += 1) {
    const settlement = settlements[index]!;
    const stage = declaration.stages[index]!;
    if (settlement.stageId !== stage.stageId) throw new TypeError("STAGE_SETTLEMENT_ORDER");
    if (settlement.kind === "success") {
      assertRequest(settlement.request);
      assertDelivery(settlement.delivery);
      if (!sameRequest(settlement.request, settlement.delivery) || settlement.request.operation !== stage.exchangeOperation || settlement.request.instanceId !== stage.instanceId) throw new TypeError("STAGE_DELIVERY_SUBJECT_MISMATCH");
    } else if (settlement.kind === "failed") {
      assertRequest(settlement.request);
      assertFailure(settlement.failure);
      if (!sameRequest(settlement.request, settlement.failure) || settlement.request.operation !== stage.exchangeOperation || settlement.request.instanceId !== stage.instanceId) throw new TypeError("STAGE_FAILURE_SUBJECT_MISMATCH");
    }
  }
  const frozen = Object.freeze([...settlements]);
  const cancelled = settlements.find((item) => item.kind === "cancelled");
  if (cancelled?.kind === "cancelled") return Object.freeze({ kind: "cancelled", settlements: frozen, reason: cancelled.reason });
  const failedIndex = settlements.findIndex((item) => item.kind === "failed");
  if (failedIndex >= 0) {
    const source = declaration.stages[failedIndex]!.fallback;
    if (source === "none" || fallbackValue === undefined) return Object.freeze({ kind: "unavailable", settlements: frozen });
    return Object.freeze({ kind: "fallback", value: deepFreeze(fallbackValue), settlements: frozen, source });
  }
  const success = settlements.at(-1);
  if (success?.kind !== "success") throw new TypeError("APPLICATION_VALUE_MISSING");
  return Object.freeze({ kind: "complete", value: success.delivery.payload, settlements: frozen });
}

type Circuit = { state: "unverified" | "available" | "open"; generation: string; reason: FailureReason | null; checkedAt: number | null; transientOpenTimes: number[] };
export type ProviderHealthSnapshot = Readonly<{ instanceId: ProviderInstanceId; generation: string; state: "unverified" | "available" | "unavailable"; reason: FailureReason | null; checkedAtMonotonic: number | null }>;
export type ProviderRegistrySnapshot = Readonly<{ revision: number; instances: readonly ProviderHealthSnapshot[]; digest: string }>;
export type ProviderReleaseReceipt = Readonly<{ snapshotDigest: string; registryRevision: number; generations: readonly Readonly<{ instanceId: ProviderInstanceId; generation: string }>[] }>;
const snapshots = new WeakMap<object, ProviderHealthRegistry>();
const releaseReceipts = new WeakSet<object>();

export class ProviderHealthRegistry {
  readonly #circuits = new Map<ProviderInstanceId, Circuit>();
  #revision = 0;
  constructor(configured: readonly Readonly<{ instanceId: ProviderInstanceId; generation: string }>[]) {
    for (const row of configured) {
      if (this.#circuits.has(row.instanceId)) throw new TypeError("PROVIDER_INSTANCE_DUPLICATE");
      this.#circuits.set(row.instanceId, { state: "unverified", generation: safeText(row.generation, "GENERATION_INVALID"), reason: null, checkedAt: null, transientOpenTimes: [] });
    }
  }
  recordSuccess(request: ProviderStageRequest, delivery: ProviderDelivery<unknown>, now: number): void {
    assertRequest(request);
    assertDelivery(delivery);
    safeMonotonic(now);
    if (!sameRequest(request, delivery)) throw new TypeError("HEALTH_SUCCESS_SUBJECT_MISMATCH");
    const state = this.#current(request);
    state.state = "available";
    state.reason = null;
    state.checkedAt = now;
    state.transientOpenTimes = [];
    this.#revision += 1;
  }
  recordFailure(request: ProviderStageRequest, failure: ProviderFailure, now: number): void {
    assertRequest(request);
    assertFailure(failure);
    safeMonotonic(now);
    if (!sameRequest(request, failure)) throw new TypeError("HEALTH_FAILURE_SUBJECT_MISMATCH");
    const state = this.#current(request);
    state.state = "open";
    state.reason = failure.reason;
    state.checkedAt = now;
    state.transientOpenTimes = [...state.transientOpenTimes.filter((time) => now - time < 300_000), now];
    this.#revision += 1;
  }
  changeGeneration(instanceId: ProviderInstanceId, generation: string): void {
    this.#circuits.set(instanceId, { state: "unverified", generation: safeText(generation, "GENERATION_INVALID"), reason: null, checkedAt: null, transientOpenTimes: [] });
    this.#revision += 1;
  }
  snapshot(): ProviderRegistrySnapshot {
    const instances = Object.freeze([...this.#circuits.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([instanceId, state]) => Object.freeze({ instanceId, generation: state.generation, state: state.state === "open" ? "unavailable" as const : state.state, reason: state.reason, checkedAtMonotonic: state.checkedAt })));
    const digest = hash(JSON.stringify(instances));
    const snapshot = Object.freeze({ revision: this.#revision, instances, digest });
    snapshots.set(snapshot, this);
    return snapshot;
  }
  releaseReceipt(snapshot: ProviderRegistrySnapshot): ProviderReleaseReceipt {
    assertSnapshot(snapshot);
    if (snapshots.get(snapshot) !== this || snapshot.revision !== this.#revision) throw new TypeError("PROVIDER_SNAPSHOT_STALE_OR_CROSSED");
    const receipt = Object.freeze({ snapshotDigest: snapshot.digest, registryRevision: snapshot.revision, generations: Object.freeze(snapshot.instances.map(({ instanceId, generation }) => Object.freeze({ instanceId, generation }))) });
    releaseReceipts.add(receipt);
    return receipt;
  }
  #current(request: ProviderStageRequest): Circuit {
    const state = this.#circuits.get(request.instanceId);
    if (state === undefined || state.generation !== request.generation) throw new TypeError("PROVIDER_GENERATION_STALE");
    return state;
  }
}
function assertSnapshot(value: unknown): asserts value is ProviderRegistrySnapshot {
  if (typeof value !== "object" || value === null || !snapshots.has(value)) throw new TypeError("PROVIDER_SNAPSHOT_NOT_SEALED");
}
export function assertProviderReleaseReceipt(value: unknown): asserts value is ProviderReleaseReceipt {
  if (typeof value !== "object" || value === null || !releaseReceipts.has(value)) throw new TypeError("PROVIDER_RELEASE_RECEIPT_NOT_SEALED");
}
export type ProfileAvailability = Readonly<{ state: "available" | "requestable_unverified" | "unavailable"; instanceId: ProviderInstanceId; generation: string }>;
export function selectProfileAvailability(snapshot: ProviderRegistrySnapshot, operationId: ApplicationProviderOperationId): ProfileAvailability {
  assertSnapshot(snapshot);
  const operation = compileApplicationOperations().find((row) => row.operationId === operationId)!;
  const instance = snapshot.instances.find((row) => row.instanceId === operation.stages[0]!.instanceId);
  if (instance === undefined || instance.state === "unavailable") return Object.freeze({ state: "unavailable", instanceId: operation.stages[0]!.instanceId, generation: instance?.generation ?? "not-configured" });
  return Object.freeze({ state: instance.state === "unverified" ? "requestable_unverified" : "available", instanceId: instance.instanceId, generation: instance.generation });
}

export interface CacheKey { readonly operation: ExchangeOperationId; readonly instanceId: ProviderInstanceId; readonly generation: string; readonly requestDigest: string; readonly keyDigest: string }
export interface CacheServiceReceipt { readonly keyDigest: string; readonly servedAtMonotonic: number; readonly source: "retained_exact" }
export type CacheResolution<T> = Readonly<{ kind: "miss" }> | Readonly<{ kind: "hit"; value: T; original: ProviderDelivery<T>; cacheReceipt: CacheServiceReceipt }>;
function keyOf(key: CacheKey): string { return `${key.operation}\0${key.instanceId}\0${key.generation}\0${key.requestDigest}\0${key.keyDigest}`; }
export function cacheKey<T>(delivery: ProviderDelivery<T>, keyDigest: string): CacheKey {
  assertDelivery(delivery);
  return Object.freeze({ operation: delivery.operation, instanceId: delivery.instanceId, generation: delivery.generation, requestDigest: delivery.normalizedRequestDigest, keyDigest: safeText(keyDigest, "CACHE_KEY_INVALID") });
}
export class AtomicExactCache<T> {
  readonly #rows = new Map<string, Readonly<{ key: CacheKey; original: ProviderDelivery<T>; expiresAt: number }>>();
  put(key: CacheKey, original: ProviderDelivery<T>, expiresAt: number, now: number): void {
    assertDelivery(original);
    safeMonotonic(now);
    safeMonotonic(expiresAt);
    if (expiresAt <= now || key.operation !== original.operation || key.instanceId !== original.instanceId || key.generation !== original.generation || key.requestDigest !== original.normalizedRequestDigest) throw new TypeError("CACHE_SUBJECT_MISMATCH");
    const id = keyOf(key);
    this.#rows.delete(id);
    this.#rows.set(id, Object.freeze({ key: Object.freeze({ ...key }), original, expiresAt }));
    while (this.#rows.size > 512) this.#rows.delete(this.#rows.keys().next().value!);
  }
  resolve(key: CacheKey, now: number): CacheResolution<T> {
    safeMonotonic(now);
    const id = keyOf(key);
    const row = this.#rows.get(id);
    if (row === undefined || now >= row.expiresAt) {
      if (row !== undefined) this.#rows.delete(id);
      return Object.freeze({ kind: "miss" });
    }
    this.#rows.delete(id);
    this.#rows.set(id, row);
    return deepFreeze({ kind: "hit", value: row.original.payload, original: row.original, cacheReceipt: { keyDigest: key.keyDigest, servedAtMonotonic: now, source: "retained_exact" } });
  }
  invalidateGeneration(instanceId: ProviderInstanceId, generation: string): void {
    for (const [id, row] of this.#rows) if (row.key.instanceId === instanceId && row.key.generation === generation) this.#rows.delete(id);
  }
}

export type ProviderGenerationSet = Readonly<{ digest: string; members: readonly Readonly<{ instanceId: ProviderInstanceId; generation: string }>[] }>;
const generationSets = new WeakSet<object>();
export function providerGenerationSet(snapshot: ProviderRegistrySnapshot, instanceIds: readonly ProviderInstanceId[]): ProviderGenerationSet {
  assertSnapshot(snapshot);
  const unique = [...new Set(instanceIds)].sort();
  if (unique.length !== instanceIds.length || unique.length === 0) throw new TypeError("GENERATION_SET_MEMBERS_INVALID");
  const members = Object.freeze(unique.map((instanceId) => {
    const row = snapshot.instances.find((candidate) => candidate.instanceId === instanceId);
    if (row === undefined) throw new TypeError("GENERATION_SET_INSTANCE_MISSING");
    return Object.freeze({ instanceId, generation: row.generation });
  }));
  const value = Object.freeze({ digest: hash(JSON.stringify(members)), members });
  generationSets.add(value);
  return value;
}
function assertGenerationSet(value: unknown): asserts value is ProviderGenerationSet {
  if (typeof value !== "object" || value === null || !generationSets.has(value)) throw new TypeError("GENERATION_SET_NOT_SEALED");
}
type LeaseClaim = Readonly<{ token: string; generationSetDigest: string; expiresAtMonotonic: number }>;
export type LeaseAdmission = Readonly<{ kind: "acquired"; token: string }> | Readonly<{ kind: "blocked" | "claimed" }>;
export class BackoffCoordinator {
  #blockedUntilMonotonic = 0;
  #claim: LeaseClaim | null = null;
  #generationSetDigest: string | null = null;
  acquire(now: number, generationSet: ProviderGenerationSet, leaseMs: number): LeaseAdmission {
    safeMonotonic(now);
    assertGenerationSet(generationSet);
    if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0 || leaseMs > 60_000) throw new TypeError("LEASE_DURATION_INVALID");
    if (this.#generationSetDigest !== generationSet.digest) {
      this.#generationSetDigest = generationSet.digest;
      this.#claim = null;
      this.#blockedUntilMonotonic = 0;
    }
    if (this.#blockedUntilMonotonic > now) return Object.freeze({ kind: "blocked" });
    if (this.#claim !== null && this.#claim.expiresAtMonotonic > now) return Object.freeze({ kind: "claimed" });
    const token = randomUUID();
    this.#claim = Object.freeze({ token, generationSetDigest: generationSet.digest, expiresAtMonotonic: now + leaseMs });
    return Object.freeze({ kind: "acquired", token });
  }
  settle(now: number, generationSet: ProviderGenerationSet, token: string, retryAfterMs: number | null): void {
    safeMonotonic(now);
    assertGenerationSet(generationSet);
    if (this.#claim === null || this.#claim.expiresAtMonotonic <= now || this.#claim.generationSetDigest !== generationSet.digest || this.#claim.token !== token) throw new TypeError("LEASE_TOKEN_STALE");
    this.#claim = null;
    if (retryAfterMs !== null) {
      if (!Number.isSafeInteger(retryAfterMs) || retryAfterMs < 0) throw new TypeError("RETRY_AFTER_INVALID");
      this.#blockedUntilMonotonic = Math.max(this.#blockedUntilMonotonic, now + Math.max(60_000, retryAfterMs));
    }
  }
}

export interface SealedTextRef { readonly textDigest: string; readonly evidenceDigest: string; readonly runId: string; readonly nodeId: string; readonly scope: "marker" | "reading" | "steering" | "story" | "compare" }
type AdmittedRenderedItem = Readonly<{ evidenceDigest: string; text: string }>;
const renderedItems = new WeakSet<object>();
const sealedTextRefs = new WeakSet<object>();
/** Test stand-in for the F1 registered renderer, not a health/speech caller mint. */
export function renderAdmittedEvidence(evidenceDigest: string, text: string): AdmittedRenderedItem {
  const value = Object.freeze({ evidenceDigest: safeText(evidenceDigest, "EVIDENCE_DIGEST_INVALID"), text: safeText(text, "RENDERED_TEXT_INVALID") });
  renderedItems.add(value);
  return value;
}
export function recordDisplayedText(item: AdmittedRenderedItem, runId: string, nodeId: string, scope: SealedTextRef["scope"]): SealedTextRef {
  if (!renderedItems.has(item)) throw new TypeError("RENDERED_ITEM_NOT_SEALED");
  const value = Object.freeze({ textDigest: hash(item.text), evidenceDigest: item.evidenceDigest, runId: safeText(runId, "RUN_ID_INVALID"), nodeId: safeText(nodeId, "NODE_ID_INVALID"), scope });
  sealedTextRefs.add(value);
  return value;
}
export function requireSealedText(value: unknown): SealedTextRef {
  if (typeof value !== "object" || value === null || !sealedTextRefs.has(value)) throw new TypeError("SPEECH_TEXT_NOT_SEALED");
  return value as SealedTextRef;
}

export function createOpponentRecoveryDatabase(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS committed_learner_plies(run_id TEXT NOT NULL, event_seq INTEGER NOT NULL, after_fen TEXT NOT NULL, request_digest TEXT NOT NULL, policy_digest TEXT NOT NULL, PRIMARY KEY(run_id,event_seq));
    CREATE TABLE IF NOT EXISTS opponent_recovery(run_id TEXT PRIMARY KEY, learner_event_seq INTEGER NOT NULL, failure_event_seq INTEGER, state TEXT NOT NULL, attempt INTEGER NOT NULL, request_digest TEXT NOT NULL, policy_digest TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS opponent_recovery_events(run_id TEXT NOT NULL, event_seq INTEGER NOT NULL, type TEXT NOT NULL, payload_json TEXT NOT NULL, idempotency_key TEXT UNIQUE, PRIMARY KEY(run_id,event_seq));`);
  return db;
}
/** Test stand-in for the already-committed run-storage learner-ply transaction. */
export function seedCommittedLearnerPly(db: DatabaseSync, input: Readonly<{ runId: string; eventSeq: number; afterFen: string; requestDigest: string; policyDigest: string }>): void {
  db.prepare("INSERT INTO committed_learner_plies VALUES (?,?,?,?,?)").run(input.runId, input.eventSeq, input.afterFen, input.requestDigest, input.policyDigest);
}
export class OpponentRecoveryStore {
  constructor(readonly db: DatabaseSync) {}
  fail(runId: string, learnerEventSeq: number, failureEventSeq: number, reason: FailureReason): void {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const ply = this.db.prepare("SELECT * FROM committed_learner_plies WHERE run_id=? AND event_seq=?").get(runId, learnerEventSeq) as Record<string, unknown> | undefined;
      if (ply === undefined || failureEventSeq <= learnerEventSeq) throw new TypeError("COMMITTED_LEARNER_PLY_MISSING");
      const payload = JSON.stringify({ learnerMoveEventSeq: learnerEventSeq, requestDigest: ply.request_digest, reason });
      this.db.prepare("INSERT INTO opponent_recovery_events VALUES (?,?,?,?,NULL)").run(runId, failureEventSeq, "opponent.selection_failed", payload);
      this.db.prepare("INSERT INTO opponent_recovery VALUES (?,?,?,?,?,?,?) ON CONFLICT(run_id) DO UPDATE SET learner_event_seq=excluded.learner_event_seq,failure_event_seq=excluded.failure_event_seq,state=excluded.state,attempt=excluded.attempt,request_digest=excluded.request_digest,policy_digest=excluded.policy_digest").run(runId, learnerEventSeq, failureEventSeq, "failed", 1, String(ply.request_digest), String(ply.policy_digest));
      this.db.exec("COMMIT");
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
  retry(runId: string, idempotencyKey: string): void {
    this.#recover(runId, idempotencyKey, "retry", null, null);
  }
  change(runId: string, idempotencyKey: string, toPolicyDigest: string, nextRequestDigest: string): void {
    this.#recover(runId, idempotencyKey, "change", safeText(toPolicyDigest, "POLICY_DIGEST_INVALID"), safeText(nextRequestDigest, "REQUEST_DIGEST_INVALID"));
  }
  state(runId: string): Readonly<Record<string, unknown>> | null {
    const row = this.db.prepare("SELECT * FROM opponent_recovery WHERE run_id=?").get(runId) as Record<string, unknown> | undefined;
    return row === undefined ? null : Object.freeze({ ...row });
  }
  #recover(runId: string, idempotencyKey: string, action: "retry" | "change", toPolicyDigest: string | null, nextRequestDigest: string | null): void {
    safeText(idempotencyKey, "IDEMPOTENCY_KEY_INVALID");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const existing = this.db.prepare("SELECT run_id,payload_json FROM opponent_recovery_events WHERE idempotency_key=?").get(idempotencyKey) as Record<string, unknown> | undefined;
      if (existing !== undefined) {
        const prior = JSON.parse(String(existing.payload_json)) as Record<string, unknown>;
        const same = existing.run_id === runId && prior.action === action && (action === "retry" || (prior.toPolicyDigest === toPolicyDigest && prior.requestDigest === nextRequestDigest));
        if (!same) throw new TypeError("OPPONENT_RECOVERY_IDEMPOTENCY_CROSSED");
        this.db.exec("COMMIT");
        return;
      }
      const current = this.db.prepare("SELECT * FROM opponent_recovery WHERE run_id=?").get(runId) as Record<string, unknown> | undefined;
      if (current === undefined || current.state !== "failed") throw new TypeError("OPPONENT_RECOVERY_NOT_FAILED");
      const eventSeq = Number(current.failure_event_seq) + 1;
      const policy = action === "change" ? toPolicyDigest! : String(current.policy_digest);
      const request = action === "change" ? nextRequestDigest! : String(current.request_digest);
      if (action === "change" && policy === current.policy_digest) throw new TypeError("OPPONENT_POLICY_UNCHANGED");
      const payload = JSON.stringify({ failureEventSeq: current.failure_event_seq, idempotencyKey, action, fromPolicyDigest: current.policy_digest, toPolicyDigest: policy, requestDigest: request });
      this.db.prepare("INSERT INTO opponent_recovery_events VALUES (?,?,?,?,?)").run(runId, eventSeq, "opponent.recovery_requested", payload, idempotencyKey);
      this.db.prepare("UPDATE opponent_recovery SET state='waiting',attempt=attempt+1,request_digest=?,policy_digest=? WHERE run_id=?").run(request, policy, runId);
      this.db.exec("COMMIT");
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }
}

function hash(value: string): string { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}
