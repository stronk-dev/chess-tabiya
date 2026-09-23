import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileLocalRelationContrast } from "./local-relation-contrast.mjs";

const read = (name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}.json`, "utf8"));
const comparisons = read("d3262-target-comparison-frame");
const material = read("d3262-material-immediate");
const witness = read("d3262-destination-reply-witness");
const artifact = read("d3262-local-relation-contrast");

test("exact local contrast recomputes same-target source/alternative pairs with explicit uncovered targets", () => {
  assert.deepEqual({ ...compileLocalRelationContrast(comparisons, material, witness), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 123);
  assert.equal(artifact.unpairedTargets.length, 17);
  assert.equal(artifact.rows.filter((row) => row.family === "material").length, 68);
  assert.equal(artifact.rows.filter((row) => row.family === "destination").length, 55);
  assert.ok(artifact.rows.every((row) => row.sourceCandidateUci !== row.alternativeCandidateUci));
});

test("contrast reports both material directions and refuses to count a missing minor as safety", () => {
  assert.equal(artifact.rows.filter((row) => row.family === "material" && row.contrast === "source_only_local_relation").length, 23);
  assert.equal(artifact.rows.filter((row) => row.family === "material" && row.contrast === "alternative_only_local_relation").length, 12);
  assert.equal(artifact.rows.filter((row) => row.family === "material" && row.contrast === "same_local_relation").length, 33);
  assert.equal(artifact.rows.filter((row) => row.family === "destination" && row.contrast === "source_only_local_relation").length, 54);
  const absent = artifact.rows.filter((row) => row.contrast === "not_comparable_minor_absent");
  assert.equal(absent.length, 1);
  assert.equal(absent[0].alternative.status, "named_minor_absent");
  assert.ok(!JSON.stringify(artifact).includes("better_move"));
});

test("a crossed evaluation or false source identity fails instead of disappearing", () => {
  const missing = structuredClone(material);
  missing.rows.pop();
  assert.throws(() => compileLocalRelationContrast(comparisons, missing, witness), /population drift/u);
  const falseSource = structuredClone(comparisons);
  falseSource.comparisons.find((row) => row.sourceObserved).sourceObserved = false;
  assert.throws(() => compileLocalRelationContrast(falseSource, material, witness), /no-alternative population drift|No source candidate/u);
  const crossed = structuredClone(witness);
  crossed.rows[0].status = "best_move";
  assert.throws(() => compileLocalRelationContrast(comparisons, material, crossed), /Unknown local destination reading/u);
});
