import assert from "node:assert/strict";
import test from "node:test";

import { buildInitialRegistry, completeRegistryItems, parseUxWorkItems, synchronizeRegistry, validateWorkItemRegistry } from "./work-item-registry.mjs";

const dimensions = Object.fromEntries(["evidence", "state", "api", "experience", "defaults", "content", "verification", "release"].map((name) => [name, ["partial", `${name} condition`]]));
const roadmap = {
  capabilities: [{ id: "rehearsal", owner: "core-loop", release: "core", rfcs: [], completion: dimensions }],
  uxItemPrefixes: { ARR: "rehearsal" },
  uxItemSources: { ARR: "ux-arrival.md" },
};
const index = `## (a) BUILDABLE NOW\n### Arrival\n| ARR-a1 | §1 | Start the loop | none | cheap | 🏆 |\n## (b) BLOCKED ON AN OWNER RULING\n### Account ruling\n| ARR-b1 | §2 | Claim the run | ledger | |\n## (d) ALREADY DONE AT HEAD\n### Done\n| ARR-d1 | §3 | Existing path | proof |`;

test("parses lifecycle, owner, capability, source, and tournament state", () => {
  const items = parseUxWorkItems(index, roadmap);
  assert.deepEqual(items.map(({ id, state, assignment }) => ({ id, state, assignment })), [
    { id: "ARR-a1", state: "queued", assignment: "capability:rehearsal" },
    { id: "ARR-b1", state: "blocked_owner", assignment: "capability:rehearsal" },
    { id: "ARR-d1", state: "completed", assignment: "closed" },
  ]);
  assert.equal(items[0].owner, "core-loop");
  assert.equal(items[0].sourceDocument, "ux-arrival.md");
  assert.equal(items[0].tournamentReady, true);
});

test("refuses a live item that is merely mentioned but not assigned", () => {
  const expected = parseUxWorkItems(index, roadmap);
  const registry = buildInitialRegistry(index, roadmap);
  const items = registry.items.map((item) => item.id === "ARR-a1" ? { ...item, assignment: "unassigned" } : item);
  const result = validateWorkItemRegistry({ ...registry, items }, expected, roadmap);
  assert(result.errors.includes("ARR-a1: live item is unassigned"));
});

test("refuses stale source bytes and wrong capability ownership", () => {
  const expected = parseUxWorkItems(index, roadmap);
  const registry = buildInitialRegistry(index, roadmap);
  const items = registry.items.map((item) => item.id === "ARR-a1" ? { ...item, sourceDigest: "sha256:stale", owner: "nobody" } : item);
  const result = validateWorkItemRegistry({ ...registry, items }, expected, roadmap);
  assert(result.errors.includes("ARR-a1: stale sourceDigest"));
  assert(result.errors.some((error) => error.includes("disagrees with capability owner")));
});

test("refuses additions or deletions on either side of the registry join", () => {
  const expected = parseUxWorkItems(index, roadmap);
  const registry = buildInitialRegistry(index, roadmap);
  const result = validateWorkItemRegistry({ ...registry, items: registry.items.slice(1) }, expected, roadmap);
  assert(result.errors.some((error) => error.includes("work-item coverage mismatch")));
});

test("synchronizes an explicitly completed source item to a closed assignment", () => {
  const completed = index.replace(
    "| ARR-a1 | §1 | Start the loop | none | cheap | 🏆 |",
    "| ARR-a1 | §1 | Start the loop | implemented |",
  ).replace("## (a) BUILDABLE NOW", "## (d) ALREADY DONE AT HEAD");
  const registry = synchronizeRegistry(completed, roadmap);
  const item = registry.items.find((candidate) => candidate.id === "ARR-a1");
  assert.equal(item?.state, "completed");
  assert.equal(item?.assignment, "closed");
});

test("advances a stable live id to evidence-bearing completion and preserves it on sync", () => {
  const initial = buildInitialRegistry(index, roadmap);
  const completed = completeRegistryItems(initial, ["ARR-a1"], "2026-08-25", "D1544 test landing");
  const result = validateWorkItemRegistry(completed, parseUxWorkItems(index, roadmap), roadmap);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(completed.items.find((item) => item.id === "ARR-a1"), {
    ...initial.items.find((item) => item.id === "ARR-a1"),
    state: "completed",
    assignment: "closed",
    completion: { completedOn: "2026-08-25", evidence: "D1544 test landing" },
  });
  assert.equal(synchronizeRegistry(index, roadmap, completed).items.find((item) => item.id === "ARR-a1")?.state, "completed");
});

test("refuses terminal progress without trace evidence and never reopens source-closed work", () => {
  const initial = buildInitialRegistry(index, roadmap);
  const untraced = { ...initial, items: initial.items.map((item) => item.id === "ARR-a1" ? { ...item, state: "completed", assignment: "closed" } : item) };
  assert(validateWorkItemRegistry(untraced, parseUxWorkItems(index, roadmap), roadmap).errors.includes("ARR-a1: completed live item lacks evidence"));
  const reopened = { ...initial, items: initial.items.map((item) => item.id === "ARR-d1" ? { ...item, state: "queued", assignment: "capability:rehearsal" } : item) };
  assert(validateWorkItemRegistry(reopened, parseUxWorkItems(index, roadmap), roadmap).errors.includes("ARR-d1: execution state queued reopens source-closed completed"));
});
