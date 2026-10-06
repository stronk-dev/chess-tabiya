// Disposable D3262 UCI transport for additional frozen research jobs. The old
// live capturer is deliberately untouched; shared legality/rank/source checks
// remain the authority. This module neither selects a profile nor grades moves.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { selectCoherentTopEntries } from "./stockfish-coherent-table.mjs";

function check(value, message) { if (!value) throw new Error(message); }
function board(fen) { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
export function parseCoherentQuery(fen, lines) {
  const legal = legalMoves(board(fen)).map((entry) => entry.uci), count = Math.min(8, legal.length);
  check(count > 0, "A frozen nonterminal query has no legal moves");
  const parsed = [];
  for (const line of lines) {
    if (!line.startsWith("info ")) continue;
    const score = /\bscore (cp|mate) (-?\d+)\b/u.exec(line);
    const depth = Number(/\bdepth (\d+)\b/u.exec(line)?.[1] ?? 0);
    const rank = Number(/\bmultipv (\d+)\b/u.exec(line)?.[1] ?? 1);
    const pv = /\bpv ((?:[a-h][1-8][a-h][1-8][qrbn]?(?:\s+|$))+)/u.exec(line)?.[1]?.trim().split(/\s+/u);
    if (!score || !pv || depth < 1 || rank < 1 || rank > count) continue;
    check(legal.includes(pv[0]), "Illegal engine root move");
    const position = board(fen);
    for (const uci of pv) {
      const move = parseUci(uci);
      check(move && position.isLegal(normalizeMove(position, move)), "Illegal engine PV move");
      position.play(normalizeMove(position, move));
    }
    parsed.push({ moveUci: pv[0], rank, depth, score: { kind: score[1], value: Number(score[2]),
      bound: /\b(?:lowerbound|upperbound)\b/u.test(line) }, pv });
  }
  const table = selectCoherentTopEntries(parsed, count);
  const bestmove = /^bestmove (\S+)/u.exec(lines.at(-1) ?? "")?.[1];
  check(legal.includes(bestmove), "Missing or illegal engine bestmove");
  return { legal, ...table, missingMoves: legal.filter((uci) => !table.entries.some((entry) => entry.moveUci === uci)),
    terminal: false, bestmove };
}

export class CoherentEngineQuery {
  queue = [];
  waiters = [];
  failure;
  closed = false;
  stderr = "";
  constructor(command, args = []) {
    this.process = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    this.reader = createInterface({ input: this.process.stdout });
    this.reader.on("line", (line) => {
      const waiter = this.waiters.shift();
      if (waiter) waiter(line); else this.queue.push(line);
    });
    this.process.stderr.on("data", (bytes) => { this.stderr = `${this.stderr}${bytes}`.slice(-4000); });
    this.process.stdin.on("error", (error) => this.fail(error));
    this.process.on("error", (error) => this.fail(error));
    this.process.on("exit", (code, signal) => {
      if (!this.closed) this.fail(new Error(`Engine exited early code=${code} signal=${signal}: ${this.stderr}`));
    });
  }
  fail(error) { this.failure ??= error; for (const waiter of this.waiters.splice(0)) waiter(undefined); }
  send(line) { check(!this.closed && !this.failure, "Engine transport is closed or failed"); this.process.stdin.write(`${line}\n`); }
  next() {
    if (this.failure) return Promise.reject(this.failure);
    if (this.queue.length) return Promise.resolve(this.queue.shift());
    return new Promise((resolve, reject) => {
      const receive = (line) => {
        clearTimeout(timer);
        if (line === undefined) reject(this.failure ?? new Error("Engine ended without a response")); else resolve(line);
      };
      const timer = setTimeout(() => {
        this.waiters = this.waiters.filter((entry) => entry !== receive);
        reject(new Error("Engine response timed out"));
      }, 60_000);
      this.waiters.push(receive);
    });
  }
  async until(predicate) {
    const lines = [];
    while (true) { const line = await this.next(); lines.push(line); if (predicate(line)) return lines; }
  }
  async initialize() {
    this.send("uci");
    const lines = await this.until((line) => line === "uciok");
    this.identity = lines.find((line) => line.startsWith("id name "))?.slice(8);
    check(this.identity, "Engine omitted its identity");
    for (const option of ["Threads value 1", "Hash value 16", "UCI_Chess960 value false"]) this.send(`setoption name ${option}`);
    this.send("isready"); await this.until((line) => line === "readyok");
  }
  async probe(fen, budget) {
    check(["depth8", "depth12", "movetime100"].includes(budget), "Undeclared query budget");
    const pos = board(fen), legal = legalMoves(pos).map((entry) => entry.uci);
    check(legal.length > 0 && !pos.isInsufficientMaterial() && pos.halfmoves < 150, "Frozen query is terminal");
    this.send("ucinewgame"); this.send("setoption name Clear Hash");
    this.send(`setoption name MultiPV value ${Math.min(8, legal.length)}`);
    this.send("isready"); await this.until((line) => line === "readyok");
    this.send(`position fen ${fen}`);
    const started = performance.now();
    this.send(`${budget === "movetime100" ? "go movetime 100" : `go depth ${budget.slice(5)}`} searchmoves ${legal.join(" ")}`);
    const lines = await this.until((line) => line.startsWith("bestmove "));
    return { budget, ...parseCoherentQuery(fen, lines), elapsedMs: Number((performance.now() - started).toFixed(2)) };
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    this.fail(new Error("Engine closed"));
    if (this.process.pid === undefined || this.process.exitCode !== null || this.process.signalCode !== null) {
      this.reader.close(); return;
    }
    await new Promise((resolve) => {
      const timer = setTimeout(() => { this.process.kill("SIGKILL"); }, 2000);
      this.process.once("exit", () => { clearTimeout(timer); resolve(); });
      if (!this.process.stdin.destroyed) this.process.stdin.end("quit\n"); else this.process.kill("SIGKILL");
    });
    this.reader.close();
  }
}
