import { afterEach, describe, expect, it, vi } from "vitest";
import { branchPath, commitMove, compileAssistanceRequest, createRun, fork, moduleDecisionStamp, reachCheckpoint, revealFeedback, rewind,
  serverAvailabilityFromProviders, type RunOpponentMode } from "@chess-tabiya/runtime";
import * as factories from "../../../packages/runtime/src/maia-node.js";
import { START_FEN } from "../../../packages/runtime/src/provider-test-fixtures.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorMaiaSource, InspectorMaiaProjection } from "./inspector-maia-source.js";
import { FakeEngines, ManualClock } from "./provider-exchange.test-support.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { ExchangeMaiaTaskSource } from "./provider-maia.js";
import { OpponentSelector } from "./opponent-selector.js";
import { driveTo, testRegistry } from "./provider-health.test-support.js";
import { engineUnavailable } from "./errors.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { PackRegistry } from "./pack-registry.js";
import { validatePackDocument } from "./pack-validation.js";
import { orchestratePackMove } from "./pack-orchestrator.js";

const DISTRIBUTION = "derived.maia.node_distribution@1", WDL = "derived.maia.node_candidate_wdl@1";
const PROJECTIONS = [DISTRIBUTION, WDL] as const;
const at = "2026-11-02T19:30:00.000Z", owner = { learnerId: "maia-source-owner", handle: "maia-source-owner" };
const reader = { learnerId: "maia-source-reader", handle: "maia-source-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "external", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
async function fixture(side: "white" | "black" = "white", moves: readonly string[] = [], options: { modern?: boolean; configured?: boolean; fen?: string; mode?: RunOpponentMode; pack?: boolean } = {}) {
  const engines = new FakeEngines(), clock = new ManualClock(), health = await testRegistry({ "maia-inference": "available" });
  engines.respond = () => ["info multipv 1 policy 0.4 score cp 739 wdl 0 362 638 pv e2e4", "info multipv 3 pv d2d4", "bestmove e2e4"];
  const providers = composeProviderTraversalApplication({ engines, maiaTaskHealth: health, tablebaseFetch: null, explorerFetch: null, explorerToken: null, monotonicNowMs: clock.now, wallNow: clock.wall });
  const source = new ExchangeMaiaTaskSource({ scheduler: providers.scheduler, engines, health, monotonicNowMs: clock.now });
  const raw = vi.fn(async () => { throw new Error("No legacy fallback for Inspector model sources"); });
  const selector = new OpponentSelector({ health: id => engines.health(id), execute: raw }, { ...(options.modern === false ? {} : { maiaTaskSource: source }), health, monotonicNowMs: clock.now, wallNow: clock.wall });
  const fen = options.fen ?? START_FEN;
  const policy = { mode: options.mode ?? "human_common", targetElo: 1500, temperature: 0.8, topP: 0.92 } as const;
  const document = options.pack ? withDerivedRequires({ id: "maia-source-trajectory", version: "1.0.0", title: "Synthetic model source contract",
    mode: options.mode === undefined ? "trajectory" : "line", phase: "cross_phase", start: { fen, side },
    objective: { type: options.mode === undefined ? "run_trajectory" : "play_until_checkpoint", summary: "Synthetic source test, not a chess lesson." },
    ...(options.mode === undefined ? { legs: [{ id: "entry", objective: { type: "execute_break", summary: "Synthetic boundary", successConditions: [{ kind: "reach_checkpoint", checkpointId: "middle", to: "preserved" }] }, opponentPolicy: { mode: "human_common", targetElo: 1200 } },
      { id: "middle", entryCheckpointId: "middle", objective: { type: "play_until_checkpoint", summary: "Synthetic continuation" }, opponentPolicy: { mode: "human_common", targetElo: 1800 } }] } : {}),
    checkpoints: [{ id: "opened", trigger: { atStart: true }, actions: [] }, { id: "middle", trigger: { atPly: 1 }, actions: [] }], opponentPolicy: policy, feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "schema_example", sources: [] } }) : undefined;
  if (document !== undefined) { const validation = validatePackDocument(document); expect(validation.valid, JSON.stringify(validation.issues)).toBe(true); }
  const registry = document === undefined ? undefined : await PackRegistry.fromDocuments([{ source: "synthetic-maia-source", value: document }]);
  const pack = registry?.required(document!.id);
  const session = (() => {
    if (pack !== undefined) return { kind: "pack" as const, packId: pack.document.id, packDigest: pack.digest, start: { fen, side }, feedbackPolicy: "delayed_checkpoint" as const, opponentPolicy: policy };
    const mode = policy.mode;
    if (mode !== "human_common" && mode !== "strong_engine") throw new TypeError("Pack-only mode requires an installed test pack");
    return { kind: "position" as const, start: { fen, side }, feedbackPolicy: "attempt_end" as const, opponentPolicy: { ...policy, mode } };
  })();
  let run = createRun({ id: `maia-source-${side}`, session,
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 42, createdAt: at });
  if (pack !== undefined) run = reachCheckpoint(run, "opened", at).run;
  for (const move of moves) { const mutation = commitMove(run, move, { at }); run = pack === undefined ? mutation.run : orchestratePackMove(pack.document, run, mutation).run; }
  if (pack === undefined) run = revealFeedback(run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { writerId: "maia-source-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  storage.grantRole(run.id, reader.learnerId, "host", lease, at);
  const service = new RunService(storage, { ...(options.configured === false ? {} : { opponentSelector: selector }), ...(registry === undefined ? {} : { packRegistry: registry }) }), controller = new AbortController();
  const intent = pack === undefined ? requested : compileAssistanceRequest({ contextHint: "pack", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const context = (kind: "position" | "branch" = "position", nodeId = run.activeCursor.nodeId, branchId = run.activeCursor.branchId, principal = owner) =>
    service.resolveInspectorRecordedContext(run.id, principal, intent, availability, { branchId, nodeId, decisionDigest: moduleDecisionStamp(storage.read(run.id)!.run).digest,
      context: kind === "position" ? { kind } : { kind, throughNodeId: nodeId } }, controller.signal);
  const acquire = async (projection: InspectorMaiaProjection = DISTRIBUTION, token = context()) =>
    service.readInspectorMaiaSource(await service.acquireInspectorMaiaSource(token, projection, controller.signal));
  return { engines, clock, health, source, selector, raw, run, storage, lease, service, controller, context, acquire, registry, pack };
}

describe("requested-node model suppliers under actual SQLite/RunService Inspector grants", () => {
  it.each(PROJECTIONS.flatMap(projection => [
    { kind: "checkmate", fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1", move: "g6g7" },
    { kind: "stalemate", fen: "7k/8/6K1/8/8/8/5Q2/8 w - - 0 1", move: "f2f7" },
    { kind: "insufficient_material", fen: "4k3/8/8/8/8/8/4r3/4K3 w - - 0 1", move: "e1e2" },
  ].map(value => ({ projection, ...value }))))("$projection has explicit no-query terminal absence after $kind", async ({ projection, fen, move }) => {
    const f = await fixture("white", [move], { fen }), select = vi.spyOn(f.selector, "selectWithMaiaEvidence");
    const distribution = vi.spyOn(factories, "deriveMaiaNodeDistribution"), wdl = vi.spyOn(factories, "deriveMaiaNodeCandidateWdl");
    const image = await f.acquire(projection);
    expect(image.outcome).toEqual({ kind: "unavailable", reason: "source_absent", disclosure: "This position has ended; no next-move model window is requested." });
    expect(image.inputs).toBeNull(); expect(image.result).toBeNull(); expect(image.sourceKey).toBeNull(); expect(image.values).toEqual([]);
    expect(select).not.toHaveBeenCalled(); expect(distribution).not.toHaveBeenCalled(); expect(wdl).not.toHaveBeenCalled(); expect(f.engines.calls).toHaveLength(0);
  });

  it.each(["white", "black"] as const)("retains %s's original same-task distribution and same-row WDL without another sample", async side => {
    const f = await fixture(side), original = JSON.stringify(f.storage.read(f.run.id));
    const distributionFactory = vi.spyOn(factories, "deriveMaiaNodeDistribution"), wdlFactory = vi.spyOn(factories, "deriveMaiaNodeCandidateWdl");
    const distribution = await f.acquire(), wdl = await f.acquire(WDL);
    expect(distributionFactory).toHaveBeenCalledOnce(); expect(wdlFactory).toHaveBeenCalledOnce();
    expect(distribution.result).toBe(distributionFactory.mock.results[0]!.value);
    expect(wdl.result).toBe(wdlFactory.mock.results[0]!.value);
    expect(distribution.outcome).toEqual({ kind: "available", collected: 1 });
    expect(wdl.outcome).toEqual({ kind: "available", collected: 1 });
    expect(distribution.inputs!.task).toBe(wdl.inputs!.task);
    expect(distribution.values[0]!.payload).toMatchObject({ candidates: [{ moveUci: "e2e4", rank: 1, mass: 0.4 }, { moveUci: "d2d4", rank: 3, mass: null }] });
    expect(wdl.values[0]!.payload).toMatchObject({ candidates: [{ moveUci: "e2e4", rank: 1, wdl: { win: 0, draw: 362, loss: 638 } }] });
    expect(distribution.inputs!.task.payload.payload.request).toMatchObject({ band: 1500, temperature: 0.8, topP: 0.92 });
    expect(distribution.request.policy).toEqual({ mode: "human_common", policyConfigDigest: f.run.sessionDigest, targetElo: 1500, temperature: 0.8, topP: 0.92 });
    expect(distribution.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u); expect(wdl.sourceKey).not.toBe(distribution.sourceKey);
    expect(f.engines.calls).toHaveLength(1); expect(f.raw).not.toHaveBeenCalled();
    expect(JSON.stringify(f.storage.read(f.run.id))).toBe(original);
  });

  it("keeps a successful empty WDL companion distinct from unknown model shares and provider failure", async () => {
    const f = await fixture(); f.engines.respond = () => ["info multipv 1 pv e2e4", "bestmove e2e4"];
    const distribution = await f.acquire(), wdl = await f.acquire(WDL);
    expect(distribution.values[0]!.payload).toMatchObject({ candidates: [{ moveUci: "e2e4", mass: null }] });
    expect(wdl.outcome).toEqual({ kind: "unavailable", reason: "source_absent", disclosure: "This model window has no reported candidate win/draw/loss data." });
    expect(wdl.result).toEqual({ kind: "unavailable", reason: "empty_population" });
    expect(wdl.inputs!.task).toBe(distribution.inputs!.task); expect(wdl.values).toEqual([]); expect(wdl.sourceKey).not.toBeNull();
    expect(f.engines.calls).toHaveLength(1);
  });

  it("retains the genuine acquired zero-row distribution and original unavailable WDL result", async () => {
    const f = await fixture(); f.engines.respond = () => ["bestmove e2e4"];
    const distribution = await f.acquire(), wdl = await f.acquire(WDL);
    expect(distribution.values).toHaveLength(1); expect(distribution.values[0]!.payload).toMatchObject({ candidates: [] });
    expect(wdl.result).toEqual({ kind: "unavailable", reason: "empty_population" });
    expect(wdl.inputs!.task).toBe(distribution.inputs!.task); expect(distribution.sourceKey).not.toBeNull();
    expect(f.engines.calls).toHaveLength(2); // the selector's unchanged one retry, not a WDL retry
  });

  it.each(PROJECTIONS.flatMap(projection => (["white", "black"] as const).map(side => ({ projection, side }))))("$projection uses $side's historical node's full history rather than the active tip", async ({ projection, side }) => {
    const f = await fixture(side, ["e2e4", "e7e5"]), node = f.run.nodes[1]!;
    f.engines.respond = () => ["info multipv 1 policy 0.4 wdl 1 2 997 pv c7c5", "bestmove c7c5"];
    const image = await f.acquire(projection, f.context("position", node.id));
    expect(image.request.historyUci).toEqual(["e2e4"]);
    expect(image.inputs!.resolved.subject).toMatchObject({ nodeId: node.id, branchId: f.run.activeCursor.branchId });
    expect(image.values[0]!.payload).toMatchObject({ nodeId: node.id, candidates: [{ moveUci: "c7c5" }] });
    expect(f.engines.calls[0]!.commands.at(-2)).toBe(`position fen ${START_FEN} moves e2e4`);
  });

  it.each(PROJECTIONS.flatMap(projection => (["white", "black"] as const).map(side => ({ projection, side }))))("$projection keeps $side's granted fork seed and inherited node scope", async ({ projection, side }) => {
    const f = await fixture(side, ["e2e4", "e7e5"]), inherited = f.run.nodes[1]!;
    const branched = revealFeedback(fork(rewind(f.run, inherited.id, at).run, inherited.id, { at }).run, at).run;
    f.storage.save(branched, f.lease);
    f.engines.respond = () => ["info multipv 1 policy 0.4 wdl 1 2 997 pv c7c5", "bestmove c7c5"];
    const image = await f.acquire(projection, f.context("position", inherited.id, branched.activeCursor.branchId));
    const branch = branched.branches.find(item => item.id === branched.activeCursor.branchId)!;
    expect(inherited.branchId).not.toBe(branch.id); expect(image.request.seed).toBe(branch.seed);
    expect(image.request.historyUci).toEqual(["e2e4"]); expect(image.inputs!.resolved.subject).toMatchObject({ branchId: branch.id, nodeId: inherited.id });
    expect(branchPath(branched, branch.id).some(node => node.id === inherited.id)).toBe(true);
  });

  it.each(PROJECTIONS)("%s refuses copied/foreign/wrong-scope contexts and pre-aborted signals before work", async projection => {
    const f = await fixture(), foreign = await fixture("black"), context = f.context();
    for (const token of [{ ...context }, foreign.context(), f.context("branch")]) {
      await expect(f.service.acquireInspectorMaiaSource(token as InspectorRecordedContext, projection, f.controller.signal)).rejects.toThrow();
    }
    f.controller.abort(); await expect(f.service.acquireInspectorMaiaSource(context, projection, f.controller.signal)).rejects.toThrow();
    expect(f.engines.calls).toHaveLength(0);
  });

  it.each([{ modern: false }, { configured: false }])("returns actual unconfigured/standalone absence without a raw fallback: %s", async options => {
    const f = await fixture("white", [], options), value = await f.acquire();
    expect(value.outcome).toEqual({ kind: "unavailable", reason: "provider_unavailable" });
    expect(value.inputs).toBeNull(); expect(value.result).toBeNull(); expect(value.sourceKey).toBeNull(); expect(value.values).toEqual([]);
    expect(f.engines.calls).toHaveLength(0); expect(f.raw).not.toHaveBeenCalled();
  });

  it.each(["strong_engine", "practical_resistance", "theory_strict", "perfect_tablebase"] as const)("keeps the model request human-common under a %s run", async mode => {
    const tablebase = mode === "practical_resistance" || mode === "perfect_tablebase";
    const f = await fixture("white", [], { mode, pack: true, ...(tablebase ? { fen: "4k3/7p/8/8/8/8/4P3/4K3 w - - 0 1" } : {}) });
    if (tablebase) f.engines.respond = () => ["info multipv 1 policy 0.4 score cp 739 wdl 0 362 638 pv e2e4", "bestmove e2e4"];
    const value = await f.acquire();
    expect(value.request.policy).toEqual({ mode: "human_common", policyConfigDigest: f.run.sessionDigest, targetElo: 1500, temperature: 0.8, topP: 0.92 });
    expect(f.engines.calls).toHaveLength(1); expect(f.raw).not.toHaveBeenCalled();
  });

  it.each(["white", "black"] as const)("uses %s's actually installed selected-node trajectory band, not the tip/run default", async side => {
    const f = await fixture(side, ["e2e4"], { pack: true });
    const first = await f.acquire(DISTRIBUTION, f.context("position", f.run.nodes[0]!.id));
    expect(first.request.policy).toEqual({ mode: "human_common", policyConfigDigest: f.run.sessionDigest, targetElo: 1200 });
    f.engines.respond = () => ["info multipv 1 policy 0.4 wdl 1 2 997 pv c7c5", "bestmove c7c5"];
    const next = await f.acquire();
    expect(next.request.policy).toEqual({ mode: "human_common", policyConfigDigest: f.run.sessionDigest, targetElo: 1800 });
    expect(first.inputs!.task.payload.payload.appliedBand).toBe(1200); expect(next.inputs!.task.payload.payload.appliedBand).toBe(1800);
    expect(first.inputs!.task).not.toBe(next.inputs!.task); expect(f.engines.calls).toHaveLength(2);
  });

  it("rechecks the actual pinned pack installation on retained reads", async () => {
    const f = await fixture("white", [], { pack: true }), token = await f.service.acquireInspectorMaiaSource(f.context(), WDL, f.controller.signal);
    expect(f.service.readInspectorMaiaSource(token).outcome.kind).toBe("available");
    vi.spyOn(f.registry!, "byDigest").mockReturnValue(undefined);
    expect(() => f.service.readInspectorMaiaSource(token)).toThrow(expect.objectContaining({ code: "PACK_UNRESOLVABLE" }));
    expect(f.engines.calls).toHaveLength(1);
  });

  it("does not derive after the actual pinned pack disappears during task acquisition", async () => {
    const f = await fixture("white", [], { pack: true }), context = f.context();
    let release!: () => void, entered!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; }), acquire = f.source.acquire.bind(f.source);
    f.source.acquire = async (...args) => { const value = await acquire(...args); entered(); await held; return value; };
    const factory = vi.spyOn(factories, "deriveMaiaNodeDistribution"), pending = f.service.acquireInspectorMaiaSource(context, DISTRIBUTION, f.controller.signal);
    await Promise.race([started, pending.then(() => { throw new Error("source completed before actual acquisition"); })]);
    vi.spyOn(f.registry!, "byDigest").mockReturnValue(undefined); release();
    await expect(pending).rejects.toMatchObject({ code: "PACK_UNRESOLVABLE" }); expect(factory).not.toHaveBeenCalled();
  });

  it("rejects a registry replacement after selection resolves but before any node factory", async () => {
    const f = await fixture(), original = f.selector.selectWithMaiaEvidence.bind(f.selector);
    vi.spyOn(f.selector, "selectWithMaiaEvidence").mockImplementation(async (...args) => {
      const value = await original(...args);
      f.health.engineLifecycleSink({ "maia-5m": "maia-inference" })({ engineId: "maia-5m", kind: "starting" });
      vi.spyOn(f.engines, "establishedGeneration").mockReturnValue(null); return value;
    });
    const factory = vi.spyOn(factories, "deriveMaiaNodeDistribution");
    await expect(f.acquire()).rejects.toMatchObject({ reason: "stale" }); expect(factory).not.toHaveBeenCalled();
    expect(f.engines.calls).toHaveLength(1);
  });

  it.each(["revoke", "role", "storage", "disclosure", "cancel", "provider_failure"] as const)("refuses %s during actual acquisition before a node factory runs", async fault => {
    const f = await fixture(), context = f.context("position", f.run.activeCursor.nodeId, f.run.activeCursor.branchId, reader);
    let release!: () => void, entered!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; }), started = new Promise<void>(resolve => { entered = resolve; });
    const acquire = f.source.acquire.bind(f.source);
    f.source.acquire = async (...args) => { const value = await acquire(...args); entered(); await held; if (fault === "provider_failure") throw engineUnavailable("maia-5m", 0); return value; };
    const factory = vi.spyOn(factories, "deriveMaiaNodeDistribution");
    const pending = f.service.acquireInspectorMaiaSource(context, DISTRIBUTION, f.controller.signal);
    await Promise.race([started, pending.then(() => { throw new Error("source completed before actual acquisition"); })]);
    if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
    if (fault === "storage") f.storage.save(rewind(f.run, f.run.activeCursor.nodeId, at).run, f.lease);
    if (fault === "disclosure") f.storage.save(commitMove(f.run, "e2e4", { at }).run, f.lease);
    if (fault === "cancel") f.controller.abort();
    release();
    if (fault === "disclosure") await expect(pending).rejects.toMatchObject({ code: "ASSISTANCE_WITHHELD" });
    else await expect(pending).rejects.toThrow();
    expect(factory).not.toHaveBeenCalled(); expect(f.raw).not.toHaveBeenCalled();
  });

  it.each(["revoke", "role", "storage", "disclosure", "cancel", "generation"] as const)("retained results re-read their own current %s authority", async fault => {
    const f = await fixture(), context = f.context("position", f.run.activeCursor.nodeId, f.run.activeCursor.branchId, reader);
    const token = await f.service.acquireInspectorMaiaSource(context, WDL, f.controller.signal);
    expect(f.service.readInspectorMaiaSource(token).outcome.kind).toBe("available");
    if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
    if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
    if (fault === "storage") f.storage.save(rewind(f.run, f.run.activeCursor.nodeId, at).run, f.lease);
    if (fault === "disclosure") f.storage.save(commitMove(f.run, "e2e4", { at }).run, f.lease);
    if (fault === "cancel") f.controller.abort();
    if (fault === "generation") f.engines.generation++;
    expect(() => f.service.readInspectorMaiaSource(token)).toThrow();
    expect(() => f.service.readInspectorMaiaSource({ ...token } as InspectorMaiaSource)).toThrow();
  });

  it("retains original task reads through health-only null, but refuses a real registry replacement still reporting null", async () => {
    const f = await fixture(), token = await f.service.acquireInspectorMaiaSource(f.context(), DISTRIBUTION, f.controller.signal);
    const original = f.service.readInspectorMaiaSource(token), generation = f.health.generation("maia-inference");
    await driveTo(f.health, "maia-inference", { failed: "protocol" });
    vi.spyOn(f.engines, "establishedGeneration").mockReturnValue(null);
    expect(f.health.generation("maia-inference")).toBe(generation);
    expect(f.service.readInspectorMaiaSource(token)).toBe(original);
    f.health.engineLifecycleSink({ "maia-5m": "maia-inference" })({ engineId: "maia-5m", kind: "starting" });
    expect(f.health.generation("maia-inference")).not.toBe(generation);
    expect(() => f.service.readInspectorMaiaSource(token)).toThrow(); expect(f.engines.calls).toHaveLength(1);
  });
});
