import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentDeeperSourceUnion } from "./coherent-deeper-source-union.mjs";

const directory = "planning/semantic-consequence-search/";
function read(name) { return JSON.parse(readFileSync(`${directory}${name}.json`)); }
const frontier = read("d3262-coherent-first-reply-frontier");
const supplement = read("d3262-coherent-deeper-supplement-frame");
const oldEngine = read("d3262-stockfish-horizon4-capture");
const newEngine = read("d3262-stockfish-coherent-deeper-supplement");
const oldMaia = read("d3262-maia-horizon4-path-capture");
const newMaia = read("d3262-maia-coherent-deeper-supplement");
const artifact = read("d3262-coherent-deeper-source-union");
const verify = (...sources) => compileCoherentDeeperSourceUnion(frontier, supplement, ...sources, artifact.inputDigests);

test("every corrected selected path has a concrete engine FEN and exact Maia history source", () => {
  assert.deepEqual(artifact, verify(oldEngine, newEngine, oldMaia, newMaia));
  assert.deepEqual(artifact.summary, { selectedPaths: 1966, uniqueFens: 1965,
    stockfishOldPaths: 1699, stockfishNewPaths: 267, maiaOldPaths: 1716, maiaNewPaths: 250 });
  const byFen = new Map();
  for (const row of artifact.bindings) byFen.set(row.fen, [...(byFen.get(row.fen) ?? []), row]);
  const transposition = [...byFen.values()].find((rows) => rows.length === 2);
  assert.ok(transposition);
  assert.notEqual(transposition[0].id, transposition[1].id);
});

test("one absent new Maia path or one crossed FEN refuses complete source coverage", () => {
  const missing = { ...newMaia, rows: newMaia.rows.slice(1) };
  assert.throws(() => verify(oldEngine, newEngine, oldMaia, missing), /Crossed deeper provider captures/u);
  const first = newMaia.rows[0];
  const crossed = { ...newMaia, rows: [{ ...first, fen: "crossed" }, ...newMaia.rows.slice(1)] };
  assert.throws(() => verify(oldEngine, newEngine, oldMaia, crossed), /Selected reply missing exact provider source/u);
});
