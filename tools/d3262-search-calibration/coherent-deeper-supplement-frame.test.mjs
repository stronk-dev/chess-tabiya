import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentDeeperSupplementFrame } from "./coherent-deeper-supplement-frame.mjs";

const directory = "planning/semantic-consequence-search/";
function read(name) { return JSON.parse(readFileSync(`${directory}${name}.json`)); }
const graph = read("d3262-coherent-exact-replies");
const frontier = read("d3262-coherent-first-reply-frontier");
const engine = read("d3262-stockfish-horizon4-capture");
const maia = read("d3262-maia-horizon4-path-capture");
const artifact = read("d3262-coherent-deeper-supplement-frame");

test("corrected frontier identifies missing Stockfish positions and distinct Maia histories", () => {
  assert.deepEqual(artifact, compileCoherentDeeperSupplementFrame(graph, frontier, engine, maia, artifact.inputDigests));
  assert.deepEqual(artifact.summary, { selectedPaths: 1966, maiaCovered: 1716,
    maiaMissing: 250, engineMissingPositions: 267 });
  assert.equal(new Set(artifact.engineJobs.map((job) => job.fen)).size, 267);
  assert.equal(new Set(artifact.maiaJobs.map((job) => JSON.stringify([job.rootId, job.candidateUci, job.replyUci]))).size, 250);
  for (const row of artifact.maiaJobs) assert.deepEqual(row.historyUci, [row.candidateUci, row.replyUci]);
});

test("a crossed prior Maia history or duplicate Stockfish position is refused", () => {
  const maiaRows = [...maia.rows];
  const first = maiaRows.findIndex((row) => frontier.rows.some((candidate) => candidate.rootId === row.rootId
    && candidate.candidateUci === row.candidateUci && candidate.replies.some((reply) => reply.uci === row.replyUci)));
  assert.ok(first >= 0);
  maiaRows[first] = { ...maiaRows[first], historyUci: ["a1a1", maiaRows[first].replyUci] };
  assert.throws(() => compileCoherentDeeperSupplementFrame(graph, frontier, engine, { ...maia, rows: maiaRows }, {}), /Prior Maia path crossed/u);
  const engineRows = [...engine.rows];
  engineRows[0] = { ...engineRows[0], fen: engineRows[1].fen };
  assert.throws(() => compileCoherentDeeperSupplementFrame(graph, frontier, { ...engine, rows: engineRows }, maia, {}), /Duplicated prior deeper provider identity/u);
});
