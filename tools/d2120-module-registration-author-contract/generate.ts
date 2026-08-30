// DISPOSABLE author-artifact generator — D2164-D2170 repair. Not production code.
// Emits requirements, not a second evidence engine: module assembly consumes
// sealed evidence supplied by upstream collector/compiler authorities.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { WORKFLOW_CONTEXT_POLICIES } from "../../packages/runtime/src/presets.js";
import { COMPONENT_FORM_CAPABILITIES, PRESENTATION_ADAPTER_ROWS } from "../d1862-presentation-adapter-plan/plan.js";
import { AUTHOR_MODULE_ACCEPTS, AUTHOR_MODULE_POLICIES, GUIDED_HINT_AUTHORITY, STAGE_BY_PRODUCER } from "./module-plan-fixture.js";

const awaiting = new Set(["derived.explorer.population_summary", "pack.authored.classifier"]);
const projectionById = new Map(PRIMARY_EVIDENCE_MANIFEST.projections.map((row) => [row.id, row]));
const producerById = new Map(PRIMARY_EVIDENCE_MANIFEST.producers.map((row) => [row.id, row]));
const ref = (id: string, version = 1) => ({ id, version });
const canonical = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
const digest = (value: unknown) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;

const SOURCE_CONTRACTS = Object.freeze([
  { id: "candidate_population@1", authority: "candidate-packet", input: "CandidatePopulationRequest", invoke: "collectCandidatePopulation", extract: "projection-keyed admitted items", parse: "parseEvidencePayloadByProjection", abstain: "CandidateEvidenceAbsence", seal: "SealedCandidatePopulation", status: "awaiting_upstream_sealed_operation" },
  { id: "recorded_semantic_path@1", authority: "semantic-collectors", input: "RecordedSemanticPathRequest", invoke: "compileRecordedSemanticPath", extract: "ordered projection-keyed path events", parse: "parseEvidencePayloadByProjection", abstain: "RecordedPathAbsence", seal: "SealedRecordedSemanticPath", status: "awaiting_upstream_sealed_operation" },
  { id: "review_evidence_packet@1", authority: "review-evidence-compiler", input: "ReviewEvidenceRequest", invoke: "compileReviewEvidencePacket", extract: "projection-keyed frozen-prefix items", parse: "parseEvidencePayloadByProjection", abstain: "ReviewEvidenceAbsence", seal: "SealedReviewEvidencePacket", status: "awaiting_upstream_sealed_operation" },
  { id: "catalogue_evidence_packet@1", authority: "pack-population-provenance", input: "CatalogueEvidenceRequest", invoke: "resolveCatalogueEvidence", extract: "projection-keyed cited catalogue items", parse: "parseEvidencePayloadByProjection", abstain: "CatalogueEvidenceAbsence", seal: "SealedCatalogueEvidencePacket", status: "awaiting_upstream_sealed_operation" },
  { id: "provider_evidence_packet@1", authority: "provider-evidence-exchange", input: "ProviderEvidenceRequest", invoke: "requestProviderEvidence", extract: "projection-keyed provider receipts", parse: "parseEvidencePayloadByProjection", abstain: "ProviderEvidenceAbsence", seal: "SealedProviderEvidencePacket", status: "awaiting_upstream_sealed_operation" },
] as const);

const SOURCE_INPUTS = Object.freeze([
  ["derived.story.eval_shift", "run_prefix", "review_evidence_packet@1"],
  ["derived.story.last_level", "run_prefix", "review_evidence_packet@1"],
  ["rules.exchange.predicate.legal_exchange", "edge", "candidate_population@1"],
  ["rules.square.event.control", "edge", "candidate_population@1"],
  ["rules.structural.predicate.direct_attack_count", "position", "candidate_population@1"],
  ["rules.structural.predicate.line_blockers", "position", "candidate_population@1"],
  ["rules.structural.predicate.passed_pawn", "position", "candidate_population@1"],
  ["rules.tactic.reading.defender_duty_set", "position", "candidate_population@1"],
  ["run.record.move", "run_prefix", "recorded_semantic_path@1"],
].map(([id, subjectKind, acquisition]) => Object.freeze({ projection: ref(id!), subjectKind, acquisition, status: "awaiting_upstream_sealed_operation" })));

const sourceFor = (producer: string, stage: string): string => {
  if (stage === "provider_optional") return "provider_evidence_packet@1";
  if (stage === "catalogue_local" || stage === "pack_local") return "catalogue_evidence_packet@1";
  if (stage === "recorded_local" || stage === "run_local") return "recorded_semantic_path@1";
  if (["derived.compare_narrative", "derived.story", "derived.grade"].includes(producer)) return "review_evidence_packet@1";
  if (stage === "derived_after_inputs" && producer === "derived.tactic") return "recorded_semantic_path@1";
  return "candidate_population@1";
};
const subjectFor = (producer: string, stage: string): string => {
  if (producer === "derived.compare_narrative") return "branch_pair";
  if (producer === "derived.story" || producer === "derived.grade" || stage === "run_local") return "run_prefix";
  if (["position_local", "catalogue_local", "pack_local", "provider_optional"].includes(stage)) return "position";
  return "edge";
};
const derivationFor = (projection: (typeof PRIMARY_EVIDENCE_MANIFEST.projections)[number], subjectKind: string) => {
  const join = { subjectKind, rule: subjectKind === "branch_pair" ? "declared_branch_pair" : subjectKind === "run_prefix" ? "same_frozen_prefix" : "same_edge_context" };
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
  const subjectKind = subjectFor(producer.id, stage);
  return { projection: ref(projection.id, projection.version), producer: projection.producer, stage, subjectKind,
    acquisition: sourceFor(producer.id, stage), derivation: stage === "derived_after_inputs" ? derivationFor(projection, subjectKind) : null,
    requiredOutput: { kind: "sealed_projection_item", projection: ref(projection.id, projection.version) }, status: "awaiting_upstream_sealed_operation" };
});

const presentationByProjection = new Map([...new Set(PRESENTATION_ADAPTER_ROWS.map((row) => row.projection))]
  .map((projection) => [projection, PRESENTATION_ADAPTER_ROWS.filter((row) => row.projection === projection)] as const));
const bindingRows = pairs.map(({ module, projection: projectionId }) => {
  const projection = projectionById.get(projectionId)!;
  const producer = producerById.get(projection.producer.id)!;
  const policy = AUTHOR_MODULE_POLICIES[module as keyof typeof AUTHOR_MODULE_POLICIES];
  if (policy === undefined) throw new TypeError(`missing module policy ${module}`);
  const sessions = WORKFLOW_CONTEXT_POLICIES.filter((context) => context.moduleCeiling.includes(module as never)).map((context) => context.id);
  const forms = projection.forms.filter((form) => policy.forms.includes(form as never));
  if (sessions.length === 0 || forms.length === 0) throw new TypeError(`empty policy intersection: ${module}/${projectionId}`);
  const baseAdapters = (presentationByProjection.get(`${projectionId}@${projection.version}`) ?? [])
    .filter((row) => row.disposition === "adapt")
    .map((row) => ({ key: row.key, consumer: row.consumer, familyId: row.familyId, forms: row.forms }));
  const knownForms = [...new Set(baseAdapters.flatMap((row) => row.forms).filter((form) => forms.includes(form as never)))];
  return { producer: projection.producer, projection: ref(projection.id, projection.version), consumer: ref(`module.${module}`),
    timing: policy.timings, roles: policy.roles, sessions, forms, answerContent: projection.answerContent,
    latency: { mode: producer.latency, maxMs: producer.latency === "sync" ? 50 : producer.latency === "interactive" ? 500 : null },
    budget: { maxFacts: policy.maxFacts, maxForms: forms.length }, status: "blocked_dependencies",
    presentationRequirement: { status: "awaiting_exact_module_pair_adapter", requiredPair: `module.${module}@1\u0000${projectionId}@${projection.version}`, reusableBaseAdapters: baseAdapters, componentFormCapabilityKnown: knownForms } };
}).sort((left, right) => `${left.consumer.id}\0${left.projection.id}`.localeCompare(`${right.consumer.id}\0${right.projection.id}`));

for (const forms of Object.values(COMPONENT_FORM_CAPABILITIES)) if (forms.length === 0) throw new TypeError("empty presentation component capability");
const execution = { schemaVersion: 2, kind: "module_evidence_requirements", completionClaim: "requirements_only", population: requirementRows.length, awaiting: [...awaiting].sort(), sourceContracts: SOURCE_CONTRACTS, sourceInputs: SOURCE_INPUTS, guidedHint: GUIDED_HINT_AUTHORITY, rows: requirementRows };
const bindings = { schemaVersion: 2, kind: "module_binding_requirements", completionClaim: "requirements_only", population: bindingRows.length, guidedHint: GUIDED_HINT_AUTHORITY, rows: bindingRows };
writeFileSync("rfc/contracts/module-execution-plan-v1.json", canonical({ ...execution, digest: digest(execution) }));
writeFileSync("rfc/contracts/module-binding-plan-v1.json", canonical({ ...bindings, digest: digest(bindings) }));
console.log(`module-registration requirements: ${requirementRows.length} evidence rows / ${bindingRows.length} binding rows; final emission refused`);
