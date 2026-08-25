import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { materializeGitIndex, PROCESS_CONTRACT_TARGETS } from "./staged-process-contracts.mjs";

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
