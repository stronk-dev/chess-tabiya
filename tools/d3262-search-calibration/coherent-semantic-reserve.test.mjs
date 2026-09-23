import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentSemanticReserve } from "./coherent-semantic-reserve.mjs";

const directory = "planning/semantic-consequence-search/";
function read(name) { return JSON.parse(readFileSync(`${directory}${name}.json`)); }
const events = read("d3262-coherent-relation-event-first-layer");
const oldTop = read("d3262-stockfish-child-coherent");
const oldAll = read("d3262-stockfish-child-coherent-all");
const newTop = read("d3262-stockfish-new-child-coherent");
const newAll = read("d3262-stockfish-new-child-coherent-all");
const artifact = read("d3262-coherent-semantic-reserve");

test("one-slot relation reserve keeps the corrected 182-by-budget/width comparison grid", () => {
  assert.deepEqual(artifact, compileCoherentSemanticReserve(events, oldTop, oldAll, newTop, newAll, artifact.inputDigests));
  assert.equal(artifact.rows.length, 182 * 3 * 3 * 2);
  for (const row of artifact.rows) {
    assert.equal(row.baseline.length, row.selected.length);
    assert.equal(new Set(row.selected).size, row.selected.length);
    assert.ok(row.selected.filter((uci) => !row.baseline.includes(uci)).length <= 1);
    if (row.eventSourceWidth === "top8") assert.ok(row.reservedRank === null || row.reservedRank <= 8);
  }
  assert.ok(artifact.rows.some((row) => row.eventSourceWidth === "all_legal" && row.reservedRank > 8));
});

test("illegal declared event and crossed coherent width are refused", () => {
  const eventIndex = events.rows.findIndex((row) => row.eventReplies.length > 0);
  const forged = { ...events, rows: [...events.rows] };
  forged.rows[eventIndex] = { ...forged.rows[eventIndex], eventReplies: [{ uci: "a1a1", kind: "named_minor_arrives_on_square" }] };
  assert.throws(() => compileCoherentSemanticReserve(forged, oldTop, oldAll, newTop, newAll, {}), /Event absent from exact legal replies/u);
  const wrongWidth = { ...newTop, source: { ...newTop.source, multiPv: "all_legal_moves_at_candidate_child" } };
  assert.throws(() => compileCoherentSemanticReserve(events, oldTop, oldAll, wrongWidth, newAll, {}), /Crossed coherent child ranking sources/u);
});
