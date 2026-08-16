// DISPOSABLE research instrument (D345 wave, 2026-08-16). Not production.
// Walks a SAN line from the initial position (or from a FEN given as FEN=...)
// and prints, per ply, the position-level W/D/B split and the top moves, live
// from the Lichess explorer. RATINGS= and SPEEDS= override the population so a
// pack authored for a narrower opponent band can state the band it was authored
// against. No cache: every number is re-queried.
import { readFile } from "node:fs/promises";

import { Chess } from "chessops/chess";
import { makeFen, parseFen, INITIAL_FEN } from "chessops/fen";
import { parseSan } from "chessops/san";

import { explorerUrl, type RatingGroup, type Speed } from "./sourcing/explorer.js";

const RATINGS = (process.env.RATINGS ?? "1400,1600,1800").split(",").map((value) => Number(value) as RatingGroup);
const SPEEDS = (process.env.SPEEDS ?? "rapid,classical").split(",") as Speed[];
const SINCE = process.env.SINCE ?? "2023-01";
const UNTIL = process.env.UNTIL ?? "2025-12";
const MOVES = Number(process.env.MOVES ?? "8");
const TOP = Number(process.env.TOP ?? "6");

interface Row { readonly san: string; readonly uci: string; readonly white: number; readonly draws: number; readonly black: number }

function pct(value: number, total: number): string { return total === 0 ? "-" : (Math.round((value / total) * 1000) / 10).toFixed(1); }

async function probe(fen: string, token: string | undefined): Promise<{ total: number; raw: { white: number; draws: number; black: number; moves: Row[] } } | null> {
  const url = explorerUrl({ fen, ratings: RATINGS, speeds: SPEEDS, since: SINCE, until: UNTIL, moves: MOVES });
  const response = await fetch(url, { headers: { "user-agent": "chess-tabiya-sourcing/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
  if (!response.ok) { console.log(`  HTTP ${response.status}`); return null; }
  const raw = (await response.json()) as { white: number; draws: number; black: number; moves: Row[] };
  return { total: raw.white + raw.draws + raw.black, raw };
}

async function main(): Promise<void> {
  const token = (await readFile(".env.lichess", "utf8")).split("\n").find((line) => line.startsWith("LICHESS_TOKEN="))?.slice("LICHESS_TOKEN=".length).trim();
  const line = process.argv.slice(2).join(" ").trim().split(/\s+/).filter((token_) => token_.length > 0 && !/^\d+\.$/.test(token_));
  const startFen = process.env.FEN ?? INITIAL_FEN;
  const position = Chess.fromSetup(parseFen(startFen).unwrap()).unwrap();
  console.log(`population ratings=${RATINGS.join(",")} speeds=${SPEEDS.join(",")} since=${SINCE} until=${UNTIL}`);
  const played: string[] = [];
  for (let index = 0; index <= line.length; index += 1) {
    if (index > 0) {
      const san = line[index - 1]!;
      const move = parseSan(position, san);
      if (!move) { console.log(`ILLEGAL SAN ${san} at ply ${index}`); return; }
      position.play(move);
      played.push(san);
    }
    const fen = makeFen(position.toSetup());
    if (index > 0) await new Promise((done) => setTimeout(done, 1200));
    const result = await probe(fen, token);
    console.log(`\n[ply ${index}] ${played.join(" ") || "(start)"}\n  ${fen}`);
    if (!result) continue;
    const { total, raw } = result;
    console.log(`  total=${total} W/D/B ${raw.white}/${raw.draws}/${raw.black} = ${pct(raw.white, total)}/${pct(raw.draws, total)}/${pct(raw.black, total)}%${total < 100 ? "   [BELOW 100-GAME FLOOR]" : ""}`);
    for (const move of raw.moves.slice(0, TOP)) {
      const n = move.white + move.draws + move.black;
      console.log(`    ${move.san.padEnd(7)} ${move.uci.padEnd(6)} n=${String(n).padStart(6)} share=${pct(n, total).padStart(5)}%  W/D/B ${move.white}/${move.draws}/${move.black} = ${pct(move.white, n)}/${pct(move.draws, n)}/${pct(move.black, n)}%`);
    }
  }
}

await main();
