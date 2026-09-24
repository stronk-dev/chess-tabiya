// rfc/review-evidence-compiler.md §4.1: the one application-lifetime Review evidence coordinator.
//
// Import completion and RunService.story()/review() call only `ensureBranch`. It never touches
// the evidence job queue or a private engine executor: the one shared
// `stockfish.position_evaluation@1` request goes through `ProviderExchangeScheduler.get`, whose
// exact-key coalescing, deadline, cancellation, bounded queue/retention and same-exchange identity
// remain the provider contract. Admitted deliveries attach durably to the run's own event log (the
// reconstruction authority); terminal attempt outcomes live in one bounded application-lifetime
// store that never evicts an individual identity.
//
// After a node's evaluation is delivered, the same attempt requests that position's bounded engine
// line (`stockfish.principal_variation@1`, rfc/provider-exchange-and-execution.md §5.2) through the
// same scheduler, sequentially so one node never holds two exchange slots, and records it on the
// same durable event. Only the explicit Analyze reveal reads it (rfc/review-map.md §7); a line that
// cannot be obtained never withholds the evaluation, and Analyze then states that none is recorded.

import {
  attachEvidence,
  branchPath,
  engineEvidenceRef,
  exactLegalMoves,
  reviewDeliveryEvidencePayload,
  reviewDurableEngineStates,
  type DrillRun,
  type ReviewProviderNodeState,
  type StockfishPositionEvaluation,
  type StockfishPrincipalVariation,
  type TypedProviderRequest,
  type TypedProviderResult,
} from "@chess-tabiya/runtime";

import type { RunStorage } from "./storage.js";

// ---------------------------------------------------------------------------------------------
// The bounded attempt-outcome store
// ---------------------------------------------------------------------------------------------

export type ReviewAttemptSettlement =
  | { readonly kind: "retryable_failure"; readonly reason: string; readonly generation: number | null }
  | { readonly kind: "non_retryable_failure"; readonly reason: string; readonly generation: number | null }
  | { readonly kind: "success"; readonly deliveryDigest: string; readonly generation: number | null };

export type ReviewAttemptOutcome =
  | { readonly kind: "retryable_failure"; readonly attempts: number; readonly at: string; readonly generation: number | null }
  | { readonly kind: "non_retryable_failure"; readonly attempts: number; readonly at: string; readonly generation: number | null }
  | { readonly kind: "retry_exhausted"; readonly attempts: number; readonly at: string; readonly generation: number | null }
  | { readonly kind: "succeeded_delivery_digest"; readonly attempts: number; readonly at: string; readonly generation: number | null; readonly deliveryDigest: string }
  /** A never-started cancellation: nothing was retained and the identity may be requested again. */
  | { readonly kind: "released"; readonly attempts: number };

export interface ReviewAttemptOwner {
  readonly kind: "owner";
  readonly attempts: number;
  /** Increments the attempt count exactly once, immediately before provider work. */
  start(): void;
  settle(settlement: ReviewAttemptSettlement): ReviewAttemptOutcome;
  cancel(): ReviewAttemptOutcome;
  readonly completion: Promise<ReviewAttemptOutcome>;
}

export type ReviewAttemptAcquisition =
  | ReviewAttemptOwner
  | { readonly kind: "subscriber"; readonly completion: Promise<ReviewAttemptOutcome> }
  | { readonly kind: "retained"; readonly outcome: ReviewAttemptOutcome }
  | { readonly kind: "attempt_history_capacity" };

interface AttemptEntry {
  attempts: number;
  terminal: Exclude<ReviewAttemptOutcome, { kind: "released" }> | null;
  pending: { readonly promise: Promise<ReviewAttemptOutcome>; readonly resolve: (outcome: ReviewAttemptOutcome) => void } | null;
  started: boolean;
}

const positive = (value: number, label: string): number => {
  if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`${label} must be a positive safe integer`);
  return value;
};

/**
 * Fixed-size scalar receipts keyed by the canonical provider request identity. Exactly
 * `maxTerminalAttemptOutcomes` slots for the application lifetime; no individual identity is
 * evicted or expired, so an exhausted request can never become retryable by churn. Restart is the
 * only reset boundary.
 */
export class ReviewAttemptOutcomeStore {
  readonly #entries = new Map<string, AttemptEntry>();
  readonly #max: number;
  readonly #maxAttempts: number;
  readonly #now: () => string;

  constructor(options: { readonly maxTerminalAttemptOutcomes: number; readonly maxAttemptsPerRequest: number; readonly now?: () => string }) {
    this.#max = positive(options.maxTerminalAttemptOutcomes, "maxTerminalAttemptOutcomes");
    this.#maxAttempts = positive(options.maxAttemptsPerRequest, "maxAttemptsPerRequest");
    this.#now = options.now ?? (() => new Date().toISOString());
  }

  get size(): number { return this.#entries.size; }

  outcome(key: string): ReviewAttemptOutcome | undefined {
    return this.#entries.get(key)?.terminal ?? undefined;
  }

  acquire(key: string): ReviewAttemptAcquisition {
    let entry = this.#entries.get(key);
    if (entry?.pending !== null && entry?.pending !== undefined) return Object.freeze({ kind: "subscriber" as const, completion: entry.pending.promise });
    if (entry?.terminal !== null && entry?.terminal !== undefined) {
      const terminal = entry.terminal;
      const resumable = terminal.kind === "retryable_failure" && entry.attempts < this.#maxAttempts;
      if (!resumable) return Object.freeze({ kind: "retained" as const, outcome: terminal });
    }
    if (entry === undefined) {
      if (this.#entries.size >= this.#max) return Object.freeze({ kind: "attempt_history_capacity" as const });
      entry = { attempts: 0, terminal: null, pending: null, started: false };
      this.#entries.set(key, entry);
    }
    return this.#owner(key, entry);
  }

  #owner(key: string, entry: AttemptEntry): ReviewAttemptOwner {
    let resolve!: (outcome: ReviewAttemptOutcome) => void;
    const promise = new Promise<ReviewAttemptOutcome>((done) => { resolve = done; });
    const previous = { attempts: entry.attempts, terminal: entry.terminal };
    entry.pending = { promise, resolve };
    entry.started = false;
    let settled = false;
    const finish = (outcome: ReviewAttemptOutcome): ReviewAttemptOutcome => {
      if (settled) throw new TypeError("a review attempt owner settles exactly once");
      settled = true;
      entry.pending = null;
      resolve(outcome);
      return outcome;
    };
    const retain = (outcome: Exclude<ReviewAttemptOutcome, { kind: "released" }>): ReviewAttemptOutcome => {
      entry.terminal = outcome;
      return finish(outcome);
    };
    const store = this;
    return Object.freeze({
      kind: "owner" as const,
      get attempts() { return entry.attempts; },
      start(): void {
        if (settled || entry.started) throw new TypeError("a review attempt starts exactly once, before provider work");
        entry.started = true;
        entry.attempts += 1;
      },
      settle(settlement: ReviewAttemptSettlement): ReviewAttemptOutcome {
        if (!entry.started) throw new TypeError("a review attempt settles only after it started");
        const at = store.#now();
        if (settlement.kind === "success") {
          if (typeof settlement.deliveryDigest !== "string" || settlement.deliveryDigest === "") throw new TypeError("success requires the attached delivery digest");
          return retain({ kind: "succeeded_delivery_digest", attempts: entry.attempts, at, generation: settlement.generation, deliveryDigest: settlement.deliveryDigest });
        }
        if (settlement.kind === "non_retryable_failure") return retain({ kind: "non_retryable_failure", attempts: entry.attempts, at, generation: settlement.generation });
        if (settlement.kind !== "retryable_failure") throw new TypeError("unknown review attempt settlement");
        return retain(entry.attempts >= store.#maxAttempts
          ? { kind: "retry_exhausted", attempts: entry.attempts, at, generation: settlement.generation }
          : { kind: "retryable_failure", attempts: entry.attempts, at, generation: settlement.generation });
      },
      cancel(): ReviewAttemptOutcome {
        if (!entry.started) {
          // Never started: restore prior history exactly; forget an identity that never started.
          entry.attempts = previous.attempts;
          entry.terminal = previous.terminal;
          if (previous.attempts === 0 && previous.terminal === null) store.#entries.delete(key);
          return finish({ kind: "released", attempts: previous.attempts });
        }
        const at = store.#now();
        return retain(entry.attempts >= store.#maxAttempts
          ? { kind: "retry_exhausted", attempts: entry.attempts, at, generation: null }
          : { kind: "retryable_failure", attempts: entry.attempts, at, generation: null });
      },
      completion: promise,
    });
  }

  /** A success leaves the in-process store only once its exact delivery is durably attached. */
  releaseSucceeded(key: string, deliveryDigest: string): boolean {
    const entry = this.#entries.get(key);
    if (entry?.terminal?.kind !== "succeeded_delivery_digest" || entry.terminal.deliveryDigest !== deliveryDigest) return false;
    this.#entries.delete(key);
    return true;
  }
}

// ---------------------------------------------------------------------------------------------
// The coordinator
// ---------------------------------------------------------------------------------------------

/** The two Review engine operations: the evaluation every node needs and the line Analyze reveals. */
export type ReviewProviderOperation = "stockfish.position_evaluation@1" | "stockfish.principal_variation@1";

export interface ReviewProviderGateway {
  get<K extends ReviewProviderOperation>(request: TypedProviderRequest<K>, scope: { readonly id: string; readonly budgetMs: number }, signal: AbortSignal): Promise<TypedProviderResult<K>>;
  normalizedRequestDigest<K extends ReviewProviderOperation>(request: TypedProviderRequest<K>): string;
}

export interface ReviewEvidenceCoordinatorOptions {
  /** The shared provider scheduler, or null when no analysis engine is configured (provider off). */
  readonly scheduler: ReviewProviderGateway | null;
  /** The requested engine identity (the running analysis engine), or null when provider off. */
  readonly requestedEngine: () => Promise<{ readonly id: string; readonly version: string } | null>;
  readonly storage: Pick<RunStorage, "read" | "save">;
  readonly attempts: ReviewAttemptOutcomeStore;
  readonly windowNodes: number;
  readonly maxOutstandingPerRun: number;
  readonly maxTrackedRuns: number;
  readonly maxAttemptsPerRequest: number;
  readonly movetimeMs: number;
  readonly timeoutMs: number;
  /** The recorded engine line's ply bound (`maxPlies` of the principal-variation request). */
  readonly linePlies: number;
  readonly now?: () => string;
  readonly onAttached?: (run: DrillRun, learnerId: string) => void;
}

interface BranchTracker {
  readonly key: string;
  readonly active: Map<string, { readonly controller: AbortController; readonly requestKey: string }>;
  /** Terminal per-node states from settled attempts (reconstructible from the bounded store). */
  readonly terminal: Map<string, ReviewProviderNodeState>;
  lastUsed: number;
}

const OPERATION = "stockfish.position_evaluation@1" as const;
const OUTSIDE_DOMAIN: ReviewProviderNodeState = Object.freeze({ kind: "honest_empty" as const, reason: "outside_domain" as const });
/** A position with no legal move cannot be searched; it is never requested. */
const searchable = (fen: string): boolean => exactLegalMoves(fen).length > 0;
type ReviewPositionRequest = TypedProviderRequest<"stockfish.position_evaluation@1">;
type ReviewLineRequest = TypedProviderRequest<"stockfish.principal_variation@1">;
const RETRYABLE = new Set(["deadline_exceeded", "queue_full", "cancelled"]);

/**
 * Bounded, progressive and idempotent enrichment of one authorized branch. Returns the current
 * per-node engine states (durable deliveries first; then pending, retrying, not-yet-scheduled and
 * terminal unavailability) and pumps at most one bounded window of new provider work.
 */
export class ReviewEvidenceCoordinator {
  readonly #options: ReviewEvidenceCoordinatorOptions;
  readonly #trackers = new Map<string, BranchTracker>();
  readonly #inflight = new Set<Promise<void>>();
  #clock = 0;
  #engine: Promise<{ readonly id: string; readonly version: string } | null> | undefined;

  constructor(options: ReviewEvidenceCoordinatorOptions) {
    for (const [label, value] of [["windowNodes", options.windowNodes], ["maxOutstandingPerRun", options.maxOutstandingPerRun], ["maxTrackedRuns", options.maxTrackedRuns], ["maxAttemptsPerRequest", options.maxAttemptsPerRequest], ["movetimeMs", options.movetimeMs], ["timeoutMs", options.timeoutMs], ["linePlies", options.linePlies]] as const) positive(value, label);
    this.#options = options;
  }

  /** Test/observability surface: active provider subscribers per tracked branch. */
  outstanding(runId: string, branchId: string): number {
    return this.#trackers.get(`${runId}\u0000${branchId}`)?.active.size ?? 0;
  }

  get trackedBranches(): number { return this.#trackers.size; }

  /** Resolves when no provider work is in flight (tests and graceful shutdown). */
  async whenIdle(): Promise<void> {
    while (this.#inflight.size > 0) await Promise.allSettled([...this.#inflight]);
  }

  #requestedEngine(): Promise<{ readonly id: string; readonly version: string } | null> {
    this.#engine ??= this.#options.requestedEngine().catch(() => null);
    return this.#engine;
  }

  #tracker(runId: string, branchId: string): BranchTracker {
    const key = `${runId}\u0000${branchId}`;
    let tracker = this.#trackers.get(key);
    if (tracker === undefined) {
      tracker = { key, active: new Map(), terminal: new Map(), lastUsed: 0 };
      this.#trackers.set(key, tracker);
    }
    tracker.lastUsed = ++this.#clock;
    // LRU eviction of idle trackers above the bound; an active tracker is cancelled before eviction.
    while (this.#trackers.size > this.#options.maxTrackedRuns) {
      const victim = [...this.#trackers.values()].filter((candidate) => candidate !== tracker).sort((left, right) => (left.active.size - right.active.size) || (left.lastUsed - right.lastUsed))[0];
      if (victim === undefined) break;
      for (const job of victim.active.values()) job.controller.abort();
      this.#trackers.delete(victim.key);
    }
    return tracker;
  }

  #request(fen: string, engine: { readonly id: string; readonly version: string }): ReviewPositionRequest {
    return Object.freeze({ operation: OPERATION, request: Object.freeze({ fen, requestedEngine: Object.freeze({ id: engine.id, version: engine.version }), bound: Object.freeze({ kind: "movetime" as const, requestedMs: this.#options.movetimeMs }), timeoutMs: this.#options.timeoutMs }) });
  }

  /** The same position, engine and bound as `#request`, asking for the bounded principal variation. */
  #lineRequest(request: ReviewPositionRequest): ReviewLineRequest {
    return Object.freeze({ operation: "stockfish.principal_variation@1" as const, request: Object.freeze({ ...request.request, maxPlies: this.#options.linePlies }) });
  }

  /** The bounded engine line for a delivered position, or undefined when it cannot be obtained. */
  async #line(runId: string, request: ReviewPositionRequest, signal: AbortSignal): Promise<StockfishPrincipalVariation | undefined> {
    try {
      const result = await this.#options.scheduler!.get(this.#lineRequest(request), { id: `review:${runId}`, budgetMs: this.#options.timeoutMs + 1_000 }, signal);
      return result.kind === "success" ? result.delivery as StockfishPrincipalVariation : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Read-only observation for surfaces that must not enqueue (the Review Map, criterion 14): durable
   * deliveries, active requests as pending, settled failures as unavailable, and every other node
   * `not_yet_scheduled` once the branch was ensured, else `not_requested`.
   */
  observe(runId: string, branchId: string): { readonly states: ReadonlyMap<string, ReviewProviderNodeState> } {
    const stored = this.#options.storage.read(runId);
    if (stored === undefined) throw new TypeError(`Review coordinator: unknown run ${runId}`);
    const path = branchPath(stored.run, branchId);
    const durable = reviewDurableEngineStates(stored.run, path);
    const tracker = this.#trackers.get(`${runId}\u0000${branchId}`);
    const states = new Map<string, ReviewProviderNodeState>();
    for (const node of path) {
      const delivered = durable.get(node.id);
      if (delivered?.kind === "delivered") { states.set(node.id, delivered); continue; }
      if (!searchable(node.fen)) { states.set(node.id, OUTSIDE_DOMAIN); continue; }
      if (this.#options.scheduler === null) { states.set(node.id, Object.freeze({ kind: "unavailable" as const, reason: "provider_off" as const })); continue; }
      const terminal = tracker?.terminal.get(node.id);
      if (terminal !== undefined) { states.set(node.id, terminal); continue; }
      if (tracker?.active.has(node.id) === true) { states.set(node.id, Object.freeze({ kind: "pending" as const, jobCount: 1, retrying: 0 })); continue; }
      states.set(node.id, tracker === undefined ? Object.freeze({ kind: "not_requested" as const }) : Object.freeze({ kind: "not_yet_scheduled" as const }));
    }
    return Object.freeze({ states });
  }

  /**
   * The single Review operation. `engineReady` resolves the requested engine identity before the
   * first window; callers that need the settled first window may await `pump`.
   */
  ensureBranch(runId: string, branchId: string): { readonly states: ReadonlyMap<string, ReviewProviderNodeState>; readonly pump: Promise<void> } {
    const stored = this.#options.storage.read(runId);
    if (stored === undefined) throw new TypeError(`Review coordinator: unknown run ${runId}`);
    const path = branchPath(stored.run, branchId);
    const durable = reviewDurableEngineStates(stored.run, path);
    const states = new Map<string, ReviewProviderNodeState>();
    if (this.#options.scheduler === null) {
      for (const node of path) states.set(node.id, durable.get(node.id)?.kind === "delivered" ? durable.get(node.id)! : !searchable(node.fen) ? OUTSIDE_DOMAIN : Object.freeze({ kind: "unavailable" as const, reason: "provider_off" as const }));
      return Object.freeze({ states, pump: Promise.resolve() });
    }
    const tracker = this.#tracker(runId, branchId);
    for (const node of path) if (durable.get(node.id)?.kind !== "delivered" && !searchable(node.fen)) states.set(node.id, OUTSIDE_DOMAIN);
    const missing = path.filter((node) => durable.get(node.id)?.kind !== "delivered" && searchable(node.fen));
    for (const node of path) if (durable.get(node.id)?.kind === "delivered") states.set(node.id, durable.get(node.id)!);
    let admitted = 0;
    const toStart: typeof missing = [];
    for (const node of missing) {
      const terminal = tracker.terminal.get(node.id);
      if (terminal !== undefined && terminal.kind === "unavailable") { states.set(node.id, terminal); continue; }
      const active = tracker.active.get(node.id);
      if (active !== undefined) {
        const outcome = this.#options.attempts.outcome(active.requestKey);
        states.set(node.id, Object.freeze({ kind: "pending" as const, jobCount: 1, retrying: outcome?.kind === "retryable_failure" ? 1 : 0 }));
        admitted += 1;
        continue;
      }
      if (admitted >= this.#options.windowNodes || tracker.active.size + toStart.length >= this.#options.maxOutstandingPerRun) {
        states.set(node.id, Object.freeze({ kind: "not_yet_scheduled" as const }));
        continue;
      }
      admitted += 1;
      toStart.push(node);
      states.set(node.id, Object.freeze({ kind: "pending" as const, jobCount: 1, retrying: 0 }));
    }
    const pump = this.#start(runId, branchId, tracker, toStart.map((node) => ({ id: node.id, fen: node.fen })), states).catch(() => undefined);
    this.#inflight.add(pump);
    void pump.finally(() => this.#inflight.delete(pump));
    return Object.freeze({ states, pump });
  }

  async #start(runId: string, branchId: string, tracker: BranchTracker, nodes: readonly { readonly id: string; readonly fen: string }[], states: Map<string, ReviewProviderNodeState>): Promise<void> {
    const engine = await this.#requestedEngine();
    const scheduler = this.#options.scheduler!;
    if (engine === null) {
      for (const node of nodes) states.set(node.id, Object.freeze({ kind: "unavailable" as const, reason: "provider_off" as const }));
      return;
    }
    const work: Promise<void>[] = [];
    for (const node of nodes) {
      const request = this.#request(node.fen, engine);
      let requestKey: string;
      try { requestKey = `${scheduler.normalizedRequestDigest(request)}\u0000${engine.id}\u0000${engine.version}\u0000movetime:${this.#options.movetimeMs}`; } catch { const state = Object.freeze({ kind: "unavailable" as const, reason: "provider_failed" as const }); states.set(node.id, state); tracker.terminal.set(node.id, state); continue; }
      const acquisition = this.#options.attempts.acquire(requestKey);
      if (acquisition.kind === "attempt_history_capacity") { const state = Object.freeze({ kind: "unavailable" as const, reason: "attempt_history_capacity" as const }); states.set(node.id, state); tracker.terminal.set(node.id, state); continue; }
      if (acquisition.kind === "retained") { const state = stateOf(acquisition.outcome); states.set(node.id, state); if (state.kind === "unavailable") tracker.terminal.set(node.id, state); continue; }
      if (acquisition.kind === "subscriber") continue;
      const controller = new AbortController();
      tracker.active.set(node.id, { controller, requestKey });
      work.push(this.#run(runId, branchId, tracker, node, request, requestKey, acquisition, controller));
    }
    await Promise.all(work);
  }

  async #run(runId: string, branchId: string, tracker: BranchTracker, node: { readonly id: string; readonly fen: string }, request: ReviewPositionRequest, requestKey: string, owner: ReviewAttemptOwner, controller: AbortController): Promise<void> {
    const scheduler = this.#options.scheduler!;
    let outcome: ReviewAttemptOutcome | undefined;
    try {
      if (controller.signal.aborted) { outcome = owner.cancel(); return; }
      owner.start();
      const result = await scheduler.get(request, { id: `review:${runId}`, budgetMs: this.#options.timeoutMs + 1_000 }, controller.signal);
      if (controller.signal.aborted) { outcome = owner.cancel(); return; }
      if (result.kind === "success") {
        const line = await this.#line(runId, request, controller.signal);
        if (controller.signal.aborted) { outcome = owner.cancel(); return; }
        const digest = this.#attach(runId, node.id, result.delivery as StockfishPositionEvaluation, line);
        outcome = digest === null
          ? owner.settle({ kind: "non_retryable_failure", reason: "node_pruned", generation: result.delivery.acquisition.generation })
          : owner.settle({ kind: "success", deliveryDigest: digest, generation: result.delivery.acquisition.generation });
        if (digest !== null) this.#options.attempts.releaseSucceeded(requestKey, digest);
      } else if (result.kind === "source_failure") {
        outcome = owner.settle(RETRYABLE.has(result.reason) || result.reason === "provider_unavailable"
          ? { kind: "retryable_failure", reason: result.reason, generation: null }
          : { kind: "non_retryable_failure", reason: result.reason, generation: null });
      } else {
        outcome = owner.settle({ kind: "non_retryable_failure", reason: "local_domain_result", generation: null });
      }
    } catch (error) {
      outcome = controller.signal.aborted ? owner.cancel() : owner.settle({ kind: "retryable_failure", reason: error instanceof Error ? error.message : String(error), generation: null });
    } finally {
      tracker.active.delete(node.id);
    }
    const state = stateOf(outcome!);
    if (state.kind === "unavailable") tracker.terminal.set(node.id, state);
    // Completion callbacks, not page reads, advance the bounded window.
    if (this.#trackers.get(tracker.key) === tracker) {
      try { await this.ensureBranch(runId, branchId).pump; } catch { /* the run or branch disappeared */ }
    }
  }

  /** Durable attachment in one synchronous read-modify-write turn; returns the delivery digest. */
  #attach(runId: string, nodeId: string, delivery: StockfishPositionEvaluation, line: StockfishPrincipalVariation | undefined): string | null {
    const stored = this.#options.storage.read(runId);
    if (stored === undefined || !stored.run.nodes.some((node) => node.id === nodeId)) return null;
    const node = stored.run.nodes.find((candidate) => candidate.id === nodeId)!;
    if (node.fen !== delivery.payload.fen) return null;
    const digest = delivery.payloadReceipt.payloadDigest;
    const reference = engineEvidenceRef(`review-${digest.slice("sha256:".length, "sha256:".length + 24)}`);
    const recordedLine = line !== undefined && line.payload.fen === delivery.payload.fen ? line : undefined;
    const attached = attachEvidence(stored.run, nodeId, [reference], reviewDeliveryEvidencePayload(delivery, recordedLine), (this.#options.now ?? (() => new Date().toISOString()))());
    this.#options.storage.save(attached.run, { writerId: stored.activeWriterId, learnerId: stored.activeWriterLearnerId });
    this.#options.onAttached?.(attached.run, stored.activeWriterLearnerId);
    return digest;
  }
}

function stateOf(outcome: ReviewAttemptOutcome): ReviewProviderNodeState {
  switch (outcome.kind) {
    case "retry_exhausted": return Object.freeze({ kind: "unavailable" as const, reason: "retry_exhausted" as const });
    case "non_retryable_failure": return Object.freeze({ kind: "unavailable" as const, reason: "provider_failed" as const });
    case "retryable_failure": return Object.freeze({ kind: "pending" as const, jobCount: 1, retrying: 1 });
    case "succeeded_delivery_digest": case "released": return Object.freeze({ kind: "not_yet_scheduled" as const });
  }
}
