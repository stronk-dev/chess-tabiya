import { projectRun } from "./events.js";
import type {
  DrillRun,
  DrillRunEvent,
  OpponentMoveSelectedEvent,
} from "./types.js";

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
}

export interface ReadBackReplay {
  readonly run: DrillRun;
  readonly opponentMoves: readonly OpponentMoveReadback[];
}

function readOpponentMove(
  selection: OpponentMoveSelectedEvent,
  committed: DrillRunEvent | undefined,
): OpponentMoveReadback {
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
  });
}

export function readBackReplay(events: readonly DrillRunEvent[]): ReadBackReplay {
  const run = projectRun(events);
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

  return Object.freeze({ run, opponentMoves: Object.freeze(opponentMoves) });
}
