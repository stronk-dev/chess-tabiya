// DISPOSABLE author/review falsifier — D1993-D1999. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/bounded-policy-targets.md");
const packetRfc = read("rfc/shared-candidate-evidence-packet.md");
const backlog = read("design/BACKLOG.md");

test("D1993: shared work has waiter-local cancellation and dedup-before-capacity", () => {
  assert.match(rfc, /Deduplication then occurs \*\*before\s+queue-capacity admission\*\*/s);
  assert.match(rfc, /caller abort settles only that waiter/i);
  assert.match(rfc, /last waiter[\s\S]*queued job is removed immediately[\s\S]*running job receives its private abort/i);
  assert.match(rfc, /duplicate may attach[\s\S]*eight other unique jobs fill capacity/i);
  assert.match(rfc, /settlement atomically removes the job-map entry/i);
  assert.match(rfc, /later identical request starts a new\s+job/i);
  assert.match(rfc, /Two waiters share one execution/);
});

test("D1994: request and result identities have one canonical byte authority", () => {
  assert.match(rfc, /tabiya:bounded-target-input@1/);
  assert.match(rfc, /tabiya:bounded-target-request@1/);
  assert.match(rfc, /tabiya:bounded-target-result@1/);
  assert.match(rfc, /shipped browser-safe `evidenceDigest\(\)`/);
  assert.match(rfc, /sorts\s+the exchange item digests lexicographically/s);
  assert.match(rfc, /maps each declared evidence item to its\s+exact `\{ producer, projection, payload \}` image/s);
  assert.doesNotMatch(rfc, /readonly inputDigests: readonly string\[\]/);
});

test("D1995: the real catalogue change can represent local/background without mutating old rows", () => {
  assert.match(rfc, /producer\(id, plane, implementation, availability, latency, outputs\)/);
  assert.match(rfc, /`local → sync \| background`, `recorded → sync`, `provider → interactive`, and\s+`build_time → offline`/s);
  assert.match(rfc, /existing declaration[\s\S]*compiled bytes and manifest digest do not change/i);
  assert.match(rfc, /new row is exactly\s+`local\/background`, never an implicit `sync` fallback/s);
});

test("D1996: producer operation authority binds the exact background service and reach", () => {
  assert.match(rfc, /interface EvidenceProducerOperation/);
  assert.match(rfc, /assertEvidenceProducerOperations\(producers, operations\)/);
  assert.match(rfc, /BoundedTargetBackgroundService\.submit/);
  assert.match(rfc, /RUNTIME_EVIDENCE_PRODUCER_OPERATIONS/);
  assert.match(rfc, /expected set from \*\*every\s+manifest producer whose latency is `background`\*\*/s);
  assert.match(rfc, /initial production call-site census is deliberately empty/i);
});

test("D1997: post-candidate exchange is a retained versioned semantic dependency", () => {
  assert.match(rfc, /interface PostCandidateExchangeEvaluation/);
  assert.match(rfc, /convention: "legal-exchange-for-move@1"/);
  assert.match(rfc, /readonly resultUnits: number/);
  assert.match(rfc, /Positive units correlate only with `preserved`; zero or\s+negative units correlate only with `exchange_neutralized`/s);
  assert.match(rfc, /does not mint a second source evidence item/i);
  assert.match(rfc, /No recomputation of the source threat outside its sole FEN-owning evidence constructor/);
});

test("D1998: service limits, failures, no-throw submission and cleanup are closed", () => {
  assert.match(rfc, /interface BoundedTargetServiceLimits/);
  for (const value of ["maxActive: number", "maxQueued: number", "maxPairs: number", "maxVisitedPositions: number", "maxBatchVisitedPositions: number", "yieldEveryVisited: number"]) {
    assert.match(rfc, new RegExp(value));
  }
  assert.match(rfc, /Default construction is exactly 1 active, 8 queued, 512 pairs, 25,000 per-candidate positions/);
  for (const reason of ["yield_failed", "traversal_failed", "seal_failed", "invariant_failed"]) {
    assert.match(rfc, new RegExp(`"${reason}"`));
  }
  assert.match(rfc, /Once constructed, `submit\(\)` never throws/);
  assert.match(rfc, /accept only numeric `Partial<BoundedTargetServiceLimits>`/);
  assert.match(rfc, /fix `PRIMARY_EVIDENCE_MANIFEST`/);
  assert.doesNotMatch(rfc, /readonly yieldControl: \(\) => Promise<void>/);
  assert.match(rfc, /terminal job leaves the active\/queue\/dedup maps/u);
  assert.match(rfc, /state as if it had never been admitted/u);
  assert.match(rfc, /setTimeout\(\(\) => abort\(\), 0\)/);
});

test("D1999: every visited-position edge and boundary has one convention", () => {
  assert.match(rfc, /bounded-target-visited-positions@1/);
  assert.match(rfc, /traversal root and counts as \*\*1\*\*/);
  assert.match(rfc, /counter increments once[\s\S]*Terminal detection, tracked-identity validation and target evaluation/s);
  assert.match(rfc, /child still counts if it is terminal or the identity update fails/);
  assert.match(rfc, /same FEN through two legal paths counts two/);
  assert.match(rfc, /replay at the sealing boundary[\s\S]*never alters the recorded count/s);
  assert.match(rfc, /never cap\+1/);
  assert.match(rfc, /Counts 63\/64\/65 yield zero\/one\/one/);
});

test("D2029: both background RFCs share one dependency-free macrotask adapter", () => {
  assert.match(rfc, /cooperative-yield\.ts:messageChannelMacrotaskYield/);
  assert.match(packetRfc, /cooperative-yield\.ts[\s\S]*messageChannelMacrotaskYield/s);
  assert.match(backlog, /D2029[^\n]*SAME EVENT-LOOP YIELD/);
});
