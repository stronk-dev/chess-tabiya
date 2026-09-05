import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import {
  APPLICATION_PROVIDER_OPERATION_IDS,
  AtomicExactCache,
  BackoffCoordinator,
  OpponentRecoveryStore,
  ProviderExchangeHarness,
  ProviderHealthRegistry,
  assertProviderReleaseReceipt,
  cacheKey,
  compileApplicationOperations,
  createOpponentRecoveryDatabase,
  recordDisplayedText,
  renderAdmittedEvidence,
  providerGenerationSet,
  requireSealedText,
  seedCommittedLearnerPly,
  selectProfileAvailability,
  settleOperation,
} from "./contract.js";

describe("provider-health fifth author repair", () => {
  test("D2753/D2762 exports one current sealed checkpoint snapshot, outcome, selector and release authority", () => {
    const registry = new ProviderHealthRegistry([{ instanceId: "maia-inference", generation: "maia-g1" }]);
    const snapshot = registry.snapshot();
    expect(selectProfileAvailability(snapshot, "opponent.maia_inference").state).toBe("requestable_unverified");
    const receipt = registry.releaseReceipt(snapshot);
    expect(() => assertProviderReleaseReceipt(receipt)).not.toThrow();
    expect(() => selectProfileAvailability({ ...snapshot }, "opponent.maia_inference")).toThrow(/NOT_SEALED/);
    registry.changeGeneration("maia-inference", "maia-g2");
    expect(() => registry.releaseReceipt(snapshot)).toThrow(/STALE_OR_CROSSED/);
    const other = new ProviderHealthRegistry([{ instanceId: "maia-inference", generation: "maia-g1" }]);
    expect(() => registry.releaseReceipt(other.snapshot())).toThrow(/STALE_OR_CROSSED/);
    const exchange = new ProviderExchangeHarness();
    const request = exchange.request("maia.policy_page@1", "maia-g1", "request-1");
    const delivery = exchange.success(request, { move: "e7e5" }, "response-1");
    const declaration = compileApplicationOperations().find((row) => row.operationId === "opponent.maia_inference")!;
    expect(settleOperation(declaration, [{ kind: "success", stageId: "select", request, delivery }])).toMatchObject({ kind: "complete", value: { move: "e7e5" } });
  });

  test("D2754 consumer declarations are a separate exact input to the compiler", () => {
    expect(compileApplicationOperations().map((row) => row.operationId)).toEqual(APPLICATION_PROVIDER_OPERATION_IDS);
    expect(compileApplicationOperations().every((row) => Object.isFrozen(row))).toBe(true);
    expect(() => settleOperation({ ...compileApplicationOperations()[0]! }, [])).toThrow(/NOT_COMPILED/);
  });

  test("D2755 speech receives only an F1-rendered and displayed text identity", () => {
    const rendered = renderAdmittedEvidence("evidence-1", "The knight is pinned.");
    const displayed = recordDisplayedText(rendered, "run-1", "node-1", "compare");
    expect(requireSealedText(displayed)).toBe(displayed);
    expect(() => recordDisplayedText({ ...rendered }, "run-1", "node-1", "compare")).toThrow(/NOT_SEALED/);
    expect(() => requireSealedText({ ...displayed })).toThrow(/NOT_SEALED/);
  });

  test("D2756 cache joins delivery subject, returns its payload and evicts at 512", () => {
    const exchange = new ProviderExchangeHarness();
    const cache = new AtomicExactCache<{ move: string }>();
    let firstKey: ReturnType<typeof cacheKey> | undefined;
    for (let index = 0; index < 513; index += 1) {
      const request = exchange.request("maia.policy_page@1", "maia-g1", `request-${index}`);
      const delivery = exchange.success(request, { move: `move-${index}` }, `response-${index}`);
      const key = cacheKey(delivery, `key-${index}`);
      if (index === 0) firstKey = key;
      cache.put(key, delivery, 10_000, 0);
    }
    expect(cache.resolve(firstKey!, 1)).toEqual({ kind: "miss" });
    const request = exchange.request("maia.policy_page@1", "maia-g1", "exact-request");
    const delivery = exchange.success(request, { move: "e7e5" }, "exact-response");
    const key = cacheKey(delivery, "exact-key");
    expect(() => cache.put({ ...key, generation: "crossed" }, delivery, 10_000, 0)).toThrow(/SUBJECT_MISMATCH/);
    cache.put(key, delivery, 10_000, 0);
    expect(cache.resolve(key, 1)).toMatchObject({ kind: "hit", value: { move: "e7e5" }, original: delivery });
  });

  test("D2757 settlement rejects structural and crossed provider deliveries", () => {
    const exchange = new ProviderExchangeHarness();
    const declaration = compileApplicationOperations().find((row) => row.operationId === "evidence.stockfish_analysis")!;
    const wrongRequest = exchange.request("maia.policy_page@1", "maia-g1", "request");
    const wrongDelivery = exchange.success(wrongRequest, "wrong", "response");
    expect(() => settleOperation(declaration, [{ kind: "success", stageId: "analyse", request: wrongRequest, delivery: wrongDelivery }])).toThrow(/SUBJECT_MISMATCH/);
    const rightRequest = exchange.request("stockfish.position_evaluation@1", "sf-g1", "request");
    const rightDelivery = exchange.success(rightRequest, "right", "response");
    expect(() => settleOperation(declaration, [{ kind: "success", stageId: "analyse", request: rightRequest, delivery: { ...rightDelivery } }])).toThrow(/NOT_SEALED/);
  });

  test("D2758 only a sealed current-generation exchange result changes health", () => {
    const exchange = new ProviderExchangeHarness();
    const registry = new ProviderHealthRegistry([{ instanceId: "maia-inference", generation: "maia-g1" }]);
    const request = exchange.request("maia.policy_page@1", "maia-g1", "request");
    const delivery = exchange.success(request, {}, "response");
    expect(() => registry.recordSuccess(request, { ...delivery }, 1)).toThrow(/NOT_SEALED/);
    expect(() => registry.recordSuccess(request, delivery, -1)).toThrow(/TIME_INVALID/);
    registry.recordSuccess(request, delivery, 1);
    expect(selectProfileAvailability(registry.snapshot(), "opponent.maia_inference").state).toBe("available");
    registry.changeGeneration("maia-inference", "maia-g2");
    expect(() => registry.recordSuccess(request, delivery, 2)).toThrow(/GENERATION_STALE/);
  });

  test("D2759/D2763 a sealed generation change releases the old lease while stale completion fails", () => {
    const coordinator = new BackoffCoordinator();
    const registry = new ProviderHealthRegistry([{ instanceId: "explorer-primary", generation: "generation-1" }]);
    const generation1 = providerGenerationSet(registry.snapshot(), ["explorer-primary"]);
    const first = coordinator.acquire(0, generation1, 100);
    expect(first.kind).toBe("acquired");
    expect(() => coordinator.acquire(1, { ...generation1 }, 100)).toThrow(/NOT_SEALED/);
    registry.changeGeneration("explorer-primary", "generation-2");
    const generation2 = providerGenerationSet(registry.snapshot(), ["explorer-primary"]);
    const second = coordinator.acquire(1, generation2, 100);
    expect(second.kind).toBe("acquired");
    if (first.kind !== "acquired" || second.kind !== "acquired") throw new Error("fixture");
    expect(() => coordinator.settle(2, generation1, first.token, null)).toThrow(/STALE/);
    expect(() => coordinator.settle(-1, generation2, second.token, null)).toThrow(/TIME_INVALID/);
    expect(() => coordinator.settle(2, generation2, second.token, -1)).toThrow(/RETRY_AFTER_INVALID/);
  });

  test("D2760/D2764 opponent failure and recovery reload from one exact durable command subject", () => {
    const path = join(mkdtempSync(join(tmpdir(), "tabiya-provider-health-")), "recovery.sqlite");
    let db = createOpponentRecoveryDatabase(path);
    seedCommittedLearnerPly(db, { runId: "run-1", eventSeq: 7, afterFen: "fen-after", requestDigest: "request-1", policyDigest: "policy-1" });
    new OpponentRecoveryStore(db).fail("run-1", 7, 8, "timeout");
    db.close();
    db = createOpponentRecoveryDatabase(path);
    const restarted = new OpponentRecoveryStore(db);
    expect(restarted.state("run-1")).toMatchObject({ state: "failed", learner_event_seq: 7, request_digest: "request-1" });
    restarted.retry("run-1", "retry-1");
    restarted.retry("run-1", "retry-1");
    expect(restarted.state("run-1")).toMatchObject({ state: "waiting", attempt: 2, request_digest: "request-1", policy_digest: "policy-1" });
    expect(() => restarted.fail("missing-run", 7, 8, "timeout")).toThrow(/PLY_MISSING/);
    seedCommittedLearnerPly(db, { runId: "run-2", eventSeq: 7, afterFen: "other-fen", requestDigest: "request-2", policyDigest: "policy-2" });
    restarted.fail("run-2", 7, 8, "timeout");
    expect(() => restarted.retry("run-2", "retry-1")).toThrow(/IDEMPOTENCY_CROSSED/);
    db.close();
  });
});
