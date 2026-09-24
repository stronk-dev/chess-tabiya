import { readFileSync } from "node:fs";

import { BOT_LAYER_DECLARATIONS, BOT_MEASUREMENT_IDS, BOT_SAMPLER } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { BOT_POLICY_MEASUREMENTS } from "./bot-policy-measurements.js";

const read = <T>(path: string): T => JSON.parse(readFileSync(new URL(`../../../${path}`, import.meta.url), "utf8")) as T;

interface Arm { readonly cells: number; readonly expectedLossCp: number; readonly severe250: number; readonly pawnRate: number }
interface R11 {
  readonly measuredAt: string;
  readonly parameters: { readonly productionTemperature: number; readonly productionTopP: number; readonly guardCp: number; readonly pawnMultiplier: number };
  readonly mixedScorePolicy?: string;
  readonly population: { readonly cells: number };
  readonly summary: Record<string, Arm>;
  readonly gates: {
    readonly guard_250: { readonly severeRemoved: number; readonly strengtheningCp: number; readonly humanRetention: number; readonly pass: boolean };
    readonly traits: Record<string, { readonly traitDelta: number; readonly lossDeltaCp: number; readonly severeRise: number; readonly humanRetention: number; readonly pass: boolean }>;
  };
}

describe("registered bot measurements equal their committed artifacts", () => {
  it("covers every registered measurement id", () => {
    expect(Object.keys(BOT_POLICY_MEASUREMENTS).sort()).toEqual([...BOT_MEASUREMENT_IDS].sort());
    for (const measurement of Object.values(BOT_POLICY_MEASUREMENTS)) {
      expect(() => readFileSync(new URL(`../../../${measurement.artifact}`, import.meta.url))).not.toThrow();
      expect(() => readFileSync(new URL(`../../../${measurement.dossier}`, import.meta.url))).not.toThrow();
    }
  });

  it("A7: the captured production sample stays within 0.5 cp / 0.1 pp of the reconstruction; the raw vector does not", () => {
    const measured = BOT_POLICY_MEASUREMENTS["measurement.sampler_reconstruction@1"];
    const r11 = read<R11>(measured.artifact);
    const captured = r11.summary.current_sample!;
    const reconstructed = r11.summary.production_sampler!;
    const raw = r11.summary.maia_raw_policy!;
    expect(r11.population.cells).toBe(measured.cells);
    expect([captured.expectedLossCp, reconstructed.expectedLossCp, captured.severe250, reconstructed.severe250, raw.expectedLossCp])
      .toEqual([measured.capturedExpectedLossCp, measured.reconstructedExpectedLossCp, measured.capturedSevere250, measured.reconstructedSevere250, measured.rawVectorExpectedLossCp]);
    expect(Math.abs(reconstructed.expectedLossCp - captured.expectedLossCp)).toBeLessThan(0.5);
    expect(Math.abs(reconstructed.severe250 - captured.severe250)).toBeLessThan(0.001);
    expect(Math.abs(raw.expectedLossCp - captured.expectedLossCp)).toBeGreaterThan(30);
    expect([r11.parameters.productionTemperature, r11.parameters.productionTopP]).toEqual([BOT_SAMPLER.temperature, BOT_SAMPLER.topP]);
  });

  it("binds the guard and pawn statements to the depth-8 artifact, not the depth-12 one", () => {
    const guard = BOT_POLICY_MEASUREMENTS["measurement.guard_depth8@1"];
    const pawn = BOT_POLICY_MEASUREMENTS["measurement.pawn_x4_depth8@1"];
    const depth8 = read<R11>(guard.artifact);
    expect(depth8.population.cells).toBe(guard.cells);
    expect(depth8.mixedScorePolicy).toBe(guard.mixedScorePolicy);
    expect(depth8.parameters.guardCp).toBe(BOT_LAYER_DECLARATIONS["guard.severe_error@1"].parameters.thresholdCp);
    expect(depth8.parameters.pawnMultiplier).toBe(BOT_LAYER_DECLARATIONS["trait.pawn_preference@1"].parameters.multiplier);
    expect(depth8.gates.guard_250).toEqual({ severeRemoved: guard.severeRemoved, strengtheningCp: guard.strengtheningCp, humanRetention: guard.humanRetention, pass: true });
    expect(depth8.gates.traits.pawn_x4_guarded).toEqual({ traitDelta: pawn.traitDelta, lossDeltaCp: pawn.lossDeltaCp, severeRise: pawn.severeRise, humanRetention: pawn.humanRetention, pass: true });
    expect(depth8.summary.guard_250!.pawnRate).toBe(pawn.guardedPawnRate);
    expect(depth8.summary.pawn_x4_guarded!.pawnRate).toBe(pawn.traitPawnRate);
    // bot-roster criterion 8: the depth-12 triple (1.27 cp / 100.2% / +11.97 pp) is not production.
    const depth12 = read<R11>("planning/platform-alignment/bot-policy/results.json");
    expect(depth12.gates.guard_250.strengtheningCp).not.toBe(guard.strengtheningCp);
    expect(depth12.gates.traits.pawn_x4_guarded!.traitDelta).not.toBe(pawn.traitDelta);
    expect(depth12.gates.traits.pawn_x4_guarded!.lossDeltaCp).toBeCloseTo(-1.01, 2);
    expect(pawn.lossDeltaCp).toBeCloseTo(-0.88, 2);
  });

  it("reads the band-ladder ordering from the D333 summary", () => {
    const ladder = BOT_POLICY_MEASUREMENTS["measurement.maia_band_ladder@1"];
    const summary = read<{ readonly d324PreRegistered: { readonly rungs: readonly { readonly arm: string; readonly n: number }[]; readonly monotone: boolean; readonly allCiDisjoint: boolean } }>(ladder.artifact);
    const rungs = summary.d324PreRegistered.rungs;
    expect(rungs.map((rung) => rung.arm)).toEqual(ladder.bands.map((band) => `ladder-${band}-v-${ladder.reference}`));
    expect(rungs.every((rung) => rung.n === ladder.gamesPerRung)).toBe(true);
    expect([summary.d324PreRegistered.monotone, summary.d324PreRegistered.allCiDisjoint]).toEqual([ladder.monotone, ladder.allCiDisjoint]);
  });
});
