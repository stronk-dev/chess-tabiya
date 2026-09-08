// DISPOSABLE implementation audit — D642. It measures the landed checkpoint; it changes no product.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CORPUS_ROOTS, MECHANISM_FILES } from "./registry.js";

const ROOT = new URL("../../", import.meta.url).pathname;
const OUT = new URL("./output.md", import.meta.url);
function source(path: string): string { return readFileSync(join(ROOT, path), "utf8"); }
function jsonFiles(root: string): readonly string[] {
  const result: string[] = [];
  for (const name of readdirSync(join(ROOT, root))) {
    const relative = join(root, name);
    if (statSync(join(ROOT, relative)).isDirectory()) result.push(...jsonFiles(relative));
    else if (name.endsWith(".json")) result.push(relative);
  }
  return result;
}
function packDocuments(root: string): readonly { readonly file: string; readonly document: any }[] {
  return jsonFiles(root).flatMap((file) => {
    if (/\.(?:evidence|graduation|job|sources)\.json$/u.test(file)) return [];
    try {
      const document = JSON.parse(source(file));
      return document?.provenance?.graduationBlockers ? [{ file, document }] : [];
    } catch { return []; }
  });
}
function counts(root: string): Record<string, number> {
  const documents = packDocuments(root);
  const entries = documents.flatMap(({ document }) => document.provenance.graduationBlockers);
  return {
    documents: documents.length,
    entries: entries.length,
    blocking: entries.filter((entry: any) => entry.state === "blocking").length,
    resolved: entries.filter((entry: any) => entry.state === "resolved").length,
    accepted: entries.filter((entry: any) => entry.state === "accepted").length,
  };
}

describe("D642 graduation-clearance implementation checkpoint", () => {
  it("pins the live schema, writer, sweep and canonical content gate", () => {
    expect(source("rfc/README.md")).toMatch(/`graduation-clearance\.md` \| \*\*implementing/u);
    expect(source("packages/schema/src/index.ts")).toContain('DRILL_PACK_SCHEMA_VERSION = "0.28"');
    expect(source("Makefile")).toContain("graduation-clear:");
    expect(source("Makefile")).toContain("graduation-clearance-corpus-check:");
    expect(source("Makefile")).toMatch(/verify-content:.*graduation-plan-check.*graduation-clearance-corpus-check/u);
    expect(source("schemas/drill_pack.schema.json")).toContain('"graduationClearance"');
    expect(source("apps/server/src/graduation-clearance-corpus.ts")).toContain("GRADUATION_RULING_SELF_MINTED");
  });

  it("re-derives the migrated corpus population", () => {
    expect(counts("content/drafts")).toEqual({ documents: 56, entries: 293, blocking: 211, resolved: 34, accepted: 48 });
    expect(counts("content/candidates")).toEqual({ documents: 36, entries: 143, blocking: 143, resolved: 0, accepted: 0 });
    const proposal = JSON.parse(source("planning/graduation-clearance/migration-proposal.json"));
    expect(proposal.migration.statuses).toEqual({ ready: 436, requires_author: 0, blocked_contract: 0 });
    expect(JSON.parse(source("planning/graduation-clearance/author-decisions.json")).decisions).toHaveLength(227);
  });

  it("keeps every named mechanism path real", () => {
    for (const file of MECHANISM_FILES) expect(existsSync(join(ROOT, file)), file).toBe(true);
  });

  it("emits the current implementation receipt", () => {
    const lines = [
      "# D642 graduation-clearance implementation — raw output",
      "",
      "Register: implementing; pack schema 0.28 landed; lifecycle completion remains under acceptance-criterion audit.",
      "Current corpus: drafts 56 documents / 293 entries (211 blocking, 34 resolved, 48 accepted); candidates 36 pack documents / 143 blocking entries.",
      "Migration proposal: 436 ready / 0 author-required / 0 contract-blocked; 227 explicit author decisions are checked in.",
      "Canonical content verification re-runs the migration plan, all standing predicates, citation provenance and the self-minted-ruling refusal.",
      "",
      `Mechanism surface (${MECHANISM_FILES.length} named files): ${MECHANISM_FILES.join(", ")}.`,
      `Apply roots: ${CORPUS_ROOTS.join(", ")}.`,
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));
  });
});
