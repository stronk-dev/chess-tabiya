import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { kingZoneEvents, kingZoneReading } from "./king-state.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

describe("decomposed king state", () => {
  it("retains exact zone, attacker, shelter, and legal escape identities", () => {
    const value = kingZoneReading("4k3/8/8/8/8/4n3/5PPP/6K1 w - - 0 1").kings.find((entry) => entry.color === "white")!;
    expect(value.king.square).toBe("g1");
    expect(value.zone).toEqual(["f1", "h1", "f2", "g2", "h2"]);
    expect(value.attackers).toContainEqual(expect.objectContaining({ square: "e3", piece: expect.objectContaining({ role: "knight" }), zoneSquares: expect.arrayContaining(["f1", "g2"]) }));
    expect(value.shelter.map((entry) => entry.square)).toEqual(["f2", "g2", "h2"]);
    expect(value.escapes).toEqual({ kind: "available", squares: ["h1"] });
  });

  it("abstains the complete escape set on an invalid opposite-check clone", () => {
    const value = kingZoneReading("4k3/8/8/8/8/8/8/4R1K1 b - - 0 1").kings.find((entry) => entry.color === "white")!;
    expect(value.escapes).toEqual({ kind: "unavailable", reason: "invalid_turn_clone", squares: [] });
    expect(value.zone.length).toBeGreaterThan(0);
  });

  it("emits exact shelter and escape deltas without a king-state verdict", () => {
    const fen = "4k3/8/8/8/8/8/7P/6K1 w - - 0 1";
    const event = kingZoneEvents(fen, "h2h4", after(fen, "h2h4")).find((entry) => entry.color === "white")!;
    expect(event.shelter.lost).toContainEqual(expect.objectContaining({ square: "h2" }));
    expect(event.shelter.gained).toEqual([]);
    expect(event.escapes.gained).toContain("h2");
    expect(event.king.relocated).toBe(false);
  });
});
