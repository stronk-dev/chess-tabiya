import { normalizeMove } from "chessops/chess";
import { parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import type { RecordedMoveAnchor } from "./pawn-dynamics.js";
import { pawnContactTimingSequence } from "./pawn-dynamics.js";
import { declareOpenFileOccupancyEvidence, declareRunRecordEvidence, declareStructuralReadingSourceEvidence } from "./evidence-source-adapters.js";
import { breadthSemanticEvents, capturedZoneDefenderOperands, compileSemanticEvidenceEvent, defenderConsequenceOperands, defenderExposureOperands, openFileOccupancyOperands, pawnContactTimingSemanticEvent } from "./semantic-evidence.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

function anchors(fen: string, moves: readonly string[]): readonly RecordedMoveAnchor[] {
  let current = fen;
  return moves.map((moveUci, index) => {
    const next = after(current, moveUci);
    const value = { beforeNodeId: `n${index}`, afterNodeId: `n${index + 1}`, beforeFen: current, moveUci, afterFen: next };
    current = next;
    return value;
  });
}

describe("breadth semantic joins", () => {
  it("requires both an exact lost enemy defence edge and a positive local capture", () => {
    const exposed = "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1";
    expect(defenderExposureOperands(exposed, "c5b6", after(exposed, "c5b6"))).toContainEqual(expect.objectContaining({
      kind: "available",
      defender: expect.objectContaining({ square: "b6", piece: expect.objectContaining({ color: "black", role: "knight" }) }),
      target: expect.objectContaining({ square: "a8", piece: expect.objectContaining({ color: "black", role: "rook" }) }),
      captures: [expect.objectContaining({ captureUci: "a1a8", resultUnits: 5 })],
    }));

    const noPositiveCapture = "3rk3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1";
    expect(defenderExposureOperands(noPositiveCapture, "c5b6", after(noPositiveCapture, "c5b6"))).toEqual([]);
  });

  it("retains all four nodes and exact identities in both three-edge consequence forms", () => {
    const captured = anchors("r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", ["c5b6", "e8d7", "a1a8"]);
    expect(defenderConsequenceOperands(captured)).toContainEqual(expect.objectContaining({
      kind: "edge_lost_target_captured",
      firstMoveCapturedDefender: true,
      defender: expect.objectContaining({ before: expect.objectContaining({ square: "b6" }) }),
      target: expect.objectContaining({ square: "a8" }),
      nodes: expect.arrayContaining([expect.objectContaining({ nodeId: "n0" }), expect.objectContaining({ nodeId: "n1" }), expect.objectContaining({ nodeId: "n2" }), expect.objectContaining({ nodeId: "n3" })]),
    }));

    const relocated = anchors("r3k3/8/1n6/8/2P5/8/8/R3K3 w - - 0 1", ["c4c5", "b6d7", "a1a8"]);
    expect(defenderConsequenceOperands(relocated)).toContainEqual(expect.objectContaining({
      kind: "defender_relocated_target_captured",
      defender: expect.objectContaining({ before: expect.objectContaining({ square: "b6" }), after: expect.objectContaining({ square: "d7" }) }),
      target: expect.objectContaining({ square: "a8" }),
    }));

    expect(() => defenderConsequenceOperands([captured[0]!, { ...captured[1]!, beforeNodeId: "wrong" }, captured[2]!])).toThrow(/broken node\/FEN boundary/u);
  });

  it("joins ordinary and en-passant capture squares to prior king-zone defenders", () => {
    const ordinary = "6k1/5n2/8/8/2B5/8/8/4K3 w - - 0 1";
    expect(capturedZoneDefenderOperands(ordinary, "c4f7", after(ordinary, "c4f7"))).toContainEqual(expect.objectContaining({ capturedSquare: "f7", kingColor: "black", defender: expect.objectContaining({ square: "f7", piece: expect.objectContaining({ role: "knight" }) }) }));

    const enPassant = "8/8/8/3pP3/5k2/8/8/K7 w - d6 0 1";
    expect(capturedZoneDefenderOperands(enPassant, "e5d6", after(enPassant, "e5d6"))).toContainEqual(expect.objectContaining({ capturedSquare: "d5", kingColor: "black", defender: expect.objectContaining({ square: "d5", piece: expect.objectContaining({ role: "pawn" }) }) }));
  });

  it("requires the heavy piece itself to move from a closed source file onto a declared open file", () => {
    const moved = "4k3/8/8/8/8/8/P7/R3K3 w - - 0 1";
    expect(openFileOccupancyOperands(moved, "a1d1", after(moved, "a1d1"))).toMatchObject({
      piece: { before: { square: "a1", piece: { role: "rook" } }, after: { square: "d1", piece: { role: "rook" } } },
      fileClass: "open_file",
      sourceReading: { kind: "open_file", file: "d" },
    });

    const stationary = "4k3/8/8/8/8/1p6/P7/R3K3 w - - 0 1";
    expect(openFileOccupancyOperands(stationary, "a2b3", after(stationary, "a2b3"))).toBeUndefined();
  });

  it("routes one-edge breadth facts through the compiled semantic-event authority", () => {
    const exposed = "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1";
    const ids = breadthSemanticEvents(exposed, "c5b6", after(exposed, "c5b6")).map((event) => event.projection.id);
    expect(ids).toContain("rules.square.event.control");
    expect(ids).toContain("rules.mobility.event.piece_destinations");
    expect(ids).toContain("derived.tactic.defender_exposure");
    expect(ids).toContain("derived.material.event.role_asymmetry");
    expect(ids).toContain("rules.king.event.zone_state");

    const open = "4k3/8/8/8/8/8/P7/R3K3 w - - 0 1";
    expect(breadthSemanticEvents(open, "a1d1", after(open, "a1d1")).map((event) => event.projection.id)).toContain("derived.activity.event.open_file_occupancy");

    const halfOpen = "4k3/8/3p4/8/8/8/P7/R3K3 w - - 0 1";
    expect(openFileOccupancyOperands(halfOpen, "a1d1", after(halfOpen, "a1d1"))?.fileClass).toBe("half_open_file");
    const halfOpenEvent = breadthSemanticEvents(halfOpen, "a1d1", after(halfOpen, "a1d1")).find((event) => event.projection.id === "derived.activity.event.open_file_occupancy");
    expect(halfOpenEvent).toMatchObject({ derivationInputs: [{ projection: { id: "rules.structural.reading.half_open_file" } }] });
  });

  it("seals exactly one declared open-file derivation member at runtime", () => {
    const halfOpen = "4k3/8/3p4/8/8/8/P7/R3K3 w - - 0 1";
    const afterFen = after(halfOpen, "a1d1");
    const payload = openFileOccupancyOperands(halfOpen, "a1d1", afterFen)!;
    const halfEvidence = declareStructuralReadingSourceEvidence(payload.sourceReading);
    const open = "4k3/8/8/8/8/8/P7/R3K3 w - - 0 1";
    const openPayload = openFileOccupancyOperands(open, "a1d1", after(open, "a1d1"))!;
    const openEvidence = declareStructuralReadingSourceEvidence(openPayload.sourceReading);
    const input = {
      evidence: declareOpenFileOccupancyEvidence(payload), anchor: { beforeFen: halfOpen, moveUci: "a1d1", afterFen, side: "white" as const }, sign: "gained" as const, operands: payload,
    };
    const admitted = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { ...input, derivationInputs: [halfEvidence] });
    const otherMember = compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { ...input, derivationInputs: [openEvidence] });
    expect(admitted.id).not.toBe(otherMember.id);
    expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { ...input, derivationInputs: [] })).toThrow(/derivation inputs disagree/u);
    expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { ...input, derivationInputs: [halfEvidence, openEvidence] })).toThrow(/derivation inputs disagree/u);
    expect(() => compileSemanticEvidenceEvent(PRIMARY_EVIDENCE_MANIFEST, { ...input, derivationInputs: [declareRunRecordEvidence("move", { context: "wrong authority", offset: 0, moveSan: "Ra1-d1" })] })).toThrow(/derivation inputs disagree/u);
  });

  it("retains promotion-only and capture-promotion authorities for material-role events", () => {
    const promotion = "4k3/P7/8/8/8/8/8/4K3 w - - 0 1";
    const promotionEvent = breadthSemanticEvents(promotion, "a7a8q", after(promotion, "a7a8q")).find((event) => event.projection.id === "derived.material.event.role_asymmetry");
    expect(promotionEvent?.derivationInputs.map((value) => value.projection.id)).toEqual([
      "derived.material.reading.role_signature", "derived.material.reading.role_signature", "rules.transition.event.promotion",
    ]);

    const capturePromotion = "r3k3/1P6/8/8/8/8/8/4K3 w - - 0 1";
    const capturePromotionEvent = breadthSemanticEvents(capturePromotion, "b7a8q", after(capturePromotion, "b7a8q")).find((event) => event.projection.id === "derived.material.event.role_asymmetry");
    expect(capturePromotionEvent?.derivationInputs.map((value) => value.projection.id)).toEqual([
      "derived.material.reading.role_signature", "derived.material.reading.role_signature", "rules.transition.event.capture", "rules.transition.event.promotion",
    ]);
  });

  it("seals a retained contact sequence only with the required recorded-move evidence", () => {
    const path = anchors("4k3/8/8/3p4/8/8/4P3/4K3 w - - 0 1", ["e2e4", "e8f7"]);
    const payload = pawnContactTimingSequence(path)!;
    const evidence = path.map((_, offset) => declareRunRecordEvidence("move", { context: "fixture", offset, moveSan: `m${offset}` }));
    expect(pawnContactTimingSemanticEvent(payload, evidence)).toMatchObject({ projection: { id: "derived.pawn.sequence.contact_timing", version: 1 }, sign: "state" });
    expect(() => pawnContactTimingSemanticEvent(payload, evidence.slice(0, 1))).toThrow(/one run.record.move evidence item per anchor/u);
  });
});
