// D3772: actual built main.js, real SQLite/worker/API and shipped desktop/touch Profile.
// Corrupt only an owned temporary denominator, then use the existing built operator CLI to
// rebuild it. No fake Profile response, product test endpoint, Docker or operator database.
import { execFile, spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { promisify } from "node:util";
import { expect, test } from "@playwright/test";

const execute = promisify(execFile);
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

async function freePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((done, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", done); });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("No test port");
  await new Promise<void>((done, reject) => server.close(error => error ? reject(error) : done()));
  return address.port;
}

async function stop(child: ChildProcess): Promise<void> {
  if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise<void>(done => child.once("exit", () => done()));
  const deadline = setTimeout(() => child.kill("SIGKILL"), 5000);
  child.kill("SIGTERM");
  try { await exited; } finally { clearTimeout(deadline); }
}

for (const suffix of ["desktop", "@mobile touch phone"]) test(`Profile refuses inconsistent source counts and recovers after operator rebuild ${suffix}`, async ({ page, browser }) => {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-profile-refusal-"));
  const database = join(directory, "profile.sqlite");
  const port = await freePort();
  const origin = `http://127.0.0.1:${port}`;
  const environment = Object.fromEntries(Object.entries(process.env).filter(([name]) => ["PATH", "HOME", "TMPDIR"].includes(name)));
  const child = spawn(process.execPath, [resolve("apps/server/dist/main.js")], {
    cwd: process.cwd(), env: { ...environment, ENGINE_MODE: "mock", TABIYA_DEPLOYMENT_PROFILE: "local", DATABASE_PATH: database, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  let startupError: Error | undefined;
  child.once("error", error => { startupError = error; });
  child.stdout!.on("data", chunk => { logs = (logs + chunk).slice(-32_768); });
  child.stderr!.on("data", chunk => { logs = (logs + chunk).slice(-32_768); });
  let inspection: DatabaseSync | undefined;
  let outsider: Awaited<ReturnType<typeof browser.newContext>> | undefined;
  try {
    outsider = await browser.newContext();
    await expect.poll(async () => {
      if (startupError !== undefined) throw startupError;
      if (child.exitCode !== null || child.signalCode !== null) throw new Error(`Owned test server stopped: ${logs}`);
      try { return (await page.request.get(`${origin}/readyz`, { timeout: 1000 })).status(); }
      catch { return 0; }
    }, { timeout: 15_000, message: "owned built server readiness" }).toBe(200);
    const registered = await page.request.post(`${origin}/auth/register`, { data: { handle: `refusal_${randomUUID().slice(0, 8)}`, password: "profile-refusal-test-password" } });
    expect(registered.status(), await registered.text()).toBe(201);
    const ids = [randomUUID(), randomUUID()];
    for (const id of ids) {
      const headers = { "x-writer-id": `writer-${id}` };
      const created = await page.request.post(`${origin}/runs`, { headers, data: { id, seed: 7,
        session: { kind: "position", start: { fen: START, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
        policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } },
      } });
      expect(created.status(), await created.text()).toBe(201);
      const moved = await page.request.post(`${origin}/runs/${id}/moves`, { headers, data: { uci: "e2e4" } });
      expect(moved.ok(), await moved.text()).toBe(true);
    }
    await expect.poll(async () => {
      const profile = (await (await page.request.get(`${origin}/learner-profile`)).json()).profile;
      return [profile.store.counted, profile.store.pending, profile.population.measuredGames];
    }).toEqual([2, 0, 2]);
    inspection = new DatabaseSync(database);
    const sourceBefore = inspection.prepare("SELECT id, summary_json FROM drill_runs ORDER BY id").all();
    const recordingsBefore = inspection.prepare("SELECT id, snapshot_json FROM drill_runs ORDER BY id").all();
    const changed = inspection.prepare("UPDATE learner_observation_denominators SET decisions = decisions + 1 WHERE run_id = ? AND decision_class = 'played'").run(ids[1]!);
    expect(changed.changes).toBeGreaterThan(0);
    const refused = (await (await page.request.get(`${origin}/learner-profile`)).json()).profile;
    expect(refused.store).toMatchObject({ runs: 2, counted: 1, unavailable: 1, pending: 0, failed: 0 });
    expect(refused.population).toMatchObject({ measuredGames: 1, playedDecisions: 1 });
    expect(refused.history.items.find((row: { runId: string }) => row.runId === ids[1])).toMatchObject({ state: "unavailable", status: "store_mismatch", observedAt: null, playedDecisions: null, outcome: null });
    const canonical = await page.request.get(`${origin}/runs/${ids[1]}/events?sinceSeq=0`);
    expect(canonical.ok(), await canonical.text()).toBe(true);
    const started = (await canonical.json()).events.find((event: { type: string }) => event.type === "run.started");
    expect(Number.isFinite(Date.parse(started.at))).toBe(true);
    expect(inspection.prepare("SELECT id, summary_json FROM drill_runs ORDER BY id").all()).toEqual(sourceBefore);
    const other = await outsider.request.post(`${origin}/auth/register`, { data: { handle: `other_${randomUUID().slice(0, 8)}`, password: "profile-refusal-other-password" } });
    expect(other.status(), await other.text()).toBe(201);
    expect((await (await outsider.request.get(`${origin}/learner-profile`)).json()).profile.store.runs).toBe(0);
    await page.goto(`${origin}/profile`);
    await expect(page.getByRole("region", { name: "What is counted" })).toContainText("1 of your 2 saved runs is counted");
    const history = page.getByRole("region", { name: "Your saved runs" });
    const rejected = history.locator("li").filter({ hasText: "Recorded counts do not match the saved moves" });
    await expect(rejected).toHaveCount(1);
    await expect(rejected).toContainText("not counted");
    await expect(rejected).toContainText("The saved game is unchanged");
    await expect(rejected).toContainText("date unavailable in this view");
    await expect(rejected).not.toContainText("date not recorded");
    await expect(rejected.getByRole("button", { name: "Open in rehearsal", exact: true })).toBeEnabled();
    const repaired = await execute(process.execPath, [resolve("apps/server/dist/longitudinal-rebuild.js"), "--database", database, "--write"], { cwd: process.cwd(), timeout: 15_000, maxBuffer: 1024 * 1024 });
    const repair = JSON.parse(repaired.stdout);
    expect(repair.write).toBe(true);
    expect(repair.report.repaired).toBe(1);
    expect(repair.after.mismatches).toEqual([]);
    expect(inspection.prepare("SELECT id, summary_json FROM drill_runs ORDER BY id").all()).toEqual(sourceBefore);
    await page.getByRole("button", { name: "Refresh profile", exact: true }).click();
    await expect(page.getByRole("region", { name: "What is counted" })).toContainText("All 2 of your saved runs are counted");
    await expect(history).not.toContainText("Recorded counts do not match");
    const historyResponse = await page.request.get(`${origin}/learner-profile/history?offset=0&limit=25`);
    expect(historyResponse.ok(), await historyResponse.text()).toBe(true);
    const restored = (await historyResponse.json()).history.items;
    expect(restored.every((row: { state: string }) => row.state === "counted")).toBe(true);
    const restoredRow = restored.find((row: { runId: string }) => row.runId === ids[1]);
    expect(restoredRow.observedAt).toBe(new Date(started.at).toISOString());
    await expect(history.locator("li")).toHaveCount(2);
    await expect(history).not.toContainText("date unavailable in this view");
    for (const [index, row] of restored.entries()) {
      const nativeDate = await page.evaluate(value => new Date(value).toLocaleDateString(), row.observedAt);
      await expect(history.locator("li").nth(index)).toContainText(nativeDate);
    }
    // Fault-inject only the transported display operand, over a genuine authenticated response.
    // The source database and worker remain real and unchanged; no fabricated Profile fixture.
    let malformedReads = 0;
    await page.route(`${origin}/learner-profile`, async route => {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      const payload = await response.json();
      payload.profile.history.items[0].playedDecisions = "opaque-bad-count";
      malformedReads += 1;
      await route.fulfill({ response, json: payload });
    });
    await page.getByRole("button", { name: "Refresh profile", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Your profile could not be loaded");
    await expect(page.getByRole("region", { name: "Your saved runs" })).toHaveCount(0);
    await expect(page.locator("main.profile-view")).not.toContainText("opaque-bad-count");
    expect(malformedReads).toBe(1);
    await page.unroute(`${origin}/learner-profile`);
    await page.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveCount(0);
    await expect(history.locator("li")).toHaveCount(2);
    await expect(page.getByRole("region", { name: "What is counted" })).toContainText("All 2 of your saved runs are counted");
    expect(inspection.prepare("SELECT id, summary_json FROM drill_runs ORDER BY id").all()).toEqual(sourceBefore);
    expect(inspection.prepare("SELECT id, snapshot_json FROM drill_runs ORDER BY id").all()).toEqual(recordingsBefore);
  } finally {
    try {
      inspection?.close();
      await outsider?.close();
    } finally {
      try { await stop(child); }
      finally { rmSync(directory, { recursive: true, force: true }); }
    }
  }
});
