import { describe, expect, it } from "vitest";

import type { PackDraft } from "./api.js";
import { validPackDraftIdentity } from "./pack-draft-response.js";

function draft(overrides: Partial<PackDraft> = {}): PackDraft {
  return {
    id: "draft-1",
    packId: "pack-1",
    document: { id: "pack-1" },
    digest: "sha256:digest",
    state: "draft",
    validation: { valid: false, issues: [] },
    ...overrides,
  };
}

describe("pack draft response identity", () => {
  it("accepts the requested mutable draft", () => {
    expect(validPackDraftIdentity(draft(), "pack-1")).toBe(true);
  });

  it.each([
    { id: "" },
    { packId: "pack-2" },
    { document: { id: "pack-2" } },
    { digest: "" },
    { state: "registered" as const },
  ])("refuses a crossed or unusable draft %#", (overrides) => {
    expect(validPackDraftIdentity(draft(overrides), "pack-1")).toBe(false);
  });
});
