// DISPOSABLE research harness — D2903. Not production code.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { exactLegalMoves } from "../../packages/runtime/src/legal-moves.js";
import { populationCapacity, type HumanEndgameDecision } from "./population.js";

const [, , populationPath, outputDir] = process.argv;
if (populationPath === undefined || outputDir === undefined) {
  throw new TypeError("usage: prepare-provider-sets <population.json> <output-directory>");
}

const populationText = readFileSync(populationPath, "utf8");
const population = JSON.parse(populationText) as { readonly rows: readonly HumanEndgameDecision[] };
const capacity = populationCapacity(population.rows);
if (!capacity.preProviderSufficient || capacity.distinctGames !== 128 || capacity.band1400 !== 64 || capacity.band1800 !== 64) {
  throw new TypeError(`D2903 provider work refused by population capacity: ${JSON.stringify(capacity)}`);
}

const legalByFen = new Map<string, ReturnType<typeof exactLegalMoves>>();
for (const row of population.rows) {
  const legal = legalByFen.get(row.fen) ?? exactLegalMoves(row.fen);
  legalByFen.set(row.fen, legal);
  const human = legal.find((move) => move.uci === row.humanMoveUci);
  if (human === undefined) throw new TypeError(`D2903 human move ${row.humanMoveUci} is illegal at ${row.fen}`);
  if ((human.role === "king") !== row.humanKingMove) {
    throw new TypeError(`D2903 human move class drift at ${row.fen}`);
  }
}

mkdirSync(outputDir, { recursive: true });
const orderedFens = [...legalByFen.keys()].sort();
const tablebase = orderedFens.map((fen, index) => {
  const legal = legalByFen.get(fen)!;
  return Object.freeze({
    packId: `d2903-${String(index + 1).padStart(3, "0")}`,
    phase: "endgame",
    fen,
    pieceCount: population.rows.find((row) => row.fen === fen)!.pieceCount,
    legalUci: Object.freeze(legal.map((move) => move.uci)),
  });
});
writeFileSync(`${outputDir}/tablebase-probe-set.json`, `${JSON.stringify({ positions: tablebase }, null, 2)}\n`);

for (const band of [1400, 1800] as const) {
  const positions = [...new Set(population.rows.filter((row) => row.band === band).map((row) => row.fen))]
    .sort()
    .map((fen, index) => Object.freeze({
      fen,
      ply: population.rows.find((row) => row.fen === fen && row.band === band)!.ply,
      phase: "endgame",
      packId: `d2903-${String(band)}-${String(index + 1).padStart(3, "0")}`,
      legalCount: legalByFen.get(fen)!.length,
      startFen: fen,
      historyUci: Object.freeze([]),
    }));
  writeFileSync(`${outputDir}/maia-${String(band)}-probe-set.json`, `${JSON.stringify({ positions }, null, 2)}\n`);
}

console.log(`D2903 provider sets: games=${population.rows.length} uniqueFens=${orderedFens.length} band1400=${capacity.band1400} band1800=${capacity.band1800}`);
