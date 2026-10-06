import assert from "node:assert/strict";

export function distribution(values) {
  assert(values.length > 0 && values.every(n => Number.isFinite(n) && n >= 0), "invalid timing population");
  const sorted = [...values].sort((a, b) => a - b);
  return { n: sorted.length, min: sorted[0], median: sorted[Math.floor(sorted.length / 2)], p95: sorted[Math.ceil(sorted.length * 0.95) - 1], max: sorted.at(-1), all: values };
}

export function summarize(rows) {
  const groups = Map.groupBy(rows, row => `${row.position}/${row.arm}/${row.rung}`);
  return [...groups].map(([cell, group]) => ({
    cell, states: group.reduce((out, row) => ({ ...out, [row.state]: (out[row.state] ?? 0) + 1 }), {}),
    postMs: distribution(group.map(row => row.postMs)), totalHttpMs: distribution(group.map(row => row.totalHttpMs)),
    mandatoryDependenciesToHttpMs: distribution(group.map(row => row.mandatoryDependenciesToHttpMs)),
    payloadBytes: distribution(group.map(row => row.payloadBytes)),
    // This is deliberately unavailable; the server/client stopwatch cannot certify paint.
    browserPaintMs: null,
  }));
}

export function checkReceipt(receipt, plan) {
  assert.equal(receipt.version, 1); assert.equal(receipt.workItem, plan.workItem);
  assert.match(receipt.node, /^v24\./u, "the receipt requires Node 24");
  assert.match(receipt.engine.sha256, /^[a-f0-9]{64}$/u);
  assert.equal(receipt.scope, plan.scope);
  assert.equal(receipt.d7Discharged, false, "an HTTP-only receipt cannot discharge D7");
  assert.equal(receipt.browserPaint, "not_measured");
  assert.equal(receipt.sampleMode, receipt.samples === plan.samplesPerCell ? "receipt" : "smoke");
  assert(Number.isSafeInteger(receipt.samples) && receipt.samples > 0 && receipt.samples <= plan.samplesPerCell);
  assert.match(receipt.engine.providerBinaryDigest, /^sha256:[a-f0-9]{64}$/u);
  assert.equal(receipt.profile.depth, 12);
  const voiceArms = ["voice_absent", "voice_timeout", "voice_refused"];
  assert.equal(receipt.baselines.length, voiceArms.length * receipt.samples, "paired voice baselines must be retained");
  const baselineKeys = receipt.baselines.map(row => `${row.pairedArm}/${row.sample}`);
  assert.equal(new Set(baselineKeys).size, baselineKeys.length, "duplicate voice baseline");
  const expected = [];
  for (const position of plan.positions) for (const arm of ["cold", "warm"]) for (const rung of plan.rungs) expected.push(`${position.id}/${arm}/${rung}`);
  for (const arm of plan.arms.filter(arm => !["cold", "warm"].includes(arm))) expected.push(`mate/${arm}/pattern`);
  const groups = Map.groupBy(receipt.rows, row => `${row.position}/${row.arm}/${row.rung}`);
  assert.deepEqual([...groups.keys()].sort(), expected.sort(), "missing, extra or relabelled measurement cell");
  for (const group of groups.values()) {
    assert.equal(group.length, receipt.samples);
    assert.deepEqual(group.map(row => row.sample).sort((a,b)=>a-b), Array.from({length:receipt.samples},(_,i)=>i));
    for (const row of group) {
      assert(Number.isFinite(row.postMs) && row.postMs >= 0);
      assert(Number.isFinite(row.totalHttpMs) && row.totalHttpMs >= row.postMs);
      assert(Number.isFinite(row.mandatoryDependenciesToHttpMs) && row.mandatoryDependenciesToHttpMs >= 0 && row.mandatoryDependenciesToHttpMs <= row.totalHttpMs + 1);
      assert(Number.isSafeInteger(row.payloadBytes) && row.payloadBytes > 0);
      assert(["available", "honest_empty", "source_unavailable", "policy_refused", "failed", "stale", "cancelled"].includes(row.state), "unsettled/unknown row");
      assert.equal(row.response.state, row.state, "response and measured outcome disagree");
      assert.equal(row.dependencyClock, row.sources.length + row.packets.length === 0 ? "request_entry_no_observed_acquisition" : "last_observed_mandatory_completion");
      for (const source of row.sources) {
        const delivery = source.result.delivery;
        assert.equal(source.operation, "stockfish.principal_variation@1");
        assert.equal(source.result.kind, "success");
        assert.equal(source.kind, delivery.kind);
        assert.equal(delivery.acquisition.actualIdentity.binaryDigest, receipt.engine.providerBinaryDigest, "launched binary identity differs");
        assert.equal(delivery.acquisition.actualIdentity.version, "18");
        assert.equal(delivery.acquisition.requestedIdentity.request.fen, plan.positions.find(p => p.id === row.position).fen);
        assert.equal(delivery.acquisition.requestedIdentity.request.bound.requestedDepth, receipt.profile.depth);
        assert.equal(delivery.payload.maxPlies, 4);
        assert.equal(delivery.kind === "live", delivery.cacheIdentity === null);
      }
      for (const packet of row.packets) {
        assert.equal(packet.kind, "ready");
        assert.equal(packet.manifestDigest, receipt.manifestDigest);
        assert.equal(packet.compilerVersion, receipt.packetCompiler);
        assert.equal(packet.legalMoves, packet.candidates, "incomplete candidate population");
      }
      if (row.rung === "move") { assert.equal(row.state, "policy_refused"); assert.equal(row.response.reason, "above_ceiling"); assert.equal(row.packets.length, 0); assert.equal(row.sources.length, 0); }
      if (row.arm === "source_off") {
        assert.equal(row.state, "source_unavailable"); assert.equal(row.packets.length, 0); assert.equal(row.sources.length, 0);
        assert.equal(row.modules.status, 200); assert.deepEqual(row.modules.control, plan.sourceOffModules);
        const page = row.modules.body.page;
        assert.equal(page.timing, "post_commit");
        const requiredModules = ["structure_nudge", "theory_breadcrumb"];
        assert(!page.suppressions.some(item => requiredModules.includes(item.module)), "independent modules were suppressed rather than delivered");
        assert.deepEqual(page.packets.filter(packet => requiredModules.includes(packet.module)).map(packet => packet.module).sort(), requiredModules);
        assert(page.packets.every(packet => packet.empty !== null || packet.receipt.items.length > 0), "HTTP success without module output");
      }
      if (row.arm === "cold" && row.rung === "pattern") {
        assert.equal(row.sources.length, 1, "coldness needs an actual source acquisition");
        assert.equal(row.sources[0].kind, "live");
        assert(row.packets.length > 0 && row.packets.every(packet => packet.hitsDelta === 0 && packet.missesDelta === 1));
      }
      if (row.arm === "warm" && row.rung === "pattern") {
        assert(row.sources.length > 0, "warmth needs a real source receipt");
        assert(row.sources.every(source => source.kind === "retained_exact"), "warm source was not retained");
        assert(row.packets.length > 0 && row.packets.every(packet => packet.hitsDelta === 1 && packet.missesDelta === 0), "warm packets were not cached");
        const cold = receipt.rows.find(item => item.position === row.position && item.sample === row.sample && item.arm === "cold" && item.rung === "pattern");
        assert.deepEqual(row.sources[0].result.delivery.acquisition, cold.sources[0].result.delivery.acquisition, "warm source has a different acquisition");
        assert.deepEqual(row.packets.map(packet => packet.id), cold.packets.map(packet => packet.id), "warm packet identities changed");
      }
      if (row.state === "available") {
        assert.equal(row.response.delivery.rung, row.rung);
        assert.equal(row.response.delivery.rendered.sentence, row.deterministicSentence);
        if (row.arm.startsWith("voice_")) {
          const reason = {voice_absent:"provider_unavailable",voice_timeout:"deadline_exceeded",voice_refused:"refused"}[row.arm];
          assert.deepEqual(row.response.delivery.rendered.voice, row.arm === "voice_absent" ? {state:"not_requested"} : {state:"fallback",reason});
          const baseline = receipt.baselines.find(item => item.pairedArm === row.arm && item.sample === row.sample);
          assert(baseline && baseline.state === "available", "missing actual paired baseline");
          assert.equal(baseline.response.delivery.rendered.sentence, baseline.deterministicSentence);
          assert.equal(row.baselineSentence, baseline.deterministicSentence);
          assert.equal(row.deterministicSentence, row.baselineSentence, "voice altered deterministic bytes");
        }
      }
    }
  }
  assert.deepEqual(receipt.summary, summarize(receipt.rows), "summary does not derive from every row");
  return { rows: receipt.rows.length, cells: groups.size, samples: receipt.samples, mode: receipt.sampleMode, d7Discharged: false };
}
