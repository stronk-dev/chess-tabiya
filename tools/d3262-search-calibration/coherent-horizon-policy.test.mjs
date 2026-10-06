import assert from "node:assert/strict";
import test from "node:test";
import { jointStop, selectedPrefix, composeCoverage, loadInputs, compile, summarize } from "./coherent-horizon-policy.mjs";

test("three individually adequate local prefixes cannot claim adequate joint coverage", () => {
  const coverage = composeCoverage(0.81, [{ pathMass: 0.81 ** 2, coveredConditionalMass: 0.81, terminalReason: null }]);
  assert.equal(jointStop(0.8, coverage[0]).status, "joint_rule_satisfied");
  assert.equal(jointStop(0.8, coverage[1]).status, "frozen_frontier_exhausted_below_joint_threshold");
  assert.equal(jointStop(0.8, coverage[2]).status, "frozen_frontier_exhausted_below_joint_threshold");
  assert.ok(jointStop(0.8, coverage[2]).residualMass > 0.46);
});
test("eight-move cap retains shortfall without frontier renormalization", () => {
  const selected = selectedPrefix(Array.from({ length: 10 }, (_, i) => ({ legalUci: `move${i}`, mass: 0.1 })), 0.9);
  assert.equal(selected.length, 8);
  assert.equal(jointStop(0.9, selected.reduce((n, p) => n + p.mass, 0)).status, "frozen_frontier_exhausted_below_joint_threshold");
  assert.throws(() => jointStop(0.7, 0.8), /Undeclared/);
});
test("absorbing paths retain admitted mass and cannot invent a further move", () => {
  assert.deepEqual(composeCoverage(0.8, [{ pathMass: 0.6, coveredConditionalMass: 1, terminalReason: "INSUFFICIENT_MATERIAL" }], 0.2), [0.8, 0.8, 0.8]);
  assert.deepEqual(composeCoverage(1, [], 0, true), [1, 1, 1]);
  assert.throws(() => composeCoverage(0.8, [{ pathMass: 0.6, coveredConditionalMass: 0, terminalReason: "INSUFFICIENT_MATERIAL" }]), /absorbing/);
});
test("missing source is unknown rather than zero policy mass or an exact negative", () => {
  assert.equal(jointStop(0.8, null, true).status, "source_off_abstain");
  assert.equal(jointStop(0.8, null, true).residualMass, null);
  assert.throws(() => jointStop(0.8, 0, true), /Unavailable/);
  assert.throws(() => jointStop(0.8, NaN), /Invalid/);
  assert.equal(jointStop(0.8, 0.8).status, "numerical_boundary_abstain");
  assert.equal(jointStop(0.9, 1.0000000968575478).coveredJointMass, 1.0000000968575478);
});
test("actual two-ply population and joint stop denominators remain complete", () => {
  const output = compile(loadInputs()), summary = summarize(output);
  assert.equal(output.rows.length, 182); assert.equal(output.settings.length, 53);
  assert.equal(output.contrasts.length, 116); assert.equal(output.policyStops.length, 193);
  assert.equal(output.controls.length, 4); assert.equal(output.unpairedTargets.length, 17);
  assert.equal(output.candidateCoverage.filter((r) => r.namedCells === 0).length, 14);
  assert.equal(summary.directAvailable, 107);
  assert.equal(summary.policy[0].horizons[2].exhausted, 114);
  assert.equal(summary.policy[1].horizons[2].exhausted, 85);
  assert.ok(output.rows.every((r) => r.arms.every((a) => a.futureReintroduction === "not_observed_beyond_two_ply_horizon")));
  assert.equal(output.productionProfileSelected, false);
  for (const row of output.rows) for (const arm of row.arms.filter((a) => a.policy)) {
    assert.ok(arm.policy.executedMassLower >= 0 && arm.policy.executedMassUpper <= 1);
    assert.ok(arm.policy.executedMassLower <= arm.policy.executedMassUpper);
    assert.ok(arm.policy.executedMassLower <= arm.policy.literalExecutedMass);
  }
});
test("mutating actual population, history, mass or horizon inputs is refused", () => {
  const input = loadInputs();
  const corruptions = [
    [0, (v) => v.rows.pop()], [1, (v) => v.roots[0].candidates.pop()], [2, (v) => v.definitions[0].target.square = "e9"],
    [3, (v) => v.candidateGraph[0].preparations.pop()], [4, (v) => v.rows[0].replies.pop()],
    [5, (v) => v.rows[0].arms[0].frontierMass = 1], [6, (v) => v.paths[0].conditionalLearnerMass = 1],
    [7, (v) => v.rows[0].historyUci.push("a1a1")], [8, (v) => v.rows[0].configuredSupport[0].mass = 0],
  ];
  for (const [i, mutate] of corruptions) {
    const old = input.values[i], value = structuredClone(old); mutate(value); input.values[i] = value;
    assert.throws(() => compile(input), /Mutated horizon/, `actual source corruption ${i}`); input.values[i] = old;
  }
});
