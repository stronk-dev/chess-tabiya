import { describe, expect, it } from "vitest";

import { captureClassEvent, captureExchangeClass, legalExchange } from "./exchange.js";
import { transitionSemanticFacts } from "./transition.js";
import { Chess, normalizeMove } from "chessops/chess";
import { makeFen, parseFen } from "chessops/fen";
import { parseUci } from "chessops/util";

function after(fen: string, moveUci: string): string {
  const position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  position.play(normalizeMove(position, parseUci(moveUci)!));
  return makeFen(position.toSetup());
}

describe("legal-exchange@1", () => {
  it("retains free, poisoned and X-ray recapture trees", () => {
    const free = legalExchange("4k3/8/8/8/8/2n5/3P4/3QK3 w - - 0 1", "d2c3")!;
    expect(free.resultUnits).toBe(3);
    expect(free.captured).toMatchObject({ color: "black", role: "knight", square: "c3" });
    expect(free.chosenLine.map((step) => step.moveUci)).toEqual(["d2c3"]);
    expect(captureExchangeClass(free)).toBe("positive");

    const poisoned = legalExchange("r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1", "a1a7")!;
    expect(poisoned.resultUnits).toBe(-4);
    expect(poisoned.chosenLine.map((step) => step.moveUci)).toEqual(["a1a7", "a8a7"]);

    const xray = legalExchange("r3k3/8/8/p7/8/8/R7/Q3K3 w - - 0 1", "a2a5")!;
    expect(xray.resultUnits).toBe(1);
    expect(xray.branches.length).toBeGreaterThan(0);
  });

  it("uses legal recaptures: off-line pins and illegal king captures stay absent", () => {
    expect(legalExchange("4k3/4n3/2p5/1B6/8/8/8/4R1K1 w - - 0 1", "b5c6")!.resultUnits).toBe(1);
    expect(legalExchange("4k3/8/4r3/8/4p3/8/8/4R1K1 w - - 0 1", "e1e4")!.resultUnits).toBe(-4);
    expect(legalExchange("4k3/4q3/8/8/1B6/8/8/4R1K1 w - - 0 1", "b4e7")!.branches).toHaveLength(0);
  });

  it("accounts for promotion gain and rejects non-captures", () => {
    expect(legalExchange("4k2r/6P1/8/8/8/8/8/4K3 w - - 0 1", "g7h8q")!.resultUnits).toBe(13);
    expect(legalExchange("4k3/8/8/8/8/8/4P3/4K3 w - - 0 1", "e2e4")).toBeUndefined();
  });

  it("derives an arithmetic capture class from the exact capture identity", () => {
    const fen = "r3k3/p7/8/8/8/8/8/R3K3 w - - 0 1";
    const afterFen = after(fen, "a1a7");
    const capture = transitionSemanticFacts(fen, "a1a7", afterFen).find((fact) => fact.family === "capture");
    expect(capture?.family).toBe("capture");
    if (capture?.family !== "capture") throw new TypeError("capture fixture did not emit");
    expect(captureClassEvent({ before_fen: fen, move_uci: "a1a7", after_fen: afterFen, capture })).toMatchObject({ class: "negative", exchange: { resultUnits: -4 } });
  });
});
