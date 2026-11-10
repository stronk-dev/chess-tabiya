import { CURRENT_CONSUMER_OPERATION_IDS, MODULE_CONSUMER_IDS, MODULE_CURRENT_IMAGE, MODULE_REGISTRY, compileModulePacket, EVIDENCE_ADAPTERS, EVIDENCE_CONSUMERS, EVIDENCE_ELIGIBILITY_DECLARATIONS, EVIDENCE_PRODUCER_IDS, EVIDENCE_PRODUCERS, EVIDENCE_REASON_DECLARATIONS, EVIDENCE_SELECTION_POLICIES, RUNTIME_EVIDENCE_CONSUMER_OPERATIONS, SEMANTIC_EVENT_PROJECTION_REFS, assertEvidenceConsumerOperations, assertEvidenceProducerOperations, RUNTIME_EVIDENCE_PRODUCER_OPERATIONS } from "@chess-tabiya/runtime";

import { SEMANTIC_SELECTION_PROJECTION_REFS } from "../../../packages/runtime/src/evidence-catalog.js";
import { preflightProfileSubjectFacts } from "../../../packages/runtime/src/internal/profile-subject-facts.js";

import { WEB_EVIDENCE_CONSUMER_OPERATIONS } from "../../web/src/lib/evidence-consumer-operations.js";
import { SERVER_EVIDENCE_CONSUMER_OPERATIONS } from "./evidence-consumer-operations.js";
import { EVIDENCE_MANIFEST, assertEvidenceManifest } from "./evidence-manifest.js";
import { MODULE_EVIDENCE_CONSUMER_OPERATIONS } from "@chess-tabiya/runtime";
import { compileInspectorSourcePage } from "./inspector-query.js";

assertEvidenceManifest();
const declaredConsumers = EVIDENCE_MANIFEST.consumers.map((consumer) => consumer.id);
const consumerOperations = Object.freeze([
  ...RUNTIME_EVIDENCE_CONSUMER_OPERATIONS,
  ...SERVER_EVIDENCE_CONSUMER_OPERATIONS,
  ...WEB_EVIDENCE_CONSUMER_OPERATIONS,
  ...MODULE_EVIDENCE_CONSUMER_OPERATIONS,
]);
assertEvidenceConsumerOperations([...CURRENT_CONSUMER_OPERATION_IDS, ...MODULE_CONSUMER_IDS], EVIDENCE_MANIFEST.consumers, consumerOperations);
// rfc/bounded-policy-targets.md §4.2: every background producer has exactly its one operation.
assertEvidenceProducerOperations(EVIDENCE_MANIFEST.producers, RUNTIME_EVIDENCE_PRODUCER_OPERATIONS);
// rfc/module-registration.md §2.2: every module consumer names the one shared module operation.
const moduleConsumers = EVIDENCE_MANIFEST.consumers.filter((consumer) => consumer.id.startsWith("module."));
if (moduleConsumers.map((consumer) => consumer.id).sort().join("|") !== [...MODULE_CONSUMER_IDS].sort().join("|")) throw new TypeError("The module consumers are not set-equal to MODULE_CONSUMER_IDS");
const moduleCallables = Object.freeze({ compileModulePacket, compileInspectorSourcePage });
for (const current of MODULE_CURRENT_IMAGE) {
  const rows = consumerOperations.filter(row => row.consumer.id === current.consumer.id && row.consumer.version === current.consumer.version);
  if (rows.length !== 1 || rows[0]!.operation !== moduleCallables[current.implementation]
    || moduleCallables[current.implementation].name !== current.implementation) throw new TypeError("Module consumer is not bound to its exact current callable");
}
if (MODULE_REGISTRY.modules.length !== 11) throw new TypeError("The production module registry did not compile all eleven declarations");
if (declaredConsumers.includes("guidance.packet") || declaredConsumers.includes("analysis.engine")) throw new TypeError("Evidence production or acquisition was incorrectly reintroduced as a consumer");

if (EVIDENCE_MANIFEST.producers.map((producer) => producer.id).sort().join("|") !== [...EVIDENCE_PRODUCER_IDS].sort().join("|")) throw new TypeError("The producer paths are not set-equal to the primary catalogue");

const arrows = EVIDENCE_MANIFEST.consumers.find((consumer) => consumer.id === "assistance.arrows");
if (arrows?.disposition?.kind !== "experimental" || arrows.accepts.length !== 0) throw new TypeError("assistance.arrows lost its explicit producerless experimental disposition");
const exactRef = (value: { readonly id: string; readonly version: number }) => `${value.id}@${value.version}`;
const semanticResearch = EVIDENCE_MANIFEST.consumers.find(c => c.id === "research.semantic_selection" && c.version === 2);
const semanticValidation = EVIDENCE_MANIFEST.consumers.find(c => c.id === "research.semantic_validation" && c.version === 1);
const semanticIds = semanticResearch?.accepts.map(exactRef).sort() ?? [];
const declaredSemanticIds = SEMANTIC_SELECTION_PROJECTION_REFS.map(exactRef).sort();
if (semanticResearch === undefined || semanticIds.join("|") !== declaredSemanticIds.join("|")
  || EVIDENCE_MANIFEST.selectionPolicies[0]?.consumer.id !== semanticResearch.id || EVIDENCE_MANIFEST.selectionPolicies[0]?.consumer.version !== 2)
  throw new TypeError(`Research selector2 is not set-equal to its exact${declaredSemanticIds.length} source image`);
if (semanticValidation === undefined || semanticValidation.accepts.map(exactRef).sort().join("|") !== SEMANTIC_EVENT_PROJECTION_REFS.map(exactRef).sort().join("|"))
  throw new TypeError("Semantic source validation must preserve all exact live roots separately from selector2");
preflightProfileSubjectFacts(EVIDENCE_MANIFEST);
const counts = [EVIDENCE_MANIFEST.producers.length, EVIDENCE_MANIFEST.projections.length, EVIDENCE_MANIFEST.consumers.length, EVIDENCE_MANIFEST.bindings.length, EVIDENCE_MANIFEST.semanticEvents.length, EVIDENCE_MANIFEST.eligibility.length, EVIDENCE_MANIFEST.reasons.length, EVIDENCE_MANIFEST.selectionPolicies.length];
const declaredCounts = [EVIDENCE_PRODUCERS.length, EVIDENCE_PRODUCERS.flatMap((producer) => producer.outputs).length, EVIDENCE_CONSUMERS.length, EVIDENCE_ADAPTERS.length, SEMANTIC_EVENT_PROJECTION_REFS.length, EVIDENCE_ELIGIBILITY_DECLARATIONS.length, EVIDENCE_REASON_DECLARATIONS.length, EVIDENCE_SELECTION_POLICIES.length];
if (counts.join("/") !== declaredCounts.join("/")) throw new TypeError(`Semantic evidence compiler dropped a declaration: compiled ${counts.join("/")}, declared ${declaredCounts.join("/")}`);

console.log(`evidence-manifest-check: ${EVIDENCE_MANIFEST.digest} · ${counts.slice(0, 4).join("/")} core · ${counts.slice(4).join("/")} semantic`);
