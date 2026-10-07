// One-time, owner-authorized rewrite of unpublished main. Never pushes or touches working files.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { checkArtifacts, defaultStore, manifestPath, validateManifest } from "./research-artifacts.mjs";

const check = (value, message) => { if (!value) throw new Error(`RESEARCH_HISTORY: ${message}`); };
export function parseCommit(raw) {
  const boundary = raw.indexOf("\n\n"), header = raw.slice(0, boundary), message = raw.slice(boundary + 2);
  check(boundary > 0 && !/^gpgsig /mu.test(header), "signed or malformed commit cannot be silently rewritten");
  const identity = kind => {
    const match = new RegExp(`^${kind} (.*) <([^>]*)> (\\d+ [+-]\\d{4})$`, "mu").exec(header);
    check(match, `missing ${kind} identity`); return { name: match[1], email: match[2], date: match[3] };
  };
  return { tree: /^tree ([a-f0-9]{40})$/mu.exec(header)?.[1],
    parents: [...header.matchAll(/^parent ([a-f0-9]{40})$/gmu)].map(m => m[1]),
    author: identity("author"), committer: identity("committer"), message };
}
export function rewriteUnpublished({ root = process.cwd(), store = defaultStore, base = "origin/main" }) {
  const git = (args, options = {}) => execFileSync("git", args, { cwd: root, encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024, ...options });
  check(git(["branch", "--show-current"]).trim() === "main", "only checked unpublished main is in scope");
  check(git(["diff", "--cached", "--name-only"]).trim() === "", "index must be clean; commit owned implementation first");
  git(["merge-base", "--is-ancestor", base, "HEAD"]);
  const originalHead = git(["rev-parse", "HEAD"]).trim(), baseCommit = git(["rev-parse", base]).trim();
  const commits = git(["rev-list", "--reverse", `${baseCommit}..${originalHead}`]).trim().split("\n").filter(Boolean);
  check(commits.length > 0, "no unpublished commits");
  const manifest = validateManifest(JSON.parse(readFileSync(join(root, manifestPath))));
  checkArtifacts(root, manifest, store);
  const paths = manifest.entries.map(e => e.path);
  check(paths.length > 0, "no explicit migrated paths");
  for (const path of paths) {
    let published = false;
    try { git(["cat-file", "-e", `${baseCommit}:${path}`], { stdio: "pipe" }); published = true; }
    catch (error) { if (error.status !== 128) throw error; }
    check(!published, `published artifact is outside this rewrite: ${path}`);
    let tracked = false;
    try { git(["cat-file", "-e", `${originalHead}:${path}`], { stdio: "pipe" }); tracked = true; }
    catch (error) { if (error.status !== 128) throw error; }
    check(!tracked, `commit the index removal first: ${path}`);
  }
  // Validate the entire chain before any mutation, not halfway through a merge.
  const originals = new Map(); let previous = baseCommit;
  for (const hash of commits) {
    const commit = parseCommit(git(["cat-file", "commit", hash]));
    check(commit.parents.length === 1 && commit.parents[0] === previous, "only a linear unpublished chain is supported");
    originals.set(hash, commit); previous = hash;
  }
  const backup = join(store, "migrations", originalHead);
  check(!existsSync(backup), "backup identity already exists; do not overwrite/restart a migration blindly");
  mkdirSync(backup, { recursive: true });
  const bundle = join(backup, "unpublished.bundle");
  git(["bundle", "create", bundle, "refs/heads/main", `^${baseCommit}`]);
  git(["bundle", "verify", bundle]);
  check(git(["bundle", "list-heads", bundle]).trim() === `${originalHead} refs/heads/main`,
    "backup does not bind the checked original head");
  writeFileSync(join(backup, "research-artifacts.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  const scratch = mkdtempSync(join(tmpdir(), "tabiya-history-index-")), indexPath = join(scratch, "index");
  const mapping = []; let parent = baseCommit;
  try {
    for (const hash of commits) {
      const original = originals.get(hash), env = { ...process.env, GIT_INDEX_FILE: indexPath };
      git(["read-tree", original.tree], { env });
      git(["update-index", "--force-remove", "--", ...paths], { env });
      const tree = git(["write-tree"], { env }).trim();
      for (const [prefix, identity] of [["AUTHOR", original.author], ["COMMITTER", original.committer]]) {
        env[`GIT_${prefix}_NAME`] = identity.name; env[`GIT_${prefix}_EMAIL`] = identity.email;
        env[`GIT_${prefix}_DATE`] = identity.date;
      }
      const replacement = git(["-c", "commit.gpgsign=false", "commit-tree", tree, "-p", parent],
        { env, input: original.message }).trim();
      const readBack = parseCommit(git(["cat-file", "commit", replacement]));
      check(JSON.stringify(readBack.author) === JSON.stringify(original.author)
        && JSON.stringify(readBack.committer) === JSON.stringify(original.committer)
        && readBack.message === original.message, "rewrite changed authorship/date/message");
      mapping.push({ original: hash, replacement, removedPathsOnly: true }); parent = replacement;
    }
    check(git(["rev-parse", `${parent}^{tree}`]).trim() === git(["rev-parse", `${originalHead}^{tree}`]).trim(),
      "rewritten final source tree differs; refuse branch update");
    checkArtifacts(root, manifest, store);
    const receipt = { version: 1, base: baseCommit, originalHead, rewrittenHead: parent,
      removedPaths: paths, mapping, backupBundle: bundle, publishedHistoryChanged: false,
      finalTreeIdentical: true, workingFilesTouched: false };
    writeFileSync(join(backup, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
    // Atomic compare-and-swap: no reset/checkout/stash and no unrelated-index writes.
    git(["update-ref", "-m", "owner-authorized raw research artifact migration", "refs/heads/main", parent, originalHead]);
    return receipt;
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) throw new Error("use [retained artifact store]");
  console.log(JSON.stringify(rewriteUnpublished({ store: resolve(process.argv[2] || defaultStore) })));
}
