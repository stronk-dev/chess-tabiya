// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";

/** `schemas/drill_pack.schema.json` `$defs.deviation.class`; the TypeScript definition leaves it open. */
export type DeviationClass = "required_theory" | "accepted_alternative" | "interesting_deviation" | "concept_violation" | "tactical_error";

/** Authored classification of a deviation from the pack line. No valence: it describes a move (§3.9, law 8). */
export const DEVIATION_CLASS_LABELS: LabelVocabulary<DeviationClass> = Object.freeze({
  required_theory: { label: "required theory" },
  accepted_alternative: { label: "accepted alternative" },
  interesting_deviation: { label: "interesting deviation" },
  concept_violation: { label: "concept violation" },
  tactical_error: { label: "tactical error" },
});
