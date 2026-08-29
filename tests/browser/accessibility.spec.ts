import { randomUUID } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] as const;

async function register(page: Page): Promise<void> {
  await page.goto("/play");
  if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(`a11y_${randomUUID().slice(0, 8)}`);
    await page.getByLabel("Password").fill("browser-test-password");
    await page.getByRole("button", { name: "Register" }).click();
  }
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeVisible();
}

async function expectNoWcagViolations(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze();
  expect(results.violations, `${state}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
}

async function expectSafeLiveRegions(page: Page, state: string): Promise<void> {
  const regions = page.locator('[aria-live]');
  expect(await regions.count(), `${state}: no live regions rendered`).toBeGreaterThan(0);
  for (let index = 0; index < await regions.count(); index += 1) {
    const region = regions.nth(index);
    await expect(region, `${state}: live region ${index} has no status role`).toHaveAttribute("role", "status");
    await expect(region, `${state}: live region ${index} is not atomic`).toHaveAttribute("aria-atomic", "true");
    expect(
      await region.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').count(),
      `${state}: live region ${index} contains an interactive descendant`,
    ).toBe(0);
  }
}

test("@matrix automated WCAG scan covers catalogue, settings, and a live rehearsal", async ({ page }) => {
  await register(page);
  await expectNoWcagViolations(page, "position catalogue");
  await expectSafeLiveRegions(page, "position catalogue");
  const resultStatus = page.locator(".result-count");
  const before = await resultStatus.textContent();
  await page.getByPlaceholder("Najdorf, Carlsbad, passed pawn…").fill("no-position-has-this-name");
  await expect(resultStatus).toHaveText("0 positions");
  expect(await resultStatus.textContent()).not.toBe(before);

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Review deletion effects" }).click();
  await expect(page.locator(".deletion-preview")).toBeVisible();
  await expect(page.locator(".deletion-preview [data-status-announcement]")).toContainText("Deletion effects loaded");
  await expectNoWcagViolations(page, "settings");
  await expectSafeLiveRegions(page, "settings");

  await page.goto("/play");
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expectNoWcagViolations(page, "live rehearsal");
  await expectSafeLiveRegions(page, "live rehearsal");
});

test("@matrix @mobile the mobile project uses real touch and coarse-pointer semantics", async ({ page }) => {
  await register(page);
  const device = await page.evaluate(() => ({
    coarse: matchMedia("(pointer: coarse)").matches,
    touchPoints: navigator.maxTouchPoints,
    userAgent: navigator.userAgent,
  }));
  expect(device.coarse).toBe(true);
  expect(device.touchPoints).toBeGreaterThan(0);
  expect(device.userAgent).toMatch(/Android|Mobile/u);

  const signOutBox = await page.getByRole("button", { name: "Sign out" }).boundingBox();
  expect(signOutBox, "Sign out has no rendered touch target").not.toBeNull();
  expect(signOutBox!.width).toBeGreaterThanOrEqual(24);
  expect(signOutBox!.height).toBeGreaterThanOrEqual(24);

  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.locator(".compact-tabs button[aria-pressed='true']")).toHaveCount(1);
  await expect(page.locator(".compact-tabs button[aria-pressed='false']")).toHaveCount(2);

  const criticalTargets = [
    page.getByRole("link", { name: "Appearance" }),
  ];
  await page.getByText("Enter a move", { exact: true }).click();
  criticalTargets.push(page.getByLabel("Move in chess notation"), page.getByRole("button", { name: "Submit move" }));
  for (const target of criticalTargets) {
    const box = await target.boundingBox();
    expect(box, "critical touch target has no rendered box").not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(24);
    expect(box!.height).toBeGreaterThanOrEqual(24);
  }
  await page.getByText("Enter a move", { exact: true }).click();

  const supportTab = page.getByRole("button", { name: "Support" });
  await supportTab.click();
  const companion = page.getByRole("dialog", { name: "Run companion" });
  await expect(companion).toBeVisible();
  await expect(page.locator(".position-column")).toHaveAttribute("inert", "");
  expect(await companion.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(companion).toHaveCount(0);
  await expect(supportTab).toBeFocused();
});

test("@matrix @mobile primary non-run journeys own their width without clipped controls", async ({ page }) => {
  await register(page);
  for (const route of ["/", "/play", "/review", "/learn", "/live", "/create", "/library", "/settings"]) {
    await page.goto(route);
    await expect(page.getByText("Loading Tabiya…")).toHaveCount(0);
    const geometry = await page.locator("main, #position-catalogue").first().evaluate((main) => {
      const viewportWidth = document.documentElement.clientWidth;
      const bounds = main.getBoundingClientRect();
      const clippedControls = [...main.querySelectorAll<HTMLElement>("button, input, select, textarea, a[href]")]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.display === "none" || style.visibility === "hidden") return false;
          const rect = element.getBoundingClientRect();
          if (rect.width <= 0 || (rect.left >= -1 && rect.right <= viewportWidth + 1)) return false;
          let ancestor = element.parentElement;
          while (ancestor !== null && ancestor !== main) {
            const ancestorStyle = getComputedStyle(ancestor);
            if (["auto", "scroll"].includes(ancestorStyle.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + 1) return false;
            ancestor = ancestor.parentElement;
          }
          return true;
        })
        .map((element) => element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName);
      return {
        left: bounds.left,
        right: bounds.right - viewportWidth,
        overflow: main.scrollWidth - main.clientWidth,
        clippedControls,
      };
    });
    expect(geometry.left, `${route}: main begins outside the viewport`).toBeGreaterThanOrEqual(-1);
    expect(geometry.right, `${route}: main ends outside the viewport`).toBeLessThanOrEqual(1);
    expect(geometry.overflow, `${route}: main owns hidden horizontal content`).toBeLessThanOrEqual(1);
    expect(geometry.clippedControls, `${route}: controls are clipped`).toEqual([]);
  }
});
