import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { makeUci } from "chessops/util";
import type { Move } from "chessops/types";

const PROMOTIONS = Object.freeze(["queen", "rook", "bishop", "knight"] as const);

/** Enumerate exact legal moves, including every promotion role. */
export function legalMoves(board: Chess): readonly Move[] {
  const moves: Move[] = [];
  for (const [from, destinations] of board.allDests()) {
    for (const to of destinations) {
      const promotes = board.board.getRole(from) === "pawn" && (to < 8 || to >= 56);
      if (promotes) {
        for (const promotion of PROMOTIONS) {
          const move: Move = { from, to, promotion };
          if (board.isLegal(move)) moves.push(move);
        }
      } else {
        const move: Move = { from, to };
        if (board.isLegal(move)) moves.push(move);
      }
    }
  }
  return Object.freeze(moves.sort((left, right) => makeUci(left).localeCompare(makeUci(right))));
}

export interface LegalSuccessor {
  readonly fen: string;
  readonly san: string;
  readonly uci: string;
}

/** Replay every exact legal move and retain the notation and successor identity. */
export function legalSuccessors(fen: string): readonly LegalSuccessor[] {
  const board = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  return Object.freeze(legalMoves(board).map((move) => {
    const next = board.clone();
    next.play(move);
    const successor = { fen: makeFen(next.toSetup()), san: makeSan(board, move), uci: makeUci(move) };
    return Object.freeze(successor);
  }));
}
