import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const SCREEN_ASSET = /\/assets\/(DrillScreen|ReviewMapScreen|CampaignScreen|RatingScreen|ProfileScreen|TheoryEntryScreen|LibraryScreen)-[^/]+\.js$/u;
const RATING_ASSET = /\/assets\/RatingScreen-[^/]+\.js$/u;
const CAMPAIGN_ASSET = /\/assets\/CampaignScreen-[^/]+\.js$/u;

async function register(page: Page): Promise<void> {
  await page.goto("/play");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Handle").fill(`delivery_${randomUUID().slice(0, 8)}`);
  await page.getByLabel("Password").fill("screen-delivery-password");
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeVisible();
}

test("large screen chunks load at their route, not at the initial catalogue", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => { if (SCREEN_ASSET.test(new URL(request.url()).pathname)) requests.push(request.url()); });
  await register(page);
  expect(requests).toEqual([]);
  await page.getByRole("link", { name: "Rating", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your measured record", exact: true })).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(RATING_ASSET.test(new URL(requests[0]!).pathname)).toBe(true);
  await page.getByRole("link", { name: "Campaign", exact: true }).click();
  await expect(page.locator('[data-campaign="browser-fixture-campaign"]')).toBeVisible();
  expect(requests).toHaveLength(2);
  expect(CAMPAIGN_ASSET.test(new URL(requests[1]!).pathname)).toBe(true);
  await page.getByRole("link", { name: "Rating", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your measured record", exact: true })).toBeVisible();
  expect(requests).toHaveLength(2);
});

test("delayed screen delivery preserves navigation and cannot revive a departed route", async ({ page }) => {
  await register(page);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(RATING_ASSET, async route => { await gate; await route.continue(); });
  await page.getByRole("link", { name: "Rating", exact: true }).click();
  try {
    await expect(page.getByText("Loading Rating…", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Play", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeFocused();
    const arrived = page.waitForResponse(RATING_ASSET);
    release();
    await arrived;
    await expect(page).toHaveURL(/\/play$/u);
    await expect(page.getByRole("heading", { name: "Your measured record", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeFocused();
  } finally { release(); }
});

for (const mobile of [false, true]) {
  test(`failed screen chunk offers an explicit reload without issuing a command${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    let fail = true;
    const commands: string[] = [];
    page.on("request", request => { if (request.method() === "POST") commands.push(new URL(request.url()).pathname); });
    await page.route(CAMPAIGN_ASSET, async route => {
      if (fail) await route.abort("failed");
      else await route.continue();
    });
    await page.getByRole("link", { name: "Campaign", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Campaign could not load. Reload this page to try again. Your saved work is unchanged.");
    await expect(page.getByRole("link", { name: "Play", exact: true })).toBeVisible();
    expect(commands).toEqual([]);
    fail = false;
    await page.getByRole("button", { name: "Reload page", exact: true }).click();
    await expect(page).toHaveURL(/\/campaign$/u);
    await expect(page.locator('[data-campaign="browser-fixture-campaign"]')).toBeVisible();
    expect(commands).toEqual([]);
  });
}
