import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { costCases, loadCostPlan, sha } from "./cost-contract.mjs";
import { recursiveSettings, summarizeRecursiveSensitivity, indexRecursiveContinuation,
  indexLiveRecursiveFrontier, loadFrozenRecursiveSensitivity, loadRecursiveSensitivity } from "./cost-recursive-sensitivity.mjs";
import { verifyPackedCostValue } from "./cost-pack.mjs";

// Synthetic identity/custody controls, not measured chess or engine evidence.
const id = (root, history) => sha(JSON.stringify([root, ...history]));
function fixture(budget = "depth8") {
  const settings = recursiveSettings(budget);
  const candidates = [{ rootId: "named", candidateUci: "e2e4", phase: "opening", focus: null },
    { rootId: "empty", candidateUci: "d2d4", phase: "endgame", focus: "quiet_plan" }];
  const reference = { rows: [] }, paths = [], nodes = [], frozenRows = [], projections = [], observations = [];
  for (const [targetId, prep, learner, last] of [["targetA", "e7e5", "g1f3", "b8c6"], ["targetB", "c7c5", "b1c3", "g8f6"]]) {
    const third = ["e2e4", prep, learner], fourth = [...third, last], pathId = id("named", third), leafId = id("named", fourth);
    const rawQuantifier = { availability: "unknown_partial_quantifiers", execution: "unknown_unexecuted_or_partial",
      omittedPreparations: ["f7f6"] };
    const preparations = [{ preparationUci: prep, observed: [{ pathId, learnerUci: learner, opportunity: false, executedLeaves: [] }],
      unvisitedDefences: ["a2a3"], unexpandedTerminalLegalMoves: 0 }];
    const projection = { targetId, immediate: "denied", rawQuantifier, preparations,
      licensedAvailability: rawQuantifier.availability, opportunityObserved: false, executionObserved: false };
    projections.push(projection);
    for (const history of [third.slice(0, 2), third, fourth]) observations.push({ targetId, history,
      observation: { executedAtFourthPly: false } });
    reference.rows.push({ ...candidates[0], targetId, immediate: "denied", arms: settings.map(setting => ({
      ...structuredClone(projection), setting, family: "recursive_semantic", selectedPredecessorPaths: 1,
      selectedFourthPlyLeaves: 1, observedReach: false, observedExecution: false })) });
    paths.push({ id: pathId, rootId: "named", historyUci: third, terminalReason: null,
      subjects: [{ targetId, selectedBy: [...settings] }] });
    nodes.push(...settings.map(arm => ({ pathId, targetId, arm, status: "no_legal_event",
      selected: [{ moveUci: last, leafId }] })));
    frozenRows.push({ ...candidates[0], targetId, arms: settings.map(arm => ({ arm, selectedReplyUcis: [prep],
      replies: [{ replyUci: prep, selected: [{ learnerUci: learner, pathId }] }] })) });
  }
  const continuation = { profile: "d3262-coherent-recursive-fourth-ply-v1", providerOff: false,
    authority: "disposable_actual_recursive_geometry_selected_paths_not_profit_proof_or_complete_arm5",
    rows: frozenRows, paths, finalPlyNodes: nodes, candidateCoverage: structuredClone(candidates) };
  const cases = [...costCases({ candidates, settings: settings.map(id => ({ id })), horizons: [2, 4],
    regimes: ["cold", "warm", "provider_offline"] })];
  const records = cases.map(cell => {
    const kind = cell.rootId === "empty" ? "no_target" : cell.regime === "provider_offline" ? "source_unavailable" : "available";
    return { row: { ...cell, kind, providerQueries: [] }, raw: { result: { kind,
      projections: cell.rootId === "empty" ? [] : structuredClone(projections),
      observations: cell.rootId === "empty" ? [] : structuredClone(observations.filter(o => o.history.length <= cell.horizon)) } } };
  });
  return { records, candidates, reference, continuation, budget };
}
const run = x => summarizeRecursiveSensitivity(x.records, x.candidates, x.reference, x.continuation, x.budget);
const livePair = (x, fn) => x.records.filter(r => r.row.rootId === "named" && r.row.setting === recursiveSettings(x.budget)[0]
  && r.row.horizon === 4 && r.row.regime !== "provider_offline").forEach(fn);
test("complete six-setting population preserves two target-specific frontiers and all cache/no-target/offline/two-ply cases", () => {
  const value = run(fixture());
  assert.equal(value.rows, 72); assert.equal(value.retainedCases.length, 72); assert.equal(value.pairedCases, 24);
  assert.deepEqual(value.cachePairs, { identicalCompiled: 24, failedColdMissingWarmReceipt: 0 });
  assert.equal(value.cells.length, 12); assert.ok(value.cells.every(c => Object.values(c.changed).every(v => !v)));
  const [a, b] = value.cells; assert.notDeepEqual(a.before.frontier.thirdPathIds, b.before.frontier.thirdPathIds);
  assert.equal(value.groups.reduce((n, g) => n + g.noTarget, 0), 6);
  assert.equal(value.productionProfileSelected, false); assert.equal(value.moveReason, "not_an_engine_reason");
});
test("same-size changed target-specific third and fourth histories cannot hide behind counts", () => {
  const x = fixture(); livePair(x, r => {
    const p = r.raw.result.projections[0], third = ["e2e4", "e7e5", "f1c4"];
    p.preparations[0].observed[0].learnerUci = "f1c4"; p.preparations[0].observed[0].pathId = id("named", third);
    r.raw.result.observations.filter(o => o.targetId === "targetA" && o.history.length >= 3).forEach(o => { o.history[2] = "f1c4"; });
  });
  const value = run(x), a = value.cells[0], b = value.cells[1];
  assert.equal(a.changed.frontier, true); assert.equal(a.changed.outcome, false);
  assert.equal(a.before.frontier.fourthLeaves, a.after.frontier.fourthLeaves);
  assert.ok(Object.values(b.changed).every(v => !v));
});
test("fourth-path change alone remains distinct from an executed-witness change", () => {
  const x = fixture(); livePair(x, r => { r.raw.result.observations.find(o => o.targetId === "targetA" && o.history.length === 4).history[3] = "d7d6"; });
  const cell = run(x).cells[0]; assert.equal(cell.changed.frontier, true); assert.equal(cell.changed.outcome, false);
  assert.equal(cell.after.frontier.fourthLeaves, 1); assert.deepEqual(cell.after.frontier.executedLeafIds, []);
});
test("executed witness uses the exact fourth history, not a narrative or visited count", () => {
  const x = fixture(); livePair(x, r => {
    const p = r.raw.result.projections[0], o = r.raw.result.observations.find(o => o.targetId === "targetA" && o.history.length === 4);
    o.observation.executedAtFourthPly = true; p.preparations[0].observed[0].executedLeaves = [id("named", o.history)];
    p.executionObserved = true;
  });
  const cell = run(x).cells[0]; assert.equal(cell.changed.frontier, true); assert.equal(cell.changed.outcome, true);
  assert.equal(cell.after.frontier.executedLeafIds.length, 1);
});
test("changed omissions remain partial coverage rather than a prevention claim", () => {
  const x = fixture(); livePair(x, r => { r.raw.result.projections[0].rawQuantifier.omittedPreparations = ["d7d5"]; });
  const cell = run(x).cells[0]; assert.equal(cell.changed.coverage, true); assert.equal(cell.changed.outcome, false);
  assert.equal(cell.after.outcome.availability, "unknown_partial_quantifiers");
});
test("immediate preservation normalizes reach but does not invent execution", () => {
  const x = fixture(); x.reference.rows.forEach(c => { c.immediate = "preserved"; c.arms.forEach(a => { a.observedReach = true; }); });
  x.records.forEach(r => r.raw.result.projections.forEach(p => { p.immediate = "preserved"; }));
  assert.ok(run(x).cells.every(c => !c.changed.outcome && c.after.outcome.observedReach && !c.after.outcome.observedExecution));
});
for (const kind of ["invalid_source", "source_unavailable", "budget_exhausted", "absorbing_terminal"]) {
  test(`${kind} retains partial outcomes and cannot become a false negative comparison`, () => {
    const x = fixture(); livePair(x, r => {
      r.row.kind = kind === "invalid_source" && r.row.regime === "warm" ? "source_unavailable" : kind;
      r.raw.result.kind = r.row.kind;
    });
    const value = run(x), cell = value.cells[0]; assert.equal(cell.status, kind); assert.equal(cell.changed, undefined);
    assert.equal(cell.retainedObservations, 3); assert.equal(value.cachePairs.failedColdMissingWarmReceipt,
      ["invalid_source", "source_unavailable"].includes(kind) ? 1 : 0);
  });
}
test("a source timeout is not shared traversal node exhaustion", () => {
  const x = fixture(); livePair(x, r => {
    r.row.kind = r.row.regime === "cold" ? "budget_exhausted" : "source_unavailable"; r.raw.result.kind = r.row.kind;
    r.row.providerQueries = [{ state: r.row.regime === "cold" ? "timed_out" : "unavailable" }];
  });
  assert.equal(run(x).cachePairs.failedColdMissingWarmReceipt, 1);
});
const mutations = {
  missingCase: x => x.records.pop(), duplicateCase: x => x.records.push(structuredClone(x.records[0])),
  wrongSetting: x => { x.records[0].row.setting = "semantic:depth8:top2:top8"; },
  wrongBudget: x => { x.records[0].row.setting = "recursive:depth12:top2:top8"; },
  wrongHorizon: x => { x.records[0].row.horizon = 3; }, wrongRegime: x => { x.records[0].row.regime = "hot"; },
  wrongCandidate: x => { x.records[0].row.candidateUci = "a2a3"; },
  resultKind: x => { x.records[0].raw.result.kind = "invalid_source"; },
  missingTarget: x => x.records[0].raw.result.projections.pop(),
  duplicateTarget: x => x.records[0].raw.result.projections.push(structuredClone(x.records[0].raw.result.projections[0])),
  wrongTarget: x => { x.records[0].raw.result.projections[0].targetId = "other"; },
  freshWarmQuery: x => { x.records.find(r => r.row.regime === "warm").row.providerQueries = [{ state: "executed" }]; },
  changedWarmEvidence: x => { x.records.find(r => r.row.regime === "warm").raw.result.projections[0].executionObserved = true; },
  duplicateReference: x => x.reference.rows.push(structuredClone(x.reference.rows[0])),
  duplicateFrozenTarget: x => x.continuation.rows.push(structuredClone(x.continuation.rows[0])),
  missingFrozenTarget: x => x.continuation.rows.pop(),
  foreignFrozenTarget: x => { x.continuation.rows[0].targetId = "other"; },
  lostCandidate: x => x.continuation.candidateCoverage.pop(),
  duplicateCandidate: x => x.continuation.candidateCoverage.push(structuredClone(x.continuation.candidateCoverage[0])),
  duplicateFrozenPath: x => x.continuation.paths.push(structuredClone(x.continuation.paths[0])),
  duplicateFrozenNode: x => x.continuation.finalPlyNodes.push(structuredClone(x.continuation.finalPlyNodes[0])),
  missingFrozenNode: x => x.continuation.finalPlyNodes.shift(),
  wrongFrozenHistory: x => { x.continuation.paths[0].historyUci[2] = "f1c4"; },
  wrongFrozenLeaf: x => { x.continuation.finalPlyNodes[0].selected[0].moveUci = "d7d6"; },
  crossedTargetNode: x => { x.continuation.finalPlyNodes[0].targetId = "targetB"; },
  crossedTargetSubject: x => { x.continuation.paths[0].subjects[0].targetId = "targetB"; },
  missingSubjectSetting: x => x.continuation.paths[0].subjects[0].selectedBy.shift(),
  extendedTerminal: x => { x.continuation.paths[0].terminalReason = "checkmate"; },
  unavailableFrozenNode: x => { x.continuation.finalPlyNodes[0].status = "source_off"; },
  missingFrozenArm: x => x.continuation.rows[0].arms.pop(),
  missingReferenceArm: x => x.reference.rows[0].arms.pop(),
  duplicateReferenceArm: x => x.reference.rows[0].arms.push(structuredClone(x.reference.rows[0].arms[0])),
  wrongReferenceFamily: x => { x.reference.rows[0].arms[0].family = "engine_beam"; },
  wrongThirdCount: x => { x.reference.rows[0].arms[0].selectedPredecessorPaths = 0; },
  wrongFourthCount: x => { x.reference.rows[0].arms[0].selectedFourthPlyLeaves = 0; },
  wrongFrozenWitness: x => { x.reference.rows[0].arms[0].preparations[0].observed[0].executedLeaves = ["foreign"]; },
  wrongPreparation: x => { x.reference.rows[0].arms[0].preparations[0].preparationUci = "c7c5"; },
  duplicateLiveHistory: x => livePair(x, r => r.raw.result.observations.push(structuredClone(r.raw.result.observations[0]))),
  orphanLiveLeaf: x => livePair(x, r => { r.raw.result.observations.find(o => o.history.length === 4).history[2] = "f1c4"; }),
  crossedLiveCandidate: x => livePair(x, r => { r.raw.result.observations[0].history[0] = "a2a3"; }),
  crossedLivePath: x => livePair(x, r => { r.raw.result.projections[0].preparations[0].observed[0].pathId = "foreign"; }),
  inventedWitness: x => livePair(x, r => { r.raw.result.projections[0].preparations[0].observed[0].executedLeaves = ["foreign"]; }),
  lostLiveProjection: x => livePair(x, r => { r.raw.result.projections[0].preparations[0].observed = []; }),
  duplicateOmission: x => livePair(x, r => { r.raw.result.projections[0].rawQuantifier.omittedPreparations = ["same", "same"]; }),
  crossedImmediate: x => livePair(x, r => { r.raw.result.projections[0].immediate = "preserved"; }),
};
for (const [name, mutate] of Object.entries(mutations)) test(`recursive reader refuses ${name}`, () => {
  const x = fixture(); mutate(x); assert.throws(() => run(x), /D3262_RECURSIVE_SENSITIVITY/);
});
for (const budget of ["depth12", "movetime100"]) test(`${budget} retains its own complete six settings`, () => {
  const value = run(fixture(budget)); assert.equal(value.rows, 72);
  assert.ok(value.cells.every(c => c.setting.startsWith(`recursive:${budget}:`)));
  assert.ok(value.cells.every(c => Object.values(c.changed).every(v => !v)));
});
test("undeclared budgets and unsafe/repeated names refuse before file reads", () => {
  for (const budget of [null, false, 8, "depth10", "movetime200", "../escape"])
    assert.throws(() => loadRecursiveSensitivity([], budget), /D3262_RECURSIVE_SENSITIVITY/);
  for (const names of [[], ["../escape.json.gz"], ["foreign.json.gz"], ["d3262-cost-live-a.json.gz", "d3262-cost-live-a.json.gz"]])
    assert.throws(() => loadRecursiveSensitivity(names), /D3262_RECURSIVE_SENSITIVITY/);
});
test("all eighteen real frozen recursive settings bind 182 target-specific third/fourth frontiers through the checksum chain", () => {
  const frozen = loadFrozenRecursiveSensitivity(), candidates = loadCostPlan().candidates;
  assert.equal(Object.keys(frozen.inputs).length, 4);
  let total = 0;
  for (const budget of ["depth8", "depth12", "movetime100"]) {
    const indexed = indexRecursiveContinuation(frozen.continuation, candidates, frozen.reference, budget);
    assert.equal(indexed.size, 182 * 6); total += indexed.size;
    for (const cell of frozen.reference.rows) for (const setting of recursiveSettings(budget)) {
      const arm = cell.arms.find(a => a.setting === setting);
      const bound = indexed.get(JSON.stringify([cell.rootId, cell.candidateUci, cell.targetId, setting]));
      assert.deepEqual(bound.third, arm.preparations.flatMap(p => p.observed.map(o => o.pathId)).sort());
      assert.equal(bound.fourth.length, arm.selectedFourthPlyLeaves);
    }
  }
  assert.equal(total, 3276);
});
test("previously captured complete recursive top-two population supplies actual live target/history/witness bindings without filling five missing settings", () => {
  const records = [];
  for (const name of ["d3262-cost-live-recursive-top2-initial-2026-10-06.json.gz",
    "d3262-cost-live-recursive-top2-population-2026-10-06.json.gz"]) {
    const pack = JSON.parse(gunzipSync(readFileSync(`planning/semantic-consequence-search/${name}`)));
    verifyPackedCostValue(pack);
    records.push(...pack.groups.flatMap(g => JSON.parse(gunzipSync(Buffer.from(g.base64, "base64")))));
  }
  assert.equal(records.length, 1158);
  let cells = 0;
  for (const { row, raw } of records.filter(r => r.row.horizon === 4 && r.row.regime === "cold" && r.row.kind === "available"))
    for (const projection of raw.result.projections) {
      const frontier = indexLiveRecursiveFrontier(row, raw.result, projection);
      assert.equal(frontier.thirdPathIds.length, projection.preparations.reduce((n, p) => n + p.observed.length, 0));
      cells++;
    }
  assert.equal(cells, 182);
  const frozen = loadFrozenRecursiveSensitivity();
  assert.throws(() => summarizeRecursiveSensitivity(records, loadCostPlan().candidates, frozen.reference, frozen.continuation),
    /incomplete recursive population/);
});
