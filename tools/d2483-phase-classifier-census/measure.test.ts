import { describe, expect, it } from "vitest";

import type { DrillPackDefinition } from "../../packages/schema/src/drill-pack/index.js";
import { phaseCensus } from "./census.js";

function pack(id: string, phase: DrillPackDefinition["phase"], fen: string): DrillPackDefinition {
  return {
    id,
    version: "0.1.0",
    title: id,
    mode: "plan",
    phase,
    start: { fen, sideToMove: "white" },
    objective: { type: "hold", text: "fixture", successConditions: [] },
    opponent: { kind: "human_common", targetElo: 1500 },
    spine: [],
    checkpoints: [],
    deviations: [],
    feedbackClaims: [],
    provenance: { license: "CC0-1.0", sources: [] },
    status: "draft",
    graduation: [],
  } as unknown as DrillPackDefinition;
}

describe("phase classifier corpus census", () => {
  it("separates match, abstention and mismatch without grading cross-phase packs", () => {
    const report = phaseCensus([
      pack("opening", "opening", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
      pack("endgame", "endgame", "4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1"),
      pack("unclear", "middlegame", "3qk2r/8/8/8/8/8/3Q3R/4K3 w - - 0 1"),
      pack("cross", "cross_phase", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
    ]);
    expect(report.corpus).toMatchObject({ packs: 4, positions: 4 });
    expect(report.roots).toEqual({ positions: 3, matches: 2, abstains: 1, mismatches: 0 });
    expect(report.packs.find((row) => row.packId === "cross")?.conformance).toBeUndefined();
  });
});
