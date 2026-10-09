import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import type { DrillRun } from "@chess-tabiya/runtime";
import type { ReviewMap, RunGraph } from "../../apps/web/src/lib/api.js";
import { assertOnlyEvidenceAppended, assertRecordedNodesPreserved } from "../../packages/runtime/src/testing/recorded-play.js";

async function reviewedGame(page: Page): Promise<string> {
  expect((await page.request.post("/auth/register", { data: {
    handle: `refresh_${randomUUID().slice(0, 8)}`, password: "review-refresh-test-password",
  } })).status()).toBe(201);
  await page.goto("/review");
  await page.getByLabel("PGN", { exact: true }).fill('[White "Refresh White"]\n[Black "Refresh Black"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 *');
  await page.getByRole("button", { name: "Build game story", exact: true }).click();
  await expect(page).toHaveURL(/\/review\/game\/import-/);
  await expect(page.locator(".move-select")).toHaveCount(4);
  await expect(page.getByText(/Evaluation pending for/)).toHaveCount(0);
  return new URL(page.url()).pathname.split("/").at(-1)!;
}

async function recorded(page: Page, id: string) {
  const graph = await page.request.get(`/runs/${id}/graph`);
  const events = await page.request.get(`/runs/${id}/events?sinceSeq=0`);
  expect(graph.ok()).toBe(true);
  expect(events.ok()).toBe(true);
  return { graph: (await graph.json() as { graph: RunGraph }).graph,
    events: (await events.json() as { events: DrillRun["events"] }).events };
}

async function geometry(page: Page) {
  return page.locator(".stage > .board").evaluate(element => {
    const rect = element.getBoundingClientRect();
    let x = rect.x + window.scrollX, y = rect.y + window.scrollY;
    for (let parent = element.parentElement; parent !== null && parent !== document.documentElement; parent = parent.parentElement) {
      x += parent.scrollLeft;
      y += parent.scrollTop;
    }
    return { x, y, width: rect.width, height: rect.height };
  });
}

for (const mobile of [false, true]) {
  test(`Review refresh recovers the exact selected line without playing moves${mobile ? " @mobile" : ""}`, async ({ page }) => {
    const id = await reviewedGame(page);
    const moves = page.locator(".move-select");
    await moves.last().click();
    const selected = await page.locator(".move-row.selected").getAttribute("data-node-id");
    const before = await recorded(page, id);
    const board = await geometry(page);
    const path = `**/runs/${id}/review**`;
    const queries: string[] = [];
    const writes: string[] = [];
    page.on("request", request => {
      if (request.method() !== "GET" && new URL(request.url()).pathname.startsWith(`/runs/${id}/`)) writes.push(new URL(request.url()).pathname);
    });
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route(path, async route => {
      queries.push(new URL(route.request().url()).searchParams.get("branch") ?? "missing");
      if (queries.length === 1) {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "UNAVAILABLE", message: "private refresh detail" } }) });
        return;
      }
      const response = await route.fetch();
      if (queries.length === 2) {
        const crossed = await response.json() as ReviewMap;
        await route.fulfill({ response, json: { ...crossed, branchId: "crossed-line" } });
        return;
      }
      await pending;
      await route.fulfill({ response });
    });
    try {
      await page.getByRole("button", { name: "Refresh review", exact: true }).click();
      const failure = page.locator(".review-refresh-status [role='alert']");
      await expect(failure).toContainText("last confirmed review");
      await expect(page.locator("body")).not.toContainText("private refresh detail");
      await expect(page.locator(".move-row.selected")).toHaveAttribute("data-node-id", selected!);
      expect(await geometry(page)).toEqual(board);
      await page.getByRole("button", { name: "Retry loading review", exact: true }).click();
      await expect.poll(() => queries.length).toBe(2);
      await expect(page.getByRole("button", { name: "Retry loading review", exact: true })).toBeEnabled();
      await expect(failure).toBeVisible();
      const retry = page.getByRole("button", { name: "Retry loading review", exact: true });
      await retry.focus();
      await retry.press("Enter");
      const busy = page.getByRole("button", { name: "Refreshing review…", exact: true });
      await expect(busy).toHaveAttribute("aria-disabled", "true");
      await expect(busy).toBeFocused();
      await busy.evaluate(button => (button as HTMLButtonElement).click());
      expect(queries).toHaveLength(3);
      release();
      const refreshed = page.getByRole("button", { name: "Refresh review", exact: true });
      await expect(refreshed).toBeEnabled();
      await expect(refreshed).toBeFocused();
      await expect(failure).toHaveCount(0);
      await expect(page.locator(".move-row.selected")).toHaveAttribute("data-node-id", selected!);
      expect(await geometry(page)).toEqual(board);
      expect(new Set(queries).size).toBe(1);
      expect(queries[0]).not.toBe("missing");
      expect(writes).toEqual([]);
    } finally { release(); await page.unroute(path); }
    const after = await recorded(page, id);
    assertOnlyEvidenceAppended(before.events, after.events);
    assertRecordedNodesPreserved(before.graph.nodes, after.graph.nodes);
    expect(after.graph.branches).toEqual(before.graph.branches);
    expect(after.graph.activeCursor).toEqual(before.graph.activeCursor);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });

  test(`Review refresh retires delayed failure after leaving and returning${mobile ? " @mobile" : ""}`, async ({ page }) => {
    const id = await reviewedGame(page);
    const path = `**/runs/${id}/review**`;
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    let calls = 0;
    await page.route(path, async route => {
      calls += 1;
      if (calls !== 1) { await route.continue(); return; }
      await pending;
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "UNAVAILABLE", message: "departed failure" } }) });
    });
    try {
      await page.getByRole("button", { name: "Refresh review", exact: true }).click();
      await expect.poll(() => calls).toBe(1);
      await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: /^Review/ }).click();
      await expect(page).toHaveURL(/\/review$/);
      await page.goBack();
      await expect(page.getByRole("button", { name: "Refresh review", exact: true })).toBeEnabled();
      const completed = page.waitForResponse(response => new URL(response.url()).pathname === `/runs/${id}/review` && response.status() === 503);
      release();
      await completed;
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await expect(page.locator(".review-refresh-status [role='alert']")).toHaveCount(0);
      await expect(page.locator("body")).not.toContainText("departed failure");
      await page.getByRole("button", { name: "Refresh review", exact: true }).click();
      await expect.poll(() => calls).toBe(3);
      await expect(page.getByRole("button", { name: "Refresh review", exact: true })).toBeEnabled();
    } finally { release(); await page.unroute(path); }
  });
}
