import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import {
  RuntimeError,
  readBackReplay,
  type DrillRun,
  type DrillRunEvent,
  type ObjectiveState,
} from "@chess-tabiya/runtime";
import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";

import { ServerError } from "./errors.js";
import { projectAttempts, type AttemptRow, type ConceptTagRow } from "./progress.js";

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
  readonly sessionKind: import("@chess-tabiya/runtime").RunSessionKind;
  readonly packId: string | null;
  readonly sessionDigest: string;
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

export interface StoredAttempt extends AttemptRow {
  readonly attemptNo: number;
}

export interface ScheduleRow {
  readonly id: string;
  readonly learnerId: string;
  readonly rootKey: string;
  readonly sessionKind: "pack" | "position";
  readonly packId: string | null;
  readonly rootTransposeKey: string;
  readonly kind: "blocked" | "varied";
  readonly variant: string | null;
  readonly origin: "auto" | "learner";
  readonly state: "pending" | "started" | "dismissed";
  readonly dueAt: string;
  readonly createdAt: string;
  readonly sourceRunId: string | null;
  readonly sourceNodeId: string | null;
  readonly startedRunId: string | null;
}

export interface ProgressStorage {
  upsertAttempts(attempts: readonly AttemptRow[], concepts: readonly ConceptTagRow[]): void;
  progress(learnerId: string): readonly StoredAttempt[];
  dueSchedules(learnerId: string, at?: string): readonly ScheduleRow[];
  pendingScheduleForRoot(learnerId: string, rootKey: string): ScheduleRow | undefined;
  createSchedule(input: Omit<ScheduleRow, "state" | "startedRunId">): ScheduleRow;
  markScheduleStarted(scheduleId: string, learnerId: string, runId: string): void;
  dismissSchedule(scheduleId: string, learnerId: string): void;
  ownerLearnerId(runId: string): string | undefined;
  related(learnerId: string, runId: string, transposeKey: string): readonly {
    readonly relation: "same_position" | "same_pack" | "same_concept_in_pack";
    readonly runId: string;
    readonly branchId: string;
    readonly attemptCount: number;
  }[];
  metrics(learnerId: string): {
    readonly voluntaryConceptReturns: readonly { readonly conceptKey: string; readonly count: number }[];
    readonly secondAttempts: readonly { readonly rootKey: string; readonly firstVerdict: string; readonly secondVerdict: string; readonly secondResult: string | null }[];
  };
}

interface RunRow {
  readonly id: string;
  readonly snapshot_json: string;
  readonly active_writer_id: string;
  readonly active_writer_learner_id: string;
}

interface SummaryFields {
  readonly title: string;
  readonly sessionKind: import("@chess-tabiya/runtime").RunSessionKind;
  readonly packId: string | null;
  readonly sessionDigest: string;
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

export const STORAGE_VERSION = 6;
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
    (typeof parsed.packId !== "string" && parsed.packId !== null) ||
    (parsed.sessionKind !== "pack" && parsed.sessionKind !== "position") ||
    typeof parsed.sessionDigest !== "string" ||
    typeof parsed.updatedAt !== "string" ||
    !isObjectiveState(parsed.objectiveState) ||
    !Number.isSafeInteger(parsed.branchCount) ||
    (parsed.branchCount ?? 0) < 1
  ) {
    throw new TypeError("Stored run summary has an invalid shape");
  }
  return Object.freeze({
    title: parsed.title,
    sessionKind: parsed.sessionKind,
    packId: parsed.packId,
    sessionDigest: parsed.sessionDigest,
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
    sessionKind: run.sessionKind,
    packId: run.packId,
    sessionDigest: run.sessionDigest,
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

export class SQLiteRunStorage implements RunStorage, ProgressStorage {
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
  create(run: DrillRun, leaseInput: LeaseHolder | string, title = run.packId ?? run.id): void {
    const lease = this.#lease(leaseInput);
    const updatedAt = this.#now();
    const summary = summaryFields(run, title, updatedAt);
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      this.#database
        .prepare(
          `INSERT INTO drill_runs
             (id, snapshot_json, active_writer_id, updated_at, summary_json,
              owner_learner_id, active_writer_learner_id, schema_version)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          run.id,
          JSON.stringify(run),
          lease.writerId,
          updatedAt,
          JSON.stringify(summary),
          lease.learnerId,
          lease.learnerId,
          run.schemaVersion,
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
           FROM drill_runs WHERE id = ? AND schema_version = ?`,
        )
        .get(runId, DRILL_RUN_SCHEMA_VERSION);
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
           WHERE r.schema_version = ?
           ORDER BY r.updated_at DESC, r.id ASC
           LIMIT ? OFFSET ?`,
        )
        .all(learnerId, DRILL_RUN_SCHEMA_VERSION, limit, offset);
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
           SET snapshot_json = ?, updated_at = ?, summary_json = ?, schema_version = ?
           WHERE id = ? AND active_writer_id = ? AND active_writer_learner_id = ?`,
        )
        .run(
          JSON.stringify(run),
          updatedAt,
          JSON.stringify(summaryFields(run, title, updatedAt)),
          run.schemaVersion,
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

  ownerLearnerId(runId: string): string | undefined {
    const row = this.#database
      .prepare("SELECT owner_learner_id FROM drill_runs WHERE id = ?")
      .get(runId) as { readonly owner_learner_id?: unknown } | undefined;
    return typeof row?.owner_learner_id === "string" ? row.owner_learner_id : undefined;
  }

  upsertAttempts(attempts: readonly AttemptRow[], concepts: readonly ConceptTagRow[]): void {
    if (attempts.length === 0) return;
    const affected = new Set<string>();
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const upsert = this.#database.prepare(`
        INSERT INTO attempts (
          run_id, branch_id, learner_id, session_kind, pack_id, pack_digest,
          root_key, root_node_id, root_transpose_key, branch_label, branch_intent,
          branch_seed, attempt_no, countable, graded, objective_state, verdict,
          result, user_ply_count, checkpoint_ids, origin, schedule_id,
          root_due_at_start, derived_from_run_id, started_at, ended_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(run_id, branch_id) DO UPDATE SET
          branch_label=excluded.branch_label, branch_intent=excluded.branch_intent,
          countable=excluded.countable, graded=excluded.graded,
          objective_state=excluded.objective_state, verdict=excluded.verdict,
          result=excluded.result, user_ply_count=excluded.user_ply_count,
          checkpoint_ids=excluded.checkpoint_ids, ended_at=excluded.ended_at
      `);
      for (const attempt of attempts) {
        affected.add(`${attempt.learnerId}\0${attempt.rootKey}`);
        upsert.run(
          attempt.runId, attempt.branchId, attempt.learnerId, attempt.sessionKind,
          attempt.packId, attempt.packDigest, attempt.rootKey, attempt.rootNodeId,
          attempt.rootTransposeKey, attempt.branchLabel, attempt.branchIntent,
          attempt.branchSeed, attempt.countable ? 1 : 0, attempt.graded ? 1 : 0,
          attempt.objectiveState, attempt.verdict, attempt.result,
          attempt.userPlyCount, JSON.stringify(attempt.checkpointIds), attempt.origin,
          attempt.scheduleId, attempt.rootDueAtStart, attempt.derivedFromRunId,
          attempt.startedAt, attempt.endedAt,
        );
      }
      const runIds = new Set(attempts.map((attempt) => attempt.runId));
      const deleteConcepts = this.#database.prepare("DELETE FROM attempt_concepts WHERE run_id = ?");
      for (const runId of runIds) deleteConcepts.run(runId);
      const insertConcept = this.#database.prepare(
        "INSERT INTO attempt_concepts (run_id, branch_id, pack_id, concept_key, label) VALUES (?, ?, ?, ?, ?)",
      );
      for (const concept of concepts) {
        insertConcept.run(concept.runId, concept.branchId, concept.packId, concept.conceptKey, concept.label);
      }
      for (const key of affected) {
        const split = key.indexOf("\0");
        const learnerId = key.slice(0, split);
        const rootKey = key.slice(split + 1);
        const rows = this.#database.prepare(
          `SELECT run_id, branch_id FROM attempts
           WHERE learner_id = ? AND root_key = ? AND countable = 1
           ORDER BY started_at, run_id, branch_id`,
        ).all(learnerId, rootKey) as unknown as readonly { run_id: string; branch_id: string }[];
        const number = this.#database.prepare(
          "UPDATE attempts SET attempt_no = ? WHERE run_id = ? AND branch_id = ?",
        );
        rows.forEach((row, index) => number.run(index + 1, row.run_id, row.branch_id));
        this.#refreshAutoSchedule(learnerId, rootKey);
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#rollback();
      throw storageFailure("Could not project progress", error);
    }
  }

  progress(learnerId: string): readonly StoredAttempt[] {
    const rows = this.#database.prepare(
      "SELECT * FROM attempts WHERE learner_id = ? ORDER BY ended_at DESC, run_id, branch_id",
    ).all(learnerId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map((row) => Object.freeze({
      runId: String(row.run_id), branchId: String(row.branch_id), learnerId: String(row.learner_id),
      sessionKind: row.session_kind as "pack" | "position",
      packId: row.pack_id === null ? null : String(row.pack_id),
      packDigest: row.pack_digest === null ? null : String(row.pack_digest),
      rootKey: String(row.root_key), rootNodeId: String(row.root_node_id),
      rootTransposeKey: String(row.root_transpose_key), branchLabel: String(row.branch_label),
      branchIntent: row.branch_intent === null ? null : String(row.branch_intent),
      branchSeed: Number(row.branch_seed), attemptNo: Number(row.attempt_no),
      countable: row.countable === 1, graded: row.graded === 1,
      objectiveState: row.objective_state as ObjectiveState,
      verdict: row.verdict as StoredAttempt["verdict"],
      result: row.result === null ? null : row.result as StoredAttempt["result"],
      userPlyCount: Number(row.user_ply_count),
      checkpointIds: Object.freeze(JSON.parse(String(row.checkpoint_ids)) as string[]),
      origin: row.origin as StoredAttempt["origin"],
      scheduleId: row.schedule_id === null ? null : String(row.schedule_id),
      rootDueAtStart: row.root_due_at_start === null ? null : String(row.root_due_at_start),
      derivedFromRunId: row.derived_from_run_id === null ? null : String(row.derived_from_run_id),
      startedAt: String(row.started_at), endedAt: String(row.ended_at),
    })));
  }

  dueSchedules(learnerId: string, at?: string): readonly ScheduleRow[] {
    const rows = this.#database.prepare(
      `SELECT * FROM schedules WHERE learner_id = ? AND state = 'pending'
       ${at === undefined ? "" : "AND due_at <= ?"}
       ORDER BY CASE kind WHEN 'blocked' THEN 0 ELSE 1 END, due_at, id`,
    ).all(...(at === undefined ? [learnerId] : [learnerId, at])) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map((row) => this.#scheduleRow(row)));
  }

  pendingScheduleForRoot(learnerId: string, rootKey: string): ScheduleRow | undefined {
    const row = this.#database.prepare(
      "SELECT * FROM schedules WHERE learner_id = ? AND root_key = ? AND state = 'pending' ORDER BY due_at LIMIT 1",
    ).get(learnerId, rootKey) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : this.#scheduleRow(row);
  }

  createSchedule(input: Omit<ScheduleRow, "state" | "startedRunId">): ScheduleRow {
    this.#database.prepare(`
      INSERT INTO schedules (id, learner_id, root_key, session_kind, pack_id,
        root_transpose_key, kind, variant, origin, state, due_at, created_at,
        source_run_id, source_node_id, started_run_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, NULL)
    `).run(input.id, input.learnerId, input.rootKey, input.sessionKind, input.packId,
      input.rootTransposeKey, input.kind, input.variant, input.origin, input.dueAt,
      input.createdAt, input.sourceRunId, input.sourceNodeId);
    return Object.freeze({ ...input, state: "pending", startedRunId: null });
  }

  markScheduleStarted(scheduleId: string, learnerId: string, runId: string): void {
    const result = this.#database.prepare(
      "UPDATE schedules SET state = 'started', started_run_id = ? WHERE id = ? AND learner_id = ? AND state = 'pending'",
    ).run(runId, scheduleId, learnerId);
    if (result.changes !== 1) throw new ServerError("RUN_NOT_FOUND", `Unknown pending schedule: ${scheduleId}`);
  }

  dismissSchedule(scheduleId: string, learnerId: string): void {
    const result = this.#database.prepare(
      "UPDATE schedules SET state = 'dismissed' WHERE id = ? AND learner_id = ? AND state = 'pending'",
    ).run(scheduleId, learnerId);
    if (result.changes !== 1) throw new ServerError("RUN_NOT_FOUND", `Unknown pending schedule: ${scheduleId}`);
  }

  related(learnerId: string, runId: string, transposeKey: string) {
    const source = this.#database.prepare(
      "SELECT pack_id FROM attempts WHERE learner_id = ? AND run_id = ? LIMIT 1",
    ).get(learnerId, runId) as { readonly pack_id?: unknown } | undefined;
    const packId = typeof source?.pack_id === "string" ? source.pack_id : null;
    const seen = new Set<string>();
    const result: Array<{ relation: "same_position" | "same_pack" | "same_concept_in_pack"; runId: string; branchId: string; attemptCount: number }> = [];
    const append = (relation: "same_position" | "same_pack" | "same_concept_in_pack", rows: readonly Record<string, unknown>[]) => {
      for (const row of rows) {
        const key = `${String(row.run_id)}\0${String(row.branch_id)}`;
        if (seen.has(key) || String(row.run_id) === runId) continue;
        seen.add(key);
        result.push({ relation, runId: String(row.run_id), branchId: String(row.branch_id), attemptCount: Number(row.attempt_count) });
        if (result.length === 3) return;
      }
    };
    append("same_position", this.#database.prepare(`
      SELECT run_id, branch_id, count(*) OVER (PARTITION BY root_key) AS attempt_count
      FROM attempts WHERE learner_id = ? AND root_transpose_key = ? AND countable = 1
      ORDER BY attempt_count, ended_at
    `).all(learnerId, transposeKey) as readonly Record<string, unknown>[]);
    if (result.length < 3 && packId !== null) append("same_pack", this.#database.prepare(`
      SELECT run_id, branch_id, count(*) OVER (PARTITION BY root_key) AS attempt_count
      FROM attempts WHERE learner_id = ? AND pack_id = ? AND countable = 1
      ORDER BY attempt_count, ended_at
    `).all(learnerId, packId) as readonly Record<string, unknown>[]);
    if (result.length < 3 && packId !== null) append("same_concept_in_pack", this.#database.prepare(`
      SELECT a.run_id, a.branch_id, count(*) OVER (PARTITION BY a.root_key) AS attempt_count
      FROM attempts a JOIN attempt_concepts c ON c.run_id = a.run_id AND c.branch_id = a.branch_id
      WHERE a.learner_id = ? AND a.pack_id = ? AND c.concept_key IN (
        SELECT concept_key FROM attempt_concepts WHERE run_id = ?
      ) AND a.countable = 1 ORDER BY attempt_count, a.ended_at
    `).all(learnerId, packId, runId) as readonly Record<string, unknown>[]);
    return Object.freeze(result.map((item) => Object.freeze(item)));
  }

  metrics(learnerId: string) {
    const voluntary = this.#database.prepare(`
      SELECT c.concept_key, count(*) AS total
      FROM attempts a JOIN attempt_concepts c ON c.run_id = a.run_id AND c.branch_id = a.branch_id
      WHERE a.learner_id = ? AND a.countable = 1 AND a.schedule_id IS NULL
        AND a.root_due_at_start IS NULL AND EXISTS (
          SELECT 1 FROM attempts earlier JOIN attempt_concepts ec
            ON ec.run_id = earlier.run_id AND ec.branch_id = earlier.branch_id
          WHERE earlier.learner_id = a.learner_id AND earlier.countable = 1
            AND ec.concept_key = c.concept_key
            AND (earlier.ended_at < a.ended_at OR
              (earlier.ended_at = a.ended_at AND (earlier.run_id < a.run_id OR
                (earlier.run_id = a.run_id AND earlier.branch_id < a.branch_id))))
        ) GROUP BY c.concept_key ORDER BY c.concept_key
    `).all(learnerId) as readonly Record<string, unknown>[];
    const second = this.#database.prepare(`
      SELECT first.root_key, first.verdict AS first_verdict,
        second.verdict AS second_verdict, second.result AS second_result
      FROM attempts first JOIN attempts second
        ON second.learner_id = first.learner_id AND second.root_key = first.root_key
        AND second.attempt_no = 2
      WHERE first.learner_id = ? AND first.attempt_no = 1
        AND first.countable = 1 AND second.countable = 1
        AND first.graded = 1 AND second.graded = 1 ORDER BY first.root_key
    `).all(learnerId) as readonly Record<string, unknown>[];
    return Object.freeze({
      voluntaryConceptReturns: Object.freeze(voluntary.map((row) => Object.freeze({ conceptKey: String(row.concept_key), count: Number(row.total) }))),
      secondAttempts: Object.freeze(second.map((row) => Object.freeze({
        rootKey: String(row.root_key), firstVerdict: String(row.first_verdict),
        secondVerdict: String(row.second_verdict), secondResult: row.second_result === null ? null : String(row.second_result),
      }))),
    });
  }

  #scheduleRow(row: Record<string, unknown>): ScheduleRow {
    return Object.freeze({
      id: String(row.id), learnerId: String(row.learner_id), rootKey: String(row.root_key),
      sessionKind: row.session_kind as "pack" | "position",
      packId: row.pack_id === null ? null : String(row.pack_id),
      rootTransposeKey: String(row.root_transpose_key), kind: row.kind as "blocked" | "varied",
      variant: row.variant === null ? null : String(row.variant), origin: row.origin as "auto" | "learner",
      state: row.state as "pending" | "started" | "dismissed", dueAt: String(row.due_at),
      createdAt: String(row.created_at), sourceRunId: row.source_run_id === null ? null : String(row.source_run_id),
      sourceNodeId: row.source_node_id === null ? null : String(row.source_node_id),
      startedRunId: row.started_run_id === null ? null : String(row.started_run_id),
    });
  }

  #refreshAutoSchedule(learnerId: string, rootKey: string): void {
    const history = this.#database.prepare(
      `SELECT * FROM attempts WHERE learner_id = ? AND root_key = ? AND countable = 1
       ORDER BY ended_at, run_id, branch_id`,
    ).all(learnerId, rootKey) as readonly Record<string, unknown>[];
    if (history.length === 0) return;
    const latest = history.at(-1)!;
    const previous = history.at(-2);
    const varied = latest.graded === 0 || (latest.verdict === "stable" && previous?.verdict === "stable");
    const trailingStable = varied && latest.graded === 1
      ? [...history].reverse().findIndex((row) => row.verdict !== "stable")
      : 0;
    const ladder = [1, 3, 7, 16, 35];
    const days = varied ? ladder[Math.min(Math.max(trailingStable - 1, history.length - 1, 0), 4)]! : 0;
    const dueAt = new Date(Date.parse(String(latest.ended_at)) + days * 86_400_000).toISOString();
    this.#database.prepare(`
      INSERT INTO schedules (id, learner_id, root_key, session_kind, pack_id,
        root_transpose_key, kind, variant, origin, state, due_at, created_at,
        source_run_id, source_node_id, started_run_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'auto', 'pending', ?, ?, ?, ?, NULL)
      ON CONFLICT(learner_id, root_key) WHERE state = 'pending' AND origin = 'auto'
      DO UPDATE SET kind=excluded.kind, due_at=excluded.due_at,
        source_run_id=excluded.source_run_id, source_node_id=excluded.source_node_id
    `).run(randomUUID(), learnerId, rootKey, String(latest.session_kind),
      latest.pack_id === null ? null : String(latest.pack_id),
      String(latest.root_transpose_key), varied ? "varied" : "blocked", dueAt, this.#now(),
      String(latest.run_id), String(latest.root_node_id));
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
      {
        version: 3,
        name: "quarantine pre-0.5 run snapshots",
        apply: () => this.#quarantineLegacyRuns(),
      },
      {
        version: 4,
        name: "upgrade v0.5 run snapshots to v0.6",
        apply: () => this.#upgradeV05Runs(),
      },
      {
        version: 5,
        name: "record policyModeApplied as unknown on v0.6 selections",
        apply: () => this.#upgradeV06Runs(),
      },
      {
        version: 6,
        name: "attempt records, concept tags, schedules, and history stats",
        apply: () => this.#addProgressTables(),
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

  #addProgressTables(): void {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS attempts (
        run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
        branch_id TEXT NOT NULL,
        learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        session_kind TEXT NOT NULL CHECK (session_kind IN ('pack','position')),
        pack_id TEXT,
        pack_digest TEXT,
        root_key TEXT NOT NULL,
        root_node_id TEXT NOT NULL,
        root_transpose_key TEXT NOT NULL,
        branch_label TEXT NOT NULL,
        branch_intent TEXT,
        branch_seed INTEGER NOT NULL,
        attempt_no INTEGER NOT NULL,
        countable INTEGER NOT NULL CHECK (countable IN (0,1)),
        graded INTEGER NOT NULL CHECK (graded IN (0,1)),
        objective_state TEXT NOT NULL,
        verdict TEXT NOT NULL CHECK (verdict IN ('stable','unstable','open')),
        result TEXT CHECK (result IN ('win','loss','draw')),
        user_ply_count INTEGER NOT NULL,
        checkpoint_ids TEXT NOT NULL,
        origin TEXT NOT NULL CHECK (origin IN ('fresh','duplicate','scheduled','in_run_retry')),
        schedule_id TEXT,
        root_due_at_start TEXT,
        derived_from_run_id TEXT,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        PRIMARY KEY (run_id, branch_id)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS attempts_root ON attempts(learner_id, root_key, ended_at);
      CREATE INDEX IF NOT EXISTS attempts_transpose ON attempts(learner_id, root_transpose_key);
      CREATE INDEX IF NOT EXISTS attempts_pack ON attempts(learner_id, pack_id);
      CREATE TABLE IF NOT EXISTS attempt_concepts (
        run_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        pack_id TEXT NOT NULL,
        concept_key TEXT NOT NULL,
        label TEXT NOT NULL,
        PRIMARY KEY (run_id, branch_id, concept_key),
        FOREIGN KEY (run_id, branch_id) REFERENCES attempts(run_id, branch_id) ON DELETE CASCADE
      ) STRICT;
      CREATE INDEX IF NOT EXISTS attempt_concepts_key ON attempt_concepts(concept_key);
      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        root_key TEXT NOT NULL,
        session_kind TEXT NOT NULL CHECK (session_kind IN ('pack','position')),
        pack_id TEXT,
        root_transpose_key TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('blocked','varied')),
        variant TEXT,
        origin TEXT NOT NULL CHECK (origin IN ('auto','learner')),
        state TEXT NOT NULL CHECK (state IN ('pending','started','dismissed')),
        due_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        source_run_id TEXT,
        source_node_id TEXT,
        started_run_id TEXT
      ) STRICT;
      CREATE UNIQUE INDEX IF NOT EXISTS schedules_one_auto_pending
        ON schedules(learner_id, root_key) WHERE state = 'pending' AND origin = 'auto';
      CREATE INDEX IF NOT EXISTS schedules_due ON schedules(learner_id, state, due_at);
      CREATE TABLE IF NOT EXISTS learner_position_stats (
        learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        transpose_key TEXT NOT NULL,
        seen_count INTEGER NOT NULL,
        PRIMARY KEY (learner_id, transpose_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS progress_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
    `);
    const rows = this.#database.prepare(
      "SELECT snapshot_json, owner_learner_id FROM drill_runs ORDER BY id",
    ).all() as readonly Record<string, unknown>[];
    const insert = this.#database.prepare(`
      INSERT OR IGNORE INTO attempts (
        run_id, branch_id, learner_id, session_kind, pack_id, pack_digest,
        root_key, root_node_id, root_transpose_key, branch_label, branch_intent,
        branch_seed, attempt_no, countable, graded, objective_state, verdict,
        result, user_ply_count, checkpoint_ids, origin, schedule_id,
        root_due_at_start, derived_from_run_id, started_at, ended_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)
    `);
    for (const row of rows) {
      if (typeof row.snapshot_json !== "string" || typeof row.owner_learner_id !== "string") continue;
      const run = JSON.parse(row.snapshot_json) as DrillRun;
      const projection = projectAttempts({ run, learnerId: row.owner_learner_id });
      for (const attempt of projection.attempts) {
        insert.run(
          attempt.runId, attempt.branchId, attempt.learnerId, attempt.sessionKind,
          attempt.packId, attempt.packDigest, attempt.rootKey, attempt.rootNodeId,
          attempt.rootTransposeKey, attempt.branchLabel, attempt.branchIntent,
          attempt.branchSeed, attempt.countable ? 1 : 0, 0, attempt.objectiveState,
          "open", attempt.result, attempt.userPlyCount,
          JSON.stringify(attempt.checkpointIds), attempt.origin,
          attempt.startedAt, attempt.endedAt,
        );
      }
    }
    this.#database.exec(`
      UPDATE attempts AS current
      SET attempt_no = (
        SELECT COUNT(*) FROM attempts AS earlier
        WHERE earlier.learner_id = current.learner_id
          AND earlier.root_key = current.root_key
          AND earlier.countable = 1
          AND (earlier.started_at < current.started_at OR
            (earlier.started_at = current.started_at AND
              (earlier.run_id < current.run_id OR
                (earlier.run_id = current.run_id AND earlier.branch_id <= current.branch_id))))
      )
      WHERE current.countable = 1
    `);
    this.#database.prepare(
      "INSERT OR REPLACE INTO progress_meta (key, value) VALUES ('backfill', ?)",
    ).run(this.#now());
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
      const snapshot = JSON.parse(row.snapshot_json) as DrillRun;
      if (snapshot.id !== row.id) throw new TypeError("Snapshot id does not match row id");
      const active = snapshot.nodes.find((node) => node.id === snapshot.activeCursor.nodeId);
      if (active === undefined) throw new TypeError("Snapshot active cursor has no node");
      update.run(
        JSON.stringify({
          title: snapshot.packId ?? snapshot.id,
          packId: snapshot.packId,
          updatedAt: row.updated_at,
          objectiveState: active.objectiveState,
          branchCount: snapshot.branches.length,
        }),
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

  #quarantineLegacyRuns(): void {
    this.#database.exec("ALTER TABLE drill_runs ADD COLUMN schema_version TEXT");
    const rows = this.#database.prepare("SELECT id, snapshot_json FROM drill_runs").all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare("UPDATE drill_runs SET schema_version = ? WHERE id = ?");
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") {
        throw new TypeError("Stored run row has an invalid shape");
      }
      let version = "unknown";
      try {
        const snapshot = JSON.parse(row.snapshot_json) as { schemaVersion?: unknown };
        if (typeof snapshot.schemaVersion === "string") version = snapshot.schemaVersion;
      } catch {
        // Unparseable legacy snapshots remain quarantined instead of blocking startup.
      }
      update.run(version, row.id);
    }
  }

  #upgradeV05Runs(): void {
    const rows = this.#database
      .prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.5'")
      .all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare(
      "UPDATE drill_runs SET snapshot_json = ?, schema_version = ? WHERE id = ?",
    );
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") {
        throw new TypeError("Stored v0.5 run row has an invalid shape");
      }
      let snapshot: Record<string, unknown>;
      try {
        const parsed = JSON.parse(row.snapshot_json) as unknown;
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          continue;
        }
        snapshot = parsed as Record<string, unknown>;
      } catch {
        continue;
      }
      if (snapshot.schemaVersion !== "0.5" || !Array.isArray(snapshot.events)) continue;
      if (
        snapshot.events.some(
          (event) =>
            event !== null &&
            typeof event === "object" &&
            (event as { type?: unknown }).type === "outcome.reached",
        )
      ) {
        continue;
      }
      update.run(
        JSON.stringify({ ...snapshot, schemaVersion: "0.6" }),
        "0.6",
        row.id,
      );
    }
  }

  #upgradeV06Runs(): void {
    const rows = this.#database
      .prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.6'")
      .all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare(
      "UPDATE drill_runs SET snapshot_json = ?, schema_version = ? WHERE id = ?",
    );
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") {
        throw new TypeError("Stored v0.6 run row has an invalid shape");
      }
      let snapshot: Record<string, unknown>;
      try {
        const parsed = JSON.parse(row.snapshot_json) as unknown;
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
          continue;
        }
        snapshot = parsed as Record<string, unknown>;
      } catch {
        continue;
      }
      if (snapshot.schemaVersion !== "0.6" || !Array.isArray(snapshot.events)) continue;
      const events = snapshot.events.map((event) => {
        if (
          event === null ||
          typeof event !== "object" ||
          Array.isArray(event) ||
          (event as { type?: unknown }).type !== "opponent.move_selected"
        ) {
          return event;
        }
        const typed = event as Record<string, unknown>;
        const data = typed.data;
        if (data === null || typeof data !== "object" || Array.isArray(data)) return event;
        const selection = (data as Record<string, unknown>).selection;
        if (
          selection === null ||
          typeof selection !== "object" ||
          Array.isArray(selection)
        ) {
          return event;
        }
        const selected = selection as Record<string, unknown>;
        return {
          ...typed,
          data: {
            ...(data as Record<string, unknown>),
            selection: {
              ...selected,
              policyModeApplied: selected.policyModeApplied ?? "unknown",
            },
          },
        };
      });
      update.run(
        JSON.stringify({ ...snapshot, schemaVersion: "0.7", events }),
        "0.7",
        row.id,
      );
    }
  }
}
