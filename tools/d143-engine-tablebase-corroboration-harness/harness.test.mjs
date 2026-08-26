import assert from "node:assert/strict";
import test from "node:test";

import { summarize } from "./harness.mjs";

const row = (category, type, value, fen = "8/8/8/8/8/8/8/K6k w - - 0 1") => ({
  fen,
  packIds: ["fixture"],
  supports: ["/start/fen"],
  tablebase: { category, dtz: 0, dtm: 0, checkmate: false, stalemate: false, insufficientMaterial: false, pieceCount: 2 },
  engine: { type, value, depth: 22, bestmove: null },
});

test("keeps mate typed and computes side-to-move directional agreement", () => {
  const result = summarize([
    row("win", "mate", 3),
    row("loss", "mate", -2, "8/8/8/8/8/8/8/K6k b - - 1 1"),
    row("draw", "cp", 0),
  ]);
  assert.deepEqual(result.overall.typed, { cp: 1, mate: 2 });
  assert.deepEqual(result.overall.directionalAgreement, { matches: 2, eligible: 2, percent: 100 });
  assert.equal(result.thresholds[0].eligible, true);
});

test("treats Stockfish terminal mate zero as a typed loss, never cp", () => {
  const result = summarize([
    row("loss", "mate", 0),
    row("draw", "cp", 0),
  ]);
  assert.deepEqual(result.overall.typed, { cp: 1, mate: 1 });
  assert.equal(result.thresholds[0].decisiveCorrect.percent, 100);
  assert.deepEqual(result.counterexamples.mateDisagreements, []);
});

test("fails the preregistered normalization rule when decisive values fall inside a deadband", () => {
  const rows = [];
  for (let index = 0; index < 20; index += 1) rows.push(row("draw", "cp", index % 2 ? 10 : -10));
  for (let index = 0; index < 20; index += 1) rows.push(row("win", "cp", 10));
  for (let index = 0; index < 20; index += 1) rows.push(row("loss", "cp", -10));
  const result = summarize(rows);
  const deadband25 = result.thresholds.find((entry) => entry.deadband === 25);
  assert.equal(deadband25.drawCorrect.percent, 100);
  assert.equal(deadband25.decisiveCorrect.percent, 0);
  assert.equal(deadband25.eligible, false);
});
