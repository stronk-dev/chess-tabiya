// rfc/longitudinal-store.md §C — worker configuration and the one database identity. Deliberately
// free of any projection import: the HTTP process composes these without reaching the semantic
// adapters (`longitudinal-worker-core.ts` runs only in the thread and the operator doors).
import { isAbsolute, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { LongitudinalContractError } from "./longitudinal-contract.js";

export interface LongitudinalWorkerConfig {
  readonly workerBatchSize: number;
  readonly workerConcurrency: number;
  readonly workerPollMs: number;
  readonly workerLeaseMs: number;
  readonly workerHeartbeatMs: number;
}

/** Product-fixed operational bounds (§C). */
export const LONGITUDINAL_WORKER_DEFAULTS: LongitudinalWorkerConfig = Object.freeze({
  workerBatchSize: 4,
  workerConcurrency: 1,
  workerPollMs: 1_000,
  workerLeaseMs: 120_000,
  workerHeartbeatMs: 10_000,
});

/** Batch 1..32, concurrency 1..batch, poll 100..5000 ms, lease >= 60 s, heartbeat >= 1 s, >= 3 heartbeats per lease. */
export function validateLongitudinalWorkerConfig(value: unknown): LongitudinalWorkerConfig {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new LongitudinalContractError("LONGITUDINAL_WORKER_OPTIONS_INVALID", "not an object");
  const record = value as Record<string, unknown>;
  const keys = Object.keys(LONGITUDINAL_WORKER_DEFAULTS);
  if (Object.keys(record).length !== keys.length || !keys.every((key) => Number.isSafeInteger(record[key]))) {
    throw new LongitudinalContractError("LONGITUDINAL_WORKER_OPTIONS_INVALID", "closed integer fields");
  }
  const config = record as unknown as LongitudinalWorkerConfig;
  if (config.workerBatchSize < 1 || config.workerBatchSize > 32
    || config.workerConcurrency < 1 || config.workerConcurrency > config.workerBatchSize
    || config.workerPollMs < 100 || config.workerPollMs > 5_000
    || config.workerLeaseMs < 60_000 || config.workerHeartbeatMs < 1_000
    || config.workerHeartbeatMs * 3 > config.workerLeaseMs) {
    throw new LongitudinalContractError("LONGITUDINAL_WORKER_OPTIONS_INVALID", "bounds");
  }
  return Object.freeze({
    workerBatchSize: config.workerBatchSize,
    workerConcurrency: config.workerConcurrency,
    workerPollMs: config.workerPollMs,
    workerLeaseMs: config.workerLeaseMs,
    workerHeartbeatMs: config.workerHeartbeatMs,
  });
}

export interface FileBackedDatabaseIdentity { readonly absolutePath: string }

/**
 * The one database identity constructor ([[D2515]]): an absolute, non-URI file path shared unchanged
 * by `SQLiteRunStorage` and the worker's `workerData`. `:memory:` has no second connection and fails.
 */
export function fileBackedDatabaseIdentity(path: string): FileBackedDatabaseIdentity {
  if (typeof path !== "string" || path.trim() === "" || path === ":memory:" || path.startsWith("file:") || path.includes("\0")) {
    throw new LongitudinalContractError("LONGITUDINAL_DATABASE_IDENTITY_INVALID", `a required longitudinal worker needs a file-backed database, not ${JSON.stringify(path)}`);
  }
  return Object.freeze({ absolutePath: isAbsolute(path) ? resolve(path) : resolve(process.cwd(), path) });
}

/** Opens a second connection to an already-migrated database; it never migrates. */
export function openLongitudinalDatabase(identity: FileBackedDatabaseIdentity, expectedStorageVersion: number): DatabaseSync {
  const database = new DatabaseSync(identity.absolutePath);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");
  database.exec("PRAGMA journal_mode = WAL");
  const row = database.prepare("PRAGMA user_version").get() as { readonly user_version?: unknown } | undefined;
  if (row?.user_version !== expectedStorageVersion) {
    database.close();
    throw new LongitudinalContractError("LONGITUDINAL_DATABASE_VERSION_MISMATCH", `expected ${expectedStorageVersion}, found ${String(row?.user_version)}`);
  }
  return database;
}
