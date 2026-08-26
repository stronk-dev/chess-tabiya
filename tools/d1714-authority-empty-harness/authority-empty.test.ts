// DISPOSABLE research harness — D1714. Not production code.
import { between } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { makeUci, parseSquare } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  breadthSemanticEvents,
  declareRunRecordEvidence,
  defenderConsequenceOperands,
  defenderConsequenceSemanticEvent,
  harassmentPressureSemanticEvent,
  harassmentPressureSequence,
  legalAlternativeEdges,
  localSemanticEvents,
  pawnIslandSemanticEvents,
  selectLocalSemanticEvidence,
  structuralSemanticEvents,
  type RecordedMoveAnchor,
} from "@chess-tabiya/runtime";

import { playedFen } from "../research-chess/populations.js";

const AUTHORITY_EMPTY_IDS = Object.freeze([
  "rules.structural.event.line_blockers",
  "rules.transition.event.piece_escape",
  "rules.transition.event.developed",
  "derived.semantic_avoidance.half_open_file",
  "derived.semantic_avoidance.isolated_pawn",
  "derived.semantic_avoidance.king_opposition",
  "derived.semantic_avoidance.king_zone",
  "derived.semantic_avoidance.passed_pawn",
  "derived.semantic_avoidance.piece_count",
  "derived.semantic_avoidance.pawn_islands",
  "derived.pawn.event.transitions",
  "derived.pawn.sequence.harassment_pressure",
  "derived.tactic.sequence.defender_consequence",
  "derived.king.captured_zone_defender",
] as const);

const AVOIDANCE_IDS = AUTHORITY_EMPTY_IDS.filter((id) => id.startsWith("derived.semantic_avoidance."));
const AVOIDANCE_FIXTURES = Object.freeze([
  { id: "derived.semantic_avoidance.isolated_pawn", beforeFen: "r1b1r1k1/1p4pp/2p1pq2/1p1p4/P2P4/2QBP3/5PPP/1R3RK1 w - - 0 19", moveUci: "a4b5", sign: "preserved", numerator: 41, denominator: 41 },
  { id: "derived.semantic_avoidance.king_opposition", beforeFen: "rnbq1bnr/1pppkppp/p3p3/8/5P1P/8/PPPPP1P1/RNBQKBNR w KQ - 1 4", moveUci: "e1f2", sign: "gained", numerator: 20, denominator: 20 },
  { id: "derived.semantic_avoidance.pawn_islands", beforeFen: "rnbq1bnr/1pppkp1p/p3p3/6p1/5P1P/3P4/PPP1P1P1/RNBQKBNR w KQ - 0 5", moveUci: "f4g5", sign: "preserved", numerator: 26, denominator: 26 },
  { id: "derived.semantic_avoidance.half_open_file", beforeFen: "1nbq1b1r/r1ppkp1p/1p2pnP1/p7/P6P/3P3R/1PPBP1P1/RN1QKBN1 b Q - 0 9", moveUci: "f7g6", sign: "preserved", numerator: 28, denominator: 28 },
  { id: "derived.semantic_avoidance.king_zone", beforeFen: "1nbq1b1r/r2p1p1p/1ppkpnP1/p7/P6P/3P3R/1PP1P1P1/RNBQKBN1 w Q - 2 11", moveUci: "e1f2", sign: "preserved", numerator: 30, denominator: 31 },
  { id: "derived.semantic_avoidance.passed_pawn", beforeFen: "2b5/1pp1r3/1nk1ppp1/3pbPP1/3P3p/1P1qNK1P/r7/N3RR2 w - - 1 38", moveUci: "e1b1", sign: "gained", numerator: 4, denominator: 13 },
  { id: "derived.semantic_avoidance.piece_count", beforeFen: "2b5/1pp1r3/1nk1ppp1/3pbPP1/3P2Kp/1P1qN2P/2r5/NR3R2 w - - 5 40", moveUci: "b1b2", sign: "lost", numerator: 8, denominator: 24 },
] as const);
const LOCAL_FIXTURES = Object.freeze([
  { id: "rules.structural.event.line_blockers", beforeFen: "rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4", moveUci: "d4c5", sign: "lost" },
  { id: "rules.transition.event.piece_escape", beforeFen: "rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4", moveUci: "d4c5", sign: "gained" },
  { id: "derived.pawn.event.transitions", beforeFen: "rnbqkbnr/pp2pppp/8/2ppP3/3P4/8/PPP2PPP/RNBQKBNR w KQkq - 0 4", moveUci: "d4c5", sign: "state" },
  { id: "rules.transition.event.developed", beforeFen: "rnbqkbnr/pp2pppp/8/2PpP3/8/8/PPP2PPP/RNBQKBNR b KQkq - 0 4", moveUci: "b8c6", sign: "gained" },
  { id: "derived.king.captured_zone_defender", beforeFen: "r1bqrnk1/pp2bppp/2p5/3p2B1/3Pn3/2NBP3/PPQ1NPPP/1R3RK1 w - - 10 12", moveUci: "g5e7", sign: "state" },
] as const);

function anchorsFromUci(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  let current = fen;
  return moves.map((moveUci, index) => {
    const afterFen = playedFen(current, moveUci);
    const value = Object.freeze({ beforeNodeId: `u${index}`, afterNodeId: `u${index + 1}`, beforeFen: current, moveUci, afterFen });
    current = afterFen;
    return value;
  });
}

function anchorsFromSan(sans: readonly string[]): readonly RecordedMoveAnchor[] {
  const position = Chess.default();
  return sans.map((san, index) => {
    const beforeFen = makeFen(position.toSetup());
    const move = parseSan(position, san)!;
    expect(position.isLegal(move)).toBe(true);
    const moveUci = makeUci(move);
    position.play(move);
    return Object.freeze({ beforeNodeId: `s${index}`, afterNodeId: `s${index + 1}`, beforeFen, moveUci, afterFen: makeFen(position.toSetup()) });
  });
}

function moveEvidence(path: readonly RecordedMoveAnchor[]) {
  return path.map((anchor, offset) => declareRunRecordEvidence("move", { context: "D1714 fixture", offset, moveSan: anchor.moveUci }));
}

describe("D1714 authority-empty semantic events", () => {
  it("keeps the authority-empty root and seven-event avoidance subset explicit", () => {
    expect(AUTHORITY_EMPTY_IDS).toHaveLength(14);
    expect(AVOIDANCE_IDS).toHaveLength(7);
    expect(new Set(AUTHORITY_EMPTY_IDS).size).toBe(14);
  });

  it("pins five legal positives through the local emitter boundary", () => {
    const wanted = AUTHORITY_EMPTY_IDS.filter((id) => !id.startsWith("derived.semantic_avoidance.") && !id.includes("sequence."));
    expect(new Set(LOCAL_FIXTURES.map((fixture) => fixture.id))).toEqual(new Set(wanted));
    for (const fixture of LOCAL_FIXTURES) {
      const afterFen = playedFen(fixture.beforeFen, fixture.moveUci);
      expect(localSemanticEvents(fixture.beforeFen, fixture.moveUci, afterFen).some((event) => event.projection.id === fixture.id && event.sign === fixture.sign), fixture.id).toBe(true);
    }
  });

  it("reaches nearby legal local-emitter negatives without corrupting an operand", () => {
    const kingOnly = anchorsFromUci("4k3/8/8/8/8/8/8/4K3 w - - 0 1", ["e1d1"])[0]!;
    const openingPawn = anchorsFromUci("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", ["e2e4"])[0]!;
    const remotePawn = anchorsFromUci("k7/8/8/8/8/8/4P3/K7 w - - 0 1", ["e2e3"])[0]!;
    const cases = [
      { id: "rules.structural.event.line_blockers", edge: kingOnly },
      { id: "rules.transition.event.piece_escape", edge: remotePawn },
      { id: "rules.transition.event.developed", edge: openingPawn },
      { id: "derived.king.captured_zone_defender", edge: kingOnly },
    ] as const;
    for (const value of cases) expect(localSemanticEvents(value.edge.beforeFen, value.edge.moveUci, value.edge.afterFen).some((event) => event.projection.id === value.id), value.id).toBe(false);
  });

  it("emits all seven avoidance families and reaches a nearby same-sign semantic negative", () => {
    expect(new Set(AVOIDANCE_FIXTURES.map((fixture) => fixture.id))).toEqual(new Set(AVOIDANCE_IDS));
    for (const fixture of AVOIDANCE_FIXTURES) {
      const afterFen = playedFen(fixture.beforeFen, fixture.moveUci);
      const result = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, { beforeFen: fixture.beforeFen, moveUci: fixture.moveUci, afterFen });
      const avoided = result.selected.find((fact) => fact.kind === "counterfactual_absence" && fact.event.projection.id === fixture.id && fact.event.operands.family.sign === fixture.sign);
      expect(avoided, fixture.id).toMatchObject({ event: { operands: { alternativesWithFamily: fixture.numerator, legalAlternatives: fixture.denominator } } });

      const source = fixture.id.replace(/^derived\.semantic_avoidance\./u, "rules.structural.event.");
      const playedFamily = [...structuralSemanticEvents(fixture.beforeFen, fixture.moveUci, afterFen), ...pawnIslandSemanticEvents(fixture.beforeFen, fixture.moveUci, afterFen)].filter((event) => event.projection.id === source);
      if (fixture.sign === "preserved") expect(playedFamily.length, `${fixture.id} retained family`).toBeGreaterThan(0);
      const alternative = legalAlternativeEdges(fixture.beforeFen, fixture.moveUci).find((edge) =>
        [...structuralSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen), ...pawnIslandSemanticEvents(edge.beforeFen, edge.moveUci, edge.afterFen)]
          .some((event) => event.projection.id === source && event.sign === fixture.sign),
      )!;
      expect(alternative, `${fixture.id} negative`).toBeDefined();
      const negative = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, alternative);
      expect(negative.selected.some((fact) => fact.kind === "counterfactual_absence" && fact.event.projection.id === fixture.id && fact.event.operands.family.sign === fixture.sign), fixture.id).toBe(false);
    }

    const isolated = AVOIDANCE_FIXTURES[0];
    const isolatedAfter = playedFen(isolated.beforeFen, isolated.moveUci);
    expect(structuralSemanticEvents(isolated.beforeFen, isolated.moveUci, isolatedAfter).filter((event) => event.projection.id === "rules.structural.event.isolated_pawn").map((event) => event.sign).sort()).toEqual(["gained", "lost"]);
    const isolatedResult = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, { beforeFen: isolated.beforeFen, moveUci: isolated.moveUci, afterFen: isolatedAfter });
    const isolatedAvoidance = isolatedResult.selected.find((fact) => fact.kind === "counterfactual_absence" && fact.event.projection.id === isolated.id);
    expect(isolatedAvoidance?.kind).toBe("counterfactual_absence");
    if (isolatedAvoidance?.kind === "counterfactual_absence") expect(isolatedAvoidance.event.operands.alternativeEvents.every((event) => (event.operands as { readonly before?: { readonly file?: string }; readonly after?: { readonly file?: string } }).before?.file === "a" && (event.operands as { readonly after?: { readonly file?: string } }).after?.file === "a")).toBe(true);
  });

  it("reaches the two isolated sequence constructors from real predicate outputs", () => {
    const harassmentPath = anchorsFromSan(["d4", "d5", "Nf3", "Nf6", "e3", "Bg4", "h3", "Bh5"]).slice(6, 8);
    const harassment = harassmentPressureSequence(harassmentPath)!;
    expect(harassmentPressureSemanticEvent(harassment, moveEvidence(harassmentPath)).projection.id).toBe("derived.pawn.sequence.harassment_pressure");

    const defenderPath = anchorsFromUci("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", ["c5b6", "e8d7", "a1a8"]);
    const defender = defenderConsequenceOperands(defenderPath)[0]!;
    expect(defenderConsequenceSemanticEvent(defender, moveEvidence(defenderPath)).projection.id).toBe("derived.tactic.sequence.defender_consequence");

    const brokenHarassment = anchorsFromSan(["d4", "d5", "Nf3", "Nf6", "e3", "Bg4", "h3", "Bf5"]).slice(6, 8);
    expect(harassmentPressureSequence(brokenHarassment)).toBeUndefined();
    const brokenDefender = anchorsFromUci("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", ["c5b6", "a8a7", "a1a7"]);
    expect(defenderConsequenceOperands(brokenDefender)).toEqual([]);
  });

  it("proves the current distant-opposition event ignores occupied intervening squares", () => {
    const fixture = AVOIDANCE_FIXTURES.find((value) => value.id === "derived.semantic_avoidance.king_opposition")!;
    const result = selectLocalSemanticEvidence({ id: "research.r2_candidate", version: 1 }, { beforeFen: fixture.beforeFen, moveUci: fixture.moveUci, afterFen: playedFen(fixture.beforeFen, fixture.moveUci) });
    const avoided = result.selected.find((fact) => fact.kind === "counterfactual_absence" && fact.event.projection.id === fixture.id);
    expect(avoided?.kind).toBe("counterfactual_absence");
    if (avoided?.kind !== "counterfactual_absence") return;
    expect(avoided.event.operands.alternativesWithFamily).toBe(20);
    for (const event of avoided.event.operands.alternativeEvents) {
      const operands = event.operands as { readonly after: { readonly squares: readonly string[]; readonly form?: string } | null };
      expect(operands.after).toMatchObject({ squares: ["e1", "e7"], form: "distant" });
      const position = Chess.fromSetup(parseFen(event.anchor.afterFen).unwrap()).unwrap();
      expect(between(parseSquare("e1")!, parseSquare("e7")!).intersect(position.board.occupied).isEmpty()).toBe(false);
    }
  });

  it("checks an explicit pawn-transition positive and a quiet negative through breadth emission", () => {
    const positive = anchorsFromUci("4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1", ["e4d5"])[0]!;
    expect(breadthSemanticEvents(positive.beforeFen, positive.moveUci, positive.afterFen).some((event) => event.projection.id === "derived.pawn.event.transitions")).toBe(true);
    const negative = anchorsFromUci("4k3/8/8/8/4P3/8/8/4K3 w - - 0 1", ["e1d1"])[0]!;
    expect(breadthSemanticEvents(negative.beforeFen, negative.moveUci, negative.afterFen).some((event) => event.projection.id === "derived.pawn.event.transitions")).toBe(false);
  });

});
