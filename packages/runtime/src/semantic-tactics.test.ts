import { normalizeMove } from "chessops/chess";
import { makeUci, parseSquare, parseUci } from "chessops/util";
import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { localSemanticEvents } from "./semantic-evidence.js";
import { evidenceForConsumer, evidenceValueReceipt } from "./evidence-contract.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { parsePresentationReceipt, presentEvidenceItems, presentedSentence, serializePresentedEvidence } from "./presentation-contract.js";
import { defenderDutyReading, defenderDutyRelocatedEvents, defenderRemovedEvents, overloadedDefenderResponseConflict } from "./tactics.js";
import { transitionSemanticFacts } from "./transition.js";
import { legalCaptureMovesTo, legalExchangeForMove } from "./exchange.js";

function after(fen: string, uci: string): string {
  const position = positionFromFen(fen);
  const move = normalizeMove(position, parseUci(uci)!);
  expect(position.isLegal(move)).toBe(true);
  position.play(move);
  return canonicalFen(position);
}

describe("semantic tactic anchors", () => {
  it.each([
    { name: "black", fen: "7k/8/8/8/R1R5/7K/1p6/b1b4R w - - 0 1", move: "a4a1", defender: "b2", landing: "a1", target: "c1", attacker: "c4", blocked: false },
    { name: "white", fen: "B1B4r/1P6/7k/r1r5/8/8/8/7K b - - 0 1", move: "a5a8", defender: "b7", landing: "a8", target: "c8", attacker: "c5", blocked: false },
    { name: "black", fen: "7k/8/8/8/R1R5/7K/1p6/bbb4R w - - 0 1", move: "a4a1", defender: "b2", landing: "a1", target: "c1", attacker: "c4", blocked: true },
    { name: "white", fen: "BBB4r/1P6/7k/r1r5/8/8/8/7K b - - 0 1", move: "a5a8", defender: "b7", landing: "a8", target: "c8", attacker: "c5", blocked: true },
  ])("D3716 $name promotion duties respect the actual role and blocker ($blocked)", value => {
    const next = after(value.fen, value.move);
    const duties = defenderDutyReading(value.fen).duties;
    for (const square of [value.landing, value.target]) expect(duties).toContainEqual(expect.objectContaining({
      defender: expect.objectContaining({ square: value.defender, piece: expect.objectContaining({ color: value.name, role: "pawn" }) }),
      target: expect.objectContaining({ square }), coDefenders: [],
    }));
    const recaptures = legalCaptureMovesTo(positionFromFen(next), parseSquare(value.landing)!, parseSquare(value.defender)!);
    expect(recaptures.map(makeUci).sort()).toEqual(["b", "n", "q", "r"].map(role => value.defender + value.landing + role));
    for (const recapture of recaptures) {
      const role = recapture.promotion!;
      const replied = positionFromFen(next); replied.play(recapture);
      expect(replied.board.get(parseSquare(value.landing)!)).toMatchObject({ color: value.name, role });
      // Independent horizontal occupancy witness: the promoted defender reaches c1/c8
      // through the empty b-file square, although its role is no longer pawn.
      expect(replied.board.occupied.has(parseSquare(value.name === "black" ? "b1" : "b8")!)).toBe(value.blocked);
      expect(replied.board.get(parseSquare(value.target)!)).toMatchObject({ color: value.name, role: "bishop" });
      const retains = defenderDutyReading(canonicalFen(replied)).duties.some(duty => duty.defender.square === value.landing && duty.target.square === value.target);
      expect(retains).toBe(!value.blocked && (role === "queen" || role === "rook"));
      const taking = parseUci(value.attacker + value.target)!;
      expect(replied.isLegal(taking)).toBe(true);
      expect(legalExchangeForMove(replied, taking)?.resultUnits).toBeGreaterThan(0);
    }
    const capture = transitionSemanticFacts(value.fen, value.move, next).find(fact => fact.family === "capture");
    const actual = overloadedDefenderResponseConflict(value.fen, value.move, next, capture);
    expect(actual.kind).toBe(value.blocked ? "conflicts" : "clear");
    expect(actual.conflicts).toHaveLength(value.blocked ? 1 : 0);
    if (value.blocked) expect(actual.conflicts[0]).toMatchObject({
      soleDefender: { square: value.defender, piece: { color: value.name, role: "pawn" } },
      retainedTargets: [{ square: value.target, piece: { color: value.name, role: "bishop" } }],
      legalRecaptures: recaptures.map(makeUci),
      positiveCaptures: recaptures.map(move => expect.objectContaining({ recapture: makeUci(move) })),
    });
    const sealed = invokeEvidenceValueRoute("derived.tactic.overloaded_defender_response_conflict@1", {
      duties: invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen: value.fen }),
      capture: invokeEvidenceValueRoute("rules.transition.event.capture@1", { beforeFen: value.fen, moveUci: value.move, afterFen: next })[0]!,
    });
    expect(sealed.kind).toBe("available");
    if (sealed.kind !== "available") throw new Error("Legal promotion alternatives must be computed, not abstained");
    expect(sealed.value.map(item => item.payload)).toEqual(actual.conflicts);
    const rendered = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(presentEvidenceItems(
      evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 1 }, sealed.value),
    )))));
    expect(rendered).toHaveLength(value.blocked ? 1 : 0);
  });

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
    const capture = invokeEvidenceValueRoute("rules.transition.event.capture@1", { beforeFen: conflictFen, moveUci: "b8a7", afterFen: conflictAfter })[0]!;
    const duties = invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen: conflictFen });
    const sealed = invokeEvidenceValueRoute("derived.tactic.overloaded_defender_response_conflict@1", { duties, capture });
    expect(sealed.kind === "available" ? sealed.value.map((item) => item.projection.id) : []).toEqual(["derived.tactic.overloaded_defender_response_conflict"]);
    expect(sealed.kind === "available" ? sealed.value[0]!.payload : undefined).toEqual(conflict.conflicts[0]);
    // Duties read at a different position cannot be joined to this capture.
    expect(() => invokeEvidenceValueRoute("derived.tactic.overloaded_defender_response_conflict@1", { duties: invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen: conflictAfter }), capture })).toThrow(/before position/u);

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

const enPassantOverloads = [
  { name: "white", fen: "k2r2r1/8/8/3pP3/8/8/8/1K4R1 w - d6 0 2", move: "e5d6", defender: "d8", captured: "d5", retained: "g8", reply: "d8d6", capture: "g1g8", san: "exd6", recaptureSan: "Rxd6" },
  { name: "black", fen: "1k4r1/8/8/8/3Pp3/8/8/K2R2R1 b - d3 0 2", move: "e4d3", defender: "d1", captured: "d4", retained: "g1", reply: "d1d3", capture: "g8g1", san: "exd3", recaptureSan: "Rxd3" },
] as const;

describe("D3645 exact en-passant target and recapture identities", () => {
  it.each([
    { fen: "k5r1/4n3/8/3pP3/8/8/8/1K4R1 w - d6 0 2", move: "e5d6", kind: "unavailable" },
    { fen: "1k4r1/8/8/8/3Pp3/8/4N3/K5R1 b - d3 0 2", move: "e4d3", kind: "unavailable" },
    { fen: "k2r2r1/2n5/8/3pP3/8/8/8/1K4R1 w - d6 0 2", move: "e5d6", kind: "clear" },
    { fen: "1k4r1/8/8/8/3Pp3/8/2N5/K2R2R1 b - d3 0 2", move: "e4d3", kind: "clear" },
    { fen: "k2r2r1/8/7n/3pP3/8/8/8/1K4R1 w - d6 0 2", move: "e5d6", kind: "clear" },
    { fen: "1k4r1/8/8/8/3Pp3/7N/8/K2R2R1 b - d3 0 2", move: "e4d3", kind: "clear" },
    { fen: "k2r2r1/8/8/3pP3/8/8/8/1K4B1 w - d6 0 2", move: "e5d6", kind: "clear" },
    { fen: "1k4b1/8/8/8/3Pp3/8/8/K2R2R1 b - d3 0 2", move: "e4d3", kind: "clear" },
  ])("retains complete-refutation/no-recapture outcomes for $fen", value => {
    const next = after(value.fen, value.move);
    const capture = transitionSemanticFacts(value.fen, value.move, next).find(fact => fact.family === "capture");
    const result = overloadedDefenderResponseConflict(value.fen, value.move, next, capture);
    expect(result).toMatchObject({ kind: value.kind, conflicts: [] });
    if (value.kind === "unavailable") expect(result).toMatchObject({ reason: "no_legal_recapture" });
    const declared = invokeEvidenceValueRoute("derived.tactic.overloaded_defender_response_conflict@1", {
      duties: invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen: value.fen }),
      capture: invokeEvidenceValueRoute("rules.transition.event.capture@1", { beforeFen: value.fen, moveUci: value.move, afterFen: next })[0]!,
    });
    expect(declared).toMatchObject(value.kind === "unavailable" ? { kind: "unavailable", reason: "no_legal_recapture" } : { kind: "available", value: [] });
  });

  it.each(enPassantOverloads)("retains the $name captured pawn separately from the recapture landing", value => {
    const next = after(value.fen, value.move);
    const capture = transitionSemanticFacts(value.fen, value.move, next).find(fact => fact.family === "capture");
    expect(capture).toMatchObject({ enPassant: true });
    const result = overloadedDefenderResponseConflict(value.fen, value.move, next, capture);
    expect(result).toMatchObject({ kind: "conflicts", conflicts: [expect.objectContaining({
      candidate: value.move,
      soleDefender: expect.objectContaining({ square: value.defender }),
      capturedTarget: expect.objectContaining({ square: value.captured, piece: expect.objectContaining({ role: "pawn" }) }),
      retainedTargets: [expect.objectContaining({ square: value.retained })],
      legalRecaptures: [value.reply],
      positiveCaptures: [expect.objectContaining({ recapture: value.reply, captures: expect.arrayContaining([expect.objectContaining({ captureUci: value.capture })]) })],
    })] });
  });

  it.each(enPassantOverloads)("seals and serializes the $name conflict with its original source items", value => {
    const next = after(value.fen, value.move);
    const capture = invokeEvidenceValueRoute("rules.transition.event.capture@1", { beforeFen: value.fen, moveUci: value.move, afterFen: next })[0]!;
    const duties = invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen: value.fen });
    const result = invokeEvidenceValueRoute("derived.tactic.overloaded_defender_response_conflict@1", { duties, capture });
    expect(result.kind).toBe("available");
    if (result.kind !== "available") throw new Error("Expected available overload computation");
    expect(result.value).toHaveLength(1);
    const item = result.value[0]!;
    expect(evidenceValueReceipt(item)).toMatchObject({ factory: "createDerivedTacticOverloadedDefenderResponseConflictV1Evidence" });
    const receipt = parsePresentationReceipt(JSON.parse(JSON.stringify(serializePresentedEvidence(presentEvidenceItems(evidenceForConsumer(PRIMARY_EVIDENCE_MANIFEST, { id: "module.full_inspector", version: 1 }, result.value))))));
    expect(receipt).toHaveLength(1);
    const sentence = presentedSentence(receipt[0]!);
    expect(sentence).toContain(value.san);
    expect(sentence).toContain(`pawn on ${value.captured}`);
    expect(sentence).toContain(`rook on ${value.retained}`);
    expect(sentence).toContain(value.recaptureSan);
    expect(sentence).not.toContain(`pawn on ${value.move.slice(2)}`);
    expect(() => invokeEvidenceValueRoute("derived.tactic.overloaded_defender_response_conflict@1", { duties: invokeEvidenceValueRoute("rules.tactic.reading.defender_duty_set@1", { fen: next }), capture })).toThrow(/before position/u);
  });
});
