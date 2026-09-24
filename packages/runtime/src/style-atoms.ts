// rfc/player-style.md §2.3 — the five style atoms plus the castling game-eligibility projection,
// transcribed from the D1062 reference implementation (tools/d1062-style-bot-harness). These are
// literal rules predicates over one position or one edge; they carry no style prose (R21: "No style
// prose lands in those RFCs"). Castling is classified by `chessops.castlingSide`, never by a
// two-file king-step heuristic, so Chess960 king-takes-rook castling classifies correctly (§2.3).
import { castlingSide, normalizeMove } from "chessops/chess";
import type { Color } from "chessops/types";
import { isNormal } from "chessops/types";
import { makeSquare, parseSquare, parseUci } from "chessops/util";

import { positionFromFen } from "./chess.js";
import { exactLegalMoves } from "./legal-moves.js";

export const STANDARD_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
/** `move.pawn_to_extended_center@1`: the destination set, verbatim from D1062. */
export const EXTENDED_CENTER_SQUARES = Object.freeze(["c4", "d4", "e4", "f4", "c5", "d5", "e5", "f5"] as const);
/** `move.early_queen@1`: a queen move from a position whose ply is below this bound. */
export const EARLY_QUEEN_PLY_BOUND = 16;

export type CastledWing = "kingside" | "queenside";

/** `move.castle_side@1`: the wing of a castling move, or null for any other move. */
export function castledWing(fen: string, uci: string): CastledWing | null {
  const position = positionFromFen(fen);
  const parsed = parseUci(uci.toLowerCase());
  if (parsed === undefined || !isNormal(parsed)) return null;
  const move = normalizeMove(position, parsed);
  if (!position.isLegal(move)) return null;
  const side = castlingSide(position, move) ?? castlingSide(position, parsed);
  return side === undefined ? null : side === "h" ? "kingside" : "queenside";
}

/** The castling game-eligibility projection: did `color` hold any castling right in this position? */
export function holdsCastlingRight(fen: string, color: Color): boolean {
  const position = positionFromFen(fen);
  return position.castles.rook[color].a !== undefined || position.castles.rook[color].h !== undefined;
}

const FIANCHETTO_TRIPLES: Readonly<Record<Color, readonly (readonly [string, string, string])[]>> = Object.freeze({
  white: Object.freeze([Object.freeze(["b2", "b3", "c3"] as const), Object.freeze(["g2", "g3", "f3"] as const)]),
  black: Object.freeze([Object.freeze(["b7", "b6", "c6"] as const), Object.freeze(["g7", "g6", "f6"] as const)]),
});

/**
 * `structure.fianchetto_setup@1` (screened=false) and `structure.fianchetto_knight_screen@1`
 * (screened=true): `color`'s bishop on b2/g2 (b7/g7) with its pawn on b3/g3 (b6/g6), and for the
 * screen also its knight on c3/f3 (c6/f6).
 */
export function hasFianchettoConfiguration(fen: string, color: Color, screened: boolean): boolean {
  const position = positionFromFen(fen);
  return FIANCHETTO_TRIPLES[color].some(([bishopName, pawnName, knightName]) => {
    const bishop = position.board.get(parseSquare(bishopName)!);
    const pawn = position.board.get(parseSquare(pawnName)!);
    const knight = position.board.get(parseSquare(knightName)!);
    return bishop?.color === color && bishop.role === "bishop"
      && pawn?.color === color && pawn.role === "pawn"
      && (!screened || (knight?.color === color && knight.role === "knight"));
  });
}

export interface DecisionTraits {
  /** `move.role.pawn@1` */
  readonly pawn: boolean;
  /** `move.pawn_to_extended_center@1` */
  readonly centerPawn: boolean;
  /** `move.early_queen@1` (only meaningful below the ply bound) */
  readonly queen: boolean;
}

export interface DecisionTraitPopulation {
  readonly legalMoves: number;
  /** The complete legal-move population, in the runtime's move identity. */
  readonly legalUcis: readonly string[];
  readonly played: DecisionTraits;
  /** Share of the complete legal-move set exhibiting each trait. */
  readonly share: Readonly<Record<keyof DecisionTraits, number>>;
}

function traitsOf(role: string, destination: string): DecisionTraits {
  return Object.freeze({
    pawn: role === "pawn",
    centerPawn: role === "pawn" && (EXTENDED_CENTER_SQUARES as readonly string[]).includes(destination),
    queen: role === "queen",
  });
}

/**
 * The decision projection over the complete legal-move population. Returns undefined when the
 * played move is not in the legal set (the population is not complete for it).
 */
export function decisionTraitPopulation(fen: string, playedUci: string): DecisionTraitPopulation | undefined {
  const legal = exactLegalMoves(fen);
  if (legal.length === 0) return undefined;
  const position = positionFromFen(fen);
  const parsed = parseUci(playedUci.toLowerCase());
  if (parsed === undefined || !isNormal(parsed)) return undefined;
  const move = normalizeMove(position, parsed);
  if (!isNormal(move) || !position.isLegal(move)) return undefined;
  const piece = position.board.get(move.from);
  if (piece === undefined) return undefined;
  const destination = makeSquare(move.to);
  let pawn = 0, centerPawn = 0, queen = 0;
  for (const candidate of legal) {
    const traits = traitsOf(candidate.role, candidate.to);
    if (traits.pawn) pawn += 1;
    if (traits.centerPawn) centerPawn += 1;
    if (traits.queen) queen += 1;
  }
  return Object.freeze({
    legalMoves: legal.length,
    legalUcis: Object.freeze(legal.map((candidate) => candidate.uci)),
    played: traitsOf(piece.role, destination),
    share: Object.freeze({ pawn: pawn / legal.length, centerPawn: centerPawn / legal.length, queen: queen / legal.length }),
  });
}
