import { normalizeMove } from "chessops/chess";
import type { SquareName } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";
import { expect, it, vi } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { STRUCTURAL_FEATURE_KINDS } from "@chess-tabiya/schema/drill-pack";
import { structuralReading } from "./structure.js";
import { squareControlEvents, squareControlReading, type ControlledSquare, type SquareControlEvent, type SquareControlEvents } from "./square-control.js";

function edge(fen: string, uci: string) {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return { beforeFen: fen, moveUci: makeUci(move), afterFen: canonicalFen(position) };
}

// An independent array/Set join, not the production indexed-map implementation.
function reference(input: ReturnType<typeof edge>): SquareControlEvents {
  const before = squareControlReading(input.beforeFen), after = squareControlReading(input.afterFen);
  const events: SquareControlEvent[] = [], legalAvailability: SquareControlEvents["legalAvailability"][number][] = [];
  const flattened = (squares: readonly ControlledSquare[]) => squares.flatMap(({ target, controllers }) => controllers.map((controller) => ({ target, controller })));
  const key = (entry: { target: SquareName; controller: ControlledSquare["controllers"][number] }) =>
    `${entry.target}:${entry.controller.square}:${entry.controller.piece.color}:${entry.controller.piece.role}:${entry.controller.piece.promoted ? 1 : 0}`;
  for (const color of ["white", "black"] as const) {
    const left = before.colors.find((reading) => reading.color === color)!;
    const right = after.colors.find((reading) => reading.color === color)!;
    legalAvailability.push({ color, before: left.legal.kind, after: right.legal.kind });
    for (const [mode, leftSquares, rightSquares] of [
      ["pseudo", left.pseudo, right.pseudo],
      ...(left.legal.kind === "available" && right.legal.kind === "available" ? [["legal", left.legal.squares, right.legal.squares] as const] : []),
    ] as const) {
      const leftEdges = flattened(leftSquares), rightEdges = flattened(rightSquares);
      const leftKeys = new Set(leftEdges.map(key)), rightKeys = new Set(rightEdges.map(key));
      for (const value of rightEdges) if (!leftKeys.has(key(value))) events.push({ ...input, color, mode, sign: "gained", ...value });
      for (const value of leftEdges) if (!rightKeys.has(key(value))) events.push({ ...input, color, mode, sign: "lost", ...value });
    }
  }
  events.sort((a, b) => a.color.localeCompare(b.color) || a.mode.localeCompare(b.mode) || a.target.localeCompare(b.target)
    || a.controller.square.localeCompare(b.controller.square) || a.sign.localeCompare(b.sign));
  return { events, legalAvailability };
}

it.each(["w", "b"])("serializes each structural sort operand once for %s without changing legacy ordering", (turn) => {
  const stringify = JSON.stringify;
  const calls = new Map<object, number>();
  const spy = vi.spyOn(JSON, "stringify").mockImplementation((value, ...args) => {
    if (value !== null && typeof value === "object" && "kind" in value && "squares" in value) {
      calls.set(value, (calls.get(value) ?? 0) + 1);
    }
    return stringify(value, ...args);
  });
  let reading: ReturnType<typeof structuralReading>;
  try { reading = structuralReading(`rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR ${turn} KQkq - 0 7001`); }
  finally { spy.mockRestore(); }
  expect(reading.features.length).toBeGreaterThan(20);
  for (const feature of reading.features) expect(calls.get(feature)).toBe(1);
  const expected = [...reading.features].sort((a, b) => STRUCTURAL_FEATURE_KINDS.indexOf(a.kind) - STRUCTURAL_FEATURE_KINDS.indexOf(b.kind)
    || stringify(a).localeCompare(stringify(b)));
  expect(stringify(reading.features)).toBe(stringify(expected));
  expect(Object.isFrozen(reading.features)).toBe(true);
});

it("reuses only four before indexes and rebuilds them after a different before position", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 7002";
  const first = edge(fen, "e2e4"), second = edge(fen, "d2d4"), later = edge(first.afterFen, "e7e5");
  const differentClock = edge(fen.replace("- 0 7002", "- 11 7002"), "d2d4");
  const inputs = [first, second, first, later, second, differentClock];
  const expected = inputs.map(reference); // Warm source readings, never the production indexes.
  const nativeSet = Map.prototype.set;
  const built = new Set<Map<unknown, unknown>>();
  const spy = vi.spyOn(Map.prototype, "set").mockImplementation(function(this: Map<unknown, unknown>, key, value) {
    if (value !== null && typeof value === "object" && "target" in value && "controller" in value) built.add(this);
    return nativeSet.call(this, key, value);
  });
  try {
    inputs.forEach((input, index) => {
      const actual = squareControlEvents(input.beforeFen, input.moveUci, input.afterFen);
      expect(JSON.stringify(actual)).toBe(JSON.stringify(expected[index]));
      expect(Object.isFrozen(actual.events)).toBe(true);
      expect(built.size).toBe([8, 12, 16, 24, 32, 40][index]);
    });
  } finally { spy.mockRestore(); }
});

it.each([
  ["4k3/8/8/8/8/8/8/4K2R w K - 0 7003", "e1h1"],
  ["4k2r/8/8/8/8/8/8/4K3 b k - 0 7003", "e8h8"],
  ["4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 7003", "e5d6"],
  ["4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 7003", "e4d3"],
  ["1r6/P7/7k/8/8/8/8/7K w - - 0 7003", "a7b8q"],
  ["7k/8/8/8/8/7K/p7/1R6 b - - 0 7003", "a2b1q"],
])("keeps exact special-move deltas and turn-clone abstentions: %s %s", (fen, uci) => {
  const input = edge(fen, uci), expected = reference(input);
  for (let repeat = 0; repeat < 2; repeat++) {
    expect(JSON.stringify(squareControlEvents(input.beforeFen, input.moveUci, input.afterFen))).toBe(JSON.stringify(expected));
  }
  expect(expected.events.length).toBeGreaterThan(0);
});

it.each([
  { fen: "4k3/8/8/8/8/8/8/R6K w - - 0 7004", uci: "a1e1", color: "white" },
  { fen: "r6k/8/8/8/8/8/8/4K3 b - - 0 7004", uci: "a8e8", color: "black" },
])("keeps $color check's unavailable turn clone out of legal deltas", ({ fen, uci, color }) => {
  const input = edge(fen, uci), expected = reference(input);
  expect(expected.legalAvailability.find((value) => value.color === color)?.after).toBe("unavailable");
  expect(expected.events.some((value) => value.color === color && value.mode === "pseudo")).toBe(true);
  expect(expected.events.some((value) => value.color === color && value.mode === "legal")).toBe(false);
  for (let repeat = 0; repeat < 2; repeat++) {
    expect(JSON.stringify(squareControlEvents(input.beforeFen, input.moveUci, input.afterFen))).toBe(JSON.stringify(expected));
  }
});
