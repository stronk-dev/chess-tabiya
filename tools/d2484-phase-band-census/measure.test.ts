import { describe, expect, it } from "vitest";

import type { PhaseReading } from "../../packages/runtime/src/phase.js";
import { phaseDecision } from "./bands.js";

function reading(phase: PhaseReading["phase"], maximumMaterial: number, undeveloped: number): PhaseReading {
  return {
    fen: "fixture",
    phase,
    material: { white: maximumMaterial, black: maximumMaterial },
    undevelopedMinors: { white: undeveloped, black: 0 },
    provenanceNote: "fixture",
  };
}

describe("phase decision bands", () => {
  it("names every ordered decision arm and measures exact integer distances", () => {
    expect(phaseDecision(reading("endgame", 13, 8))).toMatchObject({ kind: "endgame_material_band", observed: 13, marginInsideBand: 0 });
    expect(phaseDecision(reading("unclear", 14, 8))).toMatchObject({ kind: "material_transition_gap", distanceToEndgameBand: 1, distanceToDevelopedBand: 4 });
    expect(phaseDecision(reading("unclear", 17, 8))).toMatchObject({ kind: "material_transition_gap", distanceToEndgameBand: 4, distanceToDevelopedBand: 1 });
    expect(phaseDecision(reading("opening", 18, 5))).toMatchObject({ kind: "opening_development_band", marginInsideBand: 0 });
    expect(phaseDecision(reading("middlegame", 18, 2))).toMatchObject({ kind: "middlegame_development_band", marginInsideBand: 0 });
    expect(phaseDecision(reading("unclear", 18, 3))).toMatchObject({ kind: "development_transition_gap", distanceToMiddlegameBand: 1, distanceToOpeningBand: 2 });
    expect(phaseDecision(reading("unclear", 18, 4))).toMatchObject({ kind: "development_transition_gap", distanceToMiddlegameBand: 2, distanceToOpeningBand: 1 });
  });

  it("refuses a supplied phase inconsistent with the operands", () => {
    expect(() => phaseDecision(reading("opening", 13, 8))).toThrow(/produces endgame/u);
  });
});
