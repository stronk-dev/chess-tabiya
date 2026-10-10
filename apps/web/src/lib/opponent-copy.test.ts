import { describe, expect, it } from "vitest";

import {
  HUMAN_MODEL_RUNG_DISCLAIMER,
  humanModelMaterialLimit,
  opponentStatus,
  runOpponentStatus,
} from "./opponent-copy.js";
import { BOT_PROFILE_CATALOG } from "@chess-tabiya/runtime";

describe("opponent learner copy", () => {
  it("D3664 labels model settings without inheriting calibration or measured personality", () => {
    expect(HUMAN_MODEL_RUNG_DISCLAIMER).toContain("model settings");
    expect(HUMAN_MODEL_RUNG_DISCLAIMER).not.toContain("calibrated inside Tabiya");
    for (const band of [1000, 1400, 1800, 2200]) {
      expect(opponentStatus("human_common", band)).toBe(`Human-move model · band ${band}`);
    }
    expect(opponentStatus("human_common")).toBe("Human-move model · band not recorded");
    for (const entry of BOT_PROFILE_CATALOG) {
      expect(runOpponentStatus({ mode: "human_common", profile: entry.reference })).toContain(`model band ${entry.reference.band}`);
      expect(runOpponentStatus({ mode: "human_common", profile: entry.reference })).not.toMatch(/calibrated|rating|human-like/iu);
    }
  });
  it("keeps human-like rungs distinct from chess ratings and strong-engine play", () => {
    expect(opponentStatus("human_common", 1800)).toBe("Human-move model · band 1800");
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
