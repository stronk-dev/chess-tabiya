import { describe, expect, it } from "vitest";
import { CORPUS_GUARD, renderCorpusPage } from "./corpus-sentences.js";

const population = { source: "lichess-explorer" as const, ratings: [1400], speeds: ["rapid"], since: "2023-09", until: "2026-08" };
describe("corpus sentence closure", () => {
  it("renders facts with the byte-pinned popularity guard in every result", () => {
    const pages = [
      { nodeId: "n", committedMoveSan: "e4", result: { kind: "stats" as const, total: 240, white: 120, draws: 40, black: 80, moves: [{ san: "e4", uci: "e2e4", playedCount: 120, sharePct: 50, white: 60, draws: 20, black: 40 }, { san: "a3", uci: "a2a3", playedCount: 4, sharePct: 1.7, white: 3, draws: 0, black: 1 }], recency: { kind: "month" as const, lastPlayedMonth: "2019-04" }, population } },
      { nodeId: "n", committedMoveSan: "a3", result: { kind: "stats" as const, total: 120, white: 60, draws: 20, black: 40, moves: [], recency: { kind: "absent" as const }, population } },
      { nodeId: "n", committedMoveSan: null, result: { kind: "abstention" as const, reason: "no_data_at_band" as const, detail: "total 37 < 100", population } },
      { nodeId: "n", committedMoveSan: null, result: { kind: "abstention" as const, reason: "source_unavailable" as const, detail: "HTTP 429", population } },
    ];
    for (const page of pages) { const rendered = renderCorpusPage(page); expect(rendered[1]).toBe(CORPUS_GUARD); expect(rendered.join(" ")).not.toMatch(/\b(best|strong|dubious|mistake|recommended)\b/i); }
    expect(renderCorpusPage(pages[2]!)).toContain("37 games recorded here — below the 100-game abstention floor. No frequencies are shown.");
    expect(renderCorpusPage(pages[0]!)).toContain("a3 — 4 of 240 games (1.7%). Outcome split withheld below the 100-game per-move floor.");
    expect(renderCorpusPage(pages[0]!).join(" ")).not.toContain("White wins 75.0%");
  });
});
