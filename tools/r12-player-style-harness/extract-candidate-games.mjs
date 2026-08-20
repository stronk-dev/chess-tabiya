// DISPOSABLE research harness — platform-alignment R12. Not production code.
import { createReadStream, createWriteStream, readFileSync } from "node:fs";
import { once } from "node:events";
import { createInterface } from "node:readline";

const [input, populationPath, statusPath, output] = process.argv.slice(2);
if ([input, populationPath, statusPath, output].some((value) => value === undefined)) {
  throw new Error("usage: node extract-candidate-games.mjs INPUT_PGN POPULATION_JSON STATUS_JSON OUTPUT_PGN");
}
const population = JSON.parse(readFileSync(populationPath, "utf8"));
const statuses = JSON.parse(readFileSync(statusPath, "utf8"));
const unavailable = new Set(statuses.filter((row) => row.title === "BOT" || row.closed).map((row) => row.id));
const candidates = new Set(population.candidates.flatMap((band) =>
  band.accounts
    .filter((account) => !unavailable.has(account.key))
    .map((account) => account.key)
));

const out = createWriteStream(output);
let headers = new Map();
let linesForGame = [];
let sawEvent = false;
let sawMoves = false;
let hasTenBlack = false;
let written = 0;

function value(line) {
  return line.slice(line.indexOf('"') + 1, line.lastIndexOf('"'));
}

async function finishGame() {
  if (!sawEvent || !sawMoves || !hasTenBlack) return;
  if (headers.get("Event") !== "Rated Blitz game") return;
  if (headers.has("Variant") && headers.get("Variant") !== "Standard") return;
  if (!["1-0", "0-1", "1/2-1/2"].includes(headers.get("Result"))) return;
  const white = (headers.get("White") ?? "").toLocaleLowerCase("en-US");
  const black = (headers.get("Black") ?? "").toLocaleLowerCase("en-US");
  if (!candidates.has(white) && !candidates.has(black)) return;
  const block = `${linesForGame.join("\n")}\n\n`;
  if (!out.write(block)) await once(out, "drain");
  written += 1;
}

const inputLines = createInterface({ input: createReadStream(input), crlfDelay: Infinity });
for await (const line of inputLines) {
  if (line.startsWith('[Event "')) {
    await finishGame();
    headers = new Map([["Event", value(line)]]);
    linesForGame = [line];
    sawEvent = true;
    sawMoves = false;
    hasTenBlack = false;
    continue;
  }
  if (!sawEvent) continue;
  linesForGame.push(line);
  if (!sawMoves && line.startsWith("[")) {
    const space = line.indexOf(" ");
    if (space > 1) headers.set(line.slice(1, space), value(line));
  } else if (!sawMoves && line === "") {
    sawMoves = true;
  } else if (sawMoves && !hasTenBlack && /(?:^|\s)10\.\.\./.test(line)) {
    hasTenBlack = true;
  }
}
// A partial trailing game is not emitted.
out.end();
await once(out, "close");
console.log(JSON.stringify({ candidates: candidates.size, written }));
