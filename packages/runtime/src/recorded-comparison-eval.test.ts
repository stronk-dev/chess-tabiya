import { describe, expect, it } from "vitest";
import { compareBranches } from "./compare.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceValueReceipt } from "./evidence-contract.js";
import { attachEvidence } from "./evidence.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { createRecordedComparisonSource } from "./recorded-comparison.js";
import { fork } from "./runtime.js";
import type { EvidenceAttachedEvent } from "./types.js";
import { recordedComparisonEvalFixture as fixture, recordedComparisonEvalPacket as packet } from "./testing/recorded-comparison-eval-fixture.js";
import { RECORDED_COMPARISON_AT as at } from "./testing/recorded-comparison-fixture.js";
import { recordedInspectorRun } from "./testing/recorded-inspector-fixture.js";

const ROUTE = "derived.compare.eval_delta@2";
function inputs(value = fixture(), before = 0, after = 1) {
  return { comparison: value.comparison, branchId: value.main, before: value.packets[before]!, after: value.packets[after]! };
}
const delta = (value = fixture(), before = 0, after = 1) => invokeEvidenceValueRoute(ROUTE, inputs(value, before, after));

describe("exact recorded comparison numerical differences", () => {
  it.each([false, true])("retains ordered original packets without color normalization, black=%s", black => {
    const value = fixture(undefined, black), saved = JSON.stringify(value.run), input = inputs(value), result = delta(value);
    expect(result.map(item => item.payload)).toEqual([{ before: 0, after: 150, delta: 150, plyOffset: 1,
      frame: "recorded_cp_numbers", comparability: "provider_not_established" }]);
    expect(evidenceValueReceipt(result[0]!).sourceDigests).toEqual([evidenceValueReceipt(input.before).payloadDigest, evidenceValueReceipt(input.after).payloadDigest]);
    expect(PRIMARY_EVIDENCE_MANIFEST.projections.find(projection => projection.id === "derived.compare.eval_delta" && projection.version === 2)).toMatchObject({ grounding: "recorded_run", exactness: "measured", confidence: "reported" });
    expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result[0]!.payload)).toBe(true);
    expect(JSON.stringify(value.run)).toBe(saved);
  });

  it.each([-151, -150, -149, 0, 149, 150, 151])("keeps the unchanged signed threshold: %s", amount => {
    const value = fixture([{ nodeIndex: 2, values: { centipawns: 17 } }, { nodeIndex: 3, values: { centipawns: 17 + amount } }]);
    expect(delta(value).map(item => item.payload.delta)).toEqual(Math.abs(amount) >= 150 ? [amount] : []);
  });

  it("orders by ply then original event order, not attachment arrival or caller order", () => {
    const value = fixture([{ nodeIndex: 4, values: { centipawns: 400 } }, { nodeIndex: 2, values: { centipawns: 0 } },
      { nodeIndex: 3, values: { centipawns: 200 } }, { nodeIndex: 3, values: { centipawns: 0 } }]);
    expect(delta(value, 1, 2)[0]!.payload.delta).toBe(200);
    expect(delta(value, 2, 3)[0]!.payload).toMatchObject({ delta: -200, plyOffset: 1 });
    expect(delta(value, 3, 0)[0]!.payload.delta).toBe(400);
    for (const [before, after] of [[1, 0], [2, 0], [3, 2], [1, 1]] as const) expect(delta(value, before, after)).toEqual([]);
    const old = invokeEvidenceValueRoute("derived.compare.eval_delta@1", { run: value.run, comparison: compareBranches(value.run, [value.main, value.peer]), branchId: value.main });
    expect(old.map(item => item.payload)).toEqual([[1, 2], [2, 3], [3, 0]].flatMap(([before, after]) => delta(value, before, after).map(item => ({ delta: item.payload.delta, plyOffset: item.payload.plyOffset }))));
  });

  it.each([{ mateIn: 3 }, { mateIn: -2 }, { mateIn: 0 }])("never skips a typed mate between cp neighbours: %s", values => {
    const value = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 3, values }, { nodeIndex: 4, values: { centipawns: 500 } }]);
    expect(delta(value, 0, 1)).toEqual([]); expect(delta(value, 1, 2)).toEqual([]); expect(delta(value, 0, 2)).toEqual([]);
  });

  it.each([{}, { centipawns: "200" }, { centipawns: 200.1 }, { centipawns: Number.MAX_SAFE_INTEGER + 1 }])("does not interpret malformed cp and preserves predecessor trail exclusion: %s", values => {
    const value = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 3, values }, { nodeIndex: 4, values: { centipawns: 500 } }]);
    expect(delta(value, 0, 1)).toEqual([]); expect(delta(value, 1, 2)).toEqual([]);
    expect(delta(value, 0, 2)[0]!.payload.delta).toBe(500);
  });

  it("abstains on unsafe subtraction without truncation, and keeps cp-first historical decoding", () => {
    const overflow = fixture([{ nodeIndex: 2, values: { centipawns: -Number.MAX_SAFE_INTEGER } }, { nodeIndex: 3, values: { centipawns: Number.MAX_SAFE_INTEGER } }]);
    expect(delta(overflow)).toEqual([]);
    const dual = fixture([{ nodeIndex: 2, values: { centipawns: 0, mateIn: 2 } }, { nodeIndex: 3, values: { centipawns: 200, mateIn: -2 } }]);
    expect(delta(dual)[0]!.payload.delta).toBe(200);
  });

  it("does not promote other report labels into the engine-labelled trail", () => {
    const value = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 3, values: { centipawns: 200 }, source: "tablebase_exact" }, { nodeIndex: 4, values: { centipawns: 400 } }]);
    expect(delta(value, 0, 1)).toEqual([]); expect(delta(value, 0, 2)[0]!.payload.delta).toBe(400);
  });

  it("checks complete source/head, both path memberships and full event identity before empty shortcuts", () => {
    const value = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 3, values: { mateIn: 3 } }]);
    const foreign = fixture(undefined, false, "foreign-run"), input = inputs(value);
    for (const after of [foreign.packets[1]!, { ...input.after }]) expect(() => invokeEvidenceValueRoute(ROUTE, { ...input, after })).toThrow();
    expect(() => invokeEvidenceValueRoute(ROUTE, { ...input, comparison: { ...value.comparison } })).toThrow();
    expect(() => invokeEvidenceValueRoute(ROUTE, { ...input, branchId: "unknown" })).toThrow();
    const extra = { ...input, delta: 200 };
    expect(() => invokeEvidenceValueRoute(ROUTE, extra)).toThrow();
    const later = attachEvidence(value.run, value.shared.id, ["synthetic:later"], { kind: "eval", source: "engine_validated", values: { centipawns: 9 } }, at).run;
    const updated = createRecordedComparisonSource({ run: later, columns: value.columns });
    expect(() => invokeEvidenceValueRoute(ROUTE, { ...input, comparison: updated })).toThrow();
    const changed = structuredClone(value.run.events.at(-1)!);
    if (changed.type !== "evidence.attached") throw new Error("fixture event");
    const crossed = packet(later, changed, value.main);
    expect(() => invokeEvidenceValueRoute(ROUTE, { ...input, after: crossed })).toThrow();
  });

  it("does not accept same-node foreign columns or reports outside the granted span", () => {
    const value = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 2, values: { centipawns: 200 } }]), input = inputs(value);
    const otherColumn = packet(value.run, value.events[1]!, value.peer);
    expect(() => invokeEvidenceValueRoute(ROUTE, { ...input, after: otherColumn })).toThrow();
    const earlier = fixture([{ nodeIndex: 1, values: { centipawns: 0 } }, { nodeIndex: 2, values: { centipawns: 200 } }]);
    expect(() => delta(earlier)).toThrow();
    const later = fixture(), shortened = createRecordedComparisonSource({ run: later.run, columns: [{ branchId: later.main, throughNodeId: later.shared.id }, later.columns[1]] });
    expect(() => invokeEvidenceValueRoute(ROUTE, { ...inputs(later), comparison: shortened })).toThrow();
  });

  it("permits repeated reports at a zero-edge fork and retains each original occurrence", () => {
    const value = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 2, values: { centipawns: 200 } }, { nodeIndex: 2, values: { centipawns: 0 } }]);
    const comparison = createRecordedComparisonSource({ run: value.run, columns: [
      { branchId: value.main, throughNodeId: value.shared.id }, { branchId: value.peer, throughNodeId: value.shared.id },
    ] });
    const result = invokeEvidenceValueRoute(ROUTE, { ...inputs(value), comparison });
    expect(result[0]!.payload).toMatchObject({ delta: 200, plyOffset: 0 });
    const reverse = delta(value, 1, 2)[0]!;
    expect(reverse.payload.delta).toBe(-200);
    expect(evidenceValueReceipt(result[0]!).inputDigest).not.toBe(evidenceValueReceipt(delta(value)[0]!).inputDigest);
    expect(evidenceValueReceipt(reverse).sourceDigests).toEqual([evidenceValueReceipt(value.packets[1]!).payloadDigest, evidenceValueReceipt(value.packets[2]!).payloadDigest]);
  });

  it("includes the unchanged peer endpoint in authority even when the numerical payload stays equal", () => {
    const value = fixture(), before = delta(value)[0]!;
    const comparison = createRecordedComparisonSource({ run: value.run, columns: [value.columns[0], { branchId: value.peer, throughNodeId: value.shared.id }] });
    const after = invokeEvidenceValueRoute(ROUTE, { ...inputs(value), comparison })[0]!;
    expect(after.payload).toEqual(before.payload);
    expect(evidenceValueReceipt(after).inputDigest).not.toBe(evidenceValueReceipt(before).inputDigest);
    const copy = structuredClone(value.run), copiedComparison = createRecordedComparisonSource({ run: copy, columns: value.columns });
    expect(invokeEvidenceValueRoute(ROUTE, { ...inputs(value), comparison: copiedComparison })[0]!.payload).toEqual(before.payload);
  });

  it("admits real root-only attempts without fabricating an incoming edge", () => {
    let run = recordedInspectorRun();
    const main = run.activeCursor.branchId, root = run.activeCursor.nodeId;
    run = fork(run, root, { at }).run;
    const peer = run.activeCursor.branchId, events: EvidenceAttachedEvent[] = [];
    for (const centipawns of [0, 200]) {
      run = attachEvidence(run, root, ["synthetic:root-report"], { kind: "eval", source: "engine_validated", values: { centipawns } }, at).run;
      events.push(run.events.at(-1)! as EvidenceAttachedEvent);
    }
    const comparison = createRecordedComparisonSource({ run, columns: [{ branchId: main, throughNodeId: root }, { branchId: peer, throughNodeId: root }] });
    for (const branchId of [main, peer]) {
      const result = invokeEvidenceValueRoute(ROUTE, { comparison, branchId, before: packet(run, events[0]!, branchId), after: packet(run, events[1]!, branchId) });
      expect(result[0]!.payload).toMatchObject({ before: 0, after: 200, delta: 200, plyOffset: 0 });
    }
  });

  it("retains distinct equal-valued occurrences and does not freeze or retain mutable caller arguments", () => {
    const value = fixture([0, 200, 0, 200].map(centipawns => ({ nodeIndex: 2, values: { centipawns } })));
    const input = inputs(value), result = invokeEvidenceValueRoute(ROUTE, input), receipt = evidenceValueReceipt(result[0]!);
    const later = delta(value, 2, 3)[0]!;
    expect(later.payload).toEqual(result[0]!.payload);
    expect(evidenceValueReceipt(later).inputDigest).not.toBe(receipt.inputDigest);
    expect(evidenceValueReceipt(later).sourceDigests).not.toEqual(receipt.sourceDigests);
    expect(Object.isFrozen(input)).toBe(false);
    input.branchId = "caller-changed-branch"; input.before = value.packets[3]!;
    expect(evidenceValueReceipt(result[0]!)).toEqual(receipt);
    expect(result[0]!.payload).toMatchObject({ before: 0, after: 200, delta: 200 });
    expect(() => invokeEvidenceValueRoute(ROUTE, input)).toThrow();
  });

  it("does not borrow a same-FEN peer report or accept the same-sequence report from a different complete head", () => {
    const value = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 3, values: { centipawns: 200 }, column: "peer" }]);
    expect(() => delta(value)).toThrow();
    const first = fixture(), second = fixture([{ nodeIndex: 2, values: { centipawns: 0 } }, { nodeIndex: 3, values: { centipawns: 201 } }]);
    expect(first.run.id).toBe(second.run.id); expect(first.events[1]!.seq).toBe(second.events[1]!.seq);
    expect(first.mainPath[3]!.fen).toBe(second.mainPath[3]!.fen);
    expect(() => invokeEvidenceValueRoute(ROUTE, { ...inputs(first), after: second.packets[1]! })).toThrow();
  });
});
