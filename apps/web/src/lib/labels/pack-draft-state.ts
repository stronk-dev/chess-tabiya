// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { PackDraft } from "../api.js";

export type PackDraftState = PackDraft["state"];

/** State of a saved pack or shape draft (`api.ts` PackDraft / ShapeDraft). */
export const PACK_DRAFT_STATE_LABELS: LabelVocabulary<PackDraftState> = Object.freeze({
  draft: { label: "draft" },
  registered: { label: "registered" },
  withdrawn: { label: "withdrawn" },
});
