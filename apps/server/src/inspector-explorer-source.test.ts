// Synthetic HTTP pages prove real source/permission/occurrence joins, not population truth.
import { afterEach, describe, expect, it, vi } from "vitest";
import { commitMove, compileAssistanceRequest, createRun, fork, moduleDecisionStamp, reachCheckpoint, revealFeedback, rewind, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import * as runtime from "@chess-tabiya/runtime";
import { START_FEN } from "../../../packages/runtime/src/provider-test-fixtures.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorExplorerSource } from "./inspector-explorer-source.js";
import { ControlledFetch, ManualClock, flush } from "./provider-exchange.test-support.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { corpusPopulation, type CorpusQuery } from "./corpus.js";
import { ExchangeCorpusSource, corpusPageRequest } from "./provider-corpus.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { PackRegistry } from "./pack-registry.js";
import { orchestratePackMove } from "./pack-orchestrator.js";

const at = "2026-11-02T20:00:00.000Z", owner = { learnerId: "explorer-owner", handle: "explorer-owner" }, reader = { learnerId: "explorer-reader", handle: "explorer-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "external", tts: "none", tablebase: "none" });
const body = (total = 120, uci = "g1f3") => ({ white: total, draws: 0, black: 0,
  moves: total === 0 ? [] : [{ uci, san: "UNTRUSTED_PROVIDER_SAN", white: Math.min(total, 50), draws: 0, black: 0, averageRating: 1640 }],
  history: [{ month: "2026-10", white: total, draws: 0, black: 0 }], opening: { eco: "A00", name: "Synthetic report, not an opening authority" } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

async function fixture(side: "white" | "black" = "white", options: { pack?: boolean; legacy?: boolean; absent?: boolean; moves?: readonly string[] } = {}) {
  const clock = new ManualClock(), remote = new ControlledFetch();
  const providers = composeProviderTraversalApplication({ engines: null, tablebaseFetch: null, explorerFetch: remote.fetch, explorerToken: "fixture-token", monotonicNowMs: clock.now, wallNow: clock.wall });
  const source = new ExchangeCorpusSource({ scheduler: providers.scheduler, monotonicNowMs: clock.now });
  const stats = vi.spyOn(source, "stats").mockImplementation(async () => { throw new Error("No stats fallback for Full Inspector sources"); });
  const legacy = { stats: vi.fn(async () => { throw new Error("No legacy fallback"); }) };
  const document = options.pack ? withDerivedRequires({ id: "explorer-source-trajectory", version: "1.0.0", title: "Synthetic source grant fixture",
    mode: "trajectory", phase: "cross_phase", start: { fen: START_FEN, side }, objective: { type: "run_trajectory", summary: "Mechanical source boundary only" },
    legs: [{ id: "entry", objective: { type: "execute_break", summary: "Mechanical boundary", successConditions: [{ kind: "reach_checkpoint", checkpointId: "middle", to: "preserved" }] }, opponentPolicy: { mode: "human_common", targetElo: 1200 } },
      { id: "middle", entryCheckpointId: "middle", objective: { type: "play_until_checkpoint", summary: "Mechanical continuation" }, opponentPolicy: { mode: "strong_engine" } }],
    checkpoints: [{ id: "opened", trigger: { atStart: true }, actions: [] }, { id: "middle", trigger: { atPly: 1 }, actions: [] }],
    opponentPolicy: { mode: "human_common", targetElo: 1800 }, feedbackPolicy: "delayed_checkpoint", provenance: { reviewStatus: "schema_example", sources: [] } }) : undefined;
  const registry = document === undefined ? undefined : await PackRegistry.fromDocuments([{ source: "synthetic-explorer", value: document }]), pack = registry?.required(document!.id);
  let run = createRun({ id: `explorer-source-${side}`, session: pack === undefined
    ? { kind: "position", start: { fen: START_FEN, side }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common", targetElo: 1500 } }
    : { kind: "pack", packId: pack.document.id, packDigest: pack.digest, start: { fen: START_FEN, side }, feedbackPolicy: "delayed_checkpoint", opponentPolicy: { mode: "human_common", targetElo: 1800 } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "per_branch", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 42, createdAt: at });
  if (pack !== undefined) run = reachCheckpoint(run, "opened", at).run;
  for (const move of options.moves ?? ["e2e4", "e7e5"]) { const mutation = commitMove(run, move, { at }); run = pack === undefined ? mutation.run : orchestratePackMove(pack.document, run, mutation).run; }
  if (pack === undefined) run = revealFeedback(run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { learnerId: owner.learnerId, writerId: "explorer-source-writer" }; storage.create(run, lease); storage.grantRole(run.id, reader.learnerId, "host", lease, at);
  const service = new RunService(storage, { ...(options.absent ? {} : { corpusSource: options.legacy ? legacy : source }), ...(registry === undefined ? {} : { packRegistry: registry }) });
  const intent = compileAssistanceRequest({ contextHint: pack === undefined ? "position" : "pack", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const controller = new AbortController();
  const context = (nodeId = run.nodes[0]!.id, principal = owner, branchId = run.activeCursor.branchId, kind: "position" | "branch" = "position") =>
    service.resolveInspectorRecordedContext(run.id, principal, intent, availability, { branchId, nodeId,
      decisionDigest: moduleDecisionStamp(storage.read(run.id)!.run).digest, context: kind === "position" ? { kind } : { kind, throughNodeId: nodeId } }, controller.signal);
  const acquire = async (total = 120, token = context(), uci = "g1f3") => {
    const index = remote.calls.length, pending = service.acquireInspectorExplorerSource(token, controller.signal);
    await flush(); if (remote.calls.length > index) remote.respond(index, body(total, uci));
    const handle = await pending;
    return { handle, image: service.readInspectorExplorerSource(handle) };
  };
  return { source, stats, legacy, clock, remote, run, storage, lease, service, controller, context, acquire, registry };
}

describe("current Inspector Explorer source under real SQLite/RunService grants", () => {
  it.each((["white", "black"] as const).flatMap(side => [0, 99, 100, 120].map(total => ({ side, total }))))("retains $side's genuine total$total before any floor/renderer", async ({ side, total }) => {
    const f = await fixture(side), stored = JSON.stringify(f.storage.read(f.run.id)), factory = vi.spyOn(runtime, "deriveExplorerInspectorPopulation");
    const { image, handle } = await f.acquire(total);
    expect(factory).toHaveBeenCalledOnce(); expect(image.result).toBe(factory.mock.results[0]!.value); expect(image.page).toBe(factory.mock.calls[0]![0]);
    expect(image.result!.payload.page).toBe(image.page); expect(image.result!.payload.totals.total).toBe(total);
    expect(image.result!.payload.moves[0]?.san).toBe(total === 0 ? undefined : "Nf3");
    expect(image.outcome).toEqual({ kind: "available", collected: 1 }); expect(image.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(Object.isFrozen(image.query)).toBe(true); expect(Object.isFrozen(image.query.ratings)).toBe(true);
    expect(image.query).toEqual({ ...corpusPopulation(1500), fen: START_FEN });
    expect(image.page!.payload.payload.request).toEqual(corpusPageRequest(image.query));
    expect(f.service.readInspectorExplorerSource(handle)).toBe(image); expect(f.remote.calls).toHaveLength(1);
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(stored); expect(f.stats).not.toHaveBeenCalled();
  });

  it.each(["white", "black"] as const)("uses %s's selected historical node, not active tip or incoming edge", async side => {
    const f = await fixture(side), node = f.run.nodes[1]!, { image } = await f.acquire(120, f.context(node.id), "c7c5");
    expect(image.query.fen).toBe(node.fen); expect(image.result!.payload.moves[0]!.uci).toBe("c7c5");
    expect(new URL(f.remote.calls[0]!.url).searchParams.get("fen")).toContain(node.fen.split(" ").slice(0, 4).join(" "));
  });

  it.each(["white", "black"] as const)("joins %s's inherited same-board source to the actually granted fork occurrence", async side => {
    const f = await fixture(side), inherited = f.run.nodes[1]!, first = await f.acquire(99, f.context(inherited.id), "c7c5");
    const branched = revealFeedback(fork(rewind(f.run, inherited.id, at).run, inherited.id, { at }).run, at).run; f.storage.save(branched, f.lease);
    const next = await f.acquire(99, f.context(inherited.id, owner, branched.activeCursor.branchId), "c7c5");
    expect(next.image.sourceKey).not.toBe(first.image.sourceKey); expect(next.image.query).toEqual(first.image.query);
    expect(next.image.page!.payload.acquisition).toBe(first.image.page!.payload.acquisition); expect(f.remote.calls).toHaveLength(1);
    expect(() => f.service.readInspectorExplorerSource(first.handle)).toThrow();
  });

  it("binds the unchanged full event head even when stamp, selected node and exact cached page bytes agree", async () => {
    const f = await fixture(), other = await fixture("white", { moves: ["d2d4", "d7d5"] });
    await f.acquire(); // prime the genuine shared exchange so both inspected deliveries are retained_exact
    const first = await f.acquire();
    vi.spyOn(other.source, "page").mockImplementation(f.source.page.bind(f.source));
    const second = await other.acquire();
    expect(moduleDecisionStamp(f.run)).toEqual(moduleDecisionStamp(other.run));
    expect(first.image.query).toEqual(second.image.query);
    expect(first.image.page!.payload).toEqual(second.image.page!.payload);
    expect(f.run.events).not.toEqual(other.run.events);
    expect(second.image.sourceKey).not.toBe(first.image.sourceKey);
    expect(f.remote.calls).toHaveLength(1); expect(other.remote.calls).toHaveLength(0);
  });

  it.each(["position", "ratings", "speeds", "since", "until", "clone"] as const)("refuses genuine/copy %s page mismatch before deriving", async fault => {
    const f = await fixture(), original = f.source.page.bind(f.source), factory = vi.spyOn(runtime, "deriveExplorerInspectorPopulation");
    vi.spyOn(f.source, "page").mockImplementation(async (asked, options) => {
      const query: CorpusQuery = fault === "position" ? { ...asked, fen: f.run.nodes[2]!.fen }
        : fault === "ratings" ? { ...asked, ratings: [1800] } : fault === "speeds" ? { ...asked, speeds: ["rapid"] }
        : fault === "since" ? { ...asked, since: "2025-01" } : fault === "until" ? { ...asked, until: "2026-10" } : asked;
      const value = await original(query, options);
      return fault === "clone" ? JSON.parse(JSON.stringify(value)) : value;
    });
    await expect(f.acquire()).rejects.toThrow(); expect(factory).not.toHaveBeenCalled(); expect(f.stats).not.toHaveBeenCalled();
  });

  it("admits clock-equivalent pages through the unchanged counter-neutral Explorer normalizer", async () => {
    const f = await fixture(), original = f.source.page.bind(f.source);
    vi.spyOn(f.source, "page").mockImplementation((asked, options) => original({ ...asked, fen: asked.fen.replace("0 1", "37 90") }, options));
    expect((await f.acquire(99)).image.result!.payload.totals.total).toBe(99);
  });

  it.each([{ absent: true }, { legacy: true }])("does zero work for actual unconfigured/legacy-only source: %j", async options => {
    const f = await fixture("white", options), { image } = await f.acquire();
    expect(image.outcome).toEqual({ kind: "unavailable", reason: "provider_unavailable" });
    expect(image.page).toBeNull(); expect(image.result).toBeNull(); expect(image.sourceKey).toBeNull(); expect(image.failure).toBeNull();
    expect(f.remote.calls).toHaveLength(0); expect(f.legacy.stats).not.toHaveBeenCalled(); expect(f.stats).not.toHaveBeenCalled();
  });

  it.each(["revoke", "role", "storage", "disclosure", "cancel"] as const)("refuses %s during actual fetch before narrowing", async fault => {
    const f = await fixture(), context = f.context(f.run.nodes[0]!.id, reader), factory = vi.spyOn(runtime, "deriveExplorerInspectorPopulation");
    const pending = f.service.acquireInspectorExplorerSource(context, f.controller.signal), failure = expect(pending).rejects.toThrow();
    await flush(); expect(f.remote.calls).toHaveLength(1);
    if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
    if (fault === "storage") f.storage.save(rewind(f.run, f.run.activeCursor.nodeId, at).run, f.lease);
    if (fault === "disclosure") f.storage.save(commitMove(f.run, "g1f3", { at }).run, f.lease);
    if (fault === "cancel") f.controller.abort();
    f.remote.respond(0, body()); await failure;
    expect(factory).not.toHaveBeenCalled(); expect(f.stats).not.toHaveBeenCalled();
  });

  it.each(["revoke", "role", "storage", "disclosure", "cancel"] as const)("revalidates retained %s authority rather than trusting the old result", async fault => {
    const f = await fixture(), { handle } = await f.acquire(99, f.context(f.run.nodes[0]!.id, reader));
    if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
    if (fault === "storage") f.storage.save(rewind(f.run, f.run.activeCursor.nodeId, at).run, f.lease);
    if (fault === "disclosure") f.storage.save(commitMove(f.run, "g1f3", { at }).run, f.lease);
    if (fault === "cancel") f.controller.abort();
    expect(() => f.service.readInspectorExplorerSource(handle)).toThrow(); expect(f.remote.calls).toHaveLength(1);
  });

  it("refuses copied/foreign/wrong-scope contexts, copied sources and pre-aborted requests without fetching", async () => {
    const f = await fixture(), foreign = await fixture("black"), context = f.context();
    for (const candidate of [{ ...context }, foreign.context(), f.context(f.run.nodes[0]!.id, owner, f.run.activeCursor.branchId, "branch")]) {
      await expect(f.service.acquireInspectorExplorerSource(candidate as InspectorRecordedContext, f.controller.signal)).rejects.toThrow();
    }
    const { handle } = await f.acquire(); expect(() => f.service.readInspectorExplorerSource({ ...handle } as InspectorExplorerSource)).toThrow();
    const pendingContext = f.context(); f.controller.abort();
    await expect(f.service.acquireInspectorExplorerSource(pendingContext, f.controller.signal)).rejects.toThrow(); expect(f.remote.calls).toHaveLength(1);
  });

  it("retains actual provider failure and never relabels it as a sparse population", async () => {
    const f = await fixture(), factory = vi.spyOn(runtime, "deriveExplorerInspectorPopulation");
    const pending = f.service.acquireInspectorExplorerSource(f.context(), f.controller.signal); await flush();
    f.remote.respond(0, "PRIVATE_PROVIDER_DIAGNOSTIC", { status: 503 });
    const image = f.service.readInspectorExplorerSource(await pending);
    expect(image.outcome).toEqual({ kind: "failed", reason: "provider_failed" }); expect(image.failure?.kind).toBe("source_failure");
    expect(image.page).toBeNull(); expect(image.result).toBeNull(); expect(image.sourceKey).toBeNull(); expect(factory).not.toHaveBeenCalled(); expect(f.stats).not.toHaveBeenCalled();
  });

  it("preserves actual caller expiry without inventing a zero-row source or querying stats", async () => {
    const f = await fixture(), original = f.source.page.bind(f.source), factory = vi.spyOn(runtime, "deriveExplorerInspectorPopulation");
    vi.spyOn(f.source, "page").mockImplementation((query, options) => original(query, { ...options, deadlineMonotonic: 0 }));
    const { image } = await f.acquire();
    expect(image.failure).toEqual({ kind: "caller_expired" }); expect(image.outcome).toEqual({ kind: "failed", reason: "provider_failed" });
    expect(image.page).toBeNull(); expect(image.result).toBeNull(); expect(image.sourceKey).toBeNull();
    expect(factory).not.toHaveBeenCalled(); expect(f.remote.calls).toHaveLength(0); expect(f.stats).not.toHaveBeenCalled();
  });

  it("propagates acquisition exceptions rather than disguising them as source absence", async () => {
    const f = await fixture(); vi.spyOn(f.source, "page").mockRejectedValue(new Error("synthetic transport failure"));
    await expect(f.acquire()).rejects.toThrow("synthetic transport failure"); expect(f.stats).not.toHaveBeenCalled();
  });

  it("refuses a genuine narrow result from another whole-page source before publication", async () => {
    const f = await fixture(), foreign = await fixture("black"), other = (await foreign.acquire(99)).image.result!;
    const factory = vi.spyOn(runtime, "deriveExplorerInspectorPopulation").mockReturnValue(other);
    await expect(f.acquire(99)).rejects.toMatchObject({ reason: "source_contract_invalid" }); expect(factory).toHaveBeenCalledOnce();
  });

  it("revalidates actual current disclosure after the narrow factory returns", async () => {
    const f = await fixture(), original = runtime.deriveExplorerInspectorPopulation;
    vi.spyOn(runtime, "deriveExplorerInspectorPopulation").mockImplementation(page => {
      const result = original(page); f.storage.save(commitMove(f.run, "g1f3", { at }).run, f.lease); return result;
    });
    await expect(f.acquire(99)).rejects.toMatchObject({ code: "ASSISTANCE_WITHHELD" });
  });

  it.each(["white", "black"] as const)("derives %s's population from the actual selected trajectory leg, not run/tip band", async side => {
    const f = await fixture(side, { pack: true });
    const first = await f.acquire(120), middle = await f.acquire(120, f.context(f.run.nodes[1]!.id), "c7c5");
    expect(first.image.query).toEqual({ ...corpusPopulation(1200), fen: START_FEN });
    expect(middle.image.query).toEqual({ ...corpusPopulation(undefined), fen: f.run.nodes[1]!.fen }); expect(middle.image.query.ratings.length).toBeGreaterThan(1);
  });

  it("rechecks actual pinned pack installation on retained reads", async () => {
    const f = await fixture("white", { pack: true }), { handle } = await f.acquire(); vi.spyOn(f.registry!, "byDigest").mockReturnValue(undefined);
    expect(() => f.service.readInspectorExplorerSource(handle)).toThrow(expect.objectContaining({ code: "PACK_UNRESOLVABLE" }));
  });

  it("refuses an actual pinned artifact disappearing while the HTTP request is pending", async () => {
    const f = await fixture("white", { pack: true }), context = f.context(), factory = vi.spyOn(runtime, "deriveExplorerInspectorPopulation");
    const pending = f.service.acquireInspectorExplorerSource(context, f.controller.signal), failure = expect(pending).rejects.toMatchObject({ code: "PACK_UNRESOLVABLE" });
    await flush(); expect(f.remote.calls).toHaveLength(1); vi.spyOn(f.registry!, "byDigest").mockReturnValue(undefined);
    f.remote.respond(0, body(99)); await failure; expect(factory).not.toHaveBeenCalled();
  });
});
