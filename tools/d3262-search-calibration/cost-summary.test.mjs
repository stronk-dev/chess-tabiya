import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { summarizeCostArchives, summarizeModelCoverage } from "./cost-summary.mjs";

test("default reconstruction preserves original complete-PV-setting synthesis bytes", () => {
  const value = summarizeCostArchives();
  assert.equal(`${JSON.stringify(value, null, 2)}\n`, readFileSync("planning/semantic-consequence-search/d3262-cost-live-pv-depth8-summary-2026-10-06.json", "utf8"));
  assert.equal(value.admittedRows, 1158); assert.equal(value.complete, false);
});
test("partial batch remains partial and stratifies unavailable instead of calling it success", () => {
  const value = summarizeCostArchives(["d3262-cost-live-pv-initial-2026-10-06.json.gz"]);
  assert.equal(value.admittedRows, 6); assert.equal(value.retainedCandidates, 1);
  assert.equal(value.expectedCases, 61374); assert.equal(value.productionProfileSelected, false);
  assert.deepEqual([...new Set(value.rows.map(x => x.result))].sort(), ["available", "source_unavailable"]);
});
for (const [label, names] of [["empty", []], ["duplicate", ["d3262-cost-live-pv-initial-2026-10-06.json.gz", "d3262-cost-live-pv-initial-2026-10-06.json.gz"]],
  ["traversal", ["../d3262-cost-live-pv-initial-2026-10-06.json.gz"]], ["foreign", ["other.json.gz"]]])
  test(`summary refuses ${label} capture list`, () => assert.throws(() => summarizeCostArchives(names)));

test("model synthesis keeps shorter horizon, unknown coverage and no-target separate from known mass", () => {
  const record = (horizon, kind, coverage) => ({ row: { setting: "maia:prefix0.80", horizon, regime: "cold", kind },
    raw: { result: { modelFrontier: { nodes: [], edges: [], coverage } } } });
  const value = summarizeModelCoverage([
    record(2, "available", { complete: true, frontierMass: 0.85, stopRule: { status: "joint_rule_satisfied" } }),
    record(4, "available", { complete: true, frontierMass: 0.62, stopRule: { status: "frozen_frontier_exhausted_below_joint_threshold" } }),
    record(4, "source_unavailable", { complete: false, frontierMass: null, stopRule: { status: "partial_traversal_abstain" } }),
    record(4, "no_target", { status: "not_requested_no_target" }),
  ]);
  assert.equal(value.groups.length, 4);
  assert.equal(value.groups[0].frontierMass.min, 0.85);
  assert.equal(value.groups[1].frontierMass.min, 0.62);
  assert.equal(value.groups[2].frontierMass, null); assert.equal(value.groups[2].unknown, 1);
  assert.equal(value.groups[3].frontierMass, null); assert.equal(value.groups[3].noTarget, 1);
  assert.equal(value.groups[0].phase, null); assert.equal(value.groups[0].focus, null);
  assert.equal(value.authority, "both_sides_configured_model_not_human_frequency_or_all_defences_proof");
});

test("model coverage strata come from frozen candidate phase/focus, never pooled or inferred", () => {
  const records = ["opening", "middlegame"].map(rootId => ({ row: { rootId, candidateUci: "a2a3",
    setting: "maia:prefix0.90", horizon: 4, regime: "cold", kind: "available" }, raw: { result: {
      modelFrontier: { nodes: [], edges: [], coverage: { complete: true, frontierMass: 0.91,
        stopRule: { status: "joint_rule_satisfied" } } } } } }));
  const candidates = records.map(({ row }) => ({ rootId: row.rootId, candidateUci: row.candidateUci,
    phase: row.rootId, focus: null }));
  const value = summarizeModelCoverage(records, candidates);
  assert.equal(value.groups.length, 2);
  assert.deepEqual(value.groups.map(x => x.phase), ["opening", "middlegame"]);
  assert.ok(value.groups.every(x => x.count === 1 && x.focus === null));
});
