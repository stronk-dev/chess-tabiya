import { describe, expect, it } from "vitest";

import { branchDisplayLabel, consequenceHorizon, objectiveChangeSummaries, objectiveStateLabel, phaseSummary, runOutcomeLabel } from "./run-copy.js";

describe("run copy", () => {
  it("translates runtime state into one learner vocabulary", () => {
    expect(objectiveStateLabel("active")).toBe("In progress");
    expect(objectiveStateLabel("degraded")).toBe("Objective weakened");
    expect(objectiveStateLabel("transitioned")).toBe("Next phase reached");
    expect(runOutcomeLabel("draw")).toBe("Game drawn");
  });

  it("collapses matching phases and explains a real authored/current difference", () => {
    expect(phaseSummary("opening", "opening")).toBe("Opening");
    expect(phaseSummary("opening", "middlegame")).toBe("Drill focus: Opening · Current position: Middlegame");
    expect(phaseSummary(undefined, "unclear")).toBe("Phase unclear");
  });

  it("turns machine branch labels and authored horizons into learner copy", () => {
    expect(branchDisplayLabel("alt-3", "Nf5", "keep pressure on e7")).toBe("Nf5 — keep pressure on e7");
    expect(branchDisplayLabel("Kingside try", "Nf5", "keep pressure on e7")).toBe("Kingside try");
    expect(consequenceHorizon()).toBe("Full game · until a rules-terminal result");
    expect(consequenceHorizon({ authoredBoundary: { plyHorizon: 6 } })).toBe("Consequence · up to 6 plies");
    expect(consequenceHorizon({ spine: [{ children: [{ children: [] }] }] })).toBe("Consequence · up to 2 plies");
  });

  it("keeps objective-change plumbing out of the learner summary", () => {
    expect(objectiveChangeSummaries([
      { reference: "rules:structure-outpost", text: "Tabiya's strict outpost detector condition holds." },
      { reference: "rules:structure-isolated-pawn", text: "Another detector condition." },
      { reference: "engine:sf", text: "Centipawn evidence recorded." },
      { reference: "tablebase:root", text: "Exact tablebase evidence recorded: category win; DTZ 4." },
    ])).toEqual([
      "A rules-based position feature affected the drill objective.",
      "A recorded engine assessment affected the drill objective.",
      "Exact endgame evidence affected the drill objective.",
    ]);
  });
});
