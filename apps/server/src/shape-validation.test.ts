import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { validateShapeEntry } from "./shape-validation.js";
import { validatePackDocument } from "./pack-validation.js";
import { ShapeRegistry } from "./shape-registry.js";

const entry = JSON.parse(readFileSync(new URL("../../../content/shapes/carlsbad.json", import.meta.url), "utf8"));

describe("shape entry validation", () => {
  it("accepts the official Carlsbad entry and reports probe matches", () => {
    const result = validateShapeEntry(entry, { probeFen: "r1bqr1k1/pp1nbppp/2p2n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10" });
    expect(result.valid).toBe(true);
    expect(result.probeMatches).toBe(true);
  });

  it.each([
    ["SHAPE_TRIGGER_TRUE_AT_INITIAL", { ...entry, trigger: { kind: "not", of: { kind: "feature", feature: { kind: "open_file", file: "a" } } } }],
    ["SHAPE_DUPLICATE_PLAN_ID", { ...entry, plans: [...entry.plans, entry.plans[0]] }],
    ["SHAPE_PLAN_SIDES_ONE_WAY", { ...entry, plans: entry.plans.filter((plan: any) => plan.side === "white") }],
    ["SHAPE_PROSE_CONTAINS_FEN", { ...entry, watch: ["Use rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 here"] }],
  ])("refuses %s", (code, candidate) => {
    expect(validateShapeEntry(candidate).issues).toContainEqual(expect.objectContaining({ code }));
  });
});

describe("pack shape references", () => {
  it.each([
    ["SHAPE_REFERENCE_UNKNOWN", (pack: any) => ({ ...pack, shapes: ["missing"] })],
    ["SHAPE_PLAN_REF_UNLISTED", (pack: any) => ({ ...pack, shapes: ["iqp-white"], planClasses: [{ ...pack.planClasses[0], shapePlan: { shape: "carlsbad", plan: "white-minority-attack" } }] })],
    ["SHAPE_PLAN_UNKNOWN", (pack: any) => ({ ...pack, shapes: ["carlsbad"], planClasses: [{ ...pack.planClasses[0], shapePlan: { shape: "carlsbad", plan: "missing" } }] })],
  ])("refuses %s against the loaded catalogue", async (code, mutate) => {
    const pack = JSON.parse(readFileSync(new URL("../../../content/drafts/carlsbad-minority-attack.json", import.meta.url), "utf8"));
    const registry = await ShapeRegistry.loadDefault();
    expect(validatePackDocument(mutate(pack), { shapes: registry }).issues).toContainEqual(expect.objectContaining({ code }));
  });
});
