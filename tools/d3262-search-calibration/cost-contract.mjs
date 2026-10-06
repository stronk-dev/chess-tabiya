// Disposable D3262 cost preregistration and receipt reader. No chess/provider
// execution, production profile selection, timing threshold or artifact rewrite.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const directory = "planning/semantic-consequence-search";
export const planName = "d3262-cost-plan-v1.json";
export const sourcePins = Object.freeze({
  "d3262-coherent-five-approach-comparison.json.gz": "sha256:c6660605e24c13b631f39f2003f1219406baadb02b03614eac9260c6a81c15bf",
});
export const regimes = Object.freeze(["cold", "warm", "provider_offline"]);
export const horizons = Object.freeze([2, 4]);
export const sha = value => `sha256:${createHash("sha256").update(value).digest("hex")}`;
const check = (v, m) => { if (!v) throw new TypeError(`D3262_COST_CONTRACT: ${m}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const finite = x => typeof x === "number" && Number.isFinite(x) && x >= 0;
const count = x => Number.isSafeInteger(x) && x >= 0;
const exactFields = (value, fields, label) => check(value !== null && typeof value === "object"
  && !Array.isArray(value) && same(Object.keys(value).sort(), [...fields].sort()), `${label} fields`);

export function buildCostPlan(comparison, sourceDigest) {
  check(comparison.profile === "d3262-coherent-five-approach-comparison-v1"
    && comparison.settings.length === 53 && comparison.candidateCoverage.length === 193
    && comparison.rows.length === 182 && comparison.contrasts.length === 116,
  "complete corrected population required");
  check(sourceDigest === sourcePins[Object.keys(sourcePins)[0]], "immutable comparison source");
  const settings = comparison.settings.map(x => ({ ...x }));
  const candidates = comparison.candidateCoverage.map(({ rootId, candidateUci, phase, focus, namedCells }) => ({
    rootId, candidateUci, phase, ...(focus === undefined ? {} : { focus }), namedCells,
  }));
  check(new Set(settings.map(x => x.id)).size === 53, "duplicate setting");
  check(new Set(candidates.map(x => JSON.stringify([x.rootId, x.candidateUci]))).size === 193,
    "duplicate candidate");
  check(new Set(candidates.map(x => x.rootId)).size === 66, "lost root");
  const families = [...new Set(settings.map(x => x.family))].sort();
  check(same(families, ["bounded_oracle_diagnostic", "configured_model", "engine_beam",
    "exact_reply_forcing", "first_reply_reserve_diagnostic", "provider_line", "recursive_semantic"]),
  "lost primary or diagnostic family");
  return {
    version: 1, question: "D3262", authority: "disposable_preregistered_cost_population_not_measurement_or_production_profile",
    comparisonDigest: sourceDigest, manifest: comparison.manifest,
    settings, candidates, horizons: [...horizons], regimes: [...regimes],
    expectedCases: settings.length * candidates.length * horizons.length * regimes.length,
    sampleUnit: "one_complete_candidate_setting_horizon_regime_execution",
    quantileUnit: "candidate_population_not_repeated_machine_trials_or_human_use",
    browserGate: "separate_actual_browser_request_dependency_resolution_and_visible_output_required",
    captures: "not_started", productionProfileSelected: false,
  };
}

export function caseIdentity({ rootId, candidateUci, setting, horizon, regime }) {
  return JSON.stringify([rootId, candidateUci, setting, horizon, regime]);
}

/** Enumerate lazily: diagnostic/no-target/offline cells never disappear. */
export function* costCases(plan) {
  for (const setting of plan.settings) for (const candidate of plan.candidates)
    for (const horizon of plan.horizons) for (const regime of plan.regimes) {
      yield { rootId: candidate.rootId, candidateUci: candidate.candidateUci,
        setting: setting.id, horizon, regime };
    }
}

/** The immutable provider operands, not a FEN-only or caller-selected cache key. */
export function queryIdentity(query) {
  check(query?.provider === "stockfish" || query?.provider === "maia", "unknown provider");
  if (query.provider === "stockfish") {
    exactFields(query, ["provider", "sourceDigest", "fen", "budget", "multiPv"], "Stockfish query");
    check(/^sha256:[a-f0-9]{64}$/u.test(query.sourceDigest) && typeof query.fen === "string"
      && query.fen.length > 0 && ["depth8", "depth12", "movetime100"].includes(query.budget)
      && Number.isSafeInteger(query.multiPv) && query.multiPv > 0, "Stockfish operands");
    return JSON.stringify([query.provider, query.sourceDigest, query.fen, query.budget, query.multiPv]);
  }
  exactFields(query, ["provider", "sourceDigest", "rootFen", "historyUci", "selfElo", "opponentElo",
    "temperature", "topP"], "Maia query");
  check(/^sha256:[a-f0-9]{64}$/u.test(query.sourceDigest) && typeof query.rootFen === "string"
    && query.rootFen.length > 0 && Array.isArray(query.historyUci)
    && query.historyUci.every(x => typeof x === "string" && /^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(x))
    && query.selfElo === 1400 && query.opponentElo === 1400
    && query.temperature === 0.8 && query.topP === 0.92, "literal configured Maia/history operands");
  return JSON.stringify([query.provider, query.sourceDigest, query.rootFen, query.historyUci,
    query.selfElo, query.opponentElo, query.temperature, query.topP]);
}

const timingFields = ["elapsedMs", "sourceMs", "collectionMs", "compileMs"];
const resultKinds = ["available", "honest_empty", "no_target", "source_unavailable", "budget_exhausted",
  "invalid_source", "absorbing_terminal"];

/**
 * Structural measurement admission only. This reader does NOT prove that a
 * clock/provider/render assertion was really observed; raw captures and an
 * independent replay must discharge that separately. No researcher-supplied
 * status boolean becomes a passing interactive budget.
 */
export function validateCostRows(plan, rows, { complete = false } = {}) {
  check(same(plan, loadCostPlan()), "changed complete preregistered plan");
  const planDigest = sha(`${JSON.stringify(plan, null, 2)}\n`);
  const candidates = new Set(plan.candidates.map(x => JSON.stringify([x.rootId, x.candidateUci])));
  const settings = new Map(plan.settings.map(x => [x.id, x]));
  const seen = new Set();
  const coldCases = new Map();
  const warmCases = [];
  for (const row of rows) {
    exactFields(row, ["rootId", "candidateUci", "setting", "horizon", "regime", "planDigest", "kind",
      "timing", "memory", "providerQueries", "initialCacheEntries", "cacheHits", "retainedBytes",
      "rawCaptureDigest", "measurementBoundary"], "cost row");
    check(row.planDigest === planDigest, "crossed plan identity");
    check(candidates.has(JSON.stringify([row.rootId, row.candidateUci])) && settings.has(row.setting)
      && plan.horizons.includes(row.horizon) && plan.regimes.includes(row.regime), "foreign case");
    const identity = caseIdentity(row);
    check(!seen.has(identity), "duplicate case"); seen.add(identity);
    check(resultKinds.includes(row.kind), "unknown result kind");
    check(row.measurementBoundary === "server_execution_only_not_browser_rendering", "false rendering boundary");
    exactFields(row.timing, timingFields, "timing");
    check(timingFields.every(f => finite(row.timing[f])), "invalid clock values");
    // Phase timings may overlap; the whole interval must still bound each phase.
    check(timingFields.slice(1).every(f => row.timing[f] <= row.timing.elapsedMs), "phase exceeds complete interval");
    exactFields(row.memory, ["peakRssBytes", "observation"], "memory");
    check(count(row.memory.peakRssBytes)
      && ["external_process_peak", "sampled_rss_lower_bound"].includes(row.memory.observation), "invalid memory scope");
    check([row.initialCacheEntries, row.cacheHits, row.retainedBytes].every(count), "invalid counts");
    check(/^sha256:[a-f0-9]{64}$/u.test(row.rawCaptureDigest), "missing immutable raw capture");
    check(Array.isArray(row.providerQueries), "missing query ledger");
    const queries = new Set();
    for (const query of row.providerQueries) {
      exactFields(query, ["operands", "state", "elapsedMs", "receiptDigest"], "query ledger");
      const key = queryIdentity(query.operands);
      check(!queries.has(key), "duplicate executed query"); queries.add(key);
      check(["executed", "cached", "unavailable", "invalid", "timed_out"].includes(query.state)
        && finite(query.elapsedMs) && query.elapsedMs <= row.timing.elapsedMs, "query result/clock");
      check(["executed", "cached"].includes(query.state)
        ? typeof query.receiptDigest === "string" && /^sha256:[a-f0-9]{64}$/u.test(query.receiptDigest)
        : query.receiptDigest === null, "unavailable source carried an admitted receipt");
    }
    const cached = row.providerQueries.filter(q => q.state === "cached").length;
    check(cached === row.cacheHits, "cache-hit ledger disagreement");
    if (row.regime !== "warm") check(row.initialCacheEntries === 0 && cached === 0, "cold/offline cache contamination");
    if (row.regime === "provider_offline") check(row.providerQueries.every(q => q.state === "unavailable"),
      "provider-offline reused or executed a provider");
    const family = settings.get(row.setting).family;
    const local = ["exact_reply_forcing", "bounded_oracle_diagnostic"].includes(family);
    if (!local) {
      check(row.providerQueries.every(q => q.operands.provider === (family === "configured_model" ? "maia" : "stockfish")),
        "wrong provider family");
      if (family !== "configured_model") {
        const budget = settings.get(row.setting).budget ?? row.setting.split(":")[1];
        check(row.providerQueries.every(q => q.operands.budget === budget), "crossed setting search budget");
      }
    }
    if (!local && ["available", "honest_empty"].includes(row.kind)) {
      check(row.providerQueries.length > 0, "vacuous available provider arm");
      if (row.regime === "warm") check(row.initialCacheEntries >= cached && cached > 0,
        "warm provider result without warm dependencies");
    }
    if (local)
      check(row.providerQueries.length === 0, "source-free arm queried a provider");
    if (row.kind === "source_unavailable") check(row.providerQueries.some(q => q.state === "unavailable"),
      "source absence without attempted dependency");
    if (["available", "honest_empty"].includes(row.kind)) check(row.providerQueries.every(q => ["executed", "cached"].includes(q.state)),
      "missing mandatory source advertised available");
    const pairedIdentity = JSON.stringify([row.rootId, row.candidateUci, row.setting, row.horizon]);
    if (row.regime === "cold") coldCases.set(pairedIdentity, new Map(row.providerQueries
      .filter(q => q.state === "executed").map(q => [queryIdentity(q.operands), q.receiptDigest])));
    if (row.regime === "warm") warmCases.push({ pairedIdentity, row });
  }
  let pairedWarmCases = 0;
  for (const { pairedIdentity, row } of warmCases) {
    const cold = coldCases.get(pairedIdentity);
    if (complete) check(cold !== undefined, "warm case without corresponding cold execution");
    if (cold === undefined) continue;
    pairedWarmCases++;
    for (const query of row.providerQueries.filter(q => q.state === "cached"))
      check(cold.get(queryIdentity(query.operands)) === query.receiptDigest,
        "warm receipt was not executed by this exact cold case");
  }
  if (complete) check(seen.size === plan.expectedCases && seen.size === [...costCases(plan)].length,
    "incomplete population cannot be a complete cost report");
  return { admittedRows: rows.length, expectedCases: plan.expectedCases,
    complete: seen.size === plan.expectedCases, pairedWarmCases, evidence: "structural_admission_only",
    interactiveGate: "not_measured_by_server_rows", productionProfileSelected: false };
}

export function loadCostPlan() {
  const name = Object.keys(sourcePins)[0];
  const bytes = readFileSync(`${directory}/${name}`);
  check(sha(bytes) === sourcePins[name], "changed frozen comparison bytes; never restamp the pin");
  return buildCostPlan(JSON.parse(gunzipSync(bytes)), sha(bytes));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const plan = loadCostPlan(), bytes = `${JSON.stringify(plan, null, 2)}\n`;
  if (process.argv.includes("--write")) writeFileSync(`${directory}/${planName}`, bytes, { flag: "wx" });
  else check(readFileSync(`${directory}/${planName}`, "utf8") === bytes, "frozen plan differs; do not rewrite");
  process.stdout.write(`${JSON.stringify({ planDigest: sha(bytes), candidates: plan.candidates.length,
    settings: plan.settings.length, expectedCases: plan.expectedCases, captures: plan.captures,
    productionProfileSelected: false })}\n`);
}
