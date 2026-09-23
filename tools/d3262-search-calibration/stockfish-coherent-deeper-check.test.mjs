import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateCoherentDeeperStockfish } from "./stockfish-coherent-deeper-check.mjs";

const directory = "planning/semantic-consequence-search/";
function read(name) { return readFileSync(`${directory}${name}.json`); }
const frameBytes = read("d3262-coherent-deeper-supplement-frame");
const frame = JSON.parse(frameBytes);
const capture = JSON.parse(read("d3262-stockfish-coherent-deeper-supplement"));
const reference = JSON.parse(read("d3262-stockfish-child-capture"));
const verify = (value) => validateCoherentDeeperStockfish(frame, frameBytes, value, reference);

test("all corrected Stockfish FEN jobs have a coherent top-eight table at each budget", () => {
  const result = verify(capture);
  assert.equal(result.positions, 267);
  assert.ok(result.legalMoves > 0 && result.rankedMoves > 0);
  assert.equal(capture.partial, false);
});

test("crossed frame, erased legal reply and mixed rank depth are refused", () => {
  assert.throws(() => verify({ ...capture, frontierDigest: "sha256:wrong" }), /Crossed frontier capture/u);
  const row = capture.rows[0];
  const legalProbe = { ...row.probes[0], legal: row.probes[0].legal.slice(1) };
  assert.throws(() => verify({ ...capture, rows: [{ ...row, probes: [legalProbe, ...row.probes.slice(1)] }, ...capture.rows.slice(1)] }), /Incomplete legal denominator/u);
  const entry = { ...row.probes[0].entries[0], depth: row.probes[0].entries[0].depth + 1 };
  const mixedProbe = { ...row.probes[0], entries: [entry, ...row.probes[0].entries.slice(1)] };
  assert.throws(() => verify({ ...capture, rows: [{ ...row, probes: [mixedProbe, ...row.probes.slice(1)] }, ...capture.rows.slice(1)] }), /Mixed Stockfish rank table/u);
});
