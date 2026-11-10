// Physical identity over one already-authenticated legal edge. Pure shared arithmetic, not an
// evidence issuer or a move validator. Source owners authenticate their full original inputs.
import type { Chess } from "chessops/chess";
import type { NormalMove, Square } from "chessops/types";
import { makeSquare } from "chessops/util";
import type { SliderIdentity } from "./foundation-slider-sources.js";
import { pieceRelocations } from "./tactics.js";

export interface OriginalPiecePosition {
  readonly root: SliderIdentity;
  readonly current: SliderIdentity | null;
}

export function originalPiecePositions(root: Chess, current: Chess, move: NormalMove | null): readonly OriginalPiecePosition[] {
  const relocations = move === null ? [] : pieceRelocations(root, move);
  let captured: Square | undefined;
  if (move !== null) {
    const mover = root.board.get(move.from), target = root.board.get(move.to);
    if (mover === undefined) throw new TypeError("Physical identity lost the original mover");
    if (target !== undefined && target.color !== mover.color) captured = move.to;
    else if (mover.role === "pawn" && move.from % 8 !== move.to % 8 && target === undefined) {
      captured = (move.to + (mover.color === "white" ? -8 : 8)) as Square;
      const victim = root.board.get(captured);
      if (victim?.role !== "pawn" || victim.color === mover.color) throw new TypeError("Physical identity lost the original EP victim");
    }
  }
  const positions = Object.freeze([...root.board.occupied].map(square => {
    const piece = root.board.get(square)!;
    const original = Object.freeze({ color: piece.color, role: piece.role, square: makeSquare(square) });
    if (square === captured) return Object.freeze({ root: original, current: null });
    const at = relocations.find(row => row.from === square)?.to ?? square, occupant = current.board.get(at);
    const role = piece.role === "pawn" && move?.from === square ? move.promotion ?? piece.role : piece.role;
    if (occupant?.color !== piece.color || occupant.role !== role) throw new TypeError("Physical identity lost or replaced an original piece");
    return Object.freeze({ root: original, current: Object.freeze({ color: occupant.color, role: occupant.role, square: makeSquare(at) }) });
  }));
  const retained = positions.flatMap(row => row.current === null ? [] : [row.current.square]);
  if (new Set(retained).size !== retained.length || retained.length !== current.board.occupied.size()) throw new TypeError("Physical identity lost complete board membership");
  return positions;
}
