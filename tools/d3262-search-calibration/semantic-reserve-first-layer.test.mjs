import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileSemanticReserveFirstLayer, selectOperandReserve } from "./semantic-reserve-first-layer.mjs";

const read = (name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}.json`, "utf8"));
const touch = read("d3262-semantic-touch-first-layer");
const capture = read("d3262-stockfish-child-capture");
const material = read("d3262-material-immediate");
const witness = read("d3262-destination-reply-witness");
const artifact = read("d3262-semantic-reserve-first-layer");
const key = (row) => `${row.rootId}|${row.targetId}|${row.candidateUci}`;

test("one-slot reserve recomputes every frozen comparison without changing the source frame", () => {
  assert.deepEqual({ ...compileSemanticReserveFirstLayer(touch, capture, material, witness), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 185 * 3 * 3);
  for (const budget of artifact.budgets) for (const width of artifact.widths) {
    const rows = artifact.rows.filter((row) => row.budget === budget && row.width === width);
    assert.equal(rows.length, 185);
    assert.equal(rows.filter((row) => row.namedReplyUci !== null).length, 139);
    assert.equal(rows.filter((row) => row.namedInBaseline && !row.namedInSelected).length, 0);
    assert.ok(rows.some((row) => row.namedInSelected && !row.namedInBaseline));
    assert.ok(rows.some((row) => row.reservedRank > width));
  }
});

test("named outcomes are evaluation-only: changing a legal name cannot change selected frontier", () => {
  const changed = structuredClone(material);
  const first = changed.rows.find((row) => row.positiveCaptureUci !== null);
  assert.ok(first);
  const child = capture.rows.find((row) => row.rootId === first.rootId && row.candidateUci === first.candidateUci);
  assert.ok(child);
  first.positiveCaptureUci = child.probes[0].legal.find((uci) => uci !== first.positiveCaptureUci);
  const rerun = compileSemanticReserveFirstLayer(touch, capture, changed, witness);
  assert.deepEqual(rerun.rows.map((row) => row.selected), artifact.rows.map((row) => row.selected));
  assert.deepEqual(rerun.rows.map((row) => row.reservedUci), artifact.rows.map((row) => row.reservedUci));
  assert.notDeepEqual(rerun.rows.map((row) => row.namedReplyUci), artifact.rows.map((row) => row.namedReplyUci));
});

test("all-touched synthetic input is the engine baseline, not a guaranteed semantic hit", () => {
  const probe = capture.rows[0].probes[0];
  const allTouched = { status: "measured", touchReplies: probe.legal.map((uci) => ({ uci, reasons: ["synthetic"] })) };
  for (const width of [2, 4, 8]) {
    const selected = selectOperandReserve(allTouched, probe, width);
    assert.deepEqual(selected.selected, selected.baseline);
    assert.equal(selected.reservedRank, 1);
    assert.ok(probe.legal.some((uci) => !selected.selected.includes(uci)));
  }
  assert.throws(() => selectOperandReserve({ status: "measured", touchReplies: [{ uci: "a1a1" }] }, probe, 2), /crossed the legal reply set/u);
});

test("source pawn-denial controls remain almost wholly missed, rather than being called rescued", () => {
  const controls = new Set(witness.rows.filter((row) => row.status === "named_pawn_punishment_witness").map(key));
  assert.equal(controls.size, 32);
  for (const budget of artifact.budgets) for (const width of artifact.widths) {
    const rows = artifact.rows.filter((row) => row.budget === budget && row.width === width && controls.has(key(row)));
    assert.equal(rows.length, 32);
    assert.equal(rows.filter((row) => row.namedInBaseline).length, 0);
    assert.equal(rows.filter((row) => row.namedInSelected).length, budget === "depth8" ? 1 : 0);
  }
});
