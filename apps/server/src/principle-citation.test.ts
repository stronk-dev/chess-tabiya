import { readFileSync, readdirSync } from "node:fs";

import { PRINCIPLE_ENTRY_SCHEMA_VERSION } from "@chess-tabiya/schema";
import { digestPrincipleEntry } from "@chess-tabiya/schema/principle-entry";
import { describe, expect, it } from "vitest";

import { PrincipleRegistry } from "./principle-registry.js";
import { validatePrincipleEntry } from "./principle-validation.js";
import { loadDefaultTheorySourceRegister } from "./theory-sources.js";

const directory = new URL("../../../content/principles/", import.meta.url);
const committed = readdirSync(directory).filter((name) => name.endsWith(".json")).sort().map((name) => JSON.parse(readFileSync(new URL(name, directory), "utf8")) as Record<string, any>);

function cited(overrides: Record<string, unknown> = {}): Record<string, any> {
  const source = loadDefaultTheorySourceRegister().entries.find((entry) => entry.sourceId === "wikibooks-rookpawn")!;
  const base = structuredClone(committed.find((entry) => entry.id === "technique-is-conditional")!);
  base.standsOn = "cited_source";
  base.provenance.sources = [
    ...base.provenance.sources,
    { sourceId: source.sourceId, revisionUrl: source.revisionUrl, sha256: source.sha256, sectionRef: "Lucena position", quotedText: "build a bridge" },
  ];
  return { ...base, ...overrides };
}

describe("principle-entry lane 0.2 (rfc/theory-knowledge-pipeline.md §10)", () => {
  it("is additive: all committed entries validate unchanged and their digests do not move", async () => {
    expect(PRINCIPLE_ENTRY_SCHEMA_VERSION).toBe("0.2");
    expect(committed.length).toBeGreaterThanOrEqual(13);
    const registry = await PrincipleRegistry.loadDefault();
    for (const entry of committed) {
      const result = validatePrincipleEntry(entry);
      expect(result.valid, `${entry.id}: ${JSON.stringify(result.issues)}`).toBe(true);
      expect(result.citations).toEqual([]);
      expect(registry.required(entry.id).digest).toBe(await digestPrincipleEntry(entry));
    }
    // Drift tripwire: one digest pinned from before the lane (0.1 bytes, unchanged by 0.2).
    expect(registry.required("tempo-is-the-currency").digest).toBe("sha256:d01c55435dbbdc2224f4645267c5da46748f09f6566f32652cb27203b55b4218");
  });

  it("admits cited_source biconditionally: no citation → refused, citation without cited_source → refused", () => {
    const withoutCitation = { ...structuredClone(committed[0]!), standsOn: "cited_source" };
    expect(validatePrincipleEntry(withoutCitation).issues.map((issue) => issue.code)).toEqual(["PRINCIPLE_CITATION_REQUIRED"]);
    const wrongBasis = cited({ standsOn: "authors_practice" });
    expect(validatePrincipleEntry(wrongBasis).issues.map((issue) => issue.code)).toEqual(["PRINCIPLE_CITATION_BASIS_MISMATCH"]);
    const valid = validatePrincipleEntry(cited(), { bytesDirectory: null });
    expect(valid.issues).toEqual([]);
    expect(valid.citations).toHaveLength(1);
    expect(valid.citations?.[0]).toMatchObject({ sourceId: "wikibooks-rookpawn", licence: { id: "CC-BY-SA-4.0" }, publisher: "Wikibooks", proof: "source_unavailable" });
  });

  it("joins every structured citation to the accepted register row; a copied partial record cannot validate", () => {
    const crossed = cited();
    crossed.provenance.sources.at(-1).sha256 = `sha256:${"a".repeat(64)}`;
    expect(validatePrincipleEntry(crossed, { bytesDirectory: null }).issues.map((issue) => issue.code)).toEqual(["CITATION_DIGEST_MISMATCH"]);
    const unregistered = cited();
    unregistered.provenance.sources.at(-1).sourceId = "wikibooks-unknown";
    expect(validatePrincipleEntry(unregistered, { bytesDirectory: null }).issues.map((issue) => issue.code)).toEqual(["CITATION_SOURCE_UNREGISTERED"]);
    // The schema arm is closed: an attribution copied into the citation is refused, not trusted.
    const copied = cited();
    copied.provenance.sources.at(-1).licence = "CC0-1.0";
    expect(validatePrincipleEntry(copied).valid).toBe(false);
  });

  it("refuses a registry insert whose structured citations were not joined", async () => {
    const registry = await PrincipleRegistry.loadDefault();
    await expect(new PrincipleRegistry().add(cited() as never)).rejects.toThrow(/structured citations/u);
    expect(registry.list().some((summary) => summary.id === "technique-is-conditional")).toBe(true);
  });
});
