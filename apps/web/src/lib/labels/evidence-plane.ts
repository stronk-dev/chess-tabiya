// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, EvidencePlane } from "@chess-tabiya/runtime";

/** Evidence plane of a producer or projection (`evidence-contract.ts`). */
export const EVIDENCE_PLANE_LABELS: LabelVocabulary<EvidencePlane> = Object.freeze({
  rules: { label: "Board rules" },
  transition: { label: "Move consequences" },
  search: { label: "Engine search" },
  human: { label: "Human play" },
  theory: { label: "Chess theory" },
  authored: { label: "Authored content" },
  record: { label: "Game record" },
  derived: { label: "Derived reading" },
});
