import assert from "node:assert/strict";
import test from "node:test";

import { parseClientRoutes, parseUxItemIds, validateRegistry } from "./roadmap-check.mjs";

test("parses static and dynamic client routes", () => {
  const source = `
    export type StaticRouteName = "home" | "play";
    export type AppRoute = { readonly name: StaticRouteName } | { readonly name: "run"; id: string } | { readonly name: "not-found" };\n\n
    type Subscriber = () => void;
  `;
  assert.deepEqual([...parseClientRoutes(source)].sort(), ["home", "play", "run"]);
});
test("parses every persistent UX item id", () => {
  assert.deepEqual(parseUxItemIds("| ARR-a1 | x |\n| OPP-c9 | y |\n| not-an-item |"), ["ARR-a1", "OPP-c9"]);
});

test("rejects duplicate RFC ownership and an unassigned UX prefix", () => {
  const dimensions = Object.fromEntries([
    "evidence", "state", "api", "experience", "defaults", "content", "verification", "release",
  ].map((name) => [name, ["partial", `${name} condition`]]));
  const result = validateRegistry({
    schemaVersion: 2,
    workItemRegistry: "planning/work-items-1.0.json",
    definitionOfDone: Object.keys(dimensions),
    capabilities: [
      { id: "one", owner: "a", release: "core", rfcs: ["a.md"], completion: dimensions },
      { id: "two", owner: "b", release: "core", rfcs: ["a.md"], completion: dimensions },
    ],
    executionPlan: { milestones: [
      { id: "cycle-a", wave: 0, state: "active", capabilities: ["one"], dependsOn: ["cycle-b"], nextAction: "act", latestCheckpoint: { at: "2026-08-31", summary: "one", impact: "advanced", evidence: ["one.md"] }, exit: "exit" },
      { id: "cycle-b", wave: 1, state: "queued", capabilities: ["two"], dependsOn: ["cycle-a"], nextAction: "act", latestCheckpoint: { at: "2026-08-31", summary: "two", impact: "held", evidence: ["two.md"] }, exit: "exit" },
    ] },
    uxSources: { "ux-test.md": "one" },
    uxItemPrefixes: { ARR: "one" },
    uxItemSources: { ARR: "ux-test.md" },
    appRoutes: [["home", "one", "live"]],
    apiFamilies: [["/healthz", "one", "live_direct"]],
  }, {
    activeRfcs: ["0000-rfc-process.md", "a.md"],
    roadmap: "<!-- roadmap-capability: one -->\n<!-- roadmap-capability: two -->",
    uxFiles: ["ux-test.md"],
    uxIndex: "| NEW-a1 | x |",
    clientRoutes: new Set(["home"]),
    application: "function isApiPath(pathname: string): boolean { return false; } /healthz",
    rest: "",
    evidenceExists: () => true,
  });
  assert(result.errors.some((error) => error.includes("assigned more than once")));
  assert(result.errors.some((error) => error.includes("NEW-a1")));
  assert(result.errors.some((error) => error.includes("dependency cycle")));
});

test("rejects a missing or ungrounded milestone checkpoint", () => {
  const dimensions = Object.fromEntries([
    "evidence", "state", "api", "experience", "defaults", "content", "verification", "release",
  ].map((name) => [name, ["partial", `${name} condition`]]));
  const result = validateRegistry({
    schemaVersion: 2,
    workItemRegistry: "planning/work-items-1.0.json",
    definitionOfDone: Object.keys(dimensions),
    capabilities: [{ id: "one", owner: "a", release: "core", rfcs: ["a.md"], completion: dimensions }],
    executionPlan: { milestones: [{
      id: "first", wave: 0, state: "active", capabilities: ["one"], dependsOn: [], nextAction: "act", exit: "exit",
      latestCheckpoint: { at: "2026-02-30", summary: "claim", impact: "unknown", evidence: ["missing.md"] },
    }] },
    uxSources: { "ux-test.md": "one" },
    uxItemPrefixes: { ARR: "one" },
    uxItemSources: { ARR: "ux-test.md" },
    appRoutes: [["home", "one", "live"]],
    apiFamilies: [["/healthz", "one", "live_direct"]],
  }, {
    activeRfcs: ["0000-rfc-process.md", "a.md"],
    roadmap: "<!-- roadmap-capability: one -->",
    uxFiles: ["ux-test.md"],
    uxIndex: "| ARR-a1 | x |",
    clientRoutes: new Set(["home"]),
    application: "function isApiPath(pathname: string): boolean { return false; } /healthz",
    rest: "",
    evidenceExists: () => false,
  });
  assert(result.errors.some((error) => error.includes("real YYYY-MM-DD")));
  assert(result.errors.some((error) => error.includes("invalid latestCheckpoint impact")));
  assert(result.errors.some((error) => error.includes("checkpoint evidence does not exist")));
});
