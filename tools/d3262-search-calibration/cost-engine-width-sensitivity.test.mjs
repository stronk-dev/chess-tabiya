import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { summarizeEngineWidthSensitivity, settings, loadEngineWidthSensitivity, indexEngineContinuation } from "./cost-engine-width-sensitivity.mjs";
import { costCases, sha, loadCostPlan, sourcePins } from "./cost-contract.mjs";

// Synthetic projection controls, never live engine or chess evidence.
function fixture() {
  const candidates = [{ rootId: "named", candidateUci: "e2e4", phase: "opening", focus: null },
    { rootId: "empty", candidateUci: "d2d4", phase: "endgame", focus: "quiet_plan" }];
  const third = ["e2e4", "e7e5", "g1f3"], fourth = [...third, "b8c6"];
  const pathId = sha(JSON.stringify(["named", ...third]));
  const q = { availability: "unknown_partial_quantifiers", execution: "unknown_unexecuted_or_partial", omittedPreparations: ["c7c5"] };
  const preparations = [{ preparationUci: "e7e5", observed: [{ pathId, opportunity: false, executedLeaves: [] }], unvisitedDefences: ["b1c3"] }];
  const projection = { targetId: "target", immediate: "denied", rawQuantifier: q, preparations,
    licensedAvailability: q.availability, opportunityObserved: false, executionObserved: false };
  const reference = { rows: [{ ...candidates[0], targetId: "target", immediate: "denied",
    arms: settings.map(setting => ({ setting, family: "engine_beam", rawQuantifier: structuredClone(q),
      preparations: structuredClone(preparations), selectedPredecessorPaths: 1, selectedFourthPlyLeaves: 1,
      licensedAvailability: q.availability, observedReach: false, observedExecution: false })) }] };
  const cases = [...costCases({ settings: settings.map(id => ({ id })), candidates, horizons: [2, 4],
    regimes: ["cold", "warm", "provider_offline"] })];
  const records = cases.map(cell => {
    const kind = cell.rootId === "empty" ? "no_target" : cell.regime === "provider_offline" ? "source_unavailable" : "available";
    return { row: { ...cell, kind, providerQueries: [] }, raw: { result: { kind,
      projections: cell.rootId === "empty" ? [] : [structuredClone(projection)],
      observations: cell.rootId === "empty" ? [] : (cell.horizon === 2 ? [third.slice(0, 2)] : [third.slice(0, 2), third, fourth])
        .map(history => ({ targetId: "target", history: [...history] })) } } };
  });
  const leafId = sha(JSON.stringify(["named", ...fourth]));
  const continuation = { profiles: [{ kind: "engine", paths: [{ id: pathId, rootId: "named", historyUci: third,
    arms: settings.map(arm => ({ arm, selected: [{ moveUci: fourth[3], leafId }] })) }],
    rows: candidates.map(c => ({ ...c, arms: settings.map(arm => ({ arm,
      selectedPaths: c.rootId === "named" ? [pathId] : [], selectedFourthPlyEdges: c.rootId === "named" ? 1 : 0 })) })) }],
    leaves: [{ id: leafId, rootId: "named", historyUci: fourth }] };
  return { records, candidates, reference, continuation };
}
const run = x => summarizeEngineWidthSensitivity(x.records, x.candidates, x.reference, x.continuation);
const mutateLive = (x, fn) => {
  for (const r of x.records.filter(r => r.row.rootId === "named" && r.row.setting === settings[0] && r.row.horizon === 4
    && r.row.regime !== "provider_offline")) fn(r);
};
test("all three complete widths retain no-target/offline/two-ply inventory and exact cache pairs", () => {
  const value = run(fixture());
  assert.equal(value.rows, 36); assert.equal(value.retainedCases.length, 36); assert.equal(value.pairedCases, 12);
  assert.deepEqual(value.cachePairs, { identicalCompiled: 12, failedColdMissingWarmReceipt: 0 });
  assert.equal(value.cells.length, 3); assert.ok(value.cells.every(x => Object.values(x.changed).every(v => !v)));
  assert.equal(value.groups.reduce((n, x) => n + x.noTarget, 0), 3);
  assert.equal(value.productionProfileSelected, false); assert.equal(value.moveReason, "not_an_engine_reason");
});
test("actual third-ply history identity changes cannot hide behind identical counts", () => {
  const x = fixture(); mutateLive(x, r => { r.raw.result.observations.find(o => o.history.length === 3).history[2] = "b1c3"; });
  const cell = run(x).cells.find(x => x.setting === settings[0]);
  assert.equal(cell.changed.frontier, true); assert.equal(cell.changed.outcome, false);
  assert.equal(cell.before.frontier.thirdPathIds.length, cell.after.frontier.thirdPathIds.length);
});
test("visited fourth-ply count and executed-witness identity remain separate", () => {
  const x = fixture(); mutateLive(x, r => {
    r.raw.result.observations.push({ targetId: "target", history: ["e2e4", "e7e5", "g1f3", "g8f6"] });
    r.raw.result.projections[0].preparations[0].observed[0].executedLeaves = ["witness"];
    r.raw.result.projections[0].executionObserved = true;
  });
  const cell = run(x).cells.find(x => x.setting === settings[0]);
  assert.deepEqual(cell.after.frontier.executedLeafIds, ["witness"]);
  assert.equal(cell.after.frontier.fourthLeaves, 2); assert.equal(cell.changed.outcome, true);
});
test("different fourth paths with identical counts still change the complete frontier", () => {
  const x = fixture(); mutateLive(x, r => { r.raw.result.observations.find(o => o.history.length === 4).history[3] = "g8f6"; });
  const cell = run(x).cells.find(x => x.setting === settings[0]);
  assert.equal(cell.changed.frontier, true); assert.equal(cell.changed.outcome, false);
  assert.equal(cell.before.frontier.fourthLeaves, cell.after.frontier.fourthLeaves);
  assert.notDeepEqual(cell.before.frontier.fourthPathIds, cell.after.frontier.fourthPathIds);
});
test("changed omissions remain unknown coverage, not manufactured prevention or engine cause", () => {
  const x = fixture(); mutateLive(x, r => { r.raw.result.projections[0].rawQuantifier.omittedPreparations = ["f7f6"]; });
  const cell = run(x).cells.find(x => x.setting === settings[0]);
  assert.equal(cell.changed.coverage, true); assert.equal(cell.changed.outcome, false);
  assert.equal(cell.after.outcome.availability, "unknown_partial_quantifiers");
});
test("immediate preserved normalization does not manufacture changed reach", () => {
  const x = fixture(); x.reference.rows[0].immediate = "preserved";
  x.reference.rows[0].arms.forEach(a => { a.observedReach = true; });
  x.records.forEach(r => r.raw.result.projections.forEach(p => { p.immediate = "preserved"; }));
  assert.ok(run(x).cells.every(c => !c.changed.outcome && c.after.outcome.observedReach));
});
test("failed cold and unavailable warm retain partial witnesses, never a false negative comparison", () => {
  const x = fixture(); mutateLive(x, r => {
    r.row.kind = r.row.regime === "cold" ? "invalid_source" : "source_unavailable";
    r.raw.result.kind = r.row.kind;
  });
  const value = run(x), cell = value.cells.find(x => x.setting === settings[0]);
  assert.equal(value.cachePairs.failedColdMissingWarmReceipt, 1);
  assert.equal(cell.status, "invalid_source"); assert.equal(cell.retainedObservations, 3);
  assert.equal(cell.changed, undefined); assert.equal(cell.after, undefined);
});
test("shared node exhaustion can replay identically without being called a missing source", () => {
  const x = fixture(); mutateLive(x, r => { r.row.kind = "budget_exhausted"; r.raw.result.kind = r.row.kind; });
  const value = run(x);
  assert.equal(value.cachePairs.failedColdMissingWarmReceipt, 0);
  assert.equal(value.cells.find(x => x.setting === settings[0]).status, "budget_exhausted");
});
test("identical unavailable outputs remain failed-source pairs, not cache successes", () => {
  const x = fixture(); mutateLive(x, r => { r.row.kind = "source_unavailable"; r.raw.result.kind = r.row.kind; });
  const value = run(x);
  assert.equal(value.cachePairs.failedColdMissingWarmReceipt, 1); assert.equal(value.cachePairs.identicalCompiled, 11);
});
test("source timeout is distinct from shared traversal node exhaustion", () => {
  const x = fixture(); mutateLive(x, r => {
    r.row.kind = r.row.regime === "cold" ? "budget_exhausted" : "source_unavailable"; r.raw.result.kind = r.row.kind;
    r.row.providerQueries = [{ state: r.row.regime === "cold" ? "timed_out" : "unavailable" }];
  });
  assert.equal(run(x).cachePairs.failedColdMissingWarmReceipt, 1);
});
for (const mode of ["missing_case", "duplicate_case", "foreign_setting", "foreign_candidate", "foreign_horizon", "foreign_regime",
  "lost_target", "duplicate_target", "foreign_target", "duplicate_reference_target", "foreign_reference_candidate", "missing_reference_arm",
  "foreign_reference_family", "warm_changed", "fresh_warm_query", "crossed_immediate", "duplicate_third_path", "false_third_count",
  "invalid_fourth_count", "duplicate_preparation", "duplicate_executed_witness", "duplicate_omission"])
  test(`engine width sensitivity refuses ${mode}`, () => {
    const x = fixture(), first = x.records[0], arm = x.reference.rows[0].arms[0];
    if (mode === "missing_case") x.records.pop();
    if (mode === "duplicate_case") x.records.push(structuredClone(first));
    if (mode === "foreign_setting") first.row.setting = "engine:depth12:top2";
    if (mode === "foreign_candidate") first.row.candidateUci = "b1c3";
    if (mode === "foreign_horizon") first.row.horizon = 3;
    if (mode === "foreign_regime") first.row.regime = "hot";
    if (mode === "lost_target") first.raw.result.projections = [];
    if (mode === "duplicate_target") first.raw.result.projections.push(structuredClone(first.raw.result.projections[0]));
    if (mode === "foreign_target") first.raw.result.projections[0].targetId = "foreign";
    if (mode === "duplicate_reference_target") x.reference.rows.push(structuredClone(x.reference.rows[0]));
    if (mode === "foreign_reference_candidate") x.reference.rows[0].rootId = "foreign";
    if (mode === "missing_reference_arm") x.reference.rows[0].arms.pop();
    if (mode === "foreign_reference_family") arm.family = "provider_line";
    if (mode === "warm_changed") x.records.find(r => r.row.regime === "warm").raw.result.projections[0].executionObserved = true;
    if (mode === "fresh_warm_query") x.records.find(r => r.row.regime === "warm").row.providerQueries = [{ state: "executed" }];
    if (mode === "crossed_immediate") mutateLive(x, r => { r.raw.result.projections[0].immediate = "preserved"; });
    if (mode === "duplicate_third_path") arm.preparations[0].observed.push(structuredClone(arm.preparations[0].observed[0]));
    if (mode === "false_third_count") arm.selectedPredecessorPaths = 0;
    if (mode === "invalid_fourth_count") arm.selectedFourthPlyLeaves = -1;
    if (mode === "duplicate_preparation") arm.preparations.push(structuredClone(arm.preparations[0]));
    if (mode === "duplicate_executed_witness") arm.preparations[0].observed[0].executedLeaves = ["same", "same"];
    if (mode === "duplicate_omission") arm.rawQuantifier.omittedPreparations.push(arm.rawQuantifier.omittedPreparations[0]);
    assert.throws(() => run(x), /D3262_ENGINE_WIDTH_SENSITIVITY/);
  });
test("unsafe or repeated archive names refuse before source reads", () => {
  for (const names of [[], ["../escape.json.gz"], ["other.json.gz"],
    ["d3262-cost-live-engine-a.json.gz", "d3262-cost-live-engine-a.json.gz"]])
    assert.throws(() => loadEngineWidthSensitivity(names), /D3262_ENGINE_WIDTH_SENSITIVITY/);
});
for (const mode of ["missing_population", "missing_arm", "false_fourth_count", "crossed_third_history", "crossed_fourth_history", "lost_leaf"])
  test(`frozen full-frontier source refuses ${mode}`, () => {
    const x = fixture(), profile = x.continuation.profiles[0];
    if (mode === "missing_population") profile.rows.pop();
    if (mode === "missing_arm") profile.rows[0].arms.pop();
    if (mode === "false_fourth_count") profile.rows[0].arms[0].selectedFourthPlyEdges = 0;
    if (mode === "crossed_third_history") profile.paths[0].historyUci[2] = "b1c3";
    if (mode === "crossed_fourth_history") x.continuation.leaves[0].historyUci[3] = "g8f6";
    if (mode === "lost_leaf") x.continuation.leaves = [];
    assert.throws(() => run(x), /D3262_ENGINE_WIDTH_SENSITIVITY/);
  });
test("all real frozen target/third/fourth identities bind the complete source chain", () => {
  const directory = "planning/semantic-consequence-search", name = Object.keys(sourcePins)[0];
  const bytes = readFileSync(`${directory}/${name}`);
  assert.equal(sha(bytes), sourcePins[name]);
  const reference = JSON.parse(gunzipSync(bytes));
  const targetName = "d3262-coherent-engine-target-outcome.json.gz", targetBytes = readFileSync(`${directory}/${targetName}`);
  assert.equal(sha(targetBytes), reference.inputDigests[targetName]);
  const target = JSON.parse(gunzipSync(targetBytes));
  const continuationName = "d3262-coherent-engine-fourth-ply.json.gz", continuationBytes = readFileSync(`${directory}/${continuationName}`);
  assert.equal(sha(continuationBytes), target.inputDigests[continuationName]);
  const candidates = loadCostPlan().candidates;
  const indexed = indexEngineContinuation(JSON.parse(gunzipSync(continuationBytes)), candidates);
  assert.equal(indexed.size, 193 * 3);
  let checked = 0;
  for (const cell of reference.rows) for (const setting of settings) {
    const arm = cell.arms.find(x => x.setting === setting);
    const bound = indexed.get(JSON.stringify([cell.rootId, cell.candidateUci, setting]));
    assert.deepEqual(arm.preparations.flatMap(p => p.observed.map(o => o.pathId)).sort(), bound.third);
    assert.equal(arm.selectedFourthPlyLeaves, bound.fourth.length); checked++;
  }
  assert.equal(checked, 182 * 3);
});
