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
    async function refusePrivateStart(id: string, intent?: unknown, actor = stranger) {
      const attempted = await fetch(`${origin}/runs`, {
        method: "POST", headers: { ...headers, cookie: actor },
        body: JSON.stringify({ id, session: { kind: "pack", packId: run.packId, packDigest: run.packDigest }, policyConfig: run.policyConfig, seed: 31, ...(intent === undefined ? {} : { intent }) }),
      });
      expect.soft(attempted.status).toBe(404);
      expect.soft((await attempted.json()).error?.code).toBe("PACK_NOT_FOUND");
      expect.soft((await fetch(`${origin}/runs/${id}/graph`, { headers: { cookie: actor } })).status).toBe(404);
    }
    await refusePrivateStart("stranger-private-start");
    await refusePrivateStart("forged-private-lineage", { origin: "duplicate", derivedFromRunId: run.id });
    await refusePrivateStart("owner-private-direct-start", undefined, cookie);
    const strangerPlaytest = await fetch(`${origin}/packs/drafts/${draft.id}/playtest`, { method: "POST", headers: { ...headers, cookie: stranger }, body: "{}" });
    expect(strangerPlaytest.status).toBe(404);
    const strangerCopy = await fetch(`${origin}/runs/${run.id}/duplicate`, { method: "POST", headers: { ...headers, cookie: stranger }, body: JSON.stringify({ id: "unauthorised-copy", seed: 23 }) });
    expect(strangerCopy.status).toBe(404);
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
    const permittedCopy = await fetch(`${origin}/runs/${run.id}/duplicate`, { method: "POST", headers: { ...headers, cookie: stranger }, body: JSON.stringify({ id: "spectator-private-copy", seed: 23 }) });
    expect(permittedCopy.status).toBe(201);
    expect((await permittedCopy.json()).run.packDigest).toBe(run.packDigest);
    // A read grant permits explicit saved-run duplication, never a digest-only start.
    await refusePrivateStart("granted-digest-start", { origin: "duplicate", derivedFromRunId: run.id });
    expect((await post(`/runs/${run.id}/grants`, { op: "revoke", handle: "packstranger" })).status).toBe(200);
    expect((await fetch(`${origin}${path}`, { headers: { cookie: stranger } })).status).toBe(404);
    expect((await fetch(`${origin}/runs/spectator-private-copy/pack`, { headers: { cookie: stranger } })).status).toBe(200);
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
    await refusePrivateStart("withdrawn-digest-start");
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
    await refusePrivateStart("restarted-digest-start");
    await application!.close();
    application = undefined;
    const database = new DatabaseSync(databasePath);
    try { database.prepare("DELETE FROM playtest_documents WHERE digest=?").run(run.packDigest); }
    finally { database.close(); }
    origin = await boot();
    const missing = await fetch(`${origin}${path}`, { headers: { cookie } });
    expect(missing.status).toBe(409);
    expect(await missing.json()).toMatchObject({ error: { code: "PACK_UNRESOLVABLE" } });
    const missingCopy = await post(`/runs/${run.id}/duplicate`, { id: "missing-document-copy", seed: 23 });
    expect(missingCopy.status).toBe(409);
    expect(await missingCopy.json()).toMatchObject({ error: { code: "PACK_UNRESOLVABLE" } });
  });

  it("admits current public pack digests but preserves historical registered bytes only through authorised replay", async () => {
    directory = mkdtempSync(join(tmpdir(), "tabiya-pack-admission-"));
    application = await createApplication({ engineMode: "mock", cookieSecure: false, databasePath: join(directory, "app.sqlite"), longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    await new Promise<void>((resolve, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolve); });
    const origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
    async function register(handle: string) {
      const response = await fetch(`${origin}/auth/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle, password: `${handle}-password-long` }) });
      expect(response.status).toBe(201);
      return response.headers.get("set-cookie")!.split(";", 1)[0]!;
    }
    const author = await register("publicpackauthor");
    const learner = await register("publicpacklearner");
    async function post(path: string, body: unknown, cookie = author) {
      return fetch(`${origin}${path}`, { method: "POST", headers: { cookie, "content-type": "application/json", "x-writer-id": "public-pack-writer" }, body: JSON.stringify(body) });
    }
    const document = { ...structuredClone(fixture), id: "registered-admission-pack", title: "Public version one", version: "1.0.0", provenance: { reviewStatus: "draft", sources: ["Native admission test fixture"], corpusEvidence: { state: "abstained", reason: "source_unavailable", detail: "This access-control fixture does not supply corpus evidence." } } };
    async function publish(value: unknown) {
      const response = await post("/packs/drafts", { document: value });
      expect(response.status).toBe(201);
      const { draft } = await response.json();
      const published = await post(`/packs/drafts/${draft.id}/register`, {});
      expect(published.status).toBe(201);
      return (await published.json()).pack;
    }
    const first = await publish(document);
    const policyConfig = { seedMode: "per_run", locus: { executedAt: "server", engineIds: [], modelIds: [] } };
    const fresh = (id: string, packDigest: string) => ({ id, session: { kind: "pack", packId: document.id, packDigest }, policyConfig, seed: 23 });
    const started = await post("/runs", fresh("registered-old-run", first.digest), learner);
    expect(started.status).toBe(201);
    const second = await publish({ ...document, version: "1.1.0", title: "Public version two" });
    expect(second.digest).not.toBe(first.digest);
    const stale = await post("/runs", fresh("stale-public-digest", first.digest), learner);
    expect(stale.status).toBe(400);
    expect(await stale.json()).toMatchObject({ error: { code: "INVALID_REQUEST" } });
    expect((await fetch(`${origin}/runs/stale-public-digest/graph`, { headers: { cookie: learner } })).status).toBe(404);
    const current = await post("/runs", fresh("registered-current-run", second.digest), learner);
    expect(current.status).toBe(201);
    expect((await current.json()).run.packDigest).toBe(second.digest);
    // A private playtest may reuse a public id but cannot replace what fresh starts resolve.
    const shadowDraft = await post("/packs/drafts", { document: { ...document, title: "Private shadow instructions" } });
    expect(shadowDraft.status).toBe(201);
    const shadow = await shadowDraft.json();
    const shadowPlaytest = await post(`/packs/drafts/${shadow.draft.id}/playtest`, {});
    expect(shadowPlaytest.status).toBe(201);
    const shadowRun = (await shadowPlaytest.json()).run;
    const shadowStart = await post("/runs", fresh("private-shadow-start", shadowRun.packDigest), learner);
    expect(shadowStart.status).toBe(400);
    expect((await shadowStart.json()).error?.code).toBe("INVALID_REQUEST");
    expect((await fetch(`${origin}/runs/private-shadow-start/graph`, { headers: { cookie: learner } })).status).toBe(404);
    const publicAfterShadow = await post("/runs", { ...fresh("public-after-shadow", second.digest), session: { kind: "pack", packId: document.id } }, learner);
    expect(publicAfterShadow.status).toBe(201);
    expect((await publicAfterShadow.json()).run.packDigest).toBe(second.digest);
    const copy = await post("/runs/registered-old-run/duplicate", { id: "registered-old-copy", seed: 29 }, learner);
    expect(copy.status).toBe(201);
    expect((await copy.json()).run.packDigest).toBe(first.digest);
    const retained = await fetch(`${origin}/runs/registered-old-copy/pack`, { headers: { cookie: learner } });
    expect(retained.status).toBe(200);
    expect(await retained.json()).toMatchObject({ title: document.title, version: document.version });
  });
});
