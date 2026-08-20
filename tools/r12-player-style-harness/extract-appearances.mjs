// DISPOSABLE research harness — platform-alignment R12. Not production code.
import { createReadStream, createWriteStream, writeFileSync } from "node:fs";
import { once } from "node:events";
import { createInterface } from "node:readline";

const [input, output, metaPath] = process.argv.slice(2);
if (input === undefined || output === undefined || metaPath === undefined) {
  throw new Error("usage: node extract-appearances.mjs INPUT_PGN OUTPUT_TSV META_JSON");
}

const out = createWriteStream(output);
let headers = new Map();
let sawEvent = false;
let sawMoves = false;
let hasTenBlack = false;
let completeGames = 0;
let eligibleBlitzGames = 0;
let firstUtc;
let lastUtc;

function value(line) {
  return line.slice(line.indexOf('"') + 1, line.lastIndexOf('"'));
}

async function emit(line) {
  if (!out.write(line)) await once(out, "drain");
}

async function finishGame() {
  if (!sawEvent || !sawMoves) return;
  completeGames += 1;
  const utc = `${headers.get("UTCDate") ?? headers.get("Date") ?? ""}T${headers.get("UTCTime") ?? ""}`;
  firstUtc ??= utc;
  lastUtc = utc;
  if (headers.get("Event") !== "Rated Blitz game") return;
  if (headers.has("Variant") && headers.get("Variant") !== "Standard") return;
  if (!["1-0", "0-1", "1/2-1/2"].includes(headers.get("Result"))) return;
  if (!/^\d+$/.test(headers.get("WhiteElo") ?? "") || !/^\d+$/.test(headers.get("BlackElo") ?? "")) return;
  if (!hasTenBlack) return;
  eligibleBlitzGames += 1;
  for (const color of ["White", "Black"]) {
    const username = headers.get(color);
    if (username === undefined || username === "?") continue;
    await emit(`${username.toLocaleLowerCase("en-US")}\t${username}\t${headers.get(`${color}Elo`)}\t${headers.get(`${color}Title`) === "BOT" ? 1 : 0}\n`);
  }
}

const lines = createInterface({ input: createReadStream(input), crlfDelay: Infinity });
for await (const line of lines) {
  if (line.startsWith('[Event "')) {
    await finishGame();
    headers = new Map([["Event", value(line)]]);
    sawEvent = true;
    sawMoves = false;
    hasTenBlack = false;
    continue;
  }
  if (!sawMoves && line.startsWith("[")) {
    const space = line.indexOf(" ");
    if (space > 1) headers.set(line.slice(1, space), value(line));
  } else if (!sawMoves && line === "" && sawEvent) {
    sawMoves = true;
  } else if (sawMoves && !hasTenBlack && /(?:^|\s)10\.\.\./.test(line)) {
    hasTenBlack = true;
  }
}
// The trailing record may be a truncated Zstandard frame and is deliberately not emitted.
out.end();
await once(out, "close");
writeFileSync(metaPath, `${JSON.stringify({ completeGames, eligibleBlitzGames, firstUtc, lastUtc })}\n`);
console.log(JSON.stringify({ completeGames, eligibleBlitzGames, firstUtc, lastUtc }, null, 2));
