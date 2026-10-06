import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { sha, queryIdentity } from "./cost-contract.mjs";
import { CostDependencies } from "./cost-stockfish.mjs";
import { MaiaProcess, parseMaiaReceipt } from "./cost-maia.mjs";
import { syntheticMaiaLine } from "./cost-maia-fixture.mjs";
import { checkMaiaProbe } from "./cost-maia-probe.mjs";

const rootFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const imageId = sha("synthetic model transport control, not a live image");
const q = (historyUci = ["e2e4"], sourceDigest = sha("synthetic control source")) => ({
  provider: "maia", sourceDigest, rootFen, historyUci, selfElo: 1400, opponentElo: 1400, temperature: 0.8, topP: 0.92,
});
const makeSource = (mode = "normal", timeoutMs = 2000) => new MaiaProcess(process.execPath,
  [fileURLToPath(new URL("cost-maia-fixture.mjs", import.meta.url)), mode], { imageId, timeoutMs });

test("complete literal legal logits reconstruct raw and configured mass", () => {
  const value = parseMaiaReceipt(q(), [syntheticMaiaLine(q())]);
  assert.equal(value.rawFullLegal.length, 20); assert.ok(value.configuredSupport.length < 20);
  assert.equal(value.historyFrames, 2); assert.equal(value.authority, "configured_model_policy_not_human_frequency_or_move_reason");
});
for (const [name, mutate] of [
  ["history removed", x => { x.operands.historyUci = []; }],
  ["history reset", x => { x.historyFrames = 1; }],
  ["wrong FEN", x => { x.fen = rootFen; }],
  ["raw top-window instead of all legal", x => { x.rawFullLegal.pop(); }],
  ["duplicate index", x => { x.rawFullLegal[1].index = x.rawFullLegal[0].index; }],
  ["wrong raw mass", x => { x.rawFullLegal[0].mass += 0.05; }],
  ["wrong logit", x => { x.rawFullLegal[0].logit += 1; }],
  ["wrong sampler order", x => { [x.samplerOrder[0], x.samplerOrder[1]] = [x.samplerOrder[1], x.samplerOrder[0]]; }],
  ["false cumulative mass", x => { x.samplerOrder[0].cumulativeMass += 0.1; }],
  ["sampler includes overshooting move", x => { x.samplerOrder.find(y => !y.kept).kept = true; }],
  ["wrong normalized support", x => { x.configuredSupport[0].mass += 0.01; }],
  ["tokens absent", x => { x.tokens = []; }],
  ["false authority", x => { x.authority = "human_frequency"; }],
  ["extra field", x => { x.unlicensedReason = "good move"; }],
]) test(`literal model refuses ${name}`, () => {
  const line = JSON.parse(syntheticMaiaLine(q())); mutate(line.payload);
  assert.throws(() => parseMaiaReceipt(q(), [JSON.stringify(line)]));
});
test("history key remains distinct for two paths to the same board", () => {
  const left = q(["g1f3", "g8f6", "b1c3", "b8c6"]), right = q(["b1c3", "b8c6", "g1f3", "g8f6"]);
  assert.equal(parseMaiaReceipt(left, [syntheticMaiaLine(left)]).fen, parseMaiaReceipt(right, [syntheticMaiaLine(right)]).fen);
  assert.notEqual(queryIdentity(left), queryIdentity(right));
  assert.throws(() => parseMaiaReceipt(left, [syntheticMaiaLine(right)]), /history/);
});
test("exact cold literal source is reparsed on warm; final results are not cached", async () => {
  const adapter = makeSource();
  try {
    await adapter.initialize();
    const operands = q(["e2e4"], adapter.sourceDigest), cold = new CostDependencies(adapter, "cold");
    assert.equal((await cold.query(operands)).state, "executed");
    const warm = new CostDependencies(adapter, "warm", cold.cache);
    assert.equal((await warm.query(operands)).state, "cached");
    assert.equal(warm.ledger[0].receiptDigest, cold.ledger[0].receiptDigest);
    assert.equal(adapter.sequence, 1);
    const alternate = q(["d2d4"], adapter.sourceDigest);
    assert.equal((await warm.query(alternate)).state, "executed");
    assert.equal(adapter.sequence, 2);
    const offline = new CostDependencies(adapter, "provider_offline");
    assert.equal((await offline.query(operands)).state, "unavailable"); assert.equal(adapter.sequence, 2);
    const forged = structuredClone(cold.cache.get(queryIdentity(operands))); forged.result.configuredSupport[0].mass = 1;
    const bad = new CostDependencies(adapter, "warm", new Map([[queryIdentity(operands), forged]]));
    assert.equal((await bad.query(operands)).state, "invalid");
  } finally { await adapter.close(); }
});
for (const [mode, state] of [["wrong-id", "invalid"], ["bad-payload", "invalid"], ["failure", "invalid"], ["malformed", "invalid"],
  ["oversize", "invalid"], ["exit", "unavailable"], ["no-response", "timed_out"], ["partial", "timed_out"]])
  test(`model transport retains ${mode} as ${state}`, async () => {
    const adapter = makeSource(mode);
    try {
      await adapter.initialize(); adapter.timeoutMs = 150;
      const dependencies = new CostDependencies(adapter, "cold");
      assert.equal((await dependencies.query(q(["e2e4"], adapter.sourceDigest))).state, state);
      assert.equal(dependencies.ledger[0].receiptDigest, null);
      if (["wrong-id", "bad-payload", "failure", "malformed"].includes(mode)) assert.ok(dependencies.raw[0].rejectedCapture?.lines.length);
    } finally { await adapter.close(); }
  });
for (const mode of ["bad-ready", "extra-ready"]) test(`${mode} refuses startup`, async () => {
  const adapter = makeSource(mode);
  try { await assert.rejects(adapter.initialize(), e => e.state === "invalid"); }
  finally { await adapter.close(); }
});
test("missing process is unavailable and close does not wait for a nonexistent exit", async () => {
  const adapter = new MaiaProcess("/nonexistent/d3262-maia", [], { imageId });
  try { await assert.rejects(adapter.initialize(), e => e.state === "unavailable"); }
  finally { await adapter.close(); }
});
test("startup deadline also bounds a silent model", async () => {
  const adapter = makeSource("no-ready", 250);
  try { await assert.rejects(adapter.initialize(), e => e.state === "timed_out"); }
  finally { await adapter.close(); }
});
test("parallel transport and wrong source are refused", async () => {
  const adapter = makeSource();
  try {
    await adapter.initialize();
    await assert.rejects(adapter.execute(q()), e => e.state === "invalid");
    const request = adapter.execute(q(["e2e4"], adapter.sourceDigest));
    await assert.rejects(adapter.execute(q(["d2d4"], adapter.sourceDigest)), e => e.state === "invalid");
    await request;
  } finally { await adapter.close(); }
});
const liveControl = () => JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-cost-maia-source-control-2026-10-06.json"));
test("retained actual Maia control passes literal reconstruction without a traversal claim", () => {
  assert.deepEqual(checkMaiaProbe(liveControl()), { receipts: 3, legalMoves: 77, actualTraversalMeasured: false });
});
for (const [name, mutate] of [
  ["cache digest", x => { x.cold[0].receiptDigest = sha("false"); x.warm[0].receiptDigest = x.cold[0].receiptDigest; }],
  ["offline source execution", x => { x.offline[0].state = "executed"; }],
  ["crossed source", x => { x.sourceDigest = sha("false"); }],
  ["missing model control", x => { x.receipts.pop(); }],
  ["traversal completion", x => { x.actualTraversalMeasured = true; }],
  ["changed literal", x => { x.receipts[0].result.historyFrames = 1; }],
]) test(`source artifact refuses ${name}`, () => {
  const value = liveControl(); mutate(value); assert.throws(() => checkMaiaProbe(value));
});
