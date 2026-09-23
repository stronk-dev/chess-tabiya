import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentTargetComparisonFrame } from "./coherent-target-comparison-frame.mjs";

const directory = "planning/semantic-consequence-search/";
function read(name) { return readFileSync(`${directory}${name}.json`); }
const targetBytes = read("d3262-target-register");
const rootBytes = read("d3262-coherent-root-frame");
const targets = JSON.parse(targetBytes);
const roots = JSON.parse(rootBytes);
const artifact = JSON.parse(read("d3262-coherent-target-comparison-frame"));

test("corrected candidates retain named target provenance without transferring outcomes", () => {
  assert.deepEqual(artifact, compileCoherentTargetComparisonFrame(targets, roots, targetBytes, rootBytes));
  assert.equal(artifact.definitions.length, 64);
  assert.equal(artifact.comparisons.length, 182);
  assert.equal(artifact.comparisons.filter((row) => row.sourceObserved).length, 96);
  assert.equal(artifact.comparisons.filter((row) => !row.sourceObserved).length, 86);
  assert.equal(artifact.controls.length, 4);
  for (const comparison of artifact.comparisons) {
    const definition = artifact.definitions.find((row) => row.id === comparison.targetId);
    assert.equal(comparison.sourceObserved,
      definition.sources.some((source) => source.candidateUci === comparison.candidateUci));
  }
});

test("crossed candidate authority or a missing observed source fails closed", () => {
  const prior = structuredClone(roots);
  prior.authority = "shared_candidate_population_not_move_grade";
  assert.throws(() => compileCoherentTargetComparisonFrame(targets, prior, targetBytes, rootBytes), /wrong authority/u);
  const missing = structuredClone(roots);
  const source = targets.targetRows[0];
  const root = missing.roots.find((row) => row.rootId === source.rootId);
  root.candidates = root.candidates.filter((row) => row.moveUci !== source.candidateUci);
  assert.throws(() => compileCoherentTargetComparisonFrame(targets, missing, targetBytes, rootBytes), /Source candidate absent/u);
});
