// DISPOSABLE research harness — D872/Wave C Stage 2. Not production detector code.
import { writeFileSync } from "node:fs";

import { attacks, between } from "chessops/attacks";
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
  authoredRows,
  importedRows,
  legalOutcomes,
  playedFen,
  type ResearchRow,
} from "../research-chess/populations.js";

const OUTPUT = new URL("./counterfactual-output.md", import.meta.url).pathname;

interface Duty {
  readonly defender: Square;
  readonly defenderRole: Role;
  readonly target: Square;
  readonly targetRole: Role;
  readonly color: Color;
}

interface TargetWitness {
  readonly target: Square;
  readonly targetRole: Role;
  readonly targetColor: Color;
  readonly attacker?: Square;
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

function parsed(row: ResearchRow) {
  const pos = researchPosition(row.parentFen);
  const move = parseUci(row.uci);
  if (move === undefined || !("from" in move) || !pos.isLegal(move)) return undefined;
  return { pos, move };
}

function unique(witnesses: readonly TargetWitness[]): readonly TargetWitness[] {
  const result = new Map<string, TargetWitness>();
  for (const witness of witnesses) {
    const key = `${witness.target}:${witness.targetRole}:${witness.targetColor}:${witness.attacker ?? "any"}`;
    result.set(key, witness);
  }
  return [...result.values()];
}

function removalInitiations(row: ResearchRow): readonly TargetWitness[] {
  const value = parsed(row);
  if (value === undefined) return [];
  const defendedColor = opposite(value.pos.turn);
  const captured = captureAt(value.pos, value.move);
  if (captured === undefined) return [];
  const after = researchPosition(row.fen);
  return unique(duties(row.parentFen, defendedColor).filter((duty) =>
    duty.defender === value.move.to && duty.defenderRole === captured.role &&
    after.board.getColor(duty.target) === duty.color && after.board.getRole(duty.target) === duty.targetRole)
    .map((duty) => ({ target: duty.target, targetRole: duty.targetRole, targetColor: duty.color })));
}

function clearanceInitiations(row: ResearchRow): readonly TargetWitness[] {
  const value = parsed(row);
  if (value === undefined) return [];
  const blocker = value.pos.board.get(value.move.from);
  if (blocker === undefined || blocker.color !== value.pos.turn) return [];
  const after = researchPosition(row.fen);
  const result: TargetWitness[] = [];
  for (const [slider, piece] of value.pos.board) {
    if (piece.color !== value.pos.turn || !["bishop", "rook", "queen"].includes(piece.role)) continue;
    for (const [target, victim] of value.pos.board) {
      if (victim.color === piece.color || victim.role === "king") continue;
      const span = between(slider, target);
      if (!span.has(value.move.from)) continue;
      const occupied = [...span.intersect(value.pos.board.occupied)];
      if (occupied.length !== 1 || occupied[0] !== value.move.from) continue;
      if (after.board.getColor(slider) !== piece.color || after.board.getRole(slider) !== piece.role ||
        after.board.getColor(target) !== victim.color || after.board.getRole(target) !== victim.role) continue;
      if (attacks(piece, slider, after.board.occupied).has(target)) {
        result.push({ target, targetRole: victim.role, targetColor: victim.color, attacker: slider });
      }
    }
  }
  return unique(result);
}

function interferenceInitiations(row: ResearchRow): readonly TargetWitness[] {
  const value = parsed(row);
  if (value === undefined) return [];
  const defendedColor = opposite(value.pos.turn);
  const after = researchPosition(row.fen);
  const result: TargetWitness[] = [];
  for (const duty of duties(row.parentFen, defendedColor)) {
    if (!["bishop", "rook", "queen"].includes(duty.defenderRole) ||
      !between(duty.defender, duty.target).has(value.move.to)) continue;
    if (after.board.getColor(duty.target) !== duty.color || after.board.getRole(duty.target) !== duty.targetRole) continue;
    const preserved = duties(row.fen, defendedColor).some((next) =>
      next.defender === duty.defender && next.defenderRole === duty.defenderRole &&
      next.target === duty.target && next.targetRole === duty.targetRole);
    if (!preserved) result.push({ target: duty.target, targetRole: duty.targetRole, targetColor: duty.color });
  }
  return unique(result);
}

function targetCaptureAvailable(fen: string, witness: TargetWitness): boolean {
  const pos = researchPosition(fen);
  if (pos.board.getColor(witness.target) !== witness.targetColor ||
    pos.board.getRole(witness.target) !== witness.targetRole) return false;
  return legalCaptureMovesTo(pos, witness.target, witness.attacker)
    .some((move) => (legalExchangeForMove(pos, move) ?? 0) > 0);
}

function survivesEveryReply(afterFen: string, witness: TargetWitness): boolean {
  const replies = legalOutcomes(afterFen);
  return replies.length > 0 && replies.every((reply) => targetCaptureAvailable(reply.fen, witness));
}

function row(fen: string, uci: string): ResearchRow {
  return { id: "fixture", parentFen: fen, uci, fen: playedFen(fen, uci) };
}

function measure(rows: readonly ResearchRow[]) {
  const families = [
    { name: "defender_removed", find: removalInitiations },
    { name: "clearance", find: clearanceInitiations },
    { name: "interference", find: interferenceInitiations },
  ] as const;
  return families.map((family) => {
    let rowsWithInitiation = 0;
    let witnesses = 0;
    let allReplyRows = 0;
    let allReplyWitnesses = 0;
    const examples: string[] = [];
    for (const candidate of rows) {
      const found = family.find(candidate);
      if (found.length === 0) continue;
      rowsWithInitiation += 1;
      witnesses += found.length;
      const surviving = found.filter((witness) => survivesEveryReply(candidate.fen, witness));
      if (surviving.length > 0) {
        allReplyRows += 1;
        allReplyWitnesses += surviving.length;
        if (examples.length < 6) examples.push(`${candidate.id}:${candidate.uci}`);
      }
    }
    return { name: family.name, rowsWithInitiation, witnesses, allReplyRows, allReplyWitnesses, examples };
  });
}

describe("D872 one-reply semantic consequence boundary", () => {
  it("pins a named target that survives every reply and one that can escape", () => {
    const stable = row("4k3/4n3/8/3P4/8/8/8/4R2K w - - 0 1", "d5d6");
    expect(survivesEveryReply(stable.fen, { target: 52, targetRole: "knight", targetColor: "black", attacker: 43 })).toBe(true);
    const escapes = row("7k/4n3/8/3P4/8/8/8/7K w - - 0 1", "d5d6");
    expect(survivesEveryReply(escapes.fen, { target: 52, targetRole: "knight", targetColor: "black", attacker: 43 })).toBe(false);
  });

  it("recognizes the exact initiating operand without implying all-reply survival", () => {
    const removed = row("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", "c5b6");
    expect(removalInitiations(removed).length).toBeGreaterThan(0);
    const clearance = row("q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", "a4b6");
    expect(clearanceInitiations(clearance).length).toBeGreaterThan(0);
    const interference = row("r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", "b6a6");
    expect(interferenceInitiations(interference).length).toBeGreaterThan(0);
  });

  it("measures how often played initiations support an all-reply live claim", () => {
    const lines = [
      "# D872 Stage-2 complete-one-reply census",
      "",
      "An initiation is exact geometry/identity. An all-reply witness requires the same target and a positive legal capture after every legal opponent reply. It does not establish best play, force beyond one reply, intent, or whole-position value.",
      "",
    ];
    for (const population of [
      { name: "authored played edges", rows: authoredRows() },
      { name: "sealed imported played edges", rows: importedRows() },
    ]) {
      lines.push(`## ${population.name}`, "", "| family | initiating rows / witnesses | all-reply rows / witnesses | examples |", "|---|---:|---:|---|");
      for (const result of measure(population.rows)) {
        lines.push(`| \`${result.name}\` | ${result.rowsWithInitiation} / ${result.witnesses} | ${result.allReplyRows} / ${result.allReplyWitnesses} | ${result.examples.join(", ") || "none"} |`);
      }
      lines.push("");
    }
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");
  });
});
