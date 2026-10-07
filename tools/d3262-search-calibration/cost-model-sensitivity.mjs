// Disposable D3262 fresh/frozen configured-model comparison, not bot tuning,
// human frequencies, a joint-threshold selector, chess truth or source repair.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { caseIdentity, costCases, loadCostPlan, sha, sourcePins, validateCostRows } from "./cost-contract.mjs";
import { verifyPackedCostValue } from "./cost-pack.mjs";
import { selectedPrefix, jointStop, sourceMassTolerance } from "./coherent-horizon-policy.mjs";
import { indexLiveRecursiveFrontier as indexLiveTargetFrontier } from "./cost-recursive-sensitivity.mjs";
import { encodeSensitivityArtifact, decodeSensitivityArtifact } from "./cost-engine-width-sensitivity.mjs";

export const modelSettings = Object.freeze(["maia:prefix0.80", "maia:prefix0.90"]);
const directory = "planning/semantic-consequence-search";
const horizonName = "d3262-coherent-horizon-policy.json.gz";
const horizonDigest = "sha256:172bfccf3a8c84e12a985d27529bec4131a2e3e56b366bb410097f80e442ec8a";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (v, m) => { if (!v) throw new Error(`D3262_MODEL_SENSITIVITY: ${m}`); };
const key = x => JSON.stringify([x.rootId, x.candidateUci]);
const armKey = (x, setting) => JSON.stringify([x.rootId, x.candidateUci, setting]);
const historyId = (root, history) => sha(JSON.stringify([root, ...history]));
function index(rows, identity, label) {
  const result = new Map(rows.map(r => [identity(r), r]));
  check(rows.length === result.size, `duplicate ${label}`); return result;
}
function sortedUnique(values, label) {
  check(Array.isArray(values) && values.every(x => typeof x === "string") && new Set(values).size === values.length, `duplicate/invalid ${label}`);
  return [...values].sort();
}
const positive = x => typeof x === "number" && Number.isFinite(x) && x > 0;
const weight = (rootId, history, conditionalMass, jointMass) => {
  check(positive(conditionalMass) && conditionalMass <= 1 + sourceMassTolerance && positive(jointMass), "invalid policy weight");
  return { pathId: historyId(rootId, history), plies: history.length, conditionalMass, jointMass };
};
const sortWeights = rows => {
  sortedUnique(rows.map(r => r.pathId), "weighted history");
  return rows.sort((a, b) => a.pathId.localeCompare(b.pathId));
};
const outcome = (p, immediate, reach, execution) => ({ availability: p.rawQuantifier.availability,
  execution: p.rawQuantifier.execution, licensedAvailability: p.licensedAvailability,
  observedReach: immediate === "preserved" || reach, observedExecution: execution });
function targetCoverage(p) {
  return { omittedPreparations: sortedUnique(p.rawQuantifier.omittedPreparations, "omitted preparation"),
    unvisitedDefences: p.preparations.map(r => ({ preparationUci: r.preparationUci,
      moves: sortedUnique(r.unvisitedDefences, "unvisited defence"), unexpandedTerminalLegalMoves: r.unexpandedTerminalLegalMoves }))
      .sort((a, b) => a.preparationUci.localeCompare(b.preparationUci)) };
}

function cachedModelEvidence(cold, warm, missingColdReceipt) {
  const before = cold.modelFrontier.nodes, after = warm.modelFrontier.nodes;
  check(before.length === after.length, "warm changed model node population");
  let transitions = 0;
  before.forEach((n, i) => {
    const missing = missingColdReceipt && ["invalid", "timed_out"].includes(n.state);
    if (missing) check(n.selected === null && n.coveredConditionalMass === null
      && n.residualConditionalMass === null, "failed node invented known policy coverage");
    const expected = ["executed", "cached"].includes(n.state) ? "cached" : missing ? "unavailable" : n.state;
    check(after[i].state === expected, "warm changed/fresh model node provenance");
    transitions += Number(n.state === "executed");
  });
  // State is dependency custody, not a different selected policy or target
  // observation. Admit only the explicit receipt-custody transitions above;
  // preserve every original state in the immutable capture, never rewrite it.
  const evidence = result => ({ ...result, modelFrontier: { ...result.modelFrontier,
    nodes: result.modelFrontier.nodes.map(({ state, ...node }) => node) } });
  return { before: evidence(cold), after: evidence(warm), transitions };
}

/** Frozen model paths are shared across targets, not target-specific reserves. */
export function indexFrozenModel({ continuation, policy, firstSources }, candidates) {
  check(continuation.profile === "d3262-coherent-maia-fourth-ply-v1"
    && continuation.authority === "three_policy_layer_configured_model_frontier_not_human_frequency_exact_proof_or_engine_reason"
    && policy.profile === "d3262-coherent-horizon-policy-v1", "foreign frozen model/policy authority");
  const subjects = index(candidates, key, "candidate"), rows = index(continuation.rows, key, "frozen model candidate");
  const stops = index(policy.policyStops, key, "frozen policy candidate"), first = index(firstSources, key, "first model source");
  // The pinned first-source archive includes six historical candidates outside
  // this declared comparison frame. Require every frame member's own receipt;
  // neither reject those retained receipts nor expand the measured population.
  check(rows.size === subjects.size && stops.size === subjects.size
    && [...subjects.keys()].every(k => rows.has(k) && stops.has(k) && first.has(k)), "lost/foreign frozen model population");
  const paths = index(continuation.paths, p => p.id, "frozen third path"), leaves = index(continuation.leaves, p => p.id, "frozen leaf");
  const grouped = new Map(candidates.map(c => [key(c), []]));
  for (const path of paths.values()) {
    const identity = key({ rootId: path.rootId, candidateUci: path.historyUci[0] });
    check(grouped.has(identity) && path.historyUci.length === 3 && path.id === historyId(path.rootId, path.historyUci), "crossed frozen third history");
    grouped.get(identity).push(path);
  }
  const result = new Map();
  for (const candidate of candidates) for (const setting of modelSettings) {
    const row = rows.get(key(candidate)), stop = stops.get(key(candidate)), source = first.get(key(candidate));
    const arms = row.arms.filter(a => a.arm === setting), policies = stop.arms.filter(a => a.arm === setting);
    check(arms.length === 1 && policies.length === 1 && same(source.historyUci, [candidate.candidateUci]), "lost/crossed frozen model arm/history");
    const arm = arms[0], p = policies[0], selected = row.terminalAfterCandidate ? [] : selectedPrefix(source.configuredSupport, Number(setting.slice(11)));
    check(same(selected.map(e => e.legalUci), p.firstSelectedReplyUcis), "crossed frozen first prefix");
    const weights = selected.map(e => weight(candidate.rootId, [candidate.candidateUci, e.legalUci], e.mass, e.mass));
    const third = [], fourth = [], leavesByPath = new Map(), histories = new Map();
    for (const path of grouped.get(key(candidate))) {
      const chosen = path.arms.filter(a => a.arm === setting);
      check(chosen.length <= 1, "duplicate frozen path arm"); if (!chosen.length) continue;
      const a = chosen[0]; third.push(path.id); histories.set(path.id, path.historyUci);
      check(selected.some(e => e.legalUci === path.historyUci[1])
        && path.conditionalReplyMass === selected.find(e => e.legalUci === path.historyUci[1]).mass
        && a.pathMass === path.conditionalReplyMass * path.conditionalLearnerMass
        && (!path.terminalReason || a.selected.length === 0), "crossed frozen conditional product/terminal");
      weights.push(weight(candidate.rootId, path.historyUci, path.conditionalLearnerMass, a.pathMass));
      const ids = a.selected.map(e => {
        const leaf = leaves.get(e.leafId), history = [...path.historyUci, e.moveUci];
        check(leaf && leaf.rootId === candidate.rootId && same(leaf.historyUci, history)
          && leaf.id === historyId(candidate.rootId, history) && leaf.selectedBy.includes(setting)
          && e.jointMass === a.pathMass * e.conditionalMass, "crossed frozen fourth history/product");
        weights.push(weight(candidate.rootId, history, e.conditionalMass, e.jointMass));
        return leaf.id;
      });
      leavesByPath.set(path.id, sortedUnique(ids, "frozen selected leaf")); fourth.push(...ids);
    }
    check(arm.selectedThirdPlyPaths === third.length && arm.selectedFourthPlyEdges === fourth.length, "crossed frozen frontier count");
    const horizons = p.horizons;
    check(same(horizons.map(h => h.plies), [2, 3, 4])
      && same(horizons.map(h => h.coveredJointMass), [arm.firstCoveredMass, arm.twoLayerMass, arm.frontierMass]), "crossed frozen policy horizons");
    result.set(armKey(candidate, setting), { third: sortedUnique(third, "frozen selected third"),
      fourth: sortedUnique(fourth, "frozen selected fourth"), leavesByPath, histories,
      firstPreparations: sortedUnique(selected.map(e => e.legalUci), "frozen selected preparation"),
      policy: { weights: sortWeights(weights), layerMasses: horizons.map(h => h.coveredJointMass),
        stopRule: Object.fromEntries(Object.entries(horizons[2]).filter(([field]) => field !== "plies")) } });
  }
  return result;
}

export function liveModelPolicy(row, result) {
  const frontier = result.modelFrontier;
  check(frontier?.coverage.complete === true && same(frontier.coverage.selectionRule,
    "per_node_prefix_includes_overshoot_max8_not_joint_threshold_selector")
    && frontier.coverage.policyMeaning === "both_sides_configured_model_not_human_frequency_or_arbitrary_learner",
  "partial/foreign model selection called complete");
  const edges = index(frontier.edges, e => historyId(row.rootId, e.history), "live policy edge");
  const nodes = index(frontier.nodes, n => historyId(row.rootId, n.history), "live policy node");
  const root = nodes.get(historyId(row.rootId, [row.candidateUci]));
  check(root && root.parentJointMass === 1, "missing/crossed first policy node");
  for (const n of nodes.values()) {
    check(n.history[0] === row.candidateUci && [1, 2, 3].includes(n.history.length)
      && ["executed", "cached"].includes(n.state) && Array.isArray(n.selected) && n.selected.length <= 8, "crossed/failed live policy node");
    if (n.history.length > 1) {
      const parent = edges.get(historyId(row.rootId, n.history));
      check(parent && parent.terminalReason === null && parent.jointMass === n.parentJointMass, "missing/absorbing/crossed policy parent");
    }
    sortedUnique(n.selected.map(e => e.legalUci), "selected policy move");
    for (const e of n.selected) {
      const next = edges.get(historyId(row.rootId, [...n.history, e.legalUci]));
      check(next && next.conditionalMass === e.mass && next.jointMass === n.parentJointMass * e.mass, "crossed live conditional product");
    }
  }
  for (const e of edges.values()) {
    check(e.history[0] === row.candidateUci && [2, 3, 4].includes(e.history.length), "crossed live weighted history");
    const parent = nodes.get(historyId(row.rootId, e.history.slice(0, -1)));
    check(parent?.selected.some(s => s.legalUci === e.history.at(-1)), "orphan live policy edge");
    if (e.history.length < 4 && e.terminalReason === null) check(nodes.has(historyId(row.rootId, e.history)), "lost nonterminal policy node");
  }
  const layerMasses = [2, 3, 4].map(plies => frontier.edges.filter(e => e.history.length === plies
    || e.history.length < plies && e.terminalReason !== null).reduce((n, e) => n + e.jointMass, 0));
  const stopRule = jointStop(Number(row.setting.slice(11)), layerMasses[2], false, 3);
  check(same(frontier.coverage.observedLayerMasses, layerMasses)
    && frontier.coverage.frontierMass === layerMasses[2] && frontier.coverage.observedFrontierMass === layerMasses[2]
    && same(frontier.coverage.stopRule, stopRule), "crossed live joint coverage/stop rule");
  return { weights: sortWeights(frontier.edges.map(e => weight(row.rootId, e.history, e.conditionalMass, e.jointMass))), layerMasses, stopRule };
}

export function summarizeModelSensitivity(records, candidates, reference, frozen) {
  const bound = indexFrozenModel(frozen, candidates), subjects = index(candidates, key, "candidate"), cases = new Map();
  const targets = new Map(candidates.map(c => [key(c), []]));
  for (const cell of reference.rows) {
    check(targets.has(key(cell)) && !targets.get(key(cell)).some(c => c.targetId === cell.targetId), "foreign/duplicate reference target");
    targets.get(key(cell)).push(cell);
    for (const setting of modelSettings) {
      const arms = cell.arms.filter(a => a.setting === setting), selected = bound.get(armKey(cell, setting));
      check(arms.length === 1 && arms[0].family === "configured_model", "missing/foreign target model arm");
      const arm = arms[0], paths = arm.preparations.flatMap(p => p.observed.map(o => {
        const leaves = selected.leavesByPath.get(o.pathId);
        const history = selected.histories.get(o.pathId);
        check(history?.[1] === p.preparationUci && history[2] === o.learnerUci, "crossed frozen projected operands");
        check(leaves && sortedUnique(o.executedLeaves, "frozen executed witness").every(id => leaves.includes(id)), "foreign frozen executed witness");
        return o.pathId;
      }));
      check(same(sortedUnique(paths, "projected frozen third path"), selected.third)
        && same(sortedUnique(arm.preparations.map(p => p.preparationUci), "frozen projected preparation"), selected.firstPreparations)
        && arm.selectedPredecessorPaths === selected.third.length && arm.selectedFourthPlyLeaves === selected.fourth.length,
      "crossed frozen target/model frontier");
    }
  }
  for (const r of records) {
    check(!cases.has(caseIdentity(r.row)), "duplicate live case");
    check(subjects.has(key(r.row)) && modelSettings.includes(r.row.setting) && [2, 4].includes(r.row.horizon)
      && ["cold", "warm", "provider_offline"].includes(r.row.regime) && r.row.kind === r.raw.result.kind, "foreign live case/result");
    check(same(sortedUnique(r.raw.result.projections.map(p => p.targetId), "live target"), targets.get(key(r.row)).map(c => c.targetId).sort()),
      "lost/foreign live target"); cases.set(caseIdentity(r.row), r);
  }
  const expected = [...costCases({ candidates, settings: modelSettings.map(id => ({ id })), horizons: [2, 4], regimes: ["cold", "warm", "provider_offline"] })];
  check(records.length === expected.length && expected.every(c => cases.has(caseIdentity(c))), "incomplete configured-model population");
  const cachePairs = { identicalCompiled: 0, failedColdMissingWarmReceipt: 0 };
  let cacheNodeTransitions = 0;
  for (const c of expected.filter(c => c.regime === "cold")) {
    const cold = cases.get(caseIdentity(c)), warm = cases.get(caseIdentity({ ...c, regime: "warm" }));
    check(!warm.row.providerQueries.some(q => q.state === "executed"), "fresh warm model execution");
    const failed = ["invalid_source", "source_unavailable"].includes(cold.row.kind)
      || cold.row.kind === "budget_exhausted" && cold.row.providerQueries.some(q => !["executed", "cached"].includes(q.state));
    const evidence = cachedModelEvidence(cold.raw.result, warm.raw.result, failed);
    cacheNodeTransitions += evidence.transitions;
    if (failed) {
      const { kind: coldKind, ...before } = evidence.before, { kind: warmKind, ...after } = evidence.after;
      check(warmKind === "source_unavailable" && same(before, after), "warm changed partial model evidence"); cachePairs.failedColdMissingWarmReceipt++;
    } else {
      check(same(evidence.before, evidence.after), "warm changed compiled model evidence"); cachePairs.identicalCompiled++;
    }
  }
  const groups = new Map(), cells = [], policies = [];
  for (const { row, raw } of records.filter(r => r.row.horizon === 4 && r.row.regime === "cold")) {
    const candidate = subjects.get(key(row)), axis = { setting: row.setting, phase: candidate.phase, focus: candidate.focus ?? null };
    const identity = { rootId: row.rootId, candidateUci: row.candidateUci, ...axis }, selected = bound.get(armKey(row, row.setting));
    const group = groups.get(JSON.stringify(axis)) ?? { ...axis, candidates: 0, noTarget: 0, comparedPolicies: 0,
      unpairedPolicies: 0, changedPolicyWeights: 0, changedLayerMasses: 0, changedJointRule: 0,
      comparedCells: 0, unpairedCells: 0, changedFrontier: 0, changedCoverage: 0, changedOutcome: 0 };
    group.candidates++;
    let afterPolicy;
    if (row.kind === "available") {
      afterPolicy = liveModelPolicy(row, raw.result);
      const before = selected.policy, changed = { weights: !same(before.weights, afterPolicy.weights),
        layerMasses: !same(before.layerMasses, afterPolicy.layerMasses), jointRule: before.stopRule.status !== afterPolicy.stopRule.status };
      group.comparedPolicies++; group.changedPolicyWeights += Number(changed.weights);
      group.changedLayerMasses += Number(changed.layerMasses); group.changedJointRule += Number(changed.jointRule);
      policies.push({ ...identity, status: "compared", before, after: afterPolicy, changed });
    } else if (row.kind === "no_target") {
      group.noTarget++; check(same(raw.result.modelFrontier.coverage, { status: "not_requested_no_target" })
        && raw.result.modelFrontier.nodes.length === 0 && raw.result.modelFrontier.edges.length === 0, "no-target fabricated model coverage");
      policies.push({ ...identity, status: "no_target", comparison: "policy_not_requested_not_zero_coverage" });
    } else {
      group.unpairedPolicies++; policies.push({ ...identity, status: row.kind, comparison: "partial_source_not_compared_not_absence",
        retainedCoverage: raw.result.modelFrontier?.coverage ?? null });
    }
    for (const cell of targets.get(key(row))) {
      const arm = cell.arms.find(a => a.setting === row.setting), p = raw.result.projections.find(p => p.targetId === cell.targetId);
      check(p.immediate === cell.immediate, "crossed immediate convention");
      const targetIdentity = { ...identity, targetId: cell.targetId };
      if (row.kind !== "available") {
        group.unpairedCells++; cells.push({ ...targetIdentity, status: row.kind, comparison: "partial_source_not_compared_not_absence",
          retainedPartialOutcome: outcome(p, p.immediate, p.opportunityObserved, p.executionObserved),
          retainedObservations: raw.result.observations.filter(o => o.targetId === cell.targetId).length }); continue;
      }
      check(same(sortedUnique(raw.result.observations.filter(o => o.targetId === cell.targetId).map(o => historyId(row.rootId, o.history)), "target observed history"),
        afterPolicy.weights.map(e => e.pathId)), "crossed target/policy history set");
      const before = { frontier: { selectedPreparations: sortedUnique(arm.preparations.map(p => p.preparationUci), "frozen preparation"),
        thirdPathIds: selected.third, fourthPathIds: selected.fourth, fourthLeaves: selected.fourth.length,
        executedLeafIds: sortedUnique(arm.preparations.flatMap(p => p.observed.flatMap(o => o.executedLeaves)), "executed witness") },
        coverage: targetCoverage(arm), outcome: outcome(arm, cell.immediate, arm.observedReach, arm.observedExecution) };
      const after = { frontier: indexLiveTargetFrontier(row, raw.result, p), coverage: targetCoverage(p),
        outcome: outcome(p, p.immediate, p.opportunityObserved, p.executionObserved) };
      const changed = Object.fromEntries(Object.keys(before).map(field => [field, !same(before[field], after[field])]));
      group.comparedCells++; for (const field of ["Frontier", "Coverage", "Outcome"]) group[`changed${field}`] += Number(changed[field.toLowerCase()]);
      cells.push({ ...targetIdentity, status: "compared", before, after, changed });
    }
    groups.set(JSON.stringify(axis), group);
  }
  return { authority: "descriptive_fresh_frozen_configured_model_sensitivity_not_human_frequency_or_profile",
    rows: records.length, retainedCandidates: candidates.length, retainedCases: expected.map(c => ({ ...c, kind: cases.get(caseIdentity(c)).row.kind })),
    pairedCases: expected.length / 3, cachePairs, cacheNodeTransitions, comparedHorizon: 4, groups: [...groups.values()], policies, cells,
    policyComparison: "literal_conditional_and_joint_weights_separate_from_joint_rule_status_no_renormalization",
    floatingPointScope: "exact_values_reported_aggregate_addition_order_or_source_cause_not_attributed",
    shorterHorizon: "retained_and_cache_checked_not_compared_to_frozen_four_ply",
    cacheMeaning: cachePairs.failedColdMissingWarmReceipt > 0
      ? "same_partial_evidence_executed_to_cached_and_failed_to_missing_receipt_custody_not_fresh_warm_source"
      : "same_compiled_evidence_only_executed_to_cached_node_custody_transition_not_independent_source_repeat",
    policyMeaning: "both_sides_configured_model_not_human_frequency_or_arbitrary_learner",
    selectionRule: "per_node_prefix_includes_overshoot_max8_not_joint_threshold_selector",
    sourceDifferenceAttribution: "not_established", productionProfileSelected: false, moveReason: "not_an_engine_reason" };
}

export function loadFrozenModelSensitivity() {
  const inputs = {}, load = (name, digest) => {
    const bytes = readFileSync(`${directory}/${name}`); check(sha(bytes) === digest, `changed frozen source: ${name}`);
    inputs[name] = sha(bytes); return JSON.parse(name.endsWith(".gz") ? gunzipSync(bytes) : bytes);
  };
  const referenceName = Object.keys(sourcePins)[0], reference = load(referenceName, sourcePins[referenceName]);
  const targetName = "d3262-coherent-maia-target-outcome.json", target = load(targetName, reference.inputDigests[targetName]);
  const modelName = "d3262-coherent-maia-fourth-ply.json", continuation = load(modelName, target.inputDigests[modelName]);
  const policy = load(horizonName, horizonDigest);
  check(policy.inputDigests[referenceName] === inputs[referenceName] && policy.inputDigests[modelName] === inputs[modelName], "crossed frozen policy/source chain");
  const firstSources = ["d3262-maia-history-replay.json", "d3262-maia-coherent-new-child.json"]
    .flatMap(name => load(name, policy.inputDigests[name]).rows);
  return { reference, continuation, policy, firstSources, inputs };
}
export function loadModelSensitivity(names) {
  check(Array.isArray(names) && names.length && new Set(names).size === names.length
    && names.every(n => /^d3262-cost-live-[a-z0-9-]+\.json\.gz$/u.test(n)), "explicit unique immutable archive names required");
  const plan = loadCostPlan(), records = [], inputs = {}, sources = {};
  for (const name of names) {
    const bytes = readFileSync(`${directory}/${name}`), pack = JSON.parse(gunzipSync(bytes)); verifyPackedCostValue(pack);
    records.push(...pack.groups.flatMap(g => JSON.parse(gunzipSync(Buffer.from(g.base64, "base64")))));
    inputs[name] = sha(bytes); sources[name] = pack.metadata.provider;
  }
  validateCostRows(plan, records.map(r => r.row)); const frozen = loadFrozenModelSensitivity();
  return { question: "D3262", inputs, sources, frozenContinuationInputs: frozen.inputs,
    ...summarizeModelSensitivity(records, plan.candidates, frozen.reference, frozen),
    validation: "checked_archive_synthesis_independent_source_replay_required_separately" };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), write = args[0] === "--write", options = write ? args.slice(1) : args;
  check(options.length === 4 && options[0] === "--archives" && options[2] === "--out" && options[1] && options[3],
    "use [--write] --archives <CSV> --out <file.json[.gz]>");
  const value = loadModelSensitivity(options[1].split(",")), plain = `${JSON.stringify(value, null, 2)}\n`;
  if (write) writeFileSync(options[3], encodeSensitivityArtifact(plain, options[3]), { flag: "wx" });
  else check(decodeSensitivityArtifact(readFileSync(options[3]), options[3]) === plain, "changed sensitivity; never overwrite original evidence");
  process.stdout.write(`${JSON.stringify({ rows: value.rows, cells: value.cells.length, policies: value.policies.length,
    pairedCases: value.pairedCases, digest: sha(plain), productionProfileSelected: false })}\n`);
}
