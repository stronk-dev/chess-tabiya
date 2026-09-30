import { renderPivotalMarker, pivotalMarkerEvidenceItems } from "./pivotal.js";
import { renderStructuralObservationChange, type StructuralObservation } from "./structure.js";
import type { BranchComparison, ComparisonEvidenceEntry, ComparisonScore } from "./compare.js";
import type { DrillRun } from "./types.js";
import { assertConsumerEvidenceView, evidenceForConsumer, type ConsumerEvidenceView, type DeclaredEvidence } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { presentEvidenceItems, presentedItemOwner, type PresentedEvidenceItem } from "./presentation-contract.js";
import type { PieceRoute } from "./compare-strip-values.js";

export type { PieceRoute } from "./compare-strip-values.js";
export interface StripEntry { readonly plyOffset: number; readonly nodeId: string; readonly sentence: string; readonly attribution: string; readonly observation?: StructuralObservation; readonly evidence?: DeclaredEvidence<unknown> }
export interface BranchStrips {
  readonly evalTrail: readonly { readonly plyOffset: number; readonly nodeId: string; readonly score: ComparisonScore }[];
  readonly structure: readonly StripEntry[];
  readonly timing: readonly StripEntry[];
  readonly routes: readonly PieceRoute[];
  /** The same admitted facts, rendered by their registered comparison components. */
  readonly presented: Readonly<{
    structure: readonly PresentedEvidenceItem[];
    timing: readonly PresentedEvidenceItem[];
    routes: readonly PresentedEvidenceItem[];
  }>;
}
export interface PresentedTrajectoryEntry {
  readonly plyOffset: number;
  readonly nodeId: string;
  readonly item: PresentedEvidenceItem;
}
export interface NarrativeGroup { readonly branchId?: string; readonly evidence: readonly DeclaredEvidence<unknown>[] }
export interface ComparisonNarrative { readonly groups: readonly NarrativeGroup[]; readonly evidence: readonly DeclaredEvidence<unknown>[] }

const ref = (id: string) => ({ id, version: 1 } as const);
function stripEntry(value: Omit<StripEntry, "evidence">, evidence: DeclaredEvidence<unknown>): StripEntry {
  const row = { ...value } as StripEntry;
  Object.defineProperty(row, "evidence", { value: evidence, enumerable: false });
  return Object.freeze(row);
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

/** Engine trajectory entries of `comparison`, each verified against the recorded run's events. */
export function comparisonEngineTrajectory(run: DrillRun, comparison: BranchComparison, branchId: string): readonly ComparisonEvidenceEntry[] {
  const declared = invokeEvidenceValueRoute("derived.compare.engine_trajectory@1", { run, comparison, branchId }) as readonly DeclaredEvidence<ComparisonEvidenceEntry>[];
  return consumeComparisonEngineTrajectory(evidenceForConsumer(
    PRIMARY_EVIDENCE_MANIFEST,
    ref("compare.engine_trajectory"),
    declared,
  ));
}

/** One recorded trajectory point and one sealed component from the same admitted evidence item. */
export function comparisonPresentedEngineTrajectory(run: DrillRun, comparison: BranchComparison, branchId: string): readonly PresentedTrajectoryEntry[] {
  const declared = invokeEvidenceValueRoute("derived.compare.engine_trajectory@1", { run, comparison, branchId }) as readonly DeclaredEvidence<ComparisonEvidenceEntry>[];
  const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("compare.engine_trajectory"), declared);
  return Object.freeze(presentEvidenceItems(view).map((item) => {
    const owner = presentedItemOwner(item);
    if (!view.items.includes(owner as DeclaredEvidence<ComparisonEvidenceEntry>)) throw new TypeError("Comparison trajectory component lost its admitted owner");
    const entry = (owner as DeclaredEvidence<ComparisonEvidenceEntry>).payload;
    return Object.freeze({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, item });
  }));
}

export function comparisonStrips(run: DrillRun, comparison: BranchComparison): Readonly<Record<string, BranchStrips>> {
  const fork = run.nodes.find((node) => node.id === comparison.forkNodeId);
  if (fork === undefined) throw new TypeError(`Comparison fork ${comparison.forkNodeId} is missing`);
  const pathNodes = new Map(run.nodes.map((node) => [node.id, node]));
  return Object.freeze(Object.fromEntries(comparison.columns.map((column) => {
    const input = { run, comparison, branchId: column.branchId };
    const structure: StripEntry[] = invokeEvidenceValueRoute("derived.compare.structure_delta@1", input).map((item) => {
      const observation = (item.evidence.payload as { readonly observation: StructuralObservation }).observation;
      return stripEntry({ plyOffset: item.plyOffset, nodeId: item.nodeId, sentence: renderStructuralObservationChange(observation), attribution: "Tabiya structural detector", observation }, item.evidence);
    });
    const timing: StripEntry[] = [
      ...invokeEvidenceValueRoute("run.record.checkpoint_hit@1", input).map((item) => stripEntry({ plyOffset: item.plyOffset, nodeId: item.nodeId, sentence: `Checkpoint ${(item.evidence.payload as { readonly checkpointId: string }).checkpointId} was reached.`, attribution: "recorded checkpoint event" }, item.evidence)),
      ...invokeEvidenceValueRoute("run.record.objective_transition@1", input).map((item) => { const payload = item.evidence.payload as { readonly from: string; readonly to: string }; return stripEntry({ plyOffset: item.plyOffset, nodeId: item.nodeId, sentence: `The recorded objective changed from ${payload.from} to ${payload.to}.`, attribution: "recorded objective event" }, item.evidence); }),
      ...pivotalMarkerEvidenceItems(run, column.branchId)
        .filter((item) => { const node = pathNodes.get(item.payload.nodeId); return node !== undefined && node.ply >= fork.ply; })
        .map((item) => stripEntry({ plyOffset: pathNodes.get(item.payload.nodeId)!.ply - fork.ply, nodeId: item.payload.nodeId, sentence: renderPivotalMarker(item.payload).join(" "), attribution: "Tabiya product convention" }, item)),
    ].sort((a, b) => a.plyOffset - b.plyOffset || a.nodeId.localeCompare(b.nodeId));
    const routeEvidence = invokeEvidenceValueRoute("derived.compare.piece_route@1", input);
    const declared = [...structure.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]), ...timing.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]), ...routeEvidence];
    const view = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, ref("compare.structure_strip"), declared);
    const admitted = consumeComparisonStripEvidence(view);
    const admittedSet = new Set(admitted);
    const structureOwners = new Set(structure.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]));
    const timingOwners = new Set(timing.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]));
    const routeOwners = new Set<DeclaredEvidence<unknown>>(routeEvidence);
    const items = presentEvidenceItems(view);
    const presented = Object.freeze({
      structure: Object.freeze(items.filter((item) => structureOwners.has(presentedItemOwner(item) as DeclaredEvidence<unknown>))),
      timing: Object.freeze(items.filter((item) => timingOwners.has(presentedItemOwner(item) as DeclaredEvidence<unknown>))),
      routes: Object.freeze(items.filter((item) => routeOwners.has(presentedItemOwner(item) as DeclaredEvidence<unknown>))),
    });
    const value: BranchStrips = Object.freeze({
      evalTrail: Object.freeze([...comparisonEngineTrajectory(run, comparison, column.branchId)].sort((a, b) => a.plyOffset - b.plyOffset).map((entry) => ({ plyOffset: entry.plyOffset, nodeId: entry.nodeId, score: entry.score }))),
      structure: Object.freeze(structure.filter((entry) => entry.evidence !== undefined && admittedSet.has(entry.evidence))),
      timing: Object.freeze(timing.filter((entry) => entry.evidence !== undefined && admittedSet.has(entry.evidence))),
      routes: Object.freeze(admitted.filter((entry) => entry.projection.id === "derived.compare.piece_route").map((entry) => entry.payload as PieceRoute)),
      presented,
    });
    return [column.branchId, value];
  })));
}

export function comparisonNarrative(run: DrillRun, comparison: BranchComparison, strips = comparisonStrips(run, comparison)): ComparisonNarrative {
  const fork = invokeEvidenceValueRoute("run.record.fork@1", { run, comparison });
  const groups: NarrativeGroup[] = [{ evidence: Object.freeze([fork]) }];
  for (const column of comparison.columns) {
    const input = { run, comparison, branchId: column.branchId };
    const move = invokeEvidenceValueRoute("run.record.move@1", input);
    const evidence: DeclaredEvidence<unknown>[] = [move];
    evidence.push(...strips[column.branchId]!.timing.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]));
    evidence.push(...strips[column.branchId]!.structure.flatMap((entry) => entry.evidence === undefined ? [] : [entry.evidence]));
    evidence.push(...invokeEvidenceValueRoute("derived.compare.eval_delta@1", input));
    evidence.push(...invokeEvidenceValueRoute("run.record.consequence@1", input).map((item) => item.evidence));
    groups.push(Object.freeze({ branchId: column.branchId, evidence: Object.freeze(evidence) }));
  }
  return Object.freeze({ groups: Object.freeze(groups), evidence: Object.freeze(groups.flatMap((group) => group.evidence)) });
}
