// @vitest-environment happy-dom

import { refusedTermsIn, SKILLS_SURFACE_FORBIDDEN, STYLE_UNDECLARED_COMPARISON_TERMS } from "@chess-tabiya/runtime";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DrillClientApi } from "./api.js";
import { profileFixture } from "./profile-fixture.test-support.js";
import { parseLearnerProfile, parseObservationDetail, parseOpeningDetail, parseStyleCardPage } from "./profile-response.js";
import ProfileScreen from "./ProfileScreen.svelte";

afterEach(() => document.body.replaceChildren());

async function settle(): Promise<void> {
  for (let index = 0; index < 5; index += 1) { await Promise.resolve(); await tick(); }
}

function render(api: Partial<DrillClientApi>, onNavigate = vi.fn()) {
  const target = document.createElement("div");
  document.body.append(target);
  const component = mount(ProfileScreen, { target, props: { api: api as DrillClientApi, onNavigate } });
  return { target, component, onNavigate };
}

function button(target: HTMLElement, name: string): HTMLButtonElement {
  const found = [...target.querySelectorAll("button")].find((candidate) => candidate.textContent?.trim() === name);
  if (found === undefined) throw new Error(`No button named ${name}`);
  return found;
}

describe("profile surface", () => {
  it("renders measured and abstaining cards with their own floors, and blocked reasons by name", async () => {
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()) });
    await settle();
    const text = target.textContent ?? "";
    expect(text).toContain("You reached the declared fianchetto setup in 10 of 25 measured games (95% interval 0.22 to 0.60). This card's floor is 25 games.");
    expect(text).toContain("This card's floor is 50 games; 25 measured.");
    expect(text).toContain("rfc/recorded-clocks.md Discharge D4");
    expect(text).toContain("0.22 to 0.60 (95%, 1000 game resamples)");
    expect(text).toContain("25 of your 26 saved runs are counted");
    expect(text).toContain("No win rate is shown");
    expect(text).toContain("1 won, 1 drawn, 0 lost, 1 without a recorded result");
    // No universal badge: each card states its own floor.
    expect(target.querySelectorAll(".habit-card")).toHaveLength(3);
    expect(text.match(/This card's floor/gu)?.length).toBeGreaterThanOrEqual(3);
    unmount(component);
  });

  it("drills a card into its runs and moves, says how many are withheld, and opens the run", async () => {
    const fixture = profileFixture();
    const learnerProfileStyle = vi.fn(async (_metric: string, offset = 0) => parseStyleCardPage({
      card: fixture.profile.style.cards[0],
      contributors: { total: 10, shown: fixture.profile.style.cards[0]!.contributors.shown.slice(0, offset === 0 ? 5 : 5), hiddenCount: offset === 0 ? 5 : 0 },
    }));
    const { target, component, onNavigate } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileStyle });
    await settle();
    button(target, "Show the moves behind this").click();
    await settle();
    expect(learnerProfileStyle).toHaveBeenCalledWith("fianchetto_setup_rate", 0, 25);
    expect(target.textContent).toContain("Showing 5 of 10; 5 more not shown.");
    expect(target.textContent).toContain("Move 2. Bg2 (ply 3)");
    const review = [...target.querySelectorAll("ol[aria-label='Fianchetto setup reached: contributing moves'] button")].find((item) => item.textContent === "Open game review") as HTMLButtonElement;
    review.click();
    expect(onNavigate).toHaveBeenCalledWith("/review/game/run-0?node=run-0-n3");
    unmount(component);
  });

  it("loads every opening game across pages, holds the current list on failure and retries the same offset", async () => {
    const fixture = profileFixture();
    const row = fixture.profile.openings.rows[0]!;
    const games = Array.from({ length: 103 }, (_, index) => ({ ...fixture.profile.history.items[0]!, runId: `opening-${index}` }));
    const openingRow = { ...row, games: 103, results: { win: 103, draw: 0, loss: 0, noResult: 0 } };
    let fail = true;
    const learnerProfileOpening = vi.fn(async (_key: string, offset = 0) => {
      if (offset === 100 && fail) { fail = false; throw new Error("offline"); }
      return parseOpeningDetail({ row: openingRow, games: { total: 103, offset, items: games.slice(offset, offset + 100), hiddenCount: Math.max(0, 3 - offset) } });
    });
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileOpening });
    await settle();
    button(target, "Show these games").click();
    await settle();
    const list = target.querySelector("ol[aria-label='C50 Italian Game: games']")!;
    expect(list.children).toHaveLength(100);
    button(target, "Show more games").click();
    await settle();
    expect(list.children).toHaveLength(100);
    expect(target.querySelector(".opening-list [role=alert]")?.textContent).toContain("Try again");
    button(target, "Show more games").click();
    await settle();
    expect(list.children).toHaveLength(103);
    expect(learnerProfileOpening.mock.calls.map((call) => call[1])).toEqual([0, 100, 100]);
    expect(target.querySelector(".opening-list [role=alert]")).toBeNull();
    expect(target.textContent).toContain("Showing 103 of 103 games.");
    unmount(component);
  });

  it("paginates observation moves, prevents duplicate pending requests and retains exact node links", async () => {
    const fixture = profileFixture();
    const row = { ...fixture.profile.observations.rows[0]!, occurred: 101, opportunities: 201, byPhase: [{ phase: "opening", occurred: 101, opportunities: 201 }] };
    const refs = Array.from({ length: 101 }, (_, index) => ({ runId: "same-run", nodeId: `move-${index}`, ply: index + 1, moveSan: "e4", observedAt: "2026-10-07T10:00:00.000Z" }));
    let release!: () => void;
    const hold = new Promise<void>((resolve) => { release = resolve; });
    const learnerProfileObservation = vi.fn(async (_key: string, offset = 0) => {
      if (offset === 100) await hold;
      return parseObservationDetail({ row, opportunities: row.opportunities, occurred: { total: 101, offset, items: refs.slice(offset, offset + 100), hiddenCount: Math.max(0, 1 - offset) } });
    });
    const { target, component, onNavigate } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileObservation });
    await settle();
    button(target, "Show moves").click();
    await settle();
    const more = button(target, "Show more moves");
    more.click(); more.click();
    await settle();
    expect(learnerProfileObservation).toHaveBeenCalledTimes(2);
    expect(more.disabled).toBe(true);
    release();
    await settle();
    const list = target.querySelector("ol[aria-label='open file — gained: moves']")!;
    expect(list.children).toHaveLength(101);
    (list.lastElementChild!.querySelector("button") as HTMLButtonElement).click();
    expect(onNavigate).toHaveBeenCalledWith("/review/game/same-run?node=move-100");
    expect(target.textContent).toContain("Showing 101 of 101 moves.");
    unmount(component);
  });

  it("does not install a detail response from before an explicit profile refresh", async () => {
    const fixture = profileFixture();
    let release!: () => void;
    const hold = new Promise<void>((resolve) => { release = resolve; });
    const learnerProfileOpening = vi.fn(async () => {
      await hold;
      return parseOpeningDetail({ row: fixture.profile.openings.rows[0], games: { ...fixture.profile.history, total: 1, hiddenCount: 0 } });
    });
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileOpening });
    await settle();
    button(target, "Show these games").click();
    button(target, "Check again").click();
    await settle();
    release();
    await settle();
    expect(target.querySelector("ol[aria-label='C50 Italian Game: games']")).toBeNull();
    unmount(component);
  });

  it.each(["wrong-key", "wrong-offset", "overlap", "changed-total", "changed-row"])("refuses %s continuation rather than misrepresenting the evidence list", async (defect) => {
    const fixture = profileFixture();
    const row = fixture.profile.openings.rows[0]!;
    const first = fixture.profile.history.items[0]!;
    const learnerProfileOpening = vi.fn(async (_key: string, offset = 0) => parseOpeningDetail({
      row: offset === 0 ? row : { ...row, key: defect === "wrong-key" ? "another opening" : row.key, name: defect === "changed-row" ? "Changed name" : row.name },
      games: { total: offset > 0 && defect === "changed-total" ? 3 : 2, offset: offset > 0 && defect === "wrong-offset" ? 0 : offset, items: [{ ...first, runId: offset === 0 || defect === "overlap" ? "first" : "second" }], hiddenCount: offset === 0 ? 1 : defect === "changed-total" ? 1 : 0 },
    }));
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileOpening });
    await settle();
    button(target, "Show these games").click();
    await settle();
    button(target, "Show more games").click();
    await settle();
    expect(target.querySelector(".opening-list [role=alert]")?.textContent).toContain("current list is unchanged");
    expect(target.querySelector(".opening-list .ref-list")!.children).toHaveLength(1);
    expect(target.textContent).toContain("Showing 1 of 2 games.");
    unmount(component);
  });

  it("shares a measured card only after explicit consent, as text with no run identity", async () => {
    const shareProfileCard = vi.fn(async () => ({ metric: "fianchetto_setup_rate@1", title: "Fianchetto setup reached", sentence: "s", games: 25, decisions: 700, floor: 25, interval: { lower: 0.22, upper: 0.6, level: 0.95 as const }, window: { from: "a", to: "b" }, scope: "x", text: "Fianchetto setup reached: You reached the declared fianchetto setup in 10 of 25 measured games." }));
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()), shareProfileCard });
    await settle();
    expect([...target.querySelectorAll("button")].filter((item) => item.textContent === "Prepare to share…")).toHaveLength(1);
    button(target, "Prepare to share…").click();
    await settle();
    const prepare = button(target, "Prepare text");
    expect(prepare.disabled).toBe(true);
    prepare.click();
    await settle();
    expect(shareProfileCard).not.toHaveBeenCalled();
    const consent = target.querySelector<HTMLInputElement>(".consent-card input[type=checkbox]")!;
    consent.checked = true;
    consent.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    button(target, "Prepare text").click();
    await settle();
    expect(shareProfileCard).toHaveBeenCalledWith("fianchetto_setup_rate", true);
    expect(target.querySelector("textarea")?.value).toContain("10 of 25 measured games");
    unmount(component);
  });

  it("renders the five skill categories with stated reasons and no ratio, score or count about the learner", async () => {
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()) });
    await settle();
    const skills = target.querySelector("section[aria-labelledby='skills-title']")!;
    expect([...skills.querySelectorAll("h3")].map((heading) => heading.textContent)).toEqual(["Fundamentals", "Openings", "Tactics", "Strategy", "Endgame"]);
    expect(skills.textContent).toContain("not whether a move in it was good");
    expect(skills.textContent).not.toMatch(SKILLS_SURFACE_FORBIDDEN);
    unmount(component);
  });
});

describe("profile copy guard", () => {
  it("authors no refused type, norm or comparison word anywhere in the surface", () => {
    const source = readFileSync(resolve(process.cwd(), "apps/web/src/lib/ProfileScreen.svelte"), "utf8").replace(/<style>[\s\S]*<\/style>/u, "");
    expect(refusedTermsIn(source)).toEqual([]);
    expect(refusedTermsIn(source, STYLE_UNDECLARED_COMPARISON_TERMS)).toEqual([]);
    expect(source).not.toMatch(/\bweakest\b|\bstrongest\b|\bbadge\b|\btwin\b|\bconfidence\b|\bpercent/iu);
  });
});
