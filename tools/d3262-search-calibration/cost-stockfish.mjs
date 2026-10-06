// Disposable D3262 live measurement source. Never imported by production.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { Chess, normalizeMove } from "../../packages/runtime/node_modules/chessops/dist/esm/chess.js";
import { makeFen, parseFen } from "../../packages/runtime/node_modules/chessops/dist/esm/fen.js";
import { makeUci, parseUci } from "../../packages/runtime/node_modules/chessops/dist/esm/util.js";
import { legalMoves } from "./exact-reply-enumeration.mjs";
import { selectCoherentTopEntries } from "./stockfish-coherent-table.mjs";
import { queryIdentity, sha } from "./cost-contract.mjs";

export const position = fen => Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
export function replay(fen, history) {
  const pos = position(fen);
  for (const uci of history) {
    if (terminal(pos) !== null) throw new Error("Continuation after absorbing terminal");
    const entry = legalMoves(pos).find(x => x.uci === uci);
    if (!entry) throw new Error(`Illegal/noncanonical history: ${uci}`);
    pos.play(entry.move);
  }
  return pos;
}
export const fenOf = pos => makeFen(pos.toSetup());
export function terminal(pos) {
  if (legalMoves(pos).length === 0) return pos.isCheck() ? "CHECKMATE" : "STALEMATE";
  if (pos.isInsufficientMaterial()) return "INSUFFICIENT_MATERIAL";
  return pos.halfmoves >= 150 ? "SEVENTYFIVE_MOVES" : null;
}
function canonicalPv(fen, raw) {
  const pos = position(fen), history = [];
  for (const uci of raw) {
    if (terminal(pos) !== null) throw new Error("Provider PV continued beyond terminal");
    const parsed = parseUci(uci), move = parsed && normalizeMove(pos, parsed);
    if (!move || !pos.isLegal(move)) throw new Error("Illegal provider PV");
    const entry = legalMoves(pos).find(x => makeUci(x.move) === makeUci(move));
    if (!entry) throw new Error("Provider move absent from exact population");
    history.push(entry.uci); pos.play(move);
  }
  return history;
}

/** Reparse literal UCI, validate all scored PVs, retain one depth-complete table. */
export function parseProbe(operands, lines) {
  queryIdentity(operands);
  const legal = legalMoves(position(operands.fen)).map(x => x.uci);
  if (terminal(position(operands.fen)) !== null) throw new Error("Terminal should not query provider");
  const count = Math.min(operands.multiPv, legal.length), parsed = [];
  if (!Array.isArray(lines) || !lines.at(-1)?.startsWith("bestmove ")) throw new Error("Missing bestmove delimiter");
  const best = lines.at(-1).split(/\s+/u)[1];
  if (!best || canonicalPv(operands.fen, [best]).length !== 1) throw new Error("Invalid bestmove");
  for (const line of lines.slice(0, -1)) {
    if (line.startsWith("bestmove ")) throw new Error("Multiple bestmove delimiters");
    const score = /\bscore (cp|mate) (-?\d+)\b/u.exec(line);
    const raw = /\bpv ((?:[a-h][1-8][a-h][1-8][qrbn]?(?:\s+|$))+)/u.exec(line)?.[1]?.trim().split(/\s+/u);
    if (!line.startsWith("info ") || !score || !raw) continue;
    const depth = Number(/\bdepth (\d+)\b/u.exec(line)?.[1] ?? 0);
    const rank = Number(/\bmultipv (\d+)\b/u.exec(line)?.[1] ?? 1);
    if (depth < 1 || rank < 1 || rank > count) throw new Error("Invalid scored rank/depth");
    const pv = canonicalPv(operands.fen, raw);
    parsed.push({ moveUci: pv[0], rank, depth, score: { kind: score[1], value: Number(score[2]),
      bound: /\b(?:lowerbound|upperbound)\b/u.test(line) }, pv, rawPv: raw });
  }
  const table = selectCoherentTopEntries(parsed, count);
  if (table.entries.some(x => x.score.bound)) throw new Error("Bound-only score cannot form coherent rank table");
  if (operands.budget.startsWith("depth") && table.coherentDepth !== Number(operands.budget.slice(5)))
    throw new Error("Incomplete requested depth; do not silently downgrade budget");
  return { legal, ...table, bestmove: canonicalPv(operands.fen, [best])[0],
    scorePerspective: "side_to_move", authority: "provider_search_not_engine_causality" };
}

export class SourceFailure extends Error {
  constructor(state, message) { super(message); this.state = state; }
}

export class CostStockfish {
  constructor(command, { args = [], timeoutMs = 60_000 } = {}) {
    if (!command || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error("Executable/deadline required");
    this.sourceDigest = sha(JSON.stringify({ executableDigest: sha(readFileSync(command)), args,
      threads: 1, hashMb: 16, chess960: false, clearHashPerQuery: true }));
    this.timeoutMs = timeoutMs; this.command = command; this.queue = []; this.waiter = null;
    this.stderr = ""; this.failure = null; this.closed = false; this.busy = false;
    this.started = performance.now();
    this.child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    createInterface({ input: this.child.stdout }).on("line", line => {
      if (this.waiter) { const waiter = this.waiter; this.waiter = null; waiter.resolve(line); }
      else this.queue.push(line);
    });
    this.child.stderr.on("data", b => { this.stderr = (this.stderr + b).slice(-65536); });
    this.child.on("error", e => this.fail(new SourceFailure("unavailable", e.message)));
    this.child.stdin.on("error", e => this.fail(new SourceFailure("unavailable", e.message)));
    this.child.on("exit", (code, signal) => {
      if (!this.closed) this.fail(new SourceFailure("unavailable", `Early UCI exit: ${code}/${signal}`));
    });
  }
  fail(e) { this.failure = e; if (this.waiter) { this.waiter.reject(e); this.waiter = null; } }
  send(line) { if (this.failure) throw this.failure; this.child.stdin.write(`${line}\n`); }
  async until(predicate, deadline) {
    const lines = []; let bytes = 0;
    for (;;) {
      if (this.failure) throw this.failure;
      const remaining = deadline - performance.now();
      if (remaining <= 0) { const e = new SourceFailure("timed_out", "UCI operation deadline"); this.fail(e); this.child.kill(); throw e; }
      const line = this.queue.length ? this.queue.shift() : await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const e = new SourceFailure("timed_out", "UCI operation deadline");
          this.fail(e); this.child.kill();
        }, remaining);
        this.waiter = { resolve: x => { clearTimeout(timer); resolve(x); }, reject: e => { clearTimeout(timer); reject(e); } };
      });
      lines.push(line); bytes += Buffer.byteLength(line);
      if (bytes > 16 * 1024 * 1024) {
        const e = new SourceFailure("invalid", "UCI output exceeded retained capture bound");
        this.fail(e); this.child.kill(); throw e;
      }
      if (predicate(line)) return lines;
    }
  }
  async initialize() {
    const deadline = performance.now() + this.timeoutMs;
    this.send("uci"); const hello = await this.until(x => x === "uciok", deadline);
    this.engineName = hello.find(x => x.startsWith("id name "))?.slice(8);
    if (!this.engineName) throw new SourceFailure("invalid", "Missing engine identity");
    this.send("setoption name Threads value 1"); this.send("setoption name Hash value 16");
    this.send("setoption name UCI_Chess960 value false"); this.send("isready");
    await this.until(x => x === "readyok", deadline);
    this.startupMs = performance.now() - this.started;
    return this;
  }
  async execute(operands) {
    if (this.busy) throw new SourceFailure("invalid", "Parallel use of serialized UCI source");
    queryIdentity(operands);
    if (operands.sourceDigest !== this.sourceDigest) throw new SourceFailure("invalid", "Crossed binary/config identity");
    this.busy = true;
    const started = performance.now(), deadline = started + this.timeoutMs;
    try {
      const legal = legalMoves(position(operands.fen)).map(x => x.uci);
      this.send("ucinewgame"); this.send("setoption name Clear Hash");
      this.send(`setoption name MultiPV value ${Math.min(operands.multiPv, legal.length)}`);
      this.send("isready"); await this.until(x => x === "readyok", deadline);
      this.send(`position fen ${operands.fen}`);
      const go = operands.budget === "movetime100" ? "go movetime 100" : `go depth ${operands.budget.slice(5)}`;
      this.send(`${go} searchmoves ${legal.join(" ")}`);
      const lines = await this.until(x => x.startsWith("bestmove "), deadline);
      let result;
      try { result = parseProbe(operands, lines); }
      catch (e) { const failure = new SourceFailure("invalid", e.message); failure.capture = { operands, lines }; throw failure; }
      return { operands, engineName: this.engineName, started, ended: performance.now(), lines, result };
    } finally { this.busy = false; }
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    const exited = new Promise(resolve => this.child.once("exit", resolve));
    if (this.child.exitCode === null && this.child.signalCode === null) {
      if (!this.child.killed) this.child.stdin.end("quit\n");
      const timer = setTimeout(() => this.child.kill("SIGKILL"), 1000);
      await exited; clearTimeout(timer);
    }
  }
}

/** Dependencies only: warm cache is populated by the matching cold operation. */
export class CostDependencies {
  constructor(adapter, regime, initial = new Map()) {
    if (!["cold", "warm", "provider_offline"].includes(regime) || regime !== "warm" && initial.size)
      throw new Error("Cold/offline cache contamination");
    this.adapter = adapter; this.regime = regime; this.cache = new Map(initial);
    this.initialCacheEntries = initial.size; this.ledger = []; this.raw = []; this.seen = new Map(); this.sourceMs = 0;
  }
  async query(operands) {
    const identity = queryIdentity(operands);
    if (this.seen.has(identity)) return this.seen.get(identity);
    const started = performance.now(); let receipt, state, failure, rejectedCapture;
    if (this.regime === "provider_offline") { state = "unavailable"; failure = "Deliberately denied provider execution"; }
    else if (this.cache.has(identity)) { state = "cached"; receipt = this.cache.get(identity); }
    else {
      try { receipt = await this.adapter.execute(operands); state = "executed"; }
      catch (e) { if (!(e instanceof SourceFailure)) throw e; state = e.state; failure = e.message; rejectedCapture = e.capture; }
    }
    if (receipt) {
      try {
        if (queryIdentity(receipt.operands) !== identity
          || JSON.stringify((this.adapter.admitReceipt ?? parseProbe)(operands, receipt.lines)) !== JSON.stringify(receipt.result))
          throw new Error("Crossed dependency receipt/literal provider result");
      } catch (e) { state = "invalid"; failure = e.message; rejectedCapture = receipt; receipt = undefined; }
    }
    const elapsedMs = performance.now() - started, receiptDigest = receipt ? sha(JSON.stringify(receipt)) : null;
    this.sourceMs += elapsedMs;
    this.ledger.push({ operands, state, elapsedMs, receiptDigest });
    this.raw.push({ operands, state, receipt: receipt ?? null, failure: failure ?? null, rejectedCapture: rejectedCapture ?? null });
    if (state === "executed") this.cache.set(identity, receipt);
    const result = { state, result: receipt?.result ?? null };
    this.seen.set(identity, result); return result;
  }
}
