// Disposable D3262 fresh/frozen complete-width comparison at one declared budget.
// Describes target/frontier changes, never engine causes or a production profile.
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { caseIdentity, costCases, loadCostPlan, sha, sourcePins, validateCostRows } from "./cost-contract.mjs";
import { verifyPackedCostValue } from "./cost-pack.mjs";
import { readCostArchiveBytes } from "./cost-archive-parts.mjs";

const directory = "planning/semantic-consequence-search";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (value, message) => { if (!value) throw new Error(`D3262_ENGINE_WIDTH_SENSITIVITY: ${message}`); };
export function engineSettings(budget = "depth8") {
  check(["depth8", "depth12", "movetime100"].includes(budget), "undeclared engine budget");
  return Object.freeze([2, 4, 8].map(width => `engine:${budget}:top${width}`));
}
export const settings = engineSettings();
export function encodeSensitivityArtifact(json, out) {
  check(typeof json === "string" && typeof out === "string" && /\.json(?:\.gz)?$/u.test(out), "JSON or lossless gzip output required");
  return out.endsWith(".gz") ? gzipSync(json) : Buffer.from(json);
}
export function decodeSensitivityArtifact(bytes, out) {
  check(Buffer.isBuffer(bytes) && typeof out === "string" && /\.json(?:\.gz)?$/u.test(out), "JSON or lossless gzip input required");
  return (out.endsWith(".gz") ? gunzipSync(bytes) : bytes).toString("utf8");
}
const subjectKey = x => JSON.stringify([x.rootId, x.candidateUci]);
const uniqueSorted = (values, name) => {
  check(Array.isArray(values) && values.every(x => typeof x === "string")
    && new Set(values).size === values.length, `duplicate/invalid ${name}`);
  return [...values].sort();
};
const resultOutcome = p => ({ availability: p.rawQuantifier.availability, execution: p.rawQuantifier.execution,
  licensedAvailability: p.licensedAvailability, observedReach: p.immediate === "preserved" || p.opportunityObserved,
  observedExecution: p.executionObserved });
const frozenOutcome = (cell, arm) => ({ availability: arm.rawQuantifier.availability, execution: arm.rawQuantifier.execution,
  licensedAvailability: arm.licensedAvailability, observedReach: cell.immediate === "preserved" || arm.observedReach,
  observedExecution: arm.observedExecution });
function frontier(preparations, thirdPathIds, fourthPathIds) {
  return { selectedPreparations: uniqueSorted(preparations.map(x => x.preparationUci), "preparation"),
    thirdPathIds: uniqueSorted(thirdPathIds, "third-ply path"),
    fourthPathIds: uniqueSorted(fourthPathIds, "fourth-ply path"), fourthLeaves: fourthPathIds.length,
    executedLeafIds: uniqueSorted(preparations.flatMap(x => x.observed.flatMap(y => y.executedLeaves)), "executed leaf") };
}
function coverage(quantifier, preparations) {
  return { omittedPreparations: uniqueSorted(quantifier.omittedPreparations, "omitted preparation"),
    unvisitedDefences: preparations.map(x => ({ preparationUci: x.preparationUci,
      moves: uniqueSorted(x.unvisitedDefences, "unvisited defence") })).sort((a, b) => a.preparationUci.localeCompare(b.preparationUci)) };
}
export function indexEngineContinuation(continuation, candidates, budget = "depth8") {
  const selectedSettings = engineSettings(budget);
  const profiles = continuation.profiles.filter(x => x.kind === "engine");
  check(profiles.length === 1, "missing/duplicate frozen engine continuation");
  const profile = profiles[0], paths = new Map(profile.paths.map(x => [x.id, x]));
  const leaves = new Map(continuation.leaves.map(x => [x.id, x])), subjects = new Set(candidates.map(subjectKey));
  check(paths.size === profile.paths.length && leaves.size === continuation.leaves.length, "duplicate frozen continuation identity");
  check(profile.rows.length === candidates.length && new Set(profile.rows.map(subjectKey)).size === candidates.length
    && profile.rows.every(x => subjects.has(subjectKey(x))), "incomplete frozen continuation population");
  const result = new Map();
  for (const row of profile.rows) for (const setting of selectedSettings) {
    const arms = row.arms.filter(x => x.arm === setting);
    check(arms.length === 1, "missing/duplicate frozen continuation arm");
    const arm = arms[0], third = uniqueSorted(arm.selectedPaths, "frozen selected path"), fourth = [];
    for (const id of third) {
      const path = paths.get(id);
      check(path && path.rootId === row.rootId && path.historyUci.length === 3
        && path.historyUci[0] === row.candidateUci && id === sha(JSON.stringify([row.rootId, ...path.historyUci])), "crossed frozen third history");
      const choices = path.arms.filter(x => x.arm === setting);
      check(choices.length === 1, "missing/duplicate frozen path arm");
      for (const selected of choices[0].selected) {
        const leaf = leaves.get(selected.leafId), history = [...path.historyUci, selected.moveUci];
        check(leaf && leaf.rootId === row.rootId && same(leaf.historyUci, history)
          && leaf.id === sha(JSON.stringify([row.rootId, ...history])), "crossed frozen fourth history");
        fourth.push(leaf.id);
      }
    }
    check(arm.selectedFourthPlyEdges === fourth.length, "crossed frozen fourth count");
    result.set(JSON.stringify([row.rootId, row.candidateUci, setting]), { third, fourth: uniqueSorted(fourth, "frozen fourth path") });
  }
  return result;
}
export function summarizeEngineWidthSensitivity(records, candidates, reference, continuation, budget = "depth8") {
  const selectedSettings = engineSettings(budget);
  const frozenFrontiers = indexEngineContinuation(continuation, candidates, budget);
  const subjects = new Map(candidates.map(x => [subjectKey(x), x])), cases = new Map();
  check(subjects.size === candidates.length, "duplicate candidate");
  const targets = new Map(candidates.map(x => [subjectKey(x), []]));
  for (const cell of reference.rows) {
    check(targets.has(subjectKey(cell)), "foreign reference candidate");
    const list = targets.get(subjectKey(cell));
    check(!list.some(x => x.targetId === cell.targetId), "duplicate reference target");
    list.push(cell);
  }
  for (const record of records) {
    const key = caseIdentity(record.row);
    check(!cases.has(key), "duplicate live case");
    check(subjects.has(subjectKey(record.row)) && selectedSettings.includes(record.row.setting)
      && [2, 4].includes(record.row.horizon) && ["cold", "warm", "provider_offline"].includes(record.row.regime), "foreign live case");
    const actual = uniqueSorted(record.raw.result.projections.map(x => x.targetId), "live target");
    check(same(actual, targets.get(subjectKey(record.row)).map(x => x.targetId).sort()), "lost/foreign target projection");
    cases.set(key, record);
  }
  const expected = [...costCases({ settings: selectedSettings.map(id => ({ id })), candidates,
    horizons: [2, 4], regimes: ["cold", "warm", "provider_offline"] })];
  check(records.length === expected.length && expected.every(x => cases.has(caseIdentity(x))), "incomplete complete-width population");
  const cachePairs = { identicalCompiled: 0, failedColdMissingWarmReceipt: 0 };
  for (const cell of expected.filter(x => x.regime === "cold")) {
    const cold = cases.get(caseIdentity(cell)), warm = cases.get(caseIdentity({ ...cell, regime: "warm" }));
    check(!warm.row.providerQueries.some(x => x.state === "executed"), "fresh execution labelled warm");
    const failedSource = ["invalid_source", "source_unavailable"].includes(cold.row.kind)
      || cold.row.kind === "budget_exhausted" && cold.row.providerQueries.some(x => !["executed", "cached"].includes(x.state));
    if (failedSource) {
      const { kind: coldKind, ...coldEvidence } = cold.raw.result;
      const { kind: warmKind, ...warmEvidence } = warm.raw.result;
      check(["invalid_source", "source_unavailable", "budget_exhausted"].includes(cold.row.kind)
        && warm.row.kind === "source_unavailable" && same(coldEvidence, warmEvidence), "warm changed compiled evidence");
      cachePairs.failedColdMissingWarmReceipt++;
    } else {
      check(same(cold.raw.result, warm.raw.result) && cold.row.kind === warm.row.kind, "warm changed compiled evidence");
      cachePairs.identicalCompiled++;
    }
  }
  const groups = new Map(), cells = [];
  for (const record of records.filter(x => x.row.horizon === 4 && x.row.regime === "cold")) {
    const { row, raw } = record, subject = subjects.get(subjectKey(row));
    const axis = { setting: row.setting, phase: subject.phase, focus: subject.focus ?? null }, key = JSON.stringify(axis);
    const group = groups.get(key) ?? { ...axis, candidates: 0, noTarget: 0, namedCells: 0,
      comparedCells: 0, unpairedCells: 0, changedFrontier: 0, changedCoverage: 0, changedOutcome: 0 };
    group.candidates++;
    const named = targets.get(subjectKey(row));
    if (!named.length) group.noTarget++;
    for (const cell of named) {
      const arm = cell.arms.find(x => x.setting === row.setting);
      check(arm?.family === "engine_beam", "missing/foreign frozen engine arm");
      const projection = raw.result.projections.find(x => x.targetId === cell.targetId);
      check(projection.immediate === cell.immediate, "crossed immediate convention");
      group.namedCells++;
      const identity = { rootId: row.rootId, candidateUci: row.candidateUci, targetId: cell.targetId, ...axis };
      if (row.kind !== "available") {
        group.unpairedCells++;
        cells.push({ ...identity, status: row.kind, comparison: "not_compared_failed_or_exhausted_source_not_absence",
          retainedPartialOutcome: resultOutcome(projection), retainedObservations: raw.result.observations.filter(x => x.targetId === cell.targetId).length });
        continue;
      }
      const observations = raw.result.observations.filter(x => x.targetId === cell.targetId);
      const oldPaths = arm.preparations.flatMap(x => x.observed.map(y => y.pathId));
      check(oldPaths.length === arm.selectedPredecessorPaths, "crossed frozen third-ply count");
      const frozen = frozenFrontiers.get(JSON.stringify([row.rootId, row.candidateUci, row.setting]));
      check(same(uniqueSorted(oldPaths, "frozen target third path"), frozen.third)
        && arm.selectedFourthPlyLeaves === frozen.fourth.length, "crossed target/continuation join");
      const before = { frontier: frontier(arm.preparations, oldPaths, frozen.fourth),
        coverage: coverage(arm.rawQuantifier, arm.preparations), outcome: frozenOutcome(cell, arm) };
      const after = { frontier: frontier(projection.preparations,
        observations.filter(x => x.history.length === 3).map(x => sha(JSON.stringify([row.rootId, ...x.history]))),
        observations.filter(x => x.history.length === 4).map(x => sha(JSON.stringify([row.rootId, ...x.history])))),
        coverage: coverage(projection.rawQuantifier, projection.preparations), outcome: resultOutcome(projection) };
      const changed = Object.fromEntries(Object.keys(before).map(field => [field, !same(before[field], after[field])]));
      group.comparedCells++;
      for (const field of ["Frontier", "Coverage", "Outcome"]) group[`changed${field}`] += Number(changed[field.toLowerCase()]);
      cells.push({ ...identity, status: "compared", before, after, changed });
    }
    groups.set(key, group);
  }
  return { authority: "descriptive_fresh_frozen_engine_width_sensitivity_not_engine_causality_or_profile",
    retainedCases: expected.map(x => ({ ...x, kind: cases.get(caseIdentity(x)).row.kind })), rows: records.length,
    retainedCandidates: candidates.length, comparedHorizon: 4, pairedCases: expected.length / 3, cachePairs,
    cacheMeaning: "same_compiled_evidence_not_independent_source_repeat", groups: [...groups.values()], cells,
    frontierIdentityScope: "complete_third_and_fourth_path_identities_and_executed_witnesses_not_just_counts",
    shorterHorizon: "retained_and_cache_checked_not_compared_to_frozen_four_ply",
    sourceDifferenceAttribution: "not_established_version_configuration_timing_and_search_may_differ",
    otherBudgetsAndFamilies: "not_measured_here", productionProfileSelected: false, moveReason: "not_an_engine_reason" };
}
export function loadEngineWidthSensitivity(names, budget = "depth8") {
  engineSettings(budget);
  check(Array.isArray(names) && names.length && new Set(names).size === names.length
    && names.every(x => /^d3262-cost-live-[a-z0-9-]+\.json\.gz$/u.test(x)), "explicit unique immutable archive names required");
  const plan = loadCostPlan(), records = [], inputs = {}, sources = {};
  for (const name of names) {
    const bytes = readCostArchiveBytes(`${directory}/${name}`), pack = JSON.parse(gunzipSync(bytes));
    verifyPackedCostValue(pack);
    records.push(...pack.groups.flatMap(x => JSON.parse(gunzipSync(Buffer.from(x.base64, "base64")))));
    inputs[name] = sha(bytes); sources[name] = pack.metadata.provider;
  }
  validateCostRows(plan, records.map(x => x.row));
  const referenceName = Object.keys(sourcePins)[0], bytes = readFileSync(`${directory}/${referenceName}`);
  check(sha(bytes) === sourcePins[referenceName], "changed frozen reference");
  const reference = JSON.parse(gunzipSync(bytes));
  const targetName = "d3262-coherent-engine-target-outcome.json.gz", targetBytes = readFileSync(`${directory}/${targetName}`);
  check(sha(targetBytes) === reference.inputDigests[targetName], "changed frozen target source");
  const target = JSON.parse(gunzipSync(targetBytes)), continuationName = "d3262-coherent-engine-fourth-ply.json.gz";
  const continuationBytes = readFileSync(`${directory}/${continuationName}`);
  check(sha(continuationBytes) === target.inputDigests[continuationName], "changed frozen continuation source");
  return { question: "D3262", inputs: { ...inputs, [referenceName]: sha(bytes) }, sources,
    frozenContinuationInputs: { [targetName]: sha(targetBytes), [continuationName]: sha(continuationBytes) },
    ...summarizeEngineWidthSensitivity(records, plan.candidates, reference, JSON.parse(gunzipSync(continuationBytes)), budget),
    validation: "checked_archive_synthesis_independent_receipt_replay_required_separately" };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), write = args[0] === "--write";
  let options = write ? args.slice(1) : args, budget = "depth8";
  if (options[0] === "--budget") { budget = options[1]; engineSettings(budget); options = options.slice(2); }
  check(options.length === 4 && options[0] === "--archives" && options[2] === "--out" && options[1] && options[3],
    "use [--write] [--budget depth8|depth12|movetime100] --archives <CSV> --out <file.json[.gz]>");
  const value = loadEngineWidthSensitivity(options[1].split(","), budget), bytes = `${JSON.stringify(value, null, 2)}\n`;
  if (write) writeFileSync(options[3], encodeSensitivityArtifact(bytes, options[3]), { flag: "wx" });
  else check(decodeSensitivityArtifact(readFileSync(options[3]), options[3]) === bytes, "changed sensitivity; never overwrite original evidence");
  process.stdout.write(`${JSON.stringify({ rows: value.rows, cells: value.cells.length, pairedCases: value.pairedCases,
    digest: sha(bytes), productionProfileSelected: false })}\n`);
}
