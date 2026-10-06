import { test } from "node:test";
import assert from "node:assert/strict";
import { costCases, loadCostPlan, queryIdentity, sha, validateCostRows } from "./cost-contract.mjs";

const plan = loadCostPlan();
const digest = sha(`${JSON.stringify(plan, null, 2)}\n`);
const rawDigest = `sha256:${"a".repeat(64)}`;
const engine = { provider: "stockfish", sourceDigest: rawDigest, fen: "actual query FEN",
  budget: "depth12", multiPv: 8 };
const model = { provider: "maia", sourceDigest: rawDigest, rootFen: "actual root FEN",
  historyUci: ["e2e4"], selfElo: 1400, opponentElo: 1400, temperature: 0.8, topP: 0.92 };
function row(setting = "pv:depth12", regime = "cold") {
  return { rootId: plan.candidates[0].rootId, candidateUci: plan.candidates[0].candidateUci,
    setting, horizon: 4, regime, planDigest: digest, kind: "available",
    timing: { elapsedMs: 12, sourceMs: 8, collectionMs: 2, compileMs: 1 },
    memory: { peakRssBytes: 1234, observation: "sampled_rss_lower_bound" },
    providerQueries: [{ operands: engine, state: "executed", elapsedMs: 8, receiptDigest: rawDigest }],
    initialCacheEntries: 0, cacheHits: 0, retainedBytes: 100, rawCaptureDigest: rawDigest,
    measurementBoundary: "server_execution_only_not_browser_rendering" };
}

test("all existing settings/candidates/horizons/regimes stay in the cost population", () => {
  const cases = [...costCases(plan)];
  assert.equal(cases.length, 61_374);
  assert.equal(new Set(cases.map(x => JSON.stringify(x))).size, cases.length);
  assert.equal(plan.candidates.filter(x => x.namedCells === 0).length > 0, true);
  assert.equal(new Set(plan.candidates.map(x => x.rootId)).size, 66);
  assert.equal(plan.captures, "not_started");
  assert.equal(plan.productionProfileSelected, false);
});

test("server measurements never claim the browser envelope or physical paint", () => {
  const result = validateCostRows(plan, [row()]);
  assert.equal(result.admittedRows, 1);
  assert.equal(result.complete, false);
  assert.equal(result.interactiveGate, "not_measured_by_server_rows");
  assert.equal(result.evidence, "structural_admission_only");
});

test("positive cold, warm, offline and source-free results have distinct ledgers", () => {
  const cold = row();
  const warm = row("pv:depth12", "warm");
  warm.initialCacheEntries = warm.cacheHits = 1;
  warm.providerQueries[0].state = "cached";
  const offline = row("pv:depth12", "provider_offline");
  offline.kind = "source_unavailable";
  offline.providerQueries[0].state = "unavailable";
  offline.providerQueries[0].receiptDigest = null;
  const exact = row("forcing:square_control", "provider_offline");
  exact.providerQueries = [];
  const maia = row("maia:prefix0.90");
  maia.providerQueries[0].operands = model;
  assert.equal(validateCostRows(plan, [cold, warm, offline, exact, maia]).admittedRows, 5);
});

test("exact engine budgets/MultiPV and ordered Maia history/model define cache identity", () => {
  assert.notEqual(queryIdentity(engine), queryIdentity({ ...engine, budget: "depth8" }));
  assert.notEqual(queryIdentity(engine), queryIdentity({ ...engine, multiPv: 2 }));
  assert.notEqual(queryIdentity(engine), queryIdentity({ ...engine, sourceDigest: digest }));
  assert.notEqual(queryIdentity(model), queryIdentity({ ...model, historyUci: ["d2d4"] }));
  assert.notEqual(queryIdentity(model), queryIdentity({ ...model, rootFen: "another root" }));
  assert.notEqual(queryIdentity(model), queryIdentity({ ...model, historyUci: ["e2e4", "e7e5"] }));
  assert.throws(() => queryIdentity({ ...model, temperature: 1 }), /configured Maia/u);
  assert.throws(() => queryIdentity({ ...model, historyUci: ["not a move"] }), /configured Maia/u);
  assert.throws(() => queryIdentity({ ...model, fen: "FEN-only cache shortcut" }), /fields/u);
});

test("warm dependency receipts must join this exact cold case, not another query or source value", () => {
  const cold = row(), warm = row("pv:depth12", "warm");
  warm.initialCacheEntries = warm.cacheHits = 1;
  warm.providerQueries[0].state = "cached";
  assert.equal(validateCostRows(plan, [warm, cold]).pairedWarmCases, 1);
  warm.providerQueries[0].receiptDigest = digest;
  assert.throws(() => validateCostRows(plan, [cold, warm]), /exact cold case/u);
  warm.providerQueries[0].receiptDigest = rawDigest;
  warm.providerQueries[0].operands = { ...engine, fen: "another query position" };
  assert.throws(() => validateCostRows(plan, [cold, warm]), /exact cold case/u);
});

const negatives = {
  "foreign candidate": r => { r.candidateUci = "foreign"; },
  "foreign root": r => { r.rootId = "foreign"; },
  "unregistered setting": r => { r.setting = "top1-fastest"; },
  "foreign horizon": r => { r.horizon = 3; },
  "invented regime": r => { r.regime = "kind_of_warm"; },
  "crossed plan": r => { r.planDigest = rawDigest; },
  "missing raw measurement": r => { r.rawCaptureDigest = null; },
  "unsupported status": r => { r.kind = "safe"; },
  "provider-off reused evidence": r => { r.regime = "provider_offline"; },
  "cold cache contamination": r => { r.initialCacheEntries = 1; },
  "missing clock": r => { delete r.timing.collectionMs; },
  "negative clock": r => { r.timing.elapsedMs = -1; },
  "nonfinite clock": r => { r.timing.sourceMs = Infinity; },
  "phase outside operation": r => { r.timing.sourceMs = 13; },
  "missing memory observation": r => { delete r.memory.observation; },
  "sampled RSS called peak": r => { r.memory.observation = "true_peak"; },
  "browser boundary invented": r => { r.measurementBoundary = "physically_painted"; },
  "researcher-supplied pass": r => { r.interactiveBudgetPassed = true; },
  "vacuous available": r => { r.providerQueries = []; },
  "failed provider called available": r => { r.providerQueries[0].state = "unavailable"; r.providerQueries[0].receiptDigest = null; },
  "failed provider called honest empty": r => { r.kind = "honest_empty"; r.providerQueries[0].state = "unavailable"; r.providerQueries[0].receiptDigest = null; },
  "wrong provider": r => { r.providerQueries[0].operands = model; },
  "different search budget": r => { r.providerQueries[0].operands = { ...engine, budget: "depth8" }; },
  "duplicate query": r => { r.providerQueries.push(structuredClone(r.providerQueries[0])); },
  "source-off with receipt": r => { r.kind = "source_unavailable"; r.providerQueries[0].state = "unavailable"; },
  "source absence without dependency": r => { r.kind = "source_unavailable"; r.providerQueries = []; },
  "source-free arm depends on engine": r => { r.setting = "forcing:enemy_piece"; },
  "warm without cache": r => { r.regime = "warm"; },
  "cache count mismatch": r => { r.cacheHits = 1; },
};
for (const [name, mutate] of Object.entries(negatives)) test(`refuses ${name}`, () => {
  const value = row(); mutate(value);
  assert.throws(() => validateCostRows(plan, [value]), /D3262_COST_CONTRACT/u);
});
test("duplicate, partial and filtered populations cannot become a complete cost report", () => {
  assert.throws(() => validateCostRows(plan, [row(), row()]), /duplicate case/u);
  assert.throws(() => validateCostRows(plan, [row()], { complete: true }), /incomplete population/u);
  assert.throws(() => validateCostRows({ ...plan, settings: plan.settings.slice(0, 5) }, []), /changed complete/u);
  assert.throws(() => validateCostRows({ ...plan, candidates: plan.candidates.slice(0, 10) }, []), /changed complete/u);
});

test("a complete synthetic control admits all 61,374 cells without pretending they were measured", () => {
  const rows = [...costCases(plan)].map(identity => {
    const value = { ...row(identity.setting, identity.regime), ...identity };
    const family = plan.settings.find(x => x.id === identity.setting).family;
    if (["exact_reply_forcing", "bounded_oracle_diagnostic"].includes(family)) value.providerQueries = [];
    else {
      if (family === "configured_model") value.providerQueries[0].operands = model;
      else value.providerQueries[0].operands = { ...engine,
        budget: plan.settings.find(x => x.id === identity.setting).budget ?? identity.setting.split(":")[1] };
      if (identity.regime === "provider_offline") {
        value.kind = "source_unavailable";
        value.providerQueries[0].state = "unavailable";
        value.providerQueries[0].receiptDigest = null;
      } else if (identity.regime === "warm") {
        value.initialCacheEntries = value.cacheHits = 1;
        value.providerQueries[0].state = "cached";
      }
    }
    return value;
  });
  const result = validateCostRows(plan, rows, { complete: true });
  assert.equal(result.complete, true);
  assert.equal(result.admittedRows, 61_374);
  assert.equal(result.evidence, "structural_admission_only");
  assert.equal(result.interactiveGate, "not_measured_by_server_rows");
  assert.equal(result.productionProfileSelected, false);
});
