import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileMaiaHorizon4PathFrame } from "./maia-horizon4-path-frame.mjs";

const directory = "planning/semantic-consequence-search";
const read = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`));
const graph = read("d3262-exact-replies"), oldFrame = read("d3262-horizon4-frontier"), delta = read("d3262-maia-history-frame-delta");
const artifact = read("d3262-maia-horizon4-path-frame");

test("all corrected frontier paths retain their ordered root history despite a shared FEN", () => {
  assert.deepEqual({ ...compileMaiaHorizon4PathFrame(graph, oldFrame, delta), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.jobs.length, 2189);
  assert.equal(new Set(artifact.jobs.map((job) => job.fen)).size, 2188);
  assert.ok(artifact.jobs.every((job) => job.historyUci[0] === job.candidateUci && job.historyUci[1] === job.replyUci));
  const shared = artifact.jobs.filter((job, _, rows) => rows.some((other) => other !== job && other.fen === job.fen));
  assert.equal(shared.length, 2);
  assert.notDeepEqual(shared[0].historyUci, shared[1].historyUci);
});

test("a forged removal, duplicate addition or crossed exact reply fails", () => {
  const removed = structuredClone(delta);
  removed.removedPaths[0].replyUci = "a1a1";
  assert.throws(() => compileMaiaHorizon4PathFrame(graph, oldFrame, removed), /Removed path not in frozen/u);

  const duplicate = structuredClone(delta);
  duplicate.addedPaths[0] = duplicate.addedPaths[1];
  assert.throws(() => compileMaiaHorizon4PathFrame(graph, oldFrame, duplicate), /Duplicated corrected Maia path/u);

  const crossed = structuredClone(delta);
  crossed.addedPaths[0].fen = oldFrame.paths[0].fen;
  assert.throws(() => compileMaiaHorizon4PathFrame(graph, oldFrame, crossed), /does not replay exact legal path/u);
});
