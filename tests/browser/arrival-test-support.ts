import { expect, type Page } from "@playwright/test";

export interface BrowserArrivalTiming {
  clickMs: number;
  readyMs: number;
}

export type ArrivalWindow = Window & { __tabiyaArrivalTiming?: BrowserArrivalTiming };

export async function waitForPlayableBoard(page: Page): Promise<void> {
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

// D3592's exact native click / enabled square board / 64 cells / three consecutive frames.
// Shared with disposable D3771 research so the comparison does not change readiness semantics.
export async function observeWarmArrival(page: Page): Promise<void> {
  await page.getByRole("button", { name: /Rehearse this position:/ }).first().evaluate((button) => {
    const timing: BrowserArrivalTiming = { clickMs: -1, readyMs: -1 };
    (window as ArrivalWindow).__tabiyaArrivalTiming = timing;
    button.addEventListener("click", () => {
      timing.clickMs = performance.now();
      let readyFrames = 0;
      const observeFrame = (): void => {
        const board = document.querySelector<HTMLElement>('[aria-label="Chessboard"]');
        const grid = document.querySelector('[data-board-input-grid]');
        const rect = board?.getBoundingClientRect();
        const visible = board !== null && board.getClientRects().length > 0 && getComputedStyle(board).visibility === "visible";
        const playable = visible && rect !== undefined && rect.width > 0 && rect.width === rect.height &&
          grid?.getAttribute("aria-rowcount") === "8" && grid.getAttribute("aria-colcount") === "8" &&
          grid.getAttribute("aria-readonly") !== "true" && grid.querySelectorAll('[role="gridcell"]').length === 64;
        readyFrames = playable ? readyFrames + 1 : 0;
        if (readyFrames >= 3) timing.readyMs = performance.now();
        else if (performance.now() - timing.clickMs < 30_000) requestAnimationFrame(observeFrame);
      };
      requestAnimationFrame(observeFrame);
    }, { once: true, capture: true });
  });
}

/** Close the native three-frame observation before running the retained verification workload. */
export async function waitForMeasuredPlayableBoard(page: Page): Promise<void> {
  await page.waitForFunction(() => ((window as ArrivalWindow).__tabiyaArrivalTiming?.readyMs ?? -1) >= 0);
  await waitForPlayableBoard(page);
}
