import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentFirstReplyFrontier } from "./coherent-first-reply-frontier.mjs";

const directory = "planning/semantic-consequence-search/";
function read(name) { return JSON.parse(readFileSync(`${directory}${name}.json`)); }
const graph = read("d3262-coherent-exact-replies");
const oldEngine = read("d3262-stockfish-child-coherent");
const newEngine = read("d3262-stockfish-new-child-coherent");
const oldMaia = read("d3262-maia-history-replay");
const newMaia = read("d3262-maia-coherent-new-child");
const artifact = read("d3262-coherent-first-reply-frontier");
const inputs = [graph, oldEngine, newEngine, oldMaia, newMaia];

test("corrected frontier binds 190 retained plus three new children at the same Maia path-history policy", () => {
  assert.deepEqual(artifact, compileCoherentFirstReplyFrontier(...inputs, artifact.inputDigests));
  assert.equal(artifact.rows.length, 193);
  assert.equal(artifact.rows.filter((row) => row.providerPartition === "retained190").length, 190);
  assert.equal(artifact.rows.filter((row) => row.providerPartition === "new3").length, 3);
  assert.equal(artifact.rows.reduce((sum, row) => sum + row.legalReplyCount, 0), 6176);
  for (const row of artifact.rows) {
    const candidate = graph.roots.find((root) => root.rootId === row.rootId).candidates.find((entry) => entry.candidateUci === row.candidateUci);
    for (const reply of row.replies) {
      assert.equal(reply.fen, candidate.replies.find((entry) => entry.uci === reply.uci)?.fen);
      assert.ok(reply.selectedBy.length > 0);
    }
  }
});

test("crossed Maia history, missing retained source and illegal engine reply fail", () => {
  const crossedHistory = { ...newMaia, source: { ...newMaia.source, historyUci: "empty" } };
  assert.throws(() => compileCoherentFirstReplyFrontier(graph, oldEngine, newEngine, oldMaia, crossedHistory, {}), /Maia path-history/u);
  const missing = { ...oldEngine, rows: oldEngine.rows.filter((row) => !(row.rootId === graph.roots[0].rootId && row.candidateUci === graph.roots[0].candidates[0].candidateUci)) };
  assert.throws(() => compileCoherentFirstReplyFrontier(graph, missing, newEngine, oldMaia, newMaia, {}), /Stockfish sources|retained corrected path/u);
  const forgedRow = structuredClone(newEngine.rows[0]);
  forgedRow.probes[0].entries[0].moveUci = "a1a1";
  const illegal = { ...newEngine, rows: [forgedRow, ...newEngine.rows.slice(1)] };
  assert.throws(() => compileCoherentFirstReplyFrontier(graph, oldEngine, illegal, oldMaia, newMaia, {}), /Engine ranked reply mismatch/u);
});
