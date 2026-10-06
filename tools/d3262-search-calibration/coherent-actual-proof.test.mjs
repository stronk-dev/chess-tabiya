import assert from "node:assert/strict";
import { test } from "node:test";
import { compileActualProof, loadProofInputs, projectPreparation, projectRoot, summarizeProof } from "./coherent-actual-proof.mjs";

const observed = (uci, opportunity, executed = false) => ({ learnerUci: uci, pathId: `path:${uci}`,
  opportunity, executedLeaves: executed ? [`leaf:${uci}`] : [] });
const prep = (uci, result) => ({ preparationUci: uci, ...result });
test("one real defence refutes a preparation even with unvisited legal defences", () => {
  const result = projectPreparation(["a", "b"], null, [observed("a", false)]);
  assert.equal(result.availability, "refuted_by_visited_defence");
  assert.equal(result.refutationPath, "path:a"); assert.deepEqual(result.unvisitedDefences, ["b"]);
});
test("partial positives abstain; complete nonempty positives prove availability, not execution", () => {
  assert.equal(projectPreparation(["a", "b"], null, [observed("a", true)]).availability, "unknown_partial_defences");
  const full = projectPreparation(["a", "b"], null, [observed("a", true), observed("b", true)]);
  assert.equal(full.availability, "survives_complete_nonempty_defences");
  assert.equal(full.execution, "unknown_unexecuted_or_partial");
  assert.equal(projectPreparation(["a"], null, [observed("a", true, true)]).execution, "executed_against_every_defence");
});
test("automatic terminals with legal moves never prove vacuous survival", () => {
  const draw = projectPreparation(["a", "b"], "INSUFFICIENT_MATERIAL", []);
  assert.equal(draw.availability, "ineligible_terminal"); assert.equal(draw.unexpandedTerminalLegalMoves, 2);
  assert.equal(projectPreparation([], "CHECKMATE", []).execution, "ineligible_terminal");
  assert.throws(() => projectPreparation(["a"], "INSUFFICIENT_MATERIAL", [observed("a", true)]), /absorbing/u);
});
test("root existence needs one proven preparation; refutation needs all legal preparations", () => {
  const positive = prep("x", projectPreparation(["a"], null, [observed("a", true)]));
  const negative = prep("y", projectPreparation(["a", "b"], null, [observed("a", false)]));
  assert.equal(projectRoot("removed", ["x", "y"], [positive]).availability, "exists_preparation_surviving_all_defences");
  assert.equal(projectRoot("removed", ["x", "y"], [negative]).availability, "unknown_partial_quantifiers");
  assert.equal(projectRoot("removed", ["y"], [negative]).availability, "every_preparation_refuted_at_bound");
  assert.equal(projectRoot("preserved", ["y"], [negative]).availability, "not_applicable_immediate_preserved");
  assert.equal(projectRoot("removed", [], []).availability, "ineligible_terminal");
});
test("duplicate, illegal, untyped and fabricated execution inputs refuse", () => {
  assert.throws(() => projectPreparation(["a", "a"], null, []), /Duplicate/u);
  assert.throws(() => projectPreparation(["a"], null, [observed("b", true)]), /Illegal/u);
  assert.throws(() => projectPreparation(["a"], null, [observed("a", 1)]), /untyped/u);
  assert.throws(() => projectPreparation(["a"], null, [observed("a", false, true)]), /witness/u);
  assert.throws(() => projectRoot("removed", ["x"], [prep("y", {})]), /root scope/u);
});

const inputs = loadProofInputs();
test("complete actual population retains every offered candidate and all 29 settings", () => {
  const output = compileActualProof(inputs);
  assert.equal(output.candidateGraph.length, 193); assert.equal(output.controls.length, 4);
  assert.equal(Object.keys(summarizeProof(output)).length, 29);
  for (const p of output.profiles) {
    assert.equal(p.rows.length, 182);
    for (const row of p.rows) for (const arm of row.arms) {
      assert.equal(arm.productionDisposition, "research_quantifier_receipt_not_production_authority");
      if (arm.availability === "exists_preparation_surviving_all_defences") assert.equal(row.exactBaseline.preparationSurvivesEveryDefence, true);
      if (arm.availability === "every_preparation_refuted_at_bound") assert.equal(row.exactBaseline.preparationSurvivesEveryDefence, false);
    }
  }
});
test("real population identity, scope, selection and reference corruptions refuse", () => {
  const [root, first, third, semantic, engine] = inputs.values;
  const cell = engine.profiles[0].rows[0], selected = cell.arms[0];
  const corruptions = [
    [root, "roots", root.roots.slice(1)],
    [first, "rows", first.rows.slice(1)],
    [third.inputDigests, "d3262-coherent-first-reply-frontier.json", "changed"],
    [third.paths[0], "id", "changed"],
    [semantic, "arms", ["changed"]],
    [cell, "immediate", "removed"],
    [selected, "universalVerdict", "proved"],
    [selected.paths[0], "predecessorObservation", true],
    [selected, "paths", selected.paths.slice(1)],
  ];
  for (const [object, field, value] of corruptions) {
    const old = object[field]; object[field] = value;
    try { assert.throws(() => compileActualProof(inputs)); } finally { object[field] = old; }
  }
});
