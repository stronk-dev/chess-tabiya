import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { auditGraduationRulingLine } from "./graduation-clearance-corpus.js";

function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

describe("graduation ruling admission sweep", () => {
  it("rejects an uncommitted or same-commit ruling and admits a prior-commit ruling", () => {
    const root = mkdtempSync(resolve(tmpdir(), "tabiya-graduation-ruling-"));
    git(root, "init", "--quiet");
    git(root, "config", "user.email", "fixture@tabiya.invalid");
    git(root, "config", "user.name", "Tabiya fixture");
    mkdirSync(resolve(root, "rfc"));
    const rulingFile = resolve(root, "rfc/graduation-clearance.md");
    writeFileSync(rulingFile, "", "utf8");
    git(root, "add", "rfc/graduation-clearance.md");
    git(root, "commit", "--quiet", "-m", "base");
    writeFileSync(rulingFile, "\nfixture ruling\n", "utf8");

    const ref = "rfc/graduation-clearance.md#L2";
    const current = git(root, "rev-parse", "HEAD");
    expect(auditGraduationRulingLine(root, ref, "fixture ruling", "out_of_scope", current))
      .toContainEqual(expect.stringContaining("GRADUATION_RULING_SELF_MINTED"));

    git(root, "add", "rfc/graduation-clearance.md");
    git(root, "commit", "--quiet", "-m", "ruling");
    const rulingCommit = git(root, "rev-parse", "HEAD");
    expect(auditGraduationRulingLine(root, ref, "fixture ruling", "out_of_scope", rulingCommit))
      .toContainEqual(expect.stringContaining("GRADUATION_RULING_SELF_MINTED"));

    writeFileSync(resolve(root, "later"), "later\n", "utf8");
    git(root, "add", "later");
    git(root, "commit", "--quiet", "-m", "later");
    expect(auditGraduationRulingLine(root, ref, "fixture ruling", "out_of_scope", git(root, "rev-parse", "HEAD"))).toEqual([]);
  });
});
