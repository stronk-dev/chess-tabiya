import { describe, expect, it } from "vitest";

import { fires, normalize } from "./analyze.js";

describe("human-divergence measurement semantics", () => {
  it("matches the shipped inclusive 0.50 / 0.15 / three-candidate boundary", () => {
    expect(fires([0.5, 0.2, 0.15, 0.15])).toBe(true);
    expect(fires([0.50001, 0.2, 0.15, 0.14999])).toBe(false);
    expect(fires([0.49, 0.22, 0.149, 0.141])).toBe(false);
  });

  it("normalizes the recorded candidate window before classifying", () => {
    const normalized = normalize([0.3, 0.2, 0.1]);
    expect(normalized[0]).toBeCloseTo(0.5, 12);
    expect(normalized[1]).toBeCloseTo(1 / 3, 12);
    expect(normalized[2]).toBeCloseTo(1 / 6, 12);
    expect(fires([0.3, 0.2, 0.1])).toBe(true);
  });

  it("abstains on invalid or empty mass vectors", () => {
    expect(normalize([])).toEqual([]);
    expect(normalize([0, 0])).toEqual([]);
    expect(normalize([0.2, -0.1, 0.9])).toEqual([]);
    expect(fires([])).toBe(false);
  });
});
