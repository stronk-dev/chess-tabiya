import { isImportSourceKind, type DrillRun } from "@chess-tabiya/runtime";

import {
  ACCOUNT_BUNDLE_FORMAT,
  ACCOUNT_BUNDLE_VERSION,
  validateAccountBundleV1,
  type AccountBundleV1,
  type AccountRecordTable,
  type ImportedGameExport,
  type JsonValue,
  type TaggedAccountRecord,
} from "./account-data.js";
import { ServerError } from "./errors.js";
import { stripPgnAnnotations } from "./import-source.js";

/**
 * Account-level import of an exported bundle (roadmap `account_data`; completes
 * `docs/account-data-lifecycle.md`). The bundle is learner-supplied bytes, so it is read through the
 * same closed validator export uses, restores only the learner's *private* record into the
 * authenticated account, and refuses — atomically, before any write — when any restored identity
 * already exists in this installation. Nothing that involves another learner or an
 * installation-attested measurement is recreated from a file; every such object is counted in the
 * receipt's `notRestored` with its reason, never silently dropped.
 */

/** The writer id a restored run starts under; the learner's first client takes the lease over. */
export const ACCOUNT_IMPORT_WRITER_ID = "account-import";

/** Hard bound on one import request body. Export has none; an upload needs one. */
export const ACCOUNT_IMPORT_MAX_BYTES = 32 * 1024 * 1024;

/**
 * Portability versioning. A bundle's `formatVersion` names its closed shape. Every version this
 * build can read is listed with the upgrader that lifts it to the current shape; the current
 * version's upgrader is the identity. A future version is refused with the versions this build
 * reads, never guessed at.
 */
export const ACCOUNT_BUNDLE_UPGRADES: Readonly<Record<number, (value: Readonly<Record<string, unknown>>) => unknown>> = Object.freeze({
  [ACCOUNT_BUNDLE_VERSION]: (value) => value,
});
export const ACCOUNT_BUNDLE_READABLE_VERSIONS: readonly number[] = Object.freeze(Object.keys(ACCOUNT_BUNDLE_UPGRADES).map(Number).sort((a, b) => a - b));

export function readPortableAccountBundle(value: unknown): AccountBundleV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ServerError("ACCOUNT_IMPORT_INVALID", "The file is not a Tabiya account download");
  }
  const candidate = value as Readonly<Record<string, unknown>>;
  if (candidate.format !== ACCOUNT_BUNDLE_FORMAT) {
    throw new ServerError("ACCOUNT_IMPORT_INVALID", "The file is not a Tabiya account download");
  }
  const version = candidate.formatVersion;
  if (typeof version !== "number" || !Number.isSafeInteger(version) || version < 1) {
    throw new ServerError("ACCOUNT_IMPORT_INVALID", "The account download has no valid format version");
  }
  const upgrade = ACCOUNT_BUNDLE_UPGRADES[version];
  if (upgrade === undefined) {
    throw new ServerError("ACCOUNT_IMPORT_UNSUPPORTED_VERSION", `Account download format ${version} is newer than this installation reads`, {
      details: { formatVersion: version, readableVersions: [...ACCOUNT_BUNDLE_READABLE_VERSIONS] },
    });
  }
  const upgraded = upgrade(candidate);
  try {
    validateAccountBundleV1(upgraded);
  } catch (error) {
    throw new ServerError("ACCOUNT_IMPORT_INVALID", `The account download is not valid: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
  return upgraded;
}

export type AccountRestoreTable =
  | "drill_runs" | "imported_games" | "run_derivations" | "run_marks"
  | "attempts" | "attempt_concepts" | "attempt_concept_legacy" | "schedules"
  | "repertoires" | "repertoire_moves" | "repertoire_scans" | "repertoire_gap_runs"
  | "pack_drafts" | "playtest_documents" | "shape_drafts";

/** The order restore writes in; parents before children. */
export const ACCOUNT_RESTORE_TABLES: readonly AccountRestoreTable[] = Object.freeze([
  "drill_runs", "imported_games", "run_derivations", "run_marks",
  "attempts", "attempt_concepts", "attempt_concept_legacy", "schedules",
  "repertoires", "repertoire_moves", "repertoire_scans", "repertoire_gap_runs",
  "pack_drafts", "playtest_documents", "shape_drafts",
]);

export type AccountNotRestoredKind =
  | "unreplayable_run"
  | "run_grant"
  | "shared_run"
  | "publication"
  | "live_and_social"
  | "rating_record"
  | "campaign_record"
  | "orphan_record";

export const ACCOUNT_NOT_RESTORED_REASONS: Readonly<Record<AccountNotRestoredKind, string>> = Object.freeze({
  unreplayable_run: "This installation could not replay these runs, so they stay in the file rather than becoming broken runs.",
  run_grant: "Access you had given other people is not re-granted from a file; share again from the run.",
  shared_run: "Runs owned by other people stay with their owners; your access to them is not recreated.",
  publication: "Published packs and shapes belong to the installation that registered them; your drafts are restored instead.",
  live_and_social: "Live sessions, classrooms and assignments involve other people and are not recreated from a file.",
  rating_record: "Ratings, rated-game records, standings and earned marks are measured by an installation and are not restored from a file.",
  campaign_record: "Campaign runs, their event history and campaign marks are not recreated from a file; the encounter runs themselves are restored as ordinary runs.",
  orphan_record: "These records belong to a run or attempt that is not in the file, so there is nothing to attach them to.",
});

/** Classes rebuilt from the restored runs rather than copied from the file. */
export const ACCOUNT_REDERIVED_TABLES = Object.freeze([
  "learner_position_stats",
  "learner_observation_denominators", "learner_observations", "learner_structure_stats", "learner_observation_jobs",
] as const);

export interface RestoredRun {
  readonly id: string;
  readonly title: string;
  readonly run: DrillRun;
  readonly importedGame: ImportedGameExport | null;
}

export interface AccountRestorePlan {
  readonly runs: readonly RestoredRun[];
  readonly derivations: readonly AccountBundleV1["ownedRuns"]["value"][number]["derivations"][number][];
  readonly records: Readonly<Record<Exclude<AccountRestoreTable, "drill_runs" | "imported_games" | "run_derivations">, readonly Readonly<Record<string, JsonValue>>[]>>;
  readonly notRestored: readonly { readonly kind: AccountNotRestoredKind; readonly count: number; readonly reason: string }[];
}

function recordsOf<T extends AccountRecordTable>(records: readonly TaggedAccountRecord[], table: T): readonly Readonly<Record<string, JsonValue>>[] {
  return records.filter((item) => item.table === table).map((item) => item.record as Readonly<Record<string, JsonValue>>);
}

/**
 * An imported game re-enters storage through the same boundary a fresh import does: its source kind
 * must be a durable `import-source-protocol` member, and its PGN is stripped of third-party
 * annotations ([[D959]]) — a file exported before that fix may still carry them.
 */
function restoredImportedGame(runId: string, game: ImportedGameExport | null): ImportedGameExport | null {
  if (game === null) return null;
  if (!isImportSourceKind(game.sourceKind)) {
    throw new ServerError("ACCOUNT_IMPORT_INVALID", `Run ${runId} has an imported-game source this installation does not know`);
  }
  return Object.freeze({ ...game, pgn: stripPgnAnnotations(game.pgn) });
}

/** A pure projection of a validated bundle into what restore writes and what it declines. */
export function planAccountRestore(bundle: AccountBundleV1): AccountRestorePlan {
  const replayable = bundle.ownedRuns.value.filter((run) => run.snapshot.kind === "parsed");
  const runIds = new Set(replayable.map((run) => run.id));
  const derivationKeys = new Set<string>();
  const derivations = replayable.flatMap((run) => run.derivations).filter((item) => {
    if (!runIds.has(item.derivedRunId) || !runIds.has(item.sourceRunId) || derivationKeys.has(item.derivedRunId)) return false;
    derivationKeys.add(item.derivedRunId);
    return true;
  });
  const allDerivations = new Set(bundle.ownedRuns.value.flatMap((run) => run.derivations.map((item) => item.derivedRunId)));
  const progress = bundle.progress.value;
  const attempts = recordsOf(progress, "attempts");
  const restoredAttempts = attempts.filter((row) => runIds.has(String(row.run_id)));
  const attemptKeys = new Set(restoredAttempts.map((row) => `${String(row.run_id)}\u0000${String(row.branch_id)}`));
  const concepts = recordsOf(progress, "attempt_concepts");
  const legacy = recordsOf(progress, "attempt_concept_legacy");
  const attached = (row: Readonly<Record<string, JsonValue>>) => attemptKeys.has(`${String(row.run_id)}\u0000${String(row.branch_id)}`);
  const marks = bundle.marks.value.map((item) => item.record as Readonly<Record<string, JsonValue>>);
  const restoredMarks = marks.filter((row) => runIds.has(String(row.run_id)));
  const drafts = bundle.drafts.value;
  const packDrafts = recordsOf(drafts, "pack_drafts");
  const draftIds = new Set(packDrafts.map((row) => String(row.id)));
  const playtests = recordsOf(drafts, "playtest_documents");
  const repertoireRecords = bundle.repertoires.value;
  const repertoires = recordsOf(repertoireRecords, "repertoires");
  const repertoireIds = new Set(repertoires.map((row) => String(row.id)));
  const repertoireChild = (table: "repertoire_moves" | "repertoire_scans" | "repertoire_gap_runs") => recordsOf(repertoireRecords, table);
  const children = {
    repertoire_moves: repertoireChild("repertoire_moves"),
    repertoire_scans: repertoireChild("repertoire_scans"),
    repertoire_gap_runs: repertoireChild("repertoire_gap_runs"),
  };
  const orphanCount =
    (attempts.length - restoredAttempts.length)
    + concepts.filter((row) => !attached(row)).length
    + legacy.filter((row) => !attached(row)).length
    + (marks.length - restoredMarks.length)
    + playtests.filter((row) => !draftIds.has(String(row.draft_id))).length
    + Object.values(children).reduce((total, rows) => total + rows.filter((row) => !repertoireIds.has(String(row.repertoire_id))).length, 0)
    + [...allDerivations].filter((id) => !derivationKeys.has(id)).length;
  const ratingTables = new Set(["learner_ratings", "rated_games", "rating_periods", "cohort_standings", "standing_members", "learner_marks"]);
  const counted = (kind: AccountNotRestoredKind, count: number) => Object.freeze({ kind, count, reason: ACCOUNT_NOT_RESTORED_REASONS[kind] });
  const notRestored = [
    counted("unreplayable_run", bundle.ownedRuns.value.length - replayable.length),
    counted("run_grant", replayable.reduce((total, run) => total + run.grants.filter((grant) => grant.granteeHandle !== bundle.account.value.handle).length, 0)),
    counted("shared_run", bundle.sharedAccess.value.length),
    counted("publication", bundle.publications.value.length),
    counted("live_and_social", bundle.liveAndSocial.value.length),
    counted("rating_record", bundle.behavioralProfiles.value.filter((item) => ratingTables.has(item.table)).length),
    // rfc/campaign-core.md §6.2: Campaign adds no account import/merge; its rows are counted, never dropped silently.
    counted("campaign_record", progress.filter((item) => item.table.startsWith("campaign_")).length),
    counted("orphan_record", orphanCount),
  ].filter((item) => item.count > 0);
  return Object.freeze({
    runs: Object.freeze(replayable.map((run) => Object.freeze({
      id: run.id,
      title: run.title,
      run: (run.snapshot as { readonly kind: "parsed"; readonly value: DrillRun }).value,
      importedGame: restoredImportedGame(run.id, run.importedGame),
    }))),
    derivations: Object.freeze(derivations),
    records: Object.freeze({
      run_marks: Object.freeze(restoredMarks),
      attempts: Object.freeze(restoredAttempts),
      attempt_concepts: Object.freeze(concepts.filter(attached)),
      attempt_concept_legacy: Object.freeze(legacy.filter(attached)),
      schedules: Object.freeze(recordsOf(progress, "schedules")),
      repertoires: Object.freeze(repertoires),
      repertoire_moves: Object.freeze(children.repertoire_moves.filter((row) => repertoireIds.has(String(row.repertoire_id)))),
      repertoire_scans: Object.freeze(children.repertoire_scans.filter((row) => repertoireIds.has(String(row.repertoire_id)))),
      repertoire_gap_runs: Object.freeze(children.repertoire_gap_runs.filter((row) => repertoireIds.has(String(row.repertoire_id)))),
      pack_drafts: Object.freeze(packDrafts),
      playtest_documents: Object.freeze(playtests.filter((row) => draftIds.has(String(row.draft_id)))),
      shape_drafts: Object.freeze(recordsOf(drafts, "shape_drafts")),
    }),
    notRestored: Object.freeze(notRestored),
  });
}

export interface AccountImportReceiptV1 {
  readonly version: 1;
  readonly mode: "preview" | "committed";
  readonly bundleDigest: `sha256:${string}`;
  readonly bundleFormatVersion: number;
  readonly sourceStorageVersion: number;
  readonly restored: readonly { readonly table: AccountRestoreTable; readonly count: number }[];
  readonly rederived: readonly string[];
  readonly notRestored: AccountRestorePlan["notRestored"];
  /** Identities that already exist here. A non-empty list refuses the commit. */
  readonly conflicts: readonly string[];
}

export function restoredCounts(plan: AccountRestorePlan): AccountImportReceiptV1["restored"] {
  const counts: Record<AccountRestoreTable, number> = {
    drill_runs: plan.runs.length,
    imported_games: plan.runs.filter((run) => run.importedGame !== null).length,
    run_derivations: plan.derivations.length,
    ...Object.fromEntries(Object.entries(plan.records).map(([table, rows]) => [table, rows.length])),
  } as Record<AccountRestoreTable, number>;
  return Object.freeze(ACCOUNT_RESTORE_TABLES.map((table) => Object.freeze({ table, count: counts[table] })).filter((item) => item.count > 0));
}
