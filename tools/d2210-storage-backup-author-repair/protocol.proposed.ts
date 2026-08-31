type Operation = "command" | "backup" | "verify" | "prepare_start" | "restore" | "rehearsal";
type Check = "digest" | "integrity" | "foreign_keys" | "inventory" | "compatibility" | "migration_invariants" | "identity_retention" | "readiness";
type PathRef =
  | { readonly role: "database"; readonly identity: "live" }
  | { readonly role: "backup_root"; readonly identity: "configured" }
  | { readonly role: "bundle"; readonly identity: string }
  | { readonly role: "staging"; readonly identity: "internal" }
  | { readonly role: "volume"; readonly identity: "disposable_rehearsal" };
type RefusalCode = "USAGE_ERROR" | "NO_DATABASE" | "MAINTENANCE_LOCKED" | "LOCK_AUTHORITY_MISSING" | "PATH_REFUSED" | "BACKUP_ID_COLLISION" | "STORAGE_NEWER_THAN_APPLICATION" | "STORAGE_TOO_OLD" | "RESTORE_CONFIRMATION_REQUIRED";
type FailureCode = "BUNDLE_INVALID" | "DIGEST_MISMATCH" | "SQLITE_INTEGRITY_FAILED" | "FOREIGN_KEY_VIOLATION" | "INVENTORY_MISMATCH" | "BACKUP_FAILED" | "MIGRATION_FAILED" | "RESTORE_FAILED" | "REPLACEMENT_RECOVERY_REQUIRED" | "INTERNAL_ERROR";

interface Base {
  readonly protocol: "tabiya-storage-admin-receipt";
  readonly protocolVersion: 1;
  readonly operationId: string;
  readonly applicationRevision: string;
  readonly elapsedMs: number;
  readonly paths: readonly PathRef[];
}

type Receipt = Base & (
  | { readonly operation: "backup"; readonly result: "succeeded"; readonly backupId: string; readonly reason: "manual" | "pre_upgrade" | "pre_restore"; readonly sourceStorageVersion: number; readonly intendedStorageVersion: number; readonly checks: readonly Check[] }
  | { readonly operation: "verify"; readonly result: "succeeded"; readonly backupId: string; readonly compatibility: "current" | "upgradeable"; readonly sourceStorageVersion: number; readonly currentStorageVersion: number; readonly checks: readonly Check[] }
  | { readonly operation: "prepare_start"; readonly result: "succeeded"; readonly action: "fresh" | "current" | "upgraded"; readonly sourceStorageVersion: number | null; readonly targetStorageVersion: number; readonly backupId: string | null; readonly checks: readonly Check[] }
  | { readonly operation: "restore"; readonly result: "succeeded"; readonly sourceBackupId: string; readonly preRestoreBackupId: string | null; readonly sourceStorageVersion: number; readonly targetStorageVersion: number; readonly checks: readonly Check[] }
  | { readonly operation: "rehearsal"; readonly result: "succeeded"; readonly sourceBackupId: string; readonly imageDigest: string; readonly architecture: "linux/amd64" | "linux/arm64"; readonly checks: readonly Check[] }
  | { readonly operation: Operation; readonly result: "refused"; readonly code: RefusalCode; readonly compatibility?: "newer_than_application" | "unsupported_old" }
  | { readonly operation: Operation; readonly result: "failed"; readonly code: FailureCode; readonly compatibility?: "invalid" }
  | { readonly operation: Operation; readonly result: "cancelled"; readonly code: "OPERATION_CANCELLED"; readonly signal: "SIGINT" | "SIGTERM" }
);

const common = {
  protocol: "tabiya-storage-admin-receipt",
  protocolVersion: 1,
  operationId: "018f3c70-4a90-7cc6-a28a-1fcb7f474000",
  applicationRevision: "0123456789abcdef",
  elapsedMs: 4,
  paths: [{ role: "database", identity: "live" }],
} as const;

void ({ ...common, operation: "backup", result: "succeeded", backupId: "20260831T120000.000Z-aabbccddeeff", reason: "manual", sourceStorageVersion: 25, intendedStorageVersion: 25, checks: ["digest"] } satisfies Receipt);
void ({ ...common, operation: "verify", result: "refused", code: "STORAGE_TOO_OLD", compatibility: "unsupported_old" } satisfies Receipt);
void ({ ...common, operation: "restore", result: "failed", code: "BUNDLE_INVALID", compatibility: "invalid" } satisfies Receipt);

// @ts-expect-error backup success cannot omit its identity and version fields
void ({ ...common, operation: "backup", result: "succeeded", reason: "manual", checks: [] } satisfies Receipt);
// @ts-expect-error a successful verify cannot claim an invalid compatibility disposition
void ({ ...common, operation: "verify", result: "succeeded", backupId: "x", compatibility: "invalid", sourceStorageVersion: 25, currentStorageVersion: 25, checks: [] } satisfies Receipt);
// @ts-expect-error diagnostics cannot invent a result arm
void ({ ...common, operation: "restore", result: "warning", code: "RESTORE_FAILED" } satisfies Receipt);
// @ts-expect-error safe path references cannot carry arbitrary absolute database paths
void ({ ...common, paths: [{ role: "database", identity: "/data/private.sqlite" }], operation: "command", result: "refused", code: "USAGE_ERROR" } satisfies Receipt);
