// Disposable D3262 descriptive fresh/frozen PV sensitivity. No chess truth,
// production profile selection, grade or independent source/clock attestation.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { caseIdentity, costCases, loadCostPlan, sha, sourcePins, validateCostRows } from "./cost-contract.mjs";
import { verifyPackedCostValue } from "./cost-pack.mjs";

const directory = "planning/semantic-consequence-search";
export const settings = ["pv:depth8", "pv:depth12", "pv:movetime100"];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const check = (value, message) => { if (!value) throw new Error(`D3262_PV_SENSITIVITY: ${message}`); };
const candidateKey = x => JSON.stringify([x.rootId, x.candidateUci]);
const outcome = x => ({ availability: x.rawQuantifier.availability, execution: x.rawQuantifier.execution,
  licensedAvailability: x.licensedAvailability, observedReach: x.immediate === "preserved" || x.opportunityObserved,
  observedExecution: x.executionObserved });
const frozenOutcome = (cell, arm) => ({ availability: arm.rawQuantifier.availability,
  execution: arm.rawQuantifier.execution, licensedAvailability: arm.licensedAvailability,
  observedReach: cell.immediate === "preserved" || arm.observedReach, observedExecution: arm.observedExecution });

export function summarizePvSensitivity(records, candidates, reference) {
  const byCase = new Map(), subjects = new Map(candidates.map(x => [candidateKey(x), x]));
  check(subjects.size === candidates.length, "duplicate candidate");
  const targetCells = new Map(candidates.map(x => [candidateKey(x), []]));
  for (const cell of reference.rows) {
    check(targetCells.has(candidateKey(cell)), "foreign reference candidate");
    const cells = targetCells.get(candidateKey(cell));
    check(!cells.some(x => x.targetId === cell.targetId), "duplicate reference target");
    cells.push(cell);
  }
  for (const record of records) {
    const key = caseIdentity(record.row);
    check(!byCase.has(key), "duplicate live case");
    check(subjects.has(candidateKey(record.row)) && settings.includes(record.row.setting)
      && [2, 4].includes(record.row.horizon) && ["cold", "warm", "provider_offline"].includes(record.row.regime), "foreign live case");
    const actual = record.raw.result.projections.map(x => x.targetId).sort();
    const expected = targetCells.get(candidateKey(record.row)).map(x => x.targetId).sort();
    check(same(actual, expected), "missing/duplicate/foreign target projection");
    byCase.set(key, record);
  }
  const expected = [...costCases({ settings: settings.map(id => ({ id })), candidates, horizons: [2, 4],
    regimes: ["cold", "warm", "provider_offline"] })];
  check(records.length === expected.length && expected.every(x => byCase.has(caseIdentity(x))), "incomplete complete-PV population");
  let pairedCases = 0;
  const cachePairs = { identicalCompiled: 0, failedColdMissingWarmReceipt: 0 };
  for (const cell of expected.filter(x => x.regime === "cold")) {
    const cold = byCase.get(caseIdentity(cell));
    const warm = byCase.get(caseIdentity({ ...cell, regime: "warm" }));
    if (["source_unavailable", "invalid_source", "budget_exhausted"].includes(cold.row.kind)) {
      const { kind: coldKind, ...coldEvidence } = cold.raw.result;
      const { kind: warmKind, ...warmEvidence } = warm.raw.result;
      check(warm.row.kind === "source_unavailable" && same(coldEvidence, warmEvidence)
        && warm.row.cacheHits === 0 && warm.raw.result.providerPv === null, "warm changed failed cold evidence");
      cachePairs.failedColdMissingWarmReceipt++;
    } else {
      check(cold.row.kind === warm.row.kind && same(cold.raw.result, warm.raw.result), "warm changed compiled evidence");
      cachePairs.identicalCompiled++;
    }
    pairedCases++;
  }
  const cells = [], groups = new Map();
  for (const record of records.filter(x => x.row.regime === "cold" && x.row.horizon === 4)) {
    const { row, raw } = record, subject = subjects.get(candidateKey(row));
    const axis = { setting: row.setting, phase: subject.phase, focus: subject.focus ?? null };
    const groupKey = JSON.stringify(axis);
    const group = groups.get(groupKey) ?? { ...axis, candidates: 0, noTarget: 0, namedCells: 0,
      unavailableCells: 0, comparedCells: 0, changedHistory: 0, changedScore: 0,
      changedRank: 0, changedDepth: 0, changedOutcome: 0 };
    group.candidates++;
    const referenceCells = targetCells.get(candidateKey(row));
    if (!referenceCells.length) group.noTarget++;
    for (const cell of referenceCells) {
      const arm = cell.arms.find(x => x.setting === row.setting);
      check(arm?.family === "provider_line", "missing/foreign frozen PV arm");
      group.namedCells++;
      const identity = { rootId: row.rootId, candidateUci: row.candidateUci, targetId: cell.targetId, ...axis };
      if (row.kind !== "available") {
        group.unavailableCells++;
        cells.push({ ...identity, status: row.kind, comparison: "not_compared_failed_source_not_absence" });
        continue;
      }
      const projection = raw.result.projections.find(x => x.targetId === cell.targetId);
      const entry = raw.result.providerPv;
      check(entry?.moveUci === row.candidateUci && projection.immediate === cell.immediate, "crossed PV entry/immediate convention");
      const before = { history: arm.history, score: arm.rawScore, rank: arm.rank, depth: arm.depth,
        outcome: frozenOutcome(cell, arm) };
      const after = { history: entry.pv.slice(0, 4), score: entry.score, rank: entry.rank, depth: entry.depth,
        outcome: outcome(projection) };
      const changed = Object.fromEntries(Object.keys(before).map(key => [key, !same(before[key], after[key])]));
      group.comparedCells++;
      for (const field of ["History", "Score", "Rank", "Depth", "Outcome"])
        group[`changed${field}`] += Number(changed[field.toLowerCase()]);
      cells.push({ ...identity, status: "compared", before, after, changed });
    }
    groups.set(groupKey, group);
  }
  return { authority: "descriptive_fresh_frozen_provider_line_sensitivity_not_engine_causality_or_profile",
    retainedCases: expected.map(x => ({ ...x, kind: byCase.get(caseIdentity(x)).row.kind })),
    rows: records.length, retainedCandidates: candidates.length, comparedHorizon: 4, pairedCases, cachePairs,
    cacheMeaning: "same_compiled_evidence_not_independent_source_repeat",
    groups: [...groups.values()], cells,
    shorterHorizon: "retained_and_cache_checked_not_compared_to_frozen_four_ply",
    sourceDifferenceAttribution: "not_established_version_configuration_timing_and_search_may_differ",
    otherSearchFamilies: "not_measured_here", productionProfileSelected: false, moveReason: "not_an_engine_reason" };
}

export function loadPvSensitivity(names) {
  check(Array.isArray(names) && names.length && new Set(names).size === names.length
    && names.every(x => /^d3262-cost-live-[a-z0-9-]+\.json\.gz$/u.test(x)), "explicit unique immutable archive names required");
  const plan = loadCostPlan(), records = [], inputs = {}, sources = {};
  for (const name of names) {
    const bytes = readFileSync(`${directory}/${name}`), pack = JSON.parse(gunzipSync(bytes));
    verifyPackedCostValue(pack);
    records.push(...pack.groups.flatMap(x => JSON.parse(gunzipSync(Buffer.from(x.base64, "base64")))));
    inputs[name] = sha(bytes); sources[name] = pack.metadata.provider;
  }
  validateCostRows(plan, records.map(x => x.row));
  const referenceName = Object.keys(sourcePins)[0], bytes = readFileSync(`${directory}/${referenceName}`);
  check(sha(bytes) === sourcePins[referenceName], "changed frozen reference");
  const value = summarizePvSensitivity(records, plan.candidates, JSON.parse(gunzipSync(bytes)));
  return { question: "D3262", inputs: { ...inputs, [referenceName]: sha(bytes) }, sources, ...value,
    validation: "checked_archive_synthesis_independent_receipt_replay_required_separately" };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), write = args[0] === "--write", options = write ? args.slice(1) : args;
  const get = name => options[options.indexOf(name) + 1];
  check(options.length === 4 && options[0] === "--archives" && options[2] === "--out"
    && options[1] && options[3], "use [--write] --archives <CSV> --out <file>");
  const value = loadPvSensitivity(get("--archives").split(",")), bytes = `${JSON.stringify(value, null, 2)}\n`;
  if (write) writeFileSync(get("--out"), bytes, { flag: "wx" });
  else check(readFileSync(get("--out"), "utf8") === bytes, "changed sensitivity; never overwrite original evidence");
  process.stdout.write(`${JSON.stringify({ rows: value.rows, cells: value.cells.length,
    pairedCases: value.pairedCases, digest: sha(bytes), productionProfileSelected: false })}\n`);
}
