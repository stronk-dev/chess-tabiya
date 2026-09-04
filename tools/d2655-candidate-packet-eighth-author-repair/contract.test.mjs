import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CANDIDATE_COLLECTOR_EXECUTION,
  CandidateReceiptCache,
  RETAINED_CATEGORIES,
  createCandidateCompilerForAuthor,
  measureRetainedGraph,
  planCandidateCollectors,
  projectWide,
} from "./model.mjs";

const modelSource = readFileSync("tools/d2655-candidate-packet-eighth-author-repair/model.mjs", "utf8");
const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");

function fixtureFactory() {
  const moves = Object.freeze([
    Object.freeze({ uci: "e2e4", from: "e2", to: "e4", role: "pawn" }),
    Object.freeze({ uci: "g1f3", from: "g1", to: "f3", role: "knight" }),
  ]);
  const map = Object.freeze({
    fen: "fixture",
    turn: "white",
    pieces: Object.freeze([
      Object.freeze({ piece: Object.freeze({ square: "e2", role: "pawn", color: "white" }), moves: Object.freeze([moves[0]]) }),
      Object.freeze({ piece: Object.freeze({ square: "g1", role: "knight", color: "white" }), moves: Object.freeze([moves[1]]) }),
    ]),
  });
  let authorityCalls = 0;
  const exactLegalMoveMap = (fen) => {
    authorityCalls += 1;
    assert.equal(fen, "fixture");
    return map;
  };
  return { exactLegalMoveMap, map, moves, calls: () => authorityCalls };
}

function compile(scope = "events_and_readings") {
  const source = fixtureFactory();
  const compiler = createCandidateCompilerForAuthor(source.exactLegalMoveMap);
  const compiled = compiler.compile(
    Object.freeze({ beforeFen: "fixture", ruleset: "standard", scope }),
  );
  return { ...source, compiled };
}

function canonicalRetained(compiled) {
  return compiled.references.candidateInputs.map((input) => ({
    moveUci: input.row.moveUci,
    events: input.events,
    readings: input.readings,
    abstentions: input.abstentions,
    outcomes: input.collectorOutcomes.map((outcome) => ({
      collectorId: outcome.collectorId,
      projection: outcome.projection,
      result: outcome.result,
    })),
  }));
}

test("D2655 executes the predecessor legal-evidence source graph once and retains its exact values", () => {
  const { compiled, map, moves, calls } = compile("events");
  assert.equal(calls(), 1);
  assert.strictEqual(compiled.references.legalMovesInput.payload, map);
  assert.strictEqual(compiled.packet.legalMoves[0], moves[0]);
  assert.strictEqual(compiled.packet.legalMoves[1], moves[1]);
  assert.match(modelSource, /from "\.\.\/d2428-candidate-packet-sixth-author-repair\/model\.mjs"/u);
  assert.doesNotMatch(modelSource, /function compileLegalPopulation\s*\(/u);
  assert.doesNotMatch(modelSource, /export function compileCandidateOperation/u);
});

test("D2656 executes all three dependency-closed plans with exact memo and retention boundaries", () => {
  const expected = { events: 10, readings: 5, events_and_readings: 13 };
  for (const [scope, count] of Object.entries(expected)) {
    const plan = planCandidateCollectors(scope);
    assert.equal(plan.collectors.length, count);
    const { compiled } = compile(scope);
    assert.equal(compiled.observation.length, count * 2);
    for (const observed of compiled.observation) {
      assert.deepEqual(observed.memoKeys, CANDIDATE_COLLECTOR_EXECUTION[observed.collectorId].dependencies);
    }
  }

  const { compiled: readings } = compile("readings");
  for (const input of readings.references.candidateInputs) {
    assert.equal(input.events.length, 0);
    assert.equal(input.readings.length, 3);
    assert.equal(input.collectorOutcomes.length, 3);
    assert.equal(input.executionOutcomes.length, 5);
    assert.deepEqual(
      input.executionOutcomes.filter((outcome) => !input.collectorOutcomes.includes(outcome)).map((outcome) => outcome.collectorId),
      ["event.transition", "event.tactical"],
    );
  }
});

test("D2656 direct narrow and projected wide paths preserve exact outcome tuples and references", () => {
  const { compiled: wide } = compile("events_and_readings");
  for (const scope of ["events", "readings"]) {
    const { compiled: direct } = compile(scope);
    const projected = projectWide(wide, scope);
    assert.deepEqual(canonicalRetained(direct), canonicalRetained(projected));
    for (let row = 0; row < projected.references.candidateInputs.length; row += 1) {
      const projectedInput = projected.references.candidateInputs[row];
      const wideInput = wide.references.candidateInputs[row];
      assert.strictEqual(projectedInput[scope], wideInput[scope]);
      for (const outcome of projectedInput.collectorOutcomes) assert.ok(wideInput.collectorOutcomes.includes(outcome));
      assert.strictEqual(projectedInput.executionOutcomes, wideInput.executionOutcomes);
    }
  }
});

test("D2657 measurement starts at the exact private aggregate and includes wrapper and array containers", () => {
  const { compiled } = compile("readings");
  const baseline = measureRetainedGraph(compiled.references);
  const original = compiled.references.candidateInputs[0];
  const enlarged = Object.freeze({ ...original, retainedProbe: Object.freeze({ data: "x".repeat(100_000) }) });
  const references = Object.freeze({
    ...compiled.references,
    candidateInputs: Object.freeze([enlarged, ...compiled.references.candidateInputs.slice(1)]),
  });
  const measured = measureRetainedGraph(references);
  assert.ok(measured.logicalUtf8Bytes > baseline.logicalUtf8Bytes + 99_000);
  assert.ok(measured.uniqueObjects > baseline.uniqueObjects);
  assert.deepEqual(Object.keys(measured.categoryCounts).sort(), [...RETAINED_CATEGORIES].sort());
});

test("D2658 graph measurement rejects hidden, symbolic, accessor and unsupported values", () => {
  const { compiled } = compile("events");
  const base = compiled.references.candidateInputs[0];
  const crossed = (mutate) => {
    const wrapper = { ...base };
    mutate(wrapper);
    Object.freeze(wrapper);
    return Object.freeze({
      ...compiled.references,
      candidateInputs: Object.freeze([wrapper, ...compiled.references.candidateInputs.slice(1)]),
    });
  };
  assert.throws(() => measureRetainedGraph(crossed((value) => Object.defineProperty(value, "hidden", { value: "x", enumerable: false }))), /NON_ENUMERABLE/u);
  assert.throws(() => measureRetainedGraph(crossed((value) => { value[Symbol("hidden")] = "x"; })), /SYMBOL/u);
  assert.throws(() => measureRetainedGraph(crossed((value) => Object.defineProperty(value, "getter", { get: () => "x", enumerable: true }))), /ACCESSOR/u);
  assert.throws(() => measureRetainedGraph(crossed((value) => { value.bad = () => 1; })), /UNSUPPORTED_RETAINED_VALUE:function/u);
  assert.throws(() => measureRetainedGraph(crossed((value) => { value.bad = 1n; })), /UNSUPPORTED_RETAINED_VALUE:bigint/u);
  assert.throws(() => measureRetainedGraph(crossed((value) => { value.bad = Number.NaN; })), /UNSUPPORTED_RETAINED_VALUE:number/u);
});

test("D2659 one descriptor closes retained roots and categories", () => {
  const { compiled } = compile("events");
  assert.throws(
    () => measureRetainedGraph(Object.freeze({ ...compiled.references, newRetainedRoot: Object.freeze({ payload: true }) })),
    /RETAINED_ROOT_SET_MISMATCH/u,
  );
  const measure = measureRetainedGraph(compiled.references);
  assert.ok(RETAINED_CATEGORIES.every((category) => Number.isSafeInteger(measure.categoryCounts[category])));
  assert.match(rfc, /one retained-root descriptor/u);
});

test("D2660 cache admission consumes the receipt and enforces entry, byte and object bounds independently", () => {
  const one = compile("events").compiled;
  const twoSource = fixtureFactory();
  const two = createCandidateCompilerForAuthor(twoSource.exactLegalMoveMap).compile(
    Object.freeze({ beforeFen: "fixture", ruleset: "standard", scope: "readings" }),
  );
  const measure = measureRetainedGraph(one.references);
  const secondMeasure = measureRetainedGraph(two.references);

  const entryCache = new CandidateReceiptCache({
    maxEntries: 1,
    maxRetainedLogicalBytes: Number.MAX_SAFE_INTEGER,
    maxRetainedObjects: Number.MAX_SAFE_INTEGER,
  });
  assert.equal(entryCache.admit("one", one).cache, "miss");
  assert.equal(entryCache.admit("two", two).cache, "miss");
  assert.equal(entryCache.get("one"), undefined);
  assert.strictEqual(entryCache.get("two"), two);
  assert.equal(entryCache.stats().evictions, 1);

  const byteEvictionCache = new CandidateReceiptCache({
    maxEntries: 8,
    maxRetainedLogicalBytes: Math.max(measure.logicalUtf8Bytes, secondMeasure.logicalUtf8Bytes),
    maxRetainedObjects: Number.MAX_SAFE_INTEGER,
  });
  assert.equal(byteEvictionCache.admit("one", one).cache, "miss");
  assert.equal(byteEvictionCache.admit("two", two).cache, "miss");
  assert.equal(byteEvictionCache.get("one"), undefined);
  assert.strictEqual(byteEvictionCache.get("two"), two);
  assert.equal(byteEvictionCache.stats().evictions, 1);

  const objectEvictionCache = new CandidateReceiptCache({
    maxEntries: 8,
    maxRetainedLogicalBytes: Number.MAX_SAFE_INTEGER,
    maxRetainedObjects: Math.max(measure.uniqueObjects, secondMeasure.uniqueObjects),
  });
  assert.equal(objectEvictionCache.admit("one", one).cache, "miss");
  assert.equal(objectEvictionCache.admit("two", two).cache, "miss");
  assert.equal(objectEvictionCache.get("one"), undefined);
  assert.strictEqual(objectEvictionCache.get("two"), two);
  assert.equal(objectEvictionCache.stats().evictions, 1);

  for (const limits of [
    { maxEntries: 8, maxRetainedLogicalBytes: measure.logicalUtf8Bytes - 1, maxRetainedObjects: Number.MAX_SAFE_INTEGER },
    { maxEntries: 8, maxRetainedLogicalBytes: Number.MAX_SAFE_INTEGER, maxRetainedObjects: measure.uniqueObjects - 1 },
  ]) {
    const oversizeCache = new CandidateReceiptCache(limits);
    assert.equal(oversizeCache.admit("one", one).cache, "oversize_not_cached");
    assert.equal(oversizeCache.stats().entries, 0);
    assert.equal(oversizeCache.stats().oversizeNotCached, 1);
  }
});
