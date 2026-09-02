// DISPOSABLE RFC author falsifier for D2460-D2464. This is not production code.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  assertInheritedLockAuthority,
  backupFailureDisposition,
  commitVerifiedReplacement,
  compileSuccessChecks,
  parseBackupId,
  parseStoragePathRef,
  recordPassedStorageCheck,
  requiredSuccessChecks,
  type StorageCheck,
  type SuccessShape,
} from "./model.js";

const VALID_ID = "20260831T120000.000Z-aabbccddeeff";
const rfc = readFileSync("rfc/storage-backup-recovery.md", "utf8");

describe("D2460-D2464 storage backup second author repair", () => {
  it("proves inherited lock ownership by independent same-inode contention", () => {
    expect(() => assertInheritedLockAuthority({ inheritedDescriptorMatchesConfiguredInode: true, independentSameInodeContention: "would_block" })).not.toThrow();
    expect(() => assertInheritedLockAuthority({ inheritedDescriptorMatchesConfiguredInode: true, independentSameInodeContention: "acquired" })).toThrow("LOCK_OWNERSHIP_UNPROVEN");
    expect(() => assertInheritedLockAuthority({ inheritedDescriptorMatchesConfiguredInode: false, independentSameInodeContention: "would_block" })).toThrow("LOCK_INODE_MISMATCH");
  });

  it("defines cleanup for work, reserved-unpublished and published states", () => {
    expect(backupFailureDisposition({ kind: "work", operationId: "op-1", ownerMarkerOperationId: "op-1" })).toBe("remove_owned_work");
    expect(backupFailureDisposition({ kind: "reserved_unpublished", operationId: "op-1", publishingMarkerOperationId: "op-1" })).toBe("retain_abandoned_reservation");
    expect(backupFailureDisposition({ kind: "published", backupId: parseBackupId(VALID_ID) })).toBe("preserve_published");
    expect(() => backupFailureDisposition({ kind: "work", operationId: "op-1", ownerMarkerOperationId: "other" })).toThrow("WORK_DIRECTORY_NOT_OWNED");
  });

  it("cannot commit verified before the installed inode and parent are durable", () => {
    const complete = { checksPassed: true, sqliteHandlesClosed: true, installedMainFsynced: true, liveParentFsynced: true, verifiedJournalPersisted: true };
    expect(commitVerifiedReplacement(complete).phase).toBe("verified");
    expect(() => commitVerifiedReplacement({ ...complete, installedMainFsynced: false })).toThrow("REPLACEMENT_NOT_DURABLE");
    expect(() => commitVerifiedReplacement({ ...complete, liveParentFsynced: false })).toThrow("REPLACEMENT_NOT_DURABLE");
  });

  it("parses the exact backup-id grammar and real UTC timestamp", () => {
    expect(parseBackupId(VALID_ID)).toBe(VALID_ID);
    for (const invalid of [
      "../../private",
      "20260831T120000.000Z-AABBCCDDEEFF",
      "20260231T120000.000Z-aabbccddeeff",
      "20260831T250000.000Z-aabbccddeeff",
      "20260831T120000Z-aabbccddeeff",
    ]) expect(() => parseBackupId(invalid)).toThrow();
    expect(parseStoragePathRef({ role: "bundle", identity: VALID_ID })).toEqual({ role: "bundle", identity: VALID_ID });
    expect(() => parseStoragePathRef({ role: "bundle", identity: "../bundle" })).toThrow("BACKUP_ID_GRAMMAR");
  });

  it.each([
    [{ operation: "backup" } as const, ["digest", "integrity", "foreign_keys", "inventory", "compatibility"]],
    [{ operation: "verify" } as const, ["digest", "integrity", "foreign_keys", "inventory", "compatibility"]],
    [{ operation: "prepare_start", action: "fresh" } as const, ["inventory", "compatibility", "readiness"]],
    [{ operation: "prepare_start", action: "current" } as const, ["integrity", "foreign_keys", "inventory", "compatibility", "readiness"]],
    [{ operation: "prepare_start", action: "upgraded" } as const, ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "readiness"]],
    [{ operation: "restore", migration: "not_required" } as const, ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention"]],
    [{ operation: "restore", migration: "applied" } as const, ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention"]],
    [{ operation: "rehearsal", migration: "not_required" } as const, ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "identity_retention", "readiness"]],
    [{ operation: "rehearsal", migration: "applied" } as const, ["digest", "integrity", "foreign_keys", "inventory", "compatibility", "migration_invariants", "identity_retention", "readiness"]],
  ])("derives the complete ordered checks for %o", (shape, checks) => {
    const operationId = "op-complete";
    const results = (checks as StorageCheck[]).map((check) => recordPassedStorageCheck(operationId, check));
    expect(compileSuccessChecks(operationId, shape as SuccessShape, results)).toEqual(checks);
  });

  it("rejects empty, missing, duplicate, irrelevant, wrong-operation and forged checks", () => {
    const operationId = "op-backup";
    const shape = { operation: "backup" } as const;
    const required = requiredSuccessChecks(shape);
    const sealed = required.map((check) => recordPassedStorageCheck(operationId, check));
    expect(() => compileSuccessChecks(operationId, shape, [])).toThrow("INCOMPLETE_OR_IRRELEVANT_SUCCESS_CHECKS");
    expect(() => compileSuccessChecks(operationId, shape, sealed.slice(1))).toThrow("INCOMPLETE_OR_IRRELEVANT_SUCCESS_CHECKS");
    expect(() => compileSuccessChecks(operationId, shape, [...sealed, sealed[0]!])).toThrow("DUPLICATE_SUCCESS_CHECK");
    const irrelevant = recordPassedStorageCheck(operationId, "readiness");
    expect(() => compileSuccessChecks(operationId, shape, [...sealed.slice(0, -1), irrelevant])).toThrow("INCOMPLETE_OR_IRRELEVANT_SUCCESS_CHECKS");
    const wrongOperation = required.map((check) => recordPassedStorageCheck("op-other", check));
    expect(() => compileSuccessChecks(operationId, shape, wrongOperation)).toThrow("UNSEALED_OR_WRONG_OPERATION_CHECK");
    const forged = required.map((check) => ({ operationId, check, passed: true })) as never;
    expect(() => compileSuccessChecks(operationId, shape, forged)).toThrow("UNSEALED_OR_WRONG_OPERATION_CHECK");
  });

  it("binds the repaired model to the normative RFC and keeps implementation gated", () => {
    expect(rfc).toMatch(/independently opened same-inode FD[\s\S]*contends/u);
    expect(rfc).toMatch(/no `verified` byte may be persisted until both the[\s\S]*installed main inode and live parent directory are durable/iu);
    expect(rfc).toMatch(/function parseBackupId\(value: unknown\): BackupId/u);
    expect(rfc).toMatch(/runtime-sealed[\s\S]*rejects an empty,[\s\S]*duplicate,[\s\S]*differently operation-bound result/u);
    expect(rfc).toMatch(/another genuinely fresh independent review remains mandatory/u);
  });
});
