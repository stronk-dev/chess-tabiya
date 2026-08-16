import { describe, expect, it } from "vitest";

import { comparisonBandMinimumRem, defaultComparisonZoom } from "./compare-geometry.js";

describe("comparison geometry", () => {
  it("keeps two-branch comparison board-first", () => {
    expect(defaultComparisonZoom(2)).toBe("near");
  });

  it("opens larger comparisons at a one-screen overview", () => {
    expect(defaultComparisonZoom(8)).toBe("far");
    const tabletContentRem = (768 - 2 * 16) / 16;
    expect(comparisonBandMinimumRem(8, "far")).toBeLessThanOrEqual(tabletContentRem);
    expect(comparisonBandMinimumRem(8, "near")).toBeGreaterThan(tabletContentRem);
  });

  it("refuses nonsensical branch counts", () => {
    expect(() => comparisonBandMinimumRem(0, "far")).toThrow(/positive integer/u);
  });
});
