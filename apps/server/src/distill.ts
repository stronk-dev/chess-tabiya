import { branchPath, type DrillRun } from "@chess-tabiya/runtime";
import type { PackRecord } from "./pack-registry.js";
import { ServerError } from "./errors.js";

export interface DistillProposal {
  readonly kind: "deviation";
  readonly atSpineNodeId: string;
  readonly moveUci: string;
  readonly moveSan: string;
  readonly branchLabel: string;
  readonly branchIntent?: string;
  readonly objectiveStateBefore: string;
  readonly objectiveStateAfter: string;
}

export interface Distillation {
  readonly document: Readonly<Record<string, unknown>>;
  readonly proposals: readonly DistillProposal[];
  readonly dropped: readonly string[];
}

const distilledId = (nodeId: string) => `distilled-${nodeId.toLowerCase().replace(/[^a-z0-9-]+/g,"-").replace(/-+/g,"-").replace(/-$/g,"")}`;

export function distillRun(run: DrillRun, source: PackRecord | undefined, input: { readonly packId: string; readonly title: string; readonly branchId?: string }): Distillation {
  const allowed = run.branches.filter((branch) => branch.origin !== "simulated");
  const selected = input.branchId === undefined
    ? [...allowed].sort((left, right) => (branchPath(run, right.id).at(-1)?.ply ?? 0) - (branchPath(run, left.id).at(-1)?.ply ?? 0))[0]
    : allowed.find((branch) => branch.id === input.branchId);
  if (selected === undefined) throw new ServerError("INVALID_REQUEST", "The selected played branch does not exist");
  const selectedPath = branchPath(run, selected.id);
  const learnerNodes = selectedPath.filter((node) => node.actor === "user");
  if (learnerNodes.length === 0) throw new ServerError("IMPORT_INVALID", "A distilled branch must contain at least one learner ply");

  const allowedIds = new Set(allowed.flatMap((branch) => branchPath(run, branch.id).map((node) => node.id)));
  const selectedIds = new Set(selectedPath.map((node) => node.id));
  const root = run.nodes[0]!;
  const build = (parentId: string): readonly Record<string, unknown>[] => run.nodes
    .filter((node) => node.parentId === parentId && allowedIds.has(node.id) && node.moveUci !== null && node.moveSan !== null)
    .sort((left, right) => Number(selectedIds.has(right.id)) - Number(selectedIds.has(left.id)) || left.id.localeCompare(right.id))
    .map((node) => Object.freeze({ id: distilledId(node.id), moveUci: node.moveUci!, moveSan: node.moveSan!, children: build(node.id) }));

  const blockers: string[] = [
    "Session-distilled moves are recorded play, not reviewed theory; a human author must judge every line before publication.",
    "The mechanical objective and checkpoint are navigation facts, not a chess assessment; replace or ground them before publication.",
  ];
  const dropped: string[] = [];
  const fired = run.events.filter((event): event is Extract<DrillRun["events"][number], { type: "checkpoint.reached" }> => event.type === "checkpoint.reached");
  const sourceCheckpoints = source?.document.checkpoints ?? [];
  const checkpoints: Record<string, unknown>[] = [];
  for (const event of fired) {
    const checkpoint = sourceCheckpoints.find((candidate) => candidate.id === event.data.checkpointId);
    if (checkpoint === undefined) continue;
    const trigger = checkpoint.trigger as unknown as Record<string, unknown>;
    if ("atAuthoredBoundary" in trigger || "atWindow" in trigger) {
      dropped.push(`${checkpoint.id}: authored-boundary timing cannot be remapped`);
      continue;
    }
    const nextTrigger = "atSpineNode" in trigger ? { atSpineNode: distilledId(event.data.nodeId) } : structuredClone(trigger);
    checkpoints.push({ id: checkpoint.id, label: checkpoint.label, trigger: nextTrigger, actions: checkpoint.actions });
  }
  if (checkpoints.length === 0) {
    const deepestLearnerPly = Math.max(...learnerNodes.map((node) => node.ply));
    checkpoints.push({ id: "distilled-end", label: "Recorded consequence reached", trigger: { atPly: deepestLearnerPly }, actions: [] });
    blockers.push("No portable fired checkpoint survived; a mechanical atPly checkpoint was substituted.");
  }
  if (source?.document.mode === "line" || source?.document.mode === "trajectory") blockers.push(`Source mode ${source.document.mode} was reduced to an outcome seed because its authored grading structure is not carried by a run.`);
  if (run.feedbackPolicy === "attempt_end") blockers.push("Run-only attempt_end feedback was substituted with delayed_checkpoint for the pack draft.");
  for (const branch of run.branches.filter((candidate) => candidate.origin === "simulated")) dropped.push(`${branch.id}: simulated branch`);

  const proposals: DistillProposal[] = [];
  for (const branch of allowed.filter((candidate) => candidate.id !== selected.id)) {
    const path = branchPath(run, branch.id), forkIndex = path.findIndex((node) => node.id === branch.forkNodeId), move = path[forkIndex + 1], before = path[forkIndex];
    if (move?.moveUci === null || move?.moveUci === undefined || move.moveSan === null || before === undefined) continue;
    proposals.push(Object.freeze({ kind: "deviation", atSpineNodeId: distilledId(branch.forkNodeId), moveUci: move.moveUci, moveSan: move.moveSan, branchLabel: branch.label, ...(branch.intent === undefined ? {} : { branchIntent: branch.intent }), objectiveStateBefore: before.objectiveState, objectiveStateAfter: move.objectiveState }));
  }

  const length = (selectedPath.at(-1)?.ply ?? root.ply) - root.ply;
  const document = Object.freeze({
    id: input.packId, version: "0.1.0", title: input.title, mode: "outcome",
    phase: source?.document.phase ?? "middlegame",
    difficulty: { minOnlineRapid: 1000, maxOnlineRapid: 2000, label: "Session-distilled draft", ...(length >= 2 && length <= 40 ? { branchLengthTarget: length } : {}) },
    provenance: { reviewStatus: "draft", sources: ["session_distilled", `run ${run.id}; session identity ${run.sessionDigest}${run.packId === null ? "" : `; source ${run.packId}@${run.packDigest}`}`], graduationBlockers: blockers },
    start: run.start,
    objective: { type: "play_until_checkpoint", summary: "Play the recorded consequence to the mechanical checkpoint." },
    feedbackPolicy: run.feedbackPolicy === "attempt_end" ? "delayed_checkpoint" : run.feedbackPolicy,
    opponentPolicy: run.opponentPolicy,
    spine: build(root.id), checkpoints,
  });
  return Object.freeze({ document, proposals: Object.freeze(proposals), dropped: Object.freeze(dropped) });
}
