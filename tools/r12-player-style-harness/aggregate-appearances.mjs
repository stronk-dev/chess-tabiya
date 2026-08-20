// DISPOSABLE research harness — platform-alignment R12. Not production code.
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";

const [input, metaPath, output] = process.argv.slice(2);
if (input === undefined || metaPath === undefined || output === undefined) {
  throw new Error("usage: node aggregate-appearances.mjs SORTED_TSV META_JSON OUTPUT_JSON");
}

const repeated = [];
let key;
let display;
let ratings = [];
let botObserved = false;

function finish() {
  if (key === undefined || ratings.length < 200) return;
  ratings.sort((a, b) => a - b);
  const mid = Math.floor(ratings.length / 2);
  const medianRating = ratings.length % 2 === 0
    ? (ratings[mid - 1] + ratings[mid]) / 2
    : ratings[mid];
  repeated.push({ key, username: display, appearances: ratings.length, medianRating, botObserved });
}

const lines = createInterface({ input: createReadStream(input), crlfDelay: Infinity });
for await (const line of lines) {
  const [nextKey, nextDisplay, rawRating, rawBot] = line.split("\t");
  if (nextKey !== key) {
    finish();
    key = nextKey;
    display = nextDisplay;
    ratings = [];
    botObserved = false;
  }
  ratings.push(Number(rawRating));
  botObserved ||= rawBot === "1";
}
finish();

const bands = [
  { id: "1000-1399", min: 1000, max: 1399 },
  { id: "1400-1799", min: 1400, max: 1799 },
  { id: "1800-2199", min: 1800, max: 2199 },
];
const candidates = bands.map((band) => ({
  band: band.id,
  accounts: repeated
    .filter((row) => !row.botObserved && row.medianRating >= band.min && row.medianRating <= band.max)
    .sort((a, b) => b.appearances - a.appearances || a.key.localeCompare(b.key))
    .slice(0, 24),
}));
const meta = JSON.parse(readFileSync(metaPath, "utf8"));
writeFileSync(output, `${JSON.stringify({ ...meta, accountsAtLeast200: repeated.length, candidates }, null, 2)}\n`);
console.log(JSON.stringify({
  ...meta,
  accountsAtLeast200: repeated.length,
  observedBotsAtLeast200: repeated.filter((row) => row.botObserved).length,
  candidates: candidates.map((band) => ({
    band: band.band,
    count: band.accounts.length,
    topAppearances: band.accounts[0]?.appearances,
  })),
}, null, 2));
