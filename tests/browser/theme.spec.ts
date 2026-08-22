import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

async function register(page: Page): Promise<void> {
  await page.goto("/play");
  if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(`theme_${randomUUID().slice(0, 8)}`);
    await page.getByLabel("Password").fill("browser-test-password");
    await page.getByRole("button", { name: "Register" }).click();
  }
  await expect(page.getByText("Choose a position worth returning to.")).toBeVisible();
}

test("appearance axes apply live without replacing the board or its position", async ({ page }) => {
  await register(page);
  await page.getByRole("button", { name: "Start game" }).click();
  const shell = page.locator(".board-shell").first();
  const board = shell.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  await expect(shell.getByRole("link", { name: "Appearance" })).toHaveAttribute("href", "/settings#appearance-settings");

  const before = await board.evaluate((element) => {
    element.setAttribute("data-theme-identity", "same-board");
    return {
      background: getComputedStyle(element.querySelector("cg-board")!).backgroundImage,
      pieces: [...element.querySelectorAll("piece")].map((piece) => `${piece.className}:${(piece as HTMLElement).style.transform}`).sort(),
    };
  });

  await page.evaluate(() => {
    localStorage.setItem("tabiya.theme", JSON.stringify({ appTheme: "tokyo-night", boardTheme: "olive", pieceSet: "mono", modeOverride: "dark", animation: "fast" }));
    dispatchEvent(new StorageEvent("storage", { key: "tabiya.theme" }));
  });

  await expect(shell).toHaveAttribute("data-board-theme", "olive");
  await expect(shell).toHaveAttribute("data-piece-set", "mono");
  await expect(shell).toHaveAttribute("data-animation", "fast");
  await expect(board).toHaveAttribute("data-theme-identity", "same-board");
  await expect(page.locator("html")).toHaveAttribute("data-app-theme", "tokyo-night");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#1a1b26");

  const after = await board.evaluate((element) => ({
    background: getComputedStyle(element.querySelector("cg-board")!).backgroundImage,
    pieces: [...element.querySelectorAll("piece")].map((piece) => `${piece.className}:${(piece as HTMLElement).style.transform}`).sort(),
  }));
  expect(after.background).not.toBe(before.background);
  expect(after.pieces).toEqual(before.pieces);

  await page.evaluate(() => {
    type AnimationSample = { at: number; transforms: string[] };
    const target = window as unknown as { __themeAnimationSamples: AnimationSample[] };
    target.__themeAnimationSamples = [];
    const board = document.querySelector(".board-shell cg-board")!;
    const started = performance.now();
    const sample = (): void => {
      const transforms = [...board.querySelectorAll<HTMLElement>("piece.anim")].map((piece) => piece.style.transform);
      if (transforms.length > 0) target.__themeAnimationSamples.push({ at: performance.now(), transforms });
      if (performance.now() - started < 500) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await shell.getByText("Enter a move").click();
  await shell.getByLabel("Move in SAN or UCI").fill("e2e4");
  await shell.getByRole("button", { name: "Submit move" }).click();
  await expect.poll(() => page.evaluate(() => {
    type AnimationSample = { at: number; transforms: string[] };
    const samples = (window as unknown as { __themeAnimationSamples: AnimationSample[] }).__themeAnimationSamples;
    return new Set(samples.flatMap((sample) => sample.transforms)).size;
  })).toBeGreaterThan(2);
  const animationSpan = await page.evaluate(() => {
    type AnimationSample = { at: number; transforms: string[] };
    const samples = (window as unknown as { __themeAnimationSamples: AnimationSample[] }).__themeAnimationSamples;
    return samples.at(-1)!.at - samples[0]!.at;
  });
  expect(animationSpan).toBeGreaterThanOrEqual(60);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(shell).toHaveAttribute("data-animation", "none");
});

test("Settings exposes independent persisted pickers and inherited contrast disclosure", async ({ page }) => {
  await register(page);
  await page.goto("/settings#appearance-settings");
  const appearance = page.getByRole("region", { name: "Appearance" });
  await expect(appearance).toBeVisible();
  await appearance.getByLabel("App theme").selectOption("tokyo-night");
  await appearance.getByLabel("Light or dark").selectOption("light");
  await appearance.getByLabel("Board").selectOption("olive");
  await appearance.getByLabel("Pieces").selectOption("mono");
  await appearance.getByLabel("Piece movement").selectOption("fast");
  await expect(appearance.getByText("Using Tokyo Night in light mode.")).toBeVisible();
  await expect(appearance.getByText("3 measured low-contrast pairs")).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("tabiya.theme") ?? "{}"));
  expect(stored).toEqual({ appTheme: "tokyo-night", boardTheme: "olive", pieceSet: "mono", modeOverride: "light", animation: "fast" });
  expect(stored).not.toHaveProperty("version");
});
