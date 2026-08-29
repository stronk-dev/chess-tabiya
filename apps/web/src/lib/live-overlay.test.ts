import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import { liveOverlayObjectiveCopy } from "./live-overlay.js";

describe("live overlay objective copy", () => {
  it("uses only the authored objective sentence and translates every runtime state", () => {
    const pack = { objective: { summary: "Hold the queenside and compare both plans." } } as DrillPackDefinition;
    expect(liveOverlayObjectiveCopy(pack, "active")).toEqual({ headline: "Hold the queenside and compare both plans.", status: "Objective in progress" });
    expect(liveOverlayObjectiveCopy(pack, "preserved").status).toBe("Objective preserved");
    expect(liveOverlayObjectiveCopy(pack, "degraded").status).toBe("Objective under pressure");
    expect(liveOverlayObjectiveCopy(pack, "failed").status).toBe("Objective not achieved");
    expect(liveOverlayObjectiveCopy(pack, "achieved").status).toBe("Objective achieved");
    expect(liveOverlayObjectiveCopy(pack, "transitioned").status).toBe("Objective changed");
  });

  it("states objective absence instead of turning a runtime enum into a headline", () => {
    expect(liveOverlayObjectiveCopy(undefined, "active")).toEqual({
      headline: "No rehearsal objective is attached to this run.",
      status: "Objective in progress",
    });
  });
});
