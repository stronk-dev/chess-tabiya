import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { compileCoherentBoundedContrast } from "./coherent-bounded-contrast.mjs";

const directory = "planning/semantic-consequence-search";
const load = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`, "utf8"));
const roots = load("d3262-coherent-root-frame");
const comparisons = load("d3262-coherent-target-comparison-frame");
const local = load("d3262-coherent-local-relation-contrast");
const bounded = load("d3262-coherent-bounded-targets");
const result = load("d3262-coherent-bounded-contrast");

test("the corrected population retains all pairs, unpaired targets and separate rank budgets", () => {
  assert.equal(result.rows.length, 116);
  assert.equal(result.unpairedTargets.length, 17);
  assert.equal(result.rows.filter((row) => row.boundedScope === "both_removed").length, 11);
  assert.equal(result.rows.filter((row) => row.boundedScope === "mixed_immediate").length, 84);
  assert.equal(result.rows.filter((row) => row.reachWithinBound === "same").length, 103);
  for (const row of result.rows) {
    assert.deepEqual(row.rootRanks.map((rank) => rank.budget), ["depth8", "depth12", "movetime100"]);
    if (row.boundedScope !== "both_removed") {
      assert.equal(row.reintroduction, null);
      assert.equal(row.allDefences, null);
      assert.ok(row.rootRanks.every((rank) => rank.reintroductionConcordance === "incomparable_scope"));
    }
  }
});

test("already-available is not misread as a failed reintroduction", () => {
  const row = result.rows.find((item) => item.source.immediate === "removed"
    && item.source.reintroducedWithin3Ply && item.alternative.immediate === "preserved");
  assert.ok(row, "the asymmetric case must exist in this frozen population");
  assert.equal(row.boundedScope, "mixed_immediate");
  assert.equal(row.reintroduction, null);
  assert.equal(row.reachWithinBound, "same");
});

test("a crossed target or lost exact result fails rather than becoming a rank explanation", () => {
  const crossed = structuredClone(bounded);
  crossed.rows[0].targetId = "target:invented";
  assert.throws(() => compileCoherentBoundedContrast(roots, comparisons, local, crossed),
    /Missing bounded target result/);
  const exhausted = structuredClone(bounded);
  exhausted.rows[0].kind = "budget_exhausted";
  assert.throws(() => compileCoherentBoundedContrast(roots, comparisons, local, exhausted),
    /Unusable bounded result/);
  const missingRank = structuredClone(roots);
  const firstPair = local.rows[0];
  const root = missingRank.roots.find((item) => item.rootId === firstPair.rootId);
  root.candidates.find((item) => item.moveUci === firstPair.sourceCandidateUci).stockfish
    .find((item) => item.budget === "depth12").rank = null;
  assert.throws(() => compileCoherentBoundedContrast(missingRank, comparisons, local, bounded),
    /Missing or tied coherent root ranks/);
  const wrongPerspective = structuredClone(comparisons);
  const definition = wrongPerspective.definitions.find((item) => item.id === firstPair.targetId);
  const targetPiece = definition.family === "material" ? definition.target.attacker : definition.target.minor;
  targetPiece.color = targetPiece.color === "white" ? "black" : "white";
  assert.throws(() => compileCoherentBoundedContrast(roots, wrongPerspective, local, bounded),
    /Named target is not an opponent option/);
});

test("the artifact is a byte-stable projection over the sealed inputs", () => {
  const compiled = compileCoherentBoundedContrast(roots, comparisons, local, bounded);
  assert.deepEqual(compiled.rows, result.rows);
  assert.deepEqual(compiled.unpairedTargets, result.unpairedTargets);
});
