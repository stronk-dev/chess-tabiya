/**
 * The central evidence value-route registry (rfc/evidence-value-authority.md §2).
 *
 * This is the only non-test module that imports projection factories. It generates the
 * package-internal `EvidenceValueRouteInputs` / `EvidenceValueRouteResults` maps from one literal
 * table keyed by exact projection ref, and exports the single dispatcher
 * `invokeEvidenceValueRoute`. Runtime admission rejects unknown routes, missing or extra input keys
 * and inputs that fail the route's authority validator before the factory runs. It accepts no
 * projection payload, output, receipt, factory name or caller-selected ancestry, and it is absent
 * from every barrel and package export.
 */
import { comparisonStructuralAppearances, readComparisonStructuralPopulation } from "../comparison-structural-population.js";
import { COMPARISON_REDUCTION_CONTRACT, LAST_LEVEL_REDUCTION_CONTRACT, evidenceReductionContract } from "../evidence-reduction-contract.js";
import { readRecordedLastLevelPopulation } from "../review-evidence.js";
import { lastRecordedAvailableLevel } from "./last-level-reduction-authority.js";
import type { VersionedEvidenceId } from "../evidence-contract.js";
import {
  AVOIDANCE_FACTORIES,
  HINT_DISCLOSURE_FACTORIES,
  HINT_HORIZON_FACTORIES,
  STRUCTURAL_EVENT_FACTORIES,
  STRUCTURAL_PREDICATE_FACTORIES,
  STRUCTURAL_READING_FACTORIES,
  TRANSITION_EVENT_FACTORIES,
  TRANSITION_READING_FACTORIES,
  admitInputValue,
  readStructuralPopulationInvocation,
  assertRecordedPositionInvocation,
  assertRecordedReviewResultInvocation,
  readReviewPointInvocation,
  readReviewPointResultInvocation,
  readRecordedHumanDivergenceInvocation,
  createAuthoredStructuralConditionInputV1Evidence,
  createDerivedExplorerRepertoireFrontierV1Evidence,
  createDerivedExplorerPositionFrequencyV1Evidence,
  createDerivedExplorerInspectorPopulationV1Evidence,
  createDerivedActivityEventOpenFileOccupancyV1Evidence,
  createDerivedCompareEngineTrajectoryV1Evidence,
  createDerivedCompareEvalDeltaV1Evidence,
  createDerivedComparePieceRouteV1Evidence,
  createDerivedComparePieceRouteV2Evidence,
  createRunRecordComparisonPathV1Evidence,
  createDerivedCompareStructureDeltaV1Evidence,
  createDerivedCompareStructureDeltaV2Evidence,
  createDerivedCitationAttributionV1Evidence,
  createDerivedExchangeCaptureClassV1Evidence,
  createDerivedExchangeTradeCompletedV1Evidence,
  createDerivedGradeMoveQualityV1Evidence,
  createDerivedKingCapturedZoneDefenderV1Evidence,
  createDerivedMaterialEventRoleAsymmetryV1Evidence,
  createDerivedMaterialReadingRoleSignatureV1Evidence,
  createDerivedMaterialEventRoleAsymmetryV2Evidence,
  createDerivedMaterialReadingRoleSignatureV2Evidence,
  createRecordedInspectorEvalPacketV1Evidence,
  createRecordedInspectorWdlPacketV1Evidence,
  createRecordedInspectorPvPacketV1Evidence,
  createRecordedInspectorTablebasePacketV1Evidence,
  createRecordedInspectorMaiaSelectionV1Evidence,
  createDerivedInspectorTablebaseCategoryV1Evidence,
  createDerivedInspectorTablebaseDistanceV1Evidence,
  createDerivedOpeningDeepestReachedV1Evidence,
  createDerivedOpponentCandidateFeatureVectorV1Evidence,
  createDerivedPawnEventTransitionsV1Evidence,
  createDerivedPawnSequenceContactTimingV1Evidence,
  createDerivedPawnSequenceHarassmentPressureV1Evidence,
  createDerivedPivotalHumanDivergenceV1Evidence,
  createDerivedPivotalHumanDivergenceV2Evidence,
  createDerivedPivotalIrreversibilityV1Evidence,
  createDerivedPivotalOptionCollapseV1Evidence,
  createDerivedPivotalPhaseChangeV1Evidence,
  createDerivedPivotalOptionCollapseV2Evidence,
  createDerivedPivotalPhaseChangeV2Evidence,
  createDerivedReviewEvalDeltaV2Evidence,
  createDerivedReviewEvalPointV1Evidence,
  createDerivedReviewMateTransitionV2Evidence,
  createDerivedReviewWdlPointV1Evidence,
  createDerivedReviewWdlWhiteV1Evidence,
  createDerivedStoryLastLevelV1Evidence,
  createDerivedStoryLastLevelV2Evidence,
  createDerivedStoryRankV2Evidence,
  createDerivedStoryTitleV2Evidence,
  createDerivedStructuralPredicateResultV1Evidence,
  createDerivedTacticAttractionObservedV1Evidence,
  createDerivedTacticCheckZwischenzugObservedV1Evidence,
  createDerivedTacticDefenderExposureV1Evidence,
  createDerivedTacticDefenderExposureV2Evidence,
  createDerivedTacticDeflectionObservedV1Evidence,
  createDerivedTacticDiscoveredExecutedV1Evidence,
  createDerivedTacticForkSurvivesReplyV1Evidence,
  createDerivedTacticNonterminalForkSurvivalV1Evidence,
  createRulesTacticReadingPromotionPressureV1Evidence,
  createRulesTacticPredicateOverloadConflictV1Evidence,
  createDerivedTacticInterferenceObservedV1Evidence,
  createDerivedTacticLineBlockerClearanceObservedV1Evidence,
  createDerivedTacticOverloadExploitationObservedV1Evidence,
  createDerivedTacticOverloadedDefenderResponseConflictV1Evidence,
  createDerivedTacticPromotionPressureV1Evidence,
  createDerivedTacticSequenceDefenderConsequenceV1Evidence,
  createDerivedTacticSquareClearanceObservedV1Evidence,
  createHumanExplorerPopulationV1Evidence,
  createHumanExplorerPositionPageV1Evidence,
  createDerivedExplorerPopulationSummaryV1Evidence,
  createDerivedMaiaRunMoveOccurrenceV1Evidence,
  createDerivedMaiaExactFenMoveOccurrenceV1Evidence,
  createHumanMaiaPolicyPageV1Evidence,
  createLiveStockfishLegalRootTableV1Evidence,
  createLiveStockfishPositionEvalV1Evidence,
  createLiveStockfishPrincipalVariationV1Evidence,
  createLiveSyzygyPositionResultV1Evidence,
  createLiveSyzygyPositionResultV2Evidence,
  createRulesEndgameTablebaseDomainV1Evidence,
  createHumanExplorerPositionStatsV1Evidence,
  createHumanMaiaCandidateWdlV1Evidence,
  createHumanMaiaEventV1Evidence,
  createHumanMaiaPolicyV1Evidence,
  createHumanMaiaUciResponseV1Evidence,
  createLiveStockfishEvalV1Evidence,
  createLiveStockfishPvV1Evidence,
  createLiveStockfishUciResponseV1Evidence,
  createLiveStockfishWdlV1Evidence,
  createLiveSyzygyCategoryV1Evidence,
  createLiveSyzygyDistanceV1Evidence,
  createLiveSyzygyProbeResultV1Evidence,
  createLiveSyzygyResultV1Evidence,
  createPackAuthoredClaimDeliveryV1Evidence,
  createPackAuthoredClaimV1Evidence,
  createPackAuthoredConceptReferenceV1Evidence,
  createPackAuthoredPhaseV1Evidence,
  createRecordedEngineEvalV1Evidence,
  createRecordedTablebaseResultV1Evidence,
  createRulesCastlingEventRightsLostV1Evidence,
  createRulesCastlingReadingLegalityV1Evidence,
  createRulesCastlingReadingRightsV1Evidence,
  createRulesEndgameClassificationV1Evidence,
  createRulesExchangePredicateLegalExchangeV1Evidence,
  createRulesExchangeReadingLandingCapturesV1Evidence,
  createRulesKingEventZoneStateV1Evidence,
  createRulesKingReadingZoneStateV1Evidence,
  createRulesMobilityEventPieceDestinationsV1Evidence,
  createRulesMobilityReadingLegalMovesV1Evidence,
  createRulesMobilityReadingPieceDestinationsV1Evidence,
  createRulesPawnEventDynamicsV1Evidence,
  createRulesPawnReadingCandidateMajorityV1Evidence,
  createRulesPawnReadingContactsV1Evidence,
  createRulesPhaseDevelopmentV1Evidence,
  createRulesPhaseReadingV2Evidence,
  createRulesSquareEventControlV1Evidence,
  createRulesSquareReadingControlV1Evidence,
  createRulesStructuralEventPawnIslandsV1Evidence,
  createRulesStructuralReadingNamedStructureV2Evidence,
  createRulesStructuralReadingPawnConnectivityV1Evidence,
  createRulesStructuralReadingSpaceV1Evidence,
  createRulesTacticConsequenceForcedMateAfterMoveV1Evidence,
  createRulesTacticConsequenceForcedMateAfterMoveV2Evidence,
  createRulesTacticConsequenceMateInOneV1Evidence,
  createRulesTacticConsequenceReplyBreadthV1Evidence,
  createRulesTacticConsequenceThreatV1Evidence,
  createRulesTacticEventCheckV1Evidence,
  createRulesTacticEventDefenderDutyRelocatedV1Evidence,
  createRulesTacticEventDefenderRemovedV1Evidence,
  createRulesTacticEventDoubleAttackV1Evidence,
  createRulesTacticEventLoosePieceV1Evidence,
  createRulesTacticReadingBackRankV1Evidence,
  createRulesTacticReadingDefenderDutySetV1Evidence,
  createRulesTacticReadingDiscoveredLatencyV1Evidence,
  createRulesTacticReadingLoosePieceV1Evidence,
  createRulesTacticReadingRayClassificationV1Evidence,
  createRulesTacticReadingRookOnSeventhV1Evidence,
  createRulesTacticReadingTrappedPieceV1Evidence,
  createRunRecordCheckpointHitV1Evidence,
  createRunRecordConsequenceV1Evidence,
  createRunRecordEvidenceRefResolutionV1Evidence,
  createRunRecordForkV1Evidence,
  createRunRecordImportedResultV1Evidence,
  createRunRecordMoveV1Evidence,
  createRunRecordObjectiveTransitionV1Evidence,
  createRunRecordPositionV1Evidence,
  createSourcingLedgerCitableTextV1Evidence,
  createSourcingLedgerEngineEvalV1Evidence,
  createSourcingLedgerExplorerPositionCensusV1Evidence,
  createSourcingLedgerTablebaseResultV1Evidence,
  createTheoryEndgameSetupMatchV1Evidence,
  createTheoryOpeningCatalogueMembershipV1Evidence,
  createTheoryOpeningCurrentEndpointV1Evidence,
  createTheoryOpeningIdentityRecordV1Evidence,
  createTheoryShapesFiringV1Evidence,
  createRunRecordEdgeV1Evidence,
  createDerivedExchangeTradeCompletedV2Evidence,
  createDerivedPawnSequenceContactTimingV2Evidence,
  createDerivedPawnSequenceHarassmentPressureV2Evidence,
  createDerivedTacticSequenceDefenderConsequenceV2Evidence,
  createDerivedTacticSquareClearanceObservedV2Evidence,
  createDerivedTacticLineBlockerClearanceObservedV2Evidence,
  createDerivedTacticDeflectionObservedV2Evidence,
  createDerivedTacticAttractionObservedV2Evidence,
  createDerivedTacticInterferenceObservedV2Evidence,
  createDerivedTacticCheckZwischenzugObservedV2Evidence,
  createDerivedTacticOverloadExploitationObservedV2Evidence,
  createDerivedPawnSequenceContactTimingV3Evidence,
  createDerivedPawnSequenceHarassmentPressureV3Evidence,
  createDerivedTacticSequenceDefenderConsequenceV3Evidence,
  createDerivedTacticSquareClearanceObservedV3Evidence,
  createDerivedTacticLineBlockerClearanceObservedV3Evidence,
  createDerivedTacticInterferenceObservedV3Evidence,
  createDerivedTacticCheckZwischenzugObservedV3Evidence,
  createDerivedTacticOverloadExploitationObservedV3Evidence,
  createDerivedTacticDeflectionObservedV3Evidence,
  createDerivedTacticAttractionObservedV3Evidence,
  createTheoryEndgameMethodStageV1Evidence,
  createDerivedBoundedTargetNamedMaterialTargetV1Evidence,
  createDerivedBoundedTargetImmediateV1Evidence,
  createDerivedBoundedTargetBoundedReturnV1Evidence,
  createDerivedBoundedTargetEngineTargetPolicyV1Evidence,
  createDerivedBoundedTargetPolicyBoundsV1Evidence,
  type EvidenceInputArm,
  type EvidenceValueFactory,
  type EvidenceValueFactoryMeta,
} from "../evidence-factories.js";

// Read-only source membership, never a public registration or second factory dispatcher.
export { readStructuralPopulationInvocation, assertRecordedPositionInvocation, assertRecordedReviewResultInvocation, readReviewPointInvocation, readReviewPointResultInvocation, readRecordedHumanDivergenceInvocation };

/** The literal route table: exact projection ref → its one production factory. */
const EVIDENCE_VALUE_ROUTES = Object.freeze({
  "derived.pawn.sequence.contact_timing@3": createDerivedPawnSequenceContactTimingV3Evidence,
  "derived.pawn.sequence.harassment_pressure@3": createDerivedPawnSequenceHarassmentPressureV3Evidence,
  "derived.tactic.sequence.defender_consequence@3": createDerivedTacticSequenceDefenderConsequenceV3Evidence,
  "derived.tactic.square_clearance_observed@3": createDerivedTacticSquareClearanceObservedV3Evidence,
  "derived.tactic.line_blocker_clearance_observed@3": createDerivedTacticLineBlockerClearanceObservedV3Evidence,
  "derived.tactic.interference_observed@3": createDerivedTacticInterferenceObservedV3Evidence,
  "derived.tactic.check_zwischenzug_observed@3": createDerivedTacticCheckZwischenzugObservedV3Evidence,
  "derived.tactic.overload_exploitation_observed@3": createDerivedTacticOverloadExploitationObservedV3Evidence,
  "derived.tactic.deflection_observed@3": createDerivedTacticDeflectionObservedV3Evidence,
  "derived.tactic.attraction_observed@3": createDerivedTacticAttractionObservedV3Evidence,
  "derived.maia.run_move_occurrence@1": createDerivedMaiaRunMoveOccurrenceV1Evidence,
  "derived.maia.exact_fen_move_occurrence@1": createDerivedMaiaExactFenMoveOccurrenceV1Evidence,
  "authored.structural_condition.input@1": createAuthoredStructuralConditionInputV1Evidence,
  "derived.activity.event.open_file_occupancy@1": createDerivedActivityEventOpenFileOccupancyV1Evidence,
  "derived.citation.attribution@1": createDerivedCitationAttributionV1Evidence,
  "derived.compare.engine_trajectory@1": createDerivedCompareEngineTrajectoryV1Evidence,
  "derived.compare.eval_delta@1": createDerivedCompareEvalDeltaV1Evidence,
  "derived.compare.piece_route@1": createDerivedComparePieceRouteV1Evidence,
  "derived.compare.piece_route@2": createDerivedComparePieceRouteV2Evidence,
  "run.record.comparison_path@1": createRunRecordComparisonPathV1Evidence,
  "derived.compare.structure_delta@1": createDerivedCompareStructureDeltaV1Evidence,
  "derived.compare.structure_delta@2": createDerivedCompareStructureDeltaV2Evidence,
  "derived.exchange.capture_class@1": createDerivedExchangeCaptureClassV1Evidence,
  "derived.exchange.trade_completed@1": createDerivedExchangeTradeCompletedV1Evidence,
  "derived.grade.move_quality@1": createDerivedGradeMoveQualityV1Evidence,
  "derived.king.captured_zone_defender@1": createDerivedKingCapturedZoneDefenderV1Evidence,
  "derived.material.event.role_asymmetry@1": createDerivedMaterialEventRoleAsymmetryV1Evidence,
  "derived.material.reading.role_signature@1": createDerivedMaterialReadingRoleSignatureV1Evidence,
  "derived.material.event.role_asymmetry@2": createDerivedMaterialEventRoleAsymmetryV2Evidence,
  "derived.material.reading.role_signature@2": createDerivedMaterialReadingRoleSignatureV2Evidence,
  "recorded.inspector.eval_packet@1": createRecordedInspectorEvalPacketV1Evidence,
  "recorded.inspector.wdl_packet@1": createRecordedInspectorWdlPacketV1Evidence,
  "recorded.inspector.pv_packet@1": createRecordedInspectorPvPacketV1Evidence,
  "recorded.inspector.tablebase_packet@1": createRecordedInspectorTablebasePacketV1Evidence,
  "recorded.inspector.maia_selection@1": createRecordedInspectorMaiaSelectionV1Evidence,
  "derived.inspector.tablebase_category@1": createDerivedInspectorTablebaseCategoryV1Evidence,
  "derived.inspector.tablebase_distance@1": createDerivedInspectorTablebaseDistanceV1Evidence,
  "derived.opening.deepest_reached@1": createDerivedOpeningDeepestReachedV1Evidence,
  "derived.opponent.candidate_feature_vector@1": createDerivedOpponentCandidateFeatureVectorV1Evidence,
  "derived.pawn.event.transitions@1": createDerivedPawnEventTransitionsV1Evidence,
  "derived.pawn.sequence.contact_timing@1": createDerivedPawnSequenceContactTimingV1Evidence,
  "derived.pawn.sequence.harassment_pressure@1": createDerivedPawnSequenceHarassmentPressureV1Evidence,
  "derived.pivotal.human_divergence@1": createDerivedPivotalHumanDivergenceV1Evidence,
  "derived.pivotal.human_divergence@2": createDerivedPivotalHumanDivergenceV2Evidence,
  "derived.pivotal.irreversibility@1": createDerivedPivotalIrreversibilityV1Evidence,
  "derived.pivotal.option_collapse@1": createDerivedPivotalOptionCollapseV1Evidence,
  "derived.pivotal.option_collapse@2": createDerivedPivotalOptionCollapseV2Evidence,
  "derived.pivotal.phase_change@1": createDerivedPivotalPhaseChangeV1Evidence,
  "derived.pivotal.phase_change@2": createDerivedPivotalPhaseChangeV2Evidence,
  ...AVOIDANCE_FACTORIES,
  // rfc/review-evidence-compiler.md: derived.story.eval_shift@1 is retired; the typed Review
  // projections replace it and are never minted from a legacy scalar.
  "derived.review.eval_point@1": createDerivedReviewEvalPointV1Evidence,
  "derived.review.eval_delta@2": createDerivedReviewEvalDeltaV2Evidence,
  "derived.review.mate_transition@2": createDerivedReviewMateTransitionV2Evidence,
  "derived.review.wdl_white@1": createDerivedReviewWdlWhiteV1Evidence,
  "derived.review.wdl_point@1": createDerivedReviewWdlPointV1Evidence,
  "derived.story.last_level@1": createDerivedStoryLastLevelV1Evidence,
  "derived.story.last_level@2": createDerivedStoryLastLevelV2Evidence,
  "derived.story.rank@2": createDerivedStoryRankV2Evidence,
  "derived.story.title@2": createDerivedStoryTitleV2Evidence,
  "derived.structural.predicate_result@1": createDerivedStructuralPredicateResultV1Evidence,
  "derived.tactic.attraction_observed@1": createDerivedTacticAttractionObservedV1Evidence,
  "derived.tactic.check_zwischenzug_observed@1": createDerivedTacticCheckZwischenzugObservedV1Evidence,
  "derived.tactic.defender_exposure@1": createDerivedTacticDefenderExposureV1Evidence,
  "derived.tactic.defender_exposure@2": createDerivedTacticDefenderExposureV2Evidence,
  "derived.tactic.deflection_observed@1": createDerivedTacticDeflectionObservedV1Evidence,
  "derived.tactic.discovered_executed@1": createDerivedTacticDiscoveredExecutedV1Evidence,
  "derived.tactic.fork_survives_reply@1": createDerivedTacticForkSurvivesReplyV1Evidence,
  "derived.tactic.nonterminal_fork_survival@1": createDerivedTacticNonterminalForkSurvivalV1Evidence,
  "rules.tactic.reading.promotion_pressure@1": createRulesTacticReadingPromotionPressureV1Evidence,
  "rules.tactic.predicate.overload_conflict@1": createRulesTacticPredicateOverloadConflictV1Evidence,
  "derived.tactic.interference_observed@1": createDerivedTacticInterferenceObservedV1Evidence,
  "derived.tactic.line_blocker_clearance_observed@1": createDerivedTacticLineBlockerClearanceObservedV1Evidence,
  "derived.tactic.overload_exploitation_observed@1": createDerivedTacticOverloadExploitationObservedV1Evidence,
  "derived.tactic.overloaded_defender_response_conflict@1": createDerivedTacticOverloadedDefenderResponseConflictV1Evidence,
  "derived.tactic.promotion_pressure@1": createDerivedTacticPromotionPressureV1Evidence,
  "derived.tactic.sequence.defender_consequence@1": createDerivedTacticSequenceDefenderConsequenceV1Evidence,
  "derived.tactic.square_clearance_observed@1": createDerivedTacticSquareClearanceObservedV1Evidence,
  "human.explorer.population@1": createHumanExplorerPopulationV1Evidence,
  "human.explorer.position_stats@1": createHumanExplorerPositionStatsV1Evidence,
  "human.maia.candidate_wdl@1": createHumanMaiaCandidateWdlV1Evidence,
  "human.maia.event@1": createHumanMaiaEventV1Evidence,
  "human.maia.policy@1": createHumanMaiaPolicyV1Evidence,
  "human.maia.uci_response@1": createHumanMaiaUciResponseV1Evidence,
  "live.stockfish.eval@1": createLiveStockfishEvalV1Evidence,
  "live.stockfish.pv@1": createLiveStockfishPvV1Evidence,
  "live.stockfish.uci_response@1": createLiveStockfishUciResponseV1Evidence,
  "live.stockfish.wdl@1": createLiveStockfishWdlV1Evidence,
  "live.syzygy.category@1": createLiveSyzygyCategoryV1Evidence,
  "live.syzygy.distance@1": createLiveSyzygyDistanceV1Evidence,
  "live.syzygy.probe_result@1": createLiveSyzygyProbeResultV1Evidence,
  "live.syzygy.result@1": createLiveSyzygyResultV1Evidence,
  "pack.authored.claim_delivery@1": createPackAuthoredClaimDeliveryV1Evidence,
  "pack.authored.claim@1": createPackAuthoredClaimV1Evidence,
  "pack.authored.concept_reference@1": createPackAuthoredConceptReferenceV1Evidence,
  "pack.authored.phase@1": createPackAuthoredPhaseV1Evidence,
  "recorded.engine.eval@1": createRecordedEngineEvalV1Evidence,
  "recorded.tablebase.result@1": createRecordedTablebaseResultV1Evidence,
  "rules.castling.event.rights_lost@1": createRulesCastlingEventRightsLostV1Evidence,
  "rules.castling.reading.legality@1": createRulesCastlingReadingLegalityV1Evidence,
  "rules.castling.reading.rights@1": createRulesCastlingReadingRightsV1Evidence,
  "rules.endgame.classification@1": createRulesEndgameClassificationV1Evidence,
  "rules.exchange.predicate.legal_exchange@1": createRulesExchangePredicateLegalExchangeV1Evidence,
  "rules.exchange.reading.landing_captures@1": createRulesExchangeReadingLandingCapturesV1Evidence,
  "rules.king.event.zone_state@1": createRulesKingEventZoneStateV1Evidence,
  "rules.king.reading.zone_state@1": createRulesKingReadingZoneStateV1Evidence,
  "rules.mobility.event.piece_destinations@1": createRulesMobilityEventPieceDestinationsV1Evidence,
  "rules.mobility.reading.legal_moves@1": createRulesMobilityReadingLegalMovesV1Evidence,
  "rules.mobility.reading.piece_destinations@1": createRulesMobilityReadingPieceDestinationsV1Evidence,
  "rules.pawn.event.dynamics@1": createRulesPawnEventDynamicsV1Evidence,
  "rules.pawn.reading.candidate_majority@1": createRulesPawnReadingCandidateMajorityV1Evidence,
  "rules.pawn.reading.contacts@1": createRulesPawnReadingContactsV1Evidence,
  "rules.phase.development@1": createRulesPhaseDevelopmentV1Evidence,
  "rules.phase.reading@2": createRulesPhaseReadingV2Evidence,
  "rules.square.event.control@1": createRulesSquareEventControlV1Evidence,
  "rules.square.reading.control@1": createRulesSquareReadingControlV1Evidence,
  ...STRUCTURAL_EVENT_FACTORIES,
  "rules.structural.event.pawn_islands@1": createRulesStructuralEventPawnIslandsV1Evidence,
  ...STRUCTURAL_PREDICATE_FACTORIES,
  ...STRUCTURAL_READING_FACTORIES,
  "rules.structural.reading.named_structure@2": createRulesStructuralReadingNamedStructureV2Evidence,
  "rules.structural.reading.pawn_connectivity@1": createRulesStructuralReadingPawnConnectivityV1Evidence,
  "rules.structural.reading.space@1": createRulesStructuralReadingSpaceV1Evidence,
  "rules.tactic.consequence.forced_mate_after_move@1": createRulesTacticConsequenceForcedMateAfterMoveV1Evidence,
  "rules.tactic.consequence.forced_mate_after_move@2": createRulesTacticConsequenceForcedMateAfterMoveV2Evidence,
  "rules.tactic.consequence.mate_in_one@1": createRulesTacticConsequenceMateInOneV1Evidence,
  "rules.tactic.consequence.reply_breadth@1": createRulesTacticConsequenceReplyBreadthV1Evidence,
  "rules.tactic.consequence.threat@1": createRulesTacticConsequenceThreatV1Evidence,
  "rules.tactic.event.check@1": createRulesTacticEventCheckV1Evidence,
  "rules.tactic.event.defender_duty_relocated@1": createRulesTacticEventDefenderDutyRelocatedV1Evidence,
  "rules.tactic.event.defender_removed@1": createRulesTacticEventDefenderRemovedV1Evidence,
  "rules.tactic.event.double_attack@1": createRulesTacticEventDoubleAttackV1Evidence,
  "rules.tactic.event.loose_piece@1": createRulesTacticEventLoosePieceV1Evidence,
  "rules.tactic.reading.back_rank@1": createRulesTacticReadingBackRankV1Evidence,
  "rules.tactic.reading.defender_duty_set@1": createRulesTacticReadingDefenderDutySetV1Evidence,
  "rules.tactic.reading.discovered_latency@1": createRulesTacticReadingDiscoveredLatencyV1Evidence,
  "rules.tactic.reading.loose_piece@1": createRulesTacticReadingLoosePieceV1Evidence,
  "rules.tactic.reading.ray_classification@1": createRulesTacticReadingRayClassificationV1Evidence,
  "rules.tactic.reading.rook_on_seventh@1": createRulesTacticReadingRookOnSeventhV1Evidence,
  "rules.tactic.reading.trapped_piece@1": createRulesTacticReadingTrappedPieceV1Evidence,
  ...TRANSITION_EVENT_FACTORIES,
  ...TRANSITION_READING_FACTORIES,
  "run.record.checkpoint_hit@1": createRunRecordCheckpointHitV1Evidence,
  "run.record.consequence@1": createRunRecordConsequenceV1Evidence,
  "run.record.evidence_ref_resolution@1": createRunRecordEvidenceRefResolutionV1Evidence,
  "run.record.fork@1": createRunRecordForkV1Evidence,
  "run.record.imported_result@1": createRunRecordImportedResultV1Evidence,
  "run.record.move@1": createRunRecordMoveV1Evidence,
  "run.record.objective_transition@1": createRunRecordObjectiveTransitionV1Evidence,
  "run.record.position@1": createRunRecordPositionV1Evidence,
  "sourcing.ledger.citable_text@1": createSourcingLedgerCitableTextV1Evidence,
  "sourcing.ledger.engine_eval@1": createSourcingLedgerEngineEvalV1Evidence,
  "sourcing.ledger.explorer_position_census@1": createSourcingLedgerExplorerPositionCensusV1Evidence,
  "sourcing.ledger.tablebase_result@1": createSourcingLedgerTablebaseResultV1Evidence,
  "theory.endgame.setup_match@1": createTheoryEndgameSetupMatchV1Evidence,
  "theory.opening_identity.record@1": createTheoryOpeningIdentityRecordV1Evidence,
  "theory.opening.catalogue_membership@1": createTheoryOpeningCatalogueMembershipV1Evidence,
  "theory.opening.current_endpoint@1": createTheoryOpeningCurrentEndpointV1Evidence,
  "theory.shapes.firing@1": createTheoryShapesFiringV1Evidence,
  "run.record.edge@1": createRunRecordEdgeV1Evidence,
  "derived.exchange.trade_completed@2": createDerivedExchangeTradeCompletedV2Evidence,
  "derived.pawn.sequence.contact_timing@2": createDerivedPawnSequenceContactTimingV2Evidence,
  "derived.pawn.sequence.harassment_pressure@2": createDerivedPawnSequenceHarassmentPressureV2Evidence,
  "derived.tactic.sequence.defender_consequence@2": createDerivedTacticSequenceDefenderConsequenceV2Evidence,
  "derived.tactic.square_clearance_observed@2": createDerivedTacticSquareClearanceObservedV2Evidence,
  "derived.tactic.line_blocker_clearance_observed@2": createDerivedTacticLineBlockerClearanceObservedV2Evidence,
  "derived.tactic.deflection_observed@2": createDerivedTacticDeflectionObservedV2Evidence,
  "derived.tactic.attraction_observed@2": createDerivedTacticAttractionObservedV2Evidence,
  "derived.tactic.interference_observed@2": createDerivedTacticInterferenceObservedV2Evidence,
  "derived.tactic.check_zwischenzug_observed@2": createDerivedTacticCheckZwischenzugObservedV2Evidence,
  "derived.tactic.overload_exploitation_observed@2": createDerivedTacticOverloadExploitationObservedV2Evidence,
  "theory.endgame.method_stage@1": createTheoryEndgameMethodStageV1Evidence,
  // rfc/provider-exchange-and-execution.md §9: the five operation-keyed provider source factories
  // and the Syzygy local-domain adapter.
  "live.stockfish.legal_root_table@1": createLiveStockfishLegalRootTableV1Evidence,
  "live.stockfish.position_eval@1": createLiveStockfishPositionEvalV1Evidence,
  "live.stockfish.principal_variation@1": createLiveStockfishPrincipalVariationV1Evidence,
  "human.maia.policy_page@1": createHumanMaiaPolicyPageV1Evidence,
  "live.syzygy.position_result@1": createLiveSyzygyPositionResultV1Evidence,
  "live.syzygy.position_result@2": createLiveSyzygyPositionResultV2Evidence,
  "human.explorer.position_page@1": createHumanExplorerPositionPageV1Evidence,
  "derived.explorer.population_summary@1": createDerivedExplorerPopulationSummaryV1Evidence,
  "derived.explorer.repertoire_frontier@1": createDerivedExplorerRepertoireFrontierV1Evidence,
  "derived.explorer.position_frequency@1": createDerivedExplorerPositionFrequencyV1Evidence,
  "derived.explorer.inspector_population@1": createDerivedExplorerInspectorPopulationV1Evidence,
  "rules.endgame.tablebase_domain@1": createRulesEndgameTablebaseDomainV1Evidence,
  // rfc/hint-distance.md §1.1/§3: seven operator-only horizons and 35 learner disclosures.
  ...HINT_HORIZON_FACTORIES,
  ...HINT_DISCLOSURE_FACTORIES,
  // rfc/bounded-policy-targets.md §4: the three bounded-target value routes.
  "derived.bounded_target.named_material_target@1": createDerivedBoundedTargetNamedMaterialTargetV1Evidence,
  "derived.bounded_target.immediate@1": createDerivedBoundedTargetImmediateV1Evidence,
  "derived.bounded_target.bounded_return@1": createDerivedBoundedTargetBoundedReturnV1Evidence,
  // rfc/bounded-target-policy-composition.md §4: the two reported policy derivations.
  "derived.bounded_target.engine_target_policy@1": createDerivedBoundedTargetEngineTargetPolicyV1Evidence,
  "derived.bounded_target.policy_bounds@1": createDerivedBoundedTargetPolicyBoundsV1Evidence,
});

type Routes = typeof EVIDENCE_VALUE_ROUTES;
export type EvidenceValueRoute = keyof Routes;
/** Generated: each literal route's exact authority-input type. */
export type EvidenceValueRouteInputs = { readonly [Route in EvidenceValueRoute]: Parameters<Routes[Route]>[0] };
/** Generated: each literal route's exact result type. */
export type EvidenceValueRouteResults = { readonly [Route in EvidenceValueRoute]: ReturnType<Routes[Route]> };

function admitArm(arm: EvidenceInputArm, input: Readonly<Record<string, unknown>>, keysOnly = false): string | undefined {
  const keys = Object.keys(input);
  const required = Object.entries(arm).filter(([, spec]) => spec.optional !== true).map(([key]) => key);
  const extra = keys.filter((key) => !Object.hasOwn(arm, key));
  const missing = required.filter((key) => !keys.includes(key));
  if (extra.length > 0 || missing.length > 0) return `input keys differ from the route arm (missing: ${missing.join(", ") || "-"}; extra: ${extra.join(", ") || "-"})`;
  if (keysOnly) return undefined;
  for (const key of keys) {
    const spec = arm[key]!;
    const candidate = input[key];
    if (candidate === undefined && spec.optional === true) continue;
    const failure = admitInputValue(spec, candidate);
    if (failure !== undefined) return `${key} ${failure}`;
  }
  return undefined;
}

/**
 * The single dispatcher. Unknown routes, missing/extra keys, crossed inputs and authority-validator
 * failures are rejected before the factory runs.
 */
export class EvidenceValueRouteLookupError extends TypeError {
  constructor(readonly route: unknown) { super(`Unknown evidence value route ${String(route)}`); this.name = "EvidenceValueRouteLookupError"; }
}
export function invokeEvidenceValueRoute<Route extends EvidenceValueRoute>(route: Route, inputs: EvidenceValueRouteInputs[Route]): EvidenceValueRouteResults[Route] {
  if (typeof route !== "string" || !Object.hasOwn(EVIDENCE_VALUE_ROUTES, route)) throw new EvidenceValueRouteLookupError(route);
  const operation = EVIDENCE_VALUE_ROUTES[route] as unknown as EvidenceValueFactory<unknown, unknown>;
  if (typeof inputs !== "object" || inputs === null || Array.isArray(inputs) || Object.getPrototypeOf(inputs) !== Object.prototype) throw new TypeError(`Evidence route ${route} requires a plain authority-input record`);
  const record = inputs as Readonly<Record<string, unknown>>;
  const keyFailures = operation.meta.arms.map((arm) => admitArm(arm, record, true));
  if (keyFailures.every((failure) => failure !== undefined)) throw new TypeError(`Evidence route ${route} refused its authority inputs: ${keyFailures.join(" / ")}`);
  // Read each declared field once. Admission, computation and the receipt use the same
  // values; opaque sealed providers/runs retain their identity rather than being deep-cloned.
  const captured = Object.fromEntries(Object.keys(record).map((key) => [key, record[key]]));
  const failures = operation.meta.arms.map((arm) => admitArm(arm, captured));
  if (failures.every((failure) => failure !== undefined)) throw new TypeError(`Evidence route ${route} refused its authority inputs: ${failures.join(" / ")}`);
  return operation(captured) as EvidenceValueRouteResults[Route];
}

/** Registry metadata for the permanent gate (route, symbol, shape, arms, dependency, pending). */
export function evidenceValueRouteRegistry(): readonly EvidenceValueFactoryMeta[] {
  return Object.freeze(Object.entries(EVIDENCE_VALUE_ROUTES).map(([route, operation]) => {
    const meta = (operation as unknown as EvidenceValueFactory<unknown, unknown>).meta;
    if (meta.route !== route) throw new TypeError(`Evidence route ${route} dispatches to ${meta.route}`);
    if ((operation as { readonly name: string }).name !== meta.symbol) throw new TypeError(`Evidence route ${route} factory name ${(operation as { readonly name: string }).name} is not ${meta.symbol}`);
    return meta;
  }));
}

// Identity inspection only, never an alternate dispatcher or mutable binding registry.
const comparisonReductionBinding = Object.freeze({ identity: COMPARISON_REDUCTION_CONTRACT, factory: createDerivedCompareStructureDeltaV2Evidence,
  reader: readComparisonStructuralPopulation, computation: comparisonStructuralAppearances });
export function inspectComparisonReductionBinding() {
  const factory = EVIDENCE_VALUE_ROUTES["derived.compare.structure_delta@2"];
  if (factory !== createDerivedCompareStructureDeltaV2Evidence || factory.name !== COMPARISON_REDUCTION_CONTRACT.factory
    || factory.meta.route !== "derived.compare.structure_delta@2" || factory.meta.shape !== "derived" || factory.meta.result !== "items") throw new TypeError("Comparison reduction lacks its actual central factory binding");
  if (comparisonReductionBinding.factory !== factory || comparisonReductionBinding.reader !== readComparisonStructuralPopulation || comparisonReductionBinding.computation !== comparisonStructuralAppearances) throw new TypeError("Comparison source/computation function identities changed");
  return comparisonReductionBinding;
}

const lastLevelReductionBinding = Object.freeze({ identity: LAST_LEVEL_REDUCTION_CONTRACT, factory: createDerivedStoryLastLevelV2Evidence,
  reader: readRecordedLastLevelPopulation, computation: lastRecordedAvailableLevel });
export function inspectEvidenceReductionBinding(operation: VersionedEvidenceId) {
  const contract = evidenceReductionContract(operation);
  if (contract === COMPARISON_REDUCTION_CONTRACT) return inspectComparisonReductionBinding();
  const factory = EVIDENCE_VALUE_ROUTES["derived.story.last_level@2"];
  if (factory !== createDerivedStoryLastLevelV2Evidence || factory.name !== contract.factory || factory.meta.route !== "derived.story.last_level@2"
    || factory.meta.shape !== "derived" || factory.meta.result !== "items" || lastLevelReductionBinding.reader !== readRecordedLastLevelPopulation
    || lastLevelReductionBinding.computation !== lastRecordedAvailableLevel) throw new TypeError("Last-level reduction lacks its exact central factory/source/computation binding");
  return lastLevelReductionBinding;
}
