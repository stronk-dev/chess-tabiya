// rfc/concept-registry.md §§1–2, §6 — the one compiler, its private authority and exact historical
// rendering (criteria 2, 17, 19, 25-analogue for the registry: [[D2963]]).
import { CONCEPT_REGISTRY_SCHEMA_LANE } from "@chess-tabiya/schema";
import { describe, expect, it } from "vitest";

import {
  CONCEPT_REGISTRY_SCHEMA_VERSION,
  ConceptRegistryError,
  assertCompiledConceptRegistry,
  canonicalConceptRegistryBytes,
  compileConceptRegistry,
  conceptCatalogueView,
  conceptLabelView,
  conceptRegistryDigest,
  conceptRegistryHeadBytes,
  conceptRegistryRevisionBytes,
  conceptSlugToLabel,
  isCompiledConceptRegistry,
  labelCollisionKeyV1,
  parseConceptCatalogueView,
  parseConceptLabelView,
  parseConceptRef,
  resolveRegisteredConcept,
  validateConceptReferences,
  type ConceptStatus,
} from "./concept-registry.js";

type Entry = { readonly id: string; readonly label: string; readonly status: ConceptStatus };

const file = (bytes: string): string => `${conceptRegistryDigest(bytes).slice("sha256:".length)}.json`;

/** A linear history of revisions, oldest first; returns head bytes and the revision map. */
function history(...revisions: readonly (readonly Entry[])[]): { head: string; files: Record<string, string>; digests: string[] } {
  const files: Record<string, string> = {};
  const digests: string[] = [];
  let previous: `sha256:${string}` | null = null;
  for (const entries of revisions) {
    const bytes = conceptRegistryRevisionBytes(previous, entries);
    files[file(bytes)] = bytes;
    previous = conceptRegistryDigest(bytes);
    digests.push(previous);
  }
  return { head: conceptRegistryHeadBytes(previous!), files, digests };
}

const BASE: readonly Entry[] = [
  { id: "break-timing", label: "Break timing", status: "active" },
  { id: "outside-passer", label: "Outside passer", status: "active" },
];

function code(action: () => unknown): string {
  try { action(); } catch (error) { return error instanceof ConceptRegistryError ? error.code : `other:${String(error)}`; }
  return "none";
}

describe("criterion 2/17 — the on-disk compiler", () => {
  it("compiles a canonical head and history into a deeply frozen, privately-minted registry", () => {
    const { head, files, digests } = history(BASE);
    const registry = compileConceptRegistry(head, files);
    expect(registry.digest).toBe(digests[0]);
    expect(registry.revisions).toEqual(digests);
    expect(registry.entries.map((entry) => entry.id)).toEqual(["break-timing", "outside-passer"]);
    expect(Object.isFrozen(registry) && Object.isFrozen(registry.entries) && Object.isFrozen(registry.entries[0])).toBe(true);
    expect(isCompiledConceptRegistry(registry)).toBe(true);
    expect(registry.ref("break-timing")).toEqual({ id: "break-timing", registrySchemaVersion: 1, registryDigest: digests[0] });
    expect(code(() => registry.required("missing"))).toBe("CONCEPT_UNREGISTERED");
    // Bytes and strings compile identically.
    expect(compileConceptRegistry(new TextEncoder().encode(head), Object.fromEntries(Object.entries(files).map(([name, bytes]) => [name, new TextEncoder().encode(bytes)]))).digest).toBe(registry.digest);
  });

  it("refuses malformed ids, duplicates, label collisions, ordering, extra keys, invalid Unicode and non-canonical bytes", () => {
    const revision = (entries: readonly unknown[], previousDigest: string | null = null): string => canonicalConceptRegistryBytes({ schemaVersion: 1, previousDigest, entries });
    const compile = (bytes: string): string => code(() => compileConceptRegistry(conceptRegistryHeadBytes(conceptRegistryDigest(bytes)), { [file(bytes)]: bytes }));
    expect(compile(revision([{ id: "Break-Timing", label: "Break timing", status: "active" }]))).toBe("CONCEPT_REGISTRY_SHAPE");
    expect(compile(revision([{ id: "break--timing", label: "Break timing", status: "active" }]))).toBe("CONCEPT_REGISTRY_SHAPE");
    expect(compile(revision([{ id: "a".repeat(81), label: "Long", status: "active" }]))).toBe("CONCEPT_REGISTRY_SHAPE");
    expect(compile(revision([{ id: "x", label: " padded", status: "active" }]))).toBe("CONCEPT_REGISTRY_SHAPE");
    expect(compile(revision([{ id: "x", label: "é".repeat(51), status: "active" }]))).toBe("CONCEPT_REGISTRY_SHAPE"); // 102 UTF-8 bytes
    expect(compile(revision([{ id: "x", label: "X", status: "dormant" }]))).toBe("CONCEPT_REGISTRY_SHAPE");
    expect(compile(revision([{ id: "x", label: "X", status: "active", note: "prose" }]))).toBe("CONCEPT_REGISTRY_SHAPE");
    expect(compile(revision([{ id: "x", label: "X", status: "active" }, { id: "x", label: "Y", status: "active" }]))).toBe("CONCEPT_REGISTRY_DUPLICATE_ID");
    expect(compile(revision([{ id: "b", label: "B", status: "active" }, { id: "a", label: "A", status: "active" }]))).toBe("CONCEPT_REGISTRY_ORDER");
    expect(compile(revision([{ id: "a", label: "Same", status: "active" }, { id: "b", label: "SAME", status: "active" }]))).toBe("CONCEPT_REGISTRY_LABEL_COLLISION");
    // A lone surrogate can only arrive as a JSON escape; it never reaches canonicalisation.
    expect(compile(revision([{ id: "x", label: "Lone Z", status: "active" }]).replace("Lone Z", "Lone \\ud800"))).toBe("CONCEPT_REGISTRY_SHAPE");
    // Non-canonical: minified, reordered keys, and a duplicated JSON key all differ from canonical bytes.
    const canonical = revision([{ id: "x", label: "X", status: "active" }]);
    expect(compile(JSON.stringify(JSON.parse(canonical)))).toBe("CONCEPT_REGISTRY_NONCANONICAL");
    expect(compile(canonical.replace('"entries"', '"schemaVersion": 1,\n  "entries"'))).toBe("CONCEPT_REGISTRY_NONCANONICAL");
    // Invalid UTF-8 bytes never reach JSON.parse.
    const bad = new Uint8Array([0x7b, 0xff, 0x7d]);
    expect(code(() => compileConceptRegistry(conceptRegistryHeadBytes(`sha256:${"a".repeat(64)}`), { [`${"a".repeat(64)}.json`]: bad }))).toBe("CONCEPT_REGISTRY_BYTES");
  });

  it("refuses a malformed or non-canonical head, and misnamed, missing, orphan and cyclic history", () => {
    const { head, files } = history(BASE);
    expect(code(() => compileConceptRegistry(head.replace("\n}", ',\n  "extra": 1\n}'), files))).toBe("CONCEPT_REGISTRY_SHAPE");
    expect(code(() => compileConceptRegistry(JSON.stringify(JSON.parse(head)), files))).toBe("CONCEPT_REGISTRY_NONCANONICAL");
    expect(code(() => compileConceptRegistry(head, {}))).toBe("CONCEPT_REGISTRY_HISTORY_MISSING");
    const [name, bytes] = Object.entries(files)[0]!;
    expect(code(() => compileConceptRegistry(head, { [name]: bytes.replace("Break timing", "Break tempo") }))).toBe("CONCEPT_REGISTRY_HISTORY_MISNAMED");
    expect(code(() => compileConceptRegistry(head, { ...files, "not-a-digest.json": bytes }))).toBe("CONCEPT_REGISTRY_HISTORY_MISNAMED");
    const orphan = conceptRegistryRevisionBytes(null, [{ id: "orphan", label: "Orphan", status: "active" }]);
    expect(code(() => compileConceptRegistry(head, { ...files, [file(orphan)]: orphan }))).toBe("CONCEPT_REGISTRY_HISTORY_ORPHAN");
    // A cycle needs a revision whose predecessor chain returns to itself: a self-referencing digest
    // is unconstructible, so a two-revision loop is modelled by pointing the head at a revision whose
    // predecessor is a revision pointing back at the first name.
    const a = conceptRegistryRevisionBytes(`sha256:${"b".repeat(64)}`, BASE);
    const b = conceptRegistryRevisionBytes(conceptRegistryDigest(a), BASE);
    expect(code(() => compileConceptRegistry(conceptRegistryHeadBytes(conceptRegistryDigest(b)), { [file(a)]: a, [file(b)]: b }))).toBe("CONCEPT_REGISTRY_HISTORY_MISSING");
  });

  it("refuses id deletion and retired reactivation; renames and retirement keep the id and exact old-ref rendering", () => {
    const renamed: Entry[] = [{ id: "break-timing", label: "Pawn-break timing", status: "active" }, { id: "outside-passer", label: "Outside passer", status: "retired" }];
    const { head, files, digests } = history(BASE, renamed);
    const registry = compileConceptRegistry(head, files);
    const old = { id: "break-timing", registrySchemaVersion: 1, registryDigest: digests[0] };
    expect(registry.resolve(old)).toMatchObject({ kind: "resolved", label: "Break timing", status: "active" });
    expect(registry.resolve(registry.ref("break-timing"))).toMatchObject({ kind: "resolved", label: "Pawn-break timing" });
    expect(registry.resolve({ id: "outside-passer", registrySchemaVersion: 1, registryDigest: digests[0] })).toMatchObject({ status: "active" });
    expect(registry.get("outside-passer")?.status).toBe("retired");
    expect(registry.retired().map((entry) => entry.id)).toEqual(["outside-passer"]);
    expect(registry.active().map((entry) => entry.id)).toEqual(["break-timing"]);
    // An unknown revision abstains by name and never substitutes the current label.
    const unavailable = { id: "break-timing", registrySchemaVersion: 1, registryDigest: `sha256:${"c".repeat(64)}` };
    expect(registry.resolve(unavailable)).toEqual({ kind: "registry_revision_unavailable", ref: unavailable });
    expect(conceptLabelView(registry, unavailable, "Stored label")).toEqual({ id: "break-timing", label: "Stored label", status: "unverified", registryDigest: unavailable.registryDigest, revision: "registry_revision_unavailable" });
    expect(conceptLabelView(registry, old, "ignored")).toMatchObject({ label: "Break timing", revision: "resolved" });

    const deleted = history(BASE, [BASE[0]!]);
    expect(code(() => compileConceptRegistry(deleted.head, deleted.files))).toBe("CONCEPT_REGISTRY_ID_REMOVED");
    const reactivated = history(renamed, [renamed[0]!, { id: "outside-passer", label: "Outside passer", status: "active" }]);
    expect(code(() => compileConceptRegistry(reactivated.head, reactivated.files))).toBe("CONCEPT_REGISTRY_REACTIVATED");
  });

  it("keeps the schema lane, the revision literal and the JSON schema $id in step", async () => {
    expect(String(CONCEPT_REGISTRY_SCHEMA_VERSION)).toBe(CONCEPT_REGISTRY_SCHEMA_LANE);
    const { readFileSync } = await import("node:fs");
    const schema = JSON.parse(readFileSync(new URL("../../../schemas/concept_registry.schema.json", import.meta.url), "utf8")) as { readonly $id: string };
    expect(schema.$id).toBe(`urn:chess-tabiya:schema:concept-registry:${CONCEPT_REGISTRY_SCHEMA_LANE}`);
  });
});

describe("criterion 19 — labelCollisionKeyV1 is exact, versioned and locale-free", () => {
  it("folds Straße/STRASSE and Greek final sigma, NFKC-compatibility forms, and nothing locale-specific", () => {
    expect(labelCollisionKeyV1("Straße")).toBe(labelCollisionKeyV1("STRASSE"));
    expect(labelCollisionKeyV1("ΟΔΟΣ")).toBe(labelCollisionKeyV1("οδος"));
    expect(labelCollisionKeyV1("οδοσ")).toBe(labelCollisionKeyV1("οδος"));
    expect(labelCollisionKeyV1("ﬁle")).toBe(labelCollisionKeyV1("FILE")); // NFKC ligature
    expect(labelCollisionKeyV1("Café")).toBe(labelCollisionKeyV1("CAFÉ")); // NFC composition
    // Turkish dotted/dotless I are NOT merged: default (locale-free) lower-casing only.
    expect(labelCollisionKeyV1("I")).not.toBe(labelCollisionKeyV1("ı"));
  });

  it("refuses a runtime whose Unicode data differs from 17.0", () => {
    const versions = process.versions as { unicode?: string };
    const original = versions.unicode;
    Object.defineProperty(process.versions, "unicode", { value: "16.0", configurable: true, writable: true });
    try {
      expect(code(() => labelCollisionKeyV1("x"))).toBe("CONCEPT_REGISTRY_UNICODE_VERSION");
      const { head, files } = history(BASE);
      expect(code(() => compileConceptRegistry(head, files))).toBe("CONCEPT_REGISTRY_UNICODE_VERSION");
    } finally {
      Object.defineProperty(process.versions, "unicode", { value: original, configurable: true, writable: true });
    }
  });
});

describe("[[D2963]] — only the compiler's private output is a registry", () => {
  it("refuses digest-bearing lookalikes, spread copies and proxies at every consumer operation", () => {
    const { head, files } = history(BASE);
    const registry = compileConceptRegistry(head, files);
    const lookalikes: unknown[] = [
      { digest: registry.digest, schemaVersion: 1 },
      { ...registry },
      Object.create(registry),
      new Proxy(registry, {}),
    ];
    for (const fake of lookalikes) {
      expect(isCompiledConceptRegistry(fake)).toBe(false);
      expect(code(() => assertCompiledConceptRegistry(fake))).toBe("CONCEPT_REGISTRY_AUTHORITY");
      expect(code(() => validateConceptReferences(fake as typeof registry, ["break-timing"]))).toBe("CONCEPT_REGISTRY_AUTHORITY");
      expect(code(() => conceptCatalogueView(fake as typeof registry))).toBe("CONCEPT_REGISTRY_AUTHORITY");
      expect(code(() => resolveRegisteredConcept(fake as typeof registry, "break-timing"))).toBe("CONCEPT_REGISTRY_AUTHORITY");
    }
  });
});

describe("§2 — ConceptRef parsing and the consumer operations", () => {
  it("parses exactly three keys, copies and seals, and never retains the caller object", () => {
    const input = { id: "break-timing", registrySchemaVersion: 1, registryDigest: `sha256:${"a".repeat(64)}` };
    const ref = parseConceptRef(input);
    expect(ref).toEqual(input);
    expect(ref).not.toBe(input);
    expect(Object.isFrozen(ref)).toBe(true);
    input.id = "mutated";
    expect(ref.id).toBe("break-timing");
    for (const bad of [
      { id: "break-timing", registrySchemaVersion: 1 },
      { id: "break-timing", registrySchemaVersion: 1, registryDigest: `sha256:${"a".repeat(64)}`, label: "x" },
      { id: "Break", registrySchemaVersion: 1, registryDigest: `sha256:${"a".repeat(64)}` },
      { id: "break-timing", registrySchemaVersion: 2, registryDigest: `sha256:${"a".repeat(64)}` },
      { id: "break-timing", registrySchemaVersion: 1, registryDigest: `sha256:${"A".repeat(64)}` },
      null,
    ]) expect(code(() => parseConceptRef(bad))).toBe("CONCEPT_REF_INVALID");
  });

  it("validates pack references: malformed, unregistered and retired-new are refused", () => {
    const { head, files } = history(BASE, [BASE[0]!, { id: "outside-passer", label: "Outside passer", status: "retired" }]);
    const registry = compileConceptRegistry(head, files);
    expect(validateConceptReferences(registry, ["break-timing"])).toEqual([]);
    expect(validateConceptReferences(registry, ["Not A Slug", "unknown-idea", "outside-passer"]).map((issue) => [issue.index, issue.code])).toEqual([
      [0, "CONCEPT_ID_MALFORMED"], [1, "CONCEPT_UNREGISTERED"], [2, "CONCEPT_RETIRED"],
    ]);
  });

  it("resolves one global key for an id regardless of pack, and different ids never merge", () => {
    const { head, files } = history([...BASE, { id: "outside-passer-race", label: "Outside passer race", status: "active" }]);
    const registry = compileConceptRegistry(head, files);
    expect(resolveRegisteredConcept(registry, "outside-passer").key).toBe("concept:outside-passer@1");
    expect(resolveRegisteredConcept(registry, "outside-passer-race").key).not.toBe(resolveRegisteredConcept(registry, "outside-passer").key);
  });

  it("round-trips the catalogue and label views through the strict wire parsers", () => {
    const { head, files, digests } = history(BASE);
    const registry = compileConceptRegistry(head, files);
    const view = conceptCatalogueView(registry);
    expect(parseConceptCatalogueView(JSON.parse(JSON.stringify(view)))).toEqual(view);
    expect(() => parseConceptCatalogueView({ ...view, entries: [...view.entries].reverse() })).toThrow(/id-ordered/u);
    expect(() => parseConceptCatalogueView({ ...view, extra: true })).toThrow(ConceptRegistryError);
    const label = conceptLabelView(registry, registry.ref("break-timing"), "Break timing");
    expect(parseConceptLabelView(JSON.parse(JSON.stringify(label)))).toEqual(label);
    expect(() => parseConceptLabelView({ ...label, status: "unverified" })).toThrow(/does not agree/u);
    expect(digests).toHaveLength(1);
  });

  it("seeds labels deterministically from author-written slugs without adding any claim", () => {
    expect(conceptSlugToLabel("advance-chain-base")).toBe("Advance chain base");
    expect(conceptSlugToLabel("f7-is-the-address")).toBe("F7 is the address");
    expect(() => conceptSlugToLabel("Not A Slug")).toThrow(ConceptRegistryError);
  });
});
