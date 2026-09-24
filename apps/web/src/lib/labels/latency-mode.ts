// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, ProducerDeclaration } from "@chess-tabiya/runtime";

export type LatencyMode = ProducerDeclaration["latency"];

/** How quickly a producer answers (`evidence-contract.ts` LatencyMode). */
export const LATENCY_MODE_LABELS: LabelVocabulary<LatencyMode> = Object.freeze({
  sync: { label: "immediate" },
  interactive: { label: "within a moment" },
  background: { label: "in the background" },
  offline: { label: "prepared offline" },
});
