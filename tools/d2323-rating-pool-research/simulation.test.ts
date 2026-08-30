import { describe, expect, it } from "vitest";
import recorded from "./results.json";

import { buildResearchReport, meanRating, offsetSeparation, simulatePool, summarize } from "./simulation.ts";

const closeTo = (values: readonly number[], target: number, tolerance: number): void => {
  expect(Math.max(...values.map((value) => Math.abs(value - target)))).toBeLessThan(tolerance);
};

describe("D2323 closed and calibrated rating pools", () => {
  it("re-derives the committed research receipt", () => {
    expect(buildResearchReport()).toEqual(recorded);
  });

  it("proves a closed pool has an unidentifiable additive origin", () => {
    const baseline = simulatePool({ periods: 500, seed: 11 });
    const translated = simulatePool({ periods: 500, seed: 11, initialOffset: 200 });
    closeTo(offsetSeparation(baseline, translated), 200, 1e-8);
  });

  it("distinguishes stochastic centroid movement from monotone or unbounded drift", () => {
    const centroids = Array.from({ length: 32 }, (_, seed) => meanRating(simulatePool({ periods: 500, seed })) - 1500);
    const distribution = summarize(centroids);
    expect(distribution.min).toBeLessThan(0);
    expect(distribution.max).toBeGreaterThan(0);
    expect(Math.abs(distribution.mean)).toBeLessThan(20);
    expect(Math.max(Math.abs(distribution.min), Math.abs(distribution.max))).toBeLessThan(120);
  });

  it("measures anchor information as a dose rather than a zero/nonzero bit", () => {
    const separation = (anchorEvery: number): number => {
      const base = simulatePool({ periods: 600, seed: 23, anchorEvery, anchorLearners: Array.from({ length: 8 }, (_, index) => `p${index}`) });
      const shifted = simulatePool({ periods: 600, seed: 23, initialOffset: 200, anchorEvery, anchorLearners: Array.from({ length: 8 }, (_, index) => `p${index}`) });
      return summarize(offsetSeparation(base, shifted)).mean;
    };
    const sparse = separation(100);
    const medium = separation(20);
    const dense = separation(5);
    expect(sparse).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(dense);
    expect(sparse).toBeGreaterThan(20);
    expect(dense).toBeLessThan(5);
  });

  it("shows calibration propagates through a connected game graph", () => {
    const options = { periods: 1000, seed: 41, componentSizes: [4, 4] as const, anchorEvery: 5, anchorLearners: ["p0"] };
    const base = simulatePool(options);
    const shifted = simulatePool({ ...options, initialOffset: 200 });
    const separation = offsetSeparation(base, shifted);
    const connectedIndirect = separation.slice(1, 4);
    const disconnected = separation.slice(4);
    expect(base[1]!.directAnchorGames).toBe(0);
    expect(base[4]!.directAnchorGames).toBe(0);
    expect(Math.max(...connectedIndirect)).toBeLessThan(80);
    closeTo(disconnected, 200, 1e-8);
  });
});
