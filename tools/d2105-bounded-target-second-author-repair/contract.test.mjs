// DISPOSABLE author contract — D2105-D2111. RFC shape only; not production evidence.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/bounded-policy-targets.md", "utf8");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return rfc.slice(from, to);
}

test("D2105: one FEN-owning threat constructor retains a private source anchor", () => {
  assert.match(rfc, /declareThreatEvidence\(sourceFen: string\): SourceBoundThreatEvidence/u);
  assert.match(rfc, /WeakMap<DeclaredEvidence<ThreatResult>, ThreatPassAnchorResult>/u);
  assert.match(rfc, /accepts no caller payload/u);
  assert.match(rfc, /byte-identical threats[\s\S]{0,120}refuses/u);
});

test("D2106: the producer operation is a concrete exported runtime service", () => {
  assert.match(rfc, /export declare class BoundedTargetBackgroundService/u);
  assert.match(rfc, /static create\([\s\S]{0,260}BoundedTargetBackgroundService/u);
  assert.match(rfc, /export declare function createBoundedTargetBackgroundService/u);
  assert.match(rfc, /BoundedTargetBackgroundService\.prototype\.submit/u);
});

test("D2107: source identity, promotion edge and traversal state are literal", () => {
  assert.match(rfc, /export interface TrackedPieceIdentity[\s\S]{0,180}color: Color[\s\S]{0,100}role: Role[\s\S]{0,100}square: SquareName/u);
  assert.match(rfc, /export interface ObservedPromotionEdge[\s\S]{0,400}fromRole: "pawn"[\s\S]{0,120}toRole: "queen" \| "rook" \| "bishop" \| "knight"/u);
  assert.match(rfc, /interface TrackedPieceState[\s\S]{0,240}observedPromotions/u);
  assert.match(rfc, /Extra[\s\S]{0,100}provenance[\s\S]{0,160}fail/iu);
});

test("D2108: one deterministic whole-job bound closes the multiplied envelope", () => {
  assert.match(rfc, /maxBatchVisitedPositions: number;.{0,80}100_000/u);
  assert.match(rfc, /100,000 visited positions across the whole batch/u);
  assert.match(rfc, /batch_budget_exhausted/u);
  assert.match(rfc, /position 100,001[\s\S]{0,160}no target array/u);
});

test("D2109: every positive non-universal witness has a required refutation", () => {
  const outcomes = section("export type BoundedReturnOutcome", "export interface BoundedTargetReturn");
  assert.match(outcomes, /kind: "reintroduced";[\s\S]*?firstRefutation: RefutationLine;/u);
  assert.doesNotMatch(outcomes, /kind: "reintroduced";[\s\S]*?firstRefutation: RefutationLine \| null/u);
  assert.match(rfc, /terminal\/zero-reply preparation is not a vacuous[\s\S]{0,30}universal/u);
});

test("D2110: product scheduling is fixed and lifecycle is idempotently closeable", () => {
  const execution = section("### 4.1 Execution class", "### 4.2 Producer-operation authority");
  assert.match(execution, /accept only numeric `Partial<BoundedTargetServiceLimits>`/u);
  assert.match(execution, /createBoundedTargetBackgroundServiceForTest/u);
  assert.match(execution, /absent from the runtime barrel and production import/u);
  assert.match(execution, /`close\(\)` is idempotent/u);
  assert.match(execution, /cancelled\/service_closed/u);
  assert.doesNotMatch(rfc, /readonly yieldControl: \(\) => Promise<void>/u);
});

test("D2111: batch accounting is a total reproducible sum with snapshots", () => {
  const convention = section("### 4.3 Normative visited-position convention", "## 5. Consumer posture");
  assert.match(convention, /batch count is[\s\S]{0,80}exact sum/u);
  assert.match(convention, /waiter-local abort samples the aggregate counter synchronously/u);
  assert.match(convention, /Global exhaustion[\s\S]{0,120}100,001/u);
  assert.match(convention, /failure reports the aggregate at the catch boundary/u);
});
