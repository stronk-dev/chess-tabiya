import { describe, expect, it } from "vitest";

import { parseDifficultRoots, parseDueQueue, parseProgressAttempts, parseProgressMilestones, parseProgressRecommendations, parseProgressSchedules, parseRelatedProgress, progressRecommendationSentence } from "./progress-response.js";

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

describe("return-scheduling response authority (rfc/return-scheduling.md)", () => {
  const population = { source: "lichess-explorer", ratings: [1600], speeds: ["blitz"], since: "2023-10", until: "2026-09" };
  const due = (id: string, kind: "blocked" | "varied", dueAt: string, games: number | null) => ({
    id, sessionKind: "position", packId: null, kind, variant: null, dueAt, sourceRunId: null,
    frequency: games === null ? null : { games, population },
  });

  it("accepts a queue re-ordered by frequency only within one due date", () => {
    const page = parseDueQueue({ schedules: [
      due("blocked", "blocked", "2026-09-20T23:00:00.000Z", null),
      due("common", "varied", "2026-09-19T20:00:00.000Z", 90_000),
      due("rare", "varied", "2026-09-19T08:00:00.000Z", 150),
      due("later", "varied", "2026-09-20T08:00:00.000Z", 10),
    ], waiting: 0, intakeLimit: 20 });
    expect(page.schedules.map((schedule) => schedule.id)).toEqual(["blocked", "common", "rare", "later"]);
    expect(page.schedules[1]!.frequency).toMatchObject({ games: 90_000 });
  });

  it("refuses a queue that moves a later due date or a varied return ahead", () => {
    expect(() => parseDueQueue({ schedules: [
      due("common-later", "varied", "2026-09-21T08:00:00.000Z", 90_000),
      due("rare-earlier", "varied", "2026-09-20T08:00:00.000Z", 150),
    ], waiting: 0, intakeLimit: 20 })).toThrow(/across a due date/u);
    expect(() => parseDueQueue({ schedules: [
      due("varied", "varied", "2026-09-19T08:00:00.000Z", 1),
      due("blocked", "blocked", "2026-09-19T08:00:00.000Z", null),
    ], waiting: 0, intakeLimit: 20 })).toThrow(/across a due date/u);
  });

  it("holds the intake arithmetic and the closed frequency shape", () => {
    expect(() => parseDueQueue({ schedules: [due("a", "varied", at, null)], waiting: 2, intakeLimit: 20 })).toThrow(/below its intake limit/u);
    expect(() => parseDueQueue({ schedules: [due("a", "varied", at, null), due("b", "varied", at, null)], waiting: 0, intakeLimit: 1 })).toThrow(/exceeds/u);
    expect(() => parseDueQueue({ schedules: [{ ...due("a", "varied", at, 5), frequency: { games: 5, population, sharePct: 12.5 } }], waiting: 0, intakeLimit: 20 })).toThrow(/invalid shape/u);
    expect(() => parseDueQueue({ schedules: [], waiting: 0 })).toThrow(/invalid shape/u);
    expect(parseDueQueue({ schedules: [due("a", "varied", at, null)], waiting: 3, intakeLimit: 1 })).toMatchObject({ waiting: 3 });
  });

  it("accepts counted difficult roots and refuses a ratio, a level or an under-threshold count", () => {
    const root = { sessionKind: "pack", packId: "pack", unstableCount: 3, lastUnstableAt: at, runs: [{ runId: "run", endedAt: at }] };
    expect(parseDifficultRoots({ threshold: 3, total: 1, roots: [root] }).roots[0]).toMatchObject({ unstableCount: 3 });
    expect(() => parseDifficultRoots({ threshold: 3, total: 1, roots: [{ ...root, unstableCount: 2 }] })).toThrow(/>= 3/u);
    expect(() => parseDifficultRoots({ threshold: 3, total: 1, roots: [{ ...root, attemptCount: 5 }] })).toThrow(/invalid shape/u);
    expect(() => parseDifficultRoots({ threshold: 3, total: 1, roots: [{ ...root, ladderIndex: 2 }] })).toThrow(/invalid shape/u);
    expect(() => parseDifficultRoots({ threshold: 3, total: 0, roots: [root] })).toThrow(/eligible total/u);
    expect(() => parseDifficultRoots({ threshold: 3, total: 1, roots: [{ ...root, runs: [] }] })).toThrow(/non-empty/u);
  });
});
