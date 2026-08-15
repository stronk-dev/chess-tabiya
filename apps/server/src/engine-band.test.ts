import { describe, expect, it } from "vitest";

import { appliedTargetElo, engineBandProfile } from "./engine-band.js";
import type { EngineHealth } from "./engine-supervisor.js";

function health(overrides: Partial<EngineHealth> = {}): EngineHealth {
  return {
    id: "maia",
    status: "ready",
    restartCount: 0,
    identity: {
      id: "maia",
      kind: "opponent",
      name: "Maia",
      version: "1",
      seedHonored: false,
      eloHonored: true,
    },
    bandOption: "Elo",
    options: [{ name: "Elo", type: "spin", default: "1500", min: 0, max: 5000 }],
    ...overrides,
  };
}

describe("engine band contract", () => {
  it("publishes the deployment intersection without presenting it as an engine claim", () => {
    const profile = engineBandProfile(health({ bandRange: { min: 1100, max: 1900 } }));
    expect(profile).toEqual({
      min: 1100,
      max: 1900,
      default: 1500,
      source: "advertised+configured",
      advertised: { min: 0, max: 5000 },
    });
    expect(() => appliedTargetElo(health({ bandRange: { min: 1100, max: 1900 } }), 2000))
      .toThrow(expect.objectContaining({ code: "TARGET_ELO_OUT_OF_RANGE" }));
  });

  it("uses the advertised default and refuses silence when none exists", () => {
    expect(appliedTargetElo(health(), undefined)).toBe(1500);
    expect(() => appliedTargetElo(health({
      options: [{ name: "Elo", type: "spin", min: 0, max: 5000 }],
    }), undefined)).toThrow(expect.objectContaining({ code: "TARGET_ELO_REQUIRED" }));
  });

  it("accepts a declared band when the deployment publishes no bounds", () => {
    const unpublished = health({ options: [] });
    expect(engineBandProfile(unpublished).source).toBe("unpublished");
    expect(appliedTargetElo(unpublished, 9000)).toBe(9000);
  });
});
