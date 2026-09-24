// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { PackPhase } from "@chess-tabiya/schema/drill-pack";

/** Authored phase of a pack (`drill-pack` PACK_PHASES). */
export const PACK_PHASE_LABELS: LabelVocabulary<PackPhase> = Object.freeze({
  opening: { label: "Opening" },
  middlegame: { label: "Middlegame" },
  endgame: { label: "Endgame" },
  cross_phase: { label: "Across phases" },
});
