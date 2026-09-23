import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { validateSemanticSources } from "./coherent-semantic-source-check.mjs";

const directory = "planning/semantic-consequence-search";
const bytes = (name) => readFileSync(`${directory}/${name}.json`);
const json = (name) => JSON.parse(bytes(name));
const frameBytes = bytes("d3262-coherent-semantic-supplement-frame");
const directBytes = bytes("d3262-maia-direct-logits");
const childBytes = bytes("d3262-maia-history-replay");
const frame = JSON.parse(frameBytes);
const stockfish = json("d3262-stockfish-coherent-semantic-supplement");
const stockfishReference = json("d3262-stockfish-child-capture");
const maia = json("d3262-maia-coherent-semantic-supplement");
const direct = JSON.parse(directBytes);
const child = JSON.parse(childBytes);
const validate = (engine = stockfish, human = maia, jobs = frame) =>
  validateSemanticSources(jobs, frameBytes, engine, stockfishReference, human,
    direct, directBytes, child, childBytes);

test("both missing provider readings bind the same exact semantic path", () => {
  const result = validate();
  assert.equal(result.stockfish.positions, 1);
  assert.equal(result.maia.positions, 1);
  assert.equal(result.maia.legalMoves, 21);
  assert.equal(result.maia.configuredSupport, 4);
});

test("crossed FEN, omitted legal move and wrong Maia path fail before selection", () => {
  const wrongEngine = structuredClone(stockfish);
  wrongEngine.rows[0].fen = "8/8/8/8/8/8/8/8 w - - 0 1";
  assert.throws(() => validate(wrongEngine), /Crossed captured position/);
  const lostMove = structuredClone(stockfish);
  lostMove.rows[0].probes[0].legal.pop();
  assert.throws(() => validate(lostMove), /Incomplete legal denominator/);
  const wrongHuman = structuredClone(maia);
  wrongHuman.rows[0].historyUci = ["f7f5", "a1a1"];
  assert.throws(() => validate(stockfish, wrongHuman), /Crossed Maia path row/);
});
