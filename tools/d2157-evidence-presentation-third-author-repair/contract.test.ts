// DISPOSABLE positive author contract for D2157-D2163. RFC shape only; not production UI.
import assert from "node:assert/strict";
import { test } from "vitest";
import {
  COMPONENT_EMPTY_BEHAVIOR,
  FACT_STATEMENT_RENDERERS,
  MANIFEST_PRESENTATION_REPAIRS,
  NAMED_STRUCTURE_LABEL_AUTHORITY,
  POST_P_PRESENTATION_ADAPTER_ROWS,
  PRESENTATION_ABSTENTION_ROWS,
  PRESENTATION_ADAPTER_ROWS,
  PRESENTATION_SOURCE_REASON_LABELS,
  SOURCE_ATTRIBUTION_REGISTRY,
  SOURCE_BOUND_CITATION_DERIVATION,
  type ExactPresentationAdapterRow,
} from "../d1862-presentation-adapter-plan/plan.js";

const components = (row: ExactPresentationAdapterRow): readonly string[] => row.target === null
  ? [] : row.target.kind === "component" ? [row.target.component] : row.target.members.map((member) => member.component);

test("D2157: named structure identity, label and witness geometry move atomically", () => {
  const rows = PRESENTATION_ADAPTER_ROWS.filter((row) => row.projection === "rules.structural.reading.named_structure@1");
  assert.equal(rows.length, 5);
  for (const row of rows) assert.deepEqual(row.retained, ["id", "name", "provenanceNote", "squares"]);
  const repair = MANIFEST_PRESENTATION_REPAIRS.find((row) => row.id === "named-structure-geometry");
  assert.ok(repair);
  assert.deepEqual(new Set(repair.sources), new Set([
    "packages/runtime/src/structure.ts",
    "packages/runtime/src/evidence-catalog.ts",
    "packages/runtime/src/evidence-source-adapters.ts",
  ]));
  assert.equal(NAMED_STRUCTURE_LABEL_AUTHORITY.registry, "STRUCTURE_METADATA");
  assert.equal(NAMED_STRUCTURE_LABEL_AUTHORITY.witnessField, "squares");
});

test("D2158: citation is a sealed multi-input derivation with complete attribution", () => {
  assert.equal(POST_P_PRESENTATION_ADAPTER_ROWS.length, 1);
  const adapter = POST_P_PRESENTATION_ADAPTER_ROWS[0]!;
  assert.equal(adapter.projection, "derived.citation.attribution@1");
  assert.deepEqual(components(adapter), ["citation"]);
  assert.deepEqual(SOURCE_BOUND_CITATION_DERIVATION.outputFields, [
    "content", "binding", "source", "title", "locator", "licence", "url", "revision",
  ]);
  assert.deepEqual(new Set(SOURCE_BOUND_CITATION_DERIVATION.inputAlternatives.map((row) => row[1])),
    new Set(SOURCE_ATTRIBUTION_REGISTRY.map((row) => row.sourceProjection)));
  for (const alternative of SOURCE_BOUND_CITATION_DERIVATION.inputAlternatives) {
    assert.equal(alternative[0], "run.record.evidence_ref_resolution@1");
  }
  assert.deepEqual(SOURCE_BOUND_CITATION_DERIVATION.joins,
    ["same_evidence_reference", "same_source_receipt", "same_content_digest"]);
  assert.ok(SOURCE_ATTRIBUTION_REGISTRY.every((row) => row.requiredFields.includes("licence") && row.requiredFields.includes("revision")));
});

test("D2159: every interpolated operand has one total typed formatter", () => {
  const formatterIds = new Set([
    "objective_state_label", "run_outcome_label", "pgn_result_label", "integer", "san",
    "registered_story_title", "bound_evidence_text",
  ]);
  for (const renderer of FACT_STATEMENT_RENDERERS) for (const variant of renderer.variants) {
    assert.deepEqual(new Set(Object.keys(variant.formatters)), new Set(variant.operands), renderer.rendererId);
    for (const formatter of Object.values(variant.formatters)) assert.ok(formatterIds.has(formatter), `${renderer.rendererId}:${formatter}`);
    assert.doesNotMatch(variant.template, /\{checkpointId\}/u);
  }
});

test("D2160: every consequence consumer covers both union arms", () => {
  const renderers = FACT_STATEMENT_RENDERERS.filter((row) => row.rendererId.startsWith("consequence."));
  assert.equal(renderers.length, 3);
  for (const renderer of renderers) assert.deepEqual(renderer.variants.map((variant) => variant.when), ["terminal=true", "terminal=false"]);
});

test("D2161: abstention rows preserve exact authority and source reasons", () => {
  for (const row of PRESENTATION_ABSTENTION_ROWS) {
    assert.ok(row.projection.endsWith("@1"));
    assert.ok(row.producer.endsWith("@1"));
    assert.equal(row.requestPolicy, "only_after_owning_workflow_requested_question");
    assert.ok(row.sourceReasonMap.length > 0);
    assert.equal(new Set(row.sourceReasonMap.map((mapping) => mapping.sourceReason)).size, row.sourceReasonMap.length);
    for (const mapping of row.sourceReasonMap) assert.ok(PRESENTATION_SOURCE_REASON_LABELS[mapping.sourceReason], mapping.sourceReason);
  }
  const reasons = new Set(PRESENTATION_ABSTENTION_ROWS.flatMap((row) => row.sourceReasonMap.map((mapping) => mapping.sourceReason)));
  for (const required of ["outside_tablebase_domain", "empty_population", "model_failure", "input_abstained", "no_recorded_trail"]) {
    assert.ok(reasons.has(required), required);
  }
});

test("D2162: silent components produce no abstention row", () => {
  const silentKeys = new Set(PRESENTATION_ADAPTER_ROWS.filter((row) => components(row).some((component) => COMPONENT_EMPTY_BEHAVIOR[component as keyof typeof COMPONENT_EMPTY_BEHAVIOR] === "silent")).map((row) => row.key));
  assert.ok(silentKeys.size > 0);
  assert.ok(PRESENTATION_ABSTENTION_ROWS.every((row) => !silentKeys.has(row.adapterKey)));
});

test("D2163: count-with-denominator has a real Explorer adapter", () => {
  const explorer = PRESENTATION_ADAPTER_ROWS.find((row) => row.familyId === "explorer_population");
  assert.ok(explorer);
  assert.ok(components(explorer).includes("count_with_denominator"));
  assert.equal(explorer.consumer, "inspector.corpus@1");
  assert.equal(explorer.projection, "human.explorer.population@1");
});
