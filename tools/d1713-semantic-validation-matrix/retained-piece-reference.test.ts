// Disposable D1716 independent reference checks. Not canonical source qualification.
import { describe, expect, it } from "vitest";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci } from "chessops/util";
import type { NormalMove } from "chessops/types";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation, type CandidatePopulationReceipt, type CandidateWideScope } from "../../packages/runtime/src/candidate-population.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { SLIDER_LITERAL_EXAMPLES } from "../../packages/runtime/src/semantic-validation-slider-sources.js";
import type { ControlLiteralPopulation } from "./direct-control-reference.js";
import { referenceLineEvents, referenceLinePopulation, referenceLineStates, referencePlacement, referenceRetainedPieces, retainedReferenceInput } from "./retained-piece-reference.js";

// The external rules library supplies legal inputs only, never expected lineage/ray values.
function rulesInputs(id: string, root: string, plays: readonly string[]): ControlLiteralPopulation {
  const position = Chess.fromSetup(parseFen(root).unwrap()).unwrap(), edges: [string, string][] = [];
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
const inputs = new Map<string, ControlLiteralPopulation>();
const owners = new Map<string, CandidatePopulationReceipt<CandidateWideScope>>();
function input(root: string) {
  let row = inputs.get(root);
  if (row === undefined) { row = rulesInputs(root, root, []); inputs.set(root, row); }
  return row;
}
function owner(root: string) {
  let result = owners.get(root);
  if (result !== undefined) return result;
  const compiled = compileCandidatePopulation({ beforeFen: root, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
  if (compiled.kind !== "ready") throw Error(`Expected complete legal population: ${root}`);
  result = compiled.receipt; owners.set(root, result); return result;
}

describe("independent full original-piece ray populations", () => {
  it("retains numeric square order, all piece roles, both colors and all eight signed directions", () => {
    const root = "7k/8/8/8/8/8/P7/1N5K w - - 0 1", states = referenceLineStates(root);
    expect([...referencePlacement(root).values()].map(piece => piece.square)).toEqual(["b1", "h1", "a2", "h8"]);
    expect(states).toHaveLength(32);
    expect(states.slice(0, 8).map(row => row.subject.direction)).toEqual([
      { df: -1, dr: -1 }, { df: -1, dr: 0 }, { df: -1, dr: 1 }, { df: 0, dr: -1 },
      { df: 0, dr: 1 }, { df: 1, dr: -1 }, { df: 1, dr: 0 }, { df: 1, dr: 1 },
    ]);
    expect(states.every(row => row.state.kind === "inapplicable" && row.state.reason === "role")).toBe(true);
  });

  it("includes blockers beyond the first, excludes the endpoint, and keeps near-to-far identities", () => {
    const states = referenceLineStates("n5k1/8/p7/8/b7/8/N7/R6K w - - 0 1");
    const ray = states.find(row => row.subject.root.square === "a1" && row.subject.direction.df === 0 && row.subject.direction.dr === 1)!.state;
    expect(ray).toEqual({ kind: "present", value: 3, ray: {
      slider: { color: "white", role: "rook", square: "a1" }, endpoint: "a8",
      strictInterior: ["a2", "a3", "a4", "a5", "a6", "a7"], blockers: [
        { color: "white", role: "knight", square: "a2" }, { color: "black", role: "bishop", square: "a4" }, { color: "black", role: "pawn", square: "a6" },
      ],
    } });
  });

  it("distinguishes a zero-length interior from an absent border ray and incompatible role", () => {
    const states = referenceLineStates("7k/7R/8/8/8/8/8/7K w - - 0 1");
    const pick = (root: string, df: number, dr: number) => states.find(row => row.subject.root.square === root && row.subject.direction.df === df && row.subject.direction.dr === dr)!.state;
    expect(pick("h7", 0, 1)).toMatchObject({ kind: "present", value: 0, ray: { endpoint: "h8", strictInterior: [], blockers: [] } });
    expect(pick("h7", 1, 0)).toMatchObject({ kind: "inapplicable", reason: "border" });
    expect(pick("h7", 1, 1)).toMatchObject({ kind: "inapplicable", reason: "role" });
  });

  it("preserves a captured rook's removed identity when an identical enemy rook occupies its square", () => {
    const example = SLIDER_LITERAL_EXAMPLES.find(row => row.id === "replacement.white")!;
    const retained = referenceRetainedPieces(example.beforeFen, example.afterFen, example.moveUci);
    expect(retained.find(row => row.root.square === "a8")).toEqual({ root: { color: "black", role: "rook", square: "a8" }, current: null });
    expect(retained.find(row => row.root.square === "a1")?.current).toEqual({ color: "white", role: "rook", square: "a8" });
    expect(referenceLineStates(example.beforeFen, example.afterFen, example.moveUci).filter(row => row.subject.root.square === "a8").map(row => row.state))
      .toEqual(Array.from({ length: 8 }, () => ({ kind: "removed", at: "a8" })));
  });

  it("rejects a wrong successor rather than matching an unrelated piece of the same role", () => {
    const example = SLIDER_LITERAL_EXAMPLES.find(row => row.id === "replacement.white")!;
    expect(() => referenceRetainedPieces(example.beforeFen, "1R4k1/8/8/8/8/8/8/7K b - - 0 1", example.moveUci)).toThrow("physical original");
  });

  for (const example of SLIDER_LITERAL_EXAMPLES) it(`${example.id}/${example.moveUci} keeps every root/direction and every legal successor`, () => {
    const row = input(example.beforeFen), receipt = owner(example.beforeFen);
    const literal = retainedReferenceInput("line_blockers", row, example.moveUci);
    expect(literal.population.played.afterFen).toBe(example.afterFen);
    expect(literal.population.alternatives.map(edge => [edge.moveUci, edge.afterFen]))
      .toEqual(receipt.packet.candidates.map(edge => [edge.moveUci, edge.afterFen]));
    // Hand-authored sparse membership examples independently anchor the complete table.
    const before = referenceLineStates(example.beforeFen), after = referenceLineStates(example.beforeFen, example.afterFen, example.moveUci);
    for (const change of example.events) {
      const direction = change.direction as { readonly df: number; readonly dr: number };
      const matches = (row: (typeof before)[number]) => row.subject.root.square === change.root.square
        && row.subject.direction.df === direction.df && row.subject.direction.dr === direction.dr;
      const original = before.find(matches)!.state, current = after.find(matches)!.state;
      expect(original.kind === "present" ? original.ray : null).toEqual(change.before);
      expect(current.kind === "present" ? current.ray : null).toEqual(change.after);
    }
    const source = invokeEvidenceValueRoute("derived.semantic_avoidance.line_blockers@2", { receipt, moveUci: example.moveUci });
    const invocation = readSubjectOutcomeInvocation(source);
    expect(invocation.receipt).toBe(receipt); expect(invocation.inputs[0]).toBe(receipt.legalMovesInput);
    if (source.kind !== "available" || invocation.population.kind !== "available") throw Error("Complete ray population must be available");
    const expected = referenceLinePopulation(row, example.moveUci);
    expect(expected.subjects).toHaveLength(referencePlacement(example.beforeFen).size * 8);
    expect(invocation.population.population).toEqual(expected);
    expect(source.values.map(value => ({ sign: "avoided", operands: value.payload }))).toEqual(referenceLineEvents(row, example.moveUci));
    if (example.id.startsWith("promotion-")) {
      const pawn = expected.subjects.filter(subject => subject.subject.root.role === "pawn");
      expect(pawn).toHaveLength(8); expect(pawn.every(subject => subject.playedRelation === "not_comparable")).toBe(true);
    }
    if (example.id.startsWith("no-sliders")) {
      expect(expected.subjects).toHaveLength(16); expect(source.values).toEqual([]);
    }
  });
});
