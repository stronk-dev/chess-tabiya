// DISPOSABLE fresh independent review for D2329-D2330. This is a review
// falsifier, not production code: it stays green while the returned seams exist.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/shared-candidate-evidence-packet.md", "utf8");
const catalogue = readFileSync("packages/runtime/src/evidence-catalog.ts", "utf8");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return rfc.slice(from, to);
}

test("D2329: the claimed literal projection union widens and mixes identity dialects", () => {
  const types = section("export type CandidateCollectorProjection", "export interface SealedCandidateCollectorOutcome");
  const registry = section("export const CANDIDATE_COLLECTOR_EXECUTION", "export type CandidateCollectorId");

  assert.match(catalogue, /STRUCTURAL_EVENT_PROJECTION_IDS\s*=\s*Object\.freeze\([^\n]*\.map\(/u);
  assert.match(types, /\(typeof LOCAL_CANDIDATE_EVENT_PROJECTION_IDS\)\[number\]/u);
  assert.match(registry, /outputs: STRUCTURAL_EVENT_PROJECTION_IDS/u);
  assert.match(registry, /outputs: \["rules\.exchange\.predicate\.legal_exchange@1"\]/u);
  assert.match(rfc, /value's own\s+`projection\.id@version` equals its result projection/u);
});

test("D2330: readings-only removes event dependencies required by reading collectors", () => {
  const registry = section("export const CANDIDATE_COLLECTOR_EXECUTION", "export type CandidateCollectorId");
  assert.match(rfc, /Scope\s+filters whole declarations before grouping/iu);
  assert.match(registry, /"reading\.legal_exchange"[^\n]*scope: "readings"[^\n]*dependencies: \["event\.transition"\]/u);
  assert.match(registry, /"reading\.fork_survival"[^\n]*scope: "readings"[^\n]*dependencies: \["event\.tactical", "reading\.legal_exchange"\]/u);

  const rows = [
    { id: "event.transition", scope: "events", dependencies: [] },
    { id: "event.tactical", scope: "events", dependencies: [] },
    { id: "reading.legal_exchange", scope: "readings", dependencies: ["event.transition"] },
    { id: "reading.fork_survival", scope: "readings", dependencies: ["event.tactical", "reading.legal_exchange"] },
  ];
  const admitted = rows.filter((row) => row.scope === "readings");
  const admittedIds = new Set(admitted.map((row) => row.id));
  const missing = admitted.flatMap((row) => row.dependencies.filter((dependency) => !admittedIds.has(dependency)));
  assert.deepEqual(missing, ["event.transition", "event.tactical"]);
});
