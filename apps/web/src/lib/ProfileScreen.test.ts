// @vitest-environment happy-dom

import { refusedTermsIn, SKILLS_SURFACE_FORBIDDEN, STYLE_UNDECLARED_COMPARISON_TERMS } from "@chess-tabiya/runtime";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { DrillClientApi } from "./api.js";
import { profileFixture } from "./profile-fixture.test-support.js";
import { parseLearnerProfile, parseObservationDetail, parseOpeningDetail, parseProfileHistory, parseStyleCardPage } from "./profile-response.js";
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

function shareFor(card = profileFixture().profile.style.cards[0]!) {
  if (card.state !== "measured" || card.interval === undefined || card.window === undefined) throw new Error("Measured fixture required");
  return { metric: `${card.metricId}@${card.version}`, title: card.title, sentence: card.sentence, games: card.games, decisions: card.decisions, floor: card.floor, interval: { lower: card.interval.lower, upper: card.interval.upper, level: 0.95 as const }, window: card.window, scope: "all recorded games", text: `${card.title}: ${card.sentence}` };
}

async function consentToShare(target: HTMLElement): Promise<void> {
  button(target, "Prepare to share…").click();
  await settle();
  const consent = target.querySelector<HTMLInputElement>(".consent-card input[type=checkbox]")!;
  consent.checked = true;
  consent.dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
  button(target, "Prepare text").click();
  await settle();
}

describe("profile surface", () => {
  it.each(["wrong-offset", "changed-total"])("keeps the saved history on a %s continuation", async (defect) => {
    const fixture = profileFixture();
    const row = fixture.profile.history.items[0]!;
    const learnerProfileHistory = vi.fn(async () => parseProfileHistory({ history: { total: defect === "changed-total" ? 27 : 26, offset: defect === "wrong-offset" ? 0 : 1, items: [{ ...row, runId: "second" }], hiddenCount: 25 } }));
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileHistory });
    try {
      await settle();
      button(target, "Show more").click();
      await settle();
      expect(target.querySelectorAll(".history-list > li")).toHaveLength(1);
      expect(target.querySelector("section[aria-labelledby=history-title] [role=alert]")?.textContent).toContain("unchanged");
    } finally { unmount(component); }
  });

  it.each(["wrong-offset", "changed-total", "changed-card"])("keeps habit contributors on a %s continuation", async (defect) => {
    const fixture = profileFixture();
    const card = fixture.profile.style.cards[0]!;
    const learnerProfileStyle = vi.fn(async (_metric: string, offset = 0) => parseStyleCardPage({
      card: offset > 0 && defect === "changed-card" ? { ...card, window: { from: "2026-09-01T10:00:00.000Z", to: "2026-09-21T10:00:00.000Z" } } : card,
      contributors: { total: offset > 0 && defect === "changed-total" ? 11 : 10, shown: card.contributors.shown.map((ref, index) => offset === 0 ? ref : { ...ref, runId: `later-${index}`, nodeId: `later-${index}` }), hiddenCount: offset === 0 || defect === "wrong-offset" ? 5 : defect === "changed-total" ? 1 : 0 },
    }));
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileStyle });
    try {
      await settle();
      button(target, "Show the moves behind this").click();
      await settle();
      button(target, "Show more").click();
      await settle();
      expect(target.querySelector("ol[aria-label='Fianchetto setup reached: contributing moves']")?.children).toHaveLength(5);
      expect(target.querySelector(".habit-card [role=alert]")?.textContent).toContain("unchanged");
    } finally { unmount(component); }
  });

  it("does not install an old prepared share after cancel and a fresh consent", async () => {
    const share = shareFor();
    let release!: (value: typeof share) => void;
    const old = new Promise<typeof share>((resolve) => { release = resolve; });
    const shareProfileCard = vi.fn().mockReturnValueOnce(old).mockResolvedValueOnce(share);
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()), shareProfileCard });
    try {
      await settle();
      await consentToShare(target);
      button(target, "Cancel").click();
      await settle();
      button(target, "Prepare to share…").click();
      await settle();
      release(share);
      await settle();
      expect(target.querySelector("textarea")).toBeNull();
      expect(button(target, "Prepare text").disabled).toBe(true);
    } finally { unmount(component); }
  });

  it("refuses a share image for a different metric", async () => {
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()), shareProfileCard: async () => ({ ...shareFor(), metric: "castle_kingside_rate@1" }) });
    try {
      await settle();
      await consentToShare(target);
      expect(target.querySelector("textarea")).toBeNull();
      expect(target.querySelector(".consent-card [role=alert]")).not.toBeNull();
    } finally { unmount(component); }
  });

  it("loads and retries history at the same offset without duplicate requests or retained errors", async () => {
    const fixture = profileFixture();
    fixture.profile.history.total = 3; fixture.profile.history.hiddenCount = 2;
    const row = fixture.profile.history.items[0]!;
    let release!: () => void;
    const hold = new Promise<void>((resolve) => { release = resolve; });
    const learnerProfileHistory = vi.fn().mockRejectedValueOnce(new Error("offline")).mockImplementation(async () => {
      await hold;
      return parseProfileHistory({ history: { total: 3, offset: 1, items: [{ ...row, runId: "second" }, { ...row, runId: "third" }], hiddenCount: 0 } });
    });
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileHistory });
    try {
      await settle();
      button(target, "Show more").click(); await settle();
      expect(target.querySelectorAll(".history-list > li")).toHaveLength(1);
      expect(target.querySelector("section[aria-labelledby=history-title] [role=alert]")).not.toBeNull();
      const more = button(target, "Show more"); more.click(); more.click(); await settle();
      expect(learnerProfileHistory).toHaveBeenCalledTimes(2);
      expect(more.disabled).toBe(true);
      release(); await settle();
      expect(target.querySelectorAll(".history-list > li")).toHaveLength(3);
      expect(target.querySelector("section[aria-labelledby=history-title] [role=alert]")).toBeNull();
      expect(learnerProfileHistory.mock.calls).toEqual([[1, 50], [1, 50]]);
    } finally { release(); unmount(component); }
  });

  it("retains habit contributors on overlap, retries and opens the exact final move", async () => {
    const fixture = profileFixture(), card = fixture.profile.style.cards[0]!;
    let overlap = true;
    // Preserve nested operands while deliberately changing only JSON member order.
    const learnerProfileStyle = vi.fn(async (_metric: string, offset = 0) => parseStyleCardPage({ card: Object.fromEntries(Object.entries(card).reverse()), contributors: { total: 10, shown: card.contributors.shown.map((ref, index) => offset === 0 || overlap ? ref : { ...ref, runId: `later-${index}`, nodeId: `node-${index}` }), hiddenCount: offset === 0 ? 5 : 0 } }));
    const { target, component, onNavigate } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileStyle });
    try {
      await settle();
      button(target, "Show the moves behind this").click(); await settle();
      button(target, "Show more").click(); await settle();
      const list = target.querySelector("ol[aria-label='Fianchetto setup reached: contributing moves']")!;
      expect(list.children).toHaveLength(5);
      expect(target.querySelector(".habit-card [role=alert]")).not.toBeNull();
      overlap = false;
      button(target, "Show more").click(); await settle();
      expect(list.children).toHaveLength(10);
      expect(target.querySelector(".habit-card [role=alert]")).toBeNull();
      (list.lastElementChild!.querySelector("button") as HTMLButtonElement).click();
      expect(onNavigate).toHaveBeenCalledWith("/review/game/later-4?node=node-4");
      expect(learnerProfileStyle.mock.calls.map((call) => call[1])).toEqual([0, 5, 5]);
    } finally { unmount(component); }
  });

  it("refuses overlapping history and keeps its original reference", async () => {
    const fixture = profileFixture();
    const learnerProfileHistory = async () => parseProfileHistory({ history: { ...fixture.profile.history, offset: 1, hiddenCount: 24 } });
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(fixture), learnerProfileHistory });
    try {
      await settle(); button(target, "Show more").click(); await settle();
      expect(target.querySelectorAll(".history-list > li")).toHaveLength(1);
      expect(target.querySelector("section[aria-labelledby=history-title] [role=alert]")).not.toBeNull();
    } finally { unmount(component); }
  });

  it.each(["games", "window", "interval"])("refuses changed %s in the consented share", async (field) => {
    const share = shareFor();
    const changed = field === "games" ? { ...share, games: 26 } : field === "window" ? { ...share, window: { ...share.window, to: "2026-09-22T10:00:00.000Z" } } : { ...share, interval: { ...share.interval, upper: 0.7 } };
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()), shareProfileCard: async () => changed });
    try {
      await settle(); await consentToShare(target);
      expect(target.querySelector("textarea")).toBeNull();
      expect(target.querySelector(".consent-card [role=alert]")).not.toBeNull();
    } finally { unmount(component); }
  });

  it("withdraws prepared text and copy access when consent is unchecked", async () => {
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()), shareProfileCard: async () => shareFor() });
    try {
      await settle(); await consentToShare(target);
      expect(target.querySelector("textarea")).not.toBeNull();
      const consent = target.querySelector<HTMLInputElement>(".consent-card input")!;
      consent.checked = false; consent.dispatchEvent(new Event("change", { bubbles: true })); await settle();
      expect(target.querySelector("textarea")).toBeNull();
      expect(button(target, "Prepare text").disabled).toBe(true);
    } finally { unmount(component); }
  });

  it("keeps a fresh pending preparation busy when the cancelled predecessor fails", async () => {
    const share = shareFor();
    let rejectOld!: (error: Error) => void, resolveNew!: (value: typeof share) => void;
    const old = new Promise<typeof share>((_resolve, reject) => { rejectOld = reject; });
    const next = new Promise<typeof share>((resolve) => { resolveNew = resolve; });
    const shareProfileCard = vi.fn().mockReturnValueOnce(old).mockReturnValueOnce(next);
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()), shareProfileCard });
    try {
      await settle(); await consentToShare(target); button(target, "Cancel").click(); await settle();
      await consentToShare(target);
      rejectOld(new Error("old transport")); await settle();
      expect(button(target, "Preparing…").disabled).toBe(true);
      expect(target.querySelector(".consent-card [role=alert]")).toBeNull();
      resolveNew(share); await settle();
      expect(target.querySelector("textarea")?.value).toBe(share.text);
    } finally { resolveNew(share); unmount(component); }
  });

  it("refreshes the profile without reviving an old prepared share", async () => {
    const share = shareFor();
    let release!: (value: typeof share) => void;
    const pending = new Promise<typeof share>((resolve) => { release = resolve; });
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()), shareProfileCard: () => pending });
    try {
      await settle(); await consentToShare(target);
      button(target, "Refresh profile").click(); await settle();
      release(share); await settle();
      expect(target.querySelector(".consent-card")).toBeNull();
    } finally { release(share); unmount(component); }
  });

  it("does not mark a new panel copied when an earlier clipboard write finishes", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const writeText = vi.fn(() => pending);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const { target, component } = render({ learnerProfile: async () => parseLearnerProfile(profileFixture()), shareProfileCard: async () => shareFor() });
    try {
      await settle(); await consentToShare(target);
      const copy = button(target, "Copy text"); copy.click(); copy.click(); await settle();
      expect(writeText).toHaveBeenCalledTimes(1);
      button(target, "Cancel").click(); await settle();
      button(target, "Prepare to share…").click(); await settle();
      release(); await settle();
      expect(target.querySelector("textarea")).toBeNull();
      expect(target.textContent).not.toContain("Copied");
    } finally { release(); unmount(component); vi.unstubAllGlobals(); }
  });

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
    const shareProfileCard = vi.fn(async () => shareFor());
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
