import { readFileSync } from "node:fs";

import { DRILL_PACK_SCHEMA_VERSION } from "@chess-tabiya/schema";
import { FORMAT_DISPOSITIONS, type DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { RUN_OPPONENT_MODES } from "@chess-tabiya/runtime";
import { describe, expect, it } from "vitest";

import { DECLARED_UNIMPLEMENTED_POLICY_MODES } from "./capabilities.js";
import { validatePackDocument } from "./pack-validation.js";

const source = JSON.parse(readFileSync(
  new URL("../../../content/drafts/trajectory-mate-bishop-knight.json", import.meta.url),
  "utf8",
)) as DrillPackDefinition;

function candidate(): any {
  const value = structuredClone(source) as any;
  value.shapes = ["carlsbad"];
  value.legs[0].opponentPolicy = { mode: "human_common", targetElo: 1600 };
  value.legs[0].shapes = ["carlsbad"];
  return value;
}

describe("format surface 0.25", () => {
  it("admits narrowed per-leg policy and pack-listed shapes without moving existing content", () => {
    const value = candidate();
    const result = validatePackDocument(value);
    expect(result.valid, JSON.stringify(result.issues)).toBe(true);
    expect(DRILL_PACK_SCHEMA_VERSION).toBe("0.25");
  });

  it("refuses every inert or unrecordable per-leg form by name", () => {
    const empty = candidate();
    empty.legs[0].shapes = [];
    expect(validatePackDocument(empty).issues).toContainEqual(expect.objectContaining({ code: "LEG_SHAPE_LIST_EMPTY", path: "/legs/0/shapes" }));

    const unlisted = candidate();
    unlisted.legs[0].shapes = ["not-listed-at-pack-root"];
    expect(validatePackDocument(unlisted).issues).toContainEqual(expect.objectContaining({ code: "LEG_SHAPE_REF_UNLISTED", path: "/legs/0/shapes/0" }));

    const eloIgnored = candidate();
    eloIgnored.legs[0].opponentPolicy = { mode: "strong_engine", targetElo: 1600 };
    expect(validatePackDocument(eloIgnored).issues).toContainEqual(expect.objectContaining({ code: "LEG_POLICY_ELO_UNHONORED", path: "/legs/0/opponentPolicy/targetElo" }));

    const outOfRange = candidate();
    outOfRange.legs[0].opponentPolicy = { mode: "human_common", targetElo: 999 };
    expect(validatePackDocument(outOfRange).issues).toContainEqual(expect.objectContaining({ code: "LEG_TARGET_ELO_OUT_OF_RANGE", path: "/legs/0/opponentPolicy/targetElo" }));

    const unsupported = candidate();
    unsupported.legs[0].opponentPolicy = { mode: "perfect_tablebase" };
    expect(validatePackDocument(unsupported).issues).toContainEqual(expect.objectContaining({ code: "SCHEMA_ENUM", path: "/legs/0/opponentPolicy/mode" }));
  });

  it("warns once per retry entry and derives each counterpart from its kind", () => {
    const value = candidate();
    value.retryVariants = [
      { kind: "opposite_side" },
      { kind: "different_material_details" },
    ];
    const warnings = validatePackDocument(value).issues.filter((issue) => issue.code === "RETRY_VARIANTS_NOT_EXECUTABLE");
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatchObject({ severity: "warning", path: "/retryVariants/0", message: expect.stringContaining("same_root_other_side") });
    expect(warnings[1]).toMatchObject({ severity: "warning", path: "/retryVariants/1", message: expect.stringContaining("no variantOf counterpart") });
  });

  it("keeps the schema-owned disposition register non-vacuous and aligned", () => {
    const keys = FORMAT_DISPOSITIONS.map((entry) => `${entry.pointer}\u0000${entry.value ?? ""}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(FORMAT_DISPOSITIONS.find((entry) => entry.pointer === "assistance:arrows")).toMatchObject({ disposition: "unmeasured", experiment: expect.any(String) });
    expect(FORMAT_DISPOSITIONS.find((entry) => entry.pointer === "error:SIMULATE_BUDGET_EXCEEDED")).toMatchObject({ disposition: "retired", removedAt: "0.25" });
    expect(FORMAT_DISPOSITIONS.find((entry) => entry.pointer === "/retryVariants")).toMatchObject({ disposition: "refused" });

    const declared = new Set(DECLARED_UNIMPLEMENTED_POLICY_MODES.map((entry) => entry.mode));
    const schemaOnly = new Set(["plan_defense", "human_external"]);
    expect(declared).toEqual(schemaOnly);
    expect([...schemaOnly].every((mode) => !RUN_OPPONENT_MODES.includes(mode as never))).toBe(true);
    for (const refusal of DECLARED_UNIMPLEMENTED_POLICY_MODES) {
      expect(FORMAT_DISPOSITIONS).toContainEqual(expect.objectContaining({
        pointer: "/opponentPolicy/mode",
        value: refusal.mode,
        disposition: "refused",
        reason: refusal.reason,
      }));
    }

    const capabilitiesSource = readFileSync(new URL("./capabilities.ts", import.meta.url), "utf8");
    expect(capabilitiesSource).not.toContain("formatDispositions");
  });
});
