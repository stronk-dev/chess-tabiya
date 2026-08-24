import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { BANNED_JUDGEMENTS } from "./voice.js";
import {
  GLICKO2_CONSTANTS,
  RATED_OPPONENT_CALIBRATION,
  RATING_DISCLOSURES,
  RatingContractError,
  assertRatedOpponentCalibration,
  bandEquivalent,
  glicko2Update,
  initialRating,
  publishRating,
  ratedOpponentRung,
} from "./rating.js";

describe("learner rating foundation", () => {
  it("reproduces Glickman's worked example", () => {
    const updated = glicko2Update({ rating: 1500, rd: 200, volatility: 0.06 }, [
      { opponentRating: 1400, opponentRd: 30, score: 1 },
      { opponentRating: 1550, opponentRd: 100, score: 0 },
      { opponentRating: 1700, opponentRd: 300, score: 0 },
    ]);
    expect(updated.rating).toBeCloseTo(1464.0507, 4);
    expect(updated.rd).toBeCloseTo(151.5165, 4);
    expect(updated.volatility).toBeCloseTo(0.059996, 5);
  });

  it("pins the four calibration rungs to the measured artifact and the conservative RD rule", () => {
    const artifact = JSON.parse(readFileSync(new URL("../../../tools/d333-band-outcome-harness/out/derived.json", import.meta.url), "utf8")) as { fullMaterialLadder: { rungs: Record<string, { elo: number }> } };
    const halfWidths = [18.9, 24.1, 20.6, 16.2];
    expect(() => assertRatedOpponentCalibration()).not.toThrow();
    for (const [index, rung] of RATED_OPPONENT_CALIBRATION.rungs.entries()) {
      expect(rung.measuredElo).toBe(artifact.fullMaterialLadder.rungs[`ladder-${rung.band}-v-1400`]!.elo);
      expect(rung.halfWidth).toBe(halfWidths[index]);
      expect(rung.rd).toBe(Math.max(rung.halfWidth, 24.1));
    }
    expect(() => assertRatedOpponentCalibration({ ...RATED_OPPONENT_CALIBRATION, minStartPieceCount: 20 })).toThrowError(expect.objectContaining<Partial<RatingContractError>>({ code: "RATING_CALIBRATION_INVALID" }));
  });

  it("offers only measured bands and seeds without pretending band units are rating units", () => {
    expect(ratedOpponentRung(1200)).toBeUndefined();
    expect(ratedOpponentRung(2200)).toMatchObject({ rating: 1792.2, rd: 24.1 });
    expect(initialRating()).toEqual({ rating: 1500, rd: 350, volatility: 0.06 });
    expect(initialRating(1000)).toEqual({ rating: 1312.4, rd: 350, volatility: 0.06 });
  });

  it("widens uncertainty over an empty period without moving the rating", () => {
    const updated = glicko2Update({ rating: 1500, rd: 60, volatility: 0.06 }, []);
    expect(updated.rating).toBe(1500);
    expect(updated.rd).toBeGreaterThan(60);
    expect(updated.volatility).toBe(0.06);
    expect(() => glicko2Update({ rating: 1500, rd: 0, volatility: 0.06 }, [])).toThrow(/RATING_UPDATE_INVALID/u);
  });

  it("publishes an interpolated band-equivalent, an interval, or an honest bound", () => {
    expect(bandEquivalent(1500)).toEqual({ kind: "band", value: 1400 });
    expect(bandEquivalent(1312.3)).toEqual({ kind: "below", band: 1000 });
    expect(bandEquivalent(1800)).toEqual({ kind: "above", band: 2200 });
    const base = { calibrationId: RATED_OPPONENT_CALIBRATION.id, rating: 1500, rd: 50, volatility: 0.06, ratedGames: 40, voidedGames: 0, abandonedGames: 0 };
    expect(publishRating({ ...base, ratedGames: 0 })).toBeUndefined();
    const highRd = publishRating({ ...base, rd: 61 });
    expect(highRd).toMatchObject({ state: "provisional" });
    expect(highRd).not.toHaveProperty("pointEstimate");
    const abandoned = publishRating({ ...base, abandonedGames: 14 });
    expect(abandoned).toMatchObject({ state: "provisional" });
    expect(abandoned).not.toHaveProperty("pointEstimate");
    expect(publishRating(base)).toMatchObject({ state: "published", pointEstimate: { kind: "band", value: 1400 } });
    expect(publishRating({ ...base, rating: GLICKO2_CONSTANTS.bracketLow - 1 })).toMatchObject({ state: "bounded", pointEstimate: { kind: "below", band: 1400 } });
    expect(publishRating({ ...base, rating: GLICKO2_CONSTANTS.bracketHigh + 1 })).toMatchObject({ state: "bounded", pointEstimate: { kind: "above", band: 2200 } });
    expect(publishRating(base, { scoreSaturation: "low" })).toMatchObject({ state: "bounded", pointEstimate: { kind: "below", band: 1400 } });
    expect(publishRating(base, { scoreSaturation: "high" })).toMatchObject({ state: "bounded", pointEstimate: { kind: "above", band: 2200 } });
  });

  it("keeps the complete authored rating copy outside the judgement vocabulary", () => {
    expect(RATING_DISCLOSURES).toHaveLength(7);
    expect([GLICKO2_CONSTANTS.bracketLow, GLICKO2_CONSTANTS.bracketHigh]).toEqual([1500, 1800]);
    for (const sentence of RATING_DISCLOSURES) {
      const words = new Set(sentence.toLowerCase().match(/[a-z]+/gu) ?? []);
      expect(BANNED_JUDGEMENTS.filter((word) => words.has(word))).toEqual([]);
    }
  });
});
