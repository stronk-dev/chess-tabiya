import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const summary = JSON.parse(fs.readFileSync(new URL("./out/selection-summary.json", import.meta.url)));

test("D490 retains the exact 40-root historical population", () => {
  assert.equal(summary.wide.length, 40);
  assert.equal(new Set(summary.wide.map((row) => row.fen)).size, 40);
});

test("the historical control separates the confound from named refusals", () => {
  const rows = summary.wide;
  assert.equal(rows.filter((row) => row.outcome === "selection").length, 5);
  assert.equal(rows.filter((row) => row.refusalCode === "PRACTICAL_RESISTANCE_UNDECIDABLE").length, 5);
  assert.equal(rows.filter((row) => String(row.message).startsWith("measured policy mass cannot exceed 1")).length, 30);
});
