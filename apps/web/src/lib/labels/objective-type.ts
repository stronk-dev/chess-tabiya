// rfc/evidence-presentation.md §6b — one vocabulary, total over its own union type.
// A union member added without a label here is a compile error; never widen this to Partial.
import type { LabelVocabulary } from "@chess-tabiya/runtime";
import type { ObjectiveType } from "@chess-tabiya/schema/drill-pack";

/** Authored objective type (`drill-pack` OBJECTIVE_TYPES). */
export const OBJECTIVE_TYPE_LABELS: LabelVocabulary<ObjectiveType> = Object.freeze({
  reach_structure: { label: "Reach the structure" },
  preserve_plan_window: { label: "Keep the plan available" },
  execute_break: { label: "Carry out the pawn break" },
  prevent_opponent_plan: { label: "Stop the opponent's plan" },
  transition_to_endgame: { label: "Reach the endgame" },
  win: { label: "Win" },
  hold: { label: "Hold the position" },
  save: { label: "Save the game" },
  resist: { label: "Resist as long as possible" },
  play_until_checkpoint: { label: "Play to the checkpoint" },
  follow_theory: { label: "Follow the theory" },
  run_trajectory: { label: "Play through the phases" },
});
