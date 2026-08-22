// DISPOSABLE research harness — D783/Phase 2b. Not production code.
import { writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import type { Color, Move, Role, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { captureAt, legalCaptureMovesTo, legalExchangeForMove, researchPosition } from "../research-chess/legal-exchange.js";
import { authoredRows, importedRows, legalOutcomes, playedFen, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const ROLES: readonly Role[] = ["knight", "bishop", "rook", "queen"];
type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean | undefined;

function withTurn(pos: Chess, turn: Color): Chess | undefined {
  if (pos.turn === turn) return pos;
  const result = Chess.fromSetup({ ...pos.toSetup(), turn, epSquare: undefined });
  return result.isOk ? result.value : undefined;
}

function legalSet(pos: Chess, from: Square): ReadonlySet<Square> {
  return new Set(pos.allDests().get(from) ?? []);
}

function safeSet(pos: Chess, from: Square): ReadonlySet<Square> {
  const result = new Set<Square>();
  for (const to of pos.allDests().get(from) ?? []) {
    const move: Move = { from, to };
    const captured = captureAt(pos, move);
    if (captured !== undefined) {
      if ((legalExchangeForMove(pos, move) ?? Number.NEGATIVE_INFINITY) >= 0) result.add(to);
      continue;
    }
    const next = pos.clone(); next.play(move);
    if (!legalCaptureMovesTo(next, to).some((reply) => (legalExchangeForMove(next, reply) ?? 0) > 0)) result.add(to);
  }
  return result;
}

interface PieceDelta { role: Role; legalBefore: ReadonlySet<Square>; legalAfter: ReadonlySet<Square>; safeBefore: ReadonlySet<Square>; safeAfter: ReadonlySet<Square> }

function opponentDeltas(beforeFen: string, afterFen: string): readonly PieceDelta[] | undefined {
  const before = researchPosition(beforeFen); const after = researchPosition(afterFen); const enemy = opposite(before.turn);
  const old = withTurn(before, enemy);
  if (old === undefined) return undefined;
  const result: PieceDelta[] = [];
  for (const role of ROLES) for (const square of old.board.pieces(enemy, role)) {
    if (after.board.getColor(square) !== enemy || after.board.getRole(square) !== role) continue;
    result.push({ role, legalBefore: legalSet(old, square), legalAfter: legalSet(after, square), safeBefore: safeSet(old, square), safeAfter: safeSet(after, square) });
  }
  return result;
}

function movedPieceDelta(beforeFen: string, uci: string, afterFen: string): PieceDelta | undefined {
  const before = researchPosition(beforeFen); const after = researchPosition(afterFen); const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return undefined;
  const piece = before.board.get(move.from);
  if (piece === undefined || !ROLES.includes(piece.role) || after.board.getColor(move.to) !== piece.color || after.board.getRole(move.to) !== piece.role) return undefined;
  const next = withTurn(after, piece.color);
  if (next === undefined) return undefined;
  return { role: piece.role, legalBefore: legalSet(before, move.from), legalAfter: legalSet(next, move.to), safeBefore: safeSet(before, move.from), safeAfter: safeSet(next, move.to) };
}

function decreased(before: ReadonlySet<Square>, after: ReadonlySet<Square>): boolean { return after.size < before.size; }
function isCapture(beforeFen: string, uci: string): boolean { const pos = researchPosition(beforeFen); const move = parseUci(uci); return move !== undefined && captureAt(pos, move) !== undefined; }

const PROBES: Readonly<Record<string, Probe>> = {
  opponent_piece_legal_mobility_decreased: (before, _uci, after) => opponentDeltas(before, after)?.some((d) => decreased(d.legalBefore, d.legalAfter)),
  opponent_piece_safe_mobility_decreased: (before, _uci, after) => opponentDeltas(before, after)?.some((d) => decreased(d.safeBefore, d.safeAfter)),
  opponent_minor_safe_mobility_decreased: (before, _uci, after) => opponentDeltas(before, after)?.some((d) => (d.role === "bishop" || d.role === "knight") && decreased(d.safeBefore, d.safeAfter)),
  opponent_piece_lost_all_safe_moves: (before, _uci, after) => opponentDeltas(before, after)?.some((d) => d.safeBefore.size > 0 && d.safeAfter.size === 0),
  opponent_piece_safe_mobility_decreased_without_capture: (before, uci, after) => !isCapture(before, uci) && opponentDeltas(before, after)?.some((d) => decreased(d.safeBefore, d.safeAfter)),
  moved_piece_safe_mobility_increased: (before, uci, after) => { const d = movedPieceDelta(before, uci, after); return d === undefined ? undefined : d.safeAfter.size > d.safeBefore.size; },
};

interface Contribution { played: number; playedEligible: number; alt: number; alternatives: number }
function bootstrap(rows: readonly Contribution[]): readonly [number, number] {
  let state = 0x783c0de; const values: number[] = [];
  const random = (): number => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x1_0000_0000; };
  for (let iteration = 0; iteration < 2_000; iteration += 1) {
    let p = 0; let pe = 0; let a = 0; let ae = 0;
    for (let draw = 0; draw < rows.length; draw += 1) { const r = rows[Math.floor(random() * rows.length)]!; p += r.played; pe += r.playedEligible; a += r.alt; ae += r.alternatives; }
    if (pe > 0 && ae > 0 && a > 0) values.push((p / pe) / (a / ae));
  }
  values.sort((a, b) => a - b); return [values[Math.floor(values.length * .025)] ?? 0, values[Math.floor(values.length * .975)] ?? 0];
}

function measure(rows: readonly ResearchRow[]) {
  const data = new Map<string, Contribution[]>(); let decisions = 0; let alternatives = 0;
  for (const row of rows) {
    const alts = legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== row.fen); if (alts.length === 0) continue;
    decisions += 1; alternatives += alts.length;
    for (const [name, probe] of Object.entries(PROBES)) {
      const p = probe(row.parentFen, row.uci, row.fen); let a = 0; let ae = 0;
      for (const candidate of alts) { const value = probe(row.parentFen, candidate.uci, candidate.fen); if (value === undefined) continue; ae += 1; if (value) a += 1; }
      const list = data.get(name) ?? []; list.push({ played: p ? 1 : 0, playedEligible: p === undefined ? 0 : 1, alt: a, alternatives: ae }); data.set(name, list);
    }
  }
  return { decisions, alternatives, values: [...data].map(([name, rows]) => {
    const p = rows.reduce((n, r) => n + r.played, 0); const pe = rows.reduce((n, r) => n + r.playedEligible, 0); const a = rows.reduce((n, r) => n + r.alt, 0); const ae = rows.reduce((n, r) => n + r.alternatives, 0);
    const pr = p / pe; const ar = a / ae; return { name, p, pe, a, ae, pr, ar, lift: ar === 0 ? Infinity : pr / ar, interval: bootstrap(rows) };
  }).sort((a, b) => b.lift - a.lift) };
}
function pct(value: number): string { return `${(100 * value).toFixed(3)}%`; }

describe("D783 identity-retaining mobility", () => {
  it("separates legal restriction by a pin from a locally unsafe destination", () => {
    const pin = "4k3/4n3/8/8/8/8/8/R6K w - - 0 1"; const pinned = playedFen(pin, "a1e1");
    expect(opponentDeltas(pin, pinned)?.some((d) => decreased(d.legalBefore, d.legalAfter))).toBe(true);
    const pawn = "4k3/8/8/4n3/8/8/7P/4K3 w - - 0 1"; const controlled = playedFen(pawn, "h2h3");
    const delta = opponentDeltas(pawn, controlled)?.find((d) => d.role === "knight")!;
    expect(decreased(delta.legalBefore, delta.legalAfter)).toBe(false);
    expect(decreased(delta.safeBefore, delta.safeAfter)).toBe(true);
  });
  it("does not call zero legal mobility trapped without the separate attack prerequisite", () => {
    const fen = "4k3/8/8/8/8/8/4B3/4K3 w - - 0 1"; const after = playedFen(fen, "e2b5");
    expect(opponentDeltas(fen, after)?.some((d) => d.safeBefore.size > 0 && d.safeAfter.size === 0)).toBe(false);
  });
  it("measures authored and fixed-ply imported populations", () => {
    const lines = ["# D783 output", "", "Lift measures discrimination only. Safe means locally non-losing under legal-exchange@1, not engine-safe, active, trapped, dominated or good.", ""];
    for (const population of [{ name: "authored pack spines", rows: authoredRows() }, { name: "sealed imported fixed-ply sample", rows: importedRows() }]) {
      const result = measure(population.rows); lines.push(`## ${population.name}`, "", `Decisions: ${result.decisions}; alternatives: ${result.alternatives}.`, "", "| probe | played n/eligible/rate | alternatives n/eligible/rate | lift (paired position bootstrap 95%) |", "|---|---:|---:|---:|");
      for (const v of result.values) lines.push(`| \`${v.name}\` | ${v.p} / ${v.pe} / ${pct(v.pr)} | ${v.a} / ${v.ae} / ${pct(v.ar)} | ${Number.isFinite(v.lift) ? `${v.lift.toFixed(2)}x (${v.interval[0].toFixed(2)}–${v.interval[1].toFixed(2)})` : "inf"} |`);
      lines.push("");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
  });
});
