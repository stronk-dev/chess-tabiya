import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";

export { transposeKey } from "./chess.js";
export {
  RuntimeError,
  assertActiveWriter,
  type IllegalMoveReason,
  type RuntimeErrorCode,
} from "./errors.js";
export { appendEvents, deriveSegments, eventsSince, projectRun } from "./events.js";
export {
  commitMove,
  createRun,
  fork,
  historyFrom,
  reachCheckpoint,
  rewind,
  rewindToCheckpoint,
  type CommitMoveOptions,
  type CreateRunInput,
  type ForkOptions,
} from "./runtime.js";
export type {
  Actor,
  Branch,
  CheckpointReachedEvent,
  Cursor,
  DrillRun,
  DrillRunEvent,
  EventDraft,
  ExecutionLocus,
  MutationResult,
  Node,
  ObjectiveState,
  PolicyConfig,
  Segment,
  VersionedPolicy,
} from "./types.js";

export const runtimeBuildInfo = Object.freeze({
  packageName: "@chess-tabiya/runtime",
  runSchemaVersion: DRILL_RUN_SCHEMA_VERSION,
});
