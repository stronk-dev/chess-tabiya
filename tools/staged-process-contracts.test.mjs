import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { assertStagedLogsAppendOnly, materializeGitIndex, PROCESS_CONTRACT_TARGETS } from "./staged-process-contracts.mjs";

function committedRepository(context) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-log-fixture-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  const logDirectory = path.join(root, "planning", "exploration");
  mkdirSync(logDirectory, { recursive: true });
  const log = path.join(logDirectory, "log.md");
  writeFileSync(log, "# Log\n\nfirst\n");
  execFileSync("git", ["add", "planning/exploration/log.md"], { cwd: root });
  execFileSync("git", ["commit", "--quiet", "-m", "baseline"], { cwd: root });
  return { root, log };
}

test("materializes staged bytes without unstaged or untracked working-tree changes", (context) => {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-index-fixture-"));
  const snapshot = mkdtempSync(path.join(tmpdir(), "tabiya-index-snapshot-"));
  context.after(() => {
    rmSync(root, { recursive: true, force: true });
    rmSync(snapshot, { recursive: true, force: true });
  });

  execFileSync("git", ["init", "--quiet"], { cwd: root });
  writeFileSync(path.join(root, "tracked.txt"), "staged\n");
  execFileSync("git", ["add", "tracked.txt"], { cwd: root });
  writeFileSync(path.join(root, "tracked.txt"), "unstaged\n");
  writeFileSync(path.join(root, "untracked.txt"), "other worker\n");

  materializeGitIndex(root, snapshot);

  assert.equal(readFileSync(path.join(snapshot, "tracked.txt"), "utf8"), "staged\n");
  assert.equal(existsSync(path.join(snapshot, "untracked.txt")), false);
});

test("runs the complete governance subset used by the pre-commit hook", () => {
  assert.deepEqual(PROCESS_CONTRACT_TARGETS, [
    "register-check",
    "status-parity",
    "work-index",
    "roadmap-check",
    "intent-parity",
  ]);
});

test("accepts a staged append after the previous committed EOF", (context) => {
  const { root, log } = committedRepository(context);
  writeFileSync(log, "# Log\n\nfirst\n\nsecond\n");
  execFileSync("git", ["add", "planning/exploration/log.md"], { cwd: root });
  assert.deepEqual(assertStagedLogsAppendOnly(root), ["planning/exploration/log.md"]);
});

test("refuses a staged insertion before the previous committed EOF", (context) => {
  const { root, log } = committedRepository(context);
  writeFileSync(log, "# Log\n\ninserted\n\nfirst\n");
  execFileSync("git", ["add", "planning/exploration/log.md"], { cwd: root });
  assert.throws(() => assertStagedLogsAppendOnly(root), /changed before the previous committed EOF/u);
});

test("refuses deleting an append-only log", (context) => {
  const { root, log } = committedRepository(context);
  rmSync(log);
  execFileSync("git", ["add", "planning/exploration/log.md"], { cwd: root });
  assert.throws(() => assertStagedLogsAppendOnly(root), /cannot be removed/u);
});
