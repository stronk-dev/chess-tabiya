// rfc/storage-backup-recovery.md — backup bundles, verification, restore, rollback, migration-safe
// startup and the storage lock, against real file databases. Every refusal/failure fixture is
// paired with a passing control so each check is able to fail independently.
import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { learner, play, positionRun } from "./longitudinal-test-fixtures.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";
import {
  abandonedReservations,
  backupOperation,
  canonicalJson,
  compatibilityOf,
  computeBackupId,
  expectedApplicationTables,
  generateStorageOperationId,
  inventoryDigest,
  inspectDatabase,
  parseApplicationRevision,
  parseBackupId,
  parseManifest,
  parseStorageOperationId,
  prepareStartOperation,
  ReceiptClock,
  receiptExitCode,
  releaseRecoveryEligible,
  resolveStoragePaths,
  restoreOperation,
  rollbackOperation,
  STORAGE_COMPATIBILITY,
  StorageAdminError,
  StorageLock,
  verifyOperation,
  errorReceipt,
  type StorageAdminReceiptV1,
  type StorageBackupManifestV1,
  type StoragePaths,
} from "./storage-admin.js";
import { sha256File, SimulatedCrash } from "./storage-replacement.js";

const REVISION = parseApplicationRevision("0123456789abcdef0123456789abcdef01234567");
const directories: string[] = [];
const locks: StorageLock[] = [];
afterEach(() => {
  for (const lock of locks.splice(0)) lock.release();
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function temp(): string {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-storage-admin-"));
  directories.push(directory);
  return directory;
}

const migrate = (path: string) => { new SQLiteRunStorage(path, { onMigration: () => {} }).close(); };

interface Setup {
  readonly directory: string;
  readonly paths: StoragePaths;
  readonly lock: StorageLock;
  readonly context: Parameters<typeof backupOperation>[0];
}

const suiteDirectories: string[] = [];
const suiteLocks: StorageLock[] = [];
afterAll(() => {
  for (const lock of suiteLocks.splice(0)) lock.release();
  for (const directory of suiteDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function setup(options: { readonly migrate?: (path: string) => void; readonly fault?: (point: string) => void; readonly suite?: boolean } = {}): Setup {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-storage-admin-"));
  (options.suite === true ? suiteDirectories : directories).push(directory);
  const paths = resolveStoragePaths({ database: join(directory, "data", "chess-tabiya.sqlite"), backupRoot: join(directory, "backups") });
  const lock = StorageLock.acquire(paths);
  (options.suite === true ? suiteLocks : locks).push(lock);
  return {
    directory,
    paths,
    lock,
    context: { lock, paths, operationId: generateStorageOperationId(), applicationRevision: REVISION, migrate: options.migrate ?? migrate, clock: new ReceiptClock(), ...(options.fault === undefined ? {} : { fault: options.fault }) },
  };
}

function fresh(context: Setup["context"]): Setup["context"] {
  return { ...context, operationId: generateStorageOperationId(), clock: new ReceiptClock() };
}

/** A current-version database with representative identities: learners, a run, a session. */
function seedCurrent(path: string): void {
  mkdirSync(join(path, ".."), { recursive: true });
  const storage = new SQLiteRunStorage(path, { onMigration: () => {} });
  const owner = learner(storage, "owner");
  storage.create(play(positionRun("run-1"), "e2e4"), owner);
  learner(storage, "second");
  storage.close();
}

async function expectAdminError(promise: Promise<unknown> | (() => unknown), code: string): Promise<StorageAdminError> {
  let caught: unknown;
  try {
    await (typeof promise === "function" ? promise() : promise);
  } catch (error) {
    caught = error;
  }
  expect(caught, `expected ${code}`).toBeInstanceOf(StorageAdminError);
  expect((caught as StorageAdminError).code).toBe(code);
  return caught as StorageAdminError;
}

function succeeded(value: StorageAdminReceiptV1): asserts value is Extract<StorageAdminReceiptV1, { result: "succeeded" }> {
  expect(value.result, JSON.stringify(value)).toBe("succeeded");
}

async function backup(state: Setup): Promise<string> {
  const value = await backupOperation(fresh(state.context));
  succeeded(value);
  if (value.operation !== "backup") throw new Error("not a backup");
  return join(state.paths.backupRoot!, value.backupId);
}

const verify = (bundle: string) => verifyOperation({ operationId: generateStorageOperationId(), applicationRevision: REVISION, clock: new ReceiptClock() }, bundle);

let currentTables: readonly string[];
beforeAll(() => {
  currentTables = expectedApplicationTables(STORAGE_VERSION);
});

describe("closed identities (§2, §9)", () => {
  it("parses backup ids only as real millisecond UTC instants with a 12-hex digest", () => {
    expect(parseBackupId("20260924T101112.345Z-0123456789ab")).toBe("20260924T101112.345Z-0123456789ab");
    for (const bad of ["20260230T101112.345Z-0123456789ab", "20260924T101112Z-0123456789ab", "20260924T101112.345Z-0123456789AB", "../20260924T101112.345Z-0123456789ab", "20260924T101112.345Z-0123456789ab.partial", "20260924T241112.345Z-0123456789ab"]) {
      expect(() => parseBackupId(bad), bad).toThrow();
    }
  });

  it("accepts only immutable source revisions and marks development revisions ineligible", () => {
    expect(releaseRecoveryEligible(REVISION)).toBe(true);
    expect(releaseRecoveryEligible(parseApplicationRevision("dev+dirty"))).toBe(false);
    for (const bad of ["0.0.0", "v1.0.0", "main", "0123456789ABCDEF0123456789abcdef01234567", "0123456789abcdef", "dev+main"]) {
      expect(() => parseApplicationRevision(bad), bad).toThrow();
    }
  });

  it("generates and parses only canonical RFC-4122 v4 operation ids", () => {
    const generated = generateStorageOperationId();
    expect(parseStorageOperationId(generated)).toBe(generated);
    for (const bad of ["6ba7b810-9dad-11d1-80b4-00c04fd430c8", "00000000-0000-0000-0000-000000000000", "0F8FAD5B-D9CB-469F-A165-70867728950E", "0f8fad5b-d9cb-469f-c165-70867728950e", "../x"]) {
      expect(() => parseStorageOperationId(bad), bad).toThrow();
    }
  });

  it("derives compatibility from the one migration chain for any head", () => {
    expect(STORAGE_COMPATIBILITY.creates).toBe(STORAGE_VERSION);
    expect(STORAGE_COMPATIBILITY.upgradesFrom).toEqual(Array.from({ length: STORAGE_VERSION - 1 }, (_value, index) => index + 1));
    expect([compatibilityOf(STORAGE_VERSION), compatibilityOf(1), compatibilityOf(STORAGE_VERSION + 1), compatibilityOf(0)]).toEqual(["current", "upgradeable", "newer_than_application", "unsupported_old"]);
  });

  it("maps receipts to the exact exit codes", () => {
    const base = { operationId: generateStorageOperationId(), applicationRevision: REVISION, clock: new ReceiptClock() };
    expect(receiptExitCode(errorReceipt(base, "backup", new StorageAdminError("refused", "NO_DATABASE", "x")))).toBe(2);
    expect(receiptExitCode(errorReceipt(base, "verify", new StorageAdminError("failed", "DIGEST_MISMATCH", "x", "invalid")))).toBe(3);
    expect(receiptExitCode(errorReceipt(base, "verify", new Error("boom")))).toBe(4);
  });
});

describe("paths and the storage lock (§1)", () => {
  it("refuses memory, relative, same-directory and nested backup roots", async () => {
    const directory = temp();
    await expectAdminError(() => resolveStoragePaths({ database: ":memory:" }), "PATH_REFUSED");
    await expectAdminError(() => resolveStoragePaths({ database: "data/x.sqlite" }), "PATH_REFUSED");
    await expectAdminError(() => resolveStoragePaths({ database: join(directory, "x.sqlite"), backupRoot: directory }), "PATH_REFUSED");
    await expectAdminError(() => resolveStoragePaths({ database: join(directory, "b", "x.sqlite"), backupRoot: join(directory, "b", "..") }), "PATH_REFUSED");
    await expectAdminError(() => resolveStoragePaths({ database: join(directory, "x.sqlite"), backupRoot: "backups" }), "PATH_REFUSED");
    mkdirSync(join(directory, "real"));
    symlinkSync(join(directory, "real"), join(directory, "link"));
    await expectAdminError(() => resolveStoragePaths({ database: join(directory, "data", "x.sqlite"), backupRoot: join(directory, "link") }), "PATH_REFUSED");
    expect(resolveStoragePaths({ database: join(directory, "data", "x.sqlite"), backupRoot: join(directory, "data", "backups") }).backupRoot).toBe(join(directory, "data", "backups"));
  });

  it("excludes a second holder in-process and across processes; process death releases authority", async () => {
    const state = setup();
    await expectAdminError(() => StorageLock.acquire(state.paths), "MAINTENANCE_LOCKED");
    state.lock.release();
    const child = spawn(process.execPath, ["--input-type=module", "-e", `
      import { DatabaseSync } from "node:sqlite";
      const db = new DatabaseSync(${JSON.stringify(state.paths.lock)});
      db.exec("PRAGMA busy_timeout = 0"); db.exec("BEGIN EXCLUSIVE");
      process.stdout.write("held\\n"); setInterval(() => {}, 1000);
    `], { stdio: ["ignore", "pipe", "inherit"] });
    await new Promise<void>((resolve) => child.stdout.once("data", () => resolve()));
    await expectAdminError(() => StorageLock.acquire(state.paths), "MAINTENANCE_LOCKED");
    child.kill("SIGKILL");
    await new Promise((resolve) => child.once("exit", resolve));
    expect(existsSync(state.paths.lock)).toBe(true);
    const reacquired = StorageLock.acquire(state.paths);
    locks.push(reacquired);
    expect(reacquired.held).toBe(true);
  });

  it("refuses an operation that does not hold this database's lock", async () => {
    const state = setup();
    seedCurrent(state.paths.database);
    state.lock.release();
    await expectAdminError(backupOperation(fresh(state.context)), "LOCK_AUTHORITY_MISSING");
  });
});

describe("backup and verification (§§2–4, criteria 1–4, 18)", () => {
  it("backs up committed WAL-only transactions through the online API, not a main-file copy", async () => {
    const state = setup();
    seedCurrent(state.paths.database);
    // A writer commits into the WAL and dies without a checkpoint.
    const writer = spawn(process.execPath, ["--input-type=module", "-e", `
      import { DatabaseSync } from "node:sqlite";
      const db = new DatabaseSync(${JSON.stringify(state.paths.database)});
      db.exec("PRAGMA journal_mode = WAL"); db.exec("PRAGMA wal_autocheckpoint = 0");
      db.exec("INSERT INTO learners (id, handle, password_hash, created_at) VALUES ('wal-only', 'wal-only', '!', '2026-09-24T00:00:00.000Z')");
      process.kill(process.pid, "SIGKILL");
    `], { stdio: "inherit" });
    await new Promise((resolve) => writer.once("exit", resolve));
    expect(statSync(`${state.paths.database}-wal`).size).toBeGreaterThan(0);
    // Control: the raw main file alone does not contain the committed row.
    const rawCopy = join(state.directory, "raw-copy.sqlite");
    copyFileSync(state.paths.database, rawCopy);
    const raw = new DatabaseSync(rawCopy);
    expect(raw.prepare("SELECT count(*) AS n FROM learners WHERE id = 'wal-only'").get()).toEqual({ n: 0 });
    raw.close();

    const bundle = await backup(state);
    expect(readdirSync(bundle).sort()).toEqual(["database.sqlite", "manifest.json"]);
    expect(existsSync(`${bundle}/database.sqlite-wal`)).toBe(false);
    const manifest = parseManifest(readFileSync(join(bundle, "manifest.json"), "utf8"));
    expect(manifest).toMatchObject({ reason: "manual", sourceStorageVersion: STORAGE_VERSION, applicationRevision: REVISION, inventory: { applicationTables: currentTables } });
    expect((statSync(bundle).mode & 0o077)).toBe(0);
    // Source loss: the standalone snapshot restores every sentinel row.
    for (const suffix of ["", "-wal", "-shm"]) rmSync(`${state.paths.database}${suffix}`, { force: true });
    const restored = await restoreOperation(fresh(state.context), { bundlePath: bundle });
    succeeded(restored);
    expect(restored).toMatchObject({ operation: "restore", migration: "not_required", preRestoreBackupId: null, checks: ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention"] });
    const database = new DatabaseSync(state.paths.database, { readOnly: true });
    expect((database.prepare("SELECT id FROM learners ORDER BY id").all() as { id: string }[]).map((row) => row.id)).toEqual(["owner", "second", "wal-only"]);
    expect(database.prepare("SELECT id FROM drill_runs").all()).toEqual([{ id: "run-1" }]);
    database.close();
  });

  it("emits the exact backup and verify receipts and refuses an absent database", async () => {
    const empty = setup();
    await expectAdminError(backupOperation(fresh(empty.context)), "NO_DATABASE");
    const state = setup();
    seedCurrent(state.paths.database);
    const value = await backupOperation(fresh(state.context));
    succeeded(value);
    expect(value).toMatchObject({ protocol: "tabiya-storage-admin-receipt", protocolVersion: 1, operation: "backup", reason: "manual", checks: ["digest", "integrity", "foreign_keys", "inventory", "compatibility"] });
    expect(canonicalJson(value)).not.toContain(state.directory);
    const checked = verify(join(state.paths.backupRoot!, (value as { backupId: string }).backupId));
    expect(checked).toMatchObject({ operation: "verify", result: "succeeded", compatibility: "current", currentStorageVersion: STORAGE_VERSION, checks: ["digest", "integrity", "foreign_keys", "inventory", "compatibility"] });
  });

  describe("verifier negatives — each with its exact code", () => {
    let bundle: string;
    let state: Setup;
    const copyBundle = (name?: string): string => {
      const target = join(state.directory, "copies", name ?? readdirSync(join(bundle, "..")).find((entry) => entry === bundle.split("/").at(-1))!);
      mkdirSync(target, { recursive: true });
      for (const file of readdirSync(bundle)) copyFileSync(join(bundle, file), join(target, file));
      return target;
    };
    /** Re-issues a self-consistent bundle around modified database bytes (an external producer). */
    const reissue = (database: string, patch: Partial<StorageBackupManifestV1> = {}): string => {
      const manifest = parseManifest(readFileSync(join(bundle, "manifest.json"), "utf8"));
      const { backupId: _old, ...rest } = manifest;
      const withoutId = { ...rest, database: { file: "database.sqlite" as const, bytes: statSync(database).size, sha256: sha256File(database) }, ...patch };
      const id = computeBackupId(withoutId as Omit<StorageBackupManifestV1, "backupId">);
      const target = join(state.directory, "reissued", id);
      mkdirSync(target, { recursive: true });
      copyFileSync(database, join(target, "database.sqlite"));
      writeFileSync(join(target, "manifest.json"), `${canonicalJson({ ...withoutId, backupId: id })}\n`);
      return target;
    };

    beforeAll(async () => {
      state = setup({ suite: true });
      seedCurrent(state.paths.database);
      bundle = await backup(state);
    });

    it("accepts the canonical bundle (control)", () => {
      expect(verify(bundle).result).toBe("succeeded");
      expect(verify(copyBundle()).result).toBe("succeeded");
    });

    it("changed database byte → DIGEST_MISMATCH", async () => {
      const copy = copyBundle();
      const bytes = readFileSync(join(copy, "database.sqlite"));
      bytes[bytes.length - 1] = (bytes.at(-1)! + 1) % 256;
      writeFileSync(join(copy, "database.sqlite"), bytes);
      await expectAdminError(() => verify(copy), "DIGEST_MISMATCH");
    });

    it("changed manifest digest, unknown key, non-canonical bytes → BUNDLE_INVALID", async () => {
      const text = readFileSync(join(bundle, "manifest.json"), "utf8");
      const digestChanged = copyBundle();
      writeFileSync(join(digestChanged, "manifest.json"), text.replace(/"sha256":"[0-9a-f]{6}/u, "\"sha256\":\"000000"));
      await expectAdminError(() => verify(digestChanged), "BUNDLE_INVALID");
      const unknown = copyBundle();
      writeFileSync(join(unknown, "manifest.json"), `${canonicalJson({ ...JSON.parse(text), extra: 1 })}\n`);
      await expectAdminError(() => verify(unknown), "BUNDLE_INVALID");
      const pretty = copyBundle();
      writeFileSync(join(pretty, "manifest.json"), `${JSON.stringify(JSON.parse(text), null, 2)}\n`);
      await expectAdminError(() => verify(pretty), "BUNDLE_INVALID");
    });

    it("extra file, symlink, .partial path and publishing marker → BUNDLE_INVALID", async () => {
      const extra = copyBundle();
      writeFileSync(join(extra, "notes.txt"), "x");
      await expectAdminError(() => verify(extra), "BUNDLE_INVALID");
      const linked = copyBundle();
      unlinkSync(join(linked, "database.sqlite"));
      symlinkSync(join(bundle, "database.sqlite"), join(linked, "database.sqlite"));
      await expectAdminError(() => verify(linked), "BUNDLE_INVALID");
      const partial = copyBundle(`${bundle.split("/").at(-1)}.partial`);
      await expectAdminError(() => verify(partial), "BUNDLE_INVALID");
      const marked = copyBundle();
      writeFileSync(join(marked, ".publishing"), "x\n");
      await expectAdminError(() => verify(marked), "BUNDLE_INVALID");
    });

    it("corrupt SQLite → SQLITE_INTEGRITY_FAILED; foreign-key violation → FOREIGN_KEY_VIOLATION (independent)", async () => {
      const corrupt = join(state.directory, "corrupt.sqlite");
      copyFileSync(join(bundle, "database.sqlite"), corrupt);
      const bytes = readFileSync(corrupt);
      const pageSize = bytes.readUInt16BE(16) || 65536;
      bytes.fill(0xa5, pageSize * 2 + 8, pageSize * 2 + 200);
      writeFileSync(corrupt, bytes);
      await expectAdminError(() => verify(reissue(corrupt)), "SQLITE_INTEGRITY_FAILED");

      const orphan = join(state.directory, "orphan.sqlite");
      copyFileSync(join(bundle, "database.sqlite"), orphan);
      const database = new DatabaseSync(orphan);
      database.exec("PRAGMA foreign_keys = OFF");
      database.exec("INSERT INTO learner_sessions (token_hash, learner_id, created_at, expires_at) VALUES ('t', 'ghost', 'x', 'y')");
      // integrity_check alone passes this database: the foreign-key check is independent.
      expect(database.prepare("PRAGMA integrity_check").all()).toEqual([{ integrity_check: "ok" }]);
      database.close();
      await expectAdminError(() => verify(reissue(orphan)), "FOREIGN_KEY_VIOLATION");
    });

    it("table-inventory mismatch → INVENTORY_MISMATCH; newer storage → refused newer_than_application", async () => {
      const extraTable = join(state.directory, "extra-table.sqlite");
      copyFileSync(join(bundle, "database.sqlite"), extraTable);
      const database = new DatabaseSync(extraTable);
      database.exec("CREATE TABLE smuggled (x)");
      database.close();
      const tables = [...currentTables, "smuggled"].sort();
      await expectAdminError(() => verify(reissue(extraTable)), "INVENTORY_MISMATCH");
      await expectAdminError(() => verify(reissue(extraTable, { inventory: { applicationTables: tables, inventorySha256: inventoryDigest(tables) } } as Partial<StorageBackupManifestV1>)), "INVENTORY_MISMATCH");

      const newer = join(state.directory, "newer.sqlite");
      copyFileSync(join(bundle, "database.sqlite"), newer);
      const future = new DatabaseSync(newer);
      future.exec(`PRAGMA user_version = ${STORAGE_VERSION + 1}`);
      future.close();
      const refused = await expectAdminError(() => verify(reissue(newer, { sourceStorageVersion: STORAGE_VERSION + 1, intendedStorageVersion: STORAGE_VERSION + 1 })), "STORAGE_NEWER_THAN_APPLICATION");
      expect(refused.result).toBe("refused");
      expect(refused.compatibility).toBe("newer_than_application");
    });
  });

  it("never exposes a valid partial bundle across publication crashes (criterion 18)", async () => {
    for (const [crashPoint, publiclyValid] of [
      ["publication reserved", false],
      ["publication before marker unlink", false],
      ["publication after marker unlink", true],
      ["publication after bundle fsync", true],
    ] as const) {
      const state = setup({ fault: (point) => { if (point === crashPoint) throw new SimulatedCrash(point); } });
      seedCurrent(state.paths.database);
      await expect(backupOperation(fresh(state.context))).rejects.toThrow(SimulatedCrash);
      const entries = readdirSync(state.paths.backupRoot!).filter((entry) => !entry.startsWith(".tabiya-work-"));
      expect(entries).toHaveLength(1);
      const bundle = join(state.paths.backupRoot!, entries[0]!);
      if (publiclyValid) {
        expect(verify(bundle).result).toBe("succeeded");
        expect(abandonedReservations(state.paths.backupRoot!)).toEqual([]);
      } else {
        await expectAdminError(() => verify(bundle), "BUNDLE_INVALID");
        expect(abandonedReservations(state.paths.backupRoot!)).toEqual(entries);
      }
      // In-process failure cleanup removes the owner-marked work directory (a real crash may leave
      // it; it is owner-marked, never a bundle, and ignored by every verifier).
      expect(readdirSync(state.paths.backupRoot!).some((entry) => entry.startsWith(".tabiya-work-"))).toBe(false);
    }
  });
});

describe("migration-safe startup (§6, criteria 5–7, 19)", () => {
  it("fresh and current compile exactly the one- and four-check pre-HTTP tuples", async () => {
    const state = setup();
    const freshReceipt = await prepareStartOperation(fresh(state.context));
    expect(freshReceipt).toMatchObject({ action: "fresh", sourceStorageVersion: null, backupId: null, checks: ["compatibility"] });
    seedCurrent(state.paths.database);
    const current = await prepareStartOperation(fresh(state.context));
    expect(current).toMatchObject({ action: "current", sourceStorageVersion: STORAGE_VERSION, checks: ["integrity", "foreign_keys", "inventory", "compatibility"] });
    expect(canonicalJson(current)).not.toContain("readiness");
  });

  it("refuses a newer database read-only: bytes, mtime, sidecars and schema unchanged", async () => {
    for (const journal of ["DELETE", "WAL"]) {
      const state = setup();
      mkdirSync(join(state.paths.database, ".."), { recursive: true });
      const database = new DatabaseSync(state.paths.database);
      database.exec(`PRAGMA journal_mode = ${journal}; CREATE TABLE future (x); PRAGMA user_version = ${STORAGE_VERSION + 1}`);
      database.close();
      const before = { digest: sha256File(state.paths.database), mtime: statSync(state.paths.database).mtimeMs, entries: readdirSync(join(state.paths.database, "..")).sort() };
      const refused = await expectAdminError(prepareStartOperation(fresh(state.context)), "STORAGE_NEWER_THAN_APPLICATION");
      expect(refused.compatibility).toBe("newer_than_application");
      expect({ digest: sha256File(state.paths.database), mtime: statSync(state.paths.database).mtimeMs, entries: readdirSync(join(state.paths.database, "..")).sort() }).toEqual(before);
      expect(existsSync(state.paths.backupRoot!)).toBe(false);
    }
  });

  it("refuses an unsupported v0 database with application tables", async () => {
    const state = setup();
    mkdirSync(join(state.paths.database, ".."), { recursive: true });
    const database = new DatabaseSync(state.paths.database);
    database.exec("CREATE TABLE drill_runs (id TEXT PRIMARY KEY)");
    database.close();
    await expectAdminError(prepareStartOperation(fresh(state.context)), "STORAGE_TOO_OLD");
  });

  it("upgrades every historical version through a verified pre-upgrade bundle (criterion 6)", async () => {
    for (const version of STORAGE_COMPATIBILITY.upgradesFrom) {
      const state = setup();
      mkdirSync(join(state.paths.database, ".."), { recursive: true });
      SQLiteRunStorage.materializeStorageVersion(state.paths.database, version);
      expect(inspectDatabase(state.paths.database)).toEqual({ kind: "database", version });
      const value = await prepareStartOperation(fresh(state.context));
      succeeded(value);
      expect(value, `v${version}`).toMatchObject({ action: "upgraded", sourceStorageVersion: version, targetStorageVersion: STORAGE_VERSION, checks: ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants"] });
      const bundle = join(state.paths.backupRoot!, (value as { backupId: string }).backupId);
      expect(verify(bundle)).toMatchObject({ result: "succeeded", compatibility: "upgradeable", sourceStorageVersion: version });
      expect(parseManifest(readFileSync(join(bundle, "manifest.json"), "utf8"))).toMatchObject({ reason: "pre_upgrade", sourceStorageVersion: version, intendedStorageVersion: STORAGE_VERSION, inventory: { applicationTables: expectedApplicationTables(version) } });
      expect(inspectDatabase(state.paths.database)).toEqual({ kind: "database", version: STORAGE_VERSION });
      expect(readdirSync(join(state.paths.database, "..")).filter((entry) => entry.startsWith(".tabiya-") && !entry.startsWith(".tabiya-storage.lock"))).toEqual([]);
    }
  }, 180_000);

  it("an injected migration failure leaves the live bytes identical and the pre-upgrade bundle valid", async () => {
    const state = setup({ migrate: () => { throw new Error("injected migration failure"); } });
    mkdirSync(join(state.paths.database, ".."), { recursive: true });
    SQLiteRunStorage.materializeStorageVersion(state.paths.database, STORAGE_VERSION - 1);
    const before = sha256File(state.paths.database);
    const failure = await expectAdminError(prepareStartOperation(fresh(state.context)), "MIGRATION_FAILED");
    expect(failure.message).toMatch(/live database is unchanged and pre-upgrade bundle \S+ is retained/u);
    expect(sha256File(state.paths.database)).toBe(before);
    const bundles = readdirSync(state.paths.backupRoot!);
    expect(bundles).toHaveLength(1);
    expect(verify(join(state.paths.backupRoot!, bundles[0]!)).result).toBe("succeeded");
    expect(readdirSync(join(state.paths.database, "..")).filter((entry) => entry.includes("staged"))).toEqual([]);
  });

  it("a migration that silently drops rows fails its invariants and keeps the old database", async () => {
    const state = setup({
      migrate: (path) => {
        migrate(path);
        const database = new DatabaseSync(path);
        database.exec("DELETE FROM learners WHERE id = 'prior-2'");
        database.close();
      },
    });
    mkdirSync(join(state.paths.database, ".."), { recursive: true });
    SQLiteRunStorage.materializeStorageVersion(state.paths.database, STORAGE_VERSION - 1);
    const seed = new DatabaseSync(state.paths.database);
    seed.exec("INSERT INTO learners (id, handle, password_hash, created_at) VALUES ('prior-1', 'prior-1', '!', 'x'), ('prior-2', 'prior-2', '!', 'x')");
    seed.close();
    const before = sha256File(state.paths.database);
    await expectAdminError(prepareStartOperation(fresh(state.context)), "MIGRATION_FAILED");
    expect(sha256File(state.paths.database)).toBe(before);
  });
});

describe("restore, guarded replacement and rollback (§7, criteria 8–9)", () => {
  it("guarded replacement refuses without both confirmations and leaves the target unchanged", async () => {
    const state = setup();
    seedCurrent(state.paths.database);
    const bundle = await backup(state);
    const before = sha256File(state.paths.database);
    await expectAdminError(restoreOperation(fresh(state.context), { bundlePath: bundle }), "RESTORE_CONFIRMATION_REQUIRED");
    await expectAdminError(restoreOperation(fresh(state.context), { bundlePath: bundle, replaceExisting: true }), "RESTORE_CONFIRMATION_REQUIRED");
    await expectAdminError(restoreOperation(fresh(state.context), { bundlePath: bundle, replaceExisting: true, confirmDatabase: join(state.directory, "other.sqlite") }), "RESTORE_CONFIRMATION_REQUIRED");
    expect(sha256File(state.paths.database)).toBe(before);
  });

  it("successful replacement first publishes a valid pre_restore bundle, then restores stable identities", async () => {
    const state = setup();
    seedCurrent(state.paths.database);
    const bundle = await backup(state);
    // Representative mutation and deletion after the backup.
    const live = new DatabaseSync(state.paths.database);
    live.exec("DELETE FROM drill_runs");
    live.exec("DELETE FROM learners WHERE id = 'second'");
    live.close();
    const value = await restoreOperation(fresh(state.context), { bundlePath: bundle, replaceExisting: true, confirmDatabase: state.paths.database });
    succeeded(value);
    const preRestore = (value as { preRestoreBackupId: string }).preRestoreBackupId;
    expect(preRestore).not.toBeNull();
    const preBundle = join(state.paths.backupRoot!, preRestore);
    expect(verify(preBundle).result).toBe("succeeded");
    expect(parseManifest(readFileSync(join(preBundle, "manifest.json"), "utf8")).reason).toBe("pre_restore");
    const database = new DatabaseSync(state.paths.database, { readOnly: true });
    expect((database.prepare("SELECT id FROM learners ORDER BY id").all() as { id: string }[]).map((row) => row.id)).toEqual(["owner", "second"]);
    expect(database.prepare("SELECT id FROM drill_runs").all()).toEqual([{ id: "run-1" }]);
    database.close();
  });

  it("a failed staged check leaves the target unchanged", async () => {
    const state = setup({ migrate: () => { throw new Error("no"); } });
    mkdirSync(join(state.paths.database, ".."), { recursive: true });
    SQLiteRunStorage.materializeStorageVersion(state.paths.database, STORAGE_VERSION - 1);
    // Build a prior-version bundle with the real migrator, then restore it with a failing one.
    const good = setup();
    mkdirSync(join(good.paths.database, ".."), { recursive: true });
    SQLiteRunStorage.materializeStorageVersion(good.paths.database, STORAGE_VERSION - 1);
    const bundle = await backup(good);
    const before = sha256File(state.paths.database);
    await expectAdminError(restoreOperation(fresh(state.context), { bundlePath: bundle, replaceExisting: true, confirmDatabase: state.paths.database }), "MIGRATION_FAILED");
    expect(sha256File(state.paths.database)).toBe(before);
  });

  it("upgrade from the prior release, then roll back to its exact bytes for the prior image", async () => {
    const prior = STORAGE_VERSION - 1;
    const state = setup();
    mkdirSync(join(state.paths.database, ".."), { recursive: true });
    SQLiteRunStorage.materializeStorageVersion(state.paths.database, prior);
    const seed = new DatabaseSync(state.paths.database);
    seed.exec("INSERT INTO learners (id, handle, password_hash, created_at) VALUES ('prior-learner', 'prior-learner', '!', '2026-09-01T00:00:00.000Z')");
    seed.close();

    const upgraded = await prepareStartOperation(fresh(state.context));
    succeeded(upgraded);
    expect(upgraded).toMatchObject({ action: "upgraded", sourceStorageVersion: prior });
    const preUpgrade = join(state.paths.backupRoot!, (upgraded as { backupId: string }).backupId);
    expect(inspectDatabase(state.paths.database)).toEqual({ kind: "database", version: STORAGE_VERSION });
    // The upgraded release writes new data the prior release will not see after rollback.
    const current = new SQLiteRunStorage(state.paths.database, { onMigration: () => {}, requirePreparedStorage: true });
    learner(current, "post-upgrade");
    current.close();

    await expectAdminError(rollbackOperation(fresh(state.context), { bundlePath: preUpgrade, confirmDatabase: join(state.directory, "wrong.sqlite") }), "RESTORE_CONFIRMATION_REQUIRED");
    const rolledBack = await rollbackOperation(fresh(state.context), { bundlePath: preUpgrade, confirmDatabase: state.paths.database });
    succeeded(rolledBack);
    expect(rolledBack).toMatchObject({ operation: "rollback", targetStorageVersion: prior, compatibleApplicationRevision: REVISION, checks: ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention"] });
    // The live database is the prior release's bytes exactly as snapshotted before the upgrade.
    expect(inspectDatabase(state.paths.database)).toEqual({ kind: "database", version: prior });
    expect(sha256File(state.paths.database)).toBe(parseManifest(readFileSync(join(preUpgrade, "manifest.json"), "utf8")).database.sha256);
    // The upgraded state is itself retained as a verified pre_restore bundle (roll-forward path).
    const preRestore = join(state.paths.backupRoot!, (rolledBack as { preRestoreBackupId: string }).preRestoreBackupId);
    expect(verify(preRestore)).toMatchObject({ result: "succeeded", compatibility: "current" });
    // The prior release (its migration chain stops at `prior`) opens without migrating anything.
    SQLiteRunStorage.materializeStorageVersion(state.paths.database, prior);
    const reopened = new DatabaseSync(state.paths.database, { readOnly: true });
    expect(reopened.prepare("PRAGMA user_version").get()).toEqual({ user_version: prior });
    expect((reopened.prepare("SELECT id FROM learners ORDER BY id").all() as { id: string }[]).map((row) => row.id)).toEqual(["prior-learner"]);
    reopened.close();
    // This image refuses to serve the rolled-back bytes directly, and upgrades them again on start.
    expect(() => new SQLiteRunStorage(state.paths.database, { onMigration: () => {}, requirePreparedStorage: true })).toThrow(/prepare-start/u);
    const again = await prepareStartOperation(fresh(state.context));
    expect(again).toMatchObject({ result: "succeeded", action: "upgraded", sourceStorageVersion: prior });
  });
});
