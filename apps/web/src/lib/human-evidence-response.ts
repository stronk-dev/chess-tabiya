import { FLOAT32_POLICY_MASS_TOLERANCE, type SelectionCandidate, type SelectionEngineIdentity } from "@chess-tabiya/runtime";

import type { CorpusPage, CorpusPopulation, CorpusResult, HumanSplitPage } from "./api.js";

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

function finite(value: unknown, label: string, minimum?: number, maximum?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${label} must be finite`);
  if ((minimum !== undefined && value < minimum) || (maximum !== undefined && value > maximum)) throw new TypeError(`${label} is outside its bounds`);
  return value;
}

function boolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be boolean`);
  return value;
}

function uci(value: unknown, label: string): string {
  const parsed = nonempty(value, label);
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/u.test(parsed)) throw new TypeError(`${label} must be a UCI move`);
  return parsed;
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

function engine(value: unknown): SelectionEngineIdentity {
  const item = record(value, "human-split/engine");
  exact(item, ["id", "name", "version", "seedHonored"], "human-split/engine", ["modelId", "containerDigest", "eloHonored", "eloApplied", "searchBound"]);
  nonempty(item.id, "human-split/engine/id"); nonempty(item.name, "human-split/engine/name"); nonempty(item.version, "human-split/engine/version"); boolean(item.seedHonored, "human-split/engine/seedHonored");
  if (item.modelId !== undefined) nonempty(item.modelId, "human-split/engine/modelId");
  if (item.containerDigest !== undefined) nonempty(item.containerDigest, "human-split/engine/containerDigest");
  if (item.eloHonored !== undefined) boolean(item.eloHonored, "human-split/engine/eloHonored");
  if (item.eloApplied !== undefined) integer(item.eloApplied, "human-split/engine/eloApplied", 0);
  if (item.searchBound !== undefined) {
    const bound = record(item.searchBound, "human-split/engine/searchBound"); exact(bound, ["kind", "value"], "human-split/engine/searchBound");
    oneOf(bound.kind, ["nodes", "movetime"] as const, "human-split/engine/searchBound/kind"); integer(bound.value, "human-split/engine/searchBound/value", 1);
  }
  return item as unknown as SelectionEngineIdentity;
}

function candidates(value: unknown): readonly SelectionCandidate[] {
  if (!Array.isArray(value)) throw new TypeError("human-split/candidates must be an array");
  const moves = new Set<string>(), ranks = new Set<number>();
  let priorRank = 0, measuredMass = 0;
  const parsed = value.map((raw, index): SelectionCandidate => {
    const label = `human-split/candidates/${index}`, item = record(raw, label);
    exact(item, ["moveUci", "rank"], label, ["mass", "concessionRatio", "offWindow", "scoreCp", "wdl"]);
    const move = uci(item.moveUci, `${label}/moveUci`), rank = integer(item.rank, `${label}/rank`, 1);
    if (moves.has(move) || ranks.has(rank)) throw new TypeError("human-split candidates contain duplicate move or rank identities");
    if (rank <= priorRank) throw new TypeError("human-split candidates are not ordered by rank");
    moves.add(move); ranks.add(rank); priorRank = rank;
    const offWindow = item.offWindow === undefined ? false : boolean(item.offWindow, `${label}/offWindow`);
    if (item.mass !== undefined) {
      const mass = finite(item.mass, `${label}/mass`, 0, 1 + FLOAT32_POLICY_MASS_TOLERANCE);
      if (offWindow) throw new TypeError(`${label} cannot report mass for an off-window move`);
      measuredMass += mass;
    }
    if (item.concessionRatio !== undefined) finite(item.concessionRatio, `${label}/concessionRatio`, 0, 1);
    if (item.scoreCp !== undefined) integer(item.scoreCp, `${label}/scoreCp`);
    if (item.wdl !== undefined) {
      const wdl = record(item.wdl, `${label}/wdl`); exact(wdl, ["win", "draw", "loss"], `${label}/wdl`);
      const win = integer(wdl.win, `${label}/wdl/win`, 0), draw = integer(wdl.draw, `${label}/wdl/draw`, 0), loss = integer(wdl.loss, `${label}/wdl/loss`, 0);
      if (win + draw + loss !== 1000) throw new TypeError(`${label}/wdl must sum to 1000`);
    }
    return item as unknown as SelectionCandidate;
  });
  if (measuredMass > 1 + FLOAT32_POLICY_MASS_TOLERANCE) throw new TypeError("human-split measured policy mass exceeds 1");
  return parsed;
}

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

function corpusResult(value: unknown): CorpusResult {
  const item = record(value, "corpus/result"), kind = oneOf(item.kind, ["stats", "abstention"] as const, "corpus/result/kind");
  if (kind === "abstention") {
    exact(item, ["kind", "reason", "detail", "population"], "corpus/result");
    oneOf(item.reason, ["no_data_at_band", "source_unavailable"] as const, "corpus/result/reason"); nonempty(item.detail, "corpus/result/detail"); population(item.population, "corpus/result/population");
    return item as unknown as CorpusResult;
  }
  exact(item, ["kind", "total", "white", "draws", "black", "moves", "recency", "population"], "corpus/result");
  const total = integer(item.total, "corpus/result/total", 100), white = integer(item.white, "corpus/result/white", 0), draws = integer(item.draws, "corpus/result/draws", 0), black = integer(item.black, "corpus/result/black", 0);
  if (total !== white + draws + black) throw new TypeError("corpus/result total does not equal its outcomes");
  if (!Array.isArray(item.moves)) throw new TypeError("corpus/result/moves must be an array");
  const moves = new Set<string>(); let priorCount = Number.POSITIVE_INFINITY, priorSan = "";
  item.moves.forEach((raw, index) => {
    const label = `corpus/result/moves/${index}`, row = record(raw, label); exact(row, ["san", "uci", "playedCount", "sharePct", "white", "draws", "black"], label);
    const san = nonempty(row.san, `${label}/san`), move = uci(row.uci, `${label}/uci`); if (moves.has(move)) throw new TypeError("corpus/result contains duplicate moves"); moves.add(move);
    const playedCount = integer(row.playedCount, `${label}/playedCount`, 0), moveWhite = integer(row.white, `${label}/white`, 0), moveDraws = integer(row.draws, `${label}/draws`, 0), moveBlack = integer(row.black, `${label}/black`, 0);
    if (playedCount !== moveWhite + moveDraws + moveBlack || playedCount > total) throw new TypeError(`${label} has inconsistent outcome counts`);
    const share = finite(row.sharePct, `${label}/sharePct`, 0, 100), expectedShare = Math.round(playedCount / total * 1000) / 10;
    if (share !== expectedShare) throw new TypeError(`${label} has inconsistent share arithmetic`);
    if (playedCount > priorCount || (playedCount === priorCount && san.localeCompare(priorSan) < 0)) throw new TypeError("corpus/result moves are not in canonical order");
    priorCount = playedCount; priorSan = san;
  });
  const recency = record(item.recency, "corpus/result/recency"), recencyKind = oneOf(recency.kind, ["month", "absent"] as const, "corpus/result/recency/kind");
  if (recencyKind === "month") { exact(recency, ["kind", "lastPlayedMonth"], "corpus/result/recency"); month(recency.lastPlayedMonth, "corpus/result/recency/lastPlayedMonth"); population(item.population, "corpus/result/population"); }
  else { exact(recency, ["kind"], "corpus/result/recency"); population(item.population, "corpus/result/population"); }
  return item as unknown as CorpusResult;
}

export function parseHumanSplitPage(value: unknown, requestedNodeId: string): HumanSplitPage {
  const item = record(value, "human-split"); exact(item, ["nodeId", "engine", "targetElo", "candidates"], "human-split");
  const nodeId = nonempty(item.nodeId, "human-split/nodeId"); if (nodeId !== requestedNodeId) throw new TypeError("human-split response does not match the requested node");
  engine(item.engine); if (item.targetElo !== null) integer(item.targetElo, "human-split/targetElo", 0); candidates(item.candidates);
  return deepFreeze(structuredClone(item)) as unknown as HumanSplitPage;
}

export function parseCorpusPage(value: unknown, requestedNodeId: string): CorpusPage {
  const item = record(value, "corpus"); exact(item, ["nodeId", "result", "committedMoveSan"], "corpus");
  const nodeId = nonempty(item.nodeId, "corpus/nodeId"); if (nodeId !== requestedNodeId) throw new TypeError("corpus response does not match the requested node");
  corpusResult(item.result); if (item.committedMoveSan !== null) nonempty(item.committedMoveSan, "corpus/committedMoveSan");
  return deepFreeze(structuredClone(item)) as unknown as CorpusPage;
}
