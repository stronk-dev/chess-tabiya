import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileTargetComparisonFrame } from "./target-comparison-frame.mjs";

const targets = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-target-register.json", import.meta.url), "utf8"));
const frame = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-root-frame.json", import.meta.url), "utf8"));
const artifact = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-target-comparison-frame.json", import.meta.url), "utf8"));

test("all named source targets are compared against the same selected root moves", () => {
  assert.deepEqual(artifact, compileTargetComparisonFrame(targets, frame));
  assert.equal(artifact.definitions.length, 64);
  assert.equal(artifact.comparisons.length, 185);
  assert.equal(artifact.comparisons.filter((row) => row.sourceObserved).length, 96);
  assert.equal(artifact.comparisons.filter((row) => !row.sourceObserved).length, 89);
  assert.equal(artifact.controls.find((row) => row.rootId === "quiet-plan:carlsbad-nf8")?.status, "no_autonomous_semantic_target");
});

test("a missing source candidate or mismatched manifest fails instead of inventing a comparison", () => {
  const missing = structuredClone(frame);
  const selected = missing.roots.find((root) => root.rootId === targets.targetRows[0].rootId);
  selected.candidates = selected.candidates.filter((candidate) => candidate.moveUci !== targets.targetRows[0].candidateUci);
  assert.throws(() => compileTargetComparisonFrame(targets, missing), /Source candidate absent/u);
  assert.throws(() => compileTargetComparisonFrame({ ...targets, manifest: "foreign" }, frame), /frozen manifest/u);
});

test("a source target cannot be mislabelled as an observed result for another move", () => {
  for (const comparison of artifact.comparisons) {
    const definition = artifact.definitions.find((row) => row.id === comparison.targetId);
    const actual = definition.sources.some((source) => source.candidateUci === comparison.candidateUci);
    assert.equal(comparison.sourceObserved, actual);
  }
});
