import { describe, expect, it } from "vitest";

import { canonicalFen, positionFromFen } from "../../packages/runtime/src/chess.js";
import { boundedReachability, observedMethodStages, parseMethodUci, type MethodPathStep } from "./method.js";

function path(start: string, moves: readonly string[]): readonly MethodPathStep[] {
  const board = positionFromFen(start);
  const steps: MethodPathStep[] = [];
  for (const moveUci of moves) {
    const beforeFen = canonicalFen(board);
    const move = parseMethodUci(moveUci);
    if (move === undefined || !board.isLegal(move)) throw new TypeError(`illegal fixture move ${moveUci}`);
    board.play(move);
    steps.push(Object.freeze({ moveUci, beforeFen, afterFen: canonicalFen(board) }));
  }
  return Object.freeze(steps);
}

describe("source-bounded observed endgame method stages", () => {
  it("recognizes the three Lucena bridge stages on the authored line", () => {
    const stages = observedMethodStages(path(
      "1K6/1P1k4/8/8/8/8/r7/2R5 w - - 0 1",
      ["c1d1", "d7e7", "d1d4", "a2a1", "b8c7", "a1c1", "c7b6", "c1b1", "b6c6", "b1c1", "c6b5", "c1b1", "d4b4"],
    ));
    expect(stages.map((stage) => stage.stage)).toEqual([
      "lucena_bridge_prepared",
      "lucena_king_excursion_started",
      "lucena_bridge_interposed",
    ]);
  });

  it("recognizes the Philidor fence-to-rear-check stages on the authored line", () => {
    const stages = observedMethodStages(path(
      "4k3/R7/7r/4K3/4P3/8/8/8 b - - 0 1",
      ["h6b6", "e5d5", "b6g6", "e4e5", "g6b6", "e5e6", "b6b1", "d5d6", "b1d1"],
    ));
    expect(stages.map((stage) => stage.stage)).toEqual([
      "philidor_pawn_entered_defender_third",
      "philidor_rear_rank_switch",
      "philidor_rear_check_delivered",
    ]);
  });

  it("recognizes the Vancura pawn-and-rook stage pair and rejects a losing rook move", () => {
    const canonical = "R7/6k1/P4r2/8/2K5/8/8/8 w - - 0 1";
    expect(observedMethodStages(path(canonical, ["a6a7", "f6a6"])).map((stage) => stage.stage)).toEqual([
      "vancura_pawn_entered_seventh",
      "vancura_rook_moved_behind",
    ]);
    expect(observedMethodStages(path(canonical, ["a6a7", "f6f7"])).map((stage) => stage.stage)).toEqual([
      "vancura_pawn_entered_seventh",
    ]);
  });

  it("does not manufacture stages from the same moves outside a matching setup lineage", () => {
    expect(observedMethodStages(path(
      "8/8/8/8/4pk2/8/R6r/4K3 b - - 0 1",
      ["e4e3"],
    ))).toEqual([]);
  });
});

describe("bounded reachability quantifiers", () => {
  const target = { target: true, turn: "opponent" as const };
  const miss = { turn: "opponent" as const, children: [] };

  it("separates cooperative possibility from forceability at an opponent fork", () => {
    expect(boundedReachability({ turn: "opponent", children: [target, miss] }, 1)).toEqual({
      possible: true,
      forceable: false,
      inevitable: false,
    });
  });

  it("separates a beneficiary-forced choice from inevitability", () => {
    expect(boundedReachability({ turn: "beneficiary", children: [target, miss] }, 1)).toEqual({
      possible: true,
      forceable: true,
      inevitable: false,
    });
  });

  it("respects the declared horizon", () => {
    expect(boundedReachability({ turn: "beneficiary", children: [{ turn: "opponent", children: [target] }] }, 1)).toEqual({
      possible: false,
      forceable: false,
      inevitable: false,
    });
  });
});
