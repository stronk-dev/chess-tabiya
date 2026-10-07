import assert from "node:assert/strict";
import test from "node:test";
import { costCases, loadCostPlan, sha } from "./cost-contract.mjs";
import { jointStop } from "./coherent-horizon-policy.mjs";
import { modelSettings, indexFrozenModel, liveModelPolicy, summarizeModelSensitivity,
  loadFrozenModelSensitivity, loadModelSensitivity } from "./cost-model-sensitivity.mjs";

// Synthetic identity/mass controls. No inference, human frequency or chess truth.
const id = history => sha(JSON.stringify(["named", ...history]));
const coverage = (edges, threshold, horizon = 4) => {
  const observedLayerMasses = Array.from({ length: horizon === 4 ? 3 : 1 }, (_, i) => edges.filter(e => e.history.length === i + 2
    || e.history.length < i + 2 && e.terminalReason !== null).reduce((n, e) => n + e.jointMass, 0));
  return { complete: true, observedLayerMasses, frontierMass: observedLayerMasses.at(-1), observedFrontierMass: observedLayerMasses.at(-1),
    stopRule: jointStop(threshold, observedLayerMasses.at(-1), false, observedLayerMasses.length),
    policyMeaning: "both_sides_configured_model_not_human_frequency_or_arbitrary_learner",
    selectionRule: "per_node_prefix_includes_overshoot_max8_not_joint_threshold_selector" };
};
function fixture() {
  const candidates = [{ rootId: "named", candidateUci: "e2e4", phase: "opening", focus: null },
    { rootId: "empty", candidateUci: "d2d4", phase: "middlegame", focus: "quiet_plan" }];
  const third = ["e2e4", "e7e5", "g1f3"], fourth = [...third, "b8c6"], mass = 0.95 * 0.9;
  const root = { history: third.slice(0, 1), state: "executed", parentJointMass: 1, selected: [{ legalUci: third[1], mass: 0.95 }] };
  const middle = { history: third.slice(0, 2), state: "executed", parentJointMass: 0.95, selected: [{ legalUci: third[2], mass: 0.9 }] };
  const last = { history: third, state: "executed", parentJointMass: mass, selected: [{ legalUci: fourth[3], mass: 0.85 }] };
  const edges = [third.slice(0, 2), third, fourth].map((history, i) => ({ history, conditionalMass: [0.95, 0.9, 0.85][i],
    jointMass: [0.95, mass, mass * 0.85][i], terminalReason: null }));
  const rawQuantifier = { availability: "unknown_partial_quantifiers", execution: "unknown_unexecuted_or_partial", omittedPreparations: ["c7c5"] };
  const preparations = [{ preparationUci: third[1], observed: [{ pathId: id(third), learnerUci: third[2], opportunity: false, executedLeaves: [] }],
    unvisitedDefences: ["a2a3"], unexpandedTerminalLegalMoves: 0 }];
  const projections = ["targetA", "targetB"].map(targetId => ({ targetId, immediate: "denied", rawQuantifier: structuredClone(rawQuantifier),
    preparations: structuredClone(preparations), licensedAvailability: rawQuantifier.availability, opportunityObserved: false, executionObserved: false }));
  const reference = { rows: projections.map(p => ({ ...candidates[0], targetId: p.targetId, immediate: p.immediate,
    arms: modelSettings.map(setting => ({ ...structuredClone(p), setting, family: "configured_model", selectedPredecessorPaths: 1,
      selectedFourthPlyLeaves: 1, observedReach: false, observedExecution: false })) })) };
  const continuation = { profile: "d3262-coherent-maia-fourth-ply-v1",
    authority: "three_policy_layer_configured_model_frontier_not_human_frequency_exact_proof_or_engine_reason",
    rows: candidates.map((c, i) => ({ ...c, terminalAfterCandidate: false, arms: modelSettings.map(arm => ({ arm,
      selectedThirdPlyPaths: i === 0 ? 1 : 0, selectedFourthPlyEdges: i === 0 ? 1 : 0,
      firstCoveredMass: i === 0 ? 0.95 : 0, twoLayerMass: i === 0 ? mass : 0, frontierMass: i === 0 ? mass * 0.85 : 0 })) })),
    paths: [{ id: id(third), rootId: "named", historyUci: third, conditionalReplyMass: 0.95, conditionalLearnerMass: 0.9,
      terminalReason: null, arms: modelSettings.map(arm => ({ arm, pathMass: mass,
        selected: [{ leafId: id(fourth), moveUci: fourth[3], conditionalMass: 0.85, jointMass: mass * 0.85 }] })) }],
    leaves: [{ id: id(fourth), rootId: "named", historyUci: fourth, selectedBy: [...modelSettings] }] };
  const policy = { profile: "d3262-coherent-horizon-policy-v1", policyStops: candidates.map((c, i) => ({ ...c,
    arms: modelSettings.map(arm => ({ arm, firstSelectedReplyUcis: i === 0 ? [third[1]] : [],
      horizons: [0.95, mass, mass * 0.85].map((value, j) => ({ plies: j + 2, ...jointStop(Number(arm.slice(11)), i === 0 ? value : 0, false, j + 1) })) })) })) };
  const firstSources = candidates.map((c, i) => ({ ...c, historyUci: [c.candidateUci],
    configuredSupport: i === 0 ? [{ legalUci: third[1], mass: 0.95 }] : [] }));
  const frozen = { continuation, policy, firstSources };
  const cases = [...costCases({ candidates, settings: modelSettings.map(id => ({ id })), horizons: [2, 4], regimes: ["cold", "warm", "provider_offline"] })];
  const records = cases.map(cell => {
    const empty = cell.rootId === "empty", offline = cell.regime === "provider_offline";
    const kind = empty ? "no_target" : offline ? "source_unavailable" : "available";
    const selectedEdges = structuredClone(edges.filter(e => e.history.length <= cell.horizon));
    const modelFrontier = empty ? { nodes: [], edges: [], coverage: { status: "not_requested_no_target" } }
      : offline ? { nodes: [], edges: [], coverage: { complete: false, frontierMass: null } }
        : { nodes: structuredClone(cell.horizon === 2 ? [root] : [root, middle, last]), edges: selectedEdges,
          coverage: coverage(selectedEdges, Number(cell.setting.slice(11)), cell.horizon) };
    if (cell.regime === "warm") modelFrontier.nodes.forEach(n => { n.state = "cached"; });
    const live = empty ? [] : structuredClone(projections);
    if (cell.horizon === 2 || offline) live.forEach(p => { p.preparations.forEach(p => { p.observed = []; }); });
    return { row: { ...cell, kind, providerQueries: [] }, raw: { result: { kind, projections: live, modelFrontier,
      observations: empty || offline ? [] : projections.flatMap(p => selectedEdges.map(e => ({ targetId: p.targetId, history: [...e.history],
        observation: { executedAtFourthPly: false } }))) } } };
  });
  return { records, candidates, reference, frozen };
}
const run = x => summarizeModelSensitivity(x.records, x.candidates, x.reference, x.frozen);
const livePair = (x, fn) => x.records.filter(r => r.row.rootId === "named" && r.row.setting === modelSettings[0]
  && r.row.horizon === 4 && r.row.regime !== "provider_offline").forEach(fn);
function reweight(record, conditional = [0.95, 0.9, 0.85]) {
  const f = record.raw.result.modelFrontier; let mass = 1;
  f.edges.forEach((e, i) => { f.nodes[i].parentJointMass = mass; f.nodes[i].selected[0].mass = conditional[i];
    e.conditionalMass = conditional[i]; mass *= conditional[i]; e.jointMass = mass; });
  f.coverage = coverage(f.edges, Number(record.row.setting.slice(11)));
}
test("both complete prefixes retain all cases, shared target paths, cache pairs and no-policy no-target cases", () => {
  const value = run(fixture()); assert.equal(value.rows, 24); assert.equal(value.pairedCases, 8);
  assert.equal(value.cells.length, 4); assert.equal(value.policies.length, 4);
  assert.deepEqual(value.cachePairs, { identicalCompiled: 8, failedColdMissingWarmReceipt: 0 });
  assert.equal(value.cacheNodeTransitions, 8);
  assert.ok(value.cells.every(c => Object.values(c.changed).every(v => !v)));
  assert.ok(value.policies.filter(p => p.status === "compared").every(p => Object.values(p.changed).every(v => !v)));
  assert.equal(value.productionProfileSelected, false); assert.equal(value.moveReason, "not_an_engine_reason");
});
test("changed probability weights do not imply changed selected histories or chess outcomes", () => {
  const x = fixture(); livePair(x, r => reweight(r, [0.96, 0.9, 0.85]));
  const value = run(x), p = value.policies[0]; assert.equal(p.changed.weights, true); assert.equal(p.changed.layerMasses, true);
  assert.equal(p.changed.jointRule, false); assert.ok(value.cells.filter(c => c.setting === modelSettings[0]).every(c => Object.values(c.changed).every(v => !v)));
});
test("joint-rule status is separate from exact floating values and never normalized to one", () => {
  const x = fixture(); livePair(x, r => reweight(r, [0.95, 0.9, 0.99]));
  const p = run(x).policies[0]; assert.equal(p.changed.jointRule, true);
  assert.equal(p.before.stopRule.status, "frozen_frontier_exhausted_below_joint_threshold");
  assert.equal(p.after.stopRule.status, "joint_rule_satisfied"); assert.ok(p.after.layerMasses[2] < 1);
});
test("one-ULP input differences remain literal changes, not a changed chess verdict", () => {
  const x = fixture(); livePair(x, r => reweight(r, [0.95 + Number.EPSILON, 0.9, 0.85]));
  const value = run(x); assert.equal(value.policies[0].changed.weights, true);
  assert.equal(value.policies[0].changed.jointRule, false); assert.ok(value.cells.every(c => !c.changed.outcome));
});
test("same-count fourth-path changes cannot hide in a probability-only comparison", () => {
  const x = fixture(); livePair(x, r => {
    const f = r.raw.result.modelFrontier; f.nodes[2].selected[0].legalUci = "g8f6"; f.edges[2].history[3] = "g8f6";
    r.raw.result.observations.filter(o => o.history.length === 4).forEach(o => { o.history[3] = "g8f6"; });
  });
  const value = run(x); assert.equal(value.policies[0].changed.weights, true);
  assert.ok(value.cells.filter(c => c.setting === modelSettings[0]).every(c => c.changed.frontier && !c.changed.outcome));
});
test("target execution is bound to its own visited fourth history, not another target", () => {
  const x = fixture(); livePair(x, r => {
    const p = r.raw.result.projections[0], o = r.raw.result.observations.find(o => o.targetId === p.targetId && o.history.length === 4);
    o.observation.executedAtFourthPly = true; p.preparations[0].observed[0].executedLeaves = [id(o.history)]; p.executionObserved = true;
  });
  const value = run(x); assert.equal(value.cells[0].changed.outcome, true); assert.equal(value.cells[1].changed.outcome, false);
});
for (const terminalPly of [2, 3]) test(`terminal mass at ply ${terminalPly} carries forward without a further policy query`, () => {
  const x = fixture(), r = x.records.find(r => r.row.rootId === "named" && r.row.horizon === 4 && r.row.regime === "cold");
  const f = r.raw.result.modelFrontier;
  f.edges = f.edges.filter(e => e.history.length <= terminalPly);
  f.edges.at(-1).terminalReason = "CHECKMATE";
  f.nodes = f.nodes.filter(n => n.history.length < terminalPly);
  f.coverage = coverage(f.edges, Number(r.row.setting.slice(11)));
  const p = liveModelPolicy(r.row, r.raw.result);
  assert.equal(p.weights.length, terminalPly - 1);
  assert.equal(p.layerMasses[2], f.edges.at(-1).jointMass);
  assert.equal(f.nodes.length, terminalPly - 1);
});
test("unused historical first-source receipts never expand the declared candidate population", () => {
  const x = fixture(); x.frozen.firstSources.push({ rootId: "historical", candidateUci: "a2a3", historyUci: ["a2a3"], configuredSupport: [] });
  const value = run(x); assert.equal(value.retainedCandidates, 2); assert.equal(value.rows, 24);
  assert.equal(value.policies.length, 4);
});
for (const kind of ["invalid_source", "source_unavailable", "budget_exhausted", "absorbing_terminal"]) test(`${kind} stays unpaired, not zero model coverage or target absence`, () => {
  const x = fixture(); livePair(x, r => { r.row.kind = kind === "invalid_source" && r.row.regime === "warm" ? "source_unavailable" : kind; r.raw.result.kind = r.row.kind; });
  const value = run(x); assert.equal(value.policies[0].status, kind); assert.equal(value.cells[0].status, kind);
  assert.equal(value.cells[0].changed, undefined); assert.equal(value.cells[0].retainedObservations, 3);
  assert.equal(value.cachePairs.failedColdMissingWarmReceipt, ["invalid_source", "source_unavailable"].includes(kind) ? 1 : 0);
});
function partialSource(x, state) {
  livePair(x, r => {
    const warm = r.row.regime === "warm", kind = warm || state === "unavailable" ? "source_unavailable"
      : state === "invalid" ? "invalid_source" : "budget_exhausted";
    r.row.kind = kind; r.raw.result.kind = kind;
    r.row.providerQueries = [{ state: warm ? "unavailable" : state }];
    const f = r.raw.result.modelFrontier;
    f.edges = f.edges.filter(e => e.history.length < 4);
    f.nodes[2] = { ...f.nodes[2], state: warm ? "unavailable" : state, selected: null,
      coveredConditionalMass: null, residualConditionalMass: null };
    f.coverage = { complete: false, frontierMass: null, observedFrontierMass: 0 };
    r.raw.result.observations = r.raw.result.observations.filter(o => o.history.length < 4);
  });
}
for (const state of ["invalid", "timed_out", "unavailable"]) test(`a real ${state} policy node and missing warm receipt preserve unknown coverage and visited evidence`, () => {
  const x = fixture(); partialSource(x, state); const value = run(x);
  assert.equal(value.cachePairs.failedColdMissingWarmReceipt, 1);
  assert.equal(value.policies[0].retainedCoverage.frontierMass, null);
  assert.equal(value.cells[0].retainedObservations, 2);
  assert.equal(value.cells[0].changed, undefined);
});
test("a missing failed-policy receipt cannot invent zero mass", () => {
  const x = fixture(); partialSource(x, "invalid");
  x.records.find(r => r.row.rootId === "named" && r.row.horizon === 4 && r.row.regime === "warm").raw.result.modelFrontier.nodes[2].coveredConditionalMass = 0;
  assert.throws(() => run(x), /warm changed partial model evidence/);
});
const mutations = {
  missingCase: x => x.records.pop(), duplicateCase: x => x.records.push(structuredClone(x.records[0])),
  wrongSetting: x => { x.records[0].row.setting = "maia:prefix0.85"; }, wrongHorizon: x => { x.records[0].row.horizon = 3; },
  wrongRegime: x => { x.records[0].row.regime = "hot"; }, wrongCandidate: x => { x.records[0].row.rootId = "foreign"; },
  missingTarget: x => x.records[0].raw.result.projections.pop(), duplicateTarget: x => x.records[0].raw.result.projections.push(structuredClone(x.records[0].raw.result.projections[0])),
  changedWarm: x => { x.records.find(r => r.row.regime === "warm").raw.result.modelFrontier.edges[0].jointMass = 1; },
  freshWarm: x => { x.records.find(r => r.row.regime === "warm").row.providerQueries.push({ state: "executed" }); },
  freshWarmNode: x => { x.records.find(r => r.row.regime === "warm").raw.result.modelFrontier.nodes[0].state = "executed"; },
  changedWarmNode: x => { x.records.find(r => r.row.regime === "warm").raw.result.modelFrontier.nodes[0].state = "unavailable"; },
  missingFrozenCandidate: x => x.frozen.continuation.rows.pop(), duplicateFrozenCandidate: x => x.frozen.continuation.rows.push(structuredClone(x.frozen.continuation.rows[0])),
  missingFrozenPolicy: x => x.frozen.policy.policyStops.pop(), missingFirstSource: x => x.frozen.firstSources.pop(),
  crossedFirstHistory: x => { x.frozen.firstSources[0].historyUci[0] = "a2a3"; },
  crossedFrozenPrefix: x => { x.frozen.policy.policyStops[0].arms[0].firstSelectedReplyUcis[0] = "a7a6"; },
  crossedFrozenPath: x => { x.frozen.continuation.paths[0].historyUci[2] = "f1c4"; },
  lostFrozenLeaf: x => { x.frozen.continuation.leaves = []; },
  crossedFrozenLeaf: x => { x.frozen.continuation.leaves[0].historyUci[3] = "g8f6"; },
  frozenWrongProduct: x => { x.frozen.continuation.paths[0].arms[0].pathMass = 0.8; },
  frozenWrongLeafProduct: x => { x.frozen.continuation.paths[0].arms[0].selected[0].jointMass = 0.5; },
  frozenFalseCount: x => { x.frozen.continuation.rows[0].arms[0].selectedFourthPlyEdges = 0; },
  frozenExtendedTerminal: x => { x.frozen.continuation.paths[0].terminalReason = "checkmate"; },
  missingTargetArm: x => x.reference.rows[0].arms.pop(), wrongTargetFamily: x => { x.reference.rows[0].arms[0].family = "engine_beam"; },
  frozenForeignWitness: x => { x.reference.rows[0].arms[0].preparations[0].observed[0].executedLeaves = ["foreign"]; },
  frozenCrossedOperands: x => { x.reference.rows[0].arms[0].preparations[0].preparationUci = "c7c5"; },
  falseTargetCount: x => { x.reference.rows[0].arms[0].selectedPredecessorPaths = 0; },
  changedImmediate: x => livePair(x, r => { r.raw.result.projections[0].immediate = "preserved"; }),
  falseComplete: x => livePair(x, r => { r.raw.result.modelFrontier.coverage.complete = false; }),
  renamedPolicy: x => livePair(x, r => { r.raw.result.modelFrontier.coverage.policyMeaning = "human_frequency"; }),
  renamedSelector: x => livePair(x, r => { r.raw.result.modelFrontier.coverage.selectionRule = "joint_threshold_selector"; }),
  falseJointMass: x => livePair(x, r => { r.raw.result.modelFrontier.edges[2].jointMass = 1; }),
  falseConditional: x => livePair(x, r => { r.raw.result.modelFrontier.edges[0].conditionalMass = 0.1; }),
  falseCovered: x => livePair(x, r => { r.raw.result.modelFrontier.coverage.frontierMass = 1; }),
  falseStopRule: x => livePair(x, r => { r.raw.result.modelFrontier.coverage.stopRule.status = "joint_rule_satisfied"; }),
  orphanEdge: x => livePair(x, r => { r.raw.result.modelFrontier.edges[2].history[2] = "f1c4"; }),
  lostNode: x => livePair(x, r => r.raw.result.modelFrontier.nodes.splice(1, 1)),
  duplicateNode: x => livePair(x, r => r.raw.result.modelFrontier.nodes.push(structuredClone(r.raw.result.modelFrontier.nodes[0]))),
  duplicateEdge: x => livePair(x, r => r.raw.result.modelFrontier.edges.push(structuredClone(r.raw.result.modelFrontier.edges[0]))),
  terminalQuery: x => livePair(x, r => { r.raw.result.modelFrontier.edges[0].terminalReason = "checkmate"; }),
  crossedParentMass: x => livePair(x, r => { r.raw.result.modelFrontier.nodes[1].parentJointMass = 1; }),
  failedNode: x => livePair(x, r => { r.raw.result.modelFrontier.nodes[0].state = "unavailable"; }),
  lostObservation: x => livePair(x, r => r.raw.result.observations.pop()),
  inventedWitness: x => livePair(x, r => { r.raw.result.projections[0].preparations[0].observed[0].executedLeaves = ["foreign"]; }),
  fakeNoTargetCoverage: x => x.records.filter(r => r.row.rootId === "empty").forEach(r => { r.raw.result.modelFrontier.coverage.complete = true; }),
};
for (const [name, mutate] of Object.entries(mutations)) test(`configured-model comparison refuses ${name}`, () => {
  const x = fixture(); mutate(x); assert.throws(() => run(x), /D3262_(MODEL|RECURSIVE)_SENSITIVITY/);
});
test("unsafe/repeated archive names refuse before source reads", () => {
  for (const names of [[], ["../escape.json.gz"], ["foreign.json.gz"], ["d3262-cost-live-a.json.gz", "d3262-cost-live-a.json.gz"]])
    assert.throws(() => loadModelSensitivity(names), /D3262_MODEL_SENSITIVITY/);
});
test("all 193 real frozen candidates and both prefixes bind literal path masses and coverage through the six-file chain", () => {
  const frozen = loadFrozenModelSensitivity(), candidates = loadCostPlan().candidates;
  assert.equal(Object.keys(frozen.inputs).length, 6);
  const bound = indexFrozenModel(frozen, candidates); assert.equal(bound.size, 386);
  for (const cell of frozen.reference.rows) for (const setting of modelSettings) {
    const arm = cell.arms.find(a => a.setting === setting), frontier = bound.get(JSON.stringify([cell.rootId, cell.candidateUci, setting]));
    assert.deepEqual(arm.preparations.flatMap(p => p.observed.map(o => o.pathId)).sort(), frontier.third);
    assert.equal(arm.selectedFourthPlyLeaves, frontier.fourth.length);
  }
});
