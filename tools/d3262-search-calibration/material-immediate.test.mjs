import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileMaterialImmediate, evaluateMaterialImmediate } from "./dist/material-immediate.mjs";

const comparisons = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-target-comparison-frame.json", "utf8"));
const frame = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-root-frame.json", "utf8"));
const source = JSON.parse(readFileSync("tools/d1023-bounded-policy-harness/provider-sample.json", "utf8"));
const replies = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json", "utf8"));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-material-immediate.json", "utf8"));

test("all 64 source material controls agree with independent immediate replay", () => {
  const actual = compileMaterialImmediate(comparisons, frame, source, replies);
  assert.deepEqual({ ...actual, inputDigests: artifact.inputDigests }, artifact);
  assert.equal(actual.rows.length, 98);
  assert.equal(actual.sourceControls, 64);
  assert.equal(actual.rows.filter((row) => !row.sourceObserved).length, 34);
  assert.equal(actual.rows.filter((row) => row.immediate === "identity_lost").length, 0);
});

test("false attacker, illegal move and crossed source outcome fail rather than becoming reasons", () => {
  const definition = comparisons.definitions.find((row) => row.family === "material");
  const root = frame.roots.find((row) => row.rootId === definition.rootId);
  const move = root.candidates[0].moveUci;
  assert.throws(() => evaluateMaterialImmediate(root.fen, move, { ...definition.target, attacker: { ...definition.target.attacker, role: "king" } }), /Declared material identities absent/u);
  assert.throws(() => evaluateMaterialImmediate(root.fen, "a1a8", definition.target), /Illegal candidate/u);
  const crossed = structuredClone(source);
  const sampleRow = crossed.populations.flatMap((population) => population.rows).find((row) => row.targetFamily === "material");
  sampleRow.exact.immediate = sampleRow.exact.immediate === "removed" ? "preserved" : "removed";
  assert.throws(() => compileMaterialImmediate(comparisons, frame, crossed, replies), /source control disagrees/u);
  const crossedReplies = structuredClone(replies);
  crossedReplies.roots.find((row) => row.rootId === definition.rootId).candidates.find((row) => row.candidateUci === move).afterFen = root.fen;
  assert.throws(() => compileMaterialImmediate(comparisons, frame, source, crossedReplies), /Exact reply graph disagrees/u);
});

test("preserved means a legal positive capture by the declared attacker, not any geometric attack", () => {
  for (const row of artifact.rows) {
    assert.equal(row.immediate === "preserved", row.positiveCaptureUci !== null);
    assert.equal(row.cause === "preserved", row.positiveCaptureUci !== null);
  }
  assert.ok(artifact.rows.some((row) => row.cause === "exchange_neutralized"));
  assert.ok(artifact.rows.some((row) => row.cause === "capture_illegal"));
});

test("tracked victim promotion and castling rook relocation do not become identity loss", () => {
  const promotion = evaluateMaterialImmediate(
    "4k1rn/6P1/8/8/8/8/8/K7 w - - 0 1",
    "g7h8q",
    { attacker: { color: "black", role: "rook", square: "g8" }, target: { color: "white", role: "pawn", square: "g7" }, baselineMoveUci: "g8g7" },
  );
  assert.equal(promotion.cause, "preserved");
  assert.equal(promotion.positiveCaptureUci, "g8h8");
  const castle = evaluateMaterialImmediate(
    "4k2r/8/8/8/8/8/8/4K2R w K - 0 1",
    "e1g1",
    { attacker: { color: "white", role: "rook", square: "h1" }, target: { color: "black", role: "rook", square: "h8" }, baselineMoveUci: "h1h8" },
  );
  assert.notEqual(castle.immediate, "identity_lost");
});
