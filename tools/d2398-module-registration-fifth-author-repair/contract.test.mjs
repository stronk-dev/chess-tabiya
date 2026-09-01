// DISPOSABLE fifth author-repair contract — D2398-D2400. Not production code.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/module-registration.md");
const generator = read("tools/d2120-module-registration-author-contract/generate.ts");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));
const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
const canonical = (value) => `${JSON.stringify(value, null, 2)}\n`;
const digest = (value) => `sha256:${createHash("sha256").update(canonical(value)).digest("hex")}`;
const key = (value) => `${value.id}@${value.version}`;

test("D2398 retains intrinsic input grains through typed derivation relations", () => {
  assert.doesNotMatch(generator, /projection_between_grains@1|AUTHOR_ADDITIONAL_SUBJECT_VIEWS/u);
  assert.ok(execution.rows.every((row) => row.subjectAuthority.subjectKind === row.subjectKind));
  assert.deepEqual(execution.sourceInputs.filter((row) => row.projection.id === "run.record.move"), [
    { projection: { id: "run.record.move", version: 1 }, subjectKind: "edge", acquisition: "recorded_semantic_path@1", status: "awaiting_upstream_sealed_operation" },
  ]);
  for (const row of execution.rows.filter((candidate) => candidate.derivation !== null)) {
    const inputs = row.derivation.kind === "all" ? row.derivation.inputs : row.derivation.alternatives.flat();
    assert.deepEqual(row.derivation.inputBindings.map((binding) => key(binding.projection)), inputs.map(key));
    assert.ok(row.derivation.inputBindings.every((binding) => binding.sourceSubjectKind !== undefined));
    assert.ok(row.derivation.inputBindings.every((binding) => /^(same_|edge_position_endpoints|branch_pair_|prefix_|operation_owned_occurrences)/u.test(binding.relation)));
  }
});

test("D2399 has one normative requirements-only assembly contract", () => {
  assert.match(rfc, /#### 2\.5 — Sealed-pool requirement assembly/u);
  assert.match(rfc, /#### 2\.5\.0 — Withdrawn direct-call draft \(historical, non-normative\)/u);
  assert.match(rfc, /requirements-only sealed-pool contract is the sole authority/u);
  assert.ok(execution.rows.every((row) => !("operation" in row) && !("sourceFamily" in row)));
  assert.equal(execution.completionClaim, "requirements_only");
});

test("D2400 refuses to mint final timing before exact operation applicability", () => {
  assert.ok(bindings.rows.every((row) => !("timing" in row)));
  assert.ok(bindings.rows.every((row) => row.timingRequirement.status === "awaiting_upstream_exact_operation"));
  assert.ok(bindings.rows.every((row) => row.timingRequirement.exactProjectionOperation === null));
  assert.ok(bindings.rows.every((row) => row.timingRequirement.sourceCeiling.length > 0));
});

test("sealed requirement artifacts retain their exact populations and digests", () => {
  for (const artifact of [execution, bindings]) {
    const { digest: sealed, ...body } = artifact;
    assert.equal(sealed, digest(body));
    assert.equal(artifact.completionClaim, "requirements_only");
  }
  assert.equal(execution.rows.length, 117);
  assert.equal(bindings.rows.length, 205);
});
