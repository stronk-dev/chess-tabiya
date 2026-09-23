import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentExactReplies } from "./coherent-exact-replies.mjs";

const directory = "planning/semantic-consequence-search/";
const frameBytes = readFileSync(`${directory}d3262-coherent-root-frame.json`);
const frame = JSON.parse(frameBytes);
const oldGraph = JSON.parse(readFileSync(`${directory}d3262-exact-replies.json`));

test("corrected legal graph reuses 190 exact candidates and enumerates only three new ones", () => {
  const graph = compileCoherentExactReplies(frame, frameBytes, oldGraph);
  assert.deepEqual(graph.comparison, { reused: 190, added: 3, dropped: 6 });
  assert.equal(graph.roots.length, 66);
  assert.equal(graph.roots.reduce((sum, root) => sum + root.candidates.length, 0), 193);
});

test("retained edge drift and crossed root fail instead of acquiring a new source", () => {
  const changed = structuredClone(oldGraph);
  changed.roots[0].candidates[0].replies[0].fen = "not-the-same";
  assert.throws(() => compileCoherentExactReplies(frame, frameBytes, changed), /Retained reply edge changed/);
  const crossed = structuredClone(frame); crossed.roots[0].rootId = "other";
  assert.throws(() => compileCoherentExactReplies(crossed, frameBytes, oldGraph), /Crossed corrected exact root/);
});
