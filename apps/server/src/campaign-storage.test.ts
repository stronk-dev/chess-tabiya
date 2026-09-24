import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { canonicalizeJson } from "@chess-tabiya/schema/drill-pack";
import { afterEach, describe, expect, it } from "vitest";

import { admitCampaignEventRow, buildCampaignEventRow, campaignOperandsDigest } from "./campaign-events.js";
import { CAMPAIGN_TABLES } from "./campaign-store.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";

// rfc/campaign-core.md criteria 14, 26 (database half), 34 and 35: migration 30's DDL, the partial
// unique active-run constraint across two writers, relational ownership, and the closed event image.

const AT = "2026-09-24T12:00:00.000Z";
const DIGEST = `sha256:${"a".repeat(64)}` as const;
const dirs: string[] = [];
afterEach(() => { while (dirs.length > 0) rmSync(dirs.pop()!, { recursive: true, force: true }); });

function learner(storage: SQLiteRunStorage, id: string): void {
  storage.createLearner({ id, handle: id, passwordHash: "x", createdAt: AT });
}

function row(id: string, learnerId: string) {
  return { id, learnerId, campaignId: "camp", campaignVersion: 1, documentDigest: DIGEST, document: "{}", status: "active" as const, activeEncounterRunId: null, createdAt: AT };
}

describe("migration 30 (campaign tables)", () => {
  it("lands at STORAGE_VERSION 30 with all five STRICT tables and the one-active partial unique index", () => {
    expect(STORAGE_VERSION).toBe(30);
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => undefined });
    const tables = storage.applicationTableNames();
    for (const table of CAMPAIGN_TABLES) expect(tables).toContain(table);
    learner(storage, "alice");
    storage.campaignTransaction(({ store }) => store.insertRun(row("c1", "alice")));
    expect(() => storage.campaignTransaction(({ store }) => store.insertRun(row("c2", "alice")))).toThrowError(expect.objectContaining({ code: "CAMPAIGN_RUN_ACTIVE_EXISTS" }));
    // A completed run frees the partial index.
    storage.campaignTransaction(({ store }) => store.setMaterialized("c1", "completed", null));
    storage.campaignTransaction(({ store }) => store.insertRun(row("c2", "alice")));
    expect(storage.foreignKeyViolationCount()).toBe(0);
    storage.close();
  });

  it("two independent SQLite writers racing distinct creates commit exactly one active run", () => {
    const dir = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), "campaign-race-"));
    dirs.push(dir);
    const path = join(dir, "db.sqlite");
    const first = new SQLiteRunStorage(path, { onMigration: () => undefined });
    learner(first, "alice");
    const second = new SQLiteRunStorage(path, { onMigration: () => undefined });
    const outcomes = [first, second].map((storage, index) => {
      try { storage.campaignTransaction(({ store }) => store.insertRun(row(`race-${index}`, "alice"))); return "committed"; }
      catch (error) { return (error as { code?: string }).code; }
    });
    expect(outcomes.sort()).toEqual(["CAMPAIGN_RUN_ACTIVE_EXISTS", "committed"]);
    first.close();
    second.close();
  });

  it("refuses a crossed creation receipt and an active pointer to another learner's run (criterion 34)", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => undefined });
    learner(storage, "alice");
    learner(storage, "bob");
    storage.campaignTransaction(({ store }) => store.insertRun(row("c1", "alice")));
    expect(() => storage.campaignTransaction(({ store }) => store.insertCreation({ learnerId: "bob", campaignId: "camp", commandId: "x", campaignVersion: 1, operandsDigest: DIGEST, campaignRunId: "c1", resultPayload: "{}", createdAt: AT }))).toThrow();
    expect(() => storage.campaignTransaction(({ store }) => store.setMaterialized("c1", "active", "someone-elses-run"))).toThrow();
    // A fault after any step rolls back every write of the transaction.
    const faulty = new SQLiteRunStorage(":memory:", { onMigration: () => undefined, campaignFault: (step) => { if (step === "campaign_events") throw new Error("injected"); } });
    learner(faulty, "alice");
    expect(() => faulty.campaignTransaction((tx) => {
      tx.store.insertRun(row("c9", "alice"));
      tx.step("campaign_runs");
      tx.store.insertEvent(buildCampaignEventRow({ campaignRunId: "c9", seq: 1, kind: "campaign_created", commandId: "create", expectedRevision: null, operandsDigest: DIGEST, payload: { campaignId: "camp", campaignVersion: 1, documentDigest: DIGEST, startingCharges: 1 }, response: {}, at: AT }));
      tx.step("campaign_events");
    })).toThrow(/injected/u);
    expect(faulty.campaigns.run("c9")).toBeUndefined();
    storage.close();
    faulty.close();
  });
});

describe("closed semantic event image (criterion 35, [[D2989]])", () => {
  const image = buildCampaignEventRow({
    campaignRunId: "c1", seq: 2, kind: "loadout_changed", commandId: "cmd", expectedRevision: 1, operandsDigest: campaignOperandsDigest({ a: 1 }),
    payload: { equippedModuleIds: ["guided_hint"] }, response: { equippedModuleIds: ["guided_hint"] }, at: AT,
  });
  const rowOf = (overrides: Record<string, unknown> = {}) => ({
    campaign_run_id: image.campaignRunId, seq: image.seq, kind: image.kind, command_id: image.commandId, expected_revision: image.expectedRevision,
    operands_digest: image.operandsDigest, payload: image.payload, result_payload: image.resultPayload, at: image.at, ...overrides,
  });

  it("round-trips and freezes the admitted value", () => {
    const admitted = admitCampaignEventRow(rowOf(), "c1");
    expect(admitted.event).toMatchObject({ kind: "loadout_changed", payload: { equippedModuleIds: ["guided_hint"] } });
    expect(Object.isFrozen(admitted.event.payload)).toBe(true);
  });

  it("refuses extra payload keys, wrong result kind, invalid instants, duplicate keys and transplanted digests", () => {
    expect(() => admitCampaignEventRow(rowOf({ payload: canonicalizeJson({ equippedModuleIds: ["guided_hint"], extra: { nested: true } }) }), "c1")).toThrow(/CAMPAIGN_EVENT_CORRUPT/u);
    const wrongKind = JSON.parse(image.resultPayload) as Record<string, unknown>;
    expect(() => admitCampaignEventRow(rowOf({ result_payload: canonicalizeJson({ ...wrongKind, kind: "campaign_created" }) }), "c1")).toThrow(/CAMPAIGN_EVENT_CORRUPT/u);
    expect(() => admitCampaignEventRow(rowOf({ at: "not-a-time" }), "c1")).toThrow(/CAMPAIGN_EVENT_CORRUPT/u);
    expect(() => admitCampaignEventRow(rowOf({ payload: '{"equippedModuleIds":[],"equippedModuleIds":["guided_hint"]}' }), "c1")).toThrow(/CAMPAIGN_EVENT_CORRUPT/u);
    expect(() => admitCampaignEventRow(rowOf(), "c2")).toThrow(/CAMPAIGN_EVENT_CORRUPT/u);
    expect(() => admitCampaignEventRow(rowOf({ command_id: "other" }), "c1")).toThrow(/digest/u);
    expect(() => admitCampaignEventRow(rowOf({ payload: canonicalizeJson({ equippedModuleIds: ["rules_floor"] }) }), "c1")).toThrow(/CAMPAIGN_EVENT_CORRUPT/u);
    expect(() => admitCampaignEventRow(rowOf({ expected_revision: null }), "c1")).toThrow(/CAMPAIGN_EVENT_CORRUPT/u);
  });
});
