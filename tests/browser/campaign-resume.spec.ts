// D3784: real built server, SQLite and worker across definition replacement/removal.
// Only the explicit temporary development fixture installation changes; no operator data.
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { expect, test, type Page } from "@playwright/test";

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((done, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", done); });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("No Campaign test port");
  await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  return address.port;
}

async function stop(child: ChildProcess | undefined): Promise<void> {
  if (child === undefined || child.pid === undefined || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise<void>(done => child.once("exit", () => done()));
  const deadline = setTimeout(() => child.kill("SIGKILL"), 5000);
  child.kill("SIGTERM");
  try { await exited; } finally { clearTimeout(deadline); }
}

function savedRows(database: string) {
  const connection = new DatabaseSync(database, { readOnly: true });
  try {
    return {
      runs: connection.prepare("SELECT * FROM campaign_runs ORDER BY id").all(),
      events: connection.prepare("SELECT * FROM campaign_events ORDER BY campaign_run_id,seq").all(),
      creations: connection.prepare("SELECT * FROM campaign_run_creations ORDER BY campaign_run_id").all(),
      commands: connection.prepare("SELECT * FROM campaign_mutation_commands ORDER BY campaign_run_id,command_id").all(),
      awards: connection.prepare("SELECT * FROM campaign_reward_awards ORDER BY campaign_run_id,durable_reward_id").all(),
      play: connection.prepare("SELECT id,snapshot_json FROM drill_runs ORDER BY id").all(),
    };
  } finally { connection.close(); }
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const button = page.getByRole("region", { name: "Continue your campaign", exact: true }).getByRole("button", { name: "Resume run", exact: true });
  await button.scrollIntoViewIfNeeded();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

for (const suffix of ["desktop", "@mobile touch phone"]) test(`Campaign saved resume survives replaced and removed installations ${suffix}`, async ({ page, browser }) => {
  test.setTimeout(120_000);
  const directory = mkdtempSync(join(tmpdir(), "tabiya-campaign-resume-"));
  const database = join(directory, "campaign.sqlite");
  const port = await freePort(), origin = `http://127.0.0.1:${port}`;
  const fixturePath = resolve("tests/browser/fixtures/campaign.browser.json");
  const replacementPath = join(directory, "replacement-campaign.json");
  const definition = JSON.parse(readFileSync(fixturePath, "utf8"));
  writeFileSync(replacementPath, JSON.stringify({ ...definition, version: 2, title: "Replacement campaign definition",
    durableRewards: definition.durableRewards.map((grant: { reward: Record<string, unknown> }) => ({ ...grant, reward: { ...grant.reward, campaignVersion: 2 } })),
  }));
  const environment = Object.fromEntries(Object.entries(process.env).filter(([name]) => ["PATH", "HOME", "TMPDIR"].includes(name)));
  let child: ChildProcess | undefined;
  let outsider: Awaited<ReturnType<typeof browser.newContext>> | undefined;
  const boot = async (campaignFile?: string) => {
    await stop(child);
    const processChild = spawn(process.execPath, [resolve("apps/server/dist/main.js")], {
      cwd: process.cwd(), env: { ...environment, NODE_ENV: "development", ENGINE_MODE: "mock", TABIYA_DEPLOYMENT_PROFILE: "local",
        DATABASE_PATH: database, PORT: String(port), ...(campaignFile === undefined ? {} : {
          DRAFT_CAMPAIGN_FILES: campaignFile,
          DRAFT_PACK_FILES: "schemas/fixtures/drill-pack/campaign-boss.browser.json,content/drafts/line-boundary.browser.json",
        }) }, stdio: ["ignore", "pipe", "pipe"],
    });
    child = processChild;
    let logs = "", failure: Error | undefined;
    processChild.once("error", error => { failure = error; });
    processChild.stdout!.on("data", chunk => { logs = (logs + chunk).slice(-32_768); });
    processChild.stderr!.on("data", chunk => { logs = (logs + chunk).slice(-32_768); });
    await expect.poll(async () => {
      if (failure !== undefined) throw failure;
      if (processChild.exitCode !== null || processChild.signalCode !== null) throw new Error(`Owned Campaign server stopped: ${logs}`);
      try { return (await page.request.get(`${origin}/readyz`, { timeout: 1000 })).status(); } catch { return 0; }
    }, { timeout: 15_000, message: "owned built Campaign server readiness" }).toBe(200);
  };
  try {
    await boot(fixturePath);
    const registered = await page.request.post(`${origin}/auth/register`, { data: {
      handle: `resume_${randomUUID().slice(0, 8)}`, password: "campaign-resume-password",
    } });
    expect(registered.status(), await registered.text()).toBe(201);
    await page.goto(`${origin}/campaign`);
    await page.locator('[data-campaign="browser-fixture-campaign"]').getByRole("button", { name: "Start a run", exact: true }).click();
    await expect(page).toHaveURL(/\/campaign\/campaign-run-/u);
    const campaignId = new URL(page.url()).pathname.split("/").at(-1)!;
    const mapPath = `/campaign/${campaignId}`;
    await page.locator('[data-node="f1-a"]').getByRole("button", { name: "Prepare", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Start encounter", exact: true }).click();
    await expect(page).toHaveURL(/\/play\/run\//u);
    const playId = new URL(page.url()).pathname.split("/").at(-1)!;
    const board = page.getByLabel("Chessboard", { exact: true });
    await expect(board).toBeVisible();
    // Actual two-click board input, not an injected move or fabricated saved recording.
    await board.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
    const box = await board.boundingBox();
    if (box === null) throw new Error("Campaign board has no bounds");
    await page.mouse.click(box.x + box.width * 2.5 / 8, box.y + box.height * 7.5 / 8); // c1
    await page.mouse.click(box.x + box.width * 4.5 / 8, box.y + box.height * 5.5 / 8); // e3
    await expect.poll(async () => (await (await page.request.get(`${origin}/runs/${playId}/events`)).json()).events.filter((event: { type: string }) => event.type === "move.committed").length).toBeGreaterThanOrEqual(2);
    await page.goto(`${origin}/campaign`);
    const saved = page.locator(`[data-saved-campaign="${campaignId}"]`);
    await expect(saved).toContainText(definition.title);
    await noOverflow(page);

    // A real restart installs v2. The old run still displays and opens its v1 snapshot.
    await boot(replacementPath);
    const snapshot = savedRows(database);
    await page.reload();
    await expect(saved).toContainText(definition.title);
    await expect(saved).not.toContainText("Replacement campaign definition");
    await expect(page.locator('[data-campaign="browser-fixture-campaign"]')).toContainText("Replacement campaign definition");
    await expect(page.locator('[data-campaign="browser-fixture-campaign"]')).toContainText("Resume the saved run above");
    await saved.getByRole("button", { name: "Resume run", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(definition.title);
    expect((await (await page.request.get(`${origin}/campaign-runs/${campaignId}`)).json()).campaignRun.campaignVersion).toBe(1);
    expect(savedRows(database)).toEqual(snapshot);

    // A second real restart removes both the explicit definition and its extra packs.
    await boot();
    await page.goto(`${origin}/campaign`);
    await expect(page.locator('[data-campaign="browser-fixture-campaign"]')).toHaveCount(0);
    await expect(saved).toContainText(definition.title);
    await noOverflow(page);
    expect((await (await page.request.get(`${origin}/campaigns/active`)).json()).runs.map((run: { campaignRunId: string }) => run.campaignRunId)).toEqual([campaignId]);
    await saved.getByRole("button", { name: "Resume run", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`${mapPath}$`, "u"));
    await page.reload();
    await expect(page.getByRole("button", { name: "Continue encounter", exact: true })).toBeVisible();
    const map = await (await page.request.get(`${origin}/campaign-runs/${campaignId}`)).json();
    expect(map.campaignRun).toMatchObject({ id: campaignId, campaignVersion: 1, title: definition.title });
    const missing = map.acts.flatMap((act: { layers: { choices: { unavailable: string | null }[] }[] }) => act.layers.flatMap(layer => layer.choices));
    expect(missing.every((node: { unavailable: string | null }) => node.unavailable === "pack_unavailable")).toBe(true);
    await expect(page.getByText("This encounter's pack is not installed here.", { exact: true })).toHaveCount(missing.length);
    const refused = await page.request.post(`${origin}/campaign-runs/${campaignId}/nodes/f1-b/start`, { headers: { "x-writer-id": "writer-refused" }, data: { expectedRevision: map.campaignRun.revision, commandId: `cmd-${randomUUID()}` } });
    expect(refused.ok()).toBe(false); // Opening a saved map never bypasses the active-encounter guard.
    await page.getByRole("button", { name: "Continue encounter", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/play/run/${playId}$`, "u"));
    await expect(page.getByRole("alert")).toContainText("exact drill pack used by this saved run is unavailable");
    await expect(page.getByRole("alert")).not.toContainText("run changed");
    await expect(board).toHaveCount(0);
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("pack version");
    await page.getByRole("button", { name: "Open saved campaigns", exact: true }).click();
    await expect(saved).toContainText(definition.title);
    await saved.getByRole("button", { name: "Resume run", exact: true }).click();
    await page.getByRole("button", { name: "Continue encounter", exact: true }).click();
    await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
    // Restore the original exact pack via the real installation/startup path, not a fake response.
    await boot(replacementPath);
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(board).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/play/run/${playId}$`, "u"));
    expect(savedRows(database)).toEqual(snapshot);

    // A malformed transported summary is a failed read, not an empty saved shelf.
    // Server records stay real and unchanged; this is explicitly client transport fault injection.
    await page.route(`${origin}/campaigns/active`, async route => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      const body = await response.json(); body.runs[0].chargeBalance = "bad-balance";
      await route.fulfill({ response, json: body });
    });
    await page.goto(`${origin}/campaign`);
    await expect(page.getByRole("button", { name: "Retry loading campaigns", exact: true })).toBeVisible();
    await expect(saved).toHaveCount(0);
    await page.unroute(`${origin}/campaigns/active`);
    await page.getByRole("button", { name: "Retry loading campaigns", exact: true }).click();
    await expect(saved).toContainText(definition.title);
    await expect(page.locator("#campaign-title")).toBeFocused();
    expect(savedRows(database)).toEqual(snapshot);

    // Separate authenticated account: neither the summary nor a guessed map id leaks the run.
    outsider = await browser.newContext();
    const other = await outsider.request.post(`${origin}/auth/register`, { data: { handle: `other_${randomUUID().slice(0, 8)}`, password: "campaign-other-password" } });
    expect(other.status()).toBe(201);
    expect((await (await outsider.request.get(`${origin}/campaigns/active`)).json()).runs).toEqual([]);
    expect((await outsider.request.get(`${origin}/campaign-runs/${campaignId}`)).status()).toBe(404);
    const otherPage = await outsider.newPage();
    await otherPage.goto(`${origin}/campaign`);
    await expect(otherPage.locator('[data-saved-campaign]')).toHaveCount(0);
    await expect(otherPage.getByRole("heading", { name: "Start a new campaign", exact: true })).toBeVisible();
  } finally {
    try { await outsider?.close(); } finally {
      try { await stop(child); } finally { rmSync(directory, { recursive: true, force: true }); }
    }
  }
});
