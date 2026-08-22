// DISPOSABLE research harness — D778/Phase 2b. Not production code.
import { writeFileSync } from "node:fs";

import { attacks } from "chessops/attacks";
import { Chess } from "chessops/chess";
import type { Color, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { captureAt, researchPosition } from "../research-chess/legal-exchange.js";
import { authoredRows, importedPopulation, legalOutcomes, playedFen, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;
type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean | undefined;

function zone(king: Square): readonly Square[] {
  const file = king % 8; const rank = Math.floor(king / 8); const result: Square[] = [];
  for (let df = -1; df <= 1; df += 1) for (let dr = -1; dr <= 1; dr += 1) {
    if (df === 0 && dr === 0) continue;
    const f = file + df; const r = rank + dr;
    if (f >= 0 && f < 8 && r >= 0 && r < 8) result.push((r * 8 + f) as Square);
  }
  return result;
}

function piecesTouchingZone(pos: Chess, pieces: Color, kingColor: Color): number {
  const king = pos.board.kingOf(kingColor);
  if (king === undefined) return 0;
  const squares = zone(king);
  let count = 0;
  for (const [from, piece] of pos.board) if (piece.color === pieces && piece.role !== "king" &&
    squares.some((square) => attacks(piece, from, pos.board.occupied).has(square))) count += 1;
  return count;
}

function shelter(pos: Chess, color: Color): number {
  const king = pos.board.kingOf(color);
  if (king === undefined) return 0;
  const file = king % 8; const rank = Math.floor(king / 8); const forward = color === "white" ? 1 : -1;
  let count = 0;
  for (const df of [-1, 0, 1]) for (const distance of [1, 2]) {
    const f = file + df; const r = rank + forward * distance;
    if (f < 0 || f >= 8 || r < 0 || r >= 8) continue;
    const square = (r * 8 + f) as Square;
    if (pos.board.getColor(square) === color && pos.board.getRole(square) === "pawn") count += 1;
  }
  return count;
}

function withTurn(pos: Chess, turn: Color): Chess | undefined {
  if (pos.turn === turn) return pos;
  const result = Chess.fromSetup({ ...pos.toSetup(), turn, epSquare: undefined });
  return result.isOk ? result.value : undefined;
}

function legalEscapes(pos: Chess, color: Color): number | undefined {
  const normalized = withTurn(pos, color);
  const king = normalized?.board.kingOf(color);
  if (normalized === undefined || king === undefined) return undefined;
  const file = king % 8; const rank = Math.floor(king / 8);
  return [...(normalized.allDests().get(king) ?? [])].filter((to) =>
    Math.abs(to % 8 - file) <= 1 && Math.abs(Math.floor(to / 8) - rank) <= 1).length;
}

function escapeChange(beforeFen: string, afterFen: string, side: "mover" | "opponent", direction: "increased" | "decreased"): boolean | undefined {
  const before = researchPosition(beforeFen); const after = researchPosition(afterFen);
  const color = side === "mover" ? before.turn : opposite(before.turn);
  const oldCount = legalEscapes(before, color); const newCount = legalEscapes(after, color);
  if (oldCount === undefined || newCount === undefined) return undefined;
  return direction === "increased" ? newCount > oldCount : newCount < oldCount;
}

function directSliderCheck(beforeFen: string, uci: string, afterFen: string): boolean {
  const before = researchPosition(beforeFen); const after = researchPosition(afterFen); const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return false;
  const moved = before.board.get(move.from); const king = after.board.kingOf(opposite(before.turn));
  return moved !== undefined && (moved.role === "bishop" || moved.role === "rook" || moved.role === "queen") &&
    king !== undefined && attacks({ color: moved.color, role: moved.role }, move.to, after.board.occupied).has(king);
}

function isCapture(beforeFen: string, uci: string): boolean {
  const before = researchPosition(beforeFen); const move = parseUci(uci);
  return move !== undefined && captureAt(before, move) !== undefined;
}

function kingRelocated(beforeFen: string, afterFen: string, color: Color): boolean {
  return researchPosition(beforeFen).board.kingOf(color) !== researchPosition(afterFen).board.kingOf(color);
}

function castlingMove(beforeFen: string, uci: string): boolean {
  const before = researchPosition(beforeFen); const move = parseUci(uci);
  return move !== undefined && "from" in move && before.board.getRole(move.from) === "king" &&
    Math.abs(move.to % 8 - move.from % 8) > 1;
}

const PROBES: Readonly<Record<string, Probe>> = {
  opponent_legal_escapes_decreased: (before, _uci, after) => escapeChange(before, after, "opponent", "decreased"),
  mover_legal_escapes_increased: (before, _uci, after) => escapeChange(before, after, "mover", "increased"),
  opponent_zone_attackers_increased: (before, _uci, after) => {
    const old = researchPosition(before); const next = researchPosition(after); const mover = old.turn; const enemy = opposite(mover);
    return piecesTouchingZone(next, mover, enemy) > piecesTouchingZone(old, mover, enemy);
  },
  opponent_zone_defenders_decreased: (before, _uci, after) => {
    const old = researchPosition(before); const next = researchPosition(after); const enemy = opposite(old.turn);
    return piecesTouchingZone(next, enemy, enemy) < piecesTouchingZone(old, enemy, enemy);
  },
  opponent_zone_defenders_decreased_without_capture: (before, uci, after) => {
    const old = researchPosition(before); const next = researchPosition(after); const enemy = opposite(old.turn);
    return !isCapture(before, uci) && piecesTouchingZone(next, enemy, enemy) < piecesTouchingZone(old, enemy, enemy);
  },
  opponent_shelter_pawns_decreased: (before, _uci, after) => {
    const old = researchPosition(before); const next = researchPosition(after); const enemy = opposite(old.turn);
    return shelter(next, enemy) < shelter(old, enemy);
  },
  mover_shelter_pawns_increased: (before, _uci, after) => {
    const old = researchPosition(before); const next = researchPosition(after); return shelter(next, old.turn) > shelter(old, old.turn);
  },
  stationary_king_shelter_pawns_increased: (before, _uci, after) => {
    const old = researchPosition(before); const next = researchPosition(after);
    return !kingRelocated(before, after, old.turn) && shelter(next, old.turn) > shelter(old, old.turn);
  },
  king_relocated_to_more_shelter: (before, _uci, after) => {
    const old = researchPosition(before); const next = researchPosition(after);
    return kingRelocated(before, after, old.turn) && shelter(next, old.turn) > shelter(old, old.turn);
  },
  castled_to_more_shelter: (before, uci, after) => {
    const old = researchPosition(before); const next = researchPosition(after);
    return castlingMove(before, uci) && shelter(next, old.turn) > shelter(old, old.turn);
  },
  noncastling_king_relocated_to_more_shelter: (before, uci, after) => {
    const old = researchPosition(before); const next = researchPosition(after);
    return !castlingMove(before, uci) && kingRelocated(before, after, old.turn) && shelter(next, old.turn) > shelter(old, old.turn);
  },
  direct_slider_check_delivered: directSliderCheck,
};

interface Contribution { played: number; playedEligible: number; alt: number; alternatives: number }
function bootstrap(rows: readonly Contribution[]): readonly [number, number] {
  let state = 0x778c0de; const samples: number[] = [];
  const random = (): number => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x1_0000_0000; };
  for (let iteration = 0; iteration < 2_000; iteration += 1) {
    let p = 0; let pe = 0; let a = 0; let ae = 0;
    for (let draw = 0; draw < rows.length; draw += 1) { const row = rows[Math.floor(random() * rows.length)]!; p += row.played; pe += row.playedEligible; a += row.alt; ae += row.alternatives; }
    if (pe > 0 && ae > 0 && a > 0) samples.push((p / pe) / (a / ae));
  }
  samples.sort((a, b) => a - b); return [samples[Math.floor(samples.length * .025)] ?? 0, samples[Math.floor(samples.length * .975)] ?? 0];
}

function measure(rows: readonly ResearchRow[]) {
  const contributions = new Map<string, Contribution[]>(); let decisions = 0; let allAlternatives = 0;
  for (const row of rows) {
    const alts = legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== row.fen);
    if (alts.length === 0) continue;
    decisions += 1; allAlternatives += alts.length;
    for (const [name, probe] of Object.entries(PROBES)) {
      const p = probe(row.parentFen, row.uci, row.fen); let a = 0; let ae = 0;
      for (const candidate of alts) { const value = probe(row.parentFen, candidate.uci, candidate.fen); if (value === undefined) continue; ae += 1; if (value) a += 1; }
      const values = contributions.get(name) ?? [];
      values.push({ played: p ? 1 : 0, playedEligible: p === undefined ? 0 : 1, alt: a, alternatives: ae }); contributions.set(name, values);
    }
  }
  return { decisions, allAlternatives, values: [...contributions].map(([name, rows]) => {
    const p = rows.reduce((n, r) => n + r.played, 0); const pe = rows.reduce((n, r) => n + r.playedEligible, 0);
    const a = rows.reduce((n, r) => n + r.alt, 0); const ae = rows.reduce((n, r) => n + r.alternatives, 0);
    const pr = p / pe; const ar = a / ae; return { name, p, pe, a, ae, pr, ar, lift: ar === 0 ? Infinity : pr / ar, interval: bootstrap(rows) };
  }).sort((a, b) => b.lift - a.lift) };
}
function pct(value: number): string { return `${(100 * value).toFixed(3)}%`; }

describe("D778 decomposed king state", () => {
  it("pins direct slider check and reduced opponent escapes", () => {
    const fen = "7k/8/8/8/8/8/8/R3K3 w - - 0 1"; const after = playedFen(fen, "a1a8");
    expect(directSliderCheck(fen, "a1a8", after)).toBe(true);
    expect(escapeChange(fen, after, "opponent", "decreased")).toBe(true);
  });
  it("pins a mover escape gain and shelter loss separately", () => {
    const freed = "k7/8/8/8/8/8/8/6RK w - - 0 1"; expect(escapeChange(freed, playedFen(freed, "g1g3"), "mover", "increased")).toBe(true);
    const shelterFen = "6k1/5ppp/8/8/8/6Q1/8/4K3 w - - 0 1";
    const after = playedFen(shelterFen, "g3g7"); const old = researchPosition(shelterFen); const next = researchPosition(after);
    expect(shelter(next, "black")).toBeLessThan(shelter(old, "black"));
  });
  it("measures authored, fixed-ply and full-path horizon populations", () => {
    const imported = importedPopulation(); const full = imported.paths.flat(); const ply = (row: ResearchRow) => Number(/#(\d+)$/u.exec(row.id)?.[1] ?? 0);
    const populations = [
      { name: "authored pack spines", rows: authoredRows() }, { name: "sealed imported fixed-ply sample", rows: imported.sampled },
      { name: "sealed imported full paths, plies 1–20", rows: full.filter((r) => ply(r) <= 20) },
      { name: "sealed imported full paths, plies 21–40", rows: full.filter((r) => ply(r) >= 21 && ply(r) <= 40) },
      { name: "sealed imported full paths, plies 41+", rows: full.filter((r) => ply(r) >= 41) },
    ];
    const lines = ["# D778 output", "", "Each row is an exact operand transition. Lift is discrimination, not king safety, attack quality, exposure or a mating net.", ""];
    for (const population of populations) {
      const result = measure(population.rows); lines.push(`## ${population.name}`, "", `Decisions: ${result.decisions}; alternatives: ${result.allAlternatives}.`, "", "| probe | played n/eligible/rate | alternatives n/eligible/rate | lift (paired position bootstrap 95%) |", "|---|---:|---:|---:|");
      for (const v of result.values) lines.push(`| \`${v.name}\` | ${v.p} / ${v.pe} / ${pct(v.pr)} | ${v.a} / ${v.ae} / ${pct(v.ar)} | ${Number.isFinite(v.lift) ? `${v.lift.toFixed(2)}x (${v.interval[0].toFixed(2)}–${v.interval[1].toFixed(2)})` : "inf"} |`);
      lines.push("");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8"); expect(full.length).toBeGreaterThan(6_000);
  });
});
