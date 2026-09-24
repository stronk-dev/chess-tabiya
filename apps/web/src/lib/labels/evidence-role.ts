// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, EvidenceRole } from "@chess-tabiya/runtime";

/** Viewer role an evidence binding serves (`evidence-contract.ts` EvidenceRole). */
export const EVIDENCE_ROLE_LABELS: LabelVocabulary<EvidenceRole> = Object.freeze({
  learner: { label: "Learner" },
  host: { label: "Host" },
  participant: { label: "Participant" },
  spectator: { label: "Spectator" },
  author: { label: "Author" },
  operator: { label: "Operator" },
});
