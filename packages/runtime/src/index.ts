import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";

export { canonicalFen, transposeKey } from "./chess.js";
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
export { comparisonNarrative, comparisonStrips, type BranchStrips, type ComparisonNarrative, type NarrativeGroup, type PieceRoute, type StripEntry } from "./compare-strips.js";
export {
  RuntimeError,
  assertActiveWriter,
  type IllegalMoveReason,
  type RuntimeErrorCode,
} from "./errors.js";
export { appendEvents, deriveSegments, eventsSince, groupsFromEvents, projectRun } from "./events.js";
export { feedbackDeliveryOpen, feedbackDisclosed } from "./feedback.js";
export { shapeFirings, type ShapeFiring, type ShapeTriggerSource } from "./shape-firing.js";
export { classifyPhase, renderPhaseReading, ENDGAME_MATERIAL_MAX, DEVELOPED_MATERIAL_MIN, OPENING_UNDEVELOPED_MIN, MIDDLEGAME_UNDEVELOPED_MAX, PHASE_PROVENANCE, type DetectedPhase, type PhaseReading } from "./phase.js";
export { SILENT_ASSISTANCE, permittedAssistance, type AssistanceConfig, type AssistanceContext, type AssistancePermission } from "./assistance.js";
export { pivotalMarkers, renderPivotalMarker, type PivotalKind, type PivotalMarker, type IrreversibilityDetail, type PhaseChangeDetail, type DivergenceDetail, type CollapseDetail } from "./pivotal.js";
export { endgameReading, renderEndgameReading, type EndgameTypeId, type EndgameReading, type TechniqueRef } from "./endgame.js";
export { retrospectivePivot } from "./adaptive.js";
export { STORY_MATE_CP, STORY_PIVOT_CP, storyMoments, suggestTitle, type StoryEvaluation, type StoryMoment, type StoryMomentKind, type StoryProjection, type StoryTitleInput } from "./story.js";
export { voiceCheck, BANNED_JUDGEMENTS, PRESCRIPTIVE_VERBS, CHESS_LEXICON, type EvidencePacket, type ShapeEntryRef, type VoiceCheckResult } from "./voice.js";
export { matchKeyPoints, normalizeReasoningText } from "./reasoning.js";
export { terminalOutcome } from "./outcome.js";
export {
  AUTHORABLE_TEMPO_VERDICTS,
  DECLARED_UNGRADEABLE_VERDICTS,
  TEMPO_GRADEABLE_VERDICTS,
  TEMPO_VERDICTS,
  UNAUTHORED_TEMPO_DEFAULTS,
  tempoMovesFromRun,
  unauthoredTempoTransition,
  windowStates,
  type TempoMove,
  type TempoVerdict,
  type TimingWindowState,
  type TriggerResolver,
} from "./tempo.js";
export {
  STRUCTURAL_FEATURE_KINDS,
  matchesStructuralExpression,
  matchesStructuralFeature,
  mirrorExpression,
  pawnSafety,
  structuralDelta,
  structuralFeatureKinds,
  structuralReading,
  vacationReading,
  type FeatureComparison,
  type FileRange,
  type FileTemplateFeature,
  type MirrorAxis,
  type PawnSafety,
  type ReachRole,
  type ReachScope,
  type Quantifier,
  type RankRange,
  type SquareRegion,
  type SquareTemplateFeature,
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
  tempoEvidenceRef,
  type EngineEvidenceRef,
  type PackEvidenceRef,
  type PackAbsentEvidenceRef,
  type RulesEvidenceFact,
  type RulesEvidenceRef,
  type TheoryEvidenceFact,
  type TheoryEvidenceRef,
  type TempoEvidenceRef,
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
  BranchGroup,
  BranchGroupMember,
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
  ReasoningDetection,
  ReasoningRecordedEvent,
  ReasoningTranscript,
  GroupCreatedEvent,
  GroupResistance,
  GroupSource,
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
