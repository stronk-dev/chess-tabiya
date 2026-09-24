// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary, AnswerDistance } from "@chess-tabiya/runtime";

/** How close a piece of evidence comes to the answer (`evidence-contract.ts` AnswerDistance). */
export const ANSWER_DISTANCE_LABELS: LabelVocabulary<AnswerDistance> = Object.freeze({
  fact: { label: "a fact" },
  pattern: { label: "a pattern" },
  threat: { label: "a threat" },
  theory: { label: "theory" },
  evaluation: { label: "an evaluation" },
  principle: { label: "a principle" },
  plan: { label: "a plan" },
  candidate_moves: { label: "candidate moves" },
  ranked_moves: { label: "ranked moves" },
  move: { label: "a single move" },
  principal_variation: { label: "a full engine line" },
});
