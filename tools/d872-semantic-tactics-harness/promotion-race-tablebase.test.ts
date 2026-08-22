// DISPOSABLE research harness — D872/Wave C promotion-race/tablebase arm. Not production code.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import type { Color, Move, Role, Square } from "chessops/types";
import { describe, expect, it } from "vitest";

const DRAFTS = new URL("../../content/drafts/", import.meta.url).pathname;
const OUTPUT = new URL("./promotion-race-tablebase-output.md", import.meta.url).pathname;
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
type Result = "win" | "draw" | "loss";

interface Recorded {
  readonly fen: string;
  readonly category: string;
  readonly dtz: number | null;
  readonly preciseDtz: number | null;
  readonly sources: readonly string[];
}

function records(): readonly Recorded[] {
  const byFen = new Map<string, Recorded>();
  for (const file of readdirSync(DRAFTS).filter((value) => value.endsWith(".evidence.json")).sort()) {
    const body = JSON.parse(readFileSync(join(DRAFTS, file), "utf8")) as { records?: readonly { kind?: unknown; values?: Record<string, unknown> }[] };
    for (const record of body.records ?? []) {
      if (record.kind !== "tablebase_result" || typeof record.values?.fen !== "string" || typeof record.values.category !== "string") continue;
      const fen = record.values.fen;
      const found = byFen.get(fen);
      if (found !== undefined) {
        if (found.category !== record.values.category) throw new TypeError(`Conflicting categories for ${fen}`);
        byFen.set(fen, { ...found, sources: [...found.sources, file] });
      } else {
        byFen.set(fen, {
          fen,
          category: record.values.category,
          dtz: typeof record.values.dtz === "number" ? record.values.dtz : null,
          preciseDtz: typeof record.values.precise_dtz === "number" ? record.values.precise_dtz : null,
          sources: [file],
        });
      }
    }
  }
  return [...byFen.values()];
}

function result(category: string): Result | undefined {
  if (["win", "syzygy-win", "maybe-win", "cursed-win"].includes(category)) return "win";
  if (["loss", "syzygy-loss", "maybe-loss", "blessed-loss"].includes(category)) return "loss";
  if (category === "draw") return "draw";
  return undefined;
}

function legalMoves(pos: Chess): readonly Move[] {
  const values: Move[] = [];
  for (const [from, dests] of pos.allDests()) for (const to of dests) {
    const roles: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56)
      ? PROMOTIONS
      : [undefined];
    for (const promotion of roles) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (pos.isLegal(move)) values.push(move);
    }
  }
  return values;
}

function pawns(pos: Chess, color: Color): readonly Square[] {
  return [...pos.board[color]].filter((square) => pos.board.getRole(square) === "pawn");
}

function rank(square: Square): number { return Math.floor(square / 8); }

function unblockedPushes(pos: Chess, pawn: Square, color: Color): number | undefined {
  const step = color === "white" ? 8 : -8;
  const promotionRank = color === "white" ? 7 : 0;
  let cursor = pawn;
  let squares = 0;
  while (rank(cursor) !== promotionRank) {
    cursor = (cursor + step) as Square;
    if (pos.board.get(cursor) !== undefined) return undefined;
    squares += 1;
  }
  const startingRank = color === "white" ? 1 : 6;
  return squares - (rank(pawn) === startingRank && squares >= 2 ? 1 : 0);
}

function fastestArrivalPly(pos: Chess, color: Color): number | undefined {
  const pushes = pawns(pos, color).flatMap((pawn) => {
    const value = unblockedPushes(pos, pawn, color);
    return value === undefined ? [] : [value];
  });
  if (pushes.length === 0) return undefined;
  const moves = Math.min(...pushes);
  return 2 * moves - (pos.turn === color ? 1 : 0);
}

function geometricRace(pos: Chess): Result | undefined {
  const own = fastestArrivalPly(pos, pos.turn);
  const other = fastestArrivalPly(pos, pos.turn === "white" ? "black" : "white");
  if (own === undefined || other === undefined) return undefined;
  return own < other ? "win" : own > other ? "loss" : "draw";
}

function immediatePromotions(pos: Chess): number {
  return legalMoves(pos).filter((move) => "promotion" in move && move.promotion !== undefined).length;
}

function categoryCounts(values: readonly Result[]): string {
  const cells = { win: 0, draw: 0, loss: 0 };
  for (const value of values) cells[value] += 1;
  return `${cells.win} / ${cells.draw} / ${cells.loss}`;
}

describe("D872 exact promotion geometry joined to recorded Syzygy", () => {
  it("tests geometric race predictions against exact outcome rather than naming them as outcome", () => {
    const source = records();
    const rows = source.flatMap((record) => {
      const outcome = result(record.category);
      if (outcome === undefined) return [];
      const pos = Chess.fromSetup(parseFen(record.fen).unwrap()).unwrap();
      const pieces = [...pos.board].map(([, piece]) => piece);
      const purePawn = pieces.every((piece) => piece.role === "king" || piece.role === "pawn");
      const race = geometricRace(pos);
      return [{ record, pos, outcome, purePawn, race, immediate: immediatePromotions(pos), seventh: pawns(pos, pos.turn).filter((square) => rank(square) === (pos.turn === "white" ? 6 : 1)).length }];
    });
    const withPawn = rows.filter((row) => pawns(row.pos, "white").length + pawns(row.pos, "black").length > 0);
    const purePawn = withPawn.filter((row) => row.purePawn);
    const races = purePawn.filter((row) => row.race !== undefined);
    const agreement = races.filter((row) => row.race === row.outcome);
    const immediate = withPawn.filter((row) => row.immediate > 0);
    const seventh = withPawn.filter((row) => row.seventh > 0);
    const raceConfusion = new Map<string, number>();
    for (const row of races) {
      const key = `${row.race}->${row.outcome}`;
      raceConfusion.set(key, (raceConfusion.get(key) ?? 0) + 1);
    }
    const lines = [
      "# D872 promotion-race/tablebase output",
      "",
      `Recorded sidecars: ${source.length} unique Syzygy FENs across ${new Set(source.flatMap((row) => row.sources)).size} evidence files; normalized outcome rows: ${rows.length}.`,
      `Pawn-bearing rows: ${withPawn.length}; kings-and-pawns-only rows: ${purePawn.length}; two-sided unblocked geometric races: ${races.length}.`,
      "",
      `Immediate legal promotion positions: ${immediate.length}; Syzygy win/draw/loss from side to move: ${categoryCounts(immediate.map((row) => row.outcome))}.`,
      `Side-to-move seventh-rank pawn positions: ${seventh.length}; Syzygy win/draw/loss: ${categoryCounts(seventh.map((row) => row.outcome))}.`,
      "",
      `Naive unopposed-stride race agrees with Syzygy on ${agreement.length}/${races.length} (${races.length === 0 ? "n/a" : `${(100 * agreement.length / races.length).toFixed(1)}%`}). It accounts for side to move, clear forward paths and the initial two-square push, but deliberately ignores control, captures, checks, king access and promotion effect.`,
      "",
      "| geometric prediction → Syzygy outcome | rows |",
      "|---|---:|",
    ];
    for (const [key, count] of [...raceConfusion].sort()) lines.push(`| ${key} | ${count} |`);
    lines.push("", "## First disagreements", "");
    for (const row of races.filter((value) => value.race !== value.outcome).slice(0, 20)) {
      lines.push(`- ${row.race}→${row.outcome}: \`${row.record.fen}\` (${row.record.sources.join(", ")}).`);
    }
    lines.push(
      "",
      "Interpretation: distance/path/turn are exact descriptive operands. Their race ordering is a geometric convention, not outcome. In the <=7-piece domain, Syzygy category/DTZ owns outcome; outside it the outcome projection abstains. Immediate promotion and seventh-rank presence are reported separately because neither implies a win.",
      "",
    );
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");

    expect(source).toHaveLength(288);
    expect(withPawn.length).toBeGreaterThan(50);
    expect(races.length).toBeGreaterThanOrEqual(10);
    expect(agreement.length).toBeLessThan(races.length);
  });
});
