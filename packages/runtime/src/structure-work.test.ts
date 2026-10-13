import { attacks } from "chessops/attacks";
import type { Color } from "chessops/types";
import { makeSquare } from "chessops/util";
import { expect, it, vi } from "vitest";
import { positionFromFen } from "./chess.js";
import * as positionCache from "./position-cache.js";
import { evaluateNamedStructureWithWitness, structuralReading, STRUCTURE_PREDICATES } from "./structure.js";

vi.mock("chessops/attacks", async importOriginal => {
  const original = await importOriginal<typeof import("chessops/attacks")>();
  return { ...original, attacks: vi.fn(original.attacks) };
});

it("D3763 computes attacks once per piece for counts, plus the retained piece-reach reading", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 9138";
  const board = positionFromFen(fen).board;
  const pieces = [...board];
  const reachPieces = pieces.filter(([, piece]) => ["knight", "bishop", "rook", "queen"].includes(piece.role));
  vi.mocked(attacks).mockClear();
  const reading = structuralReading(fen);
  expect(reading.features.filter(row => row.kind === "direct_attack_count").length).toBeGreaterThan(0);
  expect(attacks).toHaveBeenCalledTimes(pieces.length + reachPieces.length);
});

it("D3763 obtains one reading position, besides the retained named-expression traversals", () => {
  // Unique counter keeps this a cold reading without altering or exposing the production memo.
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 9137";
  const acquisition = vi.spyOn(positionCache, "positionFromFen");
  try {
    for (const id of Object.keys(STRUCTURE_PREDICATES) as (keyof typeof STRUCTURE_PREDICATES)[]) evaluateNamedStructureWithWitness(fen, id);
    const namedAcquisitions = acquisition.mock.calls.length;
    acquisition.mockClear();
    const reading = structuralReading(fen);
    expect(reading.features.length).toBeGreaterThan(0);
    expect(acquisition.mock.calls).toHaveLength(1 + namedAcquisitions);
    acquisition.mockClear();
    expect(structuralReading(fen)).toBe(reading);
    expect(acquisition).not.toHaveBeenCalled();
  } finally { acquisition.mockRestore(); }
});

it.each([
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10",
  "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
  "1r4kr/8/8/8/8/8/8/1R4KR b HBhb - 0 1",
  "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
  "4k3/P7/8/8/8/8/8/4K3 w - - 0 1",
  "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1",
  "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
  "4k3/8/8/8/8/8/8/4K3 w - - 0 1",
  "4k3/8/8/3b4/4N3/8/8/4K3 w - - 0 1",
])("D3763 retains every occupied-target geometric attack count: %s", fen => {
  const board = positionFromFen(fen).board;
  const expected = [];
  // Independent per-target oracle: intentionally retain the original costly definition.
  // This is pseudo attack geometry, not legal captures or a pressure/quality verdict.
  for (const [target, occupant] of board) {
    if (occupant.role === "pawn") continue;
    for (const color of ["white", "black"] as const satisfies readonly Color[]) {
      let count = 0;
      for (const [source, piece] of board) if (piece.color === color && attacks(piece, source, board.occupied).has(target)) count++;
      if (count > 0) expected.push({ kind: "direct_attack_count", color, squares: [makeSquare(target)], count });
    }
  }
  const canonical = (rows: readonly unknown[]) => rows.map(row => JSON.stringify(row)).sort();
  const reading = structuralReading(fen);
  expect(canonical(reading.features.filter(row => row.kind === "direct_attack_count"))).toEqual(canonical(expected));
  expect(Object.isFrozen(reading)).toBe(true);
  expect(reading.features.every(Object.isFrozen)).toBe(true);
});
