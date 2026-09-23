import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateHistorySupplement } from "./stockfish-history-supplement-check.mjs";

const directory = "planning/semantic-consequence-search";
const bytes = (name) => readFileSync(`${directory}/${name}.json`);
const frameBytes = bytes("d3262-stockfish-history-supplement-frame");
const deltaBytes = bytes("d3262-maia-history-frame-delta");
const oldFrameBytes = bytes("d3262-horizon4-frontier");
const frame = JSON.parse(frameBytes), delta = JSON.parse(deltaBytes), oldFrame = JSON.parse(oldFrameBytes);
const capture = JSON.parse(bytes("d3262-stockfish-history-supplement"));
const reference = JSON.parse(bytes("d3262-stockfish-child-capture"));
const verify = (changed = {}) => validateHistorySupplement(changed.frame ?? frame, frameBytes, changed.delta ?? delta, deltaBytes, oldFrame, oldFrameBytes, changed.capture ?? capture, reference);

test("all nineteen path-selected missing positions have checked coherent Stockfish sources", () => {
  assert.deepEqual(verify(), { positions: 19, legalMoves: 1641, rankedMoves: 435, trailingPartial: 16 });
});

test("crossed frontier, lost legal move and mixed rank-depth table fail", () => {
  const crossed = structuredClone(frame);
  crossed.jobs[0].fen = frame.jobs[1].fen;
  assert.throws(() => verify({ frame: crossed }), /job frame drift/u);

  const omitted = structuredClone(capture);
  omitted.rows[0].probes[0].legal.pop();
  assert.throws(() => verify({ capture: omitted }), /Incomplete legal denominator/u);

  const mixed = structuredClone(capture);
  const probe = mixed.rows.find((row) => row.probes.some((item) => item.entries.length > 1)).probes.find((item) => item.entries.length > 1);
  probe.entries[1].depth += 1;
  assert.throws(() => verify({ capture: mixed }), /Mixed Stockfish rank table/u);

  const foreign = structuredClone(capture);
  foreign.source.executableDigest = "sha256:foreign";
  assert.throws(() => verify({ capture: foreign }), /Crossed Stockfish binary/u);
});
