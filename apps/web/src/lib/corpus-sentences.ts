import type { CorpusPage } from "./api.js";

export const CORPUS_GUARD = "These counts say what this population played, not what is good.";
const pct = (value: number, total: number): string => (Math.round(value / total * 1000) / 10).toFixed(1);

export function renderCorpusPage(page: CorpusPage): readonly string[] {
  const { population } = page.result;
  const lines = [`Lichess explorer — rating buckets ${population.ratings.join(",")}; speeds ${population.speeds.join(",")}; ${population.since} to ${population.until}.`, CORPUS_GUARD];
  if (page.result.kind === "abstention") {
    const match = /^total (\d+) < 100$/.exec(page.result.detail);
    lines.push(page.result.reason === "no_data_at_band" && match !== null ? `${match[1]} games recorded here — below the 100-game abstention floor. No frequencies are shown.` : `The corpus source is unavailable (${page.result.detail}). No frequencies are shown.`);
    return Object.freeze(lines);
  }
  const result = page.result;
  lines.push(`From this position: ${result.total} games. White wins ${pct(result.white, result.total)}%, draw ${pct(result.draws, result.total)}%, Black wins ${pct(result.black, result.total)}%.`, "Most played:");
  for (const move of result.moves) lines.push(`${move.san} — ${move.playedCount} of ${result.total} games (${move.sharePct.toFixed(1)}%).`);
  if (page.committedMoveSan !== null) lines.push(result.moves.some((move) => move.san === page.committedMoveSan) ? `Your committed move here: ${page.committedMoveSan}.` : `Your committed move ${page.committedMoveSan} does not appear among this population's recorded moves.`);
  lines.push(result.recency.kind === "month" ? `Last recorded game in this population: ${result.recency.lastPlayedMonth}.` : "No last-played month is available for this window.");
  return Object.freeze(lines);
}
