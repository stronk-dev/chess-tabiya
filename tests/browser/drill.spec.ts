import { mkdir, writeFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

interface LatencyEnvelope {
  readonly boardReadyMs: number;
  readonly rewindMs: number;
  readonly branchSwitchMs: number;
  readonly uncachedMockReplyMs: number;
  readonly cachedMockReplyMs: number;
}

function squarePoint(
  box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  square: string,
): { readonly x: number; readonly y: number } {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return {
    x: box.x + ((file + 0.5) * box.width) / 8,
    y: box.y + ((7 - rank + 0.5) * box.height) / 8,
  };
}

async function move(page: Page, from: string, to: string): Promise<void> {
  const box = await page.locator("cg-board").boundingBox();
  if (box === null) throw new Error("Chessground board has no bounding box");
  const origin = squarePoint(box, from);
  const destination = squarePoint(box, to);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 8 });
  await page.mouse.up();
}

test("served Najdorf pack plays, rewinds, branches, compares, and exports", async ({
  page,
}) => {
  await page.goto("/play");
  const list = await page.request.get("/packs");
  expect(list.ok()).toBe(true);
  const served = (await list.json()) as {
    id: string;
    reviewStatus: string;
  }[];
  expect(served).toHaveLength(1);
  expect(served[0]).toMatchObject({ reviewStatus: "schema_example" });
  const detail = await page.request.get(`/packs/${served[0]!.id}`);
  expect(detail.ok()).toBe(true);
  expect((await detail.json()).opponentPolicy.mode).toBe("human_common");

  await expect(page.getByText("schema example")).toBeVisible();
  const boardStart = await page.evaluate(() => performance.now());
  await page.getByRole("button", { name: /Open position/ }).click();
  await expect(page.locator("cg-board")).toBeVisible();
  const boardReadyMs =
    (await page.evaluate(() => performance.now())) - boardStart;

  await move(page, "c1", "e3");
  await expect(page.getByRole("heading", { name: "Choose the setup" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Predict the reply" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Active line 2 plies")).toBeVisible();

  await move(page, "f2", "f3");
  await expect(
    page.getByRole("heading", { name: "Critical race resolved" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  const rewindStart = await page.evaluate(() => performance.now());
  await page.keyboard.press("r");
  await expect(page.getByText("Active line 2 plies")).toBeVisible();
  const rewindMs =
    (await page.evaluate(() => performance.now())) - rewindStart;

  await page.keyboard.press("b");
  await page.getByLabel("Label").fill("quiet setup");
  await page.getByLabel("Intent").fill("Compare a lower-commitment setup");
  await page.getByRole("button", { name: "Create branch" }).click();
  await move(page, "f1", "e2");
  await expect(page.getByText("Active line 4 plies")).toBeVisible();

  const branchStart = await page.evaluate(() => performance.now());
  await page.getByRole("button", { name: /Switch to branch 1: main/ }).click();
  await expect(page.locator(".rail li.active strong")).toHaveText("main");
  const branchSwitchMs =
    (await page.evaluate(() => performance.now())) - branchStart;
  await page.getByRole("button", { name: /Switch to branch 2: quiet setup/ }).click();
  await expect(page.locator(".rail li.active strong")).toHaveText("quiet setup");

  await page.locator("main.drill").focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("heading", { name: "Same decision, two consequences." }),
  ).toBeVisible();
  await expect(page.locator(".boards article")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "quiet setup" })).toHaveCount(2);

  await page
    .getByRole("heading", { name: "Same decision, two consequences." })
    .focus();
  const downloadPromise = page.waitForEvent("download");
  const pgnResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/pgn"),
    { timeout: 5_000 },
  );
  await page.keyboard.press("e");
  const pgnResponse = await pgnResponsePromise;
  expect(pgnResponse.ok(), await pgnResponse.text()).toBe(true);
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (downloadPath === null) throw new Error("PGN download did not reach disk");
  const pgn = await (await import("node:fs/promises")).readFile(downloadPath, "utf8");
  expect(pgn).toContain('[Event "Tabiya drill: najdorf-transition-schema-example"]');
  expect(pgn).toMatch(/\([^)]*\)/);

  await page.keyboard.press("Tab");
  await expect(page.locator("main.drill")).toBeFocused();
  const playNavigation = page.locator("#primary-navigation a[href='/play']");
  await playNavigation.focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#primary-navigation a[href='/learn']")).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Same decision, two consequences." }),
  ).toHaveCount(0);
  await page.locator("main.drill").focus();
  await page.keyboard.press("g");
  await page.keyboard.press("m");
  await expect(page.locator("#primary-navigation a").first()).toBeFocused();

  const selectorLatency = await page.evaluate(async () => {
    const packResponse = await fetch("/packs");
    const packs = (await packResponse.json()) as { id: string; digest: string }[];
    const packDetail = await fetch(`/packs/${packs[0]!.id}`);
    const pack = await packDetail.json();
    const body = JSON.stringify({
      startFen: pack.start.fen,
      historyUci: ["c1e3"],
      policy: {
        mode: "human_common",
        policyConfigDigest: packs[0]!.digest,
        targetElo: 1800,
      },
      seed: 901,
    });
    const select = async () => {
      const started = performance.now();
      const response = await fetch("/select-move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      if (!response.ok) throw new Error(await response.text());
      await response.json();
      return performance.now() - started;
    };
    return { uncached: await select(), cached: await select() };
  });

  const latency: LatencyEnvelope = {
    boardReadyMs,
    rewindMs,
    branchSwitchMs,
    uncachedMockReplyMs: selectorLatency.uncached,
    cachedMockReplyMs: selectorLatency.cached,
  };
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/browser-latency.json",
    `${JSON.stringify(latency, null, 2)}\n`,
  );
  console.log(`BROWSER_LATENCY ${JSON.stringify(latency)}`);

  for (const measurement of Object.values(latency)) {
    expect(Number.isFinite(measurement)).toBe(true);
    expect(measurement).toBeGreaterThanOrEqual(0);
  }
});

test("every shell route owns the viewport at both desktop projections", async ({
  page,
}) => {
  const projections = [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ] as const;

  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await page.getByRole("button", { name: /Open position/ }).click();
    await expect(page.locator("cg-board")).toBeVisible();
    const runPath = new URL(page.url()).pathname;
    const routes = [
      "/",
      "/play",
      runPath,
      "/review",
      "/learn",
      "/live",
      "/create",
      "/library",
      "/settings",
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByText("Loading Tabiya…")).toHaveCount(0);
      const dimensions = await page.evaluate(() => ({
        scrollHeight: document.scrollingElement!.scrollHeight,
        clientHeight: document.scrollingElement!.clientHeight,
      }));
      expect(
        dimensions.scrollHeight,
        `${route} at ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(dimensions.clientHeight + 1);

      if (route === runPath) {
        const board = await page.locator("cg-board").boundingBox();
        const timeline = await page.locator(".timeline-row").boundingBox();
        expect(board).not.toBeNull();
        expect(timeline).not.toBeNull();
        expect(board!.x).toBeGreaterThanOrEqual(-1);
        expect(board!.y).toBeGreaterThanOrEqual(-1);
        expect(board!.x + board!.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(board!.y + board!.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(board!.y + board!.height).toBeLessThanOrEqual(timeline!.y + 1);
      }
    }
  }
});
