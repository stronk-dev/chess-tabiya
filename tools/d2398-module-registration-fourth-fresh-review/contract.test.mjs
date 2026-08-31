// DISPOSABLE fourth fresh independent review harness — D2398-D2400.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/module-registration.md");
const generator = read("tools/d2120-module-registration-author-contract/generate.ts");
const execution = JSON.parse(read("rfc/contracts/module-execution-plan-v1.json"));

test("D2398: the generic cross-grain token has no typed derivation contract", () => {
  const backward = execution.rows.find((row) => row.projection.id === "rules.structural.reading.backward_pawn");
  const branchView = backward.subjectViews.find((view) => view.subjectKind === "branch_pair");
  assert.deepEqual(branchView, {
    subjectKind: "branch_pair",
    acquisition: "review_evidence_packet@1",
    adapter: "projection_between_grains@1",
  });
  assert.equal(Object.keys(branchView).some((key) => ["inputs", "before", "after", "join", "output", "abstention"].includes(key)), false);
  assert.match(generator, /adapter: direct \? "identity" : "projection_between_grains@1"/u);
  assert.equal(execution.rows.some((row) => row.projection.id === "projection_between_grains"), false);
});

test("D2399: the later normative direct-call schema contradicts every generated row", () => {
  assert.match(rfc, /`operation` must be callable/u);
  assert.match(rfc, /imports each declared source,\s+resolves the named function or prototype method and asserts callable identity/u);
  assert.ok(execution.rows.every((row) => row.status === "awaiting_upstream_sealed_operation"));
  assert.ok(execution.rows.every((row) => !("operation" in row) && !("sourceFamily" in row)));
  assert.equal(execution.completionClaim, "requirements_only");
});

test("D2400: exact projection timing is absent from the compiled intersection", () => {
  assert.match(generator, /const timing = policy\.timings\.filter\(\(value\) => source\.timings\.includes/u);
  assert.ok(execution.rows.every((row) => !("timings" in row)));
  assert.ok(execution.rows.every((row) => row.subjectViews.every((view) => !("timings" in view))));

  const broadSource = { timings: ["precommit", "postcommit"] };
  const modulePolicy = { timings: ["precommit"] };
  const exactProjection = { timings: ["postcommit"] };
  const implemented = modulePolicy.timings.filter((timing) => broadSource.timings.includes(timing));
  const required = implemented.filter((timing) => exactProjection.timings.includes(timing));
  assert.deepEqual(implemented, ["precommit"]);
  assert.deepEqual(required, []);
});
