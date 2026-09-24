import { describe, expect, it } from "vitest";

import {
  ProviderRequestInvalid,
  assertProviderDelivery,
  assertProviderLocalDomainResult,
  type TypedProviderResult,
} from "@chess-tabiya/runtime";

import { ProviderExchangeScheduler, type ProviderOperationDescriptors } from "./provider-exchange.js";
import { ControlledFetch, FakeEngines, ManualClock, flush, syzygyBody } from "./provider-exchange.test-support.js";
import { providerOperationDescriptors } from "./provider-operations.js";

function harness(overrides: { maxActive?: number; maxQueued?: number; maxRetainedEntries?: number; maxRetainedWeight?: number; retentionTtlMs?: number; descriptors?: (base: ProviderOperationDescriptors) => ProviderOperationDescriptors } = {}) {
  const clock = new ManualClock();
  const engines = new FakeEngines();
  const tablebase = new ControlledFetch();
  const explorer = new ControlledFetch();
  const base = providerOperationDescriptors({ engines, tablebaseFetch: tablebase.fetch, explorerFetch: explorer.fetch, explorerToken: "token" });
  const scheduler = new ProviderExchangeScheduler({
    descriptors: overrides.descriptors?.(base) ?? base,
    maxActive: overrides.maxActive ?? 2,
    maxQueued: overrides.maxQueued ?? 4,
    maxRetainedEntries: overrides.maxRetainedEntries ?? 8,
    maxRetainedWeight: overrides.maxRetainedWeight ?? 1_000,
    retentionTtlMs: overrides.retentionTtlMs ?? 10_000,
    monotonicNowMs: clock.now,
    wallNow: clock.wall,
    timers: clock,
  });
  return { clock, engines, tablebase, explorer, scheduler };
}

const KQK = "8/8/8/8/8/8/3Q4/k1K5 w - - 0 1";
const KRK = "8/8/8/8/8/8/3R4/k1K5 w - - 0 1";
const KBK = "8/8/8/8/8/8/3B4/k1K5 w - - 0 1";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const syzygy = (fen: string, timeoutMs = 5_000) => ({ operation: "syzygy.position@1" as const, request: { rules: "chess" as const, variant: "standard" as const, fen, timeoutMs } });
const scope = (budgetMs = 10_000) => ({ id: "test", budgetMs });
const signal = () => new AbortController().signal;

describe("§4 shared scheduler", () => {
  it("returns every result under the one request-digest authority and refuses invalid requests before queueing", async () => {
    const { scheduler, tablebase } = harness();
    const digest = scheduler.normalizedRequestDigest(syzygy(KQK));
    const pending = scheduler.get(syzygy(KQK), scope(), signal());
    await flush();
    tablebase.respond(0, syzygyBody(KQK));
    const result = await pending;
    expect(result.kind).toBe("success");
    expect(result.normalizedRequestDigest).toBe(digest);
    if (result.kind === "success") expect(() => assertProviderDelivery("syzygy.position@1", result.delivery)).not.toThrow();
    await expect(scheduler.get({ operation: "syzygy.position@1", request: { ...syzygy(KQK).request, variant: "chess960" as never } }, scope(), signal())).rejects.toThrow(ProviderRequestInvalid);
    await expect(scheduler.get({ operation: "maia.policy_page@2", request: {} } as never, scope(), signal())).rejects.toThrow(ProviderRequestInvalid);
    await expect(scheduler.get(syzygy(KQK), { id: "t", budgetMs: 0 }, signal())).rejects.toThrow(/budgetMs/u);
    expect(tablebase.calls).toHaveLength(1);
  });

  it("answers more-than-seven pieces with a sealed local-domain result before any exchange", async () => {
    const { scheduler, tablebase } = harness();
    const result = await scheduler.get(syzygy(START), scope(), signal());
    expect(result.kind).toBe("local_domain_result");
    expect(() => assertProviderLocalDomainResult("syzygy.position@1", result)).not.toThrow();
    expect(result).not.toHaveProperty("delivery");
    expect(tablebase.calls).toHaveLength(0);
    expect(scheduler.stats()).toMatchObject({ pending: 0, retained: 0 });
  });

  it("coalesces exact keys, then serves one acquisition retained with a later servedAt", async () => {
    const { scheduler, tablebase, clock } = harness();
    const first = scheduler.get(syzygy(KQK), scope(), signal());
    const second = scheduler.get(syzygy(KQK), scope(), signal());
    const other = scheduler.get(syzygy(KQK, 4_000), scope(), signal());
    await flush();
    expect(tablebase.calls).toHaveLength(2); // a different timeout is a different request identity
    tablebase.respond(0, syzygyBody(KQK));
    const [a, b] = await Promise.all([first, second]);
    expect(a).toBe(b);
    tablebase.respond(1, syzygyBody(KQK));
    await other;
    clock.wallMs += 5_000;
    const retained = await scheduler.get(syzygy(KQK), scope(), signal());
    if (a.kind !== "success" || retained.kind !== "success") throw new Error("expected successes");
    expect(retained.delivery.kind).toBe("retained_exact");
    expect(retained.delivery.acquisition).toBe(a.delivery.acquisition);
    expect(retained.delivery.acquisition.retrievedAt).toBe(a.delivery.acquisition.retrievedAt);
    expect(retained.delivery.servedAt > a.delivery.servedAt).toBe(true);
    expect(tablebase.calls).toHaveLength(2);
  });

  it("settles crossed waiters independently; only the final departure aborts shared work", async () => {
    const { scheduler, tablebase, clock } = harness();
    const short = scheduler.get(syzygy(KQK), scope(100), signal());
    const long = scheduler.get(syzygy(KQK), scope(1_000), signal());
    const cancel = new AbortController();
    const cancelled = scheduler.get(syzygy(KQK), scope(1_000), cancel.signal);
    await flush();
    await clock.advance(150);
    expect((await short).kind === "source_failure" && (await short as { reason: string }).reason).toBe("deadline_exceeded");
    cancel.abort();
    expect(await cancelled).toMatchObject({ kind: "source_failure", reason: "cancelled" });
    expect(tablebase.calls[0]!.signal.aborted).toBe(false);
    tablebase.respond(0, syzygyBody(KQK));
    expect((await long).kind).toBe("success");

    // Final departure: the active job is aborted and its late result is dropped.
    const only = new AbortController();
    const lone = scheduler.get(syzygy(KRK), scope(), only.signal);
    await flush();
    only.abort();
    expect(await lone).toMatchObject({ reason: "cancelled" });
    expect(tablebase.calls[1]!.signal.aborted).toBe(true);
    expect(scheduler.stats()).toMatchObject({ pending: 0 });
  });

  it("rejects a full new-job queue, lets pending joins in without a slot, and drops cancelled queued work", async () => {
    const { scheduler, tablebase } = harness({ maxActive: 1, maxQueued: 1 });
    const active = scheduler.get(syzygy(KQK), scope(), signal());
    const queuedController = new AbortController();
    const queued = scheduler.get(syzygy(KRK), scope(), queuedController.signal);
    const joined = scheduler.get(syzygy(KQK), scope(), signal());
    const full = await scheduler.get(syzygy(KBK), scope(), signal());
    expect(full).toMatchObject({ kind: "source_failure", reason: "queue_full" });
    queuedController.abort();
    expect(await queued).toMatchObject({ reason: "cancelled" });
    await flush();
    tablebase.respond(0, syzygyBody(KQK));
    expect((await active).kind).toBe("success");
    expect((await joined).kind).toBe("success");
    await flush();
    expect(tablebase.calls).toHaveLength(1); // the cancelled queued job never executed
  });

  it("lets queue time consume the first arrival's execution timeout", async () => {
    const { scheduler, tablebase, clock } = harness({ maxActive: 1, maxQueued: 2 });
    const blocker = scheduler.get(syzygy(KQK, 60_000), scope(60_000), signal());
    const late = scheduler.get(syzygy(KRK, 500), scope(60_000), signal());
    await flush();
    await clock.advance(600);
    tablebase.respond(0, syzygyBody(KQK));
    await blocker;
    expect(await late).toMatchObject({ kind: "source_failure", reason: "deadline_exceeded" });
    expect(tablebase.calls).toHaveLength(1);
    // An active exchange past its execution timeout is aborted and reported, not retained.
    const slow = scheduler.get(syzygy(KBK, 300), scope(60_000), signal());
    await flush();
    await clock.advance(301);
    expect(await slow).toMatchObject({ reason: "deadline_exceeded" });
    expect(tablebase.calls[1]!.signal.aborted).toBe(true);
  });

  it("never retains failures and normalizes transport, identity and parse failures", async () => {
    const { scheduler, tablebase, engines } = harness();
    const failed = scheduler.get(syzygy(KQK), scope(), signal());
    await flush();
    tablebase.respond(0, { error: "busy" }, { status: 429 });
    expect(await failed).toMatchObject({ kind: "source_failure", reason: "provider_unavailable", providerDetail: "tablebase rate limited (429)" });
    const again = scheduler.get(syzygy(KQK), scope(), signal());
    await flush();
    expect(tablebase.calls).toHaveLength(2);
    tablebase.respond(1, syzygyBody(KQK), { headers: { etag: "\"a\", \"b\"" }, etag: null });
    expect(await again).toMatchObject({ reason: "invalid_response" });
    const broken = scheduler.get(syzygy(KQK), scope(), signal());
    await flush();
    tablebase.respond(2, "{", {});
    expect(await broken).toMatchObject({ reason: "invalid_response" });
    engines.version = "18";
    const request = { operation: "stockfish.position_evaluation@1" as const, request: { fen: START, requestedEngine: { id: "stockfish-analysis", version: "19" }, bound: { kind: "depth" as const, requestedDepth: 10 }, timeoutMs: 5_000 } };
    expect(await scheduler.get(request, scope(), signal())).toMatchObject({ reason: "identity_mismatch" });
    engines.version = "19";
    expect((await scheduler.get(request, scope(), signal())).kind).toBe("success");
  });

  it("bounds retention by entries and total weight with LRU/ASCII eviction and refuses bad or oversized weights", async () => {
    const run = async (h: ReturnType<typeof harness>, fen: string): Promise<TypedProviderResult> => {
      const pending = h.scheduler.get(syzygy(fen), scope(), signal());
      await flush();
      if (h.tablebase.calls.length > 0 && !h.tablebase.calls.at(-1)!.signal.aborted) {
        try { h.tablebase.respond(h.tablebase.calls.length - 1, syzygyBody(fen)); } catch { /* already settled */ }
      }
      return pending;
    };
    const entries = harness({ maxRetainedEntries: 2 });
    await run(entries, KQK);
    await entries.clock.advance(1);
    await run(entries, KRK);
    await entries.clock.advance(1);
    await run(entries, KQK); // refreshes KQK's LRU time
    await entries.clock.advance(1);
    await run(entries, KBK); // evicts KRK, the least recently served
    expect(entries.scheduler.stats().retained).toBe(2);
    const calls = entries.tablebase.calls.length;
    expect((await entries.scheduler.get(syzygy(KQK), scope(), signal())).kind).toBe("success");
    expect(entries.tablebase.calls.length).toBe(calls);
    const krk = entries.scheduler.get(syzygy(KRK), scope(), signal());
    await flush();
    expect(entries.tablebase.calls.length).toBe(calls + 1);
    entries.tablebase.respond(calls, syzygyBody(KRK));
    await krk;

    const weights = harness({ maxRetainedWeight: 10 });
    await run(weights, KQK); // weight = legal moves (>10)
    expect(weights.scheduler.stats().retained).toBe(0);

    const zero = harness({ descriptors: (base) => ({ ...base, "syzygy.position@1": { ...base["syzygy.position@1"], retainedWeight: () => 0 } }) });
    await run(zero, KQK);
    expect(zero.scheduler.stats().retained).toBe(0);
    const fractional = harness({ descriptors: (base) => ({ ...base, "syzygy.position@1": { ...base["syzygy.position@1"], retainedWeight: () => 1.5 } }) });
    await run(fractional, KQK);
    expect(fractional.scheduler.stats().retained).toBe(0);
  });

  it("fixes absolute expiry at admission: a pre-expiry hit does not extend it and exact expiry misses", async () => {
    const h = harness({ retentionTtlMs: 1_000 });
    const first = h.scheduler.get(syzygy(KQK), scope(), signal());
    await flush();
    h.tablebase.respond(0, syzygyBody(KQK));
    await first;
    await h.clock.advance(999);
    expect(((await h.scheduler.get(syzygy(KQK), scope(), signal())) as { delivery: { kind: string } }).delivery.kind).toBe("retained_exact");
    await h.clock.advance(1);
    const refetch = h.scheduler.get(syzygy(KQK), scope(), signal());
    await flush();
    expect(h.tablebase.calls).toHaveLength(2);
    h.tablebase.respond(1, syzygyBody(KQK));
    expect(((await refetch) as { delivery: { kind: string } }).delivery.kind).toBe("live");
  });

  it("refuses retained engine results from a restarted or changed generation", async () => {
    const h = harness();
    const request = { operation: "stockfish.legal_root_table@1" as const, request: { fen: KQK, bound: { kind: "depth" as const, value: 6 }, requestedWidth: "all_legal" as const, moveIdentity: "chessops-king-takes-rook@1" as const, requestedEngine: { id: "stockfish-analysis", version: "19" }, timeoutMs: 5_000 } };
    const live = await h.scheduler.get(request, scope(), signal());
    expect(live.kind).toBe("success");
    expect(((await h.scheduler.get(request, scope(), signal())) as { delivery: { kind: string } }).delivery.kind).toBe("retained_exact");
    h.engines.generation = 2;
    const fresh = await h.scheduler.get(request, scope(), signal());
    expect((fresh as { delivery: { kind: string; acquisition: { generation: number } } }).delivery).toMatchObject({ kind: "live", acquisition: { generation: 2 } });
    expect(h.engines.calls).toHaveLength(2);
    // The pending key never contained a generation: both exchanges share one request digest.
    expect(fresh.normalizedRequestDigest).toBe(live.normalizedRequestDigest);
  });

  it("keeps monotonic and wall authority separate and validates every sample", async () => {
    const h = harness();
    const pending = h.scheduler.get(syzygy(KQK), scope(100), signal());
    await flush();
    h.clock.wallMs -= 3_600_000; // a backward civil jump cannot expire or extend the waiter
    await h.clock.advance(50);
    h.tablebase.respond(0, syzygyBody(KQK));
    const result = await pending;
    expect(result.kind).toBe("success");
    if (result.kind === "success") expect(result.delivery.acquisition.retrievedAt < result.delivery.acquisition.requestedAt).toBe(true);
    const badWall = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null }), maxActive: 1, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 1, retentionTtlMs: 1, monotonicNowMs: () => 0, wallNow: () => "2026-09-24 12:00" });
    await expect(badWall.get(syzygy(KQK), scope(), signal())).rejects.toThrow(/wall clock/u);
    const samples = [10, 10, 10, 4];
    const backwards = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null }), maxActive: 1, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 1, retentionTtlMs: 1, monotonicNowMs: () => samples.shift() ?? 4, wallNow: h.clock.wall });
    // Arrival samples 10; the unconfigured job's start samples 10 and fails honestly.
    expect(await backwards.get(syzygy(KQK), scope(), signal())).toMatchObject({ reason: "provider_unavailable" });
    await expect(backwards.get(syzygy(KQK), scope(), signal())).rejects.toThrow(/non-decreasing/u);
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const broken = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null }), maxActive: 1, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 1, retentionTtlMs: 1, monotonicNowMs: () => bad, wallNow: h.clock.wall });
      await expect(broken.get(syzygy(KQK), scope(), signal())).rejects.toThrow(/finite/u);
    }
    expect(() => new ProviderExchangeScheduler({ descriptors: {} as never, maxActive: 1, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 1, retentionTtlMs: 1, monotonicNowMs: () => 0, wallNow: h.clock.wall })).toThrow(/descriptors must be exactly/u);
    expect(() => new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null }), maxActive: 0, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 1, retentionTtlMs: 1, monotonicNowMs: () => 0, wallNow: h.clock.wall })).toThrow(/maxActive/u);
  });

  it("reports an unconfigured provider as provider_unavailable, never a fabricated result", async () => {
    const scheduler = new ProviderExchangeScheduler({ descriptors: providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null }), maxActive: 1, maxQueued: 1, maxRetainedEntries: 1, maxRetainedWeight: 1, retentionTtlMs: 1, monotonicNowMs: () => 0, wallNow: () => "2026-09-24T12:00:00.000Z" });
    expect(await scheduler.get(syzygy(KQK), scope(), signal())).toMatchObject({ kind: "source_failure", reason: "provider_unavailable", providerDetail: "no Syzygy tablebase endpoint is configured" });
  });
});
