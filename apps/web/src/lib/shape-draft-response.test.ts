import { describe, expect, it } from "vitest";

import type { ShapeDraft, ShapeSummary } from "./api.js";
import { validRegisteredShapeIdentity, validShapeDraftIdentity, validShapeValidation } from "./shape-draft-response.js";

const digest = `sha256:${"a".repeat(64)}`;

function draft(overrides: Partial<ShapeDraft> = {}): ShapeDraft {
  return {
    id: "draft-1",
    shapeId: "shape-1",
    document: { id: "shape-1", version: "1.0.0" },
    digest,
    state: "draft",
    validation: { valid: true, issues: [] },
    ...overrides,
  };
}

function summary(overrides: Partial<ShapeSummary> = {}): ShapeSummary {
  return {
    id: "shape-1",
    version: "1.0.0",
    digest,
    name: "Shape one",
    phases: ["middlegame"],
    licence: "CC-BY-SA-4.0",
    channel: "community",
    usedByPacks: 0,
    ...overrides,
  };
}

describe("shape draft response identity", () => {
  it("accepts the exact mutable draft and registered projection", () => {
    const current = draft();
    expect(validShapeDraftIdentity(current, "shape-1")).toBe(true);
    expect(validRegisteredShapeIdentity(summary(), current)).toBe(true);
  });

  it.each([
    { id: "" },
    { shapeId: "shape-2" },
    { document: { id: "shape-2", version: "1.0.0" } },
    { digest: "" },
    { state: "registered" as const },
    { validation: { valid: true, issues: "not-an-array" } as unknown as ShapeDraft["validation"] },
  ])("refuses a crossed or unusable draft %#", (overrides) => {
    expect(validShapeDraftIdentity(draft(overrides), "shape-1")).toBe(false);
  });

  it("refuses malformed validation projections", () => {
    expect(validShapeValidation({ valid: true, issues: [], probeMatches: false, corpusPreview: { fires: 1, of: 1, matches: [] } })).toBe(true);
    expect(validShapeValidation({ valid: true, issues: [{ code: "X", path: "/", message: 7 }] })).toBe(false);
    expect(validShapeValidation({ valid: true, issues: [], corpusPreview: { fires: 2, of: 1, matches: [] } })).toBe(false);
  });

  it.each([
    { id: "shape-2" },
    { version: "2.0.0" },
    { digest: `sha256:${"b".repeat(64)}` },
    { channel: "official" as const },
    { usedByPacks: -1 },
  ])("refuses a crossed registered projection %#", (overrides) => {
    expect(validRegisteredShapeIdentity(summary(overrides), draft())).toBe(false);
  });
});
