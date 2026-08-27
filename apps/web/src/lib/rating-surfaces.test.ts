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
    const start = vi.fn(async () => {});
    const component = mount(RatingScreen, { target: target(), props: { api: {
      rating: async () => ({ rating: null, disclosures: [] }),
      ratingHistory: async () => ({ periods: [], games: [] }),
      learnerMarks: async () => [],
    } as unknown as DrillClientApi, onStart: start } });
    await vi.waitFor(() => expect(document.body.textContent).toContain("No rated-game result has been recorded"));
    expect(document.body.textContent).toContain("Start rated game");
    const selects = [...document.querySelectorAll<HTMLSelectElement>("select")];
    selects[0]!.value = "1800"; selects[0]!.dispatchEvent(new Event("change", { bubbles: true }));
    selects[1]!.value = "black"; selects[1]!.dispatchEvent(new Event("change", { bubbles: true }));
    document.querySelector<HTMLButtonElement>("button[type=submit]")!.click();
    await vi.waitFor(() => expect(start).toHaveBeenCalledWith(1800, "black"));
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
        {
          learnerId: "learner-b",
          handle: "zebra",
          marks: [{ mark: "gold", band: 2200, calibrationId: "calibration-a", earnedAt: "2026-08-12T00:00:00.000Z" }],
          record: { wins: 2, draws: 0, losses: 1, games: 3, points: 2, abandoned: 0, byOpponentBand: [] },
          rating: {
            state: "provisional",
            interval: [{ kind: "band", value: 1420 }, { kind: "band", value: 1780 }],
            ratedGames: 3,
            abandonedGames: 0,
            group: "not-publishable",
          },
        },
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
    expect(document.body.textContent).toContain("Learners choose whether to publish their own result record");
    expect(document.body.textContent).toContain("Teachers can open and manage the window, but they never publish or appear");
    expect(document.body.textContent).toContain("Beat band 2200");
    expect(document.querySelector("tbody tr td:last-child")?.textContent).toBe("Not shown");
    expect(document.querySelector("tbody tr td:last-child")?.textContent).not.toContain("Interval");
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
