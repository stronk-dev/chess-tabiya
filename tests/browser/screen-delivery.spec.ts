import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

const SCREEN_ASSET = /\/assets\/(DrillScreen|ReviewMapScreen|CampaignScreen|RatingScreen|ProfileScreen|TheoryEntryScreen|LibraryScreen|SettingsScreen|PackAuthoringEditors|ShapePlanSignatureEditor)-[^/]+\.js$/u;
const RATING_ASSET = /\/assets\/RatingScreen-[^/]+\.js$/u;
const CAMPAIGN_ASSET = /\/assets\/CampaignScreen-[^/]+\.js$/u;
const SETTINGS_ASSET = /\/assets\/SettingsScreen-[^/]+\.js$/u;
const PACK_EDITORS_ASSET = /\/assets\/PackAuthoringEditors-[^/]+\.js$/u;

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
  test(`Settings delivery failure recovers without changing account or help preferences${mobile ? " @mobile" : ""}`, async ({ page }) => {
    const privateAssets: string[] = [];
    page.on("request", request => { if (SETTINGS_ASSET.test(new URL(request.url()).pathname) || PACK_EDITORS_ASSET.test(new URL(request.url()).pathname)) privateAssets.push(request.url()); });
    await register(page);
    expect(privateAssets).toEqual([]);
    const preferences = await page.evaluate(() => Object.entries(localStorage));
    const commands: string[] = [];
    page.on("request", request => { if (["POST", "PUT", "DELETE"].includes(request.method())) commands.push(new URL(request.url()).pathname); });
    let fail = true;
    await page.route(SETTINGS_ASSET, async route => fail ? route.abort("failed") : route.continue());
    await page.goto("/settings");
    await expect(page.getByRole("alert")).toHaveText("Settings could not load. Reload this page to try again. Your saved work is unchanged.");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Play", exact: true })).toBeVisible();
    expect(await page.evaluate(() => Object.entries(localStorage))).toEqual(preferences);
    expect(commands).toEqual([]);
    fail = false;
    const deletionPreview = page.waitForResponse(response => new URL(response.url()).pathname === "/auth/deletion-preview");
    await page.getByRole("button", { name: "Reload page", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "App theme", exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Settings sections", exact: true })).toBeVisible();
    await expect(page.locator("#account-settings")).toBeVisible();
    expect((await deletionPreview).status()).toBe(200);
    // This existing POST is a read-only deletion preview, not account deletion or import.
    // Assert the entire write-shaped request list rather than filtering it out silently.
    expect(commands).toEqual(["/auth/deletion-preview"]);
    expect(await page.evaluate(() => Object.entries(localStorage))).toEqual(preferences);
  });

  test(`late Studio editor delivery uses the current unsaved document without stealing focus${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route(PACK_EDITORS_ASSET, async route => { await gate; await route.continue(); });
    await page.goto("/create");
    await page.getByRole("button", { name: /^Position/ }).click();
    await page.getByLabel("Draft title", { exact: true }).fill("Late editor delivery fixture");
    await page.getByRole("button", { name: "Create ten-field draft", exact: true }).click();
    try {
      await expect(page.getByText("Loading Pack editing tools…", { exact: true })).toBeVisible();
      const draftPath = new URL(page.url()).pathname.replace("/create/draft/", "/packs/drafts/");
      const savedResponse = await page.request.get(draftPath);
      expect(savedResponse.status()).toBe(200);
      const savedBefore = await savedResponse.json();
      const editor = page.getByLabel("Pack JSON", { exact: true });
      const document = JSON.parse(await editor.inputValue());
      document.provenance.sources = ["Mechanical late-delivery fixture; no chess review"];
      const unsaved = JSON.stringify(document, null, 2);
      await editor.fill(unsaved);
      await editor.focus();
      const writeShapedRequests: { method: string; path: string }[] = [];
      page.on("request", request => {
        if (["POST", "PUT", "DELETE"].includes(request.method())) writeShapedRequests.push({ method: request.method(), path: new URL(request.url()).pathname });
      });
      const arrived = page.waitForResponse(PACK_EDITORS_ASSET);
      release();
      await arrived;
      const sources = page.locator("#pack-provenance-sources");
      await expect(sources).toHaveValue("Mechanical late-delivery fixture; no chess review");
      await expect(editor).toHaveValue(unsaved);
      await expect(editor).toBeFocused();
      const editedSource = "Edited through the delivered widget; no chess review";
      const validated = page.waitForResponse(response => response.request().method() === "POST"
        && new URL(response.url()).pathname === `${draftPath}/lint`
        && response.request().postDataJSON()?.document?.provenance?.sources?.[0] === editedSource);
      await sources.fill(editedSource);
      await expect.poll(async () => JSON.parse(await editor.inputValue()).provenance.sources).toEqual([editedSource]);
      expect((await validated).status()).toBe(200);
      expect(writeShapedRequests.length).toBeGreaterThan(0);
      // Automatic lint uses POST too. Keep every request, admit only that exact read operation,
      // then compare the persisted draft after it completes instead of racing its debounce.
      for (const request of writeShapedRequests) expect(request).toEqual({ method: "POST", path: `${draftPath}/lint` });
      const savedAfter = await page.request.get(draftPath);
      expect(savedAfter.status()).toBe(200);
      expect(await savedAfter.json()).toEqual(savedBefore);
    } finally { release(); }
  });

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
