import { describe, expect, it, vi } from "vitest";

import { FixtureTablebaseSource, LichessTablebaseSource } from "./tablebase.js";

const fen = "4k3/6KP/8/8/8/8/8/8 w - - 0 1";
const payload = { category: "win", dtz: 1, moves: [{ uci: "h7h8q", san: "h8=Q+", category: "loss", dtz: -1, precise_dtz: -1 }] };

describe("interactive tablebase source", () => {
  it("distinguishes an empty mock from an executable fixture provider", () => {
    expect(new FixtureTablebaseSource().configured).toBe(false);
    expect(new FixtureTablebaseSource({ [fen]: { category: "win", dtz: 1, preciseDtz: 1, moves: [] } }).configured).toBe(true);
  });

  it("percent-encodes FENs, coalesces identical requests, and retains immutable positives", async () => {
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => { release = resolve; });
    const fetcher = vi.fn(async (url: string | URL | Request) => {
      await blocked;
      expect(String(url)).toBe(`https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`);
      return new Response(JSON.stringify(payload), { status: 200 });
    }) as unknown as typeof fetch;
    const source = new LichessTablebaseSource({ fetcher });
    const first = source.probe(fen), second = source.probe(fen);
    release();
    expect(await first).toEqual(await second);
    expect(await source.probe(fen)).toEqual(expect.objectContaining({ category: "win" }));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("negative-caches upstream failures and refuses positions outside seven pieces", async () => {
    const fetcher = vi.fn(async () => new Response("busy", { status: 429 })) as unknown as typeof fetch;
    const source = new LichessTablebaseSource({ fetcher, now: () => 1000 });
    await expect(source.probe(fen)).rejects.toMatchObject({ code: "TABLEBASE_UNAVAILABLE", details: { retryAfterMs: 60_000 } });
    await expect(source.probe(fen)).rejects.toMatchObject({ code: "TABLEBASE_UNAVAILABLE" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(() => source.probe("4k3/8/8/8/8/8/PPPP4/R3K2R w - - 0 1")).toThrow(expect.objectContaining({ code: "TABLEBASE_OUT_OF_RANGE" }));
  });
});
