import type { LiveSessionSummary } from "./api.js";

// ux-teacher-and-classroom.md §5.3 (TCH-a6, D1479): the wall's job is triage, and the law-8 fence is
// one field wide — the wall may order by elapsed time and never by evaluation. "Waiting 4 minutes" is
// a fact about a clock; "struggling" would be a verdict about a person, shown to a different person.
// The ordering input is typed to the clock facts alone, so no evaluation can reach the comparator.

export const LIVE_WALL_ORDER_SENTENCE = "Boards are ordered by how long they have waited for a move, longest first; paused and closed sessions follow. Cards show rules facts and the pack's recorded objective state, and are never ordered or labelled by engine evaluation.";

export type LiveWallClockFacts = Pick<LiveSessionSummary, "id" | "title" | "createdAt" | "closedAt"> & {
  readonly board: Pick<LiveSessionSummary["board"], "lastMoveAt" | "pausedAt">;
};

function waitingSince(item: LiveWallClockFacts): number {
  const value = Date.parse(item.board.lastMoveAt ?? item.createdAt);
  return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;
}

function band(item: LiveWallClockFacts): number {
  if (item.closedAt !== undefined) return 2;
  return item.board.pausedAt !== null ? 1 : 0;
}

/** Stable: live boards first, longest wait first; then paused; then closed. Ties keep title order. */
export function orderLiveWall<T extends LiveWallClockFacts>(sessions: readonly T[]): readonly T[] {
  return Object.freeze([...sessions].sort((left, right) =>
    band(left) - band(right)
    || waitingSince(left) - waitingSince(right)
    || left.title.localeCompare(right.title)
    || left.id.localeCompare(right.id)));
}
