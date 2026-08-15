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
  it("renders every declared mistake in canonical order", () => {
    expect(theoryVerdictSentence(item(["timing", "plan"]), run)).toBe(
      "Ply 8, Qd2: the pack classifies this as concept_violation (plan, timing).",
    );
    const sentence = theoryVerdictSentence(item(["tactical", "plan", "timing"]), run);
    expect(sentence).toContain("(plan, timing, tactical)");
    expect(new Set(sentence.match(/plan|timing|tactical/g))).toEqual(new Set(["plan", "timing", "tactical"]));
  });

  it("renders absence without a placeholder", () => {
    expect(theoryVerdictSentence(item(), run)).toBe(
      "Ply 8, Qd2: the pack classifies this as concept_violation.",
    );
  });
});
