import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkArtifacts, evictArtifacts, objectPath, restoreArtifacts, retainArtifacts, retainNewArtifact, sha, validateManifest, manifestPath } from "./research-artifacts.mjs";
import { checkGitSizes, oversizedBlobs, sourceLimit, researchLimit } from "./git-size-check.mjs";

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "tabiya-artifacts-")), root = join(dir, "repo"), store = join(dir, "store");
  mkdirSync(join(root, "planning/semantic-consequence-search"), { recursive: true });
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = "planning/semantic-consequence-search/synthetic.json.gz", bytes = Buffer.from("retained literal evidence\n");
  writeFileSync(join(root, path), bytes);
  return { root, store, path, bytes };
}
test("retain/restore preserves original bytes and deduplicates by SHA-256, without a network", t => {
  const f = fixture(t), other = f.path.replace("synthetic", "second"); writeFileSync(join(f.root, other), f.bytes);
  const manifest = retainArtifacts(f.root, [f.path, other], f.store);
  assert.equal(manifest.entries[0].digest, manifest.entries[1].digest);
  assert.deepEqual(checkArtifacts(f.root, manifest, f.store), { artifacts: 2, bytes: 2 * f.bytes.length });
  rmSync(join(f.root, f.path));
  assert.equal(restoreArtifacts(f.root, manifest, f.store).restored, 1);
  assert.deepEqual(readFileSync(join(f.root, f.path)), f.bytes);
  assert.equal(restoreArtifacts(f.root, manifest, f.store).restored, 0);
});
test("corrupt store or conflicting destination refuses; no overwrite or partial restoration", t => {
  const f = fixture(t), other = f.path.replace("synthetic", "second"); writeFileSync(join(f.root, other), Buffer.from("other"));
  const manifest = retainArtifacts(f.root, [f.path, other], f.store);
  writeFileSync(join(f.root, f.path), "conflict");
  assert.throws(() => restoreArtifacts(f.root, manifest, f.store), /changed artifact bytes/);
  assert.equal(readFileSync(join(f.root, f.path), "utf8"), "conflict");
  rmSync(join(f.root, f.path)); rmSync(join(f.root, other));
  writeFileSync(objectPath(f.store, sha("other")), "corrupt");
  assert.throws(() => restoreArtifacts(f.root, manifest, f.store), /changed artifact bytes/);
  assert.equal(existsSync(join(f.root, f.path)), false);
});
test("missing objects refuse with explicit restoration guidance", t => {
  const f = fixture(t), manifest = retainArtifacts(f.root, [f.path], f.store);
  rmSync(objectPath(f.store, manifest.entries[0].digest));
  assert.throws(() => restoreArtifacts(f.root, manifest, f.store), /missing stored artifact/);
});
test("eviction refuses a missing backup, then removes only verified working copies and restores exactly", t => {
  const f = fixture(t), manifest = retainArtifacts(f.root, [f.path], f.store), object = objectPath(f.store, sha(f.bytes));
  rmSync(object); assert.throws(() => evictArtifacts(f.root, manifest, f.store), /backup required/);
  assert.deepEqual(readFileSync(join(f.root, f.path)), f.bytes);
  retainArtifacts(f.root, [f.path], f.store);
  const result = evictArtifacts(f.root, manifest, f.store);
  assert.equal(result.removedWorkingCopies, 1); assert.equal(result.bytes, f.bytes.length);
  assert.equal(existsSync(join(f.root, f.path)), false); assert.deepEqual(readFileSync(object), f.bytes);
  assert.equal(evictArtifacts(f.root, manifest, f.store).removedWorkingCopies, 0);
  restoreArtifacts(f.root, manifest, f.store); assert.deepEqual(readFileSync(join(f.root, f.path)), f.bytes);
});
test("manifest rejects traversal, absolute/non-research paths, duplicates, changed size and unknown authority", t => {
  const f = fixture(t), manifest = retainArtifacts(f.root, [f.path], f.store);
  for (const path of ["/tmp/x", "planning/semantic-consequence-search/../x", "archive/x", "planning/semantic-consequence-search/x\nq",
    "planning/semantic-consequence-search/wild*.gz", "planning/semantic-consequence-search/[pattern].gz"])
    assert.throws(() => validateManifest({ ...manifest, entries: [{ ...manifest.entries[0], path }] }));
  assert.throws(() => validateManifest({ ...manifest, entries: [...manifest.entries, ...manifest.entries] }));
  assert.throws(() => validateManifest({ ...manifest, authority: "qualified" }));
  assert.throws(() => validateManifest({ ...manifest, entries: [{ ...manifest.entries[0], bytes: -1 }] }));
  assert.throws(() => checkArtifacts(f.root, { ...manifest, entries: [{ ...manifest.entries[0], bytes: 1 }] }));
});
test("restoration refuses symlink destinations", t => {
  const f = fixture(t), manifest = retainArtifacts(f.root, [f.path], f.store);
  rmSync(join(f.root, f.path)); symlinkSync(objectPath(f.store, manifest.entries[0].digest), join(f.root, f.path));
  assert.throws(() => restoreArtifacts(f.root, manifest, f.store), /symlink/);
});
test("size policies accept boundaries below the limit and reject generated research, source and reintroduced artifacts", () => {
  assert.deepEqual(oversizedBlobs([{ path: "app.ts", bytes: sourceLimit - 1 },
    { path: "planning/semantic-consequence-search/control.json", bytes: researchLimit - 1 }]), []);
  assert.equal(oversizedBlobs([{ path: "app.ts", bytes: sourceLimit }]).length, 1);
  assert.equal(oversizedBlobs([{ path: "planning/semantic-consequence-search/bulk.json", bytes: researchLimit }]).length, 1);
  assert.equal(oversizedBlobs([{ path: "bulk", bytes: 1 }], new Set(["bulk"])).length, 1);
});
test("future capture retention works before commit, updates only generated metadata, and cannot replace original evidence", t => {
  const f = fixture(t), manifest = retainArtifacts(f.root, [f.path], f.store);
  writeFileSync(join(f.root, manifestPath), JSON.stringify(manifest));
  writeFileSync(join(f.root, ".gitignore"), "node_modules/\n# unrelated rule\n");
  const next = f.path.replace("synthetic", "new-capture"); writeFileSync(join(f.root, next), "new evidence");
  assert.equal(retainNewArtifact(f.root, next, f.store).artifacts, 2);
  assert.equal(retainNewArtifact(f.root, next, f.store).artifacts, 2);
  const ignore = readFileSync(join(f.root, ".gitignore"), "utf8");
  assert.ok(ignore.startsWith("node_modules/\n# unrelated rule\n"));
  assert.equal(ignore.split("# BEGIN retained research artifacts").length, 2);
  assert.ok(ignore.includes(`/${next}\n`));
  const saved = readFileSync(join(f.root, manifestPath)); writeFileSync(join(f.root, next), "changed evidence");
  assert.throws(() => retainNewArtifact(f.root, next, f.store), /changed artifact bytes/);
  assert.deepEqual(readFileSync(join(f.root, manifestPath)), saved);
  assert.equal(readFileSync(join(f.root, f.path), "utf8"), f.bytes.toString());
});
test("Git guard checks exact index bytes, not unstaged files; deletion and manifest-only fresh checkout work", t => {
  const f = fixture(t), git = args => execFileSync("git", args, { cwd: f.root, stdio: "pipe" });
  git(["init", "-q"]); git(["config", "user.name", "Artifact control"]); git(["config", "user.email", "control@example.invalid"]);
  const manifest = retainArtifacts(f.root, [f.path], f.store);
  writeFileSync(join(f.root, manifestPath), JSON.stringify(manifest));
  git(["add", manifestPath]); git(["commit", "-qm", "manifest only"]);
  assert.equal(checkGitSizes({ root: f.root }).rawArtifactsRequired, false);
  writeFileSync(join(f.root, "large.bin"), Buffer.alloc(sourceLimit)); git(["add", "large.bin"]);
  writeFileSync(join(f.root, "large.bin"), "unstaged small");
  assert.throws(() => checkGitSizes({ root: f.root, staged: true }), /large.bin/);
  git(["reset", "-q", "HEAD", "large.bin"]); git(["add", f.path]);
  assert.throws(() => checkGitSizes({ root: f.root, staged: true }), /must not be tracked/);
  git(["reset", "-q", "HEAD", f.path]);
  rmSync(join(f.root, f.path));
  assert.equal(checkGitSizes({ root: f.root }).rawArtifactsRequired, false);
});
