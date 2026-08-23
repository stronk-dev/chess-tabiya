import { readFileSync, writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { censusPgn } from "./census.js";

const INPUT = process.env.TABIYA_D1329_PGN;
const COMPRESSED = process.env.TABIYA_D1329_PGN_ZST;
const WRITE = process.env.TABIYA_D1329_WRITE === "1";
const RESULT = new URL("../../planning/platform-alignment/bot-policy/d1329-data-readiness-results.json", import.meta.url);

const complete = `[Event "Rated Blitz game"]
[Site "https://lichess.org/fixture1"]
[Date "2026.06.01"]
[UTCDate "2026.06.01"]
[UTCTime "00:00:01"]
[White "white"]
[Black "black"]
[Result "1-0"]
[WhiteElo "1500"]
[BlackElo "1600"]
[TimeControl "300+0"]

1. e4 { [%clk 0:05:00] } e5 { [%clk 0:05:00] } 2. Nf3 { [%clk 0:04:59] } Nc6 { [%clk 0:04:59] }
3. Bb5 { [%clk 0:04:58] } a6 { [%clk 0:04:58] } 4. Ba4 { [%clk 0:04:57] } Nf6 { [%clk 0:04:57] }
5. O-O { [%clk 0:04:56] } Be7 { [%clk 0:04:56] } 1-0
`;

describe("D1329 aggregate-only data readiness", () => {
  it("counts source fields without emitting identity or move labels", () => {
    const result = censusPgn(`${complete}\n[Event "partial"]\n`, Buffer.from("compressed"));
    expect(result.games).toMatchObject({ completeBlocks: 1, parsed: 1, eligible: 1, legalReplay: 1 });
    expect(result.decisions).toMatchObject({ eligible: 3, withRating: 3, withTimeControl: 3, withClock: 3 });
    expect(result.decisions.byCell).toEqual({ "1400-1799/blitz/opening-8-16/standard": 3 });
    expect(JSON.stringify(result)).not.toMatch(/fixture1|white|black|\be4\b|\be5\b/u);
  });

  it("records missing values rather than zero-filling them", () => {
    const missing = complete
      .replace('[WhiteElo "1500"]\n', "")
      .replace('[TimeControl "300+0"]\n', "");
    const result = censusPgn(`${missing}\n[Event "partial"]\n`, Buffer.from("compressed"));
    expect(result.games).toMatchObject({ missingRating: 1, missingTimeControl: 1 });
    expect(result.decisions.byCell).toEqual({ "1400-1799/blitz/opening-8-16/standard": 2, "missing/blitz/opening-8-16/standard": 1 });
    expect(result.decisions.ratingCoverage).toBeCloseTo(2 / 3, 6);
    expect(result.decisions.timeControlCoverage).toBe(0);
  });

  it.skipIf(INPUT === undefined || COMPRESSED === undefined)("measures the fresh June prefix", () => {
    const text = readFileSync(INPUT!, "utf8");
    const compressed = readFileSync(COMPRESSED!);
    const started = performance.now();
    const result = censusPgn(text, compressed);
    const elapsedMs = performance.now() - started;
    expect(result.source.month).toBe("2026-06");
    expect(result.source.compressedPrefixBytes).toBe(compressed.byteLength);
    expect(result.games.completeBlocks).toBeGreaterThan(1_000);
    expect(result.games.legalReplay / result.games.eligible).toBeGreaterThanOrEqual(0.995);
    expect(result.decisions.ratingCoverage).toBeGreaterThanOrEqual(0.95);
    expect(result.decisions.timeControlCoverage).toBeGreaterThanOrEqual(0.95);
    if (WRITE) writeFileSync(RESULT, `${JSON.stringify({
      ...result,
      measurement: {
        elapsedMs: Number(elapsedMs.toFixed(3)),
        decompressedMiBPerSecond: Number((result.source.decompressedPrefixBytes / 1_048_576 / (elapsedMs / 1000)).toFixed(3)),
        gamesPerSecond: Number((result.games.completeBlocks / (elapsedMs / 1000)).toFixed(3)),
      },
    }, null, 2)}\n`);
  });
});
