import { describe, expect, it } from "vitest";

import { krpkrGeometry } from "./geometry.js";

describe("source-bounded KRPKR setup geometry", () => {
  it("recognizes the published canonical Lucena diagram and hard negatives", () => {
    const canonical = "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1";
    expect(krpkrGeometry(canonical)).toMatchObject({ lucenaCanonicalSetup: true, philidorCanonicalSetup: false, vancuraCanonicalSetup: false });
    expect(krpkrGeometry("1K1k4/8/1P6/8/8/8/r7/2R5 w - - 0 1")?.lucenaCanonicalSetup).toBe(false);
    expect(krpkrGeometry("3k4/1P6/1K6/8/8/8/r7/2R5 w - - 0 1")?.lucenaCanonicalSetup).toBe(false);
    expect(krpkrGeometry("1K1k4/1P6/2r5/8/8/8/8/2R5 w - - 0 1")?.lucenaCanonicalSetup).toBe(false);
  });

  it("recognizes the published canonical Philidor diagram and hard negatives", () => {
    const canonical = "8/8/8/8/4pk2/R7/7r/4K3 w - - 0 1";
    expect(krpkrGeometry(canonical)).toMatchObject({ lucenaCanonicalSetup: false, philidorCanonicalSetup: true, vancuraCanonicalSetup: false });
    expect(krpkrGeometry("8/8/8/8/5k2/R3p3/7r/4K3 w - - 0 1")?.philidorCanonicalSetup).toBe(false);
    expect(krpkrGeometry("8/8/8/8/4pk2/8/R6r/4K3 w - - 0 1")?.philidorCanonicalSetup).toBe(false);
  });

  it("recognizes the published canonical Vancura diagram and hard negatives", () => {
    const canonical = "R7/6k1/P4r2/8/2K5/8/8/8 w - - 0 1";
    expect(krpkrGeometry(canonical)).toMatchObject({ lucenaCanonicalSetup: false, philidorCanonicalSetup: false, vancuraCanonicalSetup: true });
    expect(krpkrGeometry("1R6/6k1/P4r2/8/2K5/8/8/8 w - - 0 1")?.vancuraCanonicalSetup).toBe(false);
    expect(krpkrGeometry("R7/6k1/1P3r2/8/2K5/8/8/8 w - - 0 1")?.vancuraCanonicalSetup).toBe(false);
  });

  it("is color-symmetric on a black-attacker Lucena reflection", () => {
    expect(krpkrGeometry("2r5/R7/8/8/8/8/1p6/1k1K4 b - - 0 1")?.lucenaCanonicalSetup).toBe(true);
  });
});
