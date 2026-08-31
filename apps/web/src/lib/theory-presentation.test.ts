import { describe, expect, it } from "vitest";

import type { DrillRun } from "@chess-tabiya/runtime";

import type { AuthoredFeedbackItem } from "./api.js";
import { theoryVerdictSentence } from "./theory-presentation.js";

const run = {
  nodes: [{ id: "n1", moveSan: "Qd2" }],
} as unknown as DrillRun;

function item(deviationMistakes?: readonly string[]): Extract<AuthoredFeedbackItem, { kind: "theory_verdict" }> {
  return {
    kind: "theory_verdict",
    id: "theory#n1",
    revealedBy: { kind: "outcome", eventSeq: 1 },
    anchor: { nodeId: "n1", ply: 8, moveUci: "d1d2" },
    verdict: "classified_deviation",
    deviationClass: "concept_violation",
    ...(deviationMistakes === undefined ? {} : { deviationMistakes }),
  };
}

describe("theory verdict presentation", () => {
  it("keeps classifier and mistake tokens out of learner copy", () => {
    expect(theoryVerdictSentence(item(["timing", "plan"]), run)).toBe(
      "Ply 8, Qd2: the pack has authored commentary about this alternative.",
    );
    const sentence = theoryVerdictSentence(item(["tactical", "plan", "timing"]), run);
    expect(sentence).not.toMatch(/concept_violation|plan|timing|tactical/u);
  });

  it("renders absence without a placeholder", () => {
    expect(theoryVerdictSentence(item(), run)).toBe(
      "Ply 8, Qd2: the pack has authored commentary about this alternative.",
    );
  });

  it("does not expose the UCI anchor when the run lacks SAN", () => {
    expect(theoryVerdictSentence(item(), { nodes: [{ id: "n1", moveSan: null }] } as unknown as DrillRun)).toBe(
      "Ply 8, the recorded move: the pack has authored commentary about this alternative.",
    );
  });
});
