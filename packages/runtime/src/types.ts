import type { DrillRunSchemaVersion } from "@chess-tabiya/schema";

export type Actor = "user" | "opponent" | "system";
export type ObjectiveState =
  | "active"
  | "preserved"
  | "degraded"
  | "failed"
  | "achieved"
  | "transitioned";
export type EvidenceKind = "eval" | "wdl" | "bestline";
export type EvidenceSource = "engine_validated" | "human_model_predicted";

export interface EvidencePayload {
  readonly kind: EvidenceKind;
  readonly source: EvidenceSource;
  readonly values: Readonly<Record<string, unknown>>;
}

export interface VersionedPolicy {
  readonly id: string;
  readonly version: string;
}

export interface ExecutionLocus {
  readonly executedAt: "browser" | "server";
  readonly engineIds: readonly VersionedPolicy[];
  readonly modelIds: readonly VersionedPolicy[];
}

export interface PolicyConfig {
  readonly seedMode: "fixed" | "per_run" | "per_branch";
  readonly locus: ExecutionLocus;
}

export type RunSessionKind = "pack" | "position" | "imported";
export type RunFeedbackPolicy = "delayed_checkpoint" | "segment_end" | "attempt_end" | "immediate_guard";
export const RUN_OPPONENT_MODES = Object.freeze([
  "human_common",
  "strong_engine",
  "theory_strict",
  "perfect_tablebase",
  "practical_resistance",
] as const);
export type RunOpponentMode = (typeof RUN_OPPONENT_MODES)[number];
export type PolicyModeApplied = RunOpponentMode | "enumerated" | "unknown";
export type RunOutcome = "win" | "loss" | "draw";

export interface RunStart {
  readonly fen: string;
  readonly side: "white" | "black";
}

export interface RunOpponentPolicy {
  readonly mode: RunOpponentMode;
  readonly targetElo?: number;
  readonly temperature?: number;
  readonly topP?: number;
}

export interface PositionOpponentPolicy extends RunOpponentPolicy {
  readonly mode: "human_common" | "strong_engine";
}

export interface SelectionCandidate {
  readonly moveUci: string;
  readonly mass?: number;
  readonly concessionRatio?: number;
  readonly offWindow?: boolean;
  readonly rank: number;
}

export interface SelectionEngineIdentity {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly modelId?: string;
  readonly containerDigest?: string;
  readonly seedHonored: boolean;
  readonly eloHonored?: boolean;
  readonly eloApplied?: number;
}

export interface OpponentSelection {
  readonly moveUci: string;
  readonly policyModeApplied: PolicyModeApplied;
  readonly candidates?: readonly SelectionCandidate[];
  readonly engine: SelectionEngineIdentity;
}

export interface Node {
  readonly id: string;
  readonly parentId: string | null;
  readonly fen: string;
  readonly transposeKey: string;
  readonly moveUci: string | null;
  readonly moveSan: string | null;
  readonly ply: number;
  readonly actor: Actor;
  readonly branchId: string;
  readonly checkpointRefs: readonly string[];
  readonly objectiveState: ObjectiveState;
  readonly evidenceRefs: readonly string[];
  readonly createdAt: string;
  readonly clockState?: Readonly<Record<string, unknown>>;
}

export interface Branch {
  readonly id: string;
  readonly forkNodeId: string;
  readonly label: string;
  readonly intent?: string;
  readonly seed: number;
  readonly origin: "played" | "simulated";
}

export interface Cursor {
  readonly nodeId: string;
  readonly branchId: string;
}

interface Event<TType extends string, TData> {
  readonly seq: number;
  readonly type: TType;
  readonly at: string;
  readonly data: TData;
}

export type RunStartedEvent = Event<
  "run.started",
  {
    readonly id: string;
    readonly sessionKind: RunSessionKind;
    readonly packId: string | null;
    readonly packDigest: string | null;
    readonly sessionDigest: string;
    readonly start: RunStart;
    readonly feedbackPolicy: RunFeedbackPolicy;
    readonly opponentPolicy: RunOpponentPolicy;
    readonly policyConfig: PolicyConfig;
    readonly rootNode: Node;
    readonly branch: Branch;
    readonly activeCursor: Cursor;
  }
>;
export type FeedbackRevealedEvent = Event<
  "feedback.revealed",
  { readonly nodeId: string }
>;
export type MoveCommittedEvent = Event<"move.committed", { readonly node: Node }>;
export type OpponentMoveSelectedEvent = Event<
  "opponent.move_selected",
  {
    readonly nodeId: string;
    readonly branchId: string;
    readonly moveUci: string;
    readonly selection: OpponentSelection;
  }
>;
export type CheckpointReachedEvent = Event<
  "checkpoint.reached",
  { readonly checkpointId: string; readonly nodeId: string; readonly branchId: string }
>;
export type ObjectiveStateChangedEvent = Event<
  "objective.state_changed",
  {
    readonly nodeId: string;
    readonly from: ObjectiveState;
    readonly to: ObjectiveState;
    readonly evidenceRefs: readonly string[];
  }
>;
export type EvidenceAttachedEvent = Event<
  "evidence.attached",
  {
    readonly nodeId: string;
    readonly evidenceRefs: readonly string[];
    readonly payload: EvidencePayload;
  }
>;
export type BranchForkedEvent = Event<"branch.forked", { readonly branch: Branch }>;
export type RunRewoundEvent = Event<
  "run.rewound",
  { readonly fromNodeId: string; readonly toNodeId: string; readonly branchId: string }
>;
export type SegmentCompletedEvent = Event<
  "segment.completed",
  {
    readonly branchId: string;
    readonly startCheckpointEventSeq: number;
    readonly endCheckpointEventSeq: number;
    readonly startNodeId: string;
    readonly endNodeId: string;
  }
>;
export type FeedbackGeneratedEvent = Event<
  "feedback.generated",
  { readonly nodeId: string; readonly evidenceRefs: readonly string[] }
>;
export type OutcomeReachedEvent = Event<
  "outcome.reached",
  { readonly nodeId: string; readonly outcome: RunOutcome }
>;
export type TransferScheduledEvent = Event<
  "transfer.scheduled",
  { readonly nodeId: string; readonly scheduleId: string }
>;
export type PredictionRecordedEvent = Event<
  "prediction.recorded",
  {
    readonly nodeId: string;
    readonly checkpointId: string;
    readonly predictedUci: string;
    readonly predictedMass: number | null;
    readonly predictedRank: number | null;
    readonly candidateCount: number;
    readonly distribution: OpponentSelection;
  }
>;
export interface ReasoningTranscript {
  readonly candidates: readonly string[];
  readonly plan: string;
  readonly fears: string;
}
export interface ReasoningDetection {
  readonly keyPointId: string;
  readonly status: "detected" | "not_detected";
  readonly match?: {
    readonly field: "candidates" | "plan" | "fears";
    readonly index: number | null;
    readonly start: number;
    readonly end: number;
  };
}
export type ReasoningRecordedEvent = Event<
  "reasoning.recorded",
  {
    readonly nodeId: string;
    readonly checkpointId: string;
    readonly checkpointEventSeq: number;
    readonly skipped: boolean;
    readonly transcript: ReasoningTranscript | null;
    readonly matcherVersion: 1;
    readonly detections: readonly ReasoningDetection[];
  }
>;
export type GroupSource = "hand_picked" | "authored" | "human_replies" | "engine_top_n";
export type GroupResistance = "fixed" | "per_branch";
export interface BranchGroupMember {
  readonly branchId: string;
  readonly seedMoveUci: string;
}
export type GroupCreatedEvent = Event<
  "group.created",
  {
    readonly groupId: string;
    readonly sourceNodeId: string;
    readonly source: GroupSource;
    readonly resistance: GroupResistance;
    readonly members: readonly BranchGroupMember[];
    readonly distribution?: OpponentSelection;
  }
>;

export interface BranchGroup {
  readonly groupId: string;
  readonly sourceNodeId: string;
  readonly source: GroupSource;
  readonly resistance: GroupResistance;
  readonly members: readonly BranchGroupMember[];
  readonly distribution?: OpponentSelection;
  readonly createdAtSeq: number;
}

export type DrillRunEvent =
  | RunStartedEvent
  | MoveCommittedEvent
  | OpponentMoveSelectedEvent
  | CheckpointReachedEvent
  | ObjectiveStateChangedEvent
  | EvidenceAttachedEvent
  | BranchForkedEvent
  | RunRewoundEvent
  | SegmentCompletedEvent
  | FeedbackGeneratedEvent
  | OutcomeReachedEvent
  | TransferScheduledEvent
  | PredictionRecordedEvent
  | ReasoningRecordedEvent
  | GroupCreatedEvent
  | FeedbackRevealedEvent;

export type EventDraft = DrillRunEvent extends infer TEvent
  ? TEvent extends DrillRunEvent
    ? Omit<TEvent, "seq">
    : never
  : never;

export interface DrillRun {
  readonly schemaVersion: DrillRunSchemaVersion;
  readonly id: string;
  readonly sessionKind: RunSessionKind;
  readonly packId: string | null;
  readonly packDigest: string | null;
  readonly sessionDigest: string;
  readonly start: RunStart;
  readonly feedbackPolicy: RunFeedbackPolicy;
  readonly opponentPolicy: RunOpponentPolicy;
  readonly policyConfig: PolicyConfig;
  readonly nodes: readonly Node[];
  readonly branches: readonly Branch[];
  readonly events: readonly DrillRunEvent[];
  readonly activeCursor: Cursor;
}

export interface Segment {
  readonly branchId: string;
  readonly startCheckpointId: string;
  readonly endCheckpointId: string;
  readonly startNodeId: string;
  readonly endNodeId: string;
  readonly startSeq: number;
  readonly endSeq: number;
}

export interface MutationResult {
  readonly run: DrillRun;
  readonly emitted: readonly DrillRunEvent[];
}
