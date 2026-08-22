import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { castlingLegality, castlingRights, castlingRightsLost } from "./castling.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  position.play(normalizeMove(position, parseUci(uci)!));
  return canonicalFen(position);
}

describe("castling evidence", () => {
  it("reads both rights and names transient blocked/attacked reasons", () => {
    const blocked = castlingLegality("r3k2r/8/8/8/8/8/8/R3KB1R w KQkq - 0 1");
    expect(blocked.find((value) => value.color === "white" && value.wing === "kingside")).toMatchObject({ legalNow: false, blockedSquares: ["f1"] });
    const rights = castlingRights("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(rights.white).toEqual({ kingside: true, queenside: true });
    expect(rights.black).toEqual({ kingside: true, queenside: true });
  });

  it("retains exact permanent loss causes without intent language", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    expect(castlingRightsLost(fen, "h1h2", after(fen, "h1h2"))).toContainEqual(expect.objectContaining({ color: "white", wing: "kingside", cause: "rook_moved" }));
    expect(castlingRightsLost(fen, "e1h1", after(fen, "e1h1"))).toEqual(expect.arrayContaining([
      expect.objectContaining({ color: "white", wing: "kingside", cause: "castled" }),
      expect.objectContaining({ color: "white", wing: "queenside", cause: "castled" }),
    ]));
  });
});
