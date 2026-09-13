import { describe, expect, it } from "vitest";

import { parseCorpusPage, parseHumanSplitPage } from "./human-evidence-response.js";

const engine = Object.freeze({ id: "maia", name: "Maia 1600", version: "3", modelId: "maia-1600", seedHonored: true, eloHonored: true, eloApplied: 1600 });
const split = Object.freeze({
  nodeId: "node-1", engine, targetElo: 1600,
  candidates: [
    { moveUci: "e7e5", rank: 1, mass: 0.6, scoreCp: 12, wdl: { win: 320, draw: 500, loss: 180 } },
    { moveUci: "c7c5", rank: 2, mass: 0.4, concessionRatio: 0.25, wdl: { win: 340, draw: 470, loss: 190 } },
  ],
});
const population = Object.freeze({ source: "lichess-explorer", ratings: [1400, 1600], speeds: ["blitz", "rapid"], since: "2023-09", until: "2026-08" });
const corpus = Object.freeze({
  nodeId: "node-1", committedMoveSan: "e5",
  result: {
    kind: "stats", total: 200, white: 90, draws: 50, black: 60,
    moves: [
      { san: "e5", uci: "e7e5", playedCount: 120, sharePct: 60, white: 55, draws: 30, black: 35 },
      { san: "c5", uci: "c7c5", playedCount: 50, sharePct: 25, white: 20, draws: 15, black: 15 },
    ],
    recency: { kind: "month", lastPlayedMonth: "2026-07" }, population,
  },
});

describe("human evidence response authority", () => {
  it("accepts and deeply freezes a bound Maia candidate page", () => {
    const page = parseHumanSplitPage(split, "node-1");
    expect(page).toEqual(split); expect(Object.isFrozen(page)).toBe(true); expect(Object.isFrozen(page.candidates[0]?.wdl)).toBe(true);
  });

  it.each([
    [{ ...split, nodeId: "node-2" }],
    [{ ...split, candidates: [split.candidates[0], { ...split.candidates[1], moveUci: "e7e5" }] }],
    [{ ...split, candidates: [{ ...split.candidates[0], mass: 0.7 }, { ...split.candidates[1], mass: 0.4 }] }],
    [{ ...split, candidates: [{ ...split.candidates[0], wdl: { win: 320, draw: 500, loss: 181 } }] }],
    [{ ...split, candidates: [{ moveUci: "e7e5", rank: 1, offWindow: true, mass: 0.2 }] }],
    [{ ...split, engine: { ...engine, internal: true } }],
  ])("refuses crossed, duplicate, arithmetically false, or unknown Maia bytes", (value) => {
    expect(() => parseHumanSplitPage(value, "node-1")).toThrow(TypeError);
  });

  it("accepts and deeply freezes stats and abstention corpus pages", () => {
    const stats = parseCorpusPage(corpus, "node-1");
    expect(stats).toEqual(corpus); expect(Object.isFrozen(stats.result)).toBe(true); expect(Object.isFrozen(stats.result.population.ratings)).toBe(true);
    expect(parseCorpusPage({ nodeId: "node-1", committedMoveSan: null, result: { kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100", population } }, "node-1").result.kind).toBe("abstention");
  });

  it.each([
    [{ ...corpus, nodeId: "node-2" }],
    [{ ...corpus, result: { ...corpus.result, total: 201 } }],
    [{ ...corpus, result: { ...corpus.result, moves: [{ ...corpus.result.moves[0], sharePct: 61 }] } }],
    [{ ...corpus, result: { ...corpus.result, moves: [...corpus.result.moves].reverse() } }],
    [{ ...corpus, result: { ...corpus.result, recency: { kind: "month", lastPlayedMonth: "2026-13" } } }],
    [{ ...corpus, result: { ...corpus.result, population: { ...population, ratings: [1600, 1400] } } }],
  ])("refuses crossed, inconsistent, unordered, or out-of-window corpus bytes", (value) => {
    expect(() => parseCorpusPage(value, "node-1")).toThrow(TypeError);
  });
});
