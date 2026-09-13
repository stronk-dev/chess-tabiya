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
  it("loads below 250 ms and keeps full-catalogue synchronous lookup work below 50 µs CPU p95", async () => {
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
          const started = process.cpuUsage();
          for (const [batchIndex, fen] of batch.entries()) {
            const observedPly = offset + batchIndex;
            loaded.catalogue.openingIdentity(fen, observedPly);
          }
          const elapsed = process.cpuUsage(started);
          // Sub-millisecond wall timings on a shared runner include time when this
          // process was not executing at all. CPU time retains GC and the complete
          // production lookup while excluding runner descheduling. End-to-end wall
          // latency remains covered by the browser arrival/perceived-latency gates.
          values.push((elapsed.user + elapsed.system) / batch.length);
        }
      }
      return percentile(values, 0.95);
    };
    const fullCpuP95Us = measure(positions);
    console.info(`OPENING_CATALOGUE_PERFORMANCE ${JSON.stringify({ loadMs, fullCpuP95Us, positions: positions.length, repetitions: 8 })}`);
    // This runs 55,928 combined production lookups against the complete production maps. The former
    // "size scaling" ratio compared two query-set lengths against these same maps, so
    // it measured query mix and timer noise rather than catalogue population size.
    // The full-population absolute budget is the product contract and remains unchanged.
    expect(fullCpuP95Us).toBeLessThan(50);
  });
});
