// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";

/** `schemas/drill_pack.schema.json` `mode`; the TypeScript pack definition leaves it open. */
export type PackMode = "line" | "plan" | "outcome" | "trajectory";

/** Rehearsal mode of a pack. */
export const PACK_MODE_LABELS: LabelVocabulary<PackMode> = Object.freeze({
  line: { label: "Line", gloss: "Recall the theory, then continue" },
  plan: { label: "Plan", gloss: "Choose a plan and play its consequence" },
  outcome: { label: "Outcome", gloss: "Convert, hold, save, or resist" },
  trajectory: { label: "Trajectory", gloss: "Play the position across its phases" },
});
