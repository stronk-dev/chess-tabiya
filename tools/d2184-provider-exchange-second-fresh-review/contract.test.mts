// DISPOSABLE second fresh independent review harness — D2184-D2189. Not production code.
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

test("D2184: availability cannot identify one runtime node or edge inside a run prefix", () => {
  const subject = section("interface EvidenceAvailabilitySubject", "type ResolvedSourceSubject");
  assert.match(subject, /kind: "run_event"/u);
  assert.match(subject, /runId: string/u);
  assert.match(subject, /eventHeadDigest: RunEventHeadDigest/u);
  assert.doesNotMatch(subject, /nodeId|edgeId|branchId|positionKey|moveEventSeq/u);
  assert.match(rfc, /keyed by\s+`\{consumer projection, pathId, source occurrence\}`/u);
  assert.match(rfc, /two-occurrence member/u);
});

test("D2185: engine digest brands have no byte constructors and do not exist in live identity", () => {
  const receipt = section("### 3. One typed exchange receipt", "### 4. Shared bounded scheduler");
  for (const brand of ["EngineBinaryDigest", "EngineOptionImageDigest", "EngineContainerDigest"]) {
    assert.match(receipt, new RegExp(`type ${brand}`, "u"));
    assert.doesNotMatch(receipt, new RegExp(`function digest${brand.replace("Digest", "")}`, "u"));
  }
  assert.match(receipt, /seven closed operations/u);
  const live = read("apps/server/src/engine-supervisor.ts");
  assert.doesNotMatch(live, /binaryDigest|optionsDigest|optionImageDigest/u);
  assert.match(live, /readonly containerDigest\?: string/u);
});

test("D2186: descriptor can pair an arbitrary parsed payload with unrelated captured bytes", () => {
  const scheduler = section("interface ProviderExecutionCapture", "### 5. Stockfish legal-root source");
  assert.match(scheduler, /payload: ProviderOperationResultMap\[K\]/u);
  assert.match(scheduler, /capture: ProviderExecutionCapture<K>/u);
  assert.match(scheduler, /readonly responseBytes: Uint8Array/u);
  assert.doesNotMatch(scheduler, /parseResponse|validatePayloadAgainstResponse|payloadDigest/u);
  const valueAuthority = read("rfc/evidence-value-authority.md");
  assert.match(valueAuthority, /plus the\s+typed response bytes attached to that receipt/u);
  assert.match(valueAuthority, /verify subject\/request digest, provider\/model\s+identity, occurrence, result digest/u);
});

test("D2187: Explorer claims status and ETag that the acquisition capture does not retain", () => {
  const scheduler = section("interface ProviderExecutionCapture", "### 5. Stockfish legal-root source");
  assert.doesNotMatch(scheduler, /status|etag|headers/u);
  const explorer = section("interface ExplorerPositionPage", "### 9. Composition and operations");
  assert.match(explorer, /source: \{ readonly status: number; readonly etag: string \| null \}/u);
  const digests = section("### 3.1 One canonical provider-digest registry", "### 4. Shared bounded scheduler");
  assert.match(digests, /HTTP response\s+body/u);
  assert.doesNotMatch(digests, /statusCode|responseHeaders|etag.*response/u);
});

test("D2188: operator traversals stop at scheduler results instead of source evidence adapters", () => {
  const composition = section("### 9. Composition and operations", "### 10. Migration order");
  assert.match(composition, /Promise<TypedProviderResult</u);
  assert.match(composition, /then calls `application\.scheduler\.get`/u);
  assert.match(composition, /raw source adapters \| 5/u);
  assert.match(composition, /through `scheduler\.get` to each adapter/u);
  assert.doesNotMatch(composition, /Promise<DeclaredEvidence|declareProviderTraversalEvidence|sourceAdapter\(/u);
});

test("D2189: closed cross-package provider vocabularies claim no shared resource", () => {
  assert.match(rfc, /```tabiya-claims\s+none\s+```/u);
  assert.match(rfc, /type ProviderOperationId\s*=/u);
  assert.match(rfc, /type ProviderDigestDomain\s*=/u);
  assert.match(rfc, /packages\/runtime\/src\/provider-digest\.ts/u);
  assert.match(rfc, /apps\/server\/src\/provider-traversal\.ts/u);
  const register = read("rfc/README.md");
  assert.doesNotMatch(register, /^## Provider-(?:operation|digest|exchange).*register/mu);
});
