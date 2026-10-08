import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { DrillRun } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";

const fixture = JSON.parse(readFileSync(new URL("../../../schemas/drill_pack.example.json", import.meta.url), "utf8"));
let application: ChessTabiyaApplication | undefined;
let directory: string | undefined;
afterEach(async () => {
  const closing = application;
  const removing = directory;
  application = undefined;
  directory = undefined;
  try { await closing?.close(); }
  finally { if (removing !== undefined) rmSync(removing, { recursive: true, force: true }); }
});

describe("pinned pack production HTTP retrieval", { timeout: 120_000 }, () => {
  it("retains private edited/withdrawn playtests across duplication and restart without exposing answers or strangers' bytes", async () => {
    directory = mkdtempSync(join(tmpdir(), "tabiya-run-pack-"));
    const databasePath = join(directory, "app.sqlite");
    async function boot() {
      application = await createApplication({ engineMode: "mock", cookieSecure: false, databasePath, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
      await new Promise<void>((resolve, reject) => {
        application!.server.once("error", reject);
        application!.server.listen(0, "127.0.0.1", resolve);
      });
      return `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    }
    let origin = await boot();
    async function register(handle: string) {
      const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
      expect(response.status).toBe(201);
      return response.headers.get("set-cookie")!.split(";", 1)[0]!;
    }
    const cookie = await register("packauthor");
    const stranger = await register("packstranger");
    const headers = { cookie, "content-type": "application/json", "x-writer-id": "pack-writer" };
    async function post(path: string, body: unknown = {}) {
      return fetch(`${origin}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
    }
    const document = { ...structuredClone(fixture), id: "private-retained-pack", title: "Original private instructions", provenance: { reviewStatus: "draft", sources: [] } };
    const created = await post("/packs/drafts", { document });
    expect(created.status).toBe(201);
    const { draft } = await created.json() as { draft: { id: string; digest: string } };
    const played = await post(`/packs/drafts/${draft.id}/playtest`);
    expect(played.status).toBe(201);
    const { run } = await played.json() as { run: DrillRun };
    expect((await fetch(`${origin}/packs/${document.id}`, { headers: { cookie } })).status).toBe(404);
    const path = `/runs/${run.id}/pack`;
    expect((await fetch(`${origin}${path}`)).status).toBe(401);
    expect((await fetch(`${origin}${path}`, { headers: { cookie: stranger } })).status).toBe(404);
    async function retained(runId = run.id) {
      const response = await fetch(`${origin}/runs/${runId}/pack`, { headers: { cookie } });
      expect(response.status).toBe(200);
      expect(response.headers.get("x-pack-digest")).toBe(run.packDigest);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const projection = await response.json();
      expect(projection).toMatchObject({ id: document.id, title: document.title });
      expect(projection).not.toHaveProperty("feedbackClaims");
      expect(projection.objective).not.toHaveProperty("successConditions");
      function noAnswers(node: Record<string, unknown>) {
        expect(node).not.toHaveProperty("annotations");
        expect(node).not.toHaveProperty("feedbackClaims");
        for (const child of (node.children ?? []) as Record<string, unknown>[]) noAnswers(child);
      }
      for (const node of projection.spine) noAnswers(node);
      return projection;
    }
    const original = await retained();
    expect((await post(`/runs/${run.id}/grants`, { op: "grant", handle: "packstranger", role: "spectator" })).status).toBe(200);
    const shared = await fetch(`${origin}${path}`, { headers: { cookie: stranger } });
    expect(shared.status).toBe(200);
    expect(await shared.json()).toEqual(original);
    expect((await post(`/runs/${run.id}/grants`, { op: "revoke", handle: "packstranger" })).status).toBe(200);
    expect((await fetch(`${origin}${path}`, { headers: { cookie: stranger } })).status).toBe(404);
    const edited = await fetch(`${origin}/packs/drafts/${draft.id}`, {
      method: "PUT", headers: { ...headers, "if-match": draft.digest },
      body: JSON.stringify({ document: { ...document, title: "Changed instructions" } }),
    });
    expect(edited.status).toBe(200);
    const later = await post(`/packs/drafts/${draft.id}/playtest`);
    expect(later.status).toBe(201);
    const laterRun = (await later.json() as { run: DrillRun }).run;
    expect(laterRun.packDigest).not.toBe(run.packDigest);
    expect((await post(`/packs/drafts/${draft.id}/withdraw`)).status).toBe(200);
    expect(await retained()).toEqual(original);
    const copy = await post(`/runs/${run.id}/duplicate`, { id: "retained-copy", seed: 23 });
    expect(copy.status).toBe(201);
    expect(await retained("retained-copy")).toEqual(original);
    await application!.close();
    application = undefined;
    origin = await boot();
    expect(await retained()).toEqual(original);
    expect(await retained("retained-copy")).toEqual(original);
    expect((await fetch(`${origin}${path}`, { headers: { cookie: stranger } })).status).toBe(404);
    await application!.close();
    application = undefined;
    const database = new DatabaseSync(databasePath);
    try { database.prepare("DELETE FROM playtest_documents WHERE digest=?").run(run.packDigest); }
    finally { database.close(); }
    origin = await boot();
    const missing = await fetch(`${origin}${path}`, { headers: { cookie } });
    expect(missing.status).toBe(409);
    expect(await missing.json()).toMatchObject({ error: { code: "PACK_UNRESOLVABLE" } });
  });
});
