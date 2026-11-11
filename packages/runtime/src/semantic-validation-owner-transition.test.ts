import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { buildSync } from "esbuild";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { loadSemanticValidationCases } from "./semantic-validation-case-storage.js";
import { assertSemanticValidationOwnerTransition, type SemanticValidationTreeReader } from "./semantic-validation-owner-transition.js";
import {
  SEMANTIC_VALIDATION_CASES_PATH as INDEX, SEMANTIC_VALIDATION_PROFILES_PATH as PROFILES,
  SEMANTIC_VALIDATION_OWNER_STORE_PATH as STORE, SEMANTIC_VALIDATION_PROFILE_CELLS,
  parseSemanticValidationCase, type SemanticValidationCase,
} from "./semantic-validation.js";
import { SEMANTIC_VALIDATION_REPOSITORY_ROOT as ROOT, semanticValidationImportClosure } from "./semantic-validation-authorities.js";

const PART = "packages/runtime/src/semantic-validation-cases/shared.json", WORK = "planning/work-state.json";
const original = loadSemanticValidationCases().cases[0]!;
const sample = parseSemanticValidationCase({ ...original, id: "storage.guard-case", authority: { kind: "owner_authored", id: "storage-owner", version: 1 } });
const row = (id = "storage-owner") => ({ id, version: 1, subject: sample.subject, case: { id: sample.id, version: 1 },
  expectation: sample.expectation, factConstraint: [], ruling: "ledger:D9001", authoredBy: "OWNER", authoredAt: "2026-11-11" });
function profile(present: boolean) {
  return { subject: sample.subject, ...Object.fromEntries(SEMANTIC_VALIDATION_PROFILE_CELLS.map(([key]) => [key, {
    disposition: "required", owner: "semantic-validation-case-storage.md", discharge: "D1",
  }])), ...(present ? { positive: { disposition: "present", refs: [{ kind: "case", id: sample.id, version: 1, subject: sample.subject, arm: "positive" }] } } : {}) };
}
function files({ present = false, legacy = false, rows = [] as ReturnType<typeof row>[], value = sample, part = PART } = {}): Record<string, string> {
  const cases = JSON.stringify({ schemaVersion: 1, cases: [value] });
  return {
    [INDEX]: legacy ? cases : JSON.stringify({ schemaVersion: 2, parts: [part.replace("packages/runtime/src/", "")] }),
    ...(!legacy ? { [part]: cases } : {}),
    [PROFILES]: JSON.stringify({ schemaVersion: 1, profiles: [profile(present)] }),
    [STORE]: JSON.stringify({ schemaVersion: 1, authorities: rows }),
    [WORK]: JSON.stringify({ items: [{ rulingKind: "owner-ledger", ruling: "ledger:D9001" }] }),
  };
}
const tree = (values: Readonly<Record<string, string>>): SemanticValidationTreeReader => path => values[path];
const rulings = (read: SemanticValidationTreeReader): ReadonlySet<string> => {
  const value = JSON.parse(read(WORK)!);
  return new Set(value.items.map((item: { ruling: string }) => item.ruling.slice("ledger:".length)));
};

describe("complete historical and candidate owner registries", () => {
  it("permits a historical base, row-only addition, then a later exact admission", () => {
    const base = files({ legacy: true }), onlyRow = files({ rows: [row()] }), admitted = files({ rows: [row()], present: true });
    expect(() => assertSemanticValidationOwnerTransition(tree(base), tree(onlyRow), rulings)).not.toThrow();
    expect(() => assertSemanticValidationOwnerTransition(tree(onlyRow), tree(admitted), rulings)).not.toThrow();
    expect(() => assertSemanticValidationOwnerTransition(tree(base), tree(admitted), rulings)).toThrow(/same change/u);
    expect(() => assertSemanticValidationOwnerTransition(tree(onlyRow), tree(base), rulings)).toThrow(/case index/u);
  });

  it("repartitioning cannot hide same-change owner admission", () => {
    const next = files({ rows: [row()], present: true, part: PART.replace("shared", "moved") });
    expect(() => assertSemanticValidationOwnerTransition(tree(files()), tree(next), rulings)).toThrow(/same change/u);
  });

  it("follows nested rules-and-proposition owner references too", () => {
    const value = parseSemanticValidationCase({ ...sample, authority: { kind: "rules_and_proposition", oracle: { id: "rules.legal_successor", version: 1 },
      witness: { id: "storage.witness", version: 1, oracle: { id: "rules.legal_successor", version: 1 }, case: { id: sample.id, version: 1 }, subject: sample.subject },
      proposition: sample.authority, factConstraint: [{ path: ["legal"], comparison: "scalar", equals: true }] } });
    expect(() => assertSemanticValidationOwnerTransition(tree(files()), tree(files({ value, rows: [row()], present: true })), rulings)).toThrow(/same change/u);
  });

  it.each(["base", "candidate"] as const)("missing %s bytes cannot come from the other tree", side => {
    for (const path of [INDEX, PROFILES, PART]) {
      const a = files(), b = files(); delete (side === "base" ? a : b)[path];
      const check = vi.fn(rulings);
      expect(() => assertSemanticValidationOwnerTransition(tree(a), tree(b), check)).toThrow(/missing/u);
      expect(check).not.toHaveBeenCalled();
    }
  });

  it("actually reads different complete bytes at the same part path in each tree", () => {
    const a = files(), b = files({ value: parseSemanticValidationCase({ ...sample, id: "storage.other-case" }) });
    const seenA: [string, string | undefined][] = [], seenB: typeof seenA = [];
    assertSemanticValidationOwnerTransition(path => { seenA.push([path, a[path]]); return a[path]; }, path => { seenB.push([path, b[path]]); return b[path]; }, rulings);
    expect(a[PART]).not.toBe(b[PART]); expect(seenA).toContainEqual([PART, a[PART]]); expect(seenB).toContainEqual([PART, b[PART]]);
    a[PART] = JSON.stringify({ schemaVersion: 1, cases: [{}] });
    expect(() => assertSemanticValidationOwnerTransition(tree(a), tree(b), rulings)).toThrow();
  });

  it.each(["subject", "arm"] as const)("joins present refs to the actual case %s before authority comparison", change => {
    const value = parseSemanticValidationCase({ ...sample, ...(change === "arm" ? { arm: "counterfactual" } : { subject: { kind: "event", projection: { id: "rules.transition.event.castled", version: 1 } } }) });
    const check = vi.fn(rulings);
    expect(() => assertSemanticValidationOwnerTransition(tree(files()), tree(files({ value, rows: [row()], present: true })), check)).toThrow(/another subject or arm/u);
    expect(check).not.toHaveBeenCalled();
  });

  it("preserves exact mutation, removal, owner scope and ruling refusals", () => {
    const a = files({ rows: [row()] });
    expect(() => assertSemanticValidationOwnerTransition(tree(a), tree(files({ rows: [{ ...row(), authoredAt: "2026-11-12" }] })), rulings)).toThrow(/mutated/u);
    expect(() => assertSemanticValidationOwnerTransition(tree(a), tree(files()), rulings)).toThrow(/removed/u);
    const badScope = files({ rows: [{ ...row(), case: { id: "storage.another", version: 1 } }], present: true });
    expect(() => assertSemanticValidationOwnerTransition(tree(files()), tree(badScope), rulings)).toThrow(/another case or subject/u);
    expect(() => assertSemanticValidationOwnerTransition(tree(a), tree(a), () => new Set())).toThrow(/not an owner-ledger ruling/u);
  });

  it("keeps the case loader and Git guard outside pure, HTTP and client import graphs", () => {
    for (const entry of ["packages/runtime/src/index.ts", "apps/server/src/application.ts", "apps/web/src/main.ts"]) {
      const closure = semanticValidationImportClosure([entry]);
      for (const forbidden of ["semantic-validation-case-storage.ts", "semantic-validation-owner-transition.ts"]) {
        expect(closure.some(path => path.endsWith(forbidden)), entry).toBe(false);
      }
    }
  });
});

describe("actual Git CLI isolation", { timeout: 30_000 }, () => {
  const directories: string[] = []; let cli: string;
  const git = (directory: string, ...args: string[]) => execFileSync("git", ["-C", directory, ...args], { encoding: "utf8", stdio: "pipe" });
  const write = (directory: string, values: Readonly<Record<string, string>>) => {
    for (const [path, text] of Object.entries(values)) { mkdirSync(dirname(join(directory, path)), { recursive: true }); writeFileSync(join(directory, path), text); }
  };
  const stage = (directory: string, values: Readonly<Record<string, string>>) => git(directory, "add", "--", ...Object.keys(values));
  const repo = (values: Readonly<Record<string, string>>) => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-case-git-")); directories.push(directory);
    git(directory, "init", "--quiet"); git(directory, "config", "user.name", "Storage fixture"); git(directory, "config", "user.email", "fixture@example.invalid");
    write(directory, values); stage(directory, values); git(directory, "commit", "--quiet", "-m", "base fixture"); return directory;
  };
  const run = (directory: string, ...args: string[]) => spawnSync(process.execPath, [cli, ...args], { cwd: directory, encoding: "utf8" });
  beforeAll(() => {
    const directory = mkdtempSync(join(tmpdir(), "tabiya-case-cli-")); directories.push(directory); cli = join(directory, "guard.mjs");
    buildSync({ entryPoints: [resolve(ROOT, "tools/semantic-validation-owner-transition.ts")], outfile: cli, bundle: true, platform: "node", format: "esm", logLevel: "silent" });
  });
  afterAll(() => { for (const directory of directories) rmSync(directory, { recursive: true, force: true }); });

  it("uses staged case/ruling bytes and refuses a missing staged part despite its working copy", () => {
    const directory = repo(files()), next = files({ rows: [row()], present: true });
    write(directory, next); stage(directory, next);
    const permissive = files({ rows: [row()], present: true, value: parseSemanticValidationCase({ ...sample, authority: original.authority }) });
    write(directory, { [PART]: permissive[PART]! });
    const refused = run(directory); expect(refused.status).not.toBe(0); expect(refused.stderr).toMatch(/same change/u);
    git(directory, "add", "--", PART); write(directory, { [WORK]: JSON.stringify({ items: [] }) });
    expect(run(directory).status).toBe(0); // The staged ruling still exists.
    git(directory, "add", "--", WORK); write(directory, { [WORK]: next[WORK]! });
    expect(run(directory).stderr).toMatch(/not an owner-ledger ruling/u);
    git(directory, "add", "--", WORK); git(directory, "rm", "--cached", "--", PART);
    const missing = run(directory); expect(missing.status).not.toBe(0); expect(missing.stderr).toMatch(/missing.*shared\.json/u);
  });

  it("refuses a missing base part even though candidate and working tree supply it", () => {
    const base = files(); delete base[PART]; const directory = repo(base), next = files();
    write(directory, next); stage(directory, next);
    const result = run(directory); expect(result.status).not.toBe(0); expect(result.stderr).toMatch(/missing.*shared\.json/u);
  });

  it("reads historical cases, staged parts and rulings above the default child-process buffer", () => {
    const padding = " ".repeat(1_200_000), base = files({ legacy: true });
    base[INDEX] += padding; base[WORK] += padding;
    const directory = repo(base), next = files({ rows: [row()] });
    next[PART] += padding; next[WORK] += padding;
    write(directory, next); stage(directory, next);
    expect(run(directory).status).toBe(0);
    const admitted = { [PROFILES]: files({ present: true })[PROFILES]! };
    write(directory, admitted); stage(directory, admitted);
    const refused = run(directory); expect(refused.status).not.toBe(0); expect(refused.stderr).toMatch(/same change/u);
    write(directory, { [PROFILES]: next[PROFILES]! }); git(directory, "add", "--", PROFILES);
    git(directory, "commit", "--quiet", "-m", "large blob migration");
    expect(run(directory, "--ci").status).toBe(0);
  });

  it("uses the actual first parent for historical migration and reads candidate rulings", () => {
    const directory = repo(files({ legacy: true }));
    const absentParent = run(directory, "--ci"); expect(absentParent.status).not.toBe(0); expect(absentParent.stderr).toContain("HEAD^1");
    const next = files({ rows: [row()] }); write(directory, next); stage(directory, next); git(directory, "commit", "--quiet", "-m", "case index migration");
    expect(run(directory, "--ci").status).toBe(0);
    const noRuling = { [WORK]: JSON.stringify({ items: [] }) }; write(directory, noRuling); stage(directory, noRuling); git(directory, "commit", "--quiet", "-m", "missing ruling fixture");
    const refused = run(directory, "--ci"); expect(refused.status).not.toBe(0); expect(refused.stderr).toMatch(/not an owner-ledger ruling/u);
  });
});
