// DISPOSABLE review harness — D1993-D2001. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/bounded-policy-targets.md");
const authorHarness = read("tools/d1652-bounded-target-repair-harness/second-repeat-repair.test.ts");
const evidenceContract = read("packages/runtime/src/evidence-contract.ts");
const evidenceCatalogue = read("packages/runtime/src/evidence-catalog.ts");
const research = read("tools/d1023-bounded-policy-harness/exact-target.test.ts");

test("D1993: duplicate-job cancellation has no waiter algebra", () => {
  assert.match(rfc, /Exact duplicate request digests share one job/);
  assert.match(rfc, /submit\(\s*request: BoundedTargetBatchRequest,\s*signal: AbortSignal/s);
  assert.doesNotMatch(rfc, /waiter|last subscriber|last caller|per-caller|all waiters|remaining caller/i);
  assert.equal(rfc.includes("Deduplication occurs before queue-capacity admission"), false);
});

test("D1994: request and input digests have no source authority", () => {
  const declared = evidenceContract.slice(evidenceContract.indexOf("export interface DeclaredEvidence"), evidenceContract.indexOf("const DECLARED:"));
  assert.doesNotMatch(declared, /digest/);
  assert.match(rfc, /Exact duplicate request digests/);
  assert.match(rfc, /readonly inputDigests: readonly string\[\]/);
  assert.doesNotMatch(rfc, /domain tag|domain-separated|JCS|canonicalPayload|sha256:/i);
});

test("D1995: the live producer helper forces every local producer to sync", () => {
  assert.match(rfc, /own availability\/latency \| `local` \/ `background`/);
  assert.match(evidenceCatalogue, /latency: availability === "provider" \? "interactive" : availability === "build_time" \? "offline" : "sync"/);
  assert.doesNotMatch(authorHarness, /EVIDENCE_PRODUCERS|producer\("derived\.bounded_target"|latency: "background"/);
});

test("D1996: the named producer-operation census is absent", () => {
  assert.match(rfc, /generated evidence-operation census/);
  assert.match(evidenceContract, /export interface EvidenceConsumerOperation/);
  assert.doesNotMatch(evidenceContract, /EvidenceProducerOperation|EvidenceServiceOperation|assertEvidenceProducerOperations/);
  assert.doesNotMatch(evidenceCatalogue, /BoundedTargetBackgroundService|derived\.bounded_target/);
});

test("D1997: exchange-neutralized needs the evaluator the RFC forbids", () => {
  assert.match(rfc, /"exchange_neutralized"/);
  assert.match(rfc, /No recomputation of threat or legal exchange beside the retained sealed inputs/);
  assert.match(research, /function positiveTargetCapture[\s\S]*legalExchangeForMove/);
  assert.match(research, /cause: "exchange_neutralized"/);
  assert.doesNotMatch(rfc, /post-candidate exchange|internal semantic dependency|legalExchangeForMove.*derived/i);
});

test("D1998: service failure and construction options are open", () => {
  const operation = rfc.slice(rfc.indexOf("type BoundedTargetBatchResult"), rfc.indexOf("### 4.1"));
  assert.doesNotMatch(operation, /kind: "failed"|throw|internal_error|yield_failed/);
  assert.doesNotMatch(rfc, /BoundedTargetServiceOptions|BoundedTargetBackgroundServiceOptions/);
  assert.match(rfc, /injected `yieldControl\(\): Promise<void>`/);
  assert.doesNotMatch(rfc, /setImmediate|MessageChannel|setTimeout/);
});

test("D1999: visited-position counting is not specified", () => {
  assert.match(rfc, /25,000 visited positions/);
  assert.match(rfc, /exactly 64 visited positions/);
  assert.doesNotMatch(rfc, /root counts as|increment(?:s|ed)? (?:before|after)|transposition.*count|terminal.*increment|visited-position convention/i);
  assert.match(research, /let visited = 1/);
  assert.match(research, /visited \+= 1/);
});
