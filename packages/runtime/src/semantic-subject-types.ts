// Closed thirteen-family ABI: rfc/subject-safe-semantic-selection §§4–5.
// This module contains vocabulary/types only; it must not import a collector or source owner.
import type { Color, FileName, Role, SquareName } from "chessops/types";
import type { PhysicalSliderRay, SliderIdentity } from "./foundation-slider-sources.js";

export const SUBJECT_OUTCOME_FAMILIES = Object.freeze([
  "backward_pawn", "doubled_pawn", "half_open_file", "isolated_pawn", "king_opposition",
  "king_zone", "line_blockers", "open_file", "passed_pawn", "piece_count", "direct_attack_count",
  "loose_piece", "pawn_islands",
] as const);
export type SubjectOutcomeFamily = (typeof SUBJECT_OUTCOME_FAMILIES)[number];
export const BOOLEAN_SUBJECT_RELATIONS = Object.freeze(["false_to_true", "true_to_false", "true_to_true", "false_to_false"] as const);
export const INTEGER_SUBJECT_RELATIONS = Object.freeze(["increase", "decrease", "equal"] as const);
export type BooleanSubjectRelation = (typeof BOOLEAN_SUBJECT_RELATIONS)[number];
export type IntegerSubjectRelation = (typeof INTEGER_SUBJECT_RELATIONS)[number];
export type SubjectDirection = Readonly<{ df: -1 | 0 | 1; dr: -1 | 0 | 1 }>;
export type OppositionForm = "direct" | "distant_three" | "distant_five";

export interface SubjectByFamily {
  backward_pawn: { readonly kind: "backward_pawn"; readonly color: Color; readonly rootSquare: SquareName };
  doubled_pawn: { readonly kind: "doubled_pawn"; readonly color: Color; readonly file: FileName };
  half_open_file: { readonly kind: "half_open_file"; readonly color: Color; readonly file: FileName };
  isolated_pawn: { readonly kind: "isolated_pawn"; readonly color: Color; readonly file: FileName };
  king_opposition: { readonly kind: "king_opposition"; readonly whiteRootSquare: SquareName; readonly blackRootSquare: SquareName };
  king_zone: { readonly kind: "king_zone"; readonly color: Color; readonly rootSquare: SquareName };
  line_blockers: { readonly kind: "line_blockers"; readonly root: SliderIdentity; readonly direction: SubjectDirection };
  open_file: { readonly kind: "open_file"; readonly file: FileName };
  passed_pawn: { readonly kind: "passed_pawn"; readonly color: Color; readonly rootSquare: SquareName };
  piece_count: { readonly kind: "piece_count"; readonly color: Color; readonly role: Role };
  direct_attack_count: { readonly kind: "direct_attack_count"; readonly color: Color; readonly square: SquareName };
  loose_piece: { readonly kind: "loose_piece"; readonly root: SliderIdentity };
  pawn_islands: { readonly kind: "pawn_islands"; readonly color: Color };
}

type BooleanState = Readonly<{ kind: "present"; value: boolean }>;
type IntegerState = Readonly<{ kind: "present"; value: number }>;
type RemovedState = Readonly<{ kind: "removed"; at: SquareName }>;
type PawnState = BooleanState | RemovedState | Readonly<{ kind: "promoted"; current: SliderIdentity }>;
export interface StateByFamily {
  backward_pawn: PawnState;
  doubled_pawn: BooleanState;
  half_open_file: BooleanState;
  isolated_pawn: BooleanState;
  king_opposition: BooleanState;
  king_zone: BooleanState;
  line_blockers: (IntegerState & { readonly ray: PhysicalSliderRay }) | RemovedState
    | Readonly<{ kind: "inapplicable"; reason: "role" | "border"; current: SliderIdentity }>;
  open_file: BooleanState;
  passed_pawn: PawnState;
  piece_count: IntegerState;
  direct_attack_count: IntegerState;
  loose_piece: BooleanState & { readonly current: SliderIdentity };
  pawn_islands: IntegerState;
}
type NoParameters = Readonly<Record<string, never>>;
export type ParametersByFamily = {
  readonly [F in SubjectOutcomeFamily]: F extends "king_opposition"
    ? Readonly<{ holder: Color; form: OppositionForm }>
    : F extends "king_zone" ? Readonly<{ zone: "edge" | "corner" }> : NoParameters;
};
export type RelationByFamily = {
  readonly [F in SubjectOutcomeFamily]: F extends "piece_count" | "direct_attack_count" | "pawn_islands" | "line_blockers"
    ? IntegerSubjectRelation : BooleanSubjectRelation;
};
export interface SubjectOutcomePayload<F extends SubjectOutcomeFamily> {
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly family: F;
  readonly actor: Color;
  readonly subject: SubjectByFamily[F];
  readonly parameters: ParametersByFamily[F];
  readonly root: StateByFamily[F];
  readonly played: StateByFamily[F];
  readonly alternativeRelation: RelationByFamily[F];
  readonly alternatives: readonly {
    readonly moveUci: string;
    readonly state: StateByFamily[F];
    readonly relation: RelationByFamily[F] | "not_comparable";
  }[];
  readonly supportingMoves: readonly string[];
  readonly legalAlternatives: number;
  readonly alternativesWithOutcome: number;
}
export type AnySubjectOutcomePayload = { [F in SubjectOutcomeFamily]: SubjectOutcomePayload<F> }[SubjectOutcomeFamily];

/** Complete source-owned decision-local states, including uniform and played-matching outcomes.
 * Internal worker reduction input; never a claim that a differing-relation event was emitted. */
export interface SubjectOutcomePopulation<F extends SubjectOutcomeFamily> {
  readonly family: F;
  readonly beforeFen: string;
  readonly moveUci: string;
  readonly afterFen: string;
  readonly actor: Color;
  readonly subjects: readonly {
    readonly subject: SubjectByFamily[F];
    readonly parameters: ParametersByFamily[F];
    readonly root: StateByFamily[F];
    readonly played: StateByFamily[F];
    readonly playedRelation: RelationByFamily[F] | "not_comparable";
    readonly alternatives: readonly {
      readonly moveUci: string;
      readonly state: StateByFamily[F];
      readonly relation: RelationByFamily[F] | "not_comparable";
    }[];
  }[];
}
export type SubjectOutcomePopulationResult<F extends SubjectOutcomeFamily> =
  | { readonly kind: "available"; readonly population: SubjectOutcomePopulation<F> }
  | { readonly kind: "unavailable"; readonly family: F; readonly reason: "counterfactual_population_incomplete" };
