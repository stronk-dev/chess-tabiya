// Disposable D3262 provider capture. Retains every scored root move and its PV;
// it does not assign a semantic reason, grade a learner move, or select a profile.
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";

import { castlingSide, Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { kingCastlesTo, makeUci, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";

import { manifestIdentity, manifestRows } from "./manifest.mjs";

const SF_CMD = process.env.SF_CMD;
if (SF_CMD === undefined || SF_CMD.length === 0) throw new Error("SF_CMD must identify the Stockfish binary; use the Make target");
const args = process.argv.slice(2);
function option(name) {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}
const limit = option("--limit") === undefined ? manifestRows.length : Number(option("--limit"));
if (!Number.isSafeInteger(limit) || limit < 1 || limit > manifestRows.length) throw new Error("--limit must be a positive manifest prefix length");
const fullOutput = new URL("../../planning/semantic-consequence-search/d3262-stockfish-capture.json", import.meta.url);
const output = option("--out") ?? (limit === manifestRows.length ? fullOutput : undefined);
if (output === undefined) throw new Error("A partial capture requires --out so it cannot masquerade as the full artifact");
const jobs = manifestRows.slice(0, limit);
const PROMOTIONS = Object.freeze(["queen", "rook", "bishop", "knight"]);

function position(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function engineUci(pos, move) {
  const side = castlingSide(pos, move);
  return side === undefined || !("from" in move) ? makeUci(move) : makeUci({ from: move.from, to: kingCastlesTo(pos.turn, side) });
}
function legalMoves(pos) {
  const result = [];
  for (const [from, destinations] of pos.allDests()) for (const to of destinations) {
    const roles = pos.board.getRole(from) === "pawn" && (to < 8 || to >= 56) ? PROMOTIONS : [undefined];
    for (const promotion of roles) {
      const move = promotion === undefined ? { from, to } : { from, to, promotion };
      if (pos.isLegal(move)) result.push(engineUci(pos, move));
    }
  }
  const unique = [...new Set(result)].sort();
  if (unique.length !== result.length) throw new Error("Legal root move enumeration produced duplicate UCI values");
  return unique;
}
function replayPv(fen, raw) {
  const pos = position(fen), normalized = [];
  for (const uci of raw) {
    const parsed = parseUci(uci);
    if (parsed === undefined) throw new Error(`Invalid PV UCI ${uci}`);
    const move = normalizeMove(pos, parsed);
    if (!pos.isLegal(move)) throw new Error(`Illegal PV UCI ${uci} after ${normalized.join(" ")}`);
    normalized.push(engineUci(pos, move));
    pos.play(move);
  }
  return normalized;
}
function score(line) {
  const match = /\bscore (cp|mate) (-?\d+)\b/u.exec(line);
  return match === null ? undefined : { kind: match[1], value: Number(match[2]), bound: /\b(?:lowerbound|upperbound)\b/u.test(line) };
}
function info(line, legal, fen) {
  if (!line.startsWith("info ")) return undefined;
  const value = score(line);
  const depth = Number(/\bdepth (\d+)\b/u.exec(line)?.[1] ?? 0);
  const rank = Number(/\bmultipv (\d+)\b/u.exec(line)?.[1] ?? 1);
  const rawPv = /\bpv ((?:[a-h][1-8][a-h][1-8][qrbn]?(?:\s+|$))+)/u.exec(line)?.[1]?.trim().split(/\s+/u);
  if (value === undefined || rawPv === undefined || depth < 1 || rank < 1) return undefined;
  if (!legal.has(rawPv[0])) throw new Error(`Stockfish PV first move is not in the legal root set: ${rawPv[0]}`);
  return { moveUci: rawPv[0], rank, depth, score: value, pv: replayPv(fen, rawPv) };
}

class UciEngine {
  process;
  queue = [];
  waiters = [];
  identity = "unknown";
  failure;
  closed = false;
  constructor() {
    this.process = spawn(SF_CMD, [], { stdio: ["pipe", "pipe", "pipe"] });
    createInterface({ input: this.process.stdout }).on("line", (line) => {
      const waiter = this.waiters.shift();
      if (waiter === undefined) this.queue.push(line); else waiter(line);
    });
    this.process.on("error", (error) => this.fail(error));
    this.process.on("exit", (code, signal) => {
      if (!this.closed) this.fail(new Error(`Stockfish exited early: code=${code}, signal=${signal}`));
    });
  }
  fail(error) { this.failure = error; for (const waiter of this.waiters.splice(0)) waiter(undefined); }
  send(line) { this.process.stdin.write(`${line}\n`); }
  async next() {
    if (this.failure !== undefined) throw this.failure;
    if (this.queue.length > 0) return this.queue.shift();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.waiters = this.waiters.filter((value) => value !== receive); reject(new Error("Stockfish response timed out")); }, 60_000);
      const receive = (line) => { clearTimeout(timer); if (line === undefined) reject(this.failure ?? new Error("Stockfish ended without a response")); else resolve(line); };
      this.waiters.push(receive);
    });
  }
  async until(predicate) {
    const lines = [];
    while (true) { const line = await this.next(); lines.push(line); if (predicate(line)) return lines; }
  }
  async initialize() {
    this.send("uci");
    const hello = await this.until((line) => line === "uciok");
    this.identity = hello.find((line) => line.startsWith("id name "))?.slice(8) ?? "unknown";
    this.send("setoption name Threads value 1");
    this.send("setoption name Hash value 16");
    this.send("setoption name UCI_Chess960 value false");
    this.send("isready");
    await this.until((line) => line === "readyok");
  }
  async probe(fen, budget) {
    const legal = legalMoves(position(fen));
    if (legal.length === 0) return { budget, legal, entries: [], missingMoves: [], terminal: true, elapsedMs: 0 };
    this.send("ucinewgame");
    this.send("setoption name Clear Hash");
    this.send(`setoption name MultiPV value ${legal.length}`);
    this.send("isready");
    await this.until((line) => line === "readyok");
    this.send(`position fen ${fen}`);
    const started = performance.now();
    this.send(budget === "movetime100" ? `go movetime 100 searchmoves ${legal.join(" ")}` : `go depth ${budget.slice(5)} searchmoves ${legal.join(" ")}`);
    const lines = await this.until((line) => line.startsWith("bestmove "));
    const latest = new Map();
    const legalSet = new Set(legal);
    for (const line of lines) {
      const entry = info(line, legalSet, fen);
      if (entry === undefined) continue;
      const prior = latest.get(entry.moveUci);
      if (prior === undefined || entry.depth >= prior.depth) latest.set(entry.moveUci, entry);
    }
    const entries = [...latest.values()].sort((left, right) => left.rank - right.rank || left.moveUci.localeCompare(right.moveUci));
    const missingMoves = legal.filter((uci) => !latest.has(uci));
    return { budget, legal, entries, missingMoves, terminal: false, bestmove: /^bestmove (\S+)/u.exec(lines.at(-1))?.[1] ?? null, elapsedMs: Number((performance.now() - started).toFixed(2)) };
  }
  close() { this.closed = true; if (this.process.exitCode === null) this.send("quit"); }
}

const executableDigest = `sha256:${createHash("sha256").update(readFileSync(SF_CMD)).digest("hex")}`;
const engine = new UciEngine();
const rows = [];
try {
  await engine.initialize();
  for (const root of jobs) {
    const probes = [];
    for (const budget of ["depth8", "depth12", "movetime100"]) probes.push(await engine.probe(root.fen, budget));
    rows.push({ rootId: root.id, fen: root.fen, probes });
    process.stderr.write(`D3262 Stockfish ${rows.length}/${jobs.length}: ${root.id}\n`);
  }
} finally { engine.close(); }
const artifact = {
  version: 1,
  manifest: manifestIdentity.manifestDigest,
  partial: limit !== manifestRows.length,
  roots: rows.length,
  source: { engineName: engine.identity, executableDigest, threads: 1, hashMb: 16, multiPv: "all_legal_root_moves", scorePerspective: "raw_uci_uninterpreted" },
  rows,
};
await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${JSON.stringify({ output: String(output), roots: rows.length, engine: engine.identity, manifest: artifact.manifest, partial: artifact.partial })}\n`);
