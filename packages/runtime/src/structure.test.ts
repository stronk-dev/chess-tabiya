import fc from "fast-check";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { SquareName } from "chessops/types";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  createRun,
  evaluateObjectivePredicate,
  matchesStructuralExpression,
  matchesStructuralFeature,
  pawnSafety,
  structuralDelta,
  structuralReading,
  RULES_EVIDENCE_FACTS,
  STRUCTURAL_FEATURE_KINDS,
} from "./index.js";

const carlsbad = "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10";

function after(fen: string, moves: readonly string[]): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  for (const uci of moves) {
    const move = parseUci(uci);
    if (!move || !position.isLegal(move)) throw new TypeError(`illegal fixture move ${uci}`);
    position.play(move);
  }
  return makeFen(position.toSetup());
}

describe("structural predicates", () => {
  it("keeps the structural predicate and evidence vocabularies closed together", () => {
    expect(RULES_EVIDENCE_FACTS.filter((fact) => fact.startsWith("structure-")).map((fact) => fact.slice("structure-".length).replaceAll("-", "_"))).toEqual([...STRUCTURAL_FEATURE_KINDS]);
  });
  it("grades the Carlsbad minority signature only after the structural consequence", () => {
    const signature = { kind: "all", of: [
      { kind: "feature", feature: { kind: "backward_pawn", color: "black", file: "c" } },
      { kind: "feature", feature: { kind: "half_open_file", color: "white", file: "c" } },
    ] } as const;
    expect(matchesStructuralExpression(carlsbad, signature)).toBe(false);
    expect(matchesStructuralFeature(carlsbad, signature.of[0].feature)).toBe(false);
    expect(matchesStructuralFeature(carlsbad, signature.of[1].feature)).toBe(true);
    const goal = after(carlsbad, ["d7f8", "a2a3", "f6e4", "a1b1", "e4c3", "b2b4", "c8g4", "b4b5", "h7h6", "b5c6", "b7c6"]);
    expect(matchesStructuralFeature(goal, signature.of[0].feature)).toBe(true);
    expect(matchesStructuralExpression(goal, signature)).toBe(true);
  });

  it("makes the FEN predicate dispatch exhaustive instead of falling through to pawnStructure", () => {
    const run = createRun({ id: "structural-false", packId: "p", packDigest: `sha256:${"a".repeat(64)}`, startFen: carlsbad, seed: 1, createdAt: "2026-08-14T00:00:00.000Z", policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    expect(evaluateObjectivePredicate(run, { type: "fenPredicate", predicate: { type: "structuralFeature", feature: { kind: "feature", feature: { kind: "backward_pawn", color: "black", file: "c" } } } })).toBe(false);
  });

  it("reports current pawn-file scope and direct counts without balance claims", () => {
    const safety = pawnSafety("4k3/8/8/1N6/8/8/P7/4K3 w - - 0 1", "black", "b5");
    expect(safety.basis).toBe("current_pawn_files");
    expect(safety.pushAttackers).toEqual([{ square: "a2", pushes: 2 }]);
    const reading = structuralReading(carlsbad);
    expect(reading.features.some((item) => item.kind === "half_open_file" && item.color === "white" && item.file === "c")).toBe(true);
    expect(JSON.stringify(reading)).not.toMatch(/score|severity|favours|balance/);
  });

  it("records eviction distance changes without inventing permanence", () => {
    const a2 = "4k3/1p6/8/1n6/8/8/P7/4K3 w - - 0 1";
    const a3 = after(a2, ["a2a3"]);
    const delta = structuralDelta(a2, a3);
    const change = delta.evictionChanges.find((item) => item.square === "b5" && item.color === "black");
    expect(change).toMatchObject({ pushesBefore: 2, pushesAfter: 1 });
    expect(delta.gained).toEqual([]);
    expect(delta.lost).toEqual([]);
  });

  it("keeps pawn safety internally consistent over arbitrary squares", () => {
    const squares = Array.from({ length: 64 }, (_, index) => `${"abcdefgh"[index % 8]}${Math.floor(index / 8) + 1}` as SquareName);
    fc.assert(fc.property(fc.constantFrom(...squares), fc.constantFrom("white", "black"), (square, color) => {
      const result = pawnSafety(carlsbad, color, square);
      expect(result.safe).toBe(result.pushAttackers.length === 0);
      expect(result.pushAttackers.every((item) => item.pushes >= 0)).toBe(true);
    }));
  });

  it("records the structural reading envelope without a brittle microbenchmark", () => {
    const next = after(carlsbad, ["d7f8"]);
    const durations: number[] = [];
    for (let index = 0; index < 200; index += 1) {
      const started = performance.now();
      structuralReading(carlsbad);
      structuralDelta(carlsbad, next);
      durations.push(performance.now() - started);
    }
    durations.sort((a, b) => a - b);
    const medianMs = durations[Math.floor(durations.length / 2)]!;
    const maxMs = durations.at(-1)!;
    console.log(`STRUCTURAL_LATENCY ${JSON.stringify({ samples: durations.length, medianMs: Number(medianMs.toFixed(3)), maxMs: Number(maxMs.toFixed(3)) })}`);
    expect(durations).toHaveLength(200);
    expect(Number.isFinite(maxMs)).toBe(true);
  });
});
