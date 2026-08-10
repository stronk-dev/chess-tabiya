import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";

export { transposeKey } from "./chess.js";
export { BranchQueryError, branchPath } from "./branch-path.js";
export {
  compare,
  type BranchComparison,
  type CheckpointHit,
  type ComparisonPair,
  type NodeRef,
  type ObjectiveTimelineEntry,
} from "./compare.js";
export {
  RuntimeError,
  assertActiveWriter,
  type IllegalMoveReason,
  type RuntimeErrorCode,
} from "./errors.js";
export { appendEvents, deriveSegments, eventsSince, projectRun } from "./events.js";
export {
  MATERIAL_VALUES,
  evaluateObjective,
  evaluateObjectivePredicate,
  materialBalance,
  requestObjectiveEvidence,
  transitionObjective,
  type FenPredicate,
  type MaterialBalancePredicate,
  type ObjectiveEvaluationResult,
  type ObjectiveEvidenceProposal,
  type ObjectiveEvidenceRequest,
  type ObjectiveEvidenceUpgrader,
  type ObjectivePredicate,
  type ObjectiveTransitionRule,
  type RulesFactPredicate,
} from "./objective.js";
export {
  ObjectiveEvidenceError,
  ObjectiveTransitionError,
  isObjectiveTransitionAllowed,
} from "./objective-state.js";
export { PgnExportError, exportPgn } from "./pgn.js";
export {
  PackRunPgnError,
  exportPackRunPgn,
  type PackRunPgnErrorCode,
} from "./pack-pgn.js";
export {
  ReplayError,
  readBackReplay,
  type OpponentMoveReadback,
  type ReadBackReplay,
} from "./replay.js";
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
  type JobObserver,
} from "./runtime.js";
export type {
  Actor,
  Branch,
  CheckpointReachedEvent,
  Cursor,
  DrillRun,
  DrillRunEvent,
  EvidenceAttachedEvent,
  EvidenceKind,
  EvidencePayload,
  EvidenceSource,
  EventDraft,
  ExecutionLocus,
  MutationResult,
  Node,
  ObjectiveState,
  OpponentMoveSelectedEvent,
  PolicyConfig,
  Segment,
  VersionedPolicy,
} from "./types.js";

export const runtimeBuildInfo = Object.freeze({
  packageName: "@chess-tabiya/runtime",
  runSchemaVersion: DRILL_RUN_SCHEMA_VERSION,
});
