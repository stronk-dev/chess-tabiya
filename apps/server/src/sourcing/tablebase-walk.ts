import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalizeJson, type DrillPackDefinition, type SpineNode } from "@chess-tabiya/schema/drill-pack";
import { transposeKey } from "@chess-tabiya/runtime";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeSan } from "chessops/san";
import { makeUci, parseUci } from "chessops/util";

import { countFenPieces } from "./chess-facts.js";
import { liveTablebaseQuery, type TablebaseAnswer, type TablebasePayload } from "./syzygy.js";
import { learnerCategory } from "./tablebase-category.js";
import { readJson, writeCanonicalJson } from "./canonical.js";
import { legalMoves } from "./legal-moves.js";
import { SourcingError } from "./types.js";

const OFFLINE_FIXTURES = resolve("apps/server/src/sourcing/fixtures/verify-draft.json");
interface WalkPosition { readonly fen: string; readonly pointer: string; readonly ply: number }

function position(fen: string): Chess {
  try { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
  catch { throw new SourcingError("DRAFT_PACK_INVALID", `invalid FEN: ${fen}`); }
}

function after(fen: string, uci: string): string {
  const board = position(fen), move = parseUci(uci);
  if (move === undefined || !board.isLegal(move)) throw new SourcingError("DRAFT_PACK_INVALID", `illegal move ${uci}`);
  board.play(move);
  return makeFen(board.toSetup());
}

function packPositions(pack: DrillPackDefinition): readonly WalkPosition[] {
  const values: WalkPosition[] = [{ fen: pack.start.fen, pointer: "/start/fen", ply: 0 }];
  const walk = (nodes: readonly SpineNode[], fen: string, pointer: string, ply: number): void => {
    nodes.forEach((node, index) => {
      const next = after(fen, node.moveUci);
      values.push({ fen: next, pointer: `${pointer}/${index}/moveUci`, ply: ply + 1 });
      walk(node.children, next, `${pointer}/${index}/children`, ply + 1);
    });
  };
  walk(pack.spine ?? [], pack.start.fen, "/spine", 0);
  return Object.freeze(values);
}

function terminal(payload: TablebasePayload): string | null {
  if (payload.checkmate) return "checkmate";
  if (payload.stalemate) return "stalemate";
  if (payload.insufficient_material) return "insufficient_material";
  return null;
}

async function offlineFixtures(): Promise<Record<string, TablebasePayload>> {
  return JSON.parse(await readFile(OFFLINE_FIXTURES, "utf8")) as Record<string, TablebasePayload>;
}

export interface TablebaseWalkOptions {
  readonly pack?: DrillPackDefinition;
  readonly fens?: readonly string[];
  readonly enumerate?: "decision" | "all" | "none";
  readonly maxQueries?: number;
  readonly offline?: boolean;
  readonly query?: (fen: string) => Promise<TablebaseAnswer>;
  readonly cacheRoot?: string;
}

function cachePath(root: string, fen: string): string {
  const halfmoves = fen.split(" ")[4] ?? "0";
  return resolve(root, `${encodeURIComponent(transposeKey(fen))}-${halfmoves}.json`);
}

export async function tablebaseWalk(options: TablebaseWalkOptions): Promise<Readonly<Record<string, unknown>>> {
  const learner = options.pack?.start.side ?? "white";
  const positions = options.pack === undefined
    ? (options.fens ?? []).map((fen, index) => ({ fen, pointer: `/fens/${index}`, ply: 0 }))
    : packPositions(options.pack);
  const fixtures = options.offline ? await offlineFixtures() : undefined;
  const cacheRoot = options.cacheRoot ?? resolve("content/sources/syzygy");
  const maxQueries = options.maxQueries ?? 400;
  let queries = 0;
  const abstentions: unknown[] = [];
  const probe = async (fen: string, pointer: string): Promise<TablebasePayload | undefined> => {
    if (countFenPieces(fen) > 7) { abstentions.push({ pointer, fen, reason: "out_of_range", detail: `${countFenPieces(fen)} pieces; Syzygy covers <=7` }); return undefined; }
    if (queries >= maxQueries) throw new SourcingError("WALK_QUERY_BUDGET_EXCEEDED", `tablebase walk exceeded ${maxQueries} queries`);
    queries += 1;
    if (fixtures !== undefined) {
      const value = fixtures[fen];
      if (value === undefined) { abstentions.push({ pointer, fen, reason: "offline_fixture_missing", detail: "offline fixture has no result for this successor" }); return undefined; }
      return value;
    }
    const path = cachePath(cacheRoot, fen);
    try {
      return await readJson(path) as TablebasePayload;
    } catch {
      const payload = (await (options.query ?? liveTablebaseQuery)(fen)).payload;
      await writeCanonicalJson(path, payload);
      return payload;
    }
  };
  const nodes: unknown[] = [];
  for (const item of positions) {
    const board = position(item.fen);
    const root = await probe(item.fen, item.pointer);
    const shouldEnumerate = (options.enumerate ?? "decision") === "all" || ((options.enumerate ?? "decision") === "decision" && board.turn === learner);
    const moves: unknown[] = [];
    if (shouldEnumerate) for (const move of legalMoves(board)) {
      const next = board.clone();
      const san = makeSan(board, move), uci = makeUci(move);
      next.play(move);
      const fen = makeFen(next.toSetup()), answer = await probe(fen, `${item.pointer}/moves/${uci}`);
      if (answer !== undefined) moves.push({ uci, san, learnerCategory: learnerCategory(next.turn, answer.category as import("../tablebase.js").TablebaseCategory, learner), dtz: answer.dtz, dtm: answer.dtm, terminal: terminal(answer) });
    }
    nodes.push({ pointer: item.pointer, fen: item.fen, ply: item.ply, sideToMove: board.turn, pieceCount: countFenPieces(item.fen), learnerCategory: root === undefined ? null : learnerCategory(board.turn, root.category as import("../tablebase.js").TablebaseCategory, learner), dtz: root?.dtz ?? null, dtm: root?.dtm ?? null, terminal: root === undefined ? null : terminal(root), moves });
  }
  return Object.freeze({ schema: "tabiya.sourcing.walk.v1", subject: options.pack === undefined ? { kind: "fens" } : { kind: "pack", packId: options.pack.id, learnerSide: learner }, queries, nodes, abstentions, spineTerminal: null });
}

function args(values: readonly string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index], value = values[index + 1];
    if (!key?.startsWith("--") || value === undefined) continue;
    map.set(key.slice(2), value); index += 1;
  }
  return map;
}

async function main(): Promise<number> {
  try {
    const values = args(process.argv.slice(2));
    const file = values.get("file"), fensFile = values.get("fens");
    if ((file === undefined) === (fensFile === undefined)) throw new SourcingError("INVALID_REQUEST", "provide exactly one of --file or --fens");
    const pack = file === undefined ? undefined : JSON.parse(await readFile(resolve(file), "utf8")) as DrillPackDefinition;
    const fens = fensFile === undefined ? undefined : (await readFile(resolve(fensFile), "utf8")).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const report = await tablebaseWalk({ ...(pack === undefined ? {} : { pack }), ...(fens === undefined ? {} : { fens }), enumerate: (values.get("enumerate") ?? "decision") as "decision" | "all" | "none", maxQueries: Number(values.get("max-queries") ?? "400"), offline: process.env.OFFLINE === "1" });
    const out = values.get("out");
    if (out === undefined) console.log(canonicalizeJson(report)); else await writeCanonicalJson(resolve(out), report);
    return 0;
  } catch (error) {
    if (error instanceof SourcingError) console.error(`${error.code}: ${error.message}`); else console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1]?.endsWith("tablebase-walk.js")) process.exitCode = await main();
