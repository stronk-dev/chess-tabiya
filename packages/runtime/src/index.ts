import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";

export { transposeKey } from "./chess.js";
export {
  deviationAnchors,
  insideAuthoredBoundary,
  lineMembership,
  spineNodeIdFor,
  spinePositionIndex,
  type LineMembershipEntry,
  type LineVerdict,
} from "./line.js";
export { BranchQueryError, branchPath } from "./branch-path.js";
export {
  compareBranches,
  type BranchColumn,
  type BranchComparison,
  type BranchConsequence,
  type CheckpointHit,
  type ComparisonEvidenceEntry,
  type ComparisonLineEntry,
  type ComparisonRow,
  type ComparisonScore,
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
export { feedbackDeliveryOpen, feedbackDisclosed } from "./feedback.js";
export { terminalOutcome } from "./outcome.js";
export {
  STRUCTURAL_FEATURE_KINDS,
  matchesStructuralExpression,
  matchesStructuralFeature,
  pawnSafety,
  structuralDelta,
  structuralFeatureKinds,
  structuralReading,
  vacationReading,
  type FeatureComparison,
  type PawnSafety,
  type ReachRole,
  type ReachScope,
  type StructuralDelta,
  type StructuralExpression,
  type StructuralFeature,
  type StructuralFeatureKind,
  type StructuralObservation,
  type StructuralReading,
  type StructureId,
  type StructureMatch,
  type VacationReading,
} from "./structure.js";
export {
  legIndexAt,
  trajectoryLegSpans,
  trajectoryVerdict,
  type TrajectoryLegOutcome,
  type TrajectoryLegSpan,
  type TrajectoryTransition,
  type TrajectoryVerdict,
} from "./trajectory.js";
export {
  canonicalRunStart,
  digestSessionSource,
  isPackSession,
  sessionSource,
  type CreateRunSession,
  type PackRun,
  type SessionSource,
} from "./session.js";
export { attachEvidence } from "./evidence.js";
export {
  RULES_EVIDENCE_FACTS,
  THEORY_EVIDENCE_FACTS,
  engineEvidenceRef,
  isEngineEvidenceRef,
  packEvidenceRef,
  packAbsentEvidenceRef,
  rulesEvidenceRef,
  theoryEvidenceRef,
  type EngineEvidenceRef,
  type PackEvidenceRef,
  type PackAbsentEvidenceRef,
  type RulesEvidenceFact,
  type RulesEvidenceRef,
  type TheoryEvidenceFact,
  type TheoryEvidenceRef,
} from "./evidence-ref.js";
export {
  MATERIAL_VALUES,
  applyObjectiveEvidenceProposal,
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
  opponentMovesFromEvents,
  readBackReplay,
  resistanceOnPath,
  type OpponentMoveReadback,
  type AppliedPolicyCount,
  type PathResistance,
  type ReadBackReplay,
  type ResistanceEngineCount,
} from "./replay.js";
export {
  appendOpponentPly,
  commitMove,
  createRun,
  fork,
  historyFrom,
  reachCheckpoint,
  rewind,
  rewindToCheckpoint,
  revealFeedback,
  type AppendOpponentPlyOptions,
  type CommitMoveOptions,
  type CreateRunInput,
  type LegacyCreateRunInput,
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
  OpponentSelection,
  OpponentMoveSelectedEvent,
  PredictionRecordedEvent,
  PolicyConfig,
  PolicyModeApplied,
  PositionOpponentPolicy,
  RunFeedbackPolicy,
  RunOpponentMode,
  RunOpponentPolicy,
  RunOutcome,
  RunSessionKind,
  RunStart,
  SelectionCandidate,
  SelectionEngineIdentity,
  Segment,
  VersionedPolicy,
} from "./types.js";
export { RUN_OPPONENT_MODES } from "./types.js";

export const runtimeBuildInfo = Object.freeze({
  packageName: "@chess-tabiya/runtime",
  runSchemaVersion: DRILL_RUN_SCHEMA_VERSION,
});
