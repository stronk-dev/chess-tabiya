import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

const SAMPLES = 5;

interface Distribution {
  readonly n: number;
  readonly minMs: number;
  readonly medianMs: number;
  readonly p95Ms: number;
  readonly maxMs: number;
  readonly allMs: readonly number[];
}

interface ArrivalLatencyReport {
  readonly measuredAt: string;
  readonly browser: "chromium";
  readonly viewport: { readonly width: 1440; readonly height: 1000 };
  readonly samples: number;
  readonly coldUrlToPlayableBoardMs: Distribution;
  readonly warmCatalogueToPlayableBoardMs: Distribution;
}

function distribution(values: readonly number[]): Distribution {
  const sorted = [...values].sort((left, right) => left - right);
  const round = (value: number): number => Math.round(value * 10) / 10;
  return Object.freeze({
    n: sorted.length,
    minMs: round(sorted[0]!),
    medianMs: round(sorted[Math.floor(sorted.length / 2)]!),
    p95Ms: round(sorted[Math.ceil(sorted.length * 0.95) - 1]!),
    maxMs: round(sorted.at(-1)!),
    allMs: Object.freeze(sorted.map(round)),
  });
}

async function register(page: Page): Promise<void> {
  await page.goto("/play");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Handle").fill(`arrival_latency_${randomUUID().slice(0, 8)}`);
  await page.getByLabel("Password").fill("arrival-latency-password");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

async function openFirstPosition(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Rehearse this position:/ }).first().click();
}

async function waitForPlayableBoard(page: Page): Promise<void> {
  const board = page.getByLabel("Chessboard");
  const grid = page.locator("[data-board-input-grid]");
  await expect(board).toBeVisible();
  await expect(grid).toHaveAttribute("aria-rowcount", "8");
  await expect(grid).toHaveAttribute("aria-colcount", "8");
  await expect(grid).not.toHaveAttribute("aria-readonly", "true");
  await expect(grid.getByRole("gridcell")).toHaveCount(64);
  await board.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  const geometry = await board.boundingBox();
  expect(geometry?.width).toBeGreaterThan(0);
  expect(geometry?.height).toBe(geometry?.width);
}

test("measures cold arrival and warm catalogue-to-board readiness without UI-tour work", async ({
  browser,
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "the recorded ARR-a9 arm is desktop Chromium");
  await register(page);

  const baseURL = testInfo.project.use.baseURL;
  if (typeof baseURL !== "string") throw new Error("ARR-a9 requires Playwright baseURL");
  const storageState = await page.context().storageState();
  const coldValues: number[] = [];

  for (let sample = 0; sample < SAMPLES; sample += 1) {
    const context = await browser.newContext({
      baseURL,
      storageState,
      viewport: { width: 1440, height: 1000 },
    });
    try {
      const coldPage = await context.newPage();
      const started = performance.now();
      await coldPage.goto("/play");
      await openFirstPosition(coldPage);
      await waitForPlayableBoard(coldPage);
      coldValues.push(performance.now() - started);
    } finally {
      await context.close();
    }
  }

  const warmValues: number[] = [];
  for (let sample = 0; sample < SAMPLES; sample += 1) {
    await page.goto("/play");
    const open = page.getByRole("button", { name: /Rehearse this position:/ }).first();
    await expect(open).toBeVisible();
    const started = await page.evaluate(() => performance.now());
    await open.click();
    await waitForPlayableBoard(page);
    warmValues.push((await page.evaluate(() => performance.now())) - started);
  }

  const report: ArrivalLatencyReport = Object.freeze({
    measuredAt: new Date().toISOString(),
    browser: "chromium",
    viewport: Object.freeze({ width: 1440, height: 1000 }),
    samples: SAMPLES,
    coldUrlToPlayableBoardMs: distribution(coldValues),
    warmCatalogueToPlayableBoardMs: distribution(warmValues),
  });
  await mkdir("test-results", { recursive: true });
  await writeFile("test-results/arrival-latency.json", `${JSON.stringify(report, null, 2)}\n`);
  console.log(`ARRIVAL_LATENCY ${JSON.stringify(report)}`);

  expect(report.coldUrlToPlayableBoardMs.n).toBe(SAMPLES);
  expect(report.warmCatalogueToPlayableBoardMs.n).toBe(SAMPLES);
  for (const value of [...coldValues, ...warmValues]) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }
});
