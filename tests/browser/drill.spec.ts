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

async function assertRunViewport(
  page: Page,
  viewport: { readonly width: number; readonly height: number },
): Promise<void> {
  const boardElement = page.getByLabel("Chessboard");
  await expect(boardElement).toBeVisible();
  const board = await boardElement.boundingBox();
  expect(board).not.toBeNull();
  expect(board!.x).toBeGreaterThanOrEqual(-1);
  expect(board!.y).toBeGreaterThanOrEqual(-1);
  expect(board!.x + board!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(board!.y + board!.height).toBeLessThanOrEqual(viewport.height + 1);
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
  if (viewport.width <= 719) {
    expect(board!.width).toBeGreaterThanOrEqual(192);
  } else {
    const timeline = await page.locator(".timeline-row").boundingBox();
    expect(timeline).not.toBeNull();
    expect(board!.y + board!.height).toBeLessThanOrEqual(timeline!.y + 1);
  }
}

test.beforeEach(async ({ page }) => register(page));

test("imports one game, opens a grounded story, re-enters play, and exports original plus branch", async ({ page }) => {
  await page.getByRole("link", { name: "Review" }).click();
  await page.getByLabel("PGN").fill(`[Event "Browser import"]
[Site "https://lichess.org/abcd1234"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 1-0`);
  await page.getByRole("button", { name: "Build game story" }).click();
  await expect(page).toHaveURL(/\/review\/game\/import-/);
  await expect(page.getByRole("heading", { name: "Alice – Bob" })).toBeVisible();
  await expect(page.getByText("grounded story", { exact: false })).toBeVisible();
  const enter = page.getByRole("button", { name: "Re-enter and play from here" });
  await expect(enter).toBeEnabled({ timeout: 15_000 });
  const runId = page.url().split("/").at(-1)!;
  await enter.click();
  await expect(page).toHaveURL(new RegExp(`/play/run/${runId}$`));
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await move(page, "f1", "b5", "white");
  const graph = await (await page.request.get(`/runs/${runId}/graph`)).json() as { graph: { branches: unknown[]; nodes: { moveUci: string | null }[] } };
  expect(graph.graph.branches.length).toBeGreaterThanOrEqual(2);
  expect(graph.graph.nodes.filter((node) => node.moveUci !== null).length).toBeGreaterThanOrEqual(4);
  const exported = await page.request.get(`/runs/${runId}/pgn`);
  const text = await exported.text();
  expect(text).toContain('[White "Alice"]');
  expect(text).toContain('[SourceEvent "Browser import"]');
  expect(text).toContain("Tabiya branch");
});

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
  const transitionButton = page.getByRole("button", { name: "What changed on this move?" });
  await expect(transitionButton).toHaveAttribute("aria-expanded", "false");
  await transitionButton.click();
  await expect(transitionButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "Transition reading" })).toContainText(/geometric transition census|halfmove clock|irreversibility convention/);
  await transitionButton.click();
  await expect(transitionButton).toHaveAttribute("aria-expanded", "false");
  await marker.click();
  const panel = page.getByRole("complementary", { name: "Carlsbad structure" });
  await expect(panel).toContainText("Named plans for this structure — general to the kind of position, not advice for this one.");
  await expect(panel).toContainText("CC-BY-SA-4.0");
  for (const label of ["Minority attack", "Achieve e3-e4", "Land h4-h5 against a hook", "Reach a queenless position with the c-pawn sound", "Get the pawn to a5 with b4 still empty", "Central counter-break"]) await expect(panel.getByText(label, { exact: true })).toBeVisible();
  const after = await (await page.request.get(`/runs/${runId}/events?sinceSeq=0`)).json() as { events: unknown[] };
  expect(after.events).toHaveLength(before.events.length);
  await expect(page.getByText("Authored commentary withheld", { exact: false })).toHaveCount(0);
});

test("imports a repertoire, enters its biggest corpus gap, and records an addressed attempt",async({page})=>{
  await page.getByRole("link",{name:"Learn"}).click();
  await page.getByRole("heading",{name:"Repertoire gaps"}).scrollIntoViewIfNeeded();
  await page.getByLabel("Name").fill("Browser black repertoire");
  await page.getByLabel("Your side").selectOption("black");
  await page.getByLabel("Repertoire PGN").fill("1. d4 d5 *");
  await page.getByRole("button",{name:"Import repertoire"}).click();
  const card=page.getByRole("article").filter({hasText:"Browser black repertoire"});
  await card.getByRole("button",{name:"Scan gaps"}).click();
  await expect(card.getByText("These counts say what this population played, not what is good.")).toBeVisible();
  await expect(card.getByText(/e4 · about 1 in 2 games · open/)).toBeVisible();
  await card.getByRole("button",{name:"Go to biggest gap"}).click();
  await expect(page).toHaveURL(/\/play\/run\/gap-/);await expect(page.getByLabel("Chessboard")).toBeVisible();
  await move(page,"c7","c5","black");
  await page.getByRole("link",{name:"Learn"}).click();
  const refreshed=page.getByRole("article").filter({hasText:"Browser black repertoire"});
  await expect(refreshed.getByText(/e4 · about 1 in 2 games · addressed/)).toBeVisible({timeout:5_000});
});

test("adaptive guidance keeps a queen-exchange phase change passive and removable", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __spoken: string[] }).__spoken = [];
    class Utterance { text: string; constructor(text: string) { this.text = text; } }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: Utterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { getVoices: () => [{}], cancel() {}, speak(value: { text: string }) { (window as unknown as { __spoken: string[] }).__spoken.push(value.text); } } });
  });
  await page.reload();
  await page.getByLabel("Optional FEN").fill("3qk2r/5p2/2b2n2/8/8/8/8/3QK3 w - - 0 1");
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByText("Detected by Tabiya's phase bands: middlegame.")).toBeVisible();

  await page.getByText("Assistance", { exact: true }).click();
  await page.getByLabel("Passive pivotal markers").check();
  await page.getByLabel("Speak opened guidance").check();
  await expect(page.getByRole("dialog", { name: "Recorded change" })).toHaveCount(0);

  await move(page, "d1", "d8");
  const marker = page.getByRole("button", { name: "Open pivotal marker at ply 1" });
  await expect(marker).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Recorded change" })).toHaveCount(0);

  await marker.click();
  const guidance = page.getByRole("dialog", { name: "Recorded change" });
  await expect(guidance).toContainText("middlegame → endgame, detected by Tabiya's phase bands.");
  await expect(guidance).toContainText("material-census convention");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).toEqual([expect.stringContaining("middlegame → endgame")]);
  const rendered = await guidance.innerText();
  expect(rendered).not.toMatch(/\b[a-h][1-8][a-h][1-8][qrbn]?\b/u);
  expect(rendered).not.toMatch(/\b(?:[KQRBN](?:[a-h1-8]?x?)?[a-h][1-8]|[a-h](?:x[a-h])?[1-8](?:=[QRBN])?)[+#]?\b/u);
  expect(rendered).not.toMatch(/\b(?:weak|strong|good|bad|better|worse|advantage|winning|losing|should|must|best|worst|mistake|blunder|punish|wins|loses)\b/iu);

  await guidance.getByRole("button", { name: "Close" }).click();
  await page.getByLabel("Passive pivotal markers").uncheck();
  await expect(page.getByRole("button", { name: /Open pivotal marker/ })).toHaveCount(0);
});

test("runtime corpus counts stay silent until reveal and render population facts on request", async ({ page }) => {
  await page.getByRole("button", { name: "Start game" }).click();
  await page.getByText("Assistance", { exact: true }).click();
  await page.getByLabel("Passive pivotal markers").check();
  await move(page, "e2", "e4");
  await expect(page.getByText("Active line 2 plies")).toBeVisible();
  await expect(page.getByText("Thinking…")).toHaveCount(0);
  const runId = page.url().split("/").at(-1)!;
  const writerId = await page.evaluate((id) => localStorage.getItem(`chess-tabiya:run:${id}:writer-id`), runId);
  expect(writerId).not.toBeNull();
  const reveal = await page.request.post(`/runs/${runId}/reveal`, { headers: { "x-writer-id": writerId! }, data: {} });
  expect(reveal.ok()).toBe(true);
  await page.reload();
  await page.getByText("Assistance", { exact: true }).click();
  await page.getByLabel("Corpus counts on request").check();
  await page.getByRole("button", { name: "Show corpus counts" }).click();
  const corpus = page.getByRole("region", { name: "Corpus evidence" });
  await expect(corpus).toContainText("Lichess explorer — rating buckets 1000,1200,1400,1600,1800,2000,2200,2500");
  await expect(corpus).toContainText("These counts say what this population played, not what is good.");
  await expect(corpus).toContainText("e4 — 60 of 120 games (50.0%). Outcome split withheld below the 100-game per-move floor.");
  await expect(corpus).toContainText("Last recorded game in this population: 2019-04.");
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
  const structuralReading = page.getByRole("button", { name: "Structural reading" });
  await expect(structuralReading).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".structural-facts")).toHaveCount(0);
  await structuralReading.click();
  await expect(page.locator(".structural-facts")).toContainText("White has 7 pawns.");
  await expect(page.locator(".structural-facts")).toContainText("Black has 7 pawns.");
  await expect(page.locator(".structural-facts")).toContainText("White's bishop on d3 stands on a light square.");
  await page.reload();
  await expect(page.getByRole("button", { name: "Structural reading" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(".structural-facts")).toHaveCount(0);
  const marker = page.getByRole("button", { name: /Carlsbad structure/ });
  await expect(marker).toBeVisible();
  await marker.click();
  const generic = "Two queenside pawns advance against three";
  await expect(page.getByText(generic, { exact: false })).toHaveCount(1);
  await expect(page.getByText("In this tabiya the plan is already supported", { exact: false })).toHaveCount(0);
});

test("immediate guard waits for the consequence, preserves play-on, and rewinds the decision", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Post-commit guard browser fixture" });
  await card.getByRole("button", { name: /Open position/ }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();

  await move(page, "h2", "h3");
  const prompt = page.getByRole("region", { name: "Post-commit guard" });
  await expect(prompt).toBeVisible();
  await expect(prompt).toContainText("The material balance changed on this path.");
  await expect(page.getByLabel("Post-commit guard recorded")).toBeVisible();

  await prompt.getByRole("button", { name: "Play on" }).click();
  await expect(prompt).toHaveCount(0);
  await page.reload();
  await expect(prompt).toBeVisible();
  await prompt.getByRole("button", { name: "Rewind this decision" }).click();
  await expect(page.getByText("Active line 0 plies")).toBeVisible();
  await move(page, "h2", "h4");
  await expect(page.getByRole("button", { name: /Switch to branch 1:/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Switch to branch 2:/ })).toBeVisible();
});

test("stated reasoning reveals attributed key points only after recording and keeps the prior attempt", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Stated reasoning browser fixture" });
  await card.getByRole("button", { name: /Open position/ }).click();
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
  const voteEditor = page.locator(".vote-editor");
  await voteEditor.getByLabel("Prompt").fill("Which plan?");
  const moves = ["a1b1", "c1d2", "c1e3", "c1f4", "c1g5", "c1h6", "d1d2", "d1e2"];
  const labels = ["Rook across", "Bishop d2", "Bishop e3", "Bishop f4", "Bishop g5", "Bishop h6", "Queen d2", "Queen e2"];
  for (let index = 2; index < moves.length; index += 1) await voteEditor.getByRole("button", { name: "Add option" }).click();
  await expect(voteEditor.getByRole("button", { name: "Add option" })).toBeDisabled();
  await expect(voteEditor.getByRole("button", { name: "Remove" }).first()).toBeEnabled();
  for (let index = 0; index < moves.length; index += 1) {
    await voteEditor.getByLabel("Move (UCI)").nth(index).fill(moves[index]!);
    await voteEditor.getByLabel("Label").nth(index).fill(labels[index]!);
  }
  await voteEditor.getByLabel("Duration (seconds)").fill("90");
  await voteEditor.getByRole("button", { name: "Open vote" }).click();
  await expect(page.getByText("Which plan? · open")).toBeVisible();
  await expect(page.getByText("Bishop f4: 0")).toBeVisible();
  await expect(page.getByText("No votes yet.")).toBeVisible();
  await page.getByRole("button", { name: "Open overlay" }).click();
  await expect(page.getByLabel("Live session overlay")).toBeVisible();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByText("Bishop f4: 0")).toBeVisible();
  await expect(page.getByText("No votes yet.")).toBeVisible();
  await expect(page.locator("#primary-navigation")).toHaveCount(0);
});

test("library exposes phase honestly and survives a malformed pack response", async ({
  page,
}) => {
  const expected = [
    ["Carlsbad structure", "middlegame"],
    ["Rook endings", "endgame"],
    ["Caro-Kann Advance", "opening"],
    ["Trajectory: QGD Exchange", "cross phase"],
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
      reviewStatus: "schema_example",
      channel: "official",
    });
    await route.fulfill({ response, json: body });
  });
  await page.reload();
  await expect(page.getByRole("article").filter({ hasText: "Unclassified browser fixture" })).toContainText("unclassified");

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
  await card.getByRole("button", { name: /Open position/ }).click();
  await expect(page.getByRole("alert")).toContainText("did not declare start.side");
  await expect(page.getByText("Choose a position worth returning to.")).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("terminal outcome reveals authored commentary, a native story, and a revocable public card", async ({ page, browser }) => {
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
  await page.getByRole("button", { name: "Story of this run" }).click();
  await expect(page).toHaveURL(/\/review\/game\//);
  await expect(page.getByRole("heading", { name: "Story of this run" })).toBeVisible();
  await page.getByRole("button", { name: "Share story" }).click();
  const publicLink = page.getByRole("link", { name: /\/shared\// });
  const href = await publicLink.getAttribute("href");
  expect(href).not.toBeNull();
  const absolute = new URL(href!, page.url()).href;
  const anonymous = await browser.newContext();
  const publicPage = await anonymous.newPage();
  await publicPage.goto(absolute);
  await expect(publicPage.getByRole("heading")).toContainText(/The turning point|Held|Won|A game story/);
  await expect(publicPage.getByLabel("Chessboard")).toBeVisible();
  const runId = page.url().split("/").at(-1)!;
  const shares = await (await page.request.get(`/runs/${runId}/share`)).json() as { shares: { id: string }[] };
  await page.request.delete(`/runs/${runId}/share/${shares.shares[0]!.id}`);
  await publicPage.reload();
  await expect(publicPage.getByText("Route not found")).toBeVisible();
  await anonymous.close();
});

test("terminal flip preserves the source and milestones link back into played runs", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Terminal outcome browser fixture" });
  await card.getByRole("button", { name: /Open position/ }).click();
  await move(page, "f2", "f3");
  await page.getByRole("button", { name: "Continue" }).click();
  await move(page, "g2", "g4");
  const sourceId = page.url().split("/").at(-1)!;
  await page.getByRole("button", { name: "Replay this as Black" }).click();
  await expect(page).toHaveURL(/\/play\/run\/flip-/);
  await expect(page.getByText("No pack is loaded. Nothing is claimed about this position.")).toBeVisible();
  await expect(page.getByLabel("Opposite-side replay source")).toContainText(sourceId);
  await page.getByRole("link", { name: "Learn" }).click();
  await expect(page.getByRole("heading", { name: "Milestones" })).toBeVisible();
  await expect(page.getByText("First preserved attempt.")).toBeVisible();
});

test("Outcome Drill resolves a non-terminal hold and remains playable", async ({ page }) => {
  const card = page.getByRole("article").filter({ hasText: "Outcome hold browser fixture" });
  await card.getByRole("button", { name: /Open position/ }).click();
  await expect(page.getByText("No opponent move has been played yet.")).toBeVisible();
  await expect(page.getByText("Root assessment (authored, unproved):", { exact: false })).toBeVisible();

  await move(page, "e2", "e4");
  await expect(page.getByText("Active line 2 plies")).toBeVisible();
  await move(page, "f2", "f3");
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
  await clickMove(page, "d1", "d2");
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
  await expect(
    page.getByText("The comparison is already at its first aligned position."),
  ).toBeVisible();
  await expect(page.locator(".boards article")).toHaveCount(2);
  await expect(page.getByRole("heading", { name: "Recorded branch strips" })).toBeVisible();
  await expect(page.locator(".sparkline")).toHaveCount(2);
  await expect.poll(() =>
    page.locator(".sparkline").evaluateAll((sparklines) =>
      sparklines.every((sparkline) => sparkline.querySelectorAll("span").length > 0),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Narrative" }).click();
  await expect(page.getByText(/recorded branches share/)).toBeVisible();
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

test("branch group captures three candidates, rotates, recovers evidence, compares, and exports", async ({ page }) => {
  await page
    .getByRole("article")
    .filter({ hasText: "schema example" })
    .getByRole("button", { name: /Open position/ })
    .click();
  await move(page, "c1", "e3");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Active line 2 plies")).toBeVisible();

  await page.getByRole("button", { name: "Branch group" }).click();
  await expect(page.getByRole("heading", { name: "Create a branch group" })).toBeVisible();
  await move(page, "f2", "f3");
  await move(page, "h2", "h3");
  await move(page, "a2", "a3");
  await expect(page.locator(".candidate-chips button")).toHaveCount(3);
  await page.getByRole("button", { name: "Create group" }).click();

  await expect(page.getByText("Branch group · 3 candidates")).toBeVisible();
  await expect(page.locator("[data-group-member]")).toHaveCount(3);
  await expect(page.locator(".group-marker")).toHaveCount(3);
  await expect(page.getByText("Fixed resistance: within this group, the same position always receives the same reply.")).toBeVisible();

  // The captured seed is the first learner ply. Play one more learner decision
  // in each member; the ordinary opponent loop lands between them.
  await clickMove(page, "d1", "d2");
  if (await page.getByRole("button", { name: "Continue" }).isVisible().catch(() => false)) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Next member" }).click();
  await page.getByLabel("Advance").selectOption("lockstep");
  const activeBeforeLockstep = await page.locator(".rail li.active strong").textContent();
  await move(page, "f2", "f3");
  if (await page.getByRole("button", { name: "Continue" }).isVisible().catch(() => false)) await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator(".rail li.active .group-marker")).toBeVisible();
  await expect(page.locator(".rail li.active strong")).not.toHaveText(activeBeforeLockstep ?? "");
  await clickMove(page, "d1", "d2");
  if (await page.getByRole("button", { name: "Continue" }).isVisible().catch(() => false)) await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Boards" }).click();
  await expect(page.locator("[data-group-member] [aria-label='Chessboard']")).toHaveCount(3);
  const missing = page.getByText("No recorded engine evidence for this branch leaf.");
  await expect(missing.first()).toBeVisible();
  await page.getByRole("button", { name: "Analyze missing evidence" }).click();
  await expect(missing).toHaveCount(0, { timeout: 5_000 });

  await page.getByRole("button", { name: "Compare group" }).click();
  await expect(page.getByRole("heading", { name: "Same decision, 3 consequences." })).toBeVisible();
  await expect(page.locator(".boards article")).toHaveCount(3);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("heading", { name: "Same decision, 3 consequences." }).focus();
  await page.keyboard.press("e");
  const download = await downloadPromise;
  const path = await download.path();
  if (path === null) throw new Error("Group PGN download did not reach disk");
  const pgn = await (await import("node:fs/promises")).readFile(path, "utf8");
  expect((pgn.match(/\(/gu) ?? []).length).toBeGreaterThanOrEqual(2);
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
  await expect(spectator.getByRole("button", { name: /^Fork/ })).toBeDisabled();
  await expect(spectator.getByRole("button", { name: "Branch group" })).toBeDisabled();

  await move(page, "g1", "f3");
  await expect(page.getByText("Active line 3 plies")).toBeVisible();
  await expect(spectator.getByText("Active line 3 plies")).toBeVisible({ timeout: 4_000 });
  await spectator.getByRole("button", { name: /^Ply 1:/ }).click();
  const rewind = spectator.getByRole("button", { name: /^Rewind to preview/ });
  await expect(rewind).toBeDisabled();
  await expect(rewind).toHaveAttribute("aria-describedby", "timeline-rewind-readonly");
  await spectatorContext.close();
});

test("every shell route owns the viewport at supported desktop and tablet projections", async ({
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
      // At <=719px #app is fixed to the viewport, so document scrolling is
      // structurally constant. Retain this as a desktop/tablet global-overflow
      // guard; compact containment is proved separately by assertRunViewport.
      const dimensions = await page.evaluate(() => ({
        scrollHeight: document.scrollingElement!.scrollHeight,
        clientHeight: document.scrollingElement!.clientHeight,
      }));
      expect(
        dimensions.scrollHeight,
        `${route} at ${viewport.width}x${viewport.height}`,
      ).toBeLessThanOrEqual(dimensions.clientHeight + 1);

      if (route === runPath) {
        await assertRunViewport(page, viewport);
        if (viewport.width === 768) {
          expect((await page.getByLabel("Chessboard").boundingBox())!.width).toBeGreaterThanOrEqual(400);
          await expect(page.locator(".rail-stack")).toBeVisible();
          await expect(page.locator(".timeline-row")).toBeVisible();
        }
      }
    }
  }
});

test("mobile shell, settings, and install manifest preserve the run regions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/settings");
  const position = page.getByRole("group", { name: "Just Play" });
  await position.getByLabel("Board lighting").selectOption("sight");
  await page.reload();
  await expect(position.getByLabel("Board lighting")).toHaveValue("sight");
  await page.goto("/play");
  await page.getByRole("button", { name: "Start game" }).click();
  await expect(page.getByLabel("Chessboard")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Run regions" })).toBeVisible();
  for (const viewport of [{ width: 390, height: 844 }, { width: 360, height: 680 }] as const) {
    await page.setViewportSize(viewport);
    for (const tab of ["Timeline", "Branches", "Evidence"] as const) {
      await page.getByRole("button", { name: tab }).click();
      await assertRunViewport(page, viewport);
      if (tab === "Timeline") {
        await expect(page.locator(".timeline-row")).toBeVisible();
        await expect(page.locator(".reading-controls")).toBeHidden();
      } else if (tab === "Branches") {
        await expect(page.locator(".rail-stack")).toBeVisible();
      } else {
        await expect(page.locator(".reading-controls")).toBeVisible();
        await expect(page.locator(".timeline-row")).toBeHidden();
        await expect(page.locator(".rail-stack")).toBeHidden();
      }
    }
  }
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto("/play");
  await page
    .getByRole("article")
    .filter({ hasText: "Outcome hold browser fixture" })
    .getByRole("button", { name: /Open position/ })
    .click();
  await expect(page.getByText("No opponent move has been played yet.")).toBeVisible();
  await expect(page.getByText("Root assessment (authored, unproved):", { exact: false })).toBeVisible();
  await assertRunViewport(page, { width: 430, height: 932 });
  expect((await page.locator('[aria-label="Chessboard"]').boundingBox())!.width).toBeGreaterThan(192);
  const dimensions = await page.evaluate(() => ({ scrollHeight: document.scrollingElement!.scrollHeight, clientHeight: document.scrollingElement!.clientHeight }));
  expect(dimensions.scrollHeight).toBeLessThanOrEqual(dimensions.clientHeight + 1);
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200); expect((await manifest.json()).display).toBe("standalone");
  expect(await page.locator('link[rel="manifest"]').getAttribute("href")).toBe("/manifest.webmanifest");
  expect(await page.evaluate(async () => "serviceWorker" in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0)).toBe(0);
  await page.setViewportSize({ width: 360, height: 679 });
  await expect(page.getByRole("alert")).toContainText("needs at least 360 × 680 CSS pixels");
  await expect(page.getByRole("alert")).toContainText("24-pixel chess-square targets and a fully visible board cannot both fit");
  await expect(page.locator('[aria-label="Chessboard"]')).toHaveCount(0);
});
