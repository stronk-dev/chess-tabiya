#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROCESS_CONTRACT_TARGETS = Object.freeze([
  "register-check",
  "status-parity",
  "work-index",
  "roadmap-check",
  "intent-parity",
]);

export function materializeGitIndex(root, destination) {
  const prefix = `${path.resolve(destination)}${path.sep}`;
  mkdirSync(prefix, { recursive: true });
  execFileSync("git", ["checkout-index", "--all", `--prefix=${prefix}`], {
    cwd: root,
    stdio: "pipe",
  });
  return prefix;
}

export function runStagedProcessContracts(root, options = {}) {
  const temporary = mkdtempSync(path.join(tmpdir(), "tabiya-process-index-"));
  const snapshot = path.join(temporary, "snapshot");
  try {
    materializeGitIndex(root, snapshot);
    execFileSync(options.make ?? "make", PROCESS_CONTRACT_TARGETS, {
      cwd: snapshot,
      env: process.env,
      stdio: options.stdio ?? "inherit",
    });
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  try {
    runStagedProcessContracts(root);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`staged process contracts failed: ${detail}`);
    process.exitCode = 1;
  }
}
