import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";
import type { Move } from "chessops/types";

import { exactLegalMoves } from "@chess-tabiya/runtime";

export { exactLegalMoves } from "@chess-tabiya/runtime";

function internalMove(board: Chess, uci: string): Move {
  const parsed = parseUci(uci);
  if (parsed === undefined) throw new TypeError(`Invalid exact legal move UCI: ${uci}`);
  const move = normalizeMove(board, parsed);
  if (!board.isLegal(move)) throw new TypeError(`Exact legal move is not legal: ${uci}`);
  return move;
}

/** Enumerate exact legal moves, including every promotion role. */
export function legalMoves(board: Chess): readonly Move[] {
  return Object.freeze(exactLegalMoves(makeFen(board.toSetup())).map((move) => internalMove(board, move.uci)));
}

export interface LegalSuccessor {
  readonly fen: string;
  readonly san: string;
  readonly uci: string;
}

/** Replay every exact legal move and retain the notation and successor identity. */
export function legalSuccessors(fen: string): readonly LegalSuccessor[] {
  const board = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  return Object.freeze(exactLegalMoves(fen).map((exact) => {
    const move = internalMove(board, exact.uci);
    const next = board.clone();
    next.play(move);
    const successor = { fen: makeFen(next.toSetup()), san: makeSan(board, move), uci: exact.uci };
    return Object.freeze(successor);
  }));
}
