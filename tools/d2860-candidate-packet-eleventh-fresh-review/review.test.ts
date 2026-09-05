import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import * as candidate from "../d2678-candidate-packet-tenth-author-repair/model.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const CHECKMATE = "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1";
const STALEMATE = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
const source = readFileSync("tools/d2678-candidate-packet-tenth-author-repair/model.ts", "utf8");
const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");

function compile(scope: "events" | "readings" | "events_and_readings" = "events_and_readings") {
  return candidate.compileCandidatePopulation({ beforeFen: INITIAL, ruleset: "standard", scope });
}

describe("candidate-packet tenth repair eleventh fresh-review return", () => {
  it("D2860 the current checkpoint drops the public service and every request-time result arm", () => {
    expect(rfc).toContain("export function createCandidatePopulationService(");
    expect(rfc).toContain('readonly kind: "cancelled"');
    expect(rfc).toContain('readonly code: "deadline_exceeded"');
    expect("createCandidatePopulationService" in candidate).toBe(false);
    expect("CandidatePopulationResult" in candidate).toBe(false);
    expect("CandidatePopulationServiceStats" in candidate).toBe(false);

    const compiled = compile("events");
    const cache = new candidate.CandidateReceiptCache({
      maxEntries: 2,
      maxRetainedLogicalBytes: Number.MAX_SAFE_INTEGER,
      maxRetainedObjects: Number.MAX_SAFE_INTEGER,
    });
    expect(cache.admit(compiled).cache).toBe("miss");
    expect(cache.admit(compiled).cache).toBe("miss");
  });

  it("D2861 packet identity hashes seven terms but retains only three of them", () => {
    const packet = compile("events").packet as unknown as Record<string, unknown>;
    expect(Object.keys(candidate.candidatePacketIdentityInput(INITIAL, "events")).sort()).toEqual([
      "beforeFen", "compilerVersion", "legalConvention", "manifestDigest",
      "moveIdentityConvention", "ruleset", "scope",
    ]);
    expect(Object.keys(packet).sort()).toEqual([
      "beforeFen", "candidates", "id", "legalMoves", "ruleset", "scope",
    ]);
    for (const missing of ["compilerVersion", "legalConvention", "manifestDigest", "moveIdentityConvention"]) {
      expect(packet).not.toHaveProperty(missing);
    }
  });

  it("D2862 collector outcomes have no projection/result authority and abstention is unreachable", () => {
    const compiled = compile();
    const outcomes = compiled.references.candidateInputs.flatMap((input) => input.executionOutcomes);
    expect(outcomes.length).toBeGreaterThan(0);
    expect(outcomes.every((outcome) => !("projection" in outcome) && !("result" in outcome))).toBe(true);
    expect(compiled.packet.candidates.every((row) => row.abstentions.length === 0)).toBe(true);
    expect(source).not.toContain("CANDIDATE_PACKET_ABSTENTION_REASONS");
    expect(rfc).toContain("Available-empty");
    expect(rfc).toContain("Every abstention also retains the exact private-sealed collector outcome");
  });

  it("D2863 checkmate and stalemate collapse to indistinguishable anonymous empty packets", () => {
    const mate = candidate.compileCandidatePopulation({ beforeFen: CHECKMATE, ruleset: "standard", scope: "events" }).packet as unknown as Record<string, unknown>;
    const stale = candidate.compileCandidatePopulation({ beforeFen: STALEMATE, ruleset: "standard", scope: "events" }).packet as unknown as Record<string, unknown>;
    expect(mate.candidates).toEqual([]);
    expect(stale.candidates).toEqual([]);
    expect(mate).not.toHaveProperty("terminal");
    expect(stale).not.toHaveProperty("terminal");
    expect(rfc).toContain("A checkmate root yields zero candidates **with**");
  });
});
