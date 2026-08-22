import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { pieceDestinationEvents, pieceDestinationsReading } from "./mobility.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

describe("identity-retaining mobility", () => {
  it("separates legal destinations from locally non-losing destinations", () => {
    const unsafe = "4k3/8/8/8/1p6/8/8/1N2K3 w - - 0 1";
    const knight = pieceDestinationsReading(unsafe).colors.find((entry) => entry.color === "white")!;
    expect(knight.kind).toBe("available");
    if (knight.kind === "available") {
      const b1 = knight.pieces.find((piece) => piece.piece.square === "b1")!;
      expect(b1.legal).toContain("c3");
      expect(b1.localNonLosing).not.toContain("c3");
      expect(b1.localNonLosing).toContain("d2");
    }

    const pinned = "4k3/4n3/8/8/8/8/8/4R1K1 b - - 0 1";
    const black = pieceDestinationsReading(pinned).colors.find((entry) => entry.color === "black")!;
    expect(black.kind).toBe("available");
    if (black.kind === "available") expect(black.pieces.find((piece) => piece.piece.square === "e7")?.legal).toEqual([]);
  });

  it("retains moved-piece identity and exact before/after sets", () => {
    const fen = "4k3/8/8/8/8/8/8/1N2K3 w - - 0 1";
    const result = pieceDestinationEvents(fen, "b1a3", after(fen, "b1a3"));
    const moved = result.events.find((event) => event.piece.before.square === "b1");
    expect(moved).toMatchObject({ color: "white", piece: { before: { square: "b1", role: "knight" }, after: { square: "a3", role: "knight" } }, moved: true });
    expect(moved?.legalBefore).toEqual(["a3", "c3", "d2"]);
    expect(moved?.legalAfter).toEqual(["b1", "b5", "c2", "c4"]);
    expect(moved?.legalGained).toEqual(["b1", "b5", "c2", "c4"]);
    expect(moved?.legalLost).toEqual(["a3", "c3", "d2"]);
  });

  it("keeps valid-color events when the opposite-check clone abstains", () => {
    const fen = "4k3/8/8/8/8/8/8/R6K w - - 0 1";
    const result = pieceDestinationEvents(fen, "a1e1", after(fen, "a1e1"));
    expect(result.unavailable).toContainEqual({ color: "white", reason: "invalid_turn_clone", before: "available", after: "unavailable" });
    expect(result.events.every((event) => event.color === "black")).toBe(true);
  });
});
