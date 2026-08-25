import { CURRENT_CONSUMER_OPERATION_IDS, EVIDENCE_ADAPTERS, EVIDENCE_CONSUMERS, EVIDENCE_ELIGIBILITY_DECLARATIONS, EVIDENCE_PRODUCER_IDS, EVIDENCE_PRODUCERS, EVIDENCE_REASON_DECLARATIONS, EVIDENCE_SELECTION_POLICIES, RUNTIME_EVIDENCE_CONSUMER_OPERATIONS, SEMANTIC_EVENT_PROJECTION_IDS, assertEvidenceConsumerOperations } from "@chess-tabiya/runtime";

import { WEB_EVIDENCE_CONSUMER_OPERATIONS } from "../../web/src/lib/evidence-consumer-operations.js";
import { SERVER_EVIDENCE_CONSUMER_OPERATIONS } from "./evidence-consumer-operations.js";
import { EVIDENCE_MANIFEST, assertEvidenceManifest } from "./evidence-manifest.js";

assertEvidenceManifest();
const declaredConsumers = EVIDENCE_MANIFEST.consumers.map((consumer) => consumer.id);
const consumerOperations = Object.freeze([
  ...RUNTIME_EVIDENCE_CONSUMER_OPERATIONS,
  ...SERVER_EVIDENCE_CONSUMER_OPERATIONS,
  ...WEB_EVIDENCE_CONSUMER_OPERATIONS,
]);
assertEvidenceConsumerOperations(CURRENT_CONSUMER_OPERATION_IDS, EVIDENCE_MANIFEST.consumers, consumerOperations);
if (declaredConsumers.includes("guidance.packet") || declaredConsumers.includes("analysis.engine")) throw new TypeError("Evidence production or acquisition was incorrectly reintroduced as a consumer");

if (EVIDENCE_MANIFEST.producers.map((producer) => producer.id).sort().join("|") !== [...EVIDENCE_PRODUCER_IDS].sort().join("|")) throw new TypeError("The producer paths are not set-equal to the primary catalogue");

const arrows = EVIDENCE_MANIFEST.consumers.find((consumer) => consumer.id === "assistance.arrows");
if (arrows?.disposition?.kind !== "experimental" || arrows.accepts.length !== 0) throw new TypeError("assistance.arrows lost its explicit producerless experimental disposition");
const semanticResearch = EVIDENCE_MANIFEST.consumers.find((consumer) => consumer.id === "research.semantic_selection");
const semanticIds = semanticResearch?.accepts.map((value) => `${value.id}@${value.version}`).sort() ?? [];
const declaredSemanticIds = SEMANTIC_EVENT_PROJECTION_IDS.map((id) => `${id}@1`).sort();
if (semanticResearch === undefined || semanticIds.join("|") !== declaredSemanticIds.join("|") || EVIDENCE_MANIFEST.selectionPolicies[0]?.consumer.id !== semanticResearch.id) throw new TypeError(`The research semantic-selection consumer is not set-equal to its ${declaredSemanticIds.length} declared events`);
const counts = [EVIDENCE_MANIFEST.producers.length, EVIDENCE_MANIFEST.projections.length, EVIDENCE_MANIFEST.consumers.length, EVIDENCE_MANIFEST.bindings.length, EVIDENCE_MANIFEST.semanticEvents.length, EVIDENCE_MANIFEST.eligibility.length, EVIDENCE_MANIFEST.reasons.length, EVIDENCE_MANIFEST.selectionPolicies.length];
const declaredCounts = [EVIDENCE_PRODUCERS.length, EVIDENCE_PRODUCERS.flatMap((producer) => producer.outputs).length, EVIDENCE_CONSUMERS.length, EVIDENCE_ADAPTERS.length, SEMANTIC_EVENT_PROJECTION_IDS.length, EVIDENCE_ELIGIBILITY_DECLARATIONS.length, EVIDENCE_REASON_DECLARATIONS.length, EVIDENCE_SELECTION_POLICIES.length];
if (counts.join("/") !== declaredCounts.join("/")) throw new TypeError(`Semantic evidence compiler dropped a declaration: compiled ${counts.join("/")}, declared ${declaredCounts.join("/")}`);

console.log(`evidence-manifest-check: ${EVIDENCE_MANIFEST.digest} · ${counts.slice(0, 4).join("/")} core · ${counts.slice(4).join("/")} semantic`);
