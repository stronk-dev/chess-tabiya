// Pinned performance tier (rfc/recorded-semantic-path §8, criterion 17): total p95 <= 500 ms at the
// fixed 20/40/80-ply arms of the imported sample. Wall time never runs in generic software CI.
import { readFileSync } from "node:fs";

import { makeFen } from "chessops/fen";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { makeUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { recordedSemanticPathExecution } from "./recorded-semantic-path.js";
import { commitMove, createRun } from "./runtime.js";
import type { DrillRun } from "./types.js";

const SAMPLE = new URL("../../../tools/r2-selection-harness/imported-sample.pgn", import.meta.url);
const at = "2026-09-24T00:00:00.000Z";

function fixedArm(plies: number): readonly DrillRun[] {
  const runs: DrillRun[] = [];
  for (const [index, game] of parsePgn(readFileSync(SAMPLE, "utf8")).entries()) {
    if (runs.length === 12) break;
    const setup = startingPosition(game.headers);
    if (setup.isErr) continue;
    const position = setup.value;
    const fen = makeFen(position.toSetup());
    const moves: string[] = [];
    for (const node of game.moves.mainline()) {
      const move = parseSan(position, node.san);
      if (move === undefined) break;
      moves.push(makeUci(move));
      position.play(move);
    }
    if (moves.length < plies) continue;
    let run = createRun({ id: `perf:${index}:${plies}`, packId: "imported-sample", packDigest: `sha256:${"0".repeat(64)}`, startFen: fen, seed: 1, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    for (const move of moves.slice(0, plies)) run = commitMove(run, move, { at }).run;
    runs.push(run);
  }
  return runs;
}

describe("recorded semantic path pinned performance", () => {
  for (const plies of [20, 40, 80] as const) {
    it(`keeps total p95 within 500 ms at ${plies} plies`, () => {
      const runs = fixedArm(plies);
      expect(runs).toHaveLength(12);
      for (const run of runs) recordedSemanticPathExecution(run, run.activeCursor.branchId);
      const totals: number[] = [];
      for (let repetition = 0; repetition < 3; repetition += 1) for (const run of runs) {
        const execution = recordedSemanticPathExecution(run, run.activeCursor.branchId);
        expect(execution.work).toMatchObject({ transitionCompiles: plies, checkProbes: plies, localFanOut: 0, receipts: plies * 13 });
        totals.push(execution.timings.totalMs);
      }
      const sorted = totals.sort((left, right) => left - right);
      const p95 = sorted[Math.ceil(sorted.length * 0.95) - 1]!;
      console.log(`recorded-semantic-path ${plies} plies: p50 ${sorted[Math.ceil(sorted.length * 0.5) - 1]!.toFixed(1)} ms · p95 ${p95.toFixed(1)} ms · max ${sorted.at(-1)!.toFixed(1)} ms`);
      expect(p95).toBeLessThanOrEqual(500);
    }, 120_000);
  }
});
