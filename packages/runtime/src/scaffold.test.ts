import { describe, expect, it } from "vitest";
import { Chess } from "chessops/chess";
import { parseFen } from "chessops/fen";

import { runtimeBuildInfo } from "./index.js";

describe("runtime scaffold", () => {
  it("exposes the shared package to Node and browser consumers", () => {
    expect(runtimeBuildInfo).toEqual({
      packageName: "@chess-tabiya/runtime",
      runSchemaVersion: "0.9",
    });
  });

  it("loads the pinned chess rules dependency", () => {
    const setup = parseFen(
      "r1bqkbnr/ppp2Qpp/2np4/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4",
    ).unwrap();
    const position = Chess.fromSetup(setup).unwrap();

    expect(position.isCheckmate()).toBe(true);
  });
});
