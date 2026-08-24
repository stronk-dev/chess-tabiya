import { makeSquare } from "chessops/util";

import { branchPath } from "./branch-path.js";
import { positionFromFen } from "./chess.js";
import { pivotalMarkers, renderPivotalMarker } from "./pivotal.js";
import { observationIdentity, renderStructuralObservationChange, structuralReading, type StructuralObservation } from "./structure.js";
import { STORY_MATE_CP, STORY_PIVOT_CP } from "./story.js";
import type { BranchComparison, ComparisonEvidenceEntry, ComparisonScore } from "./compare.js";
import type { DrillRun } from "./types.js";
import { assertConsumerEvidenceView, evidenceForConsumer, type ConsumerEvidenceView, type DeclaredEvidence } from "./evidence-contract.js";
import { declareCompareDerivedEvidence, declarePivotalMarkerEvidence, declareRunRecordEvidence } from "./evidence-source-adapters.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { exactLegalMoves, exactMoveIdentity } from "./legal-moves.js";

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
const sentenceEvidence = (kind: "structure_delta" | "eval_delta" | "fork" | "move" | "checkpoint_hit" | "objective_transition" | "consequence", values: Readonly<Record<string, unknown>>): DeclaredEvidence<unknown> => {
  const payload = Object.freeze({ ...values });
  return kind === "structure_delta" || kind === "eval_delta" ? declareCompareDerivedEvidence(kind, payload) : declareRunRecordEvidence(kind, payload);
};
function stripEntry(value: Omit<StripEntry, "evidence">, evidence: DeclaredEvidence<unknown>): StripEntry {
  const row = { ...value } as StripEntry;
  Object.defineProperty(row, "evidence", { value: evidence, enumerable: false });
  return Object.freeze(row);
}

function scoreCp(score: ComparisonScore): number { return score.kind === "cp" ? score.value : score.movesTo < 0 ? -STORY_MATE_CP : STORY_MATE_CP; }

const PIECE_NAMES = Object.freeze({ pawn: "pawn", knight: "knight", bishop: "bishop", rook: "rook", queen: "queen", king: "king" } as const);

function recordedPieceRoutes(path: readonly DrillRun["nodes"][number][]): readonly PieceRoute[] {
  const root = path[0];
  if (root === undefined) return Object.freeze([]);
  const occupants = new Map<string, string>();
  const labels = new Map<string, string>();
  const routes = new Map<string, string[]>();
  for (const [square, piece] of positionFromFen(root.fen).board) {
    const origin = makeSquare(square);
    const identity = `${piece.color}:${piece.role}:${origin}`;
    occupants.set(origin, identity);
    labels.set(identity, `${piece.color === "white" ? "White" : "Black"} ${PIECE_NAMES[piece.role]} from ${origin}`);
  }
  const record = (identity: string, from: string, to: string) => {
    const route = routes.get(identity);
    if (route === undefined) routes.set(identity, [from, to]);
    else route.push(to);
  };
  for (const node of path.slice(1)) {
    if (node.moveUci === null) continue;
    const parent = path.find((candidate) => candidate.id === node.parentId);
    if (parent === undefined) throw new TypeError(`Comparison route node ${node.id} has no parent on its branch path`);
    const identity = exactMoveIdentity(parent.fen, node.moveUci);
    const move = exactLegalMoves(parent.fen).find((candidate) => candidate.uci === identity);
    if (move === undefined) throw new TypeError(`Comparison route move ${identity} is absent from its parent position`);
    const movingPiece = occupants.get(move.from);
    if (movingPiece === undefined) throw new TypeError(`Comparison route has no tracked piece on ${move.from}`);
    const destinationWasOccupied = occupants.has(move.to);
    occupants.delete(move.to);
    if (move.role === "pawn" && move.from[0] !== move.to[0] && !destinationWasOccupied) {
      occupants.delete(`${move.to[0]}${move.from[1]}`);
    }
    occupants.delete(move.from);
    occupants.set(move.to, movingPiece);
    record(movingPiece, move.from, move.to);

    if (move.role === "king" && Math.abs(move.from.charCodeAt(0) - move.to.charCodeAt(0)) === 2) {
      const kingSide = move.to[0] === "g";
      const rookFrom = `${kingSide ? "h" : "a"}${move.from[1]}`;
      const rookTo = `${kingSide ? "f" : "d"}${move.from[1]}`;
      const rook = occupants.get(rookFrom);
      if (rook !== undefined) {
        occupants.delete(rookFrom);
        occupants.set(rookTo, rook);
        record(rook, rookFrom, rookTo);
      }
    }
  }
  return Object.freeze([...routes].map(([identity, squares]) => Object.freeze({
    pieceId: labels.get(identity) ?? identity,
    squares: Object.freeze(squares),
  })));
}

export function consumeComparisonEngineTrajectory(view: ConsumerEvidenceView<ComparisonEvidenceEntry>): readonly ComparisonEvidenceEntry[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "compare.engine_trajectory" || view.consumer.version !== 1) throw new TypeError("Expected compare.engine_trajectory@1 consumer view");
  return Object.freeze(view.items.map((item) => item.payload));
}

export function consumeComparisonStripEvidence(view: ConsumerEvidenceView<unknown>): readonly DeclaredEvidence<unknown>[] {
  assertConsumerEvidenceView(view);
  if (view.consumer.id !== "compare.structure_strip" || view.consumer.version !== 1) throw new TypeError("Expected compare.structure_strip@1 consumer view");
  return view.items;
}

export function comparisonEngineTrajectory(comparison: BranchComparison, branchId: string): readonly ComparisonEvidenceEntry[] {
  const declared = (comparison.evidence[branchId] ?? []).map((entry) => declareCompareDerivedEvidence("engine_trajectory", entry));
  return consumeComparisonEngineTrajectory(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    ref("compare.engine_trajectory"),
    declared,
  ));
}

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
        if (!previous.has(key) && !common?.has(key)) { const sentence = renderStructuralObservationChange(observation); structure.push(stripEntry({ plyOffset: node.ply - fork.ply, nodeId: node.id, sentence, attribution: "Tabiya structural detector", observation }, sentenceEvidence("structure_delta", { observation }))); }
      }
      previous = current;
    }
    const timing: StripEntry[] = [
      ...(comparison.checkpointHits[column.branchId] ?? []).map((entry) => { const sentence = `Checkpoint ${entry.checkpointId} was reached.`; return stripEntry({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, sentence, attribution: "recorded checkpoint event" }, sentenceEvidence("checkpoint_hit", { context: "compare", checkpointId: entry.checkpointId, plyOffset: entry.plyOffset })); }),
      ...(comparison.objectiveTimelines[column.branchId] ?? []).map((entry) => { const sentence = `The recorded objective changed from ${entry.from} to ${entry.to}.`; return stripEntry({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, sentence, attribution: "recorded objective event" }, sentenceEvidence("objective_transition", { context: "compare", from: entry.from, to: entry.to })); }),
      ...pivotalMarkers(run, column.branchId).filter((entry) => path.some((node) => node.id === entry.nodeId)).map((entry) => { const sentence = renderPivotalMarker(entry).join(" "); return stripEntry({ plyOffset: (run.nodes.find((node) => node.id === entry.nodeId)?.ply ?? fork.ply) - fork.ply, nodeId: entry.nodeId, sentence, attribution: "Tabiya product convention" }, declarePivotalMarkerEvidence(entry)); }),
    ].sort((a, b) => a.plyOffset - b.plyOffset || a.nodeId.localeCompare(b.nodeId));
    const recordedRoutes = recordedPieceRoutes(path);
    const routeEvidence = recordedRoutes.map(({ pieceId, squares }) => declareCompareDerivedEvidence("piece_route", Object.freeze({ pieceId, squares })));
    const declared = [...structure.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]), ...timing.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]), ...routeEvidence];
    const admitted = consumeComparisonStripEvidence(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("compare.structure_strip"), declared));
    const admittedSet = new Set(admitted);
    const value: BranchStrips = Object.freeze({
      evalTrail: Object.freeze([...comparisonEngineTrajectory(comparison, column.branchId)].sort((a, b) => a.plyOffset - b.plyOffset).map((entry) => ({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, score: entry.score }))),
      structure: Object.freeze(structure.filter((entry) => entry.evidence !== undefined && admittedSet.has(entry.evidence))),
      timing: Object.freeze(timing.filter((entry) => entry.evidence !== undefined && admittedSet.has(entry.evidence))),
      routes: Object.freeze(admitted.filter((entry) => entry.projection.id === "derived.compare.piece_route").map((entry) => entry.payload as PieceRoute)),
    });
    return [column.branchId, value];
  })));
}

export function comparisonNarrative(run: DrillRun, comparison: BranchComparison, strips = comparisonStrips(run, comparison)): ComparisonNarrative {
  const sharedPly = run.nodes.find((node) => node.id === comparison.forkNodeId)?.ply ?? 0;
  const sharedSentence = `The recorded branches share ${sharedPly} plies through the fork.`;
  const groups: NarrativeGroup[] = [{ sentences: Object.freeze([sharedSentence]), evidence: Object.freeze([sentenceEvidence("fork", { context: "compare", forkNodeId: comparison.forkNodeId, sharedPly })]) }];
  for (const column of comparison.columns) {
    const consequence = comparison.consequences[column.branchId];
    const decision = consequence?.decision;
    const opening = decision === null || decision === undefined ? `Branch at offset ${column.ownForkOffset} has no recorded move past the fork.` : `Branch at offset ${column.ownForkOffset} begins with recorded move ${decision.moveSan}.`;
    const sentences: string[] = [opening];
    const evidence: DeclaredEvidence<unknown>[] = [sentenceEvidence("move", { context: "compare", offset: column.ownForkOffset, moveSan: decision?.moveSan ?? null })];
    sentences.push(...strips[column.branchId]!.timing.map((entry) => `${entry.sentence} Source: ${entry.attribution}.`));
    evidence.push(...strips[column.branchId]!.timing.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]));
    sentences.push(...strips[column.branchId]!.structure.map((entry) => `${entry.sentence} Source: ${entry.attribution}.`));
    evidence.push(...strips[column.branchId]!.structure.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]));
    const trail = strips[column.branchId]!.evalTrail;
    for (let index = 1; index < trail.length; index += 1) { const delta = scoreCp(trail[index]!.score) - scoreCp(trail[index - 1]!.score); if (Math.abs(delta) >= STORY_PIVOT_CP) { const sentence = `Recorded engine evidence changed by ${delta >= 0 ? "+" : ""}${delta} cp at offset ${trail[index]!.plyOffset}.`; sentences.push(sentence); evidence.push(sentenceEvidence("eval_delta", { delta, plyOffset: trail[index]!.plyOffset })); } }
    if (consequence?.terminal) { const sentence = `The recorded branch ends at a board-terminal position with learner result ${consequence.outcome}.`; sentences.push(sentence); evidence.push(sentenceEvidence("consequence", { context: "compare", terminal: true, outcome: consequence.outcome })); }
    else if (consequence !== undefined) { const sentence = `The recorded branch reaches ${consequence.plies} plies with objective state ${consequence.objectiveState}.`; sentences.push(sentence); evidence.push(sentenceEvidence("consequence", { context: "compare", terminal: false, plies: consequence.plies, objectiveState: consequence.objectiveState })); }
    groups.push(Object.freeze({ branchId: column.branchId, sentences: Object.freeze(sentences), evidence: Object.freeze(evidence) }));
  }
  return Object.freeze({ groups: Object.freeze(groups), evidence: Object.freeze(groups.flatMap((group) => group.evidence)) });
}
