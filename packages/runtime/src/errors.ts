export type IllegalMoveReason =
  | "not-a-legal-move"
  | "wrong-side"
  | "malformed-UCI";

export type RuntimeErrorCode =
  | "ILLEGAL_MOVE"
  | "UNKNOWN_NODE"
  | "UNKNOWN_CHECKPOINT"
  | "NOT_ACTIVE_WRITER"
  | "INVALID_RUN_SESSION"
  | "TERMINAL_START_POSITION"
  | "RUN_TERMINATED";

export class RuntimeError extends Error {
  readonly code: RuntimeErrorCode;
  readonly reason?: IllegalMoveReason;

  constructor(code: RuntimeErrorCode, message: string, reason?: IllegalMoveReason) {
    super(message);
    this.name = "RuntimeError";
    this.code = code;
    if (reason !== undefined) this.reason = reason;
  }
}

export function illegalMove(uci: string, reason: IllegalMoveReason): RuntimeError {
  return new RuntimeError("ILLEGAL_MOVE", `Cannot commit move ${uci}: ${reason}`, reason);
}

export function unknownNode(nodeId: string): RuntimeError {
  return new RuntimeError("UNKNOWN_NODE", `Unknown node: ${nodeId}`);
}

export function unknownCheckpoint(checkpointId: string): RuntimeError {
  return new RuntimeError("UNKNOWN_CHECKPOINT", `Unknown checkpoint: ${checkpointId}`);
}

export function assertActiveWriter(activeWriterId: string, writerId: string): void {
  if (activeWriterId !== writerId) {
    throw new RuntimeError(
      "NOT_ACTIVE_WRITER",
      `Writer ${writerId} does not hold the run lease`,
    );
  }
}

export function runTerminated(nodeId: string): RuntimeError {
  return new RuntimeError("RUN_TERMINATED", `Run is terminal at node: ${nodeId}`);
}

export function terminalStartPosition(): RuntimeError {
  return new RuntimeError(
    "TERMINAL_START_POSITION",
    "A run cannot start from a terminal chess position",
  );
}
