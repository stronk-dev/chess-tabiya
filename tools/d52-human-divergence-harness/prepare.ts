// DISPOSABLE research harness — D52. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { Chess } from "chessops/chess";
import { makeFen } from "chessops/fen";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";

interface CorpusPosition {
  readonly packId: string;
  readonly phase: string;
  readonly fen: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

interface ExplorerMove {
  readonly san: string;
  readonly n: number;
}

interface ExplorerRow {
  readonly ply: number;
  readonly band: number;
  readonly fen: string;
  readonly total: number;
  readonly line: readonly string[];
  readonly moves: readonly ExplorerMove[];
}

export interface MeasurementJob {
  readonly id: string;
  readonly source: "corpus" | "explorer";
  readonly fen: string;
  readonly startFen: string;
  readonly historyUci: readonly string[];
  readonly band: number;
  readonly phase?: string;
  readonly packId?: string;
  readonly explorer?: {
    readonly total: number;
    readonly moves: readonly { readonly moveUci: string; readonly count: number }[];
  };
}

const EXPLORER_FILES = [
  "tools/r9-explorer-depth-harness/out/walk-1400.jsonl",
  "tools/r9-explorer-depth-harness/out/walk-1600.jsonl",
  "tools/r9-explorer-depth-harness/out/walk-1800.jsonl",
] as const;

function replay(line: readonly string[]): { readonly position: Chess; readonly historyUci: readonly string[] } {
  const position = Chess.default();
  const historyUci: string[] = [];
  for (const [index, san] of line.entries()) {
    const move = parseSan(position, san);
    if (move === undefined) throw new Error(`illegal explorer SAN ${san} at ply ${index}`);
    historyUci.push(makeUci(move));
    position.play(move);
  }
  return { position, historyUci: Object.freeze(historyUci) };
}

function explorerJobs(): MeasurementJob[] {
  const startFen = makeFen(Chess.default().toSetup());
  const jobs: MeasurementJob[] = [];
  for (const file of EXPLORER_FILES) {
    const rows = readFileSync(file, "utf8").trim().split("\n").filter(Boolean)
      .map((line) => JSON.parse(line) as ExplorerRow);
    for (const row of rows) {
      // R9 records its terminal frontier row as total=0/moves=[] so coverage
      // depth remains explicit. It is not a selectable decision and therefore
      // cannot belong to the opponent.move_selected population.
      if (row.total <= 0 || row.moves.length === 0) continue;
      const replayed = replay(row.line);
      const fen = makeFen(replayed.position.toSetup());
      if (fen !== row.fen) throw new Error(`${file}:${row.ply} history reaches ${fen}, expected ${row.fen}`);
      const moves = row.moves.map((entry) => {
        const move = parseSan(replayed.position, entry.san);
        if (move === undefined) throw new Error(`${file}:${row.ply} illegal candidate SAN ${entry.san}`);
        return Object.freeze({ moveUci: makeUci(move), count: entry.n });
      });
      jobs.push(Object.freeze({
        id: `explorer:${row.band}:${row.ply}`,
        source: "explorer",
        fen: row.fen,
        startFen,
        historyUci: replayed.historyUci,
        band: row.band,
        explorer: Object.freeze({ total: row.total, moves: Object.freeze(moves) }),
      }));
    }
  }
  return jobs;
}

function corpusJobs(path: string): MeasurementJob[] {
  const positions = (JSON.parse(readFileSync(path, "utf8")) as { positions: CorpusPosition[] }).positions;
  return positions.flatMap((position, positionIndex) => [1100, 1500, 1900].map((band) => Object.freeze({
    id: `corpus:${positionIndex}:${band}`,
    source: "corpus" as const,
    fen: position.fen,
    startFen: position.startFen,
    historyUci: Object.freeze([...position.historyUci]),
    band,
    phase: position.phase,
    packId: position.packId,
  })));
}

const corpusPath = process.argv[2]!;
const outPath = process.argv[3]!;
const jobs = [...explorerJobs(), ...corpusJobs(corpusPath)];
writeFileSync(outPath, JSON.stringify({ jobs }, null, 1));
process.stdout.write(`explorer=${jobs.filter((job) => job.source === "explorer").length} corpus=${jobs.filter((job) => job.source === "corpus").length} total=${jobs.length}\n`);
