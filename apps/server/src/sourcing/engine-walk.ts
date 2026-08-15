import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { canonicalizeJson, type DrillPackDefinition, type SpineNode } from "@chess-tabiya/schema/drill-pack";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

import { writeCanonicalJson } from "./canonical.js";
import { countFenPieces } from "./chess-facts.js";
import { createPositionSeedEngineEvaluator, type PositionSeedEngineEvaluator } from "./position-seeds.js";
import { SourcingError } from "./types.js";

interface WalkPosition { readonly fen: string; readonly pointer: string; readonly ply: number }

function after(fen: string, uci: string): string {
  const board = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const move = parseUci(uci);
  if (move === undefined || !board.isLegal(move)) throw new SourcingError("DRAFT_PACK_INVALID", `illegal move ${uci}`);
  board.play(move);
  return makeFen(board.toSetup());
}

function positions(pack: DrillPackDefinition): readonly WalkPosition[] {
  const values: WalkPosition[] = [{ fen: pack.start.fen, pointer: "/start/fen", ply: 0 }];
  const byNode = new Map<string, { readonly fen: string; readonly ply: number }>();
  const walk = (nodes: readonly SpineNode[], fen: string, pointer: string, ply: number): void => {
    nodes.forEach((node, index) => {
      const next = after(fen, node.moveUci), nextPly = ply + 1;
      byNode.set(node.id, { fen: next, ply: nextPly });
      values.push({ fen: next, pointer: `${pointer}/${index}/moveUci`, ply: nextPly });
      walk(node.children, next, `${pointer}/${index}/children`, nextPly);
    });
  };
  walk(pack.spine ?? [], pack.start.fen, "/spine", 0);
  (pack.deviations ?? []).forEach((deviation, index) => {
    const anchor = "spineNodeId" in deviation.at ? byNode.get(deviation.at.spineNodeId) : "fen" in deviation.at ? { fen: deviation.at.fen, ply: 0 } : { fen: pack.start.fen, ply: 0 };
    if (anchor === undefined) throw new SourcingError("DRAFT_PACK_INVALID", `/deviations/${index}/at references an unknown spine node`);
    values.push({ fen: after(anchor.fen, deviation.moveUci), pointer: `/deviations/${index}/moveUci`, ply: anchor.ply + 1 });
  });
  return Object.freeze(values);
}

export interface EngineWalkOptions {
  readonly pack: DrillPackDefinition;
  readonly enumerate?: "decision" | "none" | "all";
  readonly maxQueries?: number;
  readonly evaluate?: PositionSeedEngineEvaluator;
  readonly command?: string;
}

export async function engineWalk(options: EngineWalkOptions): Promise<Readonly<Record<string, unknown>>> {
  if (options.enumerate === "all") throw new SourcingError("WALK_ENUMERATE_UNSUPPORTED", "engine walk supports decision or none; all legal moves is a different analysis job");
  const values = positions(options.pack);
  const maxQueries = options.maxQueries ?? 400;
  if (values.length > maxQueries) throw new SourcingError("WALK_QUERY_BUDGET_EXCEEDED", `engine walk exceeded ${maxQueries} queries`);
  let owned: Awaited<ReturnType<typeof createPositionSeedEngineEvaluator>> | undefined;
  const evaluate = options.evaluate ?? (owned = await createPositionSeedEngineEvaluator(options.command ?? "stockfish")).evaluate;
  const nodes: unknown[] = [];
  try {
    for (const value of values) {
      const answer = await evaluate(value.fen);
      const board = Chess.fromSetup(parseFen(value.fen).unwrap()).unwrap();
      nodes.push({ pointer: value.pointer, fen: value.fen, ply: value.ply, sideToMove: board.turn, pieceCount: countFenPieces(value.fen), ...(Number.isInteger(answer.values.centipawns) ? { cp: answer.values.centipawns } : { mateIn: answer.values.mateIn }), depth: answer.values.depth, perspective: "white", moves: [] });
    }
  } finally { await owned?.close(); }
  return Object.freeze({ schema: "tabiya.sourcing.walk.v1", subject: { kind: "pack", packId: options.pack.id, learnerSide: options.pack.start.side, instrument: "engine" }, queries: values.length, nodes, abstentions: [], spineTerminal: null });
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
    const values = args(process.argv.slice(2)), file = values.get("file");
    if (file === undefined) throw new SourcingError("INVALID_REQUEST", "provide --file");
    const pack = JSON.parse(await readFile(resolve(file), "utf8")) as DrillPackDefinition;
    const report = await engineWalk({ pack, enumerate: (values.get("enumerate") ?? "decision") as "decision" | "none" | "all", maxQueries: Number(values.get("max-queries") ?? "400") });
    const out = values.get("out");
    if (out === undefined) console.log(canonicalizeJson(report)); else await writeCanonicalJson(resolve(out), report);
    return 0;
  } catch (error) {
    if (error instanceof SourcingError) console.error(`${error.code}: ${error.message}`); else console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (process.argv[1]?.endsWith("engine-walk.js")) process.exitCode = await main();
