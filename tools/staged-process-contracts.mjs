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

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function gitObject(root, object) {
  try {
    return git(root, ["show", object]);
  } catch {
    return undefined;
  }
}

export function assertStagedLogsAppendOnly(root) {
  const changed = git(root, ["diff", "--cached", "--name-only", "--diff-filter=ACMRD", "--", "planning"])
    .split("\n")
    .filter((path) => path === "planning/log.md" || path.startsWith("planning/") && path.endsWith("/log.md"));
  const errors = [];
  for (const path of changed) {
    const committed = gitObject(root, `HEAD:${path}`) ?? "";
    const staged = gitObject(root, `:${path}`);
    if (staged === undefined) {
      errors.push(`${path} was deleted; append-only logs cannot be removed`);
    } else if (!staged.startsWith(committed)) {
      errors.push(`${path} changed before the previous committed EOF; append new entries at the tail only`);
    }
  }
  if (errors.length > 0) throw new Error(`append-only log check failed:\n- ${errors.join("\n- ")}`);
  return Object.freeze(changed);
}

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
    assertStagedLogsAppendOnly(root);
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
