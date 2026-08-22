import { expect, describe, it } from "vitest";

import { checkEvent, doubleAttackEvent, forkSurvivesReply, loosePieceReading, mateInOne, rayClassificationReading, replyBreadth, threats } from "./tactics.js";

describe("bounded tactical authorities", () => {
  it("records exact reply breadth and treats zero as terminal", () => {
    const mate = replyBreadth("7k/5Q2/6K1/8/8/8/8/8 w - - 0 1", "f7g7");
    expect(mate).toMatchObject({ terminal: true, check: true, count: 0, replies: [] });

    const ordinary = replyBreadth("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", "e2e4");
    expect(ordinary.count).toBe(ordinary.replies.length);
    expect(ordinary.count).toBeGreaterThan(1);
  });

  it("retains single, discovered and double-check identities", () => {
    expect(checkEvent("4k3/8/8/8/8/8/R7/4K3 w - - 0 1", "a2e2")?.checkingPieces).toHaveLength(1);
    const discovered = checkEvent("4k3/8/8/8/8/8/4B3/4R1K1 w - - 0 1", "e2c4");
    expect(discovered?.checkingPieces.map((value) => value.square)).toEqual(["e1"]);
    const double = checkEvent("4k3/8/8/8/8/8/4B3/4R1K1 w - - 0 1", "e2b5");
    expect(double?.checkingPieces).toHaveLength(2);
  });

  it("filters geometry-only forks and retains refuting replies", () => {
    const geometricOnly = doubleAttackEvent("4k3/2p3p1/3b3b/8/3N4/8/8/4K3 w - - 0 1", "d4f5");
    expect(geometricOnly).toBeUndefined();

    const fork = doubleAttackEvent("8/2k5/3r4/8/3N4/8/8/4K3 w - - 0 1", "d4b5");
    expect(fork?.targets.length).toBeGreaterThanOrEqual(2);
    if (fork !== undefined) {
      const consequence = forkSurvivesReply(fork, replyBreadth(fork.beforeFen, fork.moveUci));
      expect(consequence.replyBreadth.count).toBe(consequence.replyBreadth.replies.length);
      if (!consequence.matched) expect(consequence.refutingReplies.length).toBeGreaterThan(0);
    }
  });

  it("abstains on a pass while in check and clears en-passant in the pass convention", () => {
    expect(threats("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1")).toEqual({ kind: "abstained", reason: "pass_while_in_check", conventionId: "threat@1" });
    const value = threats("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1");
    expect(value.kind).toBe("threats");
    if (value.kind === "threats") expect(value.threats.some((threat) => threat.threatenedMove === "e5d6")).toBe(false);
  });

  it("separates loose, en-prise and under-defended from raw attack geometry", () => {
    const freeQueen = loosePieceReading("q3k3/8/8/8/8/8/8/R3K3 w - - 0 1").pieces.find((value) => value.piece.square === "a8");
    expect(freeQueen).toMatchObject({ loose: true, enPrise: true, underDefended: false });
    expect(freeQueen?.legalCapturers[0]).toMatchObject({ square: "a1", captureUci: "a1a8", exchange: { resultUnits: 9 } });

    const defendedBishop = loosePieceReading("4k3/8/4p3/3b4/8/8/6B1/4K3 w - - 0 1").pieces.find((value) => value.piece.square === "d5");
    expect(defendedBishop?.defenders.map((value) => value.square)).toContain("e6");
    expect(defendedBishop).toMatchObject({ loose: false, enPrise: false, underDefended: false });
    expect(defendedBishop?.legalCapturers[0]?.exchange.resultUnits).toBe(0);
  });

  it("classifies pins, skewers and X-rays with one precedence rule", () => {
    const kind = (fen: string) => rayClassificationReading(fen).rays.find((ray) => ray.slider.square === "b5" && ray.blocker.square === "c6" && ray.target.square === "d7");
    expect(kind("8/3k4/2n5/1B6/8/8/8/4K3 w - - 0 1")?.kind).toBe("absolute_pin");
    expect(kind("7k/3n4/2r5/1B6/8/8/8/4K3 w - - 0 1")).toMatchObject({ kind: "skewer", comparison: { frontValue: 5, backValue: 3 } });
    expect(kind("7k/3r4/2n5/1B6/8/8/8/4K3 w - - 0 1")).toMatchObject({ kind: "relative_pin", comparison: { frontValue: 3, backValue: 5 } });
    expect(kind("7k/3b4/2n5/1B6/8/8/8/4K3 w - - 0 1")?.kind).toBe("xray_attack");
    expect(kind("7k/3R4/2n5/1B6/8/8/8/4K3 w - - 0 1")?.kind).toBe("xray_defense");
  });

  it("does not preserve a ray classification after lifting the slider", () => {
    const before = rayClassificationReading("7k/3r4/2n5/1B6/8/8/8/4K3 w - - 0 1");
    const after = rayClassificationReading("7k/3r4/2n5/8/B7/8/8/4K3 b - - 1 1");
    expect(before.rays.some((ray) => ray.slider.square === "b5" && ray.target.square === "d7")).toBe(true);
    expect(after.rays.some((ray) => ray.slider.square === "b5")).toBe(false);
  });

  it("keeps exact mate in one separate from deeper or absent threats", () => {
    const exact = mateInOne("7k/8/5KQ1/8/8/8/8/8 w - - 0 1");
    expect(exact.mates.map((value) => value.moveUci)).toContain("g6g7");
    expect(exact.mates.find((value) => value.moveUci === "g6g7")).toMatchObject({ matedKing: { square: "h8", piece: { color: "black", role: "king" } } });
    expect(mateInOne("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1").mates).toEqual([]);
  });
});
