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

test("the production glyph vocabulary remains an explicit closed set", () => {
  assert.deepEqual(LEDGER_GLYPHS, ["🐞", "✅", "📊", "💡", "🛠", "⚖️", "🔬", "📝", "📜", "🔨", "⛔", "🏗", "⚠️"]);
});
