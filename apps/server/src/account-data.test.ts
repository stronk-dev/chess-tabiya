import { describe, expect, it } from "vitest";
import { createRun } from "@chess-tabiya/runtime";

import {
  ACCOUNT_BUNDLE_FORMAT,
  ACCOUNT_DATA_INVENTORY,
  assertAccountDataInventory,
  assertIdentityTransformInventory,
  canonicalJson,
  planDeletion,
  serializeAccountBundle,
  storedRunExport,
  validateAccountBundleV1,
  type AccountBundleV1,
} from "./account-data.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";

function projection<T>(provenance: readonly string[], value: T) {
  return Object.freeze({ projectionVersion: 1 as const, provenance: Object.freeze([...provenance]), value });
}

function bundle(): AccountBundleV1 {
  return Object.freeze({
    format: ACCOUNT_BUNDLE_FORMAT,
    formatVersion: 1,
    source: Object.freeze({ applicationVersion: "0.0.0", storageVersion: STORAGE_VERSION, runSchemaVersion: "0.17" }),
    account: projection(["learners"], Object.freeze({ handle: "alice", displayName: "Alice", createdAt: "2026-08-23T00:00:00.000Z" })),
    ownedRuns: projection(["drill_runs", "run_grants", "imported_games"], Object.freeze([])),
    sharedAccess: projection(["run_grants", "run_marks"], Object.freeze([])),
    progress: projection(["attempts", "attempt_concepts", "schedules", "learner_position_stats"], Object.freeze([])),
    marks: projection(["run_marks"], Object.freeze([])),
    repertoires: projection(["repertoires", "repertoire_moves", "repertoire_scans", "repertoire_gap_runs"], Object.freeze([])),
    drafts: projection(["pack_drafts", "shape_drafts", "playtest_documents"], Object.freeze([])),
    publications: projection(["registered_packs", "registered_shapes"], Object.freeze([])),
    liveAndSocial: projection(["live_sessions", "session_journal", "classrooms"], Object.freeze([])),
    behavioralProfiles: projection(["learner_ratings", "rated_games", "rating_periods", "cohort_standings", "standing_members", "learner_marks"], Object.freeze([])),
    exclusions: projection(["learner_sessions", "public_tokens", "browser_local"], Object.freeze([
      Object.freeze({ kind: "password_hash", reason: "Authentication material is never exported." }),
      Object.freeze({ kind: "sessions", reason: "Authenticated sessions and bearer credentials are never exported." }),
    ])),
  });
}

describe("portable account-data foundation", () => {
  it("accounts for every migration-25 table exactly once", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    expect(() => assertAccountDataInventory(storage.applicationTableNames())).not.toThrow();
    expect(() => assertIdentityTransformInventory(storage.applicationIdentityFields())).not.toThrow();
    expect(new Set(ACCOUNT_DATA_INVENTORY.map((entry) => entry.store)).size).toBe(ACCOUNT_DATA_INVENTORY.length);
    storage.close();
  });

  it("serializes stable canonical bytes and rejects shape drift", () => {
    const value = bundle();
    const first = serializeAccountBundle(value);
    const second = serializeAccountBundle(value);
    expect(first).toEqual(second);
    expect(first.digest).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(canonicalJson({ z: 1, a: { y: true, b: null } })).toBe('{"a":{"b":null,"y":true},"z":1}');
    expect(() => validateAccountBundleV1({ ...value, surprise: true })).toThrow(/unknown or missing/u);
    expect(() => validateAccountBundleV1({ ...value, formatVersion: 2 })).toThrow(/unsupported/u);
    expect(() => validateAccountBundleV1({ ...value, marks: { ...value.marks, extra: true } })).toThrow(/unknown or missing/u);
  });

  it("projects an empty learner account from one stable SQLite read transaction", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {} });
    storage.createLearner({ id: "learner-alice", handle: "alice", displayName: "Alice", passwordHash: "secret-hash", createdAt: "2026-08-23T00:00:00.000Z" });
    const first = serializeAccountBundle(storage.accountBundle("learner-alice"));
    const second = serializeAccountBundle(storage.accountBundle("learner-alice"));
    expect(first).toEqual(second);
    const text = new TextDecoder().decode(first.bytes);
    expect(text).toContain('"handle":"alice"');
    expect(text).not.toContain("secret-hash");
    storage.close();
  });

  it("exports a shared reference without copying another learner's snapshot or internal id", () => {
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => "2026-08-23T00:00:00.000Z" });
    storage.createLearner({ id: "learner-alice-private-id", handle: "alice", passwordHash: "!", createdAt: "2026-08-23T00:00:00.000Z" });
    storage.createLearner({ id: "learner-bob-private-id", handle: "bob", passwordHash: "!", createdAt: "2026-08-23T00:00:00.000Z" });
    const run = createRun({ id: "bob-shared-run", packId: "shared-pack", packDigest: `sha256:${"7".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed: 1, createdAt: "2026-08-23T00:00:00.000Z", policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    storage.create(run, { writerId: "writer-bob", learnerId: "learner-bob-private-id" }, "Bob's run");
    storage.grantRole(run.id, "learner-alice-private-id", "spectator", { writerId: "writer-bob", learnerId: "learner-bob-private-id" }, "2026-08-23T00:00:00.000Z");
    const exported = new TextDecoder().decode(serializeAccountBundle(storage.accountBundle("learner-alice-private-id")).bytes);
    expect(exported).toContain('"runId":"bob-shared-run"');
    expect(exported).not.toContain('"snapshot"');
    expect(exported).not.toContain("learner-bob-private-id");
    storage.close();
  });

  it("classifies authenticated dependencies as tombstones but anonymous links only as revocations", () => {
    const preview = planDeletion({
      scope: { kind: "account" },
      runs: [
        { id: "private", title: "Private", activeForeignGranteeIds: [], foreignOwnedDerivedRunIds: [], anonymousLinkIds: ["share-private"] },
        { id: "shared", title: "Shared", activeForeignGranteeIds: ["bob"], foreignOwnedDerivedRunIds: [], anonymousLinkIds: [] },
        { id: "derived-source", title: "Derived source", activeForeignGranteeIds: [], foreignOwnedDerivedRunIds: ["foreign-child"], anonymousLinkIds: [] },
      ],
      hardDelete: [],
      retainedPublished: [],
    });
    expect(preview.hardDelete.flatMap((effect) => effect.objectIds)).toEqual(["private"]);
    expect(preview.tombstone.flatMap((effect) => effect.objectIds)).toEqual(["derived-source", "shared"]);
    expect(preview.revoke.flatMap((effect) => effect.objectIds)).toEqual(["share-private"]);
    expect(planDeletion({ scope: { kind: "account" }, runs: [], hardDelete: [], retainedPublished: [] }).digest).not.toBe(preview.digest);
  });

  it("keeps invalid and unsupported stored run text losslessly in the raw arm", () => {
    expect(storedRunExport("not-json", "0.17")).toMatchObject({ replayable: false, snapshot: { kind: "raw", utf8: "not-json", diagnostic: { code: "INVALID_JSON" } } });
    expect(storedRunExport('{"id":"missing-schema"}', "0.17")).toMatchObject({ replayable: false, snapshot: { kind: "raw", diagnostic: { code: "INVALID_RUN_DOCUMENT" } } });
    const old = '{"schemaVersion":"0.16","id":"old"}';
    expect(storedRunExport(old, "0.17")).toMatchObject({ replayable: false, schemaVersion: "0.16", snapshot: { kind: "raw", utf8: old, diagnostic: { code: "UNSUPPORTED_RUN_SCHEMA" } } });
  });
});
