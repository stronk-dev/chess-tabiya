import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileMaiaHistoryFrameDelta } from "./maia-history-frame-delta.mjs";

const directory = "planning/semantic-consequence-search";
const bytes = (name) => readFileSync(`${directory}/${name}.json`);
const graphBytes = bytes("d3262-exact-replies"), directBytes = bytes("d3262-maia-direct-logits");
const graph = JSON.parse(graphBytes), direct = JSON.parse(directBytes);
const replay = JSON.parse(bytes("d3262-maia-history-replay"));
const frame = JSON.parse(bytes("d3262-horizon4-frontier"));
const artifact = JSON.parse(bytes("d3262-maia-history-frame-delta"));
const compile = (changed = {}) => compileMaiaHistoryFrameDelta(changed.graph ?? graph, graphBytes, changed.direct ?? direct, directBytes, changed.replay ?? replay, changed.frame ?? frame);

test("path-corrected Maia selection requires nineteen extra Stockfish positions without relabelling the frozen frame", () => {
  assert.deepEqual({ ...compile(), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.oldPaths, 2186);
  assert.equal(artifact.revisedPaths, 2189);
  assert.equal(artifact.addedPaths.length, 19);
  assert.equal(artifact.removedPaths.length, 16);
  assert.equal(artifact.uncapturedPositions.length, 19);
  const oldFens = new Set(frame.jobs.map((job) => job.fen));
  assert.ok(artifact.uncapturedPositions.every((row) => !oldFens.has(row.fen) && row.paths.length >= 1));
});

test("a crossed history, deleted old arm tag or FEN job fails before reporting a capture delta", () => {
  const history = structuredClone(replay);
  history.rows[0].historyUci = [];
  assert.throws(() => compile({ replay: history }), /path mismatch/u);

  const tag = structuredClone(frame);
  const first = tag.paths.find((row) => row.selectedBy.includes("maia:0.80"));
  first.selectedBy = first.selectedBy.filter((value) => value !== "maia:0.80");
  assert.throws(() => compile({ frame: tag }), /tags disagree/u);

  const fen = structuredClone(frame);
  fen.jobs[0].fen = fen.jobs[1].fen;
  assert.throws(() => compile({ frame: fen }), /FEN jobs do not match/u);
});
