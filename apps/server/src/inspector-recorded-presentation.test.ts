// Actual legacy report producer → recorded source factory → closed registered component.
// This prepares the complete Inspector2 migration; it is not a partial consumer/API cutover.
import { describe, expect, it } from "vitest";
import { attachEvidence, type EvidencePayload } from "@chess-tabiya/runtime";
import { StockfishEvidenceExecutor } from "./evidence-queue.js";
import { recordedComparisonFixture, RECORDED_COMPARISON_AT as at } from "../../../packages/runtime/src/testing/recorded-comparison-fixture.js";
import { collectInspectorRecordedPackets, type InspectorPacketProjection } from "../../../packages/runtime/src/inspector-packet-source.js";
import { recordedInspectorEvalOperands, recordedInspectorWdlOperands, recordedInspectorPvOperands,
  recordedInspectorTablebaseOperands, recordedInspectorTablebaseViewOperands } from "../../../packages/runtime/src/recorded-inspector-presentation.js";
import { componentValueSentence, factStatementOperand, parseComponentValue, type FactStatementRendererId } from "../../../packages/runtime/src/presentation-contract.js";
import { SYZYGY_TABLEBASE_CATEGORIES } from "../../../packages/runtime/src/provider-types.js";

const ready = (value: unknown) => ({ kind: "reported", value });
function component(renderer: FactStatementRendererId, operands: unknown) {
  const value = { id: "fact_statement" as const, operand: factStatementOperand(renderer, "recorded_run", "recorded-engine@1", operands as never) };
  expect(parseComponentValue(JSON.parse(JSON.stringify(value)))).toEqual(value);
  return { value, text: componentValueSentence(value) };
}
function source(payload: EvidencePayload, projection: InspectorPacketProjection, black = false) {
  const base = recordedComparisonFixture(black, "recorded-presentation"), node = base.mainPath[0]!;
  const run = attachEvidence(base.run, node.id, ["synthetic:recorded-presentation"], payload, at).run;
  const collection = collectInspectorRecordedPackets(run, base.main, node.id, projection);
  expect(collection.outcome.kind).toBe("available");
  return collection.occurrences[0]!.value;
}

describe("closed historical Inspector presentation from actual producer envelopes", () => {
  it.each([false, true].flatMap(black => (["eval", "wdl", "bestline"] as const).map(kind => ({ black, kind }))))("renders actual $kind producer output at the recorded position, black=$black", async ({ black, kind }) => {
    const f = recordedComparisonFixture(black), fen = f.mainPath[0]!.fen;
    const moves = black ? "e7e5 e2e4 g8f6" : "e2e4 e7e5 g1f3";
    const executor = new StockfishEvidenceExecutor({ execute: async () => [`info depth 12 score cp 34 wdl 350 400 250 pv ${moves}`, `bestmove ${moves.split(" ")[0]}`] }, "stockfish-analysis", 1);
    const payload = await executor.execute({ id: "job", runId: f.run.id, nodeId: f.mainPath[0]!.id, fen, kind, depth: 12 }, new AbortController().signal);
    const route = kind === "eval" ? "recorded.inspector.eval_packet@1" : kind === "wdl" ? "recorded.inspector.wdl_packet@1" : "recorded.inspector.pv_packet@1";
    const evidence = source(payload, route, black), before = JSON.stringify(evidence.payload);
    const result = kind === "eval" ? component("inspector.recorded_eval@1", recordedInspectorEvalOperands(evidence))
      : kind === "wdl" ? component("inspector.recorded_wdl@1", recordedInspectorWdlOperands(evidence))
        : component("inspector.recorded_pv@1", recordedInspectorPvOperands(evidence));
    if (kind === "eval") expect(result.text).toContain(`centipawn number ${black ? -34 : 34}`);
    if (kind === "wdl") expect(result.text).toContain("win 350/1000; draw 400/1000; loss 250/1000");
    if (kind === "bestline") {
      expect(payload.values).toHaveProperty("movesUci"); expect(payload.values).not.toHaveProperty("pv");
      expect(result.text).toContain(black ? "e5 e4 Nf6" : "e4 e5 Nf3"); expect(result.text).not.toContain("e2e4");
    }
    expect(result.text).toContain(kind === "wdl" ? "recorded numbers" : kind === "bestline" ? "historical" : "Historical");
    expect(result.text).not.toContain("undefined"); expect(JSON.stringify(evidence.payload)).toBe(before);
  });

  it.each([{}, { centipawns: 0, mateIn: 0 }, { centipawns: "not-a-number", mateIn: null, perspective: "learner" }, { centipawns: -31, mateIn: -3, perspective: "white" }])("keeps absent, zero, signed and unreadable evaluation fields: %j", values => {
    const evidence = source({ kind: "eval", source: "engine_validated", values }, "recorded.inspector.eval_packet@1");
    const operands = recordedInspectorEvalOperands(evidence), shown = component("inspector.recorded_eval@1", operands);
    if (!Object.hasOwn(values, "centipawns")) expect(operands.centipawns).toEqual({ kind: "not_recorded" });
    else if (typeof values.centipawns === "number") expect(operands.centipawns).toEqual(ready(values.centipawns));
    else expect(operands.centipawns).toEqual({ kind: "uninterpretable" });
    expect(shown.text).not.toContain("mating in");
  });

  it.each([{}, { pv: ["e2e4"] }, { movesUci: [] }, { movesUci: ["e2e4", "e2e5"] }, { movesUci: ["e2e4", 2] }, { movesUci: "e2e4" }])("keeps missing, empty and invalid entire recorded lines distinct: %j", values => {
    const evidence = source({ kind: "bestline", source: "engine_validated", values }, "recorded.inspector.pv_packet@1");
    const operands = recordedInspectorPvOperands(evidence), text = component("inspector.recorded_pv@1", operands).text;
    expect(operands.line.kind).toBe(!Object.hasOwn(values, "movesUci") ? "not_recorded" : Array.isArray(values.movesUci) && values.movesUci.length === 0 ? "reported" : "uninterpretable");
    if (operands.line.kind === "uninterpretable") expect(text).not.toContain(" e4"); // no legal-prefix laundering
    expect(text).not.toContain("e2e4");
  });

  it.each([{}, { win: 0, draw: 1000, loss: 0 }, { win: null, draw: 1001, loss: -1 }, { win: 999, draw: 0 }])("does not fill, normalize or grade historical WDL: %j", values => {
    const evidence = source({ kind: "wdl", source: "engine_validated", values }, "recorded.inspector.wdl_packet@1"), operands = recordedInspectorWdlOperands(evidence);
    component("inspector.recorded_wdl@1", operands);
    for (const key of ["win", "draw", "loss"] as const) {
      const value = (values as Record<string, unknown>)[key];
      expect(operands[key].kind).toBe(!Object.hasOwn(values, key) ? "not_recorded" : typeof value === "number" && value >= 0 && value <= 1000 ? "reported" : "uninterpretable");
    }
  });

  it.each(SYZYGY_TABLEBASE_CATEGORIES)("renders only the recorded category and signed/null fields for %s", category => {
    const payload = { kind: "tablebase" as const, source: "tablebase_exact" as const, values: { category, dtz: -7, preciseDtz: null, dtm: 0, pieceCount: 3 } };
    const evidence = source(payload, "recorded.inspector.tablebase_packet@1"), operands = recordedInspectorTablebaseOperands(evidence), text = component("inspector.recorded_tablebase@1", operands).text;
    expect(operands.dtz).toEqual(ready(-7)); expect(operands.preciseDtz).toEqual(ready(null)); expect(operands.dtm).toEqual(ready(0));
    expect(text).toContain("-7"); expect(text).toContain("without a distance value"); expect(text).not.toContain("fifty-move rule turns");
    for (const kind of ["category", "distance"] as const) {
      const view = source(payload, `derived.inspector.tablebase_${kind}@1`), fields = recordedInspectorTablebaseViewOperands(view);
      component(`inspector.recorded_tablebase_${kind}@1`, fields); expect(fields.category).toEqual(ready(category));
    }
  });

  it("does not render arbitrary attachment prose, engine labels or extra source values", () => {
    const evidence = source({ kind: "eval", source: "engine_validated", values: { centipawns: 0, prose: "SENTINEL_UNGROUNDED_TACTICAL_CLAIM", engineId: "secret-engine-label" } }, "recorded.inspector.eval_packet@1");
    const rendered = component("inspector.recorded_eval@1", recordedInspectorEvalOperands(evidence));
    expect(JSON.stringify(rendered)).not.toMatch(/SENTINEL|secret-engine/);
    expect(() => recordedInspectorEvalOperands({ ...evidence })).toThrow();
    expect(() => recordedInspectorWdlOperands(evidence)).toThrow();
  });

  it.each(["extra", "missing", "bad_state", "bad_number", "wrong_text"] as const)("rejects %s component/wire operands", fault => {
    const shown = component("inspector.recorded_eval@1", { reportSeq: 1, centipawns: ready(0), mateIn: { kind: "not_recorded" }, perspective: { kind: "not_recorded" } });
    const copy = JSON.parse(JSON.stringify(shown.value));
    if (fault === "extra") copy.operand.operands.prose = "caller sentence";
    if (fault === "missing") delete copy.operand.operands.centipawns;
    if (fault === "bad_state") copy.operand.operands.mateIn.kind = "not_reported";
    if (fault === "bad_number") copy.operand.operands.centipawns.value = 0.5;
    if (fault === "wrong_text") copy.operand.renderedText = "This is a brilliant move.";
    expect(() => parseComponentValue(copy)).toThrow();
  });
});
