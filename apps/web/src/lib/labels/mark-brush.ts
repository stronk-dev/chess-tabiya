// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, MarkBrush } from "@chess-tabiya/runtime";

/** Colour of a learner's board mark (`types.ts` MARK_BRUSHES). No valence: a mark colour is the learner's own. */
export const MARK_BRUSH_LABELS: LabelVocabulary<MarkBrush> = Object.freeze({
  green: { label: "Green" },
  red: { label: "Red" },
  blue: { label: "Blue" },
  yellow: { label: "Yellow" },
});
