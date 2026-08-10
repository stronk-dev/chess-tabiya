export const OBJECTIVE_TYPES = [
  "reach_structure",
  "preserve_plan_window",
  "execute_break",
  "prevent_opponent_plan",
  "transition_to_endgame",
  "win",
  "hold",
  "save",
  "resist",
  "play_until_checkpoint",
] as const;

export type ObjectiveType = (typeof OBJECTIVE_TYPES)[number];

export interface SpineNode {
  readonly id: string;
  readonly moveUci: string;
  readonly moveSan: string;
  readonly children: readonly SpineNode[];
  readonly annotations?: readonly string[];
}

export type SimpleTrigger =
  | { readonly atPly: number }
  | { readonly atSpineNode: string }
  | { readonly fenPredicate: Readonly<Record<string, unknown>> }
  | { readonly materialBalance: Readonly<Record<string, unknown>> };

export interface TimingWindowTrigger {
  readonly windowOpens: SimpleTrigger;
  readonly windowCloses: SimpleTrigger;
  readonly luxuryMoveBudget: number;
}

export type CheckpointTrigger = SimpleTrigger | TimingWindowTrigger;

export type CheckpointInteraction =
  | {
      readonly type: "intent_capture";
      readonly planClassIds: readonly string[];
    }
  | {
      readonly type: "prediction";
      readonly grading: {
        readonly source: "opponent_policy" | "engine" | "both";
        readonly topK?: number;
        readonly minMass?: number;
      };
      readonly flipBoard?: boolean;
    };

export interface CheckpointDefinition {
  readonly id: string;
  readonly trigger: CheckpointTrigger;
  readonly interaction?: CheckpointInteraction;
  readonly [key: string]: unknown;
}

export interface DrillPackDefinition {
  readonly id: string;
  readonly version: string;
  readonly start: { readonly fen: string; readonly [key: string]: unknown };
  readonly objective: {
    readonly type: ObjectiveType;
    readonly [key: string]: unknown;
  };
  readonly checkpoints: readonly CheckpointDefinition[];
  readonly spine?: readonly SpineNode[];
  readonly authoredBoundary?: {
    readonly spineNodeIds?: readonly string[];
    readonly [key: string]: unknown;
  };
  readonly deviations?: readonly {
    readonly at: { readonly spineNodeId?: string; readonly fen?: string };
    readonly [key: string]: unknown;
  }[];
  readonly [key: string]: unknown;
}
