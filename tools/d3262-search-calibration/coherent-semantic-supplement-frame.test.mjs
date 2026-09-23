import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { compileSemanticSupplementFrame } from "./coherent-semantic-supplement-frame.mjs";

const directory = "planning/semantic-consequence-search";
const load = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`, "utf8"));
const gap = load("d3262-coherent-semantic-provider-gap");
const graph = load("d3262-coherent-exact-replies");
const frame = load("d3262-coherent-semantic-supplement-frame");

test("only the source-blind missed event path becomes a pair of provider jobs", () => {
  assert.equal(frame.engineJobs.length, 1);
  assert.equal(frame.maiaJobs.length, 1);
  assert.equal(frame.engineJobs[0].fen, frame.maiaJobs[0].fen);
  assert.deepEqual(frame.maiaJobs[0].historyUci, ["f7f5", "c1f4"]);
  assert.equal(frame.maiaJobs[0].rootId, "d1023:32dbd41ca364bdb7");
  const projected = compileSemanticSupplementFrame(gap, graph, frame.inputDigests);
  assert.deepEqual(projected.engineJobs, frame.engineJobs);
  assert.deepEqual(projected.maiaJobs, frame.maiaJobs);
});

test("a missing or crossed exact reply cannot acquire provider identity", () => {
  const changed = structuredClone(gap);
  changed.paths.find((row) => row.needsMaia).replyUci = "a1a1";
  assert.throws(() => compileSemanticSupplementFrame(changed, graph, {}),
    /Missing exact semantic supplement path/);
  const noGap = structuredClone(gap);
  noGap.paths.find((row) => row.needsMaia).needsMaia = false;
  noGap.paths.find((row) => row.needsStockfish).needsStockfish = false;
  assert.throws(() => compileSemanticSupplementFrame(noGap, graph, {}),
    /Semantic event supplement denominator changed/);
});
