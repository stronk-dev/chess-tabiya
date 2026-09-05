// DISPOSABLE author contract for D2724-D2729. Not production code.
import { createHash } from "node:crypto";

export type Sha256 = string & { readonly __sha256: unique symbol };
export type StorageOperationId = string & { readonly __storageOperationId: unique symbol };
export type ApplicationRevision = string & { readonly __applicationRevision: unique symbol };

export function parseSha256(value: unknown): Sha256 {
  if (typeof value !== "string" || !/^sha256:[0-9a-f]{64}$/u.test(value)) throw new TypeError("SHA256_INVALID");
  return value as Sha256;
}

const hash = (bytes: string | Uint8Array): Sha256 => parseSha256(`sha256:${createHash("sha256").update(bytes).digest("hex")}`);

export function parseStorageOperationId(value: unknown): StorageOperationId {
  if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)) {
    throw new TypeError("STORAGE_OPERATION_ID_INVALID");
  }
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

export function parseApplicationRevision(value: unknown): ApplicationRevision {
  if (typeof value !== "string" || !/^(?:[0-9a-f]{40}|dev\+(?:[0-9a-f]{40}|dirty))$/u.test(value)) {
    throw new TypeError("APPLICATION_REVISION_INVALID");
  }
  return value as ApplicationRevision;
}

export function releaseRecoveryEligible(revision: ApplicationRevision): boolean {
  return /^[0-9a-f]{40}$/u.test(revision);
}

export type CheckShape =
  | "backup" | "verify" | "prepare_fresh" | "prepare_current" | "prepare_upgraded"
  | "restore_current" | "restore_upgraded" | "rehearsal_current" | "rehearsal_upgraded";
export type StorageCheck = "digest" | "integrity" | "foreign_keys" | "inventory" | "compatibility" | "migration_invariants" | "identity_retention" | "readiness";

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
} as const satisfies Readonly<Record<CheckShape, readonly StorageCheck[]>>);

export interface CheckSubject {
  readonly operationId: StorageOperationId;
  readonly shape: CheckShape;
  readonly storageDigest: Sha256;
  readonly sourceVersion: number | null;
}
const subjects = new WeakSet<object>();
const passedChecks = new WeakSet<object>();

function subject(operationId: StorageOperationId, shape: CheckShape, bytes: Uint8Array, sourceVersion: number | null): CheckSubject {
  if (sourceVersion !== null && (!Number.isSafeInteger(sourceVersion) || sourceVersion < 1)) throw new TypeError("SOURCE_VERSION_INVALID");
  const result = Object.freeze({ operationId, shape, storageDigest: hash(Uint8Array.from(bytes)), sourceVersion });
  subjects.add(result);
  return result;
}

export const inspectBackupSubject = (operationId: StorageOperationId, bytes: Uint8Array, sourceVersion: number): CheckSubject => subject(operationId, "backup", bytes, sourceVersion);
export const inspectPrepareFreshSubject = (operationId: StorageOperationId): CheckSubject => subject(operationId, "prepare_fresh", new Uint8Array(), null);

export interface PassedStorageCheck<C extends StorageCheck = StorageCheck> {
  readonly subject: CheckSubject;
  readonly check: C;
  readonly passed: true;
}

function pass<C extends StorageCheck>(subjectValue: CheckSubject, check: C): PassedStorageCheck<C> {
  if (!subjects.has(subjectValue)) throw new TypeError("STORAGE_SUBJECT_FORGED");
  const result = Object.freeze({ subject: subjectValue, check, passed: true as const });
  passedChecks.add(result);
  return result;
}

export function checkDigest(subjectValue: CheckSubject, expected: Sha256, actualBytes: Uint8Array): PassedStorageCheck<"digest"> {
  if (hash(actualBytes) !== expected || subjectValue.storageDigest !== expected) throw new TypeError("DIGEST_MISMATCH");
  return pass(subjectValue, "digest");
}
export function checkIntegrity(subjectValue: CheckSubject, rows: readonly string[]): PassedStorageCheck<"integrity"> {
  if (rows.length !== 1 || rows[0] !== "ok") throw new TypeError("SQLITE_INTEGRITY_FAILED");
  return pass(subjectValue, "integrity");
}
export function checkForeignKeys(subjectValue: CheckSubject, rows: readonly unknown[]): PassedStorageCheck<"foreign_keys"> {
  if (rows.length !== 0) throw new TypeError("FOREIGN_KEY_VIOLATION");
  return pass(subjectValue, "foreign_keys");
}
export function checkInventory(subjectValue: CheckSubject, expected: readonly string[], actual: readonly string[]): PassedStorageCheck<"inventory"> {
  if (expected.length !== actual.length || expected.some((value, index) => value !== actual[index])) throw new TypeError("INVENTORY_MISMATCH");
  return pass(subjectValue, "inventory");
}
export function checkCompatibility(subjectValue: CheckSubject, target: number, upgradesFrom: readonly number[]): PassedStorageCheck<"compatibility"> {
  if (!Number.isSafeInteger(target) || target < 1) throw new TypeError("STORAGE_TARGET_INVALID");
  if (subjectValue.sourceVersion === null) {
    if (subjectValue.shape !== "prepare_fresh") throw new TypeError("NULL_SOURCE_SHAPE_INVALID");
  } else if (subjectValue.sourceVersion !== target && !upgradesFrom.includes(subjectValue.sourceVersion)) {
    throw new TypeError("STORAGE_INCOMPATIBLE");
  }
  return pass(subjectValue, "compatibility");
}

export function compileChecks<K extends CheckShape>(subjectValue: CheckSubject, shape: K, values: readonly PassedStorageCheck[]): (typeof CHECK_TUPLES)[K] {
  if (!subjects.has(subjectValue) || subjectValue.shape !== shape) throw new TypeError("STORAGE_CHECK_SHAPE_MISMATCH");
  const expected = CHECK_TUPLES[shape];
  if (values.length !== expected.length) throw new TypeError("STORAGE_CHECK_SET_MISMATCH");
  values.forEach((value, index) => {
    if (!passedChecks.has(value) || value.subject !== subjectValue || value.check !== expected[index]) throw new TypeError("STORAGE_CHECK_SUBJECT_MISMATCH");
  });
  return expected;
}

export type ReplacementMember = "main" | "wal" | "shm";
export interface MemberImage { readonly member: ReplacementMember; readonly digest: Sha256 }
export interface ReplacementFsImage {
  readonly live: readonly MemberImage[];
  readonly quarantineOld: readonly MemberImage[];
  readonly quarantineNew: Sha256 | null;
  readonly stagedNew: Sha256 | null;
}
interface JournalBase {
  readonly operationId: StorageOperationId;
  readonly generation: number;
  readonly targetBasename: string;
  readonly oldMembers: readonly MemberImage[];
  readonly stagedDigest: Sha256;
}
export type ReplacementJournal = JournalBase & (
  | Readonly<{ phase: "prepared" }>
  | Readonly<{ phase: "forward_quarantine"; moved: readonly ReplacementMember[] }>
  | Readonly<{ phase: "forward_install"; newInstalled: boolean }>
  | Readonly<{ phase: "forward_verify" }>
  | Readonly<{ phase: "rollback_quarantine_new"; newMoved: boolean }>
  | Readonly<{ phase: "rollback_restore_old"; restored: readonly ReplacementMember[] }>
  | Readonly<{ phase: "rollback_verify_old" }>
  | Readonly<{ phase: "verified" }>
  | Readonly<{ phase: "rolled_back" }>
);

const memberOrder: readonly ReplacementMember[] = ["main", "wal", "shm"];
function exactMap(images: readonly MemberImage[]): Map<ReplacementMember, Sha256> {
  const result = new Map<ReplacementMember, Sha256>();
  for (const image of images) {
    if (result.has(image.member)) throw new TypeError("REPLACEMENT_DUPLICATE_MEMBER");
    result.set(image.member, parseSha256(image.digest));
  }
  return result;
}

function reconcileOld(base: JournalBase, phase: ReplacementJournal["phase"], fs: ReplacementFsImage): readonly ReplacementMember[] {
  const expected = exactMap(base.oldMembers);
  const live = exactMap(fs.live);
  const quarantine = exactMap(fs.quarantineOld);
  for (const member of memberOrder) {
    const wanted = expected.get(member);
    const liveDigest = live.get(member);
    const quarantineDigest = quarantine.get(member);
    if (wanted === undefined) {
      if (liveDigest !== undefined || quarantineDigest !== undefined) throw new TypeError("REPLACEMENT_UNEXPECTED_MEMBER");
      continue;
    }
    const pending = liveDigest === wanted && quarantineDigest === undefined;
    const newMainMayBeLive = member === "main"
      && (phase === "forward_install" || phase === "forward_verify" || phase === "rollback_quarantine_new")
      && liveDigest === base.stagedDigest;
    const moved = (liveDigest === undefined || newMainMayBeLive) && quarantineDigest === wanted;
    if (!pending && !moved) throw new TypeError("REPLACEMENT_DIGEST_MISMATCH");
  }
  return Object.freeze(memberOrder.filter((member) => expected.has(member) && quarantine.get(member) === expected.get(member)));
}

export function reconcileReplacement(journal: ReplacementJournal, fs: ReplacementFsImage): ReplacementJournal {
  const moved = reconcileOld(journal, journal.phase, fs);
  const base: JournalBase = { operationId: journal.operationId, generation: journal.generation, targetBasename: journal.targetBasename, oldMembers: journal.oldMembers, stagedDigest: journal.stagedDigest };
  if (journal.phase === "prepared") return Object.freeze({ ...base, phase: "forward_quarantine", moved });
  if (journal.phase === "forward_quarantine") {
    if (moved.length === journal.oldMembers.length) return Object.freeze({ ...base, phase: "forward_install", newInstalled: false });
    return Object.freeze({ ...base, phase: "forward_quarantine", moved });
  }
  if (journal.phase === "forward_install") {
    const live = exactMap(fs.live);
    const installed = live.get("main") === journal.stagedDigest && fs.stagedNew === null;
    const pending = live.size === 0 && fs.stagedNew === journal.stagedDigest;
    if (!installed && !pending) throw new TypeError("REPLACEMENT_STAGED_DIGEST_MISMATCH");
    return installed ? Object.freeze({ ...base, phase: "forward_verify" }) : journal;
  }
  if (journal.phase === "rollback_quarantine_new") {
    const live = exactMap(fs.live);
    const pending = live.get("main") === journal.stagedDigest && fs.quarantineNew === null;
    const movedNew = live.size === 0 && fs.quarantineNew === journal.stagedDigest;
    if (!pending && !movedNew) throw new TypeError("REPLACEMENT_FAILED_NEW_MISMATCH");
    return movedNew ? Object.freeze({ ...base, phase: "rollback_restore_old", restored: [] }) : journal;
  }
  if (journal.phase === "rollback_restore_old") {
    if (moved.length === 0) return Object.freeze({ ...base, phase: "rollback_verify_old" });
    const expected = exactMap(journal.oldMembers);
    const live = exactMap(fs.live);
    return Object.freeze({ ...base, phase: "rollback_restore_old", restored: Object.freeze(memberOrder.filter((member) => expected.has(member) && live.get(member) === expected.get(member))) });
  }
  return journal;
}

export const REPLACEMENT_DIRECTORY = ".tabiya-replacement" as const;
export const JOURNAL_PUBLICATION_STEPS = Object.freeze([
  "write_temp_exclusive",
  "fsync_temp",
  "rename_temp_over_journal",
  "fsync_transaction_directory",
] as const);

export function assertJournalPublication(steps: readonly string[]): void {
  if (steps.length !== JOURNAL_PUBLICATION_STEPS.length || steps.some((step, index) => step !== JOURNAL_PUBLICATION_STEPS[index])) {
    throw new TypeError("JOURNAL_PUBLICATION_NOT_DURABLE");
  }
}

export type ReplacementDiscovery =
  | Readonly<{ kind: "none" }>
  | Readonly<{ kind: "abandoned_before_mutation" }>
  | Readonly<{ kind: "recover"; journal: ReplacementJournal }>;

const phases = new Set(["prepared", "forward_quarantine", "forward_install", "forward_verify", "rollback_quarantine_new", "rollback_restore_old", "rollback_verify_old", "verified", "rolled_back"]);
const exactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
};
const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const parseMemberNames = (value: unknown): readonly ReplacementMember[] => {
  if (!Array.isArray(value) || value.some((member) => !memberOrder.includes(member as ReplacementMember))) throw new TypeError("REPLACEMENT_MEMBER_LIST_INVALID");
  const names = value as ReplacementMember[];
  if (new Set(names).size !== names.length || names.some((member, index) => memberOrder.indexOf(member) <= (index === 0 ? -1 : memberOrder.indexOf(names[index - 1]!)))) throw new TypeError("REPLACEMENT_MEMBER_LIST_INVALID");
  return Object.freeze([...names]);
};

export function serializeReplacementJournal(journal: ReplacementJournal): string {
  return canonicalJson(journal);
}

export function parseReplacementJournal(bytes: unknown): ReplacementJournal {
  if (typeof bytes !== "string") throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
  let raw: unknown;
  try { raw = JSON.parse(bytes); } catch { throw new TypeError("REPLACEMENT_JOURNAL_INVALID"); }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
  const value = raw as Record<string, unknown>;
  if (typeof value.phase !== "string" || !phases.has(value.phase)) throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
  const phaseFields = value.phase === "forward_quarantine" ? ["moved"]
    : value.phase === "forward_install" ? ["newInstalled"]
    : value.phase === "rollback_quarantine_new" ? ["newMoved"]
    : value.phase === "rollback_restore_old" ? ["restored"] : [];
  if (!exactKeys(value, ["generation", "oldMembers", "operationId", "phase", "stagedDigest", "targetBasename", ...phaseFields])) throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
  if (!Number.isSafeInteger(value.generation) || Number(value.generation) < 0 || typeof value.targetBasename !== "string" || !/^[A-Za-z0-9._-]+\.sqlite$/u.test(value.targetBasename)) throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
  if (!Array.isArray(value.oldMembers)) throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
  const oldMembers = value.oldMembers.map((entry) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry) || !exactKeys(entry as Record<string, unknown>, ["digest", "member"])) throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
    const item = entry as Record<string, unknown>;
    if (!memberOrder.includes(item.member as ReplacementMember)) throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
    return Object.freeze({ member: item.member as ReplacementMember, digest: parseSha256(item.digest) });
  });
  exactMap(oldMembers);
  if (oldMembers.some((entry, index) => memberOrder.indexOf(entry.member) <= (index === 0 ? -1 : memberOrder.indexOf(oldMembers[index - 1]!.member)))) throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
  const base = Object.freeze({ operationId: parseStorageOperationId(value.operationId), generation: Number(value.generation), targetBasename: value.targetBasename, oldMembers: Object.freeze(oldMembers), stagedDigest: parseSha256(value.stagedDigest) });
  let result: ReplacementJournal;
  if (value.phase === "forward_quarantine") result = Object.freeze({ ...base, phase: value.phase, moved: parseMemberNames(value.moved) });
  else if (value.phase === "forward_install") {
    if (typeof value.newInstalled !== "boolean") throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
    result = Object.freeze({ ...base, phase: value.phase, newInstalled: value.newInstalled });
  } else if (value.phase === "rollback_quarantine_new") {
    if (typeof value.newMoved !== "boolean") throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
    result = Object.freeze({ ...base, phase: value.phase, newMoved: value.newMoved });
  } else if (value.phase === "rollback_restore_old") result = Object.freeze({ ...base, phase: value.phase, restored: parseMemberNames(value.restored) });
  else result = Object.freeze({ ...base, phase: value.phase } as ReplacementJournal);
  if (bytes !== serializeReplacementJournal(result)) throw new TypeError("REPLACEMENT_JOURNAL_NONCANONICAL");
  return result;
}

export function discoverReplacement(input: Readonly<{ directoryNames: readonly string[]; entries: readonly string[]; journalBytes?: string }>): ReplacementDiscovery {
  const candidates = input.directoryNames.filter((name) => name.startsWith(".tabiya-replacement"));
  if (candidates.length === 0) return Object.freeze({ kind: "none" });
  if (candidates.length !== 1 || candidates[0] !== REPLACEMENT_DIRECTORY) throw new TypeError("REPLACEMENT_DISCOVERY_AMBIGUOUS");
  if (input.entries.length === 0) return Object.freeze({ kind: "abandoned_before_mutation" });
  const allowed = input.entries.length === 1 && input.entries[0] === "journal.json"
    || input.entries.length === 2 && input.entries[0] === "journal.json" && input.entries[1] === "journal.tmp";
  if (!allowed || input.journalBytes === undefined) throw new TypeError("REPLACEMENT_JOURNAL_INVALID");
  return Object.freeze({ kind: "recover", journal: parseReplacementJournal(input.journalBytes) });
}

export interface ReadyResponse {
  readonly representativeData: "ok";
  readonly status: "ready";
  readonly storageVersion: number;
}
export function serializeReadyResponse(value: ReadyResponse): string {
  return JSON.stringify({ representativeData: value.representativeData, status: value.status, storageVersion: value.storageVersion });
}
export function parseReadyResponse(statusCode: number, bytes: string, expectedVersion: number): ReadyResponse {
  if (statusCode !== 200) throw new TypeError("READINESS_HTTP_FAILED");
  const parsed = JSON.parse(bytes) as Partial<ReadyResponse>;
  if (parsed.representativeData !== "ok" || parsed.status !== "ready" || parsed.storageVersion !== expectedVersion || !Number.isSafeInteger(parsed.storageVersion)) {
    throw new TypeError("READINESS_BODY_INVALID");
  }
  const result = Object.freeze({ representativeData: "ok" as const, status: "ready" as const, storageVersion: parsed.storageVersion });
  if (bytes !== serializeReadyResponse(result)) throw new TypeError("READINESS_BODY_NONCANONICAL");
  return result;
}
