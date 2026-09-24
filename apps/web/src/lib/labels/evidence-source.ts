// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, EvidenceSource } from "@chess-tabiya/runtime";

/** Source of attached evidence (`types.ts` EvidenceSource). */
export const EVIDENCE_SOURCE_LABELS: LabelVocabulary<EvidenceSource> = Object.freeze({
  engine_validated: { label: "engine check" },
  human_model_predicted: { label: "human-move model" },
  tablebase_exact: { label: "exact tablebase" },
});
