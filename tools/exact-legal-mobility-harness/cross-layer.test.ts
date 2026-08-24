import { describe, expect, it } from "vitest";

import { legalSuccessors } from "../../apps/server/src/sourcing/legal-moves.js";
import { legalMovesForFen } from "../../apps/web/src/lib/board-input.js";
import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";

const FIXTURES = Object.freeze([
  { id: "ordinary", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" },
  { id: "check-evasion", fen: "4k3/8/8/8/8/8/4R3/6K1 b - - 0 1" },
  { id: "castling", fen: "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1" },
  { id: "en-passant", fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1" },
  { id: "promotion", fen: "4k3/P7/8/8/8/8/8/4K3 w - - 0 1" },
  { id: "chess960-castling", fen: "1r4kr/8/8/8/8/8/8/1R4KR w HBhb - 0 1" },
] as const);

describe("exact legal mobility cross-layer identity", () => {
  for (const fixture of FIXTURES) it(`keeps ${fixture.id} set-equal`, () => {
    const runtime = exactLegalMoves(fixture.fen).map((move) => move.uci);
    const web = [...legalMovesForFen(fixture.fen).values()].flat().sort();
    const server = legalSuccessors(fixture.fen).map((move) => move.uci);
    expect(web).toEqual(runtime);
    expect(server).toEqual(runtime);
  });

  it("pins Chess960-safe castling identity, semantic destination and all four promotions", () => {
    const castle = exactLegalMoves(FIXTURES[2].fen).map((move) => move.uci);
    expect(castle).toEqual(expect.arrayContaining(["e1a1", "e1h1"]));
    expect(castle).not.toEqual(expect.arrayContaining(["e1c1", "e1g1"]));
    expect(exactLegalMoves(FIXTURES[2].fen).filter((move) => move.from === "e1").map((move) => [move.uci, move.to])).toEqual(expect.arrayContaining([["e1a1", "c1"], ["e1h1", "g1"]]));
    expect(exactLegalMoves(FIXTURES[4].fen).filter((move) => move.from === "a7").map((move) => move.uci)).toEqual([
      "a7a8b", "a7a8n", "a7a8q", "a7a8r",
    ]);
    expect(exactLegalMoves(FIXTURES[5].fen).filter((move) => move.from === "g1").map((move) => [move.uci, move.to])).toEqual(
      expect.arrayContaining([["g1b1", "c1"], ["g1h1", "g1"]]),
    );
    expect(legalSuccessors(FIXTURES[2].fen)).toEqual(expect.arrayContaining([
      expect.objectContaining({ uci: "e1a1", san: "O-O-O" }),
      expect.objectContaining({ uci: "e1h1", san: "O-O" }),
    ]));
  });
});
