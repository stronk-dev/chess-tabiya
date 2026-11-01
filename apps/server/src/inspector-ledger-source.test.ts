// Synthetic reports prove source/access/population contracts, not measured chess truth.
import { afterEach, describe, expect, it, vi } from "vitest";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { commitMove, compileAssistanceRequest, createRun, moduleDecisionStamp, reachCheckpoint, serverAvailabilityFromProviders } from "@chess-tabiya/runtime";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import { PackRegistry, RecordedMeasurementSourceError, type RecordedMeasurementProjection } from "./pack-registry.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage } from "./storage.js";
import type { InspectorLedgerSource } from "./inspector-ledger-source.js";

const at = "2026-11-01T12:00:00.000Z";
const owner = { learnerId: "ledger-owner", handle: "ledger-owner" };
const viewer = { learnerId: "ledger-viewer", handle: "ledger-viewer" };
const availability = serverAvailabilityFromProviders({ opponent: "none", judge: "none", llm: "none", corpus: "none", tts: "none", tablebase: "none" });
const request = compileAssistanceRequest({ contextHint: "pack", preference: { kind: "explicit", preset: "analysis", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });
const stores: SQLiteRunStorage[] = [];
afterEach(() => { vi.restoreAllMocks(); for (const store of stores.splice(0)) store.close(); });

async function fixture(kind: "engine_eval" | "tablebase_result" = "engine_eval", side: "white" | "black" = "white",
  mutate?: (ledger: any, manifest: any) => void, sidecars = true) {
  const fen = `4k3/7p/8/8/8/8/P7/4K3 ${side === "white" ? "w" : "b"} - - 0 1`;
  const document = withDerivedRequires({ id: "inspector-measurement", version: "1.0.0", title: "Synthetic Inspector measurements",
    mode: "outcome", phase: "endgame", start: { fen, side }, objective: { type: "hold", summary: "Synthetic source contract, not a lesson",
      grading: { assessedBy: { kind: "authored", note: "Synthetic fixture only" }, resolveAt: { kind: "checkpoint", checkpointId: "done" } }, successConditions: [] },
    checkpoints: [{ id: "done", trigger: { atStart: true }, actions: [] }], opponentPolicy: { mode: "human_common" }, feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "schema_example", sources: [] } });
  const digest = await digestDrillPack(document), values = kind === "engine_eval"
    ? { fen, centipawns: 20, depth: 8, multiPv: 1, perspective: "white", engineId: "fixture", engineName: "Synthetic fixture", engineVersion: "fixture" }
    : { fen, category: "draw", dtz: 0, precise_dtz: 0, dtm: null, pieceCount: 4, checkmate: false, stalemate: false, insufficient_material: false };
  const record = { kind, anchor: { fen }, values, sourceId: "measurement", retrievedAt: at, grounds: "machine_validation", supports: [] };
  const ledger: any = { schema: "tabiya.sourcing.evidence.v1", packId: document.id, packVersion: document.version, packDigest: digest, sourcedAt: at,
    records: [record, { ...structuredClone(record), sourceId: "text", grounds: "citable_source" }, structuredClone(record)],
    abstentions: [{ kind, anchor: { fen }, sourceId: "text", retrievedAt: at, reason: "source_unavailable", detail: "Synthetic abstention" }] };
  const licence = { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null };
  const manifest: any = { schema: "tabiya.sourcing.manifest.v1", entries: [
    { sourceId: "text", retrievedAt: at, licence, origin: { kind: "local-file", path: "synthetic.txt", sha256: digest, bytes: 1 } },
    { sourceId: "measurement", retrievedAt: at, licence, origin: kind === "engine_eval"
      ? { kind: "engine", engineId: "fixture", engineName: "Synthetic fixture", engineVersion: "fixture", profile: { threads: 1, hashMb: 16, multiPv: 1 }, budget: { depth: 8 }, fen, evidenceKind: kind }
      : { kind: "http", url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`, status: 200, sha256: null, bytes: null, etag: null } },
  ] };
  mutate?.(ledger, manifest);
  const registry = await PackRegistry.fromDocuments([{ source: "synthetic", value: document, ...(sidecars ? { ledger, manifest } : {}) }]);
  const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} }); stores.push(storage);
  for (const principal of [owner, viewer]) storage.createLearner({ id: principal.learnerId, handle: principal.handle, passwordHash: "!", createdAt: at });
  const run = reachCheckpoint(createRun({ id: `inspector-ledger-${kind}-${side}`, session: { kind: "pack", packId: document.id, packDigest: digest, start: { fen, side }, feedbackPolicy: "delayed_checkpoint", opponentPolicy: { mode: "human_common" } },
    sessionDigest: digest, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 1, createdAt: at }), "done", at).run;
  const lease = { writerId: "ledger-writer", learnerId: owner.learnerId }; storage.create(run, lease);
  const service = new RunService(storage, { packRegistry: registry }), controller = new AbortController();
  const query = { branchId: run.activeCursor.branchId, nodeId: run.activeCursor.nodeId, decisionDigest: moduleDecisionStamp(run).digest, context: { kind: "position" as const } };
  const context = service.resolveInspectorRecordedContext(run.id, owner, request, availability, query, controller.signal);
  const projection: RecordedMeasurementProjection = kind === "engine_eval" ? "recorded.engine.eval@1" : "recorded.tablebase.result@1";
  return { service, storage, registry, run, lease, document, digest, controller, query, context, projection,
    acquire: () => service.acquireInspectorLedgerSource(context, { projection, signal: controller.signal }) };
}

describe("current Inspector registry-backed ledger supplier", () => {
  for (const kind of ["engine_eval", "tablebase_result"] as const) for (const side of ["white", "black"] as const) {
    it(`joins actual current access to all ${side} ${kind} occurrences, without grading or singleton collapse`, async () => {
      const f = await fixture(kind, side), before = JSON.stringify(f.storage.read(f.run.id)), source = f.acquire();
      const data = f.service.readInspectorLedgerSource(source);
      expect(data.outcome).toEqual({ kind: "available", collected: 2 });
      expect(data.sourceKey).toMatch(/^sha256:[a-f0-9]{64}$/u);
      expect(data.recordedCoverage).toEqual({ sourceKey: data.sourceKey, matchedRecords: 3, admittedRecords: 2, notAdmittedRecords: 1,
        abstentions: { out_of_range: 0, source_unavailable: 1, no_data_at_band: 0, licence_withheld: 0 } });
      expect(data.population!.records.map(row => row.ordinal)).toEqual([0, 1, 2]);
      expect(data.population!.readings).toHaveLength(2);
      expect(data.population!.readings[0]).not.toBe(data.population!.readings[1]);
      expect(f.registry.required(f.document.id).assessmentGrounding).toBe("unverified");
      expect(f.service.readInspectorLedgerSource(source)).toBe(data);
      expect(f.service.readInspectorLedgerSource(f.acquire()).sourceKey).toBe(data.sourceKey);
      expect(JSON.stringify(f.storage.read(f.run.id))).toBe(before);
    });
  }

  it.each(["refused", "abstained", "zero", "missing", "invalid"])("retains %s outcomes and never forges measured zero coverage", async kind => {
    const f = await fixture("engine_eval", "white", ledger => {
      if (kind === "refused") for (const row of ledger.records) row.grounds = "citable_source";
      if (kind === "abstained" || kind === "zero") for (const row of ledger.records) row.kind = "citable_text";
      if (kind === "refused" || kind === "zero") ledger.abstentions[0].kind = "tablebase_result";
      if (kind === "invalid") ledger.packDigest = `sha256:${"f".repeat(64)}`;
    }, kind !== "missing");
    const data = f.service.readInspectorLedgerSource(f.acquire());
    if (kind === "invalid" || kind === "missing") {
      expect(data.recordedCoverage).toBeNull(); expect(data.sourceKey).toBeNull();
      expect(data.outcome).toEqual(kind === "missing" ? { kind: "unavailable", reason: "source_absent" } : { kind: "failed", reason: "source_contract_invalid" });
    } else {
      expect(data.outcome).toEqual(kind === "zero" ? { kind: "no_witness" } : { kind: "unavailable", reason: "recorded_measurement_unavailable" });
      expect(data.recordedCoverage!.admittedRecords).toBe(0);
      expect(data.sourceKey).not.toBeNull();
    }
  });

  it.each(["copy", "json", "prototype", "foreign", "data"])("refuses a %s retained supplier result", async kind => {
    const f = await fixture(), token = f.acquire();
    const foreign = kind === "foreign" ? await fixture() : null;
    const fake = kind === "copy" ? { ...token } : kind === "json" ? JSON.parse(JSON.stringify(token)) : kind === "prototype" ? Object.create(token)
      : kind === "data" ? f.service.readInspectorLedgerSource(token) : foreign!.acquire();
    expect(() => f.service.readInspectorLedgerSource(fake as InspectorLedgerSource)).toThrow();
  });

  it("refuses crossed refs/contexts and cancelled work before any registry selection", async () => {
    const f = await fixture(), collect = vi.spyOn(f.registry, "collectRecordedMeasurements");
    expect(() => f.service.acquireInspectorLedgerSource(f.context, { projection: "live.stockfish.eval@1" as never, signal: f.controller.signal })).toThrow();
    const context = f.service.resolveInspectorRecordedContext(f.run.id, owner, request, availability,
      { ...f.query, context: { kind: "branch", throughNodeId: f.query.nodeId } }, f.controller.signal);
    expect(() => f.service.acquireInspectorLedgerSource(context, { projection: f.projection, signal: f.controller.signal })).toThrow();
    f.controller.abort(); expect(f.acquire).toThrow(); expect(collect).not.toHaveBeenCalled();
  });

  it("rechecks permission and original artifact membership after acquisition and every retained read", async () => {
    const f = await fixture(), token = f.acquire();
    f.registry.addPlaytest(f.registry.required(f.document.id).document, f.digest);
    expect(() => f.service.readInspectorLedgerSource(token)).toThrow();
    const g = await fixture();
    g.storage.grantRole(g.run.id, viewer.learnerId, "host", g.lease, at);
    const context = g.service.resolveInspectorRecordedContext(g.run.id, viewer, request, availability, g.query, g.controller.signal);
    const viewed = g.service.acquireInspectorLedgerSource(context, { projection: g.projection, signal: g.controller.signal });
    g.storage.grantRole(g.run.id, viewer.learnerId, "participant", g.lease, at);
    expect(() => g.service.readInspectorLedgerSource(viewed)).toThrow(expect.objectContaining({ reason: "withheld" }));
    g.storage.revokeGrant(g.run.id, viewer.learnerId, g.lease);
    expect(() => g.service.readInspectorLedgerSource(viewed)).toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it("retires changed decisions and aborts during real collection instead of publishing a late result", async () => {
    const f = await fixture(), token = f.acquire();
    f.storage.save(commitMove(f.run, "e1d1", { at }).run, f.lease);
    expect(() => f.service.readInspectorLedgerSource(token)).toThrow();
    const g = await fixture(), original = g.registry.collectRecordedMeasurements.bind(g.registry);
    vi.spyOn(g.registry, "collectRecordedMeasurements").mockImplementation(input => { const result = original(input); g.controller.abort(); return result; });
    expect(g.acquire).toThrow();
  });

  it.each(["source_contract_invalid", "source_lookup_failed"] as const)("retains %s without fabricated coverage", async reason => {
    const f = await fixture();
    vi.spyOn(f.registry, "collectRecordedMeasurements").mockImplementation(() => { throw new RecordedMeasurementSourceError(reason, "Synthetic supplier failure"); });
    const source = f.acquire();
    expect(f.service.readInspectorLedgerSource(source)).toMatchObject({ outcome: { kind: "failed", reason }, recordedCoverage: null, population: null, sourceKey: null });
  });

  it("retains an actual lookup failure and retires it when original availability changes", async () => {
    const f = await fixture(), lookup = vi.spyOn(f.registry, "resolveRecordedMeasurementSource").mockImplementation(() => { throw new Error("Synthetic actual lookup failure"); });
    const source = f.acquire();
    expect(f.service.readInspectorLedgerSource(source)).toMatchObject({ outcome: { kind: "failed", reason: "source_lookup_failed" }, recordedCoverage: null });
    lookup.mockRestore(); expect(() => f.service.readInspectorLedgerSource(source)).toThrow();
  });

  it("does not equate equal source bytes with a different viewer's current permission", async () => {
    const f = await fixture(), hostSource = f.acquire();
    f.storage.grantRole(f.run.id, viewer.learnerId, "host", f.lease, at);
    const context = f.service.resolveInspectorRecordedContext(f.run.id, viewer, request, availability, f.query, f.controller.signal);
    const peer = f.service.acquireInspectorLedgerSource(context, { projection: f.projection, signal: f.controller.signal });
    expect(f.service.readInspectorLedgerSource(peer).sourceKey).not.toBe(f.service.readInspectorLedgerSource(hostSource).sourceKey);
    expect(f.service.readInspectorLedgerSource(peer).population!.readings.map(value => value.payload)).toEqual(f.service.readInspectorLedgerSource(hostSource).population!.readings.map(value => value.payload));
  });

  it("refuses decorated/getter inputs without executing a caller's projection getter", async () => {
    const f = await fixture(), getter = vi.fn(() => f.projection);
    const input = { signal: f.controller.signal };
    Object.defineProperty(input, "projection", { enumerable: true, get: getter });
    expect(() => f.service.acquireInspectorLedgerSource(f.context, input as never)).toThrow();
    expect(getter).not.toHaveBeenCalled();
  });

  it("honors the separate supplier signal even when its context signal remains live", async () => {
    const f = await fixture(), sourceController = new AbortController();
    const source = f.service.acquireInspectorLedgerSource(f.context, { projection: f.projection, signal: sourceController.signal });
    sourceController.abort();
    expect(f.controller.signal.aborted).toBe(false);
    expect(() => f.service.readInspectorLedgerSource(source)).toThrow();
    expect(() => f.service.readInspectorRecordedContext(f.context)).not.toThrow();
  });

  it("publishes nothing when collection itself retires its original registry artifact or revokes its host", async () => {
    const f = await fixture(), collect = f.registry.collectRecordedMeasurements.bind(f.registry);
    vi.spyOn(f.registry, "collectRecordedMeasurements").mockImplementation(input => {
      const population = collect(input); f.registry.addPlaytest(f.registry.required(f.document.id).document, f.digest); return population;
    });
    expect(f.acquire).toThrow();
    const g = await fixture(); g.storage.grantRole(g.run.id, viewer.learnerId, "host", g.lease, at);
    const context = g.service.resolveInspectorRecordedContext(g.run.id, viewer, request, availability, g.query, g.controller.signal);
    const original = g.registry.collectRecordedMeasurements.bind(g.registry);
    vi.spyOn(g.registry, "collectRecordedMeasurements").mockImplementation(input => {
      const population = original(input); g.storage.revokeGrant(g.run.id, viewer.learnerId, g.lease); return population;
    });
    expect(() => g.service.acquireInspectorLedgerSource(context, { projection: g.projection, signal: g.controller.signal }))
      .toThrow(expect.objectContaining({ code: "RUN_NOT_FOUND" }));
  });

  it.each(["participant", "spectator"] as const)("refuses %s before registry/source work even with an enabled Inspector effect", async role => {
    const f = await fixture(), collect = vi.spyOn(f.registry, "collectRecordedMeasurements");
    f.storage.grantRole(f.run.id, viewer.learnerId, role, f.lease, at);
    expect(() => f.service.resolveInspectorRecordedContext(f.run.id, viewer, request, availability, f.query, f.controller.signal))
      .toThrow(expect.objectContaining({ reason: "withheld" }));
    expect(collect).not.toHaveBeenCalled();
  });
});
