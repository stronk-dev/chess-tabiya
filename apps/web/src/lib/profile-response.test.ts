import { describe, expect, it } from "vitest";

import { profileFixture } from "./profile-fixture.test-support.js";
import { parseLearnerProfile, parseSharedCard, parseStyleCardPage } from "./profile-response.js";

describe("learner profile response parser", () => {
  it("accepts the server's profile shape", () => {
    const profile = parseLearnerProfile(profileFixture());
    expect(profile.style.cards).toHaveLength(3);
    expect(profile.privacy.visibility).toBe("private");
  });

  it("refuses a measured card below its own floor (criterion 15 at the client boundary)", () => {
    const fixture = profileFixture();
    const card = fixture.profile.style.cards[0]! as Record<string, unknown>;
    card.games = 24;
    expect(() => parseLearnerProfile(fixture)).toThrow(/style\.cards\[0\]\.games/u);
  });

  it("refuses a non-private profile, an unknown tier rule and result counts that do not sum to games", () => {
    const publicProfile = profileFixture();
    (publicProfile.profile.privacy as Record<string, unknown>).visibility = "public";
    expect(() => parseLearnerProfile(publicProfile)).toThrow(/privacy/u);
    const tier = profileFixture();
    (tier.profile.style.cards[0]!.tier as Record<string, unknown>).rule = "top_decile_badge@1";
    expect(() => parseLearnerProfile(tier)).toThrow(/tier\.rule/u);
    const results = profileFixture();
    results.profile.openings.rows[0]!.results.win = 5;
    expect(() => parseLearnerProfile(results)).toThrow(/results/u);
  });

  it("refuses a truncated drill-down that does not say how much it withheld", () => {
    const fixture = profileFixture();
    const card = fixture.profile.style.cards[0]!;
    expect(() => parseStyleCardPage({ card, contributors: { ...card.contributors, total: 3 } })).toThrow(/hiddenCount/u);
  });

  it("refuses a shared card carrying run or position identity", () => {
    const share = { metric: "m@1", title: "t", sentence: "s", scope: "x", text: "y", games: 25, decisions: 1, floor: 25, interval: { lower: 0, upper: 1, level: 0.95 }, window: { from: "a", to: "b" } };
    expect(parseSharedCard({ share }).metric).toBe("m@1");
    expect(() => parseSharedCard({ share: { ...share, runId: "run-1" } })).toThrow(/runId/u);
  });
});
