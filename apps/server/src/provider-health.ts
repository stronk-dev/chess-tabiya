/**
 * The live provider-health authority (rfc/provider-health-degradation.md §§1-9, 11).
 *
 * One application-lifetime `ProviderRegistry` owns, per concrete provider instance and generation:
 * the state machine, the circuit (repeat-open window, retry time, half-open token, two-success
 * recovery), and — per backoff group compiled from `PROVIDER_INSTANCE_DECLARATIONS` — exactly one
 * `ProviderBackoffCoordinator` that serializes the group's live requests and owns blocked-until and
 * the 5 s → 15 s → 60 s sequence. The snapshot projection reads the same coordinator that admits
 * requests, so what `/capabilities` says and what admission does cannot diverge.
 *
 * Configuration answers only "exists, and with which implementation" (`not_configured` or
 * `unverified`); only a real current-generation handshake or request outcome produces `available`.
 * Monotonic time (`monotonicNowMs`) alone decides durations; civil time (`wallNow`) is display-only.
 *
 * Nothing here probes a provider. `/capabilities` reads `snapshot()`, which is an in-memory join of
 * the last real outcomes with the registered cache inventories.
 */
import { randomUUID } from "node:crypto";

import {
  APPLICATION_PROVIDER_EXECUTION,
  PROVIDER_BACKOFF_GROUP_IDS,
  PROVIDER_INSTANCE_DECLARATIONS,
  PROVIDER_INSTANCE_IDS,
  POLICY_MODE_OPERATIONS,
  RUN_OPPONENT_MODES,
  applicationProviderExecution,
  combineOperationAvailability,
  instanceOperationAvailability,
  providerBackoffGroupMembers,
  providerInstanceDeclaration,
  type ApplicationProviderOperationId,
  type ProviderBackoffGroupId,
  type ProviderFailureReason,
  type ProviderHealthCapabilities,
  type ProviderHealthSnapshot,
  type ProviderImplementation,
  type ProviderInstanceId,
  type ProviderOperationAvailability,
  type ProviderOperationId,
  type TypedProviderResult,
  assertProviderDelivery,
  sha256Hex,
} from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";

// ---------------------------------------------------------------------------------------------
// Configuration (§1, §3)
// ---------------------------------------------------------------------------------------------

export interface ProviderInstanceConfiguration {
  readonly instanceId: ProviderInstanceId;
  readonly implementation: ProviderImplementation;
  /** Endpoint or engine id; never a secret, never a query string. */
  readonly endpoint: string;
  /** Immutable model/engine identity the deployment configured (model id, image, binary path). */
  readonly identity: string;
  /** Behavior-affecting options only. */
  readonly options?: Readonly<Record<string, string | number | boolean>>;
  /** Non-secret configuration revision; a secret rotation changes this, never the secret itself. */
  readonly configRevision?: string;
}

const TRANSIENT_REASONS: ReadonlySet<ProviderFailureReason> = new Set(["timeout", "network", "rate_limited", "overloaded"]);
const REPEAT_OPEN_WINDOW_MS = 300_000;
const RATE_LIMIT_FLOOR_MS = 60_000;
const BACKOFF_SEQUENCE_MS = Object.freeze([5_000, 15_000, 60_000]);
const PROCESS_RETRY_MS = 5_000;

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value as object).sort().map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

function digest(value: unknown): string {
  return `sha256:${sha256Hex(canonical(value))}`;
}

function parseConfiguration(rows: readonly ProviderInstanceConfiguration[]): ReadonlyMap<ProviderInstanceId, ProviderInstanceConfiguration> {
  const parsed = new Map<ProviderInstanceId, ProviderInstanceConfiguration>();
  for (const row of rows) {
    if (!PROVIDER_INSTANCE_IDS.includes(row.instanceId)) throw new TypeError(`Unknown provider instance in configuration: ${String(row.instanceId)}`);
    if (parsed.has(row.instanceId)) throw new TypeError(`Provider instance configured twice: ${row.instanceId}`);
    const declaration = providerInstanceDeclaration(row.instanceId);
    if (!(declaration.allowedImplementations as readonly string[]).includes(row.implementation)) {
      throw new TypeError(`${row.instanceId} does not admit implementation ${String(row.implementation)}`);
    }
    if (typeof row.endpoint !== "string" || row.endpoint === "" || /[?#]/u.test(row.endpoint)) throw new TypeError(`${row.instanceId} endpoint must be a non-empty identity without query or fragment`);
    if (typeof row.identity !== "string" || row.identity === "") throw new TypeError(`${row.instanceId} identity must be a non-empty string`);
    parsed.set(row.instanceId, Object.freeze({ ...row, options: Object.freeze({ ...(row.options ?? {}) }) }));
  }
  return parsed;
}

// ---------------------------------------------------------------------------------------------
// Typed unavailable outcome
// ---------------------------------------------------------------------------------------------

/** The typed, bounded unavailable result every provider-backed operation returns (§2, §5). */
export class ProviderUnavailableError extends ServerError {
  readonly operation: ApplicationProviderOperationId;
  readonly availability: ProviderOperationAvailability;
  readonly retryAfterMs: number | null;

  constructor(operation: ApplicationProviderOperationId, availability: ProviderOperationAvailability, retryAfterMs: number | null, message?: string) {
    super("PROVIDER_UNAVAILABLE", message ?? `Provider operation ${operation} is unavailable`, {
      details: { operation, availability, retryAfterMs },
    });
    this.name = "ProviderUnavailableError";
    this.operation = operation;
    this.availability = availability;
    this.retryAfterMs = retryAfterMs;
  }
}

// ---------------------------------------------------------------------------------------------
// Backoff coordinator (§6) — one per configured non-null group, owned by its registry
// ---------------------------------------------------------------------------------------------

interface GroupClaim {
  readonly token: string;
  readonly image: string;
  leaseExpiresAtMonotonic: number;
}

export type GroupAcquire =
  | { readonly kind: "claim"; readonly token: string; readonly image: string }
  | { readonly kind: "blocked"; readonly retryAfterMs: number }
  | { readonly kind: "claimed"; readonly retryAfterMs: number };

export class ProviderBackoffCoordinator {
  readonly group: ProviderBackoffGroupId;
  readonly #owner: object;
  #blockedUntilMonotonic = Number.NEGATIVE_INFINITY;
  #sequence = 0;
  #claim: GroupClaim | undefined;
  #waiters: (() => void)[] = [];

  constructor(group: ProviderBackoffGroupId, owner: object) {
    this.group = group;
    this.#owner = owner;
  }

  belongsTo(owner: object): boolean {
    return this.#owner === owner;
  }

  blockedFor(now: number): number {
    return Math.max(0, this.#blockedUntilMonotonic - now);
  }

  claimed(now: number): boolean {
    this.#expire(now);
    return this.#claim !== undefined;
  }

  #expire(now: number): void {
    if (this.#claim !== undefined && now >= this.#claim.leaseExpiresAtMonotonic) {
      this.#claim = undefined;
      this.#wake();
    }
  }

  #wake(): void {
    const waiters = this.#waiters;
    this.#waiters = [];
    for (const waiter of waiters) waiter();
  }

  /** Non-waiting acquire: exactly `blocked`, `claimed`, or a newly tokenized claim. */
  acquire(now: number, image: string, leaseMs: number): GroupAcquire {
    this.#expire(now);
    const blocked = this.blockedFor(now);
    if (blocked > 0) return Object.freeze({ kind: "blocked", retryAfterMs: blocked });
    if (this.#claim !== undefined) return Object.freeze({ kind: "claimed", retryAfterMs: Math.max(0, this.#claim.leaseExpiresAtMonotonic - now) });
    const claim: GroupClaim = { token: randomUUID(), image, leaseExpiresAtMonotonic: now + leaseMs };
    this.#claim = claim;
    return Object.freeze({ kind: "claim", token: claim.token, image });
  }

  /** Waits (FIFO, bounded by the caller's deadline) while another member holds the group. */
  async acquireWithin(now: () => number, image: string, deadlineMonotonic: number, timers: RegistryTimers): Promise<GroupAcquire> {
    for (;;) {
      const current = now();
      const result = this.acquire(current, image, Math.max(1, deadlineMonotonic - current));
      if (result.kind !== "claimed") return result;
      const remaining = deadlineMonotonic - current;
      if (remaining <= 0) return result;
      await new Promise<void>((resolve) => {
        const handle = timers.set(() => resolve(), Math.min(remaining, result.retryAfterMs + 1));
        this.#waiters.push(() => { timers.clear(handle); resolve(); });
      });
    }
  }

  #live(token: string, image: string, now: number): GroupClaim {
    this.#expire(now);
    const claim = this.#claim;
    if (claim === undefined || claim.token !== token || claim.image !== image) throw new TypeError(`stale or foreign ${this.group} claim`);
    return claim;
  }

  renew(token: string, image: string, now: number, leaseMs: number): void {
    const claim = this.#live(token, image, now);
    claim.leaseExpiresAtMonotonic = now + leaseMs;
  }

  settle(token: string, image: string, now: number, outcome: { readonly kind: "success" } | { readonly kind: "cancelled" } | { readonly kind: "failure"; readonly reason: ProviderFailureReason; readonly retryAfterMs?: number | null }): void {
    this.#live(token, image, now);
    this.#claim = undefined;
    if (outcome.kind === "success") {
      this.#sequence = 0;
    } else if (outcome.kind === "failure") {
      if (outcome.reason === "rate_limited") {
        const requested = typeof outcome.retryAfterMs === "number" && Number.isSafeInteger(outcome.retryAfterMs) && outcome.retryAfterMs > 0 ? outcome.retryAfterMs : 0;
        this.#blockedUntilMonotonic = Math.max(this.#blockedUntilMonotonic, now + Math.max(RATE_LIMIT_FLOOR_MS, requested));
      } else if (TRANSIENT_REASONS.has(outcome.reason)) {
        const delay = BACKOFF_SEQUENCE_MS[Math.min(this.#sequence, BACKOFF_SEQUENCE_MS.length - 1)]!;
        this.#sequence += 1;
        this.#blockedUntilMonotonic = Math.max(this.#blockedUntilMonotonic, now + delay);
      }
    }
    this.#wake();
  }

  /** Generation-set change: every claim over the old member image is void before admission. */
  invalidate(): void {
    this.#claim = undefined;
    this.#sequence = 0;
    this.#blockedUntilMonotonic = Number.NEGATIVE_INFINITY;
    this.#wake();
  }
}

// ---------------------------------------------------------------------------------------------
// Cache inventory (§7) — the registry never trusts a copied boolean
// ---------------------------------------------------------------------------------------------

export interface ProviderCacheInventory {
  /** Current-generation, unexpired exact entries at this monotonic sample. */
  validExactEntries(nowMonotonicMs: number, generation: string): number;
  /** Advances on insert, expiry, eviction, invalidation and generation cleanup. */
  revision(): number;
  /** Generation change: drop every entry naming another generation. */
  invalidateExcept(generation: string | null): void;
}

// ---------------------------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------------------------

export interface RegistryTimers {
  set(callback: () => void, delayMs: number): unknown;
  clear(handle: unknown): void;
}

const GLOBAL_TIMERS: RegistryTimers = Object.freeze({
  set: (callback: () => void, delayMs: number) => setTimeout(callback, Math.max(0, delayMs)),
  clear: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
});

export interface ProviderHealthLogEvent {
  readonly event: "provider_health_transition";
  readonly familyId: string;
  readonly instanceId: ProviderInstanceId;
  readonly generationPrefix: string | null;
  readonly previousState: ProviderHealthSnapshot["state"];
  readonly state: ProviderHealthSnapshot["state"];
  readonly reason: ProviderFailureReason | null;
  readonly operation: ApplicationProviderOperationId | "supervisor.lifecycle" | "operator.retry" | null;
  readonly durationMs: number | null;
  readonly retryAfterMs: number | null;
}

export interface ProviderRegistryOptions {
  readonly configured: readonly ProviderInstanceConfiguration[];
  /**
   * Whether the instance's current generation carries the launched-artifact capture the provider
   * exchange requires (Maia: the container identity). Absent means "captured".
   */
  readonly exchangeArtifact?: (instanceId: ProviderInstanceId) => boolean;
  readonly monotonicNowMs?: () => number;
  readonly wallNow?: () => string;
  readonly timers?: RegistryTimers;
  readonly log?: (event: ProviderHealthLogEvent) => void;
}

type Arm = "unverified" | "available" | "recovering" | "failed";

interface InstanceState {
  readonly config: ProviderInstanceConfiguration | null;
  supervisorStart: number;
  generation: string | null;
  arm: Arm;
  reason: ProviderFailureReason | null;
  checkedAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  transientOpens: number[];
  retryAtMonotonic: number | null;
  halfOpenToken: string | null;
}

/** An admission issued by the owning registry; single-use, bound to instance + generation. */
export interface ProviderTicket {
  readonly operation: ApplicationProviderOperationId;
  readonly instanceId: ProviderInstanceId;
  readonly generation: string;
  readonly admittedAtMonotonic: number;
  readonly deadlineMonotonic: number;
}

export type ProviderSettlement =
  | { readonly kind: "success" }
  | { readonly kind: "failure"; readonly reason: ProviderFailureReason; readonly retryAfterMs?: number | null }
  | { readonly kind: "cancelled"; readonly by: "caller" | "superseded" | "shutdown" };

interface TicketRecord {
  readonly registry: ProviderRegistry;
  readonly halfOpenToken: string | null;
  readonly group: { readonly coordinator: ProviderBackoffCoordinator; readonly token: string; readonly image: string } | null;
  settled: boolean;
}

/** The immutable snapshot `/capabilities`, selectors and release receipts read (§2, §13). */
export interface ProviderRegistrySnapshot extends ProviderHealthCapabilities {
  readonly revision: number;
}

interface SnapshotRecord {
  readonly registry: ProviderRegistry;
  readonly observedAtMonotonic: number;
  readonly projectionDigest: string;
}

export interface ProviderReleaseReceipt {
  readonly kind: "provider-release-receipt@1";
  readonly revision: number;
  readonly snapshotDigest: string;
  readonly generationImage: readonly { readonly instanceId: ProviderInstanceId; readonly implementation: ProviderImplementation; readonly generation: string }[];
  readonly generationImageDigest: string;
  readonly issuedAt: string;
}

export type ReleaseReceiptValidation = "valid" | "stale" | "forged";

/**
 * Exchange operation → the application operation whose instance actually serves it (bot policy D7).
 * The landed exchange runs every Stockfish operation, including the legal-root table, on the
 * `stockfish-analysis` process (apps/server/src/provider-operations.ts), so that is the instance
 * whose health gates it — not `stockfish-play` as the RFC's §8 row reads (changelog 2026-09-24).
 */
const EXCHANGE_TO_APPLICATION: Readonly<Record<ProviderOperationId, ApplicationProviderOperationId>> = Object.freeze({
  "maia.policy_page@1": "opponent.maia_inference",
  "stockfish.legal_root_table@1": "evidence.stockfish_analysis",
  "stockfish.position_evaluation@1": "evidence.stockfish_analysis",
  "stockfish.principal_variation@1": "evidence.stockfish_analysis",
  "syzygy.position@1": "evidence.tablebase_probe",
  "lichess_explorer.position_page@1": "evidence.explorer_query",
});

export class ProviderRegistry {
  readonly #instances = new Map<ProviderInstanceId, InstanceState>();
  readonly #coordinators = new Map<ProviderBackoffGroupId, ProviderBackoffCoordinator>();
  readonly #inventories = new Map<ProviderInstanceId, ProviderCacheInventory[]>();
  readonly #tickets = new WeakMap<object, TicketRecord>();
  readonly #snapshots = new WeakMap<object, SnapshotRecord>();
  readonly #receipts = new WeakSet<object>();
  readonly #generationListeners = new Set<(instanceId: ProviderInstanceId, generation: string | null) => void>();
  readonly #monotonic: () => number;
  readonly #wall: () => string;
  readonly #timers: RegistryTimers;
  readonly #log: ((event: ProviderHealthLogEvent) => void) | undefined;
  readonly #exchangeArtifact: (instanceId: ProviderInstanceId) => boolean;
  #revision = 0;
  #lastMonotonic = Number.NEGATIVE_INFINITY;
  #shutdown = false;

  constructor(options: ProviderRegistryOptions) {
    const configured = parseConfiguration(options.configured);
    this.#monotonic = options.monotonicNowMs ?? (() => performance.now());
    this.#wall = options.wallNow ?? (() => new Date().toISOString());
    this.#timers = options.timers ?? GLOBAL_TIMERS;
    this.#log = options.log;
    this.#exchangeArtifact = options.exchangeArtifact ?? (() => true);
    for (const declaration of PROVIDER_INSTANCE_DECLARATIONS) {
      const config = configured.get(declaration.instanceId) ?? null;
      const state: InstanceState = { config, supervisorStart: 0, generation: null, arm: "unverified", reason: null, checkedAt: null, lastSuccessAt: null, lastFailureAt: null, transientOpens: [], retryAtMonotonic: null, halfOpenToken: null };
      state.generation = config === null ? null : this.#deriveGeneration(config, 0);
      this.#instances.set(declaration.instanceId, state);
    }
    // Every configured non-null group contributes exactly one coordinator, owned by this registry.
    for (const group of PROVIDER_BACKOFF_GROUP_IDS) {
      if (providerBackoffGroupMembers(group).some((instanceId) => this.#instances.get(instanceId)!.config !== null)) {
        this.#coordinators.set(group, new ProviderBackoffCoordinator(group, this));
      }
    }
  }

  // ------------------------------------------------------------------ time

  #now(): number {
    const value = this.#monotonic();
    if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError("monotonic clock sample must be finite");
    this.#lastMonotonic = Math.max(this.#lastMonotonic, value);
    return this.#lastMonotonic;
  }

  #civil(): string {
    return this.#wall();
  }

  // ------------------------------------------------------------------ generation (§3)

  #deriveGeneration(config: ProviderInstanceConfiguration, supervisorStart: number): string {
    const declaration = providerInstanceDeclaration(config.instanceId);
    return digest({ instanceId: config.instanceId, familyId: declaration.familyId, implementation: config.implementation, endpoint: config.endpoint, identity: config.identity, options: config.options ?? {}, configRevision: config.configRevision ?? null, supervisorStart });
  }

  #changeGeneration(instanceId: ProviderInstanceId, state: InstanceState, supervisorStart: number): void {
    const next = this.#deriveGeneration(state.config!, supervisorStart);
    if (next === state.generation) throw new TypeError(`refusing an equal generation for ${instanceId}`);
    state.supervisorStart = supervisorStart;
    state.generation = next;
    state.transientOpens = [];
    state.retryAtMonotonic = null;
    state.halfOpenToken = null;
    const group = providerInstanceDeclaration(instanceId).backoffGroup;
    if (group !== null) this.#coordinators.get(group)?.invalidate();
    for (const inventory of this.#inventories.get(instanceId) ?? []) inventory.invalidateExcept(next);
    for (const listener of this.#generationListeners) listener(instanceId, next);
  }

  /** Current generation of an instance, or null when it is not configured. */
  generation(instanceId: ProviderInstanceId): string | null {
    return this.#instances.get(instanceId)!.generation;
  }

  onGenerationChange(listener: (instanceId: ProviderInstanceId, generation: string | null) => void): () => void {
    this.#generationListeners.add(listener);
    return () => this.#generationListeners.delete(listener);
  }

  registerCacheInventory(instanceId: ProviderInstanceId, inventory: ProviderCacheInventory): void {
    const rows = this.#inventories.get(instanceId) ?? [];
    rows.push(inventory);
    this.#inventories.set(instanceId, rows);
    this.#revision += 1;
  }

  // ------------------------------------------------------------------ projection

  #validEntries(instanceId: ProviderInstanceId, now: number): { readonly count: number; readonly revision: number } {
    const state = this.#instances.get(instanceId)!;
    if (state.generation === null) return { count: 0, revision: 0 };
    let count = 0;
    let revision = 0;
    for (const inventory of this.#inventories.get(instanceId) ?? []) {
      count += inventory.validExactEntries(now, state.generation);
      revision += inventory.revision();
    }
    return { count, revision };
  }

  #instanceSnapshot(instanceId: ProviderInstanceId, now: number): ProviderHealthSnapshot {
    const state = this.#instances.get(instanceId)!;
    const declaration = providerInstanceDeclaration(instanceId);
    if (state.config === null || state.generation === null) return Object.freeze({ instanceId, familyId: declaration.familyId, state: "not_configured" });
    const base = { instanceId, familyId: declaration.familyId, implementation: state.config.implementation, generation: state.generation };
    if (state.arm === "unverified" || state.checkedAt === null) return Object.freeze({ ...base, state: "unverified", retryAfterMs: null });
    const times = { checkedAt: state.checkedAt, lastSuccessAt: state.lastSuccessAt, lastFailureAt: state.lastFailureAt };
    if (state.arm === "available") return Object.freeze({ ...base, ...times, state: "available", reason: null });
    if (state.arm === "recovering") return Object.freeze({ ...base, ...times, state: "recovering", priorReason: state.reason ?? "network", consecutiveSuccesses: 1, requiredSuccesses: 2 });
    const reason = state.reason ?? "network";
    const retryAfterMs = state.retryAtMonotonic === null ? null : Math.max(0, Math.ceil(state.retryAtMonotonic - now));
    const cache = this.#validEntries(instanceId, now);
    if (cache.count > 0) return Object.freeze({ ...base, ...times, state: "degraded_cached_only", reason, retryAfterMs, cacheScope: "exact_request", validExactEntries: cache.count, cacheRevision: cache.revision });
    return Object.freeze({ ...base, ...times, state: "unavailable", reason, retryAfterMs, cacheScope: "none" });
  }

  #operationAvailability(operation: ApplicationProviderOperationId, now: number, snapshots: ReadonlyMap<ProviderInstanceId, ProviderHealthSnapshot>): ProviderOperationAvailability {
    const execution = applicationProviderExecution(operation);
    const snapshot = snapshots.get(execution.instanceId)!;
    const own = instanceOperationAvailability(snapshot);
    if (snapshot.state === "not_configured") return own;
    const group = providerInstanceDeclaration(execution.instanceId).backoffGroup;
    const coordinator = group === null ? undefined : this.#coordinators.get(group);
    const blocked = coordinator?.blockedFor(now) ?? 0;
    if (blocked > 0) return Object.freeze({ state: "temporarily_blocked", instanceIds: own.instanceIds, reason: "upstream_backoff", retryAfterMs: Math.ceil(blocked) });
    return own;
  }

  #project(now: number): Omit<ProviderRegistrySnapshot, "generatedAt" | "revision"> {
    const snapshots = new Map(PROVIDER_INSTANCE_IDS.map((instanceId) => [instanceId, this.#instanceSnapshot(instanceId, now)] as const));
    const operations = APPLICATION_PROVIDER_EXECUTION.map((row) => Object.freeze({ operation: row.operation, availability: this.#operationAvailability(row.operation, now, snapshots) }));
    const byOperation = new Map(operations.map((row) => [row.operation, row.availability] as const));
    const policyModes = RUN_OPPONENT_MODES.map((mode) => Object.freeze({ mode, availability: combineOperationAvailability(POLICY_MODE_OPERATIONS[mode].map((operation) => byOperation.get(operation)!)) }));
    return Object.freeze({ providers: Object.freeze([...snapshots.values()]), operations: Object.freeze(operations), policyModes: Object.freeze(policyModes) });
  }

  #projectionDigest(projection: Omit<ProviderRegistrySnapshot, "generatedAt" | "revision">): string {
    // Durations are rounded to whole seconds so an unchanged state is not a new projection each ms.
    return digest(JSON.parse(JSON.stringify(projection, (key, value: unknown) => key === "retryAfterMs" && typeof value === "number" ? Math.ceil(value / 1000) : value)));
  }

  /** One immutable, request-free snapshot. Reading it never calls a provider or refreshes `checkedAt`. */
  snapshot(): ProviderRegistrySnapshot {
    const now = this.#now();
    const projection = this.#project(now);
    const snapshot: ProviderRegistrySnapshot = Object.freeze({ generatedAt: this.#civil(), revision: this.#revision, ...projection });
    this.#snapshots.set(snapshot, { registry: this, observedAtMonotonic: now, projectionDigest: this.#projectionDigest(projection) });
    return snapshot;
  }

  /** The wire section of a snapshot (no revision), for `/capabilities`. */
  static wire(snapshot: ProviderRegistrySnapshot): ProviderHealthCapabilities {
    return Object.freeze({ generatedAt: snapshot.generatedAt, providers: snapshot.providers, operations: snapshot.operations, policyModes: snapshot.policyModes });
  }

  /**
   * Whether an issued snapshot is still authority: same registry, same revision, and the
   * time-derived projection at the current monotonic sample is unchanged. Equal read-only snapshots
   * are all valid together; validation never installs a new snapshot.
   */
  isCurrent(snapshot: ProviderRegistrySnapshot): boolean {
    const record = this.#snapshots.get(snapshot);
    if (record === undefined || record.registry !== this) return false;
    if (snapshot.revision !== this.#revision) return false;
    return this.#projectionDigest(this.#project(this.#now())) === record.projectionDigest;
  }

  operationAvailability(operation: ApplicationProviderOperationId, snapshot: ProviderRegistrySnapshot = this.snapshot()): ProviderOperationAvailability {
    if (!this.#snapshots.has(snapshot)) throw new TypeError("snapshot was not issued by this registry");
    return snapshot.operations.find((row) => row.operation === operation)!.availability;
  }

  /**
   * Availability for a provider-exchange operation (bot-policy D7 consumes Maia and the root table).
   * A healthy instance whose current generation lacks the exchange's launched-artifact capture (the
   * networked Maia sidecar without an injected container identity) cannot deliver: `protocol`.
   */
  exchangeOperationAvailability(operation: ProviderOperationId, snapshot: ProviderRegistrySnapshot = this.snapshot()): ProviderOperationAvailability {
    const application = EXCHANGE_TO_APPLICATION[operation];
    if (application === undefined) throw new TypeError(`No application operation gates ${String(operation)}`);
    const availability = this.operationAvailability(application, snapshot);
    const instanceId = applicationProviderExecution(application).instanceId;
    if (availability.state !== "unavailable" && availability.state !== "temporarily_blocked" && !this.#exchangeArtifact(instanceId)) {
      return Object.freeze({ state: "unavailable", instanceIds: availability.instanceIds, reason: "protocol" });
    }
    return availability;
  }

  /**
   * Settles one provider-exchange result produced by the shared scheduler. Only a sealed LIVE
   * delivery (checked by the exchange authority) heals; a retained-exact hit or a local-domain
   * answer never changes health. Failures open the serving instance's circuit, except an identity
   * refusal, which is the exchange's artifact gate rather than provider health.
   */
  settleExchange(result: TypedProviderResult): void {
    const application = EXCHANGE_TO_APPLICATION[result.operation];
    if (application === undefined) throw new TypeError(`No application operation serves ${String(result.operation)}`);
    const instanceId = applicationProviderExecution(application).instanceId;
    const state = this.#instances.get(instanceId)!;
    if (state.config === null) return;
    if (result.kind === "success") {
      assertProviderDelivery(result.operation, result.delivery);
      if (result.delivery.kind !== "live") return;
      this.#succeed(instanceId, state, application, null);
      return;
    }
    if (result.kind !== "source_failure") return;
    const http = providerInstanceDeclaration(instanceId).backoffGroup !== null;
    const reason: ProviderFailureReason | null = result.reason === "deadline_exceeded"
      ? "timeout"
      : result.reason === "invalid_response"
        ? "protocol"
        : result.reason === "provider_unavailable" && !/identity/iu.test(result.providerDetail ?? "")
          ? (http ? "network" : "process_exit")
          : null;
    if (reason !== null) this.#fail(instanceId, state, reason, null, application, null);
  }

  // ------------------------------------------------------------------ release receipt (§13)

  #generationImage(snapshot: ProviderRegistrySnapshot): ProviderReleaseReceipt["generationImage"] {
    return Object.freeze(snapshot.providers.flatMap((row) => row.state === "not_configured" ? [] : [Object.freeze({ instanceId: row.instanceId, implementation: row.implementation, generation: row.generation })]).sort((left, right) => left.instanceId.localeCompare(right.instanceId)));
  }

  /** Issues a release receipt over a current snapshot. A snapshot containing `local_fixture` is refused. */
  releaseReceipt(snapshot: ProviderRegistrySnapshot): ProviderReleaseReceipt {
    if (!this.isCurrent(snapshot)) throw new TypeError("release receipts require the issuing registry's current snapshot");
    const image = this.#generationImage(snapshot);
    const fixture = image.find((row) => row.implementation === "local_fixture");
    if (fixture !== undefined) throw new TypeError(`release receipt refused: ${fixture.instanceId} is a local_fixture`);
    const receipt: ProviderReleaseReceipt = Object.freeze({
      kind: "provider-release-receipt@1",
      revision: snapshot.revision,
      snapshotDigest: this.#snapshots.get(snapshot)!.projectionDigest,
      generationImage: image,
      generationImageDigest: digest(image),
      issuedAt: this.#civil(),
    });
    this.#receipts.add(receipt);
    return receipt;
  }

  validateReleaseReceipt(receipt: ProviderReleaseReceipt): ReleaseReceiptValidation {
    if (!this.#receipts.has(receipt)) return "forged";
    if (receipt.revision !== this.#revision) return "stale";
    const current = this.#generationImage(this.snapshot());
    return digest(current) === receipt.generationImageDigest ? "valid" : "stale";
  }

  // ------------------------------------------------------------------ admission and settlement (§5, §6)

  /**
   * Admits one live request for `operation`, or throws the typed unavailable outcome. Grouped
   * instances also acquire their group's single-flight claim, waiting FIFO within the deadline.
   */
  async admit(operation: ApplicationProviderOperationId, options: { readonly deadlineMonotonic?: number; readonly operatorRetry?: boolean } = {}): Promise<ProviderTicket> {
    const execution = applicationProviderExecution(operation);
    const now = this.#now();
    const deadline = options.deadlineMonotonic ?? now + execution.consumerBudgetMs;
    const state = this.#instances.get(execution.instanceId)!;
    const refuse = (message?: string): never => {
      const snapshot = this.snapshot();
      const availability = snapshot.operations.find((row) => row.operation === operation)!.availability;
      const instance = snapshot.providers.find((row) => row.instanceId === execution.instanceId)!;
      const retry = availability.state === "temporarily_blocked" ? availability.retryAfterMs : "retryAfterMs" in instance ? instance.retryAfterMs : null;
      throw new ProviderUnavailableError(operation, availability, retry, message);
    };
    if (this.#shutdown) refuse("the server is shutting down");
    if (state.config === null || state.generation === null) refuse();
    let halfOpenToken: string | null = null;
    if (state.arm === "failed") {
      if (state.retryAtMonotonic === null && options.operatorRetry !== true) refuse();
      if (state.retryAtMonotonic !== null && now < state.retryAtMonotonic) refuse();
      if (state.halfOpenToken !== null) refuse("a recovery request is already in flight");
      halfOpenToken = randomUUID();
      state.halfOpenToken = halfOpenToken;
    }
    const groupId = providerInstanceDeclaration(execution.instanceId).backoffGroup;
    let group: TicketRecord["group"] = null;
    if (groupId !== null) {
      const coordinator = this.#coordinators.get(groupId)!;
      const image = this.#groupImage(groupId);
      const acquired = await coordinator.acquireWithin(() => this.#now(), image, deadline, this.#timers);
      if (acquired.kind !== "claim") {
        if (halfOpenToken !== null && state.halfOpenToken === halfOpenToken) state.halfOpenToken = null;
        const availability: ProviderOperationAvailability = Object.freeze({ state: "temporarily_blocked", instanceIds: Object.freeze([execution.instanceId]), reason: acquired.kind === "blocked" ? "upstream_backoff" : "group_claimed", retryAfterMs: Math.ceil(acquired.retryAfterMs) });
        throw new ProviderUnavailableError(operation, availability, Math.ceil(acquired.retryAfterMs));
      }
      if (state.generation !== null && image !== this.#groupImage(groupId)) {
        coordinator.settle(acquired.token, acquired.image, this.#now(), { kind: "cancelled" });
        refuse("the provider generation changed during admission");
      }
      group = Object.freeze({ coordinator, token: acquired.token, image: acquired.image });
    }
    const ticket: ProviderTicket = Object.freeze({ operation, instanceId: execution.instanceId, generation: state.generation!, admittedAtMonotonic: now, deadlineMonotonic: deadline });
    this.#tickets.set(ticket, { registry: this, halfOpenToken, group, settled: false });
    return ticket;
  }

  #groupImage(group: ProviderBackoffGroupId): string {
    return digest(providerBackoffGroupMembers(group).map((instanceId) => {
      const state = this.#instances.get(instanceId)!;
      return { instanceId, implementation: state.config?.implementation ?? null, generation: state.generation };
    }));
  }

  /** Whether a ticket still names its instance's current generation (late results are discarded). */
  isCurrentTicket(ticket: ProviderTicket): boolean {
    const record = this.#tickets.get(ticket);
    return record !== undefined && record.registry === this && this.#instances.get(ticket.instanceId)!.generation === ticket.generation;
  }

  /** Settles one admitted request. Only a registry-issued current-generation ticket changes state. */
  settle(ticket: ProviderTicket, outcome: ProviderSettlement): { readonly current: boolean } {
    const record = this.#tickets.get(ticket);
    if (record === undefined || record.registry !== this) throw new TypeError("settlement requires a ticket issued by this registry");
    if (record.settled) throw new TypeError("a provider ticket settles once");
    record.settled = true;
    const now = this.#now();
    const state = this.#instances.get(ticket.instanceId)!;
    const current = state.generation === ticket.generation;
    if (record.group !== null) {
      try {
        record.group.coordinator.settle(record.group.token, record.group.image, now, !current || outcome.kind === "cancelled" ? { kind: "cancelled" } : outcome);
      } catch {
        // A lease that expired or was invalidated by a generation change cannot clear a successor.
      }
    }
    if (record.halfOpenToken !== null && state.halfOpenToken === record.halfOpenToken) state.halfOpenToken = null;
    if (!current) return Object.freeze({ current: false });
    if (outcome.kind === "cancelled") {
      if (outcome.by === "shutdown") this.#fail(ticket.instanceId, state, "cancelled_by_shutdown", null, ticket.operation, now - ticket.admittedAtMonotonic);
      return Object.freeze({ current: true });
    }
    if (outcome.kind === "success") this.#succeed(ticket.instanceId, state, ticket.operation, now - ticket.admittedAtMonotonic);
    else this.#fail(ticket.instanceId, state, outcome.reason, outcome.retryAfterMs ?? null, ticket.operation, now - ticket.admittedAtMonotonic);
    return Object.freeze({ current: true });
  }

  #transition(instanceId: ProviderInstanceId, mutate: () => void, operation: ProviderHealthLogEvent["operation"], durationMs: number | null): void {
    const now = this.#now();
    const before = this.#instanceSnapshot(instanceId, now);
    mutate();
    this.#revision += 1;
    const after = this.#instanceSnapshot(instanceId, now);
    if (this.#log !== undefined && (before.state !== after.state || ("reason" in after && "reason" in before && before.reason !== after.reason))) {
      const reason = after.state === "unavailable" || after.state === "degraded_cached_only" ? after.reason : null;
      this.#log(Object.freeze({
        event: "provider_health_transition",
        familyId: after.familyId,
        instanceId,
        generationPrefix: after.state === "not_configured" ? null : after.generation.slice(0, 19),
        previousState: before.state,
        state: after.state,
        reason,
        operation,
        durationMs: durationMs === null ? null : Math.round(durationMs),
        retryAfterMs: "retryAfterMs" in after ? after.retryAfterMs : null,
      }));
    }
  }

  #succeed(instanceId: ProviderInstanceId, state: InstanceState, operation: ProviderHealthLogEvent["operation"], durationMs: number | null): void {
    this.#transition(instanceId, () => {
      const now = this.#now();
      state.transientOpens = state.transientOpens.filter((openedAt) => now - openedAt < REPEAT_OPEN_WINDOW_MS);
      const at = this.#civil();
      if (state.arm === "failed" && state.transientOpens.length >= 2) {
        state.arm = "recovering";
      } else {
        state.arm = "available";
        state.reason = null;
      }
      state.retryAtMonotonic = null;
      state.checkedAt = at;
      state.lastSuccessAt = at;
    }, operation, durationMs);
  }

  #fail(instanceId: ProviderInstanceId, state: InstanceState, reason: ProviderFailureReason, retryAfterMs: number | null, operation: ProviderHealthLogEvent["operation"], durationMs: number | null): void {
    this.#transition(instanceId, () => {
      const now = this.#now();
      state.transientOpens = state.transientOpens.filter((openedAt) => now - openedAt < REPEAT_OPEN_WINDOW_MS);
      if (TRANSIENT_REASONS.has(reason)) state.transientOpens.push(now);
      const at = this.#civil();
      state.arm = "failed";
      state.reason = reason;
      state.checkedAt = at;
      state.lastFailureAt = at;
      if (reason === "authentication" || reason === "protocol" || reason === "cancelled_by_shutdown") {
        state.retryAtMonotonic = null;
      } else if (reason === "rate_limited") {
        const requested = typeof retryAfterMs === "number" && retryAfterMs > 0 ? retryAfterMs : 0;
        state.retryAtMonotonic = now + Math.max(RATE_LIMIT_FLOOR_MS, requested);
      } else if (reason === "process_exit" || reason === "startup") {
        state.retryAtMonotonic = now + PROCESS_RETRY_MS;
      } else {
        const delay = BACKOFF_SEQUENCE_MS[Math.min(Math.max(0, state.transientOpens.length - 1), BACKOFF_SEQUENCE_MS.length - 1)]!;
        state.retryAtMonotonic = now + delay;
      }
    }, operation, durationMs);
  }

  // ------------------------------------------------------------------ supervised UCI lifecycle

  /**
   * The engine-supervisor lifecycle sink. A spawn is a new supervisor generation (unavailable:
   * startup until handshake); a completed `uci`/`isready` handshake is a real protocol success;
   * an exit or failed handshake opens the circuit immediately.
   */
  engineLifecycleSink(engineIds: Readonly<Record<string, ProviderInstanceId>>): (event: EngineLifecycleEvent) => void {
    return (event) => {
      const instanceId = engineIds[event.engineId];
      if (instanceId === undefined) return;
      const state = this.#instances.get(instanceId)!;
      if (state.config === null) return;
      if (event.kind === "starting") {
        this.#transition(instanceId, () => {
          this.#changeGeneration(instanceId, state, state.supervisorStart + 1);
          const at = this.#civil();
          state.arm = "failed";
          state.reason = "startup";
          state.checkedAt = at;
          state.retryAtMonotonic = null;
        }, "supervisor.lifecycle", null);
      } else if (event.kind === "ready") {
        this.#succeed(instanceId, state, "supervisor.lifecycle", null);
      } else {
        this.#fail(instanceId, state, event.reason, null, "supervisor.lifecycle", null);
      }
    };
  }

  /** A completed local handshake for a process-local instance (mock/fixture deployments). */
  recordHandshake(instanceId: ProviderInstanceId): void {
    const state = this.#instances.get(instanceId)!;
    if (state.config === null) throw new TypeError(`${instanceId} is not configured`);
    this.#succeed(instanceId, state, "supervisor.lifecycle", null);
  }

  /** Server shutdown: outstanding and later work is `cancelled_by_shutdown`, with no restart storm. */
  shutdown(): void {
    this.#shutdown = true;
  }

  /** Runs one admitted request under one deadline: admit → execute → settle, typed on refusal. */
  async run<T>(
    operation: ApplicationProviderOperationId,
    execute: (context: { readonly signal: AbortSignal; readonly remainingMs: number; readonly ticket: ProviderTicket }) => Promise<T>,
    classify: (error: unknown) => ProviderSettlement,
    options: { readonly deadlineMonotonic?: number; readonly signal?: AbortSignal } = {},
  ): Promise<T> {
    if (options.signal?.aborted === true) throw Object.assign(new Error("the caller cancelled before admission"), { name: "AbortError" });
    const ticket = await this.admit(operation, options.deadlineMonotonic === undefined ? {} : { deadlineMonotonic: options.deadlineMonotonic });
    const remaining = Math.floor(ticket.deadlineMonotonic - this.#now());
    if (remaining <= 0) {
      this.settle(ticket, { kind: "cancelled", by: "superseded" });
      throw new ProviderUnavailableError(operation, Object.freeze({ state: "unavailable", instanceIds: Object.freeze([ticket.instanceId]), reason: "timeout" }), null, "the operation deadline was consumed before the provider could be asked");
    }
    const controller = new AbortController();
    let timedOut = false;
    const timer = this.#timers.set(() => { timedOut = true; controller.abort(); }, remaining);
    const onCallerAbort = (): void => controller.abort();
    options.signal?.addEventListener("abort", onCallerAbort, { once: true });
    try {
      const value = await execute({ signal: controller.signal, remainingMs: remaining, ticket });
      if (timedOut) throw Object.assign(new Error("provider deadline exceeded"), { name: "TimeoutError" });
      const settled = this.settle(ticket, { kind: "success" });
      if (!settled.current) throw new ProviderUnavailableError(operation, Object.freeze({ state: "unavailable", instanceIds: Object.freeze([ticket.instanceId]), reason: "process_exit" }), null, "a late result from a replaced provider generation was discarded");
      return value;
    } catch (error) {
      if (error instanceof ProviderUnavailableError) throw error;
      const outcome: ProviderSettlement = timedOut
        ? { kind: "failure", reason: "timeout" }
        : callerAborted(options.signal)
          ? { kind: "cancelled", by: "caller" }
          : classify(error);
      const record = this.#tickets.get(ticket);
      if (record !== undefined && !record.settled) this.settle(ticket, outcome);
      if (outcome.kind === "failure") {
        const availability = this.operationAvailability(operation);
        throw new ProviderUnavailableError(operation, availability.state === "available" || availability.state === "requestable_unverified" ? Object.freeze({ state: "unavailable", instanceIds: Object.freeze([ticket.instanceId]), reason: outcome.reason }) : availability, outcome.retryAfterMs ?? null, `Provider operation ${operation} failed: ${outcome.reason}`);
      }
      throw error;
    } finally {
      this.#timers.clear(timer);
      options.signal?.removeEventListener("abort", onCallerAbort);
    }
  }

  /** A monotonic deadline for one application operation (queue, retry and fallback share it). */
  deadline(operation: ApplicationProviderOperationId): number {
    return this.#now() + applicationProviderExecution(operation).consumerBudgetMs;
  }

  monotonicNow(): number {
    return this.#now();
  }

  /** Test/inspection: the coordinator for a group, only from its owning registry. */
  coordinator(group: ProviderBackoffGroupId): ProviderBackoffCoordinator | undefined {
    return this.#coordinators.get(group);
  }
}

function callerAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted === true;
}

export type EngineLifecycleEvent =
  | { readonly engineId: string; readonly kind: "starting" }
  | { readonly engineId: string; readonly kind: "ready" }
  | { readonly engineId: string; readonly kind: "failed"; readonly reason: "startup" | "process_exit" | "cancelled_by_shutdown" };

// ---------------------------------------------------------------------------------------------
// Failure classification shared by the adapters
// ---------------------------------------------------------------------------------------------

/** Classifies an HTTP status the way §5/§6 require. */
export function classifyHttpStatus(status: number, retryAfterHeader: string | null = null): ProviderSettlement {
  if (status === 429) {
    const seconds = retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader);
    return { kind: "failure", reason: "rate_limited", retryAfterMs: Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1000) : null };
  }
  if (status === 401 || status === 403) return { kind: "failure", reason: "authentication" };
  if (status >= 500) return { kind: "failure", reason: status === 503 ? "overloaded" : "network" };
  return { kind: "failure", reason: "protocol" };
}

/** An HTTP provider error that carries its status and Retry-After, so classification is typed. */
export class ProviderHttpError extends Error {
  constructor(readonly status: number, readonly retryAfter: string | null, message: string) {
    super(message);
    this.name = "ProviderHttpError";
  }
}

export function classifyProviderError(error: unknown): ProviderSettlement {
  if (error instanceof ProviderHttpError) return classifyHttpStatus(error.status, error.retryAfter);
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) return { kind: "failure", reason: "timeout" };
  if (error instanceof SyntaxError) return { kind: "failure", reason: "protocol" };
  if (error instanceof TypeError && /fetch failed|network|ECONN|ENOTFOUND/iu.test(error.message)) return { kind: "failure", reason: "network" };
  if (error instanceof Error && /response must be|invalid/iu.test(error.message)) return { kind: "failure", reason: "protocol" };
  return { kind: "failure", reason: "network" };
}
