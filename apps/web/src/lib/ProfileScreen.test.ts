// @vitest-environment happy-dom

import { refusedTermsIn, SKILLS_SURFACE_FORBIDDEN, STYLE_UNDECLARED_COMPARISON_TERMS } from "@chess-tabiya/runtime";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DrillClientApi } from "./api.js";
import { profileFixture } from "./profile-fixture.test-support.js";
import { parseLearnerProfile, parseStyleCardPage } from "./profile-response.js";
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
    expect(onNavigate).toHaveBeenCalledWith("/review/game/run-0");
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
