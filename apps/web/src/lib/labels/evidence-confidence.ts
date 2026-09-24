// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, ProjectionDeclaration } from "@chess-tabiya/runtime";

export type EvidenceConfidence = ProjectionDeclaration["confidence"];

/** Confidence a projection reports (`evidence-contract.ts` ProjectionDeclaration.confidence). */
export const EVIDENCE_CONFIDENCE_LABELS: LabelVocabulary<EvidenceConfidence> = Object.freeze({
  not_applicable: { label: "not applicable" },
  exact: { label: "exact" },
  reported: { label: "as reported by its source" },
});
