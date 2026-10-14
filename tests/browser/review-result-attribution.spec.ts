// D3818: real imported/retry results through HTTP, the served Review and reload. No fabricated
// packets or runtime/storage shortcuts; the original recorded line remains available throughout.
import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import type { DrillRun } from "@chess-tabiya/runtime";
import type { RunGraph } from "../../apps/web/src/lib/api.js";
import { assertOnlyEvidenceAppended, assertRecordedNodesPreserved } from "../../packages/runtime/src/testing/recorded-play.js";

for (const mobile of [false, true]) for (const side of ["white", "black"] as const) {
  test(`D3818 imported and retry results stay on their actual lines ${side}${mobile ? " @mobile touch phone" : " desktop"}`, async ({ page }) => {
    expect((await page.request.post("/auth/register", { data: {
      handle: `results_${randomUUID().slice(0, 8)}`, password: "review-result-attribution-password",
    } })).status()).toBe(201);
    await page.goto("/review");
    await page.getByLabel("Your side").selectOption(side);
    await page.getByLabel("PGN", { exact: true }).fill('[White "Original White"]\n[Black "Original Black"]\n[Result "1-0"]\n\n1. e4 e5 1-0');
    await page.getByRole("button", { name: "Build game story", exact: true }).click();
    await expect(page).toHaveURL(/\/review\/game\/import-/);
    await expect(page.getByText("Recorded result: 1-0.", { exact: true })).toBeVisible();
    const id = new URL(page.url()).pathname.split("/").at(-1)!;
    const graph = async (): Promise<RunGraph> => {
      const response = await page.request.get(`/runs/${id}/graph`);
      expect(response.ok()).toBe(true);
      return (await response.json() as { graph: RunGraph }).graph;
    };
    const events = async (): Promise<DrillRun["events"]> => {
      const response = await page.request.get(`/runs/${id}/events?sinceSeq=0`);
      expect(response.ok()).toBe(true);
      return (await response.json() as { events: DrillRun["events"] }).events;
    };
    const original = await graph(), originalEvents = await events();
    const main = original.branches[0]!.id, root = original.nodes.find(node => node.parentId === null)!;
    // Keep the UI on read-only Review while issuing ordinary retry commands. Both sides can
    // exercise the same legal alternative without an automatic opponent choosing a different line.
    const writer = `d3818-${randomUUID()}`;
    const post = async (action: string, data: unknown) => {
      const response = await page.request.post(`/runs/${id}/${action}`, { headers: { "x-writer-id": writer }, data });
      expect(response.status(), await response.text()).toBe(200);
    };
    await post("lease", {});
    await post("rewind", { nodeId: root.id });
    await post("fork", { nodeId: root.id, label: "story-reentry", intent: "Retry original decision" });
    const retry = (await graph()).activeCursor.branchId;
    expect(retry).not.toBe(main);
    for (const uci of ["f2f3", "e7e5"]) await post("moves", { uci });
    await post("reveal", {});
    const retryUrl = `/review/game/${id}?branch=${encodeURIComponent(retry)}`;
    await page.goto(retryUrl);
    await expect(page.getByText("This line has no recorded result.", { exact: true })).toBeVisible();
    await expect(page.locator(".move-select")).toHaveCount(2);
    await expect(page.locator(".review-header")).not.toContainText("Recorded result: 1-0.");
    await page.reload();
    await expect(page.getByText("This line has no recorded result.", { exact: true })).toBeVisible();
    for (const uci of ["g2g4", "d8h4"]) await post("moves", { uci });
    await post("reveal", {});
    const beforeRead = await events();
    await page.reload();
    await expect(page.getByText(`Result on the board: ${side === "white" ? "loss" : "win"} for ${side === "white" ? "White" : "Black"}.`, { exact: true })).toBeVisible();
    await expect(page.locator(".move-select")).toHaveCount(4);
    await expect(page.locator(".move-select").last()).toContainText("Qh4#");
    await page.getByRole("button", { name: "Previous move", exact: true }).click();
    await expect(page.locator(".move-select[aria-current=true]")).toContainText("g4");
    await page.getByRole("button", { name: "Next move", exact: true }).click();
    await expect(page.locator(".move-select[aria-current=true]")).toContainText("Qh4#");
    assertOnlyEvidenceAppended(beforeRead, await events());
    const sharedResponse = page.waitForResponse(response => response.url().endsWith(`/runs/${id}/share`) && response.request().method() === "POST");
    await page.getByRole("button", { name: "Share review", exact: true }).click();
    const shared = await sharedResponse;
    expect(shared.status()).toBe(201);
    const token = (await shared.json() as { token: string }).token;
    const publicStory = await page.request.get(`/api/shared/${token}/story`);
    expect(publicStory.status()).toBe(200);
    expect((await publicStory.json() as { outcome: unknown }).outcome).toEqual({ kind: "board_terminal", result: side === "white" ? "loss" : "win" });
    await page.goto(`/review/game/${id}?branch=${encodeURIComponent(main)}`);
    await expect(page.getByText("Recorded result: 1-0.", { exact: true })).toBeVisible();
    await expect(page.locator(".move-select")).toHaveCount(2);
    const after = await graph();
    assertRecordedNodesPreserved(original.nodes, after.nodes.filter(node => original.nodes.some(previous => previous.id === node.id)));
    expect((await events()).slice(0, originalEvents.length)).toEqual(originalEvents);
  });
}
