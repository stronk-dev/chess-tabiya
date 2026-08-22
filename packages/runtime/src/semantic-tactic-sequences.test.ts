import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import {
  attractionObservedSemanticEvent,
  attractionObservedOperands,
  checkZwischenzugObservedOperands,
  deflectionObservedOperands,
  deflectionObservedSemanticEvent,
  interferenceObservedOperands,
  interferenceSemanticEvent,
  lineBlockerClearanceObservedOperands,
  lineBlockerClearanceSemanticEvent,
  overloadExploitationObservedOperands,
  overloadExploitationSemanticEvent,
  squareClearanceObservedOperands,
  squareClearanceSemanticEvent,
} from "./semantic-evidence.js";
import { declareCheckEventEvidence, declareDefenderDutyEvidence, declareLegalExchangeEvidence, declareRunRecordEvidence, declareTransitionSemanticSourceEvidence } from "./evidence-source-adapters.js";
import type { RecordedMoveAnchor } from "./pawn-dynamics.js";
import { checkEvent, defenderDutyReading } from "./tactics.js";
import { transitionSemanticFacts } from "./transition.js";

function anchors(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  let current = fen;
  return moves.map((moveUci, index) => {
    const position = positionFromFen(current);
    const move = normalizeMove(position, parseUci(moveUci)!);
    expect(position.isLegal(move)).toBe(true);
    position.play(move);
    const afterFen = canonicalFen(position);
    const anchor = { beforeNodeId: `n${index}`, afterNodeId: `n${index + 1}`, beforeFen: current, moveUci, afterFen };
    current = afterFen;
    return anchor;
  });
}

function moveEvidence(path: readonly RecordedMoveAnchor[]) {
  return path.map((anchor, offset) => declareRunRecordEvidence("move", { context: "recorded semantic fixture", offset, moveSan: anchor.moveUci }));
}

function captureEvidence(anchor: RecordedMoveAnchor) {
  const capture = transitionSemanticFacts(anchor.beforeFen, anchor.moveUci, anchor.afterFen).find((fact) => fact.family === "capture");
  if (capture?.family !== "capture") throw new TypeError("fixture move is not a capture");
  return declareTransitionSemanticSourceEvidence("capture", { ...capture, before_fen: anchor.beforeFen, move_uci: anchor.moveUci, after_fen: anchor.afterFen });
}

describe("observed semantic tactic sequences", () => {
  it("requires defender displacement and a later positive target capture", () => {
    const positive = anchors("1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
    const event = deflectionObservedOperands(positive)[0]!;
    expect(event).toEqual(expect.objectContaining({
      defenderBefore: expect.objectContaining({ square: "c6" }),
      defenderAfter: expect.objectContaining({ square: "a7" }),
      lostDuty: expect.objectContaining({ target: expect.objectContaining({ square: "e7" }) }),
    }));
    expect(deflectionObservedSemanticEvent(event, moveEvidence(positive), declareDefenderDutyEvidence(defenderDutyReading(positive[0]!.beforeFen)), positive.map(captureEvidence), declareLegalExchangeEvidence(event.targetCapture))).toMatchObject({ projection: { id: "derived.tactic.deflection_observed" }, operands: event });
    const noCapture = anchors("1B5k/r7/2n1q3/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e6"]);
    expect(deflectionObservedOperands(noCapture)).toEqual([]);
  });

  it("restricts attraction to the retained king/queen/rook consequence", () => {
    const king = anchors("4k3/8/4B3/8/8/8/8/R5K1 w - - 0 1", ["e6d7", "e8d7", "a1d1"]);
    const event = attractionObservedOperands(king)[0]!;
    expect(event).toEqual(expect.objectContaining({ horizon: 3, arrivalSquare: "d7", checkOrCaptureConsequence: expect.objectContaining({ kind: "check" }) }));
    const check = checkEvent(king[2]!.beforeFen, king[2]!.moveUci)!;
    expect(attractionObservedSemanticEvent(event, moveEvidence(king), [captureEvidence(king[1]!)], declareCheckEventEvidence(check))).toMatchObject({ projection: { id: "derived.tactic.attraction_observed" }, operands: event });
    const minor = anchors("4k3/8/1n6/8/2B5/8/8/R5K1 w - - 0 1", ["c4d5", "b6d5", "a1d1"]);
    expect(attractionObservedOperands(minor)).toEqual([]);
  });

  it("keeps ray clearance and square clearance as distinct observed events", () => {
    const ray = anchors("q3k3/8/8/8/N7/8/8/R3K3 w - - 0 1", ["a4b6", "e8f7", "a1a8"]);
    const rayEvent = lineBlockerClearanceObservedOperands(ray)[0]!;
    expect(rayEvent).toEqual(expect.objectContaining({ blocker: expect.objectContaining({ square: "a4" }), slider: expect.objectContaining({ square: "a1" }), target: expect.objectContaining({ square: "a8" }) }));
    expect(lineBlockerClearanceSemanticEvent(rayEvent, moveEvidence(ray), declareLegalExchangeEvidence(rayEvent.targetCapture))).toMatchObject({ projection: { id: "derived.tactic.line_blocker_clearance_observed" }, operands: rayEvent });
    expect(squareClearanceObservedOperands(ray)).toEqual([]);

    const square = anchors("4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", ["b1c3", "e8d7", "a1b1"]);
    const squareEvent = squareClearanceObservedOperands(square)[0]!;
    expect(squareEvent).toEqual(expect.objectContaining({ vacatedSquare: "b1", laterSlider: expect.objectContaining({ square: "a1" }) }));
    expect(squareClearanceSemanticEvent(squareEvent, moveEvidence(square))).toMatchObject({ projection: { id: "derived.tactic.square_clearance_observed" }, operands: squareEvent });
    expect(lineBlockerClearanceObservedOperands(square)).toEqual([]);
  });

  it("retains the broken slider duty for interference", () => {
    const positive = anchors("r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", ["b6a6", "e8d7", "a6a5"]);
    const event = interferenceObservedOperands(positive)[0]!;
    expect(event).toEqual(expect.objectContaining({ betweenSquare: "a6", slider: expect.objectContaining({ square: "a8" }), target: expect.objectContaining({ square: "a5" }) }));
    expect(interferenceSemanticEvent(event, moveEvidence(positive), declareDefenderDutyEvidence(defenderDutyReading(positive[0]!.beforeFen)), declareLegalExchangeEvidence(event.targetCapture))).toMatchObject({ projection: { id: "derived.tactic.interference_observed" }, operands: event });
    const unrelated = anchors("r3k3/8/1R6/q7/8/8/8/6K1 w - - 0 1", ["b6b5", "e8d7", "b5a5"]);
    expect(interferenceObservedOperands(unrelated)).toEqual([]);
  });

  it("distinguishes a checking zwischenzug from a delayed quiet recapture", () => {
    const positive = anchors("4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", ["b4c3", "d1h5", "e8f8", "b2c3"]);
    expect(checkZwischenzugObservedOperands(positive)).toContainEqual(expect.objectContaining({ intermediateCheck: expect.objectContaining({ moveUci: "d1h5" }), retainedRecapture: expect.objectContaining({ landingSquare: "c3" }) }));
    const quiet = anchors("4k3/8/8/8/1b6/2N5/1P6/3Q2K1 b - - 0 1", ["b4c3", "d1g4", "e8f8", "b2c3"]);
    expect(checkZwischenzugObservedOperands(quiet)).toEqual([]);
  });

  it("requires more than one retained duty for observed overload exploitation", () => {
    const positive = anchors("1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
    const event = overloadExploitationObservedOperands(positive)[0]!;
    expect(event).toEqual(expect.objectContaining({ dutySet: expect.arrayContaining([expect.objectContaining({ target: expect.objectContaining({ square: "a7" }) }), expect.objectContaining({ target: expect.objectContaining({ square: "e7" }) })]) }));
    expect(overloadExploitationSemanticEvent(event, moveEvidence(positive), declareDefenderDutyEvidence(defenderDutyReading(positive[0]!.beforeFen)), [captureEvidence(positive[0]!), captureEvidence(positive[1]!)], declareLegalExchangeEvidence(event.secondTargetCapture))).toMatchObject({ projection: { id: "derived.tactic.overload_exploitation_observed" }, operands: event });
    const oneDuty = anchors("1B5k/r3q3/1n6/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "b6a8", "e1e7"]);
    expect(overloadExploitationObservedOperands(oneDuty)).toEqual([]);
  });

  it("rejects broken node/FEN continuity before interpreting a motif", () => {
    const path = anchors("1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
    expect(() => deflectionObservedOperands([path[0]!, { ...path[1]!, beforeNodeId: "wrong" }, path[2]!])).toThrow(/broken node\/FEN boundary/u);
  });
});
