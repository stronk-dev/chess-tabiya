import { strict as assert } from "node:assert";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { assertCapabilityHistory, checkRepositoryHistory, declarationRows, DECLARATIONS } from "./capability-history.mjs";

const row = (version = 1) => ({ subjectId: "fixture.predicate", id: { id: "fixture.predicate", version: { kind: "integer", value: version } }, semanticsDigest: `sha256:meaning-${version}`, sources: [{ kind: "ast", site: "real.predicate" }], dependsOn: [] });
const image = (rows) => `export const GENERATED_CAPABILITY_DECLARATIONS: readonly GeneratedCapabilityDeclaration[] = Object.freeze(JSON.parse(String.raw\`${JSON.stringify(rows)}\`) as GeneratedCapabilityDeclaration[]);`;

test("first main bootstrap permits the initial image, not a missing or malformed candidate", () => {
  assert.deepEqual(assertCapabilityHistory(undefined, image([row()])), { retained: 0, total: 1 });
  assert.throws(() => assertCapabilityHistory(undefined, undefined), /IMAGE_MISSING/);
  assert.throws(() => declarationRows("broken"), /IMAGE_INVALID/);
  assert.throws(() => declarationRows(image([row(), row()])), /DUPLICATE/);
});
test("mutation followed by regeneration cannot rewrite the committed digest at version 1", () => {
  const base = image([row()]);
  assert.throws(() => assertCapabilityHistory(base, image([{ ...row(), semanticsDigest: "sha256:new-meaning" }])), /HISTORY_REWRITTEN/);
  for (const patch of [{ sources: [] }, { dependsOn: [{ id: "other", version: { kind: "integer", value: 1 } }] }]) {
    assert.throws(() => assertCapabilityHistory(base, image([{ ...row(), ...patch }])), /HISTORY_REWRITTEN/);
  }
});
test("versioned successors retain exact predecessor meaning; deletion and renaming do not", () => {
  const base = image([row()]);
  assert.deepEqual(assertCapabilityHistory(base, image([row(), row(2)])), { retained: 1, total: 2 });
  assert.throws(() => assertCapabilityHistory(base, image([row(2)])), /HISTORY_REMOVED/);
  assert.throws(() => assertCapabilityHistory(base, image([{ ...row(), subjectId: "other", id: { ...row().id, id: "other" } }])), /HISTORY_REMOVED/);
});
test("formatting and key order are not semantics; source identity is", () => {
  const original = row();
  assert.deepEqual(assertCapabilityHistory(image([original]), image([{ dependsOn: [], sources: original.sources, semanticsDigest: original.semanticsDigest, id: original.id, subjectId: original.subjectId }])), { retained: 1, total: 1 });
  assert.throws(() => assertCapabilityHistory(image([original]), image([{ ...original, sources: [{ kind: "ast", site: "different.predicate" }] }])), /HISTORY_REWRITTEN/);
});

test("the repository runner checks working bytes, the staged image and CI's actual parent", () => {
  const root = mkdtempSync(join(tmpdir(), "tabiya-capability-history-"));
  const git = (args) => execFileSync("git", args, { cwd: root, stdio: "pipe" });
  try {
    git(["init", "-q"]);
    git(["config", "user.name", "Capability fixture"]);
    git(["config", "user.email", "fixture@example.invalid"]);
    git(["config", "core.hooksPath", "/dev/null"]);
    git(["commit", "-q", "--allow-empty", "-m", "before capability bootstrap"]);
    mkdirSync(dirname(join(root, DECLARATIONS)), { recursive: true });
    writeFileSync(join(root, DECLARATIONS), image([row()]));
    git(["add", "--", DECLARATIONS]);
    assert.deepEqual(checkRepositoryHistory({ root, staged: true }), { retained: 0, total: 1 });
    git(["commit", "-q", "-m", "bootstrap"]);
    assert.deepEqual(checkRepositoryHistory({ root, ci: true }), { retained: 0, total: 1 });
    writeFileSync(join(root, DECLARATIONS), image([{ ...row(), semanticsDigest: "sha256:regenerated" }]));
    assert.throws(() => checkRepositoryHistory({ root }), /HISTORY_REWRITTEN/);
    assert.deepEqual(checkRepositoryHistory({ root, staged: true }), { retained: 1, total: 1 });
    git(["add", "--", DECLARATIONS]);
    assert.throws(() => checkRepositoryHistory({ root, staged: true }), /HISTORY_REWRITTEN/);
    git(["commit", "-q", "-m", "invalid regeneration"]);
    assert.throws(() => checkRepositoryHistory({ root, ci: true }), /HISTORY_REWRITTEN/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("a missing CI parent fails closed rather than impersonating the initial registry", () => {
  const root = mkdtempSync(join(tmpdir(), "tabiya-capability-parent-"));
  const git = (args) => execFileSync("git", args, { cwd: root, stdio: "pipe" });
  try {
    git(["init", "-q"]);
    git(["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "core.hooksPath=/dev/null", "commit", "-q", "--allow-empty", "-m", "root without parent"]);
    assert.throws(() => checkRepositoryHistory({ root, ci: true }));
  } finally { rmSync(root, { recursive: true, force: true }); }
});
