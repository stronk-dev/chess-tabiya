/**
 * Exact local bounded-target chess (rfc/bounded-policy-targets.md §§1–2, 4.3).
 *
 * Pure computations over sealed authorities: the named-target join, the immediate outcome of one
 * exact legal candidate and the bounded three-ply return enumeration with its visited-position
 * convention `bounded-target-visited-positions@1`. Nothing here mints evidence; the three value
 * factories in `evidence-factories.ts` call these functions and seal their results. The traversal
 * authority and batch counter are module-private-WeakSet sealed and created only by the service.
 */
import { castlingSide, type Chess } from "chessops/chess";
import type { Color, Move, Role, SquareName } from "chessops/types";
import { kingCastlesTo, makeSquare, makeUci, parseSquare, parseUci, rookCastlesTo } from "chessops/util";

import type { DeclaredEvidence } from "./evidence-contract.js";
import { exchangeCaptureAt, legalExchangeForMove, type LegalExchangeResult } from "./exchange.js";
import type { ExactLegalMove, ExactLegalMoveMap } from "./legal-moves.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { assertThreatPassAnchor, type ThreatPassAnchor, type ThreatResult } from "./tactics.js";
import { threatEvidencePassAnchor } from "./threat-pass-authority.js";

// ---------------------------------------------------------------------------------------------
// §2.1 Closed local payloads
// ---------------------------------------------------------------------------------------------

export type ProjectionEvidence<Id extends string, Payload> = DeclaredEvidence<Payload> & {
  readonly projection: { readonly id: Id; readonly version: 1 };
};

export type ThreatEvidence = ProjectionEvidence<"rules.tactic.consequence.threat", ThreatResult>;
export type LegalExchangeEvidence = ProjectionEvidence<"rules.exchange.predicate.legal_exchange", LegalExchangeResult>;
export type SourceLegalMovesEvidence = ProjectionEvidence<"rules.mobility.reading.legal_moves", ExactLegalMoveMap>;

export interface TrackedPieceIdentity {
  readonly color: Color;
  readonly role: Role;
  readonly square: SquareName;
}

export interface ObservedPromotionEdge {
  readonly ply: 1 | 2 | 3;
  readonly moveUci: string;
  readonly from: SquareName;
  readonly to: SquareName;
  readonly fromRole: "pawn";
  readonly toRole: "queen" | "rook" | "bishop" | "knight";
}

/** Traversal-only state; never enters a projection payload. */
interface TrackedPieceState {
  readonly source: TrackedPieceIdentity;
  readonly current: TrackedPieceIdentity | null;
  readonly observedPromotions: readonly ObservedPromotionEdge[];
}

export interface NamedMaterialTarget {
  readonly convention: "bounded-target@1";
  readonly passAnchor: ThreatPassAnchor;
  readonly attacker: TrackedPieceIdentity;
  readonly victim: TrackedPieceIdentity;
  readonly captureUci: string;
  readonly threat: ThreatEvidence;
  readonly exchange: LegalExchangeEvidence;
  readonly sourcePosition: SourceLegalMovesEvidence;
}

export interface PostCandidateExchangeEvaluation {
  readonly convention: "legal-exchange-for-move@1";
  readonly captureUci: string;
  readonly resultUnits: number;
  readonly result: "positive" | "non_positive";
}

export type ImmediateTargetOutcome =
  | { readonly result: "preserved"; readonly cause: "preserved"; readonly postCandidateExchange: PostCandidateExchangeEvaluation & { readonly result: "positive" } }
  | { readonly result: "removed"; readonly cause: "attacker_captured" | "target_moved" | "capture_illegal"; readonly postCandidateExchange: null }
  | { readonly result: "removed"; readonly cause: "exchange_neutralized"; readonly postCandidateExchange: PostCandidateExchangeEvaluation & { readonly result: "non_positive" } };

export type NamedMaterialTargetEvidence = ProjectionEvidence<"derived.bounded_target.named_material_target", NamedMaterialTarget>;

export interface BoundedTargetImmediate {
  readonly target: NamedMaterialTargetEvidence;
  readonly candidateUci: string;
  readonly afterFen: string;
  readonly outcome: ImmediateTargetOutcome;
}

export type CandidateLine = readonly [candidateUci: string];
export type RefutationLine = readonly [candidateUci: string, preparationUci: string, replyUci: string];
export type ReintroductionLine = readonly [candidateUci: string, preparationUci: string, replyUci: string, captureUci: string];

export type BoundedReturnOutcome =
  | { readonly kind: "not_reintroduced"; readonly firstRefutation: RefutationLine | null }
  | { readonly kind: "reintroduced"; readonly witness: ReintroductionLine; readonly firstRefutation: RefutationLine }
  | { readonly kind: "survives_every_defence"; readonly witness: ReintroductionLine };

export type BoundedTargetImmediateEvidence<Outcome extends ImmediateTargetOutcome = ImmediateTargetOutcome> = ProjectionEvidence<
  "derived.bounded_target.immediate",
  BoundedTargetImmediate & { readonly outcome: Outcome }
>;

export interface BoundedTargetReturn {
  readonly immediate: BoundedTargetImmediateEvidence<Extract<ImmediateTargetOutcome, { readonly result: "removed" }>>;
  readonly horizonPlies: 3;
  readonly visitedPositions: number;
  readonly outcome: BoundedReturnOutcome;
}

export type BoundedTargetReturnEvidence = ProjectionEvidence<"derived.bounded_target.bounded_return", BoundedTargetReturn>;

export const BOUNDED_TARGET_CONVENTION = "bounded-target@1" as const;
export const BOUNDED_TARGET_VISITED_CONVENTION = "bounded-target-visited-positions@1" as const;
export const POST_CANDIDATE_EXCHANGE_CONVENTION = "legal-exchange-for-move@1" as const;

// ---------------------------------------------------------------------------------------------
// Tracked identity (§2.1, [[D2107]])
// ---------------------------------------------------------------------------------------------

const PROMOTED: readonly ObservedPromotionEdge["toRole"][] = ["queen", "rook", "bishop", "knight"];

function squareOf(name: SquareName): number {
  const parsed = parseSquare(name);
  if (parsed === undefined) throw new TypeError(`Invalid tracked square ${name}`);
  return parsed;
}

function samePiece(position: Chess, identity: TrackedPieceIdentity): boolean {
  const piece = position.board.get(squareOf(identity.square));
  return piece?.color === identity.color && piece.role === identity.role;
}

type Advance = { readonly kind: "moved"; readonly state: TrackedPieceState } | { readonly kind: "captured"; readonly state: TrackedPieceState } | { readonly kind: "identity_lost" };

/**
 * Advances one tracked piece through one exact legal move: both chessops rook-square castling
 * forms, captures (including en passant), ordinary motion and observed promotion on plies 1–3.
 */
function advance(position: Chess, move: Move, state: TrackedPieceState, ply: 1 | 2 | 3): Advance {
  const current = state.current;
  if (current === null) return { kind: "identity_lost" };
  const at = squareOf(current.square);
  if ("from" in move) {
    const side = castlingSide(position, move);
    if (side !== undefined) {
      const rookFrom = position.castles.rook[position.turn][side];
      if (move.from === at) return { kind: "moved", state: { ...state, current: Object.freeze({ ...current, square: makeSquare(kingCastlesTo(position.turn, side)) }) } };
      if (rookFrom === at) return { kind: "moved", state: { ...state, current: Object.freeze({ ...current, square: makeSquare(rookCastlesTo(position.turn, side)) }) } };
      return { kind: "moved", state };
    }
    const captured = exchangeCaptureAt(position, move);
    if (captured?.square === at) return { kind: "captured", state: { ...state, current: null } };
    if (move.from !== at) return { kind: "moved", state };
    if (move.promotion !== undefined) {
      if (current.role !== "pawn" || !PROMOTED.includes(move.promotion as ObservedPromotionEdge["toRole"])) return { kind: "identity_lost" };
      const toRank = Math.floor(move.to / 8);
      if (toRank !== 0 && toRank !== 7) return { kind: "identity_lost" };
      const edge: ObservedPromotionEdge = Object.freeze({ ply, moveUci: makeUci(move), from: makeSquare(move.from), to: makeSquare(move.to), fromRole: "pawn" as const, toRole: move.promotion as ObservedPromotionEdge["toRole"] });
      return { kind: "moved", state: { ...state, current: Object.freeze({ color: current.color, role: move.promotion, square: makeSquare(move.to) }), observedPromotions: Object.freeze([...state.observedPromotions, edge]) } };
    }
    return { kind: "moved", state: { ...state, current: Object.freeze({ ...current, square: makeSquare(move.to) }) } };
  }
  return { kind: "identity_lost" };
}

interface TrackedPair { readonly attacker: TrackedPieceState; readonly victim: TrackedPieceState }
type PlayResult = { readonly kind: "played"; readonly position: Chess; readonly pair: TrackedPair } | { readonly kind: "captured" } | { readonly kind: "identity_lost" };

function playTracked(position: Chess, move: Move, pair: TrackedPair, ply: 1 | 2 | 3): PlayResult {
  const attacker = advance(position, move, pair.attacker, ply);
  const victim = advance(position, move, pair.victim, ply);
  const next = position.clone();
  next.play(move);
  if (attacker.kind === "identity_lost" || victim.kind === "identity_lost") return { kind: "identity_lost" };
  if (attacker.kind === "captured" || victim.kind === "captured") return { kind: "captured" };
  if (!samePiece(next, attacker.state.current!) || !samePiece(next, victim.state.current!)) return { kind: "identity_lost" };
  return { kind: "played", position: next, pair: { attacker: attacker.state, victim: victim.state } };
}

const PROMOTION_ROLES: readonly Role[] = ["queen", "rook", "bishop", "knight"];

function legalMoves(position: Chess): readonly Move[] {
  const result: Move[] = [];
  for (const [from, dests] of position.allDests()) for (const to of dests) {
    const roles: readonly (Role | undefined)[] = position.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? PROMOTION_ROLES : [undefined];
    for (const promotion of roles) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (position.isLegal(move)) result.push(move);
    }
  }
  return result.sort((left, right) => makeUci(left).localeCompare(makeUci(right)));
}

/** The tracked capture on the current board, keeping the source capture's promotion role. */
function trackedCapture(position: Chess, pair: TrackedPair, sourceCaptureUci: string): Move | undefined {
  const attacker = pair.attacker.current;
  const victim = pair.victim.current;
  if (attacker === null || victim === null || position.turn !== attacker.color) return undefined;
  const from = squareOf(attacker.square);
  const to = squareOf(victim.square);
  const promotes = attacker.role === "pawn" && (to < 8 || to >= 56);
  const sourcePromotion = parseUci(sourceCaptureUci);
  const promotion = promotes ? (sourcePromotion !== undefined && "promotion" in sourcePromotion && sourcePromotion.promotion !== undefined ? sourcePromotion.promotion : "queen") : undefined;
  return promotion === undefined ? { from, to } : { from, to, promotion };
}

function positiveCapture(position: Chess, pair: TrackedPair, sourceCaptureUci: string): { readonly move: Move; readonly exchange: LegalExchangeResult } | undefined {
  const move = trackedCapture(position, pair, sourceCaptureUci);
  if (move === undefined || !position.isLegal(move)) return undefined;
  const exchange = legalExchangeForMove(position, move);
  return exchange !== undefined && exchange.resultUnits > 0 ? { move, exchange } : undefined;
}

function initialPair(target: NamedMaterialTarget): TrackedPair {
  return {
    attacker: { source: target.attacker, current: target.attacker, observedPromotions: Object.freeze([]) },
    victim: { source: target.victim, current: target.victim, observedPromotions: Object.freeze([]) },
  };
}

// ---------------------------------------------------------------------------------------------
// §1.2 Named target join
// ---------------------------------------------------------------------------------------------

export type NamedTargetComputation =
  | { readonly kind: "target"; readonly payload: NamedMaterialTarget }
  | { readonly kind: "abstained"; readonly reason: "input_abstained" | "position_mismatch" | "target_mismatch" };

/** A positive material capture row of a threat reading: a target, not a pure mate threat. */
export function positiveMaterialThreatExchanges(threat: ThreatResult): readonly LegalExchangeResult[] {
  if (threat.kind !== "threats") return [];
  return threat.threats.flatMap((row) => row.target !== undefined && row.exchange !== undefined && row.exchange.resultUnits > 0 ? [row.exchange] : []);
}

const exchangeKey = (exchange: LegalExchangeResult): string => `${exchange.beforeFen}|${exchange.captureUci}|${exchange.resultUnits}|${exchange.capturer.square}|${exchange.captured.square}`;

export function computeNamedMaterialTarget(threat: ThreatEvidence, exchange: LegalExchangeEvidence, sourcePosition: SourceLegalMovesEvidence): NamedTargetComputation {
  const pass = threatEvidencePassAnchor(threat);
  if (pass.kind !== "available" || threat.payload.kind !== "threats") return { kind: "abstained", reason: "input_abstained" };
  const anchor = pass.anchor;
  assertThreatPassAnchor(anchor);
  if (canonicalFen(positionFromFen(sourcePosition.payload.fen)) !== anchor.sourceFen) return { kind: "abstained", reason: "position_mismatch" };
  if (canonicalFen(positionFromFen(exchange.payload.beforeFen)) !== anchor.passedFen) return { kind: "abstained", reason: "position_mismatch" };
  const row = threat.payload.threats.find((value) => value.target !== undefined && value.exchange !== undefined && value.threatenedMove === exchange.payload.captureUci && exchangeKey(value.exchange) === exchangeKey(exchange.payload));
  if (row === undefined || exchange.payload.resultUnits <= 0) return { kind: "abstained", reason: "target_mismatch" };
  if (row.threateningPiece.square !== exchange.payload.capturer.square || row.target!.square !== exchange.payload.captured.square) return { kind: "abstained", reason: "target_mismatch" };
  return {
    kind: "target",
    payload: Object.freeze({
      convention: BOUNDED_TARGET_CONVENTION,
      passAnchor: anchor,
      attacker: Object.freeze({ color: exchange.payload.capturer.color, role: exchange.payload.capturer.role, square: exchange.payload.capturer.square }),
      victim: Object.freeze({ color: exchange.payload.captured.color, role: exchange.payload.captured.role, square: exchange.payload.captured.square }),
      captureUci: exchange.payload.captureUci,
      threat,
      exchange,
      sourcePosition,
    }),
  };
}

// ---------------------------------------------------------------------------------------------
// §2.2 Immediate outcome
// ---------------------------------------------------------------------------------------------

export type ImmediateComputation =
  | { readonly kind: "immediate"; readonly candidateUci: string; readonly afterFen: string; readonly outcome: ImmediateTargetOutcome }
  | { readonly kind: "abstained"; readonly reason: "position_mismatch" | "target_mismatch" | "identity_lost"; readonly candidateUci: string };

export function candidateInSourcePosition(sourcePosition: SourceLegalMovesEvidence, candidate: ExactLegalMove): boolean {
  return sourcePosition.payload.pieces.some((entry) => entry.moves.some((move) => move.uci === candidate.uci && move.from === candidate.from && move.to === candidate.to && move.role === candidate.role && move.promotion === candidate.promotion));
}

export function computeImmediate(target: NamedMaterialTarget, candidate: ExactLegalMove): ImmediateComputation {
  if (!candidateInSourcePosition(target.sourcePosition, candidate)) return { kind: "abstained", reason: "position_mismatch", candidateUci: candidate.uci };
  const root = positionFromFen(target.passAnchor.sourceFen);
  const parsed = parseUci(candidate.uci);
  if (parsed === undefined || !root.isLegal(parsed)) return { kind: "abstained", reason: "position_mismatch", candidateUci: candidate.uci };
  const after = root.clone();
  after.play(parsed);
  const afterFen = canonicalFen(after);
  // Known legal captures are resolved before identity comparison.
  if ("from" in parsed && exchangeCaptureAt(root, parsed)?.square === squareOf(target.attacker.square)) {
    return { kind: "immediate", candidateUci: candidate.uci, afterFen, outcome: Object.freeze({ result: "removed", cause: "attacker_captured", postCandidateExchange: null }) };
  }
  const played = playTracked(root, parsed, initialPair(target), 1);
  if (played.kind !== "played") return { kind: "abstained", reason: "identity_lost", candidateUci: candidate.uci };
  const positive = positiveCapture(played.position, played.pair, target.captureUci);
  if (positive !== undefined) {
    return { kind: "immediate", candidateUci: candidate.uci, afterFen, outcome: Object.freeze({ result: "preserved", cause: "preserved", postCandidateExchange: Object.freeze({ convention: POST_CANDIDATE_EXCHANGE_CONVENTION, captureUci: positive.exchange.captureUci, resultUnits: positive.exchange.resultUnits, result: "positive" as const }) }) };
  }
  if (played.pair.victim.current!.square !== target.victim.square) {
    return { kind: "immediate", candidateUci: candidate.uci, afterFen, outcome: Object.freeze({ result: "removed", cause: "target_moved", postCandidateExchange: null }) };
  }
  const capture = trackedCapture(played.position, played.pair, target.captureUci);
  if (capture !== undefined && played.position.isLegal(capture)) {
    const exchange = legalExchangeForMove(played.position, capture);
    if (exchange === undefined || exchange.resultUnits > 0) throw new TypeError("Post-candidate exchange contradicts the preserved check");
    return { kind: "immediate", candidateUci: candidate.uci, afterFen, outcome: Object.freeze({ result: "removed", cause: "exchange_neutralized", postCandidateExchange: Object.freeze({ convention: POST_CANDIDATE_EXCHANGE_CONVENTION, captureUci: exchange.captureUci, resultUnits: exchange.resultUnits, result: "non_positive" as const }) }) };
  }
  return { kind: "immediate", candidateUci: candidate.uci, afterFen, outcome: Object.freeze({ result: "removed", cause: "capture_illegal", postCandidateExchange: null }) };
}

// ---------------------------------------------------------------------------------------------
// §4 Traversal authority and counters (module-private seals)
// ---------------------------------------------------------------------------------------------

export class BoundedTargetBatchExhausted extends Error {
  constructor() {
    super("bounded-target batch visited-position ceiling reached");
    this.name = "BoundedTargetBatchExhausted";
  }
}

export class BoundedTargetTraversalAborted extends Error {
  constructor() {
    super("bounded-target traversal aborted");
    this.name = "BoundedTargetTraversalAborted";
  }
}

export class BoundedTargetYieldFailed extends Error {
  constructor(cause: unknown) {
    super(`bounded-target yield failed: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "BoundedTargetYieldFailed";
  }
}

export interface BoundedTargetBatchCounterAuthority {
  readonly maxVisitedPositions: number;
  current(): number;
  claimPosition(): "claimed" | "batch_budget_exhausted";
}

export interface BoundedTargetTraversalAuthority {
  readonly requestDigest: string;
  readonly signal: AbortSignal;
  readonly candidateLimit: number;
  readonly yieldEvery: number;
  readonly batchCounter: BoundedTargetBatchCounterAuthority;
  readonly yieldNow: () => Promise<void>;
}

const COUNTERS = new WeakSet<BoundedTargetBatchCounterAuthority>();
const TRAVERSALS = new WeakSet<BoundedTargetTraversalAuthority>();

/** Created only by the bounded-target service; the limits are validated there. */
export function createBoundedTargetBatchCounter(maxVisitedPositions: number): BoundedTargetBatchCounterAuthority {
  let count = 0;
  const counter: BoundedTargetBatchCounterAuthority = Object.freeze({
    maxVisitedPositions,
    current: () => count,
    claimPosition: () => {
      if (count >= maxVisitedPositions) return "batch_budget_exhausted" as const;
      count += 1;
      return "claimed" as const;
    },
  });
  COUNTERS.add(counter);
  return counter;
}

export function createBoundedTargetTraversalAuthority(input: Omit<BoundedTargetTraversalAuthority, never>): BoundedTargetTraversalAuthority {
  if (!COUNTERS.has(input.batchCounter)) throw new TypeError("Bounded-target traversal needs a service-created batch counter");
  const authority = Object.freeze({ ...input });
  TRAVERSALS.add(authority);
  return authority;
}

export function isBoundedTargetTraversalAuthority(value: unknown): value is BoundedTargetTraversalAuthority {
  return typeof value === "object" && value !== null && TRAVERSALS.has(value as BoundedTargetTraversalAuthority);
}

// ---------------------------------------------------------------------------------------------
// §2.3 / §4.3 Bounded return
// ---------------------------------------------------------------------------------------------

export type ReturnComputation =
  | { readonly kind: "return"; readonly visitedPositions: number; readonly outcome: BoundedReturnOutcome }
  | { readonly kind: "budget_exhausted"; readonly visitedPositions: number };

/**
 * The exact three-ply enumeration from a removed target's after-candidate root. The root is
 * already counted (1) by the service. Before materializing a child the local cap and the batch cap
 * are checked; after a child is inspected a multiple of `yieldEvery` yields, surrounded by signal
 * checks. Witness/refutation replay is not a traversal step and never changes the count.
 */
export async function computeBoundedReturn(immediate: BoundedTargetImmediate & { readonly outcome: { readonly result: "removed" } }, traversal: BoundedTargetTraversalAuthority): Promise<ReturnComputation> {
  const target = immediate.target.payload;
  const candidateUci = immediate.candidateUci;
  const root = positionFromFen(target.passAnchor.sourceFen);
  const candidate = parseUci(candidateUci)!;
  let visited = 1;
  const checkSignal = (): void => {
    if (traversal.signal.aborted) throw new BoundedTargetTraversalAborted();
  };
  const pause = async (): Promise<void> => {
    checkSignal();
    try {
      await traversal.yieldNow();
    } catch (error) {
      throw new BoundedTargetYieldFailed(error);
    }
    checkSignal();
  };
  const claim = async (): Promise<boolean> => {
    if (visited >= traversal.candidateLimit) return false;
    if (traversal.batchCounter.claimPosition() === "batch_budget_exhausted") throw new BoundedTargetBatchExhausted();
    visited += 1;
    return true;
  };
  const afterInspect = async (): Promise<void> => {
    if (visited % traversal.yieldEvery === 0) await pause();
  };
  checkSignal();
  // Attacker capture by the candidate: the target cannot return without its attacker.
  if (immediate.outcome.cause === "attacker_captured") {
    if (visited % traversal.yieldEvery !== 0) await pause();
    return { kind: "return", visitedPositions: visited, outcome: Object.freeze({ kind: "not_reintroduced", firstRefutation: null }) };
  }
  const played = playTracked(root, candidate, initialPair(target), 1);
  if (played.kind !== "played") throw new TypeError("Removed immediate lost its tracked identity during replay");
  let witness: ReintroductionLine | undefined;
  let witnessRefutation: RefutationLine | undefined;
  let universal: ReintroductionLine | undefined;
  let firstRefutation: RefutationLine | undefined;
  for (const preparation of legalMoves(played.position)) {
    if (!(await claim())) return { kind: "budget_exhausted", visitedPositions: visited };
    const afterPreparation = playTracked(played.position, preparation, played.pair, 2);
    await afterInspect();
    if (afterPreparation.kind !== "played") continue;
    const replies = legalMoves(afterPreparation.position);
    if (replies.length === 0) continue;
    let everyReply = true;
    let preparationWitness: ReintroductionLine | undefined;
    let preparationRefutation: RefutationLine | undefined;
    for (const reply of replies) {
      if (!(await claim())) return { kind: "budget_exhausted", visitedPositions: visited };
      const afterReply = playTracked(afterPreparation.position, reply, afterPreparation.pair, 3);
      const capture = afterReply.kind === "played" ? positiveCapture(afterReply.position, afterReply.pair, target.captureUci) : undefined;
      await afterInspect();
      if (capture === undefined) {
        everyReply = false;
        preparationRefutation ??= Object.freeze([candidateUci, makeUci(preparation), makeUci(reply)] as const);
        continue;
      }
      preparationWitness ??= Object.freeze([candidateUci, makeUci(preparation), makeUci(reply), capture.exchange.captureUci] as const);
    }
    if (everyReply && preparationWitness !== undefined) {
      universal = preparationWitness;
      break;
    }
    if (preparationWitness !== undefined && witness === undefined) {
      witness = preparationWitness;
      witnessRefutation = preparationRefutation;
    }
    firstRefutation ??= preparationRefutation;
  }
  if (visited % traversal.yieldEvery !== 0) await pause();
  checkSignal();
  if (universal !== undefined) return { kind: "return", visitedPositions: visited, outcome: Object.freeze({ kind: "survives_every_defence", witness: universal }) };
  if (witness !== undefined) {
    if (witnessRefutation === undefined) throw new TypeError("A non-universal witness preparation has no refuting reply");
    return { kind: "return", visitedPositions: visited, outcome: Object.freeze({ kind: "reintroduced", witness, firstRefutation: witnessRefutation }) };
  }
  return { kind: "return", visitedPositions: visited, outcome: Object.freeze({ kind: "not_reintroduced", firstRefutation: firstRefutation ?? null }) };
}

// ---------------------------------------------------------------------------------------------
// rfc/bounded-target-policy-composition.md: exact availability after a declared line
// ---------------------------------------------------------------------------------------------

export type TargetLineAvailability =
  | { readonly kind: "available"; readonly captureUci: string }
  | { readonly kind: "unavailable" }
  | { readonly kind: "identity_lost" }
  | { readonly kind: "illegal" };

/**
 * Replays an exact legal line (one to three plies) from the target's source position, tracking the
 * named attacker and victim, and reports whether the same positive capture is available at the
 * line's end. A captured tracked piece is `unavailable`; an unexplained replacement is
 * `identity_lost`; an illegal move is `illegal`. Availability is never execution.
 */
export function targetAvailabilityAfterLine(target: NamedMaterialTarget, line: readonly string[]): TargetLineAvailability {
  if (line.length === 0 || line.length > 3) throw new TypeError("A target line has one to three plies");
  let position = positionFromFen(target.passAnchor.sourceFen);
  let pair = initialPair(target);
  for (const [index, uci] of line.entries()) {
    const parsed = parseUci(uci);
    if (parsed === undefined || !position.isLegal(parsed)) return { kind: "illegal" };
    const played = playTracked(position, parsed, pair, (index + 1) as 1 | 2 | 3);
    if (played.kind === "captured") return { kind: "unavailable" };
    if (played.kind === "identity_lost") return { kind: "identity_lost" };
    position = played.position;
    pair = played.pair;
  }
  const capture = positiveCapture(position, pair, target.captureUci);
  return capture === undefined ? { kind: "unavailable" } : { kind: "available", captureUci: capture.exchange.captureUci };
}

/** The canonical FEN reached by an exact legal line from the target's source position. */
export function fenAfterLine(target: NamedMaterialTarget, line: readonly string[]): string {
  const position = positionFromFen(target.passAnchor.sourceFen);
  for (const uci of line) {
    const parsed = parseUci(uci);
    if (parsed === undefined || !position.isLegal(parsed)) throw new TypeError(`Illegal line move ${uci}`);
    position.play(parsed);
  }
  return canonicalFen(position);
}
