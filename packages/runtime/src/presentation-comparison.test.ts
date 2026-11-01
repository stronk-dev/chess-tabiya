import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { PLAY_FACT_RENDERERS } from "./presentation-play-adapters.js";
import { parsePresentationReceipt, presentEvidenceItems, presentedSentence, serializePresentedEvidence } from "./presentation-contract.js";
import { recordedComparisonPointFixture as fixture } from "./testing/recorded-comparison-point-fixture.js";

describe("current Compare rendering and strict receiving", () => {
  it.each(["cp 25", "mate 3", "mate -3"])("round-trips the actual point operands without replacing mate by cp: %s", score => {
    const f = fixture(false, score), result = invokeEvidenceValueRoute("derived.compare.engine_trajectory@2", { comparisonPoint: f.source });
    if (result.kind !== "available") throw new Error("Expected genuine point");
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.compare_coach", version: 2 }, [result.value]));
    const received = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))));
    expect(received).toHaveLength(1);
    expect(received[0]!.component.id).toBe("fact_statement");
    if (received[0]!.component.id !== "fact_statement") throw new Error("Expected point statement");
    expect(received[0]!.component.operand).toMatchObject({ rendererId: "compare.engine_point@2", operands: result.value.payload });
    expect(presentedSentence(received[0]!)).toContain("requested depth 12");
    expect(presentedSentence(received[0]!)).toContain("stockfish-analysis 19");
    expect(presentedSentence(received[0]!)).not.toMatch(/undefined|NaN|best move|blunder|mistake/u);
  });
  it.each(["extra", "scalar_mate", "reached_depth", "missing_instrument", "nan", "wrong_profile"])("refuses malformed or widened point operands: %s", fault => {
    const f = fixture(), result = invokeEvidenceValueRoute("derived.compare.engine_trajectory@2", { comparisonPoint: f.source });
    if (result.kind !== "available") throw new Error("Expected genuine point");
    const payload: any = structuredClone(result.value.payload);
    if (fault === "extra") payload.grade = "good";
    if (fault === "scalar_mate") payload.whiteScore = { kind: "centipawns", value: "mate 3" };
    if (fault === "reached_depth") payload.bound = { kind: "depth", reachedDepth: 35 };
    if (fault === "missing_instrument") delete payload.instrument;
    if (fault === "nan") payload.whiteScore.value = NaN;
    if (fault === "wrong_profile") payload.instrument = { origin: "offline_engine", engineVersion: "1", profile: { threads: 1, hashMb: 16, multiPv: 2 } };
    expect(() => PLAY_FACT_RENDERERS["compare.engine_point@2"].parse(payload, "point")).toThrow();
  });
  it("states the exact recorded-number difference and refuses fabricated arithmetic or stronger claims", () => {
    const renderer = PLAY_FACT_RENDERERS["compare.recorded_delta@2"];
    const input = { before: -25, after: 175, delta: 200, plyOffset: 1, frame: "recorded_cp_numbers", comparability: "provider_not_established" };
    const parsed = renderer.parse(input, "difference"), text = renderer.render(parsed);
    expect(text).toContain("-25 to 175"); expect(text).toContain("not established"); expect(text).toContain("not a move grade");
    expect(() => renderer.render(renderer.parse({ ...input, delta: 201 }, "difference"))).toThrow();
    expect(() => renderer.parse({ ...input, comparability: "same_engine" }, "difference")).toThrow();
    expect(() => renderer.parse({ ...input, bestMove: "e2e4" }, "difference")).toThrow();
  });
  it("D3898 refuses cross-origin node budgets and zero mates on the actual wire receiver", () => {
    const f = fixture(false, "cp 25", { bound: { kind: "nodes", requestedNodes: 2048 } });
    const result = invokeEvidenceValueRoute("derived.compare.engine_trajectory@2", { comparisonPoint: f.source });
    if (result.kind !== "available") throw new Error("Expected genuine point");
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.compare_coach", version: 2 }, [result.value]));
    const wire = JSON.parse(JSON.stringify(serializePresentedEvidence(items)));
    const offline = structuredClone(wire);
    offline.items[0].component.operand.operands.instrument = { origin: "offline_engine", engineVersion: "1", profile: { threads: 1, hashMb: 16, multiPv: 1 } };
    expect(() => parsePresentationReceipt(offline)).toThrow(/offline analysis/u);
    const zero = structuredClone(wire);
    zero.items[0].component.operand.operands.whiteScore = { kind: "mate", side: "white", distance: 0, unit: "moves" };
    expect(() => parsePresentationReceipt(zero)).toThrow(/positive/u);
    const generation = structuredClone(wire);
    generation.items[0].component.operand.operands.instrument.generation = 0;
    expect(() => parsePresentationReceipt(generation)).toThrow(/positive/u);
    expect(() => parsePresentationReceipt(wire)).not.toThrow();
  });
});
