import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

async function measuredProfile(page: Page): Promise<void> {
  const registered = await page.request.post("/auth/register", { data: { handle: `profile_${randomUUID().slice(0, 8)}`, password: "profile-browser-password" } });
  expect(registered.status(), await registered.text()).toBe(201);
  // Real attributed native games, not mocked profile cards or imported player identities.
  // Twenty-six games cross the existing floor and both existing pagination boundaries.
  for (let index = 0; index < 26; index += 1) {
    const id = `profile-${randomUUID()}`;
    const headers = { "x-writer-id": `writer-${id}` };
    const created = await page.request.post("/runs", {
      headers,
      data: {
        id,
        session: { kind: "position", start: { fen: START, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } }, seed: 7,
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const { run } = await created.json() as { run: { sessionDigest: string } };
    const first = await page.request.post(`/runs/${id}/moves`, { headers, data: { uci: "g2g3" } });
    expect(first.ok(), await first.text()).toBe(true);
    const selected = await page.request.post("/select-move", { data: { startFen: START, historyUci: ["g2g3"], policy: { mode: "human_common", policyConfigDigest: run.sessionDigest }, seed: 7 } });
    expect(selected.ok(), await selected.text()).toBe(true);
    const reply = await page.request.post(`/runs/${id}/moves`, { headers, data: { selection: await selected.json() } });
    expect(reply.ok(), await reply.text()).toBe(true);
    const bishop = await page.request.post(`/runs/${id}/moves`, { headers, data: { uci: "f1g2" } });
    expect(bishop.ok(), await bishop.text()).toBe(true);
  }
  await expect.poll(async () => {
    const response = await page.request.get("/learner-profile");
    expect(response.ok(), await response.text()).toBe(true);
    const { profile } = await response.json() as { profile: { store: { pending: number }; population: { measuredGames: number } } };
    return [profile.population.measuredGames, profile.store.pending];
  }).toEqual([26, 0]);
}

for (const suffix of ["desktop", "@mobile touch phone"]) {
  test.describe(`profile evidence and sharing ${suffix}`, () => {
    test.beforeEach(async ({ page }) => { await measuredProfile(page); });

    test("paginates real counted moves and retires cancelled share responses", async ({ page }) => {
      await page.goto("/profile");
      const history = page.getByRole("region", { name: "Your saved runs" });
      await expect(history.locator("li")).toHaveCount(20);
      await history.getByRole("button", { name: "Show more", exact: true }).click();
      await expect(history.locator("li")).toHaveCount(26);
      await expect(history.getByRole("button", { name: "Show more", exact: true })).toHaveCount(0);

      const card = page.getByRole("article", { name: "Fianchetto setup reached", exact: true });
      await card.getByRole("button", { name: "Show the moves behind this", exact: true }).click();
      const moves = card.getByRole("list", { name: "Fianchetto setup reached: contributing moves" });
      await expect(moves.locator("li")).toHaveCount(25);
      await card.getByRole("button", { name: "Show more", exact: true }).click();
      await expect(moves.locator("li")).toHaveCount(26);
      await expect(card.getByText("Showing 26 of 26.", { exact: true })).toBeVisible();

      let release!: () => void;
      const held = new Promise<void>((resolve) => { release = resolve; });
      let responseReady!: () => void;
      const ready = new Promise<void>((resolve) => { responseReady = resolve; });
      await page.route("**/learner-profile/share-card", async (route) => {
        // Delay the real authenticated response, without manufacturing its evidence or text.
        const response = await route.fetch();
        expect(response.ok(), await response.text()).toBe(true);
        responseReady();
        await held;
        await route.fulfill({ response });
      });
      await card.getByRole("button", { name: "Prepare to share…", exact: true }).click();
      const consent = card.getByRole("checkbox", { name: "I choose to share this card's numbers" });
      await consent.check();
      await card.getByRole("button", { name: "Prepare text", exact: true }).click();
      await ready;
      await card.getByRole("button", { name: "Cancel", exact: true }).click();
      await card.getByRole("button", { name: "Prepare to share…", exact: true }).click();
      release();
      await expect(consent).not.toBeChecked();
      await expect(card.getByLabel("Text to share")).toHaveCount(0);
      await expect(card.getByRole("button", { name: "Prepare text", exact: true })).toBeDisabled();
      await page.unrouteAll({ behavior: "wait" });

      await consent.check();
      await card.getByRole("button", { name: "Prepare text", exact: true }).click();
      await expect(card.getByLabel("Text to share")).toHaveValue(/26 of 26 measured games/u);
      await consent.uncheck();
      await expect(card.getByLabel("Text to share")).toHaveCount(0);
      await page.getByRole("button", { name: "Refresh profile", exact: true }).click();
      await expect(history.locator("li")).toHaveCount(20);
      await expect(card.getByRole("checkbox")).toHaveCount(0);
      await expect(moves).toHaveCount(0);
      await expect(page.getByRole("alert")).toHaveCount(0);
    });
  });
}
