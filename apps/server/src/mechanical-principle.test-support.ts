// Test-only validator fixture shared by snapshot and transport controls. It makes
// no chess assertion and explicitly has no fetched source-byte proof.
import type { PrincipleEntryDefinition } from "@chess-tabiya/schema/principle-entry";
import { expect } from "vitest";
import { validatePrincipleEntry } from "./principle-validation.js";
import { validateTheorySourceRegister } from "./theory-sources.js";

export function mechanicalPrincipleFixture(sectionRef = "Mechanical section") {
  const revision = "0123456789abcdef0123456789abcdef01234567";
  const revisionUrl = `https://raw.githubusercontent.com/example/mechanical/${revision}/fixture.txt`;
  const sha256 = `sha256:${"a".repeat(64)}`;
  const sources = validateTheorySourceRegister({ schema: "tabiya.theory.sources.v1", entries: [{
    sourceId: "mechanical-source", title: "Mechanical software fixture",
    canonicalUrl: "https://github.com/example/mechanical", revisionUrl, revision,
    revisionAdapter: "github_commit", publisher: "Software fixture", authors: ["Fixture author"],
    licence: "CC0-1.0", attributionText: "Mechanical fixture only", language: "en",
    strength: "structured_dataset", review: { state: "accepted", by: "fixture", at: "2026-10-15" },
    sha256, digestSubject: "raw_file_bytes", admissionNote: "No chess assertion or fetched source bytes.",
  }] });
  expect(sources.issues).toEqual([]);
  const entry: PrincipleEntryDefinition = {
    id: "mechanical-principle", version: "1.0.0", name: "Mechanical principle fixture",
    statement: "A software fixture, not chess instruction.", phases: ["middlegame"],
    standsOn: "cited_source", counterCase: "No strategic assertion is made.",
    provenance: { licence: "CC0-1.0", sources: [{ sourceId: "mechanical-source", revisionUrl,
      sha256, sectionRef, quotedText: "Mechanical quotation, not a chess claim." }], attribution: [] },
  };
  const validated = validatePrincipleEntry(entry, { sources: sources.register!, bytesDirectory: null });
  expect(validated.issues).toEqual([]);
  expect(validated.document).toBeDefined();
  expect(validated.citations).toHaveLength(1);
  // Both inputs are legitimate validator results. The caller may own mutable copies.
  return { document: structuredClone(validated.document!), citations: structuredClone([...validated.citations!]) };
}
