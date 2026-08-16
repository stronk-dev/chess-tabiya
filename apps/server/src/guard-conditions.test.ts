import { describe, expect, it } from "vitest";

import {
  baseGuardConditionSettings,
  overrideGuardConditionSettings,
} from "./guard-conditions.js";

describe("guard condition desugaring", () => {
  it("merges explicit scalar shorthands with authored conditions", () => {
    expect(baseGuardConditionSettings({
      conditions: [{ kind: "tablebase_category_regression" }],
      evalSwingCp: 120,
      fireOnMate: true,
    }).conditions).toEqual([
      { kind: "tablebase_category_regression" },
      { kind: "engine_eval_swing", cp: 120 },
      { kind: "engine_mate_appears" },
    ]);
  });

  it("applies scalar overrides in place without reordering authored arms", () => {
    const base = baseGuardConditionSettings({
      conditions: [
        { kind: "engine_eval_swing", cp: 200 },
        { kind: "tablebase_category_regression" },
        { kind: "engine_mate_appears" },
      ],
    });
    expect(overrideGuardConditionSettings(base, {
      at: { atStart: true },
      evalSwingCp: 80,
      fireOnMate: false,
    }).conditions).toEqual([
      { kind: "engine_eval_swing", cp: 80 },
      { kind: "tablebase_category_regression" },
    ]);
  });
});
