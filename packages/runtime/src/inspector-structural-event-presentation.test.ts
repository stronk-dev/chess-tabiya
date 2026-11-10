import { describe, expect, it } from "vitest";
import { STRUCTURAL_EVENT_FAMILIES, PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { collectInspectorLocalEdge, type InspectorLocalProjection } from "./inspector-local-source.js";
import { parseInspectorStructuralBeforeAfterOperands as parse } from "./inspector-structural-event-presentation.js";
import { inspectorFixtureEdges } from "./testing/inspector-presentation-fixture.js";
import { recordedSequenceWindowFixture } from "./testing/recorded-sequence-window-fixture.js";
import { evidenceForConsumer, type DeclaredEvidence } from "./evidence-contract.js";
import { presentEvidenceItems, serializePresentedEvidence, parsePresentationReceipt, presentedSentence, presentationAdapter } from "./presentation-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { makeSan } from "chessops/san";
import { parseUci } from "chessops/util";
import { positionFromFen } from "./chess.js";
import type { SliderMembershipChange } from "./foundation-slider-sources.js";

const currentFamilies = ["king_zone", "passed_pawn", "piece_count", "direct_attack_count"] as const;
const ref = (family: string) => `rules.structural.event.${family}@1` as InspectorLocalProjection;
const values = (family: string) => inspectorFixtureEdges().flatMap(edge => collectInspectorLocalEdge(ref(family), edge).values);
const present = (value: ReturnType<typeof values>[number]) => presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 2 }, [value]));
describe("D4060 original structural events through the actual Inspector presentation", () => {
  it("pins genuine appearances, disappearances, changed positive counts and zero blockers in the source cohort", () => {
    type Event = { family: string; before: { count?: number; squares: readonly string[] } | null; after: { count?: number; squares: readonly string[] } | null };
    const events = currentFamilies.flatMap(family => values(family).map(value => value.payload as Event));
    expect(events.some(event => event.before === null && event.after !== null)).toBe(true);
    expect(events.some(event => event.before !== null && event.after === null)).toBe(true);
    expect(events.some(event => event.before?.count !== undefined && event.after?.count !== undefined && event.before.count > 0 && event.after.count > 0 && event.before.count !== event.after.count)).toBe(true);
    const rays = inspectorFixtureEdges().flatMap(edge => collectInspectorLocalEdge("rules.transition.event.slider_ray@2", edge).values.map(value => value.payload as SliderMembershipChange));
    const zeroRay = rays.find(event => event.before?.blockers.length === 0 || event.after?.blockers.length === 0);
    expect(zeroRay).toBeDefined();
    const observation = zeroRay!.before?.blockers.length === 0 ? zeroRay!.before! : zeroRay!.after!;
    expect(observation.blockers).toEqual([]); expect(observation.slider.square).not.toBe(observation.endpoint);
  });
  it.each(currentFamilies)("preserves every original %s operand, with genuine null/held/count states", family => {
    const source = values(family);
    expect(source.length).toBeGreaterThan(0);
    for (const value of source) {
      const payload = value.payload as { before_fen: string; move_uci: string; family: string; before: unknown; after: unknown };
      const items = present(value);
      expect(items).toHaveLength(1);
      expect(items[0]!.component).toMatchObject({ id: "fact_statement", operand: {
        rendererId: "inspector.structural_before_after@1", binding: "declared_convention",
        convention: ["backward_pawn", "king_opposition"].includes(family) ? "pawn-structure@1" : "board-rules@1",
        operands: { san: makeSan(positionFromFen(payload.before_fen), parseUci(payload.move_uci)!), family, before: payload.before, after: payload.after },
      } });
      expect(parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))))).toEqual(items);
      expect(presentedSentence(items[0]!)).not.toMatch(/undefined|NaN|best move|safe|improved/u);
    }
  });

  it.each([false, true])("keeps original moving king squares while joining the same color/zone, mirrored=%s", black => {
    const run = recordedSequenceWindowFixture({ fen: "7k/p7/8/8/8/8/8/K7 w - - 0 1", moves: ["a1b1"] }, black);
    const edge = { beforeFen: run.nodes[0]!.fen, afterFen: run.nodes[1]!.fen, moveUci: run.nodes[1]!.moveUci! };
    const source = collectInspectorLocalEdge(ref("king_zone"), edge).values;
    const moved = source.find(value => {
      const p = value.payload as { before: { zone: string; color: string } | null; after: unknown };
      return p.before?.zone === "edge" && p.before.color === (black ? "black" : "white") && p.after !== null;
    });
    expect(moved).toBeDefined();
    const component = present(moved!)[0]!.component;
    if (component.id !== "fact_statement" || component.operand.rendererId !== "inspector.structural_before_after@1") throw Error("Wrong registered statement");
    const operands = component.operand.operands;
    expect(operands.before!.squares).toEqual([black ? "a8" : "a1"]);
    expect(operands.after!.squares).toEqual([black ? "b8" : "b1"]);
    for (const changed of [{ ...operands.after!, color: black ? "white" : "black" }, { ...operands.after!, zone: "corner" }]) {
      expect(() => parse({ ...operands, after: changed })).toThrow();
    }
  });

  it("retains all twelve color/role states including measured zero, while unchanged current islands emit no event", () => {
    const run = recordedSequenceWindowFixture({ fen: "7k/p7/8/8/8/8/8/K7 w - - 0 1", moves: ["a1b1"] });
    const edge = { beforeFen: run.nodes[0]!.fen, afterFen: run.nodes[1]!.fen, moveUci: run.nodes[1]!.moveUci! };
    const counts = collectInspectorLocalEdge(ref("piece_count"), edge).values;
    expect(counts).toHaveLength(12);
    expect(counts.filter(value => (value.payload as { before: { count: number } }).before.count === 0)).toHaveLength(9);
    for (const value of counts) expect(present(value)).toHaveLength(1);
    expect(collectInspectorLocalEdge("rules.structural.event.pawn_islands@2", edge).values).toEqual([]);
    expect(() => collectInspectorLocalEdge(ref("piece_count"), { ...edge, moveUci: "a1a8" }).values).toThrow();
    expect(() => collectInspectorLocalEdge(ref("piece_count"), { ...edge, afterFen: edge.beforeFen }).values).toThrow();
  });

  it.each([false, true])("current island change retains an actual zero partition, mirrored=%s", black => {
    const run = recordedSequenceWindowFixture({ fen: "7k/8/8/1p6/2B5/8/8/7K w - - 0 1", moves: ["c4b5"] }, black);
    const edge = { beforeFen: run.nodes[0]!.fen, afterFen: run.nodes[1]!.fen, moveUci: run.nodes[1]!.moveUci! };
    const values = collectInspectorLocalEdge("rules.structural.event.pawn_islands@2", edge).values;
    expect(values).toHaveLength(1);
    expect(values[0]!.payload).toMatchObject({ color: black ? "white" : "black", sign: "count_lost", beforeCount: 1, afterCount: 0, after: [] });
    const items = present(values[0]!);
    expect(items).toHaveLength(1); expect(presentedSentence(items[0]!)).toContain("After: 0, no islands");
    expect(parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(items))))).toEqual(items);
  });

  it("refuses all eight retired structural current-door tuples and executable value routes", () => {
    const edge = inspectorFixtureEdges()[0]!;
    for (const family of ["backward_pawn", "king_opposition", "pawn_islands", "doubled_pawn", "isolated_pawn", "open_file", "half_open_file", "line_blockers"] as const) {
      const projection = `rules.structural.event.${family}@1` as const;
      expect(() => collectInspectorLocalEdge(projection as InspectorLocalProjection, edge).values).toThrow(/Unsupported/);
      expect(() => invokeEvidenceValueRoute(projection as never, edge as never)).toThrow(/Unknown evidence value route/);
      expect(presentationAdapter({ id: "module.full_inspector", version: 2 }, { id: `rules.structural.event.${family}`, version: 1 })).toBeUndefined();
    }
  });

  it("refuses malformed complete operands and crossed source statements rather than silently dropping fields", () => {
    const component = present(values("piece_count")[0]!)[0]!.component;
    if (component.id !== "fact_statement" || component.operand.rendererId !== "inspector.structural_before_after@1") throw Error("Wrong registered statement");
    const original = component.operand.operands;
    for (const after of [{ ...original.after!, count: -1 }, { ...original.after!, count: 0.5 }, { ...original.after!, count: undefined }, { ...original.after!, extra: true }, { ...original.after!, role: original.after!.role === "bishop" ? "knight" : "bishop" }, { ...original.after!, squares: ["a1"] }]) {
      expect(() => parse({ ...original, after })).toThrow();
    }
    expect(() => parse({ ...original, before: null, after: null })).toThrow();
    expect(() => parse({ ...original, family: "passed_pawn" })).toThrow();
    const adapter = presentationAdapter({ id: "module.full_inspector", version: 2 }, { id: "rules.structural.event.piece_count", version: 1 })!;
    const item = present(values("piece_count")[0]!)[0]!;
    expect(() => adapter.validateWireComponent!({ ...component, operand: { ...component.operand, convention: "pawn-structure@1" } }, item.evidenceRef!)).toThrow();
    for (const count of [0, -1, 1.5]) expect(() => parse({ san: "e4", family: "direct_attack_count", before: null, after: { kind: "direct_attack_count", color: "white", squares: ["a1"], count } })).toThrow();
  });
});
