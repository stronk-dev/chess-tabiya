import { describe, expect, it } from "vitest";
import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { originalPiecePositions } from "./foundation-piece-lineage.js";
import { positionFromFen } from "./position-cache.js";

describe("shared physical root-piece identity", () => {
  it.each([
    ["1k6/8/8/8/8/8/8/4K2R w K - 0 1", "e1h1", "e1", "h1", "g1", "f1"],
    ["1k6/8/8/8/8/8/8/R3K3 w Q - 0 1", "e1a1", "e1", "a1", "c1", "d1"],
    ["1k6/8/8/8/8/8/8/6KR w K - 0 1", "g1h1", "g1", "h1", "g1", "f1"],
    ["1k6/8/8/8/8/8/8/4KR2 w F - 0 1", "e1f1", "e1", "f1", "g1", "f1"],
    ["1k6/8/8/8/8/8/8/5KR1 w G - 0 1", "f1g1", "f1", "g1", "g1", "f1"],
    ["4k2r/8/8/8/8/8/8/1K6 b k - 0 1", "e8h8", "e8", "h8", "g8", "f8"],
    ["r3k3/8/8/8/8/8/8/1K6 b q - 0 1", "e8a8", "e8", "a8", "c8", "d8"],
  ] as const)("retains both physical castling pieces at %s / %s", (fen, uci, kingRoot, rookRoot, kingAt, rookAt) => {
    const root = positionFromFen(fen), parsed = parseUci(uci)!;
    const move = normalizeMove(root, parsed); if (!("from" in move)) throw Error("Expected board move");
    expect(root.isLegal(move)).toBe(true);
    const child = root.clone(); child.play(move);
    const result = originalPiecePositions(root, child, move), color = root.turn;
    expect(result.find(row => row.root.square === kingRoot)).toEqual({ root: { color, role: "king", square: kingRoot }, current: { color, role: "king", square: kingAt } });
    expect(result.find(row => row.root.square === rookRoot)).toEqual({ root: { color, role: "rook", square: rookRoot }, current: { color, role: "rook", square: rookAt } });
    expect(result.filter(row => row.current !== null)).toHaveLength(child.board.occupied.size());
  });

  it.each(["q", "r", "b", "n"] as const)("keeps a captured root victim removed when the capturing pawn promotes to %s on its square", suffix => {
    const root = positionFromFen("1r6/P7/7k/8/8/8/8/7K w - - 0 1"), move = parseUci(`a7b8${suffix}`)!;
    if (!("from" in move)) throw Error("Expected board move"); expect(root.isLegal(move)).toBe(true);
    const child = root.clone(); child.play(move);
    const result = originalPiecePositions(root, child, move);
    expect(result.find(row => row.root.square === "b8")).toEqual({ root: { color: "black", role: "rook", square: "b8" }, current: null });
    expect(result.find(row => row.root.square === "a7")?.current).toEqual({ color: "white", role: ({ q: "queen", r: "rook", b: "bishop", n: "knight" } as const)[suffix], square: "b8" });
  });
});
