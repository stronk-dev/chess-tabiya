import assert from "node:assert/strict";
import test from "node:test";
import { compile, loadInputs, rankComparison, selectedControlVerdict } from "./coherent-qualification.mjs";
const source = (rank, value, kind = "cp", bound = false, budget = "depth12") =>
  ({ status: "retained", rank, score: { kind, value, bound }, depth: 12, budget });
test("ordinal rank is not a CP tie, grade, or merged budget", () => {
  assert.equal(rankComparison(source(1, 3), source(2, 3)).rankOrder, "source_precedes");
  assert.equal(rankComparison(source(1, 3), source(2, 3)).cpOrder, "tie");
  assert.equal(rankComparison(source(2, 5), source(1, 8)).cpOrder, "alternative_precedes");
  assert.throws(() => rankComparison(source(1, 3), source(2, 3, "cp", false, "depth8")));
  assert.throws(() => rankComparison(source(1, NaN), source(2, 3)));
  assert.throws(() => rankComparison(source(1, 3, "cp", null), source(2, 3)));
});
test("mate/CP and bounded provider scores never become magic comparable CP", () => {
  assert.equal(rankComparison(source(1, 2, "mate"), source(2, 500)).cpOrder, "not_comparable_as_cp");
  assert.equal(rankComparison(source(1, 2, "mate"), source(2, 4, "mate")).cpOrder, "not_comparable_as_cp");
  assert.equal(rankComparison(source(1, 3, "cp", true), source(2, 2)).cpOrder, "not_comparable_as_cp");
});
test("unvisited fork refutation is unknown, never all-replies; visited refutation remains scoped", () => {
  const replies = [{ uci: "a1a2", retainsAny: true }, { uci: "b1b2", retainsAny: false }];
  assert.equal(selectedControlVerdict(replies, ["a1a2"]).verdict, "unknown_unvisited_or_provider_line_ceiling");
  assert.equal(selectedControlVerdict(replies, ["b1b2"]).verdict, "named_geometric_relation_refuted_by_visited_reply");
  assert.throws(() => selectedControlVerdict(replies, ["c1c2"]));
  assert.throws(() => selectedControlVerdict([], []));
});
test("complete one-reply geometry does not grant the provider line a universal", () => {
  const replies = [{ uci: "a1a2", retainsAny: true }];
  assert.equal(selectedControlVerdict(replies, ["a1a2"]).verdict, "named_geometric_relation_retained_all_exact_replies");
  assert.equal(selectedControlVerdict(replies, ["a1a2"], true).verdict, "unknown_unvisited_or_provider_line_ceiling");
});
test("complete frozen population retains focus missingness, controls, authorities and every phase", () => {
  const result = compile(loadInputs());
  assert.equal(result.population.length, 193);
  assert.deepEqual(result.focus.namedCells, { unknown: 182 });
  assert.equal(result.controls.length, 4);
  assert.equal(result.controls.reduce((n, r) => n + r.arms.length, 0), 212);
  assert.equal(result.phaseMix.reduce((n, r) => n + r.cells, 0), 182);
  assert.equal(result.qualification.completeProductionCandidate, false);
  assert.equal(result.controls.find((r) => r.rootId.startsWith("quiet-plan:")).arms.every((a) => a.verdict === "no_autonomous_quiet_plan_claim"), true);
});
test("all eight immutable input mutations fail rather than generating a nicer qualification", () => {
  const inputs = loadInputs();
  for (const value of inputs.values) {
    value.version += 1;
    assert.throws(() => compile(inputs), /Mutated qualification input/);
    value.version -= 1;
  }
});
