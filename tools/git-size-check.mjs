import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { manifestPath, researchPrefixes, validateManifest } from "./research-artifacts.mjs";

export const sourceLimit = 5 * 1024 * 1024;
export const researchLimit = 1024 * 1024;
export function oversizedBlobs(entries, externalPaths = new Set()) {
  return entries.flatMap(({ path, bytes }) => externalPaths.has(path)
    ? [`${path}: externally retained research must not be tracked again`]
    : bytes >= (researchPrefixes.some(prefix => path.startsWith(prefix)) ? researchLimit : sourceLimit)
      ? [`${path}: ${bytes} bytes; retain large data outside Git and commit its manifest instead`] : []);
}
export function checkGitSizes({ staged = false, root = process.cwd() } = {}) {
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe", maxBuffer: 20 * 1024 * 1024 });
  const ref = staged ? "" : "HEAD";
  let manifest;
  try { manifest = git(["show", `${ref}:${manifestPath}`]); }
  catch (error) { if (error.status !== 128) throw error; }
  const externalPaths = new Set(manifest ? validateManifest(JSON.parse(manifest)).entries.map(e => e.path) : []);
  const names = git(staged ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]
    : ["diff-tree", "--root", "--no-commit-id", "-r", "--name-only", "--diff-filter=ACMR", "-z", "HEAD"])
    .split("\0").filter(Boolean);
  const entries = names.map(path => ({ path, bytes: Number(git(["cat-file", "-s", `${ref}:${path}`])) }));
  const tracked = new Set(git(staged ? ["ls-files", "-z"] : ["ls-tree", "-r", "--name-only", "-z", "HEAD"])
    .split("\0").filter(Boolean));
  const failures = oversizedBlobs(entries, externalPaths);
  for (const path of externalPaths) if (tracked.has(path) && !names.includes(path))
    failures.push(`${path}: externally retained research is still tracked`);
  if (failures.length) throw new Error(`Git size check refused:\n${failures.join("\n")}`);
  return { checked: entries.length, scope: staged ? "exact_staged_blobs" : "committed_change", rawArtifactsRequired: false };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).some(x => x !== "--staged")) throw new Error("use --staged or no arguments");
  console.log(JSON.stringify(checkGitSizes({ staged: process.argv.includes("--staged") })));
}
