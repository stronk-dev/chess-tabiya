/** Synthetic reports exercise the real source owner/API, not chess qualification. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { branchPath, commitMove, compileAssistanceRequest, compileAuthoritativeAssistance, createRun, finalizeAssistanceEffects, fork, MODULE_SOURCE_AUTHORITY, rewind, serverAvailabilityFromProviders, type DrillRun } from "@chess-tabiya/runtime";
import { evidenceDigest, evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import { invokeEvidenceValueRoute } from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import { moduleDecisionStamp } from "../../../packages/runtime/src/module-decision.js";
import { parsePresentationReceipt, presentedSentence } from "../../../packages/runtime/src/presentation-contract.js";
import { recordedComparisonData } from "../../../packages/runtime/src/recorded-comparison.js";
import { RECORDED_COMPARISON_POINT_AUTHORITY, readRecordedComparisonPointSource, type RecordedComparisonPointCapture } from "../../../packages/runtime/src/recorded-comparison-point.js";
import { createRecordedReviewBoundarySourceOwner } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { comparisonAssistance } from "../../../packages/runtime/src/testing/recorded-comparison-point-fixture.js";
import { attachDelivery, evaluationDelivery, START_FEN } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { PackRegistry } from "./pack-registry.js";
import { RecordedComparisonPointOwner } from "./recorded-comparison-points.js";
import { RecordedEngineEndpointOwner } from "./recorded-engine-endpoints.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import { createRestHandler } from "./rest.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { ReviewAttemptOutcomeStore, ReviewEvidenceCoordinator } from "./review-evidence.js";

const at = "2026-11-01T19:00:00.000Z", lease = { writerId: "compare-writer", learnerId: "__legacy" };
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });
interface Report { readonly node: number; readonly engine?: string; readonly cp?: number; readonly mate?: number; readonly time?: boolean }
async function fixture(reports: readonly Report[] = []) {
  const document = withDerivedRequires({ id: "comparison-points", version: "1.0.0", title: "Synthetic Compare sources", mode: "outcome", phase: "opening",
    start: { fen: START_FEN, side: "white" as const }, objective: { type: "hold", summary: "Synthetic contract fixture, not a lesson",
      grading: { assessedBy: { kind: "authored", note: "Synthetic only" }, resolveAt: { kind: "checkpoint", checkpointId: "done" } }, successConditions: [] },
    checkpoints: [{ id: "done", trigger: { atStart: true }, actions: [] }], opponentPolicy: { mode: "human_common" }, feedbackPolicy: "immediate_guard",
    provenance: { reviewStatus: "schema_example", sources: [] } });
  const digest = await digestDrillPack(document);
  let run = createRun({ id: "comparison-points", session: { kind: "pack", packId: document.id, packDigest: digest, start: document.start,
    feedbackPolicy: "immediate_guard", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  const main = run.activeCursor.branchId;
  for (const move of ["e2e4", "e7e5", "g1f3"]) run = commitMove(run, move, { at }).run;
  const path = branchPath(run, main), root = path[0]!.id;
  run = fork(rewind(run, root, at).run, root, { at }).run;
  for (const move of ["d2d4", "d7d5", "c2c4"]) run = commitMove(run, move, { at }).run;
  const licence = { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null };
  const ledger = { schema: "tabiya.sourcing.evidence.v1", packId: document.id, packVersion: document.version, packDigest: digest, sourcedAt: at,
    records: reports.map((report, index) => ({ kind: "engine_eval", anchor: { fen: path[report.node]!.fen }, sourceId: `engine-${index}`, retrievedAt: at,
      grounds: "machine_validation", supports: [], values: { fen: path[report.node]!.fen,
        ...(report.mate === undefined ? { centipawns: report.cp ?? 25 } : { mateIn: report.mate }), perspective: "white", depth: 35, multiPv: 1,
        engineId: report.engine ?? "X", engineName: `Engine ${report.engine ?? "X"}`, engineVersion: "1" } })), abstentions: [] };
  const manifest = { schema: "tabiya.sourcing.manifest.v1", entries: reports.map((report, index) => ({ sourceId: `engine-${index}`, retrievedAt: at, licence,
    origin: { kind: "engine", engineId: report.engine ?? "X", engineName: `Engine ${report.engine ?? "X"}`, engineVersion: "1",
      profile: { threads: 1, hashMb: 16, multiPv: 1 }, budget: report.time ? { movetimeMs: 100 } : { depth: 12 }, fen: path[report.node]!.fen, evidenceKind: "engine_eval" } })) };
  const registry = await PackRegistry.fromDocuments([{ source: "synthetic", value: document, ...(reports.length === 0 ? {} : { ledger, manifest }) }]);
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: lease.learnerId, handle: lease.learnerId, passwordHash: "!", createdAt: at }); storage.create(run, lease);
  const service = new RunService(storage, { packRegistry: registry }), owner = new RecordedComparisonPointOwner(storage, registry, undefined);
  const controller = new AbortController(), permission = comparisonAssistance();
  const state = () => ({ ...permission, run: storage.read(run.id)!.run, access: service.assistanceAuthority(run.id, permission.principal) });
  const resolve = () => owner.resolve({ nodeId: run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(storage.read(run.id)!.run).digest, timing: "review" }, state, controller.signal)!;
  const save = (next: DrillRun) => { run = next; storage.save(run, lease); };
  const capture = (nodeId: string): RecordedComparisonPointCapture => {
    const context = resolve(), image = owner.read(context), boundary = createRecordedReviewBoundarySourceOwner({ loadRun: () => storage.read(run.id)!.run, loadImportRecord: () => undefined })
      .resolve({ runId: run.id, branchId: main, throughNodeId: path.at(-1)!.id });
    const endpoints = new RecordedEngineEndpointOwner(registry, undefined), source = endpoints.capture({ boundary, signal: controller.signal });
    return { ...endpoints.comparisonPointCapture(source, nodeId), comparison: image.comparison, branchId: main, nodeId, permission: image.permission, signal: controller.signal };
  };
  const query = () => ({ nodeId: run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(storage.read(run.id)!.run).digest, timing: "review" as const });
  const intent = compileAssistanceRequest({ contextHint: "onramp", preference: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
  const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
  const finalized = (principal: typeof permission.principal) => finalizeAssistanceEffects(compileAuthoritativeAssistance(intent,
    { ...service.assistanceAuthority(run.id, principal), availability }), { authority: MODULE_SOURCE_AUTHORITY, availability });
  return { run, main, path, registry, storage, service, owner, controller, permission, resolve, state, save, capture, query, intent, finalized };
}

describe("real Compare source owner and current service integration", () => {
  it("keeps fixed A/X,B/Y-then-X,C/Y endpoints and every local unavailable node", async () => {
    const f = await fixture([{ node: 0, engine: "X" }, { node: 1, engine: "Y" }, { node: 1, engine: "X" }, { node: 2, engine: "Y", time: true }]);
    const context = f.resolve(), { points } = f.owner.sources(context), data = points.map(point => f.owner.readPoint(point));
    expect(data).toHaveLength(4); expect(data.map(value => value.payload?.engineId ?? value.unavailable)).toEqual(["X", "Y", "Y", "missing_eval"]);
    expect(data[1]!.authority.selectedOrdinal).toBe(1);
    expect(data[2]!.payload!.bound).toEqual({ kind: "movetime", requestedMs: 100 });
    for (const source of points) {
      const result = invokeEvidenceValueRoute("derived.compare.engine_trajectory@2", { comparisonPoint: source });
      if (result.kind === "available") expect(evidenceValueReceipt(result.value).sourceDigests).toHaveLength(2);
    }
  });
  it("serves the actual current Compare module with original modern readings beside missing points", async () => {
    const f = await fixture();
    f.save(attachDelivery(f.storage.read(f.run.id)!.run, f.path[1]!.id, evaluationDelivery(f.path[1]!.fen, "cp 25")));
    const run = f.storage.read(f.run.id)!.run;
    const page = f.service.queryModules(run.id, f.permission.principal, f.permission.assistance, { timing: "review", nodeId: run.activeCursor.nodeId, requested: ["compare_coach"] });
    const packet = page.packets.find(value => value.module === "compare_coach")!;
    expect(packet).toBeDefined(); expect(packet.receipt.items.length).toBeGreaterThan(0);
    expect(packet.unavailable).toContainEqual(expect.objectContaining({ projection: "derived.compare.engine_trajectory@2", reason: "missing_eval" }));
    const items = parsePresentationReceipt(JSON.parse(JSON.stringify(packet.receipt)));
    expect(items.map(presentedSentence).join(" ")).not.toMatch(/undefined|NaN|\[object Object\]/u);
    expect(packet.receipt.items.every(item => item.adapter.consumer.id === "module.compare_coach" && item.adapter.consumer.version === 2)).toBe(true);
  });
  it("revalidates actual storage, cancelled requests, current permission and registry identity", async () => {
    const f = await fixture([{ node: 0 }]), context = f.resolve(), image = f.owner.read(context);
    const source = f.owner.resolvePoint(context, { comparison: image.comparison, nodeId: f.path[0]!.id, signal: f.controller.signal });
    expect(() => f.owner.resolvePoint(context, { comparison: image.comparison, nodeId: f.path[0]!.id, signal: new AbortController().signal })).toThrow();
    const lookup = vi.spyOn(f.registry, "resolveRecordedMeasurementSource");
    lookup.mockImplementationOnce(() => ({ kind: "unavailable", reason: "not_configured" }) as never);
    expect(() => f.owner.readPoint(source)).toThrow(); lookup.mockRestore();
    f.controller.abort(); expect(() => f.owner.readPoint(source)).toThrow();
    const g = await fixture(), current = g.state();
    const granted = g.owner.resolve({ nodeId: current.run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(current.run).digest, timing: "review" }, () => current, g.controller.signal)!;
    current.role = "author"; expect(() => g.owner.sources(granted)).toThrow(/withheld/u);
    const h = await fixture(), stored = h.resolve(); h.save(commitMove(h.storage.read(h.run.id)!.run, "e7e6", { at }).run);
    expect(() => h.owner.sources(stored)).toThrow(/changed/u);
  });
  it.each(["omitted", "reordered", "crossed_node", "omitted_abstention", "digest", "off_position_source"])("D3895 refuses incomplete or crossed original population: %s", async fault => {
    const f = await fixture([{ node: 0 }, { node: 0 }, { node: 1 }]), input = f.capture(f.path[0]!.id), offline = input.offline!;
    let corrupted = { ...offline };
    if (fault === "omitted") corrupted = { ...offline, candidates: offline.candidates.slice(1) };
    if (fault === "reordered") corrupted = { ...offline, candidates: [...offline.candidates].reverse() };
    if (fault === "crossed_node") corrupted = { ...offline, candidates: f.capture(f.path[1]!.id).offline!.candidates };
    if (fault === "digest") corrupted = { ...offline, ledgerDigest: `sha256:${"0".repeat(64)}` };
    if (fault === "omitted_abstention") {
      const abstention = { kind: "engine_eval", anchor: { fen: f.path[0]!.fen }, sourceId: "engine-0", retrievedAt: at, reason: "source_unavailable", detail: "Synthetic" };
      const ledger = { ...offline.ledger, abstentions: [abstention] };
      corrupted = { ...offline, ledger, ledgerDigest: `sha256:${evidenceDigest(ledger)}` };
    }
    if (fault === "off_position_source") {
      const manifest = structuredClone(offline.manifest); (manifest.entries[2]!.origin as { fen: string }).fen = "invalid";
      corrupted = { ...offline, manifest, manifestDigest: `sha256:${evidenceDigest(manifest)}`,
        candidates: offline.candidates.map(candidate => ({ ...candidate, source: manifest.entries[candidate.sourceOrdinal]! })) };
    }
    expect(() => RECORDED_COMPARISON_POINT_AUTHORITY.issue({ ...input, offline: corrupted })).toThrow();
    expect(() => RECORDED_COMPARISON_POINT_AUTHORITY.issue(input)).not.toThrow();
  });
  it("D3897 clones unrelated mutable backing records and owns candidate envelopes", async () => {
    const f = await fixture([{ node: 0 }]), input = f.capture(f.path[0]!.id), offline = input.offline!;
    const extra = { kind: "citable_text", anchor: { fen: f.path[0]!.fen }, sourceId: "engine-0", retrievedAt: at, grounds: "citable_source", supports: [], values: { text: "Synthetic unrelated record" } };
    const ledger = { ...offline.ledger, records: [...offline.ledger.records, extra] }, candidates = offline.candidates.map(row => ({ ...row }));
    const capture = { ...input, offline: { ...offline, ledger, candidates, ledgerDigest: `sha256:${evidenceDigest(ledger)}` } };
    const source = RECORDED_COMPARISON_POINT_AUTHORITY.issue(capture), before = readRecordedComparisonPointSource(source);
    expect(Object.isFrozen(extra)).toBe(false); expect(Object.isFrozen(extra.values)).toBe(false); expect(Object.isFrozen(candidates[0])).toBe(false);
    extra.values.text = "caller changed"; candidates.reverse();
    expect(readRecordedComparisonPointSource(source)).toBe(before);
    expect(before.authority.offline!.ledger.records.at(-1)!.values.text).toBe("Synthetic unrelated record");
  });
  it("D3899 revalidates real host grants, role downgrade and revocation through RunService", async () => {
    const f = await fixture([{ node: 0 }]), viewer = { learnerId: "compare-viewer", handle: "compare-viewer" };
    f.storage.createLearner({ id: viewer.learnerId, handle: viewer.handle, passwordHash: "!", createdAt: at });
    f.storage.grantRole(f.run.id, viewer.learnerId, "host", lease, at);
    const assistance = f.finalized(viewer), selection = f.query();
    const context = f.service.resolveComparisonRecordedContext(f.run.id, viewer, assistance, selection, f.controller.signal)!;
    const image = f.service.readComparisonRecordedContext(context);
    const source = f.service.resolveComparisonPointSource(context, { comparison: image.comparison, nodeId: f.path[0]!.id, signal: f.controller.signal });
    expect(readRecordedComparisonPointSource(source).payload).not.toBeNull();
    // The original selection is captured, not retained as caller-owned backing state.
    (selection as { timing: string }).timing = "checkpoint";
    expect(() => f.service.readComparisonRecordedContext(context)).not.toThrow();
    f.storage.grantRole(f.run.id, viewer.learnerId, "participant", lease, at);
    expect(() => f.service.readComparisonRecordedContext(context)).toThrow(expect.objectContaining({ reason: "permission_withheld" }));
    f.storage.revokeGrant(f.run.id, viewer.learnerId, lease);
    expect(() => f.service.readComparisonRecordedContext(context)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });
  it.each(["participant", "spectator"] as const)("D3899 refuses actual %s grants before registry work", async role => {
    const f = await fixture([{ node: 0 }]), viewer = { learnerId: "compare-viewer", handle: "compare-viewer" };
    f.storage.createLearner({ id: viewer.learnerId, handle: viewer.handle, passwordHash: "!", createdAt: at });
    f.storage.grantRole(f.run.id, viewer.learnerId, role, lease, at);
    const collect = vi.spyOn(f.registry, "collectRecordedMeasurements");
    expect(() => f.service.resolveComparisonRecordedContext(f.run.id, viewer, f.permission.assistance, f.query(), f.controller.signal))
      .toThrow(expect.objectContaining({ reason: "permission_withheld" }));
    expect(collect).not.toHaveBeenCalled();
  });
  it("D3899 refuses publication if actual host access is revoked during source collection", async () => {
    const f = await fixture([{ node: 0 }]), viewer = { learnerId: "compare-viewer", handle: "compare-viewer" };
    f.storage.createLearner({ id: viewer.learnerId, handle: viewer.handle, passwordHash: "!", createdAt: at });
    f.storage.grantRole(f.run.id, viewer.learnerId, "host", lease, at);
    const assistance = f.finalized(viewer), collect = f.registry.collectRecordedMeasurements.bind(f.registry);
    let revoked = false;
    vi.spyOn(f.registry, "collectRecordedMeasurements").mockImplementation(input => {
      const result = collect(input);
      if (!revoked) { revoked = true; f.storage.revokeGrant(f.run.id, viewer.learnerId, lease); }
      return result;
    });
    expect(() => f.service.queryModules(f.run.id, viewer, assistance, { timing: "review", nodeId: f.run.activeCursor.nodeId, requested: ["compare_coach"] }))
      .toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });
  it("delivers the complete current module through the actual REST route and maps corrupt sources to typed failure", async () => {
    const f = await fixture([{ node: 0 }]), handler = createRestHandler(f.service);
    const ask = () => handler(new Request(`http://tabiya.test/runs/${f.run.id}/modules/query`, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ assistance: f.intent, query: { timing: "review", nodeId: f.run.activeCursor.nodeId, requested: ["compare_coach"] } }) }));
    const response = await ask(); expect(response.status).toBe(200);
    const { page } = await response.json() as { page: ReturnType<RunService["queryModules"]> };
    expect(page.packets.find(packet => packet.module === "compare_coach")!.receipt.items.every(item => item.adapter.consumer.version === 2)).toBe(true);
    vi.spyOn(f.registry, "resolveRecordedMeasurementSource").mockImplementation(() => { throw new TypeError("Synthetic corrupt source"); });
    const corrupt = await ask(); expect(corrupt.status).toBe(503); expect(await corrupt.json()).toMatchObject({ error: { code: "EVIDENCE_UNAVAILABLE" } });
  });
  it("uses the real pending reservation instead of offline fallback and retires retained Compare sources", async () => {
    const f = await fixture([{ node: 0 }]);
    let release!: (value: null) => void;
    const identity = new Promise<null>(resolve => { release = resolve; });
    const { scheduler } = composeProviderTraversalApplication({ engines: new MockProviderEngineClient(), tablebaseFetch: null, explorerFetch: null, explorerToken: null });
    const acquire = vi.spyOn(scheduler, "get");
    const coordinator = new ReviewEvidenceCoordinator({ storage: f.storage, scheduler, requestedEngine: () => identity,
      attempts: new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 4, maxAttemptsPerRequest: 1 }), windowNodes: 1,
      maxOutstandingPerRun: 1, maxTrackedRuns: 1, maxAttemptsPerRequest: 1, movetimeMs: 50, timeoutMs: 1000, linePlies: 4 });
    try {
      const owner = new RecordedComparisonPointOwner(f.storage, f.registry, coordinator);
      const before = owner.resolve(f.query(), f.state, f.controller.signal)!;
      expect(owner.readPoint(owner.sources(before).points[0]!).payload).not.toBeNull();
      coordinator.ensureBranch(f.run.id, f.main);
      expect(() => owner.sources(before)).toThrow();
      const context = owner.resolve(f.query(), f.state, f.controller.signal)!, source = owner.sources(context).points[0]!;
      expect(owner.readPoint(source)).toMatchObject({ payload: null, unavailable: "source_pending" });
      expect(acquire).not.toHaveBeenCalled();
      await coordinator.close(); release(null);
      expect(() => owner.readPoint(source)).toThrow();
    } finally { await coordinator.close(); release(null); }
  });
});
