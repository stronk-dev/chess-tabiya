import type { Color } from "chessops/types";

import { positionFromFen } from "./chess.js";
import { classifyPhase } from "./phase.js";

export type EndgameTypeId = "pawn" | "rook-and-pawn-vs-rook" | "rook" | "queen" | "minor";

/** Declared convention identity for the material-census endgame classifier. */
export const ENDGAME_CLASSIFICATION_CONVENTION = "endgame-material-census@1" as const;

/**
 * `rules.endgame.classification@1` payload. It classifies material under a declared product
 * convention and deliberately carries no technique record: Lucena/Philidor/Vančura applicability is
 * `theory.endgame.setup_match@1`, computed only under a registered, cited and versioned setup
 * convention (`endgame-setup.ts`; rfc/evidence-value-authority.md §3.4).
 */
export interface EndgameClassification {
  readonly fen: string;
  readonly type: { readonly id: EndgameTypeId; readonly label: string } | null;
  readonly conventionId: typeof ENDGAME_CLASSIFICATION_CONVENTION;
  readonly provenanceNote: string;
}

const PROVENANCE = "Tabiya's material-census convention";

function material(position: ReturnType<typeof positionFromFen>, color: Color): readonly string[] {
  return [...position.board].filter(([, piece]) => piece.color === color && piece.role !== "king" && piece.role !== "pawn").map(([, piece]) => piece.role).sort();
}
function pawnCount(position: ReturnType<typeof positionFromFen>, color: Color): number { return position.board.pieces(color, "pawn").size(); }

/** Material-census classification of an endgame position; `null` outside the phase-band endgame. */
export function endgameClassification(fen: string): EndgameClassification | null {
  if (classifyPhase(fen).phase !== "endgame") return null;
  const position = positionFromFen(fen);
  const white = material(position, "white"), black = material(position, "black");
  let id: EndgameTypeId | null = null;
  let label = "";
  const bare = white.length === 0 && black.length === 0;
  if (bare) { id = "pawn"; label = "Pawn ending"; }
  const krpkr = (white.join() === "rook" && black.join() === "rook") && ((pawnCount(position, "white") === 1 && pawnCount(position, "black") === 0) || (pawnCount(position, "black") === 1 && pawnCount(position, "white") === 0));
  if (krpkr) { id = "rook-and-pawn-vs-rook"; label = "Rook and pawn versus rook"; }
  else if (white.join() === "rook" && black.join() === "rook") { id = "rook"; label = "Rook ending"; }
  else if (white.join() === "queen" && black.join() === "queen") { id = "queen"; label = "Queen ending"; }
  else if (white.length === 1 && black.length === 1 && ["bishop", "knight"].includes(white[0]!) && ["bishop", "knight"].includes(black[0]!)) { id = "minor"; label = "Minor-piece ending"; }
  return Object.freeze({ fen, type: id === null ? null : Object.freeze({ id, label }), conventionId: ENDGAME_CLASSIFICATION_CONVENTION, provenanceNote: PROVENANCE });
}

export function renderEndgameClassification(reading: EndgameClassification | null): readonly string[] {
  if (reading === null) return Object.freeze([]);
  if (reading.type === null) return Object.freeze([`Endgame; the material is outside ${PROVENANCE}.`]);
  return Object.freeze([`${reading.type.label} under ${PROVENANCE}.`]);
}
