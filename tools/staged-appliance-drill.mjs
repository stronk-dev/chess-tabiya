#!/usr/bin/env node
// Prove exactly what is staged, not an application image containing concurrent held source edits.
// Reuses the established index snapshot mechanism; no git worktree add, stash or checkout changes.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { materializeGitIndex } from "./staged-process-contracts.mjs";
import { attachSnapshotHistory } from "./staged-application-snapshot.mjs";

const { values } = parseArgs({ options: { software: { type: "boolean", default: false } } });
const target = values.software ? "verify-software" : "appliance-drill";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = mkdtempSync(join(tmpdir(), "tabiya-appliance-index-"));
const snapshot = join(temporary, "snapshot");
const output = join(root, values.software ? ".cache/verification/staged-software-proof.json" : ".cache/deploy/source-appliance-staged-proof.json");
let phase = "materialize_index";
let tree;
let head;
try {
  head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  tree = execFileSync("git", ["write-tree"], { cwd: root, encoding: "utf8" }).trim();
  materializeGitIndex(root, snapshot);
  if (values.software) attachSnapshotHistory({ root, snapshot, head, tree });
  // The repo deliberately uses workspace-relative pinned pnpm caches. Reuse those dependency
  // caches, not workspace node_modules/source links, while installing fresh index-local links.
  mkdirSync(join(snapshot, ".cache"), { recursive: true });
  for (const name of ["pnpm-cache", "pnpm-store", "pnpm-state"]) {
    const cache = join(root, ".cache", name);
    mkdirSync(cache, { recursive: true });
    symlinkSync(cache, join(snapshot, ".cache", name), "dir");
  }
  phase = "install_pinned_dependencies";
  const install = spawnSync("pnpm", ["install", "--frozen-lockfile"], { cwd: snapshot, stdio: "inherit", timeout: 180_000 });
  if (install.error || install.status !== 0) throw new Error(`frozen dependency installation failed: ${install.error?.message ?? install.status}`);
  phase = target;
  const run = spawnSync("make", [target, `TABIYA_APPLICATION_REVISION=dev+${tree}`], { cwd: snapshot, stdio: "inherit", timeout: 1_800_000 });
  const captured = join(snapshot, ".cache/deploy/source-appliance-proof.json");
  if (!values.software && existsSync(captured)) {
    const proof = JSON.parse(readFileSync(captured, "utf8"));
    proof.sources = { mode: "git-index", head, tree, includesUnstagedChanges: false };
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(proof, null, 2) + "\n");
  }
  if (values.software) {
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify({ target, sources: { mode: "git-index", head, tree, includesUnstagedChanges: false }, result: run.error || run.status !== 0 ? "failed" : "passed", exitCode: run.status, error: run.error?.message ?? null }, null, 2) + "\n");
  }
  if (run.error || run.status !== 0) throw new Error(`staged ${target} failed: ${run.error?.message ?? run.status}; ${output}`);
  console.error(`exact-index ${target} passed: ${tree}; ${output}`);
} catch (error) {
  console.error(`${phase}: ${error.message}`);
  process.exitCode = 1;
} finally { rmSync(temporary, { recursive: true, force: true }); }
