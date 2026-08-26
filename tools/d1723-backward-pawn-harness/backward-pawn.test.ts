// DISPOSABLE research harness — D1723. Not production code.
import { readFileSync } from "node:fs";
import { pawnAttacks } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";
import type { Color, Square } from "chessops/types";
import { makeSquare, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { classifyPhase, matchesStructuralFeature, structuralReading } from "@chess-tabiya/runtime";
import { authoredRows, importedRows } from "../research-chess/populations.js";

const BASELINE = new URL("./baseline.json", import.meta.url).pathname;
const FILES = Object.freeze(["a", "b", "c", "d", "e", "f", "g", "h"] as const);
type FileName = (typeof FILES)[number];

interface Subject {
  readonly color: Color;
  readonly file: FileName;
  readonly pawn: string;
  readonly stop: string;
  readonly stopOccupant: "empty" | "own" | "enemy";
  readonly supportCandidates: readonly string[];
  readonly adjacentAhead: readonly string[];
  readonly enemyPawnControllers: readonly string[];
  readonly capturableEnemyPawns: readonly string[];
  readonly isolated: boolean;
  readonly halfOpenFile: boolean;
}

function rank(square: Square): number { return Math.floor(square / 8); }
function file(square: Square): number { return square % 8; }
function forward(color: Color): 1 | -1 { return color === "white" ? 1 : -1; }

function subjects(fen: string): readonly Subject[] {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  const values: Subject[] = [];
  for (const color of ["white", "black"] as const) {
    const enemy = opposite(color);
    const ownPawns = [...position.board[color]].filter((square) => position.board.getRole(square) === "pawn");
    const enemyPawns = [...position.board[enemy]].filter((square) => position.board.getRole(square) === "pawn");
    for (const pawn of ownPawns) {
      const stop = pawn + 8 * forward(color);
      if (stop < 0 || stop >= 64) continue;
      const adjacent = ownPawns.filter((other) => Math.abs(file(other) - file(pawn)) === 1);
      const supportCandidates = adjacent.filter((other) => (rank(other) - rank(pawn)) * forward(color) <= 0);
      const enemyPawnControllers = enemyPawns.filter((other) => pawnAttacks(enemy, other).has(stop as Square));
      if (supportCandidates.length > 0 || enemyPawnControllers.length === 0) continue;
      const occupant = position.board.get(stop as Square);
      values.push(Object.freeze({
        color,
        file: FILES[file(pawn)]!,
        pawn: makeSquare(pawn),
        stop: makeSquare(stop as Square),
        stopOccupant: occupant === undefined ? "empty" : occupant.color === color ? "own" : "enemy",
        supportCandidates: Object.freeze(supportCandidates.map(makeSquare).sort()),
        adjacentAhead: Object.freeze(adjacent.filter((other) => (rank(other) - rank(pawn)) * forward(color) > 0).map(makeSquare).sort()),
        enemyPawnControllers: Object.freeze(enemyPawnControllers.map(makeSquare).sort()),
        capturableEnemyPawns: Object.freeze(enemyPawns.filter((other) => pawnAttacks(color, pawn).has(other)).map(makeSquare).sort()),
        isolated: adjacent.length === 0,
        halfOpenFile: !enemyPawns.some((other) => file(other) === file(pawn)),
      }));
    }
  }
  return Object.freeze(values.sort((left, right) => `${left.color}:${left.pawn}`.localeCompare(`${right.color}:${right.pawn}`)));
}

function currentKeys(fen: string): readonly string[] {
  return Object.freeze((["white", "black"] as const).flatMap((color) => FILES.flatMap((file) =>
    matchesStructuralFeature(fen, { kind: "backward_pawn", color, file }) ? [`${color}:${file}`] : [],
  )).sort());
}

function subjectKeys(fen: string): readonly string[] {
  return Object.freeze([...new Set(subjects(fen).map((subject) => `${subject.color}:${subject.file}`))].sort());
}

function population(rows: ReturnType<typeof authoredRows>) {
  const unique = new Set<string>();
  const phases = {
    opening: { files: 0, subjects: 0, emptyStop: 0 },
    middlegame: { files: 0, subjects: 0, emptyStop: 0 },
    endgame: { files: 0, subjects: 0, emptyStop: 0 },
    unclear: { files: 0, subjects: 0, emptyStop: 0 },
  };
  const totals = {
    decisions: rows.length, uniquePositions: 0, fileObservations: 0, subjects: 0,
    emptyStop: 0, occupiedStop: 0, occupiedOwn: 0, occupiedEnemy: 0,
    ambiguousFiles: 0, isolated: 0, adjacentAhead: 0, capturableEnemyPawn: 0,
    halfOpenFile: 0, readingsWithNoSquares: 0,
  };
  for (const row of rows) {
    unique.add(row.fen);
    const phase = classifyPhase(row.fen).phase;
    const exact = subjects(row.fen);
    const grouped = new Map<string, number>();
    for (const subject of exact) grouped.set(`${subject.color}:${subject.file}`, (grouped.get(`${subject.color}:${subject.file}`) ?? 0) + 1);
    const readings = structuralReading(row.fen).features.filter((value) => value.kind === "backward_pawn");
    expect(readings.map((value) => `${value.color}:${value.file}`).sort()).toEqual(subjectKeys(row.fen));
    totals.fileObservations += readings.length;
    totals.readingsWithNoSquares += readings.filter((value) => value.squares.length === 0).length;
    totals.subjects += exact.length;
    totals.ambiguousFiles += [...grouped.values()].filter((count) => count > 1).length;
    totals.emptyStop += exact.filter((subject) => subject.stopOccupant === "empty").length;
    totals.occupiedStop += exact.filter((subject) => subject.stopOccupant !== "empty").length;
    totals.occupiedOwn += exact.filter((subject) => subject.stopOccupant === "own").length;
    totals.occupiedEnemy += exact.filter((subject) => subject.stopOccupant === "enemy").length;
    totals.isolated += exact.filter((subject) => subject.isolated).length;
    totals.adjacentAhead += exact.filter((subject) => subject.adjacentAhead.length > 0).length;
    totals.capturableEnemyPawn += exact.filter((subject) => subject.capturableEnemyPawns.length > 0).length;
    totals.halfOpenFile += exact.filter((subject) => subject.halfOpenFile).length;
    phases[phase].files += readings.length;
    phases[phase].subjects += exact.length;
    phases[phase].emptyStop += exact.filter((subject) => subject.stopOccupant === "empty").length;
  }
  totals.uniquePositions = unique.size;
  return { ...totals, phases };
}

describe("D1723 backward-pawn boundary", () => {
  it("reconstructs the shipped file predicate from exact pawn subjects", () => {
    const cases = [
      "4k3/8/2p5/1p6/1P6/8/8/4K3 w - - 0 1",
      "4k3/1p6/2p5/8/1P6/8/8/4K3 w - - 0 1",
      "4k3/8/2p5/2N5/1P6/8/8/4K3 w - - 0 1",
      "4k3/8/2p5/8/1P6/8/8/4K3 w - - 0 1",
      "4k3/2p5/2p5/1P6/3P4/8/8/4K3 w - - 0 1",
    ];
    for (const fen of cases) expect(subjectKeys(fen)).toEqual(currentKeys(fen));
  });

  it("separates support, occupancy, isolation and pawn-controller boundaries", () => {
    const classic = subjects("4k3/8/2p5/1p6/1P6/8/8/4K3 w - - 0 1").find((value) => value.pawn === "c6")!;
    expect(classic).toMatchObject({ stop: "c5", stopOccupant: "empty", isolated: false, adjacentAhead: ["b5"], enemyPawnControllers: ["b4"] });
    expect(subjects("4k3/1p6/2p5/8/1P6/8/8/4K3 w - - 0 1").filter((value) => value.color === "black" && value.pawn === "c6")).toEqual([]);
    expect(subjects("4k3/8/2p5/2N5/1P6/8/8/4K3 w - - 0 1")[0]).toMatchObject({ pawn: "c6", stopOccupant: "enemy" });
    expect(subjects("4k3/8/2p5/8/1P6/8/8/4K3 w - - 0 1")[0]).toMatchObject({ pawn: "c6", isolated: true });
    expect(subjects("4k3/8/2p5/8/8/8/4B3/4K3 w - - 0 1")).toEqual([]);
  });

  it("shows why one file observation cannot identify every subject", () => {
    const doubled = "4k3/2p5/2p5/1P6/3P4/8/8/4K3 w - - 0 1";
    expect(subjects(doubled).filter((value) => value.color === "black" && value.file === "c").map((value) => [value.pawn, value.stop, value.stopOccupant])).toEqual([
      ["c6", "c5", "empty"],
      ["c7", "c6", "own"],
    ]);
    const reading = structuralReading(doubled).features.filter((value) => value.kind === "backward_pawn" && value.color === "black" && value.file === "c");
    expect(reading).toHaveLength(1);
    expect(reading[0]?.squares).toEqual([]);
  });

  it("does not promote pseudo pawn control into a legal capture claim", () => {
    const fen = "2k5/8/2p5/8/3P4/8/8/2R1K3 w - - 0 1";
    expect(subjects(fen).find((value) => value.pawn === "d4")).toMatchObject({ stop: "d5", enemyPawnControllers: ["c6"] });
    const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    const push = parseUci("d4d5")!;
    expect(position.isLegal(push)).toBe(true);
    position.play(push);
    expect(position.isLegal(parseUci("c6d5")!)).toBe(false);
  });

  it("retains the frozen population receipt", () => {
    const value = JSON.parse(readFileSync(BASELINE, "utf8")) as { readonly schema: string; readonly populations: Record<string, ReturnType<typeof population>> };
    expect(value.schema).toBe("tabiya.research.d1723-backward-pawn.v1");
    expect(value.populations.authored?.decisions).toBe(754);
    expect(value.populations.imported?.decisions).toBe(579);
    for (const item of Object.values(value.populations)) {
      expect(item.emptyStop + item.occupiedStop).toBe(item.subjects);
      expect(item.occupiedOwn + item.occupiedEnemy).toBe(item.occupiedStop);
      expect(item.readingsWithNoSquares).toBe(item.fileObservations);
      expect(Object.values(item.phases).reduce((sum, phase) => sum + phase.files, 0)).toBe(item.fileObservations);
      expect(Object.values(item.phases).reduce((sum, phase) => sum + phase.subjects, 0)).toBe(item.subjects);
    }
  });

  it("recomputes the fixed populations when explicitly requested", () => {
    if (process.env.D1723_CENSUS !== "1") return;
    console.log(JSON.stringify({ schema: "tabiya.research.d1723-backward-pawn.v1", populations: { authored: population(authoredRows()), imported: population(importedRows()) } }));
  });
});
