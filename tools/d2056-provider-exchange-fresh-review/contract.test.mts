// DISPOSABLE fresh independent review harness — D2056-D2062. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string): string => readFileSync(path, "utf8");
const rfc = read("rfc/provider-exchange-and-execution.md");

function section(start: string, end: string): string {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing section ${start}`);
  assert.notEqual(to, -1, `missing section ${end}`);
  return rfc.slice(from, to);
}

test("D2056: receipt/delivery are forgeable structural objects despite runtime-forgery criterion", () => {
  const receipt = section("### 3. One typed exchange receipt", "### 3.1 One canonical provider-digest registry");
  assert.match(receipt, /type ProviderAcquisitionReceipt/u);
  assert.match(receipt, /type ProviderDelivery/u);
  assert.doesNotMatch(receipt, /WeakSet|unique symbol|assertProvider(?:Acquisition|Delivery)|isProviderDelivery/u);
  assert.match(rfc, /runtime double-cast\s+forgeries fail/u);
});

test("D2057: run-event and recorded evidence digests have no canonical constructor", () => {
  const subject = section("interface EvidenceAvailabilitySubject", "### 3. One typed exchange receipt");
  assert.match(subject, /eventHeadDigest: string/u);
  assert.match(subject, /subjectDigest: `sha256:\$\{string\}`/u);
  assert.match(subject, /evidenceItemDigest: `sha256:\$\{string\}`/u);
  assert.doesNotMatch(subject, /digestRunEventHead|digestRunEvidenceItem|run\.event_head\.v1|run\.evidence_item\.v1/u);
  assert.equal(read("apps/server/src/authorization.ts").includes("eventHeadDigest"), false);
});

test("D2058: retention TTL does not say whether retrieval or last service owns expiry", () => {
  const scheduler = section("### 4. Shared bounded scheduler", "### 5. Stockfish legal-root source");
  assert.match(scheduler, /retentionTtlMs/u);
  assert.match(scheduler, /least-recently-served/u);
  assert.match(scheduler, /`servedAt`/u);
  assert.doesNotMatch(scheduler, /retainedAtMonotonic|lastServedAtMonotonic|TTL (?:begins|is measured) at|cache hit (?:does not )?refreshes TTL|exactly at expiry/u);
});

test("D2059: engine endpoint/cache/digest identities remain arbitrary strings", () => {
  const receipt = section("### 3. One typed exchange receipt", "### 3.1 One canonical provider-digest registry");
  assert.match(receipt, /readonly endpoint: string/u);
  assert.match(receipt, /readonly cacheIdentity: string/u);
  assert.match(receipt, /readonly normalizedRequestDigest: string/u);
  assert.match(receipt, /readonly actualIdentityDigest: string/u);
  assert.match(receipt, /captured endpoint to equal a network actual identity's endpoint/u);
  assert.doesNotMatch(receipt, /stockfish_endpoint|maia_endpoint|digestProviderRetained|cacheIdentityDigest/u);
  const liveIdentity = read("apps/server/src/engine-supervisor.ts");
  assert.match(liveIdentity, /readonly modelId\?: string/u);
  assert.match(liveIdentity, /readonly containerDigest\?: string/u);
  assert.doesNotMatch(liveIdentity, /runtimeDigest/u);
});

test("D2060: five traversal labels have no named production entry points", () => {
  const composition = section("### 9. Composition and operations", "### 10. Migration order");
  assert.match(composition, /Each operation has one real operator\/research traversal/u);
  assert.match(composition, /typed provider operations \| 5/u);
  assert.doesNotMatch(composition, /(?:GET|POST|PUT|DELETE) \/|make provider-|application\.[A-Za-z]+Provider|providerTraversal[A-Z]/u);
  const protocol = section("interface ProviderOperationDescriptor", "### 5. Stockfish legal-root source");
  assert.match(protocol, /type ProviderOperationDescriptors/u);
  assert.match(rfc, /census names five real callable operations/u);
});

test("D2061: Syzygy local projection names both inner fact and result envelope as payload", () => {
  const syzygy = section("### 7. Syzygy position source", "### 8. Explorer position source");
  assert.match(syzygy, /`rules\.endgame\.tablebase_domain@1`[\s\S]*Its payload is `SyzygyOutsideDomain`/u);
  assert.match(syzygy, /carries the normalized request digest and local\s+observation time through `ProviderLocalDomainResult<"syzygy\.position@1">`/u);
  assert.doesNotMatch(syzygy, /payload `ProviderLocalDomainResult<"syzygy\.position@1">`/u);
});

test("D2062: Maia request numbers and applied band have no normative bounds/application rule", () => {
  const maia = section("### 6. Maia policy-page source", "### 7. Syzygy position source");
  for (const field of ["band", "temperature", "topP", "requestedWidth", "timeoutMs"]) assert.match(maia, new RegExp(`readonly ${field}: number`, "u"));
  assert.match(maia, /readonly appliedBand: number/u);
  assert.doesNotMatch(maia, /MAIA3_BAND_RANGE|appliedTargetElo/u);
  assert.doesNotMatch(maia, /(?:band|requestedWidth|timeoutMs) (?:is|must be) a positive safe integer/u);
  assert.doesNotMatch(maia, /requestedWidth[^.]{0,160}MultiPV[^.]{0,80}(?:maximum|max)/u);
  assert.doesNotMatch(maia, /appliedBand (?:equals|must equal)/u);
  assert.match(read("apps/server/src/maia.ts"), /MAIA3_BAND_RANGE/u);
  assert.match(read("apps/server/src/engine-band.ts"), /function appliedTargetElo/u);
});
