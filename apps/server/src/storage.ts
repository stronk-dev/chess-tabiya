import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import {
  RuntimeError,
  readBackReplay,
  type DrillRun,
  type DrillRunEvent,
  type ObjectiveState,
} from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";

export type RunRole = "host" | "participant" | "spectator";

export interface Learner {
  readonly id: string;
  readonly handle: string;
  readonly displayName?: string;
  readonly createdAt: string;
}

export interface StoredLearner extends Learner {
  readonly passwordHash: string;
  readonly failedAttempts: number;
  readonly lockedUntil?: string;
}

export interface NewLearner extends Learner {
  readonly passwordHash: string;
}

export interface RunGrant {
  readonly learnerId: string;
  readonly handle: string;
  readonly role: RunRole;
  readonly grantedAt: string;
}

export interface LeaseHolder {
  readonly writerId: string;
  readonly learnerId: string;
}

export interface LeaseIdentity {
  readonly learnerId: string;
  readonly handle: string;
}

export interface RunSummary {
  readonly id: string;
  readonly title: string;
  readonly packId: string;
  readonly updatedAt: string;
  readonly objectiveState: ObjectiveState;
  readonly branchCount: number;
  readonly viewerRole: RunRole;
  readonly leaseHeldBy: LeaseIdentity;
}

export interface StoredRun {
  readonly run: DrillRun;
  readonly activeWriterId: string;
  readonly activeWriterLearnerId: string;
}

/** Persistence boundary for run snapshots, identity, grants, and the writer lease. */
export interface RunStorage {
  create(run: DrillRun, lease: LeaseHolder, title?: string): void;
  read(runId: string): StoredRun | undefined;
  list(learnerId: string, limit: number, offset: number): readonly RunSummary[];
  save(run: DrillRun, lease: LeaseHolder): void;

  createLearner(input: NewLearner): Learner;
  learnerByHandle(handle: string): StoredLearner | undefined;
  learnerById(learnerId: string): Learner | undefined;
  recordLoginFailure(learnerId: string, at: string): void;
  clearLoginFailures(learnerId: string): void;
  deleteLearner(learnerId: string, at: string): void;

  createSession(learnerId: string, tokenHash: string, expiresAt: string): void;
  learnerBySessionToken(tokenHash: string, now: string): Learner | undefined;
  deleteSession(tokenHash: string): void;

  grants(runId: string): readonly RunGrant[];
  runRole(runId: string, learnerId: string): RunRole | undefined;
  grantRole(
    runId: string,
    learnerId: string,
    role: RunRole,
    actor: LeaseHolder,
    at: string,
  ): void;
  revokeGrant(runId: string, learnerId: string, actor: LeaseHolder): void;
  claimLease(runId: string, lease: LeaseHolder): void;
  close(): void;
}

interface RunRow {
  readonly id: string;
  readonly snapshot_json: string;
  readonly active_writer_id: string;
  readonly active_writer_learner_id: string;
}

interface SummaryFields {
  readonly title: string;
  readonly packId: string;
  readonly updatedAt: string;
  readonly objectiveState: ObjectiveState;
  readonly branchCount: number;
}

interface SummaryRow {
  readonly id: string;
  readonly summary_json: string;
  readonly viewer_role: string;
  readonly lease_learner_id: string;
  readonly lease_handle: string;
}

interface LearnerRow {
  readonly id: string;
  readonly handle: string;
  readonly display_name: string | null;
  readonly password_hash: string;
  readonly failed_attempts: number;
  readonly locked_until: string | null;
  readonly created_at: string;
}

export interface StorageMigrationLog {
  readonly version: number;
  readonly name: string;
}

export interface SQLiteRunStorageOptions {
  readonly now?: () => string;
  readonly onMigration?: (entry: StorageMigrationLog) => void;
}

const STORAGE_VERSION = 2;
const LEGACY_ID = "__legacy";
const LEGACY_HASH = "!";

function isRunRole(value: unknown): value is RunRole {
  return value === "host" || value === "participant" || value === "spectator";
}

function mayWrite(role: RunRole): boolean {
  return role === "host" || role === "participant";
}

function isRunRow(value: unknown): value is RunRow {
  if (value === null || typeof value !== "object") return false;
  const row = value as Partial<RunRow>;
  return (
    typeof row.id === "string" &&
    typeof row.snapshot_json === "string" &&
    typeof row.active_writer_id === "string" &&
    typeof row.active_writer_learner_id === "string"
  );
}

function isSummaryRow(value: unknown): value is SummaryRow {
  if (value === null || typeof value !== "object") return false;
  const row = value as Partial<SummaryRow>;
  return (
    typeof row.id === "string" &&
    typeof row.summary_json === "string" &&
    typeof row.viewer_role === "string" &&
    typeof row.lease_learner_id === "string" &&
    typeof row.lease_handle === "string"
  );
}

function isLearnerRow(value: unknown): value is LearnerRow {
  if (value === null || typeof value !== "object") return false;
  const row = value as Partial<LearnerRow>;
  return (
    typeof row.id === "string" &&
    typeof row.handle === "string" &&
    (typeof row.display_name === "string" || row.display_name === null) &&
    typeof row.password_hash === "string" &&
    Number.isSafeInteger(row.failed_attempts) &&
    (typeof row.locked_until === "string" || row.locked_until === null) &&
    typeof row.created_at === "string"
  );
}

function learner(row: LearnerRow): Learner {
  return Object.freeze({
    id: row.id,
    handle: row.handle,
    ...(row.display_name === null ? {} : { displayName: row.display_name }),
    createdAt: row.created_at,
  });
}

function storedLearner(row: LearnerRow): StoredLearner {
  return Object.freeze({
    ...learner(row),
    passwordHash: row.password_hash,
    failedAttempts: row.failed_attempts,
    ...(row.locked_until === null ? {} : { lockedUntil: row.locked_until }),
  });
}

function isObjectiveState(value: unknown): value is ObjectiveState {
  return (
    value === "active" ||
    value === "preserved" ||
    value === "degraded" ||
    value === "failed" ||
    value === "achieved" ||
    value === "transitioned"
  );
}

function parseSummary(value: string): SummaryFields {
  const parsed = JSON.parse(value) as Partial<SummaryFields>;
  if (
    typeof parsed.title !== "string" ||
    typeof parsed.packId !== "string" ||
    typeof parsed.updatedAt !== "string" ||
    !isObjectiveState(parsed.objectiveState) ||
    !Number.isSafeInteger(parsed.branchCount) ||
    (parsed.branchCount ?? 0) < 1
  ) {
    throw new TypeError("Stored run summary has an invalid shape");
  }
  return Object.freeze({
    title: parsed.title,
    packId: parsed.packId,
    updatedAt: parsed.updatedAt,
    objectiveState: parsed.objectiveState,
    branchCount: parsed.branchCount!,
  });
}

function activeObjectiveState(run: DrillRun): ObjectiveState {
  const node = run.nodes.find((candidate) => candidate.id === run.activeCursor.nodeId);
  if (node === undefined) throw new TypeError("Run active cursor has no node");
  return node.objectiveState;
}

function summaryFields(
  run: DrillRun,
  title: string,
  updatedAt: string,
): SummaryFields {
  return Object.freeze({
    title,
    packId: run.packId,
    updatedAt,
    objectiveState: activeObjectiveState(run),
    branchCount: run.branches.length,
  });
}

function notActiveWriter(writerId: string): RuntimeError {
  return new RuntimeError(
    "NOT_ACTIVE_WRITER",
    `Writer ${writerId} does not hold the run lease`,
  );
}

function userVersion(database: DatabaseSync): number {
  const value = database.prepare("PRAGMA user_version").get();
  if (value === undefined || typeof value !== "object") {
    throw new TypeError("Could not read SQLite user_version");
  }
  const version = (value as Record<string, unknown>).user_version;
  if (typeof version !== "number" || !Number.isSafeInteger(version)) {
    throw new TypeError("SQLite user_version is invalid");
  }
  return version;
}

function storageFailure(message: string, cause: unknown): ServerError {
  return new ServerError("STORAGE_FAILURE", message, { cause });
}

export class SQLiteRunStorage implements RunStorage {
  readonly #database: DatabaseSync;
  readonly #snapshots = new Map<string, StoredRun>();
  readonly #now: () => string;
  readonly #onMigration: (entry: StorageMigrationLog) => void;

  constructor(filename = ":memory:", options: SQLiteRunStorageOptions = {}) {
    this.#database = new DatabaseSync(filename);
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#onMigration =
      options.onMigration ??
      ((entry) => console.info(`storage migration ${entry.version}: ${entry.name}`));
    this.#database.exec("PRAGMA foreign_keys = ON");
    this.#database.exec("PRAGMA busy_timeout = 5000");
    if (filename !== ":memory:") this.#database.exec("PRAGMA journal_mode = WAL");
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS drill_runs (
        id TEXT PRIMARY KEY,
        snapshot_json TEXT NOT NULL,
        active_writer_id TEXT NOT NULL CHECK (length(active_writer_id) > 0),
        updated_at TEXT NOT NULL
      ) STRICT
    `);
    this.#migrate();
  }

  create(run: DrillRun, lease: LeaseHolder, title?: string): void;
  /** @deprecated Test-harness compatibility; production always supplies a learner-bound lease. */
  create(run: DrillRun, writerId: string, title?: string): void;
  create(run: DrillRun, leaseInput: LeaseHolder | string, title = run.packId): void {
    const lease = this.#lease(leaseInput);
    const updatedAt = this.#now();
    const summary = summaryFields(run, title, updatedAt);
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      this.#database
        .prepare(
          `INSERT INTO drill_runs
             (id, snapshot_json, active_writer_id, updated_at, summary_json,
              owner_learner_id, active_writer_learner_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          run.id,
          JSON.stringify(run),
          lease.writerId,
          updatedAt,
          JSON.stringify(summary),
          lease.learnerId,
          lease.learnerId,
        );
      this.#database
        .prepare(
          `INSERT INTO run_grants (run_id, learner_id, role, granted_at)
           VALUES (?, ?, 'host', ?)`,
        )
        .run(run.id, lease.learnerId, updatedAt);
      this.#database.exec("COMMIT");
      this.#snapshots.set(
        run.id,
        Object.freeze({
          run,
          activeWriterId: lease.writerId,
          activeWriterLearnerId: lease.learnerId,
        }),
      );
    } catch (error) {
      this.#rollback();
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        throw new ServerError("RUN_ALREADY_EXISTS", `Run already exists: ${run.id}`, {
          cause: error,
        });
      }
      throw storageFailure("Could not create run", error);
    }
  }

  read(runId: string): StoredRun | undefined {
    const cached = this.#snapshots.get(runId);
    if (cached) return cached;

    let value: unknown;
    try {
      value = this.#database
        .prepare(
          `SELECT id, snapshot_json, active_writer_id, active_writer_learner_id
           FROM drill_runs WHERE id = ?`,
        )
        .get(runId);
    } catch (error) {
      throw storageFailure("Could not read run", error);
    }
    if (value === undefined) return undefined;
    if (!isRunRow(value)) {
      throw new ServerError("STORAGE_FAILURE", "Stored run row has an invalid shape");
    }

    try {
      const snapshot = JSON.parse(value.snapshot_json) as { events?: unknown };
      if (!Array.isArray(snapshot.events)) throw new TypeError("Snapshot has no events");
      const run = readBackReplay(snapshot.events as readonly DrillRunEvent[]).run;
      if (run.id !== value.id) throw new TypeError("Snapshot id does not match row id");
      const stored = Object.freeze({
        run,
        activeWriterId: value.active_writer_id,
        activeWriterLearnerId: value.active_writer_learner_id,
      });
      this.#snapshots.set(runId, stored);
      return stored;
    } catch (error) {
      throw storageFailure("Stored run snapshot failed replay", error);
    }
  }

  list(learnerId: string, limit: number, offset: number): readonly RunSummary[];
  /** @deprecated Test-harness compatibility for pre-F3 storage tests. */
  list(limit: number, offset: number): readonly RunSummary[];
  list(
    learnerIdOrLimit: string | number,
    limitOrOffset: number,
    maybeOffset?: number,
  ): readonly RunSummary[] {
    const learnerId = typeof learnerIdOrLimit === "string" ? learnerIdOrLimit : LEGACY_ID;
    const limit = typeof learnerIdOrLimit === "number" ? learnerIdOrLimit : limitOrOffset;
    const offset = typeof learnerIdOrLimit === "number" ? limitOrOffset : maybeOffset!;
    if (!Number.isSafeInteger(limit) || limit < 1) {
      throw new TypeError("Run list limit must be a positive safe integer");
    }
    if (!Number.isSafeInteger(offset) || offset < 0) {
      throw new TypeError("Run list offset must be a non-negative safe integer");
    }
    let values: unknown[];
    try {
      values = this.#database
        .prepare(
          `SELECT r.id, r.summary_json, g.role AS viewer_role,
                  holder.id AS lease_learner_id, holder.handle AS lease_handle
           FROM drill_runs r
           JOIN run_grants g ON g.run_id = r.id AND g.learner_id = ?
           JOIN learners holder ON holder.id = r.active_writer_learner_id
           ORDER BY r.updated_at DESC, r.id ASC
           LIMIT ? OFFSET ?`,
        )
        .all(learnerId, limit, offset);
    } catch (error) {
      throw storageFailure("Could not list runs", error);
    }

    try {
      return Object.freeze(
        values.map((value) => {
          if (!isSummaryRow(value) || !isRunRole(value.viewer_role)) {
            throw new TypeError("Stored summary row is invalid");
          }
          return Object.freeze({
            id: value.id,
            ...parseSummary(value.summary_json),
            viewerRole: value.viewer_role,
            leaseHeldBy: Object.freeze({
              learnerId: value.lease_learner_id,
              handle: value.lease_handle,
            }),
          });
        }),
      );
    } catch (error) {
      throw storageFailure("Stored run summary is invalid", error);
    }
  }

  save(run: DrillRun, lease: LeaseHolder): void;
  /** @deprecated Test-harness compatibility; production always supplies a learner-bound lease. */
  save(run: DrillRun, writerId: string): void;
  save(run: DrillRun, leaseInput: LeaseHolder | string): void {
    const lease = this.#lease(leaseInput);
    try {
      const row = this.#database
        .prepare("SELECT summary_json FROM drill_runs WHERE id = ?")
        .get(run.id) as { readonly summary_json?: unknown } | undefined;
      if (row === undefined) {
        throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${run.id}`);
      }
      if (typeof row.summary_json !== "string") {
        throw new TypeError("Stored run summary is missing");
      }
      const title = parseSummary(row.summary_json).title;
      const updatedAt = this.#now();
      const result = this.#database
        .prepare(
          `UPDATE drill_runs
           SET snapshot_json = ?, updated_at = ?, summary_json = ?
           WHERE id = ? AND active_writer_id = ? AND active_writer_learner_id = ?`,
        )
        .run(
          JSON.stringify(run),
          updatedAt,
          JSON.stringify(summaryFields(run, title, updatedAt)),
          run.id,
          lease.writerId,
          lease.learnerId,
        );
      if (result.changes === 1) {
        this.#snapshots.set(
          run.id,
          Object.freeze({
            run,
            activeWriterId: lease.writerId,
            activeWriterLearnerId: lease.learnerId,
          }),
        );
        return;
      }
    } catch (error) {
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not save run", error);
    }

    const existing = this.read(run.id);
    if (!existing) throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${run.id}`);
    throw notActiveWriter(lease.writerId);
  }

  createLearner(input: NewLearner): Learner {
    try {
      this.#database
        .prepare(
          `INSERT INTO learners
             (id, handle, display_name, password_hash, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(
          input.id,
          input.handle,
          input.displayName ?? null,
          input.passwordHash,
          input.createdAt,
        );
      return Object.freeze({
        id: input.id,
        handle: input.handle,
        ...(input.displayName === undefined ? {} : { displayName: input.displayName }),
        createdAt: input.createdAt,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        throw new ServerError("INVALID_REQUEST", `Handle is already registered: ${input.handle}`);
      }
      throw storageFailure("Could not create learner", error);
    }
  }

  learnerByHandle(handle: string): StoredLearner | undefined {
    try {
      const value = this.#database
        .prepare(
          `SELECT id, handle, display_name, password_hash, failed_attempts,
                  locked_until, created_at
           FROM learners WHERE handle = ?`,
        )
        .get(handle);
      if (value === undefined) return undefined;
      if (!isLearnerRow(value)) throw new TypeError("Stored learner row is invalid");
      return storedLearner(value);
    } catch (error) {
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not read learner", error);
    }
  }

  learnerById(learnerId: string): Learner | undefined {
    try {
      const value = this.#database
        .prepare(
          `SELECT id, handle, display_name, password_hash, failed_attempts,
                  locked_until, created_at
           FROM learners WHERE id = ?`,
        )
        .get(learnerId);
      if (value === undefined) return undefined;
      if (!isLearnerRow(value)) throw new TypeError("Stored learner row is invalid");
      return learner(value);
    } catch (error) {
      throw storageFailure("Could not read learner", error);
    }
  }

  recordLoginFailure(learnerId: string, at: string): void {
    const lockedUntil = new Date(Date.parse(at) + 15 * 60_000).toISOString();
    try {
      this.#database
        .prepare(
          `UPDATE learners
           SET failed_attempts = failed_attempts + 1,
               locked_until = CASE WHEN failed_attempts + 1 >= 10 THEN ? ELSE NULL END
           WHERE id = ?`,
        )
        .run(lockedUntil, learnerId);
    } catch (error) {
      throw storageFailure("Could not record login failure", error);
    }
  }

  clearLoginFailures(learnerId: string): void {
    try {
      this.#database
        .prepare("UPDATE learners SET failed_attempts = 0, locked_until = NULL WHERE id = ?")
        .run(learnerId);
    } catch (error) {
      throw storageFailure("Could not clear login failures", error);
    }
  }

  deleteLearner(learnerId: string, at: string): void {
    const legacyWriterId = `writer-legacy-${randomUUID()}`;
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      this.#insertLegacy(at);
      const onlyHostRuns = this.#database
        .prepare(
          `SELECT mine.run_id
           FROM run_grants mine
           WHERE mine.learner_id = ? AND mine.role = 'host'
             AND 1 = (SELECT count(*) FROM run_grants hosts
                      WHERE hosts.run_id = mine.run_id AND hosts.role = 'host')`,
        )
        .all(learnerId) as unknown as readonly { readonly run_id: string }[];
      const activeRuns = this.#database
        .prepare("SELECT id FROM drill_runs WHERE active_writer_learner_id = ?")
        .all(learnerId) as unknown as readonly { readonly id: string }[];
      this.#database
        .prepare("UPDATE drill_runs SET owner_learner_id = ? WHERE owner_learner_id = ?")
        .run(LEGACY_ID, learnerId);
      this.#database
        .prepare(
          `UPDATE drill_runs
           SET active_writer_learner_id = ?, active_writer_id = ?
           WHERE active_writer_learner_id = ?`,
        )
        .run(LEGACY_ID, legacyWriterId, learnerId);
      this.#database.prepare("DELETE FROM learners WHERE id = ?").run(learnerId);
      const restore = this.#database.prepare(
        `INSERT OR IGNORE INTO run_grants (run_id, learner_id, role, granted_at)
         VALUES (?, ?, 'host', ?)`,
      );
      for (const row of onlyHostRuns) restore.run(row.run_id, LEGACY_ID, at);
      this.#database.exec("COMMIT");
      for (const row of activeRuns) this.#snapshots.delete(row.id);
    } catch (error) {
      this.#rollback();
      throw storageFailure("Could not delete learner", error);
    }
  }

  createSession(learnerId: string, tokenHash: string, expiresAt: string): void {
    try {
      this.#database
        .prepare(
          `INSERT INTO learner_sessions
             (token_hash, learner_id, created_at, expires_at)
           VALUES (?, ?, ?, ?)`,
        )
        .run(tokenHash, learnerId, this.#now(), expiresAt);
    } catch (error) {
      throw storageFailure("Could not create learner session", error);
    }
  }

  learnerBySessionToken(tokenHash: string, now: string): Learner | undefined {
    try {
      const value = this.#database
        .prepare(
          `SELECT l.id, l.handle, l.display_name, l.password_hash,
                  l.failed_attempts, l.locked_until, l.created_at, s.expires_at
           FROM learner_sessions s
           JOIN learners l ON l.id = s.learner_id
           WHERE s.token_hash = ?`,
        )
        .get(tokenHash) as (LearnerRow & { readonly expires_at: string }) | undefined;
      if (value === undefined) return undefined;
      if (!isLearnerRow(value) || typeof value.expires_at !== "string") {
        throw new TypeError("Stored session row is invalid");
      }
      if (value.expires_at <= now) {
        this.deleteSession(tokenHash);
        return undefined;
      }
      return learner(value);
    } catch (error) {
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not read learner session", error);
    }
  }

  deleteSession(tokenHash: string): void {
    try {
      this.#database.prepare("DELETE FROM learner_sessions WHERE token_hash = ?").run(tokenHash);
    } catch (error) {
      throw storageFailure("Could not delete learner session", error);
    }
  }

  grants(runId: string): readonly RunGrant[] {
    try {
      const rows = this.#database
        .prepare(
          `SELECT g.learner_id, l.handle, g.role, g.granted_at
           FROM run_grants g JOIN learners l ON l.id = g.learner_id
           WHERE g.run_id = ? ORDER BY l.handle ASC`,
        )
        .all(runId) as readonly Record<string, unknown>[];
      return Object.freeze(
        rows.map((row) => {
          if (
            typeof row.learner_id !== "string" ||
            typeof row.handle !== "string" ||
            !isRunRole(row.role) ||
            typeof row.granted_at !== "string"
          ) {
            throw new TypeError("Stored run grant is invalid");
          }
          return Object.freeze({
            learnerId: row.learner_id,
            handle: row.handle,
            role: row.role,
            grantedAt: row.granted_at,
          });
        }),
      );
    } catch (error) {
      throw storageFailure("Could not list run grants", error);
    }
  }

  runRole(runId: string, learnerId: string): RunRole | undefined {
    try {
      const value = this.#database
        .prepare("SELECT role FROM run_grants WHERE run_id = ? AND learner_id = ?")
        .get(runId, learnerId) as { readonly role?: unknown } | undefined;
      if (value === undefined) return undefined;
      if (!isRunRole(value.role)) throw new TypeError("Stored run role is invalid");
      return value.role;
    } catch (error) {
      throw storageFailure("Could not read run role", error);
    }
  }

  grantRole(
    runId: string,
    learnerId: string,
    role: RunRole,
    actor: LeaseHolder,
    at: string,
  ): void {
    this.#mutateGrant(runId, learnerId, role, actor, at);
  }

  revokeGrant(runId: string, learnerId: string, actor: LeaseHolder): void {
    this.#mutateGrant(runId, learnerId, undefined, actor, this.#now());
  }

  claimLease(runId: string, lease: LeaseHolder): void {
    try {
      const role = this.runRole(runId, lease.learnerId);
      if (role === undefined) throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);
      if (!mayWrite(role)) {
        throw new ServerError("FORBIDDEN", "This learner may not claim the run lease");
      }
      const result = this.#database
        .prepare(
          `UPDATE drill_runs SET active_writer_id = ?, active_writer_learner_id = ?
           WHERE id = ?`,
        )
        .run(lease.writerId, lease.learnerId, runId);
      if (result.changes !== 1) throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);
      this.#setCachedLease(runId, lease);
    } catch (error) {
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not claim run lease", error);
    }
  }

  /** Evicts only memoized projections; useful for cold-load diagnostics. */
  clearSnapshotCache(): void {
    this.#snapshots.clear();
  }

  close(): void {
    this.#snapshots.clear();
    this.#database.close();
  }

  #mutateGrant(
    runId: string,
    targetLearnerId: string,
    role: RunRole | undefined,
    actor: LeaseHolder,
    at: string,
  ): void {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const actorRole = this.#roleInTransaction(runId, actor.learnerId);
      if (actorRole !== "host") {
        throw new ServerError(
          actorRole === undefined ? "RUN_NOT_FOUND" : "FORBIDDEN",
          actorRole === undefined ? `Unknown run: ${runId}` : "Only a host may manage grants",
        );
      }
      const targetRole = this.#roleInTransaction(runId, targetLearnerId);
      const run = this.#database
        .prepare(
          `SELECT active_writer_id, active_writer_learner_id
           FROM drill_runs WHERE id = ?`,
        )
        .get(runId) as
        | { readonly active_writer_id: string; readonly active_writer_learner_id: string }
        | undefined;
      if (run === undefined) throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);

      const removingHost = targetRole === "host" && role !== "host";
      if (removingHost) {
        const count = this.#database
          .prepare("SELECT count(*) AS count FROM run_grants WHERE run_id = ? AND role = 'host'")
          .get(runId) as { readonly count: number };
        if (count.count <= 1) {
          throw new ServerError("INVALID_REQUEST", "A run must retain at least one host");
        }
      }
      const targetHoldsLease = run.active_writer_learner_id === targetLearnerId;
      const removesWrite = role === undefined || !mayWrite(role);
      if (targetHoldsLease && removesWrite && targetLearnerId === actor.learnerId) {
        throw new ServerError(
          "INVALID_REQUEST",
          "A host holding the board cannot remove their own write access",
        );
      }

      if (role === undefined) {
        if (targetRole === undefined) {
          throw new ServerError("INVALID_REQUEST", "Learner has no grant on this run");
        }
        this.#database
          .prepare("DELETE FROM run_grants WHERE run_id = ? AND learner_id = ?")
          .run(runId, targetLearnerId);
      } else {
        this.#database
          .prepare(
            `INSERT INTO run_grants (run_id, learner_id, role, granted_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(run_id, learner_id)
             DO UPDATE SET role = excluded.role, granted_at = excluded.granted_at`,
          )
          .run(runId, targetLearnerId, role, at);
      }

      let transferred = false;
      if (targetHoldsLease && removesWrite) {
        this.#database
          .prepare(
            `UPDATE drill_runs
             SET active_writer_id = ?, active_writer_learner_id = ? WHERE id = ?`,
          )
          .run(actor.writerId, actor.learnerId, runId);
        transferred = true;
      }
      this.#database.exec("COMMIT");
      if (transferred) this.#setCachedLease(runId, actor);
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not update run grant", error);
    }
  }

  #roleInTransaction(runId: string, learnerId: string): RunRole | undefined {
    const value = this.#database
      .prepare("SELECT role FROM run_grants WHERE run_id = ? AND learner_id = ?")
      .get(runId, learnerId) as { readonly role?: unknown } | undefined;
    if (value === undefined) return undefined;
    if (!isRunRole(value.role)) throw new TypeError("Stored run role is invalid");
    return value.role;
  }

  #setCachedLease(runId: string, lease: LeaseHolder): void {
    const cached = this.#snapshots.get(runId);
    if (cached === undefined) return;
    this.#snapshots.set(
      runId,
      Object.freeze({
        run: cached.run,
        activeWriterId: lease.writerId,
        activeWriterLearnerId: lease.learnerId,
      }),
    );
  }

  #lease(value: LeaseHolder | string): LeaseHolder {
    if (typeof value !== "string") return value;
    if (this.learnerById(LEGACY_ID) === undefined) this.#insertLegacy(this.#now());
    return Object.freeze({ writerId: value, learnerId: LEGACY_ID });
  }

  #rollback(): void {
    try {
      this.#database.exec("ROLLBACK");
    } catch {
      // Preserve the primary failure when no transaction is active or rollback fails.
    }
  }

  #migrate(): void {
    let version = userVersion(this.#database);
    if (version > STORAGE_VERSION) {
      throw new ServerError(
        "STORAGE_FAILURE",
        `Database schema ${version} is newer than supported schema ${STORAGE_VERSION}`,
      );
    }
    const migrations = [
      {
        version: 1,
        name: "add and backfill run summaries",
        apply: () => this.#addRunSummaries(),
      },
      {
        version: 2,
        name: "learner identity and run grants",
        apply: () => this.#addLearnerIdentity(),
      },
    ] as const;
    for (const migration of migrations) {
      if (migration.version <= version) continue;
      try {
        this.#database.exec("BEGIN IMMEDIATE");
        migration.apply();
        this.#database.exec(`PRAGMA user_version = ${migration.version}`);
        this.#database.exec("COMMIT");
        version = migration.version;
        this.#onMigration({ version: migration.version, name: migration.name });
      } catch (error) {
        this.#rollback();
        throw storageFailure("Could not migrate run storage", error);
      }
    }
  }

  #addRunSummaries(): void {
    this.#database.exec("ALTER TABLE drill_runs ADD COLUMN summary_json TEXT");
    const rows = this.#database
      .prepare("SELECT id, snapshot_json, updated_at FROM drill_runs")
      .all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare(
      "UPDATE drill_runs SET summary_json = ? WHERE id = ?",
    );
    for (const row of rows) {
      if (
        typeof row.id !== "string" ||
        typeof row.snapshot_json !== "string" ||
        typeof row.updated_at !== "string"
      ) {
        throw new TypeError("Legacy run row has an invalid shape");
      }
      const snapshot = JSON.parse(row.snapshot_json) as { events?: unknown };
      if (!Array.isArray(snapshot.events)) throw new TypeError("Snapshot has no events");
      const run = readBackReplay(snapshot.events as readonly DrillRunEvent[]).run;
      if (run.id !== row.id) throw new TypeError("Snapshot id does not match row id");
      update.run(
        JSON.stringify(summaryFields(run, run.packId, row.updated_at)),
        row.id,
      );
    }
  }

  #addLearnerIdentity(): void {
    this.#database.exec(`
      CREATE TABLE learners (
        id TEXT PRIMARY KEY,
        handle TEXT NOT NULL UNIQUE,
        display_name TEXT,
        password_hash TEXT NOT NULL,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until TEXT,
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE learner_sessions (
        token_hash TEXT PRIMARY KEY,
        learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX learner_sessions_learner ON learner_sessions(learner_id);
      CREATE TABLE run_grants (
        run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
        learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('host','participant','spectator')),
        granted_at TEXT NOT NULL,
        PRIMARY KEY (run_id, learner_id)
      ) STRICT;
      CREATE INDEX run_grants_learner ON run_grants(learner_id);
      ALTER TABLE drill_runs ADD COLUMN owner_learner_id TEXT NOT NULL DEFAULT '__legacy';
      ALTER TABLE drill_runs ADD COLUMN active_writer_learner_id TEXT NOT NULL DEFAULT '__legacy';
    `);
    const count = this.#database.prepare("SELECT count(*) AS count FROM drill_runs").get() as {
      readonly count: number;
    };
    if (count.count === 0) return;
    const at = this.#now();
    this.#insertLegacy(at);
    this.#database
      .prepare(
        `INSERT INTO run_grants (run_id, learner_id, role, granted_at)
         SELECT id, ?, 'host', ? FROM drill_runs`,
      )
      .run(LEGACY_ID, at);
  }

  #insertLegacy(at: string): void {
    this.#database
      .prepare(
        `INSERT OR IGNORE INTO learners
           (id, handle, password_hash, created_at)
         VALUES (?, ?, ?, ?)`,
      )
      .run(LEGACY_ID, LEGACY_ID, LEGACY_HASH, at);
  }
}
