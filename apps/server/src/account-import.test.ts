import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { commitMove, createRun, type DrillRun } from "@chess-tabiya/runtime";
import { afterEach, describe, expect, it } from "vitest";

import {
  ACCOUNT_BUNDLE_VERSION,
  ACCOUNT_DATA_INVENTORY,
  accountInventory,
  serializeAccountBundle,
  type AccountBundleV1,
} from "./account-data.js";
import {
  ACCOUNT_BUNDLE_READABLE_VERSIONS,
  ACCOUNT_IMPORT_MAX_BYTES,
  planAccountRestore,
  readPortableAccountBundle,
  restoredCounts,
} from "./account-import.js";
import { IdentityService } from "./identity.js";
import { projectAttempts } from "./progress.js";
import { createRestHandler } from "./rest.js";
import { RunService } from "./service.js";
import { SQLiteRunStorage, type LeaseHolder } from "./storage.js";

const AT = "2026-09-24T00:00:00.000Z";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const PASSWORD = "correct horse battery staple";
const policyConfig = { seedMode: "fixed" as const, locus: { executedAt: "server" as const, engineIds: [], modelIds: [] } };
const ANNOTATED = `[Event "Club"]\n[White "Ann"]\n[Black "Ben"]\n[Result "*"]\n\n{coach says} 1. e4 {[%eval 0.2]} e5?! $6 2. Nf3 *`;

const directories: string[] = [];
const stores: SQLiteRunStorage[] = [];
afterEach(() => {
  for (const store of stores.splice(0)) store.close();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function installation() {
  const directory = mkdtempSync(join(tmpdir(), "account-import-"));
  directories.push(directory);
  const file = join(directory, "tabiya.sqlite");
  const storage = new SQLiteRunStorage(file, { onMigration: () => {}, now: () => AT });
  stores.push(storage);
  return { file, storage };
}

function played(id: string, seed: number): DrillRun {
  return commitMove(createRun({ id, packId: "pack-a", packDigest: `sha256:${"4".repeat(64)}`, startFen: START, seed, createdAt: AT, policyConfig }), "e2e4", { at: AT }).run;
}

/** One learner with every restorable class populated, plus classes import must decline. */
async function seed(storage: SQLiteRunStorage, file: string, learnerId: string, handle: string, prefix: string) {
  storage.createLearner({ id: learnerId, handle, passwordHash: "!", createdAt: AT });
  const lease: LeaseHolder = { writerId: `${prefix}-writer`, learnerId };
  const run = played(`${prefix}-run`, 1);
  storage.create(run, lease, `${handle}'s run`);
  const projected = projectAttempts({ run, learnerId });
  storage.upsertAttempts(projected.attempts, projected.conceptTags);
  const child = played(`${prefix}-child`, 2);
  storage.createDerivedRun!(child, lease, "Flipped", { derivedRunId: child.id, sourceRunId: run.id, sourceBranchId: run.branches[0]!.id, sourceNodeId: run.nodes[0]!.id, kind: "flip_sides", createdAt: AT });
  const service = new RunService(storage);
  await service.importGame({ id: `${prefix}-imported`, side: "white", opponentPolicy: { mode: "human_common" }, policyConfig, seed: 3, source: { kind: "pgn", pgn: ANNOTATED }, createdAt: AT }, lease);
  storage.replaceRunMarks({ runId: run.id, learnerId, scope: "position", scopeKey: run.nodes[0]!.transposeKey, shapes: [{ brush: "green", orig: "e2", dest: "e4" }], relayed: false, at: AT });
  storage.createSchedule({ id: `${prefix}-schedule`, learnerId, rootKey: `${prefix}-root`, sessionKind: "pack", packId: "pack-a", rootTransposeKey: run.nodes[0]!.transposeKey, kind: "varied", variant: null, origin: "learner", dueAt: AT, createdAt: AT, sourceRunId: run.id, sourceNodeId: run.nodes[0]!.id });
  storage.createRepertoire!({ id: `${prefix}-repertoire`, ownerLearnerId: learnerId, name: "Main", side: "white", rootFen: START, targetElo: 1600, coverageDenominator: 100, sourceKind: "pgn_paste", sourceUrl: null, originalPgn: "1. e4", licenceNote: "Learner supplied", digest: `sha256:${"1".repeat(64)}`, createdAt: AT, updatedAt: AT }, [{ repertoireId: `${prefix}-repertoire`, positionKey: run.nodes[0]!.transposeKey, moveUci: "e2e4", moveSan: "e4", representativeFen: START, rank: 0, origin: "imported", createdAt: AT }]);
  storage.saveRepertoireScan!({ repertoireId: `${prefix}-repertoire`, scannedAt: AT, repertoireDigest: `sha256:${"1".repeat(64)}`, population: [{ positionKey: run.nodes[0]!.transposeKey, mass: 1 }], gaps: [], alternateGaps: [], unknown: [], uncoveredMass: 0.25, truncated: false, sourceFailures: 0, queriesUsed: 1, unreachedKeys: 0 });
  storage.createPackDraft({ id: `${prefix}-pack-draft`, packId: `${prefix}-pack`, ownerLearnerId: learnerId, document: { id: `${prefix}-pack`, nested: { exact: true } }, digest: `sha256:${"b".repeat(64)}`, state: "draft", seedKind: "blank", seedRef: null, createdAt: AT, updatedAt: AT });
  storage.storePlaytestDocument(`sha256:${createHash("sha256").update(prefix).digest("hex")}`, `${prefix}-pack-draft`, { id: "playtest" }, AT);
  storage.createShapeDraft({ id: `${prefix}-shape-draft`, shapeId: `${prefix}-shape`, ownerLearnerId: learnerId, document: { id: `${prefix}-shape` }, digest: `sha256:${"d".repeat(64)}`, state: "draft", createdAt: AT, updatedAt: AT });
  const rated = played(`${prefix}-rated`, 4);
  storage.createRatedRun(rated, lease, "Rated", { runId: rated.id, learnerId, calibrationId: "fixture-calibration", opponentBand: 1500, opponentRating: 1500, opponentRd: 50, learnerSide: "white", startPieceCount: 32, engineIdentityDigest: "fixture-engine", state: "open", startedAt: AT });
  // Concept rows: one registered occurrence and one quarantined legacy key on the played attempt.
  const raw = new DatabaseSync(file);
  raw.prepare(`INSERT INTO attempt_concepts (run_id,branch_id,pack_id,pack_digest,concept_key,concept_id,registry_schema_version,registry_digest,label)
    VALUES (?,?,?,?,?,?,1,?,?)`).run(run.id, run.branches[0]!.id, "pack-a", `sha256:${"4".repeat(64)}`, "concept:open-file@1", "open-file", `sha256:${"9".repeat(64)}`, "Open file");
  raw.prepare(`INSERT INTO attempt_concept_legacy (run_id,branch_id,pack_id,raw_key,label,reason) VALUES (?,?,?,?,?,?)`)
    .run(run.id, run.branches[0]!.id, "pack-a", "old:thing", "Old thing", "unknown_concept");
  raw.close();
  return { run, child, rated };
}

function bytesOf(bundle: AccountBundleV1): unknown {
  return JSON.parse(new TextDecoder().decode(serializeAccountBundle(bundle).bytes));
}

/** The restorable projection: everything import promises to carry, minus the account's own name. */
function restorable(bundle: AccountBundleV1) {
  const ratingTables = new Set(["learner_ratings", "rated_games", "rating_periods", "cohort_standings", "standing_members", "learner_marks"]);
  return {
    runs: bundle.ownedRuns.value
      .map((run) => ({ id: run.id, title: run.title, snapshot: run.snapshot, importedGame: run.importedGame, derivations: run.derivations })),
    progress: bundle.progress.value,
    marks: bundle.marks.value,
    repertoires: bundle.repertoires.value,
    drafts: bundle.drafts.value,
    ratings: bundle.behavioralProfiles.value.filter((item) => ratingTables.has(item.table)).length,
  };
}

describe("account import: portability versioning", () => {
  it("reads the current format through its identity upgrader and refuses a future one with the readable set", () => {
    expect(ACCOUNT_BUNDLE_READABLE_VERSIONS).toEqual([ACCOUNT_BUNDLE_VERSION]);
    const { storage } = installation();
    storage.createLearner({ id: "v", handle: "v", passwordHash: "!", createdAt: AT });
    const current = bytesOf(storage.accountBundle("v")) as Record<string, unknown>;
    expect(readPortableAccountBundle(current).formatVersion).toBe(1);
    expect(() => readPortableAccountBundle({ ...current, formatVersion: 2 })).toThrow(expect.objectContaining({ code: "ACCOUNT_IMPORT_UNSUPPORTED_VERSION", details: { formatVersion: 2, readableVersions: [1] } }));
    for (const broken of [null, [], "text", { ...current, format: "other" }, { ...current, formatVersion: "1" }, { ...current, formatVersion: 0 }, { ...current, extra: true }]) {
      expect(() => readPortableAccountBundle(broken)).toThrow(expect.objectContaining({ code: "ACCOUNT_IMPORT_INVALID" }));
    }
    expect(ACCOUNT_IMPORT_MAX_BYTES).toBe(32 * 1024 * 1024);
  });
});

describe("account import: round trip", () => {
  it("restores every private class into a fresh installation and re-exports it unchanged", async () => {
    const a = installation();
    await seed(a.storage, a.file, "alice-id", "alice", "a");
    const exported = a.storage.accountBundle("alice-id");
    expect(JSON.stringify(bytesOf(exported))).toContain('"original_pgn":"1. e4"');
    const bundle = readPortableAccountBundle(bytesOf(exported));
    const plan = planAccountRestore(bundle);
    expect(Object.fromEntries(restoredCounts(plan).map((item) => [item.table, item.count]))).toEqual({
      drill_runs: 4, imported_games: 1, run_derivations: 1, run_marks: 1, attempts: 1, attempt_concepts: 1,
      attempt_concept_legacy: 1, schedules: 2, repertoires: 1, repertoire_moves: 1, repertoire_scans: 1,
      pack_drafts: 1, playtest_documents: 1, shape_drafts: 1,
    });
    expect(plan.notRestored.map((item) => item.kind)).toEqual(["rating_record"]);

    const b = installation();
    b.storage.createLearner({ id: "alice-b-id", handle: "alice-b", passwordHash: "!", createdAt: AT });
    expect(b.storage.restoreAccountBundle("alice-b-id", plan, { commit: false, at: AT })).toEqual([]);
    expect(b.storage.restoreAccountBundle("alice-b-id", plan, { commit: true, at: AT })).toEqual([]);
    const restored = b.storage.accountBundle("alice-b-id");
    const expected = restorable(exported);
    expect(restorable(restored)).toEqual({ ...expected, ratings: 0 });
    expect(b.storage.foreignKeyViolationCount()).toBe(0);
    // Every restored run is owned and hosted by the importer, and queued for longitudinal re-derivation.
    for (const run of restored.ownedRuns.value) {
      expect(run.grants.map((grant) => grant.granteeHandle)).toEqual(["alice-b"]);
      expect(b.storage.read(run.id)?.activeWriterLearnerId).toBe("alice-b-id");
    }
    const jobs = restored.behavioralProfiles.value.filter((item) => item.table === "learner_observation_jobs").map((item) => item.record.run_id).sort();
    expect(jobs).toEqual(restored.ownedRuns.value.map((run) => run.id).sort());

    // A second installation fed the re-export reaches the same fixed point.
    const c = installation();
    c.storage.createLearner({ id: "alice-c-id", handle: "alice-c", passwordHash: "!", createdAt: AT });
    c.storage.restoreAccountBundle("alice-c-id", planAccountRestore(readPortableAccountBundle(bytesOf(restored))), { commit: true, at: AT });
    expect(restorable(c.storage.accountBundle("alice-c-id"))).toEqual(restorable(restored));
  });

  it("refuses a colliding import atomically and names every collision", async () => {
    const a = installation();
    await seed(a.storage, a.file, "alice-id", "alice", "a");
    const before = serializeAccountBundle(a.storage.accountBundle("alice-id")).digest;
    a.storage.createLearner({ id: "mallory-id", handle: "mallory", passwordHash: "!", createdAt: AT });
    const plan = planAccountRestore(readPortableAccountBundle(bytesOf(a.storage.accountBundle("alice-id"))));
    const conflicts = a.storage.restoreAccountBundle("mallory-id", plan, { commit: false, at: AT });
    expect(conflicts).toEqual(expect.arrayContaining(["run:a-run", "run:a-imported", "repertoire:a-repertoire", "pack-draft:a-pack-draft", "shape-draft:a-shape-draft", "schedule:a-schedule"]));
    expect(() => a.storage.restoreAccountBundle("mallory-id", plan, { commit: true, at: AT }))
      .toThrow(expect.objectContaining({ code: "ACCOUNT_IMPORT_CONFLICT" }));
    // Nothing moved: alice's record is byte-identical and mallory still owns nothing.
    expect(serializeAccountBundle(a.storage.accountBundle("alice-id")).digest).toBe(before);
    const mallory = a.storage.accountBundle("mallory-id");
    expect(mallory.ownedRuns.value).toHaveLength(0);
    expect(mallory.progress.value).toHaveLength(0);
  });

  it("strips third-party annotations from an imported game restored from an older file ([[D959]])", async () => {
    const a = installation();
    await seed(a.storage, a.file, "alice-id", "alice", "a");
    const raw = new DatabaseSync(a.file);
    raw.prepare("UPDATE imported_games SET pgn=? WHERE run_id='a-imported'").run(ANNOTATED);
    raw.close();
    const legacy = bytesOf(a.storage.accountBundle("alice-id"));
    expect(JSON.stringify(legacy)).toContain("coach says");
    const b = installation();
    b.storage.createLearner({ id: "b-id", handle: "b", passwordHash: "!", createdAt: AT });
    b.storage.restoreAccountBundle("b-id", planAccountRestore(readPortableAccountBundle(legacy)), { commit: true, at: AT });
    const record = b.storage.importedGame("a-imported")!;
    expect(record.pgn).not.toMatch(/coach says|%eval|\$6|\?!/);
    expect(record.pgn).toMatch(/1\. e4 e5 2\. Nf3/);
  });
});

describe("account data: multi-user isolation", () => {
  it("keeps two learners' exports, inventories, deletion and import disjoint", async () => {
    const { storage, file } = installation();
    await seed(storage, file, "alice-id", "alice", "a");
    await seed(storage, file, "bob-id", "bob", "b");
    const alice = storage.accountBundle("alice-id");
    const bob = storage.accountBundle("bob-id");
    const aliceText = JSON.stringify(bytesOf(alice));
    const bobText = JSON.stringify(bytesOf(bob));
    for (const bobObject of ["b-run", "b-child", "b-imported", "b-repertoire", "b-pack-draft", "b-shape-draft", "b-schedule", "bob-id", "\"bob\""]) {
      expect(aliceText, bobObject).not.toContain(bobObject);
    }
    for (const aliceObject of ["a-run", "a-child", "a-imported", "a-repertoire", "a-pack-draft", "a-shape-draft", "a-schedule", "alice-id", "\"alice\""]) {
      expect(bobText, aliceObject).not.toContain(aliceObject);
    }
    // Inventories count only their own learner's rows.
    const count = (bundle: AccountBundleV1, dataClass: string) => accountInventory(bundle).classes.find((item) => item.dataClass === dataClass)!.count;
    expect(count(alice, "owned_runs")).toBe(count(bob, "owned_runs"));
    expect(count(alice, "progress")).toBe(count(bob, "progress"));

    // Bob cannot take alice's objects by importing her file into his account.
    const plan = planAccountRestore(readPortableAccountBundle(bytesOf(alice)));
    expect(() => storage.restoreAccountBundle("bob-id", plan, { commit: true, at: AT })).toThrow(expect.objectContaining({ code: "ACCOUNT_IMPORT_CONFLICT" }));
    expect(storage.read("a-run")?.activeWriterLearnerId).toBe("alice-id");

    // Deleting alice leaves bob's record byte-identical.
    const bobBefore = serializeAccountBundle(bob).digest;
    const preview = storage.deletionPreview("alice-id", { kind: "account" }, AT);
    storage.deleteLearner("alice-id", AT, preview.digest);
    expect(serializeAccountBundle(storage.accountBundle("bob-id")).digest).toBe(bobBefore);
    expect(storage.foreignKeyViolationCount()).toBe(0);

    // After deletion alice's private objects are gone, so her file restores into a new account.
    storage.createLearner({ id: "alice-again-id", handle: "alice-again", passwordHash: "!", createdAt: AT });
    expect(storage.restoreAccountBundle("alice-again-id", plan, { commit: false, at: AT })).toEqual([]);
    storage.restoreAccountBundle("alice-again-id", plan, { commit: true, at: AT });
    expect(storage.read("a-run")?.activeWriterLearnerId).toBe("alice-again-id");
    expect(serializeAccountBundle(storage.accountBundle("bob-id")).digest).toBe(bobBefore);
  });
});

describe("account inventory", () => {
  it("names every non-installation data class exactly once and counts from the export projection", async () => {
    const { storage, file } = installation();
    await seed(storage, file, "alice-id", "alice", "a");
    const bundle = storage.accountBundle("alice-id");
    const inventory = accountInventory(bundle);
    const classes = [...new Set(ACCOUNT_DATA_INVENTORY.map((entry) => entry.dataClass).filter((name) => name !== "installation"))];
    expect(inventory.classes.map((item) => item.dataClass)).toEqual(classes);
    // apps/web/src/lib/account-data-panels.test.ts pins the same twelve names for the learner-facing copy.
    expect(classes).toEqual(["learner_identity", "security", "owned_runs", "run_access", "marks", "progress", "repertoires", "drafts", "publications", "live_social", "behavioral_profiles", "device_local_preferences"]);
    const store = (name: string) => inventory.classes.flatMap((item) => item.stores).find((item) => item.store === name)!;
    expect(store("drill_runs").count).toBe(bundle.ownedRuns.value.length);
    expect(store("attempts").count).toBe(1);
    expect(store("learner_sessions").count).toBeNull();
    expect(store("evidence_jobs").count).toBeNull();
    expect(store("browser_local").count).toBeNull();
    expect(store("rated_games").count).toBe(1);
  });
});

describe("account import over REST", () => {
  function cheapDerive(password: string, salt: Buffer): Promise<Buffer> {
    return Promise.resolve(createHash("sha256").update(salt).update(password).digest());
  }

  function setup() {
    const { storage } = installation();
    const identity = new IdentityService(storage, { cookieSecure: false, derive: cheapDerive });
    const handler = createRestHandler(new RunService(storage), undefined, undefined, identity);
    const call = (method: string, path: string, options: { readonly body?: unknown; readonly cookie?: string; readonly raw?: string } = {}) => handler(new Request(`http://tabiya.test${path}`, {
      method,
      headers: { ...(options.body === undefined && options.raw === undefined ? {} : { "content-type": "application/json" }), ...(options.cookie === undefined ? {} : { cookie: options.cookie }) },
      ...(options.raw !== undefined ? { body: options.raw } : options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    }));
    const register = async (handle: string) => {
      const response = await call("POST", "/auth/register", { body: { handle, password: PASSWORD } });
      expect(response.status).toBe(201);
      return response.headers.get("set-cookie")!.split(";", 1)[0]!;
    };
    return { storage, call, register };
  }

  it("previews without writing, commits only with the password, and bounds the upload", async () => {
    const source = installation();
    await seed(source.storage, source.file, "alice-id", "alice", "a");
    const bundle = bytesOf(source.storage.accountBundle("alice-id"));
    const { storage, call, register } = setup();
    expect((await call("POST", "/auth/import-preview", { body: { bundle } })).status).toBe(401);
    const cookie = await register("carol");
    const preview = await call("POST", "/auth/import-preview", { cookie, body: { bundle } });
    expect(preview.status).toBe(200);
    const previewed = (await preview.json() as { receipt: { mode: string; conflicts: string[]; restored: { table: string; count: number }[]; notRestored: { kind: string }[]; bundleDigest: string } }).receipt;
    expect(previewed).toMatchObject({ mode: "preview", conflicts: [] });
    expect(previewed.restored).toEqual(expect.arrayContaining([{ table: "drill_runs", count: 4 }]));
    expect(previewed.notRestored.map((item) => item.kind)).toEqual(["rating_record"]);
    expect(storage.read("a-run")).toBeUndefined();
    const inventoryBefore = await (await call("GET", "/auth/account-inventory", { cookie })).json() as { classes: { dataClass: string; count: number }[] };
    expect(inventoryBefore.classes.find((item) => item.dataClass === "owned_runs")!.count).toBe(0);

    expect((await call("POST", "/auth/import", { cookie, body: { bundle, password: "wrong password here" } })).status).toBe(401);
    expect(storage.read("a-run")).toBeUndefined();
    const committed = await call("POST", "/auth/import", { cookie, body: { bundle, password: PASSWORD } });
    expect(committed.status).toBe(201);
    expect((await committed.json() as { receipt: { mode: string; bundleDigest: string } }).receipt).toMatchObject({ mode: "committed", bundleDigest: previewed.bundleDigest });
    expect(storage.read("a-run")).toBeDefined();
    const inventoryAfter = await (await call("GET", "/auth/account-inventory", { cookie })).json() as { classes: { dataClass: string; count: number }[] };
    expect(inventoryAfter.classes.find((item) => item.dataClass === "owned_runs")!.count).toBeGreaterThan(0);

    const again = await call("POST", "/auth/import", { cookie, body: { bundle, password: PASSWORD } });
    expect(again.status).toBe(409);
    expect((await again.json() as { error: { code: string; conflicts: string[] } }).error).toMatchObject({ code: "ACCOUNT_IMPORT_CONFLICT", conflicts: expect.arrayContaining(["run:a-run"]) });

    const future = await call("POST", "/auth/import-preview", { cookie, body: { bundle: { ...(bundle as object), formatVersion: 9 } } });
    expect(future.status).toBe(422);
    expect((await future.json() as { error: { code: string; readableVersions: number[] } }).error).toMatchObject({ code: "ACCOUNT_IMPORT_UNSUPPORTED_VERSION", readableVersions: [1] });

    const oversized = await call("POST", "/auth/import-preview", { cookie, raw: `{"bundle":"${"x".repeat(ACCOUNT_IMPORT_MAX_BYTES)}"}` });
    expect(oversized.status).toBe(413);
    expect((await oversized.json() as { error: { code: string } }).error.code).toBe("ACCOUNT_IMPORT_TOO_LARGE");
    expect((await call("POST", "/auth/import-preview", { cookie, body: { bundle, extra: 1 } })).status).toBe(400);
  });

  it("sends an exact content length with the export so the client can show progress", async () => {
    const { call, register } = setup();
    const cookie = await register("dora");
    const response = await call("POST", "/auth/export", { cookie, body: { password: PASSWORD } });
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Number(response.headers.get("content-length"))).toBe(bytes.byteLength);
  });
});
