import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { summarizeCostArchives } from "./cost-summary.mjs";

test("default reconstruction preserves original complete-PV-setting synthesis bytes", () => {
  const value = summarizeCostArchives();
  assert.equal(`${JSON.stringify(value, null, 2)}\n`, readFileSync("planning/semantic-consequence-search/d3262-cost-live-pv-depth8-summary-2026-10-06.json", "utf8"));
  assert.equal(value.admittedRows, 1158); assert.equal(value.complete, false);
});
test("partial batch remains partial and stratifies unavailable instead of calling it success", () => {
  const value = summarizeCostArchives(["d3262-cost-live-pv-initial-2026-10-06.json.gz"]);
  assert.equal(value.admittedRows, 6); assert.equal(value.retainedCandidates, 1);
  assert.equal(value.expectedCases, 61374); assert.equal(value.productionProfileSelected, false);
  assert.deepEqual([...new Set(value.rows.map(x => x.result))].sort(), ["available", "source_unavailable"]);
});
for (const [label, names] of [["empty", []], ["duplicate", ["d3262-cost-live-pv-initial-2026-10-06.json.gz", "d3262-cost-live-pv-initial-2026-10-06.json.gz"]],
  ["traversal", ["../d3262-cost-live-pv-initial-2026-10-06.json.gz"]], ["foreign", ["other.json.gz"]]])
  test(`summary refuses ${label} capture list`, () => assert.throws(() => summarizeCostArchives(names)));
