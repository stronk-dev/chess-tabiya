import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

import { compileCoherentFrontierContrast } from "./coherent-frontier-contrast.mjs";

const directory = "planning/semantic-consequence-search";
const read = (name) => JSON.parse(readFileSync(`${directory}/${name}.json`, "utf8"));
const contrast = read("d3262-coherent-bounded-contrast");
const frontier = read("d3262-coherent-frontier-target-outcome");

test("the same-target join keeps unknown negatives out of certified contrasts", () => {
  const result = compileCoherentFrontierContrast(contrast, frontier);
  assert.equal(result.rows.length, 116);
  assert.equal(result.unpairedTargetCount, 17);
  assert.equal(result.armNames.length, 29);
  assert.equal(result.rows.filter((row) => row.exact !== "same").length, 13);
  for (const row of result.rows) for (const arm of row.arms) {
    assert.equal(arm.certified === null, arm.abstains);
    if (arm.certified !== null) assert.equal(arm.certified, row.exact);
    if (arm.sourceStatus === "unknown_unvisited_replies"
      || arm.alternativeStatus === "unknown_unvisited_replies") assert.equal(arm.certified, null);
  }
});

test("crossed target, forged partial proof and missing arm fail closed", () => {
  const crossed = structuredClone(contrast);
  crossed.rows[0].source.immediate = "preserved";
  assert.throws(() => compileCoherentFrontierContrast(crossed, frontier), /Crossed exact same-target pair/);
  const stronger = structuredClone(frontier);
  const cell = stronger.rows.find((row) => row.exact.immediate === "removed"
    && !row.exact.reintroducedWithin3Ply);
  assert.ok(cell);
  cell.arms[0].result.reintroducedWithin3Ply = true;
  assert.throws(() => compileCoherentFrontierContrast(contrast, stronger), /Selected arm exceeds exact authority/);
  const falseCeiling = structuredClone(frontier);
  falseCeiling.rows[0].arms[0].proofCeiling = "complete_exact_reply_set";
  assert.throws(() => compileCoherentFrontierContrast(contrast, falseCeiling), /Selected arm exceeds exact authority/);
  const missing = structuredClone(frontier);
  missing.rows[0].arms.pop();
  assert.throws(() => compileCoherentFrontierContrast(contrast, missing), /29-arm profile/);
});
