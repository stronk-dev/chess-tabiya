import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import type { DrillRun } from "@chess-tabiya/runtime";
import { assertOnlyEvidenceAppended, assertRecordedNodesPreserved } from "../../packages/runtime/src/testing/recorded-play.js";
import type { RunGraph } from "../../apps/web/src/lib/api.js";
import { returnFromRunActions, showRunActions } from "./play-helpers.js";

async function rehearsal(page: Page): Promise<string> {
  const handle = `play_export_${randomUUID().slice(0, 8)}`;
  expect((await page.request.post("/auth/register", { data: { handle, password: "play-export-test-password" } })).status()).toBe(201);
  await page.goto("/review");
  await page.getByLabel("PGN", { exact: true }).fill('[Event "Play export recovery"]\n[White "Play White"]\n[Black "Play Black"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 *');
  await page.getByRole("button", { name: "Build game story", exact: true }).click();
  await expect(page).toHaveURL(/\/review\/game\/import-/);
  const id = new URL(page.url()).pathname.split("/").at(-1)!;
  await page.getByRole("button", { name: "Retry from before move 2 (Nf3)", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/play/run/${id}$`));
  await expect(page.getByLabel("Chessboard").first()).toBeVisible();
  return id;
}

async function recorded(page: Page, id: string) {
  const graph = await page.request.get(`/runs/${id}/graph`);
  const events = await page.request.get(`/runs/${id}/events?sinceSeq=0`);
  expect(graph.ok()).toBe(true);
  expect(events.ok()).toBe(true);
  return { graph: (await graph.json() as { graph: RunGraph }).graph, events: (await events.json() as { events: DrillRun["events"] }).events };
}

async function showExport(page: Page): Promise<void> {
  await showRunActions(page);
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeVisible();
}

async function unchanged(page: Page, id: string, before: Awaited<ReturnType<typeof recorded>>) {
  const context = page.getByRole("complementary", { name: "Imported game story", exact: true });
  await expect(context).toBeVisible();
  expect(await context.evaluate(element => element.closest(".action-seat, .compare") !== null)).toBe(true);
  expect(await context.evaluate(element => getComputedStyle(element).position)).toBe("static");
  const storyButton = context.getByRole("button", { name: "Story", exact: true });
  await storyButton.scrollIntoViewIfNeeded();
  expect(await storyButton.evaluate(element => {
    const box = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  const after = await recorded(page, id);
  assertOnlyEvidenceAppended(before.events, after.events);
  assertRecordedNodesPreserved(before.graph.nodes, after.graph.nodes);
  expect(after.graph.branches).toEqual(before.graph.branches);
  expect(after.graph.activeCursor).toEqual(before.graph.activeCursor);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

for (const mobile of [false, true]) {
  for (const compare of [false, true]) {
    test(`${compare ? "Compare" : "Play"} PGN export owns failure, retry and selected branches${mobile ? " @mobile" : ""}`, async ({ page }) => {
      const id = await rehearsal(page);
      if (compare) {
        await page.locator("main.drill").focus();
        await page.keyboard.press("Alt+C");
        await expect(page.getByRole("heading", { name: "Same decision, two consequences." })).toBeVisible();
      } else await showExport(page);
      const before = await recorded(page, id);
      const path = `**/runs/${id}/pgn*`;
      const requested: URL[] = [];
      let release!: () => void;
      const pending = new Promise<void>(resolve => { release = resolve; });
      await page.route(path, async route => {
        requested.push(new URL(route.request().url()));
        await pending;
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "EXPORT_UNAVAILABLE", message: "private export storage detail" } }) });
      });
      try {
        await page.getByRole("button", { name: "Export", exact: true }).click();
        const button = page.getByRole("button", { name: "Export", exact: true });
        await expect(button).toBeDisabled();
        await expect(button).toHaveAttribute("aria-describedby", "drill-export-status");
        await expect(page.locator("#drill-export-status")).toBeVisible();
        // The shortcut shares the same in-flight owner even while its button has focus.
        await page.locator('[data-keyboard-region="drill"]').focus();
        await page.keyboard.press("e");
        await button.evaluate(element => (element as HTMLButtonElement).click());
        await expect.poll(() => requested.length).toBe(1);
        if (compare) expect(requested[0]!.searchParams.get("branches")?.split(",").sort()).toEqual(before.graph.branches.map(branch => branch.id).sort());
        release();
        await expect(page.locator("#drill-export-error")).toContainText("Your game is unchanged. Try again.");
        await expect(page.locator("body")).not.toContainText("private export storage detail");
        await expect(button).toBeEnabled();
      } finally { release(); if (!page.isClosed()) await page.unroute(path); }
      const downloading = page.waitForEvent("download");
      // Retry by shortcut in Compare and by the ordinary mouse/touch button in Play.
      if (compare) { await page.locator('[data-keyboard-region="drill"]').focus(); await page.keyboard.press("e"); }
      else await page.getByRole("button", { name: "Export", exact: true }).click();
      const download = await downloading;
      expect(download.suggestedFilename()).toMatch(/\.pgn$/);
      const file = await download.path();
      expect(file).not.toBeNull();
      const pgn = await readFile(file!, "utf8");
      expect(pgn).toContain('[White "Play White"]');
      expect(pgn).toContain('[Black "Play Black"]');
      expect(pgn).toMatch(/1\.\s*e4\s+e5/);
      await expect(page.locator("#drill-export-error")).toHaveCount(0);
      await unchanged(page, id, before);
    });
  }

  test(`Play PGN export retires delayed completion after leaving and returning${mobile ? " @mobile" : ""}`, async ({ page }) => {
    const id = await rehearsal(page);
    await showExport(page);
    const before = await recorded(page, id);
    const path = `**/runs/${id}/pgn*`;
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
      await page.getByRole("button", { name: "Export", exact: true }).click();
      await requested;
      await returnFromRunActions(page);
      await page.getByRole("button", { name: "Tabiya", exact: true }).click();
      await expect(page).toHaveURL(/\/play$/);
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`/play/run/${id}$`));
      await showExport(page);
      await expect(page.getByRole("button", { name: "Export", exact: true })).toBeEnabled();
      const completed = page.waitForResponse(response => new URL(response.url()).pathname === `/runs/${id}/pgn`);
      release();
      expect((await completed).status()).toBe(200);
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      expect(await page.evaluate(() => (window as unknown as { exportClicks: string[] }).exportClicks)).toEqual([]);
      expect(downloads).toEqual([]);
    } finally { release(); if (!page.isClosed()) await page.unroute(path); }
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export", exact: true }).click();
    expect((await downloading).suggestedFilename()).toMatch(/\.pgn$/);
    await unchanged(page, id, before);
  });
}
