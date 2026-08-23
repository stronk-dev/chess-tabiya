// DISPOSABLE research harness — D1162. Local fixed-bound engine capture only.
import { createHash } from "node:crypto";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

import { Chess, normalizeMove } from "chessops/chess";
import { parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";

import { EngineSupervisor, type EngineSpec } from "../../apps/server/src/engine-supervisor.js";
import type { TransferPosition } from "./extract.js";

interface Input { readonly positions: readonly TransferPosition[] }
interface MultiPvEntry {
  readonly uci: string;
  readonly rawUci: string;
  readonly cp: number | null;
  readonly mate: number | null;
  readonly depth: number;
}
interface ProbeRow {
  readonly inputSha256: string;
  readonly engine: { readonly name: string; readonly version: string };
  readonly id: string;
  readonly gameId: string;
  readonly fen: string;
  readonly depth: number;
  readonly legalCount: number;
  readonly elapsedMs: number;
  readonly entries: readonly MultiPvEntry[];
}

const SPEC: EngineSpec = Object.freeze({
  id: "stockfish-d1162-independent",
  kind: "judge",
  command: process.env.STOCKFISH_PATH ?? "stockfish",
  name: "Stockfish",
  options: Object.freeze({ Threads: 1, Hash: 16 }),
  transcriptCapacity: 4_096,
});

function digest(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

function parseEntries(lines: readonly string[], position: TransferPosition, targetDepth: number): readonly MultiPvEntry[] {
  const chess = Chess.fromSetup(parseFen(position.fen).unwrap()).unwrap();
  const byIndex = new Map<number, MultiPvEntry>();
  for (const line of lines) {
    if (!line.startsWith("info ") || line.includes("lowerbound") || line.includes("upperbound")) continue;
    const depthMatch = /\bdepth (\d+)\b/.exec(line);
    const indexMatch = /\bmultipv (\d+)\b/.exec(line);
    const scoreMatch = /\bscore (cp|mate) (-?\d+)\b/.exec(line);
    const moveMatch = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)/.exec(line);
    if (depthMatch === null || indexMatch === null || scoreMatch === null || moveMatch === null) continue;
    const parsed = parseUci(moveMatch[1]!);
    if (parsed === undefined) throw new Error(`invalid engine UCI ${moveMatch[1]} at ${position.id}`);
    const normalized = normalizeMove(chess, parsed);
    byIndex.set(Number(indexMatch[1]), {
      uci: makeUci(normalized),
      rawUci: moveMatch[1]!,
      cp: scoreMatch[1] === "cp" ? Number(scoreMatch[2]) : null,
      mate: scoreMatch[1] === "mate" ? Number(scoreMatch[2]) : null,
      depth: Number(depthMatch[1]),
    });
  }
  const entries = [...byIndex].sort((left, right) => left[0] - right[0]).map(([, entry]) => entry);
  if (entries.some((entry) => entry.depth < targetDepth)) throw new Error(`incomplete depth at ${position.id}`);
  const actual = entries.map((entry) => entry.uci);
  if (new Set(actual).size !== actual.length) throw new Error(`duplicate normalized engine move at ${position.id}`);
  const expected = [...position.legalUci].sort();
  const received = [...actual].sort();
  if (JSON.stringify(received) !== JSON.stringify(expected)) {
    const missing = expected.filter((move) => !received.includes(move));
    const unknown = received.filter((move) => !expected.includes(move));
    throw new Error(`legal-set mismatch at ${position.id}: missing=${missing.join(",")} unknown=${unknown.join(",")}`);
  }
  if (!actual.includes(position.playedUci)) throw new Error(`played move missing after engine normalization at ${position.id}`);
  return entries;
}

async function main(): Promise<void> {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  const depth = Number(process.argv[4] ?? "12");
  const timeoutMs = Number(process.argv[5] ?? "120000");
  if (inputPath === undefined || outputPath === undefined) throw new Error("usage: probe <positions.json> <output.jsonl> [depth] [timeoutMs]");
  const inputText = readFileSync(inputPath, "utf8");
  const input = JSON.parse(inputText) as Input;
  const inputSha256 = digest(inputText);
  const done = new Set<string>();
  if (existsSync(outputPath)) {
    for (const line of readFileSync(outputPath, "utf8").split("\n").filter(Boolean)) {
      const row = JSON.parse(line) as ProbeRow;
      if (row.inputSha256 !== inputSha256) throw new Error("existing probe belongs to a different input");
      if (row.depth === depth) done.add(row.fen);
    }
  } else writeFileSync(outputPath, "");

  const supervisor = new EngineSupervisor([SPEC]);
  const identity = await supervisor.start(SPEC.id);
  process.stderr.write(`engine ${identity.name} ${identity.version}; ${String(input.positions.length)} positions\n`);
  let index = 0;
  for (const position of input.positions) {
    index += 1;
    if (done.has(position.fen)) continue;
    const resetStart = performance.now();
    await supervisor.execute(SPEC.id, {
      commands: [
        "ucinewgame",
        "setoption name Clear Hash",
        `setoption name MultiPV value ${String(position.legalUci.length)}`,
        "isready",
      ],
      until: (line) => line === "readyok",
      timeoutMs: 30_000,
    });
    const lines = await supervisor.execute(SPEC.id, {
      commands: [`position fen ${position.fen}`, `go depth ${String(depth)}`],
      until: (line) => line.startsWith("bestmove "),
      timeoutMs,
    });
    const elapsedMs = performance.now() - resetStart;
    const entries = parseEntries(lines, position, depth);
    const row: ProbeRow = {
      inputSha256,
      engine: { name: identity.name, version: identity.version },
      id: position.id,
      gameId: position.gameId,
      fen: position.fen,
      depth,
      legalCount: position.legalUci.length,
      elapsedMs,
      entries,
    };
    appendFileSync(outputPath, `${JSON.stringify(row)}\n`);
    process.stderr.write(`[${String(index)}/${String(input.positions.length)}] ${position.id} legal=${String(entries.length)} ${elapsedMs.toFixed(0)}ms\n`);
  }
  await supervisor.shutdown();
}

void main();
