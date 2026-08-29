// Disposable authoring contract for D1862. This is a specification input, not production code.
export const COMPONENT_IDS = Object.freeze([
  "distribution", "outcome_split", "magnitude", "magnitude_trail", "square_set",
  "move_path", "relation_overlay", "count_with_denominator", "citation", "enum_state",
  "claim", "fact_statement", "abstention", "structured_document",
] as const);
export type ComponentId = (typeof COMPONENT_IDS)[number];

export interface AdapterFamilyPlan {
  readonly id: string;
  readonly consumers: readonly string[];
  readonly projections: readonly string[];
  readonly parser: string;
  readonly retained: readonly string[];
  readonly components: readonly ComponentId[];
  readonly assertions: readonly string[];
  /** Serve the exact non-machine forms on the compiled binding; never infer or widen a form. */
  readonly formPolicy: "exact_binding_forms" | "remove_all_non_machine_forms";
  readonly disposition: "adapt" | "remove_visual_binding" | "repair_projection_operands";
  readonly reason?: string;
}

export interface PresentationDecisionStamp {
  readonly eventHeadSeq: number;
  readonly cursor: Readonly<{ branchId: string; nodeId: string }>;
  readonly disclosureBoundarySeq: number | null;
  readonly digest: string;
}

export type PresentationAbstentionLifecycle =
  | Readonly<{
      kind: "pending";
      requestId: string;
      decision: PresentationDecisionStamp;
    }>
  | Readonly<{
      kind: "settled_abstention";
      requestId: string;
      decision: PresentationDecisionStamp;
      absence: "withheld" | "unavailable" | "failed" | "empty";
      reasonRef: string;
      sourceReceipt: Readonly<{ producer: string; projection: string; receiptDigest: string }>;
    }>;

export function samePresentationDecision(
  left: PresentationDecisionStamp,
  right: PresentationDecisionStamp,
): boolean {
  return left.eventHeadSeq === right.eventHeadSeq
    && left.cursor.branchId === right.cursor.branchId
    && left.cursor.nodeId === right.cursor.nodeId
    && left.disclosureBoundarySeq === right.disclosureBoundarySeq
    && left.digest === right.digest;
}

const structural = Object.freeze([
  "rules.structural.reading.backward_pawn@1", "rules.structural.reading.bishop_on_shade@1",
  "rules.structural.reading.direct_attack_count@1", "rules.structural.reading.doubled_pawn@1",
  "rules.structural.reading.half_open_file@1", "rules.structural.reading.isolated_pawn@1",
  "rules.structural.reading.king_opposition@1", "rules.structural.reading.king_zone@1",
  "rules.structural.reading.line_blockers@1", "rules.structural.reading.open_file@1",
  "rules.structural.reading.outpost@1", "rules.structural.reading.passed_pawn@1",
  "rules.structural.reading.pawn_safe_square@1", "rules.structural.reading.piece_count@1",
  "rules.structural.reading.piece_distance@1", "rules.structural.reading.piece_reach_count@1",
]);
const guidanceTextConsumers = Object.freeze(["guidance.deterministic@1", "guidance.voice_story@1", "guidance.voice@1"]);
const transitionCounts = Object.freeze([
  "rules.transition.reading.attacked_squares_changed.gained@1",
  "rules.transition.reading.attacked_squares_changed.lost@1",
  "rules.transition.reading.defended_duties_changed.acquired@1",
  "rules.transition.reading.defended_duties_changed.released@1",
  "rules.transition.reading.defended_squares_changed.gained@1",
  "rules.transition.reading.defended_squares_changed.lost@1",
  "rules.transition.reading.escape_squares_changed.gained@1",
  "rules.transition.reading.escape_squares_changed.lost@1",
  "rules.transition.reading.slider_lines_changed.closed@1",
  "rules.transition.reading.slider_lines_changed.opened@1",
]);
const transitionStates = Object.freeze([
  "rules.transition.reading.move_irreversibility.castled@1",
  "rules.transition.reading.move_irreversibility.clock_zeroed@1",
  "rules.transition.reading.move_irreversibility.last_of_role@1",
  "rules.transition.reading.move_irreversibility.pawn_break@1",
]);

type AdapterFamilyInput = Omit<AdapterFamilyPlan, "formPolicy"> &
  Partial<Pick<AdapterFamilyPlan, "formPolicy">>;

const family = (value: AdapterFamilyInput): AdapterFamilyPlan => Object.freeze({
  ...value,
  formPolicy: value.formPolicy ?? (value.disposition === "remove_visual_binding"
    ? "remove_all_non_machine_forms"
    : "exact_binding_forms"),
  consumers: Object.freeze(value.consumers), projections: Object.freeze(value.projections),
  retained: Object.freeze(value.retained), components: Object.freeze(value.components),
  assertions: Object.freeze(value.assertions),
});

export const PRESENTATION_ADAPTER_FAMILIES: readonly AdapterFamilyPlan[] = Object.freeze([
  family({ id: "authoring_evidence_record", consumers: ["authoring.claim_binding@1"], projections: [
    "sourcing.ledger.engine_eval@1", "sourcing.ledger.explorer_position_census@1",
    "sourcing.ledger.tablebase_result@1", "theory.opening_identity.record@1",
  ], parser: "parseEvidenceRecordDocument", retained: ["kind", "sourceId", "retrievedAt", "values"], components: ["structured_document"], assertions: ["record_kind_schema_matches", "canonical_values_preserved"], disposition: "adapt" }),
  family({ id: "pivotal_marker", consumers: ["board.pivotal_marker@1", "compare.structure_strip@1", "guidance.deterministic@1", "guidance.voice_compare@1", "guidance.voice_story@1", "guidance.voice@1", "review.story@1"], projections: ["rules.pivotal.marker@1"], parser: "parsePivotalMarker", retained: ["nodeId", "kind", "detail", "provenanceNote"], components: ["enum_state"], assertions: ["marker_kind_registered", "node_and_detail_preserved"], disposition: "adapt" }),
  family({ id: "structural_square_set", consumers: ["board.selected_square_sight@1", "inspector.position_structure@1"], projections: structural, parser: "parseStructuralObservation", retained: ["kind", "squares"], components: ["square_set", "enum_state"], assertions: ["kind_registered", "squares_byte_equal", "one_fact_per_square_set"], disposition: "adapt" }),
  family({ id: "named_structure_nonboard", consumers: ["inspector.position_structure@1", ...guidanceTextConsumers], projections: ["rules.structural.reading.named_structure@1"], parser: "parseNamedStructure", retained: ["provenanceNote"], components: ["enum_state"], assertions: ["registered_structure_identity_from_admitted_payload", "provenance_preserved"], disposition: "adapt" }),
  family({ id: "named_structure_board_operand_gap", consumers: ["board.selected_square_sight@1"], projections: ["rules.structural.reading.named_structure@1"], parser: "none_until_exact_trigger_squares", retained: ["provenanceNote"], components: [], assertions: ["D2047_requires_squares_before_board_form"], disposition: "repair_projection_operands", reason: "lit_squares and piece_halo cannot be constructed from provenanceNote" }),
  family({ id: "engine_trajectory", consumers: ["compare.engine_trajectory@1"], projections: ["derived.compare.engine_trajectory@1"], parser: "parseComparisonEvidenceEntry", retained: ["nodeId", "plyOffset", "evidenceRefs", "kind", "source", "score"], components: ["magnitude_trail"], assertions: ["registered_scale_only", "point_source_and_score_preserved"], disposition: "adapt" }),
  family({ id: "piece_route", consumers: ["compare.structure_strip@1"], projections: ["derived.compare.piece_route@1"], parser: "parsePieceRoute", retained: ["pieceId", "squares"], components: ["move_path"], assertions: ["ordered_squares_preserved", "piece_identity_preserved"], disposition: "adapt" }),
  family({ id: "structure_delta", consumers: ["compare.structure_strip@1", "guidance.voice_compare@1"], projections: ["derived.compare.structure_delta@1"], parser: "parseStructuralObservationChange", retained: ["observation"], components: ["enum_state", "square_set"], assertions: ["nested_observation_preserved", "square_set_only_when_observation_has_squares"], disposition: "adapt" }),
  family({ id: "recorded_checkpoint", consumers: ["compare.structure_strip@1", "guidance.voice_compare@1"], projections: ["run.record.checkpoint_hit@1"], parser: "parseRecordedCheckpoint", retained: ["context", "checkpointId", "plyOffset"], components: ["fact_statement"], assertions: ["registered_renderer_only", "checkpoint_and_offset_preserved"], disposition: "adapt" }),
  family({ id: "recorded_objective_transition", consumers: ["compare.structure_strip@1", "guidance.voice_compare@1"], projections: ["run.record.objective_transition@1"], parser: "parseRecordedObjectiveTransition", retained: ["context", "from", "to"], components: ["fact_statement"], assertions: ["registered_renderer_only", "from_to_preserved"], disposition: "adapt" }),
  family({ id: "authored_claim_delivery", consumers: ["guidance.authored_claim@1"], projections: ["pack.authored.claim_delivery@1"], parser: "parseAuthoredFeedbackClaim", retained: ["kind", "id", "text", "binding", "evidenceTypes", "earnedEvidenceTypes", "principles"], components: ["claim"], assertions: ["text_byte_equal", "binding_and_ground_preserved"], disposition: "adapt" }),
  family({ id: "authored_claim", consumers: guidanceTextConsumers, projections: ["pack.authored.claim@1"], parser: "parseAuthoredClaimEvidence", retained: ["id", "text", "attribution"], components: ["claim"], assertions: ["text_byte_equal", "attribution_preserved"], disposition: "adapt" }),
  family({ id: "pack_phase_operand_gap", consumers: guidanceTextConsumers, projections: ["pack.authored.phase@1"], parser: "none_until_phase_operand_declared", retained: [], components: [], assertions: ["D2046_requires_phase_operand"], disposition: "repair_projection_operands", reason: "a visual phase sentence cannot retain an empty operand declaration" }),
  family({ id: "endgame_state", consumers: [...guidanceTextConsumers, "review.story@1"], projections: ["rules.endgame.reading@1"], parser: "parseEndgameReading", retained: ["type", "techniques", "provenanceNote"], components: ["enum_state"], assertions: ["endgame_type_registered", "techniques_and_provenance_preserved"], disposition: "adapt" }),
  family({ id: "phase_state", consumers: guidanceTextConsumers, projections: ["rules.phase.reading@1"], parser: "parsePhaseReading", retained: ["fen", "phase", "material", "undevelopedMinors", "provenanceNote"], components: ["enum_state"], assertions: ["phase_registered", "classification_operands_preserved"], disposition: "adapt" }),
  family({ id: "recorded_engine_magnitude", consumers: ["guidance.recorded_reading@1"], projections: ["recorded.engine.eval@1"], parser: "parseRecordedEngineReading", retained: ["kind", "fen", "sourceId", "retrievedAt", "values"], components: ["magnitude"], assertions: ["score_frame_and_bound_from_source_receipt", "fen_and_values_preserved"], disposition: "adapt" }),
  family({ id: "recorded_tablebase_state", consumers: ["guidance.recorded_reading@1"], projections: ["recorded.tablebase.result@1"], parser: "parseRecordedTablebaseReading", retained: ["kind", "fen", "sourceId", "retrievedAt", "values"], components: ["enum_state"], assertions: ["tablebase_category_registered", "fen_and_values_preserved"], disposition: "adapt" }),
  family({ id: "compare_eval_delta", consumers: ["guidance.voice_compare@1"], projections: ["derived.compare.eval_delta@1"], parser: "parseRecordedEvalDelta", retained: ["delta", "plyOffset"], components: ["magnitude"], assertions: ["delta_and_offset_preserved", "registered_cp_scale"], disposition: "adapt" }),
  family({ id: "recorded_consequence", consumers: ["guidance.voice_compare@1", "guidance.voice_story@1", "review.story@1"], projections: ["run.record.consequence@1"], parser: "parseRecordedConsequence", retained: ["context", "terminal"], components: ["fact_statement"], assertions: ["registered_renderer_only", "terminal_state_preserved"], disposition: "adapt" }),
  family({ id: "recorded_fork", consumers: ["guidance.voice_compare@1"], projections: ["run.record.fork@1"], parser: "parseRecordedFork", retained: ["context", "forkNodeId", "sharedPly"], components: ["fact_statement"], assertions: ["registered_renderer_only", "fork_identity_preserved"], disposition: "adapt" }),
  family({ id: "recorded_move", consumers: ["guidance.voice_compare@1"], projections: ["run.record.move@1"], parser: "parseRecordedMove", retained: ["context", "offset", "moveSan"], components: ["fact_statement"], assertions: ["registered_renderer_only", "offset_and_san_preserved"], disposition: "adapt" }),
  family({ id: "story_eval_shift", consumers: ["guidance.voice_story@1", "review.story@1"], projections: ["derived.story.eval_shift@1"], parser: "parseStoryEvaluationShift", retained: ["before", "after", "delta"], components: ["magnitude"], assertions: ["before_after_delta_coherent", "registered_cp_scale"], disposition: "adapt" }),
  family({ id: "story_last_level", consumers: ["guidance.voice_story@1", "review.story@1"], projections: ["derived.story.last_level@1"], parser: "parseStoryLastLevel", retained: ["recordedResult", "evaluation"], components: ["magnitude", "fact_statement"], assertions: ["registered_renderer_only", "result_and_evaluation_preserved"], disposition: "adapt" }),
  family({ id: "story_title", consumers: ["guidance.voice_story@1", "review.story@1"], projections: ["derived.story.title@1"], parser: "parseStoryTitle", retained: ["title", "rank", "outcome"], components: ["fact_statement"], assertions: ["registered_renderer_only", "title_rank_outcome_preserved"], disposition: "adapt" }),
  family({ id: "imported_result", consumers: ["guidance.voice_story@1", "review.story@1"], projections: ["run.record.imported_result@1"], parser: "parseImportedResult", retained: ["context", "result"], components: ["fact_statement"], assertions: ["registered_renderer_only", "result_preserved"], disposition: "adapt" }),
  family({ id: "shape_firing", consumers: ["guidance.voice_story@1", "review.story@1", "theory.shape_firing@1"], projections: ["theory.shapes.firing@1"], parser: "parseShapeFiring", retained: ["entryId", "firstNodeId", "lastNodeId", "openEnded"], components: ["enum_state"], assertions: ["entry_identity_preserved", "span_preserved"], disposition: "adapt" }),
  family({ id: "explorer_population", consumers: ["inspector.corpus@1"], projections: ["human.explorer.population@1"], parser: "parseCorpusPage", retained: ["nodeId", "result", "committedMoveSan"], components: ["distribution", "outcome_split"], assertions: ["candidate_counts_and_total_preserved", "wdl_numerators_share_denominator"], disposition: "adapt" }),
  family({ id: "maia_policy", consumers: ["inspector.human_split@1"], projections: ["human.maia.policy@1"], parser: "parseHumanSplitPage", retained: ["nodeId", "engine", "targetElo", "candidates"], components: ["distribution"], assertions: ["candidate_identity_and_mass_preserved", "model_identity_from_source"], disposition: "adapt" }),
  family({ id: "transition_count", consumers: ["inspector.move_transition@1"], projections: transitionCounts, parser: "parseTransitionCount", retained: ["kind", "color", "direction", "count", "provenanceNote"], components: ["magnitude", "enum_state"], assertions: ["count_nonnegative", "kind_color_direction_preserved"], disposition: "adapt" }),
  family({ id: "transition_state", consumers: ["inspector.move_transition@1"], projections: transitionStates, parser: "parseTransitionState", retained: ["kind", "subkind", "provenanceNote"], components: ["enum_state"], assertions: ["kind_and_subkind_registered", "provenance_preserved"], disposition: "adapt" }),
  family({ id: "opponent_candidate_vector", consumers: ["opponent.selection@1"], projections: ["derived.opponent.candidate_feature_vector@1"], parser: "parseCandidateFeatureVector", retained: ["beforeFen", "scoreFrame", "engine", "candidates"], components: ["structured_document"], assertions: ["candidate_vectors_preserved", "score_frame_and_engine_preserved"], disposition: "adapt" }),
  family({ id: "maia_uci_operand_gap", consumers: ["opponent.selection@1"], projections: ["human.maia.uci_response@1"], parser: "none_until_uci_lines_declared", retained: [], components: [], assertions: ["D2046_requires_uci_operands"], disposition: "repair_projection_operands" }),
  family({ id: "stockfish_uci_operand_gap", consumers: ["opponent.selection@1"], projections: ["live.stockfish.uci_response@1"], parser: "none_until_uci_lines_declared", retained: [], components: [], assertions: ["D2046_requires_uci_operands"], disposition: "repair_projection_operands" }),
  family({ id: "syzygy_probe", consumers: ["opponent.selection@1"], projections: ["live.syzygy.probe_result@1"], parser: "parseTablebasePosition", retained: ["category", "moves"], components: ["structured_document"], assertions: ["category_and_moves_preserved", "tablebase_exactness_preserved"], disposition: "adapt" }),
  family({ id: "runtime_evidence", consumers: ["runtime.evidence_ref@1"], projections: ["human.maia.event@1", "live.stockfish.eval@1", "live.stockfish.pv@1", "live.stockfish.wdl@1", "live.syzygy.result@1"], parser: "parseEvidencePayloadByProjection", retained: ["kind", "source", "values"], components: ["structured_document"], assertions: ["projection_specific_schema", "source_and_values_preserved"], disposition: "adapt" }),
  family({ id: "evidence_ref_resolution", consumers: ["runtime.evidence_ref@1"], projections: ["run.record.evidence_ref_resolution@1"], parser: "parseEvidenceReferenceResolution", retained: ["reference", "text", "sourceLabel"], components: ["fact_statement", "citation"], assertions: ["registered_renderer_only", "reference_text_source_preserved"], disposition: "adapt" }),
  family({ id: "repertoire_population", consumers: ["runtime.repertoire_scan@1"], projections: ["human.explorer.position_stats@1"], parser: "parseCorpusResult", retained: ["kind", "population"], components: ["distribution", "outcome_split"], assertions: ["population_counts_preserved", "shared_denominator_preserved"], disposition: "adapt" }),
  family({ id: "story_rank_internal", consumers: ["review.story@1"], projections: ["derived.story.rank@1"], parser: "parseStoryRank", retained: ["rank"], components: [], assertions: ["D2048_visual_binding_removed", "rank_retained_by_selector"], disposition: "remove_visual_binding", reason: "selection order is not learner-visible evidence" }),
]);
