import { describe, expect, it, vi } from "vitest";
import { FixtureCorpusSource, LichessCorpusSource, corpusPopulation, corpusUrl, parseCorpusResponse } from "./corpus.js";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 17 42";
const query = { ...corpusPopulation(1500, new Date("2026-08-14T12:00:00Z")), fen: FEN };
const response = { white: 60, draws: 20, black: 40, moves: [{ san: "e4", uci: "e2e4", white: 30, draws: 10, black: 20 }], history: [{ month: "2019-03", white: 0, draws: 0, black: 0 }, { month: "2019-04", white: 1, draws: 0, black: 0 }] };

describe("runtime corpus source", () => {
  it("normalizes and percent-encodes the FEN before forming the cache key", () => {
    const url = new URL(corpusUrl(query));
    expect(url.searchParams.get("fen")).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(url.searchParams.get("history")).toBe("true");
    expect(url.toString()).toContain("fen=rnbqkbnr%2Fpppppppp");
  });

  it("derives counts, the floor, recency, and band windows", async () => {
    expect(parseCorpusResponse(response, query)).toMatchObject({ kind: "stats", total: 120, recency: { kind: "month", lastPlayedMonth: "2019-04" }, moves: [{ playedCount: 60, sharePct: 50 }] });
    expect(parseCorpusResponse({ ...response, white: 20, draws: 7, black: 10 }, query)).toMatchObject({ kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100" });
    expect(corpusPopulation(2600, new Date("2026-01-01Z")).ratings).toEqual([2500]);
    expect(corpusPopulation(900, new Date("2026-01-01Z")).ratings).toEqual([0]);
    expect(corpusPopulation(undefined, new Date("2026-01-01Z"))).toMatchObject({ since: "2023-02", until: "2026-01" });
    await expect(new FixtureCorpusSource().stats(query)).resolves.toMatchObject({ kind: "stats", total: 120 });
  });

  it("coalesces identical requests and negative-caches 429", async () => {
    let now = new Date("2026-08-14T00:00:00Z");
    const fetcher = vi.fn(async (_url: string, _init: RequestInit) => Response.json(response));
    const source = new LichessCorpusSource({ token: "operator-secret", fetcher, now: () => now });
    const [one, two] = await Promise.all([source.stats(query), source.stats(query)]);
    expect(one).toEqual(two); expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]![1]?.headers).toMatchObject({ authorization: "Bearer operator-secret" });
    now = new Date(now.getTime() + 86_400_001); await source.stats(query); expect(fetcher).toHaveBeenCalledTimes(2);
    const throttledFetch = vi.fn(async (_url: string, _init: RequestInit) => new Response("busy", { status: 429 }));
    const throttled = new LichessCorpusSource({ token: "operator-secret", fetcher: throttledFetch, now: () => now });
    await throttled.stats(query); await throttled.stats(query); expect(throttledFetch).toHaveBeenCalledTimes(1);
  });
});
