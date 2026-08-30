// DISPOSABLE independent buildability review for D2164-D2170. This reproduces the return; it is
// not a production module implementation and intentionally remains outside make verify.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

const read = (path: string): string => readFileSync(path, "utf8");
const generator = read("tools/d2120-module-registration-author-contract/generate.ts");
const fixture = read("tools/d2120-module-registration-author-contract/module-plan-fixture.ts");
const witness = read("tools/d2120-module-registration-author-contract/family-witness.test.ts");
const compare = read("packages/runtime/src/compare-strips.ts");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));

const key = (value: { readonly id: string; readonly version: number }): string => `${value.id}@${value.version}`;

test("D2164: the binding generator hand-copies fields the RFC says are derived", () => {
  for (const table of ["timings", "roles", "sessions", "moduleForms", "maxFacts"]) {
    assert.match(generator, new RegExp(`const ${table}: Record`, "u"));
  }
  assert.doesNotMatch(generator, /WORKFLOW_CONTEXT_POLICIES|MODULE_DECLARATIONS|compileModuleRegistry/u);
  assert.match(generator, /timing: timings\[module\], roles: roles\[module\], sessions: sessions\[module\], forms/u);
  assert.match(generator, /budget: \{ maxFacts: maxFacts\[module\], maxForms: forms\.length \}/u);
});

test("D2165: execution rows prove callability but define no invocation or projection extractor", () => {
  assert.ok(execution.rows.every((row: any) => Object.keys(row.operation).sort().join(",") === "source,symbol"));
  const evalDelta = execution.rows.find((row: any) => row.projection.id === "derived.compare.eval_delta");
  assert.equal(evalDelta.operation.symbol, "comparisonNarrative");
  assert.match(compare, /export function comparisonNarrative[\s\S]*?\): ComparisonNarrative/u);
  assert.equal("extractor" in evalDelta || "invoke" in evalDelta || "resultParser" in evalDelta, false);
});

test("D2166: every derived output is falsely stamped as an edge with same-subject true", () => {
  const derived = execution.rows.filter((row: any) => row.stage === "derived_after_inputs");
  assert.ok(derived.length > 0);
  assert.deepEqual([...new Set(derived.map((row: any) => row.subjectKind))], ["edge"]);
  assert.ok(derived.every((row: any) => row.derivation.sameSubject === true));
  const storyRank = derived.find((row: any) => row.projection.id === "derived.story.rank");
  assert.equal(storyRank.operation.symbol, "storyMoments");
  assert.equal(storyRank.subjectKind, "edge");
});

test("D2167: nine derived inputs are neither executable rows nor declared source inputs", () => {
  const rows = new Set(execution.rows.map((row: any) => key(row.projection)));
  const dependencies = execution.rows.flatMap((row: any) => row.derivation === null ? []
    : row.derivation.kind === "all" ? row.derivation.inputs : row.derivation.alternatives.flat());
  const missing = [...new Set(dependencies.map(key).filter((id: string) => !rows.has(id)))].sort();
  assert.deepEqual(missing, [
    "derived.story.eval_shift@1", "derived.story.last_level@1",
    "rules.exchange.predicate.legal_exchange@1", "rules.square.event.control@1",
    "rules.structural.predicate.direct_attack_count@1", "rules.structural.predicate.line_blockers@1",
    "rules.structural.predicate.passed_pawn@1", "rules.tactic.reading.defender_duty_set@1",
    "run.record.move@1",
  ]);
  assert.equal("sourceInputs" in execution, false);
});

test("D2168: the mandatory guided-hint product is vacuously absent from the author authority", () => {
  assert.doesNotMatch(fixture, /guided_hint:/u);
  assert.doesNotMatch(fixture, /HINT_DISCLOSURE_PROJECTION_IDS/u);
  assert.equal(bindings.rows.some((row: any) => row.consumer.id === "module.guided_hint"), false);
  assert.doesNotMatch(generator, /HINT_DISCLOSURE_PROJECTION_IDS|nonEmptyHint/u);
});

test("D2169: adapter ids and form compatibility are invented without the presentation registry", () => {
  assert.ok(bindings.rows.every((row: any) => row.adapter.id === `presentation.${row.consumer.id}.${row.projection.id}`));
  assert.doesNotMatch(generator, /PRESENTATION_ADAPTER_ROWS|ProjectionPresentationAdapter|COMPONENT_FORM_CAPABILITIES/u);
  assert.match(generator, /const forms = projection\.forms\.filter\(\(form\) => moduleForms\[module\]!\.includes\(form\)\)/u);
});

test("D2170: broad family smoke tests never prove a row emits its declared projection", () => {
  assert.doesNotMatch(witness, /module-execution-plan-v1|execution\.rows/u);
  assert.equal((witness.match(/\bit\(/gu) ?? []).length, 2);
  assert.match(witness, /eight D2120 execution source families/u);
  assert.equal(execution.rows.length, 117);
});
