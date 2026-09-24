// rfc/evidence-presentation.md §6b — the label registry: every learner-visible closed union, total by
// type, behind one frozen index. Rendering code reads labels from here; a raw enum id, a raw record id
// or a `replaceAll("_", " ")` in learner-visible text is a defect (§6a, §6d; `make label-sweep`).
import { assertPresentationText, type LabelEntry, type LabelVocabulary, type LabelVocabularyMembers as RuntimeLabelVocabularyMembers } from "@chess-tabiya/runtime";

import { OBJECTIVE_STATE_LABELS } from "./objective-state.js";
import { RUN_OUTCOME_LABELS } from "./run-outcome.js";
import { GROUNDING_LABELS } from "./evidence-grounding.js";
import { CLAIM_EVIDENCE_TYPE_LABELS } from "./claim-evidence-type.js";
import { SIDE_LABELS } from "./side.js";
import { OPPONENT_MODE_LABELS } from "./opponent-mode.js";
import { EVIDENCE_KIND_LABELS } from "./evidence-kind.js";
import { EVIDENCE_SOURCE_LABELS } from "./evidence-source.js";
import { EVIDENCE_PLANE_LABELS } from "./evidence-plane.js";
import { EVIDENCE_EXACTNESS_LABELS } from "./evidence-exactness.js";
import { EVIDENCE_CONFIDENCE_LABELS } from "./evidence-confidence.js";
import { ANSWER_DISTANCE_LABELS } from "./answer-distance.js";
import { EVIDENCE_FORM_LABELS } from "./evidence-form.js";
import { EVIDENCE_ROLE_LABELS } from "./evidence-role.js";
import { PROVIDER_OFF_BEHAVIOR_LABELS } from "./provider-off-behavior.js";
import { AVAILABILITY_MODE_LABELS } from "./availability-mode.js";
import { LATENCY_MODE_LABELS } from "./latency-mode.js";
import { SESSION_KIND_LABELS } from "./session-kind.js";
import { LIVE_SESSION_KIND_LABELS } from "./live-session-kind.js";
import { FEEDBACK_POLICY_LABELS } from "./feedback-policy.js";
import { MARK_BRUSH_LABELS } from "./mark-brush.js";
import { PIVOTAL_MARKER_KIND_LABELS } from "./pivotal-marker-kind.js";
import { PACK_REVIEW_STATUS_LABELS } from "./pack-review-status.js";
import { PACK_MODE_LABELS } from "./pack-mode.js";
import { PACK_PHASE_LABELS } from "./pack-phase.js";
import { OBJECTIVE_TYPE_LABELS } from "./objective-type.js";
import { RATING_PUBLICATION_STATE_LABELS } from "./rating-publication-state.js";
import { REPERTOIRE_GAP_STATE_LABELS } from "./repertoire-gap-state.js";
import { INVITATION_STATE_LABELS } from "./invitation-state.js";
import { PROPOSAL_STATE_LABELS } from "./proposal-state.js";
import { VOTE_WINDOW_STATE_LABELS } from "./vote-window-state.js";
import { GRANT_ROLE_LABELS } from "./grant-role.js";
import { CLASSROOM_ROLE_LABELS } from "./classroom-role.js";
import { CLASSROOM_STATE_LABELS } from "./classroom-state.js";
import { SURFACE_ID_LABELS } from "./surface-id.js";
import { PROVIDER_ID_LABELS } from "./provider-id.js";
import { SEAT_CLASS_LABELS } from "./seat-class.js";
import { MODULE_ID_LABELS } from "./module-id.js";
import { SEMANTIC_EVENT_SIGN_LABELS } from "./semantic-event-sign.js";
import { PACK_DRAFT_STATE_LABELS } from "./pack-draft-state.js";
import { GRADUATION_ENTRY_STATE_LABELS } from "./graduation-entry-state.js";
import { THEME_MODE_LABELS } from "./theme-mode.js";
import { PIECE_ROLE_LABELS } from "./piece-role.js";
import { STRUCTURAL_FEATURE_KIND_LABELS } from "./structural-feature-kind.js";
import { IRREVERSIBILITY_SUBKIND_LABELS } from "./irreversibility-subkind.js";
import { DEVIATION_CLASS_LABELS } from "./deviation-class.js";
import { EXPLORER_SPEED_LABELS } from "./explorer-speed.js";
import { STYLE_TIER_STATE_LABELS } from "./style-tier-state.js";
import { STYLE_TIER_RULE_LABELS } from "./style-tier-rule.js";
import { UNSUPPORTED_POLICY_MODE_LABELS } from "./unsupported-policy-mode.js";
import { POLICY_MODE_APPLIED_LABELS } from "./policy-mode-applied.js";
import type { ObjectiveState, RunOutcome, EvidenceGrounding, ClaimEvidenceType, ReviewSide, RunOpponentMode, EvidenceKind, EvidenceSource, EvidencePlane, AnswerDistance, EvidenceForm, EvidenceRole, ProviderOffBehavior, RunSessionKind, LiveSessionKind, RunFeedbackPolicy, MarkBrush, PivotalKind, ModuleSeatClass, ModuleId, SemanticEventSign, TierState, PolicyModeApplied } from "@chess-tabiya/runtime";
import type { EvidenceExactness } from "./evidence-exactness.js";
import type { EvidenceConfidence } from "./evidence-confidence.js";
import type { AvailabilityMode } from "./availability-mode.js";
import type { LatencyMode } from "./latency-mode.js";
import type { PackReviewStatus } from "./pack-review-status.js";
import type { PackMode } from "./pack-mode.js";
import type { PackPhase, ObjectiveType, StructuralFeatureKind } from "@chess-tabiya/schema/drill-pack";
import type { RatingPublicationState } from "./rating-publication-state.js";
import type { RepertoireGapState } from "./repertoire-gap-state.js";
import type { InvitationState } from "./invitation-state.js";
import type { ProposalState } from "./proposal-state.js";
import type { VoteWindowState } from "./vote-window-state.js";
import type { RunRole, SurfaceId } from "../api.js";
import type { ClassroomRole } from "./classroom-role.js";
import type { ClassroomState } from "./classroom-state.js";
import type { ProviderId } from "./provider-id.js";
import type { PackDraftState } from "./pack-draft-state.js";
import type { GraduationEntryState } from "./graduation-entry-state.js";
import type { ThemeMode } from "./theme-mode.js";
import type { PieceRole } from "./piece-role.js";
import type { IrreversibilitySubkind } from "./irreversibility-subkind.js";
import type { DeviationClass } from "./deviation-class.js";
import type { ExplorerSpeed } from "./explorer-speed.js";
import type { TierRule } from "./style-tier-rule.js";
import type { UnsupportedPolicyMode } from "./unsupported-policy-mode.js";

export { OBJECTIVE_STATE_LABELS } from "./objective-state.js";
export { RUN_OUTCOME_LABELS } from "./run-outcome.js";
export { GROUNDING_LABELS } from "./evidence-grounding.js";
export { CLAIM_EVIDENCE_TYPE_LABELS } from "./claim-evidence-type.js";
export { SIDE_LABELS } from "./side.js";
export { OPPONENT_MODE_LABELS } from "./opponent-mode.js";
export { EVIDENCE_KIND_LABELS } from "./evidence-kind.js";
export { EVIDENCE_SOURCE_LABELS } from "./evidence-source.js";
export { EVIDENCE_PLANE_LABELS } from "./evidence-plane.js";
export { EVIDENCE_EXACTNESS_LABELS } from "./evidence-exactness.js";
export { EVIDENCE_CONFIDENCE_LABELS } from "./evidence-confidence.js";
export { ANSWER_DISTANCE_LABELS } from "./answer-distance.js";
export { EVIDENCE_FORM_LABELS } from "./evidence-form.js";
export { EVIDENCE_ROLE_LABELS } from "./evidence-role.js";
export { PROVIDER_OFF_BEHAVIOR_LABELS } from "./provider-off-behavior.js";
export { AVAILABILITY_MODE_LABELS } from "./availability-mode.js";
export { LATENCY_MODE_LABELS } from "./latency-mode.js";
export { SESSION_KIND_LABELS } from "./session-kind.js";
export { LIVE_SESSION_CREATE_ACTIONS, LIVE_SESSION_KIND_LABELS } from "./live-session-kind.js";
export { FEEDBACK_POLICY_LABELS } from "./feedback-policy.js";
export { MARK_BRUSH_LABELS } from "./mark-brush.js";
export { PIVOTAL_MARKER_KIND_LABELS } from "./pivotal-marker-kind.js";
export { PACK_REVIEW_STATUS_LABELS } from "./pack-review-status.js";
export { PACK_MODE_LABELS } from "./pack-mode.js";
export { PACK_PHASE_LABELS } from "./pack-phase.js";
export { OBJECTIVE_TYPE_LABELS } from "./objective-type.js";
export { RATING_PUBLICATION_STATE_LABELS } from "./rating-publication-state.js";
export { REPERTOIRE_GAP_STATE_LABELS } from "./repertoire-gap-state.js";
export { INVITATION_STATE_LABELS } from "./invitation-state.js";
export { PROPOSAL_STATE_LABELS } from "./proposal-state.js";
export { VOTE_WINDOW_STATE_LABELS } from "./vote-window-state.js";
export { GRANT_ROLE_LABELS } from "./grant-role.js";
export { CLASSROOM_ROLE_LABELS } from "./classroom-role.js";
export { CLASSROOM_STATE_LABELS } from "./classroom-state.js";
export { SURFACE_ID_LABELS } from "./surface-id.js";
export { PROVIDER_ID_LABELS } from "./provider-id.js";
export { SEAT_CLASS_LABELS } from "./seat-class.js";
export { MODULE_LABELS, MODULE_ID_LABELS } from "./module-id.js";
export { SEMANTIC_EVENT_SIGN_LABELS } from "./semantic-event-sign.js";
export { PACK_DRAFT_STATE_LABELS } from "./pack-draft-state.js";
export { GRADUATION_ENTRY_STATE_LABELS } from "./graduation-entry-state.js";
export { THEME_MODE_LABELS } from "./theme-mode.js";
export { PIECE_ROLE_LABELS } from "./piece-role.js";
export { STRUCTURAL_FEATURE_KIND_LABELS } from "./structural-feature-kind.js";
export { IRREVERSIBILITY_SUBKIND_LABELS } from "./irreversibility-subkind.js";
export { DEVIATION_CLASS_LABELS } from "./deviation-class.js";
export { EXPLORER_SPEED_LABELS } from "./explorer-speed.js";
export { STYLE_TIER_STATE_LABELS } from "./style-tier-state.js";
export { STYLE_TIER_RULE_LABELS } from "./style-tier-rule.js";
export { UNSUPPORTED_POLICY_MODE_LABELS } from "./unsupported-policy-mode.js";
export { POLICY_MODE_APPLIED_LABELS } from "./policy-mode-applied.js";
export type { EvidenceExactness } from "./evidence-exactness.js";
export type { EvidenceConfidence } from "./evidence-confidence.js";
export type { AvailabilityMode } from "./availability-mode.js";
export type { LatencyMode } from "./latency-mode.js";
export type { PackReviewStatus } from "./pack-review-status.js";
export type { PackMode } from "./pack-mode.js";
export type { RatingPublicationState } from "./rating-publication-state.js";
export type { RepertoireGapState } from "./repertoire-gap-state.js";
export type { InvitationState } from "./invitation-state.js";
export type { ProposalState } from "./proposal-state.js";
export type { VoteWindowState } from "./vote-window-state.js";
export type { ClassroomRole } from "./classroom-role.js";
export type { ClassroomState } from "./classroom-state.js";
export type { ProviderId } from "./provider-id.js";
export type { PackDraftState } from "./pack-draft-state.js";
export type { GraduationEntryState } from "./graduation-entry-state.js";
export type { ThemeMode } from "./theme-mode.js";
export type { PieceRole } from "./piece-role.js";
export type { IrreversibilitySubkind } from "./irreversibility-subkind.js";
export type { DeviationClass } from "./deviation-class.js";
export type { ExplorerSpeed } from "./explorer-speed.js";
export type { TierRule } from "./style-tier-rule.js";
export type { UnsupportedPolicyMode } from "./unsupported-policy-mode.js";

/** The union each vocabulary is total over, keyed by vocabulary id. */
export interface WebLabelVocabularyMembers {
  readonly objective_state: ObjectiveState;
  readonly run_outcome: RunOutcome;
  readonly evidence_grounding: EvidenceGrounding;
  readonly claim_evidence_type: ClaimEvidenceType;
  readonly side: ReviewSide;
  readonly opponent_mode: RunOpponentMode;
  readonly evidence_kind: EvidenceKind;
  readonly evidence_source: EvidenceSource;
  readonly evidence_plane: EvidencePlane;
  readonly evidence_exactness: EvidenceExactness;
  readonly evidence_confidence: EvidenceConfidence;
  readonly answer_distance: AnswerDistance;
  readonly evidence_form: EvidenceForm;
  readonly evidence_role: EvidenceRole;
  readonly provider_off_behavior: ProviderOffBehavior;
  readonly availability_mode: AvailabilityMode;
  readonly latency_mode: LatencyMode;
  readonly session_kind: RunSessionKind;
  readonly live_session_kind: LiveSessionKind;
  readonly feedback_policy: RunFeedbackPolicy;
  readonly mark_brush: MarkBrush;
  readonly pivotal_marker_kind: PivotalKind;
  readonly pack_review_status: PackReviewStatus;
  readonly pack_mode: PackMode;
  readonly pack_phase: PackPhase;
  readonly objective_type: ObjectiveType;
  readonly rating_publication_state: RatingPublicationState;
  readonly repertoire_gap_state: RepertoireGapState;
  readonly invitation_state: InvitationState;
  readonly proposal_state: ProposalState;
  readonly vote_window_state: VoteWindowState;
  readonly grant_role: RunRole;
  readonly classroom_role: ClassroomRole;
  readonly classroom_state: ClassroomState;
  readonly surface_id: SurfaceId;
  readonly provider_id: ProviderId;
  readonly seat_class: ModuleSeatClass;
  readonly module_id: ModuleId;
  readonly semantic_event_sign: SemanticEventSign;
  readonly pack_draft_state: PackDraftState;
  readonly graduation_entry_state: GraduationEntryState;
  readonly theme_mode: ThemeMode;
  readonly piece_role: PieceRole;
  readonly structural_feature_kind: StructuralFeatureKind;
  readonly irreversibility_subkind: IrreversibilitySubkind;
  readonly deviation_class: DeviationClass;
  readonly explorer_speed: ExplorerSpeed;
  readonly style_tier_state: TierState;
  readonly style_tier_rule: TierRule;
  readonly unsupported_policy_mode: UnsupportedPolicyMode;
  readonly policy_mode_applied: PolicyModeApplied;
}
export type LabelVocabularyId = keyof WebLabelVocabularyMembers;

/** The same values typed per vocabulary, so a lookup is checked against its own union. */
const TYPED_REGISTRY: { readonly [K in LabelVocabularyId]: LabelVocabulary<WebLabelVocabularyMembers[K]> } = {
  objective_state: OBJECTIVE_STATE_LABELS,
  run_outcome: RUN_OUTCOME_LABELS,
  evidence_grounding: GROUNDING_LABELS,
  claim_evidence_type: CLAIM_EVIDENCE_TYPE_LABELS,
  side: SIDE_LABELS,
  opponent_mode: OPPONENT_MODE_LABELS,
  evidence_kind: EVIDENCE_KIND_LABELS,
  evidence_source: EVIDENCE_SOURCE_LABELS,
  evidence_plane: EVIDENCE_PLANE_LABELS,
  evidence_exactness: EVIDENCE_EXACTNESS_LABELS,
  evidence_confidence: EVIDENCE_CONFIDENCE_LABELS,
  answer_distance: ANSWER_DISTANCE_LABELS,
  evidence_form: EVIDENCE_FORM_LABELS,
  evidence_role: EVIDENCE_ROLE_LABELS,
  provider_off_behavior: PROVIDER_OFF_BEHAVIOR_LABELS,
  availability_mode: AVAILABILITY_MODE_LABELS,
  latency_mode: LATENCY_MODE_LABELS,
  session_kind: SESSION_KIND_LABELS,
  live_session_kind: LIVE_SESSION_KIND_LABELS,
  feedback_policy: FEEDBACK_POLICY_LABELS,
  mark_brush: MARK_BRUSH_LABELS,
  pivotal_marker_kind: PIVOTAL_MARKER_KIND_LABELS,
  pack_review_status: PACK_REVIEW_STATUS_LABELS,
  pack_mode: PACK_MODE_LABELS,
  pack_phase: PACK_PHASE_LABELS,
  objective_type: OBJECTIVE_TYPE_LABELS,
  rating_publication_state: RATING_PUBLICATION_STATE_LABELS,
  repertoire_gap_state: REPERTOIRE_GAP_STATE_LABELS,
  invitation_state: INVITATION_STATE_LABELS,
  proposal_state: PROPOSAL_STATE_LABELS,
  vote_window_state: VOTE_WINDOW_STATE_LABELS,
  grant_role: GRANT_ROLE_LABELS,
  classroom_role: CLASSROOM_ROLE_LABELS,
  classroom_state: CLASSROOM_STATE_LABELS,
  surface_id: SURFACE_ID_LABELS,
  provider_id: PROVIDER_ID_LABELS,
  seat_class: SEAT_CLASS_LABELS,
  module_id: MODULE_ID_LABELS,
  semantic_event_sign: SEMANTIC_EVENT_SIGN_LABELS,
  pack_draft_state: PACK_DRAFT_STATE_LABELS,
  graduation_entry_state: GRADUATION_ENTRY_STATE_LABELS,
  theme_mode: THEME_MODE_LABELS,
  piece_role: PIECE_ROLE_LABELS,
  structural_feature_kind: STRUCTURAL_FEATURE_KIND_LABELS,
  irreversibility_subkind: IRREVERSIBILITY_SUBKIND_LABELS,
  deviation_class: DEVIATION_CLASS_LABELS,
  explorer_speed: EXPLORER_SPEED_LABELS,
  style_tier_state: STYLE_TIER_STATE_LABELS,
  style_tier_rule: STYLE_TIER_RULE_LABELS,
  unsupported_policy_mode: UNSUPPORTED_POLICY_MODE_LABELS,
  policy_mode_applied: POLICY_MODE_APPLIED_LABELS,
};

/** Every vocabulary the runtime's `enum_state` component admits is also registered here, identically. */
const _runtimeVocabulariesRegistered: { readonly [K in keyof RuntimeLabelVocabularyMembers]: LabelVocabulary<RuntimeLabelVocabularyMembers[K]> } = TYPED_REGISTRY;
void _runtimeVocabulariesRegistered;

export const LABEL_REGISTRY: Readonly<Record<LabelVocabularyId, LabelVocabulary<string>>> = Object.freeze(TYPED_REGISTRY);

/** The label a vocabulary declares when a value is absent (§3.9 "Empty"). */
export const UNRECORDED_LABEL = "not recorded";

/** Typed lookup: the value must be a member of the vocabulary's own union. */
export function labelFor<V extends LabelVocabularyId>(vocabulary: V, value: WebLabelVocabularyMembers[V]): string {
  return entryFor(vocabulary, value).label;
}

export function entryFor<V extends LabelVocabularyId>(vocabulary: V, value: WebLabelVocabularyMembers[V]): LabelEntry {
  const entry = LABEL_REGISTRY[vocabulary][value];
  if (entry === undefined) throw new TypeError(`label vocabulary ${vocabulary} has no member ${String(value)}`);
  return entry;
}

/**
 * Lookup for a wire value the client types as `string` (or may be absent): a member renders its
 * label, anything else renders `fallback` — never the raw value.
 */
export function labelOrFallback(vocabulary: LabelVocabularyId, value: string | null | undefined, fallback: string = UNRECORDED_LABEL): string {
  if (value === null || value === undefined || !Object.hasOwn(LABEL_REGISTRY[vocabulary], value)) return fallback;
  return LABEL_REGISTRY[vocabulary][value]!.label;
}

/** The member's one-line gloss, or `fallback` for a non-member or a member without one. */
export function glossOrFallback(vocabulary: LabelVocabularyId, value: string | null | undefined, fallback: string): string {
  if (value === null || value === undefined || !Object.hasOwn(LABEL_REGISTRY[vocabulary], value)) return fallback;
  return LABEL_REGISTRY[vocabulary][value]!.gloss ?? fallback;
}

/** True when `value` is a member of the vocabulary. */
export function isVocabularyMember<V extends LabelVocabularyId>(vocabulary: V, value: unknown): value is WebLabelVocabularyMembers[V] {
  return typeof value === "string" && Object.hasOwn(LABEL_REGISTRY[vocabulary], value);
}

/**
 * Rule 6a category 4 — prose produced elsewhere (a server sentence, a runtime label) crossing into a
 * learner-visible text node. The §6e runtime arm checks it: prose carrying an id- or digest-shaped
 * token renders `fallback` instead of the identifier.
 */
export function learnerProse(text: string, fallback = "This detail is not available in plain language."): string {
  try {
    return assertPresentationText(text);
  } catch {
    return fallback;
  }
}
