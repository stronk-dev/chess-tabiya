import type { AddressInfo } from "node:net";
import { describe, expect, it, vi } from "vitest";
import { compileAssistanceRequest, parsePresentationReceipt, presentedSentence, providerSourceEvidence, type ModuleQueryPage } from "@chess-tabiya/runtime";
import { corpusPopulation, corpusSamplePolicy, type CorpusQuery, type CorpusRequestOptions, type CorpusSource } from "./corpus.js";
import { ExchangeCorpusSource, corpusPageRequest, healthAdmittedExplorerOperation } from "./provider-corpus.js";
import { ProviderExchangeScheduler } from "./provider-exchange.js";
import { ControlledFetch, ManualClock, flush } from "./provider-exchange.test-support.js";
import { providerOperationDescriptors } from "./provider-operations.js";
import { testRegistry } from "./provider-health.test-support.js";
import { createInMemoryTestApplication } from "./in-memory-test-application.js";
import { repertoireDigest, scanRepertoire } from "./repertoire.js";
import { createHttpServer } from "./rest.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { EvidenceJobQueue } from "./evidence-queue.js";
import { healthReportedCorpus } from "./provider-health-adapters.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const NEXT = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
const query = (fen = START) => ({ ...corpusPopulation(1600, new Date("2026-09-30T12:00:00Z")), fen });
const body = (total = 120) => ({
  white: total, draws: 0, black: 0,
  moves: total === 0 ? [] : [{ uci: "e2e4", san: "e4", white: Math.min(total, 60), draws: 0, black: 0, averageRating: 1640 }],
  history: [{ month: "2026-09", white: total, draws: 0, black: 0 }],
  opening: { eco: "A00", name: "Fixture opening" },
});

async function harness() {
  const clock = new ManualClock();
  const healthClock = { get now() { return clock.monotonic; }, set now(value: number) { clock.monotonic = value; }, wall: clock.wall(), advance: () => undefined };
  const health = await testRegistry({ "explorer-primary": "unverified", "tablebase-primary": "unverified" }, { clock: healthClock });
  const remote = new ControlledFetch();
  const scheduler = new ProviderExchangeScheduler({
    descriptors: { ...providerOperationDescriptors({ engines: null, tablebaseFetch: null, explorerFetch: null, explorerToken: null }), "lichess_explorer.position_page@1": healthAdmittedExplorerOperation(remote.fetch, "fixture-token", health) },
    maxActive: 2, maxQueued: 4, maxRetainedEntries: 8, maxRetainedWeight: 1_000,
    retentionTtlMs: 10_000, monotonicNowMs: clock.now, wallNow: clock.wall, timers: clock,
  });
  health.registerCacheInventory("explorer-primary", scheduler.retainedInventory("lichess_explorer.position_page@1"));
  const source = new ExchangeCorpusSource({ scheduler, monotonicNowMs: clock.now });
  return { source, scheduler, clock, health, remote };
}

describe("learner Explorer shared exchange", () => {
  it("preserves the modern method's receiver and sealed page through the health adapter", async () => {
    const { source, remote } = await harness();
    const health = await testRegistry({ "explorer-primary": "unverified" });
    const wrapped = healthReportedCorpus(source, health);
    const pending = wrapped.page!(query());
    await flush(); remote.respond(0, body());
    const acquired = await pending;
    expect(acquired.kind).toBe("page");
    if (acquired.kind !== "page") throw new Error("expected admitted page");
    const retained = await source.page(query());
    expect(retained.kind).toBe("page");
    if (retained.kind !== "page") throw new Error("expected retained page");
    expect(acquired.evidence.payload.payload).toBe(retained.evidence.payload.payload);
    expect(health.operationAvailability("evidence.explorer_query").state).toBe("available");
    expect(remote.calls).toHaveLength(1);
  });

  it("forwards caller cancellation and deadlines without poisoning source health", async () => {
    const health = await testRegistry({ "explorer-primary": "unverified" });
    let signal: AbortSignal | undefined;
    let deadline: number | undefined;
    const page = vi.fn(async (_query: CorpusQuery, options: CorpusRequestOptions = {}) => {
      signal = options.signal; deadline = options.deadlineMonotonic;
      return new Promise<{ kind: "caller_expired" }>(resolve => options.signal!.addEventListener("abort", () => resolve({ kind: "caller_expired" }), { once: true }));
    });
    const stats = vi.fn(async () => ({ kind: "abstention" as const, reason: "source_unavailable" as const, detail: "not used", population: corpusPopulation(1600) }));
    const wrapped = healthReportedCorpus({ stats, page }, health);
    const caller = new AbortController();
    const pending = wrapped.page!(query(), { signal: caller.signal });
    await flush(); caller.abort();
    expect(await pending).toEqual({ kind: "caller_expired" });
    expect(signal).not.toBe(caller.signal);
    expect(signal!.aborted).toBe(true);
    expect(deadline).toBeTypeOf("number");
    expect(stats).not.toHaveBeenCalled();
    expect(health.operationAvailability("evidence.explorer_query").state).toBe("requestable_unverified");
    expect("page" in healthReportedCorpus({ stats }, health)).toBe(false);
  });

  it("preserves a real typed source failure rather than inventing a health receipt", async () => {
    const { source, remote } = await harness();
    const acquiring = source.page(query());
    await flush(); remote.respond(0, { ...body(), white: "invalid" });
    const absence = await acquiring;
    expect(absence).toMatchObject({ kind: "source_failure", reason: "invalid_response" });
    const health = await testRegistry({ "explorer-primary": "unverified" });
    const stats = vi.fn(async () => ({ kind: "abstention" as const, reason: "source_unavailable" as const, detail: "not used", population: corpusPopulation(1600) }));
    const wrapped = healthReportedCorpus({ stats, page: async () => absence }, health);
    expect(await wrapped.page!(query())).toBe(absence);
    expect(health.operationAvailability("evidence.explorer_query")).toMatchObject({ state: "unavailable", reason: "protocol" });
    expect(stats).not.toHaveBeenCalled();
  });

  it.each(["success", "sparse", "zero", "population", "clone", "failure"])("retains modern source admission through authenticated repertoire import and scan (%s)", { timeout: 30_000 }, async arm => {
    const { source, remote } = await harness();
    const total = arm === "sparse" ? 37 : arm === "zero" ? 0 : 120;
    const stats = vi.fn(async () => ({ kind: "stats" as const, total: 120, white: 120, draws: 0, black: 0,
      moves: [{ san: "e4", uci: "e2e4", playedCount: 60, sharePct: 50, white: 60, draws: 0, black: 0 }],
      recency: { kind: "absent" as const }, population: corpusPopulation(1600) }));
    // Private fields make loss of the class receiver observable in the actual app adapter.
    class SuppliedSource implements CorpusSource {
      readonly #source = source;
      readonly stats = stats;
      calls = 0;
      async page(asked: CorpusQuery, options: CorpusRequestOptions = {}) {
        this.calls += 1;
        expect(options.signal).toBeDefined();
        expect(options.deadlineMonotonic).toBeTypeOf("number");
        if (arm === "failure") throw new Error("source unavailable");
        const pending = this.#source.page(arm === "population" ? { ...asked, ratings: [1400] } : asked, options);
        await flush(); remote.respond(remote.calls.length - 1, body(total));
        const acquired = await pending;
        return arm === "clone" && acquired.kind === "page" ? { ...acquired, evidence: { ...acquired.evidence } } : acquired;
      }
    }
    const supplied = new SuppliedSource();
    const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, corpusSource: supplied });
    try {
      await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
      const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "frontier_owner", password: "repertoire-test-password" }) });
      expect(registered.status).toBe(201);
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
      const headers = { "content-type": "application/json", cookie };
      const created = await fetch(`${origin}/repertoires`, { method: "POST", headers, body: JSON.stringify({ name: "Black choices", side: "black", targetElo: 1600, coverageDenominator: 10, source: { kind: "pgn", pgn: "1. d4 d5 *" } }) });
      expect(created.status, await created.clone().text()).toBe(201);
      const { repertoire } = await created.json() as { repertoire: { id: string } };
      const route = `${origin}/repertoires/${repertoire.id}`;
      expect((await fetch(`${route}/scan`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })).status).toBe(401);
      expect(supplied.calls).toBe(0);
      expect((await fetch(`${route}/scan`, { method: "POST", headers, body: "{}" })).status).toBe(202);
      let page: { status: string; scan: { gaps: unknown[]; unknown: unknown[]; sourceFailures: number; uncoveredMass: number } } | undefined;
      for (let poll = 0; poll < 30; poll += 1) {
        const response = await fetch(`${route}/gaps`, { headers });
        expect(response.status).toBe(200);
        page = await response.json() as NonNullable<typeof page>;
        if (page.status === "ready") break;
        await flush();
      }
      expect(page?.status).toBe("ready");
      if (arm === "success") {
        expect(page!.scan.gaps).toEqual([expect.objectContaining({ replySan: "e4", mass: 0.5 })]);
        expect(page!.scan.uncoveredMass).toBe(0.5);
        expect(page!.scan.unknown).toEqual([]);
      } else {
        expect(page!.scan.gaps).toEqual([]);
        expect(page!.scan.unknown).toEqual([expect.objectContaining({ reason: total < 100 ? "no_data_at_band" : "source_unavailable" })]);
      }
      expect(page!.scan.sourceFailures).toBe(["population", "clone", "failure"].includes(arm) ? 1 : 0);
      expect(stats).not.toHaveBeenCalled();
      expect(supplied.calls).toBe(1);
      if (["success", "sparse", "zero"].includes(arm)) expect(application.providerHealth.operationAvailability("evidence.explorer_query").state).toBe("available");
      expect((await fetch(`${route}/gaps`)).status).toBe(401);
      expect(supplied.calls).toBe(1);
    } finally { await application.close(); }
  });

  it.each(["success", "position", "ratings", "speeds", "dates", "clone", "failure"])("admits the modern repertoire frontier against its exact request (%s)", async arm => {
    const { source, remote } = await harness();
    const at = "2026-09-30T12:00:00.000Z";
    const asked = query();
    const crossed = arm === "position" ? query(NEXT) : arm === "ratings" ? { ...asked, ratings: [1400] as const }
      : arm === "speeds" ? { ...asked, speeds: ["rapid"] as const } : arm === "dates" ? { ...asked, since: "2025-01" } : asked;
    const acquiring = source.page(crossed);
    await flush(); remote.respond(0, arm === "position" ? { ...body(), moves: [{ uci: "a7a6", san: "a6", white: 60, draws: 0, black: 0 }] } : body());
    const acquired = await acquiring;
    if (acquired.kind !== "page") throw new Error("fixture acquisition failed");
    const stats = vi.fn(async () => ({ kind: "stats" as const, total: 120, white: 120, draws: 0, black: 0,
      moves: [{ san: "e4", uci: "e2e4", playedCount: 60, sharePct: 50, white: 60, draws: 0, black: 0 }],
      recency: { kind: "absent" as const }, population: corpusPopulation(1600, new Date(at)) }));
    const page = vi.fn(async () => {
      if (arm === "failure") throw new Error("source failed");
      return arm === "clone" ? { ...acquired, evidence: { ...acquired.evidence } } : acquired;
    });
    const scan = await scanRepertoire({ id: "rep", ownerLearnerId: "learner", name: "Black choices", side: "black", rootFen: START, targetElo: 1600, coverageDenominator: 10, sourceKind: "pgn_paste", sourceUrl: null, originalPgn: "", licenceNote: "fixture", digest: repertoireDigest("black", START, []), createdAt: at, updatedAt: at }, [], { stats, page }, new Date(at));
    if (arm === "success") {
      expect(scan.gaps).toEqual([expect.objectContaining({ replySan: "e4", mass: 0.5 })]);
      expect(scan.unknown).toEqual([]);
    } else {
      expect(scan.gaps).toEqual([]);
      expect(scan.unknown).toEqual([expect.objectContaining({ reason: "source_unavailable" })]);
      expect(scan.sourceFailures).toBe(1);
    }
    expect(page).toHaveBeenCalledTimes(1);
    expect(stats).not.toHaveBeenCalled();
  });

  it.each(["success", "sparse", "zero", "position", "ratings", "speeds", "dates", "clone", "failure", "typed_failure", "legacy", "changed", "revoked", "disconnect"])("admits supplied Theory pages at authenticated application composition (%s)", { timeout: 30_000 }, async arm => {
    const { source, remote } = await harness();
    const total = arm === "sparse" ? 37 : arm === "zero" ? 0 : 120;
    const delayed = ["changed", "revoked", "disconnect"].includes(arm);
    let release!: () => void;
    let started!: () => void;
    let aborted!: () => void;
    const released = new Promise<void>(resolve => { release = resolve; });
    const didStart = new Promise<void>(resolve => { started = resolve; });
    const didAbort = new Promise<void>(resolve => { aborted = resolve; });
    const stats = vi.fn(async () => ({ kind: "stats" as const, ...body(), total: 120,
      moves: [{ san: "RAW_FALLBACK_DO_NOT_DISCLOSE", uci: "e2e4", playedCount: 60, sharePct: 50, white: 60, draws: 0, black: 0 }],
      recency: { kind: "absent" as const }, population: corpusPopulation(undefined) }));
    class SuppliedSource implements CorpusSource {
      readonly #source = source;
      readonly stats = stats;
      calls = 0;
      async page(asked: CorpusQuery, options: CorpusRequestOptions = {}) {
        this.calls += 1;
        expect(options.signal).toBeDefined();
        expect(options.deadlineMonotonic).toBeTypeOf("number");
        expect(Object.isFrozen(asked)).toBe(true);
        expect(Object.isFrozen(asked.ratings)).toBe(true);
        if (arm === "failure") throw new Error("source unavailable");
        const crossed = arm === "position" ? { ...asked, fen: START }
          : arm === "ratings" ? { ...asked, ratings: [1400] as const }
          : arm === "speeds" ? { ...asked, speeds: ["rapid"] as const }
          : arm === "dates" ? { ...asked, since: "2025-01" } : asked;
        const acquiring = this.#source.page(crossed, options);
        await flush();
        if (delayed) {
          remote.calls.at(-1)!.signal.addEventListener("abort", aborted, { once: true });
          started();
          await released;
        }
        if (arm !== "disconnect") remote.respond(remote.calls.length - 1, arm === "typed_failure" ? { ...body(), white: "invalid" }
          : { ...body(total), moves: total === 0 ? [] : [{ uci: arm === "position" ? "e2e4" : "a7a6", san: "MOVE_ROW_SENTINEL_DO_NOT_DISCLOSE", white: Math.min(total, 20), draws: 0, black: 0 }] });
        const acquired = await acquiring;
        return arm === "clone" && acquired.kind === "page" ? { ...acquired, evidence: { ...acquired.evidence } } : acquired;
      }
    }
    const supplied = new SuppliedSource();
    const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, corpusSource: arm === "legacy" ? { stats } : supplied });
    try {
      await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
      const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "theory_owner", password: "theory-test-password" }) });
      expect(registered.status).toBe(201);
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
      const headers = { "content-type": "application/json", cookie, "x-writer-id": "theory-writer" };
      const created = await fetch(`${origin}/runs`, { method: "POST", headers,
        body: JSON.stringify({ id: "supplied-theory", session: { kind: "position", start: { fen: START, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "strong_engine" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73 }) });
      expect(created.status, await created.clone().text()).toBe(201);
      const route = `${origin}/runs/supplied-theory`;
      let queryHeaders = headers;
      if (arm === "revoked") {
        const guest = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "theory_guest", password: "theory-guest-password" }) });
        expect(guest.status).toBe(201);
        queryHeaders = { ...headers, cookie: guest.headers.get("set-cookie")!.split(";", 1)[0]! };
        // Only a host (or reviewing grant) may request this assistance in a live run.
        expect((await fetch(`${route}/grants`, { method: "POST", headers, body: JSON.stringify({ op: "grant", handle: "theory_guest", role: "host" }) })).status).toBe(200);
      }
      const committed = await fetch(`${route}/moves`, { method: "POST", headers, body: JSON.stringify({ uci: "g1f3" }) });
      expect(committed.status, await committed.clone().text()).toBe(200);
      const { run } = await committed.json() as { run: { activeCursor: { nodeId: string } } };
      const requested = (preset: "quiet" | "theory_only", modules: readonly string[] = ["theory_breadcrumb"]) => JSON.stringify({
        assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset, overrides: {}, moduleOverrides: { include: [], exclude: [] } } }),
        query: { timing: "post_commit", subjectNodeId: run.activeCursor.nodeId, requested: modules },
      });
      const caller = new AbortController();
      const ask = (preset: "quiet" | "theory_only", modules?: readonly string[]) => fetch(`${route}/modules/query`, { method: "POST", headers: queryHeaders, body: requested(preset, modules), signal: caller.signal });
      expect((await fetch(`${route}/modules/query`, { method: "POST", headers: { "content-type": "application/json" }, body: requested("theory_only") })).status).toBe(401);
      expect((await ask("theory_only")).status).toBe(409);
      expect(supplied.calls).toBe(0);
      expect((await fetch(`${route}/reveal`, { method: "POST", headers, body: "{}" })).status).toBe(200);
      expect((await ask("quiet")).status).toBe(200);
      expect((await ask("theory_only", [])).status).toBe(200);
      expect(supplied.calls).toBe(0);
      const pending = ask("theory_only");
      if (delayed) {
        await Promise.race([didStart, pending.then(async response => { throw new Error(`Expected source acquisition, got ${response.status}: ${await response.clone().text()}`); })]);
        if (arm === "disconnect") {
          const refusal = expect(pending).rejects.toMatchObject({ name: "AbortError" });
          caller.abort();
          await refusal;
          await didAbort;
          release();
          await flush();
          expect(remote.calls.at(-1)!.signal.aborted).toBe(true);
          expect(application.providerHealth.operationAvailability("evidence.explorer_query").state).toBe("requestable_unverified");
          expect(stats).not.toHaveBeenCalled();
          return;
        }
        if (arm === "changed") {
          expect((await fetch(`${route}/moves`, { method: "POST", headers, body: JSON.stringify({ uci: "a7a6" }) })).status).toBe(200);
          expect((await fetch(`${route}/reveal`, { method: "POST", headers, body: "{}" })).status).toBe(200);
        } else {
          expect((await fetch(`${route}/grants`, { method: "POST", headers, body: JSON.stringify({ op: "revoke", handle: "theory_guest" }) })).status).toBe(200);
        }
        release();
      }
      const response = await pending;
      if (arm === "changed" || arm === "revoked") {
        expect(response.status, await response.clone().text()).toBe(arm === "changed" ? 400 : 404);
        const failure = await response.text();
        expect(failure).toContain(arm === "changed" ? "Module decision changed" : "RUN_NOT_FOUND");
        expect(failure).not.toMatch(/\d+ games|MOVE_ROW_SENTINEL/u);
        expect(stats).not.toHaveBeenCalled();
        return;
      }
      expect(response.status, await response.clone().text()).toBe(200);
      const { page } = await response.json() as { page: ModuleQueryPage };
      const theory = page.packets.find(packet => packet.module === "theory_breadcrumb")!;
      const sentences = parsePresentationReceipt(theory.receipt).map(presentedSentence).join(" ");
      if (["success", "sparse", "zero"].includes(arm)) {
        expect(sentences).toContain(`${total} games`);
        expect(sentences).toContain("not what is good");
      } else {
        expect(sentences).not.toMatch(/\d+ games/u);
        expect(JSON.stringify(page)).toContain(arm === "legacy" ? "not_configured" : arm === "failure" ? "provider_unavailable"
          : ["position", "ratings", "speeds", "dates"].includes(arm) ? "identity_mismatch" : "invalid_response");
      }
      expect(JSON.stringify(page)).not.toMatch(/MOVE_ROW_SENTINEL|RAW_FALLBACK|canonicalUci|providerSan|"a7a6"/u);
      expect(supplied.calls).toBe(arm === "legacy" ? 0 : 1);
      expect(stats).not.toHaveBeenCalled();
    } finally { release(); await application.close(); }
  });

  it.each([0, 37, 100])("binds the real theory query to a move-free %i-game population without a sample floor", async (total) => {
    const { source, remote, clock } = await harness();
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    try {
      const service = new RunService(storage, { evidenceQueue: new EvidenceJobQueue({ async execute() { return { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }; } }) });
      const fen = "r1bqkbnr/pp1ppp1p/2n3p1/8/2PNP3/8/PP3PPP/RNBQKB1R b KQkq - 0 5";
      await service.create({ id: "population", session: { kind: "position", start: { fen, side: "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 4 }, "writer");
      service.move("population", "writer", "g8f6");
      const nodeId = storage.read("population")!.run.activeCursor.nodeId;
      const handler = createRestHandler(service, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, source);
      const assistance = (preset: "quiet" | "theory_only") => compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset, overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
      const request = (preset: "quiet" | "theory_only", requested: readonly string[] = ["theory_breadcrumb"]) => new Request("http://tabiya.test/runs/population/modules/query", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assistance: assistance(preset), query: { timing: "post_commit", subjectNodeId: nodeId, requested } }) });
      // No raw provider work before the feedback door, or without admitted module demand.
      expect((await handler(request("theory_only"))).status).toBe(409);
      expect(remote.calls).toHaveLength(0);
      service.reveal("population", "writer");
      expect((await handler(request("quiet"))).status).toBe(200);
      expect((await handler(request("theory_only", []))).status).toBe(200);
      expect(remote.calls).toHaveLength(0);
      const pending = handler(request("theory_only"));
      await flush();
      expect(remote.calls).toHaveLength(1);
      const subjectFen = storage.read("population")!.run.nodes.find((node) => node.id === nodeId)!.fen;
      expect(new URL(remote.calls[0]!.url).searchParams.get("fen")).toBe(`${subjectFen.split(" ").slice(0, 4).join(" ")} 0 1`);
      remote.respond(0, { ...body(total), moves: total === 0 ? [] : [{ uci: "a2a3", san: "MOVE_ROW_SENTINEL_DO_NOT_DISCLOSE", white: Math.min(total, 20), draws: 0, black: 0 }] });
      const response = await pending;
      expect(response.status).toBe(200);
      const page = ((await response.json()) as { page: ModuleQueryPage }).page;
      const theory = page.packets.find((packet) => packet.module === "theory_breadcrumb")!;
      const sentences = parsePresentationReceipt(theory.receipt).map(presentedSentence).join(" ");
      expect(sentences).toContain(`${total} games`);
      expect(sentences).toContain("not what is good");
      expect(JSON.stringify(page)).not.toMatch(/MOVE_ROW_SENTINEL|"a2a3"|canonicalUci|providerSan/u);
      expect((await handler(request("theory_only"))).status).toBe(200);
      expect(remote.calls).toHaveLength(1);
      if (total === 37) {
        // A real acquisition may finish after the learner changes the decision. Never disclose it.
        await clock.advance(10_001);
        const stale = handler(request("theory_only"));
        await flush();
        expect(remote.calls).toHaveLength(2);
        service.move("population", "writer", "a2a3");
        service.reveal("population", "writer");
        remote.respond(1, { ...body(total), moves: [] });
        const refused = await stale;
        expect(refused.status).toBe(400);
        expect(await refused.json()).toMatchObject({ error: { code: "INVALID_REQUEST", message: "Module decision changed while acquiring Explorer evidence" } });
      }
    } finally { storage.close(); }
  });

  it("propagates premature HTTP disconnect but not normal response completion", async () => {
    let started!: () => void;
    let cancelled!: () => void;
    let completedSignal: AbortSignal | undefined;
    const didStart = new Promise<void>((resolve) => { started = resolve; });
    const didCancel = new Promise<void>((resolve) => { cancelled = resolve; });
    const server = createHttpServer(async (request) => {
      if (new URL(request.url).pathname === "/normal") { completedSignal = request.signal; return new Response("done"); }
      started();
      return new Promise<Response>((resolve) => request.signal.addEventListener("abort", () => { cancelled(); resolve(new Response("cancelled")); }, { once: true }));
    });
    try {
      await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      expect(await (await fetch(`${origin}/normal`)).text()).toBe("done");
      expect(completedSignal?.aborted).toBe(false);
      const abort = new AbortController();
      const pending = fetch(`${origin}/waiting`, { signal: abort.signal });
      await didStart; abort.abort();
      await expect(pending).rejects.toMatchObject({ name: "AbortError" });
      // No upstream timer in this handler can make the assertion pass instead of the disconnect.
      await didCancel;
      expect(completedSignal?.aborted).toBe(false);
    } finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
  });
  it("shares exact acquisitions while preserving full raw source facts", async () => {
    const { source, scheduler, remote } = await harness();
    const stats = source.stats(query());
    const page = source.page(query());
    const direct = scheduler.get({ operation: "lichess_explorer.position_page@1", request: corpusPageRequest(query()) }, { id: "direct", budgetMs: 4_000 }, new AbortController().signal);
    await flush(); expect(remote.calls).toHaveLength(1);
    const url = new URL(remote.calls[0]!.url);
    expect(url.origin).toBe("https://explorer.lichess.org");
    expect(url.searchParams.get("history")).toBe("true");
    expect(url.searchParams.get("moves")).toBe("12");
    remote.respond(0, body());
    const [result, admitted, delivered] = await Promise.all([stats, page, direct]);
    expect(result).toMatchObject({ kind: "stats", total: 120, moves: [{ san: "e4", playedCount: 60, sharePct: 50 }], recency: { kind: "month", lastPlayedMonth: "2026-09" } });
    if (admitted.kind !== "page" || delivered.kind !== "success") throw new Error("expected sealed page");
    expect(admitted.evidence.payload).toBe(providerSourceEvidence("lichess_explorer.position_page@1", delivered.delivery).payload);
    expect(admitted.evidence.payload.payload.result).toMatchObject({ listed: 60, unlisted: 60, opening: { kind: "reported", eco: "A00" }, moves: [{ averageRating: 1640 }], history: { kind: "reported" } });
    expect((await source.page(query())).kind).toBe("page");
    expect(remote.calls).toHaveLength(1);
  });

  it.each([0, 37, 100])("retains a valid %i-game page before any consumer sample policy", async (total) => {
    const { source, remote, health } = await harness();
    const pending = source.stats(query());
    await flush(); remote.respond(0, body(total));
    const stats = await pending;
    expect(stats).toMatchObject({ kind: "stats", total });
    expect(corpusSamplePolicy(stats, 100)).toMatchObject(total < 100 ? { kind: "abstention", reason: "no_data_at_band" } : { kind: "stats", total });
    expect(corpusSamplePolicy(stats, 1)).toMatchObject(total === 0 ? { kind: "abstention" } : { kind: "stats", total });
    expect(health.snapshot().providers.find((row) => row.instanceId === "explorer-primary")).toMatchObject({ state: "available" });
    expect((await source.page(query())).kind).toBe("page");
    expect(remote.calls).toHaveLength(1);
    expect(JSON.stringify(stats)).not.toContain("NaN");
  });

  it.each([
    { moves: [{ uci: "e2e5", san: "e5", white: 1, draws: 0, black: 0 }] },
    { moves: [{ uci: "e2e4", san: "e4", white: 1, draws: 0, black: 0 }, { uci: "e2e4", san: "e4", white: 1, draws: 0, black: 0 }] },
    { moves: [{ uci: "e2e4", san: "e4", white: 121, draws: 0, black: 0 }] },
    { white: "120" }, { history: undefined },
  ])("refuses malformed source populations before establishing health: %j", async (overrides) => {
    const { source, remote, scheduler, health } = await harness();
    const pending = source.page(query());
    await flush(); remote.respond(0, { ...body(), ...overrides });
    expect(await pending).toMatchObject({ kind: "source_failure", reason: "invalid_response" });
    expect(scheduler.stats().retained).toBe(0);
    expect(health.snapshot().providers.find((row) => row.instanceId === "explorer-primary")).toMatchObject({ state: "unavailable", reason: "protocol" });
  });

  it("shares Lichess backoff, serves only exact retained pages and expires absolutely", async () => {
    const { source, remote, health, clock } = await harness();
    const first = source.stats(query()); await flush(); remote.respond(0, body()); await first;
    const failed = source.page(query(NEXT)); await flush(); remote.respond(1, "busy", { status: 429, headers: { "retry-after": "60" } });
    expect(await failed).toMatchObject({ kind: "source_failure", reason: "provider_unavailable" });
    expect(health.operationAvailability("evidence.tablebase_probe")).toMatchObject({ state: "temporarily_blocked", reason: "upstream_backoff" });
    expect(health.snapshot().providers.find((row) => row.instanceId === "explorer-primary")).toMatchObject({ state: "degraded_cached_only", validExactEntries: 1 });
    expect(await source.stats(query())).toMatchObject({ kind: "stats" });
    expect(await source.stats(query(NEXT))).toMatchObject({ kind: "abstention", reason: "source_unavailable" });
    expect(remote.calls).toHaveLength(2);
    await clock.advance(10_000);
    expect(await source.stats(query())).toMatchObject({ kind: "abstention", reason: "source_unavailable" });
    expect(remote.calls).toHaveLength(2);
  });

  it("refuses unordered requests and separates windows and rating buckets", async () => {
    const { source, remote } = await harness();
    await expect(source.page({ ...query(), ratings: [1600, 1400] })).rejects.toThrow(/ascending/u);
    await expect(source.page({ ...query(), speeds: ["rapid", "blitz"] })).rejects.toThrow(/canonical order/u);
    expect(remote.calls).toHaveLength(0);
    for (const value of [query(), { ...query(), since: "2025-01" }, { ...query(), ratings: [1400] as const }]) {
      const pending = source.stats(value); await flush(); remote.respond(remote.calls.length - 1, body()); await pending;
    }
    expect(remote.calls).toHaveLength(3);
  });

  it("does not dispatch a cancelled caller after delayed group admission", async () => {
    const { source, remote, health } = await harness();
    const occupied = await health.admit("evidence.tablebase_probe");
    const abort = new AbortController();
    const pending = source.stats(query(), { signal: abort.signal });
    await flush(); expect(remote.calls).toHaveLength(0);
    abort.abort();
    expect(await pending).toMatchObject({ kind: "abstention", reason: "source_unavailable" });
    health.settle(occupied, { kind: "success" }); await flush();
    expect(remote.calls).toHaveLength(0);
  });

  it("does not fabricate a source receipt for an already expired caller", async () => {
    const { source, remote } = await harness();
    expect(await source.page(query(), { deadlineMonotonic: 0 })).toEqual({ kind: "caller_expired" });
    expect(await source.stats(query(), { deadlineMonotonic: -1 })).toMatchObject({ kind: "abstention", reason: "source_unavailable" });
    expect(remote.calls).toHaveLength(0);
  });

  it("includes queue time in deadlines without aborting a coalesced surviving consumer", async () => {
    const { source, scheduler, remote, clock } = await harness();
    const expired = source.stats(query(), { deadlineMonotonic: 10 });
    const survivor = scheduler.get({ operation: "lichess_explorer.position_page@1", request: corpusPageRequest(query()) }, { id: "survivor", budgetMs: 4_000 }, new AbortController().signal);
    await flush(); expect(remote.calls).toHaveLength(1);
    await clock.advance(10);
    expect(await expired).toMatchObject({ kind: "abstention", reason: "source_unavailable" });
    expect(remote.calls[0]!.signal.aborted).toBe(false);
    remote.respond(0, body());
    expect(await survivor).toMatchObject({ kind: "success" });
  });

  it("bounds time spent waiting for shared group admission before network dispatch", async () => {
    const { source, remote, clock, health } = await harness();
    const occupied = await health.admit("evidence.tablebase_probe");
    const pending = source.page(query(), { deadlineMonotonic: 10 });
    await flush(); expect(remote.calls).toHaveLength(0);
    await clock.advance(10);
    expect(await pending).toMatchObject({ kind: "source_failure", reason: "deadline_exceeded" });
    health.settle(occupied, { kind: "success" }); await flush();
    expect(remote.calls).toHaveLength(0);
  });

  it.each([0, 37, 120])("binds repertoire frontier policy without renormalizing unlisted mass (%i games)", async (total) => {
    const { source, remote } = await harness();
    const at = "2026-09-30T12:00:00.000Z";
    const pending = scanRepertoire({ id: "rep", ownerLearnerId: "learner", name: "Black choices", side: "black", rootFen: START, targetElo: 1600, coverageDenominator: 10, sourceKind: "pgn_paste", sourceUrl: null, originalPgn: "", licenceNote: "fixture", digest: repertoireDigest("black", START, []), createdAt: at, updatedAt: at }, [], source, new Date(at));
    await flush(); expect(remote.calls).toHaveLength(1); remote.respond(0, body(total));
    const scan = await pending;
    if (total < 100) {
      expect(scan.unknown).toEqual([expect.objectContaining({ reason: "no_data_at_band", detail: `total ${total} < 100` })]);
      expect(scan.gaps).toEqual([]);
      expect(scan.sourceFailures).toBe(0);
    } else {
      expect(scan.unknown).toEqual([]);
      expect(scan.gaps).toEqual([expect.objectContaining({ replySan: "e4", mass: 0.5 })]);
      expect(scan.uncoveredMass).toBe(0.5);
    }
    expect(remote.calls).toHaveLength(1);
  });

  it("retains the exact requested population on failure despite caller mutation", async () => {
    const { source, remote } = await harness();
    const input = query();
    const askedSince = input.since;
    const pending = source.stats(input);
    input.since = "2025-01";
    await flush(); remote.respond(0, "down", { status: 503 });
    expect(await pending).toMatchObject({ kind: "abstention", reason: "source_unavailable", population: { since: askedSince } });
  });

  it("binds the authenticated production corpus route to the same retained exchange with engines down", { timeout: 30_000 }, async () => {
    const realFetch = globalThis.fetch;
    const requests: string[] = [];
    let markStarted!: () => void;
    let markAborted!: () => void;
    const upstreamStarted = new Promise<void>((resolve) => { markStarted = resolve; });
    const upstreamAborted = new Promise<void>((resolve) => { markAborted = resolve; });
    vi.stubGlobal("fetch", (async (input, init) => {
      if (!String(input).startsWith("https://explorer.lichess.org/lichess?")) return realFetch(input, init);
      requests.push(String(input));
      expect(new Headers(init?.headers).get("authorization")).toBe("Bearer fixture-token");
      if (new URL(String(input)).searchParams.get("fen") === NEXT) {
        return new Promise<Response>((_resolve, reject) => {
          init!.signal!.addEventListener("abort", () => { markAborted(); reject(Object.assign(new Error("upstream aborted"), { name: "AbortError" })); }, { once: true });
          markStarted();
        });
      }
      return Response.json({ ...body(37), moves: new URL(String(input)).searchParams.get("fen")!.includes(" b ") ? [{ uci: "a7a6", san: "MOVE_ROW_SENTINEL_DO_NOT_DISCLOSE", white: 20, draws: 0, black: 0 }] : body(37).moves }, { headers: { etag: '"fixture"' } });
    }) satisfies typeof fetch);
    let application: Awaited<ReturnType<typeof createInMemoryTestApplication>> | undefined;
    try {
      application = await createInMemoryTestApplication({ engineMode: "maia", stockfishCommand: "/nonexistent/tabiya-test-stockfish", maiaHost: "127.0.0.1", maiaPort: 1, cookieSecure: false, corpusToken: "fixture-token" });
      await new Promise<void>((resolve, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
      const registered = await realFetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "explorer_shared", password: "explorer-test-password" }) });
      expect(registered.status).toBe(201);
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
      const created = await realFetch(`${origin}/runs`, {
        method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "explorer-writer" },
        body: JSON.stringify({ id: "explorer-run", session: { kind: "position", start: { fen: START, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "strong_engine" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73 }),
      });
      expect(created.status, await created.clone().text()).toBe(201);
      const { run } = await created.json() as { run: { id: string; nodes: { id: string }[] } };
      const reveal = await realFetch(`${origin}/runs/${run.id}/reveal`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "explorer-writer" }, body: "{}" });
      expect(reveal.status, await reveal.clone().text()).toBe(200);
      const selected = await realFetch(`${origin}/runs/${run.id}/corpus?nodeId=${run.nodes[0]!.id}`, { headers: { cookie } });
      const result = await selected.json();
      expect(selected.status, JSON.stringify(result)).toBe(200);
      expect(result).toMatchObject({ result: { kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100" } });
      expect(requests).toHaveLength(1);
      const delivered = await application.providers.scheduler.get({ operation: "lichess_explorer.position_page@1", request: corpusPageRequest({ ...corpusPopulation(undefined), fen: START }) }, { id: "production-proof", budgetMs: 4_000 }, new AbortController().signal);
      expect(delivered).toMatchObject({ kind: "success", delivery: { kind: "retained_exact", payload: { result: { totals: { total: 37 } } } } });
      expect(requests).toHaveLength(1);
      expect(application.providerHealth.snapshot().providers.find((row) => row.instanceId === "explorer-primary")).toMatchObject({ state: "available" });
      const repeated = await realFetch(`${origin}/runs/${run.id}/corpus?nodeId=${run.nodes[0]!.id}`, { headers: { cookie } });
      expect(repeated.status).toBe(200);
      expect(requests).toHaveLength(1);
      const outsider = await realFetch(`${origin}/runs/${run.id}/corpus?nodeId=${run.nodes[0]!.id}`);
      expect(outsider.status).toBe(401);
      expect(requests).toHaveLength(1);

      const committed = await realFetch(`${origin}/runs/${run.id}/moves`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "explorer-writer" }, body: JSON.stringify({ uci: "g1f3" }) });
      expect(committed.status, await committed.clone().text()).toBe(200);
      const movedRun = (await committed.json() as { run: { activeCursor: { nodeId: string } } }).run;
      const committedReveal = await realFetch(`${origin}/runs/${run.id}/reveal`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "explorer-writer" }, body: "{}" });
      expect(committedReveal.status).toBe(200);
      // The actual authenticated, composed module endpoint uses the admitted sparse page,
      // even though the legacy corpus consumer rejected it under its own 100-game policy.
      const moduleBody = {
        assistance: compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "theory_only", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }),
        query: { timing: "post_commit", subjectNodeId: movedRun.activeCursor.nodeId, requested: ["theory_breadcrumb"] },
      };
      const moduleQuery = await realFetch(`${origin}/runs/${run.id}/modules/query`, { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify(moduleBody) });
      expect(moduleQuery.status, await moduleQuery.clone().text()).toBe(200);
      const modulePage = (await moduleQuery.json() as { page: ModuleQueryPage }).page;
      const moduleTheory = modulePage.packets.find((packet) => packet.module === "theory_breadcrumb")!;
      expect(parsePresentationReceipt(moduleTheory.receipt).map(presentedSentence).join(" ")).toContain("37 games");
      expect(JSON.stringify(moduleTheory.receipt)).not.toMatch(/"e2e4"|canonicalUci|providerSan/u);
      expect(requests).toHaveLength(2);
      const unauthenticatedModule = await realFetch(`${origin}/runs/${run.id}/modules/query`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(moduleBody) });
      expect(unauthenticatedModule.status).toBe(401);
      expect(requests).toHaveLength(2);

      const next = await realFetch(`${origin}/runs`, {
        method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "explorer-writer" },
        body: JSON.stringify({ id: "explorer-cancel", session: { kind: "position", start: { fen: NEXT, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "strong_engine" } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73 }),
      });
      expect(next.status, await next.clone().text()).toBe(201);
      const nextRun = (await next.json() as typeof result).run as { id: string; nodes: { id: string }[] };
      const nextReveal = await realFetch(`${origin}/runs/${nextRun.id}/reveal`, { method: "POST", headers: { "content-type": "application/json", cookie, "x-writer-id": "explorer-writer" }, body: "{}" });
      expect(nextReveal.status).toBe(200);
      const abort = new AbortController();
      const cancelled = realFetch(`${origin}/runs/${nextRun.id}/corpus?nodeId=${nextRun.nodes[0]!.id}`, { headers: { cookie }, signal: abort.signal });
      await upstreamStarted;
      abort.abort();
      await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
      await upstreamAborted;
      await flush();
      expect(application.providerHealth.snapshot().providers.find((row) => row.instanceId === "explorer-primary")).toMatchObject({ state: "available" });
      expect(requests).toHaveLength(3);
    } finally { await application?.close(); vi.unstubAllGlobals(); }
  });
});
