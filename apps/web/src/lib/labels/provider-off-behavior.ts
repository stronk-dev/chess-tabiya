// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, ProviderOffBehavior } from "@chess-tabiya/runtime";

/** What a binding does when its provider is off (`evidence-contract.ts` ProviderOffBehavior). */
export const PROVIDER_OFF_BEHAVIOR_LABELS: LabelVocabulary<ProviderOffBehavior> = Object.freeze({
  available: { label: "still available" },
  honest_empty: { label: "says there is nothing to show" },
  unavailable: { label: "unavailable" },
});
