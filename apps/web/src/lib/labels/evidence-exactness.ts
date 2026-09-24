// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, ProjectionDeclaration } from "@chess-tabiya/runtime";

export type EvidenceExactness = ProjectionDeclaration["exactness"];

/** How exact a projection's value is (`evidence-contract.ts` ProjectionDeclaration.exactness). */
export const EVIDENCE_EXACTNESS_LABELS: LabelVocabulary<EvidenceExactness> = Object.freeze({
  exact: { label: "exact" },
  convention: { label: "by a stated convention" },
  measured: { label: "measured" },
  authored: { label: "authored" },
});
