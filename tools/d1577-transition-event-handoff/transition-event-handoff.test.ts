// DISPOSABLE research harness — D1577. Measures hand-off equivalence; it is not chess truth.
import { describe, expect, it } from "vitest";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import {
  derivedExchangeSemanticEvents,
  transitionReading,
  transitionSemanticFacts,
  type TransitionObservation,
  type TransitionSemanticFact,
} from "@chess-tabiya/runtime";

import { transitions } from "../r1r2-primitives-harness/corpus.js";

type GeometryFact = Extract<TransitionSemanticFact, {
  family: "occupied_attack" | "occupied_defence" | "slider_ray" | "piece_escape" | "defended_duty";
}>;

function add(map: Map<string, number>, key: string, amount = 1): void {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function observationGeometry(reading: readonly TransitionObservation[]): ReadonlyMap<string, number> {
  const result = new Map<string, number>();
  for (const value of reading) {
    if (value.kind === "move_irreversibility") continue;
    result.set(`${value.kind}:${value.color}:${value.direction}`, value.count);
  }
  return result;
}

function changedTargetCount(fact: GeometryFact): number {
  const before = new Set(fact.targets_before);
  const after = new Set(fact.targets_after);
  return fact.sign === "gained"
    ? [...after].filter((square) => !before.has(square)).length
    : [...before].filter((square) => !after.has(square)).length;
}

function factGeometry(facts: readonly TransitionSemanticFact[]): ReadonlyMap<string, number> {
  const result = new Map<string, number>();
  for (const fact of facts) {
    if (fact.family === "occupied_attack") add(result, `attacked_squares_changed:${String(fact.subject.color)}:${fact.sign}`);
    if (fact.family === "occupied_defence") add(result, `defended_squares_changed:${String(fact.subject.color)}:${fact.sign}`);
    if (fact.family === "slider_ray") add(result, `slider_lines_changed:${String(fact.subject.color)}:${fact.sign === "gained" ? "opened" : "closed"}`);
    if (fact.family === "piece_escape") add(result, `escape_squares_changed:${String(fact.subject.color)}:${fact.sign}`, changedTargetCount(fact));
    if (fact.family === "defended_duty") add(result, `defended_duties_changed:${String(fact.subject.color)}:${fact.sign === "gained" ? "acquired" : "released"}`);
  }
  return result;
}

function sortedEntries(map: ReadonlyMap<string, number>): readonly (readonly [string, number])[] {
  return [...map].filter(([, count]) => count > 0).sort(([left], [right]) => left.localeCompare(right));
}

function legacyRule(reading: readonly TransitionObservation[], subkind: "castled" | "clock_zeroed" | "last_of_role" | "pawn_break"): boolean {
  return reading.some((value) => value.kind === "move_irreversibility" && value.subkind === subkind);
}

function eventRule(facts: readonly TransitionSemanticFact[], subkind: "castled" | "clock_zeroed" | "last_of_role" | "pawn_break"): boolean {
  if (subkind === "castled") return facts.some((fact) => fact.family === "castled");
  if (subkind === "clock_zeroed") return facts.some((fact) => fact.family === "clock_reset");
  if (subkind === "last_of_role") return facts.some((fact) => fact.family === "last_of_role");
  const higherPriority = facts.some((fact) => fact.family === "castled" || fact.family === "last_of_role");
  return !higherPriority && facts.some((fact) => fact.family === "pawn_contact" || (fact.family === "capture" && fact.mover.role === "pawn"));
}

function hasSquareIdentity(fact: TransitionSemanticFact): boolean {
  if (["occupied_attack", "occupied_defence"].includes(fact.family)) {
    const value = fact as Extract<GeometryFact, { family: "occupied_attack" | "occupied_defence" }>;
    return typeof value.subject.target === "string" && value.targets_before.length + value.targets_after.length > 0;
  }
  if (fact.family === "slider_ray") return typeof fact.subject.slider === "string" && typeof fact.subject.endpoint === "string";
  if (fact.family === "piece_escape" || fact.family === "defended_duty") return typeof fact.subject.piece === "string" && fact.targets_before.length + fact.targets_after.length > 0;
  return "from" in fact && "to" in fact && typeof fact.from === "string" && typeof fact.to === "string";
}

describe("D1577 transition event hand-off", () => {
  it("reconstructs every legacy geometry count and irreversibility leaf from identity events", () => {
    const corpus = transitions();
    let legacyObservations = 0;
    let legacyWithSquares = 0;
    let semanticFacts = 0;
    let factsWithIdentity = 0;
    const familyCounts = new Map<string, number>();
    const legacyRuleCounts = new Map<string, number>();
    const eventRuleCounts = new Map<string, number>();

    for (const edge of corpus) {
      const reading = transitionReading(edge.parentFen, edge.uci, edge.fen);
      expect(reading, `${edge.pack}:${edge.uci}`).not.toBeNull();
      const observations = reading!.observations;
      const facts = transitionSemanticFacts(edge.parentFen, edge.uci, edge.fen);
      expect(sortedEntries(factGeometry(facts)), `${edge.pack}:${edge.uci}`).toEqual(sortedEntries(observationGeometry(observations)));

      legacyObservations += observations.length;
      legacyWithSquares += observations.filter((value) => "squares" in value && (value.squares?.length ?? 0) > 0).length;
      semanticFacts += facts.length;
      factsWithIdentity += facts.filter(hasSquareIdentity).length;
      for (const fact of facts) add(familyCounts, fact.family);

      for (const subkind of ["castled", "clock_zeroed", "last_of_role", "pawn_break"] as const) {
        const legacy = legacyRule(observations, subkind);
        const event = eventRule(facts, subkind);
        expect(event, `${edge.pack}:${edge.uci}:${subkind}`).toBe(legacy);
        if (legacy) add(legacyRuleCounts, subkind);
        if (event) add(eventRuleCounts, subkind);
      }
    }

    expect(legacyWithSquares).toBe(0);
    expect(factsWithIdentity).toBe(semanticFacts);
    expect(sortedEntries(eventRuleCounts)).toEqual(sortedEntries(legacyRuleCounts));
    expect([...familyCounts.keys()].sort()).toEqual([
      "capture", "castled", "checkmate", "clock_reset", "defended_duty", "developed", "last_of_role",
      "occupied_attack", "occupied_defence", "pawn_contact", "piece_escape", "slider_ray",
      "promotion",
    ].sort());

    console.log("D1577_HANDOFF", JSON.stringify({
      edges: corpus.length,
      legacyObservations,
      legacyWithSquares,
      semanticFacts,
      factsWithIdentity,
      familyCounts: Object.fromEntries([...familyCounts].sort(([left], [right]) => left.localeCompare(right))),
      legacyRuleCounts: Object.fromEntries([...legacyRuleCounts].sort(([left], [right]) => left.localeCompare(right))),
    }));
  });

  it("uses the existing exchange derivation for an en-passant victim square", () => {
    const before = "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1";
    const moveUci = "e5d6";
    const position = Chess.fromSetup(parseFen(before).unwrap()).unwrap();
    const move = parseUci(moveUci);
    if (move === undefined || !position.isLegal(move)) throw new TypeError("Invalid en-passant fixture");
    position.play(move);
    const after = makeFen(position.toSetup());
    const events = derivedExchangeSemanticEvents(before, moveUci, after);
    expect(events).toHaveLength(1);
    expect(events[0]!.operands.exchange.captured).toMatchObject({ color: "black", role: "pawn", square: "d5" });
    expect(events[0]!.operands.exchange.landingSquare).toBe("d6");
  });
});
