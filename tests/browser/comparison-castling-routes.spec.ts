// D3828: actual PGN import, authenticated saved retry and native Compare/Inspector/reload.
// Provider mode is the suite's labelled mock; route geometry comes from recorded legal moves.
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { DrillRun } from "@chess-tabiya/runtime";
import { mirrorSemanticFen, mirrorSemanticUci } from "../../packages/runtime/src/semantic-validation.js";
import type { RunGraph } from "../../apps/web/src/lib/api.js";
import { assertOnlyEvidenceAppended, assertRecordedNodesPreserved } from "../../packages/runtime/src/testing/recorded-play.js";

const geometries = [
  { name: "stationary king", rank: "6KR", right: "H", rook: "h", destination: "f", short: true, squares: ["h1", "f1", "f2"] },
  { name: "king-rook swap", rank: "5KR1", right: "G", rook: "g", destination: "f", short: true, squares: ["g1", "f1", "f2"] },
  { name: "stationary rook", rank: "4KR2", right: "F", rook: "f", destination: "f", short: true, squares: ["f1", "f2"] },
  { name: "stationary queenside king", rank: "1RK5", right: "B", rook: "b", destination: "d", short: false, squares: ["b1", "d1", "d2"] },
] as const;

for (const mobile of [false, true]) for (const black of [false, true]) for (const geometry of geometries) {
  test(`D3828 Compare retains ${black ? "black" : "white"} ${geometry.name} rook identity${mobile ? " @mobile" : ""}`, async ({ page }) => {
    expect((await page.request.post("/auth/register", { data: { handle: `routes_${randomUUID().slice(0, 8)}`, password: "comparison-route-test-password" } })).status()).toBe(201);
    const whiteFen = `k7/8/8/8/8/8/8/${geometry.rank} w ${geometry.right} - 0 1`;
    const fen = black ? mirrorSemanticFen(whiteFen, "color_and_vertical") : whiteFen;
    const castle = geometry.short ? "O-O" : "O-O-O";
    const pgnMoves = black ? `1... ${castle} 2. Kb1 R${geometry.destination}7 *` : `1. ${castle} Kb8 2. R${geometry.destination}2 *`;
    await page.goto("/review");
    await page.getByLabel("Your side").selectOption(black ? "black" : "white");
    await page.getByLabel("PGN", { exact: true }).fill(`[White "Route White"]\n[Black "Route Black"]\n[Result "*"]\n[SetUp "1"]\n[FEN "${fen}"]\n\n${pgnMoves}`);
    await page.getByRole("button", { name: "Build game story", exact: true }).click();
    await expect(page).toHaveURL(/\/review\/game\/import-/u);
    const id = new URL(page.url()).pathname.split("/").at(-1)!;
    const reviewUrl = page.url();
    const graph = async () => {
      const response = await page.request.get(`/runs/${id}/graph`); expect(response.ok()).toBe(true);
      return (await response.json() as { graph: RunGraph }).graph;
    };
    const events = async () => {
      const response = await page.request.get(`/runs/${id}/events?sinceSeq=0`); expect(response.ok()).toBe(true);
      return (await response.json() as { events: DrillRun["events"] }).events;
    };
    const original = await graph(), root = original.nodes.find(node => node.parentId === null)!;
    const writer = `d3828-${randomUUID()}`;
    const post = async (action: string, data: unknown) => {
      const response = await page.request.post(`/runs/${id}/${action}`, { headers: { "x-writer-id": writer }, data });
      expect(response.status(), await response.text()).toBe(200);
    };
    await post("lease", {}); await post("rewind", { nodeId: root.id });
    await post("fork", { nodeId: root.id, label: "Lift the original rook", intent: "Try another recorded line" });
    const lift = `${geometry.rook}1${geometry.rook}2`;
    await post("moves", { uci: black ? mirrorSemanticUci(lift, "color_and_vertical") : lift });
    await post("reveal", {});
    await page.reload();
    const before = await graph(), beforeEvents = await events();
    assertRecordedNodesPreserved(original.nodes, before.nodes.filter(node => original.nodes.some(saved => saved.id === node.id)));
    const open = async () => {
      await page.locator(".move-select").first().click();
      await page.getByRole("button", { name: `Compare the reviewed line and 1 more from before move 1 (${castle})`, exact: true }).click();
      await expect(page.getByRole("heading", { name: "Same decision, two consequences.", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Evidence inspector", exact: true }).click();
      const inspector = page.getByRole("dialog", { name: "Recorded facts behind this comparison", exact: true });
      await inspector.getByText("Piece routes", { exact: true }).first().click();
      const expectedSquares = geometry.squares.map(square => black ? `${square[0]}${9 - Number(square[1])}` : square);
      const fact = inspector.locator('[data-component="fact_statement"]').filter({ hasText: `${black ? "black" : "white"} rook from ${geometry.rook}${black ? 8 : 1}` }).first();
      await expect(fact).toBeVisible();
      for (const square of expectedSquares) await expect(fact).toContainText(square);
      expect((await fact.textContent())?.match(/\b[a-h][1-8]\b/gu)).toEqual([`${geometry.rook}${black ? 8 : 1}`, ...expectedSquares]);
      await inspector.getByRole("button", { name: "Return to comparison", exact: true }).click();
      await expect(inspector).toHaveCount(0);
    };
    await open();
    await page.goto(reviewUrl); await page.reload(); await open();
    const after = await graph();
    assertRecordedNodesPreserved(before.nodes, after.nodes);
    expect(after.branches).toEqual(before.branches); expect(after.activeCursor).toEqual(before.activeCursor);
    assertOnlyEvidenceAppended(beforeEvents, await events());
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}
