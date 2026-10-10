// The accepted Campaign/account contracts share the actual deletion consent boundary.
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApplication, type ChessTabiyaApplication } from "./application.js";
import { type AccountBundleV1, type DeletionPreviewV1 } from "./account-data.js";
import { CampaignRegistry } from "./campaign-registry.js";
import { CAMPAIGN_TABLES } from "./campaign-store.js";
import { longitudinalThreadEntryForTests } from "./longitudinal-test-support.js";
import { PackRegistry } from "./pack-registry.js";
import { PrincipleRegistry } from "./principle-registry.js";
import { ShapeRegistry } from "./shape-registry.js";
import { TrainingSetRegistry } from "./training-set-registry.js";

const PASSWORD = "campaign-account-test-password";
const campaignDocument = JSON.parse(readFileSync(new URL("../../../tests/browser/fixtures/campaign.browser.json", import.meta.url), "utf8"));
const packs = [
  "../../../schemas/fixtures/drill-pack/campaign-boss.browser.json",
  "../../../content/drafts/line-boundary.browser.json",
].map(path => ({ source: path, value: JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8")), channel: "community" as const }));

describe("Campaign deletion consent through file-backed application HTTP", () => {
  let application: ChessTabiyaApplication | undefined;
  let directory: string;
  let databasePath: string;
  let origin: string;
  let alice: string;
  let bob: string;

  async function start() {
    application = await createApplication({ databasePath, development: true, engineMode: "mock", cookieSecure: false, longitudinalWorkerEntry: longitudinalThreadEntryForTests() });
    await new Promise<void>((resolve, reject) => { application!.server.once("error", reject); application!.server.listen(0, "127.0.0.1", resolve); });
    origin = `http://127.0.0.1:${(application.server.address() as AddressInfo).port}`;
  }

  beforeEach(async () => {
    directory = mkdtempSync(join(tmpdir(), "tabiya-campaign-account-"));
    databasePath = join(directory, "account.sqlite");
    // Replace installed-content acquisition, not registry validation, application composition,
    // authentication, HTTP, SQLite, Campaign commands or the real background worker.
    vi.spyOn(ShapeRegistry, "loadDefault").mockResolvedValue(new ShapeRegistry());
    vi.spyOn(PrincipleRegistry, "loadDefault").mockResolvedValue(new PrincipleRegistry());
    vi.spyOn(PackRegistry, "loadDefault").mockImplementation(options => PackRegistry.fromDocuments(packs, options));
    vi.spyOn(TrainingSetRegistry, "loadDefault").mockImplementation(lookup => TrainingSetRegistry.fromDocuments([], lookup));
    vi.spyOn(CampaignRegistry, "loadDefault").mockImplementation(lookup => CampaignRegistry.fromDocuments([{ source: "account-lifecycle-fixture", value: campaignDocument }], lookup));
    await start();
    const register = async (handle: string) => {
      const response = await call("POST", "/auth/register", undefined, { handle, password: PASSWORD });
      expect(response.status).toBe(201);
      return response.headers.get("set-cookie")!.split(";", 1)[0]!;
    };
    alice = await register("campaign_account_alice");
    bob = await register("campaign_account_bob");
  });

  afterEach(async () => {
    const closing = application;
    application = undefined;
    try { await closing?.close(); }
    finally { vi.restoreAllMocks(); rmSync(directory, { recursive: true, force: true }); }
  });

  function call(method: string, path: string, cookie?: string, body?: unknown) {
    return fetch(`${origin}${path}`, { method, headers: { "x-writer-id": "campaign-account-writer", ...(cookie === undefined ? {} : { cookie }), ...(body === undefined ? {} : { "content-type": "application/json" }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  }

  async function preview(cookie = alice): Promise<DeletionPreviewV1> {
    const response = await call("POST", "/auth/deletion-preview", cookie, {});
    expect(response.status).toBe(200);
    return response.json();
  }

  async function exported(cookie = alice): Promise<AccountBundleV1> {
    const response = await call("POST", "/auth/export", cookie, { password: PASSWORD });
    expect(response.status).toBe(200);
    return response.json();
  }

  async function create(cookie = alice) {
    const response = await call("POST", "/campaigns/browser-fixture-campaign/runs", cookie, { campaignVersion: 1, commandId: "create-campaign" });
    const body = await response.json();
    expect(response.status, JSON.stringify(body)).toBe(201);
    return body.campaign.campaignRun.id as string;
  }

  const campaignEffect = (value: DeletionPreviewV1) => value.hardDelete.find(effect => effect.kind === "progress" && effect.label.startsWith("Campaign"));

  it("names Campaign-only history, refuses obsolete consent and deletes only the confirmed account across restart", async () => {
    const empty = await preview();
    expect(campaignEffect(empty)).toBeUndefined();
    const campaignRunId = await create();
    const bobRunId = await create(bob);
    const confirmed = await preview();
    expect(campaignEffect(confirmed)).toMatchObject({ count: 3, objectIds: [
      `campaign_events:${campaignRunId}:1`, `campaign_run_creations:${campaignRunId}`, `campaign_runs:${campaignRunId}`,
    ] });
    expect(confirmed).toEqual(await preview());
    const before = await exported();
    const exportedCampaign = before.progress.value.filter(record => CAMPAIGN_TABLES.includes(record.table as typeof CAMPAIGN_TABLES[number]));
    expect(campaignEffect(confirmed)!.count).toBe(exportedCampaign.length);
    const bobBefore = await exported(bob);
    const stale = await call("POST", "/auth/delete", alice, { password: PASSWORD, previewDigest: empty.digest });
    expect(stale.status).toBe(409);
    expect((await stale.json()).error.code).toBe("DELETION_PREVIEW_STALE");
    expect(await exported()).toEqual(before);
    expect(await exported(bob)).toEqual(bobBefore);
    const removed = await call("POST", "/auth/delete", alice, { password: PASSWORD, previewDigest: confirmed.digest });
    expect(removed.status).toBe(200);
    expect((await call("POST", "/auth/deletion-preview", alice, {})).status).toBe(401);
    expect(await exported(bob)).toEqual(bobBefore);
    await application!.close();
    application = undefined;
    await start();
    expect((await call("GET", `/campaign-runs/${campaignRunId}`, bob)).status).toBe(404);
    expect((await call("GET", `/campaign-runs/${bobRunId}`, bob)).status).toBe(200);
    expect(await exported(bob)).toEqual(bobBefore);
    const database = new DatabaseSync(databasePath, { readOnly: true });
    try { expect(database.prepare("PRAGMA foreign_key_check").all()).toEqual([]); }
    finally { database.close(); }
  });

  it.each([
    { table: "campaign_runs", column: "created_at", key: "id" },
    { table: "campaign_run_creations", column: "created_at", key: "campaign_run_id" },
    { table: "campaign_events", column: "at", key: "campaign_run_id" },
  ])("binds consent to $table state even when record identities and counts do not change", async ({ table, column, key }) => {
    const campaignRunId = await create();
    const original = await preview();
    const bobBefore = await exported(bob);
    // Controlled storage changes preserve row identity/count, isolating the digest boundary.
    const database = new DatabaseSync(databasePath);
    try { database.prepare(`UPDATE ${table} SET ${column}=? WHERE ${key}=?`).run("2026-10-10T12:00:00.000Z", campaignRunId); }
    finally { database.close(); }
    const changed = await preview();
    expect(changed.hardDelete).toEqual(original.hardDelete);
    expect(changed.digest).not.toBe(original.digest);
    const before = await exported();
    const stale = await call("POST", "/auth/delete", alice, { password: PASSWORD, previewDigest: original.digest });
    expect(stale.status).toBe(409);
    expect((await stale.json()).error.code).toBe("DELETION_PREVIEW_STALE");
    expect(await exported()).toEqual(before);
    expect(await exported(bob)).toEqual(bobBefore);
  });

  it("rolls back Campaign erasure when deleting an active encounter fails later in the same transaction", async () => {
    const campaignRunId = await create();
    const started = await call("POST", `/campaign-runs/${campaignRunId}/nodes/f1-a/start`, alice, { expectedRevision: 1, commandId: "enter-campaign" });
    expect(started.status).toBe(201);
    const playRunId = (await started.json()).result.response.playRunId as string;
    // The real worker may publish this encounter's private observations. Wait for its exact
    // completion before confirming consent; otherwise a legitimate new row can stale the plan.
    await vi.waitFor(() => expect(application!.longitudinal.progress()?.completed).toBeGreaterThanOrEqual(1));
    const confirmed = await preview();
    const before = await exported();
    const database = new DatabaseSync(databasePath);
    try { database.exec("CREATE TRIGGER test_refuse_run_delete BEFORE DELETE ON drill_runs BEGIN SELECT RAISE(ABORT, 'test deletion fault'); END;"); }
    finally { database.close(); }
    const failed = await call("POST", "/auth/delete", alice, { password: PASSWORD, previewDigest: confirmed.digest });
    expect(failed.status).toBe(500);
    expect(await exported()).toEqual(before);
    expect(await preview()).toEqual(confirmed);
    expect((await call("GET", `/campaign-runs/${campaignRunId}`, alice)).status).toBe(200);
    expect((await call("GET", `/runs/${playRunId}/graph`, alice)).status).toBe(200);
    const repaired = new DatabaseSync(databasePath);
    try { repaired.exec("DROP TRIGGER test_refuse_run_delete"); expect(repaired.prepare("PRAGMA foreign_key_check").all()).toEqual([]); }
    finally { repaired.close(); }
    expect((await call("POST", "/auth/delete", alice, { password: PASSWORD, previewDigest: confirmed.digest })).status).toBe(200);
  });
});
