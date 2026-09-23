import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileLocalRankConcordance } from "./local-rank-concordance.mjs";

const read = (name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}.json`, "utf8"));
const local = read("d3262-local-relation-contrast");
const comparisons = read("d3262-target-comparison-frame");
const capture = read("d3262-stockfish-capture");
const artifact = read("d3262-local-rank-concordance");

test("root MultiPV concordance recomputes exact pairs without cp/mate arithmetic", () => {
  assert.deepEqual({ ...compileLocalRankConcordance(local, comparisons, capture), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 123 * 3);
  assert.equal(artifact.unpairedTargets.length, 17);
  const changedScore = structuredClone(capture);
  changedScore.rows[0].probes[0].entries[0].score.value += 10_000;
  assert.deepEqual(compileLocalRankConcordance(local, comparisons, changedScore).rows, artifact.rows);
});

test("both relation directions, no-direction cases and bounded pairs stay separate", () => {
  for (const budget of artifact.budgets) {
    const rows = artifact.rows.filter((row) => row.budget === budget);
    assert.equal(rows.filter((row) => row.alignment !== "no_directional_local_relation").length, 89);
    assert.equal(rows.filter((row) => row.alignment === "no_directional_local_relation").length, 34);
    assert.equal(rows.filter((row) => row.family === "material" && row.contrast === "alternative_only_local_relation").length, 12);
    assert.equal(rows.filter((row) => row.family === "destination" && row.contrast === "not_comparable_minor_absent").length, 1);
  }
  assert.equal(artifact.rows.filter((row) => row.budget === "depth12" && row.family === "destination" && row.alignment === "rank_contrary").length, 51);
  assert.equal(artifact.rows.filter((row) => row.budget === "movetime100" && row.boundedPair && row.alignment !== "no_directional_local_relation").length, 9);
});

test("target polarity, provider authority and complete rank entries fail closed", () => {
  const falsePolarity = structuredClone(comparisons);
  const material = falsePolarity.definitions.find((definition) => definition.family === "material");
  material.target.attacker.color = material.target.attacker.color === "white" ? "black" : "white";
  assert.throws(() => compileLocalRankConcordance(local, falsePolarity, capture), /relation polarity/u);
  const falseSource = structuredClone(capture);
  falseSource.source.scorePerspective = "white_normalized";
  assert.throws(() => compileLocalRankConcordance(local, comparisons, falseSource), /Crossed root Stockfish rank source/u);
  const missing = structuredClone(capture);
  const first = local.rows[0];
  const root = missing.rows.find((row) => row.rootId === first.rootId);
  root.probes[0].entries = root.probes[0].entries.filter((entry) => entry.moveUci !== first.alternativeCandidateUci);
  assert.throws(() => compileLocalRankConcordance(local, comparisons, missing), /Missing or tied root MultiPV rank/u);
});
