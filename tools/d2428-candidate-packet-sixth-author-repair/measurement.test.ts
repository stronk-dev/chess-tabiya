// DISPOSABLE D2428 author measurement. It measures the production adapter's honest current
// two-authority path; it does not implement the candidate packet or change product behavior.
import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";

import { declareExactLegalMovesEvidence } from "../../packages/runtime/src/evidence-source-adapters.js";
import { exactLegalMoveMap } from "../../packages/runtime/src/legal-moves.js";

const FENS = Object.freeze([
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1",
  "4k3/P7/8/8/8/8/8/4K3 w - - 0 1",
  "r1bqk2r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 4 5",
  "8/2p5/3p4/1P1Pp3/4P3/8/8/4K2k w - - 0 1",
  "7k/5Q2/7K/8/8/8/8/8 b - - 0 1",
]);

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function measure(operation: (fen: string) => unknown): number {
  const samples: number[] = [];
  for (let round = 0; round < 120; round += 1) {
    const start = performance.now();
    for (const fen of FENS) operation(fen);
    samples.push((performance.now() - start) / FENS.length);
  }
  return median(samples.slice(20));
}

describe("D2428 production authority cost", () => {
  it("measures the one-computation floor against the current two-computation adapter path", () => {
    const identityProbe = exactLegalMoveMap(FENS[0]);
    expect(declareExactLegalMovesEvidence(identityProbe).payload).toBe(identityProbe);
    const oneAuthorityMs = measure((fen) => exactLegalMoveMap(fen));
    const currentCompileMs = measure((fen) => {
      const payload = exactLegalMoveMap(fen);
      return declareExactLegalMovesEvidence(payload);
    });
    expect(oneAuthorityMs).toBeGreaterThan(0);
    expect(currentCompileMs).toBeGreaterThan(oneAuthorityMs);
    console.log(JSON.stringify({
      positions: FENS.length,
      warmupRounds: 20,
      measuredRounds: 100,
      medianMillisecondsPerPosition: {
        oneAuthority: Number(oneAuthorityMs.toFixed(6)),
        currentCompilerPlusValidatingAdapter: Number(currentCompileMs.toFixed(6)),
      },
      ratio: Number((currentCompileMs / oneAuthorityMs).toFixed(3)),
    }));
  });
});
