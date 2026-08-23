import { describe, expect, it } from "vitest";
import { commitMove, createRun } from "@chess-tabiya/runtime";

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
import { SQLiteRunStorage, STORAGE_VERSION, type DeletionEffectGroup } from "./storage.js";
import { projectAttempts } from "./progress.js";

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
    expect(() => validateAccountBundleV1({ ...value, account: { ...value.account, value: { ...value.account.value, surprise: true } } })).toThrow(/unknown or missing/u);
    const { marks: _missing, ...missingSection } = value;
    expect(() => validateAccountBundleV1(missingSection)).toThrow(/unknown or missing/u);
    expect(() => validateAccountBundleV1({ ...value, progress: { ...value.progress, projectionVersion: 2 } })).toThrow(/projection header/u);
    expect(() => validateAccountBundleV1({ ...value, marks: { ...value.marks, value: [{ table: "learner_sessions", record: {} }] } })).toThrow(/not exportable/u);
    expect(() => validateAccountBundleV1({
      ...value,
      ownedRuns: {
        ...value.ownedRuns,
        value: [{
          id: "run-export-id",
          title: "Broken reference",
          schemaVersion: "0.17",
          replayable: true,
          snapshot: { kind: "parsed", value: { id: "different-run-id", schemaVersion: "0.17" } },
          importedGame: null,
          grants: [],
          derivations: [],
        }],
      },
    })).toThrow(/snapshot id does not match/u);
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

  it("exports every live, social, and classroom family with handles instead of internal learner ids", () => {
    const at = "2026-08-23T00:00:00.000Z";
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at });
    storage.createLearner({ id: "private-owner-id", handle: "owner", passwordHash: "!", createdAt: at });
    storage.createLearner({ id: "private-partner-id", handle: "partner", passwordHash: "!", createdAt: at });
    const makeRun = (id: string, seed: number) => createRun({ id, packId: "social-pack", packDigest: `sha256:${"6".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const arenaRun = makeRun("arena-run", 1);
    const matchRun = makeRun("match-run", 2);
    const submittedRun = makeRun("submitted-run", 3);
    storage.create(arenaRun, { writerId: "arena-writer", learnerId: "private-owner-id" }, "Arena run");
    storage.create(matchRun, { writerId: "match-writer", learnerId: "private-owner-id" }, "Match run");
    storage.create(submittedRun, { writerId: "submitted-writer", learnerId: "private-partner-id" }, "Submitted run");
    storage.createLiveSession({ id: "arena-session", runId: arenaRun.id, kind: "match", title: "Arena", boardControl: "host_directed", rotation: ["private-owner-id", "private-partner-id"], createdBy: "private-owner-id", at });
    storage.createLiveSession({ id: "match-session", runId: matchRun.id, kind: "match", title: "Native match", boardControl: "match", matchPlayers: { whiteLearnerId: "private-owner-id", blackLearnerId: "private-partner-id" }, createdBy: "private-owner-id", at });
    storage.createProposal({ id: "proposal-one", sessionId: "arena-session", nodeId: arenaRun.nodes[0]!.id, moveUci: "e2e4", proposedBy: "private-owner-id", at });
    storage.createVoteWindow({ id: "window-one", sessionId: "arena-session", nodeId: arenaRun.nodes[0]!.id, prompt: "Choose", options: [{ moveUci: "e2e4", label: "King pawn" }, { moveUci: "d2d4", label: "Queen pawn" }], opensAt: at, closesAt: "2026-08-23T00:01:00.000Z" }, "private-owner-id");
    storage.castVote({ sessionId: "arena-session", windowId: "window-one", voterKey: "learner:private-owner-id", choiceUci: "e2e4", castByLearnerId: "private-owner-id", at });
    storage.createInvitation({ sessionId: "arena-session", leg: 1, invitedHandle: "partner", invitedRole: "participant", externalChallengeUrl: null, at });
    storage.createPublicToken!({ id: "story-token", tokenHash: "never-export-token-hash", scope: "story_read", runId: arenaRun.id, branchId: arenaRun.branches[0]!.id, createdBy: "private-owner-id", createdAt: at, revokedAt: null });
    storage.createClassroom({ id: "classroom-one", ownerLearnerId: "private-owner-id", name: "Study group", createdAt: at, archivedAt: null });
    storage.inviteClassroomMember({ classroomId: "classroom-one", learnerId: "private-partner-id", memberRole: "learner", state: "invited", invitedBy: "private-owner-id", invitedAt: at });
    storage.setClassroomMemberState("classroom-one", "private-partner-id", "active", at);
    storage.createAssignment({ id: "assignment-one", classroomId: "classroom-one", packId: "social-pack", assignedBy: "private-owner-id", note: "Try both branches", dueAt: null, createdAt: at, withdrawnAt: null });
    storage.submitAssignment({ assignmentId: "assignment-one", learnerId: "private-partner-id", runId: submittedRun.id, grantedLearnerIds: [], submittedAt: at, accessExpiresAt: "2026-09-23T00:00:00.000Z", withdrawnAt: null }, ["private-owner-id"]);

    const bundle = storage.accountBundle("private-owner-id");
    const tables = new Set((bundle.liveAndSocial.value as readonly { readonly table: string }[]).map((item) => item.table));
    expect(tables).toEqual(new Set([
      "live_sessions", "session_journal", "session_proposals", "session_vote_windows", "session_votes",
      "session_invitations", "arena_legs", "match_states", "public_tokens", "classrooms",
      "classroom_members", "assignments", "assignment_submissions",
    ]));
    const exported = new TextDecoder().decode(serializeAccountBundle(bundle).bytes);
    expect(exported).toContain('"cast_by_handle":"owner"');
    expect(exported).toContain('"black_handle":"partner"');
    expect(exported).toContain('"granted_handles":["owner"]');
    expect(exported).not.toContain("private-partner-id");
    expect(exported).not.toContain("never-export-token-hash");
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

  it("tombstones a source needed by a foreign-owned derivation and deletes a private chain", () => {
    const at = "2026-08-23T00:00:00.000Z";
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at });
    storage.createLearner({ id: "source-owner", handle: "source-owner", passwordHash: "!", createdAt: at });
    storage.createLearner({ id: "foreign-owner", handle: "foreign-owner", passwordHash: "!", createdAt: at });
    const makeRun = (id: string, seed: number) => createRun({ id, packId: "derived-pack", packDigest: `sha256:${"5".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const sharedSource = makeRun("shared-source", 1);
    const foreignChild = makeRun("foreign-child", 2);
    const privateSource = makeRun("private-source", 3);
    const privateChild = makeRun("private-child", 4);
    storage.create(sharedSource, { writerId: "source-writer", learnerId: "source-owner" });
    storage.create(privateSource, { writerId: "private-source-writer", learnerId: "source-owner" });
    storage.createDerivedRun!(foreignChild, { writerId: "foreign-writer", learnerId: "foreign-owner" }, "Foreign child", { derivedRunId: foreignChild.id, sourceRunId: sharedSource.id, sourceBranchId: sharedSource.branches[0]!.id, sourceNodeId: sharedSource.nodes[0]!.id, kind: "flip_sides", createdAt: at });
    storage.createDerivedRun!(privateChild, { writerId: "private-child-writer", learnerId: "source-owner" }, "Private child", { derivedRunId: privateChild.id, sourceRunId: privateSource.id, sourceBranchId: privateSource.branches[0]!.id, sourceNodeId: privateSource.nodes[0]!.id, kind: "flip_sides", createdAt: at });
    const preview = storage.deletionPreview("source-owner", { kind: "account" }, at);
    expect(preview.tombstone.flatMap((effect) => effect.objectIds)).toContain(sharedSource.id);
    expect(preview.hardDelete.flatMap((effect) => effect.objectIds)).toEqual(expect.arrayContaining([privateSource.id, privateChild.id]));
    storage.deleteLearner("source-owner", at, preview.digest);
    expect(storage.read(sharedSource.id)?.activeWriterLearnerId).toBe("__legacy");
    expect(storage.read(foreignChild.id)).toBeDefined();
    expect(storage.read(privateSource.id)).toBeUndefined();
    expect(storage.read(privateChild.id)).toBeUndefined();
    expect(storage.foreignKeyViolationCount()).toBe(0);
    storage.close();
  });

  it("reprojects position statistics from the attempts left after deleting one run", () => {
    const at = "2026-08-23T00:00:00.000Z";
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at });
    storage.createLearner({ id: "stats-owner", handle: "stats-owner", passwordHash: "!", createdAt: at });
    const makePlayed = (id: string, seed: number) => commitMove(createRun({ id, packId: "stats-pack", packDigest: `sha256:${"4".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } }), "e2e4", { at }).run;
    const removed = makePlayed("stats-removed", 1);
    const retained = makePlayed("stats-retained", 2);
    storage.create(removed, { writerId: "removed-writer", learnerId: "stats-owner" });
    storage.create(retained, { writerId: "retained-writer", learnerId: "stats-owner" });
    for (const run of [removed, retained]) {
      const projected = projectAttempts({ run, learnerId: "stats-owner" });
      storage.upsertAttempts(projected.attempts, projected.conceptTags);
    }
    const beforeStats = storage.accountBundle("stats-owner").progress.value.filter((item) => (item as { table?: unknown }).table === "learner_position_stats");
    expect(beforeStats).toHaveLength(1);
    expect(JSON.stringify(beforeStats)).toContain('"seen_count":2');
    const preview = storage.deletionPreview("stats-owner", { kind: "run", runId: removed.id }, at);
    storage.deleteOwnedRun("stats-owner", removed.id, at, preview.digest);
    const bundle = storage.accountBundle("stats-owner");
    expect(JSON.stringify(bundle.progress.value.filter((item) => (item as { table?: unknown }).table === "learner_position_stats"))).toContain('"seen_count":1');
    expect(JSON.stringify(bundle.progress.value)).toContain(retained.id);
    expect(JSON.stringify(bundle.progress.value)).not.toContain(removed.id);
    storage.close();
  });

  it("makes both run mutation and publication invalidate an account deletion preview", () => {
    const at = "2026-08-23T00:00:00.000Z";
    const storage = new SQLiteRunStorage(":memory:", { onMigration: () => {}, now: () => at });
    storage.createLearner({ id: "stale-owner", handle: "stale-owner", passwordHash: "!", createdAt: at });
    const run = createRun({ id: "stale-run", packId: "stale-pack", packDigest: `sha256:${"3".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed: 3, createdAt: at, policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
    const lease = { writerId: "stale-writer", learnerId: "stale-owner" } as const;
    storage.create(run, lease);
    const beforeMove = storage.deletionPreview("stale-owner", { kind: "account" }, at);
    storage.save(commitMove(run, "e2e4", { at }).run, lease);
    expect(() => storage.deleteLearner("stale-owner", at, beforeMove.digest)).toThrow(/preview is stale/u);
    expect(storage.learnerById("stale-owner")).toBeDefined();

    const beforePublication = storage.deletionPreview("stale-owner", { kind: "account" }, at);
    const document = { id: "published-pack", version: "0.27" };
    storage.createPackDraft({ id: "published-draft", packId: "published-pack", ownerLearnerId: "stale-owner", document, digest: `sha256:${"2".repeat(64)}`, state: "draft", seedKind: "blank", seedRef: null, createdAt: at, updatedAt: at });
    storage.registerPackDraft({ packId: "published-pack", version: "0.27", digest: `sha256:${"2".repeat(64)}`, document, publisherHandle: "stale-owner", publisherLearnerId: "stale-owner", draftId: "published-draft", registeredAt: at });
    expect(() => storage.deleteLearner("stale-owner", at, beforePublication.digest)).toThrow(/preview is stale/u);
    expect(storage.learnerById("stale-owner")).toBeDefined();
    expect(storage.registeredPacks()).toHaveLength(1);
    storage.close();
  });

  it("keeps invalid and unsupported stored run text losslessly in the raw arm", () => {
    expect(storedRunExport("not-json", "0.17")).toMatchObject({ replayable: false, snapshot: { kind: "raw", utf8: "not-json", diagnostic: { code: "INVALID_JSON" } } });
    expect(storedRunExport('{"id":"missing-schema"}', "0.17")).toMatchObject({ replayable: false, snapshot: { kind: "raw", diagnostic: { code: "INVALID_RUN_DOCUMENT" } } });
    const old = '{"schemaVersion":"0.16","id":"old"}';
    expect(storedRunExport(old, "0.17")).toMatchObject({ replayable: false, schemaVersion: "0.16", snapshot: { kind: "raw", utf8: old, diagnostic: { code: "UNSUPPORTED_RUN_SCHEMA" } } });
  });

  it.each(["run_references", "run_transition", "position_stats"] satisfies readonly DeletionEffectGroup[])(
    "rolls a per-run deletion back after the %s effect group",
    (failedGroup) => {
      let armed = false;
      const storage = new SQLiteRunStorage(":memory:", {
        now: () => "2026-08-23T00:00:00.000Z",
        onMigration: () => {},
        failDeletionAfterEffectGroup: (group) => { if (armed && group === failedGroup) throw new Error(`injected:${group}`); },
      });
      storage.createLearner({ id: "rollback-owner", handle: "rollback-owner", passwordHash: "!", createdAt: "2026-08-23T00:00:00.000Z" });
      const run = createRun({ id: "rollback-run", packId: "rollback-pack", packDigest: `sha256:${"9".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed: 9, createdAt: "2026-08-23T00:00:00.000Z", policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
      storage.create(run, { writerId: "rollback-writer", learnerId: "rollback-owner" }, "Rollback run");
      const before = serializeAccountBundle(storage.accountBundle("rollback-owner"));
      const cachedBefore = storage.read(run.id);
      const preview = storage.deletionPreview("rollback-owner", { kind: "run", runId: run.id }, "2026-08-23T00:00:00.000Z");
      armed = true;
      expect(() => storage.deleteOwnedRun("rollback-owner", run.id, "2026-08-23T00:00:00.000Z", preview.digest)).toThrow(/Could not delete run/u);
      expect(serializeAccountBundle(storage.accountBundle("rollback-owner"))).toEqual(before);
      expect(storage.read(run.id)).toEqual(cachedBefore);
      expect(storage.foreignKeyViolationCount()).toBe(0);
      storage.close();
    },
  );

  it.each(["owned_runs", "published_artifacts", "repertoires", "classrooms", "retained_identity_scrub", "learner_state"] satisfies readonly DeletionEffectGroup[])(
    "rolls account deletion back after the %s effect group",
    (failedGroup) => {
      let armed = false;
      const storage = new SQLiteRunStorage(":memory:", {
        now: () => "2026-08-23T00:00:00.000Z",
        onMigration: () => {},
        failDeletionAfterEffectGroup: (group) => { if (armed && group === failedGroup) throw new Error(`injected:${group}`); },
      });
      storage.createLearner({ id: "rollback-account", handle: "rollback-account", passwordHash: "!", createdAt: "2026-08-23T00:00:00.000Z" });
      const run = createRun({ id: "rollback-account-run", packId: "rollback-pack", packDigest: `sha256:${"a".repeat(64)}`, startFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", seed: 10, createdAt: "2026-08-23T00:00:00.000Z", policyConfig: { seedMode: "fixed", locus: { executedAt: "server", engineIds: [], modelIds: [] } } });
      storage.create(run, { writerId: "rollback-account-writer", learnerId: "rollback-account" }, "Rollback account run");
      const before = serializeAccountBundle(storage.accountBundle("rollback-account"));
      const cachedBefore = storage.read(run.id);
      const preview = storage.deletionPreview("rollback-account", { kind: "account" }, "2026-08-23T00:00:00.000Z");
      armed = true;
      expect(() => storage.deleteLearner("rollback-account", "2026-08-23T00:00:00.000Z", preview.digest)).toThrow(/Could not delete learner/u);
      expect(serializeAccountBundle(storage.accountBundle("rollback-account"))).toEqual(before);
      expect(storage.read(run.id)).toEqual(cachedBefore);
      expect(storage.foreignKeyViolationCount()).toBe(0);
      storage.close();
    },
  );
});
