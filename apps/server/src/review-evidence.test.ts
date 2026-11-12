// rfc/review-evidence-compiler.md criteria 12–14, 17 and 21 at the server boundary: the bounded
// attempt store, the one coordinator over the one provider scheduler, durable attachment, and the
// closed story receipt on the production `story()` route.
import { readFileSync } from "node:fs";

import { assertReviewEvidencePacket, commitMove, compileReviewPacketForSubject, createReviewPrefixAuthority, parseReviewStoryReceipt, presentedSentence, renderReviewStoryReceipt, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EvidenceJobQueue, type EvidenceExecutor } from "./evidence-queue.js";
import type { EngineExchangeCapture, EngineExchangeRequest } from "./engine-supervisor.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { ReviewAttemptOutcomeStore, ReviewEvidenceCoordinator, type ReviewEvidenceCoordinatorOptions } from "./review-evidence.js";
import { RunService } from "./service.js";
import { createRestHandler } from "./rest.js";
import { SQLiteRunStorage } from "./storage.js";
import { DrillApi } from "../../web/src/lib/api.js";
import { requestReviewAnalyze, reviewAnalyzeTarget, type ReviewAnalyzeResult } from "../../web/src/lib/review-analyze.js";
import { assertReviewMapResponse } from "../../web/src/lib/review-response.js";
import { reviewFixtureRun } from "../../../packages/runtime/src/testing/review-map-fixture.js";
import { createReviewDurableEngineMemo } from "../../../packages/runtime/src/review-evidence.js";
import { fork, rewind } from "../../../packages/runtime/src/runtime.js";
import * as valueRoutes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { parseRecordedAnalyzeLineOperands } from "../../../packages/runtime/src/recorded-analyze-presentation.js";

const PGN = `[Event "Review evidence"]
[White "Alice"]
[Black "Bob"]
[Result "*"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 *`;
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const principal = { learnerId: "__legacy", handle: "__legacy" } as const;
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

/** Raw side-to-move scores that swing by ply, so the typed packet carries cp pivots. */
const swinging = (fen: string) => {
  const fullmove = Number(fen.split(" ")[5]);
  const whiteToMove = fen.split(" ")[1] === "w";
  const white = fullmove >= 3 ? -400 : 20;
  return { score: `cp ${whiteToMove ? white : -white}`, wdl: [300, 400, 300] as const };
};

function harness(options: { readonly engine?: MockProviderEngineClient; readonly providerOff?: boolean; readonly requestedEngine?: ReviewEvidenceCoordinatorOptions["requestedEngine"]; readonly windowNodes?: number; readonly maxOutstandingPerRun?: number; readonly maxTrackedRuns?: number; readonly attempts?: ReviewAttemptOutcomeStore; readonly queue?: EvidenceJobQueue; readonly holdOperation?: "stockfish.position_evaluation@1" | "stockfish.principal_variation@1" } = {}) {
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
  stores.push(storage);
  const engine = options.engine ?? new MockProviderEngineClient({ score: swinging });
  const { scheduler } = composeProviderTraversalApplication({ engines: engine, tablebaseFetch: null, explorerFetch: null, explorerToken: null });
  let gets = 0;
  let lineGets = 0;
  const entered = deferred<void>();
  const release = deferred<void>();
  let heldKey: string | undefined;
  const counting = { get: (async (...args: Parameters<typeof scheduler.get>) => {
    if (args[0].operation === "stockfish.principal_variation@1") lineGets += 1; else gets += 1;
    if (args[0].operation === "stockfish.position_evaluation@1" && options.holdOperation !== undefined) {
      heldKey = `${scheduler.normalizedRequestDigest(args[0])}\u0000stockfish-analysis\u0000mock-1\u0000movetime:50`;
    }
    const result = await scheduler.get(...args);
    if (args[0].operation === options.holdOperation) {
      entered.resolve();
      await release.promise; // Deliberately ignores abort; a genuine completed delivery returns late.
    }
    return result;
  }) as typeof scheduler.get, normalizedRequestDigest: scheduler.normalizedRequestDigest.bind(scheduler) };
  const attempts = options.attempts ?? new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 64, maxAttemptsPerRequest: 2 });
  const coordinator = new ReviewEvidenceCoordinator({
    scheduler: options.providerOff === true ? null : counting as never, requestedEngine: options.requestedEngine ?? (async () => ({ id: "stockfish-analysis", version: "mock-1" })), storage, attempts,
    windowNodes: options.windowNodes ?? 3, maxOutstandingPerRun: options.maxOutstandingPerRun ?? 2, maxTrackedRuns: options.maxTrackedRuns ?? 4, maxAttemptsPerRequest: 2, movetimeMs: 50, linePlies: 8, timeoutMs: 2_000,
  });
  const service = new RunService(storage, { reviewEvidence: coordinator, ...(options.queue === undefined ? {} : { evidenceQueue: options.queue }) });
  return { storage, service, coordinator, attempts, gets: () => gets, lineGets: () => lineGets, entered: entered.promise, release: () => release.resolve(), heldKey: () => heldKey };
}

/** Actual historical confirmation and current Full2 source operation, not the retired flat read. */
async function analyzeRecorded(service: RunService, runId: string, nodeId: string) {
  const review = await service.review(runId, principal);
  assertReviewMapResponse(review, { runId });
  const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
  return requestReviewAnalyze({
    reviewAssistance: (id, body, signal) => Promise.resolve(service.confirmRecordedAnalyzeAssistance(id, principal, body, availability, signal ?? new AbortController().signal)),
    inspector: (id, body, signal) => service.queryInspectorSources(id, principal, body, availability, signal ?? new AbortController().signal),
  }, reviewAnalyzeTarget(review, nodeId), new AbortController().signal);
}
function actualAnalyzeLine(result: ReviewAnalyzeResult) {
  if (result.page.kind !== "page" || result.page.body.kind !== "source" || result.page.body.outcome.kind !== "available" || result.page.items.length !== 1) throw new Error("Expected one actual Analyze component");
  const item = result.page.items[0]!;
  if (item.component.id !== "fact_statement") throw new Error("Expected actual registered Analyze statement");
  const operands = parseRecordedAnalyzeLineOperands(item.component.operand.operands, "actual coordinator Analyze");
  if (operands.kind !== "line") throw new Error("Expected attributed recorded line");
  return { operands, sentence: presentedSentence(item) };
}

describe("Review coordinator application lifetime (D3561)", () => {
  it.each(["delivered", "not_requested", "provider_off"] as const)("observes only one original node with the same %s input as full observation", async kind => {
    const h = harness({ providerOff: kind === "provider_off", requestedEngine: async () => { throw new Error("Read-only observation must not discover an engine"); } });
    try {
      const run = reviewFixtureRun({ id: `subject-observation-${kind}`, kind: "position", plies: 3, evaluated: () => kind === "delivered" });
      h.storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: "2026-11-12T00:00:00.000Z" });
      h.storage.create(run, { ...principal, writerId: "writer" });
      const branch = run.activeCursor.branchId, whole = h.coordinator.observe(run.id, branch), memo = createReviewDurableEngineMemo();
      const dispatch = vi.spyOn(valueRoutes, "invokeEvidenceValueRoute"), before = JSON.stringify(h.storage.read(run.id)!.run);
      for (const node of [run.nodes[2]!, run.nodes[0]!, run.nodes[3]!, run.nodes[1]!]) {
        dispatch.mockClear();
        const actual = h.coordinator.observeNode(run.id, branch, node.id, memo);
        expect(JSON.stringify(actual)).toBe(JSON.stringify(whole.states.get(node.id)));
        expect(actual.kind).toBe(kind === "provider_off" ? "unavailable" : kind);
        const evaluations = dispatch.mock.calls.filter(([projection]) => projection === "live.stockfish.position_eval@1");
        expect(evaluations.map(([, input]) => (input as { delivery: { payload: { fen: string } } }).delivery.payload.fen))
          .toEqual(kind === "delivered" ? [node.fen] : []);
      }
      dispatch.mockClear();
      expect(() => h.coordinator.observeNode(run.id, branch, "foreign-node", memo)).toThrow(/not on its recorded branch/);
      expect(() => h.coordinator.observeNode("missing-run", branch, run.nodes[0]!.id, memo)).toThrow(/unknown run/);
      expect(dispatch).not.toHaveBeenCalled();
      expect(h.gets()).toBe(0); expect(h.lineGets()).toBe(0); expect(h.attempts.size).toBe(0);
      expect(JSON.stringify(h.storage.read(run.id)!.run)).toBe(before);
    } finally { await h.coordinator.close(); }
  });

  it("binds observation to the inherited or distinct same-FEN occurrence on its actual branch", async () => {
    const h = harness();
    try {
      let run = reviewFixtureRun({ id: "subject-observation-branch", kind: "position", plies: 3 });
      const inherited = run.nodes[1]!, old = run.nodes[2]!, at = "2026-11-12T00:00:00.000Z";
      run = rewind(run, inherited.id, at).run; run = fork(run, inherited.id, { at }).run;
      run = commitMove(run, old.moveUci!, { at }).run;
      h.storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: "2026-11-12T00:00:00.000Z" });
      h.storage.create(run, { ...principal, writerId: "writer" });
      const branch = run.activeCursor.branchId, duplicate = run.nodes.at(-1)!;
      expect(duplicate.fen).toBe(old.fen); expect(duplicate.id).not.toBe(old.id);
      expect(h.coordinator.observeNode(run.id, branch, inherited.id).kind).toBe("delivered");
      expect(h.coordinator.observeNode(run.id, branch, duplicate.id)).toEqual({ kind: "not_requested" });
      expect(() => h.coordinator.observeNode(run.id, branch, old.id)).toThrow(/not on its recorded branch/);
      expect(h.gets()).toBe(0); expect(h.lineGets()).toBe(0);
    } finally { await h.coordinator.close(); }
  });

  it("preserves exact terminal-domain precedence before provider-off without requesting work", async () => {
    const h = harness({ providerOff: true });
    try {
      let run = reviewFixtureRun({ id: "subject-observation-mate", kind: "position", plies: 0, evaluated: () => false });
      const at = "2026-11-12T00:00:00.000Z";
      for (const move of ["f2f3", "e7e5", "g2g4", "d8h4"]) run = commitMove(run, move, { at }).run;
      h.storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
      h.storage.create(run, { ...principal, writerId: "writer" });
      const branch = run.activeCursor.branchId, nodeId = run.activeCursor.nodeId;
      expect(h.coordinator.observeNode(run.id, branch, nodeId)).toEqual({ kind: "honest_empty", reason: "outside_domain" });
      expect(h.coordinator.observeNode(run.id, branch, nodeId)).toEqual(h.coordinator.observe(run.id, branch).states.get(nodeId));
      expect(h.gets()).toBe(0); expect(h.lineGets()).toBe(0); expect(h.attempts.size).toBe(0);
    } finally { await h.coordinator.close(); }
  });

  it.each(["pending", "delivery", "cancel"] as const)("D4261 keeps original shared analysis ownership across a real Review job %s", async action => {
    const h = harness({ holdOperation: "stockfish.position_evaluation@1", windowNodes: 1, maxOutstandingPerRun: 1 });
    const access = { principal, sessionId: "coordinator-rich-review-session", assertCurrent: () => {} };
    try {
      const imported = await h.service.importGame({ id: `review-job-admission-${action}`, side: "white", opponentPolicy: { mode: "human_common" },
        policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
      await h.entered;
      h.service.reveal(imported.run.id, "writer");
      const branch = imported.run.branches[0]!.id, before = h.storage.read(imported.run.id)!.run.events;
      const ensured = h.coordinator.ensureBranch(imported.run.id, branch);
      await ensured.pump;
      expect(h.coordinator.outstanding(imported.run.id, branch)).toBe(1);
      expect(h.gets()).toBe(1); // Admission shares the import's actual existing reservation.
      const job = h.service.beginRichReviewCollection(imported.run.id, access, branch);
      const serialize = vi.fn((map: Awaited<ReturnType<RunService["review"]>>) => JSON.stringify(map));
      const collect = async (lease: typeof job.lease) => {
        for (let i = 0; i < 300; i++) {
          const step = await h.service.advanceRichReviewCollection(lease, serialize);
          if (step.kind === "complete") return step.value;
        }
        throw new Error("Original Review collection did not finish");
      };
      expect(await h.service.advanceRichReviewCollection(job.lease, serialize)).toMatchObject({ kind: "progress", progress: { stage: "grade_begin" } });
      if (action === "pending") {
        const pending = await collect(job.lease);
        expect(pending).toBe(JSON.stringify(await h.service.review(imported.run.id, principal, branch)));
        const map = JSON.parse(pending);
        assertReviewMapResponse(map, { runId: imported.run.id, branchId: branch });
        expect(map.ready).toBe(false); expect(map.pendingEvidence).toBeGreaterThan(0);
        expect(h.coordinator.outstanding(imported.run.id, branch)).toBe(1);
        expect(h.gets()).toBe(1); expect(h.lineGets()).toBe(0);
      }
      if (action === "cancel") {
        expect(h.service.cancelReviewCollection(imported.run.id, access, job.jobId)).toEqual({ jobId: job.jobId, state: "cancelled" });
        expect(h.coordinator.outstanding(imported.run.id, branch)).toBe(1);
      }
      h.release(); await h.coordinator.whenIdle();
      const current = h.storage.read(imported.run.id)!.run;
      expect(current.events.length).toBeGreaterThan(before.length);
      expect(h.gets()).toBe(imported.run.nodes.length);
      expect(h.lineGets()).toBe(imported.run.nodes.length);
      expect([...h.coordinator.observe(imported.run.id, branch).states.values()].every(state => state.kind === "delivered")).toBe(true);
      await expect(h.service.advanceRichReviewCollection(job.lease, serialize)).rejects.toMatchObject({ reason: action === "delivery" ? "stale" : "not_found" });
      expect(serialize).toHaveBeenCalledTimes(action === "pending" ? 1 : 0);
      // A fresh original snapshot over the now-recorded evidence completes without new searches.
      const expected = JSON.stringify(await h.service.review(imported.run.id, principal, branch));
      const retry = h.service.beginRichReviewCollection(imported.run.id, access, branch);
      const result = await collect(retry.lease);
      expect(result).toBe(expected); expect(serialize).toHaveBeenCalledTimes(action === "pending" ? 2 : 1);
      expect(h.gets()).toBe(imported.run.nodes.length);
      expect(h.lineGets()).toBe(imported.run.nodes.length);
      expect(h.storage.read(imported.run.id)!.run.events).toEqual(current.events);
    } finally { h.release(); h.service.closeReviewCollections(); await h.coordinator.close(); await h.coordinator.whenIdle(); }
  });

  it("D4262 observes a genuinely held second attempt with the original retry state without scheduling", async () => {
    const entered = deferred<void>(), release = deferred<void>();
    let exchanges = 0;
    class HeldRetry extends MockProviderEngineClient {
      override async exchange(engineId: string, request: EngineExchangeRequest): Promise<EngineExchangeCapture> {
        exchanges++;
        if (exchanges === 1) throw new Error("Synthetic first-attempt provider failure");
        if (exchanges === 2) { entered.resolve(); await release.promise; }
        return super.exchange(engineId, request);
      }
    }
    const h = harness({ engine: new HeldRetry(), windowNodes: 1, maxOutstandingPerRun: 1 });
    try {
      const imported = await h.service.importGame({ id: "review-held-original-retry", side: "white", opponentPolicy: { mode: "human_common" },
        policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
      await entered.promise;
      const branch = imported.run.branches[0]!.id, root = imported.run.nodes[0]!, before = h.storage.read(imported.run.id)!.run.events;
      const outcomes = vi.spyOn(h.attempts, "outcome"), calls = h.gets(), lineCalls = h.lineGets();
      expect(calls).toBe(2); expect(exchanges).toBe(2);
      const ensured = h.coordinator.ensureBranch(imported.run.id, branch);
      expect(ensured.states.get(root.id)).toEqual({ kind: "pending", jobCount: 1, retrying: 1 });
      expect(outcomes.mock.results.some(result => result.type === "return" && result.value?.kind === "retryable_failure" && result.value.attempts === 1)).toBe(true);
      await ensured.pump; // No new reservation: this promise does not wait for the already-held retry.
      expect(h.coordinator.outstanding(imported.run.id, branch)).toBe(1);
      expect(h.coordinator.observe(imported.run.id, branch).states.get(root.id)).toEqual(ensured.states.get(root.id));
      expect(h.coordinator.observe(imported.run.id, branch, root.id).states.get(root.id)).toEqual(ensured.states.get(root.id));
      expect(h.coordinator.observeNode(imported.run.id, branch, root.id)).toEqual(ensured.states.get(root.id));
      expect(h.gets()).toBe(calls); expect(h.lineGets()).toBe(lineCalls); expect(exchanges).toBe(2);
      expect(h.storage.read(imported.run.id)!.run.events).toEqual(before);
    } finally { release.resolve(); await h.coordinator.close(); await h.coordinator.whenIdle(); }
  });

  it("stops pending discovery without starting attempts or resurrecting work", async () => {
    const identity = deferred<{ id: string; version: string } | null>();
    const { service, coordinator, storage, attempts, gets } = harness({ requestedEngine: () => identity.promise, windowNodes: 1, maxOutstandingPerRun: 1 });
    const imported = await service.importGame({ id: "review-stop-discovery", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    const branchId = imported.run.branches[0]!.id;
    expect(coordinator.outstanding(imported.run.id, branchId)).toBe(1);
    const events = storage.read(imported.run.id)!.run.events;
    try {
      await Promise.all([coordinator.close(), coordinator.close()]);
      expect(coordinator.trackedBranches).toBe(0);
      expect(attempts.size).toBe(0);
      expect(() => coordinator.ensureBranch(imported.run.id, branchId)).toThrow(/closed/u);
    } finally {
      identity.resolve({ id: "stockfish-analysis", version: "mock-1" });
      await coordinator.whenIdle();
    }
    expect(gets()).toBe(0);
    expect(storage.read(imported.run.id)!.run.events).toEqual(events);
  });

  it.each(["stockfish.position_evaluation@1", "stockfish.principal_variation@1"] as const)("detaches late %s completion, retains the started attempt and never repumps", async (operation) => {
    const h = harness({ holdOperation: operation, windowNodes: 1, maxOutstandingPerRun: 1 });
    const imported = await h.service.importGame({ id: `review-stop-${operation}`, side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await h.entered;
    const events = h.storage.read(imported.run.id)!.run.events;
    let closed = false;
    const closing = h.coordinator.close().then(() => { closed = true; });
    try {
      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(closed).toBe(true); // No need to release an abort-ignoring provider to stop the owner.
      expect(h.coordinator.trackedBranches).toBe(0);
      expect(h.attempts.outcome(h.heldKey()!)).toMatchObject({ kind: "retryable_failure", attempts: 1 });
      const resumed = h.attempts.acquire(h.heldKey()!);
      expect(resumed.kind).toBe("owner");
      if (resumed.kind !== "owner") throw new Error("resumable cancellation expected");
      expect(resumed.cancel()).toEqual({ kind: "released", attempts: 1 });
    } finally {
      h.release();
      await closing;
      await h.coordinator.whenIdle();
      await new Promise<void>((resolve) => setImmediate(resolve));
    }
    expect(h.gets()).toBe(1);
    expect(h.lineGets()).toBe(operation === "stockfish.principal_variation@1" ? 1 : 0);
    expect(h.storage.read(imported.run.id)!.run.events).toEqual(events);
  });
});

describe("ReviewAttemptOutcomeStore (criterion 13)", () => {
  it("shares one completion between concurrent equal requests; only the owner settles", async () => {
    const store = new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 4, maxAttemptsPerRequest: 2 });
    const owner = store.acquire("k");
    const subscriber = store.acquire("k");
    expect(owner.kind).toBe("owner");
    expect(subscriber.kind).toBe("subscriber");
    if (owner.kind !== "owner" || subscriber.kind !== "subscriber") throw new Error("unreachable");
    owner.start();
    const settled = owner.settle({ kind: "retryable_failure", reason: "deadline_exceeded", generation: 1 });
    await expect(subscriber.completion).resolves.toEqual(settled);
    expect(() => owner.settle({ kind: "retryable_failure", reason: "again", generation: 1 })).toThrow(/exactly once/u);
  });

  it("counts attempts only at start: a never-started cancel restores history; a started cancel consumes one", async () => {
    const store = new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 4, maxAttemptsPerRequest: 2 });
    const first = store.acquire("k");
    if (first.kind !== "owner") throw new Error("owner expected");
    expect(first.cancel()).toEqual({ kind: "released", attempts: 0 });
    expect(store.size).toBe(0);
    const second = store.acquire("k");
    if (second.kind !== "owner") throw new Error("owner expected");
    second.start();
    expect(second.cancel()).toMatchObject({ kind: "retryable_failure", attempts: 1 });
    const third = store.acquire("k");
    if (third.kind !== "owner") throw new Error("owner expected");
    expect(third.attempts).toBe(1);
    // Cancelling before start restores the retained attempt rather than erasing it.
    expect(third.cancel()).toEqual({ kind: "released", attempts: 1 });
    expect(store.outcome("k")).toMatchObject({ kind: "retryable_failure", attempts: 1 });
    const fourth = store.acquire("k");
    if (fourth.kind !== "owner") throw new Error("owner expected");
    fourth.start();
    // The repeated started cancellation reaches the same ceiling as a retryable failure.
    expect(fourth.cancel()).toMatchObject({ kind: "retry_exhausted", attempts: 2 });
    expect(store.acquire("k")).toMatchObject({ kind: "retained", outcome: { kind: "retry_exhausted" } });
  });

  it("never evicts an identity: a full store refuses unseen work; success leaves only after attachment", () => {
    const store = new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 2, maxAttemptsPerRequest: 1 });
    for (const key of ["a", "b"]) { const owner = store.acquire(key); if (owner.kind !== "owner") throw new Error("owner"); owner.start(); owner.settle({ kind: "retryable_failure", reason: "x", generation: null }); }
    expect(store.acquire("a")).toMatchObject({ kind: "retained", outcome: { kind: "retry_exhausted" } });
    expect(store.acquire("c")).toEqual({ kind: "attempt_history_capacity" });
    expect(store.size).toBe(2);
    const fresh = new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 2, maxAttemptsPerRequest: 1 });
    const owner = fresh.acquire("s");
    if (owner.kind !== "owner") throw new Error("owner");
    owner.start();
    owner.settle({ kind: "success", deliveryDigest: "sha256:abc", generation: 1 });
    expect(fresh.releaseSucceeded("s", "sha256:other")).toBe(false);
    expect(fresh.size).toBe(1);
    expect(fresh.releaseSucceeded("s", "sha256:abc")).toBe(true);
    expect(fresh.size).toBe(0);
    // A new application lifetime (a new store) may retry.
    expect(new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 2, maxAttemptsPerRequest: 1 }).acquire("a").kind).toBe("owner");
  });
});

describe("ReviewEvidenceCoordinator through RunService (criteria 12, 13, 14, 17)", () => {
  it("rejects a retained packet after a real service write and rebuilds Review from SQLite (D3560)", async () => {
    const { service, storage, coordinator, gets } = harness({ providerOff: true });
    const imported = await service.importGame({ id: "review-stored-prefix", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await coordinator.whenIdle();
    const branchId = imported.run.branches[0]!.id;
    const authorize = createReviewPrefixAuthority({
      loadRun: id => storage.read(id)?.run,
      loadImportRecord: id => {
        const record = storage.importedGame(id);
        return record === undefined ? undefined : { runId: record.runId, result: record.result, movetextDigest: record.movetextDigest };
      },
    });
    const subject = authorize({ runId: imported.run.id, branchId });
    const packet = compileReviewPacketForSubject(subject, { engine: new Map(), shapes: [] });
    expect(() => assertReviewEvidencePacket(packet)).not.toThrow();
    // Reveal writes a real event through RunService and native SQLite, without changing the moves.
    service.reveal(imported.run.id, "writer");
    expect(storage.read(imported.run.id)!.run.events.at(-1)!.seq).toBeGreaterThan(subject.eventHead.seq);
    expect(() => assertReviewEvidencePacket(packet)).toThrow(/REVIEW_PREFIX_REFUSED/u);
    expect(() => renderReviewStoryReceipt(packet)).toThrow(/REVIEW_PREFIX_REFUSED/u);
    const fresh = authorize({ runId: imported.run.id, branchId });
    const rebuilt = compileReviewPacketForSubject(fresh, { engine: new Map(), shapes: [] });
    expect(() => assertReviewEvidencePacket(rebuilt)).not.toThrow();
    expect(fresh.pathNodeIds).toEqual(subject.pathNodeIds);
    expect(fresh.subjectDigest).not.toBe(subject.subjectDigest);
    const review = await service.review(imported.run.id, principal, branchId);
    expect(review).toMatchObject({ runId: imported.run.id, branchId });
    expect(gets()).toBe(0);
  });

  it("reserves exact nodes before discovery and does not oversubscribe on repeated page reads (D3422)", async () => {
    const identity = deferred<{ id: string; version: string } | null>();
    const { service, coordinator, storage, gets } = harness({ windowNodes: 1, maxOutstandingPerRun: 1, requestedEngine: () => identity.promise });
    const imported = await service.importGame({ id: "review-reservation", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    const branchId = imported.run.branches[0]!.id;
    // Capture before resolution; still release the gate on a failing predecessor.
    const reserved = coordinator.outstanding(imported.run.id, branchId);
    const repeated = coordinator.ensureBranch(imported.run.id, branchId);
    identity.resolve({ id: "stockfish-analysis", version: "mock-1" });
    await coordinator.whenIdle();
    expect(reserved).toBe(1);
    expect([...repeated.states.values()].filter((state) => state.kind === "pending")).toHaveLength(1);
    expect(gets()).toBe(imported.run.nodes.length);
    expect(storage.read(imported.run.id)!.run.events.filter((event) => event.type === "evidence.attached")).toHaveLength(imported.run.nodes.length);
  });

  it("evicts pending discovery without starting or attaching obsolete work (D3422)", async () => {
    const identity = deferred<{ id: string; version: string } | null>();
    const { service, coordinator, storage } = harness({ maxTrackedRuns: 1, windowNodes: 1, maxOutstandingPerRun: 1, requestedEngine: () => identity.promise });
    const first = await service.importGame({ id: "review-evicted-discovery", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    const priorEvents = storage.read(first.run.id)!.run.events;
    const second = await service.importGame({ id: "review-surviving-discovery", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    identity.resolve({ id: "stockfish-analysis", version: "mock-1" });
    await coordinator.whenIdle();
    expect(coordinator.trackedBranches).toBe(1);
    expect(storage.read(first.run.id)!.run.events).toEqual(priorEvents);
    expect([...coordinator.observe(second.run.id, second.run.branches[0]!.id).states.values()].every((state) => state.kind === "delivered")).toBe(true);
  });

  it("fences a late evicted owner while replacement work completes through the real scheduler (D3422)", async () => {
    const entered = deferred<void>();
    const release = deferred<void>();
    let exchanges = 0;
    class LateSearch extends MockProviderEngineClient {
      override async exchange(engineId: string, request: EngineExchangeRequest) {
        exchanges += 1;
        if (exchanges === 1) { entered.resolve(); await release.promise; }
        // Native work ignores abort until it returns; scheduler and coordinator must both fence it.
        return super.exchange(engineId, { commands: request.commands, resetCommands: request.resetCommands, until: request.until, timeoutMs: request.timeoutMs });
      }
    }
    const { service, coordinator, storage } = harness({ engine: new LateSearch({ score: swinging }), maxTrackedRuns: 1, windowNodes: 1, maxOutstandingPerRun: 1 });
    const first = await service.importGame({ id: "review-late-evicted-owner", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await entered.promise;
    const priorEvents = storage.read(first.run.id)!.run.events;
    const replacement = await service.importGame({ id: "review-replacement-owner", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    release.resolve();
    await coordinator.whenIdle();
    expect(storage.read(first.run.id)!.run.events).toEqual(priorEvents);
    expect([...coordinator.observe(replacement.run.id, replacement.run.branches[0]!.id).states.values()].every((state) => state.kind === "delivered")).toBe(true);
    expect(storage.read(replacement.run.id)!.run.events.filter((event) => event.type === "evidence.attached")).toHaveLength(replacement.run.nodes.length);
  });

  it("counts reserved subscribers across branches of a run and advances them without a page read (D3422)", async () => {
    const identity = deferred<{ id: string; version: string } | null>();
    const { service, coordinator, storage } = harness({ windowNodes: 1, maxOutstandingPerRun: 1, requestedEngine: () => identity.promise });
    const imported = await service.importGame({ id: "review-cross-branch", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    const firstBranch = imported.run.branches[0]!.id;
    const forked = service.fork(imported.run.id, "writer", imported.run.nodes[2]!.id, { label: "Other branch" });
    // An exclusive suffix makes this a real completion-wakeup test, not just shared-prefix reuse.
    storage.save(commitMove(forked.run, "f1c4").run, { writerId: "writer", learnerId: principal.learnerId });
    const secondBranch = forked.run.activeCursor.branchId;
    const waiting = coordinator.ensureBranch(imported.run.id, secondBranch);
    const total = coordinator.outstanding(imported.run.id, firstBranch) + coordinator.outstanding(imported.run.id, secondBranch);
    identity.resolve({ id: "stockfish-analysis", version: "mock-1" });
    await coordinator.whenIdle();
    expect(total).toBe(1);
    expect([...waiting.states.values()].every((state) => state.kind === "not_yet_scheduled")).toBe(true);
    for (const branch of [firstBranch, secondBranch]) expect([...coordinator.observe(imported.run.id, branch).states.values()].every((state) => state.kind === "delivered")).toBe(true);
  });

  it("observes shared completion and attaches for both runs without polling or a second physical search (D3423)", async () => {
    const entered = deferred<void>();
    const release = deferred<void>();
    let exchanges = 0;
    class HeldFirstSearch extends MockProviderEngineClient {
      override async exchange(engineId: string, request: EngineExchangeRequest) {
        exchanges += 1;
        if (exchanges === 1) { entered.resolve(); await release.promise; }
        return super.exchange(engineId, request);
      }
    }
    const { service, coordinator, storage, gets, lineGets } = harness({ engine: new HeldFirstSearch({ score: swinging }), windowNodes: 1, maxOutstandingPerRun: 1 });
    const first = await service.importGame({ id: "review-owner", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await entered.promise;
    const second = await service.importGame({ id: "review-subscriber", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    const subscriber = coordinator.ensureBranch(second.run.id, second.run.branches[0]!.id);
    const beforeRelease = gets();
    release.resolve();
    await subscriber.pump;
    await coordinator.whenIdle();
    expect(beforeRelease).toBe(1); // Only the attempt owner calls the scheduler while pending.
    for (const imported of [first, second]) {
      expect([...coordinator.observe(imported.run.id, imported.run.branches[0]!.id).states.values()].every((state) => state.kind === "delivered")).toBe(true);
      expect(storage.read(imported.run.id)!.run.events.filter((event) => event.type === "evidence.attached")).toHaveLength(imported.run.nodes.length);
    }
    expect(exchanges).toBe(first.run.nodes.length * 2); // Eval + line, retained scheduler deliveries reused.
    expect(gets()).toBe(first.run.nodes.length * 2);
    expect(lineGets()).toBe(first.run.nodes.length * 2);
  });

  it("evicting a shared-attempt subscriber cannot cancel its owner or a surviving subscriber (D3423)", async () => {
    const entered = deferred<void>();
    const release = deferred<void>();
    let exchanges = 0;
    class HeldSearch extends MockProviderEngineClient {
      override async exchange(engineId: string, request: EngineExchangeRequest) {
        exchanges += 1;
        if (exchanges === 1) { entered.resolve(); await release.promise; }
        return super.exchange(engineId, request);
      }
    }
    const { service, coordinator, storage, gets } = harness({ engine: new HeldSearch({ score: swinging }), windowNodes: 1, maxOutstandingPerRun: 1, maxTrackedRuns: 2 });
    const imported = [];
    for (const id of ["review-surviving-owner", "review-cancelled-subscriber"]) {
      imported.push(await service.importGame({ id, side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer"));
      if (imported.length === 1) await entered.promise;
    }
    const owner = imported[0]!;
    const cancelled = imported[1]!;
    const cancelledEvents = storage.read(cancelled.run.id)!.run.events;
    // Touch the owner so LRU cancels the subscriber, not the physical search's owner.
    coordinator.ensureBranch(owner.run.id, owner.run.branches[0]!.id);
    const surviving = await service.importGame({ id: "review-surviving-subscriber", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    const beforeRelease = gets();
    release.resolve();
    await coordinator.whenIdle();
    expect(beforeRelease).toBe(1);
    expect(storage.read(cancelled.run.id)!.run.events).toEqual(cancelledEvents);
    for (const run of [owner, surviving]) expect([...coordinator.observe(run.run.id, run.run.branches[0]!.id).states.values()].every((state) => state.kind === "delivered")).toBe(true);
    expect(exchanges).toBe(owner.run.nodes.length * 2);
  });

  it("shared failures exhaust once per exact request, retain scalar history, and settle every subscriber (D3423)", async () => {
    const entered = deferred<void>();
    const release = deferred<void>();
    let exchanges = 0;
    class HeldFailure extends MockProviderEngineClient {
      override async exchange(engineId: string, request: EngineExchangeRequest): Promise<never> {
        exchanges += 1;
        if (exchanges === 1) { entered.resolve(); await release.promise; }
        throw new Error("private shared provider body");
      }
    }
    const { service, coordinator, attempts, storage, gets } = harness({ engine: new HeldFailure(), windowNodes: 1, maxOutstandingPerRun: 1 });
    const first = await service.importGame({ id: "review-shared-failure-owner", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await entered.promise;
    const second = await service.importGame({ id: "review-shared-failure-subscriber", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    release.resolve();
    await coordinator.whenIdle();
    for (const imported of [first, second]) {
      const observed = [...coordinator.observe(imported.run.id, imported.run.branches[0]!.id).states.values()];
      expect(observed).toEqual(imported.run.nodes.map(() => ({ kind: "unavailable", reason: "retry_exhausted" })));
      expect(JSON.stringify(observed)).not.toContain("private shared provider body");
      expect(storage.read(imported.run.id)!.run.events.some((event) => event.type === "evidence.attached")).toBe(false);
    }
    expect(gets()).toBe(first.run.nodes.length * 2);
    expect(exchanges).toBe(first.run.nodes.length * 2);
    expect(attempts.size).toBe(first.run.nodes.length);
    const calls = gets();
    for (const imported of [first, second]) coordinator.ensureBranch(imported.run.id, imported.run.branches[0]!.id);
    await coordinator.whenIdle();
    expect(gets()).toBe(calls);
  });

  it("shares only a pending identity lookup across branches, with no lookup or request from observation", async () => {
    let resolveIdentity!: (identity: { id: string; version: string } | null) => void;
    let identities = 0;
    const identity = new Promise<{ id: string; version: string } | null>((resolve) => { resolveIdentity = resolve; });
    const { service, coordinator, gets } = harness({ requestedEngine: () => { identities += 1; return identity; } });
    const first = await service.importGame({ id: "review-shared-identity-a", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    const second = await service.importGame({ id: "review-shared-identity-b", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    expect(identities).toBe(1);
    expect(gets()).toBe(0);
    resolveIdentity(null);
    await coordinator.whenIdle();
    for (const imported of [first, second]) {
      expect([...coordinator.observe(imported.run.id, imported.run.branches[0]!.id).states.values()]).toEqual(imported.run.nodes.map(() => ({ kind: "unavailable", reason: "provider_failed" })));
    }
    expect(identities).toBe(1);
    expect(gets()).toBe(0);
  });

  it("reads the current successful engine identity for a new branch while preserving earlier deliveries", async () => {
    let version = "mock-1";
    class ChangingIdentity extends MockProviderEngineClient {
      override async start(engineId: string) { return { ...await super.start(engineId), version }; }
      override health(engineId: string) {
        const health = super.health(engineId);
        return { ...health, ...(health.identity === undefined ? {} : { identity: { ...health.identity, version } }) };
      }
      override async exchange(engineId: string, request: EngineExchangeRequest) {
        const capture = await super.exchange(engineId, request);
        return { ...capture, identity: { ...capture.identity, version } };
      }
    }
    const { service, coordinator, storage } = harness({ engine: new ChangingIdentity({ score: swinging }), requestedEngine: async () => ({ id: "stockfish-analysis", version }) });
    const first = await service.importGame({ id: "review-version-a", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await coordinator.whenIdle();
    const priorEvents = storage.read(first.run.id)!.run.events;
    version = "mock-2";
    const second = await service.importGame({ id: "review-version-b", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await coordinator.whenIdle();
    const points = [...coordinator.observe(second.run.id, second.run.branches[0]!.id).states.values()];
    expect(points).toHaveLength(second.run.nodes.length);
    expect(points.every((state) => state.kind === "delivered" && state.delivery.payload.payload.engine.version === "mock-2")).toBe(true);
    expect(storage.read(first.run.id)!.run.events).toEqual(priorEvents);
  });

  it("reserves provider_off for an unconfigured scheduler and performs no identity lookup", async () => {
    let identities = 0;
    const { service, coordinator, gets, attempts } = harness({ providerOff: true, requestedEngine: async () => { identities += 1; throw new Error("must not run"); } });
    const imported = await service.importGame({ id: "review-provider-off", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await coordinator.whenIdle();
    expect([...coordinator.observe(imported.run.id, imported.run.branches[0]!.id).states.values()]).toEqual(imported.run.nodes.map(() => ({ kind: "unavailable", reason: "provider_off" })));
    expect(identities).toBe(0);
    expect(gets()).toBe(0);
    expect(attempts.size).toBe(0);
  });

  it.each(["null", "reject", "throw"] as const)("recovers a configured engine after identity lookup %s without erasing attempt history", async (failure) => {
    let identities = 0;
    let recovered = false;
    const { service, coordinator, storage, attempts, gets } = harness({
      requestedEngine: () => {
        identities += 1;
        if (recovered) return Promise.resolve({ id: "stockfish-analysis", version: "mock-1" });
        if (failure === "throw") throw new Error("private startup failure");
        return failure === "null" ? Promise.resolve(null) : Promise.reject(new Error("private startup failure"));
      },
    });
    const exhausted = attempts.acquire("unrelated-exhausted-request");
    if (exhausted.kind !== "owner") throw new Error("owner expected");
    exhausted.start();
    exhausted.settle({ kind: "non_retryable_failure", reason: "invalid_response", generation: 1 });
    const imported = await service.importGame({ id: `review-identity-${failure}`, side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await coordinator.whenIdle();
    const observed = coordinator.observe(imported.run.id, imported.run.branches[0]!.id);
    expect([...observed.states.values()].every((state) => state.kind === "unavailable" && state.reason === "provider_failed")).toBe(true);
    expect(gets()).toBe(0);
    expect(attempts.size).toBe(1);
    expect(JSON.stringify([...observed.states.values()])).not.toContain("private startup failure");

    recovered = true;
    service.reveal(imported.run.id, "writer");
    service.story(imported.run.id, principal);
    await coordinator.whenIdle();
    const receipt = service.story(imported.run.id, principal);
    await coordinator.whenIdle();
    expect(receipt.families.engine_eval.availableNodeCount).toBe(imported.run.nodes.length);
    expect(receipt.families.engine_eval.unavailable).toEqual([]);
    expect(identities).toBeGreaterThan(1);
    expect(gets()).toBe(imported.run.nodes.length);
    expect(storage.read(imported.run.id)!.run.events.filter((event) => event.type === "evidence.attached")).toHaveLength(imported.run.nodes.length);
    expect(attempts.outcome("unrelated-exhausted-request")).toMatchObject({ kind: "non_retryable_failure", attempts: 1 });
    const settledCalls = gets();
    const settledIdentities = identities;
    service.story(imported.run.id, principal);
    await coordinator.whenIdle();
    expect(gets()).toBe(settledCalls);
    expect(identities).toBe(settledIdentities);
  });

  it("imports, enriches in bounded windows over the scheduler only, attaches durably and settles the receipt", async () => {
    let executed = 0;
    const executor: EvidenceExecutor = { async execute() { executed += 1; return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } };
    const queue = new EvidenceJobQueue(executor, { maxConcurrency: 1 });
    const { service, coordinator, storage, gets } = harness({ windowNodes: 2, maxOutstandingPerRun: 2, queue });
    const imported = await service.importGame({ id: "review-coordinator", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    expect(imported.evidencePass.jobs).toBeGreaterThan(0);
    expect(imported.evidencePass.jobs).toBeLessThanOrEqual(2);
    expect(coordinator.outstanding("review-coordinator", imported.run.branches[0]!.id)).toBeLessThanOrEqual(2);
    await coordinator.whenIdle();
    // Completion callbacks, not page reads, covered every node.
    const path = storage.read("review-coordinator")!.run.events.filter((event) => event.type === "evidence.attached");
    expect(path).toHaveLength(imported.run.nodes.length);
    service.reveal(imported.run.id, "writer");
    const receipt = service.story(imported.run.id, principal);
    expect(receipt.protocol).toBe("review-story@1");
    expect(receipt.progress).toEqual({ kind: "settled" });
    expect(receipt.families.engine_eval.itemCount).toBeGreaterThan(0);
    expect(receipt.moments.some((moment) => moment.kinds.includes("eval_pivot"))).toBe(true);
    // Criterion 12: no evidence-queue job and no second provider call on repeated reads.
    const callsAfterSettle = gets();
    const again = service.story(imported.run.id, principal);
    await coordinator.whenIdle();
    expect(gets()).toBe(callsAfterSettle);
    expect(again.packetDigest).toBe(receipt.packetDigest);
    expect(executed).toBe(0);
    expect(queue.outstanding(imported.run.id)).toEqual([]);
    // Criterion 17: the wire parses into client-local seals with no DeclaredEvidence.
    const parsed = parseReviewStoryReceipt(JSON.parse(JSON.stringify(receipt)), { runId: imported.run.id });
    expect(parsed.moments.flatMap((moment) => moment.components.map(presentedSentence)).join(" ")).toMatch(/Mock Stockfish mock-1, 50 ms search/u);
    expect(JSON.stringify(receipt)).not.toMatch(/"payload"|"acquisition"|providerDelivery|providerLineDelivery|bestMoveUci|movesUci/u);
  });

  it("states provider failure as unavailable and exhaustion as retry_exhausted without looping (criteria 13, 14)", async () => {
    const failing = new MockProviderEngineClient({ fail: () => true });
    const { service, coordinator, gets } = harness({ engine: failing, windowNodes: 8, maxOutstandingPerRun: 8 });
    const imported = await service.importGame({ id: "review-failing", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await coordinator.whenIdle();
    service.reveal(imported.run.id, "writer");
    let receipt = service.story(imported.run.id, principal);
    await coordinator.whenIdle();
    receipt = service.story(imported.run.id, principal);
    await coordinator.whenIdle();
    const calls = gets();
    receipt = service.story(imported.run.id, principal);
    await coordinator.whenIdle();
    expect(gets()).toBe(calls);
    expect(receipt.degradation.kind).toBe("degraded");
    const engine = receipt.degradation.kind === "degraded" ? receipt.degradation.unavailableFamilies.find((family) => family.family === "engine_eval") : undefined;
    expect(engine?.reasons.map((reason) => reason.reason)).toEqual(["retry_exhausted"]);
    // Local recorded facts still render while the provider family is unavailable.
    expect(receipt.families.recorded.itemCount).toBeGreaterThan(0);
  });

  it("never requests a position with no legal move: it is outside the search domain, not a failure", async () => {
    const { service, coordinator, gets, lineGets } = harness({ windowNodes: 8, maxOutstandingPerRun: 8 });
    const mate = `[Event "Mate"]\n[Result "0-1"]\n\n1. f3 e5 2. g4 Qh4# 0-1`;
    const imported = await service.importGame({ id: "review-mate", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: mate } }, "writer");
    await coordinator.whenIdle();
    expect(gets()).toBe(imported.run.nodes.length - 1);
    // The Analyze line follows each delivered evaluation; the mated position is searched for neither.
    expect(lineGets()).toBe(imported.run.nodes.length - 1);
    service.reveal(imported.run.id, "writer");
    const receipt = service.story(imported.run.id, principal);
    expect(receipt.progress).toEqual({ kind: "settled" });
    expect(receipt.families.engine_eval.unavailable).toEqual([]);
    expect(receipt.families.engine_eval.sourceCounts.honestEmpty).toBeGreaterThan(0);
  });

  it("records the bounded engine line with each delivery, and Analyze reveals it read-only (rfc/review-map.md §7)", async () => {
    const { service, coordinator, storage, gets, lineGets } = harness({ windowNodes: 2, maxOutstandingPerRun: 2 });
    const imported = await service.importGame({ id: "review-line", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await coordinator.whenIdle();
    const run = storage.read("review-line")!.run;
    const attached = run.events.filter((event) => event.type === "evidence.attached");
    // One durable event per node carries both sealed deliveries; no separate bestline row exists.
    expect(attached).toHaveLength(run.nodes.length);
    for (const event of attached) {
      if (event.type !== "evidence.attached") throw new Error("unreachable");
      expect(event.data.payload.kind).toBe("eval");
      expect(Object.keys(event.data.payload.values)).toEqual(expect.arrayContaining(["providerDelivery", "providerLineDelivery"]));
    }
    expect(lineGets()).toBe(gets());
    service.reveal(imported.run.id, "writer");
    const branchId = imported.run.branches[0]!.id;
    const secondMove = run.nodes.find((node) => node.branchId === branchId && node.ply === 3)!;
    const eventsBefore = storage.read("review-line")!.run.events.length;
    const callsBefore = gets() + lineGets();
    const analysis = actualAnalyzeLine(await analyzeRecorded(service, imported.run.id, secondMove.id));
    expect(analysis.operands).toMatchObject({ sourceArm: "typed_pv", engine: { id: "stockfish-analysis", name: "Mock Stockfish", version: "mock-1" },
      bound: { kind: "movetime", requestedMs: 50 }, lineScope: { kind: "typed_request", maxPlies: 8, truncated: false } });
    expect(analysis.sentence).toMatch(/^Mock Stockfish mock-1 \(50 ms search\) reported this principal variation from the position before 2\. Nf3: 2\. \S+ \S+\./u);
    expect(analysis.sentence).toContain("Recorded scope: up to 8 plies.");
    expect(analysis.sentence).toMatch(/not advice/u);
    // Criterion 14: the explicit read writes nothing and requests nothing.
    await coordinator.whenIdle();
    expect(storage.read("review-line")!.run.events.length).toBe(eventsBefore);
    expect(gets() + lineGets()).toBe(callsBefore);
    // The ordinary review payload never carries the line.
    const review = await service.review(imported.run.id, principal);
    expect(JSON.stringify(review)).not.toMatch(/principal variation|providerLineDelivery|movesUci/u);
  });

  it("a line that cannot be obtained never withholds the evaluation; Analyze then states none is recorded", async () => {
    class LineFailing extends MockProviderEngineClient {
      override async exchange(engineId: string, request: Parameters<MockProviderEngineClient["exchange"]>[1]) {
        if (request.commands.includes("setoption name UCI_ShowWDL value false")) throw new Error("line unavailable");
        return super.exchange(engineId, request);
      }
    }
    const { service, coordinator, storage, gets, lineGets } = harness({ engine: new LineFailing({ score: swinging }), windowNodes: 2, maxOutstandingPerRun: 2 });
    const imported = await service.importGame({ id: "review-no-line", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await coordinator.whenIdle();
    const run = storage.read("review-no-line")!.run;
    const attached = run.events.filter((event) => event.type === "evidence.attached");
    expect(attached).toHaveLength(run.nodes.length);
    for (const event of attached) if (event.type === "evidence.attached") expect(Object.keys(event.data.payload.values)).not.toContain("providerLineDelivery");
    service.reveal(imported.run.id, "writer");
    const receipt = service.story(imported.run.id, principal);
    expect(receipt.progress).toEqual({ kind: "settled" });
    expect(receipt.families.engine_eval.unavailable).toEqual([]);
    const secondMove = run.nodes.find((node) => node.branchId === imported.run.branches[0]!.id && node.ply === 3)!;
    const eventsBefore = storage.read(run.id)!.run.events, callsBefore = gets() + lineGets();
    const analysis = await analyzeRecorded(service, imported.run.id, secondMove.id);
    expect(analysis.page).toMatchObject({ kind: "page", body: { kind: "source", projection: "derived.review.analysis_recorded_first@1", outcome: { kind: "unavailable", reason: "source_absent" } }, items: [] });
    expect(storage.read(run.id)!.run.events).toEqual(eventsBefore);
    expect(gets() + lineGets()).toBe(callsBefore);
  });

  it("keeps actual durable provider captures out of ordinary HTTP responses without disabling explicit Analyze", async () => {
    const { service, coordinator, storage, gets, lineGets } = harness();
    const imported = await service.importGame({ id: "review-private-captures", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    await coordinator.whenIdle();
    const run = storage.read(imported.run.id)!.run;
    const attached = run.events.filter(event => event.type === "evidence.attached");
    expect(attached).toHaveLength(run.nodes.length);
    for (const event of attached) {
      if (event.type !== "evidence.attached") throw new Error("attachment expected");
      for (const key of ["providerDelivery", "providerLineDelivery"]) {
        const image = event.data.payload.values[key] as { response: { bodyBase64: string } };
        expect(Buffer.from(image.response.bodyBase64, "base64").toString("utf8")).toMatch(/bestmove|\bpv\b/u);
      }
    }
    const handler = createRestHandler(service);
    const response = await handler(new Request(`http://tabiya.test/runs/${run.id}/reveal`, { method: "POST", headers: { "x-writer-id": "writer", "content-type": "application/json" }, body: JSON.stringify({ at: "2026-10-08T12:00:00.000Z" }) }));
    expect(response.status).toBe(200);
    const mutation = await response.json();
    const callsBefore = gets() + lineGets();
    const eventsBefore = storage.read(run.id)!.run.events;
    for (const [surface, body] of [
      ["mutation", mutation],
      ["graph", await (await handler(new Request(`http://tabiya.test/runs/${run.id}/graph`, { headers: { "x-writer-id": "writer" } }))).json()],
      ["events", await (await handler(new Request(`http://tabiya.test/runs/${run.id}/events?sinceSeq=0`, { headers: { "x-writer-id": "writer" } }))).json()],
    ] as const) {
      const wire = JSON.stringify(body);
      if (surface !== "graph") expect(wire, surface).toContain('"centipawns"');
      else expect(body).toMatchObject({ graph: { id: run.id, nodes: expect.any(Array) } });
      expect(wire.match(/providerDelivery|providerLineDelivery|bodyBase64/u)?.[0], surface).toBeUndefined();
    }
    const node = run.nodes.find(candidate => candidate.ply === 3)!;
    const requests: Request[] = [];
    const api = new DrillApi("http://tabiya.test", (input, init) => {
      const headers = new Headers(init?.headers); headers.set("x-writer-id", "writer");
      const request = new Request(String(input), { ...init, headers }); requests.push(request.clone());
      return handler(request);
    });
    const review = await api.review(run.id);
    assertReviewMapResponse(review, { runId: run.id });
    const analysis = actualAnalyzeLine(await requestReviewAnalyze(api, reviewAnalyzeTarget(review, node.id), new AbortController().signal));
    expect(analysis.operands).toMatchObject({ sourceArm: "typed_pv", engine: { id: "stockfish-analysis", name: "Mock Stockfish", version: "mock-1" }, bound: { kind: "movetime", requestedMs: 50 }, lineScope: { kind: "typed_request", maxPlies: 8 } });
    expect(analysis.sentence).toMatch(/position before 2\. Nf3: 2\. \S+ \S+\./u);
    expect(requests.map(request => [request.method, new URL(request.url).pathname])).toEqual([
      ["GET", `/runs/${run.id}/review`], ["POST", `/runs/${run.id}/assistance`], ["POST", `/runs/${run.id}/inspector/query`],
    ]);
    expect(storage.read(run.id)!.run.events).toEqual(eventsBefore);
    expect(gets() + lineGets()).toBe(callsBefore);
    expect(storage.read(run.id)!.run.events.filter(event => event.type === "evidence.attached")).toEqual(attached);
  });

  it("keeps outstanding work within the per-run bound and evicts idle trackers above maxTrackedRuns", async () => {
    const { service, coordinator } = harness({ windowNodes: 1, maxOutstandingPerRun: 1, maxTrackedRuns: 1 });
    const first = await service.importGame({ id: "review-a", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    expect(coordinator.outstanding("review-a", first.run.branches[0]!.id)).toBeLessThanOrEqual(1);
    await coordinator.whenIdle();
    await service.importGame({ id: "review-b", side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: PGN } }, "writer");
    expect(coordinator.trackedBranches).toBeLessThanOrEqual(1);
    await coordinator.whenIdle();
  });

  it("uses only ensureBranch and the scheduler in the import and story paths (criteria 12, 21 census)", () => {
    const service = readFileSync(new URL("./service.ts", import.meta.url), "utf8");
    const importBody = service.slice(service.indexOf("async importGame("), service.indexOf("importRecord(runId: string"));
    const storyBody = service.slice(service.indexOf("  story(runId: string"), service.indexOf("  share(runId:string"));
    for (const body of [importBody, storyBody]) expect(body).not.toMatch(/\.enqueue\(|enqueueProducer|StockfishEvidenceExecutor/u);
    expect(service).not.toMatch(/#ensureStoryEvidence/u);
    const coordinator = readFileSync(new URL("./review-evidence.ts", import.meta.url), "utf8");
    expect(coordinator).not.toMatch(/enqueue\(|enqueueProducer|StockfishEvidenceExecutor|EvidenceJobQueue/u);
    // One production constructor for live.stockfish.position_eval@1 deliveries: the provider exchange.
    const application = readFileSync(new URL("./application.ts", import.meta.url), "utf8");
    expect(application.match(/new ProviderExchangeScheduler\(/gu) ?? []).toHaveLength(0);
    expect(application).toMatch(/scheduler: providers\.scheduler/u);
  });
});
