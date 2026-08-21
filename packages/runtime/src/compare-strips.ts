import { branchPath } from "./branch-path.js";
import { pivotalMarkers, renderPivotalMarker } from "./pivotal.js";
import { observationIdentity, structuralReading, type StructuralObservation } from "./structure.js";
import { STORY_MATE_CP, STORY_PIVOT_CP } from "./story.js";
import type { BranchComparison, ComparisonScore } from "./compare.js";
import type { DrillRun } from "./types.js";

export interface StripEntry { readonly plyOffset: number; readonly nodeId: string; readonly sentence: string; readonly attribution: string; readonly observation?: StructuralObservation }
export interface PieceRoute { readonly pieceId: string; readonly squares: readonly string[] }
export interface BranchStrips {
  readonly evalTrail: readonly { readonly plyOffset: number; readonly nodeId: string; readonly score: ComparisonScore }[];
  readonly structure: readonly StripEntry[];
  readonly timing: readonly StripEntry[];
  readonly routes: readonly PieceRoute[];
}
export interface NarrativeGroup { readonly branchId?: string; readonly sentences: readonly string[] }
export interface ComparisonNarrative { readonly groups: readonly NarrativeGroup[] }

function scoreCp(score: ComparisonScore): number { return score.kind === "cp" ? score.value : score.movesTo < 0 ? -STORY_MATE_CP : STORY_MATE_CP; }

export function comparisonStrips(run: DrillRun, comparison: BranchComparison): Readonly<Record<string, BranchStrips>> {
  const fork = run.nodes.find((node) => node.id === comparison.forkNodeId);
  if (fork === undefined) throw new TypeError(`Comparison fork ${comparison.forkNodeId} is missing`);
  const pathObservationSets = comparison.columns.map((column) => new Set(
    branchPath(run, column.branchId)
      .filter((node) => node.ply > fork.ply)
      .flatMap((node) => structuralReading(node.fen).features.map(observationIdentity)),
  ));
  const common = comparison.columns.length < 2
    ? undefined
    : new Set([...pathObservationSets[0]!].filter((key) => pathObservationSets.slice(1).every((set) => set.has(key))));
  return Object.freeze(Object.fromEntries(comparison.columns.map((column) => {
    const path = branchPath(run, column.branchId).filter((node) => node.ply >= fork.ply);
    const structure: StripEntry[] = [];
    let previous = new Set<string>();
    for (const node of path) {
      const observations = structuralReading(node.fen).features;
      const current = new Set(observations.map(observationIdentity));
      if (node.id !== fork.id) for (const observation of observations) {
        const key = observationIdentity(observation);
        if (!previous.has(key) && !common?.has(key)) structure.push(Object.freeze({ plyOffset: node.ply - fork.ply, nodeId: node.id, sentence: `A recorded structural observation changed: ${observation.kind}.`, attribution: "Tabiya structural detector", observation }));
      }
      previous = current;
    }
    const timing: StripEntry[] = [
      ...(comparison.checkpointHits[column.branchId] ?? []).map((entry) => ({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, sentence: `Checkpoint ${entry.checkpointId} was reached.`, attribution: "recorded checkpoint event" })),
      ...(comparison.objectiveTimelines[column.branchId] ?? []).map((entry) => ({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, sentence: `The recorded objective changed from ${entry.from} to ${entry.to}.`, attribution: "recorded objective event" })),
      ...pivotalMarkers(run, column.branchId).filter((entry) => path.some((node) => node.id === entry.nodeId)).map((entry) => ({ plyOffset: (run.nodes.find((node) => node.id === entry.nodeId)?.ply ?? fork.ply) - fork.ply, nodeId: entry.nodeId, sentence: renderPivotalMarker(entry).join(" "), attribution: "Tabiya product convention" })),
    ].sort((a, b) => a.plyOffset - b.plyOffset || a.nodeId.localeCompare(b.nodeId));
    const routeMap = new Map<string, string[]>();
    for (const node of path.slice(1)) {
      const move = node.moveUci?.slice(0, 4); if (move === undefined) continue;
      const from = move.slice(0, 2), to = move.slice(2, 4);
      const existing = [...routeMap].find(([, squares]) => squares.at(-1) === from);
      if (existing === undefined) routeMap.set(from, [from, to]); else existing[1].push(to);
    }
    const value: BranchStrips = Object.freeze({
      evalTrail: Object.freeze([...(comparison.evidence[column.branchId] ?? [])].sort((a, b) => a.plyOffset - b.plyOffset).map((entry) => ({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, score: entry.score }))),
      structure: Object.freeze(structure), timing: Object.freeze(timing),
      routes: Object.freeze([...routeMap].map(([pieceId, squares]) => Object.freeze({ pieceId, squares: Object.freeze(squares) }))),
    });
    return [column.branchId, value];
  })));
}

export function comparisonNarrative(run: DrillRun, comparison: BranchComparison, strips = comparisonStrips(run, comparison)): ComparisonNarrative {
  const groups: NarrativeGroup[] = [{ sentences: Object.freeze([`The recorded branches share ${run.nodes.find((node) => node.id === comparison.forkNodeId)?.ply ?? 0} plies through the fork.`]) }];
  for (const column of comparison.columns) {
    const consequence = comparison.consequences[column.branchId];
    const decision = consequence?.decision;
    const sentences: string[] = [decision === null || decision === undefined ? `Branch at offset ${column.ownForkOffset} has no recorded move past the fork.` : `Branch at offset ${column.ownForkOffset} begins with recorded move ${decision.moveSan}.`];
    sentences.push(...strips[column.branchId]!.timing.map((entry) => `${entry.sentence} Source: ${entry.attribution}.`));
    sentences.push(...strips[column.branchId]!.structure.map((entry) => `${entry.sentence} Source: ${entry.attribution}.`));
    const trail = strips[column.branchId]!.evalTrail;
    for (let index = 1; index < trail.length; index += 1) { const delta = scoreCp(trail[index]!.score) - scoreCp(trail[index - 1]!.score); if (Math.abs(delta) >= STORY_PIVOT_CP) sentences.push(`Recorded engine evidence changed by ${delta >= 0 ? "+" : ""}${delta} cp at offset ${trail[index]!.plyOffset}.`); }
    if (consequence?.terminal) sentences.push(`The recorded branch ends at a board-terminal position with learner result ${consequence.outcome}.`);
    else if (consequence !== undefined) sentences.push(`The recorded branch reaches ${consequence.plies} plies with objective state ${consequence.objectiveState}.`);
    groups.push(Object.freeze({ branchId: column.branchId, sentences: Object.freeze(sentences) }));
  }
  return Object.freeze({ groups: Object.freeze(groups) });
}
