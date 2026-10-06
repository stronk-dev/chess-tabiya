// Synthetic checker controls, never timing evidence or substitutes for capture.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { checkBrowserReceipt, summarizeBrowser, rowKey } from "./browser-receipt.mjs";
const plan = JSON.parse(readFileSync("tools/d3497-hint-latency/browser-plan.json", "utf8"));
const base = JSON.parse(readFileSync(plan.basePlan, "utf8"));
function fixture() {
  const receipt = { version: 1, workItem: plan.workItem, node: "v24.1.0", d7Discharged: false, measurement: plan.measurement, viewport: plan.viewport, samples: 1, sampleMode: "smoke", engine: { providerBinaryDigest: `sha256:${"a".repeat(64)}` }, browserVersion: "synthetic-control", sourceDigests: {}, buildDigests: {}, profile: { depth: 12 }, manifestDigest: "test-manifest", rows: [], baselines: [] };
  const row = (position, arm, rung) => {
    const offset = 100, at = 200;
    const value = { position: position.id, arm, rung, sample: 0, boundary: "browser", state: "available", deterministicSentence: "Exact synthetic checker sentence.",
      response: { state: "available", delivery: { rung, receiptDigest: "test-receipt", decision: { digest: "test-decision" }, rendered: { sentence: "Exact synthetic checker sentence.", voice: { state: "not_requested" } } } },
      wire: [{ method: "POST", requestBody: { rung, decisionDigest: "test-decision" } }],
      clickAt: 90, honestAt: at, clickToHonestMs: at - 90, clickToSettledMs: at - 90, dom: { frameAt: at, text: "Exact synthetic checker sentence.", rung, afterFrames: 2, visible: true, hitTest: true, rect: { x: 1, y: 1, width: 100, height: 20 } },
      clock: { lower: offset, upper: offset + 1, samples: Array.from({ length: 5 }, () => ({ before: 110, after: 111, browserAt: 10, lower: offset, upper: offset + 1 })) }, requestEntryAt: 190, dependencyAt: 190, dependencyClock: "request_entry_no_observed_acquisition", dependenciesToFrameLowerMs: at + offset - 190, dependenciesToFrameUpperMs: at + offset + 1 - 190, payloadBytes: 123, sources: [], packets: [] };
    if (["cold", "warm"].includes(arm) && rung === "pattern") {
      value.sources = [{ completedAt: 210, operation: "stockfish.principal_variation@1", result: { kind: "success", delivery: { kind: arm === "cold" ? "live" : "retained_exact", acquisition: { actualIdentity: { binaryDigest: receipt.engine.providerBinaryDigest, version: "18" }, requestedIdentity: { request: { fen: position.fen, bound: { requestedDepth: 12 } } } }, payload: { maxPlies: 4 } } } }];
      value.packets = [{ completedAt: 220, kind: "ready", id: position.id, manifestDigest: receipt.manifestDigest, legalMoves: 5, candidates: 5, hitsDelta: arm === "warm" ? 1 : 0, missesDelta: arm === "cold" ? 1 : 0 }];
      value.dependencyAt = 220; value.dependencyClock = "last_observed_mandatory_completion";
      value.dependenciesToFrameLowerMs = at + offset - 220; value.dependenciesToFrameUpperMs = at + offset + 1 - 220;
    }
    return value;
  };
  for (const position of base.positions) for (const arm of ["cold", "warm"]) for (const rung of base.rungs) {
    if (rung === "move") receipt.rows.push({ position: position.id, arm, rung, sample: 0, state: "policy_refused", boundary: "rest_ceiling_control", uiMoreDisabled: true, response: { state: "policy_refused", reason: "above_ceiling" }, payloadBytes: 123, clickToHonestMs: null, clickToSettledMs: null, dependenciesToFrameLowerMs: null, dependenciesToFrameUpperMs: null, sources: [], packets: [] });
    else receipt.rows.push(row(position, arm, rung));
  }
  const position = base.positions.find(position => position.id === "mate");
  for (const arm of base.arms.filter(arm => !["cold", "warm"].includes(arm))) {
    const value = row(position, arm, "pattern");
    if (arm === "source_off") {
      value.state = "source_unavailable"; value.response = { state: "source_unavailable" };
      value.dom.rung = null; value.dom.text = "Analysis is unavailable.";
      value.modules = { status: 200, body: { page: { suppressions: [], packets: ["structure_nudge", "theory_breadcrumb"].map(module => ({ module, empty: { reason: "absent" } })) } } };
    } else {
      receipt.baselines.push({ ...row(position, "voice_baseline", "pattern"), pairedArm: arm });
      value.response.delivery.rendered.voice = arm === "voice_absent" ? { state: "not_requested" } : { state: "fallback", reason: arm === "voice_timeout" ? "deadline_exceeded" : "refused" };
    }
    receipt.rows.push(value);
  }
  receipt.summary = summarizeBrowser(receipt.rows);
  return receipt;
}
test("complete synthetic population derives summaries without claiming D7 or full sampling", () => {
  assert.deepEqual(checkBrowserReceipt(fixture(), plan, base), { rows: 44, baselines: 3, mode: "smoke", d7Discharged: false });
});
for (const [name, corrupt] of [
  ["missing cell", r => r.rows.pop()], ["duplicate cell", r => r.rows.push(r.rows[0])],
  ["smoke relabelled receipt", r => r.sampleMode = "receipt"], ["D7 false closure", r => r.d7Discharged = true],
  ["hidden DOM", r => r.rows[0].dom.visible = false], ["offscreen DOM", r => r.rows[0].dom.rect.y = 2000],
  ["occluded DOM", r => r.rows[0].dom.hitTest = false], ["wrong actual decision", r => r.rows[0].wire[0].requestBody.decisionDigest = "other"],
  ["mutation instead of frame", r => r.rows[0].dom.afterFrames = 0], ["sentence drift", r => r.rows[0].dom.text = "invented"],
  ["wrong rung", r => r.rows[0].dom.rung = "move"], ["fake clock", r => r.rows[0].clock.samples[0].lower = 1],
  ["late mandatory clock", r => r.rows[0].dependencyAt += 1], ["cached source called cold", r => r.rows[0].sources[0].result.delivery.kind = "retained_exact"],
  ["different warm identity", r => r.rows[5].sources[0].result.delivery.acquisition.actualIdentity.version = "17"],
  ["move refusal called browser", r => r.rows[4].boundary = "browser"],
  ["voice changed deterministic bytes", r => r.rows.find(row => row.arm === "voice_timeout").deterministicSentence = "changed"],
  ["source-off module suppressed", r => r.rows.find(row => row.arm === "source_off").modules.body.page.suppressions.push({ module: "structure_nudge" })],
  ["pruned summary", r => r.summary.pop()],
]) test(`refuses ${name}`, () => { const r = fixture(); corrupt(r); assert.throws(() => checkBrowserReceipt(r, plan, base)); });
test("unreachable rungs remain counted with null clocks and actual predecessor", () => {
  const r = fixture();
  const pattern = r.rows[0]; pattern.state = "honest_empty"; pattern.response = { state: "honest_empty" }; pattern.dom.text = "No occurrence."; pattern.dom.rung = null;
  let previous = pattern;
  for (let i = 1; i <= 3; i++) {
    const original = r.rows[i];
    r.rows[i] = { position: original.position, arm: original.arm, rung: original.rung, sample: original.sample, state: "not_reachable", boundary: "not_reachable", predecessor: rowKey(previous), clickToHonestMs: null, clickToSettledMs: null, dependenciesToFrameLowerMs: null, dependenciesToFrameUpperMs: null, payloadBytes: null };
    previous = r.rows[i];
  }
  r.summary = summarizeBrowser(r.rows); checkBrowserReceipt(r, plan, base);
  r.rows[1].clickToSettledMs = 0; assert.throws(() => checkBrowserReceipt(r, plan, base));
});
