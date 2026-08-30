// Disposable authoring contract for D1862/D2135-D2140. This specifies the RFC, not production code.
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
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

// The family table above is only a compact author input. These exact rows are the controlling
// presentation authority after the D2135-D2140 return.
export type PresentationConsumerClass =
  | "ordinary_presented"
  | "inspector_presented"
  | "author_operator_presented"
  | "non_presentational_operation";

export interface PresentationConsumerClassRow {
  readonly consumer: string;
  readonly class: PresentationConsumerClass;
  readonly reachabilityAnchor: string;
  readonly operation: string;
}

const consumerClass = (
  consumer: string,
  classification: PresentationConsumerClass,
  reachabilityAnchor: string,
  operation: string,
): PresentationConsumerClassRow => Object.freeze({ consumer, class: classification, reachabilityAnchor, operation });

export const PRESENTATION_CONSUMER_CLASSES: readonly PresentationConsumerClassRow[] = Object.freeze([
  consumerClass("authoring.claim_binding@1", "author_operator_presented", "apps/server/src/sourcing/claim-binding.ts", "consumeClaimBindingRecords"),
  consumerClass("board.pivotal_marker@1", "ordinary_presented", "packages/runtime/src/pivotal.ts", "consumePivotalMarkers"),
  consumerClass("board.selected_square_sight@1", "ordinary_presented", "packages/runtime/src/reading-evidence.ts", "consumeSelectedSquareSight"),
  consumerClass("compare.engine_trajectory@1", "ordinary_presented", "packages/runtime/src/compare-strips.ts", "consumeComparisonEngineTrajectory"),
  consumerClass("compare.structure_strip@1", "ordinary_presented", "packages/runtime/src/compare-strips.ts", "consumeComparisonStripEvidence"),
  consumerClass("guidance.authored_claim@1", "ordinary_presented", "apps/web/src/lib/claim-presentation.ts", "claimProvenanceDeclared"),
  consumerClass("guidance.deterministic@1", "ordinary_presented", "apps/server/src/guidance.ts", "renderedEvidenceItems"),
  consumerClass("guidance.recorded_reading@1", "ordinary_presented", "apps/server/src/guidance.ts", "renderRecordedReadingEvidence"),
  consumerClass("guidance.voice@1", "ordinary_presented", "apps/server/src/guidance.ts", "voiceEvidenceView"),
  consumerClass("guidance.voice_compare@1", "ordinary_presented", "packages/runtime/src/compare-strips.ts", "comparisonNarrative"),
  consumerClass("guidance.voice_story@1", "ordinary_presented", "packages/runtime/src/story.ts", "storyDeclaredEvidence"),
  consumerClass("inspector.corpus@1", "inspector_presented", "apps/web/src/lib/inspector-evidence.ts", "consumeCorpus"),
  consumerClass("inspector.human_split@1", "inspector_presented", "apps/web/src/lib/inspector-evidence.ts", "consumeHumanSplit"),
  consumerClass("inspector.move_transition@1", "inspector_presented", "packages/runtime/src/reading-evidence.ts", "consumeMoveTransition"),
  consumerClass("inspector.position_structure@1", "inspector_presented", "packages/runtime/src/reading-evidence.ts", "consumePositionStructure"),
  consumerClass("opponent.selection@1", "non_presentational_operation", "apps/server/src/opponent-selector.ts", "consumeOpponentSelectionEvidence"),
  consumerClass("review.story@1", "ordinary_presented", "packages/runtime/src/story.ts", "renderReviewStoryEvidence"),
  consumerClass("runtime.evidence_ref@1", "inspector_presented", "apps/web/src/lib/evidence-sentences.ts", "renderDeclaredEvidenceRef"),
  consumerClass("runtime.repertoire_scan@1", "non_presentational_operation", "apps/server/src/repertoire.ts", "consumeRepertoireCorpus"),
  consumerClass("theory.shape_firing@1", "ordinary_presented", "packages/runtime/src/shape-firing.ts", "consumeShapeFiring"),
]);

type NonMachineEvidenceForm = "sentence" | "list" | "timeline_marker" | "lit_squares" | "arrows" | "piece_halo" | "panel" | "audio";
const formCapabilities = (...forms: readonly NonMachineEvidenceForm[]): readonly NonMachineEvidenceForm[] => Object.freeze([...forms]);

export const COMPONENT_FORM_CAPABILITIES: Readonly<Record<ComponentId, readonly NonMachineEvidenceForm[]>> = Object.freeze({
  distribution: formCapabilities("list", "panel", "sentence"),
  outcome_split: formCapabilities("list", "panel", "sentence"),
  magnitude: formCapabilities("list", "panel", "sentence", "timeline_marker"),
  magnitude_trail: formCapabilities("list", "panel", "timeline_marker"),
  square_set: formCapabilities("list", "panel", "lit_squares", "piece_halo"),
  move_path: formCapabilities("list", "panel", "arrows", "sentence"),
  relation_overlay: formCapabilities("panel", "arrows", "lit_squares", "piece_halo", "sentence"),
  count_with_denominator: formCapabilities("list", "panel", "sentence"),
  citation: formCapabilities("list", "panel", "sentence"),
  enum_state: formCapabilities("list", "panel", "sentence", "timeline_marker"),
  claim: formCapabilities("list", "panel", "sentence", "audio"),
  fact_statement: formCapabilities("list", "panel", "sentence", "timeline_marker", "audio"),
  abstention: formCapabilities("sentence", "list", "timeline_marker", "lit_squares", "arrows", "piece_halo", "panel", "audio"),
  structured_document: formCapabilities("list", "panel"),
});

export type PresentationRenderTarget =
  | Readonly<{ kind: "component"; component: ComponentId; forms: readonly NonMachineEvidenceForm[] }>
  | Readonly<{ kind: "composition"; compositionId: string;
      members: readonly Readonly<{ component: ComponentId; forms: readonly NonMachineEvidenceForm[] }>[];
      forms: readonly NonMachineEvidenceForm[] }>;

export interface ExactPresentationAdapterRow {
  readonly key: string;
  readonly familyId: string;
  readonly consumer: string;
  readonly projection: string;
  readonly parser: string;
  readonly retained: readonly string[];
  readonly forms: readonly NonMachineEvidenceForm[];
  readonly target: PresentationRenderTarget | null;
  readonly disposition: "adapt" | "repair_projection_operands" | "remove_visual_binding";
}

const refKey = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;
const pairKey = (consumer: string, projection: string): string => `${consumer}\0${projection}`;
const familyByPair = new Map(PRESENTATION_ADAPTER_FAMILIES.flatMap((entry) => entry.consumers.flatMap(
  (consumer) => entry.projections.map((projection) => [pairKey(consumer, projection), entry] as const),
)));
const classByConsumer = new Map(PRESENTATION_CONSUMER_CLASSES.map((row) => [row.consumer, row.class] as const));

const target = (component: ComponentId, forms: readonly NonMachineEvidenceForm[]): PresentationRenderTarget =>
  Object.freeze({ kind: "component", component, forms: Object.freeze([...forms]) });
const composition = (
  compositionId: string,
  members: readonly Readonly<{ component: ComponentId; forms: readonly NonMachineEvidenceForm[] }>[],
  forms: readonly NonMachineEvidenceForm[],
): PresentationRenderTarget => Object.freeze({
  kind: "composition", compositionId,
  members: Object.freeze(members.map((member) => Object.freeze({ component: member.component, forms: Object.freeze([...member.forms]) }))),
  forms: Object.freeze([...forms]),
});

function renderTargetFor(family: AdapterFamilyPlan, consumer: string, forms: readonly NonMachineEvidenceForm[]): PresentationRenderTarget | null {
  if (family.disposition === "remove_visual_binding") return null;
  if (family.id === "named_structure_board_operand_gap") return target("square_set", forms);
  if (family.id === "pack_phase_operand_gap") return target("enum_state", forms);
  if (family.id === "structural_square_set") return consumer === "board.selected_square_sight@1"
    ? target("square_set", forms)
    : composition("structural_reading", [
      { component: "enum_state", forms }, { component: "square_set", forms },
    ], forms);
  if (family.id === "structure_delta") return composition("structural_delta", [
    { component: "enum_state", forms },
    { component: "square_set", forms: forms.filter((form) => form !== "sentence") },
  ], forms);
  if (family.id === "story_last_level") return target("magnitude", forms);
  if (family.id === "explorer_population") return composition("population_distribution", [
    { component: "distribution", forms }, { component: "outcome_split", forms },
  ], forms);
  if (family.id === "transition_count") return composition("counted_transition_state", [
    { component: "magnitude", forms }, { component: "enum_state", forms },
  ], forms);
  if (family.id === "evidence_ref_resolution") return composition("reference_statement", [
    { component: "fact_statement", forms }, { component: "citation", forms },
  ], forms);
  if (family.components.length !== 1) throw new TypeError(`No exact presentation composition for ${family.id}`);
  return target(family.components[0]!, forms);
}

export const PRESENTATION_ADAPTER_ROWS: readonly ExactPresentationAdapterRow[] = Object.freeze(
  PRIMARY_EVIDENCE_MANIFEST.bindings.flatMap((binding) => {
    const consumer = refKey(binding.consumer);
    const projection = refKey(binding.projection);
    const forms = binding.forms.filter((form): form is NonMachineEvidenceForm => form !== "machine_condition");
    if (forms.length === 0 || classByConsumer.get(consumer) === "non_presentational_operation") return [];
    const family = familyByPair.get(pairKey(consumer, projection));
    if (family === undefined) throw new TypeError(`No presentation family for ${consumer} -> ${projection}`);
    const disposition = family.id === "recorded_consequence" ? "repair_projection_operands" : family.disposition;
    return [Object.freeze({
      key: pairKey(consumer, projection), familyId: family.id, consumer, projection,
      parser: family.parser,
      retained: Object.freeze(family.id === "recorded_consequence"
        ? ["context", "terminal", "outcome", "plies", "objectiveState"]
        : [...family.retained]),
      forms: Object.freeze(forms), target: renderTargetFor(family, consumer, forms), disposition,
    })];
  }).sort((left, right) => left.consumer.localeCompare(right.consumer) || left.projection.localeCompare(right.projection)),
);

export interface ManifestPresentationRepair {
  readonly id: string;
  readonly source: "packages/runtime/src/evidence-catalog.ts" | "packages/runtime/src/evidence-source-adapters.ts" | "packages/runtime/src/structure.ts";
  readonly operation: string;
  readonly before: string;
  readonly after: string;
}

export const MANIFEST_PRESENTATION_REPAIRS: readonly ManifestPresentationRepair[] = Object.freeze([
  { id: "internal-opponent", source: "packages/runtime/src/evidence-catalog.ts", operation: "opponent.selection@1 forms", before: "list,panel,machine_condition", after: "machine_condition" },
  { id: "internal-repertoire", source: "packages/runtime/src/evidence-catalog.ts", operation: "runtime.repertoire_scan@1 forms", before: "list,panel", after: "machine_condition" },
  { id: "internal-story-rank", source: "packages/runtime/src/evidence-catalog.ts", operation: "derived.story.rank@1 forms", before: "list,panel", after: "machine_condition" },
  { id: "named-structure-geometry", source: "packages/runtime/src/structure.ts", operation: "StructureMatch retained witness", before: "id,name,provenanceNote", after: "id,name,provenanceNote,squares" },
  { id: "pack-phase-payload", source: "packages/runtime/src/evidence-source-adapters.ts", operation: "pack.authored.phase@1 payload", before: "PackPhase root with operands []", after: "{phase:PackPhase} with operands [phase]" },
  { id: "consequence-payload", source: "packages/runtime/src/evidence-source-adapters.ts", operation: "run.record.consequence@1 payload", before: "context,terminal", after: "terminal:true+outcome | terminal:false+plies+objectiveState" },
]);

export interface FactStatementRendererPlan {
  readonly adapterKey: string;
  readonly rendererId: string;
  readonly variants: readonly Readonly<{ when: string; operands: readonly string[]; template: string }>[];
  readonly outputForms: readonly NonMachineEvidenceForm[];
}

const factRendererFor = (row: ExactPresentationAdapterRow): FactStatementRendererPlan | null => {
  const base = { adapterKey: row.key, outputForms: row.forms };
  if (row.familyId === "recorded_checkpoint") return Object.freeze({ ...base, rendererId: `checkpoint.${row.consumer}`, variants: [{ when: "always", operands: ["checkpointId"], template: row.consumer === "compare.structure_strip@1" ? "Checkpoint {checkpointId} was reached." : "Checkpoint {checkpointId} was reached. Source: recorded checkpoint event." }] });
  if (row.familyId === "recorded_objective_transition") return Object.freeze({ ...base, rendererId: `objective-transition.${row.consumer}`, variants: [{ when: "always", operands: ["from", "to"], template: row.consumer === "compare.structure_strip@1" ? "The recorded objective changed from {from} to {to}." : "The recorded objective changed from {from} to {to}. Source: recorded objective event." }] });
  if (row.familyId === "recorded_consequence") return Object.freeze({ ...base, rendererId: `consequence.${row.consumer}`, variants: row.consumer === "guidance.voice_compare@1" ? [
    { when: "terminal=true", operands: ["outcome"], template: "The recorded branch ends at a board-terminal position with learner result {outcome}." },
    { when: "terminal=false", operands: ["plies", "objectiveState"], template: "The recorded branch reaches {plies} plies with objective state {objectiveState}." },
  ] : [{ when: "terminal=true", operands: ["outcome"], template: "Board-terminal result for the learner: {outcome}." }] });
  if (row.familyId === "recorded_fork") return Object.freeze({ ...base, rendererId: `fork.${row.consumer}`, variants: [{ when: "always", operands: ["sharedPly"], template: "The recorded branches share {sharedPly} plies through the fork." }] });
  if (row.familyId === "recorded_move") return Object.freeze({ ...base, rendererId: `move.${row.consumer}`, variants: [
    { when: "moveSan=null", operands: ["offset"], template: "Branch at offset {offset} has no recorded move past the fork." },
    { when: "moveSan=present", operands: ["offset", "moveSan"], template: "Branch at offset {offset} begins with recorded move {moveSan}." },
  ] });
  if (row.familyId === "story_title") return Object.freeze({ ...base, rendererId: `story-title.${row.consumer}`, variants: [{ when: "always", operands: ["title"], template: "{title}" }] });
  if (row.familyId === "imported_result") return Object.freeze({ ...base, rendererId: `imported-result.${row.consumer}`, variants: [{ when: "always", operands: ["result"], template: "The PGN records the game result as {result}; the board is not terminal here." }] });
  if (row.familyId === "evidence_ref_resolution") return Object.freeze({ ...base, rendererId: `evidence-reference.${row.consumer}`, variants: [{ when: "always", operands: ["text"], template: "{text}" }] });
  return null;
};

export const FACT_STATEMENT_RENDERERS: readonly FactStatementRendererPlan[] = Object.freeze(
  PRESENTATION_ADAPTER_ROWS.flatMap((row) => factRendererFor(row) ?? []),
);
export type FactStatementRendererId = (typeof FACT_STATEMENT_RENDERERS)[number]["rendererId"];

const QUESTION_LABELS: Readonly<Record<string, string>> = Object.freeze({
  authoring_evidence_record: "Were source records available for this claim?",
  pivotal_marker: "Was a pivotal recorded moment available here?",
  structural_square_set: "Was a matching board structure detected here?",
  named_structure_nonboard: "Was a named structure detected here?",
  named_structure_board_operand_gap: "Were the exact squares of the named structure retained?",
  engine_trajectory: "Was a recorded evaluation trail available?",
  piece_route: "Was a recorded piece route available?",
  structure_delta: "Was a structural change recorded on this branch?",
  recorded_checkpoint: "Was a checkpoint reached on this branch?",
  recorded_objective_transition: "Did the recorded objective state change?",
  authored_claim_delivery: "Was an authored explanation earned here?",
  authored_claim: "Was an authored explanation available here?",
  pack_phase_operand_gap: "Was the authored drill phase retained?",
  endgame_state: "Was an endgame family detected here?",
  phase_state: "Was the game phase classified here?",
  recorded_engine_magnitude: "Was recorded engine evidence available here?",
  recorded_tablebase_state: "Was recorded tablebase evidence available here?",
  compare_eval_delta: "Was a recorded evaluation change available?",
  recorded_consequence: "Was the played consequence recorded?",
  recorded_fork: "Was the branch fork recorded?",
  recorded_move: "Was a move recorded after the fork?",
  story_eval_shift: "Was an evaluation shift recorded for this moment?",
  story_last_level: "Was the last near-level moment recorded?",
  story_title: "Could a deterministic story title be formed?",
  imported_result: "Did the imported game declare a result?",
  shape_firing: "Did a registered theory shape fire here?",
  explorer_population: "Was a human-game population available here?",
  maia_policy: "Was a human-model move distribution available here?",
  transition_count: "Was this transition count observed?",
  transition_state: "Was this transition state observed?",
  runtime_evidence: "Was the referenced provider evidence available?",
  evidence_ref_resolution: "Could this evidence reference be resolved?",
});

export const PRESENTATION_ABSENCE_REASONS = Object.freeze({
  no_witness: "No matching evidence was observed.",
  not_recorded: "This fact was not recorded.",
  below_floor: "The source did not meet the disclosure floor.",
  provider_unavailable: "The evidence provider is unavailable.",
  provider_failed: "The evidence provider failed for this request.",
  content_absent: "No authored content is bound here.",
} as const);
export type PresentationAbsenceReasonId = keyof typeof PRESENTATION_ABSENCE_REASONS;

export interface PresentationAbstentionPlan {
  readonly adapterKey: string;
  readonly questionId: string;
  readonly questionLabel: string;
  readonly reasons: readonly PresentationAbsenceReasonId[];
}

const providerFamilies = new Set(["explorer_population", "maia_policy", "recorded_engine_magnitude", "recorded_tablebase_state", "runtime_evidence"]);
const authoredFamilies = new Set(["authoring_evidence_record", "authored_claim_delivery", "authored_claim"]);
export const PRESENTATION_ABSTENTION_ROWS: readonly PresentationAbstentionPlan[] = Object.freeze(
  PRESENTATION_ADAPTER_ROWS.filter((row) => row.disposition !== "remove_visual_binding").map((row) => {
    const label = QUESTION_LABELS[row.familyId];
    if (label === undefined) throw new TypeError(`No presentation question for ${row.familyId}`);
    const reasons: readonly PresentationAbsenceReasonId[] = providerFamilies.has(row.familyId)
      ? ["no_witness", "below_floor", "provider_unavailable", "provider_failed"]
      : authoredFamilies.has(row.familyId) ? ["content_absent", "not_recorded"] : ["no_witness", "not_recorded"];
    return Object.freeze({ adapterKey: row.key, questionId: `question.${row.familyId}`, questionLabel: label, reasons: Object.freeze(reasons) });
  }),
);

export const PRESENTATION_QUESTIONS: Readonly<Record<string, string>> = Object.freeze(Object.fromEntries(
  PRESENTATION_ABSTENTION_ROWS.map((row) => [row.questionId, row.questionLabel]),
));
