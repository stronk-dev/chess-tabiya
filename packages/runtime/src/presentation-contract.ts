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

import { renderEndgameClassification, type EndgameClassification } from "./endgame.js";
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
import type { ObjectiveState, RunOutcome } from "./types.js";

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
  /** Checkpoint A honesty: whether this landing ships the runtime operand parser and renderer. */
  readonly checkpointA: "implemented" | "declared_only";
}

const declaration = (value: ComponentDeclaration): ComponentDeclaration => Object.freeze({ ...value, forms: Object.freeze([...value.forms]), tokens: Object.freeze([...value.tokens]) });

/** Exactly the fourteen §3 ids, frozen; every member declares all eight fields (criterion 1). */
export const COMPONENT_DECLARATIONS: Readonly<Record<ComponentId, ComponentDeclaration>> = Object.freeze({
  distribution: declaration({ id: "distribution", renders: "Ranked candidate moves with their share of a stated population or model output.", operand: "DistributionOperand", convention: "required", emptyBehavior: "unavailable_source", forms: ["list", "panel", "sentence"], equivalentSentence: "renderDistributionSentence", tokens: ["ink", "muted", "line", "accent"], checkpointA: "declared_only" }),
  outcome_split: declaration({ id: "outcome_split", renders: "The three-way result share of a set of games from a stated perspective.", operand: "OutcomeSplitOperand", convention: "required", emptyBehavior: "unavailable_source", forms: ["list", "panel", "sentence"], equivalentSentence: "renderOutcomeSplitSentence", tokens: ["accent", "muted", "line", "ink"], checkpointA: "declared_only" }),
  magnitude: declaration({ id: "magnitude", renders: "One measured number with its unit, perspective and bound.", operand: "MagnitudeOperand", convention: "required", emptyBehavior: "stated_absence", forms: ["list", "panel", "sentence", "timeline_marker"], equivalentSentence: "renderMagnitudeSentence", tokens: ["ink", "muted"], checkpointA: "implemented" }),
  magnitude_trail: declaration({ id: "magnitude_trail", renders: "How one measured quantity moved across a branch.", operand: "MagnitudeTrailOperand", convention: "required", emptyBehavior: "stated_absence", forms: ["list", "panel", "timeline_marker"], equivalentSentence: "renderMagnitudeTrailSentence", tokens: ["ink", "muted", "line", "accent"], checkpointA: "declared_only" }),
  square_set: declaration({ id: "square_set", renders: "Board squares belonging to exactly one admitted fact, with that fact's caption.", operand: "SquareSetOperand", convention: "not_applicable", emptyBehavior: "stated_absence", forms: ["list", "panel", "lit_squares", "piece_halo"], equivalentSentence: "renderSquareSetSentence", tokens: ["accent", "accent-soft", "ink"], checkpointA: "declared_only" }),
  move_path: declaration({ id: "move_path", renders: "An ordered sequence of plies.", operand: "MovePathOperand", convention: "required", emptyBehavior: "stated_absence", forms: ["list", "panel", "arrows", "sentence"], equivalentSentence: "renderMovePathSentence", tokens: ["ink", "accent", "line"], checkpointA: "declared_only" }),
  relation_overlay: declaration({ id: "relation_overlay", renders: "One admitted directed board relation and only the edges that fact retains.", operand: "RelationOverlayOperand", convention: "not_applicable", emptyBehavior: "stated_absence", forms: ["panel", "arrows", "lit_squares", "piece_halo", "sentence"], equivalentSentence: "renderRelationOverlaySentence", tokens: ["accent", "accent-soft", "line", "ink"], checkpointA: "declared_only" }),
  count_with_denominator: declaration({ id: "count_with_denominator", renders: "A numerator against the base it was drawn from.", operand: "CountWithDenominatorOperand", convention: "required", emptyBehavior: "unavailable_source", forms: ["list", "sentence", "panel"], equivalentSentence: "renderCountSentence", tokens: ["ink", "muted", "accent"], checkpointA: "declared_only" }),
  citation: declaration({ id: "citation", renders: "One cited passage or authored source with everything the licence requires.", operand: "CitationOperand", convention: "not_applicable", emptyBehavior: "unavailable_source", forms: ["list", "panel", "sentence"], equivalentSentence: "renderCitationSentence", tokens: ["ink", "muted", "line"], checkpointA: "implemented" }),
  enum_state: declaration({ id: "enum_state", renders: "One member of a closed set, as a human label.", operand: "EnumStateOperand", convention: "not_applicable", emptyBehavior: "stated_absence", forms: ["list", "sentence", "panel", "timeline_marker"], equivalentSentence: "renderEnumStateSentence", tokens: ["ink", "muted", "accent", "warning", "danger"], checkpointA: "implemented" }),
  claim: declaration({ id: "claim", renders: "An authored judgement with its ground attached.", operand: "ClaimOperand", convention: "required", emptyBehavior: "silent", forms: ["list", "panel", "sentence", "audio"], equivalentSentence: "renderClaimSentence", tokens: ["ink", "muted"], checkpointA: "implemented" }),
  fact_statement: declaration({ id: "fact_statement", renders: "A registered deterministic sentence whose meaning is present in one exact admitted projection.", operand: "FactStatementOperand", convention: "required", emptyBehavior: "stated_absence", forms: ["list", "sentence", "panel", "timeline_marker", "audio"], equivalentSentence: "renderFactStatementSentence", tokens: ["ink", "muted"], checkpointA: "implemented" }),
  abstention: declaration({ id: "abstention", renders: "The fact that there is nothing to render, and why.", operand: "AbstentionOperand", convention: "not_applicable", emptyBehavior: "stated_absence", forms: ["list", "sentence", "panel", "timeline_marker", "lit_squares", "arrows", "piece_halo", "audio"], equivalentSentence: "renderAbstentionSentence", tokens: ["muted", "line"], checkpointA: "implemented" }),
  structured_document: declaration({ id: "structured_document", renders: "A validated schema-typed object as a read-only labelled viewer.", operand: "StructuredDocumentOperand", convention: "not_applicable", emptyBehavior: "unavailable_source", forms: ["list", "panel"], equivalentSentence: "renderStructuredDocumentSentence", tokens: ["ink", "muted", "line", "panel"], checkpointA: "declared_only" }),
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
  derived_feature: { label: "board-feature detector" },
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
} as const);
export type PresentationConventionId = keyof typeof PRESENTATION_CONVENTIONS;

export type ConventionBasis =
  | { readonly kind: "search"; readonly execution: StockfishExecutionReceiptRef }
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
export interface DistributionOperand {
  readonly rows: readonly { readonly move: { readonly san: string; readonly uci: string }; readonly share: number; readonly count?: number }[];
  readonly residual: { readonly share: number; readonly label: string } | null;
  readonly convention: ConventionReceipt;
  readonly highlight: { readonly uci: string; readonly why: "learner_committed" | "position_in_view" } | null;
}
export interface OutcomeSplitOperand {
  readonly white: number; readonly draws: number; readonly black: number; readonly total: number;
  readonly perspective: "white" | "black" | "side_to_move";
  readonly convention: ConventionReceipt;
  readonly floor: { readonly threshold: number; readonly met: boolean };
}
export interface MagnitudeTrailOperand {
  readonly points: readonly { readonly plyOffset: number; readonly magnitude: MagnitudeOperand }[];
  readonly convention: ConventionReceipt;
  readonly scalePolicy: string;
}
export interface SquareSetOperand { readonly squares: readonly string[]; readonly brush: string; readonly owner: { readonly factRef: string }; readonly ordered: false }
export interface MovePathOperand { readonly plies: readonly { readonly ply: number; readonly san: string; readonly uci: string }[]; readonly convention?: ConventionReceipt; readonly answerDistance: AnswerDistance; readonly origin: "recorded" | "authored" | "learner_played" }
export interface RelationOverlayOperand {
  readonly nodes: readonly { readonly square: string; readonly emphasis: "source" | "target" | "screen" | "context" }[];
  readonly edges: readonly { readonly from: string; readonly to: string; readonly relation: string; readonly sign: "state" | "gained" | "lost" }[];
  readonly owner: { readonly factRef: string };
  readonly answerDistance: AnswerDistance;
}
export interface CountWithDenominatorOperand { readonly numerator: number; readonly denominator: number; readonly denominatorMeaning: string }
export interface StructuredDocumentOperand { readonly schemaId: string; readonly canonicalBytes: string; readonly digest: string }

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
export interface FactOperandsByRenderer {
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
const FACT_RENDERERS: { readonly [R in FactStatementRendererId]: FactRenderer<R> } = Object.freeze({
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

/** The equivalent sentence of one component, computed only from its operand (criterion 16). */
function componentSentence(component: ComponentValue): string {
  switch (component.id) {
    case "magnitude": return magnitudeSentence(component.operand);
    case "fact_statement": return component.operand.renderedText;
    case "abstention": return abstentionSentence(component.operand);
    case "claim": return claimSentence(component.operand);
    case "citation": return citationSentence(component.operand);
    case "enum_state": return (LABEL_VOCABULARIES[component.operand.vocabulary] as LabelVocabulary<string>)[component.operand.value]!.label;
    default: throw new PresentationError("PRESENTATION_UNREGISTERED", `${component.id} has no Checkpoint-A renderer`);
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
  const basisRecord = exact(item.basis, ["kind"], ["execution", "convention"], "convention.basis");
  let basis: ConventionBasis;
  if (basisRecord.kind === "search") {
    const wrapper = exact(item.basis, ["kind", "execution"], [], "convention.basis");
    const execution = exact(wrapper.execution, ["operation", "engine", "bound", "generation", "normalizedRequestDigest", "responseDigest"], [], "execution");
    if (execution.operation !== "stockfish.position_evaluation@1") throw new PresentationError("PRESENTATION_INVALID", "search execution names an unregistered operation");
    basis = { kind: "search", execution: { operation: "stockfish.position_evaluation@1", engine: parseEngine(execution.engine), bound: parseBound(execution.bound), generation: execution.generation === null ? null : safeInt(execution.generation, "generation"), normalizedRequestDigest: digestText(execution.normalizedRequestDigest, "normalizedRequestDigest"), responseDigest: digestText(execution.responseDigest, "responseDigest") } };
  } else if (basisRecord.kind === "declared") {
    const wrapper = exact(item.basis, ["kind", "convention"], [], "convention.basis");
    basis = { kind: "declared", convention: oneOf(wrapper.convention, Object.keys(PRESENTATION_CONVENTIONS) as PresentationConventionId[], "convention id") };
  } else throw new PresentationError("PRESENTATION_INVALID", "convention basis kind is outside search | declared");
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

const COMPONENT_PARSERS: Partial<{ readonly [C in ComponentId]: (value: unknown) => ComponentOperandMap[C] }> = Object.freeze({
  magnitude: parseMagnitude,
  fact_statement: parseFactStatement,
  abstention: parseAbstention,
  claim: parseClaim,
  citation: parseCitation,
  enum_state: parseEnumState,
});

function parseComponent(value: unknown): ComponentValue {
  const item = exact(value, ["id", "operand"], [], "component");
  const id = oneOf(item.id, COMPONENT_IDS, "component id");
  const parser = COMPONENT_PARSERS[id] as ((candidate: unknown) => unknown) | undefined;
  if (parser === undefined) throw new PresentationError("PRESENTATION_UNREGISTERED", `${id} is declared but not implemented at Checkpoint A`);
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

export interface ProjectionPresentationAdapter {
  readonly key: string;
  readonly consumer: VersionedEvidenceId;
  readonly projection: VersionedEvidenceId;
  readonly component: ComponentId;
  readonly forms: readonly EvidenceForm[];
  /** Literal retained operand paths the constructor reads; each must be a declared projection operand. */
  readonly sourceOperands: readonly string[];
  /** Executable retention assertion names (§2.2); an adapter with none does not compile. */
  readonly assertions: readonly ("copied_byte_equal" | "mechanical_transform" | "authored_text_copied" | "retained_convention")[];
  readonly construct: (evidence: DeclaredEvidence<unknown>) => ComponentValue;
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

type AdapterSpec = Omit<ProjectionPresentationAdapter, "key">;
const adapter = (spec: AdapterSpec): ProjectionPresentationAdapter => Object.freeze({ ...spec, key: adapterKey(spec.consumer, spec.projection), forms: Object.freeze([...spec.forms]), sourceOperands: Object.freeze([...spec.sourceOperands]), assertions: Object.freeze([...spec.assertions]) });

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
  adapter({ consumer: REVIEW_STORY, projection: V1("derived.review.eval_delta"), component: "magnitude", forms: STORY_FORMS, sourceOperands: ["before", "after", "deltaCp"], assertions: ["copied_byte_equal", "retained_convention"], construct: evalDeltaComponent }),
  adapter({ consumer: REVIEW_STORY, projection: V1("derived.review.mate_transition"), component: "fact_statement", forms: STORY_FORMS, sourceOperands: ["before", "after", "changes"], assertions: ["copied_byte_equal", "retained_convention"], construct: mateTransitionComponent }),
  adapter({ consumer: REVIEW_STORY, projection: V1("derived.story.last_level"), component: "fact_statement", forms: STORY_FORMS, sourceOperands: ["recordedResult", "evaluation"], assertions: ["mechanical_transform"], construct: fact("story.last_level@1", "declared_convention", "story-last-level@1", (payload) => ({ learnerCentipawns: (payload as { readonly evaluation: { readonly learnerCentipawns: number } }).evaluation.learnerCentipawns })) }),
  adapter({ consumer: REVIEW_STORY, projection: V1("derived.story.title"), component: "fact_statement", forms: STORY_FORMS, sourceOperands: ["title"], assertions: ["copied_byte_equal"], construct: fact("story.title@1", "declared_convention", "story-compatibility@1", (payload) => ({ title: (payload as { readonly title: string }).title })) }),
  // module.review_map@1 — the Review Map evidence panel seat (module-registration A5 slice)
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.review.eval_point"), component: "magnitude", forms: ["list", "panel"], sourceOperands: ["position", "evaluation"], assertions: ["copied_byte_equal", "retained_convention"], construct: evalPointComponent }),
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.review.eval_delta"), component: "magnitude", forms: ["list", "panel"], sourceOperands: ["before", "after", "deltaCp"], assertions: ["copied_byte_equal", "retained_convention"], construct: evalDeltaComponent }),
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.review.mate_transition"), component: "fact_statement", forms: ["list", "panel"], sourceOperands: ["before", "after", "changes"], assertions: ["copied_byte_equal", "retained_convention"], construct: mateTransitionComponent }),
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.review.wdl_point"), component: "fact_statement", forms: ["list", "panel"], sourceOperands: ["position", "normalized"], assertions: ["copied_byte_equal", "mechanical_transform", "retained_convention"], construct: wdlPointComponent }),
  adapter({ consumer: REVIEW_MAP, projection: V1("derived.grade.move_quality"), component: "fact_statement", forms: ["panel"], sourceOperands: ["klass", "arm", "before", "after", "dropWinPercent", "thresholdCrossed", "convention", "engineId", "lane", "depthOrMovetime"], assertions: ["copied_byte_equal"], construct: fact("module.move_quality_grade@1", "declared_convention", "grade-convention@1", (payload) => payload as MoveQualityGrade) }),
  ...(Object.keys(RECORDED_RELATION_LABELS) as RecordedRelationLabelId[]).map((id) => adapter({ consumer: REVIEW_MAP, projection: Object.freeze({ id, version: 2 }), component: "fact_statement", forms: ["list", "panel"], sourceOperands: [], assertions: ["mechanical_transform"], construct: fact("module.recorded_relation@1", "declared_convention", "recorded-semantic-path@1", () => ({ relation: id, grounding: "declared_convention" })) })),
  // guidance.authored_claim@1 — the [[D1673]] vertical slice
  adapter({ consumer: V1("guidance.authored_claim"), projection: V1("pack.authored.claim_delivery"), component: "claim", forms: ["sentence", "panel"], sourceOperands: ["text", "binding", "evidenceTypes", "earnedEvidenceTypes", "principles"], assertions: ["authored_text_copied"], construct: (evidence) => {
    const item = evidence.payload as { readonly text: string; readonly binding: ClaimBinding; readonly evidenceTypes: readonly ClaimEvidenceType[]; readonly earnedEvidenceTypes: readonly ClaimEvidenceType[]; readonly principles: readonly { readonly name: string; readonly statement: string; readonly counterCase: string }[] };
    return { id: "claim", operand: { text: item.text, binding: item.binding, evidenceTypes: [...item.evidenceTypes], earnedEvidenceTypes: [...item.earnedEvidenceTypes], principles: item.principles.map((principle) => ({ name: principle.name, statement: principle.statement, counterCase: principle.counterCase })) } };
  } }),
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
    const component = entry.construct(evidence);
    if (component.id !== entry.component) throw new PresentationError("PRESENTATION_INVALID", `${entry.key} constructed ${component.id}, not ${entry.component}`);
    const evidenceRef: PresentedEvidenceRef = { producer: { ...evidence.producer }, projection: { ...evidence.projection }, evidenceDigest: `sha256:${evidenceValueReceipt(evidence).payloadDigest}` };
    return [sealPresentedItemForOwner(evidence, evidenceRef, { consumer: { ...view.consumer }, projection: { ...evidence.projection } }, component)];
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
      if (entry.component !== component.id) throw new PresentationError("PRESENTATION_INVALID", `${entry.key} serves ${entry.component}, not ${component.id}`);
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
