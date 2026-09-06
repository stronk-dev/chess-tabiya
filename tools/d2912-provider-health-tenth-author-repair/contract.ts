// DISPOSABLE composed author contract for D2912-D2915. Not production code.
import { createHash } from "node:crypto";

import {
  BackoffCoordinator as PriorBackoffCoordinator,
  ExactCache as PriorExactCache,
  ProviderRegistry as PriorProviderRegistry,
  cacheKey as priorCacheKey,
  compileApplications,
  type ApplicationDeclaration,
  type ApplicationOperationId,
  type BackoffGroupId,
  type CacheKey,
  type ExchangeDelivery,
  type ExchangeFailure,
  type ExchangeRequest,
  type HealthSnapshot,
  type ProviderGenerationSet,
  type ProviderImplementation,
  type ProviderInstanceId,
} from "../d2869-provider-health-ninth-author-repair/contract.js";

export * from "../d2869-provider-health-ninth-author-repair/contract.js";

const GROUP_BY_INSTANCE: Readonly<Partial<Record<ProviderInstanceId, BackoffGroupId>>> = Object.freeze({
  "tablebase-primary": "lichess-api",
  "explorer-primary": "lichess-api",
  "external-voice": "external-voice-api",
  "external-tts": "external-tts-api",
});

type Configured = Readonly<{
  instanceId: ProviderInstanceId;
  implementation: ProviderImplementation;
  generation: string;
}>;

export type BackoffGroupProjection =
  | Readonly<{ group: BackoffGroupId; state: "available"; retryAfterMs: null }>
  | Readonly<{ group: BackoffGroupId; state: "claimed"; retryAfterMs: number }>
  | Readonly<{ group: BackoffGroupId; state: "blocked"; retryAfterMs: number }>;

export type ProviderRegistrySnapshot = Readonly<{
  stateRevision: number;
  observedAtMonotonic: number;
  generatedAt: string;
  instances: readonly HealthSnapshot[];
  backoffGroups: readonly BackoffGroupProjection[];
  digest: string;
}>;

export type ProviderReleaseReceipt = Readonly<{
  snapshotDigest: string;
  stateRevision: number;
  generations: readonly Readonly<{
    instanceId: ProviderInstanceId;
    implementation: ProviderImplementation;
    generation: string;
  }>[];
}>;

const snapshots = new WeakMap<object, Readonly<{
  owner: ProviderRegistry;
  prior: ReturnType<PriorProviderRegistry["snapshot"]>;
}>>();
const releaseSources = new WeakMap<object, Readonly<{
  owner: ProviderRegistry;
  snapshot: ProviderRegistrySnapshot;
}>>();
const releaseOwners = new WeakMap<object, ProviderRegistry>();

export class ProviderRegistry {
  readonly #prior: PriorProviderRegistry;
  readonly #configured = new Map<ProviderInstanceId, Configured>();
  readonly #requiredGroups = new Set<BackoffGroupId>();
  readonly #coordinators = new Map<BackoffGroupId, BackoffCoordinator>();
  #stateRevision = 0;

  constructor(configured: unknown) {
    this.#prior = new PriorProviderRegistry(configured);
    if (!Array.isArray(configured)) fail("CONFIG_NOT_ARRAY");
    for (const raw of configured) {
      if (!plain(raw)) fail("CONFIG_INVALID");
      const row = Object.freeze({
        instanceId: raw.instanceId as ProviderInstanceId,
        implementation: raw.implementation as ProviderImplementation,
        generation: String(raw.generation),
      });
      this.#configured.set(row.instanceId, row);
      const group = GROUP_BY_INSTANCE[row.instanceId];
      if (group !== undefined) this.#requiredGroups.add(group);
    }
  }

  prior(): PriorProviderRegistry { return this.#prior; }

  registerCoordinator(coordinator: BackoffCoordinator): void {
    if (this.#coordinators.has(coordinator.group)) fail("BACKOFF_COORDINATOR_DUPLICATE");
    this.#coordinators.set(coordinator.group, coordinator);
    this.#stateRevision += 1;
  }

  changed(): void { this.#stateRevision += 1; }

  assertCurrent(subject: ExchangeRequest | ExchangeDelivery<unknown> | ExchangeFailure): void {
    this.#prior.assertCurrent(subject);
  }

  success(request: ExchangeRequest, delivery: ExchangeDelivery<unknown>, now: number): void {
    this.#prior.success(request, delivery, now);
    this.changed();
  }

  failure(request: ExchangeRequest, failure: ExchangeFailure, now: number): void {
    this.#prior.failure(request, failure, now);
    this.changed();
  }

  changeGeneration(instanceId: ProviderInstanceId, generation: string, implementation?: ProviderImplementation): void {
    this.#prior.changeGeneration(instanceId, generation, implementation);
    const current = this.#configured.get(instanceId);
    if (current === undefined) fail("INSTANCE_NOT_CONFIGURED");
    this.#configured.set(instanceId, Object.freeze({
      instanceId,
      implementation: implementation ?? current.implementation,
      generation,
    }));
    const group = GROUP_BY_INSTANCE[instanceId];
    if (group !== undefined) this.#coordinators.get(group)?.generationChanged();
    this.changed();
  }

  snapshot(now: number): ProviderRegistrySnapshot {
    monotonic(now);
    this.#assertCoordinatorClosure();
    const priorSnapshot = this.#prior.snapshot(now);
    const backoffGroups = [...this.#coordinators.values()]
      .map((coordinator) => coordinator.project(now))
      .sort((left, right) => byteOrder(left.group, right.group));
    const body = {
      stateRevision: this.#stateRevision,
      observedAtMonotonic: now,
      generatedAt: new Date(now).toISOString(),
      instances: priorSnapshot.instances,
      backoffGroups,
    };
    const snapshot = deepFreeze({ ...body, digest: hash(canonical(body)) });
    snapshots.set(snapshot, Object.freeze({ owner: this, prior: priorSnapshot }));
    return snapshot;
  }

  assertCurrentSnapshot(snapshot: ProviderRegistrySnapshot, now: number): void {
    monotonic(now);
    const source = snapshots.get(snapshot);
    if (source?.owner !== this || snapshot.stateRevision !== this.#stateRevision) fail("SNAPSHOT_STALE_OR_CROSSED");
    this.#prior.assertCurrentSnapshot(source.prior, now);
    const currentGroups = [...this.#coordinators.values()]
      .map((coordinator) => coordinator.project(now))
      .sort((left, right) => byteOrder(left.group, right.group));
    if (canonical(currentGroups) !== canonical(snapshot.backoffGroups)) fail("SNAPSHOT_STALE_OR_CROSSED");
  }

  releaseReceipt(snapshot: ProviderRegistrySnapshot, now: number): ProviderReleaseReceipt {
    this.assertCurrentSnapshot(snapshot, now);
    const receipt = deepFreeze({
      snapshotDigest: snapshot.digest,
      stateRevision: snapshot.stateRevision,
      generations: this.#generationImage(),
    });
    releaseSources.set(receipt, Object.freeze({ owner: this, snapshot }));
    releaseOwners.set(receipt, this);
    return receipt;
  }

  assertCurrentReleaseReceipt(receipt: ProviderReleaseReceipt, now: number): void {
    const source = releaseSources.get(receipt);
    if (source?.owner !== this || releaseOwners.get(receipt) !== this) fail("RELEASE_RECEIPT_STALE_OR_CROSSED");
    this.assertCurrentSnapshot(source.snapshot, now);
    if (canonical(receipt.generations) !== canonical(this.#generationImage())) fail("RELEASE_RECEIPT_STALE_OR_CROSSED");
  }

  generationSet(snapshot: ProviderRegistrySnapshot, group: BackoffGroupId): ProviderGenerationSet {
    const source = snapshots.get(snapshot);
    if (source?.owner !== this) fail("SNAPSHOT_STALE_OR_CROSSED");
    this.assertCurrentSnapshot(snapshot, snapshot.observedAtMonotonic);
    return this.#prior.generationSet(source.prior, group);
  }

  assertGenerationSet(value: ProviderGenerationSet, group: BackoffGroupId): void {
    this.#prior.assertGenerationSet(value, group);
  }

  #generationImage(): ProviderReleaseReceipt["generations"] {
    return [...this.#configured.values()]
      .sort((left, right) => byteOrder(left.instanceId, right.instanceId))
      .map((row) => Object.freeze({
        instanceId: row.instanceId,
        implementation: row.implementation,
        generation: row.generation,
      }));
  }

  #assertCoordinatorClosure(): void {
    for (const group of this.#requiredGroups) {
      if (!this.#coordinators.has(group)) fail("BACKOFF_COORDINATOR_MISSING");
    }
  }
}

export function assertProviderReleaseReceipt(value: unknown, now: number): asserts value is ProviderReleaseReceipt {
  monotonic(now);
  if (!plain(value)) fail("RELEASE_RECEIPT_NOT_SEALED");
  const owner = releaseOwners.get(value);
  if (owner === undefined) fail("RELEASE_RECEIPT_NOT_SEALED");
  owner.assertCurrentReleaseReceipt(value as ProviderReleaseReceipt, now);
}

export type ProfileAvailability = Readonly<{
  state: "available" | "requestable_unverified" | "recovering" | "conditional_exact_cache" | "temporarily_blocked" | "unavailable";
  instanceId: ProviderInstanceId;
  generation: string | null;
  retryAfterMs?: number;
}>;

export function selectProfileAvailability(snapshot: ProviderRegistrySnapshot, operationId: ApplicationOperationId, now: number): ProfileAvailability {
  const source = snapshots.get(snapshot);
  if (source === undefined) fail("SNAPSHOT_NOT_SEALED");
  source.owner.assertCurrentSnapshot(snapshot, now);
  const declaration = compileApplications().find((row) => row.operationId === operationId);
  if (declaration === undefined) fail("APPLICATION_UNKNOWN");
  const instance = snapshot.instances.find((row) => row.instanceId === declaration.stage.instanceId);
  if (instance === undefined) fail("INSTANCE_NOT_CONFIGURED");
  const group = GROUP_BY_INSTANCE[instance.instanceId];
  const groupState = group === undefined ? undefined : snapshot.backoffGroups.find((row) => row.group === group);
  if (groupState !== undefined && groupState.state !== "available") {
    return Object.freeze({ state: "temporarily_blocked", instanceId: instance.instanceId, generation: "generation" in instance ? instance.generation : null, retryAfterMs: groupState.retryAfterMs });
  }
  if (instance.state === "not_configured") return Object.freeze({ state: "unavailable", instanceId: instance.instanceId, generation: null });
  if (instance.state === "unverified") return Object.freeze({ state: "requestable_unverified", instanceId: instance.instanceId, generation: instance.generation });
  if (instance.state === "recovering") return Object.freeze({ state: "recovering", instanceId: instance.instanceId, generation: instance.generation });
  if (instance.state === "degraded_cached_only") return Object.freeze({ state: "conditional_exact_cache", instanceId: instance.instanceId, generation: instance.generation });
  return Object.freeze({ state: instance.state, instanceId: instance.instanceId, generation: instance.generation });
}

export function cacheKey(registry: ProviderRegistry, declaration: ApplicationDeclaration, request: ExchangeRequest, cacheKeyDigest: string): CacheKey {
  registry.assertCurrent(request);
  return priorCacheKey(registry.prior(), declaration, request, cacheKeyDigest);
}

export class ExactCache<T> {
  readonly #prior: PriorExactCache<T>;
  constructor(readonly registry: ProviderRegistry) { this.#prior = new PriorExactCache<T>(registry.prior()); }
  put(key: CacheKey, original: ExchangeDelivery<T>, expiresAt: number, now: number): void {
    this.#prior.put(key, original, expiresAt, now);
    this.registry.changed();
  }
  resolve(key: CacheKey, now: number) {
    const result = this.#prior.resolve(key, now);
    if (result.kind === "hit") this.registry.changed();
    return result;
  }
  count(instanceId: ProviderInstanceId, generation: string, now: number): number {
    return this.#prior.count(instanceId, generation, now);
  }
  invalidate(instanceId: ProviderInstanceId, generation: string): void {
    this.#prior.invalidate(instanceId, generation);
    this.registry.changed();
  }
}

type BackoffSettlement =
  | Readonly<{ kind: "success" }>
  | Readonly<{ kind: "rate_limited"; retryAfterMs: number | null }>
  | Readonly<{ kind: "transient_failure" }>
  | Readonly<{ kind: "permanent_failure" }>;

export class BackoffCoordinator {
  readonly #prior: PriorBackoffCoordinator;
  #claimExpiresAt: number | null = null;
  #blockedUntil = 0;
  #transientFailures = 0;

  constructor(readonly registry: ProviderRegistry, readonly group: BackoffGroupId) {
    this.#prior = new PriorBackoffCoordinator(registry.prior(), group);
    registry.registerCoordinator(this);
  }

  acquire(now: number, generations: ProviderGenerationSet, leaseMs: number) {
    const result = this.#prior.acquire(now, generations, leaseMs);
    if (result.kind === "acquired") {
      this.#claimExpiresAt = now + leaseMs;
      this.registry.changed();
    }
    return result;
  }

  renew(now: number, generations: ProviderGenerationSet, token: string, leaseMs: number): void {
    this.#prior.renew(now, generations, token, leaseMs);
    this.#claimExpiresAt = now + leaseMs;
    this.registry.changed();
  }

  settle(now: number, generations: ProviderGenerationSet, token: string, settlement: unknown): void {
    this.#prior.settle(now, generations, token, settlement);
    const parsed = settlement as BackoffSettlement;
    this.#claimExpiresAt = null;
    if (parsed.kind === "success") {
      this.#transientFailures = 0;
      this.#blockedUntil = 0;
    }
    else if (parsed.kind === "rate_limited") this.#blockedUntil = now + Math.max(60_000, parsed.retryAfterMs ?? 0);
    else if (parsed.kind === "permanent_failure") this.#blockedUntil = Number.MAX_SAFE_INTEGER;
    else {
      this.#transientFailures = Math.min(3, this.#transientFailures + 1);
      this.#blockedUntil = now + [5_000, 15_000, 60_000][this.#transientFailures - 1]!;
    }
    this.registry.changed();
  }

  expire(now: number): void {
    this.#prior.expire(now);
    if (this.#claimExpiresAt !== null && this.#claimExpiresAt <= now) {
      this.#claimExpiresAt = null;
      this.registry.changed();
    }
  }

  generationChanged(): void {
    this.#claimExpiresAt = null;
    this.#blockedUntil = 0;
    this.#transientFailures = 0;
  }

  project(now: number): BackoffGroupProjection {
    monotonic(now);
    if (this.#blockedUntil > now) return Object.freeze({ group: this.group, state: "blocked", retryAfterMs: this.#blockedUntil - now });
    if (this.#claimExpiresAt !== null && this.#claimExpiresAt > now) return Object.freeze({ group: this.group, state: "claimed", retryAfterMs: this.#claimExpiresAt - now });
    return Object.freeze({ group: this.group, state: "available", retryAfterMs: null });
  }
}

function byteOrder(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }
function plain(value: unknown): value is Record<string, any> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function monotonic(value: unknown): asserts value is number { if (!Number.isSafeInteger(value) || Number(value) < 0) fail("MONOTONIC_INVALID"); }
function hash(value: string): string { return `sha256:${createHash("sha256").update(value).digest("hex")}`; }
function canonical(value: unknown): string { return JSON.stringify(canonicalValue(value)); }
function canonicalValue(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalValue); if (!plain(value)) return value; return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])])); }
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T { if (typeof value !== "object" || value === null || seen.has(value)) return value; seen.add(value); for (const child of Object.values(value as object)) deepFreeze(child, seen); return Object.isFrozen(value) ? value : Object.freeze(value); }
function fail(code: string): never { throw new TypeError(code); }
