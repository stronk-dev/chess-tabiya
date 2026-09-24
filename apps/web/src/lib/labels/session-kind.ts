// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, RunSessionKind } from "@chess-tabiya/runtime";

/** Kind of rehearsal session (`types.ts` RunSessionKind). */
export const SESSION_KIND_LABELS: LabelVocabulary<RunSessionKind> = Object.freeze({
  pack: { label: "Pack rehearsal" },
  position: { label: "Position rehearsal" },
  imported: { label: "Imported game rehearsal" },
});
