import { describe, expect, it } from "vitest";

import {
  HUMAN_MODEL_RUNG_DISCLAIMER,
  humanModelMaterialLimit,
  opponentStatus,
} from "./opponent-copy.js";

describe("opponent learner copy", () => {
  it("keeps human-like rungs distinct from chess ratings and strong-engine play", () => {
    expect(opponentStatus("human_common", 1800)).toBe("Human-like opponent · rung 1800");
    expect(opponentStatus("strong_engine")).toBe("Engine test · outside the human-like ladder");
    expect(HUMAN_MODEL_RUNG_DISCLAIMER).toContain("not FIDE, Lichess, or Chess.com ratings");
  });

  it("states the measured low-material limit only for the Maia ladder", () => {
    const tenPieces = "4k3/pp6/8/8/8/8/PP4PP/4K2R w - - 0 1";
    expect(humanModelMaterialLimit(tenPieces, "human_common")).toContain("ten pieces or fewer");
    expect(humanModelMaterialLimit(tenPieces, "strong_engine")).toBeUndefined();
    expect(humanModelMaterialLimit("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", "human_common")).toBeUndefined();
  });
});
