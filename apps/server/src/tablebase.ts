import { transposeKey } from "@chess-tabiya/runtime";
import type { AssessmentCategory } from "@chess-tabiya/schema/drill-pack";
import { ServerError } from "./errors.js";
import { countFenPieces } from "./sourcing/chess-facts.js";

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
export interface TablebaseSource { readonly kind:"lichess"|"mock"; probe(fen:string):Promise<TablebasePosition> }

export function invertTablebaseCategory(category:TablebaseCategory):TablebaseCategory { const pairs:Record<TablebaseCategory,TablebaseCategory>={win:"loss","syzygy-win":"syzygy-loss","maybe-win":"maybe-loss","cursed-win":"blessed-loss",draw:"draw","blessed-loss":"cursed-win","maybe-loss":"maybe-win","syzygy-loss":"syzygy-win",loss:"win",unknown:"unknown"};return pairs[category]; }
function category(value:unknown):TablebaseCategory{if(typeof value!=="string"||!(TABLEBASE_CATEGORIES as readonly string[]).includes(value))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an unknown category",{details:{retryAfterMs:60_000}});return value as TablebaseCategory;}
function finiteOrNull(value:unknown):number|null{if(value===null)return null;if(typeof value!=="number"||!Number.isFinite(value))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an invalid DTZ",{details:{retryAfterMs:60_000}});return value;}
export function parseTablebasePosition(raw:unknown):TablebasePosition{if(raw===null||typeof raw!=="object"||Array.isArray(raw))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an invalid response",{details:{retryAfterMs:60_000}});const body=raw as Record<string,unknown>;if(!Array.isArray(body.moves))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase response omitted legal moves",{details:{retryAfterMs:60_000}});return Object.freeze({category:category(body.category),dtz:finiteOrNull(body.dtz),preciseDtz:finiteOrNull(body.precise_dtz??null),moves:Object.freeze(body.moves.map((value)=>{if(value===null||typeof value!=="object"||Array.isArray(value))throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an invalid move",{details:{retryAfterMs:60_000}});const move=value as Record<string,unknown>;if(typeof move.uci!=="string"||typeof move.san!=="string")throw new ServerError("TABLEBASE_UNAVAILABLE","Tablebase returned an invalid move",{details:{retryAfterMs:60_000}});return Object.freeze({uci:move.uci,san:move.san,category:category(move.category),dtz:finiteOrNull(move.dtz),preciseDtz:finiteOrNull(move.precise_dtz)});} ))});}

interface CacheEntry {readonly value?:TablebasePosition;readonly error?:ServerError;readonly expiresAt:number}
export class LichessTablebaseSource implements TablebaseSource{
  readonly kind="lichess" as const;readonly #cache=new Map<string,CacheEntry>();readonly #flight=new Map<string,Promise<TablebasePosition>>();readonly #queue:Array<{key:string;fen:string;resolve:(value:TablebasePosition)=>void;reject:(error:unknown)=>void}>=[];#active=false;
  constructor(private readonly options:{readonly fetcher?:typeof fetch;readonly now?:()=>number;readonly timeoutMs?:number}={}){}
  probe(fen:string):Promise<TablebasePosition>{const pieces=countFenPieces(fen);if(pieces>7)throw new ServerError("TABLEBASE_OUT_OF_RANGE",`Syzygy covers at most seven pieces; received ${pieces}`);const key=transposeKey(fen)+` ${fen.split(" ")[4]??"0"}`;const now=this.options.now?.()??Date.now(),cached=this.#cache.get(key);if(cached!==undefined&&(cached.value!==undefined||cached.expiresAt>now)){this.#cache.delete(key);this.#cache.set(key,cached);if(cached.value!==undefined)return Promise.resolve(cached.value);return Promise.reject(cached.error);}if(cached!==undefined)this.#cache.delete(key);const existing=this.#flight.get(key);if(existing!==undefined)return existing;if(this.#active&&this.#queue.length>=4)return Promise.reject(new ServerError("TABLEBASE_UNAVAILABLE","Interactive tablebase queue is full",{details:{retryAfterMs:4_000}}));const promise=new Promise<TablebasePosition>((resolve,reject)=>{this.#queue.push({key,fen,resolve,reject});this.#drain();});this.#flight.set(key,promise);return promise;}
  #drain(){if(this.#active)return;const next=this.#queue.shift();if(next===undefined)return;this.#active=true;void this.#fetch(next.key,next.fen).then(next.resolve,next.reject).finally(()=>{this.#flight.delete(next.key);this.#active=false;this.#drain();});}
  async #fetch(key:string,fen:string):Promise<TablebasePosition>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.options.timeoutMs??4_000);try{const response=await(this.options.fetcher??fetch)(`https://tablebase.lichess.org/standard?fen=${encodeURIComponent(fen)}`,{signal:controller.signal,headers:{"user-agent":"chess-tabiya/0.0.0 (+https://github.com/stronk-dev/chess-tabiya; repository-owner)"}});if(!response.ok)throw new ServerError("TABLEBASE_UNAVAILABLE",`Tablebase HTTP ${response.status}`,{details:{retryAfterMs:response.status===429||response.status>=500?60_000:0}});const value=parseTablebasePosition(await response.json());this.#cache.set(key,{value,expiresAt:Number.POSITIVE_INFINITY});while(this.#cache.size>512)this.#cache.delete(this.#cache.keys().next().value!);return value;}catch(error){const typed=error instanceof ServerError?error:new ServerError("TABLEBASE_UNAVAILABLE",error instanceof DOMException&&error.name==="AbortError"?"Tablebase request timed out":"Tablebase request failed",{details:{retryAfterMs:60_000}});this.#cache.set(key,{error:typed,expiresAt:(this.options.now?.()??Date.now())+60_000});throw typed;}finally{clearTimeout(timer);}}
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
