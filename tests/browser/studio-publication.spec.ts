import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

const fixture = JSON.parse(readFileSync(new URL("../../schemas/drill_pack.example.json", import.meta.url), "utf8"));

async function selectDraft(page: Page, title: string): Promise<void> {
  await page.getByRole("complementary", { name: "Your drafts", exact: true }).getByRole("button", { name: `${title} · draft`, exact: true }).click();
  await expect(page.getByLabel("Pack JSON", { exact: true })).toBeVisible();
}

for (const mobile of [false, true]) {
  test(`Studio publishes the saved visible document after private authoring and playtest${mobile ? " @mobile" : ""}`, async ({ page }) => {
    test.setTimeout(90_000);
    const suffix = randomUUID().slice(0, 8);
    const title = `Studio lifecycle ${suffix}`;
    expect((await page.request.post("/auth/register", { data: { handle: `studio_${suffix}`, password: "studio-lifecycle-test-password" } })).status()).toBe(201);
    await page.goto("/create");
    await page.getByRole("button", { name: /^Position/ }).click();
    await page.getByLabel("Draft title", { exact: true }).fill(title);
    const createdResponse = page.waitForResponse(response => response.request().method() === "POST" && new URL(response.url()).pathname === "/packs/drafts");
    await page.getByRole("button", { name: "Create ten-field draft", exact: true }).click();
    const created = await createdResponse;
    expect(created.status()).toBe(201);
    const { draft } = await created.json();
    const editor = page.getByLabel("Pack JSON", { exact: true });
    const register = page.getByRole("button", { name: "Register community pack", exact: true });
    await expect(editor).toBeVisible();
    await expect(register).toBeDisabled();
    await expect(page.locator("#register-disabled")).toContainText("Resolve the declared graduation blockers");

    // Reuse existing authored fixture bytes; this isolated test is not new chess content.
    const document = { ...structuredClone(fixture), id: draft.packId, title,
      provenance: { reviewStatus: "draft", sources: [], graduationBlockers: ["Test-only source condition"] } };
    await editor.fill(JSON.stringify(document, null, 2));
    await expect(register).toBeDisabled();
    await expect(page.locator("#register-disabled")).toContainText("Save your changes");
    const savedWithBlocker = page.waitForResponse(response => response.request().method() === "PUT" && new URL(response.url()).pathname === `/packs/drafts/${draft.id}`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    expect((await savedWithBlocker).status()).toBe(200);
    await expect(page.locator("#register-disabled")).toContainText("Resolve the declared graduation blockers");
    await expect(register).toBeDisabled();

    const clean = { ...document, provenance: { reviewStatus: "draft", sources: [] } };
    await editor.fill("{");
    await expect(register).toBeDisabled();
    await expect(page.locator("#register-disabled")).toContainText("Fix the JSON");
    await editor.fill(JSON.stringify(clean, null, 2));
    await expect(page.locator("#register-disabled")).toContainText("Save your changes");
    const savePath = `**/packs/drafts/${draft.id}`;
    await page.route(savePath, async route => {
      if (route.request().method() === "PUT") await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: { code: "TEST_SAVE_UNAVAILABLE", message: "test failure" } }) });
      else await route.continue();
    });
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "This draft could not be saved" })).toBeVisible();
    await expect(editor).toHaveValue(JSON.stringify(clean, null, 2));
    await expect(register).toBeDisabled();
    await page.unroute(savePath);
    const savedClean = page.waitForResponse(response => response.request().method() === "PUT" && new URL(response.url()).pathname === `/packs/drafts/${draft.id}`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    expect((await savedClean).status()).toBe(200);
    await expect(register).toBeEnabled();
    await page.reload();
    await selectDraft(page, title);
    await expect(register).toBeEnabled();
    expect((await page.request.get(`/packs/${draft.packId}`)).status()).toBe(404);

    await page.getByRole("button", { name: "Save & playtest", exact: true }).click();
    await expect(page).toHaveURL(/\/play\/run\//);
    const runId = new URL(page.url()).pathname.split("/").at(-1)!;
    await expect(page.locator(".run-name")).toHaveText(title);
    await page.locator(".text-move summary").click();
    await page.getByLabel("Move in chess notation").fill("Be3");
    await page.getByRole("button", { name: "Submit move", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Choose the setup" })).toBeVisible();
    const before = await (await page.request.get(`/runs/${runId}/graph`)).json();
    expect(before.graph.nodes).toHaveLength(2);
    expect((await page.request.get(`/packs/${draft.packId}`)).status()).toBe(404);

    await page.goto("/create");
    await selectDraft(page, title);
    const publishedTitle = `${title} published`;
    const retained = JSON.parse(await editor.inputValue());
    await editor.fill(JSON.stringify({ ...retained, title: publishedTitle }, null, 2));
    await expect(register).toBeDisabled();
    const finalSave = page.waitForResponse(response => response.request().method() === "PUT" && new URL(response.url()).pathname === `/packs/drafts/${draft.id}`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    expect((await finalSave).status()).toBe(200);
    await expect(register).toBeEnabled();
    const refused = page.waitForResponse(response => new URL(response.url()).pathname === `/packs/drafts/${draft.id}/register`);
    await register.click();
    expect((await refused).status()).toBe(422);
    const publicationIssues = page.getByRole("alert", { name: "Publication needs changes" });
    await expect(publicationIssues).toContainText("/provenance/sources");
    await expect(publicationIssues).toContainText("/provenance/corpusEvidence");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    expect((await page.request.get(`/packs/${draft.packId}`)).status()).toBe(404);
    const corrected = JSON.parse(await editor.inputValue());
    corrected.provenance.sources = ["Mechanical source: schemas/drill_pack.example.json; isolated publication test, not an official lesson."];
    corrected.provenance.corpusEvidence = { state: "abstained", reason: "source_unavailable", detail: "This isolated mechanical test requests no human-game corpus evidence." };
    await editor.fill(JSON.stringify(corrected, null, 2));
    await expect(publicationIssues).toHaveCount(0);
    await expect(register).toBeDisabled();
    const correctedSave = page.waitForResponse(response => response.request().method() === "PUT" && new URL(response.url()).pathname === `/packs/drafts/${draft.id}`);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    expect((await correctedSave).status()).toBe(200);
    await expect(register).toBeEnabled();
    const registered = page.waitForResponse(response => new URL(response.url()).pathname === `/packs/drafts/${draft.id}/register`);
    await register.click();
    expect((await registered).status()).toBe(201);
    await expect(page.getByRole("button", { name: `${publishedTitle} · registered`, exact: true })).toBeVisible();
    const publicPack = await page.request.get(`/packs/${draft.packId}`);
    expect(publicPack.status()).toBe(200);
    expect((await publicPack.json()).title).toBe(publishedTitle);
    expect((await (await page.request.get(`/runs/${runId}/pack`)).json()).title).toBe(title);
    const after = await (await page.request.get(`/runs/${runId}/graph`)).json();
    expect(after.graph.nodes).toEqual(before.graph.nodes);
    expect(after.graph.branches).toEqual(before.graph.branches);
    expect(after.graph.activeCursor).toEqual(before.graph.activeCursor);

    await page.goto("/library");
    await page.getByLabel("Search the library").fill(publishedTitle);
    const entry = page.locator('.item[data-kind="pack"]').filter({ hasText: publishedTitle });
    await expect(entry).toHaveCount(1);
    await expect(entry.locator(".origin")).toContainText("Community");
    await entry.getByRole("button", { name: `Rehearse: ${publishedTitle}`, exact: true }).click();
    await expect(page).toHaveURL(/\/play\/run\//);
    await expect(page.locator(".run-name")).toHaveText(publishedTitle);
    await expect(page.getByLabel("Chessboard", { exact: true })).toBeVisible();
  });
}
