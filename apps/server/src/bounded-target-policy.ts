/**
 * The bounded target policy composition operation (rfc/bounded-target-policy-composition.md §5;
 * ledger D1655 production operation, D1658 bounded execution contract).
 *
 * `BoundedTargetPolicyCompositionOperation.evaluate(request, scope, signal)` derives the exact local
 * facts through the bounded-target background service, fetches raw receipts only through the ONE
 * shared `ProviderExchangeScheduler` (legal-root tables at depths 8 and 10; one exact-FEN Maia root
 * page plus at most eight exact-FEN expansion pages — at most two plus nine provider calls per
 * row), seals them through their sole source factories, and composes the two reported readings
 * through the runtime's value routes. It keeps no private cache or queue: exact provider requests
 * coalesce in the scheduler, whose bounds cap concurrency, queueing, retention and deadlines.
 * Cancellation propagates to every queued and active provider request; a late result is dropped.
 * Process-local operator/research operation: no HTTP route, zero learner bindings.
 */
import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import {
  BOT_MAIA_MODEL,
  MAIA_POLICY_PARAMETERS,
  boundedTargetSourceEvidence,
  derivedBoundedTargetPolicyEvidence,
  maiaExpansionMoves,
  maiaRequestedWidth,
  providerSourceEvidence,
  type BoundedTargetBackgroundService,
  type BoundedTargetBatchResult,
  type BoundedTargetImmediateEvidence,
  type BoundedTargetPolicyBoundsFactoryResult,
  type BoundedTargetReturnEvidence,
  type DeclaredEvidence,
  type EngineTargetPolicyFactoryResult,
  type MaiaPageEvidence,
  type MaiaPolicyPageRequest,
  type NamedMaterialTargetEvidence,
  type StockfishLegalRootTableRequest,
  type StockfishTableEvidence,
  type TypedProviderResult,
} from "@chess-tabiya/runtime";

import type { ProviderExchangeScheduler, ProviderRequestScope } from "./provider-exchange.js";

export type BoundedTargetPolicyArms = "stockfish" | "maia" | "both";

export interface BoundedTargetPolicyRequest {
  /** The source position; the operation derives the complete local facts itself. */
  readonly sourceFen: string;
  /** The exact named target's capture identity under `bounded-target@1`. */
  readonly captureUci: string;
  readonly candidateUci: string;
  readonly counterfactualUci: string;
  readonly arms: BoundedTargetPolicyArms;
  /** One declared applied Maia band; required when the Maia arm is requested. */
  readonly band?: number;
}

export type BoundedTargetPolicyRefusal = "invalid_request" | "target_not_found" | "candidate_not_found" | "local_facts_unavailable" | "cancelled";

export interface BoundedTargetPolicyLocalFacts {
  readonly target: NamedMaterialTargetEvidence;
  readonly immediate: BoundedTargetImmediateEvidence;
  readonly boundedReturn: BoundedTargetReturnEvidence | null;
}

export type BoundedTargetPolicyResult =
  | { readonly kind: "refused"; readonly reason: BoundedTargetPolicyRefusal; readonly detail?: string }
  | {
      readonly kind: "completed";
      readonly local: BoundedTargetPolicyLocalFacts;
      readonly stockfish: EngineTargetPolicyFactoryResult | null;
      readonly maia: BoundedTargetPolicyBoundsFactoryResult | null;
    };

export interface BoundedTargetPolicyCompositionDependencies {
  /** The local derivation operation (`BoundedTargetBackgroundService`). */
  readonly targets: BoundedTargetBackgroundService;
  /** The one shared provider scheduler (its descriptors are `StockfishLegalRootTableOperation` and `MaiaPolicyPageOperation`). */
  readonly scheduler: ProviderExchangeScheduler;
  /** The Stockfish analysis identity the table request names. */
  readonly requestedEngine: () => Promise<Readonly<{ id: string; version: string }>>;
  /** Per-call provider timeout inside the caller's scope budget. */
  readonly providerTimeoutMs: number;
}

const ENGINE_DEPTHS = Object.freeze([8, 10] as const);

type EngineAbstention = Extract<EngineTargetPolicyFactoryResult, { readonly kind: "abstained" }>;
type MaiaAbstention = Extract<BoundedTargetPolicyBoundsFactoryResult, { readonly kind: "abstained" }>;

const engineAbstained = (reason: EngineAbstention["reason"]): EngineAbstention => Object.freeze({ kind: "abstained", projection: Object.freeze({ id: "derived.bounded_target.engine_target_policy" as const, version: 1 as const }), reason });
const maiaAbstained = (reason: MaiaAbstention["reason"]): MaiaAbstention => Object.freeze({ kind: "abstained", projection: Object.freeze({ id: "derived.bounded_target.policy_bounds" as const, version: 1 as const }), reason });

/** The closed provider-failure map: a refused page is never a negative observation. */
function maiaFailure(result: TypedProviderResult<"maia.policy_page@1">): MaiaAbstention["reason"] {
  if (result.kind !== "source_failure") return "provider_unavailable";
  switch (result.reason) {
    case "deadline_exceeded": return "timeout";
    case "cancelled": return "cancelled";
    case "identity_mismatch": case "invalid_response": return "identity_or_generation_mismatch";
    case "queue_full": return "expansion_budget_exhausted";
    default: return "provider_unavailable";
  }
}

export class BoundedTargetPolicyCompositionOperation {
  readonly #dependencies: BoundedTargetPolicyCompositionDependencies;

  constructor(dependencies: BoundedTargetPolicyCompositionDependencies) {
    if (!Number.isSafeInteger(dependencies.providerTimeoutMs) || dependencies.providerTimeoutMs <= 0) throw new RangeError("providerTimeoutMs must be a positive integer");
    this.#dependencies = Object.freeze({ ...dependencies });
  }

  async evaluate(request: BoundedTargetPolicyRequest, scope: ProviderRequestScope, signal: AbortSignal): Promise<BoundedTargetPolicyResult> {
    if (!isRequest(request)) return Object.freeze({ kind: "refused", reason: "invalid_request" });
    if (signal.aborted) return Object.freeze({ kind: "refused", reason: "cancelled" });
    let source;
    try {
      source = boundedTargetSourceEvidence(request.sourceFen);
    } catch (error) {
      return Object.freeze({ kind: "refused", reason: "invalid_request", detail: error instanceof Error ? error.message : String(error) });
    }
    const batch: BoundedTargetBatchResult = await this.#dependencies.targets.submit({ kind: "source_position_batch", ...source }, signal);
    if (batch.kind === "cancelled") return Object.freeze({ kind: "refused", reason: "cancelled" });
    if (batch.kind !== "completed") return Object.freeze({ kind: "refused", reason: "local_facts_unavailable", detail: batch.kind === "rejected" ? "invalid_request" : batch.reason });
    const derivation = batch.targets.find((value) => value.target.payload.captureUci === request.captureUci);
    if (derivation === undefined) return Object.freeze({ kind: "refused", reason: "target_not_found" });
    const candidate = derivation.candidates.find((value) => value.kind !== "abstained" && value.immediate.payload.candidateUci === request.candidateUci);
    if (candidate === undefined || candidate.kind === "abstained") return Object.freeze({ kind: "refused", reason: "candidate_not_found" });
    const boundedReturn = candidate.kind === "removed" ? (candidate.boundedReturn.kind === "evidence" ? candidate.boundedReturn.item : undefined) : null;
    if (boundedReturn === undefined) return Object.freeze({ kind: "refused", reason: "local_facts_unavailable", detail: "bounded return budget_exhausted" });
    const local: BoundedTargetPolicyLocalFacts = Object.freeze({ target: derivation.target, immediate: candidate.immediate, boundedReturn });
    const wantsStockfish = request.arms !== "maia";
    const wantsMaia = request.arms !== "stockfish";
    const [stockfish, maia] = await Promise.all([
      wantsStockfish ? this.#stockfish(local, request, scope, signal) : Promise.resolve(null),
      wantsMaia ? this.#maia(local, request, scope, signal) : Promise.resolve(null),
    ]);
    if (signal.aborted) return Object.freeze({ kind: "refused", reason: "cancelled" });
    return Object.freeze({ kind: "completed", local, stockfish, maia });
  }

  async #stockfish(local: BoundedTargetPolicyLocalFacts, request: BoundedTargetPolicyRequest, scope: ProviderRequestScope, signal: AbortSignal): Promise<EngineTargetPolicyFactoryResult> {
    let engine: Awaited<ReturnType<BoundedTargetPolicyCompositionDependencies["requestedEngine"]>>;
    try {
      engine = await this.#dependencies.requestedEngine();
    } catch {
      // Acquisition failure is missing input, not loss of valid local facts or a peer arm.
      return engineAbstained("input_abstained");
    }
    if (signal.aborted) return engineAbstained("input_abstained");
    const results = await Promise.all(ENGINE_DEPTHS.map((depth) => this.#dependencies.scheduler.get({
      operation: "stockfish.legal_root_table@1",
      request: Object.freeze({ fen: local.immediate.payload.afterFen, bound: Object.freeze({ kind: "depth", value: depth }), requestedWidth: "all_legal", moveIdentity: "chessops-king-takes-rook@1", requestedEngine: Object.freeze({ id: engine.id, version: engine.version }), timeoutMs: this.#dependencies.providerTimeoutMs }) satisfies StockfishLegalRootTableRequest,
    }, scope, signal).catch(() => undefined)));
    if (signal.aborted) return engineAbstained("input_abstained");
    const tables: StockfishTableEvidence[] = [];
    for (const result of results) {
      if (result?.kind !== "success") return engineAbstained("input_abstained");
      tables.push(providerSourceEvidence("stockfish.legal_root_table@1", result.delivery) as unknown as StockfishTableEvidence);
    }
    return derivedBoundedTargetPolicyEvidence("engine", { ...localInputs(local, request), tables }) as EngineTargetPolicyFactoryResult;
  }

  async #maia(local: BoundedTargetPolicyLocalFacts, request: BoundedTargetPolicyRequest, scope: ProviderRequestScope, signal: AbortSignal): Promise<BoundedTargetPolicyBoundsFactoryResult> {
    const band = request.band!;
    const page = (fen: string): Promise<TypedProviderResult<"maia.policy_page@1"> | undefined> => maiaRequestedWidth(fen) === 0 ? Promise.resolve(undefined) : this.#dependencies.scheduler.get({
      operation: "maia.policy_page@1",
      request: Object.freeze({ position: Object.freeze({ kind: "exact_fen", fen }), requestedModel: Object.freeze({ id: BOT_MAIA_MODEL.id, version: BOT_MAIA_MODEL.version }), band, temperature: MAIA_POLICY_PARAMETERS.temperature, topP: MAIA_POLICY_PARAMETERS.topP, requestedWidth: maiaRequestedWidth(fen), timeoutMs: this.#dependencies.providerTimeoutMs }) satisfies MaiaPolicyPageRequest,
    }, scope, signal).catch(() => undefined);
    const rootResult = await page(local.immediate.payload.afterFen);
    if (rootResult?.kind !== "success") return maiaAbstained(rootResult === undefined ? "provider_unavailable" : maiaFailure(rootResult));
    const root = providerSourceEvidence("maia.policy_page@1", rootResult.delivery) as unknown as MaiaPageEvidence;
    const moves = maiaExpansionMoves(root.payload.payload);
    const children = await Promise.all(moves.map((move) => page(childFen(local.immediate.payload.afterFen, move))));
    if (signal.aborted) return maiaAbstained("cancelled");
    const second: MaiaPageEvidence[] = [];
    for (const result of children) {
      if (result?.kind !== "success") return maiaAbstained(result === undefined ? "provider_unavailable" : maiaFailure(result));
      second.push(providerSourceEvidence("maia.policy_page@1", result.delivery) as unknown as MaiaPageEvidence);
    }
    return derivedBoundedTargetPolicyEvidence("maia", { ...localInputs(local, request), band, root, second }) as BoundedTargetPolicyBoundsFactoryResult;
  }
}

function localInputs(local: BoundedTargetPolicyLocalFacts, request: BoundedTargetPolicyRequest): { readonly target: DeclaredEvidence<unknown>; readonly immediate: DeclaredEvidence<unknown>; readonly boundedReturn?: DeclaredEvidence<unknown>; readonly counterfactualUci: string } {
  return Object.freeze({ target: local.target, immediate: local.immediate, ...(local.boundedReturn === null ? {} : { boundedReturn: local.boundedReturn }), counterfactualUci: request.counterfactualUci });
}

function childFen(fen: string, uci: string): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  position.play(normalizeMove(position, parseUci(uci)!));
  return makeFen(position.toSetup());
}

const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/u;
function isRequest(value: unknown): value is BoundedTargetPolicyRequest {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort().join(",");
  const expected = record.arms === "stockfish" ? "arms,candidateUci,captureUci,counterfactualUci,sourceFen" : "arms,band,candidateUci,captureUci,counterfactualUci,sourceFen";
  if (keys !== expected) return false;
  if (!["stockfish", "maia", "both"].includes(record.arms as string)) return false;
  if (typeof record.sourceFen !== "string" || ![record.captureUci, record.candidateUci, record.counterfactualUci].every((move) => typeof move === "string" && UCI.test(move))) return false;
  if (record.candidateUci === record.counterfactualUci) return false;
  return record.band === undefined || Number.isSafeInteger(record.band);
}
