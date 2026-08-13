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
  "follow_theory",
] as const;

export type ObjectiveType = (typeof OBJECTIVE_TYPES)[number];

export interface SpineNode {
  readonly id: string;
  readonly moveUci: string;
  readonly moveSan: string;
  readonly children: readonly SpineNode[];
  readonly annotations?: readonly string[];
}

export interface PlanClass {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

export type DeviationLocation =
  | { readonly spineNodeId: string }
  | { readonly fen: string };

export interface Deviation {
  readonly at: DeviationLocation;
  readonly moveUci: string;
  readonly class: string;
  readonly offObjective?: boolean;
  readonly note?: string;
}

export type SimpleTrigger =
  | { readonly atPly: number }
  | { readonly atSpineNode: string }
  | { readonly atAuthoredBoundary: "crossed" }
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
    readonly summary?: string;
    readonly grading?: ObjectiveGrading;
    readonly successConditions?: readonly SuccessCondition[];
    readonly [key: string]: unknown;
  };
  readonly checkpoints: readonly CheckpointDefinition[];
  readonly planClasses?: readonly PlanClass[];
  readonly spine?: readonly SpineNode[];
  readonly authoredBoundary?: {
    readonly spineNodeIds?: readonly string[];
    readonly plyHorizon?: number;
    readonly fenPredicates?: readonly Readonly<Record<string, unknown>>[];
    readonly [key: string]: unknown;
  };
  readonly deviations?: readonly Deviation[];
  readonly [key: string]: unknown;
}

export type ObjectiveState =
  | "active"
  | "preserved"
  | "degraded"
  | "failed"
  | "achieved"
  | "transitioned";

export type RootAssessment =
  | { readonly kind: "authored"; readonly note: string }
  | {
      readonly kind: "syzygy";
      readonly category: "win" | "loss" | "draw";
      readonly pieceCount: number;
      readonly sourceId: "syzygy";
      readonly retrievedAt: string;
    };

export interface ObjectiveGrading {
  readonly assessedBy: RootAssessment;
  readonly resolveAt:
    | { readonly kind: "checkpoint"; readonly checkpointId: string }
    | { readonly kind: "terminal" };
}

interface SuccessConditionBase {
  readonly to?: Exclude<ObjectiveState, "active">;
  readonly from?: readonly Extract<
    ObjectiveState,
    "active" | "preserved" | "degraded"
  >[];
}

export type SuccessCondition =
  | (SuccessConditionBase & {
      readonly kind: "reach_checkpoint";
      readonly checkpointId: string;
    })
  | (SuccessConditionBase & {
      readonly kind: "outcome";
      readonly result: "win" | "loss" | "draw";
    })
  | (SuccessConditionBase & {
      readonly kind: "material_balance";
      readonly perspective: "white" | "black";
      readonly comparison: "atLeast" | "atMost" | "equal";
      readonly value: number;
    })
  | (SuccessConditionBase & {
      readonly kind: "rules_fact";
      readonly fact: "checkmate" | "stalemate";
      readonly winner?: "white" | "black";
    });
