import { branchPaths } from "./branch-path.js";
import { MAX_COMPARISON_BRANCHES } from "./compare.js";
import type { DrillRun, ObjectiveState, RunOutcome } from "./types.js";

export const BRANCH_COLLAPSE_FLOOR = MAX_COMPARISON_BRANCHES;

export type AssessmentObjective = "win" | "hold" | "save" | "resist";
export type AssessmentCategory = "win" | "loss" | "draw" | "cursed-win" | "blessed-loss";
export type TablebaseCategory = AssessmentCategory | "syzygy-win" | "maybe-win" | "maybe-loss" | "syzygy-loss" | "unknown";

export type DecidednessGround =
  | { readonly kind: "terminal_outcome"; readonly outcome: RunOutcome; readonly nodeId: string }
  | { readonly kind: "objective_terminal"; readonly state: Extract<ObjectiveState, "achieved" | "failed" | "transitioned">; readonly nodeId: string; readonly evidenceRefs: readonly string[] }
  | { readonly kind: "tablebase"; readonly category: AssessmentCategory; readonly pieces: number; readonly nodeId: string; readonly sourceId: string };

export type Decidedness =
  | { readonly state: "decided"; readonly ground: DecidednessGround; readonly admitted: boolean; readonly shortfall: boolean }
  | { readonly state: "undecided"; readonly reason: "no_terminal_fact" | "uncertain_category" }
  | { readonly state: "unknown"; readonly reason: "out_of_range" | "not_probed" | "provider_unavailable" | "withheld" };

const ADMITTED = Object.freeze({
  win: Object.freeze(["win"] as const),
  hold: Object.freeze(["draw", "cursed-win", "blessed-loss"] as const),
  save: Object.freeze(["loss", "blessed-loss"] as const),
  resist: Object.freeze(["loss", "blessed-loss"] as const),
} satisfies Readonly<Record<AssessmentObjective, readonly AssessmentCategory[]>>);
const RANK: Readonly<Record<AssessmentCategory, number>> = Object.freeze({ loss: 0, "blessed-loss": 3, draw: 4, "cursed-win": 5, win: 8 });
const TERMINAL = new Set<ObjectiveState>(["achieved", "failed", "transitioned"]);
const DETERMINATE = new Set<TablebaseCategory>(["win", "loss", "draw", "cursed-win", "blessed-loss"]);

function categoryForOutcome(outcome: RunOutcome): AssessmentCategory { return outcome; }
function classification(objective: AssessmentObjective | undefined, category: AssessmentCategory): { admitted: boolean; shortfall: boolean } {
  if (objective === undefined) return { admitted: category !== "loss", shortfall: category === "loss" };
  const accepted = ADMITTED[objective] as readonly AssessmentCategory[];
  const admitted = accepted.includes(category);
  const minimum = Math.min(...accepted.map((candidate) => RANK[candidate]));
  return { admitted, shortfall: RANK[category] < minimum };
}

export function branchDecidedness(
  run: DrillRun,
  options: {
    readonly objective?: AssessmentObjective;
    readonly tablebase?: Readonly<Record<string, { readonly category: TablebaseCategory; readonly pieces: number; readonly sourceId: string }>>;
    readonly unresolved?: Readonly<Record<string, Extract<Decidedness, { state: "unknown" }>["reason"]>>;
  } = {},
): Readonly<Record<string, Decidedness>> {
  const paths = branchPaths(run);
  return Object.freeze(Object.fromEntries(run.branches.map((branch) => {
    const leaf = paths.get(branch.id)!.at(-1)!;
    const outcome = [...run.events].reverse().find((event) => event.type === "outcome.reached" && event.data.nodeId === leaf.id);
    if (outcome?.type === "outcome.reached") {
      const category = categoryForOutcome(outcome.data.outcome);
      return [branch.id, Object.freeze({ state: "decided", ground: { kind: "terminal_outcome", outcome: outcome.data.outcome, nodeId: leaf.id }, ...classification(options.objective, category) })];
    }
    if (TERMINAL.has(leaf.objectiveState)) {
      const state = leaf.objectiveState as "achieved" | "failed" | "transitioned";
      return [branch.id, Object.freeze({ state: "decided", ground: { kind: "objective_terminal", state, nodeId: leaf.id, evidenceRefs: leaf.evidenceRefs }, admitted: state !== "failed", shortfall: state === "failed" })];
    }
    const tablebase = options.tablebase?.[branch.id];
    if (tablebase !== undefined) {
      if (!DETERMINATE.has(tablebase.category)) return [branch.id, Object.freeze({ state: "undecided", reason: "uncertain_category" })];
      const category = tablebase.category as AssessmentCategory;
      const verdict = options.objective === undefined ? { admitted: false, shortfall: false } : classification(options.objective, category);
      return [branch.id, Object.freeze({ state: "decided", ground: { kind: "tablebase", category, pieces: tablebase.pieces, nodeId: leaf.id, sourceId: tablebase.sourceId }, ...verdict })];
    }
    const unresolved = options.unresolved?.[branch.id];
    return [branch.id, unresolved === undefined ? Object.freeze({ state: "undecided", reason: "no_terminal_fact" }) : Object.freeze({ state: "unknown", reason: unresolved })];
  })));
}

export function collapsedBranchIds(run: DrillRun, decidedness: Readonly<Record<string, Decidedness>>, compareIds: ReadonlySet<string>, pinnedExpanded: ReadonlySet<string>): ReadonlySet<string> {
  if (run.branches.length <= BRANCH_COLLAPSE_FLOOR) return new Set();
  return new Set(run.branches.flatMap((branch) => {
    const fact = decidedness[branch.id];
    return fact?.state === "decided" && fact.shortfall && branch.id !== run.activeCursor.branchId && !compareIds.has(branch.id) && !pinnedExpanded.has(branch.id) ? [branch.id] : [];
  }));
}

export interface CollapseExplanation { readonly branchId: string; readonly text: string; readonly sourceLabel: "Rules" | "Pack" | "Tablebase" }
export function renderCollapseExplanation(branchId: string, decidedness: Extract<Decidedness, { state: "decided" }>, plyOffset: number): CollapseExplanation {
  const ground = decidedness.ground;
  if (ground.kind === "tablebase") return Object.freeze({ branchId, text: `At +${plyOffset} this position is a tablebase ${ground.category} for you, with ${ground.pieces} pieces. Source: Syzygy (tablebase.lichess.org/standard).`, sourceLabel: "Tablebase" });
  if (ground.kind === "objective_terminal") return Object.freeze({ branchId, text: `The recorded objective state on this attempt is failed at +${plyOffset}. Source: recorded objective event.`, sourceLabel: "Pack" });
  return Object.freeze({ branchId, text: ground.outcome === "loss" ? `The learner lost the game. This attempt ended at +${plyOffset}. Source: recorded outcome event.` : `The game ended in a draw. This attempt ended at +${plyOffset}. Source: recorded outcome event and pack objective.`, sourceLabel: "Rules" });
}
