// DISPOSABLE third fresh independent review harness — D2343-D2347. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const generator = read("tools/d2120-module-registration-author-contract/generate.ts");
const fixture = read("tools/d2120-module-registration-author-contract/module-plan-fixture.ts");
const assembly = read("tools/d1865-evidence-assembly-harness/evidence-assembly.test.ts");
const moduleContract = read("packages/runtime/src/module-contract.ts");

const executionRow = (id) => execution.rows.find((row) => row.projection.id === id);
const bindingRow = (consumer, projection) => bindings.rows.find(
  (row) => row.consumer.id === consumer && row.projection.id === projection,
);

test("D2343: the author repair makes the RFC's named assembly authority red", () => {
  assert.match(fixture, /guided_hint: Object\.freeze\(\[\]\)/u);
  const localAccepts = assembly.slice(
    assembly.indexOf("const MODULE_ACCEPTS"),
    assembly.indexOf("const ASSEMBLY_STAGE_BY_PRODUCER"),
  );
  assert.doesNotMatch(localAccepts, /guided_hint/u);
  assert.match(assembly, /expect\(MODULE_ACCEPTS\)\.toEqual\(AUTHOR_MODULE_ACCEPTS\)/u);
});

test("D2344: subject grain is inferred from producer family instead of the projection", () => {
  assert.equal(executionRow("derived.material.reading.role_signature").subjectKind, "edge");
  assert.equal(executionRow("derived.material.reading.role_signature").derivation.join.rule, "same_edge_context");
  assert.equal(executionRow("derived.grade.move_quality").subjectKind, "run_prefix");
  assert.equal(executionRow("derived.grade.move_quality").derivation.join.rule, "same_frozen_prefix");
  assert.match(generator, /const subjectFor = \(producer: string, stage: string\)/u);
  assert.match(generator, /if \(producer === "derived\.story" \|\| producer === "derived\.grade"/u);
});

test("D2345: one run-record source input cannot inhabit its edge and branch-pair consumers", () => {
  const source = execution.sourceInputs.find((row) => row.projection.id === "run.record.move");
  assert.equal(source.subjectKind, "run_prefix");
  const consumers = execution.rows.filter((row) => JSON.stringify(row.derivation).includes("run.record.move"));
  assert.deepEqual(new Set(consumers.map((row) => row.subjectKind)), new Set(["edge", "branch_pair"]));
  assert.equal(executionRow("derived.compare.piece_route").derivation.join.rule, "declared_branch_pair");
});

test("D2346: binding timing copies the module image without an operation applicability term", () => {
  assert.ok(execution.sourceContracts.every((row) => !("timings" in row) && !("subjectKinds" in row)));
  const row = bindingRow("module.threat_radar", "derived.tactic.defender_exposure");
  assert.deepEqual(row.timing, ["precommit", "postcommit"]);
  assert.equal(executionRow("derived.tactic.defender_exposure").acquisition, "recorded_semantic_path@1");
  assert.match(generator, /timing: policy\.timings/u);
  assert.doesNotMatch(generator, /operationTiming|sourceTiming|timingIntersection/u);
});

test("D2347: the requirement artifact drops the list half of every card form", () => {
  assert.match(moduleContract, /card: \["panel", "list"\]/u);
  for (const module of ["sight_on_request", "threat_radar", "compare_coach", "review_map", "full_inspector"]) {
    const policyStart = fixture.indexOf(`${module}: Object.freeze`);
    assert.notEqual(policyStart, -1);
    const policyEnd = fixture.indexOf("}),", policyStart) + 3;
    assert.doesNotMatch(fixture.slice(policyStart, policyEnd), /"list"/u);
  }
  const threat = bindingRow("module.threat_radar", "rules.tactic.consequence.threat");
  assert.deepEqual(threat.forms, ["panel"]);
  assert.match(generator, /const forms = projection\.forms\.filter\(\(form\) => policy\.forms\.includes/u);
});
