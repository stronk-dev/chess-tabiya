import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { declareOverloadedDefenderConflictEvidence } from "./evidence-source-adapters.js";
import { localSemanticEvents } from "./semantic-evidence.js";
import { defenderDutyReading, defenderDutyRelocatedEvents, defenderRemovedEvents, overloadedDefenderResponseConflict } from "./tactics.js";
import { transitionSemanticFacts } from "./transition.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

describe("semantic tactic anchors", () => {
  it("retains exact duties and co-defenders while refusing king targets", () => {
    const reading = defenderDutyReading("r3k3/8/1n6/8/8/8/8/R3K3 w - - 0 1");
    expect(reading.duties).toContainEqual(expect.objectContaining({
      defender: expect.objectContaining({ square: "b6" }),
      target: expect.objectContaining({ square: "a8" }),
      coDefenders: [],
    }));
    expect(reading.duties.some((duty) => duty.target.piece.role === "king")).toBe(false);

    const shared = defenderDutyReading("rq2k3/8/1n6/8/8/8/8/4K3 w - - 0 1");
    const rookDuty = shared.duties.find((duty) => duty.defender.square === "b8" && duty.target.square === "a8");
    expect(rookDuty?.coDefenders).toContainEqual(expect.objectContaining({ square: "b6" }));
  });

  it("joins defender removal to the exact capture and retained target", () => {
    const fen = "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1";
    const next = after(fen, "c5b6");
    const capture = transitionSemanticFacts(fen, "c5b6", next).find((fact) => fact.family === "capture");
    expect(defenderRemovedEvents(fen, "c5b6", next, capture)).toContainEqual(expect.objectContaining({
      defender: expect.objectContaining({ square: "b6", piece: expect.objectContaining({ role: "knight" }) }),
      target: expect.objectContaining({ square: "a8", piece: expect.objectContaining({ role: "rook" }) }),
      lostDuty: expect.objectContaining({ conventionId: "defence-duty@1" }),
    }));
    expect(defenderRemovedEvents(fen, "c5b6", next, undefined)).toEqual([]);
    expect(localSemanticEvents(fen, "c5b6", next).some((event) => event.projection.id === "rules.tactic.event.defender_removed" && event.operands === event.evidence.payload)).toBe(true);
  });

  it("distinguishes a same-piece relocation that loses its duty", () => {
    const initial = "r3k3/8/1n6/8/2P5/8/8/R3K3 w - - 0 1";
    const before = after(initial, "c4c5");
    const next = after(before, "b6d7");
    expect(defenderDutyRelocatedEvents(before, "b6d7", next)).toContainEqual(expect.objectContaining({
      defenderBefore: expect.objectContaining({ square: "b6" }),
      defenderAfter: expect.objectContaining({ square: "d7" }),
      target: expect.objectContaining({ square: "a8" }),
    }));
    expect(localSemanticEvents(before, "b6d7", next).some((event) => event.projection.id === "rules.tactic.event.defender_duty_relocated" && event.operands === event.evidence.payload)).toBe(true);

    const retainedInitial = "4k3/8/1n6/8/8/8/8/4K3 b - - 0 1";
    const retainedNext = after(retainedInitial, "b6c8");
    expect(defenderDutyRelocatedEvents(retainedInitial, "b6c8", retainedNext)).toEqual([]);
  });

  it("separates strict overload response conflict from broad multi-duty geometry", () => {
    const conflictFen = "1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1";
    const conflictAfter = after(conflictFen, "b8a7");
    const conflictCapture = transitionSemanticFacts(conflictFen, "b8a7", conflictAfter).find((fact) => fact.family === "capture");
    const conflict = overloadedDefenderResponseConflict(conflictFen, "b8a7", conflictAfter, conflictCapture);
    expect(conflict).toMatchObject({ kind: "conflicts", conflicts: [expect.objectContaining({ soleDefender: expect.objectContaining({ square: "c6" }), capturedTarget: expect.objectContaining({ square: "a7" }), retainedTargets: [expect.objectContaining({ square: "e7" })] })] });
    if (conflict.kind !== "conflicts") throw new TypeError("fixture did not produce overload conflict");
    expect(declareOverloadedDefenderConflictEvidence(conflict.conflicts[0]!).projection.id).toBe("derived.tactic.overloaded_defender_response_conflict");

    const alternateFen = "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1";
    const alternateAfter = after(alternateFen, "b8a7");
    const alternateCapture = transitionSemanticFacts(alternateFen, "b8a7", alternateAfter).find((fact) => fact.family === "capture");
    expect(overloadedDefenderResponseConflict(alternateFen, "b8a7", alternateAfter, alternateCapture)).toMatchObject({ kind: "clear", conflicts: [] });

    const pinnedFen = "1Bk5/r2pq3/2n5/8/8/8/8/2R1R1K1 w - - 0 1";
    expect(defenderDutyReading(pinnedFen).duties.filter((duty) => duty.defender.square === "c6")).toEqual(expect.arrayContaining([
      expect.objectContaining({ target: expect.objectContaining({ square: "a7" }), coDefenders: [] }),
      expect.objectContaining({ target: expect.objectContaining({ square: "e7" }), coDefenders: [] }),
    ]));
    const pinnedAfter = after(pinnedFen, "b8a7");
    const pinnedCapture = transitionSemanticFacts(pinnedFen, "b8a7", pinnedAfter).find((fact) => fact.family === "capture");
    expect(overloadedDefenderResponseConflict(pinnedFen, "b8a7", pinnedAfter, pinnedCapture)).toMatchObject({ kind: "unavailable", reason: "no_legal_recapture" });
  });
});
