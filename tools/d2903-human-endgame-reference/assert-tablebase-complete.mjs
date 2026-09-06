// DISPOSABLE research harness — D2903. Not production code.
import { readFileSync } from "node:fs";

const [, , probeSetPath, outputPath] = process.argv;
if (probeSetPath === undefined || outputPath === undefined) {
  throw new TypeError("usage: assert-tablebase-complete <probe-set.json> <tablebase.jsonl>");
}

const expected = new Set(JSON.parse(readFileSync(probeSetPath, "utf8")).positions.map((row) => row.fen));
const rows = readFileSync(outputPath, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
const complete = rows.filter((row) => Array.isArray(row.moves));
const completeFens = new Set(complete.map((row) => row.fen));
if (completeFens.size !== complete.length) throw new TypeError("D2903 duplicate successful tablebase page");
if ([...completeFens].some((fen) => !expected.has(fen))) throw new TypeError("D2903 foreign tablebase FEN");
const missing = [...expected].filter((fen) => !completeFens.has(fen));
console.log(`D2903 tablebase pages: complete=${completeFens.size}/${expected.size} failedAttempts=${rows.length - complete.length}`);
if (missing.length > 0) process.exitCode = 1;
