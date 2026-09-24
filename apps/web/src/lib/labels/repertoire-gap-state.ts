// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { RepertoireGap } from "../api.js";

export type RepertoireGapState = RepertoireGap["state"];

/** State of a repertoire gap (`api.ts` RepertoireGap). */
export const REPERTOIRE_GAP_STATE_LABELS: LabelVocabulary<RepertoireGapState> = Object.freeze({
  open: { label: "No rehearsal yet" },
  addressed: { label: "Rehearsal played — choose your answer" },
  answered: { label: "Repertoire answer chosen" },
});
