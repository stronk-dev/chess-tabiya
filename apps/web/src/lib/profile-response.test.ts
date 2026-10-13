import { describe, expect, it } from "vitest";

import { profileFixture } from "./profile-fixture.test-support.js";
import { parseLearnerProfile, parseOpeningDetail, parseProfileHistory, parseSharedCard, parseStyleCardPage } from "./profile-response.js";

describe("learner profile response parser", () => {
  describe.each(["profile", "history", "opening"] as const)("%s history operands", (door) => {
    function parseRow(row: unknown) {
      const fixture = profileFixture();
      const history = { ...fixture.profile.history, items: [row] };
      if (door === "profile") return parseLearnerProfile({ profile: { ...fixture.profile, history } }).history.items[0];
      if (door === "opening") return parseOpeningDetail({ row: fixture.profile.openings.rows[0], games: history }).games.items[0];
      return parseProfileHistory({ history }).items[0];
    }

    it.each(["runId", "observedAt", "sessionKind", "packId", "state", "status", "playedDecisions", "opening", "outcome", "detail"])("refuses missing %s", (field) => {
      const row: Record<string, unknown> = { ...profileFixture().profile.history.items[0]! };
      delete row[field];
      expect(() => parseRow(row)).toThrow(new RegExp(`\\.${field}`));
    });

    it.each([
      ["observedAt", 42], ["observedAt", {}], ["sessionKind", "blitz"], ["packId", []],
      ["status", "victorious"], ["playedDecisions", -1], ["playedDecisions", 0.5],
      ["playedDecisions", "28"], ["detail", {}], ["opening", false],
    ])("refuses mistyped %s=%j", (field, value) => {
      const row = { ...profileFixture().profile.history.items[0]!, [field as string]: value };
      expect(() => parseRow(row)).toThrow();
    });

    it.each(["pending", "failed", "unavailable"])("retains a legitimate nullable %s row", (state) => {
      const row = { runId: "not-readable", observedAt: null, sessionKind: null, packId: null, state,
        status: state === "unavailable" ? "store_mismatch" : null, playedDecisions: null,
        opening: null, outcome: null, detail: "Not counted in this view." };
      expect(parseRow(row)).toEqual(row);
    });

    it("retains every operand of an admitted row", () => {
      const row = profileFixture().profile.history.items[0]!;
      expect(parseRow(row)).toEqual(row);
    });
  });

  it.each(["games", "decisions", "floor", "interval", "window"])("refuses a share with missing %s instead of asserting an incomplete numeric image", (field) => {
    const share: Record<string, unknown> = { metric: "m@1", title: "t", sentence: "s", scope: "x", text: "y", games: 25, decisions: 1, floor: 25, interval: { lower: 0, upper: 1, level: 0.95 }, window: { from: "a", to: "b" } };
    delete share[field];
    expect(() => parseSharedCard({ share })).toThrow();
  });

  it.each([
    { games: -1 }, { decisions: 0.5 }, { games: 24 },
    { interval: { lower: Number.NaN, upper: 1, level: 0.95 } },
    { interval: { lower: 1, upper: 0, level: 0.95 } },
    { interval: { lower: 0, upper: 1, level: 0.5 } },
    { interval: { lower: 0, upper: 1, level: 0.95, runId: "private" } },
    { window: { from: "a", to: "b", nodeId: "private" } },
    { composite: "player type" },
  ])("refuses invalid or widened measured share operands: %j", (change) => {
    const share = { metric: "m@1", title: "t", sentence: "s", scope: "x", text: "y", games: 25, decisions: 1, floor: 25, interval: { lower: 0, upper: 1, level: 0.95 }, window: { from: "a", to: "b" }, ...change };
    expect(() => parseSharedCard({ share })).toThrow();
  });

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
