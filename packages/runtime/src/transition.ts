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
import { DEVELOPMENT_CONVENTION, isDevelopmentHome } from "./phase.js";
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

export type TransitionSemanticFact =
  | {
      readonly family: "occupied_attack" | "occupied_defence" | "slider_ray" | "piece_escape" | "defended_duty";
      readonly sign: "gained" | "lost" | "preserved";
      readonly subject: Readonly<Record<string, unknown>>;
      readonly targets_before: readonly SquareName[];
      readonly targets_after: readonly SquareName[];
    }
  | {
      readonly family: "castled" | "clock_reset" | "last_of_role" | "pawn_contact" | "checkmate" | "promotion";
      readonly sign: "state";
      readonly mover: Readonly<Record<string, unknown>>;
      readonly from: SquareName;
      readonly to: SquareName;
      readonly detail: Readonly<Record<string, unknown>>;
    }
  | {
      readonly family: "capture";
      readonly sign: "state";
      readonly mover: Readonly<Record<string, unknown>>;
      readonly from: SquareName;
      readonly to: SquareName;
      readonly captured: Readonly<{ color: Color; role: Role }>;
      readonly enPassant: boolean;
    }
  | {
      readonly family: "developed";
      readonly sign: "gained" | "lost";
      readonly mover: Readonly<{ readonly color: Color; readonly role: "knight" | "bishop" }>;
      readonly from: SquareName;
      readonly to: SquareName;
      readonly detail: Readonly<{ readonly conventionId: typeof DEVELOPMENT_CONVENTION; readonly roleMatchedHome: true }>;
    };

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

function actorSquares(position: Position, map: AttackMap, color: Color, target: Square): readonly SquareName[] {
  return Object.freeze([...position.board[color]].filter((square) => map.bySquare[square]?.has(target)).map(makeSquare).sort());
}

function rayDetails(position: Position): ReadonlyMap<string, { readonly subject: Readonly<Record<string, unknown>>; readonly blockers: readonly SquareName[] }> {
  const result = new Map<string, { readonly subject: Readonly<Record<string, unknown>>; readonly blockers: readonly SquareName[] }>();
  for (const [square, piece] of position.board) {
    if (!(piece.role in SLIDER_DIRECTIONS)) continue;
    for (const [df, dr] of SLIDER_DIRECTIONS[piece.role as "bishop" | "rook" | "queen"]) {
      let file = square % 8, rank = Math.floor(square / 8), endpoint = square;
      while (file + df >= 0 && file + df < 8 && rank + dr >= 0 && rank + dr < 8) { file += df; rank += dr; endpoint = file + rank * 8; }
      const blockers = [...between(square, endpoint as Square).intersect(position.board.occupied)].map(makeSquare).sort();
      const subject = Object.freeze({ slider: makeSquare(square), color: piece.color, role: piece.role, endpoint: makeSquare(endpoint as Square) });
      result.set(JSON.stringify(subject), { subject, blockers: Object.freeze(blockers) });
    }
  }
  return result;
}

function dutyTargets(position: Position, map: AttackMap, square: Square): readonly SquareName[] {
  const piece = position.board.get(square);
  if (piece === undefined) return [];
  return Object.freeze([...map.bySquare[square]!.intersect(position.board[piece.color]).intersect(map.attacked[opposite(piece.color)])].map(makeSquare).sort());
}

export function transitionSemanticFacts(beforeFen: string, moveUci: string, afterFen: string): readonly TransitionSemanticFact[] {
  if (!isPlayedEdge(beforeFen, moveUci, afterFen)) return [];
  const before = positionFromFen(beforeFen), after = positionFromFen(afterFen);
  const beforeMap = attackMap(before), afterMap = attackMap(after);
  const facts: TransitionSemanticFact[] = [];
  for (const color of ["white", "black"] as const) for (const relation of ["attack", "defence"] as const) {
    const targetColor = relation === "attack" ? opposite(color) : color;
    for (const square of before.board[targetColor].intersect(after.board[targetColor])) {
      const beforeActors = actorSquares(before, beforeMap, color, square), afterActors = actorSquares(after, afterMap, color, square);
      if ((beforeActors.length === 0) === (afterActors.length === 0)) continue;
      const occupant = before.board.get(square)!;
      facts.push({ family: relation === "attack" ? "occupied_attack" : "occupied_defence", sign: beforeActors.length === 0 ? "gained" : "lost", subject: Object.freeze({ color, target: makeSquare(square), occupant: Object.freeze({ color: occupant.color, role: occupant.role }) }), targets_before: beforeActors, targets_after: afterActors });
    }
  }
  const leftRays = rayDetails(before), rightRays = rayDetails(after);
  for (const key of new Set([...leftRays.keys(), ...rightRays.keys()])) {
    const left = leftRays.get(key), right = rightRays.get(key);
    if (left === undefined || right === undefined || left.blockers.length === right.blockers.length) continue;
    facts.push({ family: "slider_ray", sign: right.blockers.length < left.blockers.length ? "gained" : "lost", subject: left.subject, targets_before: left.blockers, targets_after: right.blockers });
  }
  for (const [square, piece] of before.board) {
    const afterPiece = after.board.get(square);
    if (afterPiece?.color !== piece.color || afterPiece.role !== piece.role) continue;
    const beforeEscapes = [...geometricDestinations(before, beforeMap, square, piece).diff(beforeMap.attacked[opposite(piece.color)])].map(makeSquare).sort();
    const afterEscapes = [...geometricDestinations(after, afterMap, square, afterPiece).diff(afterMap.attacked[opposite(piece.color)])].map(makeSquare).sort();
    const gained = afterEscapes.filter((target) => !beforeEscapes.includes(target));
    const lost = beforeEscapes.filter((target) => !afterEscapes.includes(target));
    const subject = Object.freeze({ piece: makeSquare(square), color: piece.color, role: piece.role });
    if (gained.length > 0) facts.push({ family: "piece_escape", sign: "gained", subject, targets_before: Object.freeze(beforeEscapes), targets_after: Object.freeze(afterEscapes) });
    if (lost.length > 0) facts.push({ family: "piece_escape", sign: "lost", subject, targets_before: Object.freeze(beforeEscapes), targets_after: Object.freeze(afterEscapes) });
    const beforeDuty = dutyTargets(before, beforeMap, square), afterDuty = dutyTargets(after, afterMap, square);
    if (beforeDuty.length < 2 && afterDuty.length >= 2) facts.push({ family: "defended_duty", sign: "gained", subject, targets_before: beforeDuty, targets_after: afterDuty });
    if (beforeDuty.length >= 2 && afterDuty.length < 2) facts.push({ family: "defended_duty", sign: "lost", subject, targets_before: beforeDuty, targets_after: afterDuty });
  }
  const parsed = parseUci(moveUci);
  if (parsed !== undefined && "from" in parsed) {
    const movingPiece = before.board.get(parsed.from);
    if (movingPiece !== undefined) {
      const mover = Object.freeze({ color: movingPiece.color, role: movingPiece.role });
      const from = makeSquare(parsed.from), to = makeSquare(parsed.to);
      if (movingPiece.role === "knight" || movingPiece.role === "bishop") {
        const leftHome = isDevelopmentHome(movingPiece.color, movingPiece.role, from);
        const returnedHome = isDevelopmentHome(movingPiece.color, movingPiece.role, to);
        if (leftHome !== returnedHome) facts.push({
          family: "developed",
          sign: leftHome ? "gained" : "lost",
          mover: Object.freeze({ color: movingPiece.color, role: movingPiece.role }),
          from,
          to,
          detail: Object.freeze({ conventionId: DEVELOPMENT_CONVENTION, roleMatchedHome: true }),
        });
      }
      if (movingPiece.role === "king" && Math.abs((parsed.to % 8) - (parsed.from % 8)) >= 2) facts.push({ family: "castled", sign: "state", mover, from, to, detail: Object.freeze({ resultingKingSquare: Math.floor(parsed.from / 8) * 8 + (parsed.to > parsed.from ? 6 : 2) }) });
      const captured = capturedRole(before, after, moveUci);
      if (captured !== undefined) facts.push({ family: "capture", sign: "state", mover, from, to, captured: Object.freeze(captured), enPassant: before.board.get(parsed.to) === undefined && movingPiece.role === "pawn" && parsed.from % 8 !== parsed.to % 8 });
      if (movingPiece.role === "pawn" || captured !== undefined) facts.push({ family: "clock_reset", sign: "state", mover, from, to, detail: Object.freeze({ pawnMove: movingPiece.role === "pawn", capture: captured !== undefined }) });
      if (captured !== undefined && after.board.pieces(captured.color, captured.role).isEmpty()) facts.push({ family: "last_of_role", sign: "state", mover, from, to, detail: Object.freeze({ capturedColor: captured.color, capturedRole: captured.role }) });
      if (movingPiece.role === "pawn") {
        const enemyPawns = after.board.pieces(opposite(movingPiece.color), "pawn");
        const beforeContact = pawnAttacks(movingPiece.color, parsed.from).intersects(before.board.pieces(opposite(movingPiece.color), "pawn"));
        const afterContact = pawnAttacks(movingPiece.color, parsed.to).intersects(enemyPawns);
        if (!beforeContact && afterContact) facts.push({ family: "pawn_contact", sign: "state", mover, from, to, detail: Object.freeze({ enemyPawnSquares: Object.freeze([...pawnAttacks(movingPiece.color, parsed.to).intersect(enemyPawns)].map(makeSquare).sort()) }) });
      }
      if (parsed.promotion !== undefined) facts.push({ family: "promotion", sign: "state", mover, from, to, detail: Object.freeze({ promotionRole: parsed.promotion }) });
      if (after.isCheckmate()) facts.push({ family: "checkmate", sign: "state", mover, from, to, detail: Object.freeze({ matedSide: after.turn }) });
    }
  }
  return Object.freeze(facts.sort((left, right) => left.family.localeCompare(right.family) || left.sign.localeCompare(right.sign) || JSON.stringify(left).localeCompare(JSON.stringify(right))));
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
  if (mover.role === "king" && Math.abs((move.to % 8) - (move.from % 8)) >= 2) return { subkind: "castled", color: mover.color };
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
