// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

export type PackReviewStatus = DrillPackDefinition["provenance"]["reviewStatus"];

/** Pack provenance review status (`schemas/drill_pack.schema.json` provenance.reviewStatus). */
export const PACK_REVIEW_STATUS_LABELS: LabelVocabulary<PackReviewStatus> = Object.freeze({
  schema_example: { label: "example content" },
  draft: { label: "draft" },
  published: { label: "published" },
});
