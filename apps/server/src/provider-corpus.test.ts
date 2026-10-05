import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { compileAssistanceRequest, createRun, parsePresentationReceipt, presentedSentence, providerSourceEvidence, type ModuleQueryPage } from "@chess-tabiya/runtime";
import * as runtime from "@chess-tabiya/runtime";
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
import { corpusEvidence } from "../../web/src/lib/inspector-evidence.js";
import { renderCorpusPage } from "../../web/src/lib/corpus-sentences.js";

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

const PREFLIGHT_FAULTS = ["missing_binding_policy", "non_executable_binding", "extra_unregistered_binding"] as const;
// Restore even if application construction fails before a scenario's try/finally.
afterEach(() => vi.restoreAllMocks());
const compileConsumerExecution = runtime.compileEvidenceConsumerExecution;
function preflightControl(id: string, arm: string) {
  const trace: string[] = [];
  const fault = PREFLIGHT_FAULTS.some(value => value === arm);
  const compile = compileConsumerExecution;
  const spy = vi.spyOn(runtime, "compileEvidenceConsumerExecution").mockImplementation((manifest, consumer) => {
    if (consumer.id !== id) return compile(manifest, consumer);
    trace.push("compile");
    expect(consumer.version).toBe(2);
    if (!fault) return compile(manifest, consumer);
    const selected = manifest.bindings.filter(binding => binding.consumer.id === id && binding.consumer.version === 2);
    expect(selected.length).toBeGreaterThan(0);
    const bindings = manifest.bindings.map(binding => {
      if (binding.consumer.id !== id || binding.consumer.version !== 2) return binding;
      if (arm === "non_executable_binding") return { ...binding, latency: { mode: "sync" as const, maxMs: 50 } };
      if (arm !== "missing_binding_policy") return binding;
      const { sourceAbsence: _policy, ...missingPolicy } = binding;
      return missingPolicy;
    });
    if (arm === "extra_unregistered_binding") bindings.push({ ...selected[0]!, adapter: { id: `adapter.${id}.invalid_extra`, version: 2 }, producer: { id: "human.explorer", version: 1 }, projection: { id: "human.explorer.position_stats", version: 1 } });
    return compile({ ...manifest, bindings }, consumer);
  });
  return { trace, fault, spy };
}

describe("learner Explorer shared exchange", () => {
  it.each(["success", "floor", "sparse", "zero", "all_unlisted", "position", "clocks", "ratings", "speeds", "dates", "clone", "failure", "typed_failure", "changed", "changed_open", "revoked", "legacy", "committed_listed", "committed_unlisted", ...PREFLIGHT_FAULTS])("admits Inspector's actual source and registered presentation (%s)", { timeout: 30_000 }, async arm => {
    const { source, remote } = await harness();
    const control = preflightControl("inspector.corpus", arm);
    let mutateDuringFetch: (() => Promise<void>) | undefined;
    const stats = vi.fn(async (asked: CorpusQuery) => {
      if (arm !== "legacy") throw new Error("RAW_FALLBACK_DO_NOT_DISCLOSE");
      const { fen: _fen, ...population } = asked;
      return { kind: "stats" as const, total: 240, white: 240, draws: 0, black: 0, population,
        moves: [{ san: "e4", uci: "e2e4", playedCount: 120, sharePct: 50, white: 120, draws: 0, black: 0 }, { san: "a3", uci: "a2a3", playedCount: 4, sharePct: 1.7, white: 4, draws: 0, black: 0 }], recency: { kind: "month" as const, lastPlayedMonth: "2026-09" } };
    });
    class SuppliedSource implements CorpusSource {
      readonly #source = source;
      readonly stats = stats;
      calls = 0;
      async page(asked: CorpusQuery, options: CorpusRequestOptions = {}) {
        control.trace.push("page");
        this.calls += 1;
        expect(Object.isFrozen(asked)).toBe(true);
        expect(Object.isFrozen(asked.ratings)).toBe(true);
        expect(options.signal).toBeDefined();
        expect(options.deadlineMonotonic).toBeTypeOf("number");
        if (arm === "failure") throw new Error("PRIVATE_PROVIDER_DIAGNOSTIC");
        const crossed = arm === "position" ? { ...asked, fen: NEXT }
          : arm === "clocks" ? { ...asked, fen: START.replace("0 1", "9 23") }
          : arm === "ratings" ? { ...asked, ratings: [1400] as const }
          : arm === "speeds" ? { ...asked, speeds: ["rapid"] as const }
          : arm === "dates" ? { ...asked, since: "2025-01" } : asked;
        const pending = this.#source.page(crossed, options);
        await flush();
        await mutateDuringFetch?.();
        const total = arm === "floor" ? 100 : arm === "sparse" ? 99 : arm === "zero" ? 0 : 240;
        remote.respond(remote.calls.length - 1, { ...body(total), moves: total === 0 || arm === "all_unlisted" ? [] : [{ uci: arm === "position" ? "e7e5" : "e2e4", san: "PRIVATE_PROVIDER_SAN", white: 120 > total ? 60 : 120, draws: 0, black: 0 }, { uci: arm === "position" ? "a7a6" : "a2a3", san: "PRIVATE_PROVIDER_SAN", white: 4, draws: 0, black: 0 }], ...(arm === "typed_failure" ? { white: "invalid" } : {}) });
        const acquired = await pending;
        return arm === "clone" && acquired.kind === "page" ? { ...acquired, evidence: { ...acquired.evidence } } : acquired;
      }
    }
    const supplied = new SuppliedSource();
    const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, corpusSource: arm === "legacy" ? { stats } : supplied });
    try {
      await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
      const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "inspector_owner", password: "inspector-test-password" }) });
      expect(registered.status).toBe(201);
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
      const headers = { "content-type": "application/json", cookie, "x-writer-id": "inspector-writer" };
      const created = await fetch(`${origin}/runs`, { method: "POST", headers, body: JSON.stringify({ id: "inspector-root", session: { kind: "position", start: { fen: START, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1600 } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73 }) });
      expect(created.status).toBe(201);
      const { run } = await created.json() as { run: { nodes: { id: string }[] } };
      const endpoint = `${origin}/runs/inspector-root/corpus?nodeId=${run.nodes[0]!.id}`;
      expect((await fetch(endpoint)).status).toBe(401);
      expect((await fetch(endpoint, { headers })).status).toBe(409);
      expect(supplied.calls).toBe(0);
      expect((await fetch(`${origin}/runs/inspector-root/reveal`, { method: "POST", headers, body: "{}" })).status).toBe(200);
      if (arm.startsWith("committed_")) {
        expect((await fetch(`${origin}/runs/inspector-root/moves`, { method: "POST", headers, body: JSON.stringify({ uci: arm === "committed_listed" ? "e2e4" : "g1f3" }) })).status).toBe(200);
        expect((await fetch(`${origin}/runs/inspector-root/reveal`, { method: "POST", headers, body: "{}" })).status).toBe(200);
      }
      let readerHeaders = headers;
      if (arm === "revoked") {
        const guest = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "inspector_guest", password: "inspector-test-password" }) });
        expect(guest.status).toBe(201);
        readerHeaders = { ...headers, cookie: guest.headers.get("set-cookie")!.split(";", 1)[0]! };
        expect((await fetch(`${origin}/runs/inspector-root/grants`, { method: "POST", headers, body: JSON.stringify({ op: "grant", handle: "inspector_guest", role: "host" }) })).status).toBe(200);
        mutateDuringFetch = async () => { expect((await fetch(`${origin}/runs/inspector-root/grants`, { method: "POST", headers, body: JSON.stringify({ op: "revoke", handle: "inspector_guest" }) })).status).toBe(200); };
      } else if (arm === "changed" || arm === "changed_open") mutateDuringFetch = async () => {
        expect((await fetch(`${origin}/runs/inspector-root/moves`, { method: "POST", headers, body: JSON.stringify({ uci: "e2e4" }) })).status).toBe(200);
        if (arm === "changed_open") expect((await fetch(`${origin}/runs/inspector-root/reveal`, { method: "POST", headers, body: "{}" })).status).toBe(200);
      };
      const response = await fetch(endpoint, { headers: readerHeaders });
      const page = await response.json();
      if (["changed", "changed_open", "revoked"].includes(arm)) {
        expect(response.status, JSON.stringify(page)).toBe(arm === "revoked" ? 404 : 409);
        expect(page.error.code).toBe(arm === "revoked" ? "RUN_NOT_FOUND" : "ASSISTANCE_WITHHELD");
        expect(JSON.stringify(page)).not.toMatch(/PRIVATE_PROVIDER|presentation|canonicalSan|240/u);
        expect(stats).not.toHaveBeenCalled();
        expect(supplied.calls).toBe(1);
        return;
      }
      expect(response.status, JSON.stringify(page)).toBe(200);
      expect(supplied.calls).toBe(arm === "legacy" || control.fault ? 0 : 1);
      if (arm === "success") expect(control.trace).toEqual(["compile", "page"]);
      if (control.fault) expect(control.trace).toEqual(["compile"]);
      if (arm === "legacy") expect(control.trace).toEqual([]);
      expect(stats).toHaveBeenCalledTimes(arm === "legacy" ? 1 : 0);
      expect(page.population).toMatchObject({ ratings: [1600], speeds: ["blitz", "rapid", "classical"] });
      // Explorer describes a position population, not a fifty-move-rule claim. Its sole
      // normalizer deliberately neutralizes counters; a clock-equivalent page is positive.
      const shown = ["success", "floor", "clocks", "legacy", "all_unlisted", "committed_listed", "committed_unlisted"].includes(arm);
      expect(page.status).toEqual(shown ? { kind: "shown" } : arm === "sparse" || arm === "zero" ? { kind: "below_floor", total: arm === "zero" ? 0 : 99 } : { kind: "source_unavailable" });
      const items = parsePresentationReceipt(page.presentation);
      expect(corpusEvidence(page)).toBe(page);
      expect(renderCorpusPage(page).join(" ")).toContain("Lichess explorer");
      if (shown) {
        const text = items.map(presentedSentence).join(" ");
        if (arm !== "all_unlisted") {
          expect(text).toContain("e4");
          expect(text).toContain("below the 100-game per-move floor");
        }
        expect(text).toContain("2026-09");
        expect(text).toContain(arm === "floor" ? "36" : arm === "all_unlisted" ? "240 games are outside" : "116");
        expect(items.every(item => item.adapter.consumer.id === "inspector.corpus" && item.adapter.consumer.version === (arm === "legacy" ? 1 : 2) && item.adapter.projection.id === (arm === "legacy" ? "human.explorer.population" : "derived.explorer.inspector_population"))).toBe(true);
      } else expect(items).toHaveLength(0);
      expect(page.committedMoveSan).toBe(arm === "committed_listed" ? "e4" : arm === "committed_unlisted" ? "Nf3" : null);
      expect(page.committedMoveListed).toBe(arm === "committed_listed" ? true : arm === "committed_unlisted" ? false : null);
      expect(JSON.stringify(page)).not.toMatch(/PRIVATE_PROVIDER|RAW_FALLBACK|requestedIdentity|payloadReceipt|providerSan|responseBody/u);
    } finally { control.spy.mockRestore(); await application.close(); }
  });

  it("bounds modern return-frequency lookups, intake and same-day reordering", async () => {
    const { source, remote } = await harness();
    const store = new SQLiteRunStorage(":memory:");
    try {
      const service = new RunService(store, { progressStorage: store });
      const dueAt = "2026-09-01T12:00:00.000Z";
      store.create(createRun({ id: "return-bounds", packId: "fixture", packDigest: `sha256:${"b".repeat(64)}`, startFen: START, policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 7, createdAt: dueAt }), "return-bounds-writer", "Return bounds");
      for (let index = 0; index < 45; index += 1) store.createSchedule({
        id: `return-${String(index).padStart(2, "0")}`, learnerId: "__legacy", rootKey: `position||return-${index}`,
        sessionKind: "position", packId: null, rootTransposeKey: START.split(" ").slice(0, 4).join(" "),
        kind: "varied", variant: null, origin: "learner", dueAt, createdAt: dueAt, sourceRunId: null, sourceNodeId: null,
      });
      const stats = vi.fn(async () => { throw new Error("bare statistics forbidden"); });
      const page = vi.fn(async (asked: CorpusQuery, options?: CorpusRequestOptions) => {
        const pending = source.page(asked, options);
        await flush();
        if (remote.calls.length === 1 && !remote.calls[0]!.signal.aborted && page.mock.calls.length === 1) remote.respond(0, body());
        return pending;
      });
      const queue = await service.dueQueue({ learnerId: "__legacy", handle: "__legacy" }, dueAt, { stats, page });
      expect(page).toHaveBeenCalledTimes(40);
      expect(remote.calls).toHaveLength(1);
      expect(stats).not.toHaveBeenCalled();
      expect(queue.intakeLimit).toBe(20);
      expect(queue.waiting).toBe(25);
      expect(queue.schedules.map(row => row.id)).toEqual(Array.from({ length: 20 }, (_, index) => `return-${String(index).padStart(2, "0")}`));
      expect(queue.schedules.every(row => row.frequency?.games === 120)).toBe(true);
      expect(service.due({ learnerId: "__legacy", handle: "__legacy" }, dueAt)).toHaveLength(45);
      const caller = new AbortController(); caller.abort();
      await expect(service.dueQueue({ learnerId: "__legacy", handle: "__legacy" }, dueAt, { stats, page }, caller.signal)).rejects.toMatchObject({ name: "AbortError" });
      expect(page).toHaveBeenCalledTimes(40);
    } finally { store.close(); }
  });

  it("cancels the actual due-queue source on client disconnect without more lookups or health damage", { timeout: 30_000 }, async () => {
    const { source, remote, health } = await harness();
    let started!: () => void; let aborted!: () => void;
    const didStart = new Promise<void>(resolve => { started = resolve; });
    const didAbort = new Promise<void>(resolve => { aborted = resolve; });
    const stats = vi.fn(async () => { throw new Error("bare statistics forbidden"); });
    const page = vi.fn(async (asked: CorpusQuery, options: CorpusRequestOptions = {}) => {
      const pending = source.page(asked, options);
      await flush();
      remote.calls.at(-1)!.signal.addEventListener("abort", aborted, { once: true });
      started();
      return pending;
    });
    const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, corpusSource: { stats, page } });
    const caller = new AbortController();
    try {
      await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
      const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "return_cancel", password: "return-test-password" }) });
      expect(registered.status).toBe(201);
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
      const headers = { "content-type": "application/json", cookie, "x-writer-id": "return-writer" };
      for (const [index, fen] of [START, "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2"].entries()) {
        const created = await fetch(`${origin}/runs`, { method: "POST", headers, body: JSON.stringify({ id: `cancel-return-${index}`, session: { kind: "position", start: { fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1600 } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73 }) });
        expect(created.status).toBe(201);
        expect((await fetch(`${origin}/runs/cancel-return-${index}/moves`, { method: "POST", headers, body: JSON.stringify({ uci: index === 0 ? "e2e4" : "g1f3" }) })).status).toBe(200);
      }
      const cancelled = fetch(`${origin}/progress/due?at=9999-12-31T23:59:59.999Z`, { headers: { cookie }, signal: caller.signal });
      await didStart;
      caller.abort();
      await expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
      await didAbort; await flush();
      expect(page).toHaveBeenCalledTimes(1);
      expect(stats).not.toHaveBeenCalled();
      expect(remote.calls).toHaveLength(1);
      expect(health.operationAvailability("evidence.explorer_query").state).toBe("requestable_unverified");
      expect(application.providerHealth.operationAvailability("evidence.explorer_query").state).toBe("requestable_unverified");
    } finally { caller.abort(); await application.close(); }
  });

  it.each(["success", "floor", "sparse", "zero", "position", "ratings", "speeds", "dates", "clone", "failure", "typed_failure", "legacy", ...PREFLIGHT_FAULTS])("admits return frequency at the authenticated due queue (%s)", { timeout: 30_000 }, async arm => {
    const { source, remote } = await harness();
    const control = preflightControl("runtime.return_frequency", arm);
    const stats = vi.fn(async (asked: CorpusQuery) => ({ kind: "stats" as const, total: 70000, white: 70000, draws: 0, black: 0,
      moves: [{ san: "RAW_FALLBACK_DO_NOT_DISCLOSE", uci: "e2e4", playedCount: 60, sharePct: 50, white: 60, draws: 0, black: 0 }],
      recency: { kind: "absent" as const }, population: { source: asked.source, ratings: asked.ratings, speeds: asked.speeds, since: asked.since, until: asked.until } }));
    class SuppliedSource implements CorpusSource {
      readonly #source = source;
      readonly stats = stats;
      calls = 0;
      async page(asked: CorpusQuery, options: CorpusRequestOptions = {}) {
        control.trace.push("page");
        this.calls += 1;
        expect(options.signal).toBeDefined();
        expect(options.deadlineMonotonic).toBeTypeOf("number");
        expect(Object.isFrozen(asked)).toBe(true);
        expect(Object.isFrozen(asked.ratings)).toBe(true);
        expect(Object.isFrozen(asked.speeds)).toBe(true);
        if (arm === "failure") throw new Error("source unavailable");
        const crossed = arm === "position" ? { ...asked, fen: NEXT }
          : arm === "ratings" ? { ...asked, ratings: [1400] as const }
          : arm === "speeds" ? { ...asked, speeds: ["rapid"] as const }
          : arm === "dates" ? { ...asked, since: "2025-01" } : asked;
        const acquiring = this.#source.page(crossed, options);
        await flush();
        const total = arm === "sparse" ? 99 : arm === "zero" ? 0 : arm === "floor" ? 100 : asked.fen.startsWith(START.split(" ")[0]!) ? 120 : 70000;
        remote.respond(remote.calls.length - 1, { ...body(total), moves: [], ...(arm === "typed_failure" ? { white: "invalid" } : {}) });
        const acquired = await acquiring;
        return arm === "clone" && acquired.kind === "page" ? { ...acquired, evidence: { ...acquired.evidence } } : acquired;
      }
    }
    const supplied = new SuppliedSource();
    const application = await createInMemoryTestApplication({ engineMode: "mock", cookieSecure: false, corpusSource: arm === "legacy" ? { stats } : supplied });
    try {
      await new Promise<void>((resolve, reject) => { application.server.once("error", reject); application.server.listen(0, "127.0.0.1", resolve); });
      const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
      const registered = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle: "return_owner", password: "return-test-password" }) });
      expect(registered.status).toBe(201);
      const cookie = registered.headers.get("set-cookie")!.split(";", 1)[0]!;
      const headers = { "content-type": "application/json", cookie, "x-writer-id": "return-writer" };
      const roots = [START, "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2"];
      for (const [index, fen] of roots.entries()) {
        const created = await fetch(`${origin}/runs`, { method: "POST", headers, body: JSON.stringify({ id: `return-root-${index}`, session: { kind: "position", start: { fen, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1600 } }, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 73 }) });
        expect(created.status, await created.clone().text()).toBe(201);
        const committed = await fetch(`${origin}/runs/return-root-${index}/moves`, { method: "POST", headers, body: JSON.stringify({ uci: index === 0 ? "e2e4" : "g1f3" }) });
        expect(committed.status, await committed.clone().text()).toBe(200);
      }
      const due = `${origin}/progress/due?at=9999-12-31T23:59:59.999Z`;
      expect((await fetch(due)).status).toBe(401);
      expect(supplied.calls).toBe(0);
      expect(stats).not.toHaveBeenCalled();
      const response = await fetch(due, { headers: { cookie } });
      expect(response.status, await response.clone().text()).toBe(200);
      const page = await response.json() as { schedules: { sourceRunId: string; frequency: { games: number; population: unknown } | null }[]; intakeLimit: number; waiting: number };
      expect(page.schedules).toHaveLength(2);
      expect(page.intakeLimit).toBe(20);
      expect(page.waiting).toBe(0);
      expect(page.schedules.map(row => row.sourceRunId)).toEqual(arm === "success" ? ["return-root-1", "return-root-0"] : ["return-root-0", "return-root-1"]);
      const counts = arm === "success" ? [70000, 120] : arm === "legacy" ? [70000, 70000] : arm === "floor" ? [100, 100] : [null, null];
      expect(page.schedules.map(row => row.frequency?.games ?? null)).toEqual(counts);
      for (const row of page.schedules) if (row.frequency !== null) expect(row.frequency.population).toEqual(corpusPopulation(1600));
      expect(JSON.stringify(page)).not.toMatch(/RAW_FALLBACK|canonicalUci|providerSan|normalizedRequestDigest|responseDigest|"moves"|"page"/u);
      expect(supplied.calls).toBe(arm === "legacy" || control.fault ? 0 : ["failure", "typed_failure"].includes(arm) ? 1 : 2);
      if (arm === "success") expect(control.trace).toEqual(["compile", "page", "compile", "page"]);
      if (control.fault) expect(control.trace).toEqual(["compile", "compile"]);
      if (arm === "legacy") expect(control.trace).toEqual([]);
      if (arm === "failure") expect(application.providerHealth.operationAvailability("evidence.explorer_query").state).toBe("temporarily_blocked");
      if (arm === "typed_failure") expect(application.providerHealth.operationAvailability("evidence.explorer_query").state).toBe("unavailable");
      expect(stats).toHaveBeenCalledTimes(arm === "legacy" ? 2 : 0);
    } finally { control.spy.mockRestore(); await application.close(); }
  });

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

  it.each(["success", "sparse", "zero", "population", "clone", "failure", ...PREFLIGHT_FAULTS])("retains modern source admission through authenticated repertoire import and scan (%s)", { timeout: 30_000 }, async arm => {
    const { source, remote } = await harness();
    const control = preflightControl("runtime.repertoire_scan", arm);
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
        control.trace.push("page");
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
      expect(page!.scan.sourceFailures).toBe(["population", "clone", "failure"].includes(arm) || control.fault ? 1 : 0);
      expect(stats).not.toHaveBeenCalled();
      expect(supplied.calls).toBe(control.fault ? 0 : 1);
      if (arm === "success") expect(control.trace).toEqual(["compile", "page"]);
      if (control.fault) expect(control.trace).toEqual(["compile"]);
      if (["success", "sparse", "zero"].includes(arm)) expect(application.providerHealth.operationAvailability("evidence.explorer_query").state).toBe("available");
      expect((await fetch(`${route}/gaps`)).status).toBe(401);
      expect(supplied.calls).toBe(control.fault ? 0 : 1);
    } finally { control.spy.mockRestore(); await application.close(); }
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

  it.each(["success", "sparse", "zero", "position", "ratings", "speeds", "dates", "clone", "failure", "typed_failure", "legacy", "changed", "revoked", "disconnect", "missing_binding_policy", "non_executable_binding"])("admits supplied Theory pages at authenticated application composition (%s)", { timeout: 30_000 }, async arm => {
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
    const originalCompile = runtime.compileEvidenceConsumerExecution;
    const compileConsumer = vi.spyOn(runtime, "compileEvidenceConsumerExecution").mockImplementation((manifest, consumer) => {
      if (consumer.id !== "module.theory_breadcrumb" || !["missing_binding_policy", "non_executable_binding"].includes(arm)) return originalCompile(manifest, consumer);
      // Fault injection at the compiled contract, not source evidence. A valid single
      // projection must not conceal an absent policy or a non-executable binding.
      const bindings = manifest.bindings.map(binding => {
        if (binding.consumer.id !== consumer.id || binding.projection.id !== "derived.explorer.population_summary") return binding;
        if (arm === "non_executable_binding") return { ...binding, latency: { mode: "sync" as const, maxMs: 50 } };
        const { sourceAbsence: _policy, ...missingPolicy } = binding;
        return missingPolicy;
      });
      return originalCompile({ ...manifest, bindings }, consumer);
    });
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
      expect(compileConsumer).not.toHaveBeenCalled();
      const pending = ask("theory_only");
      if (["missing_binding_policy", "non_executable_binding"].includes(arm)) {
        const refusal = await pending;
        expect(refusal.status).toBe(500);
        expect(supplied.calls).toBe(0);
        expect(stats).not.toHaveBeenCalled();
        expect(compileConsumer).toHaveBeenCalledOnce();
        expect(await refusal.text()).not.toMatch(/MOVE_ROW_SENTINEL|RAW_FALLBACK|\d+ games/u);
        return;
      }
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
      expect(compileConsumer).toHaveBeenCalledOnce();
      const [manifest, consumer] = compileConsumer.mock.calls[0]!;
      expect(consumer).toEqual({ id: "module.theory_breadcrumb", version: 1 });
      expect(manifest.bindings.filter(binding => binding.consumer.id === consumer.id)).toHaveLength(4);
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
    } finally { compileConsumer.mockRestore(); release(); await application.close(); }
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
      expect(result).toMatchObject({ status: { kind: "below_floor", total: 37 }, presentation: { protocol: "presentation.receipt@1", items: [] } });
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
