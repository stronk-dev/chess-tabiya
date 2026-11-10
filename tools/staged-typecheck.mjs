#!/usr/bin/env node
// Project types must see one complete index image, including dependency files, rather than
// Lefthook's mixture of hidden partial hunks and other unfinished working-tree files.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { materializeGitIndex } from "./staged-process-contracts.mjs";

export function runStagedTypecheck(root, { execute = directory => {
  execFileSync("make", ["setup", "typecheck"], { cwd: directory, stdio: "inherit" });
} } = {}) {
  const temporary = mkdtempSync(join(tmpdir(), "tabiya-staged-types-"));
  const snapshot = join(temporary, "snapshot");
  try {
    materializeGitIndex(root, snapshot);
    mkdirSync(join(snapshot, ".cache"), { recursive: true });
    // Share only downloaded tool/package caches. Each snapshot installs its OWN node_modules,
    // so workspace imports cannot resolve to uncommitted source in the operator checkout.
    for (const name of ["toolchains", "pnpm-home", "pnpm-state", "pnpm-store", "pnpm-cache"]) {
      const source = join(root, ".cache", name), destination = join(snapshot, ".cache", name);
      if (existsSync(source)) symlinkSync(realpathSync(source), destination, "dir");
    }
    execute(snapshot);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runStagedTypecheck(process.cwd()); }
  catch (error) { console.error(`staged typecheck failed: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
}
