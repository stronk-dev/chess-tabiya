import { describe, expect, it } from "vitest";

import {
  assertCohortStanding,
  assertLearnerMarks,
  assertRatingHistory,
  assertRatingView,
} from "./rating-response.js";

const published = {
  state: "published",
  interval: [{ kind: "band", value: 1410 }, { kind: "band", value: 1690 }],
  pointEstimate: { kind: "band", value: 1548 },
  ratedGames: 36,
  abandonedGames: 2,
} as const;

describe("rating response authority", () => {
  it("accepts the complete rating family and rejects crossed lifecycle values", () => {
    expect(() => assertRatingView({ rating: published, disclosures: ["Measured ladder."] })).not.toThrow();
    expect(() => assertRatingView({ rating: { ...published, state: "provisional" }, disclosures: [] })).toThrow("Invalid rating response");

    expect(() => assertRatingHistory({ periods: [], games: [{
      runId: "rated-one", calibrationId: "calibration-one", opponentBand: 1800,
      learnerSide: "black", state: "sealed", voidReason: null, result: "draw",
      terminalReason: "stalemate", plyCount: 72, periodNo: 3,
      startedAt: "2026-08-20T10:00:00.000Z", sealedAt: "2026-08-20T10:30:00.000Z",
    }] })).not.toThrow();
    expect(() => assertRatingHistory({ periods: [], games: [{
      runId: "rated-one", calibrationId: "calibration-one", opponentBand: 1800,
      learnerSide: "black", state: "sealed", voidReason: "assistance", result: "draw",
      terminalReason: "stalemate", plyCount: 72, periodNo: 3,
      startedAt: "2026-08-20T10:00:00.000Z", sealedAt: "2026-08-20T10:30:00.000Z",
    }] })).toThrow("Invalid rating history response");

    expect(() => assertLearnerMarks([{ mark: "silver", calibrationId: "calibration-one", runId: "rated-one", earnedAt: "2026-08-21T10:00:00.000Z" }])).not.toThrow();
    expect(() => assertLearnerMarks([{ mark: "silver", calibrationId: "calibration-one", runId: "rated-one", earnedAt: "not-a-date" }])).toThrow("Invalid learner marks response");
  });

  it("binds a standing to its classroom and verifies result arithmetic", () => {
    const standing = {
      standing: { classroomId: "club", openedByLearnerId: "teacher", windowFrom: "2026-08-01T00:00:00.000Z", windowTo: null, openedAt: "2026-08-01T00:00:00.000Z", closedAt: null },
      limitation: "These games were not witnessed.",
      entries: [{
        learnerId: "learner-a", handle: "alpha", marks: [],
        record: { wins: 2, draws: 1, losses: 1, games: 4, points: 2.5, abandoned: 0, byOpponentBand: [{ opponentBand: 1800, wins: 2, draws: 1, losses: 1, games: 4, points: 2.5 }] },
      }],
    };
    expect(() => assertCohortStanding(standing, "club")).not.toThrow();
    expect(() => assertCohortStanding(standing, "other-club")).toThrow("Invalid classroom standing response");
    expect(() => assertCohortStanding({ ...standing, entries: [{ ...standing.entries[0], record: { ...standing.entries[0]!.record, points: 4 } }] }, "club")).toThrow("Invalid classroom standing response");
  });
});
