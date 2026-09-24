// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { RatingPublication } from "@chess-tabiya/runtime/rating";

export type RatingPublicationState = RatingPublication["state"];

/** Publication state of a learner rating (`rating.ts`). */
export const RATING_PUBLICATION_STATE_LABELS: LabelVocabulary<RatingPublicationState> = Object.freeze({
  provisional: { label: "Still gathering games" },
  published: { label: "Measured within the ladder" },
  bounded: { label: "Outside the measured ladder" },
});
