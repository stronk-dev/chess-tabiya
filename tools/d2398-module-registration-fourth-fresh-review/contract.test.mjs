// DISPOSABLE fourth fresh independent review harness — D2398-D2400.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/module-registration.md");
const generator = read("tools/d2120-module-registration-author-contract/generate.ts");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));

test("D2398: the generic cross-grain token is gone and derivations retain intrinsic grains", () => {
  assert.doesNotMatch(generator, /projection_between_grains@1/u);
  assert.ok(execution.rows.every((row) => row.subjectAuthority.subjectKind === row.subjectKind));
  for (const row of execution.rows.filter((candidate) => candidate.derivation !== null)) {
    assert.ok(row.derivation.inputBindings.length > 0);
    assert.ok(row.derivation.inputBindings.every((binding) => binding.sourceSubjectKind !== undefined && binding.relation !== undefined));
  }
});

test("D2399: the direct-call schema is retained only as explicit non-normative history", () => {
  assert.match(rfc, /2\.5\.0 — Withdrawn direct-call draft \(historical, non-normative\)/u);
  assert.match(rfc, /deleted from the implementation contract and must not\s+be implemented/u);
  assert.match(rfc, /`operation` must be callable/u);
  assert.match(rfc, /imports each declared source,\s+resolves the named function or prototype method and asserts callable identity/u);
  assert.ok(execution.rows.every((row) => row.status === "awaiting_upstream_sealed_operation"));
  assert.ok(execution.rows.every((row) => !("operation" in row) && !("sourceFamily" in row)));
  assert.equal(execution.completionClaim, "requirements_only");
});

test("D2400: packet timing is an explicit ceiling, never a final binding claim", () => {
  const bindings = JSON.parse(read("rfc/contracts/module-binding-plan-v1.json"));
  assert.doesNotMatch(generator, /timing: sourceTimingCeiling/u);
  assert.ok(bindings.rows.every((row) => !("timing" in row)));
  assert.ok(bindings.rows.every((row) => row.timingRequirement.exactProjectionOperation === null));
  assert.ok(bindings.rows.every((row) => row.timingRequirement.status === "awaiting_upstream_exact_operation"));

  const broadSource = { timings: ["precommit", "postcommit"] };
  const modulePolicy = { timings: ["precommit"] };
  const exactProjection = { timings: ["postcommit"] };
  const implemented = modulePolicy.timings.filter((timing) => broadSource.timings.includes(timing));
  const required = implemented.filter((timing) => exactProjection.timings.includes(timing));
  assert.deepEqual(implemented, ["precommit"]);
  assert.deepEqual(required, []);
});
