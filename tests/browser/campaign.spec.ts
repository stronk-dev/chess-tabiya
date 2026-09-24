import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

// rfc/campaign-core.md criterion 4/24 (foundation journey) and rfc/campaign-boss-games.md criterion 13:
// enter the campaign, play pack encounters, play the Act-II boss against a registered bot, see each
// result, and resume after reload. Uses the development-only browser fixture campaign
// (tests/browser/fixtures/campaign.browser.json).

async function register(page: Page): Promise<void> {
  await page.goto("/campaign");
  if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(`campaign_${randomUUID().slice(0, 8)}`);
    await page.getByLabel("Password").fill("browser-test-password");
    await page.getByRole("button", { name: "Register" }).click();
  }
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

async function move(page: Page, from: string, to: string): Promise<void> {
  const board = page.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  await board.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const box = await board.boundingBox();
  if (box === null) throw new Error("board has no box");
  const point = (square: string) => ({ x: box.x + ((square.charCodeAt(0) - 97 + 0.5) * box.width) / 8, y: box.y + ((8 - Number(square[1]) + 0.5) * box.height) / 8 });
  const origin = point(from);
  const destination = point(to);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 8 });
  await page.mouse.up();
}

function currentRunId(page: Page): string {
  return decodeURIComponent(new URL(page.url()).pathname.split("/").at(-1)!);
}

async function moveCount(page: Page, runId: string): Promise<number> {
  const response = await page.request.get(`/runs/${encodeURIComponent(runId)}/events`);
  const body = (await response.json()) as { events: { type: string }[] };
  return body.events.filter((event) => event.type === "move.committed" || event.type === "opponent.move_selected").length;
}

async function startNode(page: Page, nodeId: string): Promise<string> {
  const card = page.locator(`[data-node="${nodeId}"]`);
  await card.getByRole("button", { name: "Prepare" }).click();
  await page.getByRole("button", { name: "Start encounter" }).click();
  await expect(page).toHaveURL(/\/play\/run\//u);
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  return currentRunId(page);
}

/** A line-boundary fixture node: learner Be3, the authored reply e6, then declare done. */
async function playPackNode(page: Page, nodeId: string): Promise<void> {
  const runId = await startNode(page, nodeId);
  const strip = page.getByRole("complementary", { name: "Campaign encounter" });
  await expect(strip.getByTestId("campaign-strip-charges")).toBeVisible();
  await move(page, "c1", "e3");
  await expect.poll(() => moveCount(page, runId), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  await strip.getByRole("button", { name: "Declare done" }).click();
  await expect(strip.getByText("Played to the authored boundary", { exact: false })).toBeVisible();
  await strip.getByRole("button", { name: /Continue to the map|See the run result/u }).click();
  await expect(page).toHaveURL(/\/campaign\//u);
}

test("Campaign: enter, play encounters and a registered-bot boss, see results, resume after reload", async ({ page }) => {
  test.setTimeout(240_000);
  await register(page);
  await page.goto("/campaign");
  await expect(page.getByRole("heading", { name: "Campaign", level: 1 })).toBeVisible();
  await expect(page.getByText("nothing here is locked behind a campaign or sold", { exact: false })).toBeVisible();
  const card = page.locator('[data-campaign="browser-fixture-campaign"]');
  await card.getByRole("button", { name: "Start a run" }).click();
  await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
  const mapUrl = page.url();

  // Criterion 4: the balance is visible before any spend, on the map and in the encounter strip.
  await expect(page.getByTestId("campaign-charges")).toContainText("⟲ 1");
  await expect(page.locator('[data-node="f3-boss"]')).toContainText("Sets aside: Step-by-step hint");

  const firstRunId = await startNode(page, "f1-a");
  const strip = page.getByRole("complementary", { name: "Campaign encounter" });
  await expect(strip.getByTestId("campaign-strip-charges")).toContainText("Earned rewinds: 1 remaining this campaign");
  // Declaring done on the untouched root is refused: participation is required, never graded.
  await strip.getByRole("button", { name: "Declare done" }).click();
  await expect(strip.getByRole("alert")).toContainText("no move after the run root");
  await move(page, "c1", "e3");
  await expect.poll(() => moveCount(page, firstRunId), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  await strip.getByRole("button", { name: "Declare done" }).click();
  await expect(strip.getByText("Played to the authored boundary", { exact: false })).toBeVisible();
  await expect(strip.getByText("Unlocks After-move nudge", { exact: false })).toBeVisible();
  await strip.getByRole("button", { name: "Continue to the map" }).click();

  // Resume after reload: the map is server state, not tab state.
  await page.reload();
  await expect(page.locator('[data-node="f1-a"]')).toContainText("Played to the authored boundary");
  await expect(page.locator('[data-node="f1-b"]')).toContainText("Another path was chosen on this layer.");
  await expect(page.getByRole("region", { name: "Your campaign kit" })).toContainText("After-move nudge");
  await expect(page.getByTestId("campaign-charges")).toContainText("⟲ 2");

  for (const nodeId of ["f2-b", "f3-boss", "f4-a", "f5-b"]) await playPackNode(page, nodeId);

  // The Act-II boss: a full game against registered bot human-baseline.1400@1.
  const boss = page.locator('[data-node="f6-boss"]');
  await expect(boss).toContainText("Opponent: registered bot human-baseline.1400@1");
  const bossRunId = await startNode(page, "f6-boss");
  await move(page, "h1", "g1");
  await expect.poll(() => moveCount(page, bossRunId), { timeout: 30_000 }).toBeGreaterThanOrEqual(2);
  await move(page, "e1", "e8");
  await expect.poll(() => moveCount(page, bossRunId), { timeout: 15_000 }).toBeGreaterThanOrEqual(3);
  // The rules ended the game: the terminal sheet carries the campaign's "Declare done".
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "You won." })).toBeVisible();
  await expect(sheet.getByText("a rewind spends an earned rewind", { exact: false })).toBeVisible();
  await sheet.getByRole("button", { name: "Declare done and return to the campaign map" }).click();
  await expect(page).toHaveURL(/\/campaign\//u);
  await expect(page.locator('[data-node="f6-boss"]')).toContainText("Game won (checkmate)");

  // Resume after reload lands on the same campaign map with the boss sealed.
  await page.goto(mapUrl);
  await page.reload();
  await expect(page.locator('[data-node="f6-boss"]')).toContainText("Game won (checkmate)");
  await expect(page.locator('[data-node="f7-a"]').getByRole("button", { name: "Prepare" })).toBeVisible();

  // Abandon is a separately confirmed action with the exact non-punitive consequence.
  await page.getByRole("button", { name: "Abandon this run…" }).click();
  await expect(page.getByText("no completion or prestige mark is awarded", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Confirm abandon" }).click();
  await expect(page.getByRole("heading", { name: "Campaign abandoned" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start another run" })).toBeVisible();
});
