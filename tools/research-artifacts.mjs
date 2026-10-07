// Repository tooling: raw research stays outside Git; original bytes never change.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const manifestPath = "planning/research-artifacts.json";
export const defaultStore = join(homedir(), ".local/share/tabiya/research-artifacts");
export const researchPrefixes = ["planning/semantic-consequence-search/", "planning/provider-exchange-and-execution/"];
export const sha = bytes => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const check = (v, message) => { if (!v) throw new Error(`RESEARCH_ARTIFACTS: ${message}`); };
const exact = (v, fields) => check(v && typeof v === "object" && !Array.isArray(v)
  && JSON.stringify(Object.keys(v).sort()) === JSON.stringify([...fields].sort()), "unexpected manifest fields");
export function validateManifest(value) {
  exact(value, ["version", "authority", "entries"]);
  check(value.version === 1 && value.authority === "retained_raw_research_not_release_completion"
    && Array.isArray(value.entries), "manifest identity");
  const seen = new Set(); let previous = "";
  for (const entry of value.entries) {
    exact(entry, ["path", "digest", "bytes"]);
    check(typeof entry.path === "string" && researchPrefixes.some(p => entry.path.startsWith(p))
      && /^[A-Za-z0-9/_.-]+$/u.test(entry.path)
      && !entry.path.includes("\\") && !entry.path.split("/").some(p => ["", ".", ".."].includes(p))
      && !isAbsolute(entry.path) && !/[\r\n\0]/u.test(entry.path), "unsafe/non-research artifact path");
    check(!seen.has(entry.path) && entry.path > previous, "duplicate/unordered artifact path");
    seen.add(entry.path); previous = entry.path;
    check(/^sha256:[a-f0-9]{64}$/u.test(entry.digest) && Number.isSafeInteger(entry.bytes)
      && entry.bytes > 0, "invalid artifact digest/size");
  }
  return value;
}
export function objectPath(store, digest) {
  check(/^sha256:[a-f0-9]{64}$/u.test(digest), "invalid object identity");
  return join(store, "objects", digest.slice(7, 9), digest.slice(7));
}
function safePath(root, path) {
  root = realpathSync(root);
  const target = resolve(root, path), rel = relative(root, target);
  check(rel && !rel.startsWith("../") && !isAbsolute(rel), "path escapes repository");
  let cursor = root;
  for (const part of path.split("/")) {
    cursor = join(cursor, part);
    if (existsSync(cursor)) check(!lstatSync(cursor).isSymbolicLink(), "artifact path contains a symlink");
  }
  return target;
}
export function verifyBytes(bytes, entry) {
  check(bytes.length === entry.bytes && sha(bytes) === entry.digest, `changed artifact bytes: ${entry.path}`);
  return bytes;
}
export function retainArtifacts(root, paths, store) {
  const entries = [];
  check(new Set(paths).size === paths.length, "duplicate import path");
  for (const path of [...paths].sort()) {
    validateManifest({ version: 1, authority: "retained_raw_research_not_release_completion",
      entries: [{ path, digest: sha("probe"), bytes: 1 }] });
    const bytes = readFileSync(safePath(root, path)), entry = { path, digest: sha(bytes), bytes: bytes.length };
    const target = objectPath(store, entry.digest);
    mkdirSync(dirname(target), { recursive: true });
    if (!existsSync(target)) writeFileSync(target, bytes, { flag: "wx" });
    check(!lstatSync(target).isSymbolicLink(), "store object is a symlink");
    verifyBytes(readFileSync(target), entry); entries.push(entry);
  }
  return validateManifest({ version: 1, authority: "retained_raw_research_not_release_completion", entries });
}
export function restoreArtifacts(root, manifest, store) {
  validateManifest(manifest);
  // Preflight the complete store and every existing destination before writing.
  for (const entry of manifest.entries) {
    const source = objectPath(store, entry.digest), target = safePath(root, entry.path);
    check(existsSync(source), `missing stored artifact ${entry.digest}; supply STORE=<retained archive directory>`);
    check(!lstatSync(source).isSymbolicLink(), "store object is a symlink");
    verifyBytes(readFileSync(source), entry);
    if (existsSync(target)) verifyBytes(readFileSync(target), entry);
  }
  let restored = 0;
  for (const entry of manifest.entries) {
    const target = safePath(root, entry.path);
    if (existsSync(target)) continue;
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, verifyBytes(readFileSync(objectPath(store, entry.digest)), entry), { flag: "wx" });
    restored++;
  }
  return { artifacts: manifest.entries.length, restored, bytes: manifest.entries.reduce((n, e) => n + e.bytes, 0) };
}
export function checkArtifacts(root, manifest, store) {
  validateManifest(manifest);
  for (const entry of manifest.entries) {
    verifyBytes(readFileSync(safePath(root, entry.path)), entry);
    if (store) verifyBytes(readFileSync(objectPath(store, entry.digest)), entry);
  }
  return { artifacts: manifest.entries.length, bytes: manifest.entries.reduce((n, e) => n + e.bytes, 0) };
}
/** Drop only recoverable working copies, never store objects or directory trees. */
export function evictArtifacts(root, manifest, store) {
  validateManifest(manifest);
  const present = [];
  for (const entry of manifest.entries) {
    const object = objectPath(store, entry.digest), target = safePath(root, entry.path);
    check(existsSync(object) && !lstatSync(object).isSymbolicLink(), "verified backup required before eviction");
    verifyBytes(readFileSync(object), entry);
    if (existsSync(target)) { verifyBytes(readFileSync(target), entry); present.push({ target, entry }); }
  }
  for (const { target, entry } of present) { verifyBytes(readFileSync(target), entry); unlinkSync(target); }
  return { removedWorkingCopies: present.length, bytes: present.reduce((n, { entry }) => n + entry.bytes, 0),
    retainedArtifacts: manifest.entries.length };
}
/** New captures do not need to enter Git before they can be retained. */
export function retainNewArtifact(root, path, store) {
  const existing = validateManifest(JSON.parse(readFileSync(join(root, manifestPath))));
  const previous = existing.entries.find(entry => entry.path === path);
  if (previous) verifyBytes(readFileSync(safePath(root, path)), previous);
  const added = retainArtifacts(root, [path], store).entries[0];
  const manifest = validateManifest({ ...existing, entries: [...existing.entries.filter(e => e.path !== path), added]
    .sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0) });
  const ignorePath = join(root, ".gitignore"), ignore = existsSync(ignorePath) ? readFileSync(ignorePath, "utf8") : "";
  const start = "# BEGIN retained research artifacts", end = "# END retained research artifacts";
  check((ignore.match(new RegExp(start, "g")) ?? []).length <= 1
    && (ignore.match(new RegExp(end, "g")) ?? []).length <= 1, "ambiguous generated ignore block");
  check(ignore.includes(start) === ignore.includes(end), "incomplete generated ignore block");
  const block = `${start}\n${manifest.entries.map(e => `/${e.path}`).join("\n")}\n${end}`;
  const replacement = ignore.includes(start) ? ignore.replace(new RegExp(`${start}[\\s\\S]*?${end}`, "u"), block)
    : `${ignore}${ignore.endsWith("\n") || !ignore ? "" : "\n"}\n${block}\n`;
  // Only generated metadata changes; capture bytes and previously retained identities do not.
  writeFileSync(ignorePath, replacement);
  writeFileSync(join(root, manifestPath), `${JSON.stringify(manifest, null, 2)}\n`);
  return { path, digest: added.digest, bytes: added.bytes, artifacts: manifest.entries.length };
}
export function newlyIntroducedLargeRecordings(base = "origin/main", root = process.cwd()) {
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  const names = git(["diff", "--name-only", "--diff-filter=A", "-z", base, "HEAD"]).split("\0").filter(Boolean);
  return names.filter(path => researchPrefixes.some(p => path.startsWith(p))
    && Number(git(["cat-file", "-s", `HEAD:${path}`])) >= 1024 * 1024).sort();
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);
  check(["import-new", "restore", "check", "manifest", "retain", "evict"].includes(command)
    && args.length <= (command === "retain" ? 2 : 1), "use import-new|restore|check [store], manifest, or retain <path> [store]");
  const root = process.cwd(), store = resolve(args[command === "retain" ? 1 : 0] || defaultStore);
  let result;
  if (command === "retain") {
    check(args[0], "explicit new capture path required");
    result = retainNewArtifact(root, args[0], store);
  } else if (command === "import-new") {
    const paths = newlyIntroducedLargeRecordings();
    check(paths.length > 0 && !existsSync(manifestPath), "new recordings and a new manifest required");
    // Refuse a changed worktree copy before exporting it as historical evidence.
    for (const path of paths) check(readFileSync(path).equals(execFileSync("git", ["show", `HEAD:${path}`],
      { maxBuffer: 256 * 1024 * 1024 })), `working copy differs from committed evidence: ${path}`);
    const manifest = retainArtifacts(root, paths, store);
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
    result = { ...checkArtifacts(root, manifest, store), store, manifest: manifestPath };
  } else {
    const manifest = validateManifest(JSON.parse(readFileSync(manifestPath)));
    result = command === "evict" ? evictArtifacts(root, manifest, store)
      : command === "restore" ? restoreArtifacts(root, manifest, store)
      : command === "check" ? checkArtifacts(root, manifest, store) : { artifacts: manifest.entries.length };
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
