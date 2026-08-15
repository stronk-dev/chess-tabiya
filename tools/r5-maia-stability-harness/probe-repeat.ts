// DISPOSABLE research harness — R5 (planning/campaign-research-queue.md).
// Not production code. The 20-repeat Maia policy-stability probe required by
// rfc/archive/resistance-spectrum.md acceptance criterion 5.
//
// It drives the repo's own EngineSupervisor + maiaDockerSpec and reproduces the
// exact command shape of OpponentSelector #maia (opponent-selector.ts:469-499):
// setoption Elo / Temperature / TopP / MultiPV, then a history-conditioned
// `position fen <start> moves <history>` and a bare `go`.
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

// Production defaults (opponent-selector.ts:72-73). MAIA_TEMPERATURE / MAIA_TOPP
// override them for the diagnostic arm that asks whether the sampled `bestmove`
// becomes reproducible when the sampler is switched off.
const DEFAULT_TEMPERATURE = Number(process.env.MAIA_TEMPERATURE ?? "0.8");
const DEFAULT_TOP_P = Number(process.env.MAIA_TOPP ?? "0.92");

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
  return {
    // Insertion order = the order Maia emitted the moves, before any sort.
    candidates: [...byMove.values()],
    infoLines,
    bestmove,
  };
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

async function main(): Promise<void> {
  const probeSetPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  const bands = (process.argv[4] ?? "1100,1500,1900").split(",").map(Number);
  const repeats = Number(process.argv[5] ?? "20");
  const order = (process.argv[6] ?? "blocked") as "blocked" | "interleaved";
  const multiPvMode = process.argv[7] ?? "auto"; // "auto" = max(8, |legal|), or a fixed integer
  const arm = process.argv[8] ?? order;

  const positions = (
    JSON.parse(readFileSync(probeSetPath, "utf8")) as { positions: Position[] }
  ).positions;

  writeFileSync(outPath, "");

  const supervisor = new EngineSupervisor([
    maiaDockerSpec({
      image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE,
      transcriptCapacity: 8_192,
    }),
  ]);
  const identity = await supervisor.start("maia-5m");
  appendFileSync(outPath, `${JSON.stringify({ kind: "identity", arm, identity })}\n`);

  const jobs: { position: Position; band: number; repeat: number }[] = [];
  if (order === "blocked") {
    for (const position of positions) {
      for (const band of bands) {
        for (let repeat = 0; repeat < repeats; repeat += 1) {
          jobs.push({ position, band, repeat });
        }
      }
    }
  } else {
    // Round-robin: every repeat of a key is separated by every other key's request,
    // so any per-process state carried between requests has a chance to show.
    for (let repeat = 0; repeat < repeats; repeat += 1) {
      for (const position of positions) {
        for (const band of bands) jobs.push({ position, band, repeat });
      }
    }
  }

  let done = 0;
  for (const job of jobs) {
    const { position, band, repeat } = job;
    const multiPv =
      multiPvMode === "auto" ? Math.max(8, position.legalUci.length) : Number(multiPvMode);
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
          repeat,
          multiPv,
          latencyMs: Number((performance.now() - startedAt).toFixed(1)),
          bestmove: parsed.bestmove,
          candidates: parsed.candidates,
          infoDigest: digest(parsed.infoLines.join("\n")),
          infoLines: repeat === 0 ? parsed.infoLines : undefined,
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
          repeat,
          error: error instanceof Error ? error.message : String(error),
        })}\n`,
      );
      process.stderr.write(`ERROR ${String(error)}\n`);
    }
    done += 1;
    if (done % 50 === 0) process.stderr.write(`${done}/${jobs.length}\n`);
  }
  await supervisor.shutdown();
}

void main();
