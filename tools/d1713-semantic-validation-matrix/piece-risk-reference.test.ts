// Disposable D1716 risk proof preparation. External rules inputs are not risk labels.
import { describe, expect, it } from "vitest";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import type { NormalMove } from "chessops/types";
import { CANDIDATE_WIDE_SCOPE, compileCandidatePopulation } from "../../packages/runtime/src/candidate-population.js";
import { invokeEvidenceValueRoute, readSubjectOutcomeInvocation } from "../../packages/runtime/src/internal/evidence-value-routes.js";
import { SLIDER_LITERAL_EXAMPLES } from "../../packages/runtime/src/semantic-validation-slider-sources.js";
import type { ControlLiteralPopulation } from "./direct-control-reference.js";
import { retainedReferenceInput } from "./retained-piece-reference.js";
import { referenceExchangeUnits, referenceRiskCaptures, referenceRiskEvents, referenceRiskPopulation, referenceRiskStates } from "./piece-risk-reference.js";

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
// Input geometry only. No expected boolean, material result, lineage or event is mirrored.
const mirrorMove = (value: string) => value.replace(/[1-8]/gu, digit => String(9 - Number(digit)));
function mirroredInput(root: string) {
  const [board, turn, rights, ep, half, full] = root.split(" ");
  const swap = (text: string) => [...text].map(char => char === char.toLowerCase() ? char.toUpperCase() : char.toLowerCase()).join("");
  return [swap(board!.split("/").reverse().join("/")), turn === "w" ? "b" : "w", swap(rights!), mirrorMove(ep!), half, full].join(" ");
}
const seeds = [
  { id: "capture", root: "7k/8/8/3p4/2P5/8/3P4/7K w - - 0 1", plays: ["c4d5", "h1g1", "d2d4"] },
  { id: "defended-profit", root: "7k/8/8/4p3/3Q4/2P5/8/7K w - - 0 1", plays: ["d4d3", "h1g1"] },
  { id: "unprofitable", root: "7k/8/8/4q3/3P4/2P5/8/7K w - - 0 1", plays: ["d4d5", "c3c4"] },
  { id: "zero", root: "7k/8/8/4p3/3P4/2P5/8/7K w - - 0 1", plays: ["d4d5", "h1g1"] },
  { id: "pin", root: "4k3/4n3/2N5/8/8/8/7P/4R2K w - - 7 1", plays: ["h2h3", "c6b4"] },
  { id: "unpin", root: "5k2/4n3/2N5/8/8/8/7P/4R2K w - - 7 1", plays: ["h2h3", "c6b4"] },
  { id: "ep-double-push", root: "7k/8/8/8/3p4/8/4P3/7K w - - 0 1", plays: ["e2e4", "e2e3", "h1g1"] },
  { id: "ep-pinned", root: "3k4/8/8/8/3p4/8/4P3/3R3K w - - 0 1", plays: ["e2e4", "h1g1"] },
  { id: "capture-promotion", root: "7k/8/8/8/8/8/2p5/3R3K w - - 0 1", plays: ["d1d2", "h1g1"] },
  { id: "promotion", root: "7r/P7/7k/8/8/8/8/7K w - - 0 1", plays: ["a7a8b", "a7a8n", "a7a8q", "a7a8r"] },
  { id: "uniform-true", root: "7k/8/8/8/8/p1n5/P7/7K w - - 0 1", plays: ["h1g1"] },
  { id: "uniform-false", root: "7k/8/8/8/8/8/P7/1N5K w - - 0 1", plays: ["h1g1"] },
  { id: "empty", root: "7k/8/8/8/8/8/8/7K w - - 0 1", plays: ["h1g1"] },
  { id: "invalid-empty", root: "7k/8/8/8/8/8/4r3/4K3 w - - 0 1", plays: ["e1e2", "e1f1"] },
  { id: "invalid-own-piece", root: "7k/8/8/8/8/8/P3r3/4K3 w - - 0 1", plays: ["e1e2"] },
] as const;
const rows = [
  ...seeds.flatMap(row => [rulesInputs(`${row.id}.white`, row.root, row.plays), rulesInputs(`${row.id}.black`, mirroredInput(row.root), row.plays.map(mirrorMove))]),
  ...SLIDER_LITERAL_EXAMPLES.filter(row => /^(castle-|stationary-|crossing\.)/u.test(row.id))
    .map(row => rulesInputs(row.id, row.beforeFen, [row.moveUci])),
];

describe("independent original-own-piece legal-exchange risk", () => {
  it("anchors positive, zero and negative exchanges in declared units", () => {
    expect(referenceExchangeUnits("7k/8/8/4p3/3Q4/2P5/8/7K b - - 0 1", "e5d4")).toBe(8);
    expect(referenceExchangeUnits("7k/8/8/4p3/3P4/2P5/8/7K b - - 0 1", "e5d4")).toBe(0);
    expect(referenceExchangeUnits("7k/8/8/4q3/3P4/2P5/8/7K b - - 0 1", "e5d4")).toBe(-8);
    expect(referenceExchangeUnits("7k/8/8/4p3/3P4/2P5/8/7K b - - 0 1", "h8g8")).toBeUndefined();
  });

  it("does not turn a pinned geometric attacker into a legal profitable capturer", () => {
    const pinned = seeds.find(row => row.id === "pin")!, unpinned = seeds.find(row => row.id === "unpin")!;
    expect(referenceRiskCaptures(pinned.root, "white")!.some(row => row.moveUci === "e7c6")).toBe(false);
    expect(referenceRiskCaptures(unpinned.root, "white")).toContainEqual({ moveUci: "e7c6", victimSquare: "c6", landingSquare: "c6", resultUnits: 3 });
    expect(referenceRiskStates(pinned.root)!.find(row => row.subject.root.square === "c6")!.state.value).toBe(false);
    expect(referenceRiskStates(unpinned.root)!.find(row => row.subject.root.square === "c6")!.state.value).toBe(true);
  });

  it("joins genuine child EP to the original pawn victim, not the empty landing square", () => {
    const row = rows.find(row => row.id === "ep-double-push.white")!, edge = row.edges.find(([move]) => move === "e2e4")!;
    expect(referenceRiskCaptures(edge[1], "white")).toContainEqual({ moveUci: "d4e3", victimSquare: "e4", landingSquare: "e3", resultUnits: 1 });
    const state = referenceRiskStates(row.root, edge[1], edge[0])!;
    expect(state).toHaveLength(1);
    expect(state[0]).toMatchObject({ subject: { root: { square: "e2", role: "pawn" } }, state: { value: true, current: { square: "e4", role: "pawn" } } });
    expect(referenceRiskStates(row.root)![0]!.state.value).toBe(false);
  });

  it("keeps a defended piece at risk and an attacked piece safe when the exchange says so", () => {
    const defended = seeds.find(row => row.id === "defended-profit")!, zero = seeds.find(row => row.id === "zero")!;
    expect(referenceRiskStates(defended.root)!.find(row => row.subject.root.square === "d4")!.state.value).toBe(true);
    expect(referenceRiskStates(zero.root)!.find(row => row.subject.root.square === "d4")!.state.value).toBe(false);
  });

  it("scores every legal capture-promotion choice without a queen-only shortcut", () => {
    const fen = "7k/8/8/8/8/8/2p5/3R3K b - - 0 1";
    expect(["b", "n", "q", "r"].map(promotion => referenceExchangeUnits(fen, `c2d1${promotion}`))).toEqual([7, 7, 13, 9]);
    expect(referenceRiskCaptures(seeds.find(row => row.id === "capture-promotion")!.root, "white")!.filter(row => row.victimSquare === "d1").map(row => row.moveUci).sort())
      .toEqual(["c2d1b", "c2d1n", "c2d1q", "c2d1r"]);
  });

  it("does not invent an EP capture that exposes its own king", () => {
    const row = rows.find(row => row.id === "ep-pinned.white")!, edge = row.edges.find(([move]) => move === "e2e4")!;
    expect(referenceRiskCaptures(edge[1], "white")!.some(row => row.moveUci === "d4e3")).toBe(false);
    expect(referenceRiskStates(row.root, edge[1], edge[0])!.find(row => row.subject.root.square === "e2")!.state.value).toBe(false);
  });

  it("retains numeric own-original order rather than the sparse reading's lexicographic square order", () => {
    expect(referenceRiskStates(seeds.find(row => row.id === "uniform-false")!.root)!.map(row => row.subject.root.square)).toEqual(["b1", "a2"]);
  });

  it("lets the minimizing side decline an available but losing recapture", () => {
    const fen = "7k/6b1/8/4p3/3P4/8/8/3R3K b - - 0 1", position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    expect(referenceExchangeUnits(fen, "e5d4")).toBe(1);
    for (const uci of ["e5d4", "d1d4", "g7d4"]) {
      const move = parseUci(uci)!;
      expect(position.isLegal(move), uci).toBe(true);
      if (uci === "d1d4") expect(referenceExchangeUnits(makeFen(position.toSetup()), uci)).toBe(-4);
      position.play(move);
    }
    // Forcing the complete line would give Black1-1+5=5; optional White stop keeps1.
  });

  it("lets the maximizing side decline a legal continuation that worsens its balance", () => {
    const fen = "7k/6b1/8/4q3/3P4/2P5/8/3R3K b - - 0 1", position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    expect(referenceExchangeUnits(fen, "e5d4")).toBe(-8);
    for (const uci of ["e5d4", "c3d4", "g7d4", "d1d4"]) {
      const move = parseUci(uci)!;
      expect(position.isLegal(move), uci).toBe(true);
      if (uci === "c3d4") expect(referenceExchangeUnits(makeFen(position.toSetup()), uci)).toBe(9);
      if (uci === "g7d4") expect(referenceExchangeUnits(makeFen(position.toSetup()), uci)).toBe(-2);
      position.play(move);
    }
    // Black stops at1-9=-8; forcing Bxd4/Rxd4 would worsen that to1-9+1-3=-10.
  });

  for (const row of rows) for (const move of row.plays) it(`${row.id}/${move} compares every own original over every legal alternative`, () => {
    const compiled = compileCandidatePopulation({ beforeFen: row.root, ruleset: "standard", scope: CANDIDATE_WIDE_SCOPE });
    if (compiled.kind !== "ready") throw Error("Complete root required");
    const receipt = compiled.receipt, input = retainedReferenceInput("loose_piece", row, move);
    expect(input.population.alternatives.map(edge => [edge.moveUci, edge.afterFen]))
      .toEqual(receipt.packet.candidates.map(edge => [edge.moveUci, edge.afterFen]));
    const source = invokeEvidenceValueRoute("derived.semantic_avoidance.loose_piece@2", { receipt, moveUci: move });
    const invocation = readSubjectOutcomeInvocation(source), expected = referenceRiskPopulation(row, move);
    expect(invocation.receipt).toBe(receipt);
    if (expected === undefined) {
      expect(row.id.startsWith("invalid-")).toBe(true);
      expect(source.kind).toBe("unavailable"); expect(invocation.population.kind).toBe("unavailable");
      expect(invocation.inputs).toEqual([]);
      expect(referenceRiskEvents(row, move)).toBeUndefined(); return;
    }
    if (source.kind !== "available" || invocation.population.kind !== "available") throw Error("Expected available risk domain");
    expect(invocation.inputs[0]).toBe(receipt.legalMovesInput);
    expect(invocation.population.population).toEqual(expected);
    expect(source.values.map(value => ({ sign: "avoided", operands: value.payload }))).toEqual(referenceRiskEvents(row, move));
    if (row.id.startsWith("uniform-") || row.id.startsWith("empty.")) expect(source.values).toEqual([]);
    if (row.id.startsWith("uniform-true")) expect(expected.subjects.every(subject => subject.root.value && subject.played.value && subject.alternatives.every(edge => edge.state.value))).toBe(true);
    if (row.id.startsWith("empty.")) expect(expected.subjects).toEqual([]);
    if (row.id.startsWith("promotion.")) expect(expected.subjects[0]).toMatchObject({
      subject: { root: { role: "pawn" } }, played: { kind: "present", value: true, current: { role: { b: "bishop", n: "knight", q: "queen", r: "rook" }[move[4]!] } }, playedRelation: "false_to_true",
    });
  });
});
