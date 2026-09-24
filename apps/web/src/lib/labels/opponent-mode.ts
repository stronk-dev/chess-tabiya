// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, RunOpponentMode } from "@chess-tabiya/runtime";

/** Requested opponent resistance (`types.ts` RUN_OPPONENT_MODES). */
export const OPPONENT_MODE_LABELS: LabelVocabulary<RunOpponentMode> = Object.freeze({
  human_common: { label: "Human-model replies", gloss: "The opponent plays moves people commonly choose at the target strength." },
  strong_engine: { label: "Strong engine", gloss: "The opponent plays the engine's strongest reply." },
  theory_strict: { label: "Authored theory replies", gloss: "The opponent follows the pack's authored theory." },
  perfect_tablebase: { label: "Perfect tablebase", gloss: "The opponent plays tablebase-perfect endgame moves." },
  practical_resistance: { label: "Practical tablebase resistance", gloss: "The opponent plays drawing or losing tablebase moves that resist longest in practice." },
});
