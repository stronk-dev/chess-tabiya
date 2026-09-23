import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileMaiaDirectMassFrontier } from "./maia-direct-mass-frontier.mjs";

const names = ["d3262-target-comparison-frame.json", "d3262-material-immediate.json", "d3262-destination-reply-witness.json", "d3262-maia-direct-logits.json"];
const inputs = names.map((name) => JSON.parse(readFileSync(`planning/semantic-consequence-search/${name}`, "utf8")));
const artifact = JSON.parse(readFileSync("planning/semantic-consequence-search/d3262-maia-direct-mass-frontier.json", "utf8"));

test("direct configured mass covers every selected child and named target comparison", () => {
  assert.deepEqual({ ...compileMaiaDirectMassFrontier(...inputs), inputDigests: artifact.inputDigests }, artifact);
  assert.equal(artifact.rows.length, 196);
  assert.equal(artifact.named.length, 185);
  assert.equal(artifact.named.filter((row) => row.status === "configured_positive").length, 52);
  assert.equal(artifact.named.filter((row) => row.status === "configured_zero_after_top_p").length, 87);
  assert.equal(artifact.named.filter((row) => row.status === "no_named_reply").length, 46);
  for (const row of artifact.rows) assert.ok(Math.abs(row.configuredSupport.reduce((sum, item) => sum + item.mass, 0) - 1) < 0.000_002);
});

test("a named legal reply receives its actual mass, including zero after top-p", () => {
  const source = new Set(inputs[2].rows.filter((row) => row.status === "named_pawn_punishment_witness").map((row) => `${row.rootId}|${row.targetId}|${row.candidateUci}`));
  const rows = artifact.named.filter((row) => source.has(`${row.rootId}|${row.targetId}|${row.candidateUci}`));
  assert.equal(rows.length, 32);
  assert.equal(rows.filter((row) => row.status === "configured_positive").length, 1);
  assert.equal(rows.filter((row) => row.status === "configured_zero_after_top_p").length, 31);
  assert.ok(rows.every((row) => row.rawModelMass > 0));
});

test("crossed target reply and false source authority are refused", () => {
  const material = structuredClone(inputs[1]);
  material.rows.find((row) => row.positiveCaptureUci !== null).positiveCaptureUci = "a1a1";
  assert.throws(() => compileMaiaDirectMassFrontier(inputs[0], material, inputs[2], inputs[3]), /Named reply not legal/u);
  const direct = structuredClone(inputs[3]);
  direct.source.configuredMeaning = "raw_top_window_softmax";
  assert.throws(() => compileMaiaDirectMassFrontier(...inputs.slice(0, 3), direct), /Crossed direct Maia source/u);
});
