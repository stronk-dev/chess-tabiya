/**
 * rfc/provider-health-degradation.md criteria 18 and 22 (browser half) and the live half of
 * rfc/opponent-recovery-journey.md: when a provider is off or fails, the learner sees an honest
 * degraded control in place — never a vanished one — and a failed opponent pauses the run with
 * Retry and Change opponent while the board keeps its geometry.
 */
import { randomUUID } from "node:crypto";

import { expect, test, type Page, type Route } from "@playwright/test";

import { chooseRawRung } from "./play-helpers.js";

const VIEWPORTS = [
  { name: "phone", width: 390, height: 844 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

async function register(page: Page): Promise<void> {
  await page.goto("/play");
  if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(`health_${randomUUID().slice(0, 8)}`);
    await page.getByLabel("Password").fill("browser-test-password");
    await page.getByRole("button", { name: "Register" }).click();
  }
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

function squarePoint(box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }, square: string): { readonly x: number; readonly y: number } {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return { x: box.x + ((file + 0.5) * box.width) / 8, y: box.y + ((7 - rank + 0.5) * box.height) / 8 };
}

async function move(page: Page, from: string, to: string): Promise<void> {
  const board = page.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  const box = (await board.boundingBox())!;
  const origin = squarePoint(box, from);
  const destination = squarePoint(box, to);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 8 });
  await page.mouse.up();
}

/** A typed provider failure exactly as the server's error envelope carries it. */
async function failSelection(route: Route): Promise<void> {
  await route.fulfill({
    status: 503,
    json: { error: { code: "PROVIDER_UNAVAILABLE", message: "Provider operation opponent.maia_inference is unavailable", operation: "opponent.maia_inference", availability: { state: "unavailable", instanceIds: ["maia-inference"], reason: "process_exit" }, retryAfterMs: null } },
  });
}

test.beforeEach(async ({ page }) => register(page));

for (const viewport of VIEWPORTS) {
  test(`a failed opponent pauses the run with Retry and Change opponent at ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/play");
    await chooseRawRung(page);
    await page.getByRole("button", { name: "Start and keep the game" }).click();
    const board = page.getByLabel("Chessboard");
    await expect(board).toBeVisible();
    const before = (await board.boundingBox())!;

    let failures = 1;
    await page.route(/\/select-move$/u, async (route) => {
      if (failures > 0) {
        failures -= 1;
        await failSelection(route);
      } else {
        await route.continue();
      }
    });
    await move(page, "e2", "e4");
    const pause = page.getByTestId("opponent-pause");
    await expect(pause).toBeVisible();
    await expect(pause).toContainText("The opponent is paused.");
    await expect(pause).toContainText("the service has stopped and is being restarted");
    await expect(pause).toContainText("Your move is kept; no opponent move was played for you.");
    // Ordinary play never shows provider ids or raw failure strings.
    await expect(pause).not.toContainText("maia");
    await expect(pause).not.toContainText("process_exit");
    await expect(pause.getByRole("button", { name: "Retry" })).toBeEnabled();
    await expect(pause.getByRole("button", { name: /Change opponent/u })).toBeVisible();
    const after = (await board.boundingBox())!;
    expect(after.width).toBeCloseTo(before.width, 0);

    await pause.getByRole("button", { name: "Retry" }).click();
    await expect(pause).toHaveCount(0);
    const runId = page.url().split("/").at(-1)!;
    await expect.poll(async () => {
      const page0 = await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json() as { events: { type: string }[] };
      return page0.events.filter((event) => event.type === "opponent.move_selected").length;
    }).toBe(1);
  });
}

test("Change opponent plays on against the chosen opponent and says the run record does not retain it", async ({ page }) => {
  await page.goto("/play");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  let failures = 1;
  const modes: string[] = [];
  await page.route(/\/select-move$/u, async (route) => {
    modes.push((route.request().postDataJSON() as { policy: { mode: string } }).policy.mode);
    if (failures > 0) {
      failures -= 1;
      await failSelection(route);
    } else {
      await route.continue();
    }
  });
  await move(page, "e2", "e4");
  const pause = page.getByTestId("opponent-pause");
  await expect(pause).toBeVisible();
  await pause.getByRole("button", { name: "Change opponent: the engine opponent" }).click();
  await expect(pause).toHaveCount(0);
  await expect(page.getByTestId("opponent-change")).toHaveText("This session changed opponent after a provider failure; the run record does not retain it.");
  expect(modes).toEqual(["human_common", "strong_engine"]);
});

test("provider-off controls stay in place with their reason and a retry affordance", async ({ page }) => {
  await page.route(/\/capabilities$/u, async (route) => {
    const response = await route.fetch();
    const descriptor = await response.json() as { providerHealth: { providers: Record<string, unknown>[]; operations: { operation: string; availability: unknown }[] } };
    const explorer = descriptor.providerHealth.providers.find((row) => row.instanceId === "explorer-primary")!;
    const at = "2026-09-24T12:00:00.000Z";
    const providers = descriptor.providerHealth.providers.map((row) => row.instanceId === "explorer-primary"
      ? { instanceId: "explorer-primary", familyId: "explorer", state: "unavailable", implementation: explorer.implementation, generation: explorer.generation, reason: "rate_limited", retryAfterMs: 60_000, cacheScope: "none", checkedAt: at, lastSuccessAt: null, lastFailureAt: at }
      : row);
    const operations = descriptor.providerHealth.operations.map((row) => row.operation === "evidence.explorer_query"
      ? { operation: row.operation, availability: { state: "unavailable", instanceIds: ["explorer-primary"], reason: "rate_limited" } }
      : row);
    await route.fulfill({ response, json: { ...descriptor, providerHealth: { ...descriptor.providerHealth, providers, operations } } });
  });
  await page.goto("/play");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await move(page, "e2", "e4");
  await expect(page.getByText("Active line 2 turns")).toBeVisible();
  await expect(page.getByText("Thinking…")).toHaveCount(0);
  const runId = page.url().split("/").at(-1)!;
  const writerId = await page.evaluate((id) => localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
  const reveal = await page.request.post(`/runs/${runId}/reveal`, { headers: { "x-writer-id": writerId! }, data: {} });
  expect(reveal.ok()).toBe(true);
  await page.reload();
  await page.locator("details.assistance-control summary").click();
  await page.getByRole("button", { name: "Advanced support controls" }).click();
  await page.getByLabel("Corpus counts on request").check();
  // The control does not disappear: it offers a retry and says why, in task language.
  await expect(page.getByRole("button", { name: "Retry human-game corpus evidence" })).toBeVisible();
  const corpus = page.getByRole("region", { name: "Corpus evidence" });
  await expect(corpus.getByTestId("corpus-provider-notice")).toHaveText("Human-game statistics is unavailable right now: the service asked us to slow down.");
  // Provider-off is never worded as a domain answer.
  await expect(corpus).not.toContainText("no games");
  await page.goto("/settings");
  const services = page.locator("#deployment-services");
  await expect(services.locator('[data-provider="explorer-primary"]')).toContainText("Unavailable");
  await expect(services.locator('[data-provider="external-voice"]')).toContainText("Not configured");
});
