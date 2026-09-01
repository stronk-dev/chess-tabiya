// DISPOSABLE author-artifact generator — D2164-D2170 repair. Not production code.
// Emits requirements, not a second evidence engine: module assembly consumes
// sealed evidence supplied by upstream collector/compiler authorities.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { MODULE_FORM_IMAGE } from "../../packages/runtime/src/module-contract.js";
import { WORKFLOW_CONTEXT_POLICIES } from "../../packages/runtime/src/presets.js";
import { COMPONENT_FORM_CAPABILITIES, PRESENTATION_ADAPTER_ROWS } from "../d1862-presentation-adapter-plan/plan.js";
import {
  AUTHOR_MODULE_ACCEPTS,
  AUTHOR_MODULE_POLICIES,
  AUTHOR_PROJECTION_SUBJECT_OVERRIDES,
  GUIDED_HINT_AUTHORITY,
  STAGE_BY_PRODUCER,
} from "./module-plan-fixture.js";

const awaiting = new Set(["derived.explorer.population_summary", "pack.authored.classifier"]);
const projectionById = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((row) => [row.id, row]));
const producerById = new Map(PRIMARY_EVIDENCE_MANIFEST.producers.map((row) => [row.id, row]));
const ref = (id: string, version = 1) => ({ id, version });
const canonical = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const digest = (value: unknown) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;

const SOURCE_CONTRACTS = Object.freeze([
  { id: "candidate_population@1", authority: "shared-candidate-evidence-packet", input: "CandidatePopulationRequest", operation: { owner: "rfc/shared-candidate-evidence-packet.md", callable: "CandidatePopulationService.get(request, signal)" }, extract: "candidate occurrence view only", views: ["root_legal_population", "candidate_child_position_by_uci", "candidate_edge_by_uci", "complete_candidate_population"], forbiddenViews: ["committed_edge", "current_root_projection"], parse: "assertCandidatePopulationReceipt", abstain: "CandidatePopulationFailure", seal: "CandidatePopulationReceipt", subjectKinds: ["position", "edge"], timings: ["precommit", "at_commit", "postcommit", "checkpoint", "attempt_end", "review", "analysis"], status: "awaiting_upstream_sealed_operation" },
  { id: "recorded_semantic_path@1", authority: "recorded-semantic-path", input: "RecordedSemanticPathRequest", operation: { owner: "rfc/recorded-semantic-path.md", callable: "compileRecordedSemanticPath(input)" }, extract: "ordered projection-keyed path occurrences", views: ["recorded_position", "recorded_edge", "recorded_branch_pair", "frozen_run_prefix"], forbiddenViews: ["hypothetical_candidate"], parse: "assertRecordedSemanticPathResult", abstain: "RecordedPathRefusalReason", seal: "RecordedSemanticPathResult.available", subjectKinds: ["position", "edge", "branch_pair", "run_prefix"], timings: ["postcommit", "checkpoint", "attempt_end", "review", "analysis"], status: "awaiting_upstream_sealed_operation" },
  { id: "review_evidence_packet@1", authority: "review-evidence-compiler", input: "ReviewEvidenceInput", operation: { owner: "rfc/review-evidence-compiler.md", callable: "compileReviewEvidence(input)" }, extract: "projection-keyed frozen-prefix occurrences", views: ["recorded_edge", "recorded_branch_pair", "frozen_run_prefix"], forbiddenViews: ["current_root", "hypothetical_candidate"], parse: "assertReviewEvidencePacket", abstain: "ReviewFamilyState", seal: "ReviewEvidencePacket", subjectKinds: ["edge", "branch_pair", "run_prefix"], timings: ["postcommit", "review", "analysis"], status: "awaiting_upstream_sealed_operation" },
  { id: "catalogue_evidence_packet@1", authority: "module-registration", input: "CatalogueEvidencePoolRequest", operation: { owner: "rfc/module-registration.md", callable: "compileCatalogueEvidencePool(input)" }, extract: "exact cited pack/shape/theory declared items", views: ["applicable_catalogue_position"], forbiddenViews: ["uncited_text", "whole_catalogue_search"], parse: "assertCatalogueEvidencePool", abstain: "CatalogueEvidencePoolAbsence", seal: "CatalogueEvidencePoolReceipt", subjectKinds: ["position"], timings: ["postcommit", "checkpoint", "attempt_end", "review", "analysis"], status: "awaiting_module_owned_adapter" },
  { id: "provider_evidence_packet@1", authority: "provider-exchange-and-execution", input: "TypedProviderRequest", operation: { owner: "rfc/provider-exchange-and-execution.md", callable: "ProviderExchangeScheduler.get(request, scope, signal)" }, extract: "one operation-keyed declared provider delivery", views: ["request_position", "request_edge", "frozen_run_prefix"], forbiddenViews: ["generic_provider_pool"], parse: "assertProviderDelivery", abstain: "TypedProviderResult.unavailable", seal: "DeclaredEvidence<ProviderEvidenceDelivery>", subjectKinds: ["position", "edge", "run_prefix"], timings: ["postcommit", "checkpoint", "attempt_end", "review", "analysis"], status: "awaiting_upstream_sealed_operation" },
] as const);
const sourceContractById = new Map(SOURCE_CONTRACTS.map((source) => [source.id, source]));

const SOURCE_INPUTS = Object.freeze([
  ["derived.story.eval_shift", "run_prefix", "review_evidence_packet@1"],
  ["derived.story.last_level", "run_prefix", "review_evidence_packet@1"],
  ["rules.exchange.predicate.legal_exchange", "edge", "candidate_population@1"],
  ["rules.square.event.control", "edge", "candidate_population@1"],
  ["rules.structural.predicate.direct_attack_count", "edge", "candidate_population@1"],
  ["rules.structural.predicate.line_blockers", "edge", "candidate_population@1"],
  ["rules.structural.predicate.passed_pawn", "edge", "candidate_population@1"],
  ["rules.tactic.reading.defender_duty_set", "edge", "candidate_population@1"],
  ["run.record.move", "edge", "recorded_semantic_path@1"],
].map(([id, subjectKind, acquisition]) => Object.freeze({ projection: ref(id!), subjectKind, acquisition, status: "awaiting_upstream_sealed_operation" })));

const sourceFor = (producer: string, stage: string): string => {
  if (stage === "provider_optional") return "provider_evidence_packet@1";
  if (stage === "catalogue_local" || stage === "pack_local") return "catalogue_evidence_packet@1";
  if (stage === "recorded_local" || stage === "run_local") return "recorded_semantic_path@1";
  if (["derived.compare_narrative", "derived.story", "derived.grade"].includes(producer)) return "review_evidence_packet@1";
  if (stage === "derived_after_inputs" && producer === "derived.tactic") return "recorded_semantic_path@1";
  return "candidate_population@1";
};
const SEALED_STAGE_SUBJECT = Object.freeze({
  position_local: "position", edge_local: "edge", catalogue_local: "position",
  pack_local: "position", recorded_local: "position", provider_optional: "position",
  run_local: "run_prefix",
} as const);
const subjectFor = (projection: string, stage: string): string => {
  const exact = AUTHOR_PROJECTION_SUBJECT_OVERRIDES[projection as keyof typeof AUTHOR_PROJECTION_SUBJECT_OVERRIDES];
  if (exact !== undefined) return exact;
  if (stage === "derived_after_inputs" || stage === "position_or_edge_local") {
    throw new TypeError(`projection requires exact subject authority: ${projection}`);
  }
  const sealed = SEALED_STAGE_SUBJECT[stage as keyof typeof SEALED_STAGE_SUBJECT];
  if (sealed === undefined) throw new TypeError(`stage has no sealed subject profile: ${stage}`);
  return sealed;
};
const occurrenceViewFor = (sourceId: string, subjectKind: string): string => {
  const views: Record<string, Record<string, string>> = {
    "candidate_population@1": { position: "candidate_child_position_by_uci", edge: "candidate_edge_by_uci" },
    "recorded_semantic_path@1": { position: "recorded_position", edge: "recorded_edge", branch_pair: "recorded_branch_pair", run_prefix: "frozen_run_prefix" },
    "review_evidence_packet@1": { edge: "recorded_edge", branch_pair: "recorded_branch_pair", run_prefix: "frozen_run_prefix" },
    "catalogue_evidence_packet@1": { position: "applicable_catalogue_position" },
    "provider_evidence_packet@1": { position: "request_position", edge: "request_edge", run_prefix: "frozen_run_prefix" },
  };
  const view = views[sourceId]?.[subjectKind];
  if (view === undefined) throw new TypeError(`source contract has no occurrence view: ${sourceId}/${subjectKind}`);
  return view;
};
const derivationFor = (projection: (typeof PRIMARY_EVIDENCE_MANIFEST.projections)[number], subjectKind: string) => {
  const join = { subjectKind, rule: subjectKind === "branch_pair" ? "declared_branch_pair" : subjectKind === "run_prefix" ? "same_frozen_prefix" : subjectKind === "position" ? "same_position" : "same_edge_context" };
  if (projection.derivation?.inputs !== undefined) return { kind: "all", inputs: projection.derivation.inputs, join };
  if (projection.derivation?.anyOf !== undefined) return { kind: "any", alternatives: projection.derivation.anyOf, join };
  if (projection.dependsOn.length > 0) return { kind: "all", inputs: projection.dependsOn, join };
  throw new TypeError(`derived projection has no declared inputs: ${projection.id}`);
};

const inputRelation = (sourceSubjectKind: string, outputSubjectKind: string): string => {
  const relation = {
    "position:position": "same_position",
    "edge:edge": "same_edge",
    "branch_pair:branch_pair": "same_branch_pair",
    "run_prefix:run_prefix": "same_frozen_prefix",
    "position:edge": "edge_position_endpoints",
    "edge:branch_pair": "branch_pair_edges",
    "position:branch_pair": "branch_pair_position_endpoints",
    "position:run_prefix": "prefix_position_occurrences",
    "edge:run_prefix": "prefix_edge_occurrences",
    "branch_pair:run_prefix": "prefix_branch_pair_occurrences",
  }[`${sourceSubjectKind}:${outputSubjectKind}`];
  if (relation === undefined) throw new TypeError(`no typed input relation: ${sourceSubjectKind} -> ${outputSubjectKind}`);
  return relation;
};

const EXACT_OCCURRENCE_CONTRACTS = Object.freeze({
  "derived.tactic.deflection_observed": { kind: "ordered_window", alternatives: [{ horizon: 3, outputEdgeOffset: 3, operands: [
    { projection: "run.record.move", cardinality: 3, edgeOffsets: [1, 2, 3], roles: ["bait_move", "defender_reply", "target_capture"] },
    { projection: "rules.tactic.reading.defender_duty_set", cardinality: 1, positionOffsets: [0], roles: ["duty_before"] },
    { projection: "rules.transition.event.capture", cardinality: 2, edgeOffsets: [2, 3], roles: ["bait_capture", "target_capture"] },
    { projection: "rules.exchange.predicate.legal_exchange", cardinality: 1, edgeOffsets: [3], roles: ["positive_target_capture"] },
  ] }], equality: ["same_recorded_branch", "contiguous_node_fen", "retained_piece_identities"] },
  "derived.tactic.attraction_observed": { kind: "ordered_window", alternatives: [
    { horizon: 3, outputEdgeOffset: 3, operands: [
      { projection: "run.record.move", cardinality: 3, edgeOffsets: [1, 2, 3], roles: ["bait_move", "heavy_piece_capture", "checking_consequence"] },
      { projection: "rules.transition.event.capture", cardinality: 1, edgeOffsets: [2], roles: ["heavy_piece_capture"] },
      { projection: "rules.tactic.event.check", cardinality: 1, edgeOffsets: [3], roles: ["checking_consequence"] },
    ] },
    { horizon: 5, outputEdgeOffset: 5, operands: [
      { projection: "run.record.move", cardinality: 5, edgeOffsets: [1, 2, 3, 4, 5], roles: ["bait_move", "heavy_piece_capture", "attack_arrival", "reply", "heavy_piece_consequence"] },
      { projection: "rules.transition.event.capture", cardinality: 2, edgeOffsets: [2, 5], roles: ["heavy_piece_capture", "heavy_piece_consequence"] },
    ] },
  ], equality: ["same_recorded_branch", "contiguous_node_fen", "same_arrival_square", "same_heavy_piece_identity"] },
  "derived.tactic.line_blocker_clearance_observed": { kind: "ordered_window", alternatives: [{ horizon: 3, outputEdgeOffset: 3, operands: [
    { projection: "run.record.move", cardinality: 3, edgeOffsets: [1, 2, 3], roles: ["blocker_vacates", "reply", "slider_capture"] },
    { projection: "rules.exchange.predicate.legal_exchange", cardinality: 1, edgeOffsets: [3], roles: ["positive_slider_capture"] },
  ] }], equality: ["same_recorded_branch", "contiguous_node_fen", "same_slider_and_target"] },
  "derived.tactic.square_clearance_observed": { kind: "ordered_window", alternatives: [{ horizon: 3, outputEdgeOffset: 3, operands: [
    { projection: "run.record.move", cardinality: 3, edgeOffsets: [1, 2, 3], roles: ["square_vacated", "reply", "quiet_slider_move"] },
  ] }], equality: ["same_recorded_branch", "contiguous_node_fen", "same_vacated_square"] },
  "derived.tactic.interference_observed": { kind: "ordered_window", alternatives: [{ horizon: 3, outputEdgeOffset: 3, operands: [
    { projection: "run.record.move", cardinality: 3, edgeOffsets: [1, 2, 3], roles: ["interposition", "reply", "target_capture"] },
    { projection: "rules.tactic.reading.defender_duty_set", cardinality: 1, positionOffsets: [0], roles: ["duty_before"] },
    { projection: "rules.exchange.predicate.legal_exchange", cardinality: 1, edgeOffsets: [3], roles: ["positive_target_capture"] },
  ] }], equality: ["same_recorded_branch", "contiguous_node_fen", "same_duty_and_target"] },
  "derived.tactic.check_zwischenzug_observed": { kind: "ordered_window", alternatives: [{ horizon: 4, outputEdgeOffset: 4, operands: [
    { projection: "run.record.move", cardinality: 4, edgeOffsets: [1, 2, 3, 4], roles: ["initial_capture", "intermediate_check", "check_reply", "retained_recapture"] },
    { projection: "rules.transition.event.capture", cardinality: 2, edgeOffsets: [1, 4], roles: ["initial_capture", "retained_recapture"] },
    { projection: "rules.tactic.event.check", cardinality: 1, edgeOffsets: [2], roles: ["intermediate_check"] },
    { projection: "rules.exchange.predicate.legal_exchange", cardinality: 1, edgeOffsets: [4], roles: ["positive_retained_recapture"] },
  ] }], equality: ["same_recorded_branch", "contiguous_node_fen", "same_recapture_square"] },
  "derived.tactic.overload_exploitation_observed": { kind: "ordered_window", alternatives: [{ horizon: 3, outputEdgeOffset: 3, operands: [
    { projection: "run.record.move", cardinality: 3, edgeOffsets: [1, 2, 3], roles: ["first_target_capture", "defender_recapture", "second_target_capture"] },
    { projection: "rules.tactic.reading.defender_duty_set", cardinality: 1, positionOffsets: [0], roles: ["multi_duty_before"] },
    { projection: "rules.transition.event.capture", cardinality: 3, edgeOffsets: [1, 2, 3], roles: ["first_target_capture", "defender_recapture", "second_target_capture"] },
    { projection: "rules.exchange.predicate.legal_exchange", cardinality: 1, edgeOffsets: [3], roles: ["positive_second_capture"] },
  ] }], equality: ["same_recorded_branch", "contiguous_node_fen", "same_defender", "different_retained_target"] },
  "derived.compare.eval_delta": { kind: "ordered_endpoints", alternatives: [{ operands: [
    { projection: "live.stockfish.eval", cardinality: 2, endpointRoles: ["branch_a", "branch_b"] },
  ] }], equality: ["declared_branch_pair_order", "same_engine_id", "same_search_limit", "same_score_domain"] },
  "derived.grade.move_quality": { kind: "ordered_endpoints", alternatives: [
    { operands: [{ projection: "recorded.engine.eval", cardinality: 2, endpointRoles: ["before", "after"] }] },
    { operands: [{ projection: "live.stockfish.eval", cardinality: 2, endpointRoles: ["before", "after"] }] },
  ], equality: ["same_edge", "same_lane", "same_engine_id", "same_search_limit"], status: "awaiting_upstream_same_lane_anyof_D2473" },
} as const);

const pairs = Object.entries(AUTHOR_MODULE_ACCEPTS).flatMap(([module, ids]) => ids.filter((id) => !awaiting.has(id)).map((id) => ({ module, projection: id })));
const compiledIds = [...new Set(pairs.map((row) => row.projection))].sort();
const requirementRows = compiledIds.map((id) => {
  const projection = projectionById.get(id);
  if (projection === undefined) throw new TypeError(`missing compiled projection ${id}`);
  const producer = producerById.get(projection.producer.id);
  if (producer === undefined) throw new TypeError(`missing producer ${projection.producer.id}`);
  const stage = STAGE_BY_PRODUCER[producer.id as keyof typeof STAGE_BY_PRODUCER];
  if (stage === undefined) throw new TypeError(`missing source stage ${producer.id}`);
  const subjectKind = subjectFor(projection.id, stage);
  const source = sourceContractById.get(sourceFor(producer.id, stage));
  if (source === undefined || !source.subjectKinds.includes(subjectKind as never)) throw new TypeError(`source contract cannot provide primary subject: ${projection.id}/${subjectKind}`);
  return { projection: ref(projection.id, projection.version), producer: projection.producer, stage, subjectKind,
    subjectAuthority: { subjectKind, acquisition: source.id, occurrenceView: occurrenceViewFor(source.id, subjectKind), adapter: "identity" }, acquisition: source.id,
    derivation: stage === "derived_after_inputs" ? derivationFor(projection, subjectKind) : null,
    requiredOutput: { kind: "sealed_projection_item", projection: ref(projection.id, projection.version) }, status: "awaiting_upstream_sealed_operation" };
});

const requirementById = new Map(requirementRows.map((row) => [row.projection.id, row]));
for (const row of requirementRows) {
  if (row.derivation === null) continue;
  const inputs = row.derivation.kind === "all" ? row.derivation.inputs : row.derivation.alternatives.flat();
  const exactOccurrence = EXACT_OCCURRENCE_CONTRACTS[row.projection.id as keyof typeof EXACT_OCCURRENCE_CONTRACTS];
  const inputBindings = inputs.map((input) => {
    const planned = requirementById.get(input.id);
    const external = SOURCE_INPUTS.find((source) => source.projection.id === input.id);
    const sourceSubjectKind = planned?.subjectKind ?? external?.subjectKind;
    if (sourceSubjectKind === undefined) throw new TypeError(`missing derivation input: ${row.projection.id} needs ${input.id}`);
    return { projection: input, sourceSubjectKind,
      relation: exactOccurrence === undefined ? inputRelation(sourceSubjectKind, row.subjectKind) : "operation_owned_occurrences" };
  });
  Object.assign(row.derivation, exactOccurrence === undefined
    ? { inputBindings }
    : { inputBindings, occurrenceContract: exactOccurrence,
      operationRequirement: {
        owner: row.producer.id === "derived.grade" ? "rfc/move-quality-grades.md"
          : row.producer.id === "derived.compare_narrative" ? "rfc/review-evidence-compiler.md"
          : "rfc/semantic-collectors.md",
        callable: row.producer.id === "derived.grade" ? "moveQualityGrade(before, after, context)"
          : row.producer.id === "derived.compare_narrative" ? "compileReviewEvidence(input)"
          : "recordedSemanticPath(run, branchId)",
        status: "awaiting_upstream_occurrence_receipt",
      } });
  for (const input of inputs) {
    const planned = requirementById.get(input.id);
    const external = SOURCE_INPUTS.find((source) => source.projection.id === input.id);
    if (planned === undefined && external === undefined) throw new TypeError(`missing derivation input: ${row.projection.id} needs ${input.id}`);
  }
}

const presentationByProjection = new Map([...new Set(PRESENTATION_ADAPTER_ROWS.map((row) => row.projection))]
  .map((projection) => [projection, PRESENTATION_ADAPTER_ROWS.filter((row) => row.projection === projection)] as const));
const bindingRows = pairs.map(({ module, projection: projectionId }) => {
  const projection = projectionById.get(projectionId)!;
  const producer = producerById.get(projection.producer.id)!;
  const policy = AUTHOR_MODULE_POLICIES[module as keyof typeof AUTHOR_MODULE_POLICIES];
  if (policy === undefined) throw new TypeError(`missing module policy ${module}`);
  const sessions = WORKFLOW_CONTEXT_POLICIES.filter((context) => context.moduleCeiling.includes(module as never)).map((context) => context.id);
  const moduleForms = [...new Set(policy.forms.flatMap((form) => MODULE_FORM_IMAGE[form]))];
  const forms = projection.forms.filter((form) => moduleForms.includes(form));
  const requirement = requirementById.get(projectionId)!;
  const source = sourceContractById.get(requirement.acquisition)!;
  const sourceTimingCeiling = policy.timings.filter((value) => source.timings.includes(value as never));
  if (sessions.length === 0 || forms.length === 0 || sourceTimingCeiling.length === 0) throw new TypeError(`empty policy intersection: ${module}/${projectionId}`);
  const baseAdapters = (presentationByProjection.get(`${projectionId}@${projection.version}`) ?? [])
    .filter((row) => row.disposition === "adapt")
    .map((row) => ({ key: row.key, consumer: row.consumer, familyId: row.familyId, forms: row.forms }));
  const knownForms = [...new Set(baseAdapters.flatMap((row) => row.forms).filter((form) => forms.includes(form as never)))];
  return { producer: projection.producer, projection: ref(projection.id, projection.version), consumer: ref(`module.${module}`),
    occurrenceRequirement: {
      source: source.id,
      view: requirement.subjectAuthority.occurrenceView,
      subjectKind: requirement.subjectKind,
      selector: source.id === "candidate_population@1"
        ? { kind: "canonical_candidate_uci", suppliedBy: "authoritative_module_moment", committedEdgeForbidden: true }
        : source.id === "recorded_semantic_path@1" || source.id === "review_evidence_packet@1"
          ? { kind: "recorded_occurrence_identity", suppliedBy: "sealed_run_path" }
          : source.id === "provider_evidence_packet@1"
            ? { kind: "provider_request_subject", suppliedBy: "typed_provider_request" }
            : { kind: "applicability_identity", suppliedBy: "sealed_catalogue_adapter" },
      exactProjectionOperation: null,
      status: "awaiting_upstream_exact_occurrence_operation",
    },
    timingRequirement: { moduleRequested: policy.timings, sourceCeiling: sourceTimingCeiling,
      exactProjectionOperation: null, status: "awaiting_upstream_exact_operation" },
    roles: policy.roles, sessions, forms, answerContent: projection.answerContent,
    latency: { mode: producer.latency, maxMs: producer.latency === "sync" ? 50 : producer.latency === "interactive" ? 500 : null },
    budget: { maxFacts: policy.maxFacts, maxForms: forms.length }, status: "blocked_dependencies",
    presentationRequirement: { status: "awaiting_exact_module_pair_adapter", requiredPair: `module.${module}@1\u0000${projectionId}@${projection.version}`, requiredForms: forms, reusableBaseAdapters: baseAdapters, componentFormCapabilityKnown: knownForms } };
}).sort((left, right) => `${left.consumer.id}\0${left.projection.id}`.localeCompare(`${right.consumer.id}\0${right.projection.id}`));

for (const forms of Object.values(COMPONENT_FORM_CAPABILITIES)) if (forms.length === 0) throw new TypeError("empty presentation component capability");
const execution = { schemaVersion: 2, kind: "module_evidence_requirements", completionClaim: "requirements_only", population: requirementRows.length, awaiting: [...awaiting].sort(), sourceContracts: SOURCE_CONTRACTS, sourceInputs: SOURCE_INPUTS, guidedHint: GUIDED_HINT_AUTHORITY, rows: requirementRows };
const bindings = { schemaVersion: 2, kind: "module_binding_requirements", completionClaim: "requirements_only", population: bindingRows.length, guidedHint: GUIDED_HINT_AUTHORITY, rows: bindingRows };
writeFileSync("rfc/contracts/module-execution-plan-v1.json", canonical({ ...execution, digest: digest(execution) }));
writeFileSync("rfc/contracts/module-binding-plan-v1.json", canonical({ ...bindings, digest: digest(bindings) }));
console.log(`module-registration requirements: ${requirementRows.length} evidence rows / ${bindingRows.length} binding rows; final emission refused`);
