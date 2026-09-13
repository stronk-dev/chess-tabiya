import type { PublishedBandValue, RatingPublication } from "@chess-tabiya/runtime/rating";

import type {
  CohortStandingEntry,
  CohortStandingView,
  LearnerMark,
  RatedGameHistoryItem,
  RatingHistoryPage,
  RatingPeriod,
  RatingView,
  StandingRecord,
} from "./api.js";

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : undefined;
}

function text(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function instant(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function optionalInstant(value: unknown): value is string | null {
  return value === null || instant(value);
}

function natural(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function oneOf<T extends string | number>(value: unknown, choices: readonly T[]): value is T {
  return (typeof value === "string" || typeof value === "number") && choices.includes(value as T);
}

function publishedBand(value: unknown): value is PublishedBandValue {
  const item = record(value);
  if (item === undefined) return false;
  if (item.kind === "band") return finite(item.value);
  return (item.kind === "below" || item.kind === "above") && finite(item.band);
}

function publication(value: unknown): value is RatingPublication {
  const item = record(value);
  if (item === undefined || !oneOf(item.state, ["provisional", "published", "bounded"] as const)) return false;
  if (!Array.isArray(item.interval) || item.interval.length !== 2 || !item.interval.every(publishedBand)) return false;
  if (!natural(item.ratedGames) || !natural(item.abandonedGames)) return false;
  if (item.pointEstimate !== undefined && !publishedBand(item.pointEstimate)) return false;
  return item.state === "provisional" ? item.pointEstimate === undefined : item.pointEstimate !== undefined;
}

function period(value: unknown): value is RatingPeriod {
  const item = record(value);
  return item !== undefined
    && natural(item.periodNo)
    && text(item.calibrationId)
    && instant(item.openedAt)
    && optionalInstant(item.closedAt)
    && natural(item.games)
    && finite(item.ratingBefore)
    && finite(item.rdBefore)
    && finite(item.volatilityBefore)
    && (item.ratingAfter === null || finite(item.ratingAfter))
    && (item.rdAfter === null || finite(item.rdAfter))
    && (item.volatilityAfter === null || finite(item.volatilityAfter));
}

function game(value: unknown): value is RatedGameHistoryItem {
  const item = record(value);
  if (item === undefined
    || !text(item.runId)
    || !text(item.calibrationId)
    || !finite(item.opponentBand)
    || !oneOf(item.learnerSide, ["white", "black"] as const)
    || !oneOf(item.state, ["sealed", "voided"] as const)
    || !(item.voidReason === null || oneOf(item.voidReason, ["rewound", "forked", "assistance", "engine_changed", "calibration_retired", "abandoned"] as const))
    || !(item.result === null || oneOf(item.result, ["win", "loss", "draw"] as const))
    || !(item.terminalReason === null || oneOf(item.terminalReason, ["checkmate", "stalemate", "insufficient_material", "fifty_move", "threefold"] as const))
    || !(item.plyCount === null || natural(item.plyCount))
    || !(item.periodNo === null || natural(item.periodNo))
    || !instant(item.startedAt)
    || !optionalInstant(item.sealedAt)) return false;
  if (item.state === "sealed") return item.voidReason === null && item.result !== null && item.sealedAt !== null;
  return item.voidReason !== null && item.result === null && item.sealedAt !== null;
}

function mark(value: unknown): value is LearnerMark {
  const item = record(value);
  return item !== undefined
    && oneOf(item.mark, ["bronze", "silver", "gold"] as const)
    && text(item.calibrationId)
    && text(item.runId)
    && instant(item.earnedAt);
}

export function assertRatingView(value: unknown): asserts value is RatingView {
  const item = record(value);
  if (item === undefined
    || !(item.rating === undefined || item.rating === null || publication(item.rating))
    || !Array.isArray(item.disclosures)
    || !item.disclosures.every(text)) throw new TypeError("Invalid rating response");
}

export function assertRatingHistory(value: unknown): asserts value is RatingHistoryPage {
  const item = record(value);
  if (item === undefined
    || !Array.isArray(item.periods)
    || !item.periods.every(period)
    || !Array.isArray(item.games)
    || !item.games.every(game)) throw new TypeError("Invalid rating history response");
  const runIds = new Set(item.games.map((entry) => entry.runId));
  if (runIds.size !== item.games.length) throw new TypeError("Invalid rating history response");
}

export function assertLearnerMarks(value: unknown): asserts value is readonly LearnerMark[] {
  if (!Array.isArray(value) || !value.every(mark)) throw new TypeError("Invalid learner marks response");
  const keys = new Set(value.map((item) => `${item.mark}:${item.calibrationId}:${item.runId}`));
  if (keys.size !== value.length) throw new TypeError("Invalid learner marks response");
}

function standingRecord(value: unknown): value is StandingRecord {
  const item = record(value);
  if (item === undefined
    || !natural(item.wins)
    || !natural(item.draws)
    || !natural(item.losses)
    || !natural(item.games)
    || !finite(item.points)
    || !natural(item.abandoned)
    || item.games !== item.wins + item.draws + item.losses
    || item.points !== item.wins + item.draws / 2
    || !Array.isArray(item.byOpponentBand)) return false;
  const bands = new Set<number>();
  for (const valueAtBand of item.byOpponentBand) {
    const split = record(valueAtBand);
    if (split === undefined
      || !finite(split.opponentBand)
      || !natural(split.wins)
      || !natural(split.draws)
      || !natural(split.losses)
      || !natural(split.games)
      || !finite(split.points)
      || split.games !== split.wins + split.draws + split.losses
      || split.points !== split.wins + split.draws / 2
      || bands.has(split.opponentBand)) return false;
    bands.add(split.opponentBand);
  }
  return true;
}

function standingEntry(value: unknown): value is CohortStandingEntry {
  const item = record(value);
  if (item === undefined || !text(item.learnerId) || !text(item.handle) || !Array.isArray(item.marks)) return false;
  for (const valueMark of item.marks) {
    const entryMark = record(valueMark);
    if (entryMark === undefined
      || !oneOf(entryMark.mark, ["bronze", "silver", "gold"] as const)
      || !oneOf(entryMark.band, [1400, 1800, 2200] as const)
      || (entryMark.mark === "bronze" ? entryMark.band !== 1400 : entryMark.mark === "silver" ? entryMark.band !== 1800 : entryMark.band !== 2200)
      || !text(entryMark.calibrationId)
      || !instant(entryMark.earnedAt)) return false;
  }
  const ratingRecord = record(item.rating);
  return (item.record === undefined || standingRecord(item.record))
    && (item.rating === undefined || (ratingRecord !== undefined && publication(item.rating) && (typeof ratingRecord.group === "string" || finite(ratingRecord.group))));
}

export function assertCohortStanding(value: unknown, classroomId: string): asserts value is CohortStandingView {
  const item = record(value);
  const standing = record(item?.standing);
  if (item === undefined
    || standing === undefined
    || standing.classroomId !== classroomId
    || !text(standing.openedByLearnerId)
    || !instant(standing.windowFrom)
    || !optionalInstant(standing.windowTo)
    || !instant(standing.openedAt)
    || !optionalInstant(standing.closedAt)
    || (standing.windowTo !== null && Date.parse(standing.windowTo) < Date.parse(standing.windowFrom as string))
    || !text(item.limitation)
    || !Array.isArray(item.entries)
    || !item.entries.every(standingEntry)) throw new TypeError("Invalid classroom standing response");
  const learnerIds = new Set(item.entries.map((entry) => entry.learnerId));
  if (learnerIds.size !== item.entries.length) throw new TypeError("Invalid classroom standing response");
}
