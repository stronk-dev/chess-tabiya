import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { assertOnlyEvidenceAppended, assertRecordedNodesPreserved } from "../../packages/runtime/src/testing/recorded-play.js";
import type { DrillRun } from "@chess-tabiya/runtime";
import type { RunGraph } from "../../apps/web/src/lib/api.js";

async function reviewedGame(page: Page): Promise<string> {
  const handle = `export_${randomUUID().slice(0, 8)}`;
  expect((await page.request.post("/auth/register", { data: { handle, password: "review-export-test-password" } })).status()).toBe(201);
  await page.goto("/review");
  await page.getByLabel("PGN", { exact: true }).fill('[Event "Review export recovery"]\n[White "Export White"]\n[Black "Export Black"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 *');
  await page.getByRole("button", { name: "Build game story", exact: true }).click();
  await expect(page).toHaveURL(/\/review\/game\/import-/);
  await expect(page.getByRole("button", { name: "Export game + branches", exact: true })).toBeVisible();
  return new URL(page.url()).pathname.split("/").at(-1)!;
}

async function recorded(page: Page, id: string) {
  const graphResponse = await page.request.get(`/runs/${id}/graph`);
  const eventsResponse = await page.request.get(`/runs/${id}/events?sinceSeq=0`);
  expect(graphResponse.ok()).toBe(true);
  expect(eventsResponse.ok()).toBe(true);
  return {
    graph: (await graphResponse.json() as { graph: RunGraph }).graph,
    events: (await eventsResponse.json() as { events: DrillRun["events"] }).events,
  };
}

for (const mobile of [false, true]) {
  test(`Review PGN export recovers from failure without changing recorded play${mobile ? " @mobile" : ""}`, async ({ page }) => {
    const id = await reviewedGame(page);
    const before = await recorded(page, id);
    const path = `**/runs/${id}/pgn`;
    let requests = 0;
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route(path, async route => {
      requests += 1;
      await pending;
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "EXPORT_UNAVAILABLE", message: "private export storage detail" } }) });
    });
    try {
      await page.getByRole("button", { name: "Export game + branches", exact: true }).click();
      const busy = page.getByRole("button", { name: "Preparing export…", exact: true });
      await expect(busy).toBeDisabled();
      await expect(busy).toHaveAttribute("aria-describedby", "review-export-status");
      await expect(page.getByRole("status").filter({ hasText: "Preparing the recorded game" })).toBeVisible();
      await busy.evaluate(button => (button as HTMLButtonElement).click());
      await expect.poll(() => requests).toBe(1);
      release();
      await expect(page.getByRole("alert").filter({ hasText: "The game export could not be prepared. Try again." })).toBeVisible();
      await expect(page.locator("body")).not.toContainText("private export storage detail");
    } finally { release(); if (!page.isClosed()) await page.unroute(path); }
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export game + branches", exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toMatch(/\.pgn$/);
    const file = await download.path();
    expect(file).not.toBeNull();
    const pgn = await readFile(file!, "utf8");
    expect(pgn).toContain('[White "Export White"]');
    expect(pgn).toContain('[Black "Export Black"]');
    expect(pgn).toMatch(/1\.\s*e4\s+e5/);
    await expect(page.getByRole("alert").filter({ hasText: "The game export could not be prepared" })).toHaveCount(0);
    const after = await recorded(page, id);
    assertOnlyEvidenceAppended(before.events, after.events);
    assertRecordedNodesPreserved(before.graph.nodes, after.graph.nodes);
    expect(after.graph.branches).toEqual(before.graph.branches);
    expect(after.graph.activeCursor).toEqual(before.graph.activeCursor);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });

  test(`Review PGN export retires delayed completion after leaving and returning${mobile ? " @mobile" : ""}`, async ({ page }) => {
    const id = await reviewedGame(page);
    const before = await recorded(page, id);
    const path = `**/runs/${id}/pgn`;
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    let started!: () => void;
    const requested = new Promise<void>(resolve => { started = resolve; });
    const downloads: string[] = [];
    page.on("download", download => downloads.push(download.suggestedFilename()));
    await page.evaluate(() => {
      const original = HTMLAnchorElement.prototype.click;
      (window as unknown as { exportClicks: string[] }).exportClicks = [];
      HTMLAnchorElement.prototype.click = function () {
        if (this.download) (window as unknown as { exportClicks: string[] }).exportClicks.push(this.download);
        original.call(this);
      };
    });
    await page.route(path, async route => {
      const response = await route.fetch();
      started();
      await pending;
      await route.fulfill({ response });
    });
    try {
      await page.getByRole("button", { name: "Export game + branches", exact: true }).click();
      await requested;
      // Use the real app navigation, not the plain Back anchor's document reload:
      // the pending request must survive so the completion guard is actually exercised.
      await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: /^Review/ }).click();
      await expect(page).toHaveURL(/\/review$/);
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`/review/game/${id}$`));
      await expect(page.getByRole("button", { name: "Export game + branches", exact: true })).toBeEnabled();
      const completed = page.waitForResponse(response => new URL(response.url()).pathname === `/runs/${id}/pgn`);
      release();
      expect((await completed).status()).toBe(200);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(await page.evaluate(() => (window as unknown as { exportClicks: string[] }).exportClicks)).toEqual([]);
      expect(downloads).toEqual([]);
    } finally { release(); if (!page.isClosed()) await page.unroute(path); }
    // The current view still owns a fresh, working export; retirement is not a permanent lock.
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export game + branches", exact: true }).click();
    expect((await downloading).suggestedFilename()).toMatch(/\.pgn$/);
    const after = await recorded(page, id);
    assertOnlyEvidenceAppended(before.events, after.events);
    assertRecordedNodesPreserved(before.graph.nodes, after.graph.nodes);
    expect(after.graph.branches).toEqual(before.graph.branches);
    expect(after.graph.activeCursor).toEqual(before.graph.activeCursor);
  });
}
