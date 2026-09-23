import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseSquare, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { compileCoherentBoundedTargets, evaluateBoundedTarget } from "./dist/coherent-bounded-targets.mjs";

const directory = "planning/semantic-consequence-search";
const load = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`, "utf8"));
const comparisons = load("d3262-coherent-target-comparison-frame");
const frame = load("d3262-coherent-root-frame");
const graph = load("d3262-coherent-exact-replies");
const source = JSON.parse(readFileSync("tools/d1023-bounded-policy-harness/provider-sample.json", "utf8"));
const output = load("d3262-coherent-bounded-targets");
const definitions = new Map(comparisons.definitions.map((item) => [item.id, item]));
const roots = new Map(frame.roots.map((item) => [item.rootId, item]));

test("source controls are retained, natural alternatives are separately counted, and no search is budget-exhausted", () => {
  assert.equal(output.sourceControls, 96);
  assert.equal(output.rows.length, 182);
  assert.equal(output.rows.filter((row) => row.sourceObserved).length, 96);
  assert.equal(output.rows.filter((row) => !row.sourceObserved).length, 86);
  assert.equal(output.rows.filter((row) => row.kind === "budget_exhausted").length, 0);
  assert.deepEqual(output.rows.filter((row) => row.family === "destination" && !row.sourceObserved)
    .reduce((counts, row) => ({ cells: counts.cells + 1, preserved: counts.preserved + (row.immediate === "preserved" ? 1 : 0) }),
      { cells: 0, preserved: 0 }), { cells: 56, preserved: 55 });
});

test("all predecessor disagreements have legal witnesses capturing the named controller", () => {
  assert.equal(output.sourceDisagreements.length, 12);
  for (const difference of output.sourceDisagreements) {
    assert.equal(difference.family, "destination");
    assert.equal(difference.controllerCapturedOnWitness, true);
    const definition = definitions.get(difference.targetId);
    const root = roots.get(difference.rootId);
    assert.ok(definition && root);
    const state = Chess.fromSetup(parseFen(root.fen).unwrap()).unwrap();
    for (const [index, uci] of difference.actual.witness.entries()) {
      const parsed = parseUci(uci);
      assert.ok(parsed, `unparseable witness ${uci}`);
      const move = normalizeMove(state, parsed);
      assert.ok(state.isLegal(move), `illegal witness ${difference.rootId}/${index}/${uci}`);
      if (index === 1) {
        const pawn = definition.target.controllingPawn;
        assert.equal(state.board.get(parseSquare(pawn.square))?.role, "pawn");
        assert.notEqual(state.turn, pawn.color, "opponent cannot move the named pawn away");
      }
      state.play(move);
      if (index === 1) {
        assert.notEqual(state.board.get(parseSquare(definition.target.controllingPawn.square))?.color,
          definition.target.controllingPawn.color,
          `preparation must remove the named pawn ${difference.rootId}`);
      }
    }
    assert.equal(difference.actual.reintroducedWithin3Ply, true);
  }
});

test("the exact-reply boundary refuses an omitted legal reply", () => {
  const truncated = structuredClone(graph);
  const firstPair = comparisons.comparisons[0];
  const candidate = truncated.roots.find((root) => root.rootId === firstPair.rootId).candidates
    .find((item) => item.candidateUci === firstPair.candidateUci);
  candidate.replies.pop();
  candidate.replyCount -= 1;
  assert.throws(() => compileCoherentBoundedTargets(comparisons, frame, truncated, source),
    /Incomplete exact-reply boundary/);
});

test("the target evaluator refuses an illegal candidate and keeps source identity loss distinct", () => {
  const pair = comparisons.comparisons[0];
  const root = roots.get(pair.rootId);
  const definition = definitions.get(pair.targetId);
  assert.throws(() => evaluateBoundedTarget(root.fen, "a1a1", definition), /Illegal candidate/);
  assert.equal(evaluateBoundedTarget(root.fen, pair.candidateUci, definition).immediate,
    output.rows[0].immediate);
});
