import fc from "fast-check";
import { readFileSync } from "node:fs";

import type { StructuralExpression } from "@chess-tabiya/schema/drill-pack";
import { matchesStructuralExpression } from "@chess-tabiya/runtime";
import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { DEGENERATE_POSITIONS, expressionSatisfiability, playWitness, refuteStructuralExpression } from "./expression-satisfiability.js";

const initial = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const expression = (feature: any): StructuralExpression => ({ kind: "feature", feature });

function generatedFen(choices: readonly number[]): string {
  const position = Chess.default();
  for (const choice of choices) {
    const moves = [...position.allDests()].flatMap(([from, destinations]) => [...destinations].map((to) => ({ from, to })));
    if (moves.length === 0) break;
    position.play(moves[choice % moves.length]!);
  }
  return makeFen(position.toSetup());
}

describe("expression satisfiability", () => {
  it("separates a sound king refutation from an uncovered expression", () => {
    const impossible = expression({ kind: "piece_count", color: "white", role: "king", basis: "count", comparison: "equal", count: 0 });
    expect(expressionSatisfiability(impossible)).toMatchObject({ verdict: "unsatisfiable", rule: "R2" });
    expect(expressionSatisfiability({ kind: "pieceOnSquare", square: "a1", piece: { color: "black", role: "queen" } })).toMatchObject({ verdict: "unknown" });
  });

  it("keeps all nine cross-review counterexamples out of the refutation arm", () => {
    const cases: readonly StructuralExpression[] = [
      { kind: "any", of: [expression({ kind: "piece_count", color: "white", role: "knight", basis: "count", comparison: "atLeast", count: 1 }), expression({ kind: "piece_count", color: "white", role: "king", basis: "count", comparison: "equal", count: 2 })] },
      { kind: "not", of: expression({ kind: "outpost", color: "white", square: "a2" }) },
      expression({ kind: "line_blockers", from: "a1", to: "a2", comparison: "atMost", count: 0 }),
      expression({ kind: "piece_distance", color: "white", role: "king", target: { kind: "piece", color: "white", role: "king" }, comparison: "equal", count: 0 }),
      expression({ kind: "piece_count", color: "white", role: "knight", basis: "count", comparison: "atMost", count: 12 }),
      expression({ kind: "piece_distance", color: "white", role: "rook", target: { kind: "square", square: "a1" }, comparison: "atMost", count: 5 }),
      expression({ kind: "pawn_count", color: "white", basis: "count", comparison: "atMost", count: 9 }),
      { kind: "all", of: [expression({ kind: "piece_reach_count", color: "white", role: "rook", scope: "any", comparison: "atLeast", count: 10 }), expression({ kind: "piece_reach_count", color: "white", role: "rook", scope: "any", comparison: "atMost", count: 3 })] },
      { kind: "all", of: [expression({ kind: "piece_reach_count", color: "white", role: "bishop", scope: "every", comparison: "atLeast", count: 10 }), expression({ kind: "piece_reach_count", color: "white", role: "bishop", scope: "every", comparison: "atMost", count: 3 })] },
    ];
    for (const value of cases) expect(refuteStructuralExpression(value)).toBeUndefined();
    expect(cases.slice(0, 7).every((value) => matchesStructuralExpression(initial, value))).toBe(true);
    expect(matchesStructuralExpression("7k/8/8/8/3R4/8/6PP/6KR w - - 0 1", cases[7]!)).toBe(true);
    expect(matchesStructuralExpression(DEGENERATE_POSITIONS[0].fen, cases[8]!)).toBe(true);
  });

  it("never refutes a generated expression that a generated legal position satisfies", () => {
    const feature = fc.record({
      role: fc.constantFrom("king", "queen", "rook", "bishop", "knight", "pawn"),
      comparison: fc.constantFrom("atLeast", "atMost", "equal"), count: fc.integer({ min: -3, max: 13 }),
    }).map(({ role, comparison, count }) => expression({ kind: "piece_count", color: "white", role, basis: "count", comparison, count }));
    fc.assert(fc.property(feature, fc.array(fc.nat(), { maxLength: 20 }), (value, choices) => {
      if (refuteStructuralExpression(value) !== undefined) expect(matchesStructuralExpression(generatedFen(choices), value)).toBe(false);
    }), { numRuns: 100 });
  });

  it("plays witnesses and refuses illegal SAN without upgrading the verdict", () => {
    const entry = JSON.parse(readFileSync("content/shapes/knight-vs-bishop.json", "utf8"));
    const target = entry.plans.find((plan: any) => plan.id === "black-anchor-the-knight").success.signature;
    const invalid = { id: "bad", from: initial, sans: ["Ke4"], role: "anchored" as const, expect: true };
    const result = playWitness(invalid, target);
    expect(result.code).toBe("WITNESS_LINE_ILLEGAL");
    expect(result.error).toContain("Ke4");
    expect(expressionSatisfiability(target, [], [invalid]).verdict).toBe("unknown");
  });
});
