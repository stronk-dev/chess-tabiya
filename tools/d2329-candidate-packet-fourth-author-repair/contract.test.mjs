// DISPOSABLE positive author contract for D2329-D2330. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return rfc.slice(from, to);
}

const registry = Object.freeze({
  "event.structural": Object.freeze({ scope: "events", dependencies: Object.freeze([]) }),
  "event.pawn_island": Object.freeze({ scope: "events", dependencies: Object.freeze([]) }),
  "event.transition": Object.freeze({ scope: "events", dependencies: Object.freeze([]) }),
  "event.tactical": Object.freeze({ scope: "events", dependencies: Object.freeze([]) }),
  "event.loose_piece": Object.freeze({ scope: "events", dependencies: Object.freeze([]) }),
  "event.castling": Object.freeze({ scope: "events", dependencies: Object.freeze([]) }),
  "event.exchange": Object.freeze({ scope: "events", dependencies: Object.freeze(["event.transition"]) }),
  "event.discovered": Object.freeze({ scope: "events", dependencies: Object.freeze(["event.transition"]) }),
  "event.breadth": Object.freeze({ scope: "events", dependencies: Object.freeze(["event.transition"]) }),
  "event.duty": Object.freeze({ scope: "events", dependencies: Object.freeze(["event.transition"]) }),
  "reading.child": Object.freeze({ scope: "readings", dependencies: Object.freeze([]) }),
  "reading.legal_exchange": Object.freeze({ scope: "readings", dependencies: Object.freeze(["event.transition"]) }),
  "reading.fork_survival": Object.freeze({ scope: "readings", dependencies: Object.freeze(["event.tactical", "reading.legal_exchange"]) }),
});

function plan(scope, source = registry) {
  const requestedScope = scope.events && scope.readings ? null : scope.events ? "events" : "readings";
  const requested = Object.keys(source).filter((id) => requestedScope === null || source[id].scope === requestedScope);
  const closure = new Set();
  const active = new Set();
  const visit = (id) => {
    assert.ok(source[id], `unknown dependency ${id}`);
    assert.ok(!active.has(id), `cycle at ${id}`);
    if (closure.has(id)) return;
    active.add(id);
    for (const dependency of source[id].dependencies) visit(dependency);
    active.delete(id);
    closure.add(id);
  };
  for (const id of requested) visit(id);
  return [...closure].map((collectorId) => Object.freeze({ collectorId, retain: requested.includes(collectorId) }));
}

test("D2329 uses one generated literal versioned-key authority", () => {
  const types = section("CANDIDATE_COLLECTOR_PROJECTION_KEYS,", "export interface SealedCandidateCollectorOutcome");
  const registryText = section("export const CANDIDATE_COLLECTOR_EXECUTION", "export type CandidateCollectorId");
  assert.match(types, /CandidateCollectorProjection = \{[\s\S]*CANDIDATE_COLLECTOR_PROJECTION_KEYS/u);
  assert.doesNotMatch(types, /LOCAL_CANDIDATE_(?:EVENT|READING)_PROJECTION_IDS/u);
  assert.equal((registryText.match(/outputs: CANDIDATE_COLLECTOR_PROJECTION_KEYS\[/gu) ?? []).length, 13);
  assert.doesNotMatch(registryText, /outputs: \["/u);
  assert.match(rfc, /sole assertion from broad `VersionedEvidenceId` to\s+`CandidateCollectorProjection`/u);
  assert.match(rfc, /generator rejects a missing id, wrong version, duplicate key, extra key or non-literal/u);
});

test("D2330 derives exact dependency-closed execution separately from retention", () => {
  const events = plan({ events: true, readings: false });
  const readings = plan({ events: false, readings: true });
  const wide = plan({ events: true, readings: true });

  assert.equal(events.length, 10);
  assert.ok(events.every((row) => row.retain));
  assert.deepEqual(readings.map((row) => row.collectorId), [
    "reading.child",
    "event.transition",
    "reading.legal_exchange",
    "event.tactical",
    "reading.fork_survival",
  ]);
  assert.deepEqual(readings.filter((row) => !row.retain).map((row) => row.collectorId), [
    "event.transition",
    "event.tactical",
  ]);
  assert.equal(wide.length, 13);
  assert.ok(wide.every((row) => row.retain));

  const broken = { ...registry, "reading.legal_exchange": { scope: "readings", dependencies: ["event.missing"] } };
  assert.throws(() => plan({ events: false, readings: true }, broken), /unknown dependency/u);
  assert.match(rfc, /not\s+copied into `row\.events`, `row\.readings`, public abstentions or the retained-outcome array/u);
  const refs = section("interface CandidatePopulationReceiptReferences", "const CANDIDATE_POPULATION_RECEIPTS");
  assert.match(refs, /readonly collectorOutcomes:/u);
  assert.match(refs, /readonly executionOutcomes:/u);
});
