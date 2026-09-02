// DISPOSABLE RFC author model for D2460-D2464. This is not production code.

declare const BACKUP_ID: unique symbol;
const CHECK_RESULT: unique symbol = Symbol("storage-check-result");
const VERIFIED_REPLACEMENT: unique symbol = Symbol("verified-replacement");

export type BackupId = string & { readonly [BACKUP_ID]: "BackupId" };

export type StorageCheck =
  | "digest"
  | "integrity"
  | "foreign_keys"
  | "inventory"
  | "compatibility"
  | "migration_invariants"
  | "identity_retention"
  | "readiness";

export type BackupChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility"];
export type VerifyChecks = BackupChecks;
export type PrepareFreshChecks = readonly ["inventory", "compatibility", "readiness"];
export type PrepareCurrentChecks = readonly ["integrity", "foreign_keys", "inventory", "compatibility", "readiness"];
export type PrepareUpgradedChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "readiness"];
export type RestoreCurrentChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention"];
export type RestoreUpgradedChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention"];
export type RehearsalCurrentChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention", "readiness"];
export type RehearsalUpgradedChecks = readonly ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention", "readiness"];

const BACKUP_ID_PATTERN = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})\.(\d{3})Z-([0-9a-f]{12})$/u;

export function parseBackupId(value: unknown): BackupId {
  if (typeof value !== "string") throw new TypeError("BACKUP_ID_TYPE");
  const match = BACKUP_ID_PATTERN.exec(value);
  if (match === null) throw new TypeError("BACKUP_ID_GRAMMAR");
  const iso = `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${match[7]}Z`;
  const instant = new Date(iso);
  if (!Number.isFinite(instant.valueOf()) || instant.toISOString() !== iso) {
    throw new TypeError("BACKUP_ID_TIMESTAMP");
  }
  return value as BackupId;
}

export type StoragePathRef =
  | Readonly<{ role: "database"; identity: "live" }>
  | Readonly<{ role: "backup_root"; identity: "configured" }>
  | Readonly<{ role: "bundle"; identity: BackupId }>
  | Readonly<{ role: "staging"; identity: "internal" }>
  | Readonly<{ role: "volume"; identity: "disposable_rehearsal" }>;

export function parseStoragePathRef(value: unknown): StoragePathRef {
  if (typeof value !== "object" || value === null) throw new TypeError("PATH_REF_TYPE");
  const row = value as Record<string, unknown>;
  if (Object.keys(row).sort().join("\0") !== "identity\0role") throw new TypeError("PATH_REF_SHAPE");
  if (row.role === "bundle") return Object.freeze({ role: "bundle", identity: parseBackupId(row.identity) });
  const identities = {
    database: "live",
    backup_root: "configured",
    staging: "internal",
    volume: "disposable_rehearsal",
  } as const;
  if (typeof row.role !== "string" || !(row.role in identities) || row.identity !== identities[row.role as keyof typeof identities]) {
    throw new TypeError("PATH_REF_IDENTITY");
  }
  return Object.freeze({ role: row.role, identity: row.identity }) as StoragePathRef;
}

export type LockContentionProbe = "would_block" | "acquired" | "error";

export function assertInheritedLockAuthority(input: Readonly<{
  inheritedDescriptorMatchesConfiguredInode: boolean;
  independentSameInodeContention: LockContentionProbe;
}>): void {
  if (!input.inheritedDescriptorMatchesConfiguredInode) throw new TypeError("LOCK_INODE_MISMATCH");
  if (input.independentSameInodeContention !== "would_block") throw new TypeError("LOCK_OWNERSHIP_UNPROVEN");
}

export type BackupPublicationState =
  | Readonly<{ kind: "work"; operationId: string; ownerMarkerOperationId: string }>
  | Readonly<{ kind: "reserved_unpublished"; operationId: string; publishingMarkerOperationId: string }>
  | Readonly<{ kind: "published"; backupId: BackupId }>;

export function backupFailureDisposition(state: BackupPublicationState):
  | "remove_owned_work"
  | "retain_abandoned_reservation"
  | "preserve_published" {
  if (state.kind === "work") {
    if (state.operationId !== state.ownerMarkerOperationId) throw new TypeError("WORK_DIRECTORY_NOT_OWNED");
    return "remove_owned_work";
  }
  if (state.kind === "reserved_unpublished") {
    if (state.operationId !== state.publishingMarkerOperationId) throw new TypeError("RESERVATION_NOT_OWNED");
    return "retain_abandoned_reservation";
  }
  parseBackupId(state.backupId);
  return "preserve_published";
}

export interface VerifiedReplacement {
  readonly phase: "verified";
  readonly [VERIFIED_REPLACEMENT]: true;
}

export function commitVerifiedReplacement(input: Readonly<{
  checksPassed: boolean;
  sqliteHandlesClosed: boolean;
  installedMainFsynced: boolean;
  liveParentFsynced: boolean;
  verifiedJournalPersisted: boolean;
}>): VerifiedReplacement {
  if (!input.checksPassed || !input.sqliteHandlesClosed) throw new TypeError("REPLACEMENT_NOT_CHECKED");
  if (!input.installedMainFsynced || !input.liveParentFsynced) throw new TypeError("REPLACEMENT_NOT_DURABLE");
  if (!input.verifiedJournalPersisted) throw new TypeError("VERIFIED_PHASE_NOT_PERSISTED");
  return Object.freeze({ phase: "verified", [VERIFIED_REPLACEMENT]: true as const });
}

export interface PassedStorageCheck {
  readonly operationId: string;
  readonly check: StorageCheck;
  readonly passed: true;
  readonly [CHECK_RESULT]: true;
}

const CHECK_RESULTS = new WeakSet<object>();

export function recordPassedStorageCheck(operationId: string, check: StorageCheck): PassedStorageCheck {
  if (operationId.length === 0) throw new TypeError("OPERATION_ID_EMPTY");
  const result = Object.freeze({ operationId, check, passed: true as const, [CHECK_RESULT]: true as const });
  CHECK_RESULTS.add(result);
  return result;
}

export type SuccessShape =
  | Readonly<{ operation: "backup" }>
  | Readonly<{ operation: "verify" }>
  | Readonly<{ operation: "prepare_start"; action: "fresh" | "current" | "upgraded" }>
  | Readonly<{ operation: "restore"; migration: "not_required" | "applied" }>
  | Readonly<{ operation: "rehearsal"; migration: "not_required" | "applied" }>;

export type ExactSuccessChecks =
  | BackupChecks
  | VerifyChecks
  | PrepareFreshChecks
  | PrepareCurrentChecks
  | PrepareUpgradedChecks
  | RestoreCurrentChecks
  | RestoreUpgradedChecks
  | RehearsalCurrentChecks
  | RehearsalUpgradedChecks;

export function requiredSuccessChecks(shape: SuccessShape): ExactSuccessChecks {
  if (shape.operation === "backup" || shape.operation === "verify") {
    return ["digest", "integrity", "foreign_keys", "inventory", "compatibility"];
  }
  if (shape.operation === "prepare_start") {
    if (shape.action === "fresh") return ["inventory", "compatibility", "readiness"];
    if (shape.action === "current") return ["integrity", "foreign_keys", "inventory", "compatibility", "readiness"];
    return ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "readiness"];
  }
  if (shape.operation === "restore") {
    return shape.migration === "applied"
      ? ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention"]
      : ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention"];
  }
  return shape.migration === "applied"
    ? ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention", "readiness"]
    : ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention", "readiness"];
}

export function compileSuccessChecks(
  operationId: string,
  shape: SuccessShape,
  results: readonly PassedStorageCheck[],
): ExactSuccessChecks {
  const required = requiredSuccessChecks(shape);
  if (results.some((result) => !CHECK_RESULTS.has(result) || result.operationId !== operationId || result.passed !== true)) {
    throw new TypeError("UNSEALED_OR_WRONG_OPERATION_CHECK");
  }
  const actual = results.map((result) => result.check);
  if (new Set(actual).size !== actual.length) throw new TypeError("DUPLICATE_SUCCESS_CHECK");
  if (actual.length !== required.length || required.some((check) => !actual.includes(check))) {
    throw new TypeError("INCOMPLETE_OR_IRRELEVANT_SUCCESS_CHECKS");
  }
  return Object.freeze([...required]) as ExactSuccessChecks;
}
