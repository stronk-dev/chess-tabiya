import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateCoherentDeeperMaia } from "./maia-coherent-deeper-check.mjs";

const directory = "planning/semantic-consequence-search/";
function read(name) { return readFileSync(`${directory}${name}.json`); }
const frameBytes = read("d3262-coherent-deeper-supplement-frame");
const directBytes = read("d3262-maia-direct-logits");
const childBytes = read("d3262-maia-history-replay");
const capture = JSON.parse(read("d3262-maia-coherent-deeper-supplement"));
const verify = (value) => validateCoherentDeeperMaia(JSON.parse(frameBytes), frameBytes,
  JSON.parse(directBytes), directBytes, JSON.parse(childBytes), childBytes, value);

test("every corrected Maia path keeps its exact ordered history and full legal policy", () => {
  const result = verify(capture);
  assert.equal(result.positions, 250);
  assert.ok(result.legalMoves > 0 && result.configuredSupport > 0);
});

test("crossed path, missing legal move and fabricated configured mass are refused", () => {
  const index = capture.rows.findIndex((row) => !row.terminal && row.configuredSupport.length > 0);
  assert.ok(index >= 0);
  const first = capture.rows[index];
  const replace = (row) => ({ ...capture, rows: [...capture.rows.slice(0, index), row, ...capture.rows.slice(index + 1)] });
  assert.throws(() => verify(replace({ ...first, historyUci: [] })), /Crossed Maia path row/u);
  assert.throws(() => verify(replace({ ...first, legalUcis: first.legalUcis.slice(1) })), /Maia legal denominator mismatch/u);
  const support = [{ ...first.configuredSupport[0], mass: 2 }, ...first.configuredSupport.slice(1)];
  assert.throws(() => verify(replace({ ...first, configuredSupport: support })), /Invalid configured Maia path/u);
});
