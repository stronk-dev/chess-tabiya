import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { materialRoleAsymmetryEvent, materialRoleSignatureReading } from "./material-state.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

describe("material-role signatures", () => {
  it("projects exact role counts and an unweighted asymmetry vector", () => {
    const value = materialRoleSignatureReading("4k3/8/8/3r4/8/8/3Q4/4K3 w - - 0 1");
    expect(value.colors.find((entry) => entry.color === "white")?.counts).toEqual({ pawn: 0, knight: 0, bishop: 0, rook: 0, queen: 1 });
    expect(value.colors.find((entry) => entry.color === "black")?.counts).toEqual({ pawn: 0, knight: 0, bishop: 0, rook: 1, queen: 0 });
    expect(value.asymmetry).toEqual({ pawn: 0, knight: 0, bishop: 0, rook: 1, queen: 1 });
    expect(value.magnitude).toBe(2);
    expect(value.colors.every((entry) => entry.sources.length === 5)).toBe(true);
  });

  it("joins capture identity to a strictly increased role asymmetry", () => {
    const fen = "4k3/8/8/3r4/8/8/3Q4/4K3 w - - 0 1";
    expect(materialRoleAsymmetryEvent(fen, "d2d5", after(fen, "d2d5"))).toMatchObject({
      changedRoles: ["rook"],
      before: { magnitude: 2 },
      after: { magnitude: 1 },
      increased: false,
      sourceEvents: [expect.objectContaining({ family: "capture", captured: expect.objectContaining({ color: "black", role: "rook" }) })],
    });
  });

  it("returns no role event for an ordinary non-capture move", () => {
    const fen = "4k3/8/8/8/8/8/3Q4/4K3 w - - 0 1";
    expect(materialRoleAsymmetryEvent(fen, "d2d3", after(fen, "d2d3"))).toBeUndefined();
  });
});
