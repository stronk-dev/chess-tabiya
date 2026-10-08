import { randomUUID } from "node:crypto";

import { expect, test, type Locator, type Page } from "@playwright/test";

import type { DrillRun } from "@chess-tabiya/runtime";
import { commitMove, createRun } from "../../packages/runtime/src/runtime.js";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const OPENING = ["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1h1", "f8e7", "f1e1", "b7b5", "a4b3", "d7d6", "c2c3", "e8h8", "h2h3", "c6b8", "d2d4", "b8d7"];
const POLICY = { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } as const;

async function waitingReturns(page: Page) {
  const registered = await page.request.post("/auth/register", { data: { handle: `returns_${randomUUID().slice(0, 8)}`, password: "return-browser-password" } });
  expect(registered.status(), await registered.text()).toBe(201);
  let fixture = createRun({
    id: "return-fixture-positions", session: { kind: "position", start: { fen: START, side: "white" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
    sessionDigest: `sha256:${"a".repeat(64)}`, policyConfig: POLICY, seed: 7,
  });
  const sources = [];
  // Twenty-one distinct legal roots and explicit returns through the actual authenticated
  // API. No database seeding, mocked due cards, future clock or scheduling-rule changes.
  for (let index = 0; index <= OPENING.length; index += 1) {
    if (index > 0) fixture = commitMove(fixture, OPENING[index - 1]!).run;
    const fen = fixture.nodes.find((node) => node.id === fixture.activeCursor.nodeId)!.fen;
    const id = `return-${randomUUID()}`;
    const headers = { "x-writer-id": `writer-${id}` };
    const created = await page.request.post("/runs", {
      headers, data: {
        id, session: { kind: "position", start: { fen, side: fen.split(" ")[1] === "w" ? "white" : "black" }, feedbackPolicy: "attempt_end", opponentPolicy: { mode: "human_common" } },
        policyConfig: POLICY, seed: 7,
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const { run } = await created.json() as { run: DrillRun };
    const dueAt = `2000-01-01T00:${String(index).padStart(2, "0")}:00.000Z`;
    const scheduled = await page.request.post(`/runs/${id}/schedule`, { headers, data: { nodeId: run.activeCursor.nodeId, kind: "blocked", dueAt } });
    expect(scheduled.status(), await scheduled.text()).toBe(201);
    const { schedule } = await scheduled.json() as { schedule: { id: string } };
    sources.push({ id, scheduleId: schedule.id, fen, dueAt });
  }
  const response = await page.request.get("/progress/due");
  expect(response.ok(), await response.text()).toBe(true);
  const initial = await response.json() as { schedules: { id: string; sourceRunId: string }[]; waiting: number; intakeLimit: number };
  expect(initial).toMatchObject({ waiting: 1, intakeLimit: 20 });
  expect(initial.schedules).toHaveLength(20);
  const hidden = sources.find((source) => !initial.schedules.some((item) => item.sourceRunId === source.id))!;
  expect(hidden).toBeDefined();
  return { hidden, firstId: initial.schedules[0]!.id };
}

for (const suffix of ["desktop", "@mobile touch phone"]) {
  test.describe(`due intake replenishment ${suffix}`, () => {
    const activate = (button: Locator) => suffix.includes("@mobile") ? button.tap() : button.click();

    test("serves the waiting return after dismissal and starts its exact preserved position", async ({ page }) => {
      const { hidden, firstId } = await waitingReturns(page);
      await page.goto("/learn");
      const due = page.getByRole("region", { name: "Due now", exact: true });
      await expect(due.getByRole("article")).toHaveCount(20);
      await expect(due).toContainText("1 more return is waiting");
      const hiddenDate = await page.evaluate((value) => new Date(value).toLocaleString(), hidden.dueAt);
      const next = due.getByRole("article").filter({ hasText: hiddenDate });
      await expect(next).toHaveCount(0);
      let release!: () => void;
      const held = new Promise<void>((resolve) => { release = resolve; });
      let responseReady!: () => void;
      const ready = new Promise<void>((resolve) => { responseReady = resolve; });
      await page.route("**/progress/due", async (route) => {
        const response = await route.fetch();
        expect(response.ok(), await response.text()).toBe(true);
        responseReady();
        await held;
        await route.fulfill({ response });
      });
      const dismiss = due.getByRole("article").first().getByRole("button", { name: "Dismiss", exact: true });
      await dismiss.focus();
      await dismiss.press("Enter");
      await ready;
      await expect(due.getByRole("article")).toHaveCount(19);
      await expect(due.getByRole("status")).toHaveText("Updating your due returns…");
      await expect(due.getByRole("heading", { name: "Due now", exact: true })).toBeFocused();
      release();
      await expect(due.getByRole("article")).toHaveCount(20);
      await expect(next).toHaveCount(1);
      await expect(due).not.toContainText("waiting");
      await page.unrouteAll({ behavior: "wait" });
      const refreshed = await (await page.request.get("/progress/due")).json() as { schedules: { id: string }[]; waiting: number };
      expect(refreshed.schedules.some((item) => item.id === firstId)).toBe(false);
      expect(refreshed.schedules.some((item) => item.id === hidden.scheduleId)).toBe(true);
      const duplicated = page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes(`/runs/${hidden.id}/duplicate`));
      await next.getByRole("button", { name: "Start due attempt", exact: true }).click();
      const response = await duplicated;
      expect(response.ok(), await response.text()).toBe(true);
      expect(response.request().postDataJSON()).toMatchObject({ scheduleId: hidden.scheduleId });
      const { run } = await response.json() as { run: DrillRun };
      expect(run.id).not.toBe(hidden.id);
      expect(run.nodes[0]!.fen).toBe(hidden.fen);
      await expect(page).toHaveURL(new RegExp(`/play/run/${run.id}$`, "u"));
      await expect(page.getByLabel("Chessboard", { exact: true })).toBeVisible();
      const sourceResponse = await page.request.get(`/runs/${hidden.id}/graph`);
      expect(sourceResponse.ok(), await sourceResponse.text()).toBe(true);
      const { graph: source } = await sourceResponse.json() as { graph: { nodes: DrillRun["nodes"] } };
      expect(source.nodes).toHaveLength(1);
      expect(source.nodes[0]!.fen).toBe(hidden.fen);
    });

    test("recovers a failed intake read without repeating the successful dismissal", async ({ page }) => {
      const { hidden } = await waitingReturns(page);
      await page.goto("/learn");
      const due = page.getByRole("region", { name: "Due now", exact: true });
      await expect(due.getByRole("article")).toHaveCount(20);
      let dismissals = 0;
      page.on("request", (request) => {
        if (request.method() === "POST" && /\/progress\/schedules\/[^/]+$/u.test(new URL(request.url()).pathname)) dismissals += 1;
      });
      await page.route("**/progress/due", async (route) => { await route.abort("failed"); }, { times: 1 });
      await due.getByRole("article").first().getByRole("button", { name: "Dismiss", exact: true }).click();
      await expect(due.getByRole("alert")).toContainText("The return was dismissed, but your remaining due returns could not be refreshed.");
      await expect(due.getByRole("article")).toHaveCount(19);
      await due.getByRole("button", { name: "Retry loading returns", exact: true }).click();
      await expect(due.getByRole("article")).toHaveCount(20);
      await expect(due.getByRole("alert")).toHaveCount(0);
      await expect(due).not.toContainText("waiting");
      expect(dismissals).toBe(1);
      const refreshed = await (await page.request.get("/progress/due")).json() as { schedules: { id: string }[] };
      expect(refreshed.schedules.some((item) => item.id === hidden.scheduleId)).toBe(true);
    });

    for (const committed of [true, false]) {
      test(`reconciles an unconfirmed dismissal before another mutation (committed=${committed})`, async ({ page }) => {
        const { firstId } = await waitingReturns(page);
        await page.goto("/learn");
        const due = page.getByRole("region", { name: "Due now", exact: true });
        await expect(due.getByRole("article")).toHaveCount(20);
        let dismissals = 0;
        page.on("request", (request) => {
          if (request.method() === "POST" && /\/progress\/schedules\/[^/]+$/u.test(new URL(request.url()).pathname)) dismissals += 1;
        });
        await page.route(`**/progress/schedules/${firstId}`, async (route) => {
          if (committed) {
            const response = await route.fetch();
            expect(response.ok(), await response.text()).toBe(true);
          }
          // The first arm loses a real accepted response; the other never reaches storage.
          await route.abort("failed");
        }, { times: 1 });
        let release!: () => void;
        const held = new Promise<void>((resolve) => { release = resolve; });
        let responseReady!: () => void;
        const ready = new Promise<void>((resolve) => { responseReady = resolve; });
        await page.route("**/progress/due", async (route) => {
          const response = await route.fetch();
          expect(response.ok(), await response.text()).toBe(true);
          responseReady();
          await held;
          await route.fulfill({ response });
        }, { times: 1 });
        const dismiss = due.getByRole("article").first().getByRole("button", { name: "Dismiss", exact: true });
        if (!suffix.includes("@mobile")) await dismiss.focus();
        await activate(dismiss);
        await expect(due.getByRole("status").filter({ hasText: /^Checking your due returns…$/u })).toHaveText("Checking your due returns…");
        await ready;
        await expect(due.getByRole("article")).toHaveCount(20);
        await expect(dismiss).toBeDisabled();
        expect(dismissals).toBe(1);
        release();
        await expect(due).toContainText("We couldn't confirm the dismissal. Your due list is up to date.");
        await expect(due.getByRole("alert")).toHaveCount(0);
        await expect(due).not.toContainText("The return was dismissed");
        await expect(due).not.toContainText("It remains in your queue");
        if (!suffix.includes("@mobile")) await expect(due.getByRole("heading", { name: "Due now", exact: true })).toBeFocused();
        const refreshed = await (await page.request.get("/progress/due")).json() as { schedules: { id: string }[]; waiting: number };
        expect(refreshed.schedules.some((item) => item.id === firstId)).toBe(!committed);
        expect(refreshed.waiting).toBe(committed ? 0 : 1);
        expect(dismissals).toBe(1);
        if (!committed) {
          await activate(due.getByRole("article").first().getByRole("button", { name: "Dismiss", exact: true }));
          await expect(due).not.toContainText("couldn't confirm");
          await expect(due).not.toContainText("waiting");
          await expect(due.getByRole("article")).toHaveCount(20);
          const retried = await (await page.request.get("/progress/due")).json() as { schedules: { id: string }[] };
          expect(retried.schedules.some((item) => item.id === firstId)).toBe(false);
          expect(dismissals).toBe(2);
        }
        await page.unrouteAll({ behavior: "wait" });
      });
    }

    test("retries only the due read when both a committed response and its reconciliation are lost", async ({ page }) => {
      const { firstId } = await waitingReturns(page);
      await page.goto("/learn");
      const due = page.getByRole("region", { name: "Due now", exact: true });
      await expect(due.getByRole("article")).toHaveCount(20);
      let dismissals = 0;
      page.on("request", (request) => {
        if (request.method() === "POST" && /\/progress\/schedules\/[^/]+$/u.test(new URL(request.url()).pathname)) dismissals += 1;
      });
      await page.route(`**/progress/schedules/${firstId}`, async (route) => {
        const response = await route.fetch();
        expect(response.ok(), await response.text()).toBe(true);
        await route.abort("failed");
      }, { times: 1 });
      await page.route("**/progress/due", (route) => route.abort("failed"), { times: 1 });
      await activate(due.getByRole("article").first().getByRole("button", { name: "Dismiss", exact: true }));
      await expect(due.getByRole("alert")).toContainText("We couldn't confirm whether this return was dismissed, and your due returns could not be refreshed.");
      await expect(due.getByRole("article")).toHaveCount(20);
      await expect(due.getByRole("button", { name: "Dismiss", exact: true }).first()).toBeDisabled();
      await expect(due.getByRole("button", { name: "Start due attempt", exact: true }).first()).toBeDisabled();
      await expect(due.getByRole("button", { name: "Open source", exact: true }).first()).toBeEnabled();
      await activate(due.getByRole("button", { name: "Retry loading returns", exact: true }));
      await expect(due.getByRole("alert")).toHaveCount(0);
      await expect(due).toContainText("We couldn't confirm the dismissal. Your due list is up to date.");
      await expect(due).not.toContainText("waiting");
      const refreshed = await (await page.request.get("/progress/due")).json() as { schedules: { id: string }[] };
      expect(refreshed.schedules.some((item) => item.id === firstId)).toBe(false);
      expect(dismissals).toBe(1);
    });
  });
}
