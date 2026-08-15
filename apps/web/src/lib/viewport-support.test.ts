import { describe, expect, it } from "vitest";

import { MINIMUM_RUN_VIEWPORT, runViewportSupport } from "./viewport-support.js";

describe("run viewport support", () => {
  it("states the measured 360 by 680 floor", () => {
    expect(MINIMUM_RUN_VIEWPORT).toEqual({ width: 360, height: 680 });
    expect(runViewportSupport(360, 680)).toMatchObject({ supported: true, reason: null });
  });

  it("refuses either dimension below the floor and explains the geometry", () => {
    for (const [width, height] of [[359, 844], [390, 679]] as const) {
      const result = runViewportSupport(width, height);
      expect(result.supported).toBe(false);
      expect(result.reason).toContain("24-pixel chess-square targets");
      expect(result.reason).toContain("fully visible board");
    }
  });
});
