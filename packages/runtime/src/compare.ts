import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";

import { BranchQueryError, branchPath } from "./branch-path.js";
import { lineMembership, type LineMembershipEntry } from "./line.js";
import { resistanceOnPath, type PathResistance } from "./replay.js";
import type {
  Branch,
  DrillRun,
  EvidencePayload,
  Node,
  ObjectiveState,
  RunOutcome,
} from "./types.js";

export const MAX_COMPARISON_BRANCHES = 8;

export interface NodeRef {
  readonly id: string;
  readonly ply: number;
  readonly branchId: string;
  readonly moveUci: string | null;
  readonly moveSan: string | null;
  readonly actor: Node["actor"];
  readonly objectiveState: ObjectiveState;
}

export interface BranchColumn {
  readonly branchId: string;
  readonly label: string;
  readonly origin: Branch["origin"];
  readonly ownForkNodeId: string;
  readonly ownForkOffset: number;
  readonly leafNodeId: string;
}

export interface ComparisonRow {
  readonly plyOffset: number;
  readonly nodes: Readonly<Record<string, NodeRef>>;
  readonly groups: readonly (readonly string[])[];
}

export interface ObjectiveTimelineEntry {
  readonly eventSeq: number;
  readonly nodeId: string;
  readonly plyOffset: number;
  readonly from: ObjectiveState;
  readonly to: ObjectiveState;
  readonly evidenceRefs: readonly string[];
}

export interface CheckpointHit {
  readonly eventSeq: number;
  readonly checkpointId: string;
  readonly nodeId: string;
  readonly plyOffset: number;
}

export type ComparisonScore =
  | { readonly kind: "cp"; readonly value: number }
  | { readonly kind: "mate"; readonly movesTo: number };

export interface ComparisonEvidenceEntry {
  readonly nodeId: string;
  readonly plyOffset: number;
  readonly evidenceRefs: readonly string[];
  readonly kind: "eval";
  readonly source: "engine_validated";
  readonly score: ComparisonScore;
}

export interface ComparisonLineEntry {
  readonly nodeId: string;
  readonly plyOffset: number;
  readonly evidenceRefs: readonly string[];
  readonly kind: "bestline";
  readonly source: "engine_validated";
  readonly payload: EvidencePayload;
}

export interface BranchConsequence {
  readonly branchId: string;
  readonly decision: {
    readonly nodeId: string;
    readonly plyOffset: number;
    readonly moveSan: string;
    readonly moveUci: string;
  } | null;
  readonly plies: number;
  readonly objectiveState: ObjectiveState;
  readonly terminal: boolean;
  readonly outcome: RunOutcome | null;
  readonly resolvedAtCheckpointId: string | null;
  readonly checkpointsReached: readonly string[];
  readonly checkpointsMissed: readonly string[];
  readonly deepestScore: { readonly plyOffset: number; readonly score: ComparisonScore } | null;
  readonly resistance: PathResistance;
  readonly theory: readonly LineMembershipEntry[] | null;
}

export interface BranchComparison {
  readonly machineFeedback: "available" | "withheld";
  readonly forkNodeId: string;
  readonly columns: readonly BranchColumn[];
  readonly rows: readonly ComparisonRow[];
  readonly objectiveTimelines: Readonly<Record<string, readonly ObjectiveTimelineEntry[]>>;
  readonly checkpointHits: Readonly<Record<string, readonly CheckpointHit[]>>;
  readonly evidence: Readonly<Record<string, readonly ComparisonEvidenceEntry[]>>;
  readonly lines: Readonly<Record<string, readonly ComparisonLineEntry[]>>;
  readonly consequences: Readonly<Record<string, BranchConsequence>>;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function nodeRef(node: Node): NodeRef {
  return {
    id: node.id,
    ply: node.ply,
    branchId: node.branchId,
    moveUci: node.moveUci,
    moveSan: node.moveSan,
    actor: node.actor,
    objectiveState: node.objectiveState,
  };
}

function setFork(paths: readonly (readonly Node[])[]): Node {
  let common: Node | undefined;
  const limit = Math.min(...paths.map((path) => path.length));
  for (let index = 0; index < limit; index += 1) {
    const node = paths[0]![index]!;
    if (paths.some((path) => path[index]!.id !== node.id)) break;
    common = node;
  }
  if (!common) throw new BranchQueryError("NO_COMMON_FORK", "Branches do not share a fork node");
  return common;
}

function objectiveTimeline(run: DrillRun, path: readonly Node[], fork: Node): readonly ObjectiveTimelineEntry[] {
  const pathIds = new Set(path.map((node) => node.id));
  const plyById = new Map(path.map((node) => [node.id, node.ply]));
  return run.events.flatMap((event) => {
    if (event.type !== "objective.state_changed" || !pathIds.has(event.data.nodeId)) return [];
    const ply = plyById.get(event.data.nodeId);
    return ply === undefined || ply < fork.ply ? [] : [{
      eventSeq: event.seq,
      nodeId: event.data.nodeId,
      plyOffset: ply - fork.ply,
      from: event.data.from,
      to: event.data.to,
      evidenceRefs: event.data.evidenceRefs,
    }];
  });
}

function checkpointHits(run: DrillRun, path: readonly Node[], fork: Node): readonly CheckpointHit[] {
  const pathIds = new Set(path.map((node) => node.id));
  const plyById = new Map(path.map((node) => [node.id, node.ply]));
  return run.events.flatMap((event) => {
    if (event.type !== "checkpoint.reached" || !pathIds.has(event.data.nodeId)) return [];
    const ply = plyById.get(event.data.nodeId);
    return ply === undefined || ply < fork.ply ? [] : [{
      eventSeq: event.seq,
      checkpointId: event.data.checkpointId,
      nodeId: event.data.nodeId,
      plyOffset: ply - fork.ply,
    }];
  });
}

function comparisonScore(values: Readonly<Record<string, unknown>>): ComparisonScore | undefined {
  if (Number.isSafeInteger(values.centipawns)) return { kind: "cp", value: values.centipawns as number };
  if (Number.isSafeInteger(values.mateIn)) return { kind: "mate", movesTo: values.mateIn as number };
  return undefined;
}

function evidenceOverlay(run: DrillRun, path: readonly Node[], fork: Node): readonly ComparisonEvidenceEntry[] {
  const ids = new Set(path.map((node) => node.id));
  const plyById = new Map(path.map((node) => [node.id, node.ply]));
  return run.events.flatMap((event) => {
    if (event.type !== "evidence.attached" || event.data.payload.kind !== "eval" ||
      event.data.payload.source !== "engine_validated" || !ids.has(event.data.nodeId)) return [];
    const ply = plyById.get(event.data.nodeId);
    const score = comparisonScore(event.data.payload.values);
    return ply === undefined || ply < fork.ply || score === undefined ? [] : [{
      nodeId: event.data.nodeId,
      plyOffset: ply - fork.ply,
      evidenceRefs: event.data.evidenceRefs,
      kind: "eval" as const,
      source: "engine_validated" as const,
      score,
    }];
  });
}

function lineOverlay(run: DrillRun, path: readonly Node[], fork: Node): readonly ComparisonLineEntry[] {
  const ids = new Set(path.map((node) => node.id));
  const plyById = new Map(path.map((node) => [node.id, node.ply]));
  return run.events.flatMap((event) => {
    if (event.type !== "evidence.attached" || event.data.payload.kind !== "bestline" ||
      event.data.payload.source !== "engine_validated" || !ids.has(event.data.nodeId)) return [];
    const ply = plyById.get(event.data.nodeId);
    return ply === undefined || ply < fork.ply ? [] : [{
      nodeId: event.data.nodeId,
      plyOffset: ply - fork.ply,
      evidenceRefs: event.data.evidenceRefs,
      kind: "bestline" as const,
      source: "engine_validated" as const,
      payload: event.data.payload,
    }];
  });
}

export function compareBranches(
  run: DrillRun,
  branchIds: readonly string[],
  options: { readonly pack?: DrillPackDefinition } = {},
): BranchComparison {
  if (branchIds.length < 2) throw new TypeError("At least two branches are required");
  if (new Set(branchIds).size !== branchIds.length) throw new TypeError("Branch ids must be distinct");
  const branches = branchIds.map((id) => {
    const branch = run.branches.find((candidate) => candidate.id === id);
    if (!branch) throw new BranchQueryError("UNKNOWN_BRANCH", `Unknown branch ${id}`);
    return branch;
  });
  const paths = branchIds.map((id) => branchPath(run, id));
  const fork = setFork(paths);
  const maxOffset = Math.max(...paths.map((path) => path.at(-1)!.ply - fork.ply));
  const columns = branches.map((branch, index): BranchColumn => ({
    branchId: branch.id,
    label: branch.label,
    origin: branch.origin,
    ownForkNodeId: branch.forkNodeId,
    ownForkOffset: Math.max(0, run.nodes.find((node) => node.id === branch.forkNodeId)!.ply - fork.ply),
    leafNodeId: paths[index]!.at(-1)!.id,
  }));
  const rows = Array.from({ length: maxOffset }, (_, rowIndex): ComparisonRow => {
    const ply = fork.ply + rowIndex + 1;
    const nodes: Record<string, NodeRef> = {};
    for (const [index, branchId] of branchIds.entries()) {
      const node = paths[index]!.find((candidate) => candidate.ply === ply);
      if (node) nodes[branchId] = nodeRef(node);
    }
    const byNode = new Map<string, string[]>();
    for (const branchId of branchIds) {
      const node = nodes[branchId];
      if (!node) continue;
      const group = byNode.get(node.id) ?? [];
      group.push(branchId);
      byNode.set(node.id, group);
    }
    return { plyOffset: rowIndex + 1, nodes, groups: [...byNode.values()] };
  });
  const objectiveTimelines: Record<string, readonly ObjectiveTimelineEntry[]> = {};
  const checkpointByBranch: Record<string, readonly CheckpointHit[]> = {};
  const evidence: Record<string, readonly ComparisonEvidenceEntry[]> = {};
  const lines: Record<string, readonly ComparisonLineEntry[]> = {};
  for (const [index, branchId] of branchIds.entries()) {
    objectiveTimelines[branchId] = objectiveTimeline(run, paths[index]!, fork);
    checkpointByBranch[branchId] = checkpointHits(run, paths[index]!, fork);
    evidence[branchId] = evidenceOverlay(run, paths[index]!, fork);
    lines[branchId] = lineOverlay(run, paths[index]!, fork);
  }
  const allCheckpoints = new Set(Object.values(checkpointByBranch).flatMap((hits) => hits.map((hit) => hit.checkpointId)));
  const consequences: Record<string, BranchConsequence> = {};
  for (const [index, column] of columns.entries()) {
    const path = paths[index]!;
    const tail = path.filter((node) => node.ply > fork.ply);
    const decision = tail.find((node) => node.ply > fork.ply + column.ownForkOffset);
    const leaf = path.at(-1)!;
    const hits = checkpointByBranch[column.branchId]!;
    const scores = evidence[column.branchId]!;
    const outcome = [...run.events].reverse().find((event) =>
      event.type === "outcome.reached" && path.some((node) => node.id === event.data.nodeId) &&
      run.nodes.find((node) => node.id === event.data.nodeId)!.ply > fork.ply,
    );
    const lastTransition = [...objectiveTimelines[column.branchId]!].reverse()[0];
    const resolved = lastTransition === undefined ? undefined : [...hits].reverse().find((hit) => hit.nodeId === lastTransition.nodeId);
    consequences[column.branchId] = {
      branchId: column.branchId,
      decision: decision?.moveSan && decision.moveUci ? {
        nodeId: decision.id,
        plyOffset: decision.ply - fork.ply,
        moveSan: decision.moveSan,
        moveUci: decision.moveUci,
      } : null,
      plies: tail.length,
      objectiveState: leaf.objectiveState,
      terminal: ["achieved", "failed", "transitioned"].includes(leaf.objectiveState),
      outcome: outcome?.type === "outcome.reached" ? outcome.data.outcome : null,
      resolvedAtCheckpointId: resolved?.checkpointId ?? null,
      checkpointsReached: hits.map((hit) => hit.checkpointId),
      checkpointsMissed: [...allCheckpoints].filter((id) => !hits.some((hit) => hit.checkpointId === id)),
      deepestScore: scores.length === 0 ? null : { plyOffset: scores.at(-1)!.plyOffset, score: scores.at(-1)!.score },
      resistance: resistanceOnPath(run, leaf.id),
      theory: options.pack ? lineMembership(options.pack, run, leaf.id) : null,
    };
  }
  return deepFreeze({
    machineFeedback: "available",
    forkNodeId: fork.id,
    columns,
    rows,
    objectiveTimelines,
    checkpointHits: checkpointByBranch,
    evidence,
    lines,
    consequences,
  });
}
