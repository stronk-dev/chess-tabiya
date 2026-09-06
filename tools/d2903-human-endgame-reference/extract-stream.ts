// DISPOSABLE research harness — D2903. Not production code.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

import {
  humanEndgameSelectionKey,
  populationCapacity,
  selectHumanEndgameDecision,
  type HumanBand,
  type HumanEndgameDecision,
} from "./population.js";

const output = process.argv[2];
if (output === undefined) throw new TypeError("usage: extract-stream OUTPUT.json");

const EXPECTED_DECOMPRESSED = "89d444ea00e073ee17d6a02747a7c9da12fe49c949d5b407c9e0d0a60b7d81ea";
const LIMIT = 64;
const selected = new Map<HumanBand, HumanEndgameDecision[]>([[1400, []], [1800, []]]);
const eligible = new Map<HumanBand, number>([[1400, 0], [1800, 0]]);
const classCounts = { king: 0, nonKing: 0 };
const hash = createHash("sha256");
let bytes = 0;
let lines: string[] = [];
let blocks = 0;
let invalid = 0;

function retain(row: HumanEndgameDecision): void {
  if (row.speed !== "blitz") return;
  eligible.set(row.band, eligible.get(row.band)! + 1);
  classCounts[row.humanKingMove ? "king" : "nonKing"] += 1;
  const target = selected.get(row.band)!;
  target.push(row);
  target.sort((left, right) => humanEndgameSelectionKey(left).localeCompare(humanEndgameSelectionKey(right)));
  if (target.length > LIMIT) target.pop();
}

function consume(): void {
  if (lines.length === 0) return;
  blocks += 1;
  try {
    const row = selectHumanEndgameDecision(lines.join("\n"), blocks);
    if (row !== undefined) retain(row);
  } catch {
    invalid += 1;
  }
}

process.stdin.on("data", (chunk: Buffer) => {
  hash.update(chunk);
  bytes += chunk.byteLength;
});
const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of input) {
  if (line.startsWith("[Event ") && lines.length > 0) {
    consume();
    lines = [];
  }
  lines.push(line);
}
// The fixed HTTP range ends inside one compressed frame/game. Match D1329 by dropping its final
// partial PGN block rather than turning it into a negative observation.

const decompressedSha256 = hash.digest("hex");
if (decompressedSha256 !== EXPECTED_DECOMPRESSED) {
  throw new TypeError(`D2903 decompressed source drift ${decompressedSha256}`);
}
const rows = [...selected.values()].flat().sort((left, right) =>
  left.band - right.band || humanEndgameSelectionKey(left).localeCompare(humanEndgameSelectionKey(right)));
const capacity = populationCapacity(rows);
const result = Object.freeze({
  schema: "tabiya.research.d2903-human-endgame-population.v1",
  source: Object.freeze({
    url: "https://database.lichess.org/standard/lichess_db_standard_rated_2026-06.pgn.zst",
    license: "CC0",
    compressedRange: "bytes=0-268435455",
    compressedSha256: "sha256:399d79b546e045fa3e6706efddd723202c6b00a4c335398e5526c73114abff4d",
    decompressedSha256: `sha256:${decompressedSha256}`,
    decompressedBytes: bytes,
    completeBlocks: blocks,
    trailingPartialBlocksDropped: 1,
    invalid,
  }),
  selection: Object.freeze({ limitPerBand: LIMIT, eligibleByBand: Object.fromEntries(eligible), eligibleClassCounts: classCounts }),
  capacity,
  rows,
});
if (selected.get(1400)!.length !== LIMIT || selected.get(1800)!.length !== LIMIT) {
  throw new TypeError(`D2903 source cannot fill both bands: ${JSON.stringify(Object.fromEntries([...selected].map(([key, value]) => [key, value.length])))}`);
}
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
console.log(`D2903 expanded population: ${JSON.stringify(capacity)}; eligible=${JSON.stringify(Object.fromEntries(eligible))}`);
