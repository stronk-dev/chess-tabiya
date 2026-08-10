import { BranchQueryError, branchPath } from "./branch-path.js";
import type { DrillRun, Node, ObjectiveState } from "./types.js";

export interface NodeRef {
  readonly id: string;
  readonly ply: number;
  readonly branchId: string;
  readonly moveUci: string | null;
  readonly moveSan: string | null;
  readonly actor: Node["actor"];
  readonly objectiveState: ObjectiveState;
}

export interface ComparisonPair {
  readonly plyOffset: number;
  readonly a?: NodeRef;
  readonly b?: NodeRef;
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

export interface BranchComparison {
  readonly forkNodeId: string;
  readonly pairs: readonly ComparisonPair[];
  readonly objectiveTimelines: {
    readonly a: readonly ObjectiveTimelineEntry[];
    readonly b: readonly ObjectiveTimelineEntry[];
  };
  readonly checkpointHits: {
    readonly a: readonly CheckpointHit[];
    readonly b: readonly CheckpointHit[];
  };
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

function commonFork(pathA: readonly Node[], pathB: readonly Node[]): Node {
  let common: Node | undefined;
  const limit = Math.min(pathA.length, pathB.length);
  for (let index = 0; index < limit; index += 1) {
    if (pathA[index]!.id !== pathB[index]!.id) break;
    common = pathA[index];
  }
  if (!common) {
    throw new BranchQueryError("NO_COMMON_FORK", "Branches do not share a fork node");
  }
  return common;
}

function objectiveTimeline(
  run: DrillRun,
  path: readonly Node[],
  fork: Node,
): readonly ObjectiveTimelineEntry[] {
  const pathIds = new Set(path.map((node) => node.id));
  const plyById = new Map(path.map((node) => [node.id, node.ply]));
  return run.events.flatMap((event) => {
    if (event.type !== "objective.state_changed" || !pathIds.has(event.data.nodeId)) {
      return [];
    }
    const ply = plyById.get(event.data.nodeId);
    if (ply === undefined || ply < fork.ply) return [];
    return [
      {
        eventSeq: event.seq,
        nodeId: event.data.nodeId,
        plyOffset: ply - fork.ply,
        from: event.data.from,
        to: event.data.to,
        evidenceRefs: event.data.evidenceRefs,
      },
    ];
  });
}

function checkpointHits(
  run: DrillRun,
  path: readonly Node[],
  fork: Node,
): readonly CheckpointHit[] {
  const pathIds = new Set(path.map((node) => node.id));
  const plyById = new Map(path.map((node) => [node.id, node.ply]));
  return run.events.flatMap((event) => {
    if (event.type !== "checkpoint.reached" || !pathIds.has(event.data.nodeId)) return [];
    const ply = plyById.get(event.data.nodeId);
    if (ply === undefined || ply < fork.ply) return [];
    return [
      {
        eventSeq: event.seq,
        checkpointId: event.data.checkpointId,
        nodeId: event.data.nodeId,
        plyOffset: ply - fork.ply,
      },
    ];
  });
}

export function compare(
  run: DrillRun,
  branchAId: string,
  branchBId: string,
): BranchComparison {
  const pathA = branchPath(run, branchAId);
  const pathB = branchPath(run, branchBId);
  const fork = commonFork(pathA, pathB);
  const tailA = pathA.filter((node) => node.ply > fork.ply);
  const tailB = pathB.filter((node) => node.ply > fork.ply);
  const pairs: ComparisonPair[] = [];
  const length = Math.max(tailA.length, tailB.length);
  for (let index = 0; index < length; index += 1) {
    const a = tailA[index];
    const b = tailB[index];
    pairs.push({
      plyOffset: index + 1,
      ...(a === undefined ? {} : { a: nodeRef(a) }),
      ...(b === undefined ? {} : { b: nodeRef(b) }),
    });
  }

  return deepFreeze({
    forkNodeId: fork.id,
    pairs,
    objectiveTimelines: {
      a: objectiveTimeline(run, pathA, fork),
      b: objectiveTimeline(run, pathB, fork),
    },
    checkpointHits: {
      a: checkpointHits(run, pathA, fork),
      b: checkpointHits(run, pathB, fork),
    },
  });
}
