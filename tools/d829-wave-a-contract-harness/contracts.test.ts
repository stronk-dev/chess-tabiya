// DISPOSABLE research harness — D829–D835/D931 Wave-A contract boundaries.
import { attacks } from "chessops/attacks";
import { Chess, normalizeMove } from "chessops/chess";
import { makeFen } from "chessops/fen";
import type { Color, Square, SquareName } from "chessops/types";
import { makeSquare, opposite, parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { positionFromFen } from "../../packages/runtime/src/chess.js";
import { discoveredLatencyReading, loosePieceReading, type LoosePieceReading } from "../../packages/runtime/src/tactics.js";
import { transitionSemanticFacts } from "../../packages/runtime/src/transition.js";
import { captureAt, researchPosition } from "../research-chess/legal-exchange.js";
import { playedFen } from "../research-chess/populations.js";

interface PawnConnectivity {
  readonly islands: readonly (readonly SquareName[])[];
  readonly adjacentFilePairs: readonly (readonly [SquareName, SquareName])[];
  readonly supportEdges: readonly (readonly [SquareName, SquareName])[];
  readonly chains: readonly { readonly members: readonly SquareName[]; readonly bases: readonly SquareName[] }[];
}

function pawnConnectivity(fen: string, color: Color): PawnConnectivity {
  const position = researchPosition(fen);
  const pawns = [...position.board.pieces(color, "pawn")].sort((left, right) => left - right);
  const byFile = new Map<number, Square[]>();
  for (const pawn of pawns) byFile.set(pawn % 8, [...(byFile.get(pawn % 8) ?? []), pawn]);
  const files = [...byFile.keys()].sort((left, right) => left - right);
  const islands: Square[][] = [];
  let lastFile: number | undefined;
  for (const file of files) {
    if (lastFile === undefined || file !== lastFile + 1) islands.push([...(byFile.get(file) ?? [])]);
    else islands.at(-1)!.push(...(byFile.get(file) ?? []));
    lastFile = file;
  }
  const adjacentFilePairs: [SquareName, SquareName][] = [];
  const supportEdges: [SquareName, SquareName][] = [];
  for (let left = 0; left < pawns.length; left += 1) {
    for (let right = left + 1; right < pawns.length; right += 1) {
      const a = pawns[left]!;
      const b = pawns[right]!;
      if (Math.abs(a % 8 - b % 8) === 1) adjacentFilePairs.push([makeSquare(a), makeSquare(b)]);
      if (attacks({ color, role: "pawn" }, a, position.board.occupied).has(b)) supportEdges.push([makeSquare(a), makeSquare(b)]);
      if (attacks({ color, role: "pawn" }, b, position.board.occupied).has(a)) supportEdges.push([makeSquare(b), makeSquare(a)]);
    }
  }
  const graph = new Map<SquareName, Set<SquareName>>();
  for (const [from, to] of supportEdges) {
    (graph.get(from) ?? graph.set(from, new Set()).get(from)!).add(to);
    (graph.get(to) ?? graph.set(to, new Set()).get(to)!).add(from);
  }
  const seen = new Set<SquareName>();
  const chains: { members: SquareName[]; bases: SquareName[] }[] = [];
  for (const start of [...graph.keys()].sort()) {
    if (seen.has(start)) continue;
    const members: SquareName[] = [];
    const queue = [start];
    while (queue.length > 0) {
      const square = queue.shift()!;
      if (seen.has(square)) continue;
      seen.add(square);
      members.push(square);
      queue.push(...(graph.get(square) ?? []));
    }
    members.sort();
    const supported = new Set(supportEdges.map(([, to]) => to));
    chains.push({ members, bases: members.filter((square) => !supported.has(square)) });
  }
  return Object.freeze({
    islands: Object.freeze(islands.map((island) => Object.freeze(island.map(makeSquare).sort()))),
    adjacentFilePairs: Object.freeze(adjacentFilePairs),
    supportEdges: Object.freeze(supportEdges),
    chains: Object.freeze(chains.map((chain) => Object.freeze({ members: Object.freeze(chain.members), bases: Object.freeze(chain.bases) }))),
  });
}

function looseForColor(fen: string, color: Color): { readonly kind: "reading"; readonly value: LoosePieceReading } | { readonly kind: "unavailable"; readonly reason: "invalid_turn_clone" } {
  const position = positionFromFen(fen);
  if (opposite(position.turn) === color) return { kind: "reading", value: loosePieceReading(fen) };
  const clone = Chess.fromSetup({ ...position.toSetup(), turn: opposite(color), epSquare: undefined });
  return clone.isOk
    ? { kind: "reading", value: loosePieceReading(makeFen(clone.value.toSetup())) }
    : { kind: "unavailable", reason: "invalid_turn_clone" };
}

function loosePieceSigns(beforeFen: string, moveUci: string): readonly { readonly before: SquareName; readonly after: SquareName; readonly sign: "gained" | "lost" | "preserved" }[] {
  const beforePosition = positionFromFen(beforeFen);
  const parsed = parseUci(moveUci);
  if (parsed === undefined || !("from" in parsed)) throw new TypeError("normal move required");
  const move = normalizeMove(beforePosition, parsed);
  if (!("from" in move) || !beforePosition.isLegal(move)) throw new TypeError("legal move required");
  const mover = beforePosition.turn;
  const afterFen = playedFen(beforeFen, moveUci);
  const baseline = looseForColor(beforeFen, mover);
  const outcome = looseForColor(afterFen, mover);
  if (baseline.kind !== "reading" || outcome.kind !== "reading") return [];
  const afterBySquare = new Map(outcome.value.pieces.map((state) => [state.piece.square, state]));
  const events: { before: SquareName; after: SquareName; sign: "gained" | "lost" | "preserved" }[] = [];
  for (const prior of baseline.value.pieces) {
    const beforeSquare = prior.piece.square;
    const afterSquare = beforeSquare === makeSquare(move.from) ? makeSquare(move.to) : beforeSquare;
    const current = afterBySquare.get(afterSquare);
    if (current === undefined || current.piece.occupant.color !== mover) continue;
    if (!prior.enPrise && current.enPrise) events.push({ before: beforeSquare, after: afterSquare, sign: "gained" });
    if (prior.enPrise && !current.enPrise) events.push({ before: beforeSquare, after: afterSquare, sign: "lost" });
    if (prior.enPrise && current.enPrise) events.push({ before: beforeSquare, after: afterSquare, sign: "preserved" });
  }
  return Object.freeze(events);
}

interface Edge { readonly beforeFen: string; readonly moveUci: string; readonly afterFen: string }
function edge(beforeFen: string, moveUci: string): Edge { return Object.freeze({ beforeFen, moveUci, afterFen: playedFen(beforeFen, moveUci) }); }

function immediateTrade(first: Edge, second: Edge): boolean {
  if (first.afterFen !== second.beforeFen) return false;
  const leftPosition = researchPosition(first.beforeFen);
  const rightPosition = researchPosition(second.beforeFen);
  const left = parseUci(first.moveUci);
  const right = parseUci(second.moveUci);
  return left !== undefined && right !== undefined && "from" in left && "from" in right &&
    captureAt(leftPosition, left) !== undefined && captureAt(rightPosition, right) !== undefined &&
    left.to === right.to;
}

function discoveredExecuted(beforeFen: string, moveUci: string): boolean {
  const parsed = parseUci(moveUci);
  if (parsed === undefined || !("from" in parsed)) return false;
  const afterFen = playedFen(beforeFen, moveUci);
    const after = researchPosition(afterFen);
  const latency = discoveredLatencyReading(beforeFen).screens;
  const rays = transitionSemanticFacts(beforeFen, moveUci, afterFen).filter((fact) => fact.family === "slider_ray" && fact.sign === "gained");
  return latency.some((relation) => {
    if (relation.screen.square !== makeSquare(parsed.from)) return false;
    const sliderSquare = relation.slider.square;
    const targetSquare = relation.target.square;
    const sliderIndex = parseSquare(sliderSquare)!;
    const targetIndex = parseSquare(targetSquare)!;
    const slider = after.board.get(sliderIndex);
    if (slider?.color !== relation.slider.piece.color || slider.role !== relation.slider.piece.role) return false;
    const target = after.board.get(targetIndex);
    if (target?.color !== relation.target.occupant.color || target.role !== relation.target.occupant.role) return false;
    return rays.some((ray) => ray.family === "slider_ray" && ray.subject.slider === sliderSquare && ray.targets_before.includes(relation.screen.square) && ray.targets_after.includes(targetSquare));
  });
}

type Availability = { readonly kind: "available"; readonly value: boolean } | { readonly kind: "unavailable"; readonly reason: "invalid_turn_clone" };
function passPromotionAvailability(afterFen: string, pawn: Square, mover: Color): Availability {
  const position = researchPosition(afterFen);
  const clone = Chess.fromSetup({ ...position.toSetup(), turn: mover, epSquare: undefined });
  if (!clone.isOk) return Object.freeze({ kind: "unavailable", reason: "invalid_turn_clone" });
  if (clone.value.board.getColor(pawn) !== mover || clone.value.board.getRole(pawn) !== "pawn") return Object.freeze({ kind: "available", value: false });
  const value = [...clone.value.allDests()].some(([from, destinations]) => from === pawn && [...destinations].some((to) => to < 8 || to >= 56));
  return Object.freeze({ kind: "available", value });
}

function seventhRankRooks(fen: string, color: Color) {
  const position = researchPosition(fen);
  const rank = color === "white" ? 6 : 1;
  const enemy = opposite(color);
  const backRank = enemy === "white" ? 0 : 7;
  return [...position.board.pieces(color, "rook")].filter((square) => Math.floor(square / 8) === rank).map((square) => Object.freeze({
    rook: makeSquare(square),
    enemyKingOnBackRank: position.board.kingOf(enemy) !== undefined && Math.floor(position.board.kingOf(enemy)! / 8) === backRank,
    enemyPawnsOnSeventh: Object.freeze([...position.board.pieces(enemy, "pawn")].filter((pawn) => Math.floor(pawn / 8) === rank).map(makeSquare).sort()),
  }));
}

describe("Wave-A returned contract boundaries", () => {
  it("separates adjacent-file connected pawns from directed support chains and retains multiple bases", () => {
    const branched = pawnConnectivity("4k3/8/8/8/8/3P4/2P1P3/4K3 w - - 0 1", "white");
    expect(branched.supportEdges).toEqual([["c2", "d3"], ["e2", "d3"]]);
    expect(branched.chains).toEqual([{ members: ["c2", "d3", "e2"], bases: ["c2", "e2"] }]);
    const duo = pawnConnectivity("4k3/8/8/8/2PP4/8/8/4K3 w - - 0 1", "white");
    expect(duo.adjacentFilePairs).toEqual([["c4", "d4"]]);
    expect(duo.supportEdges).toEqual([]);
    expect(duo.chains).toEqual([]);
  });

  it("counts occupied-file islands and never splits doubled pawns", () => {
    const state = pawnConnectivity("4k3/8/8/8/8/P7/P1P5/4K3 w - - 0 1", "white");
    expect(state.islands).toEqual([["a2", "a3"], ["c2"]]);
  });

  it("retains rook-on-seventh as a state even when both relevance operands are empty", () => {
    expect(seventhRankRooks("8/3R4/8/4k3/8/8/8/4K3 w - - 0 1", "white")).toEqual([
      { rook: "d7", enemyKingOnBackRank: false, enemyPawnsOnSeventh: [] },
    ]);
  });

  it("defines trade completion as the immediately adjacent capture-recapture pair", () => {
    const first = edge("4k3/8/4p3/3p4/4P3/8/8/4K3 w - - 0 1", "e4d5");
    const reply = edge(first.afterFen, "e6d5");
    expect(immediateTrade(first, reply)).toBe(true);

    const delay1 = edge(first.afterFen, "e8f7");
    const delay2 = edge(delay1.afterFen, "e1f2");
    const late = edge(delay2.afterFen, "e6d5");
    expect(immediateTrade(first, late)).toBe(false);
  });

  it("compares mover-owned loose-piece state on both sides of the edge", () => {
    expect(loosePieceSigns("4r1k1/8/8/8/8/8/3Q4/6K1 w - - 0 1", "d2e2")).toContainEqual({ before: "d2", after: "e2", sign: "gained" });
    expect(loosePieceSigns("3r2k1/8/8/8/8/8/3Q4/6K1 w - - 0 1", "d2e2")).toContainEqual({ before: "d2", after: "e2", sign: "lost" });
  });

  it("requires the before-state latency relation for discovered execution", () => {
    expect(discoveredExecuted("7k/8/8/8/4r3/5N2/6B1/7K w - - 0 1", "f3h4")).toBe(true);
    expect(discoveredExecuted("7k/8/8/8/4r3/5n2/6B1/7K b - - 0 1", "f3h4")).toBe(false);
  });

  it("keeps promotion geometry when a checking move makes pass availability unavailable", () => {
    const quiet = playedFen("7k/8/P7/8/8/8/8/7K w - - 0 1", "a6a7");
    expect(passPromotionAvailability(quiet, 48, "white")).toEqual({ kind: "available", value: true });
    const checking = playedFen("7k/8/6P1/8/8/8/8/7K w - - 0 1", "g6g7");
    expect(passPromotionAvailability(checking, 54, "white")).toEqual({ kind: "unavailable", reason: "invalid_turn_clone" });
  });
});
