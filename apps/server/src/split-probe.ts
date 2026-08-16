// DISPOSABLE research instrument (D148 wave, 2026-08-15). Not production.
// Prints the position-level W/D/B result split and per-move splits for a FEN,
// live from the Lichess explorer at the wave's stated population. No cache.
import { readFile } from "node:fs/promises";

import { explorerUrl, type RatingGroup, type Speed } from "./sourcing/explorer.js";

const RATINGS: readonly RatingGroup[] = [1400, 1600, 1800];
const SPEEDS: readonly Speed[] = ["rapid", "classical"];
const SINCE = "2023-01";
const UNTIL = "2025-12";

interface Row { readonly san: string; readonly uci: string; readonly white: number; readonly draws: number; readonly black: number }

function pct(value: number, total: number): string { return total === 0 ? "-" : (Math.round((value / total) * 1000) / 10).toFixed(1); }

async function main(): Promise<void> {
  const token = (await readFile(".env.lichess", "utf8")).split("\n").find((line) => line.startsWith("LICHESS_TOKEN="))?.slice("LICHESS_TOKEN=".length).trim();
  const fens = process.argv.slice(2);
  for (const [index, fen] of fens.entries()) {
    const url = explorerUrl({ fen, ratings: RATINGS, speeds: SPEEDS, since: SINCE, until: UNTIL, moves: Number(process.env.MOVES ?? "12") });
    if (index > 0) await new Promise((done) => setTimeout(done, 1500));
    const response = await fetch(url, { headers: { "user-agent": "chess-tabiya-sourcing/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)", ...(token ? { authorization: `Bearer ${token}` } : {}) } });
    if (!response.ok) { console.log(`FEN ${fen}\n  HTTP ${response.status}`); continue; }
    const raw = (await response.json()) as { white: number; draws: number; black: number; moves: Row[] };
    const total = raw.white + raw.draws + raw.black;
    console.log(`FEN ${fen}`);
    console.log(`  POSITION total=${total} W/D/B ${raw.white}/${raw.draws}/${raw.black} = ${pct(raw.white, total)}/${pct(raw.draws, total)}/${pct(raw.black, total)}%  ${total < 100 ? "[BELOW 100-GAME FLOOR — client would abstain]" : ""}`);
    for (const move of raw.moves) {
      const played = move.white + move.draws + move.black;
      console.log(`    ${move.san.padEnd(7)} ${move.uci.padEnd(6)} n=${String(played).padStart(6)} share=${pct(played, total).padStart(5)}%  W/D/B ${move.white}/${move.draws}/${move.black} = ${pct(move.white, played)}/${pct(move.draws, played)}/${pct(move.black, played)}%`);
    }
  }
}

await main();
