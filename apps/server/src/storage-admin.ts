// rfc/storage-backup-recovery.md — server-owned storage administration: verified online backup
// bundles, guarded restore, rollback to a prior release's bytes, migration-safe startup with a
// pre-upgrade snapshot, and the storage lock that excludes maintenance from a running server.
//
// Every semantic check in this module executes inside the operation that owns the database handle
// it inspects; no check result, storage subject or success tuple is constructible by a caller
// ([[D2972]], [[D2973]]). Receipts are compiled from the operation's private ledger.
import { createHash, randomBytes } from "node:crypto";
import {
  closeSync,
  copyFileSync,
  constants as fsConstants,
  fsyncSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { backup as sqliteBackup, DatabaseSync } from "node:sqlite";

import { assertAccountDataInventory } from "./account-data.js";
import { SQLiteRunStorage, STORAGE_VERSION } from "./storage.js";
import {
  recoverReplacement,
  replaceSqliteTriplet,
  ReplacementRecoveryRequired,
  replacementFs,
  REPLACEMENT_DIRECTORY,
  sha256File,
  SimulatedCrash,
  type RecoveryOutcome,
  type ReplacementFs,
  type Sha256,
} from "./storage-replacement.js";

// ---------------------------------------------------------------------------------------------
// Closed identities

declare const BACKUP_ID: unique symbol;
export type BackupId = string & { readonly [BACKUP_ID]: "BackupId" };
declare const APPLICATION_REVISION: unique symbol;
export type ApplicationRevision = string & { readonly [APPLICATION_REVISION]: "ApplicationRevision" };
declare const OPERATION_ID: unique symbol;
export type StorageOperationId = string & { readonly [OPERATION_ID]: "StorageOperationId" };

/** `YYYYMMDDTHHmmss.SSSZ-<12 lowercase hex>`; the timestamp must be a real UTC instant (§2). */
export function parseBackupId(value: unknown): BackupId {
  if (typeof value !== "string") throw new TypeError("backup id must be a string");
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z-[0-9a-f]{12}$/u.exec(value);
  if (match === null) throw new TypeError("backup id grammar is invalid");
  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${match[7]}Z`;
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime()) || instant.toISOString() !== iso) throw new TypeError("backup id timestamp is not a real UTC instant");
  return value as BackupId;
}

/** Release: 40 lowercase hex; development: `dev+<40 hex>` or `dev+dirty` (never recovery-eligible). */
export function parseApplicationRevision(value: unknown): ApplicationRevision {
  if (typeof value !== "string" || !/^(?:[0-9a-f]{40}|dev\+[0-9a-f]{40}|dev\+dirty)$/u.test(value)) {
    throw new TypeError("application revision must be a full lowercase source SHA, dev+<sha> or dev+dirty");
  }
  return value as ApplicationRevision;
}

export function releaseRecoveryEligible(value: ApplicationRevision): boolean {
  return /^[0-9a-f]{40}$/u.test(value);
}

/** The embedded build revision (`TABIYA_APPLICATION_REVISION`), defaulting to `dev+dirty`. */
export function applicationRevisionFromEnv(env: NodeJS.ProcessEnv = process.env): ApplicationRevision {
  return parseApplicationRevision(env.TABIYA_APPLICATION_REVISION ?? "dev+dirty");
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function parseStorageOperationId(value: unknown): StorageOperationId {
  if (typeof value !== "string" || !UUID_V4.test(value)) throw new TypeError("operation id must be a canonical lowercase RFC-4122 v4 UUID");
  return value as StorageOperationId;
}

export function generateStorageOperationId(bytes: Uint8Array = randomBytes(16)): StorageOperationId {
  if (bytes.length !== 16) throw new TypeError("operation id needs exactly 16 random bytes");
  const b = Buffer.from(bytes);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = b.toString("hex");
  return parseStorageOperationId(`${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`);
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  if (typeof value === "number" && !Number.isFinite(value)) throw new TypeError("canonical JSON has no non-finite numbers");
  return JSON.stringify(value);
}

function sha256(bytes: string | Uint8Array): Sha256 {
  return createHash("sha256").update(bytes).digest("hex") as Sha256;
}

// ---------------------------------------------------------------------------------------------
// Closed failure algebra (§9)

export type StorageAdminOperation = "command" | "backup" | "verify" | "prepare_start" | "restore" | "rollback" | "rehearsal" | "recover";
export type StorageRefusalCode =
  | "USAGE_ERROR" | "NO_DATABASE" | "MAINTENANCE_LOCKED" | "LOCK_AUTHORITY_MISSING"
  | "PATH_REFUSED" | "BACKUP_ID_COLLISION" | "STORAGE_NEWER_THAN_APPLICATION"
  | "STORAGE_TOO_OLD" | "RESTORE_CONFIRMATION_REQUIRED";
export type StorageFailureCode =
  | "BUNDLE_INVALID" | "DIGEST_MISMATCH" | "SQLITE_INTEGRITY_FAILED"
  | "FOREIGN_KEY_VIOLATION" | "INVENTORY_MISMATCH" | "BACKUP_FAILED"
  | "MIGRATION_FAILED" | "RESTORE_FAILED" | "REPLACEMENT_RECOVERY_REQUIRED"
  | "READINESS_FAILED" | "INTERNAL_ERROR";
export type StorageCompatibilityDisposition = "current" | "upgradeable" | "newer_than_application" | "unsupported_old" | "invalid";

export class StorageAdminError extends Error {
  constructor(
    readonly result: "refused" | "failed",
    readonly code: StorageRefusalCode | StorageFailureCode,
    message: string,
    readonly compatibility?: "newer_than_application" | "unsupported_old" | "invalid",
  ) {
    super(message);
  }
}

const refuse = (code: StorageRefusalCode, message: string, compatibility?: "newer_than_application" | "unsupported_old") =>
  new StorageAdminError("refused", code, message, compatibility);
const fail = (code: StorageFailureCode, message: string, compatibility?: "invalid") =>
  new StorageAdminError("failed", code, message, compatibility);

// ---------------------------------------------------------------------------------------------
// Compatibility (§5): derived from the one migration chain, so any head is covered

export interface StorageCompatibility {
  readonly creates: number;
  readonly reads: readonly number[];
  readonly upgradesFrom: readonly number[];
}

export const STORAGE_COMPATIBILITY: StorageCompatibility = Object.freeze({
  creates: STORAGE_VERSION,
  reads: Object.freeze([STORAGE_VERSION]),
  upgradesFrom: Object.freeze(Array.from({ length: STORAGE_VERSION - 1 }, (_value, index) => index + 1)),
});

export function compatibilityOf(version: number): StorageCompatibilityDisposition {
  if (STORAGE_COMPATIBILITY.reads.includes(version)) return "current";
  if (STORAGE_COMPATIBILITY.upgradesFrom.includes(version)) return "upgradeable";
  if (version > STORAGE_COMPATIBILITY.creates) return "newer_than_application";
  return "unsupported_old";
}

/**
 * Tables whose row count a migration may legitimately change. Every other pre-existing table must
 * keep its exact row count across the chain; an undeclared change fails `migration_invariants`
 * (§6). The default for an unlisted migration is the strictest: no pre-existing count changes.
 */
export const MIGRATION_ROW_COUNT_CHANGES: Readonly<Record<number, readonly string[]>> = Object.freeze({
  // Migration 28 rebuilds attempt concepts and moves unregistered rows to the legacy quarantine.
  28: Object.freeze(["attempt_concepts"]),
});

const inventoryCache = new Map<number, readonly string[]>();

/** The exact historical application-table set for `version`, generated from the migration chain. */
export function expectedApplicationTables(version: number): readonly string[] {
  const cached = inventoryCache.get(version);
  if (cached !== undefined) return cached;
  const directory = mkdtempSync(join(tmpdir(), "tabiya-inventory-"));
  try {
    const path = join(directory, "inventory.sqlite");
    SQLiteRunStorage.materializeStorageVersion(path, version);
    const database = new DatabaseSync(path, { readOnly: true });
    try {
      const tables = Object.freeze(applicationTables(database));
      inventoryCache.set(version, tables);
      return tables;
    } finally {
      database.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function applicationTables(database: DatabaseSync): string[] {
  return (database.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[])
    .map((row) => String(row.name)).sort();
}

export function inventoryDigest(tables: readonly string[]): Sha256 {
  return sha256(canonicalJson([...tables].sort()));
}

// ---------------------------------------------------------------------------------------------
// Paths and the storage lock (§1)

export interface StoragePaths {
  readonly database: string;
  readonly backupRoot: string | undefined;
  readonly lock: string;
}

function isInside(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

export function resolveStoragePaths(input: { readonly database: string; readonly backupRoot?: string | undefined }): StoragePaths {
  const { database } = input;
  if (typeof database !== "string" || database === "" || database === ":memory:" || database.startsWith("file:") || database.includes("\0") || !isAbsolute(database)) {
    throw refuse("PATH_REFUSED", "the database must be one absolute file path");
  }
  const databasePath = resolve(database);
  let backupRoot: string | undefined;
  if (input.backupRoot !== undefined) {
    if (input.backupRoot === "" || input.backupRoot.includes("\0") || !isAbsolute(input.backupRoot)) throw refuse("PATH_REFUSED", "the backup root must be an absolute path");
    backupRoot = resolve(input.backupRoot);
    if (backupRoot === dirname(databasePath)) throw refuse("PATH_REFUSED", "the backup root may not be the database directory itself");
    if (isInside(backupRoot, databasePath)) throw refuse("PATH_REFUSED", "the database may not live inside the backup root");
    try {
      const stat = lstatSync(backupRoot);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw refuse("PATH_REFUSED", "the backup root must be a real directory, not a symlink");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return Object.freeze({ database: databasePath, backupRoot, lock: join(dirname(databasePath), ".tabiya-storage.lock") });
}

/**
 * The storage lock: one exclusive SQLite transaction on `<data>/.tabiya-storage.lock`, held by the
 * owning process for its whole lifetime (server or maintenance). SQLite's POSIX advisory locks are
 * released by the kernel on process death, so a stale lock file is never a false owner; contention
 * refuses immediately (busy timeout 0). File contents are not authority.
 */
export class StorageLock {
  readonly #database: DatabaseSync;
  readonly path: string;
  #held = true;

  private constructor(database: DatabaseSync, path: string) {
    this.#database = database;
    this.path = path;
  }

  static acquire(paths: StoragePaths): StorageLock {
    mkdirSync(dirname(paths.lock), { recursive: true });
    let database: DatabaseSync;
    try {
      database = new DatabaseSync(paths.lock);
      database.exec("PRAGMA busy_timeout = 0");
      // The lock database never holds data: no rollback journal, so no sidecar outlives a crash.
      database.exec("PRAGMA journal_mode = OFF");
    } catch (error) {
      throw refuse("MAINTENANCE_LOCKED", `the storage lock could not be opened: ${(error as Error).message}`);
    }
    try {
      database.exec("BEGIN EXCLUSIVE");
    } catch {
      database.close();
      throw refuse("MAINTENANCE_LOCKED", "another server or maintenance process holds the storage lock");
    }
    return new StorageLock(database, paths.lock);
  }

  get held(): boolean {
    return this.#held;
  }

  assertHeldFor(paths: StoragePaths): void {
    if (!this.#held || this.path !== paths.lock) throw refuse("LOCK_AUTHORITY_MISSING", "the operation does not hold this database's storage lock");
  }

  release(): void {
    if (!this.#held) return;
    this.#held = false;
    try { this.#database.exec("ROLLBACK"); } catch { /* closing releases the lock regardless */ }
    this.#database.close();
  }
}

// ---------------------------------------------------------------------------------------------
// The private check ledger: only operations in this module can pass a check

export type StorageCheck =
  | "digest" | "integrity" | "foreign_keys" | "inventory" | "compatibility"
  | "migration_invariants" | "identity_retention" | "readiness";
const CHECK_ORDER: readonly StorageCheck[] = ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention", "readiness"];

class CheckLedger {
  readonly #passed = new Set<StorageCheck>();
  readonly operationId: StorageOperationId;
  constructor(operationId: StorageOperationId) { this.operationId = operationId; }
  pass(check: StorageCheck): void { this.#passed.add(check); }
  /** The exact required tuple, or an internal error: success can never omit or invent a check. */
  compile<T extends readonly StorageCheck[]>(required: T): T {
    const passed = CHECK_ORDER.filter((check) => this.#passed.has(check));
    const expected = CHECK_ORDER.filter((check) => required.includes(check));
    if (canonicalJson(passed) !== canonicalJson(expected) || expected.length !== required.length) {
      throw fail("INTERNAL_ERROR", `operation passed [${passed.join(",")}] but its receipt requires [${required.join(",")}]`);
    }
    return Object.freeze([...expected]) as unknown as T;
  }
}

const BACKUP_CHECKS = ["digest", "integrity", "foreign_keys", "inventory", "compatibility"] as const;
const PREPARE_FRESH_CHECKS = ["compatibility"] as const;
const PREPARE_CURRENT_CHECKS = ["integrity", "foreign_keys", "inventory", "compatibility"] as const;
const PREPARE_UPGRADED_CHECKS = ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants"] as const;
const RESTORE_CURRENT_CHECKS = ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention"] as const;
const RESTORE_UPGRADED_CHECKS = ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention"] as const;
const REHEARSAL_CURRENT_CHECKS = [...RESTORE_CURRENT_CHECKS, "readiness"] as const;
const REHEARSAL_UPGRADED_CHECKS = [...RESTORE_UPGRADED_CHECKS, "readiness"] as const;

function openReadOnly(path: string): DatabaseSync {
  try {
    return new DatabaseSync(path, { readOnly: true });
  } catch (error) {
    throw fail("SQLITE_INTEGRITY_FAILED", `SQLite could not open the database: ${(error as Error).message}`);
  }
}

function userVersionOf(database: DatabaseSync): number {
  const row = database.prepare("PRAGMA user_version").get() as { user_version?: unknown } | undefined;
  if (typeof row?.user_version !== "number") throw fail("SQLITE_INTEGRITY_FAILED", "user_version is unreadable");
  return row.user_version;
}

/** Integrity, foreign keys, version and generated inventory, each an independent able-to-fail query. */
function checkDatabaseFile(path: string, version: number, ledger: CheckLedger): { readonly tables: readonly string[] } {
  const database = openReadOnly(path);
  try {
    let integrity: readonly Record<string, unknown>[];
    try {
      integrity = database.prepare("PRAGMA integrity_check").all() as Record<string, unknown>[];
    } catch (error) {
      throw fail("SQLITE_INTEGRITY_FAILED", `integrity_check could not run: ${(error as Error).message}`);
    }
    if (integrity.length !== 1 || Object.values(integrity[0]!)[0] !== "ok") throw fail("SQLITE_INTEGRITY_FAILED", "PRAGMA integrity_check did not return exactly one ok row");
    ledger.pass("integrity");
    const violations = database.prepare("PRAGMA foreign_key_check").all();
    if (violations.length !== 0) throw fail("FOREIGN_KEY_VIOLATION", `PRAGMA foreign_key_check returned ${violations.length} row(s)`);
    ledger.pass("foreign_keys");
    if (userVersionOf(database) !== version) throw fail("INVENTORY_MISMATCH", `user_version is ${userVersionOf(database)}, expected ${version}`);
    const tables = applicationTables(database);
    if (canonicalJson(tables) !== canonicalJson(expectedApplicationTables(version))) {
      throw fail("INVENTORY_MISMATCH", `application tables do not match the generated v${version} inventory`);
    }
    if (version === STORAGE_VERSION) {
      try { assertAccountDataInventory(tables); } catch (error) { throw fail("INVENTORY_MISMATCH", (error as Error).message); }
    }
    ledger.pass("inventory");
    return { tables };
  } finally {
    database.close();
  }
}

function passCompatibility(version: number, ledger: CheckLedger, allowed: readonly StorageCompatibilityDisposition[]): StorageCompatibilityDisposition {
  const disposition = compatibilityOf(version);
  if (disposition === "newer_than_application") throw refuse("STORAGE_NEWER_THAN_APPLICATION", `storage version ${version} is newer than this application (${STORAGE_VERSION})`, "newer_than_application");
  if (disposition === "unsupported_old" || !allowed.includes(disposition)) throw refuse("STORAGE_TOO_OLD", `storage version ${version} has no supported migration chain`, "unsupported_old");
  ledger.pass("compatibility");
  return disposition;
}

// ---------------------------------------------------------------------------------------------
// Read-only live inspection before any SQLite open or write (§3 step 1, §5)

export type StorageInspection =
  | { readonly kind: "absent" }
  | { readonly kind: "empty" }
  | { readonly kind: "database"; readonly version: number };

export function inspectDatabase(path: string): StorageInspection {
  let size: number;
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw refuse("PATH_REFUSED", "the database path is not a regular file");
    size = stat.size;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kind: "absent" };
    throw error;
  }
  if (size === 0) return { kind: "empty" };
  const header = Buffer.alloc(100);
  const fd = openSync(path, "r");
  try { readSync(fd, header, 0, 100, 0); } finally { closeSync(fd); }
  if (header.subarray(0, 16).toString("latin1") !== "SQLite format 3\0") throw fail("SQLITE_INTEGRITY_FAILED", "the database file has no SQLite header", "invalid");
  let version = header.readUInt32BE(60);
  let walBytes = 0;
  try { walBytes = statSync(`${path}-wal`).size; } catch { /* no WAL sidecar */ }
  // A newer database with a quiet WAL is refused from header bytes alone: SQLite never opens it.
  if (walBytes > 0 || version === 0 || version <= STORAGE_VERSION) {
    const database = openReadOnly(path);
    try {
      version = userVersionOf(database);
      if (version === 0 && (database.prepare("SELECT count(*) AS n FROM sqlite_schema").get() as { n: number }).n === 0) return { kind: "empty" };
    } finally {
      database.close();
    }
  }
  return { kind: "database", version };
}

// ---------------------------------------------------------------------------------------------
// Backup bundle v1 (§2) and publication (§3)

export type BackupReason = "manual" | "pre_upgrade" | "pre_restore";

export interface StorageBackupManifestV1 {
  readonly format: "tabiya-storage-backup";
  readonly formatVersion: 1;
  readonly backupId: BackupId;
  readonly createdAt: string;
  readonly reservationNonce: string;
  readonly reason: BackupReason;
  readonly applicationRevision: ApplicationRevision;
  readonly sourceStorageVersion: number;
  readonly intendedStorageVersion: number;
  readonly database: { readonly file: "database.sqlite"; readonly bytes: number; readonly sha256: Sha256 };
  readonly sqlite: { readonly integrityCheck: "ok"; readonly foreignKeyViolations: 0 };
  readonly inventory: { readonly applicationTables: readonly string[]; readonly inventorySha256: Sha256 };
}

const MANIFEST_KEYS = ["format", "formatVersion", "backupId", "createdAt", "reservationNonce", "reason", "applicationRevision", "sourceStorageVersion", "intendedStorageVersion", "database", "sqlite", "inventory"];
const PUBLISHING_MARKER = ".publishing";
const BUNDLE_FILES = ["database.sqlite", "manifest.json"];

function basicInstant(createdAt: string): string {
  return createdAt.replaceAll("-", "").replaceAll(":", "");
}

export function computeBackupId(manifestWithoutId: Omit<StorageBackupManifestV1, "backupId">): BackupId {
  const image = Buffer.concat([Buffer.from("tabiya-storage-backup-id-v1\0", "utf8"), Buffer.from(canonicalJson(manifestWithoutId), "utf8")]);
  return parseBackupId(`${basicInstant(manifestWithoutId.createdAt)}-${sha256(image).slice(0, 12)}`);
}

function closedObject(value: unknown, keys: readonly string[], what: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw fail("BUNDLE_INVALID", `${what} is not an object`, "invalid");
  const actual = Object.keys(value).sort();
  if (canonicalJson(actual) !== canonicalJson([...keys].sort())) throw fail("BUNDLE_INVALID", `${what} has unknown or missing keys`, "invalid");
  return value as Record<string, unknown>;
}

function nonNegativeInteger(value: unknown, what: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw fail("BUNDLE_INVALID", `${what} is not a non-negative integer`, "invalid");
  return value;
}

export function parseManifest(text: string): StorageBackupManifestV1 {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw fail("BUNDLE_INVALID", "manifest is not JSON", "invalid"); }
  const manifest = closedObject(value, MANIFEST_KEYS, "manifest");
  if (manifest.format !== "tabiya-storage-backup" || manifest.formatVersion !== 1) throw fail("BUNDLE_INVALID", "manifest format is unknown", "invalid");
  const database = closedObject(manifest.database, ["file", "bytes", "sha256"], "manifest.database");
  const sqlite = closedObject(manifest.sqlite, ["integrityCheck", "foreignKeyViolations"], "manifest.sqlite");
  const inventory = closedObject(manifest.inventory, ["applicationTables", "inventorySha256"], "manifest.inventory");
  const parse = <T>(fn: () => T): T => { try { return fn(); } catch (error) { throw fail("BUNDLE_INVALID", (error as Error).message, "invalid"); } };
  if (typeof manifest.createdAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(manifest.createdAt) || new Date(manifest.createdAt).toISOString() !== manifest.createdAt) {
    throw fail("BUNDLE_INVALID", "createdAt is not a canonical millisecond UTC instant", "invalid");
  }
  if (typeof manifest.reservationNonce !== "string" || !/^[0-9a-f]{32}$/u.test(manifest.reservationNonce)) throw fail("BUNDLE_INVALID", "reservationNonce is invalid", "invalid");
  if (manifest.reason !== "manual" && manifest.reason !== "pre_upgrade" && manifest.reason !== "pre_restore") throw fail("BUNDLE_INVALID", "reason is unknown", "invalid");
  if (database.file !== "database.sqlite" || sqlite.integrityCheck !== "ok" || sqlite.foreignKeyViolations !== 0) throw fail("BUNDLE_INVALID", "manifest database facts are invalid", "invalid");
  if (!Array.isArray(inventory.applicationTables) || inventory.applicationTables.some((name) => typeof name !== "string")) throw fail("BUNDLE_INVALID", "inventory tables are invalid", "invalid");
  const tables = inventory.applicationTables as string[];
  if (canonicalJson(tables) !== canonicalJson([...tables].sort())) throw fail("BUNDLE_INVALID", "inventory tables are not sorted", "invalid");
  const parsed: StorageBackupManifestV1 = {
    format: "tabiya-storage-backup",
    formatVersion: 1,
    backupId: parse(() => parseBackupId(manifest.backupId)),
    createdAt: manifest.createdAt,
    reservationNonce: manifest.reservationNonce,
    reason: manifest.reason,
    applicationRevision: parse(() => parseApplicationRevision(manifest.applicationRevision)),
    sourceStorageVersion: nonNegativeInteger(manifest.sourceStorageVersion, "sourceStorageVersion"),
    intendedStorageVersion: nonNegativeInteger(manifest.intendedStorageVersion, "intendedStorageVersion"),
    database: { file: "database.sqlite", bytes: nonNegativeInteger(database.bytes, "database.bytes"), sha256: parse(() => parseSha(database.sha256)) },
    sqlite: { integrityCheck: "ok", foreignKeyViolations: 0 },
    inventory: { applicationTables: Object.freeze([...tables]), inventorySha256: parse(() => parseSha(inventory.inventorySha256)) },
  };
  if (`${canonicalJson(parsed)}\n` !== text) throw fail("BUNDLE_INVALID", "manifest bytes are not canonical", "invalid");
  const { backupId: _id, ...withoutId } = parsed;
  if (computeBackupId(withoutId) !== parsed.backupId) throw fail("BUNDLE_INVALID", "backupId does not match the manifest image", "invalid");
  return parsed;
}

function parseSha(value: unknown): Sha256 {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/u.test(value)) throw new TypeError("sha256 is invalid");
  return value as Sha256;
}

export interface VerifiedBundle {
  readonly path: string;
  readonly manifest: StorageBackupManifestV1;
  readonly disposition: StorageCompatibilityDisposition;
}

/**
 * Public verification is read-only (§4). `marker` is only for the writer's internal pre-commit
 * verification of its own reservation; public verification refuses any `.publishing` directory.
 */
function verifyBundleInto(bundlePath: string, ledger: CheckLedger, marker?: StorageOperationId): VerifiedBundle {
  const path = resolve(bundlePath);
  const name = basename(path);
  if (name.endsWith(".partial")) throw fail("BUNDLE_INVALID", "legacy .partial paths are never bundles", "invalid");
  let directoryId: BackupId;
  try { directoryId = parseBackupId(name); } catch { throw fail("BUNDLE_INVALID", "bundle directory name is not a backup id", "invalid"); }
  let stat;
  try { stat = lstatSync(path); } catch { throw fail("BUNDLE_INVALID", "bundle directory does not exist", "invalid"); }
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw fail("BUNDLE_INVALID", "bundle is not a real directory", "invalid");
  const entries = readdirSync(path).sort();
  const expected = marker === undefined ? BUNDLE_FILES : [PUBLISHING_MARKER, ...BUNDLE_FILES].sort();
  if (canonicalJson(entries) !== canonicalJson(expected)) throw fail("BUNDLE_INVALID", `bundle entries are [${entries.join(",")}]`, "invalid");
  for (const entry of entries) {
    const entryStat = lstatSync(join(path, entry));
    if (entryStat.isSymbolicLink() || !entryStat.isFile()) throw fail("BUNDLE_INVALID", `${entry} is not a regular file`, "invalid");
  }
  if (marker !== undefined && readFileSync(join(path, PUBLISHING_MARKER), "utf8") !== `${marker}\n`) throw fail("BUNDLE_INVALID", "publication marker belongs to another operation", "invalid");
  const manifest = parseManifest(readFileSync(join(path, "manifest.json"), "utf8"));
  if (manifest.backupId !== directoryId) throw fail("BUNDLE_INVALID", "bundle directory and manifest backupId differ", "invalid");
  const databasePath = join(path, "database.sqlite");
  const bytes = statSync(databasePath).size;
  if (bytes !== manifest.database.bytes || sha256File(databasePath) !== manifest.database.sha256) throw fail("DIGEST_MISMATCH", "database bytes do not match the manifest", "invalid");
  ledger.pass("digest");
  const version = manifest.sourceStorageVersion;
  if (inventoryDigest(manifest.inventory.applicationTables) !== manifest.inventory.inventorySha256) throw fail("INVENTORY_MISMATCH", "inventory digest mismatch", "invalid");
  const disposition = compatibilityOf(version);
  if (disposition === "newer_than_application" || disposition === "unsupported_old") {
    // Intact-but-refused: the SQLite file is still checked, but its tables cannot be compared.
    const database = openReadOnly(databasePath);
    try {
      const rows = database.prepare("PRAGMA integrity_check").all() as Record<string, unknown>[];
      if (rows.length !== 1 || Object.values(rows[0]!)[0] !== "ok") throw fail("SQLITE_INTEGRITY_FAILED", "integrity_check failed", "invalid");
      if (userVersionOf(database) !== version) throw fail("INVENTORY_MISMATCH", "user_version differs from the manifest", "invalid");
    } finally {
      database.close();
    }
    return { path, manifest, disposition };
  }
  try {
    checkDatabaseFile(databasePath, version, ledger);
  } catch (error) {
    if (error instanceof StorageAdminError && error.result === "failed") throw fail(error.code as StorageFailureCode, error.message, "invalid");
    throw error;
  }
  if (canonicalJson(manifest.inventory.applicationTables) !== canonicalJson(expectedApplicationTables(version))) throw fail("INVENTORY_MISMATCH", "manifest inventory differs from the generated inventory", "invalid");
  ledger.pass("compatibility");
  return { path, manifest, disposition };
}

export interface StorageOperationContext {
  readonly lock: StorageLock;
  readonly paths: StoragePaths;
  readonly operationId: StorageOperationId;
  readonly applicationRevision: ApplicationRevision;
  /** Runs the production migration chain (structural + concept phase) on a staged file. */
  readonly migrate: (path: string) => void;
  readonly now?: () => Date;
  readonly random?: (size: number) => Buffer;
  /** Crash injection for publication and replacement fixtures (tests only). */
  readonly fault?: (point: string) => void;
}

function point(context: StorageOperationContext, name: string): void {
  context.fault?.(name);
}

function fsyncPath(path: string): void {
  const fd = openSync(path, "r");
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

function writeExclusive(path: string, text: string): void {
  const fd = openSync(path, "wx", 0o600);
  try { writeSync(fd, text); } finally { closeSync(fd); }
}

/** Removes a work directory only when its owner marker proves this operation created it. */
function removeOwnedWorkDirectory(path: string, operationId: StorageOperationId): void {
  let owner: string;
  try { owner = readFileSync(join(path, ".owner"), "utf8"); } catch { return; }
  if (owner !== `${operationId}\n`) return;
  rmSync(path, { recursive: true, force: true });
}

/** Reconverts a SQLite file to a standalone DELETE-journal main file with no sidecars. */
function makeStandalone(path: string): void {
  const database = new DatabaseSync(path);
  try {
    database.exec("PRAGMA journal_mode = DELETE");
  } finally {
    database.close();
  }
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    try { lstatSync(`${path}${suffix}`); throw fail("BACKUP_FAILED", `standalone conversion left ${suffix}`); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

export interface BackupResult {
  readonly backupId: BackupId;
  readonly bundlePath: string;
  readonly manifest: StorageBackupManifestV1;
}

function requireBackupRoot(context: StorageOperationContext): string {
  if (context.paths.backupRoot === undefined) throw refuse("PATH_REFUSED", "this operation requires an explicit absolute backup root");
  mkdirSync(context.paths.backupRoot, { recursive: true, mode: 0o700 });
  return context.paths.backupRoot;
}

async function createBackup(context: StorageOperationContext, reason: BackupReason, ledger: CheckLedger, intendedStorageVersion?: number): Promise<BackupResult> {
  context.lock.assertHeldFor(context.paths);
  const root = requireBackupRoot(context);
  const inspection = inspectDatabase(context.paths.database);
  if (inspection.kind !== "database") throw refuse("NO_DATABASE", "there is no database to back up");
  const version = inspection.version;
  passCompatibility(version, ledger, ["current", "upgradeable"]);
  const work = join(root, `.tabiya-work-${context.operationId}`);
  try {
    mkdirSync(work, { mode: 0o700 });
  } catch {
    throw refuse("BACKUP_ID_COLLISION", "the operation work directory already exists");
  }
  writeExclusive(join(work, ".owner"), `${context.operationId}\n`);
  let reserved: string | undefined;
  try {
    const snapshot = join(work, "database.sqlite");
    const source = openReadOnly(context.paths.database);
    try {
      await sqliteBackup(source, snapshot);
    } catch (error) {
      throw fail("BACKUP_FAILED", `SQLite online backup failed: ${(error as Error).message}`);
    } finally {
      source.close();
    }
    makeStandalone(snapshot);
    const { tables } = checkDatabaseFile(snapshot, version, ledger);
    const bytes = statSync(snapshot).size;
    const digest = sha256File(snapshot);
    const createdAt = (context.now?.() ?? new Date()).toISOString();
    const random = context.random ?? ((size: number) => randomBytes(size));
    let manifest: StorageBackupManifestV1 | undefined;
    for (let attempt = 0; attempt < 16 && reserved === undefined; attempt += 1) {
      const withoutId: Omit<StorageBackupManifestV1, "backupId"> = {
        format: "tabiya-storage-backup",
        formatVersion: 1,
        createdAt,
        reservationNonce: random(16).toString("hex"),
        reason,
        applicationRevision: context.applicationRevision,
        sourceStorageVersion: version,
        intendedStorageVersion: intendedStorageVersion ?? version,
        database: { file: "database.sqlite", bytes, sha256: digest },
        sqlite: { integrityCheck: "ok", foreignKeyViolations: 0 },
        inventory: { applicationTables: tables, inventorySha256: inventoryDigest(tables) },
      };
      const backupId = computeBackupId(withoutId);
      const finalPath = join(root, backupId);
      if (existsAny(`${finalPath}.partial`)) continue;
      try {
        mkdirSync(finalPath, { mode: 0o700 });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") continue;
        throw error;
      }
      reserved = finalPath;
      manifest = { ...withoutId, backupId };
    }
    if (reserved === undefined || manifest === undefined) throw refuse("BACKUP_ID_COLLISION", "16 reservation attempts collided");
    point(context, "publication reserved");
    writeExclusive(join(reserved, PUBLISHING_MARKER), `${context.operationId}\n`);
    renameSync(snapshot, join(reserved, "database.sqlite"));
    writeExclusive(join(reserved, "manifest.json"), `${canonicalJson(manifest)}\n`);
    verifyBundleInto(reserved, new CheckLedger(context.operationId), context.operationId);
    fsyncPath(join(reserved, "database.sqlite"));
    fsyncPath(join(reserved, "manifest.json"));
    fsyncPath(reserved);
    point(context, "publication before marker unlink");
    unlinkSync(join(reserved, PUBLISHING_MARKER));
    point(context, "publication after marker unlink");
    fsyncPath(reserved);
    point(context, "publication after bundle fsync");
    fsyncPath(root);
    point(context, "publication after root fsync");
    ledger.pass("digest");
    return { backupId: manifest.backupId, bundlePath: reserved, manifest };
  } finally {
    // Cleanup is total over the real publication state: the random work directory is removable;
    // an exclusively reserved final directory stays as an invalid abandoned reservation; a
    // published bundle is immutable.
    removeOwnedWorkDirectory(work, context.operationId);
  }
}

function existsAny(path: string): boolean {
  try { lstatSync(path); return true; } catch { return false; }
}

export function abandonedReservations(backupRoot: string): readonly string[] {
  let entries: string[];
  try { entries = readdirSync(backupRoot); } catch { return []; }
  // Any backup-id directory without the exact published two-file shape is an invalid reservation
  // (reserved-but-empty, or still carrying `.publishing`); it is reported, never adopted or removed.
  return entries.filter((entry) => {
    try { parseBackupId(entry); } catch { return false; }
    let files: string[];
    try { files = readdirSync(join(backupRoot, entry)).sort(); } catch { return false; }
    return canonicalJson(files) !== canonicalJson(BUNDLE_FILES);
  }).sort();
}

// ---------------------------------------------------------------------------------------------
// Staging, invariants and installation

function stagingPath(context: StorageOperationContext): string {
  return join(dirname(context.paths.database), `.tabiya-staged-${context.operationId}.sqlite`);
}

function stageCopy(source: string, staged: string): void {
  copyFileSync(source, staged, fsConstants.COPYFILE_EXCL);
  fsyncPath(staged);
}

function removeStaged(staged: string): void {
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    try { unlinkSync(`${staged}${suffix}`); } catch { /* absent */ }
  }
}

function rowCounts(path: string): ReadonlyMap<string, number> {
  const database = openReadOnly(path);
  try {
    return new Map(applicationTables(database).map((table) => [table, Number((database.prepare(`SELECT count(*) AS n FROM "${table.replaceAll("\"", "\"\"")}"`).get() as { n: number }).n)] as const));
  } finally {
    database.close();
  }
}

function checkMigrationInvariants(before: ReadonlyMap<string, number>, after: ReadonlyMap<string, number>, fromVersion: number, ledger: CheckLedger): void {
  const mutable = new Set<string>();
  for (let version = fromVersion + 1; version <= STORAGE_VERSION; version += 1) {
    for (const table of MIGRATION_ROW_COUNT_CHANGES[version] ?? []) mutable.add(table);
  }
  for (const [table, count] of before) {
    if (mutable.has(table)) continue;
    const next = after.get(table);
    if (next === undefined) throw fail("MIGRATION_FAILED", `migration removed undeclared table ${table}`);
    if (next !== count) throw fail("MIGRATION_FAILED", `migration changed ${table} from ${count} to ${next} rows without a declaration`);
  }
  ledger.pass("migration_invariants");
}

const IDENTITY_TABLES = ["learners", "drill_runs", "classrooms", "repertoires", "registered_packs"] as const;

function identities(path: string): ReadonlyMap<string, string> {
  const database = openReadOnly(path);
  try {
    const tables = new Set(applicationTables(database));
    const result = new Map<string, string>();
    for (const table of IDENTITY_TABLES) {
      if (!tables.has(table)) continue;
      const column = table === "registered_packs" ? "digest" : "id";
      const ids = (database.prepare(`SELECT ${column} AS id FROM ${table} ORDER BY ${column}`).all() as { id: unknown }[]).map((row) => String(row.id));
      result.set(table, sha256(canonicalJson(ids)));
    }
    return result;
  } finally {
    database.close();
  }
}

function checkIdentityRetention(sourcePath: string, stagedPath: string, ledger: CheckLedger): void {
  const before = identities(sourcePath);
  const after = identities(stagedPath);
  for (const [table, digest] of before) {
    if (after.get(table) !== digest) throw fail("RESTORE_FAILED", `identities in ${table} changed during restore`);
  }
  ledger.pass("identity_retention");
}

function installVerifier(expectedVersion: number): (livePath: string) => void {
  return (livePath) => {
    const database = new DatabaseSync(livePath, { readOnly: true });
    try {
      const rows = database.prepare("PRAGMA quick_check").all() as Record<string, unknown>[];
      if (rows.length !== 1 || Object.values(rows[0]!)[0] !== "ok") throw new Error("installed database failed quick_check");
      if (userVersionOf(database) !== expectedVersion) throw new Error("installed database has the wrong version");
    } finally {
      database.close();
    }
  };
}

function install(context: StorageOperationContext, staged: string, expectedVersion: number, failure: StorageFailureCode): void {
  const fs: ReplacementFs = replacementFs(context.fault);
  let outcome;
  try {
    outcome = replaceSqliteTriplet({ livePath: context.paths.database, stagedPath: staged, operationId: context.operationId, verify: installVerifier(expectedVersion), fs });
  } catch (error) {
    if (error instanceof SimulatedCrash) throw error;
    if (error instanceof ReplacementRecoveryRequired) throw fail("REPLACEMENT_RECOVERY_REQUIRED", error.message);
    throw error;
  }
  if (outcome !== "kept_new") throw fail(failure, "the installed database failed verification and the old triplet was restored");
}

/** Restart recovery for an interrupted replacement; runs under the lock before any SQLite open. */
export function recoverStorage(context: Pick<StorageOperationContext, "lock" | "paths" | "fault">): RecoveryOutcome {
  context.lock.assertHeldFor(context.paths);
  try {
    return recoverReplacement(context.paths.database, replacementFs(context.fault));
  } catch (error) {
    if (error instanceof SimulatedCrash) throw error;
    if (error instanceof ReplacementRecoveryRequired) throw fail("REPLACEMENT_RECOVERY_REQUIRED", error.message);
    throw error;
  }
}

// ---------------------------------------------------------------------------------------------
// Receipts (§9)

type StoragePathRef =
  | { readonly role: "database"; readonly identity: "live" }
  | { readonly role: "backup_root"; readonly identity: "configured" }
  | { readonly role: "bundle"; readonly identity: BackupId }
  | { readonly role: "staging"; readonly identity: "internal" }
  | { readonly role: "volume"; readonly identity: "disposable_rehearsal" };

interface ReceiptBase {
  readonly protocol: "tabiya-storage-admin-receipt";
  readonly protocolVersion: 1;
  readonly operationId: StorageOperationId;
  readonly applicationRevision: ApplicationRevision;
  readonly elapsedMs: number;
  readonly paths: readonly StoragePathRef[];
}

export type StorageAdminReceiptV1 = ReceiptBase & (
  | { readonly operation: "backup"; readonly result: "succeeded"; readonly backupId: BackupId; readonly reason: BackupReason; readonly sourceStorageVersion: number; readonly intendedStorageVersion: number; readonly checks: typeof BACKUP_CHECKS }
  | { readonly operation: "verify"; readonly result: "succeeded"; readonly backupId: BackupId; readonly compatibility: "current" | "upgradeable"; readonly sourceStorageVersion: number; readonly currentStorageVersion: number; readonly checks: typeof BACKUP_CHECKS }
  | { readonly operation: "prepare_start"; readonly result: "succeeded"; readonly action: "fresh"; readonly sourceStorageVersion: null; readonly targetStorageVersion: number; readonly backupId: null; readonly checks: typeof PREPARE_FRESH_CHECKS }
  | { readonly operation: "prepare_start"; readonly result: "succeeded"; readonly action: "current"; readonly sourceStorageVersion: number; readonly targetStorageVersion: number; readonly backupId: null; readonly checks: typeof PREPARE_CURRENT_CHECKS }
  | { readonly operation: "prepare_start"; readonly result: "succeeded"; readonly action: "upgraded"; readonly sourceStorageVersion: number; readonly targetStorageVersion: number; readonly backupId: BackupId; readonly checks: typeof PREPARE_UPGRADED_CHECKS }
  | { readonly operation: "restore"; readonly result: "succeeded"; readonly migration: "not_required"; readonly sourceBackupId: BackupId; readonly preRestoreBackupId: BackupId | null; readonly sourceStorageVersion: number; readonly targetStorageVersion: number; readonly checks: typeof RESTORE_CURRENT_CHECKS }
  | { readonly operation: "restore"; readonly result: "succeeded"; readonly migration: "applied"; readonly sourceBackupId: BackupId; readonly preRestoreBackupId: BackupId | null; readonly sourceStorageVersion: number; readonly targetStorageVersion: number; readonly checks: typeof RESTORE_UPGRADED_CHECKS }
  | { readonly operation: "rollback"; readonly result: "succeeded"; readonly sourceBackupId: BackupId; readonly preRestoreBackupId: BackupId | null; readonly targetStorageVersion: number; readonly compatibleApplicationRevision: ApplicationRevision; readonly checks: typeof RESTORE_CURRENT_CHECKS }
  | { readonly operation: "rehearsal"; readonly result: "succeeded"; readonly migration: "not_required"; readonly sourceBackupId: BackupId; readonly imageDigest: string | null; readonly architecture: string; readonly checks: typeof REHEARSAL_CURRENT_CHECKS }
  | { readonly operation: "rehearsal"; readonly result: "succeeded"; readonly migration: "applied"; readonly sourceBackupId: BackupId; readonly imageDigest: string | null; readonly architecture: string; readonly checks: typeof REHEARSAL_UPGRADED_CHECKS }
  | { readonly operation: "recover"; readonly result: "succeeded"; readonly recovery: RecoveryOutcome }
  | { readonly operation: StorageAdminOperation; readonly result: "refused"; readonly code: StorageRefusalCode; readonly compatibility?: "newer_than_application" | "unsupported_old" }
  | { readonly operation: StorageAdminOperation; readonly result: "failed"; readonly code: StorageFailureCode; readonly compatibility?: "invalid" }
  | { readonly operation: StorageAdminOperation; readonly result: "cancelled"; readonly code: "OPERATION_CANCELLED"; readonly signal: "SIGINT" | "SIGTERM" }
);

type ReceiptBody = StorageAdminReceiptV1 extends infer R ? R extends ReceiptBase ? Omit<R, keyof ReceiptBase> : never : never;

export class ReceiptClock {
  readonly #start = performance.now();
  elapsedMs(): number { return Math.max(0, Math.floor(performance.now() - this.#start)); }
}

export function receipt(context: { readonly operationId: StorageOperationId; readonly applicationRevision: ApplicationRevision; readonly clock: ReceiptClock }, paths: readonly StoragePathRef[], body: ReceiptBody): StorageAdminReceiptV1 {
  return { protocol: "tabiya-storage-admin-receipt", protocolVersion: 1, operationId: context.operationId, applicationRevision: context.applicationRevision, elapsedMs: context.clock.elapsedMs(), paths, ...body } as StorageAdminReceiptV1;
}

export function errorReceipt(context: { readonly operationId: StorageOperationId; readonly applicationRevision: ApplicationRevision; readonly clock: ReceiptClock }, operation: StorageAdminOperation, error: unknown): StorageAdminReceiptV1 {
  if (error instanceof StorageAdminError) {
    if (error.result === "refused") {
      return receipt(context, [], { operation, result: "refused", code: error.code as StorageRefusalCode, ...(error.compatibility === "newer_than_application" || error.compatibility === "unsupported_old" ? { compatibility: error.compatibility } : {}) });
    }
    return receipt(context, [], { operation, result: "failed", code: error.code as StorageFailureCode, ...(error.compatibility === "invalid" ? { compatibility: "invalid" as const } : {}) });
  }
  return receipt(context, [], { operation, result: "failed", code: "INTERNAL_ERROR" });
}

export function receiptExitCode(value: StorageAdminReceiptV1): number {
  switch (value.result) {
    case "succeeded": return 0;
    case "refused": return 2;
    case "failed": return value.code === "INTERNAL_ERROR" ? 4 : 3;
    case "cancelled": return value.signal === "SIGINT" ? 130 : 143;
  }
}

// ---------------------------------------------------------------------------------------------
// Operations

interface OperationCore {
  readonly clock: ReceiptClock;
}

const LIVE: StoragePathRef = { role: "database", identity: "live" };
const ROOT: StoragePathRef = { role: "backup_root", identity: "configured" };
const bundleRef = (id: BackupId): StoragePathRef => ({ role: "bundle", identity: id });

export async function backupOperation(context: StorageOperationContext & OperationCore): Promise<StorageAdminReceiptV1> {
  const ledger = new CheckLedger(context.operationId);
  const result = await createBackup(context, "manual", ledger);
  return receipt(context, [LIVE, ROOT, bundleRef(result.backupId)], {
    operation: "backup", result: "succeeded", backupId: result.backupId, reason: "manual",
    sourceStorageVersion: result.manifest.sourceStorageVersion, intendedStorageVersion: result.manifest.intendedStorageVersion,
    checks: ledger.compile(BACKUP_CHECKS),
  });
}

/** Read-only verification; needs no lock because it never touches the live database. */
export function verifyOperation(context: { readonly operationId: StorageOperationId; readonly applicationRevision: ApplicationRevision; readonly clock: ReceiptClock }, bundlePath: string): StorageAdminReceiptV1 {
  const ledger = new CheckLedger(context.operationId);
  const verified = verifyBundleInto(bundlePath, ledger);
  if (verified.disposition === "newer_than_application") throw refuse("STORAGE_NEWER_THAN_APPLICATION", "the bundle is intact but newer than this application", "newer_than_application");
  if (verified.disposition === "unsupported_old" || verified.disposition === "invalid") throw refuse("STORAGE_TOO_OLD", "the bundle is intact but has no supported migration chain", "unsupported_old");
  return receipt(context, [bundleRef(verified.manifest.backupId)], {
    operation: "verify", result: "succeeded", backupId: verified.manifest.backupId, compatibility: verified.disposition,
    sourceStorageVersion: verified.manifest.sourceStorageVersion, currentStorageVersion: STORAGE_VERSION,
    checks: ledger.compile(BACKUP_CHECKS),
  });
}

function refuseDisposition(verified: VerifiedBundle): void {
  if (verified.disposition === "newer_than_application") throw refuse("STORAGE_NEWER_THAN_APPLICATION", "the bundle is newer than this application", "newer_than_application");
  if (verified.disposition !== "current" && verified.disposition !== "upgradeable") throw refuse("STORAGE_TOO_OLD", "the bundle has no supported migration chain", "unsupported_old");
}

function confirmReplacement(context: StorageOperationContext, replaceExisting: boolean, confirmDatabase: string | undefined): boolean {
  const target = inspectDatabase(context.paths.database);
  if (target.kind === "absent") return false;
  if (!replaceExisting || confirmDatabase === undefined || resolve(confirmDatabase) !== context.paths.database || !isAbsolute(confirmDatabase)) {
    throw refuse("RESTORE_CONFIRMATION_REQUIRED", "replacing an existing database needs --replace-existing and --confirm-database <exact live path>");
  }
  return target.kind === "database";
}

export interface RestoreRequest {
  readonly bundlePath: string;
  readonly replaceExisting?: boolean;
  readonly confirmDatabase?: string;
}

export async function restoreOperation(context: StorageOperationContext & OperationCore, request: RestoreRequest): Promise<StorageAdminReceiptV1> {
  context.lock.assertHeldFor(context.paths);
  const ledger = new CheckLedger(context.operationId);
  const verified = verifyBundleInto(request.bundlePath, new CheckLedger(context.operationId));
  refuseDisposition(verified);
  const needsPreRestore = confirmReplacement(context, request.replaceExisting === true, request.confirmDatabase);
  const preRestore = needsPreRestore ? await createBackup(context, "pre_restore", new CheckLedger(context.operationId)) : undefined;
  const staged = stagingPath(context);
  const bundleDatabase = join(verified.path, "database.sqlite");
  try {
    stageCopy(bundleDatabase, staged);
    if (sha256File(staged) !== verified.manifest.database.sha256) throw fail("DIGEST_MISMATCH", "staged copy differs from the bundle");
    ledger.pass("digest");
    const upgrade = verified.disposition === "upgradeable";
    if (upgrade) {
      try { context.migrate(staged); } catch (error) { throw fail("MIGRATION_FAILED", `staged migration failed: ${(error as Error).message}`); }
    }
    makeStandalone(staged);
    checkDatabaseFile(staged, STORAGE_VERSION, ledger);
    passCompatibility(verified.manifest.sourceStorageVersion, ledger, ["current", "upgradeable"]);
    if (upgrade) checkMigrationInvariants(rowCounts(bundleDatabase), rowCounts(staged), verified.manifest.sourceStorageVersion, ledger);
    checkIdentityRetention(bundleDatabase, staged, ledger);
    install(context, staged, STORAGE_VERSION, "RESTORE_FAILED");
    const common = {
      operation: "restore" as const, result: "succeeded" as const, sourceBackupId: verified.manifest.backupId,
      preRestoreBackupId: preRestore?.backupId ?? null,
      sourceStorageVersion: verified.manifest.sourceStorageVersion, targetStorageVersion: STORAGE_VERSION,
    };
    const paths: StoragePathRef[] = [LIVE, bundleRef(verified.manifest.backupId), ...(preRestore === undefined ? [] : [ROOT, bundleRef(preRestore.backupId)])];
    return upgrade
      ? receipt(context, paths, { ...common, migration: "applied", checks: ledger.compile(RESTORE_UPGRADED_CHECKS) })
      : receipt(context, paths, { ...common, migration: "not_required", checks: ledger.compile(RESTORE_CURRENT_CHECKS) });
  } finally {
    removeStaged(staged);
  }
}

/**
 * Rollback to a prior release (§7 last-known-good): installs a verified bundle's bytes UNCHANGED —
 * no migration — so the image declared compatible with that bundle (its `applicationRevision`) can
 * start. This image cannot read an older version; it would upgrade it again on its next start.
 */
export async function rollbackOperation(context: StorageOperationContext & OperationCore, request: Required<Pick<RestoreRequest, "bundlePath" | "confirmDatabase">>): Promise<StorageAdminReceiptV1> {
  context.lock.assertHeldFor(context.paths);
  const ledger = new CheckLedger(context.operationId);
  const verified = verifyBundleInto(request.bundlePath, new CheckLedger(context.operationId));
  refuseDisposition(verified);
  const needsPreRestore = confirmReplacement(context, true, request.confirmDatabase);
  const preRestore = needsPreRestore ? await createBackup(context, "pre_restore", new CheckLedger(context.operationId)) : undefined;
  const staged = stagingPath(context);
  const bundleDatabase = join(verified.path, "database.sqlite");
  const version = verified.manifest.sourceStorageVersion;
  try {
    stageCopy(bundleDatabase, staged);
    if (sha256File(staged) !== verified.manifest.database.sha256) throw fail("DIGEST_MISMATCH", "staged copy differs from the bundle");
    ledger.pass("digest");
    checkDatabaseFile(staged, version, ledger);
    passCompatibility(version, ledger, ["current", "upgradeable"]);
    checkIdentityRetention(bundleDatabase, staged, ledger);
    install(context, staged, version, "RESTORE_FAILED");
    return receipt(context, [LIVE, bundleRef(verified.manifest.backupId), ...(preRestore === undefined ? [] : [ROOT, bundleRef(preRestore.backupId)])], {
      operation: "rollback", result: "succeeded", sourceBackupId: verified.manifest.backupId,
      preRestoreBackupId: preRestore?.backupId ?? null, targetStorageVersion: version,
      compatibleApplicationRevision: verified.manifest.applicationRevision,
      checks: ledger.compile(RESTORE_CURRENT_CHECKS),
    });
  } finally {
    removeStaged(staged);
  }
}

/**
 * Migration-safe startup (§6). Absent/empty → fresh (main creates the schema); current → read-only
 * checks; upgradeable → verified `pre_upgrade` bundle, staged migration, invariants and journalled
 * replacement. A newer or unsupported database refuses before WAL mode, schema creation or migration.
 */
export async function prepareStartOperation(context: StorageOperationContext & OperationCore): Promise<StorageAdminReceiptV1> {
  context.lock.assertHeldFor(context.paths);
  const ledger = new CheckLedger(context.operationId);
  const inspection = inspectDatabase(context.paths.database);
  if (inspection.kind !== "database") {
    ledger.pass("compatibility");
    return receipt(context, [LIVE], { operation: "prepare_start", result: "succeeded", action: "fresh", sourceStorageVersion: null, targetStorageVersion: STORAGE_VERSION, backupId: null, checks: ledger.compile(PREPARE_FRESH_CHECKS) });
  }
  const version = inspection.version;
  const disposition = compatibilityOf(version);
  if (disposition === "newer_than_application" || disposition === "unsupported_old") passCompatibility(version, ledger, []);
  if (disposition === "current") {
    checkDatabaseFile(context.paths.database, version, ledger);
    passCompatibility(version, ledger, ["current"]);
    return receipt(context, [LIVE], { operation: "prepare_start", result: "succeeded", action: "current", sourceStorageVersion: version, targetStorageVersion: STORAGE_VERSION, backupId: null, checks: ledger.compile(PREPARE_CURRENT_CHECKS) });
  }
  const snapshot = await createBackup(context, "pre_upgrade", new CheckLedger(context.operationId), STORAGE_VERSION);
  const bundleDatabase = join(snapshot.bundlePath, "database.sqlite");
  const staged = stagingPath(context);
  try {
    stageCopy(bundleDatabase, staged);
    if (sha256File(staged) !== snapshot.manifest.database.sha256) throw fail("DIGEST_MISMATCH", "staged copy differs from the pre-upgrade bundle");
    ledger.pass("digest");
    try { context.migrate(staged); } catch (error) {
      throw fail("MIGRATION_FAILED", `staged migration failed: ${(error as Error).message}; the live database is unchanged and pre-upgrade bundle ${snapshot.backupId} is retained`);
    }
    makeStandalone(staged);
    checkDatabaseFile(staged, STORAGE_VERSION, ledger);
    passCompatibility(version, ledger, ["upgradeable"]);
    checkMigrationInvariants(rowCounts(bundleDatabase), rowCounts(staged), version, ledger);
    install(context, staged, STORAGE_VERSION, "MIGRATION_FAILED");
    return receipt(context, [LIVE, ROOT, bundleRef(snapshot.backupId)], { operation: "prepare_start", result: "succeeded", action: "upgraded", sourceStorageVersion: version, targetStorageVersion: STORAGE_VERSION, backupId: snapshot.backupId, checks: ledger.compile(PREPARE_UPGRADED_CHECKS) });
  } finally {
    removeStaged(staged);
  }
}

/** The one readiness body `/readyz` serves; anything else cannot earn readiness (§6, [[D2728]]). */
export function readyBody(storageVersion: number): string {
  return canonicalJson({ representativeData: "ok", status: "ready", storageVersion });
}

export interface RehearsalApplication {
  readonly origin: string;
  close(): Promise<void>;
}

/**
 * Upgrade rehearsal (§8): restores the bundle into a disposable database, starts the real
 * application on it, probes the live `/readyz` route and destroys only its own disposable state.
 * It never touches the configured production database.
 */
export async function rehearsalOperation(
  context: { readonly operationId: StorageOperationId; readonly applicationRevision: ApplicationRevision; readonly clock: ReceiptClock; readonly migrate: (path: string) => void },
  request: { readonly bundlePath: string; readonly imageDigest: string | null; readonly start: (databasePath: string) => Promise<RehearsalApplication> },
): Promise<StorageAdminReceiptV1> {
  const directory = mkdtempSync(join(tmpdir(), "tabiya-rehearsal-"));
  try {
    const paths = resolveStoragePaths({ database: join(directory, "data", "chess-tabiya.sqlite"), backupRoot: join(directory, "backups") });
    const lock = StorageLock.acquire(paths);
    let restored: StorageAdminReceiptV1;
    try {
      restored = await restoreOperation({ ...context, lock, paths }, { bundlePath: request.bundlePath });
    } finally {
      lock.release();
    }
    if (restored.operation !== "restore" || restored.result !== "succeeded") throw fail("RESTORE_FAILED", "rehearsal restore did not succeed");
    const application = await request.start(paths.database);
    let body: string;
    let status: number;
    try {
      const response = await fetch(`${application.origin}/readyz`);
      status = response.status;
      body = await response.text();
    } finally {
      await application.close();
    }
    if (status !== 200 || body !== readyBody(STORAGE_VERSION)) throw fail("READINESS_FAILED", `/readyz returned ${status}`);
    const checks = [...restored.checks, "readiness"];
    const common = { operation: "rehearsal" as const, result: "succeeded" as const, sourceBackupId: restored.sourceBackupId, imageDigest: request.imageDigest, architecture: `${process.platform}/${process.arch}` };
    const paths2: StoragePathRef[] = [bundleRef(restored.sourceBackupId), { role: "volume", identity: "disposable_rehearsal" }];
    return restored.migration === "applied"
      ? receipt(context, paths2, { ...common, migration: "applied", checks: Object.freeze(checks) as unknown as typeof REHEARSAL_UPGRADED_CHECKS })
      : receipt(context, paths2, { ...common, migration: "not_required", checks: Object.freeze(checks) as unknown as typeof REHEARSAL_CURRENT_CHECKS });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export { REPLACEMENT_DIRECTORY };
