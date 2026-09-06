// DISPOSABLE composed author contract for D2942-D2949. Not production code.
import { createHash, randomUUID } from "node:crypto";

import {
  ExactCache as PriorExactCache,
  ProviderRegistry as PriorProviderRegistry,
  PROVIDER_INSTANCE_DECLARATIONS,
  cacheKey as priorCacheKey,
  compileApplications,
  type ApplicationOperationId,
  type BackoffGroupId,
  type CacheKey,
  type ExchangeDelivery,
  type ExchangeFailure,
  type ExchangeRequest,
  type FailureReason,
  type HealthSnapshot,
  type ProviderImplementation,
  type ProviderInstanceId,
} from "../d2869-provider-health-ninth-author-repair/contract.js";

export {
  ExchangeAuthority,
  PROVIDER_INSTANCE_DECLARATIONS,
  compileApplications,
  type ExchangeDelivery,
  type ExchangeFailure,
  type ExchangeRequest,
} from "../d2869-provider-health-ninth-author-repair/contract.js";

type Configured = Readonly<{ instanceId: ProviderInstanceId; implementation: ProviderImplementation; generation: string }>;
type GroupState = { generationDigest: string; claim: Readonly<{ token: string; expiresAt: number }> | null; blockedUntil: number; transientFailures: number };

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

export type ProviderReleaseReceipt = Readonly<{ snapshotDigest: string; stateRevision: number; generations: readonly Configured[] }>;

export type ProviderOperationAvailability =
  | Readonly<{ state: "available"; instanceIds: readonly ProviderInstanceId[] }>
  | Readonly<{ state: "requestable_unverified"; instanceIds: readonly ProviderInstanceId[] }>
  | Readonly<{ state: "recovering"; instanceIds: readonly ProviderInstanceId[] }>
  | Readonly<{ state: "conditional_exact_cache"; instanceIds: readonly ProviderInstanceId[] }>
  | Readonly<{ state: "cached_exact_only"; instanceIds: readonly ProviderInstanceId[] }>
  | Readonly<{ state: "temporarily_blocked"; instanceIds: readonly ProviderInstanceId[]; reason: "upstream_backoff" | "group_claimed"; retryAfterMs: number }>
  | Readonly<{ state: "unavailable"; instanceIds: readonly ProviderInstanceId[]; reason: FailureReason | "not_configured" }>;

export type GroupClaim = Readonly<{ group: BackoffGroupId; token: string }>;
export type ExactOperationResolution<T> =
  | Readonly<{ kind: "miss"; availability: ProviderOperationAvailability }>
  | Readonly<{ kind: "hit"; availability: Readonly<{ state: "cached_exact_only"; instanceIds: readonly ProviderInstanceId[] }>; value: T; original: ExchangeDelivery<T>; cacheServiceReceipt: Readonly<{ source: "retained_exact"; cacheKeyDigest: string; servedAtMonotonic: number; revision: number }> }>;

export interface ProviderHealth {
  snapshot(monotonicNow: number, civilNow: string): ProviderRegistrySnapshot;
  releaseReceipt(snapshot: ProviderRegistrySnapshot, monotonicNow: number): ProviderReleaseReceipt;
  assertReleaseReceipt(receipt: ProviderReleaseReceipt, monotonicNow: number): void;
  acquire(group: BackoffGroupId, monotonicNow: number, leaseMs: number): GroupClaim | Readonly<{ kind: "blocked"; retryAfterMs: number }> | Readonly<{ kind: "claimed" }>;
  settle(claim: GroupClaim, request: ExchangeRequest, outcome: ExchangeDelivery<unknown> | ExchangeFailure, monotonicNow: number): void;
  changeGeneration(instanceId: ProviderInstanceId, generation: string, implementation?: ProviderImplementation): void;
  availability(snapshot: ProviderRegistrySnapshot, operationId: ApplicationOperationId, monotonicNow: number): ProviderOperationAvailability;
  cacheSuccess<T>(operationId: ApplicationOperationId, request: ExchangeRequest, delivery: ExchangeDelivery<T>, cacheKeyDigest: string, expiresAt: number, monotonicNow: number): void;
  resolveExact<T>(snapshot: ProviderRegistrySnapshot, operationId: ApplicationOperationId, request: ExchangeRequest, cacheKeyDigest: string, monotonicNow: number): ExactOperationResolution<T>;
}

const declarationByInstance = new Map(PROVIDER_INSTANCE_DECLARATIONS.map((row) => [row.instanceId, row]));
const snapshotOwners = new WeakMap<object, ProviderHealthComposition>();
const receiptSources = new WeakMap<object, Readonly<{ owner: ProviderHealthComposition; snapshot: ProviderRegistrySnapshot }>>();
const claimOwners = new WeakMap<object, Readonly<{ owner: ProviderHealthComposition; generationDigest: string; token: string }>>();

class ProviderHealthComposition implements ProviderHealth {
  readonly #prior: PriorProviderRegistry;
  readonly #cache: PriorExactCache<unknown>;
  readonly #configured = new Map<ProviderInstanceId, Configured>();
  readonly #groups = new Map<BackoffGroupId, GroupState>();
  #revision = 0;

  constructor(configured: unknown) {
    this.#prior = new PriorProviderRegistry(configured);
    this.#cache = new PriorExactCache<unknown>(this.#prior);
    if (!Array.isArray(configured)) fail("CONFIG_NOT_ARRAY");
    for (const raw of configured) {
      if (!plain(raw) || !exactKeys(raw, ["generation", "implementation", "instanceId"])) fail("CONFIG_INVALID");
      const declaration = declarationByInstance.get(raw.instanceId as ProviderInstanceId);
      if (declaration === undefined || !declaration.allowedImplementations.includes(raw.implementation as never)) fail("CONFIG_INVALID");
      const row = deepFreeze({ instanceId: raw.instanceId as ProviderInstanceId, implementation: raw.implementation as ProviderImplementation, generation: requiredText(raw.generation) });
      if (this.#configured.has(row.instanceId)) fail("CONFIG_DUPLICATE");
      this.#configured.set(row.instanceId, row);
    }
    const groups = new Set([...this.#configured.keys()].flatMap((instanceId) => {
      const group = declarationByInstance.get(instanceId)!.backoffGroup;
      return group === null ? [] : [group];
    }));
    for (const group of groups) this.#groups.set(group, freshGroup(this.#generationDigest(group)));
  }

  snapshot(monotonicNow: number, civilNow: string): ProviderRegistrySnapshot {
    monotonic(monotonicNow);
    const generatedAt = civilInstant(civilNow);
    const instances = this.#prior.snapshot(monotonicNow).instances;
    const backoffGroups = [...this.#groups].map(([group, state]) => projectGroup(group, state, monotonicNow)).sort(byGroup);
    const body = { stateRevision: this.#revision, observedAtMonotonic: monotonicNow, generatedAt, instances, backoffGroups };
    const snapshot = deepFreeze({ ...body, digest: digest(body) });
    snapshotOwners.set(snapshot, this);
    return snapshot;
  }

  releaseReceipt(snapshot: ProviderRegistrySnapshot, monotonicNow: number): ProviderReleaseReceipt {
    this.#assertSnapshot(snapshot, monotonicNow);
    const receipt = deepFreeze({ snapshotDigest: snapshot.digest, stateRevision: snapshot.stateRevision, generations: this.#generationImage() });
    receiptSources.set(receipt, deepFreeze({ owner: this, snapshot }));
    return receipt;
  }

  assertReleaseReceipt(receipt: ProviderReleaseReceipt, monotonicNow: number): void {
    const source = receiptSources.get(receipt);
    if (source?.owner !== this || receipt.stateRevision !== this.#revision || receipt.snapshotDigest !== source.snapshot.digest
      || canonical(receipt.generations) !== canonical(this.#generationImage())) fail("RELEASE_RECEIPT_STALE_OR_CROSSED");
    this.#assertSnapshot(source.snapshot, monotonicNow);
  }

  acquire(group: BackoffGroupId, now: number, leaseMs: number): GroupClaim | Readonly<{ kind: "blocked"; retryAfterMs: number }> | Readonly<{ kind: "claimed" }> {
    monotonic(now);
    if (!Number.isSafeInteger(leaseMs) || leaseMs <= 0 || leaseMs > 60_000) fail("LEASE_INVALID");
    const state = this.#requiredGroup(group);
    this.#assertGeneration(group, state);
    if (state.claim !== null && state.claim.expiresAt > now) return deepFreeze({ kind: "claimed" as const });
    if (state.blockedUntil > now) return deepFreeze({ kind: "blocked" as const, retryAfterMs: state.blockedUntil - now });
    const token = randomUUID();
    state.claim = deepFreeze({ token, expiresAt: now + leaseMs });
    this.#revision += 1;
    const claim = deepFreeze({ group, token });
    claimOwners.set(claim, deepFreeze({ owner: this, generationDigest: state.generationDigest, token }));
    return claim;
  }

  settle(claim: GroupClaim, request: ExchangeRequest, outcome: ExchangeDelivery<unknown> | ExchangeFailure, now: number): void {
    monotonic(now);
    const authority = claimOwners.get(claim);
    const state = this.#requiredGroup(claim.group);
    this.#assertGeneration(claim.group, state);
    if (authority?.owner !== this || authority.token !== claim.token || authority.generationDigest !== state.generationDigest
      || state.claim?.token !== claim.token || state.claim.expiresAt <= now) fail("LEASE_STALE_OR_CROSSED");
    this.#prior.assertCurrent(request);
    this.#prior.assertCurrent(outcome);
    const declaration = declarationByInstance.get(request.instanceId);
    if (declaration?.backoffGroup !== claim.group || !sameSubject(request, outcome)) fail("EXCHANGE_GROUP_OR_SUBJECT_CROSSED");
    if ("payload" in outcome) {
      this.#prior.success(request, outcome, now);
      state.claim = null;
      state.transientFailures = 0;
      state.blockedUntil = 0;
    } else {
      this.#prior.failure(request, outcome, now);
      state.claim = null;
      applyFailure(state, outcome.reason, now);
    }
    this.#revision += 1;
  }

  changeGeneration(instanceId: ProviderInstanceId, generation: string, implementation?: ProviderImplementation): void {
    const current = this.#configured.get(instanceId);
    if (current === undefined) fail("INSTANCE_NOT_CONFIGURED");
    const next = requiredText(generation);
    if (next === current.generation) fail("GENERATION_MUST_CHANGE");
    const nextImplementation = implementation ?? current.implementation;
    const declaration = declarationByInstance.get(instanceId)!;
    if (!declaration.allowedImplementations.includes(nextImplementation as never)) fail("CONFIG_IMPLEMENTATION_INVALID");
    this.#prior.changeGeneration(instanceId, next, nextImplementation);
    this.#configured.set(instanceId, deepFreeze({ instanceId, generation: next, implementation: nextImplementation }));
    if (declaration.backoffGroup !== null) this.#groups.set(declaration.backoffGroup, freshGroup(this.#generationDigest(declaration.backoffGroup)));
    this.#revision += 1;
  }

  availability(snapshot: ProviderRegistrySnapshot, operationId: ApplicationOperationId, now: number): ProviderOperationAvailability {
    this.#assertSnapshot(snapshot, now);
    const app = application(operationId);
    const instanceIds = deepFreeze([app.stage.instanceId]);
    const instance = snapshot.instances.find((row) => row.instanceId === app.stage.instanceId);
    if (instance === undefined || instance.state === "not_configured") return parseProviderOperationAvailability({ state: "unavailable", instanceIds, reason: "not_configured" });
    const group = declarationByInstance.get(instance.instanceId)!.backoffGroup;
    const groupState = group === null ? undefined : snapshot.backoffGroups.find((row) => row.group === group);
    if (groupState?.state === "claimed") return parseProviderOperationAvailability({ state: "temporarily_blocked", instanceIds, reason: "group_claimed", retryAfterMs: groupState.retryAfterMs });
    if (groupState?.state === "blocked") return parseProviderOperationAvailability({ state: "temporarily_blocked", instanceIds, reason: "upstream_backoff", retryAfterMs: groupState.retryAfterMs });
    if (instance.state === "unverified") return parseProviderOperationAvailability({ state: "requestable_unverified", instanceIds });
    if (instance.state === "recovering") return parseProviderOperationAvailability({ state: "recovering", instanceIds });
    if (instance.state === "degraded_cached_only") return parseProviderOperationAvailability({ state: "conditional_exact_cache", instanceIds });
    if (instance.state === "unavailable") return parseProviderOperationAvailability({ state: "unavailable", instanceIds, reason: instance.reason });
    return parseProviderOperationAvailability({ state: "available", instanceIds });
  }

  cacheSuccess<T>(operationId: ApplicationOperationId, request: ExchangeRequest, delivery: ExchangeDelivery<T>, cacheKeyDigest: string, expiresAt: number, now: number): void {
    const key = priorCacheKey(this.#prior, application(operationId), request, cacheKeyDigest);
    this.#cache.put(key, delivery, expiresAt, now);
    this.#revision += 1;
  }

  resolveExact<T>(snapshot: ProviderRegistrySnapshot, operationId: ApplicationOperationId, request: ExchangeRequest, cacheKeyDigest: string, now: number): ExactOperationResolution<T> {
    this.#assertSnapshot(snapshot, now);
    const app = application(operationId);
    const key: CacheKey = priorCacheKey(this.#prior, app, request, cacheKeyDigest);
    const result = this.#cache.resolve(key, now);
    if (result.kind === "miss") {
      return deepFreeze({ kind: "miss" as const, availability: this.availability(snapshot, operationId, now) });
    }
    this.#revision += 1;
    const availability = parseProviderOperationAvailability({ state: "cached_exact_only", instanceIds: [app.stage.instanceId] });
    if (availability.state !== "cached_exact_only") fail("AVAILABILITY_INVALID");
    return deepFreeze({ kind: "hit" as const, availability, value: result.value as T, original: result.original as ExchangeDelivery<T>, cacheServiceReceipt: result.cacheServiceReceipt });
  }

  #assertSnapshot(snapshot: ProviderRegistrySnapshot, now: number): void {
    monotonic(now);
    if (snapshotOwners.get(snapshot) !== this || snapshot.stateRevision !== this.#revision) fail("SNAPSHOT_STALE_OR_CROSSED");
    const instances = this.#prior.snapshot(now).instances;
    const groups = [...this.#groups].map(([group, state]) => projectGroup(group, state, now)).sort(byGroup);
    if (canonical(instances) !== canonical(snapshot.instances) || canonical(groups) !== canonical(snapshot.backoffGroups)) fail("SNAPSHOT_STALE_OR_CROSSED");
  }

  #requiredGroup(group: BackoffGroupId): GroupState {
    const state = this.#groups.get(group);
    if (state === undefined) fail("BACKOFF_GROUP_NOT_CONFIGURED");
    return state;
  }

  #assertGeneration(group: BackoffGroupId, state: GroupState): void {
    if (this.#generationDigest(group) !== state.generationDigest) fail("GROUP_GENERATION_STATE_STALE");
  }

  #generationDigest(group: BackoffGroupId): string {
    const members = [...this.#configured.values()].filter((row) => declarationByInstance.get(row.instanceId)!.backoffGroup === group).sort(byInstance);
    if (members.length === 0) fail("BACKOFF_GROUP_NOT_CONFIGURED");
    return digest({ group, members });
  }

  #generationImage(): readonly Configured[] { return deepFreeze([...this.#configured.values()].sort(byInstance)); }
}

export function createProviderHealth(configured: unknown): ProviderHealth { return Object.freeze(new ProviderHealthComposition(configured)); }

export function assertProviderReleaseReceipt(value: unknown, now: number): asserts value is ProviderReleaseReceipt {
  if (!plain(value)) fail("RELEASE_RECEIPT_NOT_SEALED");
  const source = receiptSources.get(value);
  if (source === undefined) fail("RELEASE_RECEIPT_NOT_SEALED");
  source.owner.assertReleaseReceipt(value as ProviderReleaseReceipt, now);
}

export function parseProviderOperationAvailability(value: unknown): ProviderOperationAvailability {
  if (!plain(value) || !Array.isArray(value.instanceIds) || value.instanceIds.length === 0 || value.instanceIds.some((id) => !declarationByInstance.has(id as ProviderInstanceId))) fail("AVAILABILITY_INVALID");
  const instanceIds = deepFreeze([...value.instanceIds] as ProviderInstanceId[]);
  if (new Set(instanceIds).size !== instanceIds.length || [...instanceIds].sort().some((id, index) => id !== instanceIds[index])) fail("AVAILABILITY_INVALID");
  if (["available", "requestable_unverified", "recovering", "conditional_exact_cache", "cached_exact_only"].includes(String(value.state))) {
    if (!exactKeys(value, ["instanceIds", "state"])) fail("AVAILABILITY_INVALID");
    return deepFreeze({ state: value.state, instanceIds }) as ProviderOperationAvailability;
  }
  if (value.state === "temporarily_blocked") {
    if (!exactKeys(value, ["instanceIds", "reason", "retryAfterMs", "state"]) || !["upstream_backoff", "group_claimed"].includes(String(value.reason)) || !Number.isSafeInteger(value.retryAfterMs) || value.retryAfterMs <= 0) fail("AVAILABILITY_INVALID");
    return deepFreeze({ state: value.state, instanceIds, reason: value.reason, retryAfterMs: value.retryAfterMs }) as ProviderOperationAvailability;
  }
  if (value.state === "unavailable") {
    if (!exactKeys(value, ["instanceIds", "reason", "state"]) || !["not_configured", ...FAILURE_REASONS].includes(String(value.reason))) fail("AVAILABILITY_INVALID");
    return deepFreeze({ state: value.state, instanceIds, reason: value.reason }) as ProviderOperationAvailability;
  }
  fail("AVAILABILITY_INVALID");
}

const FAILURE_REASONS: readonly FailureReason[] = Object.freeze(["startup", "process_exit", "timeout", "network", "rate_limited", "overloaded", "authentication", "protocol", "cancelled_by_shutdown"]);

function applyFailure(state: GroupState, reason: FailureReason, now: number): void {
  if (reason === "rate_limited") state.blockedUntil = now + 60_000;
  else if (reason === "authentication" || reason === "protocol") state.blockedUntil = Number.MAX_SAFE_INTEGER;
  else { state.transientFailures = Math.min(3, state.transientFailures + 1); state.blockedUntil = now + [5_000, 15_000, 60_000][state.transientFailures - 1]!; }
}

function freshGroup(generationDigest: string): GroupState { return { generationDigest, claim: null, blockedUntil: 0, transientFailures: 0 }; }
function projectGroup(group: BackoffGroupId, state: GroupState, now: number): BackoffGroupProjection {
  if (state.blockedUntil > now) return deepFreeze({ group, state: "blocked" as const, retryAfterMs: state.blockedUntil - now });
  if (state.claim !== null && state.claim.expiresAt > now) return deepFreeze({ group, state: "claimed" as const, retryAfterMs: state.claim.expiresAt - now });
  return deepFreeze({ group, state: "available" as const, retryAfterMs: null });
}
function application(operationId: ApplicationOperationId) { const value = compileApplications().find((row) => row.operationId === operationId); if (value === undefined) fail("APPLICATION_UNKNOWN"); return value; }
function sameSubject(request: ExchangeRequest, outcome: ExchangeDelivery<unknown> | ExchangeFailure): boolean { return request.operation === outcome.operation && request.instanceId === outcome.instanceId && request.implementation === outcome.implementation && request.generation === outcome.generation && request.requestDigest === outcome.requestDigest; }
function civilInstant(value: unknown): string { if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value) || new Date(value).toISOString() !== value) fail("CIVIL_TIME_INVALID"); return value; }
function monotonic(value: unknown): asserts value is number { if (!Number.isSafeInteger(value) || Number(value) < 0) fail("MONOTONIC_INVALID"); }
function requiredText(value: unknown): string { if (typeof value !== "string" || value.length === 0 || value.length > 512) fail("TEXT_INVALID"); return value; }
function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean { const actual = Object.keys(value).sort(); const expected = [...keys].sort(); return actual.length === expected.length && actual.every((key, index) => key === expected[index]); }
function plain(value: unknown): value is Record<string, any> { return value !== null && typeof value === "object" && !Array.isArray(value); }
function byInstance(left: Configured, right: Configured): number { return left.instanceId < right.instanceId ? -1 : left.instanceId > right.instanceId ? 1 : 0; }
function byGroup(left: BackoffGroupProjection, right: BackoffGroupProjection): number { return left.group < right.group ? -1 : left.group > right.group ? 1 : 0; }
function canonical(value: unknown): string { return JSON.stringify(canonicalValue(value)); }
function canonicalValue(value: unknown): unknown { if (Array.isArray(value)) return value.map(canonicalValue); if (!plain(value)) return value; return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])])); }
function digest(value: unknown): string { return `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`; }
function deepFreeze<T>(value: T, seen = new WeakSet<object>()): T { if (value === null || typeof value !== "object" || seen.has(value)) return value; seen.add(value); for (const child of Object.values(value as object)) deepFreeze(child, seen); return Object.isFrozen(value) ? value : Object.freeze(value); }
function fail(code: string): never { throw new TypeError(code); }
