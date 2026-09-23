import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileStockfishHistorySupplementFrame } from "./stockfish-history-supplement-frame.mjs";

const directory = "planning/semantic-consequence-search";
const read = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`));
const delta = read("d3262-maia-history-frame-delta");
const oldFrame = read("d3262-horizon4-frontier");
const artifact = read("d3262-stockfish-history-supplement-frame");

test("only path-replay-selected uncaptured FENs become supplement jobs", () => {
  assert.deepEqual({ ...compileStockfishHistorySupplementFrame(delta, oldFrame), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.jobs.length, 19);
  assert.equal(new Set(artifact.jobs.map((job) => job.fen)).size, 19);
});

test("a repeated old FEN or duplicated supplement fails", () => {
  const repeated = structuredClone(delta);
  repeated.uncapturedPositions[0].fen = oldFrame.jobs[0].fen;
  assert.throws(() => compileStockfishHistorySupplementFrame(repeated, oldFrame), /repeats a captured/u);

  const duplicate = structuredClone(delta);
  duplicate.uncapturedPositions[0].fen = duplicate.uncapturedPositions[1].fen;
  assert.throws(() => compileStockfishHistorySupplementFrame(duplicate, oldFrame), /Duplicate history-supplement/u);
});
