// DISPOSABLE author falsifier for D2412-D2417. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { transformSync } from "esbuild";

const source = readFileSync("tools/d2412-provider-health-third-author-repair/model.ts", "utf8");
const compiled = transformSync(source, { format: "esm", loader: "ts", target: "es2022" }).code;
const model = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const rfc = readFileSync("rfc/provider-health-degradation.md", "utf8");
const base = { generation: "g1", requestDigest: "request-a" };

test("D2412 compiles all eight operation/stage identities from one map", () => {
  model.assertProviderClosure();
  assert.equal(model.PROVIDER_OPERATION_EXECUTION.length, 8);
  assert.deepEqual(model.PROVIDER_OPERATION_EXECUTION.filter((row) => row.operationId.startsWith("render.")).map((row) => row.operationId), ["render.voice", "render.voice_compare", "render.voice_story"]);
});

test("D2412 rejects crossed operation, stage and cached origin identity", () => {
  const origin = { operationId: "render.voice", stageId: "text", instanceId: "external-voice", implementation: "external_http", source: "provider_live", ...base };
  assert.deepEqual(model.parseAcquisitionReceipt(origin), origin);
  assert.throws(() => model.parseAcquisitionReceipt({ ...origin, instanceId: "stockfish-play" }), /ROUTE_MISMATCH/u);
  const cached = { ...origin, source: "cached_exact", cacheKeyDigest: "key", original: origin };
  assert.deepEqual(model.parseAcquisitionReceipt(cached), cached);
  assert.throws(() => model.parseAcquisitionReceipt({ ...cached, original: { ...origin, requestDigest: "other" } }), /ORIGIN_MISMATCH/u);
  assert.throws(() => model.parseAcquisitionReceipt({ ...cached, original: { ...origin, source: "local_service" } }), /ORIGIN_SOURCE_INVALID/u);
  assert.throws(() => model.parseAcquisitionReceipt({ ...cached, cacheKeyDigest: "" }), /CACHE_KEY_MISSING/u);
});

test("D2413 keeps clean start distinct from two-success recovery", () => {
  let state = { state: "unverified", generation: "g1" };
  state = model.reduceRecovery(state, { kind: "success" });
  assert.equal(state.state, "available");
  state = model.reduceRecovery(state, { kind: "failure", reason: "network" });
  state = model.reduceRecovery(state, { kind: "failure", reason: "network" });
  state = model.reduceRecovery(state, { kind: "success" });
  assert.deepEqual(state, { state: "recovering", generation: "g1", priorReason: "network", consecutiveSuccesses: 1, requiredSuccesses: 2 });
  state = model.reduceRecovery(state, { kind: "success" });
  assert.equal(state.state, "available");
  assert.deepEqual(model.reduceRecovery(state, { kind: "generation", generation: "g2" }), { state: "unverified", generation: "g2" });
});

test("D2414 partitions the shared voice instance by operation and exact request", () => {
  const cache = new model.ExactProviderCache();
  const row = { operationId: "render.voice", stageId: "text", instanceId: "external-voice", generation: "g1", requestDigest: "r1", cacheKeyDigest: "k1" };
  cache.put(row);
  assert.deepEqual(cache.resolve(row), row);
  assert.equal(cache.resolve({ ...row, operationId: "render.voice_story" }), null);
  assert.equal(cache.resolve({ ...row, requestDigest: "r2" }), null);
  assert.equal(cache.snapshot().length, 1);
});

test("D2415 preserves production-local implementation in origins and cache", () => {
  const local = { operationId: "evidence.tablebase_probe", stageId: "probe", instanceId: "tablebase-primary", implementation: "local_service", source: "local_service", ...base };
  assert.deepEqual(model.parseAcquisitionReceipt(local), local);
  assert.throws(() => model.parseAcquisitionReceipt({ ...local, source: "provider_live" }), /SOURCE_MISMATCH/u);
  assert.deepEqual(model.parseAcquisitionReceipt({ ...local, source: "cached_exact", cacheKeyDigest: "key", original: local }).original.implementation, "local_service");
});

test("D2416 represents TTS only as three conditional audio stages", () => {
  assert.equal(model.PROVIDER_OPERATION_EXECUTION.some((row) => row.operationId === "render.tts"), false);
  const audio = model.PROVIDER_OPERATION_EXECUTION.flatMap((row) => row.stages.map((stage) => ({ operationId: row.operationId, ...stage }))).filter((stage) => stage.instanceId === "external-tts");
  assert.equal(audio.length, 3);
  assert.ok(audio.every((stage) => stage.stageId === "audio" && stage.when === "audio_requested"));
});

test("D2417 shares Lichess backoff without sharing instance identity", () => {
  const declarations = model.PROVIDER_INSTANCE_DECLARATIONS.filter((row) => row.backoffGroup === "lichess-api");
  assert.deepEqual(declarations.map((row) => row.instanceId), ["tablebase-primary", "explorer-primary"]);
  const coordinator = new model.ProviderBackoffCoordinator();
  assert.equal(coordinator.admit("lichess-api", 0), true);
  assert.equal(coordinator.admit("lichess-api", 0), false);
  coordinator.rateLimited("lichess-api", 1, 30_000);
  assert.equal(coordinator.admit("lichess-api", 60_000), false);
  assert.equal(coordinator.admit("lichess-api", 60_001), true);
});

test("the repaired RFC closes every returned vocabulary and remains implementation-gated", () => {
  for (const token of ["ProviderBackoffGroupId", 'state: "recovering"', "requestDigest", "resolveExact", "local_service", "render.tts", "eight operations"]) assert.match(rfc, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  assert.match(rfc, /third author repair complete 2026-09-02/u);
  assert.match(rfc, /Neither implementation checkpoint is authorized/u);
});

test("operation and instance declarations are set-closed rather than counted in prose", () => {
  const mutated = model.PROVIDER_OPERATION_EXECUTION.slice(1);
  assert.equal(mutated.length, 7);
  assert.equal(new Set(mutated.map((row) => row.operationId)).size, 7);
  assert.equal(model.PROVIDER_INSTANCE_DECLARATIONS.length, 7);
});
