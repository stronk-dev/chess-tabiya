// DISPOSABLE RESEARCH INSTRUMENT — Q-04 / K9 / C7 (2026-08-16). Not production code.
//
// Perceived (browser-side) latency on the ENDGAME surface. The shipped suite
// tests/browser/drill.spec.ts already records a latency envelope, but it takes
// ONE sample of each operation on the Najdorf schema-example OPENING pack, and
// its web server could not start while a concurrent session held uncommitted
// schema changes. This spec takes distributions on endgame packs instead.
//
// Interactive steps run on queen-vs-pawn-seventh-convert because it is the ONE
// served endgame pack whose side-to-move has a piece on a square the layout
// leaves clickable (see occlusion-probe.mjs). That is a finding, not a
// convenience: on the other five, no move can be made at all.
//
// Every number is measured inside the page with performance.now(), from the
// gesture to the DOM state a learner is waiting for.
import { mkdir, writeFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const OPEN_PACK = "Lucena: build the bridge and promote";
const PLAY_PACK = "Queen against a knight pawn on the seventh: the zigzag";
const PLAY_MOVE = { from: "e4", to: "c4" }; // Qc4+, the pack's authored first move
const ALTERNATIVE_TO = "d4"; // any other legal queen move from e4
const SAMPLES = Number(process.env.K9_SAMPLES ?? 20);

function stats(durations: readonly number[]) {
  const sorted = [...durations].sort((left, right) => left - right);
  const round = (value: number): number => Math.round(value * 10) / 10;
  return {
    n: sorted.length,
    minMs: round(sorted[0]!),
    medianMs: round(sorted[Math.floor(sorted.length / 2)]!),
    p95Ms: round(sorted[Math.ceil(sorted.length * 0.95) - 1]!),
    maxMs: round(sorted.at(-1)!),
    all: sorted.map(round),
  };
}

const now = (page: Page): Promise<number> => page.evaluate(() => performance.now());

async function drag(page: Page, from: string, to: string): Promise<void> {
  const board = page.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  await board.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
  const box = (await board.boundingBox())!;
  const point = (square: string) => ({
    x: box.x + ((square.charCodeAt(0) - 97 + 0.5) * box.width) / 8,
    y: box.y + ((7 - (Number(square[1]) - 1) + 0.5) * box.height) / 8,
  });
  const origin = point(from);
  const destination = point(to);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 8 });
  await page.mouse.up();
}

// A checkpoint sheet opens over the board after the authored first move and its
// backdrop intercepts every pointer event, so it must be dismissed before the
// next gesture. It is part of the loop, not an artefact of the harness.
async function dismissCheckpoint(page: Page): Promise<void> {
  const proceed = page.getByRole("button", { name: "Continue" });
  for (let guard = 0; guard < 4; guard += 1) {
    if (!(await proceed.isVisible().catch(() => false))) return;
    await proceed.click();
    await page.waitForTimeout(120);
  }
}

async function library(page: Page): Promise<void> {
  await page.locator("#primary-navigation a[href='/play']").click();
  await expect(page.getByText("Choose a position worth returning to.")).toBeVisible();
}

async function openPack(page: Page, title: string): Promise<void> {
  await page.getByRole("article").filter({ hasText: title }).getByRole("button", { name: /Open position/ }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
}

test("endgame latency distributions", async ({ page }) => {
  test.setTimeout(1_800_000);
  const report: Record<string, unknown> = {};
  const stage = (name: string): void => { process.stdout.write(`K9_STAGE ${name} ${Date.now()}\n`); };

  // ---- cold: fresh context -> endgame library ------------------------------
  const coldStart = Date.now();
  await page.goto("/play");
  await page.getByRole("button", { name: "Create an account" }).click();
  await page.getByLabel("Handle").fill(`k9_${Math.random().toString(36).slice(2, 10)}`);
  await page.getByLabel("Password").fill("k9-probe-password");
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText("Choose a position worth returning to.")).toBeVisible();
  report.coldRegisterToLibraryMs = Date.now() - coldStart;

  stage("restart");
  // ---- restart: library -> playable endgame board (the CET comparison) -----
  const restart: number[] = [];
  for (let index = 0; index < SAMPLES; index += 1) {
    const started = await now(page);
    await openPack(page, OPEN_PACK);
    await expect(page.getByRole("heading", { name: "Active line" })).toBeVisible();
    restart.push((await now(page)) - started);
    await library(page);
  }
  report.boardReadyFromLibraryMs = stats(restart);

  stage("reload");
  // ---- reload of an existing run URL (full app boot, warm HTTP cache) ------
  await openPack(page, OPEN_PACK);
  const runUrl = page.url();
  const reload: number[] = [];
  for (let index = 0; index < 10; index += 1) {
    const started = Date.now();
    await page.goto(runUrl);
    await expect(page.getByLabel("Chessboard")).toBeVisible();
    reload.push(Date.now() - started);
  }
  report.runUrlReloadMs = stats(reload);

  stage("reply");
  // ---- opponent reply: mouse-up on our move -> opponent ply on the board ---
  const reply: number[] = [];
  for (let index = 0; index < 10; index += 1) {
    await library(page);
    await openPack(page, PLAY_PACK);
    await expect(page.getByText("0 plies")).toBeVisible();
    const started = await now(page);
    await drag(page, PLAY_MOVE.from, PLAY_MOVE.to);
    await expect(page.getByText("2 plies")).toBeVisible();
    reply.push((await now(page)) - started);
    await dismissCheckpoint(page);
  }
  report.userMoveToOpponentReplyMs = stats(reply);

  stage("rewind");
  // ---- rewind: preview one ply back, confirm ------------------------------
  const rewinds: number[] = [];
  for (let index = 0; index < 10; index += 1) {
    await library(page);
    await openPack(page, PLAY_PACK);
    await drag(page, PLAY_MOVE.from, PLAY_MOVE.to);
    await expect(page.getByText("2 plies")).toBeVisible();
    await dismissCheckpoint(page);
    await page.locator("main.drill").focus();
    await page.keyboard.press("ArrowLeft");
    const started = await now(page);
    await page.keyboard.press("Enter");
    await expect(page.getByText("1 plies")).toBeVisible();
    rewinds.push((await now(page)) - started);
  }
  report.rewindMs = stats(rewinds);

  // ---- branch switch: NOT MEASURED IN THE BROWSER, and why -----------------
  // switchBranch IS rewind (apps/web/src/lib/session-controller.ts:428-429
  // calls this.rewind), so the browser-perceived cost of the operation is the
  // rewind distribution above. An independent browser measurement was
  // attempted and abandoned: with two branches built by rewinding to the root
  // and playing a different move, clicking "Switch to branch 1: main" left the
  // rail's active branch on the other branch, so the switch was not observable
  // from the DOM. That is recorded as an open question, not as a latency
  // number.

  await mkdir("test-results", { recursive: true });
  await writeFile(
    process.env.K9_BROWSER_OUT ?? "test-results/k9-browser-arm.json",
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(`K9_BROWSER_LATENCY ${JSON.stringify(report)}`);
});
