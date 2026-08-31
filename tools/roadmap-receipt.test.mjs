import assert from "node:assert/strict";
import test from "node:test";

import { buildRoadmapReceipt, receiptMismatch } from "./roadmap-receipt.mjs";

const dimensions = Object.fromEntries([
  "evidence", "state", "api", "experience", "defaults", "content", "verification", "release",
].map((name) => [name, [name === "state" ? "proven" : "partial", `${name} exit`]]));

const sources = {
  roadmap: JSON.stringify({
    schemaVersion: 2,
    authority: "planning/roadmap-to-done.md",
    definitionOfDone: Object.keys(dimensions),
    capabilities: [
      { id: "one", name: "One", release: "core", owner: "a", rfcs: ["a.md"], completion: dimensions },
      { id: "two", name: "Two", release: "breadth", owner: "b", rfcs: ["b.md"], completion: dimensions },
    ],
    executionPlan: { milestones: [{ id: "first", wave: 0, state: "active", capabilities: ["one", "two"], dependsOn: [], nextAction: "act", latestCheckpoint: { at: "2026-08-31", summary: "advanced", impact: "advanced", evidence: ["rfc/a.md"] }, exit: "exit" }] },
    appRoutes: [["home", "one", "live"], ["campaign", "two", "missing"]],
    apiFamilies: [["/runs", "one", "live"], ["/campaigns", "two", "missing"]],
  }),
  workItems: JSON.stringify({ items: [
    { id: "ONE-a1", capability: "one", state: "queued" },
    { id: "TWO-d1", capability: "two", state: "completed" },
  ] }),
  workState: JSON.stringify({ items: [
    { id: "D1", state: "doing" },
    { id: "D2", state: "blocked" },
  ] }),
  rfcRegister: "## Active\n\n| RFC | Status | Parent | Implementation |\n|---|---|---|---|\n| `0000-rfc-process.md` | **accepted** | — | process |\n| `a.md` | **draft** | — | — |\n| `b.md` | **accepted** | — | — |\n\n## Archive\n",
  uxIndex: "index",
  router: "router",
  application: "application",
  rest: "rest",
};

test("builds a deterministic vertical status receipt", () => {
  const receipt = buildRoadmapReceipt(sources);
  assert.deepEqual(receipt.summary.releaseClasses, { core: 1, breadth: 1, post_1_0: 0 });
  assert.deepEqual(receipt.summary.workItems, { queued: 1, blocked_owner: 0, blocked_rfc: 0, completed: 1, retired: 0 });
  assert.deepEqual(receipt.summary.workState, { untriaged: 0, todo: 0, doing: 1, blocked: 1, done: 0, refused: 0 });
  assert.deepEqual(receipt.summary.appRoutes, { live: 1, live_but_inadequate: 0, missing: 1 });
  assert.equal(receipt.capabilities[0].workItems.queued, 1);
  assert.equal(receipt.capabilities[1].apiFamilies.missing, 1);
  assert.equal(receipt.milestones[0].nextAction, "act");
  assert.equal(receipt.milestones[0].latestCheckpoint.summary, "advanced");
  assert.deepEqual(receipt.summary.activeRfcLifecycle, { draft: 1, accepted: 1, implementing: 0, awaiting: 0, implemented: 0, superseded: 0, withdrawn: 0 });
});

test("distinguishes source drift from derived-status corruption", () => {
  const expected = buildRoadmapReceipt(sources);
  assert.equal(receiptMismatch(structuredClone(expected), expected), undefined);
  const changedSource = structuredClone(expected);
  changedSource.sourceDigests.roadmap = "sha256:stale";
  assert.match(receiptMismatch(changedSource, expected), /source digest changed: roadmap/u);
  const changedStatus = structuredClone(expected);
  changedStatus.summary.capabilities = 99;
  assert.equal(receiptMismatch(changedStatus, expected), "derived status differs from its sources");
});
