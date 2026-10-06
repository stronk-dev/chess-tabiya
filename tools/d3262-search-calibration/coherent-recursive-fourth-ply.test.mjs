import assert from "node:assert/strict";
import { test } from "node:test";
import { compileRecursiveCompletion, loadCompletionInputs, summarizeCompletion } from "./coherent-recursive-fourth-ply.mjs";

const inputs = loadCompletionInputs();
test("complete recursive join keeps the frozen population, past selections and omitted legal moves", () => {
  const result = compileRecursiveCompletion(inputs), frozen = inputs.values[0], summary = summarizeCompletion(result);
  assert.equal(summary.candidates, 193); assert.equal(summary.cells, 182); assert.equal(summary.arms, 18);
  assert.equal(summary.paths, 16607); assert.equal(summary.finalPlyNodes, 89329);
  assert.equal(summary.sourceOff, 0); assert.equal(summary.actualQueries, 35028);
  assert.deepEqual(result.rows, frozen.rows); assert.deepEqual(result.paths, frozen.paths);
  assert.deepEqual(result.candidateCoverage, frozen.candidateCoverage);
  assert.equal(result.supplementJobs.length, 0);
  for (let i = 0; i < frozen.finalPlyNodes.length; i++) {
    const prior = frozen.finalPlyNodes[i], actual = result.finalPlyNodes[i];
    if (prior.status !== "source_off") assert.deepEqual(actual, prior);
    else {
      const node = frozen.eventNodes.find((row) => row.id === actual.nodeId);
      assert.equal(actual.selected.length + actual.omittedLegal, node.legal.length);
      assert.ok(actual.selected.length > 0);
    }
  }
});
test("source population, frame forgery, crossed query and legal/PV corruptions refuse", () => {
  const [frame, original, , capture] = inputs.values;
  for (const [object, field, value] of [
    [frame, "paths", frame.paths.slice(1)],
    [inputs.digests, "d3262-stockfish-third-ply-capture.json.gz", "changed"],
    [original, "partial", true],
    [capture, "rows", capture.rows.slice(1)],
    [capture.source, "multiPv", "all_legal"],
    [capture.rows[0].probes[0], "legal", []],
    [capture.rows[0].probes[0].entries[0], "pv", ["a1a1"]],
    [capture, "captureScope", "semantic_third_ply_missing_budgets_only"],
  ]) {
    const old = object[field]; object[field] = value;
    try { assert.throws(() => compileRecursiveCompletion(inputs)); } finally { object[field] = old; }
  }
});
