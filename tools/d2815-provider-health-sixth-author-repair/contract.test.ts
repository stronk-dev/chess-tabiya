import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import {
  APPLICATION_DECLARATIONS,
  ExactCache,
  ExchangeAuthority,
  ProviderHealthAuthority,
  RecoveryAuthority,
  RenewableBackoffCoordinator,
  appendRunEvent,
  compileApplicationOperations,
  createRecoveryDatabase,
  generationSet,
} from "./contract.js";

describe("provider-health sixth author repair", () => {
  test("D2815 one state authority preserves not-configured, recovering and available", () => {
    const exchange = new ExchangeAuthority();
    const authority = new ProviderHealthAuthority([{ instanceId: "maia-inference", generation: "g1" }]);
    const request = exchange.request("maia.policy_page@1", "maia-inference", "g1", "request");
    const failure = exchange.failure(request, "timeout");
    authority.failure(request, failure, 1); authority.failure(request, failure, 2);
    authority.success(request, exchange.success(request, { move: "e7e5" }, "response-1"), 3);
    expect(authority.snapshot(3).find((row) => row.instanceId === "maia-inference")).toMatchObject({ state: "recovering", consecutiveSuccesses: 1, requiredSuccesses: 2 });
    authority.success(request, exchange.success(request, { move: "e7e5" }, "response-2"), 4);
    expect(authority.snapshot(4).find((row) => row.instanceId === "maia-inference")?.state).toBe("available");
    expect(authority.snapshot(4).find((row) => row.instanceId === "external-tts")?.state).toBe("not_configured");
  });

  test("D2816 declarations are deeply immutable and semantic replacements fail", () => {
    expect(Object.isFrozen(APPLICATION_DECLARATIONS[0])).toBe(true);
    expect(Object.isFrozen(APPLICATION_DECLARATIONS[0]?.stages[0])).toBe(true);
    const changed = structuredClone(APPLICATION_DECLARATIONS) as unknown as Array<{ consumer: string; stages: Array<{ stageId: string; instanceId: string; exchangeOperation: string; dependsOn: string[]; when: string; fallback: string }> }>;
    changed[0]!.consumer = "attacker.consumer";
    expect(() => compileApplicationOperations(changed)).toThrow(/SEMANTICS_MISMATCH/);
    expect(compileApplicationOperations()).toHaveLength(10);
  });

  test("D2817 dependency grammar is executable before exact semantic closure", () => {
    const changed = structuredClone(APPLICATION_DECLARATIONS) as unknown as Array<{ consumer: string; stages: Array<{ stageId: string; instanceId: string; exchangeOperation: string; dependsOn: string[]; when: string; fallback: string }> }>;
    changed[0]!.stages = [{ ...changed[0]!.stages[0]!, dependsOn: ["later"] }, { ...changed[0]!.stages[0]!, stageId: "later", dependsOn: [] }];
    expect(() => compileApplicationOperations(changed)).toThrow(/DEPENDENCY_FORWARD_OR_MISSING/);
  });

  test("D2818 a live generation lease renews and stale expiry cannot settle", () => {
    const authority = new ProviderHealthAuthority([{ instanceId: "explorer-primary", generation: "g1" }]);
    const generations = generationSet(authority.snapshot(0));
    const coordinator = new RenewableBackoffCoordinator();
    const claim = coordinator.acquire(0, generations, 10);
    if (claim.kind !== "acquired") throw new Error("fixture");
    coordinator.renew(9, generations, claim.token, 10);
    expect(() => coordinator.settle(18, generations, claim.token)).not.toThrow();
    const next = coordinator.acquire(20, generations, 5);
    if (next.kind !== "acquired") throw new Error("fixture");
    coordinator.expire(25);
    expect(() => coordinator.settle(25, generations, next.token)).toThrow(/STALE/);
  });

  test("D2819 exact cache derives degraded state and generation change invalidates it", () => {
    const exchange = new ExchangeAuthority();
    const authority = new ProviderHealthAuthority([{ instanceId: "maia-inference", generation: "g1" }]);
    const cache = new ExactCache<{ move: string }>(authority);
    const request = exchange.request("maia.policy_page@1", "maia-inference", "g1", "request");
    const delivery = exchange.success(request, { move: "e7e5" }, "response");
    cache.put(delivery, 100, 0);
    authority.failure(request, exchange.failure(request, "timeout"), 1);
    expect(authority.snapshot(2).find((row) => row.instanceId === "maia-inference")).toMatchObject({ state: "degraded_cached_only", validExactEntries: 1 });
    authority.changeGeneration("maia-inference", "g2");
    expect(cache.resolve(request, 3)).toEqual({ kind: "miss" });
  });

  test("D2820 failure must attach to the exact current learner tail", () => {
    const db = createRecoveryDatabase(join(mkdtempSync(join(tmpdir(), "tabiya-health-repair-")), "db.sqlite"));
    appendRunEvent(db, { runId: "run", eventSeq: 7, type: "learner.ply", afterFen: "old", requestDigest: "old-request", policyDigest: "policy" });
    appendRunEvent(db, { runId: "run", eventSeq: 8, type: "opponent.move", afterFen: "reply", requestDigest: "reply-request", policyDigest: "policy" });
    appendRunEvent(db, { runId: "run", eventSeq: 9, type: "learner.ply", afterFen: "new", requestDigest: "new-request", policyDigest: "policy" });
    const recovery = new RecoveryAuthority(db);
    expect(() => recovery.fail({ runId: "run", learnerEventSeq: 7, failureEventSeq: 10, reason: "timeout" })).toThrow(/CURRENT_LEARNER_TAIL/);
    expect(() => recovery.fail({ runId: "run", learnerEventSeq: 9, failureEventSeq: 10, reason: "timeout" })).not.toThrow();
    db.close();
  });

  test("D2821 retry joins failure and request while exact replay returns its prior result", () => {
    const db = createRecoveryDatabase(join(mkdtempSync(join(tmpdir(), "tabiya-health-repair-")), "db.sqlite"));
    appendRunEvent(db, { runId: "run", eventSeq: 7, type: "learner.ply", afterFen: "fen", requestDigest: "request", policyDigest: "policy" });
    const recovery = new RecoveryAuthority(db);
    recovery.fail({ runId: "run", learnerEventSeq: 7, failureEventSeq: 8, reason: "timeout" });
    const input = { runId: "run", failureEventSeq: 8, requestDigest: "request", idempotencyKey: "key" } as const;
    const first = recovery.retry(input);
    expect(recovery.retry(input)).toEqual(first);
    expect(() => recovery.retry({ ...input, failureEventSeq: 10 })).toThrow(/IDEMPOTENCY_CROSSED/);
    db.close();
  });

  test("D2822 change parses policy and derives both policy and request digests", () => {
    const db = createRecoveryDatabase(join(mkdtempSync(join(tmpdir(), "tabiya-health-repair-")), "db.sqlite"));
    appendRunEvent(db, { runId: "run", eventSeq: 7, type: "learner.ply", afterFen: "fen", requestDigest: "request", policyDigest: "policy" });
    const recovery = new RecoveryAuthority(db);
    recovery.fail({ runId: "run", learnerEventSeq: 7, failureEventSeq: 8, reason: "timeout" });
    expect(() => recovery.change({ runId: "run", failureEventSeq: 8, idempotencyKey: "bad", opponentPolicy: { mode: "stockfish", skill: 99 } })).toThrow(/POLICY_INVALID/);
    const result = recovery.change({ runId: "run", failureEventSeq: 8, idempotencyKey: "good", opponentPolicy: { mode: "stockfish", skill: 8 } });
    expect(result.toPolicyDigest).toMatch(/^sha256:/);
    expect(result.requestDigest).toMatch(/^sha256:/);
    expect(result.requestDigest).not.toBe("request");
    db.close();
  });

  test("D2823 generation sets require the exact authority-issued snapshot", () => {
    const authority = new ProviderHealthAuthority([{ instanceId: "explorer-primary", generation: "g1" }]);
    const snapshot = authority.snapshot(0);
    expect(() => generationSet(structuredClone(snapshot))).toThrow(/SNAPSHOT_NOT_SEALED/);
    expect(() => generationSet(snapshot)).not.toThrow();
  });

  test("D2824 recovery reads tail and command preimages only after the immediate transaction begins", async () => {
    const source = await import("node:fs").then(({ readFileSync }) => readFileSync("tools/d2815-provider-health-sixth-author-repair/contract.ts", "utf8"));
    const failBody = source.slice(source.indexOf("fail(input:"), source.indexOf("retry(input:"));
    const recoverBody = source.slice(source.indexOf("#recover(action:"), source.indexOf("function parsePolicy"));
    expect(failBody.indexOf('this.db.exec("BEGIN IMMEDIATE")')).toBeLessThan(failBody.indexOf("SELECT * FROM run_events"));
    expect(recoverBody.indexOf('this.db.exec("BEGIN IMMEDIATE")')).toBeLessThan(recoverBody.indexOf("SELECT * FROM recovery_idempotency"));
    expect(recoverBody.indexOf('this.db.exec("BEGIN IMMEDIATE")')).toBeLessThan(recoverBody.indexOf("SELECT * FROM recovery_state"));
  });

  test("D2825 a late old-generation delivery cannot repopulate exact cache", () => {
    const exchange = new ExchangeAuthority();
    const authority = new ProviderHealthAuthority([{ instanceId: "maia-inference", generation: "g1" }]);
    const cache = new ExactCache<{ move: string }>(authority);
    const request = exchange.request("maia.policy_page@1", "maia-inference", "g1", "request");
    const delivery = exchange.success(request, { move: "e7e5" }, "response");
    authority.changeGeneration("maia-inference", "g2");
    expect(() => cache.put(delivery, 100, 1)).toThrow(/GENERATION_STALE/);
  });

  test("D2826 cache hits update LRU recency", () => {
    const exchange = new ExchangeAuthority();
    const authority = new ProviderHealthAuthority([{ instanceId: "maia-inference", generation: "g1" }]);
    const cache = new ExactCache<number>(authority);
    const requests = Array.from({ length: 513 }, (_, index) => exchange.request("maia.policy_page@1", "maia-inference", "g1", `request-${index}`));
    requests.slice(0, 512).forEach((request, index) => cache.put(exchange.success(request, index, `response-${index}`), 1000, 0));
    expect(cache.resolve(requests[0]!, 1).kind).toBe("hit");
    cache.put(exchange.success(requests[512]!, 512, "response-512"), 1000, 2);
    expect(cache.resolve(requests[0]!, 3).kind).toBe("hit");
    expect(cache.resolve(requests[1]!, 3).kind).toBe("miss");
  });

  test("D2827 generation change releases an old live claim before expiry", () => {
    const authority = new ProviderHealthAuthority([{ instanceId: "explorer-primary", generation: "g1" }]);
    const coordinator = new RenewableBackoffCoordinator();
    expect(coordinator.acquire(0, generationSet(authority.snapshot(0)), 100)).toMatchObject({ kind: "acquired" });
    authority.changeGeneration("explorer-primary", "g2");
    expect(coordinator.acquire(1, generationSet(authority.snapshot(1)), 100)).toMatchObject({ kind: "acquired" });
  });
});
