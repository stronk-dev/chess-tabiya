// RFC pack-capability-contract §2.3/§5: regeneration may add identities, never rewrite a
// committed meaning at the same identity/version. No network fetch or baseline override.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const DECLARATIONS = "packages/runtime/src/capability/declarations.generated.ts";
const canonical = (value) => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);

export function declarationRows(text) {
  if (text === undefined) return [];
  const match = /export const GENERATED_CAPABILITY_DECLARATIONS[^=]*= Object\.freeze\(JSON\.parse\(String\.raw`(\[[\s\S]*\])`\) as GeneratedCapabilityDeclaration\[\]\);/u.exec(text);
  if (match === null) throw new Error("CAPABILITY_HISTORY_IMAGE_INVALID");
  const rows = JSON.parse(match[1]);
  if (!Array.isArray(rows)) throw new Error("CAPABILITY_HISTORY_IMAGE_INVALID");
  const keys = new Set();
  for (const row of rows) {
    if (typeof row?.subjectId !== "string" || row.subjectId !== row.id?.id ||
      !["integer", "semver"].includes(row.id?.version?.kind) || typeof row.semanticsDigest !== "string") throw new Error("CAPABILITY_HISTORY_ROW_INVALID");
    const key = canonical(row.id);
    if (keys.has(key)) throw new Error("CAPABILITY_HISTORY_DUPLICATE");
    keys.add(key);
  }
  return rows;
}

export function assertCapabilityHistory(baseText, candidateText) {
  if (candidateText === undefined) throw new Error("CAPABILITY_HISTORY_IMAGE_MISSING");
  const base = declarationRows(baseText);
  const next = new Map(declarationRows(candidateText).map((row) => [canonical(row.id), row]));
  for (const row of base) {
    const retained = next.get(canonical(row.id));
    const name = `${row.id.id}@${row.id.version.kind}:${row.id.version.value}`;
    if (retained === undefined) throw new Error(`CAPABILITY_HISTORY_REMOVED: ${name}`);
    if (canonical(retained) !== canonical(row)) throw new Error(`CAPABILITY_HISTORY_REWRITTEN: ${name}; retain this declaration and add its versioned successor`);
  }
  return { retained: base.length, total: next.size };
}

export function checkRepositoryHistory({ root = process.cwd(), ci = false, staged = false } = {}) {
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024 });
  // An unavailable parent is not an empty initial registry. CI checkout must supply its parent.
  git(["rev-parse", "--verify", "HEAD"]);
  const baseRef = ci ? "HEAD^1" : "HEAD";
  if (ci) git(["rev-parse", "--verify", baseRef]);
  const readTree = (tree) => {
    const files = git(["ls-tree", "-r", "--name-only", tree, "--", DECLARATIONS]).trim();
    return files === "" ? undefined : git(["show", `${tree}:${DECLARATIONS}`]);
  };
  const base = readTree(baseRef);
  const candidate = ci ? readTree("HEAD") : staged ? git(["show", `:${DECLARATIONS}`]) : readFileSync(resolve(root, DECLARATIONS), "utf8");
  return assertCapabilityHistory(base, candidate);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = checkRepositoryHistory({ ci: process.argv.includes("--ci"), staged: process.argv.includes("--staged") });
  console.log(`capability history: ${result.retained} committed declarations retained; ${result.total} candidate declarations`);
}
