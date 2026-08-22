// DISPOSABLE research harness — D872/Wave C Stage 1. Not production detector code.
import { writeFileSync } from "node:fs";

import { attacks, between } from "chessops/attacks";
import { Chess } from "chessops/chess";
import type { Color, Role, Square } from "chessops/types";
import { opposite, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import {
  captureAt,
  legalCaptureMovesTo,
  legalExchangeForMove,
  researchPosition,
} from "../research-chess/legal-exchange.js";
import {
  authoredTriples,
  importedPopulation,
  pathTriples,
  playedFen,
  type ResearchRow,
  type ResearchTriple,
} from "../research-chess/populations.js";

const OUTPUT = new URL("./sequence-output.md", import.meta.url).pathname;
type ResearchQuad = readonly [ResearchRow, ResearchRow, ResearchRow, ResearchRow];

interface Duty {
  readonly defender: Square;
  readonly defenderRole: Role;
  readonly target: Square;
  readonly targetRole: Role;
  readonly color: Color;
}

function duties(fen: string, color: Color): readonly Duty[] {
  const pos = researchPosition(fen);
  const result: Duty[] = [];
  for (const [defender, piece] of pos.board) {
    if (piece.color !== color) continue;
    for (const target of attacks(piece, defender, pos.board.occupied)) {
      const protectedPiece = pos.board.get(target);
      if (protectedPiece?.color !== color || protectedPiece.role === "king") continue;
      result.push({ defender, defenderRole: piece.role, target, targetRole: protectedPiece.role, color });
    }
  }
  return result;
}

function parsedRow(row: ResearchRow) {
  const pos = researchPosition(row.parentFen);
  const move = parseUci(row.uci);
  if (move === undefined || !("from" in move) || !pos.isLegal(move)) return undefined;
  return { pos, move };
}

function capturesExpected(row: ResearchRow, square: Square, color: Color, role: Role): boolean {
  const parsed = parsedRow(row);
  if (parsed === undefined || parsed.move.to !== square) return false;
  const captured = captureAt(parsed.pos, parsed.move);
  return captured?.color === color && captured.role === role;
}

function positiveExpectedCapture(row: ResearchRow, square: Square, color: Color, role: Role, from?: Square): boolean {
  const parsed = parsedRow(row);
  if (parsed === undefined || parsed.move.to !== square || from !== undefined && parsed.move.from !== from) return false;
  const captured = captureAt(parsed.pos, parsed.move);
  return captured?.color === color && captured.role === role && (legalExchangeForMove(parsed.pos, parsed.move) ?? 0) > 0;
}

function defenderRemovedSequence(triple: ResearchTriple): boolean {
  const before = researchPosition(triple[0].parentFen);
  const defendedColor = opposite(before.turn);
  return duties(triple[0].parentFen, defendedColor).some((duty) =>
    capturesExpected(triple[0], duty.defender, duty.color, duty.defenderRole) &&
    positiveExpectedCapture(triple[2], duty.target, duty.color, duty.targetRole));
}

function defenderRelocatedSequence(triple: ResearchTriple): boolean {
  const before = researchPosition(triple[0].parentFen);
  const defendedColor = opposite(before.turn);
  const first = parsedRow(triple[0]);
  const reply = parsedRow(triple[1]);
  if (first === undefined || reply === undefined) return false;
  for (const duty of duties(triple[0].parentFen, defendedColor)) {
    if (reply.move.from !== duty.defender) continue;
    const defender = reply.pos.board.get(reply.move.from);
    if (defender?.color !== duty.color || defender.role !== duty.defenderRole) continue;
    const alreadyCapturable = legalCaptureMovesTo(before, duty.defender)
      .some((move) => (legalExchangeForMove(before, move) ?? 0) > 0);
    if (alreadyCapturable) continue;
    const afterFirst = researchPosition(triple[0].fen);
    if (afterFirst.board.getColor(duty.target) !== duty.color ||
      afterFirst.board.getRole(duty.target) !== duty.targetRole) continue;
    const attackerTurnResult = Chess.fromSetup({ ...afterFirst.toSetup(), turn: before.turn, epSquare: undefined });
    if (!attackerTurnResult.isOk) continue;
    const attackerTurn = attackerTurnResult.value;
    const newlyAttacked = legalCaptureMovesTo(attackerTurn, duty.defender)
      .some((move) => (legalExchangeForMove(attackerTurn, move) ?? 0) > 0);
    if (!newlyAttacked) continue;
    const afterReply = researchPosition(triple[1].fen);
    if (afterReply.board.getColor(reply.move.to) !== duty.color ||
      afterReply.board.getRole(reply.move.to) !== duty.defenderRole) continue;
    const stillDefends = duties(triple[1].fen, duty.color).some((next) =>
      next.defender === reply.move.to && next.defenderRole === duty.defenderRole &&
      next.target === duty.target && next.targetRole === duty.targetRole);
    if (!stillDefends && afterReply.board.getColor(duty.target) === duty.color &&
      positiveExpectedCapture(triple[2], duty.target, duty.color, duty.targetRole)) return true;
  }
  return false;
}

function overloadExploitationSequence(triple: ResearchTriple): boolean {
  const before = researchPosition(triple[0].parentFen);
  const defendedColor = opposite(before.turn);
  const reply = parsedRow(triple[1]);
  if (reply === undefined) return false;
  const grouped = new Map<string, Duty[]>();
  for (const duty of duties(triple[0].parentFen, defendedColor)) {
    const key = `${duty.defender}:${duty.defenderRole}`;
    const found = grouped.get(key) ?? [];
    found.push(duty);
    grouped.set(key, found);
  }
  for (const group of grouped.values()) {
    const firstTarget = group.find((duty) => capturesExpected(triple[0], duty.target, duty.color, duty.targetRole));
    if (firstTarget === undefined || reply.move.from !== firstTarget.defender || reply.move.to !== firstTarget.target) continue;
    const recaptured = captureAt(reply.pos, reply.move);
    if (recaptured?.color !== before.turn) continue;
    for (const secondTarget of group) {
      if (secondTarget.target === firstTarget.target) continue;
      if (positiveExpectedCapture(triple[2], secondTarget.target, secondTarget.color, secondTarget.targetRole)) return true;
    }
  }
  return false;
}

function clearanceSequence(triple: ResearchTriple): boolean {
  const first = parsedRow(triple[0]);
  const third = parsedRow(triple[2]);
  if (first === undefined || third === undefined) return false;
  const blocker = first.pos.board.get(first.move.from);
  if (blocker === undefined || blocker.color !== first.pos.turn) return false;
  for (const [slider, piece] of first.pos.board) {
    if (piece.color !== first.pos.turn || !["bishop", "rook", "queen"].includes(piece.role)) continue;
    for (const [target, victim] of first.pos.board) {
      if (victim.color === piece.color || victim.role === "king") continue;
      const span = between(slider, target);
      if (!span.has(first.move.from)) continue;
      const occupied = [...span.intersect(first.pos.board.occupied)];
      if (occupied.length !== 1 || occupied[0] !== first.move.from) continue;
      const afterFirst = researchPosition(triple[0].fen);
      if (!attacks(piece, slider, afterFirst.board.occupied).has(target)) continue;
      if (positiveExpectedCapture(triple[2], target, victim.color, victim.role, slider)) return true;
    }
  }
  return false;
}

function interferenceSequence(triple: ResearchTriple): boolean {
  const first = parsedRow(triple[0]);
  if (first === undefined) return false;
  const defendedColor = opposite(first.pos.turn);
  for (const duty of duties(triple[0].parentFen, defendedColor)) {
    if (!["bishop", "rook", "queen"].includes(duty.defenderRole)) continue;
    const span = between(duty.defender, duty.target);
    if (!span.has(first.move.to)) continue;
    const afterFirst = researchPosition(triple[0].fen);
    const stillDefends = duties(triple[0].fen, defendedColor).some((next) =>
      next.defender === duty.defender && next.target === duty.target && next.targetRole === duty.targetRole);
    if (stillDefends || afterFirst.board.getColor(duty.target) !== defendedColor) continue;
    if (positiveExpectedCapture(triple[2], duty.target, duty.color, duty.targetRole)) return true;
  }
  return false;
}

function checkZwischenzugSequence(quad: ResearchQuad): boolean {
  const initial = parsedRow(quad[0]);
  const betweenMove = parsedRow(quad[1]);
  const finalMove = parsedRow(quad[3]);
  if (initial === undefined || betweenMove === undefined || finalMove === undefined) return false;
  const captured = captureAt(initial.pos, initial.move);
  if (captured === undefined) return false;
  const recapturers = legalCaptureMovesTo(researchPosition(quad[0].fen), initial.move.to).map((move) => "from" in move ? move.from : undefined);
  if (recapturers.length === 0 || betweenMove.move.to === initial.move.to) return false;
  if (!researchPosition(quad[1].fen).isCheck()) return false;
  return finalMove.move.to === initial.move.to && recapturers.includes(finalMove.move.from) &&
    (legalExchangeForMove(finalMove.pos, finalMove.move) ?? 0) > 0;
}

function rowsFromMoves(fen: string, moves: readonly string[]): readonly ResearchRow[] {
  const result: ResearchRow[] = [];
  let current = fen;
  for (const [index, uci] of moves.entries()) {
    const next = playedFen(current, uci);
    result.push({ id: `fixture#${index + 1}`, parentFen: current, fen: next, uci });
    current = next;
  }
  return result;
}

function triple(fen: string, moves: readonly [string, string, string]): ResearchTriple {
  return rowsFromMoves(fen, moves) as ResearchTriple;
}

function quad(fen: string, moves: readonly [string, string, string, string]): ResearchQuad {
  return rowsFromMoves(fen, moves) as ResearchQuad;
}

function pathQuads(paths: readonly (readonly ResearchRow[])[]): readonly ResearchQuad[] {
  const result: ResearchQuad[] = [];
  for (const path of paths) for (let index = 0; index + 3 < path.length; index += 1) {
    result.push([path[index]!, path[index + 1]!, path[index + 2]!, path[index + 3]!]);
  }
  return result;
}

describe("D872 exact observed semantic-tactic prerequisites", () => {
  it("pins defender removal, relocation and overload exploitation as different facts", () => {
    const removed = triple("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", ["c5b6", "e8d7", "a1a8"]);
    expect(defenderRemovedSequence(removed)).toBe(true);
    expect(defenderRelocatedSequence(removed)).toBe(false);
    expect(overloadExploitationSequence(removed)).toBe(false);

    const relocated = triple("r3k3/8/1n6/8/2P5/8/8/R3K3 w - - 0 1", ["c4c5", "b6d7", "a1a8"]);
    expect(defenderRelocatedSequence(relocated)).toBe(true);
    expect(defenderRemovedSequence(relocated)).toBe(false);

    const overloaded = triple("1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
    expect(overloadExploitationSequence(overloaded)).toBe(true);
    const oneDuty = triple("1B5k/r3q3/1n6/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "b6a8", "e1e7"]);
    expect(overloadExploitationSequence(oneDuty)).toBe(false);
  });

  it("separates clearance and interference from an unrelated capture sequence", () => {
    const clearance = triple("q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", ["a4b6", "e8f7", "a1a8"]);
    expect(clearanceSequence(clearance)).toBe(true);
    expect(interferenceSequence(clearance)).toBe(false);
    const notClearance = triple("q3k3/8/1N6/8/8/8/8/R3K3 w - - 0 1", ["b6c4", "e8d7", "a1a8"]);
    expect(clearanceSequence(notClearance)).toBe(false);

    const interference = triple("r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", ["b6a6", "e8d7", "a6a5"]);
    expect(interferenceSequence(interference)).toBe(true);
    expect(clearanceSequence(interference)).toBe(false);
    const notInterference = triple("r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", ["b6b5", "e8d7", "b5a5"]);
    expect(interferenceSequence(notInterference)).toBe(false);
  });

  it("admits a check zwischenzug while rejecting a merely delayed recapture", () => {
    const positive = quad("4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", ["b4c3", "d1h5", "e8f8", "b2c3"]);
    expect(checkZwischenzugSequence(positive)).toBe(true);
    const quiet = quad("4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", ["b4c3", "d1g4", "e8f8", "b2c3"]);
    expect(checkZwischenzugSequence(quiet)).toBe(false);
  });

  it("censuses exact observed candidates without claiming force or intent", () => {
    const imported = importedPopulation();
    const populations = [
      { name: "authored branch paths", triples: authoredTriples() },
      { name: "sealed imported games", triples: pathTriples(imported.paths) },
    ];
    const lines = [
      "# D872 Stage-1 sequence census",
      "",
      "These are exact observed line shapes under the harness conventions. They do not establish force, best play, intent, or whole-position value.",
      "",
      "| population | triples | defender removed | defender relocated | overload exploited | clearance | interference |",
      "|---|---:|---:|---:|---:|---:|---:|",
    ];
    for (const population of populations) {
      const counts = { removed: 0, relocated: 0, overload: 0, clearance: 0, interference: 0 };
      for (const value of population.triples) {
        if (defenderRemovedSequence(value)) counts.removed += 1;
        if (defenderRelocatedSequence(value)) counts.relocated += 1;
        if (overloadExploitationSequence(value)) counts.overload += 1;
        if (clearanceSequence(value)) counts.clearance += 1;
        if (interferenceSequence(value)) counts.interference += 1;
      }
      lines.push(`| ${population.name} | ${population.triples.length} | ${counts.removed} | ${counts.relocated} | ${counts.overload} | ${counts.clearance} | ${counts.interference} |`);
    }
    const quads = pathQuads(imported.paths);
    const checks = quads.filter(checkZwischenzugSequence).length;
    lines.push("", `Imported consecutive quads: ${quads.length}; exact check-zwischenzug sequences: ${checks}.`, "");
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");
    expect(populations[0]!.triples.length).toBeGreaterThan(500);
    expect(populations[1]!.triples.length).toBeGreaterThan(6_000);
  });
});
