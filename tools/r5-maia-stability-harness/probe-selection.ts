// DISPOSABLE research harness — R5 (planning/campaign-research-queue.md).
// Not production code. End-to-end repeat probe of the SHIPPED practical_resistance
// selector (apps/server/src/opponent-selector.ts #practicalResistance), to see
// whether the measured Maia variation reaches the selected move.
//
// One EngineSupervisor and one LichessTablebaseSource are shared across repeats so
// the tablebase LRU (positives never expire) makes the tablebase input constant;
// a FRESH OpponentSelector per repeat defeats the in-process selection cache, so
// each repeat is a genuine recomputation whose only varying input is Maia.
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

import { EngineSupervisor } from "../../apps/server/src/engine-supervisor.js";
import { DEFAULT_MAIA_IMAGE, maiaDockerSpec } from "../../apps/server/src/maia.js";
import { OpponentSelector } from "../../apps/server/src/opponent-selector.js";
import { LichessTablebaseSource } from "../../apps/server/src/tablebase.js";

interface Position {
  readonly packId: string;
  readonly phase: string;
  readonly fen: string;
  readonly pieceCount: number;
  readonly legalUci: readonly string[];
  readonly startFen: string;
  readonly historyUci: readonly string[];
}

async function main(): Promise<void> {
  const probeSetPath = process.argv[2]!;
  const outPath = process.argv[3]!;
  const band = Number(process.argv[4] ?? "1500");
  const repeats = Number(process.argv[5] ?? "20");
  const maxRoots = Number(process.argv[6] ?? "12");

  const all = (
    JSON.parse(readFileSync(probeSetPath, "utf8")) as { positions: Position[] }
  ).positions;
  const inRange = all.filter((entry) => entry.pieceCount <= 7 && entry.legalUci.length > 1);
  const stride = inRange.length / Math.min(maxRoots, inRange.length);
  const roots = Array.from(
    { length: Math.min(maxRoots, inRange.length) },
    (_, index) => inRange[Math.floor(index * stride)]!,
  );

  writeFileSync(outPath, "");

  const supervisor = new EngineSupervisor([
    maiaDockerSpec({ image: process.env.MAIA_IMAGE ?? DEFAULT_MAIA_IMAGE, transcriptCapacity: 8_192 }),
  ]);
  await supervisor.start("maia-5m");
  const tablebase = new LichessTablebaseSource({ timeoutMs: 10_000 });

  for (const root of roots) {
    for (let repeat = 0; repeat < repeats; repeat += 1) {
      // Fresh selector per repeat: the shipped #cache would otherwise answer.
      const selector = new OpponentSelector(supervisor, { tablebaseSource: tablebase });
      const startedAt = performance.now();
      try {
        const selection = await selector.select({
          startFen: root.startFen,
          historyUci: [...root.historyUci],
          policy: {
            mode: "practical_resistance",
            policyConfigDigest: `sha256:${"5".repeat(64)}`,
            targetElo: band,
          },
          seed: 5,
        });
        appendFileSync(
          outPath,
          `${JSON.stringify({
            kind: "selection",
            fen: root.fen,
            packId: root.packId,
            phase: root.phase,
            pieceCount: root.pieceCount,
            band,
            repeat,
            latencyMs: Number((performance.now() - startedAt).toFixed(1)),
            moveUci: selection.moveUci,
            candidates: selection.candidates,
            eloApplied: selection.engine.eloApplied,
            seedHonored: selection.engine.seedHonored,
          })}\n`,
        );
      } catch (error) {
        const code = (error as { code?: string }).code;
        appendFileSync(
          outPath,
          `${JSON.stringify({
            kind: "selection",
            fen: root.fen,
            packId: root.packId,
            pieceCount: root.pieceCount,
            band,
            repeat,
            latencyMs: Number((performance.now() - startedAt).toFixed(1)),
            refusal: code ?? (error instanceof Error ? error.message : String(error)),
            message: error instanceof Error ? error.message : String(error),
          })}\n`,
        );
      }
    }
    process.stderr.write(`root done ${root.fen}\n`);
  }
  await supervisor.shutdown();
}

void main();
