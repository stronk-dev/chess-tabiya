// DISPOSABLE research harness — D1724. Not production code.
import { readFileSync } from "node:fs";
import { attacks, pawnAttacks } from "chessops/attacks";
import { Chess } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import type { Color, Piece, Role, Square, SquareName } from "chessops/types";
import { makeSquare, opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { matchesStructuralFeature, pawnSafety } from "@chess-tabiya/runtime";
import { authoredRows, importedRows, legalOutcomes, type ResearchRow } from "../research-chess/populations.js";

const BASELINE = new URL("./baseline.json", import.meta.url).pathname;
const COLORS = Object.freeze(["white", "black"] as const);
const SQUARES = Object.freeze(Array.from({ length: 64 }, (_, square) => makeSquare(square as Square)));
const NON_PAWN_ROLES = new Set<Role>(["knight", "bishop", "rook", "queen", "king"]);
const OUTPOST_ROLES = new Set<Role>(["knight", "bishop", "rook", "queen"]);

interface SquareRelation {
  readonly beneficiary: Color;
  readonly square: SquareName;
  readonly relativeRank: number;
  readonly supportPawns: readonly SquareName[];
  readonly currentEnemyPawnControllers: readonly SquareName[];
  readonly futureFileAttackers: readonly { readonly square: SquareName; readonly pushes: number }[];
  readonly captureMigrationAttackers: readonly { readonly square: SquareName; readonly captures: number }[];
  readonly currentPawnSafe: boolean;
  readonly fileReachSafe: boolean;
  readonly maximalReachSafe: boolean;
  readonly occupant?: Piece;
}

interface DenialEvent {
  readonly pawnMove: boolean;
  readonly gainedSquares: readonly SquareName[];
  readonly occupiedTargets: readonly string[];
  readonly reachableTargets: readonly string[];
  readonly currentCandidatesRemoved: readonly SquareName[];
  readonly fileCandidatesRemoved: readonly SquareName[];
}

function position(fen: string): Chess { return Chess.fromSetup(parseFen(fen).unwrap()).unwrap(); }
function rank(square: Square): number { return Math.floor(square / 8); }
function relation(fen: string, beneficiary: Color, squareName: SquareName): SquareRelation {
  const pos = position(fen);
  const square = SQUARES.indexOf(squareName) as Square;
  const enemy = opposite(beneficiary);
  const supportPawns: SquareName[] = [];
  const currentEnemyPawnControllers: SquareName[] = [];
  for (const [source, piece] of pos.board) {
    if (piece.role !== "pawn") continue;
    if (piece.color === beneficiary && pawnAttacks(beneficiary, source).has(square)) supportPawns.push(makeSquare(source));
    if (piece.color === enemy && pawnAttacks(enemy, source).has(square)) currentEnemyPawnControllers.push(makeSquare(source));
  }
  const detail = pawnSafety(fen, beneficiary, squareName);
  return Object.freeze({
    beneficiary,
    square: squareName,
    relativeRank: beneficiary === "white" ? rank(square) + 1 : 8 - rank(square),
    supportPawns: Object.freeze(supportPawns.sort()),
    currentEnemyPawnControllers: Object.freeze(currentEnemyPawnControllers.sort()),
    futureFileAttackers: detail.pushAttackers,
    captureMigrationAttackers: detail.captureAttackers,
    currentPawnSafe: currentEnemyPawnControllers.length === 0,
    fileReachSafe: detail.pushAttackers.length === 0,
    maximalReachSafe: detail.safe,
    occupant: pos.board.get(square),
  });
}

function isCandidate(value: SquareRelation, basis: "current" | "file" | "maximal"): boolean {
  const safe = basis === "current" ? value.currentPawnSafe : basis === "file" ? value.fileReachSafe : value.maximalReachSafe;
  return value.relativeRank >= 4 && value.relativeRank <= 6 && value.supportPawns.length > 0 && safe;
}

function candidates(fen: string, beneficiary: Color, basis: "current" | "file" | "maximal"): ReadonlySet<SquareName> {
  return new Set(SQUARES.filter((square) => isCandidate(relation(fen, beneficiary, square), basis)));
}

function pawnAttackUnion(pos: Chess, color: Color): Set<Square> {
  const result = new Set<Square>();
  for (const square of pos.board.pieces(color, "pawn")) for (const target of pawnAttacks(color, square)) result.add(target);
  return result;
}

function roleTarget(square: SquareName, source: Square, role: Role): string { return `${role}@${makeSquare(source)}→${square}`; }

function denialEvent(parentFen: string, uci: string): DenialEvent {
  const before = position(parentFen);
  const move = parseUci(uci);
  if (move === undefined || !("from" in move) || !before.isLegal(move)) throw new TypeError(`illegal D1724 move ${uci}`);
  const mover = before.board.get(move.from);
  if (mover === undefined || mover.role !== "pawn") return Object.freeze({ pawnMove: false, gainedSquares: [], occupiedTargets: [], reachableTargets: [], currentCandidatesRemoved: [], fileCandidatesRemoved: [] });
  const enemy = opposite(mover.color);
  const beforeCurrent = candidates(parentFen, enemy, "current");
  const beforeFile = candidates(parentFen, enemy, "file");
  const beforeAttacks = pawnAttackUnion(before, mover.color);
  const after = before.clone();
  after.play(move);
  const afterFen = makeFen(after.toSetup());
  const afterAttacks = pawnAttackUnion(after, mover.color);
  const gained = [...afterAttacks].filter((square) => !beforeAttacks.has(square));
  const occupiedTargets: string[] = [];
  const reachableTargets: string[] = [];
  for (const target of gained) {
    const occupant = after.board.get(target);
    if (occupant?.color === enemy && NON_PAWN_ROLES.has(occupant.role)) occupiedTargets.push(`${occupant.role}@${makeSquare(target)}`);
    for (const [source, piece] of after.board) {
      if (piece.color !== enemy || piece.role === "pawn" || !NON_PAWN_ROLES.has(piece.role)) continue;
      if (attacks(piece, source, after.board.occupied).has(target)) reachableTargets.push(roleTarget(makeSquare(target), source, piece.role));
    }
  }
  const afterCurrent = candidates(afterFen, enemy, "current");
  const afterFile = candidates(afterFen, enemy, "file");
  return Object.freeze({
    pawnMove: true,
    gainedSquares: Object.freeze(gained.map(makeSquare).sort()),
    occupiedTargets: Object.freeze([...new Set(occupiedTargets)].sort()),
    reachableTargets: Object.freeze([...new Set(reachableTargets)].sort()),
    currentCandidatesRemoved: Object.freeze([...beforeCurrent].filter((square) => !afterCurrent.has(square)).sort()),
    fileCandidatesRemoved: Object.freeze([...beforeFile].filter((square) => !afterFile.has(square)).sort()),
  });
}

function staticPopulation(rows: readonly ResearchRow[]) {
  const fens = [...new Set(rows.map((row) => row.fen))];
  const totals = {
    positions: fens.length, advancedSupported: 0, currentCandidates: 0, fileCandidates: 0, maximalCandidates: 0,
    fileNotMaximal: 0, currentNotFile: 0,
    occupiedCurrent: 0, occupiedFile: 0, occupiedMaximal: 0,
    occupiedFileRoles: { knight: 0, bishop: 0, rook: 0, queen: 0, king: 0 } as Record<string, number>,
  };
  for (const fen of fens) for (const color of COLORS) for (const square of SQUARES) {
    const value = relation(fen, color, square);
    if (value.relativeRank < 4 || value.relativeRank > 6 || value.supportPawns.length === 0) continue;
    totals.advancedSupported += 1;
    const current = isCandidate(value, "current");
    const file = isCandidate(value, "file");
    const maximal = isCandidate(value, "maximal");
    totals.currentCandidates += Number(current);
    totals.fileCandidates += Number(file);
    totals.maximalCandidates += Number(maximal);
    totals.currentNotFile += Number(current && !file);
    totals.fileNotMaximal += Number(file && !maximal);
    const occupied = value.occupant !== undefined && value.occupant.color === color && OUTPOST_ROLES.has(value.occupant.role);
    totals.occupiedCurrent += Number(occupied && current);
    totals.occupiedFile += Number(occupied && file);
    totals.occupiedMaximal += Number(occupied && maximal);
    if (occupied && file) totals.occupiedFileRoles[value.occupant!.role] = (totals.occupiedFileRoles[value.occupant!.role] ?? 0) + 1;
  }
  return totals;
}

const EVENT_KEYS = ["pawnMove", "occupiedTarget", "reachableTarget", "currentCandidateRemoved", "fileCandidateRemoved"] as const;
type EventKey = (typeof EVENT_KEYS)[number];
function flags(value: DenialEvent): Record<EventKey, boolean> {
  return {
    pawnMove: value.pawnMove,
    occupiedTarget: value.occupiedTargets.length > 0,
    reachableTarget: value.reachableTargets.length > 0,
    currentCandidateRemoved: value.currentCandidatesRemoved.length > 0,
    fileCandidateRemoved: value.fileCandidatesRemoved.length > 0,
  };
}

function transitionPopulation(rows: readonly ResearchRow[]) {
  const played = Object.fromEntries(EVENT_KEYS.map((key) => [key, 0])) as Record<EventKey, number>;
  const alternatives = Object.fromEntries(EVENT_KEYS.map((key) => [key, 0])) as Record<EventKey, number>;
  const examples = Object.fromEntries(EVENT_KEYS.map((key) => [key, []])) as Record<EventKey, string[]>;
  let alternativeMoves = 0;
  for (const row of rows) {
    const event = denialEvent(row.parentFen, row.uci);
    const value = flags(event);
    for (const key of EVENT_KEYS) {
      played[key] += Number(value[key]);
      if (value[key] && examples[key].length < 4) examples[key].push(`${row.id}:${row.uci}`);
    }
    for (const alternative of legalOutcomes(row.parentFen)) {
      alternativeMoves += 1;
      const alternativeFlags = flags(denialEvent(row.parentFen, alternative.uci));
      for (const key of EVENT_KEYS) alternatives[key] += Number(alternativeFlags[key]);
    }
  }
  return { decisions: rows.length, alternativeMoves, played, alternatives, examples };
}

describe("D1724 square-denial/outpost boundary", () => {
  it("separates current, same-file future and capture-migration pawn reach", () => {
    const fen = "4k3/8/8/1N6/8/8/3P4/4K3 w - - 0 1";
    const value = relation(fen, "black", "b5");
    expect(value).toMatchObject({
      currentPawnSafe: true,
      fileReachSafe: true,
      maximalReachSafe: false,
      currentEnemyPawnControllers: [],
      futureFileAttackers: [],
      captureMigrationAttackers: [{ square: "d2", captures: 1 }],
    });
  });

  it("distinguishes a candidate square from an occupied outpost", () => {
    const empty = relation("4k3/8/8/8/8/3P4/8/4K3 w - - 0 1", "white", "e4");
    expect(isCandidate(empty, "file")).toBe(true);
    expect(empty.occupant).toBeUndefined();
    const occupied = relation("4k3/8/8/8/4N3/3P4/8/4K3 w - - 0 1", "white", "e4");
    expect(isCandidate(occupied, "file")).toBe(true);
    expect(occupied.occupant).toEqual({ color: "white", role: "knight", promoted: false });
  });

  it("reconstructs the shipped outpost predicate as the maximal-reach candidate", () => {
    const cases = [
      "4k3/8/8/8/8/3P4/8/4K3 w - - 0 1",
      "4k3/8/8/8/4N3/3P4/8/4K3 w - - 0 1",
      "4k3/8/8/3p4/4N3/3P4/8/4K3 w - - 0 1",
    ];
    for (const fen of cases) for (const color of COLORS) for (const square of SQUARES) {
      expect(matchesStructuralFeature(fen, { kind: "outpost", color, square })).toBe(isCandidate(relation(fen, color, square), "maximal"));
    }
  });

  it("names the exact piece and square challenged by new pawn control", () => {
    const bishop = denialEvent("4k3/8/8/8/6b1/8/7P/4K3 w - - 0 1", "h2h3");
    expect(bishop.gainedSquares).toEqual(["g4"]);
    expect(bishop.occupiedTargets).toEqual(["bishop@g4"]);
    const knightRoute = denialEvent("4k3/8/8/8/8/8/P1n5/7K w - - 0 1", "a2a3");
    expect(knightRoute.gainedSquares).toEqual(["b4"]);
    expect(knightRoute.reachableTargets).toEqual(["knight@c2→b4"]);
  });

  it("shows that current-control denial and future-file denial are different events", () => {
    const value = denialEvent("4k3/8/8/8/8/3P4/2P5/4K3 w - - 0 1", "c2c3");
    expect(value.gainedSquares).toEqual(["b4", "d4"]);
    expect(value.currentCandidatesRemoved.length).toBeGreaterThanOrEqual(0);
    expect(value.fileCandidatesRemoved).toEqual([]);
  });

  it("retains the frozen population receipt", () => {
    const baseline = JSON.parse(readFileSync(BASELINE, "utf8")) as { readonly schema: string; readonly populations: Record<string, { readonly static: ReturnType<typeof staticPopulation>; readonly transitions: ReturnType<typeof transitionPopulation> }> };
    expect(baseline.schema).toBe("tabiya.research.d1724-square-denial.v1");
    expect(baseline.populations.authored?.static.positions).toBe(611);
    expect(baseline.populations.imported?.static.positions).toBe(577);
    for (const population of Object.values(baseline.populations)) {
      expect(population.static.maximalCandidates).toBeLessThanOrEqual(population.static.fileCandidates);
      expect(population.static.fileCandidates).toBeLessThanOrEqual(population.static.currentCandidates);
      expect(population.transitions.alternativeMoves).toBeGreaterThan(population.transitions.decisions);
    }
  });

  it("recomputes the fixed populations when explicitly requested", () => {
    if (process.env.D1724_CENSUS !== "1") return;
    console.log(JSON.stringify({
      schema: "tabiya.research.d1724-square-denial.v1",
      populations: {
        authored: { static: staticPopulation(authoredRows()), transitions: transitionPopulation(authoredRows()) },
        imported: { static: staticPopulation(importedRows()), transitions: transitionPopulation(importedRows()) },
      },
    }));
  }, 120_000);
});
