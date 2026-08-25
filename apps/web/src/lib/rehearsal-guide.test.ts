import { describe, expect, it } from "vitest";

import { commitMove, createRun, rewind, type DrillRun } from "@chess-tabiya/runtime";

import { rehearsalGuideStep } from "./rehearsal-guide.js";

const at = "2026-08-25T12:00:00.000Z";

function initialRun(): DrillRun {
  return createRun({
    id: "first-rehearsal",
    session: {
      kind: "position",
      start: {
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        side: "white",
      },
      feedbackPolicy: "attempt_end",
      opponentPolicy: { mode: "human_common" },
    },
    sessionDigest: `sha256:${"1".repeat(64)}`,
    policyConfig: {
      seedMode: "fixed",
      locus: { executedAt: "server", engineIds: [], modelIds: [] },
    },
    seed: 1,
    createdAt: at,
  });
}

function closeConsequence(run: DrillRun): DrillRun {
  return {
    ...run,
    events: [
      ...run.events,
      {
        seq: run.events.at(-1)!.seq + 1,
        at,
        type: "feedback.generated",
        data: { nodeId: run.activeCursor.nodeId, evidenceRefs: ["rules:rehearsal-boundary"] },
      },
    ],
  };
}

describe("rehearsalGuideStep", () => {
  it("follows the actual commit, consequence, rewind, branch, and compare events", () => {
    const initial = initialRun();
    expect(rehearsalGuideStep(initial)).toMatchObject({ stage: "decide", ordinal: 1 });

    const first = commitMove(initial, "e2e4", { at }).run;
    expect(rehearsalGuideStep(first)).toMatchObject({ stage: "first_consequence", ordinal: 2 });

    const firstClosed = closeConsequence(first);
    expect(rehearsalGuideStep(firstClosed)).toMatchObject({
      stage: "rewind",
      ordinal: 3,
      rewindNodeId: initial.activeCursor.nodeId,
    });

    const rewound = rewind(firstClosed, initial.activeCursor.nodeId, at).run;
    expect(rehearsalGuideStep(rewound)).toMatchObject({ stage: "alternative", ordinal: 3 });

    const second = commitMove(rewound, "d2d4", { at }).run;
    expect(second.events.some((event) => event.type === "branch.forked")).toBe(true);
    expect(rehearsalGuideStep(second)).toMatchObject({ stage: "second_consequence", ordinal: 4 });

    const secondClosed = closeConsequence(second);
    expect(rehearsalGuideStep(secondClosed)).toMatchObject({
      stage: "compare",
      ordinal: 4,
      compareBranchIds: [initial.activeCursor.branchId, second.activeCursor.branchId],
    });
  });

  it("never offers rewind before a recorded consequence boundary", () => {
    const first = commitMove(initialRun(), "e2e4", { at }).run;
    const step = rehearsalGuideStep(first);
    expect(step.stage).toBe("first_consequence");
    expect(step).not.toHaveProperty("rewindNodeId");
  });
});
