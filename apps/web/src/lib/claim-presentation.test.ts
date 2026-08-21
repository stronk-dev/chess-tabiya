import { describe, expect, it } from "vitest";

import type { AuthoredFeedbackItem } from "./api.js";
import { claimProvenance, claimProvenanceDeclared } from "./claim-presentation.js";

function claim(overrides: Partial<Extract<AuthoredFeedbackItem, { kind: "claim" }>> = {}): Extract<AuthoredFeedbackItem, { kind: "claim" }> {
  return {
    kind: "claim",
    id: "claim#one",
    revealedBy: { kind: "outcome", eventSeq: 4 },
    anchor: { claimId: "one" },
    text: "Authored sentence.",
    evidenceTypes: ["tablebase_exact", "author_principle"],
    earnedEvidenceTypes: ["tablebase_exact"],
    binding: "author_attributed",
    authorSpans: ["Authored sentence."],
    principles: [{ id: "p", name: "Activity", statement: "Activity has a cost.", standsOn: "source", counterCase: "The activity is forced." }],
    ...overrides,
  };
}

describe("claim provenance", () => {
  it("rejects a bare claim at the delivery-sheet consumer boundary", () => {
    if (false) {
      // @ts-expect-error Delivery sheets consume an admitted full claim item.
      claimProvenanceDeclared(claim());
    }
  });
  it("names only earned machine labels as recorded evidence", () => {
    const text = claimProvenance(claim());
    expect(text).toContain("Evidence recorded for: tablebase_exact.");
    expect(text).not.toContain("Evidence recorded for: tablebase_exact, author_principle");
    expect(text).toContain("It can be wrong when: The activity is forced.");
  });

  it("states the absence of a record for self-declared claims", () => {
    expect(claimProvenance(claim({ binding: "self_declared", evidenceTypes: ["derived_feature"], earnedEvidenceTypes: [], principles: [] })))
      .toBe("Author's claim, author-declared: derived_feature. No machine record is attached.");
  });
});
