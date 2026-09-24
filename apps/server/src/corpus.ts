import {
  transposeKey,
  type CorpusPopulation as RuntimeCorpusPopulation,
  type CorpusResult as RuntimeCorpusResult,
  type CorpusResultAbstentionReason,
} from "@chess-tabiya/runtime";

import {
  RATING_GROUPS,
  SPEEDS,
  explorerUrl,
  normalizeExplorerQuery,
  type ExplorerFetch,
  type RatingGroup,
  type Speed,
} from "./sourcing/explorer.js";
import { ProviderHttpError, ProviderUnavailableError, classifyProviderError, type ProviderRegistry } from "./provider-health.js";

/** The runtime owns the Explorer result shape and its abstention-reason tuple (D3103). */
export type CorpusPopulation = RuntimeCorpusPopulation<RatingGroup, Speed>;
export type CorpusAbstentionReason = CorpusResultAbstentionReason;

export interface CorpusQuery extends CorpusPopulation { readonly fen: string; }
export type CorpusResult = RuntimeCorpusResult<CorpusPopulation>;
export interface CorpusSource { stats(query: CorpusQuery): Promise<CorpusResult>; }

const DAY = 86_400_000;
const pct = (value: number, total: number): number => Math.round(value / total * 1000) / 10;
const population = (query: CorpusQuery): CorpusPopulation => Object.freeze({ source: "lichess-explorer", ratings: query.ratings, speeds: query.speeds, since: query.since, until: query.until });
const unavailable = (query: CorpusQuery, detail: string): CorpusResult => Object.freeze({ kind: "abstention", reason: "source_unavailable", detail, population: population(query) });

export function normalizedCorpusQuery(query: CorpusQuery): CorpusQuery {
  const normalized = normalizeExplorerQuery({ ...query, fen: `${transposeKey(query.fen)} 0 1` });
  return Object.freeze({ ...normalized, source: "lichess-explorer" });
}

export function corpusUrl(query: CorpusQuery): string {
  const url = new URL(explorerUrl(normalizedCorpusQuery(query)));
  url.searchParams.set("history", "true");
  return url.toString();
}

function count(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : undefined;
}

export function parseCorpusResponse(raw: unknown, query: CorpusQuery): CorpusResult {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return unavailable(query, "invalid explorer response");
  const body = raw as Record<string, unknown>;
  const white = count(body.white), draws = count(body.draws), black = count(body.black);
  if (white === undefined || draws === undefined || black === undefined) return unavailable(query, "invalid explorer response");
  const total = white + draws + black;
  if (!Number.isSafeInteger(total)) return unavailable(query, "invalid explorer response");
  if (total < 100) return Object.freeze({ kind: "abstention", reason: "no_data_at_band", detail: `total ${total} < 100`, population: population(query) });
  const moves: { san: string; uci: string; playedCount: number; sharePct: number; white: number; draws: number; black: number }[] = [];
  if (!Array.isArray(body.moves)) return unavailable(query, "invalid explorer response");
  for (const item of body.moves) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) return unavailable(query, "invalid explorer response");
    const move = item as Record<string, unknown>;
    const mw = count(move.white), md = count(move.draws), mb = count(move.black);
    if (typeof move.san !== "string" || typeof move.uci !== "string" || mw === undefined || md === undefined || mb === undefined) return unavailable(query, "invalid explorer response");
    const playedCount = mw + md + mb;
    if (!Number.isSafeInteger(playedCount)) return unavailable(query, "invalid explorer response");
    moves.push({ san: move.san, uci: move.uci, playedCount, sharePct: pct(playedCount, total), white: mw, draws: md, black: mb });
  }
  moves.sort((a, b) => b.playedCount - a.playedCount || a.san.localeCompare(b.san));
  let newest: string | undefined, historyValid = true;
  if (Array.isArray(body.history)) {
    for (const item of body.history) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) { newest = undefined; historyValid = false; break; }
      const row = item as Record<string, unknown>;
      const month = typeof row.month === "string" ? row.month : typeof row.date === "string" ? row.date : undefined;
      const rw = count(row.white), rd = count(row.draws), rb = count(row.black);
      if (month === undefined || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || rw === undefined || rd === undefined || rb === undefined) { newest = undefined; historyValid = false; break; }
      if (rw + rd + rb > 0 && (newest === undefined || month > newest)) newest = month;
    }
  }
  return Object.freeze({ kind: "stats", total, white, draws, black, moves: Object.freeze(moves), recency: !historyValid || newest === undefined ? Object.freeze({ kind: "absent" }) : Object.freeze({ kind: "month", lastPlayedMonth: newest }), population: population(query) });
}

interface CacheEntry { readonly expiresAt: number; readonly result: CorpusResult; }
interface QueueItem { readonly key: string; readonly query: CorpusQuery; readonly resolve: (value: CorpusResult) => void; }

export class LichessCorpusSource implements CorpusSource {
  readonly #cache = new Map<string, CacheEntry>();
  readonly #inFlight = new Map<string, Promise<CorpusResult>>();
  readonly #queue: QueueItem[] = [];
  #active = false;
  #revision = 0;
  constructor(private readonly options: { readonly token: string; readonly fetcher?: ExplorerFetch; readonly now?: () => Date; readonly timeoutMs?: number; readonly health?: ProviderRegistry } ) {
    // rfc/provider-health-degradation.md §7: the retained successful answers are the registry's
    // exact-request inventory for the Explorer instance.
    options.health?.registerCacheInventory("explorer-primary", {
      validExactEntries: () => { const now = (this.options.now?.() ?? new Date()).getTime(); return [...this.#cache.values()].filter((entry) => entry.expiresAt > now).length; },
      revision: () => this.#revision,
      invalidateExcept: () => { this.#cache.clear(); this.#revision += 1; },
    });
  }

  stats(raw: CorpusQuery): Promise<CorpusResult> {
    const query = normalizedCorpusQuery(raw), key = corpusUrl(query), now = (this.options.now?.() ?? new Date()).getTime();
    const cached = this.#cache.get(key);
    if (cached !== undefined && cached.expiresAt > now) { this.#cache.delete(key); this.#cache.set(key, cached); return Promise.resolve(cached.result); }
    if (cached !== undefined) this.#cache.delete(key);
    const existing = this.#inFlight.get(key); if (existing !== undefined) return existing;
    if (this.#active && this.#queue.length >= 4) return Promise.resolve(unavailable(query, "interactive budget exceeded"));
    const promise = new Promise<CorpusResult>((resolve) => { this.#queue.push({ key, query, resolve }); this.#drain(); });
    this.#inFlight.set(key, promise); return promise;
  }

  #drain(): void {
    if (this.#active) return;
    const next = this.#queue.shift(); if (next === undefined) return;
    this.#active = true;
    void this.#fetch(next.key, next.query).then((result) => {
      this.#inFlight.delete(next.key); this.#active = false; next.resolve(result); this.#drain();
    }, () => {
      this.#inFlight.delete(next.key); this.#active = false; next.resolve(unavailable(next.query, "network error")); this.#drain();
    });
  }

  async #fetch(key: string, query: CorpusQuery): Promise<CorpusResult> {
    const health = this.options.health;
    if (health !== undefined) return this.#fetchAdmitted(health, key, query);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 4000);
    let result: CorpusResult, ttl = 0;
    try {
      const response = await (this.options.fetcher ?? fetch)(key, { signal: controller.signal, headers: { authorization: `Bearer ${this.options.token}`, "user-agent": "chess-tabiya-sourcing/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)" } });
      if (response.status >= 400) { result = unavailable(query, `HTTP ${response.status}`); if (response.status === 429 || response.status >= 500) ttl = 60_000; }
      else { try { result = parseCorpusResponse(await response.json(), query); if (result.kind === "stats" || result.reason === "no_data_at_band") ttl = DAY; } catch { result = unavailable(query, "invalid explorer response"); } }
    } catch (error) { result = unavailable(query, error instanceof DOMException && error.name === "AbortError" ? "timeout" : "network error"); }
    finally { clearTimeout(timeout); }
    if (ttl > 0) this.#cache.set(key, { expiresAt: (this.options.now?.() ?? new Date()).getTime() + ttl, result });
    while (this.#cache.size > 512) this.#cache.delete(this.#cache.keys().next().value!);
    return result;
  }

  /**
   * The health-admitted path: a NEW request passes the registry's circuit and `lichess-api` group
   * (shared with the tablebase) under the Explorer consumer deadline, and its real outcome settles
   * health. `no_data_at_band` is a successful domain answer; an HTTP/network/protocol failure is a
   * provider failure, is never cached, and is never rewritten as "no games".
   */
  async #fetchAdmitted(health: ProviderRegistry, key: string, query: CorpusQuery): Promise<CorpusResult> {
    let result: CorpusResult;
    try {
      result = await health.run("evidence.explorer_query", async ({ signal }) => {
        const response = await (this.options.fetcher ?? fetch)(key, { signal, headers: { authorization: `Bearer ${this.options.token}`, "user-agent": "chess-tabiya-sourcing/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)" } });
        if (response.status >= 400) throw new ProviderHttpError(response.status, response.headers.get("retry-after"), `HTTP ${response.status}`);
        let body: unknown;
        try { body = await response.json(); } catch { throw new SyntaxError("invalid explorer response"); }
        try { return parseCorpusResponse(body, query); } catch { throw new SyntaxError("invalid explorer response"); }
      }, classifyProviderError);
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        const availability = error.availability;
        return unavailable(query, availability.state === "unavailable" ? `provider ${availability.reason}` : availability.state === "temporarily_blocked" ? `provider temporarily blocked (${availability.reason})` : `provider ${availability.state}`);
      }
      throw error;
    }
    if (result.kind === "stats" || result.reason === "no_data_at_band") {
      this.#cache.set(key, { expiresAt: (this.options.now?.() ?? new Date()).getTime() + DAY, result });
      while (this.#cache.size > 512) this.#cache.delete(this.#cache.keys().next().value!);
      this.#revision += 1;
    }
    return result;
  }
}

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -";
export class FixtureCorpusSource implements CorpusSource {
  async stats(raw: CorpusQuery): Promise<CorpusResult> {
    const query = normalizedCorpusQuery(raw);
    if (transposeKey(query.fen) !== START) return Object.freeze({ kind: "abstention", reason: "no_data_at_band", detail: "total 37 < 100", population: population(query) });
    return parseCorpusResponse({ white: 60, draws: 20, black: 40, moves: [{ san: "e4", uci: "e2e4", white: 30, draws: 10, black: 20 }, { san: "d4", uci: "d2d4", white: 20, draws: 5, black: 15 }], history: [{ month: "2019-04", white: 1, draws: 0, black: 0 }] }, query);
  }
}

export function corpusPopulation(targetElo: number | undefined, now = new Date(), defaults: { readonly ratings?: readonly RatingGroup[]; readonly speeds?: readonly Speed[]; readonly months?: number } = {}): CorpusPopulation {
  const until = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const months = defaults.months ?? 36;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const since = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
  const ratings = targetElo === undefined ? (defaults.ratings ?? RATING_GROUPS.filter((rating) => rating !== 0)) : [([...RATING_GROUPS].reverse().find((rating) => rating <= targetElo) ?? 0)];
  return Object.freeze({ source: "lichess-explorer", ratings: Object.freeze([...ratings]), speeds: Object.freeze([...(defaults.speeds ?? ["blitz", "rapid", "classical"])]), since, until });
}
