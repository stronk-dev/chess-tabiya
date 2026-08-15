import { attacks, between, pawnAttacks } from "chessops/attacks";
import { makeFen } from "chessops/fen";
import { SquareSet } from "chessops/squareSet";
import type { Color, Piece, Role, Square, SquareName } from "chessops/types";
import { makeSquare, opposite, parseUci } from "chessops/util";

import {
  TRANSITION_FEATURE_KINDS,
  type TransitionExpression,
  type TransitionFeature,
  type TransitionFeatureKind,
} from "@chess-tabiya/schema/drill-pack";

import { positionFromFen } from "./chess.js";
import {
  matchesStructuralExpression,
  structuralFeatureKinds,
} from "./structure.js";

export { TRANSITION_FEATURE_KINDS };

export type TransitionObservation =
  | {
      readonly kind: "attacked_squares_changed";
      readonly color: Color;
      readonly direction: "gained" | "lost";
      readonly count: number;
      readonly squares?: readonly SquareName[];
      readonly provenanceNote: string;
    }
  | {
      readonly kind: "defended_squares_changed";
      readonly color: Color;
      readonly direction: "gained" | "lost";
      readonly count: number;
      readonly squares?: readonly SquareName[];
      readonly provenanceNote: string;
    }
  | {
      readonly kind: "slider_lines_changed";
      readonly color: Color;
      readonly direction: "opened" | "closed";
      readonly count: number;
      readonly squares?: readonly SquareName[];
      readonly provenanceNote: string;
    }
  | {
      readonly kind: "escape_squares_changed";
      readonly color: Color;
      readonly direction: "gained" | "lost";
      readonly count: number;
      readonly squares?: readonly SquareName[];
      readonly provenanceNote: string;
    }
  | {
      readonly kind: "defended_duties_changed";
      readonly color: Color;
      readonly direction: "acquired" | "released";
      readonly count: number;
      readonly squares?: readonly SquareName[];
      readonly provenanceNote: string;
    }
  | {
      readonly kind: "move_irreversibility";
      readonly color?: Color;
      readonly subkind: "castled" | "last_of_role" | "pawn_break" | "clock_zeroed";
      readonly provenanceNote: string;
    };

export interface TransitionReading {
  readonly before: string;
  readonly moveUci: string;
  readonly after: string;
  readonly observations: readonly TransitionObservation[];
}

type Position = ReturnType<typeof positionFromFen>;

interface AttackMap {
  readonly counts: Readonly<Record<Color, Int8Array>>;
  readonly attacked: Readonly<Record<Color, SquareSet>>;
  readonly bySquare: readonly (SquareSet | undefined)[];
}

function attackMap(position: Position): AttackMap {
  const counts = { white: new Int8Array(64), black: new Int8Array(64) };
  const bySquare: (SquareSet | undefined)[] = new Array(64);
  let white = SquareSet.empty();
  let black = SquareSet.empty();
  for (const [square, piece] of position.board) {
    const destinations = attacks(piece, square, position.board.occupied);
    bySquare[square] = destinations;
    for (const target of destinations) counts[piece.color][target]! += 1;
    if (piece.color === "white") white = white.union(destinations);
    else black = black.union(destinations);
  }
  return { counts, attacked: { white, black }, bySquare };
}

function changedOccupiedTargets(
  before: Position,
  after: Position,
  beforeMap: AttackMap,
  afterMap: AttackMap,
  color: Color,
  relation: "attack" | "defend",
): { readonly gained: readonly SquareName[]; readonly lost: readonly SquareName[] } {
  const targetColor = relation === "attack" ? opposite(color) : color;
  const shared = before.board[targetColor].intersect(after.board[targetColor]);
  const gained: SquareName[] = [];
  const lost: SquareName[] = [];
  for (const square of shared) {
    const was = beforeMap.counts[color][square]! > 0;
    const now = afterMap.counts[color][square]! > 0;
    if (!was && now) gained.push(makeSquare(square));
    if (was && !now) lost.push(makeSquare(square));
  }
  return { gained: Object.freeze(gained.sort()), lost: Object.freeze(lost.sort()) };
}

const SLIDER_DIRECTIONS: Readonly<Record<"bishop" | "rook" | "queen", readonly (readonly [number, number])[]>> = {
  bishop: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  rook: [[-1, 0], [1, 0], [0, -1], [0, 1]],
  queen: [[-1, -1], [1, -1], [-1, 1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]],
};

function lineBlockers(position: Position, color: Color): ReadonlyMap<number, number> {
  const result = new Map<number, number>();
  for (const [square, piece] of position.board) {
    if (piece.color !== color || !(piece.role in SLIDER_DIRECTIONS)) continue;
    for (const [df, dr] of SLIDER_DIRECTIONS[piece.role as "bishop" | "rook" | "queen"]) {
      let file = square % 8;
      let rank = Math.floor(square / 8);
      let endpoint = square;
      while (file + df >= 0 && file + df < 8 && rank + dr >= 0 && rank + dr < 8) {
        file += df;
        rank += dr;
        endpoint = file + rank * 8;
      }
      const span = between(square, endpoint as Square);
      if (!span.isEmpty()) result.set(square * 64 + endpoint, span.intersect(position.board.occupied).size());
    }
  }
  return result;
}

function lineChanges(before: ReadonlyMap<number, number>, after: ReadonlyMap<number, number>): { opened: number; closed: number } {
  let opened = 0;
  let closed = 0;
  for (const [key, current] of after) {
    const previous = before.get(key);
    if (previous === undefined) continue;
    if (current < previous) opened += 1;
    else if (current > previous) closed += 1;
  }
  return { opened, closed };
}

function geometricDestinations(position: Position, map: AttackMap, square: Square, piece: Piece): SquareSet {
  let result = map.bySquare[square]!.diff(position.board[piece.color]);
  if (piece.role !== "pawn") return result;
  result = result.intersect(position.board[opposite(piece.color)]);
  const step = piece.color === "white" ? 8 : -8;
  const one = square + step;
  if (one >= 0 && one < 64 && !position.board.occupied.has(one as Square)) {
    result = result.with(one as Square);
    const home = piece.color === "white" ? Math.floor(square / 8) === 1 : Math.floor(square / 8) === 6;
    const two = square + step * 2;
    if (home && !position.board.occupied.has(two as Square)) result = result.with(two as Square);
  }
  return result;
}

function safeDestinations(position: Position, map: AttackMap, color: Color): ReadonlyMap<Square, SquareSet> {
  const result = new Map<Square, SquareSet>();
  for (const square of position.board[color]) {
    const piece = position.board.get(square)!;
    result.set(square, geometricDestinations(position, map, square, piece).diff(map.attacked[opposite(color)]));
  }
  return result;
}

function escapeChanges(before: Position, after: Position, beforeMap: AttackMap, afterMap: AttackMap, color: Color): { gained: number; lost: number } {
  const left = safeDestinations(before, beforeMap, color);
  const right = safeDestinations(after, afterMap, color);
  let gained = 0;
  let lost = 0;
  for (const [square, previous] of left) {
    const beforePiece = before.board.get(square);
    const afterPiece = after.board.get(square);
    const current = right.get(square);
    if (current === undefined || beforePiece?.role !== afterPiece?.role || beforePiece?.color !== afterPiece?.color) continue;
    gained += current.diff(previous).size();
    lost += previous.diff(current).size();
  }
  return { gained, lost };
}

function duties(position: Position, map: AttackMap): ReadonlyMap<Square, number> {
  const result = new Map<Square, number>();
  for (const [square, piece] of position.board) {
    const count = map.bySquare[square]!
      .intersect(position.board[piece.color])
      .intersect(map.attacked[opposite(piece.color)])
      .size();
    result.set(square, count);
  }
  return result;
}

function dutyChanges(before: Position, after: Position, beforeMap: AttackMap, afterMap: AttackMap, color: Color): { acquired: number; released: number } {
  const left = duties(before, beforeMap);
  const right = duties(after, afterMap);
  let acquired = 0;
  let released = 0;
  for (const [square, previous] of left) {
    const beforePiece = before.board.get(square);
    const afterPiece = after.board.get(square);
    if (beforePiece?.color !== color || afterPiece?.color !== color || beforePiece.role !== afterPiece.role) continue;
    const current = right.get(square) ?? 0;
    if (previous < 2 && current >= 2) acquired += 1;
    if (previous >= 2 && current < 2) released += 1;
  }
  return { acquired, released };
}

export function capturedRole(before: Position, after: Position, moveUci: string): { readonly color: Color; readonly role: Role } | undefined {
  const move = parseUci(moveUci);
  if (move === undefined || !("from" in move)) return undefined;
  const mover = before.board.get(move.from);
  if (mover === undefined) return undefined;
  const direct = before.board.get(move.to);
  if (direct !== undefined && direct.color !== mover.color) return direct;
  if (mover.role === "pawn" && move.from % 8 !== move.to % 8 && after.board.get(move.to)?.role === "pawn") {
    return { color: opposite(mover.color), role: "pawn" };
  }
  return undefined;
}

export type IrreversibilityDetail =
  | { readonly subkind: "castled"; readonly color: Color }
  | { readonly subkind: "last_of_role"; readonly color: Color; readonly role: Role; readonly queensOff: boolean }
  | { readonly subkind: "pawn_break"; readonly color: Color };

export function irreversibility(beforeFen: string, moveUci: string, afterFen: string): IrreversibilityDetail | undefined {
  const before = positionFromFen(beforeFen);
  const after = positionFromFen(afterFen);
  const move = parseUci(moveUci);
  if (move === undefined || !("from" in move)) return undefined;
  const mover = before.board.get(move.from);
  if (mover === undefined) return undefined;
  if (mover.role === "king" && Math.abs((move.to % 8) - (move.from % 8)) === 2) return { subkind: "castled", color: mover.color };
  const captured = capturedRole(before, after, moveUci);
  if (captured !== undefined && after.board.pieces(captured.color, captured.role).isEmpty()) {
    return { subkind: "last_of_role", color: captured.color, role: captured.role, queensOff: captured.role === "queen" && after.board.pieces(mover.color, "queen").isEmpty() };
  }
  if (mover.role === "pawn") {
    if (captured !== undefined) return { subkind: "pawn_break", color: mover.color };
    const enemy = after.board.pieces(opposite(mover.color), "pawn");
    const beforeContact = pawnAttacks(mover.color, move.from).intersects(before.board.pieces(opposite(mover.color), "pawn"));
    const afterContact = pawnAttacks(mover.color, move.to).intersects(enemy);
    if (!beforeContact && afterContact) return { subkind: "pawn_break", color: mover.color };
  }
  return undefined;
}

function counts(beforeFen: string, moveUci: string, afterFen: string) {
  const before = positionFromFen(beforeFen);
  const after = positionFromFen(afterFen);
  const beforeMap = attackMap(before);
  const afterMap = attackMap(after);
  const result = new Map<string, number>();
  for (const color of ["white", "black"] as const) {
    for (const relation of ["attack", "defend"] as const) {
      const changed = changedOccupiedTargets(before, after, beforeMap, afterMap, color, relation);
      const prefix = relation === "attack" ? "attacked_squares_changed" : "defended_squares_changed";
      result.set(`${prefix}:${color}:gained`, changed.gained.length);
      result.set(`${prefix}:${color}:lost`, changed.lost.length);
    }
    const lines = lineChanges(lineBlockers(before, color), lineBlockers(after, color));
    result.set(`slider_lines_changed:${color}:opened`, lines.opened);
    result.set(`slider_lines_changed:${color}:closed`, lines.closed);
    const escapes = escapeChanges(before, after, beforeMap, afterMap, color);
    result.set(`escape_squares_changed:${color}:gained`, escapes.gained);
    result.set(`escape_squares_changed:${color}:lost`, escapes.lost);
    const changedDuties = dutyChanges(before, after, beforeMap, afterMap, color);
    result.set(`defended_duties_changed:${color}:acquired`, changedDuties.acquired);
    result.set(`defended_duties_changed:${color}:released`, changedDuties.released);
  }
  return { before, after, counts: result };
}

function compare(actual: number, comparison: "atLeast" | "atMost" | "equal", expected: number): boolean {
  return comparison === "atLeast" ? actual >= expected : comparison === "atMost" ? actual <= expected : actual === expected;
}

function isPlayedEdge(beforeFen: string, moveUci: string, afterFen: string): boolean {
  const before = positionFromFen(beforeFen);
  const move = parseUci(moveUci);
  if (move === undefined || !("from" in move) || !before.isLegal(move)) return false;
  before.play(move);
  return makeFen(before.toSetup()) === makeFen(positionFromFen(afterFen).toSetup());
}

export function matchesTransitionFeature(beforeFen: string, moveUci: string, afterFen: string, feature: TransitionFeature): boolean {
  const state = counts(beforeFen, moveUci, afterFen);
  if (feature.kind === "move_irreversibility") {
    const detail = irreversibility(beforeFen, moveUci, afterFen);
    if (feature.subkind === "clock_zeroed") {
      const move = parseUci(moveUci);
      if (move === undefined || !("from" in move)) return false;
      return state.before.board.get(move.from)?.role === "pawn" || capturedRole(state.before, state.after, moveUci) !== undefined;
    }
    return detail?.subkind === feature.subkind;
  }
  const value = state.counts.get(`${feature.kind}:${feature.color}:${feature.direction}`) ?? 0;
  return compare(value, feature.comparison, feature.count);
}

function matchesTransitionExpressionUnchecked(beforeFen: string, moveUci: string, afterFen: string, expression: TransitionExpression): boolean {
  if (expression.kind === "all") return expression.of.every((child) => matchesTransitionExpressionUnchecked(beforeFen, moveUci, afterFen, child));
  if (expression.kind === "any") return expression.of.some((child) => matchesTransitionExpressionUnchecked(beforeFen, moveUci, afterFen, child));
  if (expression.kind === "not") return !matchesTransitionExpressionUnchecked(beforeFen, moveUci, afterFen, expression.of);
  if (expression.kind === "feature") return matchesTransitionFeature(beforeFen, moveUci, afterFen, expression.feature);
  if (expression.kind === "position") return matchesStructuralExpression(expression.at === "before" ? beforeFen : afterFen, expression.expression);
  const exhaustive: never = expression;
  throw new TypeError(`Unhandled transition expression: ${JSON.stringify(exhaustive)}`);
}

export function matchesTransitionExpression(beforeFen: string, moveUci: string, afterFen: string, expression: TransitionExpression): boolean {
  return isPlayedEdge(beforeFen, moveUci, afterFen)
    && matchesTransitionExpressionUnchecked(beforeFen, moveUci, afterFen, expression);
}

export function transitionFeatureKinds(expression: TransitionExpression): readonly (TransitionFeatureKind | `structure:${string}`)[] {
  if (expression.kind === "all" || expression.kind === "any") return Object.freeze([...new Set(expression.of.flatMap(transitionFeatureKinds))]);
  if (expression.kind === "not") return transitionFeatureKinds(expression.of);
  if (expression.kind === "feature") return [expression.feature.kind];
  if (expression.kind === "position") return structuralFeatureKinds(expression.expression).map((kind) => `structure:${kind}` as const);
  const exhaustive: never = expression;
  throw new TypeError(`Unhandled transition expression: ${JSON.stringify(exhaustive)}`);
}

export function transitionReading(beforeFen: string, moveUci: string, afterFen: string): TransitionReading | null {
  if (!isPlayedEdge(beforeFen, moveUci, afterFen)) return null;
  const state = counts(beforeFen, moveUci, afterFen);
  const observations: TransitionObservation[] = [];
  for (const kind of TRANSITION_FEATURE_KINDS) {
    if (kind === "move_irreversibility") continue;
    const directions: readonly ("gained" | "lost" | "opened" | "closed" | "acquired" | "released")[] = kind === "slider_lines_changed" ? ["opened", "closed"] : kind === "defended_duties_changed" ? ["acquired", "released"] : ["gained", "lost"];
    for (const color of ["white", "black"] as const) for (const direction of directions) {
      const count = state.counts.get(`${kind}:${color}:${direction}`) ?? 0;
      if (count > 0) observations.push({ kind, color, direction, count, provenanceNote: "Tabiya's geometric transition census; significance is not evaluated." } as TransitionObservation);
    }
  }
  const detail = irreversibility(beforeFen, moveUci, afterFen);
  if (detail !== undefined) observations.push({ kind: "move_irreversibility", subkind: detail.subkind, color: detail.color, provenanceNote: "Tabiya's rules-derived irreversibility convention." });
  const parsed = parseUci(moveUci);
  if (parsed !== undefined && "from" in parsed && (state.before.board.get(parsed.from)?.role === "pawn" || capturedRole(state.before, state.after, moveUci) !== undefined)) {
    observations.push({ kind: "move_irreversibility", subkind: "clock_zeroed", provenanceNote: "Capture-or-pawn-move halfmove-clock convention." });
  }
  observations.sort((left, right) => TRANSITION_FEATURE_KINDS.indexOf(left.kind) - TRANSITION_FEATURE_KINDS.indexOf(right.kind) || JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return Object.freeze({ before: beforeFen, moveUci, after: afterFen, observations: Object.freeze(observations.map((value) => Object.freeze(value))) });
}
