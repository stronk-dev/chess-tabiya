import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateMaiaCoherentNewChild } from "./maia-coherent-new-child-check.mjs";

const directory = "planning/semantic-consequence-search/";
const names = ["d3262-coherent-exact-replies.json", "d3262-exact-replies.json", "d3262-maia-direct-logits.json", "d3262-maia-history-replay.json"];
const inputBytes = names.map((name) => readFileSync(`${directory}${name}`));
const inputs = inputBytes.map((bytes) => JSON.parse(bytes));
const capture = JSON.parse(readFileSync(`${directory}d3262-maia-coherent-new-child.json`));
const copy = () => structuredClone(capture);

test("all three root-replayed Maia policies retain their full legal denominator", () => {
  assert.deepEqual(validateMaiaCoherentNewChild(capture, inputs, inputBytes), { positions: 3, legalMoves: 55, configuredSupport: 6 });
});

test("crossed history, absent legal move, forged mass and source drift fail", () => {
  const history = copy(); history.rows[0].historyUci = [];
  assert.throws(() => validateMaiaCoherentNewChild(history, inputs, inputBytes), /Crossed new-child Maia path/);
  const legal = copy(); legal.rows[1].rawFullLegal.pop();
  assert.throws(() => validateMaiaCoherentNewChild(legal, inputs, inputBytes), /Incomplete raw new-child Maia/);
  const mass = copy(); mass.rows[2].configuredSupport[0].mass = 0.5;
  assert.throws(() => validateMaiaCoherentNewChild(mass, inputs, inputBytes), /Incomplete configured new-child Maia/);
  const source = copy(); source.source.modelCheckpointSha256 = "sha256:" + "a".repeat(64);
  assert.throws(() => validateMaiaCoherentNewChild(source, inputs, inputBytes), /model\/history source changed/);
});
