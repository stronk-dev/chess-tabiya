// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { Role } from "chessops";

export type PieceRole = Role;

/** Chess piece role. */
export const PIECE_ROLE_LABELS: LabelVocabulary<PieceRole> = Object.freeze({
  pawn: { label: "pawn" },
  knight: { label: "knight" },
  bishop: { label: "bishop" },
  rook: { label: "rook" },
  queen: { label: "queen" },
  king: { label: "king" },
});
