import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { pieceDestinationEvents, pieceDestinationsReading } from "./mobility.js";

const castles = [
  { name: "white kingside", fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1", uci: "e1h1", from: "h1", to: "f1", color: "white" },
  { name: "white queenside", fen: "4k3/8/8/8/8/8/8/R3K3 w Q - 0 1", uci: "e1a1", from: "a1", to: "d1", color: "white" },
  { name: "black kingside", fen: "4k2r/8/8/8/8/8/8/4K3 b k - 0 1", uci: "e8h8", from: "h8", to: "f8", color: "black" },
  { name: "black queenside", fen: "r3k3/8/8/8/8/8/8/4K3 b q - 0 1", uci: "e8a8", from: "a8", to: "d8", color: "black" },
  { name: "white stationary king", fen: "4k3/8/8/8/8/8/8/6KR w H - 0 1", uci: "g1h1", from: "h1", to: "f1", color: "white" },
  { name: "black stationary king", fen: "6kr/8/8/8/8/8/8/4K3 b h - 0 1", uci: "g8h8", from: "h8", to: "f8", color: "black" },
  { name: "white swapped king/rook", fen: "4k3/8/8/8/8/8/8/5KR1 w G - 0 1", uci: "f1g1", from: "g1", to: "f1", color: "white" },
  { name: "black swapped king/rook", fen: "5kr1/8/8/8/8/8/8/4K3 b g - 0 1", uci: "f8g8", from: "g8", to: "f8", color: "black" },
] as const;

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

describe("identity-retaining mobility", () => {
  it.each(castles)("retains the $name secondary rook and exact destination sets", fixture => {
    const afterFen = after(fixture.fen, fixture.uci);
    const event = pieceDestinationEvents(fixture.fen, fixture.uci, afterFen).events.find(item => item.piece.before.square === fixture.from);
    expect(event).toMatchObject({ color: fixture.color, moved: true, piece: { before: { square: fixture.from, role: "rook" }, after: { square: fixture.to, role: "rook" } } });
    const reading = (fen: string, square: string) => {
      const color = pieceDestinationsReading(fen).colors.find(item => item.color === fixture.color)!;
      if (color.kind !== "available") throw new Error("fixture unexpectedly has an invalid turn clone");
      return color.pieces.find(item => item.piece.square === square)!;
    };
    const before = reading(fixture.fen, fixture.from), next = reading(afterFen, fixture.to);
    expect(event?.legalBefore).toEqual(before.legal);
    expect(event?.legalAfter).toEqual(next.legal);
    expect(event?.safeBefore).toEqual(before.localNonLosing);
    expect(event?.safeAfter).toEqual(next.localNonLosing);
    expect(event?.legalGained).toEqual(next.legal.filter(square => !before.legal.includes(square)));
    expect(event?.legalLost).toEqual(before.legal.filter(square => !next.legal.includes(square)));
  });

  it.each([
    { fen: "4k3/8/8/8/8/8/8/4KR2 w F - 0 1", uci: "e1f1", square: "f1" },
    { fen: "4kr2/8/8/8/8/8/8/4K3 b f - 0 1", uci: "e8f8", square: "f8" },
    { fen: "4k3/8/8/8/8/8/8/4K2R w - - 0 1", uci: "e1f1", square: "h1" },
  ])("does not label a stationary rook as physically moved for $uci/$square", fixture => {
    const event = pieceDestinationEvents(fixture.fen, fixture.uci, after(fixture.fen, fixture.uci)).events.find(item => item.piece.before.square === fixture.square);
    expect(event).toMatchObject({ moved: false, piece: { before: { square: fixture.square, role: "rook" }, after: { square: fixture.square, role: "rook" } } });
  });

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
