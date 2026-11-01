// Synthetic engine reports/deliveries exercise original source selection, not chess qualification.
import { afterEach, describe, expect, it, vi } from "vitest";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { attachEvidence, branchPath, commitMove, createRun, type DrillRun } from "@chess-tabiya/runtime";
import { createRecordedReviewBoundarySourceOwner } from "../../../packages/runtime/src/recorded-review-boundary.js";
import { attachDelivery, evaluationDelivery, START_FEN } from "../../../packages/runtime/src/testing/review-evidence-fixture.js";
import { PackRegistry } from "./pack-registry.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { RecordedEngineEndpointOwner, type RecordedEngineEndpoints } from "./recorded-engine-endpoints.js";
import { ReviewAttemptOutcomeStore, ReviewEvidenceCoordinator } from "./review-evidence.js";
import { composeProviderTraversalApplication } from "./provider-traversal.js";
import { MockProviderEngineClient } from "./mock-provider-engine.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-11-01T19:00:00.000Z", lease = { writerId: "endpoint-writer", learnerId: "__legacy" };
const stores: SQLiteRunStorage[] = [], coordinators: ReviewEvidenceCoordinator[] = [];
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(coordinators.splice(0).map(value => value.close())); for (const store of stores.splice(0)) store.close(); });
interface Report { node: number; engine?: string; cp?: number; mate?: number; budget?: { depth: number } | { movetimeMs: number }; local?: boolean; multiPv?: number }
async function fixture(reports: readonly Report[] = [], side: "white" | "black" = "white", mutate?: (ledger: any, manifest: any) => void, sidecars = true) {
  const document = withDerivedRequires({ id: "engine-endpoints", version: "1.0.0", title: "Synthetic endpoint sources", mode: "outcome", phase: "opening",
    start: { fen: START_FEN, side }, objective: { type: "hold", summary: "Synthetic source selection, not a chess lesson",
      grading: { assessedBy: { kind: "authored", note: "Synthetic fixture only" }, resolveAt: { kind: "checkpoint", checkpointId: "done" } }, successConditions: [] },
    checkpoints: [{ id: "done", trigger: { atStart: true }, actions: [] }], opponentPolicy: { mode: "human_common" }, feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "schema_example", sources: [] } });
  const digest = await digestDrillPack(document);
  let run = createRun({ id: "recorded-engine-endpoints", session: { kind: "pack", packId: document.id, packDigest: digest, start: document.start,
    feedbackPolicy: "delayed_checkpoint", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest,
    policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
  for (const move of ["e2e4", "e7e5"]) run = commitMove(run, move, { at }).run;
  const path = branchPath(run, run.activeCursor.branchId), licence = { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null };
  const ledger: any = { schema: "tabiya.sourcing.evidence.v1", packId: document.id, packVersion: document.version, packDigest: digest, sourcedAt: at,
    records: reports.map((report, ordinal) => ({ kind: "engine_eval", anchor: { fen: path[report.node]!.fen }, sourceId: `report-${ordinal}`, retrievedAt: at,
      grounds: "machine_validation", supports: [], values: { fen: path[report.node]!.fen, ...(report.mate === undefined ? { centipawns: report.cp ?? 20 } : { mateIn: report.mate }),
        depth: 35, multiPv: 1, perspective: "white", engineId: report.engine ?? "X", engineName: `Engine ${report.engine ?? "X"}`, engineVersion: "1" } })), abstentions: [] };
  const manifest: any = { schema: "tabiya.sourcing.manifest.v1", entries: reports.map((report, ordinal) => ({ sourceId: `report-${ordinal}`, retrievedAt: at, licence,
    origin: report.local ? { kind: "local-file", path: "synthetic.txt", sha256: digest, bytes: 1 }
      : { kind: "engine", engineId: report.engine ?? "X", engineName: `Engine ${report.engine ?? "X"}`, engineVersion: "1", profile: { threads: 1, hashMb: 16, multiPv: report.multiPv ?? 1 },
        budget: report.budget ?? { depth: 12 }, fen: path[report.node]!.fen, evidenceKind: "engine_eval" } })) };
  mutate?.(ledger, manifest);
  const registry = await PackRegistry.fromDocuments([{ source: "synthetic", value: document, ...(sidecars ? { ledger, manifest } : {}) }]);
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  storage.createLearner({ id: lease.learnerId, handle: lease.learnerId, passwordHash: "!", createdAt: at });
  storage.create(run, lease);
  const boundaryOwner = createRecordedReviewBoundarySourceOwner({ loadRun: id => storage.read(id)?.run, loadImportRecord: () => undefined });
  const boundary = (index = path.length - 1) => boundaryOwner.resolve({ runId: run.id, branchId: path[0]!.branchId, throughNodeId: path[index]!.id });
  const owner = new RecordedEngineEndpointOwner(registry, undefined), controller = new AbortController();
  const save = (next: DrillRun) => { run = next; storage.save(run, lease); };
  return { run, path, document, digest, registry, storage, owner, controller, boundary, save,
    capture: (index = path.length - 1) => owner.capture({ boundary: boundary(index), signal: controller.signal }),
    delivery: (index: number, score = "cp 20", options: Parameters<typeof evaluationDelivery>[2] = {}) => { save(attachDelivery(run, path[index]!.id, evaluationDelivery(path[index]!.fen, score, options))); },
    legacy: (index: number) => { save(attachEvidence(run, path[index]!.id, ["engine:legacy"], { kind: "eval", source: "engine_validated", values: { centipawns: 999 } }, at).run); } };
}

function pending(f: Awaited<ReturnType<typeof fixture>>) {
  let release!: (value: { id: string; version: string } | null) => void;
  const identity = new Promise<{ id: string; version: string } | null>(resolve => { release = resolve; });
  const { scheduler } = composeProviderTraversalApplication({ engines: new MockProviderEngineClient(), tablebaseFetch: null, explorerFetch: null, explorerToken: null });
  const get = vi.spyOn(scheduler, "get");
  const coordinator = new ReviewEvidenceCoordinator({ storage: f.storage, scheduler, requestedEngine: () => identity,
    attempts: new ReviewAttemptOutcomeStore({ maxTerminalAttemptOutcomes: 4, maxAttemptsPerRequest: 1 }),
    windowNodes: 1, maxOutstandingPerRun: 1, maxTrackedRuns: 1, maxAttemptsPerRequest: 1, movetimeMs: 50, timeoutMs: 1000, linePlies: 4 });
  coordinators.push(coordinator);
  return { coordinator, release, get, owner: new RecordedEngineEndpointOwner(f.registry, coordinator) };
}

describe("fixed original engine endpoints — registry, canonical stored boundary and request owner", () => {
  for (const side of ["white", "black"] as const) for (const budget of [{ depth: 12 }, { movetimeMs: 100 }] as const) {
    it(`retains White-relative offline scores, original ordinal and requested ${"depth" in budget ? "depth" : "time"} for ${side}`, async () => {
      const f = await fixture([{ node: 0, cp: -25, budget }, { node: 1, mate: -3, budget }], side), source = f.capture();
      const data = f.owner.read(source), before = f.owner.resolveRecordedEngineEndpoint(source, f.path[0]!.id), after = data.rows[1]!;
      expect(before).toBe(data.rows[0]); expect(before.state).toMatchObject({ kind: "available", score: { kind: "centipawns", value: -25 },
        instrument: { origin: "offline_engine", engineVersion: "1", profile: { threads: 1, hashMb: 16, multiPv: 1 } },
        bound: "depth" in budget ? { kind: "depth", requestedDepth: 12 } : { kind: "movetime", requestedMs: 100 } });
      expect(before.state).not.toHaveProperty("depth"); expect(before.selectedOrdinal).toBe(0);
      expect(after.state).toMatchObject({ score: { kind: "mate", side: "black", distance: 3, unit: "moves" } });
      expect(after.selectedOrdinal).toBe(1); expect(after.candidates[0]!.row).toBe(after.ledger!.records[0]);
      expect(after.candidates[0]!.row.invocation.result.kind).toBe("available");
      expect(data.rows[2]!.state).toEqual({ kind: "unavailable", reason: "missing_eval" });
      expect(Object.isFrozen(before)).toBe(true); expect(Object.isFrozen(before.state)).toBe(true);
    });
  }

  it("selects B/Y once, never later B/X to rescue A/X→B, retaining every candidate and graph point", async () => {
    const f = await fixture([{ node: 0, engine: "X" }, { node: 1, engine: "Y" }, { node: 1, engine: "X" }, { node: 2, engine: "Y" }]);
    const source = f.capture(), rows = f.owner.read(source).rows;
    expect(rows.map(row => row.state.kind === "available" ? row.state.engineId : null)).toEqual(["X", "Y", "Y"]);
    expect(rows[1]!.candidates.map(row => row.disposition)).toEqual(["selected", "eligible"]);
    expect(rows[1]!.selectedOrdinal).toBe(1);
    expect(f.owner.resolveRecordedEngineEndpoint(source, f.path[1]!.id)).toBe(rows[1]);
    expect(f.owner.resolveRecordedEngineEndpoint(source, f.path[1]!.id)).toBe(rows[1]);
  });

  it("skips individually ineligible reports, not incomparable neighbors, and retains their dispositions", async () => {
    const f = await fixture([{ node: 0, local: true }, { node: 0, multiPv: 2 }, { node: 0, engine: "Y" }]);
    const row = f.owner.read(f.capture()).rows[0]!;
    expect(row.selectedOrdinal).toBe(2); expect(row.state).toMatchObject({ engineId: "Y" });
    expect(row.candidates.map(candidate => candidate.disposition)).toEqual(["input_abstained", "input_abstained", "selected"]);
  });

  it.each(["identity", "version", "name", "evidenceKind"])("fails conflicting artifact %s even after an earlier valid candidate", async fault => {
    const f = await fixture([{ node: 0 }, { node: 0 }], "white", (_ledger, manifest) => {
      manifest.entries[1].origin[fault === "identity" ? "engineId" : fault === "version" ? "engineVersion" : fault === "name" ? "engineName" : "evidenceKind"] = fault === "evidenceKind" ? "tablebase_result" : "conflict";
    });
    expect(f.capture).toThrow(expect.objectContaining({ reason: "source_contract_invalid" }));
  });

  it.each([0, 1.5])("keeps an unusable signed mate report %s as input abstention, never cp or a repaired mate", async mate => {
    const f = await fixture([{ node: 0, mate }]), row = f.owner.read(f.capture()).rows[0]!;
    expect(row.state).toEqual({ kind: "unavailable", reason: "input_abstained" }); expect(row.selectedOrdinal).toBeNull();
    expect(row.ledger!.records).toHaveLength(1);
  });

  for (const side of ["white", "black"] as const) for (const bound of [{ kind: "depth", requestedDepth: 12 }, { kind: "movetime", requestedMs: 100 }, { kind: "nodes", requestedNodes: 2048 }] as const) {
    it(`retains the actual modern ${bound.kind} delivery for ${side}, not a later scalar or an offline alternative`, async () => {
      const f = await fixture([{ node: 0, cp: 999 }, { node: 1, cp: 999 }], side);
      f.delivery(0, "cp 25", { bound }); f.delivery(1, "mate -3", { bound }); f.legacy(1);
      const rows = f.owner.read(f.capture()).rows;
      expect(rows[0]!.origin).toBe("provider_delivery"); expect(rows[0]!.ledger).toBeNull();
      expect(rows[0]!.state).toMatchObject({ engineId: "stockfish-analysis", bound, instrument: { origin: "provider_delivery", engineVersion: "19", generation: 1 } });
      expect(rows[0]!.state).toHaveProperty("score.value", 25); expect(rows[0]!.state).not.toHaveProperty("bound.reachedDepth");
      expect(rows[1]!.state).toHaveProperty("score.side", "white"); // Black-to-move raw -3 is White's mate.
      expect(rows[1]!.modern.occurrences.map(value => value.kind)).toEqual(["modern", "legacy"]);
      expect(rows[1]!.modern.selected!.point.payload.position).toBe(rows[1]!.position);
    });
  }

  it("refuses corrupt modern data instead of falling back to a valid pinned report", async () => {
    const f = await fixture([{ node: 1 }]);
    f.save(attachEvidence(f.storage.read(f.run.id)!.run, f.path[1]!.id, ["engine:bad"], { kind: "eval", source: "engine_validated", values: { providerDelivery: null } }, at).run);
    expect(f.capture).toThrow();
  });

  it("keeps scalar-only history from becoming provider evidence and allows an independent pinned report", async () => {
    const f = await fixture([{ node: 1 }]); f.legacy(1);
    const row = f.owner.read(f.capture()).rows[1]!;
    expect(row.origin).toBe("offline_engine"); expect(row.modern.selected).toBeNull(); expect(row.state.kind).toBe("available");
  });

  it("binds selection to the genuine original boundary, including root-only scope and cancellation", async () => {
    const f = await fixture([{ node: 0 }, { node: 2 }]), source = f.capture(0);
    expect(f.owner.read(source).rows).toHaveLength(1);
    expect(() => f.owner.resolveRecordedEngineEndpoint(source, f.path[2]!.id)).toThrow();
    for (const fake of [{}, { ...source }, JSON.parse(JSON.stringify(source)), Object.create(source)]) expect(() => f.owner.read(fake as RecordedEngineEndpoints)).toThrow();
    expect(() => new RecordedEngineEndpointOwner(f.registry, undefined).read(source)).toThrow();
    f.controller.abort(); expect(() => f.owner.read(source)).toThrow(); expect(f.capture).toThrow();
  });

  it("retires selected sources when actual original storage or registry membership changes", async () => {
    const f = await fixture([{ node: 0 }]), source = f.capture();
    f.delivery(0); expect(() => f.owner.read(source)).toThrow();
    const g = await fixture([{ node: 0 }]), before = g.capture();
    g.registry.addPlaytest(g.registry.required(g.document.id).document, g.digest);
    expect(() => g.owner.read(before)).toThrow();
  });

  it("distinguishes no source from invalid and actual lookup failures without inventing pending", async () => {
    const f = await fixture([], "white", undefined, false);
    expect(f.owner.read(f.capture()).rows.every(row => row.state.kind === "unavailable" && row.state.reason === "missing_eval")).toBe(true);
    const g = await fixture([{ node: 0 }], "white", (_ledger, manifest) => { manifest.entries[0].origin.fen = "invalid"; });
    expect(g.capture).toThrow(expect.objectContaining({ reason: "source_contract_invalid" }));
    vi.spyOn(f.registry, "resolveRecordedMeasurementSource").mockImplementation(() => { throw new Error("Synthetic lookup failure"); });
    expect(f.capture).toThrow(expect.objectContaining({ reason: "source_lookup_failed" }));
  });

  it("uses only an actual owned pending request, does no acquisition, and invalidates on its retirement", async () => {
    const f = await fixture([{ node: 0 }, { node: 1 }]), p = pending(f), before = JSON.stringify(f.storage.read(f.run.id));
    p.coordinator.ensureBranch(f.run.id, f.path[0]!.branchId);
    const token = p.coordinator.recordedPendingRequest(f.run.id, f.path[0]!.branchId, f.path[0]!.id, f.path[0]!.fen);
    expect(token).toBeDefined(); expect(Object.isFrozen(token)).toBe(true);
    expect(p.coordinator.recordedPendingRequest(f.run.id, f.path[0]!.branchId, f.path[0]!.id, f.path[1]!.fen)).toBeUndefined();
    expect(p.coordinator.recordedPendingRequest("other-run", f.path[0]!.branchId, f.path[0]!.id, f.path[0]!.fen)).toBeUndefined();
    expect(p.coordinator.recordedPendingRequest(f.run.id, "other-branch", f.path[0]!.id, f.path[0]!.fen)).toBeUndefined();
    expect(p.coordinator.recordedPendingRequest(f.run.id, f.path[0]!.branchId, "other-node", f.path[0]!.fen)).toBeUndefined();
    const source = p.owner.capture({ boundary: f.boundary(), signal: f.controller.signal }), rows = p.owner.read(source).rows;
    expect(rows[0]!.pending).toBe(token); expect(rows[0]!.state).toEqual({ kind: "unavailable", reason: "source_pending" }); expect(rows[0]!.ledger).toBeNull();
    expect(rows[1]!.origin).toBe("offline_engine"); expect(rows[1]!.state.kind).toBe("available");
    expect(p.get).not.toHaveBeenCalled(); expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
    await p.coordinator.close(); p.release(null); expect(() => p.owner.read(source)).toThrow();
  });

  it("invalidates a prior offline selection when actual modern work is reserved, not merely because a score is absent", async () => {
    const f = await fixture([{ node: 0 }]), p = pending(f), source = p.owner.capture({ boundary: f.boundary(), signal: f.controller.signal });
    expect(p.owner.read(source).rows[0]!.origin).toBe("offline_engine");
    p.coordinator.ensureBranch(f.run.id, f.path[0]!.branchId);
    expect(() => p.owner.read(source)).toThrow(); expect(p.get).not.toHaveBeenCalled();
    await p.coordinator.close(); p.release(null);
  });

  it("retains actual ledger refusals and abstentions without inventing available points", async () => {
    const f = await fixture([{ node: 0 }], "white", ledger => { ledger.records[0].grounds = "citable_source"; });
    const row = f.owner.read(f.capture()).rows[0]!;
    expect(row.state).toEqual({ kind: "unavailable", reason: "input_abstained" });
    expect(row.candidates[0]!.disposition).toBe("ledger_record_not_admitted"); expect(row.selectedOrdinal).toBeNull();
    const g = await fixture([{ node: 0 }], "white", ledger => {
      const record = ledger.records.pop(); ledger.abstentions.push({ kind: record.kind, anchor: record.anchor, sourceId: record.sourceId,
        retrievedAt: at, reason: "source_unavailable", detail: "Synthetic unavailable report" });
    });
    const abstained = g.owner.read(g.capture()).rows[0]!;
    expect(abstained.state).toEqual({ kind: "unavailable", reason: "input_abstained" });
    expect(abstained.ledger!.abstentions).toHaveLength(1); expect(abstained.candidates).toEqual([]);
  });

  it("does not query an unrelated invalid ledger when all nodes have genuine modern deliveries", async () => {
    const f = await fixture([{ node: 0 }], "white", (_ledger, manifest) => { manifest.entries[0].origin.fen = "invalid"; });
    for (let index = 0; index < f.path.length; index++) f.delivery(index);
    const lookup = vi.spyOn(f.registry, "resolveRecordedMeasurementSource");
    expect(f.owner.read(f.capture()).rows.every(row => row.origin === "provider_delivery" && row.state.kind === "available")).toBe(true);
    expect(lookup).not.toHaveBeenCalled();
  });

  it("cannot borrow a pinned pack for a non-pack run at the exact same full FEN", async () => {
    const f = await fixture([{ node: 0 }]);
    const run = createRun({ id: "unrelated-position", session: { kind: "position", start: f.document.start, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: f.digest, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    f.storage.create(run, lease);
    const owner = createRecordedReviewBoundarySourceOwner({ loadRun: id => f.storage.read(id)?.run, loadImportRecord: () => undefined });
    const source = f.owner.capture({ boundary: owner.resolve({ runId: run.id, branchId: run.activeCursor.branchId, throughNodeId: run.activeCursor.nodeId }), signal: f.controller.signal });
    const row = f.owner.read(source).rows[0]!;
    expect(row.position.payload.fen).toBe(f.path[0]!.fen); expect(row.origin).toBeNull();
    expect(row.state).toEqual({ kind: "unavailable", reason: "missing_eval" }); expect(row.ledger).toBeNull();
  });

  it.each(["abort", "retire"])("publishes no selection if collection itself causes %s", async fault => {
    const f = await fixture([{ node: 0 }]), original = f.registry.collectRecordedMeasurements.bind(f.registry);
    vi.spyOn(f.registry, "collectRecordedMeasurements").mockImplementation(input => {
      const result = original(input);
      if (fault === "abort") f.controller.abort(); else f.registry.addPlaytest(f.registry.required(f.document.id).document, f.digest);
      return result;
    });
    expect(f.capture).toThrow();
  });

  it("rejects caller-selected readings and getter inputs before evaluating those fields", async () => {
    const f = await fixture(), getter = vi.fn(() => f.boundary());
    const input = { signal: f.controller.signal };
    Object.defineProperty(input, "boundary", { enumerable: true, get: getter });
    expect(() => f.owner.capture(input as never)).toThrow(); expect(getter).not.toHaveBeenCalled();
    expect(() => f.owner.capture({ boundary: f.boundary(), signal: f.controller.signal, before: {} } as never)).toThrow();
  });

  it.each(["record-clock", "abstention-clock", "refused-kind"])("does not hide a later conflicting %s behind an earlier valid selection", async fault => {
    const f = await fixture([{ node: 0 }, { node: 0 }], "white", (ledger, manifest) => {
      if (fault === "record-clock") ledger.records[1].values.fen = START_FEN.replace(" 0 1", " 1 1");
      else if (fault === "refused-kind") { ledger.records[1].grounds = "citable_source"; manifest.entries[1].origin.evidenceKind = "tablebase_result"; }
      else { const record = ledger.records.pop(); ledger.abstentions.push({ kind: record.kind, sourceId: record.sourceId, retrievedAt: at,
        anchor: { fen: START_FEN.replace(" 0 1", " -1 1") }, reason: "source_unavailable", detail: "Synthetic malformed clock" }); }
    });
    expect(f.capture).toThrow(expect.objectContaining({ reason: "source_contract_invalid" }));
  });

  it("retires an old pending selection when a real reservation is replaced at the same node", async () => {
    const f = await fixture([{ node: 0 }]), p = pending(f);
    const second = createRun({ id: "reservation-eviction", session: { kind: "position", start: f.document.start, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
      sessionDigest: f.digest, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at });
    f.storage.create(second, lease);
    p.coordinator.ensureBranch(f.run.id, f.path[0]!.branchId);
    const source = p.owner.capture({ boundary: f.boundary(), signal: f.controller.signal }), token = p.owner.read(source).rows[0]!.pending;
    p.coordinator.ensureBranch(second.id, second.activeCursor.branchId); // actual one-tracker LRU evicts/cancels the first reservation
    p.coordinator.ensureBranch(f.run.id, f.path[0]!.branchId);
    const replacement = p.coordinator.recordedPendingRequest(f.run.id, f.path[0]!.branchId, f.path[0]!.id, f.path[0]!.fen);
    expect(replacement).toBeDefined(); expect(replacement).not.toBe(token);
    expect(() => p.owner.read(source)).toThrow(); expect(p.get).not.toHaveBeenCalled();
    await p.coordinator.close(); p.release(null);
  });
});
