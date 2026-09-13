import { describe, expect, it } from "vitest";

import { parseProgressAttempts, parseProgressMilestones, parseProgressRecommendations, parseProgressSchedules, parseRelatedProgress, progressRecommendationSentence } from "./progress-response.js";

const at = "2026-09-14T12:00:00.000Z";

describe("progress response authority", () => {
  it("accepts and freezes the five closed projections", () => {
    expect(parseProgressAttempts({ attempts: [{ runId: "run", branchId: "main", packId: "pack", branchLabel: "Main", attemptNo: 1, countable: true, graded: true, verdict: "stable", result: "win", userPlyCount: 2, origin: "fresh", endedAt: at }] })[0]).toMatchObject({ runId: "run", verdict: "stable" });
    expect(parseProgressAttempts({ attempts: [{ runId: "new-run", branchId: "main", packId: null, branchLabel: "Main", attemptNo: 0, countable: false, graded: false, verdict: "open", result: null, userPlyCount: 0, origin: "fresh", endedAt: at }] })[0]).toMatchObject({ attemptNo: 0, countable: false });
    expect(parseProgressSchedules({ schedules: [{ id: "due", sessionKind: "pack", packId: "pack", kind: "varied", variant: null, dueAt: at, sourceRunId: "run" }] })[0]).toMatchObject({ id: "due" });
    expect(parseProgressMilestones({ milestones: [{ kind: "first_attempt", occurredAt: at, link: { runId: "run", branchId: "main" } }] })[0]?.sentence).toBe("First preserved attempt.");
    expect(parseRelatedProgress({ related: [{ relation: "same_position", runId: "other", branchId: "main", attemptCount: 2 }] }, "run")).toHaveLength(1);
    const page = parseProgressRecommendations({ recommendations: [{ kind: "shape_encounter", shapeId: "shape", shapeName: "Open file", runCount: 1, runIds: ["run"], packIds: ["pack"] }], selection: { shown: 1, total: 2 } });
    expect(progressRecommendationSentence(page.recommendations[0]!)).toContain("Open file");
    expect(Object.isFrozen(page.recommendations)).toBe(true);
  });

  it("refuses extras, duplicate identities, invalid lifecycle arithmetic and provider prose", () => {
    expect(() => parseProgressAttempts({ attempts: [{ runId: "run", branchId: "main", packId: null, branchLabel: "Main", attemptNo: 1, countable: false, graded: false, verdict: "stable", result: null, userPlyCount: 0, origin: "fresh", endedAt: at }] })).toThrow(/grades an ungraded/u);
    expect(() => parseProgressSchedules({ schedules: [{ id: "due", sessionKind: "pack", packId: null, kind: "blocked", variant: null, dueAt: at, sourceRunId: null }] })).toThrow(/pack identity/u);
    expect(() => parseProgressMilestones({ milestones: [{ kind: "first_attempt", occurredAt: at, sentence: "Injected", link: { runId: "run", branchId: "main" } }] })).toThrow(/invalid shape/u);
    expect(() => parseRelatedProgress({ related: [{ relation: "same_position", runId: "run", branchId: "main", attemptCount: 1 }] }, "run")).toThrow(/source run/u);
    expect(() => parseProgressRecommendations({ recommendations: [{ kind: "shape_encounter", shapeId: "shape", shapeName: "Open file", runCount: 2, runIds: ["run"], packIds: [], sentence: "Injected" }], selection: { shown: 1, total: 1 } })).toThrow(/invalid shape/u);
  });

  it("refuses duplicate rows, impossible selection counts and noncanonical time", () => {
    const attempt = { runId: "run", branchId: "main", packId: null, branchLabel: "Main", attemptNo: 0, countable: false, graded: false, verdict: "open", result: null, userPlyCount: 0, origin: "fresh", endedAt: at };
    expect(() => parseProgressAttempts({ attempts: [attempt, attempt] })).toThrow(/duplicate/u);
    expect(() => parseProgressSchedules({ schedules: [{ id: "due", sessionKind: "position", packId: null, kind: "blocked", variant: null, dueAt: "tomorrow", sourceRunId: null }] })).toThrow(/canonical UTC/u);
    expect(() => parseProgressRecommendations({ recommendations: [], selection: { shown: 1, total: 1 } })).toThrow(/arithmetic/u);
  });
});
