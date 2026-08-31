import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInitialWorkState,
  buildUxJoin,
  LEDGER_GLYPHS,
  setWorkState,
  synchronizeWorkState,
  validateWorkState,
} from "./work-state.mjs";

const roadmap = {
  capabilities: [
    { id: "support", owner: "assistance-and-presentation" },
    { id: "review", owner: "review-and-return" },
  ],
};

const ledger = [
  "| D1 🐞 | one owned live row | open |",
  "| D2 ✅ | landed at `tools/example.mjs` | closed |",
  "| D3 ⛔ | filed in error | refused |",
  "| D4 💡 | two owners disagree | open |",
  "| D5 📊 | no executable owner | measured |",
].join("\n");

const workItems = {
  items: [
    { id: "A-a1", state: "queued", owner: "assistance-and-presentation", summary: "Ships [[D1]] and informs [[D2]] and [[D4]]." },
    { id: "B-a1", state: "blocked_rfc", owner: "review-and-return", summary: "Also needs [[D4]]." },
    { id: "B-d1", state: "completed", owner: "review-and-return", summary: "Historical [[D5]]." },
  ],
};

test("bootstrap derives only facts the tree proves", () => {
  const registry = buildInitialWorkState({ ledger, roadmap, workItems });
  assert.deepEqual(registry.items.map(({ id, state, owner }) => ({ id, state, owner })), [
    { id: "D1", state: "todo", owner: "assistance-and-presentation" },
    { id: "D2", state: "done", owner: undefined },
    { id: "D3", state: "refused", owner: undefined },
    { id: "D4", state: "untriaged", owner: "unowned" },
    { id: "D5", state: "untriaged", owner: "unowned" },
  ]);
  assert.equal(registry.untriagedCeiling, 2);
  assert.equal(registry.items[1].evidenceKind, "path");
  assert.equal(registry.items[2].rulingKind, "source-row");
});

test("cross-store join preserves historical references without treating them as owners", () => {
  const join = buildUxJoin(workItems);
  assert.deepEqual(join.get("D2").map((item) => item.id), ["A-a1"]);
  const registry = buildInitialWorkState({ ledger, roadmap, workItems });
  const result = validateWorkState({ registry, ledger, roadmap, workItems, priorCeiling: 2 });
  assert.deepEqual(result.errors, []);
  assert.equal(result.census.liveUxToTerminal, 1);
  const forged = structuredClone(registry);
  forged.items.find((item) => item.id === "D1").uxItems = [];
  assert.match(validateWorkState({ registry: forged, ledger, roadmap, workItems }).errors.join("\n"), /W8 D1/u);
});

test("validator rejects malformed state, dead blockers, stale rows and a raised ratchet", () => {
  const registry = structuredClone(buildInitialWorkState({ ledger, roadmap, workItems }));
  const item = registry.items.find((candidate) => candidate.id === "D1");
  item.state = "blocked";
  item.owner = "review-and-return";
  item.blocker = "item:D2";
  registry.untriagedCeiling = 3;
  const changedLedger = ledger.replace("one owned live row", "changed row");
  const errors = validateWorkState({ registry, ledger: changedLedger, roadmap, workItems, priorCeiling: 2 }).errors.join("\n");
  assert.match(errors, /W5 D1: blocker item:D2 is not live/u);
  assert.match(errors, /W7 D1: stale sourceDigest/u);
  assert.match(errors, /W9 ceiling 3 exceeds HEAD ceiling 2/u);
});

test("sync adds rows as untriaged and set is the only state transition", () => {
  const registry = buildInitialWorkState({ ledger, roadmap, workItems });
  const nextLedger = `${ledger}\n| D6 ⚠️ | newly recorded | open |`;
  const synced = synchronizeWorkState({ registry, ledger: nextLedger, workItems });
  assert.equal(synced.items.find((item) => item.id === "D6").state, "untriaged");
  const set = setWorkState({
    registry: synced,
    ledger: nextLedger,
    workItems,
    id: "D6",
    state: "todo",
    values: { owner: "review-and-return" },
  });
  assert.equal(set.items.find((item) => item.id === "D6").state, "todo");
  assert.equal(set.untriagedCeiling, registry.untriagedCeiling - 1);
});

test("sync and batch assignment add multiple rows atomically without rebasing the ratchet", () => {
  const registry = buildInitialWorkState({ ledger, roadmap, workItems });
  const nextLedger = `${ledger}\n| D6 ⚠️ | first new row | open |\n| D7 🐞 | second new row | open |`;
  const synced = synchronizeWorkState({ registry, ledger: nextLedger, workItems });
  assert.match(validateWorkState({ registry: synced, ledger: nextLedger, roadmap, workItems, priorCeiling: registry.untriagedCeiling }).errors.join("\n"), /W9 untriaged 4 exceeds ceiling 2/u);
  const assigned = setWorkState({
    registry: synced,
    ledger: nextLedger,
    workItems,
    ids: ["D6", "D7"],
    state: "todo",
    values: { owner: "review-and-return" },
    ceilingEligibleIds: new Set(registry.items.map((item) => item.id)),
  });
  assert.equal(assigned.untriagedCeiling, registry.untriagedCeiling);
  assert.deepEqual(validateWorkState({ registry: assigned, ledger: nextLedger, roadmap, workItems, priorCeiling: registry.untriagedCeiling }).errors, []);
});

test("a persisted post-zero sync can be assigned without manufacturing a negative ceiling", () => {
  const baseline = buildInitialWorkState({ ledger, roadmap, workItems });
  const zero = {
    ...baseline,
    untriagedCeiling: 0,
    items: baseline.items.map((item) => item.state === "untriaged"
      ? { ...item, state: "todo", owner: "review-and-return" }
      : item),
  };
  const nextLedger = `${ledger}\n| D6 🐞 | first row after the zero ratchet | open |`;
  const synced = synchronizeWorkState({ registry: zero, ledger: nextLedger, workItems });
  assert.match(validateWorkState({ registry: synced, ledger: nextLedger, roadmap, workItems, priorCeiling: 0 }).errors.join("\n"), /W9 untriaged 1 exceeds ceiling 0/u);

  const assigned = setWorkState({
    registry: synced,
    ledger: nextLedger,
    workItems,
    ids: ["D6"],
    state: "todo",
    values: { owner: "review-and-return" },
    ceilingEligibleIds: new Set(synced.items.map((item) => item.id)),
  });
  assert.equal(assigned.untriagedCeiling, 0);
  assert.deepEqual(validateWorkState({ registry: assigned, ledger: nextLedger, roadmap, workItems, priorCeiling: 0 }).errors, []);
});

test("the production glyph vocabulary remains an explicit closed set", () => {
  assert.deepEqual(LEDGER_GLYPHS, ["🐞", "✅", "📊", "💡", "🛠", "⚖️", "🔬", "📝", "📜", "🔨", "⛔", "🏗", "⚠️"]);
});
