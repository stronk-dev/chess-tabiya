import type { Color, Role, Square } from "chessops/types";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";

export interface KrpKrGeometry {
  readonly fen: string;
  readonly attacker: Color;
  readonly pawnFile: number;
  readonly pawnRank: number;
  readonly rookPawn: boolean;
  readonly attackerKingOnPromotionSquare: boolean;
  readonly defenderKingOnPromotionSquareOrAdjacent: boolean;
  readonly attackerKingBeyondDefenderThird: boolean;
  readonly defenderRookOnThirdRank: boolean;
  readonly attackerRookCutsDefenderKingByFile: boolean;
  readonly attackerRookInFrontOfPawn: boolean;
  readonly defenderRookAttacksPawnFromSide: boolean;
  readonly defenderKingBeyondSideRook: boolean;
  readonly defenderKingAtOppositeCornerBand: boolean;
  readonly lucenaCanonicalSetup: boolean;
  readonly philidorCanonicalSetup: boolean;
  readonly vancuraCanonicalSetup: boolean;
}

function squareOf(position: ReturnType<typeof positionFromFen>, color: Color, role: Role): Square | undefined {
  const squares = [...position.board.pieces(color, role)];
  return squares.length === 1 ? squares[0] : undefined;
}

function file(square: Square): number { return square & 7; }
function boardRank(square: Square): number { return (square >> 3) + 1; }
function rankFor(color: Color, square: Square): number { return color === "white" ? boardRank(square) : 9 - boardRank(square); }
function opposite(color: Color): Color { return color === "white" ? "black" : "white"; }
function chebyshev(left: Square, right: Square): number {
  return Math.max(Math.abs(file(left) - file(right)), Math.abs(boardRank(left) - boardRank(right)));
}

function clearRank(position: ReturnType<typeof positionFromFen>, left: Square, right: Square): boolean {
  if (boardRank(left) !== boardRank(right)) return false;
  const rank = boardRank(left) - 1;
  const low = Math.min(file(left), file(right));
  const high = Math.max(file(left), file(right));
  for (let candidate = low + 1; candidate < high; candidate += 1) {
    if (position.board.get((rank * 8 + candidate) as Square) !== undefined) return false;
  }
  return true;
}

function clearFileToRank(
  position: ReturnType<typeof positionFromFen>,
  from: Square,
  targetRank: number,
): boolean {
  const fromRank = boardRank(from);
  if (fromRank === targetRank) return true;
  const step = targetRank > fromRank ? 1 : -1;
  for (let candidate = fromRank + step; ; candidate += step) {
    const square = ((candidate - 1) * 8 + file(from)) as Square;
    if (position.board.get(square) !== undefined) return false;
    if (candidate === targetRank) return true;
  }
}

export function krpkrGeometry(fen: string): KrpKrGeometry | null {
  const canonical = canonicalFen(positionFromFen(fen));
  const position = positionFromFen(canonical);
  const whitePawns = [...position.board.pieces("white", "pawn")];
  const blackPawns = [...position.board.pieces("black", "pawn")];
  const attacker: Color | undefined = whitePawns.length === 1 && blackPawns.length === 0
    ? "white"
    : blackPawns.length === 1 && whitePawns.length === 0
      ? "black"
      : undefined;
  if (attacker === undefined) return null;
  const defender = opposite(attacker);
  const pawn = squareOf(position, attacker, "pawn");
  const attackerKing = squareOf(position, attacker, "king");
  const attackerRook = squareOf(position, attacker, "rook");
  const defenderKing = squareOf(position, defender, "king");
  const defenderRook = squareOf(position, defender, "rook");
  if (pawn === undefined || attackerKing === undefined || attackerRook === undefined || defenderKing === undefined || defenderRook === undefined) return null;
  if ([...position.board].length !== 5) return null;

  const pawnFile = file(pawn);
  const pawnRank = rankFor(attacker, pawn);
  const promotion = ((attacker === "white" ? 7 : 0) * 8 + pawnFile) as Square;
  const rookPawn = pawnFile === 0 || pawnFile === 7;
  const attackerKingOnPromotionSquare = attackerKing === promotion;
  const defenderKingOnPromotionSquareOrAdjacent = chebyshev(defenderKing, promotion) <= 1;
  const attackerKingBeyondDefenderThird = rankFor(defender, attackerKing) > 3;
  const defenderRookOnThirdRank = rankFor(defender, defenderRook) === 3;
  const attackerRookCutsDefenderKingByFile =
    (file(attackerRook) > Math.min(pawnFile, file(defenderKing))) &&
    (file(attackerRook) < Math.max(pawnFile, file(defenderKing))) &&
    clearFileToRank(position, attackerRook, boardRank(defenderKing));
  const attackerRookInFrontOfPawn = file(attackerRook) === pawnFile && rankFor(attacker, attackerRook) > pawnRank;
  const defenderRookAttacksPawnFromSide = boardRank(defenderRook) === boardRank(pawn) && clearRank(position, defenderRook, pawn);
  const defenderKingBeyondSideRook = pawnFile < file(defenderRook)
    ? file(defenderKing) > file(defenderRook)
    : file(defenderKing) < file(defenderRook);
  const defenderKingAtOppositeCornerBand = Math.abs(file(defenderKing) - pawnFile) >= 6 && rankFor(attacker, defenderKing) === 7;

  const lucenaCanonicalSetup = !rookPawn && pawnRank === 7 && attackerKingOnPromotionSquare && attackerRookCutsDefenderKingByFile;
  const philidorCanonicalSetup = pawnRank < 6 && defenderKingOnPromotionSquareOrAdjacent && attackerKingBeyondDefenderThird && defenderRookOnThirdRank;
  const vancuraCanonicalSetup = rookPawn && pawnRank <= 6 && attackerRookInFrontOfPawn && defenderRookAttacksPawnFromSide && defenderKingBeyondSideRook && defenderKingAtOppositeCornerBand;

  return Object.freeze({
    fen: canonical,
    attacker,
    pawnFile,
    pawnRank,
    rookPawn,
    attackerKingOnPromotionSquare,
    defenderKingOnPromotionSquareOrAdjacent,
    attackerKingBeyondDefenderThird,
    defenderRookOnThirdRank,
    attackerRookCutsDefenderKingByFile,
    attackerRookInFrontOfPawn,
    defenderRookAttacksPawnFromSide,
    defenderKingBeyondSideRook,
    defenderKingAtOppositeCornerBand,
    lucenaCanonicalSetup,
    philidorCanonicalSetup,
    vancuraCanonicalSetup,
  });
}
