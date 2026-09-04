import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { measureRetainedGraph } from "../d2625-candidate-packet-seventh-author-repair/model.mjs";

const model = readFileSync("tools/d2625-candidate-packet-seventh-author-repair/model.mjs", "utf8");
const authorTest = readFileSync("tools/d2625-candidate-packet-seventh-author-repair/contract.test.mjs", "utf8");

function fixture() {
  const move = Object.freeze({ uci: "e2e4" });
  const row = Object.freeze({
    moveUci: move.uci,
    events: Object.freeze([]),
    readings: Object.freeze([]),
    abstentions: Object.freeze([]),
  });
  return {
    packet: Object.freeze({ candidates: Object.freeze([row]), legalMoves: Object.freeze([move]) }),
    legalMovesInput: Object.freeze({ payload: Object.freeze({ moves: Object.freeze([move]) }) }),
    legalMoves: Object.freeze([move]),
    candidateInputs: [
      {
        row,
        events: Object.freeze([]),
        readings: Object.freeze([]),
        abstentions: Object.freeze([]),
        collectorOutcomes: Object.freeze([]),
        executionOutcomes: Object.freeze([]),
      },
    ],
  };
}

test("D2655 factory ownership is checked only against RFC prose, not an executable source graph", () => {
  assert.doesNotMatch(model, /createRulesMobilityReadingLegalMovesV1Evidence/u);
  assert.doesNotMatch(authorTest, /from\s+["'][^"']*(?:evidence-factories|legal-moves)/u);
  assert.match(authorTest, /assert\.match\(rfc,[\s\S]*exact registered factory/u);
});

test("D2656 scope equivalence does not execute plans, dependencies, rows, or the collector registry", () => {
  const scopeModel = model.slice(model.indexOf("export function compileScopeInvariant"));
  const scopeTest = authorTest.slice(authorTest.indexOf('test("D2626'), authorTest.indexOf("function fixture"));
  assert.match(scopeModel, /memo: Object\.freeze\(\{\}\)/u);
  assert.doesNotMatch(scopeModel, /planCandidateCollectors|CANDIDATE_COLLECTOR_EXECUTION|dependency|candidateInputs/u);
  assert.doesNotMatch(scopeTest, /hidden|topolog|collectorOutcomes|executionOutcomes/u);
});

test("D2657 complete-graph measurement omits retained candidate-input wrappers and their arrays", () => {
  const base = fixture();
  const baseline = measureRetainedGraph(base);
  const hidden = Object.freeze({ payload: "x".repeat(100_000) });
  const expandedInput = Object.freeze({ ...base.candidateInputs[0], privateRetainedReference: hidden });
  const expanded = { ...base, candidateInputs: Object.freeze([expandedInput]) };
  assert.deepEqual(measureRetainedGraph(expanded), baseline);
});

test("D2658 forbidden accessors, symbols, and non-enumerable values are silently ignored", () => {
  const base = fixture();
  const packet = { ...base.packet };
  Object.defineProperty(packet, "hiddenAccessor", { get: () => "x".repeat(100_000), enumerable: false });
  Object.defineProperty(packet, Symbol("hidden"), { value: Object.freeze({ payload: "y".repeat(100_000) }), enumerable: true });
  assert.doesNotThrow(() => measureRetainedGraph({ ...base, packet }));
  assert.deepEqual(measureRetainedGraph({ ...base, packet }), measureRetainedGraph(base));
});

test("D2659 the category set check is tautological and ignores a newly retained root", () => {
  const base = fixture();
  const baseline = measureRetainedGraph(base);
  const widened = { ...base, retainedProviderReceipt: Object.freeze({ payload: "z".repeat(100_000) }) };
  const measured = measureRetainedGraph(widened);
  assert.deepEqual(measured, baseline);
  assert.match(model, /Object\.keys\(counts\).*RETAINED_CATEGORIES/u);
});

test("D2660 retained-graph receipts are not connected to cache admission or either configured bound", () => {
  assert.doesNotMatch(model, /maxRetainedLogicalBytes|maxRetainedObjects|oversize_not_cached|evict/u);
  assert.match(authorTest, /assert\.match\(rfc, \/maxRetainedLogicalBytes/u);
  assert.equal((model.match(/measureRetainedGraph\(/gu) ?? []).length, 1);
});
