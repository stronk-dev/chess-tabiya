import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

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
  await expect(page.getByText("Choose a position worth returning to.")).toBeVisible();
  return handle;
}

test.beforeEach(async ({ page }) => register(page));

test("Just Play reaches a Carlsbad and opens a passive shape marker without mutating the run", async ({ page }) => {
  await page.getByLabel("Your side").selectOption("black");
  await page.getByLabel("Optional FEN").fill("r1bqr1k1/pppnbppp/5n2/3p2B1/3P4/2NBP3/PPQ1NPPP/R4RK1 b - - 7 10");
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByRole("button", { name: /Carlsbad structure/ })).toHaveCount(0);
  await expect(page.getByText("No pack is loaded. Nothing is claimed about this position.")).toBeVisible();

  await move(page, "c7", "c6", "black");
  const marker = page.getByRole("button", { name: /Carlsbad structure/ });
  await expect(marker).toBeVisible();
  const runId = page.url().split("/").at(-1)!;
  const before = await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json() as { events: unknown[] };
  await marker.click();
  const panel = page.getByRole("complementary", { name: "Carlsbad structure" });
  await expect(panel).toContainText("Named plans for this structure — general to the kind of position, not advice for this one.");
  await expect(panel).toContainText("CC-BY-SA-4.0");
  for (const label of ["Minority attack", "Central break", "Kingside attack", "Trade pieces", "Freeze the queenside", "Central counter-break"]) await expect(panel.getByText(label, { exact: true })).toBeVisible();
  const after = await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json() as { events: unknown[] };
  expect(after.events).toHaveLength(before.events.length);
  await expect(page.getByText("Authored commentary withheld", { exact: false })).toHaveCount(0);
});

test("Pack B references the Carlsbad entry while its pack prose stays server-withheld", async ({ page }) => {
  const list = await page.request.get("/packs");
  const packs = await list.json() as { id: string; title: string }[];
  const pack = packs.find((candidate) => candidate.id === "carlsbad-minority-attack")!;
  const detail = await page.request.get(`/packs/${pack.id}`);
  const projected = await detail.json() as Record<string, unknown>;
  expect(projected.shapes).toEqual(["carlsbad"]);
  expect(projected).not.toHaveProperty("planClasses");
  expect(projected).not.toHaveProperty("successConditions");

  await page.getByRole("article").filter({ hasText: pack.title }).getByRole("button", { name: /Open position/ }).click();
  const marker = page.getByRole("button", { name: /Carlsbad structure/ });
  await expect(marker).toBeVisible();
  await marker.click();
  const generic = "Two queenside pawns advance against three";
  await expect(page.getByText(generic, { exact: false })).toHaveCount(1);
  await expect(page.getByText("In this tabiya the plan is already supported", { exact: false })).toHaveCount(0);
});

test("Live turns a run into a session and exposes a chrome-free overlay", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "schema example" }).first();
  await card.getByRole("button", { name: /Open position/ }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await page.locator("#primary-navigation").getByRole("link", { name: "Live" }).click();
  await expect(page.getByRole("heading", { name: "Rehearse with other people." })).toBeVisible();
  await page.getByRole("button", { name: "Create academy" }).first().click();
  await expect(page.getByRole("heading", { name: "academy session" })).toBeVisible();
  await expect(page.getByText("your role: host")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Invitations" })).toBeVisible();
  await expect(page.getByLabel("Tabiya handle")).toBeVisible();
  await page.getByRole("button", { name: "Open overlay" }).click();
  await expect(page.getByLabel("Live session overlay")).toBeVisible();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.locator("#primary-navigation")).toHaveCount(0);
});

test("library exposes phase honestly and survives a malformed pack response", async ({
  page,
}) => {
  const expected = [
    ["Carlsbad structure", "middlegame"],
    ["Rook endings", "endgame"],
    ["Caro-Kann Advance", "opening"],
    ["Najdorf", "cross phase"],
  ] as const;
  for (const [name, phase] of expected) {
    const card = page.getByRole("article").filter({ hasText: name }).first();
    await expect(card).toContainText(phase);
  }

  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.route(/\/packs\/[^/]+$/u, async (route) => {
    const response = await route.fetch();
    const body = (await response.json()) as { start?: Record<string, unknown> };
    if (body.start !== undefined) delete body.start.side;
    await route.fulfill({ response, json: body });
  });
  const card = page.getByRole("article").filter({ hasText: "schema example" });
  await card.getByRole("button", { name: /Open position/ }).click();
  await expect(page.getByRole("alert")).toContainText("did not declare start.side");
  await expect(page.getByText("Choose a position worth returning to.")).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("terminal outcome reveals authored commentary and recorded evidence", async ({ page }) => {
  const card = page
    .getByRole("article")
    .filter({ hasText: "Terminal outcome browser fixture" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: /Open position/ }).click();

  await move(page, "f2", "f3");
  await expect(page.getByRole("heading", { name: "Before terminal continuation" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await move(page, "g2", "g4");

  await expect(page.getByRole("heading", { name: "You lost." })).toBeVisible();
  await expect(page.getByText("Terminal browser fixture commentary.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recorded evidence" })).toBeVisible({
    timeout: 5_000,
  });
  await expect(page.getByText("Engine evidence recorded", { exact: false })).toBeVisible();
  await expect(page.getByText("Thinking…")).toHaveCount(0);
});

test("Outcome Drill resolves a non-terminal hold and remains playable", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Outcome hold browser fixture" });
  await card.getByRole("button", { name: /Open position/ }).click();
  await expect(page.getByText("No opponent move has been played yet.")).toBeVisible();
  await expect(page.getByText("Root assessment (authored, unproved):", { exact: false })).toBeVisible();

  await move(page, "e2", "e4");
  await expect(page.getByText("Active line 2 plies")).toBeVisible();
  await move(page, "g1", "f3");
  await expect(page.getByRole("heading", { name: "Authored hold horizon" })).toBeVisible();
  await expect(page.getByText("without conceding the result", { exact: false })).toBeVisible();
  await expect(page.getByText("not a proof of the position", { exact: false })).toBeVisible();
  const checkpointSheet = page.getByRole("dialog");
  await expect(checkpointSheet.getByText("Deterministic mock opponent", { exact: false })).toBeVisible();
  await expect(checkpointSheet.getByText("Applied policy: theory_strict", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await clickMove(page, "f1", "b5");
  await expect(page.getByText("Active line 6 plies")).toBeVisible();
});

test("Outcome Drill can grade a terminal loss as successful resistance", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Outcome resist browser fixture" });
  await card.getByRole("button", { name: /Open position/ }).click();
  await move(page, "f2", "f3");
  await expect(page.getByRole("heading", { name: "Resistance horizon" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await clickMove(page, "g2", "g4");
  await expect(page.getByRole("heading", { name: "You lost." })).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("Objective: resist — achieved"),
  ).toBeVisible();
});

test("Pack C names authored assessment and the opponent that actually moved", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Rook endings: holding 3 against 4" });
  await card.getByRole("button", { name: /Open position/ }).click();
  await expect(page.getByText("Eleven pieces are on the board", { exact: false })).toBeVisible();
  await expect(page.getByText("Requested resistance: human_common, target Elo 1900", { exact: false })).toBeVisible();
  await expect(page.getByText("Deterministic mock opponent", { exact: false })).toBeVisible();
  await expect(page.getByText("Maia", { exact: false })).toHaveCount(0);
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

async function move(page: Page, from: string, to: string, orientation: "white" | "black" = "white"): Promise<void> {
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
  const origin = squarePoint(box, from, orientation);
  const destination = squarePoint(box, to, orientation);
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
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
  const destination = squarePoint(box, to);
  await page.mouse.click(origin.x, origin.y);
  await page.mouse.click(destination.x, destination.y);
}

test("served Najdorf pack plays, rewinds, branches, compares, and exports", async ({
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

  await expect(page.getByText("schema example")).toBeVisible();
  const boardStart = await page.evaluate(() => performance.now());
  await page
    .getByRole("article")
    .filter({ hasText: "schema example" })
    .getByRole("button", { name: /Open position/ })
    .click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  const structuralReading = page.getByRole("button", { name: "Structural reading" });
  await expect(structuralReading).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".structural-facts")).toHaveCount(0);
  await structuralReading.click();
  await expect(page.locator(".structural-facts")).toBeVisible();
  await expect(page.locator(".structural-facts p").first()).toBeVisible();
  await structuralReading.click();
  const boardReadyMs =
    (await page.evaluate(() => performance.now())) - boardStart;

  await move(page, "c1", "e3");
  await expect(page.getByRole("heading", { name: "Choose the setup" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Predict the reply" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Active line 2 plies")).toBeVisible();

  await move(page, "f2", "f3");
  await expect(
    page.getByRole("heading", { name: "Critical race resolved" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  const rewindStart = await page.evaluate(() => performance.now());
  await page.keyboard.press("r");
  await expect(page.getByText("Active line 2 plies")).toBeVisible();
  const rewindMs =
    (await page.evaluate(() => performance.now())) - rewindStart;

  await page.keyboard.press("b");
  await page.getByLabel("Label").fill("quiet setup");
  await page.getByLabel("Intent").fill("Compare a lower-commitment setup");
  await page.getByRole("button", { name: "Create branch" }).click();
  await move(page, "f1", "e2");
  await expect(page.getByText("Active line 4 plies")).toBeVisible();

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
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("heading", { name: "Same decision, two consequences." }),
  ).toBeVisible();
  await expect(page.locator(".boards article")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "quiet setup" })).toHaveCount(2);
  await expect(page.getByText("active → achieved")).toBeVisible();
  await expect(
    page.getByText("Checkpoint reached: Critical race resolved."),
  ).toBeVisible();
  await expect(page.locator(".fork-marker")).toHaveText("Fork");
  await expect(
    page.locator('.evidence-cell[data-ply-offset="0"] .evidence-entry'),
  ).toHaveCount(2);

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

  await page.keyboard.press("Tab");
  await expect(page.locator("main.drill")).toBeFocused();
  const playNavigation = page.locator("#primary-navigation a[href='/play']");
  await playNavigation.focus();
  await page.keyboard.press("Tab");
  await expect(page.locator("#primary-navigation a[href='/learn']")).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Same decision, two consequences." }),
  ).toHaveCount(0);
  await page.locator("main.drill").focus();
  await page.keyboard.press("g");
  await page.keyboard.press("m");
  await expect(page.locator("#primary-navigation a").first()).toBeFocused();

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

test("Pack A withholds its line, grades the boundary, and renders authored theory", async ({
  page,
}) => {
  const card = page
    .getByRole("article")
    .filter({ hasText: "Caro-Kann Advance: winning the c5 race" });
  await expect(card).toBeVisible();
  const projected = await page.request.get("/packs/anti-caro-advance-c5-race");
  expect(projected.ok(), await projected.text()).toBe(true);
  expect((await projected.json()).spine).toEqual([]);
  await card.getByRole("button", { name: /Open position/ }).click();

  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByText("Active line 1 plies")).toBeVisible();
  await expect(page.getByText("Authored commentary withheld until checkpoints")).toBeVisible();
  await move(page, "g1", "f3");
  await expect(page.getByText("Active line 3 plies")).toBeVisible();
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
  await expect(page.getByText("Active line 5 plies")).toBeVisible();
  await expect(page.getByRole("heading", { name: "...c5 has landed" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await move(page, "e1", "g1");
  const boundarySheet = page.getByRole("dialog");
  await expect(boundarySheet.getByRole("heading", { name: "You are past the authored line" })).toBeVisible();
  await expect(boundarySheet.getByText("concept_violation", { exact: false })).toBeVisible();
  await expect(boundarySheet.getByText("Castling into the break", { exact: false })).toBeVisible();
  await expect(page.getByText("Objective: follow_theory — degraded", { exact: false })).toBeVisible();
  await expect(boundarySheet.getByText("Applied policy: theory_strict", { exact: false })).toBeVisible();
});

test("Line Drill crosses a cap on-line, continues, and renders unknown honestly", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Line Drill boundary browser fixture" });
  await card.getByRole("button", { name: /Open position/ }).click();
  await expect(page.getByText("Requested resistance: theory_strict", { exact: false })).toBeVisible();
  await expect(page.getByText("No opponent move has been played yet.")).toBeVisible();

  await move(page, "c1", "e3");
  await expect(page.getByText("Active line 2 plies")).toBeVisible();
  await move(page, "f2", "f3");
  await expect(page.getByRole("heading", { name: "The authored support cap is crossed" })).toBeVisible();
  await expect(page.getByText("Ply 1, Be3: on the authored line.")).toBeVisible();
  await expect(page.getByText("Ply 2, e6: on the authored line.")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Active line 4 plies")).toBeVisible();

  await move(page, "a2", "a3");
  await expect(page.getByRole("heading", { name: "The pack is silent here" })).toBeVisible();
  await expect(page.getByText("Ply 5, a3: this pack has no statement about this move.")).toBeVisible();
  await expect(page.getByText("Unknown is not a judgement", { exact: false })).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Applied policy: theory_strict", { exact: false })).toBeVisible();
  await expect(page.getByText("predate policy recording", { exact: false })).toHaveCount(0);
});

test("a granted spectator follows a run without receiving a write control", async ({
  page,
  browser,
}) => {
  const card = page
    .getByRole("article")
    .filter({ hasText: "Caro-Kann Advance: winning the c5 race" });
  await card.getByRole("button", { name: /Open position/ }).click();
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
  await expect(spectator.getByText("Read-only", { exact: true })).toBeVisible();
  await expect(spectator.getByRole("button", { name: "Take the board on this device" })).toHaveCount(0);

  await move(page, "g1", "f3");
  await expect(page.getByText("Active line 3 plies")).toBeVisible();
  await expect(spectator.getByText("Active line 3 plies")).toBeVisible({ timeout: 4_000 });
  await spectatorContext.close();
});

test("every shell route owns the viewport at both desktop projections", async ({
  page,
}) => {
  const projections = [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
  ] as const;

  for (const viewport of projections) {
    await page.setViewportSize(viewport);
    await page.goto("/play");
    await page
      .getByRole("article")
      .filter({ hasText: "schema example" })
      .getByRole("button", { name: /Open position/ })
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
      const dimensions = await page.evaluate(() => ({
        scrollHeight: document.scrollingElement!.scrollHeight,
        clientHeight: document.scrollingElement!.clientHeight,
      }));
      expect(
        dimensions.scrollHeight,
        `${route} at ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(dimensions.clientHeight + 1);

      if (route === runPath) {
        const boardElement = page.getByLabel("Chessboard");
        await expect(boardElement).toBeVisible();
        const board = await boardElement.boundingBox();
        const timeline = await page.locator(".timeline-row").boundingBox();
        expect(board).not.toBeNull();
        expect(timeline).not.toBeNull();
        expect(board!.x).toBeGreaterThanOrEqual(-1);
        expect(board!.y).toBeGreaterThanOrEqual(-1);
        expect(board!.x + board!.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(board!.y + board!.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(board!.y + board!.height).toBeLessThanOrEqual(timeline!.y + 1);
      }
    }
  }
});
