// DISPOSABLE author contract for D2608-D2613. Not production code.

export type StorageOperationId = string & { readonly __storageOperationId: unique symbol };
const OPERATION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export function parseStorageOperationId(value: unknown): StorageOperationId {
  if (typeof value !== "string" || !OPERATION_ID.test(value)) throw new TypeError("STORAGE_OPERATION_ID_INVALID");
  return value as StorageOperationId;
}

export function generateStorageOperationId(bytes: Uint8Array): StorageOperationId {
  if (bytes.length !== 16) throw new TypeError("STORAGE_OPERATION_ENTROPY_INVALID");
  const copy = Uint8Array.from(bytes);
  copy[6] = (copy[6]! & 0x0f) | 0x40;
  copy[8] = (copy[8]! & 0x3f) | 0x80;
  const hex = [...copy].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return parseStorageOperationId(`${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`);
}

export interface LockFd {
  readonly fd: 3;
  readonly regularFile: boolean;
  readonly inode: string;
  readonly flockExclusiveNonblocking: "acquired_or_already_owned" | "would_block" | "error";
}

export function establishInheritedLockAuthority(fd: LockFd, configuredPathInode: string): Readonly<{ fd: 3; inode: string; authority: "fd_open_file_description" }> {
  if (!fd.regularFile || fd.inode !== configuredPathInode || fd.flockExclusiveNonblocking !== "acquired_or_already_owned") {
    throw new TypeError("LOCK_AUTHORITY_MISSING");
  }
  return Object.freeze({ fd: 3, inode: fd.inode, authority: "fd_open_file_description" });
}

export const BACKUP_PUBLICATION_STEPS = Object.freeze([
  "fsync_database",
  "fsync_manifest",
  "fsync_bundle_before_commit",
  "unlink_publishing_marker",
  "fsync_bundle_after_commit",
  "fsync_backup_root",
] as const);

export function assertPublicationOrder(steps: readonly string[]): void {
  if (steps.length !== BACKUP_PUBLICATION_STEPS.length || steps.some((step, index) => step !== BACKUP_PUBLICATION_STEPS[index])) {
    throw new TypeError("BACKUP_PUBLICATION_DURABILITY_INCOMPLETE");
  }
}

export type StorageCheck = "digest" | "integrity" | "foreign_keys" | "inventory" | "compatibility" | "migration_invariants" | "identity_retention" | "readiness";
export interface PassedStorageCheck<C extends StorageCheck = StorageCheck> { readonly operationId: StorageOperationId; readonly check: C; readonly passed: true; readonly operandDigest: string }
const passedChecks = new WeakSet<object>();

function pass<C extends StorageCheck>(operationId: StorageOperationId, check: C, operandDigest: string): PassedStorageCheck<C> {
  if (!/^sha256:[0-9a-f]{64}$/u.test(operandDigest)) throw new TypeError("STORAGE_CHECK_OPERAND_DIGEST_INVALID");
  const result = Object.freeze({ operationId, check, passed: true as const, operandDigest });
  passedChecks.add(result);
  return result;
}

export function checkDigest(operationId: StorageOperationId, expected: string, actual: string, operands: string): PassedStorageCheck<"digest"> {
  if (expected !== actual) throw new TypeError("DIGEST_MISMATCH");
  return pass(operationId, "digest", operands);
}
export function checkIntegrity(operationId: StorageOperationId, rows: readonly string[], operands: string): PassedStorageCheck<"integrity"> {
  if (rows.length !== 1 || rows[0] !== "ok") throw new TypeError("SQLITE_INTEGRITY_FAILED");
  return pass(operationId, "integrity", operands);
}
export function checkForeignKeys(operationId: StorageOperationId, rows: readonly unknown[], operands: string): PassedStorageCheck<"foreign_keys"> {
  if (rows.length !== 0) throw new TypeError("FOREIGN_KEY_VIOLATION");
  return pass(operationId, "foreign_keys", operands);
}
export function checkInventory(operationId: StorageOperationId, expected: readonly string[], actual: readonly string[], operands: string): PassedStorageCheck<"inventory"> {
  if (expected.length !== actual.length || expected.some((item, index) => item !== actual[index])) throw new TypeError("INVENTORY_MISMATCH");
  return pass(operationId, "inventory", operands);
}
export function checkCompatibility(operationId: StorageOperationId, source: number | null, target: number, allowed: readonly number[], operands: string): PassedStorageCheck<"compatibility"> {
  if (source !== null && source !== target && !allowed.includes(source)) throw new TypeError("STORAGE_INCOMPATIBLE");
  return pass(operationId, "compatibility", operands);
}
export function checkMigrationInvariants(operationId: StorageOperationId, results: readonly boolean[], operands: string): PassedStorageCheck<"migration_invariants"> {
  if (results.length === 0 || results.some((result) => !result)) throw new TypeError("MIGRATION_INVARIANT_FAILED");
  return pass(operationId, "migration_invariants", operands);
}
export function checkIdentityRetention(operationId: StorageOperationId, expected: readonly string[], actual: readonly string[], operands: string): PassedStorageCheck<"identity_retention"> {
  if (expected.length !== actual.length || expected.some((item, index) => item !== actual[index])) throw new TypeError("IDENTITY_RETENTION_FAILED");
  return pass(operationId, "identity_retention", operands);
}
export function checkReadiness(operationId: StorageOperationId, response: Readonly<{ status: number; body: string; storageVersion: number }>, expectedVersion: number, operands: string): PassedStorageCheck<"readiness"> {
  if (response.status !== 200 || response.body !== "ready" || response.storageVersion !== expectedVersion) throw new TypeError("READINESS_FAILED");
  return pass(operationId, "readiness", operands);
}

export function assertPassedStorageCheck(value: PassedStorageCheck, operationId: StorageOperationId): void {
  if (!passedChecks.has(value) || value.operationId !== operationId) throw new TypeError("STORAGE_CHECK_FORGED");
}

export const CHECK_TUPLES = Object.freeze({
  backup: ["digest", "integrity", "foreign_keys", "inventory", "compatibility"],
  verify: ["digest", "integrity", "foreign_keys", "inventory", "compatibility"],
  prepare_fresh: ["compatibility"],
  prepare_current: ["integrity", "foreign_keys", "inventory", "compatibility"],
  prepare_upgraded: ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants"],
  restore_current: ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention"],
  restore_upgraded: ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention"],
  rehearsal_current: ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention", "readiness"],
  rehearsal_upgraded: ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention", "readiness"],
} as const satisfies Readonly<Record<string, readonly StorageCheck[]>>);

export function compileChecks<K extends keyof typeof CHECK_TUPLES>(operationId: StorageOperationId, key: K, values: readonly PassedStorageCheck[]): (typeof CHECK_TUPLES)[K] {
  const expected = CHECK_TUPLES[key];
  if (values.length !== expected.length) throw new TypeError("STORAGE_CHECK_SET_MISMATCH");
  values.forEach((value, index) => {
    assertPassedStorageCheck(value, operationId);
    if (value.check !== expected[index]) throw new TypeError("STORAGE_CHECK_SET_MISMATCH");
  });
  return expected;
}

export type ReplacementMember = "main" | "wal" | "shm";
export type ReplacementJournal =
  | Readonly<{ phase: "prepared"; operationId: StorageOperationId; oldMembers: readonly ReplacementMember[] }>
  | Readonly<{ phase: "forward_quarantine"; operationId: StorageOperationId; oldMembers: readonly ReplacementMember[]; moved: readonly ReplacementMember[] }>
  | Readonly<{ phase: "forward_install"; operationId: StorageOperationId; oldMembers: readonly ReplacementMember[]; newInstalled: boolean }>
  | Readonly<{ phase: "forward_verify"; operationId: StorageOperationId; oldMembers: readonly ReplacementMember[] }>
  | Readonly<{ phase: "committed"; operationId: StorageOperationId }>
  | Readonly<{ phase: "rollback_quarantine_new"; operationId: StorageOperationId; oldMembers: readonly ReplacementMember[]; newMoved: boolean }>
  | Readonly<{ phase: "rollback_restore_old"; operationId: StorageOperationId; oldMembers: readonly ReplacementMember[]; restored: readonly ReplacementMember[] }>
  | Readonly<{ phase: "rollback_verify_old"; operationId: StorageOperationId; oldMembers: readonly ReplacementMember[] }>
  | Readonly<{ phase: "rolled_back"; operationId: StorageOperationId }>;

export interface ReplacementFsImage {
  readonly live: readonly ReplacementMember[];
  readonly quarantineOld: readonly ReplacementMember[];
  readonly quarantineNew: boolean;
  readonly stagedNew: boolean;
  readonly newMainLive: boolean;
}

const ordered = (members: readonly ReplacementMember[]): readonly ReplacementMember[] => Object.freeze(["main", "wal", "shm"].filter((member) => members.includes(member as ReplacementMember)) as ReplacementMember[]);

export function reconcileReplacement(journal: ReplacementJournal, fs: ReplacementFsImage): ReplacementJournal {
  const id = journal.operationId;
  if (journal.phase === "prepared") return Object.freeze({ phase: "forward_quarantine", operationId: id, oldMembers: ordered(journal.oldMembers), moved: ordered(fs.quarantineOld) });
  if (journal.phase === "forward_quarantine") {
    const moved = ordered(fs.quarantineOld);
    if (moved.length === journal.oldMembers.length) return Object.freeze({ phase: "forward_install", operationId: id, oldMembers: journal.oldMembers, newInstalled: fs.newMainLive });
    return Object.freeze({ ...journal, moved });
  }
  if (journal.phase === "forward_install") return fs.newMainLive ? Object.freeze({ phase: "forward_verify", operationId: id, oldMembers: journal.oldMembers }) : journal;
  if (journal.phase === "rollback_quarantine_new") return fs.quarantineNew ? Object.freeze({ phase: "rollback_restore_old", operationId: id, oldMembers: journal.oldMembers, restored: ordered(fs.live) }) : journal;
  if (journal.phase === "rollback_restore_old") {
    const restored = ordered(fs.live.filter((member) => journal.oldMembers.includes(member)));
    if (restored.length === journal.oldMembers.length) return Object.freeze({ phase: "rollback_verify_old", operationId: id, oldMembers: journal.oldMembers });
    return Object.freeze({ ...journal, restored });
  }
  return journal;
}

export function beginRollback(journal: ReplacementJournal): ReplacementJournal {
  if (journal.phase !== "forward_verify") throw new TypeError("ROLLBACK_NOT_ADMITTED");
  return Object.freeze({ phase: "rollback_quarantine_new", operationId: journal.operationId, oldMembers: journal.oldMembers, newMoved: false });
}

export function finishReplacementVerification(journal: ReplacementJournal, passed: boolean): ReplacementJournal {
  if (journal.phase === "forward_verify") return passed ? Object.freeze({ phase: "committed", operationId: journal.operationId }) : beginRollback(journal);
  if (journal.phase === "rollback_verify_old" && passed) return Object.freeze({ phase: "rolled_back", operationId: journal.operationId });
  throw new TypeError("REPLACEMENT_VERIFICATION_INVALID");
}
