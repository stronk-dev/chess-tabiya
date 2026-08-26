type ObjectiveState = "active" | "preserved" | "degraded" | "failed" | "achieved" | "transitioned";
type RunOutcome = "win" | "loss" | "draw";
type Phase = "opening" | "middlegame" | "endgame" | "unclear";

interface ObjectiveChangeEvidence {
  readonly reference: string;
  readonly text: string;
}

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

export function phaseLabel(phase: Phase): string {
  if (phase === "middlegame") return "Middlegame";
  if (phase === "endgame") return "Endgame";
  if (phase === "unclear") return "Phase unclear";
  return "Opening";
}

export function phaseSummary(authored: unknown, detected: Phase): string {
  if (authored !== "opening" && authored !== "middlegame" && authored !== "endgame") return phaseLabel(detected);
  if (authored === detected) return phaseLabel(detected);
  return `Drill focus: ${phaseLabel(authored)} · Current position: ${phaseLabel(detected)}`;
}

export function objectiveChangeSummaries(evidence: readonly ObjectiveChangeEvidence[]): readonly string[] {
  const summaries = evidence.map((item) => {
    if (item.reference.startsWith("pack:") || item.reference.startsWith("tempo:")) return item.text;
    if (item.reference.startsWith("engine:")) return "A recorded engine assessment affected the drill objective.";
    if (item.reference.startsWith("tablebase:")) return "Exact endgame evidence affected the drill objective.";
    if (/^rules:(?:checkmate|stalemate|draw(?:-|$)|material|result-)/u.test(item.reference)) return item.text;
    if (item.reference.startsWith("rules:structure-")) return "A rules-based position feature affected the drill objective.";
    if (item.reference.startsWith("rules:transition-")) return "A rules-based move consequence affected the drill objective.";
    return "A recorded fact affected the drill objective.";
  });
  return Object.freeze([...new Set(summaries)]);
}
