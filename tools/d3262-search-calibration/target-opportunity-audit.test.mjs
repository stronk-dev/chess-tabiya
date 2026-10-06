import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import test from "node:test";
import { actionSetChanged, loadInputs, validateInputs, summarize, outputName } from "./target-opportunity-audit.mjs";
import { observeTargetPathV2 } from "./dist/target-opportunity-v2.mjs";

test("all-stage receipt keeps every fixed population, stage and known baseline", () => {
  const output = JSON.parse(gunzipSync(readFileSync(`planning/semantic-consequence-search/${outputName}`)));
  const stats = summarize(output);
  assert.equal(stats.nodes, 339764); assert.equal(stats.baselineCells, 182);
  assert.equal(stats.baselineChanges, 0); assert.equal(stats.reintroduced, 58); assert.equal(stats.surviving, 8);
  assert.deepEqual(Object.keys(stats.scopes), ["complete_legal_baseline", "actual_model", "actual_engine_and_first_reply_reserve", "actual_recursive"]);
  assert.ok(Object.values(stats.scopes).every((s) => s.stages[0] > 0 && s.stages[1] > 0 && s.stages[2] > 0));
  assert.equal(stats.affected, 0);
  assert.equal(output.convention, "d3262-target-opportunity@2");
  assert.equal(output.population.offeredCandidates, 193);
  const v2 = observeTargetPathV2("4k3/8/8/8/3p4/8/4P3/4K3 w - - 0 1", ["e2e4"], { family: "material", target: {
    attacker: { color: "black", role: "pawn", square: "d4" }, target: { color: "white", role: "pawn", square: "e2" } } });
  assert.equal(actionSetChanged(null, v2.snapshots[0].availableActions), true, "the audit must detect a real old-oracle EP miss");
  assert.equal(actionSetChanged("d4e3", v2.snapshots[0].availableActions), false);
  assert.equal(actionSetChanged("b2a1q", ["b2a1b", "b2a1n", "b2a1q", "b2a1r"].map((uci) => ({ uci }))), true);
  assert.throws(() => actionSetChanged(true, []), /Untyped/);
});
test("actual input population, immutable source join and omitted legal decisions refuse", () => {
  const inputs = loadInputs(), [comparison, frame, baseline, proof, model, engine, recursive] = inputs.values;
  const edits = [
    [comparison, "comparisons", comparison.comparisons.slice(1)],
    [comparison, "definitions", comparison.definitions.slice(1)],
    [proof, "candidateGraph", proof.candidateGraph.slice(1)],
    [proof.candidateGraph[0], "preparations", proof.candidateGraph[0].preparations.slice(1)],
    [proof.candidateGraph[0].preparations[0], "legalDefences", proof.candidateGraph[0].preparations[0].legalDefences.slice(1)],
    [model, "controls", []],
    [baseline.inputDigests, "d3262-coherent-root-frame.json", "changed"],
    [recursive, "oracleSourceDigest", "changed"],
    [engine, "profile", "production_proof"],
  ];
  for (const [object, field, changed] of edits) {
    const prior = object[field]; object[field] = changed;
    try { assert.throws(() => validateInputs(inputs)); } finally { object[field] = prior; }
  }
});
