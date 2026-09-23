import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateMaiaCapture } from "./maia-capture-check.mjs";

const maia = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-maia-capture.json", import.meta.url), "utf8"));
const stockfish = JSON.parse(readFileSync(new URL("../../planning/semantic-consequence-search/d3262-stockfish-capture.json", import.meta.url), "utf8"));
function changed(update) { const copy = structuredClone(maia); update(copy); return copy; }

test("complete Maia capture joins the frozen legal-root population", () => {
  const report = validateMaiaCapture(maia, stockfish);
  assert.equal(report.roots, 66);
  assert.ok(report.unobservedMoves > 0);
});
test("a crossed root fails", () => {
  assert.throws(() => validateMaiaCapture(changed((copy) => { copy.rows[0].fen = copy.rows[1].fen; }), stockfish), /identity or order/u);
});
test("an illegal candidate fails even when its mass is plausible", () => {
  assert.throws(() => validateMaiaCapture(changed((copy) => { copy.rows[0].candidates[0].moveUci = "a1a8"; }), stockfish), /illegal or repeated/u);
});
test("duplicate rank and invented mass fail", () => {
  assert.throws(() => validateMaiaCapture(changed((copy) => { copy.rows[0].candidates[1].rank = 1; }), stockfish), /noncontiguous/u);
  assert.throws(() => validateMaiaCapture(changed((copy) => { copy.rows[0].candidates[0].mass = 1.1; }), stockfish), /invalid policy mass/u);
});
test("a source substitution fails", () => {
  assert.throws(() => validateMaiaCapture(changed((copy) => { copy.rows[0].engine.modelId = "other"; }), stockfish), /wrong Maia source/u);
});
