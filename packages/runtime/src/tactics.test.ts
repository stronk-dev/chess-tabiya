import { expect, describe, it } from "vitest";

import { checkEvent, doubleAttackEvent, forkSurvivesReply, replyBreadth, threats } from "./tactics.js";

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
});
