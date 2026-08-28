import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string): string => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const packet = read("rfc/shared-candidate-evidence-packet.md");
const semantic = read("packages/runtime/src/semantic-evidence.ts");
const tactics = read("packages/runtime/src/tactics.ts");
const catalogue = read("packages/runtime/src/evidence-catalog.ts");

test("D1977: cancellation and typed failures have no public result algebra", () => {
  assert.match(packet, /get\(request: CandidatePopulationRequest, signal: AbortSignal\): Promise<CandidatePopulationReceipt>/u);
  assert.match(packet, /returns `cancelled`/u);
  assert.match(packet, /fails with a typed error/u);
  assert.doesNotMatch(packet, /type CandidatePopulationResult\s*=/u);
  assert.doesNotMatch(packet, /interface CandidatePopulationServiceOptions/u);
});

test("D1978: held provider join is nevertheless required by foundation acceptance", () => {
  assert.match(packet, /does \*\*not\*\* land the vector refactor/u);
  assert.match(packet, /Production bot admission and final-policy caching/u);
  assert.match(packet, /15\. \*\*A scored table is never the legal population/u);
  assert.match(packet, /17\. \*\*A caller-invented score, N child searches and a fake node are refused/u);
  const implementationSurface = packet.slice(packet.indexOf("### §12 — Implementation surface"), packet.indexOf("## Acceptance criteria"));
  assert.doesNotMatch(implementationSurface, /CandidateScoreJoin(?:Input|Row)/u);
});

test("D1979: the production macrotask yield is unnamed and the control can self-abort", () => {
  assert.match(packet, /injected `yieldControl\(\): Promise<void>`/u);
  assert.match(packet, /Production's default is a\s+portable macrotask yield/u);
  assert.doesNotMatch(packet, /setImmediate|MessageChannel|scheduler\.yield/u);
  assert.match(packet, /macrotask yield aborts the final waiter/u);
});

test("D1980: the projector type admits impossible crossed narrow scopes", () => {
  assert.match(packet, /projectCandidatePopulationReceipt\(\s*receipt: CandidatePopulationReceipt,\s*scope: CandidatePacketScope/u);
  assert.doesNotMatch(packet, /CandidatePacketNarrowing|PermittedCandidateProjection|ProjectableCandidateScope/u);
  assert.doesNotMatch(packet, /events-only→readings-only|readings-only→events-only/u);
});

test("D1981: loose-piece unavailability is erased into the same empty event array as no-match", () => {
  assert.match(tactics, /kind: "unavailable"; readonly reason: "invalid_turn_clone"/u);
  assert.match(catalogue, /rules\.tactic\.event\.loose_piece[\s\S]{0,900}abstention: \{ possible: true, reasons: \["invalid_turn_clone"\] \}/u);
  assert.match(semantic, /if \(result\.kind === "unavailable"\) return undefined/u);
  assert.match(semantic, /\.\.\.\(loosePieceSemanticEvents\(beforeFen, moveUci, afterFen\) \?\? \[\]\)/u);
  assert.match(packet, /no-match emits no abstention/u);
});
