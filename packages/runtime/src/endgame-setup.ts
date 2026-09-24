import type { Color, Role, Square } from "chessops/types";

import { canonicalFen, positionFromFen } from "./chess.js";
import { isRegisteredConvention } from "./evidence-conventions.js";

/**
 * Registered, cited and versioned KRPKR setup conventions (`theory.endgame.setup_match@1`).
 *
 * Registration: the three conventions are members of the shared semantic-convention register
 * (`evidence-conventions.ts#CONVENTION_DECLARATIONS`, rfc/semantic-convention-provenance.md), whose
 * declaration carries the definition, limitations and cited sources. This module keeps only the
 * executable operand computers and the verbatim quotes they operationalize; a record here is usable
 * only while its `id@version` is registered, and `evidence-conventions.test.ts` requires the
 * registered declaration to equal the text rendered from this record byte-for-byte. Retrieval
 * receipts and the operationalization choices are in `design/research/endgame-setup-conventions.md`.
 *
 * A match is geometry under the declared convention only. It carries no outcome, advice,
 * reachability or significance: those are separate evidence identities.
 */

export type EndgameTechnique = "lucena" | "philidor" | "vancura";

export interface EndgameConventionSource {
  readonly id: string;
  readonly title: string;
  readonly url: string;
  /** Exact retrieved revision where the publisher exposes one; otherwise the retrieval date only. */
  readonly revision: string;
  readonly retrieved: string;
}

export interface EndgameConventionQuote {
  readonly source: string;
  readonly quote: string;
}

export interface EndgameSetupOperandDeclaration {
  readonly id: string;
  /** The exact predicate the code computes. */
  readonly predicate: string;
  readonly quotes: readonly EndgameConventionQuote[];
  /** Where the code pins something the quoted sentence leaves open; `null` when the quote is exact. */
  readonly operationalization: string | null;
}

export interface EndgameSetupConvention {
  readonly id: string;
  readonly version: number;
  readonly technique: EndgameTechnique;
  readonly name: string;
  readonly sources: readonly string[];
  readonly operands: readonly EndgameSetupOperandDeclaration[];
  /** Published conditions deliberately not required by this version, with the reason. */
  readonly excluded: readonly { readonly condition: string; readonly quote: EndgameConventionQuote; readonly reason: string }[];
}

export interface EndgameConventionRef { readonly id: string; readonly version: number }

const RETRIEVED = "2026-09-24";

/** Every source the setup and method conventions quote; the quotes were retrieved verbatim on 2026-09-24. */
export const ENDGAME_CONVENTION_SOURCES: readonly EndgameConventionSource[] = Object.freeze([
  { id: "wikipedia-lucena", title: "Lucena position — Wikipedia", url: "https://en.wikipedia.org/wiki/Lucena_position", revision: "oldid=1356336262", retrieved: RETRIEVED },
  { id: "chesscom-lucena", title: "Lucena Position — Chess Terms, Chess.com", url: "https://www.chess.com/terms/lucena-position-chess", revision: "retrieved page", retrieved: RETRIEVED },
  { id: "wikipedia-philidor", title: "Philidor position — Wikipedia", url: "https://en.wikipedia.org/wiki/Philidor_position", revision: "oldid=1356336197", retrieved: RETRIEVED },
  { id: "chesscom-philidor", title: "Philidor Position — Chess Terms, Chess.com", url: "https://www.chess.com/terms/philidor-position-chess", revision: "retrieved page", retrieved: RETRIEVED },
  { id: "wikipedia-rpvr", title: "Rook and pawn versus rook endgame — Wikipedia, §Vančura position", url: "https://en.wikipedia.org/wiki/Rook_and_pawn_versus_rook_endgame", revision: "oldid=1364966292", retrieved: RETRIEVED },
  { id: "chessbase-vancura", title: "Karsten Müller: Understanding the Vancura draw — ChessBase (2014)", url: "https://en.chessbase.com/post/karsten-mueller-understanding-the-vancura-draw", revision: "retrieved page", retrieved: RETRIEVED },
].map((source) => Object.freeze(source)));

const q = (source: string, quote: string): EndgameConventionQuote => Object.freeze({ source, quote });

const KRPKR_OPERAND = (quotes: readonly EndgameConventionQuote[]): EndgameSetupOperandDeclaration => ({
  id: "material_krpkr",
  predicate: "Exactly five pieces: one side has king, rook and one pawn; the other has king and rook only. The side with the pawn is the attacker.",
  quotes,
  operationalization: null,
});

function operand(id: string, predicate: string, quotes: readonly EndgameConventionQuote[], operationalization: string | null = null): EndgameSetupOperandDeclaration {
  return { id, predicate, quotes, operationalization };
}

/** The three registered setup conventions. Ranks are relative to the named side (1 = its back rank). */
export const ENDGAME_SETUP_CONVENTIONS: readonly EndgameSetupConvention[] = deepFreeze([
  {
    id: "lucena-setup",
    version: 1,
    technique: "lucena",
    name: "Lucena position",
    sources: ["wikipedia-lucena", "chesscom-lucena"],
    operands: [
      KRPKR_OPERAND([
        q("wikipedia-lucena", "one side has a rook and a pawn and the defender has a rook"),
        q("chesscom-lucena", "It occurs when the defending player has a king and a rook, and the other player has an extra pawn"),
      ]),
      operand("pawn_not_rook_pawn", "The pawn is on one of the b- through g-files.", [
        q("wikipedia-lucena", "the pawn is any pawn except a rook pawn"),
        q("chesscom-lucena", "the extra pawn that is almost promoting cannot be on the first or eighth file"),
      ]),
      operand("pawn_on_seventh", "The pawn stands on the attacker's seventh rank.", [
        q("wikipedia-lucena", "the pawn has advanced to the seventh rank"),
      ]),
      operand("attacking_king_on_queening_square", "The attacking king stands on the pawn's promotion square.", [
        q("wikipedia-lucena", "the attacking king (the one with the pawn) is on the queening square of its pawn"),
        q("chesscom-lucena", "a king that occupies the promotion square"),
      ]),
      operand("attacking_rook_cuts_off_defending_king", "The attacking rook stands on a file strictly between the pawn's file and the defending king's file, and every square of the rook's file from the rook to the defending king's rank is empty.", [
        q("wikipedia-lucena", "the attacking rook cuts off the opposing king from the pawn by at least one file"),
        q("chesscom-lucena", "a rook that cuts off the enemy king by at least one file"),
      ], "\"Cuts off by a file\" is pinned as the rook standing between the two files with an unobstructed ray along its file to the defending king's rank; a rook whose file ray is blocked does not cut the king off (the D2495 blocked-ray falsifier)."),
    ],
    excluded: [{
      condition: "defending rook on the file on the other side of the pawn",
      quote: q("wikipedia-lucena", "the defending rook is on the file on the other side of the pawn"),
      reason: "Chess.com's definition omits it; v1 requires only the conditions both sources state, and a defending rook elsewhere does not make the listed geometry less of a Lucena setup under Chess.com's reading.",
    }],
  },
  {
    id: "philidor-third-rank-setup",
    version: 1,
    technique: "philidor",
    name: "Philidor position (third-rank defence)",
    sources: ["wikipedia-philidor"],
    operands: [
      KRPKR_OPERAND([q("wikipedia-philidor", "a chess endgame involving a drawing technique for the defending side in the rook and pawn versus rook endgame")]),
      operand("defending_king_on_or_adjacent_to_queening_square", "The defending king stands on the pawn's promotion square or on a square adjacent to it (king distance at most 1); any pawn file.", [
        q("wikipedia-philidor", "The defending king (white king in the diagram) is on the queening square of the pawn (or adjacent to it). The pawn can be on any file."),
      ]),
      operand("pawn_short_of_defender_third_rank", "The pawn stands on the attacker's fifth rank or lower.", [
        q("wikipedia-philidor", "The opposing pawn has not yet reached the defender's third rank (its sixth rank)."),
      ]),
      operand("attacking_king_beyond_defender_third_rank", "The attacking king stands on the defender's fourth rank or farther from the defender's back rank.", [
        q("wikipedia-philidor", "The opposing king is beyond the defender's third rank."),
      ]),
      operand("defending_rook_on_defender_third_rank", "The defending rook stands on the defender's third rank.", [
        q("wikipedia-philidor", "The defender's rook is on the third rank, keeping the opposing king off that rank."),
      ], "The source's purpose clause (\"keeping the opposing king off that rank\") is not an extra square-control predicate: v1 requires the rook's rank only."),
    ],
    excluded: [{
      condition: "defending king exactly on the promotion square, pawn at least four squares from promotion, rook merely with access to the third rank",
      quote: q("chesscom-philidor", "The defending player's king must occupy the promotion square of the attacking pawn"),
      reason: "Chess.com states a narrower king condition, a stricter pawn distance (\"at least four squares away from promotion\") and rook access rather than placement; v1 adopts the Wikipedia characteristic list, and the disagreement is disclosed rather than averaged.",
    }],
  },
  {
    id: "vancura-setup",
    version: 1,
    technique: "vancura",
    name: "Vančura position",
    sources: ["wikipedia-rpvr", "chessbase-vancura"],
    operands: [
      KRPKR_OPERAND([q("wikipedia-rpvr", "a drawing position with a rook and rook's pawn versus a rook")]),
      operand("rook_pawn", "The pawn is on the a- or h-file.", [
        q("wikipedia-rpvr", "a drawing position with a rook and rook's pawn versus a rook"),
      ]),
      operand("pawn_not_beyond_sixth", "The pawn stands on the attacker's sixth rank or lower.", [
        q("wikipedia-rpvr", "when the pawn is not beyond its sixth rank"),
      ]),
      operand("attacking_rook_in_front_of_pawn", "The attacking rook stands on the pawn's file on a higher attacker-relative rank than the pawn.", [
        q("wikipedia-rpvr", "and the stronger side's rook is in front of the pawn"),
      ]),
      operand("defending_rook_attacks_pawn_from_side", "The defending rook stands on the pawn's rank and every square between them is empty.", [
        q("wikipedia-rpvr", "Black's rook keeps attacking the pawn from the side from some distance away"),
      ], "\"From some distance away\" is not pinned to a minimum distance in v1; only the lateral, unobstructed attack is required."),
      operand("defending_king_beyond_its_rook", "The defending king's file is on the far side of the defending rook's file from the pawn.", [
        q("wikipedia-rpvr", "The black king must be on the opposite side of their rook as the pawn to not block the attacks."),
      ]),
      operand("defending_king_in_drawing_zone", "The defending king stands on the attacker's seventh rank on one of the two files farthest from the pawn (g7/h7 for a White a-pawn; mirrored by file and colour).", [
        q("chessbase-vancura", "Black's king stays in the drawing zone g7 and h7"),
        q("wikipedia-rpvr", "Black's king must be near the corner on the opposite side of the board"),
      ], "The two cited squares are for a White a-pawn; the h-pawn and Black-pawn cases are the file and colour mirror images."),
    ],
    excluded: [],
  },
]);

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const entry of Object.values(value)) deepFreeze(entry);
    Object.freeze(value);
  }
  return value;
}

/** The code record for a setup convention, only while that exact `id@version` is registered. */
export function endgameSetupConvention(ref: EndgameConventionRef): EndgameSetupConvention | undefined {
  if (!isRegisteredConvention(ref)) return undefined;
  return ENDGAME_SETUP_CONVENTIONS.find((convention) => convention.id === ref.id && convention.version === ref.version);
}

// ---------------------------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------------------------

export interface KrpkrPlacement {
  readonly attacker: Color;
  readonly pawn: Square;
  readonly attackerKing: Square;
  readonly attackerRook: Square;
  readonly defenderKing: Square;
  readonly defenderRook: Square;
}

type Position = ReturnType<typeof positionFromFen>;

const opposite = (color: Color): Color => color === "white" ? "black" : "white";
const fileOf = (square: Square): number => square & 7;
const boardRank = (square: Square): number => (square >> 3) + 1;
/** Rank counted from `color`'s own back rank (1..8). */
export const rankFor = (color: Color, square: Square): number => color === "white" ? boardRank(square) : 9 - boardRank(square);
const chebyshev = (left: Square, right: Square): number => Math.max(Math.abs(fileOf(left) - fileOf(right)), Math.abs(boardRank(left) - boardRank(right)));
const squareName = (square: Square): string => `${"abcdefgh"[fileOf(square)]}${boardRank(square)}`;

function only(position: Position, color: Color, role: Role): Square | undefined {
  const squares = [...position.board.pieces(color, role)];
  return squares.length === 1 ? squares[0] : undefined;
}

/** Exact KRPKR placement (five pieces, one pawn); `null` for any other material. */
export function krpkrPlacement(position: Position): KrpkrPlacement | null {
  if ([...position.board].length !== 5) return null;
  const whitePawns = position.board.pieces("white", "pawn").size();
  const blackPawns = position.board.pieces("black", "pawn").size();
  const attacker: Color | undefined = whitePawns === 1 && blackPawns === 0 ? "white" : blackPawns === 1 && whitePawns === 0 ? "black" : undefined;
  if (attacker === undefined) return null;
  const defender = opposite(attacker);
  const pawn = only(position, attacker, "pawn");
  const attackerKing = only(position, attacker, "king");
  const attackerRook = only(position, attacker, "rook");
  const defenderKing = only(position, defender, "king");
  const defenderRook = only(position, defender, "rook");
  if (pawn === undefined || attackerKing === undefined || attackerRook === undefined || defenderKing === undefined || defenderRook === undefined) return null;
  return Object.freeze({ attacker, pawn, attackerKing, attackerRook, defenderKing, defenderRook });
}

const promotionSquare = (placement: KrpkrPlacement): Square => ((placement.attacker === "white" ? 7 : 0) * 8 + fileOf(placement.pawn)) as Square;

function emptyBetweenOnRank(position: Position, left: Square, right: Square): boolean {
  if (boardRank(left) !== boardRank(right)) return false;
  const row = boardRank(left) - 1;
  for (let file = Math.min(fileOf(left), fileOf(right)) + 1; file < Math.max(fileOf(left), fileOf(right)); file += 1) {
    if (position.board.get((row * 8 + file) as Square) !== undefined) return false;
  }
  return true;
}

function emptyFileRayToRank(position: Position, from: Square, targetRank: number): boolean {
  const step = targetRank > boardRank(from) ? 1 : -1;
  for (let rank = boardRank(from) + step; step > 0 ? rank <= targetRank : rank >= targetRank; rank += step) {
    if (position.board.get(((rank - 1) * 8 + fileOf(from)) as Square) !== undefined) return false;
  }
  return true;
}

type OperandComputer = (placement: KrpkrPlacement, position: Position) => boolean;

const COMPUTERS: Readonly<Record<string, OperandComputer>> = Object.freeze({
  pawn_not_rook_pawn: (p) => fileOf(p.pawn) !== 0 && fileOf(p.pawn) !== 7,
  pawn_on_seventh: (p) => rankFor(p.attacker, p.pawn) === 7,
  attacking_king_on_queening_square: (p) => p.attackerKing === promotionSquare(p),
  attacking_rook_cuts_off_defending_king: (p, position) => {
    const rook = fileOf(p.attackerRook), pawn = fileOf(p.pawn), king = fileOf(p.defenderKing);
    return rook > Math.min(pawn, king) && rook < Math.max(pawn, king) && emptyFileRayToRank(position, p.attackerRook, boardRank(p.defenderKing));
  },
  defending_king_on_or_adjacent_to_queening_square: (p) => chebyshev(p.defenderKing, promotionSquare(p)) <= 1,
  pawn_short_of_defender_third_rank: (p) => rankFor(p.attacker, p.pawn) <= 5,
  attacking_king_beyond_defender_third_rank: (p) => rankFor(opposite(p.attacker), p.attackerKing) >= 4,
  defending_rook_on_defender_third_rank: (p) => rankFor(opposite(p.attacker), p.defenderRook) === 3,
  rook_pawn: (p) => fileOf(p.pawn) === 0 || fileOf(p.pawn) === 7,
  pawn_not_beyond_sixth: (p) => rankFor(p.attacker, p.pawn) <= 6,
  attacking_rook_in_front_of_pawn: (p) => fileOf(p.attackerRook) === fileOf(p.pawn) && rankFor(p.attacker, p.attackerRook) > rankFor(p.attacker, p.pawn),
  defending_rook_attacks_pawn_from_side: (p, position) => boardRank(p.defenderRook) === boardRank(p.pawn) && emptyBetweenOnRank(position, p.defenderRook, p.pawn),
  defending_king_beyond_its_rook: (p) => fileOf(p.pawn) < fileOf(p.defenderRook) ? fileOf(p.defenderKing) > fileOf(p.defenderRook) : fileOf(p.defenderKing) < fileOf(p.defenderRook),
  defending_king_in_drawing_zone: (p) => Math.abs(fileOf(p.defenderKing) - fileOf(p.pawn)) >= 6 && rankFor(p.attacker, p.defenderKing) === 7,
});

// ---------------------------------------------------------------------------------------------
// The setup match
// ---------------------------------------------------------------------------------------------

/** `theory.endgame.setup_match@1` payload. Only a full operand intersection becomes this value. */
export interface EndgameSetupMatch {
  readonly fen: string;
  readonly technique: EndgameTechnique;
  readonly convention: { readonly id: string; readonly version: number; readonly sources: readonly string[] };
  readonly operands: {
    readonly attacker: Color;
    readonly sideToMove: Color;
    readonly squares: { readonly pawn: string; readonly attackerKing: string; readonly attackerRook: string; readonly defenderKing: string; readonly defenderRook: string };
    readonly held: readonly string[];
  };
}

export type EndgameSetupMatchResult =
  | { readonly kind: "matched"; readonly value: EndgameSetupMatch }
  | { readonly kind: "not_matched"; readonly convention: EndgameConventionRef; readonly failedOperandIds: readonly string[] }
  | { readonly kind: "unavailable"; readonly reason: string };

/**
 * Computes every operand of one registered convention from a FEN and returns the intersection.
 * It accepts no technique name, operand value, outcome or caller applicability.
 */
export function endgameSetupMatch(fen: string, ref: EndgameConventionRef): EndgameSetupMatchResult {
  const convention = endgameSetupConvention(ref);
  if (convention === undefined) return Object.freeze({ kind: "unavailable", reason: `setup_convention_unregistered:${ref.id}@${ref.version}` });
  const position = positionFromFen(fen);
  const canonical = canonicalFen(position);
  const conventionRef = Object.freeze({ id: convention.id, version: convention.version });
  const placement = krpkrPlacement(position);
  if (placement === null) return Object.freeze({ kind: "not_matched", convention: conventionRef, failedOperandIds: Object.freeze(["material_krpkr"]) });
  const failed = convention.operands.filter((declared) => declared.id !== "material_krpkr" && !COMPUTERS[declared.id]!(placement, position)).map((declared) => declared.id);
  if (failed.length > 0) return Object.freeze({ kind: "not_matched", convention: conventionRef, failedOperandIds: Object.freeze(failed) });
  return Object.freeze({
    kind: "matched",
    value: deepFreeze({
      fen: canonical,
      technique: convention.technique,
      convention: { id: convention.id, version: convention.version, sources: [...convention.sources] },
      operands: {
        attacker: placement.attacker,
        sideToMove: position.turn,
        squares: { pawn: squareName(placement.pawn), attackerKing: squareName(placement.attackerKing), attackerRook: squareName(placement.attackerRook), defenderKing: squareName(placement.defenderKing), defenderRook: squareName(placement.defenderRook) },
        held: convention.operands.map((declared) => declared.id),
      },
    }),
  });
}

/** Every registered convention that matches the FEN (at most one per technique). */
export function endgameSetupMatches(fen: string): readonly EndgameSetupMatch[] {
  return Object.freeze(ENDGAME_SETUP_CONVENTIONS.flatMap((convention) => {
    const result = endgameSetupMatch(fen, convention);
    return result.kind === "matched" ? [result.value] : [];
  }));
}

/** The one sentence a setup match may render: the technique name, its convention id/version, and nothing else. */
export function renderEndgameSetupMatch(match: EndgameSetupMatch): string {
  const convention = endgameSetupConvention(match.convention)!;
  return `Matches the ${convention.name} setup under convention ${match.convention.id}@${match.convention.version} (geometry only; not an outcome or advice).`;
}
