// DISPOSABLE research harness — D1732. Not production code.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Color, FileName, Square } from "chessops/types";
import { makeSquare } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  matchesStructuralFeature,
  openFileOccupancyOperands,
  pawnConnectivityReading,
} from "@chess-tabiya/runtime";
import { positionFromFen } from "../../packages/runtime/src/chess.js";
import { authoredRows, importedRows, legalOutcomes, type ResearchRow } from "../research-chess/populations.js";

const BASELINE = resolve(import.meta.dirname, "baseline.json");
const FILES = Object.freeze(["a", "b", "c", "d", "e", "f", "g", "h"] as const);
const COLORS = Object.freeze(["white", "black"] as const);

type FileClass = "open_file" | "half_open_file";

interface ExactFileState {
  readonly file: FileName;
  readonly whitePawns: readonly string[];
  readonly blackPawns: readonly string[];
  readonly open: boolean;
  readonly halfOpenFor: readonly Color[];
}

function exactFiles(fen: string): readonly ExactFileState[] {
  const reading = pawnConnectivityReading(fen);
  const pawns = (color: Color) => reading.colors
    .find((entry) => entry.color === color)!
    .islands.flatMap((island) => island.squares);
  const white = pawns("white"), black = pawns("black");
  return FILES.map((file) => {
    const whitePawns = white.filter((square) => square[0] === file).sort();
    const blackPawns = black.filter((square) => square[0] === file).sort();
    return Object.freeze({
      file,
      whitePawns: Object.freeze(whitePawns),
      blackPawns: Object.freeze(blackPawns),
      open: whitePawns.length === 0 && blackPawns.length === 0,
      halfOpenFor: Object.freeze(COLORS.filter((color) =>
        color === "white"
          ? whitePawns.length === 0 && blackPawns.length > 0
          : blackPawns.length === 0 && whitePawns.length > 0)),
    });
  });
}

function fileClass(fen: string, color: Color, file: FileName): FileClass | undefined {
  const state = exactFiles(fen).find((entry) => entry.file === file)!;
  if (state.open) return "open_file";
  return state.halfOpenFor.includes(color) ? "half_open_file" : undefined;
}

function stationaryReveals(beforeFen: string, afterFen: string) {
  const before = positionFromFen(beforeFen);
  const after = positionFromFen(afterFen);
  const result: { readonly square: string; readonly color: Color; readonly role: "rook" | "queen"; readonly file: FileName; readonly afterClass: FileClass }[] = [];
  for (const [square, piece] of before.board) {
    if (piece.role !== "rook" && piece.role !== "queen") continue;
    const retained = after.board.get(square);
    if (retained?.color !== piece.color || retained.role !== piece.role) continue;
    const file = FILES[square % 8]!;
    const prior = fileClass(beforeFen, piece.color, file);
    const current = fileClass(afterFen, piece.color, file);
    if (prior === undefined && current !== undefined) result.push(Object.freeze({ square: makeSquare(square), color: piece.color, role: piece.role, file, afterClass: current }));
  }
  return Object.freeze(result);
}

function occupancyCount(fen: string): number {
  const position = positionFromFen(fen);
  let count = 0;
  for (const [square, piece] of position.board) {
    if (piece.role !== "rook" && piece.role !== "queen") continue;
    if (fileClass(fen, piece.color, FILES[square % 8]!) !== undefined) count += 1;
  }
  return count;
}

function census(rows: readonly ResearchRow[]) {
  const positions = [...new Set(rows.flatMap((row) => [row.parentFen, row.fen]))];
  let openFiles = 0, halfOpenFiles = 0, heavyOccupancies = 0;
  for (const fen of positions) {
    for (const state of exactFiles(fen)) {
      if (state.open) openFiles += 1;
      halfOpenFiles += state.halfOpenFor.length;
    }
    heavyOccupancies += occupancyCount(fen);
  }

  let movedPlayed = 0, stationaryPlayed = 0, alternatives = 0, movedAlternative = 0, stationaryAlternative = 0;
  const movedPlayedKinds = new Map<string, number>();
  const stationaryPlayedKinds = new Map<string, number>();
  for (const row of rows) {
    const moved = openFileOccupancyOperands(row.parentFen, row.uci, row.fen);
    if (moved !== undefined) {
      movedPlayed += 1;
      const key = `${moved.piece.after.piece.role}:${moved.fileClass}`;
      movedPlayedKinds.set(key, (movedPlayedKinds.get(key) ?? 0) + 1);
    }
    const stationary = stationaryReveals(row.parentFen, row.fen);
    stationaryPlayed += stationary.length;
    for (const reveal of stationary) {
      const key = `${reveal.role}:${reveal.afterClass}`;
      stationaryPlayedKinds.set(key, (stationaryPlayedKinds.get(key) ?? 0) + 1);
    }
    for (const alternative of legalOutcomes(row.parentFen)) {
      if (alternative.uci === row.uci) continue;
      alternatives += 1;
      if (openFileOccupancyOperands(row.parentFen, alternative.uci, alternative.fen) !== undefined) movedAlternative += 1;
      stationaryAlternative += stationaryReveals(row.parentFen, alternative.fen).length;
    }
  }
  const rate = (numerator: number, denominator: number) => denominator === 0 ? 0 : numerator / denominator;
  const lift = (played: number, decisions: number, alternative: number, alternativeCount: number) =>
    Number((rate(played, decisions) / rate(alternative, alternativeCount)).toFixed(2));
  return Object.freeze({
    positions: positions.length,
    decisions: rows.length,
    openFiles,
    halfOpenFiles,
    heavyOccupancies,
    movedPlayed,
    movedPlayedKinds: Object.fromEntries([...movedPlayedKinds].sort()),
    movedAlternative,
    movedLift: lift(movedPlayed, rows.length, movedAlternative, alternatives),
    stationaryPlayed,
    stationaryPlayedKinds: Object.fromEntries([...stationaryPlayedKinds].sort()),
    stationaryAlternative,
    stationaryLift: lift(stationaryPlayed, rows.length, stationaryAlternative, alternatives),
    alternatives,
  });
}

describe("D1732 exact file-state source", () => {
  it("derives set-equal open/half-open truth from pawn connectivity", () => {
    for (const row of [...authoredRows(), ...importedRows()]) for (const fen of [row.parentFen, row.fen]) {
      for (const state of exactFiles(fen)) {
        expect(state.open).toBe(matchesStructuralFeature(fen, { kind: "open_file", file: state.file }));
        for (const color of COLORS) expect(state.halfOpenFor.includes(color)).toBe(matchesStructuralFeature(fen, { kind: "half_open_file", color, file: state.file }));
      }
    }
  }, 120_000);

  it("keeps an open file distinct from both color-relative half-open states", () => {
    const [d] = exactFiles("4k3/3p4/8/8/8/8/8/3RK3 w - - 0 1").filter((entry) => entry.file === "d");
    expect(d).toEqual({ file: "d", whitePawns: [], blackPawns: ["d7"], open: false, halfOpenFor: ["white"] });
    const open = exactFiles("4k3/8/8/8/8/8/8/3RK3 w - - 0 1").find((entry) => entry.file === "d")!;
    expect(open).toEqual({ file: "d", whitePawns: [], blackPawns: [], open: true, halfOpenFor: [] });
  });

  it("proves stationary access is outside the shipped moved-piece event", () => {
    const before = "4k3/8/8/8/8/1p6/P7/R3K3 w - - 0 1";
    const after = legalOutcomes(before).find((edge) => edge.uci === "a2b3")!.fen;
    expect(openFileOccupancyOperands(before, "a2b3", after)).toBeUndefined();
    expect(stationaryReveals(before, after)).toEqual([{ square: "a1", color: "white", role: "rook", file: "a", afterClass: "open_file" }]);
  });
});

describe("D1732 fixed-population reach", () => {
  it("retains the frozen authored/imported receipt", () => {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
    expect(baseline.schema).toBe("tabiya.research.d1732-file-activity.v1");
    expect(baseline.authored).toEqual(census(authoredRows()));
    expect(baseline.imported).toEqual(census(importedRows()));
  }, 120_000);

  it("recomputes the receipt when explicitly requested", () => {
    if (process.env.D1732_CENSUS !== "1") return;
    console.log(JSON.stringify({ schema: "tabiya.research.d1732-file-activity.v1", authored: census(authoredRows()), imported: census(importedRows()) }, null, 2));
  }, 120_000);
});
