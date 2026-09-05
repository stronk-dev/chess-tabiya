import { describe, expect, it } from "vitest";

import {
  CANDIDATE_COLLECTOR_EXECUTION,
  CANDIDATE_PACKET_COMPILER_VERSION,
  CandidateReceiptCache,
  LEGAL_CONVENTION,
  assertCompiledCandidatePacket,
  candidatePacketIdentityInput,
  compileCandidatePopulation,
  measureRetainedGraph,
  measureRetainedValueForTest,
  parseCandidatePopulationRequest,
  planCandidateCollectors,
  projectWide,
  sealRetainedValueForTest,
} from "./model.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function compile(scope: "events" | "readings" | "events_and_readings" = "events_and_readings") {
  return compileCandidatePopulation(Object.freeze({ beforeFen: INITIAL, ruleset: "standard", scope }));
}

function roomyCache() {
  return new CandidateReceiptCache({
    maxEntries: 8,
    maxRetainedLogicalBytes: Number.MAX_SAFE_INTEGER,
    maxRetainedObjects: Number.MAX_SAFE_INTEGER,
  });
}

describe("D2678-D2684/D2841-D2842 candidate packet tenth author repair", () => {
  it("D2678 parses only the exact three-field request before compilation", () => {
    expect(parseCandidatePopulationRequest({ beforeFen: INITIAL, ruleset: "standard", scope: "events" })).toEqual({ beforeFen: INITIAL, ruleset: "standard", scope: "events" });
    for (const crossed of [
      { beforeFen: INITIAL, ruleset: "standard", scope: "events", afterFen: INITIAL },
      { beforeFen: INITIAL, ruleset: "standard", scope: "events", manifest: {} },
      { beforeFen: INITIAL, ruleset: "standard", scope: "events", legalMoves: [] },
    ]) expect(() => compileCandidatePopulation(crossed)).toThrow(/REQUEST_KEYS/u);
    expect(() => compileCandidatePopulation({ beforeFen: INITIAL, ruleset: "atomic", scope: "events" })).toThrow(/REQUEST_RULESET/u);
  });

  it("D2679 derives one 64-hex identity from every factual term", () => {
    const compiled = compile("events");
    expect(compiled.packet.id).toMatch(/^[0-9a-f]{64}$/u);
    expect(CANDIDATE_PACKET_COMPILER_VERSION).toBe("candidate-population-compiler@1");
    expect(LEGAL_CONVENTION).toBe("rules.mobility.reading.legal_moves@1");
    expect(Object.keys(candidatePacketIdentityInput(INITIAL, "events")).sort()).toEqual([
      "beforeFen", "compilerVersion", "legalConvention", "manifestDigest",
      "moveIdentityConvention", "ruleset", "scope",
    ]);
    expect(compiled.packet.beforeFen).toBe(INITIAL);
    expect(compile("readings").packet.id).not.toBe(compiled.packet.id);
  });

  it("D2680 direct and projected narrow packets retain the same dependency-closed graph", () => {
    const wide = compile("events_and_readings");
    for (const scope of ["events", "readings"] as const) {
      const direct = compile(scope);
      const projected = projectWide(wide, scope);
      expect(projected.packet.id).toBe(direct.packet.id);
      expect(projected.packet.candidates).toEqual(direct.packet.candidates);
      expect(measureRetainedGraph(projected)).toEqual(measureRetainedGraph(direct));
      const expectedCount = planCandidateCollectors(scope).length;
      expect(projected.references.candidateInputs.every((input) => input.executionOutcomes.length === expectedCount)).toBe(true);
    }
  });

  it("D2681/D2682 derives cache keys and admits only the privately asserted whole receipt", () => {
    const compiled = compile("events");
    const cache = roomyCache();
    expect(cache.admit(compiled).cache).toBe("miss");
    expect(cache.get(compiled.packet.id)).toBe(compiled);
    const crossed = Object.freeze({ ...compiled, packet: Object.freeze({ ...compiled.packet, beforeFen: "foreign" }) });
    expect(() => cache.admit(crossed as typeof compiled)).toThrow(/UNASSERTED_COMPILED_PACKET/u);
    expect(() => assertCompiledCandidatePacket({ ...compiled })).toThrow(/UNASSERTED_COMPILED_PACKET/u);
  });

  it("D2683 recursively seals nested values even when an ancestor arrived frozen", () => {
    const shallow = Object.freeze({ child: { move: "e2e4" } });
    expect(Object.isFrozen(shallow.child)).toBe(false);
    sealRetainedValueForTest(shallow);
    expect(Object.isFrozen(shallow.child)).toBe(true);
    const compiled = compile("events");
    const move = compiled.packet.legalMoves[0]!;
    expect(Object.isFrozen(compiled)).toBe(true);
    expect(Object.isFrozen(compiled.references)).toBe(true);
    expect(Object.isFrozen(compiled.references.legalMovesInput)).toBe(true);
    expect(Object.isFrozen(move)).toBe(true);
    expect(() => { (move as { uci: string }).uci = "a1a8"; }).toThrow();
  });

  it("D2684 executes all thirteen exact production-backed adapters over the complete legal set", () => {
    const compiled = compile("events_and_readings");
    expect(Object.keys(CANDIDATE_COLLECTOR_EXECUTION)).toHaveLength(13);
    expect(compiled.packet.legalMoves).toHaveLength(20);
    expect(compiled.references.candidateInputs).toHaveLength(20);
    expect(compiled.references.candidateInputs.every((input) => input.executionOutcomes.length === 13)).toBe(true);
    expect(compiled.packet.candidates.every((candidate) => candidate.events.length > 0 && candidate.readings.length >= 20)).toBe(true);
  });

  it("D2841 measures asserted production brands while refusing an arbitrary symbol", () => {
    const compiled = compile("events");
    expect(() => measureRetainedGraph(compiled)).not.toThrow();
    const event = compiled.packet.candidates[0]!.events[0]!;
    expect(Object.getOwnPropertySymbols(event)).toHaveLength(1);
    expect(Object.getOwnPropertySymbols(event.evidence)).toHaveLength(1);
    const symbol = Symbol("attacker");
    const crossedEvent = Object.freeze({ ...event, [symbol]: true });
    expect(() => measureRetainedValueForTest(crossedEvent)).toThrow(/UNASSERTED_SYMBOL_RETAINED_KEY/u);
    const hidden = { visible: true };
    Object.defineProperty(hidden, "hidden", { value: "x", enumerable: false });
    expect(() => measureRetainedValueForTest(Object.freeze(hidden))).toThrow(/ACCESSOR_RETAINED_KEY/u);
  });

  it("D2842 retains a production-asserted legal evidence value, not the old lookalike", () => {
    const compiled = compile("readings");
    expect(() => assertCompiledCandidatePacket(compiled)).not.toThrow();
    expect(Object.getOwnPropertySymbols(compiled.references.legalMovesInput)).toHaveLength(1);
    expect(compiled.references.legalMovesInput.payload.fen).toBe(INITIAL);
  });

  it("retains predecessor aggregate entry, logical-byte and object bounds", () => {
    const events = compile("events");
    const readings = compile("readings");
    const first = measureRetainedGraph(events);
    const second = measureRetainedGraph(readings);
    const cache = new CandidateReceiptCache({
      maxEntries: 8,
      maxRetainedLogicalBytes: Math.max(first.logicalUtf8Bytes, second.logicalUtf8Bytes),
      maxRetainedObjects: Number.MAX_SAFE_INTEGER,
    });
    expect(cache.admit(events).cache).toBe("miss");
    expect(cache.admit(readings).cache).toBe("miss");
    expect(cache.get(events.packet.id)).toBeUndefined();
    expect(cache.get(readings.packet.id)).toBe(readings);
  });
});
