type ObjectiveState = "active" | "preserved" | "degraded" | "failed" | "achieved" | "transitioned";
type RunOutcome = "win" | "loss" | "draw";

const OBJECTIVE_STATE_LABELS: Readonly<Record<ObjectiveState, string>> = Object.freeze({
  active: "In progress",
  preserved: "Objective held",
  degraded: "Objective weakened",
  failed: "Objective missed",
  achieved: "Objective reached",
  transitioned: "Next phase reached",
});

const RUN_OUTCOME_LABELS: Readonly<Record<RunOutcome, string>> = Object.freeze({
  win: "Game won",
  loss: "Game lost",
  draw: "Game drawn",
});

export function objectiveStateLabel(state: ObjectiveState): string {
  return OBJECTIVE_STATE_LABELS[state];
}

export function runOutcomeLabel(outcome: RunOutcome): string {
  return RUN_OUTCOME_LABELS[outcome];
}
