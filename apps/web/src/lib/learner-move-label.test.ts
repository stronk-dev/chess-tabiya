import { describe, expect, it } from "vitest";

import { learnerMoveLabel } from "./learner-move-label.js";

describe("learner move labels", () => {
  it.each(["Qd2", "O-O", "exd8=Q+", "Nf3"])("keeps SAN %s", (san) => {
    expect(learnerMoveLabel(san)).toBe(san);
  });

  it.each([undefined, null, "", "  ", "d1d2", "a7a8q"])(
    "fails closed instead of exposing runtime notation for %s",
    (san) => {
      expect(learnerMoveLabel(san)).toBe("Move notation unavailable");
    },
  );

  it("supports context-specific honest copy", () => {
    expect(learnerMoveLabel("e2e4", "the recorded move")).toBe("the recorded move");
  });
});
