type ObjectiveState = "active" | "preserved" | "degraded" | "failed" | "achieved" | "transitioned";
type RunOutcome = "win" | "loss" | "draw";
type Phase = "opening" | "middlegame" | "endgame" | "unclear";

interface ConsequencePack {
  readonly authoredBoundary?: { readonly plyHorizon?: number };
  readonly legs?: readonly { readonly branchLengthTarget?: number }[];
  readonly spine?: readonly { readonly children: readonly unknown[] }[];
}

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

export function branchDisplayLabel(label: string, firstMove: string, intent?: string): string {
  if (!/^alt-\d+$/u.test(label)) return label;
  const move = firstMove === "At fork" ? "New branch" : firstMove;
  return intent === undefined || intent.trim() === "" ? move : `${move} — ${intent.trim()}`;
}

function spineDepth(nodes: readonly { readonly children: readonly unknown[] }[]): number {
  const depth = (node: { readonly children: readonly unknown[] }): number =>
    1 + Math.max(0, ...node.children.map((child) => depth(child as { readonly children: readonly unknown[] })));
  return Math.max(0, ...nodes.map(depth));
}

export function consequenceHorizon(pack?: ConsequencePack): string {
  if (pack === undefined) return "Full game · until a rules-terminal result";
  const declared = pack.authoredBoundary?.plyHorizon;
  const legTarget = Math.max(0, ...(pack.legs ?? []).map((leg) => leg.branchLengthTarget ?? 0));
  const authored = spineDepth(pack.spine ?? []);
  const plies = Number.isSafeInteger(declared) && declared! > 0 ? declared! : Math.max(legTarget, authored);
  if (plies <= 0) return "Consequence horizon not recorded";
  return `Consequence · up to ${plies} ${plies === 1 ? "ply" : "plies"}`;
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
