// DISPOSABLE research harness — D794/Phase 2b. Not production code.
import { performance } from "node:perf_hooks";
import { writeFileSync } from "node:fs";

import { attacks } from "chessops/attacks";
import { Chess } from "chessops/chess";
import type { Color, Role, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { legalCaptureMovesTo, legalExchangeForMove, researchPosition } from "../research-chess/legal-exchange.js";
import { authoredRows, importedRows, legalOutcomes, playedFen, type ResearchOutcome, type ResearchRow } from "../research-chess/populations.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const OUTCOMES = new Map<string, readonly ResearchOutcome[]>();
type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean | undefined;

function outcomes(fen: string): readonly ResearchOutcome[] {
  const cached = OUTCOMES.get(fen); if (cached !== undefined) return cached;
  const result = legalOutcomes(fen); OUTCOMES.set(fen, result); return result;
}

function withTurn(pos: Chess, turn: Color): Chess | undefined {
  if (pos.turn === turn) return pos;
  const result = Chess.fromSetup({ ...pos.toSetup(), turn, epSquare: undefined });
  return result.isOk ? result.value : undefined;
}

interface CaptureThreat { attacker: Square; attackerRole: Role; target: Square; targetRole: Role; color: Color }
function positiveCaptureThreats(afterFen: string): readonly CaptureThreat[] | undefined {
  const after = researchPosition(afterFen);
  if (after.isCheck()) return undefined; // threat@1's declared pass-while-in-check abstention
  const mover = opposite(after.turn); const pass = withTurn(after, mover); if (pass === undefined) return undefined;
  const result: CaptureThreat[] = [];
  for (const [target, targetPiece] of pass.board) {
    if (targetPiece.color !== after.turn) continue;
    const targetRole = targetPiece.role;
    for (const move of legalCaptureMovesTo(pass, target)) {
      if (!("from" in move) || (legalExchangeForMove(pass, move) ?? 0) <= 0) continue;
      result.push({ attacker: move.from, attackerRole: pass.board.getRole(move.from)!, target, targetRole, color: mover });
    }
  }
  return result;
}

function threatPreserved(threat: CaptureThreat, replyFen: string): boolean {
  const pos = researchPosition(replyFen);
  if (pos.board.getColor(threat.attacker) !== threat.color || pos.board.getRole(threat.attacker) !== threat.attackerRole) return false;
  if (pos.board.getColor(threat.target) !== opposite(threat.color) || pos.board.getRole(threat.target) !== threat.targetRole) return false;
  return legalCaptureMovesTo(pos, threat.target, threat.attacker).some((move) => (legalExchangeForMove(pos, move) ?? 0) > 0);
}

function positiveCaptureSurvivesEveryReply(_before: string, _uci: string, afterFen: string): boolean | undefined {
  const threats = positiveCaptureThreats(afterFen); if (threats === undefined) return undefined;
  const replies = outcomes(afterFen); if (replies.length === 0 || threats.length === 0) return false;
  return threats.some((threat) => replies.every((reply) => threatPreserved(threat, reply.fen)));
}

function positiveCaptureThreatPresent(_before: string, _uci: string, afterFen: string): boolean | undefined {
  const threats = positiveCaptureThreats(afterFen); return threats === undefined ? undefined : threats.length > 0;
}

interface ForkState { mover: Square; role: Role; color: Color; targets: readonly { square: Square; role: Role; king: boolean }[] }
function meaningfulDoubleAttack(beforeFen: string, uci: string, afterFen: string): ForkState | undefined {
  const before = researchPosition(beforeFen); const after = researchPosition(afterFen); const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return undefined;
  const original = before.board.get(move.from); const moved = after.board.get(move.to);
  if (original === undefined || moved === undefined || original.color !== moved.color || original.role !== moved.role) return undefined;
  const pass = after.clone(); pass.turn = moved.color; pass.epSquare = undefined;
  const targets: { square: Square; role: Role; king: boolean }[] = [];
  for (const target of attacks(moved, move.to, after.board.occupied)) {
    const victim = after.board.get(target); if (victim?.color !== opposite(moved.color)) continue;
    if (victim.role === "king") targets.push({ square: target, role: victim.role, king: true });
    else {
      const capture = legalCaptureMovesTo(pass, target, move.to)[0];
      if (capture !== undefined && (legalExchangeForMove(pass, capture) ?? 0) > 0) targets.push({ square: target, role: victim.role, king: false });
    }
  }
  return targets.length >= 2 ? { mover: move.to, role: moved.role, color: moved.color, targets } : undefined;
}

function forkSurvivesEveryReply(beforeFen: string, uci: string, afterFen: string): boolean {
  const fork = meaningfulDoubleAttack(beforeFen, uci, afterFen); if (fork === undefined) return false;
  const replies = outcomes(afterFen); if (replies.length === 0) return false;
  return replies.every((reply) => {
    const pos = researchPosition(reply.fen);
    if (pos.board.getColor(fork.mover) !== fork.color || pos.board.getRole(fork.mover) !== fork.role) return false;
    return fork.targets.some((target) => !target.king && pos.board.getColor(target.square) === opposite(fork.color) &&
      pos.board.getRole(target.square) === target.role && legalCaptureMovesTo(pos, target.square, fork.mover)
        .some((capture) => (legalExchangeForMove(pos, capture) ?? 0) > 0));
  });
}

function gaveCheck(afterFen: string): boolean { return researchPosition(afterFen).isCheck(); }
function mateDelivered(afterFen: string): boolean { const pos = researchPosition(afterFen); return pos.isCheck() && outcomes(afterFen).length === 0; }

const PROBES: Readonly<Record<string, Probe>> = {
  move_gave_check: (_before, _uci, after) => gaveCheck(after),
  mate_delivered: (_before, _uci, after) => mateDelivered(after),
  opponent_has_exactly_one_legal_reply: (_before, _uci, after) => outcomes(after).length === 1,
  noncheck_opponent_has_exactly_one_legal_reply: (_before, _uci, after) => !gaveCheck(after) && outcomes(after).length === 1,
  positive_capture_threat_present: positiveCaptureThreatPresent,
  positive_capture_threat_survives_every_reply: positiveCaptureSurvivesEveryReply,
  moved_piece_meaningful_double_attack: (before, uci, after) => meaningfulDoubleAttack(before, uci, after) !== undefined,
  moved_piece_double_attack_survives_every_reply: forkSurvivesEveryReply,
};

interface Contribution { played: number; playedEligible: number; alt: number; alternatives: number }
function bootstrap(rows: readonly Contribution[]): readonly [number, number] {
  let state = 0x794c0de; const values: number[] = [];
  const random = (): number => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x1_0000_0000; };
  for (let iteration = 0; iteration < 2_000; iteration += 1) {
    let p = 0; let pe = 0; let a = 0; let ae = 0;
    for (let draw = 0; draw < rows.length; draw += 1) { const row = rows[Math.floor(random() * rows.length)]!; p += row.played; pe += row.playedEligible; a += row.alt; ae += row.alternatives; }
    if (pe > 0 && ae > 0 && a > 0) values.push((p / pe) / (a / ae));
  }
  values.sort((a, b) => a - b); return [values[Math.floor(values.length * .025)] ?? 0, values[Math.floor(values.length * .975)] ?? 0];
}

function percentile(values: readonly number[], part: number): number { return [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * part)] ?? 0; }
function measure(rows: readonly ResearchRow[]) {
  const started = performance.now(); const data = new Map<string, Contribution[]>(); const examples = new Map<string, string[]>(); const playedBreadth: number[] = []; const altBreadth: number[] = [];
  let decisions = 0; let alternatives = 0;
  for (const row of rows) {
    const alts = outcomes(row.parentFen).filter((candidate) => candidate.fen !== row.fen); if (alts.length === 0) continue;
    decisions += 1; alternatives += alts.length; playedBreadth.push(outcomes(row.fen).length);
    for (const candidate of alts) altBreadth.push(outcomes(candidate.fen).length);
    for (const [name, probe] of Object.entries(PROBES)) {
      const p = probe(row.parentFen, row.uci, row.fen); let a = 0; let ae = 0;
      if (p) { const found = examples.get(name) ?? []; if (found.length < 6) found.push(`${row.id}:${row.uci}`); examples.set(name, found); }
      for (const candidate of alts) { const value = probe(row.parentFen, candidate.uci, candidate.fen); if (value === undefined) continue; ae += 1; if (value) a += 1; }
      const list = data.get(name) ?? []; list.push({ played: p ? 1 : 0, playedEligible: p === undefined ? 0 : 1, alt: a, alternatives: ae }); data.set(name, list);
    }
  }
  const breadth = (values: readonly number[]) => ({ mean: values.reduce((a, b) => a + b, 0) / values.length, p10: percentile(values, .1), median: percentile(values, .5), p90: percentile(values, .9) });
  return { decisions, alternatives, elapsedMs: performance.now() - started, playedBreadth: breadth(playedBreadth), altBreadth: breadth(altBreadth), examples, values: [...data].map(([name, rows]) => {
    const p = rows.reduce((n, r) => n + r.played, 0); const pe = rows.reduce((n, r) => n + r.playedEligible, 0); const a = rows.reduce((n, r) => n + r.alt, 0); const ae = rows.reduce((n, r) => n + r.alternatives, 0);
    const pr = p / pe; const ar = a / ae; return { name, p, pe, a, ae, pr, ar, lift: ar === 0 ? pr === 0 ? Number.NaN : Infinity : pr / ar, interval: bootstrap(rows) };
  }).sort((a, b) => (Number.isNaN(b.lift) ? -Infinity : b.lift) - (Number.isNaN(a.lift) ? -Infinity : a.lift)) };
}

function pct(value: number): string { return `${(100 * value).toFixed(3)}%`; }

describe("D794 bounded reply semantics", () => {
  it("pins exact only-reply and excludes checkmate", () => {
    const fen = "6k1/5pp1/8/8/8/8/8/4R1K1 w - - 0 1"; const after = playedFen(fen, "e1e8");
    expect(gaveCheck(after)).toBe(true); expect(outcomes(after)).toHaveLength(1); expect(mateDelivered(after)).toBe(false);
  });

  it("distinguishes a surviving fork from a capturable forking piece", () => {
    const survives = "r3k3/8/4N3/8/8/8/8/7K w - - 0 1"; const survivesAfter = playedFen(survives, "e6c7");
    expect(meaningfulDoubleAttack(survives, "e6c7", survivesAfter)).toBeDefined();
    expect(forkSurvivesEveryReply(survives, "e6c7", survivesAfter)).toBe(true);
    const parried = "r3r2k/8/4N3/8/8/6b1/8/7K w - - 0 1"; const parriedAfter = playedFen(parried, "e6c7");
    expect(meaningfulDoubleAttack(parried, "e6c7", parriedAfter)).toBeDefined();
    expect(forkSurvivesEveryReply(parried, "e6c7", parriedAfter)).toBe(false);
  });

  it("retains an exact positive-capture threat through every reply", () => {
    const survives = "4k3/4n3/8/3P4/8/8/8/4R2K w - - 0 1"; const after = playedFen(survives, "d5d6");
    expect(positiveCaptureSurvivesEveryReply(survives, "d5d6", after)).toBe(true);
    const escapes = "7k/4n3/8/3P4/8/8/8/7K w - - 0 1"; const escaped = playedFen(escapes, "d5d6");
    expect(positiveCaptureSurvivesEveryReply(escapes, "d5d6", escaped)).toBe(false);
  });

  it("measures authored and sealed imported decisions with complete replies", () => {
    const lines = ["# D794 output", "", "Reply breadth is an exact legal count. Lift is discrimination, not force, value, quality or deeper inevitability.", ""];
    for (const population of [{ name: "authored pack spines", rows: authoredRows() }, { name: "sealed imported fixed-ply sample", rows: importedRows() }]) {
      const result = measure(population.rows); lines.push(`## ${population.name}`, "", `Decisions: ${result.decisions}; alternatives: ${result.alternatives}; elapsed: ${result.elapsedMs.toFixed(1)} ms.`, "", `Played reply breadth mean/p10/median/p90: ${result.playedBreadth.mean.toFixed(2)} / ${result.playedBreadth.p10} / ${result.playedBreadth.median} / ${result.playedBreadth.p90}.`, `Alternative reply breadth mean/p10/median/p90: ${result.altBreadth.mean.toFixed(2)} / ${result.altBreadth.p10} / ${result.altBreadth.median} / ${result.altBreadth.p90}.`, "", "| probe | played n/eligible/rate | alternatives n/eligible/rate | lift (paired bootstrap 95%) |", "|---|---:|---:|---:|");
      for (const v of result.values) lines.push(`| \`${v.name}\` | ${v.p} / ${v.pe} / ${pct(v.pr)} | ${v.a} / ${v.ae} / ${pct(v.ar)} | ${Number.isNaN(v.lift) ? "n/a" : Number.isFinite(v.lift) ? `${v.lift.toFixed(2)}x (${v.interval[0].toFixed(2)}–${v.interval[1].toFixed(2)})` : "inf"} |`);
      lines.push("", "Played positive examples:"); for (const [name, examples] of result.examples) lines.push(`- \`${name}\`: ${examples.join(", ")}`); lines.push("");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
  });
});
