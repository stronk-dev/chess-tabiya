// D3309/D3654: actual own-FEN sources through the exact compiler and component receipt.
// Fidelity to the existing collector is not independent chess-semantic qualification.
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceForConsumer, type DeclaredEvidence } from "./evidence-contract.js";
import { RUNTIME_EVIDENCE_CONSUMER_OPERATIONS } from "./evidence-consumer-operations.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { consumePositionStructure, declareStructuralReadingEvidence, presentPositionStructureEvidence } from "./reading-evidence.js";
import { PRESENTATION_ADAPTERS, factStatementOperand, parsePresentationReceipt, presentationDigest,
  presentEvidenceItems, presentedSentence, serializePresentedEvidence, type PresentationReceipt } from "./presentation-contract.js";
import { STRUCTURAL_DETAIL_FIELDS, STRUCTURAL_DETAIL_KINDS, STRUCTURAL_DETAIL_RENDERERS,
  STRUCTURAL_DETAIL_SCHEMAS, type StructuralDetailKind } from "./structural-reading-detail.js";
import { structuralReading } from "./structure.js";

const INSPECTOR = { id: "inspector.position_structure", version: 2 } as const;
const CARLSBAD = "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10";
const position = Chess.fromSetup(parseFen(CARLSBAD).unwrap()).unwrap();
for (const uci of ["d7f8", "a2a3", "f6e4", "a1b1", "e4c3", "b2b4", "c8g4", "b4b5", "h7h6", "b5c6", "b7c6"]) {
  const move = parseUci(uci);
  if (move === undefined || !position.isLegal(move)) throw new TypeError(`Illegal fidelity witness ${uci}`);
  position.play(move);
}
const FENS = [CARLSBAD, makeFen(position.toSetup()),
  "4k3/8/8/8/4N3/3P4/8/4K3 w - - 0 1",
  "4k3/8/8/8/8/P7/P7/4K3 w - - 0 1",
  "8/8/8/4K3/8/4k3/P7/B7 b - - 0 1",
  "8/4K3/8/8/8/4k3/8/8 b - - 0 1",
  "4k3/8/8/8/8/8/8/B3K2R w - - 0 1",
] as const;
function specimen(kind: StructuralDetailKind) {
  for (const fen of FENS) {
    const observation = structuralReading(fen).features.find(item => item.kind === kind);
    if (observation !== undefined) {
      const sources: readonly DeclaredEvidence<unknown>[] = invokeEvidenceValueRoute(`rules.structural.reading.${kind}@2`, { fen });
      const source = sources[structuralReading(fen).features.filter(item => item.kind === kind).indexOf(observation)]!;
      const item = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, INSPECTOR, [source]))[0]!;
      return { fen, observation, source, item };
    }
  }
  throw new TypeError(`Missing real FEN witness for ${kind}`);
}
const plain = (value: unknown): Record<string, unknown> => JSON.parse(JSON.stringify(value));
function redigest(wire: PresentationReceipt): PresentationReceipt {
  const items = wire.items.map(({ componentDigest: _old, ...body }) => ({ ...body, componentDigest: presentationDigest("presentation.component@1", body) }));
  return { ...wire, items, digest: presentationDigest("presentation.receipt@1", items) };
}
function wireOperands(kind: StructuralDetailKind, mutate: (operand: Record<string, unknown>) => void) {
  const wire = JSON.parse(JSON.stringify(serializePresentedEvidence([specimen(kind).item]))) as PresentationReceipt;
  const item = wire.items[0]!;
  if (item.component.id !== "fact_statement") throw new TypeError("Expected detailed fact");
  const operands = item.component.operand.operands as unknown as Record<string, unknown>;
  mutate(operands);
  // Do not let the old digest/text veto a mutation before its intended closed grammar does.
  // Rendering directly (without parse) also rebuilds coherent-but-contradictory safety prose.
  let renderedText = item.component.operand.renderedText;
  try { renderedText = STRUCTURAL_DETAIL_RENDERERS[`consumer.structural_detail.${kind}@2`].render(operands as never); }
  catch { /* Missing/wrong-type fields can be unrenderable; the closed parser must refuse first. */ }
  return redigest({ ...wire, items: [{ ...item, component: { ...item.component, operand: {
    ...item.component.operand, sourceDigest: presentationDigest("presentation.fact.operands@1", operands), renderedText,
  } } }] });
}
const invalidField = (field: string): unknown => field === "count" ? -1 : field === "squares" ? ["a9"] : field === "detail" ? {} : "forged";

describe("D3309 detailed structural Inspector sources and registration", () => {
  it("registers exactly sixteen successors and the actual version-two view operation", () => {
    expect(STRUCTURAL_DETAIL_KINDS).toHaveLength(16);
    const sources = PRIMARY_EVIDENCE_MANIFEST.projections.filter(row => row.payloadType.startsWith("StructuralDetail."));
    expect(sources.map(row => row.id).sort()).toEqual(STRUCTURAL_DETAIL_KINDS.map(kind => `rules.structural.reading.${kind}`).sort());
    expect(sources.every(row => row.version === 2)).toBe(true);
    const bindings = PRIMARY_EVIDENCE_MANIFEST.bindings.filter(row => row.consumer.id === INSPECTOR.id);
    expect(bindings).toHaveLength(17);
    expect(bindings.every(row => row.consumer.version === 2 && row.projection.version === 2)).toBe(true);
    expect(PRESENTATION_ADAPTERS.filter(row => row.consumer.id === INSPECTOR.id)).toHaveLength(17);
    expect(RUNTIME_EVIDENCE_CONSUMER_OPERATIONS.filter(row => row.consumer.id === INSPECTOR.id))
      .toEqual([expect.objectContaining({ consumer: INSPECTOR, operation: consumePositionStructure })]);
  });
  it.each(STRUCTURAL_DETAIL_KINDS)("%s preserves all fields, witness order, predecessor scope and sealed roundtrip", kind => {
    const { observation, source, item } = specimen(kind);
    const expected = Object.fromEntries(STRUCTURAL_DETAIL_FIELDS[kind].map(field => [field, observation[field]]));
    expect(source.payload).toEqual(expected);
    expect(item.component.id).toBe("fact_statement");
    if (item.component.id !== "fact_statement") throw new TypeError("Expected detailed fact");
    expect(item.component.operand.operands).toEqual(expected);
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === source.projection.id && row.version === 2)!;
    const predecessor = PRIMARY_EVIDENCE_MANIFEST.projections.find(row => row.id === source.projection.id && row.version === 1)!;
    expect(declaration.operands).toEqual(STRUCTURAL_DETAIL_FIELDS[kind]);
    expect(predecessor.operands).toEqual(["kind", "squares"]);
    for (const field of ["grounding", "exactness", "confidence", "limitations", "dependsOn", "forms"] as const) expect(declaration[field]).toEqual(predecessor[field]);
    const restored = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence([item]))));
    expect(restored[0]!.component).toEqual(item.component);
    expect(presentedSentence(restored[0]!)).toBe(presentedSentence(item));
    expect(presentedSentence(item)).not.toMatch(/Position reading:|sha256|reading\.|@\d/u);
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, INSPECTOR, [{ ...source }])).toThrow();
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, INSPECTOR, [{ ...source, payload: { ...expected, sentence: "This wins" } }])).toThrow();
  });
  it("retains twelve distinct side-role counts, zero counts and original empty witnesses", () => {
    const counts = invokeEvidenceValueRoute("rules.structural.reading.piece_count@2", { fen: CARLSBAD });
    expect(counts).toHaveLength(12);
    const text = presentPositionStructureEvidence({ fen: CARLSBAD }).map(presentedSentence);
    expect(text).toContain("White has 7 pawns."); expect(text).toContain("Black has 7 pawns.");
    expect(text).toContain("White's bishop on d3 stands on a light square.");
    const presented = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, INSPECTOR, counts));
    expect(new Set(presented.map(presentedSentence)).size).toBe(12);
    expect(counts.every(item => item.payload.squares.length === 0)).toBe(true);
    const kings = invokeEvidenceValueRoute("rules.structural.reading.piece_count@2", { fen: FENS[5] });
    expect(kings.filter(item => item.payload.count === 0)).toHaveLength(10);
  });
  it("preserves the original full source population order and multiplicity, not schema-table order", () => {
    for (const fen of FENS) {
      const original = declareStructuralReadingEvidence({ fen });
      const presented = presentPositionStructureEvidence({ fen });
      expect(presented.map(item => item.adapter.projection.id), fen).toEqual(original.map(item => item.projection.id));
      for (const [index, item] of presented.entries()) {
        const source = original[index]!;
        if (item.component.id !== "fact_statement") throw new TypeError("Expected detailed fact");
        const kind = source.projection.id.split(".").at(-1)!;
        const fields = kind === "named_structure" ? ["id", "name", "squares"] : STRUCTURAL_DETAIL_FIELDS[kind as StructuralDetailKind];
        // JSON count semantics match the closed receipt: an arithmetic -0 is the same count0.
        // No order, field, nonzero value or array occurrence is normalized away.
        const payload = plain(source.payload);
        expect(item.component.operand.operands).toEqual(Object.fromEntries(fields.map(field => [field, payload[field]])));
      }
    }
  });
  it("retains genuine safe and unsafe pawn geometry, including complete ordered push and capture routes", () => {
    const sources = FENS.flatMap(fen => invokeEvidenceValueRoute("rules.structural.reading.pawn_safe_square@2", { fen }));
    expect(sources.some(item => item.payload.detail.safe)).toBe(true);
    expect(sources.some(item => !item.payload.detail.safe)).toBe(true);
    expect(sources.some(item => item.payload.detail.pushAttackers.length > 0)).toBe(true);
    expect(sources.some(item => item.payload.detail.pushAttackers.some(entry => entry.pushes > 1))).toBe(true);
    expect(sources.some(item => item.payload.detail.captureAttackers.length > 0)).toBe(true);
    for (const source of sources) {
      const item = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, INSPECTOR, [source]))[0]!;
      const detail = source.payload.detail, text = presentedSentence(item);
      for (const entry of detail.pushAttackers) expect(text).toContain(`${entry.square}: ${entry.pushes} ${entry.pushes === 1 ? "push" : "pushes"}`);
      for (const entry of detail.captureAttackers) expect(text).toContain(`${entry.square}: ${entry.captures} capture`);
      expect(text).toContain(detail.safe ? "no opposing pawn reach" : "opposing pawn reach is present");
      const restored = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence([item]))));
      expect(restored[0]!.component).toEqual(item.component);
    }
  });
  it.each(STRUCTURAL_DETAIL_KINDS)("%s refuses caller operands or invalid FEN before minting", kind => {
    expect(() => invokeEvidenceValueRoute(`rules.structural.reading.${kind}@2`, { fen: CARLSBAD, payload: specimen(kind).source.payload } as never)).toThrow(/authority inputs/u);
    expect(() => invokeEvidenceValueRoute(`rules.structural.reading.${kind}@2`, { fen: "invented" })).toThrow();
  });
  it("retires old Inspector execution without widening Sight or accepting predecessor sources", () => {
    const old = declareStructuralReadingEvidence({ fen: CARLSBAD });
    const nonNamed = old.filter(item => item.projection.id !== "rules.structural.reading.named_structure");
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { ...INSPECTOR, version: 1 }, old)).toThrow();
    expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, INSPECTOR, nonNamed).items).toHaveLength(0);
    const detail = specimen("piece_count").source;
    expect(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.selected_square_sight", version: 1 }, [detail]).items).toHaveLength(0);
    const sight = evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "board.selected_square_sight", version: 1 }, old);
    expect(() => consumePositionStructure(sight)).toThrow(/@2/u);
    expect(() => consumePositionStructure({ fen: CARLSBAD } as never)).toThrow();
    expect(() => consumePositionStructure(structuralReading(CARLSBAD).features as never)).toThrow();
  });
});

describe("D3309 closed structural operands on construction and independently redigested wire", () => {
  for (const kind of STRUCTURAL_DETAIL_KINDS) for (const field of STRUCTURAL_DETAIL_FIELDS[kind]) {
    it(`${kind} refuses missing ${field} at both boundaries`, () => {
      const operand = plain(specimen(kind).source.payload); delete operand[field];
      const renderer = `consumer.structural_detail.${kind}@2` as const;
      expect(() => factStatementOperand(renderer, "declared_convention", "board-rules@1", operand as never)).toThrow();
      expect(() => parsePresentationReceipt(wireOperands(kind, value => { delete value[field]; }))).toThrow();
    });
    it(`${kind} refuses invalid ${field} at both boundaries`, () => {
      const operand = { ...plain(specimen(kind).source.payload), [field]: invalidField(field) };
      expect(() => STRUCTURAL_DETAIL_SCHEMAS[kind](operand, kind)).toThrow();
      expect(() => parsePresentationReceipt(wireOperands(kind, value => { value[field] = invalidField(field); }))).toThrow();
    });
  }
  it.each(STRUCTURAL_DETAIL_KINDS)("%s refuses extra prose in process and wire", kind => {
    const renderer = STRUCTURAL_DETAIL_RENDERERS[`consumer.structural_detail.${kind}@2`];
    expect(() => renderer.parse({ ...plain(specimen(kind).source.payload), sentence: "A winning move" }, kind)).toThrow();
    expect(() => parsePresentationReceipt(wireOperands(kind, value => { value.sentence = "A winning move"; }))).toThrow();
  });
  it.each(["square", "color", "safe", "basis", "pushAttackers", "captureAttackers"])("refuses missing pawn detail.%s on both boundaries", field => {
    const operand = plain(specimen("pawn_safe_square").source.payload); delete (operand.detail as Record<string, unknown>)[field];
    expect(() => STRUCTURAL_DETAIL_SCHEMAS.pawn_safe_square(operand, "safety")).toThrow();
    expect(() => parsePresentationReceipt(wireOperands("pawn_safe_square", value => { delete (value.detail as Record<string, unknown>)[field]; }))).toThrow();
  });
  it.each([
    { square: "a9" }, { color: "forged" }, { basis: "legal_moves" }, { safe: "yes" },
    { pushAttackers: [{ square: "a2", pushes: -1 }] }, { pushAttackers: [{ square: "a2" }] },
    { captureAttackers: [{ square: "a2", captures: 1, sentence: "wins" }] },
    { captureAttackers: [{ square: "a9", captures: 1 }] }, { captureAttackers: "attacks" }, { sentence: "safe forever" },
  ])("refuses malformed nested pawn reach %j", mutation => {
    const operand = plain(specimen("pawn_safe_square").source.payload); operand.detail = { ...(operand.detail as object), ...mutation };
    expect(() => STRUCTURAL_DETAIL_SCHEMAS.pawn_safe_square(operand, "safety")).toThrow();
    expect(() => parsePresentationReceipt(wireOperands("pawn_safe_square", value => { value.detail = { ...(value.detail as object), ...mutation }; }))).toThrow();
  });
  it.each(["color", "square", "safe"])("refuses internally contradictory pawn %s, not just invalid types", field => {
    const mutate = (value: Record<string, unknown>) => {
      const detail = value.detail as Record<string, unknown>;
      detail[field] = field === "color" ? value.color === "white" ? "black" : "white"
        : field === "square" ? (value.squares as string[])[0] === "a1" ? "b1" : "a1" : !detail.safe;
    };
    const operand = plain(specimen("pawn_safe_square").source.payload); mutate(operand);
    expect(() => STRUCTURAL_DETAIL_SCHEMAS.pawn_safe_square(operand, "safety")).toThrow();
    expect(() => parsePresentationReceipt(wireOperands("pawn_safe_square", mutate))).toThrow(/crosses its square or side|contradicts its retained routes/u);
  });
  it("keeps pawn/outpost/attack/reach/distance qualifications in the actual sentences", () => {
    expect(presentedSentence(specimen("pawn_safe_square").item)).toContain("ignores blockers, capture availability, turn order and move legality");
    expect(presentedSentence(specimen("outpost").item)).toContain("does not establish permanence");
    expect(presentedSentence(specimen("direct_attack_count").item)).toContain("pins and check legality are not applied");
    expect(presentedSentence(specimen("piece_reach_count").item)).toContain("not a legal-move forecast");
    expect(presentedSentence(specimen("piece_distance").item)).toContain("on an empty board");
  });
});
