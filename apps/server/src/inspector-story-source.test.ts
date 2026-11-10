import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { ShapeEntryDefinition } from "@chess-tabiya/schema/shape-entry";
import { attachEvidence, branchPath, commitMove, compileAssistanceRequest, moduleDecisionStamp, revealFeedback, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as populations from "../../../packages/runtime/src/review-evidence.js";
import * as moments from "../../../packages/runtime/src/recorded-review-moments.js";
import * as supplier from "../../../packages/runtime/src/inspector-story-source.js";
import { readRecordedReviewBoundary } from "../../../packages/runtime/src/recorded-review-boundary.js";
import * as boundaries from "../../../packages/runtime/src/recorded-review-boundary.js";
import { rankStoryMoments } from "../../../packages/runtime/src/story.js";
import { recordedComparisonFixture } from "../../../packages/runtime/src/testing/recorded-comparison-fixture.js";
import { attachDelivery, evaluationDelivery } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import type { InspectorRecordedContext } from "./inspector-recorded-context.js";
import type { InspectorStorySource } from "./inspector-story-source.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { ReviewAttemptOutcomeStore, ReviewEvidenceCoordinator } from "./review-evidence.js";
import { ShapeRegistry } from "./shape-registry.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-02T21:00:00.000Z", owner = { learnerId: "story-source-owner", handle: "story-source-owner" }, reader = { learnerId: "story-source-reader", handle: "story-source-reader" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const requested = compileAssistanceRequest({ contextHint: "position", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [], coordinators: ReviewEvidenceCoordinator[] = [];
afterEach(async () => { vi.restoreAllMocks(); for (const coordinator of coordinators.splice(0)) await coordinator.close(); for (const store of stores.splice(0)) store.close(); });
function shape(black: boolean): ShapeEntryDefinition {
  const trigger = { kind: "pieceOnSquare" as const, square: black ? "f6" as const : "f3" as const, piece: { color: black ? "black" as const : "white" as const, role: "knight" as const } };
  return { id: "mechanical-knight-location", version: "1.0.0", name: "Mechanical test occupancy", phases: ["opening"], trigger,
    plans: (["white", "black"] as const).map(side => ({ id: `${side}-occupancy`, side, label: "Mechanical fixture", description: "No strategic assertion.", success: { note: "Occupancy only", signature: trigger } })),
    watch: ["Mechanical occupancy only"], typicalMistakes: ["Mechanical fixture only"], provenance: { licence: "CC0-1.0", sources: ["Mechanical software fixture"], attribution: [{ title: "Test fixture", author: "Tabiya tests", licence: "CC0-1.0" }] } };
}
async function fixture(black = false, deliveries = true, withCoordinator = false, storageLifetime = stores) {
  const base = recordedComparisonFixture(black, "inspector-story"), registry = new ShapeRegistry(); await registry.add(shape(black), "official");
  let run = base.run;
  if (deliveries) for (const [index, score] of [[0, "cp 100"], [1, "cp -400"], [2, "mate 3"]] as const) run = attachDelivery(run, base.mainPath[index]!.id, evaluationDelivery(base.mainPath[index]!.fen, score));
  run = revealFeedback(run, at).run;
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); storageLifetime.push(storage);
  for (const principal of [owner, reader]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const lease = { learnerId: owner.learnerId, writerId: "story-source-writer" }; storage.create(run, lease); storage.grantRole(run.id, reader.learnerId, "host", lease, at);
  let release!: (value: null) => void;
  const discovery = new Promise<null>(resolve => { release = resolve; });
  const { scheduler } = composeProviderTraversalApplication({ engines: new MockProviderEngineClient(), tablebaseFetch: null, explorerFetch: null, explorerToken: null });
  const coordinator = withCoordinator ? new ReviewEvidenceCoordinator({ storage, scheduler, requestedEngine: () => discovery,
    attempts: new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 8, maxAttemptsPerRequest: 1 }), windowNodes: 1,
    maxOutstandingPerRun: 1, maxTrackedRuns: 2, maxAttemptsPerRequest: 1, movetimeMs: 50, linePlies: 4, timeoutMs: 2000 }) : undefined;
  if (coordinator !== undefined) coordinators.push(coordinator);
  const service = new RunService(storage, { shapeRegistry: registry, ...(coordinator === undefined ? {} : { reviewEvidence: coordinator }) }), controller = new AbortController();
  const context = (end = base.mainPath.at(-1)!.id, anchor = base.mainPath[0]!.id, principal = owner, branchId = base.main, currentRun = run) => service.resolveInspectorRecordedContext(currentRun.id, principal,
    currentRun.sessionKind === "imported" ? compileAssistanceRequest({ contextHint: "imported", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } }) : requested, availability,
    { branchId, nodeId: anchor, decisionDigest: moduleDecisionStamp(currentRun).digest, context: { kind: "recorded_review", throughNodeId: end } }, controller.signal);
  const acquire = (token = context()) => service.readInspectorStorySource(service.acquireInspectorStorySource(token, controller.signal));
  return { ...base, run, registry, storage, lease, service, controller, coordinator, release, context, acquire };
}

describe("Inspector Story rank from the complete captured saved Review source", () => {
  it.each([false, true])("retains full original moment/population/last-level/rank identities, black=%s", async black => {
    const f = await fixture(black), saved = JSON.stringify(f.storage.read(f.run.id)), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    const image = f.acquire(), c = image.collection, data = moments.readRecordedReviewMoments(c.recordedReview);
    expect(c.population).toBeDefined(); expect(data.population).toBe(populations.readRecordedReviewSourcePopulation(c.population));
    expect(data.population.boundary).toBe(readRecordedReviewBoundary(c.boundary));
    expect(data.population.shapes).toEqual([{ id: shape(black).id, trigger: shape(black).trigger }]);
    expect(data.groups.length).toBeGreaterThan(1); expect(c.result.payload).toEqual({ rank: rankStoryMoments(data.groups) });
    const rankIndex = dispatch.mock.calls.findIndex(row => row[0] === "derived.story.rank@3");
    expect(rankIndex).toBeGreaterThanOrEqual(0); expect(c.result).toBe(dispatch.mock.results[rankIndex]!.value);
    expect(dispatch.mock.calls.filter(row => row[0] === "derived.story.rank@3")).toHaveLength(1);
    expect(dispatch.mock.calls.some(row => row[0] === "derived.story.title@2" || row[0] === "derived.story.rank@2")).toBe(false);
    expect(image.outcome).toEqual({ kind: "available", collected: 1 }); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(saved);
    expect(data.lastLevelReduction.items).toBeDefined(); expect(c.proof.reduction.sourceImageDigest).toMatch(/^[a-f0-9]{64}$/u);
  });

  describe.each([false, true])("complete recorded_review endpoint census, black=%s", black => {
    const endpoints = [0, 1, 2, 3, 4, 5, 6] as const, keys = new Map<number, string>(), lifetime: SQLiteRunStorage[] = [];
    let f: Awaited<ReturnType<typeof fixture>>, original: string;
    beforeAll(async () => {
      // Only construct the read-only fixture here. Every actual request remains inside its
      // own unchanged five-second test; no acquisition or assertion is hidden in setup.
      f = await fixture(black, true, false, lifetime);
      expect(f.mainPath).toHaveLength(endpoints.length);
      original = JSON.stringify(f.storage.read(f.run.id));
    });
    afterAll(() => {
      try {
        expect(keys.size).toBe(endpoints.length);
        expect(new Set(keys.values()).size).toBe(endpoints.length);
      } finally { for (const storage of lifetime.splice(0)) storage.close(); }
    });
    it.each(endpoints)("uses endpoint %s, not anchor/cursor/full tip", index => {
      const node = f.mainPath[index]!, image = f.acquire(f.context(node.id)), data = moments.readRecordedReviewMoments(image.collection.recordedReview);
      expect(data.population.boundary.path.map(row => row.node.id)).toEqual(f.mainPath.slice(0, index + 1).map(row => row.id));
      expect(data.population.boundary.request.throughNodeId).toBe(node.id);
      expect(data.groups.every(group => f.mainPath.slice(0, index + 1).some(row => row.id === group.nodeId))).toBe(true);
      keys.set(index, image.sourceKey);
      if (index === 0) { expect(image.collection.result.payload).toEqual({ rank: [] }); expect(image.outcome).toEqual({ kind: "available", collected: 1 }); }
      expect(JSON.stringify(f.storage.read(f.run.id))).toBe(original);
    });
  });

  it("retains provider-off states and real empty ordering without a missing-source claim", async () => {
    const f = await fixture(false, false), image = f.acquire(f.context(f.mainPath[0]!.id));
    const data = moments.readRecordedReviewMoments(image.collection.recordedReview), last = populations.readRecordedLastLevelPopulation(data.population.lastLevelPopulation);
    expect(last.rows[0]!.provider).toEqual({ kind: "unavailable", reason: "provider_off" });
    expect(image.collection.result.payload).toEqual({ rank: [] }); expect(image.outcome.kind).toBe("available");
  });

  it.each([false, true])("never parses/mints later saved deliveries for a root-only grant, coordinator=%s", async coordinator => {
    const f = await fixture(false, true, coordinator), dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    f.acquire(f.context(f.mainPath[0]!.id));
    const delivered = dispatch.mock.calls.filter(row => row[0] === "live.stockfish.position_eval@1");
    expect(delivered.length).toBeGreaterThan(0);
    expect(new Set(delivered.map(row => (row[1] as { delivery: { payload: { fen: string } } }).delivery.payload.fen))).toEqual(new Set([f.mainPath[0]!.fen]));
  });

  it("bounds genuine coordinator observations before parsing, preserving whole-tip callers", async () => {
    const f = await fixture(false, true, true), coordinator = f.coordinator!, dispatch = vi.spyOn(routes, "invokeEvidenceValueRoute");
    for (const endpoint of ["unknown", f.peerPath.at(-1)!.id]) expect(() => coordinator.observe(f.run.id, f.main, endpoint)).toThrow();
    expect(dispatch).not.toHaveBeenCalled();
    expect([...coordinator.observe(f.run.id, f.main, f.mainPath[0]!.id).states.keys()]).toEqual([f.mainPath[0]!.id]);
    expect([...coordinator.observe(f.run.id, f.main).states.keys()]).toEqual(f.mainPath.map(node => node.id));
  });

  it("uses actual coordinator observation only and retires when its real state changes", async () => {
    const f = await fixture(false, false, true), coordinator = f.coordinator!, observe = vi.spyOn(coordinator, "observe"), ensure = vi.spyOn(coordinator, "ensureBranch");
    const context = f.context(), handle = f.service.acquireInspectorStorySource(context, f.controller.signal), data = moments.readRecordedReviewMoments(f.service.readInspectorStorySource(handle).collection.recordedReview);
    expect(populations.readRecordedLastLevelPopulation(data.population.lastLevelPopulation).rows.every(row => row.provider?.kind === "not_requested")).toBe(true);
    expect(observe).toHaveBeenCalled(); expect(ensure).not.toHaveBeenCalled(); expect(coordinator.trackedBranches).toBe(0);
    const current = coordinator.ensureBranch(f.run.id, f.main); f.release(null);
    expect(() => f.service.readInspectorStorySource(handle)).toThrow(); await current.pump;
  });

  it("refuses a real coordinator state change between collection and publication", async () => {
    const f = await fixture(false, false, true), original = supplier.collectInspectorStorySource;
    let pump: Promise<void> | undefined;
    vi.spyOn(supplier, "collectInspectorStorySource").mockImplementationOnce((...args) => {
      const value = original(...args); pump = f.coordinator!.ensureBranch(f.run.id, f.main).pump; return value;
    });
    try { expect(() => f.acquire()).toThrow(); } finally { f.release(null); await pump; }
  });

  it("retains actual stored import outcome only at its recorded endpoint", async () => {
    const f = await fixture(false, false);
    const imported = await f.service.importGame({ id: "story-import", side: "black", opponentPolicy: { mode: "human_common" },
      policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1,
      source: { kind: "pgn", pgn: '[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 1-0' } }, f.lease);
    const run = revealFeedback(imported.run, at).run; f.storage.save(run, f.lease);
    const path = branchPath(run, run.activeCursor.branchId);
    for (const [index, node] of path.entries()) {
      const context = f.context(node.id, path[0]!.id, owner, run.activeCursor.branchId, run), image = f.acquire(context);
      const boundary = readRecordedReviewBoundary(image.collection.boundary);
      expect(boundary.importRecord?.result).toBe("1-0"); expect(boundary.learnerSide).toBe("black");
      expect(boundary.outcome.kind).toBe(index === path.length - 1 ? "recorded_result" : "unfinished");
    }
  });

  it.each(["position", "branch", "comparison", "copy", "cancel"] as const)("refuses %s before any source population work", async fault => {
    const f = await fixture(), collect = vi.spyOn(supplier, "collectInspectorStorySource");
    let context: InspectorRecordedContext;
    if (fault === "position" || fault === "branch" || fault === "comparison") context = f.service.resolveInspectorRecordedContext(f.run.id, owner, requested, availability,
      { branchId: f.main, nodeId: f.shared.id, decisionDigest: moduleDecisionStamp(f.run).digest,
        context: fault === "position" ? { kind: "position" } : fault === "branch" ? { kind: "branch", throughNodeId: f.mainPath.at(-1)!.id }
          : { kind: "comparison", otherBranchId: f.peer, otherNodeId: f.peerPath.at(-1)!.id } }, f.controller.signal);
    else context = fault === "copy" ? {} as InspectorRecordedContext : f.context();
    if (fault === "cancel") f.controller.abort();
    expect(() => f.acquire(context)).toThrow(); expect(collect).not.toHaveBeenCalled();
  });

  it.each(["population", "moments", "rank"] as const)("refuses an original foreign %s before issuing a successful source", async fault => {
    const f = await fixture(), foreign = f.acquire(f.context(f.shared.id)).collection;
    if (fault === "population") vi.spyOn(populations, "collectRecordedReviewSourcePopulation").mockReturnValueOnce(foreign.population);
    if (fault === "moments") vi.spyOn(moments, "collectRecordedReviewMoments").mockReturnValueOnce(foreign.recordedReview);
    if (fault === "rank") {
      const original = routes.invokeEvidenceValueRoute;
      vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((ref: string, input: never) => ref === "derived.story.rank@3" ? foreign.result : original(ref as never, input)) as typeof routes.invokeEvidenceValueRoute);
    }
    expect(() => f.acquire()).toThrow();
  });

  it.each(["shapes", "provider"] as const)("rejects a genuine same-boundary population with different captured %s inputs", async fault => {
    const f = await fixture(), original = populations.collectRecordedReviewSourcePopulation;
    vi.spyOn(populations, "collectRecordedReviewSourcePopulation").mockImplementationOnce(input => original({ boundary: input.boundary,
      context: { engine: fault === "provider" ? new Map() : input.context.engine, shapes: fault === "shapes" ? [] : input.context.shapes } }));
    const rank = vi.spyOn(routes, "invokeEvidenceValueRoute");
    expect(() => f.acquire()).toThrow(); expect(rank.mock.calls.some(row => row[0] === "derived.story.rank@3")).toBe(false);
  });

  it("rejects a genuine same-data foreign boundary issuer before population work", async () => {
    const f = await fixture(), make = boundaries.createRecordedReviewBoundarySourceOwner;
    const foreign = make({ loadRun: id => f.storage.read(id)?.run, loadImportRecord: () => undefined })
      .resolve({ runId: f.run.id, branchId: f.main, throughNodeId: f.mainPath.at(-1)!.id });
    vi.spyOn(boundaries, "createRecordedReviewBoundarySourceOwner").mockImplementation(storage => {
      const own = make(storage); return Object.freeze({ resolve: () => foreign, assertCurrent: own.assertCurrent });
    });
    const service = new RunService(f.storage, { shapeRegistry: f.registry });
    const context = service.resolveInspectorRecordedContext(f.run.id, owner, requested, availability, { branchId: f.main,
      nodeId: f.mainPath[0]!.id, decisionDigest: moduleDecisionStamp(f.run).digest,
      context: { kind: "recorded_review", throughNodeId: f.mainPath.at(-1)!.id } }, f.controller.signal);
    const collect = vi.spyOn(supplier, "collectInspectorStorySource");
    expect(() => service.acquireInspectorStorySource(context, f.controller.signal)).toThrow(); expect(collect).not.toHaveBeenCalled();
  });

  it.each([false, true])("keeps actual inherited peer nodes on their granted branch, black=%s", async black => {
    const f = await fixture(black), c = f.acquire(f.context(f.shared.id, f.mainPath[0]!.id, owner, f.peer)).collection;
    const data = readRecordedReviewBoundary(c.boundary);
    expect(data.request.branchId).toBe(f.peer); expect(data.path.map(row => row.node.id)).toEqual(f.peerPath.slice(0, 3).map(row => row.id));
    expect(data.path.at(-1)!.node.branchId).toBe(f.main);
  });

  it.each(["copy", "endpoint", "head"] as const)("rejects crossed %s original runtime collections", async fault => {
    const f = await fixture(), context = f.context(), foreign = f.acquire(f.context(f.shared.id)).collection;
    let collection = fault === "endpoint" ? foreign : f.acquire().collection;
    if (fault === "head") {
      f.storage.save(attachEvidence(f.run, f.shared.id, ["synthetic:later"], { kind: "eval", source: "engine_validated", values: { centipawns: 0 } }, at).run, f.lease);
    }
    if (fault === "copy") collection = { ...collection };
    vi.spyOn(supplier, "collectInspectorStorySource").mockReturnValueOnce(collection);
    expect(() => f.acquire(context)).toThrow();
  });

  it.each(["population", "moments", "rank"] as const)("checks cancellation after %s, before further target work", async stage => {
    const f = await fixture(), context = f.context(), population = populations.collectRecordedReviewSourcePopulation, moment = moments.collectRecordedReviewMoments, dispatch = routes.invokeEvidenceValueRoute;
    if (stage === "population") vi.spyOn(populations, "collectRecordedReviewSourcePopulation").mockImplementationOnce(input => { const result = population(input); f.controller.abort(); return result; });
    if (stage === "moments") vi.spyOn(moments, "collectRecordedReviewMoments").mockImplementationOnce(input => { const result = moment(input); f.controller.abort(); return result; });
    const calls = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation((...args) => { const result = dispatch(...args); if (stage === "rank" && args[0] === "derived.story.rank@3") f.controller.abort(); return result; });
    expect(() => f.acquire(context)).toThrow(); expect(calls.mock.calls.filter(row => row[0] === "derived.story.rank@3")).toHaveLength(stage === "rank" ? 1 : 0);
  });

  it.each(["revoke", "role", "storage", "disclosure", "registry", "cancel"] as const)("checks real %s replacement during work and retained reads", async fault => {
    for (const during of [false, true]) {
      const f = await fixture(), context = f.context(undefined, undefined, reader), original = supplier.collectInspectorStorySource;
      const change = () => {
        if (fault === "revoke") f.storage.revokeGrant(f.run.id, reader.learnerId, f.lease);
        if (fault === "role") f.storage.grantRole(f.run.id, reader.learnerId, "spectator", f.lease, at);
        if (fault === "storage") f.storage.save(attachEvidence(f.run, f.shared.id, ["synthetic:later"], { kind: "eval", source: "engine_validated", values: { centipawns: 12 } }, at).run, f.lease);
        if (fault === "disclosure") f.storage.save(commitMove(f.run, "d2d3", { at }).run, f.lease);
        if (fault === "registry") { const record = f.registry.required(shape(false).id); void f.registry.add(record.document, "official", undefined, record.digest); }
        if (fault === "cancel") f.controller.abort();
      };
      if (during) { const mock = vi.spyOn(supplier, "collectInspectorStorySource").mockImplementationOnce((...args) => { const value = original(...args); change(); return value; }); expect(() => f.acquire(context)).toThrow(); mock.mockRestore(); }
      else { const handle = f.service.acquireInspectorStorySource(context, f.controller.signal); change(); expect(() => f.service.readInspectorStorySource(handle)).toThrow(); }
    }
  });

  it("refuses copied handles, foreign owners, and missing signals", async () => {
    const f = await fixture(), context = f.context(), handle = f.service.acquireInspectorStorySource(context, f.controller.signal);
    for (const copy of [{ ...handle }, Object.create(handle), f.service.readInspectorStorySource(handle)]) expect(() => f.service.readInspectorStorySource(copy as InspectorStorySource)).toThrow();
    expect(() => new RunService(f.storage, { shapeRegistry: f.registry }).readInspectorStorySource(handle)).toThrow();
    expect(() => f.service.acquireInspectorStorySource(context, undefined as unknown as AbortSignal)).toThrow();
  });
});
