import { normalizeMove } from "chessops/chess";
import type { Color, NormalMove, Square, SquareName } from "chessops/types";
import { makeSquare, opposite, parseUci } from "chessops/util";

import { canonicalFen, positionFromFen } from "./chess.js";

export type CastlingWing = "kingside" | "queenside";
type CastleSide = "h" | "a";

export interface CastlingRightsState {
  readonly fen: string;
  readonly white: Readonly<Record<CastlingWing, boolean>>;
  readonly black: Readonly<Record<CastlingWing, boolean>>;
}

function sideKey(wing: CastlingWing): CastleSide {
  return wing === "kingside" ? "h" : "a";
}

function rightsFor(position: ReturnType<typeof positionFromFen>, color: Color): Readonly<Record<CastlingWing, boolean>> {
  return Object.freeze({ kingside: position.castles.rook[color].h !== undefined, queenside: position.castles.rook[color].a !== undefined });
}

export function castlingRights(fen: string): CastlingRightsState {
  const position = positionFromFen(fen);
  return Object.freeze({ fen: canonicalFen(position), white: rightsFor(position, "white"), black: rightsFor(position, "black") });
}

export interface CastlingLegalityIssue {
  readonly color: Color;
  readonly wing: CastlingWing;
  readonly kingSquare: SquareName;
  readonly rookSquare: SquareName;
  readonly legalNow: boolean;
  readonly inCheck: boolean;
  readonly blockedSquares: readonly SquareName[];
  readonly attackedSquares: readonly SquareName[];
}

function kingPath(king: Square, color: Color, wing: CastlingWing): readonly Square[] {
  const target = ((color === "white" ? 0 : 56) + (wing === "kingside" ? 6 : 2)) as Square;
  const step = target > king ? 1 : -1;
  const result: Square[] = [];
  for (let square = king + step; ; square += step) {
    result.push(square as Square);
    if (square === target) break;
  }
  return Object.freeze(result);
}

export function castlingLegality(fen: string): readonly CastlingLegalityIssue[] {
  const position = positionFromFen(fen);
  const result: CastlingLegalityIssue[] = [];
  for (const color of ["white", "black"] as const) {
    const king = position.board.kingOf(color);
    if (king === undefined) continue;
    for (const wing of ["kingside", "queenside"] as const) {
      const rook = position.castles.rook[color][sideKey(wing)];
      if (rook === undefined) continue;
      const path = kingPath(king, color, wing);
      const occupiedWithoutCastlePieces = position.board.occupied.without(king).without(rook);
      const blocked = path.filter((square) => occupiedWithoutCastlePieces.has(square));
      const attacked = path.filter((square) => position.kingAttackers(square, opposite(color), occupiedWithoutCastlePieces.with(square)).nonEmpty());
      const castleMove: NormalMove = { from: king, to: rook };
      const legalNow = position.turn === color && position.isLegal(castleMove);
      result.push(Object.freeze({
        color, wing, kingSquare: makeSquare(king), rookSquare: makeSquare(rook), legalNow,
        inCheck: position.turn === color && position.isCheck(),
        blockedSquares: Object.freeze(blocked.map(makeSquare)),
        attackedSquares: Object.freeze(attacked.map(makeSquare)),
      }));
    }
  }
  return Object.freeze(result);
}

export interface CastlingRightLostEvent {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly color: Color;
  readonly wing: CastlingWing;
  readonly cause: "king_moved" | "rook_moved" | "rook_captured" | "castled";
}

export function castlingRightsLost(beforeFen: string, moveUci: string, afterFen: string): readonly CastlingRightLostEvent[] {
  const before = positionFromFen(beforeFen);
  const after = positionFromFen(afterFen);
  const parsed = parseUci(moveUci.toLowerCase());
  if (parsed === undefined || !("from" in parsed)) return [];
  const move = normalizeMove(before, parsed);
  if (!("from" in move) || !before.isLegal(move)) return [];
  const replay = before.clone();
  replay.play(move);
  if (canonicalFen(replay) !== canonicalFen(after)) return [];
  const moving = before.board.get(move.from)!;
  const fileDelta = Math.abs((parsed.to % 8) - (parsed.from % 8));
  const events: CastlingRightLostEvent[] = [];
  for (const color of ["white", "black"] as const) for (const wing of ["kingside", "queenside"] as const) {
    if (!rightsFor(before, color)[wing] || rightsFor(after, color)[wing]) continue;
    const rook = before.castles.rook[color][sideKey(wing)];
    const cause = moving.color === color && moving.role === "king"
      ? fileDelta >= 2 ? "castled" : "king_moved"
      : moving.color === color && moving.role === "rook" && move.from === rook
        ? "rook_moved"
        : "rook_captured";
    events.push(Object.freeze({ beforeFen: canonicalFen(before), moveUci: moveUci.toLowerCase(), afterFen: canonicalFen(after), color, wing, cause }));
  }
  return Object.freeze(events.sort((left, right) => left.color.localeCompare(right.color) || left.wing.localeCompare(right.wing)));
}
