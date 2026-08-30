// DISPOSABLE author contract for the D2056-D2062 provider-exchange repair.
// This checks the amended RFC, not production implementation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/provider-exchange-and-execution.md", "utf8");
const sharedConsumerContract = readFileSync(
  "tools/d2056-provider-exchange-author-repair/shared-provider-contract.ts",
  "utf8",
);

function section(start: string, end: string): string {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return rfc.slice(from, to);
}

test("D2056: scheduler seals receipts, deliveries and local-domain values", () => {
  const exchange = section("### 3. One typed exchange receipt", "### 5. Stockfish legal-root source");
  assert.match(exchange, /WeakSet<object>/u);
  assert.match(exchange, /assertProviderAcquisitionReceipt/u);
  assert.match(exchange, /assertProviderDelivery/u);
  assert.match(exchange, /assertProviderLocalDomainResult/u);
  for (const forgery of ["plain object", "spread clone", "JSON round-trip", "double-cast"]) {
    assert.match(exchange, new RegExp(forgery.replace("-", "[-‑]"), "u"));
  }
  assert.match(exchange, /Every operation-keyed value-authority source factory calls `assertProviderDelivery`/u);
});

test("D2057: one closed authority binds run prefixes, evidence items and subjects", () => {
  const subject = section("type EvidenceAvailabilitySubjectRef", "### 3. One typed exchange receipt");
  for (const symbol of ["RunEventHeadDigest", "RunEvidenceItemDigest", "RunSubjectDigest", "digestRunEventHead", "digestRunEvidenceItem", "digestRunSubject"]) {
    assert.match(subject, new RegExp(symbol, "u"));
  }
  for (const domain of ["run.event_head.v1", "run.evidence_item.v1", "run.subject.v1"]) {
    assert.match(subject, new RegExp(domain.replaceAll(".", "\\."), "u"));
  }
  assert.match(subject, /run\.events\.slice\(0,N\)/u);
  assert.match(subject, /recomputes the digest for every historical prefix/u);
  assert.match(subject, /before any cache, provider health or source resolver is read/u);
});

test("D2058: retained TTL is absolute, non-refreshing and boundary-complete", () => {
  const scheduler = section("### 4. Shared bounded scheduler", "### 5. Stockfish legal-root source");
  for (const field of ["retainedAtMonotonic", "lastServedAtMonotonic", "expiresAtMonotonic"]) {
    assert.match(scheduler, new RegExp(field, "u"));
  }
  assert.match(scheduler, /Retention is absolute from successful admission, never sliding/u);
  assert.match(scheduler, /now < expiresAtMonotonic/u);
  assert.match(scheduler, /now >= expiresAtMonotonic/u);
  assert.match(scheduler, /never changes retained or expiry time/u);
});

test("D2059: endpoints and every provider/cache digest have closed typed images", () => {
  const receipt = section("### 3. One typed exchange receipt", "### 4. Shared bounded scheduler");
  for (const symbol of ["ProviderEndpointMap", "ProviderRequestDigest", "ProviderPendingDigest", "ProviderActualDigest", "ProviderResponseDigest", "ProviderRetainedDigest", "ProviderCacheIdentity", "digestProviderRetained"]) {
    assert.match(receipt, new RegExp(symbol, "u"));
  }
  assert.doesNotMatch(receipt, /readonly endpoint: string/u);
  assert.doesNotMatch(receipt, /readonly cacheIdentity: string/u);
  assert.match(receipt, /There is no caller-authored `runtimeDigest`/u);
  assert.match(receipt, /live `EngineIdentity`/u);
  assert.match(receipt, /ten closed digest domains/u);
  assert.match(receipt, /"provider\.retained\.v1"/u);
});

test("D2060: all five operations have one named composed production traversal", () => {
  const composition = section("### 9. Composition and operations", "### 10. Migration order");
  for (const symbol of [
    "providerTraversalStockfishLegalRoots",
    "providerTraversalStockfishPositionEvaluation",
    "providerTraversalMaiaPolicyPage",
    "providerTraversalSyzygyPosition",
    "providerTraversalExplorerPositionPage",
  ]) assert.match(composition, new RegExp(symbol, "u"));
  assert.match(composition, /runProviderTraversalCli/u);
  assert.match(composition, /make provider-traversal OP=<operation>/u);
  assert.match(composition, /has no HTTP route/u);
  assert.match(composition, /built CLI boundary for all five names/u);
});

test("D2061: Syzygy local evidence has one sealed envelope payload and adapter", () => {
  const syzygy = section("### 7. Syzygy position source", "### 8. Explorer position source");
  assert.match(syzygy, /one literal F1 payload is the sealed whole/u);
  assert.match(syzygy, /`ProviderLocalDomainResult<"syzygy\.position@1">`/u);
  assert.match(syzygy, /declareSyzygyTablebaseDomainEvidence/u);
  assert.match(syzygy, /bare `SyzygyOutsideDomain`/u);
  assert.match(syzygy, /crossed request digest/u);
});

test("D2062: Maia validates and proves every requested/applied field", () => {
  const maia = section("### 6. Maia policy-page source", "### 7. Syzygy position source");
  assert.match(maia, /Request admission is refuse-only/u);
  assert.match(maia, /MAIA3_BAND_RANGE/u);
  assert.match(maia, /engineBandProfile\(health\)/u);
  assert.match(maia, /appliedTargetElo\(health, request\.band\)/u);
  assert.match(maia, /`appliedBand` in the page equals that same-exchange value exactly/u);
  for (const option of ["Elo", "Temperature", "TopP", "MultiPV"]) {
    assert.match(maia, new RegExp(`setoption name ${option} value`, "u"));
  }
  assert.match(maia, /timeoutMs` is `1\.\.60_000`/u);
  assert.match(maia, /never clamps/u);
});

test("shared consumer authoring authority mirrors the exact delivery seam", () => {
  for (const field of ["kind: \"live\"", "servedAt", "cacheIdentity", "acquisition", "payload"] as const) {
    assert.match(sharedConsumerContract, new RegExp(field, "u"));
  }
  for (const field of ["operation", "provider", "endpoint", "requestedIdentity", "actualIdentity", "generation",
    "normalizedRequestDigest", "responseDigest"] as const) assert.match(sharedConsumerContract, new RegExp(field, "u"));
  assert.match(sharedConsumerContract, /type ProviderRequestedIdentity<K/u);
  assert.match(sharedConsumerContract, /type ProviderActualIdentity<K/u);
  assert.doesNotMatch(sharedConsumerContract, /Readonly<Record<string, unknown>>/u);
  assert.match(sharedConsumerContract, /assertProviderDelivery/u);
});
