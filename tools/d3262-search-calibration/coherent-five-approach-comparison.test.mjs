import test from "node:test";
import assert from "node:assert/strict";
import { loadInputs, compileComparison, licensedAvailability, reachKnowledge, compareKnowledge, legalPv, summarize } from "./coherent-five-approach-comparison.mjs";

test("provider-line ceiling cannot become universal authority", () => {
  assert.equal(licensedAvailability("exists_preparation_surviving_all_defences", "provider_line"), "withheld_provider_line_ceiling");
  assert.equal(licensedAvailability("every_preparation_refuted_at_bound", "provider_line"), "withheld_provider_line_ceiling");
  assert.equal(licensedAvailability("exists_preparation_surviving_all_defences", "exact_reply_forcing"), "exists_preparation_surviving_all_defences");
});
test("refuting every preparation is NOT existential absence while some defence exposes the target", () => {
  const prep = { availability: "refuted_by_visited_defence", unvisitedDefences: [], observed: [{ opportunity: false }, { opportunity: true }] };
  assert.equal(reachKnowledge("removed", [prep], [], "engine_beam"), true);
  assert.equal(reachKnowledge("removed", [{ ...prep, observed: [{ opportunity: false }] }], ["missing"], "engine_beam"), null);
});
test("negative and contrast claims require closed quantifiers, not an observed miss", () => {
  const prep = { availability: "refuted_by_visited_defence", unvisitedDefences: [], observed: [{ opportunity: false }] };
  assert.equal(reachKnowledge("removed", [prep], [], "exact_reply_forcing"), false);
  assert.equal(reachKnowledge("removed", [prep], [], "provider_line"), null);
  assert.equal(compareKnowledge(true, null), null);
  assert.equal(compareKnowledge(true, false), "source_only_opponent_option");
});
test("PV replay refuses illegality and preserves castling external history", () => {
  assert.throws(() => legalPv("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1g1", ["e1g1", "e8e6"]), /Illegal/);
  assert.deepEqual(legalPv("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1g1", ["e1g1", "e8d7"]), ["e1g1", "e8d7"]);
  assert.throws(() => legalPv("4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1g1", ["a1a2"]), /PV root/);
  assert.deepEqual(legalPv("4k3/8/8/8/8/8/8/R3K3 w - - 149 1", "a1a2", ["a1a2", "e8d7"]), ["a1a2"]);
});
test("actual fixed frame retains five families, separate diagnostics, controls and literal mass", () => {
  const result = compileComparison(loadInputs());
  assert.equal(result.settings.length, 53);
  assert.equal(result.settings.filter((s) => !s.diagnostic).length, 34);
  assert.equal(new Set(result.settings.filter((s) => !s.diagnostic).map((s) => s.family)).size, 5);
  assert.equal(result.candidateCoverage.length, 193);
  assert.equal(result.rows.length, 182); assert.equal(result.contrasts.length, 116);
  assert.equal(result.unpairedTargets.length, 17); assert.equal(result.controls.length, 4);
  assert.equal(result.productionProfileSelected, false);
  const summary = summarize(result), oracle = summary.find((s) => s.setting === "complete:four-ply");
  assert.equal(oracle.removedReintroductionsObserved, 58);
  assert.equal(oracle.licensedAvailability.exists_preparation_surviving_all_defences, 8);
  const model = result.rows[0].arms.find((s) => s.family === "configured_model");
  assert.equal(typeof model.modelMass.residualMass, "number");
  assert.equal(result.rows[0].arms.find((s) => s.family === "engine_beam").modelMass, undefined);
});
test("immutable actual input corruptions cannot silently widen the common receipt", () => {
  const input = loadInputs();
  const cases = [
    ["d3262-coherent-root-frame.json", (v) => v.roots.pop()],
    ["d3262-coherent-target-comparison-frame.json", (v) => v.comparisons[0].sourceObserved = !v.comparisons[0].sourceObserved],
    ["d3262-target-opportunity-v2-audit.json.gz", (v) => v.convention = "legacy"],
    ["d3262-coherent-exact-trigger-outcome.json", (v) => v.rows[0].variants.square_control.triggerUcis.pop()],
    ["d3262-stockfish-root-coherent-all.json", (v) => v.rows[0].probes[0].entries[0].pv[0] = "a1a1"],
    ["d3262-coherent-actual-proof.json.gz", (v) => v.profiles[0].rows[0].arms[0].omittedPreparations = []],
    ["d3262-coherent-maia-target-outcome.json", (v) => v.rows[0].arms[0].residualMass = 0],
    ["d3262-coherent-recursive-evaluation.json.gz", (v) => v.proof.rows.pop()],
    ["d3262-coherent-bounded-contrast.json", (v) => v.rows[0].reachWithinBound = "same_FAKE"],
  ];
  for (const [name, mutate] of cases) {
    const old = input.values[name], value = structuredClone(old); mutate(value); input.values[name] = value;
    assert.throws(() => compileComparison(input), /Mutated common source/); input.values[name] = old;
  }
});
