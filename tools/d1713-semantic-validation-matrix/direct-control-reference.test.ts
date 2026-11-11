// Disposable D1716 reference checks. No cited source, case or qualification is registered.
import { describe, expect, it } from "vitest";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci, parseSquare } from "chessops/util";
import type { NormalMove } from "chessops/types";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, type CandidatePopulationReceipt, type CandidateWideScope } from "../../packages/runtime/src/candidate-population.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { COUNT_LITERAL_POPULATIONS } from "../../packages/runtime/src/semantic-validation-count-population-sources.js";
import { referenceControlCounts, referenceControlEvents, referenceControlInput, referenceControlPopulation, type ControlLiteralPopulation } from "./direct-control-reference.js";

// Existing literal successor boards stay literal. Additional input boards use the external
// rules library for legal successors only; expected attack counts use independent arithmetic.
function rulesInputs(id: string, root: string, plays: readonly string[]): ControlLiteralPopulation {
  const position = Chess.fromSetup(parseFen(root).unwrap()).unwrap();
  const edges: [string, string][] = [];
  for (const [from, destinations] of position.allDests()) for (const to of destinations) {
    const promotions = position.board.get(from)?.role === "pawn" && (to < 8 || to >= 56)
      ? ["bishop", "knight", "queen", "rook"] as const : [undefined];
    for (const promotion of promotions) {
      const move: NormalMove = { from, to, ...(promotion === undefined ? {} : { promotion }) };
      const child = position.clone(); child.play(move); edges.push([makeUci(move), makeFen(child.toSetup())]);
    }
  }
  return { id, root, plays, edges: edges.sort((a, b) => a[0].localeCompare(b[0])) };
}
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const PIN = "4r2k/8/8/8/8/8/4N3/4K3 w - - 0 1";
const BISHOP_KNIGHT = "7k/8/8/3q4/8/5N2/6B1/7K w - - 0 1";
const rows: readonly ControlLiteralPopulation[] = [
  ...COUNT_LITERAL_POPULATIONS,
  rulesInputs("start.white", `${START} w KQkq - 0 1`, ["e2e4"]),
  rulesInputs("start.black", `${START} b KQkq - 0 1`, ["e7e5"]),
  rulesInputs("pin.white", PIN, ["e1f1"]),
  rulesInputs("pin.black", "4k3/4n3/8/8/8/8/8/4R2K b - - 0 1", ["e8f8"]),
  rulesInputs("bishop-knight.white", BISHOP_KNIGHT, ["f3h4", "h1g1"]),
  rulesInputs("bishop-knight.black", "7k/6b1/5n2/8/3Q4/8/8/7K b - - 0 1", ["f6h5", "h8g8"]),
  rulesInputs("only-capture.white", "7k/8/8/8/8/8/6q1/7K w - - 0 1", ["h1g2"]),
  rulesInputs("only-capture.black", "7k/6Q1/8/8/8/8/8/7K b - - 0 1", ["h8g7"]),
];
const at = (square: string) => (Number(square[1]) - 1) * 8 + square.charCodeAt(0) - 97;
const owners = new Map<string, CandidatePopulationReceipt<CandidateWideScope>>();
function owner(fen: string) {
  let receipt = owners.get(fen);
  if (receipt !== undefined) return receipt;
  const compiled = compileCandidatePopulation({ beforeFen: fen, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (compiled.kind !== "ready") throw new Error(`Unavailable literal root: ${fen}`);
  receipt = compiled.receipt; owners.set(fen, receipt); return receipt;
}

describe("independent complete geometric control reference", () => {
  it("pins down the complete two-king table and explicit zero counts", () => {
    const white = Array<number>(64).fill(0), black = Array<number>(64).fill(0);
    for (const square of ["g1", "g2", "h2"]) white[at(square)] = 1;
    for (const square of ["g7", "h7", "g8"]) black[at(square)] = 1;
    expect(referenceControlCounts("7k/8/8/8/8/8/8/7K w - - 0 1")).toEqual({ white, black });
  });

  it("counts the first friendly blocker, not squares beyond it or pawn pushes", () => {
    const value = referenceControlCounts("7k/8/8/8/8/P7/8/R6K w - - 0 1");
    expect([value.white[at("a2")], value.white[at("a3")], value.white[at("a4")], value.white[at("b4")]]).toEqual([1, 1, 0, 1]);
    const start = referenceControlCounts(`${START} w KQkq - 0 1`);
    expect([start.white[at("e3")], start.white[at("f3")], start.white[at("e4")]]).toEqual([2, 3, 0]);
  });

  it("retains a pinned knight's geometric control while its legal destination is absent", () => {
    expect(referenceControlCounts(PIN).white[at("g3")]).toBe(1);
    const rules = Chess.fromSetup(parseFen(PIN).unwrap()).unwrap();
    expect(rules.dests(parseSquare("e2")!).has(parseSquare("g3")!)).toBe(false);
  });

  it("tracks the bishop line opened by moving its knight without grading that move", () => {
    const row = rows.find(value => value.id === "bishop-knight.white")!;
    const after = row.edges.find(([move]) => move === "f3h4")![1];
    expect(referenceControlCounts(BISHOP_KNIGHT).white[at("d5")]).toBe(0);
    expect(referenceControlCounts(after).white[at("d5")]).toBe(1);
  });

  for (const row of rows) for (const move of row.plays) it(`${row.id}/${move} compares every original square and every legal alternative`, () => {
    const receipt = owner(row.root), input = referenceControlInput(row, move);
    expect(input.population.alternatives.map(edge => edge.moveUci)).toEqual(receipt.packet.candidates.map(edge => edge.moveUci));
    expect(input.population.alternatives.map(edge => edge.afterFen)).toEqual(receipt.packet.candidates.map(edge => edge.afterFen));
    const result = invokeEvidenceValueRoute("derived.semantic_avoidance.direct_attack_count@2", { receipt, moveUci: move });
    const actual = readSubjectOutcomeInvocation(result);
    if (result.kind !== "available" || actual.population.kind !== "available") throw new Error("Expected a complete control population");
    expect(actual.population.population).toEqual(referenceControlPopulation(row, move));
    expect(actual.population.population.subjects).toHaveLength(128);
    expect(result.values.map(value => ({ sign: "avoided", operands: value.payload }))).toEqual(referenceControlEvents(row, move));
    if (row.id.startsWith("only-capture")) {
      expect(input.population.alternatives).toHaveLength(1);
      expect(result.values).toEqual([]); // Complete128-square availability is distinct from no differing outcome.
    }
  });
});
