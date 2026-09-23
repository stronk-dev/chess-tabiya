import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { manifestRows } from "./manifest.mjs";
import { compileTargetRegister } from "./target-register.mjs";

const source = JSON.parse(readFileSync(new URL("../d1023-bounded-policy-harness/provider-sample.json", import.meta.url), "utf8"));
const artifact = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-target-register.json", import.meta.url), "utf8"));

test("every predecessor row retains its exact named target and source identity", () => {
  assert.deepEqual(artifact, compileTargetRegister(source.populations, manifestRows));
  assert.equal(artifact.targetRows.length, 96);
  assert.equal(new Set(artifact.targetRows.map((row) => JSON.stringify([row.rootId, row.candidateUci]))).size, 94);
  assert.deepEqual(artifact.controls.map((row) => row.status), ["declared_relation_control", "no_autonomous_semantic_target", "declared_relation_control", "declared_relation_control"]);
});

test("a missing or duplicated source target fails the join", () => {
  const missing = structuredClone(source.populations);
  missing[0].rows[0].target = undefined;
  assert.throws(() => compileTargetRegister(missing, manifestRows), /Incomplete or unknown target/u);
  const duplicated = structuredClone(source.populations);
  duplicated[0].rows.push(structuredClone(duplicated[0].rows[0]));
  assert.throws(() => compileTargetRegister(duplicated, manifestRows), /Duplicate target identity/u);
});

test("a manifest source mismatch or extra source row fails rather than silently dropping identity", () => {
  const wrong = structuredClone(manifestRows);
  wrong.find((root) => root.sourceRows)?.sourceRows.splice(0, 1);
  assert.throws(() => compileTargetRegister(source.populations, wrong), /source target rows were not joined/u);
  const wrongTarget = structuredClone(source.populations);
  wrongTarget[0].rows[0].targetFamily = "unknown";
  assert.throws(() => compileTargetRegister(wrongTarget, manifestRows), /Incomplete or unknown target/u);
});
