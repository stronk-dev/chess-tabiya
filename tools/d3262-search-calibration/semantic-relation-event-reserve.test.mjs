import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileRelationEventReserve } from "./semantic-relation-event-reserve.mjs";

const read = (name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}.json`, "utf8"));
const events = read("d3262-semantic-relation-event-first-layer");
const capture = read("d3262-stockfish-child-capture");
const material = read("d3262-material-immediate");
const witness = read("d3262-destination-reply-witness");
const artifact = read("d3262-semantic-relation-event-reserve");
const key = (row) => `${row.rootId}|${row.targetId}|${row.candidateUci}`;

test("typed event reservation recomputes all first-layer provider frontiers", () => {
  assert.deepEqual({ ...compileRelationEventReserve(events, capture, material, witness), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 185 * 3 * 3);
  for (const budget of artifact.budgets) for (const width of artifact.widths) {
    const rows = artifact.rows.filter((row) => row.budget === budget && row.width === width);
    assert.equal(rows.length, 185);
    assert.equal(rows.filter((row) => row.namedReplyUci !== null).length, 139);
    assert.equal(rows.filter((row) => row.namedInSelected).length, 139);
    assert.equal(rows.filter((row) => row.namedInBaseline && !row.namedInSelected).length, 0);
    assert.equal(rows.filter((row) => row.status === "event_reserved").length, 153);
  }
});

test("held-out outcome mutation changes evaluation, never selected reply", () => {
  const changed = structuredClone(witness);
  const first = changed.rows.find((row) => row.arrivalUci !== null);
  assert.ok(first);
  const child = capture.rows.find((row) => row.rootId === first.rootId && row.candidateUci === first.candidateUci);
  assert.ok(child);
  first.arrivalUci = child.probes[0].legal.find((uci) => uci !== first.arrivalUci);
  const rerun = compileRelationEventReserve(events, capture, material, changed);
  assert.deepEqual(rerun.rows.map((row) => row.selected), artifact.rows.map((row) => row.selected));
  assert.notDeepEqual(rerun.rows.map((row) => row.namedReplyUci), artifact.rows.map((row) => row.namedReplyUci));
});

test("all source pawn-denial arrivals are scheduled, but fourteen material events remain negative", () => {
  const controls = new Set(witness.rows.filter((row) => row.status === "named_pawn_punishment_witness").map(key));
  assert.equal(controls.size, 32);
  const negative = new Set(material.rows.filter((row) => row.cause === "exchange_neutralized" && events.rows.find((event) => key(event) === key(row))?.eventReplies.length).map(key));
  assert.equal(negative.size, 14);
  for (const budget of artifact.budgets) for (const width of artifact.widths) {
    const rows = artifact.rows.filter((row) => row.budget === budget && row.width === width);
    assert.equal(rows.filter((row) => controls.has(key(row)) && row.namedInSelected).length, 32);
    assert.equal(rows.filter((row) => negative.has(key(row)) && row.status === "event_reserved" && row.namedReplyUci === null).length, 14);
  }
});

test("a fabricated event outside the legal set is rejected", () => {
  const forged = structuredClone(events);
  forged.rows.find((row) => row.status === "event_available").eventReplies[0].uci = "a1a1";
  assert.throws(() => compileRelationEventReserve(forged, capture, material, witness), /crossed the legal reply set/u);
});
