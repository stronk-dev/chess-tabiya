// DISPOSABLE research harness — R10 (Maia's usable `Elo` range).
// Not production code. Sweeps the requested band across [0, 5000] and beyond,
// recording the raw policy distribution at every grid point.
//
// It drives the repo's own EngineSupervisor + maiaDockerSpec and reproduces the
// exact command shape of OpponentSelector #maia (opponent-selector.ts:469-499):
// setoption Elo / Temperature / TopP / MultiPV, then a history-conditioned
// `position fen <start> moves <history>` and a bare `go`.
//
// D58 (R5): an Elo-less request inherits the previous request's band, so this
// harness sends `setoption name Elo` on EVERY probe without exception.
import { createHash } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

interface Position {
  readonly packId: string;
  readonly phase: string;
  readonly cell: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

interface Candidate {
  readonly uci: string;
  readonly rank: number;
  readonly policyRaw: string | null;
}

// Production defaults (opponent-selector.ts:72-73). They steer the sampled
// `bestmove` only; R5 established the emitted `policy` scalar is the raw softmax.
const DEFAULT_TEMPERATURE = Number(process.env.MAIA_TEMPERATURE ?? "0.8");
const DEFAULT_TOP_P = Number(process.env.MAIA_TOPP ?? "0.92");

// Named grids so a run is reproducible from the command line alone.
function grid(name: string): number[] {
  const uniform: number[] = [];
  for (let elo = 0; elo <= 5000; elo += 100) uniform.push(elo);
  switch (name) {
    case "sweep":
      return [
        // Outside the advertised spin range, below.
        -1_000_000, -5000, -1000, -100, -1,
        // Extra density immediately above the low endpoint.
        25, 50, 75,
        ...uniform,
        // Extra density immediately below the high endpoint.
        4925, 4950, 4975,
        // Outside the advertised spin range, above.
        5001, 5100, 5500, 9000, 50_000, 1_000_000,
      ].sort((left, right) => left - right);
    case "uniform":
      return uniform;
    case "fine-low":
      // 10-Elo resolution over the first 400 points.
      return Array.from({ length: 41 }, (_value, index) => index * 10);
    case "fine-high":
      // 10-Elo resolution over the last 400 points.
      return Array.from({ length: 41 }, (_value, index) => 4600 + index * 10);
    default:
      throw new Error(`unknown grid ${name}`);
  }
}

function parse(lines: readonly string[]): {
  readonly candidates: Candidate[];
  readonly infoLines: string[];
  readonly bestmove: string | null;
} {
  const byMove = new Map<string, Candidate>();
  const infoLines: string[] = [];
  let bestmove: string | null = null;
  for (const line of lines) {
    if (line.startsWith("bestmove ")) {
      bestmove = /^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line)?.[1] ?? null;
      continue;
    }
    if (!line.startsWith("info ")) continue;
    const rank = /\bmultipv (\d+)\b/.exec(line);
    const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line);
    if (rank === null || move === null) continue;
    infoLines.push(line);
    const policy = /\bpolicy ([0-9]+(?:\.[0-9]+)?(?:e[+-]?\d+)?)\b/i.exec(line);
    // Last writer wins, exactly as candidateLines() in opponent-selector.ts does.
    byMove.set(move[1]!, {
      uci: move[1]!,
      rank: Number(rank[1]),
      policyRaw: policy === null ? null : policy[1]!,
    });
  }
  return { candidates: [...byMove.values()], infoLines, bestmove };
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

async function main(): Promise<void> {
  const probeSetPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  const gridName = process.argv[4] ?? "sweep";
  const direction = (process.argv[5] ?? "asc") as "asc" | "desc";
  const positionLimit = Number(process.argv[6] ?? "0"); // 0 = all
  const arm = process.argv[7] ?? `${gridName}-${direction}`;

  const all = (JSON.parse(readFileSync(probeSetPath, "utf8")) as { positions: Position[] })
    .positions;
  const positions = positionLimit > 0 ? all.slice(0, positionLimit) : all;
  const bands = direction === "asc" ? grid(gridName) : [...grid(gridName)].reverse();

  writeFileSync(outPath, "");

  const supervisor = new EngineSupervisor([
    maiaDockerSpec({
      image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE,
      transcriptCapacity: 8_192,
    }),
  ]);
  const identity = await supervisor.start("maia-5m");
  appendFileSync(
    outPath,
    `${JSON.stringify({ kind: "identity", arm, gridName, direction, bands, identity })}\n`,
  );

  const jobs: { position: Position; band: number }[] = [];
  for (const position of positions) for (const band of bands) jobs.push({ position, band });

  let done = 0;
  for (const job of jobs) {
    const { position, band } = job;
    // MultiPV 20 everywhere: R4 measured the engine's own hard cap at 20 and R5
    // measured MultiPV 8 vs 20 as bit-identical over the shared moves, so 20
    // maximises the shared support the TV distance is computed over.
    const multiPv = 20;
    const startedAt = performance.now();
    try {
      const lines = await supervisor.execute("maia-5m", {
        commands: [
          `setoption name Elo value ${band}`,
          `setoption name Temperature value ${DEFAULT_TEMPERATURE}`,
          `setoption name TopP value ${DEFAULT_TOP_P}`,
          `setoption name MultiPV value ${multiPv}`,
          `position fen ${position.startFen}${
            position.historyUci.length === 0 ? "" : ` moves ${position.historyUci.join(" ")}`
          }`,
          "go",
        ],
        until: (line) => line.startsWith("bestmove "),
        timeoutMs: 120_000,
      });
      const parsed = parse(lines);
      appendFileSync(
        outPath,
        `${JSON.stringify({
          kind: "probe",
          arm,
          fen: position.fen,
          cell: position.cell,
          packId: position.packId,
          phase: position.phase,
          pieceCount: position.pieceCount,
          legalCount: position.legalUci.length,
          historyPlies: position.historyUci.length,
          band,
          multiPv,
          latencyMs: Number((performance.now() - startedAt).toFixed(1)),
          bestmove: parsed.bestmove,
          candidates: parsed.candidates,
          infoDigest: digest(parsed.infoLines.join("\n")),
        })}\n`,
      );
    } catch (error) {
      appendFileSync(
        outPath,
        `${JSON.stringify({
          kind: "probe",
          arm,
          fen: position.fen,
          band,
          error: error instanceof Error ? error.message : String(error),
        })}\n`,
      );
      process.stderr.write(`ERROR ${String(error)}\n`);
    }
    done += 1;
    if (done % 250 === 0) process.stderr.write(`${done}/${jobs.length}\n`);
  }
  await supervisor.shutdown();
}

void main();
