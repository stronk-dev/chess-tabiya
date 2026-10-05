import type { CorpusPage, CorpusPopulation, HumanSplitPage } from "./api.js";
import { parseSelectionCandidates, parseSelectionEngine } from "./opponent-selection-response.js";
import { corpusEvidence } from "./inspector-evidence.js";

type RecordValue = Readonly<Record<string, unknown>>;

const RATING_GROUPS = Object.freeze([0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500] as const);
const SPEEDS = Object.freeze(["ultraBullet", "bullet", "blitz", "rapid", "classical", "correspondence"] as const);

function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
  return value as RecordValue;
}

function exact(value: RecordValue, required: readonly string[], label: string, optional: readonly string[] = []): void {
  const allowed = new Set([...required, ...optional]);
  if (required.some((key) => !(key in value)) || Object.keys(value).some((key) => !allowed.has(key))) throw new TypeError(`${label} has an invalid shape`);
}

function nonempty(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string`);
  return value;
}

function oneOf<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new TypeError(`${label} is outside the closed vocabulary`);
  return value as T;
}

function integer(value: unknown, label: string, minimum = Number.MIN_SAFE_INTEGER): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) throw new TypeError(`${label} must be a safe integer`);
  return Number(value);
}


function month(value: unknown, label: string): string {
  const parsed = nonempty(value, label);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/u.test(parsed)) throw new TypeError(`${label} must be a canonical month`);
  return parsed;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function parseCorpusPopulation(value: unknown, label: string): CorpusPopulation { return population(value, label); }

function population(value: unknown, label: string): CorpusPopulation {
  const item = record(value, label); exact(item, ["source", "ratings", "speeds", "since", "until"], label);
  oneOf(item.source, ["lichess-explorer"] as const, `${label}/source`);
  if (!Array.isArray(item.ratings) || item.ratings.length === 0) throw new TypeError(`${label}/ratings must be a non-empty array`);
  let priorRating = -1; const ratings = new Set<number>();
  item.ratings.forEach((raw, index) => { const rating = integer(raw, `${label}/ratings/${index}`, 0); if (!RATING_GROUPS.includes(rating as never) || ratings.has(rating) || rating <= priorRating) throw new TypeError(`${label}/ratings are not unique ordered rating groups`); ratings.add(rating); priorRating = rating; });
  if (!Array.isArray(item.speeds) || item.speeds.length === 0) throw new TypeError(`${label}/speeds must be a non-empty array`);
  let priorSpeed = -1; const speeds = new Set<string>();
  item.speeds.forEach((raw, index) => { const speed = oneOf(raw, SPEEDS, `${label}/speeds/${index}`), order = SPEEDS.indexOf(speed); if (speeds.has(speed) || order <= priorSpeed) throw new TypeError(`${label}/speeds are not unique canonical speeds`); speeds.add(speed); priorSpeed = order; });
  const since = month(item.since, `${label}/since`), until = month(item.until, `${label}/until`); if (since > until) throw new TypeError(`${label} has a reversed window`);
  return item as unknown as CorpusPopulation;
}


export function parseHumanSplitPage(value: unknown, requestedNodeId: string): HumanSplitPage {
  const item = record(value, "human-split"); exact(item, ["nodeId", "engine", "targetElo", "candidates"], "human-split");
  const nodeId = nonempty(item.nodeId, "human-split/nodeId"); if (nodeId !== requestedNodeId) throw new TypeError("human-split response does not match the requested node");
  parseSelectionEngine(item.engine, "human-split/engine"); if (item.targetElo !== null) integer(item.targetElo, "human-split/targetElo", 0); parseSelectionCandidates(item.candidates, "human-split/candidates");
  return deepFreeze(structuredClone(item)) as unknown as HumanSplitPage;
}

export function parseCorpusPage(value: unknown, requestedNodeId: string): CorpusPage {
  const item = record(value, "corpus"); exact(item, ["nodeId", "population", "status", "presentation", "committedMoveSan", "committedMoveListed"], "corpus");
  const nodeId = nonempty(item.nodeId, "corpus/nodeId"); if (nodeId !== requestedNodeId) throw new TypeError("corpus response does not match the requested node");
  population(item.population, "corpus/population");
  const status = record(item.status, "corpus/status");
  const kind = oneOf(status.kind, ["shown", "below_floor", "source_unavailable"] as const, "corpus/status/kind");
  exact(status, kind === "below_floor" ? ["kind", "total"] : ["kind"], "corpus/status");
  if (kind === "below_floor" && integer(status.total, "corpus/status/total", 0) >= 100) throw new TypeError("Corpus floor must be below 100");
  if (item.committedMoveSan !== null) nonempty(item.committedMoveSan, "corpus/committedMoveSan");
  if (item.committedMoveListed !== null && typeof item.committedMoveListed !== "boolean") throw new TypeError("Corpus membership must be boolean or absent");
  if ((kind !== "shown" || item.committedMoveSan === null) && item.committedMoveListed !== null) throw new TypeError("Unavailable corpus cannot claim move membership");
  if (kind === "shown" && item.committedMoveSan !== null && item.committedMoveListed === null) throw new TypeError("Shown corpus must report requested move membership");
  return corpusEvidence(deepFreeze(structuredClone(item)) as unknown as CorpusPage);
}
