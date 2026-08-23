// DISPOSABLE research harness — D1066. Not production code.
import { readFileSync, writeFileSync } from "node:fs";

import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  attractionObservedOperands,
  checkZwischenzugObservedOperands,
  deflectionObservedOperands,
  interferenceObservedOperands,
  lineBlockerClearanceObservedOperands,
  overloadExploitationObservedOperands,
  squareClearanceObservedOperands,
} from "../../packages/runtime/src/semantic-evidence.js";
import type { RecordedMoveAnchor } from "../../packages/runtime/src/pawn-dynamics.js";

const INPUT = new URL("../../planning/evidence-foundation-ux/d1061-bestline-distance-results.json", import.meta.url);
const OUTPUT = new URL("../../planning/evidence-foundation-ux/d1066-sequence-coverage.json", import.meta.url);

interface InputProbe { readonly arm: string; readonly pv: readonly string[] }
interface InputRow { readonly packId: string; readonly phase: string; readonly fen: string; readonly probes: readonly InputProbe[] }

function anchors(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  const result: RecordedMoveAnchor[] = [];
  let beforeFen = fen;
  for (const [index, rawUci] of moves.entries()) {
    const position = Chess.fromSetup(parseFen(beforeFen).unwrap()).unwrap();
    const parsed = parseUci(rawUci);
    if (parsed === undefined || !("from" in parsed)) throw new TypeError(`Invalid PV UCI ${rawUci}`);
    const move = normalizeMove(position, parsed);
    if (!("from" in move) || !position.isLegal(move)) throw new TypeError(`Illegal PV UCI ${rawUci}`);
    const moveUci = makeUci(move);
    position.play(move);
    const afterFen = makeFen(position.toSetup());
    result.push(Object.freeze({ beforeNodeId: `n${index}`, afterNodeId: `n${index + 1}`, beforeFen, moveUci, afterFen }));
    beforeFen = afterFen;
  }
  return Object.freeze(result);
}

function windows<T>(values: readonly T[], size: number): readonly (readonly T[])[] {
  return Object.freeze(Array.from({ length: Math.max(0, values.length - size + 1) }, (_, index) => Object.freeze(values.slice(index, index + size))));
}

describe("D1066 sequence-only semantic reach", () => {
  it("runs every registered 3–5 edge operand detector over the fixed depth-12 PVs", () => {
    const source = JSON.parse(readFileSync(INPUT, "utf8")) as { readonly rows: readonly InputRow[] };
    const totals: Record<string, { windows: number; events: number; lines: Set<string> }> = Object.fromEntries([
      "deflection", "attraction_3", "attraction_5", "line_blocker_clearance", "square_clearance",
      "interference", "check_zwischenzug", "overload_exploitation",
    ].map((id) => [id, { windows: 0, events: 0, lines: new Set<string>() }]));
    for (const row of source.rows) {
      const probe = row.probes.find((candidate) => candidate.arm === "depth12");
      if (probe === undefined) throw new TypeError(`Missing depth12 for ${row.packId}`);
      const path = anchors(row.fen, probe.pv);
      const measure = (id: keyof typeof totals, size: number, detector: (value: readonly RecordedMoveAnchor[]) => readonly unknown[]) => {
        for (const window of windows(path, size)) {
          totals[id]!.windows += 1;
          const found = detector(window);
          totals[id]!.events += found.length;
          if (found.length > 0) totals[id]!.lines.add(row.packId);
        }
      };
      measure("deflection", 3, deflectionObservedOperands);
      measure("attraction_3", 3, attractionObservedOperands);
      measure("attraction_5", 5, attractionObservedOperands);
      measure("line_blocker_clearance", 3, lineBlockerClearanceObservedOperands);
      measure("square_clearance", 3, squareClearanceObservedOperands);
      measure("interference", 3, interferenceObservedOperands);
      measure("check_zwischenzug", 4, checkZwischenzugObservedOperands);
      measure("overload_exploitation", 3, overloadExploitationObservedOperands);
    }
    const serialized = Object.fromEntries(Object.entries(totals).map(([id, value]) => [id, { windows: value.windows, events: value.events, lines: value.lines.size }]));
    writeFileSync(OUTPUT, `${JSON.stringify({ measuredAt: new Date().toISOString(), population: { positions: source.rows.length, arm: "depth12" }, families: serialized }, null, 2)}\n`, "utf8");
    expect(source.rows).toHaveLength(64);
    expect(Object.values(serialized).every((value) => value.windows >= 0 && value.events >= 0)).toBe(true);
  });
});
