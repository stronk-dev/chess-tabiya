import { attacks, between, pawnAttacks } from "chessops/attacks";
import { normalizeMove } from "chessops/chess";
import type { Color, Piece, Square, SquareName } from "chessops/types";
import { makeSquare, makeUci, opposite, parseSquare, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";
import { EXCHANGE_PIECE_VALUES } from "./exchange.js";
import { matchesStructuralFeature } from "./structure.js";
import { transitionSemanticFacts } from "./transition.js";

export const CANDIDATE_MAJORITY_CONVENTION = "candidate-majority@1" as const;
const COLORS = Object.freeze(["white", "black"] as const);

export interface BoardPieceIdentity {
  readonly square: SquareName;
  readonly piece: Piece;
}

export interface PawnIdentity extends BoardPieceIdentity {}

export interface PawnContactsReading {
  readonly fen: string;
  readonly contacts: readonly { readonly attacker: PawnIdentity; readonly target: PawnIdentity }[];
  readonly locks: readonly { readonly white: PawnIdentity; readonly black: PawnIdentity }[];
  readonly passed: readonly {
    readonly pawn: PawnIdentity;
    readonly passed: boolean;
    readonly blockers: readonly PawnIdentity[];
    readonly protectedBy: readonly PawnIdentity[];
  }[];
  readonly connectedPassedPairs: readonly { readonly first: PawnIdentity; readonly second: PawnIdentity }[];
}

export interface CandidateMajorityReading {
  readonly fen: string;
  readonly conventionId: typeof CANDIDATE_MAJORITY_CONVENTION;
  readonly candidates: readonly {
    readonly pawn: PawnIdentity;
    readonly supports: readonly PawnIdentity[];
    readonly blockers: readonly PawnIdentity[];
    readonly supportCount: number;
    readonly blockerCount: number;
  }[];
}

export type PawnDynamicsKind =
  | "locked_pair_gained"
  | "minor_harassed"
  | "protected_passer_gained"
  | "connected_passer_pair_gained"
  | "candidate_majority_gained"
  | "candidate_majority_advanced";

export interface PawnDynamicsEvent {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly kind: PawnDynamicsKind;
  readonly subjects: Readonly<Record<string, unknown>>;
}

export type PawnTransitionKind =
  | "contact_executed"
  | "moved_pawn_became_passed"
  | "capture_created_moved_passer"
  | "passed_pawn_advanced";

export interface PawnTransitionEvent {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly kind: PawnTransitionKind;
  readonly pawn: { readonly before: PawnIdentity; readonly after: PawnIdentity };
  readonly contact?: { readonly attacker: PawnIdentity; readonly target: PawnIdentity };
  readonly capture?: Extract<ReturnType<typeof transitionSemanticFacts>[number], { readonly family: "capture" }>;
}

export interface RecordedMoveAnchor {
  readonly beforeNodeId: string;
  readonly afterNodeId: string;
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
}

export interface PawnContactTimingSequence {
  readonly kind: "created_survived_reply" | "created_executed_next_own_move";
  readonly anchors: readonly RecordedMoveAnchor[];
  readonly nodes: readonly { readonly nodeId: string; readonly fen: string }[];
  readonly pawn: { readonly color: Color; readonly from: SquareName; readonly contactSquare: SquareName };
  readonly contactedPawn: PawnIdentity;
}

export interface PressureLine {
  readonly slider: BoardPieceIdentity;
  readonly screen: BoardPieceIdentity;
  readonly target: BoardPieceIdentity;
}

export interface HarassmentPressureSequence {
  readonly kind: "harassment_pressure_retained";
  readonly anchors: readonly [RecordedMoveAnchor, RecordedMoveAnchor];
  readonly nodes: readonly [
    { readonly nodeId: string; readonly fen: string },
    { readonly nodeId: string; readonly fen: string },
    { readonly nodeId: string; readonly fen: string },
  ];
  readonly pawn: PawnIdentity;
  readonly minor: { readonly before: BoardPieceIdentity; readonly after: BoardPieceIdentity };
  readonly pressure: { readonly before: PressureLine; readonly after: PressureLine };
  readonly conventionId: "pressure-line@1";
}

function identity(position: ReturnType<typeof positionFromFen>, square: Square): PawnIdentity {
  return Object.freeze({ square: makeSquare(square), piece: position.board.get(square)! });
}

function rank(square: Square): number {
  return Math.floor(square / 8);
}

function ahead(color: Color, subject: Square, candidate: Square): boolean {
  return color === "white" ? rank(candidate) > rank(subject) : rank(candidate) < rank(subject);
}

function behindOrLevel(color: Color, subject: Square, candidate: Square): boolean {
  return color === "white" ? rank(candidate) <= rank(subject) : rank(candidate) >= rank(subject);
}

function adjacentFile(left: Square, right: Square): boolean {
  return Math.abs((left % 8) - (right % 8)) === 1;
}

export function pawnContactsReading(fen: string): PawnContactsReading {
  const position = positionFromFen(fen);
  const canonical = canonicalFen(position);
  const contacts: PawnContactsReading["contacts"][number][] = [];
  const passed: PawnContactsReading["passed"][number][] = [];
  const locks: PawnContactsReading["locks"][number][] = [];
  for (const color of COLORS) {
    for (const square of position.board.pieces(color, "pawn")) {
      for (const target of pawnAttacks(color, square).intersect(position.board.pieces(opposite(color), "pawn"))) contacts.push(Object.freeze({ attacker: identity(position, square), target: identity(position, target) }));
      const isPassed = matchesStructuralFeature(canonical, { kind: "passed_pawn", color, square: makeSquare(square) });
      const blockers = [...position.board.pieces(opposite(color), "pawn")].filter((other) => ahead(color, square, other) && Math.abs((square % 8) - (other % 8)) <= 1).map((other) => identity(position, other));
      const protectedBy = [...position.board.pieces(color, "pawn")].filter((other) => other !== square && pawnAttacks(color, other).has(square)).map((other) => identity(position, other));
      passed.push(Object.freeze({ pawn: identity(position, square), passed: isPassed, blockers: Object.freeze(blockers.sort((a, b) => a.square.localeCompare(b.square))), protectedBy: Object.freeze(protectedBy.sort((a, b) => a.square.localeCompare(b.square))) }));
    }
  }
  for (const white of position.board.pieces("white", "pawn")) {
    const black = white + 8;
    if (black < 64 && position.board.getColor(black as Square) === "black" && position.board.getRole(black as Square) === "pawn") locks.push(Object.freeze({ white: identity(position, white), black: identity(position, black as Square) }));
  }
  const connectedPassedPairs: PawnContactsReading["connectedPassedPairs"][number][] = [];
  for (const color of COLORS) {
    const values = passed.filter((entry) => entry.pawn.piece.color === color && entry.passed);
    for (let left = 0; left < values.length; left += 1) for (let right = left + 1; right < values.length; right += 1) {
      const a = values[left]!, b = values[right]!;
      const aSquare = [...position.board.pieces(color, "pawn")].find((square) => makeSquare(square) === a.pawn.square)!;
      const bSquare = [...position.board.pieces(color, "pawn")].find((square) => makeSquare(square) === b.pawn.square)!;
      if (adjacentFile(aSquare, bSquare)) connectedPassedPairs.push(Object.freeze({ first: a.pawn, second: b.pawn }));
    }
  }
  const byPair = (left: { attacker: PawnIdentity; target: PawnIdentity }, right: { attacker: PawnIdentity; target: PawnIdentity }) => left.attacker.square.localeCompare(right.attacker.square) || left.target.square.localeCompare(right.target.square);
  return Object.freeze({
    fen: canonical,
    contacts: Object.freeze(contacts.sort(byPair)),
    locks: Object.freeze(locks.sort((a, b) => a.white.square.localeCompare(b.white.square))),
    passed: Object.freeze(passed.sort((a, b) => a.pawn.square.localeCompare(b.pawn.square))),
    connectedPassedPairs: Object.freeze(connectedPassedPairs.sort((a, b) => a.first.square.localeCompare(b.first.square) || a.second.square.localeCompare(b.second.square))),
  });
}

export function candidateMajorityReading(fen: string): CandidateMajorityReading {
  const position = positionFromFen(fen);
  const canonical = canonicalFen(position);
  const candidates: CandidateMajorityReading["candidates"][number][] = [];
  for (const color of COLORS) for (const square of position.board.pieces(color, "pawn")) {
    if (matchesStructuralFeature(canonical, { kind: "passed_pawn", color, square: makeSquare(square) })) continue;
    const enemies = [...position.board.pieces(opposite(color), "pawn")];
    if (enemies.some((enemy) => enemy % 8 === square % 8 && ahead(color, square, enemy))) continue;
    const supports = [...position.board.pieces(color, "pawn")].filter((other) => other !== square && adjacentFile(square, other) && behindOrLevel(color, square, other)).map((other) => identity(position, other));
    const blockers = enemies.filter((enemy) => adjacentFile(square, enemy) && ahead(color, square, enemy)).map((enemy) => identity(position, enemy));
    if (supports.length === 0 || supports.length < blockers.length) continue;
    candidates.push(Object.freeze({ pawn: identity(position, square), supports: Object.freeze(supports.sort((a, b) => a.square.localeCompare(b.square))), blockers: Object.freeze(blockers.sort((a, b) => a.square.localeCompare(b.square))), supportCount: supports.length, blockerCount: blockers.length }));
  }
  return Object.freeze({ fen: canonical, conventionId: CANDIDATE_MAJORITY_CONVENTION, candidates: Object.freeze(candidates.sort((a, b) => a.pawn.square.localeCompare(b.pawn.square))) });
}

function validateEdge(beforeFen: string, moveUci: string, afterFen: string) {
  const before = positionFromFen(beforeFen);
  const parsed = parseUci(moveUci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid move UCI ${moveUci}`);
  const move = normalizeMove(before, parsed);
  if (!("from" in move) || !before.isLegal(move)) throw new TypeError(`Illegal move UCI ${moveUci}`);
  const moving = before.board.get(move.from)!;
  const canonicalBefore = canonicalFen(before);
  before.play(move);
  const canonicalAfter = canonicalFen(before);
  if (canonicalAfter !== canonicalFen(positionFromFen(afterFen))) throw new TypeError(`After FEN does not match ${moveUci}`);
  return { move, moveUci: makeUci(move), moving, beforeFen: canonicalBefore, afterFen: canonicalAfter };
}

function keys<T>(values: readonly T[], key: (value: T) => string): Set<string> { return new Set(values.map(key)); }

export function pawnDynamicsEvents(beforeFen: string, moveUci: string, afterFen: string): readonly PawnDynamicsEvent[] {
  const edge = validateEdge(beforeFen, moveUci, afterFen);
  const before = pawnContactsReading(edge.beforeFen), after = pawnContactsReading(edge.afterFen);
  const beforeCandidates = candidateMajorityReading(edge.beforeFen), afterCandidates = candidateMajorityReading(edge.afterFen);
  const result: PawnDynamicsEvent[] = [];
  const add = (kind: PawnDynamicsKind, subjects: Readonly<Record<string, unknown>>) => result.push(Object.freeze({ beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen, kind, subjects: Object.freeze(subjects) }));
  const priorLocks = keys(before.locks, (value) => `${value.white.square}:${value.black.square}`);
  for (const value of after.locks) if (!priorLocks.has(`${value.white.square}:${value.black.square}`)) add("locked_pair_gained", value);
  if (edge.moving.role === "pawn") {
    const beforePosition = positionFromFen(edge.beforeFen);
    const afterPosition = positionFromFen(edge.afterFen);
    for (const target of pawnAttacks(edge.moving.color, edge.move.to)) {
      const piece = afterPosition.board.get(target);
      if (piece?.color !== opposite(edge.moving.color) || (piece.role !== "bishop" && piece.role !== "knight")) continue;
      const existedBefore = pawnAttacks(edge.moving.color, edge.move.from).has(target)
        && beforePosition.board.get(target)?.color === piece.color
        && beforePosition.board.get(target)?.role === piece.role;
      if (!existedBefore) add("minor_harassed", { pawn: identity(afterPosition, edge.move.to), minor: identity(afterPosition, target) });
    }
  }
  const priorProtected = keys(before.passed.filter((value) => value.passed && value.protectedBy.length > 0), (value) => `${value.pawn.piece.color}:${value.pawn.square}`);
  for (const value of after.passed.filter((entry) => entry.passed && entry.protectedBy.length > 0)) if (!priorProtected.has(`${value.pawn.piece.color}:${value.pawn.square}`)) add("protected_passer_gained", value);
  const pairKey = (value: PawnContactsReading["connectedPassedPairs"][number]) => `${value.first.piece.color}:${value.first.square}:${value.second.square}`;
  const priorPairs = keys(before.connectedPassedPairs, pairKey);
  for (const value of after.connectedPassedPairs) if (!priorPairs.has(pairKey(value))) add("connected_passer_pair_gained", value);
  const candidateKey = (value: CandidateMajorityReading["candidates"][number]) => `${value.pawn.piece.color}:${value.pawn.square}`;
  const priorCandidates = keys(beforeCandidates.candidates, candidateKey);
  if (edge.moving.role === "pawn") {
    const from = makeSquare(edge.move.from), to = makeSquare(edge.move.to);
    const prior = beforeCandidates.candidates.find((value) => value.pawn.square === from && value.pawn.piece.color === edge.moving.color);
    const current = afterCandidates.candidates.find((value) => value.pawn.square === to && value.pawn.piece.color === edge.moving.color);
    if (prior === undefined && current !== undefined && !priorCandidates.has(candidateKey(current))) add("candidate_majority_gained", current);
  }
  if (edge.moving.role === "pawn") {
    const from = makeSquare(edge.move.from), to = makeSquare(edge.move.to);
    const prior = beforeCandidates.candidates.find((value) => value.pawn.square === from && value.pawn.piece.color === edge.moving.color);
    const current = afterCandidates.candidates.find((value) => value.pawn.square === to && value.pawn.piece.color === edge.moving.color);
    if (prior !== undefined && current !== undefined) add("candidate_majority_advanced", { before: prior, after: current });
  }
  return Object.freeze(result);
}

export function pawnTransitionEvents(beforeFen: string, moveUci: string, afterFen: string): readonly PawnTransitionEvent[] {
  const edge = validateEdge(beforeFen, moveUci, afterFen);
  if (edge.moving.role !== "pawn") return Object.freeze([]);
  const beforePosition = positionFromFen(edge.beforeFen), afterPosition = positionFromFen(edge.afterFen);
  const beforeIdentity = identity(beforePosition, edge.move.from), afterIdentity = identity(afterPosition, edge.move.to);
  if (afterIdentity.piece.color !== edge.moving.color || afterIdentity.piece.role !== "pawn") return Object.freeze([]);
  const beforeContacts = pawnContactsReading(edge.beforeFen);
  const capture = transitionSemanticFacts(edge.beforeFen, edge.moveUci, edge.afterFen).find((fact): fact is Extract<ReturnType<typeof transitionSemanticFacts>[number], { readonly family: "capture" }> => fact.family === "capture");
  const wasPassed = matchesStructuralFeature(edge.beforeFen, { kind: "passed_pawn", color: edge.moving.color, square: beforeIdentity.square });
  const isPassed = matchesStructuralFeature(edge.afterFen, { kind: "passed_pawn", color: edge.moving.color, square: afterIdentity.square });
  const base = { beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen, pawn: Object.freeze({ before: beforeIdentity, after: afterIdentity }) };
  const result: PawnTransitionEvent[] = [];
  if (capture !== undefined) {
    const contact = beforeContacts.contacts.find((value) => value.attacker.square === beforeIdentity.square && value.target.square === capture.to);
    if (contact !== undefined) result.push(Object.freeze({ ...base, kind: "contact_executed", contact, capture }));
  }
  if (!wasPassed && isPassed) {
    result.push(Object.freeze({ ...base, kind: "moved_pawn_became_passed" }));
    if (capture !== undefined) result.push(Object.freeze({ ...base, kind: "capture_created_moved_passer", capture }));
  }
  if (wasPassed && isPassed && rank(edge.move.from) !== rank(edge.move.to)) result.push(Object.freeze({ ...base, kind: "passed_pawn_advanced" }));
  return Object.freeze(result);
}

function canonicalAnchor(value: RecordedMoveAnchor): RecordedMoveAnchor {
  const edge = validateEdge(value.beforeFen, value.moveUci, value.afterFen);
  if (value.beforeNodeId.length === 0 || value.afterNodeId.length === 0 || value.beforeNodeId === value.afterNodeId) throw new TypeError("Recorded move anchor requires two distinct node ids");
  return Object.freeze({ beforeNodeId: value.beforeNodeId, afterNodeId: value.afterNodeId, beforeFen: edge.beforeFen, moveUci: edge.moveUci, afterFen: edge.afterFen });
}

function recordedPath(values: readonly RecordedMoveAnchor[], expected: 2 | 3): readonly RecordedMoveAnchor[] {
  if (values.length !== expected) throw new TypeError(`Recorded sequence requires exactly ${expected} consecutive anchors`);
  const anchors = values.map(canonicalAnchor);
  for (let index = 1; index < anchors.length; index += 1) {
    const prior = anchors[index - 1]!;
    const current = anchors[index]!;
    if (prior.afterNodeId !== current.beforeNodeId || prior.afterFen !== current.beforeFen) throw new TypeError("Recorded sequence has a broken node/FEN boundary");
  }
  return Object.freeze(anchors);
}

function pathNodes(anchors: readonly RecordedMoveAnchor[]): readonly { readonly nodeId: string; readonly fen: string }[] {
  return Object.freeze([
    Object.freeze({ nodeId: anchors[0]!.beforeNodeId, fen: anchors[0]!.beforeFen }),
    ...anchors.map((anchor) => Object.freeze({ nodeId: anchor.afterNodeId, fen: anchor.afterFen })),
  ]);
}

/** Exact observed contact sequences. Ordering is recorded history, never a causal claim. */
export function pawnContactTimingSequence(values: readonly RecordedMoveAnchor[]): PawnContactTimingSequence | undefined {
  if (values.length !== 2 && values.length !== 3) throw new TypeError("Pawn-contact timing accepts only a two- or three-edge horizon");
  const anchors = recordedPath(values, values.length);
  const firstPosition = positionFromFen(anchors[0]!.beforeFen);
  const firstMove = parseUci(anchors[0]!.moveUci);
  if (firstMove === undefined || !("from" in firstMove)) return undefined;
  const pawn = firstPosition.board.get(firstMove.from);
  if (pawn?.role !== "pawn") return undefined;
  const creation = transitionSemanticFacts(anchors[0]!.beforeFen, anchors[0]!.moveUci, anchors[0]!.afterFen).find((fact) => fact.family === "pawn_contact");
  if (creation?.family !== "pawn_contact") return undefined;
  const contactSquares = (creation.detail as { readonly enemyPawnSquares?: readonly SquareName[] }).enemyPawnSquares ?? [];
  const afterFirst = positionFromFen(anchors[0]!.afterFen);
  const movedIdentity = identity(afterFirst, firstMove.to);
  if (movedIdentity.piece.color !== pawn.color || movedIdentity.piece.role !== "pawn") return undefined;
  const survivors = contactSquares.filter((squareName) => {
    const at = parseSquare(squareName);
    if (at === undefined) return false;
    const piece = positionFromFen(anchors[1]!.afterFen).board.get(at);
    return piece?.color === opposite(pawn.color) && piece.role === "pawn";
  });
  const trackedAtReply = positionFromFen(anchors[1]!.afterFen).board.get(firstMove.to);
  if (trackedAtReply?.color !== pawn.color || trackedAtReply.role !== "pawn" || survivors.length === 0) return undefined;
  let contactSquare = survivors[0]!;
  let kind: PawnContactTimingSequence["kind"] = "created_survived_reply";
  if (anchors.length === 3) {
    const execution = pawnTransitionEvents(anchors[2]!.beforeFen, anchors[2]!.moveUci, anchors[2]!.afterFen).find((event) => event.kind === "contact_executed" && event.pawn.before.square === makeSquare(firstMove.to) && survivors.includes(event.contact!.target.square));
    if (execution === undefined) return undefined;
    contactSquare = execution.contact!.target.square;
    kind = "created_executed_next_own_move";
  }
  const targetSquare = parseSquare(contactSquare);
  if (targetSquare === undefined) return undefined;
  return Object.freeze({
    kind,
    anchors,
    nodes: pathNodes(anchors),
    pawn: Object.freeze({ color: pawn.color, from: makeSquare(firstMove.from), contactSquare: makeSquare(firstMove.to) }),
    contactedPawn: identity(afterFirst, targetSquare),
  });
}

function pressureLines(fen: string): readonly PressureLine[] {
  const position = positionFromFen(fen);
  const values: PressureLine[] = [];
  for (const [sliderSquare, slider] of position.board) {
    if (slider.role !== "bishop" && slider.role !== "rook" && slider.role !== "queen") continue;
    for (const targetRole of ["rook", "queen"] as const) for (const targetSquare of position.board.pieces(opposite(slider.color), targetRole)) {
      const span = between(sliderSquare, targetSquare);
      if (span.isEmpty()) continue;
      const blockers = [...span.intersect(position.board.occupied)];
      if (blockers.length !== 1) continue;
      const screenSquare = blockers[0]!;
      const screen = position.board.get(screenSquare);
      if (screen === undefined || screen.color !== opposite(slider.color) || screen.role === "king" || EXCHANGE_PIECE_VALUES[screen.role] >= EXCHANGE_PIECE_VALUES[targetRole]) continue;
      if (!attacks(slider, sliderSquare, position.board.occupied.without(screenSquare)).has(targetSquare)) continue;
      values.push(Object.freeze({ slider: identity(position, sliderSquare), screen: identity(position, screenSquare), target: identity(position, targetSquare) }));
    }
  }
  return Object.freeze(values.sort((left, right) => left.slider.square.localeCompare(right.slider.square) || left.screen.square.localeCompare(right.screen.square) || left.target.square.localeCompare(right.target.square)));
}

function samePiece(left: BoardPieceIdentity, right: BoardPieceIdentity): boolean {
  return left.square === right.square && left.piece.color === right.piece.color && left.piece.role === right.piece.role;
}

/** Pawn harassment followed immediately by relocation of the same bishop while one pressure line survives. */
export function harassmentPressureSequence(values: readonly RecordedMoveAnchor[]): HarassmentPressureSequence | undefined {
  const anchors = recordedPath(values, 2) as readonly [RecordedMoveAnchor, RecordedMoveAnchor];
  const harassment = pawnDynamicsEvents(anchors[0].beforeFen, anchors[0].moveUci, anchors[0].afterFen).find((event) => event.kind === "minor_harassed");
  if (harassment === undefined) return undefined;
  const pawn = harassment.subjects.pawn as PawnIdentity;
  const minorBefore = harassment.subjects.minor as BoardPieceIdentity;
  if (minorBefore.piece.role !== "bishop") return undefined;
  const reply = parseUci(anchors[1].moveUci);
  if (reply === undefined || !("from" in reply) || makeSquare(reply.from) !== minorBefore.square) return undefined;
  const afterPosition = positionFromFen(anchors[1].afterFen);
  const minorAfter = identity(afterPosition, reply.to);
  if (minorAfter.piece.color !== minorBefore.piece.color || minorAfter.piece.role !== minorBefore.piece.role) return undefined;
  const beforeRelations = pressureLines(anchors[1].beforeFen).filter((line) => samePiece(line.slider, minorBefore));
  const retained = beforeRelations.flatMap((before) => pressureLines(anchors[1].afterFen).filter((after) =>
    after.slider.square === minorAfter.square
      && after.slider.piece.color === before.slider.piece.color
      && after.slider.piece.role === before.slider.piece.role
      && samePiece(after.screen, before.screen)
      && samePiece(after.target, before.target)).map((after) => ({ before, after })))[0];
  if (retained === undefined) return undefined;
  return Object.freeze({
    kind: "harassment_pressure_retained",
    anchors,
    nodes: pathNodes(anchors) as HarassmentPressureSequence["nodes"],
    pawn,
    minor: Object.freeze({ before: minorBefore, after: minorAfter }),
    pressure: Object.freeze(retained),
    conventionId: "pressure-line@1",
  });
}
