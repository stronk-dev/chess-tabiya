// DISPOSABLE fourth author-return contract — D2343-D2347. This proves the
// repaired requirements model; it is not a production module implementation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const generator = read("tools/d2120-module-registration-author-contract/generate.ts");
const fixture = read("tools/d2120-module-registration-author-contract/module-plan-fixture.ts");
const assembly = read("tools/d1865-evidence-assembly-harness/evidence-assembly.test.ts");

const key = (value) => `${value.id}@${value.version}`;
const executionById = new Map(execution.rows.map((row) => [row.projection.id, row]));

test("D2343: assembly and author contracts share the explicit blocked-hint algebra", () => {
  assert.match(fixture, /guided_hint: Object\.freeze\(\[\]\)/u);
  assert.match(assembly, /const MODULE_ACCEPTS = AUTHOR_MODULE_ACCEPTS;/u);
  assert.doesNotMatch(assembly, /const (?:SIGHT|BLUNDER|THREAT|POSTCOMMIT|STRUCTURE|THEORY|COMPARE|REVIEW|INSPECTOR) =/u);
  assert.equal(execution.guidedHint.status, "owner_blocked");
  assert.equal(bindings.rows.some((row) => row.consumer.id === "module.guided_hint"), false);
});

test("D2344: exact projection authority distinguishes position, edge, branch and prefix grains", () => {
  assert.doesNotMatch(generator, /subjectFor = \(producer:/u);
  assert.match(fixture, /AUTHOR_PROJECTION_SUBJECT_OVERRIDES/u);
  assert.equal(executionById.get("derived.material.reading.role_signature").subjectKind, "position");
  assert.equal(executionById.get("derived.material.reading.role_signature").derivation.join.rule, "same_position");
  assert.equal(executionById.get("derived.grade.move_quality").subjectKind, "edge");
  assert.equal(executionById.get("derived.compare.piece_route").subjectKind, "branch_pair");
  assert.equal(executionById.get("derived.story.rank").subjectKind, "run_prefix");
});

test("D2345: every derivation input has a grain-compatible typed relation", () => {
  const sourceViews = new Set(execution.sourceInputs.map((row) => `${key(row.projection)}:${row.subjectKind}`));
  assert.ok(sourceViews.has("run.record.move@1:edge"));
  assert.equal(sourceViews.has("run.record.move@1:branch_pair"), false);
  assert.equal(sourceViews.has("run.record.move@1:run_prefix"), false);
  for (const row of execution.rows) {
    const inputs = row.derivation?.kind === "all"
      ? row.derivation.inputs
      : row.derivation?.alternatives.flat() ?? [];
    assert.deepEqual(row.derivation?.inputBindings.map((binding) => key(binding.projection)) ?? [], inputs.map(key));
    for (const binding of row.derivation?.inputBindings ?? []) {
      const input = binding.projection;
      const planned = executionById.get(input.id);
      const external = execution.sourceInputs.find((source) => key(source.projection) === key(input));
      assert.equal(binding.sourceSubjectKind, planned?.subjectKind ?? external?.subjectKind);
      assert.match(binding.relation, /^(same_|edge_position_endpoints|branch_pair_|prefix_)/u);
    }
  }
  assert.doesNotMatch(generator, /projection_between_grains@1/u);
});

test("D2346: binding timing is the non-empty module and sealed-operation intersection", () => {
  for (const source of execution.sourceContracts) {
    assert.ok(source.timings.length > 0);
    assert.ok(source.subjectKinds.length > 0);
  }
  const defender = bindings.rows.find((row) =>
    row.consumer.id === "module.threat_radar" && row.projection.id === "derived.tactic.defender_exposure");
  assert.deepEqual(defender.timingRequirement.sourceCeiling, ["postcommit"]);
  assert.equal(defender.timingRequirement.exactProjectionOperation, null);
  assert.doesNotMatch(generator, /timing: policy\.timings[,}]/u);
  assert.match(generator, /const sourceTimingCeiling = policy\.timings\.filter/u);
  assert.ok(bindings.rows.every((row) => row.timingRequirement.sourceCeiling.length > 0));
});

test("D2347: card requirements retain the complete panel and list image", () => {
  assert.match(generator, /MODULE_FORM_IMAGE\[form\]/u);
  assert.match(generator, /requiredForms: forms/u);
  for (const row of bindings.rows) {
    assert.deepEqual(row.presentationRequirement.requiredForms, row.forms);
  }
  const threat = bindings.rows.find((row) =>
    row.consumer.id === "module.threat_radar" && row.projection.id === "rules.tactic.consequence.threat");
  assert.deepEqual(threat.forms, ["list", "panel"]);
  const compare = bindings.rows.find((row) =>
    row.consumer.id === "module.compare_coach" && row.projection.id === "derived.compare.structure_delta");
  assert.deepEqual(compare.forms, ["sentence", "list", "panel"]);
});
