import { describe, expect, it } from "vitest";

import { MINIMUM_RUN_VIEWPORT, runViewportSupport } from "./viewport-support.js";

describe("run viewport support", () => {
  it("states the WCAG reflow floor", () => {
    expect(MINIMUM_RUN_VIEWPORT).toEqual({ width: 320, height: 256 });
    expect(runViewportSupport(320, 256)).toMatchObject({ supported: true, reason: null });
  });

  it("refuses either dimension below the floor and explains the geometry", () => {
    for (const [width, height] of [[319, 844], [390, 255]] as const) {
      const result = runViewportSupport(width, height);
      expect(result.supported).toBe(false);
      expect(result.reason).toContain("24-pixel chess-square targets");
      expect(result.reason).toContain("horizontal scrolling");
    }
  });
});
