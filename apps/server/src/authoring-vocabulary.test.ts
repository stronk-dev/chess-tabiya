import { describe, expect, it } from "vitest";

import { vocabularyUsage } from "./authoring-vocabulary.js";

describe("authoring vocabulary usage", () => {
  it("counts each registry reference once per pack across legacy and scoped shape forms", () => {
    const usage = vocabularyUsage([
      {
        id: "one",
        shapes: ["carlsbad", { shape: "carlsbad", relation: "present" }, { shape: "vancura", relation: "prospective" }],
        feedbackClaims: [{ principles: ["activity", "activity"] }, { principles: ["result"] }],
      },
      {
        id: "two",
        shapes: [{ shape: "carlsbad", relation: "present" }],
        feedbackClaims: [{ principles: ["activity"] }],
      },
    ]);

    expect(Object.fromEntries(usage.shapes)).toEqual({ carlsbad: 2, vancura: 1 });
    expect(Object.fromEntries(usage.principles)).toEqual({ activity: 2, result: 1 });
  });
});
