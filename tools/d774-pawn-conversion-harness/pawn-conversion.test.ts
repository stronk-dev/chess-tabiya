// DISPOSABLE research harness — D774/Phase 2b. Not production code.
import { writeFileSync } from "node:fs";

import { attacks } from "chessops/attacks";
import type { Color, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { captureAt, researchPosition } from "../research-chess/legal-exchange.js";
import { authoredRows, importedPopulation, legalOutcomes, playedFen, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;

type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean;

function passed(pos: ReturnType<typeof researchPosition>, color: Color, square: Square): boolean {
  if (pos.board.getColor(square) !== color || pos.board.getRole(square) !== "pawn") return false;
  const file = square % 8;
  const rank = Math.floor(square / 8);
  for (const enemy of pos.board.pieces(opposite(color), "pawn")) {
    const enemyFile = enemy % 8;
    const enemyRank = Math.floor(enemy / 8);
    if (Math.abs(enemyFile - file) <= 1 && (color === "white" ? enemyRank > rank : enemyRank < rank)) return false;
  }
  return true;
}

function passedPawns(pos: ReturnType<typeof researchPosition>, color: Color): readonly Square[] {
  return [...pos.board.pieces(color, "pawn")].filter((square) => passed(pos, color, square));
}

function movedPawn(beforeFen: string, uci: string, afterFen: string) {
  const before = researchPosition(beforeFen);
  const after = researchPosition(afterFen);
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return undefined;
  const oldPiece = before.board.get(move.from);
  const newPiece = after.board.get(move.to);
  return oldPiece?.role === "pawn" && newPiece?.role === "pawn" && oldPiece.color === newPiece.color
    ? { before, after, move, color: oldPiece.color }
    : undefined;
}

function movedPawnBecamePassed(beforeFen: string, uci: string, afterFen: string): boolean {
  const value = movedPawn(beforeFen, uci, afterFen);
  return value !== undefined && !passed(value.before, value.color, value.move.from) && passed(value.after, value.color, value.move.to);
}

function passedPawnAdvanced(beforeFen: string, uci: string, afterFen: string): boolean {
  const value = movedPawn(beforeFen, uci, afterFen);
  return value !== undefined && passed(value.before, value.color, value.move.from) && passed(value.after, value.color, value.move.to);
}

function captureCreatedMovedPasser(beforeFen: string, uci: string, afterFen: string): boolean {
  const value = movedPawn(beforeFen, uci, afterFen);
  return value !== undefined && captureAt(value.before, value.move)?.color === opposite(value.color) &&
    !passed(value.before, value.color, value.move.from) && passed(value.after, value.color, value.move.to);
}

function protectedPassed(pos: ReturnType<typeof researchPosition>, color: Color): ReadonlySet<string> {
  const result = new Set<string>();
  for (const square of passedPawns(pos, color)) {
    for (const pawn of pos.board.pieces(color, "pawn")) {
      if (pawn !== square && attacks({ color, role: "pawn" }, pawn, pos.board.occupied).has(square)) {
        result.add(`${color}:${square}`);
        break;
      }
    }
  }
  return result;
}

function connectedPairs(pos: ReturnType<typeof researchPosition>, color: Color): ReadonlySet<string> {
  const pawns = passedPawns(pos, color);
  const result = new Set<string>();
  for (let left = 0; left < pawns.length; left += 1) for (let right = left + 1; right < pawns.length; right += 1) {
    const a = pawns[left]!; const b = pawns[right]!;
    if (Math.abs(a % 8 - b % 8) === 1) result.add(`${color}:${Math.min(a, b)}:${Math.max(a, b)}`);
  }
  return result;
}

function gained(before: ReadonlySet<string>, after: ReadonlySet<string>): boolean {
  return [...after].some((item) => !before.has(item));
}

function stateGained(beforeFen: string, afterFen: string, projection: (pos: ReturnType<typeof researchPosition>, color: Color) => ReadonlySet<string>): boolean {
  const before = researchPosition(beforeFen); const after = researchPosition(afterFen); const color = before.turn;
  return gained(projection(before, color), projection(after, color));
}

const PROBES: Readonly<Record<string, Probe>> = {
  moved_pawn_became_passed: movedPawnBecamePassed,
  passed_pawn_advanced: passedPawnAdvanced,
  capture_created_moved_passer: captureCreatedMovedPasser,
  protected_passed_pawn_gained: (before, _uci, after) => stateGained(before, after, protectedPassed),
  connected_passed_pair_gained: (before, _uci, after) => stateGained(before, after, connectedPairs),
};

interface Contribution { played: number; alt: number; alternatives: number }

function bootstrap(rows: readonly Contribution[]): readonly [number, number] {
  let state = 0x774c0de;
  const random = (): number => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x1_0000_0000; };
  const values: number[] = [];
  for (let iteration = 0; iteration < 2_000; iteration += 1) {
    let p = 0; let a = 0; let n = 0;
    for (let draw = 0; draw < rows.length; draw += 1) { const row = rows[Math.floor(random() * rows.length)]!; p += row.played; a += row.alt; n += row.alternatives; }
    if (a > 0) values.push((p / rows.length) / (a / n));
  }
  values.sort((a, b) => a - b);
  return [values[Math.floor(values.length * .025)] ?? 0, values[Math.floor(values.length * .975)] ?? 0];
}

function measure(rows: readonly ResearchRow[]) {
  const contributions = new Map<string, Contribution[]>(); let decisions = 0; let allAlternatives = 0;
  for (const row of rows) {
    const actual = row.fen; const alts = legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== actual);
    if (alts.length === 0) continue;
    decisions += 1; allAlternatives += alts.length;
    for (const [name, probe] of Object.entries(PROBES)) {
      let alt = 0;
      for (const candidate of alts) if (probe(row.parentFen, candidate.uci, candidate.fen)) alt += 1;
      const values = contributions.get(name) ?? [];
      values.push({ played: probe(row.parentFen, row.uci, actual) ? 1 : 0, alt, alternatives: alts.length });
      contributions.set(name, values);
    }
  }
  return { decisions, allAlternatives, values: [...contributions].map(([name, rows]) => {
    const p = rows.reduce((n, row) => n + row.played, 0); const a = rows.reduce((n, row) => n + row.alt, 0); const n = rows.reduce((sum, row) => sum + row.alternatives, 0);
    const pr = p / rows.length; const ar = a / n;
    return { name, p, a, pr, ar, lift: ar === 0 ? Number.POSITIVE_INFINITY : pr / ar, interval: bootstrap(rows) };
  }).sort((a, b) => b.lift - a.lift) };
}

function pct(value: number): string { return `${(100 * value).toFixed(3)}%`; }

describe("D774 pawn conversion", () => {
  it("pins passed-pawn creation, advancement and a blocking enemy pawn", () => {
    const creation = "4k3/8/4p3/3P4/8/8/8/4K3 w - - 0 1";
    expect(movedPawnBecamePassed(creation, "d5e6", playedFen(creation, "d5e6"))).toBe(true);
    expect(captureCreatedMovedPasser(creation, "d5e6", playedFen(creation, "d5e6"))).toBe(true);
    const advance = "4k3/8/8/4P3/8/8/8/4K3 w - - 0 1";
    expect(passedPawnAdvanced(advance, "e5e6", playedFen(advance, "e5e6"))).toBe(true);
    const blocked = "4k3/5p2/8/4P3/8/8/8/4K3 w - - 0 1";
    expect(passedPawnAdvanced(blocked, "e5e6", playedFen(blocked, "e5e6"))).toBe(false);
  });

  it("pins protected and connected passer gains", () => {
    const protectedFen = "4k3/8/8/3P4/8/4P3/8/4K3 w - - 0 1";
    expect(stateGained(protectedFen, playedFen(protectedFen, "e3e4"), protectedPassed)).toBe(true);
    const connectedFen = "4k3/8/3p4/2P1P3/8/8/8/4K3 w - - 0 1";
    const after = playedFen(connectedFen, "e5d6");
    expect(stateGained(connectedFen, after, connectedPairs)).toBe(true);
  });

  it("measures both populations with paired confidence", () => {
    const imported = importedPopulation();
    const fullImported = imported.paths.flat();
    const ply = (row: ResearchRow): number => Number(/#(\d+)$/u.exec(row.id)?.[1] ?? 0);
    const lines = ["# D774 output", "", "Lift measures played-vs-legal-alternative discrimination, not quality, danger, intent or plan value.", ""];
    for (const population of [
      { name: "authored pack spines", rows: authoredRows() },
      { name: "sealed imported fixed-ply sample", rows: imported.sampled },
      { name: "sealed imported full paths, plies 1–20", rows: fullImported.filter((row) => ply(row) <= 20) },
      { name: "sealed imported full paths, plies 21–40", rows: fullImported.filter((row) => ply(row) >= 21 && ply(row) <= 40) },
      { name: "sealed imported full paths, plies 41+", rows: fullImported.filter((row) => ply(row) >= 41) },
    ]) {
      const result = measure(population.rows);
      lines.push(`## ${population.name}`, "", `Decisions: ${result.decisions}; alternatives: ${result.allAlternatives}.`, "", "| probe | played n/rate | alternatives n/rate | lift (paired position bootstrap 95%) |", "|---|---:|---:|---:|");
      for (const value of result.values) lines.push(`| \`${value.name}\` | ${value.p} / ${pct(value.pr)} | ${value.a} / ${pct(value.ar)} | ${Number.isFinite(value.lift) ? `${value.lift.toFixed(2)}x (${value.interval[0].toFixed(2)}–${value.interval[1].toFixed(2)})` : "inf"} |`);
      lines.push("");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
    expect(authoredRows().length).toBeGreaterThan(700);
    expect(imported.sampled.length).toBe(579);
    expect(fullImported.length).toBeGreaterThan(6_000);
  });
});
