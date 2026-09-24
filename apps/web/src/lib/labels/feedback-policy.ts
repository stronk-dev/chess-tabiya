// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, RunFeedbackPolicy } from "@chess-tabiya/runtime";

/** When feedback is delivered (`types.ts` RunFeedbackPolicy). */
export const FEEDBACK_POLICY_LABELS: LabelVocabulary<RunFeedbackPolicy> = Object.freeze({
  delayed_checkpoint: { label: "At the checkpoint" },
  segment_end: { label: "At the end of the segment" },
  attempt_end: { label: "At the end of the attempt" },
  immediate_guard: { label: "Straight away" },
});
