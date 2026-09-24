// rfc/player-style.md criteria 1–3 (`make style-registry-check`): the production registry is
// derived — set-equal to R21's retained rows at R12's measured floors — and every drift is red.
import { readFileSync } from "node:fs";

import { STYLE_METRIC_COUNT_AT_LANDING, STYLE_METRICS } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { STYLE_METRICS as R21_ROWS } from "../../../tools/r21-style-feedback-contract/registry.js";
import { styleRegistryDrift } from "./style-registry-check.js";

const R12 = JSON.parse(readFileSync(new URL("../../../planning/platform-alignment/player-style/results.json", import.meta.url), "utf8")) as {
  readonly persistentFloors: Readonly<Record<string, number | null>>;
};

describe("criterion 1 — the registry is derived, never copied", () => {
  it("is set-equal by metric id, feature id and floor to R21's non-null-floor rows", () => {
    expect(styleRegistryDrift(STYLE_METRICS, R21_ROWS, R12.persistentFloors)).toEqual([]);
    // The count is a drift tripwire, never the criterion.
    expect(STYLE_METRICS).toHaveLength(STYLE_METRIC_COUNT_AT_LANDING);
  });
});

describe("criterion 2 — a re-floored metric fails", () => {
  it("turns red when one persistent floor is mutated", () => {
    const mutated = { ...R12.persistentFloors, castle_queenside_rate: 12 };
    expect(styleRegistryDrift(STYLE_METRICS, R21_ROWS.map((row) => row.metricId === "castle_queenside_rate" ? { ...row, measuredFloorGames: 12 } : row), mutated))
      .toEqual([{ kind: "refloored", metricId: "castle_queenside_rate", production: 50, measured: 12 }]);
    expect(styleRegistryDrift(STYLE_METRICS, R21_ROWS, mutated)).toEqual(expect.arrayContaining([
      { kind: "instrument_disagrees", metricId: "castle_queenside_rate", instrument: 50, measured: 12 },
      { kind: "refloored", metricId: "castle_queenside_rate", production: 50, measured: 12 },
    ]));
  });
});

describe("criterion 3 — an added or omitted metric fails", () => {
  it("is red when a thirteenth retained row appears", () => {
    const added = { ...R12.persistentFloors, forcing_choice_residual: 50 };
    expect(styleRegistryDrift(STYLE_METRICS, R21_ROWS, added)).toEqual([{ kind: "omitted", metricId: "forcing_choice_residual" }]);
  });

  it("is red when a production row is removed or invented", () => {
    expect(styleRegistryDrift(STYLE_METRICS.filter((row) => row.metricId !== "early_queen_choice_residual"), R21_ROWS, R12.persistentFloors))
      .toEqual([{ kind: "omitted", metricId: "early_queen_choice_residual" }]);
    expect(styleRegistryDrift([...STYLE_METRICS, { metricId: "reply_breadth", featureId: "x@1", floor: 25 }], R21_ROWS, R12.persistentFloors))
      .toEqual([{ kind: "added", metricId: "reply_breadth" }]);
  });

  it("treats a refused R12 metric (null floor) as absent from production", () => {
    expect(Object.entries(R12.persistentFloors).filter(([, floor]) => floor === null).map(([id]) => id).sort())
      .toEqual(["fianchetto_unblock_rate", "forcing_choice_residual", "nonpawn_capture_residual", "opponent_reply_breadth_residual"]);
    for (const refused of ["fianchetto_unblock_rate", "forcing_choice_residual", "nonpawn_capture_residual", "opponent_reply_breadth_residual"]) {
      expect(STYLE_METRICS.some((row) => row.metricId === refused)).toBe(false);
    }
  });
});
