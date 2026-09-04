import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  RETAINED_CATEGORIES,
  compileScopeInvariant,
  measureRetainedGraph,
  projectNarrow,
} from "./model.mjs";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");

test("D2625 consumes the predecessor factory without reclaiming its deleted adapter", () => {
  assert.match(rfc, /evidence-factories\.ts` is a \*\*read-only dependency\*\*/u);
  assert.doesNotMatch(rfc, /\| 1b \| `packages\/runtime\/src\/evidence-source-adapters\.ts`/u);
  assert.match(rfc, /implementation changed-file set excludes predecessor-owned `evidence-factories\.ts`/u);
  assert.match(rfc, /contains no recreated `evidence-source-adapters\.ts`/u);
  assert.match(rfc, /exact registered factory/u);
});

test("D2626 collector truth has no request-scope input and projections retain it", () => {
  assert.doesNotMatch(
    rfc,
    /export interface CandidateCollectorContext[\s\S]{0,240}readonly scope: CandidatePacketScope;/u,
  );
  const collector = (context) => {
    assert.deepEqual(Object.keys(context).sort(), ["afterFen", "beforeFen", "memo", "moveUci"]);
    return [Object.freeze({ projection: "event.fixture@1", basis: context.afterFen })];
  };
  const direct = compileScopeInvariant(collector, "events");
  const wide = compileScopeInvariant(collector, "events_and_readings");
  const projected = projectNarrow(wide, "events");
  assert.deepEqual(direct.values, projected.values);
  assert.strictEqual(projected.values, wide.values);
  assert.match(rfc, /Request order may change\s+cache hits, never factual bytes/u);
});

function fixture({ hiddenCount = 0, cloneShared = false } = {}) {
  const shared = Object.freeze({ projection: "event.transition@1", payload: Object.freeze({ x: 1 }) });
  const retained = cloneShared ? Object.freeze({ ...shared }) : shared;
  const executionOutcomes = Object.freeze(Array.from(
    { length: hiddenCount },
    (_, index) => Object.freeze({ projection: `hidden.${index}@1`, result: Object.freeze({ index }) }),
  ));
  const move = Object.freeze({ uci: "e2e4" });
  const row = Object.freeze({
    moveUci: move.uci,
    events: Object.freeze([]),
    readings: Object.freeze([]),
    abstentions: Object.freeze([]),
  });
  return Object.freeze({
    packet: Object.freeze({ candidates: Object.freeze([row]), legalMoves: Object.freeze([move]) }),
    legalMovesInput: Object.freeze({ payload: Object.freeze({ moves: Object.freeze([move]) }) }),
    legalMoves: Object.freeze([move]),
    candidateInputs: Object.freeze([Object.freeze({
      row,
      events: Object.freeze([]),
      readings: Object.freeze([]),
      abstentions: Object.freeze([]),
      collectorOutcomes: Object.freeze([retained]),
      executionOutcomes: Object.freeze([shared, ...executionOutcomes]),
    })]),
  });
}

test("D2627 quiet and hidden-dependency graphs have complete nonzero measures", () => {
  const quiet = measureRetainedGraph(fixture());
  const hidden = measureRetainedGraph(fixture({ hiddenCount: 100 }));
  assert.ok(quiet.logicalUtf8Bytes > 0);
  assert.ok(quiet.uniqueObjects > 0);
  assert.ok(hidden.logicalUtf8Bytes > quiet.logicalUtf8Bytes);
  assert.ok(hidden.uniqueObjects > quiet.uniqueObjects);
  assert.deepEqual(Object.keys(hidden.categoryCounts).sort(), [...RETAINED_CATEGORIES].sort());
  assert.equal(hidden.categoryCounts.execution_collector_outcome, 101);
});

test("D2627 shared identity deduplicates but an equal clone increases retained objects", () => {
  const shared = measureRetainedGraph(fixture());
  const cloned = measureRetainedGraph(fixture({ cloneShared: true }));
  assert.ok(cloned.uniqueObjects > shared.uniqueObjects);
  assert.ok(cloned.logicalUtf8Bytes > shared.logicalUtf8Bytes);
  assert.match(rfc, /maxRetainedLogicalBytes/u);
  assert.match(rfc, /maxRetainedObjects/u);
  assert.doesNotMatch(rfc, /readonly maxRetainedWeight:/u);
  assert.match(rfc, /No public-packet serialization or visible event\/reading coefficient/u);
});
