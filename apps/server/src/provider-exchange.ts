/**
 * The one bounded provider-exchange scheduler (rfc/provider-exchange-and-execution.md §4).
 *
 * Stockfish, Maia, Syzygy and Explorer all enter through `ProviderExchangeScheduler.get`. The
 * scheduler owns request normalization/hashing, the closed local preflight, retained lookup,
 * exact-key pending joins, the bounded new-job queue, per-waiter deadlines and cancellation,
 * receipt construction (through the runtime's scheduler-only authority), failure normalization
 * and bounded, non-refreshing retention. Descriptors return only same-exchange captures.
 *
 * Time has two independent authorities: `monotonicNowMs` alone drives deadlines, TTL and eviction;
 * `wallNow` alone populates `requestedAt`/`retrievedAt`/`servedAt`/`failedAt`/`observedAt`. There is
 * no hidden wall-clock or timer-clock read here or in the five descriptors (census-enforced).
 */
import {
  PROVIDER_OPERATION_IDS,
  ProviderIdentityMismatch,
  ProviderRequestInvalid,
  ProviderResponseInvalid,
  isCanonicalUtcIso,
  normalizedProviderRequestDigest,
  pendingKeyOf,
  providerOf,
  type ProviderAcquisitionReceipt,
  type ProviderExecutionCapture,
  type ProviderOperationId,
  type ProviderOperationLocalResultMap,
  type ProviderOperationProviderMap,
  type ProviderOperationRequestMap,
  type ProviderOperationResultMap,
  type ProviderPendingDigest,
  type ProviderRequestDigest,
  type ProviderRequestedIdentityMap,
  type ProviderSourceFailure,
  type ProviderSourceFailureReason,
  type TypedProviderRequest,
  type TypedProviderResult,
} from "@chess-tabiya/runtime";
import { PROVIDER_EXCHANGE_AUTHORITY } from "@chess-tabiya/runtime/provider-exchange-authority";

export interface ProviderRequestScope {
  readonly id: string;
  readonly budgetMs: number;
}

export interface ProviderExecutionContext {
  readonly signal: AbortSignal;
  readonly remainingMs: number;
  readonly requestedAt: string;
}

export interface ProviderOperationDescriptor<K extends ProviderOperationId> {
  readonly operation: K;
  readonly provider: ProviderOperationProviderMap[K];
  normalizeRequest(request: ProviderOperationRequestMap[K]): ProviderRequestedIdentityMap[K];
  preflight(requestedIdentity: ProviderRequestedIdentityMap[K]): ProviderOperationLocalResultMap[K] | null;
  execute(requestedIdentity: ProviderRequestedIdentityMap[K], context: ProviderExecutionContext): Promise<ProviderExecutionCapture<K>>;
  retainedWeight(payload: ProviderOperationResultMap[K]): number;
  admitRetained(acquisition: ProviderAcquisitionReceipt<K>): boolean;
}

export type ProviderOperationDescriptors = { readonly [K in ProviderOperationId]: ProviderOperationDescriptor<K> };

/** A descriptor's typed refusal to produce a capture (transport, authorization, model failure…). */
export class ProviderSourceUnavailable extends Error {
  constructor(readonly reason: Exclude<ProviderSourceFailureReason, "queue_full" | "cancelled">, readonly providerDetail?: string) {
    super(providerDetail ?? reason);
    this.name = "ProviderSourceUnavailable";
  }
}

export interface ProviderTimers {
  set(callback: () => void, delayMs: number): unknown;
  clear(handle: unknown): void;
}

const GLOBAL_TIMERS: ProviderTimers = Object.freeze({
  set: (callback: () => void, delayMs: number) => setTimeout(callback, Math.max(0, delayMs)),
  clear: (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
});

export interface ProviderExchangeSchedulerOptions {
  readonly descriptors: ProviderOperationDescriptors;
  readonly maxActive: number;
  readonly maxQueued: number;
  readonly maxRetainedEntries: number;
  readonly maxRetainedWeight: number;
  readonly retentionTtlMs: number;
  readonly monotonicNowMs: () => number;
  readonly wallNow: () => string;
  readonly timers?: ProviderTimers;
}

interface Waiter {
  readonly resolve: (result: TypedProviderResult) => void;
  readonly reject: (error: Error) => void;
  deadlineHandle: unknown;
  readonly deadline: number;
  signal: AbortSignal;
  onAbort: () => void;
  settled: boolean;
}

interface Job {
  readonly key: ProviderPendingDigest;
  readonly operation: ProviderOperationId;
  readonly requestedIdentity: ProviderRequestedIdentityMap[ProviderOperationId];
  readonly digest: ProviderRequestDigest;
  readonly requestedAt: string;
  readonly executionDeadline: number;
  readonly controller: AbortController;
  readonly waiters: Set<Waiter>;
  state: "queued" | "active" | "done";
  executionHandle: unknown;
  release: (() => void) | undefined;
}

interface RetainedEntry {
  readonly key: ProviderPendingDigest;
  readonly acquisition: ProviderAcquisitionReceipt;
  readonly payload: unknown;
  readonly payloadReceipt: unknown;
  readonly weight: number;
  readonly retainedAtMonotonic: number;
  lastServedAtMonotonic: number;
  readonly expiresAtMonotonic: number;
}

function positiveSafe(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${label} must be a positive safe integer`);
  return value;
}

export class ProviderExchangeScheduler {
  readonly #descriptors: ProviderOperationDescriptors;
  readonly #maxActive: number;
  readonly #maxQueued: number;
  readonly #maxRetainedEntries: number;
  readonly #maxRetainedWeight: number;
  readonly #retentionTtlMs: number;
  readonly #monotonic: () => number;
  readonly #wall: () => string;
  readonly #timers: ProviderTimers;
  readonly #pending = new Map<ProviderPendingDigest, Job>();
  readonly #queue: Job[] = [];
  readonly #retained = new Map<ProviderPendingDigest, RetainedEntry>();
  readonly #retainedRevisions = new Map<ProviderOperationId, number>();
  #active = 0;
  #lastMonotonic = Number.NEGATIVE_INFINITY;

  constructor(options: ProviderExchangeSchedulerOptions) {
    this.#maxActive = positiveSafe(options.maxActive, "maxActive");
    this.#maxQueued = positiveSafe(options.maxQueued, "maxQueued");
    this.#maxRetainedEntries = positiveSafe(options.maxRetainedEntries, "maxRetainedEntries");
    this.#maxRetainedWeight = positiveSafe(options.maxRetainedWeight, "maxRetainedWeight");
    this.#retentionTtlMs = positiveSafe(options.retentionTtlMs, "retentionTtlMs");
    if (typeof options.monotonicNowMs !== "function" || typeof options.wallNow !== "function") throw new TypeError("the scheduler requires explicit monotonic and wall clocks");
    this.#monotonic = options.monotonicNowMs;
    this.#wall = options.wallNow;
    this.#timers = options.timers ?? GLOBAL_TIMERS;
    const keys = Object.keys(options.descriptors).sort();
    const expected = [...PROVIDER_OPERATION_IDS].sort();
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) throw new TypeError(`descriptors must be exactly ${expected.join(", ")}`);
    for (const operation of PROVIDER_OPERATION_IDS) {
      const descriptor = options.descriptors[operation] as ProviderOperationDescriptor<ProviderOperationId>;
      if (descriptor.operation !== operation || descriptor.provider !== providerOf(operation)) throw new TypeError(`descriptor for ${operation} names ${descriptor.operation}/${descriptor.provider}`);
    }
    this.#descriptors = options.descriptors;
  }

  #now(): number {
    const value = this.#monotonic();
    if (typeof value !== "number" || !Number.isFinite(value) || value < this.#lastMonotonic) throw new TypeError("monotonic clock sample must be finite and non-decreasing");
    this.#lastMonotonic = value;
    return value;
  }

  #civil(): string {
    const value = this.#wall();
    if (!isCanonicalUtcIso(value)) throw new TypeError("wall clock sample must be a canonical UTC ISO timestamp");
    return value;
  }

  #descriptor<K extends ProviderOperationId>(operation: K): ProviderOperationDescriptor<K> {
    const descriptor = (this.#descriptors as Readonly<Record<string, unknown>>)[operation];
    if (descriptor === undefined || !PROVIDER_OPERATION_IDS.includes(operation)) throw new ProviderRequestInvalid(`Unknown provider operation ${String(operation)}`);
    return descriptor as ProviderOperationDescriptor<K>;
  }

  /** The only caller-visible request-digest authority, byte-equal to every result `get` returns. */
  normalizedRequestDigest<K extends ProviderOperationId>(request: TypedProviderRequest<K>): ProviderRequestDigest {
    const operation = request.operation as K;
    const descriptor = this.#descriptor(operation);
    return normalizedProviderRequestDigest(operation, descriptor.normalizeRequest(request.request as ProviderOperationRequestMap[K]));
  }

  /** Observability for tests and capacity reporting; never a cache probe. */
  stats(): { readonly active: number; readonly queued: number; readonly pending: number; readonly retained: number; readonly retainedWeight: number } {
    return Object.freeze({ active: this.#active, queued: this.#queue.length, pending: this.#pending.size, retained: this.#retained.size, retainedWeight: [...this.#retained.values()].reduce((sum, entry) => sum + entry.weight, 0) });
  }

  /** Health inventory only: no request keys, payloads or acquisition door leave the scheduler. */
  retainedInventory(operation: ProviderOperationId): {
    validExactEntries(nowMonotonicMs: number, generation: string): number;
    revision(): number;
    invalidateExcept(generation: string | null): void;
  } {
    this.#descriptor(operation);
    return Object.freeze({
      validExactEntries: (now: number, _generation: string): number => {
        const descriptor = this.#descriptor(operation);
        let count = 0;
        for (const [key, entry] of this.#retained) {
          if (entry.acquisition.operation !== operation) continue;
          if (now >= entry.expiresAtMonotonic || !descriptor.admitRetained(entry.acquisition as never)) this.#removeRetained(key);
          else count += 1;
        }
        return count;
      },
      revision: () => this.#retainedRevisions.get(operation) ?? 0,
      // The registry invokes this on a generation transition. Conservatively retire the entire
      // operation population; an acquisition from the old configured endpoint cannot survive it.
      invalidateExcept: (_generation: string | null): void => {
        for (const [key, entry] of this.#retained) if (entry.acquisition.operation === operation) this.#removeRetained(key);
      },
    });
  }

  #removeRetained(key: ProviderPendingDigest): void {
    const entry = this.#retained.get(key);
    if (entry === undefined) return;
    this.#retained.delete(key);
    const operation = entry.acquisition.operation;
    this.#retainedRevisions.set(operation, (this.#retainedRevisions.get(operation) ?? 0) + 1);
  }

  async get<K extends ProviderOperationId>(request: TypedProviderRequest<K>, scope: ProviderRequestScope, signal: AbortSignal): Promise<TypedProviderResult<K>> {
    if (typeof scope !== "object" || scope === null || typeof scope.id !== "string" || scope.id === "") throw new ProviderRequestInvalid("scope.id must be a non-empty string");
    if (!Number.isSafeInteger(scope.budgetMs) || scope.budgetMs < 1) throw new ProviderRequestInvalid("scope.budgetMs must be a positive safe integer");
    const arrival = this.#now();
    const requestedAt = this.#civil();
    const operation = request.operation as K;
    const descriptor = this.#descriptor(operation);
    const requestedIdentity = descriptor.normalizeRequest(request.request as ProviderOperationRequestMap[K]);
    const digest = normalizedProviderRequestDigest(operation, requestedIdentity);
    const local = descriptor.preflight(requestedIdentity);
    if (local !== null) {
      if (operation !== "syzygy.position@1") return this.#failure(operation, digest, "identity_mismatch", "only Syzygy has a local-domain result") as TypedProviderResult<K>;
      return PROVIDER_EXCHANGE_AUTHORITY.makeProviderLocalDomainResult(requestedIdentity as ProviderRequestedIdentityMap["syzygy.position@1"], this.#civil()) as unknown as TypedProviderResult<K>;
    }
    if (signal.aborted) return this.#failure(operation, digest, "cancelled") as TypedProviderResult<K>;
    const key = pendingKeyOf({ operation, normalizedRequestDigest: digest });

    const retained = this.#retained.get(key);
    if (retained !== undefined) {
      const now = this.#now();
      if (now >= retained.expiresAtMonotonic || !descriptor.admitRetained(retained.acquisition as ProviderAcquisitionReceipt<K>)) {
        this.#removeRetained(key);
      } else {
        retained.lastServedAtMonotonic = now;
        const delivery = PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "retained_exact", acquisition: retained.acquisition as ProviderAcquisitionReceipt<K>, payload: retained.payload as ProviderOperationResultMap[K], payloadReceipt: retained.payloadReceipt as never, servedAt: this.#civil() });
        return Object.freeze({ kind: "success", operation, normalizedRequestDigest: digest, delivery }) as unknown as TypedProviderResult<K>;
      }
    }

    let job = this.#pending.get(key);
    if (job === undefined) {
      if (this.#active >= this.#maxActive && this.#queue.length >= this.#maxQueued) return this.#failure(operation, digest, "queue_full") as TypedProviderResult<K>;
      const timeoutMs = (requestedIdentity.request as { readonly timeoutMs: number }).timeoutMs;
      job = {
        key,
        operation,
        requestedIdentity,
        digest,
        requestedAt,
        executionDeadline: arrival + timeoutMs,
        controller: new AbortController(),
        waiters: new Set(),
        state: "queued",
        executionHandle: undefined,
        release: undefined,
      };
      this.#pending.set(key, job);
      this.#queue.push(job);
    }
    const joined = job;
    const result = new Promise<TypedProviderResult>((resolve, reject) => {
      const deadline = arrival + scope.budgetMs;
      const waiter: Waiter = { resolve, reject, deadlineHandle: undefined, deadline, signal, onAbort: () => undefined, settled: false };
      waiter.onAbort = () => this.#settleWaiter(joined, waiter, this.#failure(operation, digest, "cancelled") as TypedProviderResult);
      signal.addEventListener("abort", waiter.onAbort, { once: true });
      const arm = (delayMs: number): void => {
        waiter.deadlineHandle = this.#timers.set(() => {
          if (waiter.settled) return;
          let now: number;
          try {
            now = this.#now();
          } catch {
            now = deadline; // a refused clock sample can only end the wait, never extend it
          }
          if (now < deadline) arm(deadline - now);
          else this.#settleWaiter(joined, waiter, this.#failure(operation, digest, "deadline_exceeded") as TypedProviderResult);
        }, delayMs);
      };
      joined.waiters.add(waiter);
      arm(scope.budgetMs);
    });
    this.#drain();
    return result as Promise<TypedProviderResult<K>>;
  }

  #failure<K extends ProviderOperationId>(operation: K, digest: ProviderRequestDigest, reason: ProviderSourceFailureReason, providerDetail?: string): ProviderSourceFailure<K> {
    return Object.freeze({ kind: "source_failure", operation, normalizedRequestDigest: digest, failedAt: this.#civil(), reason, ...(providerDetail === undefined ? {} : { providerDetail }) }) as ProviderSourceFailure<K>;
  }

  #settleWaiter(job: Job, waiter: Waiter, result: TypedProviderResult): void {
    if (waiter.settled) return;
    waiter.settled = true;
    this.#timers.clear(waiter.deadlineHandle);
    waiter.signal.removeEventListener("abort", waiter.onAbort);
    job.waiters.delete(waiter);
    waiter.resolve(result);
    // Shared work is aborted only after its final waiter detaches.
    if (job.waiters.size === 0 && job.state !== "done") this.#abandon(job);
  }

  #abandon(job: Job): void {
    if (job.state === "queued") {
      const index = this.#queue.indexOf(job);
      if (index >= 0) this.#queue.splice(index, 1);
    }
    job.state = "done";
    job.controller.abort();
    this.#timers.clear(job.executionHandle);
    if (this.#pending.get(job.key) === job) this.#pending.delete(job.key);
    // A logical scheduler lease ends at abandonment, not when an uncooperative transport
    // eventually acknowledges abort. The descriptor still owns its actual I/O cancellation.
    job.release?.();
  }

  #settleAll(job: Job, result: (waiter: Waiter) => TypedProviderResult): void {
    for (const waiter of [...job.waiters]) {
      if (waiter.settled) continue;
      waiter.settled = true;
      this.#timers.clear(waiter.deadlineHandle);
      waiter.signal.removeEventListener("abort", waiter.onAbort);
      waiter.resolve(result(waiter));
    }
    job.waiters.clear();
  }

  #drain(): void {
    while (this.#active < this.#maxActive && this.#queue.length > 0) {
      const job = this.#queue.shift()!;
      if (job.state !== "queued") continue;
      this.#start(job);
    }
  }

  #start(job: Job): void {
    job.state = "active";
    this.#active += 1;
    const remaining = job.executionDeadline - this.#now();
    const descriptor = this.#descriptor(job.operation);
    let released = false;
    const finish = (): void => {
      if (released) return;
      released = true;
      this.#timers.clear(job.executionHandle);
      this.#active -= 1;
      job.state = "done";
      if (this.#pending.get(job.key) === job) this.#pending.delete(job.key);
      this.#drain();
    };
    job.release = finish;
    const expire = (): void => {
      if (job.state !== "active") return;
      job.controller.abort();
      this.#settleAll(job, () => this.#failure(job.operation, job.digest, "deadline_exceeded"));
      finish();
    };
    const liveAt = (): number | undefined => {
      if (job.state !== "active" || job.waiters.size === 0) return undefined;
      let now: number;
      try { now = this.#now(); } catch { expire(); return undefined; }
      // Timers are wake-ups, not time authority: a delayed event loop cannot admit a source
      // after either deadline, and a short waiter cannot receive its sibling's later success.
      for (const waiter of [...job.waiters]) {
        if (now >= waiter.deadline) this.#settleWaiter(job, waiter, this.#failure(job.operation, job.digest, "deadline_exceeded"));
      }
      if (job.state !== "active") return undefined;
      if (now >= job.executionDeadline) { expire(); return undefined; }
      return now;
    };
    if (remaining <= 0) {
      // Queue time consumed the first arrival's execution timeout.
      this.#settleAll(job, () => this.#failure(job.operation, job.digest, "deadline_exceeded", "queued past the execution timeout"));
      finish();
      return;
    }
    const armExecution = (delayMs: number): void => {
      job.executionHandle = this.#timers.set(() => {
        const now = liveAt();
        if (now !== undefined) armExecution(job.executionDeadline - now);
      }, delayMs);
    };
    const dispatchAt = liveAt();
    if (dispatchAt === undefined) return;
    const dispatchRemaining = job.executionDeadline - dispatchAt;
    armExecution(dispatchRemaining);
    const context: ProviderExecutionContext = Object.freeze({ signal: job.controller.signal, remainingMs: dispatchRemaining, requestedAt: job.requestedAt });
    let execution: Promise<ProviderExecutionCapture<ProviderOperationId>>;
    try {
      execution = descriptor.execute(job.requestedIdentity as never, context);
    } catch (error) {
      execution = Promise.reject(error);
    }
    execution.then((capture) => {
      if (liveAt() === undefined) return; // abandoned/expired work cannot publish or retain a late result
      this.#complete(job, descriptor, capture, () => liveAt() !== undefined);
    }, (error: unknown) => {
      if (liveAt() === undefined) return;
      if (error instanceof ProviderRequestInvalid) {
        // A bound only the live provider can check (advertised band/options) refuses the request
        // itself: every exact-key waiter submitted these same bytes, so each receives INVALID_REQUEST.
        for (const waiter of [...job.waiters]) {
          if (waiter.settled) continue;
          waiter.settled = true;
          this.#timers.clear(waiter.deadlineHandle);
          waiter.signal.removeEventListener("abort", waiter.onAbort);
          waiter.reject(error);
        }
        job.waiters.clear();
        return;
      }
      const [reason, detail] = error instanceof ProviderSourceUnavailable
          ? ([error.reason, error.providerDetail] as const)
          : error instanceof ProviderIdentityMismatch
            ? (["identity_mismatch", error.message] as const)
            : error instanceof ProviderResponseInvalid
              ? (["invalid_response", error.message] as const)
              : (["provider_unavailable", error instanceof Error ? error.message : String(error)] as const);
      this.#settleAll(job, () => this.#failure(job.operation, job.digest, reason, detail));
    }).finally(finish);
  }

  #complete(job: Job, descriptor: ProviderOperationDescriptor<ProviderOperationId>, capture: ProviderExecutionCapture<ProviderOperationId>, stillLive: () => boolean): void {
    const retrievedAt = this.#civil();
    let acquisition: ProviderAcquisitionReceipt;
    let parsed: { readonly payload: unknown; readonly payloadReceipt: unknown };
    try {
      acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt({ operation: job.operation, requestedIdentity: job.requestedIdentity as never, capture: capture as never, requestedAt: job.requestedAt, retrievedAt }) as ProviderAcquisitionReceipt;
    } catch (error) {
      if (!stillLive()) return;
      this.#settleAll(job, () => this.#failure(job.operation, job.digest, "identity_mismatch", error instanceof Error ? error.message : String(error)));
      return;
    }
    try {
      parsed = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition as never);
    } catch (error) {
      if (!stillLive()) return;
      this.#settleAll(job, () => this.#failure(job.operation, job.digest, error instanceof ProviderIdentityMismatch ? "identity_mismatch" : "invalid_response", error instanceof Error ? error.message : String(error)));
      return;
    }
    if (!stillLive()) return; // Parser/admission work also consumes the caller's original budget.
    const delivery = PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition: acquisition as never, payload: parsed.payload as never, payloadReceipt: parsed.payloadReceipt as never, servedAt: retrievedAt });
    this.#retain(job.key, descriptor, acquisition, parsed.payload, parsed.payloadReceipt);
    const success = Object.freeze({ kind: "success", operation: job.operation, normalizedRequestDigest: job.digest, delivery }) as unknown as TypedProviderResult;
    this.#settleAll(job, () => success);
  }

  #retain(key: ProviderPendingDigest, descriptor: ProviderOperationDescriptor<ProviderOperationId>, acquisition: ProviderAcquisitionReceipt, payload: unknown, payloadReceipt: unknown): void {
    const weight = descriptor.retainedWeight(payload as never);
    if (!Number.isSafeInteger(weight) || weight < 1) return; // refuse admission of a non-positive/unsafe weight
    if (weight > this.#maxRetainedWeight) return; // served live, never retained
    const now = this.#now();
    const expires = now + this.#retentionTtlMs;
    // The production high-resolution clock is fractional. Expiry is an instant, not a count;
    // refuse only overflow or precision loss that cannot represent an advancing deadline.
    if (!Number.isFinite(expires) || expires <= now) return;
    for (const [candidateKey, entry] of this.#retained) {
      const entryDescriptor = this.#descriptor(entry.acquisition.operation);
      if (now >= entry.expiresAtMonotonic || !entryDescriptor.admitRetained(entry.acquisition as never)) this.#removeRetained(candidateKey);
    }
    this.#removeRetained(key);
    let total = [...this.#retained.values()].reduce((sum, entry) => sum + entry.weight, 0);
    while (this.#retained.size + 1 > this.#maxRetainedEntries || total + weight > this.#maxRetainedWeight) {
      const victim = [...this.#retained.values()].sort((left, right) => left.lastServedAtMonotonic - right.lastServedAtMonotonic || (left.key < right.key ? -1 : left.key > right.key ? 1 : 0))[0];
      if (victim === undefined) return;
      this.#removeRetained(victim.key);
      total -= victim.weight;
    }
    this.#retained.set(key, { key, acquisition, payload, payloadReceipt, weight, retainedAtMonotonic: now, lastServedAtMonotonic: now, expiresAtMonotonic: expires });
    this.#retainedRevisions.set(acquisition.operation, (this.#retainedRevisions.get(acquisition.operation) ?? 0) + 1);
  }
}
