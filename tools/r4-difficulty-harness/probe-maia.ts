// DISPOSABLE research harness — R4 (planning/campaign-research-queue.md).
// Availability probe for Maia-3 policy mass (brushes R5; observation only).
// Uses the repo's maiaDockerSpec + EngineSupervisor, and the production command
// shape from opponent-selector.ts #maia (history-conditioned position + go).
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";

interface Position {
  readonly packId: string;
  readonly phase: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

function candidates(lines: readonly string[]): {
  readonly moves: { uci: string; rank: number; policy: number | null }[];
} {
  const byMove = new Map<string, { uci: string; rank: number; policy: number | null }>();
  for (const line of lines) {
    if (!line.startsWith("info ")) continue;
    const rank = /\bmultipv (\d+)\b/.exec(line);
    const move = /\bpv ([a-h][1-8][a-h][1-8][qrbn]?)\b/.exec(line);
    if (rank === null || move === null) continue;
    const policy = /\bpolicy ([0-9]+(?:\.[0-9]+)?(?:e[+-]?\d+)?)\b/i.exec(line);
    byMove.set(move[1]!, {
      uci: move[1]!,
      rank: Number(rank[1]),
      policy: policy === null ? null : Number(policy[1]),
    });
  }
  return { moves: [...byMove.values()].sort((a, b) => a.rank - b.rank) };
}

async function main(): Promise<void> {
  const positionsPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  const bands = (process.argv[4] ?? "1100,1500,1900").split(",").map(Number);
  const perGroup = Number(process.argv[5] ?? "10");
  const repeats = Number(process.argv[6] ?? "1");

  const all = (JSON.parse(readFileSync(positionsPath, "utf8")) as { positions: Position[] })
    .positions;
  const pick = (subset: Position[]): Position[] => {
    const stride = subset.length / perGroup;
    return Array.from(
      { length: Math.min(perGroup, subset.length) },
      (_, index) => subset[Math.floor(index * stride)]!,
    );
  };
  const selected = [
    ...pick(all.filter((entry) => entry.pieceCount <= 7)),
    ...pick(all.filter((entry) => entry.pieceCount > 7)),
  ];

  if (!existsSync(outPath)) writeFileSync(outPath, "");

  const supervisor = new EngineSupervisor([
    maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE, transcriptCapacity: 8_192 }),
  ]);
  const identity = await supervisor.start("maia-5m");
  process.stderr.write(`${JSON.stringify(identity)}\n`);
  const optionLines = supervisor
    .transcript("maia-5m")
    .filter((entry) => entry.direction === "received" && entry.line.startsWith("option name "))
    .map((entry) => entry.line);
  appendFileSync(outPath, `${JSON.stringify({ kind: "identity", identity, optionLines })}\n`);

  for (const position of selected) {
    for (const band of bands) {
      for (let repeat = 0; repeat < repeats; repeat += 1) {
        const multiPv = Math.max(8, position.legalUci.length);
        const startedAt = performance.now();
        try {
          const lines = await supervisor.execute("maia-5m", {
            commands: [
              `setoption name Elo value ${band}`,
              "setoption name Temperature value 0.8",
              "setoption name TopP value 0.92",
              `setoption name MultiPV value ${multiPv}`,
              `position fen ${position.startFen}${position.historyUci.length === 0 ? "" : ` moves ${position.historyUci.join(" ")}`}`,
              "go",
            ],
            until: (line) => line.startsWith("bestmove "),
            timeoutMs: 120_000,
          });
          const parsed = candidates(lines);
          appendFileSync(
            outPath,
            `${JSON.stringify({
              kind: "probe",
              fen: position.fen,
              packId: position.packId,
              phase: position.phase,
              pieceCount: position.pieceCount,
              legalCount: position.legalUci.length,
              historyPlies: position.historyUci.length,
              band,
              repeat,
              multiPv,
              latencyMs: performance.now() - startedAt,
              candidateCount: parsed.moves.length,
              withPolicy: parsed.moves.filter((move) => move.policy !== null).length,
              policySum: parsed.moves.reduce((sum, move) => sum + (move.policy ?? 0), 0),
              moves: parsed.moves,
            })}\n`,
          );
          process.stderr.write(
            `${position.fen.slice(0, 24)}… pc=${String(position.pieceCount)} elo=${String(band)} r${String(repeat)} ` +
              `cands=${String(parsed.moves.length)}/${String(position.legalUci.length)} ` +
              `policy=${String(parsed.moves.filter((m) => m.policy !== null).length)} ` +
              `${(performance.now() - startedAt).toFixed(0)}ms\n`,
          );
        } catch (error) {
          appendFileSync(
            outPath,
            `${JSON.stringify({ kind: "probe", fen: position.fen, band, repeat, error: error instanceof Error ? error.message : String(error) })}\n`,
          );
          process.stderr.write(`ERROR ${String(error)}\n`);
        }
      }
    }
  }
  await supervisor.shutdown();
}

void main();
