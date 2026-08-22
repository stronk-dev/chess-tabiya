// Shared research-only implementation of legal-exchange@1. Not production code.
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, Move, Piece, Role, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";

const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
const VALUE: Readonly<Record<Role, number>> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 100,
};

export function researchPosition(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

export function researchPieceValue(role: Role): number {
  return VALUE[role];
}

export function captureAt(pos: Chess, move: Move): Piece | undefined {
  if (!("from" in move)) return undefined;
  const mover = pos.board.get(move.from);
  if (mover === undefined) return undefined;
  const direct = pos.board.get(move.to);
  if (direct !== undefined && direct.color !== mover.color) return direct;
  if (mover.role === "pawn" && pos.epSquare === move.to && move.from % 8 !== move.to % 8) {
    return { color: opposite(mover.color), role: "pawn" };
  }
  return undefined;
}

export function legalCaptureMovesTo(pos: Chess, target: Square, fromOnly?: Square): readonly Move[] {
  const result: Move[] = [];
  for (const [from, dests] of pos.allDests()) {
    if (fromOnly !== undefined && from !== fromOnly) continue;
    if (!dests.has(target)) continue;
    const roles: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (target < 8 || target >= 56)
      ? PROMOTIONS
      : [undefined];
    for (const promotion of roles) {
      const move: Move = promotion === undefined ? { from, to: target } : { from, to: target, promotion };
      if (captureAt(pos, move) !== undefined && pos.isLegal(move)) result.push(move);
    }
  }
  return result;
}

function promotionGain(pos: Chess, move: Move): number {
  if (!("from" in move) || move.promotion === undefined || pos.board.getRole(move.from) !== "pawn") return 0;
  return VALUE[move.promotion] - VALUE.pawn;
}

function continuation(pos: Chess, target: Square, perspective: Color, memo: Map<string, number>): number {
  const key = `${makeFen(pos.toSetup())}|${target}|${perspective}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const sign = pos.turn === perspective ? 1 : -1;
  const values = legalCaptureMovesTo(pos, target).map((move) => {
    const captured = captureAt(pos, move)!;
    const delta = sign * (VALUE[captured.role] + promotionGain(pos, move));
    const next = pos.clone();
    next.play(move);
    return delta + continuation(next, target, perspective, memo);
  });
  const value = pos.turn === perspective ? Math.max(0, ...values) : Math.min(0, ...values);
  memo.set(key, value);
  return value;
}

export function legalExchangeForMove(pos: Chess, move: Move): number | undefined {
  if (!("from" in move) || !pos.isLegal(move)) return undefined;
  const captured = captureAt(pos, move);
  if (captured === undefined) return undefined;
  const perspective = pos.turn;
  const initial = VALUE[captured.role] + promotionGain(pos, move);
  const next = pos.clone();
  next.play(move);
  return initial + continuation(next, move.to, perspective, new Map());
}

export function legalExchange(fen: string, uci: string): number | undefined {
  const pos = researchPosition(fen);
  const move = parseUci(uci);
  return move === undefined ? undefined : legalExchangeForMove(pos, move);
}
