// DISPOSABLE research fixtures — D872/Wave C. Not production tests.
import { describe, expect, it } from "vitest";

import type { ResearchTriple } from "../research-chess/populations.js";
import { rowsFromMoves } from "./sequence.test.js";
import {
  attractedPieceSequence,
  defenderDutyDisplacedSequence,
  squareVacatedForSliderSequence,
} from "./semantic-splits.js";

function triple(fen: string, moves: readonly [string, string, string]): ResearchTriple {
  return rowsFromMoves(fen, moves) as ResearchTriple;
}

describe("D872 split attraction, deflection and clearance events", () => {
  it("retains the attracted piece and square instead of inferring intent", () => {
    const positive = triple("4k3/8/4B3/8/8/8/8/R5K1 w - - 0 1", ["e6d7", "e8d7", "a1d1"]);
    expect(attractedPieceSequence(positive)).toBe(true);
    const declined = triple("4k3/8/4B3/8/8/8/8/R5K1 w - - 0 1", ["e6d7", "e8f8", "a1d1"]);
    expect(attractedPieceSequence(declined)).toBe(false);
    // Cross-review fixture (semantic-collectors buildability review, 2026-08-22): the
    // REJECTED any-piece attraction form (100% sensitivity, 19.0% controls) would fire
    // here — a knight captures the bait and is then attacked on the arrival square. The
    // pinned heavy-piece (K/Q/R) form must refuse it: the permanent hard negative wired
    // as an executable discrimination, not a sentence.
    const minorPiece = triple("4k3/8/1n6/8/2B5/8/8/R5K1 w - - 0 1", ["c4d5", "b6d5", "a1d1"]);
    expect(attractedPieceSequence(minorPiece)).toBe(false);
  });

  it("requires a defender duty, inducement and later target capture", () => {
    const positive = triple("1B5k/r3q3/2n5/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e7"]);
    expect(defenderDutyDisplacedSequence(positive)).toBe(true);
    const noSecondDuty = triple("1B5k/r7/2n1q3/8/8/8/8/4R1K1 w - - 0 1", ["b8a7", "c6a7", "e1e6"]);
    expect(defenderDutyDisplacedSequence(noSecondDuty)).toBe(false);
  });

  it("names square clearance separately from opening a ray onto a target", () => {
    const positive = triple("4k3/8/8/8/8/8/8/RN2K3 w - - 0 1", ["b1c3", "e8d7", "a1b1"]);
    expect(squareVacatedForSliderSequence(positive)).toBe(true);
    const unrelated = triple("4k3/8/8/8/8/2N5/8/R3K3 w - - 0 1", ["c3b5", "e8d7", "a1b1"]);
    expect(squareVacatedForSliderSequence(unrelated)).toBe(false);
  });
});
