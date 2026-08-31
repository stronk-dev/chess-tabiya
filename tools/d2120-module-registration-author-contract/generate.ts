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
  AUTHOR_ADDITIONAL_SUBJECT_VIEWS,
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
  { id: "candidate_population@1", authority: "candidate-packet", input: "CandidatePopulationRequest", invoke: "collectCandidatePopulation", extract: "projection-keyed admitted items", parse: "parseEvidencePayloadByProjection", abstain: "CandidateEvidenceAbsence", seal: "SealedCandidatePopulation", subjectKinds: ["position", "edge"], timings: ["precommit", "at_commit", "postcommit", "checkpoint", "attempt_end", "review", "analysis"], status: "awaiting_upstream_sealed_operation" },
  { id: "recorded_semantic_path@1", authority: "semantic-collectors", input: "RecordedSemanticPathRequest", invoke: "compileRecordedSemanticPath", extract: "ordered projection-keyed path events", parse: "parseEvidencePayloadByProjection", abstain: "RecordedPathAbsence", seal: "SealedRecordedSemanticPath", subjectKinds: ["position", "edge", "branch_pair", "run_prefix"], timings: ["postcommit", "checkpoint", "attempt_end", "review", "analysis"], status: "awaiting_upstream_sealed_operation" },
  { id: "review_evidence_packet@1", authority: "review-evidence-compiler", input: "ReviewEvidenceRequest", invoke: "compileReviewEvidencePacket", extract: "projection-keyed frozen-prefix items", parse: "parseEvidencePayloadByProjection", abstain: "ReviewEvidenceAbsence", seal: "SealedReviewEvidencePacket", subjectKinds: ["edge", "branch_pair", "run_prefix"], timings: ["postcommit", "review", "analysis"], status: "awaiting_upstream_sealed_operation" },
  { id: "catalogue_evidence_packet@1", authority: "pack-population-provenance", input: "CatalogueEvidenceRequest", invoke: "resolveCatalogueEvidence", extract: "projection-keyed cited catalogue items", parse: "parseEvidencePayloadByProjection", abstain: "CatalogueEvidenceAbsence", seal: "SealedCatalogueEvidencePacket", subjectKinds: ["position"], timings: ["postcommit", "checkpoint", "attempt_end", "review", "analysis"], status: "awaiting_upstream_sealed_operation" },
  { id: "provider_evidence_packet@1", authority: "provider-evidence-exchange", input: "ProviderEvidenceRequest", invoke: "requestProviderEvidence", extract: "projection-keyed provider receipts", parse: "parseEvidencePayloadByProjection", abstain: "ProviderEvidenceAbsence", seal: "SealedProviderEvidencePacket", subjectKinds: ["position", "edge", "run_prefix"], timings: ["postcommit", "checkpoint", "attempt_end", "review", "analysis"], status: "awaiting_upstream_sealed_operation" },
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
  ["run.record.move", "branch_pair", "recorded_semantic_path@1"],
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
const derivationFor = (projection: (typeof PRIMARY_EVIDENCE_MANIFEST.projections)[number], subjectKind: string) => {
  const join = { subjectKind, rule: subjectKind === "branch_pair" ? "declared_branch_pair" : subjectKind === "run_prefix" ? "same_frozen_prefix" : subjectKind === "position" ? "same_position" : "same_edge_context" };
  if (projection.derivation?.inputs !== undefined) return { kind: "all", inputs: projection.derivation.inputs, join };
  if (projection.derivation?.anyOf !== undefined) return { kind: "any", alternatives: projection.derivation.anyOf, join };
  if (projection.dependsOn.length > 0) return { kind: "all", inputs: projection.dependsOn, join };
  throw new TypeError(`derived projection has no declared inputs: ${projection.id}`);
};

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
  const additionalViews = AUTHOR_ADDITIONAL_SUBJECT_VIEWS[projection.id as keyof typeof AUTHOR_ADDITIONAL_SUBJECT_VIEWS] ?? [];
  const source = sourceContractById.get(sourceFor(producer.id, stage));
  if (source === undefined || !source.subjectKinds.includes(subjectKind as never)) throw new TypeError(`source contract cannot provide primary subject: ${projection.id}/${subjectKind}`);
  const subjectViews = [subjectKind, ...additionalViews].map((subject) => {
    const direct = source.subjectKinds.includes(subject as never);
    const acquisition = direct ? source : sourceContractById.get("review_evidence_packet@1")!;
    if (!acquisition.subjectKinds.includes(subject as never)) throw new TypeError(`no lawful subject projection: ${projection.id}/${subject}`);
    return { subjectKind: subject, acquisition: acquisition.id, adapter: direct ? "identity" : "projection_between_grains@1" };
  });
  return { projection: ref(projection.id, projection.version), producer: projection.producer, stage, subjectKind,
    subjectViews, acquisition: source.id, derivation: stage === "derived_after_inputs" ? derivationFor(projection, subjectKind) : null,
    requiredOutput: { kind: "sealed_projection_item", projection: ref(projection.id, projection.version) }, status: "awaiting_upstream_sealed_operation" };
});

const requirementById = new Map(requirementRows.map((row) => [row.projection.id, row]));
for (const row of requirementRows) {
  if (row.derivation === null) continue;
  const inputs = row.derivation.kind === "all" ? row.derivation.inputs : row.derivation.alternatives.flat();
  for (const input of inputs) {
    const planned = requirementById.get(input.id);
    const compatible = planned?.subjectViews.some((view) => view.subjectKind === row.subjectKind) ?? SOURCE_INPUTS.some((source) =>
      source.projection.id === input.id && source.subjectKind === row.subjectKind);
    if (!compatible) throw new TypeError(`derivation grain mismatch: ${row.projection.id} needs ${input.id}/${row.subjectKind}`);
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
  const timing = policy.timings.filter((value) => source.timings.includes(value as never));
  if (sessions.length === 0 || forms.length === 0 || timing.length === 0) throw new TypeError(`empty policy intersection: ${module}/${projectionId}`);
  const baseAdapters = (presentationByProjection.get(`${projectionId}@${projection.version}`) ?? [])
    .filter((row) => row.disposition === "adapt")
    .map((row) => ({ key: row.key, consumer: row.consumer, familyId: row.familyId, forms: row.forms }));
  const knownForms = [...new Set(baseAdapters.flatMap((row) => row.forms).filter((form) => forms.includes(form as never)))];
  return { producer: projection.producer, projection: ref(projection.id, projection.version), consumer: ref(`module.${module}`),
    timing, roles: policy.roles, sessions, forms, answerContent: projection.answerContent,
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
