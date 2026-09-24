// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { PresentedGraduationEntry } from "../pack-validation-presentation.js";

export type GraduationEntryState = PresentedGraduationEntry["state"];

/** State of a pack graduation entry (`pack-validation-presentation.ts`). */
export const GRADUATION_ENTRY_STATE_LABELS: LabelVocabulary<GraduationEntryState> = Object.freeze({
  blocking: { label: "blocking" },
  resolved: { label: "resolved" },
  accepted: { label: "accepted" },
});
