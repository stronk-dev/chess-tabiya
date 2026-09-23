import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileCoherentEventReach } from "./coherent-event-reach-evaluation.mjs";

const dir = "planning/semantic-consequence-search";
const load = (name) => JSON.parse(readFileSync(`${dir}/${name}`, "utf8"));
const reserve = load("d3262-coherent-semantic-reserve.json");
const events = load("d3262-coherent-relation-event-first-layer.json");
const immediate = load("d3262-coherent-immediate-and-witness.json");
const artifact = load("d3262-coherent-event-reach-evaluation.json");

test("held-out named witness join is exact, with null for no positive witness", () => {
  const actual = compileCoherentEventReach(reserve, events, immediate);
  assert.deepEqual({ ...actual, inputDigests: artifact.inputDigests }, artifact);
  assert.equal(actual.rows.length, 3276);
  const expectedTopReach = { depth8: 39, depth12: 43, movetime100: 41 };
  for (const budget of actual.budgets) {
    for (const width of actual.widths) {
      const all = actual.rows.filter((row) => row.budget === budget && row.width === width && row.eventSourceWidth === "all_legal");
      assert.equal(all.length, 182);
      assert.equal(all.filter((row) => row.positiveUci !== null).length, 84);
      assert.equal(all.filter((row) => row.selectedReach).length, 84);
      assert.equal(all.filter((row) => row.reservedEventWithoutPositiveWitness).length, 68);
      assert.equal(all.filter((row) => row.baselineReach && !row.selectedReach).length, 0);
      const top = actual.rows.filter((row) => row.budget === budget && row.width === width && row.eventSourceWidth === "top8");
      assert.equal(top.filter((row) => row.selectedReach).length, expectedTopReach[budget]);
      assert.equal(top.filter((row) => row.reservedEventWithoutPositiveWitness).length, 23);
      assert.equal(top.filter((row) => row.baselineReach && !row.selectedReach).length, 0);
    }
  }
  assert.match(actual.authority, /not_target_persistence_proof_or_engine_cause/u);
});

test("a merely legal event with a safe minor arrival is not a positive pawn-denial witness", () => {
  const safe = artifact.rows.filter((row) => row.witnessClass === "locally_safe_arrival_witness"
    && row.eventSourceWidth === "all_legal" && row.budget === "depth8" && row.width === 2);
  assert.equal(safe.length, 55);
  assert.ok(safe.every((row) => row.positiveUci === null && row.selectedReach === null
    && row.reservedEventWithoutPositiveWitness));
});

test("crossed witness, invented event, missing row and duplicate branch fail closed", () => {
  const crossed = structuredClone(immediate);
  crossed.manifest = "sha256:wrong";
  assert.throws(() => compileCoherentEventReach(reserve, events, crossed), /Crossed held-out reach authorities/u);
  const invented = structuredClone(reserve);
  invented.rows[0].reservedUci = "a1a8";
  assert.throws(() => compileCoherentEventReach(invented, events, immediate), /not a declared event/u);
  const missing = structuredClone(events);
  missing.rows.pop();
  assert.throws(() => compileCoherentEventReach(reserve, missing, immediate), /denominator changed/u);
  const duplicate = structuredClone(reserve);
  duplicate.rows[1] = structuredClone(duplicate.rows[0]);
  assert.throws(() => compileCoherentEventReach(duplicate, events, immediate), /Duplicate or undeclared reserve branch/u);
  const falsePositive = structuredClone(immediate);
  falsePositive.material.rows.find((row) => row.positiveCaptureUci !== null).positiveCaptureUci = "a1a8";
  assert.throws(() => compileCoherentEventReach(reserve, events, falsePositive), /Positive witness is not a declared event/u);
});
