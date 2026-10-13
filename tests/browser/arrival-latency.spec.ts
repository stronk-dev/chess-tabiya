import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { randomUUID } from "node:crypto";

import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import type { RunGraph } from "../../apps/web/src/lib/api.js";
import { assertRecordedNodesPreserved } from "../../packages/runtime/src/testing/recorded-play.js";
import { observeWarmArrival, waitForMeasuredPlayableBoard, waitForPlayableBoard, type ArrivalWindow } from "./arrival-test-support.js";
import { summarizeArrivalRequests } from "./arrival-requests.js";

const SAMPLES = 5;
const WARM_BUDGET_MS = 250; // design/research/ux-arrival-and-start.md §14; unchanged.

interface WarmArrivalTiming {
  readonly automationMs: number;
  readonly beforeClickMs: number;
  readonly clickToReadyMs: number;
  readonly afterReadyMs: number;
  readonly requests: ReturnType<typeof summarizeArrivalRequests>;
}

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
  readonly warmAutomationMs: Distribution;
  readonly warmTiming: readonly WarmArrivalTiming[];
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

test.describe.serial("arrival readiness measurements", () => {
  let warmContext: BrowserContext;
  let warmPage: Page;
  let storageState: Awaited<ReturnType<BrowserContext["storageState"]>>;
  const coldValues: number[] = [];
  const warmValues: number[] = [];
  const warmAutomation: number[] = [];
  const warmTiming: WarmArrivalTiming[] = [];

  test.beforeAll(async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "the recorded ARR-a9 arm is desktop Chromium");
    const baseURL = testInfo.project.use.baseURL;
    if (typeof baseURL !== "string") throw new Error("ARR-a9 requires Playwright baseURL");
    warmContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
    warmPage = await warmContext.newPage();
    await register(warmPage);
    storageState = await warmContext.storageState();
  });

  test.afterAll(async () => { await warmContext?.close(); });

  // Each actual arrival has the normal 30-second test deadline. The previous single test
  // spent that deadline on registration, five fresh contexts and five warm arrivals combined.
  // Keep all samples and board-readiness assertions; do not widen the product/test budget.
  for (let sample = 0; sample < SAMPLES; sample += 1) {
    test(`cold arrival sample ${sample + 1}`, async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        baseURL: testInfo.project.use.baseURL,
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
    });
  }

  for (let sample = 0; sample < SAMPLES; sample += 1) {
    test(`warm catalogue-to-board sample ${sample + 1}`, async () => {
      await warmPage.goto("/play");
      const open = warmPage.getByRole("button", { name: /Rehearse this position:/ }).first();
      await expect(open).toBeVisible();
      await observeWarmArrival(warmPage);
      const started = await warmPage.evaluate(() => performance.now());
      await open.click();
      await waitForMeasuredPlayableBoard(warmPage);
      const ended = await warmPage.evaluate(() => performance.now());
      warmAutomation.push(ended - started);
      await warmPage.waitForFunction(() => ((window as ArrivalWindow).__tabiyaArrivalTiming?.readyMs ?? -1) >= 0);
      const observed = await warmPage.evaluate(({ started, ended }) => {
        const timing = (window as ArrivalWindow).__tabiyaArrivalTiming!;
        const requests = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
          .filter((entry) => entry.initiatorType === "fetch" && entry.startTime >= timing.clickMs && entry.startTime <= timing.readyMs);
        return {
          automationMs: ended - started,
          beforeClickMs: timing.clickMs - started,
          clickToReadyMs: timing.readyMs - timing.clickMs,
          afterReadyMs: ended - timing.readyMs,
          clickMs: timing.clickMs, readyMs: timing.readyMs,
          resources: requests.map(entry => ({ name: entry.name, initiatorType: entry.initiatorType,
            startTime: entry.startTime, requestStart: entry.requestStart, responseStart: entry.responseStart,
            responseEnd: entry.responseEnd, duration: entry.duration })),
        };
      }, { started, ended });
      const { clickMs, readyMs, resources, ...timing } = observed;
      warmTiming.push({ ...timing, requests: summarizeArrivalRequests(resources, clickMs, readyMs) });
      warmValues.push(warmTiming.at(-1)!.clickToReadyMs);
      expect(warmTiming.at(-1)!.requests.runPacks).toBe(1);
      expect(warmTiming.at(-1)!.requests.shapeCatalogues).toBeLessThanOrEqual(1);
      expect(warmTiming.at(-1)!.requests.criticalRoutes.map(entry => entry.route)).toEqual(["/runs", "/runs/:id/moves"]);
      if (sample === 0) {
        const runId = new URL(warmPage.url()).pathname.split("/").at(-1)!;
        const before = (await (await warmPage.request.get(`/runs/${runId}/graph`)).json() as RunGraph).graph;
        await warmPage.reload();
        await waitForPlayableBoard(warmPage);
        const after = (await (await warmPage.request.get(`/runs/${runId}/graph`)).json() as RunGraph).graph;
        assertRecordedNodesPreserved(before.nodes, after.nodes);
        expect(after.activeCursor).toEqual(before.activeCursor);
        expect(after.branches).toEqual(before.branches);
      }
    });
  }

  test("reports every cold and warm sample without UI-tour work", async () => {
    expect(coldValues).toHaveLength(SAMPLES);
    expect(warmValues).toHaveLength(SAMPLES);
    const report: ArrivalLatencyReport = Object.freeze({
      measuredAt: new Date().toISOString(),
      browser: "chromium",
      viewport: Object.freeze({ width: 1440, height: 1000 }),
      samples: SAMPLES,
      coldUrlToPlayableBoardMs: distribution(coldValues),
      warmCatalogueToPlayableBoardMs: distribution(warmValues),
      warmAutomationMs: distribution(warmAutomation),
      warmTiming: Object.freeze(warmTiming),
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
    // With five samples the nearest-rank p95 is the maximum; gate original, unrounded values.
    expect(Math.max(...warmValues)).toBeLessThan(WARM_BUDGET_MS);
  });

  test("readiness calibration refuses disabled, incomplete, hidden and malformed boards", async ({ page }) => {
    await page.setContent(`<button>Rehearse this position: calibration</button>
      <div aria-label="Chessboard" style="width:100px;height:100px"></div>
      <div data-board-input-grid aria-rowcount="8" aria-colcount="8" aria-readonly="true">${'<div role="gridcell"></div>'.repeat(64)}</div>`);
    await observeWarmArrival(page);
    await page.getByRole("button").click();
    for (const invalid of ["readonly", "rows", "columns", "cells", "hidden", "zero", "nonsquare"] as const) {
      const readyMs = await page.evaluate(async (invalid) => {
        const board = document.querySelector<HTMLElement>('[aria-label="Chessboard"]')!;
        const grid = document.querySelector('[data-board-input-grid]')!;
        board.style.cssText = "width:100px;height:100px";
        grid.setAttribute("aria-rowcount", invalid === "rows" ? "7" : "8");
        grid.setAttribute("aria-colcount", invalid === "columns" ? "7" : "8");
        grid.setAttribute("aria-readonly", invalid === "readonly" ? "true" : "false");
        grid.innerHTML = '<div role="gridcell"></div>'.repeat(invalid === "cells" ? 63 : 64);
        if (invalid === "hidden") board.style.visibility = "hidden";
        if (invalid === "zero") board.style.width = "0px";
        if (invalid === "nonsquare") board.style.height = "90px";
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        return (window as ArrivalWindow).__tabiyaArrivalTiming!.readyMs;
      }, invalid);
      expect(readyMs, invalid).toBe(-1);
    }
    await page.locator('[aria-label="Chessboard"]').evaluate((board: HTMLElement) => { board.style.height = "100px"; });
    await page.waitForFunction(() => ((window as ArrivalWindow).__tabiyaArrivalTiming?.readyMs ?? -1) >= 0);
  });

  test("readiness calibration retains a genuinely over-budget arrival", async ({ page }) => {
    await page.setContent(`<button>Rehearse this position: calibration</button>
      <div aria-label="Chessboard" style="width:100px;height:100px"></div>
      <div data-board-input-grid aria-rowcount="8" aria-colcount="8" aria-readonly="true">${'<div role="gridcell"></div>'.repeat(64)}</div>`);
    await observeWarmArrival(page);
    await page.getByRole("button").click();
    await page.evaluate(() => { setTimeout(() => document.querySelector('[data-board-input-grid]')!.removeAttribute("aria-readonly"), 300); });
    await page.waitForFunction(() => ((window as ArrivalWindow).__tabiyaArrivalTiming?.readyMs ?? -1) >= 0);
    const elapsed = await page.evaluate(() => {
      const timing = (window as ArrivalWindow).__tabiyaArrivalTiming!;
      return timing.readyMs - timing.clickMs;
    });
    expect(elapsed).toBeGreaterThanOrEqual(WARM_BUDGET_MS);
  });

  test("readiness verification starts only after the native observation has closed", async ({ page }) => {
    await page.setContent(`<button>Rehearse this position: calibration</button>
      <div aria-label="Chessboard" style="width:100px;height:100px"></div>
      <div data-board-input-grid aria-rowcount="8" aria-colcount="8" aria-readonly="true">${'<div role="gridcell"></div>'.repeat(64)}</div>`);
    await observeWarmArrival(page);
    let verificationStarted: Promise<number> | undefined;
    const guarded = new Proxy(page, {
      get(target, key) {
        if (key === "getByLabel") return (...args: Parameters<Page["getByLabel"]>) => {
          if (args[0] === "Chessboard") verificationStarted = page.evaluate(() => (window as ArrivalWindow).__tabiyaArrivalTiming!.readyMs);
          return target.getByLabel(...args);
        };
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    await page.getByRole("button").click();
    await page.evaluate(() => { setTimeout(() => document.querySelector('[data-board-input-grid]')!.removeAttribute("aria-readonly"), 300); });
    await waitForMeasuredPlayableBoard(guarded);
    expect(verificationStarted).toBeDefined();
    expect(await verificationStarted!).toBeGreaterThanOrEqual(0);
    const elapsed = await page.evaluate(() => {
      const timing = (window as ArrivalWindow).__tabiyaArrivalTiming!;
      return timing.readyMs - timing.clickMs;
    });
    expect(elapsed).toBeGreaterThanOrEqual(WARM_BUDGET_MS);
  });
});
