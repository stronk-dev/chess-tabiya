// Read-only quantitative synthesis by declared setting/horizon/regime/phase/focus/result.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { loadCostPlan, sha, validateCostRows } from "./cost-contract.mjs";
import { verifyPackedCostValue } from "./cost-pack.mjs";

const names = ["d3262-cost-live-pv-initial-2026-10-06.json.gz", "d3262-cost-live-pv-depth8-population-2026-10-06.json.gz"];
const directory = "planning/semantic-consequence-search";
const plan = loadCostPlan(), rows = [], inputs = {};
for (const name of names) {
  const bytes = readFileSync(`${directory}/${name}`), pack = JSON.parse(gunzipSync(bytes));
  verifyPackedCostValue(pack); inputs[name] = sha(bytes);
  rows.push(...pack.groups.flatMap(x => JSON.parse(gunzipSync(Buffer.from(x.base64, "base64"))).map(x => x.row)));
}
const admission = validateCostRows(plan, rows), groups = new Map();
const quantiles = values => {
  const sorted = [...values].sort((a, b) => a - b);
  return { p50: sorted[Math.ceil(sorted.length * 0.5) - 1], p95: sorted[Math.ceil(sorted.length * 0.95) - 1], max: sorted.at(-1) };
};
for (const row of rows) {
  const candidate = plan.candidates.find(x => x.rootId === row.rootId && x.candidateUci === row.candidateUci);
  const axis = { setting: row.setting, horizon: row.horizon, regime: row.regime,
    phase: candidate.phase, focus: candidate.focus ?? null, result: row.kind };
  const key = JSON.stringify(axis), group = groups.get(key) ?? { axis, rows: [] };
  group.rows.push(row); groups.set(key, group);
}
const value = { question: "D3262", authority: "partial_candidate_population_cost_not_browser_or_profile_decision",
  inputs, ...admission, retainedCandidates: new Set(rows.map(x => JSON.stringify([x.rootId, x.candidateUci]))).size,
  rows: [...groups.values()].map(({ axis, rows }) => ({ ...axis, count: rows.length,
    elapsedMs: quantiles(rows.map(x => x.timing.elapsedMs)), sourceMs: quantiles(rows.map(x => x.timing.sourceMs)),
    collectionMs: quantiles(rows.map(x => x.timing.collectionMs)), compileMs: quantiles(rows.map(x => x.timing.compileMs)),
    retainedBytes: quantiles(rows.map(x => x.retainedBytes)), sampledParentRssBytes: quantiles(rows.map(x => x.memory.peakRssBytes)),
    queryCount: rows.reduce((n, x) => n + x.providerQueries.length, 0), cacheHits: rows.reduce((n, x) => n + x.cacheHits, 0) })),
  repeatUnit: "one_case_execution_not_machine_repeat_trials", startupIncluded: false,
  memoryScope: "sampled_parent_lower_bound_not_engine_or_model_peak", interactiveGate: "not_measured", productionProfileSelected: false };
const bytes = `${JSON.stringify(value, null, 2)}\n`, out = `${directory}/d3262-cost-live-pv-depth8-summary-2026-10-06.json`;
if (process.argv.includes("--write")) writeFileSync(out, bytes, { flag: "wx" });
else if (readFileSync(out, "utf8") !== bytes) throw new Error("Changed quantitative synthesis; never overwrite original cost receipts");
process.stdout.write(`${JSON.stringify({ rows: rows.length, groups: groups.size, retainedCandidates: value.retainedCandidates,
  expectedCases: plan.expectedCases, complete: false, summaryDigest: sha(bytes) })}\n`);
