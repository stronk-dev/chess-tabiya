// DISPOSABLE research harness — D771/Phase 2b. Not production code.
import { writeFileSync } from "node:fs";

import { attacks } from "chessops/attacks";
import { Chess } from "chessops/chess";
import type { Color, Move, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { legalCaptureMovesTo, legalExchangeForMove, researchPosition } from "../research-chess/legal-exchange.js";
import { authoredRows, importedRows, legalOutcomes, playedFen, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;

type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean | undefined;

function passPosition(pos: Chess, turn: Color): Chess | undefined {
  const result = Chess.fromSetup({ ...pos.toSetup(), turn, epSquare: undefined });
  return result.isOk ? result.value : undefined;
}

function movedPawn(before: Chess, after: Chess, uci: string): { from: Square; to: Square; color: Color } | undefined {
  const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return undefined;
  const oldPiece = before.board.get(move.from);
  const newPiece = after.board.get(move.to);
  return oldPiece?.role === "pawn" && newPiece?.role === "pawn" && oldPiece.color === newPiece.color
    ? { from: move.from, to: move.to, color: oldPiece.color }
    : undefined;
}

function newlyControlledEmptyMinorSquares(beforeFen: string, uci: string, afterFen: string): readonly Square[] {
  const before = researchPosition(beforeFen);
  const after = researchPosition(afterFen);
  const pawn = movedPawn(before, after, uci);
  if (pawn === undefined) return [];
  const oldControls = attacks({ color: pawn.color, role: "pawn" }, pawn.from, before.board.occupied);
  return [...attacks({ color: pawn.color, role: "pawn" }, pawn.to, after.board.occupied)]
    .filter((square) => !oldControls.has(square) && after.board.get(square) === undefined);
}

function geometryContest(beforeFen: string, uci: string, afterFen: string): boolean {
  const before = researchPosition(beforeFen);
  const after = researchPosition(afterFen);
  const pawn = movedPawn(before, after, uci);
  if (pawn === undefined) return false;
  const enemy = opposite(pawn.color);
  for (const square of newlyControlledEmptyMinorSquares(beforeFen, uci, afterFen)) {
    for (const role of ["bishop", "knight"] as const) for (const minor of after.board.pieces(enemy, role)) {
      if (attacks({ color: enemy, role }, minor, after.board.occupied).has(square)) return true;
    }
  }
  return false;
}

function positiveCaptureAt(pos: Chess, square: Square, fromOnly?: Square): boolean {
  return legalCaptureMovesTo(pos, square, fromOnly)
    .some((capture) => (legalExchangeForMove(pos, capture) ?? 0) > 0);
}

function quietMove(from: Square, to: Square): Move {
  return { from, to };
}

function newlyExchangeUnsafe(beforeFen: string, uci: string, afterFen: string): boolean | undefined {
  const before = researchPosition(beforeFen);
  const after = researchPosition(afterFen);
  const pawn = movedPawn(before, after, uci);
  if (pawn === undefined) return false;
  const enemy = opposite(pawn.color);
  const beforeEnemy = passPosition(before, enemy);
  if (beforeEnemy === undefined) return undefined;
  for (const square of newlyControlledEmptyMinorSquares(beforeFen, uci, afterFen)) {
    for (const role of ["bishop", "knight"] as const) for (const minor of before.board.pieces(enemy, role)) {
      if (after.board.getColor(minor) !== enemy || after.board.getRole(minor) !== role) continue;
      const candidate = quietMove(minor, square);
      if (!beforeEnemy.isLegal(candidate) || !after.isLegal(candidate)) continue;
      const beforeArrival = beforeEnemy.clone();
      beforeArrival.play(candidate);
      if (positiveCaptureAt(beforeArrival, square)) continue;
      const afterArrival = after.clone();
      afterArrival.play(candidate);
      if (positiveCaptureAt(afterArrival, square, pawn.to)) return true;
    }
  }
  return false;
}

const PROBES: Readonly<Record<string, Probe>> = {
  pawn_contests_minor_destination: geometryContest,
  minor_destination_newly_exchange_unsafe_by_pawn: newlyExchangeUnsafe,
};

interface Contribution { played: number; playedEligible: number; alt: number; alternatives: number }

function bootstrap(rows: readonly Contribution[]): readonly [number, number] {
  let state = 0x771c0de;
  const random = (): number => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x1_0000_0000; };
  const samples: number[] = [];
  for (let iteration = 0; iteration < 2_000; iteration += 1) {
    let p = 0; let pe = 0; let a = 0; let ae = 0;
    for (let draw = 0; draw < rows.length; draw += 1) {
      const row = rows[Math.floor(random() * rows.length)]!;
      p += row.played; pe += row.playedEligible; a += row.alt; ae += row.alternatives;
    }
    if (pe > 0 && ae > 0 && a > 0) samples.push((p / pe) / (a / ae));
  }
  samples.sort((left, right) => left - right);
  return [samples[Math.floor(samples.length * .025)] ?? 0, samples[Math.floor(samples.length * .975)] ?? 0];
}

function measure(rows: readonly ResearchRow[]) {
  const contributions = new Map<string, Contribution[]>();
  let decisions = 0; let allAlternatives = 0;
  for (const row of rows) {
    const actual = playedFen(row.parentFen, row.uci);
    const alts = legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== actual);
    if (alts.length === 0) continue;
    decisions += 1; allAlternatives += alts.length;
    for (const [name, probe] of Object.entries(PROBES)) {
      const p = probe(row.parentFen, row.uci, actual);
      let alt = 0; let alternatives = 0;
      for (const candidate of alts) {
        const value = probe(row.parentFen, candidate.uci, candidate.fen);
        if (value === undefined) continue;
        alternatives += 1;
        if (value) alt += 1;
      }
      const values = contributions.get(name) ?? [];
      values.push({ played: p ? 1 : 0, playedEligible: p === undefined ? 0 : 1, alt, alternatives });
      contributions.set(name, values);
    }
  }
  return { decisions, allAlternatives, values: [...contributions].map(([name, rows]) => {
    const played = rows.reduce((n, row) => n + row.played, 0);
    const playedEligible = rows.reduce((n, row) => n + row.playedEligible, 0);
    const alternatives = rows.reduce((n, row) => n + row.alt, 0);
    const alternativeEligible = rows.reduce((n, row) => n + row.alternatives, 0);
    const playedRate = played / playedEligible; const altRate = alternatives / alternativeEligible;
    return { name, played, playedEligible, alternatives, alternativeEligible, playedRate, altRate,
      lift: altRate === 0 ? Number.POSITIVE_INFINITY : playedRate / altRate, interval: bootstrap(rows) };
  }).sort((left, right) => right.lift - left.lift) };
}

function pct(value: number): string { return `${(100 * value).toFixed(3)}%`; }

describe("D771 legal/safe square distinction", () => {
  it("pins a legal destination that becomes locally exchange-unsafe", () => {
    const fen = "4k3/8/8/4n3/8/8/7P/4K3 w - - 0 1";
    const after = playedFen(fen, "h2h3");
    expect(geometryContest(fen, "h2h3", after)).toBe(true);
    expect(newlyExchangeUnsafe(fen, "h2h3", after)).toBe(true);
    const enemy = researchPosition(after);
    expect(enemy.isLegal({ from: 36, to: 30 })).toBe(true); // Ne5-g4 remains legal.
  });

  it("rejects a square that was already locally unsafe", () => {
    const fen = "4k3/8/8/4n3/8/8/7P/4K1R1 w - - 0 1";
    const after = playedFen(fen, "h2h3");
    expect(geometryContest(fen, "h2h3", after)).toBe(true);
    expect(newlyExchangeUnsafe(fen, "h2h3", after)).toBe(false);
  });

  it("measures both populations with per-probe abstentions", () => {
    const lines = ["# D771 output", "", "Lift measures played-vs-legal-alternative discrimination, not intent, quality or strategic value.", ""];
    for (const population of [{ name: "authored pack spines", rows: authoredRows() }, { name: "sealed imported CC0 sample", rows: importedRows() }]) {
      const result = measure(population.rows);
      lines.push(`## ${population.name}`, "", `Source rows: ${population.rows.length}; decisions: ${result.decisions}; alternatives: ${result.allAlternatives}.`, "",
        "| probe | played n/eligible/rate | alternatives n/eligible/rate | lift (paired position bootstrap 95%) |", "|---|---:|---:|---:|");
      for (const value of result.values) lines.push(`| \`${value.name}\` | ${value.played} / ${value.playedEligible} / ${pct(value.playedRate)} | ${value.alternatives} / ${value.alternativeEligible} / ${pct(value.altRate)} | ${Number.isFinite(value.lift) ? `${value.lift.toFixed(2)}x (${value.interval[0].toFixed(2)}–${value.interval[1].toFixed(2)})` : "inf"} |`);
      lines.push("");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
    expect(authoredRows().length).toBeGreaterThan(700);
    expect(importedRows().length).toBe(579);
  });
});
