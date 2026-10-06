import { describe, expect, it } from "vitest";
import { CORPUS_GUARD, corpusContextSentences, renderCorpusPage } from "./corpus-sentences.js";
import { corpusPageFixture, modernCorpusCapture, modernCorpusPageFixture } from "./corpus-presentation.test-support.js";
import { providerSourceEvidence } from "@chess-tabiya/runtime";
import { PROVIDER_EXCHANGE_AUTHORITY } from "../../../../packages/runtime/src/provider-exchange.js";

const population = { source: "lichess-explorer" as const, ratings: [1400], speeds: ["rapid"], since: "2023-09", until: "2026-08" };
describe("corpus sentence closure", () => {
  it("preserves modern facts and keeps only learner context outside the registered component", () => {
    const acquisition = PROVIDER_EXCHANGE_AUTHORITY.makeProviderAcquisitionReceipt(modernCorpusCapture());
    const parsed = PROVIDER_EXCHANGE_AUTHORITY.makeProviderParsedPayload(acquisition);
    const source = providerSourceEvidence("lichess_explorer.position_page@1", PROVIDER_EXCHANGE_AUTHORITY.makeProviderDelivery({ kind: "live", acquisition, ...parsed, servedAt: acquisition.retrievedAt }));
    const page = modernCorpusPageFixture(source, "n", "e4");
    const lines = renderCorpusPage(page);
    expect(lines[1]).toBe(CORPUS_GUARD);
    expect(lines.join(" ")).toContain("116 games are outside");
    expect(lines.join(" ")).toContain("2026-08");
    expect(lines.join(" ")).not.toContain("PRIVATE_PROVIDER_SAN");
    expect(corpusContextSentences(page)).toEqual(["Your committed move here: e4."]);
    expect(corpusContextSentences(page, "e4")).toEqual(["Your committed move here: e4."]);
    expect(corpusContextSentences(page, "d4")).toEqual([]);
    expect(corpusContextSentences(page, null)).toEqual([]);
    expect(renderCorpusPage(page).join(" ")).toContain("116 games are outside");
  });
  it("renders facts with the byte-pinned popularity guard in every result", () => {
    const pages = [
      { nodeId: "n", committedMoveSan: "e4", result: { kind: "stats" as const, total: 240, white: 120, draws: 40, black: 80, moves: [{ san: "e4", uci: "e2e4", playedCount: 120, sharePct: 50, white: 60, draws: 20, black: 40 }, { san: "a3", uci: "a2a3", playedCount: 4, sharePct: 1.7, white: 3, draws: 0, black: 1 }], recency: { kind: "month" as const, lastPlayedMonth: "2019-04" }, population } },
      { nodeId: "n", committedMoveSan: "a3", result: { kind: "stats" as const, total: 120, white: 60, draws: 20, black: 40, moves: [], recency: { kind: "absent" as const }, population } },
      { nodeId: "n", committedMoveSan: null, result: { kind: "abstention" as const, reason: "no_data_at_band" as const, detail: "total 37 < 100", population } },
      { nodeId: "n", committedMoveSan: null, result: { kind: "abstention" as const, reason: "source_unavailable" as const, detail: "HTTP 429", population } },
    ].map(corpusPageFixture);
    for (const page of pages) { const rendered = renderCorpusPage(page); expect(rendered[1]).toBe(CORPUS_GUARD); expect(rendered.join(" ")).not.toMatch(/\b(best|strong|dubious|mistake|recommended)\b/i); }
    expect(renderCorpusPage(pages[2]!)).toContain("37 games recorded here — below the 100-game abstention floor. No frequencies are shown.");
    expect(renderCorpusPage(pages[0]!)).toContain("a3 — 4 of 240 games (1.7%). Outcome split withheld below the 100-game per-move floor.");
    expect(renderCorpusPage(pages[0]!).join(" ")).not.toContain("White wins 75.0%");
  });
});
