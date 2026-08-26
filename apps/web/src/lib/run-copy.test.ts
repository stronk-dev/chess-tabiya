import { describe, expect, it } from "vitest";

import { objectiveStateLabel, runOutcomeLabel } from "./run-copy.js";

describe("run copy", () => {
  it("translates runtime state into one learner vocabulary", () => {
    expect(objectiveStateLabel("active")).toBe("In progress");
    expect(objectiveStateLabel("degraded")).toBe("Objective weakened");
    expect(objectiveStateLabel("transitioned")).toBe("Next phase reached");
    expect(runOutcomeLabel("draw")).toBe("Game drawn");
  });
});
