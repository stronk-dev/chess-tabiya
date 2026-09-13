import { describe, expect, it } from "vitest";

import type { DistillResult } from "./api.js";
import { validDistilledDraft } from "./distill-response.js";

function result(overrides: Partial<DistillResult["draft"]> = {}): DistillResult {
  return {
    draft: {
      id: "draft-1",
      packId: "distilled-run-1",
      document: { id: "distilled-run-1" },
      digest: "sha256:digest",
      state: "draft",
      validation: { valid: false, issues: [] },
      ...overrides,
    },
    proposals: [],
    dropped: [],
  };
}

describe("distillation response identity", () => {
  it("accepts the exact requested draft", () => {
    expect(validDistilledDraft(result(), "distilled-run-1")).toBe(true);
  });

  it.each([
    { id: "" },
    { packId: "distilled-other-run" },
    { document: { id: "distilled-other-run" } },
    { digest: "" },
    { state: "registered" as const },
  ])("refuses a crossed or unusable draft %#", (overrides) => {
    expect(validDistilledDraft(result(overrides), "distilled-run-1")).toBe(false);
  });
});
