import { DatabaseSync } from "node:sqlite";

import {
  RuntimeError,
  readBackReplay,
  type DrillRun,
  type DrillRunEvent,
} from "@chess-tabiya/runtime";

import { ServerError } from "./errors.js";

export interface StoredRun {
  readonly run: DrillRun;
  readonly activeWriterId: string;
}

/** Persistence boundary for snapshots and their single-writer lease. */
export interface RunStorage {
  create(run: DrillRun, activeWriterId: string): void;
  read(runId: string): StoredRun | undefined;
  /** The writer predicate must be atomic with the update. */
  save(run: DrillRun, activeWriterId: string): void;
  close(): void;
}

interface RunRow {
  readonly id: string;
  readonly snapshot_json: string;
  readonly active_writer_id: string;
}

function isRunRow(value: unknown): value is RunRow {
  if (value === null || typeof value !== "object") return false;
  const row = value as Partial<RunRow>;
  return (
    typeof row.id === "string" &&
    typeof row.snapshot_json === "string" &&
    typeof row.active_writer_id === "string"
  );
}

function notActiveWriter(writerId: string): RuntimeError {
  return new RuntimeError(
    "NOT_ACTIVE_WRITER",
    `Writer ${writerId} does not hold the run lease`,
  );
}

export class SQLiteRunStorage implements RunStorage {
  readonly #database: DatabaseSync;
  readonly #snapshots = new Map<string, StoredRun>();

  constructor(filename = ":memory:") {
    this.#database = new DatabaseSync(filename);
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
  }

  create(run: DrillRun, activeWriterId: string): void {
    try {
      this.#database
        .prepare(
          `INSERT INTO drill_runs (id, snapshot_json, active_writer_id, updated_at)
           VALUES (?, ?, ?, ?)`,
        )
        .run(run.id, JSON.stringify(run), activeWriterId, new Date().toISOString());
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

  save(run: DrillRun, activeWriterId: string): void {
    try {
      const result = this.#database
        .prepare(
          `UPDATE drill_runs
           SET snapshot_json = ?, updated_at = ?
           WHERE id = ? AND active_writer_id = ?`,
        )
        .run(JSON.stringify(run), new Date().toISOString(), run.id, activeWriterId);
      if (result.changes === 1) {
        this.#snapshots.set(run.id, Object.freeze({ run, activeWriterId }));
        return;
      }
    } catch (error) {
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
}
