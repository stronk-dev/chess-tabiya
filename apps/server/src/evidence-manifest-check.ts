import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { CURRENT_CONSUMER_OPERATION_IDS, EVIDENCE_PRODUCER_IDS } from "@chess-tabiya/runtime";

import { EVIDENCE_MANIFEST, assertEvidenceManifest } from "./evidence-manifest.js";

const ROOT = process.cwd();
const CONSUMER_ANCHORS = Object.freeze([
  ["authoring.predicate", "packages/runtime/src/structural-evidence.ts", "export function structuralEvidenceForAuthoring"],
  ["runtime.objective_condition", "packages/runtime/src/structural-evidence.ts", "export function structuralEvidenceForObjective"],
  ["runtime.guard_condition", "apps/server/src/guard.ts", "export function consumeGuardCondition"],
  ["guidance.deterministic", "apps/server/src/guidance.ts", "export function renderedEvidenceItems"],
  ["guidance.voice", "apps/server/src/guidance.ts", "export function voiceEvidenceView"],
  ["guidance.recorded_reading", "apps/server/src/guidance.ts", "export function renderRecordedReadingEvidence"],
  ["runtime.evidence_ref", "apps/web/src/lib/evidence-sentences.ts", "export function renderDeclaredEvidenceRef"],
  ["inspector.position_structure", "packages/runtime/src/reading-evidence.ts", "export function consumePositionStructure"],
  ["inspector.move_transition", "packages/runtime/src/reading-evidence.ts", "export function consumeMoveTransition"],
  ["board.selected_square_sight", "packages/runtime/src/reading-evidence.ts", "export function consumeSelectedSquareSight"],
  ["theory.shape_firing", "packages/runtime/src/shape-firing.ts", "export function consumeShapeFiring"],
  ["compare.structure_strip", "packages/runtime/src/compare-strips.ts", "export function consumeComparisonStripEvidence"],
  ["compare.engine_trajectory", "packages/runtime/src/compare-strips.ts", "export function consumeComparisonEngineTrajectory"],
  ["inspector.human_split", "apps/web/src/lib/inspector-evidence.ts", "export function consumeHumanSplit"],
  ["inspector.corpus", "apps/web/src/lib/inspector-evidence.ts", "export function consumeCorpus"],
  ["opponent.selection", "apps/server/src/opponent-selector.ts", "export function consumeOpponentSelectionEvidence"],
  ["guidance.authored_claim", "apps/web/src/lib/claim-presentation.ts", "export function claimProvenanceDeclared"],
  ["board.pivotal_marker", "packages/runtime/src/pivotal.ts", "export function consumePivotalMarkers"],
  ["review.story", "packages/runtime/src/story.ts", "export function renderReviewStoryEvidence"],
  ["runtime.repertoire_scan", "apps/server/src/repertoire.ts", "export function consumeRepertoireCorpus"],
  ["authoring.claim_binding", "apps/server/src/sourcing/claim-binding.ts", "export function consumeClaimBindingRecords"],
  ["guidance.voice_compare", "apps/server/src/rest.ts", "narrative.evidence, false"],
  ["guidance.voice_story", "apps/server/src/rest.ts", "storyDeclaredEvidence"],
] as const);

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

assertEvidenceManifest();
const declaredConsumers = EVIDENCE_MANIFEST.consumers.map((consumer) => consumer.id);
const operationIds = CONSUMER_ANCHORS.map(([id]) => id);
if (new Set(operationIds).size !== CONSUMER_ANCHORS.length || operationIds.join("|") !== CURRENT_CONSUMER_OPERATION_IDS.join("|")) throw new TypeError("The 23-operation consumer anchor census is not set/order-equal to the primary catalogue");
for (const [id, path, needle] of CONSUMER_ANCHORS) {
  if (!declaredConsumers.includes(id)) throw new TypeError(`Consumer anchor ${id} has no declaration`);
  if (!source(path).includes(needle)) throw new TypeError(`Consumer anchor drift: ${id} expected ${needle} in ${path}`);
}

const NON_CONSUMER_ANCHORS = Object.freeze([
  ["producer", "apps/server/src/guidance.ts", "export function evidencePacket"],
  ["acquisition", "apps/server/src/rest.ts", "route.action === \"analysis\""],
] as const);
for (const [direction, path, needle] of NON_CONSUMER_ANCHORS) {
  if (!source(path).includes(needle)) throw new TypeError(`Evidence ${direction} anchor drift: expected ${needle} in ${path}`);
  if (declaredConsumers.includes(direction === "producer" ? "guidance.packet" : "analysis.engine")) throw new TypeError(`Evidence ${direction} anchor was incorrectly reintroduced as a consumer`);
}

if (EVIDENCE_MANIFEST.producers.map((producer) => producer.id).sort().join("|") !== [...EVIDENCE_PRODUCER_IDS].sort().join("|")) throw new TypeError("The producer paths are not set-equal to the primary catalogue");
for (const producer of EVIDENCE_MANIFEST.producers) {
  for (const path of producer.implementation.split(";").map((item) => item.trim().replace(/(\.ts):.*$/u, "$1")).filter((item) => item.includes("/"))) source(path);
}

const guidance = source("apps/server/src/guidance.ts");
const externalVoice = source("apps/server/src/external-voice.ts");
if (!guidance.includes("render(view: VoiceEvidenceView") || !externalVoice.includes("view.rendered.items")) throw new TypeError("EVIDENCE_GENERIC_BYPASS: external voice is not bound to the rendered VoiceEvidenceView");

const arrows = EVIDENCE_MANIFEST.consumers.find((consumer) => consumer.id === "assistance.arrows");
if (arrows?.disposition?.kind !== "experimental" || arrows.accepts.length !== 0) throw new TypeError("assistance.arrows lost its explicit producerless experimental disposition");
const semanticResearch = EVIDENCE_MANIFEST.consumers.find((consumer) => consumer.id === "research.semantic_selection");
if (semanticResearch === undefined || semanticResearch.accepts.length !== 37 || EVIDENCE_MANIFEST.selectionPolicies[0]?.consumer.id !== semanticResearch.id) throw new TypeError("The research semantic-selection consumer is not closed over its 37 exact event bindings");
const counts = [EVIDENCE_MANIFEST.producers.length, EVIDENCE_MANIFEST.projections.length, EVIDENCE_MANIFEST.consumers.length, EVIDENCE_MANIFEST.bindings.length, EVIDENCE_MANIFEST.semanticEvents.length, EVIDENCE_MANIFEST.eligibility.length, EVIDENCE_MANIFEST.reasons.length, EVIDENCE_MANIFEST.selectionPolicies.length];
if (counts.join("/") !== "23/133/25/179/37/37/15/1") throw new TypeError(`Semantic evidence closure drift: ${counts.join("/")}`);

console.log(`evidence-manifest-check: ${EVIDENCE_MANIFEST.digest} · 23/133/25/179 core · 37/37/15/1 semantic`);
