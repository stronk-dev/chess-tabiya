import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";
import type { DrillRun } from "../../packages/runtime/src/types.js";
import { assertOnlyEvidenceAppended, assertRecordedNodesPreserved } from "../../packages/runtime/src/testing/recorded-play.js";
import type { RunGraph } from "../../apps/web/src/lib/api.js";

for (const mobile of [false, true]) {
  test(`Campaign encounter help follows confirmed entry equipment and help style${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const mapPath = new URL(page.url()).pathname;
    await playPackNode(page, "f1-a");
    const runId = await startNode(page, "f2-a");
    const strip = page.getByRole("complementary", { name: "Campaign encounter" });
    const help = strip.getByTestId("campaign-encounter-help");
    await expect(help).toContainText("Help for this encounter: After-move nudge");
    const edge = await playableBoard(page);
    const events = await (await page.request.get(`/runs/${runId}/events`)).json();
    await strip.getByRole("button", { name: "Map", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    await page.getByRole("region", { name: "Your campaign kit" }).getByRole("checkbox", { name: "After-move nudge", exact: true }).uncheck();
    await expect(page.getByRole("region", { name: "Your campaign kit" }).getByRole("checkbox", { name: "After-move nudge", exact: true })).not.toBeChecked();
    await page.getByRole("button", { name: "Continue encounter", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/play/run/${runId}$`, "u"));
    await expect(help).toContainText("After-move nudge");
    await expect(help).toContainText("Equipment changes on the map apply to your next encounter");
    await page.reload();
    await expect(help).toContainText("After-move nudge");
    await playableBoard(page, edge);
    await page.locator("details.assistance-control summary").click();
    await page.getByRole("radio", { name: /^Quiet/u }).check();
    await expect(help).toContainText("Help for this encounter: legal moves only");
    await expect(help).not.toContainText("After-move nudge");

    // A failed read must not masquerade as a confirmed silent kit. Retry uses the same request.
    let fail = true;
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route(`**/runs/${runId}/assistance`, async route => {
      if (fail) {
        await pending;
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "HTTP_ERROR", message: "Temporary help failure" } }) });
      }
      else await route.continue();
    });
    await page.reload();
    try {
      await expect(help).toContainText("Confirming help for this encounter");
      await expect(help).not.toContainText("Help for this encounter: legal moves only");
    } finally { release(); }
    await expect(help).toContainText("Help could not be confirmed");
    await expect(help).not.toContainText("Help for this encounter: legal moves only");
    await page.locator("details.assistance-control summary").click();
    fail = false;
    await page.getByRole("button", { name: "Retry confirming help", exact: true }).click();
    await expect(help).toContainText("Help for this encounter: legal moves only");
    await expect(page.getByRole("dialog", { name: "Choose help style" })).toHaveCount(0);
    await expect(page.locator("details.assistance-control summary")).toBeFocused();
    await playableBoard(page, edge);
    expect(await (await page.request.get(`/runs/${runId}/events`)).json()).toEqual(events);
  });

  test(`Campaign actions preserve a newer encounter read when an older charge response arrives${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const campaignId = new URL(page.url()).pathname.split("/").at(-1)!;
    await playPackNode(page, "f1-b"); // Existing seal grant plus resource reward: three charges.
    const runId = await startNode(page, "f2-a");
    await move(page, "c1", "e3");
    await expect.poll(() => moveCount(page, runId), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
    const edge = await playableBoard(page);
    const path = `**/runs/${runId}/fork`;
    let release!: () => void, delivered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const delivery = new Promise<void>(resolve => { delivered = resolve; });
    let held: { writer: string; campaignRevision: number } | undefined;
    const sent: { nodeId: string; campaignCommand: { expectedCampaignRevision: number; commandId: string } }[] = [];
    await page.route(path, async route => {
      if (route.request().method() !== "POST") { await route.continue(); return; }
      sent.push(route.request().postDataJSON());
      if (sent.length !== 1) { await route.continue(); return; }
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      const result = await response.json() as { campaign: { campaignRevision: number } };
      held = { writer: route.request().headers()["x-writer-id"]!, campaignRevision: result.campaign.campaignRevision };
      await gate;
      await route.fulfill({ response });
      delivered();
    });
    let otherTab: Page | undefined;
    try {
      await page.getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("button", { name: "Fork branch", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Name the experiment." });
      await dialog.getByLabel("What are you trying?").fill("First saved experiment");
      await dialog.getByRole("button", { name: "Create branch", exact: true }).click();
      await expect.poll(() => held !== undefined).toBe(true);
      expect(held!.writer).toBeTruthy();
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      const collapse = page.getByRole("button", { name: "Collapse companion", exact: true });
      if (await collapse.isVisible()) await collapse.click();
      await page.getByRole("complementary", { name: "Campaign encounter" }).getByRole("button", { name: "Map", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/campaign/${campaignId}$`, "u"));
      otherTab = await page.context().newPage();
      await otherTab.goto(`/campaign/${campaignId}`);
      await expect(otherTab.getByRole("button", { name: "Continue encounter", exact: true })).toBeVisible();
      const newer = await otherTab.request.post(`/runs/${runId}/fork`, {
        headers: { "x-writer-id": held!.writer },
        data: { nodeId: sent[0]!.nodeId, label: "Other tab", intent: "Second saved experiment", campaignCommand: {
          commandId: `cmd-${randomUUID()}`, expectedCampaignRevision: held!.campaignRevision,
          expectedPlayRevision: ((await (await otherTab.request.get(`/runs/${runId}/events`)).json()) as { events: DrillRun["events"] }).events.at(-1)!.seq,
        } },
      });
      expect(newer.ok()).toBe(true);
      const confirmed = await (await otherTab.request.get(`/campaign-runs/${campaignId}`)).json() as { campaignRun: { revision: number }; charges: { balance: number; spent: number } };
      expect(confirmed.charges).toMatchObject({ balance: 1, spent: 2 });
      expect(confirmed.campaignRun.revision).toBeGreaterThan(held!.campaignRevision);
      await page.getByRole("button", { name: "Continue encounter", exact: true }).click();
      await expect(page.getByTestId("campaign-strip-charges")).toContainText("1 remaining");
      release();
      await delivery;
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      await page.getByRole("button", { name: "Actions", exact: true }).click();
      await page.getByRole("button", { name: "Fork branch", exact: true }).click();
      await dialog.getByLabel("What are you trying?").fill("After the older receipt");
      await dialog.getByRole("button", { name: "Create branch", exact: true }).click();
      await expect(dialog).not.toBeVisible();
      expect(sent).toHaveLength(2);
      expect(sent[1]!.campaignCommand.expectedCampaignRevision).toBe(confirmed.campaignRun.revision);
      const after = await (await page.request.get(`/campaign-runs/${campaignId}`)).json() as { charges: { balance: number; spent: number } };
      expect(after.charges).toMatchObject({ balance: 0, spent: 3 });
      if (await collapse.isVisible()) await collapse.click();
      await playableBoard(page, edge);
    } finally {
      release();
      if (held !== undefined) await delivery;
      await page.unroute(path);
      await otherTab?.close();
    }
  });

  test(`Campaign account deletion discloses progress and recovers stale consent${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const campaignRunId = new URL(page.url()).pathname.split("/").at(-1)!;
    await page.goto("/settings");
    const preview = page.locator(".deletion-preview");
    const campaignEffect = preview.locator("li").filter({ hasText: "Campaign progress, collected tools and reward history" });
    await expect(campaignEffect).toHaveText("Campaign progress, collected tools and reward history are permanently deleted (3)");
    const current = await (await page.request.get(`/campaign-runs/${campaignRunId}`)).json();
    const abandoned = await page.request.post(`/campaign-runs/${campaignRunId}/abandon`, { data: { expectedRevision: current.campaignRun.revision, commandId: `account-abandon-${randomUUID()}` } });
    expect(abandoned.status()).toBe(200);
    const saved = await (await page.request.get(`/campaign-runs/${campaignRunId}`)).json();
    await page.getByLabel("Re-enter password").fill("browser-test-password");
    await page.getByRole("button", { name: "Delete account", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "account could not be deleted" })).toBeVisible();
    expect(await (await page.request.get(`/campaign-runs/${campaignRunId}`)).json()).toEqual(saved);
    const refresh = page.getByRole("button", { name: "Refresh data summary" });
    await refresh.focus();
    await page.keyboard.press("Enter");
    await expect(campaignEffect).toHaveText("Campaign progress, collected tools and reward history are permanently deleted (4)");
    await expect(refresh).toBeFocused();
    await page.getByLabel("Re-enter password").fill("browser-test-password");
    await page.getByRole("button", { name: "Delete account", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    expect((await page.request.get(`/campaign-runs/${campaignRunId}`)).status()).toBe(401);
    expect((await page.request.get("/auth/account-inventory")).status()).toBe(401);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

// rfc/campaign-core.md criterion 4/24 (foundation journey) and rfc/campaign-boss-games.md criterion 13:
// enter the campaign, play pack encounters, play the Act-II boss against a registered bot, see each
// result, and resume after reload. Uses the development-only browser fixture campaign
// (tests/browser/fixtures/campaign.browser.json).

async function register(page: Page): Promise<void> {
  await page.goto("/campaign");
  if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(`campaign_${randomUUID().slice(0, 8)}`);
    await page.getByLabel("Password").fill("browser-test-password");
    await page.getByRole("button", { name: "Register" }).click();
  }
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}

async function move(page: Page, from: string, to: string): Promise<void> {
  const board = page.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  await board.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const box = await board.boundingBox();
  if (box === null) throw new Error("board has no box");
  const point = (square: string) => ({ x: box.x + ((square.charCodeAt(0) - 97 + 0.5) * box.width) / 8, y: box.y + ((8 - Number(square[1]) + 0.5) * box.height) / 8 });
  const origin = point(from);
  const destination = point(to);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 8 });
  await page.mouse.up();
}

function currentRunId(page: Page): string {
  return decodeURIComponent(new URL(page.url()).pathname.split("/").at(-1)!);
}

async function playableBoard(page: Page, expectedEdge?: number): Promise<number> {
  const board = page.getByLabel("Chessboard");
  await board.scrollIntoViewIfNeeded();
  const geometry = await board.evaluate(element => {
    const box = element.getBoundingClientRect();
    let hits = 0;
    for (let file = 0; file < 8; file++) for (let rank = 0; rank < 8; rank++) {
      const target = document.elementFromPoint(box.x + (file + .5) * box.width / 8, box.y + (rank + .5) * box.height / 8);
      if (target !== null && element.contains(target)) hits++;
    }
    return { width: box.width, height: box.height, hits, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
  });
  expect(geometry.width).toBeGreaterThan(0);
  expect(geometry.width).toBeCloseTo(geometry.height, 1);
  if (expectedEdge !== undefined) expect(geometry.width).toBeCloseTo(expectedEdge, 1);
  expect(geometry.hits).toBe(64);
  expect(geometry.overflow).toBe(false);
  return geometry.width;
}

async function moveCount(page: Page, runId: string): Promise<number> {
  const response = await page.request.get(`/runs/${encodeURIComponent(runId)}/events`);
  const body = (await response.json()) as { events: { type: string }[] };
  return body.events.filter((event) => event.type === "move.committed" || event.type === "opponent.move_selected").length;
}

async function startNode(page: Page, nodeId: string): Promise<string> {
  const card = page.locator(`[data-node="${nodeId}"]`);
  await card.getByRole("button", { name: "Prepare" }).click();
  await page.getByRole("button", { name: "Start encounter" }).click();
  await expect(page).toHaveURL(/\/play\/run\//u);
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  return currentRunId(page);
}

/** A line-boundary fixture node: learner Be3, the authored reply e6, then declare done. */
async function playPackNode(page: Page, nodeId: string): Promise<void> {
  const runId = await startNode(page, nodeId);
  const strip = page.getByRole("complementary", { name: "Campaign encounter" });
  await expect(strip.getByTestId("campaign-strip-charges")).toBeVisible();
  await move(page, "c1", "e3");
  await expect.poll(() => moveCount(page, runId), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  await strip.getByRole("button", { name: "Declare done" }).click();
  await expect(strip.getByText("Played to the authored boundary", { exact: false })).toBeVisible();
  await strip.getByRole("button", { name: /Continue to the map|See the run result/u }).click();
  await expect(page).toHaveURL(/\/campaign\//u);
}

/** The real server accepts the mutation before we hold only its HTTP delivery. */
async function holdCampaignAction(page: Page, path: RegExp) {
  let release!: () => void, delivered!: () => void;
  let body: { campaign: { campaignRun: { id: string } } } | undefined;
  const delivery = new Promise<void>(resolve => { delivered = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route(path, async route => {
    if (!["POST", "PUT"].includes(route.request().method())) { await route.continue(); return; }
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    body = await response.json();
    await gate;
    await route.fulfill({ response });
    delivered();
  });
  return { get campaignId() { return body!.campaign.campaignRun.id; }, async leaveAndDeliver() {
    await expect.poll(() => body !== undefined).toBe(true);
    // Preparation is modal: return to its map before using shell navigation.
    if (await page.getByRole("dialog").isVisible()) await page.getByRole("button", { name: "Back to map", exact: true }).click();
    if (new URL(page.url()).pathname.startsWith("/play/run/")) {
      await page.getByRole("button", { name: "Tabiya", exact: true }).click();
      await expect(page).toHaveURL(/\/play$/u);
    }
    await page.locator('#primary-navigation a[href="/library"]').click();
    await expect(page).toHaveURL(/\/library$/u);
    release(); await delivery;
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    await expect(page).toHaveURL(/\/library$/u);
    await page.unroute(path);
  } };
}

for (const mobile of [false, true]) {
  test(`Campaign actions disclose costs, replay a lost branch response and refuse exhaustion without changing the run${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const campaignId = new URL(page.url()).pathname.split("/").at(-1)!;
    const runId = await startNode(page, "f1-a");
    await move(page, "c1", "e3");
    await expect.poll(() => moveCount(page, runId), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
    const edge = await playableBoard(page);
    const balance = async () => (await (await page.request.get(`/campaign-runs/${campaignId}`)).json()).charges;
    const before = await balance();
    await page.locator("[data-timeline-node]").first().click();
    await expect(page.locator(".timeline")).toContainText("Preview only.");
    expect(await balance()).toEqual(before); // Selecting/inspecting a position is not a spend.
    await playableBoard(page, edge);

    const commands: string[] = [];
    let loseResponse = true;
    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("button", { name: "Fork branch", exact: true }).click();
    const firstDialog = page.getByRole("dialog", { name: "Name the experiment." });
    await expect(firstDialog.locator("[data-campaign-gesture-cost]")).toContainText("Creating this branch uses one earned rewind");
    await firstDialog.getByLabel("What are you trying?").fill("Try another continuation");
    await page.route(`**/runs/${runId}/fork`, async route => {
      const body = route.request().postDataJSON() as { campaignCommand: { commandId: string } };
      commands.push(body.campaignCommand.commandId);
      if (loseResponse) {
        loseResponse = false;
        const response = await route.fetch();
        expect(response.ok()).toBe(true);
        await route.abort("failed"); // Persisted spend, missing response: retry the exact command.
      } else await route.continue();
    });
    await firstDialog.getByRole("button", { name: "Create branch", exact: true }).click();
    await expect(firstDialog.getByRole("alert")).toContainText("try again");
    expect(await balance()).toMatchObject({ balance: 0, spent: 1 });
    await firstDialog.getByRole("button", { name: "Create branch", exact: true }).click();
    await expect(firstDialog).not.toBeVisible();
    await expect(page.getByTestId("campaign-strip-charges")).toContainText("Earned rewinds: 0 remaining this campaign");
    expect(commands).toHaveLength(2);
    expect(commands[1]).toBe(commands[0]);
    expect(await balance()).toMatchObject({ balance: 0, spent: 1 });
    await page.unroute(`**/runs/${runId}/fork`);

    await page.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("button", { name: "Fork branch", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Name the experiment." });
    await expect(dialog.locator("[data-campaign-gesture-cost]")).toContainText("Creating this branch uses one earned rewind");
    await dialog.getByLabel("What are you trying?").fill("Try another continuation");
    const graphBefore = (await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: RunGraph }).graph;
    await dialog.getByRole("button", { name: "Create branch", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("No earned rewinds remain in this campaign");
    await dialog.getByRole("button", { name: "Create branch", exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText("No earned rewinds remain in this campaign");
    const graphAfter = (await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: RunGraph }).graph;
    assertRecordedNodesPreserved(graphBefore.nodes, graphAfter.nodes);
    expect(graphAfter.nodes.map(node => node.id)).toEqual(graphBefore.nodes.map(node => node.id));
    expect(graphAfter.branches).toEqual(graphBefore.branches);
    expect(graphAfter.activeCursor).toEqual(graphBefore.activeCursor);
    expect(await balance()).toMatchObject({ balance: 0, spent: 1 });
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    const collapse = page.getByRole("button", { name: "Collapse companion", exact: true });
    if (await collapse.isVisible()) {
      await collapse.click();
      await expect(collapse).not.toBeVisible();
    }
    await playableBoard(page, edge);
  });

  test(`Campaign actions recover the in-game strip without repeating saved commands${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const campaignId = new URL(page.url()).pathname.split("/").at(-1)!;
    const runId = await startNode(page, "f1-a");
    await move(page, "c1", "e3");
    await expect.poll(() => moveCount(page, runId), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
    const before = await (await page.request.get(`/runs/${runId}/events`)).json() as { events: DrillRun["events"] };
    const graphBefore = (await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: RunGraph }).graph;
    const savedMap = await (await page.request.get(`/campaign-runs/${campaignId}`)).json();
    const edge = await playableBoard(page);
    const commands: string[] = [];
    page.on("request", request => {
      const path = new URL(request.url()).pathname;
      if ((path.startsWith("/campaign-runs/") || /\/runs\/[^/]+\/(rewind|fork|groups|simulation\/enter)$/u.test(path)) && request.method() !== "GET") commands.push(`${request.method()} ${path}`);
    });
    let fail = true, reads = 0;
    await page.route(`**/campaign-runs/${campaignId}`, async route => {
      if (route.request().method() !== "GET") { await route.continue(); return; }
      reads++;
      if (fail) await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "HTTP_ERROR", message: "Temporary encounter state failure" } }) });
      else await route.continue();
    });
    await page.reload();
    const strip = page.getByRole("complementary", { name: "Campaign encounter" });
    await expect(strip.getByRole("alert")).toContainText("Temporary encounter state failure");
    await expect(strip.getByRole("alert")).toContainText("This read has not changed your encounter");
    await expect(strip.getByRole("button", { name: "Declare done", exact: true })).not.toBeVisible();
    await playableBoard(page, edge);
    const retry = strip.getByRole("button", { name: "Retry loading encounter", exact: true });
    await retry.focus();
    await retry.press("Enter");
    await expect(retry).toBeEnabled();
    await expect(strip.getByRole("alert")).toBeFocused();
    fail = false;
    await retry.focus(); await retry.press("Enter");
    await expect(strip.getByRole("button", { name: "Declare done", exact: true })).toBeEnabled();
    await expect(strip.locator(".encounter-title")).toBeFocused();
    await expect(strip.getByRole("alert")).not.toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/play/run/${runId}$`, "u"));
    await playableBoard(page, edge);
    expect(reads).toBe(3);
    expect(await (await page.request.get(`/campaign-runs/${campaignId}`)).json()).toEqual(savedMap);
    const after = await (await page.request.get(`/runs/${runId}/events`)).json() as { events: DrillRun["events"] };
    const graphAfter = (await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: RunGraph }).graph;
    assertOnlyEvidenceAppended(before.events, after.events);
    assertRecordedNodesPreserved(graphBefore.nodes, graphAfter.nodes);
    expect(graphAfter.branches).toEqual(graphBefore.branches);
    expect(graphAfter.activeCursor).toEqual(graphBefore.activeCursor);
    expect(commands).toEqual([]);
    await strip.getByRole("button", { name: "Declare done", exact: true }).click();
    await expect(strip.locator(".node-result")).toContainText("Your recorded attempts are kept");
    expect(commands).toEqual([`POST /campaign-runs/${campaignId}/nodes/f1-a/submit`]);
  });

  test(`Campaign actions recover catalogue and map reads without repeating saved work${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const mapPath = new URL(page.url()).pathname;
    const campaignId = mapPath.split("/").at(-1)!;
    const runId = await startNode(page, "f1-a");
    const before = await (await page.request.get(`/runs/${runId}/events`)).json() as { events: DrillRun["events"] };
    const graphBefore = (await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: RunGraph }).graph;
    const savedMap = await (await page.request.get(`/campaign-runs/${campaignId}`)).json();
    const writes: string[] = [];
    page.on("request", request => {
      const path = new URL(request.url()).pathname;
      if (path.startsWith("/campaign-runs") && request.method() !== "GET") writes.push(`${request.method()} ${path}`);
    });

    let catalogueReads = 0;
    await page.route("**/campaigns", async route => {
      if (++catalogueReads === 1) await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "HTTP_ERROR", message: "Temporary catalogue failure" } }) });
      else await route.continue();
    });
    await page.goto("/campaign");
    await expect(page.getByRole("alert")).toContainText("Temporary catalogue failure");
    await expect(page.getByText("No campaigns are installed here.", { exact: true })).not.toBeVisible();
    await page.getByRole("button", { name: "Retry loading campaigns", exact: true }).click();
    await expect(page.getByRole("alert")).not.toBeVisible();
    await expect(page.getByRole("heading", { name: "Campaign", exact: true })).toBeFocused();
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Resume run", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    await expect(page.getByRole("button", { name: "Continue encounter", exact: true })).toBeVisible();
    expect(catalogueReads).toBe(2);

    let mapReads = 0;
    await page.route(`**/campaign-runs/${campaignId}`, async route => {
      if (route.request().method() !== "GET") { await route.continue(); return; }
      if (++mapReads === 1) await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "HTTP_ERROR", message: "Temporary map failure" } }) });
      else await route.continue();
    });
    await page.reload();
    await expect(page.getByRole("alert")).toContainText("Temporary map failure");
    await expect(page.getByRole("button", { name: "Start a run", exact: true })).not.toBeVisible();
    await page.getByRole("button", { name: "Retry loading campaign", exact: true }).click();
    await expect(page.getByRole("button", { name: "Continue encounter", exact: true })).toBeVisible();
    await expect(page.locator("#campaign-title")).toBeFocused();
    expect(mapReads).toBe(2);
    expect(await (await page.request.get(`/campaign-runs/${campaignId}`)).json()).toEqual(savedMap);
    await page.getByRole("button", { name: "Continue encounter", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/play/run/${runId}$`, "u"));
    await playableBoard(page);
    await expect(page.getByRole("button", { name: "Take this board", exact: true })).not.toBeVisible();
    const after = await (await page.request.get(`/runs/${runId}/events`)).json() as { events: DrillRun["events"] };
    const graphAfter = (await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: RunGraph }).graph;
    assertOnlyEvidenceAppended(before.events, after.events);
    assertRecordedNodesPreserved(graphBefore.nodes, graphAfter.nodes);
    expect(graphAfter.branches).toEqual(graphBefore.branches);
    expect(graphAfter.activeCursor).toEqual(graphBefore.activeCursor);
    expect(writes).toEqual([]);
  });

  test(`Campaign encounter result explains earned rewards and survives reload${mobile ? " @mobile" : ""}`, async ({ page }) => {
    test.setTimeout(90_000);
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const mapPath = new URL(page.url()).pathname;
    const runId = await startNode(page, "f1-b");
    await move(page, "c1", "e3");
    await expect.poll(() => moveCount(page, runId), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
    const strip = page.getByRole("complementary", { name: "Campaign encounter" });
    const edge = await playableBoard(page);
    await strip.getByRole("button", { name: "Declare done", exact: true }).click();
    const result = strip.locator(".node-result");
    await expect(result).toContainText("Your recorded attempts are kept");
    const projection = await (await page.request.get(`/campaign-runs/${mapPath.split("/").at(-1)}`)).json();
    const grant = projection.economy.actGrants.act1;
    await expect(result).toContainText(`${grant} earned ${grant === 1 ? "rewind" : "rewinds"} for finishing this encounter in Act I, win or lose`);
    await expect(result).toContainText("1 earned rewind from this encounter’s reward");
    await expect(result).toContainText(`Current campaign balance: ${projection.charges.balance} earned rewinds`);
    await expect(result).toContainText("No tools earned yet");
    await expect(result).not.toContainText("now in your campaign kit");
    await playableBoard(page, edge);
    const before = await (await page.request.get(`/runs/${runId}/events`)).json() as { events: DrillRun["events"] };
    const graphBefore = (await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: RunGraph }).graph;
    await page.reload();
    await expect(result).toContainText("1 earned rewind from this encounter’s reward");
    await playableBoard(page, edge);
    const after = await (await page.request.get(`/runs/${runId}/events`)).json() as { events: DrillRun["events"] };
    const graphAfter = (await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: RunGraph }).graph;
    // Background evidence may attach on reload; recorded play may not change.
    assertOnlyEvidenceAppended(before.events, after.events);
    assertRecordedNodesPreserved(graphBefore.nodes, graphAfter.nodes);
    expect(graphAfter.branches).toEqual(graphBefore.branches);
    expect(graphAfter.activeCursor).toEqual(graphBefore.activeCursor);
    await strip.getByRole("button", { name: "Review encounter", exact: true }).click();
    await expect(page).toHaveURL(/\/review\/game\//u);
    await page.getByRole("link", { name: "Return to campaign map", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    const secondRun = await startNode(page, "f2-a");
    await move(page, "c1", "e3");
    await expect.poll(() => moveCount(page, secondRun), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
    await strip.getByRole("button", { name: "Declare done", exact: true }).click();
    await expect(result).toContainText("Unlocked Square facts on request");
    await expect(result).toContainText("Square facts on request — equipped");
    await expect(result).toContainText("available evidence still determine what appears");
    await page.reload();
    await expect(result).toContainText("Square facts on request — equipped");
    await playableBoard(page, edge);
    await strip.getByRole("button", { name: "Continue to the map", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    await expect(page.getByRole("checkbox", { name: "Square facts on request" })).toBeChecked();
  });

  test(`Campaign preparation owns focus and persists kit choices before entry${mobile ? " @mobile" : ""}`, async ({ page }) => {
    test.setTimeout(90_000);
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const mapPath = new URL(page.url()).pathname;
    const first = page.locator('[data-node="f1-a"]').getByRole("button", { name: "Prepare", exact: true });
    await first.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { level: 2 })).toBeFocused();
    await expect(dialog).toContainText("Legal moves only — no tools earned yet");
    await page.keyboard.press("g"); await page.keyboard.press("l"); await page.keyboard.press("?");
    await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    await expect(dialog).toHaveCount(1);
    expect(await page.locator("#primary-navigation").evaluate(element => element.closest("[inert]") !== null)).toBe(true);
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("button", { name: "Back to map", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("combobox", { name: "Help style", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(first).toBeFocused();
    expect(await page.locator("#primary-navigation").evaluate(element => element.closest("[inert]") !== null)).toBe(false);
    await playPackNode(page, "f1-a");

    const prepare = page.locator('[data-node="f2-a"]').getByRole("button", { name: "Prepare", exact: true });
    await prepare.click();
    const kit = dialog.getByRole("checkbox", { name: "After-move nudge" });
    await expect(kit).toBeChecked();
    await kit.uncheck();
    await expect(dialog.getByText("Not equipped — select to equip.", { exact: true })).toBeVisible();
    await expect(kit).toBeEnabled();
    await dialog.getByRole("button", { name: "Back to map", exact: true }).click();
    await expect(prepare).toBeFocused();
    await page.reload();
    await prepare.click();
    await expect(kit).not.toBeChecked();
    await kit.check();
    await expect(dialog.getByText("Equipped", { exact: true })).toBeVisible();
    await expect(kit).toBeEnabled();
    if (!mobile) await page.setViewportSize({ width: 640, height: 360 });
    const bounds = await dialog.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: innerWidth, height: innerHeight, overflow: element.scrollWidth > element.clientWidth };
    });
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(bounds.width); expect(bounds.bottom).toBeLessThanOrEqual(bounds.height);
    expect(bounds.overflow).toBe(false);
    await dialog.getByRole("button", { name: "Start encounter", exact: true }).click();
    await expect(page).toHaveURL(/\/play\/run\//u);
    await expect(page.getByLabel("Chessboard")).toBeVisible();
    // A fresh map read proves this was the recorded server kit, not just checkbox paint.
    const projection = await (await page.request.get(`/campaign-runs/${mapPath.split("/").at(-1)}`)).json();
    expect(projection.kit.equipped).toEqual(["postcommit_nudge"]);
    expect(projection.activeEncounter.nodeId).toBe("f2-a");
  });

  test(`D3741 Campaign preparation carries named help into actual encounters without changing earned equipment${mobile ? " @mobile" : ""}`, async ({ page }) => {
    test.setTimeout(90_000);
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const mapPath = new URL(page.url()).pathname, campaignId = currentRunId(page);
    const projection = async () => (await page.request.get(`/campaign-runs/${campaignId}`)).json();
    await page.locator('[data-node="f1-a"]').getByRole("button", { name: "Prepare", exact: true }).click();
    const dialog = page.getByRole("dialog"), style = dialog.getByRole("combobox", { name: "Help style", exact: true });
    await expect(style).toHaveValue("campaign_kit");
    expect(await style.locator("option").evaluateAll(options => options.map(option => (option as HTMLOptionElement).value))).toEqual(["campaign_kit", "quiet", "theory_only", "guided", "analysis"]);
    const before = await projection();
    await style.selectOption("quiet");
    await expect(dialog).toContainText("Help is confirmed when the encounter opens");
    expect(await projection()).toEqual(before);
    await dialog.getByRole("button", { name: "Back to map", exact: true }).click();
    await page.reload();
    await page.locator('[data-node="f1-a"]').getByRole("button", { name: "Prepare", exact: true }).click();
    await expect(style).toHaveValue("quiet");
    const quietResponse = page.waitForResponse(response => response.url().endsWith("/assistance") && response.request().method() === "POST");
    await dialog.getByRole("button", { name: "Start encounter", exact: true }).click();
    await expect(page).toHaveURL(/\/play\/run\//u);
    const quiet = (await (await quietResponse).json()).assistance;
    expect(quiet.context).toBe("campaign");
    expect(quiet.preset).toBe("quiet");
    expect(quiet.modules).toEqual(["rules_floor"]);
    await expect(page.locator("details.assistance-control summary")).toHaveAttribute("aria-label", "Support style: Quiet");
    const firstRun = currentRunId(page), edge = await playableBoard(page);
    if (mobile) {
      const board = await page.getByLabel("Chessboard").boundingBox();
      if (board === null) throw new Error("board has no box");
      for (const square of ["c1", "e3"]) await page.touchscreen.tap(board.x + (square.charCodeAt(0) - 97 + .5) * board.width / 8, board.y + (8 - Number(square[1]) + .5) * board.height / 8);
    } else await move(page, "c1", "e3");
    await expect.poll(() => moveCount(page, firstRun)).toBeGreaterThanOrEqual(2);
    const strip = page.getByRole("complementary", { name: "Campaign encounter" });
    await strip.getByRole("button", { name: "Declare done", exact: true }).click();
    await expect(strip).toContainText("Unlocked After-move nudge");
    await playableBoard(page, edge);
    await strip.getByRole("button", { name: "Continue to the map", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    await page.locator('[data-node="f2-a"]').getByRole("button", { name: "Prepare", exact: true }).click();
    await expect(style).toHaveValue("quiet");
    await expect(dialog.getByRole("checkbox", { name: "After-move nudge", exact: true })).toBeChecked();
    await expect(dialog.locator("#prep-tool-postcommit_nudge")).toHaveText("Not requested by Quiet — remains equipped.");
    const earned = await projection();
    await style.selectOption("guided");
    await expect(dialog.locator("#prep-tool-postcommit_nudge")).toHaveText("Equipped");
    expect(await projection()).toEqual(earned);
    const guidedResponse = page.waitForResponse(response => response.url().endsWith("/assistance") && response.request().method() === "POST");
    await dialog.getByRole("button", { name: "Start encounter", exact: true }).click();
    await expect(page).toHaveURL(/\/play\/run\//u);
    const guided = (await (await guidedResponse).json()).assistance;
    expect(guided.context).toBe("campaign");
    expect(guided.preset).toBe("guided");
    expect(guided.modules).toContain("postcommit_nudge");
    expect(guided.modules.every((id: string) => id === "rules_floor" || earned.kit.equipped.includes(id))).toBe(true);
    await expect(page.locator("details.assistance-control summary")).toHaveAttribute("aria-label", "Support style: Guide me");
    await playableBoard(page, edge);
    const secondRun = currentRunId(page);
    const eventsBefore = await (await page.request.get(`/runs/${secondRun}/events`)).json();
    const graphBefore = (await (await page.request.get(`/runs/${secondRun}/graph`)).json() as { graph: RunGraph }).graph;
    await page.reload();
    await expect(page.locator("details.assistance-control summary")).toHaveAttribute("aria-label", "Support style: Guide me");
    await playableBoard(page, edge);
    const graphAfter = (await (await page.request.get(`/runs/${secondRun}/graph`)).json() as { graph: RunGraph }).graph;
    assertOnlyEvidenceAppended(eventsBefore.events, (await (await page.request.get(`/runs/${secondRun}/events`)).json()).events);
    assertRecordedNodesPreserved(graphBefore.nodes, graphAfter.nodes);
    expect(graphAfter.branches).toEqual(graphBefore.branches);
    expect(graphAfter.activeCursor).toEqual(graphBefore.activeCursor);
    expect((await projection()).kit).toEqual(earned.kit);
    await page.goto("/settings");
    await page.locator("summary").filter({ hasText: "Advanced: set help before you start" }).click();
    await page.getByRole("combobox", { name: "Activity", exact: true }).selectOption("campaign");
    const settings = page.locator('[data-assistance-context="campaign"]');
    await expect(settings.getByRole("combobox", { name: "Help style", exact: true })).toHaveValue("guided");
    await expect(settings).toContainText("Campaign encounters use this help style");
    await expect(settings).not.toContainText("Campaign encounters are not separate yet");
  });

  test(`Campaign preparation explains preference recovery and refuses an unsaved help choice${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const campaignId = currentRunId(page);
    await page.evaluate(() => localStorage.setItem("tabiya.workflow.v2.campaign", "broken"));
    await page.locator('[data-node="f1-a"]').getByRole("button", { name: "Prepare", exact: true }).click();
    const dialog = page.getByRole("dialog"), style = dialog.getByRole("combobox", { name: "Help style", exact: true });
    await expect(dialog.locator("#prep-help-recovery")).toBeVisible();
    await expect(style).toHaveAttribute("aria-describedby", /prep-help-recovery/u);
    expect(await page.evaluate(() => localStorage.getItem("tabiya.workflow.v2.campaign"))).toBe("broken");
    await style.selectOption("quiet");
    await expect(dialog.locator("#prep-help-recovery")).toHaveCount(0);
    const before = await (await page.request.get(`/campaign-runs/${campaignId}`)).json();
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (key === "tabiya.workflow.v2.campaign") throw new DOMException("test refused write", "QuotaExceededError");
        original.call(this, key, value);
      };
    });
    await style.selectOption("guided");
    await expect(style).toHaveValue("quiet");
    await expect(dialog.getByRole("alert")).toContainText("Could not save your help style");
    expect((await page.evaluate(() => JSON.parse(localStorage.getItem("tabiya.workflow.v2.campaign")!).intent)).preset).toBe("quiet");
    expect(await (await page.request.get(`/campaign-runs/${campaignId}`)).json()).toEqual(before);
    await expect(dialog.getByRole("button", { name: "Start encounter", exact: true })).toBeEnabled();
    await dialog.getByRole("button", { name: "Back to map", exact: true }).click();
    await page.reload();
    await page.locator('[data-node="f1-a"]').getByRole("button", { name: "Prepare", exact: true }).click();
    await expect(style).toHaveValue("quiet");
    await style.selectOption("guided");
    await expect(style).toHaveValue("guided");
    await expect(dialog.getByRole("alert")).toHaveCount(0);
    const compiledResponse = page.waitForResponse(response => response.url().endsWith("/assistance") && response.request().method() === "POST");
    await dialog.getByRole("button", { name: "Start encounter", exact: true }).click();
    const compiled = (await (await compiledResponse).json()).assistance;
    expect(compiled.preset).toBe("guided");
    expect(compiled.modules).toEqual(["rules_floor"]); // requesting help cannot manufacture an earned tool
    await playableBoard(page);
  });

  test(`Campaign preparation dismissal keeps an accepted pending start on the map${mobile ? " @mobile" : ""}`, async ({ page }) => {
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const mapPath = new URL(page.url()).pathname;
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let accepted = false;
    await page.route(/\/campaign-runs\/[^/]+\/nodes\/f1-a\/start$/u, async route => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true); accepted = true;
      await gate; await route.fulfill({ response });
    });
    await page.locator('[data-node="f1-a"]').getByRole("button", { name: "Prepare", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Start encounter", exact: true }).click();
    await expect.poll(() => accepted).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    release();
    await expect(page.getByRole("button", { name: "Continue encounter", exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    await page.getByRole("button", { name: "Continue encounter", exact: true }).click();
    await expect(page.getByLabel("Chessboard")).toBeVisible();
    await expect(page.getByRole("button", { name: "Take control", exact: true })).toHaveCount(0);
  });
}

for (const mobile of [false, true]) {
  test(`Campaign actions stay on the new page while accepted work resumes${mobile ? " @mobile" : ""}`, async ({ page }) => {
    test.setTimeout(120_000);
    await register(page);
    const created = await holdCampaignAction(page, /\/campaigns\/[^/]+\/runs$/u);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await created.leaveAndDeliver();
    const campaignId = created.campaignId, mapPath = `/campaign/${campaignId}`;
    const resume = async () => {
      await page.locator('#primary-navigation a[href="/campaign"]').click();
      await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Resume run" }).click();
      await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    };
    await resume();
    const started = await holdCampaignAction(page, /\/campaign-runs\/[^/]+\/nodes\/f1-a\/start$/u);
    await page.locator('[data-node="f1-a"]').getByRole("button", { name: "Prepare", exact: true }).click();
    await page.getByRole("button", { name: "Start encounter", exact: true }).click();
    await started.leaveAndDeliver();
    await resume();
    await page.getByRole("button", { name: "Continue encounter", exact: true }).click();
    await expect(page.getByLabel("Chessboard")).toBeVisible();
    const runId = currentRunId(page);
    if (mobile) {
      const board = page.getByLabel("Chessboard"), box = await board.boundingBox();
      if (box === null) throw new Error("board has no box");
      for (const square of ["c1", "e3"]) await page.touchscreen.tap(box.x + (square.charCodeAt(0) - 97 + .5) * box.width / 8, box.y + (8 - Number(square[1]) + .5) * box.height / 8);
    } else await move(page, "c1", "e3");
    await expect.poll(() => moveCount(page, runId)).toBeGreaterThanOrEqual(2);
    const sealed = await holdCampaignAction(page, /\/campaign-runs\/[^/]+\/nodes\/f1-a\/submit$/u);
    await page.getByRole("complementary", { name: "Campaign encounter" }).getByRole("button", { name: "Declare done", exact: true }).click();
    await sealed.leaveAndDeliver();
    await resume();
    await expect(page.locator('[data-node="f1-a"]')).toContainText("Played to the authored boundary");
    await expect(page.getByTestId("campaign-charges")).toContainText("⟲ 2");
    const kit = page.getByRole("region", { name: "Your campaign kit" }).getByRole("checkbox", { name: "After-move nudge" });
    const loadout = await holdCampaignAction(page, /\/campaign-runs\/[^/]+\/loadout$/u);
    await expect(kit).toBeChecked();
    await kit.uncheck();
    await loadout.leaveAndDeliver();
    await resume(); await expect(kit).not.toBeChecked();
    const abandoned = await holdCampaignAction(page, /\/campaign-runs\/[^/]+\/abandon$/u);
    await page.getByRole("button", { name: "Abandon this run…" }).click();
    await page.getByRole("button", { name: "Confirm abandon", exact: true }).click();
    await abandoned.leaveAndDeliver();
    await page.goto(mapPath);
    await expect(page.getByRole("heading", { name: "Campaign abandoned" })).toBeVisible();
    await expect(page.locator('[data-node="f1-a"]')).toContainText("Played to the authored boundary");
  });
}

test("Campaign actions replay a lost declaration response without a second reward", async ({ page }) => {
  test.setTimeout(90_000);
  await register(page);
  await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
  await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
  const campaignId = currentRunId(page);
  const runId = await startNode(page, "f1-a");
  await move(page, "c1", "e3");
  await expect.poll(() => moveCount(page, runId)).toBeGreaterThanOrEqual(2);
  const inputs: string[] = [], replays: boolean[] = [];
  await page.route(/\/campaign-runs\/[^/]+\/nodes\/f1-a\/submit$/u, async route => {
    inputs.push(route.request().postData()!);
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    replays.push((await response.json()).replayed === true);
    if (inputs.length === 1) { await route.abort("failed"); return; }
    await route.fulfill({ response });
  });
  const strip = page.getByRole("complementary", { name: "Campaign encounter" });
  await strip.getByRole("button", { name: "Declare done", exact: true }).click();
  await expect(strip.getByRole("alert")).toContainText("could not be declared done");
  await strip.getByRole("button", { name: "Declare done", exact: true }).click();
  await expect(strip.locator(".node-result")).toContainText("Played to the authored boundary");
  expect(inputs).toHaveLength(2); expect(inputs[1]).toBe(inputs[0]); expect(replays).toEqual([false, true]);
  const projection = await (await page.request.get(`/campaign-runs/${campaignId}`)).json();
  expect(projection.charges.balance).toBe(2);
  expect(projection.kit.owned).toEqual(["postcommit_nudge"]);
  await strip.getByRole("button", { name: "Continue to the map" }).click();
  await page.reload();
  await expect(page.getByTestId("campaign-charges")).toContainText("⟲ 2");
});

test("Campaign: enter, play encounters and a registered-bot boss, see results, resume after reload", async ({ page }) => {
  test.setTimeout(240_000);
  await register(page);
  await page.goto("/campaign");
  await expect(page.getByRole("heading", { name: "Campaign", level: 1 })).toBeVisible();
  await expect(page.getByText("nothing here is locked behind a campaign or sold", { exact: false })).toBeVisible();
  const card = page.locator('[data-campaign="browser-fixture-campaign"]');
  await card.getByRole("button", { name: "Start a run" }).click();
  await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
  const mapUrl = page.url();

  // Criterion 4: the balance is visible before any spend, on the map and in the encounter strip.
  await expect(page.getByTestId("campaign-charges")).toContainText("⟲ 1");
  await expect(page.locator('[data-node="f3-boss"]')).toContainText("Sets aside: Step-by-step hint");

  const firstRunId = await startNode(page, "f1-a");
  const strip = page.getByRole("complementary", { name: "Campaign encounter" });
  await expect(strip.getByTestId("campaign-strip-charges")).toContainText("Earned rewinds: 1 remaining this campaign");
  // Declaring done on the untouched root is refused: participation is required, never graded.
  await strip.getByRole("button", { name: "Declare done" }).click();
  await expect(strip.getByRole("alert")).toContainText("no move after the run root");
  await move(page, "c1", "e3");
  await expect.poll(() => moveCount(page, firstRunId), { timeout: 15_000 }).toBeGreaterThanOrEqual(2);
  await strip.getByRole("button", { name: "Declare done" }).click();
  await expect(strip.getByText("Played to the authored boundary", { exact: false })).toBeVisible();
  await expect(strip.getByText("Unlocked After-move nudge", { exact: false })).toBeVisible();
  await strip.getByRole("button", { name: "Continue to the map" }).click();

  // Resume after reload: the map is server state, not tab state.
  await page.reload();
  await expect(page.locator('[data-node="f1-a"]')).toContainText("Played to the authored boundary");
  await expect(page.locator('[data-node="f1-b"]')).toContainText("Another path was chosen on this layer.");
  await expect(page.getByRole("region", { name: "Your campaign kit" })).toContainText("After-move nudge");
  await expect(page.getByTestId("campaign-charges")).toContainText("⟲ 2");

  for (const nodeId of ["f2-b", "f3-boss", "f4-a", "f5-b"]) await playPackNode(page, nodeId);

  // The Act-II boss: a full game against registered bot human-baseline.1400@1.
  const boss = page.locator('[data-node="f6-boss"]');
  await expect(boss).toContainText("Opponent: Human baseline · model band 1400");
  const bossRunId = await startNode(page, "f6-boss");
  await move(page, "h1", "g1");
  await expect.poll(() => moveCount(page, bossRunId), { timeout: 30_000 }).toBeGreaterThanOrEqual(2);
  await move(page, "e1", "e8");
  await expect.poll(() => moveCount(page, bossRunId), { timeout: 15_000 }).toBeGreaterThanOrEqual(3);
  // The rules ended the game: the terminal sheet carries the campaign's "Declare done".
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "You won." })).toBeVisible();
  await expect(sheet.getByText("a rewind spends an earned rewind", { exact: false })).toBeVisible();
  await sheet.getByRole("button", { name: "Declare done and return to the campaign map" }).click();
  await expect(page).toHaveURL(/\/campaign\//u);
  await expect(page.locator('[data-node="f6-boss"]')).toContainText("Game won by checkmate");

  // Resume after reload lands on the same campaign map with the boss sealed.
  await page.goto(mapUrl);
  await page.reload();
  await expect(page.locator('[data-node="f6-boss"]')).toContainText("Game won by checkmate");
  await expect(page.locator('[data-node="f7-a"]').getByRole("button", { name: "Prepare" })).toBeVisible();

  // Abandon is a separately confirmed action with the exact non-punitive consequence.
  await page.getByRole("button", { name: "Abandon this run…" }).click();
  await expect(page.getByText("no completion or prestige mark is awarded", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Confirm abandon" }).click();
  await expect(page.getByRole("heading", { name: "Campaign abandoned" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Start another run" })).toBeVisible();
});

for (const mobile of [false, true]) {
  test(`Campaign history preserves seals and abandoned attempts through deletion${mobile ? " @mobile" : ""}`, async ({ page }) => {
    test.setTimeout(120_000);
    await register(page);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run" }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const mapUrl = page.url();
    const campaignId = currentRunId(page);
    const firstRun = await startNode(page, "f1-a");
    const strip = page.getByRole("complementary", { name: "Campaign encounter" });
    if (mobile) {
      const tapSquare = async (square: string) => {
        const box = await page.getByLabel("Chessboard").boundingBox();
        if (box === null) throw new Error("board has no box");
        await page.touchscreen.tap(box.x + (square.charCodeAt(0) - 97 + .5) * box.width / 8, box.y + (8 - Number(square[1]) + .5) * box.height / 8);
      };
      await tapSquare("c1");
      await tapSquare("e3");
    } else await move(page, "c1", "e3");
    await expect.poll(() => moveCount(page, firstRun)).toBeGreaterThanOrEqual(2);
    await strip.getByRole("button", { name: "Declare done", exact: true }).click();
    await expect(strip.getByRole("button", { name: "Open recorded encounter" })).toBeVisible();
    await strip.getByRole("button", { name: "Continue to the map" }).click();
    const recordedMoves = async (runId: string) => {
      const response = await page.request.get(`/runs/${encodeURIComponent(runId)}/events`);
      expect(response.ok()).toBe(true);
      return (await response.json()).events.filter((event: { type: string }) => event.type === "move.committed" || event.type === "opponent.move_selected");
    };
    const originalMoves = await recordedMoves(firstRun);
    const sealedCard = page.locator('[data-node="f1-a"]');
    const history = await (await page.request.get(`/campaign-runs/${campaignId}/nodes/f1-a/review`)).json();
    await sealedCard.getByRole("button", { name: "Review encounter", exact: true }).click();
    await expect(page).toHaveURL(new URL(history.reviewRoute, mapUrl).href);
    await expect(page.getByRole("heading", { name: "Review of this run", exact: true })).toBeVisible();
    await expect(page.locator(".move-row.selected")).toHaveAttribute("data-node-id", history.reviewNodeId);
    await page.reload();
    await expect(page.locator(".move-row.selected")).toHaveAttribute("data-node-id", history.reviewNodeId);
    await page.getByRole("link", { name: "Return to campaign map", exact: true }).click();
    await expect(page).toHaveURL(mapUrl);
    expect(await recordedMoves(firstRun)).toEqual(originalMoves);
    await sealedCard.getByRole("button", { name: "Open recorded encounter" }).click();
    await expect(page).toHaveURL(new RegExp(`/play/run/${firstRun}$`, "u"));
    await expect(page.getByLabel("Chessboard")).toBeVisible();
    expect(await recordedMoves(firstRun)).toEqual(originalMoves);
    await page.goto(mapUrl);
    await expect(sealedCard.getByRole("button", { name: "Open recorded encounter" })).toBeVisible();
    const before = await (await page.request.get(`/campaign-runs/${campaignId}`)).json();
    const deleteRecordedGame = async (runId: string) => {
      const preview = await page.request.post(`/runs/${runId}/deletion-preview`, { data: {} });
      expect(preview.ok()).toBe(true);
      const deleted = await page.request.post(`/runs/${runId}/delete`, { data: { previewDigest: (await preview.json()).digest } });
      expect(deleted.ok()).toBe(true);
    };
    await deleteRecordedGame(firstRun);
    // The map was loaded before deletion: activation must resolve again, not trust its old URL.
    await sealedCard.getByRole("button", { name: "Open recorded encounter" }).click();
    await expect(sealedCard.locator('[data-history-reason="campaign_encounter_run_deleted"]')).toBeVisible();
    await expect(page).toHaveURL(mapUrl);
    await page.reload();
    await expect(sealedCard).toContainText("Its campaign seal and earned rewards are kept.");
    const after = await (await page.request.get(`/campaign-runs/${campaignId}`)).json();
    expect(after).toEqual(before);

    const unfinishedRun = await startNode(page, "f2-b");
    const untouchedMoves = await recordedMoves(unfinishedRun);
    await strip.getByRole("button", { name: "Map", exact: true }).click();
    await page.getByRole("button", { name: "Abandon this run…" }).click();
    await page.getByRole("button", { name: "Confirm abandon" }).click();
    const result = page.getByRole("region", { name: "Campaign abandoned" });
    await expect(result).toContainText("No seal or encounter reward was earned for this attempt.");
    const unfinished = result.locator(".abandoned-encounter");
    await expect(unfinished.getByRole("note")).toContainText("Game Review is withheld until this rehearsal opens feedback.");
    await expect(unfinished.getByRole("button", { name: "Review encounter", exact: true })).toHaveCount(0);
    await unfinished.getByRole("button", { name: "Open recorded encounter" }).click();
    await expect(page).toHaveURL(new RegExp(`/play/run/${unfinishedRun}$`, "u"));
    await expect(page.getByLabel("Chessboard")).toBeVisible();
    expect(await recordedMoves(unfinishedRun)).toEqual(untouchedMoves);
    await page.goto(mapUrl);
    await expect(unfinished.getByRole("button", { name: "Open recorded encounter" })).toBeVisible();
    await deleteRecordedGame(unfinishedRun);
    await page.reload();
    await expect(unfinished.locator('[data-history-reason="campaign_abandoned_run_deleted"]')).toBeVisible();
    await expect(result).toContainText("no completion mark is awarded");
    await expect(sealedCard).toContainText("Played to the authored boundary");
    const viewportWidth = await page.evaluate(() => innerWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewportWidth);
  });
}
