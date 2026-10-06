import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIResponse, type Locator, type Page, type TestInfo } from "@playwright/test";

import { chooseBot, chooseRawRung } from "./play-helpers.js";
import { inspectComposition, type CompositionConformance } from "./composition-conformance.js";
import { inspectCompositionVocabulary } from "./composition-vocabulary.js";
import { playBoardEdge } from "../../apps/web/src/lib/play-composition.js";
import type { ModuleQueryPage } from "@chess-tabiya/runtime";
import type { RunGraph } from "../../apps/web/src/lib/api.js";
import type { HumanSplitPage } from "../../apps/web/src/lib/api.js";

const SCHEMA_PACK_TITLE = "Najdorf: choose a setup and cross the theory boundary";

function schemaPackCard(page: Page): Locator {
  return page.getByRole("article").filter({
    has: page.getByRole("heading", { name: SCHEMA_PACK_TITLE, exact: true }),
  });
}

async function register(page: Page): Promise<string> {
  await page.goto("/play");
  let handle = "existing";
  if (await page.getByRole("button", { name: "Create an account" }).isVisible().catch(() => false)) {
    handle = `browser_${randomUUID().slice(0, 8)}`;
    await page.getByRole("button", { name: "Create an account" }).click();
    await page.getByLabel("Handle").fill(handle);
    await page.getByLabel("Password").fill("browser-test-password");
    await page.getByRole("button", { name: "Register" }).click();
  }
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeVisible();
  return handle;
}

/** Chooses a named help style from the Play pill and waits for the server-compiled result. */
async function choosePreset(page: Page, name: RegExp): Promise<void> {
  const summary = page.locator("details.assistance-control summary");
  await summary.click();
  const menu = page.locator("details.assistance-control .support-menu");
  const viewport = page.viewportSize();
  const menuBox = await menu.boundingBox();
  if (viewport === null || menuBox === null) throw new Error("Help-style menu has no viewport or box");
  expect(menuBox.x).toBeGreaterThanOrEqual(0);
  expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width);
  await page.getByRole("radio", { name }).check();
  await expect(page.locator("[data-preset-state]")).toHaveAttribute("data-preset-state", "ready");
  if (await page.locator("details.assistance-control").getAttribute("open") !== null) await summary.click();
  await expect(page.locator("details.assistance-control")).not.toHaveAttribute("open", "");
  await expect(page.locator(".workspace")).not.toHaveAttribute("inert", "");
}

/** Opens the companion's Support region when it is collapsed behind the compact tab. */
async function showSupport(page: Page): Promise<void> {
  if (!await page.getByRole("region", { name: "Support", exact: true }).isVisible()) {
    await page.getByRole("button", { name: "Support", exact: true }).click();
  }
  await expect(page.getByRole("region", { name: "Support", exact: true })).toBeVisible();
}

/** The tablet's bounded queue keeps existing Support actions in its real More head. */
async function showSupportTools(page: Page): Promise<void> {
  await showSupport(page);
  const more = page.getByRole("button", { name: "Support tools and help-style promise", exact: true });
  if (await more.isVisible() && await more.getAttribute("aria-expanded") !== "true") await more.click();
}

async function assertTabletQueueHead(page: Page, id: string): Promise<void> {
  const queue = page.locator(".companion-queue.band");
  await expect(queue).toBeVisible();
  const heads = queue.locator("[data-queue-head]");
  await expect(heads).toHaveCount(1);
  const head = heads.first();
  await expect(head).toHaveAttribute("data-queue-head", id);
  const selectors = queue.locator(".queue-selector");
  await expect(selectors).toHaveCount(8); // Seven ordinary module doors and existing Support tools.
  const headBox = (await head.boundingBox())!;
  const queueBox = (await queue.boundingBox())!;
  expect(headBox.y).toBeGreaterThanOrEqual(queueBox.y);
  expect(headBox.x).toBeGreaterThanOrEqual(queueBox.x);
  expect(headBox.x + headBox.width).toBeLessThanOrEqual(queueBox.x + queueBox.width);
  const row = await selectors.evaluateAll((buttons) => buttons.map((button) => {
    const box = button.getBoundingClientRect();
    return { ...box.toJSON(), hit: button.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)) };
  }));
  expect(new Set(row.map((box) => box.y)).size).toBe(1);
  for (const box of row) {
    expect(box.y).toBeGreaterThanOrEqual(headBox.y + headBox.height);
    expect(box.x).toBeGreaterThanOrEqual(queueBox.x);
    expect(box.x + box.width).toBeLessThanOrEqual(queueBox.x + queueBox.width);
    expect(box.y + box.height).toBeLessThanOrEqual(queueBox.y + queueBox.height);
    expect(box.hit).toBe(true);
  }
  expect(await head.evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");
  expect(await page.getByLabel("Support", { exact: true }).last().evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
}

async function assertTopbarSeparation(page: Page, width: number): Promise<void> {
  const brand = (await page.locator(".topbar .wordmark").boundingBox())!;
  const context = (await page.locator(".topbar .status").boundingBox())!;
  const actions = (await page.locator(".topbar-actions").boundingBox())!;
  expect(brand.x + brand.width, `brand/context separation at ${width}`).toBeLessThanOrEqual(context.x);
  expect(context.x + context.width, `context/actions separation at ${width}`).toBeLessThanOrEqual(actions.x);
  const bar = (await page.locator(".topbar").boundingBox())!;
  expect(context.y).toBeGreaterThanOrEqual(bar.y);
  expect(context.y + context.height).toBeLessThanOrEqual(bar.y + bar.height);
  for (const button of await page.locator(".topbar button").all()) {
    if (!await button.isVisible()) continue;
    expect(await button.evaluate((element) => { const box = element.getBoundingClientRect(); return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)); })).toBe(true);
  }
}

async function openAdvancedSupport(page: Page): Promise<void> {
  await page.locator("details.assistance-control summary").click();
  await page.getByRole("button", { name: "Advanced support controls" }).click();
  await expect(page.getByRole("dialog", { name: "Evidence inspector" })).toBeVisible();
}

async function enableEndgamePolicies(page: Page): Promise<void> {
  await page.route(/\/capabilities$/u, async (route) => {
    const response = await route.fetch();
    const descriptor = await response.json() as {
      policyModes: string[];
    };
    await route.fulfill({
      response,
      json: {
        ...descriptor,
        policyModes: [...descriptor.policyModes, "perfect_tablebase"],
      },
    });
  });
}

async function assertRunViewport(
  page: Page,
  viewport: { readonly width: number; readonly height: number },
): Promise<void> {
  const boardElement = page.getByLabel("Chessboard");
  await expect(boardElement).toBeVisible();
  const expectedEdge = playBoardEdge(viewport.width, viewport.height);
  await expect.poll(async () => (await boardElement.boundingBox())?.width).toBe(expectedEdge);
  const board = await boardElement.boundingBox();
  expect(board).not.toBeNull();
  expect(board!.x).toBeGreaterThanOrEqual(-1);
  expect(board!.y).toBeGreaterThanOrEqual(-1);
  expect(board!.x + board!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(board!.y + board!.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(board!.width).toBeGreaterThanOrEqual(192);
  expect(board!.width).toBe(expectedEdge);
  expect(board!.height).toBe(board!.width);
  expect(board!.width % 8).toBe(0);
  const regionElement = page.locator(".drill-region");
  const regionBox = await regionElement.boundingBox();
  const positionBox = await page.locator(".position-column").boundingBox();
  expect(regionBox).not.toBeNull();
  expect(positionBox).not.toBeNull();
  expect(board!.x).toBeGreaterThanOrEqual(positionBox!.x - 1);
  expect(board!.y).toBeGreaterThanOrEqual(positionBox!.y - 1);
  expect(board!.x + board!.width).toBeLessThanOrEqual(positionBox!.x + positionBox!.width + 1);
  expect(board!.y + board!.height).toBeLessThanOrEqual(positionBox!.y + positionBox!.height + 1);
  const region = await regionElement.evaluate((element) => ({
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }));
  expect(region.scrollHeight).toBeLessThanOrEqual(region.clientHeight + 1);
  if (viewport.width > 719) {
    const timeline = await page.locator(".timeline-strip").boundingBox();
    expect(timeline).not.toBeNull();
    expect(board!.y + board!.height).toBeLessThanOrEqual(timeline!.y + 1);
  }
}

async function attachCompositionCell(
  page: Page,
  testInfo: TestInfo,
  viewport: { readonly width: number; readonly height: number },
  state: string,
): Promise<void> {
  const name = `play-composition-${viewport.width}x${viewport.height}-${state}`;
  const vocabulary = await inspectCompositionVocabulary(page, name);
  expect(vocabulary.ordinaryTextNodes, `${name}: empty vocabulary census`).toBeGreaterThan(0);
  expect(vocabulary.leaks, `${name}: ${JSON.stringify(vocabulary.leaks)}`).toEqual([]);
  await testInfo.attach(`composition-vocabulary-${name}`, { body: Buffer.from(JSON.stringify(vocabulary)), contentType: "application/json" });
  const conformance = await inspectComposition(page, name);
  await testInfo.attach(`composition-conformance-${name}`, { body: Buffer.from(JSON.stringify(conformance)), contentType: "application/json" });
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

const ENDGAME_VIEWPORT_PACKS = [
  "Lucena: build the bridge and promote",
  "Philidor: the third-rank fence holds the draw",
  "Bishop and knight: the walk to the corner your bishop owns",
  "Rook mate: the fence, the opposition, and the tempo move",
  "King and pawn: opposition, key squares, promotion",
  "Queen against a knight pawn on the seventh: the zigzag",
] as const;

const ENDGAME_INTERACTION_PACKS = [
  { title: ENDGAME_VIEWPORT_PACKS[0], uci: "c1d1", orientation: "white" },
  { title: ENDGAME_VIEWPORT_PACKS[1], uci: "h6b6", orientation: "black" },
  { title: ENDGAME_VIEWPORT_PACKS[2], uci: "c3e5", orientation: "white" },
  { title: ENDGAME_VIEWPORT_PACKS[3], uci: "h2h6", orientation: "white" },
  { title: ENDGAME_VIEWPORT_PACKS[4], uci: "e2e3", orientation: "white" },
  { title: ENDGAME_VIEWPORT_PACKS[5], uci: "e4c4", orientation: "white" },
] as const;

const ENDGAME_INPUT_PROJECTIONS = [
  { width: 1440, height: 1000 },
  { width: 1366, height: 768 },
  { width: 1280, height: 720 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
] as const;

test.beforeEach(async ({ page }) => register(page));

test.afterEach(async ({}, testInfo) => {
  const reports = testInfo.attachments.filter(a => a.name.startsWith("composition-conformance-"));
  for (const attachment of reports) {
    expect(attachment.body, `${attachment.name}: missing measured report`).toBeDefined();
    const report = JSON.parse(attachment.body!.toString("utf8")) as CompositionConformance;
    expect(report.controls, `${report.cell}: vacuous actionable census`).toBeGreaterThan(0);
    expect(report.issues, `${report.cell}: ${JSON.stringify(report.issues, null, 2)}`).toEqual([]);
  }
});

test("an anonymous visitor understands the product, browses positions, and keeps the chosen rehearsal through registration", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/play");

  await expect(page.getByRole("heading", { name: "Do not just learn the move. Rehearse the game it creates." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeVisible();
  await expect(page.getByText("Grounded feedback, not invented chess truth.")).toBeVisible();
  await expect(page.locator(".pack-card")).not.toHaveCount(0);

  await page.locator(".open-pack").first().click();
  await expect(page.getByText(/Create an account or sign in to keep/u)).toBeVisible();
  await page.getByLabel("Handle").fill(`arrival_${randomUUID().slice(0, 8)}`);
  await page.getByLabel("Password").fill("browser-test-password");
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page).toHaveURL(/\/play\/run\/run-/u);
  await expect(page.getByLabel("Chessboard")).toBeVisible();
});

test("a first learner enters the real rehearsal loop with a persistent event-derived guide", async ({ page }) => {
  const catalogueSkip = page.getByRole("link", { name: "Skip to position catalogue" });
  await catalogueSkip.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#position-catalogue")).toBeFocused();
  await page.getByRole("link", { name: "Home" }).click();
  await expect(page.getByRole("heading", { name: "Do not just learn the move. Rehearse the game it creates." })).toBeFocused();
  await expect(page.getByRole("heading", { name: "How Tabiya works" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Grounded feedback, not invented chess truth." })).toBeVisible();
  await page.getByRole("button", { name: "Start the first rehearsal" }).click();
  await expect(page).toHaveURL(/\/play\/run\/run-/u);
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Make one decision." })).toBeVisible();
  await expect(page.locator(".guide-body").filter({ hasText: "Tabiya does not comment while you are deciding." })).toBeVisible();
  await expect(page.locator(".guide-body").filter({ hasText: "This attempt will stay recorded." })).toBeVisible();
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error("Playwright did not report a viewport");
  await assertRunViewport(page, viewport);

  const runId = page.url().split("/").at(-1)!;
  expect(await page.evaluate(() => localStorage.getItem("tabiya.first-rehearsal.v1.run"))).toBe(runId);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Make one decision." })).toBeVisible();
  await assertRunViewport(page, viewport);
});

test("imports one game, opens a grounded story, re-enters play, and exports original plus branch", async ({ page }) => {
  await page.getByRole("link", { name: "Review" }).click();
  await expect(page.getByText("Comments, engine evaluations and move annotations in the PGN are removed before anything is stored", { exact: false })).toBeVisible();
  await expect(page.getByText("Export the game, not an analysis tree with variations.", { exact: false })).toBeVisible();
  await page.getByLabel("PGN").fill(`[Event "First"]
[Result "*"]

1. e4 *

[Event "Second"]
[Result "*"]

1. d4 *`);
  await page.getByRole("button", { name: "Build game story" }).click();
  await expect(page.getByRole("alert")).toContainText("one game at a time");
  // IMP-a9: the refusal names the repertoire importer that does accept several games.
  await expect(page.getByRole("alert")).toContainText("Import repertoire under Learn › Repertoire gaps");
  await page.getByLabel("PGN").fill(`[Event "Browser import"]
[Site "https://lichess.org/abcd1234"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 1-0`);
  await expect(page.getByLabel("Your side")).toHaveAccessibleDescription(/This PGN names White: Alice and Black: Bob/u);
  await page.getByRole("button", { name: "Build game story" }).click();
  await expect(page).toHaveURL(/\/review\/game\/import-/);
  await expect(page.getByRole("heading", { name: "Alice – Bob" })).toBeVisible();
  await expect(page.getByText("Imported game · review")).toBeVisible();
  // [criterion 1] every ply is a row; the board and evidence panel follow the selected row.
  const moveList = page.getByRole("list", { name: "Move list" });
  await expect(moveList.getByRole("listitem")).toHaveCount(4);
  await expect(moveList.getByRole("button", { name: /^2\. Nf3/u })).toBeVisible();
  await expect(moveList.getByRole("button", { name: /^2… Nc6/u })).toBeVisible();
  // [criterion 6] once the recorded pass completes, the imported game carries full coverage and accuracy renders.
  await expect(page.getByText("Evaluation coverage: 5 of 5 positions on this line carry a recorded engine evaluation.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/^White: \d+\.\d% under grade-convention@1 — 100 minus the mean win-point drop across all 2 of White's evaluated decisions/u)).toBeVisible();
  await expect(page.getByText(/^Sources on this review: Recorded game · Recorded engine analysis/u)).toBeVisible();
  await expect(page.getByRole("region", { name: "Moments" }).or(page.locator("section.moments"))).toContainText("Up to three recorded moments");
  await moveList.getByRole("button", { name: /^1\. e4/u }).click();
  await expect(page.getByText("Position after 1. e4")).toBeVisible();
  await page.getByRole("button", { name: "Next move" }).click();
  await expect(page.getByText("Position after 1… e5")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recorded facts at this move" })).toBeVisible();
  // rfc/review-evidence-compiler.md: the panel renders the typed Review packet through
  // module.review_map@1 as sealed components, the number travelling with its engine and bound.
  await expect(page.locator(".evidence [data-component='magnitude']", { hasText: "after this move" })).toContainText(/^Recorded engine evaluation after this move: [+−]\d+\.\d{2} from White's side \(Mock Stockfish mock-1, 100 ms search\)\.$/u);
  await expect(page.getByText("No per-position review packet", { exact: false })).toHaveCount(0);
  // [criterion 12] no recommendation, PV or praise in the ordinary map.
  await expect(page.locator("main")).not.toContainText(/\bbest\b|principal variation|brilliant|excellent/iu);
  // [criteria 4, 5] Retry is on every row and every moment card; it works from another device (no stored writer id).
  await expect(page.getByRole("button", { name: /^Retry from before move \d+ \(/u })).toHaveCount(4);
  const momentRetries = await page.locator(".moment-card").getByRole("button", { name: /^Retry from this moment/u }).count();
  expect(momentRetries).toBe(await page.locator(".moment-card").count());
  const runId = page.url().split("/").at(-1)!;
  await page.evaluate((id) => localStorage.removeItem(`chess-tabiya:run:${id}:writer-id`), runId);
  const retry = page.getByRole("button", { name: "Retry from before move 2 (Nf3)" });
  await expect(retry).toBeEnabled();
  await retry.click();
  await expect(page).toHaveURL(new RegExp(`/play/run/${runId}$`));
  await expect(page.getByLabel("Chessboard").first()).toBeVisible();
  const forked = await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: { branches: { label: string }[]; nodes: { moveUci: string | null }[] } };
  expect(forked.graph.branches.map((branch) => branch.label)).toContain("story-reentry");
  // Forked before the run opened: the original continuation is still whole.
  expect(forked.graph.nodes.map((node) => node.moveUci)).toEqual(expect.arrayContaining(["e2e4", "e7e5", "g1f3", "b8c6"]));
  // The moment card's Retry re-enters at its own entry node (here the recorded leaf).
  await page.goto(`/review/game/${runId}`);
  await expect(page.getByRole("heading", { name: "Alice – Bob" })).toBeVisible();
  await page.evaluate((id) => localStorage.removeItem(`chess-tabiya:run:${id}:writer-id`), runId);
  await page.locator(".moment-card").last().getByRole("button", { name: /^Retry from this moment/u }).click();
  await expect(page).toHaveURL(new RegExp(`/play/run/${runId}$`));
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  const committedMove = page.waitForResponse((response) => {
    const request = response.request();
    return request.method() === "POST" &&
      new URL(request.url()).pathname === `/runs/${runId}/moves` &&
      response.ok();
  });
  await move(page, "f1", "b5", "white");
  await committedMove;
  const graph = await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: { branches: unknown[]; nodes: { moveUci: string | null }[] } };
  expect(graph.graph.branches.length).toBeGreaterThanOrEqual(2);
  expect(graph.graph.nodes.filter((node) => node.moveUci !== null).length).toBeGreaterThanOrEqual(5);
  // The original continuation survives the retry: the imported line is intact beside the new branch.
  expect(graph.graph.nodes.map((node) => node.moveUci)).toEqual(expect.arrayContaining(["e2e4", "e7e5", "g1f3", "b8c6", "f1b5"]));
  expect(graph.graph.branches.length).toBeGreaterThanOrEqual(3);
  const exported = await page.request.get(`/runs/${runId}/pgn`);
  const text = await exported.text();
  expect(text).toContain('[White "Alice"]');
  expect(text).toContain('[SourceEvent "Browser import"]');
  expect(text).toContain("Tabiya branch");
});

test("review map remainder: eval graph by keyboard, explicit Analyze withheld during a retry, and the Compare handoff", async ({ page }) => {
  await page.getByRole("link", { name: "Review" }).click();
  await page.getByLabel("PGN").fill(`[Event "Remainder import"]
[White "Carol"]
[Black "Dan"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 1-0`);
  await page.getByRole("button", { name: "Build game story" }).click();
  await expect(page).toHaveURL(/\/review\/game\/import-/);
  const runId = page.url().split("/").at(-1)!;
  await expect(page.getByText("Evaluation coverage: 5 of 5 positions on this line carry a recorded engine evaluation.")).toBeVisible({ timeout: 15_000 });

  // §6: one keyboard stop per ply; the evaluations are White-perspective and drawn for the imported side.
  await expect(page.getByRole("heading", { name: "Evaluation graph" })).toBeVisible();
  await expect(page.getByText("4 of 4 moves have a recorded evaluation after them.")).toBeVisible();
  const graph = page.getByRole("group", { name: /^Evaluation graph, one point per move/u });
  const points = graph.getByRole("button");
  await expect(points).toHaveCount(4);
  await expect(points.first()).toHaveAccessibleName("1. e4: +0.00 from White's side, 50.0 win-points for White.");
  await page.getByRole("list", { name: "Move list" }).getByRole("button", { name: /^1\. e4/u }).click();
  await points.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("Position after 1… e5")).toBeVisible();
  await expect(points.nth(1)).toBeFocused();
  await expect(points.nth(1)).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("End");
  await expect(page.getByText("Position after 2… Nc6")).toBeVisible();

  // §7 / O7.3: the ordinary map carries no engine line; Analyze is explicit and attributed.
  const main = page.locator("main");
  await expect(main).not.toContainText(/principal variation|first move of its search|\bbest\b/iu);
  await page.getByRole("list", { name: "Move list" }).getByRole("button", { name: /^2\. Nf3/u }).click();
  await page.getByRole("button", { name: "Analyze the position before move 2 (Nf3): show the recorded engine line" }).click();
  // The Review pass recorded each position's bounded line (stockfish.principal_variation@1) beside its
  // evaluation; the explicit reveal shows it attributed to the engine and its search bound, never as advice.
  await expect(page.locator(".analysis-sentence")).toHaveText(/^Mock Stockfish mock-1 \(\d+ ms search\) reported this principal variation from the position before 2\. Nf3: 2\. \S+ \S+\.$/u);
  await expect(page.getByText("It is not advice", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Hide engine line" }).click();
  await expect(page.locator(".analysis-sentence")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Compare lines from here/u })).toHaveCount(0);

  // Retry from before 2. Nf3 and play a different move: a second line now leaves the game there.
  await page.getByRole("button", { name: "Retry from before move 2 (Nf3)" }).click();
  await expect(page).toHaveURL(new RegExp(`/play/run/${runId}$`));
  await expect(page.getByLabel("Chessboard").first()).toBeVisible();
  // Commit the retry's move as this device's writer (the board path is covered by the import journey).
  const writer = await page.evaluate((id) => localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
  expect(writer).not.toBeNull();
  const played = await page.request.post(`/runs/${runId}/moves`, { headers: { "x-writer-id": writer! }, data: { uci: "f1c4" } });
  expect(played.ok(), await played.text()).toBe(true);

  await page.goto(`/review/game/${runId}`);
  await expect(page.getByRole("heading", { name: "Carol – Dan" })).toBeVisible();
  // The retry is still the open line: its position's engine line stays hidden; others do not.
  await page.getByRole("list", { name: "Move list" }).getByRole("button", { name: /^2\. Nf3/u }).click();
  await expect(page.getByText("The engine line for the position before 2. Nf3 stays hidden while a retry from that position is open.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Analyze the position before move 2 \(Nf3\)/u })).toHaveCount(0);
  await page.getByRole("list", { name: "Move list" }).getByRole("button", { name: /^1… e5/u }).click();
  await expect(page.getByRole("button", { name: /^Analyze the position before move 1 \(e5\)/u })).toBeVisible();

  // §4: the Compare handoff opens the shipped N-way compare on the reviewed line and the retry.
  const handoff = page.getByRole("button", { name: "Compare the reviewed line and 1 more from before move 2 (Nf3)" });
  await expect(handoff).toHaveCount(1);
  await handoff.click();
  await expect(page).toHaveURL(new RegExp(`/play/run/${runId}$`));
  await expect(page.getByRole("heading", { name: "Same decision, two consequences." })).toBeVisible();
  const graphAfter = await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: { nodes: { moveUci: string | null }[] } };
  expect(graphAfter.graph.nodes.map((node) => node.moveUci)).toEqual(expect.arrayContaining(["e2e4", "e7e5", "g1f3", "b8c6", "f1c4"]));
});

test("account lifecycle downloads data, deletes one run, and clears this browser on account deletion", async ({ page }) => {
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  const runId = page.url().split("/").at(-1)!;
  await page.evaluate((id) => {
    localStorage.setItem(`chess-tabiya:run:${id}:writer-id`, "writer-secret");
    localStorage.setItem(`tabiya:mark-scope:${id}`, "branch");
    localStorage.setItem("tabiya.assistance.v1.position", "device-preference");
    localStorage.setItem("tabiya.workflow.v1.position", "device-workflow");
  }, runId);

  await page.goto("/library");
  await expect(page.getByText("Shared runs may remain as read-only history", { exact: false })).toBeVisible();
  const pgnDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download PGN" }).click();
  const pgnDownload = await pgnDownloadPromise;
  expect(pgnDownload.suggestedFilename()).toMatch(/\.pgn$/u);
  await page.getByRole("button", { name: "Delete this run" }).click();
  await expect(page.getByRole("heading", { name: /Delete .*\?/u })).toBeVisible();
  await expect(page.getByText("permanently deleted", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Confirm deletion" }).click();
  await expect(page.getByRole("button", { name: "Delete this run" })).toHaveCount(0);
  await expect.poll(async () => (await page.request.get(`/runs/${runId}/graph`)).status()).toBe(404);
  expect(await page.evaluate((id) => [
    localStorage.getItem(`chess-tabiya:run:${id}:writer-id`),
    localStorage.getItem(`tabiya:mark-scope:${id}`),
  ], runId)).toEqual([null, null]);

  await page.goto("/settings");
  await expect(page.getByText("other chess products do not read it", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "download them as PGN" })).toHaveAttribute("href", "/library");
  await page.getByLabel("Current password").fill("browser-test-password");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my data", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^tabiya-account-[a-z0-9_]+\.json$/u);
  await expect(page.getByRole("status").filter({ hasText: "download has started" })).toBeVisible();
  await expect(page.getByLabel("Current password")).toHaveValue("");

  await expect(page.getByRole("heading", { name: "Your data and privacy" })).toBeVisible();
  // IMP-a12/a14: exactly one standing inventory (the server one), naming abandoned and voided games.
  await expect(page.getByRole("heading", { name: "What Tabiya has recorded" })).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "What Tabiya has recorded" })).toBeVisible();
  await expect(page.locator('[data-data-class="behavioral_profiles"]')).toContainText("abandoned and voided games");
  await expect(page.locator(".deletion-preview")).toBeVisible();
  await expect(page.getByRole("button", { name: "Refresh data summary" })).toBeVisible();
  await expect(page.getByText("Live data is removed immediately", { exact: false })).toBeVisible();
  await page.getByLabel("Re-enter password").fill("browser-test-password");
  await page.getByRole("button", { name: "Delete account" }).click();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("tabiya") || key.startsWith("chess-tabiya:")))).toEqual([]);
});

test("Just Play reaches a Carlsbad and opens a guided shape marker without mutating the run", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("tabiya.assistance.v1.position", JSON.stringify({ version: 4, markers: "off", guided: "live", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" })));
  await page.getByLabel("Your side").selectOption("black");
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill("r1bqr1k1/pppnbppp/5n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByRole("button", { name: /Carlsbad structure/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /Nothing is authored about this position/ })).toBeVisible();

  await move(page, "c7", "c6", "black");
  const marker = page.getByRole("button", { name: /Carlsbad structure/ });
  await expect(marker).toBeVisible();
  const runId = page.url().split("/").at(-1)!;
  const before = await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json() as { events: unknown[] };
  await page.getByRole("button", { name: "Inspector" }).click();
  const transitionButton = page.getByRole("button", { name: "Move transition" });
  await expect(transitionButton).toHaveAttribute("aria-expanded", "false");
  await transitionButton.click();
  await expect(transitionButton).toHaveAttribute("aria-expanded", "true");
  const transitionRegion = page.getByRole("region", { name: "Evidence inspector: move transition" });
  await expect(transitionRegion.locator('.transition-facts [data-presented="fact_statement"]')).not.toHaveCount(0);
  await expect(transitionRegion).toContainText(/geometric count|fifty-move count/);
  await transitionButton.click();
  await expect(transitionButton).toHaveAttribute("aria-expanded", "false");
  await page.getByRole("button", { name: "Return to play" }).click();
  await marker.focus();
  await marker.click();
  const panel = page.getByRole("dialog", { name: "Carlsbad structure" });
  await expect(panel).toContainText("Named plans for this structure — general to the kind of position, not advice for this one.");
  await expect(panel).not.toContainText("shape trigger");
  for (const label of ["Minority attack", "Achieve e3-e4", "Land h4-h5 against a hook", "Reach a queenless position with the c-pawn sound", "Get the pawn to a5 with b4 still empty", "Central counter-break"]) await expect(panel.getByText(label, { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Carlsbad structure" })).toBeFocused();
  await page.setViewportSize({ width: 320, height: 256 });
  const shapeBounds = await panel.boundingBox();
  if (shapeBounds === null) throw new TypeError("Named-structure dialog has no rendered bounds");
  expect(shapeBounds.x).toBeGreaterThanOrEqual(0);
  expect(shapeBounds.y).toBeGreaterThanOrEqual(0);
  expect(shapeBounds.x + shapeBounds.width).toBeLessThanOrEqual(320);
  expect(shapeBounds.y + shapeBounds.height).toBeLessThanOrEqual(256);
  expect(await panel.evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(marker).toBeFocused();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await marker.click();
  await panel.getByRole("button", { name: "Inspect trigger and sources" }).click();
  await expect(page.getByRole("region", { name: "Named structure evidence" })).toContainText("CC-BY-SA-4.0");
  await page.getByRole("button", { name: "Return to play" }).click();
  const after = await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json() as { events: unknown[] };
  expect(after.events).toHaveLength(before.events.length);
  await expect(page.getByText("Commentary opens at a checkpoint", { exact: true })).toHaveCount(0);
});

test("Just Play states its selected human-model rung and low-material limit", async ({ page }) => {
  await page.goto("/play");
  await chooseRawRung(page, "Testing");
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill("8/8/8/8/8/4k3/6P1/4K3 w - - 0 1");
  await page.getByRole("button", { name: "Start and keep the game" }).click();

  const support = page.getByRole("region", { name: "Support" });
  await expect(support).toContainText("Resistance requested: Human-model replies · rung 1800.");
  await expect(support).toContainText("They are not FIDE, Lichess, or Chess.com ratings.");
  await expect(support).toContainText("With ten pieces or fewer, changing the Maia rung has very little effect");
  await expect(page.locator("[data-status-announcement]")).toContainText("Human-like opponent · rung 1800");
});

test("the private profile opens from Rating and Learn, abstains below each floor and drills into the counted game (rfc/player-style.md)", async ({ page }) => {
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await clickMove(page, "g2", "g3");
  await expect(page.locator("[data-status-announcement]")).not.toContainText("Thinking", { timeout: 15_000 });
  const runId = page.url().split("/").at(-1)!;

  await page.goto("/learn");
  const primary = page.getByRole("navigation", { name: "Primary navigation" });
  await primary.getByRole("link", { name: "Rating" }).click();
  await page.getByRole("link", { name: /Your profile/ }).click();
  await expect(page).toHaveURL(/\/profile$/u);
  await expect(page.getByRole("heading", { name: "What your recorded games show" })).toBeVisible();
  await expect(primary.getByRole("link", { name: "Rating" })).toHaveAttribute("aria-current", "page");

  // The worker counts the run off the request path; the profile says so until it has.
  await expect(async () => {
    if (await page.getByRole("button", { name: "Check again" }).isVisible()) await page.getByRole("button", { name: "Check again" }).click();
    await expect(page.getByRole("region", { name: "What is counted" })).toContainText("Your 1 saved run is counted.", { timeout: 1_000 });
  }).toPass({ timeout: 30_000 });

  const fianchetto = page.getByRole("article", { name: "Fianchetto setup reached" });
  await expect(fianchetto).toContainText("This card's floor is 25 games; 1 measured.");
  await expect(fianchetto).not.toContainText(/\d+ of \d+ measured games/u);
  await expect(page.getByRole("article", { name: "Time used per opening move" })).toContainText("rfc/recorded-clocks.md Discharge D4");
  await expect(page.getByRole("article", { name: "How common your first eight plies are" })).toContainText("This card cannot be measured yet.");
  const skills = page.getByRole("region", { name: "Skills" });
  for (const category of ["Fundamentals", "Openings", "Tactics", "Strategy", "Endgame"]) await expect(skills.getByRole("heading", { name: category, exact: true })).toBeVisible();
  await expect(skills).not.toContainText(/%|\d+\s*\/\s*\d+/u);
  await expect(page.getByRole("region", { name: "Privacy" })).toContainText("This profile is private.");
  const scan = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(scan.violations, JSON.stringify(scan.violations, null, 2)).toEqual([]);

  await fianchetto.getByRole("button", { name: "Show the games counted so far" }).click();
  await expect(fianchetto.getByRole("list", { name: "Fianchetto setup reached: contributing moves" })).toContainText("g3");  await fianchetto.getByRole("button", { name: "Open game review" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/review/game/${runId}$`, "u"));

  await primary.getByRole("link", { name: "Learn" }).click();
  await page.getByRole("link", { name: /Your profile/ }).click();
  await expect(page.getByRole("heading", { name: "What your recorded games show" })).toBeVisible();
});

test("choosing a help style activates its modules through the server compiler and persists (rfc/intent-presets.md)", async ({ page }) => {
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  const footer = page.getByLabel("Active support promise");
  await expect(footer).toContainText("no chess guidance appears unless you ask");
  await expect(page.getByRole("button", { name: "Open assistance" })).toHaveCount(0);
  const calm = await page.getByLabel("Chessboard").boundingBox();

  const compiled = page.waitForResponse((response) => response.url().endsWith("/assistance") && response.request().method() === "POST");
  await page.locator("details.assistance-control summary").click();
  await expect(page.locator(".preset-options input[type=radio]")).toHaveCount(5);
  await page.getByRole("radio", { name: /Guide me/u }).check();
  const body = await (await compiled).json() as { assistance: { stage: string; preset: string; modules: string[] } };
  expect(body.assistance).toMatchObject({ stage: "finalized", preset: "guided" });
  expect(body.assistance.modules).toEqual(expect.arrayContaining(["postcommit_nudge", "structure_nudge", "guided_hint"]));
  await expect(page.locator("details.assistance-control summary")).toHaveAttribute("aria-label", "Support style: Guide me");
  await expect(footer).toContainText("After you commit, a small consequence nudge");
  await expect(page.getByRole("button", { name: "Open assistance" })).toBeVisible();
  expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("tabiya.workflow.v2.position") ?? "null"))).toEqual({ version: 2, assistanceHead: 4, intent: { kind: "explicit", preset: "guided", overrides: {}, moduleOverrides: { include: [], exclude: [] } } });

  // The primitives stay reachable: Advanced still edits every raw switch, and going above the preset is Custom.
  await openAdvancedSupport(page);
  await expect(page.getByLabel("Board lighting")).toHaveValue("sight");
  await page.getByLabel("Board lighting").selectOption("evidence");
  await page.getByRole("button", { name: "Return to play" }).click();
  await expect(page.locator(".preset-pill")).toHaveText("Custom");

  await page.reload();
  await expect(page.locator(".preset-pill")).toHaveText("Custom");
  await page.locator("details.assistance-control summary").click();
  await page.getByRole("radio", { name: /Quiet/u }).check();
  await expect(footer).toContainText("no chess guidance appears unless you ask");
  await expect(page.getByRole("button", { name: "Open assistance" })).toHaveCount(0);
});

test("Just Play explicitly reveals evidence and the next move closes the window", async ({ page }) => {
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.locator("details.assistance-control summary")).toHaveAttribute("aria-label", "Support style: Quiet");
  await expect(page.getByLabel("Active support promise")).toContainText("no chess guidance appears unless you ask");
  const reveal = page.getByRole("button", { name: "Show support for this position" });
  await expect(reveal).toBeEnabled();
  await page.getByRole("button", { name: "Inspector" }).click();
  await expect(page.getByRole("button", { name: "Load model candidates" })).toHaveCount(0);
  await page.getByRole("button", { name: "Return to play" }).click();

  await reveal.click();
  await expect(reveal).toBeDisabled();
  await expect(page.getByText("Support is available for this position until you commit your next move.")).toBeVisible();
  await page.getByRole("button", { name: "Inspector" }).click();
  await expect(page.getByRole("button", { name: "Load model candidates" })).toBeVisible();
  await page.getByRole("button", { name: "Return to play" }).click();
  const runId = page.url().split("/").at(-1)!;
  const opened = await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json() as { events: { type: string }[] };
  expect(opened.events.filter((event) => event.type === "feedback.revealed")).toHaveLength(1);

  await move(page, "e2", "e4", "white");
  await expect(reveal).toBeEnabled();
  await expect(page.getByText("Support is available for this position until you commit your next move.")).toHaveCount(0);
  await page.getByRole("button", { name: "Inspector" }).click();
  await expect(page.getByRole("button", { name: "Load model candidates" })).toHaveCount(0);
});

test("Support calculation follows its admitted job through polling and becomes usable again after each exact result", async ({ page }) => {
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await page.getByRole("button", { name: "Show support for this position" }).click();
  await showSupport(page);
  let holdResults = true;
  await page.route(/\/runs\/[^/]+\/evidence\?sinceSeq=\d+$/u, async route => {
    if (!holdResults) { await route.continue(); return; }
    // A real admitted-but-not-yet-delivered interval. Do not advance the cursor or fake failure.
    const sinceSeq = Number(new URL(route.request().url()).searchParams.get("sinceSeq"));
    await route.fulfill({ status: 200, contentType: "application/json", json: { results: [], nextSeq: sinceSeq } });
  });
  const region = page.locator(".analysis-request");
  const receipts: { batchId: string; jobs: { id: string; nodeId: string; kind: string }[] }[] = [];
  for (let requestNo = 0; requestNo < 2; requestNo += 1) {
    holdResults = true;
    const response = page.waitForResponse(response => response.request().method() === "POST" && response.url().endsWith("/analysis"));
    await region.getByRole("button", { name: "Calculate this position", exact: true }).click();
    const admitted = await response;
    expect(admitted.status()).toBe(202);
    receipts.push(await admitted.json());
    await expect(region.getByRole("button", { name: "Preparing calculation…", exact: true })).toBeDisabled();
    await expect(region).toContainText("The calculation is being prepared for this position.");
    // On the second request an old calculation already exists; it must not discharge the new job.
    if (requestNo === 1) await expect(region).toContainText("A recorded calculation is available for this position.");
    holdResults = false;
    await expect(region.getByRole("button", { name: "Calculate this position", exact: true })).toBeEnabled({ timeout: 10_000 });
    await expect(region).toContainText("A recorded calculation is available for this position.");
  }
  expect(receipts[0]!.batchId).not.toBe(receipts[1]!.batchId);
  expect(receipts[0]!.jobs[0]!.id).not.toBe(receipts[1]!.jobs[0]!.id);
  const runId = page.url().split("/").at(-1)!;
  const history = await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json() as { events: { type: string; data: { nodeId?: string; evidenceRefs?: string[] } }[] };
  for (const receipt of receipts) for (const job of receipt.jobs) {
    expect(job.kind).toBe("bestline");
    expect(history.events.filter(event => event.type === "evidence.attached" && event.data.nodeId === job.nodeId && event.data.evidenceRefs?.includes(`engine:${job.id}`))).toHaveLength(1);
  }
});

test("Support calculation replays a lost admission response without creating another calculation", async ({ page }) => {
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await page.getByRole("button", { name: "Show support for this position" }).click();
  await showSupport(page);
  const admissions: { batchId: string; jobs: { id: string; nodeId: string; kind: string }[] }[] = [];
  const keys: string[] = [];
  await page.route(/\/runs\/[^/]+\/analysis$/u, async route => {
    const response = await route.fetch(); // The production server commits before response loss.
    expect(response.status()).toBe(202);
    admissions.push(await response.json());
    keys.push(route.request().headers()["idempotency-key"]!);
    if (admissions.length === 1) { await route.abort("failed"); return; }
    await route.fulfill({ response });
  });
  const region = page.locator(".analysis-request");
  await region.getByRole("button", { name: "Calculate this position", exact: true }).click();
  await expect(region).toContainText("Couldn't confirm the calculation. Try again.");
  await expect(region.getByRole("button", { name: "Calculate this position", exact: true })).toBeEnabled();
  await region.getByRole("button", { name: "Calculate this position", exact: true }).click();
  await expect(region).toContainText("A recorded calculation is available for this position.", { timeout: 10_000 });
  await expect(region.getByRole("button", { name: "Calculate this position", exact: true })).toBeEnabled();
  expect(admissions).toHaveLength(2);
  expect(admissions[1]).toEqual(admissions[0]);
  expect(keys[1]).toBe(keys[0]);
  await region.getByRole("button", { name: "Calculate this position", exact: true }).click();
  await expect.poll(() => admissions.length).toBe(3);
  await expect(region.getByRole("button", { name: "Calculate this position", exact: true })).toBeEnabled({ timeout: 10_000 });
  expect(keys[2]).not.toBe(keys[0]);
  expect(admissions[2]!.batchId).not.toBe(admissions[0]!.batchId);
  const runId = page.url().split("/").at(-1)!;
  const history = await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json() as { events: { type: string; data: { nodeId?: string; evidenceRefs?: string[] } }[] };
  for (const receipt of [admissions[0]!, admissions[2]!]) for (const job of receipt.jobs) {
    expect(history.events.filter(event => event.type === "evidence.attached" && event.data.nodeId === job.nodeId && event.data.evidenceRefs?.includes(`engine:${job.id}`))).toHaveLength(1);
  }
});

test("Guide me: a learner-requested hint climbs one rung per press to the proposed ceiling and resets on commit (rfc/hint-distance.md)", async ({ page }) => {
  // The labelled mock engine searches the alphabetically first legal move: Na4-b2 double-attacks both rooks.
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill("k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  const seat = page.getByRole("region", { name: "Ask for the least that helps" });
  // Quiet carries no guided_hint: no seat, and nothing is ever requested proactively.
  await expect(seat).toHaveCount(0);
  const hintPosts: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST" && request.url().endsWith("/hints")) hintPosts.push(String((request.postDataJSON() as { rung: string }).rung)); });

  await page.locator("details.assistance-control summary").click();
  await page.getByRole("radio", { name: /Guide me/u }).check();
  await expect(page.locator("details.assistance-control summary")).toHaveAttribute("aria-label", "Support style: Guide me");
  if (await page.locator("details.assistance-control").evaluate((element) => (element as HTMLDetailsElement).open)) await page.locator("details.assistance-control summary").click();
  await expect(seat).toBeVisible();
  expect(hintPosts).toEqual([]);

  // The hint waits for the open disclosure boundary; the refusal is policy, not an empty hint.
  await seat.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(seat).toContainText("Hints open once support is shown for this position.");
  await page.getByRole("button", { name: "Show support for this position" }).click();
  await expect(page.getByText("Support is available for this position until you commit your next move.")).toBeVisible();

  await seat.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(seat).toContainText("finds a double attack for you.");
  await expect(seat).not.toContainText("d1");
  await seat.getByRole("button", { name: "A little more" }).click();
  await expect(seat).toContainText("It involves d1 and d3.");
  await seat.getByRole("button", { name: "A little more" }).click();
  await expect(seat).toContainText("The piece involved is your knight on a4.");
  await seat.getByRole("button", { name: "A little more" }).click();
  await expect(seat).toContainText("It appears after this move.");
  // D1639's proposed Guide me ceiling is `distance`: the move is never revealed here.
  await expect(seat.getByRole("button", { name: "A little more" })).toBeDisabled();
  await expect(seat).toContainText("That is as far as this help style goes here.");
  await expect(seat).not.toContainText("Nb2");
  expect(hintPosts).toEqual(["pattern", "pattern", "square", "piece", "distance"]);
  const scan = await new AxeBuilder({ page }).include("#run-support-region").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(scan.violations, JSON.stringify(scan.violations, null, 2)).toEqual([]);

  // Committing a move is a new decision: the ladder resets and the marks clear.
  await move(page, "h7", "g6");
  await expect(seat.getByRole("button", { name: "Hint", exact: true })).toBeVisible();
  await expect(seat).not.toContainText("finds a double attack");
});

for (const failure of ["server_failed", "poll_transport"] as const) {
test(`Guided Hint retries ${failure} explicitly without changing its decision or rung`, async ({ page }) => {
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill("k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await page.locator("details.assistance-control summary").click();
  await page.getByRole("radio", { name: /Guide me/u }).check();
  if (await page.locator("details.assistance-control").evaluate(element => (element as HTMLDetailsElement).open)) await page.locator("details.assistance-control summary").click();
  await page.getByRole("button", { name: "Show support for this position" }).click();
  const seat = page.getByRole("region", { name: "Ask for the least that helps" });
  const posts: unknown[] = [];
  const trace: string[] = [];
  let failedId: string | undefined;
  let pollFailed = false;
  page.on("request", request => {
    if (request.method() === "DELETE" && /\/hints\/[a-f0-9]{32}$/u.test(request.url())) trace.push("DELETE");
  });
  if (failure === "poll_transport") await page.route("**/runs/*/hints/*", async route => {
    if (route.request().method() !== "GET" || pollFailed) { await route.continue(); return; }
    pollFailed = true;
    await route.fulfill({ status: 500, json: { error: { code: "POLL_FAILED", message: "transport failure" } } });
  });
  await page.route("**/runs/*/hints", async route => {
    if (route.request().method() !== "POST") { await route.continue(); return; }
    trace.push("POST");
    posts.push(route.request().postDataJSON());
    if (posts.length > 1) { await route.continue(); return; }
    // Simulate the typed failed transport reply using a real server-issued operation identity.
    // Retry then traverses the actual DELETE and fresh production POST, not a mocked success.
    const response = await route.fetch();
    const body = await response.json() as { hint: { state: string; requestId?: string; delivery?: { requestId: string } } };
    failedId = body.hint.requestId ?? body.hint.delivery?.requestId;
    expect(failedId).toMatch(/^[a-f0-9]{32}$/u);
    await route.fulfill({ response, json: { hint: failure === "server_failed"
      ? { state: "failed", requestId: failedId, rung: "pattern", reason: "internal_error" }
      : { state: "pending", requestId: failedId, rung: "pattern" } } });
  });
  await seat.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(seat).toContainText(failure === "server_failed" ? "The hint could not be prepared. Try again." : "The hint request could not be completed. Try again.");
  expect(trace).toEqual(["POST"]);
  await expect(seat.locator(".hint-sentence")).toHaveCount(0);
  await seat.getByRole("button", { name: "Hint", exact: true }).click();
  await expect(seat).toContainText("finds a double attack for you.");
  expect(trace).toEqual(["POST", "DELETE", "POST"]);
  expect(posts[1]).toEqual(posts[0]);
  await expect(seat.getByRole("button", { name: "A little more" })).toBeVisible();
  await expect(seat).not.toContainText("Nb2");
});
}

test("imports a repertoire, enters its biggest corpus gap, and records an addressed attempt",async({page})=>{
  await page.goto("/learn");
  await page.getByRole("heading",{name:"Repertoire gaps"}).scrollIntoViewIfNeeded();
  await page.getByLabel("Name").fill("Browser black repertoire");
  await page.getByLabel("Your side").selectOption("black");
  await page.getByLabel("Opponent rating band").fill("1800");
  await page.getByLabel("Cover replies seen at least once in").fill("10");
  await page.getByLabel("Repertoire PGN").fill("1. d4 d5 *");
  await page.getByRole("button",{name:"Import repertoire"}).click();
  const card=page.getByRole("article").filter({hasText:"Browser black repertoire"});
  await expect(card).toContainText("1800 band · cover replies seen at least 1 in 10 games");
  await card.getByRole("button",{name:"Scan gaps"}).click();
  await expect(card.getByText("These counts say what this population played, not what is good.")).toBeVisible();
  await expect(card.getByText(/About \d+\.\d% of games contain replies above your 1-in-10 bound/)).toBeVisible();
  await expect(card.getByText(/e4 · about 1 in 2 games · No rehearsal yet/)).toBeVisible();
  await card.getByRole("button",{name:"Enter with human-like resistance"}).click();
  await expect(page).toHaveURL(/\/play\/run\/gap-/);await expect(page.getByLabel("Chessboard")).toBeVisible();
  await move(page,"c7","c5","black");
  await page.getByRole("button", { name: "Tabiya" }).click();
  await page.getByRole("link", { name: "Learn" }).click();
  const refreshed=page.getByRole("article").filter({hasText:"Browser black repertoire"});
  await expect(refreshed.getByText(/e4 · about 1 in 2 games · Rehearsal played — choose your answer/)).toBeVisible({timeout:5_000});
  await expect(refreshed.getByRole("button",{name:"Open existing gap run"})).toBeVisible();
  await refreshed.getByRole("button",{name:"Use c5 as my repertoire answer"}).click();
  await expect(refreshed.getByText(/e4 · about 1 in 2 games · Repertoire answer chosen/)).toBeVisible();
  await expect(refreshed.getByText("Current repertoire answer: c5")).toBeVisible();
  await expect(refreshed.getByText("These results predate your latest repertoire change.",{exact:false})).toBeVisible();
  await refreshed.getByRole("button",{name:"Rescan"}).click();
  await expect(refreshed.getByText("These results predate your latest repertoire change.",{exact:false})).toHaveCount(0);
  await expect(refreshed.getByText(/e4 · about 1 in 2 games/)).toHaveCount(0);
  await refreshed.getByRole("button",{name:"Delete repertoire"}).click();
  await expect(refreshed.getByLabel("Delete Browser black repertoire")).toContainText("Rehearsal runs already created from gaps stay in your saved run history");
  await refreshed.getByRole("button",{name:"Confirm deletion"}).click();
  await expect(page.getByRole("article").filter({hasText:"Browser black repertoire"})).toHaveCount(0);
});

test("adaptive guidance keeps a queen-exchange phase change passive and removable", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __spoken: string[] }).__spoken = [];
    class Utterance { text: string; constructor(text: string) { this.text = text; } }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Utterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [{}], cancel() {}, speak(value: { text: string }) { (window as unknown as { __spoken: string[] }).__spoken.push(value.text); } } });
  });
  await page.reload();
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill("3qk2r/5p2/2b2n2/8/8/8/8/3QK3 w - - 0 1");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByRole("region", { name: "Phase reading" })).toContainText("Middlegame");
  await expect(page.getByText("Detected by Tabiya's phase bands: middlegame.")).toHaveCount(0);

  await openAdvancedSupport(page);
  await page.getByLabel("Passive markers").check();
  await page.getByLabel("Spoken guidance").selectOption("browser");
  await page.getByRole("button", { name: "Return to play" }).click();
  await expect(page.getByRole("dialog", { name: /Review/ })).toHaveCount(0);

  await move(page, "d1", "d8");
  const marker = page.getByRole("button", { name: "Open Irreversible change and Phase transition at rehearsal step 1" });
  await expect(marker).toBeVisible();
  await expect(page.getByRole("dialog", { name: /Review/ })).toHaveCount(0);

  await marker.click();
  const guidance = page.getByRole("dialog", { name: /Review/ });
  await expect(guidance).toContainText("This move changed something concrete");
  await expect(guidance).not.toContainText("phase bands");
  await expect(guidance).not.toContainText("material-census convention");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).toEqual([]);
  const rendered = await guidance.innerText();
  expect(rendered).toContain("Qxd8+");
  expect(rendered).not.toMatch(/\b[a-h][1-8][a-h][1-8][qrbn]?\b/u);
  expect(rendered).not.toMatch(/\b(?:weak|strong|good|bad|better|worse|advantage|winning|losing|should|must|best|worst|mistake|blunder|punish|wins|loses)\b/iu);

  await guidance.getByRole("button", { name: "Open in Inspector" }).click();
  const momentEvidence = page.getByRole("region", { name: "Recorded moment evidence" });
  await expect(momentEvidence).toContainText("middlegame → endgame, detected by Tabiya's phase bands.");
  await expect(momentEvidence).toContainText("material-census convention");
  await page.getByLabel("Passive markers").uncheck();
  await page.getByRole("button", { name: "Return to play" }).click();
  await expect(page.getByRole("button", { name: /Open (?:Irreversible change|Phase transition)/ })).toHaveCount(0);
});

for (const subject of [
  { name: "rook moment", fen: "4k2r/4p3/8/8/8/8/4R3/4K3 w - - 0 1", moves: "1. Rxe7+ Kxe7 *", moment: "Rook ending under Tabiya's material-census convention.", current: "Endgame; the material is outside Tabiya's material-census convention." },
  { name: "unclassified moment", fen: "4k3/4q3/8/8/8/8/P3Q3/4K3 w - - 0 1", moves: "1. Qxe7+ Kxe7 *", moment: "Endgame; the material is outside Tabiya's material-census convention.", current: "Pawn ending under Tabiya's material-census convention." },
  { name: "non-endgame moment", fen: "4k2r/4q3/8/8/8/8/4Q3/R3K3 w - - 0 1", moves: "1. Qxe7+ Kxe7 *", moment: null, current: "Rook ending under Tabiya's material-census convention." },
]) {
  test(`historical moment keeps its own endgame subject: ${subject.name}`, async ({ page }) => {
    await page.goto("/review");
    await page.getByLabel("PGN").fill(`[Event "Inspector subject"]\n[White "Alice"]\n[Black "Bob"]\n[Result "*"]\n[SetUp "1"]\n[FEN "${subject.fen}"]\n\n${subject.moves}`);
    await page.getByRole("button", { name: "Build game story" }).click();
    await expect(page).toHaveURL(/\/review\/game\/import-/);
    const runId = page.url().split("/").at(-1)!;
    await page.goto(`/play/run/${runId}`);
    await expect(page.getByLabel("Chessboard")).toBeVisible();
    const boardBefore = await page.getByLabel("Chessboard").boundingBox();
    await openAdvancedSupport(page);
    await page.getByLabel("Passive markers").check();
    await page.getByRole("button", { name: "Return to play" }).click();
    const marker = page.getByRole("button", { name: /Open .* at rehearsal step 1$/u });
    await marker.click();
    await page.getByRole("dialog", { name: /Review/ }).getByRole("button", { name: "Open in Inspector" }).click();
    const historical = page.getByRole("region", { name: "Recorded moment evidence" });
    const current = page.getByRole("region", { name: "Current-position endgame evidence" });
    await expect(current).toContainText(subject.current);
    await expect(historical).not.toContainText(subject.current);
    if (subject.moment === null) await expect(historical).not.toContainText("material-census convention");
    else await expect(historical).toContainText(subject.moment);
    await expect(page.getByLabel("Chessboard")).toHaveCount(1);
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(boardBefore);
    await page.getByRole("button", { name: "Return to play" }).click();
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(boardBefore);
    const graph = await (await page.request.get(`/runs/${runId}/graph`)).json();
    expect(graph.graph.nodes.map((node: { moveUci: string | null }) => node.moveUci).filter(Boolean)).toEqual(["e2e7", "e8e7"]);
  });
}

test("previewed position keeps its own attached evidence", async ({ page }) => {
  await page.goto("/review");
  await page.getByLabel("PGN").fill(`[Event "Inspector attachment subject"]\n[White "Alice"]\n[Black "Bob"]\n[Result "*"]\n[SetUp "1"]\n[FEN "4k2r/4p3/8/8/8/8/4R3/4K3 w - - 0 1"]\n\n1. Rxe7+ Kxe7 *`);
  await page.getByRole("button", { name: "Build game story" }).click();
  await expect(page).toHaveURL(/\/review\/game\/import-/);
  await expect(page.getByText("Evaluation coverage: 3 of 3 positions on this line carry a recorded engine evaluation.")).toBeVisible({ timeout: 15_000 });
  const runId = page.url().split("/").at(-1)!;
  await page.goto(`/play/run/${runId}`);
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await showSupport(page);
  // Request an actual bounded line at the active position. The labelled mock's
  // evaluations are all zero, so equal evaluation text alone cannot prove identity.
  const calculation = page.locator(".analysis-request");
  await calculation.getByRole("button", { name: "Calculate this position", exact: true }).click();
  await expect(calculation.getByRole("button", { name: "Calculate this position", exact: true })).toBeEnabled({ timeout: 10_000 });
  await expect(calculation).toContainText("A recorded calculation is available for this position.", { timeout: 10_000 });
  const before = (await (await page.request.get(`/runs/${runId}/graph`)).json()).graph as RunGraph;
  const history = (await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json()).events as {
    type: string; data: { nodeId: string; evidenceRefs: string[]; payload: { kind: string; values: { movesUci: string[] } } };
  }[];
  const historical = before.nodes.find(node => node.moveUci === "e2e7")!;
  const recordedLine = history.find(event => event.type === "evidence.attached" && event.data.nodeId === before.activeCursor.nodeId && event.data.payload.kind === "bestline")!;
  expect(recordedLine).toBeDefined();
  expect(historical.evidenceRefs).not.toEqual(expect.arrayContaining(recordedLine.data.evidenceRefs));
  const lineText = `Recorded engine line: ${recordedLine.data.payload.values.movesUci.join(" ")}`;
  const attachments = page.getByRole("region", { name: "Evidence attached to this position" });
  const boardBefore = await page.getByLabel("Chessboard").boundingBox();
  await page.getByRole("button", { name: "Inspector", exact: true }).click();
  await expect(attachments).toContainText(lineText);
  await page.getByRole("button", { name: "Return to play" }).click();
  const preview = page.locator(`[data-timeline-node="${historical.id}"]`);
  await preview.click();
  await expect(page.locator(".preview-label")).toHaveText("Preview");
  await page.getByRole("button", { name: "Inspector", exact: true }).click();
  await expect(attachments).toContainText("Recorded engine evaluation:");
  await expect(attachments).not.toContainText("Recorded engine line:");
  await page.getByRole("button", { name: "Return to play" }).click();
  await preview.click();
  await expect(page.locator(".preview-label")).toHaveCount(0);
  await page.getByRole("button", { name: "Inspector", exact: true }).click();
  await expect(attachments).toContainText(lineText);
  await page.getByRole("button", { name: "Return to play" }).click();
  expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(boardBefore);
  const after = (await (await page.request.get(`/runs/${runId}/graph`)).json()).graph;
  expect(after.activeCursor).toEqual(before.activeCursor);
  expect(after.nodes).toEqual(before.nodes);
});

test("endgame evidence is inspectable without a pivotal marker", async ({ page }) => {
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill("4k2r/8/8/8/8/8/RP6/4K3 w - - 0 1");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByRole("button", { name: /Open pivotal marker/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Inspector" }).click();
  const evidence = page.getByRole("region", { name: "Current-position endgame evidence" });
  await expect(evidence).toContainText("Rook and pawn versus rook");
  // theory.endgame.setup_match@1: this KRPKR position (pawn b2, kings e1/e8) fails every operand
  // intersection of lucena-setup@1, philidor-third-rank-setup@1 and vancura-setup@1, so the line
  // stays at the material class and names no technique.
  await expect(evidence).not.toContainText("Lucena");
  await expect(evidence).not.toContainText("Philidor");
  await expect(evidence).not.toContainText("Vančura");
  await expect(evidence).not.toContainText("setup under convention");
});

test("endgame evidence names a technique only with its setup convention id and version", async ({ page }) => {
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  // The Lucena diagram from Wikipedia's "Lucena position" (oldid=1356336262): every lucena-setup@1 operand holds.
  await page.getByLabel("Position FEN").fill("1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await page.getByRole("button", { name: "Inspector" }).click();
  const evidence = page.getByRole("region", { name: "Current-position endgame evidence" });
  await expect(evidence).toContainText("Rook and pawn versus rook");
  await expect(evidence).toContainText("Matches the Lucena position setup under convention lucena-setup@1 (geometry only; not an outcome or advice).");
  await expect(evidence).not.toContainText("Philidor");
});

async function importCorpusPreviewGame(page: Page): Promise<{ runId: string; graph: RunGraph }> {
  await page.goto("/review");
  await page.getByLabel("PGN").fill('[Event "Corpus preview subject"]\n[White "Alice"]\n[Black "Bob"]\n[Result "*"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 *');
  await page.getByRole("button", { name: "Build game story" }).click();
  await expect(page).toHaveURL(/\/review\/game\/import-/);
  await expect(page.getByText("Evaluation coverage: 7 of 7 positions on this line carry a recorded engine evaluation.")).toBeVisible({ timeout: 15_000 });
  const runId = page.url().split("/").at(-1)!;
  const graph = (await (await page.request.get(`/runs/${runId}/graph`)).json()).graph as RunGraph;
  return { runId, graph };
}

async function enableCorpusInspector(page: Page): Promise<void> {
  await openAdvancedSupport(page);
  await page.getByLabel("Corpus counts on request").check();
  await expect(page.locator("[data-preset-state]")).toHaveAttribute("data-preset-state", "ready");
}

async function previewCorpusNode(page: Page, nodeId: string): Promise<void> {
  await page.getByRole("button", { name: "Return to play" }).click();
  await page.locator(`[data-timeline-node="${nodeId}"]`).click();
  await page.getByRole("button", { name: "Inspector", exact: true }).click();
}

async function loadCorpusAt(page: Page, runId: string, nodeId: string) {
  const received = page.waitForResponse(response => new URL(response.url()).pathname === `/runs/${runId}/corpus`);
  await page.getByRole("region", { name: "Corpus evidence" }).getByRole("button", { name: "Load corpus counts", exact: true }).click();
  const response = await received;
  expect(new URL(response.url()).searchParams.get("nodeId")).toBe(nodeId);
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.nodeId).toBe(nodeId);
  return body;
}

test("corpus ancestry follows historical opponent and learner previews without rewinding", async ({ page }) => {
  const { runId, graph } = await importCorpusPreviewGame(page);
  await page.goto(`/play/run/${runId}`);
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  const boardBefore = await page.getByLabel("Chessboard").boundingBox();
  await enableCorpusInspector(page);
  const corpus = page.getByRole("region", { name: "Corpus evidence" });
  const firstOpponent = graph.nodes.find(node => node.moveUci === "e7e5")!;
  const secondLearner = graph.nodes.find(node => node.moveUci === "g1f3")!;
  const lastLearner = graph.nodes.find(node => node.moveUci === "f1b5")!;
  await loadCorpusAt(page, runId, lastLearner.parentId!);
  await expect(corpus).toContainText("37 games recorded here");
  await previewCorpusNode(page, firstOpponent.id);
  const historical = await loadCorpusAt(page, runId, graph.nodes[0]!.id);
  expect(historical.committedMoveSan).toBe("e4");
  await expect(corpus).toContainText("e4 — 60 of 120 games");
  await expect(corpus).toContainText("Your committed move here: e4.");
  await previewCorpusNode(page, secondLearner.id);
  await expect(corpus).toContainText("No corpus page loaded for this position.");
  await loadCorpusAt(page, runId, firstOpponent.id);
  await expect(corpus).toContainText("37 games recorded here");
  await page.getByRole("button", { name: "Return to play" }).click();
  expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(boardBefore);
  const after = (await (await page.request.get(`/runs/${runId}/graph`)).json()).graph;
  expect(after.activeCursor).toEqual(graph.activeCursor);
  expect(after.nodes).toEqual(graph.nodes);
});

test("corpus preview discards a real delayed response after leave-and-return to the same predecessor", async ({ page }) => {
  const { runId, graph } = await importCorpusPreviewGame(page);
  await page.goto(`/play/run/${runId}`);
  await enableCorpusInspector(page);
  const firstLearner = graph.nodes.find(node => node.moveUci === "e2e4")!;
  const firstOpponent = graph.nodes.find(node => node.moveUci === "e7e5")!;
  await previewCorpusNode(page, firstLearner.id);
  let release!: () => void;
  let captured!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const acquired = new Promise<void>(resolve => { captured = resolve; });
  const corpusUrl = `**/runs/${runId}/corpus?*`;
  await page.route(corpusUrl, async route => {
    // Delay only delivery of the genuine authenticated server response. Never
    // replace source bytes, invent a renderer payload or bypass disclosure.
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    expect((await response.json()).nodeId).toBe(graph.nodes[0]!.id);
    captured(); await held;
    await route.fulfill({ response });
  });
  try {
    const corpus = page.getByRole("region", { name: "Corpus evidence" });
    await corpus.getByRole("button", { name: "Load corpus counts", exact: true }).click();
    await acquired;
    await expect(corpus).toContainText("Loading human game counts");
    await previewCorpusNode(page, firstOpponent.id);
    await expect(corpus).toContainText("No corpus page loaded for this position.");
    await previewCorpusNode(page, firstLearner.id);
    const received = page.waitForResponse(response => new URL(response.url()).pathname === `/runs/${runId}/corpus`);
    release(); await received;
    await expect(corpus).toContainText("No corpus page loaded for this position.");
    await expect(corpus.locator("[data-presented]")).toHaveCount(0);
    await expect(corpus.getByRole("button", { name: "Load corpus counts", exact: true })).toBeEnabled();
  } finally { release(); await page.unroute(corpusUrl); }
});

test("corpus ancestry follows a sibling branch and its root through native review reentry", async ({ page }) => {
  const { runId, graph } = await importCorpusPreviewGame(page);
  await page.getByRole("button", { name: "Retry from before move 1 (e4)", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/play/run/${runId}$`, "u"));
  // Reentry also seats the separate "guess the game's next move" board. The
  // actual rehearsal gestures belong to the board stage, never that predictor.
  const stageBoard = page.locator(".board-frame").getByLabel("Chessboard");
  await expect(stageBoard).toBeVisible();
  await move(page, "d2", "d4", "white", stageBoard);
  await expect(page.getByText("Thinking…")).toHaveCount(0);
  await move(page, "c2", "c4", "white", stageBoard);
  await expect(page.getByText("Thinking…")).toHaveCount(0);
  await showSupportTools(page);
  const reveal = page.getByRole("button", { name: "Show support for this position", exact: true });
  if (await reveal.isVisible()) await reveal.click();
  await enableCorpusInspector(page);
  const branched = (await (await page.request.get(`/runs/${runId}/graph`)).json()).graph as RunGraph;
  const firstUser = branched.nodes.find(node => node.moveUci === "d2d4")!;
  const opponent = branched.nodes.find(node => node.parentId === firstUser.id)!;
  expect(opponent.actor).toBe("opponent");
  await previewCorpusNode(page, opponent.id);
  await loadCorpusAt(page, runId, graph.nodes[0]!.id);
  await expect(page.getByRole("region", { name: "Corpus evidence" })).toContainText("Your committed move here: d4.");
  await previewCorpusNode(page, graph.nodes[0]!.id);
  const rootPage = await loadCorpusAt(page, runId, graph.nodes[0]!.id);
  expect(rootPage.committedMoveSan).toBe("d4"); // Existing active-path wire contract.
  const corpus = page.getByRole("region", { name: "Corpus evidence" });
  await expect(corpus).toContainText("e4 — 60 of 120 games");
  await expect(corpus).not.toContainText("Your committed move");
  await page.getByRole("button", { name: "Return to play" }).click();
  const original = branched.branches.find(branch => branch.id === graph.activeCursor.branchId)!;
  await page.getByLabel("Branches from the start").getByRole("button", { name: original.label, exact: true }).click();
  await expect(page.locator(".rail")).toHaveAttribute("data-active-branch-id", original.id);
  await page.locator(`[data-timeline-node="${graph.nodes.find(node => node.moveUci === "e7e5")!.id}"]`).click();
  await page.getByRole("button", { name: "Inspector", exact: true }).click();
  await expect(corpus).toContainText("No corpus page loaded for this position.");
  await loadCorpusAt(page, runId, graph.nodes[0]!.id);
  await expect(corpus).toContainText("Your committed move here: e4.");
  const after = (await (await page.request.get(`/runs/${runId}/graph`)).json()).graph as RunGraph;
  expect(after.nodes.map(node => node.moveUci)).toEqual(expect.arrayContaining(["e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "d2d4", "c2c4"]));
});

test("runtime corpus counts stay silent until reveal and render population facts on request", async ({ page }) => {
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await openAdvancedSupport(page);
  await page.getByLabel("Passive markers").check();
  await page.getByRole("button", { name: "Return to play" }).click();
  await move(page, "e2", "e4");
  await expect(page.getByText("Active line 2 turns")).toBeVisible();
  await expect(page.getByText("Thinking…")).toHaveCount(0);
  const runId = page.url().split("/").at(-1)!;
  const writerId = await page.evaluate((id) => localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
  expect(writerId).not.toBeNull();
  const reveal = await page.request.post(`/runs/${runId}/reveal`, { headers: { "x-writer-id": writerId! }, data: {} });
  expect(reveal.ok()).toBe(true);
  await page.reload();
  await openAdvancedSupport(page);
  await page.getByLabel("Corpus counts on request").check();
  await page.getByRole("button", { name: "Load human-game corpus evidence" }).click();
  const corpus = page.getByRole("region", { name: "Corpus evidence" });
  await expect(corpus).toContainText("Lichess explorer — rating buckets 1400; speeds blitz,rapid,classical");
  await expect(corpus).toContainText("These counts say what this population played, not what is good.");
  await expect(corpus).toContainText("e4 — 60 of 120 games (50.0%). Outcome split withheld below the 100-game per-move floor.");
  await expect(corpus).toContainText("Last recorded game in this population: 2019-04.");
});

test("@content Pack B references the Carlsbad entry while its pack prose stays server-withheld", async ({ page }) => {
  const list = await page.request.get("/packs");
  const packs = await list.json() as { id: string; title: string }[];
  const pack = packs.find((candidate) => candidate.id === "carlsbad-minority-attack")!;
  const detail = await page.request.get(`/packs/${pack.id}`);
  const projected = await detail.json() as Record<string, unknown>;
  expect(projected.shapes).toEqual(["carlsbad"]);
  expect(projected).not.toHaveProperty("planClasses");
  expect(projected).not.toHaveProperty("successConditions");

  await page.getByRole("article").filter({ hasText: pack.title }).getByRole("button", { name: /Rehearse this position/ }).click();
  await page.getByRole("button", { name: "Inspector" }).click();
  const structuralReading = page.getByRole("button", { name: "Position structure" });
  await expect(structuralReading).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".structural-facts")).toHaveCount(0);
  await structuralReading.click();
  await expect(page.locator(".structural-facts")).toContainText("White has 7 pawns.");
  await expect(page.locator(".structural-facts")).toContainText("Black has 7 pawns.");
  await expect(page.locator(".structural-facts")).toContainText("White's bishop on d3 stands on a light square.");
  await page.reload();
  await page.getByRole("button", { name: "Inspector" }).click();
  await expect(page.getByRole("button", { name: "Position structure" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".structural-facts")).toHaveCount(0);
  await page.getByRole("button", { name: "Return to play" }).click();
  await openAdvancedSupport(page);
  await page.getByLabel("Named-pattern guidance").check();
  await page.getByRole("button", { name: "Return to play" }).click();
  const marker = page.getByRole("button", { name: /Carlsbad structure/ });
  await expect(marker).toBeVisible();
  await marker.click();
  const generic = "Two queenside pawns advance against three";
  await expect(page.getByText(generic, { exact: false })).toHaveCount(1);
  await expect(page.getByText("In this tabiya the plan is already supported", { exact: false })).toHaveCount(0);
});

test("immediate guard waits for the consequence, preserves play-on, and rewinds the decision", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Post-commit guard browser fixture" });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();

  await move(page, "h2", "h3");
  const prompt = page.getByRole("region", { name: "Consequence to review" });
  await expect(prompt).toBeVisible();
  await expect(prompt).not.toContainText("The material balance changed on this path.");
  await expect(prompt).not.toContainText(/recorded grounds|disclosed evidence|projection|packet/i);
  await prompt.getByRole("button", { name: "Inspect what changed" }).click();
  const guardEvidence = page.getByRole("region", { name: "Post-commit guard evidence" });
  await expect(guardEvidence).toContainText("The material balance changed on this path.");
  await page.getByRole("button", { name: "Return to play" }).click();
  await expect(page.getByLabel("Review marker")).toBeVisible();

  await prompt.getByRole("button", { name: "Play on" }).click();
  await expect(prompt).toHaveCount(0);
  await page.reload();
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: "Rewind" }).click();
  await expect(page.getByText("Active line 0 turns")).toBeVisible();
  await move(page, "h2", "h4");
  await page.getByRole("button", { name: "Branches", exact: true }).click();
  await expect(page.getByRole("button", { name: /Switch to branch 1:/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Switch to branch 2:/ })).toBeVisible();
});

test("stated reasoning reveals attributed key points only after recording and keeps the prior attempt", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Stated reasoning browser fixture" });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await move(page, "h2", "h3");

  const reasoning = page.getByRole("region", { name: "State your reasoning" });
  await expect(reasoning).toBeVisible();
  await expect(reasoning.getByText("Keep the queen protected")).toHaveCount(0);
  await reasoning.getByLabel("Candidate moves").fill("Keep the queen");
  await reasoning.getByLabel("Your plan").fill("protect the queen");
  await reasoning.getByLabel("What you fear").fill("king safety");
  await reasoning.getByRole("button", { name: "Record reasoning" }).click();

  await expect(reasoning.getByText(/Mentioned — matched 'protect the queen'/)).toBeVisible();
  await expect(reasoning.getByText("Not detected in your words.")).toBeVisible();
  await expect(reasoning.getByText(/not detected.*never that it was wrong/i)).toBeVisible();
  await expect(reasoning.getByText(/The author's line plays h3/)).toHaveCount(2);
  const verdictFree = await reasoning.evaluate((element) => {
    const clone = element.cloneNode(true) as HTMLElement;
    clone.querySelector(".honesty")?.remove();
    return clone.innerText;
  });
  expect(verdictFree).not.toMatch(/\b(?:score|correct|incorrect|wrong|accuracy|grade|pass|fail)\b|%/iu);
  expect(verdictFree).not.toMatch(/\d+\s*\/\s*\d+/u);

  const runId = page.url().split("/").at(-1)!;
  const graph = await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: { nodes: { id: string; parentId: string | null }[] } };
  const writerId = await page.evaluate((id) => localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
  const rewind = await page.request.post(`/runs/${runId}/rewind`, { headers: { "x-writer-id": writerId! }, data: { nodeId: graph.graph.nodes.find((node) => node.parentId === null)!.id } });
  expect(rewind.ok(), await rewind.text()).toBe(true);
  await page.reload();
  await move(page, "h2", "h3");
  await expect(page.getByRole("region", { name: "Your previous attempt" })).toContainText("protect the queen");
  await page.getByRole("textbox", { name: "Your plan" }).fill("keep the queen");
  await page.getByRole("button", { name: "Record reasoning" }).click();
  await expect(page.getByRole("region", { name: "Your previous attempt" })).toContainText("protect the queen");
});

test("Live turns a run into a session and exposes a chrome-free overlay", async ({ page }) => {
  const card = schemaPackCard(page);
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await page.goto("/live");
  await expect(page.getByRole("heading", { name: "Rehearse with other people." })).toBeVisible();
  await page.getByLabel("Session title").fill("academy session");
  await page.getByRole("button", { name: "Create academy" }).first().click();
  await expect(page.getByRole("heading", { name: "academy session" })).toBeVisible();
  await expect(page.getByText("Live / Academy lesson", { exact: true })).toBeVisible();
  await expect(page.getByText(/rewind, branch, compare, and return without discarding the original line/)).toBeVisible();
  await expect(page.getByText("your role: Host")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Invitations" })).toBeVisible();
  await expect(page.getByLabel("Tabiya handle")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Audience output" })).toBeVisible();
  await expect(page.getByLabel("OBS browser-source URL")).toHaveValue(/\/live\/overlay\//);
  await expect(page.getByText(/No board delay:/)).toBeVisible();
  await page.getByRole("button", { name: "See what your audience sees" }).click();
  const audiencePreview = page.frameLocator('iframe[title="Audience overlay preview"]');
  await expect(audiencePreview.getByLabel("Live session overlay")).toBeVisible();
  await expect(audiencePreview.getByText(/Objective in progress · 1 preserved attempt/)).toBeVisible();
  const voteEditor = page.locator(".vote-editor");
  await voteEditor.getByLabel("Prompt").fill("Which plan?");
  const moves = ["a1b1", "c1d2", "c1e3", "c1f4", "c1g5", "c1h6", "d1d2", "d1e2"];
  const labels = ["Rook across", "Bishop d2", "Bishop e3", "Bishop f4", "Bishop g5", "Bishop h6", "Queen d2", "Queen e2"];
  for (let index = 2; index < moves.length; index += 1) await voteEditor.getByRole("button", { name: "Add option" }).click();
  await expect(voteEditor.getByRole("button", { name: "Add option" })).toBeDisabled();
  await expect(voteEditor.getByRole("button", { name: "Remove" }).first()).toBeEnabled();
  for (let index = 0; index < moves.length; index += 1) {
    await voteEditor.getByLabel("Move").nth(index).selectOption(moves[index]!);
    await voteEditor.getByLabel("Audience label").nth(index).fill(labels[index]!);
  }
  await voteEditor.getByLabel("Voting time (seconds)").fill("90");
  await expect(voteEditor.getByLabel("Voting time (seconds)")).toHaveAccessibleDescription(/It is not a board delay/u);
  await voteEditor.getByRole("button", { name: "Open vote" }).click();
  await expect(page.getByText("Which plan? · Voting open")).toBeVisible();
  await expect(page.getByRole("button", { name: /Vote for Bishop f4/ })).toBeVisible();
  await expect(page.getByText("No votes yet.")).toBeVisible();
  await page.goto("/live");
  const wallCard = page.locator(".live-wall article").filter({ hasText: "academy session" });
  await expect(wallCard).toContainText("White to move");
  await expect(wallCard).toContainText("Objective: In progress");
  await expect(wallCard).toContainText("No move committed yet");
  await expect(page.getByText("never ordered or labelled by engine evaluation")).toBeVisible();
  await wallCard.getByRole("button", { name: "Open" }).click();
  await page.getByRole("button", { name: "Open overlay" }).click();
  await expect(page.getByLabel("Live session overlay")).toBeVisible();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Select a setup and execute its first plan through the timing window." })).toBeVisible();
  await expect(page.getByText(/Objective in progress · 1 preserved attempt/)).toBeVisible();
  await expect(page.getByText("Bishop f4: 0")).toBeVisible();
  await expect(page.getByText("No votes yet.")).toBeVisible();
  await expect(page.locator("#primary-navigation")).toHaveCount(0);
});

test("an academy host can identify and play a participant's proposed move", async ({ page, browser }) => {
  const card = schemaPackCard(page);
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await page.goto("/live");
  await page.getByLabel("Session title").fill("academy session");
  await page.getByRole("button", { name: "Create academy" }).first().click();
  await expect(page.getByText("your role: Host")).toBeVisible();
  const sessionUrl = page.url();

  const participantContext = await browser.newContext();
  const participant = await participantContext.newPage();
  const participantHandle = await register(participant);
  const invitations = page.getByRole("heading", { name: "Invitations" }).locator("..");
  await invitations.getByLabel("Tabiya handle").fill(participantHandle);
  await invitations.getByRole("button", { name: "Create invitation" }).click();
  await expect(invitations).toContainText(`@${participantHandle}`);

  await participant.goto(sessionUrl);
  await expect(participant.getByText("your role: Participant")).toBeVisible();
  const members = page.getByRole("heading", { name: "Members" }).locator("..");
  await members.getByLabel("Offer board to handle").fill(participantHandle);
  await members.getByRole("button", { name: "Offer board" }).click();
  await participant.getByRole("button", { name: "Open shared board" }).click();
  await expect(participant.getByLabel("Chessboard")).toBeVisible();
  await participant.getByRole("button", { name: "Take the board on this device" }).click();
  await page.goto(sessionUrl);
  await expect(page.getByText(`@${participantHandle} holds the board.`)).toBeVisible();
  await page.getByRole("button", { name: "Take back board…" }).click();
  const reclaim = page.getByRole("complementary", { name: `Take the board from @${participantHandle}?` });
  await expect(reclaim).toContainText("their attempt-in-progress ends as an active learning turn");
  await expect(reclaim).toContainText("Nothing in the learner's line is deleted");
  await reclaim.getByRole("button", { name: "Confirm — take the board" }).click();
  await expect(page.getByText("holds the board.").first()).not.toContainText(`@${participantHandle}`);
  await participant.goto(sessionUrl);
  const proposals = participant.getByRole("heading", { name: "Proposals" }).locator("..");
  await proposals.getByRole("combobox", { name: "Move" }).selectOption("a1b1");
  await proposals.getByRole("button", { name: "Propose" }).click();
  await expect(proposals.getByRole("list", { name: "Move proposals" }).getByText("Rb1", { exact: true })).toBeVisible();

  const hostProposals = page.getByRole("heading", { name: "Proposals" }).locator("..");
  await expect(hostProposals).toContainText(`proposed by @${participantHandle}`, { timeout: 5_000 });
  await hostProposals.getByRole("button", { name: "Play proposal" }).click();
  await expect(hostProposals).toContainText("Played on the board");
  await expect(hostProposals.getByRole("button", { name: "Play proposal" })).toHaveCount(0);
  await participantContext.close();
});

test("a classroom assignment shows who submitted and makes sharing explicit", async ({ page, browser }) => {
  test.setTimeout(60_000);
  await page.goto("/live");
  const classrooms = page.getByRole("region").filter({ has: page.getByRole("heading", { name: "Classrooms" }) });
  await expect(classrooms).toContainText("A classroom lets a teacher assign packs to you and schedule sessions");
  await expect(classrooms).toContainText("It does not let them see your runs");
  const teacherHandle = (await page.getByRole("banner").locator("strong").textContent())!.replace(/^@/u, "");
  await classrooms.getByLabel("New classroom").fill("Thursday group");
  await classrooms.getByRole("button", { name: "Create", exact: true }).click();

  const submittedContext = await browser.newContext();
  const submittedPage = await submittedContext.newPage();
  const submittedHandle = await register(submittedPage);
  const waitingContext = await browser.newContext();
  const waitingPage = await waitingContext.newPage();
  const waitingHandle = await register(waitingPage);

  await classrooms.getByRole("button", { name: "Open", exact: true }).click();
  for (const handle of [submittedHandle, waitingHandle]) {
    await classrooms.getByLabel("Invite handle").fill(handle);
    await classrooms.getByRole("button", { name: "Invite", exact: true }).click();
    await expect(classrooms.getByText(`@${handle} — Learner, Invitation waiting`)).toBeVisible();
  }
  for (const learnerPage of [submittedPage, waitingPage]) {
    await learnerPage.goto("/live");
    const invitation = learnerPage.getByRole("article").filter({ hasText: "Thursday group" });
    await expect(invitation).toContainText(`Invited by @${teacherHandle}`);
    await expect(invitation).toContainText("Accepting lets teachers assign packs to you and schedule sessions");
    await expect(invitation).toContainText("It does not let them see your runs");
    await invitation.getByRole("button", { name: "Accept", exact: true }).click();
    await expect(learnerPage.getByText("learner · active")).toBeVisible();
  }

  await classrooms.getByRole("button", { name: "Open", exact: true }).click();
  await classrooms.getByLabel("Pack").selectOption({ label: "Najdorf: choose a setup and cross the theory boundary" });
  await classrooms.getByLabel("Teacher note").fill("Compare both plans");
  await classrooms.getByRole("button", { name: "Assign", exact: true }).click();
  await expect(classrooms.getByText("Compare both plans")).toBeVisible();

  await submittedPage.goto("/learn");
  const assigned = submittedPage.getByRole("region").filter({ has: submittedPage.getByRole("heading", { name: "Assigned" }) });
  await expect(assigned.getByRole("heading", { name: "Najdorf: choose a setup and cross the theory boundary" })).toBeVisible();
  await expect(assigned.getByText("Compare both plans")).toBeVisible();
  await assigned.getByRole("button", { name: "Start pack" }).click();
  await expect(submittedPage.getByLabel("Chessboard")).toBeVisible();
  await submittedPage.goto("/learn");
  await assigned.getByLabel("Completed run").selectOption({ index: 1 });
  await assigned.getByRole("button", { name: "Share with teachers" }).click();
  const confirmation = submittedPage.getByRole("complementary", { name: /Share .+\?/ });
  await expect(confirmation).toContainText("will be able to read this run for up to 90 days");
  await expect(confirmation).toContainText("They do not gain access to your other runs.");
  await confirmation.getByRole("button", { name: "Confirm sharing" }).click();
  const watcherDisclosure = assigned.getByText("Currently shared with", { exact: false });
  await expect(watcherDisclosure).toContainText(`@${teacherHandle}`);
  await submittedPage.setViewportSize({ width: 390, height: 844 });
  await expect(watcherDisclosure).toBeVisible();
  const watcherBounds = await watcherDisclosure.boundingBox();
  expect(watcherBounds).not.toBeNull();
  expect(watcherBounds!.x + watcherBounds!.width).toBeLessThanOrEqual(390);
  await submittedPage.setViewportSize({ width: 1440, height: 1000 });

  await classrooms.getByRole("button", { name: "Open", exact: true }).click();
  const status = classrooms.getByLabel("Submission status for Najdorf: choose a setup and cross the theory boundary");
  await expect(status).toContainText(`@${submittedHandle}`);
  await expect(status).toContainText("Submitted");
  await expect(status).toContainText(`@${waitingHandle}`);
  await expect(status).toContainText("not submitted");
  await expect(status.getByRole("button", { name: `Review @${submittedHandle}'s run` })).toBeVisible();

  const teacherStanding = classrooms.getByRole("region", { name: "Classroom standing" });
  await teacherStanding.getByRole("button", { name: "Open standing" }).click();
  await expect(teacherStanding.getByText("Teachers can open and manage the window, but they never publish or appear")).toBeVisible();

  await submittedPage.goto("/live");
  const submittedClassrooms = submittedPage.getByRole("region").filter({ has: submittedPage.getByRole("heading", { name: "Classrooms" }) });
  await submittedClassrooms.getByRole("button", { name: "Open", exact: true }).click();
  const submittedStanding = submittedClassrooms.getByRole("region", { name: "Classroom standing" });
  await expect(submittedStanding.getByText("Learners choose whether to publish their own result record")).toBeVisible();
  await submittedStanding.getByRole("button", { name: "Join this standing" }).click();
  await submittedStanding.getByRole("button", { name: "Publish my record" }).click();
  await expect(submittedStanding.getByRole("rowheader", { name: `@${submittedHandle}` })).toBeVisible();

  await waitingPage.goto("/live");
  const waitingClassrooms = waitingPage.getByRole("region").filter({ has: waitingPage.getByRole("heading", { name: "Classrooms" }) });
  await waitingClassrooms.getByRole("button", { name: "Open", exact: true }).click();
  const waitingStanding = waitingClassrooms.getByRole("region", { name: "Classroom standing" });
  await expect(waitingStanding.getByRole("rowheader", { name: `@${submittedHandle}` })).toBeVisible();
  await expect(waitingStanding.getByRole("button", { name: "Join this standing" })).toBeVisible();

  await submittedContext.close();
  await waitingContext.close();
});

test("a completed assigned attempt offers hand-in inside the outcome sheet", async ({ page, browser }) => {
  test.setTimeout(60_000);
  await page.goto("/live");
  const classrooms = page.getByRole("region").filter({ has: page.getByRole("heading", { name: "Classrooms" }) });
  await classrooms.getByLabel("New classroom").fill("Endgame submissions");
  await classrooms.getByRole("button", { name: "Create", exact: true }).click();

  const learnerContext = await browser.newContext();
  const learnerPage = await learnerContext.newPage();
  const learnerHandle = await register(learnerPage);
  await classrooms.getByRole("button", { name: "Open", exact: true }).click();
  await classrooms.getByLabel("Invite handle").fill(learnerHandle);
  await classrooms.getByRole("button", { name: "Invite", exact: true }).click();
  await learnerPage.goto("/live");
  await learnerPage.getByRole("button", { name: "Accept", exact: true }).click();

  await classrooms.getByRole("button", { name: "Open", exact: true }).click();
  await classrooms.getByLabel("Pack").selectOption({ label: "Terminal outcome browser fixture" });
  await classrooms.getByLabel("Teacher note").fill("Bring me the finished attempt");
  await classrooms.getByRole("button", { name: "Assign", exact: true }).click();

  await learnerPage.goto("/learn");
  const assignment = learnerPage.getByRole("article").filter({ hasText: "Terminal outcome browser fixture" });
  await expect(assignment).toContainText("Bring me the finished attempt");
  await assignment.getByRole("button", { name: "Start pack" }).click();
  await move(learnerPage, "f2", "f3");
  await learnerPage.getByRole("button", { name: "Continue" }).click();
  await move(learnerPage, "g2", "g4");

  const terminal = learnerPage.getByRole("dialog", { name: "You lost." });
  const handIn = terminal.getByRole("region", { name: "Hand in this attempt" });
  await expect(handIn).toContainText("Endgame submissions · assigned by @");
  await expect(handIn).toContainText("Teacher note: Bring me the finished attempt");
  await handIn.getByRole("button", { name: "Review sharing" }).click();
  const consent = terminal.getByRole("complementary", { name: "Share this completed attempt?" });
  await expect(consent).toContainText("will be able to read this run for up to 90 days");
  await expect(consent).toContainText("any help you opened during it");
  await expect(consent).not.toContainText("evidence or reveals");
  await expect(consent).toContainText("cannot undo what a teacher already saw");
  await consent.getByRole("button", { name: "Confirm sharing" }).click();
  await expect(handIn).toHaveCount(0);

  await classrooms.getByRole("button", { name: "Open", exact: true }).click();
  const status = classrooms.getByLabel("Submission status for Terminal outcome browser fixture");
  await expect(status).toContainText(`@${learnerHandle}`);
  await expect(status).toContainText("Submitted");
  await learnerContext.close();
});

test("library exposes phase honestly and survives a malformed pack response", async ({
  page,
}) => {
  const expected = [
    ["Carlsbad structure", "Middlegame"],
    ["Rook endings", "Endgame"],
    ["Caro-Kann Advance", "Opening"],
    ["Trajectory: QGD Exchange", "Across phases"],
  ] as const;
  for (const [name, phase] of expected) {
    const card = page.getByRole("article").filter({ hasText: name }).first();
    await expect(card).toContainText(phase);
  }

  await page.route(/\/packs$/u, async (route) => {
    const response = await route.fetch();
    const body = await response.json() as Record<string, unknown>[];
    body.push({
      id: "unclassified-browser-fixture",
      version: "0.1.0",
      digest: `sha256:${"f".repeat(64)}`,
      title: "Unclassified browser fixture",
      mode: "plan",
      phase: null,
      difficulty: null,
      objectiveSummary: "A valid summary whose authored phase is absent.",
      consequenceHorizon: null,
      concepts: [],
      reviewStatus: "schema_example",
      channel: "official",
    });
    await route.fulfill({ response, json: body });
  });
  await page.reload();
  await expect(page.getByRole("article").filter({ hasText: "Unclassified browser fixture" })).toContainText("Phase not recorded");

  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.route(/\/packs\/[^/]+$/u, async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { start?: Record<string, unknown> };
    if (body.start !== undefined) delete body.start.side;
    await route.fulfill({ response, json: body });
  });
  const card = page.getByRole("article").filter({
    has: page.getByText("Najdorf: choose a setup and cross the theory boundary", { exact: true }),
  });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await expect(page.getByRole("alert")).toHaveText("Tabiya could not complete that action. Reopen the run to check its latest position, then try again.");
  await expect(page.getByRole("alert")).not.toContainText("start.side");
  await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("Library search opens a principle, understands its basis, and rehearses an anchored pack", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: "Find it, understand it, rehearse it, come back to it." })).toBeVisible();
  // Phase-first: the phase filter is the first control, and packs are one row per id.
  await page.getByRole("group", { name: "Chess phase" }).getByRole("button", { name: "Endgames" }).click();
  await expect(page.getByRole("heading", { name: "Rehearsal packs" })).toBeVisible();
  const packTitles = await page.locator('.item[data-kind="pack"] h3').allTextContents();
  expect(packTitles.length).toBeGreaterThan(0);
  expect(new Set(packTitles).size).toBe(packTitles.length);
  await expect(page.getByText("No official pack has graduated yet.", { exact: false })).toBeVisible();
  await expect(page.locator('.item[data-kind="pack"] .origin').first()).toHaveText(/Community draft · not yet reviewed/u);

  await page.getByRole("group", { name: "Chess phase" }).getByRole("button", { name: "Every phase" }).click();
  await page.getByLabel("Search the library").fill("tempo currency");
  const principle = page.locator('.item[data-kind="principle"]').filter({ hasText: "Tempo is the currency" });
  await expect(principle).toHaveCount(1);
  await expect(principle.locator(".origin")).toHaveText("Official");
  await principle.getByRole("link", { name: "Tempo is the currency", exact: true }).click();

  await expect(page).toHaveURL(/\/library\/principle\/tempo-is-the-currency$/u);
  await expect(page.getByRole("heading", { level: 1, name: "Tempo is the currency" })).toBeVisible();
  await expect(page.getByText("Stands on the authors' practice. No external source is cited for it.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Where it stops holding" })).toBeVisible();
  const anchored = page.locator("section").filter({ has: page.getByRole("heading", { name: "Rehearse it" }) }).locator("li");
  await expect(anchored.first()).toContainText("Community draft · not yet reviewed");
  const title = (await anchored.first().locator("a").textContent())!.trim();
  await anchored.first().getByRole("button", { name: `Rehearse: ${title}` }).click();

  await expect(page).toHaveURL(/\/play\/run\/run-/u);
  await expect(page.getByLabel("Chessboard")).toBeVisible();

  // Return: the pack entry names the learner's return path for the pack just rehearsed.
  await page.goto("/library");
  await page.getByLabel("Search the library").fill(title.split(":")[0]!);
  const card = page.locator('.item[data-kind="pack"]').filter({ hasText: title });
  await card.getByRole("link", { name: `Plan a return: ${title}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Return" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open your latest rehearsal of this pack" })).toBeVisible();
});

test("terminal outcome reveals authored commentary, a native story, and a revocable public card", async ({ page, browser }) => {
  const card = page
    .getByRole("article")
    .filter({ hasText: "Terminal outcome browser fixture" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: /Rehearse this position/ }).click();

  await move(page, "f2", "f3");
  await expect(page.getByRole("heading", { name: "Before terminal continuation" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await move(page, "g2", "g4");

  await expect(page.getByRole("heading", { name: "You lost." })).toBeVisible();
  await expect(page.getByText("Terminal browser fixture commentary.")).toBeVisible();
  const terminal = page.getByRole("dialog", { name: "You lost." });
  await expect(terminal.getByText("Engine evidence recorded", { exact: false })).toHaveCount(0);
  await terminal.getByRole("button", { name: /Inspect analysis details/ }).click();
  const terminalEvidence = page.getByRole("region", { name: "Evidence attached to this position" });
  await expect(terminalEvidence.getByText("Recorded engine evaluation:", { exact: false })).toBeVisible({ timeout: 5_000 });
  await expect(terminalEvidence).not.toContainText("details are pending");
  await page.getByRole("button", { name: "Return to play" }).click();
  await expect(page.getByRole("dialog", { name: "You lost." })).toBeVisible();
  await expect(page.getByText("Thinking…")).toHaveCount(0);
  await expect(terminal.getByText("Your completed attempt stays saved.", { exact: false })).toBeVisible();
  await expect(terminal.getByRole("button", { name: "Play it again from here" })).toBeVisible();
  await terminal.getByRole("button", { name: "Review the whole game" }).click();
  await expect(page).toHaveURL(/\/review\/game\//);
  await expect(page.getByRole("heading", { name: "Review of this run" })).toBeVisible();
  await expect(page.getByText("A public review link does not expire.", { exact: false })).toBeVisible();
  await expect(page.getByText("No public review links yet.")).toBeVisible();
  const privateMoments = await page.locator(".moment-card").evaluateAll((cards) => cards.map((card) => (card as HTMLElement).dataset.momentId));
  await page.getByRole("button", { name: "Share review" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Public review link created" })).toBeVisible();
  const publicLink = page.getByRole("link", { name: /\/shared\// });
  const href = await publicLink.getAttribute("href");
  expect(href).not.toBeNull();
  const absolute = new URL(href!, page.url()).href;
  const anonymous = await browser.newContext();
  const publicPage = await anonymous.newPage();
  await publicPage.goto(absolute);
  await expect(publicPage.getByRole("heading", { level: 1 })).toContainText(/The turning point|Held|Won|A game story/);
  // [criterion 8] the public card carries the same moments, in the same order, as the private map.
  const publicStory = await (await page.request.get(new URL(href!.replace("/shared/", "/api/shared/") + "/story", page.url()).href)).json() as { moments: { nodeId: string }[] };
  expect(publicStory.moments.map((moment) => moment.nodeId)).toEqual(privateMoments);
  if (privateMoments.length > 0) await expect(publicPage.getByLabel("Chessboard")).toBeVisible();
  await expect(publicPage.getByText(/^Sources on this review:/u)).toBeVisible();
  await expect(page.getByRole("list", { name: "Review share links" })).toContainText("public");
  await page.getByRole("button", { name: "Revoke this link" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Future reads through that public link are blocked" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Review share links" })).toContainText("revoked");
  await publicPage.reload();
  await expect(publicPage.getByText("Route not found")).toBeVisible();
  await anonymous.close();
});

test("terminal flip preserves the source and milestones link back into played runs", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Terminal outcome browser fixture" });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await move(page, "f2", "f3");
  await page.getByRole("button", { name: "Continue" }).click();
  await move(page, "g2", "g4");
  const sourceId = page.url().split("/").at(-1)!;
  await page.getByRole("button", { name: "Replay this as Black" }).click();
  await expect(page).toHaveURL(/\/play\/run\/flip-/);
  await expect(page.getByRole("heading", { name: /Nothing is authored about this position/ })).toBeVisible();
  // rfc/evidence-presentation.md §6a: the source is named, never shown as its raw run id.
  await expect(page.getByLabel("Opposite-side replay source")).toContainText("Mirror of the source run");
  await expect(page.getByLabel("Opposite-side replay source")).not.toContainText(sourceId);
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Milestones" })).toBeVisible();
  await expect(page.getByText("First preserved attempt.")).toBeVisible();
});

test("Learn shows each due return's standing word beside its due date with its fixed explanation", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Terminal outcome browser fixture" });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await move(page, "f2", "f3");
  await page.getByRole("button", { name: "Continue" }).click();
  await move(page, "g2", "g4");
  await expect(page.getByLabel("Chessboard")).toBeVisible();

  // Travel to a far-future "now" so the return the attempt just scheduled is due; the real server
  // replays the ladder and serves the word. The payload carries no rung, ratio or mastery field.
  const future = "9999-12-31T23:59:59.999Z";
  let served: { schedules: Record<string, unknown>[] } = { schedules: [] };
  await expect.poll(async () => {
    served = await (await page.request.get(`/progress/due?at=${future}`)).json() as typeof served;
    return served.schedules.length;
  }).toBeGreaterThan(0);
  for (const schedule of served.schedules) {
    expect(["new", "learning", "established"]).toContain(schedule.standing);
    expect(Object.keys(schedule).filter((key) => /ladder|rung|index|level|mastery|maturity|ratio|percent|streak|score/iu.test(key))).toEqual([]);
  }
  const standing = String(served.schedules[0]!.standing);
  const dueRoute = /\/progress\/due$/u;
  // The due date the page renders is the one in the payload it was served, not an earlier probe's.
  let rendered: { schedules: Record<string, unknown>[] } = { schedules: [] };
  const serve = (rewrite: (item: Record<string, unknown>) => Record<string, unknown>) => page.route(dueRoute, async (route) => {
    const response = await route.fetch({ url: `${route.request().url()}?at=${future}` });
    const body = await response.json() as { schedules: Record<string, unknown>[] };
    rendered = { ...body, schedules: body.schedules.map(rewrite) };
    await route.fulfill({ response, json: rendered });
  });

  await serve((item) => item);
  await page.goto("/learn");
  const due = page.locator('section[aria-labelledby="due-title"]');
  const label = due.getByRole("article").first().locator(".return-standing");
  await expect(label).toBeVisible();
  await expect(label).toHaveAttribute("data-return-standing", standing);
  await expect(label).toHaveText(`${standing} (based on how many spaced returns you've held)`);
  // Beside the due date: the word follows the date on the same line.
  const dueLabel = await page.evaluate((iso) => new Date(iso).toLocaleString(), String(rendered.schedules[0]!.dueAt));
  expect(await label.locator("xpath=..").textContent()).toContain(`${dueLabel} · ${standing} (based on`);

  // The page renders whichever closed word the server sends, and refuses a word outside the vocabulary.
  await page.unroute(dueRoute);
  await serve((item) => ({ ...item, standing: "established" }));
  await page.reload();
  await expect(due.getByRole("article").first().locator(".return-standing")).toHaveText("established (based on how many spaced returns you've held)");
  await page.unroute(dueRoute);
  await serve((item) => ({ ...item, standing: "mastered" }));
  await page.reload();
  await expect(page.getByRole("heading", { name: "This page is temporarily unavailable." })).toBeVisible();
  await expect(page.getByText("mastered")).toHaveCount(0);
  await expect(page.locator(".return-standing")).toHaveCount(0);
});

test("Outcome Drill resolves a non-terminal hold and remains playable", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Outcome hold browser fixture" });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await expect(page.getByText("No opponent move has been played yet.")).toBeVisible();
  await expect(page.getByText("Starting assessment from the drill author:", { exact: false })).toBeVisible();

  await move(page, "e2", "e4");
  await expect(page.getByText("Active line 2 turns")).toBeVisible();
  await move(page, "f2", "f3");
  await expect(page.getByRole("heading", { name: "Authored hold horizon" })).toBeVisible();
  await expect(page.getByText("without conceding the result", { exact: false })).toBeVisible();
  await expect(page.getByText("not a proof of the position", { exact: false })).toBeVisible();
  const checkpointSheet = page.getByRole("dialog");
  await expect(checkpointSheet.getByText("Deterministic mock opponent", { exact: false })).toHaveCount(0);
  await expect(checkpointSheet.getByText("Resistance played: Authored theory replies → Human-model replies", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Inspector" }).click();
  await expect(page.getByRole("region", { name: "Attempt conditions" })).toContainText("Deterministic mock opponent");
  await page.getByRole("button", { name: "Return to play" }).click();
  await clickMove(page, "f1", "b5");
  await expect(page.getByText("Active line 6 turns")).toBeVisible();
});

test("Outcome Drill can grade a terminal loss as successful resistance", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Outcome resist browser fixture" });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await move(page, "f2", "f3");
  await expect(page.getByRole("heading", { name: "Resistance horizon" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await clickMove(page, "g2", "g4");
  await expect(page.getByRole("heading", { name: "You lost." })).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("Objective · Objective reached"),
  ).toBeVisible();
});

test("@content Pack C summarizes the attempt and preserves the recorded opponent in Inspector", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Rook endings: holding 3 against 4" });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await expect(page.getByText("Eleven pieces are on the board", { exact: false })).toBeVisible();
  await expect(page.getByText("Resistance requested: Human-model replies", { exact: false })).toBeVisible();
  await expect(page.getByText("Resistance played: Human-model replies", { exact: false })).toBeVisible();
  await expect(page.getByRole("region", { name: "Support" })).toContainText("They are not FIDE, Lichess, or Chess.com ratings.");
  await expect(page.getByText("Deterministic mock opponent", { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "Inspector" }).click();
  await expect(page.getByRole("region", { name: "Attempt conditions" })).toContainText("Deterministic mock opponent");
});

interface LatencyEnvelope {
  readonly boardReadyMs: number;
  readonly rewindMs: number;
  readonly branchSwitchMs: number;
  readonly uncachedMockReplyMs: number;
  readonly cachedMockReplyMs: number;
}

function squarePoint(
  box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  square: string,
  orientation: "white" | "black" = "white",
): { readonly x: number; readonly y: number } {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  return {
    x: box.x + (((orientation === "white" ? file : 7 - file) + 0.5) * box.width) / 8,
    y: box.y + (((orientation === "white" ? 7 - rank : rank) + 0.5) * box.height) / 8,
  };
}

async function move(page: Page, from: string, to: string, orientation: "white" | "black" = "white", board: Locator = page.getByLabel("Chessboard")): Promise<void> {
  await expect(board).toBeVisible();
  await board.evaluate(
    (element) =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const box = await board.boundingBox();
  if (box === null) throw new Error("Chessground board has no bounding box");
  const origin = squarePoint(box, from, orientation);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await board.evaluate(
    (element) =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const selectedBox = await board.boundingBox();
  if (selectedBox === null) throw new Error("Chessground board has no selected bounding box");
  const destination = squarePoint(selectedBox, to, orientation);
  await page.mouse.move(destination.x, destination.y, { steps: 8 });
  await page.mouse.up();
}

async function clickMove(page: Page, from: string, to: string): Promise<void> {
  const board = page.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  await board.evaluate(
    (element) =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const box = await board.boundingBox();
  if (box === null) throw new Error("Chessground board has no bounding box");
  const origin = squarePoint(box, from);
  const submitted = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/runs\/[^/]+\/moves$/u.test(new URL(response.url()).pathname),
  );
  await page.mouse.click(origin.x, origin.y);
  await board.evaluate(
    (element) =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const selectedBox = await board.boundingBox();
  if (selectedBox === null) throw new Error("Chessground board has no selected bounding box");
  const destination = squarePoint(selectedBox, to);
  await page.mouse.click(destination.x, destination.y);
  const response = await submitted;
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON()).toMatchObject({ uci: `${from}${to}` });
  await expect(page.locator(".input-status")).toContainText("Move committed:");
}

async function liveClickMove(
  page: Page,
  uci: string,
  orientation: "white" | "black",
): Promise<void> {
  const board = page.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  const restingBox = await board.boundingBox();
  if (restingBox === null) throw new Error("Chessground board has no resting bounding box");
  const origin = squarePoint(restingBox, uci.slice(0, 2), orientation);
  const sourceHitsBoard = await board.evaluate(
    (element, point) => element.contains(document.elementFromPoint(point.x, point.y)),
    origin,
  );
  expect(sourceHitsBoard, `${uci} source must be hit-testable`).toBe(true);
  const submitted = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" && /\/runs\/[^/]+\/moves$/u.test(new URL(response.url()).pathname),
  );

  await page.mouse.click(origin.x, origin.y);
  await board.evaluate(
    (element) =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  const selectedBox = await board.boundingBox();
  if (selectedBox === null) throw new Error("Chessground board has no selected bounding box");
  const destination = squarePoint(selectedBox, uci.slice(2, 4), orientation);
  await page.mouse.click(destination.x, destination.y);

  const response = await submitted;
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON()).toMatchObject({ uci });
  await expect(page.locator(".input-status")).toContainText("Move committed:");
}

type BoardInputMode = "click" | "drag" | "touch" | "keyboard" | "text";

function displayedSquarePoint(
  from: string,
  to: string,
  orientation: "white" | "black",
): { readonly file: number; readonly rank: number } {
  const file = to.charCodeAt(0) - from.charCodeAt(0);
  const rank = Number(to[1]) - Number(from[1]);
  return orientation === "white"
    ? { file, rank: -rank }
    : { file: -file, rank };
}

async function navigateGrid(
  page: Page,
  from: string,
  to: string,
  orientation: "white" | "black",
): Promise<void> {
  const delta = displayedSquarePoint(from, to, orientation);
  const horizontal = delta.file > 0 ? "ArrowRight" : "ArrowLeft";
  const vertical = delta.rank > 0 ? "ArrowDown" : "ArrowUp";
  for (let index = 0; index < Math.abs(delta.file); index += 1) await page.keyboard.press(horizontal);
  for (let index = 0; index < Math.abs(delta.rank); index += 1) await page.keyboard.press(vertical);
}

async function liveInputMove(
  page: Page,
  uci: string,
  orientation: "white" | "black",
  mode: BoardInputMode,
): Promise<void> {
  if (mode === "click") return liveClickMove(page, uci, orientation);
  const submitted = page.waitForResponse(
    (response) => response.request().method() === "POST" && /\/runs\/[^/]+\/moves$/u.test(new URL(response.url()).pathname),
  );
  if (mode === "text") {
    await page.locator(".text-move summary").click();
    await page.getByLabel("Move in chess notation").fill(uci);
    await page.getByRole("button", { name: "Submit move" }).click();
  } else if (mode === "keyboard") {
    const grid = page.getByRole("grid", { name: /Board input/u });
    await grid.focus();
    const active = await grid.getAttribute("aria-activedescendant");
    if (active === null) throw new Error("Semantic board has no active descendant");
    const activeSquare = /-square-([a-h][1-8])$/u.exec(active)?.[1];
    if (activeSquare === undefined) throw new Error(`Semantic board has an invalid active descendant: ${active}`);
    await navigateGrid(page, activeSquare, uci.slice(0, 2), orientation);
    await page.keyboard.press("Enter");
    await navigateGrid(page, uci.slice(0, 2), uci.slice(2, 4), orientation);
    await page.keyboard.press("Enter");
    const gridElement = await grid.elementHandle();
    if (gridElement === null) throw new TypeError("Semantic board disappeared after move submission");
    await page.waitForFunction((element) => {
      const modal = document.querySelector<HTMLElement>('[role="dialog"][aria-modal="true"]');
      return document.activeElement === element || (modal !== null && modal.contains(document.activeElement));
    }, gridElement);
    const focusState = await grid.evaluate((element) => {
      const active = document.activeElement;
      const modal = active instanceof HTMLElement
        ? active.closest<HTMLElement>('[role="dialog"][aria-modal="true"]')
        : null;
      return modal === null
        ? { owner: "grid", valid: active === element }
        : { owner: "modal", valid: modal.contains(active) && element.closest("[inert]") !== null };
    });
    expect(focusState.valid, `${focusState.owner} must own focus after keyboard submission`).toBe(true);
    await expect(grid).toHaveAttribute("aria-activedescendant", new RegExp(`-square-${uci.slice(2, 4)}$`, "u"));
    expect(await grid.evaluate((element) => {
      const id = element.getAttribute("aria-activedescendant");
      return id !== null && element.querySelector(`#${CSS.escape(id)}`) !== null;
    })).toBe(true);
  } else {
    const board = page.getByLabel("Chessboard");
    await expect(board).toBeVisible();
    const resting = await board.boundingBox();
    if (resting === null) throw new Error("Chessground board has no resting bounding box");
    const origin = squarePoint(resting, uci.slice(0, 2), orientation);
    if (mode === "drag") {
      await page.mouse.move(origin.x, origin.y);
      await page.mouse.down();
    } else {
      await page.touchscreen.tap(origin.x, origin.y);
    }
    await board.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
    );
    const selected = await board.boundingBox();
    if (selected === null) throw new Error("Chessground board has no selected bounding box");
    const destination = squarePoint(selected, uci.slice(2, 4), orientation);
    if (mode === "drag") {
      await page.mouse.move(destination.x, destination.y, { steps: 8 });
      await page.mouse.up();
    } else {
      await page.touchscreen.tap(destination.x, destination.y);
    }
  }
  const response = await submitted;
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON()).toMatchObject({ uci });
  await expect(page.locator(".input-status")).toContainText("Move committed:");
}

test("@content served Najdorf pack plays, rewinds, branches, compares, and exports", async ({
  page,
}) => {
  const list = await page.request.get("/packs");
  expect(list.ok()).toBe(true);
  const served = (await list.json()) as {
    id: string;
    reviewStatus: string;
  }[];
  const schemaExample = served.find((candidate) => candidate.reviewStatus === "schema_example");
  expect(schemaExample).toBeDefined();
  const detail = await page.request.get(`/packs/${schemaExample!.id}`);
  expect(detail.ok()).toBe(true);
  const projectedPack = await detail.json();
  expect(projectedPack.opponentPolicy.mode).toBe("human_common");
  expect(JSON.stringify(projectedPack)).not.toContain(
    "Schema example only; classification requires review.",
  );

  await expect(schemaPackCard(page)).toContainText("Example content");
  const boardStart = await page.evaluate(() => performance.now());
  await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
    .click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  const boardReadyMs =
    (await page.evaluate(() => performance.now())) - boardStart;
  await page.getByRole("button", { name: "Inspector" }).click();
  const structuralReading = page.getByRole("button", { name: "Position structure" });
  await expect(structuralReading).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".structural-facts")).toHaveCount(0);
  await structuralReading.click();
  await expect(page.locator(".structural-facts")).toBeVisible();
  await expect(page.locator(".structural-facts p").first()).toBeVisible();
  await structuralReading.click();
  await page.getByRole("button", { name: "Return to play" }).click();

  await move(page, "c1", "e3");
  await expect(page.getByRole("heading", { name: "Choose the setup" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Predict the reply" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Active line 2 turns")).toBeVisible();

  await move(page, "f2", "f3");
  await expect(
    page.getByRole("heading", { name: "Critical race resolved" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  const rewindStart = await page.evaluate(() => performance.now());
  await page.keyboard.press("r");
  await expect(page.getByText("Active line 2 turns")).toBeVisible();
  const rewindMs =
    (await page.evaluate(() => performance.now())) - rewindStart;

  await page.keyboard.press("b");
  await page.getByLabel("Short name").fill("quiet setup");
  await page.getByLabel("What are you trying?").fill("Compare a lower-commitment setup");
  await page.getByRole("button", { name: "Create branch" }).click();
  await clickMove(page, "d1", "d2");
  await expect(page.getByText("Active line 4 turns")).toBeVisible();

  const branchStart = await page.evaluate(() => performance.now());
  await page.getByRole("button", { name: /Switch to branch 1: main/ }).click();
  await expect(page.locator(".rail li.active strong")).toHaveText("main");
  const branchSwitchMs =
    (await page.evaluate(() => performance.now())) - branchStart;
  await page.getByRole("button", { name: /Switch to branch 2: quiet setup/ }).click();
  await expect(page.locator(".rail li.active strong")).toHaveText("quiet setup");
  await expect(page.getByText(/evidence waiting/)).toHaveCount(0, {
    timeout: 5_000,
  });

  await page.locator("main.drill").focus();
  await page.keyboard.press("Alt+C");
  await expect(
    page.getByRole("heading", { name: "Same decision, two consequences." }),
  ).toBeVisible();
  await expect(
    page.getByText("The comparison is already at its first aligned position."),
  ).toBeVisible();
  await expect(page.locator(".boards article")).toHaveCount(1);
  await expect(page.locator(".boards article.shared")).toContainText("Shared recorded position · 2 attempts");
  await expect(page.getByRole("heading", { name: "Where the attempts split" })).toBeVisible();
  await expect(page.locator(".divergence [aria-label='Chessboard']")).toBeVisible();
  await expect(page.locator(".divergence").getByText("Compare a lower-commitment setup", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recorded differences by branch" })).toHaveCount(0);
  await expect(page.getByText("active → achieved")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Grounded comparison" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Grounded comparison" }).getByText("All attempts share this fork position.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "quiet setup" })).toHaveCount(2);
  const comparisonInspectorButton = page.getByRole("button", { name: "Evidence inspector" });
  await comparisonInspectorButton.click();
  await expect(page.getByRole("dialog", { name: "Recorded facts behind this comparison" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recorded differences by branch" })).toBeVisible();
  const evaluationAxis = page.locator('[data-evidence-consumer="compare.engine_trajectory"]');
  await expect(evaluationAxis).toHaveCount(1);
  await expect(evaluationAxis.locator("tbody tr")).not.toHaveCount(0);
  await expect(evaluationAxis.locator("thead th")).toHaveText(["Position", "quiet setup", "main"]);
  await expect(evaluationAxis.locator('.evidence-cell[data-ply-offset="0"] [data-component="magnitude"]')).toHaveCount(2);
  // Two readings belong to the fork, not the entire asynchronously populated trajectory.
  // Later recorded positions stay on the same two-column axis with literal absence.
  expect(await evaluationAxis.locator("tbody tr").evaluateAll((rows) => rows.every((row) => {
    const cells = [...row.querySelectorAll("td.evidence-cell")];
    return cells.length === 2 && cells.every((cell) =>
      cell.querySelectorAll('[data-component="magnitude"]').length + cell.querySelectorAll(".no-record").length === 1);
  }))).toBe(true);
  await expect(page.locator(".sparkline")).toHaveCount(0);
  await expect.poll(() =>
    page.locator(".strip-band article").evaluateAll((articles) =>
      articles.every((article) => {
        const details = article.querySelectorAll("details");
        const facts = details[0]?.querySelectorAll("p").length ?? 0;
        const routes = [...(details[1]?.querySelectorAll("p") ?? [])];
        return facts > 0 && routes.length > 0 && routes.every((route) => !route.textContent?.includes("No piece route"));
      }),
    ),
  ).toBe(true);
  await expect(page.getByText("active → achieved")).toBeVisible();
  await expect(
    page.getByText("Checkpoint reached: Critical race resolved."),
  ).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Recorded facts behind this comparison" })).toContainText(
    "This branch reached an objective endpoint; no learner game result was recorded.",
  );
  await expect(page.locator(".fork-marker")).toHaveText("Fork");
  await expect(
    page.locator('.evidence-cell[data-ply-offset="0"] [data-component="magnitude"]'),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "Return to comparison" }).click();
  await expect(comparisonInspectorButton).toBeFocused();

  await page
    .getByRole("heading", { name: "Same decision, two consequences." })
    .focus();
  const downloadPromise = page.waitForEvent("download");
  const pgnResponsePromise = page.waitForResponse(
    (response) => response.url().includes("/pgn"),
    { timeout: 5_000 },
  );
  await page.keyboard.press("e");
  const pgnResponse = await pgnResponsePromise;
  expect(pgnResponse.ok(), await pgnResponse.text()).toBe(true);
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (downloadPath === null) throw new Error("PGN download did not reach disk");
  const pgn = await (await import("node:fs/promises")).readFile(downloadPath, "utf8");
  expect(pgn).toContain('[Event "Tabiya drill: najdorf-transition-schema-example"]');
  expect(pgn).toMatch(/\([^)]*\)/);

  await page.getByRole("button", { name: "Close comparison" }).click();
  await expect(page.locator("main.drill")).toBeFocused();
  await expect(page.locator("#primary-navigation")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Same decision, two consequences." }),
  ).toHaveCount(0);
  await page.locator("main.drill").focus();
  await page.keyboard.press("g");
  await page.keyboard.press("m");
  await expect(page.locator("main.drill")).toBeFocused();

  const selectorLatency = await page.evaluate(async () => {
    const packResponse = await fetch("/packs");
    const packs = (await packResponse.json()) as {
      id: string;
      digest: string;
      reviewStatus: string;
    }[];
    const schemaExample = packs.find((candidate) => candidate.reviewStatus === "schema_example")!;
    const packDetail = await fetch(`/packs/${schemaExample.id}`);
    const pack = await packDetail.json();
    const body = JSON.stringify({
      startFen: pack.start.fen,
      historyUci: ["c1e3"],
      policy: {
        mode: "human_common",
        policyConfigDigest: schemaExample.digest,
        targetElo: 1800,
      },
      seed: 901,
    });
    const select = async () => {
      const started = performance.now();
      const response = await fetch("/select-move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      if (!response.ok) throw new Error(await response.text());
      await response.json();
      return performance.now() - started;
    };
    return { uncached: await select(), cached: await select() };
  });

  const latency: LatencyEnvelope = {
    boardReadyMs,
    rewindMs,
    branchSwitchMs,
    uncachedMockReplyMs: selectorLatency.uncached,
    cachedMockReplyMs: selectorLatency.cached,
  };
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/browser-latency.json",
    `${JSON.stringify(latency, null, 2)}\n`,
  );
  console.log(`BROWSER_LATENCY ${JSON.stringify(latency)}`);

  for (const measurement of Object.values(latency)) {
    expect(Number.isFinite(measurement)).toBe(true);
    expect(measurement).toBeGreaterThanOrEqual(0);
  }
});

test("branch group captures three candidates, rotates, recovers evidence, compares, and exports", async ({ page }) => {
  await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
    .click();
  await move(page, "c1", "e3");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Active line 2 turns")).toBeVisible();

  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("button", { name: "Branch group" }).click();
  await expect(page.getByRole("heading", { name: "Create a branch group" })).toBeVisible();
  await move(page, "f2", "f3");
  await move(page, "h2", "h3");
  await move(page, "a2", "a3");
  await expect(page.locator(".candidate-chips button")).toHaveCount(3);
  await expect(page.locator(".candidate-chips")).toContainText("f3");
  await expect(page.locator(".candidate-chips")).toContainText("h3");
  await expect(page.locator(".candidate-chips")).toContainText("a3");
  expect(await page.locator(".candidate-chips").innerText()).not.toMatch(/\b[a-h][1-8][a-h][1-8][qrbn]?\b/u);
  await page.getByRole("button", { name: "Create group" }).click();

  await expect(page.getByText("Branch group · 3 candidates")).toBeVisible();
  await expect(page.locator("[data-group-member]")).toHaveCount(3);
  await expect(page.locator(".group-marker")).toHaveCount(3);
  await expect(page.getByText("Fixed resistance: within this group, the same position always receives the same reply.")).toBeVisible();

  // Each seed starts at ply three in this four-ply pack. Creating or entering a
  // member runs its opponent reply, so rotate only after resolving that member's
  // checkpoint; attempting another learner move would be a terminal-run error.
  await expect(page.locator(".rail li.active strong")).toHaveText("f3");
  await expect(page.getByText("Board paused", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Next member" }).click();
  await expect(page.locator(".rail li.active strong")).toHaveText("h3");
  await page.getByLabel("Advance").selectOption("lockstep");
  await clickMove(page, "f2", "f3");
  await expect(page.locator(".rail li.active strong")).toHaveText("a3");
  await expect(page.locator(".rail li.active .group-marker")).toBeVisible();
  await clickMove(page, "d1", "d2");
  if (await page.getByRole("button", { name: "Continue" }).isVisible().catch(() => false)) await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Boards" }).click();
  await expect(page.locator("[data-group-member] [aria-label='Chessboard']")).toHaveCount(3);
  const missing = page.getByText("Comparison details are not ready for this branch.");
  await expect(missing.first()).toBeVisible();
  await page.getByRole("button", { name: "Prepare missing comparisons" }).click();
  await expect(missing).toHaveCount(0, { timeout: 5_000 });

  await page.getByRole("button", { name: "Compare group" }).click();
  await expect(page.getByRole("heading", { name: "Same decision, 3 consequences." })).toBeVisible();
  await expect(page.locator(".boards article")).toHaveCount(1);
  await expect(page.locator(".boards article.shared")).toContainText("Shared recorded position · 3 attempts");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("heading", { name: "Same decision, 3 consequences." }).focus();
  await page.keyboard.press("e");
  const download = await downloadPromise;
  const path = await download.path();
  if (path === null) throw new Error("Group PGN download did not reach disk");
  const pgn = await (await import("node:fs/promises")).readFile(path, "utf8");
  expect((pgn.match(/\(/gu) ?? []).length).toBeGreaterThanOrEqual(2);
});

test("@content Pack A withholds its line, grades the boundary, and renders authored theory", async ({
  page,
}) => {
  const card = page
    .getByRole("article")
    .filter({ hasText: "Caro-Kann Advance: winning the c5 race" });
  await expect(card).toBeVisible();
  const projected = await page.request.get("/packs/anti-caro-advance-c5-race");
  expect(projected.ok(), await projected.text()).toBe(true);
  expect((await projected.json()).spine).toEqual([]);
  await card.getByRole("button", { name: /Rehearse this position/ }).click();

  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByText("Active line 1 turn")).toBeVisible();
  await expect(page.getByText("Commentary opens at a checkpoint", { exact: true })).toBeVisible();
  await move(page, "g1", "f3");
  await expect(page.getByText("Active line 3 turns")).toBeVisible();
  await move(page, "f1", "e2");

  await expect(
    page.getByRole("heading", { name: "Choose your plan before the break lands" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Authored commentary" })).toBeVisible();
  await expect(
    page.getByText("The whole point of the Caro-Kann", { exact: false }),
  ).toBeVisible();
  await expect(page.getByText("Develop first. The Short System", { exact: false })).toBeVisible();
  await expect(page.getByText("on the authored line", { exact: false }).first()).toBeVisible();
  await expect(
    page.getByText("Hold the centre and finish developing", { exact: false }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Active line 5 turns")).toBeVisible();
  await expect(page.getByRole("heading", { name: "...c5 has landed" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await move(page, "e1", "g1");
  const boundarySheet = page.getByRole("dialog");
  await expect(boundarySheet.getByRole("heading", { name: "You are past the authored line" })).toBeVisible();
  await expect(boundarySheet.getByText("concept_violation", { exact: false })).toHaveCount(0);
  await expect(boundarySheet.getByText("the pack has authored commentary about this alternative", { exact: false })).toBeVisible();
  const authoredAlternative = boundarySheet
    .getByRole("listitem")
    .filter({ hasText: "Alternative move" });
  await expect(authoredAlternative).toBeVisible();
  await expect(authoredAlternative.locator("p")).not.toHaveText("");
  await expect(page.getByText("Objective · Objective weakened", { exact: false })).toBeVisible();
  await expect(boundarySheet.getByText("Resistance played: Authored theory replies", { exact: false })).toBeVisible();
});

test("Line Drill crosses a cap on-line, continues, and renders unknown honestly", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Line Drill boundary browser fixture" });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await expect(page.getByText("Resistance requested: Authored theory replies", { exact: false })).toBeVisible();
  await expect(page.getByText("No opponent move has been played yet.")).toBeVisible();

  await move(page, "c1", "e3");
  await expect(page.getByText("Active line 2 turns")).toBeVisible();
  await move(page, "f2", "f3");
  await expect(page.getByRole("heading", { name: "The authored support cap is crossed" })).toBeVisible();
  await expect(page.getByText("Rehearsal step 1, Be3: on the authored line.")).toBeVisible();
  await expect(page.getByText("Rehearsal step 2, e6: on the authored line.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Active line 4 turns")).toBeVisible();

  await move(page, "a2", "a3");
  await expect(page.getByRole("heading", { name: "The pack is silent here" })).toBeVisible();
  await expect(page.getByText("Rehearsal step 5, a3: this pack has no statement about this move.")).toBeVisible();
  await expect(page.getByText("Unknown is not a judgement", { exact: false })).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Resistance played: Authored theory replies", { exact: false })).toBeVisible();
  await expect(page.getByText("predate policy recording", { exact: false })).toHaveCount(0);
});

test("a granted spectator follows a run without receiving a write control", async ({
  page,
  browser,
}) => {
  const card = page
    .getByRole("article")
    .filter({ hasText: "Caro-Kann Advance: winning the c5 race" });
  await card.getByRole("button", { name: /Rehearse this position/ }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  const runId = decodeURIComponent(new URL(page.url()).pathname.split("/").at(-1)!);
  const writerId = await page.evaluate((id) =>
    localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
  expect(writerId).not.toBeNull();

  const spectatorContext = await browser.newContext();
  const spectator = await spectatorContext.newPage();
  const spectatorHandle = await register(spectator);
  const grant = await page.request.post(`/runs/${encodeURIComponent(runId)}/grants`, {
    headers: { "x-writer-id": writerId! },
    data: { op: "grant", handle: spectatorHandle, role: "spectator" },
  });
  expect(grant.ok(), await grant.text()).toBe(true);

  await spectator.goto(`/play/run/${encodeURIComponent(runId)}`);
  await expect(spectator.getByLabel("Chessboard")).toBeVisible();
  await expect(spectator.getByText("Watching", { exact: true })).toBeVisible();
  const reviewAccess = spectator.getByRole("complementary", { name: "Review access" });
  await expect(reviewAccess).toContainText("Review tools open after this attempt reaches its recorded outcome");
  await expect(reviewAccess).toContainText("Read access remains available now");
  await expect(spectator.getByRole("button", { name: "Take the board on this device" })).toHaveCount(0);
  await spectator.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(spectator.getByRole("button", { name: /^Fork/ })).toBeDisabled();
  await expect(spectator.getByRole("button", { name: "Branch group" })).toBeDisabled();

  await move(page, "g1", "f3");
  await expect(page.getByText("Active line 3 turns")).toBeVisible();
  await expect(spectator.getByText("Active line 3 turns")).toBeVisible({ timeout: 4_000 });
  await move(page, "f1", "e2");
  await expect(page.getByRole("heading", { name: "Choose your plan before the break lands" })).toBeVisible();
  await expect(spectator.getByText("Active line 4 turns")).toBeVisible({ timeout: 4_000 });
  await spectator.getByRole("button", { name: /^Rehearsal step 4:/ }).click();
  await expect(spectator.getByText("Your attempt is kept. Going back makes a second one.")).toBeVisible();
  const rewind = spectator.getByRole("button", { name: /^Rewind to preview/ });
  await expect(rewind).toBeDisabled();
  await expect(rewind).toHaveAttribute("aria-describedby", "timeline-rewind-readonly");
  await spectatorContext.close();
});

test("@matrix a held touch survives selection layout frames and commits the exact endgame move", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, hasTouch: true, isMobile: true });
  try {
    const page = await context.newPage();
    await enableEndgamePolicies(page);
    await register(page);
    const pack = ENDGAME_INTERACTION_PACKS[1];
    await page.getByRole("article").filter({ hasText: pack.title })
      .getByRole("button", { name: /Rehearse this position/ }).click();
    await expect(page.getByRole("grid", { name: /Board input.*playable/u })).toBeVisible();
    const board = page.getByLabel("Chessboard");
    const subtree = await board.locator("cg-board").elementHandle();
    if (subtree === null) throw new Error("Chessground has no interactive subtree");
    const bounds = await board.boundingBox();
    if (bounds === null) throw new Error("Chessground has no board bounds");
    const origin = squarePoint(bounds, "h6", "black");
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [origin] });
    await expect(page.locator(".input-status")).toContainText("Square h6 selected.");
    await board.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    }));
    // A geometry repair must not detach the target before its touchend can reach Chessground.
    expect(await subtree.evaluate((element) => element.isConnected)).toBe(true);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    const settled = await board.boundingBox();
    if (settled === null) throw new Error("Chessground disappeared after the origin touch");
    const submitted = page.waitForResponse((response) => response.request().method() === "POST"
      && /\/runs\/[^/]+\/moves$/u.test(new URL(response.url()).pathname));
    const destination = squarePoint(settled, "b6", "black");
    await page.touchscreen.tap(destination.x, destination.y);
    const response = await submitted;
    expect(response.ok()).toBe(true);
    expect(response.request().postDataJSON()).toMatchObject({ uci: pack.uci });
    await expect(page.locator(".input-status")).toContainText("Move committed:");
  } finally {
    await context.close();
  }
});

test("@matrix every shell route owns the viewport at supported desktop and tablet projections", async ({
  page,
}) => {
  const projections = [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
  ] as const;

  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
      .click();
    await expect(page.getByLabel("Chessboard")).toBeVisible();
    const runPath = new URL(page.url()).pathname;
    const routes = [
      "/",
      "/play",
      runPath,
      "/review",
      "/learn",
      "/live",
      "/create",
      "/library",
      "/settings",
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByText("Loading Tabiya…")).toHaveCount(0);
      // The shell clips the document and each long route owns its own scroll.
      // A scrollHeight larger than the viewport is expected for Settings; it
      // is not document scrolling while the root and shell boundary are hidden.
      const dimensions = await page.evaluate(() => ({
        rootOverflow: getComputedStyle(document.documentElement).overflowY,
        appOverflow: getComputedStyle(document.querySelector<HTMLElement>("#app")!).overflowY,
        shellOverflow: getComputedStyle(document.querySelector<HTMLElement>(".shell")!).overflowY,
        shellHeight: document.querySelector<HTMLElement>(".shell")!.getBoundingClientRect().height,
        viewportHeight: window.innerHeight,
      }));
      expect(dimensions.rootOverflow, `${route} root overflow`).toBe("hidden");
      expect(dimensions.appOverflow, `${route} app overflow`).toBe("hidden");
      expect(dimensions.shellOverflow, `${route} shell overflow`).toBe("hidden");
      expect(dimensions.shellHeight, `${route} shell height`).toBeLessThanOrEqual(dimensions.viewportHeight + 1);

      if (route === runPath) {
        await assertRunViewport(page, viewport);
        if (viewport.width === 768) {
          expect((await page.getByLabel("Chessboard").boundingBox())!.width).toBeGreaterThanOrEqual(400);
          await expect(page.locator(".rail-stack")).toBeVisible();
          await expect(page.locator(".timeline-strip")).toBeVisible();
        }
      }
    }
  }
});

test("@matrix play composition keeps one exact board rectangle through reachable states and records successful cells", async ({ page }, testInfo) => {
  const projections = [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 360, height: 680 },
  ] as const;

  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await schemaPackCard(page)
      .getByRole("button", { name: /Rehearse this position/ })
      .click();
    await assertRunViewport(page, viewport);
    const calm = await page.getByLabel("Chessboard").boundingBox();
    expect(calm).not.toBeNull();
    await expect(page.locator(".companion-section:visible")).toHaveCount(viewport.width <= 719 ? 0 : 1);
    await attachCompositionCell(page, testInfo, viewport, "01-calm-rest");

    for (const region of ["Support", "Branches", "Actions"] as const) {
      await page.getByRole("button", { name: region, exact: true }).click();
      const regionLabel = region === "Actions" ? "Run actions" : region;
      await expect(page.getByRole("region", { name: regionLabel, exact: true })).toBeVisible();
      await expect(page.locator(".companion-section:visible")).toHaveCount(1);
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
      if (viewport.width <= 719) {
        // A11-b1 (D1566): the phone's one open region sits below the board and never covers it.
        const sheet = await page.getByRole("dialog", { name: "Run companion" }).boundingBox();
        expect(sheet).not.toBeNull();
        expect(sheet!.y).toBeGreaterThanOrEqual(calm!.y + calm!.height - 0.5);
        expect(sheet!.height).toBeGreaterThanOrEqual(160);
        await page.getByRole("button", { name: "Collapse companion" }).click();
      }
    }

    await page.locator("details.assistance-control summary").click();
    await expect(page.locator("details.assistance-control")).toHaveAttribute("open", "");
    await expect(page.getByRole("dialog", { name: "Choose help style" })).toBeVisible();
    await expect(page.locator(".workspace")).toHaveAttribute("inert", "");
    await page.getByRole("button", { name: "Advanced support controls", exact: true }).focus();
    await page.keyboard.press("Tab");
    await expect(page.locator("details.assistance-control summary")).toBeFocused();
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "07-menu-popover-open");
    await page.keyboard.press("Escape");
    await expect(page.locator("details.assistance-control")).not.toHaveAttribute("open", "");
    await expect(page.locator(".workspace")).not.toHaveAttribute("inert", "");
    await expect(page.locator("details.assistance-control summary")).toBeFocused();

    await attachCompositionCell(page, testInfo, viewport, "08-long-objective");

    await page.locator(".text-move summary").click();
    await expect(page.getByLabel("Move in chess notation")).toBeVisible();
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "16-keyboard-text-entry-active");
    await page.locator(".text-move summary").click();

    await page.getByRole("button", { name: "Inspector" }).click();
    await expect(page.getByRole("dialog", { name: "Evidence inspector" })).toBeVisible();
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "10-inspector-open");
    await page.getByRole("button", { name: "Return to play" }).click();

    if (viewport.width <= 1023) {
      await page.locator(".objective-line").click();
      await expect(page.getByRole("dialog", { name: /Select a setup/ })).toBeVisible();
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
      await page.getByRole("button", { name: "Return to the board" }).click();
    }

    if (viewport.width <= 719) {
      await page.getByRole("button", { name: "Branches" }).click();
      await expect(page.locator(".rail-stack")).toHaveClass(/sheet-open/);
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
      await page.getByRole("button", { name: "Collapse companion" }).click();
    }

    // State 2 is requested sight: the sight module's seat under a style that composes it.
    await choosePreset(page, /Guide me/u);
    const selectedPoint = squarePoint(calm!, "d4");
    await page.mouse.click(selectedPoint.x, selectedPoint.y);
    await showSupport(page);
    const selectedSight = page.locator('[data-module="sight_on_request"] .seat-card');
    await expect(selectedSight.locator("[data-presented], .stated-empty").first()).toBeVisible();
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "02-square-selected");
  }
});

test("selected-square support clears with the visible selection and displayed position", async ({ page }) => {
  await page.goto("/play");
  await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
    .click();

  const board = page.getByLabel("Chessboard");
  const box = await board.boundingBox();
  if (box === null) throw new Error("Chessground board has no bounding box");
  const d4 = squarePoint(box, "d4");
  await choosePreset(page, /Guide me/u);
  const selectedSight = page.locator('[data-module="sight_on_request"] .seat-card').locator("[data-presented], .stated-empty");

  await page.mouse.click(d4.x, d4.y);
  await expect(selectedSight.first()).toBeVisible();
  const selectedBox = await board.boundingBox();
  if (selectedBox === null) throw new Error("Chessground board has no selected-state bounding box");
  const selectedD4 = squarePoint(selectedBox, "d4");
  await page.mouse.click(selectedD4.x, selectedD4.y);
  await expect(selectedSight).toHaveCount(0);

  await move(page, "d4", "b5");
  await expect(page.getByText("Active line 2 turns")).toBeVisible();
  await expect(selectedSight).toHaveCount(0);

  const movedBox = await board.boundingBox();
  if (movedBox === null) throw new Error("Chessground board has no moved bounding box");
  const b5 = squarePoint(movedBox, "b5");
  await page.mouse.click(b5.x, b5.y);
  await expect(selectedSight.first()).toBeVisible();
  await page.getByRole("button", { name: /^Rehearsal step 1:/u }).click();
  await expect(page.getByText("Preview", { exact: true })).toBeVisible();
  await expect(selectedSight).toHaveCount(0);
});

// rfc/play-composition.md §6 states 3, 5, 9 and 13 — the module-emitter-dependent columns — over
// real module seats fed by the module query route (module-registration §2.5.2). The adjacent
// state-6 journey uses the real hint-distance request/poll protocol at the permitted final rung.
// The Scholar's-mate trap is a Just Play position the learner (Black) plays under Support.
const SCHOLAR_TRAP = "r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3";

test("@matrix A4 Inspector carries actual admitted local evidence and returns it to its explicit home", async ({ page }, testInfo) => {
  await page.getByLabel("Your side").selectOption("black");
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill(SCHOLAR_TRAP);
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await choosePreset(page, /Guide me/u);
  await showSupportTools(page);
  await page.getByRole("button", { name: "Show support for this position" }).click();
  await openAdvancedSupport(page);
  const full = page.getByRole("checkbox", { name: "Full inspector", exact: true });
  await expect(full).toBeEnabled();
  const response = page.waitForResponse(r => r.url().endsWith("/modules/query") && r.request().postDataJSON().query.requested?.includes("full_inspector"));
  await full.check();
  const raw = await (await response).json() as { page: ModuleQueryPage };
  const packet = raw.page.packets.find(p => p.module === "full_inspector");
  expect(packet).toBeDefined();
  expect(packet!.receipt.protocol).toBe("presentation.receipt@1");
  const items = packet!.receipt.items;
  expect(items.length).toBeGreaterThan(0);
  const inspector = page.locator(".full-inspector");
  const mounted = inspector.locator("[data-presented]");
  await expect(mounted).toHaveCount(items.length);
  // Observe the real HTTP wire and the client's strict parser/renderer together. Never
  // import the full server runtime into the browser driver or manufacture a sealed item.
  expect(items.filter(item => item.component.id === "fact_statement").length).toBeGreaterThan(0);
  for (const [index, item] of items.entries()) {
    await expect(mounted.nth(index)).toHaveAttribute("data-presented", item.component.id);
    await expect(mounted.nth(index)).not.toBeEmpty();
    if (item.component.id === "fact_statement") await expect(mounted.nth(index)).toHaveText(item.component.operand.renderedText);
    if (item.component.id === "square_set") await expect(mounted.nth(index)).toContainText(item.component.operand.caption.renderedText);
  }
  expect(packet!.empty?.kind).toBe("family_partitioned");
  if (packet!.empty?.kind === "family_partitioned") expect(packet!.empty.families.find(f => f.family === "local_rules")?.kind).toBe("available");
  await testInfo.attach("actual-inspector-receipt", { body: JSON.stringify(packet!.receipt), contentType: "application/json" });
  await expect(inspector.locator("[data-family-state]")).toHaveCount(8);
  const before = await inspectCompositionVocabulary(page, "actual-inspector-positive");
  expect(before.inspectorTextNodes).toBeGreaterThan(0);
  expect(before.leaks).toEqual([]);
  await page.getByRole("button", { name: "Return to play" }).click();
  await expect(page.locator(".inspector-surface")).toHaveCount(0);
  const after = await inspectCompositionVocabulary(page, "actual-inspector-closed");
  expect(after.inspectorTextNodes).toBe(0);
  expect(after.leaks).toEqual([]);
});

async function openFullInspectorRun(page: Page): Promise<void> {
  await page.getByLabel("Your side").selectOption("black");
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill(SCHOLAR_TRAP);
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await choosePreset(page, /Guide me/u);
  await showSupportTools(page);
  await page.getByRole("button", { name: "Show support for this position" }).click();
  await openAdvancedSupport(page);
}

function isFullInspectorResponse(response: { url(): string; request(): { postDataJSON(): { query?: { requested?: string[] } } } }): boolean {
  return response.url().endsWith("/modules/query") && response.request().postDataJSON().query?.requested?.includes("full_inspector") === true;
}

async function assertFullInspectorPacket(page: Page, packet: ModuleQueryPage["packets"][number]): Promise<void> {
  const inspector = page.locator(".full-inspector");
  const mounted = inspector.locator("[data-presented]");
  await expect(mounted).toHaveCount(packet.receipt.items.length);
  expect(packet.receipt.items.length).toBeGreaterThan(0);
  for (const [index, item] of packet.receipt.items.entries()) {
    await expect(mounted.nth(index)).toHaveAttribute("data-presented", item.component.id);
    if (item.component.id === "square_set") await expect(mounted.nth(index)).toContainText(item.component.operand.caption.renderedText);
    if (item.component.id === "fact_statement") await expect(mounted.nth(index)).toHaveText(item.component.operand.renderedText);
    await expect(mounted.nth(index)).not.toBeEmpty();
  }
  await expect(inspector.locator("[data-family-state]")).toHaveCount(8);
  await expect(inspector.getByRole("alert")).toHaveCount(0);
}

async function openThreatSeatRun(page: Page): Promise<void> {
  await page.getByLabel("Your side").selectOption("black");
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill(SCHOLAR_TRAP);
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await choosePreset(page, /^Support Staged/u);
  await showSupportTools(page);
  await page.getByRole("button", { name: "Show support for this position" }).click();
  await page.locator('[data-module="threat_radar"] .seat-row').click();
}

function isThreatResponse(response: { url(): string; request(): { postDataJSON(): { query?: { requested?: string[] } } } }): boolean {
  return response.url().endsWith("/modules/query") && response.request().postDataJSON().query?.requested?.includes("threat_radar") === true;
}

async function assertThreatPacket(page: Page, packet: ModuleQueryPage["packets"][number]): Promise<void> {
  const seat = page.locator('[data-module="threat_radar"]');
  const items = seat.locator("[data-presented]");
  expect(packet.receipt.items.length).toBeGreaterThan(0);
  await expect(items).toHaveCount(packet.receipt.items.length);
  for (const [index, item] of packet.receipt.items.entries()) {
    await expect(items.nth(index)).toHaveAttribute("data-presented", item.component.id);
    if (item.component.id === "fact_statement") await expect(items.nth(index)).toHaveText(item.component.operand.renderedText);
    if (item.component.id === "square_set") await expect(items.nth(index)).toContainText(item.component.operand.caption.renderedText);
    await expect(items.nth(index)).not.toBeEmpty();
  }
  await expect(seat.getByRole("alert")).toHaveCount(0);
}

test("Support seats retire completed and delayed old-help packets without unsolicited requests", async ({ page }, testInfo) => {
  await openThreatSeatRun(page);
  const seat = page.locator('[data-module="threat_radar"]');
  const firstResponse = page.waitForResponse(isThreatResponse);
  await seat.getByRole("button", { name: "Show", exact: true }).click();
  const first = (await (await firstResponse).json() as { page: ModuleQueryPage }).page;
  await assertThreatPacket(page, first.packets.find(p => p.module === "threat_radar")!);
  await openAdvancedSupport(page);
  await page.getByRole("combobox", { name: "Arrows", exact: true }).selectOption("off");
  await page.getByRole("button", { name: "Return to play" }).click();
  await expect(seat.locator("[data-presented]")).toHaveCount(0);
  await expect(seat.getByRole("button", { name: "Show", exact: true })).toBeVisible();
  let oldResponse: APIResponse | undefined;
  let release: (() => void) | undefined;
  let held = false;
  await page.route("**/runs/*/modules/query", async route => {
    if (!held && route.request().postDataJSON().query?.requested?.includes("threat_radar")) {
      held = true; oldResponse = await route.fetch();
      await new Promise<void>(resolve => { release = resolve; });
      await route.fulfill({ response: oldResponse });
    } else await route.continue();
  });
  await seat.getByRole("button", { name: "Show", exact: true }).click();
  await expect.poll(() => release !== undefined).toBe(true);
  await expect(seat.getByRole("status")).toContainText("Asking");
  await openAdvancedSupport(page);
  await page.getByRole("combobox", { name: "Arrows", exact: true }).selectOption("sight");
  await page.getByRole("button", { name: "Return to play" }).click();
  await expect(seat.getByRole("status")).toHaveCount(0);
  await expect(seat.getByRole("button", { name: "Show", exact: true })).toBeVisible();
  const nextResponse = page.waitForResponse(isThreatResponse);
  await seat.getByRole("button", { name: "Show", exact: true }).click();
  const next = (await (await nextResponse).json() as { page: ModuleQueryPage }).page;
  const old = (await oldResponse!.json() as { page: ModuleQueryPage }).page;
  expect(old.subjectNodeId).toBe(next.subjectNodeId);
  expect(old.effectiveConfigDigest).not.toBe(next.effectiveConfigDigest);
  const packet = next.packets.find(p => p.module === "threat_radar")!;
  await assertThreatPacket(page, packet);
  const delivery = page.waitForResponse(r => isThreatResponse(r) && r.request().postDataJSON().assistance.requestDigest === old.requestedConfigDigest);
  release!(); await delivery;
  await assertThreatPacket(page, packet);
  await testInfo.attach("support-seat-help-lifetime", { body: JSON.stringify({ first, old, next }), contentType: "application/json" });
  expect((await inspectCompositionVocabulary(page, "support-seat-replaced")).leaks).toEqual([]);
});

test("Support seats refuse a genuinely sealed older-decision replay after same-position branch changes", async ({ page }, testInfo) => {
  await openThreatSeatRun(page);
  const seat = page.locator('[data-module="threat_radar"]');
  const firstResponse = page.waitForResponse(isThreatResponse);
  await seat.getByRole("button", { name: "Show", exact: true }).click();
  const response = await firstResponse;
  const first = (await response.json() as { page: ModuleQueryPage }).page;
  await assertThreatPacket(page, first.packets.find(p => p.module === "threat_radar")!);
  // Change the authoritative recorded head, not the position or the source bytes. The exact
  // response is replayed untouched; a genuine seal is not authority for this new decision.
  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("button", { name: "Fork branch", exact: true }).click();
  await page.getByLabel("What are you trying?").fill("Compare another continuation from this exact position");
  await page.getByLabel("Short name").fill("Another idea");
  const mutationResponse = page.waitForResponse(r => r.url().endsWith("/fork"));
  await page.getByRole("button", { name: "Create branch", exact: true }).click();
  expect((await mutationResponse).ok()).toBe(true);
  await page.getByRole("button", { name: "Support", exact: true }).click();
  await expect(seat.locator("[data-presented]")).toHaveCount(0);
  await page.route("**/runs/*/modules/query", async route => {
    if (route.request().postDataJSON().query?.requested?.includes("threat_radar")) await route.fulfill({ status: response.status(), headers: response.headers(), body: await response.body() });
    else await route.continue();
  });
  await seat.getByRole("button", { name: "Show", exact: true }).click();
  await expect(seat.getByRole("alert")).toContainText("Nothing was checked");
  await expect(seat.locator("[data-presented]")).toHaveCount(0);
  await page.unroute("**/runs/*/modules/query");
  const nextResponse = page.waitForResponse(isThreatResponse);
  await seat.getByRole("button", { name: "Try again", exact: true }).click();
  const next = (await (await nextResponse).json() as { page: ModuleQueryPage }).page;
  expect(next.subjectNodeId).toBe(first.subjectNodeId);
  expect(next.decision.digest).not.toBe(first.decision.digest);
  await assertThreatPacket(page, next.packets.find(p => p.module === "threat_radar")!);
  await testInfo.attach("support-seat-decision-replay", { body: JSON.stringify({ first, next }), contentType: "application/json" });
});

test("explicit Inspector human-model retires real completed and delayed pages across help changes and closure", async ({ page }, testInfo) => {
  await openFullInspectorRun(page);
  await page.getByRole("checkbox", { name: "Human move split on request", exact: true }).check();
  const panel = page.getByRole("region", { name: "Human-model evidence", exact: true });
  const responseMatches = (r: { url(): string }) => r.url().includes("/human-split?");
  const assertPage = async (model: HumanSplitPage) => {
    expect(model.engine.name).toBe("Deterministic mock opponent"); // A transport journey, never real-model quality evidence.
    const candidates = model.candidates.filter(candidate => candidate.offWindow !== true);
    expect(candidates.length).toBeGreaterThan(0);
    await expect(panel.locator(".guidance-sentence")).not.toBeEmpty();
    for (const candidate of candidates) {
      await expect(panel.locator(".guidance-sentence")).toContainText(candidate.mass === undefined ? "frequency unavailable" : `${Math.round(candidate.mass * 100)}%`);
      await expect(panel.locator(".guidance-sentence")).not.toContainText(candidate.moveUci);
    }
    await expect(panel.getByRole("alert")).toHaveCount(0);
  };
  const firstResponse = page.waitForResponse(responseMatches);
  await panel.getByRole("button", { name: "Load model candidates", exact: true }).click();
  const first = await (await firstResponse).json() as HumanSplitPage;
  await assertPage(first);
  await page.getByRole("combobox", { name: "Arrows", exact: true }).selectOption("off");
  await expect(panel.locator(".guidance-sentence")).toHaveCount(0);
  let held = false, release: (() => void) | undefined;
  let oldResponse: APIResponse | undefined;
  let requests = 0;
  page.on("request", request => { if (responseMatches(request)) ++requests; });
  await page.route("**/runs/*/human-split?*", async route => {
    if (!held) {
      held = true; oldResponse = await route.fetch();
      await new Promise<void>(resolve => { release = resolve; });
      await route.fulfill({ response: oldResponse });
    } else await route.continue();
  });
  await panel.getByRole("button", { name: "Load model candidates", exact: true }).click();
  await expect.poll(() => release !== undefined).toBe(true);
  await expect(panel.getByRole("status")).toContainText("Loading");
  await page.getByRole("button", { name: "Return to play", exact: true }).click();
  await page.locator(".inspector-entry").click();
  await expect(panel.getByRole("status")).toHaveCount(0);
  const oldDelivery = page.waitForResponse(responseMatches); release!(); await oldDelivery;
  await expect(panel.locator(".guidance-sentence")).toHaveCount(0);
  expect(requests).toBe(1); // Reopening is not an unsolicited provider query.
  const retryResponse = page.waitForResponse(responseMatches);
  await panel.getByRole("button", { name: "Load model candidates", exact: true }).click();
  const next = await (await retryResponse).json() as HumanSplitPage;
  expect(next.nodeId).toBe(first.nodeId); await assertPage(next);
  expect(requests).toBe(2);
  await testInfo.attach("explicit-inspector-human-model-lifetime", { body: JSON.stringify({ first, delayed: await oldResponse!.json(), next }), contentType: "application/json" });
  await page.getByRole("button", { name: "Return to play", exact: true }).click();
  expect((await inspectCompositionVocabulary(page, "explicit-human-model-closed")).leaks).toEqual([]);
});

test("full Inspector recompiles its real packet after same-position Advanced settings change", async ({ page }, testInfo) => {
  await openFullInspectorRun(page);
  const firstResponse = page.waitForResponse(isFullInspectorResponse);
  await page.getByRole("checkbox", { name: "Full inspector", exact: true }).check();
  const first = (await (await firstResponse).json() as { page: ModuleQueryPage }).page;
  await assertFullInspectorPacket(page, first.packets.find(p => p.module === "full_inspector")!);
  const nextResponse = page.waitForResponse(isFullInspectorResponse);
  await page.getByRole("combobox", { name: "Arrows", exact: true }).selectOption("off");
  const next = (await (await nextResponse).json() as { page: ModuleQueryPage }).page;
  expect(next.subjectNodeId).toBe(first.subjectNodeId);
  expect(next.runId).toBe(first.runId);
  expect(next.effectiveConfigDigest).not.toBe(first.effectiveConfigDigest);
  await assertFullInspectorPacket(page, next.packets.find(p => p.module === "full_inspector")!);
  await testInfo.attach("inspector-help-recompilation", { body: JSON.stringify({ first, next }), contentType: "application/json" });
  await page.getByRole("button", { name: "Return to play" }).click();
  expect((await inspectCompositionVocabulary(page, "inspector-recompiled-closed")).leaks).toEqual([]);
});

test("full Inspector retires a real delayed packet while help recompiles and survives reopening", async ({ page }, testInfo) => {
  await openFullInspectorRun(page);
  let held = false;
  let oldResponse: APIResponse | undefined;
  let release: (() => void) | undefined;
  await page.route("**/runs/*/modules/query", async route => {
    const requested = route.request().postDataJSON().query.requested as string[];
    if (!held && requested.includes("full_inspector")) {
      held = true;
      oldResponse = await route.fetch();
      await new Promise<void>(resolve => { release = resolve; });
      await route.fulfill({ response: oldResponse });
    } else await route.continue();
  });
  await page.getByRole("checkbox", { name: "Full inspector", exact: true }).check();
  await expect.poll(() => release !== undefined).toBe(true);
  await expect(page.locator(".full-inspector").getByRole("status")).toContainText("Collecting");
  const old = (await oldResponse!.json() as { page: ModuleQueryPage }).page;
  const nextResponse = page.waitForResponse(isFullInspectorResponse);
  await page.getByRole("combobox", { name: "Arrows", exact: true }).selectOption("off");
  const next = (await (await nextResponse).json() as { page: ModuleQueryPage }).page;
  expect(next.subjectNodeId).toBe(old.subjectNodeId);
  expect(next.effectiveConfigDigest).not.toBe(old.effectiveConfigDigest);
  const packet = next.packets.find(p => p.module === "full_inspector")!;
  await assertFullInspectorPacket(page, packet);
  const oldDelivery = page.waitForResponse(r => isFullInspectorResponse(r) && r.request().postDataJSON().assistance.requestDigest === old.requestedConfigDigest);
  release!();
  await oldDelivery;
  await assertFullInspectorPacket(page, packet);
  await page.getByRole("button", { name: "Return to play" }).click();
  const reopenResponse = page.waitForResponse(isFullInspectorResponse);
  await page.locator(".inspector-entry").click();
  const reopened = (await (await reopenResponse).json() as { page: ModuleQueryPage }).page;
  expect(reopened.effectiveConfigDigest).toBe(next.effectiveConfigDigest);
  await assertFullInspectorPacket(page, reopened.packets.find(p => p.module === "full_inspector")!);
  await testInfo.attach("inspector-retired-delivery", { body: JSON.stringify({ old, next, reopened }), contentType: "application/json" });
});

test("@matrix final Guided Hint shares one expanded seat and preserves the board and rung", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  const projections = [
    { width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1280, height: 720 },
    { width: 768, height: 1024 }, { width: 430, height: 932 }, { width: 390, height: 844 }, { width: 360, height: 680 },
  ];
  const postedRungs: string[] = [];
  page.on("request", request => {
    if (request.method() === "POST" && request.url().endsWith("/hints")) postedRungs.push(String(request.postDataJSON().rung));
  });
  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await startSupportFromFen(page, "k7/7K/8/8/N7/3r4/8/3r4 w - - 0 1", "white");
    await choosePreset(page, /Guide me/u);
    await assertRunViewport(page, viewport);
    const calm = await page.getByLabel("Chessboard").boundingBox();
    await showSupport(page);
    await showSupportTools(page);
    await page.getByRole("button", { name: "Show support for this position" }).click();
    const hint = page.locator('[data-module="guided_hint"]');
    const firstPost = postedRungs.length;
    await hint.getByRole("button", { name: "Hint", exact: true }).click();
    for (const [rung, sentence] of [["pattern", "finds a double attack for you."], ["square", "It involves d1 and d3."], ["piece", "The piece involved is your knight on a4."], ["distance", "It appears after this move."]] as const) {
      if (rung !== "pattern") await hint.getByRole("button", { name: "A little more", exact: true }).click();
      await expect(hint.locator(`[data-hint-rung="${rung}"]`)).toContainText(sentence);
      await expect(page.locator('[data-seat-state="expanded"]')).toHaveCount(1);
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    }
    expect(postedRungs.slice(firstPost)).toEqual(["pattern", "square", "piece", "distance"]);
    await expect(hint.getByRole("button", { name: "A little more", exact: true })).toBeDisabled();
    await expect(hint).not.toContainText("Nb2");
    const painted = page.locator(".cg-shapes circle");
    await expect.poll(() => painted.count()).toBeGreaterThan(0);
    const markCount = await painted.count();
    const theory = page.locator('[data-module="theory_breadcrumb"]');
    await theory.locator(".seat-row").click();
    await expect(hint.locator(".hint-card")).toBeHidden();
    await expect(page.locator('[data-seat-state="expanded"]')).toHaveCount(1);
    await expect(painted).toHaveCount(0);
    await hint.getByRole("button", { name: "Open guided hint", exact: true }).click();
    await expect(hint.locator('[data-hint-rung="distance"]')).toBeVisible();
    await expect(theory.locator(".seat-card")).toBeHidden();
    await expect(page.locator('[data-seat-state="expanded"]')).toHaveCount(1);
    await expect(painted).toHaveCount(markCount);
    expect(postedRungs.slice(firstPost)).toEqual(["pattern", "square", "piece", "distance"]);
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    if (viewport.width === 768) {
      const mountedHint = await hint.elementHandle();
      await page.setViewportSize({ width: 1440, height: 900 });
      await assertRunViewport(page, { width: 1440, height: 900 });
      await page.setViewportSize(viewport);
      await assertRunViewport(page, viewport);
      expect(await mountedHint!.evaluate((element) => element.isConnected && element === document.querySelector('[data-module="guided_hint"]'))).toBe(true);
      await expect(hint.locator('[data-hint-rung="distance"]')).toBeVisible();
      await expect(painted).toHaveCount(markCount);
      expect(postedRungs.slice(firstPost)).toEqual(["pattern", "square", "piece", "distance"]);
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    }
    await attachCompositionCell(page, testInfo, viewport, "06-guided-hint-final-stage");
  }
});

async function startSupportFromFen(page: Page, fen: string, side: "white" | "black"): Promise<void> {
  await page.goto("/play");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill(fen);
  await page.getByLabel("Your side").selectOption(side);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await choosePreset(page, /Support/u);
}

test("@matrix maximum-load modules use real requests and evidence at every viewport", async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  page.setDefaultTimeout(15_000);
  const projections = [
    { width: 1440, height: 900 }, { width: 1366, height: 768 }, { width: 1280, height: 720 },
    { width: 768, height: 1024 }, { width: 430, height: 932 }, { width: 390, height: 844 },
    { width: 360, height: 680 },
  ] as const;
  const seat = (module: string) => page.locator(`[data-module="${module}"]`);
  // Independent observation of the public receipt, not the client's badge implementation.
  const factCount = (packet: ModuleQueryPage["packets"][number]) => new Set(packet.receipt.items.map((item) => item.evidenceRef === null ? item.componentDigest : `${item.evidenceRef.projection.id}#${item.evidenceRef.evidenceDigest}`)).size;
  const assertPage = (page: ModuleQueryPage, runId: string, finalDigest: string) => {
    expect(page.runId).toBe(runId);
    expect(page.effectiveConfigDigest).toBe(finalDigest);
    for (const packet of page.packets) {
      expect(packet.disclosure.effectiveConfigDigest).toBe(finalDigest);
      expect(packet.disclosure.subject.nodeId).toBe(page.subjectNodeId);
      expect(packet.disclosure.componentDigests).toEqual(packet.receipt.items.map((item) => item.componentDigest));
    }
    return page;
  };
  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await startSupportFromFen(page, SCHOLAR_TRAP, "black");
    await choosePreset(page, /Guide me/u);
    await openAdvancedSupport(page);
    for (const label of ["Threat radar", "Staged-move risk check"]) {
      await page.getByRole("checkbox", { name: label, exact: true }).check();
      await expect(page.locator("[data-preset-state]")).toHaveAttribute("data-preset-state", "ready");
    }
    await page.getByRole("button", { name: "Return to play" }).click();
    // Build the other attempt through real domain operations, not a synthetic comparison packet.
    // The UI move and public rewind/fork routes preserve both attempts in the stored run.
    const firstMove = page.waitForResponse((response) => response.url().endsWith("/moves") && response.request().postDataJSON().uci === "d8e7");
    await move(page, "d8", "e7", "black");
    expect((await firstMove).ok()).toBe(true);
    const runId = page.url().split("/").at(-1)!;
    const graphResponse = await page.request.get(`/runs/${runId}/graph`);
    const graph = await graphResponse.json() as { graph: { nodes: { id: string; parentId: string | null }[] } };
    const root = graph.graph.nodes.find((node) => node.parentId === null)!;
    const writer = await page.evaluate((id) => localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
    for (const [action, data] of [["rewind", { nodeId: root.id }], ["fork", { nodeId: root.id, label: "Pawn attack", intent: "Compare the pawn attack with the queen defence" }]] as const) {
      const response = await page.request.post(`/runs/${runId}/${action}`, { headers: { "x-writer-id": writer! }, data });
      expect(response.ok(), await response.text()).toBe(true);
    }
    await page.reload();
    await expect(page.locator("[data-preset-state]")).toHaveAttribute("data-preset-state", "ready");
    await assertRunViewport(page, viewport);
    const calm = await page.getByLabel("Chessboard").boundingBox();
    await move(page, "g7", "g6", "black");
    await showSupport(page);
    const cue = seat("blunder_prevention");
    await expect(cue).toHaveAttribute("data-seat-state", "warning");
    await cue.getByRole("button", { name: /anyway$/u }).click();
    await showSupport(page);
    await showSupportTools(page);
    const compiledResponse = page.waitForResponse((response) => response.url().endsWith("/assistance") && response.request().method() === "POST");
    const postcommitResponse = page.waitForResponse((response) => response.url().endsWith("/modules/query") && response.request().postDataJSON().query.timing === "post_commit" && response.request().postDataJSON().query.requested.length === 0);
    await page.getByRole("button", { name: "Show support for this position" }).click();
    const compiled = (await (await compiledResponse).json()).assistance as { finalDigest: string; modules: string[] };
    expect(compiled.modules.slice().sort()).toEqual(["rules_floor", "postcommit_nudge", "sight_on_request", "threat_radar", "structure_nudge", "theory_breadcrumb", "guided_hint", "compare_coach", "blunder_prevention"].sort());
    const raw = await (await postcommitResponse).json();
    const delivered = assertPage(raw.page as ModuleQueryPage, runId, compiled.finalDigest);
    expect(delivered.packets.find((packet) => packet.module === "postcommit_nudge")!.receipt.items.length).toBeGreaterThan(0);
    for (const packet of delivered.packets) await expect(seat(packet.module).locator(".seat-badge")).toHaveText(String(factCount(packet)));
    // The reveal starts real recorded evidence jobs. Their completions legitimately change the
    // exact hint decision. Await their recorded coverage, then load that settled head before
    // asking for a hint; never preserve an answer across a genuinely changed event head.
    await expect.poll(async () => {
      const events = (await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json()).events as { type: string; data: { node?: { id: string; branchId: string }; nodeId?: string; branch?: { id: string } } }[];
      const attached = new Set(events.filter((event) => event.type === "evidence.attached").map((event) => event.data.nodeId));
      const branch = events.find((event) => event.type === "branch.forked")!.data.branch!.id;
      return events.filter((event) => event.type === "move.committed" && event.data.node!.branchId === branch && !attached.has(event.data.node!.id)).length;
    }).toBe(0);
    const resumedNudge = page.waitForResponse((response) => response.url().endsWith("/modules/query") && response.request().postDataJSON().query.timing === "post_commit" && response.request().postDataJSON().query.requested.length === 0);
    await page.reload();
    await expect(page.locator("[data-preset-state]")).toHaveAttribute("data-preset-state", "ready");
    await showSupport(page);
    const resumed = assertPage((await (await resumedNudge).json()).page as ModuleQueryPage, runId, compiled.finalDigest);
    for (const packet of resumed.packets) await expect(seat(packet.module).locator(".seat-badge")).toHaveText(String(factCount(packet)));
    for (const module of ["postcommit_nudge", "sight_on_request", "threat_radar", "structure_nudge", "theory_breadcrumb", "guided_hint", "compare_coach"]) {
      await expect(seat(module), `complete rail population: ${module}`).toHaveCount(1);
    }
    // The shipped phone companion is modal: close it through its real affordance before a
    // board gesture. Changing that product policy belongs to D3436, not a forced test click.
    if (viewport.width < 720) await page.getByRole("button", { name: "Collapse companion" }).click();
    await page.getByLabel("Chessboard").evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const boardBox = await page.getByLabel("Chessboard").boundingBox();
    const square = squarePoint(boardBox!, "g6", "black");
    const hit = await page.getByLabel("Chessboard").evaluate((element, point) => { const target = document.elementFromPoint(point.x, point.y); return { inside: element.contains(target), square: point, board: element.getBoundingClientRect().toJSON(), target: target?.outerHTML.slice(0, 400) }; }, square);
    expect(hit.inside, JSON.stringify(hit)).toBe(true);
    const sightResponse = page.waitForResponse((response) => response.url().endsWith("/modules/query") && response.request().postDataJSON().query.selectedSquare === "g6");
    await page.mouse.click(square.x, square.y);
    const sightRaw = await (await sightResponse).json();
    const sight = assertPage(sightRaw.page as ModuleQueryPage, runId, compiled.finalDigest);
    await showSupport(page);
    await expect(seat("sight_on_request").locator(".seat-badge")).toHaveText(String(factCount(sight.packets.find((packet) => packet.module === "sight_on_request")!)));
    for (const module of ["threat_radar", "theory_breadcrumb", "compare_coach"]) {
      await seat(module).locator(".seat-row").click();
      const response = page.waitForResponse((candidate) => candidate.url().endsWith("/modules/query") && candidate.request().postDataJSON().query.requested.includes(module));
      await seat(module).getByRole("button", { name: "Show", exact: true }).click();
      const raw = await (await response).json();
      const answer = assertPage(raw.page as ModuleQueryPage, runId, compiled.finalDigest);
      const packet = answer.packets.find((candidate) => candidate.module === module)!;
      expect(packet, `real ${module} answer`).toBeDefined();
      if (module === "compare_coach") expect(packet.receipt.items.length).toBeGreaterThan(0);
      await expect(seat(module).locator(".seat-badge")).toHaveText(String(factCount(packet)));
      await expect(page.locator('[data-seat-state="expanded"]')).toHaveCount(1);
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    }
    const eventsBefore = (await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json()).events.map((event: { seq: number; type: string }) => [event.seq, event.type]);
    const hintResponse = page.waitForResponse(async (response) => /\/hints(?:\/[^/]+)?$/u.test(response.url()) && ["available", "honest_empty", "source_unavailable"].includes((await response.json()).hint?.state));
    await seat("guided_hint").getByRole("button", { name: "Hint", exact: true }).click();
    const hint = (await (await hintResponse).json()).hint;
    await expect(seat("guided_hint").locator(".seat-badge")).toHaveText(hint.state === "available" ? "1" : "0");
    if (viewport.width === 768) await assertTabletQueueHead(page, "guided_hint");
    for (const module of ["postcommit_nudge", "structure_nudge", "theory_breadcrumb", "compare_coach", "threat_radar", "sight_on_request"]) {
      await seat(module).locator(".seat-row").click();
      await expect(seat(module)).toHaveAttribute("data-seat-state", "expanded");
      await expect(page.locator('[data-seat-state="expanded"]')).toHaveCount(1);
      await expect(seat("guided_hint").locator(".hint-card")).toBeHidden();
      if (viewport.width === 768) await assertTabletQueueHead(page, module);
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    }
    const eventsAfter = (await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json()).events.map((event: { seq: number; type: string }) => [event.seq, event.type]);
    await expect(page.locator('.module-seat[data-seat-class="rail"] .seat-badge'), JSON.stringify({ eventsBefore, eventsAfter })).toHaveCount(7);
    if (viewport.width < 720) await page.getByRole("button", { name: "Collapse companion" }).click();
    const stagedResponse = page.waitForResponse((response) => response.url().endsWith("/modules/query") && response.request().postDataJSON().query.candidateUci === "g6g5");
    await move(page, "g6", "g5", "black");
    const stagedRaw = await (await stagedResponse).json();
    const staged = assertPage(stagedRaw.page as ModuleQueryPage, runId, compiled.finalDigest).packets.find((packet) => packet.module === "blunder_prevention")!;
    expect(staged.receipt.items.length).toBeGreaterThan(0);
    await showSupport(page);
    await expect(cue).toHaveAttribute("data-seat-state", "warning");
    await expect(cue.locator(".seat-badge")).toHaveText(String(factCount(staged)));
    await expect(page.locator('[data-seat-state="expanded"]')).toHaveCount(0);
    await expect(seat("guided_hint").locator(".hint-card")).toBeHidden();
    await expect(page.locator(".module-seat .seat-badge")).toHaveCount(8);
    if (viewport.width >= 720 && viewport.width < 1024) {
      const token = await page.locator("main.drill").evaluate((element) => Number.parseFloat(getComputedStyle(element).getPropertyValue("--band-h")));
      expect((await page.locator(".rail-stack").boundingBox())!.height).toBe(token);
      await assertTabletQueueHead(page, "blunder_prevention");
      await expect(cue.getByRole("button", { name: "Revise", exact: true })).toBeVisible();
    } else if (viewport.width < 720) {
      const token = await page.locator("main.drill").evaluate((element) => Number.parseFloat(getComputedStyle(element).getPropertyValue("--rim-h")));
      expect((await page.locator(".compact-tabs").boundingBox())!.height).toBe(token);
      expect((await page.locator(".rail-stack").boundingBox())!.y).toBeGreaterThanOrEqual(calm!.y + calm!.height);
    }
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "13-max-load");
    await cue.getByRole("button", { name: "Revise", exact: true }).click();
    await expect(cue).toHaveCount(0);
    await expect(page.locator('[data-seat-state="expanded"]')).toHaveCount(1);
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    if (viewport.width === 768) {
      await assertTabletQueueHead(page, "sight_on_request");
      await showSupportTools(page);
      await assertTabletQueueHead(page, "support_tools");
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    }
  }
});

test("@matrix tablet topbar separates brand, context and actionable controls", async ({ page }) => {
  for (const width of [720, 768, 820, 1023]) {
    await page.setViewportSize({ width, height: 1024 });
    await startSupportFromFen(page, SCHOLAR_TRAP, "black");
    await assertTopbarSeparation(page, width);
    if (width === 768) {
      // Disposable negative layout control: prove the independent bounds check detects overlap.
      const brand = page.locator(".topbar .wordmark");
      const box = (await brand.boundingBox())!;
      const context = (await page.locator(".topbar .status").boundingBox())!;
      await brand.evaluate((element, shift) => { (element as HTMLElement).style.transform = `translateX(${shift}px)`; }, context.x - box.x - box.width + 8);
      await expect(assertTopbarSeparation(page, width)).rejects.toThrow(/brand\/context separation/u);
      await brand.evaluate(element => { (element as HTMLElement).style.removeProperty("transform"); });
      await assertTopbarSeparation(page, width);
    }
  }
});

test("@matrix module seats render sealed evidence without moving the board (states 3, 5, 9)", async ({ page }, testInfo) => {
  test.setTimeout(300_000);
  page.setDefaultTimeout(15_000);
  const projections = [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 360, height: 680 },
  ] as const;
  const seat = (module: string) => page.locator(`[data-module="${module}"]`);
  const forbidden = /Tabiya's|detector|phase bands|[a-z]+_[a-z]+|@\d|\b[a-h][1-8][a-h][1-8][qrbn]?\b/u;

  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await startSupportFromFen(page, SCHOLAR_TRAP, "black");
    await assertRunViewport(page, viewport);
    const calm = await page.getByLabel("Chessboard").boundingBox();
    expect(calm).not.toBeNull();

    // State 5 — a rail module expanded: Threat radar is opened on request and names the mate threat.
    await showSupport(page);
    await seat("threat_radar").locator(".seat-row").click();
    await seat("threat_radar").getByRole("button", { name: "Show" }).click();
    const radar = seat("threat_radar").locator(".seat-card");
    await expect(radar.locator("[data-presented]").first()).toBeVisible();
    await expect(radar).toContainText("mate");
    await expect(radar).not.toContainText(forbidden);
    await expect(page.locator('[data-seat-state="expanded"]')).toHaveCount(1);
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "05-rail-module-expanded");
    if (viewport.width <= 719) await page.getByRole("button", { name: "Collapse companion" }).click();

    // State 3 — a staged move with the one board-adjacent cue in the head slot; Revise keeps the board.
    await move(page, "g8", "f6", "black");
    await showSupport(page);
    const cue = seat("blunder_prevention");
    await expect(cue).toHaveAttribute("data-seat-state", "warning");
    await expect(cue).toContainText("mate on f7");
    await expect(cue).not.toContainText(forbidden);
    await expect(page.locator('[data-seat-class="board_adjacent"]')).toHaveCount(1);
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "03-move-staged-cue");
    await cue.getByRole("button", { name: "Revise" }).click();
    await expect(cue).toHaveCount(0);
    if (viewport.width <= 719) await page.getByRole("button", { name: "Collapse companion" }).click();
    // Post-gesture: a real move submission after the cue, with its exact outgoing UCI.
    const committed = page.waitForRequest((request) => request.url().endsWith("/moves") && request.method() === "POST");
    await move(page, "d8", "e7", "black");
    expect(JSON.parse((await committed).postData() ?? "{}")).toMatchObject({ uci: "d8e7" });
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);

    // State 9 — honest empty: opened doors state their declared absence inside their own card.
    await showSupport(page);
    await showSupportTools(page);
    const reveal = page.getByRole("button", { name: "Show support for this position" });
    await expect(reveal).toBeEnabled();
    await reveal.click();
    await expect(page.getByRole("region", { name: "Temporary help" })).toContainText(
      "Support is available for this position until you commit your next move.",
    );
    await seat("theory_breadcrumb").locator(".seat-row").click();
    await seat("theory_breadcrumb").getByRole("button", { name: "Show" }).click();
    const theory = seat("theory_breadcrumb").locator(".seat-card");
    await expect(theory.locator(".stated-empty")).toHaveText("Nothing is written about this position.");
    await expect(theory).toContainText("Not consulted: the cited catalogue is not installed in this deployment.");
    await expect(theory.locator("[data-presented]")).toHaveCount(0);
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "09-evidence-unavailable-honest-empty");

  }
});

test("@matrix post-commit guard preserves the board rectangle at every composition viewport", async ({ page }, testInfo) => {
  const projections = [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 360, height: 680 },
  ] as const;

  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await page
      .getByRole("article")
      .filter({ hasText: "Post-commit guard browser fixture" })
      .getByRole("button", { name: /Rehearse this position/ })
      .click();
    await assertRunViewport(page, viewport);
    const calm = await page.getByLabel("Chessboard").boundingBox();
    expect(calm).not.toBeNull();

    await move(page, "h2", "h3");
    const prompt = page.getByRole("region", { name: "Consequence to review" });
    if (!await prompt.isVisible()) {
      await page.getByRole("button", { name: "Support", exact: true }).click();
    }
    await expect(prompt).toBeVisible();
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "04-post-commit-guard");
  }
});

test("@matrix terminal outcome preserves the board rectangle at every composition viewport", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const projections = [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 360, height: 680 },
  ] as const;

  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await page
      .getByRole("article")
      .filter({ hasText: "Terminal outcome browser fixture" })
      .getByRole("button", { name: /Rehearse this position/ })
      .click();
    await assertRunViewport(page, viewport);
    const calm = await page.getByLabel("Chessboard").boundingBox();
    expect(calm).not.toBeNull();

    await move(page, "f2", "f3");
    await page.getByRole("button", { name: "Continue" }).click();
    await move(page, "g2", "g4");
    await expect(page.getByRole("dialog", { name: "You lost." })).toBeVisible();
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "14-terminal-outcome");
  }
});

test("@matrix board controls do not overlap each other or consume physical square centers", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  for (const viewport of [{ width:1440, height:900 }, { width:768, height:1024 }, { width:430, height:932 }, { width:390, height:844 }, { width:360, height:680 }, { width:320, height:256 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await page.getByRole("button", { name:"Start from a FEN" }).click();
    await page.getByLabel("Position FEN").fill("k7/4P3/8/8/8/8/8/7K w - - 0 1");
    await chooseRawRung(page);
    await page.getByRole("button", { name:"Start and keep the game" }).click();
    const board = page.getByLabel("Chessboard");
    await expect(board).toBeVisible();
    const measured = await board.evaluate(element => {
      const rect = (e: Element) => { const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height}; };
      const entry = document.querySelector(".text-move summary")!;
      const controls=[...document.querySelectorAll<HTMLElement>(".topbar-actions > button, .topbar-actions > details > summary, .move-entry .text-move > summary")];
      const overlap=(a:DOMRect,b:DOMRect)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
      const t=entry.getBoundingClientRect(), b=element.getBoundingClientRect();
      const collisions:string[]=[];
      for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++)if(overlap(controls[i]!.getBoundingClientRect(),controls[j]!.getBoundingClientRect())>0)collisions.push(`${controls[i]!.textContent}/${controls[j]!.textContent}`);
      const blocked:string[]=[];
      const offsets=[...document.querySelectorAll<HTMLElement>("*")].map(e=>({e,left:e.scrollLeft,top:e.scrollTop})), pageOffset={left:scrollX,top:scrollY};
      const cells=[...element.parentElement!.querySelectorAll<HTMLElement>('[role="gridcell"]')];
      try { for(let i=0;i<cells.length;i++){
        const cell=cells[i]!;cell.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"});
        const r=cell.getBoundingClientRect(), hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        if(!hit||!element.contains(hit))blocked.push(`${cell.textContent}:${hit instanceof HTMLElement?hit.tagName+'.'+hit.className:'nothing'}`);
      } } finally {
        for(const {e,left,top} of offsets)if(e.scrollLeft!==left||e.scrollTop!==top)e.scrollTo({left,top,behavior:"instant"});
        window.scrollTo({...pageOffset,behavior:"instant"});
      }
      return {board:rect(element),entry:rect(entry),strip:rect(document.querySelector(".timeline-strip")!),timeline:rect(document.querySelector(".timeline-strip .timeline")!),boardOverlap:overlap(t,b),collisions,blocked,squares:cells.length};
    });
    await testInfo.attach(`board-controls-${viewport.width}x${viewport.height}`,{body:JSON.stringify(measured,null,2),contentType:"application/json"});
    expect.soft(measured.boardOverlap,`entry must not paint on the board at ${viewport.width}`).toBe(0);
    expect.soft(measured.collisions,`whole shell control bounds at ${viewport.width}`).toEqual([]);
    expect.soft(measured.entry.x).toBeGreaterThanOrEqual(measured.strip.x);
    expect.soft(measured.entry.y).toBeGreaterThanOrEqual(measured.strip.y);
    expect.soft(measured.entry.x+measured.entry.width).toBeLessThanOrEqual(measured.timeline.x);
    expect.soft(measured.entry.y+measured.entry.height).toBeLessThanOrEqual(measured.strip.y+measured.strip.height);
    expect.soft(measured.squares).toBe(64);
    expect.soft(measured.blocked,`physical board centers at ${viewport.width}`).toEqual([]);
  }
});

test("@matrix board controls preserve genuine click back-rank promotion gestures", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  for (const viewport of [{ width:1440, height:900 }, { width:768, height:1024 }, { width:430, height:932 }, { width:390, height:844 }, { width:360, height:680 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await page.getByRole("button", { name:"Start from a FEN" }).click();
    await page.getByLabel("Position FEN").fill("k7/4P3/8/8/8/8/8/7K w - - 0 1");
    await chooseRawRung(page);
    await page.getByRole("button", { name:"Start and keep the game" }).click();
    const before = await page.getByLabel("Chessboard").boundingBox();
    const origin=squarePoint(before!,"e7"), destination=squarePoint(before!,"e8");
    await page.mouse.click(origin.x,origin.y);
    await page.mouse.click(destination.x,destination.y);
    const picker=page.getByRole("dialog",{name:"Choose promotion piece"});
    await expect.soft(picker,`actual e7→e8 at ${viewport.width}`).toBeVisible();
    const pending=await picker.isVisible();
    await testInfo.attach(`board-controls-gesture-${viewport.width}x${viewport.height}`,{body:JSON.stringify({viewport,before,after:await page.getByLabel("Chessboard").boundingBox(),promotionPending:pending,entryOpen:await page.locator(".text-move").getAttribute("open")!==null}),contentType:"application/json"});
    if(pending){await picker.getByRole("button",{name:"Cancel",exact:true}).click();await expect(picker).toBeHidden();}
    expect.soft(await page.getByLabel("Chessboard").boundingBox()).toEqual(before);
  }
});

test("@matrix board controls keep authoring notation separate from native draft submission", async ({ page }, testInfo) => {
  await register(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/create");
  await page.getByRole("button", { name: /^Position/ }).click();
  await page.getByLabel("Draft title", { exact: true }).fill("Native notation seed");
  const posts: unknown[] = [];
  page.on("request", request => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/packs/drafts") posts.push(request.postDataJSON());
  });
  const entry = page.locator(".text-move");
  await entry.locator("summary").click();
  await entry.getByLabel("Move in chess notation").fill("e4");
  await entry.getByRole("button", { name: "Submit move", exact: true }).click();
  await expect(page.getByLabel("Starting FEN")).toHaveValue("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
  expect(posts).toEqual([]);
  expect(await page.locator("form form").count()).toBe(0);
  await expect(page.getByRole("button", { name: "Create ten-field draft", exact: true })).toBeEnabled();
  await testInfo.attach("board-controls-authoring-entry", { body: await page.screenshot(), contentType: "image/png" });
  const submitted = page.waitForResponse(response => new URL(response.url()).pathname === "/packs/drafts" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Create ten-field draft", exact: true }).click();
  expect((await submitted).ok()).toBe(true);
  expect(posts).toHaveLength(1);
});

test("@matrix board controls restore an uncommitted promotion for another real gesture", async ({ page }, testInfo) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto("/play");await page.getByRole("button",{name:"Start from a FEN"}).click();
  await page.getByLabel("Position FEN").fill("k7/4P3/8/8/8/8/8/7K w - - 0 1");await chooseRawRung(page);
  await page.getByRole("button",{name:"Start and keep the game"}).click();
  const pawn=page.locator('.board piece.white.pawn:not(.ghost)'),before=await pawn.boundingBox();
  await move(page,"e7","e8");const picker=page.getByRole("dialog",{name:"Choose promotion piece"});await expect(picker).toBeVisible();
  await picker.getByRole("button",{name:"Cancel",exact:true}).click();await expect(picker).toBeHidden();
  // Restoring FEN uses the user's normal Chessground animation. Require the
  // exact source rectangle after interpolation, not its first animation frame.
  await expect.poll(() => pawn.boundingBox(), "cancel restores the actual source square").toEqual(before);
  await testInfo.attach("board-controls-promotion-cancel",{body:JSON.stringify({before,after:await pawn.boundingBox()}),contentType:"application/json"});
  expect.soft(await pawn.boundingBox(),"cancel restores pawn to its actual source square").toEqual(before);
  await move(page,"e7","e8");await expect(picker).toBeVisible();
});

test("@matrix promotion picker overlays the unchanged board at every composition viewport", async ({ page }, testInfo) => {
  const projections = [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 360, height: 680 },
  ] as const;

  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await page.getByRole("button", { name: "Start from a FEN" }).click();
    await page.getByLabel("Position FEN").fill("7k/P7/8/8/8/8/8/7K w - - 0 1");
    await chooseRawRung(page);
    await page.getByRole("button", { name: "Start and keep the game" }).click();
    await assertRunViewport(page, viewport);
    const calm = await page.getByLabel("Chessboard").boundingBox();
    expect(calm).not.toBeNull();

    await move(page, "a7", "a8");
    await expect(page.getByRole("dialog", { name: "Choose promotion piece" })).toBeVisible();
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "15-promotion-pending");
  }
});

test("@matrix rewind, fork re-entry, and comparison remain composed at every viewport", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const projections = [
    { width: 1440, height: 900 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
    { width: 768, height: 1024 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 360, height: 680 },
  ] as const;

  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await schemaPackCard(page)
      .getByRole("button", { name: /Rehearse this position/ })
      .click();
    await assertRunViewport(page, viewport);
    const calm = await page.getByLabel("Chessboard").boundingBox();
    expect(calm).not.toBeNull();

    await move(page, "c1", "e3");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Active line 2 turns")).toBeVisible();
    await move(page, "f2", "f3");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.locator("main.drill").focus();
    await page.keyboard.press("r");
    await expect(page.getByText("Active line 2 turns")).toBeVisible();
    await page.keyboard.press("b");
    await page.getByLabel("Short name").fill("quiet setup");
    await page.getByLabel("What are you trying?").fill("Compare a lower-commitment setup");
    await page.getByRole("button", { name: "Create branch" }).click();
    await clickMove(page, "d1", "d2");
    if (await page.getByRole("button", { name: "Continue" }).isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Continue" }).click();
    }

    await page.getByRole("button", { name: "Branches", exact: true }).click();
    const mainBranch = page.getByRole("button", { name: /Switch to branch 1: main/ });
    await mainBranch.click();
    await page.getByRole("button", { name: /Switch to branch 2: quiet setup/ }).click();
    await expect(page.locator(".rail li.active strong")).toHaveText("quiet setup");
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calm);
    await attachCompositionCell(page, testInfo, viewport, "11-timeline-rewind-fork-reentry");

    if (viewport.width <= 719 && await page.locator(".rail-stack").evaluate((element) => element.classList.contains("sheet-open"))) {
      await page.getByRole("button", { name: "Collapse companion" }).click();
    }
    await page.locator("main.drill").focus();
    await page.keyboard.press("Alt+C");
    await expect(page.getByRole("heading", { name: "Same decision, two consequences." })).toBeVisible();
    const horizontal = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(horizontal.scrollWidth).toBeLessThanOrEqual(horizontal.clientWidth + 1);
    await attachCompositionCell(page, testInfo, viewport, "12-compare-open");
  }
});

test("branch intent names the saved line and Compare replays the same decision at a chosen rung", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/play");
  const card = schemaPackCard(page);
  await expect(card).toContainText("Consequence · up to 4 turns");
  await card.getByRole("button", { name: /Rehearse this position/ }).click();

  await move(page, "c1", "e3");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await move(page, "f2", "f3");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.locator("main.drill").focus();
  await page.keyboard.press("r");
  await page.keyboard.press("b");
  await expect(page.getByLabel("What are you trying?")).toBeFocused();
  await page.getByLabel("What are you trying?").fill("Keep the queen flexible");
  await page.getByRole("button", { name: "Create branch" }).click();
  await clickMove(page, "d1", "d2");
  if (await page.getByRole("button", { name: "Continue" }).isVisible().catch(() => false)) await page.getByRole("button", { name: "Continue" }).click();

  const generatedName = "Qd2 — Keep the queen flexible";
  await expect(page.locator(".rail li.active strong")).toHaveText(generatedName);
  await expect(page.locator(".timeline").getByRole("button", { name: generatedName, exact: true })).toBeVisible();

  await page.locator("main.drill").focus();
  await page.keyboard.press("Alt+C");
  await expect(page.getByRole("heading", { name: "Same decision, two consequences." })).toBeVisible();
  await page.getByLabel("Human-like rung").selectOption("1800");
  await page.getByRole("button", { name: "Start a new replay" }).click();
  await expect(page).toHaveURL(/\/play\/run\//u);
  await expect(page.locator("[data-status-announcement]")).toContainText("Human-like opponent · rung 1800");
  await expect(page.locator("[data-status-announcement]")).toContainText("Full game · until a rules-terminal result");
});

// rfc/bot-policy.md §4.1 A13 / rfc/bot-roster.md criterion 10: choose → play → resume → rematch.
test("a learner chooses a registered bot, plays it, reloads, and the same bot continues", async ({ page }) => {
  await page.goto("/play");
  const card = page.locator('[data-bot-profile="human-baseline.1400@1"]');
  await expect(card).toContainText("Human baseline · band 1400");
  await expect(card).toContainText("Uncalibrated");
  // Availability is observed from the provider exchange; the baseline card becomes choosable.
  await expect(card.locator("input")).toBeEnabled();
  await expect(page.getByRole("button", { name: "Start and keep the game" })).toBeDisabled();
  await chooseBot(page, "human-baseline.1400@1");
  await expect(page.locator(".bot-card")).toContainText("Maia human-move model");
  const plies: string[] = [];
  page.on("request", (request) => { if (request.method() === "POST" && request.url().endsWith("/opponent-ply")) plies.push(request.postData() ?? ""); });
  let selectMoves = 0;
  page.on("request", (request) => { if (request.url().endsWith("/select-move")) selectMoves += 1; });
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page).toHaveURL(/\/play\/run\//u);
  const status = page.locator("[data-status-announcement]");
  await expect(status).toContainText("Bot · Human baseline · model band 1400");

  await move(page, "e2", "e4", "white");
  await expect(page.locator(".timeline")).toContainText("Active line 2 turns");
  await move(page, "d2", "d4", "white");
  await expect(page.locator(".timeline")).toContainText("Active line 4 turns");
  expect(plies).toHaveLength(2);
  // The browser sends exactly the four request fields: no FEN, history, seed, profile or move.
  for (const body of plies) expect(Object.keys(JSON.parse(body) as object).sort()).toEqual(["expectedBranchId", "expectedEventHeadDigest", "expectedNodeId", "requestId"]);
  expect(selectMoves).toBe(0);

  const runUrl = page.url();
  await page.reload();
  await expect(page).toHaveURL(runUrl);
  await expect(status).toContainText("Bot · Human baseline · model band 1400");
  await expect(page.locator(".timeline")).toContainText("Active line 4 turns");
  // b1-c3 is legal after any two black replies to 1.e4/2.d4 (it also blocks every possible check).
  await move(page, "b1", "c3", "white");
  await expect(page.locator(".timeline")).toContainText("Active line 6 turns");
  expect(plies).toHaveLength(3);
  expect(selectMoves).toBe(0);

  // Rematch keeps the exact bot: a new run, the same identity.
  await page.getByRole("button", { name: "Play this bot again" }).click();
  await expect(page).not.toHaveURL(runUrl);
  await expect(page).toHaveURL(/\/play\/run\//u);
  await expect(status).toContainText("Bot · Human baseline · model band 1400");
});

test("a committed move updates the stable board instance instead of remounting it", async ({ page }) => {
  await page.goto("/play");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  const board = page.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  await board.evaluate((element) => {
    (window as unknown as { __tabiyaBoard?: Element }).__tabiyaBoard = element;
  });

  await move(page, "e2", "e4", "white");
  await expect(page.locator(".timeline")).toContainText("Active line 2 turns");
  expect(await board.evaluate((element) =>
    (window as unknown as { __tabiyaBoard?: Element }).__tabiyaBoard === element,
  )).toBe(true);
});

test("an opponent reply visibly animates on the stable board instance", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/play");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  const board = page.getByLabel("Chessboard");
  await expect(board).toBeVisible();
  await expect(page.locator(".board-shell")).toHaveAttribute("data-animation", /^(normal|fast)$/u);

  await board.evaluate((element) => {
    if (element.querySelector("cg-board") === null) throw new TypeError("Chessground board surface is missing");
    const state = window as unknown as {
      __tabiyaSawOpponentAnimation?: boolean;
      __tabiyaAnimationObserver?: MutationObserver;
    };
    state.__tabiyaSawOpponentAnimation = false;
    state.__tabiyaAnimationObserver?.disconnect();
    state.__tabiyaAnimationObserver = new MutationObserver(() => {
      if (element.querySelector("cg-board piece.black.anim") !== null) state.__tabiyaSawOpponentAnimation = true;
    });
    state.__tabiyaAnimationObserver.observe(element, {
      attributes: true,
      attributeFilter: ["class"],
      childList: true,
      subtree: true,
    });
  });

  await move(page, "e2", "e4", "white");
  await expect(page.locator(".timeline")).toContainText("Active line 2 turns");
  await expect.poll(() => page.evaluate(() =>
    (window as unknown as { __tabiyaSawOpponentAnimation?: boolean }).__tabiyaSawOpponentAnimation,
  )).toBe(true);
  await page.evaluate(() => {
    (window as unknown as { __tabiyaAnimationObserver?: MutationObserver }).__tabiyaAnimationObserver?.disconnect();
  });
});

const ENDGAME_LAYOUT_PROJECTIONS = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1440, height: 1000 },
  { width: 768, height: 1024 },
] as const;

for (const viewport of ENDGAME_LAYOUT_PROJECTIONS) {
  test(`@matrix served endgame packs keep the board above the timeline at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    test.setTimeout(60_000);
    // This is a layout corpus, not a provider test. The packaged mock correctly
    // withholds an empty tablebase capability; admit the perfect-play pack here
    // without ever requesting an opponent move so every authored layout runs.
    await enableEndgamePolicies(page);
    await page.setViewportSize(viewport);
    for (const title of ENDGAME_VIEWPORT_PACKS) {
      await page.goto("/play");
      const card = page.getByRole("article").filter({ hasText: title });
      await expect(card, `${title} should be served`).toHaveCount(1);
      await card.getByRole("button", { name: /Rehearse this position/ }).click();
      await expect(page.getByLabel("Chessboard")).toBeVisible();
      await assertRunViewport(page, viewport);
    }
  });
}

test("@content a served related rehearsal names its source and the move in SAN", async ({ page }) => {
  await enableEndgamePolicies(page);
  await page.goto("/play");
  const card = page.getByRole("article").filter({ hasText: "Philidor family: punish the passive rook" });
  await expect(card).toHaveCount(1);
  await card.getByRole("button", { name: /Rehearse this position/ }).click();

  const relation = page.getByRole("region", { name: "Related rehearsal" });
  await expect(relation).toContainText("After Rh8");
  await expect(relation.getByRole("button", { name: "Philidor: the third-rank fence holds the draw" })).toBeVisible();
  await expect(relation).not.toContainText("h6h8");
  await expect(relation).not.toContainText("philidor-third-rank-hold");
});

for (const viewport of ENDGAME_INPUT_PROJECTIONS) {
  for (const mode of ["click", "drag", "touch", "keyboard", "text"] as const satisfies readonly BoardInputMode[]) {
    test(`@matrix served endgame packs submit exact ${mode} moves at ${viewport.width}×${viewport.height}`, async ({
      page, browser,
    }) => {
      test.setTimeout(60_000);
      await enableEndgamePolicies(page);
      await page.setViewportSize(viewport);
      const touchContext = mode === "touch"
        ? await browser.newContext({ viewport, hasTouch: true, isMobile: true })
        : undefined;
      try {
        const inputPage = touchContext === undefined ? page : await touchContext.newPage();
        if (touchContext !== undefined) {
          await enableEndgamePolicies(inputPage);
          await register(inputPage);
        }
        for (const pack of ENDGAME_INTERACTION_PACKS) {
          await inputPage.goto("/play");
          await inputPage
            .getByRole("article")
            .filter({ hasText: pack.title })
            .getByRole("button", { name: /Rehearse this position/ })
            .click();
          await liveInputMove(inputPage, pack.uci, pack.orientation, mode);
        }
      } finally {
        await touchContext?.close();
      }
    });
  }
}

test("@matrix the semantic board remains complete and yields focus to a checkpoint after a keyboard move", async ({ page }) => {
  await page.goto("/play");
  await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
    .click();
  const grid = page.getByRole("grid", { name: /Board input/u });
  await expect(grid).toBeVisible();
  await expect(grid.getByRole("row")).toHaveCount(8);
  await expect(grid.getByRole("gridcell")).toHaveCount(64);
  await expect(grid.locator('[aria-selected="true"]')).toHaveCount(1);
  await expect(page.locator(".text-move summary")).toBeVisible();
  await liveInputMove(page, "c1e3", "white", "keyboard");
  const checkpoint = page.getByRole("dialog", { name: "Choose the setup" });
  await expect(checkpoint).toBeVisible();
  expect(await checkpoint.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  expect(await grid.evaluate((element) => element.closest("[inert]") !== null)).toBe(true);
  await expect(page.getByText("Board paused", { exact: true })).toBeVisible();
  await expect(page.getByText("Choose a checkpoint action to continue.", { exact: true })).toBeVisible();
  await expect(grid).toHaveAttribute("aria-readonly", "true");
  await expect(grid).toHaveAttribute("aria-describedby", "checkpoint-board-paused");
  await expect(grid).toHaveAttribute("aria-activedescendant", /-square-e3$/u);
  expect(await grid.evaluate((element) => {
    const id = element.getAttribute("aria-activedescendant");
    return id !== null && element.querySelector(`#${CSS.escape(id)}`) !== null;
  })).toBe(true);
  await expect(page.locator(".input-status")).toContainText("Move committed:");
});

test("@matrix @mobile comparison stacks complete branch cards without hidden horizontal content", async ({ page }) => {
  await page.goto("/play");
  await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
    .click();

  await move(page, "c1", "e3");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Active line 2 turns")).toBeVisible();
  await move(page, "f2", "f3");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.locator("main.drill").focus();
  await page.keyboard.press("r");
  await expect(page.getByText("Active line 2 turns")).toBeVisible();
  await page.keyboard.press("b");
  await page.getByLabel("Short name").fill("quiet setup");
  await page.getByLabel("What are you trying?").fill("Compare a lower-commitment setup");
  await page.getByRole("button", { name: "Create branch" }).click();
  await clickMove(page, "d1", "d2");
  await expect(page.getByText("Active line 4 turns")).toBeVisible();

  await page.locator("main.drill").focus();
  await page.keyboard.press("Alt+C");
  await expect(page.getByRole("heading", { name: "Same decision, two consequences." })).toBeVisible();
  await expect(page.locator(".boards article")).toHaveCount(1);
  await expect(page.locator(".boards article.shared")).toContainText("Shared recorded position · 2 attempts");
  await expect(page.locator(".compare")).not.toContainText("Tabiya structural detector");
  await expect(page.locator(".compare")).not.toContainText("Recorded engine evaluation");

  const inspectorButton = page.getByRole("button", { name: "Evidence inspector" });
  await inspectorButton.click();
  const inspector = page.getByRole("dialog", { name: "Recorded facts behind this comparison" });
  await expect(inspector).toBeVisible();
  await expect(inspector.getByText("Recorded differences by branch")).toBeVisible();
  const inspectorBounds = await inspector.boundingBox();
  const comparisonViewport = page.viewportSize();
  expect(inspectorBounds).not.toBeNull();
  expect(comparisonViewport).not.toBeNull();
  expect(inspectorBounds!.x).toBeGreaterThanOrEqual(-1);
  expect(inspectorBounds!.x + inspectorBounds!.width).toBeLessThanOrEqual(comparisonViewport!.width + 1);
  await page.getByRole("button", { name: "Return to comparison" }).click();
  await expect(inspector).toHaveCount(0);
  await expect(inspectorButton).toBeFocused();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.locator(".boards article")).toHaveCount(2);

  const overflow = await page.locator(".compare").evaluate((compare) => {
    const horizontalRegions = [...compare.querySelectorAll<HTMLElement>(".boards, .results, .strip-band")];
    const cards = [...compare.querySelectorAll<HTMLElement>(".boards > article")];
    const bounds = compare.getBoundingClientRect();
    return {
      compare: compare.scrollWidth - compare.clientWidth,
      regions: horizontalRegions.map((region) => region.scrollWidth - region.clientWidth),
      offenders: [...compare.querySelectorAll<HTMLElement>("*")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, className: element.className, right: rect.right - bounds.right };
        })
        .filter((entry) => entry.right > 1)
        .sort((left, right) => right.right - left.right)
        .slice(0, 8),
      cards: cards.map((card) => {
        const rect = card.getBoundingClientRect();
        return { left: rect.left - bounds.left, right: rect.right - bounds.right, top: rect.top };
      }),
    };
  });
  expect(overflow.compare, JSON.stringify(overflow.offenders)).toBeLessThanOrEqual(1);
  expect(overflow.regions.every((amount) => amount <= 1)).toBe(true);
  expect(overflow.cards.every((card) => card.left >= -1 && card.right <= 1)).toBe(true);
  expect(overflow.cards[1]!.top).toBeGreaterThan(overflow.cards[0]!.top);
});

test("@matrix @mobile live session and overlay keep controls and board inside the viewport", async ({ page }) => {
  await page.goto("/play");
  await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
    .click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await page.goto("/live");
  await page.getByLabel("Session title").fill("academy session");
  await page.getByRole("button", { name: "Create academy" }).first().click();
  await expect(page.getByRole("heading", { name: "academy session" })).toBeVisible();

  const sessionGeometry = await page.locator("main.shell-view").evaluate((main) => {
    const viewportWidth = document.documentElement.clientWidth;
    const controls = [...main.querySelectorAll<HTMLElement>("button, input, select")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > viewportWidth + 1);
      })
      .map((element) => element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName);
    const grid = main.querySelector<HTMLElement>(".studio-grid")!;
    return {
      overflow: main.scrollWidth - main.clientWidth,
      controls,
      columns: getComputedStyle(grid).gridTemplateColumns,
    };
  });
  expect(sessionGeometry.overflow).toBeLessThanOrEqual(1);
  expect(sessionGeometry.controls).toEqual([]);
  expect(sessionGeometry.columns.trim().split(/\s+/u)).toHaveLength(1);

  await page.getByRole("button", { name: "Open overlay" }).click();
  const overlay = page.getByLabel("Live session overlay");
  await expect(overlay).toBeVisible();
  const overlayGeometry = await overlay.evaluate((main) => {
    const board = main.querySelector<HTMLElement>('[aria-label="Chessboard"]')!.getBoundingClientRect();
    const copy = main.querySelector<HTMLElement>("aside")!.getBoundingClientRect();
    const bounds = main.getBoundingClientRect();
    return {
      overflow: main.scrollWidth - main.clientWidth,
      offenders: [...main.querySelectorAll<HTMLElement>("*")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName, className: element.className, right: rect.right - bounds.right };
        })
        .filter((entry) => entry.right > 1)
        .sort((left, right) => right.right - left.right)
        .slice(0, 8),
      board: { left: board.left, right: board.right, top: board.top, bottom: board.bottom },
      copy: { left: copy.left, right: copy.right, top: copy.top },
      viewportWidth: document.documentElement.clientWidth,
    };
  });
  expect(overlayGeometry.overflow, JSON.stringify(overlayGeometry.offenders)).toBeLessThanOrEqual(1);
  expect(overlayGeometry.board.left).toBeGreaterThanOrEqual(-1);
  expect(overlayGeometry.board.right).toBeLessThanOrEqual(overlayGeometry.viewportWidth + 1);
  expect(overlayGeometry.copy.left).toBeGreaterThanOrEqual(-1);
  expect(overlayGeometry.copy.right).toBeLessThanOrEqual(overlayGeometry.viewportWidth + 1);
  expect(overlayGeometry.copy.top).toBeGreaterThanOrEqual(overlayGeometry.board.bottom - 1);
});

test("@matrix @mobile named-shape dialog stays bounded with every action reachable", async ({ page }) => {
  await page.goto("/play");
  await page.evaluate(() => localStorage.setItem("tabiya.assistance.v1.position", JSON.stringify({ version: 4, markers: "off", guided: "live", humanSplit: "off", corpus: "off", voice: "authored", spoken: "off", boardLighting: "legal", arrows: "off", ambient: "off" })));
  await page.getByLabel("Your side").selectOption("black");
  await page.getByRole("button", { name: "Start from a FEN" }).click();
  await page.getByLabel("Position FEN").fill("r1bqr1k1/pppnbppp/5n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await move(page, "c7", "c6", "black");
  const marker = page.getByRole("button", { name: /Carlsbad structure/ });
  await marker.click();
  const panel = page.getByRole("dialog", { name: "Carlsbad structure" });
  await expect(panel).toBeVisible();

  const geometry = await panel.evaluate((dialog) => {
    const viewport = { width: document.documentElement.clientWidth, height: document.documentElement.clientHeight };
    const bounds = dialog.getBoundingClientRect();
    const actions = [...dialog.querySelectorAll<HTMLElement>("button")].map((button) => {
      const rect = button.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    });
    return {
      bounds: { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom },
      viewport,
      overflow: dialog.scrollWidth - dialog.clientWidth,
      actions,
    };
  });
  expect(geometry.bounds.left).toBeGreaterThanOrEqual(-1);
  expect(geometry.bounds.right).toBeLessThanOrEqual(geometry.viewport.width + 1);
  expect(geometry.bounds.top).toBeGreaterThanOrEqual(-1);
  expect(geometry.bounds.bottom).toBeLessThanOrEqual(geometry.viewport.height + 1);
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.actions.every((action) => action.left >= -1 && action.right <= geometry.viewport.width + 1)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(marker).toBeFocused();
});

test("@matrix @mobile classroom standing uses learner cards instead of a sideways table", async ({ page }) => {
  await page.goto("/live");
  const classrooms = page.getByRole("region").filter({ has: page.getByRole("heading", { name: "Classrooms" }) });
  await classrooms.getByLabel("New classroom").fill("Phone cohort");
  await classrooms.getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Phone cohort" })).toBeVisible();
  await classrooms.getByRole("button", { name: "Open" }).click();
  await expect(page.getByText("No standing is open for this classroom.")).toBeVisible();
  await page.getByRole("button", { name: "Open standing" }).click();
  await expect(page.getByText("Join this standing")).toBeVisible();
  await page.getByRole("button", { name: "Join this standing" }).click();
  await page.getByRole("button", { name: "Publish my record" }).click();

  const standing = page.locator(".standing");
  const cards = standing.getByRole("list", { name: "Classroom standing" });
  await expect(cards).toBeVisible();
  await expect(standing.locator(".table-scroll")).toBeHidden();
  await expect(cards.getByRole("listitem")).toHaveCount(1);
  const geometry = await standing.evaluate((section) => {
    const bounds = section.getBoundingClientRect();
    const controls = [...section.querySelectorAll<HTMLElement>("button, input")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
      })
      .map((element) => element.textContent?.trim() ?? element.tagName);
    return { overflow: section.scrollWidth - section.clientWidth, controls };
  });
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.controls).toEqual([]);
});

test("@matrix @mobile branch group stacks complete candidate cards without sideways panning", async ({ page }) => {
  await page.goto("/play");
  await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
    .click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await move(page, "c1", "e3");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Actions" }).click();
  await page.getByRole("button", { name: "Branch group" }).click();
  await move(page, "f2", "f3");
  await move(page, "h2", "h3");
  await move(page, "a2", "a3");
  await page.getByRole("button", { name: "Create group" }).click();
  const checkpoint = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Continue" }) });
  await expect(checkpoint).toBeVisible();
  await checkpoint.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Branches" }).click();

  const group = page.locator(".group-panel");
  await expect(group).toBeVisible();
  await expect(group.locator("[data-group-member]")).toHaveCount(3);
  const geometry = await group.evaluate((section) => {
    const bounds = section.getBoundingClientRect();
    const cards = [...section.querySelectorAll<HTMLElement>("[data-group-member]")].map((card) => {
      const rect = card.getBoundingClientRect();
      return { left: rect.left - bounds.left, right: rect.right - bounds.right, top: rect.top };
    });
    const controls = [...section.querySelectorAll<HTMLElement>("button, select")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
      })
      .map((element) => element.textContent?.trim() ?? element.tagName);
    return {
      overflow: section.scrollWidth - section.clientWidth,
      canvasOverflow: section.querySelector<HTMLElement>(".canvas")!.scrollWidth - section.querySelector<HTMLElement>(".canvas")!.clientWidth,
      cards,
      controls,
    };
  });
  expect(geometry.overflow).toBeLessThanOrEqual(1);
  expect(geometry.canvasOverflow).toBeLessThanOrEqual(1);
  expect(geometry.cards.every((card) => card.left >= -1 && card.right <= 1)).toBe(true);
  expect(geometry.cards[1]!.top).toBeGreaterThan(geometry.cards[0]!.top);
  expect(geometry.cards[2]!.top).toBeGreaterThan(geometry.cards[1]!.top);
  expect(geometry.controls).toEqual([]);
});

test("the drill keyboard map remains contained and scrollable at the supported phone floor", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 680 });
  await page.goto("/play");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await page.getByRole("button", { name: "Keyboard shortcuts" }).click();

  const dialog = page.getByRole("dialog", { name: "Keep your hands on the position." });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  if (box === null) throw new TypeError("Keyboard map has no rendered bounds");
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(680);
  expect(await dialog.evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");
  expect(await page.getByRole("button", { name: "Keyboard shortcuts" }).evaluate((element) => element.closest("[inert]") !== null)).toBe(true);
  const close = dialog.getByRole("button", { name: "Close" });
  await close.focus();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
});

test("@mobile the branch-group palette stays bounded while the board remains its move picker", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await page.goto("/play");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await page.getByRole("button", { name: "Actions" }).click();
  const open = page.getByRole("button", { name: "Branch group" });
  await open.click();

  const palette = page.getByRole("dialog", { name: "Create a branch group" });
  await expect(palette).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create a branch group" })).toBeFocused();
  await expect(palette).toHaveAttribute("aria-modal", "false");
  await palette.scrollIntoViewIfNeeded();
  const paletteBounds = await palette.boundingBox();
  if (paletteBounds === null) throw new TypeError("Branch-group palette has no rendered bounds");
  expect(paletteBounds.x).toBeGreaterThanOrEqual(0);
  expect(paletteBounds.y).toBeGreaterThanOrEqual(0);
  expect(paletteBounds.x + paletteBounds.width).toBeLessThanOrEqual(320);
  expect(paletteBounds.y + paletteBounds.height).toBeLessThanOrEqual(257);
  expect(await palette.evaluate((element) => getComputedStyle(element).overflowY)).toBe("auto");

  await palette.getByRole("button", { name: "Choose moves on the board" }).click();
  await expect(page.locator("[data-board-input-grid]")).toBeFocused();
  await move(page, "e2", "e4");
  await expect(palette.locator(".candidate-chips")).toContainText("e4");
  await expect(page.getByLabel("Chessboard")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(palette).toHaveCount(0);
  await expect(page.locator("main.drill")).toBeFocused();
});

test("drill shortcuts keep native controls and never leak a shell chord from the board", async ({ page }) => {
  await page.goto("/play");
  await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
    .click();

  const help = page.getByRole("button", { name: "Keyboard shortcuts" });
  await help.focus();
  await page.keyboard.press("b");
  await expect(page.getByRole("dialog", { name: "Name the experiment." })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(help).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("main.drill")).toBeFocused();

  await page.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("button", { name: "Fork branch", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Replay", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeVisible();

  const grid = page.getByRole("grid", { name: /Board input/u });
  await grid.focus();
  const runUrl = page.url();
  await page.keyboard.press("g");
  await page.keyboard.press("h");
  await expect(page).toHaveURL(runUrl);
});

test("@matrix normal Tab traversal reaches every drill region in both directions and exits", async ({ page }) => {
  await page.goto("/play");
  await schemaPackCard(page)
    .getByRole("button", { name: /Rehearse this position/ })
    .click();
  await page.locator(".text-move summary").click();
  const entry=page.getByRole("dialog",{name:"Enter a move",exact:true});
  await expect(entry).toBeVisible();
  const entryBackground = [".topbar", ".board-slot", ".timeline-strip .timeline", ".rail-stack"];
  for (const selector of entryBackground) await expect(page.locator(selector)).toHaveAttribute("inert", "");
  expect(await entry.evaluate(e => e.closest("[inert]") === null)).toBe(true);
  const input=entry.getByLabel("Move in chess notation"), submit=entry.getByRole("button",{name:"Submit move"});
  await input.focus();await page.keyboard.press("Tab");await expect(submit).toBeFocused();
  await page.keyboard.press("Tab");await expect(entry.getByRole("link",{name:"Appearance"})).toBeFocused();
  await page.keyboard.press("Tab");await expect(entry.locator("summary")).toBeFocused();
  await page.keyboard.press("Shift+Tab");await expect(entry.getByRole("link",{name:"Appearance"})).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(entry).toBeHidden();await expect(page.locator(".text-move summary")).toBeFocused();
  for (const selector of entryBackground) await expect(page.locator(selector)).not.toHaveAttribute("inert", "");

  const marker = () => page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return { inside: false, marker: "none" };
    const inside = active.closest(".drill-region") !== null;
    const value = active.matches(".wordmark") ? "wordmark"
      : active.matches(".assistance-control summary") ? "assistance"
      : active.matches(".inspector-entry") ? "inspector"
      : active.matches('button[aria-label="Keyboard shortcuts"]') ? "help"
      : active.matches(".text-move summary") ? "text-summary"
      : active.matches(".text-move input") ? "text-input"
      : active.matches(".text-move button") ? "text-submit"
      : active.matches("[data-board-input-grid]") ? "board-grid"
      : active.matches(".mark-controls select") ? "board-marks"
      : active.matches(".compact-tabs button") ? "companion-tabs"
      : active.matches(".branch-seat button, .branch-seat input") ? "branches"
      : active.matches(".timeline, .timeline button") ? "timeline"
      : active.matches(".quick-actions button") ? "run-actions"
      : `${active.tagName.toLowerCase()}:${active.className}`;
    return { inside, marker: value };
  });

  async function trace(keys: "Tab" | "Shift+Tab", start: Locator): Promise<Set<string>> {
    await start.focus();
    const seen = new Set<string>();
    let entered = false;
    for (let index = 0; index < 120; index += 1) {
      const current = await marker();
      if (current.inside) entered = true;
      if (entered && !current.inside) return seen;
      seen.add(current.marker);
      await page.keyboard.press(keys);
    }
    throw new Error(`${keys} did not leave the drill region`);
  }

  const alwaysReachable = ["assistance", "inspector", "help", "text-summary", "board-grid", "timeline", "companion-tabs"];
  for (const [region, regionMarkers, reverseStart] of [
    ["Branches", ["branches"], ".branch-seat button"],
    ["Actions", ["board-marks", "run-actions"], ".quick-actions button:last-child"],
  ] as const) {
    await page.getByRole("button", { name: region, exact: true }).click();
    const expected = [...alwaysReachable, ...regionMarkers];
    const forward = await trace("Tab", page.locator("main.drill .wordmark"));
    for (const item of expected) expect(forward.has(item), `${region} forward traversal missed ${item}`).toBe(true);
    const backward = await trace("Shift+Tab", page.locator(reverseStart).last());
    for (const item of expected) expect(backward.has(item), `${region} reverse traversal missed ${item}`).toBe(true);
  }
});

test("shared assistance codec preserves legacy settings and explains unreadable current preferences", async ({ page }) => {
  await page.goto("/settings");
  const config = { version: 4, markers: "live", guided: "live", humanSplit: "on_request", corpus: "on_request",
    voice: "authored", spoken: "off", boardLighting: "evidence", arrows: "evidence", ambient: "on" };
  await page.evaluate((value) => {
    localStorage.removeItem("tabiya.workflow.v2.position");
    localStorage.setItem("tabiya.assistance.v1.position", JSON.stringify({ ...value, ignored: "historical", hintDistance: "move" }));
  }, config);
  await page.reload();
  await page.locator("summary").filter({ hasText: "Advanced: set help before you start" }).click();
  const position = page.getByRole("group", { name: "Just Play" });
  await expect(position.getByLabel("Help style")).toHaveValue("custom");
  await position.locator("summary").filter({ hasText: "Individual help channels" }).click();
  for (const label of ["Passive markers", "Named-pattern guidance", "Human move split on request", "Corpus counts on request", "Ambient presence"]) {
    await expect(position.getByLabel(label, { exact: true })).toBeChecked();
  }
  await expect(position.getByLabel("Board lighting")).toHaveValue("evidence");
  await expect(position.getByRole("combobox", { name: /^Arrows\b/u })).toHaveValue("evidence");
  await expect(position.getByLabel("Spoken guidance")).toHaveValue("off");
  await expect(position.getByLabel("External voice")).not.toBeChecked();
  const key = "tabiya.workflow.v2.position";
  const sealed = await page.evaluate((key) => localStorage.getItem(key), key);
  expect(JSON.parse(sealed!)).toEqual({ version: 2, assistanceHead: 4, intent: {
    kind: "migrated_snapshot", preset: "quiet", config, sourceVersion: 4, moduleOverrides: { include: [], exclude: [] },
  } });
  await page.reload();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(sealed);
  await page.evaluate((key) => localStorage.setItem(key, "unreadable-current-preference"), key);
  await page.reload();
  await page.locator("summary").filter({ hasText: "Advanced: set help before you start" }).click();
  await expect(position.getByLabel("Help style")).toHaveValue("quiet");
  await expect(position.getByRole("status")).toHaveText("Your saved help settings could not be read, so this workflow's default is shown.");
  await expect(position.getByLabel("Help style")).toHaveAttribute("aria-describedby", "help-recovery-position");
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe("unreadable-current-preference");
  await position.getByLabel("Help style").selectOption("guided");
  await expect(position.getByRole("status")).toHaveCount(0);
  await page.reload();
  await page.locator("summary").filter({ hasText: "Advanced: set help before you start" }).click();
  await expect(position.getByLabel("Help style")).toHaveValue("guided");
  expect(JSON.parse((await page.evaluate((key) => localStorage.getItem(key), key))!)).toMatchObject({ version: 2, assistanceHead: 4, intent: { kind: "explicit", preset: "guided" } });
});

test("@matrix mobile shell, settings, and install manifest preserve the run regions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings");
  // SET-a14: ordinary Settings states the in-flow choice; per-activity help sits behind one Advanced door.
  await expect(page.locator("#playing-settings")).not.toContainText(/\bcontexts?\b/iu);
  await expect(page.getByRole("group", { name: "Just Play" })).toBeHidden();
  await page.locator("summary").filter({ hasText: "Advanced: set help before you start" }).click();
  await expect(page.getByLabel("Activity")).toHaveValue("position");
  const position = page.getByRole("group", { name: "Just Play" });
  const ambientLabel = position.locator("label").filter({ hasText: "Ambient presence" });
  expect(await ambientLabel.evaluate((element) => getComputedStyle(element).display)).toBe("flex");
  expect(await ambientLabel.evaluate((element) => getComputedStyle(element).alignItems)).toBe("center");
  await expect(page).toHaveTitle("Settings · Tabiya");
  await expect(position.getByLabel("Help style")).toHaveValue("quiet");
  await position.locator("summary").filter({ hasText: "Individual help channels" }).click();
  await position.getByLabel("Board lighting").selectOption("sight");
  await page.reload();
  await page.locator("summary").filter({ hasText: "Advanced: set help before you start" }).click();
  await position.locator("summary").filter({ hasText: "Individual help channels" }).click();
  await expect(position.getByLabel("Board lighting")).toHaveValue("sight");
  await expect(position.getByLabel("Help style")).toHaveValue("custom");
  await page.goto("/play");
  await expect(page).toHaveTitle("Play · Tabiya");
  await chooseRawRung(page);
  await page.getByRole("button", { name: "Start and keep the game" }).click();
  await expect(page).toHaveTitle("Rehearsal · Tabiya");
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await page.evaluate(() => {
    const key = "tabiya.workflow.v2.position";
    const current = JSON.parse(localStorage.getItem(key) ?? "{}") as { intent: { overrides: Record<string, unknown> } };
    localStorage.setItem(key, JSON.stringify({ ...current, intent: { ...current.intent, overrides: { ...current.intent.overrides, ambient: "on" } } }));
    dispatchEvent(new StorageEvent("storage", { key }));
  });
  await expect(page.getByRole("button", { name: "Open assistance" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Run regions" })).toBeVisible();
  const runContext = page.locator("main.drill [data-status-announcement]").first();
  await expect(runContext).toHaveAttribute("aria-live", "polite");
  expect(await runContext.evaluate((element) => getComputedStyle(element).display)).not.toBe("none");
  const contextBox = await runContext.boundingBox();
  expect(contextBox?.width).toBeLessThanOrEqual(1);
  expect(contextBox?.height).toBeLessThanOrEqual(1);
  await page.locator(".text-move summary").click();
  const appearanceBox = await page.getByRole("link", { name: "Appearance" }).boundingBox();
  expect(appearanceBox?.width).toBeGreaterThanOrEqual(24);
  expect(appearanceBox?.height).toBeGreaterThanOrEqual(24);
  for (const target of [page.getByLabel("Move in chess notation"), page.getByRole("button", { name: "Submit move" })]) {
    const box = await target.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(24);
    expect(box?.height).toBeGreaterThanOrEqual(24);
  }
  await page.locator(".text-move summary").click();
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 680 }] as const) {
    await page.setViewportSize(viewport);
    await assertRunViewport(page, viewport);
    const calmRect = await page.getByLabel("Chessboard").boundingBox();
    expect(calmRect).not.toBeNull();
    const permanentTargets = page.locator(".compact-tabs button:visible, .timeline-strip button:visible");
    for (let index = 0; index < await permanentTargets.count(); index += 1) {
      const box = await permanentTargets.nth(index).boundingBox();
      expect(box, `permanent run target ${index} has no rendered box`).not.toBeNull();
      expect(box!.width, `permanent run target ${index} is too narrow`).toBeGreaterThanOrEqual(24);
      expect(box!.height, `permanent run target ${index} is too short`).toBeGreaterThanOrEqual(24);
    }
    for (const tab of ["Support", "Branches", "Actions"] as const) {
      await page.getByRole("button", { name: tab }).click();
      await assertRunViewport(page, viewport);
      await expect(page.locator(".rail-stack")).toHaveClass(/sheet-open/);
      await expect(page.getByRole("region", { name: tab === "Actions" ? "Run actions" : tab })).toBeVisible();
      await expect(page.locator(".timeline-strip")).toBeVisible();
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calmRect);
      await page.getByRole("button", { name: "Collapse companion" }).click();
      expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calmRect);
    }
    await page.locator(".objective-line").click();
    await expect(page.getByRole("dialog", { name: /Nothing is authored about this position/ })).toBeVisible();
    expect(await page.getByLabel("Chessboard").boundingBox()).toEqual(calmRect);
    await page.getByRole("button", { name: "Return to the board" }).click();
  }
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto("/play");
  await page
    .getByRole("article")
    .filter({ hasText: "Outcome hold browser fixture" })
    .getByRole("button", { name: /Rehearse this position/ })
    .click();
  await page.getByRole("button", { name: "Support" }).click();
  await expect(page.getByText("No opponent move has been played yet.")).toBeVisible();
  await expect(page.getByText("Starting assessment from the drill author:", { exact: false })).toBeVisible();
  await assertRunViewport(page, { width: 430, height: 932 });
  await page.getByRole("button", { name: "Collapse companion" }).click();
  expect((await page.locator('[aria-label="Chessboard"]').boundingBox())!.width).toBeGreaterThan(192);
  const dimensions = await page.evaluate(() => ({ scrollHeight: document.scrollingElement!.scrollHeight, clientHeight: document.scrollingElement!.clientHeight }));
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight + 1);
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200); expect((await manifest.json()).display).toBe("standalone");
  expect(await page.locator('link[rel="manifest"]').getAttribute("href")).toBe("/manifest.webmanifest");
  expect(await page.evaluate(async () => "serviceWorker" in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0)).toBe(0);

  for (const viewport of [
    { width: 375, height: 667 },
    { width: 844, height: 390 },
    { width: 320, height: 256 },
  ] as const) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole("alert")).toHaveCount(0);
    const board = page.getByLabel("Chessboard");
    await expect(board).toBeVisible();
    await expect.poll(
      async () => (await board.boundingBox())?.width,
      { message: `${viewport.width}x${viewport.height}: board did not settle to the viewport geometry` },
    ).toBe(playBoardEdge(viewport.width, viewport.height));
    const boardBox = await board.boundingBox();
    expect(boardBox).not.toBeNull();
    expect(boardBox!.width).toBe(playBoardEdge(viewport.width, viewport.height));
    expect(boardBox!.width).toBeGreaterThanOrEqual(192);
    expect(boardBox!.x).toBeGreaterThanOrEqual(-1);
    expect(boardBox!.x + boardBox!.width).toBeLessThanOrEqual(viewport.width + 1);
    const reflow = await page.locator(".drill-region").evaluate((element) => ({
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
    }));
    expect(reflow.scrollWidth).toBeLessThanOrEqual(reflow.clientWidth + 1);
    if (viewport.height === 256) expect(reflow.scrollHeight).toBeGreaterThan(reflow.clientHeight);
    await expect(page.locator("main.drill")).toHaveClass(/compact/);
    const regions = page.getByRole("navigation", { name: "Run regions" });
    await regions.scrollIntoViewIfNeeded();
    const regionTabs = ["Support", "Branches", "Actions"].map((name) => regions.getByRole("button", { name, exact: true }));
    const selected = await Promise.all(regionTabs.map((tab) => tab.getAttribute("aria-pressed")));
    expect(selected.filter((value) => value === "true")).toHaveLength(1);
    await regions.getByRole("button", { name: "Branches", exact: true }).click();
    await expect(regions.getByRole("button", { name: "Branches", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(regions.getByRole("button", { name: "Support", exact: true })).toHaveAttribute("aria-pressed", "false");
    await expect(regions.getByRole("button", { name: "Actions", exact: true })).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Collapse companion" }).click();
  }

  await page.setViewportSize({ width: 319, height: 844 });
  await expect(page.getByRole("alert")).toContainText("This screen is too small for a playable board");
  await expect(page.getByRole("alert")).toContainText("Make the window a little larger or rotate your device");
  await expect(page.getByRole("alert")).not.toContainText("CSS pixels");
  await expect(page.locator('[aria-label="Chessboard"]')).toHaveCount(0);
  await page.getByRole("button", { name: "Return to Play" }).click();
  await expect(page.getByRole("heading", { name: "Choose the game you want to understand." })).toBeVisible();
});
