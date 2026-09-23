import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { compileSemanticSourceUnion } from "./coherent-semantic-source-union.mjs";

const directory = "planning/semantic-consequence-search";
const json = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`, "utf8"));
const gap = json("d3262-coherent-semantic-provider-gap");
const frame = json("d3262-coherent-semantic-supplement-frame");
const engine = json("d3262-stockfish-coherent-semantic-supplement");
const maia = json("d3262-maia-coherent-semantic-supplement");
const digests = { ...frame.inputDigests,
  "d3262-coherent-semantic-supplement-frame.json": engine.frontierDigest };
const compile = (a = gap, b = frame, c = engine, d = maia) =>
  compileSemanticSourceUnion(a, b, c, d, digests);

test("all 152 semantic-event paths have exact Stockfish and path-keyed Maia sources", () => {
  const union = compile();
  assert.equal(union.bindings.length, 152);
  assert.equal(union.bindings.filter((row) => row.stockfish.source.includes("semantic-supplement")).length, 1);
  assert.equal(union.bindings.filter((row) => !row.maia).length, 0);
});

test("missing source, wrong path and crossed FEN cannot close the union", () => {
  const absent = structuredClone(gap);
  absent.paths[0].maia = null;
  assert.throws(() => compile(absent), /binding absent or crossed/);
  const wrongPath = structuredClone(frame);
  wrongPath.maiaJobs[0].replyUci = "a1a1";
  assert.throws(() => compile(gap, wrongPath), /crossed an exact source path/);
  const wrongFen = structuredClone(engine);
  wrongFen.rows[0].fen = "8/8/8/8/8/8/8/8 w - - 0 1";
  assert.throws(() => compile(gap, frame, wrongFen), /crossed an exact source path/);
});
