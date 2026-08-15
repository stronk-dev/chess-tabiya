// DISPOSABLE research harness — R4 (planning/campaign-research-queue.md).
// Fixed-depth Stockfish MultiPV concession probe, per rfc/resistance-spectrum.md §7b:
// fixed depth (not movetime), Threads 1, ucinewgame + Clear Hash before every probe.
// Drives the repo's own EngineSupervisor; no second UCI integration.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";

import { EngineSupervisor, type EngineSpec } from "../../apps/server/src/engine-supervisor.js";

interface Position {
  readonly packId: string;
  readonly phase: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
}

export interface MultiPvEntry {
  readonly uci: string;
  readonly cp: number | null;
  readonly mate: number | null;
  readonly depth: number;
}

export interface SfProbe {
  readonly fen: string;
  readonly depth: number;
  readonly multiPv: number;
  readonly resetMs: number;
  readonly goMs: number;
  readonly totalMs: number;
  readonly reachedDepth: number;
  readonly entries: readonly MultiPvEntry[];
  readonly error?: string;
}

const SPEC: EngineSpec = Object.freeze({
  id: "stockfish-r4",
  kind: "judge",
  command: process.env.STOCKFISH_PATH ?? "stockfish",
  name: "Stockfish",
  options: Object.freeze({ Threads: 1, Hash: 16 }),
  transcriptCapacity: 4_096,
});

function parseMultiPv(lines: readonly string[]): {
  readonly entries: readonly MultiPvEntry[];
  readonly reachedDepth: number;
} {
  const byIndex = new Map<number, MultiPvEntry>();
  let reachedDepth = 0;
  for (const line of lines) {
    if (!line.startsWith("info ")) continue;
    if (line.includes("lowerbound") || line.includes("upperbound")) continue;
    const depthMatch = /\bdepth (\d+)\b/.exec(line);
    const pvMatch = /\bmultipv (\d+)\b/.exec(line);
    const scoreMatch = /\bscore (cp|mate) (-?\d+)\b/.exec(line);
    const moveMatch = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(line);
    if (depthMatch === null || pvMatch === null || scoreMatch === null || moveMatch === null) {
      continue;
    }
    const depth = Number(depthMatch[1]);
    reachedDepth = Math.max(reachedDepth, depth);
    byIndex.set(Number(pvMatch[1]), {
      uci: moveMatch[1]!,
      cp: scoreMatch[1] === "cp" ? Number(scoreMatch[2]) : null,
      mate: scoreMatch[1] === "mate" ? Number(scoreMatch[2]) : null,
      depth,
    });
  }
  return {
    entries: [...byIndex.entries()].sort((a, b) => a[0] - b[0]).map(([, value]) => value),
    reachedDepth,
  };
}

async function probe(
  supervisor: EngineSupervisor,
  fen: string,
  depth: number,
  multiPv: number,
  timeoutMs: number,
): Promise<SfProbe> {
  const resetStart = performance.now();
  await supervisor.execute(SPEC.id, {
    commands: [
      // NO_RESET=1 reproduces the shipped `strong_engine` path, which sends neither
      // `ucinewgame` nor `Clear Hash` (defect D35) — the control for §7b's requirement.
      ...(process.env.NO_RESET === "1" ? [] : ["ucinewgame", "setoption name Clear Hash"]),
      `setoption name MultiPV value ${multiPv}`,
      "isready",
    ],
    until: (line) => line === "readyok",
    timeoutMs: 30_000,
  });
  const resetMs = performance.now() - resetStart;
  const goStart = performance.now();
  try {
    const lines = await supervisor.execute(SPEC.id, {
      commands: [`position fen ${fen}`, `go depth ${depth}`],
      until: (line) => line.startsWith("bestmove "),
      timeoutMs,
    });
    const goMs = performance.now() - goStart;
    const parsed = parseMultiPv(lines);
    return {
      fen,
      depth,
      multiPv,
      resetMs,
      goMs,
      totalMs: resetMs + goMs,
      reachedDepth: parsed.reachedDepth,
      entries: parsed.entries,
    };
  } catch (error) {
    const goMs = performance.now() - goStart;
    return {
      fen,
      depth,
      multiPv,
      resetMs,
      goMs,
      totalMs: resetMs + goMs,
      reachedDepth: 0,
      entries: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main(): Promise<void> {
  const positionsPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  const depths = (process.argv[4] ?? "16").split(",").map(Number);
  const filter = process.argv[5] ?? "all"; // "in" | "out" | "all"
  const limit = Number(process.argv[6] ?? "0");
  const timeoutMs = Number(process.argv[7] ?? "180000");

  const all = (JSON.parse(readFileSync(positionsPath, "utf8")) as { positions: Position[] })
    .positions;
  let selected = all.filter((entry) =>
    filter === "in" ? entry.pieceCount <= 7 : filter === "out" ? entry.pieceCount > 7 : true,
  );
  if (limit > 0 && selected.length > limit) {
    // Deterministic stride sample across the ordered corpus.
    const stride = selected.length / limit;
    selected = Array.from({ length: limit }, (_, index) => selected[Math.floor(index * stride)]!);
  }

  const done = new Set<string>();
  if (existsSync(outPath)) {
    for (const line of readFileSync(outPath, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      const parsed = JSON.parse(line) as SfProbe;
      done.add(`${parsed.fen}|${parsed.depth}`);
    }
  } else {
    writeFileSync(outPath, "");
  }

  const supervisor = new EngineSupervisor([SPEC]);
  const identity = await supervisor.start(SPEC.id);
  process.stderr.write(`engine ${identity.name} ${identity.version}\n`);
  process.stderr.write(
    `probing ${String(selected.length)} positions × ${String(depths.length)} depths\n`,
  );

  let index = 0;
  for (const position of selected) {
    index += 1;
    for (const depth of depths) {
      if (done.has(`${position.fen}|${depth}`)) continue;
      const result = await probe(
        supervisor,
        position.fen,
        depth,
        Math.max(1, position.legalUci.length),
        timeoutMs,
      );
      appendFileSync(
        outPath,
        `${JSON.stringify({ ...result, packId: position.packId, phase: position.phase, pieceCount: position.pieceCount, legalCount: position.legalUci.length })}\n`,
      );
      process.stderr.write(
        `[${String(index)}/${String(selected.length)}] d${String(depth)} mpv${String(position.legalUci.length)} ` +
          `go=${result.goMs.toFixed(0)}ms reset=${result.resetMs.toFixed(0)}ms pv=${String(result.entries.length)}` +
          `${result.error === undefined ? "" : ` ERROR ${result.error}`}\n`,
      );
    }
  }
  await supervisor.shutdown();
}

void main();
