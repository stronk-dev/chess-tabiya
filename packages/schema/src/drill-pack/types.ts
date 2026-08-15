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

export const FEEDBACK_POLICIES = ["delayed_checkpoint", "segment_end", "immediate_guard"] as const;
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
  | { readonly fen: string }
  | { readonly atStart: true };

export interface Deviation {
  readonly at: DeviationLocation;
  readonly moveUci: string;
  readonly class: string;
  readonly offObjective?: boolean;
  readonly note?: string;
}

export type SimpleTrigger =
  | { readonly atStart: true }
  | { readonly atPly: number }
  | { readonly atSpineNode: string }
  | { readonly atAuthoredBoundary: "crossed" }
  | { readonly fenPredicate: Readonly<Record<string, unknown>> }
  | { readonly materialBalance: Readonly<Record<string, unknown>> };

export type TempoVerdict =
  | "open"
  | "in_time"
  | "over_budget"
  | "too_slow"
  | "outpaced"
  | "premature";

export type MoveCondition =
  | { readonly moveUci: string }
  | {
      readonly piece: { readonly color: Color; readonly role: Role };
      readonly to?: SquareName;
    };

export type WindowOpening =
  | { readonly fromStart: true }
  | { readonly onMove: readonly MoveCondition[] }
  | { readonly onTrigger: SimpleTrigger };

export type WindowClosing =
  | { readonly kind: "arrival"; readonly move: MoveCondition }
  | { readonly kind: "release"; readonly move: MoveCondition }
  | { readonly kind: "position"; readonly feature: StructuralExpression }
  | { readonly kind: "deadline"; readonly afterLearnerMoves: number };

export interface TimingWindowDefinition {
  readonly id: string;
  readonly label?: string;
  readonly opens: WindowOpening;
  readonly closes: readonly WindowClosing[];
  readonly readiness: {
    readonly mode: "all" | "any";
    readonly of: readonly MoveCondition[];
  };
  readonly tolerated?: readonly MoveCondition[];
  readonly luxuryMoveBudget: number;
  /** Authored contexts opt in; absence is deliberately ungraded. */
  readonly gradeOutpaced?: boolean;
  readonly note?: string;
}

export type WindowTrigger = {
  readonly atWindow:
    | { readonly windowId: string; readonly verdict: TempoVerdict }
    | { readonly windowId: string; readonly spendAtLeast: number };
};

export type CheckpointTrigger = SimpleTrigger | WindowTrigger;

export type CheckpointInteraction =
  | {
      readonly type: "intent_capture";
      readonly planClassIds: readonly string[];
    }
  | {
      readonly type: "prediction";
      readonly flipBoard?: boolean;
    }
  | {
      readonly type: "stated_reasoning";
      readonly keyPoints: readonly ReasoningKeyPoint[];
    };

export type ReasoningGround =
  | { readonly kind: "structural"; readonly expression: StructuralExpression }
  | { readonly kind: "shape_plan"; readonly shape: string; readonly plan: string }
  | { readonly kind: "spine_move"; readonly spineNodeId: string }
  | { readonly kind: "claim"; readonly claimId: string };

export interface ReasoningKeyPoint {
  readonly id: string;
  readonly label: string;
  readonly phrases: readonly string[];
  readonly ground: ReasoningGround;
}

export interface FeedbackClaim {
  readonly id: string;
  readonly text: string;
  readonly evidenceTypes: readonly string[];
}

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
  readonly timingWindows?: readonly TimingWindowDefinition[];
  readonly guard?: {
    readonly evalSwingCp?: number | null;
    readonly fireOnMate?: boolean;
    readonly rulesTier?: boolean;
    readonly window?: { readonly fromPly: number; readonly toPly: number };
    readonly overrides?: readonly {
      readonly at: DeviationLocation;
      readonly evalSwingCp?: number | null;
      readonly fireOnMate?: boolean;
    }[];
  };
  readonly variantOf?: {
    readonly packId: string;
    readonly relation:
      | { readonly kind: "root_after_move"; readonly moveUci: string }
      | { readonly kind: "same_root_other_side" }
      | { readonly kind: "same_root_other_objective" };
    readonly note?: string;
  };
  readonly concepts?: readonly string[];
  readonly shapes?: readonly ShapeReference[];
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
  readonly feedbackClaims?: readonly FeedbackClaim[];
  readonly [key: string]: unknown;
}

export type ShapeReference = string | { readonly shape: string; readonly relation: "present" | "prospective" };

export interface TrajectoryLeg {
  readonly id: string;
  readonly entryCheckpointId?: string;
  readonly branchLengthTarget?: number;
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
      readonly category: "win" | "loss" | "draw" | "cursed-win" | "blessed-loss";
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
      readonly fact: "checkmate" | "stalemate" | "draw";
      readonly winner?: "white" | "black";
    })
  | (SuccessConditionBase & {
      readonly kind: "structural_feature";
      readonly feature: StructuralExpression;
    })
  | (SuccessConditionBase & {
      readonly kind: "timing_window";
      readonly windowId: string;
      readonly verdict: TempoVerdict;
    })
  | (SuccessConditionBase & {
      readonly kind: "plan_consequence";
      readonly planClassId: string;
    });
import type { Color, FileName, Role, SquareName } from "chessops/types";

export const STRUCTURAL_FEATURE_KINDS = Object.freeze([
  "pawn_safe_square", "outpost", "backward_pawn", "isolated_pawn", "doubled_pawn",
  "passed_pawn", "open_file", "half_open_file", "line_blockers", "direct_attack_count",
  "piece_reach_count", "named_structure", "bishop_on_shade", "pawn_count",
  "king_opposition", "piece_count", "king_zone", "piece_distance",
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
  | { readonly kind: "king_opposition"; readonly color: Color; readonly form: "direct" | "distant" }
  | { readonly kind: "piece_count"; readonly color: Color; readonly role: Role; readonly basis: "count" | "difference"; readonly comparison: "atLeast" | "atMost" | "equal"; readonly count: number }
  | { readonly kind: "king_zone"; readonly color: Color; readonly zone: "edge" | "corner" }
  | { readonly kind: "piece_distance"; readonly color: Color; readonly role: "king" | "knight" | "bishop" | "rook" | "queen"; readonly target: { readonly kind: "square"; readonly square: SquareName } | { readonly kind: "piece"; readonly color: Color; readonly role: Role }; readonly comparison: "atLeast" | "atMost" | "equal"; readonly count: number };

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
