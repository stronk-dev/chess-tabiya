import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

interface ServedPack {
  readonly id: string;
  readonly title: string;
  readonly channel: "official" | "community";
  readonly reviewStatus: string;
}

test("the packaged default exposes disclosed content and starts a learner rehearsal", async ({ page }) => {
  await page.goto("/play");

  const packs = await page.evaluate(async () => {
    const response = await fetch("/packs");
    if (!response.ok) throw new Error(`GET /packs returned ${response.status}`);
    return await response.json() as ServedPack[];
  });

  expect(packs.length).toBeGreaterThan(0);
  expect(packs.every((pack) => pack.channel === "official" || pack.channel === "community")).toBe(true);
  expect(packs.some((pack) => pack.channel === "community")).toBe(true);
  expect(packs.every((pack) => pack.reviewStatus !== "schema_example")).toBe(true);
  expect(packs.every((pack) => !pack.id.includes("browser") && !pack.title.toLocaleLowerCase("en-US").includes("browser fixture"))).toBe(true);

  const cards = page.locator(".pack-card");
  await expect(cards).toHaveCount(packs.length);
  await expect(cards.filter({ hasText: "Community draft" }).first()).toBeVisible();

  const first = cards.first();
  const firstTitle = (await first.getByRole("heading").textContent())?.trim();
  expect(firstTitle).toBeTruthy();
  await first.getByRole("button", { name: /Choose this rehearsal|Rehearse this position/u }).click();

  const handle = `production_${randomUUID().slice(0, 8)}`;
  await page.getByLabel("Handle").fill(handle);
  await page.getByLabel("Password").fill("browser-test-password");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page).toHaveURL(/\/play\/run\/run-/u);
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.locator(".run-name")).toHaveText(firstTitle!);
});
