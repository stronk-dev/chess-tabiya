// DISPOSABLE second fresh independent review harness — D2412-D2417. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/provider-health-degradation.md", "utf8");
const authorTypes = readFileSync("tools/d1910-provider-health-author-repair/model.typecheck.ts", "utf8");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return rfc.slice(from, to);
}

test("D2412: result and cached origin identities are structurally independent", () => {
  const receipt = section("interface ProviderReceiptBase", "### 5. Operation deadlines and cancellation");
  assert.match(receipt, /readonly operationId: ProviderOperationId;\s+readonly instanceId: ProviderInstanceId;/u);
  assert.match(receipt, /readonly source: "cached_exact";\s+readonly original: ProviderOriginReceipt;/u);
  assert.match(receipt, /type ProviderOperationResult<T> =/u);
  assert.doesNotMatch(receipt, /ProviderOperationResultMap|ProviderInstanceFor|SameGeneration|same operation|same instance|same generation/iu);
  assert.match(authorTypes, /type Origin =[\s\S]*"opponent\.stockfish_play"[\s\S]*"evidence\.stockfish_analysis"[\s\S]*"render\.voice"/u);
  assert.doesNotMatch(authorTypes, /opponent\.maia_inference|evidence\.tablebase_probe|evidence\.explorer_query|render\.voice_compare|render\.voice_story|render\.tts/u);
});

test("D2413: unverified is both clean-start and successful recovery without recovery state", () => {
  const state = section("type ProviderHealthSnapshot", "### 3. Generation and identity");
  const unverified = section('readonly state: "unverified"', '| ({\n      readonly instanceId: ProviderInstanceId;');
  assert.doesNotMatch(unverified, /checkedAt|lastSuccessAt|lastFailureAt|recovery|consecutive/u);
  assert.match(state, /successful live request[\s\S]{0,180}→ `available`/u);
  assert.match(rfc, /requires two consecutive successful real requests before returning to `available`; between them it\s+remains `unverified`/u);
  assert.doesNotMatch(state, /state: "recovering"/u);
});

test("D2414: instance-wide cache inventory cannot prove operation/request availability", () => {
  const cache = section("interface ProviderCacheInventory", "The existing 512-entry Explorer/tablebase caches");
  assert.match(cache, /readonly instanceId: ProviderInstanceId;/u);
  assert.match(cache, /readonly validExactEntries: number;/u);
  assert.doesNotMatch(cache, /operationId|cacheKeyDigest|normalizedRequestDigest|exactRequest/u);
  const operations = section("type ProviderOperationId", "type ProviderImplementation");
  for (const operation of ["render.voice", "render.voice_compare", "render.voice_story"]) {
    assert.match(operations, new RegExp(`"${operation.replace(".", "\\.")}"`, "u"));
  }
  assert.match(rfc, /The instance-global state never claims that a cached entry applies to the current request/u);
});

test("D2415: local-service implementation has no receipt representation", () => {
  const identity = section("type ProviderImplementation", "### 2. State model");
  const receipt = section("interface ProviderReceiptBase", "### 5. Operation deadlines and cancellation");
  assert.match(identity, /"local_service"/u);
  assert.match(receipt, /readonly source: "live"/u);
  assert.match(receipt, /readonly source: "local_fixture"/u);
  assert.doesNotMatch(receipt, /local_service|implementation: ProviderImplementation/u);
  assert.match(rfc, /local production service is labeled `local_service`/u);
});

test("D2416: nine declared operation ids have only eight described execution members", () => {
  const operations = section("type ProviderOperationId", "type ProviderImplementation");
  const ids = [...operations.matchAll(/\| "([^"]+)"/gu)].map((match) => match[1]);
  assert.equal(ids.length, 9);
  assert.ok(ids.includes("render.tts"));
  const execution = section("`PROVIDER_OPERATION_EXECUTION` is a literal tuple", "Producer availability preserves");
  assert.match(execution, /two independent\s+Stockfish operations, Maia opponent inference, tablebase, Explorer and the three voice consumer\s+operations/u);
  assert.doesNotMatch(execution, /`render\.tts`/u);
  assert.match(execution, /missing or duplicate operation/u);
});

test("D2417: shared-upstream backoff has no shared-upstream identity", () => {
  const identity = section("type ProviderFamilyId", "### 2. State model");
  const circuit = section("### 6. Circuit opening, backoff and recovery", "### 7. Cache contract");
  assert.doesNotMatch(identity, /upstreamId|coordinatorId|rateLimitGroup|backoffGroup/u);
  assert.match(circuit, /one circuit per provider-instance generation/u);
  assert.match(circuit, /relevant upstream/u);
  assert.match(rfc, /coordinates backoff per upstream rather than letting each learner retry independently/u);
});
