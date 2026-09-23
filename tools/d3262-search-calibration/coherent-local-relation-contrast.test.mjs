import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentLocalContrast } from "./coherent-local-relation-contrast.mjs";

const dir = "planning/semantic-consequence-search";
const load = (name) => JSON.parse(readFileSync(`${dir}/${name}`, "utf8"));
const comparisons = load("d3262-coherent-target-comparison-frame.json");
const immediate = load("d3262-coherent-immediate-and-witness.json");
const artifact = load("d3262-coherent-local-relation-contrast.json");

test("corrected local contrasts preserve all named source and alternative identities", () => {
  const actual = compileCoherentLocalContrast(comparisons, immediate);
  assert.deepEqual({ ...actual, inputDigests: artifact.inputDigests }, artifact);
  assert.equal(actual.rows.length, 116);
  assert.equal(actual.unpairedTargets.length, 17);
  assert.ok(actual.rows.every((row) => row.sourceCandidateUci !== row.alternativeCandidateUci));
  assert.equal(actual.rows.filter((row) => row.family === "destination" && row.contrast === "source_only_local_relation").length, 55);
  assert.match(actual.authority, /not_move_grade_or_global_cause/u);
});

test("crossed immediate population or missing reading cannot be inferred as a contrast", () => {
  const crossed = structuredClone(immediate);
  crossed.material.rows.pop();
  assert.throws(() => compileCoherentLocalContrast(comparisons, crossed), /population drift/u);
  const wrong = structuredClone(immediate);
  wrong.destinationWitness.manifest = "sha256:wrong";
  assert.throws(() => compileCoherentLocalContrast(comparisons, wrong), /Crossed local-contrast destination evaluator/u);
  const changed = structuredClone(comparisons);
  changed.comparisons.pop();
  assert.throws(() => compileCoherentLocalContrast(changed, immediate), /population drift|pair population drift/u);
});
