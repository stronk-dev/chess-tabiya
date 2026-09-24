import { transposeKey } from "@chess-tabiya/runtime";
import type { AssessmentCategory } from "@chess-tabiya/schema/drill-pack";
import { ServerError } from "./errors.js";
import { countFenPieces } from "./sourcing/chess-facts.js";
import { ProviderHttpError, classifyProviderError, type ProviderRegistry } from "./provider-health.js";

export const TABLEBASE_CATEGORIES = Object.freeze(["win","syzygy-win","maybe-win","cursed-win","draw","blessed-loss","maybe-loss","syzygy-loss","loss","unknown"] as const);
export type TablebaseCategory = typeof TABLEBASE_CATEGORIES[number];
export const ASSESSMENT_CATEGORIES = Object.freeze(["win", "loss", "draw", "cursed-win", "blessed-loss"] as const satisfies readonly AssessmentCategory[]);
export const OBJECTIVE_ASSESSMENT_SETS = Object.freeze({
  win: Object.freeze(["win"] as const),
  hold: Object.freeze(["draw", "cursed-win", "blessed-loss"] as const),
  save: Object.freeze(["loss", "blessed-loss"] as const),
  resist: Object.freeze(["loss", "blessed-loss"] as const),
} satisfies Readonly<Record<"win" | "hold" | "save" | "resist", readonly TablebaseCategory[]>>);
export interface TablebaseMove { readonly uci:string; readonly san:string; readonly category:TablebaseCategory; readonly dtz:number|null; readonly preciseDtz:number|null }
export interface TablebasePosition { readonly category:TablebaseCategory; readonly dtz:number|null; readonly preciseDtz?:number|null; readonly moves:readonly TablebaseMove[] }
export interface TablebaseSource { readonly kind:"lichess"|"mock"; probe(fen:string, options?: TablebaseProbeOptions):Promise<TablebasePosition> }

export function invertTablebaseCategory(category:TablebaseCategory):TablebaseCategory { const pairs:Record<TablebaseCategory,TablebaseCategory>={win:"loss","syzygy-win":"syzygy-loss","maybe-win":"maybe-loss","cursed-win":"blessed-loss",draw:"draw","blessed-loss":"cursed-win","maybe-loss":"maybe-win","syzygy-loss":"syzygy-win",loss:"win",unknown:"unknown"};return pairs[category]; }
function category(value:unknown):TablebaseCategory{if(typeof value!=="string"||!(TABLEBASE_CATEGORIES as readonly string[]).includes(value))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an unknown category",{details:{retryAfterMs:60_000}});return value as TablebaseCategory;}
function finiteOrNull(value:unknown):number|null{if(value===null)return null;if(typeof value!=="number"||!Number.isFinite(value))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an invalid DTZ",{details:{retryAfterMs:60_000}});return value;}
export function parseTablebasePosition(raw:unknown):TablebasePosition{if(raw===null||typeof raw!=="object"||Array.isArray(raw))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an invalid response",{details:{retryAfterMs:60_000}});const body=raw as Record<string,unknown>;if(!Array.isArray(body.moves))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase response omitted legal moves",{details:{retryAfterMs:60_000}});return Object.freeze({category:category(body.category),dtz:finiteOrNull(body.dtz),preciseDtz:finiteOrNull(body.precise_dtz??null),moves:Object.freeze(body.moves.map((value)=>{if(value===null||typeof value!=="object"||Array.isArray(value))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an invalid move",{details:{retryAfterMs:60_000}});const move=value as Record<string,unknown>;if(typeof move.uci!=="string"||typeof move.san!=="string")throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an invalid move",{details:{retryAfterMs:60_000}});return Object.freeze({uci:move.uci,san:move.san,category:category(move.category),dtz:finiteOrNull(move.dtz),preciseDtz:finiteOrNull(move.precise_dtz)});} ))});}

interface CacheEntry {readonly value?:TablebasePosition;readonly error?:ServerError;readonly expiresAt:number}
/** Per-probe options: the caller's operation deadline, shared across every stage (§5). */
export interface TablebaseProbeOptions { readonly deadlineMonotonic?: number }

/**
 * The Lichess Syzygy client. With a provider-health registry attached, every NEW live request is
 * admitted by the registry (circuit, `lichess-api` group single-flight and 429 backoff shared with
 * Explorer) under the caller's deadline and settled with its real outcome; an exact retained
 * positive is served without touching health, and a failure is never cached as an answer.
 */
export class LichessTablebaseSource implements TablebaseSource {
  readonly kind = "lichess" as const;
  readonly #cache = new Map<string, CacheEntry>();
  readonly #flight = new Map<string, Promise<TablebasePosition>>();
  readonly #queue: Array<{ key: string; fen: string; deadline: number | undefined; resolve: (value: TablebasePosition) => void; reject: (error: unknown) => void }> = [];
  #active = false;
  #revision = 0;

  constructor(private readonly options: { readonly fetcher?: typeof fetch; readonly now?: () => number; readonly timeoutMs?: number; readonly health?: ProviderRegistry } = {}) {
    options.health?.registerCacheInventory("tablebase-primary", {
      validExactEntries: () => [...this.#cache.values()].filter((entry) => entry.value !== undefined).length,
      revision: () => this.#revision,
      invalidateExcept: () => { this.#cache.clear(); this.#revision += 1; },
    });
  }

  probe(fen: string, probeOptions: TablebaseProbeOptions = {}): Promise<TablebasePosition> {
    const pieces = countFenPieces(fen);
    if (pieces > 7) throw new ServerError("TABLEBASE_OUT_OF_RANGE", `Syzygy covers at most seven pieces; received ${pieces}`);
    const key = transposeKey(fen) + ` ${fen.split(" ")[4] ?? "0"}`;
    const now = this.options.now?.() ?? Date.now();
    const cached = this.#cache.get(key);
    if (cached !== undefined && (cached.value !== undefined || cached.expiresAt > now)) {
      this.#cache.delete(key);
      this.#cache.set(key, cached);
      if (cached.value !== undefined) return Promise.resolve(cached.value);
      return Promise.reject(cached.error);
    }
    if (cached !== undefined) { this.#cache.delete(key); this.#revision += 1; }
    const existing = this.#flight.get(key);
    if (existing !== undefined) return existing;
    if (this.#active && this.#queue.length >= 4) return Promise.reject(new ServerError("TABLEBASE_UNAVAILABLE", "Interactive tablebase queue is full", { details: { retryAfterMs: 4_000 } }));
    const promise = new Promise<TablebasePosition>((resolve, reject) => {
      this.#queue.push({ key, fen, deadline: probeOptions.deadlineMonotonic, resolve, reject });
      this.#drain();
    });
    this.#flight.set(key, promise);
    return promise;
  }

  #drain(): void {
    if (this.#active) return;
    const next = this.#queue.shift();
    if (next === undefined) return;
    this.#active = true;
    void this.#fetch(next.key, next.fen, next.deadline).then(next.resolve, next.reject).finally(() => {
      this.#flight.delete(next.key);
      this.#active = false;
      this.#drain();
    });
  }

  async #request(fen: string, signal: AbortSignal): Promise<TablebasePosition> {
    const response = await (this.options.fetcher ?? fetch)(`https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`, { signal, headers: { "user-agent": "chess-tabiya/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)" } });
    if (!response.ok) throw new ProviderHttpError(response.status, response.headers.get("retry-after"), `Tablebase HTTP ${response.status}`);
    return parseTablebasePosition(await response.json());
  }

  #retain(key: string, value: TablebasePosition): void {
    this.#cache.set(key, { value, expiresAt: Number.POSITIVE_INFINITY });
    while (this.#cache.size > 512) this.#cache.delete(this.#cache.keys().next().value!);
    this.#revision += 1;
  }

  async #fetch(key: string, fen: string, deadline: number | undefined): Promise<TablebasePosition> {
    const health = this.options.health;
    if (health !== undefined) {
      const value = await health.run("evidence.tablebase_probe", ({ signal }) => this.#request(fen, signal), (error) => error instanceof ServerError ? { kind: "failure", reason: "protocol" } : classifyProviderError(error), deadline === undefined ? {} : { deadlineMonotonic: deadline });
      this.#retain(key, value);
      return value;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 4_000);
    try {
      const value = await this.#request(fen, controller.signal);
      this.#retain(key, value);
      return value;
    } catch (error) {
      const typed = error instanceof ServerError
        ? error
        : error instanceof ProviderHttpError
          ? new ServerError("TABLEBASE_UNAVAILABLE", error.message, { details: { retryAfterMs: error.status === 429 || error.status >= 500 ? 60_000 : 0 } })
          : new ServerError("TABLEBASE_UNAVAILABLE", error instanceof DOMException && error.name === "AbortError" ? "Tablebase request timed out" : "Tablebase request failed", { details: { retryAfterMs: 60_000 } });
      this.#cache.set(key, { error: typed, expiresAt: (this.options.now?.() ?? Date.now()) + 60_000 });
      throw typed;
    } finally {
      clearTimeout(timer);
    }
  }
}

export class FixtureTablebaseSource implements TablebaseSource {
  readonly kind = "mock" as const;
  readonly configured: boolean;

  constructor(
    private readonly positions: Readonly<Record<string, TablebasePosition>> = {},
  ) {
    this.configured = Object.keys(positions).length > 0;
  }

  async probe(fen: string): Promise<TablebasePosition> {
    if (countFenPieces(fen) > 7) {
      throw new ServerError(
        "TABLEBASE_OUT_OF_RANGE",
        "Syzygy covers at most seven pieces",
      );
    }
    const found = this.positions[transposeKey(fen)] ?? this.positions[fen];
    if (found === undefined) {
      throw new ServerError(
        "TABLEBASE_UNAVAILABLE",
        "No fixture tablebase position",
        { details: { retryAfterMs: 0 } },
      );
    }
    return found;
  }
}
