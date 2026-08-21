import { branchPath } from "./branch-path.js";
import { pivotalMarkers, renderPivotalMarker } from "./pivotal.js";
import { observationIdentity, structuralReading, type StructuralObservation } from "./structure.js";
import { STORY_MATE_CP, STORY_PIVOT_CP } from "./story.js";
import type { BranchComparison, ComparisonScore } from "./compare.js";
import type { DrillRun } from "./types.js";
import { declareEvidence, type DeclaredEvidence } from "./evidence-contract.js";

export interface StripEntry { readonly plyOffset: number; readonly nodeId: string; readonly sentence: string; readonly attribution: string; readonly observation?: StructuralObservation; readonly evidence?: DeclaredEvidence<unknown> }
export interface PieceRoute { readonly pieceId: string; readonly squares: readonly string[] }
export interface BranchStrips {
  readonly evalTrail: readonly { readonly plyOffset: number; readonly nodeId: string; readonly score: ComparisonScore }[];
  readonly structure: readonly StripEntry[];
  readonly timing: readonly StripEntry[];
  readonly routes: readonly PieceRoute[];
}
export interface NarrativeGroup { readonly branchId?: string; readonly sentences: readonly string[]; readonly evidence: readonly DeclaredEvidence<unknown>[] }
export interface ComparisonNarrative { readonly groups: readonly NarrativeGroup[]; readonly evidence: readonly DeclaredEvidence<unknown>[] }

const ref = (id: string) => ({ id, version: 1 } as const);
const sentenceEvidence = (producer: string, projection: string, sentence: string, values: Readonly<Record<string, unknown>> = {}): DeclaredEvidence<unknown> => declareEvidence(ref(producer), ref(projection), Object.freeze({ ...values, sentence }));
function stripEntry(value: Omit<StripEntry, "evidence">, evidence: DeclaredEvidence<unknown>): StripEntry {
  const row = { ...value } as StripEntry;
  Object.defineProperty(row, "evidence", { value: evidence, enumerable: false });
  return Object.freeze(row);
}

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
        if (!previous.has(key) && !common?.has(key)) { const sentence = `A recorded structural observation changed: ${observation.kind}.`; structure.push(stripEntry({ plyOffset: node.ply - fork.ply, nodeId: node.id, sentence, attribution: "Tabiya structural detector", observation }, sentenceEvidence("derived.compare_narrative", "derived.compare.structure_delta", `${sentence} Source: Tabiya structural detector.`, { observation }))); }
      }
      previous = current;
    }
    const timing: StripEntry[] = [
      ...(comparison.checkpointHits[column.branchId] ?? []).map((entry) => { const sentence = `Checkpoint ${entry.checkpointId} was reached.`; return stripEntry({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, sentence, attribution: "recorded checkpoint event" }, sentenceEvidence("run.record", "run.record.checkpoint_hit", `${sentence} Source: recorded checkpoint event.`, { checkpointId: entry.checkpointId, plyOffset: entry.plyOffset })); }),
      ...(comparison.objectiveTimelines[column.branchId] ?? []).map((entry) => { const sentence = `The recorded objective changed from ${entry.from} to ${entry.to}.`; return stripEntry({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, sentence, attribution: "recorded objective event" }, sentenceEvidence("run.record", "run.record.objective_transition", `${sentence} Source: recorded objective event.`, { from: entry.from, to: entry.to })); }),
      ...pivotalMarkers(run, column.branchId).filter((entry) => path.some((node) => node.id === entry.nodeId)).map((entry) => { const sentence = renderPivotalMarker(entry).join(" "); return stripEntry({ plyOffset: (run.nodes.find((node) => node.id === entry.nodeId)?.ply ?? fork.ply) - fork.ply, nodeId: entry.nodeId, sentence, attribution: "Tabiya product convention" }, declareEvidence(ref("rules.pivotal"), ref("rules.pivotal.marker"), entry)); }),
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
  const sharedPly = run.nodes.find((node) => node.id === comparison.forkNodeId)?.ply ?? 0;
  const sharedSentence = `The recorded branches share ${sharedPly} plies through the fork.`;
  const groups: NarrativeGroup[] = [{ sentences: Object.freeze([sharedSentence]), evidence: Object.freeze([sentenceEvidence("run.record", "run.record.fork", sharedSentence, { forkNodeId: comparison.forkNodeId, sharedPly })]) }];
  for (const column of comparison.columns) {
    const consequence = comparison.consequences[column.branchId];
    const decision = consequence?.decision;
    const opening = decision === null || decision === undefined ? `Branch at offset ${column.ownForkOffset} has no recorded move past the fork.` : `Branch at offset ${column.ownForkOffset} begins with recorded move ${decision.moveSan}.`;
    const sentences: string[] = [opening];
    const evidence: DeclaredEvidence<unknown>[] = [sentenceEvidence("run.record", "run.record.move", opening, { offset: column.ownForkOffset, moveSan: decision?.moveSan ?? null })];
    sentences.push(...strips[column.branchId]!.timing.map((entry) => `${entry.sentence} Source: ${entry.attribution}.`));
    evidence.push(...strips[column.branchId]!.timing.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]));
    sentences.push(...strips[column.branchId]!.structure.map((entry) => `${entry.sentence} Source: ${entry.attribution}.`));
    evidence.push(...strips[column.branchId]!.structure.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]));
    const trail = strips[column.branchId]!.evalTrail;
    for (let index = 1; index < trail.length; index += 1) { const delta = scoreCp(trail[index]!.score) - scoreCp(trail[index - 1]!.score); if (Math.abs(delta) >= STORY_PIVOT_CP) { const sentence = `Recorded engine evidence changed by ${delta >= 0 ? "+" : ""}${delta} cp at offset ${trail[index]!.plyOffset}.`; sentences.push(sentence); evidence.push(sentenceEvidence("derived.compare_narrative", "derived.compare.eval_delta", sentence, { delta, plyOffset: trail[index]!.plyOffset })); } }
    if (consequence?.terminal) { const sentence = `The recorded branch ends at a board-terminal position with learner result ${consequence.outcome}.`; sentences.push(sentence); evidence.push(sentenceEvidence("run.record", "run.record.consequence", sentence, { terminal: true, outcome: consequence.outcome })); }
    else if (consequence !== undefined) { const sentence = `The recorded branch reaches ${consequence.plies} plies with objective state ${consequence.objectiveState}.`; sentences.push(sentence); evidence.push(sentenceEvidence("run.record", "run.record.consequence", sentence, { terminal: false, plies: consequence.plies, objectiveState: consequence.objectiveState })); }
    groups.push(Object.freeze({ branchId: column.branchId, sentences: Object.freeze(sentences), evidence: Object.freeze(evidence) }));
  }
  return Object.freeze({ groups: Object.freeze(groups), evidence: Object.freeze(groups.flatMap((group) => group.evidence)) });
}
