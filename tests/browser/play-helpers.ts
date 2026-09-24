import type { Page } from "@playwright/test";

/**
 * Play preselects no opponent (the first-use default is the owner's D1611 decision), and raw Maia
 * rungs live under the Advanced disclosure beneath the bot roster. Journeys that exercise the raw
 * rung opponent choose it explicitly here; `name` is the rung card's label.
 */
export async function chooseRawRung(page: Page, name: "First rung" | "Steady" | "Testing" | "Top measured rung" | "Engine test" = "Steady"): Promise<void> {
  const advanced = page.locator("details.advanced");
  if (!(await advanced.evaluate((element) => (element as HTMLDetailsElement).open))) await advanced.locator("summary").click();
  await page.getByLabel(name).check();
}

/** Chooses one registered bot card by its exact catalogue id (e.g. `human-baseline.1400@1`). */
export async function chooseBot(page: Page, profileId: string): Promise<void> {
  await page.locator(`[data-bot-profile="${profileId}"] input`).check();
}
