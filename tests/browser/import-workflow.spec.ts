import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

import { chooseRawRung } from "./play-helpers.js";

const PGN = '[Event "Retained source"]\n[White "Source White"]\n[Black "Source Black"]\n[Result "*"]\n\n1. e4 e5 *';

for (const mobile of [false, true]) {
  test(`D3748 import fields explain their actual contracts and retain failed submissions${mobile ? " @mobile" : ""}`, async ({ page }) => {
    const handle = `import_${randomUUID().slice(0, 8)}`;
    expect((await page.request.post("/auth/register", { data: { handle, password: "import-workflow-password" } })).status()).toBe(201);
    let imports = 0;
    page.on("request", request => { if (request.method() === "POST" && new URL(request.url()).pathname === "/runs/import") imports += 1; });
    await page.goto("/review");
    let source = page.locator('[data-import-source="game"]');
    const url = "https://lichess.org/abcdefgh";
    await source.getByLabel("PGN", { exact: true }).fill(PGN);
    await source.getByLabel("Lichess game URL", { exact: true }).fill(url);
    await expect(source.getByLabel("PGN", { exact: true })).toHaveAccessibleDescription(/without analysis variations.*game URL will be used/u);
    let posted: unknown;
    await page.route("**/runs/import", async route => {
      posted = route.request().postDataJSON();
      await route.fulfill({ status: 503, json: { error: { code: "IMPORT_SOURCE_UNAVAILABLE", message: "private failure" } } });
    });
    await page.getByRole("button", { name: "Build game story", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Lichess did not answer in time");
    expect(posted).toMatchObject({ source: { kind: "lichess", url } });
    await expect(source.getByLabel("PGN", { exact: true })).toHaveValue(PGN);
    await expect(source.getByLabel("Lichess game URL", { exact: true })).toHaveValue(url);
    await page.unroute("**/runs/import");
    await source.getByLabel("Lichess game URL", { exact: true }).fill("");
    await expect(source.getByRole("status")).toHaveCount(0);
    await page.route("**/runs/*/reveal", route => route.fulfill({ status: 503, json: { error: { code: "UNAVAILABLE", message: "private preparation failure" } } }));
    await page.getByRole("button", { name: "Build game story", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("The game is saved, but its Story could not be prepared");
    await expect(source.getByLabel("PGN", { exact: true })).toHaveAccessibleDescription(/without importing it again/u);
    await expect(source.getByLabel("PGN", { exact: true })).toBeDisabled();
    expect(imports).toBe(2);
    await page.unroute("**/runs/*/reveal");
    await page.getByRole("button", { name: "Finish Story setup", exact: true }).click();
    await expect(page).toHaveURL(/\/review\/game\/import-/u);
    await expect(page.getByRole("heading", { name: "Source White – Source Black", exact: true })).toBeVisible();
    expect(imports).toBe(2);

    await page.goto("/create");
    await page.getByRole("button", { name: /^Finished game/u }).click();
    source = page.locator('[data-import-source="game"]');
    await page.getByLabel("Draft title", { exact: true }).fill("Retained import draft");
    await source.getByLabel("PGN", { exact: true }).fill(PGN);
    await expect(source.getByLabel("PGN", { exact: true })).toHaveAccessibleDescription(/one played main line/u);
    await page.route("**/runs/*/distill", route => route.fulfill({ status: 503, json: { error: { code: "UNAVAILABLE", message: "private draft preparation failure" } } }));
    await page.getByRole("button", { name: "Import game to draft", exact: true }).click();
    await expect(page.getByRole("button", { name: "Finish saved game draft", exact: true })).toBeVisible();
    await expect(source.getByLabel("PGN", { exact: true })).toHaveAccessibleDescription(/without importing it again/u);
    expect(imports).toBe(3);
    await page.unroute("**/runs/*/distill");
    await page.getByRole("button", { name: "Finish saved game draft", exact: true }).click();
    await expect(page).toHaveURL(/\/create\/draft\//u);
    await expect(page.getByRole("heading", { name: "Retained import draft", exact: true })).toBeVisible();
    expect(imports).toBe(3);

    await page.goto("/learn");
    source = page.locator('[data-import-source="repertoire"]');
    const repertoire = '[Event "Main"]\n\n1. d4 (1. e4 e5) d5 *\n\n[Event "Second"]\n\n1. c4 e5 *';
    await page.getByLabel("Name", { exact: true }).fill("Shared input repertoire");
    await source.getByLabel("Repertoire PGN", { exact: true }).fill(repertoire);
    await source.getByLabel("Public Lichess study URL", { exact: true }).fill("https://lichess.org/study/abcdefgh");
    await expect(source.getByLabel("Repertoire PGN", { exact: true })).toHaveAccessibleDescription(/variations are kept.*study URL will be used/u);
    await source.getByLabel("Public Lichess study URL", { exact: true }).fill("");
    await page.getByRole("button", { name: "Import repertoire", exact: true }).click();
    await expect(page.getByRole("article").filter({ hasText: "Shared input repertoire" })).toBeVisible();

    // Create an actual imported Arena session over a normal saved run; no native-match
    // substitute, mock session page, or import-only test endpoint.
    await page.goto("/play"); await chooseRawRung(page);
    await page.getByRole("button", { name: "Start and keep the game", exact: true }).click();
    await expect(page.getByLabel("Chessboard")).toBeVisible();
    const runId = new URL(page.url()).pathname.split("/").at(-1)!;
    const response = await page.request.post("/sessions", { data: { runId, kind: "match", title: "Input Arena" } });
    expect(response.status(), await response.text()).toBe(201);
    const { session } = await response.json();
    await page.goto(`/live/session/${session.id}`);
    source = page.locator('[data-import-source="arena"]');
    await expect(source.getByLabel("PGN", { exact: true })).toHaveAccessibleDescription(/this run's exact position.*SetUp and FEN.*URLs are not accepted/u);
    await expect(source.locator('input[type="url"]')).toHaveCount(0);
    await source.getByLabel("PGN", { exact: true }).fill('1. e4 (1. d4) e5 *');
    await page.getByRole("button", { name: "Import leg", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("The PGN remains here");
    await expect(source.getByLabel("PGN", { exact: true })).toHaveValue('1. e4 (1. d4) e5 *');
    await source.getByLabel("PGN", { exact: true }).fill(PGN);
    await page.getByRole("button", { name: "Import leg", exact: true }).click();
    await expect(page.locator("#arena-title").locator("..")).toContainText("Leg 1: Imported and ready to compare");
    await expect(source.getByLabel("PGN", { exact: true })).toHaveValue("");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
