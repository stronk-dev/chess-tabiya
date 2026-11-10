import { describe, expect, it } from "vitest";
import { attachEvidence } from "./evidence.js";
import { evidenceForConsumer, evidenceValueReceipt } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { parsePresentationReceipt, presentEvidenceItems, serializePresentedEvidence, presentationDigest } from "./presentation-contract.js";
import { invokeEvidenceValueRoute, readRecordedAnalyzeLineInvocation, evidenceValueRouteRegistry } from "./internal/evidence-value-routes.js";
import { collectRecordedAnalyzeLine, readRecordedAnalyzeLineSource } from "./recorded-analyze-line.js";
import { createDerivedReviewAnalysisTypedPvV1Evidence, createDerivedReviewAnalysisRecordedPvV1Evidence,
  createDerivedReviewAnalysisRecordedFirstV1Evidence } from "./evidence-factories.js";
import { attachDelivery, evaluationDelivery, importedRun, lineDelivery, mainPath, play, REVIEW_AT } from "./testing/review-evidence-fixture.js";

const routes = {
  typed: "derived.review.analysis_typed_pv@1",
  bestline: "derived.review.analysis_recorded_pv@1",
  first: "derived.review.analysis_recorded_first@1",
} as const;
const factories = { typed: createDerivedReviewAnalysisTypedPvV1Evidence,
  bestline: createDerivedReviewAnalysisRecordedPvV1Evidence, first: createDerivedReviewAnalysisRecordedFirstV1Evidence };
function fixture(arm: "typed" | "bestline" | "first" | "empty" | "absent" | "failed" | "unattributed", side: "white" | "black" = "white") {
  const fen = side === "white" ? undefined : "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  let run = play(importedRun(`analyze-factory-${arm}-${side}`, side, fen), side === "white" ? ["e2e4", "e7e5"] : ["e7e5", "g1f3"]);
  const [parent, child] = mainPath(run), pv = side === "white" ? ["d2d4", "d7d5"] : ["c7c5", "g1f3"];
  if (arm === "typed") run = attachDelivery(run, parent!.id, evaluationDelivery(parent!.fen, "cp 20"), lineDelivery(parent!.fen, pv));
  else if (arm !== "absent") run = attachEvidence(run, parent!.id, ["saved:factory-test"], {
    kind: arm === "first" || arm === "failed" ? "eval" : "bestline", source: "engine_validated",
    values: arm === "failed" ? { providerLineDelivery: null } : {
      ...(arm === "first" ? { bestMoveUci: pv[0]! } : { movesUci: arm === "empty" ? [] : pv }),
      ...(arm === "unattributed" ? {} : { engineId: "saved-engine", requestedDepth: 12 }),
    },
  }, REVIEW_AT).run;
  const source = collectRecordedAnalyzeLine(run, run.activeCursor.branchId, child!.id, new AbortController().signal);
  return { run, parent: parent!, child: child!, source, data: readRecordedAnalyzeLineSource(source) };
}

describe("accepted Analyze sole factories and registered renderers", () => {
  it("registers the exact three routes, so unknown-route rejection cannot fake negative controls", () => {
    const registered = evidenceValueRouteRegistry().map(row => row.route);
    for (const route of Object.values(routes)) expect(registered).toContain(route);
    expect(registered).not.toContain("derived.review.analysis_line@1");
  });
  it.each(["typed", "bestline", "first"] as const)("retains literal ordered original inputs of %s for both colours", arm => {
    for (const side of ["white", "black"] as const) {
      const f = fixture(arm, side), result = invokeEvidenceValueRoute(routes[arm], { source: f.source });
      expect(result.kind).toBe("available");
      if (result.kind !== "available") throw new Error("Actual positive did not mint");
      expect(result.value.payload).toEqual({ nodeId: f.child.id, entryNodeId: f.parent.id, operands: f.data.operands });
      expect(evidenceValueReceipt(result.value).factory).toBe(`createDerivedReviewAnalysis${arm === "typed" ? "TypedPv" : arm === "bestline" ? "RecordedPv" : "RecordedFirst"}V1Evidence`);
      expect(evidenceValueReceipt(result.value).sourceDigests).toEqual(f.data.inputs.map(value => evidenceValueReceipt(value).payloadDigest));
      expect(result.value.payload.operands.reviewedMove.side).toBe(side);
      expect(readRecordedAnalyzeLineInvocation(result.value).source).toBe(f.source);
      expect(readRecordedAnalyzeLineInvocation(result).source).toBe(f.source);
      const projection = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => `${row.id}@${row.version}` === routes[arm])!;
      expect(projection.grounding).toBe(arm === "typed" ? "declared_convention" : "recorded_run");
      expect(projection.answerContent).toEqual(arm === "first" ? ["move"] : ["move", "principal_variation"]);
    }
  });
  it.each(["typed", "bestline", "first"] as const)("round-trips %s through actual compiled Full2 presentation", arm => {
    const f = fixture(arm), result = invokeEvidenceValueRoute(routes[arm], { source: f.source });
    if (result.kind !== "available") throw new Error("Actual positive did not mint");
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [result.value]));
    expect(items).toHaveLength(1);
    const component = items[0]!.component;
    expect(component.id).toBe("fact_statement");
    if (component.id !== "fact_statement") throw new Error("Expected registered Analyze statement");
    expect(component.operand.rendererId).toBe(`review.analysis_${arm === "typed" ? "typed_pv" : arm === "bestline" ? "recorded_pv" : "recorded_first"}@1`);
    expect(component.operand.binding).toBe(arm === "typed" ? "declared_convention" : "recorded_run");
    expect(parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))))).toEqual(items);
    expect(JSON.stringify(component)).not.toMatch(/providerLineDelivery|rawUci|movesUci/);
    const wire = JSON.parse(JSON.stringify(serializePresentedEvidence(items)));
    wire.items[0].component.operand.text = "This is the best move.";
    expect(() => parsePresentationReceipt(wire)).toThrow();
  });
  it.each(["typed", "bestline", "first"] as const)("rejects another genuine Analyze renderer under the %s projection even with recomputed public digests", arm => {
    const issue = (selected: "typed" | "bestline" | "first") => {
      const f = fixture(selected), result = factories[selected]({ source: f.source });
      if (result.kind !== "available") throw new Error("Actual source did not mint");
      return serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST,
        { id: "module.full_inspector", version: 2 }, [result.value])));
    };
    const original = issue(arm);
    expect(parsePresentationReceipt(original)).toHaveLength(1);
    for (const other of (["typed", "bestline", "first"] as const).filter(other => other !== arm)) {
      const wire = JSON.parse(JSON.stringify(original)), foreign = issue(other);
      // Foreign component is itself genuine and valid. Keep the original adapter/evidence
      // projection and recompute every public presentation digest, not just stale hashes.
      wire.items[0].component = JSON.parse(JSON.stringify(foreign.items[0]!.component));
      const item = wire.items[0];
      item.componentDigest = presentationDigest("presentation.component@1", { evidenceRef: item.evidenceRef, adapter: item.adapter, component: item.component });
      wire.digest = presentationDigest("presentation.receipt@1", wire.items);
      expect(() => parsePresentationReceipt(wire)).toThrow("registered source semantics");
    }
  });

  it("keeps equal-valued derived reports tied to their separate original factory invocations", () => {
    const f = fixture("bestline"), first = factories.bestline({ source: f.source });
    if (first.kind !== "available" || f.data.event === null) throw new Error("Expected original bestline");
    const run = attachEvidence(f.run, f.parent.id, ["saved:second-original-occurrence"], f.data.event.data.payload, REVIEW_AT).run;
    const source = collectRecordedAnalyzeLine(run, run.activeCursor.branchId, f.child.id, new AbortController().signal);
    const second = factories.bestline({ source });
    if (second.kind !== "available") throw new Error("Expected second original bestline");
    expect(second.value.payload).toEqual(first.value.payload);
    expect(evidenceValueReceipt(second.value).inputDigest).not.toBe(evidenceValueReceipt(first.value).inputDigest);
    expect(evidenceValueReceipt(second.value).sourceDigests).not.toEqual(evidenceValueReceipt(first.value).sourceDigests);
    const a = readRecordedAnalyzeLineInvocation(first.value), b = readRecordedAnalyzeLineInvocation(second.value);
    expect(a.source).toBe(f.source); expect(b.source).toBe(source);
    expect(a.data.event).toBe(a.data.run.events[a.data.ordinal!]);
    expect(b.data.event).toBe(b.data.run.events[b.data.ordinal!]);
    expect(b.data.event!.seq).toBe(run.events.length); expect(b.data.event!.seq).not.toBe(a.data.event!.seq);
    expect(a.data.inputs[1]).toBe(a.data.packet); expect(b.data.inputs[1]).toBe(b.data.packet);
  });

  it("retains the exact original typed capture and all admitted SAN through its factory and renderer", () => {
    const f = fixture("typed"), result = factories.typed({ source: f.source });
    if (result.kind !== "available") throw new Error("Expected original typed PV");
    const original = JSON.stringify(f.run), invocation = readRecordedAnalyzeLineInvocation(result.value);
    expect(invocation.data).toBe(f.data); expect(invocation.data.inputs[2]).toBe(f.data.typed);
    expect(invocation.data.packet).toBe(f.data.packet);
    expect(invocation.data.event!.data.payload.kind).toBe("eval");
    const originalEvent = f.run.events.at(-1)!;
    if (originalEvent.type !== "evidence.attached") throw new Error("Expected original eval attachment");
    expect(invocation.data.event!.data.payload.values.providerLineDelivery).toEqual(originalEvent.data.payload.values.providerLineDelivery);
    const [item] = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [result.value]));
    if (item?.component.id !== "fact_statement" || f.data.operands?.kind !== "line") throw new Error("Expected whole typed statement");
    expect(item.component.operand.operands).toEqual(f.data.operands);
    expect((item.component.operand.operands as { line: readonly unknown[] }).line).toHaveLength(f.data.operands.line.length);
    expect(item.component.operand.renderedText).toContain("1. d4 d5");
    expect(JSON.stringify(item.component)).not.toMatch(/providerLineDelivery|bodyBase64|movesUci/);
    expect(JSON.stringify(f.run)).toBe(original);
  });
  it("admits truthful unattributed output without exposing its private moves", () => {
    const f = fixture("unattributed"), result = invokeEvidenceValueRoute(routes.bestline, { source: f.source });
    if (result.kind !== "available") throw new Error("Unattributed positive did not mint");
    expect(result.value.payload.operands).toMatchObject({ kind: "unattributed", reason: "engine_and_bound_unusable" });
    expect(JSON.stringify(result.value.payload)).not.toMatch(/movesUci|d4|d5|providerLineDelivery/);
    expect(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [result.value]))).toHaveLength(1);
  });
  it.each(["absent", "empty", "failed"] as const)("does not mint a line from the actual %s outcome", arm => {
    const f = fixture(arm), result = invokeEvidenceValueRoute(arm === "empty" ? routes.bestline : routes.typed, { source: f.source });
    expect(result).toEqual({ kind: "unavailable", reason: arm === "absent" ? "source_absent" : arm === "empty" ? "no_witness" : "source_contract_invalid" });
    expect(readRecordedAnalyzeLineInvocation(result).source).toBe(f.source);
  });
  it.each(["typed", "bestline", "first"] as const)("rejects genuine %s source at the other two factories", arm => {
    const f = fixture(arm);
    for (const route of Object.values(routes).filter(route => route !== routes[arm])) expect(() => invokeEvidenceValueRoute(route, { source: f.source })).toThrow();
  });
  it.each(["typed", "bestline", "first"] as const)("enforces the literal %s source arm in the sole factory itself, not only its dispatcher", arm => {
    const f = fixture(arm);
    expect(factories[arm]({ source: f.source }).kind).toBe("available");
    for (const other of (["typed", "bestline", "first"] as const).filter(other => other !== arm)) {
      expect(() => factories[other]({ source: f.source })).toThrow();
    }
  });
  it("rejects copied, serialized, inherited and data-only source/value wrappers", () => {
    const f = fixture("typed");
    for (const fake of [{ ...f.source }, JSON.parse(JSON.stringify(f.source)), Object.create(f.source), f.data]) expect(() => invokeEvidenceValueRoute(routes.typed, { source: fake })).toThrow();
    expect(() => invokeEvidenceValueRoute(routes.typed, { source: f.source, operands: { kind: "line" } } as never)).toThrow();
    const result = invokeEvidenceValueRoute(routes.typed, { source: f.source });
    if (result.kind !== "available") throw new Error("Actual positive did not mint");
    for (const fake of [{ ...result }, { ...result.value }, JSON.parse(JSON.stringify(result.value))]) expect(() => readRecordedAnalyzeLineInvocation(fake)).toThrow();
  });
});
