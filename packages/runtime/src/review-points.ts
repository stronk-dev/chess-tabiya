// rfc/review-evidence-compiler.md §§1–3: the typed Review payloads and the pure comparisons they
// retain. Nothing here mints evidence (the factories in `evidence-factories.ts` do), selects a
// moment or renders prose. Cp is never clamped and a mate score is never converted to cp.

import type { DeclaredEvidence } from "./evidence-contract.js";
import type { ForcedMateAfterMoveProof } from "./mate-proof.js";
import type { FixedBoundPositionEvaluation, FixedBoundPrincipalVariation, ProviderEvidenceDelivery } from "./provider-types.js";

/** `run.record.position@1`. */
export interface RecordedPosition {
  readonly nodeId: string;
  readonly ply: number;
  readonly fen: string;
}

/** The one shared node-free engine source (`live.stockfish.position_eval@1`). */
export type StockfishPositionEvaluation = ProviderEvidenceDelivery<FixedBoundPositionEvaluation, "stockfish.position_evaluation@1">;
/** The node-free bounded engine line (`live.stockfish.principal_variation@1`), read only by Analyze. */
export type StockfishPrincipalVariation = ProviderEvidenceDelivery<FixedBoundPrincipalVariation, "stockfish.principal_variation@1">;
export type ReviewEngineScore = FixedBoundPositionEvaluation["score"];
export type ReviewSearchBound = FixedBoundPositionEvaluation["bound"];
export interface ReviewEngineIdentity { readonly id: string; readonly name: string; readonly version: string }

/** `derived.review.eval_point@1`: one delivery joined to one exact recorded occurrence. */
export interface ReviewEnginePoint {
  readonly projectionId: "derived.review.eval_point@1";
  readonly position: DeclaredEvidence<RecordedPosition>;
  readonly evaluation: DeclaredEvidence<StockfishPositionEvaluation>;
}

/** `derived.review.eval_delta@1`: cp→cp only, White perspective, both points retained. */
export interface ReviewEvalDelta {
  readonly projectionId: "derived.review.eval_delta@1";
  readonly before: DeclaredEvidence<ReviewEnginePoint>;
  readonly after: DeclaredEvidence<ReviewEnginePoint>;
  readonly deltaCp: number;
}

export const MATE_TRANSITION_KINDS = Object.freeze(["appeared", "disappeared", "side_changed", "distance_changed"] as const);
export type MateTransitionKind = (typeof MATE_TRANSITION_KINDS)[number];

/** `derived.review.mate_transition@1`. */
export interface ReviewMateTransition {
  readonly projectionId: "derived.review.mate_transition@1";
  readonly before: DeclaredEvidence<ReviewEnginePoint>;
  readonly after: DeclaredEvidence<ReviewEnginePoint>;
  readonly changes: readonly [MateTransitionKind, ...MateTransitionKind[]];
}

/** `derived.review.wdl_white@1`: node-free, normalized once to White. */
export interface WhiteWdlPoint {
  readonly projectionId: "derived.review.wdl_white@1";
  readonly source: DeclaredEvidence<StockfishPositionEvaluation>;
  readonly fen: string;
  readonly rawSubject: "white" | "black";
  readonly perspective: "white";
  readonly win: number;
  readonly draw: number;
  readonly loss: number;
}

/** `derived.review.wdl_point@1`. */
export interface ReviewWdlPoint {
  readonly projectionId: "derived.review.wdl_point@1";
  readonly position: DeclaredEvidence<RecordedPosition>;
  readonly normalized: DeclaredEvidence<WhiteWdlPoint>;
}

/** `rules.tactic.consequence.forced_mate_after_move@2`: exactly the declared operands. */
export type ForcedMateAfterMoveProofV2 = Pick<ForcedMateAfterMoveProof,
  "beforeFen" | "candidate" | "afterFen" | "attacker" | "maxAttackerMoves" | "proofStatus" | "proofDigest" | "rootReplies" | "nodes">;

/** The closed wire image of one typed score (§4 `ReviewScoreReceipt`). */
export type ReviewScoreReceipt =
  | { readonly kind: "centipawns"; readonly value: number }
  | { readonly kind: "mate"; readonly side: "white" | "black"; readonly distance: number; readonly unit: "moves" };

export function reviewScoreReceipt(score: ReviewEngineScore): ReviewScoreReceipt {
  return score.kind === "centipawns"
    ? Object.freeze({ kind: "centipawns" as const, value: score.value })
    : Object.freeze({ kind: "mate" as const, side: score.side, distance: score.distance, unit: "moves" as const });
}

/** The side to move of a canonical FEN. */
export function sideToMove(fen: string): "white" | "black" {
  const turn = fen.split(" ")[1];
  if (turn !== "w" && turn !== "b") throw new TypeError("Review FEN has no valid side to move");
  return turn === "w" ? "white" : "black";
}

/**
 * The position-free search command image of a delivery. The normalized command digest names the
 * position (`position fen …`), so two positions can never share it; comparability compares the
 * remaining commands, which fix the engine options and the requested bound.
 */
export function searchCommandImage(evaluation: StockfishPositionEvaluation): string {
  return evaluation.acquisition.requestedIdentity.command.commands.filter((command) => !command.startsWith("position ")).join("\n");
}

function requestedBoundKey(bound: ReviewSearchBound): string {
  return bound.kind === "movetime" ? `movetime:${bound.requestedMs}` : bound.kind === "depth" ? `depth:${bound.requestedDepth}` : `nodes:${bound.requestedNodes}`;
}

export type ReviewComparability = "comparable" | "engine_mismatch" | "bound_mismatch";

/**
 * §3: two points compare only when their deliveries share the actual engine id/version, provider
 * generation, position-free command image and requested bound. A mismatch abstains rather than
 * subtracting measurements with different operands.
 */
export function reviewPointComparability(before: ReviewEnginePoint, after: ReviewEnginePoint): ReviewComparability {
  const left = before.evaluation.payload;
  const right = after.evaluation.payload;
  const leftActual = left.acquisition.actualIdentity;
  const rightActual = right.acquisition.actualIdentity;
  if (leftActual.id !== rightActual.id || leftActual.version !== rightActual.version || left.acquisition.generation !== right.acquisition.generation) return "engine_mismatch";
  if (requestedBoundKey(left.payload.bound) !== requestedBoundKey(right.payload.bound) || searchCommandImage(left) !== searchCommandImage(right)) return "bound_mismatch";
  return "comparable";
}

/**
 * §3.2: the typed mate-state change between two scores, in the enum order. Returns the literal
 * abstention reason when no transition exists.
 */
export function mateTransitionChanges(before: ReviewEngineScore, after: ReviewEngineScore): readonly [MateTransitionKind, ...MateTransitionKind[]] | "no_mate_operand" | "no_mate_transition" {
  if (before.kind === "centipawns" && after.kind === "centipawns") return "no_mate_operand";
  if (before.kind === "centipawns") return Object.freeze(["appeared"]) as unknown as readonly ["appeared"];
  if (after.kind === "centipawns") return Object.freeze(["disappeared"]) as unknown as readonly ["disappeared"];
  const changes: MateTransitionKind[] = [];
  if (before.side !== after.side) changes.push("side_changed");
  if (before.distance !== after.distance) changes.push("distance_changed");
  return changes.length === 0 ? "no_mate_transition" : Object.freeze(changes) as unknown as readonly [MateTransitionKind, ...MateTransitionKind[]];
}

/** §1.2: raw side-to-move WDL to White — identity for White to move, win/loss swapped for Black. */
export function whiteWdl(fen: string, raw: FixedBoundPositionEvaluation["rawWdl"]): { readonly rawSubject: "white" | "black"; readonly win: number; readonly draw: number; readonly loss: number } {
  const values = [raw.win, raw.draw, raw.loss];
  if (raw.subject !== "side_to_move" || values.some((value) => !Number.isSafeInteger(value) || value < 0 || value > 1000) || values.reduce((sum, value) => sum + value, 0) !== 1000) {
    throw new TypeError("Raw WDL must be three safe integers in [0,1000] summing to 1000 from the side to move");
  }
  const rawSubject = sideToMove(fen);
  return rawSubject === "white"
    ? Object.freeze({ rawSubject, win: raw.win, draw: raw.draw, loss: raw.loss })
    : Object.freeze({ rawSubject, win: raw.loss, draw: raw.draw, loss: raw.win });
}

/** The White-perspective value of a cp point, or null for a mate point (never converted). */
export function reviewPointCentipawns(point: ReviewEnginePoint): number | null {
  const score = point.evaluation.payload.payload.score;
  return score.kind === "centipawns" ? score.value : null;
}

/** §5 last-level: learner perspective is applied at the consumer, from White evidence only. */
export function learnerCentipawns(whiteCp: number, side: "white" | "black"): number {
  return side === "white" ? whiteCp : -whiteCp || 0;
}
