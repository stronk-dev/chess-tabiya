import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";
import { deviationCostMatches, deriveDeviationCost } from "./deviation-cost.js";
import type { EvidenceRecord } from "./types.js";
function after(fen: string, moveUci: string): string {
  const board = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  board.play(parseUci(moveUci)!);
  return makeFen(board.toSetup());
}


describe("machine-derived deviation costs", () => {
  it("compares structured costs independently of author JSON key order", () => {
    expect(deviationCostMatches(
      { basis: "engine", kind: "mate", against: "learner" },
      { kind: "mate", against: "learner", basis: "engine" },
    )).toBe(true);
    expect(deviationCostMatches(
      { basis: "tablebase", to: "draw", kind: "category", from: "win" },
      { kind: "category", from: "win", to: "draw", basis: "tablebase" },
    )).toBe(true);
  });

  it("resolves a bare-FEN deviation against that FEN rather than the pack root", () => {
    const anchorFen = "4k3/8/8/8/8/8/7P/4K3 w - - 0 1";
    const document = {
      id: "bare-fen-anchor",
      start: { fen: "4k3/8/8/8/8/8/7P/3K4 w - - 0 1", side: "white" },
      spine: [],
      deviations: [{ at: { fen: anchorFen }, moveUci: "h2h3", class: "tactical_error" }],
    } as unknown as DrillPackDefinition;
    const common = {
      kind: "engine_eval" as const,
      sourceId: "engine",
      retrievedAt: "2026-08-16T00:00:00.000Z",
      grounds: "machine_validation" as const,
    };
    const records: readonly EvidenceRecord[] = [
      { ...common, anchor: { fen: document.start.fen }, values: { engineId: "sf", engineVersion: "18", depth: 22, multiPv: 1, centipawns: 500 }, supports: ["/start/fen"] },
      { ...common, anchor: { fen: anchorFen }, values: { engineId: "sf", engineVersion: "18", depth: 22, multiPv: 1, centipawns: 100 }, supports: ["/start/fen"] },
      { ...common, anchor: { fen: after(anchorFen, "h2h3") }, values: { engineId: "sf", engineVersion: "18", depth: 22, multiPv: 1, centipawns: 20 }, supports: ["/deviations/0/moveUci"] },
    ];
    expect(deriveDeviationCost(document, records, 0, "engine")).toEqual({
      kind: "cp",
      loss: 80,
      basis: "engine",
    });
  });
});
