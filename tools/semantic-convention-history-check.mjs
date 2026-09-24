#!/usr/bin/env node
// Append-only semantic history check (rfc/semantic-convention-provenance.md §1).
//
// `packages/runtime/src/evidence-convention-history.jsonl` holds one newline-terminated canonical
// JSON row per landed convention `id@version`, with exactly `ref`, `semanticDigest`,
// `registryDigest` and `ownerRfc` in that order. A row never carries its own landing commit
// ([[D2019]]); Git identifies the introducing commit externally.
//
// Checks, in order:
//   1. shape — canonical bytes, exact keys/order, `sha256:<64 hex>` digests, unique refs, final newline;
//   2. lineage — per base id, versions appear 1, 2, 3 … in file order (no skip or backtrack);
//   3. registry — every runtime declaration has exactly one row whose semanticDigest equals the
//      declaration's current semantic digest, and every row names a declaration (a same-version
//      meaning rewrite therefore fails even if the row is rewritten, because of check 4);
//   4. append-only — the working file extends the file at HEAD byte-for-byte, the index extends HEAD
//      (`--staged`), and HEAD extends its first parent. A missing parent (shallow clone, root commit)
//      skips only that comparison and says so.
//
//   node tools/semantic-convention-history-check.mjs            # checks 1–4 on the working tree
//   node tools/semantic-convention-history-check.mjs --staged   # also the index against HEAD
//   node tools/semantic-convention-history-check.mjs --append   # append rows for unrecorded declarations
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const HISTORY = "packages/runtime/src/evidence-convention-history.jsonl";
const KEYS = ["ref", "semanticDigest", "registryDigest", "ownerRfc"];
const REF = /^([a-z][a-z0-9_-]*)@([1-9][0-9]*)$/u;
const DIGEST = /^sha256:[0-9a-f]{64}$/u;
const OWNER = /^[a-z0-9-]+\.md$/u;

/** Parses and validates the history bytes; returns rows in file order. */
export function parseHistory(text) {
  if (text.length > 0 && !text.endsWith("\n")) throw new Error(`${HISTORY}: missing final newline`);
  const rows = [];
  const seen = new Set();
  const lineage = new Map();
  for (const [index, line] of text.split("\n").slice(0, -1).entries()) {
    const where = `${HISTORY}:${index + 1}`;
    let row;
    try { row = JSON.parse(line); } catch { throw new Error(`${where}: not JSON`); }
    if (row === null || typeof row !== "object" || Array.isArray(row) || Object.keys(row).join(",") !== KEYS.join(",")) throw new Error(`${where}: keys must be exactly ${KEYS.join(", ")} in that order`);
    if (JSON.stringify(row) !== line) throw new Error(`${where}: not canonical JSON`);
    const match = typeof row.ref === "string" ? row.ref.match(REF) : null;
    if (match === null) throw new Error(`${where}: malformed ref ${row.ref}`);
    if (!DIGEST.test(row.semanticDigest) || !DIGEST.test(row.registryDigest)) throw new Error(`${where}: digests must be sha256:<64 lowercase hex>`);
    if (typeof row.ownerRfc !== "string" || !OWNER.test(row.ownerRfc)) throw new Error(`${where}: malformed ownerRfc ${row.ownerRfc}`);
    if (seen.has(row.ref)) throw new Error(`${where}: ${row.ref} has more than one row`);
    seen.add(row.ref);
    const [, id, version] = match;
    const expected = (lineage.get(id) ?? 0) + 1;
    if (Number(version) !== expected) throw new Error(`${where}: ${row.ref} skips or backtracks lineage (expected ${id}@${expected})`);
    lineage.set(id, expected);
    rows.push(row);
  }
  return rows;
}

/** Every declaration has exactly one row with its current semantic digest; every row is declared. */
export function checkAgainstRegistry(rows, declarations) {
  const errors = [];
  const byRef = new Map(rows.map((row) => [row.ref, row]));
  const declared = new Set();
  for (const { ref, semanticDigest } of declarations) {
    declared.add(ref);
    const row = byRef.get(ref);
    if (row === undefined) errors.push(`${ref}: declared but has no history row`);
    else if (row.semanticDigest !== semanticDigest) errors.push(`${ref}: semantic meaning changed at the same version (history ${row.semanticDigest}, declaration ${semanticDigest}); declare ${ref.replace(/@(\d+)$/u, (_, v) => `@${Number(v) + 1}`)} instead`);
  }
  for (const row of rows) if (!declared.has(row.ref)) errors.push(`${row.ref}: history row names no current declaration`);
  return errors;
}

/** The later bytes must extend the earlier bytes exactly. */
export function checkAppendOnly(before, after, label) {
  if (before === null) return [];
  return after.startsWith(before) ? [] : [`${label}: ${HISTORY} rewrote, reordered or deleted prior bytes`];
}

function git(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

async function runtimeDeclarations() {
  const { build } = await import("esbuild");
  const work = mkdtempSync(join(tmpdir(), "semantic-convention-history-"));
  try {
    const outfile = join(work, "registry.mjs");
    await build({ entryPoints: [join(root, "packages/runtime/src/evidence-conventions.ts")], bundle: true, platform: "node", format: "esm", outfile, logLevel: "silent" });
    const registry = await import(pathToFileURL(outfile).href);
    return {
      registryDigest: registry.CONVENTION_REGISTRY.digest,
      declarations: registry.CONVENTION_REGISTRY.declarations.map((declaration) => ({
        ref: registry.conventionRefKey(declaration.ref),
        semanticDigest: registry.conventionSemanticDigest(declaration),
      })),
    };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = [];
  const working = readFileSync(join(root, HISTORY), "utf8");
  const rows = parseHistory(working);
  const runtime = await runtimeDeclarations();
  if (process.argv.includes("--append")) {
    const owner = process.argv.find((arg) => arg.startsWith("--owner="))?.slice("--owner=".length);
    if (owner === undefined || !OWNER.test(owner)) throw new Error("--append needs --owner=<rfc>.md");
    const recorded = new Set(rows.map((row) => row.ref));
    const additions = runtime.declarations.filter(({ ref }) => !recorded.has(ref))
      .map(({ ref, semanticDigest }) => JSON.stringify({ ref, semanticDigest, registryDigest: runtime.registryDigest, ownerRfc: owner }));
    writeFileSync(join(root, HISTORY), working + additions.map((line) => `${line}\n`).join(""));
    console.log(`appended ${additions.length} history rows`);
    process.exit(0);
  }
  errors.push(...checkAgainstRegistry(rows, runtime.declarations));
  const head = git(["show", `HEAD:${HISTORY}`]);
  errors.push(...checkAppendOnly(head, working, "working tree vs HEAD"));
  if (process.argv.includes("--staged")) {
    const staged = git(["show", `:${HISTORY}`]);
    if (staged !== null) errors.push(...checkAppendOnly(head, staged, "index vs HEAD"));
  }
  const parent = git(["show", `HEAD^1:${HISTORY}`]);
  const parentNote = git(["rev-parse", "--verify", "-q", "HEAD^1"]) === null ? " (no first parent available; HEAD-vs-parent skipped)" : "";
  if (head !== null) errors.push(...checkAppendOnly(parent, head, "HEAD vs first parent"));
  if (errors.length > 0) {
    for (const error of errors) console.error(`semantic-convention-history-check: ${error}`);
    process.exit(1);
  }
  console.log(`semantic-convention-history-check: ${rows.length} rows, ${runtime.declarations.length} declarations, append-only${parentNote}`);
}
