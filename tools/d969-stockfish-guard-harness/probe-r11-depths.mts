#!/usr/bin/env node

// Disposable D969 instrument. Re-price the exact 279-position R11 population
// with one shared candidate-set Stockfish search at each requested fixed depth.
// The existing sf-d12 rows provide only the population and legal root-move set;
// none of their scores enter the new measurements.

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";

type Score = Readonly<{ kind: "cp" | "mate"; value: number }>;
type SourceEntry = Readonly<{ uci: string }>;
type SourceRow = Readonly<{ fen: string; entries: readonly SourceEntry[] }>;

const inputDirectory = process.env.TABIYA_R11_INPUT_DIR;
if (inputDirectory === undefined || inputDirectory === "") {
  throw new TypeError("TABIYA_R11_INPUT_DIR is required");
}

const stockfish = process.env.SF_CMD ?? "/opt/homebrew/bin/stockfish";
const depths = (process.env.TABIYA_D969_DEPTHS ?? "8,10")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0);
if (depths.length === 0) throw new TypeError("TABIYA_D969_DEPTHS must name at least one positive integer depth");

function score(line: string): Score | undefined {
  const match = /\bscore (cp|mate) (-?\d+)\b/u.exec(line);
  return match === null
    ? undefined
    : Object.freeze({ kind: match[1] as Score["kind"], value: Number(match[2]) });
}

class Stockfish {
  readonly process = spawn(stockfish, [], { stdio: ["pipe", "pipe", "inherit"] });
  readonly queue: string[] = [];
  readonly waiters: Array<(line: string) => void> = [];

  constructor() {
    createInterface({ input: this.process.stdout }).on("line", (line) => {
      const waiter = this.waiters.shift();
      if (waiter === undefined) this.queue.push(line);
      else waiter(line);
    });
  }

  send(command: string): void { this.process.stdin.write(`${command}\n`); }
  async next(): Promise<string> { return this.queue.shift() ?? new Promise((resolve) => this.waiters.push(resolve)); }
  async until(predicate: (line: string) => boolean): Promise<string[]> {
    const rows: string[] = [];
    while (true) {
      const line = await this.next();
      rows.push(line);
      if (predicate(line)) return rows;
    }
  }

  async initialize(): Promise<void> {
    this.send("uci");
    await this.until((line) => line === "uciok");
    this.send("setoption name Threads value 1");
    this.send("setoption name Hash value 16");
    this.send("isready");
    await this.until((line) => line === "readyok");
  }

  async probe(fen: string, moves: readonly string[], depth: number) {
    const resetStarted = performance.now();
    this.send("ucinewgame");
    this.send("setoption name Clear Hash");
    this.send(`setoption name MultiPV value ${moves.length}`);
    this.send("isready");
    await this.until((line) => line === "readyok");
    const resetMs = performance.now() - resetStarted;

    this.send(`position fen ${fen}`);
    const goStarted = performance.now();
    this.send(`go depth ${depth} searchmoves ${moves.join(" ")}`);
    const rows = await this.until((line) => line.startsWith("bestmove "));
    const goMs = performance.now() - goStarted;

    const finalByMove = new Map<string, string>();
    let reachedDepth = 0;
    for (const line of rows) {
      if (!line.startsWith("info ") || score(line) === undefined) continue;
      const lineDepth = Number(/\bdepth (\d+)\b/u.exec(line)?.[1] ?? 0);
      reachedDepth = Math.max(reachedDepth, lineDepth);
      const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/u.exec(line)?.[1];
      if (move !== undefined && moves.includes(move)) finalByMove.set(move, line);
    }

    const entries = moves.map((uci) => {
      const line = finalByMove.get(uci);
      if (line === undefined) throw new Error(`${fen}: depth ${depth} omitted ${uci}`);
      const measured = score(line);
      if (measured === undefined) throw new Error(`${fen}: depth ${depth} omitted score for ${uci}`);
      const bound = /\b(lowerbound|upperbound)\b/u.exec(line)?.[1];
      if (bound !== undefined) throw new Error(`${fen}: depth ${depth} returned ${bound} for ${uci}`);
      const lineDepth = Number(/\bdepth (\d+)\b/u.exec(line)?.[1] ?? 0);
      return Object.freeze({
        uci,
        cp: measured.kind === "cp" ? measured.value : null,
        mate: measured.kind === "mate" ? measured.value : null,
        depth: lineDepth,
      });
    });
    return Object.freeze({
      fen,
      depth,
      multiPv: moves.length,
      resetMs,
      goMs,
      totalMs: resetMs + goMs,
      reachedDepth,
      entries,
    });
  }

  close(): void { this.send("quit"); }
}

const sourceText = await readFile(join(inputDirectory, "sf-d12.jsonl"), "utf8");
const population = sourceText.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as SourceRow);
if (population.length !== 279) throw new TypeError(`Expected 279 R11 positions, received ${population.length}`);

const engine = new Stockfish();
await engine.initialize();
try {
  for (const depth of depths) {
    const outputPath = join(inputDirectory, `sf-d${depth}.jsonl`);
    await mkdir(dirname(outputPath), { recursive: true });
    const output: string[] = [];
    for (const [index, row] of population.entries()) {
      const moves = row.entries.map((entry) => entry.uci);
      output.push(JSON.stringify(await engine.probe(row.fen, moves, depth)));
      if ((index + 1) % 25 === 0 || index + 1 === population.length) {
        process.stderr.write(`depth ${depth}: ${index + 1}/${population.length}\n`);
      }
    }
    await writeFile(outputPath, `${output.join("\n")}\n`, "utf8");
  }
} finally {
  engine.close();
}
