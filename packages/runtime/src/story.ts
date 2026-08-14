import { branchPath } from "./branch-path.js";
import { endgameReading, renderEndgameReading, type EndgameReading } from "./endgame.js";
import { classifyPhase, type DetectedPhase } from "./phase.js";
import { pivotalMarkers, renderPivotalMarker, type PivotalKind } from "./pivotal.js";
import { shapeFirings, type ShapeTriggerSource } from "./shape-firing.js";
import type { DrillRun, Node, RunOutcome } from "./types.js";

export type StoryMomentKind = PivotalKind | "eval_pivot" | "last_level" | "endgame_entry" | "shape_span" | "outcome";
export interface StoryEvaluation {
  readonly centipawns: number;
  readonly engineId: string;
  readonly requestedMovetimeMs?: number;
}
export interface StoryMoment {
  readonly nodeId: string;
  readonly entryNodeId: string;
  readonly ply: number;
  readonly san: string | null;
  readonly fen: string;
  readonly kinds: readonly StoryMomentKind[];
  readonly sentences: readonly string[];
  readonly evalBefore?: StoryEvaluation;
  readonly evalAfter?: StoryEvaluation;
  readonly phase: DetectedPhase;
  readonly endgame?: EndgameReading;
}
export interface StoryProjection { readonly moments: readonly StoryMoment[]; readonly rank: readonly string[]; }

function evaluation(run: DrillRun, node: Node): StoryEvaluation | undefined {
  const event = [...run.events].reverse().find((candidate) =>
    candidate.type === "evidence.attached" && candidate.data.nodeId === node.id &&
    candidate.data.payload.kind === "eval" && candidate.data.payload.source === "engine_validated",
  );
  if (event?.type !== "evidence.attached") return undefined;
  const values = event.data.payload.values;
  let cp: number | undefined;
  if (Number.isSafeInteger(values.centipawns)) cp = values.centipawns as number;
  else if (Number.isSafeInteger(values.mateIn)) cp = (values.mateIn as number) < 0 ? -1000 : 1000;
  if (cp === undefined) return undefined;
  const sideToMove = node.fen.split(" ")[1] === "w" ? "white" : "black";
  const learnerCp = Math.max(-1000, Math.min(1000, sideToMove === run.start.side ? cp : -cp));
  return Object.freeze({
    centipawns: learnerCp,
    engineId: typeof values.engineId === "string" ? values.engineId : "recorded engine",
    ...(Number.isSafeInteger(values.requestedMovetimeMs) ? { requestedMovetimeMs: values.requestedMovetimeMs as number } : {}),
  });
}

function learnerLost(result: "1-0" | "0-1" | "1/2-1/2" | "*" | undefined, side: "white" | "black"): boolean {
  return (side === "white" && result === "0-1") || (side === "black" && result === "1-0");
}

export function storyMoments(
  run: DrillRun,
  branchId: string,
  options: { readonly shapes?: readonly ShapeTriggerSource[]; readonly recordedResult?: "1-0" | "0-1" | "1/2-1/2" | "*" } = {},
): StoryProjection {
  const path = branchPath(run, branchId);
  const byId = new Map(path.map((node) => [node.id, node]));
  const accum = new Map<string, { kinds: Set<StoryMomentKind>; sentences: string[]; before?: StoryEvaluation; after?: StoryEvaluation; endgame?: EndgameReading }>();
  const item = (nodeId: string) => {
    let value = accum.get(nodeId);
    if (value === undefined) { value = { kinds: new Set(), sentences: [] }; accum.set(nodeId, value); }
    return value;
  };
  for (const marker of pivotalMarkers(run, branchId)) {
    const value = item(marker.nodeId); value.kinds.add(marker.kind); value.sentences.push(...renderPivotalMarker(marker));
  }
  const evaluations = path.map((node) => evaluation(run, node));
  for (let index = 1; index < path.length; index += 1) {
    const before = evaluations[index - 1], after = evaluations[index];
    if (before === undefined || after === undefined) continue;
    const delta = after.centipawns - before.centipawns;
    if (Math.abs(delta) < 150) continue;
    const value = item(path[index]!.id); value.kinds.add("eval_pivot"); value.before = before; value.after = after;
    value.sentences.push(`The recorded evaluation moved ${delta >= 0 ? "+" : ""}${delta} cp across this move (${after.engineId}${after.requestedMovetimeMs === undefined ? "" : `, ${after.requestedMovetimeMs} ms`}).`);
  }
  if (learnerLost(options.recordedResult, run.start.side)) {
    let last = -1;
    for (let index = 0; index < evaluations.length; index += 1) if ((evaluations[index]?.centipawns ?? -101) >= -100) last = index;
    if (last >= 0) { const value = item(path[last]!.id); value.kinds.add("last_level"); value.sentences.push("The last recorded moment within a pawn of level — Tabiya's recorded-evaluation convention."); }
  }
  let endgameSeen = false;
  for (const node of path) {
    const reading = endgameReading(node.fen);
    if (!endgameSeen && reading !== null) { endgameSeen = true; const value = item(node.id); value.kinds.add("endgame_entry"); value.endgame = reading; value.sentences.push(...renderEndgameReading(reading)); }
  }
  for (const firing of shapeFirings(options.shapes ?? [], path)) {
    const value = item(firing.firstNodeId); value.kinds.add("shape_span"); value.sentences.push(`Shape ${firing.entryId} begins here under its recorded catalogue trigger.`);
  }
  const outcome = [...run.events].reverse().find((event) => event.type === "outcome.reached" && byId.has(event.data.nodeId));
  if (outcome?.type === "outcome.reached") {
    const value = item(outcome.data.nodeId); value.kinds.add("outcome"); value.sentences.push(`Board-terminal result for the learner: ${outcome.data.outcome}.`);
  } else if (options.recordedResult !== undefined && options.recordedResult !== "*") {
    const leaf = path.at(-1)!; const value = item(leaf.id); value.kinds.add("outcome"); value.sentences.push(`The PGN records the game result as ${options.recordedResult}; the board is not terminal here.`);
  }
  const moments = [...accum.entries()].flatMap(([nodeId, value]) => {
    const node = byId.get(nodeId); if (node === undefined) return [];
    const terminal = value.kinds.has("outcome") && outcome?.type === "outcome.reached" && outcome.data.nodeId === nodeId;
    return [Object.freeze({
      nodeId,
      entryNodeId: terminal ? (node.parentId ?? node.id) : node.id,
      ply: node.ply,
      san: node.moveSan,
      fen: node.fen,
      kinds: Object.freeze([...value.kinds].sort()),
      sentences: Object.freeze([...new Set(value.sentences)]),
      ...(value.before === undefined ? {} : { evalBefore: value.before }),
      ...(value.after === undefined ? {} : { evalAfter: value.after }),
      phase: classifyPhase(node.fen).phase,
      ...(value.endgame === undefined ? {} : { endgame: value.endgame }),
    })];
  }).sort((left, right) => left.ply - right.ply || left.nodeId.localeCompare(right.nodeId));
  const priority = (moment: StoryMoment): number => moment.kinds.includes("outcome") ? 0 : moment.kinds.includes("eval_pivot") ? 1 : moment.kinds.includes("last_level") ? 2 : moment.kinds.includes("phase_change") ? 3 : moment.kinds.includes("endgame_entry") ? 4 : moment.kinds.includes("irreversibility") ? 5 : moment.kinds.includes("shape_span") ? 6 : 7;
  const rank = [...moments].sort((left, right) => priority(left) - priority(right) || Math.abs((right.evalAfter?.centipawns ?? 0) - (right.evalBefore?.centipawns ?? 0)) - Math.abs((left.evalAfter?.centipawns ?? 0) - (left.evalBefore?.centipawns ?? 0)) || left.ply - right.ply).map((moment) => moment.nodeId);
  return Object.freeze({ moments: Object.freeze(moments), rank: Object.freeze(rank) });
}
