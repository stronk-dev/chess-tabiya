import { describe, expect, it } from "vitest";
import { parsePgnMainline, parseRecordedClockGame } from "./pgn-import.js";
import { resolveImportSource } from "./import-source.js";

const ORIGINAL = `[Event "Clock fixture"]\n[TimeControl "300+2"]\n\n{[%clk 1:00:00]} 1. e4 {secret prose [%eval 0.5] [%clk 0:04:59.125]} e5 2. Nf3 {[%clk 0:04:58.1]} Nc6 {[%clk 0:00:00]} *`;

describe("recorded clock extraction before the annotation stripper", () => {
  it("keeps the full selected legal mainline and sparse original identities without prose", () => {
    const parsed = parseRecordedClockGame(ORIGINAL, { requireMoves: true });
    expect(parsed.game).toEqual(parsePgnMainline(ORIGINAL));
    expect(parsed.moves).toEqual([
      { sourcePly: 1, side: "white", moveUci: "e2e4" }, { sourcePly: 2, side: "black", moveUci: "e7e5" },
      { sourcePly: 3, side: "white", moveUci: "g1f3" }, { sourcePly: 4, side: "black", moveUci: "b8c6" },
    ]);
    expect(parsed.samples).toEqual([
      { ...parsed.moves[0], remainingMs: 299125 }, { ...parsed.moves[2], remainingMs: 298100 }, { ...parsed.moves[3], remainingMs: 0 },
    ]);
    expect(parsed.issues).toEqual([{ sourcePly: 0, reason: "unassigned_root_clock" }]);
    expect(JSON.stringify(parsed)).not.toMatch(/secret|%eval|%clk/);
    expect(Object.isFrozen(parsed.samples[0])).toBe(true);
  });

  it.each([
    ["[%clk 0:00:01] [%clk 0:00:01]", "duplicate_clock"],
    ["[%clk bad] [%clk 0:00:01]", "duplicate_clock"],
    ["[%clk 0:00:01 [%clk 0:00:02]", "duplicate_clock"],
    ["[%clk -1:00:00]", "invalid_clock"], ["[%clk 0:60:00]", "invalid_clock"],
    ["[%clk 0:00:60]", "invalid_clock"], ["[%clk 0:1:02]", "invalid_clock"],
    ["[%clk 0:00:00.0001]", "unsupported_precision"], ["[%clk 9999999999999:00:00]", "unsafe_operand"],
    ["[%clk 0:00:01", "invalid_clock"],
  ] as const)("retains an issue for %s and keeps later plies correctly aligned", (tag, reason) => {
    const parsed = parseRecordedClockGame(`1. e4 {${tag}} e5 {[%clk 0:00:02.01]} *`);
    expect(parsed.issues).toEqual([{ sourcePly: 1, reason }]);
    expect(parsed.moves).toHaveLength(2);
    expect(parsed.samples).toEqual([{ sourcePly: 2, side: "black", moveUci: "e7e5", remainingMs: 2010 }]);
  });

  it("counts duplicates across separate comments on the same move", () => {
    expect(parseRecordedClockGame("1. e4 {[%clk 0:00:01]} {[%clk 0:00:02]} *").issues)
      .toEqual([{ sourcePly: 1, reason: "duplicate_clock" }]);
  });

  it("uses source-local plies and actual black-to-move setup identity", () => {
    const parsed = parseRecordedClockGame('[SetUp "1"]\n[FEN "7k/8/8/8/8/8/8/K7 b - - 0 87"]\n\n87... Kg7 {[%clk 0:01:00]} *');
    expect(parsed.samples).toEqual([{ sourcePly: 1, side: "black", moveUci: "h8g7", remainingMs: 60000 }]);
  });

  it.each([
    '1. e4 (1. d4) e5 *', '1. e4 *\n\n1. d4 *', '1. e4 e4 *',
    '[Variant "Atomic"]\n\n1. e4 *', '1. e4 {' + 'é'.repeat(32768) + '} *',
    '1. e4 e5 ' + Array.from({length: 76}, () => 'Nf3 Nf6 Ng1 Ng8').join(' ') + ' *',
  ])("uses the same selected-game/legality/byte/ply refusal for both projections", pgn => {
    expect(() => parsePgnMainline(pgn, { requireMoves: true })).toThrow();
    expect(() => parseRecordedClockGame(pgn, { requireMoves: true })).toThrow();
  });

  it("carries numeric extraction beside a sanitized paste before the source bytes are discarded", async () => {
    const resolved = await resolveImportSource({ kind: "pgn", pgn: ORIGINAL });
    expect(resolved.clockGame.samples).toEqual(parseRecordedClockGame(ORIGINAL).samples);
    expect(resolved.pgn).not.toMatch(/secret|%eval|%clk/);
    expect(parseRecordedClockGame(resolved.pgn).samples).toEqual([]);
  });

  it("requests and extracts fetched clocks while stripping every annotation from stored PGN", async () => {
    const resolved = await resolveImportSource({ kind: "lichess", url: "https://lichess.org/abcd1234" }, async input => {
      const url = new URL(String(input));
      expect(url.searchParams.get("clocks")).toBe("true");
      expect(url.searchParams.get("evals")).toBe("false");
      expect(url.searchParams.get("comments")).toBe("false");
      return new Response(ORIGINAL);
    });
    expect(resolved.clockGame.samples).toHaveLength(3);
    expect(resolved.clockGame.moves).toHaveLength(4);
    expect(resolved.pgn).not.toMatch(/%clk|secret|%eval/);
  });

  it("refuses oversized original fetch bytes even when stripping would make them tiny", async () => {
    await expect(resolveImportSource({ kind: "lichess", url: "https://lichess.org/abcd1234" }, async () => new Response('1. e4 {' + 'x'.repeat(65536) + '} *')))
      .rejects.toMatchObject({ code: "IMPORT_INVALID_PGN" });
  });
});
