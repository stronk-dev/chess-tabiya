// rfc/longitudinal-store.md §C — the durable longitudinal store over one SQLite database identity.
//
// One `LongitudinalStore` wraps one `DatabaseSync` connection. The HTTP process owns one (inside
// `SQLiteRunStorage`, sharing its connection so watermark updates commit in the writer's own
// transaction); the worker thread opens its own connection to the same canonical file. Source images
// and claim receipts are sealed per store instance ([[D2784]]).
import { createHash, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";
import { canonicalizeJson, type JsonValue } from "@chess-tabiya/schema/drill-pack";
import type { DrillRunEvent } from "@chess-tabiya/runtime";

import {
  LONGITUDINAL_FAILURE_CODES,
  LONGITUDINAL_JOB_COLUMNS,
  LONGITUDINAL_RETRY_LIMITS,
  LongitudinalContractError,
  assertParsedLongitudinalReadQuery,
  compareText,
  instantFromMillis,
  observationSortKey,
  longitudinalRetryDelayMs,
  parseLongitudinalDenominatorRow,
  parseLongitudinalJobRow,
  parseLongitudinalObservationRow,
  parseLongitudinalStructureStatRow,
  type LongitudinalCompleteCut,
  type LongitudinalCutOutcome,
  type LongitudinalDenominatorRow,
  type LongitudinalFailureCode,
  type LongitudinalJob,
  type LongitudinalObservationRow,
  type LongitudinalReadResult,
  type LongitudinalStructureAttribution,
  type LongitudinalStructureStatRow,
  type ParsedLongitudinalReadQuery,
} from "./longitudinal-contract.js";

/** The three derived row families of one run cut (the projector's output shape). */
export interface LongitudinalProjection {
  readonly denominators: readonly LongitudinalDenominatorRow[];
  readonly observations: readonly LongitudinalObservationRow[];
  readonly structureStats: readonly LongitudinalStructureStatRow[];
}
import { OBSERVATION_DERIVATION_REV } from "./longitudinal-registry.js";
import {
  LongitudinalSnapshotError,
  longitudinalSourceDigestV4,
  sealLongitudinalSourceImageV4,
  sealedImageAuthority,
  userCommitsInPrefix,
  type LongitudinalSourceImageV4,
  type MoveAuthorship,
} from "./longitudinal-source.js";

const DIGEST_CHECK = (column: string): string =>
  `length(${column})=71 AND substr(${column},1,7)='sha256:' AND substr(${column},8) NOT GLOB '*[^0-9a-f]*'`;
const INSTANT_CHECK = (column: string): string => `strftime('%Y-%m-%dT%H:%M:%fZ',${column}) IS ${column}`;

/**
 * Migration 26 (rfc/longitudinal-store.md §C DDL, with the implementation correction that the job
 * CHECK set mirrors `parseLongitudinalJobRow` exactly — [[D2997]]/[[D2998]]).
 */
export const LONGITUDINAL_RUN_COLUMNS_SQL = Object.freeze({
  longitudinal_profile_disposition: `ALTER TABLE drill_runs ADD COLUMN longitudinal_profile_disposition TEXT NOT NULL
  DEFAULT 'profileable'
  CHECK (longitudinal_profile_disposition IN ('profileable','account_deleted'))`,
  longitudinal_structure_attribution: `ALTER TABLE drill_runs ADD COLUMN longitudinal_structure_attribution TEXT NOT NULL
  DEFAULT 'unattributable_legacy'
  CHECK (longitudinal_structure_attribution IN
    ('single_player','unattributable_shared','unattributable_legacy'))`,
});

export const LONGITUDINAL_MIGRATION_SQL = `
CREATE UNIQUE INDEX IF NOT EXISTS drill_runs_longitudinal_owner
  ON drill_runs(id, owner_learner_id);

CREATE TABLE IF NOT EXISTS learner_observation_denominators (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('opening','middlegame','endgame','unclear')),
  decision_class TEXT NOT NULL CHECK (decision_class IN ('played','game','predicted')),
  decisions INTEGER NOT NULL CHECK (decisions > 0),
  observed_at TEXT NOT NULL CHECK (${INSTANT_CHECK("observed_at")}),
  derived_rev INTEGER NOT NULL CHECK (derived_rev > 0),
  PRIMARY KEY (learner_id, run_id, phase, decision_class),
  FOREIGN KEY (run_id, learner_id)
    REFERENCES drill_runs(id, owner_learner_id) ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS learner_observations (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  projection_id TEXT NOT NULL,
  projection_version INTEGER NOT NULL CHECK (projection_version > 0),
  semantic_sign TEXT NOT NULL CHECK (semantic_sign IN
    ('state','gained','lost','preserved','removed','avoided','enabled','threatened')),
  source_sign TEXT NOT NULL CHECK (source_sign IN
    ('state','gained','lost','preserved','removed','avoided','enabled','threatened')),
  phase TEXT NOT NULL CHECK (phase IN ('opening','middlegame','endgame','unclear')),
  decision_class TEXT NOT NULL CHECK (decision_class IN ('played','game','predicted')),
  session_kind TEXT NOT NULL CHECK (session_kind IN ('pack','position','imported')),
  pack_id TEXT,
  opportunities INTEGER NOT NULL CHECK (opportunities > 0),
  occurred INTEGER NOT NULL CHECK (occurred >= 0 AND occurred <= opportunities),
  alternative_share_sum REAL NOT NULL
    CHECK (alternative_share_sum >= 0.0 AND alternative_share_sum <= opportunities),
  occurred_refs TEXT NOT NULL CHECK (json_valid(occurred_refs) AND json_type(occurred_refs)='array'
    AND json_array_length(occurred_refs)=occurred),
  opportunity_refs TEXT NOT NULL CHECK (json_valid(opportunity_refs) AND json_type(opportunity_refs)='array'
    AND json_array_length(opportunity_refs)=opportunities),
  observed_at TEXT NOT NULL CHECK (${INSTANT_CHECK("observed_at")}),
  derived_rev INTEGER NOT NULL CHECK (derived_rev > 0),
  CHECK ((session_kind = 'pack' AND pack_id IS NOT NULL)
    OR (session_kind <> 'pack' AND pack_id IS NULL)),
  PRIMARY KEY (learner_id, run_id, projection_id, projection_version,
    semantic_sign, source_sign, phase, decision_class),
  FOREIGN KEY (learner_id, run_id, phase, decision_class)
    REFERENCES learner_observation_denominators(learner_id, run_id, phase, decision_class)
    ON DELETE CASCADE,
  FOREIGN KEY (run_id, learner_id)
    REFERENCES drill_runs(id, owner_learner_id) ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS learner_structure_stats (
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  root_key TEXT NOT NULL,
  root_node_id TEXT NOT NULL,
  session_kind TEXT NOT NULL CHECK (session_kind IN ('pack','position','imported')),
  pack_id TEXT,
  branch_count INTEGER NOT NULL CHECK (branch_count >= 1),
  rewound_count INTEGER NOT NULL CHECK (rewound_count >= 0),
  forked_count INTEGER NOT NULL CHECK (forked_count >= 0),
  group_count INTEGER NOT NULL CHECK (group_count >= 0),
  outcome_count INTEGER NOT NULL CHECK (outcome_count >= 0),
  observed_at TEXT NOT NULL CHECK (${INSTANT_CHECK("observed_at")}),
  derived_rev INTEGER NOT NULL CHECK (derived_rev > 0),
  CHECK ((session_kind = 'pack' AND pack_id IS NOT NULL)
    OR (session_kind <> 'pack' AND pack_id IS NULL)),
  PRIMARY KEY (learner_id, run_id, root_key),
  FOREIGN KEY (run_id, learner_id)
    REFERENCES drill_runs(id, owner_learner_id) ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;

CREATE TABLE IF NOT EXISTS learner_observation_jobs (
  run_id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  requested_seq INTEGER NOT NULL CHECK (requested_seq > 0),
  requested_source_digest TEXT NOT NULL CHECK (${DIGEST_CHECK("requested_source_digest")}),
  completed_seq INTEGER NOT NULL DEFAULT 0 CHECK (completed_seq >= 0),
  derived_rev INTEGER NOT NULL CHECK (derived_rev > 0),
  state TEXT NOT NULL CHECK
    (state IN ('pending','running','complete','retry_wait','quarantined')),
  claim_generation INTEGER NOT NULL DEFAULT 0 CHECK (claim_generation >= 0),
  claimed_requested_seq INTEGER CHECK (claimed_requested_seq > 0),
  claimed_source_digest TEXT CHECK (claimed_source_digest IS NULL OR (${DIGEST_CHECK("claimed_source_digest")})),
  claim_token TEXT CHECK (claim_token IS NULL OR length(claim_token) > 0),
  claimed_by TEXT CHECK (claimed_by IS NULL OR length(claimed_by) > 0),
  lease_expires_at TEXT CHECK (lease_expires_at IS NULL OR ${INSTANT_CHECK("lease_expires_at")}),
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  next_attempt_at TEXT CHECK (next_attempt_at IS NULL OR ${INSTANT_CHECK("next_attempt_at")}),
  failure_code TEXT,
  updated_at TEXT NOT NULL CHECK (${INSTANT_CHECK("updated_at")}),
  CHECK (completed_seq <= requested_seq),
  CHECK (claimed_requested_seq IS NULL OR requested_seq >= claimed_requested_seq),
  CHECK (failure_code IS NULL OR failure_code IN
    ('snapshot_invalid','derivation_failed','publication_conflict')),
  CHECK ((state IN ('retry_wait','quarantined')) = (failure_code IS NOT NULL)),
  CHECK ((state = 'retry_wait') = (next_attempt_at IS NOT NULL)),
  CHECK ((state = 'running') =
    (claimed_requested_seq IS NOT NULL AND claimed_source_digest IS NOT NULL
      AND claim_token IS NOT NULL
      AND claimed_by IS NOT NULL AND lease_expires_at IS NOT NULL)),
  CHECK (state = 'running' OR
    (claimed_requested_seq IS NULL AND claimed_source_digest IS NULL AND claim_token IS NULL
      AND claimed_by IS NULL AND lease_expires_at IS NULL)),
  CHECK (state <> 'running' OR (claimed_requested_seq = requested_seq
    AND claimed_source_digest = requested_source_digest AND retry_count < 5)),
  CHECK (state <> 'complete' OR completed_seq = requested_seq),
  CHECK (state = 'complete' OR completed_seq = 0),
  CHECK (state NOT IN ('pending','complete') OR retry_count = 0),
  CHECK (state <> 'retry_wait' OR (failure_code IN ('derivation_failed','publication_conflict')
    AND retry_count >= 1
    AND retry_count < CASE failure_code WHEN 'derivation_failed' THEN 3 ELSE 5 END)),
  CHECK (state <> 'quarantined' OR retry_count >=
    CASE failure_code WHEN 'snapshot_invalid' THEN 1 WHEN 'derivation_failed' THEN 3 ELSE 5 END),
  FOREIGN KEY (run_id, learner_id)
    REFERENCES drill_runs(id, owner_learner_id) ON UPDATE RESTRICT ON DELETE CASCADE
) STRICT;

CREATE INDEX IF NOT EXISTS learner_observation_denominators_by_learner
  ON learner_observation_denominators(learner_id, observed_at, run_id);
CREATE INDEX IF NOT EXISTS learner_observations_by_family
  ON learner_observations(learner_id, projection_id, projection_version,
    semantic_sign, source_sign, phase, decision_class, run_id);
CREATE INDEX IF NOT EXISTS learner_observations_by_run
  ON learner_observations(run_id, derived_rev);
CREATE INDEX IF NOT EXISTS learner_structure_stats_by_learner
  ON learner_structure_stats(learner_id, observed_at, run_id);
CREATE INDEX IF NOT EXISTS learner_observation_jobs_work
  ON learner_observation_jobs(state, lease_expires_at, updated_at, run_id);
`;

export const LONGITUDINAL_TABLES = Object.freeze([
  "learner_observation_denominators", "learner_observations", "learner_structure_stats", "learner_observation_jobs",
] as const);
export const LONGITUDINAL_INDEXES = Object.freeze([
  "drill_runs_longitudinal_owner", "learner_observation_denominators_by_learner", "learner_observations_by_family",
  "learner_observations_by_run", "learner_structure_stats_by_learner", "learner_observation_jobs_work",
] as const);

/**
 * The normative eleven-row source-mutation authority (§C). Every `SQLiteRunStorage` method named here
 * calls `this.#upsertLongitudinalWatermark({ symbol, effect }, …)` inside its own literal
 * `BEGIN IMMEDIATE … COMMIT`; longitudinal-store.test.ts compiles the call sites from the TypeScript
 * AST and compares them bidirectionally with this list.
 */
export const LONGITUDINAL_SOURCE_MUTATION_OPERATIONS = Object.freeze([
  Object.freeze({ symbol: "SQLiteRunStorage#create", effect: "always" }),
  Object.freeze({ symbol: "SQLiteRunStorage#createRatedRun", effect: "always" }),
  Object.freeze({ symbol: "SQLiteRunStorage#createImportedRun", effect: "always" }),
  Object.freeze({ symbol: "SQLiteRunStorage#createDerivedRun", effect: "always" }),
  Object.freeze({ symbol: "SQLiteRunStorage#createRepertoireGapRun", effect: "always" }),
  Object.freeze({ symbol: "SQLiteRunStorage#save", effect: "conditional" }),
  Object.freeze({ symbol: "SQLiteRunStorage#saveArenaImport", effect: "conditional" }),
  Object.freeze({ symbol: "SQLiteRunStorage#createLiveSession", effect: "conditional" }),
  Object.freeze({ symbol: "SQLiteRunStorage#grantRole", effect: "conditional" }),
  Object.freeze({ symbol: "SQLiteRunStorage#deleteOwnedRun", effect: "suppression" }),
  Object.freeze({ symbol: "SQLiteRunStorage#deleteLearner", effect: "suppression" }),
] as const);
export type LongitudinalMutationDescriptor = (typeof LONGITUDINAL_SOURCE_MUTATION_OPERATIONS)[number];

/** The seven run-snapshot writers ([[D1616]]). */
export const LONGITUDINAL_RUN_WRITE_OPERATIONS = Object.freeze([
  "create", "createRatedRun", "createImportedRun", "createDerivedRun", "createRepertoireGapRun", "save", "saveArenaImport",
] as const);

export interface LongitudinalClaim {
  readonly runId: string;
  readonly learnerId: string;
  readonly claimedRequestedSeq: number;
  readonly claimedSourceDigest: `sha256:${string}`;
  readonly derivedRev: number;
  readonly generation: number;
  readonly token: string;
  readonly workerId: string;
  readonly leaseExpiresAt: string;
}

export interface LongitudinalReconciliationReceipt {
  readonly scanned: number;
  readonly created: number;
  readonly advanced: number;
  readonly revisionReset: number;
  readonly suppressed: number;
  readonly digest: `sha256:${string}`;
}

export type WatermarkOutcome = "created" | "advanced" | "revision_reset" | "unchanged" | "quarantined" | "ineligible";

export interface RebuildMismatch {
  readonly runId: string;
  readonly table: "learner_observation_denominators" | "learner_observations" | "learner_structure_stats" | "learner_observation_jobs";
  readonly key: string;
  readonly kind: "missing" | "surplus" | "changed";
}
export interface RebuildReport {
  readonly checked: number;
  readonly repaired: number;
  readonly mismatches: readonly RebuildMismatch[];
  readonly skipped: Readonly<Record<"pending" | "running" | "retry_wait" | "quarantined" | "missing_job" | "revision_mismatch", readonly string[]>>;
}

export interface LongitudinalStoreOptions {
  /** Wall-clock milliseconds. Injectable so lease/backoff fixtures cross exact boundaries. */
  readonly now?: () => number;
}

type Row = Readonly<Record<string, unknown>>;

const JOB_SELECT = `SELECT ${LONGITUDINAL_JOB_COLUMNS.join(", ")} FROM learner_observation_jobs`;
const HEAD_SQL = "json_extract(snapshot_json, '$.events[#-1].seq')";
const UNREADABLE_DOMAIN = "tabiya.longitudinal-source.v4.unreadable\0";

function jsonRows(rows: readonly unknown[]): readonly JsonValue[] {
  return rows as unknown as readonly JsonValue[];
}

export class LongitudinalStore {
  readonly #db: DatabaseSync;
  readonly #now: () => number;
  readonly #authority = Object.freeze({ store: randomUUID() });
  readonly #claims = new WeakSet<object>();

  constructor(database: DatabaseSync, options: LongitudinalStoreOptions = {}) {
    this.#db = database;
    this.#now = options.now ?? (() => Date.now());
  }

  #nowIso(): string {
    return instantFromMillis(this.#now());
  }

  #inTransaction<T>(mode: "BEGIN" | "BEGIN IMMEDIATE", body: () => T): T {
    this.#db.exec(mode);
    try {
      const value = body();
      this.#db.exec("COMMIT");
      return value;
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch { /* preserve the primary failure */ }
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------
  // Source authority

  #sourceImageInTransaction(runId: string, requestedSeq: number | "head"): LongitudinalSourceImageV4 {
    const row = this.#db.prepare(`SELECT id, snapshot_json, owner_learner_id, longitudinal_structure_attribution
      FROM drill_runs WHERE id = ?`).get(runId) as Row | undefined;
    if (row === undefined) throw new LongitudinalContractError("LONGITUDINAL_SOURCE_RUN_UNKNOWN", runId);
    let events: readonly DrillRunEvent[];
    try {
      const parsed = JSON.parse(String(row.snapshot_json)) as { readonly events?: unknown };
      if (!Array.isArray(parsed.events)) throw new TypeError("snapshot has no events");
      events = parsed.events as readonly DrillRunEvent[];
    } catch (error) {
      throw new LongitudinalSnapshotError("LONGITUDINAL_SOURCE_SNAPSHOT_UNREADABLE", error instanceof Error ? error.message : String(error));
    }
    const cut = requestedSeq === "head" ? events.length : requestedSeq;
    const ownerLearnerId = String(row.owner_learner_id);
    const structureAttribution = String(row.longitudinal_structure_attribution) as LongitudinalStructureAttribution;
    const prefix = events.slice(0, Math.max(0, cut));
    return sealLongitudinalSourceImageV4(this.#authority, {
      runId, requestedSeq: cut, storedEvents: events, ownerLearnerId, structureAttribution,
      moveAuthorship: this.#resolveAuthorship(runId, prefix, ownerLearnerId, structureAttribution),
    });
  }

  /**
   * The closed journal × structure-disposition authorship matrix ([[D3000]]):
   * - no collaboration journal: `single_player` and pre-migration `unattributable_legacy` resolve every
   *   user commit to the owner (§B.1 rule 1); grant-only `unattributable_shared` has no durable author
   *   record and resolves every commit to null (honest absence);
   * - journal present: the owner/holder timeline of `board.granted` entries resolves each commit; commits
   *   before the first grant or on an externally imported arena leg resolve to null. A `single_player`
   *   run with a journal is contradictory and fails.
   */
  #resolveAuthorship(runId: string, prefix: readonly DrillRunEvent[], owner: string, attribution: LongitudinalStructureAttribution): readonly MoveAuthorship[] {
    const commits = userCommitsInPrefix(prefix);
    const session = this.#db.prepare("SELECT id FROM live_sessions WHERE run_id = ?").get(runId) as Row | undefined;
    if (session === undefined) {
      const learnerId = attribution === "unattributable_shared" ? null : owner;
      return commits.map((commit) => ({ ...commit, learnerId }));
    }
    if (attribution === "single_player") throw new LongitudinalSnapshotError("LONGITUDINAL_STRUCTURE_AUTHORSHIP_CONTRADICTION", "single-player run has a collaboration journal");
    const journal = this.#db.prepare("SELECT kind, run_seq, payload_json FROM session_journal WHERE session_id = ? ORDER BY seq")
      .all(String(session.id)) as readonly Row[];
    const grants: { readonly runSeq: number; readonly holder: string | null }[] = [];
    const importedBranches = new Set<string>();
    for (const entry of journal) {
      let payload: Record<string, unknown> = {};
      try { payload = JSON.parse(String(entry.payload_json)) as Record<string, unknown>; } catch { /* unreadable payload proves nothing */ }
      if (entry.kind === "board.granted" && typeof entry.run_seq === "number") {
        grants.push({ runSeq: entry.run_seq, holder: typeof payload.holderLearnerId === "string" ? payload.holderLearnerId : null });
      } else if (entry.kind === "leg.imported" && typeof payload.branchId === "string") {
        importedBranches.add(payload.branchId);
      }
    }
    const branchOf = new Map(prefix.flatMap((event) => event.type === "move.committed" ? [[event.data.node.id, event.data.node.branchId] as const] : []));
    return commits.map((commit) => {
      if (importedBranches.has(branchOf.get(commit.nodeId) ?? "")) return { ...commit, learnerId: null };
      let holder: string | null = null;
      for (const grant of grants) if (grant.runSeq < commit.eventSeq) holder = grant.holder;
      return { ...commit, learnerId: holder };
    });
  }

  /** The exported storage operation: the sealed V4 image of `runId` at `requestedSeq`. */
  longitudinalSourceImageV4(runId: string, requestedSeq: number): LongitudinalSourceImageV4 {
    return this.#inTransaction("BEGIN", () => this.#sourceImageInTransaction(runId, requestedSeq));
  }

  /** Digest authority is store-scoped: an image sealed by another store (database) is refused. */
  sourceDigest(image: LongitudinalSourceImageV4): `sha256:${string}` {
    if (sealedImageAuthority(image) !== this.#authority) throw new LongitudinalContractError("LONGITUDINAL_SOURCE_WRONG_STORE");
    return longitudinalSourceDigestV4(image);
  }

  #unreadableDigest(runId: string, head: number): `sha256:${string}` {
    const row = this.#db.prepare("SELECT snapshot_json FROM drill_runs WHERE id = ?").get(runId) as Row | undefined;
    return `sha256:${createHash("sha256").update(UNREADABLE_DOMAIN).update(`${runId}\0${head}\0`).update(String(row?.snapshot_json ?? "")).digest("hex")}`;
  }

  // ------------------------------------------------------------------------------------------
  // Watermark (always inside the caller's writer transaction)

  #job(runId: string): LongitudinalJob | undefined {
    const row = this.#db.prepare(`${JOB_SELECT} WHERE run_id = ?`).get(runId);
    return row === undefined ? undefined : parseLongitudinalJobRow(row);
  }

  job(runId: string): LongitudinalJob | undefined {
    return this.#job(runId);
  }

  jobs(): readonly LongitudinalJob[] {
    return Object.freeze((this.#db.prepare(`${JOB_SELECT} ORDER BY run_id`).all() as readonly unknown[]).map(parseLongitudinalJobRow));
  }

  #deleteDerivedRows(runId: string): void {
    this.#db.prepare("DELETE FROM learner_observations WHERE run_id = ?").run(runId);
    this.#db.prepare("DELETE FROM learner_observation_denominators WHERE run_id = ?").run(runId);
    this.#db.prepare("DELETE FROM learner_structure_stats WHERE run_id = ?").run(runId);
  }

  #resetToPending(job: LongitudinalJob, head: number, digest: `sha256:${string}`): void {
    const changed = this.#db.prepare(`UPDATE learner_observation_jobs SET
        requested_seq = ?, requested_source_digest = ?, completed_seq = 0, derived_rev = ?, state = 'pending',
        claim_generation = claim_generation + 1, claimed_requested_seq = NULL, claimed_source_digest = NULL,
        claim_token = NULL, claimed_by = NULL, lease_expires_at = NULL, retry_count = 0,
        next_attempt_at = NULL, failure_code = NULL, updated_at = ?
      WHERE run_id = ? AND learner_id = ? AND claim_generation = ? AND state = ?
        AND requested_seq = ? AND requested_source_digest = ? AND derived_rev = ?`)
      .run(head, digest, OBSERVATION_DERIVATION_REV, this.#nowIso(), job.runId, job.learnerId, job.claimGeneration, job.state,
        job.requestedSeq, job.requestedSourceDigest, job.derivedRev);
    if (changed.changes !== 1) throw new LongitudinalContractError("LONGITUDINAL_INVALIDATION_CONFLICT", job.runId);
  }

  #quarantineSeed(existing: LongitudinalJob | undefined, runId: string, owner: string, head: number, digest: `sha256:${string}`): void {
    if (existing !== undefined && existing.state === "quarantined" && existing.requestedSeq === head
      && existing.requestedSourceDigest === digest && existing.derivedRev === OBSERVATION_DERIVATION_REV) return;
    if (existing !== undefined) this.#db.prepare("DELETE FROM learner_observation_jobs WHERE run_id = ?").run(runId);
    this.#db.prepare(`INSERT INTO learner_observation_jobs
      (run_id, learner_id, requested_seq, requested_source_digest, completed_seq, derived_rev, state, claim_generation,
       retry_count, failure_code, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, 'quarantined', ?, 1, 'snapshot_invalid', ?)`)
      .run(runId, owner, head, digest, OBSERVATION_DERIVATION_REV, (existing?.claimGeneration ?? 0) + 1, this.#nowIso());
  }

  /**
   * The cheap job watermark: derives the current head and V4 digest from the locked stored row
   * **inside the caller's transaction** ([[D2996]]), creates or re-requests the job, and is a
   * byte-identical no-op for an unchanged source ([[D2995]]). It never enumerates legal alternatives.
   */
  refreshWatermarkInTransaction(runId: string): WatermarkOutcome {
    const run = this.#db.prepare(`SELECT owner_learner_id, longitudinal_profile_disposition, schema_version, ${HEAD_SQL} AS head
      FROM drill_runs WHERE id = ?`).get(runId) as Row | undefined;
    if (run === undefined || run.longitudinal_profile_disposition !== "profileable" || run.schema_version !== DRILL_RUN_SCHEMA_VERSION) return "ineligible";
    const head = Number(run.head ?? 0);
    if (!Number.isSafeInteger(head) || head < 1) return "ineligible";
    const owner = String(run.owner_learner_id);
    const existing = this.#job(runId);
    if (existing !== undefined && existing.learnerId !== owner) throw new LongitudinalContractError("LONGITUDINAL_JOB_OWNER_MISMATCH", runId);
    // No operand selects the cut: the requested head is always the locked stored head, so it is as
    // monotone as the append-only event log itself ([[D2996]]). A stored log that genuinely
    // shrinks (a stale full-snapshot overwrite) is a changed source like any other: the job
    // re-requests exactly that head and every older claim is fenced by the generation bump.
    let digest: `sha256:${string}`;
    try {
      digest = this.sourceDigest(this.#sourceImageInTransaction(runId, head));
    } catch (error) {
      if (!(error instanceof LongitudinalSnapshotError)) throw error;
      this.#quarantineSeed(existing, runId, owner, head, this.#unreadableDigest(runId, head));
      return "quarantined";
    }
    if (existing === undefined) {
      this.#db.prepare(`INSERT INTO learner_observation_jobs
        (run_id, learner_id, requested_seq, requested_source_digest, completed_seq, derived_rev, state, claim_generation, retry_count, updated_at)
        VALUES (?, ?, ?, ?, 0, ?, 'pending', 0, 0, ?)`).run(runId, owner, head, digest, OBSERVATION_DERIVATION_REV, this.#nowIso());
      return "created";
    }
    if (existing.derivedRev !== OBSERVATION_DERIVATION_REV) {
      this.#deleteDerivedRows(runId);
      this.#resetToPending(existing, head, digest);
      return "revision_reset";
    }
    if (existing.requestedSeq === head && existing.requestedSourceDigest === digest) return "unchanged";
    this.#resetToPending(existing, head, digest);
    return "advanced";
  }

  /**
   * Operator/worker self-heal: re-derives the watermark in its own transaction. Used only when a
   * claimed prefix no longer hashes to its requested digest (bytes rewritten without a watermark).
   */
  refreshWatermark(runId: string): WatermarkOutcome {
    return this.#inTransaction("BEGIN IMMEDIATE", () => this.refreshWatermarkInTransaction(runId));
  }

  /** Monotone private→shared (and legacy→shared) structure taint; revocation never reverses it. */
  taintSharedInTransaction(runId: string): WatermarkOutcome {
    this.#db.prepare(`UPDATE drill_runs SET longitudinal_structure_attribution = 'unattributable_shared'
      WHERE id = ? AND longitudinal_structure_attribution <> 'unattributable_shared'`).run(runId);
    return this.refreshWatermarkInTransaction(runId);
  }

  /** Durable rebuild suppression before any owner reassignment (the `ON UPDATE RESTRICT` order). */
  suppressInTransaction(runId: string): void {
    this.#deleteDerivedRows(runId);
    this.#db.prepare("DELETE FROM learner_observation_jobs WHERE run_id = ?").run(runId);
    this.#db.prepare("UPDATE drill_runs SET longitudinal_profile_disposition = 'account_deleted' WHERE id = ?").run(runId);
  }

  // ------------------------------------------------------------------------------------------
  // Startup reconciliation ([[D2231]]/[[D2402]])

  reconcile(batchSize = 64): LongitudinalReconciliationReceipt {
    if (!Number.isSafeInteger(batchSize) || batchSize < 1) throw new LongitudinalContractError("LONGITUDINAL_RECONCILE_BATCH_INVALID");
    const census = this.#inTransaction("BEGIN", () => this.#db.prepare(`SELECT id, longitudinal_profile_disposition AS disposition,
        schema_version, ${HEAD_SQL} AS head FROM drill_runs ORDER BY id`).all() as readonly Row[]);
    let created = 0;
    let advanced = 0;
    let revisionReset = 0;
    const eligible = census.filter((row) => row.disposition === "profileable" && row.schema_version === DRILL_RUN_SCHEMA_VERSION && Number(row.head ?? 0) > 0);
    for (let start = 0; start < eligible.length; start += batchSize) {
      const batch = eligible.slice(start, start + batchSize);
      this.#inTransaction("BEGIN IMMEDIATE", () => {
        for (const row of batch) {
          const outcome = this.refreshWatermarkInTransaction(String(row.id));
          if (outcome === "created") created += 1;
          else if (outcome === "advanced") advanced += 1;
          else if (outcome === "revision_reset") revisionReset += 1;
        }
      });
    }
    const jobs = this.jobs().map((job) => ({ runId: job.runId, learnerId: job.learnerId, requestedSeq: job.requestedSeq, requestedSourceDigest: job.requestedSourceDigest, derivedRev: job.derivedRev }));
    return Object.freeze({
      scanned: census.length,
      created,
      advanced,
      revisionReset,
      suppressed: census.length - eligible.length,
      digest: `sha256:${createHash("sha256").update(canonicalizeJson(jobs as unknown as JsonValue)).digest("hex")}` as const,
    });
  }

  // ------------------------------------------------------------------------------------------
  // Worker lifecycle: claim / renew / fail / publish ([[D2999]])

  #seal(claim: LongitudinalClaim): LongitudinalClaim {
    const sealed = Object.freeze({ ...claim });
    this.#claims.add(sealed);
    return sealed;
  }

  #assertClaim(claim: LongitudinalClaim): void {
    if (!this.#claims.has(claim)) throw new LongitudinalContractError("LONGITUDINAL_CLAIM_WRONG_STORE");
  }

  /**
   * Scans at most `scanLimit` eligible rows oldest-first and claims only the first `slots` of them:
   * `pending`, due `retry_wait` and expired `running`. `quarantined` is never claimable.
   */
  claimBatch(input: { readonly workerId: string; readonly scanLimit: number; readonly slots: number; readonly leaseMs: number }): readonly LongitudinalClaim[] {
    if (typeof input.workerId !== "string" || input.workerId.length === 0) throw new LongitudinalContractError("LONGITUDINAL_WORKER_ID_INVALID");
    for (const [name, value, minimum] of [["scanLimit", input.scanLimit, 1], ["slots", input.slots, 0], ["leaseMs", input.leaseMs, 1]] as const) {
      if (!Number.isSafeInteger(value) || value < minimum) throw new LongitudinalContractError("LONGITUDINAL_CLAIM_INPUT_INVALID", name);
    }
    if (input.slots === 0) return Object.freeze([]);
    return this.#inTransaction("BEGIN IMMEDIATE", () => {
      const nowMillis = this.#now();
      const now = instantFromMillis(nowMillis);
      const leaseExpiresAt = instantFromMillis(nowMillis + input.leaseMs);
      const candidates = (this.#db.prepare(`SELECT j.run_id FROM learner_observation_jobs j
          JOIN drill_runs r ON r.id = j.run_id AND r.owner_learner_id = j.learner_id
            AND r.longitudinal_profile_disposition = 'profileable'
          WHERE j.derived_rev = ? AND (j.state = 'pending'
            OR (j.state = 'retry_wait' AND j.next_attempt_at <= ?)
            OR (j.state = 'running' AND j.lease_expires_at <= ?))
          ORDER BY j.updated_at, j.run_id LIMIT ?`).all(OBSERVATION_DERIVATION_REV, now, now, input.scanLimit) as readonly Row[])
        .slice(0, input.slots);
      const claims: LongitudinalClaim[] = [];
      for (const candidate of candidates) {
        const job = this.#job(String(candidate.run_id))!;
        const token = randomUUID();
        const changed = this.#db.prepare(`UPDATE learner_observation_jobs SET state = 'running',
            claim_generation = claim_generation + 1, claimed_requested_seq = requested_seq,
            claimed_source_digest = requested_source_digest, claim_token = ?, claimed_by = ?, lease_expires_at = ?,
            next_attempt_at = NULL, failure_code = NULL, updated_at = ?
          WHERE run_id = ? AND claim_generation = ? AND state = ?`)
          .run(token, input.workerId, leaseExpiresAt, now, job.runId, job.claimGeneration, job.state);
        if (changed.changes !== 1) throw new LongitudinalContractError("LONGITUDINAL_CLAIM_CONFLICT", job.runId);
        claims.push(this.#seal({
          runId: job.runId, learnerId: job.learnerId, claimedRequestedSeq: job.requestedSeq,
          claimedSourceDigest: job.requestedSourceDigest, derivedRev: job.derivedRev,
          generation: job.claimGeneration + 1, token, workerId: input.workerId, leaseExpiresAt,
        }));
      }
      return Object.freeze(claims);
    });
  }

  #claimIsCurrent(claim: LongitudinalClaim, nowIso: string): boolean {
    const job = this.#job(claim.runId);
    if (job === undefined || job.state !== "running") return false;
    const owner = this.#db.prepare(`SELECT 1 AS ok FROM drill_runs WHERE id = ? AND owner_learner_id = ?
      AND longitudinal_profile_disposition = 'profileable'`).get(claim.runId, claim.learnerId);
    return owner !== undefined && job.learnerId === claim.learnerId && job.requestedSeq === claim.claimedRequestedSeq
      && job.claim.claimedRequestedSeq === claim.claimedRequestedSeq && job.requestedSourceDigest === claim.claimedSourceDigest
      && job.claim.claimedSourceDigest === claim.claimedSourceDigest && job.derivedRev === claim.derivedRev
      && job.claimGeneration === claim.generation && job.claim.claimToken === claim.token && job.claim.claimedBy === claim.workerId
      && job.claim.leaseExpiresAt === claim.leaseExpiresAt && job.claim.leaseExpiresAt > nowIso;
  }

  /** Reads the exact claimed prefix under one read transaction; a stale claim reads nothing. */
  claimSourceImage(claim: LongitudinalClaim): LongitudinalSourceImageV4 | undefined {
    this.#assertClaim(claim);
    return this.#inTransaction("BEGIN", () => {
      if (!this.#claimIsCurrent(claim, this.#nowIso())) return undefined;
      return this.#sourceImageInTransaction(claim.runId, claim.claimedRequestedSeq);
    });
  }

  /** Full-tuple CAS renewal from `now`; zero changed rows means the projector must stop. */
  renew(claim: LongitudinalClaim, leaseMs: number): LongitudinalClaim | undefined {
    this.#assertClaim(claim);
    if (!Number.isSafeInteger(leaseMs) || leaseMs < 1) throw new LongitudinalContractError("LONGITUDINAL_CLAIM_INPUT_INVALID", "leaseMs");
    return this.#inTransaction("BEGIN IMMEDIATE", () => {
      const nowMillis = this.#now();
      const nowIso = instantFromMillis(nowMillis);
      if (!this.#claimIsCurrent(claim, nowIso)) return undefined;
      const leaseExpiresAt = instantFromMillis(nowMillis + leaseMs);
      const changed = this.#db.prepare(`UPDATE learner_observation_jobs SET lease_expires_at = ?
        WHERE run_id = ? AND learner_id = ? AND state = 'running' AND requested_seq = ? AND claimed_requested_seq = ?
          AND requested_source_digest = ? AND claimed_source_digest = ? AND derived_rev = ? AND claim_generation = ?
          AND claim_token = ? AND claimed_by = ? AND lease_expires_at = ? AND lease_expires_at > ?`)
        .run(leaseExpiresAt, claim.runId, claim.learnerId, claim.claimedRequestedSeq, claim.claimedRequestedSeq,
          claim.claimedSourceDigest, claim.claimedSourceDigest, claim.derivedRev, claim.generation, claim.token,
          claim.workerId, claim.leaseExpiresAt, nowIso);
      if (changed.changes !== 1) return undefined;
      return this.#seal({ ...claim, leaseExpiresAt });
    });
  }

  /** Durable bounded failure ([[D2406]]): quarantine on exhaustion, exact backoff otherwise. */
  fail(claim: LongitudinalClaim, code: LongitudinalFailureCode): boolean {
    this.#assertClaim(claim);
    if (!LONGITUDINAL_FAILURE_CODES.includes(code)) throw new LongitudinalContractError("LONGITUDINAL_FAILURE_CODE_INVALID", String(code));
    return this.#inTransaction("BEGIN IMMEDIATE", () => {
      const nowMillis = this.#now();
      const nowIso = instantFromMillis(nowMillis);
      if (!this.#claimIsCurrent(claim, nowIso)) return false;
      const job = this.#job(claim.runId)!;
      const attempts = job.retryCount + 1;
      const quarantined = attempts >= LONGITUDINAL_RETRY_LIMITS[code];
      const next = quarantined ? null : instantFromMillis(nowMillis + longitudinalRetryDelayMs(attempts));
      const changed = this.#db.prepare(`UPDATE learner_observation_jobs SET state = ?, claimed_requested_seq = NULL,
          claimed_source_digest = NULL, claim_token = NULL, claimed_by = NULL, lease_expires_at = NULL,
          retry_count = ?, next_attempt_at = ?, failure_code = ?, updated_at = ?
        WHERE run_id = ? AND learner_id = ? AND state = 'running' AND claim_generation = ? AND claim_token = ?
          AND claimed_by = ? AND lease_expires_at = ? AND lease_expires_at > ?`)
        .run(quarantined ? "quarantined" : "retry_wait", attempts, next, code, nowIso, claim.runId, claim.learnerId,
          claim.generation, claim.token, claim.workerId, claim.leaseExpiresAt, nowIso);
      return changed.changes === 1;
    });
  }

  #insertProjection(projection: LongitudinalProjection): void {
    const denominator = this.#db.prepare(`INSERT INTO learner_observation_denominators
      (learner_id, run_id, phase, decision_class, decisions, observed_at, derived_rev) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    for (const row of projection.denominators) denominator.run(row.learnerId, row.runId, row.phase, row.decisionClass, row.decisions, row.observedAt, row.derivedRev);
    const observation = this.#db.prepare(`INSERT INTO learner_observations
      (learner_id, run_id, projection_id, projection_version, semantic_sign, source_sign, phase, decision_class, session_kind,
       pack_id, opportunities, occurred, alternative_share_sum, occurred_refs, opportunity_refs, observed_at, derived_rev)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const row of projection.observations) {
      observation.run(row.learnerId, row.runId, row.projectionId, row.projectionVersion, row.semanticSign, row.sourceSign, row.phase,
        row.decisionClass, row.sessionKind, row.packId, row.opportunities, row.occurred, row.alternativeShareSum,
        JSON.stringify(row.occurredRefs), JSON.stringify(row.opportunityRefs), row.observedAt, row.derivedRev);
    }
    const structure = this.#db.prepare(`INSERT INTO learner_structure_stats
      (learner_id, run_id, root_key, root_node_id, session_kind, pack_id, branch_count, rewound_count, forked_count,
       group_count, outcome_count, observed_at, derived_rev) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    for (const row of projection.structureStats) {
      structure.run(row.learnerId, row.runId, row.rootKey, row.rootNodeId, row.sessionKind, row.packId, row.branchCount,
        row.rewoundCount, row.forkedCount, row.groupCount, row.outcomeCount, row.observedAt, row.derivedRev);
    }
  }

  static #assertProjectionSubject(projection: LongitudinalProjection, runId: string, learnerId: string, derivedRev: number): void {
    for (const row of [...projection.denominators, ...projection.observations, ...projection.structureStats]) {
      if (row.runId !== runId || row.learnerId !== learnerId || row.derivedRev !== derivedRev) {
        throw new LongitudinalContractError("LONGITUDINAL_PROJECTION_SUBJECT_MISMATCH", runId);
      }
    }
  }

  /**
   * Replaces the three derived row sets and advances `completed_seq = N` in one transaction, only
   * under the immutable claimed cut/source tuple and the exact current `requested_seq = N`.
   */
  publish(claim: LongitudinalClaim, projection: LongitudinalProjection): "published" | "publication_conflict" {
    this.#assertClaim(claim);
    LongitudinalStore.#assertProjectionSubject(projection, claim.runId, claim.learnerId, claim.derivedRev);
    this.#db.exec("BEGIN IMMEDIATE");
    try {
      const nowIso = this.#nowIso();
      if (!this.#claimIsCurrent(claim, nowIso)) {
        this.#db.exec("ROLLBACK");
        return "publication_conflict";
      }
      this.#deleteDerivedRows(claim.runId);
      this.#insertProjection(projection);
      const changed = this.#db.prepare(`UPDATE learner_observation_jobs
        SET completed_seq = ?, state = 'complete',
            claimed_requested_seq = NULL, claimed_source_digest = NULL,
            claim_token = NULL, claimed_by = NULL, lease_expires_at = NULL,
            retry_count = 0, next_attempt_at = NULL, failure_code = NULL, updated_at = ?
        WHERE run_id = ? AND learner_id = ? AND state = 'running'
          AND requested_seq = ? AND claimed_requested_seq = ?
          AND requested_source_digest = ? AND claimed_source_digest = ?
          AND derived_rev = ? AND claim_generation = ?
          AND claim_token = ? AND claimed_by = ? AND lease_expires_at > ?
          AND EXISTS (SELECT 1 FROM drill_runs r
            WHERE r.id = ? AND r.owner_learner_id = ?
              AND r.longitudinal_profile_disposition = 'profileable')`)
        .run(claim.claimedRequestedSeq, nowIso, claim.runId, claim.learnerId, claim.claimedRequestedSeq, claim.claimedRequestedSeq,
          claim.claimedSourceDigest, claim.claimedSourceDigest, claim.derivedRev, claim.generation, claim.token, claim.workerId,
          nowIso, claim.runId, claim.learnerId);
      if (changed.changes !== 1) {
        this.#db.exec("ROLLBACK");
        return "publication_conflict";
      }
      this.#db.exec("COMMIT");
      return "published";
    } catch (error) {
      try { this.#db.exec("ROLLBACK"); } catch { /* preserve the primary failure */ }
      throw error;
    }
  }

  // ------------------------------------------------------------------------------------------
  // Typed read boundary ([[D2067]]/[[D2230]]/[[D2403]]/[[D2514]])

  readSnapshot(actorLearnerId: string, query: ParsedLongitudinalReadQuery): LongitudinalReadResult {
    assertParsedLongitudinalReadQuery(query);
    if (actorLearnerId !== query.learnerId) throw new LongitudinalContractError("LONGITUDINAL_READ_ACTOR_MISMATCH");
    return this.#inTransaction("BEGIN", () => {
      const outcomes: LongitudinalCutOutcome[] = [];
      const classify = (runId: string, requestedSeq: number, job: LongitudinalJob | undefined): LongitudinalCutOutcome => {
        if (job === undefined) return { kind: "unavailable", runId, requestedSeq, reason: "not_requested" };
        if (job.derivedRev !== query.derivationRev) return { kind: "unavailable", runId, requestedSeq, reason: "revision_mismatch" };
        if (requestedSeq !== job.requestedSeq) return { kind: "unavailable", runId, requestedSeq, reason: "cut_superseded" };
        const cut = { runId, requestedSeq: job.requestedSeq, completedSeq: job.completedSeq, derivedRev: job.derivedRev };
        if (job.state === "complete") return { kind: "complete", ...cut };
        if (job.state === "quarantined") return { kind: "failed", ...cut, failureCode: job.failureCode, attempts: job.retryCount };
        if (job.state === "retry_wait") return { kind: "pending", ...cut, retryAt: job.nextAttemptAt };
        return { kind: "pending", ...cut };
      };
      if (query.through.kind === "runs") {
        for (const cut of query.through.cuts) {
          const run = this.#db.prepare("SELECT owner_learner_id, longitudinal_profile_disposition FROM drill_runs WHERE id = ?").get(cut.runId) as Row | undefined;
          if (run?.longitudinal_profile_disposition === "account_deleted") {
            outcomes.push({ kind: "unavailable", runId: cut.runId, requestedSeq: cut.requestedSeq, reason: "profile_suppressed" });
          } else if (run === undefined || run.owner_learner_id !== query.learnerId) {
            outcomes.push({ kind: "unavailable", runId: cut.runId, requestedSeq: cut.requestedSeq, reason: "not_requested" });
          } else {
            outcomes.push(classify(cut.runId, cut.requestedSeq, this.#job(cut.runId)));
          }
        }
      } else {
        const eligible = this.#db.prepare(`SELECT id, ${HEAD_SQL} AS head FROM drill_runs
          WHERE owner_learner_id = ? AND longitudinal_profile_disposition = 'profileable' AND schema_version = ?
            AND ${HEAD_SQL} > 0 ORDER BY id`).all(query.learnerId, DRILL_RUN_SCHEMA_VERSION) as readonly Row[];
        for (const run of eligible) {
          const job = this.#job(String(run.id));
          outcomes.push(classify(String(run.id), job?.requestedSeq ?? Number(run.head), job));
        }
      }
      const frozenOutcomes = Object.freeze(outcomes.map((outcome) => Object.freeze(outcome)));
      if (frozenOutcomes.some((outcome) => outcome.kind !== "complete")) return Object.freeze({ kind: "incomplete", cuts: frozenOutcomes });
      const cuts = frozenOutcomes as readonly LongitudinalCompleteCut[];
      const runIds = cuts.map((cut) => cut.runId);
      return Object.freeze({ kind: "complete", cuts, ...this.#rows(query, runIds) });
    });
  }

  #rows(query: ParsedLongitudinalReadQuery, runIds: readonly string[]): {
    readonly denominators: readonly LongitudinalDenominatorRow[];
    readonly observations: readonly LongitudinalObservationRow[];
    readonly structureStats: readonly LongitudinalStructureStatRow[];
  } {
    const filter = query.filter;
    const runSelected = (runId: string): boolean => {
      if (filter.sessionKinds === undefined && filter.packIds === undefined) return true;
      const summary = this.#db.prepare("SELECT json_extract(summary_json, '$.sessionKind') AS kind, json_extract(summary_json, '$.packId') AS pack FROM drill_runs WHERE id = ?").get(runId) as Row | undefined;
      const kind = String(summary?.kind);
      if (filter.sessionKinds !== undefined && !(filter.sessionKinds as readonly string[]).includes(kind)) return false;
      if (filter.packIds !== undefined && (kind !== "pack" || !filter.packIds.includes(String(summary?.pack)))) return false;
      return true;
    };
    const selectedRuns = runIds.filter(runSelected);
    const denominators: LongitudinalDenominatorRow[] = [];
    const observations: LongitudinalObservationRow[] = [];
    const structureStats: LongitudinalStructureStatRow[] = [];
    const phaseOk = (phase: string): boolean => filter.phases === undefined || (filter.phases as readonly string[]).includes(phase);
    const classOk = (value: string): boolean => filter.decisionClasses === undefined || (filter.decisionClasses as readonly string[]).includes(value);
    const projectionOk = (row: LongitudinalObservationRow): boolean => filter.projections === undefined || filter.projections.some((projection) =>
      projection.id === row.projectionId && projection.version === row.projectionVersion
      && (projection.semanticSign === undefined || projection.semanticSign === row.semanticSign)
      && (projection.sourceSign === undefined || projection.sourceSign === row.sourceSign));
    for (const runId of selectedRuns) {
      for (const raw of this.#db.prepare(`SELECT learner_id, run_id, phase, decision_class, decisions, observed_at, derived_rev
          FROM learner_observation_denominators WHERE run_id = ? AND learner_id = ? AND derived_rev = ?`).all(runId, query.learnerId, query.derivationRev) as readonly Row[]) {
        const row = denominatorFromSql(raw);
        if (phaseOk(row.phase) && classOk(row.decisionClass)) denominators.push(row);
      }
      for (const raw of this.#db.prepare(`SELECT o.*, d.decisions FROM learner_observations o
          JOIN learner_observation_denominators d ON d.learner_id = o.learner_id AND d.run_id = o.run_id
            AND d.phase = o.phase AND d.decision_class = o.decision_class
          WHERE o.run_id = ? AND o.learner_id = ? AND o.derived_rev = ?`).all(runId, query.learnerId, query.derivationRev) as readonly Row[]) {
        const row = observationFromSql(raw);
        if (phaseOk(row.phase) && classOk(row.decisionClass) && projectionOk(row)) observations.push(row);
      }
      for (const raw of this.#db.prepare(`SELECT * FROM learner_structure_stats WHERE run_id = ? AND learner_id = ? AND derived_rev = ?`)
        .all(runId, query.learnerId, query.derivationRev) as readonly Row[]) structureStats.push(structureFromSql(raw));
    }
    denominators.sort((left, right) => compareText(`${left.runId}\0${left.phase}\0${left.decisionClass}`, `${right.runId}\0${right.phase}\0${right.decisionClass}`));
    observations.sort((left, right) => compareText(observationSortKey(left), observationSortKey(right)));
    structureStats.sort((left, right) => compareText(`${left.runId}\0${left.rootKey}`, `${right.runId}\0${right.rootKey}`));
    return { denominators: Object.freeze(denominators), observations: Object.freeze(observations), structureStats: Object.freeze(structureStats) };
  }

  // ------------------------------------------------------------------------------------------
  // Rebuild instrument (§C, AC 11): compare durable rows with a fresh projection; optionally repair.

  storedProjection(runId: string): LongitudinalProjection {
    const denominators = (this.#db.prepare("SELECT * FROM learner_observation_denominators WHERE run_id = ?").all(runId) as readonly Row[]).map(denominatorFromSql);
    const observations = (this.#db.prepare(`SELECT o.*, d.decisions FROM learner_observations o
        LEFT JOIN learner_observation_denominators d ON d.learner_id = o.learner_id AND d.run_id = o.run_id
          AND d.phase = o.phase AND d.decision_class = o.decision_class WHERE o.run_id = ?`).all(runId) as readonly Row[]).map(observationFromSqlLoose);
    const structureStats = (this.#db.prepare("SELECT * FROM learner_structure_stats WHERE run_id = ?").all(runId) as readonly Row[]).map(structureFromSql);
    return Object.freeze({ denominators: Object.freeze(denominators), observations: Object.freeze(observations), structureStats: Object.freeze(structureStats) });
  }

  /**
   * The projector is an operand, not an import: the HTTP-side storage module graph never reaches the
   * semantic adapters. The rebuild CLI passes `projectObservations`.
   */
  rebuild(options: { readonly write: boolean; readonly project: (image: LongitudinalSourceImageV4) => LongitudinalProjection }): RebuildReport {
    const project = options.project;
    const eligible = this.#inTransaction("BEGIN", () => this.#db.prepare(`SELECT id, owner_learner_id FROM drill_runs
      WHERE longitudinal_profile_disposition = 'profileable' AND schema_version = ? AND ${HEAD_SQL} > 0 ORDER BY id`)
      .all(DRILL_RUN_SCHEMA_VERSION) as readonly Row[]);
    const mismatches: RebuildMismatch[] = [];
    const skipped = { pending: [] as string[], running: [] as string[], retry_wait: [] as string[], quarantined: [] as string[], missing_job: [] as string[], revision_mismatch: [] as string[] };
    let checked = 0;
    let repaired = 0;
    const eligibleIds = new Set(eligible.map((row) => String(row.id)));
    // Rows or jobs for non-eligible runs (suppressed/deleted) are surplus by definition ([[D2065]]).
    for (const table of ["learner_observation_denominators", "learner_observations", "learner_structure_stats", "learner_observation_jobs"] as const) {
      for (const row of this.#db.prepare(`SELECT DISTINCT run_id FROM ${table} ORDER BY run_id`).all() as readonly Row[]) {
        const runId = String(row.run_id);
        if (eligibleIds.has(runId)) continue;
        mismatches.push({ runId, table, key: runId, kind: "surplus" });
        if (options.write) {
          this.#inTransaction("BEGIN IMMEDIATE", () => {
            this.#deleteDerivedRows(runId);
            this.#db.prepare("DELETE FROM learner_observation_jobs WHERE run_id = ?").run(runId);
          });
          repaired += 1;
        }
      }
    }
    for (const run of eligible) {
      const runId = String(run.id);
      const job = this.#job(runId);
      if (job === undefined) { skipped.missing_job.push(runId); mismatches.push({ runId, table: "learner_observation_jobs", key: runId, kind: "missing" }); continue; }
      if (job.derivedRev !== OBSERVATION_DERIVATION_REV) { skipped.revision_mismatch.push(runId); continue; }
      if (job.state !== "complete") { skipped[job.state].push(runId); continue; }
      checked += 1;
      const image = this.longitudinalSourceImageV4(runId, job.requestedSeq);
      if (this.sourceDigest(image) !== job.requestedSourceDigest) {
        mismatches.push({ runId, table: "learner_observation_jobs", key: `${runId}:source_digest`, kind: "changed" });
        continue;
      }
      const expected = project(image);
      const actual = this.storedProjection(runId);
      const runMismatches = compareProjections(runId, expected, actual);
      mismatches.push(...runMismatches);
      if (options.write && runMismatches.length > 0) {
        this.#inTransaction("BEGIN IMMEDIATE", () => {
          const current = this.#job(runId);
          if (current === undefined || current.state !== "complete" || current.requestedSeq !== job.requestedSeq
            || current.requestedSourceDigest !== job.requestedSourceDigest || current.claimGeneration !== job.claimGeneration) {
            throw new LongitudinalContractError("LONGITUDINAL_REBUILD_SOURCE_MOVED", runId);
          }
          this.#deleteDerivedRows(runId);
          this.#insertProjection(expected);
        });
        repaired += 1;
      }
    }
    return Object.freeze({ checked, repaired, mismatches: Object.freeze(mismatches), skipped: Object.freeze(skipped) });
  }
}

function compareProjections(runId: string, expected: LongitudinalProjection, actual: LongitudinalProjection): RebuildMismatch[] {
  const mismatches: RebuildMismatch[] = [];
  const compare = (table: RebuildMismatch["table"], left: readonly unknown[], right: readonly unknown[], key: (row: never) => string): void => {
    const expectedRows = new Map(left.map((row) => [key(row as never), canonicalizeJson(row as JsonValue)] as const));
    const actualRows = new Map(right.map((row) => [key(row as never), canonicalizeJson(row as JsonValue)] as const));
    for (const [rowKey, bytes] of expectedRows) {
      const stored = actualRows.get(rowKey);
      if (stored === undefined) mismatches.push({ runId, table, key: rowKey, kind: "missing" });
      else if (stored !== bytes) mismatches.push({ runId, table, key: rowKey, kind: "changed" });
    }
    for (const rowKey of actualRows.keys()) if (!expectedRows.has(rowKey)) mismatches.push({ runId, table, key: rowKey, kind: "surplus" });
  };
  compare("learner_observation_denominators", jsonRows(expected.denominators), jsonRows(actual.denominators), (row: LongitudinalDenominatorRow) => `${row.phase}/${row.decisionClass}`);
  compare("learner_observations", jsonRows(expected.observations), jsonRows(actual.observations), (row: LongitudinalObservationRow) => `${row.projectionId}@${row.projectionVersion}/${row.semanticSign}/${row.sourceSign}/${row.phase}/${row.decisionClass}`);
  compare("learner_structure_stats", jsonRows(expected.structureStats), jsonRows(actual.structureStats), (row: LongitudinalStructureStatRow) => row.rootKey);
  return mismatches;
}

function denominatorFromSql(row: Row): LongitudinalDenominatorRow {
  return parseLongitudinalDenominatorRow({
    learnerId: row.learner_id, runId: row.run_id, phase: row.phase, decisionClass: row.decision_class,
    decisions: row.decisions, observedAt: row.observed_at, derivedRev: row.derived_rev,
  });
}

function refsFromSql(value: unknown): unknown {
  try { return JSON.parse(String(value)) as unknown; } catch { return null; }
}

function observationFromSql(row: Row): LongitudinalObservationRow {
  return parseLongitudinalObservationRow({
    learnerId: row.learner_id, runId: row.run_id, phase: row.phase, decisionClass: row.decision_class,
    decisions: row.decisions, observedAt: row.observed_at, derivedRev: row.derived_rev,
    projectionId: row.projection_id, projectionVersion: row.projection_version,
    semanticSign: row.semantic_sign, sourceSign: row.source_sign, sessionKind: row.session_kind,
    packId: row.pack_id, opportunities: row.opportunities, occurred: row.occurred,
    alternativeShareSum: row.alternative_share_sum,
    occurredRefs: refsFromSql(row.occurred_refs), opportunityRefs: refsFromSql(row.opportunity_refs),
  });
}

/** The rebuild comparison must name tampered rows rather than abort on the first parse failure. */
function observationFromSqlLoose(row: Row): LongitudinalObservationRow {
  try {
    return observationFromSql(row);
  } catch {
    return Object.freeze({
      learnerId: String(row.learner_id), runId: String(row.run_id), phase: row.phase, decisionClass: row.decision_class,
      decisions: Number(row.decisions ?? 0), observedAt: String(row.observed_at), derivedRev: Number(row.derived_rev),
      projectionId: String(row.projection_id), projectionVersion: Number(row.projection_version),
      semanticSign: row.semantic_sign, sourceSign: row.source_sign, sessionKind: row.session_kind,
      packId: row.pack_id === null ? null : String(row.pack_id), opportunities: Number(row.opportunities), occurred: Number(row.occurred),
      alternativeShareSum: Number(row.alternative_share_sum),
      occurredRefs: refsFromSql(row.occurred_refs), opportunityRefs: refsFromSql(row.opportunity_refs),
      invalid: true,
    } as unknown as LongitudinalObservationRow);
  }
}

function structureFromSql(row: Row): LongitudinalStructureStatRow {
  return parseLongitudinalStructureStatRow({
    learnerId: row.learner_id, runId: row.run_id, rootKey: row.root_key, rootNodeId: row.root_node_id,
    sessionKind: row.session_kind, packId: row.pack_id, branchCount: row.branch_count, rewoundCount: row.rewound_count,
    forkedCount: row.forked_count, groupCount: row.group_count, outcomeCount: row.outcome_count,
    observedAt: row.observed_at, derivedRev: row.derived_rev,
  });
}
