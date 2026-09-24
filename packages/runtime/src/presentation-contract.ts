// rfc/evidence-presentation.md Checkpoint A: the closed component vocabulary between a typed fact
// and a pixel, the exact projection-keyed adapter registry, the two process-local seals and the
// closed `presentation.receipt@1` wire.
//
//   F1 ConsumerEvidenceView
//     → exact consumer × projection adapter over the validated retained payload
//     → process-local PresentedEvidenceItem seal + admitted-owner identity
//     → closed presentation.receipt@1 body + canonical digest
//     → exact parser + NEW client-local PresentedEvidenceItem seal
//     → component renderer + equivalent sentence from that same sealed component
//
// A component never selects, never queries a board or manifest, never grades and never accepts
// caller prose. Every sentence is recomputed from the sealed operand by a registered renderer, and
// every rendered text passes the PRESENTATION_RAW_ID guard (§6e). Law 8: numbers travel with their
// derived convention (§5); no component colours or ranks a move by quality.

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import type { Color, Role, SquareName } from "chessops/types";

import { renderEndgameClassification, type EndgameClassification } from "./endgame.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import {
  assertConsumerEvidenceView,
  assertDeclaredEvidence,
  evidenceDigest,
  evidenceValueReceipt,
  type AnswerDistance,
  type ConsumerEvidenceView,
  type DeclaredEvidence,
  type EvidenceForm,
  type EvidenceGrounding,
  type VersionedEvidenceId,
} from "./evidence-contract.js";
import { assertMoveQualityGradeSentence, renderMoveQualityGrade, type MoveQualityGrade } from "./grade.js";
import { renderPivotalMarker, type PivotalMarker } from "./pivotal.js";
import type { ReviewEnginePoint, ReviewEvalDelta, ReviewMateTransition, ReviewScoreReceipt, ReviewSearchBound, ReviewWdlPoint, StockfishPositionEvaluation } from "./review-points.js";
import { renderShapeFiring, type ShapeFiring } from "./shape-firing.js";
import { CONSUMER_FACT_RENDERERS, CONSUMER_MAGNITUDE_QUANTITIES, STRUCTURED_DOCUMENT_SCHEMAS, consumerAdapterSpecs } from "./presentation-consumer-adapters.js";
import { INSPECTOR_FACT_RENDERERS, INSPECTOR_MAGNITUDE_QUANTITIES, inspectorAdapterSpecs } from "./presentation-inspector-adapters.js";
import { PLAY_FACT_RENDERERS, PLAY_MAGNITUDE_QUANTITIES, playAdapterSpecs } from "./presentation-play-adapters.js";
import { PresentationSchemaError, ROLE_NAMES, SIDE_NAMES, listPhrase, type FactOperandsOf, type FactRendererDefinition } from "./presentation-schema.js";
import { MARK_BRUSHES, type MarkBrush, type ObjectiveState, type RunOutcome } from "./types.js";

/** A closed JSON value (no `undefined`, functions or non-finite numbers). */
export type PresentationJsonValue = string | number | boolean | null | readonly PresentationJsonValue[] | { readonly [key: string]: PresentationJsonValue };

// ---------------------------------------------------------------------------------------------
// §3 — the fourteen components and their eight declared fields
// ---------------------------------------------------------------------------------------------

export const COMPONENT_IDS = Object.freeze([
  "distribution", "outcome_split", "magnitude", "magnitude_trail", "square_set",
  "move_path", "relation_overlay", "count_with_denominator", "citation", "enum_state",
  "claim", "fact_statement", "abstention", "structured_document",
] as const);
export type ComponentId = (typeof COMPONENT_IDS)[number];

export type ComponentEmptyBehavior = "silent" | "stated_absence" | "unavailable_source";

/** The theme tokens a component may consume (`rfc/theming.md` THEME_TOKENS); never a colour value. */
export type PresentationThemeToken =
  | "paper" | "panel" | "surface" | "ink" | "muted" | "line" | "accent" | "on-accent" | "accent-soft" | "warning" | "danger";

export interface ComponentDeclaration {
  readonly id: ComponentId;
  readonly renders: string;
  readonly operand: string;
  readonly convention: "required" | "not_applicable";
  readonly emptyBehavior: ComponentEmptyBehavior;
  readonly forms: readonly Exclude<EvidenceForm, "machine_condition">[];
  readonly equivalentSentence: string;
  readonly tokens: readonly PresentationThemeToken[];
  /**
   * Whether this landing ships the runtime operand parser, the equivalent-sentence renderer and the
   * client component. Every member is `implemented` since the Checkpoint-B landing (2026-09-24).
   */
  readonly implementation: "implemented";
}

const declaration = (value: ComponentDeclaration): ComponentDeclaration => Object.freeze({ ...value, forms: Object.freeze([...value.forms]), tokens: Object.freeze([...value.tokens]) });

/** Exactly the fourteen §3 ids, frozen; every member declares all eight fields (criterion 1). */
export const COMPONENT_DECLARATIONS: Readonly<Record<ComponentId, ComponentDeclaration>> = Object.freeze({
  distribution: declaration({ id: "distribution", renders: "Ranked candidate moves with their share of a stated population or model output.", operand: "DistributionOperand", convention: "required", emptyBehavior: "unavailable_source", forms: ["list", "panel", "sentence"], equivalentSentence: "renderDistributionSentence", tokens: ["ink", "muted", "line", "accent"], implementation: "implemented" }),
  outcome_split: declaration({ id: "outcome_split", renders: "The three-way result share of a set of games from a stated perspective.", operand: "OutcomeSplitOperand", convention: "required", emptyBehavior: "unavailable_source", forms: ["list", "panel", "sentence"], equivalentSentence: "renderOutcomeSplitSentence", tokens: ["accent", "muted", "line", "ink"], implementation: "implemented" }),
  magnitude: declaration({ id: "magnitude", renders: "One measured number with its unit, perspective and bound.", operand: "MagnitudeOperand", convention: "required", emptyBehavior: "stated_absence", forms: ["list", "panel", "sentence", "timeline_marker"], equivalentSentence: "renderMagnitudeSentence", tokens: ["ink", "muted"], implementation: "implemented" }),
  magnitude_trail: declaration({ id: "magnitude_trail", renders: "How one measured quantity moved across a branch.", operand: "MagnitudeTrailOperand", convention: "required", emptyBehavior: "stated_absence", forms: ["list", "panel", "timeline_marker"], equivalentSentence: "renderMagnitudeTrailSentence", tokens: ["ink", "muted", "line", "accent"], implementation: "implemented" }),
  square_set: declaration({ id: "square_set", renders: "Board squares belonging to exactly one admitted fact, with that fact's caption.", operand: "SquareSetOperand", convention: "not_applicable", emptyBehavior: "stated_absence", forms: ["list", "panel", "lit_squares", "piece_halo"], equivalentSentence: "renderSquareSetSentence", tokens: ["accent", "accent-soft", "ink"], implementation: "implemented" }),
  move_path: declaration({ id: "move_path", renders: "An ordered sequence of plies.", operand: "MovePathOperand", convention: "required", emptyBehavior: "stated_absence", forms: ["list", "panel", "arrows", "sentence"], equivalentSentence: "renderMovePathSentence", tokens: ["ink", "accent", "line"], implementation: "implemented" }),
  relation_overlay: declaration({ id: "relation_overlay", renders: "One admitted directed board relation and only the edges that fact retains.", operand: "RelationOverlayOperand", convention: "not_applicable", emptyBehavior: "stated_absence", forms: ["panel", "arrows", "lit_squares", "piece_halo", "sentence"], equivalentSentence: "renderRelationOverlaySentence", tokens: ["accent", "accent-soft", "line", "ink"], implementation: "implemented" }),
  count_with_denominator: declaration({ id: "count_with_denominator", renders: "A numerator against the base it was drawn from.", operand: "CountWithDenominatorOperand", convention: "required", emptyBehavior: "unavailable_source", forms: ["list", "sentence", "panel"], equivalentSentence: "renderCountSentence", tokens: ["ink", "muted", "accent"], implementation: "implemented" }),
  citation: declaration({ id: "citation", renders: "One cited passage or authored source with everything the licence requires.", operand: "CitationOperand", convention: "not_applicable", emptyBehavior: "unavailable_source", forms: ["list", "panel", "sentence"], equivalentSentence: "renderCitationSentence", tokens: ["ink", "muted", "line"], implementation: "implemented" }),
  enum_state: declaration({ id: "enum_state", renders: "One member of a closed set, as a human label.", operand: "EnumStateOperand", convention: "not_applicable", emptyBehavior: "stated_absence", forms: ["list", "sentence", "panel", "timeline_marker"], equivalentSentence: "renderEnumStateSentence", tokens: ["ink", "muted", "accent", "warning", "danger"], implementation: "implemented" }),
  claim: declaration({ id: "claim", renders: "An authored judgement with its ground attached.", operand: "ClaimOperand", convention: "required", emptyBehavior: "silent", forms: ["list", "panel", "sentence", "audio"], equivalentSentence: "renderClaimSentence", tokens: ["ink", "muted"], implementation: "implemented" }),
  fact_statement: declaration({ id: "fact_statement", renders: "A registered deterministic sentence whose meaning is present in one exact admitted projection.", operand: "FactStatementOperand", convention: "required", emptyBehavior: "stated_absence", forms: ["list", "sentence", "panel", "timeline_marker", "audio"], equivalentSentence: "renderFactStatementSentence", tokens: ["ink", "muted"], implementation: "implemented" }),
  abstention: declaration({ id: "abstention", renders: "The fact that there is nothing to render, and why.", operand: "AbstentionOperand", convention: "not_applicable", emptyBehavior: "stated_absence", forms: ["list", "sentence", "panel", "timeline_marker", "lit_squares", "arrows", "piece_halo", "audio"], equivalentSentence: "renderAbstentionSentence", tokens: ["muted", "line"], implementation: "implemented" }),
  structured_document: declaration({ id: "structured_document", renders: "A validated schema-typed object as a read-only labelled viewer.", operand: "StructuredDocumentOperand", convention: "not_applicable", emptyBehavior: "unavailable_source", forms: ["list", "panel"], equivalentSentence: "renderStructuredDocumentSentence", tokens: ["ink", "muted", "line", "panel"], implementation: "implemented" }),
});

// ---------------------------------------------------------------------------------------------
// §6 — the label layer (total by type) and the raw-id guard
// ---------------------------------------------------------------------------------------------

export interface LabelEntry {
  readonly label: string;
  readonly gloss?: string;
  readonly valence?: "neutral" | "positive" | "caution" | "adverse";
}
export type LabelVocabulary<T extends string> = Readonly<Record<T, LabelEntry>>;

export const OBJECTIVE_STATE_LABELS: LabelVocabulary<ObjectiveState> = Object.freeze({
  active: { label: "in progress", valence: "neutral" },
  preserved: { label: "preserved", valence: "positive" },
  degraded: { label: "degraded", valence: "caution" },
  failed: { label: "failed", valence: "adverse" },
  achieved: { label: "achieved", valence: "positive" },
  transitioned: { label: "transitioned", valence: "neutral" },
});
export const RUN_OUTCOME_LABELS: LabelVocabulary<RunOutcome> = Object.freeze({
  win: { label: "win", valence: "neutral" },
  loss: { label: "loss", valence: "neutral" },
  draw: { label: "draw", valence: "neutral" },
});
export type PgnResultToken = "1-0" | "0-1" | "1/2-1/2";
export const PGN_RESULT_LABELS: LabelVocabulary<PgnResultToken> = Object.freeze({
  "1-0": { label: "1-0" }, "0-1": { label: "0-1" }, "1/2-1/2": { label: "1/2-1/2" },
});
export type ReviewSide = "white" | "black";
export const SIDE_LABELS: LabelVocabulary<ReviewSide> = Object.freeze({ white: { label: "White" }, black: { label: "Black" } });

/** The learner-facing label of each declared grounding class (story and review footers). */
export const GROUNDING_LABELS: LabelVocabulary<EvidenceGrounding> = Object.freeze({
  position_rules: { label: "Board rules" },
  declared_convention: { label: "Tabiya convention" },
  bounded_search: { label: "Recorded engine analysis" },
  tablebase_exact: { label: "Exact tablebase" },
  human_model: { label: "Human-move model" },
  human_corpus: { label: "Human game corpus" },
  cited_theory: { label: "Cited chess theory" },
  authored_claim: { label: "Authored catalogue" },
  recorded_run: { label: "Recorded game" },
});

/** The drill-pack claim evidence-type vocabulary (`schemas/drill_pack.schema.json`), total. */
export type ClaimEvidenceType = "author_principle" | "engine_validated" | "tablebase_exact" | "corpus_observed" | "human_model_predicted" | "derived_feature" | "hypothesis" | "provenance_note";
export const CLAIM_EVIDENCE_TYPE_LABELS: LabelVocabulary<ClaimEvidenceType> = Object.freeze({
  author_principle: { label: "author principle" },
  engine_validated: { label: "engine check" },
  tablebase_exact: { label: "exact tablebase" },
  corpus_observed: { label: "game-corpus observation" },
  human_model_predicted: { label: "human-move model" },
  derived_feature: { label: "board-feature reading" },
  hypothesis: { label: "hypothesis" },
  provenance_note: { label: "provenance note" },
});

/** The closed vocabularies an `enum_state` component may carry (§3.9); coupled by type. */
export interface LabelVocabularyMembers {
  readonly objective_state: ObjectiveState;
  readonly run_outcome: RunOutcome;
}
export const LABEL_VOCABULARIES: { readonly [K in keyof LabelVocabularyMembers]: LabelVocabulary<LabelVocabularyMembers[K]> } = Object.freeze({
  objective_state: OBJECTIVE_STATE_LABELS,
  run_outcome: RUN_OUTCOME_LABELS,
});

export class PresentationError extends TypeError {
  readonly code: "PRESENTATION_RAW_ID" | "PRESENTATION_UNSEALED" | "PRESENTATION_INVALID" | "PRESENTATION_UNREGISTERED";
  constructor(code: PresentationError["code"], message: string) {
    super(`${code}: ${message}`);
    this.name = "PresentationError";
    this.code = code;
  }
}

const RAW_ID_TOKEN = /(?:^|[\s(“"'])([a-z][a-z0-9]*(?:_[a-z0-9]+)+|[a-z][a-z0-9_.]*@\d+|[0-9a-f]{16,}|sha256:[0-9a-f]+)(?=$|[\s).,;:”"'])/u;

/** §6e runtime arm: every component text boundary refuses id- and digest-shaped tokens. */
export function assertPresentationText(text: string): string {
  if (typeof text !== "string" || text.trim() === "") throw new PresentationError("PRESENTATION_INVALID", "presented text must be a non-empty string");
  const match = RAW_ID_TOKEN.exec(text);
  if (match !== null) throw new PresentationError("PRESENTATION_RAW_ID", `presented text carries the raw identifier ${match[1]}`);
  return text;
}

// ---------------------------------------------------------------------------------------------
// §5 — ConventionReceipt: derived provenance, never caller prose
// ---------------------------------------------------------------------------------------------

export interface StockfishExecutionReceiptRef {
  readonly operation: "stockfish.position_evaluation@1";
  readonly engine: { readonly name: string; readonly version: string };
  readonly bound: ReviewSearchBound;
  readonly generation: number | null;
  readonly normalizedRequestDigest: string;
  readonly responseDigest: string;
}

/** Registered declared conventions; the label is the only rendered name (§5d). */
export const PRESENTATION_CONVENTIONS = Object.freeze({
  "recorded-run@1": { label: "the recorded game" },
  "story-compatibility@1": { label: "Tabiya's story convention" },
  "story-last-level@1": { label: "Tabiya's recorded-evaluation convention" },
  "review-mate-transition@1": { label: "Tabiya's typed mate-transition convention" },
  "review-wdl-white@1": { label: "Tabiya's White-normalized WDL convention" },
  "grade-convention@1": { label: "Tabiya's grade convention" },
  "recorded-semantic-path@1": { label: "Tabiya's recorded-path detectors" },
  "authored-claim@1": { label: "the pack author's claim" },
  // Checkpoint B: the declared conventions module facts render under (learner vocabulary, §6a).
  "board-rules@1": { label: "the rules of chess" },
  "pawn-structure@1": { label: "the declared pawn-structure convention" },
  "piece-geometry@1": { label: "the declared piece-geometry convention" },
  "threat-convention@1": { label: "the declared one-move threat convention" },
  "phase-bands@1": { label: "the declared game-phase convention" },
  "endgame-convention@1": { label: "the declared endgame convention" },
  "structure-catalogue@1": { label: "the declared structure catalogue" },
  "shape-catalogue@1": { label: "the cited shape catalogue" },
  "opening-catalogue@1": { label: "the cited opening catalogue" },
  "recorded-comparison@1": { label: "the recorded attempts" },
  "recorded-engine@1": { label: "a stored engine reading" },
} as const);
export type PresentationConventionId = keyof typeof PRESENTATION_CONVENTIONS;

/** The exact population a corpus count was drawn from (`CorpusPopulation`, retained whole). */
export interface PopulationDescriptor {
  readonly source: "lichess-explorer";
  readonly ratings: readonly number[];
  readonly speeds: readonly string[];
  readonly since: string;
  readonly until: string;
}

/**
 * §5a. Inline correction (2026-09-24, pin encoding): the shipped human-model and corpus pages carry
 * their model identity/band and their population, not a provider execution receipt, so those arms
 * retain exactly what the page retains; `recorded_search` is the legacy recorded engine reading that
 * predates exact provider receipts (its engine identity is retained when the reading carries one).
 */
export type ConventionBasis =
  | { readonly kind: "search"; readonly execution: StockfishExecutionReceiptRef }
  | { readonly kind: "recorded_search"; readonly engine: { readonly name: string; readonly version: string } | null; readonly depth: number | null }
  | { readonly kind: "tablebase_exact"; readonly source: "syzygy" }
  | { readonly kind: "human_model"; readonly model: { readonly name: string; readonly version: string }; readonly band: number | null }
  | { readonly kind: "human_population"; readonly population: PopulationDescriptor; readonly sampleSize: number }
  | { readonly kind: "declared"; readonly convention: PresentationConventionId };

export interface ConventionReceipt {
  readonly producer: VersionedEvidenceId;
  readonly sourceProjection: VersionedEvidenceId;
  readonly sourceEvidenceDigest: string;
  readonly perspective: "white" | "black" | "side_to_move" | "learner" | "not_applicable";
  readonly basis: ConventionBasis;
}

// ---------------------------------------------------------------------------------------------
// Operand types (all fourteen; runtime parsers exist for the Checkpoint-A `implemented` members)
// ---------------------------------------------------------------------------------------------

export type MagnitudeUnit =
  | { readonly kind: "centipawn" } | { readonly kind: "mate_in" } | { readonly kind: "percent" } | { readonly kind: "count" }
  | { readonly kind: "elo" } | { readonly kind: "clock_ms" } | { readonly kind: "distance_to_zero" };
export interface MagnitudeOperand {
  /** Centipawns for `centipawn`; the signed mate distance (+ White mates, − Black mates) for `mate_in`. */
  readonly value: number;
  readonly unit: MagnitudeUnit;
  readonly convention: ConventionReceipt;
  readonly saturated: boolean;
}
/** §3.1 per-row withholding: the row stays visible, its share is not drawn. */
export type DistributionWithheldReason = "below_outcome_floor";
export const DISTRIBUTION_RESIDUAL_LABELS = Object.freeze({
  other_moves: { label: "other moves" },
  unlisted_mass: { label: "moves the model left unlisted" },
} as const);
export type DistributionResidualLabelId = keyof typeof DISTRIBUTION_RESIDUAL_LABELS;
export interface DistributionOperand {
  readonly rows: readonly {
    readonly move: { readonly san: string; readonly uci: string };
    /** 0..1, never pre-formatted; for a corpus basis it is recomputed from `count / sampleSize`. */
    readonly share: number;
    readonly count?: number;
    readonly withheld?: DistributionWithheldReason;
  }[];
  readonly residual: { readonly share: number; readonly label: DistributionResidualLabelId } | null;
  readonly convention: ConventionReceipt;
  readonly highlight: { readonly uci: string; readonly why: "learner_committed" | "position_in_view" } | null;
}
export interface OutcomeSplitOperand {
  readonly white: number; readonly draws: number; readonly black: number; readonly total: number;
  readonly perspective: "white" | "black" | "side_to_move";
  readonly convention: ConventionReceipt;
  readonly floor: { readonly threshold: number; readonly met: boolean };
}

/**
 * §3.4 `MAGNITUDE_SCALE_POLICIES`: the registered, fixed measurement domain of every trail. The
 * component derives pixels from the policy; no caller supplies a range ([[D1671]]).
 */
export const MAGNITUDE_SCALE_POLICIES = Object.freeze({
  "centipawn-clamp-800@1": { unit: "centipawn", extent: 800, zero: "centered", saturation: "clamp_to_extent", label: "±8 pawns, clamped" },
  "mate-distance-10@1": { unit: "mate_in", extent: 10, zero: "centered", saturation: "clamp_to_extent", label: "mate within 10 moves, clamped" },
} as const);
export type MagnitudeScalePolicyId = keyof typeof MAGNITUDE_SCALE_POLICIES;
export interface MagnitudeTrailOperand {
  readonly points: readonly { readonly plyOffset: number; readonly magnitude: MagnitudeOperand }[];
  /** Asserted equal (canonical bytes) to every point's own convention. */
  readonly convention: ConventionReceipt;
  readonly scalePolicy: MagnitudeScalePolicyId;
}

/**
 * §3.5. Inline correction (2026-09-24): the caption "rendered from the sealed component by the
 * projection adapter's registered sentence renderer" needs the renderer's identity and operands to
 * travel inside the operand, so `caption` is a sealed `fact_statement` operand recomputed on parse.
 */
export interface SquareSetOperand {
  readonly squares: readonly SquareName[];
  readonly brush: MarkBrush;
  readonly owner: { readonly factRef: string };
  readonly ordered: false;
  readonly caption: FactStatementOperand;
}
export interface MovePathOperand {
  readonly plies: readonly { readonly ply: number; readonly san: string; readonly uci: string }[];
  readonly convention?: ConventionReceipt;
  readonly answerDistance: AnswerDistance;
  readonly origin: "recorded" | "authored" | "learner_played";
}

export const BOARD_RELATION_KINDS = Object.freeze(["controls", "attacks", "defends", "screens", "pins", "skewers", "threatens", "moves_to", "opens_ray", "closes_ray"] as const);
export type BoardRelationKind = (typeof BOARD_RELATION_KINDS)[number];
export interface RelationOverlayOperand {
  readonly nodes: readonly {
    readonly square: SquareName;
    readonly role?: Role;
    readonly color?: Color;
    readonly emphasis: "source" | "target" | "screen" | "context";
  }[];
  readonly edges: readonly {
    readonly from: SquareName;
    readonly to: SquareName;
    readonly relation: BoardRelationKind;
    readonly sign: "state" | "gained" | "lost";
  }[];
  readonly owner: { readonly factRef: string };
  readonly answerDistance: AnswerDistance;
  /** Declared-convention relations carry their convention inside the operand (§3.6a). */
  readonly convention?: ConventionReceipt;
}

/** §3.7: the denominator meaning IS the convention; a registered label keyed by the exact adapter. */
export const DENOMINATOR_MEANINGS = Object.freeze({
  games_in_population: { label: "games in this population" },
  legal_replies: { label: "legal replies" },
  legal_moves: { label: "legal moves" },
  attackers: { label: "attacking pieces" },
} as const);
export type DenominatorMeaningId = keyof typeof DENOMINATOR_MEANINGS;
export interface CountWithDenominatorOperand {
  readonly numerator: number;
  readonly denominator: number;
  readonly denominatorMeaning: DenominatorMeaningId;
  readonly floor?: { readonly threshold: number; readonly met: boolean };
}

/**
 * §3.12 `STRUCTURED_DOCUMENT_SCHEMAS` (owned beside the author/operator adapters that construct
 * them): literal schema ids, each with its role ceiling and a closed field list.
 */
export { STRUCTURED_DOCUMENT_SCHEMAS };
export type StructuredDocumentSchemaId = keyof typeof STRUCTURED_DOCUMENT_SCHEMAS;
export interface StructuredDocumentOperand {
  readonly schemaId: StructuredDocumentSchemaId;
  readonly document: Readonly<Record<string, PresentationJsonValue>>;
  readonly canonicalBytes: string;
  readonly digest: string;
}

/** `EvidenceFieldBinding`: the admitted projection, retained text field and the exact value digests. */
export interface EvidenceFieldBinding {
  readonly projection: VersionedEvidenceId;
  readonly field: string;
  /** Digest of the sealed evidence payload the text was read from. */
  readonly evidenceDigest: string;
  /** Digest of the exact retained text value ([[D3102]]): mutating the text alone fails parse. */
  readonly valueDigest: string;
}
export interface CitationOperand {
  readonly content: { readonly kind: "quoted_passage" | "authored_summary"; readonly text: string; readonly binding: EvidenceFieldBinding };
  readonly source: { readonly source: VersionedEvidenceId; readonly title: string; readonly locator: string; readonly licence: string; readonly revision: string; readonly url?: string };
}
export type EnumStateOperand = {
  [K in keyof LabelVocabularyMembers]: Readonly<{ vocabulary: K; value: LabelVocabularyMembers[K] }>
}[keyof LabelVocabularyMembers];
/** The shipped claim binding vocabulary (`authored-feedback.ts`); the RFC draft spelled `author_declared`. */
export type ClaimBinding = "ledger_bound" | "author_attributed" | "self_declared";
export interface ClaimOperand {
  readonly text: string;
  readonly binding: ClaimBinding;
  readonly evidenceTypes: readonly ClaimEvidenceType[];
  readonly earnedEvidenceTypes: readonly ClaimEvidenceType[];
  readonly principles: readonly { readonly name: string; readonly statement: string; readonly counterCase: string }[];
}

// Fact-statement renderers (§3.10a): literal ids, typed operands, one deterministic template each.
interface BaseFactOperands {
  readonly "story.pivotal_marker@1": PivotalMarker;
  readonly "story.shape_firing@1": Pick<ShapeFiring, "entryId">;
  readonly "story.endgame_classification@1": EndgameClassification;
  readonly "story.consequence@1": { readonly terminal: true; readonly outcome: RunOutcome } | { readonly terminal: false; readonly plies: number; readonly objectiveState: ObjectiveState };
  readonly "story.imported_result@1": { readonly result: PgnResultToken };
  readonly "story.last_level@1": { readonly learnerCentipawns: number };
  readonly "story.title@1": { readonly title: string };
  readonly "review.mate_transition@1": { readonly changes: readonly ReviewMateTransition["changes"][number][]; readonly before: ReviewScoreReceipt; readonly after: ReviewScoreReceipt; readonly engine: { readonly name: string; readonly version: string }; readonly bound: ReviewSearchBound };
  readonly "review.wdl_point@1": { readonly win: number; readonly draw: number; readonly loss: number; readonly engine: { readonly name: string; readonly version: string }; readonly bound: ReviewSearchBound };
  readonly "module.move_quality_grade@1": MoveQualityGrade;
  readonly "module.recorded_relation@1": { readonly relation: RecordedRelationLabelId; readonly grounding: EvidenceGrounding };
}
/** The closed renderer registry: the Checkpoint-A renderers plus every group's registered renderers. */
export type FactOperandsByRenderer = BaseFactOperands
  & FactOperandsOf<typeof PLAY_FACT_RENDERERS>
  & FactOperandsOf<typeof INSPECTOR_FACT_RENDERERS>
  & FactOperandsOf<typeof CONSUMER_FACT_RENDERERS>;
export type FactStatementRendererId = keyof FactOperandsByRenderer;
export type FactStatementOperand = {
  [R in FactStatementRendererId]: Readonly<{
    rendererId: R;
    binding: "recorded_run" | "declared_convention";
    convention: PresentationConventionId;
    operands: FactOperandsByRenderer[R];
    sourceDigest: string;
    renderedText: string;
  }>
}[FactStatementRendererId];

// §3.11 abstention: a sealed lifecycle receipt owned by the operation that asked the question.
export interface PresentationDecisionStamp {
  readonly eventHeadSeq: number;
  readonly cursor: { readonly branchId: string; readonly nodeId: string };
  readonly disclosureBoundarySeq: number | null;
  readonly digest: string;
}
export const PRESENTATION_QUESTIONS = Object.freeze({
  "review.engine_eval": { label: "Engine evaluation" },
  "review.engine_wdl": { label: "Engine win/draw/loss expectation" },
  "review.tablebase": { label: "Tablebase result" },
  "review.semantic": { label: "Recorded-path relations" },
  "review.opening": { label: "Opening identity" },
  "review.human_model": { label: "Human-move model" },
  "review.human_corpus": { label: "Human game corpus" },
  "review.authored": { label: "Authored patterns" },
  "review.recorded": { label: "Recorded game facts" },
} as const);
export type PresentationQuestionId = keyof typeof PRESENTATION_QUESTIONS;

/** The closed source-reason vocabulary with one explicit learner disposition each; no default arm. */
export const PRESENTATION_SOURCE_REASONS = Object.freeze({
  provider_off: { absence: "unavailable", label: "its provider is not configured in this deployment" },
  provider_failed: { absence: "failed", label: "the provider did not return a usable result" },
  retry_exhausted: { absence: "failed", label: "the provider failed on every allowed attempt" },
  legacy_provenance_missing: { absence: "unavailable", label: "the stored reading predates exact provider receipts" },
  input_abstained: { absence: "unavailable", label: "an input it depends on is missing" },
  attempt_history_capacity: { absence: "failed", label: "the review service's attempt history is full until it restarts" },
  no_observation: { absence: "empty", label: "the source returned nothing here" },
  outside_domain: { absence: "empty", label: "this position is outside the source's domain" },
  // §4b's two named states: a value withheld below its declared floor, and an absent provider.
  floor_not_met: { absence: "withheld", label: "too few recorded games reach this position to show frequencies" },
  provider_unavailable: { absence: "unavailable", label: "its provider is not available right now" },
} as const);
export type PresentationSourceReason = keyof typeof PRESENTATION_SOURCE_REASONS;
export type PresentationAbsence = "withheld" | "unavailable" | "failed" | "empty";

export type AbstentionOperand =
  | Readonly<{ kind: "pending"; stage: "requested" | "not_yet_scheduled"; question: PresentationQuestionId; projection: VersionedEvidenceId; producer: VersionedEvidenceId; requestId: string; decision: PresentationDecisionStamp }>
  | Readonly<{ kind: "settled_abstention"; question: PresentationQuestionId; projection: VersionedEvidenceId; producer: VersionedEvidenceId; requestId: string; decision: PresentationDecisionStamp; absence: PresentationAbsence; reason: PresentationSourceReason; sourceReceipt: { readonly producer: VersionedEvidenceId; readonly projection: VersionedEvidenceId; readonly receiptDigest: string } }>;

export interface ComponentOperandMap {
  readonly distribution: DistributionOperand;
  readonly outcome_split: OutcomeSplitOperand;
  readonly magnitude: MagnitudeOperand;
  readonly magnitude_trail: MagnitudeTrailOperand;
  readonly square_set: SquareSetOperand;
  readonly move_path: MovePathOperand;
  readonly relation_overlay: RelationOverlayOperand;
  readonly count_with_denominator: CountWithDenominatorOperand;
  readonly citation: CitationOperand;
  readonly enum_state: EnumStateOperand;
  readonly claim: ClaimOperand;
  readonly fact_statement: FactStatementOperand;
  readonly abstention: AbstentionOperand;
  readonly structured_document: StructuredDocumentOperand;
}
export type ComponentValue = { [C in ComponentId]: Readonly<{ id: C; operand: ComponentOperandMap[C] }> }[ComponentId];

// ---------------------------------------------------------------------------------------------
// Recorded-relation labels: a literal registry, never a de-underscored projection id (§6d)
// ---------------------------------------------------------------------------------------------

export const RECORDED_RELATION_LABELS = Object.freeze({
  "derived.exchange.trade_completed": { label: "a completed trade" },
  "derived.pawn.sequence.contact_timing": { label: "pawn-contact timing" },
  "derived.pawn.sequence.harassment_pressure": { label: "pawn harassment pressure" },
  "derived.tactic.sequence.defender_consequence": { label: "a defender consequence" },
  "derived.tactic.square_clearance_observed": { label: "an observed square clearance" },
  "derived.tactic.line_blocker_clearance_observed": { label: "an observed line-blocker clearance" },
  "derived.tactic.deflection_observed": { label: "an observed deflection" },
  "derived.tactic.attraction_observed": { label: "an observed attraction" },
  "derived.tactic.interference_observed": { label: "an observed interference" },
  "derived.tactic.check_zwischenzug_observed": { label: "an observed intermediate check" },
  "derived.tactic.overload_exploitation_observed": { label: "an observed overload exploitation" },
} as const);
export type RecordedRelationLabelId = keyof typeof RECORDED_RELATION_LABELS;

// ---------------------------------------------------------------------------------------------
// Formatting shared by every renderer (server and client run the same code)
// ---------------------------------------------------------------------------------------------

function pawns(centipawns: number): string {
  if (!Number.isSafeInteger(centipawns)) throw new PresentationError("PRESENTATION_INVALID", "centipawns must be a safe integer");
  return `${centipawns >= 0 ? "+" : "−"}${(Math.abs(centipawns) / 100).toFixed(2)}`;
}

export function presentScore(score: ReviewScoreReceipt): string {
  return score.kind === "centipawns" ? pawns(score.value) : `mate in ${score.distance} for ${SIDE_LABELS[score.side].label}`;
}

export function presentSearchBound(bound: ReviewSearchBound): string {
  if (bound.kind === "movetime") return `${bound.requestedMs} ms search`;
  if (bound.kind === "depth") return `depth ${bound.requestedDepth} search`;
  return `${bound.requestedNodes}-node search`;
}

const engineLabel = (engine: { readonly name: string; readonly version: string }): string => engine.name.includes(engine.version) ? engine.name : `${engine.name} ${engine.version}`;

const per10 = (perMille: number): string => (perMille / 10).toFixed(1);

const MATE_CHANGE_PHRASES: Readonly<Record<ReviewMateTransition["changes"][number], string>> = Object.freeze({
  appeared: "a mate score appeared",
  disappeared: "the mate score disappeared",
  side_changed: "the mate score changed side",
  distance_changed: "the mate distance changed",
});

type FactRenderer<R extends FactStatementRendererId> = (operands: FactOperandsByRenderer[R]) => string;
type GroupRenderers = Readonly<Record<string, FactRendererDefinition<unknown>>>;
const GROUP_FACT_RENDERERS: GroupRenderers = Object.freeze({ ...PLAY_FACT_RENDERERS, ...INSPECTOR_FACT_RENDERERS, ...CONSUMER_FACT_RENDERERS } as unknown as GroupRenderers);
const groupRender = (): Readonly<Record<string, (operands: unknown) => string>> => Object.fromEntries(Object.entries(GROUP_FACT_RENDERERS).map(([id, definition]) => [id, definition.render]));
const groupParse = (): Readonly<Record<string, (operands: unknown) => unknown>> => Object.fromEntries(Object.entries(GROUP_FACT_RENDERERS).map(([id, definition]) => [id, (value: unknown) => {
  try {
    return definition.parse(value, id);
  } catch (error) {
    if (error instanceof PresentationSchemaError) throw new PresentationError("PRESENTATION_INVALID", error.message.replace(/^PRESENTATION_INVALID: /u, ""));
    throw error;
  }
}]));
{
  const groups = [PLAY_FACT_RENDERERS, INSPECTOR_FACT_RENDERERS, CONSUMER_FACT_RENDERERS].flatMap((group) => Object.keys(group));
  if (new Set(groups).size !== groups.length) throw new PresentationError("PRESENTATION_UNREGISTERED", "two renderer groups register the same fact renderer id");
}
const FACT_RENDERERS: { readonly [R in FactStatementRendererId]: FactRenderer<R> } = Object.freeze({
  ...(groupRender() as unknown as { readonly [R in Exclude<FactStatementRendererId, keyof BaseFactOperands>]: FactRenderer<R> }),
  "story.pivotal_marker@1": (marker) => renderPivotalMarker(marker).join(" "),
  "story.shape_firing@1": (firing) => renderShapeFiring(firing).join(" "),
  "story.endgame_classification@1": (reading) => renderEndgameClassification(reading).join(" "),
  "story.consequence@1": (value) => value.terminal
    ? `Board-terminal result for the learner: ${RUN_OUTCOME_LABELS[value.outcome].label}.`
    : `This continuation stops after ${value.plies} ${value.plies === 1 ? "ply" : "plies"}; the objective is ${OBJECTIVE_STATE_LABELS[value.objectiveState].label}.`,
  "story.imported_result@1": (value) => `The PGN records the game result as ${PGN_RESULT_LABELS[value.result].label}; the board is not terminal here.`,
  "story.last_level@1": () => "The last recorded moment within a pawn of level — Tabiya's recorded-evaluation convention.",
  "story.title@1": (value) => value.title,
  "review.mate_transition@1": (value) => `Recorded engine evaluation went from ${presentScore(value.before)} to ${presentScore(value.after)} across this move — ${value.changes.map((change) => MATE_CHANGE_PHRASES[change]).join(" and ")} (${engineLabel(value.engine)}, ${presentSearchBound(value.bound)}; a bounded search reading, not a proof).`,
  "review.wdl_point@1": (value) => `Recorded engine win/draw/loss expectation from White's side: ${per10(value.win)}% / ${per10(value.draw)}% / ${per10(value.loss)}% (${engineLabel(value.engine)}, ${presentSearchBound(value.bound)}).`,
  "module.move_quality_grade@1": (grade) => { const sentence = renderMoveQualityGrade(grade); assertMoveQualityGradeSentence(grade, sentence); return sentence; },
  "module.recorded_relation@1": (value) => `Recorded-path detector fired from this move: ${RECORDED_RELATION_LABELS[value.relation].label} (${GROUNDING_LABELS[value.grounding].label}).`,
});

/** §4b/§3.11: the abstention sentence; a screen reader hears the question and the reason. */
function abstentionSentence(operand: AbstentionOperand): string {
  const question = PRESENTATION_QUESTIONS[operand.question].label;
  if (operand.kind === "pending") return operand.stage === "requested" ? `${question}: requested, waiting for the provider.` : `${question}: queued behind earlier positions on this line.`;
  const reason = PRESENTATION_SOURCE_REASONS[operand.reason];
  if (reason.absence !== operand.absence) throw new PresentationError("PRESENTATION_INVALID", `abstention reason ${operand.reason} is not a ${operand.absence} absence`);
  return operand.absence === "empty" ? `${question}: nothing here — ${reason.label}.` : `${question}: unavailable — ${reason.label}.`;
}

function magnitudeSentence(operand: MagnitudeOperand): string {
  const basis = operand.convention.basis;
  const quantityKey = `${operand.convention.sourceProjection.id}@${operand.convention.sourceProjection.version}`;
  if (quantityKey !== "derived.review.eval_delta@1" && quantityKey !== "derived.review.eval_point@1") return genericMagnitudeSentence(operand);
  if (basis.kind !== "search") throw new PresentationError("PRESENTATION_INVALID", "an engine magnitude requires a search convention");
  const attribution = `${engineLabel(basis.execution.engine)}, ${presentSearchBound(basis.execution.bound)}`;
  const quantity = `${operand.convention.sourceProjection.id}@${operand.convention.sourceProjection.version}`;
  if (quantity === "derived.review.eval_delta@1") {
    if (operand.unit.kind !== "centipawn") throw new PresentationError("PRESENTATION_INVALID", "an evaluation change is centipawn-typed");
    return `Recorded engine evaluation changed by ${pawns(operand.value)} pawns from White's side across this move (${attribution}).`;
  }
  if (quantity !== "derived.review.eval_point@1") throw new PresentationError("PRESENTATION_UNREGISTERED", "magnitude quantity has no registered sentence");
  const score: ReviewScoreReceipt = operand.unit.kind === "centipawn"
    ? { kind: "centipawns", value: operand.value }
    : { kind: "mate", side: operand.value > 0 ? "white" : "black", distance: Math.abs(operand.value), unit: "moves" };
  return `Recorded engine evaluation after this move: ${presentScore(score)} from White's side (${attribution}).`;
}

function claimSentence(operand: ClaimOperand): string {
  const principleText = operand.principles.map((principle) => `The rest is the author's judgement, resting on: ${principle.name} — ${principle.statement}. It can be wrong when: ${principle.counterCase}.`).join(" ");
  const label = (type: ClaimEvidenceType): string => CLAIM_EVIDENCE_TYPE_LABELS[type].label;
  const earned = operand.earnedEvidenceTypes.map(label).join(", ");
  const unearned = operand.evidenceTypes.filter((type) => !operand.earnedEvidenceTypes.includes(type)).map(label);
  if (operand.binding === "ledger_bound") return `Author's claim. Every part of it carries a recorded reading: ${earned}.${unearned.length === 0 ? "" : ` Also declared, with no record attached: ${unearned.join(", ")}.`}`;
  if (operand.binding === "author_attributed") return `Author's claim. Evidence recorded for: ${earned}. ${principleText}`.trim();
  return `Author's claim, author-declared: ${operand.evidenceTypes.map(label).join(", ")}. No machine record is attached.${principleText === "" ? "" : ` ${principleText}`}`;
}

function citationSentence(operand: CitationOperand): string {
  const source = operand.source;
  return `“${operand.content.text}” — ${source.title}, ${source.locator} (${source.licence}; revision ${source.revision}).`;
}

// ---------------------------------------------------------------------------------------------
// The eight Checkpoint-B components' equivalent sentences (§3.1–§3.7, §3.12)
// ---------------------------------------------------------------------------------------------

/** A share as a whole percentage; never a caller-supplied percentage (criterion 8). */
export function formatShare(share: number): string {
  if (share > 0 && share < 0.005) return "under 1%";
  return `${Math.round(share * 100)}%`;
}

const SPEED_LABELS: Readonly<Record<string, string>> = Object.freeze({ ultraBullet: "ultra-bullet", bullet: "bullet", blitz: "blitz", rapid: "rapid", classical: "classical", correspondence: "correspondence" });

function populationPhrase(population: PopulationDescriptor): string {
  const speeds = population.speeds.map((speed) => SPEED_LABELS[speed] ?? "other").join(", ");
  const ratings = population.ratings.length === 0 ? "all ratings" : `rating bands ${population.ratings.join(", ")}`;
  return `Lichess opening-explorer games (${ratings}; ${speeds}; ${population.since} to ${population.until})`;
}

const countOf = (count: number, noun: string): string => `${count} ${count === 1 ? noun : `${noun}s`}`;

/** §5c/§5d: the registered attribution of a convention, rendered inside the component. */
export function conventionAttribution(convention: ConventionReceipt): string {
  const basis = convention.basis;
  switch (basis.kind) {
    case "search": return `${engineLabel(basis.execution.engine)}, ${presentSearchBound(basis.execution.bound)}`;
    case "recorded_search": return `${basis.engine === null ? "stored engine reading" : engineLabel(basis.engine)}${basis.depth === null ? "" : `, depth ${basis.depth}`}`;
    case "tablebase_exact": return "exact Syzygy tablebase";
    case "human_model": return `${engineLabel(basis.model)}${basis.band === null ? "" : ` at ${basis.band} rating`}`;
    case "human_population": return `${countOf(basis.sampleSize, "game")} from ${populationPhrase(basis.population)}`;
    case "declared": return PRESENTATION_CONVENTIONS[basis.convention].label;
  }
}

const PERSPECTIVE_PHRASES: Readonly<Record<ConventionReceipt["perspective"], string>> = Object.freeze({
  white: " from White's side", black: " from Black's side", side_to_move: " from the side to move", learner: " from your side", not_applicable: "",
});

function magnitudeValueText(operand: MagnitudeOperand): string {
  switch (operand.unit.kind) {
    case "centipawn": return pawns(operand.value);
    case "mate_in": return `mate in ${Math.abs(operand.value)} for ${operand.value > 0 ? "White" : "Black"}`;
    case "percent": return `${operand.value}%`;
    case "count": return String(operand.value);
    case "elo": return `${operand.value} rating`;
    case "clock_ms": { const seconds = Math.floor(operand.value / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
    case "distance_to_zero": return `distance ${operand.value}`;
  }
}

/** Registered quantity labels keyed by exact source projection; no label means unrenderable. */
const MAGNITUDE_QUANTITIES: Readonly<Record<string, { readonly label: string }>> = Object.freeze({ ...PLAY_MAGNITUDE_QUANTITIES, ...INSPECTOR_MAGNITUDE_QUANTITIES, ...CONSUMER_MAGNITUDE_QUANTITIES });

function genericMagnitudeSentence(operand: MagnitudeOperand): string {
  const quantity = MAGNITUDE_QUANTITIES[`${operand.convention.sourceProjection.id}@${operand.convention.sourceProjection.version}`];
  if (quantity === undefined) throw new PresentationError("PRESENTATION_UNREGISTERED", "magnitude quantity has no registered sentence");
  return `${quantity.label}: ${magnitudeValueText(operand)}${operand.saturated ? " (at the instrument's limit)" : ""}${PERSPECTIVE_PHRASES[operand.convention.perspective]} (${conventionAttribution(operand.convention)}).`;
}

function distributionSentence(operand: DistributionOperand): string {
  const rows = operand.rows.map((row) => row.withheld === undefined ? `${row.move.san} ${formatShare(row.share)}` : `${row.move.san} (below the outcome floor)`);
  const residual = operand.residual === null ? [] : [`${DISTRIBUTION_RESIDUAL_LABELS[operand.residual.label].label} ${formatShare(operand.residual.share)}`];
  const highlighted = operand.highlight === null ? undefined : operand.rows.find((row) => row.move.uci === operand.highlight!.uci);
  const highlight = operand.highlight === null || highlighted === undefined ? "" : ` ${highlighted.move.san} is ${operand.highlight.why === "learner_committed" ? "the move you played" : "the move in view"}.`;
  return `Move shares (${conventionAttribution(operand.convention)}): ${listPhrase([...rows, ...residual])}.${highlight}`;
}

function outcomeSplitSentence(operand: OutcomeSplitOperand): string {
  if (operand.total === 0) return "No games from this population reached this position.";
  if (!operand.floor.met) return `${countOf(operand.total, "game")} recorded here — below the ${operand.floor.threshold}-game floor. No frequencies are shown.`;
  const share = (count: number): string => formatShare(count / operand.total);
  return `Results of ${countOf(operand.total, "game")} (${conventionAttribution(operand.convention)}): White won ${share(operand.white)}, drawn ${share(operand.draws)}, Black won ${share(operand.black)}.`;
}

function magnitudeTrailSentence(operand: MagnitudeTrailOperand): string {
  const points = operand.points.map((point) => `after ply ${point.plyOffset} ${magnitudeValueText(point.magnitude)}`);
  const quantity = MAGNITUDE_QUANTITIES[`${operand.convention.sourceProjection.id}@${operand.convention.sourceProjection.version}`]?.label ?? "Recorded evaluation";
  return `${quantity} across this branch${PERSPECTIVE_PHRASES[operand.convention.perspective]}: ${points.join("; ")} (${conventionAttribution(operand.convention)}).`;
}

const MOVE_PATH_ORIGINS: Readonly<Record<MovePathOperand["origin"], string>> = Object.freeze({ recorded: "Recorded line", authored: "Authored line", learner_played: "Your line" });

function movePathSentence(operand: MovePathOperand): string {
  const line = operand.plies.map((ply) => ply.san).join(" ");
  return `${MOVE_PATH_ORIGINS[operand.origin]}: ${line}${operand.convention === undefined ? "" : ` (${conventionAttribution(operand.convention)})`}.`;
}

/** §3.6a: registered relation phrases; the renderer names only retained endpoints. */
export const RELATION_PHRASES: Readonly<Record<BoardRelationKind, Readonly<Record<"state" | "gained" | "lost", string>>>> = Object.freeze({
  controls: { state: "controls", gained: "now controls", lost: "no longer controls" },
  attacks: { state: "attacks", gained: "now attacks", lost: "no longer attacks" },
  defends: { state: "defends", gained: "now defends", lost: "no longer defends" },
  screens: { state: "screens", gained: "now screens", lost: "no longer screens" },
  pins: { state: "pins", gained: "now pins", lost: "no longer pins" },
  skewers: { state: "skewers", gained: "now skewers", lost: "no longer skewers" },
  threatens: { state: "can capture", gained: "can now capture", lost: "can no longer capture" },
  moves_to: { state: "can move to", gained: "can now move to", lost: "can no longer move to" },
  opens_ray: { state: "has an open line to", gained: "opens a line to", lost: "loses its line to" },
  closes_ray: { state: "blocks the line to", gained: "now blocks the line to", lost: "no longer blocks the line to" },
});

function relationNodePhrase(operand: RelationOverlayOperand, square: SquareName): string {
  const node = operand.nodes.find((candidate) => candidate.square === square);
  if (node?.role !== undefined && node.color !== undefined) return `${SIDE_NAMES[node.color]}'s ${ROLE_NAMES[node.role]} on ${square}`;
  return square;
}

function relationOverlaySentence(operand: RelationOverlayOperand): string {
  const edges = operand.edges.map((edge) => `${relationNodePhrase(operand, edge.from)} ${RELATION_PHRASES[edge.relation][edge.sign]} ${relationNodePhrase(operand, edge.to)}`);
  const joined = new Set<string>(operand.edges.flatMap((edge) => [edge.from, edge.to]));
  const context = operand.nodes.filter((node) => !joined.has(node.square)).map((node) => relationNodePhrase(operand, node.square));
  const body = `${listPhrase(edges)}${context.length === 0 ? "" : `, with ${listPhrase(context)} on the same line`}`;
  return `${body.slice(0, 1).toUpperCase()}${body.slice(1)}${operand.convention === undefined ? "" : ` (${conventionAttribution(operand.convention)})`}.`;
}

function countSentence(operand: CountWithDenominatorOperand): string {
  const meaning = DENOMINATOR_MEANINGS[operand.denominatorMeaning].label;
  if (operand.denominator === 0) return `${operand.numerator} of 0 ${meaning}: nothing to count against.`;
  if (operand.floor !== undefined && !operand.floor.met) return `${operand.numerator} of ${operand.denominator} ${meaning} — below the ${operand.floor.threshold} floor; no share is shown.`;
  return `${operand.numerator} of ${operand.denominator} ${meaning} (${formatShare(operand.numerator / operand.denominator)}).`;
}

function structuredDocumentSentence(operand: StructuredDocumentOperand): string {
  const schema = STRUCTURED_DOCUMENT_SCHEMAS[operand.schemaId];
  return `${schema.label}: a read-only record with ${countOf(schema.fields.length, "field")}.`;
}

/** The equivalent sentence of one component, computed only from its operand (criterion 16). */
function componentSentence(component: ComponentValue): string {
  switch (component.id) {
    case "magnitude": return magnitudeSentence(component.operand);
    case "fact_statement": return component.operand.renderedText;
    case "abstention": return abstentionSentence(component.operand);
    case "claim": return claimSentence(component.operand);
    case "citation": return citationSentence(component.operand);
    case "enum_state": return (LABEL_VOCABULARIES[component.operand.vocabulary] as LabelVocabulary<string>)[component.operand.value]!.label;
    case "distribution": return distributionSentence(component.operand);
    case "outcome_split": return outcomeSplitSentence(component.operand);
    case "magnitude_trail": return magnitudeTrailSentence(component.operand);
    case "square_set": return component.operand.caption.renderedText;
    case "move_path": return movePathSentence(component.operand);
    case "relation_overlay": return relationOverlaySentence(component.operand);
    case "count_with_denominator": return countSentence(component.operand);
    case "structured_document": return structuredDocumentSentence(component.operand);
  }
}

// ---------------------------------------------------------------------------------------------
// Canonical digests: the shared fail-closed RFC-8785 bytes with a literal domain prefix
// ---------------------------------------------------------------------------------------------

/** `sha256:<hex>` over `<domain>\n<canonical JSON>`; non-finite numbers and lone surrogates refuse. */
export function presentationDigest(domain: string, value: unknown): string {
  return `sha256:${evidenceDigest(`${domain}\n${canonicalizeJson(withoutUndefined(value))}`)}`;
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> => typeof value === "object" && value !== null && !Array.isArray(value);
function exact(value: unknown, keys: readonly string[], optional: readonly string[] = [], label = "value"): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) throw new PresentationError("PRESENTATION_INVALID", `${label} must be an object`);
  const allowed = new Set([...keys, ...optional]);
  for (const key of Object.keys(value)) if (!allowed.has(key)) throw new PresentationError("PRESENTATION_INVALID", `${label} has the unknown key ${key}`);
  for (const key of keys) if (!(key in value)) throw new PresentationError("PRESENTATION_INVALID", `${label} omits ${key}`);
  return value;
}
const text = (value: unknown, label: string): string => { if (typeof value !== "string" || value.trim() === "") throw new PresentationError("PRESENTATION_INVALID", `${label} must be a non-empty string`); return value; };
const safeInt = (value: unknown, label: string): number => { if (!Number.isSafeInteger(value)) throw new PresentationError("PRESENTATION_INVALID", `${label} must be a safe integer`); return value as number; };
const oneOf = <T extends string>(value: unknown, members: readonly T[], label: string): T => { if (typeof value !== "string" || !members.includes(value as T)) throw new PresentationError("PRESENTATION_INVALID", `${label} is outside its closed vocabulary`); return value as T; };
const versioned = (value: unknown, label: string): VersionedEvidenceId => { const item = exact(value, ["id", "version"], [], label); return Object.freeze({ id: text(item.id, `${label}.id`), version: safeInt(item.version, `${label}.version`) }); };
const DIGEST = /^sha256:[0-9a-f]{64}$/u;
const digestText = (value: unknown, label: string): string => { if (typeof value !== "string" || !DIGEST.test(value)) throw new PresentationError("PRESENTATION_INVALID", `${label} must be a sha256 digest`); return value; };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Omits absent optional properties (`undefined`) so they have no wire image; everything else is kept. */
function withoutUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutUndefined);
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) if (entry !== undefined) result[key] = withoutUndefined(entry);
    return result;
  }
  return value;
}

/** A JSON-only clone; refuses functions, symbols and non-finite numbers through canonicalizeJson. */
function jsonClone<T>(value: T): T {
  return JSON.parse(canonicalizeJson(withoutUndefined(value))) as T;
}

// ---------------------------------------------------------------------------------------------
// Operand parsers (strict, closed): the wire and the construction path share them
// ---------------------------------------------------------------------------------------------

function parseBound(value: unknown): ReviewSearchBound {
  const record = isRecord(value) ? value : {};
  if (record.kind === "movetime") { const item = exact(value, ["kind", "requestedMs", "reachedDepth"], [], "bound"); return { kind: "movetime", requestedMs: safeInt(item.requestedMs, "requestedMs"), reachedDepth: item.reachedDepth === null ? null : safeInt(item.reachedDepth, "reachedDepth") }; }
  if (record.kind === "depth") { const item = exact(value, ["kind", "requestedDepth", "reachedDepth"], [], "bound"); return { kind: "depth", requestedDepth: safeInt(item.requestedDepth, "requestedDepth"), reachedDepth: item.reachedDepth === null ? null : safeInt(item.reachedDepth, "reachedDepth") }; }
  if (record.kind === "nodes") { const item = exact(value, ["kind", "requestedNodes", "reachedDepth"], [], "bound"); return { kind: "nodes", requestedNodes: safeInt(item.requestedNodes, "requestedNodes"), reachedDepth: item.reachedDepth === null ? null : safeInt(item.reachedDepth, "reachedDepth") }; }
  throw new PresentationError("PRESENTATION_INVALID", "bound kind is outside movetime | depth | nodes");
}
const parseEngine = (value: unknown): { readonly name: string; readonly version: string } => { const item = exact(value, ["name", "version"], [], "engine"); return { name: text(item.name, "engine.name"), version: text(item.version, "engine.version") }; };

function parseConvention(value: unknown): ConventionReceipt {
  const item = exact(value, ["producer", "sourceProjection", "sourceEvidenceDigest", "perspective", "basis"], [], "convention");
  const basisRecord = isRecord(item.basis) ? item.basis : exact(item.basis, ["kind"], [], "convention.basis");
  let basis: ConventionBasis;
  if (basisRecord.kind === "search") {
    const wrapper = exact(item.basis, ["kind", "execution"], [], "convention.basis");
    const execution = exact(wrapper.execution, ["operation", "engine", "bound", "generation", "normalizedRequestDigest", "responseDigest"], [], "execution");
    if (execution.operation !== "stockfish.position_evaluation@1") throw new PresentationError("PRESENTATION_INVALID", "search execution names an unregistered operation");
    basis = { kind: "search", execution: { operation: "stockfish.position_evaluation@1", engine: parseEngine(execution.engine), bound: parseBound(execution.bound), generation: execution.generation === null ? null : safeInt(execution.generation, "generation"), normalizedRequestDigest: digestText(execution.normalizedRequestDigest, "normalizedRequestDigest"), responseDigest: digestText(execution.responseDigest, "responseDigest") } };
  } else if (basisRecord.kind === "declared") {
    const wrapper = exact(item.basis, ["kind", "convention"], [], "convention.basis");
    basis = { kind: "declared", convention: oneOf(wrapper.convention, Object.keys(PRESENTATION_CONVENTIONS) as PresentationConventionId[], "convention id") };
  } else basis = parseConventionBasis(item.basis);
  return { producer: versioned(item.producer, "convention.producer"), sourceProjection: versioned(item.sourceProjection, "convention.sourceProjection"), sourceEvidenceDigest: digestText(item.sourceEvidenceDigest, "sourceEvidenceDigest"), perspective: oneOf(item.perspective, ["white", "black", "side_to_move", "learner", "not_applicable"], "perspective"), basis };
}

function parseMagnitude(value: unknown): MagnitudeOperand {
  const item = exact(value, ["value", "unit", "convention", "saturated"], [], "magnitude");
  const unit = exact(item.unit, ["kind"], [], "unit");
  const kind = oneOf(unit.kind, ["centipawn", "mate_in", "percent", "count", "elo", "clock_ms", "distance_to_zero"], "unit.kind");
  if (typeof item.saturated !== "boolean") throw new PresentationError("PRESENTATION_INVALID", "saturated must be boolean");
  const magnitude = safeInt(item.value, "magnitude.value");
  if (kind === "mate_in" && magnitude === 0) throw new PresentationError("PRESENTATION_INVALID", "a mate distance is never zero");
  return { value: magnitude, unit: { kind } as MagnitudeUnit, convention: parseConvention(item.convention), saturated: item.saturated };
}

function parseScoreReceipt(value: unknown): ReviewScoreReceipt {
  const record = isRecord(value) ? value : {};
  if (record.kind === "centipawns") { const item = exact(value, ["kind", "value"], [], "score"); return { kind: "centipawns", value: safeInt(item.value, "score.value") }; }
  const item = exact(value, ["kind", "side", "distance", "unit"], [], "score");
  if (item.kind !== "mate" || item.unit !== "moves") throw new PresentationError("PRESENTATION_INVALID", "score kind must be centipawns | mate");
  const distance = safeInt(item.distance, "score.distance");
  if (distance < 1) throw new PresentationError("PRESENTATION_INVALID", "mate distance must be positive");
  return { kind: "mate", side: oneOf(item.side, ["white", "black"], "score.side"), distance, unit: "moves" };
}

/**
 * Per-renderer exact operand parsers. Checkpoint A retains the literal source operands the
 * renderer needs; the client re-renders and byte-checks `renderedText`.
 */
const FACT_OPERAND_PARSERS: { readonly [R in FactStatementRendererId]: (value: unknown) => FactOperandsByRenderer[R] } = Object.freeze({
  ...(groupParse() as unknown as { readonly [R in Exclude<FactStatementRendererId, keyof BaseFactOperands>]: (value: unknown) => FactOperandsByRenderer[R] }),
  "story.pivotal_marker@1": (value) => { const item = exact(value, ["nodeId", "kind", "detail", "provenanceNote"], [], "marker"); oneOf(item.kind, ["irreversibility", "phase_change", "human_divergence", "option_collapse"], "marker.kind"); if (!isRecord(item.detail)) throw new PresentationError("PRESENTATION_INVALID", "marker.detail must be an object"); text(item.nodeId, "marker.nodeId"); text(item.provenanceNote, "marker.provenanceNote"); return item as unknown as PivotalMarker; },
  "story.shape_firing@1": (value) => { const item = exact(value, ["entryId"], [], "shape firing"); return { entryId: text(item.entryId, "entryId") }; },
  "story.endgame_classification@1": (value) => { const item = exact(value, ["fen", "type", "conventionId", "provenanceNote"], [], "endgame"); text(item.fen, "endgame.fen"); if (item.type !== null) { const type = exact(item.type, ["id", "label"], [], "endgame.type"); oneOf(type.id, ["pawn", "rook-and-pawn-vs-rook", "rook", "queen", "minor"], "endgame.type.id"); text(type.label, "endgame.type.label"); } if (item.conventionId !== "endgame-material-census@1") throw new PresentationError("PRESENTATION_INVALID", "endgame convention is not registered"); text(item.provenanceNote, "endgame.provenanceNote"); return item as unknown as EndgameClassification; },
  "story.consequence@1": (value) => { const record = isRecord(value) ? value : {}; if (record.terminal === true) { const item = exact(value, ["terminal", "outcome"], [], "consequence"); return { terminal: true, outcome: oneOf(item.outcome, ["win", "loss", "draw"], "outcome") }; } const item = exact(value, ["terminal", "plies", "objectiveState"], [], "consequence"); if (item.terminal !== false) throw new PresentationError("PRESENTATION_INVALID", "consequence terminal must be boolean"); return { terminal: false, plies: safeInt(item.plies, "plies"), objectiveState: oneOf(item.objectiveState, Object.keys(OBJECTIVE_STATE_LABELS) as ObjectiveState[], "objectiveState") }; },
  "story.imported_result@1": (value) => { const item = exact(value, ["result"], [], "imported result"); return { result: oneOf(item.result, ["1-0", "0-1", "1/2-1/2"], "result") }; },
  "story.last_level@1": (value) => { const item = exact(value, ["learnerCentipawns"], [], "last level"); const cp = safeInt(item.learnerCentipawns, "learnerCentipawns"); if (cp < -100) throw new PresentationError("PRESENTATION_INVALID", "last level must be within a pawn"); return { learnerCentipawns: cp }; },
  "story.title@1": (value) => { const item = exact(value, ["title"], [], "title"); return { title: text(item.title, "title") }; },
  "review.mate_transition@1": (value) => { const item = exact(value, ["changes", "before", "after", "engine", "bound"], [], "mate transition"); if (!Array.isArray(item.changes) || item.changes.length === 0) throw new PresentationError("PRESENTATION_INVALID", "changes must be non-empty"); const changes = item.changes.map((change) => oneOf(change, ["appeared", "disappeared", "side_changed", "distance_changed"] as const, "change")); return { changes, before: parseScoreReceipt(item.before), after: parseScoreReceipt(item.after), engine: parseEngine(item.engine), bound: parseBound(item.bound) }; },
  "review.wdl_point@1": (value) => { const item = exact(value, ["win", "draw", "loss", "engine", "bound"], [], "wdl"); const win = safeInt(item.win, "win"), draw = safeInt(item.draw, "draw"), loss = safeInt(item.loss, "loss"); if (win < 0 || draw < 0 || loss < 0 || win + draw + loss !== 1000) throw new PresentationError("PRESENTATION_INVALID", "WDL must be non-negative per-mille summing to 1000"); return { win, draw, loss, engine: parseEngine(item.engine), bound: parseBound(item.bound) }; },
  "module.move_quality_grade@1": (value) => { if (!isRecord(value)) throw new PresentationError("PRESENTATION_INVALID", "grade must be an object"); oneOf(value.klass, ["inaccuracy", "mistake", "blunder"], "grade.klass"); return value as unknown as MoveQualityGrade; },
  "module.recorded_relation@1": (value) => { const item = exact(value, ["relation", "grounding"], [], "relation"); return { relation: oneOf(item.relation, Object.keys(RECORDED_RELATION_LABELS) as RecordedRelationLabelId[], "relation"), grounding: oneOf(item.grounding, Object.keys(GROUNDING_LABELS) as EvidenceGrounding[], "grounding") }; },
});

/** Builds the sealed fact operand: the text is recomputed from the retained operands, never supplied. */
function factStatement<R extends FactStatementRendererId>(rendererId: R, binding: "recorded_run" | "declared_convention", convention: PresentationConventionId, operands: FactOperandsByRenderer[R]): FactStatementOperand {
  const retained = deepFreeze(jsonClone(operands));
  const renderedText = assertPresentationText((FACT_RENDERERS[rendererId] as FactRenderer<R>)(retained));
  return deepFreeze({ rendererId, binding, convention, operands: retained, sourceDigest: presentationDigest("presentation.fact.operands@1", retained), renderedText } as unknown as FactStatementOperand);
}

function parseFactStatement(value: unknown): FactStatementOperand {
  const item = exact(value, ["rendererId", "binding", "convention", "operands", "sourceDigest", "renderedText"], [], "fact_statement");
  const rendererId = oneOf(item.rendererId, Object.keys(FACT_RENDERERS) as FactStatementRendererId[], "rendererId");
  const binding = oneOf(item.binding, ["recorded_run", "declared_convention"], "binding");
  const convention = oneOf(item.convention, Object.keys(PRESENTATION_CONVENTIONS) as PresentationConventionId[], "convention");
  const operands = (FACT_OPERAND_PARSERS[rendererId] as (candidate: unknown) => unknown)(item.operands);
  const rebuilt = factStatement(rendererId, binding, convention, operands as never);
  if (rebuilt.sourceDigest !== item.sourceDigest || rebuilt.renderedText !== item.renderedText) throw new PresentationError("PRESENTATION_INVALID", "fact_statement text or source digest disagrees with its retained operands");
  return rebuilt;
}

function parseAbstention(value: unknown): AbstentionOperand {
  const record = isRecord(value) ? value : {};
  const decisionOf = (candidate: unknown): PresentationDecisionStamp => {
    const decision = exact(candidate, ["eventHeadSeq", "cursor", "disclosureBoundarySeq", "digest"], [], "decision");
    const cursor = exact(decision.cursor, ["branchId", "nodeId"], [], "decision.cursor");
    return { eventHeadSeq: safeInt(decision.eventHeadSeq, "eventHeadSeq"), cursor: { branchId: text(cursor.branchId, "cursor.branchId"), nodeId: text(cursor.nodeId, "cursor.nodeId") }, disclosureBoundarySeq: decision.disclosureBoundarySeq === null ? null : safeInt(decision.disclosureBoundarySeq, "disclosureBoundarySeq"), digest: digestText(decision.digest, "decision.digest") };
  };
  const questions = Object.keys(PRESENTATION_QUESTIONS) as PresentationQuestionId[];
  if (record.kind === "pending") {
    const item = exact(value, ["kind", "stage", "question", "projection", "producer", "requestId", "decision"], [], "abstention");
    return { kind: "pending", stage: oneOf(item.stage, ["requested", "not_yet_scheduled"], "stage"), question: oneOf(item.question, questions, "question"), projection: versioned(item.projection, "projection"), producer: versioned(item.producer, "producer"), requestId: text(item.requestId, "requestId"), decision: decisionOf(item.decision) };
  }
  const item = exact(value, ["kind", "question", "projection", "producer", "requestId", "decision", "absence", "reason", "sourceReceipt"], [], "abstention");
  if (item.kind !== "settled_abstention") throw new PresentationError("PRESENTATION_INVALID", "abstention kind must be pending | settled_abstention");
  const reason = oneOf(item.reason, Object.keys(PRESENTATION_SOURCE_REASONS) as PresentationSourceReason[], "reason");
  const absence = oneOf(item.absence, ["withheld", "unavailable", "failed", "empty"], "absence");
  if (PRESENTATION_SOURCE_REASONS[reason].absence !== absence) throw new PresentationError("PRESENTATION_INVALID", `reason ${reason} is not a ${absence} absence`);
  const receipt = exact(item.sourceReceipt, ["producer", "projection", "receiptDigest"], [], "sourceReceipt");
  return { kind: "settled_abstention", question: oneOf(item.question, questions, "question"), projection: versioned(item.projection, "projection"), producer: versioned(item.producer, "producer"), requestId: text(item.requestId, "requestId"), decision: decisionOf(item.decision), absence, reason, sourceReceipt: { producer: versioned(receipt.producer, "sourceReceipt.producer"), projection: versioned(receipt.projection, "sourceReceipt.projection"), receiptDigest: digestText(receipt.receiptDigest, "receiptDigest") } };
}

function parseClaim(value: unknown): ClaimOperand {
  const item = exact(value, ["text", "binding", "evidenceTypes", "earnedEvidenceTypes", "principles"], [], "claim");
  const labels = (candidate: unknown, label: string): readonly ClaimEvidenceType[] => { if (!Array.isArray(candidate)) throw new PresentationError("PRESENTATION_INVALID", `${label} must be an array`); return candidate.map((entry) => oneOf(entry, Object.keys(CLAIM_EVIDENCE_TYPE_LABELS) as ClaimEvidenceType[], label)); };
  if (!Array.isArray(item.principles)) throw new PresentationError("PRESENTATION_INVALID", "principles must be an array");
  return { text: text(item.text, "claim.text"), binding: oneOf(item.binding, ["ledger_bound", "author_attributed", "self_declared"], "claim.binding"), evidenceTypes: labels(item.evidenceTypes, "evidenceTypes"), earnedEvidenceTypes: labels(item.earnedEvidenceTypes, "earnedEvidenceTypes"), principles: item.principles.map((principle) => { const entry = exact(principle, ["name", "statement", "counterCase"], [], "principle"); return { name: text(entry.name, "principle.name"), statement: text(entry.statement, "principle.statement"), counterCase: text(entry.counterCase, "principle.counterCase") }; }) };
}

function parseCitation(value: unknown): CitationOperand {
  const item = exact(value, ["content", "source"], [], "citation");
  const content = exact(item.content, ["kind", "text", "binding"], [], "citation.content");
  const binding = exact(content.binding, ["projection", "field", "evidenceDigest", "valueDigest"], [], "citation.binding");
  const quoted = text(content.text, "citation.text");
  const valueDigest = digestText(binding.valueDigest, "valueDigest");
  // [[D3102]]: the text is bound to the digest of the exact retained evidence value.
  if (presentationDigest("presentation.citation.value@1", quoted) !== valueDigest) throw new PresentationError("PRESENTATION_INVALID", "citation text is not the bound evidence value");
  const source = exact(item.source, ["source", "title", "locator", "licence", "revision"], ["url"], "citation.source");
  return { content: { kind: oneOf(content.kind, ["quoted_passage", "authored_summary"], "citation.kind"), text: quoted, binding: { projection: versioned(binding.projection, "binding.projection"), field: text(binding.field, "binding.field"), evidenceDigest: digestText(binding.evidenceDigest, "binding.evidenceDigest"), valueDigest } }, source: { source: versioned(source.source, "source.source"), title: text(source.title, "source.title"), locator: text(source.locator, "source.locator"), licence: text(source.licence, "source.licence"), revision: text(source.revision, "source.revision"), ...(source.url === undefined ? {} : { url: text(source.url, "source.url") }) } };
}

function parseEnumState(value: unknown): EnumStateOperand {
  const item = exact(value, ["vocabulary", "value"], [], "enum_state");
  const vocabulary = oneOf(item.vocabulary, Object.keys(LABEL_VOCABULARIES) as (keyof LabelVocabularyMembers)[], "vocabulary");
  const members = Object.keys(LABEL_VOCABULARIES[vocabulary]);
  // §6b/criterion 5: totality — a value absent from its own vocabulary is refused, whatever its shape.
  return { vocabulary, value: oneOf(item.value, members, `${vocabulary} value`) } as EnumStateOperand;
}

// ---------------------------------------------------------------------------------------------
// The eight Checkpoint-B component parsers (strict, closed; construction and wire share them)
// ---------------------------------------------------------------------------------------------

const SQUARE_NAME = /^[a-h][1-8]$/u;
const UCI_MOVE = /^[a-h][1-8][a-h][1-8][qrbn]?$/u;
const squareName = (value: unknown, label: string): SquareName => { if (typeof value !== "string" || !SQUARE_NAME.test(value)) throw new PresentationError("PRESENTATION_INVALID", `${label} must be a square name`); return value as SquareName; };
const uciMove = (value: unknown, label: string): string => { if (typeof value !== "string" || !UCI_MOVE.test(value)) throw new PresentationError("PRESENTATION_INVALID", `${label} must be canonical UCI`); return value; };
const share01 = (value: unknown, label: string): number => { if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) throw new PresentationError("PRESENTATION_INVALID", `${label} must be a share in [0, 1]`); return value; };
const nonNegative = (value: unknown, label: string): number => { const number = safeInt(value, label); if (number < 0) throw new PresentationError("PRESENTATION_INVALID", `${label} must be non-negative`); return number; };
const ANSWER_DISTANCES: readonly AnswerDistance[] = Object.freeze(["fact", "pattern", "threat", "theory", "evaluation", "principle", "plan", "candidate_moves", "ranked_moves", "move", "principal_variation"]);

function parseConventionBasis(value: unknown): ConventionBasis {
  const record = isRecord(value) ? value : {};
  switch (record.kind) {
    case "recorded_search": {
      const item = exact(value, ["kind", "engine", "depth"], [], "convention.basis");
      return { kind: "recorded_search", engine: item.engine === null ? null : parseEngine(item.engine), depth: item.depth === null ? null : nonNegative(item.depth, "depth") };
    }
    case "tablebase_exact": {
      const item = exact(value, ["kind", "source"], [], "convention.basis");
      return { kind: "tablebase_exact", source: oneOf(item.source, ["syzygy"], "tablebase source") };
    }
    case "human_model": {
      const item = exact(value, ["kind", "model", "band"], [], "convention.basis");
      return { kind: "human_model", model: parseEngine(item.model), band: item.band === null ? null : nonNegative(item.band, "band") };
    }
    case "human_population": {
      const item = exact(value, ["kind", "population", "sampleSize"], [], "convention.basis");
      const population = exact(item.population, ["source", "ratings", "speeds", "since", "until"], [], "population");
      if (!Array.isArray(population.ratings) || !Array.isArray(population.speeds)) throw new PresentationError("PRESENTATION_INVALID", "population ratings and speeds are arrays");
      return {
        kind: "human_population",
        population: { source: oneOf(population.source, ["lichess-explorer"], "population.source"), ratings: population.ratings.map((rating) => nonNegative(rating, "rating")), speeds: population.speeds.map((speed) => text(speed, "speed")), since: text(population.since, "since"), until: text(population.until, "until") },
        sampleSize: nonNegative(item.sampleSize, "sampleSize"),
      };
    }
    default: throw new PresentationError("PRESENTATION_INVALID", "convention basis kind is outside the registered arms");
  }
}

function parseDistribution(value: unknown): DistributionOperand {
  const item = exact(value, ["rows", "residual", "convention", "highlight"], [], "distribution");
  if (!Array.isArray(item.rows) || item.rows.length === 0) throw new PresentationError("PRESENTATION_INVALID", "a distribution has at least one row; empty is an abstention");
  const rows = item.rows.map((row, index) => {
    const entry = exact(row, ["move", "share"], ["count", "withheld"], `rows[${index}]`);
    const move = exact(entry.move, ["san", "uci"], [], `rows[${index}].move`);
    return {
      move: { san: text(move.san, "san"), uci: uciMove(move.uci, "uci") },
      share: share01(entry.share, "share"),
      ...(entry.count === undefined ? {} : { count: nonNegative(entry.count, "count") }),
      ...(entry.withheld === undefined ? {} : { withheld: oneOf(entry.withheld, ["below_outcome_floor"], "withheld") }),
    };
  });
  if (new Set(rows.map((row) => row.move.uci)).size !== rows.length) throw new PresentationError("PRESENTATION_INVALID", "distribution rows repeat a move");
  const residual = item.residual === null ? null : (() => { const entry = exact(item.residual, ["share", "label"], [], "residual"); return { share: share01(entry.share, "residual.share"), label: oneOf(entry.label, Object.keys(DISTRIBUTION_RESIDUAL_LABELS) as DistributionResidualLabelId[], "residual.label") }; })();
  const total = rows.reduce((sum, row) => sum + row.share, 0) + (residual?.share ?? 0);
  if (total > 1.000001) throw new PresentationError("PRESENTATION_INVALID", "distribution shares exceed the whole");
  const highlight = item.highlight === null ? null : (() => { const entry = exact(item.highlight, ["uci", "why"], [], "highlight"); return { uci: uciMove(entry.uci, "highlight.uci"), why: oneOf(entry.why, ["learner_committed", "position_in_view"], "highlight.why") }; })();
  return { rows, residual, convention: parseConvention(item.convention), highlight };
}

function parseOutcomeSplit(value: unknown): OutcomeSplitOperand {
  const item = exact(value, ["white", "draws", "black", "total", "perspective", "convention", "floor"], [], "outcome_split");
  const white = nonNegative(item.white, "white"), draws = nonNegative(item.draws, "draws"), black = nonNegative(item.black, "black"), total = nonNegative(item.total, "total");
  if (white + draws + black !== total) throw new PresentationError("PRESENTATION_INVALID", "outcome split does not sum to its total");
  const floor = exact(item.floor, ["threshold", "met"], [], "floor");
  const threshold = nonNegative(floor.threshold, "floor.threshold");
  if (typeof floor.met !== "boolean" || floor.met !== total >= threshold) throw new PresentationError("PRESENTATION_INVALID", "floor.met disagrees with the total");
  return { white, draws, black, total, perspective: oneOf(item.perspective, ["white", "black", "side_to_move"], "perspective"), convention: parseConvention(item.convention), floor: { threshold, met: floor.met } };
}

function parseMagnitudeTrail(value: unknown): MagnitudeTrailOperand {
  const item = exact(value, ["points", "convention", "scalePolicy"], [], "magnitude_trail");
  if (!Array.isArray(item.points) || item.points.length < 2) throw new PresentationError("PRESENTATION_INVALID", "a trail has at least two points; one point is a magnitude");
  const convention = parseConvention(item.convention);
  const policy = oneOf(item.scalePolicy, Object.keys(MAGNITUDE_SCALE_POLICIES) as MagnitudeScalePolicyId[], "scalePolicy");
  const conventionBytes = canonicalizeJson(withoutUndefined(convention));
  const points = item.points.map((point, index) => {
    const entry = exact(point, ["plyOffset", "magnitude"], [], `points[${index}]`);
    const magnitude = parseMagnitude(entry.magnitude);
    if (canonicalizeJson(withoutUndefined(magnitude.convention)) !== conventionBytes) throw new PresentationError("PRESENTATION_INVALID", "a trail mixes two conventions");
    if (magnitude.unit.kind !== MAGNITUDE_SCALE_POLICIES[policy].unit) throw new PresentationError("PRESENTATION_INVALID", "a trail point's unit is outside its scale policy");
    return { plyOffset: nonNegative(entry.plyOffset, "plyOffset"), magnitude };
  });
  for (let index = 1; index < points.length; index += 1) if (points[index]!.plyOffset <= points[index - 1]!.plyOffset) throw new PresentationError("PRESENTATION_INVALID", "trail points must be ordered by ply");
  return { points, convention, scalePolicy: policy };
}

function parseSquareSet(value: unknown): SquareSetOperand {
  const item = exact(value, ["squares", "brush", "owner", "ordered", "caption"], [], "square_set");
  if (!Array.isArray(item.squares) || item.squares.length === 0) throw new PresentationError("PRESENTATION_INVALID", "a square set lights at least one square; empty is an abstention");
  const squares = item.squares.map((square, index) => squareName(square, `squares[${index}]`));
  if (new Set(squares).size !== squares.length) throw new PresentationError("PRESENTATION_INVALID", "square set squares are deduplicated at construction");
  if (item.ordered !== false) throw new PresentationError("PRESENTATION_INVALID", "a square set is never ordered");
  const owner = exact(item.owner, ["factRef"], [], "owner");
  return { squares, brush: oneOf(item.brush, MARK_BRUSHES, "brush"), owner: { factRef: digestText(owner.factRef, "owner.factRef") }, ordered: false, caption: parseFactStatement(item.caption) };
}

function parseMovePath(value: unknown): MovePathOperand {
  const item = exact(value, ["plies", "answerDistance", "origin"], ["convention"], "move_path");
  if (!Array.isArray(item.plies) || item.plies.length === 0) throw new PresentationError("PRESENTATION_INVALID", "a move path has at least one ply");
  const plies = item.plies.map((ply, index) => { const entry = exact(ply, ["ply", "san", "uci"], [], `plies[${index}]`); return { ply: nonNegative(entry.ply, "ply"), san: text(entry.san, "san"), uci: uciMove(entry.uci, "uci") }; });
  const origin = oneOf(item.origin, ["recorded", "authored", "learner_played"], "origin");
  if (origin !== "learner_played" && item.convention === undefined) throw new PresentationError("PRESENTATION_INVALID", "a recorded or authored path carries its convention");
  return { plies, answerDistance: oneOf(item.answerDistance, ANSWER_DISTANCES, "answerDistance"), origin, ...(item.convention === undefined ? {} : { convention: parseConvention(item.convention) }) };
}

function parseRelationOverlay(value: unknown): RelationOverlayOperand {
  const item = exact(value, ["nodes", "edges", "owner", "answerDistance"], ["convention"], "relation_overlay");
  if (!Array.isArray(item.nodes) || item.nodes.length === 0 || !Array.isArray(item.edges) || item.edges.length === 0) throw new PresentationError("PRESENTATION_INVALID", "a relation overlay has nodes and at least one retained edge");
  const nodes = item.nodes.map((node, index) => {
    const entry = exact(node, ["square", "emphasis"], ["role", "color"], `nodes[${index}]`);
    return { square: squareName(entry.square, "node.square"), emphasis: oneOf(entry.emphasis, ["source", "target", "screen", "context"], "emphasis"), ...(entry.role === undefined ? {} : { role: oneOf(entry.role, ["pawn", "knight", "bishop", "rook", "queen", "king"] as Role[], "role") }), ...(entry.color === undefined ? {} : { color: oneOf(entry.color, ["white", "black"] as Color[], "color") }) };
  });
  const members = new Set(nodes.map((node) => node.square));
  if (members.size !== nodes.length) throw new PresentationError("PRESENTATION_INVALID", "relation nodes repeat a square");
  const edges = item.edges.map((edge, index) => {
    const entry = exact(edge, ["from", "to", "relation", "sign"], [], `edges[${index}]`);
    const from = squareName(entry.from, "edge.from"), to = squareName(entry.to, "edge.to");
    // §3.6a: an edge endpoint is always a retained node; the renderer invents no square.
    if (!members.has(from) || !members.has(to) || from === to) throw new PresentationError("PRESENTATION_INVALID", "a relation edge joins two distinct retained nodes");
    return { from, to, relation: oneOf(entry.relation, BOARD_RELATION_KINDS, "relation"), sign: oneOf(entry.sign, ["state", "gained", "lost"], "sign") };
  });
  const owner = exact(item.owner, ["factRef"], [], "owner");
  return { nodes, edges, owner: { factRef: digestText(owner.factRef, "owner.factRef") }, answerDistance: oneOf(item.answerDistance, ANSWER_DISTANCES, "answerDistance"), ...(item.convention === undefined ? {} : { convention: parseConvention(item.convention) }) };
}

function parseCount(value: unknown): CountWithDenominatorOperand {
  const item = exact(value, ["numerator", "denominator", "denominatorMeaning"], ["floor"], "count_with_denominator");
  const numerator = nonNegative(item.numerator, "numerator"), denominator = nonNegative(item.denominator, "denominator");
  if (numerator > denominator) throw new PresentationError("PRESENTATION_INVALID", "a numerator never exceeds its denominator");
  const floor = item.floor === undefined ? undefined : (() => { const entry = exact(item.floor, ["threshold", "met"], [], "floor"); const threshold = nonNegative(entry.threshold, "floor.threshold"); if (entry.met !== denominator >= threshold) throw new PresentationError("PRESENTATION_INVALID", "floor.met disagrees with the denominator"); return { threshold, met: entry.met as boolean }; })();
  return { numerator, denominator, denominatorMeaning: oneOf(item.denominatorMeaning, Object.keys(DENOMINATOR_MEANINGS) as DenominatorMeaningId[], "denominatorMeaning"), ...(floor === undefined ? {} : { floor }) };
}

function parseStructuredDocument(value: unknown): StructuredDocumentOperand {
  const item = exact(value, ["schemaId", "document", "canonicalBytes", "digest"], [], "structured_document");
  const schemaId = oneOf(item.schemaId, Object.keys(STRUCTURED_DOCUMENT_SCHEMAS) as StructuredDocumentSchemaId[], "schemaId");
  const document = exact(item.document, STRUCTURED_DOCUMENT_SCHEMAS[schemaId].fields, [], `${schemaId} document`) as Readonly<Record<string, PresentationJsonValue>>;
  const canonicalBytes = canonicalizeJson(document);
  if (canonicalBytes !== item.canonicalBytes) throw new PresentationError("PRESENTATION_INVALID", "structured document canonical bytes disagree with the document");
  if (presentationDigest("presentation.structured_document@1", { schemaId, canonicalBytes }) !== item.digest) throw new PresentationError("PRESENTATION_INVALID", "structured document digest mismatch");
  return { schemaId, document: deepFreeze(JSON.parse(canonicalBytes) as Readonly<Record<string, PresentationJsonValue>>), canonicalBytes, digest: item.digest as string };
}

const COMPONENT_PARSERS: { readonly [C in ComponentId]: (value: unknown) => ComponentOperandMap[C] } = Object.freeze({
  magnitude: parseMagnitude,
  fact_statement: parseFactStatement,
  abstention: parseAbstention,
  claim: parseClaim,
  citation: parseCitation,
  enum_state: parseEnumState,
  distribution: parseDistribution,
  outcome_split: parseOutcomeSplit,
  magnitude_trail: parseMagnitudeTrail,
  square_set: parseSquareSet,
  move_path: parseMovePath,
  relation_overlay: parseRelationOverlay,
  count_with_denominator: parseCount,
  structured_document: parseStructuredDocument,
});

function parseComponent(value: unknown): ComponentValue {
  const item = exact(value, ["id", "operand"], [], "component");
  const id = oneOf(item.id, COMPONENT_IDS, "component id");
  const parser = COMPONENT_PARSERS[id] as (candidate: unknown) => unknown;
  return deepFreeze({ id, operand: parser(item.operand) } as ComponentValue);
}

// ---------------------------------------------------------------------------------------------
// §2.2 — the sealed item, the two seals, and the equivalent sentence
// ---------------------------------------------------------------------------------------------

export interface PresentedEvidenceRef {
  readonly producer: VersionedEvidenceId;
  readonly projection: VersionedEvidenceId;
  readonly evidenceDigest: string;
}
export interface PresentedAdapterRef { readonly consumer: VersionedEvidenceId; readonly projection: VersionedEvidenceId }

/**
 * One sealed presented item: `{ evidenceRef, adapter, component, componentDigest }`. An abstention
 * has no evidence item (`evidenceRef: null`); its owner is the operation that asked the question.
 */
export interface PresentedEvidenceItem {
  readonly evidenceRef: PresentedEvidenceRef | null;
  readonly adapter: PresentedAdapterRef;
  readonly component: ComponentValue;
  readonly componentDigest: string;
}

const PROCESS_PRESENTED = new WeakSet<object>();
const PROCESS_OWNERS = new WeakMap<object, object>();
const CLIENT_PRESENTED = new WeakSet<object>();

const adapterKey = (consumer: VersionedEvidenceId, projection: VersionedEvidenceId): string => `${consumer.id}@${consumer.version}\u0000${projection.id}@${projection.version}`;
const refKey = (value: VersionedEvidenceId): string => `${value.id}@${value.version}`;

function itemImage(item: Omit<PresentedEvidenceItem, "componentDigest">): unknown {
  return { evidenceRef: item.evidenceRef, adapter: item.adapter, component: item.component };
}

function buildItem(evidenceRef: PresentedEvidenceRef | null, adapter: PresentedAdapterRef, component: ComponentValue): PresentedEvidenceItem {
  const frozenComponent = deepFreeze(jsonClone(component));
  // The sentence is computed (and raw-id guarded) before anything is sealed.
  assertPresentationText(componentSentence(frozenComponent));
  const body = { evidenceRef: evidenceRef === null ? null : deepFreeze(jsonClone(evidenceRef)), adapter: deepFreeze(jsonClone(adapter)), component: frozenComponent };
  return Object.freeze({ ...body, componentDigest: presentationDigest("presentation.component@1", itemImage(body)) });
}

/**
 * Package-internal issuer: seals one item to its admitted owner (a sealed evidence item or the
 * sealed operation that asked an abstention question). Absent from the package barrel.
 */
export function sealPresentedItemForOwner(owner: object, evidenceRef: PresentedEvidenceRef | null, adapter: PresentedAdapterRef, component: ComponentValue): PresentedEvidenceItem {
  const item = buildItem(evidenceRef, adapter, component);
  PROCESS_PRESENTED.add(item);
  PROCESS_OWNERS.set(item, owner);
  return item;
}

/** Asserts a process-sealed or client-sealed item; literal, spread and JSON copies fail. */
export function assertPresentedEvidenceItem(value: unknown): asserts value is PresentedEvidenceItem {
  if (typeof value !== "object" || value === null || (!PROCESS_PRESENTED.has(value) && !CLIENT_PRESENTED.has(value))) {
    throw new PresentationError("PRESENTATION_UNSEALED", "presented item was not constructed by a registered adapter or parsed from a receipt");
  }
}

/** The admitted owner of a process-sealed item (a sealed evidence item or operation authority). */
export function presentedItemOwner(item: PresentedEvidenceItem): object {
  const owner = PROCESS_OWNERS.get(item);
  if (owner === undefined) throw new PresentationError("PRESENTATION_UNSEALED", "presented item has no process-local owner");
  return owner;
}

/** The equivalent sentence of a sealed item: screen readers and provider-off deployments get these bytes. */
export function presentedSentence(item: PresentedEvidenceItem): string {
  assertPresentedEvidenceItem(item);
  return assertPresentationText(componentSentence(item.component));
}

/** Whether an item is the structurally distinct abstention component (§4c). */
export function isPresentedAbstention(item: PresentedEvidenceItem): boolean {
  assertPresentedEvidenceItem(item);
  return item.component.id === "abstention";
}

// ---------------------------------------------------------------------------------------------
// §2.2 — the exact projection-keyed adapter registry
// ---------------------------------------------------------------------------------------------

/**
 * §2.3: a named composition — several components constructed from ONE admitted fact, each serving a
 * literal subset of the binding's forms; the member forms union to exactly the binding forms.
 */
export interface PresentationComposition {
  readonly id: string;
  readonly members: readonly { readonly component: ComponentId; readonly forms: readonly EvidenceForm[] }[];
}

export interface ProjectionPresentationAdapter {
  readonly key: string;
  readonly consumer: VersionedEvidenceId;
  readonly projection: VersionedEvidenceId;
  /** The single target component, or the first member of `composition`. */
  readonly component: ComponentId;
  readonly composition?: PresentationComposition;
  readonly forms: readonly EvidenceForm[];
  /** Literal retained operand paths the constructor reads; each must be a declared projection operand. */
  readonly sourceOperands: readonly string[];
  /** Executable retention assertion names (§2.2); an adapter with none does not compile. */
  readonly assertions: readonly ("copied_byte_equal" | "mechanical_transform" | "authored_text_copied" | "retained_convention")[];
  /** One component, or exactly the composition's members in member order. */
  readonly construct: (evidence: DeclaredEvidence<unknown>) => ComponentValue | readonly ComponentValue[];
}

const V1 = (id: string): VersionedEvidenceId => Object.freeze({ id, version: 1 });

function searchConvention(evidence: DeclaredEvidence<unknown>, delivery: StockfishPositionEvaluation): ConventionReceipt {
  return {
    producer: V1("live.stockfish"),
    sourceProjection: { ...evidence.projection },
    sourceEvidenceDigest: `sha256:${evidenceValueReceipt(evidence).payloadDigest}`,
    perspective: "white",
    basis: { kind: "search", execution: {
      operation: "stockfish.position_evaluation@1",
      engine: { name: delivery.payload.engine.name, version: delivery.payload.engine.version },
      bound: delivery.payload.bound,
      generation: delivery.acquisition.generation,
      normalizedRequestDigest: delivery.acquisition.normalizedRequestDigest,
      responseDigest: delivery.acquisition.responseDigest,
    } },
  };
}

const evalPointComponent = (evidence: DeclaredEvidence<unknown>): ComponentValue => {
  const point = evidence.payload as ReviewEnginePoint;
  const delivery = point.evaluation.payload;
  const score = delivery.payload.score;
  return { id: "magnitude", operand: { value: score.kind === "centipawns" ? score.value : score.side === "white" ? score.distance : -score.distance, unit: { kind: score.kind === "centipawns" ? "centipawn" : "mate_in" }, convention: searchConvention(evidence, delivery), saturated: false } };
};
const evalDeltaComponent = (evidence: DeclaredEvidence<unknown>): ComponentValue => {
  const delta = evidence.payload as ReviewEvalDelta;
  return { id: "magnitude", operand: { value: delta.deltaCp, unit: { kind: "centipawn" }, convention: searchConvention(evidence, delta.after.payload.evaluation.payload), saturated: false } };
};
const mateTransitionComponent = (evidence: DeclaredEvidence<unknown>): ComponentValue => {
  const transition = evidence.payload as ReviewMateTransition;
  const after = transition.after.payload.evaluation.payload.payload;
  const before = transition.before.payload.evaluation.payload.payload;
  return { id: "fact_statement", operand: factStatement("review.mate_transition@1", "declared_convention", "review-mate-transition@1", { changes: [...transition.changes], before: before.score, after: after.score, engine: { name: after.engine.name, version: after.engine.version }, bound: after.bound }) };
};
const wdlPointComponent = (evidence: DeclaredEvidence<unknown>): ComponentValue => {
  const point = evidence.payload as ReviewWdlPoint;
  const normalized = point.normalized.payload;
  const source = normalized.source.payload.payload;
  return { id: "fact_statement", operand: factStatement("review.wdl_point@1", "declared_convention", "review-wdl-white@1", { win: normalized.win, draw: normalized.draw, loss: normalized.loss, engine: { name: source.engine.name, version: source.engine.version }, bound: source.bound }) };
};
const fact = <R extends FactStatementRendererId>(rendererId: R, binding: "recorded_run" | "declared_convention", convention: PresentationConventionId, read: (payload: unknown) => FactOperandsByRenderer[R]) => (evidence: DeclaredEvidence<unknown>): ComponentValue => ({ id: "fact_statement", operand: factStatement(rendererId, binding, convention, read(evidence.payload)) });

const PIVOTAL_PROJECTIONS = Object.freeze(["derived.pivotal.irreversibility", "derived.pivotal.phase_change", "derived.pivotal.human_divergence", "derived.pivotal.option_collapse"]);

/** The grounding the compiled manifest declares for one projection (never caller-chosen). */
function declaredGrounding(projection: VersionedEvidenceId): EvidenceGrounding {
  const declared = PRIMARY_EVIDENCE_MANIFEST.projections.find((candidate) => candidate.id === projection.id && candidate.version === projection.version);
  if (declared === undefined) throw new PresentationError("PRESENTATION_UNREGISTERED", `${refKey(projection)} is not a compiled projection`);
  return declared.grounding;
}

/** One adapter row before keying; the group files (play, inspector, consumer) return these. */
export type AdapterSpec = Omit<ProjectionPresentationAdapter, "key">;

/**
 * The construction kit handed to every group's adapter factory (dependency injection: the group
 * files import only types from this module, so the registry has no import cycle). Every helper
 * derives provenance from the admitted evidence item itself; none accepts caller prose.
 */
export interface PresentationKit {
  readonly fact: <R extends FactStatementRendererId>(rendererId: R, binding: "recorded_run" | "declared_convention", convention: PresentationConventionId, operands: FactOperandsByRenderer[R]) => FactStatementOperand;
  /** `sha256:<payload digest>` of one sealed evidence item — the owner reference of its components. */
  readonly factRef: (evidence: DeclaredEvidence<unknown>) => string;
  readonly convention: (evidence: DeclaredEvidence<unknown>, basis: ConventionBasis, perspective: ConventionReceipt["perspective"]) => ConventionReceipt;
  readonly declared: (evidence: DeclaredEvidence<unknown>, convention: PresentationConventionId, perspective?: ConventionReceipt["perspective"]) => ConventionReceipt;
  readonly searchConvention: (evidence: DeclaredEvidence<unknown>, delivery: StockfishPositionEvaluation) => ConventionReceipt;
  /** A deduplicated square set owned by the evidence item, captioned by a sealed fact statement. */
  readonly squareSet: (evidence: DeclaredEvidence<unknown>, squares: readonly SquareName[], brush: MarkBrush, caption: FactStatementOperand) => ComponentValue;
  readonly structuredDocument: (schemaId: StructuredDocumentSchemaId, document: Readonly<Record<string, PresentationJsonValue>>) => StructuredDocumentOperand;
  readonly grounding: (projection: VersionedEvidenceId) => EvidenceGrounding;
  /** §3.8: a payload that IS a `CitationOperand` (`derived.citation.attribution@1`), through the exact citation parser. */
  readonly citation: (evidence: DeclaredEvidence<unknown>) => CitationOperand;
}

const KIT: PresentationKit = Object.freeze({
  fact: factStatement,
  factRef: (evidence: DeclaredEvidence<unknown>) => `sha256:${evidenceValueReceipt(evidence).payloadDigest}`,
  convention: (evidence: DeclaredEvidence<unknown>, basis: ConventionBasis, perspective: ConventionReceipt["perspective"]): ConventionReceipt => ({
    producer: { ...evidence.producer }, sourceProjection: { ...evidence.projection }, sourceEvidenceDigest: `sha256:${evidenceValueReceipt(evidence).payloadDigest}`, perspective, basis,
  }),
  declared: (evidence: DeclaredEvidence<unknown>, convention: PresentationConventionId, perspective: ConventionReceipt["perspective"] = "not_applicable"): ConventionReceipt => ({
    producer: { ...evidence.producer }, sourceProjection: { ...evidence.projection }, sourceEvidenceDigest: `sha256:${evidenceValueReceipt(evidence).payloadDigest}`, perspective, basis: { kind: "declared", convention },
  }),
  searchConvention,
  squareSet: (evidence: DeclaredEvidence<unknown>, squares: readonly SquareName[], brush: MarkBrush, caption: FactStatementOperand): ComponentValue => ({
    id: "square_set",
    operand: { squares: [...new Set(squares)], brush, owner: { factRef: `sha256:${evidenceValueReceipt(evidence).payloadDigest}` }, ordered: false, caption },
  }),
  structuredDocument: (schemaId: StructuredDocumentSchemaId, document: Readonly<Record<string, PresentationJsonValue>>): StructuredDocumentOperand => {
    const canonicalBytes = canonicalizeJson(withoutUndefined(document));
    return parseStructuredDocument({ schemaId, document, canonicalBytes, digest: presentationDigest("presentation.structured_document@1", { schemaId, canonicalBytes }) });
  },
  grounding: declaredGrounding,
  citation: (evidence: DeclaredEvidence<unknown>): CitationOperand => {
    assertDeclaredEvidence(evidence);
    return deepFreeze(parseCitation(jsonClone(evidence.payload)));
  },
});
const adapter = (spec: AdapterSpec): ProjectionPresentationAdapter => {
  if (spec.composition !== undefined) {
    const members = spec.composition.members;
    if (members.length < 2 || members[0]!.component !== spec.component) throw new PresentationError("PRESENTATION_UNREGISTERED", `${spec.composition.id} must list at least two members, led by its component`);
    const union = new Set(members.flatMap((member) => member.forms));
    if (union.size !== spec.forms.length || spec.forms.some((form) => !union.has(form))) throw new PresentationError("PRESENTATION_UNREGISTERED", `${spec.composition.id} member forms do not union to the adapter forms`);
    for (const member of members) for (const form of member.forms) if (!(COMPONENT_DECLARATIONS[member.component].forms as readonly EvidenceForm[]).includes(form)) throw new PresentationError("PRESENTATION_UNREGISTERED", `${member.component} cannot serve ${form}`);
  } else {
    for (const form of spec.forms) if (!(COMPONENT_DECLARATIONS[spec.component].forms as readonly EvidenceForm[]).includes(form)) throw new PresentationError("PRESENTATION_UNREGISTERED", `${refKey(spec.consumer)} × ${refKey(spec.projection)}: ${spec.component} cannot serve ${form}`);
  }
  return Object.freeze({
    ...spec, key: adapterKey(spec.consumer, spec.projection), forms: Object.freeze([...spec.forms]), sourceOperands: Object.freeze([...spec.sourceOperands]), assertions: Object.freeze([...spec.assertions]),
    ...(spec.composition === undefined ? {} : { composition: Object.freeze({ id: spec.composition.id, members: Object.freeze(spec.composition.members.map((member) => Object.freeze({ component: member.component, forms: Object.freeze([...member.forms]) }))) }) }),
  });
};

/** The component ids one adapter may construct, in order. */
export function adapterComponents(entry: ProjectionPresentationAdapter): readonly ComponentId[] {
  return entry.composition === undefined ? [entry.component] : entry.composition.members.map((member) => member.component);
}

const REVIEW_STORY = V1("review.story");
const REVIEW_MAP = V1("module.review_map");
const STORY_FORMS: readonly EvidenceForm[] = Object.freeze(["sentence", "panel"]);

/** Checkpoint A's exact adapter population (keyed consumer × projection; sorted, frozen). */
export const PRESENTATION_ADAPTERS: readonly ProjectionPresentationAdapter[] = Object.freeze([
  // review.story@1 — Story compatibility (rfc/review-evidence-compiler.md §5)
  ...PIVOTAL_PROJECTIONS.map((id) => adapter({ consumer: REVIEW_STORY, projection: V1(id), component: "fact_statement", forms: ["sentence", "timeline_marker", "panel"], sourceOperands: ["nodeId", "kind", "detail", "provenanceNote"], assertions: ["copied_byte_equal", "mechanical_transform"], construct: fact("story.pivotal_marker@1", "declared_convention", "story-compatibility@1", (payload) => payload as PivotalMarker) })),
  adapter({ consumer: REVIEW_STORY, projection: V1("theory.shapes.firing"), component: "fact_statement", forms: ["sentence", "timeline_marker", "panel"], sourceOperands: ["entryId"], assertions: ["copied_byte_equal"], construct: fact("story.shape_firing@1", "declared_convention", "story-compatibility@1", (payload) => ({ entryId: (payload as ShapeFiring).entryId })) }),
  adapter({ consumer: REVIEW_STORY, projection: V1("run.record.consequence"), component: "fact_statement", forms: ["sentence", "timeline_marker", "panel"], sourceOperands: ["terminal", "outcome"], assertions: ["copied_byte_equal"], construct: fact("story.consequence@1", "recorded_run", "recorded-run@1", (payload) => { const value = payload as { readonly terminal: boolean; readonly outcome?: RunOutcome; readonly plies?: number; readonly objectiveState?: ObjectiveState }; return value.terminal ? { terminal: true, outcome: value.outcome! } : { terminal: false, plies: value.plies!, objectiveState: value.objectiveState! }; }) }),
  adapter({ consumer: REVIEW_STORY, projection: V1("run.record.imported_result"), component: "fact_statement", forms: STORY_FORMS, sourceOperands: ["result"], assertions: ["copied_byte_equal"], construct: fact("story.imported_result@1", "recorded_run", "recorded-run@1", (payload) => ({ result: (payload as { readonly result: PgnResultToken }).result })) }),
  adapter({ consumer: REVIEW_STORY, projection: V1("rules.endgame.classification"), component: "fact_statement", forms: STORY_FORMS, sourceOperands: ["fen", "type", "conventionId", "provenanceNote"], assertions: ["copied_byte_equal"], construct: fact("story.endgame_classification@1", "declared_convention", "story-compatibility@1", (payload) => payload as EndgameClassification) }),
  adapter({ consumer: REVIEW_STORY, projection: V1("derived.review.eval_delta"), component: "magnitude", forms: ["list", "panel", "sentence"], sourceOperands: ["before", "after", "deltaCp"], assertions: ["copied_byte_equal", "retained_convention"], construct: evalDeltaComponent }),
  adapter({ consumer: REVIEW_STORY, projection: V1("derived.review.mate_transition"), component: "fact_statement", forms: ["list", "panel", "sentence"], sourceOperands: ["before", "after", "changes"], assertions: ["copied_byte_equal", "retained_convention"], construct: mateTransitionComponent }),
  adapter({ consumer: REVIEW_STORY, projection: V1("derived.story.last_level"), component: "fact_statement", forms: STORY_FORMS, sourceOperands: ["recordedResult", "evaluation"], assertions: ["mechanical_transform"], construct: fact("story.last_level@1", "declared_convention", "story-last-level@1", (payload) => ({ learnerCentipawns: (payload as { readonly evaluation: { readonly learnerCentipawns: number } }).evaluation.learnerCentipawns })) }),
  adapter({ consumer: REVIEW_STORY, projection: V1("derived.story.title"), component: "fact_statement", forms: STORY_FORMS, sourceOperands: ["title"], assertions: ["copied_byte_equal"], construct: fact("story.title@1", "declared_convention", "story-compatibility@1", (payload) => ({ title: (payload as { readonly title: string }).title })) }),
  // module.review_map@1 — the Review Map evidence panel seat (module-registration A5 slice)
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.review.eval_point"), component: "magnitude", forms: ["list", "panel"], sourceOperands: ["position", "evaluation"], assertions: ["copied_byte_equal", "retained_convention"], construct: evalPointComponent }),
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.review.eval_delta"), component: "magnitude", forms: ["list", "panel"], sourceOperands: ["before", "after", "deltaCp"], assertions: ["copied_byte_equal", "retained_convention"], construct: evalDeltaComponent }),
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.review.mate_transition"), component: "fact_statement", forms: ["list", "panel"], sourceOperands: ["before", "after", "changes"], assertions: ["copied_byte_equal", "retained_convention"], construct: mateTransitionComponent }),
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.review.wdl_point"), component: "fact_statement", forms: ["list", "panel"], sourceOperands: ["position", "normalized"], assertions: ["copied_byte_equal", "mechanical_transform", "retained_convention"], construct: wdlPointComponent }),
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.grade.move_quality"), component: "fact_statement", forms: ["panel"], sourceOperands: ["klass", "arm", "before", "after", "dropWinPercent", "thresholdCrossed", "convention", "engineId", "lane", "depthOrMovetime"], assertions: ["copied_byte_equal"], construct: fact("module.move_quality_grade@1", "declared_convention", "grade-convention@1", (payload) => payload as MoveQualityGrade) }),
  ...(Object.keys(RECORDED_RELATION_LABELS) as RecordedRelationLabelId[]).map((id) => adapter({ consumer: REVIEW_MAP, projection: Object.freeze({ id, version: 2 }), component: "fact_statement", forms: ["list", "panel"], sourceOperands: [], assertions: ["mechanical_transform"], construct: fact("module.recorded_relation@1", "declared_convention", "recorded-semantic-path@1", () => ({ relation: id, grounding: declaredGrounding({ id, version: 2 }) })) })),
  // guidance.authored_claim@1 — the [[D1673]] vertical slice
  adapter({ consumer: V1("guidance.authored_claim"), projection: V1("pack.authored.claim_delivery"), component: "claim", forms: ["sentence", "panel"], sourceOperands: ["text", "binding", "evidenceTypes", "earnedEvidenceTypes", "principles"], assertions: ["authored_text_copied"], construct: (evidence) => {
    const item = evidence.payload as { readonly text: string; readonly binding: ClaimBinding; readonly evidenceTypes: readonly ClaimEvidenceType[]; readonly earnedEvidenceTypes: readonly ClaimEvidenceType[]; readonly principles: readonly { readonly name: string; readonly statement: string; readonly counterCase: string }[] };
    return { id: "claim", operand: { text: item.text, binding: item.binding, evidenceTypes: [...item.evidenceTypes], earnedEvidenceTypes: [...item.earnedEvidenceTypes], principles: item.principles.map((principle) => ({ name: principle.name, statement: principle.statement, counterCase: principle.counterCase })) } };
  } }),
  // Checkpoint B: the module seats (module-registration A5), the Inspector surface and the
  // remaining ordinary/author consumer pairs, each group keyed by its exact consumer × projection.
  ...playAdapterSpecs(KIT).map(adapter),
  ...inspectorAdapterSpecs(KIT).map(adapter),
  ...consumerAdapterSpecs(KIT).map(adapter),
].sort((left, right) => left.key.localeCompare(right.key)));

const ADAPTERS_BY_KEY: ReadonlyMap<string, ProjectionPresentationAdapter> = new Map(PRESENTATION_ADAPTERS.map((entry) => [entry.key, entry]));
if (ADAPTERS_BY_KEY.size !== PRESENTATION_ADAPTERS.length) throw new PresentationError("PRESENTATION_UNREGISTERED", "duplicate presentation adapter key");
for (const entry of PRESENTATION_ADAPTERS) if (entry.assertions.length === 0) throw new PresentationError("PRESENTATION_UNREGISTERED", `${entry.key} declares no retention assertion`);

/** Selection-only bindings with no visual component (§2.3, [[D2048]]); presenting them is refused. */
export const PRESENTATION_SELECTION_ONLY: readonly string[] = Object.freeze([adapterKey(REVIEW_STORY, V1("derived.story.rank"))]);

export function presentationAdapter(consumer: VersionedEvidenceId, projection: VersionedEvidenceId): ProjectionPresentationAdapter | undefined {
  return ADAPTERS_BY_KEY.get(adapterKey(consumer, projection));
}

/**
 * The one production construction path: a real `ConsumerEvidenceView` → exact adapters → sealed
 * items owned by their admitted evidence. A missing adapter is a build failure, never a fallback.
 */
export function presentEvidenceItems(view: ConsumerEvidenceView<unknown>): readonly PresentedEvidenceItem[] {
  assertConsumerEvidenceView(view);
  return Object.freeze(view.items.flatMap((evidence) => {
    assertDeclaredEvidence(evidence);
    const key = adapterKey(view.consumer, evidence.projection);
    if (PRESENTATION_SELECTION_ONLY.includes(key)) return [];
    const entry = ADAPTERS_BY_KEY.get(key);
    if (entry === undefined) throw new PresentationError("PRESENTATION_UNREGISTERED", `no presentation adapter for ${view.consumer.id}@${view.consumer.version} × ${refKey(evidence.projection)}`);
    const constructed = entry.construct(evidence);
    const components: readonly ComponentValue[] = Array.isArray(constructed) ? constructed : [constructed as ComponentValue];
    const expected = adapterComponents(entry);
    if (components.length !== expected.length || components.some((component, index) => component.id !== expected[index])) throw new PresentationError("PRESENTATION_INVALID", `${entry.key} constructed ${components.map((component) => component.id).join("+")}, not ${expected.join("+")}`);
    const evidenceRef: PresentedEvidenceRef = { producer: { ...evidence.producer }, projection: { ...evidence.projection }, evidenceDigest: `sha256:${evidenceValueReceipt(evidence).payloadDigest}` };
    return components.map((component) => sealPresentedItemForOwner(evidence, evidenceRef, { consumer: { ...view.consumer }, projection: { ...evidence.projection } }, component));
  }));
}

/**
 * [[D3102]]: a citation's text is READ from the exact retained field of one sealed evidence value —
 * never supplied — and bound by the digest of that value. Source attribution is supplied by the
 * registered resolver (rfc/evidence-presentation.md §3.8); missing licence/revision abstains upstream.
 */
export function citationFromEvidence(evidence: DeclaredEvidence<unknown>, field: string, kind: CitationOperand["content"]["kind"], source: CitationOperand["source"]): CitationOperand {
  assertDeclaredEvidence(evidence);
  const payload = evidence.payload as Readonly<Record<string, unknown>>;
  if (!isRecord(payload) || !Object.hasOwn(payload, field)) throw new PresentationError("PRESENTATION_INVALID", `citation field ${field} is not retained by ${refKey(evidence.projection)}`);
  const value = text(payload[field], `citation field ${field}`);
  return deepFreeze(parseCitation({
    content: { kind, text: value, binding: { projection: { ...evidence.projection }, field, evidenceDigest: `sha256:${evidenceValueReceipt(evidence).payloadDigest}`, valueDigest: presentationDigest("presentation.citation.value@1", value) } },
    source,
  }));
}

// ---------------------------------------------------------------------------------------------
// §2.2 — the closed presentation.receipt@1 wire and its exact parser
// ---------------------------------------------------------------------------------------------

export interface PresentationReceiptItem {
  readonly evidenceRef: PresentedEvidenceRef | null;
  readonly adapter: PresentedAdapterRef;
  readonly component: ComponentValue;
  readonly componentDigest: string;
}
export interface PresentationReceipt {
  readonly protocol: "presentation.receipt@1";
  readonly items: readonly PresentationReceiptItem[];
  readonly digest: string;
}

/** Registered abstention seats: adapter keys whose owning operation may state an absence. */
const ABSTENTION_ADAPTER_PROJECTIONS: ReadonlySet<string> = new Set(["review.packet_family@1"]);

/** Serializes process-sealed items (owner asserted) into the closed version-1 receipt. */
export function serializePresentedEvidence(items: readonly PresentedEvidenceItem[]): PresentationReceipt {
  const body = items.map((item) => {
    if (!PROCESS_PRESENTED.has(item) || !PROCESS_OWNERS.has(item)) throw new PresentationError("PRESENTATION_UNSEALED", "only process-sealed, owner-bound items serialize");
    return jsonClone({ evidenceRef: item.evidenceRef, adapter: item.adapter, component: item.component, componentDigest: item.componentDigest }) as PresentationReceiptItem;
  });
  return deepFreeze({ protocol: "presentation.receipt@1" as const, items: body, digest: presentationDigest("presentation.receipt@1", body) });
}

/**
 * The exact client parser: unknown/extra fields, digest mismatch, an unregistered adapter tuple, a
 * component swap and an invalid operand fail; the result carries a NEW client-local seal.
 */
export function parsePresentationReceipt(value: unknown): readonly PresentedEvidenceItem[] {
  const receipt = exact(value, ["protocol", "items", "digest"], [], "presentation receipt");
  if (receipt.protocol !== "presentation.receipt@1") throw new PresentationError("PRESENTATION_INVALID", "unknown presentation receipt protocol");
  if (!Array.isArray(receipt.items)) throw new PresentationError("PRESENTATION_INVALID", "receipt items must be an array");
  const items = receipt.items.map((candidate, index) => {
    const row = exact(candidate, ["evidenceRef", "adapter", "component", "componentDigest"], [], `receipt item ${index}`);
    const adapterRow = exact(row.adapter, ["consumer", "projection"], [], "adapter");
    const adapterRef: PresentedAdapterRef = { consumer: versioned(adapterRow.consumer, "adapter.consumer"), projection: versioned(adapterRow.projection, "adapter.projection") };
    const component = parseComponent(row.component);
    let evidenceRef: PresentedEvidenceRef | null;
    if (component.id === "abstention") {
      if (row.evidenceRef !== null || !ABSTENTION_ADAPTER_PROJECTIONS.has(refKey(adapterRef.projection))) throw new PresentationError("PRESENTATION_INVALID", "an abstention is owned by a registered question seat and carries no evidence");
      evidenceRef = null;
    } else {
      const entry = ADAPTERS_BY_KEY.get(adapterKey(adapterRef.consumer, adapterRef.projection));
      if (entry === undefined) throw new PresentationError("PRESENTATION_UNREGISTERED", `unregistered adapter ${refKey(adapterRef.consumer)} × ${refKey(adapterRef.projection)}`);
      if (!adapterComponents(entry).includes(component.id)) throw new PresentationError("PRESENTATION_INVALID", `${entry.key} serves ${adapterComponents(entry).join("+")}, not ${component.id}`);
      const ref = exact(row.evidenceRef, ["producer", "projection", "evidenceDigest"], [], "evidenceRef");
      evidenceRef = { producer: versioned(ref.producer, "evidenceRef.producer"), projection: versioned(ref.projection, "evidenceRef.projection"), evidenceDigest: digestText(ref.evidenceDigest, "evidenceRef.evidenceDigest") };
      if (refKey(evidenceRef.projection) !== refKey(adapterRef.projection)) throw new PresentationError("PRESENTATION_INVALID", "evidence projection and adapter projection disagree");
    }
    const item = buildItem(evidenceRef, adapterRef, component);
    if (item.componentDigest !== row.componentDigest) throw new PresentationError("PRESENTATION_INVALID", "component digest mismatch");
    return item;
  });
  const expected = presentationDigest("presentation.receipt@1", items.map((item) => jsonClone({ evidenceRef: item.evidenceRef, adapter: item.adapter, component: item.component, componentDigest: item.componentDigest })));
  if (expected !== receipt.digest) throw new PresentationError("PRESENTATION_INVALID", "presentation receipt digest mismatch");
  for (const item of items) CLIENT_PRESENTED.add(item);
  return Object.freeze(items);
}

/** The package-internal abstention seat key; `review.packet_family@1` is owned by the Review packet. */
export const REVIEW_PACKET_FAMILY_SEAT: VersionedEvidenceId = V1("review.packet_family");

/**
 * The strict component parser and its equivalent sentence, for component-level tests and the
 * client component renderers' state matrix (§8.3, criterion 17). Parsing seals nothing: only an
 * exact adapter or the receipt parser produces a `PresentedEvidenceItem`.
 */
export function parseComponentValue(value: unknown): ComponentValue {
  return parseComponent(value);
}
export function componentValueSentence(value: ComponentValue): string {
  return assertPresentationText(componentSentence(parseComponent(jsonClone(value))));
}
/** A fact-statement operand recomputed from its registered renderer (unsealed; for component tests). */
export function factStatementOperand<R extends FactStatementRendererId>(rendererId: R, binding: "recorded_run" | "declared_convention", convention: PresentationConventionId, operands: FactOperandsByRenderer[R]): FactStatementOperand {
  return factStatement(rendererId, binding, convention, operands);
}
