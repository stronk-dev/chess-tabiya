import { expect, type Page } from "@playwright/test";

/** Contextual run actions live in the companion, never over the board. */
export async function showRunActions(page: Page): Promise<void> {
  await expect(page.getByLabel("Chessboard").first()).toBeVisible();
  const actions = page.getByRole("region", { name: "Run actions", exact: true });
  if (!await actions.isVisible()) await page.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(actions).toBeVisible();
}

export async function returnFromRunActions(page: Page): Promise<void> {
  const collapse = page.getByRole("button", { name: "Collapse companion", exact: true });
  if (await collapse.isVisible()) await collapse.click();
}

/**
 * Play preselects no opponent (the first-use default is the owner's D1611 decision), and raw Maia
 * rungs live under the Advanced disclosure beneath the bot roster. Journeys that exercise the raw
 * rung opponent choose it explicitly here; `name` is the rung card's label.
 */
export async function chooseRawRung(page: Page, name: "Model band 1000" | "Model band 1400" | "Model band 1800" | "Model band 2200" | "Engine test" = "Model band 1400"): Promise<void> {
  const advanced = page.locator("details.advanced");
  if (!(await advanced.evaluate((element) => (element as HTMLDetailsElement).open))) await advanced.locator("summary").click();
  await page.getByLabel(name).check();
}

/** Chooses one registered bot card by its exact catalogue id (e.g. `human-baseline.1400@1`). */
export async function chooseBot(page: Page, profileId: string): Promise<void> {
  await page.locator(`[data-bot-profile="${profileId}"] input`).check();
}
