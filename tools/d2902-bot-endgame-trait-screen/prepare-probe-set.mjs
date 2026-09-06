// DISPOSABLE research harness — D2902. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) throw new TypeError("usage: prepare-probe-set <tablebase.jsonl> <output.json>");

const rows = readFileSync(inputPath, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
const complete = rows.filter((row) => Array.isArray(row.moves));
const failed = rows.filter((row) => !Array.isArray(row.moves));
if (rows.length !== 257 || complete.length !== 196 || failed.length !== 61) {
  throw new TypeError(`D2902 population drift: rows=${rows.length} complete=${complete.length} failed=${failed.length}`);
}
const fens = new Set(complete.map((row) => row.fen));
if (fens.size !== complete.length) throw new TypeError("D2902 complete population contains duplicate FENs");

const positions = complete.map((row) => ({
  fen: row.fen,
  ply: 0,
  phase: "endgame",
  packId: row.packId,
  legalCount: row.legalCount,
  startFen: row.fen,
  historyUci: [],
}));
writeFileSync(outputPath, `${JSON.stringify({ positions }, null, 2)}\n`);
console.log(`D2902 probe population: ${positions.length} complete; ${failed.length} typed historical failures retained`);
