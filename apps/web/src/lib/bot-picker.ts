/**
 * Presentation helpers for the Play bot picker (rfc/opponent-experience.md §§2–3, bounded to what
 * bot-policy/bot-roster ship). Every mechanism sentence is the server card compiler's text; this
 * module only selects which compiled statement a collapsed tile shows and renders the closed
 * availability vocabulary as learner copy. It declares no family, band, layer or reason enum.
 */
import { botProfileIsStartable, type BotAvailabilityBlocker, type BotAvailabilityCondition, type BotCardStatementId } from "@chess-tabiya/runtime";

import type { BotRosterRow } from "./api.js";

const BLOCKER_COPY: Readonly<Record<BotAvailabilityBlocker, string>> = Object.freeze({
  maia_unavailable: "Unavailable: the Maia move model is not reachable here.",
  stockfish_unavailable: "Unavailable: the Stockfish check this bot needs is not reachable here.",
});

const CONDITION_COPY: Readonly<Record<BotAvailabilityCondition, string>> = Object.freeze({
  maia_unverified: "The Maia move model has not answered yet on this server.",
  stockfish_unverified: "The Stockfish check has not answered yet on this server.",
  guard_release_receipt_absent: "The Stockfish check's timing is not yet release-measured, so it may stand aside on some moves.",
});

export function botIsStartable(row: BotRosterRow): boolean {
  return botProfileIsStartable(row.startable);
}

/** Learner copy for the row's availability, or `undefined` when it is simply available. */
export function botAvailabilityNote(row: BotRosterRow): string | undefined {
  const startable = row.startable;
  if (startable.kind === "available") return undefined;
  if (startable.kind === "unavailable") return startable.blockedBy.map((blocker) => BLOCKER_COPY[blocker]).join(" ");
  return startable.conditions.map((condition) => CONDITION_COPY[condition]).join(" ");
}

/** The statement that distinguishes the row's layer stack: the trait, else the guard, else the sampler. */
const SUMMARY_ORDER: readonly BotCardStatementId[] = Object.freeze(["card.pawn_trait", "card.guard", "card.sampler"]);

/** One compiler-owned sentence for the collapsed tile: the first sentence of that statement. */
export function botCardSummary(row: BotRosterRow): string {
  for (const id of SUMMARY_ORDER) {
    const statement = row.card.statements.find((candidate) => candidate.id === id);
    if (statement !== undefined) return firstSentence(statement.text);
  }
  return firstSentence(row.card.statements[0]?.text ?? "");
}

function firstSentence(text: string): string {
  const match = /^(.+?[.!?])(?:\s|$)/u.exec(text);
  return match === null ? text : match[1]!;
}

/** The in-run identity label for a profile run: the roster card's title for the exact digest. */
export function botRunLabel(roster: readonly BotRosterRow[] | undefined, digest: string): string | undefined {
  return roster?.find((row) => row.reference.digest === digest)?.card.title;
}
