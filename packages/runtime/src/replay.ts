import { projectRun } from "./events.js";
import type {
  DrillRun,
  DrillRunEvent,
  OpponentMoveSelectedEvent,
  RunOpponentPolicy,
  SelectionEngineIdentity,
} from "./types.js";
import { historyFrom } from "./runtime.js";

export class ReplayError extends Error {
  readonly seq: number;

  constructor(seq: number, message: string) {
    super(`Invalid opponent read-back at event ${seq}: ${message}`);
    this.name = "ReplayError";
    this.seq = seq;
  }
}

export interface OpponentMoveReadback {
  readonly selectionSeq: number;
  readonly parentNodeId: string;
  readonly committedNodeId: string;
  readonly branchId: string;
  readonly moveUci: string;
  readonly engine: SelectionEngineIdentity;
  readonly policyModeApplied: import("./types.js").PolicyModeApplied;
}

export interface ReadBackReplay {
  readonly run: DrillRun;
  readonly opponentMoves: readonly OpponentMoveReadback[];
}

function readOpponentMove(
  selection: OpponentMoveSelectedEvent,
  committed: DrillRunEvent | undefined,
): OpponentMoveReadback {
  if (selection.data.selection.moveUci !== selection.data.moveUci) {
    throw new ReplayError(selection.seq, "selection payload and event move disagree");
  }
  if (committed?.type !== "move.committed") {
    throw new ReplayError(selection.seq, "selection is not followed by move.committed");
  }
  const node = committed.data.node;
  if (node.actor !== "opponent") {
    throw new ReplayError(selection.seq, "committed move is not attributed to opponent");
  }
  if (
    node.parentId !== selection.data.nodeId ||
    node.branchId !== selection.data.branchId ||
    node.moveUci !== selection.data.moveUci
  ) {
    throw new ReplayError(selection.seq, "selection and committed move disagree");
  }
  return Object.freeze({
    selectionSeq: selection.seq,
    parentNodeId: selection.data.nodeId,
    committedNodeId: node.id,
    branchId: selection.data.branchId,
    moveUci: selection.data.moveUci,
    engine: selection.data.selection.engine,
    policyModeApplied: selection.data.selection.policyModeApplied,
  });
}

export function opponentMovesFromEvents(
  events: readonly DrillRunEvent[],
): readonly OpponentMoveReadback[] {
  const opponentMoves: OpponentMoveReadback[] = [];
  for (const [index, event] of events.entries()) {
    if (event.type === "opponent.move_selected") {
      opponentMoves.push(readOpponentMove(event, events[index + 1]));
    } else if (
      event.type === "move.committed" &&
      event.data.node.actor === "opponent" &&
      events[index - 1]?.type !== "opponent.move_selected"
    ) {
      throw new ReplayError(event.seq, "opponent commit has no authoritative selection");
    }
  }
  return Object.freeze(opponentMoves);
}

export interface ResistanceEngineCount {
  readonly engine: SelectionEngineIdentity;
  readonly plyCount: number;
}

export interface PathResistance {
  readonly requested: RunOpponentPolicy;
  readonly engines: readonly ResistanceEngineCount[];
  readonly applied: readonly AppliedPolicyCount[];
  readonly unknownPlyCount: number;
}

export interface AppliedPolicyCount {
  readonly mode: Exclude<import("./types.js").PolicyModeApplied, "unknown">;
  readonly plyCount: number;
}

export function resistanceOnPath(run: DrillRun, nodeId: string): PathResistance {
  const pathNodeIds = new Set(historyFrom(run, nodeId).map((node) => node.id));
  const counts = new Map<string, { engine: SelectionEngineIdentity; plyCount: number }>();
  const applied = new Map<AppliedPolicyCount["mode"], number>();
  let unknownPlyCount = 0;
  for (const move of opponentMovesFromEvents(run.events)) {
    if (!pathNodeIds.has(move.committedNodeId)) continue;
    if (move.policyModeApplied === "unknown") unknownPlyCount += 1;
    else applied.set(move.policyModeApplied, (applied.get(move.policyModeApplied) ?? 0) + 1);
    const identity = move.engine;
    const key = JSON.stringify([
      identity.id,
      identity.name,
      identity.version,
      identity.modelId ?? null,
      identity.containerDigest ?? null,
      identity.seedHonored,
    ]);
    const previous = counts.get(key);
    counts.set(key, {
      engine: identity,
      plyCount: (previous?.plyCount ?? 0) + 1,
    });
  }
  return Object.freeze({
    requested: run.opponentPolicy,
    applied: Object.freeze(
      [...applied].map(([mode, plyCount]) => Object.freeze({ mode, plyCount })),
    ),
    unknownPlyCount,
    engines: Object.freeze(
      [...counts.values()].map((value): ResistanceEngineCount =>
        Object.freeze(value),
      ),
    ),
  });
}

export function readBackReplay(events: readonly DrillRunEvent[]): ReadBackReplay {
  const run = projectRun(events);
  const opponentMoves = opponentMovesFromEvents(events);

  return Object.freeze({ run, opponentMoves });
}
