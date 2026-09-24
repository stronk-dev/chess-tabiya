// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, EvidenceForm } from "@chess-tabiya/runtime";

/** Rendered form of evidence (`evidence-contract.ts` EvidenceForm). */
export const EVIDENCE_FORM_LABELS: LabelVocabulary<EvidenceForm> = Object.freeze({
  sentence: { label: "sentence" },
  list: { label: "list" },
  timeline_marker: { label: "timeline marker" },
  lit_squares: { label: "highlighted squares" },
  arrows: { label: "arrows" },
  piece_halo: { label: "piece highlight" },
  panel: { label: "panel" },
  audio: { label: "spoken" },
  machine_condition: { label: "internal condition" },
});
