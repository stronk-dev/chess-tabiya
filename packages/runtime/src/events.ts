import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";

import { unknownNode } from "./errors.js";
import { positionFromFen } from "./chess.js";
import { terminalOutcome } from "./outcome.js";
import { assertObjectiveTransition } from "./objective-state.js";
import type {
  Branch,
  CheckpointReachedEvent,
  DrillRun,
  DrillRunEvent,
  EventDraft,
  Node,
  Segment,
  SegmentCompletedEvent,
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

function segmentFromEvent(
  events: readonly DrillRunEvent[],
  event: SegmentCompletedEvent,
): Segment {
  const start = events[event.data.startCheckpointEventSeq - 1];
  const end = events[event.data.endCheckpointEventSeq - 1];
  if (start?.type !== "checkpoint.reached" || end?.type !== "checkpoint.reached") {
    throw new TypeError(`segment.completed ${event.seq} must reference checkpoint.reached events`);
  }
  if (!(start.seq < end.seq && end.seq < event.seq)) {
    throw new TypeError(`segment.completed ${event.seq} has invalid checkpoint ordering`);
  }
  if (events[event.seq - 2] !== end) {
    throw new TypeError(`segment.completed ${event.seq} must immediately follow its ending checkpoint`);
  }
  if (
    start.data.branchId !== event.data.branchId ||
    end.data.branchId !== event.data.branchId ||
    start.data.nodeId !== event.data.startNodeId ||
    end.data.nodeId !== event.data.endNodeId
  ) {
    throw new TypeError(`segment.completed ${event.seq} does not match its checkpoints`);
  }
  return deepFreeze({
    branchId: event.data.branchId,
    startCheckpointId: start.data.checkpointId,
    endCheckpointId: end.data.checkpointId,
    startNodeId: event.data.startNodeId,
    endNodeId: event.data.endNodeId,
    startSeq: start.seq,
    endSeq: end.seq,
  });
}

export function projectRun(events: readonly DrillRunEvent[]): DrillRun {
  const started = events[0];
  if (started?.type !== "run.started") {
    throw new TypeError("A run event stream must begin with run.started");
  }
  const data = started.data;
  const isPack = data.sessionKind === "pack";
  if (
    isPack !== (data.packId !== null) ||
    isPack !== (data.packDigest !== null)
  ) {
    throw new TypeError("Run session kind and pack identity disagree");
  }
  if (isPack && data.feedbackPolicy === "attempt_end") {
    throw new TypeError("Pack sessions cannot use attempt_end feedback");
  }
  if (!isPack && data.feedbackPolicy !== "attempt_end") {
    throw new TypeError("Position sessions must use attempt_end feedback");
  }
  if (!isPack && data.opponentPolicy.mode === "theory_strict") {
    throw new TypeError("Position sessions cannot use theory_strict");
  }
  if (data.start.fen !== data.rootNode.fen) {
    throw new TypeError("Run start FEN and root node FEN disagree");
  }
  if (!/^sha256:[0-9a-f]{64}$/.test(data.sessionDigest)) {
    throw new TypeError("Run session digest is invalid");
  }

  let nodes: readonly Node[] = [started.data.rootNode];
  let branches: readonly Branch[] = [started.data.branch];
  let activeCursor = started.data.activeCursor;
  const outcomeNodeIds = new Set<string>();

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
        if (node.objectiveState !== event.data.from) {
          throw new TypeError(
            `Objective event expected ${event.data.from}, projection has ${node.objectiveState}`,
          );
        }
        assertObjectiveTransition(
          event.data.from,
          event.data.to,
          event.data.evidenceRefs,
        );
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
      case "evidence.attached": {
        const node = nodes.find((candidate) => candidate.id === event.data.nodeId);
        if (!node) throw unknownNode(event.data.nodeId);
        nodes = replaceNode(
          nodes,
          deepFreeze({
            ...node,
            evidenceRefs: [...new Set([...node.evidenceRefs, ...event.data.evidenceRefs])],
          }),
        );
        break;
      }
      case "opponent.move_selected":
      case "feedback.revealed":
        if (!nodes.some((node) => node.id === event.data.nodeId)) {
          throw unknownNode(event.data.nodeId);
        }
        break;
      case "prediction.recorded": {
        if (!nodes.some((node) => node.id === event.data.nodeId)) throw unknownNode(event.data.nodeId);
        const candidates = event.data.distribution.candidates ?? [];
        const candidate = candidates.find((entry) => entry.moveUci === event.data.predictedUci);
        const mass = candidate?.mass ?? null;
        const rank = candidate?.rank ?? null;
        if (event.data.candidateCount !== candidates.length || event.data.predictedMass !== mass || event.data.predictedRank !== rank) {
          throw new TypeError(`prediction.recorded ${event.seq} does not match its distribution`);
        }
        break;
      }
      case "outcome.reached": {
        const node = nodes.find((candidate) => candidate.id === event.data.nodeId);
        if (!node) throw unknownNode(event.data.nodeId);
        if (outcomeNodeIds.has(node.id)) {
          throw new TypeError(`Node ${node.id} has more than one outcome.reached event`);
        }
        const previous = events[index - 1];
        if (previous?.type !== "move.committed" || previous.data.node.id !== node.id) {
          throw new TypeError(
            `outcome.reached ${event.seq} must immediately follow its move.committed`,
          );
        }
        const expected = terminalOutcome(positionFromFen(node.fen), data.start.side);
        if (expected === undefined) {
          throw new TypeError(`outcome.reached ${event.seq} references a non-terminal node`);
        }
        if (event.data.outcome !== expected) {
          throw new TypeError(
            `outcome.reached ${event.seq} reports ${event.data.outcome}; expected ${expected}`,
          );
        }
        outcomeNodeIds.add(node.id);
        break;
      }
      case "segment.completed":
        segmentFromEvent(events, event);
        break;
      case "feedback.generated":
      case "transfer.scheduled":
        break;
    }
  }

  return deepFreeze({
    schemaVersion: DRILL_RUN_SCHEMA_VERSION,
    id: started.data.id,
    sessionKind: started.data.sessionKind,
    packId: started.data.packId,
    packDigest: started.data.packDigest,
    sessionDigest: started.data.sessionDigest,
    start: started.data.start,
    feedbackPolicy: started.data.feedbackPolicy,
    opponentPolicy: started.data.opponentPolicy,
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
  return deepFreeze(run.events.flatMap((event) =>
    event.type === "segment.completed" ? [segmentFromEvent(run.events, event)] : [],
  ));
}
