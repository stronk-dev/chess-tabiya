import { performance } from "node:perf_hooks";
import { readFile } from "node:fs/promises";

import { canonicalFen } from "@chess-tabiya/runtime";
import { parsePgn, startingPosition } from "chessops/pgn";
import { parseSan } from "chessops/san";
import { describe, expect, it } from "vitest";

import { loadOpeningCatalogue } from "./opening-catalogue.js";

const ARTIFACT = new URL("../artifacts/runtime-opening-catalogue.json", import.meta.url).pathname;
const IMPORTED = new URL("../../../tools/r2-selection-harness/imported-sample.pgn", import.meta.url).pathname;

function percentile(values: readonly number[], fraction: number): number {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.floor((ordered.length - 1) * fraction)] ?? Number.POSITIVE_INFINITY;
}

describe("runtime opening catalogue performance", () => {
  it("loads below 250 ms and performs size-independent synchronous lookups below 50 µs p95", async () => {
    const loadStarted = performance.now();
    const loaded = await loadOpeningCatalogue(ARTIFACT);
    const loadMs = performance.now() - loadStarted;
    if (loaded.kind !== "available") throw new TypeError("fixture catalogue unavailable");
    expect(loadMs).toBeLessThan(250);

    const games = parsePgn(await readFile(IMPORTED, "utf8"));
    const positions: string[] = [];
    for (const game of games) {
      const position = startingPosition(game.headers).unwrap();
      for (const node of game.moves.mainline()) {
        const move = parseSan(position, node.san);
        if (move === undefined || !position.isLegal(move)) throw new TypeError(`Illegal committed sample move ${node.san}`);
        position.play(move);
        positions.push(canonicalFen(position));
      }
    }
    expect(positions).toHaveLength(6_991);

    const measure = (population: readonly string[]): number => {
      const values: number[] = [];
      for (let repetition = 0; repetition < 8; repetition += 1) {
        for (let offset = 0; offset < population.length; offset += 100) {
          const batch = population.slice(offset, offset + 100);
          const started = performance.now();
          for (const [batchIndex, fen] of batch.entries()) {
            const observedPly = offset + batchIndex;
            loaded.catalogue.currentEndpoint(fen, observedPly);
            loaded.catalogue.catalogueMembership(fen, observedPly);
          }
          // A single-call microbenchmark measures scheduler and timer jitter as much as
          // catalogue work on shared CI runners. Each sample remains a per-position
          // latency, but amortises that noise over a bounded batch.
          values.push(((performance.now() - started) * 1_000) / batch.length);
        }
      }
      return percentile(values, 0.95);
    };
    const fullP95Us = measure(positions);
    const smallP95Us = measure(positions.slice(0, 100));
    expect(fullP95Us).toBeLessThan(50);
    // Population size must not produce the linear scaling that the latency ceiling exists to catch.
    expect(fullP95Us).toBeLessThanOrEqual(Math.max(1, smallP95Us) * 2);
  });
});
