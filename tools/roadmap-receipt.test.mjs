import assert from "node:assert/strict";
import test from "node:test";

import { buildRoadmapReceipt, receiptMismatch } from "./roadmap-receipt.mjs";

const dimensions = Object.fromEntries([
  "evidence", "state", "api", "experience", "defaults", "content", "verification", "release",
].map((name) => [name, [name === "state" ? "proven" : "partial", `${name} exit`]]));

const sources = {
  roadmap: JSON.stringify({
    authority: "planning/roadmap-to-done.md",
    definitionOfDone: Object.keys(dimensions),
    capabilities: [
      { id: "one", name: "One", release: "core", owner: "a", rfcs: ["a.md"], completion: dimensions },
      { id: "two", name: "Two", release: "breadth", owner: "b", rfcs: ["b.md"], completion: dimensions },
    ],
    executionPlan: { milestones: [{ id: "first", wave: 0, state: "active", capabilities: ["one", "two"], dependsOn: [], nextAction: "act", exit: "exit" }] },
    appRoutes: [["home", "one", "live"], ["campaign", "two", "missing"]],
    apiFamilies: [["/runs", "one", "live"], ["/campaigns", "two", "missing"]],
  }),
  workItems: JSON.stringify({ items: [
    { id: "ONE-a1", capability: "one", state: "queued" },
    { id: "TWO-d1", capability: "two", state: "completed" },
  ] }),
  rfcRegister: "register",
  uxIndex: "index",
  router: "router",
  application: "application",
  rest: "rest",
};

test("builds a deterministic vertical status receipt", () => {
  const receipt = buildRoadmapReceipt(sources);
  assert.deepEqual(receipt.summary.releaseClasses, { core: 1, breadth: 1, post_1_0: 0 });
  assert.deepEqual(receipt.summary.workItems, { queued: 1, blocked_owner: 0, blocked_rfc: 0, completed: 1, retired: 0 });
  assert.deepEqual(receipt.summary.appRoutes, { live: 1, live_but_inadequate: 0, missing: 1 });
  assert.equal(receipt.capabilities[0].workItems.queued, 1);
  assert.equal(receipt.capabilities[1].apiFamilies.missing, 1);
  assert.equal(receipt.milestones[0].nextAction, "act");
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
