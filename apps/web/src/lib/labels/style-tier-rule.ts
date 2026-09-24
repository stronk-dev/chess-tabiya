// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, TIER_RULE_ID } from "@chess-tabiya/runtime";

export type TierRule = typeof TIER_RULE_ID;

/** Rule a habit card's tier is read under (`style-contract.ts` TIER_RULE_ID). */
export const STYLE_TIER_RULE_LABELS: LabelVocabulary<TierRule> = Object.freeze({
  "reference_quantile_lower_bound@1": { label: "the reference-population lower-bound rule" },
});
