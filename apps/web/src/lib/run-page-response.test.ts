import { describe, expect, it } from "vitest";

import type { RunPage, RunSummary } from "./api.js";
import { assertRunPageResponse, legacyRunPage } from "./run-page-response.js";

const summary: RunSummary = {
  id: "run-one",
  title: "One rehearsal",
  sessionKind: "pack",
  packId: "pack-one",
  sessionDigest: "sha256:fixture",
  updatedAt: "2026-09-14T10:00:00.000Z",
  objectiveState: "active",
  branchCount: 1,
  recordedMoveCount: 2,
  viewerRole: "host",
  leaseHeldBy: { learnerId: "learner-one", handle: "one" },
};

describe("run page response authority", () => {
  it("accepts a page whose summaries and denominator match the requested window", () => {
    const page: RunPage = { runs: [summary], selection: { shown: 3, total: 7 } };
    expect(() => assertRunPageResponse(page, { limit: 2, offset: 2, priorIds: new Set(["run-zero"]) })).not.toThrow();
  });

  it.each([
    { runs: [summary], selection: { shown: 1, total: 0 } },
    { runs: [summary], selection: { shown: 2, total: 2 } },
    { runs: [summary, summary], selection: { shown: 2, total: 2 } },
    { runs: [{ ...summary, updatedAt: "not-a-date" }], selection: { shown: 1, total: 1 } },
    { runs: [{ ...summary, leaseHeldBy: { learnerId: "", handle: "one" } }], selection: { shown: 1, total: 1 } },
  ])("refuses malformed, duplicated or arithmetically crossed pages", (page) => {
    expect(() => assertRunPageResponse(page, { limit: 50, offset: 0 })).toThrow("Invalid run page");
  });

  it("refuses an existing identity and a page that promises more without advancing", () => {
    expect(() => assertRunPageResponse(
      { runs: [summary], selection: { shown: 2, total: 2 } },
      { limit: 50, offset: 1, priorIds: new Set([summary.id]) },
    )).toThrow("Invalid run page");
    expect(() => assertRunPageResponse(
      { runs: [], selection: { shown: 1, total: 2 } },
      { limit: 50, offset: 1 },
    )).toThrow("Invalid run page");
  });

  it("adapts the legacy list without claiming an unknown remainder", () => {
    expect(legacyRunPage([summary], 4)).toEqual({ runs: [summary], selection: { shown: 5, total: 5 } });
  });
});
