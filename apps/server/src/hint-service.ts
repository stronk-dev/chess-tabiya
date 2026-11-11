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

export interface HintServiceOptions {
  /** The shared provider scheduler, or null when no analysis engine is configured. */
  readonly scheduler: HintProviderGateway | null;
  readonly requestedEngine: () => Promise<{ readonly id: string; readonly version: string } | null>;
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
  settled: boolean;
}

interface Operation {
  readonly key: string;
  readonly learnerId: string;
  readonly requestId: string;
  readonly runId: string;
  readonly rung: HintRung;
  readonly decisionDigest: string;
  readonly horizonKey: string;
  readonly controller: AbortController;
  readonly access: HintAccess;
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

  #source(): string {
    return this.#options.scheduler === null ? "stockfish:off" : `stockfish.principal_variation@1:depth:${this.#options.depth}:plies:4`;
  }

  requestIdFor(decisionDigest: string, rung: HintRung, clientRequestId: string): string {
    return hintRequestId({ clientRequestId, decisionDigest, rung, manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest, compiler: HINT_COMPILER_VERSION, source: this.#source() });
  }

  #operationKey(runId: string, learnerId: string, requestId: string): string {
    return JSON.stringify([runId, learnerId, requestId]);
  }

  /** §7 step 1–2: join or create the exact operation; returns its current state. */
  request(access: HintAccess, rung: HintRung, clientRequestId: string): HintResponse {
    const learnerId = access.learnerId;
    if (typeof learnerId !== "string" || learnerId.length === 0) throw new TypeError("Hint requests require an authenticated action owner");
    if (typeof access.writerId !== "string" || access.writerId.length === 0 || typeof access.revalidate !== "function") throw new TypeError("Hint requests require their original writer and live authority");
    access = Object.freeze({ ...access, assistance: parseRequestedAssistanceV1(access.assistance) });
    const requestId = this.requestIdFor(access.decision.digest, rung, clientRequestId);
    const key = this.#operationKey(access.run.id, learnerId, requestId);
    if (this.#closed) return Object.freeze({ state: "source_unavailable", requestId, rung, reason: "cancelled" });
    // Compile the complete family/rung contract before identity, search, packet or
    // voice acquisition, including requests that would reuse a retained horizon.
    // A malformed contract is not source absence or an uninformative chess position.
    try {
      compileEvidenceConsumerExecutionV2(PRIMARY_EVIDENCE_MANIFEST, { id: "module.guided_hint", version: 2 });
    } catch {
      return Object.freeze({ state: "failed", requestId, rung, reason: "contract_violation" });
    }
    if (this.#options.scheduler === null) return Object.freeze({ state: "source_unavailable", requestId, rung, reason: "provider_unavailable" });
    const health = this.#options.availability?.();
    if (health !== undefined && (health.state === "unavailable" || health.state === "temporarily_blocked") && !this.#operations.has(key)) {
      return Object.freeze({ state: "source_unavailable", requestId, rung, reason: "provider_unavailable" });
    }
    let operation = this.#operations.get(key);
    if (operation === undefined) {
      operation = { key, learnerId, requestId, runId: access.run.id, rung, decisionDigest: access.decision.digest, horizonKey: `${HINT_COMPILER_VERSION}\u0000${PRIMARY_EVIDENCE_MANIFEST.digest}\u0000${this.#source()}\u0000${access.run.id}\u0000${access.decision.digest}\u0000${access.fen}`, controller: new AbortController(), access, state: Object.freeze({ state: "pending", requestId, rung }), settled: false, lastUsed: ++this.#clock };
      this.#operations.set(key, operation);
      this.#evict();
      const work = this.#run(operation).catch(() => this.#settle(operation!, Object.freeze({ state: "failed", requestId, rung, reason: "internal_error" })));
      this.#inflight.add(work);
      void work.finally(() => this.#inflight.delete(work));
    } else if (operation.access.writerId !== access.writerId || operation.access.assistance.requestDigest !== access.assistance.requestDigest) {
      return this.#current(operation) ? Object.freeze({ state: "failed", requestId, rung, reason: "contract_violation" }) : operation.state;
    }
    operation.lastUsed = ++this.#clock;
    this.#current(operation);
    return operation.state;
  }

  /** §7 step 3: poll one exact operation; a moved decision is `stale` and cancels the work. */
  poll(runId: string, requestId: string, currentDecision: HintDecisionStamp, learnerId: string): HintResponse {
    const operation = this.#operations.get(this.#operationKey(runId, learnerId, requestId));
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
    const operation = this.#operations.get(this.#operationKey(runId, learnerId, requestId));
    if (operation === undefined || operation.runId !== runId || operation.learnerId !== learnerId) throw new ServerError("HINT_REQUEST_NOT_FOUND", "This hint request is not known here; nothing to cancel");
    this.#drop(operation);
    return Object.freeze({ state: "cancelled", requestId, rung: operation.rung });
  }

  #drop(operation: Operation): void {
    if (this.#operations.get(operation.key) === operation) this.#operations.delete(operation.key);
    operation.controller.abort();
    if (!operation.settled) {
      operation.settled = true;
      this.#release(operation);
    }
  }

  #release(operation: Operation): void {
    const job = operation.horizon;
    if (job === undefined) return;
    delete operation.horizon;
    job.subscribers.delete(operation);
    if (!job.settled && job.subscribers.size === 0) {
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
    operation.state = state;
    this.#release(operation);
  }

  #current(operation: Operation): boolean {
    if (operation.controller.signal.aborted) return false;
    let state: HintResponse;
    try {
      if (operation.access.revalidate()) return true;
      state = Object.freeze({ state: "stale", requestId: operation.requestId, rung: operation.rung });
    } catch {
      state = Object.freeze({ state: "failed", requestId: operation.requestId, rung: operation.rung, reason: "internal_error" });
    }
    // Also retire already delivered cached actions: a once-valid receipt is not live permission.
    operation.state = state;
    operation.settled = true;
    operation.controller.abort();
    this.#release(operation);
    return false;
  }

  #live(job: HorizonJob): boolean {
    if (job.controller.signal.aborted) return false;
    for (const operation of [...job.subscribers]) this.#current(operation);
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

  #horizon(operation: Operation): HorizonJob {
    const key = operation.horizonKey;
    const { access } = operation;
    let job = this.#horizons.get(key);
    if (job === undefined) {
      const controller = new AbortController();
      // Source work retains only its pure root, never the creator's permission or whole access.
      const root = Object.freeze({ runId: operation.runId, decision: access.decision, fen: access.fen });
      const created: HorizonJob = { controller, result: Promise.resolve().then(() => this.#compileHorizon(root, created)), subscribers: new Set(), settled: false };
      job = created;
      this.#horizons.set(key, job);
      const complete = (): void => {
        created.settled = true;
        for (const subscriber of created.subscribers) delete subscriber.horizon;
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
        this.#horizons.delete(victimKey);
      }
    }
    if (!job.settled) {
      job.subscribers.add(operation);
      operation.horizon = job;
    }
    return job;
  }

  async #compileHorizon(root: { readonly runId: string; readonly decision: HintDecisionStamp; readonly fen: string }, job: HorizonJob): Promise<HorizonOutcome> {
    const { signal } = job.controller;
    const cancelled = (): HorizonOutcome => Object.freeze({ kind: "source_unavailable", reason: "cancelled" });
    if (!this.#live(job)) return cancelled();
    const engine = await untilAborted(signal, () => this.#requestedEngine());
    if (!this.#live(job)) return cancelled();
    if (engine === null) return Object.freeze({ kind: "source_unavailable", reason: "provider_unavailable" });
    const request: TypedProviderRequest<"stockfish.principal_variation@1"> = Object.freeze({
      operation: "stockfish.principal_variation@1" as const,
      request: Object.freeze({ fen: root.fen, requestedEngine: Object.freeze({ id: engine.id, version: engine.version }), bound: Object.freeze({ kind: "depth" as const, requestedDepth: this.#options.depth }), maxPlies: 4, timeoutMs: this.#options.timeoutMs }),
    });
    let result: TypedProviderResult<"stockfish.principal_variation@1">;
    try {
      result = await untilAborted(signal, () => this.#options.scheduler!.get(request, { id: `hint:${root.runId}`, budgetMs: this.#options.timeoutMs + 1_000 }, signal));
    } catch {
      return Object.freeze({ kind: "source_unavailable", reason: signal.aborted ? "cancelled" : "provider_unavailable" });
    }
    if (!this.#live(job)) return cancelled();
    if (result.kind === "source_failure") return Object.freeze({ kind: "source_unavailable", reason: SOURCE_REASONS.includes(result.reason) ? result.reason : "provider_unavailable" });
    if (result.kind !== "success") return Object.freeze({ kind: "empty", reason: "terminal_position" });
    if (signal.aborted) return Object.freeze({ kind: "source_unavailable", reason: "cancelled" });
    const line = hintSearchLineEvidence(result.delivery);
    const packets = [];
    for (const beforeFen of hintPacketRoots(line)) {
      if (!this.#live(job)) return cancelled();
      const lookup = this.#options.populations.wide(beforeFen);
      if (lookup.kind !== "ready") return Object.freeze({ kind: "failed" });
      packets.push(lookup.receipt);
      // Yield between complete packets so one hint never monopolizes the event loop.
      await new Promise<void>((resolve) => setImmediate(resolve));
      if (!this.#live(job)) return cancelled();
    }
    if (!this.#live(job)) return cancelled();
    const selection = selectHintHorizon({ root: { runId: root.runId, branchId: root.decision.cursor.branchId, nodeId: root.decision.cursor.nodeId, fen: root.fen, eventHeadSeq: root.decision.eventHeadSeq }, line, packets });
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

  async #run(operation: Operation): Promise<void> {
    const { access } = operation;
    const { requestId, rung } = operation;
    if (!this.#current(operation)) return;
    const job = this.#horizon(operation);
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
