// Disposable D3262 research: complete recursive populations against their own
// frozen target-specific paths. No source admission, engine cause or default.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { caseIdentity, costCases, loadCostPlan, sha, sourcePins, validateCostRows } from "./cost-contract.mjs";
import { verifyPackedCostValue } from "./cost-pack.mjs";
import { encodeSensitivityArtifact, decodeSensitivityArtifact } from "./cost-engine-width-sensitivity.mjs";

const directory = "planning/semantic-consequence-search";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (value, message) => { if (!value) throw new Error(`D3262_RECURSIVE_SENSITIVITY: ${message}`); };
const subjectKey = x => JSON.stringify([x.rootId, x.candidateUci]);
const targetKey = x => JSON.stringify([x.rootId, x.candidateUci, x.targetId]);
const armKey = (x, setting) => JSON.stringify([x.rootId, x.candidateUci, x.targetId, setting]);
const nodeKey = x => JSON.stringify([x.pathId, x.targetId, x.arm]);
const pathId = (rootId, history) => sha(JSON.stringify([rootId, ...history]));
const uniqueSorted = (values, name) => {
  check(Array.isArray(values) && values.every(x => typeof x === "string")
    && new Set(values).size === values.length, `duplicate/invalid ${name}`);
  return [...values].sort();
};
function index(rows, key, label) {
  const result = new Map(rows.map(row => [key(row), row]));
  check(result.size === rows.length, `duplicate ${label}`);
  return result;
}
export function recursiveSettings(budget = "depth8") {
  check(["depth8", "depth12", "movetime100"].includes(budget), "undeclared recursive budget");
  return Object.freeze([2, 4, 8].flatMap(width => ["top8", "all_legal"].map(events =>
    `recursive:${budget}:top${width}:${events}`)));
}
function outcome(projection, immediate, reach, execution) {
  return { availability: projection.rawQuantifier.availability, execution: projection.rawQuantifier.execution,
    licensedAvailability: projection.licensedAvailability,
    observedReach: immediate === "preserved" || reach, observedExecution: execution };
}
function frontier(preparations, third, fourth) {
  return { selectedPreparations: uniqueSorted(preparations.map(p => p.preparationUci), "preparation"),
    thirdPathIds: uniqueSorted(third, "third path"), fourthPathIds: uniqueSorted(fourth, "fourth path"),
    fourthLeaves: fourth.length,
    executedLeafIds: uniqueSorted(preparations.flatMap(p => p.observed.flatMap(o => o.executedLeaves)), "executed witness") };
}
function coverage(projection) {
  return { omittedPreparations: uniqueSorted(projection.rawQuantifier.omittedPreparations, "omitted preparation"),
    unvisitedDefences: projection.preparations.map(p => ({ preparationUci: p.preparationUci,
      moves: uniqueSorted(p.unvisitedDefences, "unvisited defence"),
      unexpandedTerminalLegalMoves: p.unexpandedTerminalLegalMoves })).sort((a, b) => a.preparationUci.localeCompare(b.preparationUci)) };
}

/** Unlike engine beams, a recursive frontier belongs to a target AND setting. */
export function indexRecursiveContinuation(continuation, candidates, reference, budget = "depth8") {
  const settings = recursiveSettings(budget), subjects = index(candidates, subjectKey, "candidate");
  check(continuation.profile === "d3262-coherent-recursive-fourth-ply-v1" && continuation.providerOff === false
    && continuation.authority === "disposable_actual_recursive_geometry_selected_paths_not_profit_proof_or_complete_arm5",
  "foreign frozen recursive continuation authority");
  const cells = index(reference.rows, targetKey, "reference target"), rows = index(continuation.rows, targetKey, "frozen target");
  const paths = index(continuation.paths, p => p.id, "frozen third path");
  const nodes = index(continuation.finalPlyNodes, nodeKey, "frozen final node");
  check(rows.size === cells.size && [...rows].every(([key, row]) => cells.has(key) && subjects.has(subjectKey(row))),
    "lost/foreign frozen target population");
  const population = index(continuation.candidateCoverage, subjectKey, "frozen candidate");
  check(population.size === subjects.size && [...subjects.keys()].every(key => population.has(key)), "lost/foreign frozen candidate population");
  const result = new Map();
  for (const [key, cell] of cells) {
    const row = rows.get(key);
    for (const setting of settings) {
      const chosen = row.arms.filter(a => a.arm === setting), projections = cell.arms.filter(a => a.setting === setting);
      check(chosen.length === 1 && projections.length === 1 && projections[0].family === "recursive_semantic",
        "missing/duplicate/foreign recursive arm");
      const arm = chosen[0], projection = projections[0], third = [], fourth = [], leavesByPath = new Map();
      check(same(uniqueSorted(arm.selectedReplyUcis, "selected preparation"),
        uniqueSorted(arm.replies.map(p => p.replyUci), "reply preparation")), "crossed frozen preparation set");
      for (const reply of arm.replies) for (const selected of reply.selected) {
        const path = paths.get(selected.pathId), node = nodes.get(nodeKey({ pathId: selected.pathId, targetId: row.targetId, arm: setting }));
        const history = [row.candidateUci, reply.replyUci, selected.learnerUci];
        check(path && node && path.rootId === row.rootId && same(path.historyUci, history)
          && path.id === pathId(row.rootId, history), "crossed frozen third history");
        const bindings = path.subjects.filter(s => s.targetId === row.targetId);
        check(bindings.length === 1 && bindings[0].selectedBy.includes(setting), "crossed frozen path target/setting");
        check(node.status !== "source_off" && (!path.terminalReason || node.selected.length === 0), "unavailable/extended terminal frozen node");
        third.push(path.id);
        const leaves = node.selected.map(leaf => {
          check(leaf.leafId === pathId(row.rootId, [...history, leaf.moveUci]), "crossed frozen fourth history");
          return leaf.leafId;
        });
        fourth.push(...leaves); leavesByPath.set(path.id, uniqueSorted(leaves, "fourth choice"));
      }
      const bound = { third: uniqueSorted(third, "frozen selected third path"), fourth: uniqueSorted(fourth, "frozen selected fourth path") };
      check(same(uniqueSorted(projection.preparations.map(p => p.preparationUci), "projected preparation"),
        uniqueSorted(arm.selectedReplyUcis, "frozen preparation")), "crossed frozen projected preparations");
      const observed = projection.preparations.flatMap(p => p.observed.map(o => {
        const path = paths.get(o.pathId);
        check(path && path.historyUci[1] === p.preparationUci && path.historyUci[2] === o.learnerUci,
          "crossed frozen projected path operands");
        const leaves = leavesByPath.get(o.pathId);
        check(leaves && uniqueSorted(o.executedLeaves, "frozen executed witness").every(id => leaves.includes(id)),
          "foreign frozen executed witness");
        return o.pathId;
      }));
      check(same(uniqueSorted(observed, "projected third path"), bound.third)
        && projection.selectedPredecessorPaths === bound.third.length
        && projection.selectedFourthPlyLeaves === bound.fourth.length, "crossed frozen target/frontier count");
      result.set(armKey(row, setting), bound);
    }
  }
  return result;
}

export function indexLiveRecursiveFrontier(row, result, projection) {
  const observations = result.observations.filter(o => o.targetId === projection.targetId);
  const histories = index(observations, o => pathId(row.rootId, o.history), "live target history");
  for (const o of observations) {
    check([2, 3, 4].includes(o.history.length) && o.history[0] === row.candidateUci, "crossed live history");
    if (o.history.length > 2) check(histories.has(pathId(row.rootId, o.history.slice(0, -1))), "orphan live path");
  }
  const third = observations.filter(o => o.history.length === 3).map(o => pathId(row.rootId, o.history));
  const fourth = observations.filter(o => o.history.length === 4).map(o => pathId(row.rootId, o.history));
  const observed = projection.preparations.flatMap(p => p.observed.map(o => {
    const actual = histories.get(o.pathId);
    check(actual?.history.length === 3 && actual.history[1] === p.preparationUci
      && actual.history[2] === o.learnerUci, "crossed live projected path operands");
    const witnesses = observations.filter(x => x.history.length === 4
      && same(x.history.slice(0, 3), actual.history) && x.observation.executedAtFourthPly)
      .map(x => pathId(row.rootId, x.history));
    check(same(uniqueSorted(o.executedLeaves, "live executed witness"), uniqueSorted(witnesses, "observed executed witness")),
      "crossed live executed witness");
    return o.pathId;
  }));
  check(same(uniqueSorted(observed, "live projected third path"), uniqueSorted(third, "live observed third path")),
    "lost live projected history");
  return frontier(projection.preparations, third, fourth);
}

export function summarizeRecursiveSensitivity(records, candidates, reference, continuation, budget = "depth8") {
  const settings = recursiveSettings(budget), bound = indexRecursiveContinuation(continuation, candidates, reference, budget);
  const subjects = index(candidates, subjectKey, "candidate"), cases = new Map();
  const targets = new Map(candidates.map(c => [subjectKey(c), []]));
  for (const cell of reference.rows) {
    check(targets.has(subjectKey(cell)), "foreign reference candidate");
    targets.get(subjectKey(cell)).push(cell);
  }
  for (const record of records) {
    const key = caseIdentity(record.row);
    check(!cases.has(key), "duplicate live case");
    check(subjects.has(subjectKey(record.row)) && settings.includes(record.row.setting)
      && [2, 4].includes(record.row.horizon) && ["cold", "warm", "provider_offline"].includes(record.row.regime), "foreign live case");
    check(record.raw.result.kind === record.row.kind, "crossed live result kind");
    check(same(uniqueSorted(record.raw.result.projections.map(p => p.targetId), "live target"),
      targets.get(subjectKey(record.row)).map(c => c.targetId).sort()), "lost/foreign live target");
    cases.set(key, record);
  }
  const expected = [...costCases({ settings: settings.map(id => ({ id })), candidates,
    horizons: [2, 4], regimes: ["cold", "warm", "provider_offline"] })];
  check(records.length === expected.length && expected.every(c => cases.has(caseIdentity(c))), "incomplete recursive population");
  const cachePairs = { identicalCompiled: 0, failedColdMissingWarmReceipt: 0 };
  for (const cell of expected.filter(c => c.regime === "cold")) {
    const cold = cases.get(caseIdentity(cell)), warm = cases.get(caseIdentity({ ...cell, regime: "warm" }));
    check(!warm.row.providerQueries.some(q => q.state === "executed"), "fresh execution labelled warm");
    const failed = ["invalid_source", "source_unavailable"].includes(cold.row.kind)
      || cold.row.kind === "budget_exhausted" && cold.row.providerQueries.some(q => !["executed", "cached"].includes(q.state));
    if (failed) {
      const { kind: coldKind, ...before } = cold.raw.result, { kind: warmKind, ...after } = warm.raw.result;
      check(warmKind === "source_unavailable" && same(before, after), "warm changed partial compiled evidence");
      cachePairs.failedColdMissingWarmReceipt++;
    } else {
      check(cold.row.kind === warm.row.kind && same(cold.raw.result, warm.raw.result), "warm changed compiled evidence");
      cachePairs.identicalCompiled++;
    }
  }
  const groups = new Map(), cells = [];
  for (const record of records.filter(r => r.row.horizon === 4 && r.row.regime === "cold")) {
    const { row, raw } = record, candidate = subjects.get(subjectKey(row));
    const axis = { setting: row.setting, phase: candidate.phase, focus: candidate.focus ?? null }, key = JSON.stringify(axis);
    const group = groups.get(key) ?? { ...axis, candidates: 0, noTarget: 0, namedCells: 0,
      comparedCells: 0, unpairedCells: 0, changedFrontier: 0, changedCoverage: 0, changedOutcome: 0 };
    const named = targets.get(subjectKey(row)); group.candidates++; if (!named.length) group.noTarget++;
    for (const cell of named) {
      const arm = cell.arms.find(a => a.setting === row.setting), projection = raw.result.projections.find(p => p.targetId === cell.targetId);
      check(projection.immediate === cell.immediate, "crossed immediate convention");
      const identity = { rootId: row.rootId, candidateUci: row.candidateUci, targetId: cell.targetId, ...axis };
      group.namedCells++;
      if (row.kind !== "available") {
        group.unpairedCells++;
        cells.push({ ...identity, status: row.kind, comparison: "not_compared_failed_or_exhausted_source_not_absence",
          retainedPartialOutcome: outcome(projection, projection.immediate, projection.opportunityObserved, projection.executionObserved),
          retainedObservations: raw.result.observations.filter(o => o.targetId === cell.targetId).length });
        continue;
      }
      const frozen = bound.get(armKey(cell, row.setting));
      const before = { frontier: frontier(arm.preparations, frozen.third, frozen.fourth), coverage: coverage(arm),
        outcome: outcome(arm, cell.immediate, arm.observedReach, arm.observedExecution) };
      const after = { frontier: indexLiveRecursiveFrontier(row, raw.result, projection), coverage: coverage(projection),
        outcome: outcome(projection, projection.immediate, projection.opportunityObserved, projection.executionObserved) };
      const changed = Object.fromEntries(Object.keys(before).map(field => [field, !same(before[field], after[field])]));
      group.comparedCells++;
      for (const field of ["Frontier", "Coverage", "Outcome"]) group[`changed${field}`] += Number(changed[field.toLowerCase()]);
      cells.push({ ...identity, status: "compared", before, after, changed });
    }
    groups.set(key, group);
  }
  return { authority: "descriptive_fresh_frozen_target_specific_recursive_sensitivity_not_engine_causality_or_profile",
    rows: records.length, retainedCandidates: candidates.length, retainedCases: expected.map(c => ({ ...c, kind: cases.get(caseIdentity(c)).row.kind })),
    comparedHorizon: 4, pairedCases: expected.length / 3, cachePairs, groups: [...groups.values()], cells,
    frontierIdentityScope: "target_setting_complete_third_and_fourth_histories_and_executed_witnesses_not_counts",
    shorterHorizon: "retained_and_cache_checked_not_compared_to_frozen_four_ply",
    coverageScope: "preparation_and_learner_defence_omissions_fourth_selected_paths_not_complete_fourth_reply_coverage",
    cacheMeaning: "same_compiled_evidence_not_independent_source_repeat",
    sourceDifferenceAttribution: "not_established_version_configuration_timing_and_search_may_differ",
    otherBudgetsAndFamilies: "not_measured_here", productionProfileSelected: false, moveReason: "not_an_engine_reason" };
}

export function loadFrozenRecursiveSensitivity() {
  const referenceName = Object.keys(sourcePins)[0], bytes = readFileSync(`${directory}/${referenceName}`);
  check(sha(bytes) === sourcePins[referenceName], "changed frozen comparison");
  const reference = JSON.parse(gunzipSync(bytes)), inputs = { [referenceName]: sha(bytes) };
  const load = (name, digest) => {
    const value = readFileSync(`${directory}/${name}`);
    check(sha(value) === digest, `changed frozen source: ${name}`); inputs[name] = sha(value);
    return JSON.parse(gunzipSync(value));
  };
  const evaluationName = "d3262-coherent-recursive-evaluation.json.gz";
  const evaluation = load(evaluationName, reference.inputDigests[evaluationName]);
  const continuationName = "d3262-coherent-recursive-fourth-ply.json.gz";
  const continuation = load(continuationName, evaluation.inputDigests[continuationName]);
  const frameName = "d3262-coherent-recursive-semantic-frame.json.gz", frame = load(frameName, evaluation.inputDigests[frameName]);
  check(continuation.frozenFrameDigest === inputs[frameName] && continuation.inputDigests[frameName] === inputs[frameName]
    && same(continuation.rows, frame.rows) && same(continuation.paths, frame.paths), "changed frozen selection chain");
  return { reference, continuation, inputs };
}
export function loadRecursiveSensitivity(names, budget = "depth8") {
  recursiveSettings(budget);
  check(Array.isArray(names) && names.length && new Set(names).size === names.length
    && names.every(n => /^d3262-cost-live-[a-z0-9-]+\.json\.gz$/u.test(n)), "explicit unique immutable archive names required");
  const plan = loadCostPlan(), records = [], inputs = {}, sources = {};
  for (const name of names) {
    const bytes = readFileSync(`${directory}/${name}`), pack = JSON.parse(gunzipSync(bytes)); verifyPackedCostValue(pack);
    records.push(...pack.groups.flatMap(g => JSON.parse(gunzipSync(Buffer.from(g.base64, "base64")))));
    inputs[name] = sha(bytes); sources[name] = pack.metadata.provider;
  }
  validateCostRows(plan, records.map(r => r.row));
  const frozen = loadFrozenRecursiveSensitivity();
  return { question: "D3262", inputs, sources, frozenContinuationInputs: frozen.inputs,
    ...summarizeRecursiveSensitivity(records, plan.candidates, frozen.reference, frozen.continuation, budget),
    validation: "checked_archive_synthesis_independent_receipt_replay_required_separately" };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), write = args[0] === "--write";
  let options = write ? args.slice(1) : args, budget = "depth8";
  if (options[0] === "--budget") { budget = options[1]; recursiveSettings(budget); options = options.slice(2); }
  check(options.length === 4 && options[0] === "--archives" && options[2] === "--out" && options[1] && options[3],
    "use [--write] [--budget depth8|depth12|movetime100] --archives <CSV> --out <file.json[.gz]>");
  const value = loadRecursiveSensitivity(options[1].split(","), budget), plain = `${JSON.stringify(value, null, 2)}\n`;
  if (write) writeFileSync(options[3], encodeSensitivityArtifact(plain, options[3]), { flag: "wx" });
  else check(decodeSensitivityArtifact(readFileSync(options[3]), options[3]) === plain, "changed sensitivity; never overwrite original evidence");
  process.stdout.write(`${JSON.stringify({ rows: value.rows, cells: value.cells.length, pairedCases: value.pairedCases,
    digest: sha(plain), productionProfileSelected: false })}\n`);
}
