// Disposable D3262 event-mass qualification over already captured Maia histories.
// Neither configured model mass nor geometric co-presence is human frequency,
// engine causality, all-defence proof, a production profile or bot tuning.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { caseIdentity, loadCostPlan, sha, validateCostRows } from "./cost-contract.mjs";
import { readCostArchiveBytes } from "./cost-archive-parts.mjs";
import { verifyPackedCostValue } from "./cost-pack.mjs";
import { loadFrozenModelSensitivity, modelSettings, summarizeModelSensitivity } from "./cost-model-sensitivity.mjs";
import { decodeSensitivityArtifact, encodeSensitivityArtifact } from "./cost-engine-width-sensitivity.mjs";

const directory = "planning/semantic-consequence-search";
const targetName = "d3262-coherent-maia-target-outcome.json";
const priorName = "d3262-cost-live-maia-sensitivity-2026-10-07.json.gz";
const priorDigest = "sha256:d59a30fa053308cd701f122b12385a64239a34eb52ed690af1850e56bf70761f";
const check = (v, m) => { if (!v) throw new Error(`D3262_WEIGHTED_TARGET: ${m}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const armKey = r => JSON.stringify([r.rootId, r.candidateUci, r.setting]);
const cellKey = r => JSON.stringify([r.rootId, r.candidateUci, r.targetId, r.setting]);
const pathId = (root, history) => sha(JSON.stringify([root, ...history]));
function index(rows, identity, label) {
  const result = new Map(rows.map(r => [identity(r), r]));
  check(result.size === rows.length, `duplicate ${label}`); return result;
}
const ordered = values => [...values].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const sum = values => ordered(values).reduce((n, e) => n + e.mass, 0);
const finiteMass = n => typeof n === "number" && Number.isFinite(n) && n > 0 && n <= 1 + 1e-5;

/** Count each predecessor once even when it has several selected continuations. */
export function projectEventMasses(immediate, predecessors, leaves) {
  check(["removed", "preserved", "identity_lost"].includes(immediate), "foreign immediate state");
  const before = index(predecessors, e => e.id, "opportunity predecessor");
  index(leaves, e => e.id, "execution leaf");
  for (const p of predecessors) check(typeof p.id === "string" && finiteMass(p.mass)
    && typeof p.opportunity === "boolean" && typeof p.reintroduced === "boolean"
    && p.reintroduced === (immediate === "removed" && p.opportunity), "invalid predecessor event/mass");
  for (const leaf of leaves) {
    const parent = before.get(leaf.predecessorId);
    check(typeof leaf.id === "string" && parent && finiteMass(leaf.mass)
      && leaf.mass <= parent.mass + 1e-5 && typeof leaf.executed === "boolean"
      && (!leaf.executed || parent.opportunity), "execution without its own opportunity/weight");
  }
  for (const parent of predecessors) check(sum(leaves.filter(e => e.predecessorId === parent.id)) <= parent.mass + 1e-5,
    "selected execution leaves exceed predecessor policy mass");
  const opportunities = predecessors.filter(e => e.opportunity), reintroduced = predecessors.filter(e => e.reintroduced);
  const executed = leaves.filter(e => e.executed), executedAgain = executed.filter(e => before.get(e.predecessorId).reintroduced);
  check(sum(predecessors) <= 1 + 1e-5 && sum(executed) <= sum(opportunities) + 1e-5, "invalid complete event mass");
  return { opportunityPaths: ordered(opportunities).map(e => e.id), opportunityMass: sum(opportunities),
    reintroducedPaths: ordered(reintroduced).map(e => e.id), reintroducedOpportunityMass: sum(reintroduced),
    executedLeaves: ordered(executed).map(e => e.id), executionMass: sum(executed),
    executedReintroducedLeaves: ordered(executedAgain).map(e => e.id), reintroducedExecutionMass: sum(executedAgain) };
}

function bindEvents(weights, predecessors, leaves) {
  const policy = index(weights, e => e.pathId, "policy history");
  for (const [events, plies] of [[predecessors, 3], [leaves, 4]]) {
    check(same(events.map(e => e.id).sort(), weights.filter(w => w.plies === plies).map(w => w.pathId).sort()),
      "missing/extra/crossed weighted target history");
    for (const event of events) check(policy.get(event.id)?.jointMass === event.mass, "crossed target joint weight");
  }
}

export function frozenTargetMasses(cell, setting, policy) {
  const predecessors = [], leaves = [];
  for (const path of cell.paths) {
    const arms = path.arms.filter(a => a.arm === setting);
    check(arms.length <= 1, "duplicate frozen target arm"); if (!arms.length) continue;
    const arm = arms[0], observation = path.observation;
    check(observation.immediate === cell.immediate
      && typeof observation.opportunityAtThirdPly === "boolean"
      && observation.opportunityAtThirdPly === (observation.snapshots[2].availableMoveUci !== null), "crossed frozen opportunity");
    predecessors.push({ id: path.id, mass: arm.pathMass, opportunity: observation.opportunityAtThirdPly,
      reintroduced: observation.reintroducedAtThirdPly });
    for (const leaf of arm.leaves) {
      check(leaf.observation.immediate === cell.immediate
        && leaf.observation.opportunityAtThirdPly === observation.opportunityAtThirdPly
        && leaf.observation.reintroducedAtThirdPly === observation.reintroducedAtThirdPly, "crossed frozen execution predecessor");
      leaves.push({ id: leaf.leafId, predecessorId: path.id, mass: leaf.jointMass,
        executed: leaf.observation.executedAtFourthPly });
    }
  }
  bindEvents(policy.weights, predecessors, leaves);
  const reported = cell.arms.filter(a => a.arm === setting);
  check(reported.length === 1, "missing frozen reported target arm");
  const result = projectEventMasses(cell.immediate, predecessors, leaves), original = reported[0];
  for (const name of ["opportunityPaths", "reintroducedPaths", "executedLeaves", "executedReintroducedLeaves"])
    check(same([...original[name]].sort(), result[name]), "changed frozen reported event mask");
  // Earlier summation order remains literal rather than rewritten or normalized.
  const originalSum = entries => entries.reduce((n, e) => n + e.mass, 0);
  const byId = new Map(predecessors.map(p => [p.id, p]));
  const oldValues = { opportunityMass: originalSum(predecessors.filter(p => p.opportunity)),
    reintroducedOpportunityMass: originalSum(predecessors.filter(p => p.reintroduced)),
    executionMass: originalSum(leaves.filter(l => l.executed)),
    reintroducedExecutionMass: originalSum(leaves.filter(l => l.executed && byId.get(l.predecessorId).reintroduced)) };
  check(Object.keys(oldValues).every(k => original[k] === oldValues[k]), "changed frozen reported target mass");
  return { ...result, reportedFrozenMasses: oldValues };
}

export function liveTargetMasses(row, result, targetId, policy) {
  const projections = result.projections.filter(p => p.targetId === targetId);
  check(projections.length === 1 && projections[0].convention === "d3262-target-opportunity@2", "foreign live target convention");
  const projection = projections[0], observations = result.observations.filter(o => o.targetId === targetId);
  const actual = index(observations, o => pathId(row.rootId, o.history), "live target observation");
  check(same([...actual.keys()].sort(), policy.weights.map(e => e.pathId).sort()), "lost/crossed live target policy observation");
  const weights = index(policy.weights, e => e.pathId, "live policy weight"), predecessors = [], leaves = [];
  for (const { history, observation: o } of observations) {
    check(history[0] === row.candidateUci && [2, 3, 4].includes(history.length)
      && o.convention === "d3262-target-opportunity@2" && o.immediate === projection.immediate
      && Array.isArray(o.snapshots) && o.snapshots.length === history.length, "crossed live target history/convention");
    const actions = history.length >= 3 ? o.snapshots[2].availableActions : [];
    check(Array.isArray(actions) && typeof o.opportunityAtThirdPly === "boolean"
      && typeof o.reintroducedAtThirdPly === "boolean" && typeof o.executedAtFourthPly === "boolean"
      && o.opportunityAtThirdPly === (actions.length > 0)
      && o.reintroducedAtThirdPly === (projection.immediate === "removed" && actions.length > 0)
      && o.executedAtFourthPly === (history.length === 4 && actions.some(a => a.uci === history[3]))
      && same(o.executionWitness, o.executedAtFourthPly ? history : null), "crossed live target action/flag/witness");
    const id = pathId(row.rootId, history), weight = weights.get(id);
    check(weight?.plies === history.length, "crossed live weighted ply");
    if (history.length === 3) predecessors.push({ id, mass: weight.jointMass,
      opportunity: o.opportunityAtThirdPly, reintroduced: o.reintroducedAtThirdPly });
    if (history.length === 4) {
      const parentId = pathId(row.rootId, history.slice(0, 3)), parent = actual.get(parentId)?.observation;
      check(parent && parent.opportunityAtThirdPly === o.opportunityAtThirdPly
        && parent.reintroducedAtThirdPly === o.reintroducedAtThirdPly
        && same(parent.snapshots[2].availableActions, actions), "crossed actual execution parent");
      leaves.push({ id, predecessorId: parentId, mass: weight.jointMass, executed: o.executedAtFourthPly });
    }
  }
  bindEvents(policy.weights, predecessors, leaves);
  return projectEventMasses(projection.immediate, predecessors, leaves);
}

export function compileWeightedTargets(base, records, frozenTarget) {
  check(frozenTarget.profile === "d3262-coherent-maia-target-outcome-v1", "foreign frozen target profile");
  const cases = index(records, r => caseIdentity(r.row), "whole capture case");
  index(base.retainedCases, caseIdentity, "retained capture case");
  check(cases.size === base.retainedCases.length && base.retainedCases.every(c => cases.get(caseIdentity(c))?.row.kind === c.kind),
    "lost/crossed whole capture population");
  const oldCells = index(frozenTarget.rows, r => JSON.stringify([r.rootId, r.candidateUci, r.targetId]), "frozen target cell");
  const policies = index(base.policies, armKey, "model policy"), groups = new Map();
  index(base.cells, cellKey, "model target cell");
  check(policies.size === base.retainedCandidates * modelSettings.length
    && base.retainedCases.length === base.retainedCandidates * modelSettings.length * 2 * 3
    && base.cells.length === oldCells.size * modelSettings.length
    && frozenTarget.rows.every(c => modelSettings.every(setting => base.cells.some(b => cellKey(b) === cellKey({ ...c, setting })))),
  "incomplete target/policy population");
  const cells = base.cells.map(cell => {
    const key = JSON.stringify([cell.rootId, cell.candidateUci, cell.targetId]), old = oldCells.get(key);
    check(old, "missing frozen target cell");
    const record = cases.get(caseIdentity({ ...cell, horizon: 4, regime: "cold" })), policy = policies.get(armKey(cell));
    check(record && record.row.kind === cell.status.replace("compared", "available") && policy, "lost/crossed live target cell");
    const projected = record.raw.result.projections.filter(p => p.targetId === cell.targetId);
    check(projected.length === 1 && projected[0].immediate === old.immediate, "crossed frozen/live immediate target");
    const identity = { rootId: cell.rootId, candidateUci: cell.candidateUci, targetId: cell.targetId,
      setting: cell.setting, phase: cell.phase, focus: cell.focus };
    const axis = { setting: cell.setting, phase: cell.phase, focus: cell.focus };
    const group = groups.get(JSON.stringify(axis)) ?? { ...axis, cells: 0, compared: 0, unpaired: 0,
      changedEventMasks: 0, changedWeightedMasses: 0, frozenAggregateOrderingDifferences: 0 };
    group.cells++;
    if (cell.status !== "compared") {
      group.unpaired++; groups.set(JSON.stringify(axis), group);
      return { ...identity, status: cell.status, comparison: "unpaired_unknown_complete_mass_not_target_absence",
        completeTargetMasses: null, retainedObservations: cell.retainedObservations,
        retainedPartialOutcome: cell.retainedPartialOutcome };
    }
    check(policy.status === "compared", "unpaired policy called weighted target comparison");
    const before = frozenTargetMasses(old, cell.setting, policy.before);
    const after = liveTargetMasses(record.row, record.raw.result, cell.targetId, policy.after);
    const eventNames = ["opportunityPaths", "reintroducedPaths", "executedLeaves", "executedReintroducedLeaves"];
    const massNames = ["opportunityMass", "reintroducedOpportunityMass", "executionMass", "reintroducedExecutionMass"];
    const changed = { eventMasks: eventNames.some(k => !same(before[k], after[k])),
      weightedMasses: massNames.some(k => before[k] !== after[k]),
      frozenAggregateOrdering: massNames.some(k => before[k] !== before.reportedFrozenMasses[k]) };
    group.compared++; group.changedEventMasks += Number(changed.eventMasks);
    group.changedWeightedMasses += Number(changed.weightedMasses);
    group.frozenAggregateOrderingDifferences += Number(changed.frozenAggregateOrdering);
    groups.set(JSON.stringify(axis), group);
    return { ...identity, status: "compared", before, after, changed,
      policyLayerMasses: { before: policy.before.layerMasses, after: policy.after.layerMasses },
      retainedOmissions: { before: cell.before.coverage, after: cell.after.coverage },
      proofCeiling: "observed_configured_model_target_paths_not_all_defences_or_engine_cause" };
  });
  return { question: "D3262", authority: "observed_configured_model_target_mass_not_human_frequency_or_proof",
    frozenTargetConvention: "d3262-coherent-maia-target-outcome-v1_legacy_observer_not_rewritten",
    liveTargetConvention: "d3262-target-opportunity@2", rows: records.length,
    retainedCandidates: base.retainedCandidates, retainedCases: base.retainedCases,
    cachePairs: base.cachePairs, cacheNodeTransitions: base.cacheNodeTransitions,
    comparedHorizon: 4, shorterHorizon: "retained_not_assigned_four_ply_target_mass",
    noTargetPolicies: base.policies.filter(p => p.status === "no_target").map(p => ({
      rootId: p.rootId, candidateUci: p.candidateUci, setting: p.setting, phase: p.phase, focus: p.focus,
      targetMasses: null, meaning: "policy_not_requested_not_known_zero" })), groups: [...groups.values()], cells,
    aggregationOrder: "ascending_literal_path_id_original_reported_mass_also_retained_no_normalization",
    newInference: false, newCapturedSettings: 0, productionProfileSelected: false };
}

export function loadWeightedTargets(names) {
  check(Array.isArray(names) && names.length && new Set(names).size === names.length
    && names.every(n => /^d3262-cost-live-[a-z0-9-]+\.json\.gz$/u.test(n)), "explicit unique archive names required");
  const plan = loadCostPlan(), records = [], inputs = {}, sources = {};
  for (const name of names) {
    const bytes = readCostArchiveBytes(`${directory}/${name}`), pack = JSON.parse(gunzipSync(bytes));
    verifyPackedCostValue(pack); inputs[name] = sha(bytes); sources[name] = pack.metadata.provider;
    records.push(...pack.groups.flatMap(g => JSON.parse(gunzipSync(Buffer.from(g.base64, "base64")))));
  }
  validateCostRows(plan, records.map(r => r.row));
  const frozen = loadFrozenModelSensitivity(), base = summarizeModelSensitivity(records, plan.candidates, frozen.reference, frozen);
  const fullBase = { question: "D3262", inputs, sources, frozenContinuationInputs: frozen.inputs, ...base,
    validation: "checked_archive_synthesis_independent_source_replay_required_separately" };
  const priorBytes = readFileSync(`${directory}/${priorName}`);
  check(sha(priorBytes) === priorDigest && decodeSensitivityArtifact(priorBytes, priorName) === `${JSON.stringify(fullBase, null, 2)}\n`,
    "changed preceding full model comparison");
  const targetBytes = readFileSync(`${directory}/${targetName}`);
  check(sha(targetBytes) === frozen.inputs[targetName], "changed frozen weighted target source");
  return { inputs, frozenInputs: { ...frozen.inputs, [priorName]: priorDigest },
    ...compileWeightedTargets(base, records, JSON.parse(targetBytes)) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), write = args[0] === "--write", options = write ? args.slice(1) : args;
  check(options.length === 4 && options[0] === "--archives" && options[2] === "--out" && options[1] && options[3],
    "use [--write] --archives <CSV> --out <new artifact>");
  const value = loadWeightedTargets(options[1].split(",")), plain = `${JSON.stringify(value, null, 2)}\n`;
  if (write) writeFileSync(options[3], encodeSensitivityArtifact(plain, options[3]), { flag: "wx" });
  else check(decodeSensitivityArtifact(readFileSync(options[3]), options[3]) === plain, "changed weighted target artifact; never overwrite");
  process.stdout.write(`${JSON.stringify({ rows: value.rows, cells: value.cells.length,
    compared: value.cells.filter(c => c.status === "compared").length, digest: sha(plain), productionProfileSelected: false })}\n`);
}
