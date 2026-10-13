// Disposable D3600 research tooling. CPU sampling/throttling locates work; it is not a
// readiness gate, a CI-host simulation, source authority or a production foundation.
import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";

interface ProfileNode {
  id: number;
  callFrame: { functionName: string; url: string; lineNumber: number; columnNumber: number };
  children?: number[];
}

interface TimelineEvent {
  name: string;
  ph: string;
  ts: number;
  dur?: number;
  pid: number;
  tid: number;
  args?: unknown;
}

for (const rate of [1, 4]) test(`D3600 CPU profile, throttle ${rate}`, async ({ page, context }) => {
  await page.goto("/play");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Handle").fill(`arrival_profile_${randomUUID().slice(0, 8)}`);
  await page.getByLabel("Password").fill("arrival-profile-password");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Profiler.enable");
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  try {
    for (let sample = 0; sample < 3; sample++) {
      await page.goto("/play");
      const open = page.getByRole("button", { name: /Rehearse this position:/ }).first();
      await expect(open).toBeVisible();
      await open.evaluate((button) => {
        button.addEventListener("click", () => {
          performance.mark("D3600_click");
          const state = { click: performance.now(), ready: -1 };
          (window as Window & { arrivalProfile?: typeof state }).arrivalProfile = state;
          let frames = 0;
          const observe = (): void => {
            const board = document.querySelector<HTMLElement>('[aria-label="Chessboard"]');
            const grid = document.querySelector('[data-board-input-grid]');
            const rect = board?.getBoundingClientRect();
            const playable = board !== null && board.getClientRects().length > 0
              && getComputedStyle(board).visibility === "visible" && rect !== undefined
              && rect.width > 0 && rect.width === rect.height
              && grid?.getAttribute("aria-rowcount") === "8" && grid.getAttribute("aria-colcount") === "8"
              && grid.getAttribute("aria-readonly") !== "true" && grid.querySelectorAll('[role="gridcell"]').length === 64;
            frames = playable ? frames + 1 : 0;
            if (frames >= 3) { state.ready = performance.now(); performance.mark("D3600_ready"); }
            else if (performance.now() - state.click < 30_000) requestAnimationFrame(observe);
          };
          requestAnimationFrame(observe);
        }, { once: true, capture: true });
      });
      // Retain the timeline only in memory. V8's `(program)` samples cannot tell layout,
      // paint and other native work apart; these exact user marks bound the main-thread spans.
      const timeline: TimelineEvent[] = [];
      const collect = ({ value }: { value: TimelineEvent[] }): void => { timeline.push(...value); };
      cdp.on("Tracing.dataCollected", collect);
      await cdp.send("Tracing.start", { categories: "devtools.timeline,blink.user_timing,disabled-by-default-devtools.timeline.stack", transferMode: "ReportEvents" });
      await cdp.send("Profiler.start");
      await open.click();
      await page.waitForFunction(() => ((window as Window & { arrivalProfile?: { ready: number } }).arrivalProfile?.ready ?? -1) >= 0);
      const { profile } = await cdp.send("Profiler.stop") as { profile: { nodes: ProfileNode[]; samples: number[]; timeDeltas: number[]; startTime: number } };
      const tracingDone = new Promise<void>((resolve) => cdp.once("Tracing.tracingComplete", () => resolve()));
      await cdp.send("Tracing.end");
      await tracingDone;
      cdp.off("Tracing.dataCollected", collect);
      const clickMark = timeline.find((event) => event.name === "D3600_click");
      const readyMark = timeline.find((event) => event.name === "D3600_ready");
      expect(clickMark).toBeDefined(); expect(readyMark).toBeDefined();
      const native = new Map<string, { count: number; inclusiveMs: number; longestMs: number }>();
      for (const event of timeline) {
        if (event.pid !== clickMark!.pid || event.tid !== clickMark!.tid || event.ph !== "X" || event.dur === undefined) continue;
        const overlap = Math.max(0, Math.min(event.ts + event.dur, readyMark!.ts) - Math.max(event.ts, clickMark!.ts));
        if (overlap <= 0) continue;
        const group = native.get(event.name) ?? { count: 0, inclusiveMs: 0, longestMs: 0 };
        group.count++; group.inclusiveMs += overlap / 1000; group.longestMs = Math.max(group.longestMs, overlap / 1000);
        native.set(event.name, group);
      }
      const mainThreadTimeline = Object.fromEntries([...native].sort((a, b) => b[1].inclusiveMs - a[1].inclusiveMs).slice(0, 12));
      const layoutSites = timeline.filter((event) => event.name === "Layout" && event.pid === clickMark!.pid
        && event.tid === clickMark!.tid && event.ph === "X" && event.dur !== undefined
        && event.ts < readyMark!.ts && event.ts + event.dur > clickMark!.ts)
        .sort((a, b) => b.dur! - a.dur!).slice(0, 4).map((event) => ({
          ms: event.dur! / 1000, afterClickMs: (event.ts - clickMark!.ts) / 1000,
          // Bounded human-readable initiators only; never emit or retain the raw timeline.
          initiator: JSON.stringify(event.args).slice(0, 1200),
        }));
      const { metrics } = await cdp.send("Performance.getMetrics") as { metrics: { name: string; value: number }[] };
      const navigationStart = metrics.find((metric) => metric.name === "NavigationStart")!.value;
      const boundary = await page.evaluate(() => (window as Window & { arrivalProfile: { click: number; ready: number } }).arrivalProfile);
      const start = navigationStart * 1_000_000 + boundary.click * 1000;
      const end = navigationStart * 1_000_000 + boundary.ready * 1000;
      const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
      const parents = new Map(profile.nodes.flatMap((node) => (node.children ?? []).map((id) => [id, node.id] as const)));
      const costs = new Map<number, number>();
      let cursor = profile.startTime;
      for (let i = 0; i < profile.samples.length; i++) {
        const next = cursor + profile.timeDeltas[i]!;
        const overlap = Math.max(0, Math.min(next, end) - Math.max(cursor, start));
        if (overlap > 0) costs.set(profile.samples[i]!, (costs.get(profile.samples[i]!) ?? 0) + overlap);
        cursor = next;
      }
      expect([...costs.values()].reduce((sum, value) => sum + value, 0)).toBeGreaterThan(0);
      const top = await Promise.all([...costs].sort((a, b) => b[1] - a[1]).slice(0, 12).map(async ([id, us]) => {
        const frame = nodes.get(id)!.callFrame;
        const stack: string[] = [];
        for (let cursor: number | undefined = id; cursor !== undefined; cursor = parents.get(cursor)) stack.push(nodes.get(cursor)!.callFrame.functionName);
        let source: string | undefined;
        if (frame.url.includes("/assets/") && frame.url.endsWith(".js")) {
          const text = await readFile(join("apps/web/dist/assets", basename(new URL(frame.url).pathname)), "utf8");
          source = text.split("\n")[frame.lineNumber]?.slice(Math.max(0, frame.columnNumber - 30), frame.columnNumber + 230);
        }
        return { ms: us / 1000, ...frame, stack, source };
      }));
      const timing = await page.evaluate(() => {
        const state = (window as Window & { arrivalProfile: { click: number; ready: number } }).arrivalProfile;
        const requests = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
          .filter((entry) => entry.initiatorType === "fetch" && entry.startTime >= state.click && entry.startTime <= state.ready);
        const groups = new Map<string, { count: number; firstStartMs: number; lastEndMs: number; longestMs: number }>();
        for (const entry of requests) {
          const path = new URL(entry.name).pathname.replace(/\/runs\/[^/]+/u, "/runs/:id").replace(/\/shapes\/[^/]+/u, "/shapes/:id");
          const group = groups.get(path) ?? { count: 0, firstStartMs: Infinity, lastEndMs: 0, longestMs: 0 };
          group.count++;
          group.firstStartMs = Math.min(group.firstStartMs, entry.startTime - state.click);
          group.lastEndMs = Math.max(group.lastEndMs, entry.responseEnd - state.click);
          group.longestMs = Math.max(group.longestMs, entry.duration);
          groups.set(path, group);
        }
        return { clickToReadyMs: state.ready - state.click, lastFetchEndMs: Math.max(0, ...requests.map((entry) => entry.responseEnd - state.click)), requests: requests.length, groups: Object.fromEntries(groups) };
      });
      console.log(`D3600_PROFILE ${JSON.stringify({ rate, sample, ...timing, mainThreadTimeline, layoutSites, top })}`);
    }
  } finally {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await cdp.detach();
  }
});

// D3756: actual created runs survive these failures. These reproduce the current boundary;
// they deliberately do not stand in for a production repair or add a CI timing threshold.
for (const endpoint of ["assignments", "repertoires"]) {
  for (const outcome of ["held", "failed"]) test(`D3756 ${endpoint} ${outcome} gates a created rehearsal`, async ({ page }) => {
    await page.goto("/play");
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(`arrival_boundary_${randomUUID().slice(0, 8)}`);
    await page.getByLabel("Password").fill("arrival-boundary-password");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    let entered!: () => void, release!: () => void;
    const requested = new Promise<void>((resolve) => { entered = resolve; });
    const pending = new Promise<void>((resolve) => { release = resolve; });
    await page.route(`**/${endpoint}`, async (route) => {
      entered();
      if (outcome === "held") { await pending; await route.continue(); }
      else await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "SERVICE_UNAVAILABLE", message: "private diagnostic sentinel" } }) });
    });
    try {
      await page.getByRole("button", { name: /Rehearse this position:/ }).first().click();
      await requested;
      await expect(page).toHaveURL(/\/play\/run\/[^/]+$/);
      const runId = new URL(page.url()).pathname.split("/").at(-1)!;
      const response = await page.request.get(`/runs/${runId}/graph`);
      expect(response.ok()).toBe(true);
      const before = (await response.json()).graph;
      expect(before.id).toBe(runId);
      expect(before.nodes.length).toBeGreaterThan(0);
      await expect(page.getByLabel("Chessboard")).toHaveCount(0);
      if (outcome === "held") {
        await expect(page.getByText("Loading Tabiya…", { exact: true })).toBeVisible();
        release();
        await expect(page.getByLabel("Chessboard")).toBeVisible();
        await expect(page.locator("[data-board-input-grid]")).not.toHaveAttribute("aria-readonly", "true");
      } else {
        await expect(page.getByRole("heading", { name: "This page is temporarily unavailable." })).toBeVisible();
        await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
        await expect(page.locator("body")).not.toContainText("private diagnostic sentinel");
      }
      const after = (await (await page.request.get(`/runs/${runId}/graph`)).json()).graph;
      expect(after.nodes).toEqual(before.nodes);
      expect(after.branches).toEqual(before.branches);
      expect(after.activeCursor).toEqual(before.activeCursor);
      console.log(`D3756_BOUNDARY ${JSON.stringify({ endpoint, outcome, retainedRun: true, blocksBoard: true })}`);
    } finally { release(); }
  });
}
