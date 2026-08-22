// DISPOSABLE research harness — D872/Wave C overload response-conflict arm. Not production code.
import { writeFileSync } from "node:fs";

import { attacks } from "chessops/attacks";
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
  importedPopulation,
  legalOutcomes,
  playedFen,
  type ResearchRow,
} from "../research-chess/populations.js";

const OUTPUT = new URL("./overload-response-output.md", import.meta.url).pathname;

interface Duty {
  readonly defender: Square;
  readonly defenderRole: Role;
  readonly target: Square;
  readonly targetRole: Role;
  readonly color: Color;
}

interface ConflictWitness {
  readonly defender: Square;
  readonly defenderRole: Role;
  readonly capturedTarget: Square;
  readonly retainedTargets: readonly Square[];
  readonly legalRecaptures: number;
}

function duties(fen: string, color: Color): readonly Duty[] {
  const pos = researchPosition(fen);
  const result: Duty[] = [];
  for (const [defender, piece] of pos.board) {
    if (piece.color !== color) continue;
    for (const target of attacks(piece, defender, pos.board.occupied)) {
      const protectedPiece = pos.board.get(target);
      if (protectedPiece?.color === color && protectedPiece.role !== "king") {
        result.push({ defender, defenderRole: piece.role, target, targetRole: protectedPiece.role, color });
      }
    }
  }
  return result;
}

function preservesDuty(fen: string, from: Square, role: Role, target: Duty): boolean {
  return duties(fen, target.color).some((duty) =>
    duty.defender === from && duty.defenderRole === role &&
    duty.target === target.target && duty.targetRole === target.targetRole);
}

function soleDuty(all: readonly Duty[], duty: Duty): boolean {
  return all.filter((candidate) => candidate.target === duty.target &&
    candidate.targetRole === duty.targetRole && candidate.color === duty.color).length === 1;
}

function positiveTargetCapture(fen: string, target: Duty): boolean {
  const pos = researchPosition(fen);
  if (pos.board.getColor(target.target) !== target.color ||
    pos.board.getRole(target.target) !== target.targetRole) return false;
  return legalCaptureMovesTo(pos, target.target)
    .some((candidate) => (legalExchangeForMove(pos, candidate) ?? 0) > 0);
}

function responseConflicts(row: ResearchRow, strict: boolean): readonly ConflictWitness[] {
  const before = researchPosition(row.parentFen);
  const move = parseUci(row.uci);
  if (move === undefined || !("from" in move) || !before.isLegal(move)) return [];
  const captured = captureAt(before, move);
  const defendedColor = opposite(before.turn);
  if (captured?.color !== defendedColor || captured.role === "king") return [];
  const after = researchPosition(row.fen);
  const attackingPiece = after.board.get(move.to);
  if (attackingPiece?.color !== before.turn) return [];

  const beforeDuties = duties(row.parentFen, defendedColor);
  const result: ConflictWitness[] = [];
  for (const first of beforeDuties) {
    if (first.target !== move.to || first.targetRole !== captured.role || strict && !soleDuty(beforeDuties, first)) continue;
    if (after.board.getColor(first.defender) !== defendedColor ||
      after.board.getRole(first.defender) !== first.defenderRole) continue;
    const retained = beforeDuties.filter((duty) =>
      duty.defender === first.defender && duty.defenderRole === first.defenderRole &&
      duty.target !== first.target &&
      (!strict || soleDuty(beforeDuties, duty)) &&
      after.board.getColor(duty.target) === duty.color && after.board.getRole(duty.target) === duty.targetRole);
    if (retained.length === 0) continue;

    const recaptures = legalOutcomes(row.fen).flatMap((reply) => {
      const response = parseUci(reply.uci);
      if (response === undefined || !("from" in response) || response.from !== first.defender || response.to !== move.to) return [];
      const responsePosition = researchPosition(row.fen);
      const responseCapture = captureAt(responsePosition, response);
      return responseCapture?.color === before.turn && responseCapture.role === attackingPiece.role
        ? [{ reply, response }]
        : [];
    });
    if (recaptures.length === 0) continue;
    const preservesAll = recaptures.some(({ reply, response }) => retained.every((duty) =>
      preservesDuty(reply.fen, response.to, first.defenderRole, duty)));
    const everyRecaptureExposes = !strict || recaptures.every(({ reply }) => retained.some((duty) =>
      positiveTargetCapture(reply.fen, duty)));
    if (!preservesAll && everyRecaptureExposes) result.push({
      defender: first.defender,
      defenderRole: first.defenderRole,
      capturedTarget: first.target,
      retainedTargets: Object.freeze(retained.map((duty) => duty.target)),
      legalRecaptures: recaptures.length,
    });
  }
  return Object.freeze(result);
}

export function overloadResponseConflicts(row: ResearchRow): readonly ConflictWitness[] {
  return responseConflicts(row, true);
}

function broadDutyEdgeConflicts(row: ResearchRow): readonly ConflictWitness[] {
  return responseConflicts(row, false);
}

function row(fen: string, uci: string): ResearchRow {
  return { id: "fixture", parentFen: fen, uci, fen: playedFen(fen, uci) };
}

function census(name: string, rows: readonly ResearchRow[]) {
  let broadRows = 0;
  let firingRows = 0;
  let witnesses = 0;
  const examples: string[] = [];
  for (const candidate of rows) {
    if (broadDutyEdgeConflicts(candidate).length > 0) broadRows += 1;
    const found = overloadResponseConflicts(candidate);
    if (found.length === 0) continue;
    firingRows += 1;
    witnesses += found.length;
    if (examples.length < 12) examples.push(`${candidate.id}:${candidate.uci}`);
  }
  return { name, rows: rows.length, broadRows, firingRows, witnesses, examples };
}

describe("D872 exact overloaded-defender response conflict", () => {
  it("separates a real two-duty conflict from one duty and a recapture preserving the other duty", () => {
    const conflict = row("1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", "b8a7");
    expect(overloadResponseConflicts(conflict)).toHaveLength(1);

    const oneDuty = row("1B5k/r3q3/1n6/8/8/8/8/4R1K1 w - - 0 1", "b8a7");
    expect(overloadResponseConflicts(oneDuty)).toHaveLength(0);

    const alternateDefender = row("1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", "b8a7");
    expect(overloadResponseConflicts(alternateDefender)).toHaveLength(0);

    const preserves = row("7k/3q4/8/1B1r4/8/8/8/3b3K w - - 0 1", "b5d7");
    expect(overloadResponseConflicts(preserves)).toHaveLength(0);
  });

  it("measures the exact conflict without claiming the move wins or is forced", () => {
    const imported = importedPopulation().paths.flat();
    const populations = [
      census("authored played edges", authoredRows()),
      census("sealed imported played edges", imported),
    ];
    const lines = [
      "# D872 overloaded-defender response-conflict output",
      "",
      "The candidate captures one target for which a same-piece multi-duty defender is the sole defender. That defender has at least one legal recapture of the candidate; none preserves every other surviving sole duty, and every such recapture leaves at least one named target positively capturable. This is an exact response conflict, not a claim that the candidate is best, forced, sound or winning.",
      "",
      "| population | played edges | broad lost-duty-edge rows (rejected) | sole-duty + positive-consequence rows | exact witnesses | examples |",
      "|---|---:|---:|---:|---:|---|",
      ...populations.map((value) => `| ${value.name} | ${value.rows} | ${value.broadRows} | ${value.firingRows} | ${value.witnesses} | ${value.examples.join(", ") || "none"} |`),
      "",
      "The ordinary positional operand remains `multiple duties`. This stronger event earns only: the same sole defender cannot recapture this candidate without leaving a named sole-defended target positively capturable. An observed later exploitation, all-opponent-reply material consequence or engine verdict is a separate projection.",
      "",
    ];
    writeFileSync(OUTPUT, lines.join("\n"), "utf8");

    expect(populations[0]!.rows).toBeGreaterThan(700);
    expect(populations[1]!.rows).toBeGreaterThan(6_000);
  });
});
