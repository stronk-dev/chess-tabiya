import { describe, expect, it } from "vitest";
import {
  APPLICATION_OPERATIONS,
  AtomicExactCache,
  acquireLease,
  changeGeneration,
  changeOpponent,
  circuitFailure,
  circuitSuccess,
  claimHalfOpen,
  compileApplicationOperations,
  failOpponent,
  renewLease,
  requireSealedText,
  retryOpponent,
  sealRenderedText,
  settleLease,
  settleOperation,
  type BackoffLeaseState,
  type CacheKey,
  type ExchangeDelivery,
  type OpponentRecoveryState,
  type ProviderCircuitState,
} from "./contract.js";

describe("provider-health fourth author repair", () => {
  it("D2575-D2578 compiles the complete application census onto provider-exchange identities", () => {
    expect(compileApplicationOperations(APPLICATION_OPERATIONS)).toHaveLength(10);
    expect(APPLICATION_OPERATIONS.find((row) => row.operationId === "review.reasoning")?.stages[0]?.exchangeOperation).toBe("external_voice.reasoning_review@1");
    expect(APPLICATION_OPERATIONS.find((row) => row.operationId === "render.speech")?.stages.map((stage) => stage.exchangeOperation)).toEqual(["external_tts.synthesize@1"]);
    const replaced = APPLICATION_OPERATIONS.map((row, index) => index === 0 ? { ...row, operationId: "opponent.unowned_side_door" as never } : row);
    expect(() => compileApplicationOperations(replaced)).toThrow(/SET_MISMATCH/);
    const crossed = APPLICATION_OPERATIONS.map((row, index) => index === 0 ? { ...row, stages: [{ ...row.stages[0]!, instanceId: "stockfish-analysis" as const }] } : row);
    expect(() => compileApplicationOperations(crossed)).toThrow(/INSTANCE_MISMATCH/);
    const speechWithVoice = APPLICATION_OPERATIONS.map((row) => row.operationId === "render.speech" ? { ...row, stages: APPLICATION_OPERATIONS.find((candidate) => candidate.operationId === "render.voice")!.stages } : row);
    expect(() => compileApplicationOperations(speechWithVoice)).toThrow();
  });

  it("D2579 uses monotonic window operands, transient qualification and generation reset", () => {
    let state: ProviderCircuitState = { state: "available", generation: "g1", transientOpenTimes: [] };
    state = circuitFailure(state, "network", 0);
    state = claimHalfOpen(state, 5_000, "a");
    state = circuitSuccess(state, 5_001, "a");
    expect(state.state).toBe("available");
    state = circuitFailure(state, "network", 400_000);
    state = claimHalfOpen(state, 405_000, "b");
    state = circuitSuccess(state, 405_001, "b");
    expect(state.state).toBe("available");
    state = circuitFailure(state, "timeout", 410_000);
    state = claimHalfOpen(state, 415_000, "c");
    state = circuitSuccess(state, 415_001, "c");
    expect(state.state).toBe("recovering");
    state = circuitSuccess(state, 415_002);
    expect(state.state).toBe("available");
    expect(changeGeneration(state, "g2")).toEqual({ state: "unverified", generation: "g2", transientOpenTimes: [] });
    const auth = circuitFailure(state, "authentication", 500_000);
    expect(auth.state === "open" && auth.retryAtMonotonic).toBeNull();
  });

  it("D2580 expires leases and rejects renewal or settlement by stale tokens", () => {
    const empty: BackoffLeaseState = { blockedUntilMonotonic: 0, claim: null };
    const first = acquireLease(empty, 0, "explorer:g1|tablebase:g1", "a", 100);
    expect(first.kind).toBe("acquired");
    if (first.kind !== "acquired") throw new Error("fixture");
    expect(acquireLease(first.state, 50, "same", "b", 100).kind).toBe("claimed");
    expect(() => renewLease(first.state, 50, "wrong", "a", 100)).toThrow(/STALE/);
    const renewed = renewLease(first.state, 50, "explorer:g1|tablebase:g1", "a", 100);
    const successor = acquireLease(renewed, 151, "explorer:g1|tablebase:g1", "b", 100);
    expect(successor.kind).toBe("acquired");
    if (successor.kind !== "acquired") throw new Error("fixture");
    expect(() => settleLease(successor.state, 152, "explorer:g1|tablebase:g1", "a", null)).toThrow(/STALE/);
    expect(settleLease(successor.state, 152, "explorer:g1|tablebase:g1", "b", 1).blockedUntilMonotonic).toBe(60_152);
  });

  it("D2581 atomically resolves immutable cached value, original delivery and service receipt", () => {
    const cache = new AtomicExactCache<{ move: string }>();
    const key: CacheKey = { operation: "maia.policy_page@1", generation: "g1", requestDigest: "r1", keyDigest: "k1" };
    const original: ExchangeDelivery<{ move: string }> = { operation: "maia.policy_page@1", normalizedRequestDigest: "r1", generation: "g1", payload: { move: "e7e5" } };
    cache.put(key, original.payload, original, 100);
    const hit = cache.resolve(key, 99);
    expect(hit).toMatchObject({ kind: "hit", value: { move: "e7e5" }, original, cacheReceipt: { source: "retained_exact", keyDigest: "k1" } });
    expect(Object.isFrozen(hit)).toBe(true);
    expect(cache.resolve(key, 100)).toEqual({ kind: "miss" });
  });

  it("D2582 retries or changes policy after the committed learner ply without replaying it", () => {
    const pending = Object.freeze({ runId: "r", learnerMoveEventSeq: 7, afterFen: "fen-after", requestDigest: "request-a", policyDigest: "policy-a" });
    let state: OpponentRecoveryState = Object.freeze({ state: "waiting", pending, attempt: 1 });
    state = failOpponent(state, 8, "network");
    const retried = retryOpponent(state, "request-a");
    expect(retried.state === "waiting" && retried.pending).toBe(pending);
    expect(() => retryOpponent(state, "crossed")).toThrow(/IDENTITY/);
    const changed = changeOpponent(state, "policy-b", "request-b");
    expect(changed).toMatchObject({ state: "waiting", pending: { learnerMoveEventSeq: 7, afterFen: "fen-after", policyDigest: "policy-b", requestDigest: "request-b" }, attempt: 1 });
  });

  it("D2583 retains ordered per-stage settlements and derives fallback without erasing failure", () => {
    const voice = APPLICATION_OPERATIONS.find((row) => row.operationId === "render.voice")!;
    const outcome = settleOperation(voice, [{ kind: "failed", stageId: "text", reason: "timeout" }], "deterministic");
    expect(outcome).toEqual({ kind: "fallback", value: "deterministic", settlements: [{ kind: "failed", stageId: "text", reason: "timeout" }], source: "deterministic_renderer" });
    expect(() => settleOperation(voice, [{ kind: "failed", stageId: "wrong", reason: "timeout" }], "x")).toThrow(/ORDER/);
    const sealed = sealRenderedText({ textDigest: "sha256:text", runId: "r", nodeId: "n", scope: "compare" });
    expect(requireSealedText(sealed)).toBe(sealed);
    expect(() => requireSealedText({ ...sealed })).toThrow(/NOT_SEALED/);
  });
});
