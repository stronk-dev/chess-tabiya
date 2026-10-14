import { describe, expect, it, vi } from "vitest";
import { Chess, normalizeMove } from "chessops/chess";
import { makeUci } from "chessops/util";
import { positionFromFen } from "./chess.js";
import * as chess from "./chess.js";

import {
  exactLegalMoveMap,
  exactLegalMoves,
  exactMoveDestination,
  exactMoveIdentity,
  MOVE_DESTINATION_CONVENTION,
  MOVE_IDENTITY_CONVENTION,
  normalizeInboundMove,
  PROMOTION_ROLES,
} from "./legal-moves.js";

const INITIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("exact legal move authority", () => {
  it.each([
    [INITIAL, "E2E4", "e4"],
    ["r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1g1", "g1"],
    ["1r4kr/8/8/8/8/8/8/1R4KR b HBhb - 0 1", "g8h8", "g8"],
  ])("D3816 resolves one legal destination without enumerating other moves: %s / %s", (fen, uci, destination) => {
    const parse = vi.spyOn(chess, "positionFromFen");
    const population = vi.spyOn(Chess.prototype, "allDests");
    const legal = vi.spyOn(Chess.prototype, "isLegal");
    try {
      expect(exactMoveDestination(fen, uci)).toBe(destination);
      expect(parse).toHaveBeenCalledTimes(1);
      expect(population).not.toHaveBeenCalled();
      expect(legal).toHaveBeenCalledTimes(1);
    } finally { parse.mockRestore(); population.mockRestore(); legal.mockRestore(); }
  });

  it.each([
    INITIAL,
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    "4k3/4n3/8/8/8/8/8/4R1K1 b - - 0 1",
    "4k3/8/8/8/8/8/4R3/6K1 b - - 0 1",
    "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
    "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1",
    "1r4kr/8/8/8/8/8/8/1R4KR w HBhb - 0 1",
    "1r4kr/8/8/8/8/8/8/1R4KR b HBhb - 0 1",
    "4k3/8/8/8/8/8/8/4KN1R w K - 0 1",
    "4kn1r/8/8/8/8/8/8/4K3 b k - 0 1",
    "4k3/8/8/8/8/8/8/4KRN1 w F - 0 1",
    "4krn1/8/8/8/8/8/8/4K3 b f - 0 1",
    "4k3/8/8/8/8/8/8/5KR1 w G - 0 1",
    "5kr1/8/8/8/8/8/8/4K3 b g - 0 1",
    "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
    "4k3/8/8/r4pPK/8/8/8/8 w - f6 0 1",
    "4k3/P7/8/8/8/8/8/4K3 w - - 0 1",
    "4k3/8/8/8/8/8/p7/4K3 b - - 0 1",
    "1r2k3/P7/8/8/8/8/8/4K3 w - - 0 1",
    "4k3/8/8/8/8/8/p7/1R2K3 b - - 0 1",
    "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1",
    "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
  ])("D3816 preserves every destination from the complete legal population: %s", fen => {
    const before = exactLegalMoves(fen);
    for (const move of before) {
      expect(exactMoveDestination(fen, move.uci)).toBe(move.to);
      expect(exactMoveDestination(fen, move.uci.toUpperCase())).toBe(move.to);
      expect(exactMoveIdentity(fen, move.uci)).toBe(move.uci);
    }
    expect(exactLegalMoves(fen)).toEqual(before);
  });

  it.each([
    [INITIAL, "not-a-move", "Invalid move UCI: not-a-move"],
    [INITIAL, "N@e4", "Invalid move UCI: N@e4"],
    [INITIAL, "e2e5", "Illegal move UCI: e2e5"],
    [INITIAL, "e7e5", "Illegal move UCI: e7e5"],
    [INITIAL, "g1f3q", "Illegal move UCI: g1f3q"],
    [INITIAL, "e1g1", "Illegal move UCI: e1g1"],
    ["4k3/4n3/8/8/8/8/8/4R1K1 b - - 0 1", "e7c6", "Illegal move UCI: e7c6"],
    ["4k3/8/8/r4pPK/8/8/8/8 w - f6 0 1", "g5f6", "Illegal move UCI: g5f6"],
    ["4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "a7a8", "Illegal move UCI: a7a8"],
    ["4k3/8/8/8/8/8/p7/4K3 b - - 0 1", "a2a1", "Illegal move UCI: a2a1"],
    ["7k/6Q1/6K1/8/8/8/8/8 b - - 0 1", "h8g8", "Illegal move UCI: h8g8"],
    ["not a fen", "not-a-move", "Invalid chess FEN: not a fen"],
  ])("D3816 retains refusal order and text: %s / %s", (fen, uci, message) => {
    expect(() => exactMoveDestination(fen, uci)).toThrowError(message);
    expect(() => exactMoveIdentity(fen, uci)).toThrowError(message);
  });

  it("D3754 uses one same-position context for every destination and legality check", () => {
    const legal = vi.spyOn(Chess.prototype, "isLegal");
    const destinations = vi.spyOn(Chess.prototype, "allDests");
    try {
      expect(exactLegalMoves(INITIAL)).toHaveLength(20);
      expect(destinations).toHaveBeenCalledTimes(1);
      const context = destinations.mock.calls[0]![0];
      expect(context).toBeDefined();
      expect(legal).toHaveBeenCalledTimes(20);
      for (const call of legal.mock.calls) expect(call[1]).toBe(context);
    } finally { legal.mockRestore(); destinations.mockRestore(); }
  });

  it.each([
    INITIAL,
    "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    "4k3/4n3/8/8/8/8/8/4R1K1 b - - 0 1",
    "4k3/8/8/8/8/8/4R3/6K1 b - - 0 1",
    "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
    "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1",
    "1r4kr/8/8/8/8/8/8/1R4KR w HBhb - 0 1",
    "1r4kr/8/8/8/8/8/8/1R4KR b HBhb - 0 1",
    "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
    "4k3/8/8/r4pPK/8/8/8/8 w - f6 0 1",
    "4k3/P7/8/8/8/8/8/4K3 w - - 0 1",
    "4k3/8/8/8/8/8/p7/4K3 b - - 0 1",
    "7k/6Q1/6K1/8/8/8/8/8 b - - 0 1",
    "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1",
  ])("D3754 retains independent all-square legal identity parity: %s", (fen) => {
    const position = positionFromFen(fen), identities = new Set<string>();
    // Independent exhaustive oracle: no allDests and no reused context. Normalize aliases
    // before admitting them to the application's canonical king-takes-rook identity set.
    for (const from of position.board[position.turn]) {
      for (let to = 0; to < 64; to++) {
        const roles = position.board.get(from)?.role === "pawn" && (to < 8 || to >= 56) ? PROMOTION_ROLES : [undefined];
        for (const promotion of roles) {
          const move = normalizeMove(position, { from, to, ...(promotion === undefined ? {} : { promotion }) });
          if (position.isLegal(move)) identities.add(makeUci(move));
        }
      }
    }
    expect(exactLegalMoves(fen).map((move) => move.uci)).toEqual([...identities].sort((a, b) => a.localeCompare(b)));
    expect(exactLegalMoveMap(fen).pieces.flatMap((piece) => piece.moves).map((move) => move.uci).sort()).toEqual([...identities].sort());
  });
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
