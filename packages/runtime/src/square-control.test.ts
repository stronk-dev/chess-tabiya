import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { squareControlEvents, squareControlReading } from "./square-control.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const parsed = parseUci(uci)!;
  const move = normalizeMove(position, parsed);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

function controllers(fen: string, color: "white" | "black", mode: "pseudo" | "legal", target: string): readonly string[] | "unavailable" {
  const reading = squareControlReading(fen).colors.find((entry) => entry.color === color)!;
  if (mode === "legal" && reading.legal.kind === "unavailable") return "unavailable";
  const squares = mode === "pseudo" ? reading.pseudo : reading.legal.kind === "available" ? reading.legal.squares : [];
  return squares.find((entry) => entry.target === target)?.controllers.map((entry) => entry.square) ?? [];
}

describe("all-square control", () => {
  it("separates pseudo control from actual legal destinations", () => {
    const pinned = "4k3/4n3/8/8/8/8/8/4R1K1 b - - 0 1";
    expect(controllers(pinned, "black", "pseudo", "c8")).toContain("e7");
    expect(controllers(pinned, "black", "legal", "c8")).not.toContain("e7");

    const emptyDiagonal = "4k3/8/8/8/4P3/8/8/4K3 w - - 0 1";
    expect(controllers(emptyDiagonal, "white", "pseudo", "d5")).toContain("e4");
    expect(controllers(emptyDiagonal, "white", "legal", "d5")).not.toContain("e4");

    const friendlyOccupied = "4k3/8/8/3N4/4P3/8/8/4K3 w - - 0 1";
    expect(controllers(friendlyOccupied, "white", "pseudo", "d5")).toContain("e4");
    expect(controllers(friendlyOccupied, "white", "legal", "d5")).not.toContain("e4");

    const enemyOccupied = "4k3/8/8/3n4/4P3/8/8/4K3 w - - 0 1";
    expect(controllers(enemyOccupied, "white", "pseudo", "d5")).toContain("e4");
    expect(controllers(enemyOccupied, "white", "legal", "d5")).toContain("e4");
  });

  it("retains pseudo check while the checking color's legal clone abstains", () => {
    const check = "4k3/8/8/8/8/8/8/4R1K1 b - - 0 1";
    expect(controllers(check, "white", "pseudo", "e8")).toContain("e1");
    expect(controllers(check, "white", "legal", "e8")).toBe("unavailable");
    expect(controllers(check, "white", "pseudo", "e7")).toContain("e1");
  });

  it("emits exact gained and lost controller edges with color mirrors", () => {
    const white = "4k3/8/8/8/8/8/4P3/4K3 w - - 0 1";
    const whiteEvents = squareControlEvents(white, "e2e4", after(white, "e2e4")).events;
    expect(whiteEvents).toContainEqual(expect.objectContaining({ color: "white", mode: "pseudo", sign: "lost", target: "d3", controller: expect.objectContaining({ square: "e2" }) }));
    expect(whiteEvents).toContainEqual(expect.objectContaining({ color: "white", mode: "pseudo", sign: "gained", target: "d5", controller: expect.objectContaining({ square: "e4" }) }));

    const black = "4k3/4p3/8/8/8/8/8/4K3 b - - 0 1";
    const blackEvents = squareControlEvents(black, "e7e5", after(black, "e7e5")).events;
    expect(blackEvents).toContainEqual(expect.objectContaining({ color: "black", mode: "pseudo", sign: "lost", target: "d6", controller: expect.objectContaining({ square: "e7" }) }));
    expect(blackEvents).toContainEqual(expect.objectContaining({ color: "black", mode: "pseudo", sign: "gained", target: "d4", controller: expect.objectContaining({ square: "e5" }) }));
  });
});
