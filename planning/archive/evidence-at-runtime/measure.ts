import { makeFen, parseFen } from "../../apps/server/node_modules/chessops/dist/esm/fen.js";
import { Chess } from "../../apps/server/node_modules/chessops/dist/esm/chess.js";
import { parseUci } from "../../apps/server/node_modules/chessops/dist/esm/util.js";

import { createRun, transposeKey, type RecordedReading } from "../../packages/runtime/src/index.js";
import type { DrillPackDefinition, SpineNode } from "../../packages/schema/src/drill-pack/index.js";

import { PackRegistry } from "../../apps/server/src/pack-registry.js";
import { evidencePacket } from "../../apps/server/src/guidance.js";

function board(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function spinePositions(pack: DrillPackDefinition): readonly Chess[] {
  const positions: Chess[] = [board(pack.start.fen)];
  const walk = (nodes: readonly SpineNode[], parent: Chess): void => {
    for (const node of nodes) {
      const next = parent.clone();
      const move = parseUci(node.moveUci);
      if (move === undefined || !next.isLegal(move)) throw new TypeError(`${pack.id}: illegal authored move ${node.moveUci}`);
      next.play(move);
      positions.push(next.clone());
      walk(node.children, next);
    }
  };
  walk(pack.spine ?? [], positions[0]!.clone());
  return positions;
}

function legalSuccessors(position: Chess): readonly Chess[] {
  const values: Chess[] = [];
  for (const [from, destinations] of position.allDests()) for (const to of destinations) {
    const piece = position.board.get(from);
    const promotions = piece?.role === "pawn" && (to < 8 || to >= 56)
      ? ["queen", "rook", "bishop", "knight"] as const
      : [undefined] as const;
    for (const promotion of promotions) {
      const next = position.clone();
      next.play({ from, to, ...(promotion === undefined ? {} : { promotion }) });
      values.push(next);
    }
  }
  return values;
}

function clock(fen: string): string | undefined {
  return fen.trim().split(/\s+/u)[4];
}

const registry = await PackRegistry.loadDefault({ development: true });
const indexed = registry.list().map((summary) => registry.required(summary.id)).filter((record) => record.positionEvidence.size > 0);
let readingCount = 0, indexEntries = 0, spineCount = 0, legalMoves = 0, perPackDistinctSuccessors = 0, authoredSuccessors = 0, uncovered = 0, tablebaseArrivals = 0, tablebaseClockRefusals = 0;
const corpusPositions = new Set<string>(), corpusSuccessors = new Set<string>();

for (const record of indexed) {
  const allReadings = [...record.positionEvidence.values()].flat();
  readingCount += allReadings.length;
  indexEntries += record.positionEvidence.size;
  for (const key of record.positionEvidence.keys()) corpusPositions.add(key);
  const startKey = transposeKey(record.document.start.fen);
  authoredSuccessors += record.positionEvidence.size - (record.positionEvidence.has(startKey) ? 1 : 0);
  const successorKeys = new Set<string>();
  for (const position of spinePositions(record.document)) {
    spineCount += 1;
    const successors = legalSuccessors(position);
    legalMoves += [...position.allDests().values()].reduce((sum, destinations) => sum + destinations.size(), 0);
    for (const successor of successors) {
      const fen = makeFen(successor.toSetup()), key = transposeKey(fen);
      successorKeys.add(key); corpusSuccessors.add(key);
      const tablebase = (record.positionEvidence.get(key) ?? []).filter((reading): reading is Extract<RecordedReading, { kind: "tablebase_result" }> => reading.kind === "tablebase_result");
      if (tablebase.length > 0) {
        tablebaseArrivals += 1;
        if (!tablebase.some((reading) => clock(reading.fen) === clock(fen))) tablebaseClockRefusals += 1;
      }
    }
  }
  perPackDistinctSuccessors += successorKeys.size;
  uncovered += [...successorKeys].filter((key) => !record.positionEvidence.has(key)).length;
}

function median(values: readonly number[]): number {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
}

const benchmarkRecord = indexed[0]!;
const benchmarkReading = [...benchmarkRecord.positionEvidence.values()][0]![0]!;
const benchmarkRun = createRun({
  id: "recorded-reading-benchmark",
  packId: benchmarkRecord.document.id,
  packDigest: benchmarkRecord.digest,
  startFen: benchmarkReading.fen,
  seed: 1,
  createdAt: "2026-08-16T00:00:00.000Z",
  policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
});
const benchmarkNode = benchmarkRun.nodes[0]!;
const benchmark = (withReadings: boolean): number => {
  let consumed = 0;
  const started = performance.now();
  for (let index = 0; index < 100; index += 1) consumed += evidencePacket({
    run: benchmarkRun,
    node: benchmarkNode,
    pack: benchmarkRecord.document,
    ...(withReadings ? { packEvidence: benchmarkRecord.positionEvidence } : {}),
    authored: { items: [], hasWithheldAuthoredContent: false },
  }).readings.length;
  if (consumed < 0) throw new TypeError("unreachable benchmark accumulator");
  return performance.now() - started;
};
benchmark(false); benchmark(true);
const baselineSamples = Array.from({ length: 7 }, () => benchmark(false));
const indexedSamples = Array.from({ length: 7 }, () => benchmark(true));
const baselineMedianMs = median(baselineSamples);
const indexedMedianMs = median(indexedSamples);

console.log(JSON.stringify({
  registryDocuments: registry.list().length,
  indexedPacks: indexed.length,
  readings: readingCount,
  perPackIndexEntries: indexEntries,
  corpusDistinctPositions: corpusPositions.size,
  spinePositions: spineCount,
  legalMoves,
  perPackDistinctSuccessors,
  corpusDistinctSuccessors: corpusSuccessors.size,
  authoredSuccessorPositions: authoredSuccessors,
  uncoveredSuccessorPositions: uncovered,
  tablebaseArrivals,
  tablebaseClockRefusals,
  packetConstruction: {
    iterationsPerSample: 100,
    baselineMedianMs,
    indexedMedianMs,
    deltaMicrosecondsPerPacket: ((indexedMedianMs - baselineMedianMs) * 1_000) / 100,
  },
}, null, 2));
