// DISPOSABLE research harness — D788/Phase 2b. Not production code.
import { writeFileSync } from "node:fs";

import { attacks } from "chessops/attacks";
import type { Color, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { captureAt, researchPosition } from "../research-chess/legal-exchange.js";
import { authoredRows, authoredTriples, importedPopulation, legalOutcomes, pathTriples, playedFen, type ResearchRow, type ResearchTriple } from "../research-chess/populations.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;
type Position = ReturnType<typeof researchPosition>;
type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean;

function ahead(color: Color, from: Square, other: Square): boolean {
  const a = Math.floor(from / 8); const b = Math.floor(other / 8);
  return color === "white" ? b > a : b < a;
}

function passed(pos: Position, color: Color, square: Square): boolean {
  const file = square % 8;
  return [...pos.board.pieces(opposite(color), "pawn")].every((enemy) =>
    Math.abs(enemy % 8 - file) > 1 || !ahead(color, square, enemy));
}

// candidate-majority@1: a deliberately disclosed subset of the historical Stockfish 2.1
// candidate-passer geometry. It omits that engine's separate backward-pawn classifier rather than
// silently recreating an engine judgement.
function candidateMajority(pos: Position, color: Color, square: Square): boolean {
  if (pos.board.getColor(square) !== color || pos.board.getRole(square) !== "pawn" || passed(pos, color, square)) return false;
  const file = square % 8; const rank = Math.floor(square / 8);
  const friendly = [...pos.board.pieces(color, "pawn")];
  const enemy = [...pos.board.pieces(opposite(color), "pawn")];
  const opposed = enemy.some((pawn) => pawn % 8 === file && ahead(color, square, pawn));
  const isolated = !friendly.some((pawn) => pawn !== square && Math.abs(pawn % 8 - file) === 1);
  const support = friendly.filter((pawn) => Math.abs(pawn % 8 - file) === 1 &&
    (color === "white" ? Math.floor(pawn / 8) <= rank : Math.floor(pawn / 8) >= rank)).length;
  const blockers = enemy.filter((pawn) => Math.abs(pawn % 8 - file) === 1 && ahead(color, square, pawn)).length;
  return !opposed && !isolated && support > 0 && support >= blockers;
}

function movedPawn(beforeFen: string, uci: string, afterFen: string) {
  const before = researchPosition(beforeFen); const after = researchPosition(afterFen); const move = parseUci(uci);
  if (move === undefined || !("from" in move)) return undefined;
  const oldPiece = before.board.get(move.from); const newPiece = after.board.get(move.to);
  return oldPiece?.role === "pawn" && newPiece?.role === "pawn" && oldPiece.color === newPiece.color
    ? { before, after, move, color: oldPiece.color }
    : undefined;
}

function pawnTargets(pos: Position, color: Color, square: Square): ReadonlySet<Square> {
  const result = new Set<Square>();
  for (const target of attacks({ color, role: "pawn" }, square, pos.board.occupied))
    if (pos.board.getColor(target) === opposite(color) && pos.board.getRole(target) === "pawn") result.add(target);
  return result;
}

function createdLever(beforeFen: string, uci: string, afterFen: string): boolean {
  const value = movedPawn(beforeFen, uci, afterFen); if (value === undefined || captureAt(value.before, value.move) !== undefined) return false;
  const oldTargets = pawnTargets(value.before, value.color, value.move.from);
  return [...pawnTargets(value.after, value.color, value.move.to)].some((square) => !oldTargets.has(square));
}

function executedLever(beforeFen: string, uci: string, afterFen: string): boolean {
  const value = movedPawn(beforeFen, uci, afterFen); if (value === undefined) return false;
  const captured = captureAt(value.before, value.move);
  return captured?.role === "pawn" && captured.color === opposite(value.color) && pawnTargets(value.before, value.color, value.move.from).has(value.move.to);
}

function candidateGained(beforeFen: string, uci: string, afterFen: string): boolean {
  const value = movedPawn(beforeFen, uci, afterFen);
  return value !== undefined && !candidateMajority(value.before, value.color, value.move.from) && candidateMajority(value.after, value.color, value.move.to);
}

function candidateAdvanced(beforeFen: string, uci: string, afterFen: string): boolean {
  const value = movedPawn(beforeFen, uci, afterFen);
  return value !== undefined && candidateMajority(value.before, value.color, value.move.from) && candidateMajority(value.after, value.color, value.move.to);
}

const PROBES: Readonly<Record<string, Probe>> = {
  moved_pawn_created_lever: createdLever,
  pawn_capture_executed_existing_lever: executedLever,
  moved_pawn_gained_candidate_majority: candidateGained,
  candidate_majority_pawn_advanced: candidateAdvanced,
};

interface Contribution { played: number; alt: number; alternatives: number }
function bootstrap(rows: readonly Contribution[]): readonly [number, number] {
  let state = 0x788c0de; const values: number[] = [];
  const random = (): number => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; return (state >>> 0) / 0x1_0000_0000; };
  for (let iteration = 0; iteration < 2_000; iteration += 1) {
    let p = 0; let a = 0; let n = 0;
    for (let draw = 0; draw < rows.length; draw += 1) { const row = rows[Math.floor(random() * rows.length)]!; p += row.played; a += row.alt; n += row.alternatives; }
    if (a > 0) values.push((p / rows.length) / (a / n));
  }
  values.sort((a, b) => a - b); return [values[Math.floor(values.length * .025)] ?? 0, values[Math.floor(values.length * .975)] ?? 0];
}

function measure(rows: readonly ResearchRow[]) {
  const data = new Map<string, Contribution[]>(); let decisions = 0; let alternatives = 0;
  for (const row of rows) {
    const alts = legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== row.fen); if (alts.length === 0) continue;
    decisions += 1; alternatives += alts.length;
    for (const [name, probe] of Object.entries(PROBES)) {
      let alt = 0; for (const candidate of alts) if (probe(row.parentFen, candidate.uci, candidate.fen)) alt += 1;
      const list = data.get(name) ?? []; list.push({ played: probe(row.parentFen, row.uci, row.fen) ? 1 : 0, alt, alternatives: alts.length }); data.set(name, list);
    }
  }
  return { decisions, alternatives, values: [...data].map(([name, rows]) => {
    const p = rows.reduce((n, r) => n + r.played, 0); const a = rows.reduce((n, r) => n + r.alt, 0); const ae = rows.reduce((n, r) => n + r.alternatives, 0);
    const pr = p / rows.length; const ar = a / ae; return { name, p, a, pr, ar, lift: ar === 0 ? Infinity : pr / ar, interval: bootstrap(rows) };
  }).sort((a, b) => b.lift - a.lift) };
}

function tripleEvents([first, second, third]: ResearchTriple): readonly string[] {
  const move = parseUci(first.uci); if (move === undefined || !("from" in move)) return [];
  const original = researchPosition(first.parentFen).board.get(move.from);
  if (original?.role !== "pawn") return [];
  const afterReply = researchPosition(second.fen); const thirdMove = parseUci(third.uci);
  const retained = afterReply.board.get(move.to)?.role === "pawn" && afterReply.board.getColor(move.to) === original.color;
  const events: string[] = [];
  if (createdLever(first.parentFen, first.uci, first.fen) && retained && pawnTargets(afterReply, original.color, move.to).size > 0)
    events.push("created_lever_survived_one_reply");
  if (createdLever(first.parentFen, first.uci, first.fen) && retained && thirdMove !== undefined && "from" in thirdMove && thirdMove.from === move.to && executedLever(third.parentFen, third.uci, third.fen))
    events.push("created_lever_executed_on_next_own_move");
  if (candidateGained(first.parentFen, first.uci, first.fen) && retained && thirdMove !== undefined && "from" in thirdMove && thirdMove.from === move.to) {
    const afterThird = researchPosition(third.fen);
    if (passed(afterThird, original.color, thirdMove.to)) events.push("candidate_became_passed_on_next_own_move");
  }
  return events;
}

function sequenceCensus(triples: readonly ResearchTriple[]) {
  const counts = new Map<string, number>(); const examples = new Map<string, string[]>();
  for (const triple of triples) for (const event of tripleEvents(triple)) {
    counts.set(event, (counts.get(event) ?? 0) + 1); const list = examples.get(event) ?? [];
    if (list.length < 8) list.push(`${triple[0].id} ${triple[0].uci} / ${triple[1].uci} / ${triple[2].uci}`); examples.set(event, list);
  }
  return { counts, examples };
}

function pct(value: number): string { return `${(100 * value).toFixed(3)}%`; }

describe("D788 pawn status and timing", () => {
  it("pins candidate-majority, lever creation and lever execution separately", () => {
    const candidate = "4k3/8/3p4/4p3/3P1P2/8/8/4K3 w - - 0 1";
    const candidateAfter = playedFen(candidate, "d4e5");
    expect(candidateGained(candidate, "d4e5", candidateAfter)).toBe(true);
    expect(passed(researchPosition(candidateAfter), "white", 36 as Square)).toBe(false);
    const lever = "4k3/8/4p3/8/3P4/8/8/4K3 w - - 0 1";
    expect(createdLever(lever, "d4d5", playedFen(lever, "d4d5"))).toBe(true);
    const execute = "4k3/8/4p3/3P4/8/8/8/4K3 w - - 0 1";
    expect(executedLever(execute, "d5e6", playedFen(execute, "d5e6"))).toBe(true);
  });

  it("retains the exact moved pawn through one reply", () => {
    const fen = "4k3/8/4p3/8/3P4/8/8/4K3 w - - 0 1";
    const first: ResearchRow = { id: "fixture#1", parentFen: fen, uci: "d4d5", fen: playedFen(fen, "d4d5") };
    const second: ResearchRow = { id: "fixture#2", parentFen: first.fen, uci: "e8f7", fen: playedFen(first.fen, "e8f7") };
    const third: ResearchRow = { id: "fixture#3", parentFen: second.fen, uci: "d5e6", fen: playedFen(second.fen, "d5e6") };
    expect(tripleEvents([first, second, third])).toContain("created_lever_executed_on_next_own_move");
  });

  it("measures one-edge populations and observed three-edge timing", () => {
    const imported = importedPopulation(); const full = imported.paths.flat();
    const ply = (row: ResearchRow): number => Number(/#(\d+)$/u.exec(row.id)?.[1] ?? 0);
    const lines = ["# D788 output", "", "Lift is played-vs-legal-alternative discrimination, not quality or favorable timing. candidate-majority@1 is the disclosed harness convention, not an engine score.", ""];
    for (const population of [
      { name: "authored pack spines", rows: authoredRows() },
      { name: "sealed imported fixed-ply sample", rows: imported.sampled },
      { name: "sealed imported full paths, plies 1–20", rows: full.filter((row) => ply(row) <= 20) },
      { name: "sealed imported full paths, plies 21–40", rows: full.filter((row) => ply(row) >= 21 && ply(row) <= 40) },
      { name: "sealed imported full paths, plies 41+", rows: full.filter((row) => ply(row) >= 41) },
    ]) {
      const result = measure(population.rows); lines.push(`## ${population.name}`, "", `Decisions: ${result.decisions}; alternatives: ${result.alternatives}.`, "", "| probe | played n/rate | alternatives n/rate | lift (paired bootstrap 95%) |", "|---|---:|---:|---:|");
      for (const v of result.values) lines.push(`| \`${v.name}\` | ${v.p} / ${pct(v.pr)} | ${v.a} / ${pct(v.ar)} | ${Number.isFinite(v.lift) ? `${v.lift.toFixed(2)}x (${v.interval[0].toFixed(2)}–${v.interval[1].toFixed(2)})` : "inf"} |`);
      lines.push("");
    }
    for (const source of [{ name: "authored triples", triples: authoredTriples() }, { name: "sealed imported triples", triples: pathTriples(imported.paths) }]) {
      const census = sequenceCensus(source.triples); lines.push(`## ${source.name}`, "", `Triples: ${source.triples.length}.`, "");
      for (const event of ["created_lever_survived_one_reply", "created_lever_executed_on_next_own_move", "candidate_became_passed_on_next_own_move"]) {
        lines.push(`- \`${event}\`: ${census.counts.get(event) ?? 0}`); for (const example of census.examples.get(event) ?? []) lines.push(`  - ${example}`);
      }
      lines.push("");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
    expect(authoredRows().length).toBeGreaterThan(700); expect(imported.sampled.length).toBe(579);
  });
});
