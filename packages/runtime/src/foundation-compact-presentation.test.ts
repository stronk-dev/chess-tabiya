import { describe, expect, it } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { collectFoundationEdgeEvents, type FoundationEdgeSourceRef } from "./foundation-edge-source.js";
import { FOUNDATION_COMPACT_STATEMENTS, FOUNDATION_COMPACT_FACT_RENDERERS } from "./foundation-edge-presentation.js";
import { PRIMARY_EVIDENCE_MANIFEST, MODULE_CONSUMER_ACCEPTS } from "./evidence-catalog.js";
import { evidenceForConsumer, identitySealedEvidenceWithoutValueReceipt } from "./evidence-contract.js";
import { canonicalFen, positionFromFen } from "./position-cache.js";
import { hasPostcommitChangeWitness } from "./postcommit-nudge.js";
import { isNativeFactSummary, presentedNativeFactReport, factStatementOperand, parsePresentationReceipt, presentEvidenceItems, presentedSentence, serializePresentedEvidence, presentationAdapter, presentationDigest } from "./presentation-contract.js";
import { modulePresentationBundleCost } from "./module-query.js";

const fixtures = [
  ["rules.structural.event.king_opposition@2", "r7/8/8/8/8/4k3/8/4K3 b - - 0 1", "a8a7"],
  ["rules.structural.event.backward_pawn@2", "7k/4p3/4p3/8/3P4/8/8/7K w - - 0 1", "d4d5"],
  ["derived.structural.event.pawn_file_group@1", "7k/8/8/8/8/8/PP1P4/7K w - - 0 1", "a2a3"],
  ["rules.transition.event.slider_ray@2", "4k3/8/8/8/8/8/B7/R3K3 w - - 0 1", "a2b3"],
  ["derived.activity.event.file_state@1", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
  ["derived.activity.event.file_access_revealed@1", "7k/8/8/8/8/2n5/1P6/1R5K w - - 0 1", "b2c3"],
  ["rules.structural.event.pawn_islands@2", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3"],
] as const;
function sources(route: FoundationEdgeSourceRef, fen: string, uci: string) {
  const before = positionFromFen(fen), beforeFen = canonicalFen(before), move = normalizeMove(before, parseUci(uci)!);
  expect(before.isLegal(move)).toBe(true); before.play(move);
  const values = collectFoundationEdgeEvents({ beforeFen, moveUci: uci, afterFen: canonicalFen(before) }, [route]);
  expect(values.length).toBeGreaterThan(0); return values.map(value => value.evidence);
}
const source = (route: FoundationEdgeSourceRef, fen: string, uci: string) => sources(route, fen, uci)[0]!;

describe("seven current compact Nudge/Review pairs", () => {
  it.each(fixtures)("%s retains full original source in both exact ordinary pairs", (route, fen, uci) => {
    const value = source(route, fen, uci), [renderer] = FOUNDATION_COMPACT_STATEMENTS[route];
    expect(hasPostcommitChangeWitness(value)).toBe(true);
    const resealed = identitySealedEvidenceWithoutValueReceipt(value.producer, value.projection, value.payload);
    expect(() => hasPostcommitChangeWitness(resealed)).toThrow();
    for (const id of ["postcommit_nudge", "review_map"] as const) {
      expect(MODULE_CONSUMER_ACCEPTS[id]).toContainEqual(value.projection);
      const consumer = { id: `module.${id}`, version: 2 };
      const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, consumer, [value]));
      expect(items).toHaveLength(1);
      const item = items[0]!;
      expect(item.component.id).toBe("fact_statement"); if (item.component.id !== "fact_statement") throw Error("Expected compact statement");
      expect(item.component.operand.rendererId).toBe(renderer);
      const sentence = presentedSentence(item);
      const full = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [value]))[0]!;
      expect(isNativeFactSummary(item)).toBe(true);
      expect(presentedNativeFactReport(item)).toMatchObject({ kind: "available", sentence: presentedSentence(full), limit: 400 });
      expect(presentedNativeFactReport(full)).toBeNull();
      expect(() => presentedNativeFactReport({ ...item })).toThrow(/UNSEALED/u);
      expect(sentence).toMatch(/^After /); expect(sentence).not.toMatch(/membership_changed|half_open_|distant_three|count_gained|beforeFen|afterFen|strictInterior/);
      const cost = modulePresentationBundleCost(items);
      expect(cost.facts).toBe(1); expect(cost.words).toBeLessThanOrEqual(40); expect(cost.marks).toBe(0); expect(cost.arrows).toBe(0);
      const operands: Record<string, unknown> = { ...item.component.operand.operands };
      const { san: _san, ...complete } = operands;
      expect(complete).toEqual(value.payload);
      const wire = serializePresentedEvidence(items);
      const received = parsePresentationReceipt(wire);
      expect(received.map(presentedSentence)).toEqual([sentence]);
      expect(presentedNativeFactReport(received[0]!)).toEqual(presentedNativeFactReport(item));
      // Mutated complete edges and unexpected receipt fields are both refused.
      const tampered = structuredClone(wire);
      const changed = structuredClone(operands) as Record<string, unknown>;
      changed.beforeFen = "7k/8/8/8/8/8/8/K7 w - - 99 99";
      expect(() => factStatementOperand(renderer, "declared_convention", FOUNDATION_COMPACT_STATEMENTS[route][1], changed as never)).toThrow();
      expect(() => parsePresentationReceipt({ ...tampered, extraSource: true })).toThrow();
    }
    const details = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [value]));
    expect(details).toHaveLength(1);
    expect(presentedSentence(details[0]!)).not.toBe(presentedSentence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, [value]))[0]!));
  });

  it("retains same-flag membership changes as a bounded group caption without claiming a new isolated/doubled flag", () => {
    const value = source("derived.structural.event.pawn_file_group@1", "7k/8/8/8/8/8/PP1P4/7K w - - 0 1", "a2a3");
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, [value]));
    expect(presentedSentence(items[0]!)).toBe("After a3, White's a-file pawn group changed.");
    expect(presentedSentence(items[0]!)).not.toMatch(/isolated|doubled|pawns, front to rear/);
  });

  it("describes null groups as arrival/removal rather than attributing flags to absent pawns", () => {
    const values = sources("derived.structural.event.pawn_file_group@1", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3");
    const lines = values.map(value => presentedSentence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, [value]))[0]!));
    expect(lines).toEqual(["After bxc3, White's b-file pawn group disappeared.", "After bxc3, White's c-file pawn group appeared."]);
    const last = source("derived.structural.event.pawn_file_group@1", "7k/P7/8/8/8/8/8/7K w - - 0 1", "a7a8q");
    expect(presentedSentence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, [last]))[0]!))
      .toBe("After a8=Q+, White's a-file pawn group disappeared.");
    const retained = source("derived.structural.event.pawn_file_group@1", "7k/P7/P7/8/8/8/8/7K w - - 0 1", "a7a8q");
    expect(presentedSentence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, [retained]))[0]!))
      .toBe("After a8=Q+, White's a-file pawns are no longer doubled.");
  });

  it("names the original pawn when promotion creates a current slider ray", () => {
    const value = source("rules.transition.event.slider_ray@2", "8/P7/7k/8/8/8/8/7K w - - 0 1", "a7a8q");
    const line = presentedSentence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, [value]))[0]!);
    expect(line).toContain("the original White pawn on a7"); expect(line).toContain("ray appeared");
  });

  it("rejects a change to an undisplayed full-source operand even after every presentation checksum is rebuilt", () => {
    const value = source("rules.structural.event.pawn_islands@2", "7k/8/8/8/8/2n5/1P6/7K w - - 0 1", "b2c3");
    const items = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.postcommit_nudge", version: 2 }, [value]));
    const wire = structuredClone(serializePresentedEvidence(items));
    const first = wire.items[0]!; if (first.component.id !== "fact_statement") throw Error("Expected compact fact");
    const original = first.component.operand;
    const parsed = FOUNDATION_COMPACT_FACT_RENDERERS["play.pawn_island_topology_change@1"].parse(original.operands, "Original complete island operands");
    const operands = { ...parsed, before: parsed.before.map((row, index) => index === 0 ? { ...row, pawns: ["b4" as const, ...row.pawns.slice(1)] } : row) };
    // Same file partition/count, and the compact caption stays identical.
    const changed = factStatementOperand("play.pawn_island_topology_change@1", original.binding, original.convention, operands);
    expect(changed.renderedText).toBe(original.renderedText);
    const component = { ...first.component, operand: changed };
    const body = { evidenceRef: first.evidenceRef, adapter: first.adapter, component };
    const changedItems = [{ ...body, componentDigest: presentationDigest("presentation.component@1", body) }];
    const received = { ...wire, items: changedItems, digest: presentationDigest("presentation.receipt@1", changedItems) };
    expect(() => parsePresentationReceipt(received)).toThrow(/original complete source reference/);
  });

  it("has all fourteen exact current adapters and admits no retired edge/avoidance source in either ordinary consumer", () => {
    const retired = new Set(["rules.structural.event.backward_pawn@1", "rules.structural.event.king_opposition@1", "rules.structural.event.pawn_islands@1",
      "rules.structural.event.isolated_pawn@1", "rules.structural.event.doubled_pawn@1", "rules.structural.event.open_file@1", "rules.structural.event.half_open_file@1",
      "rules.structural.event.line_blockers@1", "rules.transition.event.slider_ray@1"]);
    for (const module of ["postcommit_nudge", "review_map"] as const) {
      const consumer = { id: `module.${module}`, version: 2 };
      for (const route of Object.keys(FOUNDATION_COMPACT_STATEMENTS)) {
        const [id, version] = route.split("@"); expect(presentationAdapter(consumer, { id: id!, version: Number(version) })).toBeDefined();
      }
      for (const projection of MODULE_CONSUMER_ACCEPTS[module]) {
        expect(retired.has(`${projection.id}@${projection.version}`)).toBe(false);
        expect(projection.id.startsWith("derived.semantic_avoidance.")).toBe(false);
      }
    }
  });
});
