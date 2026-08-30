// DISPOSABLE independent buildability review for D2157-D2163. This reproduces the return; it is
// not a production presentation implementation and intentionally remains outside make verify.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";
import {
  FACT_STATEMENT_RENDERERS,
  MANIFEST_PRESENTATION_REPAIRS,
  PRESENTATION_ABSTENTION_ROWS,
  PRESENTATION_ADAPTER_ROWS,
  type PresentationAbstentionLifecycle,
} from "../d1862-presentation-adapter-plan/plan.ts";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/evidence-presentation.md");
const plan = read("tools/d1862-presentation-adapter-plan/plan.ts");
const catalogue = read("packages/runtime/src/evidence-catalog.ts");

test("D2157: the named-structure repair still omits admitted identity and geometry operands", () => {
  const rows = PRESENTATION_ADAPTER_ROWS.filter((row) => row.familyId === "named_structure_board_operand_gap");
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0]!.retained, ["provenanceNote"]);
  const repair = MANIFEST_PRESENTATION_REPAIRS.find((row) => row.id === "named-structure-geometry");
  assert.equal(repair?.source, "packages/runtime/src/structure.ts");
  assert.match(catalogue, /kind === "named_structure" \? \["provenanceNote"\]/u);
  assert.doesNotMatch(repair?.operation ?? "", /evidence-catalog|operands/u);
});

test("D2158: the citation target cannot be built from its exact pair-local retained payload", () => {
  const row = PRESENTATION_ADAPTER_ROWS.find((item) => item.familyId === "evidence_ref_resolution");
  assert.ok(row);
  assert.deepEqual(row.retained, ["reference", "text", "sourceLabel"]);
  assert.equal(row.target?.kind, "composition");
  assert.ok(row.target?.kind === "composition" && row.target.members.some((member) => member.component === "citation"));
  const citation = rfc.slice(rfc.indexOf("#### 3.8 `citation`"), rfc.indexOf("#### 3.9 `enum_state`"));
  for (const required of ["title", "locator", "licence", "source"]) assert.match(citation, new RegExp(`readonly ${required}:`, "u"));
});

test("D2159: registered fact templates interpolate raw ids and enums outside the label layer", () => {
  const templates = FACT_STATEMENT_RENDERERS.flatMap((renderer) => renderer.variants.map((variant) => variant.template));
  assert.ok(templates.some((template) => template.includes("{checkpointId}")));
  assert.ok(templates.some((template) => template.includes("{from}") && template.includes("{to}")));
  assert.ok(templates.some((template) => template.includes("{outcome}")));
  assert.doesNotMatch(plan, /labelRenderer|labelVocabulary|formatOperand/u);
});

test("D2160: two consequence consumers have no non-terminal renderer variant", () => {
  const consequence = FACT_STATEMENT_RENDERERS.filter((renderer) => renderer.rendererId.startsWith("consequence."));
  assert.equal(consequence.length, 3);
  const incomplete = consequence.filter((renderer) => !renderer.variants.some((variant) => variant.when === "terminal=false"));
  assert.deepEqual(incomplete.map((renderer) => renderer.rendererId).sort(), [
    "consequence.guidance.voice_story@1",
    "consequence.review.story@1",
  ]);
});

test("D2161: executable abstention authority omits identity fields and source-reason mappings", () => {
  const pending: PresentationAbstentionLifecycle = {
    kind: "pending",
    requestId: "r1",
    decision: { eventHeadSeq: 1, cursor: { branchId: "b", nodeId: "n" }, disclosureBoundarySeq: null, digest: "d" },
  };
  assert.deepEqual(Object.keys(pending).sort(), ["decision", "kind", "requestId"]);
  assert.doesNotMatch(plan.slice(plan.indexOf("export interface PresentationAbstentionPlan")), /sourceReasons|sourceReasonMap/u);
  assert.match(catalogue, /outside_tablebase_domain/u);
  assert.match(catalogue, /empty_population/u);
  assert.ok(PRESENTATION_ABSTENTION_ROWS.every((row) => !row.reasons.includes("outside_tablebase_domain" as never)));
});

test("D2162: silent claims are nevertheless forced into the abstention-card population", () => {
  const claimRows = PRESENTATION_ADAPTER_ROWS.filter((row) => row.target !== null && (
    row.target.kind === "component" ? row.target.component === "claim" : row.target.members.some((member) => member.component === "claim")
  ));
  assert.equal(claimRows.length, 4);
  const abstaining = new Set(PRESENTATION_ABSTENTION_ROWS.map((row) => row.adapterKey));
  assert.ok(claimRows.every((row) => abstaining.has(row.key)));
  assert.match(rfc.slice(rfc.indexOf("#### 3.10 `claim`"), rfc.indexOf("#### 3.10a `fact_statement`")), /\*\*Empty:\*\* `silent`/u);
});

test("D2163: count-with-denominator has no real adapter or named future owner", () => {
  const targets = PRESENTATION_ADAPTER_ROWS.flatMap((row) => row.target === null ? []
    : row.target.kind === "component" ? [row.target.component] : row.target.members.map((member) => member.component));
  assert.equal(targets.filter((component) => component === "count_with_denominator").length, 0);
  const discharges = rfc.slice(rfc.indexOf("## Discharges"), rfc.indexOf("## Questions resolved"));
  assert.doesNotMatch(discharges, /count_with_denominator/u);
});
