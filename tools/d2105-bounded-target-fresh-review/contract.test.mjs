// DISPOSABLE fresh independent review harness — D2105-D2111. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path, "utf8");
const rfc = read("rfc/bounded-policy-targets.md");
const tactics = read("packages/runtime/src/tactics.ts");
const adapters = read("packages/runtime/src/evidence-source-adapters.ts");

function section(text, start, end) {
  const from = text.indexOf(start);
  const to = text.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return text.slice(from, to);
}

test("D2105: sealed threat evidence has no source-position anchor", () => {
  const threat = section(tactics, "export type ThreatResult", "export interface Threat");
  assert.doesNotMatch(threat, /fen|source|passAnchor/u);
  assert.match(adapters, /declareThreatEvidence[\s\S]{0,220}\["kind", "conventionId", "threats"\]/u);
  assert.match(rfc, /cross-position[\s\S]{0,160}refuses/u);
  assert.match(rfc, /applies the export to the sealed source-position FEN/u);
  assert.doesNotMatch(rfc, /ThreatResult[\s\S]{0,180}(?:sourceFen|passAnchor)/u);
});

test("D2106: the registered service is an erased, non-exported interface", () => {
  const boundary = section(rfc, "interface BoundedTargetBackgroundService", "`boundedTargetInputDigest");
  assert.doesNotMatch(boundary, /^export interface BoundedTargetBackgroundService/mu);
  assert.doesNotMatch(rfc, /export class BoundedTargetBackgroundService|createBoundedTargetBackgroundService/u);
  assert.match(rfc, /BoundedTargetBackgroundService\.prototype\.submit/u);
});

test("D2107: TrackedPieceIdentity is used normatively but never declared", () => {
  assert.match(rfc, /readonly attacker: TrackedPieceIdentity/u);
  assert.match(rfc, /readonly victim: TrackedPieceIdentity/u);
  assert.doesNotMatch(rfc, /(?:interface|type) TrackedPieceIdentity\b/u);
});

test("D2108: the per-candidate traversal cap leaves the whole batch effectively unbounded", () => {
  assert.match(rfc, /above \*\*512 pairs\*\*/u);
  assert.match(rfc, /per candidate\s+traversal/u);
  assert.match(rfc, /maxVisitedPositions: 25000/u);
  assert.doesNotMatch(rfc, /maxBatchVisited|maxTotalVisited|batch budget|batch deadline/iu);
  assert.equal(512 * 25_000, 12_800_000);
});

test("D2109: reintroduced admits a null refutation despite excluding all-defences survival", () => {
  const outcomes = section(rfc, "type BoundedReturnOutcome", "interface BoundedTargetReturn");
  assert.match(outcomes, /kind: "reintroduced"[\s\S]*?firstRefutation: RefutationLine \| null/u);
  assert.match(outcomes, /kind: "survives_every_defence"/u);
  assert.match(rfc, /survive\s+every legal defence after one preparation/u);
});

test("D2110: product callers can override the scheduler and the service has no shutdown", () => {
  const lifecycle = section(rfc, "Construction accepts `Partial<BoundedTargetServiceOptions>`", "### 4.2 Producer-operation authority");
  assert.match(lifecycle, /Construction accepts `Partial<BoundedTargetServiceOptions>`/u);
  assert.match(rfc, /readonly yieldControl: \(\) => Promise<void>/u);
  assert.doesNotMatch(lifecycle, /test-only|internal test|private constructor|production factory/iu);
  assert.doesNotMatch(lifecycle, /shutdown|dispose|service close|close\(\):/iu);
});

test("D2111: batch visitedPositions has no aggregation convention", () => {
  const result = section(rfc, "type BoundedTargetBatchResult", "interface BoundedTargetServiceOptions");
  assert.match(result, /readonly visitedPositions: number/g);
  const convention = section(rfc, "### 4.3 Normative visited-position convention", "## 5. Consumer posture");
  assert.match(convention, /per candidate\s+traversal/u);
  assert.doesNotMatch(convention, /batch[\s\S]{0,120}(?:sum|total|aggregate)|(?:sum|total|aggregate)[\s\S]{0,120}batch/iu);
});
