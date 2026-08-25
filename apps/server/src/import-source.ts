import { makePgn, parsePgn, type PgnNodeData, type ChildNode } from "chessops/pgn";

import { ServerError } from "./errors.js";

export type ImportSource =
  | { readonly kind: "pgn"; readonly pgn: string }
  | { readonly kind: "lichess"; readonly url: string };

export interface ResolvedImportSource {
  readonly pgn: string;
  readonly sourceKind: "pgn_paste" | "lichess_url";
  readonly sourceUrl: string | null;
  readonly licenceNote: string;
}

export interface ResolvedStudySource {
  readonly pgn: string;
  readonly sourceKind: "lichess_study";
  readonly sourceUrl: string;
  readonly licenceNote: string;
}

let serial = Promise.resolve();

function stripNodeAnnotations(node: ChildNode<PgnNodeData>): void {
  node.data = { san: node.data.san };
  for (const child of node.children) stripNodeAnnotations(child);
}

export function stripPgnAnnotations(pgn: string): string {
  return parsePgn(pgn).map((game) => {
    delete game.comments;
    for (const child of game.moves.children) stripNodeAnnotations(child);
    return makePgn(game);
  }).join("\n\n");
}

export function normalizeLichessStudyUrl(value:string):{studyId:string;url:string}{
  let url:URL;try{url=new URL(value);}catch{throw new ServerError("IMPORT_SOURCE_UNSUPPORTED","Source must be a public lichess study URL");}
  if(url.protocol!=="https:"||(url.hostname!=="lichess.org"&&url.hostname!=="www.lichess.org")){
    const hint=url.hostname.endsWith("chess.com")?"; export the repertoire as PGN and paste it":"";
    throw new ServerError("IMPORT_SOURCE_UNSUPPORTED",`Only public lichess study URLs can be fetched${hint}`);
  }
  const parts=url.pathname.split("/").filter(Boolean);if(parts[0]!=="study"||!/^[A-Za-z0-9]{8}$/.test(parts[1]??""))throw new ServerError("IMPORT_SOURCE_UNSUPPORTED","The lichess URL is not a study URL");
  return {studyId:parts[1]!,url:`https://lichess.org/study/${parts[1]!}`};
}

export async function resolveStudySource(url:string,fetchImpl:typeof fetch=fetch):Promise<ResolvedStudySource>{
  const normalized=normalizeLichessStudyUrl(url);
  const task=serial.then(async()=>{const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10_000);try{
    const response=await fetchImpl(`https://lichess.org/api/study/${normalized.studyId}.pgn`,{headers:{Accept:"application/x-chess-pgn","User-Agent":"chess-tabiya/repertoire-import"},signal:controller.signal});
    if(response.status===404)throw new ServerError("IMPORT_SOURCE_NOT_FOUND","Lichess study was not found");
    if(response.status===429||response.status>=500)throw new ServerError("IMPORT_SOURCE_UNAVAILABLE","Lichess study export is temporarily unavailable",{details:{retryAfter:response.headers.get("retry-after")??undefined}});
    if(!response.ok)throw new ServerError("IMPORT_SOURCE_UNAVAILABLE",`Lichess study export failed with HTTP ${response.status}`);
    return Object.freeze({pgn:stripPgnAnnotations(await response.text()),sourceKind:"lichess_study" as const,sourceUrl:normalized.url,licenceNote:`no-rights-asserted: public lichess study export ${normalized.url}; annotations stripped; retrieved ${new Date().toISOString()}`});
  }catch(error){if(error instanceof ServerError)throw error;throw new ServerError("IMPORT_SOURCE_UNAVAILABLE","Lichess study export is unavailable",{cause:error});}finally{clearTimeout(timeout);}});
  serial=task.then(()=>undefined,()=>undefined);return task;
}

export function normalizeLichessGameUrl(value: string): { gameId: string; url: string } {
  let url: URL;
  try { url = new URL(value); } catch { throw new ServerError("IMPORT_SOURCE_UNSUPPORTED", "Source must be a lichess game URL or pasted PGN"); }
  if (url.protocol !== "https:" || (url.hostname !== "lichess.org" && url.hostname !== "www.lichess.org")) {
    const hint = url.hostname.endsWith("chess.com") ? "; download or copy the PGN from chess.com and paste it" : "";
    throw new ServerError("IMPORT_SOURCE_UNSUPPORTED", `Only public lichess game URLs can be fetched${hint}`);
  }
  const segment = url.pathname.split("/").filter(Boolean)[0] ?? "";
  if (!/^[A-Za-z0-9]{8}(?:[A-Za-z0-9]{4})?$/.test(segment)) {
    throw new ServerError("IMPORT_SOURCE_UNSUPPORTED", "The lichess URL is not an individual game URL");
  }
  const gameId = segment.slice(0, 8);
  return { gameId, url: `https://lichess.org/${gameId}` };
}

export async function resolveImportSource(
  source: ImportSource,
  fetchImpl: typeof fetch = fetch,
): Promise<ResolvedImportSource> {
  if (source.kind === "pgn") {
    return Object.freeze({ pgn: source.pgn, sourceKind: "pgn_paste", sourceUrl: null, licenceNote: "no-rights-asserted: learner-supplied bytes" });
  }
  const normalized = normalizeLichessGameUrl(source.url);
  const task = serial.then(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const endpoint = new URL(`https://lichess.org/game/export/${normalized.gameId}`);
      endpoint.search = "moves=true&tags=true&clocks=false&evals=false&opening=false&literate=false";
      const response = await fetchImpl(endpoint, {
        headers: { Accept: "application/x-chess-pgn", "User-Agent": "chess-tabiya/own-game-import" },
        signal: controller.signal,
      });
      if (response.status === 404) throw new ServerError("IMPORT_SOURCE_NOT_FOUND", "Lichess game was not found");
      if (response.status === 429 || response.status >= 500) {
        throw new ServerError("IMPORT_SOURCE_UNAVAILABLE", "Lichess game export is temporarily unavailable", {
          details: { retryAfter: response.headers.get("retry-after") ?? undefined },
        });
      }
      if (!response.ok) throw new ServerError("IMPORT_SOURCE_UNAVAILABLE", `Lichess export failed with HTTP ${response.status}`);
      return Object.freeze({
        pgn: await response.text(),
        sourceKind: "lichess_url" as const,
        sourceUrl: normalized.url,
        licenceNote: `no-rights-asserted: public lichess export ${normalized.url}; retrieved ${new Date().toISOString()}`,
      });
    } catch (error) {
      if (error instanceof ServerError) throw error;
      throw new ServerError("IMPORT_SOURCE_UNAVAILABLE", "Lichess game export is unavailable", { cause: error });
    } finally { clearTimeout(timeout); }
  });
  serial = task.then(() => undefined, () => undefined);
  return task;
}
