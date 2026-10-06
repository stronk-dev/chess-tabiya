import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CostDependencies, CostStockfish, SourceFailure, fenOf, parseProbe, position, replay, terminal } from "./cost-stockfish.mjs";
import { executeCostCase, executionSubject, loadExecutionInputs } from "./cost-execution.mjs";
import { captureBatch, checkBatch, checkRawCapture, selectBatchCases } from "./cost-batch.mjs";
import { loadCostPlan, queryIdentity, sha } from "./cost-contract.mjs";
import { legalMoves } from "./exact-reply-enumeration.mjs";

const fen = "4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1";
const sourceDigest = sha("synthetic control source, never live evidence");
const operand = (value = fen) => ({ provider: "stockfish", sourceDigest, fen: value, budget: "depth8", multiPv: 8 });
function literal(operands, pvLength = 1) {
  return [...legalMoves(position(operands.fen)).slice(0, operands.multiPv).map((entry, index) => {
    const path = [entry.uci]; let pos = replay(operands.fen, path);
    for (let i = 1; i < pvLength; i++) {
      if (terminal(pos) !== null) break;
      const next = legalMoves(pos)[0]; if (!next) break;
      path.push(next.uci); pos.play(next.move);
    }
    return `info depth ${operands.budget.startsWith("depth") ? operands.budget.slice(5) : 8} multipv ${index + 1} score cp ${20 - index} pv ${path.join(" ")}`;
  }), `bestmove ${legalMoves(position(operands.fen))[0].uci}`];
}
function syntheticAdapter({ failure, pvLength = 4 } = {}) {
  let calls = 0;
  return { sourceDigest, get calls() { return calls; }, async execute(operands) {
    calls++;
    if (failure) throw new SourceFailure(failure, `synthetic ${failure}`);
    const started = performance.now(), lines = literal(operands, pvLength), result = parseProbe(operands, lines);
    return { operands, lines, result, started, ended: performance.now(), engineName: "synthetic_control" };
  } };
}
const piece = (color, role, square) => ({ color, role, square });
const subject = { rootFen: fen, definitions: [{ id: "ep-target", family: "material",
  target: { attacker: piece("black", "pawn", "d4"), target: piece("white", "pawn", "e2") } }] };
const cell = { rootId: "synthetic", candidateUci: "e2e4", setting: "pv:depth8", horizon: 4, regime: "cold" };
const planDigest = sha("synthetic plan");
const setting = { id: cell.setting, family: "provider_line", budget: "depth8" };
const run = overrides => executeCostCase({ cell, setting, subject, planDigest, adapter: syntheticAdapter(), ...overrides });

test("literal coherent table retains legal population, raw PV and score perspective", () => {
  const q = operand(), p = parseProbe(q, literal(q));
  assert.equal(p.entries.length, Math.min(8, legalMoves(position(fen)).length));
  assert.equal(p.scorePerspective, "side_to_move"); assert.equal(p.coherentDepth, 8);
  assert.ok(p.entries.every(x => x.rawPv[0] === x.moveUci));
});
for (const [name, mutate] of [
  ["missing bestmove", lines => lines.slice(0, -1)],
  ["invalid bestmove", lines => [...lines.slice(0, -1), "bestmove a1a8"]],
  ["incomplete rank table", lines => lines.slice(1)],
  ["mixed depths", lines => lines.map((x, i) => i === 0 ? x.replace("depth 8", "depth 7") : x)],
  ["bound-only scores", lines => lines.map(x => x.replace("score cp 20", "score cp 20 lowerbound"))],
  ["illegal PV", lines => lines.map((x, i) => i === 0 ? x + " a1a8" : x)],
  ["short requested depth", lines => lines.map(x => x.replace("depth 8", "depth 7"))],
  ["multiple delimiters", lines => [...lines.slice(0, -1), lines.at(-1), lines.at(-1)]],
]) test(`refuses ${name}`, () => assert.throws(() => parseProbe(operand(), mutate(literal(operand())))));
test("standard king-destination castling and four promotions are legal provider operands", () => {
  for (const value of ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "4k3/P7/8/8/8/8/8/4K3 w - - 0 1"]) {
    const q = { ...operand(value), multiPv: legalMoves(position(value)).length };
    const parsed = parseProbe(q, literal(q));
    const expected = legalMoves(position(value)).map(x => x.uci);
    assert.deepEqual(parsed.entries.map(x => x.moveUci), expected);
    assert.ok(expected.includes(value.startsWith("r") ? "e1g1" : "a7a8n"));
  }
});
test("absorbing draw and noncanonical castling cannot extend history", () => {
  assert.throws(() => replay("4k3/8/8/8/8/8/8/4K3 w - - 0 1", ["e1e2"]), /terminal/);
  assert.throws(() => replay("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", ["e1h1"]), /noncanonical/);
});
test("cold receipt becomes same-operand warm dependency, never a cached final answer", async () => {
  const adapter = syntheticAdapter(), cold = new CostDependencies(adapter, "cold"), q = operand();
  await cold.query(q); await cold.query(q); assert.equal(adapter.calls, 1); assert.equal(cold.ledger.length, 1);
  const warm = new CostDependencies(adapter, "warm", cold.cache); await warm.query(q);
  assert.equal(adapter.calls, 1); assert.equal(warm.ledger[0].state, "cached");
  assert.equal(warm.ledger[0].receiptDigest, cold.ledger[0].receiptDigest);
});
test("offline refuses execution and cannot borrow a cache", async () => {
  const adapter = syntheticAdapter(), offline = new CostDependencies(adapter, "provider_offline");
  const result = await offline.query(operand());
  assert.equal(adapter.calls, 0); assert.equal(result.state, "unavailable"); assert.equal(result.result, null);
  for (const regime of ["cold", "provider_offline"]) assert.throws(() => new CostDependencies(adapter, regime, new Map([["x", {}]])), /contamination/);
});
test("changed budget, FEN, source or MultiPV never reuses cold dependencies", async () => {
  const cold = new CostDependencies(syntheticAdapter(), "cold"); await cold.query(operand());
  for (const changed of [{ budget: "depth12" }, { multiPv: 2 }, { fen: fenOf(replay(fen, ["e2e3"])) }, { sourceDigest: sha("other") }]) {
    const adapter = syntheticAdapter(), warm = new CostDependencies(adapter, "warm", cold.cache);
    await warm.query({ ...operand(), ...changed }); assert.equal(adapter.calls, 1); assert.equal(warm.ledger[0].state, "executed");
  }
});
test("forged cached result is rejected from literal UCI rather than admitted", async () => {
  const cold = new CostDependencies(syntheticAdapter(), "cold"), q = operand(); await cold.query(q);
  const fake = structuredClone(cold.cache.get(queryIdentity(q))); fake.result.entries[0].pv = ["a1a8"];
  const warm = new CostDependencies(syntheticAdapter(), "warm", new Map([[queryIdentity(q), fake]]));
  assert.equal((await warm.query(q)).state, "invalid"); assert.equal(warm.ledger[0].receiptDigest, null);
});
test("complete operation includes legal collection, source execution and grounded compilation", async () => {
  const value = await run(); assert.equal(value.row.kind, "available"); assert.equal(checkRawCapture(value), true);
  assert.ok(value.row.timing.elapsedMs >= value.row.timing.sourceMs);
  assert.ok(value.row.timing.collectionMs > 0); assert.ok(value.row.timing.compileMs > 0);
  assert.equal(value.raw.result.projections[0].authority, "local_target_convention_not_engine_reason");
  assert.equal(value.raw.result.productionProfileSelected, false);
});
test("warm operation recompiles identical observations with exact cold receipts", async () => {
  const adapter = syntheticAdapter(), cold = await run({ adapter });
  const warm = await run({ adapter, cell: { ...cell, regime: "warm" }, initialCache: cold.cache });
  assert.equal(adapter.calls, 1); assert.equal(warm.row.cacheHits, 1);
  assert.deepEqual(warm.raw.result.observations, cold.raw.result.observations);
  assert.equal(warm.row.providerQueries[0].receiptDigest, cold.row.providerQueries[0].receiptDigest);
});
for (const [failure, kind] of [["unavailable", "source_unavailable"], ["invalid", "invalid_source"], ["timed_out", "budget_exhausted"]])
  test(`${failure} remains a failed dependency, not evidence-empty success`, async () => {
    const value = await run({ adapter: syntheticAdapter({ failure }) });
    assert.equal(value.row.kind, kind); assert.equal(value.row.providerQueries[0].receiptDigest, null);
    assert.equal(value.raw.result.providerPv, null);
  });
test("provider-off case attempts dependency and retains typed absence", async () => {
  const adapter = syntheticAdapter(), v = await run({ adapter, cell: { ...cell, regime: "provider_offline" } });
  assert.equal(adapter.calls, 0); assert.equal(v.row.kind, "source_unavailable"); assert.equal(v.row.cacheHits, 0);
});
test("no-target candidate remains measured without manufactured target or unnecessary provider", async () => {
  const adapter = syntheticAdapter(), v = await run({ adapter, subject: { ...subject, definitions: [] } });
  assert.equal(v.row.kind, "no_target"); assert.equal(adapter.calls, 0); assert.deepEqual(v.raw.result.projections, []);
  assert.ok(v.row.timing.collectionMs > 0);
});
test("two-ply horizon never imports a four-ply observation", async () => {
  const v = await run({ cell: { ...cell, horizon: 2 } });
  assert.ok(v.raw.result.observations.every(x => x.history.length <= 2));
  assert.equal(v.raw.result.projections[0].opportunityObserved, false);
});
test("engine beam executes actual child queries at three decision layers", async () => {
  const adapter = syntheticAdapter(), id = "engine:depth8:top2";
  const v = await run({ adapter, cell: { ...cell, setting: id }, setting: { id, family: "engine_beam" } });
  assert.ok(adapter.calls > 2); assert.ok(v.raw.result.observations.some(x => x.history.length === 4));
  assert.ok(v.row.providerQueries.every(x => x.operands.multiPv === 8 && x.operands.budget === "depth8"));
  assert.equal(checkRawCapture(v), true);
});
for (const id of ["forcing:square_control", "forcing:enemy_piece", "complete:four-ply"])
  test(`${id} remains provider-free even in offline regime`, async () => {
    const adapter = syntheticAdapter(), v = await run({ adapter, cell: { ...cell, setting: id, regime: "provider_offline" },
      setting: { id, family: id.startsWith("forcing") ? "exact_reply_forcing" : "bounded_oracle_diagnostic", trigger: id.split(":")[1] } });
    assert.equal(adapter.calls, 0); assert.equal(v.row.kind, "available"); assert.equal(v.row.providerQueries.length, 0);
    assert.ok(v.raw.result.observations.every(x => x.history.length <= 3));
    assert.equal(v.raw.result.projections[0].executionObserved, false);
  });
test("node exhaustion retains actual omissions and never returns an available traversal", async () => {
  const id = "complete:four-ply", v = await run({ nodeCap: 1, cell: { ...cell, setting: id }, setting: { id, family: "bounded_oracle_diagnostic" } });
  assert.equal(v.row.kind, "budget_exhausted"); assert.ok(v.raw.result.projections[0].rawQuantifier.omittedPreparations.length > 0);
});
test("unimplemented model family refuses before any timing capture", async () => {
  await assert.rejects(run({ setting: { ...setting, family: "configured_model" } }), /Unimplemented/);
});
test("batch range must preserve complete regime triplets and full-plan identities", () => {
  const plan = loadCostPlan(); assert.equal(selectBatchCases(plan, 0, 6).length, 6);
  for (const [start, limit] of [[1, 3], [0, 2], [-3, 3], [0, 0], [plan.expectedCases, 3], [37056, 3]])
    assert.throws(() => selectBatchCases(plan, start, limit));
  assert.equal(plan.expectedCases, 61374);
});
test("real frozen input population yields exact candidate definitions and rejects foreign subject", () => {
  const inputs = loadExecutionInputs(), plan = loadCostPlan();
  for (const candidate of plan.candidates) {
    const subject = executionSubject(inputs, candidate); assert.equal(subject.definitions.length, candidate.namedCells);
  }
  assert.throws(() => executionSubject(inputs, { rootId: "missing", candidateUci: "a1a8" }));
});
test("raw receipt changed clock, payload, identity or bytes is refused", async () => {
  const value = await run();
  for (const mutate of [v => v.row.retainedBytes++, v => v.row.timing.elapsedMs++, v => v.raw.cell.horizon = 2,
    v => v.raw.result.kind = "honest_empty", v => v.raw.dependencies[0].receipt.lines[0] += " a1a8"]) {
    const changed = structuredClone({ row: value.row, raw: value.raw }); mutate(changed);
    assert.throws(() => checkRawCapture(changed));
  }
});
test("UCI adapter rejects missing executable before capture", () => assert.throws(() => new CostStockfish("/nonexistent/d3262-engine")));
const fixture = fileURLToPath(new URL("cost-uci-fixture.mjs", import.meta.url));
test("actual process adapter exchanges readiness, clears hash and retains literal UCI", async () => {
  const adapter = new CostStockfish(process.execPath, { args: [fixture] });
  try {
    await adapter.initialize();
    const q = { ...operand(), sourceDigest: adapter.sourceDigest, multiPv: 1 }, receipt = await adapter.execute(q);
    assert.equal(receipt.engineName, "D3262 process control, not Stockfish evidence");
    assert.equal(receipt.result.entries[0].moveUci, "e2e3");
    assert.ok(receipt.lines.some(x => x.includes("depth 8")));
    assert.ok(adapter.startupMs > 0);
  } finally { await adapter.close(); }
});
for (const [mode, state] of [["silent", "timed_out"], ["chatty", "timed_out"], ["crash", "unavailable"], ["invalid", "invalid"]])
  test(`actual ${mode} process produces ${state} and terminates`, async () => {
    const adapter = new CostStockfish(process.execPath, { args: [fixture, mode], timeoutMs: 300 });
    try {
      await adapter.initialize();
      await assert.rejects(adapter.execute({ ...operand(), sourceDigest: adapter.sourceDigest, multiPv: 1 }),
        error => error instanceof SourceFailure && error.state === state);
    } finally { await adapter.close(); }
  });
test("actual UCI exchange refuses a concurrent query and crossed identity", async () => {
  const adapter = new CostStockfish(process.execPath, { args: [fixture, "slow"] });
  try {
    await adapter.initialize(); const q = { ...operand(), sourceDigest: adapter.sourceDigest, multiPv: 1 };
    await assert.rejects(adapter.execute({ ...q, sourceDigest: sha("other") }), /Crossed/);
    const pending = adapter.execute(q); await assert.rejects(adapter.execute(q), /Parallel/); await pending;
  } finally { await adapter.close(); }
});
test("source-free batch works with no executable, with exact metadata and immutable triplets", async () => {
  const directory = mkdtempSync(join(tmpdir(), "d3262-source-free-control-")), out = join(directory, "capture");
  try {
    const summary = await captureBatch({ out, start: 3474, limit: 3, command: "/nonexistent/d3262-engine" });
    assert.equal(summary.admittedRows, 3); assert.equal(summary.complete, false);
    const metadata = JSON.parse(readFileSync(join(out, "metadata.json")));
    assert.equal(metadata.provider.requested, false); assert.equal(metadata.provider.name, null); assert.equal(metadata.provider.startupMs, 0);
    assert.deepEqual(checkBatch(out), summary);
    await assert.rejects(captureBatch({ out, start: 3474, limit: 3, command: "/nonexistent/d3262-engine" }), /EEXIST/);
  } finally { rmSync(directory, { recursive: true }); }
});
