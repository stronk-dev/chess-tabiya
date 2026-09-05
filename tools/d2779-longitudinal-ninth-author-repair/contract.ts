import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import { readBackReplay, type DrillRun, type DrillRunEvent } from "../../packages/runtime/src/index.js";
import { canonicalizeJson } from "../../packages/schema/src/drill-pack/digest.js";

import {
  LONGITUDINAL_SOURCE_MUTATION_OPERATIONS,
  type MutationOperation,
} from "../d2598-longitudinal-seventh-author-repair/contract.js";
import type { LockedSourceRecord, MoveAuthorship, StructureAttribution } from "../d2718-longitudinal-eighth-author-repair/contract.js";

type UnknownRow = Record<string, unknown>;

function fail(code: string): never {
  throw new TypeError(code);
}

function immutable<T>(value: T): T {
  if (Array.isArray(value)) return Object.freeze(value.map(immutable)) as T;
  if (value !== null && typeof value === "object") {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, member]) => [key, immutable(member)]))) as T;
  }
  return value;
}

function exactKeys(row: UnknownRow, expected: readonly string[], code: string): void {
  const actual = Object.keys(row).sort();
  const sorted = [...expected].sort();
  if (actual.length !== sorted.length || actual.some((key, index) => key !== sorted[index])) fail(code);
}

function text(value: unknown, code: string): string {
  if (typeof value !== "string" || value.length === 0) fail(code);
  return value;
}

function integer(value: unknown, minimum: number, code: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum) fail(code);
  return Number(value);
}

function nullableText(value: unknown, code: string): string | null {
  return value === null ? null : text(value, code);
}

function digest(value: unknown): `sha256:${string}` {
  return `sha256:${createHash("sha256").update("tabiya.longitudinal-source.v5\0", "utf8").update(canonicalizeJson(value), "utf8").digest("hex")}`;
}

function iso(value: unknown, code: string): string {
  const candidate = text(value, code);
  if (!Number.isFinite(Date.parse(candidate)) || new Date(Date.parse(candidate)).toISOString() !== candidate) fail(code);
  return candidate;
}

export interface LongitudinalSourceImageV5 {
  readonly version: 5;
  readonly runPrefix: Readonly<{
    runId: string;
    ownerLearnerId: string;
    requestedSeq: number;
    events: readonly DrillRunEvent[];
  }>;
  readonly moveAuthorship: readonly MoveAuthorship[];
  readonly importedMainlinePlies: number | null;
  readonly structureAttribution: StructureAttribution;
}

export interface DurableJobImage {
  readonly runId: string;
  readonly learnerId: string;
  readonly requestedSeq: number;
  readonly requestedSourceDigest: `sha256:${string}`;
  readonly completedSeq: number;
  readonly derivedRev: number;
  readonly claimGeneration: number;
  readonly retryCount: number;
  readonly state: "pending" | "running" | "complete" | "retry_wait" | "quarantined";
  readonly claimedRequestedSeq: number | null;
  readonly claimedSourceDigest: `sha256:${string}` | null;
  readonly claimToken: string | null;
  readonly claimedBy: string | null;
  readonly leaseExpiresAt: string | null;
  readonly nextAttemptAt: string | null;
  readonly failureCode: "snapshot_invalid" | "derivation_failed" | "publication_conflict" | null;
}

export interface DatabaseClaimReceipt {
  readonly runId: string;
  readonly learnerId: string;
  readonly claimedRequestedSeq: number;
  readonly claimedSourceDigest: `sha256:${string}`;
  readonly derivedRev: number;
  readonly generation: number;
  readonly token: string;
  readonly worker: string;
  readonly leaseExpiresAt: string;
}

const JOB_KEYS = [
  "runId", "learnerId", "requestedSeq", "requestedSourceDigest", "completedSeq", "derivedRev",
  "claimGeneration", "retryCount", "state", "claimedRequestedSeq", "claimedSourceDigest",
  "claimToken", "claimedBy", "leaseExpiresAt", "nextAttemptAt", "failureCode",
] as const;

export function parseDurableJobRow(value: unknown): DurableJobImage {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail("LONGITUDINAL_JOB_ROW_INVALID");
  const row = value as UnknownRow;
  exactKeys(row, JOB_KEYS, "LONGITUDINAL_JOB_ROW_INVALID");
  const state = text(row.state, "LONGITUDINAL_JOB_ROW_INVALID");
  if (!(state === "pending" || state === "running" || state === "complete" || state === "retry_wait" || state === "quarantined")) {
    fail("LONGITUDINAL_JOB_ROW_INVALID");
  }
  const requestedSeq = integer(row.requestedSeq, 1, "LONGITUDINAL_JOB_ROW_INVALID");
  const completedSeq = integer(row.completedSeq, 0, "LONGITUDINAL_JOB_ROW_INVALID");
  if (completedSeq > requestedSeq) fail("LONGITUDINAL_JOB_ROW_INVALID");
  const claimedRequestedSeq = row.claimedRequestedSeq === null ? null : integer(row.claimedRequestedSeq, 1, "LONGITUDINAL_JOB_ROW_INVALID");
  const claimedSourceDigest = nullableText(row.claimedSourceDigest, "LONGITUDINAL_JOB_ROW_INVALID") as `sha256:${string}` | null;
  const claimToken = nullableText(row.claimToken, "LONGITUDINAL_JOB_ROW_INVALID");
  const claimedBy = nullableText(row.claimedBy, "LONGITUDINAL_JOB_ROW_INVALID");
  const leaseExpiresAt = row.leaseExpiresAt === null ? null : iso(row.leaseExpiresAt, "LONGITUDINAL_JOB_ROW_INVALID");
  const nextAttemptAt = row.nextAttemptAt === null ? null : iso(row.nextAttemptAt, "LONGITUDINAL_JOB_ROW_INVALID");
  const failureCode = nullableText(row.failureCode, "LONGITUDINAL_JOB_ROW_INVALID");
  if (!(failureCode === null || failureCode === "snapshot_invalid" || failureCode === "derivation_failed" || failureCode === "publication_conflict")) {
    fail("LONGITUDINAL_JOB_ROW_INVALID");
  }
  const hasClaim = claimedRequestedSeq !== null && claimedSourceDigest !== null && claimToken !== null && claimedBy !== null && leaseExpiresAt !== null;
  const hasNoClaim = claimedRequestedSeq === null && claimedSourceDigest === null && claimToken === null && claimedBy === null && leaseExpiresAt === null;
  const validEmptyState = state === "retry_wait"
    ? nextAttemptAt !== null && failureCode !== null
    : state === "quarantined"
      ? nextAttemptAt === null && failureCode !== null
      : nextAttemptAt === null && failureCode === null;
  const validState = state === "running"
    ? hasClaim && nextAttemptAt === null && failureCode === null && claimedRequestedSeq === requestedSeq && claimedSourceDigest === row.requestedSourceDigest
    : hasNoClaim && validEmptyState;
  if (!validState || (state === "complete" && completedSeq !== requestedSeq)) fail("LONGITUDINAL_JOB_ROW_INVALID");
  const requestedSourceDigest = text(row.requestedSourceDigest, "LONGITUDINAL_JOB_ROW_INVALID");
  if (!/^sha256:[0-9a-f]{64}$/u.test(requestedSourceDigest) || (claimedSourceDigest !== null && !/^sha256:[0-9a-f]{64}$/u.test(claimedSourceDigest))) {
    fail("LONGITUDINAL_JOB_ROW_INVALID");
  }
  return immutable({
    runId: text(row.runId, "LONGITUDINAL_JOB_ROW_INVALID"),
    learnerId: text(row.learnerId, "LONGITUDINAL_JOB_ROW_INVALID"),
    requestedSeq,
    requestedSourceDigest: requestedSourceDigest as `sha256:${string}`,
    completedSeq,
    derivedRev: integer(row.derivedRev, 1, "LONGITUDINAL_JOB_ROW_INVALID"),
    claimGeneration: integer(row.claimGeneration, 0, "LONGITUDINAL_JOB_ROW_INVALID"),
    retryCount: integer(row.retryCount, 0, "LONGITUDINAL_JOB_ROW_INVALID"),
    state,
    claimedRequestedSeq,
    claimedSourceDigest,
    claimToken,
    claimedBy,
    leaseExpiresAt,
    nextAttemptAt,
    failureCode,
  });
}

const JOB_SELECT = `SELECT
  run_id AS runId, learner_id AS learnerId, requested_seq AS requestedSeq,
  requested_source_digest AS requestedSourceDigest, completed_seq AS completedSeq,
  derived_rev AS derivedRev, claim_generation AS claimGeneration, retry_count AS retryCount,
  state, claimed_requested_seq AS claimedRequestedSeq,
  claimed_source_digest AS claimedSourceDigest, claim_token AS claimToken,
  claimed_by AS claimedBy, lease_expires_at AS leaseExpiresAt,
  next_attempt_at AS nextAttemptAt, failure_code AS failureCode
FROM longitudinal_jobs WHERE run_id=? AND learner_id=?`;

function importedBoundary(run: DrillRun): number | null {
  if (run.sessionKind !== "imported") return null;
  const primary = run.branches[0];
  if (primary === undefined) fail("LONGITUDINAL_IMPORTED_MAINLINE_INVALID");
  return run.nodes.reduce((maximum, node) => node.branchId === primary.id ? Math.max(maximum, node.ply) : maximum, 0);
}

/** Disposable SQLite implementation of the RFC boundary. Production integration remains a separate gate. */
export class LongitudinalContractStore {
  readonly #database: DatabaseSync;
  readonly #sources = new WeakSet<object>();
  readonly #claims = new WeakSet<object>();

  constructor(path: string) {
    this.#database = new DatabaseSync(path);
    this.#database.exec(`PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS longitudinal_source_runs (
        run_id TEXT PRIMARY KEY, snapshot_json TEXT NOT NULL, owner_learner_id TEXT NOT NULL,
        collaboration_journal_present INTEGER NOT NULL CHECK(collaboration_journal_present IN (0,1)),
        structure_attribution TEXT NOT NULL CHECK(structure_attribution IN ('single_player','unattributable_shared','unattributable_legacy'))
      ) STRICT;
      CREATE TABLE IF NOT EXISTS longitudinal_source_authorship (
        run_id TEXT NOT NULL REFERENCES longitudinal_source_runs(run_id) ON DELETE CASCADE,
        event_seq INTEGER NOT NULL CHECK(event_seq >= 1), node_id TEXT NOT NULL,
        learner_id TEXT, PRIMARY KEY(run_id,event_seq)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS longitudinal_jobs (
        run_id TEXT NOT NULL, learner_id TEXT NOT NULL, requested_seq INTEGER NOT NULL CHECK(requested_seq >= 1),
        requested_source_digest TEXT NOT NULL, completed_seq INTEGER NOT NULL CHECK(completed_seq >= 0 AND completed_seq <= requested_seq),
        derived_rev INTEGER NOT NULL CHECK(derived_rev >= 1), claim_generation INTEGER NOT NULL CHECK(claim_generation >= 0),
        retry_count INTEGER NOT NULL CHECK(retry_count >= 0), state TEXT NOT NULL CHECK(state IN ('pending','running','complete','retry_wait','quarantined')),
        claimed_requested_seq INTEGER, claimed_source_digest TEXT, claim_token TEXT, claimed_by TEXT,
        lease_expires_at TEXT, next_attempt_at TEXT, failure_code TEXT,
        PRIMARY KEY(run_id,learner_id),
        CHECK((state='running') = (claimed_requested_seq IS NOT NULL AND claimed_source_digest IS NOT NULL AND claim_token IS NOT NULL AND claimed_by IS NOT NULL AND lease_expires_at IS NOT NULL)),
        CHECK((state='retry_wait') = (next_attempt_at IS NOT NULL)),
        CHECK((state IN ('retry_wait','quarantined')) = (failure_code IS NOT NULL)),
        CHECK(state!='complete' OR completed_seq=requested_seq)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS longitudinal_mutation_receipts (
        receipt_id TEXT PRIMARY KEY, symbol TEXT NOT NULL, effect TEXT NOT NULL,
        run_id TEXT NOT NULL, committed_at TEXT NOT NULL
      ) STRICT;`);
  }

  close(): void {
    this.#database.close();
  }

  /** Test-fixture adapter only: production must project these columns from its existing run/journal tables. */
  seedSourceFixture(record: LockedSourceRecord, collaborationJournalPresent: boolean): void {
    const replayed = readBackReplay(record.run.events).run;
    if (replayed.id !== record.run.id) fail("LONGITUDINAL_STORED_RUN_ID_MISMATCH");
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database.prepare(`INSERT OR REPLACE INTO longitudinal_source_runs
        (run_id,snapshot_json,owner_learner_id,collaboration_journal_present,structure_attribution)
        VALUES (?,?,?,?,?)`).run(record.run.id, canonicalizeJson(replayed), record.ownerLearnerId, collaborationJournalPresent ? 1 : 0, record.structureAttribution);
      this.#database.prepare("DELETE FROM longitudinal_source_authorship WHERE run_id=?").run(record.run.id);
      for (const row of record.moveAuthorship ?? []) {
        this.#database.prepare("INSERT INTO longitudinal_source_authorship (run_id,event_seq,node_id,learner_id) VALUES (?,?,?,?)")
          .run(record.run.id, row.eventSeq, row.nodeId, row.learnerId);
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  #sourceImage(runId: string, requestedSeq: number): LongitudinalSourceImageV5 {
    const stored = this.#database.prepare(`SELECT snapshot_json AS snapshotJson,
      owner_learner_id AS ownerLearnerId, collaboration_journal_present AS journalPresent,
      structure_attribution AS structureAttribution FROM longitudinal_source_runs WHERE run_id=?`).get(runId) as UnknownRow | undefined;
    if (stored === undefined) fail("LONGITUDINAL_SOURCE_RUN_UNKNOWN");
    exactKeys(stored, ["snapshotJson", "ownerLearnerId", "journalPresent", "structureAttribution"], "LONGITUDINAL_SOURCE_ROW_INVALID");
    const run = readBackReplay((JSON.parse(text(stored.snapshotJson, "LONGITUDINAL_SOURCE_ROW_INVALID")) as DrillRun).events).run;
    if (run.id !== runId || !Number.isSafeInteger(requestedSeq) || requestedSeq < 1 || requestedSeq > run.events.length) fail("LONGITUDINAL_SOURCE_CUT_INVALID");
    const events = immutable(structuredClone(run.events.slice(0, requestedSeq)));
    const prefix = readBackReplay(events).run;
    const commits = events.flatMap((event): readonly { eventSeq: number; nodeId: string }[] =>
      event.type === "move.committed" && event.data.node.actor === "user" ? [{ eventSeq: event.seq, nodeId: event.data.node.id }] : []);
    const journalPresent = stored.journalPresent === 1;
    if (!(journalPresent || stored.journalPresent === 0)) fail("LONGITUDINAL_SOURCE_ROW_INVALID");
    const rows = this.#database.prepare(`SELECT event_seq AS eventSeq,node_id AS nodeId,learner_id AS learnerId
      FROM longitudinal_source_authorship WHERE run_id=? AND event_seq<=? ORDER BY event_seq,node_id`).all(runId, requestedSeq) as UnknownRow[];
    const ownerLearnerId = text(stored.ownerLearnerId, "LONGITUDINAL_SOURCE_ROW_INVALID");
    const structureAttribution = text(stored.structureAttribution, "LONGITUDINAL_SOURCE_ROW_INVALID") as StructureAttribution;
    let moveAuthorship: readonly MoveAuthorship[];
    if (!journalPresent) {
      if (rows.length !== 0 || structureAttribution !== "single_player") fail("LONGITUDINAL_AUTHORSHIP_AUTHORITY_MISSING");
      moveAuthorship = commits.map((entry) => ({ ...entry, learnerId: ownerLearnerId }));
    } else {
      moveAuthorship = rows.map((row) => ({
        eventSeq: integer(row.eventSeq, 1, "LONGITUDINAL_AUTHORSHIP_ROW_INVALID"),
        nodeId: text(row.nodeId, "LONGITUDINAL_AUTHORSHIP_ROW_INVALID"),
        learnerId: row.learnerId === null ? null : text(row.learnerId, "LONGITUDINAL_AUTHORSHIP_ROW_INVALID"),
      }));
      if (moveAuthorship.length !== commits.length || moveAuthorship.some((row, index) => row.eventSeq !== commits[index]?.eventSeq || row.nodeId !== commits[index]?.nodeId)) {
        fail("LONGITUDINAL_AUTHORSHIP_POPULATION_MISMATCH");
      }
      if (structureAttribution === "single_player" && moveAuthorship.some((row) => row.learnerId !== ownerLearnerId)) {
        fail("LONGITUDINAL_STRUCTURE_AUTHORSHIP_CONTRADICTION");
      }
    }
    const source = immutable({
      version: 5 as const,
      runPrefix: { runId, ownerLearnerId, requestedSeq, events },
      moveAuthorship,
      importedMainlinePlies: importedBoundary(prefix),
      structureAttribution,
    });
    this.#sources.add(source);
    return source;
  }

  sourceImage(runId: string, requestedSeq: number): LongitudinalSourceImageV5 {
    this.#database.exec("BEGIN");
    try {
      const source = this.#sourceImage(runId, requestedSeq);
      this.#database.exec("COMMIT");
      return source;
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  sourceDigest(source: LongitudinalSourceImageV5): `sha256:${string}` {
    if (!this.#sources.has(source)) fail("LONGITUDINAL_SOURCE_WRONG_DATABASE");
    return digest(source);
  }

  requestJob(runId: string, learnerId: string, requestedSeq: number, derivedRev: number): DurableJobImage {
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      const source = this.#sourceImage(runId, requestedSeq);
      if (source.runPrefix.ownerLearnerId !== learnerId) fail("LONGITUDINAL_SOURCE_JOB_SUBJECT_MISMATCH");
      this.#database.prepare(`INSERT INTO longitudinal_jobs
        (run_id,learner_id,requested_seq,requested_source_digest,completed_seq,derived_rev,claim_generation,retry_count,state,
         claimed_requested_seq,claimed_source_digest,claim_token,claimed_by,lease_expires_at,next_attempt_at,failure_code)
        VALUES (?,?,?,?,0,?,0,0,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL)
        ON CONFLICT(run_id,learner_id) DO UPDATE SET requested_seq=excluded.requested_seq,
          requested_source_digest=excluded.requested_source_digest,completed_seq=0,derived_rev=excluded.derived_rev,
          claim_generation=longitudinal_jobs.claim_generation+1,retry_count=0,state='pending',
          claimed_requested_seq=NULL,claimed_source_digest=NULL,claim_token=NULL,claimed_by=NULL,
          lease_expires_at=NULL,next_attempt_at=NULL,failure_code=NULL`)
        .run(runId, learnerId, requestedSeq, this.sourceDigest(source), derivedRev);
      const job = this.#readJob(runId, learnerId);
      this.#database.exec("COMMIT");
      return job;
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  #readJob(runId: string, learnerId: string): DurableJobImage {
    const row = this.#database.prepare(JOB_SELECT).get(runId, learnerId);
    if (row === undefined) fail("LONGITUDINAL_JOB_UNKNOWN");
    return parseDurableJobRow(row);
  }

  readJob(runId: string, learnerId: string): DurableJobImage {
    return this.#readJob(runId, learnerId);
  }

  claimJob(runId: string, learnerId: string, worker: string, leaseSeconds = 300): DatabaseClaimReceipt {
    if (!Number.isSafeInteger(leaseSeconds) || leaseSeconds < 1 || leaseSeconds > 3600) fail("LONGITUDINAL_LEASE_DURATION_INVALID");
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      const job = this.#readJob(runId, learnerId);
      if (job.state !== "pending") fail("LONGITUDINAL_JOB_NOT_CLAIMABLE");
      const currentSource = this.#sourceImage(runId, job.requestedSeq);
      if (this.sourceDigest(currentSource) !== job.requestedSourceDigest) fail("LONGITUDINAL_CLAIM_SOURCE_CHANGED");
      const row = this.#database.prepare("SELECT unixepoch('now') AS nowSeconds").get() as { nowSeconds: number };
      const leaseExpiresAt = new Date((integer(row.nowSeconds, 0, "LONGITUDINAL_CLOCK_INVALID") + leaseSeconds) * 1000).toISOString();
      const token = randomUUID();
      const generation = job.claimGeneration + 1;
      const changed = this.#database.prepare(`UPDATE longitudinal_jobs SET state='running',claim_generation=?,
        claimed_requested_seq=requested_seq,claimed_source_digest=requested_source_digest,claim_token=?,claimed_by=?,lease_expires_at=?
        WHERE run_id=? AND learner_id=? AND state='pending' AND claim_generation=? AND requested_source_digest=?`)
        .run(generation, token, worker, leaseExpiresAt, runId, learnerId, job.claimGeneration, job.requestedSourceDigest);
      if (changed.changes !== 1) fail("LONGITUDINAL_CLAIM_CONFLICT");
      const receipt = immutable({
        runId, learnerId, claimedRequestedSeq: job.requestedSeq,
        claimedSourceDigest: job.requestedSourceDigest, derivedRev: job.derivedRev,
        generation, token, worker, leaseExpiresAt,
      });
      this.#claims.add(receipt);
      this.#database.exec("COMMIT");
      return receipt;
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  assertCurrentClaim(receipt: DatabaseClaimReceipt): void {
    if (!this.#claims.has(receipt)) fail("LONGITUDINAL_CLAIM_WRONG_DATABASE");
    this.#database.exec("BEGIN");
    try {
      const job = this.#readJob(receipt.runId, receipt.learnerId);
      const currentSource = this.#sourceImage(receipt.runId, receipt.claimedRequestedSeq);
      const now = this.#database.prepare("SELECT unixepoch('now') AS nowSeconds").get() as { nowSeconds: number };
      const currentDigest = this.sourceDigest(currentSource);
      if (job.state !== "running" || job.requestedSeq !== receipt.claimedRequestedSeq ||
        currentSource.runPrefix.ownerLearnerId !== receipt.learnerId ||
        job.requestedSourceDigest !== receipt.claimedSourceDigest ||
        job.claimedSourceDigest !== receipt.claimedSourceDigest || currentDigest !== receipt.claimedSourceDigest ||
        job.derivedRev !== receipt.derivedRev || job.claimGeneration !== receipt.generation ||
        job.claimToken !== receipt.token || job.claimedBy !== receipt.worker || job.leaseExpiresAt !== receipt.leaseExpiresAt ||
        Date.parse(job.leaseExpiresAt ?? "") <= integer(now.nowSeconds, 0, "LONGITUDINAL_CLOCK_INVALID") * 1000) {
        fail("LONGITUDINAL_STALE_CLAIM");
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  invalidateForCurrentSource(runId: string, learnerId: string, requestedSeq: number): DurableJobImage {
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      const job = this.#readJob(runId, learnerId);
      const source = this.#sourceImage(runId, requestedSeq);
      if (source.runPrefix.ownerLearnerId !== learnerId) fail("LONGITUDINAL_SOURCE_JOB_SUBJECT_MISMATCH");
      const nextDigest = this.sourceDigest(source);
      if (nextDigest !== job.requestedSourceDigest) {
        const changed = this.#database.prepare(`UPDATE longitudinal_jobs SET requested_seq=?,requested_source_digest=?,
          completed_seq=0,claim_generation=claim_generation+1,retry_count=0,state='pending',
          claimed_requested_seq=NULL,claimed_source_digest=NULL,claim_token=NULL,claimed_by=NULL,
          lease_expires_at=NULL,next_attempt_at=NULL,failure_code=NULL
          WHERE run_id=? AND learner_id=? AND requested_seq=? AND requested_source_digest=? AND claim_generation=? AND state=?`)
          .run(requestedSeq, nextDigest, runId, learnerId, job.requestedSeq, job.requestedSourceDigest, job.claimGeneration, job.state);
        if (changed.changes !== 1) fail("LONGITUDINAL_INVALIDATION_CONFLICT");
      }
      const current = this.#readJob(runId, learnerId);
      this.#database.exec("COMMIT");
      return current;
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  recordSourceMutation(symbol: MutationOperation["symbol"], runId: string, failAfterWrite = false): void {
    const operation = LONGITUDINAL_SOURCE_MUTATION_OPERATIONS.find((row) => row.symbol === symbol);
    if (operation === undefined) fail("LONGITUDINAL_MUTATION_OPERATION_UNKNOWN");
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      if (this.#database.prepare("SELECT 1 AS found FROM longitudinal_source_runs WHERE run_id=?").get(runId) === undefined) {
        fail("LONGITUDINAL_SOURCE_RUN_UNKNOWN");
      }
      const now = this.#database.prepare("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now') AS instant").get() as { instant: string };
      this.#database.prepare("INSERT INTO longitudinal_mutation_receipts (receipt_id,symbol,effect,run_id,committed_at) VALUES (?,?,?,?,?)")
        .run(randomUUID(), operation.symbol, operation.effect, runId, iso(now.instant, "LONGITUDINAL_CLOCK_INVALID"));
      if (failAfterWrite) fail("LONGITUDINAL_MUTATION_INJECTED_FAILURE");
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  mutationReceipts(): readonly MutationOperation[] {
    return immutable((this.#database.prepare("SELECT symbol,effect FROM longitudinal_mutation_receipts ORDER BY symbol").all() as UnknownRow[])
      .map((row) => ({ symbol: text(row.symbol, "LONGITUDINAL_MUTATION_RECEIPT_INVALID"), effect: text(row.effect, "LONGITUDINAL_MUTATION_RECEIPT_INVALID") })) as MutationOperation[]);
  }
}
