import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { compileCoherentFrontierTargetOutcome } from "./dist/coherent-frontier-target-outcome.mjs";

const directory = "planning/semantic-consequence-search";
const json = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`, "utf8"));
const comparisons = json("d3262-coherent-target-comparison-frame");
const frame = json("d3262-coherent-root-frame");
const graph = json("d3262-coherent-exact-replies");
const bounded = json("d3262-coherent-bounded-targets");
const firstReply = json("d3262-coherent-first-reply-frontier");
const reserve = json("d3262-coherent-semantic-reserve");
const compile = (a = comparisons, b = frame, c = graph, d = bounded,
  e = firstReply, f = reserve) => compileCoherentFrontierTargetOutcome(a, b, c, d, e, f);

test("engine, Maia and semantic arms share all 182 exact target questions", () => {
  const result = compile();
  assert.equal(result.rows.length, 182);
  assert.equal(result.controls.length, 4);
  for (const row of result.rows) {
    assert.equal(row.arms.length, 29);
    for (const arm of row.arms) {
      assert.equal(arm.selectedCount + arm.unvisitedLegal, row.legalReplyCount);
      assert.ok(!arm.result.reintroducedWithin3Ply || row.exact.reintroducedWithin3Ply);
      assert.ok(!arm.result.preparationSurvivesEveryDefence || row.exact.preparationSurvivesEveryDefence);
      assert.ok(arm.unvisitedLegal === 0 || arm.proofCeiling === "partial_frontier");
    }
  }
});

test("crossed provider path and semantic baseline refuse the common comparison", () => {
  const wrongProvider = structuredClone(firstReply);
  wrongProvider.rows[0].replies[0].fen = "8/8/8/8/8/8/8/8 w - - 0 1";
  assert.throws(() => compile(comparisons, frame, graph, bounded, wrongProvider), /Provider reply is not an exact legal path/);
  const wrongReserve = structuredClone(reserve);
  wrongReserve.rows[0].baseline = ["a1a1", ...wrongReserve.rows[0].baseline.slice(1)];
  assert.throws(() => compile(comparisons, frame, graph, bounded, firstReply, wrongReserve), /Semantic arm changed the engine baseline/);
});

test("duplicate selection identity and missing named comparison cannot pass", () => {
  const duplicate = structuredClone(firstReply);
  duplicate.rows.push(structuredClone(duplicate.rows[0]));
  assert.throws(() => compile(comparisons, frame, graph, bounded, duplicate), /Crossed corrected frontier\/target authorities/);
  const missing = structuredClone(bounded);
  missing.rows.pop();
  assert.throws(() => compile(comparisons, frame, graph, missing), /Crossed corrected frontier\/target authorities/);
});
