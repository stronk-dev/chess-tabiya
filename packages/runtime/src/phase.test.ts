import { INITIAL_FEN } from "chessops/fen";
import { describe, expect, it } from "vitest";

import { classifyPhase, developmentReading } from "./phase.js";

describe("phase and development readings", () => {
  it("retains role-matched undeveloped minor identities without changing the phase-band count", () => {
    const reading = developmentReading(INITIAL_FEN);
    expect(reading.conventionId).toBe("development@1");
    expect(reading.undeveloped.white).toEqual([
      { square: "b1", role: "knight" },
      { square: "g1", role: "knight" },
      { square: "c1", role: "bishop" },
      { square: "f1", role: "bishop" },
    ]);
    expect(classifyPhase(INITIAL_FEN).undevelopedMinors.white).toBe(4);
  });

  it("does not call a knight on a bishop home square undeveloped", () => {
    const fen = "4k3/8/8/8/8/8/8/4KN2 w - - 0 1";
    expect(developmentReading(fen).undeveloped.white).toEqual([]);
    expect(classifyPhase(fen).undevelopedMinors.white).toBe(1);
  });
});
