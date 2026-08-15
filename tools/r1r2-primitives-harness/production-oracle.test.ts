// DISPOSABLE landing audit — transition-primitives RFC criterion 2/4/5.
import { performance } from "node:perf_hooks";

import { describe, expect, it } from "vitest";
import type { Color } from "chessops/types";

import { transitionReading } from "../../packages/runtime/src/transition.js";
import { transitions } from "./corpus.js";
import {
  attackMap,
  attackPairs,
  defencePairs,
  defendedDuties,
  escapeSquaresRemoved,
  irreversibility,
  lineBlockers,
  lineDelta,
  pos,
  safeDests,
  setDiff,
} from "./primitives.js";

function observationCount(
  observations: NonNullable<ReturnType<typeof transitionReading>>["observations"],
  kind: string,
  color: Color,
  direction: string,
): number {
  return observations.find((value) => value.kind === kind && value.color === color && value.direction === direction)?.count ?? 0;
}

function linesForColor(position: ReturnType<typeof pos>, color: Color): Map<number, number> {
  return new Map([...lineBlockers(position)].filter(([key]) => position.board.get(Math.floor(key / 64))?.color === color));
}

function dutyCrossings(
  before: ReturnType<typeof pos>,
  after: ReturnType<typeof pos>,
  beforeMap: ReturnType<typeof attackMap>,
  afterMap: ReturnType<typeof attackMap>,
  color: Color,
): { acquired: number; released: number } {
  const left = defendedDuties(before, beforeMap);
  const right = defendedDuties(after, afterMap);
  let acquired = 0;
  let released = 0;
  for (const square of before.board[color]) {
    const beforePiece = before.board.get(square);
    const afterPiece = after.board.get(square);
    if (beforePiece?.role !== afterPiece?.role || beforePiece.color !== afterPiece?.color) continue;
    const previous = left.get(square) ?? 0;
    const current = right.get(square) ?? 0;
    if (previous < 2 && current >= 2) acquired += 1;
    if (previous >= 2 && current < 2) released += 1;
  }
  return { acquired, released };
}

describe("transition production evaluator landing audit", () => {
  it("matches the independent harness and reports landing-corpus ranges", () => {
    const corpus = transitions();
    const maxima: Record<string, number> = {};
    const fired: Record<string, number> = {};
    let pairAttacks = 0;
    let pairDefences = 0;

    for (const edge of corpus) {
      const before = pos(edge.parentFen);
      const after = pos(edge.fen);
      const beforeMap = attackMap(before);
      const afterMap = attackMap(after);
      const reading = transitionReading(edge.parentFen, edge.uci, edge.fen)!;
      const firedKinds = new Set(reading.observations.map((value) => value.kind));
      for (const kind of firedKinds) fired[kind] = (fired[kind] ?? 0) + 1;
      for (const observation of reading.observations) {
        if ("count" in observation) maxima[observation.kind] = Math.max(maxima[observation.kind] ?? 0, observation.count);
      }

      const attackChange = setDiff(attackPairs(before, beforeMap), attackPairs(after, afterMap));
      const defenceChange = setDiff(defencePairs(before, beforeMap), defencePairs(after, afterMap));
      if (attackChange.created + attackChange.removed > 0) pairAttacks += 1;
      if (defenceChange.created + defenceChange.removed > 0) pairDefences += 1;

      for (const color of ["white", "black"] as const) {
        const line = lineDelta(linesForColor(before, color), linesForColor(after, color));
        expect(observationCount(reading.observations, "slider_lines_changed", color, "opened")).toBe(line.opened);
        expect(observationCount(reading.observations, "slider_lines_changed", color, "closed")).toBe(line.closed);

        const escapes = escapeSquaresRemoved(
          safeDests(before, beforeMap, color),
          safeDests(after, afterMap, color),
        );
        expect(observationCount(reading.observations, "escape_squares_changed", color, "gained")).toBe(escapes.added);
        expect(observationCount(reading.observations, "escape_squares_changed", color, "lost")).toBe(escapes.removed);

        const duty = dutyCrossings(before, after, beforeMap, afterMap, color);
        expect(observationCount(reading.observations, "defended_duties_changed", color, "acquired")).toBe(
          duty.acquired,
        );
        expect(observationCount(reading.observations, "defended_duties_changed", color, "released")).toBe(
          duty.released,
        );
      }

      const expectedIrreversibility = irreversibility(before, after, edge.uci)?.subkind;
      const actualIrreversibility = reading.observations.find(
        (value) => value.kind === "move_irreversibility" && value.subkind !== "clock_zeroed",
      )?.subkind;
      expect(actualIrreversibility).toBe(expectedIrreversibility);
    }

    expect((fired.attacked_squares_changed ?? 0) / corpus.length).toBeLessThanOrEqual(pairAttacks / corpus.length);
    expect((fired.defended_squares_changed ?? 0) / corpus.length).toBeLessThanOrEqual(pairDefences / corpus.length);

    const passes: number[] = [];
    for (let pass = 0; pass < 25; pass += 1) {
      const started = performance.now();
      for (const edge of corpus) transitionReading(edge.parentFen, edge.uci, edge.fen);
      passes.push(performance.now() - started);
    }
    passes.sort((left, right) => left - right);
    const result = {
      transitions: corpus.length,
      rates: Object.fromEntries(Object.entries(fired).map(([kind, count]) => [kind, `${((count / corpus.length) * 100).toFixed(1)}%`])),
      maxima,
      medianBundleMicrosecondsPerPly: Number(((passes[12]! * 1000) / corpus.length).toFixed(2)),
    };
    console.log(`TRANSITION_LANDING_AUDIT ${JSON.stringify(result)}`);
  });
});
