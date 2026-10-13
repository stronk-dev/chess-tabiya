// Disposable D3771 research; no product budget/source/assistance or normal gate changes.
import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { observeWarmArrival, waitForPlayableBoard, type ArrivalWindow } from "../../tests/browser/arrival-test-support.js";

interface Measurement {
  block: number;
  sample: number;
  trace: boolean;
  assertionsFirst: boolean;
  arrivalMs: number;
  requests: number;
  shapeDocuments: number;
  runPacks: number;
  longestRequestMs: number;
}

const rows: Measurement[] = [];

// Rotate arm order between blocks; each arm has a fresh authenticated context and two arrivals.
// Keep every first/second sample: component-cache warming is not silently excluded.
test.describe.serial("D3771 paired native arrival", () => {
    let block: number;
    let trace: boolean;
    let assertionsFirst: boolean;
    let context: BrowserContext;
    let page: Page;
    test.beforeAll(async ({ browser }, info) => {
      ({ block, trace, assertionsFirst } = info.project.metadata as { block: number; trace: boolean; assertionsFirst: boolean });
      expect(info.project.use.trace).toBe(trace ? "retain-on-failure" : "off");
      context = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: { width: 1440, height: 1000 } });
      page = await context.newPage();
      await page.goto("/play");
      await page.getByRole("button", { name: "Create an account" }).click();
      await page.getByLabel("Handle").fill(`interference_${randomUUID().slice(0, 8)}`);
      await page.getByLabel("Password").fill("interference-password");
      await page.getByRole("button", { name: "Register" }).click();
      await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    });
    test.afterAll(async () => { await context?.close(); });
    for (let sample = 0; sample < 2; sample++) test(`native arrival ${sample}`, async () => {
      await page.goto("/play");
      const open = page.getByRole("button", { name: /Rehearse this position:/ }).first();
      await expect(open).toBeVisible();
      await observeWarmArrival(page);
      await open.click();
      if (assertionsFirst) await waitForPlayableBoard(page);
      await page.waitForFunction(() => ((window as ArrivalWindow).__tabiyaArrivalTiming?.readyMs ?? -1) >= 0);
      const timing = await page.evaluate(() => {
        const timing = (window as ArrivalWindow).__tabiyaArrivalTiming!;
        const requests = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
          .filter(entry => entry.initiatorType === "fetch" && entry.startTime >= timing.clickMs && entry.startTime <= timing.readyMs);
        return {
          arrivalMs: timing.readyMs - timing.clickMs,
          requests: requests.length,
          shapeDocuments: requests.filter(entry => new URL(entry.name).pathname.startsWith("/shapes/")).length,
          runPacks: requests.filter(entry => /^\/runs\/[^/]+\/pack$/u.test(new URL(entry.name).pathname)).length,
          longestRequestMs: Math.max(0, ...requests.map(entry => entry.duration)),
        };
      });
      rows.push({ block, sample, trace, assertionsFirst, ...timing });
      if (!assertionsFirst) await waitForPlayableBoard(page);
      expect(timing.requests).toBe(41);
      expect(timing.shapeDocuments).toBe(25);
      expect(timing.runPacks).toBe(1);
      expect(timing.arrivalMs).toBeGreaterThan(0);
    });
    test("complete unfiltered context report", () => {
      console.log(`D3771_INTERFERENCE ${JSON.stringify(rows)}`);
      expect(rows).toHaveLength(2);
      expect(rows.map(row => row.sample)).toEqual([0, 1]);
    });
});
