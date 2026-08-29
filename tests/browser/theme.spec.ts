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
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeVisible();
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

test("appearance axes apply live without replacing the board or its position", async ({ page }) => {
  await register(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
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

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(shell).toHaveAttribute("data-animation", "none");
});

test("Settings exposes independent persisted pickers and inherited contrast disclosure", async ({ page }) => {
  await register(page);
  await page.goto("/settings#appearance-settings");
  const appearance = page.getByRole("region", { name: "Appearance" });
  await expect(appearance).toBeVisible();
  await appearance.getByRole("combobox", { name: "App theme", exact: true }).selectOption("tokyo-night");
  await appearance.getByRole("combobox", { name: "Light or dark", exact: true }).selectOption("light");
  await appearance.getByRole("combobox", { name: "Board", exact: true }).selectOption("olive");
  await appearance.getByRole("combobox", { name: "Pieces", exact: true }).selectOption("mono");
  await appearance.getByRole("combobox", { name: "Piece movement", exact: true }).selectOption("fast");
  await expect(appearance.getByText("Using Tokyo Night in light mode.")).toBeVisible();
  await expect(appearance.getByText("3 measured low-contrast pairs")).toBeVisible();
  const preview = appearance.getByLabel("Board and piece preview");
  const previewShell = preview.locator(".board-shell");
  await expect(previewShell).toHaveAttribute("data-board-theme", "olive");
  await expect(previewShell).toHaveAttribute("data-piece-set", "mono");
  await expect(preview.locator("square.check")).toHaveCount(1);
  await expect(preview.locator("square.last-move")).toHaveCount(2);
  expect(await preview.locator("square.move-dest").count()).toBeGreaterThan(0);
  await expect(preview.locator("svg.cg-shapes")).toBeAttached();
  for (const side of ["white", "black"]) for (const role of ["king", "queen", "rook", "bishop", "knight", "pawn"]) {
    await expect(preview.locator(`piece.${side}.${role}`).first()).toBeAttached();
  }
  const chrome = appearance.locator(".chrome-preview");
  expect(await chrome.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(225, 226, 231)");
  expect(await chrome.getByRole("button", { name: "Accent action" }).evaluate((element) => getComputedStyle(element).backgroundColor)).toBe("rgb(46, 125, 233)");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("tabiya.theme") ?? "{}"));
  expect(stored).toEqual({ appTheme: "tokyo-night", boardTheme: "olive", pieceSet: "mono", modeOverride: "light", animation: "fast" });
  expect(stored).not.toHaveProperty("version");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(appearance.getByLabel("Piece movement")).toBeDisabled();
  await expect(appearance.getByText("Your device requests reduced motion")).toBeVisible();
});

test("Settings native controls share the token-driven application baseline", async ({ page }) => {
  await register(page);
  await page.goto("/settings");
  const result = await page.evaluate(() => {
    const select = document.querySelector<HTMLSelectElement>("select");
    const checkbox = document.querySelector<HTMLInputElement>('input[type="checkbox"]');
    const password = document.querySelector<HTMLInputElement>('input[type="password"]');
    const button = document.querySelector<HTMLButtonElement>("button");
    if (select === null || checkbox === null || password === null || button === null) throw new Error("Settings control fixture is incomplete");
    const styles = [select, password, button].map((element) => getComputedStyle(element));
    const checkboxStyle = getComputedStyle(checkbox);
    const tokenColor = (name: string): string => {
      const probe = document.createElement("span");
      probe.style.backgroundColor = `var(${name})`;
      document.body.append(probe);
      const value = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return value;
    };
    return {
      fonts: styles.map((style) => style.fontFamily),
      minimumHeights: styles.map((style) => Number.parseFloat(style.minHeight)),
      selectBackground: styles[0]!.backgroundColor,
      passwordBackground: styles[1]!.backgroundColor,
      panel: tokenColor("--panel"),
      surface: tokenColor("--surface"),
      checkboxSize: [Number.parseFloat(checkboxStyle.inlineSize), Number.parseFloat(checkboxStyle.blockSize)],
      checkboxAccent: checkboxStyle.accentColor,
    };
  });
  expect(new Set(result.fonts).size).toBe(1);
  expect(result.minimumHeights.every((height) => height >= 40)).toBe(true);
  expect(result.selectBackground).toBe(result.surface);
  expect(result.passwordBackground).toBe(result.panel);
  expect(result.checkboxSize.every((size) => size >= 17)).toBe(true);
  expect(result.checkboxAccent).not.toBe("auto");
});

test("system display preferences keep board semantics visible without colour alone", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await register(page);
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-app-theme", "warm-dark");

  await page.getByRole("button", { name: "Start and keep the game" }).click();
  const board = page.getByLabel("Chessboard");
  const box = await board.boundingBox();
  if (box === null) throw new Error("Chessground board has no bounding box");
  const e2 = squarePoint(box, "e2");
  await page.mouse.click(e2.x, e2.y);
  const destination = page.locator("cg-board square.move-dest").first();
  await expect(destination).toBeAttached();

  await page.emulateMedia({ colorScheme: "dark", forcedColors: "active" });
  await expect.poll(() => destination.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("dotted");
  expect(await destination.evaluate((element) => getComputedStyle(element).backgroundImage)).not.toContain("gradient");

  await destination.evaluate((element) => element.classList.add("oc"));
  expect(await destination.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe("double");
  expect(await destination.evaluate((element) => {
    element.setAttribute("class", "check");
    return {
      style: getComputedStyle(element).outlineStyle,
      width: getComputedStyle(element).outlineWidth,
    };
  })).toEqual({ style: "double", width: "6px" });

  await page.emulateMedia({ colorScheme: "dark", forcedColors: "none", reducedMotion: "reduce" });
  const visibleButton = page.locator("button:visible").first();
  await visibleButton.focus();
  expect(await visibleButton.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("1e-06s");
});
