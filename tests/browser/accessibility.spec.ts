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
  await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeVisible();
}

async function expectNoWcagViolations(page: Page, state: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags([...WCAG_TAGS]).analyze();
  expect(results.violations, `${state}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
}

test("@matrix automated WCAG scan covers catalogue, settings, and a live rehearsal", async ({ page }) => {
  await register(page);
  await expectNoWcagViolations(page, "position catalogue");

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "This deployment" })).toBeVisible();
  await expectNoWcagViolations(page, "settings");

  await page.goto("/play");
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expectNoWcagViolations(page, "live rehearsal");
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
  criticalTargets.push(page.getByLabel("Move in SAN or UCI"), page.getByRole("button", { name: "Submit move" }));
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
