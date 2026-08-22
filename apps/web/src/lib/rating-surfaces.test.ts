// @vitest-environment happy-dom

import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import CohortStanding from "./CohortStanding.svelte";
import RatingScreen from "./RatingScreen.svelte";
import type { CohortStandingView, DrillClientApi, RatingView } from "./api.js";

function target(): HTMLElement {
  const element = document.createElement("div");
  document.body.append(element);
  return element;
}

afterEach(() => { document.body.replaceChildren(); });

describe("learner rating surfaces", () => {
  it("renders only server-shaped publication, event marks, disclosures, and recorded games", async () => {
    const rating: RatingView = {
      rating: {
        state: "published",
        interval: [{ kind: "band", value: 1410 }, { kind: "band", value: 1690 }],
        pointEstimate: { kind: "band", value: 1548 },
        ratedGames: 36,
        abandonedGames: 2,
      },
      disclosures: ["Band-calibrated scale (BCS); not FIDE, Lichess, or Chess.com.", "An interval is shown with every published estimate."],
    };
    const component = mount(RatingScreen, { target: target(), props: { api: {
      rating: async () => rating,
      ratingHistory: async () => ({ periods: [], games: [{
        runId: "rated-one", calibrationId: "calibration-one", opponentBand: 1800,
        learnerSide: "black", state: "sealed", voidReason: null, result: "draw",
        terminalReason: "stalemate", plyCount: 72, periodNo: 3,
        startedAt: "2026-08-20T10:00:00.000Z", sealedAt: "2026-08-20T10:30:00.000Z",
      }] }),
      learnerMarks: async () => [{ mark: "silver", calibrationId: "calibration-one", runId: "rated-two", earnedAt: "2026-08-21T10:00:00.000Z" }],
    } as unknown as DrillClientApi } });
    await vi.waitFor(() => expect(document.querySelector("h2")?.textContent).toContain("band 1548"));
    expect(document.body.textContent).toContain("band 1410 to band 1690");
    expect(document.body.textContent).toContain("Beat band 1800 on");
    expect(document.body.textContent).toContain("Band 1800");
    expect(document.body.textContent).toContain("not FIDE, Lichess, or Chess.com");
    expect(document.body.textContent).not.toContain("improved");
    await unmount(component);
  });

  it("does not invent a provisional label or point estimate when the server abstains", async () => {
    const component = mount(RatingScreen, { target: target(), props: { api: {
      rating: async () => ({ rating: null, disclosures: [] }),
      ratingHistory: async () => ({ periods: [], games: [] }),
      learnerMarks: async () => [],
    } as unknown as DrillClientApi } });
    await vi.waitFor(() => expect(document.body.textContent).toContain("No rated-game result has been recorded"));
    expect(document.body.textContent).not.toContain("Current publication");
    expect(document.body.textContent).not.toContain("1500");
    expect(document.body.textContent).not.toContain("provisional");
    await unmount(component);
  });
});

describe("classroom standing surface", () => {
  it("preserves server order, states the unwitnessed limitation, and requires informed publication", async () => {
    const limitation = "These games were played alone against a bot and nobody witnessed them.";
    const view: CohortStandingView = {
      standing: { classroomId: "class-one", openedByLearnerId: "teacher", windowFrom: "2026-08-01T00:00:00.000Z", windowTo: null, openedAt: "2026-08-01T00:00:00.000Z", closedAt: null },
      limitation,
      entries: [
        { learnerId: "learner-b", handle: "zebra", marks: [], record: { wins: 2, draws: 0, losses: 1, games: 3, points: 2, abandoned: 0, byOpponentBand: [] } },
        { learnerId: "learner-c", handle: "alpha", marks: [], record: { wins: 1, draws: 1, losses: 1, games: 3, points: 1.5, abandoned: 0, byOpponentBand: [] } },
      ],
    };
    const update = vi.fn(async () => {});
    const component = mount(CohortStanding, { target: target(), props: {
      api: { cohortStanding: async () => view, updateCohortStanding: update } as unknown as DrillClientApi,
      classroomId: "class-one", learnerId: "learner-a", role: "learner",
    } });
    await vi.waitFor(() => expect(document.body.textContent).toContain("@zebra"));
    expect(document.body.textContent).toContain(limitation);
    const handles = [...document.querySelectorAll("tbody th")].map((cell) => cell.textContent?.trim());
    expect(handles).toEqual(["@zebra", "@alpha"]);

    const join = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Join this standing")!;
    join.click();
    await tick();
    expect(document.querySelector(".confirmation")?.textContent).toContain(limitation);
    expect(update).not.toHaveBeenCalled();
    const publish = [...document.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent === "Publish my record")!;
    publish.click();
    await vi.waitFor(() => expect(update).toHaveBeenCalledWith("class-one", { op: "publish" }));
    await unmount(component);
  });
});
