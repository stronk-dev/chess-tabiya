import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import { APPLICATION_CONSUMER_DECLARATIONS } from "../d2753-provider-health-fifth-author-repair/application-consumers.js";
import {
  AtomicExactCache,
  BackoffCoordinator,
  OpponentRecoveryStore,
  ProviderExchangeHarness,
  ProviderHealthRegistry,
  cacheKey,
  compileApplicationOperations,
  createOpponentRecoveryDatabase,
  providerGenerationSet,
  seedCommittedLearnerPly,
} from "../d2753-provider-health-fifth-author-repair/contract.js";

describe("provider-health fifth repair fresh-review returns", () => {
  test("D2815 first success after repeated opens bypasses recovering 1/2", () => {
    const exchange = new ProviderExchangeHarness();
    const registry = new ProviderHealthRegistry([{ instanceId: "maia-inference", generation: "g1" }]);
    const request = exchange.request("maia.policy_page@1", "g1", "request");
    const failure = exchange.failure(request, "timeout");
    registry.recordFailure(request, failure, 1);
    registry.recordFailure(request, failure, 2);
    registry.recordSuccess(request, exchange.success(request, { move: "e7e5" }, "response"), 3);
    const state = registry.snapshot().instances[0];
    expect(state?.state).toBe("available");
    expect("consecutiveSuccesses" in (state ?? {})).toBe(false);
  });

  test("D2816 shallow mutable declarations mint arbitrary compiled consumer semantics", () => {
    const row = APPLICATION_CONSUMER_DECLARATIONS[0] as unknown as {
      consumer: string;
      stageId: string;
      fallback: string;
    };
    const prior = { consumer: row.consumer, stageId: row.stageId, fallback: row.fallback };
    expect(Object.isFrozen(row)).toBe(false);
    try {
      row.consumer = "attacker.consumer";
      row.stageId = "";
      row.fallback = "attacker_fallback";
      expect(compileApplicationOperations()[0]).toMatchObject({
        consumer: "attacker.consumer",
        stages: [{ stageId: "", fallback: "attacker_fallback" }],
      });
    } finally {
      Object.assign(row, prior);
    }
  });

  test("D2817 every compiled pipeline is structurally forced to one unconditional dependency-free stage", () => {
    const compiled = compileApplicationOperations();
    expect(compiled.every((operation) => operation.stages.length === 1)).toBe(true);
    expect(compiled.every((operation) => !("dependsOn" in operation.stages[0]!) && !("when" in operation.stages[0]!))).toBe(true);
  });

  test("D2818 the coordinator exposes no lease renewal operation", () => {
    const coordinator = new BackoffCoordinator();
    expect("renew" in coordinator).toBe(false);
    const registry = new ProviderHealthRegistry([{ instanceId: "explorer-primary", generation: "g1" }]);
    const generations = providerGenerationSet(registry.snapshot(), ["explorer-primary"]);
    expect(coordinator.acquire(0, generations, 10)).toMatchObject({ kind: "acquired" });
    expect(coordinator.acquire(11, generations, 10)).toMatchObject({ kind: "acquired" });
  });

  test("D2819 valid exact cache and generation change never join the health snapshot", () => {
    const exchange = new ProviderExchangeHarness();
    const registry = new ProviderHealthRegistry([{ instanceId: "maia-inference", generation: "g1" }]);
    const request = exchange.request("maia.policy_page@1", "g1", "request");
    const delivery = exchange.success(request, { move: "e7e5" }, "response");
    const cache = new AtomicExactCache<{ move: string }>();
    const key = cacheKey(delivery, "key");
    cache.put(key, delivery, 10_000, 0);
    registry.recordFailure(request, exchange.failure(request, "timeout"), 1);
    expect(registry.snapshot().instances[0]?.state).toBe("unavailable");
    registry.changeGeneration("maia-inference", "g2");
    expect(cache.resolve(key, 2)).toMatchObject({ kind: "hit", value: { move: "e7e5" } });
  });

  test("D2820 a stale learner ply accepts a new opponent failure", () => {
    const path = join(mkdtempSync(join(tmpdir(), "tabiya-health-review-")), "recovery.sqlite");
    const db = createOpponentRecoveryDatabase(path);
    seedCommittedLearnerPly(db, { runId: "run", eventSeq: 7, afterFen: "old", requestDigest: "old-request", policyDigest: "policy" });
    seedCommittedLearnerPly(db, { runId: "run", eventSeq: 9, afterFen: "new", requestDigest: "new-request", policyDigest: "policy" });
    const store = new OpponentRecoveryStore(db);
    expect(() => store.fail("run", 7, 10, "timeout")).not.toThrow();
    expect(store.state("run")).toMatchObject({ learner_event_seq: 7, request_digest: "old-request" });
    db.close();
  });

  test("D2821 an old retry key is accepted after a newer failure on the same run", () => {
    const path = join(mkdtempSync(join(tmpdir(), "tabiya-health-review-")), "recovery.sqlite");
    const db = createOpponentRecoveryDatabase(path);
    seedCommittedLearnerPly(db, { runId: "run", eventSeq: 7, afterFen: "fen", requestDigest: "request", policyDigest: "policy" });
    const store = new OpponentRecoveryStore(db);
    store.fail("run", 7, 8, "timeout");
    store.retry("run", "retry-key");
    store.fail("run", 7, 10, "timeout");
    expect(() => store.retry("run", "retry-key")).not.toThrow();
    expect(store.state("run")).toMatchObject({ state: "failed", failure_event_seq: 10 });
    db.close();
  });

  test("D2822 change accepts caller-authored policy and request identities", () => {
    const path = join(mkdtempSync(join(tmpdir(), "tabiya-health-review-")), "recovery.sqlite");
    const db = createOpponentRecoveryDatabase(path);
    seedCommittedLearnerPly(db, { runId: "run", eventSeq: 7, afterFen: "fen", requestDigest: "request", policyDigest: "policy" });
    const store = new OpponentRecoveryStore(db);
    store.fail("run", 7, 8, "timeout");
    expect(() => store.change("run", "change-key", "attacker-policy-digest", "attacker-request-digest")).not.toThrow();
    expect(store.state("run")).toMatchObject({ policy_digest: "attacker-policy-digest", request_digest: "attacker-request-digest" });
    db.close();
  });
});
