import assert from "node:assert/strict";
import { test } from "node:test";
import { compareObservedArms, compileActualContrast, loadActualInputs, projectObservedArm, summarizeActualContrast } from "./coherent-actual-contrast.mjs";

// Synthetic algebra guards are not provider evidence. The population tests
// below use the complete captured research artifacts without resampling.
const cell = { immediate: "removed", exactBaseline: { reintroducedWithin3Ply: true } };
const arm = { negativeVerdict: "abstain_from_partial_frontier", universalVerdict: "not_evaluated",
  proofCeiling: "observed_provider_selected_lines_only", selectedPredecessorPaths: 1, selectedFourthPlyLeaves: 1,
  opportunityPaths: ["predecessor"], reintroducedPaths: ["predecessor"], executedLeaves: [], executedReintroducedLeaves: [],
  omissions: { firstReplies: 20, learnerEdgesWithinSelectedReplies: 15, fourthRepliesWithinSelectedNonterminalPaths: 10 },
  absorbingThirdPlyPaths: [], weightAuthority: "unweighted_selected_paths_not_policy_mass_or_human_frequency" };

test("one-sided observed opportunity never certifies prevention or engine causality", () => {
  const positive = projectObservedArm(cell, arm, "engine");
  const miss = projectObservedArm(cell, { ...arm, opportunityPaths: [], reintroducedPaths: [] }, "engine");
  const result = compareObservedArms(positive, miss, "same");
  assert.equal(result.observedOpportunity, "source_only_opponent_option");
  assert.equal(result.apparentOnExactSame, true); assert.equal(result.certifiedOpportunity, null);
  assert.equal(result.abstains, true); assert.equal(result.reasonDisposition, "not_an_engine_reason");
  assert.equal(result.certifiedExecution, null);
});
test("both visited/direct positives certify only shared existential reach, never universal survival", () => {
  const positive = projectObservedArm(cell, arm, "engine");
  const direct = projectObservedArm({ ...cell, immediate: "preserved" }, { ...arm, reintroducedPaths: [] }, "engine");
  const result = compareObservedArms(positive, direct, "same");
  assert.equal(result.certifiedOpportunity, "same"); assert.equal(result.abstains, false);
  assert.equal(result.source.universalVerdict, "not_evaluated");
  assert.throws(() => compareObservedArms(positive, direct, "source_only_opponent_option"), /exceeds exact baseline/u);
});
test("availability is not execution and engine counts cannot become probability", () => {
  const positive = projectObservedArm(cell, arm, "engine");
  assert.equal(positive.opportunity, true); assert.equal(positive.execution, false);
  assert.ok(!Object.hasOwn(positive, "modelMass"));
  assert.throws(() => projectObservedArm(cell, { ...arm, policyMass: 0.8 }, "engine"), /Invented engine policy mass/u);
  assert.throws(() => projectObservedArm(cell, { ...arm, universalVerdict: "proved" }, "engine"), /proof authority/u);
  assert.throws(() => projectObservedArm(cell, { ...arm, reintroducedPaths: ["predecessor", "predecessor"] }, "engine"), /proof authority/u);
});
test("model opportunity and execution masses stay separate with literal residuals", () => {
  const model = { ...arm, proofCeiling: "observed_configured_model_paths_only", opportunityMass: 0.3,
    reintroducedOpportunityMass: 0.3, executionMass: 0, reintroducedExecutionMass: 0,
    coveredPredecessorMass: 0.8, coveredFourthPlyMass: 0.7, residualMass: 0.3 };
  const projected = projectObservedArm(cell, model, "model");
  assert.equal(projected.modelMass.opportunityMass, 0.3); assert.equal(projected.modelMass.executionMass, 0);
  assert.equal(projected.modelMass.residualMass, 0.3);
  assert.throws(() => projectObservedArm(cell, { ...model, residualMass: 0.1 }, "model"), /mass\/residual/u);
  assert.throws(() => projectObservedArm(cell, { ...model, coveredFourthPlyMass: true }, "model"), /mass\/residual/u);
});

const inputs = loadActualInputs();
test("actual same-target joins retain every pair, arm, unpaired target and coverage control", () => {
  const result = compileActualContrast(...inputs), summary = summarizeActualContrast(result);
  assert.equal(result.profiles.length, 3); assert.equal(Object.keys(summary).length, 29);
  assert.equal(result.unpairedTargets.length, 17); assert.equal(result.controls.length, 4);
  assert.equal(result.profiles.find((p) => p.kind === "semantic_first_reply_reserve").candidateCoverage.length, 193);
  for (const profile of result.profiles) {
    assert.equal(profile.rows.length, 116);
    assert.equal(profile.rows.filter((row) => row.exact !== "same").length, 13);
    for (const row of profile.rows) for (const observed of row.arms) {
      assert.equal(observed.certifiedOpportunity === null, observed.abstains);
      if (observed.certifiedOpportunity !== null) assert.equal(observed.certifiedOpportunity, row.exact);
      assert.equal(observed.certifiedExecution, null);
    }
  }
});
test("actual source/context/selection mutations fail rather than hiding behind a green census", () => {
  const [contrast, engine, model, digests] = inputs;
  const entry = engine.profiles[0].rows[0], selected = entry.arms[0];
  const controls = [
    [contrast, "rows", contrast.rows.slice(0, 115), /population/u],
    [model.inputDigests, "d3262-coherent-root-frame.json", "changed", /source digest/u],
    [engine.profiles[1], "candidateCoverage", engine.profiles[1].candidateCoverage.slice(0, 192), /coverage/u],
    [entry, "sourceObserved", !entry.sourceObserved, /cell context/u],
    [selected, "selectedPredecessorPaths", selected.selectedPredecessorPaths + 1, /witness summary/u],
    [selected, "universalVerdict", "proved", /witness summary|proof authority/u],
    [selected.paths[0], "predecessorObservation", true, /compact reference/u],
    [selected, "executedLeaves", ["invented-unplayed-target"], /witness summary/u],
    [model.rows[0].arms[0], "executionMass", model.rows[0].arms[0].executionMass + 0.1, /model witness summary/u],
  ];
  for (const [object, field, value, pattern] of controls) {
    const previous = object[field]; object[field] = value;
    try { assert.throws(() => compileActualContrast(contrast, engine, model, digests), pattern); }
    finally { object[field] = previous; }
  }
});
