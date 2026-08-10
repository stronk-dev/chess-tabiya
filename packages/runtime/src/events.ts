import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";

import { unknownNode } from "./errors.js";
import type {
  Branch,
  CheckpointReachedEvent,
  DrillRun,
  DrillRunEvent,
  EventDraft,
  Node,
  Segment,
} from "./types.js";

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function cloneAndFreeze<T>(value: T): T {
  return deepFreeze(structuredClone(value));
}

function replaceNode(nodes: readonly Node[], replacement: Node): readonly Node[] {
  const index = nodes.findIndex((node) => node.id === replacement.id);
  if (index === -1) throw unknownNode(replacement.id);
  return nodes.map((node, nodeIndex) => (nodeIndex === index ? replacement : node));
}

export function projectRun(events: readonly DrillRunEvent[]): DrillRun {
  const started = events[0];
  if (started?.type !== "run.started") {
    throw new TypeError("A run event stream must begin with run.started");
  }

  let nodes: readonly Node[] = [started.data.rootNode];
  let branches: readonly Branch[] = [started.data.branch];
  let activeCursor = started.data.activeCursor;

  for (const [index, event] of events.entries()) {
    if (event.seq !== index + 1) {
      throw new TypeError(`Event sequence must be contiguous at index ${index}`);
    }
    if (index === 0) continue;

    switch (event.type) {
      case "run.started":
        throw new TypeError("run.started may only occur once");
      case "move.committed":
        if (nodes.some((node) => node.id === event.data.node.id)) {
          throw new TypeError(`Duplicate node id: ${event.data.node.id}`);
        }
        nodes = [...nodes, event.data.node];
        activeCursor = {
          nodeId: event.data.node.id,
          branchId: event.data.node.branchId,
        };
        break;
      case "branch.forked":
        if (branches.some((branch) => branch.id === event.data.branch.id)) {
          throw new TypeError(`Duplicate branch id: ${event.data.branch.id}`);
        }
        if (!nodes.some((node) => node.id === event.data.branch.forkNodeId)) {
          throw unknownNode(event.data.branch.forkNodeId);
        }
        branches = [...branches, event.data.branch];
        activeCursor = {
          nodeId: event.data.branch.forkNodeId,
          branchId: event.data.branch.id,
        };
        break;
      case "run.rewound":
        if (!nodes.some((node) => node.id === event.data.toNodeId)) {
          throw unknownNode(event.data.toNodeId);
        }
        activeCursor = {
          nodeId: event.data.toNodeId,
          branchId: event.data.branchId,
        };
        break;
      case "checkpoint.reached": {
        const node = nodes.find((candidate) => candidate.id === event.data.nodeId);
        if (!node) throw unknownNode(event.data.nodeId);
        nodes = replaceNode(
          nodes,
          deepFreeze({
            ...node,
            checkpointRefs: [...new Set([...node.checkpointRefs, event.data.checkpointId])],
          }),
        );
        break;
      }
      case "objective.state_changed": {
        const node = nodes.find((candidate) => candidate.id === event.data.nodeId);
        if (!node) throw unknownNode(event.data.nodeId);
        nodes = replaceNode(
          nodes,
          deepFreeze({
            ...node,
            objectiveState: event.data.to,
            evidenceRefs: [...new Set([...node.evidenceRefs, ...event.data.evidenceRefs])],
          }),
        );
        break;
      }
      case "opponent.move_selected":
      case "segment.completed":
      case "feedback.generated":
      case "outcome.reached":
      case "transfer.scheduled":
        break;
    }
  }

  return deepFreeze({
    schemaVersion: DRILL_RUN_SCHEMA_VERSION,
    id: started.data.id,
    packId: started.data.packId,
    packDigest: started.data.packDigest,
    policyConfig: started.data.policyConfig,
    nodes,
    branches,
    events,
    activeCursor,
  });
}

export function appendEvents(
  run: DrillRun,
  drafts: readonly EventDraft[],
): DrillRun {
  const appended = drafts.map((draft, index) =>
    cloneAndFreeze({ ...draft, seq: run.events.length + index + 1 } as DrillRunEvent),
  );
  return projectRun([...run.events, ...appended]);
}

export function eventsSince(run: DrillRun, sinceSeq = 0): readonly DrillRunEvent[] {
  return run.events.filter((event) => event.seq > sinceSeq);
}

export function deriveSegments(run: DrillRun): readonly Segment[] {
  const previousByBranch = new Map<string, CheckpointReachedEvent>();
  const segments: Segment[] = [];

  for (const event of run.events) {
    if (event.type !== "checkpoint.reached") continue;
    const previous = previousByBranch.get(event.data.branchId);
    if (previous) {
      segments.push({
        branchId: event.data.branchId,
        startCheckpointId: previous.data.checkpointId,
        endCheckpointId: event.data.checkpointId,
        startNodeId: previous.data.nodeId,
        endNodeId: event.data.nodeId,
        startSeq: previous.seq,
        endSeq: event.seq,
      });
    }
    previousByBranch.set(event.data.branchId, event);
  }

  return deepFreeze(segments);
}
