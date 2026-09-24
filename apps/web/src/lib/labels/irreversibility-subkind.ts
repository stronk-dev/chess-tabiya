// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { TransitionFeature } from "@chess-tabiya/schema/drill-pack";

export type IrreversibilitySubkind = Extract<TransitionFeature, { readonly kind: "move_irreversibility" }>["subkind"];

/** Kind of irreversible move property (`drill-pack` TransitionFeature). */
export const IRREVERSIBILITY_SUBKIND_LABELS: LabelVocabulary<IrreversibilitySubkind> = Object.freeze({
  castled: { label: "castling" },
  last_of_role: { label: "last piece of a role" },
  pawn_break: { label: "pawn break" },
  clock_zeroed: { label: "halfmove-clock reset" },
});
