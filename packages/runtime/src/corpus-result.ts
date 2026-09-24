/**
 * Explorer corpus result authority (D3103).
 *
 * The one production tuple of Explorer abstention reasons. The server's `CorpusResult`, the web
 * client's `CorpusResult`, and the evidence catalogue's `human.explorer.population@1` /
 * `human.explorer.position_stats@1` abstention reasons all derive from this tuple, so a reason
 * cannot be spelled differently on either side of the catalogue boundary.
 */

export const CORPUS_RESULT_ABSTENTION_REASONS = Object.freeze(["no_data_at_band", "source_unavailable"] as const);
export type CorpusResultAbstentionReason = (typeof CORPUS_RESULT_ABSTENTION_REASONS)[number];

export const CORPUS_POPULATION_SOURCE = "lichess-explorer" as const;

export interface CorpusPopulation<Rating extends number = number, SpeedName extends string = string> {
  readonly source: typeof CORPUS_POPULATION_SOURCE;
  readonly ratings: readonly Rating[];
  readonly speeds: readonly SpeedName[];
  readonly since: string;
  readonly until: string;
}

export interface CorpusMoveRow {
  readonly san: string;
  readonly uci: string;
  readonly playedCount: number;
  readonly sharePct: number;
  readonly white: number;
  readonly draws: number;
  readonly black: number;
}

export interface CorpusStatsResult<Population extends CorpusPopulation = CorpusPopulation> {
  readonly kind: "stats";
  readonly total: number;
  readonly white: number;
  readonly draws: number;
  readonly black: number;
  readonly moves: readonly CorpusMoveRow[];
  readonly recency: { readonly kind: "month"; readonly lastPlayedMonth: string } | { readonly kind: "absent" };
  readonly population: Population;
}

export interface CorpusAbstentionResult<Population extends CorpusPopulation = CorpusPopulation> {
  readonly kind: "abstention";
  readonly reason: CorpusResultAbstentionReason;
  readonly detail: string;
  readonly population: Population;
}

export type CorpusResult<Population extends CorpusPopulation = CorpusPopulation> =
  | CorpusStatsResult<Population>
  | CorpusAbstentionResult<Population>;

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/u;

function plainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  const prototype = Object.getPrototypeOf(value) as unknown;
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`);
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some((key) => typeof key !== "string" || !keys.includes(key))) {
    throw new TypeError(`${label} must have exactly the keys ${keys.join(", ")}`);
  }
}

function parsePopulation(value: unknown): CorpusPopulation {
  const label = "CorpusResult.population";
  const item = plainRecord(value, label);
  exactKeys(item, ["source", "ratings", "speeds", "since", "until"], label);
  if (item.source !== CORPUS_POPULATION_SOURCE) throw new TypeError(`${label}.source must be ${CORPUS_POPULATION_SOURCE}`);
  if (!Array.isArray(item.ratings) || item.ratings.length === 0
    || item.ratings.some((rating) => typeof rating !== "number" || !Number.isSafeInteger(rating) || rating < 0)) {
    throw new TypeError(`${label}.ratings must be a non-empty array of non-negative integers`);
  }
  if (!Array.isArray(item.speeds) || item.speeds.length === 0
    || item.speeds.some((speed) => typeof speed !== "string" || speed.length === 0)) {
    throw new TypeError(`${label}.speeds must be a non-empty array of non-empty strings`);
  }
  if (typeof item.since !== "string" || !MONTH.test(item.since)) throw new TypeError(`${label}.since must be YYYY-MM`);
  if (typeof item.until !== "string" || !MONTH.test(item.until)) throw new TypeError(`${label}.until must be YYYY-MM`);
  if (item.since > item.until) throw new TypeError(`${label} has a reversed window`);
  return Object.freeze({
    source: CORPUS_POPULATION_SOURCE,
    ratings: Object.freeze([...(item.ratings as number[])]),
    speeds: Object.freeze([...(item.speeds as string[])]),
    since: item.since,
    until: item.until,
  });
}

export function isCorpusResultAbstentionReason(value: unknown): value is CorpusResultAbstentionReason {
  return typeof value === "string" && (CORPUS_RESULT_ABSTENTION_REASONS as readonly string[]).includes(value);
}

/**
 * Parse the complete Explorer abstention arm: exact keys, an exported reason, a non-empty detail
 * and the complete population the abstaining query was asked of. A fragment such as
 * `{ kind, reason }` is not a `CorpusResult` and is refused.
 */
export function parseCorpusResultAbstention(value: unknown): CorpusAbstentionResult {
  const item = plainRecord(value, "CorpusResult");
  exactKeys(item, ["kind", "reason", "detail", "population"], "CorpusResult abstention");
  if (item.kind !== "abstention") throw new TypeError("CorpusResult.kind must be abstention");
  if (!isCorpusResultAbstentionReason(item.reason)) {
    throw new TypeError(`CorpusResult.reason must be one of ${CORPUS_RESULT_ABSTENTION_REASONS.join(", ")}`);
  }
  if (typeof item.detail !== "string" || item.detail.trim().length === 0) throw new TypeError("CorpusResult.detail must be a non-empty string");
  return Object.freeze({ kind: "abstention", reason: item.reason, detail: item.detail, population: parsePopulation(item.population) });
}
