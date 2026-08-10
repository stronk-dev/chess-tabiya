import type { DrillRunSchemaVersion } from "@chess-tabiya/schema";

export type Actor = "user" | "opponent" | "system";
export type ObjectiveState =
  | "active"
  | "preserved"
  | "degraded"
  | "failed"
  | "achieved"
  | "transitioned";

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
    readonly packId: string;
    readonly packDigest: string;
    readonly policyConfig: PolicyConfig;
    readonly rootNode: Node;
    readonly branch: Branch;
    readonly activeCursor: Cursor;
  }
>;
export type MoveCommittedEvent = Event<"move.committed", { readonly node: Node }>;
export type OpponentMoveSelectedEvent = Event<
  "opponent.move_selected",
  { readonly nodeId: string; readonly branchId: string; readonly moveUci: string }
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
  { readonly nodeId: string; readonly outcome: string }
>;
export type TransferScheduledEvent = Event<
  "transfer.scheduled",
  { readonly nodeId: string; readonly scheduleId: string }
>;

export type DrillRunEvent =
  | RunStartedEvent
  | MoveCommittedEvent
  | OpponentMoveSelectedEvent
  | CheckpointReachedEvent
  | ObjectiveStateChangedEvent
  | BranchForkedEvent
  | RunRewoundEvent
  | SegmentCompletedEvent
  | FeedbackGeneratedEvent
  | OutcomeReachedEvent
  | TransferScheduledEvent;

export type EventDraft = DrillRunEvent extends infer TEvent
  ? TEvent extends DrillRunEvent
    ? Omit<TEvent, "seq">
    : never
  : never;

export interface DrillRun {
  readonly schemaVersion: DrillRunSchemaVersion;
  readonly id: string;
  readonly packId: string;
  readonly packDigest: string;
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
