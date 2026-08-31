import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { assertStagedLogsAppendOnly, assertStagedRoadmapFlowback, materializeGitIndex, PROCESS_CONTRACT_TARGETS } from "./staged-process-contracts.mjs";

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
    "work-state",
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

function roadmapFlowbackRepository(context) {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-roadmap-flowback-fixture-"));
  context.after(() => rmSync(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "--quiet"], { cwd: root });
  execFileSync("git", ["config", "user.email", "test@example.invalid"], { cwd: root });
  execFileSync("git", ["config", "user.name", "Test"], { cwd: root });
  for (const directory of ["apps/web/src", "rfc", "planning"]) mkdirSync(path.join(root, directory), { recursive: true });
  writeFileSync(path.join(root, "apps/web/src/feature.ts"), "export const value = 1;\n");
  writeFileSync(path.join(root, "rfc/feature.md"), "# Feature\n");
  writeFileSync(path.join(root, "rfc/README.md"), "## Active\n\n| RFC | Status | Parent | Implementation |\n|---|---|---|---|\n| `feature.md` | **implementing** | — | — |\n\n## Archive\n");
  const roadmap = { executionPlan: { milestones: [{ id: "feature", latestCheckpoint: { at: "2026-08-30", summary: "old", impact: "held", evidence: ["rfc/feature.md"] } }] } };
  writeFileSync(path.join(root, "planning/roadmap-1.0.json"), `${JSON.stringify(roadmap)}\n`);
  writeFileSync(path.join(root, "planning/roadmap-1.0.receipt.json"), "{}\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "--quiet", "-m", "baseline"], { cwd: root });
  return { root, roadmap };
}

test("requires a changed grounded checkpoint for staged product plus active RFC work", (context) => {
  const { root, roadmap } = roadmapFlowbackRepository(context);
  writeFileSync(path.join(root, "apps/web/src/feature.ts"), "export const value = 2;\n");
  writeFileSync(path.join(root, "rfc/feature.md"), "# Feature\n\ncheckpoint\n");
  execFileSync("git", ["add", "apps/web/src/feature.ts", "rfc/feature.md"], { cwd: root });
  assert.throws(() => assertStagedRoadmapFlowback(root), /must also stage planning\/roadmap-1\.0\.json/u);

  roadmap.executionPlan.milestones[0].latestCheckpoint = { at: "2026-08-31", summary: "new", impact: "advanced", evidence: ["docs/missing.md"] };
  writeFileSync(path.join(root, "planning/roadmap-1.0.json"), `${JSON.stringify(roadmap)}\n`);
  writeFileSync(path.join(root, "planning/roadmap-1.0.receipt.json"), "{\"changed\":true}\n");
  execFileSync("git", ["add", "planning/roadmap-1.0.json", "planning/roadmap-1.0.receipt.json"], { cwd: root });
  assert.throws(() => assertStagedRoadmapFlowback(root), /do not name staged RFC evidence rfc\/feature\.md/u);

  roadmap.executionPlan.milestones[0].latestCheckpoint.evidence = ["rfc/feature.md"];
  writeFileSync(path.join(root, "planning/roadmap-1.0.json"), `${JSON.stringify(roadmap)}\n`);
  execFileSync("git", ["add", "planning/roadmap-1.0.json"], { cwd: root });
  assert.deepEqual(assertStagedRoadmapFlowback(root), ["feature"]);
});

test("ignores another worker's unstaged implementation bytes", (context) => {
  const { root } = roadmapFlowbackRepository(context);
  writeFileSync(path.join(root, "apps/web/src/feature.ts"), "export const value = 2;\n");
  writeFileSync(path.join(root, "rfc/feature.md"), "# Feature\n\nunstaged\n");
  assert.deepEqual(assertStagedRoadmapFlowback(root), []);
});
