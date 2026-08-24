import { describe, expect, it } from "vitest";

import {
  exactLegalMoveMap,
  exactLegalMoves,
  exactMoveDestination,
  MOVE_DESTINATION_CONVENTION,
  MOVE_IDENTITY_CONVENTION,
  normalizeInboundMove,
  PROMOTION_ROLES,
} from "./legal-moves.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("exact legal move authority", () => {
  it("retains every side-to-move piece, including empty rows", () => {
    const map = exactLegalMoveMap(INITIAL);
    expect(map.pieces).toHaveLength(16);
    expect(map.pieces.filter((row) => row.moves.length > 0)).toHaveLength(10);
    expect(map.pieces.filter((row) => row.moves.length === 0)).toHaveLength(6);
    expect(map.pieces.flatMap((row) => row.moves)).toHaveLength(20);
    expect(exactLegalMoves(INITIAL)).toEqual([...map.pieces.flatMap((row) => row.moves)].sort((left, right) => left.uci.localeCompare(right.uci)));
    expect(exactLegalMoveMap(INITIAL)).toEqual(map);
  });

  it("omits pinned moves and emits only check evasions", () => {
    const pinned = exactLegalMoveMap("4k3/4n3/8/8/8/8/8/4R1K1 b - - 0 1");
    expect(pinned.pieces.find((row) => row.piece.square === "e7")?.moves).toEqual([]);
    const evasions = exactLegalMoves("4k3/8/8/8/8/8/4R3/6K1 b - - 0 1");
    expect(evasions.length).toBeGreaterThan(0);
    expect(evasions.every((move) => move.from === "e8")).toBe(true);
  });

  it("separates Chess960-safe move identity from the king's semantic destination", () => {
    const castling = exactLegalMoves("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1").map((move) => move.uci);
    expect(castling.filter((uci) => uci === "e1a1")).toHaveLength(1);
    expect(castling.filter((uci) => uci === "e1h1")).toHaveLength(1);
    expect(castling).not.toContain("e1c1");
    expect(castling).not.toContain("e1g1");
    const moves = exactLegalMoves("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(moves.find((move) => move.uci === "e1a1")?.to).toBe("c1");
    expect(moves.find((move) => move.uci === "e1h1")?.to).toBe("g1");
    const blocked = exactLegalMoves(INITIAL).map((move) => move.uci);
    expect(blocked).not.toContain("e1c1");
    expect(blocked).not.toContain("e1g1");

    const black = exactLegalMoves("r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1");
    expect(black.filter((move) => move.from === "e8").map((move) => [move.uci, move.to])).toEqual(
      expect.arrayContaining([["e8a8", "c8"], ["e8h8", "g8"]]),
    );
  });

  it("records inbound dialect conversion instead of accepting castling aliases silently", () => {
    const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
    expect(MOVE_IDENTITY_CONVENTION).toBe("chessops-king-takes-rook@1");
    expect(MOVE_DESTINATION_CONVENTION).toBe("king-landing-square@1");
    expect(normalizeInboundMove(fen, "e1g1", "engine_bestmove")).toMatchObject({
      sourceDialect: "standard-uci-king-destination@1",
      targetDialect: "chessops-king-takes-rook@1",
      inputUci: "e1g1",
      moveUci: "e1h1",
      converted: true,
    });
    expect(normalizeInboundMove(fen, "e1h1", "lichess_explorer")).toMatchObject({ moveUci: "e1h1", converted: false });
    expect(() => normalizeInboundMove(fen, "e1g1", "lichess_explorer")).toThrow(/does not conform/u);
    expect(exactMoveDestination(fen, "e1g1")).toBe("g1");
  });

  it("keeps the degenerate Chess960 king destination even when it equals the origin", () => {
    const fen = "1r4kr/8/8/8/8/8/8/1R4KR w HBhb - 0 1";
    expect(exactMoveDestination(fen, "g1h1")).toBe("g1");
    expect(exactMoveDestination(fen, "g1b1")).toBe("c1");
  });

  it("separates legal from king-exposing en-passant", () => {
    expect(exactLegalMoves("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1").map((move) => move.uci)).toContain("e5d6");
    expect(exactLegalMoves("4k3/8/8/r4pPK/8/8/8/8 w - f6 0 1").map((move) => move.uci)).not.toContain("g5f6");
  });

  it("emits exactly four explicit promotion identities", () => {
    const moves = exactLegalMoves("4k3/P7/8/8/8/8/8/4K3 w - - 0 1").filter((move) => move.from === "a7");
    expect(moves.map((move) => move.uci)).toEqual(["a7a8b", "a7a8n", "a7a8q", "a7a8r"]);
    expect(new Set(moves.map((move) => move.promotion))).toEqual(new Set(PROMOTION_ROLES));
  });

  it("retains typed piece rows for checkmate and stalemate", () => {
    const mate = exactLegalMoveMap("7k/6Q1/6K1/8/8/8/8/8 b - - 0 1");
    const stalemate = exactLegalMoveMap("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1");
    expect(mate.pieces).toHaveLength(1);
    expect(stalemate.pieces).toHaveLength(1);
    expect(mate.pieces[0]?.moves).toEqual([]);
    expect(stalemate.pieces[0]?.moves).toEqual([]);
  });

  it("retains the runtime FEN error family", () => {
    expect(() => exactLegalMoves("not a fen")).toThrowError("Invalid chess FEN: not a fen");
  });
});
