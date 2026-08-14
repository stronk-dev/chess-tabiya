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
  "run_trajectory",
] as const;

export type ObjectiveType = (typeof OBJECTIVE_TYPES)[number];

export const CHECKPOINT_ACTIONS = ["compare_branches"] as const;
export type CheckpointAction = (typeof CHECKPOINT_ACTIONS)[number];

export const FEEDBACK_POLICIES = ["delayed_checkpoint", "segment_end"] as const;
export type FeedbackPolicy = (typeof FEEDBACK_POLICIES)[number];

export const PACK_PHASES = ["opening", "middlegame", "endgame", "cross_phase"] as const;
export type PackPhase = (typeof PACK_PHASES)[number];

export const RETRY_VARIANT_KINDS = [
  "same_root_new_defense",
  "alternate_plan_class",
  "related_position_same_idea",
  "opposite_side",
  "different_material_details",
] as const;
export type RetryVariantKind = (typeof RETRY_VARIANT_KINDS)[number];

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
  readonly shapePlan?: {
    readonly shape: string;
    readonly plan: string;
  };
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
  readonly start: {
    readonly fen: string;
    readonly side: "white" | "black";
    readonly [key: string]: unknown;
  };
  readonly objective: {
    readonly type: ObjectiveType;
    readonly summary?: string;
    readonly grading?: ObjectiveGrading;
    readonly successConditions?: readonly SuccessCondition[];
    readonly [key: string]: unknown;
  };
  readonly checkpoints: readonly CheckpointDefinition[];
  readonly concepts?: readonly string[];
  readonly shapes?: readonly string[];
  readonly retryVariants?: readonly {
    readonly kind: RetryVariantKind;
    readonly note?: string;
  }[];
  readonly legs?: readonly TrajectoryLeg[];
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

export interface TrajectoryLeg {
  readonly id: string;
  readonly entryCheckpointId?: string;
  readonly objective: DrillPackDefinition["objective"];
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
    })
  | (SuccessConditionBase & {
      readonly kind: "structural_feature";
      readonly feature: StructuralExpression;
    });
import type { Color, FileName, Role, SquareName } from "chessops/types";

export const STRUCTURAL_FEATURE_KINDS = Object.freeze([
  "pawn_safe_square", "outpost", "backward_pawn", "isolated_pawn", "doubled_pawn",
  "passed_pawn", "open_file", "half_open_file", "line_blockers", "direct_attack_count",
  "piece_reach_count", "named_structure", "bishop_on_shade", "pawn_count",
  "king_opposition",
] as const);
export type StructuralFeatureKind = (typeof STRUCTURAL_FEATURE_KINDS)[number];

export type StructuralFeature =
  | { readonly kind: "pawn_safe_square"; readonly color: Color; readonly square: SquareName }
  | { readonly kind: "outpost"; readonly color: Color; readonly square: SquareName }
  | { readonly kind: "backward_pawn"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "isolated_pawn"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "doubled_pawn"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "passed_pawn"; readonly color: Color; readonly square: SquareName }
  | { readonly kind: "open_file"; readonly file: FileName }
  | { readonly kind: "half_open_file"; readonly color: Color; readonly file: FileName }
  | { readonly kind: "line_blockers"; readonly from: SquareName; readonly to: SquareName; readonly comparison: "atLeast" | "atMost" | "equal"; readonly count: number }
  | { readonly kind: "direct_attack_count"; readonly square: SquareName; readonly color: Color; readonly comparison: "atLeast" | "atMost" | "equal"; readonly count: number }
  | { readonly kind: "piece_reach_count"; readonly color: Color; readonly role: "knight" | "bishop" | "rook" | "queen"; readonly scope: "any" | "every"; readonly comparison: "atLeast" | "atMost" | "equal"; readonly count: number }
  | { readonly kind: "named_structure"; readonly id: "carlsbad" | "iqp-white" | "iqp-black" | "maroczy-bind" }
  | { readonly kind: "bishop_on_shade"; readonly color: Color; readonly shade: "light" | "dark" }
  | { readonly kind: "pawn_count"; readonly color: Color; readonly basis: "count" | "difference"; readonly comparison: "atLeast" | "atMost" | "equal"; readonly count: number }
  | { readonly kind: "king_opposition"; readonly color: Color; readonly form: "direct" | "distant" };

export type MirrorAxis = "colors" | "files" | "both";
export type Quantifier = "some" | "every";
export interface FileRange { readonly from: FileName; readonly to: FileName }
export interface RankRange { readonly from: number; readonly to: number }
export interface SquareRegion { readonly files: FileRange; readonly ranks: RankRange }
export type FileTemplateFeature =
  | { readonly kind: "backward_pawn"; readonly color: Color }
  | { readonly kind: "isolated_pawn"; readonly color: Color }
  | { readonly kind: "doubled_pawn"; readonly color: Color }
  | { readonly kind: "half_open_file"; readonly color: Color }
  | { readonly kind: "open_file" };
export type SquareTemplateFeature =
  | { readonly kind: "pawn_safe_square"; readonly color: Color }
  | { readonly kind: "outpost"; readonly color: Color }
  | { readonly kind: "passed_pawn"; readonly color: Color }
  | { readonly kind: "direct_attack_count"; readonly color: Color; readonly comparison: "atLeast" | "atMost" | "equal"; readonly count: number }
  | { readonly kind: "piece"; readonly piece: { readonly color: Color; readonly role: Role } | null };

export type StructuralExpression =
  | { readonly kind: "all"; readonly of: readonly [StructuralExpression, ...StructuralExpression[]] }
  | { readonly kind: "any"; readonly of: readonly [StructuralExpression, ...StructuralExpression[]] }
  | { readonly kind: "not"; readonly of: StructuralExpression }
  | { readonly kind: "feature"; readonly feature: StructuralFeature }
  | { readonly kind: "pieceOnSquare"; readonly square: SquareName; readonly piece: { readonly color: Color; readonly role: Role } | null }
  | { readonly kind: "mirrored"; readonly axis: MirrorAxis; readonly of: StructuralExpression }
  | { readonly kind: "quantified"; readonly quantifier: Quantifier; readonly over: { readonly files: FileRange }; readonly feature: FileTemplateFeature }
  | { readonly kind: "quantified"; readonly quantifier: Quantifier; readonly over: { readonly squares: SquareRegion }; readonly feature: SquareTemplateFeature };
