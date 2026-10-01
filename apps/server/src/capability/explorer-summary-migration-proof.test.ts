import { describe, expect, it } from "vitest";
import { assertAuthoredContentUnchanged, assertLedgerMetadataUnchanged, assertRootImagesUnchanged } from "../../../../tools/explorer-summary-migration-proof/proof.js";

describe("migration source-root negative controls", () => {
  it("permits only the exact ledger digest update, never edited evidence or a stale digest", () => {
    const before = { packDigest: "old", evidence: [{ claim: "cited" }] };
    expect(() => assertLedgerMetadataUnchanged("fixture", before, { ...before, packDigest: "new" }, "new")).not.toThrow();
    expect(() => assertLedgerMetadataUnchanged("fixture", before, before, "new")).toThrow("digest mismatch");
    expect(() => assertLedgerMetadataUnchanged("fixture", before, { packDigest: "new", evidence: [] }, "new")).toThrow("content changed");
  });
  it("accepts identical roots but refuses even one changed evaluator", () => {
    expect(() => assertRootImagesUnchanged([{ site: "unchanged", before: "a", after: "a" }])).not.toThrow();
    expect(() => assertRootImagesUnchanged([{ site: "unchanged", before: "a", after: "a" }, { site: "changed", before: "a", after: "b" }])).toThrow("Evaluator root changed: changed");
  });
  it("permits requirement metadata differences but refuses any changed authored operand or claim", () => {
    const before = { requires: ["old"], objective: { target: 1 }, feedback: { claim: "cited" } };
    expect(() => assertAuthoredContentUnchanged("fixture", before, { ...before, requires: ["new"] })).not.toThrow();
    expect(() => assertAuthoredContentUnchanged("fixture", before, { ...before, objective: { target: 2 } })).toThrow("Authored content changed: fixture");
    expect(() => assertAuthoredContentUnchanged("fixture", before, { ...before, feedback: { claim: "invented" } })).toThrow("Authored content changed: fixture");
  });
});
