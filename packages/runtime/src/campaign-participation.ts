import { branchPath } from "./branch-path.js";
import type { CampaignNodeVerdict, CampaignParticipationWitness } from "./campaign-state.js";
import type { DrillRun, Node, ObjectiveState } from "./types.js";

// rfc/campaign-core.md §4.1 — the compiler-owned participation witness. It is a participation fact,
// never a grade: the learner move may be good, bad or losing, and every absorbing verdict remains
// eligible for core progression. It reads only the submitted branch's exact ancestor path and the
// pinned pack's authored boundary.

const ABSORBING: ReadonlySet<ObjectiveState> = new Set<ObjectiveState>(["achieved", "failed", "transitioned"]);

export interface CampaignBoundaryDefinition {
  readonly authoredBoundary?: { readonly plyHorizon?: number } | undefined;
}

export type CampaignParticipationRefusal =
  | "untouched_root"
  | "no_learner_move"
  | "learner_move_off_branch"
  | "before_completion_boundary";

export type CampaignParticipationResult =
  | { readonly kind: "witnessed"; readonly verdict: CampaignNodeVerdict; readonly witness: CampaignParticipationWitness; readonly tip: Node }
  | { readonly kind: "refused"; readonly reason: CampaignParticipationRefusal; readonly detail: string };

/**
 * `deriveCampaignParticipationWitness`: at least one learner `move.committed` on the submitted branch
 * after the run root, and then either an absorbing objective at the submitted tip or the pack's
 * checked authored boundary (`plyHorizon`) reached at that tip.
 */
export function deriveCampaignParticipationWitness(run: DrillRun, branchId: string, pack: CampaignBoundaryDefinition): CampaignParticipationResult {
  const path = branchPath(run, branchId);
  const tip = path[path.length - 1]!;
  if (path.length <= 1) return Object.freeze({ kind: "refused", reason: "untouched_root", detail: "the submitted branch has no move after the run root" });
  const onPath = new Set(path.map((node) => node.id));
  const learnerNodes = path.slice(1).filter((node) => node.actor === "user");
  if (learnerNodes.length === 0) {
    const elsewhere = run.nodes.some((node) => node.actor === "user" && !onPath.has(node.id));
    return Object.freeze(elsewhere
      ? { kind: "refused", reason: "learner_move_off_branch", detail: "the learner's moves are on another branch, not the submitted one" }
      : { kind: "refused", reason: "no_learner_move", detail: "the submitted branch carries no learner move" });
  }
  const learnerNode = learnerNodes[0]!;
  const event = run.events.find((candidate) => candidate.type === "move.committed" && candidate.data.node.id === learnerNode.id);
  if (event === undefined) return Object.freeze({ kind: "refused", reason: "no_learner_move", detail: "the learner move has no committed event" });
  if (path.findIndex((node) => node.id === tip.id) < path.findIndex((node) => node.id === learnerNode.id)) {
    return Object.freeze({ kind: "refused", reason: "before_completion_boundary", detail: "the consequence tip precedes the learner move" });
  }
  if (ABSORBING.has(tip.objectiveState)) {
    return Object.freeze({
      kind: "witnessed",
      verdict: tip.objectiveState as CampaignNodeVerdict,
      witness: Object.freeze({ learnerMoveEventSeq: event.seq, consequenceTipNodeId: tip.id, completion: "objective_absorbing" as const }),
      tip,
    });
  }
  const horizon = pack.authoredBoundary?.plyHorizon;
  if (horizon !== undefined && tip.ply >= horizon) {
    return Object.freeze({
      kind: "witnessed",
      verdict: "open",
      witness: Object.freeze({ learnerMoveEventSeq: event.seq, consequenceTipNodeId: tip.id, completion: "authored_boundary" as const }),
      tip,
    });
  }
  return Object.freeze({
    kind: "refused",
    reason: "before_completion_boundary",
    detail: horizon === undefined
      ? "the objective has not resolved and this pack declares no authored boundary"
      : `the line has not reached the authored boundary (ply ${tip.ply} of ${horizon})`,
  });
}
