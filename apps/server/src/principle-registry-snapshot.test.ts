import { digestPrincipleEntry, type PrincipleEntryDefinition } from "@chess-tabiya/schema/principle-entry";
import { describe, expect, it } from "vitest";

import { PackRegistry } from "./pack-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { validatePrincipleEntry } from "./principle-validation.js";
import { ShapeRegistry } from "./shape-registry.js";
import { principleEntryView } from "./theory-library.js";
import { validateTheorySourceRegister } from "./theory-sources.js";

function fixture(sectionRef = "Mechanical section") {
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

describe("principle registration snapshot", () => {
  it("hashes, stores and indexes the same document captured before awaiting Web Crypto", async () => {
    const registry = new PrincipleRegistry(), input = fixture(), before = structuredClone(input.document);
    const pending = registry.add(input.document, input.citations);
    expect(Reflect.set(input.document, "id", "changed-during-digest")).toBe(true);
    expect(Reflect.set(input.document, "statement", "Changed after registration began.")).toBe(true);
    const record = await pending;
    expect(record.document).toEqual(before);
    expect(record.digest).toBe(await digestPrincipleEntry(before));
    expect(await digestPrincipleEntry(record.document)).toBe(record.digest);
    expect(registry.required(before.id)).toBe(record);
    expect(registry.get(input.document.id)).toBeUndefined();
    expect(registry.byDigest(record.digest)).toBe(record);
    expect(registry.list()).toEqual([record.summary]);
  });

  it("cannot lose an already-joined citation while the document digest is pending", async () => {
    const registry = new PrincipleRegistry(), input = fixture(), before = structuredClone(input);
    const pending = registry.add(input.document, input.citations);
    input.citations.length = 0;
    const record = await pending;
    expect(record.document).toEqual(before.document);
    expect(record.citations).toEqual(before.citations);
    expect(record.citations).toHaveLength(record.document.provenance.sources.length);
  });

  it("cannot replace an admitted citation with a different valid section during hashing", async () => {
    const registry = new PrincipleRegistry(), input = fixture(), other = fixture("Another mechanical section");
    const before = structuredClone(input);
    const pending = registry.add(input.document, input.citations);
    input.citations[0] = other.citations[0]!;
    const record = await pending;
    expect(record.document).toEqual(before.document);
    expect(record.citations).toEqual(before.citations);
  });

  it("owns every nested citation without freezing or retaining the caller's mutable copy", async () => {
    const registry = new PrincipleRegistry(), input = fixture(), before = structuredClone(input);
    const record = await registry.add(input.document, input.citations);
    expect(Reflect.set(input.citations[0]!, "quotedText", "Changed caller quotation.")).toBe(true);
    expect(Reflect.set(input.citations[0]!.citableText.values, "quotedText", "Changed caller operand.")).toBe(true);
    expect(Reflect.set(input.citations[0]!.authors, "0", "Changed caller author")).toBe(true);
    expect(Reflect.set(input.document, "statement", "Changed caller statement.")).toBe(true);
    expect(record.document).toEqual(before.document);
    expect(record.citations).toEqual(before.citations);
    const inspect = (value: unknown): void => {
      if (value === null || typeof value !== "object") return;
      expect(Object.isFrozen(value)).toBe(true);
      for (const child of Object.values(value)) inspect(child);
    };
    inspect(record);
    expect(await digestPrincipleEntry(record.document)).toBe(record.digest);
  });

  it.each(["missing", "extra"] as const)("still refuses %s joined citations before indexing anything", async kind => {
    const registry = new PrincipleRegistry(), input = fixture();
    const citations = kind === "missing" ? [] : [...input.citations, ...input.citations];
    await expect(registry.add(input.document, citations)).rejects.toThrow(/structured citations/u);
    expect(registry.list()).toEqual([]);
    expect(registry.byDigest(await digestPrincipleEntry(input.document))).toBeUndefined();
  });

  it("retains duplicate-id refusal when two registrations cross the actual digest await", async () => {
    const registry = new PrincipleRegistry(), input = fixture();
    const first = registry.add(input.document, input.citations);
    const second = registry.add(input.document, input.citations);
    const results = await Promise.allSettled([first, second]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    const rejected = results.find(result => result.status === "rejected");
    expect(rejected?.status === "rejected" && rejected.reason).toMatchObject({ code: "PACK_INVALID" });
    expect(registry.list()).toHaveLength(1);
  });

  it("keeps Library citations consistent with their document and honest about missing source bytes", async () => {
    const principles = new PrincipleRegistry(), input = fixture(), before = structuredClone(input);
    const pending = principles.add(input.document, input.citations);
    input.citations[0] = fixture("Replacement section").citations[0]!;
    await pending;
    const sources = { principles, packs: await PackRegistry.fromDocuments([]), shapes: new ShapeRegistry(),
      openingCatalogue: { kind: "unavailable" as const, reason: "artifact_missing" as const } };
    const view = principleEntryView(sources, before.document.id);
    expect(view.citations).toEqual(before.citations);
    expect(view.citations[0]).toMatchObject({ proof: "source_unavailable", modified: false });
    expect(view.anchoredPacks).toEqual([]);
    // Decoded wire data is client-owned; editing it must not affect a subsequent Library view.
    const wire = JSON.parse(JSON.stringify(view));
    wire.citations[0].quotedText = "Edited decoded response";
    expect(principleEntryView(sources, before.document.id)).toEqual(view);
  });
});
