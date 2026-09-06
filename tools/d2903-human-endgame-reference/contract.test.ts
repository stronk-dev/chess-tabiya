// DISPOSABLE research harness — D2903. Not production code.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  classScores,
  exactMoveNll,
  extractHumanEndgamePopulation,
  normalize,
  populationCapacity,
  reweight,
} from "./population.js";

const FIXTURE = new URL("../r2-selection-harness/imported-sample.pgn", import.meta.url);
const META = new URL("../r2-selection-harness/fixture.json", import.meta.url);
const FIXTURE_TEXT = readFileSync(FIXTURE, "utf8");
const POPULATION = extractHumanEndgamePopulation(FIXTURE_TEXT);
const CAPACITY = populationCapacity(POPULATION);

describe("D2903 paired human endgame reference", () => {
  it("retains the sealed 108-game CC0 source before selecting any provider result", () => {
    const meta = JSON.parse(readFileSync(META, "utf8"));
    const fixture = FIXTURE_TEXT;
    expect(meta).toMatchObject({
      source: { licence: "CC0-1.0" },
      fixture: { games: 108, path: "imported-sample.pgn" },
    });
    const rows = POPULATION;
    expect(new Set(rows.map((row) => row.gameHash)).size).toBe(rows.length);
    expect(rows.every((row) => row.ply >= 41 && row.pieceCount >= 3 && row.pieceCount <= 7)).toBe(true);
  });

  it("selects the same exact game positions when PGN block order changes", () => {
    const fixture = FIXTURE_TEXT;
    const blocks = fixture.split(/\n(?=\[Event )/u);
    const forward = extractHumanEndgamePopulation(fixture).map(({ gameHash, ply, fen, humanMoveUci }) => ({ gameHash, ply, fen, humanMoveUci }));
    const reverse = extractHumanEndgamePopulation(blocks.reverse().join("\n")).map(({ gameHash, ply, fen, humanMoveUci }) => ({ gameHash, ply, fen, humanMoveUci }));
    expect(reverse).toEqual(forward);
  });

  it("makes the committed population pass or fail only the frozen pre-provider floor", () => {
    expect(CAPACITY.distinctGames).toBe(POPULATION.length);
    expect(CAPACITY.preProviderSufficient).toBe(
      POPULATION.length >= 30 && CAPACITY.band1400 >= 10 && CAPACITY.band1800 >= 10
        && CAPACITY.king >= 10 && CAPACITY.nonKing >= 10,
    );
    console.log(`D2903 population: ${JSON.stringify(CAPACITY)}`);
  });

  it("rewards king mass only for a human king move and penalizes it otherwise", () => {
    const base = normalize([["e2e3", 0.4], ["a1a2", 0.6]]);
    const transformed = reweight(base, new Set(["e2e3"]), 4);
    const baseKing = classScores(base.get("e2e3")!, true);
    const transformedKing = classScores(transformed.get("e2e3")!, true);
    const baseOther = classScores(base.get("e2e3")!, false);
    const transformedOther = classScores(transformed.get("e2e3")!, false);
    expect(transformedKing.logLoss).toBeLessThan(baseKing.logLoss);
    expect(transformedKing.brier).toBeLessThan(baseKing.brier);
    expect(transformedOther.logLoss).toBeGreaterThan(baseOther.logLoss);
    expect(transformedOther.brier).toBeGreaterThan(baseOther.brier);
  });

  it("keeps class improvement unable to hide worse exact-move probability", () => {
    const base = normalize([["e2e3", 0.2], ["e2f3", 0.3], ["a1a2", 0.5]]);
    const crossed = normalize([["e2e3", 0.1], ["e2f3", 0.7], ["a1a2", 0.2]]);
    expect(classScores(0.8, true).logLoss).toBeLessThan(classScores(0.5, true).logLoss);
    expect(exactMoveNll(crossed, "e2e3")!).toBeGreaterThan(exactMoveNll(base, "e2e3")!);
  });

  it("reports an absent retained human move instead of inventing epsilon mass", () => {
    expect(exactMoveNll(normalize([["a1a2", 1]]), "e2e3")).toBeNull();
    expect(classScores(0, true).logLoss).toBe(Number.POSITIVE_INFINITY);
    expect(classScores(1, false).logLoss).toBe(Number.POSITIVE_INFINITY);
  });

  it("makes every insufficient-population arm fail", () => {
    expect(populationCapacity(POPULATION.slice(0, 29)).preProviderSufficient).toBe(false);
    expect(populationCapacity(POPULATION.filter((row) => row.band === 1400)).preProviderSufficient).toBe(false);
    expect(populationCapacity(POPULATION.filter((row) => row.humanKingMove)).preProviderSufficient).toBe(false);
  });
});
