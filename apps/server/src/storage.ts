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
import {
  BOARD_CONTROLS,
  SESSION_JOURNAL_KINDS,
  SESSION_KINDS,
  type ArenaLeg,
  type BoardControl,
  type LiveSession,
  type MatchState,
  type SessionInvitation,
  type SessionJournalEntry,
  type SessionKind,
  type SessionProposal,
  type VoteOption,
  type VoteTally,
  type VoteWindow,
} from "./live-types.js";

export const RUN_ROLES = Object.freeze(["host", "participant", "spectator"] as const);
export type RunRole = (typeof RUN_ROLES)[number];

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

export interface ImportedGameRecord {
  readonly runId: string;
  readonly sourceKind: "pgn_paste" | "lichess_url";
  readonly sourceUrl: string | null;
  readonly movetextDigest: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly result: "1-0" | "0-1" | "1/2-1/2" | "*";
  readonly pgn: string;
  readonly licenceNote: string;
  readonly importedAt: string;
}
export type PublicTokenRecord =
  | { readonly id: string; readonly tokenHash: string; readonly scope: "story_read"; readonly runId: string; readonly branchId: string; readonly createdBy: string; readonly createdAt: string; readonly revokedAt: string | null }
  | { readonly id: string; readonly tokenHash: string; readonly scope: "session_join"; readonly sessionId: string; readonly matchSlot: "white" | "black" | null; readonly invitedRole: RunRole; readonly invitedHandle: string | null; readonly expiresAt: string; readonly usesRemaining: number; readonly createdBy: string; readonly createdAt: string; readonly revokedAt: string | null };
export interface RunDerivation { readonly derivedRunId: string; readonly sourceRunId: string; readonly sourceBranchId: string; readonly sourceNodeId: string; readonly kind: "flip_sides"; readonly createdAt: string; }

/** Persistence boundary for run snapshots, identity, grants, and the writer lease. */
export interface RunStorage {
  create(run: DrillRun, lease: LeaseHolder, title?: string): void;
  read(runId: string): StoredRun | undefined;
  list(learnerId: string, limit: number, offset: number): readonly RunSummary[];
  save(run: DrillRun, lease: LeaseHolder): void;
  createImportedRun?(run: DrillRun, lease: LeaseHolder, title: string, record: ImportedGameRecord): void;
  importedGame?(runId: string): ImportedGameRecord | undefined;
  createPublicToken?(record: PublicTokenRecord): void;
  publicTokens?(runId: string, creatorId: string): readonly Extract<PublicTokenRecord, { scope: "story_read" }>[];
  publicTokenByHash?(tokenHash: string): PublicTokenRecord | undefined;
  revokePublicToken?(runId: string, tokenId: string, creatorId: string, at: string): void;
  createDerivedRun?(run: DrillRun, lease: LeaseHolder, title: string, derivation: RunDerivation): void;
  derivationFor?(runId: string): RunDerivation | undefined;
  derivationsFrom?(runId: string): readonly RunDerivation[];
  liveSessionByRun?(runId: string): LiveSession | undefined;
  matchState?(sessionId: string): MatchState | undefined;

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
  claimLease(runId: string, lease: LeaseHolder, expectedHolderLearnerId?: string): void;
  close(): void;
}

export interface LiveSessionStorage {
  createLiveSession(input: {
    readonly id: string; readonly runId: string; readonly kind: SessionKind;
    readonly title: string; readonly boardControl: BoardControl;
    readonly scheduledFor?: string; readonly voteAdapterLearnerId?: string;
    readonly rotation?: readonly string[]; readonly createdBy: string; readonly at: string;
    readonly matchPlayers?: { readonly whiteLearnerId: string | null; readonly blackLearnerId: string | null };
  }): LiveSession;
  liveSession(sessionId: string): LiveSession | undefined;
  liveSessionByRun(runId: string): LiveSession | undefined;
  listLiveSessions(learnerId: string): readonly LiveSession[];
  closeLiveSession(sessionId: string, actorLearnerId: string, at: string): LiveSession;
  sessionJournal(sessionId: string, sinceSeq: number): readonly SessionJournalEntry[];
  boardOperation(sessionId: string, actorLearnerId: string, operation: {
    readonly op: "offer" | "withdraw" | "advance" | "reclaim";
    readonly learnerId?: string;
    readonly writerId?: string;
  }, at: string): LiveSession;
  createProposal(input: Omit<SessionProposal, "status" | "resolvedRunSeq">): SessionProposal;
  proposals(sessionId: string): readonly SessionProposal[];
  resolveProposal(proposalId: string, status: "applied" | "declined", runSeq: number, actorLearnerId: string, at: string): SessionProposal;
  createVoteWindow(input: Omit<VoteWindow, "state" | "appliedOptionUci">, actorLearnerId: string): VoteWindow;
  voteWindow(sessionId: string, windowId?: string): VoteWindow | undefined;
  castVote(input: { readonly sessionId: string; readonly windowId: string; readonly voterKey: string; readonly choiceUci: string; readonly castByLearnerId: string; readonly at: string }): void;
  voteCapacity(sessionId: string, windowId: string, voterKey: string): { readonly total: number; readonly exists: boolean };
  voteTally(sessionId: string, windowId: string): VoteTally;
  closeVoteWindow(sessionId: string, windowId: string, actorLearnerId: string, at: string, appliedOptionUci?: string): VoteWindow;
  transitionVoteWindow(sessionId:string,windowId:string,state:"closed"|"stale",at:string):VoteWindow;
  createInvitation(input: Omit<SessionInvitation, "id" | "state" | "createdAt"> & { readonly at: string }): SessionInvitation;
  invitations(sessionId: string): readonly SessionInvitation[];
  arenaLegs(sessionId: string): readonly ArenaLeg[];
  saveArenaLeg(leg: ArenaLeg, actorLearnerId: string, runSeq: number, at: string): void;
  saveArenaImport(run: DrillRun, lease: LeaseHolder, leg: ArenaLeg, actorLearnerId: string, at: string): void;
  matchState(sessionId: string): MatchState | undefined;
  updateMatchState(sessionId: string, actorLearnerId: string, operation: "propose_pause" | "accept_pause" | "withdraw_pause" | "pause" | "resume", at: string): MatchState;
  seatMatchPlayer(sessionId: string, slot: "white" | "black", learnerId: string, at: string, tokenId: string): MatchState;
  createSessionJoinToken(record: Extract<PublicTokenRecord, { scope: "session_join" }>): void;
  sessionJoinTokens(sessionId: string, creatorId: string): readonly Extract<PublicTokenRecord, { scope: "session_join" }>[];
  redeemSessionJoinToken(tokenHash: string, learnerId: string, handle: string, at: string): { readonly token: Extract<PublicTokenRecord, { scope: "session_join" }>; readonly session: LiveSession } | undefined;
  revokeSessionJoinToken(sessionId: string, tokenId: string, creatorId: string, at: string): void;
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

export interface StoredPackDraft {
  readonly id: string;
  readonly packId: string;
  readonly ownerLearnerId: string;
  readonly document: unknown;
  readonly digest: string;
  readonly state: "draft" | "registered" | "withdrawn";
  readonly seedKind: "blank" | "candidate" | "pgn" | "run" | "version" | "interchange";
  readonly seedRef: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StoredRegisteredPack {
  readonly packId: string;
  readonly version: string;
  readonly digest: string;
  readonly document: unknown;
  readonly publisherHandle: string;
  readonly publisherLearnerId: string;
  readonly draftId: string;
  readonly registeredAt: string;
}

export interface StoredShapeDraft {
  readonly id: string;
  readonly shapeId: string;
  readonly ownerLearnerId: string;
  readonly document: unknown;
  readonly digest: string;
  readonly state: "draft" | "registered" | "withdrawn";
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StoredRegisteredShape {
  readonly shapeId: string;
  readonly version: string;
  readonly digest: string;
  readonly document: unknown;
  readonly publisherHandle: string;
  readonly publisherLearnerId: string;
  readonly draftId: string;
  readonly registeredAt: string;
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

export const STORAGE_VERSION = 14;
const LEGACY_ID = "__legacy";
const LEGACY_HASH = "!";

function isRunRole(value: unknown): value is RunRole {
  return RUN_ROLES.includes(value as RunRole);
}

export function runRoleMayWrite(role: RunRole): boolean {
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
    (parsed.sessionKind !== "pack" &&
      parsed.sessionKind !== "position" &&
      parsed.sessionKind !== "imported") ||
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

export class SQLiteRunStorage implements RunStorage, ProgressStorage, LiveSessionStorage {
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

  createImportedRun(run: DrillRun, lease: LeaseHolder, title: string, record: ImportedGameRecord): void {
    const updatedAt = this.#now();
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      this.#database.prepare(`INSERT INTO drill_runs
        (id,snapshot_json,active_writer_id,updated_at,summary_json,owner_learner_id,active_writer_learner_id,schema_version)
        VALUES (?,?,?,?,?,?,?,?)`).run(
          run.id, JSON.stringify(run), lease.writerId, updatedAt,
          JSON.stringify(summaryFields(run, title, updatedAt)), lease.learnerId,
          lease.learnerId, run.schemaVersion,
        );
      this.#database.prepare(`INSERT INTO run_grants (run_id,learner_id,role,granted_at)
        VALUES (?,?,'host',?)`).run(run.id, lease.learnerId, updatedAt);
      this.#database.prepare(`INSERT INTO imported_games
        (run_id,source_kind,source_url,movetext_digest,headers_json,result,pgn,licence_note,imported_at)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(
          record.runId, record.sourceKind, record.sourceUrl, record.movetextDigest,
          JSON.stringify(record.headers), record.result, record.pgn, record.licenceNote,
          record.importedAt,
        );
      this.#database.exec("COMMIT");
      this.#snapshots.set(run.id, Object.freeze({ run, activeWriterId: lease.writerId, activeWriterLearnerId: lease.learnerId }));
    } catch (error) {
      this.#rollback();
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        throw new ServerError("RUN_ALREADY_EXISTS", `Run already exists: ${run.id}`, { cause: error });
      }
      throw storageFailure("Could not create imported run", error);
    }
  }

  importedGame(runId: string): ImportedGameRecord | undefined {
    const row = this.#database.prepare("SELECT * FROM imported_games WHERE run_id = ?").get(runId) as Record<string, unknown> | undefined;
    if (row === undefined) return undefined;
    const headers = JSON.parse(String(row.headers_json)) as Record<string, string>;
    return Object.freeze({
      runId: String(row.run_id),
      sourceKind: String(row.source_kind) as ImportedGameRecord["sourceKind"],
      sourceUrl: row.source_url === null ? null : String(row.source_url),
      movetextDigest: String(row.movetext_digest),
      headers: Object.freeze(headers),
      result: String(row.result) as ImportedGameRecord["result"],
      pgn: String(row.pgn),
      licenceNote: String(row.licence_note),
      importedAt: String(row.imported_at),
    });
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

  createPublicToken(record: PublicTokenRecord): void {
    if(record.scope!=="story_read")throw new TypeError("createPublicToken accepts story tokens only");
    try { this.#database.prepare("INSERT INTO public_tokens (id,token_hash,scope,run_id,branch_id,created_by,created_at,revoked_at) VALUES (?,?,?,?,?,?,?,NULL)").run(record.id,record.tokenHash,record.scope,record.runId,record.branchId,record.createdBy,record.createdAt); }
    catch (error) { throw storageFailure("Could not create public token", error); }
  }

  publicTokens(runId:string,creatorId:string):readonly Extract<PublicTokenRecord,{scope:"story_read"}>[]{
    const rows=this.#database.prepare("SELECT * FROM public_tokens WHERE run_id=? AND created_by=? ORDER BY created_at,id").all(runId,creatorId) as readonly Record<string,unknown>[];
    return Object.freeze(rows.map((row)=>this.#publicToken(row) as Extract<PublicTokenRecord,{scope:"story_read"}>));
  }

  publicTokenByHash(tokenHash:string):PublicTokenRecord|undefined{
    const row=this.#database.prepare("SELECT * FROM public_tokens WHERE token_hash=? AND revoked_at IS NULL").get(tokenHash) as Record<string,unknown>|undefined;
    if(row===undefined)return undefined;
    if(row.scope==="session_join"&&(String(row.expires_at)<=this.#now()||Number(row.uses_remaining)<=0))return undefined;
    return this.#publicToken(row);
  }

  revokePublicToken(runId:string,tokenId:string,creatorId:string,at:string):void{
    this.#database.prepare("UPDATE public_tokens SET revoked_at=? WHERE id=? AND run_id=? AND created_by=? AND revoked_at IS NULL").run(at,tokenId,runId,creatorId);
  }

  createSessionJoinToken(record:Extract<PublicTokenRecord,{scope:"session_join"}>):void{
    try{this.#database.exec("BEGIN IMMEDIATE");this.#database.prepare(`INSERT INTO public_tokens
      (id,token_hash,scope,session_id,match_slot,invited_role,invited_handle,expires_at,uses_remaining,created_by,created_at,revoked_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,NULL)`).run(record.id,record.tokenHash,record.scope,record.sessionId,record.matchSlot,record.invitedRole,record.invitedHandle,record.expiresAt,record.usesRemaining,record.createdBy,record.createdAt);this.#appendSessionJournal(record.sessionId,"link.minted",record.createdBy,this.#sessionRunSeq(record.sessionId),{tokenId:record.id},record.createdAt);this.#database.exec("COMMIT");}
    catch(error){this.#rollback();throw storageFailure("Could not create session join token",error);}
  }

  sessionJoinTokens(sessionId:string,creatorId:string):readonly Extract<PublicTokenRecord,{scope:"session_join"}>[]{
    const rows=this.#database.prepare("SELECT * FROM public_tokens WHERE session_id=? AND created_by=? ORDER BY created_at,id").all(sessionId,creatorId) as readonly Record<string,unknown>[];
    return Object.freeze(rows.map((row)=>this.#publicToken(row) as Extract<PublicTokenRecord,{scope:"session_join"}>));
  }

  revokeSessionJoinToken(sessionId:string,tokenId:string,creatorId:string,at:string):void{
    try{this.#database.exec("BEGIN IMMEDIATE");const changed=this.#database.prepare("UPDATE public_tokens SET revoked_at=? WHERE id=? AND session_id=? AND created_by=? AND scope='session_join' AND revoked_at IS NULL").run(at,tokenId,sessionId,creatorId);
    if(changed.changes===1)this.#appendSessionJournal(sessionId,"link.revoked",creatorId,this.#sessionRunSeq(sessionId),{tokenId},at);this.#database.exec("COMMIT");}
    catch(error){this.#rollback();throw storageFailure("Could not revoke session join token",error);}
  }

  createDerivedRun(run:DrillRun,lease:LeaseHolder,title:string,derivation:RunDerivation):void{
    const updatedAt=this.#now();
    try{
      this.#database.exec("BEGIN IMMEDIATE");
      this.#database.prepare(`INSERT INTO drill_runs (id,snapshot_json,active_writer_id,updated_at,summary_json,owner_learner_id,active_writer_learner_id,schema_version) VALUES (?,?,?,?,?,?,?,?)`).run(run.id,JSON.stringify(run),lease.writerId,updatedAt,JSON.stringify(summaryFields(run,title,updatedAt)),lease.learnerId,lease.learnerId,run.schemaVersion);
      this.#database.prepare("INSERT INTO run_grants (run_id,learner_id,role,granted_at) VALUES (?,?,'host',?)").run(run.id,lease.learnerId,updatedAt);
      this.#database.prepare("INSERT INTO run_derivations (derived_run_id,source_run_id,source_branch_id,source_node_id,kind,created_at) VALUES (?,?,?,?,?,?)").run(derivation.derivedRunId,derivation.sourceRunId,derivation.sourceBranchId,derivation.sourceNodeId,derivation.kind,derivation.createdAt);
      this.#database.exec("COMMIT"); this.#snapshots.set(run.id,Object.freeze({run,activeWriterId:lease.writerId,activeWriterLearnerId:lease.learnerId}));
    }catch(error){this.#rollback();throw storageFailure("Could not create derived run",error);}
  }

  derivationFor(runId:string):RunDerivation|undefined{const row=this.#database.prepare("SELECT * FROM run_derivations WHERE derived_run_id=?").get(runId) as Record<string,unknown>|undefined;return row===undefined?undefined:this.#derivation(row);}
  derivationsFrom(runId:string):readonly RunDerivation[]{const rows=this.#database.prepare("SELECT * FROM run_derivations WHERE source_run_id=? ORDER BY created_at,derived_run_id").all(runId) as readonly Record<string,unknown>[];return Object.freeze(rows.map((row)=>this.#derivation(row)));}

  #publicToken(row:Record<string,unknown>):PublicTokenRecord{
    const common={id:String(row.id),tokenHash:String(row.token_hash),createdBy:String(row.created_by),createdAt:String(row.created_at),revokedAt:row.revoked_at===null?null:String(row.revoked_at)};
    return row.scope==="session_join"
      ? Object.freeze({...common,scope:"session_join" as const,sessionId:String(row.session_id),matchSlot:row.match_slot===null?null:String(row.match_slot) as "white"|"black",invitedRole:String(row.invited_role) as RunRole,invitedHandle:row.invited_handle===null?null:String(row.invited_handle),expiresAt:String(row.expires_at),usesRemaining:Number(row.uses_remaining)})
      : Object.freeze({...common,scope:"story_read" as const,runId:String(row.run_id),branchId:String(row.branch_id)});
  }
  #derivation(row:Record<string,unknown>):RunDerivation{return Object.freeze({derivedRunId:String(row.derived_run_id),sourceRunId:String(row.source_run_id),sourceBranchId:String(row.source_branch_id),sourceNodeId:String(row.source_node_id),kind:"flip_sides",createdAt:String(row.created_at)});}

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
      for (const row of activeRuns) {
        const session = this.#database.prepare("SELECT id FROM live_sessions WHERE run_id=?").get(row.id) as {id?:unknown}|undefined;
        if (typeof session?.id === "string") {
          this.#appendSessionJournal(session.id,"board.granted",null,this.#runSeq(row.id),{holderLearnerId:LEGACY_ID},at);
        }
      }
      this.#database.prepare(
        "UPDATE pack_drafts SET state = CASE WHEN state = 'registered' THEN state ELSE 'withdrawn' END, owner_learner_id = ? WHERE owner_learner_id = ?",
      ).run(LEGACY_ID, learnerId);
      this.#database.prepare(
        "UPDATE registered_packs SET publisher_learner_id = ? WHERE publisher_learner_id = ?",
      ).run(LEGACY_ID, learnerId);
      this.#database.prepare(
        "UPDATE shape_drafts SET state = CASE WHEN state = 'registered' THEN state ELSE 'withdrawn' END, owner_learner_id = ? WHERE owner_learner_id = ?",
      ).run(LEGACY_ID, learnerId);
      this.#database.prepare(
        "UPDATE registered_shapes SET publisher_learner_id = ? WHERE publisher_learner_id = ?",
      ).run(LEGACY_ID, learnerId);
      this.#database.prepare("UPDATE live_sessions SET created_by = ? WHERE created_by = ?").run(LEGACY_ID,learnerId);
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

  claimLease(runId: string, lease: LeaseHolder, expectedHolderLearnerId?: string): void {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const role = this.#roleInTransaction(runId, lease.learnerId);
      if (role === undefined) throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);
      if (!runRoleMayWrite(role)) {
        throw new ServerError("FORBIDDEN", "This learner may not claim the run lease");
      }
      const current = this.#database.prepare(
        "SELECT active_writer_learner_id,snapshot_json FROM drill_runs WHERE id=?",
      ).get(runId) as { readonly active_writer_learner_id?: unknown;readonly snapshot_json?:unknown } | undefined;
      if (typeof current?.active_writer_learner_id !== "string"||typeof current.snapshot_json!=="string") {
        throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${runId}`);
      }
      const witness = current.active_writer_learner_id;
      if (expectedHolderLearnerId !== undefined && expectedHolderLearnerId !== witness) {
        throw new ServerError("LEASE_MOVED", "The board holder changed before this claim");
      }
      const sessionRow = this.#database.prepare("SELECT * FROM live_sessions WHERE run_id=?").get(runId) as Record<string,unknown>|undefined;
      let boardControl: BoardControl;
      if (sessionRow === undefined) {
        const count = this.#database.prepare("SELECT count(*) AS count FROM run_grants WHERE run_id=? AND role IN ('host','participant')").get(runId) as {count:number};
        boardControl = count.count <= 1 ? "free_claim" : "host_directed";
      } else boardControl = String(sessionRow.board_control) as BoardControl;
      if (boardControl === "host_directed" && role !== "host" && sessionRow?.handoff_learner_id !== lease.learnerId) {
        throw new ServerError("BOARD_HELD", "The host has not offered this learner the board");
      }
      if (boardControl === "rotation") {
        const rotation = JSON.parse(String(sessionRow?.rotation_json ?? "[]")) as string[];
        if (rotation[Number(sessionRow?.rotation_cursor ?? 0)] !== lease.learnerId) {
          throw new ServerError("BOARD_HELD", "It is another learner's turn in the rotation");
        }
      }
      if(boardControl==="match"){
        const state=this.#database.prepare("SELECT * FROM match_states WHERE session_id=?").get(String(sessionRow?.id)) as Record<string,unknown>|undefined;
        if(state===undefined)throw new ServerError("STORAGE_FAILURE","Native match state is missing");
        if(state.paused_at===null){
          const snapshot=JSON.parse(current.snapshot_json) as DrillRun;
          const node=snapshot.nodes.find((candidate)=>candidate.id===snapshot.activeCursor.nodeId);
          if(node===undefined)throw new ServerError("STORAGE_FAILURE","Match cursor node is missing");
          const expected=node.fen.split(" ")[1]==="w"?state.white_learner_id:state.black_learner_id;
          if(expected===null||expected!==lease.learnerId)throw new ServerError("BOARD_HELD","It is another learner's move");
        }
      }
      const result = this.#database
        .prepare(
          `UPDATE drill_runs SET active_writer_id = ?, active_writer_learner_id = ?
           WHERE id = ? AND active_writer_learner_id = ?`,
        )
        .run(lease.writerId, lease.learnerId, runId, witness);
      if (result.changes !== 1) throw new ServerError("LEASE_MOVED", "The board holder changed before this claim");
      if (sessionRow !== undefined) {
        this.#appendSessionJournal(String(sessionRow.id),"board.granted",lease.learnerId,this.#runSeq(runId),{holderLearnerId:lease.learnerId},this.#now());
        this.#database.prepare("UPDATE live_sessions SET handoff_learner_id=NULL WHERE id=?").run(String(sessionRow.id));
      }
      this.#database.exec("COMMIT");
      this.#setCachedLease(runId, lease);
    } catch (error) {
      this.#rollback();
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

  createPackDraft(input: StoredPackDraft): void {
    this.#database.prepare(`INSERT INTO pack_drafts
      (id, pack_id, owner_learner_id, document_json, digest, state, seed_kind,
       seed_ref, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(input.id, input.packId, input.ownerLearnerId, JSON.stringify(input.document),
        input.digest, input.state, input.seedKind, input.seedRef, input.createdAt, input.updatedAt);
  }

  packDraft(id: string, ownerLearnerId: string): StoredPackDraft | undefined {
    const row = this.#database.prepare(
      "SELECT * FROM pack_drafts WHERE id = ? AND owner_learner_id = ?",
    ).get(id, ownerLearnerId) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : this.#packDraftRow(row);
  }

  packDrafts(ownerLearnerId: string): readonly StoredPackDraft[] {
    return Object.freeze((this.#database.prepare(
      "SELECT * FROM pack_drafts WHERE owner_learner_id = ? ORDER BY updated_at DESC, id",
    ).all(ownerLearnerId) as readonly Record<string, unknown>[]).map((row) => this.#packDraftRow(row)));
  }

  updatePackDraft(id: string, ownerLearnerId: string, expectedDigest: string, document: unknown, digest: string, at: string): boolean {
    const result = this.#database.prepare(`UPDATE pack_drafts SET document_json = ?,
      pack_id = ?, digest = ?, updated_at = ? WHERE id = ? AND owner_learner_id = ?
      AND digest = ? AND state = 'draft'`).run(
      JSON.stringify(document), String((document as Record<string, unknown>).id), digest, at,
      id, ownerLearnerId, expectedDigest,
    );
    return result.changes === 1;
  }

  withdrawPackDraft(id: string, ownerLearnerId: string): boolean {
    return this.#database.prepare(
      "UPDATE pack_drafts SET state = 'withdrawn' WHERE id = ? AND owner_learner_id = ? AND state = 'draft'",
    ).run(id, ownerLearnerId).changes === 1;
  }

  registerPackDraft(input: StoredRegisteredPack): void {
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      const draft = this.#database.prepare(
        "SELECT state, owner_learner_id FROM pack_drafts WHERE id = ?",
      ).get(input.draftId) as Record<string, unknown> | undefined;
      if (draft?.state !== "draft" || draft.owner_learner_id !== input.publisherLearnerId) {
        throw new ServerError("RUN_NOT_FOUND", `Unknown draft: ${input.draftId}`);
      }
      this.#database.prepare(`INSERT INTO registered_packs
        (pack_id, version, digest, document_json, publisher_handle,
         publisher_learner_id, draft_id, registered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(input.packId, input.version, input.digest, JSON.stringify(input.document),
          input.publisherHandle, input.publisherLearnerId, input.draftId, input.registeredAt);
      this.#database.prepare("UPDATE pack_drafts SET state = 'registered' WHERE id = ?").run(input.draftId);
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#rollback();
      throw error;
    }
  }

  registeredPacks(): readonly StoredRegisteredPack[] {
    return Object.freeze((this.#database.prepare(
      "SELECT * FROM registered_packs ORDER BY pack_id, registered_at",
    ).all() as readonly Record<string, unknown>[]).map((row) => Object.freeze({
      packId: String(row.pack_id), version: String(row.version), digest: String(row.digest),
      document: JSON.parse(String(row.document_json)), publisherHandle: String(row.publisher_handle),
      publisherLearnerId: String(row.publisher_learner_id), draftId: String(row.draft_id),
      registeredAt: String(row.registered_at),
    })));
  }

  createShapeDraft(input: StoredShapeDraft): void {
    this.#database.prepare(`INSERT INTO shape_drafts
      (id, shape_id, owner_learner_id, document_json, digest, state, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(input.id, input.shapeId, input.ownerLearnerId,
      JSON.stringify(input.document), input.digest, input.state, input.createdAt, input.updatedAt);
  }

  shapeDraft(id: string, ownerLearnerId: string): StoredShapeDraft | undefined {
    const row = this.#database.prepare("SELECT * FROM shape_drafts WHERE id = ? AND owner_learner_id = ?").get(id, ownerLearnerId) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : this.#shapeDraftRow(row);
  }

  shapeDrafts(ownerLearnerId: string): readonly StoredShapeDraft[] {
    return Object.freeze((this.#database.prepare("SELECT * FROM shape_drafts WHERE owner_learner_id = ? ORDER BY updated_at DESC, id").all(ownerLearnerId) as readonly Record<string, unknown>[]).map((row) => this.#shapeDraftRow(row)));
  }

  updateShapeDraft(id: string, ownerLearnerId: string, expectedDigest: string, document: unknown, digest: string, at: string): boolean {
    return this.#database.prepare(`UPDATE shape_drafts SET document_json=?, shape_id=?, digest=?, updated_at=?
      WHERE id=? AND owner_learner_id=? AND digest=? AND state='draft'`).run(JSON.stringify(document), String((document as Record<string, unknown>).id), digest, at, id, ownerLearnerId, expectedDigest).changes === 1;
  }

  registerShapeDraft(input: StoredRegisteredShape): void {
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      const draft = this.#database.prepare("SELECT state,owner_learner_id FROM shape_drafts WHERE id=?").get(input.draftId) as Record<string, unknown> | undefined;
      if (draft?.state !== "draft" || draft.owner_learner_id !== input.publisherLearnerId) throw new ServerError("RUN_NOT_FOUND", `Unknown shape draft: ${input.draftId}`);
      this.#database.prepare(`INSERT INTO registered_shapes
        (shape_id,version,digest,document_json,publisher_handle,publisher_learner_id,draft_id,registered_at)
        VALUES (?,?,?,?,?,?,?,?)`).run(input.shapeId,input.version,input.digest,JSON.stringify(input.document),input.publisherHandle,input.publisherLearnerId,input.draftId,input.registeredAt);
      this.#database.prepare("UPDATE shape_drafts SET state='registered' WHERE id=?").run(input.draftId);
      this.#database.exec("COMMIT");
    } catch (error) { this.#rollback(); throw error; }
  }

  registeredShapes(): readonly StoredRegisteredShape[] {
    return Object.freeze((this.#database.prepare("SELECT * FROM registered_shapes ORDER BY shape_id,registered_at").all() as readonly Record<string, unknown>[]).map((row) => Object.freeze({
      shapeId:String(row.shape_id),version:String(row.version),digest:String(row.digest),document:JSON.parse(String(row.document_json)),publisherHandle:String(row.publisher_handle),publisherLearnerId:String(row.publisher_learner_id),draftId:String(row.draft_id),registeredAt:String(row.registered_at),
    })));
  }

  #shapeDraftRow(row: Record<string, unknown>): StoredShapeDraft {
    return Object.freeze({ id:String(row.id),shapeId:String(row.shape_id),ownerLearnerId:String(row.owner_learner_id),document:JSON.parse(String(row.document_json)),digest:String(row.digest),state:row.state as StoredShapeDraft["state"],createdAt:String(row.created_at),updatedAt:String(row.updated_at) });
  }

  storePlaytestDocument(digest: string, draftId: string, document: unknown, at: string): void {
    this.#database.prepare(`INSERT OR IGNORE INTO playtest_documents
      (digest, draft_id, document_json, created_at) VALUES (?, ?, ?, ?)`)
      .run(digest, draftId, JSON.stringify(document), at);
  }

  playtestDocuments(): readonly { readonly digest: string; readonly document: unknown }[] {
    return Object.freeze((this.#database.prepare(
      "SELECT digest, document_json FROM playtest_documents ORDER BY created_at, digest",
    ).all() as readonly Record<string, unknown>[]).map((row) => Object.freeze({
      digest: String(row.digest), document: JSON.parse(String(row.document_json)),
    })));
  }

  #packDraftRow(row: Record<string, unknown>): StoredPackDraft {
    return Object.freeze({
      id: String(row.id), packId: String(row.pack_id), ownerLearnerId: String(row.owner_learner_id),
      document: JSON.parse(String(row.document_json)), digest: String(row.digest),
      state: row.state as StoredPackDraft["state"], seedKind: row.seed_kind as StoredPackDraft["seedKind"],
      seedRef: row.seed_ref === null ? null : String(row.seed_ref), createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
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

  createLiveSession(input: {
    readonly id: string; readonly runId: string; readonly kind: SessionKind;
    readonly title: string; readonly boardControl: BoardControl;
    readonly scheduledFor?: string; readonly voteAdapterLearnerId?: string;
    readonly rotation?: readonly string[]; readonly createdBy: string; readonly at: string;
    readonly matchPlayers?: { readonly whiteLearnerId: string | null; readonly blackLearnerId: string | null };
  }): LiveSession {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      if (this.#roleInTransaction(input.runId, input.createdBy) !== "host") {
        throw new ServerError("FORBIDDEN", "Only a host may create a live session");
      }
      const run = this.#database.prepare(
        "SELECT active_writer_learner_id,snapshot_json FROM drill_runs WHERE id=?",
      ).get(input.runId) as { readonly active_writer_learner_id?: unknown; readonly snapshot_json?: unknown } | undefined;
      if (typeof run?.active_writer_learner_id !== "string" || typeof run.snapshot_json !== "string") {
        throw new ServerError("RUN_NOT_FOUND", `Unknown run: ${input.runId}`);
      }
      this.#database.prepare(`INSERT INTO live_sessions
        (id,run_id,kind,title,board_control,scheduled_for,vote_adapter_learner_id,rotation_json,created_by,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?)`).run(
          input.id, input.runId, input.kind, input.title, input.boardControl,
          input.scheduledFor ?? null, input.voteAdapterLearnerId ?? null,
          input.rotation === undefined ? null : JSON.stringify(input.rotation), input.createdBy, input.at,
        );
      const runSeq = this.#snapshotSeq(run.snapshot_json);
      this.#appendSessionJournal(input.id, "session.opened", input.createdBy, runSeq, {}, input.at);
      this.#appendSessionJournal(input.id, "board.granted", run.active_writer_learner_id, runSeq, {
        holderLearnerId: run.active_writer_learner_id,
        changedByLearnerId: input.createdBy,
      }, input.at);
      if(input.boardControl==="match"){
        const players=input.matchPlayers;
        if(input.kind!=="match"||players===undefined||(players.whiteLearnerId===null&&players.blackLearnerId===null)||players.whiteLearnerId!==null&&players.whiteLearnerId===players.blackLearnerId){
          throw new ServerError("INVALID_REQUEST","Native match needs one or two distinct players");
        }
        for(const learnerId of [players.whiteLearnerId,players.blackLearnerId]){
          if(learnerId===null)continue;
          const existing=this.#roleInTransaction(input.runId,learnerId);
          if(existing===undefined)this.#database.prepare("INSERT INTO run_grants(run_id,learner_id,role,granted_at) VALUES (?,?,'participant',?)").run(input.runId,learnerId,input.at);
          else if(existing==="spectator")this.#database.prepare("UPDATE run_grants SET role='participant',granted_at=? WHERE run_id=? AND learner_id=?").run(input.at,input.runId,learnerId);
        }
        this.#database.prepare("INSERT INTO match_states(session_id,white_learner_id,black_learner_id) VALUES (?,?,?)").run(input.id,players.whiteLearnerId,players.blackLearnerId);
      }
      if (input.kind === "match"&&input.boardControl!=="match") {
        const insert = this.#database.prepare("INSERT INTO arena_legs(session_id,leg) VALUES (?,?)");
        insert.run(input.id, 1); insert.run(input.id, 2);
      }
      this.#database.exec("COMMIT");
      return this.liveSession(input.id)!;
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      if (error instanceof Error && error.message.includes("UNIQUE constraint")) {
        throw new ServerError("INVALID_REQUEST", "A live session already exists for this run", { cause: error });
      }
      throw storageFailure("Could not create live session", error);
    }
  }

  liveSession(sessionId: string): LiveSession | undefined {
    const row = this.#database.prepare("SELECT * FROM live_sessions WHERE id=?").get(sessionId) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : this.#liveSessionRow(row);
  }

  liveSessionByRun(runId: string): LiveSession | undefined {
    const row = this.#database.prepare("SELECT * FROM live_sessions WHERE run_id=?").get(runId) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : this.#liveSessionRow(row);
  }

  listLiveSessions(learnerId: string): readonly LiveSession[] {
    const rows = this.#database.prepare(`SELECT s.* FROM live_sessions s
      JOIN run_grants g ON g.run_id=s.run_id AND g.learner_id=?
      ORDER BY COALESCE(s.scheduled_for,s.created_at),s.id`).all(learnerId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map((row) => this.#liveSessionRow(row)));
  }

  closeLiveSession(sessionId: string, actorLearnerId: string, at: string): LiveSession {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const session = this.#requiredLiveSessionRow(sessionId);
      if (this.#roleInTransaction(String(session.run_id), actorLearnerId) !== "host") {
        throw new ServerError("FORBIDDEN", "Only a host may close a live session");
      }
      this.#database.prepare("UPDATE live_sessions SET closed_at=? WHERE id=? AND closed_at IS NULL").run(at,sessionId);
      this.#appendSessionJournal(sessionId,"session.closed",actorLearnerId,this.#runSeq(String(session.run_id)),{},at);
      this.#database.exec("COMMIT");
      return this.liveSession(sessionId)!;
    } catch (error) { this.#rollback(); if (error instanceof ServerError) throw error; throw storageFailure("Could not close live session",error); }
  }

  sessionJournal(sessionId: string, sinceSeq: number): readonly SessionJournalEntry[] {
    const rows = this.#database.prepare("SELECT * FROM session_journal WHERE session_id=? AND seq>? ORDER BY seq").all(sessionId,sinceSeq) as readonly Record<string,unknown>[];
    return Object.freeze(rows.map((row) => Object.freeze({
      sessionId: String(row.session_id), seq: Number(row.seq), at: String(row.at),
      kind: String(row.kind) as SessionJournalEntry["kind"],
      actorLearnerId: row.actor_learner_id === null ? null : String(row.actor_learner_id),
      runSeq: row.run_seq === null ? null : Number(row.run_seq),
      payload: Object.freeze(JSON.parse(String(row.payload_json)) as Record<string,unknown>),
    })));
  }

  matchState(sessionId:string):MatchState|undefined{
    const row=this.#database.prepare("SELECT * FROM match_states WHERE session_id=?").get(sessionId) as Record<string,unknown>|undefined;
    return row===undefined?undefined:this.#matchStateRow(row);
  }

  updateMatchState(sessionId:string,actorLearnerId:string,operation:"propose_pause"|"accept_pause"|"withdraw_pause"|"pause"|"resume",at:string):MatchState{
    try{
      this.#database.exec("BEGIN IMMEDIATE");
      const session=this.#requiredLiveSessionRow(sessionId);
      const row=this.#database.prepare("SELECT * FROM match_states WHERE session_id=?").get(sessionId) as Record<string,unknown>|undefined;
      if(row===undefined||session.board_control!=="match")throw new ServerError("INVALID_REQUEST","Operation requires a native match");
      if(session.closed_at!==null)throw new ServerError("INVALID_REQUEST","The live session is closed");
      const isWhite=row.white_learner_id===actorLearnerId,isBlack=row.black_learner_id===actorLearnerId,isPlayer=isWhite||isBlack;
      const isNonPlayingHost=session.created_by===actorLearnerId&&!isPlayer;
      if(operation==="propose_pause"){
        if(!isPlayer||row.paused_at!==null)throw new ServerError("INVALID_REQUEST","Only a player in a live match may propose a pause");
        this.#database.prepare("UPDATE match_states SET pause_proposed_by=? WHERE session_id=?").run(actorLearnerId,sessionId);
        this.#appendSessionJournal(sessionId,"match.pause_proposed",actorLearnerId,this.#runSeq(String(session.run_id)),{},at);
      }else if(operation==="accept_pause"){
        if(!isPlayer||row.paused_at!==null||row.pause_proposed_by===null||row.pause_proposed_by===actorLearnerId)throw new ServerError("INVALID_REQUEST","The other player must accept a standing pause proposal");
        this.#database.prepare("UPDATE match_states SET paused_at=?,pause_proposed_by=NULL WHERE session_id=?").run(at,sessionId);
        this.#appendSessionJournal(sessionId,"match.paused",actorLearnerId,this.#runSeq(String(session.run_id)),{},at);
      }else if(operation==="withdraw_pause"){
        if(row.paused_at!==null||row.pause_proposed_by!==actorLearnerId)throw new ServerError("INVALID_REQUEST","Only the proposer may withdraw a live pause proposal");
        this.#database.prepare("UPDATE match_states SET pause_proposed_by=NULL WHERE session_id=?").run(sessionId);
      }else if(operation==="pause"){
        if(!isNonPlayingHost||row.paused_at!==null)throw new ServerError("INVALID_REQUEST","Only a non-playing host may pause unilaterally");
        this.#database.prepare("UPDATE match_states SET paused_at=?,pause_proposed_by=NULL WHERE session_id=?").run(at,sessionId);
        this.#appendSessionJournal(sessionId,"match.paused",actorLearnerId,this.#runSeq(String(session.run_id)),{},at);
      }else{
        if(row.paused_at===null||(!isPlayer&&!isNonPlayingHost))throw new ServerError("INVALID_REQUEST","A player or non-playing host may resume a paused match");
        this.#database.prepare("UPDATE match_states SET paused_at=NULL,pause_proposed_by=NULL WHERE session_id=?").run(sessionId);
        this.#appendSessionJournal(sessionId,"match.resumed",actorLearnerId,this.#runSeq(String(session.run_id)),{},at);
      }
      this.#database.exec("COMMIT");
      return this.matchState(sessionId)!;
    }catch(error){this.#rollback();if(error instanceof ServerError)throw error;throw storageFailure("Could not update native match",error);}
  }

  seatMatchPlayer(sessionId:string,slot:"white"|"black",learnerId:string,at:string,tokenId:string):MatchState{
    const column=slot==="white"?"white_learner_id":"black_learner_id";
    const changed=this.#database.prepare(`UPDATE match_states SET ${column}=? WHERE session_id=? AND ${column} IS NULL`).run(learnerId,sessionId);
    if(changed.changes!==1)throw new ServerError("INVALID_REQUEST","The match seat is no longer open");
    this.#appendSessionJournal(sessionId,"member.joined",learnerId,this.#sessionRunSeq(sessionId),{tokenId,slot},at);
    return this.matchState(sessionId)!;
  }

  redeemSessionJoinToken(tokenHash:string,learnerId:string,handle:string,at:string):{readonly token:Extract<PublicTokenRecord,{scope:"session_join"}>;readonly session:LiveSession}|undefined{
    try{
      this.#database.exec("BEGIN IMMEDIATE");
      const row=this.#database.prepare("SELECT * FROM public_tokens WHERE token_hash=? AND scope='session_join' AND revoked_at IS NULL AND expires_at>? AND uses_remaining>0").get(tokenHash,at) as Record<string,unknown>|undefined;
      if(row===undefined||(row.invited_handle!==null&&String(row.invited_handle)!==handle)){this.#database.exec("ROLLBACK");return undefined;}
      const session=this.#requiredLiveSessionRow(String(row.session_id));
      if(session.closed_at!==null){this.#database.exec("ROLLBACK");return undefined;}
      const role=String(row.invited_role) as RunRole;
      const existing=this.#roleInTransaction(String(session.run_id),learnerId);
      if(existing===undefined)this.#database.prepare("INSERT INTO run_grants(run_id,learner_id,role,granted_at) VALUES (?,?,?,?)").run(String(session.run_id),learnerId,role,at);
      else if(existing==="spectator"&&role==="participant")this.#database.prepare("UPDATE run_grants SET role='participant',granted_at=? WHERE run_id=? AND learner_id=?").run(at,String(session.run_id),learnerId);
      if(row.match_slot!==null){
        const column=row.match_slot==="white"?"white_learner_id":"black_learner_id";
        const changed=this.#database.prepare(`UPDATE match_states SET ${column}=? WHERE session_id=? AND ${column} IS NULL`).run(learnerId,String(row.session_id));
        if(changed.changes!==1){this.#database.exec("ROLLBACK");return undefined;}
      }
      this.#database.prepare("UPDATE public_tokens SET uses_remaining=uses_remaining-1 WHERE id=?").run(String(row.id));
      this.#appendSessionJournal(String(row.session_id),"member.joined",learnerId,this.#runSeq(String(session.run_id)),{tokenId:String(row.id),...(row.match_slot===null?{}:{slot:String(row.match_slot)})},at);
      this.#database.exec("COMMIT");
      return Object.freeze({token:this.#publicToken({...row,uses_remaining:Number(row.uses_remaining)-1}) as Extract<PublicTokenRecord,{scope:"session_join"}>,session:this.liveSession(String(row.session_id))!});
    }catch(error){this.#rollback();if(error instanceof ServerError)throw error;throw storageFailure("Could not redeem session join token",error);}
  }

  boardOperation(sessionId: string, actorLearnerId: string, operation: {
    readonly op: "offer" | "withdraw" | "advance" | "reclaim";
    readonly learnerId?: string; readonly writerId?: string;
  }, at: string): LiveSession {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const row = this.#requiredLiveSessionRow(sessionId);
      const runId = String(row.run_id);
      if (this.#roleInTransaction(runId,actorLearnerId) !== "host") throw new ServerError("FORBIDDEN","Only a host may control the board");
      if (row.closed_at !== null) throw new ServerError("INVALID_REQUEST","The live session is closed");
      if (operation.op === "offer") {
        if (operation.learnerId === undefined || !runRoleMayWrite(this.#roleInTransaction(runId,operation.learnerId) as RunRole)) throw new ServerError("INVALID_REQUEST","Handoff target needs write access");
        this.#database.prepare("UPDATE live_sessions SET handoff_learner_id=? WHERE id=?").run(operation.learnerId,sessionId);
      } else if (operation.op === "withdraw") {
        this.#database.prepare("UPDATE live_sessions SET handoff_learner_id=NULL WHERE id=?").run(sessionId);
      } else if (operation.op === "advance") {
        if (row.board_control !== "rotation") throw new ServerError("INVALID_REQUEST","advance requires rotation board control");
        const rotation = JSON.parse(String(row.rotation_json ?? "[]")) as string[];
        if (rotation.length === 0) throw new ServerError("INVALID_REQUEST","rotation is empty");
        this.#database.prepare("UPDATE live_sessions SET rotation_cursor=(rotation_cursor+1)%? WHERE id=?").run(rotation.length,sessionId);
      } else {
        const writerId = operation.writerId;
        if (writerId === undefined) throw new ServerError("INVALID_REQUEST","reclaim requires writerId");
        this.#database.prepare("UPDATE drill_runs SET active_writer_id=?,active_writer_learner_id=? WHERE id=?").run(writerId,actorLearnerId,runId);
        this.#database.prepare("UPDATE live_sessions SET handoff_learner_id=NULL WHERE id=?").run(sessionId);
        this.#appendSessionJournal(sessionId,"board.granted",actorLearnerId,this.#runSeq(runId),{holderLearnerId:actorLearnerId},at);
        this.#setCachedLease(runId,{writerId,learnerId:actorLearnerId});
      }
      this.#database.exec("COMMIT");
      return this.liveSession(sessionId)!;
    } catch (error) { this.#rollback(); if (error instanceof ServerError) throw error; throw storageFailure("Could not update board control",error); }
  }

  createProposal(input: Omit<SessionProposal,"status"|"resolvedRunSeq">): SessionProposal {
    this.#database.prepare("UPDATE session_proposals SET status='stale' WHERE session_id=? AND node_id=? AND proposed_by=? AND status='open'").run(input.sessionId,input.nodeId,input.proposedBy);
    this.#database.prepare(`INSERT INTO session_proposals(id,session_id,node_id,move_uci,proposed_by,at,status)
      VALUES(?,?,?,?,?,?,'open')`).run(input.id,input.sessionId,input.nodeId,input.moveUci,input.proposedBy,input.at);
    this.#appendSessionJournal(input.sessionId,"proposal.made",input.proposedBy,this.#sessionRunSeq(input.sessionId),{proposalId:input.id,nodeId:input.nodeId,moveUci:input.moveUci},input.at);
    return Object.freeze({...input,status:"open",resolvedRunSeq:null});
  }

  proposals(sessionId: string): readonly SessionProposal[] {
    const session=this.liveSession(sessionId);if(session!==undefined){const active=this.read(session.runId)?.run.activeCursor.nodeId;if(active!==undefined)this.#database.prepare("UPDATE session_proposals SET status='stale' WHERE session_id=? AND status='open' AND node_id<>?").run(sessionId,active);}
    const rows = this.#database.prepare("SELECT * FROM session_proposals WHERE session_id=? ORDER BY at,id").all(sessionId) as readonly Record<string,unknown>[];
    return Object.freeze(rows.map((row) => this.#proposalRow(row)));
  }

  resolveProposal(proposalId: string,status: "applied"|"declined",runSeq:number,actorLearnerId:string,at:string): SessionProposal {
    const found = this.#database.prepare("SELECT * FROM session_proposals WHERE id=?").get(proposalId) as Record<string,unknown>|undefined;
    if (found === undefined) throw new ServerError("INVALID_REQUEST","Unknown proposal");
    if (found.status !== "open") throw new ServerError("INVALID_REQUEST","Proposal is not open");
    this.#database.prepare("UPDATE session_proposals SET status=?,resolved_run_seq=? WHERE id=?").run(status,runSeq,proposalId);
    this.#appendSessionJournal(String(found.session_id),status === "applied" ? "proposal.applied":"proposal.declined",actorLearnerId,runSeq,{proposalId},at);
    return this.#proposalRow({...found,status,resolved_run_seq:runSeq});
  }

  createVoteWindow(input: Omit<VoteWindow,"state"|"appliedOptionUci">,actorLearnerId:string): VoteWindow {
    this.#database.prepare("UPDATE session_vote_windows SET state='closed' WHERE session_id=? AND state='open'").run(input.sessionId);
    this.#database.prepare(`INSERT INTO session_vote_windows(id,session_id,node_id,prompt,options_json,opens_at,closes_at,state)
      VALUES(?,?,?,?,?,?,?,'open')`).run(input.id,input.sessionId,input.nodeId,input.prompt,JSON.stringify(input.options),input.opensAt,input.closesAt);
    this.#appendSessionJournal(input.sessionId,"vote.opened",actorLearnerId,this.#sessionRunSeq(input.sessionId),{windowId:input.id},input.opensAt);
    return Object.freeze({...input,state:"open",appliedOptionUci:null});
  }

  voteWindow(sessionId:string,windowId?:string): VoteWindow|undefined {
    const row = (windowId === undefined
      ? this.#database.prepare("SELECT * FROM session_vote_windows WHERE session_id=? ORDER BY opens_at DESC LIMIT 1").get(sessionId)
      : this.#database.prepare("SELECT * FROM session_vote_windows WHERE session_id=? AND id=?").get(sessionId,windowId)) as Record<string,unknown>|undefined;
    return row === undefined ? undefined : this.#voteWindowRow(row);
  }

  castVote(input:{readonly sessionId:string;readonly windowId:string;readonly voterKey:string;readonly choiceUci:string;readonly castByLearnerId:string;readonly at:string}):void {
    this.#database.prepare(`INSERT INTO session_votes(session_id,window_id,voter_key,choice_uci,cast_by_learner_id,at)
      VALUES(?,?,?,?,?,?) ON CONFLICT(session_id,window_id,voter_key) DO UPDATE SET choice_uci=excluded.choice_uci,cast_by_learner_id=excluded.cast_by_learner_id,at=excluded.at`)
      .run(input.sessionId,input.windowId,input.voterKey,input.choiceUci,input.castByLearnerId,input.at);
  }

  voteCapacity(sessionId:string,windowId:string,voterKey:string):{readonly total:number;readonly exists:boolean}{
    const total=this.#database.prepare("SELECT count(*) AS count FROM session_votes WHERE session_id=? AND window_id=?").get(sessionId,windowId) as {count:number};
    const exists=this.#database.prepare("SELECT 1 AS found FROM session_votes WHERE session_id=? AND window_id=? AND voter_key=?").get(sessionId,windowId,voterKey);
    return Object.freeze({total:total.count,exists:exists!==undefined});
  }

  voteTally(sessionId:string,windowId:string):VoteTally {
    const window = this.voteWindow(sessionId,windowId);
    if (window === undefined) throw new ServerError("INVALID_REQUEST","Unknown vote window");
    const rows = this.#database.prepare("SELECT choice_uci,count(*) AS count FROM session_votes WHERE session_id=? AND window_id=? GROUP BY choice_uci").all(sessionId,windowId) as readonly Record<string,unknown>[];
    const counts = new Map(rows.map((row)=>[String(row.choice_uci),Number(row.count)]));
    const tally = Object.freeze(window.options.map((option)=>Object.freeze({...option,count:counts.get(option.moveUci)??0})));
    return Object.freeze({window,tally,total:tally.reduce((sum,item)=>sum+item.count,0)});
  }

  closeVoteWindow(sessionId:string,windowId:string,actorLearnerId:string,at:string,appliedOptionUci?:string):VoteWindow {
    this.#database.prepare("UPDATE session_vote_windows SET state='closed',applied_option_uci=? WHERE session_id=? AND id=?").run(appliedOptionUci??null,sessionId,windowId);
    this.#appendSessionJournal(sessionId,appliedOptionUci===undefined?"vote.closed":"vote.applied",actorLearnerId,this.#sessionRunSeq(sessionId),{windowId,...(appliedOptionUci===undefined?{}:{appliedOptionUci})},at);
    return this.voteWindow(sessionId,windowId)!;
  }
  transitionVoteWindow(sessionId:string,windowId:string,state:"closed"|"stale",at:string):VoteWindow{
    const result=this.#database.prepare("UPDATE session_vote_windows SET state=? WHERE session_id=? AND id=? AND state='open'").run(state,sessionId,windowId);
    if(result.changes===1)this.#appendSessionJournal(sessionId,"vote.closed",null,this.#sessionRunSeq(sessionId),{windowId,reason:state},at);
    const window=this.voteWindow(sessionId,windowId);if(window===undefined)throw new ServerError("INVALID_REQUEST","Unknown vote window");return window;
  }

  createInvitation(input:Omit<SessionInvitation,"id"|"state"|"createdAt">&{readonly at:string}):SessionInvitation {
    const id=randomUUID();
    this.#database.prepare(`INSERT INTO session_invitations(id,session_id,leg,invited_handle,invited_role,external_challenge_url,state,created_at)
      VALUES(?,?,?,?,?,?,'open',?)`).run(id,input.sessionId,input.leg,input.invitedHandle,input.invitedRole,input.externalChallengeUrl,input.at);
    return Object.freeze({id,sessionId:input.sessionId,leg:input.leg,invitedHandle:input.invitedHandle,invitedRole:input.invitedRole,externalChallengeUrl:input.externalChallengeUrl,state:"open",createdAt:input.at});
  }

  invitations(sessionId:string):readonly SessionInvitation[] {
    const rows=this.#database.prepare("SELECT * FROM session_invitations WHERE session_id=? ORDER BY created_at,id").all(sessionId) as readonly Record<string,unknown>[];
    return Object.freeze(rows.map((row)=>Object.freeze({id:String(row.id),sessionId:String(row.session_id),leg:row.leg===null?null:Number(row.leg) as 1|2,invitedHandle:row.invited_handle===null?null:String(row.invited_handle),invitedRole:String(row.invited_role) as RunRole,externalChallengeUrl:row.external_challenge_url===null?null:String(row.external_challenge_url),state:String(row.state) as SessionInvitation["state"],createdAt:String(row.created_at)})));
  }

  arenaLegs(sessionId:string):readonly ArenaLeg[] {
    const rows=this.#database.prepare("SELECT * FROM arena_legs WHERE session_id=? ORDER BY leg").all(sessionId) as readonly Record<string,unknown>[];
    return Object.freeze(rows.map((row)=>this.#arenaLegRow(row)));
  }

  saveArenaLeg(leg:ArenaLeg,actorLearnerId:string,runSeq:number,at:string):void {
    this.#database.prepare(`UPDATE arena_legs SET reference_player_handle=?,external_challenge_url=?,pgn=?,result=?,branch_id=?,imported_at=? WHERE session_id=? AND leg=?`)
      .run(leg.referencePlayerHandle,leg.externalChallengeUrl,leg.pgn,leg.result,leg.branchId,leg.importedAt,leg.sessionId,leg.leg);
    this.#appendSessionJournal(leg.sessionId,"leg.imported",actorLearnerId,runSeq,{leg:leg.leg,branchId:leg.branchId},at);
  }

  saveArenaImport(run:DrillRun,lease:LeaseHolder,leg:ArenaLeg,actorLearnerId:string,at:string):void {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const row=this.#database.prepare("SELECT summary_json FROM drill_runs WHERE id=?").get(run.id) as {summary_json?:unknown}|undefined;
      if(typeof row?.summary_json!=="string")throw new ServerError("RUN_NOT_FOUND",`Unknown run: ${run.id}`);
      const title=parseSummary(row.summary_json).title;
      const updatedAt=this.#now();
      const saved=this.#database.prepare(`UPDATE drill_runs SET snapshot_json=?,updated_at=?,summary_json=?,schema_version=?
        WHERE id=? AND active_writer_id=? AND active_writer_learner_id=?`).run(JSON.stringify(run),updatedAt,JSON.stringify(summaryFields(run,title,updatedAt)),run.schemaVersion,run.id,lease.writerId,lease.learnerId);
      if(saved.changes!==1)throw notActiveWriter(lease.writerId);
      const changed=this.#database.prepare(`UPDATE arena_legs SET reference_player_handle=?,external_challenge_url=?,pgn=?,result=?,branch_id=?,imported_at=?
        WHERE session_id=? AND leg=? AND branch_id IS NULL`).run(leg.referencePlayerHandle,leg.externalChallengeUrl,leg.pgn,leg.result,leg.branchId,leg.importedAt,leg.sessionId,leg.leg);
      if(changed.changes!==1)throw new ServerError("INVALID_REQUEST","Arena leg was already imported");
      this.#appendSessionJournal(leg.sessionId,"leg.imported",actorLearnerId,run.events.at(-1)?.seq??0,{leg:leg.leg,branchId:leg.branchId},at);
      this.#database.exec("COMMIT");
      this.#snapshots.set(run.id,Object.freeze({run,activeWriterId:lease.writerId,activeWriterLearnerId:lease.learnerId}));
    }catch(error){this.#rollback();if(error instanceof ServerError||error instanceof RuntimeError)throw error;throw storageFailure("Could not import arena leg",error);}
  }

  #liveSessionRow(row:Record<string,unknown>):LiveSession {
    const rotation=row.rotation_json===null?undefined:JSON.parse(String(row.rotation_json)) as string[];
    return Object.freeze({id:String(row.id),runId:String(row.run_id),kind:String(row.kind) as SessionKind,title:String(row.title),boardControl:String(row.board_control) as BoardControl,
      ...(row.scheduled_for===null?{}:{scheduledFor:String(row.scheduled_for)}),...(row.vote_adapter_learner_id===null?{}:{voteAdapterLearnerId:String(row.vote_adapter_learner_id)}),
      ...(rotation===undefined?{}:{rotation:Object.freeze(rotation)}),...(row.handoff_learner_id===null?{}:{handoffLearnerId:String(row.handoff_learner_id)}),
      rotationCursor:Number(row.rotation_cursor),createdBy:String(row.created_by),createdAt:String(row.created_at),...(row.closed_at===null?{}:{closedAt:String(row.closed_at)})});
  }
  #matchStateRow(row:Record<string,unknown>):MatchState{return Object.freeze({sessionId:String(row.session_id),whiteLearnerId:row.white_learner_id===null?null:String(row.white_learner_id),blackLearnerId:row.black_learner_id===null?null:String(row.black_learner_id),pausedAt:row.paused_at===null?null:String(row.paused_at),pauseProposedBy:row.pause_proposed_by===null?null:String(row.pause_proposed_by)});}
  #requiredLiveSessionRow(id:string):Record<string,unknown>{const row=this.#database.prepare("SELECT * FROM live_sessions WHERE id=?").get(id) as Record<string,unknown>|undefined;if(row===undefined)throw new ServerError("RUN_NOT_FOUND",`Unknown session: ${id}`);return row;}
  #proposalRow(row:Record<string,unknown>):SessionProposal{return Object.freeze({id:String(row.id),sessionId:String(row.session_id),nodeId:String(row.node_id),moveUci:String(row.move_uci),proposedBy:String(row.proposed_by),at:String(row.at),status:String(row.status) as SessionProposal["status"],resolvedRunSeq:row.resolved_run_seq===null?null:Number(row.resolved_run_seq)});}
  #voteWindowRow(row:Record<string,unknown>):VoteWindow{return Object.freeze({id:String(row.id),sessionId:String(row.session_id),nodeId:String(row.node_id),prompt:String(row.prompt),options:Object.freeze(JSON.parse(String(row.options_json)) as VoteOption[]),opensAt:String(row.opens_at),closesAt:String(row.closes_at),state:String(row.state) as VoteWindow["state"],appliedOptionUci:row.applied_option_uci===null?null:String(row.applied_option_uci)});}
  #arenaLegRow(row:Record<string,unknown>):ArenaLeg{return Object.freeze({sessionId:String(row.session_id),leg:Number(row.leg) as 1|2,referencePlayerHandle:row.reference_player_handle===null?null:String(row.reference_player_handle),externalChallengeUrl:row.external_challenge_url===null?null:String(row.external_challenge_url),pgn:row.pgn===null?null:String(row.pgn),result:row.result===null?null:String(row.result) as ArenaLeg["result"],branchId:row.branch_id===null?null:String(row.branch_id),importedAt:row.imported_at===null?null:String(row.imported_at)});}
  #snapshotSeq(snapshotJson:string):number{const parsed=JSON.parse(snapshotJson) as {events?:readonly {seq?:unknown}[]};const seq=parsed.events?.at(-1)?.seq;return typeof seq==="number"?seq:0;}
  #runSeq(runId:string):number{const row=this.#database.prepare("SELECT snapshot_json FROM drill_runs WHERE id=?").get(runId) as {snapshot_json?:unknown}|undefined;if(typeof row?.snapshot_json!=="string")throw new ServerError("RUN_NOT_FOUND",`Unknown run: ${runId}`);return this.#snapshotSeq(row.snapshot_json);}
  #sessionRunSeq(sessionId:string):number{return this.#runSeq(String(this.#requiredLiveSessionRow(sessionId).run_id));}
  #appendSessionJournal(sessionId:string,kind:SessionJournalEntry["kind"],actorLearnerId:string|null,runSeq:number|null,payload:Readonly<Record<string,unknown>>,at:string):void {
    const row=this.#database.prepare("SELECT COALESCE(max(seq),0)+1 AS seq FROM session_journal WHERE session_id=?").get(sessionId) as {seq:number};
    this.#database.prepare("INSERT INTO session_journal(session_id,seq,at,kind,actor_learner_id,run_seq,payload_json) VALUES(?,?,?,?,?,?,?)").run(sessionId,row.seq,at,kind,actorLearnerId,runSeq,JSON.stringify(payload));
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
      const removesWrite = role === undefined || !runRoleMayWrite(role);
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
        const session = this.#database.prepare("SELECT id FROM live_sessions WHERE run_id=?").get(runId) as {id?:unknown}|undefined;
        if (typeof session?.id === "string") {
          this.#appendSessionJournal(session.id,"board.granted",actor.learnerId,this.#runSeq(runId),{holderLearnerId:actor.learnerId},at);
        }
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
      {
        version: 7,
        name: "pack studio drafts and registered versions",
        apply: () => this.#addPackStudioTables(),
      },
      {
        version: 8,
        name: "branch origin and prediction event run schema",
        apply: () => this.#upgradeV07Runs(),
      },
      {
        version: 9,
        name: "live sessions, journal, proposals, votes, invitations, and arena legs",
        apply: () => this.#addLiveSessionTables(),
      },
      {
        version: 10,
        name: "shape studio drafts and registered versions",
        apply: () => this.#addShapeStudioTables(),
      },
      {
        version: 11,
        name: "branch groups run schema",
        apply: () => this.#upgradeV08Runs(),
      },
      {
        version: 12,
        name: "imported games and run schema",
        apply: () => this.#addImportedGames(),
      },
      {
        version: 13,
        name: "public story tokens and run derivations",
        apply: () => this.#addAdoptionTables(),
      },
      {
        version: 14,
        name: "native matches and session join tokens",
        apply: () => this.#addSocialMatchTables(),
      },
    ] as const;
    for (const migration of migrations) {
      if (migration.version <= version) continue;
      const rebuildsReferencedTables = migration.version === 14;
      try {
        if(rebuildsReferencedTables){
          this.#database.exec("PRAGMA foreign_keys = OFF");
          this.#database.exec("PRAGMA legacy_alter_table = ON");
        }
        this.#database.exec("BEGIN IMMEDIATE");
        migration.apply();
        if(rebuildsReferencedTables){
          const violations=this.#database.prepare("PRAGMA foreign_key_check").all();
          if(violations.length>0)throw new TypeError("Migration 14 produced foreign-key violations");
        }
        this.#database.exec(`PRAGMA user_version = ${migration.version}`);
        this.#database.exec("COMMIT");
        version = migration.version;
        this.#onMigration({ version: migration.version, name: migration.name });
      } catch (error) {
        this.#rollback();
        throw storageFailure("Could not migrate run storage", error);
      } finally {
        if(rebuildsReferencedTables){
          this.#database.exec("PRAGMA legacy_alter_table = OFF");
          this.#database.exec("PRAGMA foreign_keys = ON");
        }
      }
    }
  }

  #addAdoptionTables(): void {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS public_tokens (
        id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        scope TEXT NOT NULL CHECK (scope IN ('story_read')),
        run_id TEXT NOT NULL,
        branch_id TEXT NOT NULL,
        created_by TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        revoked_at TEXT
      ) STRICT;
      CREATE INDEX IF NOT EXISTS public_tokens_run ON public_tokens(run_id, created_by);
      CREATE TABLE IF NOT EXISTS run_derivations (
        derived_run_id TEXT PRIMARY KEY,
        source_run_id TEXT NOT NULL,
        source_branch_id TEXT NOT NULL,
        source_node_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('flip_sides')),
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS run_derivations_source ON run_derivations(source_run_id);
    `);
  }

  #addSocialMatchTables():void{
    if(this.#database.prepare("SELECT 1 AS found FROM sqlite_master WHERE type='table' AND name='match_states'").get()!==undefined)return;
    this.#database.exec(`
      ALTER TABLE live_sessions RENAME TO live_sessions_v13;
      CREATE TABLE live_sessions (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL UNIQUE REFERENCES drill_runs(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('stream','academy','match')),
        title TEXT NOT NULL,
        board_control TEXT NOT NULL CHECK (board_control IN ('free_claim','host_directed','rotation','match')),
        scheduled_for TEXT,
        vote_adapter_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
        rotation_json TEXT,
        handoff_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
        rotation_cursor INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL REFERENCES learners(id),
        created_at TEXT NOT NULL,
        closed_at TEXT
      ) STRICT;
      INSERT INTO live_sessions SELECT * FROM live_sessions_v13;
      DROP TABLE live_sessions_v13;

      ALTER TABLE session_journal RENAME TO session_journal_v13;
      CREATE TABLE session_journal (
        session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
        seq INTEGER NOT NULL,
        at TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('session.opened','member.joined','board.granted','proposal.made','proposal.applied','proposal.declined','vote.opened','vote.closed','vote.applied','leg.imported','session.closed','match.pause_proposed','match.paused','match.resumed','link.minted','link.revoked')),
        actor_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
        run_seq INTEGER,
        payload_json TEXT NOT NULL,
        PRIMARY KEY (session_id, seq)
      ) STRICT;
      INSERT INTO session_journal SELECT * FROM session_journal_v13;
      DROP TABLE session_journal_v13;

      ALTER TABLE public_tokens RENAME TO public_tokens_v13;
      DROP INDEX IF EXISTS public_tokens_run;
      CREATE TABLE public_tokens (
        id TEXT PRIMARY KEY,
        token_hash TEXT NOT NULL UNIQUE,
        scope TEXT NOT NULL CHECK (scope IN ('story_read','session_join')),
        run_id TEXT,
        branch_id TEXT,
        session_id TEXT REFERENCES live_sessions(id) ON DELETE CASCADE,
        match_slot TEXT CHECK (match_slot IN ('white','black')),
        invited_role TEXT CHECK (invited_role IN ('participant','spectator')),
        invited_handle TEXT,
        expires_at TEXT,
        uses_remaining INTEGER,
        created_by TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL,
        revoked_at TEXT,
        CHECK (
          (scope='story_read' AND run_id IS NOT NULL AND branch_id IS NOT NULL AND session_id IS NULL AND match_slot IS NULL AND invited_role IS NULL AND invited_handle IS NULL AND expires_at IS NULL AND uses_remaining IS NULL)
          OR
          (scope='session_join' AND run_id IS NULL AND branch_id IS NULL AND session_id IS NOT NULL AND invited_role IS NOT NULL AND expires_at IS NOT NULL AND uses_remaining>=0 AND (match_slot IS NULL OR invited_role='participant'))
        )
      ) STRICT;
      INSERT INTO public_tokens(id,token_hash,scope,run_id,branch_id,created_by,created_at,revoked_at)
        SELECT id,token_hash,scope,run_id,branch_id,created_by,created_at,revoked_at FROM public_tokens_v13;
      DROP TABLE public_tokens_v13;
      CREATE INDEX public_tokens_run ON public_tokens(run_id,created_by);
      CREATE INDEX public_tokens_session ON public_tokens(session_id,created_by);

      CREATE TABLE match_states (
        session_id TEXT PRIMARY KEY REFERENCES live_sessions(id) ON DELETE CASCADE,
        white_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
        black_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
        paused_at TEXT,
        pause_proposed_by TEXT REFERENCES learners(id) ON DELETE SET NULL
      ) STRICT;
    `);
  }

  #addLiveSessionTables(): void {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS live_sessions (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL UNIQUE REFERENCES drill_runs(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('stream','academy','match')),
        title TEXT NOT NULL,
        board_control TEXT NOT NULL CHECK (board_control IN ('free_claim','host_directed','rotation')),
        scheduled_for TEXT,
        vote_adapter_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
        rotation_json TEXT,
        handoff_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
        rotation_cursor INTEGER NOT NULL DEFAULT 0,
        created_by TEXT NOT NULL REFERENCES learners(id),
        created_at TEXT NOT NULL,
        closed_at TEXT
      ) STRICT;
      CREATE TABLE IF NOT EXISTS session_journal (
        session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
        seq INTEGER NOT NULL,
        at TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('session.opened','member.joined','board.granted','proposal.made','proposal.applied','proposal.declined','vote.opened','vote.closed','vote.applied','leg.imported','session.closed')),
        actor_learner_id TEXT REFERENCES learners(id) ON DELETE SET NULL,
        run_seq INTEGER,
        payload_json TEXT NOT NULL,
        PRIMARY KEY (session_id, seq)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS session_proposals (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
        node_id TEXT NOT NULL,
        move_uci TEXT NOT NULL,
        proposed_by TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        at TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('open','applied','declined','stale')),
        resolved_run_seq INTEGER
      ) STRICT;
      CREATE UNIQUE INDEX IF NOT EXISTS session_proposals_open ON session_proposals(session_id,node_id,proposed_by) WHERE status='open';
      CREATE TABLE IF NOT EXISTS session_vote_windows (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
        node_id TEXT NOT NULL,
        prompt TEXT NOT NULL,
        options_json TEXT NOT NULL,
        opens_at TEXT NOT NULL,
        closes_at TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('open','closed','stale')),
        applied_option_uci TEXT
      ) STRICT;
      CREATE UNIQUE INDEX IF NOT EXISTS session_vote_windows_open ON session_vote_windows(session_id) WHERE state='open';
      CREATE TABLE IF NOT EXISTS session_votes (
        session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
        window_id TEXT NOT NULL REFERENCES session_vote_windows(id) ON DELETE CASCADE,
        voter_key TEXT NOT NULL CHECK ((voter_key LIKE 'learner:%' OR voter_key LIKE 'chat:%') AND length(voter_key)<=200),
        choice_uci TEXT NOT NULL,
        cast_by_learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        at TEXT NOT NULL,
        PRIMARY KEY(session_id,window_id,voter_key)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS session_invitations (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
        leg INTEGER CHECK (leg IN (1,2)),
        invited_handle TEXT,
        invited_role TEXT NOT NULL CHECK (invited_role IN ('host','participant','spectator')),
        external_challenge_url TEXT,
        state TEXT NOT NULL CHECK (state IN ('open','accepted','revoked')),
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS arena_legs (
        session_id TEXT NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
        leg INTEGER NOT NULL CHECK (leg IN (1,2)),
        reference_player_handle TEXT,
        external_challenge_url TEXT,
        pgn TEXT,
        result TEXT CHECK (result IN ('1-0','0-1','1/2-1/2','*')),
        branch_id TEXT,
        imported_at TEXT,
        PRIMARY KEY(session_id,leg)
      ) STRICT;
    `);
  }

  #addShapeStudioTables(): void {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS shape_drafts (
        id TEXT PRIMARY KEY,
        shape_id TEXT NOT NULL,
        owner_learner_id TEXT NOT NULL REFERENCES learners(id),
        document_json TEXT NOT NULL,
        digest TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('draft','registered','withdrawn')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS shape_drafts_owner ON shape_drafts(owner_learner_id);
      CREATE TABLE IF NOT EXISTS registered_shapes (
        shape_id TEXT NOT NULL,
        version TEXT NOT NULL,
        digest TEXT NOT NULL UNIQUE,
        document_json TEXT NOT NULL,
        publisher_handle TEXT NOT NULL,
        publisher_learner_id TEXT NOT NULL,
        draft_id TEXT NOT NULL REFERENCES shape_drafts(id),
        registered_at TEXT NOT NULL,
        PRIMARY KEY (shape_id,version)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS registered_shapes_digest ON registered_shapes(digest);
    `);
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

  #addPackStudioTables(): void {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS pack_drafts (
        id TEXT PRIMARY KEY,
        pack_id TEXT NOT NULL,
        owner_learner_id TEXT NOT NULL REFERENCES learners(id),
        document_json TEXT NOT NULL,
        digest TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('draft','registered','withdrawn')),
        seed_kind TEXT NOT NULL CHECK (seed_kind IN ('blank','candidate','pgn','run','version','interchange')),
        seed_ref TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS pack_drafts_owner ON pack_drafts(owner_learner_id);
      CREATE INDEX IF NOT EXISTS pack_drafts_state ON pack_drafts(state);
      CREATE TABLE IF NOT EXISTS playtest_documents (
        digest TEXT PRIMARY KEY,
        draft_id TEXT NOT NULL REFERENCES pack_drafts(id),
        document_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS registered_packs (
        pack_id TEXT NOT NULL,
        version TEXT NOT NULL,
        digest TEXT NOT NULL UNIQUE,
        document_json TEXT NOT NULL,
        publisher_handle TEXT NOT NULL,
        publisher_learner_id TEXT NOT NULL,
        draft_id TEXT NOT NULL REFERENCES pack_drafts(id),
        registered_at TEXT NOT NULL,
        PRIMARY KEY (pack_id, version)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS registered_packs_digest ON registered_packs(digest);
    `);
  }

  #upgradeV07Runs(): void {
    const rows = this.#database
      .prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.7'")
      .all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare(
      "UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.8' WHERE id = ?",
    );
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.7" || !Array.isArray(snapshot.branches) || !Array.isArray(snapshot.events)) continue;
      const branches = snapshot.branches.map((branch) => ({ ...(branch as object), origin: "played" }));
      const events = snapshot.events.map((event) => {
        if (event === null || typeof event !== "object") return event;
        const value = event as { type?: unknown; data?: unknown };
        if (value.type !== "run.started" && value.type !== "branch.forked") return event;
        if (value.data === null || typeof value.data !== "object") return event;
        const data = value.data as Record<string, unknown>;
        return { ...value, data: { ...data, branch: { ...(data.branch as object), origin: "played" } } };
      });
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.8", branches, events }), row.id);
    }
  }

  #upgradeV08Runs(): void {
    const rows = this.#database
      .prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.8'")
      .all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare(
      "UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.9' WHERE id = ?",
    );
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.8") continue;
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.9" }), row.id);
    }
  }

  #addImportedGames(): void {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS imported_games (
        run_id TEXT PRIMARY KEY REFERENCES drill_runs(id) ON DELETE CASCADE,
        source_kind TEXT NOT NULL CHECK (source_kind IN ('pgn_paste','lichess_url')),
        source_url TEXT,
        movetext_digest TEXT NOT NULL,
        headers_json TEXT NOT NULL,
        result TEXT NOT NULL CHECK (result IN ('1-0','0-1','1/2-1/2','*')),
        pgn TEXT NOT NULL,
        licence_note TEXT NOT NULL,
        imported_at TEXT NOT NULL
      ) STRICT
    `);
    const rows = this.#database
      .prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.9'")
      .all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare(
      "UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.10' WHERE id = ?",
    );
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.9") continue;
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.10" }), row.id);
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
