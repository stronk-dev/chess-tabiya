// DISPOSABLE research harness — D1728. Not production code.
import { readFileSync } from "node:fs";
import type { Color, FileName, SquareName } from "chessops/types";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { matchesStructuralFeature, pawnConnectivityReading } from "@chess-tabiya/runtime";
import { authoredRows, importedRows, type ResearchRow } from "../research-chess/populations.js";

const BASELINE = new URL("./baseline.json", import.meta.url).pathname;
const COLORS = Object.freeze(["white", "black"] as const);
const FILES = Object.freeze(["a", "b", "c", "d", "e", "f", "g", "h"] as const);

interface PawnFileRecord {
  readonly color: Color;
  readonly file: FileName;
  readonly pawns: readonly SquareName[];
  readonly isolated: boolean;
  readonly doubled: boolean;
}

function records(fen: string): readonly PawnFileRecord[] {
  const reading = pawnConnectivityReading(fen);
  return Object.freeze(reading.colors.flatMap((colorReading) => {
    const byFile = new Map<FileName, SquareName[]>();
    for (const island of colorReading.islands) for (const square of island.squares) {
      const file = square[0] as FileName;
      byFile.set(file, [...(byFile.get(file) ?? []), square]);
    }
    return [...byFile].sort(([left], [right]) => left.localeCompare(right)).map(([file, squares]) => {
      const index = FILES.indexOf(file);
      const neighbors = [FILES[index - 1], FILES[index + 1]].filter((value): value is FileName => value !== undefined);
      return Object.freeze({
        color: colorReading.color,
        file,
        pawns: Object.freeze([...squares].sort()),
        isolated: neighbors.every((neighbor) => !byFile.has(neighbor)),
        doubled: squares.length >= 2,
      });
    });
  }));
}

function recordMap(fen: string): ReadonlyMap<string, PawnFileRecord> {
  return new Map(records(fen).map((record) => [`${record.color}:${record.file}`, record]));
}

function staticCensus(rows: readonly ResearchRow[]) {
  const fens = [...new Set(rows.map((row) => row.fen))];
  const totals = {
    positions: fens.length,
    isolatedFiles: 0,
    isolatedPawns: 0,
    isolatedMultiPawnFiles: 0,
    doubledFiles: 0,
    doubledPawns: 0,
    tripledOrMoreFiles: 0,
    isolatedAndDoubledFiles: 0,
  };
  for (const fen of fens) for (const record of records(fen)) {
    if (record.isolated) {
      totals.isolatedFiles += 1;
      totals.isolatedPawns += record.pawns.length;
      totals.isolatedMultiPawnFiles += Number(record.pawns.length >= 2);
    }
    if (record.doubled) {
      totals.doubledFiles += 1;
      totals.doubledPawns += record.pawns.length;
      totals.tripledOrMoreFiles += Number(record.pawns.length >= 3);
    }
    totals.isolatedAndDoubledFiles += Number(record.isolated && record.doubled);
  }
  return totals;
}

type Family = "isolated" | "doubled";
function transitionCensus(rows: readonly ResearchRow[], family: Family) {
  const totals = { decisions: rows.length, changedGroups: 0, truthChanged: 0, identityOnlyChanged: 0, crossSubjectChanged: 0, examples: [] as string[] };
  for (const row of rows) {
    const before = recordMap(row.parentFen), after = recordMap(row.fen);
    const move = parseUci(row.uci);
    if (move === undefined || !("from" in move)) throw new TypeError(`Invalid research UCI ${row.uci}`);
    const from = `${FILES[move.from % 8]}${Math.floor(move.from / 8) + 1}` as SquareName;
    const to = `${FILES[move.to % 8]}${Math.floor(move.to / 8) + 1}` as SquareName;
    for (const key of new Set([...before.keys(), ...after.keys()])) {
      const left = before.get(key), right = after.get(key);
      const leftTrue = left?.[family] ?? false, rightTrue = right?.[family] ?? false;
      if (!leftTrue && !rightTrue) continue;
      const leftPawns = leftTrue ? left!.pawns : [];
      const rightPawns = rightTrue ? right!.pawns : [];
      if (leftPawns.join(",") === rightPawns.join(",")) continue;
      totals.changedGroups += 1;
      const truthChanged = leftTrue !== rightTrue;
      totals.truthChanged += Number(truthChanged);
      totals.identityOnlyChanged += Number(!truthChanged);
      const containsMover = leftPawns.includes(from) || rightPawns.includes(to);
      totals.crossSubjectChanged += Number(!containsMover);
      if (!containsMover && totals.examples.length < 6) totals.examples.push(`${row.id}:${row.uci}:${key}:${leftPawns.join("+")}→${rightPawns.join("+")}`);
    }
  }
  return totals;
}

function census(rows: readonly ResearchRow[]) {
  return { static: staticCensus(rows), isolatedTransitions: transitionCensus(rows, "isolated"), doubledTransitions: transitionCensus(rows, "doubled") };
}

describe("D1728 exact pawn-file derivation", () => {
  it("is set-equal to both legacy predicates over the fixed populations", () => {
    for (const row of [...authoredRows(), ...importedRows()]) {
      const byKey = recordMap(row.fen);
      for (const color of COLORS) for (const file of FILES) {
        const record = byKey.get(`${color}:${file}`);
        expect(record?.isolated ?? false, `${row.id}:${color}:${file}:isolated`).toBe(matchesStructuralFeature(row.fen, { kind: "isolated_pawn", color, file }));
        expect(record?.doubled ?? false, `${row.id}:${color}:${file}:doubled`).toBe(matchesStructuralFeature(row.fen, { kind: "doubled_pawn", color, file }));
      }
    }
  });

  it("retains every pawn in compound isolated and tripled groups", () => {
    const compound = records("4k3/8/8/8/2P5/2P5/8/4K3 w - - 0 1").find((record) => record.color === "white" && record.file === "c")!;
    expect(compound).toEqual({ color: "white", file: "c", pawns: ["c3", "c4"], isolated: true, doubled: true });
    const tripled = records("4k3/8/8/2P5/2P5/2P5/8/4K3 w - - 0 1").find((record) => record.color === "white" && record.file === "c")!;
    expect(tripled.pawns).toEqual(["c3", "c4", "c5"]);
  });

  it("retains the frozen population receipt", () => {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as { readonly schema: string; readonly authored: ReturnType<typeof census>; readonly imported: ReturnType<typeof census> };
    expect(baseline.schema).toBe("tabiya.research.d1728-pawn-file-identity.v1");
    expect(baseline.authored).toEqual(census(authoredRows()));
    expect(baseline.imported).toEqual(census(importedRows()));
  });

  it("recomputes the fixed populations when explicitly requested", () => {
    if (process.env.D1728_CENSUS !== "1") return;
    console.log(JSON.stringify({ schema: "tabiya.research.d1728-pawn-file-identity.v1", authored: census(authoredRows()), imported: census(importedRows()) }));
  }, 120_000);
});
