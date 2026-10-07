// DISPOSABLE RFC-0000 exploration, D3309. Real FEN -> real factories -> real presentation.
// The candidate reader below is research only: it creates no declared evidence, version,
// binding or presented component. Its output must never be used as production guidance.
import { Chess } from "chessops/chess";
import { isDeepStrictEqual } from "node:util";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { PRIMARY_EVIDENCE_MANIFEST } from "../../packages/runtime/src/evidence-catalog.js";
import { STRUCTURAL_FEATURE_KINDS } from "../../packages/schema/src/drill-pack/index.js";
import { evidenceForConsumer } from "../../packages/runtime/src/evidence-contract.js";
import { declareStructuralReadingEvidence } from "../../packages/runtime/src/reading-evidence.js";
import { presentEvidenceItems, presentedSentence } from "../../packages/runtime/src/presentation-contract.js";
import { structuralReading, type StructuralObservation } from "../../packages/runtime/src/structure.js";
import { renderStructuralObservation } from "../../apps/web/src/lib/structural-sentences.js";

const REQUIRED = {
  backward_pawn: ["color", "file"], isolated_pawn: ["color", "file"],
  doubled_pawn: ["color", "file"], half_open_file: ["color", "file"],
  open_file: ["file"], passed_pawn: ["color"], outpost: ["color"],
  pawn_safe_square: ["color", "detail"], bishop_on_shade: ["color", "shade"],
  line_blockers: ["count"], direct_attack_count: ["color", "count"],
  piece_reach_count: ["color", "role", "count"], king_opposition: ["color", "form"],
  piece_count: ["color", "role", "count"], king_zone: ["color", "zone"],
  piece_distance: ["role", "count"],
} as const;
type Kind = keyof typeof REQUIRED;
const KINDS = Object.keys(REQUIRED) as Kind[];
const CARLSBAD = "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10";
const position = Chess.fromSetup(parseFen(CARLSBAD).unwrap()).unwrap();
for (const uci of ["d7f8", "a2a3", "f6e4", "a1b1", "e4c3", "b2b4", "c8g4", "b4b5", "h7h6", "b5c6", "b7c6"]) {
  const move = parseUci(uci);
  if (!move || !position.isLegal(move)) throw new TypeError(`Illegal witness move: ${uci}`);
  position.play(move);
}
const FENS = [CARLSBAD, makeFen(position.toSetup()),
  "4k3/8/8/8/4N3/3P4/8/4K3 w - - 0 1",
  "4k3/8/8/8/8/P7/P7/4K3 w - - 0 1",
  "8/8/8/4K3/8/4k3/P7/B7 b - - 0 1",
  "8/4K3/8/8/8/4k3/8/8 b - - 0 1",
  "4k3/8/8/8/8/8/8/B3K2R w - - 0 1",
] as const;
const specimen = (kind: Kind) => {
  for (const fen of FENS) {
    const observation = structuralReading(fen).features.find(item => item.kind === kind);
    if (observation) return { fen, observation };
  }
  throw new TypeError(`No actual emitted witness for ${kind}`);
};
const plain = (value: unknown) => JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
const exact = (value: unknown) => JSON.stringify(value);

/** Prototype closed operands, checked against the same FEN computation, not caller testimony. */
function candidateOperands(fen: string, input: unknown): StructuralObservation {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Expected reading operands");
  const value = input as Record<string, unknown>;
  if (typeof value.kind !== "string" || !Object.hasOwn(REQUIRED, value.kind)) throw new TypeError("Excluded reading kind");
  const kind = value.kind as Kind;
  const fields = ["kind", "squares", ...REQUIRED[kind]];
  const allowed = new Set<string>(fields);
  if (Object.keys(value).some(field => !allowed.has(field)) || fields.some(field => !Object.hasOwn(value, field))) throw new TypeError("Closed kind-required operands");
  const matching = structuralReading(fen).features.find(item => item.kind === kind &&
    fields.every(field => isDeepStrictEqual((item as unknown as Record<string, unknown>)[field], value[field])));
  if (!matching) throw new TypeError("Operands do not match a computation at this FEN");
  // Copy only the proposed operands. Extra existing payload fields are not silently declared.
  return Object.freeze(Object.fromEntries(fields.map(field => [field, value[field]]))) as unknown as StructuralObservation;
}
function candidateInput(observation: StructuralObservation) {
  const fields = ["kind", "squares", ...REQUIRED[observation.kind as Kind]];
  return Object.fromEntries(fields.map(field => [field, plain(observation)[field]]));
}

describe("D3309 actual producer-to-Inspector fidelity census", () => {
  it("is set-equal to all sixteen non-retired v1 computed reading routes", () => {
    expect(STRUCTURAL_FEATURE_KINDS.filter(kind => kind !== "pawn_count" && kind !== "named_structure").sort()).toEqual([...KINDS].sort());
    const active = PRIMARY_EVIDENCE_MANIFEST.projections.filter(p => p.id.startsWith("rules.structural.reading.") && p.version === 1 && KINDS.includes(p.id.split(".").at(-1) as Kind));
    expect(active.map(p => p.id.split(".").at(-1)).sort()).toEqual([...KINDS].sort());
    expect(KINDS).toHaveLength(16);
  });
  it.each(KINDS)("%s: actual emitted operands survive sealing but are absent from the declared typed view", kind => {
    const { fen, observation } = specimen(kind);
    const declared = declareStructuralReadingEvidence({ fen });
    const item = declared.find(item => item.projection.id === `rules.structural.reading.${kind}` && exact(item.payload) === exact(observation));
    expect(item, `Missing real sealed witness: ${kind}`).toBeDefined();
    const declaration = PRIMARY_EVIDENCE_MANIFEST.projections.find(p => p.id === item!.projection.id && p.version === 1)!;
    expect(declaration.operands).toEqual(["kind", "squares"]);
    for (const field of REQUIRED[kind]) {
      expect(Object.hasOwn(item!.payload as object, field), field).toBe(true);
      expect(declaration.operands, field).not.toContain(field);
    }
    const typed = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "inspector.position_structure", version: 1 }, [item!]));
    expect(typed).toHaveLength(1);
    expect(presentedSentence(typed[0]!)).toMatch(/^Position reading/u);
    expect(presentedSentence(typed[0]!)).not.toEqual(renderStructuralObservation(observation));
  });
  it("Pack B loses seven-pawn side/count and bishop-shade statements on the real typed path", () => {
    const observations = structuralReading(CARLSBAD).features;
    const legacy = observations.map(renderStructuralObservation);
    expect(legacy).toContain("White has 7 pawns.");
    expect(legacy).toContain("Black has 7 pawns.");
    expect(legacy).toContain("White's bishop on d3 stands on a light square.");
    const typed = presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "inspector.position_structure", version: 1 }, declareStructuralReadingEvidence({ fen: CARLSBAD }))).map(presentedSentence);
    for (const text of ["White has 7 pawns.", "Black has 7 pawns.", "White's bishop on d3 stands on a light square."]) expect(typed).not.toContain(text);
  });
  it("distinct real pawn counts collide in one typed caption, rather than merely changing wording", () => {
    const items = declareStructuralReadingEvidence({ fen: CARLSBAD }).filter(item => item.projection.id === "rules.structural.reading.piece_count");
    const typed = items.flatMap(item => presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "inspector.position_structure", version: 1 }, [item])).map(presentedSentence));
    expect(items).toHaveLength(12);
    expect(new Set(items.map(item => renderStructuralObservation(item.payload as StructuralObservation))).size).toBeGreaterThan(1);
    expect(new Set(typed).size).toBe(1);
  });
});

describe("D3309 disposable operand-reader controls, NOT a v2 admission or component", () => {
  it.each(KINDS)("%s: exact FEN operands preserve the existing statement", kind => {
    const { fen, observation } = specimen(kind);
    expect(renderStructuralObservation(candidateOperands(fen, candidateInput(observation)))).toEqual(renderStructuralObservation(observation));
  });
  for (const kind of KINDS) for (const field of ["kind", "squares", ...REQUIRED[kind]]) {
    it(`${kind}: refuses missing ${field}`, () => {
      const { fen, observation } = specimen(kind);
      const input = candidateInput(observation); delete input[field];
      expect(() => candidateOperands(fen, input)).toThrow();
    });
    it(`${kind}: refuses mismatched ${field}`, () => {
      const { fen, observation } = specimen(kind);
      const input = candidateInput(observation); input[field] = field === "count" ? -1 : "forged";
      expect(() => candidateOperands(fen, input)).toThrow();
    });
  }
  it.each(["square", "color", "safe", "basis", "pushAttackers", "captureAttackers"])("pawn safety refuses missing nested %s", field => {
    const { fen, observation } = specimen("pawn_safe_square");
    const input = candidateInput(observation); delete (input.detail as Record<string, unknown>)[field];
    expect(() => candidateOperands(fen, input)).toThrow();
  });
  it("pawn safety preserves the geometry qualification rather than a legal forecast", () => {
    const { fen, observation } = specimen("pawn_safe_square");
    expect(renderStructuralObservation(candidateOperands(fen, candidateInput(observation)))).toMatch(/maximal pawn-reach geometry/u);
    const input = candidateInput(observation);
    (input.detail as Record<string, unknown>).basis = "legal_moves";
    expect(() => candidateOperands(fen, input)).toThrow();
  });
  it("operand object key order is not an evidence distinction", () => {
    const { fen, observation } = specimen("pawn_safe_square");
    const input = candidateInput(observation);
    input.detail = Object.fromEntries(Object.entries(input.detail as Record<string, unknown>).reverse());
    const reordered = Object.fromEntries(Object.entries(input).reverse());
    expect(renderStructuralObservation(candidateOperands(fen, reordered))).toEqual(renderStructuralObservation(observation));
  });
  it.each([
    { pushAttackers: [{ square: "a9", pushes: 1 }] },
    { pushAttackers: [{ square: "a2", pushes: -1 }] },
    { pushAttackers: [{ square: "a2", pushes: 100 }] },
    { pushAttackers: [{ square: "a2" }] },
    { captureAttackers: [{ square: "a2", captures: -1 }] },
    { captureAttackers: [{ square: "a2", captures: 100 }] },
    { captureAttackers: "attacks" },
    { sentence: "The knight is safe forever" },
  ])("refuses malformed or invented nested pawn reach: %j", mutation => {
    const { fen, observation } = specimen("pawn_safe_square");
    const input = candidateInput(observation);
    input.detail = { ...(input.detail as object), ...mutation };
    expect(() => candidateOperands(fen, input)).toThrow();
  });
  it.each(KINDS)("%s: rejects a forged prose side channel", kind => {
    const { fen, observation } = specimen(kind);
    expect(() => candidateOperands(fen, { ...candidateInput(observation), sentence: "This wins" })).toThrow();
  });
  it.each(["pawn_count", "named_structure", "future_kind"])("does not manufacture %s successor authority", kind => {
    expect(() => candidateOperands(CARLSBAD, { kind, squares: [] })).toThrow();
  });
  it("the production view still rejects a copied/mutated sealed reading", () => {
    const item = declareStructuralReadingEvidence({ fen: CARLSBAD })[0]!;
    const forged = { ...item, payload: { ...(item.payload as object), sentence: "This wins" } };
    expect(() => evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "inspector.position_structure", version: 1 }, [forged])).toThrow();
  });
});
