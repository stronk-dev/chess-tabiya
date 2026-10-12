import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import type { DrillRun } from "@chess-tabiya/runtime";
import type { RunGraph } from "../../apps/web/src/lib/api.js";
import { assertOnlyEvidenceAppended, assertRecordedNodesPreserved } from "../../packages/runtime/src/testing/recorded-play.js";

const cases = [
  { family: "overload", side: "white", fen: "k2r2r1/8/8/3pP3/8/8/8/1K4R1 w - d6 0 2", moves: "2. exd6 Rxd6 3. Rxg8+ *", sans: ["exd6", "Rxd6", "Rxg8+"], caption: "exd6 was answered by the recapture Rxd6", squares: ["d6", "g8"] },
  { family: "overload", side: "black", fen: "1k4r1/8/8/8/3Pp3/8/8/K2R2R1 b - d3 0 2", moves: "2... exd3 3. Rxd3 Rxg1+ *", sans: ["exd3", "Rxd3", "Rxg1+"], caption: "exd3 was answered by the recapture Rxd3", squares: ["d3", "g1"] },
  { family: "defender removal", side: "white", fen: "k7/8/8/3pP3/4n3/8/8/1K2R3 w - d6 0 2", moves: "2. exd6 Kb7 3. Rxe4 *", sans: ["exd6", "Kb7", "Rxe4"], caption: "Black's pawn on d5 was captured", squares: ["d5", "e4"] },
  { family: "defender removal", side: "black", fen: "1k2r3/8/8/4N3/3Pp3/8/8/K7 b - d3 0 2", moves: "2... exd3 3. Kb2 Rxe5 *", sans: ["exd3", "Kb2", "Rxe5"], caption: "White's pawn on d4 was captured", squares: ["d4", "e5"] },
  { family: "D3736 attraction check", side: "white", fen: "4B1k1/8/8/8/8/8/8/4K2R w K - 0 1", moves: "1. Bf7+ Kxf7 2. O-O+ *", sans: ["Bf7+", "Kxf7", "O-O+"], caption: "then O-O+ gave check", squares: ["f7"] },
  { family: "D3736 attraction check", side: "black", fen: "4k2r/8/8/8/8/8/8/4b1K1 b k - 0 1", moves: "1... Bf2+ 2. Kxf2 O-O+ *", sans: ["Bf2+", "Kxf2", "O-O+"], caption: "then O-O+ gave check", squares: ["f2"] },
  { family: "D3736 attraction capture", side: "white", fen: "k3Bq2/8/8/8/8/8/8/6KR w K - 0 1", moves: "1. Bf7 Qxf7 2. O-O Kb8 3. Rxf7 *", sans: ["Bf7", "Qxf7", "O-O", "Kb8", "Rxf7"], caption: "then Rxf7 captured", squares: ["f7"] },
  { family: "D3736 attraction capture", side: "black", fen: "6kr/8/8/8/8/8/8/K3bQ2 b k - 0 1", moves: "1... Bf2 2. Qxf2 O-O 3. Kb1 Rxf2 *", sans: ["Bf2", "Qxf2", "O-O", "Kb1", "Rxf2"], caption: "then Rxf2 captured", squares: ["f2"] },
] as const;

async function recorded(page: Page, id: string) {
  const graph = await page.request.get(`/runs/${id}/graph`);
  const events = await page.request.get(`/runs/${id}/events?sinceSeq=0`);
  expect(graph.ok()).toBe(true);
  expect(events.ok()).toBe(true);
  return { graph: (await graph.json() as { graph: RunGraph }).graph,
    events: (await events.json() as { events: DrillRun["events"] }).events };
}

for (const mobile of [false, true]) for (const value of cases) {
  test(`Review ${value.side} ${value.family.includes("attraction") ? "castling" : "en passant"} ${value.family} retains captured identity${mobile ? " @mobile" : ""}`, async ({ page }) => {
    expect((await page.request.post("/auth/register", { data: {
      handle: `capture_${randomUUID().slice(0, 8)}`, password: "review-capture-test-password",
    } })).status()).toBe(201);
    await page.goto("/review");
    await page.getByLabel("Your side").selectOption(value.side);
    await page.getByLabel("PGN", { exact: true }).fill(`[White "White"]\n[Black "Black"]\n[Result "*"]\n[SetUp "1"]\n[FEN "${value.fen}"]\n\n${value.moves}`);
    await page.getByRole("button", { name: "Build game story", exact: true }).click();
    await expect(page).toHaveURL(/\/review\/game\/import-/);
    const id = new URL(page.url()).pathname.split("/").at(-1)!;
    const moves = page.locator(".move-select");
    await expect(moves).toHaveCount(value.sans.length);
    await moves.last().click();
    const fact = page.locator('.evidence [data-component="square_set"]').filter({ hasText: value.caption });
    await expect(fact).toHaveCount(1);
    await expect(fact.locator(".chip")).toHaveText([...value.squares]);
    const paths = page.locator('.evidence [data-component="move_path"]');
    // Deflection and overload are distinct admitted facts, each retaining this complete line.
    await expect(paths).toHaveCount(value.family === "overload" ? 2 : 1);
    for (const path of await paths.all()) await expect(path.locator(".plies li")).toHaveText([...value.sans]);
    const before = await recorded(page, id);
    const paint = page.locator(".stage .cg-shapes circle");
    const boardSize = () => page.locator(".stage cg-board").evaluate(element => {
      const rect = element.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
    const size = await boardSize();
    const assertPaint = async (squares: readonly string[]) => {
      await expect(paint).toHaveCount(squares.length);
      // Independently check the painted centers, including the learner's Black orientation.
      const expected = squares.map(square => {
        const file = square.charCodeAt(0) - 97, rank = Number(square[1]) - 1;
        const x = (value.side === "white" ? file - 3.5 : 3.5 - file) * Math.min(1, size.width / size.height);
        const y = (value.side === "white" ? 3.5 - rank : rank - 3.5) * Math.min(1, size.height / size.width);
        return [Number(x.toFixed(4)), Number(y.toFixed(4))];
      });
      const actual = await paint.evaluateAll(circles => circles.map(circle =>
        ["cx", "cy"].map(name => Number(Number(circle.getAttribute(name)).toFixed(4)))));
      expect(actual).toEqual(expect.arrayContaining(expected));
    };
    await fact.locator(".caption").focus();
    await assertPaint(value.squares);
    expect(await boardSize()).toEqual(size);
    await fact.locator(".chip").first().click();
    await assertPaint(value.squares.slice(0, 1));
    await moves.first().click();
    await expect(paint).toHaveCount(0);
    await expect(page.locator('.evidence [data-component="square_set"]').filter({ hasText: value.caption })).toHaveCount(0);
    await moves.last().click();
    await expect(paint).toHaveCount(0);
    await fact.locator(".caption").click();
    await assertPaint(value.squares);
    expect(await boardSize()).toEqual(size);
    const after = await recorded(page, id);
    assertOnlyEvidenceAppended(before.events, after.events);
    assertRecordedNodesPreserved(before.graph.nodes, after.graph.nodes);
    expect(after.graph.branches).toEqual(before.graph.branches);
    expect(after.graph.activeCursor).toEqual(before.graph.activeCursor);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
