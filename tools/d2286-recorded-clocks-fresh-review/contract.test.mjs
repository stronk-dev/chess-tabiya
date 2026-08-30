import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const rfc = read("rfc/recorded-clocks.md");
const original = rfc.replace(
  /\n## Fresh independent buildability return[\s\S]*?\n## Acceptance criteria/u,
  "\n## Acceptance criteria",
);
const register = read("rfc/README.md");
const liveSources = read("rfc/live-sources.md");
const runtime = read("packages/runtime/src/runtime.ts");
const service = read("apps/server/src/service.ts");
const storage = read("apps/server/src/storage.ts");

function clockCensus(path) {
  const games = read(path).split(/(?=^\[Event\s)/gmu).filter((block) => /^\[Event\s/mu.test(block));
  let readings = 0;
  let gamesWithReadings = 0;
  let gamesWithSimpleControl = 0;
  const readingsPerGame = [];
  for (const game of games) {
    const count = [...game.matchAll(/\[%clk\s+([^\]]+)\]/gu)].length;
    readings += count;
    readingsPerGame.push(count);
    if (count > 0) gamesWithReadings += 1;
    if (/^\[TimeControl "\d+\+\d+"\]$/mu.test(game)) gamesWithSimpleControl += 1;
  }
  return Object.freeze({
    games: games.length,
    readings,
    gamesWithReadings,
    gamesWithSimpleControl,
    minimumReadings: Math.min(...readingsPerGame),
    maximumReadings: Math.max(...readingsPerGame),
  });
}

const paste = clockCensus("tools/r2-selection-harness/imported-sample.pgn");
const finishedRound = clockCensus("tools/d947-broadcast-roundtrip-harness/fixtures/finished-round-QxNfeqHA.pgn");

test("the retained clock populations are measured at game and annotation grain", () => {
  assert.deepEqual(
    { games: paste.games, readings: paste.readings, gamesWithReadings: paste.gamesWithReadings, gamesWithSimpleControl: paste.gamesWithSimpleControl },
    { games: 108, readings: 6991, gamesWithReadings: 108, gamesWithSimpleControl: 108 },
  );
  assert.deepEqual(
    { games: finishedRound.games, readings: finishedRound.readings, gamesWithReadings: finishedRound.gamesWithReadings, gamesWithSimpleControl: finishedRound.gamesWithSimpleControl },
    { games: 10, readings: 902, gamesWithReadings: 9, gamesWithSimpleControl: 0 },
  );
  assert.ok(finishedRound.minimumReadings < finishedRound.maximumReadings, "a round total is not a selected-game fixture");
});

test("D2286: the RFC depends on a predecessor whose acceptance was withdrawn", () => {
  assert.match(original, /Depends on:\*\* `rfc\/live-sources\.md` \(accepted/u);
  assert.match(liveSources, /Status:\*\* draft — \*\*ACCEPTANCE WITHDRAWN/iu);
  assert.match(register, /`live-sources\.md` \| \*\*draft — ACCEPTANCE WITHDRAWN/u);
});

test("D2287: the storage handoff has ply identity but ClockReading drops it", () => {
  assert.match(liveSources, /clocks: readonly \{ readonly ply: number; readonly remaining: string \}\[\]/u);
  const clockReading = original.match(/export interface ClockReading \{[\s\S]*?\n\}/u)?.[0] ?? "";
  assert.doesNotMatch(clockReading, /\bply\b/u);
  assert.match(original, /readonly clocks: readonly ClockReading\[\] \| null/u);
});

test("D2288: no named operation projects stored readings onto imported nodes or a client view", () => {
  assert.doesNotMatch(original, /(?:function|operation|symbol):?\s+\w*(?:attach|project|hydrate|bind)\w*Clock/iu);
  assert.doesNotMatch(service, /ClockReading|recordedClock|clockReading/u);
  assert.doesNotMatch(storage, /remaining_ms|clocks_json|time_control/u);
});

test("D2289: the time-control domain has a serialization but no parser or refusal protocol", () => {
  assert.match(original, /canonically serialised [^\n]*initial\+increment/u);
  assert.doesNotMatch(original, /parseTimeControl|INVALID_TIME_CONTROL|unsupported_time_control|invalid_time_control/u);
  assert.doesNotMatch(original, /TimeControl[^\n]*(?:"-"|"\?"|multi-stage)/u);
});

test("D2290: arbitrary non-monotonic client timestamps are called learner spend", () => {
  assert.match(runtime, /function timestamp\(at\?: string\): string \{\s*return at \?\? new Date\(\)\.toISOString\(\);/u);
  assert.match(service, /for \(const move of parsed\.moves\)[\s\S]*?at: input\.createdAt/u);
  assert.match(original, /You spent 8 seconds here/u);
  assert.doesNotMatch(original, /monotonic|background tab|inactive|transport latency|think-time boundary/iu);
});

test("D2291: retroactivity names states but no idempotent transition that produces them", () => {
  assert.match(original, /null = not yet parsed; \[\] = parsed, none present/u);
  assert.match(original, /A game imported \*\*before\*\* this RFC lands yields readings/u);
  assert.doesNotMatch(original, /backfill command|lazy transaction|compare-and-swap|idempotency key|UPDATE imported_games/iu);
});

test("D2292: the landing gate depends on mutable private production rows", () => {
  assert.match(original, /Prevalence re-measured at landing[\s\S]*?real `imported_games` table/u);
  assert.match(original, /Fails if every row has clocks/u);
});

test("D2293: legacy junk is retained under a type that cannot represent it", () => {
  assert.match(original, /Node\.clockState\?: ClockReading/u);
  assert.match(original, /legacy junk `clockState`[\s\S]*?replays byte-identically/u);
  assert.doesNotMatch(original, /LegacyClockState|unknown legacy|parseClockReading|ClockStateQuarantine/u);
});

test("D2294: the single-game criterion is asserted with a whole-round count", () => {
  assert.equal(finishedRound.games, 10);
  assert.equal(finishedRound.gamesWithReadings, 9);
  assert.match(original, /Numbers: 902\s+readings/u);
  assert.ok(finishedRound.readings > finishedRound.maximumReadings);
});

test("D2295: the migration claim omits the persisted time-control column", () => {
  const claims = original.match(/```tabiya-claims[\s\S]*?```/u)?.[0] ?? "";
  assert.match(claims, /imported_games\.clocks/u);
  assert.doesNotMatch(claims, /timeControl|time_control/u);
  assert.match(original, /readonly timeControl: string \| null/u);
});
