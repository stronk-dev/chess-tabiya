import assert from "node:assert/strict";
import test from "node:test";
import { sha, costCases } from "./cost-contract.mjs";
import { modelSettings } from "./cost-model-sensitivity.mjs";
import { projectEventMasses, frozenTargetMasses, liveTargetMasses, compileWeightedTargets } from "./cost-weighted-targets.mjs";

// Synthetic custody/algebra controls only; these do not establish chess truth.
const id = history => sha(JSON.stringify(["named", ...history]));
const first = ["e2e4", "e7e5"], third = [...first, "g1f3"], other = [...first, "b1c3"];
const fourth = [...third, "b8c6"], nonExecution = [...third, "g8f6"], otherLeaf = [...other, "b8c6"];
const p = .95 * .9, q = .95 * .05, x = p * .6, y = p * .2, z = q * .8;
const weight = (history, jointMass) => ({ pathId: id(history), plies: history.length, jointMass });
const weights = [weight(first, .95), weight(third, p), weight(other, q),
  weight(fourth, x), weight(nonExecution, y), weight(otherLeaf, z)];
const policy = () => ({ weights: structuredClone(weights), layerMasses: [.95, p + q, x + y + z] });
function liveObservation(history, target) {
  const chosen = target === "targetA" ? third : other;
  const opportunity = history.length >= 3 && history.slice(0, 3).join(" ") === chosen.join(" ");
  const actions = opportunity ? [{ uci: "b8c6" }] : [];
  const executed = history.length === 4 && opportunity && history[3] === "b8c6";
  return { targetId: target, history: [...history], observation: { convention: "d3262-target-opportunity@2",
    immediate: "removed", opportunityAtThirdPly: opportunity, reintroducedAtThirdPly: opportunity,
    executedAtFourthPly: executed, executionWitness: executed ? [...history] : null,
    snapshots: history.map((_, i) => i === 2 ? { availableActions: actions } : {}) } };
}
function oldTarget(target) {
  const opportunityIds = [id(target === "targetA" ? third : other)], executedIds = [id(target === "targetA" ? fourth : otherLeaf)];
  const paths = [third, other].map(history => {
    const opportunity = opportunityIds.includes(id(history));
    const mass = history === third ? p : q, continuations = history === third ? [fourth, nonExecution] : [otherLeaf];
    return { id: id(history), observation: { immediate: "removed", opportunityAtThirdPly: opportunity,
      reintroducedAtThirdPly: opportunity, snapshots: [{}, {}, { availableMoveUci: opportunity ? "b8c6" : null }] },
    arms: modelSettings.map(arm => ({ arm, pathMass: mass, leaves: continuations.map(leaf => ({ leafId: id(leaf),
      jointMass: weights.find(w => w.pathId === id(leaf)).jointMass, observation: { immediate: "removed",
        opportunityAtThirdPly: opportunity, reintroducedAtThirdPly: opportunity,
        executedAtFourthPly: executedIds.includes(id(leaf)) } })) })) };
  });
  const value = target === "targetA" ? p : q, execution = target === "targetA" ? x : z;
  return { rootId: "named", candidateUci: "e2e4", targetId: target, immediate: "removed", paths,
    arms: modelSettings.map(arm => ({ arm, opportunityPaths: opportunityIds, opportunityMass: value,
      reintroducedPaths: opportunityIds, reintroducedOpportunityMass: value, executedLeaves: executedIds,
      executionMass: execution, executedReintroducedLeaves: executedIds, reintroducedExecutionMass: execution })) };
}
function fixture() {
  const candidates = [{ rootId: "named", candidateUci: "e2e4", phase: "opening", focus: null },
    { rootId: "empty", candidateUci: "d2d4", phase: "endgame", focus: "quiet_plan" }];
  const cases = [...costCases({ candidates, settings: modelSettings.map(id => ({ id })), horizons: [2, 4], regimes: ["cold", "warm", "provider_offline"] })];
  const records = cases.map(c => {
    const noTarget = c.rootId === "empty", offline = c.regime === "provider_offline";
    const kind = noTarget ? "no_target" : offline ? "source_unavailable" : "available";
    const targets = noTarget ? [] : ["targetA", "targetB"];
    return { row: { ...c, kind }, raw: { result: { kind,
      projections: targets.map(targetId => ({ targetId, convention: "d3262-target-opportunity@2", immediate: "removed" })),
      observations: offline ? [] : targets.flatMap(target => [first, third, other, fourth, nonExecution, otherLeaf]
        .filter(h => h.length <= c.horizon).map(h => liveObservation(h, target))) } } };
  });
  const cells = modelSettings.flatMap(setting => ["targetA", "targetB"].map(targetId => ({ ...candidates[0], setting, targetId,
    status: "compared", before: { coverage: { omittedPreparations: ["c7c5"] } }, after: { coverage: { omittedPreparations: ["c7c5"] } } })));
  const policies = candidates.flatMap((candidate, i) => modelSettings.map(setting => ({ ...candidate, setting,
    status: i === 0 ? "compared" : "no_target", ...(i === 0 ? { before: policy(), after: policy() } : {}) })));
  return { records, base: { rows: records.length, retainedCandidates: 2, retainedCases: records.map(r => r.row), cells, policies,
    cachePairs: { identicalCompiled: 8, failedColdMissingWarmReceipt: 0 }, cacheNodeTransitions: 0 },
  frozen: { profile: "d3262-coherent-maia-target-outcome-v1", rows: [oldTarget("targetA"), oldTarget("targetB")] } };
}
const run = f => compileWeightedTargets(f.base, f.records, f.frozen);
const raw = f => f.records.find(r => r.row.rootId === "named" && r.row.setting === modelSettings[0]
  && r.row.horizon === 4 && r.row.regime === "cold");
const events = () => ({ predecessors: [{ id: "p", mass: .4, opportunity: true, reintroduced: true },
  { id: "q", mass: .2, opportunity: false, reintroduced: false }], leaves: [
  { id: "a", predecessorId: "p", mass: .1, executed: true },
  { id: "b", predecessorId: "p", mass: .2, executed: false },
  { id: "c", predecessorId: "q", mass: .15, executed: false }] });
test("one opportunity predecessor with several leaves is counted once; execution is its own subset", () => {
  const e = events(), r = projectEventMasses("removed", e.predecessors, e.leaves);
  assert.equal(r.opportunityMass, .4); assert.equal(r.executionMass, .1);
  assert.deepEqual(r.opportunityPaths, ["p"]); assert.deepEqual(r.executedLeaves, ["a"]);
});
test("preserved opportunity is not reintroduction", () => {
  const e = events(); e.predecessors[0].reintroduced = false;
  const r = projectEventMasses("preserved", e.predecessors, e.leaves);
  assert.equal(r.opportunityMass, .4); assert.equal(r.reintroducedOpportunityMass, 0); assert.equal(r.reintroducedExecutionMass, 0);
});
test("original reported accumulation remains literal beside canonical history ordering", () => {
  const entries = [{ id: "c", mass: .1 }, { id: "b", mass: .2 }, { id: "a", mass: .3 }];
  const cell = { immediate: "removed", paths: entries.map(e => ({ id: e.id, observation: {
    immediate: "removed", opportunityAtThirdPly: true, reintroducedAtThirdPly: true,
    snapshots: [{}, {}, { availableMoveUci: "b8c6" }] }, arms: [{ arm: modelSettings[0], pathMass: e.mass, leaves: [] }] })),
  arms: [{ arm: modelSettings[0], opportunityPaths: ["c", "b", "a"], opportunityMass: (.1 + .2) + .3,
    reintroducedPaths: ["c", "b", "a"], reintroducedOpportunityMass: (.1 + .2) + .3,
    executedLeaves: [], executionMass: 0, executedReintroducedLeaves: [], reintroducedExecutionMass: 0 }] };
  const r = frozenTargetMasses(cell, modelSettings[0], { weights: entries.map(e => ({ pathId: e.id, plies: 3, jointMass: e.mass })) });
  assert.equal(r.opportunityMass, (.3 + .2) + .1);
  assert.equal(r.reportedFrozenMasses.opportunityMass, (.1 + .2) + .3);
  assert.notEqual(r.opportunityMass, r.reportedFrozenMasses.opportunityMass);
});
test("inherited source float precision is reported literally, never clipped or normalized to one", () => {
  const r = projectEventMasses("removed", [{ id: "a", mass: .5, opportunity: true, reintroduced: true },
    { id: "b", mass: .5000000447034836, opportunity: true, reintroduced: true }], []);
  assert.equal(r.opportunityMass, 1.0000000447034836); assert.equal(r.executionMass, 0);
});
test("whole cases, two target masks and no-policy entries remain distinct", () => {
  const r = run(fixture()); assert.equal(r.rows, 24); assert.equal(r.cells.length, 4);
  assert.equal(r.noTargetPolicies.length, 2); assert.ok(r.noTargetPolicies.every(p => p.targetMasses === null));
  assert.ok(r.cells.every(c => !c.changed.eventMasks && !c.changed.weightedMasses));
  assert.equal(r.cells[0].after.opportunityMass, p); assert.equal(r.cells[1].after.opportunityMass, q);
  assert.equal(r.cells[0].after.executionMass, x); assert.equal(r.cells[1].after.executionMass, z);
  assert.equal(r.productionProfileSelected, false); assert.equal(r.newCapturedSettings, 0); assert.equal(r.newInference, false);
  assert.equal(r.retainedCases.filter(c => c.regime === "provider_offline").length, 8);
  assert.equal(r.retainedCases.filter(c => c.horizon === 2).length, 12);
});
test("changed source weights remain weighted differences without inventing different target masks", () => {
  const f = fixture(), pol = f.base.policies[0].after;
  pol.weights.find(w => w.pathId === id(third)).jointMass = .8;
  pol.weights.find(w => w.pathId === id(fourth)).jointMass = .48;
  pol.weights.find(w => w.pathId === id(nonExecution)).jointMass = .16;
  const r = run(f); assert.equal(r.cells[0].changed.weightedMasses, true);
  assert.equal(r.cells[0].changed.eventMasks, false); assert.equal(r.cells[1].changed.weightedMasses, false);
});
test("known early-terminal policy mass does not become invented later target events", () => {
  const f = fixture();
  f.base.policies.filter(p => p.status === "compared").forEach(p => {
    p.before = { weights: [weight(first, .95)], layerMasses: [.95, .95, .95] }; p.after = structuredClone(p.before);
  });
  f.frozen.rows.forEach(t => { t.paths = []; t.arms.forEach(a => {
    for (const field of ["opportunityPaths", "reintroducedPaths", "executedLeaves", "executedReintroducedLeaves"]) a[field] = [];
    for (const field of ["opportunityMass", "reintroducedOpportunityMass", "executionMass", "reintroducedExecutionMass"]) a[field] = 0;
  }); });
  f.records.forEach(r => { r.raw.result.observations = r.raw.result.observations.filter(o => o.history.length === 2); });
  const r = run(f); assert.equal(r.cells[0].after.opportunityMass, 0);
  assert.equal(r.cells[0].policyLayerMasses.after[2], .95);
});
for (const status of ["invalid_source", "source_unavailable", "budget_exhausted", "absorbing_terminal"]) test(`${status} stays unpaired unknown, not zero complete event mass`, () => {
  const f = fixture();
  f.records.filter(r => r.row.rootId === "named" && r.row.setting === modelSettings[0] && r.row.horizon === 4).forEach(r => {
    r.row.kind = status; r.raw.result.kind = status;
  });
  f.base.cells.filter(c => c.setting === modelSettings[0]).forEach(c => { c.status = status;
    c.retainedObservations = 2; c.retainedPartialOutcome = { availability: "unknown_partial_quantifiers" }; });
  f.base.policies[0].status = status;
  const r = run(f); assert.equal(r.cells[0].completeTargetMasses, null); assert.equal(r.cells[0].after, undefined);
  assert.equal(r.cells[0].retainedObservations, 2); assert.equal(r.groups[0].unpaired, 2);
});
for (const [label, mutate] of [
  ["duplicate predecessor", e => e.predecessors.push(e.predecessors[0])],
  ["duplicate leaf", e => e.leaves.push(e.leaves[0])],
  ["unknown execution predecessor", e => { e.leaves[0].predecessorId = "foreign"; }],
  ["execution without opportunity", e => { e.leaves[2].executed = true; }],
  ["false reintroduction", e => { e.predecessors[1].reintroduced = true; }],
  ["non-Boolean opportunity", e => { e.predecessors[0].opportunity = 1; }],
  ["non-Boolean execution", e => { e.leaves[0].executed = 1; }],
  ["negative mass", e => { e.predecessors[0].mass = -.4; }],
  ["string mass", e => { e.leaves[0].mass = ".1"; }],
  ["nonfinite mass", e => { e.leaves[0].mass = NaN; }],
  ["leaf mass over parent", e => { e.leaves[0].mass = .5; }],
  ["siblings over parent", e => { e.leaves[1].mass = .4; }],
  ["parent mass over one", e => { e.predecessors[0].mass = 1.1; }],
]) test(`refuses ${label}`, () => { const e = events(); mutate(e);
  assert.throws(() => projectEventMasses("removed", e.predecessors, e.leaves), /D3262_WEIGHTED_TARGET/u); });
for (const [label, mutate] of [
  ["lost complete case", f => f.records.pop()],
  ["duplicate complete case", f => { f.records[1] = f.records[0]; }],
  ["duplicate retained case", f => { f.base.retainedCases[1] = f.base.retainedCases[0]; }],
  ["lost target cell", f => f.base.cells.pop()],
  ["lost model policy", f => f.base.policies.pop()],
  ["crossed target", f => { f.base.cells[0].targetId = "foreign"; }],
  ["changed frozen reported mass", f => { f.frozen.rows[0].arms[0].opportunityMass *= 2; }],
  ["changed frozen event mask", f => { f.frozen.rows[0].arms[0].executedLeaves = []; }],
  ["crossed frozen source weight", f => { f.frozen.rows[0].paths[0].arms[0].pathMass = .5; }],
  ["lost frozen predecessor", f => f.frozen.rows[0].paths.pop()],
  ["duplicate frozen arm", f => f.frozen.rows[0].paths[0].arms.push(f.frozen.rows[0].paths[0].arms[0])],
  ["crossed convention", f => { raw(f).raw.result.projections[0].convention = "legacy"; }],
  ["crossed observation convention", f => { raw(f).raw.result.observations[0].observation.convention = "legacy"; }],
  ["duplicate live observation", f => raw(f).raw.result.observations.push(raw(f).raw.result.observations[0])],
  ["lost live observation", f => raw(f).raw.result.observations.pop()],
  ["foreign target observation", f => { raw(f).raw.result.observations[0].targetId = "foreign"; }],
  ["crossed candidate history", f => { raw(f).raw.result.observations[0].history[0] = "d2d4"; }],
  ["non-Boolean live event", f => { raw(f).raw.result.observations[0].observation.opportunityAtThirdPly = 0; }],
  ["forged execution flag", f => { raw(f).raw.result.observations[0].observation.executedAtFourthPly = true; }],
  ["crossed execution witness", f => { raw(f).raw.result.observations.find(o => o.observation.executedAtFourthPly).observation.executionWitness = otherLeaf; }],
  ["crossed actual parent actions", f => { raw(f).raw.result.observations.find(o => o.history.length === 4).observation.snapshots[2].availableActions.push({ uci: "g8f6" }); }],
]) test(`whole join refuses ${label}`, () => { const f = fixture(); mutate(f); assert.throws(() => run(f)); });
test("the direct live/frozen readers bind their exact target history weights", () => {
  const f = fixture(), r = raw(f), old = f.frozen.rows[0], pol = f.base.policies[0];
  const before = frozenTargetMasses(old, modelSettings[0], pol.before), after = liveTargetMasses(r.row, r.raw.result, "targetA", pol.after);
  assert.equal(before.opportunityMass, after.opportunityMass); assert.equal(before.executionMass, after.executionMass);
  assert.deepEqual(before.reportedFrozenMasses, { opportunityMass: p, reintroducedOpportunityMass: p, executionMass: x, reintroducedExecutionMass: x });
});
