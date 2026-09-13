import { describe, expect, it } from "vitest";

import { validAuthenticatedLearner } from "./auth-response.js";

describe("authenticated learner response", () => {
  it("accepts an identified learner with a dated account", () => {
    expect(validAuthenticatedLearner({
      id: "learner-1",
      handle: "reader",
      createdAt: "2026-09-13T12:00:00.000Z",
    })).toBe(true);
  });

  it.each([
    { id: "", handle: "reader", createdAt: "2026-09-13T12:00:00.000Z" },
    { id: "learner-1", handle: "", createdAt: "2026-09-13T12:00:00.000Z" },
    { id: "learner-1", handle: "reader", createdAt: "not-a-date" },
  ])("refuses an unusable identity %#", (learner) => {
    expect(validAuthenticatedLearner(learner)).toBe(false);
  });
});
