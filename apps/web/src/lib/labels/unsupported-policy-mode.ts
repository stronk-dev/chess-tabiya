// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";

/** The server's declared-but-unimplemented opponent modes (`apps/server/src/capabilities.ts` DECLARED_UNIMPLEMENTED_POLICY_MODES). */
export type UnsupportedPolicyMode = "plan_defense" | "human_external";

/** Opponent modes the capability manifest declares as not selectable yet. */
export const UNSUPPORTED_POLICY_MODE_LABELS: LabelVocabulary<UnsupportedPolicyMode> = Object.freeze({
  plan_defense: { label: "Plan defence", gloss: "Not selectable yet: choosing replies that defend against your plan is not implemented." },
  human_external: { label: "External human opponent", gloss: "Not selectable yet: playing an outside human opponent is not implemented." },
});
