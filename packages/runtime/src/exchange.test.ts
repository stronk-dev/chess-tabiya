import { describe, expect, it, vi } from "vitest";

import { captureClassEvent, captureExchangeClass, exchangeCaptureAt, legalCaptureMovesTo, legalExchange } from "./exchange.js";
import { transitionSemanticFacts } from "./transition.js";
import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci, parseSquare, parseUci } from "chessops/util";
import type { NormalMove, Role, Square } from "chessops/types";

function after(fen: string, moveUci: string): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  position.play(normalizeMove(position, parseUci(moveUci)!));
  return makeFen(position.toSetup());
}

describe("legal-exchange@1", () => {
  it("retains free, poisoned and X-ray recapture trees", () => {
    const free = legalExchange("4k3/8/8/8/8/2n5/3P4/3QK3 w - - 0 1", "d2c3")!;
    expect(free.resultUnits).toBe(3);
    expect(free.captured).toMatchObject({ color: "black", role: "knight", square: "c3" });
    expect(free.chosenLine.map((step) => step.moveUci)).toEqual(["d2c3"]);
    expect(captureExchangeClass(free)).toBe("positive");

    const poisoned = legalExchange("r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1", "a1a7")!;
    expect(poisoned.resultUnits).toBe(-4);
    expect(poisoned.chosenLine.map((step) => step.moveUci)).toEqual(["a1a7", "a8a7"]);

    const xray = legalExchange("r3k3/8/8/p7/8/8/R7/Q3K3 w - - 0 1", "a2a5")!;
    expect(xray.resultUnits).toBe(1);
    expect(xray.branches.length).toBeGreaterThan(0);
  });

  it("uses legal recaptures: off-line pins and illegal king captures stay absent", () => {
    expect(legalExchange("4k3/4n3/2p5/1B6/8/8/8/4R1K1 w - - 0 1", "b5c6")!.resultUnits).toBe(1);
    expect(legalExchange("4k3/8/4r3/8/4p3/8/8/4R1K1 w - - 0 1", "e1e4")!.resultUnits).toBe(-4);
    expect(legalExchange("4k3/4q3/8/8/1B6/8/8/4R1K1 w - - 0 1", "b4e7")!.branches).toHaveLength(0);
  });

  it("accounts for promotion gain and rejects non-captures", () => {
    expect(legalExchange("4k2r/6P1/8/8/8/8/8/4K3 w - - 0 1", "g7h8q")!.resultUnits).toBe(13);
    expect(legalExchange("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", "e2e4")).toBeUndefined();
  });

  it("derives an arithmetic capture class from the exact capture identity", () => {
    const fen = "r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1";
    const afterFen = after(fen, "a1a7");
    const capture = transitionSemanticFacts(fen, "a1a7", afterFen).find((fact) => fact.family === "capture");
    expect(capture?.family).toBe("capture");
    if (capture?.family !== "capture") throw new TypeError("capture fixture did not emit");
    expect(captureClassEvent({ before_fen: fen, move_uci: "a1a7", after_fen: afterFen, capture })).toMatchObject({ class: "negative", exchange: { resultUnits: -4 } });
  });
});

// Independent predecessor algorithm: compute the complete legal destination map, then
// filter captures. This must stay broad; it must not use the production target prefilter.
function allDestinationCaptures(position: Chess, target: Square, fromOnly?: Square): readonly NormalMove[] {
  const moves: NormalMove[] = [];
  for (const [from, destinations] of position.allDests()) {
    if ((fromOnly !== undefined && from !== fromOnly) || !destinations.has(target)) continue;
    const promotions: readonly (Role | undefined)[] = position.board.getRole(from) === "pawn" && (target < 8 || target >= 56)
      ? ["queen", "rook", "bishop", "knight"] : [undefined];
    for (const promotion of promotions) {
      const move: NormalMove = promotion === undefined ? { from, to: target } : { from, to: target, promotion };
      if (exchangeCaptureAt(position, move) !== undefined && position.isLegal(move)) moves.push(move);
    }
  }
  return moves.sort((left, right) => makeUci(left).localeCompare(makeUci(right)));
}

const CAPTURE_POSITIONS = [
  ["white opening", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"],
  ["black opening", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1"],
  ["white pin", "4k3/4n3/2p5/1B6/8/8/8/4R1K1 w - - 0 1"],
  ["black pin", "4k3/4n3/2p5/1B6/8/8/8/4R1K1 b - - 0 1"],
  ["white ep", "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1"],
  ["black ep", "4k3/8/8/8/3Pp3/8/8/4K3 b - d3 0 1"],
  ["white pinned ep", "4k3/8/8/r4pPK/8/8/8/8 w - f6 0 1"],
  ["black pinned ep", "8/8/8/8/R4Ppk/8/8/4K3 b - f3 0 1"],
  ["white promotion", "4k2r/6P1/8/8/8/8/8/4K3 w - - 0 1"],
  ["black promotion", "4k3/8/8/8/8/8/6p1/4K2R b - - 0 1"],
  ["double check", "4k3/8/8/8/1b6/8/4r3/4K3 w - - 0 1"],
  ["checkmate", "7k/6Q1/5K2/8/8/8/8/8 b - - 0 1"],
  ["stalemate", "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"],
  ["white castling", "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"],
  ["black castling", "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1"],
] as const;

describe("complete exact-target capture enumeration", () => {
  it.each(CAPTURE_POSITIONS)("retains every sorted capture for %s, all 64 targets and origin restrictions", (_name, fen) => {
    const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    const original = makeFen(position.toSetup());
    const origins = [...position.board[position.turn]];
    // Also query an enemy origin and an empty origin: fromOnly never grants authority.
    const restrictions = [undefined, origins[0], origins.at(-1), position.board[position.turn === "white" ? "black" : "white"].first(), position.board.occupied.complement().first()];
    for (let target = 0; target < 64; target++) {
      for (const fromOnly of restrictions) {
        const actual = legalCaptureMovesTo(position, target as Square, fromOnly);
        const expected = allDestinationCaptures(position, target as Square, fromOnly);
        expect(JSON.stringify(actual)).toBe(JSON.stringify(expected));
        expect(Object.isFrozen(actual)).toBe(true);
      }
    }
    expect(makeFen(position.toSetup())).toBe(original);
  });

  it.each(["white", "black"] as const)("checks only the %s geometric capturers, not every piece's destinations", color => {
    const fen = color === "white"
      ? "r3k2r/8/8/8/8/2n5/3P4/R3K2R w KQkq - 0 1"
      : "r3k2r/3p4/2N5/8/8/8/8/R3K2R b KQkq - 0 1";
    const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    const target = parseSquare(color === "white" ? "c3" : "c6")!;
    const expected = allDestinationCaptures(position, target);
    expect(expected).toHaveLength(1);
    const allDests = vi.spyOn(position, "allDests");
    const dests = vi.spyOn(position, "dests");
    const ctx = vi.spyOn(position, "ctx");
    try {
      expect(legalCaptureMovesTo(position, target)).toEqual(expected);
      expect(allDests).not.toHaveBeenCalled();
      expect(ctx).toHaveBeenCalledTimes(1);
      expect(new Set(dests.mock.calls.map(([square]) => square))).toEqual(new Set([parseSquare(color === "white" ? "d2" : "d7")]));
      expect(dests.mock.calls.every(([, context]) => context !== undefined)).toBe(true);
    } finally { allDests.mockRestore(); dests.mockRestore(); ctx.mockRestore(); }
  });

  it.each([
    ["white", "4k2r/6P1/8/8/8/8/8/4K3 w - - 0 1", "h8", "g7h8"],
    ["black", "4k3/8/8/8/8/8/6p1/4K2R b - - 0 1", "h1", "g2h1"],
  ])("keeps all four %s capture promotions", (_color, fen, target, prefix) => {
    const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    expect(legalCaptureMovesTo(position, parseSquare(target)!).map(makeUci)).toEqual([`${prefix}b`, `${prefix}n`, `${prefix}q`, `${prefix}r`]);
  });
});
