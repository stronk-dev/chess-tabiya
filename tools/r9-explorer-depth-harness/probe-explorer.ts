// DISPOSABLE research harness — R9 (planning/exploration/plan.md).
// Not production code. Queries the Lichess opening explorer through the repo's own
// runtime query surface (`normalizedCorpusQuery` + `corpusUrl` from
// apps/server/src/corpus.ts) and keeps the RAW result counts, including below the
// shipped 100-game abstention floor, because the floor is one of the things R9 measures.
//
// Politeness: strictly one request at a time, a fixed inter-request delay, and a 60 s
// wait after any 429/5xx (four attempts), per the Lichess explorer etiquette the
// sourcing client already follows (apps/server/src/sourcing/explorer.ts:116-125).
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

import { corpusUrl, normalizedCorpusQuery, type CorpusQuery } from "../../apps/server/src/corpus.js";
import type { RatingGroup, Speed } from "../../apps/server/src/sourcing/explorer.js";

interface Position {
  readonly packId: string;
  readonly phase: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
  readonly ply: number;
  readonly spineDepth: number;
  readonly mainLine: boolean;
  readonly nextSan: string | null;
  readonly nextUci: string | null;
}

const UA = "chess-tabiya-sourcing/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)";
const sleep = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

interface RawExplorer {
  readonly white: number;
  readonly draws: number;
  readonly black: number;
  readonly moves: readonly { readonly san: string; readonly uci: string; readonly white: number; readonly draws: number; readonly black: number; readonly averageRating: number }[];
  readonly history: readonly { readonly month: string; readonly white: number; readonly draws: number; readonly black: number }[];
}

async function fetchRaw(url: string, token: string, delayMs: number): Promise<{ status: number; raw?: RawExplorer; ms: number }> {
  const waits = [60_000, 60_000, 120_000, 240_000];
  for (let attempt = 0; ; attempt += 1) {
    const started = Date.now();
    const response = await fetch(url, { headers: { authorization: `Bearer ${token}`, "user-agent": UA } });
    const ms = Date.now() - started;
    if ((response.status === 429 || response.status >= 500) && attempt < waits.length) {
      process.stderr.write(`  HTTP ${response.status} — waiting ${waits[attempt]! / 1000}s\n`);
      await sleep(waits[attempt]!);
      continue;
    }
    if (response.status !== 200) return { status: response.status, ms };
    const body = (await response.json()) as Record<string, unknown>;
    await sleep(delayMs);
    return {
      status: 200,
      ms,
      raw: {
        white: Number(body.white),
        draws: Number(body.draws),
        black: Number(body.black),
        moves: Array.isArray(body.moves)
          ? body.moves.map((m) => {
              const v = m as Record<string, unknown>;
              return { san: String(v.san), uci: String(v.uci), white: Number(v.white), draws: Number(v.draws), black: Number(v.black), averageRating: Number(v.averageRating) };
            })
          : [],
        history: Array.isArray(body.history)
          ? body.history.map((h) => {
              const v = h as Record<string, unknown>;
              return { month: String(v.month ?? v.date), white: Number(v.white), draws: Number(v.draws), black: Number(v.black) };
            })
          : [],
      },
    };
  }
}

async function main(): Promise<void> {
  const positionsPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  // "1400,1600" = two separate single-bucket queries; "1400+1600" = one merged query.
  const bands = (process.argv[4] ?? "1400,1600,1800").split(",").map((group) => group.split("+").map(Number) as RatingGroup[]);
  const phases = (process.argv[5] ?? "opening,middlegame,cross_phase").split(",");
  const since = process.argv[6] ?? "2024-01";
  const until = process.argv[7] ?? "2026-07";
  const speeds = (process.argv[8] ?? "blitz,rapid,classical").split(",") as Speed[];
  const limit = Number(process.argv[9] ?? "0");
  const delayMs = Number(process.env.DELAY_MS ?? "1000");

  const token = (readFileSync(".env.lichess", "utf8").match(/LICHESS_TOKEN=(\S+)/) ?? [])[1];
  if (token === undefined) throw new Error("no LICHESS_TOKEN in .env.lichess");

  const all = (JSON.parse(readFileSync(positionsPath, "utf8")) as { positions: Position[] }).positions;
  let selected = all.filter((p) => phases.includes(p.phase));
  if (limit > 0 && selected.length > limit) {
    const stride = selected.length / limit;
    selected = Array.from({ length: limit }, (_, i) => selected[Math.floor(i * stride)]!);
  }

  const done = new Set<string>();
  if (existsSync(outPath)) {
    for (const line of readFileSync(outPath, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      const parsed = JSON.parse(line) as { fen: string; band: number | number[]; since: string; until: string; speeds: string[] };
      done.add(`${parsed.fen}|${[parsed.band].flat().join("+")}|${parsed.since}|${parsed.until}|${parsed.speeds.join("+")}`);
    }
  } else writeFileSync(outPath, "");

  process.stderr.write(`probing ${selected.length} positions x ${bands.length} bands (${since}..${until}, ${speeds.join("+")})\n`);
  let index = 0;
  for (const position of selected) {
    index += 1;
    for (const band of bands) {
      const key = `${position.fen}|${band.join("+")}|${since}|${until}|${speeds.join("+")}`;
      if (done.has(key)) continue;
      const query: CorpusQuery = { source: "lichess-explorer", fen: position.fen, ratings: band, speeds, since, until };
      const url = corpusUrl(query);
      const normalized = normalizedCorpusQuery(query);
      const result = await fetchRaw(url, token, delayMs);
      const total = result.raw === undefined ? null : result.raw.white + result.raw.draws + result.raw.black;
      appendFileSync(
        outPath,
        `${JSON.stringify({
          packId: position.packId, phase: position.phase, fen: position.fen, queryFen: normalized.fen,
          pieceCount: position.pieceCount, legalCount: position.legalUci.length, ply: position.ply,
          spineDepth: position.spineDepth, mainLine: position.mainLine, nextSan: position.nextSan, nextUci: position.nextUci,
          band: band.length === 1 ? band[0] : band, since, until, speeds, url, status: result.status, ms: result.ms, total, raw: result.raw ?? null,
        })}\n`,
      );
      process.stderr.write(`[${index}/${selected.length}] ${position.packId} ply${position.ply} b${band.join("+")} -> ${result.status === 200 ? `${total} games` : `HTTP ${result.status}`} (${result.ms}ms)\n`);
    }
  }
}

void main();
