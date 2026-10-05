import { CORPUS_GUARD, parsePresentationReceipt, presentedSentence } from "@chess-tabiya/runtime";
import type { CorpusPage } from "./api.js";

export { CORPUS_GUARD };
export const CORPUS_MOVE_OUTCOME_FLOOR = 100;

/** Prose comes from the registered receipt renderer, never client-minted provider evidence. */
export function renderCorpusPage(page: CorpusPage): readonly string[] {
  const lines: string[] = page.status.kind === "shown"
    ? parsePresentationReceipt(page.presentation).flatMap(item => presentedSentence(item).split("\n"))
    : [
      `Lichess explorer — rating buckets ${page.population.ratings.join(",")}; speeds ${page.population.speeds.join(",")}; ${page.population.since} to ${page.population.until}.`, CORPUS_GUARD,
      page.status.kind === "below_floor" ? `${page.status.total} games recorded here — below the 100-game abstention floor. No frequencies are shown.` : "The corpus source is unavailable. No frequencies are shown.",
    ];
  if (page.status.kind === "shown" && page.committedMoveSan !== null) lines.push(page.committedMoveListed ? `Your committed move here: ${page.committedMoveSan}.` : `Your committed move ${page.committedMoveSan} does not appear among this population's recorded moves.`);
  return Object.freeze(lines);
}
