import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { digestDrillPack } from "@chess-tabiya/schema/drill-pack";
import { attachEvidence, commitMove, createRun, fork, invokeRunRecordPosition, rewind } from "@chess-tabiya/runtime";
import { evidenceValueReceipt } from "../../../packages/runtime/src/evidence-contract.js";
import * as routes from "../../../packages/runtime/src/internal/evidence-value-routes.js";
import * as runtime from "@chess-tabiya/runtime";
import { PackRegistry, RecordedMeasurementSourceError, type RecordedMeasurementProjection, type RecordedMeasurementPopulation } from "./pack-registry.js";
import { withDerivedRequires } from "./capability/pack-capabilities.js";
import type { EvidenceLedger, SourceManifest } from "./sourcing/types.js";
import { SQLiteRunStorage } from "./storage.js";

const at = "2026-10-16T00:00:00.000Z";
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
type Kind = "engine_eval" | "tablebase_result";
const projection = (kind: Kind): RecordedMeasurementProjection => kind === "engine_eval" ? "recorded.engine.eval@1" : "recorded.tablebase.result@1";

/** Synthetic reports exercise artifact/factory retention, never actual engine/tablebase truth. */
async function fixture(kind: Kind, side: "white" | "black" = "white", change?: (ledger: any, manifest: any) => void,
  fen = `4k3/7p/8/8/8/8/P7/4K3 ${side === "white" ? "w" : "b"} - - 0 1`) {
  const document = withDerivedRequires({ id: "measurement-population", version: "1.0.0", title: "Synthetic measurement source fixture",
    mode: "outcome", phase: "endgame", start: { fen, side }, objective: { type: "hold", summary: "Synthetic contract fixture, not a lesson",
      grading: { assessedBy: { kind: "authored", note: "Synthetic fixture only" }, resolveAt: { kind: "checkpoint", checkpointId: "done" } }, successConditions: [] },
    checkpoints: [{ id: "done", trigger: { atPly: 2 }, actions: [] }], opponentPolicy: { mode: "human_common" }, feedbackPolicy: "delayed_checkpoint",
    provenance: { reviewStatus: "schema_example", sources: [] },
  });
  const digest = await digestDrillPack(document);
  const values = kind === "engine_eval" ? { fen, centipawns: 20, depth: 8, multiPv: 1, perspective: "white", engineId: "fixture", engineName: "Synthetic fixture", engineVersion: "fixture" }
    : { fen, category: "draw", dtz: 0, precise_dtz: 0, dtm: null, pieceCount: 4, checkmate: false, stalemate: false, insufficient_material: false };
  const record = { kind, anchor: { fen }, values, sourceId: "measurement", retrievedAt: at, grounds: "machine_validation", supports: [] };
  const ledger: any = { schema: "tabiya.sourcing.evidence.v1", packId: document.id, packVersion: document.version, packDigest: digest, sourcedAt: at,
    records: [record, { ...record, kind: "citable_text", sourceId: "text", grounds: "citable_source", values: { text: "Synthetic fixture" } },
      { ...structuredClone(record), sourceId: "text", grounds: "citable_source" }, structuredClone(record)],
    abstentions: [{ kind, anchor: { fen }, sourceId: "text", retrievedAt: at, reason: "source_unavailable", detail: "Synthetic abstention" }] };
  const licence = { basis: "spdx", spdx: "CC0-1.0", noticeText: null, rationale: null };
  const manifest: any = { schema: "tabiya.sourcing.manifest.v1", entries: [
    { sourceId: "text", retrievedAt: at, licence, origin: { kind: "local-file", path: "synthetic.txt", sha256: digest, bytes: 1 } },
    { sourceId: "measurement", retrievedAt: at, licence, origin: kind === "engine_eval"
      ? { kind: "engine", engineId: "fixture", engineName: "Synthetic fixture", engineVersion: "fixture", profile: { threads: 1, hashMb: 16, multiPv: 1 }, budget: { depth: 8 }, fen, evidenceKind: kind }
      : { kind: "http", url: `https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`, status: 200, sha256: null, bytes: null, etag: null } },
  ] };
  change?.(ledger, manifest);
  const registry = await PackRegistry.fromDocuments([{ source: "synthetic", value: document, ledger: ledger as EvidenceLedger, manifest: manifest as SourceManifest }]);
  const admission = registry.resolveRecordedMeasurementSource(digest);
  if (admission.kind !== "available") throw new Error(`fixture artifact must admit: ${JSON.stringify(admission)}`);
  const run = createRun({ id: `population-${side}`, session: { kind: "pack", packId: document.id, packDigest: digest,
    start: { fen, side }, feedbackPolicy: "delayed_checkpoint", opponentPolicy: { mode: "human_common" } }, sessionDigest: digest, policyConfig, seed: 1, createdAt: at });
  const position = invokeRunRecordPosition(run, run.activeCursor.nodeId);
  const input = { source: admission.source, position, projection: projection(kind) };
  return { registry, source: admission.source, position, run, document, digest, input, collect: () => registry.collectRecordedMeasurements(input) };
}
afterEach(() => vi.restoreAllMocks());

describe("registry-owned complete selected-position measurement populations", () => {
  for (const kind of ["engine_eval", "tablebase_result"] as const) for (const side of ["white", "black"] as const) {
    it(`retains ordered duplicate ${kind} reports/refusals/abstentions for ${side}`, async () => {
      const f = await fixture(kind, side), population = f.collect(), image = f.registry.readRecordedMeasurements(population);
      expect(image.position).toBe(f.position);
      expect(image.artifact).toBe(f.registry.readRecordedMeasurementSource(f.source));
      expect(image.origin).toMatchObject({ runId: f.run.id, nodeId: f.run.activeCursor.nodeId, pack: { id: f.document.id, digest: f.digest } });
      expect(image.records.map(row => row.ordinal)).toEqual([0, 2, 3]);
      expect(image.records.map(row => row.invocation.result.kind)).toEqual(["available", "unavailable", "available"]);
      for (const row of image.records) {
        expect(row.record).toBe(image.artifact.ledger.records[row.ordinal]);
        expect(row.source).toBe(image.artifact.manifest.entries[row.sourceOrdinal]);
        expect(row.invocation.ledger.payload).toBe(row.record);
        if (row.invocation.result.kind === "available") expect(evidenceValueReceipt(row.invocation.result.value).sourceDigests).toEqual([evidenceValueReceipt(row.invocation.ledger).payloadDigest]);
      }
      expect(image.readings).toHaveLength(2);
      expect(image.readings[0]).not.toBe(image.readings[1]);
      expect(image.abstentions[0]!.abstention).toBe(image.artifact.ledger.abstentions[0]);
      expect(image.counts).toEqual({ matchedRecords: 3, admittedRecords: 2, notAdmittedRecords: 1,
        abstentions: { out_of_range: 0, source_unavailable: 1, no_data_at_band: 0, licence_withheld: 0 } });
      expect(image.outcome).toEqual({ kind: "available", collected: 2 });
      expect(image).not.toHaveProperty("sourceKey");
      expect(image).not.toHaveProperty("grant");
      for (const value of [population, image, image.records, image.readings, image.counts, image.counts.abstentions]) expect(Object.isFrozen(value)).toBe(true);
      expect(f.registry.required(f.document.id).assessmentGrounding).toBe("unverified");
    });
  }

  it.each(["refused-only", "abstention-only", "empty"])("distinguishes %s from fake zero or missing-source coverage", async variant => {
    const f = await fixture("engine_eval", "white", ledger => {
      if (variant !== "refused-only") for (const row of ledger.records) row.kind = "citable_text";
      else for (const row of ledger.records) row.grounds = "citable_source";
      if (variant !== "abstention-only") ledger.abstentions[0].kind = "tablebase_result";
    });
    const image = f.registry.readRecordedMeasurements(f.collect());
    expect(image.readings).toEqual([]);
    expect(image.outcome).toEqual(variant === "empty" ? { kind: "no_witness" } : { kind: "unavailable", reason: "recorded_measurement_unavailable" });
    expect(image.counts.matchedRecords).toBe(variant === "refused-only" ? 3 : 0);
    expect(image.counts.abstentions.source_unavailable).toBe(variant === "abstention-only" ? 1 : 0);
  });

  it.each(["side", "halfmove", "fullmove", "castling", "en-passant"])("matches all six fields including %s without transpose-key borrowing", async field => {
    const original = field === "castling" ? "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"
      : field === "en-passant" ? "4k3/7p/8/3pP3/8/8/P7/4K3 w - d6 0 1" : undefined;
    const f = await fixture("engine_eval", "white", (ledger, manifest) => {
      const parts = ledger.records[0].anchor.fen.split(" ");
      parts[field === "side" ? 1 : field === "castling" ? 2 : field === "en-passant" ? 3 : field === "halfmove" ? 4 : 5] = field === "side" ? "b" : ["castling", "en-passant"].includes(field) ? "-" : field === "halfmove" ? "1" : "2";
      const other = parts.join(" ");
      for (const row of ledger.records) if (row.kind === "engine_eval") { row.anchor.fen = other; row.values.fen = other; }
      ledger.abstentions[0].anchor.fen = other;
      manifest.entries[1].origin.fen = other;
    }, original);
    expect(f.registry.readRecordedMeasurements(f.collect()).outcome).toEqual({ kind: "no_witness" });
  });

  it.each(["anchor", "values", "engine-source", "abstention", "missing-fen"])("refuses an invalid/conflicting requested-kind %s before any invocation", async variant => {
    const f = await fixture("engine_eval", "white", (ledger, manifest) => {
      if (variant === "anchor") ledger.records[3].anchor.fen = "not a FEN";
      if (variant === "values") ledger.records[3].values.fen = ledger.records[3].anchor.fen.replace("0 1", "1 1");
      if (variant === "engine-source") manifest.entries[1].origin.fen = manifest.entries[1].origin.fen.replace("0 1", "0 2");
      if (variant === "abstention") ledger.abstentions[0].anchor.fen = "not a FEN";
      if (variant === "missing-fen") delete ledger.records[3].anchor.fen;
    });
    const spy = vi.spyOn(runtime, "invokeRecordedMeasurementReading");
    expect(() => f.collect()).toThrow(RecordedMeasurementSourceError);
    try { f.collect(); } catch (error) { expect(error).toMatchObject({ reason: "source_contract_invalid" }); }
    expect(spy).not.toHaveBeenCalled();
  });

  it("refuses a conflicting recognized Syzygy request before reading-factory invocation", async () => {
    const f = await fixture("tablebase_result", "white", (_ledger, manifest) => {
      const url = new URL(manifest.entries[1].origin.url);
      url.searchParams.set("fen", url.searchParams.get("fen")!.replace("0 1", "1 1"));
      manifest.entries[1].origin.url = url.toString();
    });
    expect(() => f.collect()).toThrow(/Syzygy/);
  });

  it("retains selected reports even when the same node owns live evidence", async () => {
    const f = await fixture("engine_eval");
    const live = attachEvidence(f.run, f.run.activeCursor.nodeId, ["synthetic-live"], { kind: "eval", source: "engine_validated", values: { centipawns: 999 } }, at).run;
    const position = invokeRunRecordPosition(live, live.activeCursor.nodeId);
    const image = f.registry.readRecordedMeasurements(f.registry.collectRecordedMeasurements({ ...f.input, position }));
    expect(image.readings).toHaveLength(2);
    expect(image.origin.headDigest).not.toBe(runtime.recordedMeasurementPosition(f.position).headDigest);
  });

  it("rejects foreign/copied sources, positions, populations, wrong refs and stale artifact membership", async () => {
    const f = await fixture("engine_eval"), other = await fixture("engine_eval");
    for (const source of [{}, { ...f.source }, other.source]) expect(() => f.registry.collectRecordedMeasurements({ ...f.input, source: source as typeof f.source })).toThrow();
    for (const position of [{ ...f.position }, {}, null]) expect(() => f.registry.collectRecordedMeasurements({ ...f.input, position: position as typeof f.position })).toThrow();
    const population = f.collect();
    for (const fake of [{}, { ...population }, other.collect()]) expect(() => f.registry.readRecordedMeasurements(fake as RecordedMeasurementPopulation)).toThrow();
    const read = vi.spyOn(f.registry, "readRecordedMeasurementSource");
    for (const projection of ["recorded.engine.eval@2", "live.stockfish.eval@1", "recorded.tablebase.result"]) expect(() => f.registry.collectRecordedMeasurements({ ...f.input, projection: projection as RecordedMeasurementProjection })).toThrow(/unsupported/);
    expect(read).not.toHaveBeenCalled(); read.mockRestore();
    f.registry.addPlaytest(f.document as any, f.digest);
    expect(() => f.registry.readRecordedMeasurements(population)).toThrow(/no longer/);
  });

  it("refuses genuine equal-FEN positions from a different pack pin or a non-pack run before factories", async () => {
    const f = await fixture("engine_eval"), fen = f.document.start.fen;
    const native = createRun({ id: "native-position", session: { kind: "position", start: { fen, side: "white" },
      feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } }, sessionDigest: f.digest, policyConfig, seed: 1 });
    const crossed = createRun({ id: "crossed-pin", session: { kind: "pack", packId: f.document.id, packDigest: `sha256:${"f".repeat(64)}`,
      start: { fen, side: "white" }, feedbackPolicy: "delayed_checkpoint", opponentPolicy: { mode: "human_common" } }, sessionDigest: f.digest, policyConfig, seed: 1 });
    const spy = vi.spyOn(runtime, "invokeRecordedMeasurementReading");
    for (const run of [native, crossed]) {
      const position = invokeRunRecordPosition(run, run.activeCursor.nodeId);
      expect(() => f.registry.collectRecordedMeasurements({ ...f.input, position })).toThrow(/pinned pack/);
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it("fails a thrown required factory rather than emitting partial facts or no_witness", async () => {
    const f = await fixture("engine_eval");
    const spy = vi.spyOn(runtime, "invokeRecordedMeasurementReading").mockImplementation(() => { throw new Error("synthetic invocation failure"); });
    expect(() => f.collect()).toThrow(RecordedMeasurementSourceError);
    try { f.collect(); } catch (error) { expect(error).toMatchObject({ reason: "source_contract_invalid" }); }
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it.each(["engine_eval", "tablebase_result"] as const)("counts each original %s abstention reason without dropping valid readings", async kind => {
    const f = await fixture(kind, "white", ledger => {
      const original = ledger.abstentions[0];
      ledger.abstentions = ["out_of_range", "source_unavailable", "no_data_at_band", "licence_withheld"].map(reason => ({ ...original, reason }));
      // Other permitted record families are retained, not interpreted by this supplier.
      ledger.records[1].anchor = { fen: "not a requested-kind position" };
    });
    const image = f.registry.readRecordedMeasurements(f.collect());
    expect(image.outcome).toEqual({ kind: "available", collected: 2 });
    expect(image.counts.abstentions).toEqual({ out_of_range: 1, source_unavailable: 1, no_data_at_band: 1, licence_withheld: 1 });
    expect(image.abstentions.map(row => row.ordinal)).toEqual([0, 1, 2, 3]);
  });

  it.each(["white", "black"] as const)("uses the actual reopened SQLite run with retained alternatives for %s", async side => {
    const f = await fixture("engine_eval", side), directory = await mkdtemp(join(tmpdir(), "tabiya-measurement-population-"));
    let storage: SQLiteRunStorage | undefined;
    try {
      const rootId = f.run.activeCursor.nodeId;
      let run = commitMove(f.run, side === "white" ? "a2a3" : "h7h6", { at }).run;
      run = fork(rewind(run, rootId, at).run, rootId, { at }).run;
      run = commitMove(run, side === "white" ? "a2a4" : "h7h5", { at }).run;
      const filename = join(directory, "run.sqlite");
      storage = new SQLiteRunStorage(filename, { onMigration: () => {} });
      storage.createLearner({ id: "measurement-owner", handle: "measurement-owner", passwordHash: "!", createdAt: at });
      storage.create(run, { writerId: "writer", learnerId: "measurement-owner" });
      storage.close();
      storage = new SQLiteRunStorage(filename, { onMigration: () => {} });
      const parsed = storage.read(run.id)!.run, before = JSON.stringify(parsed.events);
      expect(parsed.branches).toHaveLength(2);
      expect(parsed.nodes).toHaveLength(3);
      const position = invokeRunRecordPosition(parsed, rootId);
      const population = f.registry.collectRecordedMeasurements({ ...f.input, position });
      const image = f.registry.readRecordedMeasurements(population);
      expect(image.position).toBe(position);
      expect(image.origin.headDigest).not.toBe(runtime.recordedMeasurementPosition(f.position).headDigest);
      expect(image.readings).toHaveLength(2);
      expect(image.origin.pack?.digest).toBe(f.digest);
      expect(JSON.stringify(storage.read(run.id)!.run.events)).toBe(before);
      expect(image.records.map(row => row.ordinal)).toEqual([0, 2, 3]);
    } finally { storage?.close(); await rm(directory, { recursive: true, force: true }); }
  });

  it.each(["crossed", "copied", "lookup"])("classifies actual %s invocation failures without returning partial populations", async variant => {
    const f = await fixture("engine_eval"), original = f.registry.readRecordedMeasurements(f.collect()).records[0]!.invocation;
    const actual = routes.invokeEvidenceValueRoute;
    const spy = vi.spyOn(routes, "invokeEvidenceValueRoute").mockImplementation(((route: string, input: never) => {
      if (route !== "recorded.engine.eval@1") return actual(route as never, input);
      return variant === "lookup" ? actual("synthetic.missing.route@1" as never, input)
        : variant === "copied" ? { ...original.result } : original.result;
    }) as typeof actual);
    try {
      expect(() => f.collect()).toThrow(RecordedMeasurementSourceError);
      try { f.collect(); } catch (error) { expect(error).toMatchObject({ reason: variant === "lookup" ? "source_lookup_failed" : "source_contract_invalid" }); }
    } finally { spy.mockRestore(); }
  });

  it.each(["missing", "duplicate-identical", "duplicate-conflicting"])("refuses %s Syzygy request FEN claims before invocation", async variant => {
    const f = await fixture("tablebase_result", "white", (_ledger, manifest) => {
      const url = new URL(manifest.entries[1].origin.url), fen = url.searchParams.get("fen")!;
      if (variant === "missing") url.searchParams.delete("fen");
      else url.searchParams.append("fen", variant === "duplicate-identical" ? fen : fen.replace("0 1", "1 1"));
      manifest.entries[1].origin.url = url.toString();
    });
    const spy = vi.spyOn(runtime, "invokeRecordedMeasurementReading");
    expect(() => f.collect()).toThrow(/Syzygy/);
    expect(spy).not.toHaveBeenCalled();
  });
});
