/**
 * rfc/hint-distance.md §7 — the Guided Hint production operation behind
 * `POST|GET|DELETE /runs/:runId/hints[/:requestId]`.
 *
 * One process-local, bounded, idempotent operation store. A request id is a deterministic digest of
 * the exact decision, rung, manifest, compiler and search source, so a repeated POST joins the same
 * operation and never enqueues a duplicate. The expensive part — one bounded Stockfish principal
 * variation plus the complete candidate packets of the scanned root-side positions — is shared by
 * every rung of one decision; each rung only compiles its own redacted disclosure. Every poll
 * recomputes the decision stamp; a moved decision answers `stale` and never publishes a late result.
 * After a restart an unknown request id is an explicit 404 so the client re-POSTs; no request schema
 * is persisted.
 */
import {
  HINT_COMPILER_VERSION,
  PRIMARY_EVIDENCE_MANIFEST,
  compileEvidenceConsumerExecutionV2,
  compileGuidedHintPacket,
  compileHintDeliveryReceipt,
  compileHintDisclosureV2,
  hintPacketRoots,
  hintRequestId,
  hintSearchLineEvidence,
  hintVoiceCheck,
  parseRequestedAssistanceV1,
  normalizeProviderRequest,
  normalizedProviderRequestDigest,
  selectHintHorizon,
  type DrillRun,
  type EvidenceRole,
  type HintDecisionStamp,
  type HintEmptyReason,
  type HintResponse,
  type HintRung,
  type HintSourceReason,
  type HintVoiceState,
  type ProviderOperationAvailability,
  type RenderedEvidenceView,
  type RequestedAssistanceV1,
  type SealedHintHorizon,
  type TypedProviderRequest,
  type TypedProviderResult,
} from "@chess-tabiya/runtime";

import { CandidatePopulationService } from "./candidate-population-service.js";
import { ServerError } from "./errors.js";

export interface HintProviderGateway {
  get(request: TypedProviderRequest<"stockfish.principal_variation@1">, scope: { readonly id: string; readonly budgetMs: number }, signal: AbortSignal): Promise<TypedProviderResult<"stockfish.principal_variation@1">>;
}

/** The optional external paraphrase: it sees only the one-item rendered view and the canonical sentence. */
export type HintVoiceRenderer = (view: RenderedEvidenceView, sentence: string, signal: AbortSignal) => Promise<string>;

export interface HintSourceGenerations {
  /** ProviderRegistry instance generation; this is not the provider family or an engine counter. */
  readonly registry: string | null;
  /** The engine supervisor's currently established generation, compared to acquisition.generation. */
  readonly engine: number | null;
}
interface EstablishedHintSource { readonly registry: string; readonly engine: number }

export interface HintServiceOptions {
  /** The shared provider scheduler, or null when no analysis engine is configured. */
  readonly scheduler: HintProviderGateway | null;
  readonly requestedEngine: () => Promise<{ readonly id: string; readonly version: string } | null>;
  readonly sourceGenerations: () => HintSourceGenerations;
  /** The injected application-lifetime packet service (criterion 15). */
  readonly populations: CandidatePopulationService;
  readonly depth: number;
  readonly timeoutMs: number;
  readonly maxOperations: number;
  readonly voice?: HintVoiceRenderer;
  readonly voiceTimeoutMs?: number;
  /**
   * The live provider-health state of `stockfish.principal_variation@1` (provider health §8). An
   * unavailable or backing-off search source is an honest `source_unavailable` before any work; it is
   * never a lowered ceiling ([[D1371]]). Absent in unit compositions that pass no registry.
   */
  readonly availability?: () => ProviderOperationAvailability;
}

/** Everything the service needs about one request, re-derived by RunService from the stored run. */
export interface HintAccess {
  /** Authenticated action owner, derived by REST; public action IDs are not credentials. */
  readonly learnerId: string;
  readonly writerId: string;
  readonly assistance: RequestedAssistanceV1;
  /** Required live identity/run/policy authority; never replaced by a repeat POST. */
  readonly revalidate: () => boolean;
  readonly run: DrillRun;
  readonly decision: HintDecisionStamp;
  readonly fen: string;
  readonly role: EvidenceRole;
  readonly session: string;
  readonly voiceRequested: boolean;
}

type HorizonOutcome =
  | { readonly kind: "selected"; readonly horizon: SealedHintHorizon }
  | { readonly kind: "empty"; readonly reason: HintEmptyReason }
  | { readonly kind: "source_unavailable"; readonly reason: HintSourceReason }
  | { readonly kind: "failed" };

interface HorizonJob {
  readonly controller: AbortController;
  readonly result: Promise<HorizonOutcome>;
  readonly subscribers: Set<Operation>;
  readonly source: EstablishedHintSource;
  readonly deadline: number;
  timer: ReturnType<typeof setTimeout> | undefined;
  completedAt: number | null;
  failure?: HintSourceReason;
  settled: boolean;
}

interface Operation {
  readonly key: string;
  readonly learnerId: string;
  readonly clientRequestId: string;
  /** Initially a terminal-attempt image; never exposed as pending before successful sealing. */
  requestId: string;
  readonly runId: string;
  readonly rung: HintRung;
  readonly decisionDigest: string;
  horizonKey: string;
  readonly controller: AbortController;
  readonly access: HintAccess;
  readonly acknowledgement: Promise<HintResponse>;
  readonly acknowledge: (response: HintResponse) => void;
  acknowledged: boolean;
  source: EstablishedHintSource | null;
  readonly deadline: number;
  timer: ReturnType<typeof setTimeout> | undefined;
  sourceComplete: boolean;
  horizon?: HorizonJob;
  state: HintResponse;
  settled: boolean;
  lastUsed: number;
}

const SOURCE_REASONS: readonly HintSourceReason[] = ["provider_unavailable", "deadline_exceeded", "queue_full", "cancelled", "invalid_response", "identity_mismatch"];

/** Detach even from an abort-ignoring provider, observing its late rejection without publishing it. */
async function untilAborted<T>(signal: AbortSignal, start: () => Promise<T>): Promise<T> {
  if (signal.aborted) throw new Error("cancelled");
  let onAbort: (() => void) | undefined;
  try {
    return await new Promise<T>((resolve, reject) => {
      onAbort = () => reject(new Error("cancelled"));
      signal.addEventListener("abort", onAbort, { once: true });
      try { void start().then(resolve, reject); } catch (error) { reject(error); }
    });
  } finally {
    if (onAbort !== undefined) signal.removeEventListener("abort", onAbort);
  }
}

export class HintService {
  readonly #options: HintServiceOptions;
  readonly #operations = new Map<string, Operation>();
  readonly #horizons = new Map<string, HorizonJob>();
  readonly #inflight = new Set<Promise<void>>();
  #clock = 0;
  #engine: Promise<{ readonly id: string; readonly version: string } | null> | undefined;
  #closed = false;

  constructor(options: HintServiceOptions) {
    for (const [label, value] of [["depth", options.depth], ["timeoutMs", options.timeoutMs], ["maxOperations", options.maxOperations]] as const) {
      if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`HintService ${label} must be a positive safe integer`);
    }
    if (options.voiceTimeoutMs !== undefined && (!Number.isSafeInteger(options.voiceTimeoutMs) || options.voiceTimeoutMs < 1)) throw new TypeError("HintService voiceTimeoutMs must be a positive safe integer");
    // Criterion 15: the one application-lifetime packet service is injected; a request-local cache is refused.
    if (!(options.populations instanceof CandidatePopulationService)) throw new TypeError("HintService requires the injected CandidatePopulationService");
    if (typeof options.sourceGenerations !== "function") throw new TypeError("HintService requires actual provider and established-engine generation authorities");
    this.#options = options;
  }

  /** Resolves when no hint work is in flight (tests and graceful shutdown). */
  async whenIdle(): Promise<void> {
    while (this.#inflight.size > 0) await Promise.allSettled([...this.#inflight]);
  }

  /** Stop private voice calls and detach every shared-search subscriber before application teardown. */
  async close(): Promise<void> {
    this.#closed = true;
    for (const operation of this.#operations.values()) this.#drop(operation);
    for (const job of this.#horizons.values()) job.controller.abort();
    this.#horizons.clear();
    await this.whenIdle();
  }

  get operationCount(): number { return this.#operations.size; }

  #generations(): HintSourceGenerations {
    const { registry, engine } = this.#options.sourceGenerations();
    if ((registry !== null && (typeof registry !== "string" || registry.length === 0))
      || (engine !== null && (!Number.isSafeInteger(engine) || engine < 1))) throw new TypeError("Invalid actual Hint source generations");
    return Object.freeze({ registry, engine });
  }

  #source(kind: "terminal_attempt" | "established", generations: HintSourceGenerations): string {
    return JSON.stringify([this.#options.scheduler === null ? "stockfish:off" : "stockfish.principal_variation@1", this.#options.depth, 4, kind, generations.registry, generations.engine]);
  }

  #requestId(decisionDigest: string, rung: HintRung, clientRequestId: string, source: string): string {
    return hintRequestId({ clientRequestId, decisionDigest, rung, manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest, compiler: HINT_COMPILER_VERSION, source });
  }

  /** Early refusal identity only. It never starts an engine or claims an established source. */
  requestIdFor(decisionDigest: string, rung: HintRung, clientRequestId: string): string {
    return this.#requestId(decisionDigest, rung, clientRequestId, this.#source("terminal_attempt", this.#generations()));
  }

  #operationKey(access: HintAccess, rung: HintRung, clientRequestId: string): string {
    // Source replacement never changes the logical action key or rebinds a retained slot.
    return JSON.stringify([access.run.id, access.learnerId, access.decision.digest, rung, clientRequestId]);
  }

  /** §7 step 1–2: join or create the exact operation; returns its current state. */
  async request(access: HintAccess, rung: HintRung, clientRequestId: string): Promise<HintResponse> {
    const learnerId = access.learnerId;
    if (typeof learnerId !== "string" || learnerId.length === 0) throw new TypeError("Hint requests require an authenticated action owner");
    if (typeof access.writerId !== "string" || access.writerId.length === 0 || typeof access.revalidate !== "function") throw new TypeError("Hint requests require their original writer and live authority");
    access = Object.freeze({ ...access, assistance: parseRequestedAssistanceV1(access.assistance) });
    const key = this.#operationKey(access, rung, clientRequestId);
    let operation = this.#operations.get(key);
    const requestId = operation?.requestId ?? this.requestIdFor(access.decision.digest, rung, clientRequestId);
    if (this.#closed) return Object.freeze({ state: "source_unavailable", requestId, rung, reason: "cancelled" });
    // Compile the complete family/rung contract before identity, search, packet or
    // voice acquisition, including requests that would reuse a retained horizon.
    // A malformed contract is not source absence or an uninformative chess position.
    try {
      compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "module.guided_hint", version: 2 });
    } catch {
      return Object.freeze({ state: "failed", requestId, rung, reason: "contract_violation" });
    }
    if (operation === undefined) {
      let acknowledge!: (response: HintResponse) => void;
      const acknowledgement = new Promise<HintResponse>(resolve => { acknowledge = resolve; });
      operation = { key, learnerId, clientRequestId, requestId, runId: access.run.id, rung, decisionDigest: access.decision.digest, horizonKey: "", controller: new AbortController(), access,
        acknowledgement, acknowledge, acknowledged: false, source: null, deadline: performance.now() + this.#options.timeoutMs + 1_000, timer: undefined, sourceComplete: false,
        state: Object.freeze({ state: "pending", requestId, rung }), settled: false, lastUsed: ++this.#clock };
      this.#operations.set(key, operation);
      const created = operation;
      created.timer = setTimeout(() => this.#invalidate(created, { state: "source_unavailable", requestId: created.requestId, rung, reason: "deadline_exceeded" }), Math.max(0, Math.ceil(created.deadline - performance.now())));
      this.#evict();
      const work = this.#initialize(created).catch(() => this.#settle(created, Object.freeze({ state: "failed", requestId: created.requestId, rung, reason: "internal_error" })));
      this.#inflight.add(work);
      void work.finally(() => this.#inflight.delete(work));
    } else if (operation.access.writerId !== access.writerId || operation.access.assistance.requestDigest !== access.assistance.requestDigest || operation.access.fen !== access.fen) {
      return this.#current(operation) ? Object.freeze({ state: "failed", requestId: operation.requestId, rung, reason: "contract_violation" }) : operation.state;
    }
    operation.lastUsed = ++this.#clock;
    this.#current(operation);
    return operation.acknowledged ? operation.state : operation.acknowledgement;
  }

  #acknowledge(operation: Operation): void {
    if (operation.acknowledged) return;
    operation.acknowledged = true;
    operation.acknowledge(operation.state);
  }

  async #initialize(operation: Operation): Promise<void> {
    if (!this.#current(operation)) return;
    const health = this.#options.availability?.();
    if (this.#options.scheduler === null || health?.state === "unavailable" || health?.state === "temporarily_blocked") {
      this.#settle(operation, { state: "source_unavailable", requestId: operation.requestId, rung: operation.rung, reason: "provider_unavailable" }); return;
    }
    let generations = this.#generations();
    let engine: { readonly id: string; readonly version: string } | undefined;
    if (generations.registry === null) {
      this.#settle(operation, { state: "source_unavailable", requestId: operation.requestId, rung: operation.rung, reason: "provider_unavailable" }); return;
    }
    if (generations.engine === null) {
      const discovered = await untilAborted(operation.controller.signal, () => this.#requestedEngine());
      if (!this.#current(operation)) return;
      generations = this.#generations();
      if (discovered === null || generations.registry === null || generations.engine === null) {
        this.#settle(operation, { state: "source_unavailable", requestId: operation.requestId, rung: operation.rung, reason: "provider_unavailable" }); return;
      }
      engine = Object.freeze({ ...discovered });
    }
    if (!this.#current(operation)) return;
    const source = Object.freeze({ registry: generations.registry!, engine: generations.engine! });
    operation.source = source;
    const image = this.#source("established", source);
    operation.requestId = this.#requestId(operation.decisionDigest, operation.rung, operation.clientRequestId, image);
    operation.horizonKey = JSON.stringify([HINT_COMPILER_VERSION, PRIMARY_EVIDENCE_MANIFEST.digest, image, operation.runId, operation.decisionDigest, operation.access.fen]);
    operation.state = Object.freeze({ state: "pending", requestId: operation.requestId, rung: operation.rung });
    this.#acknowledge(operation);
    await this.#run(operation, engine);
  }

  #known(runId: string, requestId: string, learnerId: string): Operation | undefined {
    // At most maxOperations; no second unbounded startup/reverse-identity map.
    return [...this.#operations.values()].find(operation => operation.acknowledged && operation.runId === runId && operation.learnerId === learnerId && operation.requestId === requestId);
  }

  /** §7 step 3: poll one exact operation; a moved decision is `stale` and cancels the work. */
  poll(runId: string, requestId: string, currentDecision: HintDecisionStamp, learnerId: string): HintResponse {
    const operation = this.#known(runId, requestId, learnerId);
    if (operation === undefined || operation.runId !== runId || operation.learnerId !== learnerId) throw new ServerError("HINT_REQUEST_NOT_FOUND", "This hint request is not known here; request the hint again");
    operation.lastUsed = ++this.#clock;
    if (operation.decisionDigest !== currentDecision.digest) {
      this.#drop(operation);
      return Object.freeze({ state: "stale", requestId, rung: operation.rung });
    }
    if (!this.#current(operation)) {
      // Keep the original binding in the same bounded store. Forgetting it here would let a
      // repeat POST adopt a new lease/session/intent under the identical public request ID.
      return operation.state;
    }
    return operation.state;
  }

  /** §7 step 4: remove this waiter; the shared search is aborted when its final subscriber leaves. */
  cancel(runId: string, requestId: string, learnerId: string): HintResponse {
    const operation = this.#known(runId, requestId, learnerId);
    if (operation === undefined || operation.runId !== runId || operation.learnerId !== learnerId) throw new ServerError("HINT_REQUEST_NOT_FOUND", "This hint request is not known here; nothing to cancel");
    this.#drop(operation);
    return Object.freeze({ state: "cancelled", requestId, rung: operation.rung });
  }

  #drop(operation: Operation): void {
    if (this.#operations.get(operation.key) === operation) this.#operations.delete(operation.key);
    if (!operation.settled) {
      this.#invalidate(operation, { state: "cancelled", requestId: operation.requestId, rung: operation.rung });
    } else {
      operation.controller.abort();
      clearTimeout(operation.timer);
    }
  }

  #release(operation: Operation): void {
    const job = operation.horizon;
    if (job === undefined) return;
    delete operation.horizon;
    job.subscribers.delete(operation);
    if (!job.settled && job.subscribers.size === 0) {
      clearTimeout(job.timer);
      job.controller.abort();
      // An abandoned job may finish after a new same-key flight has been installed.
      if (this.#horizons.get(operation.horizonKey) === job) this.#horizons.delete(operation.horizonKey);
    }
  }

  #evict(): void {
    while (this.#operations.size > this.#options.maxOperations) {
      const victim = [...this.#operations.values()].sort((left, right) => Number(right.settled) - Number(left.settled) || left.lastUsed - right.lastUsed)[0]!;
      this.#drop(victim);
    }
  }

  #settle(operation: Operation, state: HintResponse): void {
    if (operation.settled) return;
    operation.settled = true;
    operation.state = Object.freeze(state);
    clearTimeout(operation.timer);
    this.#release(operation);
    this.#acknowledge(operation);
  }

  #invalidate(operation: Operation, state: HintResponse): void {
    operation.state = Object.freeze(state);
    operation.settled = true;
    clearTimeout(operation.timer);
    operation.controller.abort();
    this.#release(operation);
    this.#acknowledge(operation);
  }

  #sameSource(source: EstablishedHintSource): boolean {
    const current = this.#generations();
    return current.registry === source.registry && current.engine === source.engine;
  }

  #current(operation: Operation): boolean {
    if (operation.controller.signal.aborted) return false;
    let state: HintResponse;
    try {
      if (!operation.access.revalidate()) state = { state: "stale", requestId: operation.requestId, rung: operation.rung };
      else if (operation.source !== null && !this.#sameSource(operation.source)) state = { state: "source_unavailable", requestId: operation.requestId, rung: operation.rung, reason: "identity_mismatch" };
      else if (!operation.sourceComplete && !operation.settled && performance.now() >= operation.deadline) state = { state: "source_unavailable", requestId: operation.requestId, rung: operation.rung, reason: "deadline_exceeded" };
      else return true;
    } catch {
      state = Object.freeze({ state: "failed", requestId: operation.requestId, rung: operation.rung, reason: "internal_error" });
    }
    // Also retire already delivered cached actions: a once-valid receipt is not live permission.
    this.#invalidate(operation, state);
    return false;
  }

  #endSource(job: HorizonJob, reason: HintSourceReason): void {
    if (job.settled || job.controller.signal.aborted) return;
    job.failure = reason;
    job.controller.abort();
    clearTimeout(job.timer);
  }

  #live(job: HorizonJob): boolean {
    if (job.controller.signal.aborted) return false;
    if (!this.#sameSource(job.source)) { this.#endSource(job, "identity_mismatch"); return false; }
    if (performance.now() >= job.deadline) { this.#endSource(job, "deadline_exceeded"); return false; }
    for (const operation of [...job.subscribers]) this.#current(operation);
    // Synchronous identity/permission reads can consume the creator's remaining time even
    // when the sole surviving peer has a later individual deadline.
    if (!this.#sameSource(job.source)) { this.#endSource(job, "identity_mismatch"); return false; }
    if (performance.now() >= job.deadline) { this.#endSource(job, "deadline_exceeded"); return false; }
    return !job.controller.signal.aborted && job.subscribers.size > 0;
  }

  #requestedEngine(): Promise<{ readonly id: string; readonly version: string } | null> {
    if (this.#engine !== undefined) return this.#engine;
    // Discovery coalesces only while pending. A failed start must not permanently pin null,
    // and a later authorized operation discovers the then-current launched engine identity.
    const pending = Promise.resolve().then(() => this.#options.requestedEngine()).catch(() => null);
    this.#engine = pending;
    void pending.finally(() => { if (this.#engine === pending) this.#engine = undefined; });
    return pending;
  }

  #horizon(operation: Operation, engine?: { readonly id: string; readonly version: string }): HorizonJob {
    const key = operation.horizonKey;
    const { access } = operation;
    let job = this.#horizons.get(key);
    if (job === undefined) {
      const controller = new AbortController();
      // Source work retains only its pure root, never the creator's permission or whole access.
      const root = Object.freeze({ runId: operation.runId, decision: access.decision, fen: access.fen, engine });
      const created: HorizonJob = { controller, result: Promise.resolve().then(() => this.#compileHorizon(root, created)), subscribers: new Set(), source: operation.source!, deadline: operation.deadline, timer: undefined, completedAt: null, settled: false };
      job = created;
      created.timer = setTimeout(() => this.#endSource(created, "deadline_exceeded"), Math.max(0, Math.ceil(created.deadline - performance.now())));
      this.#horizons.set(key, job);
      const complete = (): void => {
        created.settled = true;
        clearTimeout(created.timer);
        for (const subscriber of created.subscribers) {
          if (created.completedAt !== null && created.completedAt < subscriber.deadline) {
            subscriber.sourceComplete = true;
            clearTimeout(subscriber.timer);
          }
          delete subscriber.horizon;
        }
        created.subscribers.clear();
      };
      void job.result.then(outcome => {
        complete();
        // Only real selected/empty chess results are retained. Provider/startup absence
        // cannot hide recovery on the next request, or delete a replacement flight.
        if ((outcome.kind === "source_unavailable" || outcome.kind === "failed") && this.#horizons.get(key) === created) this.#horizons.delete(key);
      }, () => { complete(); if (this.#horizons.get(key) === created) this.#horizons.delete(key); });
      while (this.#horizons.size > this.#options.maxOperations) {
        // Operation pressure already evicts settled records first. Match that lifetime:
        // discard an unused retained horizon before touching any surviving subscriber.
        const unused = [...this.#horizons].find(([id, cached]) => id !== key && cached.subscribers.size === 0);
        const [victimKey, victim] = unused ?? [key, job];
        // If no unused old slot exists, refuse this new acquisition rather than abort a peer.
        victim.controller.abort();
        clearTimeout(victim.timer);
        this.#horizons.delete(victimKey);
      }
    }
    if (!job.settled) {
      job.subscribers.add(operation);
      operation.horizon = job;
    } else if (job.completedAt !== null) {
      operation.sourceComplete = true;
      clearTimeout(operation.timer);
    }
    return job;
  }

  async #compileHorizon(root: { readonly runId: string; readonly decision: HintDecisionStamp; readonly fen: string; readonly engine?: { readonly id: string; readonly version: string } | undefined }, job: HorizonJob): Promise<HorizonOutcome> {
    const { signal } = job.controller;
    const cancelled = (): HorizonOutcome => Object.freeze({ kind: "source_unavailable", reason: job.failure ?? "cancelled" });
    if (!this.#live(job)) return cancelled();
    let engine = root.engine ?? null;
    if (engine === null) {
      try { engine = await untilAborted(signal, () => this.#requestedEngine()); }
      catch { return cancelled(); }
    }
    if (!this.#live(job)) return cancelled();
    if (engine === null) return Object.freeze({ kind: "source_unavailable", reason: "provider_unavailable" });
    const request: TypedProviderRequest<"stockfish.principal_variation@1"> = Object.freeze({
      operation: "stockfish.principal_variation@1" as const,
      request: Object.freeze({ fen: root.fen, requestedEngine: Object.freeze({ id: engine.id, version: engine.version }), bound: Object.freeze({ kind: "depth" as const, requestedDepth: this.#options.depth }), maxPlies: 4, timeoutMs: this.#options.timeoutMs }),
    });
    let result: TypedProviderResult<"stockfish.principal_variation@1">;
    try {
      const remaining = Math.floor(job.deadline - performance.now());
      if (remaining <= 0) { this.#endSource(job, "deadline_exceeded"); return cancelled(); }
      result = await untilAborted(signal, () => this.#options.scheduler!.get(request, { id: `hint:${root.runId}`, budgetMs: remaining }, signal));
    } catch {
      return Object.freeze({ kind: "source_unavailable", reason: job.failure ?? (signal.aborted ? "cancelled" : "provider_unavailable") });
    }
    if (!this.#live(job)) return cancelled();
    if (result.kind === "source_failure") return Object.freeze({ kind: "source_unavailable", reason: SOURCE_REASONS.includes(result.reason) ? result.reason : "provider_unavailable" });
    if (result.kind !== "success") { job.completedAt = performance.now(); return Object.freeze({ kind: "empty", reason: "terminal_position" }); }
    const expectedRequest = normalizedProviderRequestDigest(request.operation, normalizeProviderRequest(request.operation, request.request));
    if (result.delivery.acquisition.generation !== job.source.engine || result.normalizedRequestDigest !== expectedRequest
      || result.delivery.acquisition.normalizedRequestDigest !== expectedRequest) { this.#endSource(job, "identity_mismatch"); return cancelled(); }
    if (signal.aborted) return Object.freeze({ kind: "source_unavailable", reason: "cancelled" });
    const line = hintSearchLineEvidence(result.delivery);
    const packets = [];
    for (const beforeFen of hintPacketRoots(line)) {
      if (!this.#live(job)) return cancelled();
      const begun = this.#options.populations.begin(beforeFen);
      if (begun.kind !== "started") return Object.freeze({ kind: "failed" });
      for (;;) {
        if (!this.#live(job)) return cancelled();
        const step = this.#options.populations.advance(begun.entry, "events_and_readings");
        // One actual bounded stage, then a real macrotask and current authority before reading
        // or advancing again. A retired token never starts a replacement compilation.
        await new Promise<void>((resolve) => setImmediate(resolve));
        if (!this.#live(job)) return cancelled();
        if (step.kind === "pending") continue;
        if (step.kind !== "ready") return Object.freeze({ kind: "failed" });
        const sealed = this.#options.populations.read(begun.entry, "events_and_readings");
        if (sealed.kind !== "ready") return Object.freeze({ kind: "failed" });
        packets.push(sealed.receipt);
        break;
      }
    }
    if (!this.#live(job)) return cancelled();
    const selection = selectHintHorizon({ root: { runId: root.runId, branchId: root.decision.cursor.branchId, nodeId: root.decision.cursor.nodeId, fen: root.fen, eventHeadSeq: root.decision.eventHeadSeq }, line, packets });
    if (!this.#live(job)) return cancelled();
    job.completedAt = performance.now();
    return selection.kind === "selected" ? Object.freeze({ kind: "selected", horizon: selection.horizon }) : Object.freeze({ kind: "empty", reason: selection.reason });
  }

  async #voice(view: RenderedEvidenceView, sentence: string, signal: AbortSignal): Promise<HintVoiceState> {
    const voice = this.#options.voice;
    if (voice === undefined) return Object.freeze({ state: "fallback", reason: "provider_unavailable" });
    const controller = new AbortController();
    const onAbort = (): void => controller.abort();
    signal.addEventListener("abort", onAbort, { once: true });
    if (signal.aborted) controller.abort();
    const timeout = setTimeout(() => controller.abort(), this.#options.voiceTimeoutMs ?? 2_000);
    try {
      const output = await untilAborted(controller.signal, () => voice(view, sentence, controller.signal));
      if (controller.signal.aborted) throw new Error("cancelled");
      if (typeof output !== "string" || output.trim() === "") return Object.freeze({ state: "fallback", reason: "refused" });
      return hintVoiceCheck(view, output).valid ? Object.freeze({ state: "rendered", sentence: output }) : Object.freeze({ state: "fallback", reason: "invalid_output" });
    } catch {
      return Object.freeze({ state: "fallback", reason: controller.signal.aborted ? "deadline_exceeded" : "provider_unavailable" });
    } finally {
      clearTimeout(timeout);
      signal.removeEventListener("abort", onAbort);
    }
  }

  async #run(operation: Operation, engine?: { readonly id: string; readonly version: string }): Promise<void> {
    const { access } = operation;
    const { requestId, rung } = operation;
    if (!this.#current(operation)) return;
    const job = this.#horizon(operation, engine);
    const outcome = await untilAborted(operation.controller.signal, () => job.result);
    if (operation.settled || !this.#current(operation)) return;
    if (outcome.kind === "source_unavailable") { this.#settle(operation, Object.freeze({ state: "source_unavailable", requestId, rung, reason: outcome.reason })); return; }
    if (outcome.kind === "empty") { this.#settle(operation, Object.freeze({ state: "honest_empty", requestId, rung, reason: outcome.reason })); return; }
    if (outcome.kind === "failed") { this.#settle(operation, Object.freeze({ state: "failed", requestId, rung, reason: "internal_error" })); return; }
    const packet = compileGuidedHintPacket({ disclosure: compileHintDisclosureV2(outcome.horizon, rung), role: access.role, session: access.session });
    if (packet.kind !== "rendered") { this.#settle(operation, Object.freeze({ state: "failed", requestId, rung, reason: "contract_violation" })); return; }
    const sentence = packet.view.items[0]!.sentences.join(" ");
    if (!this.#current(operation)) return;
    const voice: HintVoiceState = access.voiceRequested ? await this.#voice(packet.view, sentence, operation.controller.signal) : Object.freeze({ state: "not_requested" });
    if (operation.settled || !this.#current(operation)) return;
    const delivery = compileHintDeliveryReceipt({ requestId, runId: access.run.id, decision: access.decision, packet, voice });
    this.#settle(operation, Object.freeze({ state: "available", delivery }));
  }
}
