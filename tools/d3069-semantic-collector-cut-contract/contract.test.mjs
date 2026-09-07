import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const rfc = read("rfc/semantic-collectors.md");
const makefile = read("Makefile");
const ledger = read("design/BACKLOG.md");
const state = JSON.parse(read("planning/work-state.json"));

const retired = [
  "D2141", "D2181", "D2183", "D2469", "D2470", "D2471", "D2472", "D2603",
  "D2604", "D2605", "D2606", "D2607", "D2650", "D2651", "D2652", "D2653",
  "D2654", "D2693", "D2694", "D2695", "D2696", "D2697", "D2698", "D2699",
  "D2700", "D2748", "D2749", "D2750", "D2751", "D2752", "D2765", "D2766",
  "D2767", "D2768", "D2769", "D2770", "D2789", "D2790", "D2791", "D2792",
  "D2793", "D2794", "D2835", "D2836", "D2837", "D2838", "D2839", "D2892",
  "D2893", "D2894", "D2895", "D2896", "D2929", "D2930", "D2931", "D2932",
  "D2933", "D3018", "D3019", "D3020", "D3021", "D3022", "D3023", "D3024",
];

test("the maintained RFC owns exactly the twelve compiled Wave-C projections", () => {
  assert.match(rfc, /Status:\*\* awaiting D1\/D4 2026-09-07 — all \*\*12 projections owned by this RFC\*\* compile/u);
  const appendix = rfc.slice(rfc.indexOf("## Appendix A"), rfc.indexOf("## Changelog"));
  assert.match(appendix, /total: \*\*12\*\*/u);
  assert.equal((appendix.match(/^\| \d+ \|/gmu) ?? []).length, 12);
  assert.doesNotMatch(appendix, /promotion_race_/u);
});
test("promotion remains a named successor obligation rather than a seventeenth local model", () => {
  assert.match(rfc, /C16 — WITHDRAWN to \[\[D1699\]\]\/\[\[D1700\]\]/u);
  assert.match(rfc, /C18 — WITHDRAWN to \[\[D1699\]\]\/\[\[D1700\]\]/u);
  for (const id of ["D1699", "D1700"]) {
    assert.match(ledger, new RegExp(`^\\| ${id} 🐞`, "mu"));
    const item = state.items.find((candidate) => candidate.id === id);
    assert.equal(item?.state, "blocked");
    assert.equal(item?.blocker, "rfc:provider-exchange-and-execution.md");
  }
});

test("canonical governance follows the cut and retains historical targets only on demand", () => {
  const verifyLine = makefile.split("\n").find((line) => line.startsWith("verify-governance:"));
  assert.ok(verifyLine);
  assert.match(verifyLine, /semantic-collector-cut-contract/u);
  assert.doesNotMatch(verifyLine, /semantic-collectors-promotion/u);
  assert.match(makefile, /^semantic-collectors-promotion-sixteenth-fresh-review:/mu);
});

test("all sixty-four shadow-model rows are explicitly terminal", () => {
  assert.equal(retired.length, 64);
  for (const id of retired) {
    assert.match(ledger, new RegExp(`^\\| ${id} ⛔`, "mu"), id);
    const item = state.items.find((candidate) => candidate.id === id);
    assert.equal(item?.state, "refused", id);
    assert.equal(item?.rulingKind, "source-row", id);
  }
});
