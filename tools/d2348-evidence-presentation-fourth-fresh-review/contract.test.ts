// DISPOSABLE fourth fresh independent buildability review for evidence-presentation.
// These tests reproduce author-contract gaps; they are not production presentation code and
// intentionally remain outside make verify.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import {
  MANIFEST_PRESENTATION_REPAIRS,
  NAMED_STRUCTURE_LABEL_AUTHORITY,
  POST_P_PRESENTATION_ADAPTER_ROWS,
  PRESENTATION_ADAPTER_ROWS,
  PRESENTATION_SOURCE_REASON_LABELS,
  SOURCE_ATTRIBUTION_REGISTRY,
  SOURCE_BOUND_CITATION_DERIVATION,
} from "../d1862-presentation-adapter-plan/plan.js";

const read = (path: string): string => readFileSync(path, "utf8");
const plan = read("tools/d1862-presentation-adapter-plan/plan.ts");
const rfc = read("rfc/evidence-presentation.md");
const structure = read("packages/runtime/src/structure.ts");

function section(text: string, start: string, end: string): string {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2348: checkpoint P has no exact transformed 112-row authority", () => {
  assert.equal(PRESENTATION_ADAPTER_ROWS.length, 112);
  assert.equal(PRESENTATION_ADAPTER_ROWS.filter((row) => row.disposition === "repair_projection_operands").length, 11);
  assert.equal(PRESENTATION_ADAPTER_ROWS.filter((row) => row.disposition === "remove_visual_binding").length, 1);
  assert.equal(POST_P_PRESENTATION_ADAPTER_ROWS.length, 1);
  assert.equal([...PRESENTATION_ADAPTER_ROWS, ...POST_P_PRESENTATION_ADAPTER_ROWS].length, 113);
  assert.doesNotMatch(plan, /export const (?:POST_P_)?PRESENTATION_ADAPTER_ROWS_AFTER_P/u);
  assert.match(rfc, /Checkpoint P must\s+yield \*\*112\/112 adaptable\*\*/u);
});

test("D2349: source-bound citation output is flat while CitationOperand is nested", () => {
  const citation = section(rfc, "#### 3.8 `citation`", "#### 3.9 `enum_state`");
  assert.match(citation, /readonly content:[\s\S]*readonly source: \{/u);
  assert.deepEqual(SOURCE_BOUND_CITATION_DERIVATION.outputFields, [
    "content", "binding", "source", "title", "locator", "licence", "url", "revision",
  ]);
  assert.deepEqual(POST_P_PRESENTATION_ADAPTER_ROWS[0]?.retained,
    ["content", "binding", "source", "title", "locator", "licence", "url", "revision"]);
  assert.doesNotMatch(plan, /outputFields:[\s\S]{0,180}\["content",\s*"source"\]/u);
});

test("D2350: the source-attribution registry is neither versioned nor a complete metadata authority", () => {
  assert.match(rfc, /versioned source-attribution registry/u);
  assert.ok(SOURCE_ATTRIBUTION_REGISTRY.length > 0);
  for (const row of SOURCE_ATTRIBUTION_REGISTRY) {
    assert.deepEqual(Object.keys(row).sort(), [
      "metadataAuthority", "requiredFields", "sourceProjection", "unresolvedMetadata",
    ]);
  }
  const registry = section(plan, "export interface SourceAttributionRegistryRow", "export const SOURCE_BOUND_CITATION_DERIVATION");
  assert.doesNotMatch(registry, /readonly (?:id|version|digest):/u);
  assert.doesNotMatch(registry, /readonly (?:source|title|locator|licence|revision):/u);
});

test("D2351: unhandled source failures collapse to empty/no-witness", () => {
  for (const reason of ["artifact_invalid", "artifact_missing", "budget_exhausted", "digest_mismatch", "mate_score_inconsistent", "missing_eval", "unequal_instrument"]) {
    assert.ok(PRESENTATION_SOURCE_REASON_LABELS[reason], reason);
    assert.doesNotMatch(plan, new RegExp(`sourceReason === ["']${reason}["']`, "u"), reason);
  }
  assert.match(plan, /return Object\.freeze\(\{ sourceReason, absence: "empty", learnerReason: "no_witness" \}\);/u);
});

test("D2352: lifecycle receipts accept arbitrary question prose instead of registered identity", () => {
  const lifecycle = section(plan, "export type PresentationAbstentionLifecycle", "export function samePresentationDecision");
  assert.match(lifecycle, /question: string/gu);
  assert.doesNotMatch(lifecycle, /questionId:/u);
  assert.match(plan, /readonly questionId: string;/u);
  assert.match(plan, /questionId: `question\.\$\{row\.familyId\}`/u);
});

test("D2353: Explorer names count-with-denominator but specifies no operand construction", () => {
  const family = section(plan, 'family({ id: "explorer_population"', 'family({ id: "maia_policy"');
  assert.match(family, /retained: \["nodeId", "result", "committedMoveSan"\]/u);
  const target = section(plan, 'if \(family\.id === "explorer_population"\)', 'if \(family\.id === "transition_count"');
  assert.match(target, /component: "count_with_denominator"/u);
  assert.doesNotMatch(`${family}\n${target}`, /\bnumerator\b|denominatorMeaning|playedCount/u);
});

test("D2354: named-structure witness squares are named but no witness operation constructs them", () => {
  assert.equal(NAMED_STRUCTURE_LABEL_AUTHORITY.witnessField, "squares");
  const repair = MANIFEST_PRESENTATION_REPAIRS.find((row) => row.id === "named-structure-geometry");
  assert.ok(repair);
  assert.doesNotMatch(repair.operation, /witness|square/i);
  assert.match(structure, /export interface StructureMatch \{[\s\S]{0,180}provenanceNote: string;\s*\}/u);
  assert.match(structure, /function namedStructureMatches\([^)]*\): boolean/u);
  assert.match(structure, /kind: "named_structure", squares: \[\]/u);
});
