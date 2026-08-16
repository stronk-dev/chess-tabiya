import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { RECORDED_READING_GUARD } from "./recorded-reading-sentences.js";

describe("recorded-reading population guard", () => {
  it("is declared once and rendered once by the surface container", () => {
    const screen = readFileSync(new URL("./DrillScreen.svelte", import.meta.url), "utf8");
    expect(screen.match(/RECORDED_READING_GUARD/gu)).toHaveLength(2); // import + one render
    expect(RECORDED_READING_GUARD).toBe("Recorded readings exist only for the positions this pack's author queried. Where none is shown, none was recorded.");
    expect(screen).not.toContain(RECORDED_READING_GUARD);
  });
});
