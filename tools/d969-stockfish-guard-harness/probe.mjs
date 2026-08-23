#!/usr/bin/env node

// Disposable D969 research instrument. This probes Stockfish's bounded
// `searchmoves` score semantics; it is not production bot-policy code.

import { spawn } from "node:child_process";

const stockfish = process.env.SF_CMD ?? "/opt/homebrew/bin/stockfish";
const limitKind = process.env.LIMIT === "depth" ? "depth" : "nodes";
const limitValue = Number(process.env.LIMIT_VALUE ?? (limitKind === "depth" ? 12 : 50_000));
const go = () => `go ${limitKind} ${limitValue}`;

const CASES = Object.freeze([
  {
    id: "initial-choice",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: ["e2e4", "d2d4", "g1f3", "f2f3", "g2g4"],
  },
  {
    id: "forced-mate-choice",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    moves: ["g6g7", "g6h6", "g6e8", "f6e7"],
  },
  {
    id: "black-to-move-disadvantage",
    fen: "6k1/5ppp/8/8/8/3Q4/5PPP/6K1 b - - 0 1",
    moves: ["g7g6", "g7g5", "f7f6", "h7h6"],
  },
]);

function parseScore(line) {
  const match = /\bscore (cp|mate) (-?\d+)\b/.exec(line);
  if (match === null) return undefined;
  return Object.freeze({ kind: match[1], value: Number(match[2]) });
}

class Uci {
  #child;
  #lines = [];
  #waiters = [];

  constructor(command) {
    this.#child = spawn(command, [], { stdio: ["pipe", "pipe", "inherit"] });
    let buffered = "";
    this.#child.stdout.setEncoding("utf8");
    this.#child.stdout.on("data", (chunk) => {
      buffered += chunk;
      const parts = buffered.split("\n");
      buffered = parts.pop() ?? "";
      for (const part of parts) this.#accept(part.trim());
    });
  }

  #accept(line) {
    this.#lines.push(line);
    const index = this.#lines.length - 1;
    for (const waiter of [...this.#waiters]) {
      if (index < waiter.start || !waiter.predicate(line)) continue;
      this.#waiters.splice(this.#waiters.indexOf(waiter), 1);
      waiter.resolve(line);
    }
  }

  send(command) {
    this.#child.stdin.write(`${command}\n`);
  }

  waitFor(predicate, start = 0) {
    const existing = this.#lines.slice(start).find(predicate);
    if (existing !== undefined) return Promise.resolve(existing);
    return new Promise((resolve) => this.#waiters.push({ predicate, resolve, start }));
  }

  async ready() {
    this.send("uci");
    await this.waitFor((line) => line === "uciok");
    this.send("setoption name Threads value 1");
    this.send("setoption name Hash value 16");
    this.send("setoption name MultiPV value 1");
    this.send("isready");
    await this.waitFor((line) => line === "readyok");
  }

  async probe(fen, move) {
    const start = this.#lines.length;
    const startedAt = performance.now();
    this.send("ucinewgame");
    this.send("setoption name Clear Hash");
    this.send("isready");
    await this.waitFor((line) => line === "readyok", start);
    this.send(`position fen ${fen}`);
    this.send(move === undefined ? go() : `${go()} searchmoves ${move}`);
    await this.waitFor((line) => line.startsWith("bestmove "), start);
    const lines = this.#lines.slice(start);
    const scored = lines.filter((line) => line.startsWith("info ") && parseScore(line) !== undefined);
    const final = scored.at(-1);
    return Object.freeze({
      move: move ?? null,
      score: final === undefined ? null : parseScore(final),
      bound: final === undefined ? null : /\b(lowerbound|upperbound)\b/.exec(final)?.[1] ?? "exact",
      depth: final === undefined ? null : Number(/\bdepth (\d+)\b/.exec(final)?.[1] ?? NaN),
      nodes: final === undefined ? null : Number(/\bnodes (\d+)\b/.exec(final)?.[1] ?? NaN),
      bestmove: lines.findLast((line) => line.startsWith("bestmove "))?.split(" ")[1] ?? null,
      complete: final !== undefined,
      elapsedMs: Number((performance.now() - startedAt).toFixed(3)),
    });
  }

  async probeSet(fen, moves) {
    const start = this.#lines.length;
    const startedAt = performance.now();
    this.send("ucinewgame");
    this.send("setoption name Clear Hash");
    this.send(`setoption name MultiPV value ${moves.length}`);
    this.send("isready");
    await this.waitFor((line) => line === "readyok", start);
    this.send(`position fen ${fen}`);
    this.send(`${go()} searchmoves ${moves.join(" ")}`);
    await this.waitFor((line) => line.startsWith("bestmove "), start);
    const lines = this.#lines.slice(start);
    const byMove = new Map();
    for (const line of lines) {
      if (!line.startsWith("info ") || parseScore(line) === undefined) continue;
      const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line)?.[1];
      if (move !== undefined && moves.includes(move)) byMove.set(move, line);
    }
    const candidates = moves.map((move) => {
      const line = byMove.get(move);
      return Object.freeze({
        move,
        score: line === undefined ? null : parseScore(line),
        bound: line === undefined ? null : /\b(lowerbound|upperbound)\b/.exec(line)?.[1] ?? "exact",
        rank: line === undefined ? null : Number(/\bmultipv (\d+)\b/.exec(line)?.[1] ?? NaN),
        depth: line === undefined ? null : Number(/\bdepth (\d+)\b/.exec(line)?.[1] ?? NaN),
        complete: line !== undefined,
      });
    });
    const resetStart = this.#lines.length;
    this.send("setoption name MultiPV value 1");
    this.send("isready");
    await this.waitFor((line) => line === "readyok", resetStart);
    return Object.freeze({
      candidates: Object.freeze(candidates),
      bestmove: lines.findLast((line) => line.startsWith("bestmove "))?.split(" ")[1] ?? null,
      elapsedMs: Number((performance.now() - startedAt).toFixed(3)),
    });
  }

  close() {
    this.send("quit");
  }
}

const uci = new Uci(stockfish);
await uci.ready();
const cases = [];
for (const item of CASES) {
  const reference = await uci.probe(item.fen);
  const shared = await uci.probeSet(item.fen, item.moves);
  const candidates = [];
  for (const move of item.moves) candidates.push(await uci.probe(item.fen, move));
  cases.push(Object.freeze({ ...item, reference, shared, independentCandidates: Object.freeze(candidates) }));
}
uci.close();

process.stdout.write(`${JSON.stringify(Object.freeze({
  instrument: "Stockfish 18 searchmoves",
  command: stockfish,
  budget: Object.freeze({ kind: limitKind, value: limitValue, threads: 1, hashMb: 16, clearHash: true }),
  cases: Object.freeze(cases),
}), null, 2)}\n`);
