import type { PackSummary, RunSummary } from "./api.js";
import { PACK_PHASE_COPY } from "./pack-catalog.js";

// ux-arrival-and-start.md §3.3 B3 (ARR-a8): a Home suggestion rail sourced from the learner's own runs
// in this product. The ranking rule is honest under law 8: it ranks on recorded facts about those
// runs — unfinished, ended short of the objective, a phase never started — and never on a claim about
// chess or a judgement of the learner's play. Every reason sentence restates the fact it came from.

export const HOME_SUGGESTION_RULE = "Suggestions come only from your own runs here: what ended short of its objective, what you left in progress, and phases you have not started. Tabiya does not judge your play to choose them.";

/** How many recent runs Home loads to rank on. */
export const HOME_RUN_WINDOW = 20;

export type HomeSuggestion =
  | { readonly kind: "short_of_objective" | "in_progress"; readonly title: string; readonly because: string; readonly runId: string }
  | { readonly kind: "untouched_phase"; readonly title: string; readonly because: string; readonly packId: string };

const SHORT_OF_OBJECTIVE = new Set<RunSummary["objectiveState"]>(["failed", "degraded"]);
const ENDED_LABEL: Readonly<Partial<Record<RunSummary["objectiveState"], string>>> = Object.freeze({ failed: "Objective missed", degraded: "Objective weakened" });
const PHASES = ["opening", "middlegame", "endgame"] as const;

function titleFor(run: RunSummary, packs: readonly PackSummary[]): string {
  if (run.packId !== null && run.title === run.packId) return packs.find((pack) => pack.id === run.packId)?.title ?? run.title;
  return run.title;
}

/**
 * At most `limit` suggestions in a fixed kind order, most recent first within a kind. `runs` is the
 * newest-first run list; `excludeRunId` is the run the Continue card already offers. Only runs the
 * learner hosts count: a run someone shared with them is not a fact about their own practice.
 */
export function homeSuggestions(input: {
  readonly runs: readonly RunSummary[];
  readonly packs: readonly PackSummary[];
  readonly excludeRunId?: string | undefined;
  /** Total runs the learner has; when more exist than were loaded, phase facts are scoped to the loaded ones. */
  readonly totalRuns?: number;
  readonly limit?: number;
}): readonly HomeSuggestion[] {
  const limit = input.limit ?? 3;
  // A first visit has no facts to rank on; Home offers its plain phase entries instead.
  if (!input.runs.some((run) => run.viewerRole === "host")) return Object.freeze([]);
  const own = input.runs.filter((run) => run.viewerRole === "host" && run.id !== input.excludeRunId)
    .slice().sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
  const suggestions: HomeSuggestion[] = [];
  const short = own.find((run) => SHORT_OF_OBJECTIVE.has(run.objectiveState));
  if (short !== undefined) suggestions.push(Object.freeze({ kind: "short_of_objective", runId: short.id, title: `Return to ${titleFor(short, input.packs)}`, because: `Your run ended with ${ENDED_LABEL[short.objectiveState]!.toLocaleLowerCase()}. Rewind to the decision and try another way.` }));
  const open = own.find((run) => run.objectiveState === "active" && run.recordedMoveCount > 0 && run.id !== short?.id);
  if (open !== undefined) suggestions.push(Object.freeze({ kind: "in_progress", runId: open.id, title: `Finish ${titleFor(open, input.packs)}`, because: `Still in progress after ${open.recordedMoveCount} recorded ${open.recordedMoveCount === 1 ? "move" : "moves"} across ${open.branchCount} ${open.branchCount === 1 ? "branch" : "branches"}.` }));
  const playedPhases = new Set(input.runs.filter((run) => run.viewerRole === "host" && run.packId !== null)
    .map((run) => input.packs.find((pack) => pack.id === run.packId)?.phase).filter((phase) => phase !== undefined && phase !== null));
  for (const phase of PHASES) {
    if (playedPhases.has(phase)) continue;
    const pack = input.packs.find((candidate) => candidate.phase === phase);
    if (pack === undefined) continue;
    const label = PACK_PHASE_COPY[phase]!;
    const article = /^[aeiou]/iu.test(label) ? "an" : "a";
    const partial = input.totalRuns !== undefined && input.totalRuns > input.runs.length;
    suggestions.push(Object.freeze({ kind: "untouched_phase", packId: pack.id, title: `Start ${pack.title}`, because: partial
      ? `None of your ${input.runs.length} most recent runs is ${article} ${label.toLocaleLowerCase()} rehearsal.`
      : `You have not started ${article} ${label.toLocaleLowerCase()} rehearsal here yet.` }));
  }
  return Object.freeze(suggestions.slice(0, limit));
}
