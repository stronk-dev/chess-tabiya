// D3105: one registered named-structure expression decides the match AND its square witness.
import { describe, expect, it } from "vitest";

import {
  STRUCTURE_PREDICATES,
  evaluateNamedStructureWithWitness,
  evaluateStructuralExpressionWithWitness,
  matchesStructuralExpression,
  matchesStructuralFeature,
  structuralReading,
  type StructuralExpression,
  type StructureId,
} from "./index.js";

// 1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 g6 5.c4 — Maroczy Bind.
const MAROCZY = "r1bqkbnr/pp1ppp1p/2n3p1/8/2PNP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5";
// Same position with the c4 pawn removed.
const MAROCZY_WITHOUT_C4 = "r1bqkbnr/pp1ppp1p/2n3p1/8/3NP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5";
// QGD Exchange: 1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.cxd5 exd5 5.Bg5 c6 — Carlsbad.
const CARLSBAD = "rnbqkb1r/pp3ppp/2p2n2/3p2B1/3P4/2N5/PP2PPPP/R2QKBNR w KQkq - 0 6";
const IQP_WHITE = "r1bq1rk1/pp2bppp/2n1pn2/8/3P4/2NB1N2/PP3PPP/R1BQ1RK1 w - - 0 10";
const IQP_BLACK = "r1bq1rk1/pp3ppp/2n2n2/2bp4/8/2N2N2/PP2BPPP/R1BQ1RK1 w - - 0 9";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const namedWitness = (fen: string): readonly (readonly string[])[] =>
  structuralReading(fen).features.filter((feature) => feature.kind === "named_structure").map((feature) => feature.squares);

describe("D3105 named-structure registry and witness", () => {
  it("registers exactly the four catalogue expressions, frozen", () => {
    expect(Object.keys(STRUCTURE_PREDICATES).sort()).toEqual(["carlsbad", "iqp-black", "iqp-white", "maroczy-bind"]);
    expect(Object.isFrozen(STRUCTURE_PREDICATES)).toBe(true);
    expect(Object.isFrozen(STRUCTURE_PREDICATES["maroczy-bind"])).toBe(true);
    expect(() => { (STRUCTURE_PREDICATES as Record<string, unknown>).carlsbad = { kind: "all", of: [] }; }).toThrow(TypeError);
  });

  it.each([
    ["maroczy-bind", MAROCZY, ["c4", "e4"]],
    ["carlsbad", CARLSBAD, ["c6", "d4", "d5"]],
    ["iqp-white", IQP_WHITE, ["d4"]],
    ["iqp-black", IQP_BLACK, ["d5"]],
  ] as const)("%s matches a real position with its positive piece-on-square witnesses", (id, fen, squares) => {
    expect(evaluateNamedStructureWithWitness(fen, id)).toEqual({ matched: true, squares });
    expect(matchesStructuralFeature(fen, { kind: "named_structure", id })).toBe(true);
    const reading = structuralReading(fen);
    expect(reading.structures.map((structure) => structure.id)).toEqual([id]);
    expect(namedWitness(fen)).toEqual([squares]);
  });

  it("a FEN mutation (remove the c4 pawn) flips the match and empties the witness in the same call", () => {
    expect(evaluateNamedStructureWithWitness(MAROCZY_WITHOUT_C4, "maroczy-bind")).toEqual({ matched: false, squares: [] });
    expect(matchesStructuralFeature(MAROCZY_WITHOUT_C4, { kind: "named_structure", id: "maroczy-bind" })).toBe(false);
    expect(structuralReading(MAROCZY_WITHOUT_C4).structures).toEqual([]);
    expect(namedWitness(MAROCZY_WITHOUT_C4)).toEqual([]);
    for (const id of Object.keys(STRUCTURE_PREDICATES) as StructureId[]) expect(evaluateNamedStructureWithWitness(START, id)).toEqual({ matched: false, squares: [] });
  });

  it("a mutated expression passed to the general evaluator changes the witness", () => {
    const registered = STRUCTURE_PREDICATES["maroczy-bind"];
    expect(evaluateStructuralExpressionWithWitness(MAROCZY, registered)).toEqual({ matched: true, squares: ["c4", "e4"] });
    if (registered.kind !== "all") throw new Error("maroczy-bind is registered as a conjunction");
    const withKnight: StructuralExpression = { kind: "all", of: [...registered.of, { kind: "pieceOnSquare", square: "d4", piece: { color: "white", role: "knight" } }] };
    expect(evaluateStructuralExpressionWithWitness(MAROCZY, withKnight)).toEqual({ matched: true, squares: ["c4", "d4", "e4"] });
    const withoutE4: StructuralExpression = { kind: "all", of: [registered.of[0], ...registered.of.slice(2)] };
    expect(evaluateStructuralExpressionWithWitness(MAROCZY, withoutE4)).toEqual({ matched: true, squares: ["c4"] });
    const wrongSquare: StructuralExpression = { kind: "all", of: [{ kind: "pieceOnSquare", square: "c3", piece: { color: "white", role: "pawn" } }, ...registered.of.slice(1)] };
    expect(evaluateStructuralExpressionWithWitness(MAROCZY, wrongSquare)).toEqual({ matched: false, squares: [] });
    // Negations, empty-square leaves and file features never witness a square.
    expect(evaluateStructuralExpressionWithWitness(MAROCZY, { kind: "all", of: [
      { kind: "not", of: { kind: "pieceOnSquare", square: "d4", piece: { color: "white", role: "pawn" } } },
      { kind: "pieceOnSquare", square: "d5", piece: null },
      { kind: "feature", feature: { kind: "half_open_file", color: "white", file: "d" } },
    ] })).toEqual({ matched: true, squares: [] });
    // A referenced named structure contributes its own witness.
    expect(evaluateStructuralExpressionWithWitness(MAROCZY, { kind: "feature", feature: { kind: "named_structure", id: "maroczy-bind" } })).toEqual({ matched: true, squares: ["c4", "e4"] });
  });

  it("the general matcher and the witness evaluator agree on every registered expression", () => {
    for (const fen of [MAROCZY, MAROCZY_WITHOUT_C4, CARLSBAD, IQP_WHITE, IQP_BLACK, START]) {
      for (const [id, expression] of Object.entries(STRUCTURE_PREDICATES)) {
        expect(evaluateStructuralExpressionWithWitness(fen, expression).matched, `${id} @ ${fen}`).toBe(matchesStructuralExpression(fen, expression));
      }
    }
  });

  it("refuses an unregistered structure id", () => {
    expect(() => evaluateNamedStructureWithWitness(MAROCZY, "hedgehog" as StructureId)).toThrow(/no registered expression/u);
  });
});
