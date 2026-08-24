import { describe, expect, it } from "vitest";

import {
  attemptVerdictLabel,
  corpusPopulationLabel,
  publishedBandInterval,
  publishedBandLabel,
  recordedEvaluationTrajectory,
  storyMomentLabel,
} from "./learner-copy.js";

describe("learner-facing domain copy", () => {
  it("never exposes story and attempt enum identifiers", () => {
    expect(storyMomentLabel("eval_pivot")).toBe("Evaluation shift");
    expect(storyMomentLabel("option_collapse")).toBe("Options narrowed");
    expect(attemptVerdictLabel("stable")).toBe("Objective held");
    expect(attemptVerdictLabel("unstable")).toBe("Objective not held");
    expect(attemptVerdictLabel("open")).toBe("Objective unresolved");
  });

  it("renders recorded evaluations in pawn units and names their perspective", () => {
    expect(recordedEvaluationTrajectory(267, -34)).toBe(
      "Recorded evaluation from White's side: +2.67 → −0.34 pawns",
    );
  });

  it("turns the explorer population into a readable disclosure", () => {
    expect(corpusPopulationLabel({
      source: "lichess-explorer",
      ratings: [1600, 1800],
      speeds: ["blitz", "rapid"],
      since: "2020-01",
      until: "2026-08",
    })).toBe("Lichess games · rating groups 1600, 1800 · blitz, rapid · 2020-01 to 2026-08");
  });

  it("uses one band vocabulary for point and interval values", () => {
    expect(publishedBandLabel({ kind: "below", band: 1000 })).toBe("below band 1000");
    expect(publishedBandInterval({
      state: "bounded",
      interval: [{ kind: "band", value: 1389 }, { kind: "above", band: 2200 }],
      ratedGames: 8,
      abandonedGames: 0,
    })).toBe("band 1389 to above band 2200");
  });
});
