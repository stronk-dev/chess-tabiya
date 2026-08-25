// DISPOSABLE research harness — D1573. Not production code.
//
// Measures the buildability amendment's exact packet scopes and proposed dual cache bound under
// the release Node major. The cache below is an evidence instrument, not an implementation.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { arch, cpus, platform, release } from "node:os";

import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  MOVE_IDENTITY_CONVENTION,
  backRankReading,
  candidateMajorityReading,
  castlingLegality,
  castlingRights,
  declareBackRankEvidence,
  declareCandidateMajorityEvidence,
  declareCastlingLegalityEvidence,
  declareCastlingRightsEvidence,
  declareDevelopmentReadingEvidence,
  declareDiscoveredLatencyEvidence,
  declareKingZoneReadingEvidence,
  declareLoosePieceEvidence,
  declareMateInOneEvidence,
  declareMaterialRoleReadingEvidence,
  declareMobilityReadingEvidence,
  declarePawnConnectivityEvidence,
  declarePawnContactsEvidence,
  declarePromotionPressureEvidence,
  declareRayClassificationEvidence,
  declareRookOnSeventhEvidence,
  declareSpaceEvidence,
  declareSquareControlReadingEvidence,
  declareThreatEvidence,
  declareTrappedPieceEvidence,
  developmentReading,
  discoveredLatencyReading,
  exactLegalMoves,
  kingZoneReading,
  localSemanticEvents,
  loosePieceReading,
  mateInOne,
  materialRoleSignatureReading,
  pawnConnectivityReading,
  pawnContactsReading,
  pieceDestinationsReading,
  promotionPressureReading,
  rayClassificationReading,
  rookOnSeventhReading,
  spaceReading,
  squareControlReading,
  threats,
  trappedPieceReading,
  type DeclaredEvidence,
  type ExactLegalMove,
  type SemanticEvidenceEvent,
} from "@chess-tabiya/runtime";

import { EVIDENCE_MANIFEST } from "../../apps/server/src/evidence-manifest.js";

const INPUT = new URL("../../planning/evidence-foundation-ux/d1061-bestline-distance-results.json", import.meta.url);
const COMPILER_VERSION = 1;
const LEGAL_CONVENTION = "rules.mobility.reading.legal_moves@1";
const MAX_ENTRIES = 8;
const MAX_RETAINED_ITEMS = 56_000;
// The equal-weight trial retained 75.6% more heap for only 17.5% more mixed items. Its incremental
// reading/event heap ratio was 4.31, so the corrected trial rounds the reading coefficient up.
const READING_WEIGHT = 5;

type ScopeName = "event_only" | "event_and_reading";

interface InputRow { readonly packId: string; readonly phase: string; readonly fen: string }

interface CandidateRow {
  readonly moveUci: string;
  readonly afterFen: string;
  readonly events: readonly SemanticEvidenceEvent[];
  readonly readings: readonly DeclaredEvidence<unknown>[];
}

interface Packet {
  readonly id: string;
  readonly beforeFen: string;
  readonly scope: ScopeName;
  readonly legalConvention: string;
  readonly moveIdentityConvention: string;
  readonly manifestDigest: string;
  readonly compilerVersion: number;
  readonly legalMoves: readonly ExactLegalMove[];
  readonly candidates: readonly CandidateRow[];
}

interface CacheStats {
  entries: number;
  retainedWeight: number;
  hits: number;
  misses: number;
  evictions: number;
  oversize: number;
}

function canonicalChild(fen: string, moveUci: string): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const move = parseUci(moveUci);
  if (move === undefined || !("from" in move) || !position.isLegal(move)) {
    throw new TypeError(`illegal packet-envelope move ${moveUci}`);
  }
  position.play(move);
  return makeFen(position.toSetup());
}

// Exact disposable copy of the server-private authority the RFC moves into runtime. Keeping the
// copy here makes the measurement possible before acceptance; criterion 20 forbids it surviving in
// production after implementation.
function candidateChildReadings(afterFen: string): readonly DeclaredEvidence<unknown>[] {
  return Object.freeze([
    declareCastlingRightsEvidence(castlingRights(afterFen)),
    ...castlingLegality(afterFen).map(declareCastlingLegalityEvidence),
    declareLoosePieceEvidence(loosePieceReading(afterFen)),
    declareRayClassificationEvidence(rayClassificationReading(afterFen)),
    declareThreatEvidence(threats(afterFen)),
    declarePawnConnectivityEvidence(pawnConnectivityReading(afterFen)),
    declareDevelopmentReadingEvidence(developmentReading(afterFen)),
    declareRookOnSeventhEvidence(rookOnSeventhReading(afterFen)),
    declareSpaceEvidence(spaceReading(afterFen)),
    declareDiscoveredLatencyEvidence(discoveredLatencyReading(afterFen)),
    declareTrappedPieceEvidence(trappedPieceReading(afterFen)),
    declareBackRankEvidence(backRankReading(afterFen)),
    declareMateInOneEvidence(mateInOne(afterFen)),
    declarePromotionPressureEvidence(promotionPressureReading(afterFen)),
    declareSquareControlReadingEvidence(squareControlReading(afterFen)),
    declareMobilityReadingEvidence(pieceDestinationsReading(afterFen)),
    declarePawnContactsEvidence(pawnContactsReading(afterFen)),
    declareCandidateMajorityEvidence(candidateMajorityReading(afterFen)),
    declareMaterialRoleReadingEvidence(materialRoleSignatureReading(afterFen)),
    declareKingZoneReadingEvidence(kingZoneReading(afterFen)),
  ]);
}

function packetId(fen: string, scope: ScopeName): string {
  return createHash("sha256").update(JSON.stringify([
    fen,
    LEGAL_CONVENTION,
    MOVE_IDENTITY_CONVENTION,
    EVIDENCE_MANIFEST.digest,
    COMPILER_VERSION,
    scope,
  ])).digest("hex");
}

function compilePacket(fen: string, scope: ScopeName): Packet {
  const root = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const beforeFen = makeFen(root.toSetup());
  const legalMoves = exactLegalMoves(beforeFen);
  const candidates = legalMoves.map((move) => {
    const afterFen = canonicalChild(beforeFen, move.uci);
    return Object.freeze({
      moveUci: move.uci,
      afterFen,
      events: localSemanticEvents(beforeFen, move.uci, afterFen),
      readings: scope === "event_and_reading" ? candidateChildReadings(afterFen) : Object.freeze([]),
    });
  });
  expect(new Set(candidates.map((candidate) => candidate.moveUci))).toEqual(
    new Set(legalMoves.map((move) => move.uci)),
  );
  return Object.freeze({
    id: packetId(beforeFen, scope),
    beforeFen,
    scope,
    legalConvention: LEGAL_CONVENTION,
    moveIdentityConvention: MOVE_IDENTITY_CONVENTION,
    manifestDigest: EVIDENCE_MANIFEST.digest,
    compilerVersion: COMPILER_VERSION,
    legalMoves,
    candidates: Object.freeze(candidates),
  });
}

function retainedWeight(packet: Packet, readingWeight: number): number {
  return packet.candidates.reduce(
    (sum, candidate) => sum + candidate.events.length + readingWeight * candidate.readings.length,
    0,
  );
}

function categorySizes(packets: readonly Packet[]) {
  let eventItems = 0;
  let readingItems = 0;
  let eventStructuralJsonBytes = 0;
  let readingStructuralJsonBytes = 0;
  for (const packet of packets) {
    for (const candidate of packet.candidates) {
      eventItems += candidate.events.length;
      readingItems += candidate.readings.length;
      eventStructuralJsonBytes += Buffer.byteLength(JSON.stringify(candidate.events));
      readingStructuralJsonBytes += Buffer.byteLength(JSON.stringify(candidate.readings));
    }
  }
  return {
    eventItems,
    readingItems,
    eventStructuralJsonBytes,
    readingStructuralJsonBytes,
    eventBytesPerItem: eventItems === 0 ? 0 : eventStructuralJsonBytes / eventItems,
    readingBytesPerItem: readingItems === 0 ? 0 : readingStructuralJsonBytes / readingItems,
  };
}

class EnvelopeCache {
  readonly #values = new Map<string, Packet>();
  readonly #readingWeight: number;
  readonly stats: CacheStats = {
    entries: 0,
    retainedWeight: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
    oversize: 0,
  };

  constructor(readingWeight = READING_WEIGHT) {
    this.#readingWeight = readingWeight;
  }

  get(id: string): Packet | undefined {
    const value = this.#values.get(id);
    if (value === undefined) {
      this.stats.misses += 1;
      return undefined;
    }
    this.#values.delete(id);
    this.#values.set(id, value);
    this.stats.hits += 1;
    return value;
  }

  insert(packet: Packet): void {
    const weight = retainedWeight(packet, this.#readingWeight);
    if (weight > MAX_RETAINED_ITEMS) {
      this.stats.oversize += 1;
      return;
    }
    while (
      this.#values.size >= MAX_ENTRIES
      || this.stats.retainedWeight + weight > MAX_RETAINED_ITEMS
    ) {
      const oldest = this.#values.entries().next().value as [string, Packet] | undefined;
      if (oldest === undefined) break;
      this.#values.delete(oldest[0]);
      this.stats.retainedWeight -= retainedWeight(oldest[1], this.#readingWeight);
      this.stats.evictions += 1;
    }
    this.#values.set(packet.id, packet);
    this.stats.entries = this.#values.size;
    this.stats.retainedWeight += weight;
  }

  packets(): readonly Packet[] {
    return [...this.#values.values()];
  }

  clear(): void {
    this.#values.clear();
    this.stats.entries = 0;
    this.stats.retainedWeight = 0;
  }
}

function forceGc(): void {
  if (globalThis.gc === undefined) throw new TypeError("Run this receipt with Node --expose-gc");
  globalThis.gc();
  globalThis.gc();
}

function memory(): { readonly heapUsed: number; readonly rss: number } {
  const value = process.memoryUsage();
  return { heapUsed: value.heapUsed, rss: value.rss };
}

function quantile(values: readonly number[], q: number): number {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.min(ordered.length - 1, Math.floor(q * ordered.length))] ?? 0;
}

function stressPopulation(): readonly (InputRow & { readonly legalMoves: number })[] {
  const source = JSON.parse(readFileSync(INPUT, "utf8")) as { readonly rows: readonly InputRow[] };
  const roots = [...new Map(source.rows.map((row) => [row.fen, row])).values()];
  return roots
    .map((row) => ({ ...row, legalMoves: exactLegalMoves(row.fen).length }))
    .sort((left, right) => right.legalMoves - left.legalMoves || left.fen.localeCompare(right.fen))
    .slice(0, 16);
}

function machine() {
  return {
    node: process.version,
    platform: `${platform()} ${release()} ${arch()}`,
    cpu: cpus()[0]?.model ?? "unknown",
  };
}

function measureScope(fens: readonly string[], scope: ScopeName, readingWeight: number) {
  forceGc();
  const before = memory();
  const cache = new EnvelopeCache(readingWeight);
  const compileMs: number[] = [];
  for (const fen of fens) {
    const id = packetId(makeFen(Chess.fromSetup(parseFen(fen).unwrap()).unwrap().toSetup()), scope);
    const started = performance.now();
    const cached = cache.get(id);
    const packet = cached ?? compilePacket(fen, scope);
    compileMs.push(performance.now() - started);
    if (cached === undefined) cache.insert(packet);
  }
  forceGc();
  const after = memory();
  const packets = cache.packets();
  const result = {
    scope,
    rootsAttempted: fens.length,
    compileMs: {
      p50: quantile(compileMs, 0.5),
      p95: quantile(compileMs, 0.95),
      max: Math.max(...compileMs),
    },
    cache: { ...cache.stats },
    categories: categorySizes(packets),
    structuralJsonBytes: packets.reduce((sum, packet) => sum + Buffer.byteLength(JSON.stringify(packet)), 0),
    heapUsedDeltaBytes: after.heapUsed - before.heapUsed,
    rssDeltaBytes: after.rss - before.rss,
  };
  cache.clear();
  forceGc();
  return result;
}

describe("D1573 Node-24 candidate-packet memory envelope", () => {
  it("measures one same-id cold/warm pair", { timeout: 30_000 }, () => {
    expect(process.versions.node.split(".")[0]).toBe("24");
    const stressRoots = stressPopulation();
    const witness = stressRoots[0]!;
    const cache = new EnvelopeCache();
    const coldStarted = performance.now();
    const cold = compilePacket(witness.fen, "event_only");
    const coldMs = performance.now() - coldStarted;
    cache.insert(cold);
    const warmStarted = performance.now();
    const warm = cache.get(cold.id);
    const warmMs = performance.now() - warmStarted;
    expect(warm).toBe(cold);
    expect(warm?.id).toBe(cold.id);
    cache.clear();

    const report = {
      measuredAt: "2026-08-26",
      machine: machine(),
      procedure: "Compile the highest-legal-count D1061 root once, then read the exact packet id from the same in-process cache",
      witness: {
        packId: witness.packId,
        phase: witness.phase,
        legalMoves: witness.legalMoves,
        packetIds: { cold: cold.id, warm: warm!.id },
        coldMs,
        warmMs,
      },
    };
    console.log(`D1573_NODE24_COLD_WARM ${JSON.stringify(report)}`);
    expect(report.witness.packetIds.cold).toBe(report.witness.packetIds.warm);
  });

  it.each([
    { label: "event_only corrected_weight", scope: "event_only" as const, readingWeight: READING_WEIGHT },
    { label: "event_and_reading equal_item_control", scope: "event_and_reading" as const, readingWeight: 1 },
    { label: "event_and_reading corrected_weight", scope: "event_and_reading" as const, readingWeight: READING_WEIGHT },
  ])(
    "measures the $label cache envelope",
    { timeout: 120_000 },
    ({ scope, readingWeight }) => {
      expect(process.versions.node.split(".")[0]).toBe("24");
      const stressRoots = stressPopulation();
      const result = measureScope(stressRoots.map((row) => row.fen), scope, readingWeight);
      const report = {
        measuredAt: "2026-08-26",
        machine: machine(),
        procedure: "Fresh Vitest worker under Node 24 with --expose-gc; fill the proposed 8-entry/56,000-retained-weight LRU with the 16 highest-legal-count D1061 roots; force GC immediately before and after the retained cache measurement",
        bounds: {
          maxEntries: MAX_ENTRIES,
          maxRetainedWeight: MAX_RETAINED_ITEMS,
          retainedWeightFormula: `events + ${readingWeight} * readings`,
        },
        result,
      };
      console.log(`D1573_NODE24_SCOPE ${JSON.stringify(report)}`);
      expect(result.cache.entries).toBeLessThanOrEqual(MAX_ENTRIES);
      expect(result.cache.retainedWeight).toBeLessThanOrEqual(MAX_RETAINED_ITEMS);
      expect(result.cache.misses).toBeGreaterThan(0);
      expect(result.structuralJsonBytes).toBeGreaterThan(0);
    },
  );
});
