import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";
import type { DrillRun } from "@chess-tabiya/runtime";

const fixture = JSON.parse(readFileSync(new URL("../../schemas/drill_pack.example.json", import.meta.url), "utf8"));

for (const mobile of [false, true]) {
  test(`private pinned pack survives editing, withdrawal, resume and copied-run reload${mobile ? " @mobile" : ""}`, async ({ page }) => {
    const handle = `pinned_${randomUUID().slice(0, 8)}`;
    expect((await page.request.post("/auth/register", { data: { handle, password: "browser-pinned-pack-password" } })).status()).toBe(201);
    const document = { ...structuredClone(fixture), id: `private-${randomUUID()}`, title: `Retained ${handle}`, provenance: { reviewStatus: "draft", sources: [] } };
    const draftResponse = await page.request.post("/packs/drafts", { data: { document } });
    expect(draftResponse.status()).toBe(201);
    const { draft } = await draftResponse.json() as { draft: { id: string; digest: string } };
    const played = await page.request.post(`/packs/drafts/${draft.id}/playtest`, { data: {}, headers: { "x-writer-id": "browser-pinned-writer" } });
    expect(played.status()).toBe(201);
    const { run } = await played.json() as { run: DrillRun };
    const edited = await page.request.put(`/packs/drafts/${draft.id}`, {
      data: { document: { ...document, title: "Changed instructions must not appear" } }, headers: { "if-match": draft.digest },
    });
    expect(edited.status()).toBe(200);
    expect((await page.request.post(`/packs/drafts/${draft.id}/withdraw`, { data: {} })).status()).toBe(200);
    expect((await page.request.get(`/packs/${document.id}`)).status()).toBe(404);
    await page.goto(`/play/run/${run.id}`);
    await expect(page.locator(".run-name")).toHaveText(document.title);
    await expect(page.locator("cg-board")).toBeVisible();
    await page.reload();
    await expect(page.locator(".run-name")).toHaveText(document.title);
    const copyId = randomUUID();
    const copied = await page.request.post(`/runs/${run.id}/duplicate`, { data: { id: copyId, seed: 23 }, headers: { "x-writer-id": "browser-pinned-writer" } });
    expect(copied.status()).toBe(201);
    await page.goto(`/play/run/${copyId}`);
    await expect(page.locator(".run-name")).toHaveText(document.title);
    await page.reload();
    await expect(page.locator(".run-name")).toHaveText(document.title);
    expect((await page.request.get(`/runs/${copyId}/pack`)).headers()["x-pack-digest"]).toBe(run.packDigest);
    expect((await page.request.get(`/runs/${run.id}/events`)).status()).toBe(200);
    await page.goto("/play");
    await expect(page.getByText("Changed instructions must not appear", { exact: true })).toHaveCount(0);
  });
}
