import { describe, expect, it } from "vitest";

import { LIVE_WORKFLOWS, liveBoardControlOptions, liveRunIneligibility, liveWorkflow, liveWorkflowOption } from "./live-creation.js";

describe("guided live-session creation", () => {
  it("maps every named workflow to one safe default and back", () => {
    expect(LIVE_WORKFLOWS.map((option) => option.id)).toEqual(["academy", "stream", "native_match", "position_arena"]);
    for (const option of LIVE_WORKFLOWS) {
      expect(liveWorkflow(option.kind, option.boardControl)).toBe(option.id);
      expect(liveWorkflowOption(option.id)).toBe(option);
      expect(option.summary).not.toBe("");
    }
  });

  it("keeps the invalid match board out of academy and stream advanced controls", () => {
    expect(liveBoardControlOptions("academy").map((option) => option.id)).toEqual(["host_directed", "free_claim", "rotation"]);
    expect(liveBoardControlOptions("stream").map((option) => option.id)).toEqual(["host_directed", "free_claim", "rotation"]);
    expect(liveBoardControlOptions("match").map((option) => option.id)).toEqual(["host_directed", "free_claim", "rotation", "match"]);
  });

  it("refuses native-match source runs before submission while leaving other workflows open", () => {
    expect(liveRunIneligibility({ sessionKind: "position", recordedMoveCount: 0 }, "native_match")).toBeUndefined();
    expect(liveRunIneligibility({ sessionKind: "pack", recordedMoveCount: 0 }, "native_match")).toMatch(/fresh position/u);
    expect(liveRunIneligibility({ sessionKind: "imported", recordedMoveCount: 0 }, "native_match")).toMatch(/fresh position/u);
    expect(liveRunIneligibility({ sessionKind: "position", recordedMoveCount: 1 }, "native_match")).toMatch(/already has recorded moves/u);
    expect(liveRunIneligibility({ sessionKind: "pack", recordedMoveCount: 12 }, "position_arena")).toBeUndefined();
  });
});
