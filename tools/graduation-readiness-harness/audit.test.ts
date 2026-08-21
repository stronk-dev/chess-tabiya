// DISPOSABLE readiness audit — D642. It detects a split/return condition; it changes no product.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CORPUS_ROOTS, KNOWN_JUDGEMENT_RESIDUE, MECHANISM_FILES } from "./registry.js";

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
    if (/\.(?:evidence|job|sources)\.json$/u.test(file)) return [];
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

describe("D642 graduation-clearance readiness", () => {
  it("pins the accepted mechanism as wholly absent at pack schema 0.27", () => {
    expect(source("rfc/README.md")).toMatch(/`graduation-clearance\.md` \| \*\*accepted/u);
    expect(source("packages/schema/src/index.ts")).toContain('DRILL_PACK_SCHEMA_VERSION = "0.27"');
    expect(source("Makefile")).not.toContain("graduation-clear:");
    expect(source("schemas/drill_pack.schema.json")).not.toContain('"clearance"');
    expect(source("apps/server/src/pack-validation.ts")).not.toContain("GRADUATION_CLEARANCE_MISSING");
  });

  it("re-derives the full migration population rather than calling it a local schema edit", () => {
    expect(counts("content/drafts")).toEqual({ documents: 56, entries: 293, blocking: 220, resolved: 30, accepted: 43 });
    expect(counts("content/candidates")).toEqual({ documents: 36, entries: 143, blocking: 143, resolved: 0, accepted: 0 });
    expect(KNOWN_JUDGEMENT_RESIDUE).toEqual({ draftHandTable: 17, candidateUnrecognised: 2, resolvedRemovedReferent: 1 });
  });

  it("detects the stale withdrawn issue code inside the active acceptance criteria", () => {
    const rfc = source("rfc/graduation-clearance.md");
    const criteria = rfc.slice(rfc.indexOf("## Acceptance criteria"), rfc.indexOf("## Open questions"));
    expect(rfc).toMatch(/GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE[^\n]*withdrawn/iu);
    expect(criteria).toContain("GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE");
    expect(criteria).toContain("GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL");
  });

  it("records why the dirty feedback stage must land before schema 0.28 starts", () => {
    for (const file of MECHANISM_FILES.filter((file) => !file.includes("graduation-"))) {
      expect(existsSync(join(ROOT, file)), file).toBe(true);
    }
    const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: ROOT, encoding: "utf8" });
    expect(status).toContain("apps/server/src/authored-feedback.ts");
    expect(status).toContain("apps/server/src/pack-registry.ts");
    expect(status).toContain("tools/feedback-delivery-harness/");
  });

  it("emits the build/apply split", () => {
    const lines = [
      "# D642 graduation-clearance readiness — raw output",
      "",
      "Register: accepted; pack lane: 0.28 held; implementation: absent at HEAD.",
      "Current corpus: drafts 56 documents / 293 entries (220 blocking, 30 resolved, 43 accepted); candidates 36 pack documents / 143 blocking entries.",
      "Known non-derived residue: 17 draft hand-table assignments + 2 unrecognised candidate entries + 1 removed-referent resolution.",
      "Acceptance defect: criterion 13 still demands the withdrawn GRADUATION_CLEARANCE_SUBJECT_UNSUPPORTABLE code while criterion 17 and the normative lint table require GRADUATION_CLEARANCE_SUBJECT_UNGRAMMATICAL.",
      "",
      "Decision: do not start schema 0.28 in the dirty Feedback Stage-1 worktree. First land/recover Stage 1. Then amend the stale criterion, implement a read-only planner and mechanism, and require an explicit owner budget decision before applying the 92-document content migration and archiving the RFC.",
      "",
      `Mechanism surface (${MECHANISM_FILES.length} named files): ${MECHANISM_FILES.join(", ")}.`,
      `Apply roots: ${CORPUS_ROOTS.join(", ")}.`,
      "",
    ];
    writeFileSync(OUT, lines.join("\n"));
  });
});
