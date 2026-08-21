// DISPOSABLE research harness — D730. Not production code.
import { performance } from "node:perf_hooks";
import { readFileSync, writeFileSync } from "node:fs";

import { attacks } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import type { Color, Move, Piece, Role, Square } from "chessops/types";
import { makeUci, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { transitions } from "../r1r2-primitives-harness/corpus.js";

const OUTPUT = new URL("./output.md", import.meta.url).pathname;
const IMPORTED = new URL("../r2-selection-harness/imported-sample.pgn", import.meta.url).pathname;
const TARGET_PLIES = new Set([8, 16, 24, 32, 40, 48]);
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];
const VALUE: Readonly<Record<Role, number>> = { pawn: 1, knight: 3, bishop: 3, rook: 5, queen: 9, king: 100 };

interface Row {
  readonly id: string;
  readonly parentFen: string;
  readonly uci: string;
}

interface Outcome {
  readonly uci: string;
  readonly fen: string;
}

type Probe = (beforeFen: string, uci: string, afterFen: string) => boolean;

function position(fen: string): Chess {
  return Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
}

function captureAt(pos: Chess, move: Move): Piece | undefined {
  if (!("from" in move)) return undefined;
  const mover = pos.board.get(move.from);
  if (mover === undefined) return undefined;
  const direct = pos.board.get(move.to);
  if (direct !== undefined && direct.color !== mover.color) return direct;
  if (mover.role === "pawn" && pos.epSquare === move.to && move.from % 8 !== move.to % 8) {
    return { color: opposite(mover.color), role: "pawn" };
  }
  return undefined;
}

function captureMovesTo(pos: Chess, target: Square, fromOnly?: Square): readonly Move[] {
  const result: Move[] = [];
  for (const [from, dests] of pos.allDests()) {
    if (fromOnly !== undefined && from !== fromOnly) continue;
    if (!dests.has(target)) continue;
    const roles: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (target < 8 || target >= 56)
      ? PROMOTIONS
      : [undefined];
    for (const promotion of roles) {
      const move: Move = promotion === undefined ? { from, to: target } : { from, to: target, promotion };
      if (captureAt(pos, move) !== undefined && pos.isLegal(move)) result.push(move);
    }
  }
  return result;
}

function promotionGain(pos: Chess, move: Move): number {
  if (!("from" in move) || move.promotion === undefined || pos.board.getRole(move.from) !== "pawn") return 0;
  return VALUE[move.promotion] - VALUE.pawn;
}

function continuation(pos: Chess, target: Square, perspective: Color, memo: Map<string, number>): number {
  const key = `${makeFen(pos.toSetup())}|${target}|${perspective}`;
  const cached = memo.get(key);
  if (cached !== undefined) return cached;
  const sign = pos.turn === perspective ? 1 : -1;
  const values = captureMovesTo(pos, target).map((move) => {
    const captured = captureAt(pos, move)!;
    const delta = sign * (VALUE[captured.role] + promotionGain(pos, move));
    const next = pos.clone();
    next.play(move);
    return delta + continuation(next, target, perspective, memo);
  });
  const value = pos.turn === perspective ? Math.max(0, ...values) : Math.min(0, ...values);
  memo.set(key, value);
  return value;
}

function legalExchangeForMove(pos: Chess, move: Move): number | undefined {
  if (!("from" in move) || !pos.isLegal(move)) return undefined;
  const captured = captureAt(pos, move);
  if (captured === undefined) return undefined;
  const perspective = pos.turn;
  const initial = VALUE[captured.role] + promotionGain(pos, move);
  const next = pos.clone();
  next.play(move);
  return initial + continuation(next, move.to, perspective, new Map());
}

function legalExchange(fen: string, uci: string): number | undefined {
  const pos = position(fen);
  const move = parseUci(uci);
  return move === undefined ? undefined : legalExchangeForMove(pos, move);
}

function playedFen(beforeFen: string, uci: string): string {
  const pos = position(beforeFen);
  const move = parseUci(uci);
  if (move === undefined || !pos.isLegal(move)) throw new Error(`illegal move ${uci} from ${beforeFen}`);
  pos.play(move);
  return makeFen(pos.toSetup());
}

function legalOutcomes(fen: string): readonly Outcome[] {
  const pos = position(fen);
  const result: Outcome[] = [];
  for (const [from, dests] of pos.allDests()) for (const to of dests) {
    const roles: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? PROMOTIONS : [undefined];
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

function movedPieceTargets(beforeFen: string, uci: string, afterFen: string, exchangeFiltered: boolean): number {
  const before = position(beforeFen);
  const after = position(afterFen);
  const parsed = parseUci(uci);
  if (parsed === undefined || !("from" in parsed)) return 0;
  const moved = after.board.get(parsed.to);
  if (moved === undefined) return 0;
  const enemy = opposite(moved.color);
  let count = 0;
  for (const target of attacks(moved, parsed.to, after.board.occupied)) {
    const victim = after.board.get(target);
    if (victim?.color !== enemy) continue;
    if (victim.role === "king") {
      count += 1;
      continue;
    }
    if (!exchangeFiltered) {
      if (VALUE[victim.role] >= 3) count += 1;
      continue;
    }
    const hypothetical = after.clone();
    hypothetical.turn = moved.color;
    const capture = captureMovesTo(hypothetical, target, parsed.to)[0];
    if (capture !== undefined && (legalExchangeForMove(hypothetical, capture) ?? 0) > 0) count += 1;
  }
  return count;
}

function movedPieceEnPrise(_beforeFen: string, uci: string, afterFen: string): boolean {
  const after = position(afterFen);
  const parsed = parseUci(uci);
  if (parsed === undefined || !("from" in parsed)) return false;
  return captureMovesTo(after, parsed.to).some((move) => (legalExchangeForMove(after, move) ?? 0) > 0);
}

const PROBES: Readonly<Record<string, Probe>> = {
  moved_piece_en_prise: movedPieceEnPrise,
  geometry_fork: (before, uci, after) => movedPieceTargets(before, uci, after, false) >= 2,
  meaningful_fork: (before, uci, after) => movedPieceTargets(before, uci, after, true) >= 2,
};

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

function importedRows(): readonly Row[] {
  const blocks = readFileSync(IMPORTED, "utf8").split(/\n(?=\[Event )/u);
  const accepted = new Map<string, number>();
  const rows: Row[] = [];
  const full = (): boolean => ["bullet", "blitz", "rapid"].every((time) =>
    ["1000-1399", "1400-1799", "1800-2199"].every((elo) => (accepted.get(`${time}/${elo}`) ?? 0) >= 12));
  for (const block of blocks) {
    if (full()) break;
    let game;
    try {
      [game] = parsePgn(block);
    } catch {
      continue;
    }
    if (game === undefined || game.headers.get("Result") === "*" ||
      game.headers.get("Variant") !== undefined && game.headers.get("Variant") !== "Standard") continue;
    const time = speed(game.headers.get("Event") ?? "");
    const elo = band((Number(game.headers.get("WhiteElo")) + Number(game.headers.get("BlackElo"))) / 2);
    if (time === undefined || elo === undefined) continue;
    const cell = `${time}/${elo}`;
    if ((accepted.get(cell) ?? 0) >= 12) continue;
    const pos = startingPosition(game.headers).unwrap();
    const candidates: Row[] = [];
    let ply = 0;
    let legal = true;
    for (const data of game.moves.mainline()) {
      const move = parseSan(pos, data.san);
      if (move === undefined || !pos.isLegal(move)) {
        legal = false;
        break;
      }
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

function authoredRows(): readonly Row[] {
  return transitions().map((row) => ({ id: `${row.pack}/${row.nodeId}`, parentFen: row.parentFen, uci: row.uci }));
}

function metric(rows: readonly Row[]): {
  readonly rows: number;
  readonly alternatives: number;
  readonly elapsedMs: number;
  readonly values: readonly { name: string; played: number; alt: number; playedRate: number; altRate: number; lift: number; interval: readonly [number, number] }[];
  readonly disagreementExamples: readonly string[];
} {
  const started = performance.now();
  const played = new Map<string, number>();
  const alt = new Map<string, number>();
  const contributions = new Map<string, { played: number; alt: number; alternatives: number }[]>();
  const disagreementExamples: string[] = [];
  let rowCount = 0;
  let alternativeCount = 0;
  for (const row of rows) {
    const actual = playedFen(row.parentFen, row.uci);
    const alternatives = legalOutcomes(row.parentFen).filter((candidate) => candidate.fen !== actual);
    if (alternatives.length === 0) continue;
    rowCount += 1;
    const rowPlayed = new Map<string, number>();
    const rowAlternatives = new Map<string, number>();
    for (const [name, probe] of Object.entries(PROBES)) if (probe(row.parentFen, row.uci, actual)) {
      played.set(name, (played.get(name) ?? 0) + 1);
      rowPlayed.set(name, 1);
    }
    const playedGeometry = PROBES.geometry_fork!(row.parentFen, row.uci, actual);
    const playedMeaningful = PROBES.meaningful_fork!(row.parentFen, row.uci, actual);
    if (playedGeometry !== playedMeaningful && disagreementExamples.length < 5) disagreementExamples.push(`${row.id}:${row.uci}:${playedGeometry ? "geometry-only" : "exchange-only"}`);
    for (const candidate of alternatives) {
      alternativeCount += 1;
      for (const [name, probe] of Object.entries(PROBES)) if (probe(row.parentFen, candidate.uci, candidate.fen)) {
        alt.set(name, (alt.get(name) ?? 0) + 1);
        rowAlternatives.set(name, (rowAlternatives.get(name) ?? 0) + 1);
      }
    }
    for (const name of Object.keys(PROBES)) {
      const values = contributions.get(name) ?? [];
      values.push({ played: rowPlayed.get(name) ?? 0, alt: rowAlternatives.get(name) ?? 0, alternatives: alternatives.length });
      contributions.set(name, values);
    }
  }
  const values = Object.keys(PROBES).map((name) => {
    const p = played.get(name) ?? 0;
    const a = alt.get(name) ?? 0;
    const playedRate = p / rowCount;
    const altRate = a / alternativeCount;
    return { name, played: p, alt: a, playedRate, altRate, lift: altRate === 0 ? Number.POSITIVE_INFINITY : playedRate / altRate, interval: bootstrapLift(contributions.get(name) ?? []) };
  }).sort((left, right) => right.lift - left.lift || left.name.localeCompare(right.name));
  return { rows: rowCount, alternatives: alternativeCount, elapsedMs: performance.now() - started, values, disagreementExamples };
}

function bootstrapLift(rows: readonly { played: number; alt: number; alternatives: number }[]): readonly [number, number] {
  let state = 0x730c0de;
  const random = (): number => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
  const samples: number[] = [];
  for (let iteration = 0; iteration < 2_000; iteration += 1) {
    let played = 0;
    let alt = 0;
    let alternatives = 0;
    for (let draw = 0; draw < rows.length; draw += 1) {
      const row = rows[Math.floor(random() * rows.length)]!;
      played += row.played;
      alt += row.alt;
      alternatives += row.alternatives;
    }
    const playedRate = played / rows.length;
    const altRate = alt / alternatives;
    if (altRate > 0) samples.push(playedRate / altRate);
  }
  samples.sort((left, right) => left - right);
  return [samples[Math.floor(samples.length * 0.025)]!, samples[Math.floor(samples.length * 0.975)]!];
}

function pct(value: number): string {
  return `${(100 * value).toFixed(3)}%`;
}

describe("D730 legal exchange", () => {
  it("passes winning, losing, X-ray and pinned-recapturer controls", () => {
    const freeKnight = "4k3/8/8/8/8/2n5/3P4/3QK3 w - - 0 1";
    expect(legalExchange(freeKnight, "d2c3")).toBe(3);

    const poisonedPawn = "r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1";
    expect(legalExchange(poisonedPawn, "a1a7")).toBe(-4);

    const xrayRecapture = "r3k3/8/8/p7/8/8/R7/Q3K3 w - - 0 1";
    expect(legalExchange(xrayRecapture, "a2a5")).toBe(1);

    const pinnedRecapturer = "4k3/4n3/2p5/1B6/8/8/8/4R1K1 w - - 0 1";
    expect(legalExchange(pinnedRecapturer, "b5c6")).toBe(1);
  });

  it("filters a defended geometry-only fork", () => {
    const before = "4k3/2p3p1/3b3b/8/3N4/8/8/4K3 w - - 0 1";
    const after = playedFen(before, "d4f5");
    expect(movedPieceTargets(before, "d4f5", after, false)).toBe(2);
    expect(movedPieceTargets(before, "d4f5", after, true)).toBe(0);
  });

  it("measures downstream sign, disagreement and cost on both frozen populations", () => {
    const populations = [
      { name: "authored pack spines", result: metric(authoredRows()) },
      { name: "sealed imported CC0 sample", result: metric(importedRows()) },
    ];
    const lines = [
      "# D730 legal-exchange output",
      "",
      "`legal-exchange@1` is legal recapture-only minimax under P1/N3/B3/R5/Q9. Lift is discrimination, not truth or move quality.",
      "",
    ];
    for (const population of populations) {
      const result = population.result;
      lines.push(`## ${population.name}`, "", `Rows ${result.rows}; alternatives ${result.alternatives}; elapsed ${result.elapsedMs.toFixed(1)} ms (${(result.elapsedMs / (result.rows + result.alternatives)).toFixed(4)} ms per evaluated edge).`, "", "| probe | played n/rate | alternatives n/rate | lift (paired position bootstrap 95%) |", "|---|---:|---:|---:|");
      for (const value of result.values) lines.push(`| \`${value.name}\` | ${value.played} / ${pct(value.playedRate)} | ${value.alt} / ${pct(value.altRate)} | ${Number.isFinite(value.lift) ? `${value.lift.toFixed(2)}x (${value.interval[0].toFixed(2)}–${value.interval[1].toFixed(2)})` : "inf"} |`);
      lines.push("", `First geometry/exchange disagreements: ${result.disagreementExamples.map((value) => `\`${value}\``).join(", ") || "none"}.`, "");
    }
    writeFileSync(OUTPUT, `${lines.join("\n")}\n`, "utf8");
    expect(populations[0]!.result.disagreementExamples.length).toBeGreaterThan(0);
    expect(populations[1]!.result.disagreementExamples.length).toBeGreaterThan(0);
  });
});
