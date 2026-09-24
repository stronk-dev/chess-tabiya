// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, EXPLORER_SPEEDS } from "@chess-tabiya/runtime";

export type ExplorerSpeed = (typeof EXPLORER_SPEEDS)[number];

/** Lichess time-control class in a corpus population (`provider-types.ts` EXPLORER_SPEEDS). */
export const EXPLORER_SPEED_LABELS: LabelVocabulary<ExplorerSpeed> = Object.freeze({
  ultraBullet: { label: "ultrabullet" },
  bullet: { label: "bullet" },
  blitz: { label: "blitz" },
  rapid: { label: "rapid" },
  classical: { label: "classical" },
  correspondence: { label: "correspondence" },
});
