import assert from "node:assert/strict";
import test from "node:test";
import { availableTargetActions, observeTargetPathV2 } from "./dist/target-opportunity-v2.mjs";
import { observeTargetPath } from "./dist/coherent-bounded-targets.mjs";

const material = (attacker, target) => ({ family: "material", target: { attacker, target } });
const piece = (color, role, square) => ({ color, role, square });
const epRoot = "4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1";
const ep = material(piece("black", "pawn", "d4"), piece("white", "pawn", "e2"));
const promotionRoot = "4k3/8/8/8/8/8/1p2K3/R7 w - - 0 1";
const promotion = material(piece("black", "pawn", "b2"), piece("white", "rook", "a1"));

test("EP names the captured square separately from the landing square", () => {
  const v2 = observeTargetPathV2(epRoot, ["e2e4"], ep);
  assert.equal(v2.immediate, "preserved");
  assert.deepEqual(v2.snapshots[0].availableActions.map((a) => [a.uci, a.capturedSquare, a.landingSquare]), [["d4e3", "e4", "e3"]]);
  assert.equal(observeTargetPath(epRoot, ["e2e4"], ep).immediate, "removed");
});
test("all four positive capture-promotions remain separate witnesses", () => {
  const v2 = observeTargetPathV2(promotionRoot, ["e2f2"], promotion);
  assert.deepEqual(v2.snapshots[0].availableActions.map((a) => a.uci), ["b2a1b", "b2a1n", "b2a1q", "b2a1r"]);
  assert.ok(v2.snapshots[0].availableActions.every((a) => a.resultUnits > 0 && a.capturedSquare === "a1"));
  assert.equal(observeTargetPath(promotionRoot, ["e2f2"], promotion).immediate, "removed");
});
test("execution accepts every positive promotion, not just the first canonical witness", () => {
  for (const uci of ["b2a1b", "b2a1n", "b2a1q", "b2a1r"]) {
    const v2 = observeTargetPathV2(promotionRoot, ["e2f2", "e8d8", "f2g2", uci], promotion);
    assert.equal(v2.opportunityAtThirdPly, true); assert.equal(v2.executedAtFourthPly, true);
    assert.deepEqual(v2.executionWitness, ["e2f2", "e8d8", "f2g2", uci]);
  }
});
test("an expired EP right does not stay available", () => {
  const v2 = observeTargetPathV2(epRoot, ["e2e4", "e8d8", "e1f1"], ep);
  assert.equal(v2.immediate, "preserved"); assert.equal(v2.opportunityAtThirdPly, false);
});
test("pinned EP, equal or losing captures, off-turn states and terminals do not become positives", () => {
  const pinned = observeTargetPathV2("3k4/8/8/8/3p4/8/4P3/3RK3 w - - 0 1", ["e2e4"], ep);
  assert.equal(pinned.snapshots[0].availableActions.length, 0);
  assert.deepEqual(availableTargetActions({ fen: "4k3/8/8/8/3pP3/8/5B2/4K3 b - e3 0 1",
    tracked: { kind: "material", attacker: piece("black", "pawn", "d4"), target: piece("white", "pawn", "e4") }, terminalReason: null }), []);
  const target = { kind: "material", attacker: piece("black", "pawn", "d4"), target: piece("white", "pawn", "e3") };
  for (const fen of ["4k3/8/8/8/3p4/4P3/5P2/4K3 b - - 0 1", "4k3/8/8/8/3p4/4P3/5P2/4K3 w - - 0 1"]) {
    assert.deepEqual(availableTargetActions({ fen, tracked: target, terminalReason: null }), []);
  }
  assert.deepEqual(availableTargetActions({ fen: "4k3/8/8/8/3q4/4P3/5P2/4K3 b - - 0 1",
    tracked: { ...target, attacker: piece("black", "queen", "d4") }, terminalReason: null }), []);
  assert.deepEqual(availableTargetActions({ fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1", tracked: null, terminalReason: "INSUFFICIENT_MATERIAL" }), []);
  assert.throws(() => availableTargetActions({ fen: "4k3/8/8/8/8/8/8/4K3 w - - 0 1", tracked: null, terminalReason: null }), /terminal/);
});
test("ordinary material and destination identities retain the previous predicate", () => {
  for (const [fen, history, definition] of [
    ["4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1", ["e2e3"], ep],
    ["1n2k3/8/8/8/8/8/4P3/4K3 w - - 0 1", ["e2e3"], { family: "destination", target: { minor: piece("black", "knight", "b8"), controllingPawn: piece("white", "pawn", "e3"), square: "c6" } }],
  ]) {
    const old = observeTargetPath(fen, history, definition), next = observeTargetPathV2(fen, history, definition);
    assert.equal(old.immediate, next.immediate);
    assert.deepEqual(old.snapshots.map((s) => s.availableMoveUci), next.snapshots.map((s) => s.availableActions[0]?.uci ?? null));
  }
});
