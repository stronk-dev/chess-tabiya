import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string): string => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const packet = read("rfc/shared-candidate-evidence-packet.md");
const semantic = read("packages/runtime/src/semantic-evidence.ts");
const tactics = read("packages/runtime/src/tactics.ts");
const catalogue = read("packages/runtime/src/evidence-catalog.ts");

test("D1977: service success, cancellation, failure, and options are one closed contract", () => {
  assert.match(packet, /type CandidatePopulationResult[\s\S]{0,1400}kind: "ready"[\s\S]{0,500}kind: "cancelled"[\s\S]{0,500}kind: "failed"/u);
  assert.match(packet, /interface CandidatePopulationServiceOptions/u);
  assert.match(packet, /Promise<CandidatePopulationResult>/u);
  for (const code of ["invalid_fen", "non_terminal_empty", "collector_failed", "invariant_failed", "invalid_scope_projection"]) {
    assert.ok(packet.includes(`"${code}"`), `missing closed failure ${code}`);
  }
  assert.match(packet, /Exactly\s+`ready` values may publish to the cache/u);
});

test("D1978: provider behavior is held while the compile-time handoff remains exact", () => {
  assert.match(packet, /does \*\*not\*\* land the vector refactor/u);
  assert.match(packet, /Bot score-join behavior, production admission and final-policy caching/u);
  assert.match(packet, /15\. \*\*The held score join has one compile-time seam and zero behavior here/u);
  assert.match(packet, /17\. \*\*Future provider behavior cannot become a foundation false-green/u);
  const implementationSurface = packet.slice(packet.indexOf("### §12 — Implementation surface"), packet.indexOf("## Acceptance criteria"));
  assert.match(implementationSurface, /candidate-score-handoff\.ts[\s\S]{0,300}types only/u);
  assert.match(packet, /Test-created profiles and foundation type fixtures do not discharge this row/u);
});

test("D1979: production scheduling names an adapter, topology, and independent abort", () => {
  assert.match(packet, /messageChannelMacrotaskYield/u);
  assert.match(packet, /implemented with one `MessageChannel` post/u);
  assert.match(packet, /maxCollectorsPerGroup[\s\S]{0,120}default 4/u);
  assert.match(packet, /real\s+zero-delay timer that aborts an `AbortController` independently/u);
  assert.match(packet, /yield count and accumulated yield overhead/u);
});

test("D1980: projection is the same partial order at type and runtime boundaries", () => {
  assert.match(packet, /type ProjectableCandidateScope/u);
  assert.match(packet, /T extends ProjectableCandidateScope<S>/u);
  assert.match(packet, /[Ee]vents-only→readings-only and readings-only→events-only fail/u);
  assert.match(packet, /invalid_scope_projection/u);
});

test("D1981: the author contract separates loose-piece unavailability from no-match", () => {
  assert.match(tactics, /kind: "unavailable"; readonly reason: "invalid_turn_clone"/u);
  assert.match(catalogue, /rules\.tactic\.event\.loose_piece[\s\S]{0,900}abstention: \{ possible: true, reasons: \["invalid_turn_clone"\] \}/u);
  assert.match(semantic, /if \(result\.kind === "unavailable"\) return undefined/u);
  assert.match(semantic, /\.\.\.\(loosePieceSemanticEvents\(beforeFen, moveUci, afterFen\) \?\? \[\]\)/u);
  assert.match(packet, /CandidateCollectorResult/u);
  assert.match(packet, /invalid_turn_clone[\s\S]{0,500}available[\s\S]{0,120}values: \[\]/u);
  assert.match(packet, /Flattening either to\s+the other fails/u);
});
