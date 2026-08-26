import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { describe, expect, it } from "vitest";

import {
  OPENING_CATALOGUE_COMPILER_FILES,
  OPENING_CATALOGUE_FILES,
  compileRuntimeOpeningCatalogue,
  type OpeningCatalogueSourceInput,
} from "./opening-catalogue.js";

const ROOT = new URL("../../../", import.meta.url).pathname;

function semanticFixture(): { readonly sources: readonly OpeningCatalogueSourceInput[]; readonly compilers: readonly { readonly path: string; readonly bytes: Uint8Array }[] } {
  const rows = Object.freeze({
    "a.tsv": "A00\tAmar Opening\t1. Nh3",
    "b.tsv": "B00\tKing's Pawn Game\t1. e4",
    "c.tsv": "A40\tQueen's Pawn Game\t1. d4",
    "d.tsv": "A10\tEnglish Opening\t1. c4",
    "e.tsv": "A04\tZukertort Opening\t1. Nf3",
  } as const);
  const sources = OPENING_CATALOGUE_FILES.map((name) => Object.freeze({
    name,
    bytes: Buffer.from(`eco\tname\tpgn\n${rows[name]}\n`),
  }));
  const compilers = OPENING_CATALOGUE_COMPILER_FILES.map((path) => Object.freeze({
    path,
    bytes: Buffer.from(`fixture:${path}`),
  }));
  return Object.freeze({ sources: Object.freeze(sources), compilers: Object.freeze(compilers) });
}

describe("runtime opening catalogue compiler", () => {
  it("is deterministic across enumeration order and changes its digest when source meaning changes", () => {
    const value = semanticFixture();
    const first = compileRuntimeOpeningCatalogue(value.sources, value.compilers);
    const shuffled = compileRuntimeOpeningCatalogue([...value.sources].reverse(), [...value.compilers].reverse());
    expect(canonicalizeJson(shuffled)).toBe(canonicalizeJson(first));
    expect(first.namedEndpoints).toHaveLength(5);
    const renamed = value.sources.map((source) => source.name === "a.tsv"
      ? Object.freeze({ ...source, bytes: Buffer.from(Buffer.from(source.bytes).toString("utf8").replace("Amar Opening\t", "Amar Opening renamed\t")) })
      : source);
    expect(compileRuntimeOpeningCatalogue(renamed, value.compilers).digest).not.toBe(first.digest);
  });

  it("refuses malformed rows, duplicate endpoints, missing files and undeclared compiler helpers", () => {
    const value = semanticFixture();
    const malformed = value.sources.map((source) => source.name === "a.tsv" ? Object.freeze({ ...source, bytes: Buffer.from("wrong header\n") }) : source);
    expect(() => compileRuntimeOpeningCatalogue(malformed, value.compilers)).toThrow(/TSV header/);
    const duplicate = value.sources.map((source) => source.name === "e.tsv" ? Object.freeze({ ...source, bytes: Buffer.concat([Buffer.from(source.bytes), Buffer.from("A00\tDuplicate Amar\t1. Nh3\n")]) }) : source);
    expect(() => compileRuntimeOpeningCatalogue(duplicate, value.compilers)).toThrow(/Duplicate named opening endpoint/);
    expect(() => compileRuntimeOpeningCatalogue(value.sources.slice(1), value.compilers)).toThrow(/exactly a.tsv through e.tsv/);
    expect(() => compileRuntimeOpeningCatalogue(value.sources, value.compilers.slice(1))).toThrow(/source closure mismatch/);
  });

  it("reuses the one opening TSV and PGN parser instead of carrying a compiler copy", async () => {
    const source = await Promise.all([
      readFile(resolve(ROOT, "apps/server/src/sourcing/openings.ts"), "utf8"),
      readFile(resolve(ROOT, "apps/server/src/opening-catalogue.ts"), "utf8"),
      readFile(resolve(ROOT, "apps/server/src/opening-catalogue-build.ts"), "utf8"),
    ]);
    expect(source.join("\n").match(/function parseRows\s*\(/g)).toHaveLength(1);
    expect(source.join("\n").match(/function normalizeOpeningPgn\s*\(/g)).toHaveLength(1);
    expect(source[1]).not.toContain("parsePgn(");
    expect(source[2]).not.toContain("parsePgn(");
    expect(`${source[1]}\n${source[2]}`).not.toMatch(/\b(?:embedding|semantic similarity|full[- ]text|llm)\b/i);
  });
});
