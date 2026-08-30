// DISPOSABLE fresh independent review harness — D2135-D2140. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/evidence-presentation.md");
const plan = read("tools/d1862-presentation-adapter-plan/plan.ts");
const catalogue = read("packages/runtime/src/evidence-catalog.ts");
const compare = read("packages/runtime/src/compare-strips.ts");

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2135: copied binding forms are not assigned to compatible components", () => {
  const planShape = section(plan, "export interface AdapterFamilyPlan", "export interface PresentationDecisionStamp");
  assert.match(planShape, /readonly components: readonly ComponentId\[\]/u);
  assert.match(planShape, /formPolicy: "exact_binding_forms" \| "remove_all_non_machine_forms"/u);
  assert.doesNotMatch(planShape, /componentForms|formsByComponent|component:\s*ComponentId;[\s\S]*forms:/u);

  const documentComponent = section(rfc, "#### 3.12 `structured_document`", "### §4");
  assert.match(documentComponent, /\*\*Forms:\*\* `panel`/u);
  assert.match(plan, /id: "authoring_evidence_record"[\s\S]{0,650}components: \["structured_document"\]/u);
  assert.match(catalogue, /id: "authoring\.claim_binding"[\s\S]{0,500}forms: \["list", "panel"\]/u);

  const trailComponent = section(rfc, "#### 3.4 `magnitude_trail`", "#### 3.5 `square_set`");
  assert.match(trailComponent, /\*\*Forms:\*\* `card` \(→ `panel`\), `timeline_mark`/u);
  assert.match(plan, /id: "engine_trajectory"[\s\S]{0,500}components: \["magnitude_trail"\]/u);
  assert.match(catalogue, /id: "compare\.engine_trajectory"[\s\S]{0,300}forms: \["list", "panel"\]/u);
});

test("D2136: the claimed consumer-class authority is absent from the executable plan", () => {
  assert.match(rfc, /`PRESENTATION_CONSUMER_CLASSES` assigns every real visual\/audio F1 consumer/u);
  assert.doesNotMatch(plan, /PRESENTATION_CONSUMER_CLASSES|ordinary_learner|author_operator/u);
  assert.match(plan, /consumers: \["opponent\.selection@1"\]/u);
  assert.match(plan, /consumers: \["runtime\.repertoire_scan@1"\]/u);
  assert.match(catalogue, /Raw bounded-search response used by opponent selection; not an attached run event or learner-facing explanation/u);
  assert.match(catalogue, /Per-position frontier result used by repertoire scanning/u);
});

test("D2137: checkpoint scope forbids the catalogue mutations required by its plan", () => {
  const criterion = section(rfc, "18. **Scope fence.", "19. **`register-check`");
  assert.match(criterion, /no edit to\s+`packages\/runtime\/src\/evidence-catalog\.ts`/u);
  const repairs = plan.match(/disposition: "repair_projection_operands"/gu) ?? [];
  const removals = plan.match(/disposition: "remove_visual_binding"/gu) ?? [];
  assert.equal(repairs.length, 4, "four family rows expand to six pair repairs");
  assert.equal(removals.length, 1);
  assert.match(rfc, /six requiring producer-operand repair/u);
  assert.match(rfc, /one false visual binding to remove/u);
});

test("D2138: fact-statement renderer ids/templates are not an executable population", () => {
  assert.match(rfc, /`FactStatementRendererId`/u);
  assert.doesNotMatch(rfc, /(?:type|interface) FactStatementRendererId\b/u);
  const planShape = section(plan, "export interface AdapterFamilyPlan", "export interface PresentationDecisionStamp");
  assert.doesNotMatch(planShape, /rendererId|renderer:|template/u);
  assert.match(plan, /assertions: \["registered_renderer_only"/u);
  assert.doesNotMatch(plan, /FACT_STATEMENT_RENDERERS|FactStatementRendererId/u);
});

test("D2139: abstention questions and reasons have no planned set-equal rows", () => {
  assert.match(rfc, /`PRESENTATION_QUESTIONS` supplies the learner label/u);
  assert.match(rfc, /`PRESENTATION_ABSENCE_REASONS` joins each projection/u);
  assert.doesNotMatch(plan, /PRESENTATION_QUESTIONS|PRESENTATION_ABSENCE_REASONS|questionId|absenceReasons/u);
});

test("D2140: recorded consequence prose consumes undeclared dropped operands", () => {
  assert.match(compare, /terminal position with learner result \$\{consequence\.outcome\}/u);
  assert.match(compare, /reaches \$\{consequence\.plies\} plies with objective state \$\{consequence\.objectiveState\}/u);
  assert.match(catalogue, /projection\("run\.record", "run\.record\.consequence"[\s\S]{0,260}operands: \["context", "terminal"\]/u);
  assert.match(plan, /id: "recorded_consequence"[\s\S]{0,300}retained: \["context", "terminal"\]/u);
  assert.doesNotMatch(plan.match(/id: "recorded_consequence"[^\n]+/u)?.[0] ?? "", /outcome|plies|objectiveState/u);
});
