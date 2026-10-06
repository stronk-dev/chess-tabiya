// Synthetic checker controls only: these timings are never research observations.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkReceipt, distribution, summarize } from "./receipt.mjs";

const plan = JSON.parse(readFileSync(new URL("./plan.json", import.meta.url), "utf8"));
const binaryDigest = `sha256:${"a".repeat(64)}`;
function fixture(samples = 1) {
  const rows = [], baselines = [];
  for (let sample = 0; sample < samples; sample++) {
    for (const position of plan.positions) for (const arm of ["cold", "warm"]) for (const rung of plan.rungs) {
      const state = rung === "move" ? "policy_refused" : "honest_empty";
      const sources = rung !== "pattern" ? [] : [{ operation: "stockfish.principal_variation@1", kind: arm === "warm" ? "retained_exact" : "live", result: { kind: "success", delivery: { kind: arm === "warm" ? "retained_exact" : "live", cacheIdentity: arm === "warm" ? `sha256:${"b".repeat(64)}` : null, acquisition: { actualIdentity: { binaryDigest, version: "18" }, requestedIdentity: { request: { fen: position.fen, bound: { requestedDepth: 12 } } } }, payload: { maxPlies: 4 } } } }];
      const packets = rung !== "pattern" ? [] : [{ id: `${position.id}-packet`, kind: "ready", hitsDelta: arm === "warm" ? 1 : 0, missesDelta: arm === "cold" ? 1 : 0, manifestDigest: "fixture-manifest", compilerVersion: "fixture-compiler", legalMoves: 5, candidates: 5 }];
      rows.push({ position: position.id, arm, rung, sample, state, postMs: 1, totalHttpMs: 10, mandatoryDependenciesToHttpMs: 8, dependencyClock: sources.length ? "last_observed_mandatory_completion" : "request_entry_no_observed_acquisition", payloadBytes: 100, response: { state, ...(rung === "move" ? { reason: "above_ceiling" } : {}) }, sources, packets });
    }
    for (const arm of ["source_off", "voice_absent", "voice_timeout", "voice_refused"]) {
      const state = arm === "source_off" ? "source_unavailable" : "available";
      const voice = arm === "voice_absent" ? { state: "not_requested" } : { state: "fallback", reason: arm === "voice_timeout" ? "deadline_exceeded" : "refused" };
      const row = { position: "mate", arm, rung: "pattern", sample, state, postMs: 1, totalHttpMs: 10, mandatoryDependenciesToHttpMs: 8, dependencyClock: "request_entry_no_observed_acquisition", payloadBytes: 100, response: { state }, sources: [], packets: [] };
      if (arm === "source_off") row.modules = { status: 200, control: plan.sourceOffModules, body: { page: { timing: "post_commit", suppressions: [], packets: ["structure_nudge", "theory_breadcrumb"].map(module => ({ module, empty: null, receipt: { items: [ { fixture: true } ] } })) } } };
      else {
        row.response.delivery = { rung: "pattern", rendered: { sentence: "Grounded fixture sentence.", voice } };
        row.deterministicSentence = row.baselineSentence = "Grounded fixture sentence.";
        baselines.push({ pairedArm: arm, sample, state: "available", deterministicSentence: row.baselineSentence, response: { delivery: { rendered: { sentence: row.baselineSentence } } } });
      }
      rows.push(row);
    }
  }
  return { version: 1, workItem: plan.workItem, scope: plan.scope, node: "v24.0.0", engine: { sha256: "a".repeat(64), providerBinaryDigest: binaryDigest }, profile: { depth: 12 }, manifestDigest: "fixture-manifest", packetCompiler: "fixture-compiler", d7Discharged: false, browserPaint: "not_measured", samples, sampleMode: samples === plan.samplesPerCell ? "receipt" : "smoke", baselines, rows, summary: summarize(rows) };
}

test("keeps all 44 cells and separates smoke from full twenty-sample population", () => {
  assert.deepEqual(checkReceipt(fixture(), plan), { rows: 44, cells: 44, samples: 1, mode: "smoke", d7Discharged: false });
  assert.equal(checkReceipt(fixture(20), plan).rows, 880);
});
test("nearest-rank p95 retains raw order, outliers and singleton populations", () => {
  const values = Array.from({ length: 20 }, (_, i) => 20 - i);
  assert.deepEqual(distribution(values), { n: 20, min: 1, median: 11, p95: 19, max: 20, all: values });
  assert.equal(distribution([2075]).p95, 2075);
  assert.throws(() => distribution([])); assert.throws(() => distribution([NaN]));
});
const corruptions = {
  "requested module replaced by proactive sibling": r => r.rows.find(x => x.arm === "source_off").modules.body.page.packets[0].module = "postcommit_nudge",
  "dropped refused rung": r => r.rows.pop(),
  "duplicate sample": r => r.rows[0].sample = 1,
  "relabel smoke as full": r => r.sampleMode = "receipt",
  "pending as settled": r => r.rows[0].state = r.rows[0].response.state = "pending",
  "invent browser paint": r => r.browserPaint = "passed",
  "claim D7 complete": r => r.d7Discharged = true,
  "negative dependency timing": r => r.rows[0].mandatoryDependenciesToHttpMs = -1,
  "wrong outcome": r => r.rows[0].response.state = "available",
  "invent retained PV": r => r.rows.find(x => x.arm === "warm" && x.rung === "pattern").sources[0].kind = "live",
  "wrong engine": r => r.rows[0].sources[0].result.delivery.acquisition.actualIdentity.binaryDigest = "sha256:bad",
  "wrong engine depth": r => r.rows[0].sources[0].result.delivery.acquisition.requestedIdentity.request.bound.requestedDepth = 8,
  "wrong FEN": r => r.rows[0].sources[0].result.delivery.acquisition.requestedIdentity.request.fen = "other",
  "warm reacquired identity": r => r.rows.find(x => x.arm === "warm" && x.rung === "pattern").sources[0].result.delivery.acquisition.extra = "new acquisition",
  "uncached packet": r => r.rows.find(x => x.arm === "warm" && x.rung === "pattern").packets[0].missesDelta = 1,
  "different packet": r => r.rows.find(x => x.arm === "warm" && x.rung === "pattern").packets[0].id = "replacement",
  "incomplete population": r => r.rows[0].packets[0].candidates = 4,
  "manifest drift": r => r.rows[0].packets[0].manifestDigest = "different",
  "missing voice baseline": r => r.baselines.pop(),
  "invent unavailable-voice fallback": r => r.rows.find(x => x.arm === "voice_absent").response.delivery.rendered.voice = { state: "fallback", reason: "provider_unavailable" },
  "voice alters deterministic bytes": r => r.rows.find(x => x.arm === "voice_timeout").response.delivery.rendered.sentence = "new unsupported sentence",
  "HTTP200 without independent cards": r => r.rows.find(x => x.arm === "source_off").modules.body.page.packets = [],
  "wrong module timing": r => r.rows.find(x => x.arm === "source_off").modules.body.page.timing = "checkpoint",
  "suppression disguised as rendering": r => r.rows.find(x => x.arm === "source_off").modules.body.page.suppressions = [{ module: "structure_nudge", reason: "not_effective" }],
  "empty receipt without declared absence": r => r.rows.find(x => x.arm === "source_off").modules.body.page.packets[0].receipt.items = [],
  "move policy bypass": r => r.rows.find(x => x.rung === "move").response.reason = "module_inactive",
  "negative timing": r => r.rows[0].postMs = -1,
  "invalid payload size": r => r.rows[0].payloadBytes = 0,
  "forged summary": r => r.summary[0].postMs.p95 = 0,
};
for (const [name, mutate] of Object.entries(corruptions)) test(`refuses ${name}`, () => {
  const receipt = fixture(); mutate(receipt); assert.throws(() => checkReceipt(receipt, plan));
});
