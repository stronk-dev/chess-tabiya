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
  compileGuidedHintPacket,
  compileHintDeliveryReceipt,
  compileHintDisclosure,
  hintPacketRoots,
  hintRequestId,
  hintSearchLineEvidence,
  hintVoiceCheck,
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
  subscribers: number;
}

interface Operation {
  readonly requestId: string;
  readonly runId: string;
  readonly rung: HintRung;
  readonly decisionDigest: string;
  readonly horizonKey: string;
  state: HintResponse;
  settled: boolean;
  lastUsed: number;
}

const SOURCE_REASONS: readonly HintSourceReason[] = ["provider_unavailable", "deadline_exceeded", "queue_full", "cancelled", "invalid_response", "identity_mismatch"];

export class HintService {
  readonly #options: HintServiceOptions;
  readonly #operations = new Map<string, Operation>();
  readonly #horizons = new Map<string, HorizonJob>();
  readonly #inflight = new Set<Promise<void>>();
  #clock = 0;
  #engine: Promise<{ readonly id: string; readonly version: string } | null> | undefined;

  constructor(options: HintServiceOptions) {
    for (const [label, value] of [["depth", options.depth], ["timeoutMs", options.timeoutMs], ["maxOperations", options.maxOperations]] as const) {
      if (!Number.isSafeInteger(value) || value < 1) throw new TypeError(`HintService ${label} must be a positive safe integer`);
    }
    // Criterion 15: the one application-lifetime packet service is injected; a request-local cache is refused.
    if (!(options.populations instanceof CandidatePopulationService)) throw new TypeError("HintService requires the injected CandidatePopulationService");
    this.#options = options;
  }

  /** Resolves when no hint work is in flight (tests and graceful shutdown). */
  async whenIdle(): Promise<void> {
    while (this.#inflight.size > 0) await Promise.allSettled([...this.#inflight]);
  }

  get operationCount(): number { return this.#operations.size; }

  #source(): string {
    return this.#options.scheduler === null ? "stockfish:off" : `stockfish.principal_variation@1:depth:${this.#options.depth}:plies:4`;
  }

  requestIdFor(decisionDigest: string, rung: HintRung): string {
    return hintRequestId({ decisionDigest, rung, manifestDigest: PRIMARY_EVIDENCE_MANIFEST.digest, compiler: HINT_COMPILER_VERSION, source: this.#source() });
  }

  /** §7 step 1–2: join or create the exact operation; returns its current state. */
  request(access: HintAccess, rung: HintRung): HintResponse {
    const requestId = this.requestIdFor(access.decision.digest, rung);
    if (this.#options.scheduler === null) return Object.freeze({ state: "source_unavailable", requestId, rung, reason: "provider_unavailable" });
    const health = this.#options.availability?.();
    if (health !== undefined && (health.state === "unavailable" || health.state === "temporarily_blocked") && !this.#operations.has(requestId)) {
      return Object.freeze({ state: "source_unavailable", requestId, rung, reason: "provider_unavailable" });
    }
    let operation = this.#operations.get(requestId);
    if (operation === undefined) {
      operation = { requestId, runId: access.run.id, rung, decisionDigest: access.decision.digest, horizonKey: `${access.run.id}\u0000${access.decision.cursor.nodeId}\u0000${access.fen}`, state: Object.freeze({ state: "pending", requestId, rung }), settled: false, lastUsed: ++this.#clock };
      this.#operations.set(requestId, operation);
      this.#evict();
      const work = this.#run(operation, access).catch(() => this.#settle(operation!, Object.freeze({ state: "failed", requestId, rung, reason: "internal_error" })));
      this.#inflight.add(work);
      void work.finally(() => this.#inflight.delete(work));
    }
    operation.lastUsed = ++this.#clock;
    return operation.state;
  }

  /** §7 step 3: poll one exact operation; a moved decision is `stale` and cancels the work. */
  poll(runId: string, requestId: string, currentDecision: HintDecisionStamp): HintResponse {
    const operation = this.#operations.get(requestId);
    if (operation === undefined || operation.runId !== runId) throw new ServerError("HINT_REQUEST_NOT_FOUND", "This hint request is not known here; request the hint again");
    operation.lastUsed = ++this.#clock;
    if (operation.decisionDigest !== currentDecision.digest) {
      this.#drop(operation);
      return Object.freeze({ state: "stale", requestId, rung: operation.rung });
    }
    return operation.state;
  }

  /** §7 step 4: remove this waiter; the shared search is aborted when its final subscriber leaves. */
  cancel(runId: string, requestId: string): HintResponse {
    const operation = this.#operations.get(requestId);
    if (operation === undefined || operation.runId !== runId) throw new ServerError("HINT_REQUEST_NOT_FOUND", "This hint request is not known here; nothing to cancel");
    this.#drop(operation);
    return Object.freeze({ state: "cancelled", requestId, rung: operation.rung });
  }

  #drop(operation: Operation): void {
    this.#operations.delete(operation.requestId);
    if (!operation.settled) {
      operation.settled = true;
      this.#release(operation.horizonKey);
    }
  }

  #release(key: string): void {
    const job = this.#horizons.get(key);
    if (job === undefined) return;
    job.subscribers -= 1;
    if (job.subscribers <= 0) {
      job.controller.abort();
      this.#horizons.delete(key);
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
    // The horizon stays cached for the decision's other rungs; only a subscriber count is released.
    const job = this.#horizons.get(operation.horizonKey);
    if (job !== undefined) job.subscribers = Math.max(0, job.subscribers - 1);
  }

  #requestedEngine(): Promise<{ readonly id: string; readonly version: string } | null> {
    this.#engine ??= this.#options.requestedEngine().catch(() => null);
    return this.#engine;
  }

  #horizon(key: string, access: HintAccess): HorizonJob {
    let job = this.#horizons.get(key);
    if (job === undefined) {
      const controller = new AbortController();
      job = { controller, result: this.#compileHorizon(access, controller.signal), subscribers: 0 };
      this.#horizons.set(key, job);
      while (this.#horizons.size > this.#options.maxOperations) {
        const oldest = this.#horizons.keys().next().value!;
        if (oldest === key) break;
        this.#horizons.get(oldest)!.controller.abort();
        this.#horizons.delete(oldest);
      }
    }
    job.subscribers += 1;
    return job;
  }

  async #compileHorizon(access: HintAccess, signal: AbortSignal): Promise<HorizonOutcome> {
    const engine = await this.#requestedEngine();
    if (engine === null) return Object.freeze({ kind: "source_unavailable", reason: "provider_unavailable" });
    const request: TypedProviderRequest<"stockfish.principal_variation@1"> = Object.freeze({
      operation: "stockfish.principal_variation@1" as const,
      request: Object.freeze({ fen: access.fen, requestedEngine: Object.freeze({ id: engine.id, version: engine.version }), bound: Object.freeze({ kind: "depth" as const, requestedDepth: this.#options.depth }), maxPlies: 4, timeoutMs: this.#options.timeoutMs }),
    });
    let result: TypedProviderResult<"stockfish.principal_variation@1">;
    try {
      result = await this.#options.scheduler!.get(request, { id: `hint:${access.run.id}`, budgetMs: this.#options.timeoutMs + 1_000 }, signal);
    } catch {
      return Object.freeze({ kind: "source_unavailable", reason: signal.aborted ? "cancelled" : "provider_unavailable" });
    }
    if (result.kind === "source_failure") return Object.freeze({ kind: "source_unavailable", reason: SOURCE_REASONS.includes(result.reason) ? result.reason : "provider_unavailable" });
    if (result.kind !== "success") return Object.freeze({ kind: "empty", reason: "terminal_position" });
    if (signal.aborted) return Object.freeze({ kind: "source_unavailable", reason: "cancelled" });
    const line = hintSearchLineEvidence(result.delivery);
    const packets = [];
    for (const beforeFen of hintPacketRoots(line)) {
      const lookup = this.#options.populations.wide(beforeFen);
      if (lookup.kind !== "ready") return Object.freeze({ kind: "failed" });
      packets.push(lookup.receipt);
      // Yield between complete packets so one hint never monopolizes the event loop.
      await new Promise<void>((resolve) => setImmediate(resolve));
      if (signal.aborted) return Object.freeze({ kind: "source_unavailable", reason: "cancelled" });
    }
    const selection = selectHintHorizon({ root: { runId: access.run.id, branchId: access.decision.cursor.branchId, nodeId: access.decision.cursor.nodeId, fen: access.fen, eventHeadSeq: access.decision.eventHeadSeq }, line, packets });
    return selection.kind === "selected" ? Object.freeze({ kind: "selected", horizon: selection.horizon }) : Object.freeze({ kind: "empty", reason: selection.reason });
  }

  async #voice(view: RenderedEvidenceView, sentence: string): Promise<HintVoiceState> {
    const voice = this.#options.voice;
    if (voice === undefined) return Object.freeze({ state: "fallback", reason: "provider_unavailable" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#options.voiceTimeoutMs ?? 2_000);
    try {
      const output = await Promise.race([
        voice(view, sentence, controller.signal),
        new Promise<never>((_, reject) => controller.signal.addEventListener("abort", () => reject(new Error("deadline_exceeded")), { once: true })),
      ]);
      if (typeof output !== "string" || output.trim() === "") return Object.freeze({ state: "fallback", reason: "refused" });
      return hintVoiceCheck(view, output).valid ? Object.freeze({ state: "rendered", sentence: output }) : Object.freeze({ state: "fallback", reason: "invalid_output" });
    } catch {
      return Object.freeze({ state: "fallback", reason: controller.signal.aborted ? "deadline_exceeded" : "provider_unavailable" });
    } finally {
      clearTimeout(timeout);
    }
  }

  async #run(operation: Operation, access: HintAccess): Promise<void> {
    const { requestId, rung } = operation;
    const outcome = await this.#horizon(operation.horizonKey, access).result;
    if (operation.settled) return;
    if (outcome.kind === "source_unavailable") { this.#settle(operation, Object.freeze({ state: "source_unavailable", requestId, rung, reason: outcome.reason })); return; }
    if (outcome.kind === "empty") { this.#settle(operation, Object.freeze({ state: "honest_empty", requestId, rung, reason: outcome.reason })); return; }
    if (outcome.kind === "failed") { this.#settle(operation, Object.freeze({ state: "failed", requestId, rung, reason: "internal_error" })); return; }
    const packet = compileGuidedHintPacket({ disclosure: compileHintDisclosure(outcome.horizon, rung), role: access.role, session: access.session });
    if (packet.kind !== "rendered") { this.#settle(operation, Object.freeze({ state: "failed", requestId, rung, reason: "contract_violation" })); return; }
    const sentence = packet.view.items[0]!.sentences.join(" ");
    const voice: HintVoiceState = access.voiceRequested ? await this.#voice(packet.view, sentence) : Object.freeze({ state: "not_requested" });
    if (operation.settled) return;
    const delivery = compileHintDeliveryReceipt({ requestId, runId: access.run.id, decision: access.decision, packet, voice });
    this.#settle(operation, Object.freeze({ state: "available", delivery }));
  }
}
