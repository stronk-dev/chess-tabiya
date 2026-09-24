// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, EvidenceKind } from "@chess-tabiya/runtime";

/** Kind of attached engine evidence (`types.ts` EvidenceKind); rule 6c's four members. */
export const EVIDENCE_KIND_LABELS: LabelVocabulary<EvidenceKind> = Object.freeze({
  eval: { label: "evaluation" },
  wdl: { label: "win, draw and loss chances" },
  bestline: { label: "best line" },
  tablebase: { label: "tablebase result" },
});
