// DISPOSABLE composed author contract for D2869-D2873. Not production code.
import { createHash, randomUUID } from "node:crypto";

import {
  APPLICATION_OPERATION_IDS,
  ExchangeAuthority,
  ExactCache as PriorExactCache,
  ProviderRegistry as PriorProviderRegistry,
  cacheKey as issuePriorCacheKey,
  compileApplications,
  settleOperation as settlePriorOperation,
  type ApplicationDeclaration,
  type ApplicationOperationId,
  type BackoffGroupId,
  type ExchangeDelivery,
  type ExchangeFailure,
  type ExchangeOperationId,
  type ExchangeRequest,
  type HealthSnapshot,
  type ProviderImplementation,
  type ProviderInstanceId,
} from "../d2857-provider-health-eighth-author-repair/contract.js";

export * from "../d2857-provider-health-eighth-author-repair/contract.js";

export {
  APPLICATION_OPERATION_IDS,
  ExchangeAuthority,
  compileApplications,
  type ApplicationDeclaration,
  type ApplicationOperationId,
  type ExchangeDelivery,
  type ExchangeFailure,
  type ExchangeOperationId,
  type ExchangeRequest,
  type ProviderImplementation,
  type ProviderInstanceId,
};

type ProviderFamilyId = "stockfish" | "maia" | "tablebase" | "explorer" | "voice" | "tts";
const INSTANCE = Object.freeze({
  "stockfish-play": { familyId: "stockfish", implementations: ["uci_sidecar", "local_fixture"], group: null },
  "stockfish-analysis": { familyId: "stockfish", implementations: ["uci_sidecar", "local_fixture"], group: null },
  "maia-inference": { familyId: "maia", implementations: ["local_service", "local_fixture"], group: null },
  "tablebase-primary": { familyId: "tablebase", implementations: ["lichess_http", "local_service", "local_fixture"], group: "lichess-api" },
  "explorer-primary": { familyId: "explorer", implementations: ["lichess_http", "local_service", "local_fixture"], group: "lichess-api" },
  "external-voice": { familyId: "voice", implementations: ["external_http", "local_fixture"], group: "external-voice-api" },
  "external-tts": { familyId: "tts", implementations: ["external_http", "local_fixture"], group: "external-tts-api" },
} satisfies Record<ProviderInstanceId, { readonly familyId: ProviderFamilyId; readonly implementations: readonly ProviderImplementation[]; readonly group: BackoffGroupId | null }>);

type Configured = Readonly<{
  instanceId: ProviderInstanceId;
  implementation: ProviderImplementation;
  generation: string;
}>;

export type ProviderRegistrySnapshot = Readonly<{
  revision: number;
  generatedAt: string;
  observedAtMonotonic: number;
  instances: readonly HealthSnapshot[];
  digest: string;
}>;
export type ProviderReleaseReceipt = Readonly<{
  snapshotDigest: string;
  registryRevision: number;
  generations: readonly Readonly<{ instanceId: ProviderInstanceId; generation: string }>[];
}>;

interface CacheInventory {
  count(instanceId: ProviderInstanceId, generation: string, now: number): number;
  invalidate(instanceId: ProviderInstanceId, generation: string): void;
}

const snapshotOwners = new WeakMap<object, ProviderRegistry>();
const releaseReceiptOwners = new WeakMap<object, ProviderRegistry>();
const authorizedCaches = new WeakSet<object>();
const priorRegistries = new WeakMap<ProviderRegistry, PriorProviderRegistry>();

export class ProviderRegistry {
  readonly #configured = new Map<ProviderInstanceId, Configured>();
  readonly #caches = new Set<CacheInventory>();
  #revision = 0;
  #lastNow = 0;

  constructor(configured: unknown) {
    if (!Array.isArray(configured)) fail("CONFIG_NOT_ARRAY");
    priorRegistries.set(this, new PriorProviderRegistry(configured));
    for (const raw of configured) {
      if (!plain(raw) || !exactKeys(raw, ["generation", "implementation", "instanceId"])) fail("CONFIG_INVALID");
      const instanceId = raw.instanceId as ProviderInstanceId;
      const declaration = INSTANCE[instanceId];
      if (declaration === undefined || !declaration.implementations.includes(raw.implementation as never)) fail("CONFIG_IMPLEMENTATION_INVALID");
      if (this.#configured.has(instanceId)) fail("CONFIG_DUPLICATE");
      this.#configured.set(instanceId, deepFreeze({
        instanceId,
        implementation: raw.implementation as ProviderImplementation,
        generation: text(raw.generation),
      }));
    }
  }

  attach(cache: CacheInventory): void {
    if (!authorizedCaches.has(cache as object)) fail("CACHE_NOT_AUTHORIZED");
    this.#caches.add(cache);
  }

  cacheChanged(cache: CacheInventory): void {
    if (!this.#caches.has(cache)) fail("CACHE_NOT_ATTACHED");
    this.#revision += 1;
  }

  assertCurrent(subject: ExchangeRequest | ExchangeDelivery<unknown> | ExchangeFailure): void {
    prior(this).assertCurrent(subject);
  }

  success(request: ExchangeRequest, delivery: ExchangeDelivery<unknown>, now: number): void {
    prior(this).success(request, delivery, now);
    this.#revision += 1;
  }

  failure(request: ExchangeRequest, failure: ExchangeFailure, now: number): void {
    prior(this).failure(request, failure, now);
    this.#revision += 1;
  }

  changeGeneration(instanceId: ProviderInstanceId, generation: string, implementation?: ProviderImplementation): void {
    const prior = this.#configured.get(instanceId);
    if (prior === undefined) fail("INSTANCE_NOT_CONFIGURED");
    const nextGeneration = text(generation);
    const nextImplementation = implementation ?? prior.implementation;
    if (!INSTANCE[instanceId].implementations.includes(nextImplementation as never)) fail("CONFIG_IMPLEMENTATION_INVALID");
    if (nextGeneration === prior.generation) fail("GENERATION_MUST_CHANGE");
    for (const cache of this.#caches) cache.invalidate(instanceId, prior.generation);
    priorRegistries.get(this)!.changeGeneration(instanceId, nextGeneration, nextImplementation);
    this.#configured.set(instanceId, deepFreeze({ instanceId, implementation: nextImplementation, generation: nextGeneration }));
    this.#revision += 1;
  }

  snapshot(now: number): ProviderRegistrySnapshot {
    this.#observe(now);
    const instances = prior(this).snapshot(now).instances;
    const body = { revision: this.#revision, generatedAt: instant(now), observedAtMonotonic: now, instances };
    const snapshot = deepFreeze({ ...body, digest: hash(canonical(body)) });
    snapshotOwners.set(snapshot, this);
    return snapshot;
  }

  assertCurrentSnapshot(snapshot: ProviderRegistrySnapshot, now: number): void {
    this.#observe(now);
    if (snapshotOwners.get(snapshot) !== this || snapshot.revision !== this.#revision) fail("SNAPSHOT_STALE_OR_CROSSED");
    const currentInstances = prior(this).snapshot(now).instances;
    if (canonical(currentInstances) !== canonical(snapshot.instances)) fail("SNAPSHOT_STALE_OR_CROSSED");
  }

  releaseReceipt(snapshot: ProviderRegistrySnapshot, now = snapshot.observedAtMonotonic): ProviderReleaseReceipt {
    this.assertCurrentSnapshot(snapshot, now);
    const receipt = deepFreeze({
      snapshotDigest: snapshot.digest,
      registryRevision: snapshot.revision,
      generations: snapshot.instances.flatMap((row) => "generation" in row ? [{ instanceId: row.instanceId, generation: row.generation }] : []),
    });
    releaseReceiptOwners.set(receipt, this);
    return receipt;
  }

  assertCurrentReleaseReceipt(receipt: ProviderReleaseReceipt): void {
    if (releaseReceiptOwners.get(receipt) !== this || receipt.registryRevision !== this.#revision) fail("RELEASE_RECEIPT_STALE_OR_CROSSED");
    const generations = [...this.#configured.values()].sort(byInstance).map((row) => ({ instanceId: row.instanceId, generation: row.generation }));
    if (canonical(generations) !== canonical(receipt.generations)) fail("RELEASE_RECEIPT_STALE_OR_CROSSED");
  }

  generationSet(snapshot: ProviderRegistrySnapshot, group: BackoffGroupId): ProviderGenerationSet {
    this.assertCurrentSnapshot(snapshot, snapshot.observedAtMonotonic);
    const members = this.#groupImage(group);
    if (members.length === 0) fail("GENERATION_GROUP_EMPTY");
    const value = deepFreeze({ group, members, digest: hash(canonical({ group, members })) });
    generationOwners.set(value, this);
    return value;
  }

  assertGenerationSet(value: ProviderGenerationSet, group: BackoffGroupId): void {
    if (generationOwners.get(value) !== this || value.group !== group) fail("GENERATION_SET_STALE_OR_CROSSED");
    const members = this.#groupImage(group);
    if (canonical(members) !== canonical(value.members) || hash(canonical({ group, members })) !== value.digest) {
      fail("GENERATION_SET_STALE_OR_CROSSED");
    }
  }

  #groupImage(group: BackoffGroupId): readonly GroupMember[] {
    return [...this.#configured.values()]
      .filter((row) => INSTANCE[row.instanceId].group === group)
      .sort(byInstance)
      .map((row) => deepFreeze({ instanceId: row.instanceId, implementation: row.implementation, generation: row.generation }));
  }

  #observe(now: number): void {
    monotonic(now);
    if (now < this.#lastNow) fail("MONOTONIC_TIME_REVERSED");
    this.#lastNow = now;
  }
}

export function assertProviderReleaseReceipt(value: unknown): asserts value is ProviderReleaseReceipt {
  if (!plain(value)) fail("RELEASE_RECEIPT_NOT_SEALED");
  const registry = releaseReceiptOwners.get(value);
  if (registry === undefined) fail("RELEASE_RECEIPT_NOT_SEALED");
  registry.assertCurrentReleaseReceipt(value as ProviderReleaseReceipt);
}

export type ProfileAvailability = Readonly<{
  state: "available" | "requestable_unverified" | "recovering" | "cached_exact_only" | "unavailable";
  instanceId: ProviderInstanceId;
  generation: string | null;
}>;

export function selectProfileAvailability(snapshot: ProviderRegistrySnapshot, operationId: ApplicationOperationId, now = snapshot.observedAtMonotonic): ProfileAvailability {
  const registry = snapshotOwners.get(snapshot);
  if (registry === undefined) fail("SNAPSHOT_NOT_SEALED");
  registry.assertCurrentSnapshot(snapshot, now);
  const declaration = compileApplications().find((row) => row.operationId === operationId);
  if (declaration === undefined) fail("APPLICATION_UNKNOWN");
  const instance = snapshot.instances.find((row) => row.instanceId === declaration.stage.instanceId);
  if (instance === undefined) fail("INSTANCE_NOT_CONFIGURED");
  if (instance.state === "not_configured") return Object.freeze({ state: "unavailable", instanceId: instance.instanceId, generation: null });
  if (instance.state === "unverified") return Object.freeze({ state: "requestable_unverified", instanceId: instance.instanceId, generation: instance.generation });
  if (instance.state === "recovering") return Object.freeze({ state: "recovering", instanceId: instance.instanceId, generation: instance.generation });
  if (instance.state === "degraded_cached_only") return Object.freeze({ state: "cached_exact_only", instanceId: instance.instanceId, generation: instance.generation });
  return Object.freeze({ state: instance.state, instanceId: instance.instanceId, generation: instance.generation });
}

export type CacheKey = Readonly<{
  applicationOperationId: ApplicationOperationId;
  stageId: string;
  operation: ExchangeOperationId;
  instanceId: ProviderInstanceId;
  implementation: ProviderImplementation;
  generation: string;
  requestDigest: string;
  cacheKeyDigest: string;
}>;

const cacheKeyOwners = new WeakMap<object, ProviderRegistry>();
const cacheKeyRequests = new WeakMap<object, ExchangeRequest>();
const priorCacheKeys = new WeakMap<object, ReturnType<typeof issuePriorCacheKey>>();

export function cacheKey(registry: ProviderRegistry, declaration: ApplicationDeclaration, request: ExchangeRequest, cacheKeyDigest: string): CacheKey {
  // The predecessor issuer verifies the compiled declaration and sealed exchange request.
  const prior = priorCacheKey(declaration, request, cacheKeyDigest);
  registry.assertCurrent(request);
  const key = deepFreeze({ ...prior });
  cacheKeyOwners.set(key, registry);
  cacheKeyRequests.set(key, request);
  priorCacheKeys.set(key, prior);
  return key;
}

function priorCacheKey(declaration: ApplicationDeclaration, request: ExchangeRequest, digest: string): CacheKey {
  return issuePriorCacheKey(declaration, request, digest);
}

type CacheResolution<T> = Readonly<{ kind: "miss" }> | Readonly<{
  kind: "hit";
  value: T;
  original: ExchangeDelivery<T>;
  cacheServiceReceipt: Readonly<{ source: "retained_exact"; cacheKeyDigest: string; servedAtMonotonic: number; revision: number }>;
}>;

export class ExactCache<T> implements CacheInventory {
  readonly #prior: PriorExactCache<T>;

  constructor(readonly registry: ProviderRegistry) {
    this.#prior = new PriorExactCache<T>(prior(registry));
    authorizedCaches.add(this);
    registry.attach(this);
  }

  put(key: CacheKey, original: ExchangeDelivery<T>, expiresAt: number, now: number): void {
    monotonic(now);
    monotonic(expiresAt);
    const request = cacheKeyRequests.get(key);
    const priorKey = priorCacheKeys.get(key);
    if (cacheKeyOwners.get(key) !== this.registry || request === undefined || priorKey === undefined || expiresAt <= now || !sameCacheSubject(key, original)) fail("CACHE_SUBJECT_CROSSED");
    this.registry.assertCurrent(original);
    const declaration = compileApplications().find((row) => row.operationId === key.applicationOperationId);
    if (declaration === undefined || declaration.stage.stageId !== key.stageId) fail("CACHE_APPLICATION_CROSSED");
    settlePriorOperation(declaration, { kind: "success", stageId: key.stageId, request, delivery: original });
    this.#prior.put(priorKey, original, expiresAt, now);
    this.registry.cacheChanged(this);
  }

  resolve(key: CacheKey, now: number): CacheResolution<T> {
    monotonic(now);
    const priorKey = priorCacheKeys.get(key);
    if (cacheKeyOwners.get(key) !== this.registry || priorKey === undefined) fail("CACHE_KEY_NOT_ISSUED");
    const result = this.#prior.resolve(priorKey, now);
    if (result.kind === "hit") this.registry.cacheChanged(this);
    return result;
  }

  count(instanceId: ProviderInstanceId, generation: string, now: number): number {
    return this.#prior.count(instanceId, generation, now);
  }

  invalidate(instanceId: ProviderInstanceId, generation: string): void {
    this.#prior.invalidate(instanceId, generation);
    this.registry.cacheChanged(this);
  }
}

type GroupMember = Readonly<{ instanceId: ProviderInstanceId; implementation: ProviderImplementation; generation: string }>;
export type ProviderGenerationSet = Readonly<{ group: BackoffGroupId; members: readonly GroupMember[]; digest: string }>;
const generationOwners = new WeakMap<object, ProviderRegistry>();

type BackoffSettlement =
  | Readonly<{ kind: "success" }>
  | Readonly<{ kind: "rate_limited"; retryAfterMs: number | null }>
  | Readonly<{ kind: "transient_failure" }>
  | Readonly<{ kind: "permanent_failure" }>;

export class BackoffCoordinator {
  #claim: Readonly<{ token: string; digest: string; expiresAt: number }> | null = null;
  #digest: string | null = null;
  #blockedUntil = 0;
  #transientFailures = 0;

  constructor(readonly registry: ProviderRegistry, readonly group: BackoffGroupId) {}

  acquire(now: number, generations: ProviderGenerationSet, leaseMs: number): Readonly<{ kind: "acquired"; token: string }> | Readonly<{ kind: "blocked"; retryAfterMs: number }> | Readonly<{ kind: "claimed" }> {
    monotonic(now);
    this.registry.assertGenerationSet(generations, this.group);
    if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0 || leaseMs > 60_000) fail("LEASE_INVALID");
    if (this.#digest !== generations.digest) {
      this.#digest = generations.digest;
      this.#claim = null;
      this.#blockedUntil = 0;
      this.#transientFailures = 0;
    }
    if (this.#claim !== null && this.#claim.expiresAt > now) return Object.freeze({ kind: "claimed" });
    if (this.#blockedUntil > now) return Object.freeze({ kind: "blocked", retryAfterMs: this.#blockedUntil - now });
    const token = randomUUID();
    this.#claim = Object.freeze({ token, digest: generations.digest, expiresAt: now + leaseMs });
    return Object.freeze({ kind: "acquired", token });
  }

  renew(now: number, generations: ProviderGenerationSet, token: string, leaseMs: number): void {
    this.#assertClaim(now, generations, token);
    if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0 || leaseMs > 60_000) fail("LEASE_INVALID");
    this.#claim = Object.freeze({ token, digest: generations.digest, expiresAt: now + leaseMs });
  }

  settle(now: number, generations: ProviderGenerationSet, token: string, settlement: unknown): void {
    const parsed = parseBackoffSettlement(settlement);
    this.#assertClaim(now, generations, token);
    this.#claim = null;
    if (parsed.kind === "success") { this.#transientFailures = 0; this.#blockedUntil = 0; return; }
    if (parsed.kind === "rate_limited") { this.#blockedUntil = now + Math.max(60_000, parsed.retryAfterMs ?? 0); return; }
    if (parsed.kind === "permanent_failure") { this.#blockedUntil = Number.MAX_SAFE_INTEGER; return; }
    this.#transientFailures = Math.min(3, this.#transientFailures + 1);
    this.#blockedUntil = now + [5_000, 15_000, 60_000][this.#transientFailures - 1]!;
  }

  expire(now: number): void {
    monotonic(now);
    if (this.#claim !== null && this.#claim.expiresAt <= now) this.#claim = null;
  }

  #assertClaim(now: number, generations: ProviderGenerationSet, token: string): void {
    monotonic(now);
    this.registry.assertGenerationSet(generations, this.group);
    if (this.#claim === null || this.#claim.expiresAt <= now || this.#claim.token !== token || this.#claim.digest !== generations.digest) fail("LEASE_STALE");
  }
}

export type ProviderLocalDomainResult<T = unknown> = Readonly<{
  operation: ExchangeOperationId;
  instanceId: ProviderInstanceId;
  implementation: ProviderImplementation;
  generation: string;
  requestDigest: string;
  value: T;
}>;

const localDomainResults = new WeakSet<object>();

export function localDomainResult<T>(request: ExchangeRequest, value: T): ProviderLocalDomainResult<T> {
  if (!["syzygy.position@1", "lichess_explorer.position_page@1"].includes(request.operation)) fail("LOCAL_DOMAIN_OPERATION_INVALID");
  const operationId: ApplicationOperationId = request.operation === "syzygy.position@1"
    ? "evidence.tablebase_probe"
    : "evidence.explorer_query";
  const declaration = compileApplications().find((row) => row.operationId === operationId);
  if (declaration === undefined) fail("LOCAL_DOMAIN_OPERATION_INVALID");
  // The predecessor issuer is used only as the provider-exchange request seal assertion.
  issuePriorCacheKey(declaration, request, "local-domain-request-authority");
  const result = deepFreeze({
    operation: request.operation,
    instanceId: request.instanceId,
    implementation: request.implementation,
    generation: request.generation,
    requestDigest: request.requestDigest,
    value: structuredClone(value),
  });
  localDomainResults.add(result);
  return result;
}

type ExactSettlement<T> =
  | Readonly<{ kind: "success"; stageId: string; request: ExchangeRequest; delivery: ExchangeDelivery<T> }>
  | Readonly<{ kind: "failed"; stageId: string; request: ExchangeRequest; failure: ExchangeFailure }>
  | Readonly<{ kind: "local_domain"; stageId: string; request: ExchangeRequest; result: ProviderLocalDomainResult<T> }>
  | Readonly<{ kind: "cancelled"; stageId: string; reason: "caller" | "superseded" | "shutdown" }>;

export function settleOperation<T>(declaration: ApplicationDeclaration, input: unknown, fallbackValue?: T): unknown {
  const settlement = parseSettlement<T>(input);
  if (settlement.kind === "local_domain") {
    if (!localDomainResults.has(settlement.result) || !sameExchangeSubject(settlement.request, settlement.result)) fail("LOCAL_DOMAIN_NOT_SEALED");
    return settlePriorOperation(declaration, {
      kind: "local_domain",
      stageId: settlement.stageId,
      request: settlement.request,
      value: settlement.result.value,
    }, fallbackValue);
  }
  return settlePriorOperation(declaration, settlement, fallbackValue);
}

function parseSettlement<T>(input: unknown): ExactSettlement<T> {
  if (!plain(input) || typeof input.kind !== "string") fail("SETTLEMENT_INVALID");
  if (input.kind === "success" && exactKeys(input, ["delivery", "kind", "request", "stageId"])) return input as ExactSettlement<T>;
  if (input.kind === "failed" && exactKeys(input, ["failure", "kind", "request", "stageId"])) return input as ExactSettlement<T>;
  if (input.kind === "local_domain" && exactKeys(input, ["kind", "request", "result", "stageId"])) return input as ExactSettlement<T>;
  if (input.kind === "cancelled" && exactKeys(input, ["kind", "reason", "stageId"]) && ["caller", "superseded", "shutdown"].includes(String(input.reason))) return input as ExactSettlement<T>;
  fail("SETTLEMENT_INVALID");
}

function parseBackoffSettlement(input: unknown): BackoffSettlement {
  if (!plain(input)) fail("BACKOFF_SETTLEMENT_INVALID");
  if (["success", "transient_failure", "permanent_failure"].includes(String(input.kind)) && exactKeys(input, ["kind"])) return Object.freeze({ kind: input.kind }) as BackoffSettlement;
  if (input.kind === "rate_limited" && exactKeys(input, ["kind", "retryAfterMs"]) && (input.retryAfterMs === null || (Number.isSafeInteger(input.retryAfterMs) && Number(input.retryAfterMs) >= 0))) {
    return Object.freeze({ kind: "rate_limited", retryAfterMs: input.retryAfterMs as number | null });
  }
  fail("BACKOFF_SETTLEMENT_INVALID");
}

function sameCacheSubject(key: CacheKey, delivery: ExchangeDelivery<unknown>): boolean {
  return key.operation === delivery.operation && key.instanceId === delivery.instanceId && key.implementation === delivery.implementation && key.generation === delivery.generation && key.requestDigest === delivery.requestDigest;
}

function sameExchangeSubject(left: ExchangeRequest, right: ProviderLocalDomainResult<unknown>): boolean {
  return left.operation === right.operation && left.instanceId === right.instanceId && left.implementation === right.implementation && left.generation === right.generation && left.requestDigest === right.requestDigest;
}

function prior(registry: ProviderRegistry): PriorProviderRegistry {
  const value = priorRegistries.get(registry);
  if (value === undefined) fail("REGISTRY_NOT_ISSUED");
  return value;
}

function byInstance(left: Configured, right: Configured): number { return left.instanceId.localeCompare(right.instanceId); }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean { const actual = Object.keys(value).sort(); const expected = [...keys].sort(); return actual.length === expected.length && actual.every((key, index) => key === expected[index]); }
function plain(value: unknown): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function text(value: unknown): string { if (typeof value !== "string" || value.length === 0 || value.length > 512) fail("TEXT_INVALID"); return value; }
function monotonic(value: unknown): asserts value is number { if (!Number.isSafeInteger(value) || Number(value) < 0) fail("MONOTONIC_INVALID"); }
function instant(value: number): string { return new Date(value).toISOString(); }
function hash(value: string): string { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
function canonical(value: unknown): string { return JSON.stringify(canonicalValue(value)); }
function canonicalValue(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalValue); if (!plain(value)) return value; return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])])); }
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T { if (typeof value !== "object" || value === null || seen.has(value)) return value; seen.add(value); for (const child of Object.values(value as object)) deepFreeze(child, seen); return Object.isFrozen(value) ? value : Object.freeze(value); }
function fail(code: string): never { throw new TypeError(code); }
