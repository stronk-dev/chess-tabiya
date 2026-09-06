// DISPOSABLE research plumbing — D2237. Selects the exact FEN join consumed by the Maia leg.
import { readFileSync, writeFileSync } from "node:fs";

const [, , allPath, probePath, outPath] = process.argv;
if (allPath === undefined || probePath === undefined || outPath === undefined) {
  throw new TypeError("usage: select-sf-positions.mjs ALL_POSITIONS PROBE_SET OUTPUT");
}
const all = JSON.parse(readFileSync(allPath, "utf8")).positions;
const wanted = new Set(JSON.parse(readFileSync(probePath, "utf8")).positions.map(({ fen }) => fen));
const positions = all.filter(({ fen }) => wanted.has(fen));
if (positions.length !== wanted.size) {
  throw new TypeError(`FEN join incomplete: selected ${positions.length} of ${wanted.size}`);
}
writeFileSync(outPath, `${JSON.stringify({ positions }, null, 1)}\n`);
process.stdout.write(`stockfish positions=${positions.length}\n`);
