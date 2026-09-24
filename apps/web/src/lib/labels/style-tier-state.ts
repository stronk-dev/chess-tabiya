// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, TierState } from "@chess-tabiya/runtime";

/** Tier state of a habit card (`style-contract.ts` TierState). */
export const STYLE_TIER_STATE_LABELS: LabelVocabulary<TierState> = Object.freeze({
  insufficient_evidence: { label: "not enough games yet" },
  established: { label: "established" },
  above_reference: { label: "above the reference population" },
  distinctive: { label: "distinctive" },
});
