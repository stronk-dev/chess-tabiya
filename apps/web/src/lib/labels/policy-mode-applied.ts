// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, PolicyModeApplied } from "@chess-tabiya/runtime";

/** Opponent policy mode as applied, including the non-requestable members (`types.ts` PolicyModeApplied). */
export const POLICY_MODE_APPLIED_LABELS: LabelVocabulary<PolicyModeApplied> = Object.freeze({
  human_common: { label: "Human-model replies" },
  strong_engine: { label: "Strong engine" },
  theory_strict: { label: "Authored theory replies" },
  perfect_tablebase: { label: "Perfect tablebase" },
  practical_resistance: { label: "Practical tablebase resistance" },
  enumerated: { label: "Enumerated group reply" },
  unknown: { label: "Unrecorded opponent mode" },
});
