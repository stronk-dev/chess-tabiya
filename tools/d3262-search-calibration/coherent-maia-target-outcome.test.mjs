import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { observeTargetPath } from "./dist/coherent-bounded-targets.mjs";
import { compileMaiaTargetOutcome, loadTargetOutcomeInputs, summarizeObservedTargets } from "./coherent-maia-target-outcome.mjs";

const directory = "planning/semantic-consequence-search/";
const load = (name) => JSON.parse(readFileSync(directory + name, "utf8"));
const comparison = load("d3262-coherent-target-comparison-frame.json");
const roots = new Map(load("d3262-coherent-root-frame.json").roots.map((root) => [root.rootId, root]));
const definitions = new Map(comparison.definitions.map((definition) => [definition.id, definition]));
const bounded = load("d3262-coherent-bounded-targets.json");

test("all 58 exact reintroduction controls distinguish availability from the actual fourth move", () => {
  const positive = bounded.rows.filter((row) => row.reintroducedWithin3Ply);
  assert.equal(positive.length, 58);
  for (const row of positive) {
    const root = roots.get(row.rootId), definition = definitions.get(row.targetId);
    const three = observeTargetPath(root.fen, row.witness.slice(0, 3), definition);
    assert.equal(three.immediate, "removed");
    assert.equal(three.opportunityAtThirdPly, true);
    assert.equal(three.reintroducedAtThirdPly, true);
    assert.equal(three.executedAtFourthPly, false);
    assert.equal(three.executionWitness, null);
    const four = observeTargetPath(root.fen, row.witness, definition);
    assert.equal(four.executedAtFourthPly, true);
    assert.deepEqual(four.executionWitness, row.witness);
  }
});

test("a different actual fourth move cannot become the unplayed named target capture/arrival", () => {
  const row = bounded.rows.find((entry) => entry.reintroducedWithin3Ply);
  const root = roots.get(row.rootId), definition = definitions.get(row.targetId);
  const board = Chess.fromSetup(parseFen(root.fen).unwrap()).unwrap();
  for (const uci of row.witness.slice(0, 3)) board.play(normalizeMove(board, parseUci(uci)));
  const alternative = [...board.allDests()].flatMap(([from, destinations]) => [...destinations].map((to) => ({ from, to })))
    .find((move) => board.isLegal(move) && `${String.fromCharCode(97 + move.from % 8)}${Math.floor(move.from / 8) + 1}${String.fromCharCode(97 + move.to % 8)}${Math.floor(move.to / 8) + 1}` !== row.witness[3]);
  assert.ok(alternative);
  const square = (value) => `${String.fromCharCode(97 + value % 8)}${Math.floor(value / 8) + 1}`;
  const uci = square(alternative.from) + square(alternative.to);
  const actual = observeTargetPath(root.fen, [...row.witness.slice(0, 3), uci], definition);
  assert.equal(actual.opportunityAtThirdPly, true);
  assert.equal(actual.executedAtFourthPly, false);
  assert.equal(actual.executionWitness, null);
});

test("controller capture, en passant, castling and promotion preserve exact tracked identities", () => {
  for (const difference of bounded.sourceDisagreements) {
    const actual = observeTargetPath(roots.get(difference.rootId).fen, difference.actual.witness, definitions.get(difference.targetId));
    assert.equal(actual.snapshots[0].tracked.controllingPawn.role, "pawn");
    assert.equal(actual.snapshots[1].tracked.controllingPawn, null);
    assert.equal(actual.executedAtFourthPly, true);
  }
  const castle = observeTargetPath("k7/5p2/8/8/8/8/8/4K2R w K - 0 1", ["e1g1"], {
    family: "material", target: { attacker: { color: "white", role: "rook", square: "h1" },
      target: { color: "black", role: "pawn", square: "f7" } } });
  assert.equal(castle.snapshots[0].tracked.attacker.square, "f1");
  const ep = observeTargetPath("k7/8/8/3pP3/8/8/8/7K w - d6 0 2", ["e5d6"], {
    family: "material", target: { attacker: { color: "black", role: "pawn", square: "d5" },
      target: { color: "white", role: "pawn", square: "e5" } } });
  assert.equal(ep.immediate, "removed");
  assert.equal(ep.snapshots[0].tracked, null);
  const promotion = observeTargetPath("1r5k/P7/8/8/8/8/8/7K w - - 0 1", ["a7a8q"], {
    family: "material", target: { attacker: { color: "white", role: "pawn", square: "a7" },
      target: { color: "black", role: "rook", square: "b8" } } });
  assert.deepEqual(promotion.snapshots[0].tracked.attacker, { color: "white", role: "queen", square: "a8" });
});

test("the observer cannot manufacture a continuation past a game terminal or an illegal UCI", () => {
  const fen = "4k3/8/8/4p3/8/5N2/8/4K3 w - - 0 1";
  const target = { family: "material", target: { attacker: { color: "white", role: "knight", square: "f3" },
    target: { color: "black", role: "pawn", square: "e5" } } };
  assert.equal(observeTargetPath(fen, ["f3e5"], target).snapshots[0].terminalReason, "INSUFFICIENT_MATERIAL");
  assert.throws(() => observeTargetPath(fen, ["f3e5", "e8e7"], target), /continues past a game terminal/u);
  assert.throws(() => observeTargetPath(fen, ["a1a1"], target), /Illegal or noncanonical/u);
  assert.throws(() => observeTargetPath(fen, [], target), /one to four actual/u);
});

function massFixture() {
  // Explicit arithmetic control, not an actual provider or chess witness.
  return [{ id: "synthetic-predecessor", observation: { opportunityAtThirdPly: true, reintroducedAtThirdPly: true },
    arms: [{ arm: "maia:prefix0.80", pathMass: 0.25, leaves: [
      { leafId: "synthetic-execution", jointMass: 0.15, observation: { executedAtFourthPly: true } },
      { leafId: "synthetic-other", jointMass: 0.10, observation: { executedAtFourthPly: false } },
    ] }] }];
}
test("one predecessor opportunity is never counted once per sampled leaf", () => {
  const output = summarizeObservedTargets(massFixture(), "maia:prefix0.80");
  assert.equal(output.opportunityMass, 0.25);
  assert.equal(output.executionMass, 0.15);
  assert.equal(output.reintroducedOpportunityMass, 0.25);
  assert.equal(output.reintroducedExecutionMass, 0.15);
  assert.equal(output.selectedFourthPlyLeaves, 2);
  assert.equal(output.negativeVerdict, "abstain_from_partial_frontier");
  assert.equal(output.universalVerdict, "not_evaluated");
  for (const mutate of [
    (value) => { value.push(value[0]); },
    (value) => { value[0].arms[0].leaves.push(value[0].arms[0].leaves[0]); },
    (value) => { value[0].observation.opportunityAtThirdPly = false; },
    (value) => { value[0].arms[0].pathMass = -1; },
  ]) {
    const value = massFixture(); mutate(value);
    assert.throws(() => summarizeObservedTargets(value, "maia:prefix0.80"), /Duplicated|Invalid/u);
  }
});

test("all fixed actual target cells preserve population, source identity and partial abstention", () => {
  const inputs = loadTargetOutcomeInputs(), output = compileMaiaTargetOutcome(...inputs);
  assert.equal(output.rows.length, 182);
  assert.equal(output.rows.filter((row) => row.sourceObserved).length, 96);
  assert.equal(output.rows.filter((row) => !row.sourceObserved).length, 86);
  assert.equal(output.rows.reduce((sum, row) => sum + row.arms.length, 0), 364);
  assert.ok(output.rows.every((row) => row.arms.every((arm) => arm.negativeVerdict === "abstain_from_partial_frontier"
    && arm.universalVerdict === "not_evaluated" && arm.executionMass <= arm.opportunityMass + 1e-5)));
  const crossed = structuredClone(inputs);
  crossed[3].paths[0].rootFen = "changed";
  assert.throws(() => compileMaiaTargetOutcome(...crossed), /predecessor root/u);
});
