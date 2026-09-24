// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, PivotalKind } from "@chess-tabiya/runtime";

/** Kind of pivotal-moment marker (`pivotal.ts` PivotalKind). */
export const PIVOTAL_MARKER_KIND_LABELS: LabelVocabulary<PivotalKind> = Object.freeze({
  irreversibility: { label: "Irreversible change" },
  phase_change: { label: "Phase transition" },
  human_divergence: { label: "Human-choice split" },
  option_collapse: { label: "Options narrowed" },
});
