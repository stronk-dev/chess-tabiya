import { describe, expect, it } from "vitest";

import { invokeEvidenceValueRoute } from "./internal/evidence-value-routes.js";
import { forcedMateAfterMove } from "./mate-proof.js";
import { replyBreadth } from "./tactics.js";

describe("bounded mate proof", () => {
  it("proves a declared mate-in-one without inventing a second root-reply population", () => {
    const fen = "7k/5Q2/6K1/8/8/8/8/8 w - - 0 1";
    const breadth = replyBreadth(fen, "f7g7");
    const result = forcedMateAfterMove(fen, "f7g7", 1, breadth);
    expect(result).toMatchObject({
      kind: "proof",
      proof: {
        candidate: "f7g7",
        maxAttackerMoves: 1,
        proofStatus: "proved",
        rootReplies: [],
        nodes: 1,
      },
    });
    if (result.kind === "proof") {
      expect(result.proof.proofDigest).toMatch(/^[0-9a-f]{64}$/u);
      const sealedBreadth = invokeEvidenceValueRoute("rules.tactic.consequence.reply_breadth@1", { beforeFen: fen, moveUci: "f7g7", afterFen: "7k/6Q1/6K1/8/8/8/8/8 b - - 1 1" });
      const sealed = invokeEvidenceValueRoute("rules.tactic.consequence.forced_mate_after_move@1", { beforeFen: fen, breadth: sealedBreadth, maxAttackerMoves: 1 });
      expect(sealed.kind === "available" ? sealed.value.projection.id : undefined).toBe("rules.tactic.consequence.forced_mate_after_move");
      expect(sealed.kind === "available" ? sealed.value.payload : undefined).toEqual(result.proof);
      expect(invokeEvidenceValueRoute("rules.tactic.consequence.forced_mate_after_move@1", { beforeFen: fen, breadth: sealedBreadth, maxAttackerMoves: 5 })).toMatchObject({ kind: "unavailable", reason: "horizon_above_four" });
      // A caller cannot hand the proof itself (or an unsealed breadth) to the factory.
      expect(() => invokeEvidenceValueRoute("rules.tactic.consequence.forced_mate_after_move@1", { beforeFen: fen, breadth: breadth as never, maxAttackerMoves: 1 })).toThrow(/refused its authority inputs/u);
    }
  });

  it("retains a legal escaping root reply when the bounded claim is refuted", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const breadth = replyBreadth(fen, "e2e4");
    const result = forcedMateAfterMove(fen, "e2e4", 1, breadth);
    expect(result).toMatchObject({ kind: "proof", proof: { proofStatus: "refuted" } });
    if (result.kind === "proof") expect(result.proof.rootReplies.length).toBeGreaterThan(0);
  });

  it("distinguishes horizon refusal and budget exhaustion from refutation", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const breadth = replyBreadth(fen, "e2e4");
    expect(forcedMateAfterMove(fen, "e2e4", 5, breadth)).toEqual({ kind: "unavailable", reason: "horizon_above_four", requestedHorizon: 5 });
    expect(forcedMateAfterMove(fen, "e2e4", 4, breadth, 1)).toMatchObject({ kind: "proof", proof: { proofStatus: "budget_exhausted", nodeCap: 1 } });
  });
});
