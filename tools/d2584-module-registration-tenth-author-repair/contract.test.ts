// DISPOSABLE tenth author-repair instrument for D2584-D2586. No module implementation.
import { readFileSync } from "node:fs";

import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import {
  declareDefenderDutyEvidence,
  declareLegalExchangeEvidence,
  declareRunRecordEvidence,
  declareTransitionSemanticSourceEvidence,
} from "../../packages/runtime/src/evidence-source-adapters.js";
import { deflectionObservedOperands, deflectionObservedSemanticEvent } from "../../packages/runtime/src/semantic-evidence.js";
import type { RecordedMoveAnchor } from "../../packages/runtime/src/pawn-dynamics.js";
import { defenderDutyReading } from "../../packages/runtime/src/tactics.js";
import { transitionSemanticFacts } from "../../packages/runtime/src/transition.js";

const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8"));
const bindings = JSON.parse(readFileSync("rfc/contracts/module-binding-plan-v1.json", "utf8"));

function path(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  let current = fen;
  return moves.map((moveUci, index) => {
    const position = positionFromFen(current);
    const move = normalizeMove(position, parseUci(moveUci)!);
    if (!position.isLegal(move)) throw new TypeError(`illegal fixture move ${moveUci}`);
    position.play(move);
    const afterFen = canonicalFen(position);
    const anchor = Object.freeze({ beforeNodeId: `n${index}`, afterNodeId: `n${index + 1}`, beforeFen: current, moveUci, afterFen });
    current = afterFen;
    return anchor;
  });
}

function moves(values: readonly RecordedMoveAnchor[]) {
  return values.map((anchor, offset) => declareRunRecordEvidence("move", { context: { ...anchor }, offset, moveSan: anchor.moveUci }));
}

function captures(values: readonly RecordedMoveAnchor[]) {
  return values.flatMap((anchor) => {
    const capture = transitionSemanticFacts(anchor.beforeFen, anchor.moveUci, anchor.afterFen).find((fact) => fact.family === "capture");
    return capture?.family === "capture" ? [declareTransitionSemanticSourceEvidence("capture", {
      ...capture, before_fen: anchor.beforeFen, move_uci: anchor.moveUci, after_fen: anchor.afterFen,
    })] : [];
  });
}

describe("module-registration tenth author repair", () => {
  it("D2584 retains exact position/edge operands instead of a generic occurrence label", () => {
    const affected = execution.rows.filter((row:any) => row.derivation?.occurrenceContract?.alternatives
      .some((alternative:any) => alternative.operands.some((operand:any) => operand.projection === "rules.tactic.reading.defender_duty_set")));
    expect(affected.map((row:any) => row.projection.id).sort()).toEqual([
      "derived.tactic.deflection_observed", "derived.tactic.interference_observed", "derived.tactic.overload_exploitation_observed",
    ]);
    for (const row of affected) {
      const duty = row.derivation.inputBindings.find((binding:any) => binding.projection.id === "rules.tactic.reading.defender_duty_set");
      expect(duty).toMatchObject({ sourceSubjectKind: "position", relation: "ordered_window_operand" });
      expect(duty.occurrenceOperands.every((alternative:any) => alternative.operands.every((operand:any) => operand.positionOffsets?.[0] === 0))).toBe(true);
    }
  });

  it("D2585 binds candidate moments to candidates and committed moments to recorded identities", () => {
    const candidateMoments = new Set(["precommit", "at_commit"]);
    const committedMoments = new Set(["postcommit", "checkpoint", "attempt_end", "review", "analysis"]);
    const occurrences = bindings.rows.flatMap((row:any) => row.occurrenceRequirement.byMoment.map((occurrence:any) => ({ ...occurrence, consumer: row.consumer.id })));
    expect(occurrences.some((row:any) => row.source === "candidate_population@1")).toBe(true);
    expect(occurrences.filter((row:any) => row.source === "candidate_population@1").every((row:any) => candidateMoments.has(row.timing) && row.selector.committedEdgeForbidden === true)).toBe(true);
    expect(occurrences.filter((row:any) => committedMoments.has(row.timing) && row.selector.kind === "recorded_occurrence_identity").every((row:any) => row.source === "recorded_semantic_path@1" || row.source === "review_evidence_packet@1")).toBe(true);
    expect(occurrences.some((row:any) => row.consumer === "module.postcommit_nudge" && row.timing === "postcommit" && row.selector.kind === "recorded_occurrence_identity")).toBe(true);
    expect(occurrences.some((row:any) => row.consumer === "module.review_map" && row.timing === "review" && row.selector.kind === "recorded_occurrence_identity")).toBe(true);
  });

  it("D2586 refuses each independently crossed recorded-move, duty, capture and exchange input", () => {
    const subject = path("1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
    const crossed = path("1B6/r3q3/1kn5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
    const payload = deflectionObservedOperands(subject)[0]!;
    const crossedPayload = deflectionObservedOperands(crossed)[0]!;
    const subjectMoves = moves(subject);
    const subjectDuty = declareDefenderDutyEvidence(defenderDutyReading(subject[0]!.beforeFen));
    const subjectCaptures = captures(subject);
    const subjectExchange = declareLegalExchangeEvidence(payload.targetCapture);
    expect(deflectionObservedSemanticEvent(payload, subjectMoves, subjectDuty, subjectCaptures, subjectExchange).projection.id).toBe("derived.tactic.deflection_observed");
    expect(() => deflectionObservedSemanticEvent(payload, moves(crossed), subjectDuty, subjectCaptures, subjectExchange)).toThrow(/crossed recorded-move/u);
    expect(() => deflectionObservedSemanticEvent(payload, subjectMoves, declareDefenderDutyEvidence(defenderDutyReading(crossed[0]!.beforeFen)), subjectCaptures, subjectExchange)).toThrow(/crossed position-duty/u);
    expect(() => deflectionObservedSemanticEvent(payload, subjectMoves, subjectDuty, captures(crossed), subjectExchange)).toThrow(/crossed capture/u);
    expect(() => deflectionObservedSemanticEvent(payload, subjectMoves, subjectDuty, subjectCaptures, declareLegalExchangeEvidence(crossedPayload.targetCapture))).toThrow(/crossed target-exchange/u);
  });
});
