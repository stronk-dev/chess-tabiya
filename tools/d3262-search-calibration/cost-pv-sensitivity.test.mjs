import assert from "node:assert/strict";
import test from "node:test";
import { summarizePvSensitivity, settings, loadPvSensitivity } from "./cost-pv-sensitivity.mjs";
import { costCases } from "./cost-contract.mjs";

function fixture() {
  const candidates = [{ rootId: "named", candidateUci: "e2e4", phase: "opening", focus: null },
    { rootId: "empty", candidateUci: "d2d4", phase: "endgame", focus: null }];
  const q = { availability: "not_applicable_immediate_preserved", execution: "not_applicable_immediate_preserved" };
  const entry = { moveUci: "e2e4", pv: ["e2e4", "e7e5"], score: { kind: "cp", value: 30, bound: false }, rank: 1, depth: 8 };
  const projection = { targetId: "target", immediate: "preserved", rawQuantifier: q,
    licensedAvailability: q.availability, opportunityObserved: false, executionObserved: false };
  const reference = { rows: [{ ...candidates[0], targetId: "target", immediate: "preserved",
    arms: settings.map(setting => ({ setting, family: "provider_line", history: entry.pv, rawScore: entry.score,
      rank: entry.rank, depth: entry.depth, rawQuantifier: q, licensedAvailability: q.availability,
      observedReach: true, observedExecution: false })) }] };
  const cases = [...costCases({ settings: settings.map(id => ({ id })), candidates, horizons: [2, 4],
    regimes: ["cold", "warm", "provider_offline"] })];
  const records = cases.map(cell => ({ row: { ...cell, kind: cell.rootId === "empty" ? "no_target"
    : cell.regime === "provider_offline" ? "source_unavailable" : "available" }, raw: { result: {
      projections: cell.rootId === "empty" ? [] : [structuredClone(projection)],
      providerPv: cell.rootId === "empty" || cell.regime === "provider_offline" ? null : structuredClone(entry) } } }));
  return { records, candidates, reference };
}
const run = x => summarizePvSensitivity(x.records, x.candidates, x.reference);
test("complete PV inventory preserves no-target/offline/shorter horizon and actual cache equality", () => {
  const value = run(fixture());
  assert.equal(value.rows, 36); assert.equal(value.retainedCases.length, 36);
  assert.equal(value.pairedCases, 12); assert.equal(value.cells.length, 3);
  assert.ok(value.cells.every(x => !x.changed.outcome));
  assert.equal(value.groups.length, 6); assert.equal(value.groups.reduce((n, x) => n + x.noTarget, 0), 3);
  assert.equal(value.productionProfileSelected, false); assert.equal(value.moveReason, "not_an_engine_reason");
});
test("immediate preserved is normalized, not falsely counted as changed reach", () => {
  assert.ok(run(fixture()).cells.every(x => x.before.outcome.observedReach && x.after.outcome.observedReach));
});
test("changed source, path, rank and target outcome are separately retained, not called engine causes", () => {
  const x = fixture();
  for (const record of x.records.filter(r => r.row.setting === "pv:depth8" && r.row.rootId === "named" && r.row.regime !== "provider_offline")) {
    record.raw.result.providerPv.pv = ["e2e4", "c7c5"];
    record.raw.result.providerPv.score = { kind: "mate", value: -2, bound: false };
    record.raw.result.providerPv.rank = 2;
    record.raw.result.projections[0].executionObserved = true;
  }
  const cell = run(x).cells.find(r => r.setting === "pv:depth8");
  assert.deepEqual(cell.changed, { history: true, score: true, rank: true, depth: false, outcome: true });
  assert.equal(cell.after.score.kind, "mate"); assert.equal(cell.before.score.kind, "cp");
});
test("failed fresh source remains unpaired instead of false absence or changed proof", () => {
  const x = fixture();
  for (const record of x.records.filter(r => r.row.setting === "pv:depth8" && r.row.rootId === "named")) {
    record.row.kind = "source_unavailable";
    record.raw.result.providerPv = null;
    record.row.cacheHits = 0;
  }
  const cell = run(x).cells.find(r => r.setting === "pv:depth8");
  assert.equal(cell.comparison, "not_compared_failed_source_not_absence");
  assert.equal(cell.after, undefined); assert.equal(cell.changed, undefined);
});
test("invalid cold source and unavailable warm receipt are retained as a failed pair, not cache success", () => {
  const x = fixture();
  for (const record of x.records.filter(r => r.row.setting === "pv:depth8" && r.row.rootId === "named")) {
    record.row.kind = record.row.regime === "cold" ? "invalid_source" : "source_unavailable";
    record.raw.result.kind = record.row.kind;
    record.raw.result.providerPv = null;
    record.row.cacheHits = 0;
  }
  const value = run(x);
  assert.equal(value.cachePairs.failedColdMissingWarmReceipt, 2);
  assert.equal(value.cells.find(r => r.setting === "pv:depth8").status, "invalid_source");
});
for (const mode of ["missing_case", "duplicate_case", "foreign_setting", "lost_target", "duplicate_target", "foreign_target", "warm_changed", "missing_reference_arm"])
  test(`fresh-source synthesis refuses ${mode}`, () => {
    const x = fixture();
    if (mode === "missing_case") x.records.pop();
    if (mode === "duplicate_case") x.records.push(structuredClone(x.records[0]));
    if (mode === "foreign_setting") x.records[0].row.setting = "engine:depth8:top2";
    if (mode === "lost_target") x.records[0].raw.result.projections = [];
    if (mode === "duplicate_target") x.records[0].raw.result.projections.push(structuredClone(x.records[0].raw.result.projections[0]));
    if (mode === "foreign_target") x.records[0].raw.result.projections[0].targetId = "foreign";
    if (mode === "warm_changed") x.records.find(r => r.row.regime === "warm" && r.row.rootId === "named").raw.result.providerPv.rank = 4;
    if (mode === "missing_reference_arm") x.reference.rows[0].arms.pop();
    assert.throws(() => run(x), /D3262_PV_SENSITIVITY/);
  });
test("no partial real population or unsafe archive list can become a full PV sensitivity", () => {
  for (const names of [[], ["../escape.json.gz"], ["other.json.gz"],
    ["d3262-cost-live-pv-initial-2026-10-06.json.gz", "d3262-cost-live-pv-initial-2026-10-06.json.gz"]])
    assert.throws(() => loadPvSensitivity(names), /D3262_PV_SENSITIVITY/);
  assert.throws(() => loadPvSensitivity(["d3262-cost-live-pv-initial-2026-10-06.json.gz"]), /incomplete complete-PV population/);
});
