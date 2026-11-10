import { resolvePackPath } from "@chess-tabiya/schema/pack-path";
import { readFileSync } from "node:fs";
import { DRILL_PACK_SCHEMA_VERSION } from "@chess-tabiya/schema";
import type { DrillPackDefinition } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";
import { validatePackDocument } from "./pack-validation.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";

const source = JSON.parse(readFileSync(
  new URL(resolvePackPath("trajectory-mate-bishop-knight"), import.meta.url),
  "utf8",
)) as DrillPackDefinition;
function candidate(): any {
  const value = structuredClone(source) as any;
  value.shapes = ["carlsbad"];
  value.legs[0].opponentPolicy = { mode: "human_common", targetElo: 1600 };
  value.legs[0].shapes = ["carlsbad"];
  return value;
}

describe("format surface 0.25", { timeout: 5_000 }, () => {
  it("admits narrowed per-leg policy and pack-listed shapes without moving existing content", () => {
    const value = withDerivedRequires(candidate());
    const result = validatePackDocument(value);
    expect(result.valid, JSON.stringify(result.issues)).toBe(true);
    expect(DRILL_PACK_SCHEMA_VERSION).toBe("0.33");
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
});
