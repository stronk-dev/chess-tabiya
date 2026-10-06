import assert from "node:assert/strict";
import { test } from "node:test";
import { Chess } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { observeTargetPath } from "./dist/coherent-bounded-targets.mjs";
import { exchangeCaptureAt, legalExchangeForMove } from "./dist/target-exchange.mjs";
import { compileRecursiveEvaluation, loadEvaluationInputs, oracleLimitations, summarizeEvaluation } from "./coherent-recursive-evaluation.mjs";
import { projectPreparation, projectRoot } from "./coherent-actual-proof.mjs";
import { compareObservedArms } from "./coherent-actual-contrast.mjs";

test("known historical EP and promotion opportunity omissions stay explicit, not silently repaired", () => {
  for (const [fen, candidate, attacker, target, moves] of [
    ["4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1", "e2e4",
      { color: "black", role: "pawn", square: "d4" }, { color: "white", role: "pawn", square: "e2" }, ["d4e3"]],
    ["4k3/8/8/8/8/8/1p2K3/R7 w - - 0 1", "e2f2",
      { color: "black", role: "pawn", square: "b2" }, { color: "white", role: "rook", square: "a1" }, ["b2a1q", "b2a1r", "b2a1b", "b2a1n"]],
  ]) {
    const observed = observeTargetPath(fen, [candidate], { family: "material", target: { attacker, target } });
    const snapshot = observed.snapshots[0], board = Chess.fromSetup(parseFen(snapshot.fen).unwrap()).unwrap();
    assert.equal(observed.immediate, "removed"); assert.equal(snapshot.availableMoveUci, null);
    for (const uci of moves) {
      const move = parseUci(uci); assert.ok(board.isLegal(move));
      assert.ok((legalExchangeForMove(board, move)?.resultUnits ?? 0) > 0);
      assert.equal(exchangeCaptureAt(board, move)?.piece.role, target.role);
    }
  }
  assert.ok(oracleLimitations.some((item) => item.includes("D3492")));
});
test("opportunity is not execution and partial negative contrast is not prevention", () => {
  const positive = { opportunity: true, execution: false }, unknown = { opportunity: false, execution: false };
  const result = compareObservedArms(positive, unknown, "same");
  assert.equal(result.certifiedOpportunity, null); assert.equal(result.certifiedExecution, null);
  assert.equal(result.apparentOnExactSame, true); assert.equal(result.reasonDisposition, "not_an_engine_reason");
});
test("a real defence can refute a preparation, but omitted sibling preparations block root refutation", () => {
  const p = projectPreparation(["e2e4", "d2d4"], null, [{ learnerUci: "e2e4", opportunity: false, pathId: "actual", executedLeaves: [] }]);
  assert.equal(p.availability, "refuted_by_visited_defence");
  assert.equal(projectRoot("removed", ["x", "y"], [{ preparationUci: "x", ...p }]).availability, "unknown_partial_quantifiers");
  assert.equal(projectRoot("removed", ["x"], [{ preparationUci: "x", ...p }]).availability, "every_preparation_refuted_at_bound");
});

const inputs = loadEvaluationInputs();
test("complete recursive target/contrast/quantifier population preserves controls, omissions and oracle limits", () => {
  const output = compileRecursiveEvaluation(inputs);
  assert.equal(output.target.candidateCoverage.length, 193); assert.equal(output.target.rows.length, 182);
  assert.equal(output.proof.rows.length, 182); assert.equal(output.contrast.rows.length, 116);
  assert.equal(output.contrast.unpairedTargets.length, 17); assert.equal(output.controls.length, 4);
  assert.equal(Object.keys(summarizeEvaluation(output).arms).length, 18);
  assert.deepEqual(output.oracleLimitations, oracleLimitations);
  for (const row of output.target.rows) for (const arm of row.arms) {
    assert.equal(arm.universalVerdict, "not_evaluated"); assert.equal(arm.negativeVerdict, "abstain_from_partial_frontier");
    assert.ok(arm.paths.every((p) => Number.isSafeInteger(p.predecessorObservation)));
  }
});
test("actual population, source ceiling, frozen selection, quantifier and baseline corruptions refuse", () => {
  const [comparison, , bounded, frozen, frontier, contrast, proof] = inputs.values;
  const edits = [
    [comparison, "comparisons", comparison.comparisons.slice(1)],
    [frontier, "authority", "production_proof"],
    [frontier, "arms", ["changed"]],
    [frontier, "rows", frontier.rows.slice(1)],
    [frontier.inputDigests, "d3262-coherent-recursive-semantic-frame.json.gz", "wrong"],
    [bounded.inputDigests, "d3262-coherent-root-frame.json", "wrong"],
    [proof, "quantifier", "exists_any_visited_opportunity"],
    [proof, "bounds", { preparationPly: true, defencePly: 3, targetActionPly: 4 }],
    [contrast, "unpairedTargets", []],
    [frozen, "paths", frozen.paths.slice(1)],
  ];
  for (const [object, field, changed] of edits) {
    const prior = object[field]; object[field] = changed;
    try { assert.throws(() => compileRecursiveEvaluation(inputs)); } finally { object[field] = prior; }
  }
});
