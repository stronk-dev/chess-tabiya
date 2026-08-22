#!/usr/bin/env node

import fs from "node:fs";

const [probeSetPath, sanMapPath, stockfishPath, outputPath] = process.argv.slice(2);
if (!outputPath) {
  throw new Error(
    "usage: node analyze.mjs PROBE_SET SAN_MAP STOCKFISH_JSONL OUTPUT_JSON",
  );
}

const probeSet = JSON.parse(fs.readFileSync(probeSetPath, "utf8"));
const sanMap = JSON.parse(fs.readFileSync(sanMapPath, "utf8"));
const stockfishRows = fs
  .readFileSync(stockfishPath, "utf8")
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));
const stockfishErrors = stockfishRows.filter((row) => row.error);
const usableStockfishRows = stockfishRows.filter((row) => !row.error);
const stockfish = new Map(usableStockfishRows.map((row) => [row.fen, row]));

function engineScore(entry) {
  if (entry.mate == null) return entry.cp;
  return Math.sign(entry.mate) * (100_000 - 100 * Math.abs(entry.mate));
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pearson(xs, ys) {
  const mx = mean(xs);
  const my = mean(ys);
  let numerator = 0;
  let dx = 0;
  let dy = 0;
  for (let index = 0; index < xs.length; index += 1) {
    const x = xs[index] - mx;
    const y = ys[index] - my;
    numerator += x * y;
    dx += x * x;
    dy += y * y;
  }
  return dx && dy ? numerator / Math.sqrt(dx * dy) : null;
}

function ranks(values) {
  const ordered = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const out = Array(values.length);
  for (let start = 0; start < ordered.length; ) {
    let end = start + 1;
    while (end < ordered.length && ordered[end].value === ordered[start].value) end += 1;
    const rank = (start + end - 1) / 2 + 1;
    for (let index = start; index < end; index += 1) out[ordered[index].index] = rank;
    start = end;
  }
  return out;
}

function spearman(xs, ys) {
  return pearson(ranks(xs), ranks(ys));
}

function quantile(values, fraction) {
  const ordered = [...values].sort((a, b) => a - b);
  const index = (ordered.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return ordered[lower];
  return ordered[lower] + (ordered[upper] - ordered[lower]) * (index - lower);
}

const positions = [];
const cells = [];
const unresolvedSan = [];
let zeroExplorerCells = 0;
function normalizeUci(uci) {
  return {
    e1h1: "e1g1",
    e1a1: "e1c1",
    e8h8: "e8g8",
    e8a8: "e8c8",
  }[uci] ?? uci;
}
for (const position of probeSet.positions) {
  const sf = stockfish.get(position.fen);
  if (!sf) continue;
  const scored = sf.entries.map((entry) => ({ uci: entry.uci, score: engineScore(entry) }));
  const best = Math.max(...scored.map((entry) => entry.score));
  const losses = scored.map((entry) => best - entry.score).sort((a, b) => a - b);
  const positionMetrics = {
    fen: position.fen,
    packId: position.packId,
    phase: position.phase,
    ply: position.ply,
    legalMoves: losses.length,
    bestSecondGapCp: losses[1] ?? 0,
    legalSevereFraction250: losses.filter((loss) => loss >= 250).length / losses.length,
    legalNearBestFraction50: losses.filter((loss) => loss <= 50).length / losses.length,
    medianLegalLossCp: quantile(losses, 0.5),
    p90LegalLossCp: quantile(losses, 0.9),
  };
  positions.push(positionMetrics);
  const lossByUci = new Map(scored.map((entry) => [entry.uci, best - entry.score]));
  const bestUci = new Set(scored.filter((entry) => entry.score === best).map((entry) => entry.uci));

  for (const [band, reading] of Object.entries(position.bands)) {
    if (!(reading.total > 0)) {
      zeroExplorerCells += 1;
      continue;
    }
    let mappedGames = 0;
    let severeGames = 0;
    let expectedLossNumerator = 0;
    let bestGames = 0;
    for (const move of reading.moves) {
      const uci = normalizeUci(sanMap[position.fen]?.[move.san]);
      if (!uci || !lossByUci.has(uci)) {
        unresolvedSan.push({ fen: position.fen, band, san: move.san });
        continue;
      }
      const loss = lossByUci.get(uci);
      mappedGames += move.n;
      if (loss >= 250) severeGames += move.n;
      expectedLossNumerator += move.n * loss;
      if (bestUci.has(uci)) bestGames += move.n;
    }
    cells.push({
      ...positionMetrics,
      band: Number(band),
      explorerTotal: reading.total,
      mappedGames,
      mappedCoverage: mappedGames / reading.total,
      severeMassLowerBound: severeGames / reading.total,
      severeMassWithinListed: mappedGames ? severeGames / mappedGames : null,
      expectedLossWithinListedCp: mappedGames ? expectedLossNumerator / mappedGames : null,
      engineBestMassLowerBound: bestGames / reading.total,
    });
  }
}

const featureNames = [
  "bestSecondGapCp",
  "legalSevereFraction250",
  "legalNearBestFraction50",
  "medianLegalLossCp",
  "p90LegalLossCp",
];
const targetNames = [
  "severeMassLowerBound",
  "severeMassWithinListed",
  "expectedLossWithinListedCp",
  "engineBestMassLowerBound",
];

function correlations(rows) {
  const result = {};
  for (const feature of featureNames) {
    result[feature] = {};
    for (const target of targetNames) {
      const usable = rows.filter(
        (row) => Number.isFinite(row[feature]) && Number.isFinite(row[target]),
      );
      const xs = usable.map((row) => row[feature]);
      const ys = usable.map((row) => row[target]);
      result[feature][target] = {
        n: usable.length,
        pearson: pearson(xs, ys),
        spearman: spearman(xs, ys),
      };
    }
  }
  return result;
}

function quartileContrast(rows, feature, target) {
  const usable = rows
    .filter((row) => Number.isFinite(row[feature]) && Number.isFinite(row[target]))
    .sort((a, b) => a[feature] - b[feature]);
  const size = Math.floor(usable.length / 4);
  const low = usable.slice(0, size);
  const high = usable.slice(-size);
  return {
    nPerQuartile: size,
    lowFeatureMedian: quantile(low.map((row) => row[feature]), 0.5),
    highFeatureMedian: quantile(high.map((row) => row[feature]), 0.5),
    lowTargetMedian: quantile(low.map((row) => row[target]), 0.5),
    highTargetMedian: quantile(high.map((row) => row[target]), 0.5),
  };
}

const byBand = Object.fromEntries(
  [1400, 1600, 1800].map((band) => [band, correlations(cells.filter((row) => row.band === band))]),
);
const byPhase = Object.fromEntries(
  [...new Set(positions.map((row) => row.phase))].sort().map((phase) => [
    phase,
    {
      positions: positions.filter((row) => row.phase === phase).length,
      cells: cells.filter((row) => row.phase === phase).length,
      correlations: correlations(cells.filter((row) => row.phase === phase)),
    },
  ]),
);

const report = {
  method: {
    sourcePositions: probeSet.positions.length,
    stockfishPositions: stockfish.size,
    joinedPositions: positions.length,
    cells: cells.length,
    bands: [1400, 1600, 1800],
    stockfishDepth: 12,
    severeThresholdCp: 250,
    nearBestThresholdCp: 50,
    humanMassNote:
      "Explorer exposes its listed moves plus a total. Lower-bound mass uses the full total; within-listed metrics condition on mapped listed moves. Unlisted moves are never assigned an engine score.",
  },
  checks: {
    unresolvedSanRows: unresolvedSan.length,
    zeroExplorerCells,
    stockfishErrorRows: stockfishErrors.length,
    duplicateStockfishFens: usableStockfishRows.length - stockfish.size,
    reachedDepth12: [...stockfish.values()].filter((row) => row.reachedDepth >= 12).length,
    mappedCoverage: {
      min: Math.min(...cells.map((row) => row.mappedCoverage)),
      median: quantile(cells.map((row) => row.mappedCoverage), 0.5),
      max: Math.max(...cells.map((row) => row.mappedCoverage)),
    },
  },
  positionDistributions: Object.fromEntries(
    featureNames.map((feature) => [
      feature,
      {
        min: Math.min(...positions.map((row) => row[feature])),
        q25: quantile(positions.map((row) => row[feature]), 0.25),
        median: quantile(positions.map((row) => row[feature]), 0.5),
        q75: quantile(positions.map((row) => row[feature]), 0.75),
        max: Math.max(...positions.map((row) => row[feature])),
      },
    ]),
  ),
  pooledCorrelations: correlations(cells),
  pooledQuartileContrasts: {
    legalSevereFraction250_to_severeMassLowerBound: quartileContrast(
      cells,
      "legalSevereFraction250",
      "severeMassLowerBound",
    ),
    legalNearBestFraction50_to_severeMassLowerBound: quartileContrast(
      cells,
      "legalNearBestFraction50",
      "severeMassLowerBound",
    ),
  },
  byBand,
  byPhase,
};

fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
