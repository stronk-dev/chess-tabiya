// Read-only quantitative synthesis by declared setting/horizon/regime/phase/focus/result.
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCostPlan, sha, validateCostRows } from "./cost-contract.mjs";
import { verifyPackedCostValue } from "./cost-pack.mjs";

const defaultNames = ["d3262-cost-live-pv-initial-2026-10-06.json.gz", "d3262-cost-live-pv-depth8-population-2026-10-06.json.gz"];
const directory = "planning/semantic-consequence-search";
export function summarizeCostArchives(names = defaultNames) {
  if (!Array.isArray(names) || !names.length || names.some(name => typeof name !== "string"
    || !/^d3262-cost-live-[a-z0-9-]+\.json\.gz$/u.test(name)) || new Set(names).size !== names.length)
    throw new Error("Explicit unique immutable capture names required");
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
  return { question: "D3262", authority: "partial_candidate_population_cost_not_browser_or_profile_decision",
    inputs, ...admission, retainedCandidates: new Set(rows.map(x => JSON.stringify([x.rootId, x.candidateUci]))).size,
    rows: [...groups.values()].map(({ axis, rows }) => ({ ...axis, count: rows.length,
      elapsedMs: quantiles(rows.map(x => x.timing.elapsedMs)), sourceMs: quantiles(rows.map(x => x.timing.sourceMs)),
      collectionMs: quantiles(rows.map(x => x.timing.collectionMs)), compileMs: quantiles(rows.map(x => x.timing.compileMs)),
      retainedBytes: quantiles(rows.map(x => x.retainedBytes)), sampledParentRssBytes: quantiles(rows.map(x => x.memory.peakRssBytes)),
      queryCount: rows.reduce((n, x) => n + x.providerQueries.length, 0), cacheHits: rows.reduce((n, x) => n + x.cacheHits, 0) })),
    repeatUnit: "one_case_execution_not_machine_repeat_trials", startupIncluded: false,
    memoryScope: "sampled_parent_lower_bound_not_engine_or_model_peak", interactiveGate: "not_measured", productionProfileSelected: false };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--write") continue;
    if (!["--archives", "--out"].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith("--"))
      throw new Error("Unknown/missing summary argument");
    i++;
  }
  const argument = name => args[args.indexOf(name) + 1];
  if (args.includes("--archives") !== args.includes("--out")) throw new Error("Custom summary requires both --archives and --out");
  const value = summarizeCostArchives(args.includes("--archives") ? argument("--archives").split(",") : defaultNames);
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  const out = args.includes("--out") ? argument("--out") : `${directory}/d3262-cost-live-pv-depth8-summary-2026-10-06.json`;
  if (process.argv.includes("--write")) writeFileSync(out, bytes, { flag: "wx" });
  else if (readFileSync(out, "utf8") !== bytes) throw new Error("Changed quantitative synthesis; never overwrite original cost receipts");
  process.stdout.write(`${JSON.stringify({ rows: value.admittedRows, groups: value.rows.length, retainedCandidates: value.retainedCandidates,
    expectedCases: value.expectedCases, complete: value.complete, summaryDigest: sha(bytes) })}\n`);
}
