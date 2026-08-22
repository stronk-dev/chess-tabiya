import { randomUUID } from "node:crypto";

import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

const PASSWORD = "browser-test-password";

async function learner(browser: Browser, prefix: string): Promise<{
  readonly context: BrowserContext;
  readonly page: Page;
  readonly handle: string;
}> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const handle = `${prefix}_${randomUUID().slice(0, 8)}`;
  await page.goto("/play");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Handle").fill(handle);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText("Choose a position worth returning to.")).toBeVisible();
  return { context, page, handle };
}

function point(
  box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  square: string,
  orientation: "white" | "black",
): { readonly x: number; readonly y: number } {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return {
    x: box.x + (((orientation === "white" ? file : 7 - file) + 0.5) * box.width) / 8,
    y: box.y + (((orientation === "white" ? 7 - rank : rank) + 0.5) * box.height) / 8,
  };
}

async function play(page: Page, from: string, to: string, orientation: "white" | "black"): Promise<void> {
  const board = page.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  await board.evaluate((element) => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  ));
  const box = await board.boundingBox();
  if (box === null) throw new Error("Chessboard has no visible bounds");
  const source = point(box, from, orientation);
  const destination = point(box, to, orientation);
  await page.mouse.move(source.x, source.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 8 });
  await page.mouse.up();
}

async function startPosition(page: Page): Promise<string> {
  await page.goto("/play");
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  return decodeURIComponent(new URL(page.url()).pathname.split("/").at(-1)!);
}

test("two learners alternate a native match, pause to branch, and return to the main line", async ({ browser }) => {
  const coach = await learner(browser, "coach");
  const white = await learner(browser, "white");
  const black = await learner(browser, "black");
  try {
    const runId = await startPosition(coach.page);
    await coach.page.goto("/live");
    await coach.page.getByLabel("Kind").selectOption("match");
    await coach.page.getByLabel("Board").selectOption("match");
    await coach.page.getByLabel("White handle").fill(white.handle);
    await coach.page.getByLabel("Black handle").fill(black.handle);
    await coach.page.getByRole("button", { name: "Create match" }).click();
    await expect(coach.page.getByRole("heading", { name: "match session" })).toBeVisible();
    const sessionId = new URL(coach.page.url()).pathname.split("/").at(-1)!;

    await Promise.all([
      white.page.goto(`/play/run/${encodeURIComponent(runId)}`),
      black.page.goto(`/play/run/${encodeURIComponent(runId)}`),
    ]);
    await expect(white.page.getByLabel("Live session rail")).toContainText("Your move");
    await expect(black.page.getByLabel("Live session rail")).toContainText("Their move");

    await play(white.page, "e2", "e4", "white");
    await expect(black.page.getByText("Active line 1 plies")).toBeVisible({ timeout: 4_000 });
    await expect(black.page.getByLabel("Live session rail")).toContainText("Your move", { timeout: 4_000 });

    const whiteWriter = await white.page.evaluate((id) => localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
    expect(whiteWriter).not.toBeNull();
    const wrongClaim = await white.page.request.post(`/runs/${encodeURIComponent(runId)}/lease`, {
      headers: { "x-writer-id": whiteWriter! },
      data: {},
    });
    expect(wrongClaim.status()).toBe(409);
    expect((await wrongClaim.json()).error.code).toBe("BOARD_HELD");

    const blackWriter = await black.page.evaluate((id) => localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
    expect(blackWriter).not.toBeNull();
    const labelledMove = await black.page.request.post(`/runs/${encodeURIComponent(runId)}/moves`, {
      headers: { "x-writer-id": blackWriter! },
      data: { uci: "e7e5", actor: "user" },
    });
    expect(labelledMove.status()).toBe(400);
    expect((await labelledMove.json()).error.code).toBe("INVALID_REQUEST");
    await play(black.page, "e7", "e5", "black");
    await expect(white.page.getByText("Active line 2 plies")).toBeVisible({ timeout: 4_000 });

    const liveReveal = await white.page.request.post(`/runs/${encodeURIComponent(runId)}/reveal`, {
      headers: { "x-writer-id": whiteWriter! }, data: {},
    });
    expect(liveReveal.status()).toBe(409);
    expect((await liveReveal.json()).error.code).toBe("MATCH_LIVE");

    await white.page.getByRole("button", { name: "Propose pause" }).click();
    await expect(black.page.getByRole("button", { name: "Accept pause" })).toBeVisible({ timeout: 4_000 });
    await black.page.getByRole("button", { name: "Accept pause" }).click();
    await expect(white.page.getByLabel("Live session rail")).toContainText("Paused — rehearsal is open", { timeout: 4_000 });

    const graphResponse = await (await white.page.request.get(`/runs/${encodeURIComponent(runId)}/graph`)).json() as { readonly graph: {
      readonly nodes: readonly { readonly id: string; readonly parentId: string | null }[];
      readonly branches: readonly { readonly id: string }[];
    } };
    const graph=graphResponse.graph;
    const root = graph.nodes.find((node) => node.parentId === null)!;
    const pausedWriter = await white.page.evaluate((id) => localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
    await white.page.request.post(`/runs/${encodeURIComponent(runId)}/lease`, { headers: { "x-writer-id": pausedWriter! }, data: {} });
    const rewind = await white.page.request.post(`/runs/${encodeURIComponent(runId)}/rewind`, {
      headers: { "x-writer-id": pausedWriter! }, data: { nodeId: root.id },
    });
    expect(rewind.ok(), await rewind.text()).toBe(true);
    await white.page.reload();
    await expect(white.page.getByLabel("Live session rail")).toContainText("Paused — rehearsal is open");
    await play(white.page, "d2", "d4", "white");
    await expect(white.page.getByRole("button", { name: /Switch to branch/ })).toHaveCount(2);
    const reveal = await white.page.request.post(`/runs/${encodeURIComponent(runId)}/reveal`, {
      headers: { "x-writer-id": pausedWriter! }, data: {},
    });
    expect(reveal.ok(), await reveal.text()).toBe(true);

    await white.page.getByRole("button", { name: "Resume main line" }).click();
    await expect(white.page.getByText("Active line 2 plies")).toBeVisible();
    await expect(white.page.getByLabel("Live session rail")).toContainText("Your move");

    await coach.page.goto("/live");
    const wall = coach.page.getByRole("article").filter({ hasText: "match session" });
    await expect(wall).toContainText(`@${white.handle} vs @${black.handle}`);
    await expect(wall).toContainText("white to move");
    await expect(wall.getByLabel("Chessboard")).toBeVisible();
    await wall.getByRole("button", { name: "Open" }).click();
    await expect(coach.page).toHaveURL(new RegExp(`/live/session/${sessionId}$`));
    await expect(coach.page.getByLabel("Move authorship")).toContainText(`Move 1 · @${white.handle}`);
    await expect(coach.page.getByLabel("Move authorship")).toContainText(`Move 2 · @${black.handle}`);
  } finally {
    await Promise.all([coach.context.close(), white.context.close(), black.context.close()]);
  }
});

test("a single-use friend link registers a learner without exposing the board", async ({ browser }) => {
  const coach = await learner(browser, "linkcoach");
  try {
    const runId = await startPosition(coach.page);
    await coach.page.goto("/live");
    await coach.page.getByLabel("Kind").selectOption("match");
    await coach.page.getByLabel("Board").selectOption("match");
    await coach.page.getByLabel("White handle").fill(coach.handle);
    await coach.page.getByRole("button", { name: "Create match" }).click();
    await coach.page.getByRole("button", { name: "Create friend link" }).click();
    const linkText = await coach.page.getByRole("status").filter({ hasText: "Friend link:" }).innerText();
    const path = linkText.replace(/^Friend link:\s*/u, "").trim();

    const guest = await browser.newContext();
    const join = await guest.newPage();
    await join.goto(new URL(path, coach.page.url()).href);
    await expect(join.getByRole("heading", { name: "match session" })).toBeVisible();
    await expect(join.getByText(`Hosted by @${coach.handle}`)).toBeVisible();
    await expect(join.getByLabel("Chessboard")).toHaveCount(0);
    await expect(join.locator("pre")).toHaveCount(0);
    const guestHandle = `guest_${randomUUID().slice(0, 8)}`;
    await join.getByLabel("Handle").fill(guestHandle);
    await join.getByLabel("Password").fill(PASSWORD);
    await join.getByRole("button", { name: "Register and join" }).click();
    await expect(join).toHaveURL(/\/live\/session\//u);
    await expect(join.getByText(`@${guestHandle} — participant`)).toBeVisible();

    const second = await browser.newContext();
    const exhausted = await second.newPage();
    await exhausted.goto(new URL(path, coach.page.url()).href);
    await expect(exhausted.getByText("Route not found")).toBeVisible();
    await Promise.all([guest.close(), second.close()]);
  } finally {
    await coach.context.close();
  }
});
