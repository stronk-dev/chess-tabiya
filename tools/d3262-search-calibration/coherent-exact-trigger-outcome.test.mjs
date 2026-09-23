import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { compileCoherentExactTriggerOutcome } from "./dist/coherent-exact-trigger-outcome.mjs";

const directory = "planning/semantic-consequence-search";
const json = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`, "utf8"));
const comparisons = json("d3262-coherent-target-comparison-frame");
const frame = json("d3262-coherent-root-frame");
const graph = json("d3262-coherent-exact-replies");
const bounded = json("d3262-coherent-bounded-targets");
const compile = (a = comparisons, b = frame, c = graph, d = bounded) =>
  compileCoherentExactTriggerOutcome(a, b, c, d);

test("both exact forcing interpretations retain all 182 comparison denominators", () => {
  const result = compile();
  assert.equal(result.rows.length, 182);
  for (const row of result.rows) {
    const square = row.variants.square_control, piece = row.variants.enemy_piece;
    assert.ok(square.triggerUcis.length >= piece.triggerUcis.length);
    assert.ok(square.triggerUcis.length <= row.exactReplyCount);
    assert.ok(!square.result.preparationSurvivesEveryDefence || row.allLegal.preparationSurvivesEveryDefence);
    assert.ok(!piece.result.reintroducedWithin3Ply || row.allLegal.reintroducedWithin3Ply);
  }
});

test("a deleted legal reply cannot make a restricted result look complete", () => {
  const altered = structuredClone(graph);
  altered.roots[0].candidates[0].replies.pop();
  altered.roots[0].candidates[0].replyCount -= 1;
  assert.throws(() => compile(comparisons, frame, altered), /Incomplete exact-reply boundary/);
});

test("crossed bounded source and false check flag fail before trigger inference", () => {
  const wrongBounded = structuredClone(bounded);
  wrongBounded.rows[0].preparationSurvivesEveryDefence = !wrongBounded.rows[0].preparationSurvivesEveryDefence;
  assert.throws(() => compile(comparisons, frame, graph, wrongBounded), /Complete exact result disagrees/);
  const wrongGraph = structuredClone(graph);
  wrongGraph.roots[0].candidates[0].replies[0].givesCheck =
    !wrongGraph.roots[0].candidates[0].replies[0].givesCheck;
  assert.throws(() => compile(comparisons, frame, wrongGraph), /Crossed exact check flag/);
  const falseCapture = structuredClone(graph);
  falseCapture.roots[0].candidates[0].replies[0].captures =
    !falseCapture.roots[0].candidates[0].replies[0].captures;
  assert.throws(() => compile(comparisons, frame, falseCapture), /Crossed exact capture flag/);
});
