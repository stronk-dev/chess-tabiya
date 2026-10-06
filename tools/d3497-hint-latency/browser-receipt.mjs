import assert from "node:assert/strict";
import { distribution } from "./receipt.mjs";

export const rowKey = row => `${row.position}/${row.arm}/${row.rung}/${row.sample}`;
const measure = (rows, key) => {
  const values = rows.map(row => row[key]).filter(value => value !== null);
  return values.length ? distribution(values) : null;
};
export function summarizeBrowser(rows) {
  return [...Map.groupBy(rows, row => `${row.position}/${row.arm}/${row.rung}`)].map(([cell, group]) => ({
    cell, n: group.length,
    states: group.reduce((out, row) => ({ ...out, [row.state]: (out[row.state] ?? 0) + 1 }), {}),
    clickToHonestMs: measure(group, "clickToHonestMs"), clickToSettledMs: measure(group, "clickToSettledMs"),
    dependenciesToFrameLowerMs: measure(group, "dependenciesToFrameLowerMs"),
    dependenciesToFrameUpperMs: measure(group, "dependenciesToFrameUpperMs"),
    payloadBytes: measure(group, "payloadBytes"),
  }));
}
export function checkBrowserReceipt(receipt, plan, base) {
  assert.equal(receipt.version, 1); assert.equal(receipt.workItem, plan.workItem);
  assert.match(receipt.node, /^v24\./u); assert.equal(receipt.d7Discharged, false);
  assert.equal(receipt.measurement, plan.measurement); assert.deepEqual(receipt.viewport, plan.viewport);
  assert(Number.isInteger(receipt.samples) && receipt.samples > 0 && receipt.samples <= plan.samplesPerCell);
  assert.equal(receipt.sampleMode, receipt.samples === plan.samplesPerCell ? "receipt" : "smoke");
  assert.match(receipt.engine.providerBinaryDigest, /^sha256:[a-f0-9]{64}$/u);
  assert(receipt.browserVersion && receipt.sourceDigests && receipt.buildDigests);
  const expected = [];
  for (let sample = 0; sample < receipt.samples; sample++) {
    for (const position of base.positions) for (const arm of ["cold", "warm"]) for (const rung of base.rungs) expected.push(`${position.id}/${arm}/${rung}/${sample}`);
    for (const arm of base.arms.filter(arm => !["cold", "warm"].includes(arm))) expected.push(`mate/${arm}/pattern/${sample}`);
  }
  assert.deepEqual(receipt.rows.map(rowKey).sort(), expected.sort(), "complete frozen browser population required");
  assert.equal(receipt.baselines.length, receipt.samples * 3);
  assert.equal(new Set(receipt.baselines.map(row => `${row.pairedArm}/${row.sample}`)).size, receipt.baselines.length);
  for (const row of [...receipt.rows, ...receipt.baselines]) {
    if (row.state === "not_reachable") {
      assert.equal(row.boundary, "not_reachable");
      assert(["square", "piece", "distance"].includes(row.rung));
      const previous = receipt.rows.find(item => item.position === row.position && item.arm === row.arm && item.sample === row.sample && item.rung === base.rungs[base.rungs.indexOf(row.rung) - 1]);
      assert(previous && previous.state !== "available");
      assert.equal(row.predecessor, rowKey(previous));
      for (const field of ["clickToHonestMs", "clickToSettledMs", "dependenciesToFrameLowerMs", "dependenciesToFrameUpperMs", "payloadBytes"]) assert.equal(row[field], null);
      continue;
    }
    assert.equal(row.response.state, row.state);
    assert(["available", "honest_empty", "source_unavailable", "policy_refused", "failed", "stale", "cancelled"].includes(row.state));
    assert(Number.isSafeInteger(row.payloadBytes) && row.payloadBytes > 0);
    if (row.boundary === "rest_ceiling_control") {
      assert.equal(row.rung, "move"); assert.equal(row.state, "policy_refused");
      assert.equal(row.response.reason, "above_ceiling");
      assert.equal(row.uiMoreDisabled, true);
      assert.equal(row.clickToSettledMs, null); assert.equal(row.clickToHonestMs, null);
      assert.equal(row.sources.length, 0); assert.equal(row.packets.length, 0);
      continue;
    }
    assert.equal(row.boundary, "browser");
    assert(Number.isFinite(row.clickToHonestMs) && row.clickToHonestMs >= 0);
    assert(Number.isFinite(row.clickToSettledMs) && row.clickToSettledMs >= row.clickToHonestMs);
    assert.equal(row.dom.afterFrames, 2); assert.equal(row.dom.visible, true); assert.equal(row.dom.hitTest, true);
    assert(row.dom.rect.width > 0 && row.dom.rect.height > 0 && row.dom.rect.x >= 0 && row.dom.rect.y >= 0);
    assert(row.dom.rect.x + row.dom.rect.width <= plan.viewport.width && row.dom.rect.y + row.dom.rect.height <= plan.viewport.height);
    assert.equal(row.clickToHonestMs, row.honestAt - row.clickAt);
    assert.equal(row.clickToSettledMs, row.dom.frameAt - row.clickAt);
    assert(row.clock.samples.length === 5);
    for (const sample of row.clock.samples) {
      assert(sample.before <= sample.after && sample.lower <= sample.upper);
      assert.equal(sample.lower, sample.before - sample.browserAt);
      assert.equal(sample.upper, sample.after - sample.browserAt);
    }
    const best = [...row.clock.samples].sort((a, b) => (a.upper - a.lower) - (b.upper - b.lower))[0];
    assert.equal(row.clock.lower, best.lower); assert.equal(row.clock.upper, best.upper);
    assert.equal(row.dependenciesToFrameLowerMs, row.dom.frameAt + row.clock.lower - row.dependencyAt);
    assert.equal(row.dependenciesToFrameUpperMs, row.dom.frameAt + row.clock.upper - row.dependencyAt);
    assert(row.dependenciesToFrameUpperMs >= row.dependenciesToFrameLowerMs);
    assert.equal(row.dependencyClock, row.sources.length + row.packets.length ? "last_observed_mandatory_completion" : "request_entry_no_observed_acquisition");
    assert.equal(row.dependencyAt, Math.max(row.requestEntryAt, ...row.sources.map(source => source.completedAt), ...row.packets.map(packet => packet.completedAt)));
    for (const source of row.sources) {
      assert.equal(source.operation, "stockfish.principal_variation@1");
      assert.equal(source.result.kind, "success");
      assert.equal(source.result.delivery.acquisition.actualIdentity.binaryDigest, receipt.engine.providerBinaryDigest);
      assert.equal(source.result.delivery.acquisition.actualIdentity.version, "18");
      assert.equal(source.result.delivery.acquisition.requestedIdentity.request.fen, base.positions.find(position => position.id === row.position).fen);
      assert.equal(source.result.delivery.acquisition.requestedIdentity.request.bound.requestedDepth, receipt.profile.depth);
      assert.equal(source.result.delivery.payload.maxPlies, 4);
    }
    for (const packet of row.packets) {
      assert.equal(packet.kind, "ready"); assert.equal(packet.legalMoves, packet.candidates);
      assert.equal(packet.manifestDigest, receipt.manifestDigest);
    }
    if (row.state === "available") {
      const posted = row.wire.find(item => item.method === "POST");
      assert(posted && posted.requestBody.rung === row.rung);
      assert.equal(posted.requestBody.decisionDigest, row.response.delivery.decision.digest);
      assert.equal(row.response.delivery.rung, row.rung);
      assert.equal(row.dom.rung, row.rung);
      assert.equal(row.dom.text, row.response.delivery.rendered.voice.state === "rendered" ? row.response.delivery.rendered.voice.sentence : row.response.delivery.rendered.sentence);
      assert.equal(row.deterministicSentence, row.response.delivery.rendered.sentence);
      assert(row.response.delivery.receiptDigest && row.response.delivery.decision.digest);
    } else assert(row.dom.text.length > 0, "honest terminal outcome must be visible");
    if (row.arm === "cold" && row.rung === "pattern") {
      assert.equal(row.sources.length, 1); assert.equal(row.sources[0].result.delivery.kind, "live");
      assert(row.packets.length && row.packets.every(packet => packet.hitsDelta === 0 && packet.missesDelta === 1));
    }
    if (row.arm === "warm" && row.rung === "pattern") {
      const cold = receipt.rows.find(item => item.position === row.position && item.sample === row.sample && item.arm === "cold" && item.rung === "pattern");
      assert(row.sources.length && row.sources.every(source => source.result.delivery.kind === "retained_exact"));
      assert(row.packets.length && row.packets.every(packet => packet.hitsDelta === 1 && packet.missesDelta === 0));
      assert.deepEqual(row.sources[0].result.delivery.acquisition, cold.sources[0].result.delivery.acquisition);
      assert.deepEqual(row.packets.map(packet => packet.id), cold.packets.map(packet => packet.id));
    }
    if (row.arm.startsWith("voice_") && row.arm !== "voice_baseline") {
      assert.equal(row.state, "available");
      const baseline = receipt.baselines.find(item => item.pairedArm === row.arm && item.sample === row.sample);
      assert(baseline && baseline.state === "available");
      assert.equal(row.deterministicSentence, baseline.deterministicSentence);
      assert.deepEqual(row.response.delivery.rendered.voice, row.arm === "voice_absent" ? { state: "not_requested" } : { state: "fallback", reason: row.arm === "voice_timeout" ? "deadline_exceeded" : "refused" });
    }
    if (row.arm === "source_off") {
      assert.equal(row.state, "source_unavailable");
      assert.equal(row.modules.status, 200);
      const page = row.modules.body.page;
      for (const module of ["structure_nudge", "theory_breadcrumb"]) {
        assert(!page.suppressions.some(item => item.module === module));
        const packet = page.packets.find(item => item.module === module);
        assert(packet && (packet.empty !== null || packet.receipt.items.length > 0));
      }
    }
  }
  assert.deepEqual(receipt.summary, summarizeBrowser(receipt.rows));
  return { rows: receipt.rows.length, baselines: receipt.baselines.length, mode: receipt.sampleMode, d7Discharged: false };
}
