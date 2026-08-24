import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import {
  RuntimeError,
  readBackReplay,
  type DrillRun,
  type DrillRunEvent,
  type ObjectiveState,
  type RunMark,
} from "@chess-tabiya/runtime";
import {
  glicko2Update,
  initialRating,
} from "@chess-tabiya/runtime/rating";
import { DRILL_RUN_SCHEMA_VERSION } from "@chess-tabiya/schema";

import { ServerError } from "./errors.js";
import {
  buildAccountBundle,
  planDeletion,
  storedRunExport,
  type AccountBundleV1,
  type JsonValue,
  type OwnedRunExport,
  type SharedRunReference,
  type AccountRecordTable,
  type TaggedAccountRecord,
  type DeletionPreviewV1,
} from "./account-data.js";
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
  readonly expiresAt?: string;
  readonly grantedVia?: string;
}

export type ClassroomMemberRole = "teacher" | "learner";
export type ClassroomMemberState = "invited" | "active" | "left";

export interface ClassroomRecord {
  readonly id: string;
  readonly ownerLearnerId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly archivedAt: string | null;
}

export interface ClassroomMemberRecord {
  readonly classroomId: string;
  readonly learnerId: string;
  readonly handle: string;
  readonly memberRole: ClassroomMemberRole;
  readonly state: ClassroomMemberState;
  readonly invitedBy: string | null;
  readonly invitedAt: string;
  readonly joinedAt: string | null;
  readonly leftAt: string | null;
}

export interface AssignmentRecord {
  readonly id: string;
  readonly classroomId: string;
  readonly packId: string;
  readonly assignedBy: string;
  readonly note: string | null;
  readonly dueAt: string | null;
  readonly createdAt: string;
  readonly withdrawnAt: string | null;
}

export interface AssignmentSubmissionRecord {
  readonly assignmentId: string;
  readonly learnerId: string;
  readonly runId: string;
  readonly grantedLearnerIds: readonly string[];
  readonly submittedAt: string;
  readonly accessExpiresAt: string;
  readonly withdrawnAt: string | null;
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

export interface StoredRunMark extends RunMark {
  readonly id: string;
  readonly runId: string;
  readonly authorLearnerId: string;
  readonly relayed: boolean;
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

export interface RepertoireRecord {
  readonly id: string;
  readonly ownerLearnerId: string;
  readonly name: string;
  readonly side: "white" | "black";
  readonly rootFen: string;
  readonly targetElo: number;
  readonly coverageDenominator: number;
  readonly sourceKind: "pgn_paste" | "lichess_study";
  readonly sourceUrl: string | null;
  readonly originalPgn: string;
  readonly licenceNote: string;
  readonly digest: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RepertoireMoveRecord {
  readonly repertoireId: string;
  readonly positionKey: string;
  readonly moveUci: string;
  readonly moveSan: string;
  readonly representativeFen: string;
  readonly rank: number;
  readonly origin: "imported" | "chosen_from_attempt";
  readonly createdAt: string;
}

export interface RepertoireScanRecord {
  readonly repertoireId: string;
  readonly scannedAt: string;
  readonly repertoireDigest: string;
  readonly population: unknown;
  readonly gaps: unknown;
  readonly alternateGaps: unknown;
  readonly unknown: unknown;
  readonly uncoveredMass: number;
  readonly truncated: boolean;
  readonly sourceFailures: number;
  readonly queriesUsed: number;
  readonly unreachedKeys: number;
}

export interface RepertoireGapRunRecord {
  readonly runId: string;
  readonly repertoireId: string;
  readonly gapKey: string;
  readonly createdAt: string;
}

export type RatedGameState = "open" | "sealed" | "voided";
export type RatedGameVoidReason =
  | "rewound"
  | "forked"
  | "assistance"
  | "engine_changed"
  | "calibration_retired"
  | "abandoned";
export type RatedGameResult = "win" | "loss" | "draw";
export type RatedGameTerminalReason =
  | "checkmate"
  | "stalemate"
  | "insufficient_material"
  | "fifty_move"
  | "threefold";

export interface RatedGameRecord {
  readonly runId: string;
  readonly learnerId: string;
  readonly calibrationId: string;
  readonly opponentBand: number;
  readonly opponentRating: number;
  readonly opponentRd: number;
  readonly learnerSide: "white" | "black";
  readonly startPieceCount: number;
  readonly engineIdentityDigest: string;
  readonly state: RatedGameState;
  readonly voidReason: RatedGameVoidReason | null;
  readonly result: RatedGameResult | null;
  readonly terminalReason: RatedGameTerminalReason | null;
  readonly plyCount: number | null;
  readonly periodNo: number | null;
  readonly startedAt: string;
  readonly sealedAt: string | null;
}

export interface OpenRatedGameRecord
  extends Omit<RatedGameRecord, "state" | "voidReason" | "result" | "terminalReason" | "plyCount" | "periodNo" | "sealedAt"> {
  readonly state: "open";
}

export interface LearnerRatingRecord {
  readonly learnerId: string;
  readonly calibrationId: string;
  readonly rating: number;
  readonly rd: number;
  readonly volatility: number;
  readonly seedBand: number | null;
  readonly ratedGames: number;
  readonly voidedGames: number;
  readonly abandonedGames: number;
  readonly periodNo: number;
  readonly periodStartedAt: string;
  readonly updatedAt: string;
}

export interface RatingPeriodRecord {
  readonly learnerId: string;
  readonly periodNo: number;
  readonly calibrationId: string;
  readonly openedAt: string;
  readonly closedAt: string | null;
  readonly games: number;
  readonly ratingBefore: number;
  readonly rdBefore: number;
  readonly volatilityBefore: number;
  readonly ratingAfter: number | null;
  readonly rdAfter: number | null;
  readonly volatilityAfter: number | null;
}

export interface LearnerMarkRecord {
  readonly learnerId: string;
  readonly mark: "bronze" | "silver" | "gold";
  readonly calibrationId: string;
  readonly runId: string;
  readonly earnedAt: string;
}

export interface CohortStandingRecord {
  readonly classroomId: string;
  readonly openedByLearnerId: string;
  readonly windowFrom: string;
  readonly windowTo: string | null;
  readonly openedAt: string;
  readonly closedAt: string | null;
}

export interface StandingMemberRecord {
  readonly classroomId: string;
  readonly learnerId: string;
  readonly showRecord: boolean;
  readonly showRating: boolean;
  readonly publishedAt: string;
}

export interface RatingStorage {
  createRatedRun(run: DrillRun, lease: LeaseHolder, title: string, game: OpenRatedGameRecord): void;
  ratedGame(runId: string): RatedGameRecord | undefined;
  ratedGames(learnerId: string): readonly RatedGameRecord[];
  learnerRating(learnerId: string): LearnerRatingRecord | undefined;
  ratingPeriods(learnerId: string): readonly RatingPeriodRecord[];
  learnerMarks(learnerId: string): readonly LearnerMarkRecord[];
  createCohortStanding(record: CohortStandingRecord): CohortStandingRecord;
  cohortStanding(classroomId: string): CohortStandingRecord | undefined;
  updateCohortStandingWindow(classroomId: string, windowFrom: string, windowTo: string | null): CohortStandingRecord;
  closeCohortStanding(classroomId: string, at: string): CohortStandingRecord;
  publishStandingMember(record: StandingMemberRecord): StandingMemberRecord;
  standingMembers(classroomId: string): readonly StandingMemberRecord[];
  setStandingMemberVisibility(classroomId: string, learnerId: string, field: "record" | "rating", visible: boolean): StandingMemberRecord;
  withdrawStandingMember(classroomId: string, learnerId: string): void;
  sealRatedGame(input: {
    readonly runId: string;
    readonly result: RatedGameResult;
    readonly terminalReason: RatedGameTerminalReason;
    readonly plyCount: number;
    readonly sealedAt: string;
  }): RatedGameRecord;
  voidRatedGame(runId: string, reason: RatedGameVoidReason, at: string): RatedGameRecord;
  expireRatedGames(at: string): readonly RatedGameRecord[];
}

/** Persistence boundary for run snapshots, identity, grants, and the writer lease. */
export interface RunStorage {
  /** Schema-only account-data guard; exposes names, never rows or the database handle. */
  applicationTableNames(): readonly string[];
  applicationIdentityFields(): readonly string[];
  accountBundle(learnerId: string): AccountBundleV1;
  deletionPreview(learnerId: string, scope: DeletionPreviewV1["scope"], at: string): DeletionPreviewV1;
  deleteOwnedRun(learnerId: string, runId: string, at: string, expectedPreviewDigest: string): void;
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
  createRepertoire?(record: RepertoireRecord, moves: readonly RepertoireMoveRecord[]): void;
  replaceRepertoire?(record: RepertoireRecord, importedMoves: readonly RepertoireMoveRecord[], expectedDigest: string): void;
  repertoires?(ownerLearnerId: string): readonly RepertoireRecord[];
  repertoire?(id: string): RepertoireRecord | undefined;
  repertoireMoves?(id: string): readonly RepertoireMoveRecord[];
  saveRepertoireScan?(scan: RepertoireScanRecord): void;
  repertoireScan?(id: string): RepertoireScanRecord | undefined;
  addRepertoireAnswer?(record: RepertoireMoveRecord, expectedDigest: string, nextDigest: string, updatedAt: string): void;
  deleteRepertoire?(id: string, ownerLearnerId: string): void;
  createRepertoireGapRun?(run: DrillRun, lease: LeaseHolder, title: string, link: RepertoireGapRunRecord): void;
  repertoireGapRun?(repertoireId: string, gapKey: string): RepertoireGapRunRecord | undefined;
  repertoireGapAttemptCount?(runId: string): number;
  repertoireGapFirstMoves?(runId: string): readonly { readonly moveUci: string; readonly moveSan: string }[];
  liveSessionByRun?(runId: string): LiveSession | undefined;
  matchState?(sessionId: string): MatchState | undefined;

  createLearner(input: NewLearner): Learner;
  learnerByHandle(handle: string): StoredLearner | undefined;
  learnerById(learnerId: string): Learner | undefined;
  recordLoginFailure(learnerId: string, at: string): void;
  clearLoginFailures(learnerId: string): void;
  deleteLearner(learnerId: string, at: string, expectedPreviewDigest?: string): void;

  createSession(learnerId: string, tokenHash: string, expiresAt: string): void;
  learnerBySessionToken(tokenHash: string, now: string): Learner | undefined;
  deleteSession(tokenHash: string): void;

  grants(runId: string): readonly RunGrant[];
  runRole(runId: string, learnerId: string): RunRole | undefined;
  runMarks(runId: string, learnerId: string): readonly StoredRunMark[];
  relayedRunMarks(runId: string, positionKey: string, branchKey: string): readonly StoredRunMark[];
  replaceRunMarks(input: {
    readonly runId: string;
    readonly learnerId: string;
    readonly scope: RunMark["scope"];
    readonly scopeKey: string;
    readonly shapes: readonly Pick<RunMark, "brush" | "orig" | "dest">[];
    readonly relayed: boolean;
    readonly at: string;
  }): readonly StoredRunMark[];
  rescopeRunMarks(input: { readonly runId:string;readonly learnerId:string;readonly fromScope:RunMark["scope"];readonly fromKey:string;readonly toScope:RunMark["scope"];readonly toKey:string }): readonly StoredRunMark[];
  ownerLearnerId?(runId: string): string | undefined;
  grantMintedBySubmission(runId: string, learnerId: string): boolean;
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
    readonly classroomId?: string;
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

export interface ClassroomStorage {
  createClassroom(record: ClassroomRecord): void;
  classroomsFor(learnerId: string): readonly ClassroomRecord[];
  classroom(id: string): ClassroomRecord | undefined;
  classroomMembers(classroomId: string): readonly ClassroomMemberRecord[];
  classroomMember(classroomId: string, learnerId: string): ClassroomMemberRecord | undefined;
  inviteClassroomMember(input: Omit<ClassroomMemberRecord, "handle" | "joinedAt" | "leftAt">): void;
  setClassroomMemberState(classroomId: string, learnerId: string, state: ClassroomMemberState, at: string): void;
  archiveClassroom(classroomId: string, at: string): void;
  createAssignment(record: AssignmentRecord): void;
  assignment(id: string): AssignmentRecord | undefined;
  assignmentsForLearner(learnerId: string): readonly AssignmentRecord[];
  assignmentsForClassroom(classroomId: string): readonly AssignmentRecord[];
  withdrawAssignment(id: string, at: string): void;
  assignmentSubmissions(assignmentId: string): readonly AssignmentSubmissionRecord[];
  assignmentSubmissionsForLearner(learnerId: string): readonly AssignmentSubmissionRecord[];
  classroomLiveSessions(classroomId: string): readonly LiveSession[];
  submitAssignment(record: AssignmentSubmissionRecord, teacherLearnerIds: readonly string[]): AssignmentSubmissionRecord;
  withdrawAssignmentSubmission(assignmentId: string, learnerId: string, runId: string, at: string): void;
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
  /** Test-only transaction fault hook used to prove destructive-path rollback. */
  readonly failDeletionAfterEffectGroup?: (group: DeletionEffectGroup) => void;
}

export type DeletionEffectGroup =
  | "run_references"
  | "run_transition"
  | "position_stats"
  | "owned_runs"
  | "published_artifacts"
  | "repertoires"
  | "classrooms"
  | "retained_identity_scrub"
  | "learner_state";

export const STORAGE_VERSION = 25;
const LEGACY_ID = "__legacy";
const LEGACY_HASH = "!";

export function assertContiguousMigrationVersions(
  versions: readonly number[],
  storageVersion = STORAGE_VERSION,
): void {
  const expected = Array.from({ length: storageVersion }, (_value, index) => index + 1);
  if (
    versions.length !== expected.length ||
    versions.some((version, index) => version !== expected[index])
  ) {
    throw new TypeError(
      `Storage migrations must be exactly 1..${storageVersion}; received ${versions.join(",")}`,
    );
  }
}

function isRunRole(value: unknown): value is RunRole {
  return RUN_ROLES.includes(value as RunRole);
}

function storedRunMark(row: Readonly<Record<string, unknown>>): StoredRunMark {
  if (
    typeof row.id !== "string" ||
    typeof row.run_id !== "string" ||
    typeof row.author_learner_id !== "string" ||
    (row.scope !== "position" && row.scope !== "branch") ||
    typeof row.scope_key !== "string" ||
    (row.brush !== "green" && row.brush !== "red" && row.brush !== "blue" && row.brush !== "yellow") ||
    typeof row.orig !== "string" ||
    (row.dest !== null && typeof row.dest !== "string") ||
    (row.relayed !== 0 && row.relayed !== 1) ||
    typeof row.created_at !== "string"
  ) throw new TypeError("Stored run mark is invalid");
  return Object.freeze({
    id: row.id,
    runId: row.run_id,
    authorLearnerId: row.author_learner_id,
    scope: row.scope,
    scopeKey: row.scope_key,
    brush: row.brush,
    orig: row.orig,
    ...(row.dest === null ? {} : { dest: row.dest }),
    relayed: row.relayed === 1,
    at: row.created_at,
  });
}

function classroomRecord(row: Readonly<Record<string, unknown>>): ClassroomRecord {
  return Object.freeze({
    id: String(row.id),
    ownerLearnerId: String(row.owner_learner_id),
    name: String(row.name),
    createdAt: String(row.created_at),
    archivedAt: row.archived_at === null ? null : String(row.archived_at),
  });
}

function classroomMemberRecord(row: Readonly<Record<string, unknown>>): ClassroomMemberRecord {
  return Object.freeze({
    classroomId: String(row.classroom_id),
    learnerId: String(row.learner_id),
    handle: String(row.handle),
    memberRole: String(row.member_role) as ClassroomMemberRole,
    state: String(row.state) as ClassroomMemberState,
    invitedBy: row.invited_by === null ? null : String(row.invited_by),
    invitedAt: String(row.invited_at),
    joinedAt: row.joined_at === null ? null : String(row.joined_at),
    leftAt: row.left_at === null ? null : String(row.left_at),
  });
}

function assignmentRecord(row: Readonly<Record<string, unknown>>): AssignmentRecord {
  return Object.freeze({
    id: String(row.id),
    classroomId: String(row.classroom_id),
    packId: String(row.pack_id),
    assignedBy: String(row.assigned_by),
    note: row.note === null ? null : String(row.note),
    dueAt: row.due_at === null ? null : String(row.due_at),
    createdAt: String(row.created_at),
    withdrawnAt: row.withdrawn_at === null ? null : String(row.withdrawn_at),
  });
}

function assignmentSubmissionRecord(row: Readonly<Record<string, unknown>>): AssignmentSubmissionRecord {
  const granted = JSON.parse(String(row.granted_learner_ids)) as unknown;
  if (!Array.isArray(granted) || granted.some((value) => typeof value !== "string")) {
    throw new TypeError("Stored assignment submission grant list is invalid");
  }
  return Object.freeze({
    assignmentId: String(row.assignment_id),
    learnerId: String(row.learner_id),
    runId: String(row.run_id),
    grantedLearnerIds: Object.freeze(granted),
    submittedAt: String(row.submitted_at),
    accessExpiresAt: String(row.access_expires_at),
    withdrawnAt: row.withdrawn_at === null ? null : String(row.withdrawn_at),
  });
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

export class SQLiteRunStorage implements RunStorage, ProgressStorage, LiveSessionStorage, ClassroomStorage, RatingStorage {
  readonly #database: DatabaseSync;
  readonly #snapshots = new Map<string, StoredRun>();
  readonly #now: () => string;
  readonly #onMigration: (entry: StorageMigrationLog) => void;
  readonly #failDeletionAfterEffectGroup: ((group: DeletionEffectGroup) => void) | undefined;

  constructor(filename = ":memory:", options: SQLiteRunStorageOptions = {}) {
    this.#database = new DatabaseSync(filename);
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#failDeletionAfterEffectGroup = options.failDeletionAfterEffectGroup;
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

  applicationTableNames(): readonly string[] {
    const rows = this.#database
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all() as unknown as readonly { readonly name: string }[];
    return Object.freeze(rows.map((row) => row.name));
  }

  applicationIdentityFields(): readonly string[] {
    const fields: string[] = [];
    for (const table of this.applicationTableNames()) {
      const columns = this.#database.prepare(`PRAGMA table_info(${table})`).all() as unknown as readonly { readonly name: string }[];
      for (const { name } of columns) {
        if (name === "learner_id" || name.endsWith("_learner_id") || ["created_by", "proposed_by", "assigned_by", "invited_by"].includes(name)) fields.push(`${table}.${name}`);
      }
    }
    fields.push(
      "learners.id", "learners.handle", "learners.display_name", "drill_runs.active_writer_id",
      "registered_packs.publisher_handle", "registered_shapes.publisher_handle",
      "live_sessions.rotation_json[]", "session_journal.payload.changedByLearnerId",
      "session_journal.payload.holderLearnerId", "session_votes.voter_key",
      "session_invitations.invited_handle", "arena_legs.reference_player_handle",
      "public_tokens.invited_handle", "assignment_submissions.granted_learner_ids[]",
      "match_states.pause_proposed_by",
    );
    return Object.freeze(fields.sort());
  }

  foreignKeyViolationCount(): number {
    return this.#database.prepare("PRAGMA foreign_key_check").all().length;
  }

  accountBundle(learnerId: string): AccountBundleV1 {
    const jsonValue = (value: unknown): JsonValue => {
      if (value === null || typeof value === "string" || typeof value === "boolean") return value;
      if (typeof value === "number") return value;
      if (typeof value === "bigint") return Number(value);
      if (Buffer.isBuffer(value)) return value.toString("utf8");
      if (Array.isArray(value)) return Object.freeze(value.map(jsonValue));
      if (typeof value === "object") {
        const result: Record<string, JsonValue> = {};
        for (const [key, child] of Object.entries(value)) result[key] = jsonValue(child);
        return Object.freeze(result);
      }
      throw new TypeError(`Cannot export stored ${typeof value} value`);
    };
    const accountIdentityColumns = new Set([
      "learner_id", "owner_learner_id", "author_learner_id", "publisher_learner_id",
      "opened_by_learner_id", "created_by", "proposed_by", "assigned_by", "invited_by",
      "cast_by_learner_id", "vote_adapter_learner_id", "handoff_learner_id",
      "white_learner_id", "black_learner_id", "pause_proposed_by",
    ]);
    const jsonColumns: Readonly<Record<string, string>> = Object.freeze({
      document_json: "document",
      headers_json: "headers",
      checkpoint_ids: "checkpointIds",
      population_json: "population",
      gaps_json: "gaps",
      alternate_gaps_json: "alternateGaps",
      unknown_json: "unknown",
      options_json: "options",
    });
    const booleanColumns = new Set(["relayed", "countable", "graded", "truncated", "show_record", "show_rating"]);
    const withoutAccountIdentity = (row: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> =>
      Object.freeze(Object.fromEntries(Object.entries(row).filter(([key]) => !accountIdentityColumns.has(key))));
    const portableRecord = (row: Readonly<Record<string, unknown>>, retainIdentity: boolean): Readonly<Record<string, unknown>> => {
      const source = retainIdentity ? row : withoutAccountIdentity(row);
      const projected: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(source)) {
        const jsonName = jsonColumns[key];
        if (jsonName !== undefined) {
          projected[jsonName] = JSON.parse(String(value));
        } else {
          projected[key] = booleanColumns.has(key) ? Number(value) === 1 : value;
        }
      }
      return Object.freeze(projected);
    };
    const tagged = <Table extends AccountRecordTable>(table: Table, sourceRows: readonly Record<string, unknown>[], retainIdentity = false): readonly TaggedAccountRecord<Table>[] =>
      sourceRows.map((row) => Object.freeze({ table, record: jsonValue(portableRecord(row, retainIdentity)) }) as TaggedAccountRecord<Table>);
    const rows = (sql: string, ...parameters: readonly (string | number)[]): readonly Record<string, unknown>[] =>
      this.#database.prepare(sql).all(...parameters) as readonly Record<string, unknown>[];
    try {
      this.#database.exec("BEGIN");
      const account = this.#database.prepare("SELECT handle,display_name,created_at FROM learners WHERE id=?").get(learnerId) as Record<string, unknown> | undefined;
      if (account === undefined) throw new ServerError("UNAUTHENTICATED", "Authentication required");
      const handleFor = (id: unknown): string | null => {
        if (id === null || typeof id !== "string") return null;
        const found = this.#database.prepare("SELECT handle FROM learners WHERE id=?").get(id) as { readonly handle?: unknown } | undefined;
        return typeof found?.handle === "string" ? found.handle : null;
      };
      const handlesFor = (idsJson: unknown): readonly string[] => {
        const parsed = JSON.parse(String(idsJson)) as unknown;
        if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== "string")) throw new TypeError("Stored learner-id array is invalid");
        return Object.freeze(parsed.map(handleFor).filter((handle): handle is string => handle !== null).sort());
      };
      const ownedRows = rows("SELECT id,snapshot_json,summary_json,schema_version FROM drill_runs WHERE owner_learner_id=? ORDER BY id", learnerId);
      const ownedRuns: OwnedRunExport[] = ownedRows.map((row) => {
        const id = String(row.id);
        const stored = storedRunExport(String(row.snapshot_json), DRILL_RUN_SCHEMA_VERSION);
        let title = id;
        try {
          const summary = JSON.parse(String(row.summary_json)) as { readonly title?: unknown };
          if (typeof summary.title === "string") title = summary.title;
        } catch { /* the lossless snapshot arm below is the authoritative diagnostic */ }
        const grants = rows(
          `SELECT l.handle AS granteeHandle,g.role,g.granted_at AS grantedAt,g.expires_at AS expiresAt,g.granted_via AS grantedVia
           FROM run_grants g JOIN learners l ON l.id=g.learner_id WHERE g.run_id=? ORDER BY l.handle,g.role`, id,
        ).map((grant) => Object.freeze({
          granteeHandle: String(grant.granteeHandle), role: String(grant.role) as "host" | "participant" | "spectator",
          grantedAt: String(grant.grantedAt), expiresAt: grant.expiresAt === null ? null : String(grant.expiresAt),
          grantedVia: grant.grantedVia === null ? null : String(grant.grantedVia),
        }));
        const imported = this.#database.prepare(
          "SELECT source_kind,source_url,movetext_digest,headers_json,result,pgn,licence_note,imported_at FROM imported_games WHERE run_id=?",
        ).get(id) as Record<string, unknown> | undefined;
        const derivations = rows(
          `SELECT derived_run_id AS derivedRunId,source_run_id AS sourceRunId,source_branch_id AS sourceBranchId,
             source_node_id AS sourceNodeId,kind,created_at AS createdAt
           FROM run_derivations WHERE source_run_id=? OR derived_run_id=? ORDER BY derived_run_id,source_run_id`, id, id,
        ).map((item) => Object.freeze({
          derivedRunId: String(item.derivedRunId), sourceRunId: String(item.sourceRunId),
          sourceBranchId: String(item.sourceBranchId), sourceNodeId: String(item.sourceNodeId),
          kind: String(item.kind) as "flip_sides", createdAt: String(item.createdAt),
        }));
        let importedGame: OwnedRunExport["importedGame"] = null;
        if (imported !== undefined) {
          const parsedHeaders = JSON.parse(String(imported.headers_json)) as unknown;
          if (parsedHeaders === null || typeof parsedHeaders !== "object" || Array.isArray(parsedHeaders) || Object.values(parsedHeaders).some((header) => typeof header !== "string")) {
            throw new TypeError("Stored imported-game headers are invalid");
          }
          importedGame = Object.freeze({
            sourceKind: String(imported.source_kind), sourceUrl: imported.source_url === null ? null : String(imported.source_url),
            movetextDigest: String(imported.movetext_digest), headers: Object.freeze({ ...(parsedHeaders as Record<string, string>) }),
            result: String(imported.result), pgn: String(imported.pgn), licenceNote: String(imported.licence_note), importedAt: String(imported.imported_at),
          });
        }
        return Object.freeze({ id, title, schemaVersion: String(row.schema_version ?? stored.schemaVersion), replayable: stored.replayable, snapshot: stored.snapshot, importedGame, grants: Object.freeze(grants), derivations: Object.freeze(derivations) });
      });
      const sharedAccess: SharedRunReference[] = rows(
        `SELECT d.id,d.summary_json,g.role,g.granted_at
         FROM run_grants g JOIN drill_runs d ON d.id=g.run_id
         WHERE g.learner_id=? AND d.owner_learner_id<>? ORDER BY d.id`, learnerId, learnerId,
      ).map((row) => {
        let title = String(row.id);
        try { const summary = JSON.parse(String(row.summary_json)) as { readonly title?: unknown }; if (typeof summary.title === "string") title = summary.title; } catch { /* retain id title */ }
        const contributions = tagged("run_marks", rows("SELECT id,scope,scope_key,brush,orig,dest,relayed,created_at FROM run_marks WHERE run_id=? AND author_learner_id=? ORDER BY id", String(row.id), learnerId));
        return Object.freeze({ runId: String(row.id), title, role: String(row.role) as SharedRunReference["role"], grantedAt: String(row.granted_at), contributions });
      });
      const progress = [
        ...tagged("attempts", rows("SELECT * FROM attempts WHERE learner_id=? ORDER BY run_id,branch_id", learnerId)),
        ...tagged("attempt_concepts", rows("SELECT c.* FROM attempt_concepts c JOIN attempts a ON a.run_id=c.run_id AND a.branch_id=c.branch_id WHERE a.learner_id=? ORDER BY c.run_id,c.branch_id,c.concept_key", learnerId)),
        ...tagged("schedules", rows("SELECT * FROM schedules WHERE learner_id=? ORDER BY id", learnerId)),
        ...tagged("learner_position_stats", rows("SELECT * FROM learner_position_stats WHERE learner_id=? ORDER BY transpose_key", learnerId)),
      ];
      const marks = tagged("run_marks", rows("SELECT id,run_id,scope,scope_key,brush,orig,dest,relayed,created_at FROM run_marks WHERE author_learner_id=? ORDER BY id", learnerId));
      const repertoireRows = rows("SELECT * FROM repertoires WHERE owner_learner_id=? ORDER BY id", learnerId);
      const repertoireIds = repertoireRows.map((row) => String(row.id));
      const repertoireChildren = <Table extends "repertoire_moves" | "repertoire_scans" | "repertoire_gap_runs">(table: Table): readonly TaggedAccountRecord<Table>[] => repertoireIds.flatMap((id) => tagged(table, rows(`SELECT * FROM ${table} WHERE repertoire_id=? ORDER BY rowid`, id)));
      const repertoires = [
        ...tagged("repertoires", repertoireRows),
        ...repertoireChildren("repertoire_moves"),
        ...repertoireChildren("repertoire_scans"),
        ...repertoireChildren("repertoire_gap_runs"),
      ];
      const packDraftRows = rows("SELECT * FROM pack_drafts WHERE owner_learner_id=? ORDER BY id", learnerId);
      const drafts = [
        ...tagged("pack_drafts", packDraftRows),
        ...packDraftRows.flatMap((draft) => tagged("playtest_documents", rows("SELECT * FROM playtest_documents WHERE draft_id=? ORDER BY digest", String(draft.id)))),
        ...tagged("shape_drafts", rows("SELECT * FROM shape_drafts WHERE owner_learner_id=? ORDER BY id", learnerId)),
      ];
      const publications = [
        ...tagged("registered_packs", rows("SELECT * FROM registered_packs WHERE publisher_learner_id=? ORDER BY pack_id,version", learnerId)),
        ...tagged("registered_shapes", rows("SELECT * FROM registered_shapes WHERE publisher_learner_id=? ORDER BY shape_id,version", learnerId)),
      ];
      const ownedRunIds = new Set(ownedRuns.map((run) => run.id));
      const liveRows = rows("SELECT * FROM live_sessions ORDER BY id").filter((row) => ownedRunIds.has(String(row.run_id)));
      const liveSessionIds = liveRows.map((row) => String(row.id));
      const exportedLiveRows = liveRows.map((row) => Object.freeze({
        id: row.id,
        run_id: row.run_id,
        kind: row.kind,
        title: row.title,
        board_control: row.board_control,
        scheduled_for: row.scheduled_for,
        vote_adapter_handle: handleFor(row.vote_adapter_learner_id),
        rotation_handles: row.rotation_json === null ? null : handlesFor(row.rotation_json),
        handoff_handle: handleFor(row.handoff_learner_id),
        rotation_cursor: row.rotation_cursor,
        creator_handle: handleFor(row.created_by),
        created_at: row.created_at,
        closed_at: row.closed_at,
        classroom_id: row.classroom_id,
      }));
      const journalRows = liveSessionIds.flatMap((sessionId) => rows(
        "SELECT session_id,seq,at,kind,actor_learner_id,run_seq,payload_json FROM session_journal WHERE session_id=? ORDER BY seq",
        sessionId,
      )).map((row) => {
        const payload = JSON.parse(String(row.payload_json)) as Record<string, unknown>;
        const holderHandle = handleFor(payload.holderLearnerId);
        const changedByHandle = handleFor(payload.changedByLearnerId);
        delete payload.holderLearnerId;
        delete payload.changedByLearnerId;
        return Object.freeze({
          session_id: row.session_id,
          seq: row.seq,
          at: row.at,
          kind: row.kind,
          actor_handle: handleFor(row.actor_learner_id),
          run_seq: row.run_seq,
          payload: Object.freeze({ ...payload, ...(holderHandle === null ? {} : { holderHandle }), ...(changedByHandle === null ? {} : { changedByHandle }) }),
        });
      });
      const proposalRows = [
        ...liveSessionIds.flatMap((sessionId) => rows(
          `SELECT p.id,p.session_id,p.node_id,p.move_uci,l.handle AS proposed_by_handle,p.at,p.status,p.resolved_run_seq
           FROM session_proposals p JOIN learners l ON l.id=p.proposed_by WHERE p.session_id=? ORDER BY p.id`, sessionId,
        )),
        ...rows(
          `SELECT p.id,p.session_id,p.node_id,p.move_uci,l.handle AS proposed_by_handle,p.at,p.status,p.resolved_run_seq
           FROM session_proposals p JOIN learners l ON l.id=p.proposed_by
           WHERE p.proposed_by=? AND p.session_id NOT IN (SELECT id FROM live_sessions WHERE run_id IN (SELECT id FROM drill_runs WHERE owner_learner_id=?)) ORDER BY p.id`, learnerId, learnerId,
        ),
      ];
      const voteWindowRows = liveSessionIds.flatMap((sessionId) => rows(
        "SELECT id,session_id,node_id,prompt,options_json,opens_at,closes_at,state,applied_option_uci FROM session_vote_windows WHERE session_id=? ORDER BY id", sessionId,
      ));
      const voteRows = [
        ...liveSessionIds.flatMap((sessionId) => rows(
          `SELECT v.session_id,v.window_id,l.handle AS cast_by_handle,v.choice_uci,v.at
           FROM session_votes v JOIN learners l ON l.id=v.cast_by_learner_id WHERE v.session_id=? ORDER BY v.window_id,l.handle`, sessionId,
        )),
        ...rows(
          `SELECT v.session_id,v.window_id,l.handle AS cast_by_handle,v.choice_uci,v.at
           FROM session_votes v JOIN learners l ON l.id=v.cast_by_learner_id
           WHERE v.cast_by_learner_id=? AND v.session_id NOT IN (SELECT id FROM live_sessions WHERE run_id IN (SELECT id FROM drill_runs WHERE owner_learner_id=?)) ORDER BY v.session_id,v.window_id`, learnerId, learnerId,
        ),
      ];
      const invitationRows = liveSessionIds.flatMap((sessionId) => rows(
        "SELECT id,session_id,leg,invited_handle,invited_role,external_challenge_url,state,created_at FROM session_invitations WHERE session_id=? ORDER BY id", sessionId,
      ));
      const arenaRows = liveSessionIds.flatMap((sessionId) => rows(
        "SELECT session_id,leg,reference_player_handle,external_challenge_url,pgn,result,branch_id,imported_at FROM arena_legs WHERE session_id=? ORDER BY leg", sessionId,
      ));
      const matchRows = liveSessionIds.flatMap((sessionId) => rows(
        "SELECT session_id,white_learner_id,black_learner_id,paused_at,pause_proposed_by FROM match_states WHERE session_id=?", sessionId,
      )).map((row) => Object.freeze({
        session_id: row.session_id,
        white_handle: handleFor(row.white_learner_id),
        black_handle: handleFor(row.black_learner_id),
        paused_at: row.paused_at,
        pause_proposed_by_handle: handleFor(row.pause_proposed_by),
      }));
      const classroomRows = rows(
        `SELECT DISTINCT c.id,c.name,c.created_at,c.archived_at,
          CASE WHEN c.owner_learner_id=? THEN 'owner' ELSE 'member' END AS relationship
         FROM classrooms c LEFT JOIN classroom_members m ON m.classroom_id=c.id
         WHERE c.owner_learner_id=? OR m.learner_id=? ORDER BY c.id`, learnerId, learnerId, learnerId,
      );
      const classroomIds = classroomRows.map((row) => String(row.id));
      const memberRows = classroomIds.flatMap((classroomId) => rows(
        `SELECT m.classroom_id,l.handle,m.member_role,m.state,inviter.handle AS invited_by_handle,m.invited_at,m.joined_at,m.left_at
         FROM classroom_members m LEFT JOIN learners l ON l.id=m.learner_id LEFT JOIN learners inviter ON inviter.id=m.invited_by
         WHERE m.classroom_id=? ORDER BY COALESCE(l.handle,m.learner_id)`, classroomId,
      ));
      const assignmentRows = classroomIds.flatMap((classroomId) => rows(
        `SELECT a.id,a.classroom_id,a.pack_id,l.handle AS assigned_by_handle,a.note,a.due_at,a.created_at,a.withdrawn_at
         FROM assignments a LEFT JOIN learners l ON l.id=a.assigned_by WHERE a.classroom_id=? ORDER BY a.id`, classroomId,
      ));
      const submissionRows = classroomIds.flatMap((classroomId) => rows(
        `SELECT s.assignment_id,s.learner_id,s.run_id,s.granted_learner_ids,s.submitted_at,s.access_expires_at,s.withdrawn_at
         FROM assignment_submissions s JOIN assignments a ON a.id=s.assignment_id WHERE a.classroom_id=? ORDER BY s.assignment_id,s.run_id`, classroomId,
      )).map((row) => Object.freeze({
        assignment_id: row.assignment_id,
        learner_handle: handleFor(row.learner_id) ?? "deleted learner",
        run_id: row.run_id,
        granted_handles: handlesFor(row.granted_learner_ids),
        submitted_at: row.submitted_at,
        access_expires_at: row.access_expires_at,
        withdrawn_at: row.withdrawn_at,
      }));
      const liveAndSocial = [
        ...tagged("live_sessions", exportedLiveRows),
        ...tagged("session_journal", journalRows),
        ...tagged("session_proposals", proposalRows),
        ...tagged("session_vote_windows", voteWindowRows),
        ...tagged("session_votes", voteRows),
        ...tagged("session_invitations", invitationRows),
        ...tagged("arena_legs", arenaRows),
        ...tagged("match_states", matchRows),
        ...tagged("public_tokens", rows("SELECT id,scope,run_id,session_id,created_at,revoked_at FROM public_tokens WHERE created_by=? ORDER BY id", learnerId).map((row) => ({ ...row, existed: true }))),
        ...tagged("classrooms", classroomRows),
        ...tagged("classroom_members", memberRows),
        ...tagged("assignments", assignmentRows),
        ...tagged("assignment_submissions", submissionRows),
      ];
      const behavioralProfiles = [
        ...tagged("learner_ratings", rows("SELECT * FROM learner_ratings WHERE learner_id=? ORDER BY calibration_id", learnerId)),
        ...tagged("rated_games", rows("SELECT * FROM rated_games WHERE learner_id=? ORDER BY run_id", learnerId)),
        ...tagged("rating_periods", rows("SELECT * FROM rating_periods WHERE learner_id=? ORDER BY period_no", learnerId)),
        ...tagged("standing_members", rows("SELECT * FROM standing_members WHERE learner_id=? ORDER BY classroom_id", learnerId)),
        ...tagged("learner_marks", rows("SELECT * FROM learner_marks WHERE learner_id=? ORDER BY earned_at,run_id", learnerId)),
        ...tagged("cohort_standings", rows("SELECT * FROM cohort_standings WHERE opened_by_learner_id=? ORDER BY classroom_id", learnerId)),
      ];
      const bundle = buildAccountBundle({
        source: { applicationVersion: "0.0.0", storageVersion: STORAGE_VERSION, runSchemaVersion: DRILL_RUN_SCHEMA_VERSION },
        account: { handle: String(account.handle), displayName: account.display_name === null ? null : String(account.display_name), createdAt: String(account.created_at) },
        ownedRuns,
        sharedAccess,
        progress,
        marks,
        repertoires,
        drafts,
        publications,
        liveAndSocial,
        behavioralProfiles,
      });
      this.#database.exec("COMMIT");
      return bundle;
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not export learner account data", error);
    }
  }

  deletionPreview(learnerId: string, scope: DeletionPreviewV1["scope"], at: string): DeletionPreviewV1 {
    const learner = this.#database.prepare("SELECT 1 AS found FROM learners WHERE id=? AND id<>?").get(learnerId, LEGACY_ID);
    if (learner === undefined) throw new ServerError("UNAUTHENTICATED", "Authentication required");
    const selected = scope.kind === "account"
      ? this.#database.prepare("SELECT id,summary_json,snapshot_json,updated_at FROM drill_runs WHERE owner_learner_id=? ORDER BY id").all(learnerId)
      : this.#database.prepare("SELECT id,summary_json,snapshot_json,updated_at FROM drill_runs WHERE id=? AND owner_learner_id=?").all(scope.runId, learnerId);
    if (scope.kind === "run" && selected.length === 0) throw new ServerError("RUN_NOT_FOUND", "Run not found");
    const runs = (selected as readonly Record<string, unknown>[]).map((row) => {
      const id = String(row.id);
      let title = id;
      try { const summary = JSON.parse(String(row.summary_json)) as { readonly title?: unknown }; if (typeof summary.title === "string") title = summary.title; } catch { /* stable id fallback */ }
      const grantees = this.#database.prepare(
        `SELECT learner_id FROM run_grants WHERE run_id=? AND learner_id NOT IN (?,?)
         AND (expires_at IS NULL OR expires_at>?) ORDER BY learner_id`,
      ).all(id, learnerId, LEGACY_ID, at) as unknown as readonly { readonly learner_id: string }[];
      const derived = this.#database.prepare(
        `SELECT child.id FROM run_derivations link JOIN drill_runs child ON child.id=link.derived_run_id
         WHERE link.source_run_id=? AND child.owner_learner_id NOT IN (?,?) ORDER BY child.id`,
      ).all(id, learnerId, LEGACY_ID) as unknown as readonly { readonly id: string }[];
      const links = this.#database.prepare(
        `SELECT id FROM public_tokens WHERE revoked_at IS NULL AND
         (run_id=? OR session_id IN (SELECT id FROM live_sessions WHERE run_id=?)) ORDER BY id`,
      ).all(id, id) as unknown as readonly { readonly id: string }[];
      return Object.freeze({ id, title, activeForeignGranteeIds: grantees.map((item) => item.learner_id), foreignOwnedDerivedRunIds: derived.map((item) => item.id), anonymousLinkIds: links.map((item) => item.id) });
    });
    const ids = (sql: string, ...parameters: readonly string[]): readonly string[] =>
      Object.freeze((this.#database.prepare(sql).all(...parameters) as unknown as readonly { readonly id: string | number }[]).map((row) => String(row.id)));
    const progressIds = scope.kind === "run" ? [] : [
      ...ids("SELECT 'attempt:'||run_id||':'||branch_id AS id FROM attempts WHERE learner_id=? ORDER BY run_id,branch_id", learnerId),
      ...ids(`SELECT 'concept:'||c.run_id||':'||c.branch_id||':'||c.concept_key AS id FROM attempt_concepts c
        JOIN attempts a ON a.run_id=c.run_id AND a.branch_id=c.branch_id WHERE a.learner_id=? ORDER BY c.run_id,c.branch_id,c.concept_key`, learnerId),
      ...ids("SELECT 'schedule:'||id AS id FROM schedules WHERE learner_id=? ORDER BY id", learnerId),
      ...ids("SELECT 'position:'||transpose_key AS id FROM learner_position_stats WHERE learner_id=? ORDER BY transpose_key", learnerId),
    ];
    const markIds = scope.kind === "run" ? [] : ids("SELECT id FROM run_marks WHERE author_learner_id=? ORDER BY id", learnerId);
    const repertoireIds = scope.kind === "run" ? [] : [
      ...ids("SELECT id FROM repertoires WHERE owner_learner_id=? ORDER BY id", learnerId),
      ...ids("SELECT m.repertoire_id||':move:'||m.position_key||':'||m.move_uci AS id FROM repertoire_moves m JOIN repertoires r ON r.id=m.repertoire_id WHERE r.owner_learner_id=? ORDER BY m.repertoire_id,m.position_key,m.move_uci", learnerId),
      ...ids("SELECT s.repertoire_id||':scan' AS id FROM repertoire_scans s JOIN repertoires r ON r.id=s.repertoire_id WHERE r.owner_learner_id=? ORDER BY s.repertoire_id", learnerId),
      ...ids("SELECT g.repertoire_id||':gap:'||g.gap_key||':'||g.run_id AS id FROM repertoire_gap_runs g JOIN repertoires r ON r.id=g.repertoire_id WHERE r.owner_learner_id=? ORDER BY g.repertoire_id,g.gap_key,g.run_id", learnerId),
    ];
    const draftIds = scope.kind === "run" ? [] : [
      ...ids("SELECT 'pack:'||id AS id FROM pack_drafts WHERE owner_learner_id=? AND state<>'registered' ORDER BY id", learnerId),
      ...ids(`SELECT 'playtest:'||p.digest AS id FROM playtest_documents p JOIN pack_drafts d ON d.id=p.draft_id
        WHERE d.owner_learner_id=? AND d.state<>'registered' ORDER BY p.digest`, learnerId),
      ...ids("SELECT 'shape:'||id AS id FROM shape_drafts WHERE owner_learner_id=? AND state<>'registered' ORDER BY id", learnerId),
    ];
    const behavioralIds = scope.kind === "run" ? [] : [
      ...ids("SELECT 'rating:'||calibration_id AS id FROM learner_ratings WHERE learner_id=? ORDER BY calibration_id", learnerId),
      ...ids("SELECT 'game:'||run_id AS id FROM rated_games WHERE learner_id=? ORDER BY run_id", learnerId),
      ...ids("SELECT 'period:'||period_no AS id FROM rating_periods WHERE learner_id=? ORDER BY period_no", learnerId),
      ...ids("SELECT 'standing:'||classroom_id AS id FROM standing_members WHERE learner_id=? ORDER BY classroom_id", learnerId),
      ...ids("SELECT 'mark:'||mark AS id FROM learner_marks WHERE learner_id=? ORDER BY mark", learnerId),
    ];
    const hardDelete = scope.kind === "run" ? [] : [
      { kind: "progress" as const, count: progressIds.length, objectIds: progressIds, label: "Attempt history, concepts, schedules, and position statistics are permanently deleted" },
      { kind: "mark" as const, count: markIds.length, objectIds: markIds, label: "Private board marks are permanently deleted" },
      { kind: "repertoire" as const, count: repertoireIds.length, objectIds: repertoireIds, label: "Repertoires, moves, scans, and gap links are permanently deleted" },
      { kind: "draft" as const, count: draftIds.length, objectIds: draftIds, label: "Unpublished drafts and playtest documents are permanently deleted" },
      { kind: "behavioral_profile" as const, count: behavioralIds.length, objectIds: behavioralIds, label: "Ratings, game records, periods, standings, and private profile measurements are permanently deleted" },
      { kind: "account" as const, count: 1, objectIds: ["account"], label: "The learner account and all authenticated sessions are permanently deleted" },
    ];
    const retainedPublished = scope.kind === "run" ? [] : [
      ...((this.#database.prepare("SELECT pack_id AS id,version FROM registered_packs WHERE publisher_learner_id=? ORDER BY pack_id,version").all(learnerId) as unknown as readonly { readonly id: string; readonly version: string }[]).map((row) => ({ kind: "publication" as const, count: 1, objectIds: [`${row.id}@${row.version}`], label: `Published pack ${row.id} ${row.version} remains immutable with deleted-account attribution` }))),
      ...((this.#database.prepare("SELECT shape_id AS id,version FROM registered_shapes WHERE publisher_learner_id=? ORDER BY shape_id,version").all(learnerId) as unknown as readonly { readonly id: string; readonly version: string }[]).map((row) => ({ kind: "publication" as const, count: 1, objectIds: [`${row.id}@${row.version}`], label: `Published shape ${row.id} ${row.version} remains immutable with deleted-account attribution` }))),
    ];
    const classroomEffects = scope.kind === "run" ? [] : (this.#database.prepare(
      `SELECT DISTINCT c.id,c.name,
        (SELECT count(*) FROM classroom_members other WHERE other.classroom_id=c.id AND other.learner_id<>? AND other.state='active') AS other_active,
        (SELECT count(*) FROM assignment_submissions s JOIN assignments a ON a.id=s.assignment_id WHERE a.classroom_id=c.id) AS submissions
       FROM classrooms c LEFT JOIN classroom_members mine ON mine.classroom_id=c.id
       WHERE c.owner_learner_id=? OR (mine.learner_id=? AND mine.state<>'left') ORDER BY c.id`,
    ).all(learnerId, learnerId, learnerId) as readonly Record<string, unknown>[]).map((row) => ({
      shared: Number(row.other_active) > 0,
      effect: { kind: "classroom" as const, count: 1, objectIds: [String(row.id)], label: Number(row.other_active) > 0 ? `${String(row.name)} is archived read-only for remaining members with ${Number(row.submissions)} retained submission${Number(row.submissions) === 1 ? "" : "s"}` : `${String(row.name)} and ${Number(row.submissions)} submission${Number(row.submissions) === 1 ? "" : "s"} are permanently deleted` },
    }));
    const fingerprint = (selected as readonly Record<string, unknown>[]).map((row) => Object.freeze({
      id: String(row.id), snapshot: String(row.snapshot_json), updatedAt: String(row.updated_at),
      grants: (this.#database.prepare("SELECT learner_id,role,granted_at,expires_at,granted_via FROM run_grants WHERE run_id=? ORDER BY learner_id").all(String(row.id)) as readonly Record<string, unknown>[]).map((grant) => Object.freeze({ ...grant }) as unknown as JsonValue),
    }));
    return planDeletion({
      scope,
      runs,
      hardDelete: [...hardDelete, ...classroomEffects.filter((item) => !item.shared).map((item) => item.effect)],
      tombstone: classroomEffects.filter((item) => item.shared).map((item) => item.effect),
      retainedPublished,
      stateFingerprint: Object.freeze({ runs: fingerprint, publications: retainedPublished, classrooms: classroomEffects }),
    });
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
          `INSERT INTO run_grants (run_id, learner_id, role, granted_at, expires_at, granted_via)
           VALUES (?, ?, 'host', ?, NULL, NULL)`,
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

  createRatedRun(run: DrillRun, lease: LeaseHolder, title: string, game: OpenRatedGameRecord): void {
    if (game.runId !== run.id || game.learnerId !== lease.learnerId || game.state !== "open") {
      throw new ServerError("INVALID_REQUEST", "Rated-game declaration does not match its run owner");
    }
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
      this.#database.prepare(`INSERT INTO run_grants
        (run_id,learner_id,role,granted_at,expires_at,granted_via)
        VALUES (?,?,'host',?,NULL,NULL)`).run(run.id, lease.learnerId, updatedAt);
      this.#database.prepare(`INSERT INTO rated_games
        (run_id,learner_id,calibration_id,opponent_band,opponent_rating,opponent_rd,
         learner_side,start_piece_count,engine_identity_digest,state,started_at)
        VALUES (?,?,?,?,?,?,?,?,?,'open',?)`).run(
          game.runId, game.learnerId, game.calibrationId, game.opponentBand,
          game.opponentRating, game.opponentRd, game.learnerSide,
          game.startPieceCount, game.engineIdentityDigest, game.startedAt,
        );
      const initial = initialRating();
      const createdRating = this.#database.prepare(`INSERT OR IGNORE INTO learner_ratings
        (learner_id,calibration_id,rating,rd,volatility,seed_band,rated_games,voided_games,
         abandoned_games,period_no,period_started_at,updated_at)
        VALUES (?,?,?,?,?,NULL,0,0,0,0,?,?)`).run(
          game.learnerId, game.calibrationId, initial.rating, initial.rd,
          initial.volatility, game.startedAt, game.startedAt,
        );
      if (createdRating.changes === 1) {
        this.#database.prepare(`INSERT INTO rating_periods
          (learner_id,period_no,calibration_id,opened_at,closed_at,games,
           rating_before,rd_before,volatility_before,rating_after,rd_after,volatility_after)
          VALUES (?,0,?,?,NULL,0,?,?,?,NULL,NULL,NULL)`).run(
            game.learnerId, game.calibrationId, game.startedAt,
            initial.rating, initial.rd, initial.volatility,
          );
      }
      this.#database.exec("COMMIT");
      this.#snapshots.set(run.id, Object.freeze({
        run,
        activeWriterId: lease.writerId,
        activeWriterLearnerId: lease.learnerId,
      }));
    } catch (error) {
      this.#rollback();
      if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
        throw new ServerError("RUN_ALREADY_EXISTS", `Run already exists: ${run.id}`, { cause: error });
      }
      throw storageFailure("Could not create rated run", error);
    }
  }

  ratedGame(runId: string): RatedGameRecord | undefined {
    const row = this.#database.prepare("SELECT * FROM rated_games WHERE run_id = ?").get(runId) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : this.#ratedGameRecord(row);
  }

  ratedGames(learnerId: string): readonly RatedGameRecord[] {
    const rows = this.#database.prepare(
      "SELECT * FROM rated_games WHERE learner_id = ? ORDER BY started_at, run_id",
    ).all(learnerId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map((row) => this.#ratedGameRecord(row)));
  }

  learnerRating(learnerId: string): LearnerRatingRecord | undefined {
    const row = this.#database.prepare("SELECT * FROM learner_ratings WHERE learner_id = ?").get(learnerId) as Record<string, unknown> | undefined;
    if (row === undefined) return undefined;
    return Object.freeze({
      learnerId: String(row.learner_id), calibrationId: String(row.calibration_id),
      rating: Number(row.rating), rd: Number(row.rd), volatility: Number(row.volatility),
      seedBand: row.seed_band === null ? null : Number(row.seed_band),
      ratedGames: Number(row.rated_games), voidedGames: Number(row.voided_games),
      abandonedGames: Number(row.abandoned_games), periodNo: Number(row.period_no),
      periodStartedAt: String(row.period_started_at), updatedAt: String(row.updated_at),
    });
  }

  ratingPeriods(learnerId: string): readonly RatingPeriodRecord[] {
    const rows = this.#database.prepare(
      "SELECT * FROM rating_periods WHERE learner_id = ? ORDER BY period_no",
    ).all(learnerId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map((row) => Object.freeze({
      learnerId: String(row.learner_id), periodNo: Number(row.period_no),
      calibrationId: String(row.calibration_id), openedAt: String(row.opened_at),
      closedAt: row.closed_at === null ? null : String(row.closed_at), games: Number(row.games),
      ratingBefore: Number(row.rating_before), rdBefore: Number(row.rd_before),
      volatilityBefore: Number(row.volatility_before),
      ratingAfter: row.rating_after === null ? null : Number(row.rating_after),
      rdAfter: row.rd_after === null ? null : Number(row.rd_after),
      volatilityAfter: row.volatility_after === null ? null : Number(row.volatility_after),
    })));
  }

  learnerMarks(learnerId: string): readonly LearnerMarkRecord[] {
    const rows = this.#database.prepare(
      "SELECT * FROM learner_marks WHERE learner_id = ? ORDER BY CASE mark WHEN 'bronze' THEN 1 WHEN 'silver' THEN 2 ELSE 3 END",
    ).all(learnerId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map((row) => Object.freeze({
      learnerId: String(row.learner_id), mark: row.mark as LearnerMarkRecord["mark"],
      calibrationId: String(row.calibration_id), runId: String(row.run_id), earnedAt: String(row.earned_at),
    })));
  }

  createCohortStanding(record: CohortStandingRecord): CohortStandingRecord {
    try {
      this.#database.prepare(`INSERT INTO cohort_standings
        (classroom_id,opened_by_learner_id,window_from,window_to,opened_at,closed_at)
        VALUES (?,?,?,?,?,NULL)`).run(
          record.classroomId, record.openedByLearnerId, record.windowFrom,
          record.windowTo, record.openedAt,
        );
    } catch (error) {
      throw storageFailure("Could not create cohort standing", error);
    }
    return this.cohortStanding(record.classroomId)!;
  }

  cohortStanding(classroomId: string): CohortStandingRecord | undefined {
    const row = this.#database.prepare("SELECT * FROM cohort_standings WHERE classroom_id=?").get(classroomId) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : Object.freeze({
      classroomId: String(row.classroom_id), openedByLearnerId: String(row.opened_by_learner_id),
      windowFrom: String(row.window_from), windowTo: row.window_to === null ? null : String(row.window_to),
      openedAt: String(row.opened_at), closedAt: row.closed_at === null ? null : String(row.closed_at),
    });
  }

  updateCohortStandingWindow(classroomId: string, windowFrom: string, windowTo: string | null): CohortStandingRecord {
    const result = this.#database.prepare(`UPDATE cohort_standings SET window_from=?,window_to=?
      WHERE classroom_id=? AND closed_at IS NULL`).run(windowFrom, windowTo, classroomId);
    if (result.changes !== 1) throw new ServerError("RUN_NOT_FOUND", `Unknown open standing: ${classroomId}`);
    return this.cohortStanding(classroomId)!;
  }

  closeCohortStanding(classroomId: string, at: string): CohortStandingRecord {
    const result = this.#database.prepare(`UPDATE cohort_standings SET closed_at=?
      WHERE classroom_id=? AND closed_at IS NULL`).run(at, classroomId);
    if (result.changes !== 1) throw new ServerError("RUN_NOT_FOUND", `Unknown open standing: ${classroomId}`);
    return this.cohortStanding(classroomId)!;
  }

  publishStandingMember(record: StandingMemberRecord): StandingMemberRecord {
    const standing = this.cohortStanding(record.classroomId);
    if (standing === undefined || standing.closedAt !== null) {
      throw new ServerError("RUN_NOT_FOUND", `Unknown open standing: ${record.classroomId}`);
    }
    this.#database.prepare(`INSERT INTO standing_members
      (classroom_id,learner_id,show_record,show_rating,published_at)
      VALUES (?,?,?,?,?)
      ON CONFLICT(classroom_id,learner_id) DO UPDATE SET
        show_record=excluded.show_record,show_rating=excluded.show_rating,published_at=excluded.published_at`).run(
          record.classroomId, record.learnerId, record.showRecord ? 1 : 0,
          record.showRating ? 1 : 0, record.publishedAt,
        );
    return this.standingMembers(record.classroomId).find((member) => member.learnerId === record.learnerId)!;
  }

  standingMembers(classroomId: string): readonly StandingMemberRecord[] {
    const rows = this.#database.prepare(`SELECT * FROM standing_members
      WHERE classroom_id=? ORDER BY learner_id`).all(classroomId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map((row) => Object.freeze({
      classroomId: String(row.classroom_id), learnerId: String(row.learner_id),
      showRecord: row.show_record === 1, showRating: row.show_rating === 1,
      publishedAt: String(row.published_at),
    })));
  }

  setStandingMemberVisibility(classroomId: string, learnerId: string, field: "record" | "rating", visible: boolean): StandingMemberRecord {
    const column = field === "record" ? "show_record" : "show_rating";
    const result = this.#database.prepare(`UPDATE standing_members SET ${column}=?
      WHERE classroom_id=? AND learner_id=?`).run(visible ? 1 : 0, classroomId, learnerId);
    if (result.changes !== 1) throw new ServerError("RUN_NOT_FOUND", "Standing entry is not published");
    return this.standingMembers(classroomId).find((member) => member.learnerId === learnerId)!;
  }

  withdrawStandingMember(classroomId: string, learnerId: string): void {
    this.#database.prepare("DELETE FROM standing_members WHERE classroom_id=? AND learner_id=?").run(classroomId, learnerId);
  }

  sealRatedGame(input: {
    readonly runId: string;
    readonly result: RatedGameResult;
    readonly terminalReason: RatedGameTerminalReason;
    readonly plyCount: number;
    readonly sealedAt: string;
  }): RatedGameRecord {
    if (!Number.isSafeInteger(input.plyCount) || input.plyCount < 1) {
      throw new ServerError("INVALID_REQUEST", "A sealed rated game requires a positive ply count");
    }
    const existing = this.ratedGame(input.runId);
    if (existing === undefined) throw new ServerError("RUN_NOT_FOUND", `Unknown rated game: ${input.runId}`);
    if (existing.state !== "open") {
      if (existing.state === "sealed" && existing.result === input.result && existing.terminalReason === input.terminalReason && existing.plyCount === input.plyCount && existing.sealedAt === input.sealedAt) return existing;
      throw new ServerError("RATED_GAME_CLOSED", "Rated game is already sealed or voided");
    }
    const state = this.learnerRating(existing.learnerId);
    if (state === undefined) throw new ServerError("STORAGE_FAILURE", "Rated game has no learner rating state");
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const updated = this.#database.prepare(`UPDATE rated_games
        SET state='sealed',void_reason=NULL,result=?,terminal_reason=?,ply_count=?,period_no=?,sealed_at=?
        WHERE run_id=? AND state='open'`).run(
          input.result, input.terminalReason, input.plyCount, state.periodNo,
          input.sealedAt, input.runId,
        );
      if (updated.changes !== 1) throw new ServerError("RATED_GAME_CLOSED", "Rated game closed during projection");
      this.#database.prepare(`UPDATE rating_periods SET games=games+1
        WHERE learner_id=? AND period_no=? AND closed_at IS NULL`).run(existing.learnerId, state.periodNo);
      this.#database.prepare(`UPDATE learner_ratings SET rated_games=rated_games+1,updated_at=?
        WHERE learner_id=?`).run(input.sealedAt, existing.learnerId);
      const mark = input.result !== "win"
        ? undefined
        : existing.opponentBand === 1400 ? "bronze"
          : existing.opponentBand === 1800 ? "silver"
            : existing.opponentBand === 2200 ? "gold" : undefined;
      if (mark !== undefined) {
        this.#database.prepare(`INSERT OR IGNORE INTO learner_marks
          (learner_id,mark,calibration_id,run_id,earned_at) VALUES (?,?,?,?,?)`).run(
            existing.learnerId, mark, existing.calibrationId, existing.runId, input.sealedAt,
          );
      }

      const period = this.#database.prepare(`SELECT * FROM rating_periods
        WHERE learner_id=? AND period_no=?`).get(existing.learnerId, state.periodNo) as Record<string, unknown> | undefined;
      if (period === undefined) throw new ServerError("STORAGE_FAILURE", "Current rating period is missing");
      const elapsed = Date.parse(input.sealedAt) - Date.parse(String(period.opened_at));
      const closes = Number(period.games) >= 12 || (Number(period.games) >= 1 && elapsed >= 7 * 24 * 60 * 60 * 1000);
      if (closes) {
        const games = this.#database.prepare(`SELECT opponent_rating,opponent_rd,result FROM rated_games
          WHERE learner_id=? AND period_no=? AND state='sealed' ORDER BY sealed_at,run_id`).all(
            existing.learnerId, state.periodNo,
          ) as unknown as readonly { readonly opponent_rating: number; readonly opponent_rd: number; readonly result: RatedGameResult }[];
        const next = glicko2Update(state, games.map((game) => ({
          opponentRating: Number(game.opponent_rating),
          opponentRd: Number(game.opponent_rd),
          score: game.result === "win" ? 1 as const : game.result === "draw" ? 0.5 as const : 0 as const,
        })));
        const nextPeriod = state.periodNo + 1;
        this.#database.prepare(`UPDATE rating_periods
          SET closed_at=?,rating_after=?,rd_after=?,volatility_after=?
          WHERE learner_id=? AND period_no=?`).run(
            input.sealedAt, next.rating, next.rd, next.volatility,
            existing.learnerId, state.periodNo,
          );
        this.#database.prepare(`UPDATE learner_ratings
          SET rating=?,rd=?,volatility=?,period_no=?,period_started_at=?,updated_at=?
          WHERE learner_id=?`).run(
            next.rating, next.rd, next.volatility, nextPeriod, input.sealedAt,
            input.sealedAt, existing.learnerId,
          );
        this.#database.prepare(`INSERT INTO rating_periods
          (learner_id,period_no,calibration_id,opened_at,closed_at,games,
           rating_before,rd_before,volatility_before,rating_after,rd_after,volatility_after)
          VALUES (?,?,?,?,NULL,0,?,?,?,NULL,NULL,NULL)`).run(
            existing.learnerId, nextPeriod, state.calibrationId, input.sealedAt,
            next.rating, next.rd, next.volatility,
          );
      }
      this.#database.exec("COMMIT");
      return this.ratedGame(input.runId)!;
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not seal rated game", error);
    }
  }

  voidRatedGame(runId: string, reason: RatedGameVoidReason, at: string): RatedGameRecord {
    const existing = this.ratedGame(runId);
    if (existing === undefined) throw new ServerError("RUN_NOT_FOUND", `Unknown rated game: ${runId}`);
    if (existing.state !== "open") {
      if (existing.state === "voided" && existing.voidReason === reason) return existing;
      throw new ServerError("RATED_GAME_CLOSED", "Rated game is already sealed or voided");
    }
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      this.#database.prepare(`UPDATE rated_games
        SET state='voided',void_reason=?,result=NULL,terminal_reason=NULL,ply_count=NULL,sealed_at=?
        WHERE run_id=? AND state='open'`).run(reason, at, runId);
      this.#database.prepare(`UPDATE learner_ratings
        SET voided_games=voided_games+1,
            abandoned_games=abandoned_games+CASE WHEN ?='abandoned' THEN 1 ELSE 0 END,
            updated_at=? WHERE learner_id=?`).run(reason, at, existing.learnerId);
      this.#database.exec("COMMIT");
      return this.ratedGame(runId)!;
    } catch (error) {
      this.#rollback();
      throw storageFailure("Could not void rated game", error);
    }
  }

  expireRatedGames(at: string): readonly RatedGameRecord[] {
    const timestamp = Date.parse(at);
    if (!Number.isFinite(timestamp)) throw new ServerError("INVALID_REQUEST", "Rating expiry requires an ISO timestamp");
    const cutoff = new Date(timestamp - 30 * 24 * 60 * 60 * 1000).toISOString();
    const rows = this.#database.prepare(`SELECT run_id FROM rated_games
      WHERE state='open' AND started_at<=? ORDER BY started_at,run_id`).all(cutoff) as unknown as readonly { readonly run_id: string }[];
    return Object.freeze(rows.map((row) => this.voidRatedGame(String(row.run_id), "abandoned", at)));
  }

  #ratedGameRecord(row: Record<string, unknown>): RatedGameRecord {
    return Object.freeze({
      runId: String(row.run_id),
      learnerId: String(row.learner_id),
      calibrationId: String(row.calibration_id),
      opponentBand: Number(row.opponent_band),
      opponentRating: Number(row.opponent_rating),
      opponentRd: Number(row.opponent_rd),
      learnerSide: row.learner_side as "white" | "black",
      startPieceCount: Number(row.start_piece_count),
      engineIdentityDigest: String(row.engine_identity_digest),
      state: row.state as RatedGameState,
      voidReason: row.void_reason === null ? null : row.void_reason as RatedGameVoidReason,
      result: row.result === null ? null : row.result as RatedGameResult,
      terminalReason: row.terminal_reason === null ? null : row.terminal_reason as RatedGameTerminalReason,
      plyCount: row.ply_count === null ? null : Number(row.ply_count),
      periodNo: row.period_no === null ? null : Number(row.period_no),
      startedAt: String(row.started_at),
      sealedAt: row.sealed_at === null ? null : String(row.sealed_at),
    });
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
      this.#database.prepare(`INSERT INTO run_grants (run_id,learner_id,role,granted_at,expires_at,granted_via)
        VALUES (?,?,'host',?,NULL,NULL)`).run(run.id, lease.learnerId, updatedAt);
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
             AND (g.expires_at IS NULL OR g.expires_at > ?)
           JOIN learners holder ON holder.id = r.active_writer_learner_id
           WHERE r.schema_version = ?
           ORDER BY r.updated_at DESC, r.id ASC
           LIMIT ? OFFSET ?`,
        )
        .all(learnerId, this.#now(), DRILL_RUN_SCHEMA_VERSION, limit, offset);
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
      this.#database.prepare("INSERT INTO run_grants (run_id,learner_id,role,granted_at,expires_at,granted_via) VALUES (?,?,'host',?,NULL,NULL)").run(run.id,lease.learnerId,updatedAt);
      this.#database.prepare("INSERT INTO run_derivations (derived_run_id,source_run_id,source_branch_id,source_node_id,kind,created_at) VALUES (?,?,?,?,?,?)").run(derivation.derivedRunId,derivation.sourceRunId,derivation.sourceBranchId,derivation.sourceNodeId,derivation.kind,derivation.createdAt);
      this.#database.exec("COMMIT"); this.#snapshots.set(run.id,Object.freeze({run,activeWriterId:lease.writerId,activeWriterLearnerId:lease.learnerId}));
    }catch(error){this.#rollback();throw storageFailure("Could not create derived run",error);}
  }

  derivationFor(runId:string):RunDerivation|undefined{const row=this.#database.prepare("SELECT * FROM run_derivations WHERE derived_run_id=?").get(runId) as Record<string,unknown>|undefined;return row===undefined?undefined:this.#derivation(row);}
  derivationsFrom(runId:string):readonly RunDerivation[]{const rows=this.#database.prepare("SELECT * FROM run_derivations WHERE source_run_id=? ORDER BY created_at,derived_run_id").all(runId) as readonly Record<string,unknown>[];return Object.freeze(rows.map((row)=>this.#derivation(row)));}

  createRepertoire(record:RepertoireRecord,moves:readonly RepertoireMoveRecord[]):void{
    try{this.#database.exec("BEGIN IMMEDIATE");this.#insertRepertoire(record);const insert=this.#database.prepare("INSERT INTO repertoire_moves (repertoire_id,position_key,move_uci,move_san,representative_fen,rank,origin,created_at) VALUES (?,?,?,?,?,?,?,?)");for(const move of moves)insert.run(move.repertoireId,move.positionKey,move.moveUci,move.moveSan,move.representativeFen,move.rank,move.origin,move.createdAt);this.#database.exec("COMMIT");}
    catch(error){this.#rollback();throw storageFailure("Could not create repertoire",error);}
  }

  replaceRepertoire(record:RepertoireRecord,importedMoves:readonly RepertoireMoveRecord[],expectedDigest:string):void{
    try{this.#database.exec("BEGIN IMMEDIATE");const row=this.#database.prepare("SELECT digest FROM repertoires WHERE id=? AND owner_learner_id=?").get(record.id,record.ownerLearnerId) as {digest?:unknown}|undefined;if(row===undefined)throw new ServerError("RUN_NOT_FOUND","Repertoire not found");if(row.digest!==expectedDigest)throw new ServerError("REPERTOIRE_STALE","Repertoire changed while it was being edited",{details:{digest:String(row.digest)}});this.#database.prepare("DELETE FROM repertoire_moves WHERE repertoire_id=? AND origin='imported'").run(record.id);const insert=this.#database.prepare("INSERT INTO repertoire_moves (repertoire_id,position_key,move_uci,move_san,representative_fen,rank,origin,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(repertoire_id,position_key,move_uci) DO UPDATE SET move_san=excluded.move_san,representative_fen=excluded.representative_fen,rank=excluded.rank");for(const move of importedMoves)insert.run(move.repertoireId,move.positionKey,move.moveUci,move.moveSan,move.representativeFen,move.rank,move.origin,move.createdAt);this.#database.prepare("UPDATE repertoires SET name=?,side=?,root_fen=?,target_elo=?,coverage_denominator=?,source_kind=?,source_url=?,original_pgn=?,licence_note=?,digest=?,updated_at=? WHERE id=? AND owner_learner_id=?").run(record.name,record.side,record.rootFen,record.targetElo,record.coverageDenominator,record.sourceKind,record.sourceUrl,record.originalPgn,record.licenceNote,record.digest,record.updatedAt,record.id,record.ownerLearnerId);this.#database.exec("COMMIT");}
    catch(error){this.#rollback();if(error instanceof ServerError)throw error;throw storageFailure("Could not replace repertoire",error);}
  }

  repertoires(ownerLearnerId:string):readonly RepertoireRecord[]{const rows=this.#database.prepare("SELECT * FROM repertoires WHERE owner_learner_id=? ORDER BY updated_at DESC,id").all(ownerLearnerId) as readonly Record<string,unknown>[];return Object.freeze(rows.map((row)=>this.#repertoire(row)));}
  repertoire(id:string):RepertoireRecord|undefined{const row=this.#database.prepare("SELECT * FROM repertoires WHERE id=?").get(id) as Record<string,unknown>|undefined;return row===undefined?undefined:this.#repertoire(row);}
  repertoireMoves(id:string):readonly RepertoireMoveRecord[]{const rows=this.#database.prepare("SELECT * FROM repertoire_moves WHERE repertoire_id=? ORDER BY position_key,rank,move_uci").all(id) as readonly Record<string,unknown>[];return Object.freeze(rows.map((row)=>this.#repertoireMove(row)));}
  saveRepertoireScan(scan:RepertoireScanRecord):void{try{this.#database.prepare(`INSERT INTO repertoire_scans (repertoire_id,scanned_at,repertoire_digest,population_json,gaps_json,alternate_gaps_json,unknown_json,uncovered_mass,truncated,source_failures,queries_used,unreached_keys) VALUES (?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(repertoire_id) DO UPDATE SET scanned_at=excluded.scanned_at,repertoire_digest=excluded.repertoire_digest,population_json=excluded.population_json,gaps_json=excluded.gaps_json,alternate_gaps_json=excluded.alternate_gaps_json,unknown_json=excluded.unknown_json,uncovered_mass=excluded.uncovered_mass,truncated=excluded.truncated,source_failures=excluded.source_failures,queries_used=excluded.queries_used,unreached_keys=excluded.unreached_keys`).run(scan.repertoireId,scan.scannedAt,scan.repertoireDigest,JSON.stringify(scan.population),JSON.stringify(scan.gaps),JSON.stringify(scan.alternateGaps),JSON.stringify(scan.unknown),scan.uncoveredMass,scan.truncated?1:0,scan.sourceFailures,scan.queriesUsed,scan.unreachedKeys);}catch(error){throw storageFailure("Could not save repertoire scan",error);}}
  repertoireScan(id:string):RepertoireScanRecord|undefined{const row=this.#database.prepare("SELECT * FROM repertoire_scans WHERE repertoire_id=?").get(id) as Record<string,unknown>|undefined;if(row===undefined)return undefined;return Object.freeze({repertoireId:String(row.repertoire_id),scannedAt:String(row.scanned_at),repertoireDigest:String(row.repertoire_digest),population:JSON.parse(String(row.population_json)),gaps:JSON.parse(String(row.gaps_json)),alternateGaps:JSON.parse(String(row.alternate_gaps_json)),unknown:JSON.parse(String(row.unknown_json)),uncoveredMass:Number(row.uncovered_mass),truncated:Number(row.truncated)===1,sourceFailures:Number(row.source_failures),queriesUsed:Number(row.queries_used),unreachedKeys:Number(row.unreached_keys)});}
  addRepertoireAnswer(record:RepertoireMoveRecord,expectedDigest:string,nextDigest:string,updatedAt:string):void{try{this.#database.exec("BEGIN IMMEDIATE");const row=this.#database.prepare("SELECT digest FROM repertoires WHERE id=?").get(record.repertoireId) as {digest?:unknown}|undefined;if(row===undefined)throw new ServerError("RUN_NOT_FOUND","Repertoire not found");if(row.digest!==expectedDigest)throw new ServerError("REPERTOIRE_STALE","Repertoire changed while it was being edited",{details:{digest:String(row.digest)}});this.#database.prepare("UPDATE repertoire_moves SET rank=rank+1 WHERE repertoire_id=? AND position_key=?").run(record.repertoireId,record.positionKey);this.#database.prepare("INSERT INTO repertoire_moves (repertoire_id,position_key,move_uci,move_san,representative_fen,rank,origin,created_at) VALUES (?,?,?,?,?,0,'chosen_from_attempt',?) ON CONFLICT(repertoire_id,position_key,move_uci) DO UPDATE SET rank=0,origin='chosen_from_attempt'").run(record.repertoireId,record.positionKey,record.moveUci,record.moveSan,record.representativeFen,record.createdAt);this.#database.prepare("UPDATE repertoires SET digest=?,updated_at=? WHERE id=?").run(nextDigest,updatedAt,record.repertoireId);this.#database.exec("COMMIT");}catch(error){this.#rollback();if(error instanceof ServerError)throw error;throw storageFailure("Could not add repertoire answer",error);}}
  deleteRepertoire(id:string,ownerLearnerId:string):void{try{this.#database.exec("BEGIN IMMEDIATE");const found=this.#database.prepare("SELECT 1 AS found FROM repertoires WHERE id=? AND owner_learner_id=?").get(id,ownerLearnerId);if(found===undefined)throw new ServerError("RUN_NOT_FOUND","Repertoire not found");this.#deleteRepertoireRows(id);this.#database.exec("COMMIT");}catch(error){this.#rollback();if(error instanceof ServerError)throw error;throw storageFailure("Could not delete repertoire",error);}}
  createRepertoireGapRun(run:DrillRun,lease:LeaseHolder,title:string,link:RepertoireGapRunRecord):void{const updatedAt=this.#now();try{this.#database.exec("BEGIN IMMEDIATE");this.#database.prepare("INSERT INTO drill_runs (id,snapshot_json,active_writer_id,updated_at,summary_json,owner_learner_id,active_writer_learner_id,schema_version) VALUES (?,?,?,?,?,?,?,?)").run(run.id,JSON.stringify(run),lease.writerId,updatedAt,JSON.stringify(summaryFields(run,title,updatedAt)),lease.learnerId,lease.learnerId,run.schemaVersion);this.#database.prepare("INSERT INTO run_grants (run_id,learner_id,role,granted_at,expires_at,granted_via) VALUES (?,?,'host',?,NULL,NULL)").run(run.id,lease.learnerId,updatedAt);this.#database.prepare("INSERT INTO repertoire_gap_runs (run_id,repertoire_id,gap_key,created_at) VALUES (?,?,?,?)").run(link.runId,link.repertoireId,link.gapKey,link.createdAt);this.#database.exec("COMMIT");this.#snapshots.set(run.id,Object.freeze({run,activeWriterId:lease.writerId,activeWriterLearnerId:lease.learnerId}));}catch(error){this.#rollback();throw storageFailure("Could not create repertoire gap run",error);}}
  repertoireGapRun(repertoireId:string,gapKey:string):RepertoireGapRunRecord|undefined{const row=this.#database.prepare("SELECT * FROM repertoire_gap_runs WHERE repertoire_id=? AND gap_key=? ORDER BY created_at LIMIT 1").get(repertoireId,gapKey) as Record<string,unknown>|undefined;return row===undefined?undefined:Object.freeze({runId:String(row.run_id),repertoireId:String(row.repertoire_id),gapKey:String(row.gap_key),createdAt:String(row.created_at)});}
  repertoireGapAttemptCount(runId:string):number{const row=this.#database.prepare("SELECT count(*) AS total FROM attempts WHERE run_id=? AND countable=1").get(runId) as {total?:unknown};return Number(row.total??0);}
  repertoireGapFirstMoves(runId:string):readonly {readonly moveUci:string;readonly moveSan:string}[]{const stored=this.read(runId);if(stored===undefined)return Object.freeze([]);const root=stored.run.nodes[0];if(root===undefined)return Object.freeze([]);const rows=stored.run.nodes.filter((node)=>node.parentId===root.id&&node.actor==="user").map((node)=>({moveUci:node.moveUci!,moveSan:node.moveSan!}));return Object.freeze([...new Map(rows.map((row)=>[row.moveUci,row])).values()]);}

  #insertRepertoire(record:RepertoireRecord):void{this.#database.prepare("INSERT INTO repertoires (id,owner_learner_id,name,side,root_fen,target_elo,coverage_denominator,source_kind,source_url,original_pgn,licence_note,digest,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(record.id,record.ownerLearnerId,record.name,record.side,record.rootFen,record.targetElo,record.coverageDenominator,record.sourceKind,record.sourceUrl,Buffer.from(record.originalPgn),record.licenceNote,record.digest,record.createdAt,record.updatedAt);}
  #repertoire(row:Record<string,unknown>):RepertoireRecord{return Object.freeze({id:String(row.id),ownerLearnerId:String(row.owner_learner_id),name:String(row.name),side:String(row.side) as "white"|"black",rootFen:String(row.root_fen),targetElo:Number(row.target_elo),coverageDenominator:Number(row.coverage_denominator),sourceKind:String(row.source_kind) as "pgn_paste"|"lichess_study",sourceUrl:row.source_url===null?null:String(row.source_url),originalPgn:Buffer.from(row.original_pgn as Uint8Array).toString("utf8"),licenceNote:String(row.licence_note),digest:String(row.digest),createdAt:String(row.created_at),updatedAt:String(row.updated_at)});}
  #repertoireMove(row:Record<string,unknown>):RepertoireMoveRecord{return Object.freeze({repertoireId:String(row.repertoire_id),positionKey:String(row.position_key),moveUci:String(row.move_uci),moveSan:String(row.move_san),representativeFen:String(row.representative_fen),rank:Number(row.rank),origin:String(row.origin) as "imported"|"chosen_from_attempt",createdAt:String(row.created_at)});}
  #deleteRepertoireRows(id:string):void{this.#database.prepare("DELETE FROM repertoire_gap_runs WHERE repertoire_id=?").run(id);this.#database.prepare("DELETE FROM repertoire_scans WHERE repertoire_id=?").run(id);this.#database.prepare("DELETE FROM repertoire_moves WHERE repertoire_id=?").run(id);this.#database.prepare("DELETE FROM repertoires WHERE id=?").run(id);}

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

  deleteOwnedRun(learnerId: string, runId: string, at: string, expectedPreviewDigest: string): void {
    const legacyWriterId = `writer-legacy-${randomUUID()}`;
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const preview = this.deletionPreview(learnerId, { kind: "run", runId }, at);
      if (preview.digest !== expectedPreviewDigest) throw new ServerError("DELETION_PREVIEW_STALE", "Deletion preview is stale; review the current effects before trying again", { details: { digest: preview.digest } });
      this.#insertLegacy(at);
      const shared = preview.tombstone.some((effect) => effect.kind === "shared_run" && effect.objectIds.includes(runId));
      if (!shared) {
        this.#database.prepare("DELETE FROM public_tokens WHERE run_id=?").run(runId);
        this.#database.prepare("DELETE FROM run_derivations WHERE source_run_id=? OR derived_run_id=?").run(runId, runId);
        this.#database.prepare("DELETE FROM repertoire_gap_runs WHERE run_id=?").run(runId);
        this.#database.prepare("UPDATE schedules SET source_run_id=NULL WHERE source_run_id=?").run(runId);
        this.#database.prepare("UPDATE schedules SET started_run_id=NULL WHERE started_run_id=?").run(runId);
        this.#database.prepare("UPDATE pack_drafts SET seed_ref=NULL WHERE seed_kind='run' AND seed_ref=?").run(runId);
        this.#deletionEffectGroup("run_references");
        this.#database.prepare("DELETE FROM drill_runs WHERE id=? AND owner_learner_id=?").run(runId, learnerId);
      } else {
        const row = this.#database.prepare("SELECT summary_json FROM drill_runs WHERE id=?").get(runId) as { readonly summary_json: string };
        let summary: Record<string, unknown> = {};
        try { summary = JSON.parse(row.summary_json) as Record<string, unknown>; } catch { /* neutral projection below */ }
        this.#database.prepare("UPDATE drill_runs SET owner_learner_id=?,active_writer_learner_id=?,active_writer_id=?,summary_json=? WHERE id=?").run(LEGACY_ID, LEGACY_ID, legacyWriterId, JSON.stringify({ ...summary, title: "Shared run removed by its owner" }), runId);
        this.#database.prepare("DELETE FROM run_grants WHERE run_id=? AND learner_id=?").run(runId, learnerId);
        this.#database.prepare("UPDATE run_grants SET role='spectator' WHERE run_id=? AND learner_id<>?").run(runId, LEGACY_ID);
        this.#database.prepare("INSERT OR REPLACE INTO run_grants(run_id,learner_id,role,granted_at,expires_at,granted_via) VALUES (?,?,'host',?,NULL,NULL)").run(runId, LEGACY_ID, at);
        const session = this.#database.prepare("SELECT id,closed_at FROM live_sessions WHERE run_id=?").get(runId) as { readonly id?: unknown; readonly closed_at?: unknown } | undefined;
        if (typeof session?.id === "string") {
          this.#database.prepare("DELETE FROM public_tokens WHERE session_id=?").run(session.id);
          this.#database.prepare("UPDATE live_sessions SET closed_at=COALESCE(closed_at,?),vote_adapter_learner_id=NULL,handoff_learner_id=NULL,created_by=? WHERE id=?").run(at, LEGACY_ID, session.id);
          if (session.closed_at === null) this.#appendSessionJournal(session.id, "session.closed", null, this.#runSeq(runId), { reason: "run_deleted" }, at);
        }
        this.#database.prepare("DELETE FROM public_tokens WHERE run_id=?").run(runId);
        this.#database.prepare("DELETE FROM imported_games WHERE run_id=?").run(runId);
        this.#database.prepare("DELETE FROM run_marks WHERE run_id=? AND author_learner_id=?").run(runId, learnerId);
        this.#database.prepare("DELETE FROM attempts WHERE run_id=? AND learner_id=?").run(runId, learnerId);
      }
      this.#deletionEffectGroup("run_transition");
      this.#rebuildPositionStats(learnerId);
      this.#deletionEffectGroup("position_stats");
      this.#database.exec("COMMIT");
      this.#snapshots.delete(runId);
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not delete run", error);
    }
  }

  deleteLearner(learnerId: string, at: string, expectedPreviewDigest?: string): void {
    const legacyWriterId = `writer-legacy-${randomUUID()}`;
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const preview = this.deletionPreview(learnerId, { kind: "account" }, at);
      if (expectedPreviewDigest !== undefined && preview.digest !== expectedPreviewDigest) {
        throw new ServerError("DELETION_PREVIEW_STALE", "Deletion preview is stale; review the current effects before trying again", { details: { digest: preview.digest } });
      }
      this.#insertLegacy(at);
      const departing = this.#database.prepare("SELECT handle FROM learners WHERE id=?").get(learnerId) as { readonly handle: string };
      const hardRunIds = preview.hardDelete.filter((effect) => effect.kind === "run").flatMap((effect) => effect.objectIds);
      const tombstoneRunIds = preview.tombstone.filter((effect) => effect.kind === "shared_run").flatMap((effect) => effect.objectIds);
      const hardClassroomIds = preview.hardDelete.filter((effect) => effect.kind === "classroom").flatMap((effect) => effect.objectIds);
      const sharedClassroomIds = preview.tombstone.filter((effect) => effect.kind === "classroom").flatMap((effect) => effect.objectIds);
      const deletionScopedKey = `deleted-${randomUUID()}`;
      for (const runId of hardRunIds) {
        this.#database.prepare("DELETE FROM public_tokens WHERE run_id=?").run(runId);
        this.#database.prepare("DELETE FROM run_derivations WHERE source_run_id=? OR derived_run_id=?").run(runId, runId);
        this.#database.prepare("DELETE FROM repertoire_gap_runs WHERE run_id=?").run(runId);
        this.#database.prepare("UPDATE schedules SET source_run_id=NULL WHERE source_run_id=?").run(runId);
        this.#database.prepare("UPDATE schedules SET started_run_id=NULL WHERE started_run_id=?").run(runId);
        this.#database.prepare("UPDATE pack_drafts SET seed_ref=NULL WHERE seed_kind='run' AND seed_ref=?").run(runId);
        this.#database.prepare("DELETE FROM drill_runs WHERE id=? AND owner_learner_id=?").run(runId, learnerId);
      }
      for (const runId of tombstoneRunIds) {
        const row = this.#database.prepare("SELECT summary_json FROM drill_runs WHERE id=?").get(runId) as { readonly summary_json: string };
        let summary: Record<string, unknown> = {};
        try { summary = JSON.parse(row.summary_json) as Record<string, unknown>; } catch { /* retain only neutral title */ }
        this.#database.prepare(
          "UPDATE drill_runs SET owner_learner_id=?,active_writer_learner_id=?,active_writer_id=?,summary_json=? WHERE id=?",
        ).run(LEGACY_ID, LEGACY_ID, `${legacyWriterId}-${runId}`, JSON.stringify({ ...summary, title: "Shared run from deleted account" }), runId);
        this.#database.prepare("DELETE FROM run_grants WHERE run_id=? AND learner_id=?").run(runId, learnerId);
        this.#database.prepare("UPDATE run_grants SET role='spectator' WHERE run_id=? AND learner_id<>?").run(runId, LEGACY_ID);
        this.#database.prepare(
          "INSERT OR REPLACE INTO run_grants(run_id,learner_id,role,granted_at,expires_at,granted_via) VALUES (?,?,'host',?,NULL,NULL)",
        ).run(runId, LEGACY_ID, at);
        const session = this.#database.prepare("SELECT id,closed_at FROM live_sessions WHERE run_id=?").get(runId) as { readonly id?: unknown; readonly closed_at?: unknown } | undefined;
        if (typeof session?.id === "string") {
          this.#database.prepare("DELETE FROM public_tokens WHERE session_id=?").run(session.id);
          this.#database.prepare("UPDATE live_sessions SET closed_at=COALESCE(closed_at,?),vote_adapter_learner_id=NULL,handoff_learner_id=NULL,created_by=? WHERE id=?").run(at, LEGACY_ID, session.id);
          if (session.closed_at === null) this.#appendSessionJournal(session.id, "session.closed", null, this.#runSeq(runId), { reason: "account_deleted" }, at);
        }
        this.#database.prepare("DELETE FROM public_tokens WHERE run_id=?").run(runId);
        this.#database.prepare("DELETE FROM imported_games WHERE run_id=?").run(runId);
        this.#database.prepare("DELETE FROM run_marks WHERE run_id=? AND author_learner_id=?").run(runId, learnerId);
      }
      this.#deletionEffectGroup("owned_runs");
      this.#database.prepare(
        "DELETE FROM playtest_documents WHERE draft_id IN (SELECT id FROM pack_drafts WHERE owner_learner_id=? AND state<>'registered')",
      ).run(learnerId);
      this.#database.prepare("DELETE FROM pack_drafts WHERE owner_learner_id=? AND state<>'registered'").run(learnerId);
      this.#database.prepare("UPDATE pack_drafts SET owner_learner_id=? WHERE owner_learner_id=? AND state='registered'").run(LEGACY_ID, learnerId);
      this.#database.prepare(
        "UPDATE registered_packs SET publisher_learner_id=?,publisher_handle='deleted account' WHERE publisher_learner_id=?",
      ).run(LEGACY_ID, learnerId);
      this.#database.prepare("DELETE FROM shape_drafts WHERE owner_learner_id=? AND state<>'registered'").run(learnerId);
      this.#database.prepare("UPDATE shape_drafts SET owner_learner_id=? WHERE owner_learner_id=? AND state='registered'").run(LEGACY_ID, learnerId);
      this.#database.prepare(
        "UPDATE registered_shapes SET publisher_learner_id=?,publisher_handle='deleted account' WHERE publisher_learner_id=?",
      ).run(LEGACY_ID, learnerId);
      this.#deletionEffectGroup("published_artifacts");
      const repertoireRows=this.#database.prepare("SELECT id FROM repertoires WHERE owner_learner_id=?").all(learnerId) as unknown as readonly {id:string}[];
      for(const row of repertoireRows)this.#deleteRepertoireRows(row.id);
      this.#deletionEffectGroup("repertoires");
      for (const classroomId of hardClassroomIds) {
        this.#database.prepare("DELETE FROM classrooms WHERE id=?").run(classroomId);
      }
      for (const classroomId of sharedClassroomIds) {
        this.#database.prepare("UPDATE classrooms SET archived_at=COALESCE(archived_at,?),owner_learner_id=CASE WHEN owner_learner_id=? THEN ? ELSE owner_learner_id END WHERE id=?").run(at, learnerId, deletionScopedKey, classroomId);
        this.#database.prepare("DELETE FROM classroom_members WHERE classroom_id=? AND state='invited' AND (learner_id=? OR invited_by=?)").run(classroomId, learnerId, learnerId);
        this.#database.prepare("UPDATE classroom_members SET invited_by=? WHERE classroom_id=? AND invited_by=?").run(deletionScopedKey, classroomId, learnerId);
        this.#database.prepare("UPDATE classroom_members SET learner_id=? WHERE classroom_id=? AND learner_id=?").run(deletionScopedKey, classroomId, learnerId);
        this.#database.prepare("UPDATE assignments SET assigned_by=? WHERE classroom_id=? AND assigned_by=?").run(deletionScopedKey, classroomId, learnerId);
        const submissions = this.#database.prepare(
          `SELECT s.assignment_id,s.learner_id,s.run_id,s.granted_learner_ids
           FROM assignment_submissions s JOIN assignments a ON a.id=s.assignment_id WHERE a.classroom_id=?`,
        ).all(classroomId) as readonly Record<string, unknown>[];
        for (const submission of submissions) {
          const granted = (JSON.parse(String(submission.granted_learner_ids)) as string[]).filter((id) => id !== learnerId);
          this.#database.prepare(
            `UPDATE assignment_submissions SET learner_id=CASE WHEN learner_id=? THEN ? ELSE learner_id END,granted_learner_ids=?
             WHERE assignment_id=? AND learner_id=? AND run_id=?`,
          ).run(learnerId, deletionScopedKey, JSON.stringify(granted), String(submission.assignment_id), String(submission.learner_id), String(submission.run_id));
        }
      }
      this.#database.prepare("DELETE FROM classroom_members WHERE state='invited' AND (learner_id=? OR invited_by=?)").run(learnerId, learnerId);
      this.#database.prepare("UPDATE classroom_members SET invited_by=? WHERE invited_by=?").run(deletionScopedKey, learnerId);
      this.#database.prepare("UPDATE classroom_members SET learner_id=? WHERE learner_id=?").run(deletionScopedKey, learnerId);
      this.#database.prepare("UPDATE assignments SET assigned_by=? WHERE assigned_by=?").run(deletionScopedKey, learnerId);
      const remainingSubmissions = this.#database.prepare("SELECT assignment_id,learner_id,run_id,granted_learner_ids FROM assignment_submissions").all() as readonly Record<string, unknown>[];
      for (const submission of remainingSubmissions) {
        const granted = (JSON.parse(String(submission.granted_learner_ids)) as string[]).filter((id) => id !== learnerId);
        this.#database.prepare(
          `UPDATE assignment_submissions SET learner_id=CASE WHEN learner_id=? THEN ? ELSE learner_id END,granted_learner_ids=?
           WHERE assignment_id=? AND learner_id=? AND run_id=?`,
        ).run(learnerId, deletionScopedKey, JSON.stringify(granted), String(submission.assignment_id), String(submission.learner_id), String(submission.run_id));
      }
      this.#deletionEffectGroup("classrooms");
      this.#database.prepare("UPDATE live_sessions SET created_by = ? WHERE created_by = ?").run(LEGACY_ID,learnerId);
      this.#database.prepare("UPDATE live_sessions SET vote_adapter_learner_id=NULL WHERE vote_adapter_learner_id=?").run(learnerId);
      this.#database.prepare("UPDATE live_sessions SET handoff_learner_id=NULL WHERE handoff_learner_id=?").run(learnerId);
      const rotations = this.#database.prepare("SELECT id,rotation_json FROM live_sessions WHERE rotation_json IS NOT NULL").all() as readonly Record<string, unknown>[];
      for (const rotation of rotations) {
        const ids = (JSON.parse(String(rotation.rotation_json)) as string[]).filter((id) => id !== learnerId);
        this.#database.prepare("UPDATE live_sessions SET rotation_json=? WHERE id=?").run(JSON.stringify(ids), String(rotation.id));
      }
      this.#database.prepare("UPDATE session_journal SET actor_learner_id=NULL WHERE actor_learner_id=?").run(learnerId);
      const journalRows = this.#database.prepare("SELECT session_id,seq,payload_json FROM session_journal").all() as readonly Record<string, unknown>[];
      for (const journal of journalRows) {
        const payload = JSON.parse(String(journal.payload_json)) as Record<string, unknown>;
        let changed = false;
        if (payload.holderLearnerId === learnerId) { payload.holderLearnerId = LEGACY_ID; changed = true; }
        if (payload.changedByLearnerId === learnerId) { payload.changedByLearnerId = deletionScopedKey; changed = true; }
        if (changed) this.#database.prepare("UPDATE session_journal SET payload_json=? WHERE session_id=? AND seq=?").run(JSON.stringify(payload), String(journal.session_id), Number(journal.seq));
      }
      this.#database.prepare("DELETE FROM session_invitations WHERE invited_handle=?").run(departing.handle);
      this.#database.prepare("DELETE FROM public_tokens WHERE invited_handle=?").run(departing.handle);
      this.#database.prepare("DELETE FROM session_votes WHERE voter_key=?").run(`learner:${learnerId}`);
      this.#database.prepare("UPDATE arena_legs SET reference_player_handle='deleted learner' WHERE reference_player_handle=?").run(departing.handle);
      this.#database.prepare("UPDATE match_states SET white_learner_id=NULL WHERE white_learner_id=?").run(learnerId);
      this.#database.prepare("UPDATE match_states SET black_learner_id=NULL WHERE black_learner_id=?").run(learnerId);
      this.#database.prepare("UPDATE match_states SET pause_proposed_by=NULL WHERE pause_proposed_by=?").run(learnerId);
      this.#database.prepare("UPDATE cohort_standings SET opened_by_learner_id=? WHERE opened_by_learner_id=?").run(deletionScopedKey, learnerId);
      this.#deletionEffectGroup("retained_identity_scrub");
      this.#database.prepare("DELETE FROM run_marks WHERE author_learner_id = ?").run(learnerId);
      this.#database.prepare("DELETE FROM learners WHERE id = ?").run(learnerId);
      this.#deletionEffectGroup("learner_state");
      this.#database.exec("COMMIT");
      for (const runId of [...hardRunIds, ...tombstoneRunIds]) this.#snapshots.delete(runId);
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not delete learner", error);
    }
  }

  #deletionEffectGroup(group: DeletionEffectGroup): void {
    this.#failDeletionAfterEffectGroup?.(group);
  }

  #rebuildPositionStats(learnerId: string): void {
    this.#database.prepare("DELETE FROM learner_position_stats WHERE learner_id=?").run(learnerId);
    this.#database.prepare(
      `INSERT INTO learner_position_stats(learner_id,transpose_key,seen_count)
       SELECT learner_id,root_transpose_key,count(*) FROM attempts
       WHERE learner_id=? AND countable=1 GROUP BY learner_id,root_transpose_key`,
    ).run(learnerId);
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
          `SELECT g.learner_id, l.handle, g.role, g.granted_at, g.expires_at, g.granted_via
           FROM run_grants g JOIN learners l ON l.id = g.learner_id
           WHERE g.run_id = ? AND (g.expires_at IS NULL OR g.expires_at > ?)
           ORDER BY l.handle ASC`,
        )
        .all(runId, this.#now()) as readonly Record<string, unknown>[];
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
            ...(row.expires_at === null ? {} : { expiresAt: String(row.expires_at) }),
            ...(row.granted_via === null ? {} : { grantedVia: String(row.granted_via) }),
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
        .prepare(`SELECT role FROM run_grants WHERE run_id = ? AND learner_id = ?
          AND (expires_at IS NULL OR expires_at > ?)`)
        .get(runId, learnerId, this.#now()) as { readonly role?: unknown } | undefined;
      if (value === undefined) return undefined;
      if (!isRunRole(value.role)) throw new TypeError("Stored run role is invalid");
      return value.role;
    } catch (error) {
      throw storageFailure("Could not read run role", error);
    }
  }

  runMarks(runId: string, learnerId: string): readonly StoredRunMark[] {
    try {
      const rows = this.#database.prepare(
        `SELECT id,run_id,author_learner_id,scope,scope_key,brush,orig,dest,relayed,created_at
         FROM run_marks WHERE run_id=? AND author_learner_id=? ORDER BY created_at ASC,id ASC`,
      ).all(runId, learnerId) as readonly Record<string, unknown>[];
      return Object.freeze(rows.map(storedRunMark));
    } catch (error) {
      throw storageFailure("Could not list run marks", error);
    }
  }

  relayedRunMarks(runId: string, positionKey: string, branchKey: string): readonly StoredRunMark[] {
    try {
      const rows = this.#database.prepare(
        `SELECT id,run_id,author_learner_id,scope,scope_key,brush,orig,dest,relayed,created_at
         FROM run_marks
         WHERE run_id=? AND relayed=1
           AND ((scope='position' AND scope_key=?) OR (scope='branch' AND scope_key=?))
         ORDER BY created_at DESC,id DESC LIMIT 129`,
      ).all(runId, positionKey, branchKey) as readonly Record<string, unknown>[];
      return Object.freeze(rows.map(storedRunMark));
    } catch (error) {
      throw storageFailure("Could not list relayed run marks", error);
    }
  }

  replaceRunMarks(input: {
    readonly runId: string;
    readonly learnerId: string;
    readonly scope: RunMark["scope"];
    readonly scopeKey: string;
    readonly shapes: readonly Pick<RunMark, "brush" | "orig" | "dest">[];
    readonly relayed: boolean;
    readonly at: string;
  }): readonly StoredRunMark[] {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const existing = this.#database.prepare(
        `SELECT count(*) AS count FROM run_marks
         WHERE run_id=? AND author_learner_id=? AND NOT (scope=? AND scope_key=?)`,
      ).get(input.runId, input.learnerId, input.scope, input.scopeKey) as { readonly count: number };
      if (existing.count + input.shapes.length > 1_000) {
        throw new ServerError("INVALID_REQUEST", "A run may hold at most 1,000 marks per learner");
      }
      this.#database.prepare(
        "DELETE FROM run_marks WHERE run_id=? AND author_learner_id=? AND scope=? AND scope_key=?",
      ).run(input.runId, input.learnerId, input.scope, input.scopeKey);
      const insert = this.#database.prepare(
        `INSERT INTO run_marks
          (id,run_id,author_learner_id,scope,scope_key,brush,orig,dest,relayed,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
      );
      for (const shape of input.shapes) {
        insert.run(randomUUID(), input.runId, input.learnerId, input.scope, input.scopeKey,
          shape.brush, shape.orig, shape.dest ?? null, input.relayed ? 1 : 0, input.at);
      }
      this.#database.exec("COMMIT");
      return this.runMarks(input.runId, input.learnerId);
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not replace run marks", error);
    }
  }

  rescopeRunMarks(input: { readonly runId:string;readonly learnerId:string;readonly fromScope:RunMark["scope"];readonly fromKey:string;readonly toScope:RunMark["scope"];readonly toKey:string }): readonly StoredRunMark[] {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const counts = this.#database.prepare(
        `SELECT
           sum(CASE WHEN scope=? AND scope_key=? THEN 1 ELSE 0 END) AS source_count,
           sum(CASE WHEN scope=? AND scope_key=? THEN 1 ELSE 0 END) AS target_count
         FROM run_marks WHERE run_id=? AND author_learner_id=?`,
      ).get(input.fromScope,input.fromKey,input.toScope,input.toKey,input.runId,input.learnerId) as {readonly source_count:number|null;readonly target_count:number|null};
      if (input.fromScope !== input.toScope || input.fromKey !== input.toKey) {
        if ((counts.source_count ?? 0) + (counts.target_count ?? 0) > 64) {
          throw new ServerError("INVALID_REQUEST", "A position may hold at most 64 marks");
        }
      }
      this.#database.prepare(
        `UPDATE run_marks SET scope=?,scope_key=?
         WHERE run_id=? AND author_learner_id=? AND scope=? AND scope_key=?`,
      ).run(input.toScope,input.toKey,input.runId,input.learnerId,input.fromScope,input.fromKey);
      this.#database.exec("COMMIT");
      return this.runMarks(input.runId,input.learnerId);
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not re-scope run marks",error);
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
        const count = this.#database.prepare(`SELECT count(*) AS count FROM run_grants
          WHERE run_id=? AND role IN ('host','participant')
            AND (expires_at IS NULL OR expires_at>?)`).get(runId,this.#now()) as {count:number};
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
      for (const learnerId of new Set(attempts.map((attempt) => attempt.learnerId))) {
        this.#rebuildPositionStats(learnerId);
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
    readonly classroomId?: string;
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
        (id,run_id,kind,title,board_control,scheduled_for,vote_adapter_learner_id,rotation_json,created_by,created_at,classroom_id)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
          input.id, input.runId, input.kind, input.title, input.boardControl,
          input.scheduledFor ?? null, input.voteAdapterLearnerId ?? null,
          input.rotation === undefined ? null : JSON.stringify(input.rotation), input.createdBy, input.at,
          input.classroomId ?? null,
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
          if(existing===undefined)this.#database.prepare(`INSERT INTO run_grants(run_id,learner_id,role,granted_at,expires_at,granted_via)
            VALUES (?,?,'participant',?,NULL,NULL) ON CONFLICT(run_id,learner_id) DO UPDATE SET
            role='participant',granted_at=excluded.granted_at,expires_at=NULL,granted_via=NULL`).run(input.runId,learnerId,input.at);
          else if(existing==="spectator")this.#database.prepare(`UPDATE run_grants SET
            role='participant',granted_at=?,granted_via=NULL WHERE run_id=? AND learner_id=?`).run(input.at,input.runId,learnerId);
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
        AND (g.expires_at IS NULL OR g.expires_at>?)
      ORDER BY COALESCE(s.scheduled_for,s.created_at),s.id`).all(learnerId,this.#now()) as readonly Record<string, unknown>[];
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
      if(existing===undefined)this.#database.prepare(`INSERT INTO run_grants(run_id,learner_id,role,granted_at,expires_at,granted_via)
        VALUES (?,?,?,?,NULL,NULL) ON CONFLICT(run_id,learner_id) DO UPDATE SET
        role=excluded.role,granted_at=excluded.granted_at,expires_at=NULL,granted_via=NULL`).run(String(session.run_id),learnerId,role,at);
      else if(existing==="spectator"&&role==="participant")this.#database.prepare(`UPDATE run_grants SET
        role='participant',granted_at=?,granted_via=NULL WHERE run_id=? AND learner_id=?`).run(at,String(session.run_id),learnerId);
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
    const optionMoves=window.options.map((option)=>option.moveUci);
    const relayed=optionMoves.length===0?0:Number((this.#database.prepare(`SELECT count(*) AS count FROM session_votes WHERE session_id=? AND window_id=? AND voter_key LIKE 'chat:%' AND choice_uci IN (${optionMoves.map(()=>"?").join(",")})`).get(sessionId,windowId,...optionMoves) as {count:number}).count);
    return Object.freeze({window,tally,total:tally.reduce((sum,item)=>sum+item.count,0),relayed});
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
      rotationCursor:Number(row.rotation_cursor),createdBy:String(row.created_by),createdAt:String(row.created_at),...(row.closed_at===null?{}:{closedAt:String(row.closed_at)}),...(row.classroom_id===null||row.classroom_id===undefined?{}:{classroomId:String(row.classroom_id)})});
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

  createClassroom(record: ClassroomRecord): void {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      this.#database.prepare(
        "INSERT INTO classrooms(id,owner_learner_id,name,created_at,archived_at) VALUES(?,?,?,?,NULL)",
      ).run(record.id, record.ownerLearnerId, record.name, record.createdAt);
      this.#database.prepare(`INSERT INTO classroom_members
        (classroom_id,learner_id,member_role,state,invited_by,invited_at,joined_at,left_at)
        VALUES (?,?,'teacher','active',NULL,?,?,NULL)`).run(
        record.id, record.ownerLearnerId, record.createdAt, record.createdAt,
      );
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#rollback();
      throw storageFailure("Could not create classroom", error);
    }
  }

  classroomsFor(learnerId: string): readonly ClassroomRecord[] {
    const rows = this.#database.prepare(`SELECT c.* FROM classrooms c
      JOIN classroom_members m ON m.classroom_id=c.id
      WHERE m.learner_id=? AND m.state IN ('invited','active')
      ORDER BY c.created_at,c.id`).all(learnerId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map(classroomRecord));
  }

  classroom(id: string): ClassroomRecord | undefined {
    const row = this.#database.prepare("SELECT * FROM classrooms WHERE id=?").get(id) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : classroomRecord(row);
  }

  classroomMembers(classroomId: string): readonly ClassroomMemberRecord[] {
    const rows = this.#database.prepare(`SELECT m.*,COALESCE(l.handle,'deleted') AS handle
      FROM classroom_members m LEFT JOIN learners l ON l.id=m.learner_id
      WHERE m.classroom_id=? ORDER BY m.member_role DESC,handle,m.learner_id`).all(classroomId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map(classroomMemberRecord));
  }

  classroomMember(classroomId: string, learnerId: string): ClassroomMemberRecord | undefined {
    const row = this.#database.prepare(`SELECT m.*,COALESCE(l.handle,'deleted') AS handle
      FROM classroom_members m LEFT JOIN learners l ON l.id=m.learner_id
      WHERE m.classroom_id=? AND m.learner_id=?`).get(classroomId, learnerId) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : classroomMemberRecord(row);
  }

  inviteClassroomMember(input: Omit<ClassroomMemberRecord, "handle" | "joinedAt" | "leftAt">): void {
    this.#database.prepare(`INSERT INTO classroom_members
      (classroom_id,learner_id,member_role,state,invited_by,invited_at,joined_at,left_at)
      VALUES (?,?,?,?,?,?,NULL,NULL)
      ON CONFLICT(classroom_id,learner_id) DO UPDATE SET
        member_role=excluded.member_role,state='invited',invited_by=excluded.invited_by,
        invited_at=excluded.invited_at,joined_at=NULL,left_at=NULL`).run(
      input.classroomId, input.learnerId, input.memberRole, input.state,
      input.invitedBy, input.invitedAt,
    );
  }

  setClassroomMemberState(classroomId: string, learnerId: string, state: ClassroomMemberState, at: string): void {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const changed = this.#database.prepare(`UPDATE classroom_members SET state=?,
        joined_at=CASE WHEN ?='active' THEN ? ELSE joined_at END,
        left_at=CASE WHEN ?='left' THEN ? ELSE NULL END
        WHERE classroom_id=? AND learner_id=?`).run(state, state, at, state, at, classroomId, learnerId);
      if (changed.changes !== 1) throw new ServerError("INVALID_REQUEST", "Classroom membership is unavailable");
      if (state === "left") {
        this.#revokeClassroomSubmissionGrants(classroomId, learnerId);
        this.#database.prepare("DELETE FROM standing_members WHERE classroom_id=? AND learner_id=?").run(classroomId, learnerId);
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not update classroom membership", error);
    }
  }

  archiveClassroom(classroomId: string, at: string): void {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      this.#database.prepare("UPDATE classrooms SET archived_at=? WHERE id=? AND archived_at IS NULL").run(at, classroomId);
      this.#revokeClassroomSubmissionGrants(classroomId);
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#rollback();
      throw storageFailure("Could not archive classroom", error);
    }
  }

  createAssignment(record: AssignmentRecord): void {
    this.#database.prepare(`INSERT INTO assignments
      (id,classroom_id,pack_id,assigned_by,note,due_at,created_at,withdrawn_at)
      VALUES (?,?,?,?,?,?,?,NULL)`).run(record.id, record.classroomId, record.packId,
      record.assignedBy, record.note, record.dueAt, record.createdAt);
  }

  assignment(id: string): AssignmentRecord | undefined {
    const row = this.#database.prepare("SELECT * FROM assignments WHERE id=?").get(id) as Record<string, unknown> | undefined;
    return row === undefined ? undefined : assignmentRecord(row);
  }

  assignmentsForLearner(learnerId: string): readonly AssignmentRecord[] {
    const rows = this.#database.prepare(`SELECT a.* FROM assignments a
      JOIN classroom_members m ON m.classroom_id=a.classroom_id
      WHERE m.learner_id=? AND m.state='active' AND a.withdrawn_at IS NULL
      ORDER BY COALESCE(a.due_at,a.created_at),a.id`).all(learnerId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map(assignmentRecord));
  }

  assignmentsForClassroom(classroomId: string): readonly AssignmentRecord[] {
    const rows = this.#database.prepare("SELECT * FROM assignments WHERE classroom_id=? ORDER BY created_at,id")
      .all(classroomId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map(assignmentRecord));
  }

  withdrawAssignment(id: string, at: string): void {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      this.#database.prepare("UPDATE assignments SET withdrawn_at=? WHERE id=? AND withdrawn_at IS NULL").run(at, id);
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#rollback();
      throw storageFailure("Could not withdraw assignment", error);
    }
  }

  assignmentSubmissions(assignmentId: string): readonly AssignmentSubmissionRecord[] {
    const rows = this.#database.prepare("SELECT * FROM assignment_submissions WHERE assignment_id=? ORDER BY submitted_at,run_id")
      .all(assignmentId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map(assignmentSubmissionRecord));
  }

  assignmentSubmissionsForLearner(learnerId: string): readonly AssignmentSubmissionRecord[] {
    const rows = this.#database.prepare("SELECT * FROM assignment_submissions WHERE learner_id=? ORDER BY submitted_at,run_id")
      .all(learnerId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map(assignmentSubmissionRecord));
  }

  classroomLiveSessions(classroomId: string): readonly LiveSession[] {
    const rows = this.#database.prepare(`SELECT * FROM live_sessions
      WHERE classroom_id=? AND closed_at IS NULL AND scheduled_for IS NOT NULL
      ORDER BY scheduled_for,id`).all(classroomId) as readonly Record<string, unknown>[];
    return Object.freeze(rows.map((row) => this.#liveSessionRow(row)));
  }

  submitAssignment(record: AssignmentSubmissionRecord, teacherLearnerIds: readonly string[]): AssignmentSubmissionRecord {
    const prior = this.#database.prepare(`SELECT * FROM assignment_submissions
      WHERE assignment_id=? AND learner_id=? AND run_id=?`).get(
      record.assignmentId, record.learnerId, record.runId,
    ) as Record<string, unknown> | undefined;
    if (prior !== undefined && prior.withdrawn_at === null) return assignmentSubmissionRecord(prior);
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const granted: string[] = [];
      for (const learnerId of teacherLearnerIds) {
        const inserted = this.#database.prepare(`INSERT OR IGNORE INTO run_grants
          (run_id,learner_id,role,granted_at,expires_at,granted_via)
          VALUES (?,?,'spectator',?,?,'submission')`).run(
          record.runId, learnerId, record.submittedAt, record.accessExpiresAt,
        );
        const refreshed = inserted.changes === 1 ? inserted : this.#database.prepare(`UPDATE run_grants SET
          role='spectator',granted_at=?,expires_at=?,granted_via='submission'
          WHERE run_id=? AND learner_id=?
            AND (granted_via='submission' OR (expires_at IS NOT NULL AND expires_at<=?))`).run(
          record.submittedAt, record.accessExpiresAt, record.runId, learnerId, record.submittedAt,
        );
        if (refreshed.changes === 1) {
          granted.push(learnerId);
        }
      }
      this.#database.prepare(`INSERT INTO assignment_submissions
        (assignment_id,learner_id,run_id,granted_learner_ids,submitted_at,access_expires_at,withdrawn_at)
        VALUES (?,?,?,?,?,?,NULL)
        ON CONFLICT(assignment_id,learner_id,run_id) DO UPDATE SET
          granted_learner_ids=excluded.granted_learner_ids,submitted_at=excluded.submitted_at,
          access_expires_at=excluded.access_expires_at,withdrawn_at=NULL`).run(
        record.assignmentId, record.learnerId, record.runId, JSON.stringify(granted),
        record.submittedAt, record.accessExpiresAt,
      );
      this.#database.exec("COMMIT");
      return Object.freeze({ ...record, grantedLearnerIds: Object.freeze(granted), withdrawnAt: null });
    } catch (error) {
      this.#rollback();
      throw storageFailure("Could not submit assignment", error);
    }
  }

  withdrawAssignmentSubmission(assignmentId: string, learnerId: string, runId: string, at: string): void {
    try {
      this.#database.exec("BEGIN IMMEDIATE");
      const row = this.#database.prepare(`SELECT * FROM assignment_submissions
        WHERE assignment_id=? AND learner_id=? AND run_id=? AND withdrawn_at IS NULL`).get(
        assignmentId, learnerId, runId,
      ) as Record<string, unknown> | undefined;
      if (row === undefined) throw new ServerError("INVALID_REQUEST", "Assignment submission is unavailable");
      this.#revokeSubmissionGrantList(assignmentSubmissionRecord(row));
      this.#database.prepare(`UPDATE assignment_submissions SET withdrawn_at=?
        WHERE assignment_id=? AND learner_id=? AND run_id=?`).run(at, assignmentId, learnerId, runId);
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#rollback();
      if (error instanceof ServerError) throw error;
      throw storageFailure("Could not withdraw assignment submission", error);
    }
  }

  grantMintedBySubmission(runId: string, learnerId: string): boolean {
    return this.#database.prepare(`SELECT 1 FROM run_grants
      WHERE run_id=? AND learner_id=? AND granted_via='submission'
        AND (expires_at IS NULL OR expires_at>?)`).get(runId, learnerId, this.#now()) !== undefined;
  }

  #revokeSubmissionGrantList(record: AssignmentSubmissionRecord): void {
    for (const learnerId of record.grantedLearnerIds) {
      this.#database.prepare(`DELETE FROM run_grants
        WHERE run_id=? AND learner_id=? AND granted_via='submission'`).run(record.runId, learnerId);
    }
  }

  #revokeClassroomSubmissionGrants(classroomId: string, leavingLearnerId?: string): void {
    const rows = this.#database.prepare(`SELECT s.* FROM assignment_submissions s
      JOIN assignments a ON a.id=s.assignment_id
      WHERE a.classroom_id=? AND s.withdrawn_at IS NULL`).all(classroomId) as readonly Record<string, unknown>[];
    for (const row of rows) {
      const record = assignmentSubmissionRecord(row);
      if (leavingLearnerId === undefined || record.learnerId === leavingLearnerId) {
        this.#revokeSubmissionGrantList(record);
      } else if (record.grantedLearnerIds.includes(leavingLearnerId)) {
        this.#database.prepare(`DELETE FROM run_grants
          WHERE run_id=? AND learner_id=? AND granted_via='submission'`).run(record.runId, leavingLearnerId);
      }
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
          .prepare(`SELECT count(*) AS count FROM run_grants WHERE run_id = ? AND role = 'host'
            AND (expires_at IS NULL OR expires_at > ?)`)
          .get(runId, this.#now()) as { readonly count: number };
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
            `INSERT INTO run_grants (run_id, learner_id, role, granted_at, expires_at, granted_via)
             VALUES (?, ?, ?, ?, NULL, NULL)
             ON CONFLICT(run_id, learner_id)
             DO UPDATE SET role = excluded.role, granted_at = excluded.granted_at,
               expires_at = NULL, granted_via = NULL`,
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
      .prepare(`SELECT role FROM run_grants WHERE run_id = ? AND learner_id = ?
        AND (expires_at IS NULL OR expires_at > ?)`)
      .get(runId, learnerId, this.#now()) as { readonly role?: unknown } | undefined;
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
      {
        version: 15,
        name: "learner repertoires, scans, and gap-run links",
        apply: () => this.#addRepertoireTables(),
      },
      {
        version: 16,
        name: "immediate guard run schema",
        apply: () => this.#upgradeV010Runs(),
      },
      {
        version: 17,
        name: "stated reasoning run schema",
        apply: () => this.#upgradeV011Runs(),
      },
      {
        version: 18,
        name: "perfect tablebase run schema",
        apply: () => this.#upgradeV012Runs(),
      },
      {
        version: 19,
        name: "practical resistance run schema",
        apply: () => this.#upgradeV013Runs(),
      },
      {
        version: 20,
        name: "engine request record run schema",
        apply: () => this.#upgradeV014Runs(),
      },
      {
        version: 21,
        name: "engine leverage run schema",
        apply: () => this.#upgradeV015Runs(),
      },
      {
        version: 22,
        name: "learner board annotations",
        apply: () => this.#addRunMarks(),
      },
      {
        version: 23,
        name: "opponent ordering basis run schema",
        apply: () => this.#upgradeV016Runs(),
      },
      {
        version: 24,
        name: "classrooms, assignments, submissions, and expiring run grants",
        apply: () => this.#addClassroomTables(),
      },
      {
        version: 25,
        name: "learner ratings, rated games, periods, standings, and marks",
        apply: () => this.#addLearnerRatingTables(),
      },
    ] as const;
    assertContiguousMigrationVersions(migrations.map((migration) => migration.version));
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

  #addRunMarks(): void {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS run_marks (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
        author_learner_id TEXT NOT NULL,
        scope TEXT NOT NULL CHECK (scope IN ('position','branch')),
        scope_key TEXT NOT NULL,
        brush TEXT NOT NULL CHECK (brush IN ('green','red','blue','yellow')),
        orig TEXT NOT NULL,
        dest TEXT,
        relayed INTEGER NOT NULL CHECK (relayed IN (0,1)),
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS run_marks_author ON run_marks(run_id,author_learner_id,scope,scope_key);
      CREATE INDEX IF NOT EXISTS run_marks_relay ON run_marks(run_id,relayed,scope,scope_key);
    `);
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

  #addRepertoireTables():void{
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS repertoires (
        id TEXT PRIMARY KEY,
        owner_learner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        side TEXT NOT NULL CHECK (side IN ('white','black')),
        root_fen TEXT NOT NULL,
        target_elo INTEGER NOT NULL,
        coverage_denominator INTEGER NOT NULL CHECK (coverage_denominator BETWEEN 10 AND 10000),
        source_kind TEXT NOT NULL CHECK (source_kind IN ('pgn_paste','lichess_study')),
        source_url TEXT,
        original_pgn BLOB NOT NULL,
        licence_note TEXT NOT NULL,
        digest TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS repertoires_owner ON repertoires(owner_learner_id,updated_at);
      CREATE TABLE IF NOT EXISTS repertoire_moves (
        repertoire_id TEXT NOT NULL,
        position_key TEXT NOT NULL,
        move_uci TEXT NOT NULL,
        move_san TEXT NOT NULL,
        representative_fen TEXT NOT NULL,
        rank INTEGER NOT NULL,
        origin TEXT NOT NULL CHECK (origin IN ('imported','chosen_from_attempt')),
        created_at TEXT NOT NULL,
        PRIMARY KEY (repertoire_id,position_key,move_uci)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS repertoire_moves_position ON repertoire_moves(repertoire_id,position_key,rank);
      CREATE TABLE IF NOT EXISTS repertoire_scans (
        repertoire_id TEXT PRIMARY KEY,
        scanned_at TEXT NOT NULL,
        repertoire_digest TEXT NOT NULL,
        population_json TEXT NOT NULL,
        gaps_json TEXT NOT NULL,
        alternate_gaps_json TEXT NOT NULL,
        unknown_json TEXT NOT NULL,
        uncovered_mass REAL NOT NULL,
        truncated INTEGER NOT NULL CHECK (truncated IN (0,1)),
        source_failures INTEGER NOT NULL,
        queries_used INTEGER NOT NULL,
        unreached_keys INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS repertoire_gap_runs (
        run_id TEXT PRIMARY KEY,
        repertoire_id TEXT NOT NULL,
        gap_key TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS repertoire_gap_runs_gap ON repertoire_gap_runs(repertoire_id,gap_key,created_at);
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
      `SELECT snapshot_json, owner_learner_id
       FROM drill_runs
       WHERE schema_version = '0.7'
       ORDER BY id`,
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

  #upgradeV010Runs(): void {
    const rows = this.#database
      .prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.10'")
      .all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare(
      "UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.11' WHERE id = ?",
    );
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.10") continue;
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.11" }), row.id);
    }
  }

  #upgradeV011Runs(): void {
    const rows = this.#database
      .prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.11'")
      .all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare(
      "UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.12' WHERE id = ?",
    );
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.11") continue;
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.12" }), row.id);
    }
  }

  #upgradeV012Runs(): void {
    const rows = this.#database.prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.12'").all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.13' WHERE id = ?");
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.12") continue;
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.13" }), row.id);
    }
  }

  #upgradeV013Runs(): void {
    const rows = this.#database.prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.13'").all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.14' WHERE id = ?");
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.13") continue;
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.14" }), row.id);
    }
  }

  #upgradeV014Runs(): void {
    const rows = this.#database.prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.14'").all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.15' WHERE id = ?");
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.14") continue;
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.15" }), row.id);
    }
  }

  #upgradeV015Runs(): void {
    const rows = this.#database.prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.15'").all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.16' WHERE id = ?");
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.15") continue;
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.16" }), row.id);
    }
  }

  #upgradeV016Runs(): void {
    const rows = this.#database.prepare("SELECT id, snapshot_json FROM drill_runs WHERE schema_version = '0.16'").all() as readonly Record<string, unknown>[];
    const update = this.#database.prepare("UPDATE drill_runs SET snapshot_json = ?, schema_version = '0.17' WHERE id = ?");
    for (const row of rows) {
      if (typeof row.id !== "string" || typeof row.snapshot_json !== "string") continue;
      const snapshot = JSON.parse(row.snapshot_json) as Record<string, unknown>;
      if (snapshot.schemaVersion !== "0.16") continue;
      update.run(JSON.stringify({ ...snapshot, schemaVersion: "0.17" }), row.id);
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

  #addClassroomTables(): void {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id TEXT PRIMARY KEY,
        owner_learner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        archived_at TEXT
      ) STRICT;
      CREATE INDEX IF NOT EXISTS classrooms_owner ON classrooms(owner_learner_id);
      CREATE TABLE IF NOT EXISTS classroom_members (
        classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
        learner_id TEXT NOT NULL,
        member_role TEXT NOT NULL CHECK (member_role IN ('teacher','learner')),
        state TEXT NOT NULL CHECK (state IN ('invited','active','left')),
        invited_by TEXT,
        invited_at TEXT NOT NULL,
        joined_at TEXT,
        left_at TEXT,
        PRIMARY KEY (classroom_id, learner_id)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS classroom_members_learner
        ON classroom_members(learner_id, state);
      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
        pack_id TEXT NOT NULL,
        assigned_by TEXT NOT NULL,
        note TEXT,
        due_at TEXT,
        created_at TEXT NOT NULL,
        withdrawn_at TEXT
      ) STRICT;
      CREATE INDEX IF NOT EXISTS assignments_classroom
        ON assignments(classroom_id, created_at);
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        learner_id TEXT NOT NULL,
        run_id TEXT NOT NULL REFERENCES drill_runs(id) ON DELETE CASCADE,
        granted_learner_ids TEXT NOT NULL,
        submitted_at TEXT NOT NULL,
        access_expires_at TEXT NOT NULL,
        withdrawn_at TEXT,
        PRIMARY KEY (assignment_id, learner_id, run_id)
      ) STRICT;
      CREATE INDEX IF NOT EXISTS assignment_submissions_run ON assignment_submissions(run_id);
    `);
    const columns = (table: string): ReadonlySet<string> => new Set(
      (this.#database.prepare(`PRAGMA table_info(${table})`).all() as unknown as readonly { name: string }[])
        .map((row) => row.name),
    );
    const grantColumns = columns("run_grants");
    if (!grantColumns.has("expires_at")) this.#database.exec("ALTER TABLE run_grants ADD COLUMN expires_at TEXT");
    if (!grantColumns.has("granted_via")) this.#database.exec("ALTER TABLE run_grants ADD COLUMN granted_via TEXT");
    if (!columns("live_sessions").has("classroom_id")) {
      this.#database.exec(`ALTER TABLE live_sessions ADD COLUMN classroom_id TEXT
        REFERENCES classrooms(id) ON DELETE SET NULL`);
    }
  }

  #addLearnerRatingTables(): void {
    this.#database.exec(`
      CREATE TABLE IF NOT EXISTS learner_ratings (
        learner_id TEXT PRIMARY KEY REFERENCES learners(id) ON DELETE CASCADE,
        calibration_id TEXT NOT NULL,
        rating REAL NOT NULL,
        rd REAL NOT NULL,
        volatility REAL NOT NULL,
        seed_band INTEGER,
        rated_games INTEGER NOT NULL DEFAULT 0,
        voided_games INTEGER NOT NULL DEFAULT 0,
        abandoned_games INTEGER NOT NULL DEFAULT 0,
        period_no INTEGER NOT NULL DEFAULT 0,
        period_started_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS rated_games (
        run_id TEXT PRIMARY KEY REFERENCES drill_runs(id) ON DELETE CASCADE,
        learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        calibration_id TEXT NOT NULL,
        opponent_band INTEGER NOT NULL,
        opponent_rating REAL NOT NULL,
        opponent_rd REAL NOT NULL,
        learner_side TEXT NOT NULL CHECK (learner_side IN ('white','black')),
        start_piece_count INTEGER NOT NULL,
        engine_identity_digest TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('open','sealed','voided')),
        void_reason TEXT CHECK (void_reason IN ('rewound','forked','assistance','engine_changed','calibration_retired','abandoned')),
        result TEXT CHECK (result IN ('win','loss','draw')),
        terminal_reason TEXT CHECK (terminal_reason IN ('checkmate','stalemate','insufficient_material','fifty_move','threefold')),
        ply_count INTEGER,
        period_no INTEGER,
        started_at TEXT NOT NULL,
        sealed_at TEXT
      ) STRICT;
      CREATE INDEX IF NOT EXISTS rated_games_learner ON rated_games(learner_id, sealed_at);
      CREATE TABLE IF NOT EXISTS rating_periods (
        learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        period_no INTEGER NOT NULL,
        calibration_id TEXT NOT NULL,
        opened_at TEXT NOT NULL,
        closed_at TEXT,
        games INTEGER NOT NULL DEFAULT 0,
        rating_before REAL NOT NULL,
        rd_before REAL NOT NULL,
        volatility_before REAL NOT NULL,
        rating_after REAL,
        rd_after REAL,
        volatility_after REAL,
        PRIMARY KEY (learner_id, period_no)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS cohort_standings (
        classroom_id TEXT PRIMARY KEY REFERENCES classrooms(id) ON DELETE CASCADE,
        opened_by_learner_id TEXT NOT NULL,
        window_from TEXT NOT NULL,
        window_to TEXT,
        opened_at TEXT NOT NULL,
        closed_at TEXT
      ) STRICT;
      CREATE TABLE IF NOT EXISTS standing_members (
        classroom_id TEXT NOT NULL REFERENCES cohort_standings(classroom_id) ON DELETE CASCADE,
        learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        show_record INTEGER NOT NULL DEFAULT 1,
        show_rating INTEGER NOT NULL DEFAULT 0,
        published_at TEXT NOT NULL,
        PRIMARY KEY (classroom_id, learner_id)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS learner_marks (
        learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
        mark TEXT NOT NULL CHECK (mark IN ('bronze','silver','gold')),
        calibration_id TEXT NOT NULL,
        run_id TEXT NOT NULL,
        earned_at TEXT NOT NULL,
        PRIMARY KEY (learner_id, mark)
      ) STRICT;
    `);
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
