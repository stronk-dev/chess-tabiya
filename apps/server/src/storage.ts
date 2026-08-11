import { DatabaseSync } from "node:sqlite";

import {
  RuntimeError,
  readBackReplay,
  type DrillRun,
  type DrillRunEvent,
  type ObjectiveState,
} from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";

export interface RunSummary {
  readonly id: string;
  readonly title: string;
  readonly packId: string;
  readonly updatedAt: string;
  readonly objectiveState: ObjectiveState;
  readonly branchCount: number;
  readonly activeWriterId: string;
}

export interface StoredRun {
  readonly run: DrillRun;
  readonly activeWriterId: string;
}

/** Persistence boundary for snapshots and their single-writer lease. */
export interface RunStorage {
  create(run: DrillRun, activeWriterId: string, title?: string): void;
  read(runId: string): StoredRun | undefined;
  /** Lists denormalized rows without replaying run event logs. */
  list(limit: number, offset: number): readonly RunSummary[];
  /** The writer predicate must be atomic with the update. */
  save(run: DrillRun, activeWriterId: string): void;
  close(): void;
}

interface RunRow {
  readonly id: string;
  readonly snapshot_json: string;
  readonly active_writer_id: string;
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
  readonly active_writer_id: string;
}

export interface StorageMigrationLog {
  readonly version: number;
  readonly name: string;
}

export interface SQLiteRunStorageOptions {
  readonly now?: () => string;
  readonly onMigration?: (entry: StorageMigrationLog) => void;
}

const STORAGE_VERSION = 1;

function isRunRow(value: unknown): value is RunRow {
  if (value === null || typeof value !== "object") return false;
  const row = value as Partial<RunRow>;
  return (
    typeof row.id === "string" &&
    typeof row.snapshot_json === "string" &&
    typeof row.active_writer_id === "string"
  );
}

function isSummaryRow(value: unknown): value is SummaryRow {
  if (value === null || typeof value !== "object") return false;
  const row = value as Partial<SummaryRow>;
  return (
    typeof row.id === "string" &&
    typeof row.summary_json === "string" &&
    typeof row.active_writer_id === "string"
  );
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

  create(run: DrillRun, activeWriterId: string, title = run.packId): void {
    const updatedAt = this.#now();
    const summary = summaryFields(run, title, updatedAt);
    try {
      this.#database
        .prepare(
          `INSERT INTO drill_runs
             (id, snapshot_json, active_writer_id, updated_at, summary_json)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(
          run.id,
          JSON.stringify(run),
          activeWriterId,
          updatedAt,
          JSON.stringify(summary),
        );
      this.#snapshots.set(run.id, Object.freeze({ run, activeWriterId }));
    } catch (error) {
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        throw new ServerError("RUN_ALREADY_EXISTS", `Run already exists: ${run.id}`, {
          cause: error,
        });
      }
      throw new ServerError("STORAGE_FAILURE", "Could not create run", { cause: error });
    }
  }

  read(runId: string): StoredRun | undefined {
    const cached = this.#snapshots.get(runId);
    if (cached) return cached;

    let value: unknown;
    try {
      value = this.#database
        .prepare(
          "SELECT id, snapshot_json, active_writer_id FROM drill_runs WHERE id = ?",
        )
        .get(runId);
    } catch (error) {
      throw new ServerError("STORAGE_FAILURE", "Could not read run", { cause: error });
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
      const stored = Object.freeze({ run, activeWriterId: value.active_writer_id });
      this.#snapshots.set(runId, stored);
      return stored;
    } catch (error) {
      throw new ServerError("STORAGE_FAILURE", "Stored run snapshot failed replay", {
        cause: error,
      });
    }
  }

  list(limit: number, offset: number): readonly RunSummary[] {
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
          `SELECT id, summary_json, active_writer_id
           FROM drill_runs
           ORDER BY updated_at DESC, id ASC
           LIMIT ? OFFSET ?`,
        )
        .all(limit, offset);
    } catch (error) {
      throw new ServerError("STORAGE_FAILURE", "Could not list runs", { cause: error });
    }

    try {
      return Object.freeze(
        values.map((value) => {
          if (!isSummaryRow(value)) throw new TypeError("Stored summary row is invalid");
          return Object.freeze({
            id: value.id,
            ...parseSummary(value.summary_json),
            activeWriterId: value.active_writer_id,
          });
        }),
      );
    } catch (error) {
      throw new ServerError("STORAGE_FAILURE", "Stored run summary is invalid", {
        cause: error,
      });
    }
  }

  save(run: DrillRun, activeWriterId: string): void {
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
           WHERE id = ? AND active_writer_id = ?`,
        )
        .run(
          JSON.stringify(run),
          updatedAt,
          JSON.stringify(summaryFields(run, title, updatedAt)),
          run.id,
          activeWriterId,
        );
      if (result.changes === 1) {
        this.#snapshots.set(run.id, Object.freeze({ run, activeWriterId }));
        return;
      }
    } catch (error) {
      if (error instanceof ServerError) throw error;
      throw new ServerError("STORAGE_FAILURE", "Could not save run", { cause: error });
    }

    const existing = this.read(run.id);
    if (!existing) throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${run.id}`);
    throw notActiveWriter(activeWriterId);
  }

  /** Evicts only memoized projections; useful for cold-load diagnostics. */
  clearSnapshotCache(): void {
    this.#snapshots.clear();
  }

  close(): void {
    this.#snapshots.clear();
    this.#database.close();
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
        try {
          this.#database.exec("ROLLBACK");
        } catch {
          // Preserve the migration failure when rollback itself cannot run.
        }
        throw new ServerError("STORAGE_FAILURE", "Could not migrate run storage", {
          cause: error,
        });
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
}
