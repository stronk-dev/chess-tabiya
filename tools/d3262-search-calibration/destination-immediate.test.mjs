import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileDestinationImmediate, evaluateDestinationImmediate, verifySourcePawn } from "./dist/destination-immediate.mjs";

const comparisons = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-target-comparison-frame.json", "utf8"));
const frame = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-root-frame.json", "utf8"));
const source = JSON.parse(readFileSync("tools/d1023-bounded-policy-harness/provider-sample.json", "utf8"));
const replies = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-exact-replies.json", "utf8"));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-destination-immediate.json", "utf8"));

test("all 32 source destination outcomes and their exact moved-pawn causes are replayed", () => {
  const actual = compileDestinationImmediate(comparisons, frame, source, replies);
  assert.deepEqual({ ...actual, inputDigests: artifact.inputDigests }, artifact);
  assert.equal(actual.rows.length, 87);
  assert.equal(actual.sourceControls, 32);
  assert.equal(actual.sourcePawnControls, 32);
  assert.equal(actual.rows.filter((row) => !row.sourceObserved).length, 55);
  assert.equal(actual.rows.filter((row) => row.cause === "minor_move_losing").length, 32);
  assert.equal(actual.rows.filter((row) => row.cause === "available").length, 54);
});

test("false minor identity, crossed source pawn and crossed exact FEN fail", () => {
  const definition = comparisons.definitions.find((row) => row.family === "destination");
  const root = frame.roots.find((row) => row.rootId === definition.rootId);
  const move = definition.sources[0].candidateUci;
  assert.throws(() => evaluateDestinationImmediate(root.fen, move, { ...definition.target, minor: { ...definition.target.minor, role: "queen" } }), /Declared minor absent/u);
  assert.throws(() => verifySourcePawn(root.fen, move, { ...definition.target, controllingPawn: { ...definition.target.controllingPawn, square: "a1" } }), /not the declared controlling pawn/u);
  const wrongSource = structuredClone(source);
  const sourceRow = wrongSource.populations.flatMap((population) => population.rows).find((row) => row.targetFamily === "destination");
  sourceRow.target.controllingPawn.square = "a1";
  assert.throws(() => compileDestinationImmediate(comparisons, frame, wrongSource, replies), /source control disagrees/u);
  const wrongReplies = structuredClone(replies);
  wrongReplies.roots.find((row) => row.rootId === definition.rootId).candidates.find((row) => row.candidateUci === move).afterFen = root.fen;
  assert.throws(() => compileDestinationImmediate(comparisons, frame, source, wrongReplies), /Exact reply graph disagrees/u);
});

test("a safe minor destination is not called pawn prevention", () => {
  for (const row of artifact.rows) {
    assert.equal(row.cause === "available", row.immediate === "preserved");
    assert.equal(row.cause === "minor_move_losing", row.positiveReplyUci !== null);
    if (!row.sourceObserved) assert.notEqual(row.cause, "minor_move_losing");
  }
});
