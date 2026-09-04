// DISPOSABLE tenth fresh-review instrument for D2584-D2586. No product implementation.
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
import {
  deflectionObservedOperands,
  deflectionObservedSemanticEvent,
} from "../../packages/runtime/src/semantic-evidence.js";
import type { RecordedMoveAnchor } from "../../packages/runtime/src/pawn-dynamics.js";
import { defenderDutyReading } from "../../packages/runtime/src/tactics.js";
import { transitionSemanticFacts } from "../../packages/runtime/src/transition.js";

type Ref = Readonly<{ id: string; version: number }>;
type InputBinding = Readonly<{ projection: Ref; sourceSubjectKind: string; relation: string }>;
type OccurrenceOperand = Readonly<{
  projection: string;
  edgeOffsets?: readonly number[];
  positionOffsets?: readonly number[];
}>;
type RequirementRow = Readonly<{
  projection: Ref;
  derivation?: Readonly<{
    inputBindings?: readonly InputBinding[];
    occurrenceContract?: Readonly<{
      alternatives: readonly Readonly<{ operands: readonly OccurrenceOperand[] }>[];
    }>;
  }> | null;
}>;
type BindingRow = Readonly<{
  consumer: Ref;
  projection: Ref;
  occurrenceRequirement: Readonly<{
    source: string;
    view: string;
    selector: Readonly<{ committedEdgeForbidden?: boolean }>;
  }>;
  timingRequirement: Readonly<{ moduleRequested: readonly string[] }>;
}>;

const execution = JSON.parse(readFileSync("rfc/contracts/module-execution-plan-v1.json", "utf8")) as {
  rows: readonly RequirementRow[];
};
const bindings = JSON.parse(readFileSync("rfc/contracts/module-binding-plan-v1.json", "utf8")) as {
  rows: readonly BindingRow[];
};

function path(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  let current = fen;
  return moves.map((moveUci, index) => {
    const position = positionFromFen(current);
    const move = normalizeMove(position, parseUci(moveUci)!);
    if (!position.isLegal(move)) throw new TypeError(`illegal fixture move ${moveUci}`);
    position.play(move);
    const afterFen = canonicalFen(position);
    const anchor = Object.freeze({
      beforeNodeId: `n${index}`,
      afterNodeId: `n${index + 1}`,
      beforeFen: current,
      moveUci,
      afterFen,
    });
    current = afterFen;
    return anchor;
  });
}

function moveEvidence(values: readonly RecordedMoveAnchor[]) {
  return values.map((anchor, offset) => declareRunRecordEvidence("move", {
    context: "crossed review fixture",
    offset,
    moveSan: anchor.moveUci,
  }));
}

function captureEvidence(anchor: RecordedMoveAnchor) {
  const capture = transitionSemanticFacts(anchor.beforeFen, anchor.moveUci, anchor.afterFen)
    .find((fact) => fact.family === "capture");
  if (capture?.family !== "capture") throw new TypeError("fixture edge is not a capture");
  return declareTransitionSemanticSourceEvidence("capture", {
    ...capture,
    before_fen: anchor.beforeFen,
    move_uci: anchor.moveUci,
    after_fen: anchor.afterFen,
  });
}

describe("module-registration tenth fresh review", () => {
  it("reproduces the position-reading-to-edge relabel in exact tactic windows", () => {
    const affected = execution.rows.filter((row) => row.derivation?.occurrenceContract?.alternatives
      .some((alternative) => alternative.operands.some((operand) =>
        operand.projection === "rules.tactic.reading.defender_duty_set"
        && operand.positionOffsets !== undefined)));

    expect(affected.map((row) => row.projection.id).sort()).toEqual([
      "derived.tactic.deflection_observed",
      "derived.tactic.interference_observed",
      "derived.tactic.overload_exploitation_observed",
    ]);
    for (const row of affected) {
      expect(row.derivation?.inputBindings?.find((binding) =>
        binding.projection.id === "rules.tactic.reading.defender_duty_set"))
        .toEqual(expect.objectContaining({
          sourceSubjectKind: "edge",
          relation: "operation_owned_occurrences",
        }));
    }
  });

  it("reproduces candidate-only evidence on committed postcommit/review moments", () => {
    const affected = bindings.rows.filter((row) =>
      row.occurrenceRequirement.source === "candidate_population@1"
      && row.occurrenceRequirement.selector.committedEdgeForbidden === true
      && row.timingRequirement.moduleRequested.some((timing) =>
        timing === "postcommit" || timing === "review" || timing === "analysis"));

    expect(affected.length).toBeGreaterThan(0);
    expect(affected.some((row) => row.consumer.id === "module.postcommit_nudge")).toBe(true);
    expect(affected.some((row) => row.consumer.id === "module.review_map")).toBe(true);
    expect(affected.every((row) => row.occurrenceRequirement.view === "candidate_edge_by_uci"
      || row.occurrenceRequirement.view === "candidate_child_position_by_uci")).toBe(true);
  });

  it("proves sealed but crossed move/duty/capture/exchange evidence is accepted", () => {
    const subject = path("1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
    const crossed = path("1B6/r3q3/1kn5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
    const payload = deflectionObservedOperands(subject)[0]!;
    const crossedPayload = deflectionObservedOperands(crossed)[0]!;

    const result = deflectionObservedSemanticEvent(
      payload,
      moveEvidence(crossed),
      declareDefenderDutyEvidence(defenderDutyReading(crossed[0]!.beforeFen)),
      [captureEvidence(crossed[1]!)],
      declareLegalExchangeEvidence(crossedPayload.targetCapture),
    );

    expect(result.projection.id).toBe("derived.tactic.deflection_observed");
    expect(result.operands).toBe(payload);
    expect(result.derivationInputs.some((item) => item.payload === crossedPayload.targetCapture)).toBe(true);
  });
});
