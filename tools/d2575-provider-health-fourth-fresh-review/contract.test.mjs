// DISPOSABLE fresh-review falsifiers for D2575-D2583. Not production code.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { transformSync } from "esbuild";

const modelSource = readFileSync("tools/d2412-provider-health-third-author-repair/model.ts", "utf8");
const loadModel = async (source) => {
  const compiled = transformSync(source, { format: "esm", loader: "ts", target: "es2022" }).code;
  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
};
const model = await loadModel(modelSource);
const rfc = readFileSync("rfc/provider-health-degradation.md", "utf8");
const exchange = readFileSync("rfc/provider-exchange-and-execution.md", "utf8");
const externalVoice = readFileSync("apps/server/src/external-voice.ts", "utf8");
const rest = readFileSync("apps/server/src/rest.ts", "utf8");
const controller = readFileSync("apps/web/src/lib/session-controller.ts", "utf8");

function section(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `missing ${start}`);
  assert.notEqual(to, -1, `missing ${end}`);
  return source.slice(from, to);
}

test("D2575 live reasoning-review egress is absent from the closed operation map", () => {
  assert.match(externalVoice, /async review\(request: ReasoningReviewRequest\)/u);
  assert.match(rest, /reasoningReviewProvider\.review\(reviewRequest\)/u);
  assert.equal(model.PROVIDER_OPERATION_EXECUTION.some((row) => row.operationId.includes("reasoning")), false);
});

test("D2576 production requests speech independently from the declared voice pipeline", () => {
  assert.match(rfc, /no caller requests TTS independently/u);
  const speech = section(rest, 'if \(route\.action === "speech"\)', 'if \(route\.action === "share"\)');
  assert.match(speech, /ttsProvider\.synthesize\(checkedText\)/u);
  assert.match(speech, /await renderVoice/u);
  assert.doesNotMatch(speech, /scope !== "compare"/u);
  assert.equal(model.PROVIDER_OPERATION_EXECUTION.filter((row) => row.stages.some((stage) => stage.instanceId === "external-tts")).length, 3);
});

test("D2577 count-preserving operation replacement passes the advertised closure", async () => {
  const crossed = await loadModel(modelSource.replace('operationId: "opponent.stockfish_play"', 'operationId: "opponent.unowned_side_door"'));
  assert.doesNotThrow(() => crossed.assertProviderClosure());
  assert.doesNotMatch(modelSource, /consumer:|dependsOn:|fallback:|deadline:/u);
});

test("D2578 health and provider exchange publish incompatible same-named authorities", () => {
  for (const name of ["ProviderOperationId", "ProviderAcquisitionReceipt"]) {
    assert.match(rfc, new RegExp(`(?:type|interface) ${name}`, "u"));
    assert.match(exchange, new RegExp(`(?:type|interface) ${name}`, "u"));
  }
  assert.match(rfc, /"opponent\.stockfish_play"/u);
  assert.match(exchange, /"stockfish\.legal_root_table@1"/u);
  assert.doesNotMatch(rfc, /ProviderExchangeOperation|ProviderProtocolOperation/u);
});

test("D2579 recovery counts failures without the declared five-minute operand", () => {
  let state = { state: "available", generation: "g1" };
  state = model.reduceRecovery(state, { kind: "failure", reason: "network" });
  state = model.reduceRecovery(state, { kind: "failure", reason: "network" });
  state = model.reduceRecovery(state, { kind: "success" });
  assert.equal(state.state, "recovering");
  assert.equal(model.reduceRecovery.length, 2);
  const unavailable = section(rfc, 'readonly state: "unavailable"', "type ProviderOperationAvailability");
  assert.doesNotMatch(unavailable, /opensInWindow|openedAt|windowStartedAt/u);
});

test("D2580 the backoff latch neither expires nor protects a newer claim from stale release", () => {
  const coordinator = new model.ProviderBackoffCoordinator();
  assert.equal(coordinator.admit("lichess-api", 0), true);
  assert.equal(coordinator.admit("lichess-api", Number.MAX_SAFE_INTEGER), false);
  coordinator.complete("lichess-api");
  assert.equal(coordinator.admit("lichess-api", 1), true);
  coordinator.complete("lichess-api"); // indistinguishable stale completion
  assert.equal(coordinator.admit("lichess-api", 1), true);
});

test("D2581 exact cache stores identity but cannot atomically return value plus origin", () => {
  const cache = new model.ExactProviderCache();
  const identity = { operationId: "render.voice", stageId: "text", instanceId: "external-voice", generation: "g1", requestDigest: "r1", cacheKeyDigest: "k1" };
  cache.put(identity);
  assert.deepEqual(cache.resolve(identity), identity);
  assert.equal("value" in cache.resolve(identity), false);
  assert.equal("original" in cache.resolve(identity), false);
});

test("D2582 opponent failure has only a raw error state and no retry/change transition", () => {
  const opponent = section(controller, "async #playOpponentIfNeeded", "#selectionRequest");
  assert.match(opponent, /await this\.#api\.selectMove/u);
  assert.doesNotMatch(controller, /retryOpponent|changeOpponent|opponentFailure/u);
  assert.match(controller, /error: sessionErrorMessage\(error\)/u);
  assert.match(rfc, /offers Retry or Change opponent/u);
});

test("D2583 operation result distributes across one stage instead of settling the pipeline", () => {
  const algebra = section(rfc, "type ProviderOperationResult", "### 5. Operation deadlines and cancellation");
  assert.match(algebra, /R extends ProviderOperationStageRoute/u);
  assert.doesNotMatch(algebra, /stageResults|settlements|readonly stages/u);
  assert.equal(model.PROVIDER_OPERATION_EXECUTION.find((row) => row.operationId === "render.voice").stages.length, 2);
});
