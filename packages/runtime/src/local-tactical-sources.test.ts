import { normalizeMove } from "chessops/chess";
import { makeUci, parseUci } from "chessops/util";
import { describe, expect, it, vi } from "vitest";

import { canonicalFen, positionFromFen } from "./chess.js";
import { PRIMARY_EVIDENCE_MANIFEST } from "./evidence-catalog.js";
import { evidenceConventionReceipt, evidenceValueReceipt } from "./evidence-contract.js";
import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import * as tactics from "./tactics.js";
import { transitionSemanticFacts } from "./transition.js";

const FORK = "derived.tactic.nonterminal_fork_survival@1";
const PROMOTION = "rules.tactic.reading.promotion_pressure@1";
const OVERLOAD = "rules.tactic.predicate.overload_conflict@1";
const key = (ref: { readonly id: string; readonly version: number }) => `${ref.id}@${ref.version}`;
function edge(fen: string, uci: string) {
  const position = positionFromFen(fen), beforeFen = canonicalFen(position);
  const move = normalizeMove(position, parseUci(uci)!);
  if (!position.isLegal(move)) throw new Error("source fixture must be legal");
  position.play(move);
  return { beforeFen, moveUci: makeUci(move), afterFen: canonicalFen(position) };
}
const terminal = [
  ["white mate", "R5rk/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7", true],
  ["black mate", "8/8/8/8/8/6k1/5q2/r5RK b - - 0 1", "f2g2", true],
  ["white stalemate", "5K1k/6pp/7R/6Q1/3B4/8/8/8 w - - 0 1", "g5g6", false],
  ["black stalemate", "8/8/8/3b4/6q1/7r/6PP/5k1K b - - 0 1", "g4g3", false],
] as const;
function forkInputs(fen: string, move: string) {
  const anchor = edge(fen, move);
  return { doubleAttack: invokeEvidenceValueRoute("rules.tactic.event.double_attack@1", anchor)[0]!,
    breadth: invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", anchor) };
}

describe("accepted current local tactical sources (F2 §§2.3c/e/f)", () => {
  it.each(terminal)("fork %s is a total negative, not a vacuous positive", (_name, fen, move, check) => {
    const inputs = forkInputs(fen, move), result = invokeEvidenceValueRoute(FORK, inputs);
    expect(result.payload).toEqual({ ...tactics.forkSurvivesReply(inputs.doubleAttack.payload, inputs.breadth.payload), matched: false });
    expect(result.payload).toMatchObject({ matched: false, refutingReplies: [], replyBreadth: { terminal: true, check, count: 0, replies: [] } });
    expect(evidenceValueReceipt(result).sourceDigests).toEqual([inputs.doubleAttack, inputs.breadth].map(value => evidenceValueReceipt(value).payloadDigest));
    expect(evidenceConventionReceipt(result)!.refs.map(key)).toEqual(["double-attack@1", "fork-survival@2", "legal-exchange@1"]);
  });

  it.each([
    ["white positive", "k7/6Pr/8/8/8/8/8/4K3 w - - 0 1", "g7g8q", true],
    ["black positive", "4k3/8/8/8/8/8/6pR/K7 b - - 0 1", "g2g1q", true],
    ["white refutable", "k6r/6P1/8/8/8/8/8/4K3 w - - 0 1", "g7g8q", false],
    ["black refutable", "4k3/8/8/8/8/8/6p1/K6R b - - 0 1", "g2g1q", false],
  ])("preserves every nonterminal promotion-fork operand: %s", (_name, fen, move, matched) => {
    const inputs = forkInputs(fen, move), result = invokeEvidenceValueRoute(FORK, inputs);
    expect(result.payload).toEqual(tactics.forkSurvivesReply(inputs.doubleAttack.payload, inputs.breadth.payload));
    expect(result.payload.matched).toBe(matched);
    expect(result.payload.replyBreadth.count).toBeGreaterThan(0);
    expect(Object.isFrozen(result.payload.refutingReplies)).toBe(true);
  });

  it("refuses genuine equal-after-FEN breadth from another full before-position", () => {
    const own = forkInputs("4k3/8/8/8/1n1pP3/8/8/R3K3 b - e3 0 1", "b4c2");
    const crossed = forkInputs("4k3/8/8/8/1n1pP3/8/8/R3K3 b - - 0 1", "b4c2");
    expect(own.breadth.payload).toEqual(crossed.breadth.payload);
    expect(evidenceValueReceipt(own.breadth).inputDigest).not.toBe(evidenceValueReceipt(crossed.breadth).inputDigest);
    expect(() => invokeEvidenceValueRoute(FORK, own)).not.toThrow();
    expect(() => invokeEvidenceValueRoute(FORK, { ...own, breadth: crossed.breadth })).toThrow();
  });

  it("rejects copied/serialized, sliced, inconsistent and wrong-ref fork inputs before terminal return", () => {
    const inputs = forkInputs(terminal[0][1], terminal[0][2]);
    for (const breadth of [
      { ...inputs.breadth }, JSON.parse(JSON.stringify(inputs.breadth)),
      { ...inputs.breadth, payload: { ...inputs.breadth.payload, count: 1 } },
      { ...inputs.breadth, payload: { ...inputs.breadth.payload, terminal: false } },
      { ...inputs.breadth, payload: { ...inputs.breadth.payload, check: false } },
    ]) expect(() => invokeEvidenceValueRoute(FORK, { ...inputs, breadth })).toThrow();
    expect(() => invokeEvidenceValueRoute(FORK, { doubleAttack: inputs.breadth, breadth: inputs.breadth } as never)).toThrow();
    const nonterminal = forkInputs("k7/6Pr/8/8/8/8/8/4K3 w - - 0 1", "g7g8q");
    expect(() => invokeEvidenceValueRoute(FORK, { ...nonterminal, breadth: { ...nonterminal.breadth,
      payload: { ...nonterminal.breadth.payload, replies: nonterminal.breadth.payload.replies.slice(1) } } })).toThrow();
  });

  it.each(["count", "terminal", "check", "duplicate", "illegal"] as const)("checks genuinely issued %s-corrupt reply metadata before calculating survival", defect => {
    const inputs = forkInputs("k7/6Pr/8/8/8/8/8/4K3 w - - 0 1", "g7g8q");
    const original = tactics.replyBreadth;
    const source = vi.spyOn(tactics, "replyBreadth").mockImplementation((fen, move) => {
      const reading = original(fen, move);
      if (defect === "count") return { ...reading, count: reading.count + 1 };
      if (defect === "terminal") return { ...reading, terminal: !reading.terminal };
      if (defect === "check") return { ...reading, check: !reading.check };
      const replies = defect === "duplicate" ? [reading.replies[0]!, reading.replies[0]!] : ["h8h8"];
      return { ...reading, count: replies.length, terminal: false, replies };
    });
    const compute = vi.spyOn(tactics, "nonterminalForkSurvival");
    try {
      // Inject a fault before the genuine source factory mints, not by forging its seal.
      const anchor = edge(inputs.doubleAttack.payload.beforeFen, inputs.doubleAttack.payload.moveUci);
      const breadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", anchor);
      expect(evidenceValueReceipt(breadth).inputDigest).toBe(evidenceValueReceipt(inputs.breadth).inputDigest);
      expect(evidenceValueReceipt(breadth).factory).toBe("createRulesTacticConsequenceReplyBreadthV1Evidence");
      expect(() => invokeEvidenceValueRoute(FORK, { doubleAttack: inputs.doubleAttack, breadth })).toThrow();
      expect(compute).not.toHaveBeenCalled();
    } finally { source.mockRestore(); compute.mockRestore(); }
  });

  it.each([
    "4k3/8/8/8/8/8/8/4K3 w - - 0 1",
    "4k3/P7/8/8/8/8/8/4K3 b - - 0 1",
    "4k3/8/8/8/8/8/p7/4K3 w - - 0 1",
    "4k3/8/P7/8/8/8/8/4K3 b - - 0 1",
    "5K1k/P5pp/6QR/8/3B4/8/8/8 b - - 1 1",
    "8/8/8/3b4/8/6qr/p5PP/5k1K w - - 1 2",
  ])("promotion is computed from its canonical FEN with every nested outcome: %s", fen => {
    const result = invokeEvidenceValueRoute(PROMOTION, { fen });
    expect(result.payload).toEqual(tactics.promotionPressureReading(canonicalFen(positionFromFen(fen))));
    expect(evidenceValueReceipt(result).sourceDigests).toEqual([]);
    expect(evidenceConventionReceipt(result)!.refs.map(key)).toEqual(["promotion-pressure-geometry@1"]);
    expect(Object.isFrozen(result.payload.pawns)).toBe(true);
  });

  it("accepts no caller promotion predicate/results or availability override", () => {
    const fen = "4k3/P7/8/8/8/8/8/4K3 b - - 0 1";
    for (const extra of [{ pawns: [] }, { inputsAvailable: false }, { source: {} }]) {
      expect(() => invokeEvidenceValueRoute(PROMOTION, { fen, ...extra } as never)).toThrow();
    }
  });

  it.each([
    ["7k/6P1/8/8/8/8/8/7K b - - 0 1", "g7"],
    ["7k/8/8/8/8/8/6p1/7K w - - 0 1", "g2"],
  ])("promotion retains per-pawn invalid-turn-clone instead of a global false: %s", (fen, square) => {
    const result = invokeEvidenceValueRoute(PROMOTION, { fen });
    expect(result.payload.pawns.find(value => value.pawn.square === square)).toMatchObject({
      passAvailability: { kind: "unavailable", reason: "invalid_turn_clone" },
    });
  });

  it.each([
    ["conflict", "1B5k/r2pq3/2n5/8/8/8/8/4R1K1 w - - 0 1", "b8a7"],
    ["clear", "1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", "b8a7"],
    ["pinned", "1Bk5/r2pq3/2n5/8/8/8/8/2R1R1K1 w - - 0 1", "b8a7"],
    ["en passant", "k2r2r1/8/8/3pP3/8/8/8/1K4R1 w - d6 0 2", "e5d6"],
    ["black en passant", "1k4r1/8/8/8/3Pp3/8/8/K2R2R1 b - d3 0 2", "e4d3"],
    ["quiet", "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", "a1a2"],
    ["black promotion recapture", "7k/8/8/8/R1R5/7K/1p6/b1b4R w - - 0 1", "a4a1"],
    ["white promotion recapture", "B1B4r/1P6/7k/r1r5/8/8/8/7K b - - 0 1", "a5a8"],
  ])("overload preserves actual %s calculation and availability without discarded seals", (_name, fen, move) => {
    const anchor = edge(fen, move), capture = transitionSemanticFacts(anchor.beforeFen, anchor.moveUci, anchor.afterFen)
      .find((value): value is Extract<ReturnType<typeof transitionSemanticFacts>[number], { family: "capture" }> => value.family === "capture");
    const expected = tactics.overloadedDefenderResponseConflict(anchor.beforeFen, anchor.moveUci, anchor.afterFen, capture);
    const result = invokeEvidenceValueRoute(OVERLOAD, anchor);
    if (expected.kind === "unavailable") expect(result).toEqual({ kind: "unavailable", reason: expected.reason });
    else {
      expect(result.kind).toBe("available");
      if (result.kind !== "available") throw new Error("unexpected overload absence");
      expect(result.value.map(value => value.payload)).toEqual(expected.conflicts);
      for (const value of result.value) {
        expect(evidenceValueReceipt(value).sourceDigests).toEqual([]);
        expect(evidenceConventionReceipt(value)!.refs.map(key)).toEqual(["defence-duty@1", "legal-exchange@1", "overload-conflict@1"]);
      }
    }
  });

  it.each([
    ["k5r1/4n3/8/3pP3/8/8/8/1K4R1 w - d6 0 2", "e5d6", "unavailable"],
    ["1k4r1/8/8/8/3Pp3/8/4N3/K5R1 b - d3 0 2", "e4d3", "unavailable"],
    ["k2r2r1/2n5/8/3pP3/8/8/8/1K4R1 w - d6 0 2", "e5d6", "available"],
    ["1k4r1/8/8/8/3Pp3/8/2N5/K2R2R1 b - d3 0 2", "e4d3", "available"],
    ["k2r2r1/8/7n/3pP3/8/8/8/1K4R1 w - d6 0 2", "e5d6", "available"],
    ["1k4r1/8/8/8/3Pp3/7N/8/K2R2R1 b - d3 0 2", "e4d3", "available"],
    ["k2r2r1/8/8/3pP3/8/8/8/1K4B1 w - d6 0 2", "e5d6", "available"],
    ["1k4b1/8/8/8/3Pp3/8/8/K2R2R1 b - d3 0 2", "e4d3", "available"],
  ])("overload preserves genuine missing-recapture versus complete-refutation outcomes: %s", (fen, move, kind) => {
    const result = invokeEvidenceValueRoute(OVERLOAD, edge(fen, move));
    expect(result).toEqual(kind === "unavailable" ? { kind, reason: "no_legal_recapture" } : { kind, value: [] });
  });

  it.each([
    ["k2r2r1/8/8/3pP3/8/8/8/1K4R1 w - d6 0 2", "e5d6", "d5"],
    ["1k4r1/8/8/8/3Pp3/8/8/K2R2R1 b - d3 0 2", "e4d3", "d4"],
  ])("overload keeps the physical EP victim and every actual recapture FEN/target join: %s", (fen, move, victim) => {
    const anchor = edge(fen, move), result = invokeEvidenceValueRoute(OVERLOAD, anchor);
    if (result.kind !== "available" || result.value.length === 0) throw new Error("expected actual EP conflict");
    for (const item of result.value) {
      expect(item.payload.capturedTarget.square).toBe(victim);
      for (const positive of item.payload.positiveCaptures) {
        const recaptured = edge(anchor.afterFen, positive.recapture);
        expect(item.payload.legalRecaptures).toContain(positive.recapture);
        expect(positive.captures.length).toBeGreaterThan(0);
        for (const capture of positive.captures) {
          expect(capture.beforeFen).toBe(recaptured.afterFen);
          expect(capture.captured.square).toBe(positive.target.square);
          expect(capture.resultUnits).toBeGreaterThan(0);
          expect(positionFromFen(capture.beforeFen).isLegal(parseUci(capture.captureUci)!)).toBe(true);
        }
      }
    }
  });

  it("validates even quiet edges before the overload helper's early return", () => {
    const anchor = edge("4k3/8/8/8/8/8/8/R3K3 w - - 0 1", "a1a2");
    const compute = vi.spyOn(tactics, "overloadedDefenderResponseConflict");
    try {
      expect(() => invokeEvidenceValueRoute(OVERLOAD, { ...anchor, afterFen: anchor.beforeFen })).toThrow();
      expect(compute).not.toHaveBeenCalled();
    } finally { compute.mockRestore(); }
    expect(() => invokeEvidenceValueRoute(OVERLOAD, { ...anchor, capture: {} } as never)).toThrow();
  });

  it("does not partially bind internal replacements into the current learner image", () => {
    for (const route of [FORK, PROMOTION, OVERLOAD]) {
      expect(PRIMARY_EVIDENCE_MANIFEST.projections.find(value => key(value) === route)).toBeDefined();
      expect(PRIMARY_EVIDENCE_MANIFEST.bindings.some(value => key(value.projection) === route)).toBe(false);
    }
  });
});
