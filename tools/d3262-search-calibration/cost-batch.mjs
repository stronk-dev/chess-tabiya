// Disposable immutable partial batches; the complete 61,374-cell plan never shrinks.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import os from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { caseIdentity, costCases, loadCostPlan, sha, validateCostRows } from "./cost-contract.mjs";
import { CostStockfish, parseProbe } from "./cost-stockfish.mjs";
import { createCostMaia, parseMaiaReceipt } from "./cost-maia.mjs";
import { executeCostCase, executionSubject, inputPins, loadExecutionInputs, supportedFamilies } from "./cost-execution.mjs";

const instrumentNames = ["cost-batch.mjs", "cost-execution.mjs", "cost-stockfish.mjs", "cost-contract.mjs",
  "exact-reply-enumeration.mjs", "stockfish-coherent-table.mjs", "exact-arm-trigger-core.mjs", "coherent-actual-proof.mjs",
  "dist/target-opportunity-v2.mjs", "cost-semantic.mjs", "coherent-recursive-semantic.mjs",
  "dist/semantic-relation-event-first-layer.mjs", "dist/recursive-relation-events.mjs", "cost-model.mjs",
  "coherent-horizon-policy.mjs", "cost-maia.mjs", "cost-maia-worker.py", "maia_capture_runtime.py"];
const check = (v, m) => { if (!v) throw new Error(m); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const frozenBytes = value => `${JSON.stringify(value, null, 2)}\n`;
export function selectBatchCases(plan, start, limit) {
  check(Number.isSafeInteger(start) && Number.isSafeInteger(limit) && start >= 0 && limit > 0
    && start % 3 === 0 && limit % 3 === 0 && start + limit <= plan.expectedCases,
  "Batch must retain complete cold/warm/offline triplets");
  const cases = [...costCases(plan)].slice(start, start + limit);
  const settings = new Map(plan.settings.map(x => [x.id, x]));
  check(cases.every(x => supportedFamilies.includes(settings.get(x.setting).family)),
    "Unimplemented traversal remains in full plan; cannot capture this batch yet");
  const families = cases.map(x => settings.get(x.setting).family);
  check(!(families.includes("configured_model") && families.some(x =>
    ["provider_line", "engine_beam", "first_reply_reserve_diagnostic", "recursive_semantic"].includes(x))),
  "Single-source batch requires separate Maia and Stockfish ranges; never cross source metadata");
  return cases;
}

/** Raw receipt validation, NOT independent clock observation or alternate chess implementation. */
export function checkRawCapture(record) {
  const { row, raw } = record;
  check(row.rawCaptureDigest === sha(JSON.stringify(raw)), "Changed raw capture bytes");
  check(same(raw.cell, Object.fromEntries(["rootId", "candidateUci", "setting", "horizon", "regime"].map(k => [k, row[k]]))), "Crossed raw case");
  check(row.kind === raw.result.kind && raw.result.horizon === row.horizon, "Crossed result");
  check(raw.clock.ended >= raw.clock.started && row.timing.elapsedMs === raw.clock.ended - raw.clock.started,
    "Crossed whole-operation monotonic interval");
  check(row.retainedBytes === Buffer.byteLength(JSON.stringify(raw)), "Crossed retained byte count");
  if (row.setting.startsWith("maia:")) {
    check(record.rawLiteral === JSON.stringify(raw) && record.receiptLiterals?.length === raw.dependencies.length,
      "Missing original model hash inputs; do not restamp float formatting");
    check(raw.dependencies.every((x, i) => record.receiptLiterals[i] === (x.receipt ? JSON.stringify(x.receipt) : null)),
      "Changed literal model receipt serialization");
  }
  check(raw.dependencies.length === row.providerQueries.length, "Missing literal dependency capture");
  for (const [index, source] of raw.dependencies.entries()) {
    const ledger = row.providerQueries[index];
    check(same(source.operands, ledger.operands) && source.state === ledger.state, "Crossed raw query");
    if (source.receipt) {
      check(sha(JSON.stringify(source.receipt)) === ledger.receiptDigest && same(source.receipt.operands, ledger.operands), "Changed admitted provider bytes");
      const parse = source.operands.provider === "maia" ? parseMaiaReceipt : parseProbe;
      check(same(parse(source.operands, source.receipt.lines), source.receipt.result), "Provider result differs from literal source replay");
      check(source.receipt.ended >= source.receipt.started, "Invalid provider clock interval");
      if (source.state === "executed") check(source.receipt.started >= raw.clock.started && source.receipt.ended <= raw.clock.ended,
        "Provider execution outside measured operation");
    } else check(ledger.receiptDigest === null, "Unobserved provider carried admitted evidence");
  }
  return true;
}

export async function captureBatch({ out, start, limit, command = process.env.SF_CMD }) {
  const plan = loadCostPlan(), cases = selectBatchCases(plan, start, limit), inputs = loadExecutionInputs();
  check(typeof out === "string" && out.length > 0, "Explicit immutable output directory required");
  // Refuse overwrite before running any costly source operation.
  mkdirSync(out);
  const needsEngine = cases.some(cell => ["provider_line", "engine_beam", "first_reply_reserve_diagnostic", "recursive_semantic"].includes(plan.settings.find(x => x.id === cell.setting).family));
  const needsModel = cases.some(cell => plan.settings.find(x => x.id === cell.setting).family === "configured_model");
  const adapter = needsEngine ? new CostStockfish(command) : needsModel ? createCostMaia() : {
    sourceDigest: sha("D3262 source-free execution: no provider requested"), engineName: null, startupMs: 0,
    async initialize() {}, async close() {}, async execute() { throw new Error("Source-free arm attempted a provider query"); },
  };
  const rows = [], groups = [];
  try {
    await adapter.initialize();
    const metadata = { question: "D3262", authority: "disposable_partial_live_server_cost_not_profile_or_browser_proof",
      createdAt: new Date().toISOString(), planDigest: sha(frozenBytes(plan)), start, limit, expectedCases: plan.expectedCases,
      cases, inputs: inputPins, instrumentDigests: Object.fromEntries(instrumentNames.map(name =>
        [name, sha(readFileSync(new URL(name, import.meta.url)))])),
      machine: { platform: os.platform(), release: os.release(), arch: os.arch(), node: process.version,
        cpu: os.cpus()[0]?.model ?? "unknown", logicalCpus: os.cpus().length, memoryBytes: os.totalmem() },
      provider: { requested: needsEngine || needsModel, name: needsModel ? "Maia3-5m" : adapter.engineName,
        sourceDigest: adapter.sourceDigest, startupMs: adapter.startupMs,
        threads: needsEngine || needsModel ? 1 : 0, hashMb: needsEngine ? 16 : 0, clearHashPerQuery: needsEngine, timeoutMs: adapter.timeoutMs ?? 0,
        ...(needsModel ? { imageId: adapter.imageId, ready: adapter.ready, readyLiteral: adapter.readyLiteral } : {}) },
      concurrency: 1, memoryScope: "parent_process_sampled_rss_lower_bound_not_engine_or_model_peak",
      unsupportedFamilies: plan.settings.map(x => x.family).filter((x, i, all) => !supportedFamilies.includes(x) && all.indexOf(x) === i),
      interactiveGate: "not_measured", productionProfileSelected: false };
    writeFileSync(`${out}/metadata.json`, frozenBytes(metadata), { flag: "wx" });
    const settings = new Map(plan.settings.map(x => [x.id, x]));
    for (let index = 0; index < cases.length; index += 3) {
      const captured = []; let coldCache = new Map();
      for (const cell of cases.slice(index, index + 3)) {
        const value = await executeCostCase({ cell, setting: settings.get(cell.setting), subject: executionSubject(inputs, cell),
          planDigest: metadata.planDigest, adapter, initialCache: cell.regime === "warm" ? coldCache : new Map() });
        if (cell.regime === "cold") coldCache = value.cache;
        checkRawCapture(value); captured.push({ row: value.row, raw: value.raw,
          ...(value.rawLiteral !== undefined ? { rawLiteral: value.rawLiteral, receiptLiterals: value.receiptLiterals } : {}) });
      }
      const name = `triplet-${String(start + index).padStart(6, "0")}.json.gz`, bytes = gzipSync(frozenBytes(captured));
      writeFileSync(`${out}/${name}`, bytes, { flag: "wx" });
      groups.push({ name, digest: sha(bytes) }); rows.push(...captured.map(x => x.row));
      process.stdout.write(`${JSON.stringify({ captured: rows.length, requested: limit, fullPopulation: plan.expectedCases,
        last: caseIdentity(cases[index]), coldMs: captured[0].row.timing.elapsedMs, warmMs: captured[1].row.timing.elapsedMs })}\n`);
    }
    const admission = validateCostRows(plan, rows);
    const summary = { groups, ...admission, requestedBatchComplete: rows.length === limit,
      rawReplay: "same_implementation_receipt_check_not_independent_validation" };
    writeFileSync(`${out}/summary.json`, frozenBytes(summary), { flag: "wx" });
    return summary;
  } finally { await adapter.close(); }
}

export function checkBatch(out) {
  const plan = loadCostPlan(), metadata = JSON.parse(readFileSync(`${out}/metadata.json`));
  check(metadata.planDigest === sha(frozenBytes(plan)) && same(metadata.inputs, inputPins), "Crossed batch inputs/plan");
  const expected = selectBatchCases(plan, metadata.start, metadata.limit);
  check(same(expected, metadata.cases), "Filtered batch declarations");
  const records = [], groups = [];
  for (const name of readdirSync(out).filter(x => /^triplet-\d{6}\.json\.gz$/u.test(x)).sort()) {
    const bytes = readFileSync(`${out}/${name}`), group = JSON.parse(gunzipSync(bytes));
    check(group.length === 3, "Lost case in immutable triplet");
    group.forEach(checkRawCapture); groups.push({ name, digest: sha(bytes) }); records.push(...group);
  }
  check(same(records.map(x => x.raw.cell), expected.slice(0, records.length)), "Changed captured case order/population");
  const admission = validateCostRows(plan, records.map(x => x.row));
  const summary = JSON.parse(readFileSync(`${out}/summary.json`));
  check(same(summary, { groups, ...admission, requestedBatchComplete: records.length === metadata.limit,
    rawReplay: "same_implementation_receipt_check_not_independent_validation" }), "Changed batch summary");
  return summary;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), allowed = ["--check", "--out", "--start", "--limit"];
  for (let i = 0; i < args.length; i++) {
    check(allowed.includes(args[i]), `Unknown argument: ${args[i]}`);
    if (args[i] !== "--check") { check(args[i + 1] && !args[i + 1].startsWith("--"), "Missing argument value"); i++; }
  }
  const value = name => args[args.indexOf(name) + 1];
  check(args.includes("--out"), "Explicit --out required");
  const result = args.includes("--check") ? checkBatch(value("--out"))
    : await captureBatch({ out: value("--out"), start: Number(value("--start")), limit: Number(value("--limit")) });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
