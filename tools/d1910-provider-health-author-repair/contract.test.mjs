// DISPOSABLE positive author contract for D1910-D1915 and D2362. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/provider-health-degradation.md", "utf8");

function section(start, end) {
  const from = rfc.indexOf(start);
  const to = rfc.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return rfc.slice(from, to);
}

test("D1910 separates family, instance and operation identity", () => {
  const identity = section("type ProviderFamilyId", "### 2. State model");
  assert.match(identity, /"stockfish-play"/u);
  assert.match(identity, /"stockfish-analysis"/u);
  assert.match(identity, /"opponent\.stockfish_play"/u);
  assert.match(identity, /"evidence\.stockfish_analysis"/u);
  assert.match(rfc, /analysis failure cannot disable `opponent\.stockfish_play`/u);
});

test("D2362 separates allowed implementations from the configured generation member", () => {
  const identity = section("type ProviderFamilyId", "### 2. State model");
  assert.match(identity, /allowedImplementations/u);
  assert.match(identity, /`local_fixture` is admitted only\s+by the test factory/u);
  assert.match(identity, /`local_service` is the production-local\s+member/u);
  assert.match(identity, /configured implementation within the instance's allowed set and\s+moves generation/u);
});

test("D1911 makes clean-start state and operation requestability total", () => {
  const state = section("type ProviderHealthSnapshot", "### 3. Generation and identity");
  const notConfigured = section('readonly state: "not_configured"', '| {\n      readonly instanceId: ProviderInstanceId;\n      readonly familyId: ProviderFamilyId;\n      readonly state: "unverified"');
  assert.doesNotMatch(notConfigured, /implementation|generation|checkedAt|reason/u);
  assert.match(state, /"requestable_unverified"/u);
  assert.match(rfc, /Their first real request verifies\s+them/u);
  assert.match(rfc, /`\/capabilities` itself never triggers that request/u);
});

test("D1912 compiles rendering dependencies under one deadline", () => {
  const execution = section("interface ProviderExecutionStage", "Producer availability preserves");
  assert.match(execution, /readonly dependsOn: readonly string\[\]/u);
  assert.match(execution, /readonly deadline: "consumer_budget"/u);
  assert.match(execution, /conditional `external-tts` depends on that\s+stage/u);
  assert.match(execution, /missing or duplicate operation,[\s\S]*cycle,[\s\S]*absent total-deadline source/u);
});

test("D1913 closes provider operation results", () => {
  const result = section("interface ProviderReceiptBase", "### 5. Operation deadlines and cancellation");
  for (const arm of ['kind: "success"', 'kind: "fallback"', 'kind: "unavailable"', 'kind: "cancelled"']) {
    assert.match(result, new RegExp(arm.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }
  assert.match(result, /source: "cached_exact";[\s\S]*original: ProviderOriginReceipt/u);
  assert.match(result, /source: "failed";[\s\S]*reason: ProviderFailureReason/u);
  assert.match(rfc, /cached success and\s+deterministic fallback do not heal/u);
});

test("D1914 claims and specifies durable opponent acquisition", () => {
  assert.match(rfc, /run-schema \| lane 0\.26 \|/u);
  const rollout = section("## Rollout and compatibility", "## Discharges");
  assert.match(rollout, /every newly appended\s+`opponent\.move_selected` event must carry the field/u);
  assert.match(rollout, /legacy_unrecorded/u);
  assert.match(rollout, /Save→reload→Review\/export/u);
});

test("D1915 derives cache-only state from current generation-valid inventory", () => {
  const derive = ({ failed, entries }) => failed ? (entries > 0 ? "degraded_cached_only" : "unavailable") : "available";
  assert.equal(derive({ failed: true, entries: 1 }), "degraded_cached_only");
  assert.equal(derive({ failed: true, entries: 0 }), "unavailable");
  const cache = section("interface ProviderCacheInventory", "The existing 512-entry Explorer/tablebase caches");
  assert.match(cache, /validExactEntries/u);
  assert.match(cache, /TTL expiry, LRU eviction, explicit invalidation and generation\s+cleanup monotonically advance `revision`/u);
  assert.match(cache, /removal of the\s+last entry changes `\/capabilities` even when no new provider outcome occurred/u);
});
