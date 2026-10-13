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
            if (frames >= 3) state.ready = performance.now();
            else if (performance.now() - state.click < 30_000) requestAnimationFrame(observe);
          };
          requestAnimationFrame(observe);
        }, { once: true, capture: true });
      });
      await cdp.send("Profiler.start");
      await open.click();
      await page.waitForFunction(() => ((window as Window & { arrivalProfile?: { ready: number } }).arrivalProfile?.ready ?? -1) >= 0);
      const { profile } = await cdp.send("Profiler.stop") as { profile: { nodes: ProfileNode[]; samples: number[]; timeDeltas: number[]; startTime: number } };
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
      console.log(`D3600_PROFILE ${JSON.stringify({ rate, sample, ...timing, top })}`);
    }
  } finally {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await cdp.detach();
  }
});
