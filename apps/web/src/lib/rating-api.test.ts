import { describe, expect, it } from "vitest";

import { DrillApi } from "./api.js";

describe("rating API bindings", () => {
  it("binds own rating reads and classroom standing mutations without adding identity fields", async () => {
    const calls: { readonly url: string; readonly init?: RequestInit }[] = [];
    const api = new DrillApi("http://tabiya.test", async (input, init) => {
      const url = String(input);
      calls.push({ url, ...(init === undefined ? {} : { init }) });
      if (url.endsWith("/rating/history")) return Response.json({ periods: [], games: [] });
      if (url.endsWith("/rating")) return Response.json({ rating: null, disclosures: [] });
      if (url.endsWith("/marks")) return Response.json({ marks: [] });
      if (url.endsWith("/standing") && init?.method !== "POST") return Response.json({
        standing: { classroomId: "class / one", openedByLearnerId: "teacher", windowFrom: "2026-08-01T00:00:00.000Z", windowTo: null, openedAt: "2026-08-01T00:00:00.000Z", closedAt: null },
        limitation: "These games were played alone against a bot and nobody witnessed them.", entries: [],
      });
      return Response.json({ member: {} });
    });

    await api.rating();
    await api.ratingHistory();
    await api.learnerMarks();
    await api.cohortStanding("class / one");
    await api.updateCohortStanding("class / one", { op: "showRating" });

    expect(calls.map((call) => call.url)).toEqual([
      "http://tabiya.test/rating",
      "http://tabiya.test/rating/history",
      "http://tabiya.test/marks",
      "http://tabiya.test/cohorts/class%20%2F%20one/standing",
      "http://tabiya.test/cohorts/class%20%2F%20one/standing",
    ]);
    expect(JSON.parse(String(calls.at(-1)!.init!.body))).toEqual({ op: "showRating" });
    expect(JSON.parse(String(calls.at(-1)!.init!.body))).not.toHaveProperty("learnerId");
  });
});
