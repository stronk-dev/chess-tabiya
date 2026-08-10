import { describe, expect, it } from "vitest";

import {
  boardModel,
  promotionRequest,
  promotionUci,
} from "./board-model.js";

describe("board model", () => {
  it("derives orientation, legal destinations, last move, and check", () => {
    const initial = boardModel(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "black",
      "e7e5",
    );
    expect(initial.orientation).toBe("black");
    expect(initial.turnColor).toBe("white");
    expect(initial.dests.get("e2")).toEqual(["e3", "e4"]);
    expect(initial.lastMove).toEqual(["e7", "e5"]);
    expect(initial.check).toBe(false);

    const checked = boardModel(
      "4k3/8/8/8/8/8/8/4R1K1 b - - 0 1",
      "white",
    );
    expect(checked.check).toBe(true);
  });

  it("holds promotion moves for an explicit piece choice", () => {
    const request = promotionRequest(
      "7k/P7/8/8/8/8/8/7K w - - 0 1",
      "a7",
      "a8",
    );
    expect(request).toMatchObject({
      baseUci: "a7a8",
      roles: ["queen", "rook", "bishop", "knight"],
    });
    expect(promotionUci(request!, "knight")).toBe("a7a8n");
    expect(
      promotionRequest(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        "e2",
        "e4",
      ),
    ).toBeUndefined();
  });
});
