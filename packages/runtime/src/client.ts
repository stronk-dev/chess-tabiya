// Browser entry point: re-export the same implementations without initializing the
// private pack-capability catalogue. Keep the full runtime entry for server/tooling.
// Semantic validation's four-way module-load equality remains a client startup invariant.
import "./semantic-validation-registry.js";

export {
  exactLegalMoveMap,
  exactLegalMoves,
  exactMoveDestination,
  exactMoveIdentity,
} from "./legal-moves.js";
export {
  lineMembership,
  spineNodeIdFor,
  spinePositionIndex,
  type LineMembershipEntry,
} from "./line.js";
export {
  branchPath,
  branchPaths,
} from "./branch-path.js";
export {
  MAX_COMPARISON_BRANCHES,
  type BranchComparison,
  type ObjectiveTimelineEntry,
} from "./compare.js";
export {
  BRANCH_COLLAPSE_FLOOR,
  collapsedBranchIds,
  renderCollapseExplanation,
  type Decidedness,
} from "./branch-scale.js";
export {
  comparisonPresentedEngineTrajectory,
  comparisonNarrative,
  comparisonStrips,
} from "./compare-strips.js";
export {
  groupsFromEvents,
  projectRun,
} from "./events.js";
export {
  feedbackDeliveryOpen,
} from "./feedback.js";
export {
  shapeFiringEvidence,
} from "./shape-firing.js";
export {
  classifyPhase,
  renderPhaseReading,
} from "./phase.js";
export {
  INSPECTOR_FAMILY_IDS,
  MODULE_IDS,
  type ModuleId,
  type ModuleSeatClass,
} from "./module-contract.js";
export {
  SILENT_ASSISTANCE,
  permittedAssistance,
  type AssistanceConfig,
  type AssistancePermission,
} from "./assistance.js";
export {
  migrateAssistanceConfig,
} from "./assistance-codec.js";
export {
  ASSISTANCE_PREFERENCE_FIELDS,
  CONFIGURABLE_MODULE_IDS,
  EMPTY_MODULE_OVERRIDES,
  PRESET_IDS,
  WORKFLOW_CONTEXTS,
  deriveWorkflowContext,
  parseWorkflowPreferenceV2,
  preferenceDisplayMode,
  presetDeclaration,
  requestedAssistanceFields,
  requestedModules,
  requestedPreset,
  selectNamedPreset,
  serializeWorkflowPreferenceV2,
  setPreferenceField,
  setPreferenceModule,
  workflowContextPolicy,
  type AssistancePreferenceFields,
  type ConfigurableModuleId,
  type PresetId,
  type WorkflowContextId,
  type WorkflowPreferenceReceipt,
  type WorkflowPreferenceV2,
} from "./presets.js";
export {
  MODULE_LABELS,
  browserChannelReceipt,
  compileAssistanceRequest,
  compiledPresetDisclosure,
  narrowBrowserChannels,
  parseFinalizedAssistanceV1,
  renderSuppression,
  type BrowserNarrowedAssistanceV1,
  type CompiledAssistanceEffect,
  type FinalizedAssistanceV1,
  type RequestedAssistanceV1,
} from "./assistance-exchange.js";
export {
  MODULE_POLICIES,
} from "./module-policy.js";
export {
  MODULE_QUERY_PROTOCOL,
  moduleDecisionStamp,
  moduleDisclosureDigest,
  moduleComparisonForSubject,
  type InspectorFamilyState,
  type ModuleBudgetReceipt,
  type ModuleDisclosureReceipt,
  type ModuleEmptyState,
  type ModuleQueryRequest,
  type ModuleSuppressionReason,
} from "./module-query.js";
export {
  pivotalMarkerEvidence,
  renderPivotalMarker,
  type PivotalKind,
} from "./pivotal.js";
export {
  transitionReading,
  type TransitionObservation,
} from "./transition.js";
export {
  endgameClassification,
  renderEndgameClassification,
} from "./endgame.js";
export {
  endgameSetupMatches,
  renderEndgameSetupMatch,
} from "./endgame-setup.js";
export {
  parseReviewStoryReceipt,
  type ReviewStoryReceipt,
} from "./story.js";
export {
  CLAIM_EVIDENCE_TYPE_LABELS,
  SIDE_LABELS,
  type ClaimEvidenceType,
  type LabelVocabularyMembers,
  type ReviewSide,
  GROUNDING_LABELS,
  LABEL_VOCABULARIES,
  OBJECTIVE_STATE_LABELS,
  RUN_OUTCOME_LABELS,
  assertPresentationText,
  assertPresentedEvidenceItem,
  parsePresentationReceipt,
  presentEvidenceItems,
  presentedSentence,
  type ComponentValue,
  type ConventionReceipt,
  type LabelEntry,
  type LabelVocabulary,
  type PresentedEvidenceItem,
  DENOMINATOR_MEANINGS,
  MAGNITUDE_SCALE_POLICIES,
  RELATION_PHRASES,
  STRUCTURED_DOCUMENT_SCHEMAS,
  conventionAttribution,
  formatShare,
} from "./presentation-contract.js";
export {
  FLOAT32_POLICY_MASS_TOLERANCE,
} from "./practical-difficulty.js";
export {
  CORPUS_POPULATION_SOURCE,
  type CorpusPopulation,
  type CorpusResult,
  type CorpusInspectorPage,
} from "./corpus-result.js";
export {
  structuralReading,
  type StructuralObservation,
} from "./structure.js";
export {
  trajectoryPolicyAt,
  trajectoryVerdict,
} from "./trajectory.js";
export {
  claimDeliveryEvidence,
  evidenceReferenceEvidence,
  humanSplitPageEvidence,
} from "./evidence-operations.js";
export {
  EXPLORER_SPEEDS,
} from "./provider-types.js";
export {
  type ImportSourceKind,
  type ImportSourceRequestKind,
} from "./import-source-protocol.js";
export {
  evidenceSentenceTable,
  type EvidenceReferenceResolution,
  type EvidenceSentence,
} from "./evidence-ref-resolution.js";
export {
  evidenceForConsumer,
  evidenceConsumerOperation,
  assertConsumerEvidenceView,
  type AnswerDistance,
  type ConsumerEvidenceView,
  type EvidenceForm,
  type EvidenceGrounding,
  type EvidencePlane,
  type EvidenceRole,
  type ProducerDeclaration,
  type ProjectionDeclaration,
  type ProviderOffBehavior,
  type SemanticEventSign,
} from "./evidence-contract.js";
export {
  PRIMARY_EVIDENCE_MANIFEST,
} from "./evidence-catalog.js";
export {
  compileEvidenceConsumerExecution,
} from "./evidence-binding-execution.js";
export {
  packAbsentEvidenceRef,
} from "./evidence-ref.js";
export {
  declareStructuralReadingEvidence,
  declareTransitionReadingEvidence,
  positionStructureEvidence,
  selectedSquareSightEvidence,
} from "./reading-evidence.js";
export {
  materialBalanceAt,
  type ObjectiveEvidenceProposal,
} from "./objective.js";
export {
  resistanceOnPath,
} from "./replay.js";
export {
  historyFrom,
} from "./runtime.js";
export {
  type BranchGroup,
  type DrillRun,
  type DrillRunEvent,
  type EvidenceKind,
  type EvidencePayload,
  type EvidenceSource,
  type MutationResult,
  type Node,
  type ObjectiveState,
  type OpponentSelection,
  type ReasoningDetection,
  type ReasoningTranscript,
  type PolicyConfig,
  type PolicyModeApplied,
  type RunFeedbackPolicy,
  type RunOpponentMode,
  type RunOpponentPolicy,
  type RunOutcome,
  type RunSessionKind,
  type LiveSessionKind,
  type MarkBrush,
  type RunMark,
  type SelectionCandidate,
  type SelectionEngineIdentity,
} from "./types.js";
export {
  MARK_BRUSHES,
  RUN_OPPONENT_MODES,
} from "./types.js";
export {
  CORPUS_GUARD,
} from "./population-guard.js";
export {
  reviewMoveNumber,
  type ReviewMapMoment,
  type ReviewMapProjection,
  type ReviewEvalGraph,
} from "./review-map.js";
export {
  type ReviewAnalysis,
} from "./review-analysis.js";
export {
  reviewText,
} from "./review-map-templates.js";
export {
  BOT_CARD_SOURCE_IDS,
  BOT_CARD_STATEMENT_IDS,
  BOT_CLASSIFIER_IDS,
  BOT_FAMILY_LABELS,
  BOT_AVAILABILITY_BLOCKERS,
  BOT_AVAILABILITY_CONDITIONS,
  botProfileIsStartable,
  type BotAvailabilityBlocker,
  type BotAvailabilityCondition,
  type BotProfileStartability,
  type BotCardSourceId,
  type BotCardStatementId,
  BOT_PROFILE_CATALOG,
  resolveBotProfileReference,
  type BotClassifierId,
  type BotDegradationReason,
  type BotLayerId,
  type BotProfileFamily,
  type BotProfileId,
  type BotProfileReference,
} from "./bot-profile-catalog.js";
export {
  botOpponentPlyRequestId,
  parseBotOpponentPlyResultRow,
  runEventHeadDigest,
  type BotOpponentPlyRequest,
  type BotOpponentPlyResultRow,
} from "./bot-opponent-ply.js";
export {
  type StyleContributorRef,
  type StyleContributors,
  TIER_RULE_ID,
  type TierState,
  type HabitCard,
} from "./style-contract.js";
export {
  parseConceptCatalogueView,
  parseConceptLabelView,
  type ConceptCatalogueView,
  type ConceptLabelView,
} from "./concept-registry.js";
export {
  providerAvailabilityNotice,
  capabilityOperationAvailability,
  capabilityModeAvailability,
  parseProviderHealthCapabilities,
  type ApplicationProviderOperationId,
  type ProviderHealthSnapshot,
  type ProviderOperationAvailability,
  type ProviderHealthCapabilities,
  type ProviderAvailabilityNotice,
} from "./provider-health.js";
export {
  HINT_DISTANCES,
  type HintDistance,
  type HintRung,
} from "./hint-registry.js";
export {
  hintDecisionStamp,
  nextHintRung,
  parseHintResponse,
  type HintDeliveryMarks,
  type HintPolicyReason,
  type HintRequestState,
  type HintResponse,
} from "./hint-exchange.js";
