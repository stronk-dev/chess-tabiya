// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { SurfaceId } from "../api.js";

/** Product surface in the capability manifest (`api.ts` SurfaceId). */
export const SURFACE_ID_LABELS: LabelVocabulary<SurfaceId> = Object.freeze({
  play: { label: "Play" },
  review: { label: "Review" },
  learn: { label: "Learn" },
  live: { label: "Live" },
  create: { label: "Create" },
  justPlay: { label: "Just Play" },
  fromPosition: { label: "From a position" },
});
