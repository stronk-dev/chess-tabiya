// DISPOSABLE research harness — R4 (planning/campaign-research-queue.md).
// Exact concession reference: the repo's own LichessTablebaseSource, one probe per
// position, per-move categories inverted through the shipped invertTablebaseCategory.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";

import {
  LichessTablebaseSource,
  invertTablebaseCategory,
  type TablebaseCategory,
} from "../../apps/server/src/tablebase.js";

interface Position {
  readonly packId: string;
  readonly phase: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
}

async function main(): Promise<void> {
  const positionsPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  const positions = (
    JSON.parse(readFileSync(positionsPath, "utf8")) as { positions: Position[] }
  ).positions.filter((entry) => entry.pieceCount <= 7);

  const done = new Set<string>();
  if (existsSync(outPath)) {
    for (const line of readFileSync(outPath, "utf8").split("\n")) {
      if (line.trim() === "") continue;
      const parsed = JSON.parse(line) as { fen: string; error?: string };
      if (parsed.error === undefined) done.add(parsed.fen);
    }
  } else {
    writeFileSync(outPath, "");
  }

  const source = new LichessTablebaseSource({ timeoutMs: 15_000 });
  let index = 0;
  for (const position of positions) {
    index += 1;
    if (done.has(position.fen)) continue;
    const startedAt = performance.now();
    try {
      const probed = await source.probe(position.fen);
      const moves = probed.moves.map((move) => ({
        uci: move.uci,
        san: move.san,
        rawCategory: move.category,
        moverCategory: invertTablebaseCategory(move.category) as TablebaseCategory,
        dtz: move.dtz,
      }));
      appendFileSync(
        outPath,
        `${JSON.stringify({
          fen: position.fen,
          packId: position.packId,
          pieceCount: position.pieceCount,
          legalCount: position.legalUci.length,
          category: probed.category,
          dtz: probed.dtz,
          moves,
          latencyMs: performance.now() - startedAt,
        })}\n`,
      );
      process.stderr.write(
        `[${String(index)}/${String(positions.length)}] ${probed.category} moves=${String(moves.length)} ${(performance.now() - startedAt).toFixed(0)}ms\n`,
      );
    } catch (error) {
      appendFileSync(
        outPath,
        `${JSON.stringify({
          fen: position.fen,
          packId: position.packId,
          pieceCount: position.pieceCount,
          error: error instanceof Error ? error.message : String(error),
        })}\n`,
      );
      process.stderr.write(`[${String(index)}] ERROR ${String(error)}\n`);
    }
    await new Promise((resolve) => setTimeout(resolve, Number(process.argv[4] ?? "250")));
  }
}

void main();
