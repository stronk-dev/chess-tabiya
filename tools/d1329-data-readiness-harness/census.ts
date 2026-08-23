// DISPOSABLE research harness — D1329. Aggregate-only PGN census; no model fitting.
import { createHash } from "node:crypto";
import { createReadStream, statSync } from "node:fs";
import { createInterface } from "node:readline";

import { Chess } from "chessops/chess";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";

export const SOURCE = {
  license: "CC0",
  month: "2026-06",
  url: "https://database.lichess.org/standard/lichess_db_standard_rated_2026-06.pgn.zst",
  advertisedCompressedBytes: 28_241_946_492,
} as const;

type Speed = "bullet" | "blitz" | "rapid" | "other";
type RatingBand = "under-1000" | "1000-1399" | "1400-1799" | "1800-2199" | "2200-2599" | "2600-plus" | "missing";
type Window = "opening-8-16" | "middlegame-17-40" | "late-41-plus";

export interface CensusResult {
  readonly schema: "tabiya.research.d1329-data-readiness.v1";
  readonly source: typeof SOURCE & {
    readonly compressedPrefixSha256: string;
    readonly compressedPrefixBytes: number;
    readonly decompressedPrefixSha256: string;
    readonly decompressedPrefixBytes: number;
    readonly trailingPartialBlocksDropped: number;
  };
  readonly games: {
    readonly completeBlocks: number;
    readonly parsed: number;
    readonly eligible: number;
    readonly legalReplay: number;
    readonly illegalReplay: number;
    readonly excludedBots: number;
    readonly excludedUnfinished: number;
    readonly excludedVariant: number;
    readonly missingRating: number;
    readonly missingTimeControl: number;
    readonly firstUtc: string | null;
    readonly lastUtc: string | null;
  };
  readonly decisions: {
    readonly eligible: number;
    readonly withRating: number;
    readonly withTimeControl: number;
    readonly withClock: number;
    readonly byCell: Readonly<Record<string, number>>;
    readonly clockCoverage: number;
    readonly ratingCoverage: number;
    readonly timeControlCoverage: number;
  };
}

function sha256(value: string | Uint8Array): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function speedOf(event: string): Speed {
  if (/Bullet/iu.test(event)) return "bullet";
  if (/Blitz/iu.test(event)) return "blitz";
  if (/Rapid/iu.test(event)) return "rapid";
  return "other";
}

function ratingBand(value: number | undefined): RatingBand {
  if (value === undefined || !Number.isFinite(value)) return "missing";
  if (value < 1000) return "under-1000";
  if (value <= 1399) return "1000-1399";
  if (value <= 1799) return "1400-1799";
  if (value <= 2199) return "1800-2199";
  if (value <= 2599) return "2200-2599";
  return "2600-plus";
}

function windowOf(ply: number): Window | undefined {
  if (ply >= 8 && ply <= 16) return "opening-8-16";
  if (ply >= 17 && ply <= 40) return "middlegame-17-40";
  if (ply >= 41) return "late-41-plus";
  return undefined;
}

function numberHeader(value: string | undefined): number | undefined {
  if (value === undefined || !/^\d+$/u.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function increment(target: Map<string, number>, key: string): void {
  target.set(key, (target.get(key) ?? 0) + 1);
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

export function censusPgn(
  text: string,
  compressedPrefix: Uint8Array,
  trailingPartialBlocksDropped = 1,
): CensusResult {
  const blocks = text.split(/\n(?=\[Event )/u);
  if (trailingPartialBlocksDropped > 0) blocks.splice(-trailingPartialBlocksDropped);

  let parsed = 0;
  let eligible = 0;
  let legalReplay = 0;
  let illegalReplay = 0;
  let excludedBots = 0;
  let excludedUnfinished = 0;
  let excludedVariant = 0;
  let missingRating = 0;
  let missingTimeControl = 0;
  let eligibleDecisions = 0;
  let decisionsWithRating = 0;
  let decisionsWithTimeControl = 0;
  let decisionsWithClock = 0;
  let firstUtc: string | null = null;
  let lastUtc: string | null = null;
  const byCell = new Map<string, number>();

  for (const block of blocks) {
    const [game] = parsePgn(block);
    if (game === undefined) continue;
    parsed += 1;
    const headers = game.headers;
    const utcDate = headers.get("UTCDate") ?? headers.get("Date");
    const utcTime = headers.get("UTCTime") ?? "??:??:??";
    if (utcDate !== undefined) {
      const stamp = `${utcDate}T${utcTime}`;
      if (firstUtc === null || stamp < firstUtc) firstUtc = stamp;
      if (lastUtc === null || stamp > lastUtc) lastUtc = stamp;
    }
    if (headers.get("Result") === "*" || headers.get("Result") === undefined) {
      excludedUnfinished += 1;
      continue;
    }
    const variant = headers.get("Variant") ?? "Standard";
    if (variant !== "Standard" && variant !== "From Position") {
      excludedVariant += 1;
      continue;
    }
    if (headers.get("WhiteTitle") === "BOT" || headers.get("BlackTitle") === "BOT") {
      excludedBots += 1;
      continue;
    }

    const whiteRating = numberHeader(headers.get("WhiteElo"));
    const blackRating = numberHeader(headers.get("BlackElo"));
    const timeControl = headers.get("TimeControl");
    if (whiteRating === undefined || blackRating === undefined) missingRating += 1;
    if (timeControl === undefined || timeControl === "-") missingTimeControl += 1;

    const clockCount = [...block.matchAll(/\[%clk\s+[^\]]+\]/gu)].length;
    const position = startingPosition(headers).unwrap() as Chess;
    const rows: { ply: number; moverRating: number | undefined; hasClock: boolean }[] = [];
    let ply = 0;
    let legal = true;
    for (const data of game.moves.mainline()) {
      const move = parseSan(position, data.san);
      if (move === undefined || !position.isLegal(move)) {
        legal = false;
        break;
      }
      ply += 1;
      rows.push({
        ply,
        moverRating: position.turn === "white" ? whiteRating : blackRating,
        hasClock: ply <= clockCount,
      });
      position.play(move);
    }
    if (!legal) {
      illegalReplay += 1;
      continue;
    }
    legalReplay += 1;
    eligible += 1;
    const speed = speedOf(headers.get("Event") ?? "");
    for (const row of rows) {
      const window = windowOf(row.ply);
      if (window === undefined) continue;
      eligibleDecisions += 1;
      if (row.moverRating !== undefined) decisionsWithRating += 1;
      if (timeControl !== undefined && timeControl !== "-") decisionsWithTimeControl += 1;
      if (row.hasClock) decisionsWithClock += 1;
      increment(byCell, `${ratingBand(row.moverRating)}/${speed}/${window}/standard`);
    }
  }

  return {
    schema: "tabiya.research.d1329-data-readiness.v1",
    source: {
      ...SOURCE,
      compressedPrefixSha256: sha256(compressedPrefix),
      compressedPrefixBytes: compressedPrefix.byteLength,
      decompressedPrefixSha256: sha256(text),
      decompressedPrefixBytes: Buffer.byteLength(text),
      trailingPartialBlocksDropped,
    },
    games: {
      completeBlocks: blocks.length,
      parsed,
      eligible,
      legalReplay,
      illegalReplay,
      excludedBots,
      excludedUnfinished,
      excludedVariant,
      missingRating,
      missingTimeControl,
      firstUtc,
      lastUtc,
    },
    decisions: {
      eligible: eligibleDecisions,
      withRating: decisionsWithRating,
      withTimeControl: decisionsWithTimeControl,
      withClock: decisionsWithClock,
      byCell: Object.fromEntries([...byCell].sort(([left], [right]) => left.localeCompare(right))),
      clockCoverage: round(decisionsWithClock / Math.max(1, eligibleDecisions)),
      ratingCoverage: round(decisionsWithRating / Math.max(1, eligibleDecisions)),
      timeControlCoverage: round(decisionsWithTimeControl / Math.max(1, eligibleDecisions)),
    },
  };
}

async function hashFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return `sha256:${hash.digest("hex")}`;
}

function addRecord(target: Record<string, number>, source: Readonly<Record<string, number>>): void {
  for (const [key, value] of Object.entries(source)) target[key] = (target[key] ?? 0) + value;
}

/** Stream a partial dump without retaining any game, move, position, or player identity. */
export async function censusPgnFiles(pgnPath: string, compressedPath: string): Promise<CensusResult> {
  const games = {
    completeBlocks: 0,
    parsed: 0,
    eligible: 0,
    legalReplay: 0,
    illegalReplay: 0,
    excludedBots: 0,
    excludedUnfinished: 0,
    excludedVariant: 0,
    missingRating: 0,
    missingTimeControl: 0,
    firstUtc: null as string | null,
    lastUtc: null as string | null,
  };
  const decisions = {
    eligible: 0,
    withRating: 0,
    withTimeControl: 0,
    withClock: 0,
    byCell: {} as Record<string, number>,
  };
  const input = createInterface({ input: createReadStream(pgnPath, { encoding: "utf8" }), crlfDelay: Infinity });
  let lines: string[] = [];
  const consume = (): void => {
    if (lines.length === 0) return;
    const one = censusPgn(`${lines.join("\n")}\n[Event "partial"]\n`, new Uint8Array());
    games.completeBlocks += one.games.completeBlocks;
    games.parsed += one.games.parsed;
    games.eligible += one.games.eligible;
    games.legalReplay += one.games.legalReplay;
    games.illegalReplay += one.games.illegalReplay;
    games.excludedBots += one.games.excludedBots;
    games.excludedUnfinished += one.games.excludedUnfinished;
    games.excludedVariant += one.games.excludedVariant;
    games.missingRating += one.games.missingRating;
    games.missingTimeControl += one.games.missingTimeControl;
    if (one.games.firstUtc !== null && (games.firstUtc === null || one.games.firstUtc < games.firstUtc)) games.firstUtc = one.games.firstUtc;
    if (one.games.lastUtc !== null && (games.lastUtc === null || one.games.lastUtc > games.lastUtc)) games.lastUtc = one.games.lastUtc;
    decisions.eligible += one.decisions.eligible;
    decisions.withRating += one.decisions.withRating;
    decisions.withTimeControl += one.decisions.withTimeControl;
    decisions.withClock += one.decisions.withClock;
    addRecord(decisions.byCell, one.decisions.byCell);
  };
  for await (const line of input) {
    if (line.startsWith("[Event ") && lines.length > 0) {
      consume();
      lines = [];
    }
    lines.push(line);
  }
  // The range ends inside a Zstandard frame. The last PGN block is deliberately not consumed.

  return {
    schema: "tabiya.research.d1329-data-readiness.v1",
    source: {
      ...SOURCE,
      compressedPrefixSha256: await hashFile(compressedPath),
      compressedPrefixBytes: statSync(compressedPath).size,
      decompressedPrefixSha256: await hashFile(pgnPath),
      decompressedPrefixBytes: statSync(pgnPath).size,
      trailingPartialBlocksDropped: lines.length > 0 ? 1 : 0,
    },
    games,
    decisions: {
      ...decisions,
      byCell: Object.fromEntries(Object.entries(decisions.byCell).sort(([left], [right]) => left.localeCompare(right))),
      clockCoverage: round(decisions.withClock / Math.max(1, decisions.eligible)),
      ratingCoverage: round(decisions.withRating / Math.max(1, decisions.eligible)),
      timeControlCoverage: round(decisions.withTimeControl / Math.max(1, decisions.eligible)),
    },
  };
}
