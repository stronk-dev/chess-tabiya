#!/usr/bin/env node

// DISPOSABLE research harness — D1023. Not production code.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";

import { castlingSide, Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, Move, Role, Square } from "chessops/types";
import { kingCastlesTo, makeSquare, makeUci, parseSquare, parseUci, rookCastlesTo } from "chessops/util";

import { exchangeCaptureAt, legalCaptureMovesTo, legalExchangeForMove } from "../../packages/runtime/src/exchange.js";

const SAMPLE = new URL("./provider-sample.json", import.meta.url).pathname;
const OUTPUT = new URL("./stockfish-output.json", import.meta.url).pathname;
const STOCKFISH = process.env.SF_CMD ?? "/opt/homebrew/bin/stockfish";
const DEPTHS = Object.freeze([8, 10] as const);
const SAMPLE_LIMIT = Number(process.env.D1023_SAMPLE_LIMIT ?? "0");
const PROMOTIONS: readonly Role[] = ["queen", "rook", "bishop", "knight"];

interface TrackedPiece { readonly color: Color; readonly role: Role; readonly square: Square }
interface MaterialTarget { readonly family: "material"; readonly attacker: TrackedPiece; readonly target: TrackedPiece }
interface DestinationTarget { readonly family: "destination"; readonly minor: TrackedPiece; readonly controllingPawn?: TrackedPiece; readonly square: Square }
type Target = MaterialTarget | DestinationTarget;
type Score = Readonly<{ kind: "cp" | "mate"; value: number }>;

interface SamplePair {
  readonly sourceId: string;
  readonly parentFen: string;
  readonly candidateUci: string;
  readonly afterFen: string;
  readonly played: boolean;
  readonly phase: string;
  readonly targetFamily: "material" | "destination";
  readonly target: Record<string, unknown>;
  readonly exact: Record<string, unknown>;
}

interface SampleArtifact {
  readonly populations: readonly { readonly population: string; readonly rows: readonly SamplePair[] }[];
}

function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function square(value: unknown, label: string): Square {
  if (typeof value !== "string") throw new TypeError(`${label} must be a square`);
  const parsed = parseSquare(value);
  if (parsed === undefined) throw new TypeError(`${label} must be a square`);
  return parsed;
}
function tracked(value: unknown, label: string): TrackedPiece {
  if (typeof value !== "object" || value === null) throw new TypeError(`${label} must be a piece`);
  const item = value as Record<string, unknown>;
  if (item.color !== "white" && item.color !== "black") throw new TypeError(`${label}.color is invalid`);
  if (!["pawn", "knight", "bishop", "rook", "queen", "king"].includes(String(item.role))) throw new TypeError(`${label}.role is invalid`);
  return Object.freeze({ color: item.color, role: item.role as Role, square: square(item.square, `${label}.square`) });
}
function target(pair: SamplePair): Target {
  return pair.targetFamily === "material"
    ? Object.freeze({ family: "material", attacker: tracked(pair.target.attacker, "target.attacker"), target: tracked(pair.target.target, "target.target") })
    : Object.freeze({ family: "destination", minor: tracked(pair.target.minor, "target.minor"), ...(pair.target.controllingPawn === null ? {} : { controllingPawn: tracked(pair.target.controllingPawn, "target.controllingPawn") }), square: square(pair.target.square, "target.square") });
}

function samePiece(pos: Chess, value: TrackedPiece): boolean {
  const piece = pos.board.get(value.square);
  return piece?.color === value.color && piece.role === value.role;
}
function advanceIdentity(pos: Chess, move: Move, value: TrackedPiece): TrackedPiece | undefined {
  const side = castlingSide(pos, move);
  if (side !== undefined && "from" in move) {
    const rookFrom = pos.castles.rook[pos.turn][side];
    if (move.from === value.square) return Object.freeze({ ...value, square: kingCastlesTo(pos.turn, side) });
    if (rookFrom === value.square) return Object.freeze({ ...value, square: rookCastlesTo(pos.turn, side) });
  }
  if (exchangeCaptureAt(pos, move)?.square === value.square) return undefined;
  if (!("from" in move) || move.from !== value.square) return value;
  return Object.freeze({ ...value, role: move.promotion ?? value.role, square: move.to });
}
function playTracked(pos: Chess, move: Move, value: Target): { readonly pos: Chess; readonly target?: Target } {
  const next = pos.clone();
  if (value.family === "material") {
    const attacker = advanceIdentity(pos, move, value.attacker), victim = advanceIdentity(pos, move, value.target);
    next.play(move);
    if (attacker === undefined || victim === undefined || !samePiece(next, attacker) || !samePiece(next, victim)) return Object.freeze({ pos: next });
    return Object.freeze({ pos: next, target: Object.freeze({ family: "material", attacker, target: victim }) });
  }
  const minor = advanceIdentity(pos, move, value.minor);
  const controllingPawn = value.controllingPawn === undefined ? undefined : advanceIdentity(pos, move, value.controllingPawn);
  next.play(move);
  if (minor === undefined || !samePiece(next, minor) || controllingPawn !== undefined && !samePiece(next, controllingPawn)) return Object.freeze({ pos: next });
  return Object.freeze({ pos: next, target: Object.freeze({ family: "destination", minor, ...(controllingPawn === undefined ? {} : { controllingPawn }), square: value.square }) });
}

function locallyNonLosingQuiet(pos: Chess, move: Move): boolean {
  if (!("from" in move) || !pos.isLegal(move) || exchangeCaptureAt(pos, move) !== undefined) return false;
  const next = pos.clone();
  next.play(move);
  return !legalCaptureMovesTo(next, move.to).some((capture) => (legalExchangeForMove(next, capture)?.resultUnits ?? 0) > 0);
}
function targetMove(pos: Chess, value: Target): Move | undefined {
  if (value.family === "material") {
    if (pos.turn !== value.attacker.color || !samePiece(pos, value.attacker) || !samePiece(pos, value.target)) return undefined;
    const move: Move = { from: value.attacker.square, to: value.target.square };
    return pos.isLegal(move) && (legalExchangeForMove(pos, move)?.resultUnits ?? 0) > 0 ? move : undefined;
  }
  if (pos.turn !== value.minor.color || !samePiece(pos, value.minor) || pos.board.get(value.square) !== undefined) return undefined;
  const move: Move = { from: value.minor.square, to: value.square };
  return locallyNonLosingQuiet(pos, move) ? move : undefined;
}
function executesTarget(pos: Chess, value: Target, uci: string): boolean {
  const expected = targetMove(pos, value), actual = parseUci(uci);
  return expected !== undefined && actual !== undefined && "from" in expected && "from" in actual && expected.from === actual.from && expected.to === actual.to && expected.promotion === actual.promotion;
}

function uciForEngine(pos: Chess, move: Move): string {
  const side = castlingSide(pos, move);
  return side === undefined || !("from" in move) ? makeUci(move) : makeUci({ from: move.from, to: kingCastlesTo(pos.turn, side) });
}
function legalUci(pos: Chess): readonly string[] {
  const result: string[] = [];
  for (const [from, destinations] of pos.allDests()) for (const to of destinations) {
    const roles: readonly (Role | undefined)[] = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? PROMOTIONS : [undefined];
    for (const promotion of roles) {
      const move: Move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (pos.isLegal(move)) result.push(uciForEngine(pos, move));
    }
  }
  return Object.freeze(result.sort());
}

function parsedScore(line: string): Score | undefined {
  const match = /\bscore (cp|mate) (-?\d+)\b/u.exec(line);
  return match === null ? undefined : Object.freeze({ kind: match[1] as Score["kind"], value: Number(match[2]) });
}
function neutralKey(fen: string, moveUci: string): string {
  const positionKey = fen.trim().split(/\s+/u).slice(0, 5).join(" ");
  return createHash("sha256").update(positionKey).update("\0").update(moveUci).digest("hex");
}
function compareBest(left: { uci: string; score: Score }, right: { uci: string; score: Score }, fen: string): number {
  const l = left.score, r = right.score;
  if (l.kind === "mate" || r.kind === "mate") {
    const category = (value: Score): number => value.kind === "cp" ? 1 : value.value > 0 ? 2 : 0;
    const categoryDelta = category(r) - category(l);
    if (categoryDelta !== 0) return categoryDelta;
    if (l.kind === "mate" && r.kind === "mate" && l.value !== r.value) {
      return l.value > 0 ? l.value - r.value : l.value - r.value;
    }
  } else if (l.value !== r.value) return r.value - l.value;
  const leftKey = neutralKey(fen, left.uci), rightKey = neutralKey(fen, right.uci);
  return leftKey.localeCompare(rightKey) || left.uci.localeCompare(right.uci);
}

class Stockfish {
  readonly process = spawn(STOCKFISH, [], { stdio: ["pipe", "pipe", "inherit"] });
  readonly queue: string[] = [];
  readonly waiters: Array<(line: string) => void> = [];
  identity = "unknown";
  constructor() {
    createInterface({ input: this.process.stdout }).on("line", (line) => {
      const waiter = this.waiters.shift();
      if (waiter === undefined) this.queue.push(line); else waiter(line);
    });
  }
  send(command: string): void { this.process.stdin.write(`${command}\n`); }
  async next(): Promise<string> { return this.queue.shift() ?? new Promise((resolve) => this.waiters.push(resolve)); }
  async until(predicate: (line: string) => boolean): Promise<string[]> {
    const rows: string[] = [];
    while (true) { const line = await this.next(); rows.push(line); if (predicate(line)) return rows; }
  }
  async initialize(): Promise<void> {
    this.send("uci");
    const rows = await this.until((line) => line === "uciok");
    this.identity = rows.find((line) => line.startsWith("id name "))?.slice(8) ?? "unknown";
    this.send("setoption name Threads value 1");
    this.send("setoption name Hash value 16");
    this.send("setoption name UCI_Chess960 value false");
    this.send("isready");
    await this.until((line) => line === "readyok");
  }
  async probe(pos: Chess, depth: number): Promise<Readonly<Record<string, unknown>>> {
    const fen = makeFen(pos.toSetup());
    const moves = legalUci(pos);
    if (moves.length === 0) return Object.freeze({ terminal: true, fen, depth, moves: 0, elapsedMs: 0 });
    this.send("ucinewgame");
    this.send("setoption name Clear Hash");
    this.send(`setoption name MultiPV value ${moves.length}`);
    this.send("isready");
    await this.until((line) => line === "readyok");
    this.send(`position fen ${fen}`);
    const started = performance.now();
    this.send(`go depth ${depth} searchmoves ${moves.join(" ")}`);
    const rows = await this.until((line) => line.startsWith("bestmove "));
    const finalByMove = new Map<string, string>();
    for (const line of rows) {
      if (!line.startsWith("info ") || parsedScore(line) === undefined) continue;
      const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/u.exec(line)?.[1];
      if (move !== undefined && moves.includes(move)) finalByMove.set(move, line);
    }
    const entries = moves.map((uci) => {
      const line = finalByMove.get(uci), score = line === undefined ? undefined : parsedScore(line);
      if (line === undefined || score === undefined) throw new Error(`${fen}: depth ${depth} omitted ${uci}`);
      if (/\b(?:lowerbound|upperbound)\b/u.test(line)) throw new Error(`${fen}: depth ${depth} bounded ${uci}`);
      return Object.freeze({ uci, score, reachedDepth: Number(/\bdepth (\d+)\b/u.exec(line)?.[1] ?? 0) });
    });
    const chosen = entries.toSorted((left, right) => compareBest(left, right, fen))[0]!;
    const engineBestMove = /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/u.exec(rows.at(-1) ?? "")?.[1] ?? null;
    const reachedDepths = entries.map((entry) => entry.reachedDepth);
    return Object.freeze({
      terminal: false,
      fen,
      depth,
      moves: moves.length,
      entryCount: entries.length,
      minReachedDepth: Math.min(...reachedDepths),
      maxReachedDepth: Math.max(...reachedDepths),
      elapsedMs: Number((performance.now() - started).toFixed(1)),
      engineBestMove,
      chosen,
    });
  }
  close(): void { this.send("quit"); }
}

function moveFromUci(pos: Chess, uci: string): Move {
  const move = parseUci(uci);
  if (move === undefined || !pos.isLegal(move)) throw new TypeError(`Engine returned illegal move ${uci}`);
  return move;
}
async function line(engine: Stockfish, pair: SamplePair, depth: number): Promise<Readonly<Record<string, unknown>>> {
  let pos = position(pair.afterFen), value: Target | undefined = target(pair);
  const first = await engine.probe(pos, depth);
  if (first.terminal === true) return Object.freeze({ depth, nextExecution: false, secondOpportunityAvailable: false, first });
  const firstUci = (first.chosen as { uci: string }).uci;
  const nextExecution = value !== undefined && executesTarget(pos, value, firstUci);
  const firstPlayed = playTracked(pos, moveFromUci(pos, firstUci), value!);
  pos = firstPlayed.pos; value = firstPlayed.target;
  if (value === undefined) return Object.freeze({ depth, nextExecution, secondOpportunityAvailable: false, first });
  const second = await engine.probe(pos, depth);
  if (second.terminal === true) return Object.freeze({ depth, nextExecution, secondOpportunityAvailable: false, first, second });
  const secondUci = (second.chosen as { uci: string }).uci;
  const secondPlayed = playTracked(pos, moveFromUci(pos, secondUci), value);
  pos = secondPlayed.pos; value = secondPlayed.target;
  return Object.freeze({ depth, nextExecution, secondOpportunityAvailable: value !== undefined && targetMove(pos, value) !== undefined, first, second });
}

function percentile(values: readonly number[], fraction: number): number {
  const sorted = values.toSorted((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)] ?? 0;
}

export async function runStockfishProbe(): Promise<Readonly<{ rows: number; agreement: number; engine: string }>> {
  const sampleBytes = await readFile(SAMPLE);
  const sample = JSON.parse(sampleBytes.toString("utf8")) as SampleArtifact;
  const selectedPairs = sample.populations.flatMap((population) => population.rows.map((pair) => ({ population: population.population, pair })));
  const jobs = SAMPLE_LIMIT > 0 ? selectedPairs.slice(0, SAMPLE_LIMIT) : selectedPairs;
  const engine = new Stockfish();
  await engine.initialize();
  const rows: Array<Readonly<Record<string, unknown>>> = [];
  try {
    let done = 0;
    for (const job of jobs) {
      const { population, pair } = job;
      const byDepth: Record<string, Readonly<Record<string, unknown>>> = {};
      for (const depth of DEPTHS) byDepth[String(depth)] = await line(engine, pair, depth);
      rows.push(Object.freeze({ population, pair, byDepth: Object.freeze(byDepth) }));
      done += 1;
      if (done % 8 === 0 || done === jobs.length) process.stderr.write(`${done}/${jobs.length}\n`);
    }
  } finally { engine.close(); }

  const agreement = rows.filter((row) => {
    const byDepth = row.byDepth as Record<string, { nextExecution: boolean; secondOpportunityAvailable: boolean }>;
    return byDepth["8"]!.nextExecution === byDepth["10"]!.nextExecution && byDepth["8"]!.secondOpportunityAvailable === byDepth["10"]!.secondOpportunityAvailable;
  }).length;
  const latencies = rows.flatMap((row) => Object.values(row.byDepth as Record<string, { first: { elapsedMs?: number }; second?: { elapsedMs?: number } }>).flatMap((result) => [result.first.elapsedMs ?? 0, ...(result.second === undefined ? [] : [result.second.elapsedMs ?? 0])]));
  await writeFile(OUTPUT, `${JSON.stringify({
    version: 1,
    source: Object.freeze({ engine: engine.identity, command: STOCKFISH, depths: DEPTHS, threads: 1, hashMb: 16, sampleLimit: SAMPLE_LIMIT > 0 ? SAMPLE_LIMIT : null }),
    sampleDigest: createHash("sha256").update(sampleBytes).digest("hex"),
    summary: Object.freeze({ rows: rows.length, categoryAgreement: agreement, categoryAgreementRate: agreement / rows.length, coldProbeLatencyMs: Object.freeze({ count: latencies.length, p50: percentile(latencies, .5), p90: percentile(latencies, .9), p99: percentile(latencies, .99), max: Math.max(...latencies) }), warmProbeLatencyMs: null }),
    rows,
  }, null, 2)}\n`, "utf8");
  return Object.freeze({ rows: rows.length, agreement, engine: engine.identity });
}
