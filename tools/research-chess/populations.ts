// Shared research-only corpus projection. Not production code.
import { readFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import type { Move, Role } from "chessops/types";
import { makeUci, parseUci } from "chessops/util";

import { transitions } from "../r1r2-primitives-harness/corpus.js";
import { researchPosition } from "./legal-exchange.js";

const IMPORTED = new URL("../r2-selection-harness/imported-sample.pgn", import.meta.url).pathname;
const TARGET_PLIES = new Set([8, 16, 24, 32, 40, 48]);
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];

export interface ResearchRow {
  readonly id: string;
  readonly parentFen: string;
  readonly uci: string;
}

export interface ResearchOutcome {
  readonly uci: string;
  readonly fen: string;
}

export function playedFen(beforeFen: string, uci: string): string {
  const pos = researchPosition(beforeFen);
  const move = parseUci(uci);
  if (move === undefined || !pos.isLegal(move)) throw new Error(`illegal move ${uci} from ${beforeFen}`);
  pos.play(move);
  return makeFen(pos.toSetup());
}

export function legalOutcomes(fen: string): readonly ResearchOutcome[] {
  const pos = researchPosition(fen);
  const result: ResearchOutcome[] = [];
  for (const [from, dests] of pos.allDests()) for (const to of dests) {
    const roles: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
      ? PROMOTIONS
      : [undefined];
    for (const promotion of roles) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (!pos.isLegal(move)) continue;
      const next = pos.clone();
      next.play(move);
      result.push({ uci: makeUci(move), fen: makeFen(next.toSetup()) });
    }
  }
  return result;
}

function speed(event: string): "bullet" | "blitz" | "rapid" | undefined {
  if (/UltraBullet/u.test(event)) return undefined;
  if (/Bullet/u.test(event)) return "bullet";
  if (/Blitz/u.test(event)) return "blitz";
  if (/Rapid/u.test(event)) return "rapid";
  return undefined;
}

function band(rating: number): "1000-1399" | "1400-1799" | "1800-2199" | undefined {
  if (rating >= 1000 && rating <= 1399) return "1000-1399";
  if (rating >= 1400 && rating <= 1799) return "1400-1799";
  if (rating >= 1800 && rating <= 2199) return "1800-2199";
  return undefined;
}

export function importedRows(): readonly ResearchRow[] {
  const blocks = readFileSync(IMPORTED, "utf8").split(/\n(?=\[Event )/u);
  const accepted = new Map<string, number>();
  const rows: ResearchRow[] = [];
  const full = (): boolean => ["bullet", "blitz", "rapid"].every((time) =>
    ["1000-1399", "1400-1799", "1800-2199"].every((elo) => (accepted.get(`${time}/${elo}`) ?? 0) >= 12));
  for (const block of blocks) {
    if (full()) break;
    let game;
    try { [game] = parsePgn(block); }
    catch { continue; }
    if (game === undefined || game.headers.get("Result") === "*" ||
      game.headers.get("Variant") !== undefined && game.headers.get("Variant") !== "Standard") continue;
    const time = speed(game.headers.get("Event") ?? "");
    const elo = band((Number(game.headers.get("WhiteElo")) + Number(game.headers.get("BlackElo"))) / 2);
    if (time === undefined || elo === undefined) continue;
    const cell = `${time}/${elo}`;
    if ((accepted.get(cell) ?? 0) >= 12) continue;
    const pos: Chess = startingPosition(game.headers).unwrap();
    const candidates: ResearchRow[] = [];
    let ply = 0;
    let legal = true;
    for (const data of game.moves.mainline()) {
      const move = parseSan(pos, data.san);
      if (move === undefined || !pos.isLegal(move)) { legal = false; break; }
      ply += 1;
      const parentFen = makeFen(pos.toSetup());
      const uci = makeUci(move);
      pos.play(move);
      if (TARGET_PLIES.has(ply)) candidates.push({ id: `${game.headers.get("Site") ?? cell}#${ply}`, parentFen, uci });
    }
    if (!legal || candidates.length === 0) continue;
    accepted.set(cell, (accepted.get(cell) ?? 0) + 1);
    rows.push(...candidates);
  }
  if (!full()) throw new Error(`imported fixture did not fill every stratum: ${JSON.stringify(Object.fromEntries(accepted))}`);
  return rows;
}

export function authoredRows(): readonly ResearchRow[] {
  return transitions().map((row) => ({ id: `${row.pack}/${row.nodeId}`, parentFen: row.parentFen, uci: row.uci }));
}
