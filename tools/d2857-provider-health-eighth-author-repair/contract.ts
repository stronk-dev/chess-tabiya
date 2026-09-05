// DISPOSABLE composed author contract for D2857-D2859. Not production code.
import { createHash, randomUUID } from "node:crypto";

export {
  RecoveryAuthority,
  appendRunEvent,
  createRecoveryDatabase,
  type ChangeCommand,
  type OpponentPolicy,
  type RetryCommand,
} from "../d2815-provider-health-sixth-author-repair/contract.js";

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

export type ProviderFamilyId = "stockfish" | "maia" | "tablebase" | "explorer" | "voice" | "tts";
export type ProviderImplementation = "uci_sidecar" | "lichess_http" | "external_http" | "local_service" | "local_fixture";
export type BackoffGroupId = "lichess-api" | "external-voice-api" | "external-tts-api";

export const PROVIDER_INSTANCE_DECLARATIONS = deepFreeze([
  { instanceId: "stockfish-play", familyId: "stockfish", allowedImplementations: ["uci_sidecar", "local_fixture"], backoffGroup: null },
  { instanceId: "stockfish-analysis", familyId: "stockfish", allowedImplementations: ["uci_sidecar", "local_fixture"], backoffGroup: null },
  { instanceId: "maia-inference", familyId: "maia", allowedImplementations: ["local_service", "local_fixture"], backoffGroup: null },
  { instanceId: "tablebase-primary", familyId: "tablebase", allowedImplementations: ["lichess_http", "local_service", "local_fixture"], backoffGroup: "lichess-api" },
  { instanceId: "explorer-primary", familyId: "explorer", allowedImplementations: ["lichess_http", "local_service", "local_fixture"], backoffGroup: "lichess-api" },
  { instanceId: "external-voice", familyId: "voice", allowedImplementations: ["external_http", "local_fixture"], backoffGroup: "external-voice-api" },
  { instanceId: "external-tts", familyId: "tts", allowedImplementations: ["external_http", "local_fixture"], backoffGroup: "external-tts-api" },
] as const);
export type ProviderInstanceId = (typeof PROVIDER_INSTANCE_DECLARATIONS)[number]["instanceId"];

const INSTANCE = new Map(PROVIDER_INSTANCE_DECLARATIONS.map((row) => [row.instanceId, row]));
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

export const APPLICATION_OPERATION_IDS = Object.freeze([
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
export type ApplicationOperationId = (typeof APPLICATION_OPERATION_IDS)[number];
export type Fallback = "none" | "deterministic_renderer" | "browser_speech_or_text";
export type ApplicationDeclaration = Readonly<{
  operationId: ApplicationOperationId;
  consumer: string;
  deadline: "consumer_budget";
  stage: Readonly<{ stageId: string; instanceId: ProviderInstanceId; exchangeOperation: ExchangeOperationId; fallback: Fallback }>;
}>;

const RAW_APPLICATIONS = [
  ["opponent.stockfish_play", "opponent.selection", "select", "stockfish-play", "stockfish.legal_root_table@1", "none"],
  ["opponent.maia_inference", "opponent.selection", "select", "maia-inference", "maia.policy_page@1", "none"],
  ["evidence.stockfish_analysis", "live.stockfish", "analyse", "stockfish-analysis", "stockfish.position_evaluation@1", "none"],
  ["evidence.tablebase_probe", "live.syzygy", "probe", "tablebase-primary", "syzygy.position@1", "none"],
  ["evidence.explorer_query", "human.explorer", "query", "explorer-primary", "lichess_explorer.position_page@1", "none"],
  ["render.voice", "guidance.voice", "text", "external-voice", "external_voice.render@1", "deterministic_renderer"],
  ["render.voice_compare", "guidance.voice_compare", "text", "external-voice", "external_voice.render@1", "deterministic_renderer"],
  ["render.voice_story", "guidance.voice_story", "text", "external-voice", "external_voice.render@1", "deterministic_renderer"],
  ["review.reasoning", "review.reasoning", "review", "external-voice", "external_voice.reasoning_review@1", "none"],
  ["render.speech", "guidance.speech", "audio", "external-tts", "external_tts.synthesize@1", "browser_speech_or_text"],
] as const;

export const APPLICATION_DECLARATIONS: readonly ApplicationDeclaration[] = deepFreeze(RAW_APPLICATIONS.map(([operationId, consumer, stageId, instanceId, exchangeOperation, fallback]) => ({
  operationId, consumer, deadline: "consumer_budget" as const,
  stage: { stageId, instanceId, exchangeOperation, fallback },
}))) as readonly ApplicationDeclaration[];
const expectedApplications = new Map(APPLICATION_DECLARATIONS.map((row) => [row.operationId, canonical(row)]));
const compiledApplications = new WeakSet<object>();

export function compileApplications(candidate: unknown = APPLICATION_DECLARATIONS): readonly ApplicationDeclaration[] {
  if (!Array.isArray(candidate)) fail("APPLICATIONS_NOT_ARRAY");
  const seen = new Set<string>();
  const parsed = candidate.map((raw) => {
    if (!plain(raw) || !exactKeys(raw, ["consumer", "deadline", "operationId", "stage"]) ||
        !APPLICATION_OPERATION_IDS.includes(raw.operationId as ApplicationOperationId) ||
        typeof raw.consumer !== "string" || raw.consumer.length === 0 || raw.deadline !== "consumer_budget" || !plain(raw.stage)) fail("APPLICATION_INVALID");
    if (!exactKeys(raw.stage, ["exchangeOperation", "fallback", "instanceId", "stageId"]) ||
        typeof raw.stage.stageId !== "string" || raw.stage.stageId.length === 0 ||
        !EXCHANGE_OPERATION_IDS.includes(raw.stage.exchangeOperation as ExchangeOperationId) ||
        !INSTANCE.has(raw.stage.instanceId as ProviderInstanceId) ||
        !["none", "deterministic_renderer", "browser_speech_or_text"].includes(String(raw.stage.fallback)) ||
        EXCHANGE_INSTANCE[raw.stage.exchangeOperation as ExchangeOperationId] !== raw.stage.instanceId) fail("APPLICATION_STAGE_INVALID");
    if (seen.has(raw.operationId as string)) fail("APPLICATION_DUPLICATE");
    seen.add(raw.operationId as string);
    const row = deepFreeze(structuredClone(raw)) as ApplicationDeclaration;
    if (canonical(row) !== expectedApplications.get(row.operationId)) fail("APPLICATION_SEMANTICS_MISMATCH");
    compiledApplications.add(row);
    return row;
  });
  if (seen.size !== APPLICATION_OPERATION_IDS.length) fail("APPLICATION_SET_MISMATCH");
  return Object.freeze(parsed);
}

export type FailureReason = "startup" | "process_exit" | "timeout" | "network" | "rate_limited" | "overloaded" | "authentication" | "protocol" | "cancelled_by_shutdown";
export type ExchangeRequest = Readonly<{ operation: ExchangeOperationId; instanceId: ProviderInstanceId; implementation: ProviderImplementation; generation: string; requestDigest: string }>;
export type ExchangeDelivery<T> = Readonly<ExchangeRequest & { payload: T; responseDigest: string; payloadDigest: string }>;
export type ExchangeFailure = Readonly<ExchangeRequest & { reason: FailureReason }>;
const requests = new WeakSet<object>();
const deliveries = new WeakSet<object>();
const failures = new WeakSet<object>();

export class ExchangeAuthority {
  request(operation: ExchangeOperationId, implementation: ProviderImplementation, generation: string, requestDigest: string): ExchangeRequest {
    if (!EXCHANGE_OPERATION_IDS.includes(operation)) fail("EXCHANGE_OPERATION_INVALID");
    const instanceId = EXCHANGE_INSTANCE[operation];
    const declaration = INSTANCE.get(instanceId)!;
    if (!(declaration.allowedImplementations as readonly string[]).includes(implementation)) fail("EXCHANGE_IMPLEMENTATION_INVALID");
    const value = deepFreeze({ operation, instanceId, implementation, generation: text(generation), requestDigest: text(requestDigest) });
    requests.add(value);
    return value;
  }
  success<T>(request: ExchangeRequest, payload: T, responseDigest: string): ExchangeDelivery<T> {
    assertRequest(request);
    const retainedPayload = deepFreeze(structuredClone(payload));
    const value = deepFreeze({
      ...request,
      payload: retainedPayload,
      responseDigest: text(responseDigest),
      payloadDigest: hash(canonical(retainedPayload)),
    });
    deliveries.add(value);
    return value;
  }
  failure(request: ExchangeRequest, reason: FailureReason): ExchangeFailure {
    assertRequest(request); assertFailureReason(reason);
    const value = deepFreeze({ ...request, reason });
    failures.add(value);
    return value;
  }
}

export type StageSettlement<T = unknown> =
  | Readonly<{ kind: "success"; stageId: string; request: ExchangeRequest; delivery: ExchangeDelivery<T> }>
  | Readonly<{ kind: "failed"; stageId: string; request: ExchangeRequest; failure: ExchangeFailure }>
  | Readonly<{ kind: "local_domain"; stageId: string; request: ExchangeRequest; value: T }>
  | Readonly<{ kind: "cancelled"; stageId: string; reason: "caller" | "superseded" | "shutdown" }>;
export type ApplicationProviderOutcome<T = unknown> =
  | Readonly<{ kind: "complete"; value: T; settlement: StageSettlement<T> }>
  | Readonly<{ kind: "fallback"; value: T; source: Exclude<Fallback, "none">; settlement: StageSettlement<T> }>
  | Readonly<{ kind: "unavailable"; settlement: StageSettlement<T> }>
  | Readonly<{ kind: "cancelled"; reason: "caller" | "superseded" | "shutdown"; settlement: StageSettlement<T> }>;

export function settleOperation<T>(declaration: ApplicationDeclaration, settlement: StageSettlement<T>, fallbackValue?: T): ApplicationProviderOutcome<T> {
  if (!compiledApplications.has(declaration)) fail("APPLICATION_NOT_COMPILED");
  if (settlement.stageId !== declaration.stage.stageId) fail("SETTLEMENT_STAGE_CROSSED");
  if (settlement.kind === "cancelled") return deepFreeze({ kind: "cancelled", reason: settlement.reason, settlement });
  assertRequest(settlement.request);
  if (settlement.request.operation !== declaration.stage.exchangeOperation || settlement.request.instanceId !== declaration.stage.instanceId) fail("SETTLEMENT_SUBJECT_CROSSED");
  if (settlement.kind === "success") {
    assertDelivery(settlement.delivery); sameSubject(settlement.request, settlement.delivery);
    return deepFreeze({ kind: "complete", value: settlement.delivery.payload, settlement });
  }
  if (settlement.kind === "local_domain") return deepFreeze({ kind: "complete", value: settlement.value, settlement });
  assertFailure(settlement.failure); sameSubject(settlement.request, settlement.failure);
  if (declaration.stage.fallback === "none" || fallbackValue === undefined) return deepFreeze({ kind: "unavailable", settlement });
  return deepFreeze({ kind: "fallback", value: fallbackValue, source: declaration.stage.fallback, settlement });
}

type Configured = Readonly<{ instanceId: ProviderInstanceId; implementation: ProviderImplementation; generation: string }>;
type Circuit = { configured: Configured; state: "unverified" | "available" | "open" | "recovering"; reason: FailureReason | null; checkedAt: number | null; lastSuccessAt: number | null; lastFailureAt: number | null; transientOpens: number[]; consecutiveSuccesses: 0 | 1; retryAt: number | null };
export type HealthSnapshot =
  | Readonly<{ instanceId: ProviderInstanceId; familyId: ProviderFamilyId; state: "not_configured" }>
  | Readonly<{ instanceId: ProviderInstanceId; familyId: ProviderFamilyId; state: "unverified"; implementation: ProviderImplementation; generation: string; retryAfterMs: null }>
  | Readonly<{ instanceId: ProviderInstanceId; familyId: ProviderFamilyId; state: "available"; implementation: ProviderImplementation; generation: string; reason: null; retryAfterMs: null; checkedAt: string; lastSuccessAt: string; lastFailureAt: string | null }>
  | Readonly<{ instanceId: ProviderInstanceId; familyId: ProviderFamilyId; state: "recovering"; implementation: ProviderImplementation; generation: string; priorReason: FailureReason; consecutiveSuccesses: 1; requiredSuccesses: 2; retryAfterMs: null; checkedAt: string; lastSuccessAt: string; lastFailureAt: string }>
  | Readonly<{ instanceId: ProviderInstanceId; familyId: ProviderFamilyId; state: "degraded_cached_only"; implementation: ProviderImplementation; generation: string; reason: FailureReason; retryAfterMs: number | null; cacheScope: "exact_request"; validExactEntries: number; cacheRevision: number; checkedAt: string; lastSuccessAt: string | null; lastFailureAt: string }>
  | Readonly<{ instanceId: ProviderInstanceId; familyId: ProviderFamilyId; state: "unavailable"; implementation: ProviderImplementation; generation: string; reason: FailureReason; retryAfterMs: number | null; cacheScope: "none"; checkedAt: string; lastSuccessAt: string | null; lastFailureAt: string }>;
export type ProviderRegistrySnapshot = Readonly<{ revision: number; generatedAt: string; instances: readonly HealthSnapshot[]; digest: string }>;
export type ProviderReleaseReceipt = Readonly<{ snapshotDigest: string; registryRevision: number; generations: readonly Readonly<{ instanceId: ProviderInstanceId; generation: string }>[] }>;

interface CacheInventory { count(instanceId: ProviderInstanceId, generation: string, now: number): number; revision(): number; invalidate(instanceId: ProviderInstanceId, generation: string): void }
const authorizedCaches = new WeakSet<object>();
const snapshotOwners = new WeakMap<object, ProviderRegistry>();
const releaseReceiptOwners = new WeakMap<object, ProviderRegistry>();

export class ProviderRegistry {
  readonly #circuits = new Map<ProviderInstanceId, Circuit>();
  readonly #caches = new Set<CacheInventory>();
  #revision = 0;
  #lastNow = 0;
  #currentSnapshot: ProviderRegistrySnapshot | null = null;
  constructor(configured: unknown) {
    if (!Array.isArray(configured)) fail("CONFIG_NOT_ARRAY");
    for (const raw of configured) {
      if (!plain(raw) || !exactKeys(raw, ["generation", "implementation", "instanceId"]) || !INSTANCE.has(raw.instanceId as ProviderInstanceId)) fail("CONFIG_INVALID");
      const declaration = INSTANCE.get(raw.instanceId as ProviderInstanceId)!;
      if (!(declaration.allowedImplementations as readonly string[]).includes(String(raw.implementation))) fail("CONFIG_IMPLEMENTATION_INVALID");
      if (this.#circuits.has(raw.instanceId as ProviderInstanceId)) fail("CONFIG_DUPLICATE");
      const row = deepFreeze({ instanceId: raw.instanceId, implementation: raw.implementation, generation: text(raw.generation) }) as Configured;
      this.#circuits.set(row.instanceId, { configured: row, state: "unverified", reason: null, checkedAt: null, lastSuccessAt: null, lastFailureAt: null, transientOpens: [], consecutiveSuccesses: 0, retryAt: null });
    }
  }
  attach(cache: CacheInventory): void { if (!authorizedCaches.has(cache as object)) fail("CACHE_NOT_AUTHORIZED"); this.#caches.add(cache); }
  assertCurrent(subject: ExchangeRequest | ExchangeDelivery<unknown> | ExchangeFailure): Circuit {
    assertExchangeSubject(subject);
    const circuit = this.#circuits.get(subject.instanceId);
    if (circuit === undefined || circuit.configured.generation !== subject.generation || circuit.configured.implementation !== subject.implementation) fail("GENERATION_OR_IMPLEMENTATION_STALE");
    return circuit;
  }
  success(request: ExchangeRequest, delivery: ExchangeDelivery<unknown>, now: number): void {
    assertDelivery(delivery); sameSubject(request, delivery); this.#advance(now);
    const circuit = this.assertCurrent(request);
    circuit.transientOpens = circuit.transientOpens.filter((opened) => now - opened < 300_000);
    if ((circuit.state === "open" || circuit.state === "recovering") && circuit.transientOpens.length >= 2 && circuit.consecutiveSuccesses === 0) {
      circuit.state = "recovering"; circuit.consecutiveSuccesses = 1;
    } else {
      circuit.state = "available"; circuit.reason = null; circuit.consecutiveSuccesses = 0; circuit.transientOpens = [];
    }
    circuit.checkedAt = now; circuit.lastSuccessAt = now; circuit.retryAt = null; this.#changed();
  }
  failure(request: ExchangeRequest, failure: ExchangeFailure, now: number): void {
    assertFailure(failure); sameSubject(request, failure); this.#advance(now);
    const circuit = this.assertCurrent(request);
    circuit.transientOpens = circuit.transientOpens.filter((opened) => now - opened < 300_000);
    if (["timeout", "network", "rate_limited", "overloaded"].includes(failure.reason)) circuit.transientOpens.push(now);
    circuit.state = "open"; circuit.reason = failure.reason; circuit.checkedAt = now; circuit.lastFailureAt = now; circuit.consecutiveSuccesses = 0;
    circuit.retryAt = ["authentication", "protocol"].includes(failure.reason) ? null : now + (failure.reason === "rate_limited" ? 60_000 : 5_000);
    this.#changed();
  }
  changeGeneration(instanceId: ProviderInstanceId, generation: string, implementation?: ProviderImplementation): void {
    const prior = this.#circuits.get(instanceId); if (prior === undefined) fail("INSTANCE_NOT_CONFIGURED");
    const nextImplementation = implementation ?? prior.configured.implementation;
    const declaration = INSTANCE.get(instanceId)!;
    if (!(declaration.allowedImplementations as readonly string[]).includes(nextImplementation)) fail("CONFIG_IMPLEMENTATION_INVALID");
    for (const cache of this.#caches) cache.invalidate(instanceId, prior.configured.generation);
    const configured = deepFreeze({ instanceId, implementation: nextImplementation, generation: text(generation) });
    this.#circuits.set(instanceId, { configured, state: "unverified", reason: null, checkedAt: null, lastSuccessAt: null, lastFailureAt: null, transientOpens: [], consecutiveSuccesses: 0, retryAt: null });
    this.#changed();
  }
  snapshot(now: number): ProviderRegistrySnapshot {
    this.#observe(now);
    const instances = PROVIDER_INSTANCE_DECLARATIONS.map((declaration): HealthSnapshot => {
      const circuit = this.#circuits.get(declaration.instanceId);
      if (circuit === undefined) return { instanceId: declaration.instanceId, familyId: declaration.familyId, state: "not_configured" };
      const base = { instanceId: declaration.instanceId, familyId: declaration.familyId, implementation: circuit.configured.implementation, generation: circuit.configured.generation } as const;
      if (circuit.state === "unverified") return { ...base, state: "unverified", retryAfterMs: null };
      const times = { checkedAt: instant(circuit.checkedAt!), lastSuccessAt: circuit.lastSuccessAt === null ? null : instant(circuit.lastSuccessAt), lastFailureAt: circuit.lastFailureAt === null ? null : instant(circuit.lastFailureAt) };
      if (circuit.state === "available") return { ...base, state: "available", reason: null, retryAfterMs: null, ...times, lastSuccessAt: times.lastSuccessAt! };
      if (circuit.state === "recovering") return { ...base, state: "recovering", priorReason: circuit.reason!, consecutiveSuccesses: 1, requiredSuccesses: 2, retryAfterMs: null, ...times, lastSuccessAt: times.lastSuccessAt!, lastFailureAt: times.lastFailureAt! };
      const inventories = [...this.#caches];
      const count = inventories.reduce((sum, cache) => sum + cache.count(declaration.instanceId, circuit.configured.generation, now), 0);
      const cacheRevision = inventories.reduce((sum, cache) => sum + cache.revision(), 0);
      const retryAfterMs = circuit.retryAt === null ? null : Math.max(0, circuit.retryAt - now);
      return count > 0
        ? { ...base, state: "degraded_cached_only", reason: circuit.reason!, retryAfterMs, cacheScope: "exact_request", validExactEntries: count, cacheRevision, ...times, lastFailureAt: times.lastFailureAt! }
        : { ...base, state: "unavailable", reason: circuit.reason!, retryAfterMs, cacheScope: "none", ...times, lastFailureAt: times.lastFailureAt! };
    });
    const body = { revision: this.#revision, generatedAt: instant(now), instances };
    const snapshot = deepFreeze({ ...body, digest: hash(canonical(body)) });
    snapshotOwners.set(snapshot, this);
    this.#currentSnapshot = snapshot;
    return snapshot;
  }
  releaseReceipt(snapshot: ProviderRegistrySnapshot): ProviderReleaseReceipt {
    this.assertCurrentSnapshot(snapshot);
    const receipt = deepFreeze({ snapshotDigest: snapshot.digest, registryRevision: snapshot.revision, generations: snapshot.instances.flatMap((row) => "generation" in row ? [{ instanceId: row.instanceId, generation: row.generation }] : []) });
    releaseReceiptOwners.set(receipt, this); return receipt;
  }
  generationSet(snapshot: ProviderRegistrySnapshot, group: BackoffGroupId): ProviderGenerationSet {
    this.assertCurrentSnapshot(snapshot);
    const members = snapshot.instances.flatMap((row) => {
      const declaration = INSTANCE.get(row.instanceId)!;
      return declaration.backoffGroup === group && "generation" in row ? [{ instanceId: row.instanceId, generation: row.generation }] : [];
    });
    if (members.length === 0) fail("GENERATION_GROUP_EMPTY");
    const value = deepFreeze({ group, registryRevision: snapshot.revision, members, digest: hash(canonical({ group, members })) });
    generationOwners.set(value, this); return value;
  }
  assertCurrentSnapshot(snapshot: ProviderRegistrySnapshot): void {
    if (snapshotOwners.get(snapshot) !== this || snapshot !== this.#currentSnapshot || snapshot.revision !== this.#revision) fail("SNAPSHOT_STALE_OR_CROSSED");
  }
  assertCurrentReleaseReceipt(receipt: ProviderReleaseReceipt): void {
    if (releaseReceiptOwners.get(receipt) !== this || receipt.registryRevision !== this.#revision || receipt.snapshotDigest !== this.#currentSnapshot?.digest) fail("RELEASE_RECEIPT_STALE_OR_CROSSED");
  }
  cacheChanged(cache: CacheInventory): void { if (!this.#caches.has(cache)) fail("CACHE_NOT_ATTACHED"); this.#changed(); }
  assertGenerationSet(value: ProviderGenerationSet, group: BackoffGroupId): void {
    if (generationOwners.get(value) !== this || value.group !== group || value.registryRevision !== this.#revision) fail("GENERATION_SET_STALE_OR_CROSSED");
    const members = PROVIDER_INSTANCE_DECLARATIONS.flatMap((declaration) => {
      const circuit = this.#circuits.get(declaration.instanceId);
      return declaration.backoffGroup === group && circuit !== undefined
        ? [{ instanceId: declaration.instanceId, generation: circuit.configured.generation }]
        : [];
    });
    const expectedDigest = hash(canonical({ group, members }));
    if (expectedDigest !== value.digest || canonical(members) !== canonical(value.members)) fail("GENERATION_SET_STALE_OR_CROSSED");
  }
  #observe(now: number): void { monotonic(now); if (now < this.#lastNow) fail("MONOTONIC_TIME_REVERSED"); this.#lastNow = now; }
  #advance(now: number): void { this.#observe(now); }
  #changed(): void { this.#revision += 1; this.#currentSnapshot = null; }
}

export function assertProviderReleaseReceipt(value: unknown): asserts value is ProviderReleaseReceipt {
  if (!plain(value)) fail("RELEASE_RECEIPT_NOT_SEALED");
  const registry = releaseReceiptOwners.get(value);
  if (registry === undefined) fail("RELEASE_RECEIPT_NOT_SEALED");
  registry.assertCurrentReleaseReceipt(value as ProviderReleaseReceipt);
}

export type ProfileAvailability = Readonly<{ state: "available" | "requestable_unverified" | "recovering" | "cached_exact_only" | "unavailable"; instanceId: ProviderInstanceId; generation: string | null }>;
export function selectProfileAvailability(snapshot: ProviderRegistrySnapshot, operationId: ApplicationOperationId): ProfileAvailability {
  if (!plain(snapshot)) fail("SNAPSHOT_NOT_SEALED");
  const registry = snapshotOwners.get(snapshot);
  if (registry === undefined) fail("SNAPSHOT_NOT_SEALED");
  registry.assertCurrentSnapshot(snapshot);
  const declaration = compileApplications().find((row) => row.operationId === operationId)!;
  const instance = snapshot.instances.find((row) => row.instanceId === declaration.stage.instanceId)!;
  if (instance.state === "not_configured") return Object.freeze({ state: "unavailable", instanceId: instance.instanceId, generation: null });
  if (instance.state === "unverified") return Object.freeze({ state: "requestable_unverified", instanceId: instance.instanceId, generation: instance.generation });
  if (instance.state === "recovering") return Object.freeze({ state: "recovering", instanceId: instance.instanceId, generation: instance.generation });
  if (instance.state === "degraded_cached_only") return Object.freeze({ state: "cached_exact_only", instanceId: instance.instanceId, generation: instance.generation });
  return Object.freeze({ state: instance.state, instanceId: instance.instanceId, generation: instance.generation });
}

export type CacheKey = Readonly<{ applicationOperationId: ApplicationOperationId; stageId: string; operation: ExchangeOperationId; instanceId: ProviderInstanceId; implementation: ProviderImplementation; generation: string; requestDigest: string; cacheKeyDigest: string }>;
export type CacheResolution<T> = Readonly<{ kind: "miss" }> | Readonly<{ kind: "hit"; value: T; original: ExchangeDelivery<T>; cacheServiceReceipt: Readonly<{ source: "retained_exact"; cacheKeyDigest: string; servedAtMonotonic: number; revision: number }> }>;
export function cacheKey(declaration: ApplicationDeclaration, request: ExchangeRequest, cacheKeyDigest: string): CacheKey {
  if (!compiledApplications.has(declaration)) fail("APPLICATION_NOT_COMPILED"); assertRequest(request);
  if (declaration.stage.exchangeOperation !== request.operation || declaration.stage.instanceId !== request.instanceId) fail("CACHE_APPLICATION_CROSSED");
  return deepFreeze({ applicationOperationId: declaration.operationId, stageId: declaration.stage.stageId, operation: request.operation, instanceId: request.instanceId, implementation: request.implementation, generation: request.generation, requestDigest: request.requestDigest, cacheKeyDigest: text(cacheKeyDigest) });
}
export class ExactCache<T> implements CacheInventory {
  readonly #rows = new Map<string, Readonly<{ key: CacheKey; original: ExchangeDelivery<T>; expiresAt: number }>>();
  readonly #registry: ProviderRegistry; #revision = 0;
  constructor(registry: ProviderRegistry) { this.#registry = registry; authorizedCaches.add(this); registry.attach(this); }
  put(key: CacheKey, original: ExchangeDelivery<T>, expiresAt: number, now: number): void {
    assertDelivery(original); monotonic(now); monotonic(expiresAt); this.#registry.assertCurrent(original);
    if (expiresAt <= now || !sameCacheSubject(key, original)) fail("CACHE_SUBJECT_CROSSED");
    const id = canonical(key); this.#rows.delete(id); this.#rows.set(id, deepFreeze({ key, original, expiresAt })); this.#revision += 1; this.#registry.cacheChanged(this);
    while (this.#rows.size > 512) { this.#rows.delete(this.#rows.keys().next().value!); this.#revision += 1; this.#registry.cacheChanged(this); }
  }
  resolve(key: CacheKey, now: number): CacheResolution<T> {
    monotonic(now); const id = canonical(key); const row = this.#rows.get(id);
    if (row === undefined || row.expiresAt <= now) { if (row !== undefined) { this.#rows.delete(id); this.#revision += 1; this.#registry.cacheChanged(this); } return Object.freeze({ kind: "miss" }); }
    this.#registry.assertCurrent(row.original); this.#rows.delete(id); this.#rows.set(id, row); this.#revision += 1; this.#registry.cacheChanged(this);
    return deepFreeze({ kind: "hit", value: row.original.payload, original: row.original, cacheServiceReceipt: { source: "retained_exact", cacheKeyDigest: key.cacheKeyDigest, servedAtMonotonic: now, revision: this.#revision } });
  }
  count(instanceId: ProviderInstanceId, generation: string, now: number): number { let count = 0; for (const [id, row] of this.#rows) { if (row.expiresAt <= now) { this.#rows.delete(id); this.#revision += 1; this.#registry.cacheChanged(this); } else if (row.key.instanceId === instanceId && row.key.generation === generation) count += 1; } return count; }
  revision(): number { return this.#revision; }
  invalidate(instanceId: ProviderInstanceId, generation: string): void { for (const [id, row] of this.#rows) if (row.key.instanceId === instanceId && row.key.generation === generation) { this.#rows.delete(id); this.#revision += 1; this.#registry.cacheChanged(this); } }
}

export type ProviderGenerationSet = Readonly<{ group: BackoffGroupId; registryRevision: number; members: readonly Readonly<{ instanceId: ProviderInstanceId; generation: string }>[]; digest: string }>;
const generationOwners = new WeakMap<object, ProviderRegistry>();
export type BackoffSettlement = Readonly<{ kind: "success" }> | Readonly<{ kind: "rate_limited"; retryAfterMs: number | null }> | Readonly<{ kind: "transient_failure" }> | Readonly<{ kind: "permanent_failure" }>;
export class BackoffCoordinator {
  readonly #registry: ProviderRegistry; readonly #group: BackoffGroupId;
  #claim: Readonly<{ token: string; digest: string; expiresAt: number }> | null = null; #digest: string | null = null; #blockedUntil = 0; #transientFailures = 0;
  constructor(registry: ProviderRegistry, group: BackoffGroupId) { this.#registry = registry; this.#group = group; }
  acquire(now: number, generations: ProviderGenerationSet, leaseMs: number): Readonly<{ kind: "acquired"; token: string }> | Readonly<{ kind: "blocked"; retryAfterMs: number }> | Readonly<{ kind: "claimed" }> {
    monotonic(now); this.#registry.assertGenerationSet(generations, this.#group); if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0 || leaseMs > 60_000) fail("LEASE_INVALID");
    if (this.#digest !== generations.digest) { this.#digest = generations.digest; this.#claim = null; this.#blockedUntil = 0; this.#transientFailures = 0; }
    if (this.#claim !== null && this.#claim.expiresAt <= now) this.#claim = null;
    if (this.#blockedUntil > now) return Object.freeze({ kind: "blocked", retryAfterMs: this.#blockedUntil - now });
    if (this.#claim !== null) return Object.freeze({ kind: "claimed" });
    const token = randomUUID(); this.#claim = Object.freeze({ token, digest: generations.digest, expiresAt: now + leaseMs }); return Object.freeze({ kind: "acquired", token });
  }
  renew(now: number, generations: ProviderGenerationSet, token: string, leaseMs: number): void { this.#assertClaim(now, generations, token); if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0 || leaseMs > 60_000) fail("LEASE_INVALID"); this.#claim = Object.freeze({ token, digest: generations.digest, expiresAt: now + leaseMs }); }
  settle(now: number, generations: ProviderGenerationSet, token: string, settlement: unknown): void {
    const parsed = parseBackoffSettlement(settlement);
    this.#assertClaim(now, generations, token); this.#claim = null;
    if (parsed.kind === "success") { this.#transientFailures = 0; this.#blockedUntil = 0; return; }
    if (parsed.kind === "rate_limited") { this.#blockedUntil = now + Math.max(60_000, parsed.retryAfterMs ?? 0); return; }
    if (parsed.kind === "permanent_failure") { this.#blockedUntil = Number.MAX_SAFE_INTEGER; return; }
    this.#transientFailures = Math.min(3, this.#transientFailures + 1); this.#blockedUntil = now + [5_000, 15_000, 60_000][this.#transientFailures - 1]!;
  }
  expire(now: number): void { monotonic(now); if (this.#claim !== null && this.#claim.expiresAt <= now) this.#claim = null; }
  #assertClaim(now: number, generations: ProviderGenerationSet, token: string): void { monotonic(now); this.#registry.assertGenerationSet(generations, this.#group); if (this.#claim === null || this.#claim.expiresAt <= now || this.#claim.digest !== generations.digest || this.#claim.token !== token) fail("LEASE_STALE"); }
}

function sameCacheSubject(key: CacheKey, delivery: ExchangeDelivery<unknown>): boolean { return key.operation === delivery.operation && key.instanceId === delivery.instanceId && key.implementation === delivery.implementation && key.generation === delivery.generation && key.requestDigest === delivery.requestDigest; }
function assertRequest(value: unknown): asserts value is ExchangeRequest { if (!plain(value) || !requests.has(value)) fail("REQUEST_NOT_SEALED"); }
function assertDelivery(value: unknown): asserts value is ExchangeDelivery<unknown> { if (!plain(value) || !deliveries.has(value)) fail("DELIVERY_NOT_SEALED"); }
function assertFailure(value: unknown): asserts value is ExchangeFailure { if (!plain(value) || !failures.has(value)) fail("FAILURE_NOT_SEALED"); }
function assertExchangeSubject(value: unknown): asserts value is ExchangeRequest | ExchangeDelivery<unknown> | ExchangeFailure { if (!plain(value) || (!requests.has(value) && !deliveries.has(value) && !failures.has(value))) fail("EXCHANGE_SUBJECT_NOT_SEALED"); }
function assertFailureReason(value: unknown): asserts value is FailureReason { if (!["startup", "process_exit", "timeout", "network", "rate_limited", "overloaded", "authentication", "protocol", "cancelled_by_shutdown"].includes(String(value))) fail("FAILURE_REASON_INVALID"); }
function parseBackoffSettlement(value: unknown): BackoffSettlement {
  if (!plain(value) || typeof value.kind !== "string") fail("BACKOFF_SETTLEMENT_INVALID");
  if (["success", "transient_failure", "permanent_failure"].includes(value.kind)) {
    if (!exactKeys(value, ["kind"])) fail("BACKOFF_SETTLEMENT_INVALID");
    return Object.freeze({ kind: value.kind }) as BackoffSettlement;
  }
  if (value.kind !== "rate_limited" || !exactKeys(value, ["kind", "retryAfterMs"]) ||
      (value.retryAfterMs !== null && (!Number.isSafeInteger(value.retryAfterMs) || Number(value.retryAfterMs) < 0))) fail("BACKOFF_SETTLEMENT_INVALID");
  return Object.freeze({ kind: "rate_limited", retryAfterMs: value.retryAfterMs as number | null });
}
function sameSubject(left: ExchangeRequest, right: ExchangeRequest): void { if (left.operation !== right.operation || left.instanceId !== right.instanceId || left.implementation !== right.implementation || left.generation !== right.generation || left.requestDigest !== right.requestDigest) fail("EXCHANGE_SUBJECT_CROSSED"); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean { const actual = Object.keys(value).sort(); const expected = [...keys].sort(); return actual.length === expected.length && actual.every((key, index) => key === expected[index]); }
function plain(value: unknown): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function text(value: unknown): string { if (typeof value !== "string" || value.length === 0 || value.length > 512) fail("TEXT_INVALID"); return value; }
function monotonic(value: unknown): asserts value is number { if (!Number.isSafeInteger(value) || Number(value) < 0) fail("MONOTONIC_INVALID"); }
function instant(value: number): string { return new Date(value).toISOString(); }
function hash(value: string): string { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
function canonical(value: unknown): string { return JSON.stringify(canonicalValue(value)); }
function canonicalValue(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalValue); if (!plain(value)) return value; return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])])); }
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value !== "object" || value === null || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value as object)) deepFreeze(child, seen);
  return Object.isFrozen(value) ? value : Object.freeze(value);
}
function fail(code: string): never { throw new TypeError(code); }
