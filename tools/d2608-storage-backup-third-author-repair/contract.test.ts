import { describe, expect, it } from "vitest";
import {
  BACKUP_PUBLICATION_STEPS,
  CHECK_TUPLES,
  assertPassedStorageCheck,
  assertPublicationOrder,
  beginRollback,
  checkCompatibility,
  checkDigest,
  checkForeignKeys,
  checkIdentityRetention,
  checkIntegrity,
  checkInventory,
  checkMigrationInvariants,
  checkReadiness,
  compileChecks,
  establishInheritedLockAuthority,
  finishReplacementVerification,
  generateStorageOperationId,
  parseStorageOperationId,
  reconcileReplacement,
  type PassedStorageCheck,
  type ReplacementFsImage,
  type ReplacementJournal,
} from "./contract.js";

const digest = `sha256:${"a".repeat(64)}`;
const op = generateStorageOperationId(Uint8Array.from({ length: 16 }, (_, index) => index));

describe("storage backup third author repair", () => {
  it("D2608 establishes authority on inherited FD 3 rather than attributing a foreign lock", () => {
    expect(establishInheritedLockAuthority({ fd: 3, regularFile: true, inode: "i", flockExclusiveNonblocking: "acquired_or_already_owned" }, "i")).toMatchObject({ authority: "fd_open_file_description" });
    expect(() => establishInheritedLockAuthority({ fd: 3, regularFile: true, inode: "i", flockExclusiveNonblocking: "would_block" }, "i")).toThrow(/LOCK_AUTHORITY/);
    expect(() => establishInheritedLockAuthority({ fd: 3, regularFile: true, inode: "foreign", flockExclusiveNonblocking: "acquired_or_already_owned" }, "i")).toThrow(/LOCK_AUTHORITY/);
  });

  it("D2609 commits marker removal by fsyncing its bundle directory before the root", () => {
    expect(() => assertPublicationOrder(BACKUP_PUBLICATION_STEPS)).not.toThrow();
    expect(() => assertPublicationOrder(BACKUP_PUBLICATION_STEPS.filter((step) => step !== "fsync_bundle_after_commit"))).toThrow(/DURABILITY/);
    expect(() => assertPublicationOrder([...BACKUP_PUBLICATION_STEPS.slice(0, 4), "fsync_backup_root", "fsync_bundle_after_commit"])).toThrow(/DURABILITY/);
  });

  it("D2610 gives prepare only observable storage checks and readiness only to rehearsal", () => {
    expect(CHECK_TUPLES.prepare_fresh).toEqual(["compatibility"]);
    expect(CHECK_TUPLES.prepare_current).not.toContain("readiness");
    expect(CHECK_TUPLES.prepare_upgraded).not.toContain("readiness");
    expect(CHECK_TUPLES.rehearsal_current).toContain("readiness");
    expect(CHECK_TUPLES.rehearsal_upgraded).toContain("readiness");
  });

  it("D2611 seals only results of exact operand-validating check operations", () => {
    const values = [
      checkDigest(op, "x", "x", digest),
      checkIntegrity(op, ["ok"], digest),
      checkForeignKeys(op, [], digest),
      checkInventory(op, ["a"], ["a"], digest),
      checkCompatibility(op, 25, 25, [], digest),
    ];
    expect(compileChecks(op, "backup", values)).toEqual(CHECK_TUPLES.backup);
    expect(() => checkDigest(op, "x", "y", digest)).toThrow(/DIGEST/);
    expect(() => checkIntegrity(op, ["not ok"], digest)).toThrow(/INTEGRITY/);
    expect(() => checkForeignKeys(op, [{}], digest)).toThrow(/FOREIGN/);
    expect(() => checkInventory(op, ["a"], ["b"], digest)).toThrow(/INVENTORY/);
    expect(() => checkCompatibility(op, 1, 25, [24], digest)).toThrow(/INCOMPATIBLE/);
    const forged = { operationId: op, check: "digest", passed: true, operandDigest: digest } as PassedStorageCheck;
    expect(() => assertPassedStorageCheck(forged, op)).toThrow(/FORGED/);
    const migration = checkMigrationInvariants(op, [true], digest);
    const identities = checkIdentityRetention(op, ["r"], ["r"], digest);
    const ready = checkReadiness(op, { status: 200, body: "ready", storageVersion: 25 }, 25, digest);
    expect(() => assertPassedStorageCheck(migration, op)).not.toThrow();
    expect(() => assertPassedStorageCheck(identities, op)).not.toThrow();
    expect(() => assertPassedStorageCheck(ready, op)).not.toThrow();
  });

  it("D2612 parses/generates canonical operation ids and rejects invalid ownership bytes", () => {
    expect(parseStorageOperationId(op)).toBe(op);
    expect(op).toMatch(/^[0-9a-f-]{36}$/u);
    for (const value of ["", "backup-1", "../x", op.toUpperCase(), `${op}:other`, "00000000-0000-0000-0000-000000000000"]) {
      expect(() => parseStorageOperationId(value)).toThrow(/OPERATION_ID/);
    }
    expect(() => generateStorageOperationId(new Uint8Array(15))).toThrow(/ENTROPY/);
  });

  it("D2613 reconciles every forward and rollback member mutation after a crash", () => {
    const old = ["main", "wal", "shm"] as const;
    let journal: ReplacementJournal = { phase: "prepared", operationId: op, oldMembers: old };
    const image = (patch: Partial<ReplacementFsImage>): ReplacementFsImage => ({ live: old, quarantineOld: [], quarantineNew: false, stagedNew: true, newMainLive: false, ...patch });
    journal = reconcileReplacement(journal, image({}));
    expect(journal).toMatchObject({ phase: "forward_quarantine", moved: [] });
    for (let count = 1; count <= old.length; count += 1) {
      journal = reconcileReplacement(journal, image({ live: old.slice(count), quarantineOld: old.slice(0, count) }));
      expect(journal.phase === "forward_quarantine" ? journal.moved : old).toEqual(old.slice(0, count));
    }
    expect(journal.phase).toBe("forward_install");
    journal = reconcileReplacement(journal, image({ live: [], quarantineOld: old, newMainLive: true, stagedNew: false }));
    expect(journal.phase).toBe("forward_verify");
    journal = beginRollback(journal);
    journal = reconcileReplacement(journal, image({ live: [], quarantineOld: old, quarantineNew: true, newMainLive: false }));
    expect(journal.phase).toBe("rollback_restore_old");
    for (let count = 1; count <= old.length; count += 1) {
      journal = reconcileReplacement(journal, image({ live: old.slice(0, count), quarantineOld: old.slice(count), quarantineNew: true }));
    }
    expect(journal.phase).toBe("rollback_verify_old");
    expect(finishReplacementVerification(journal, true)).toMatchObject({ phase: "rolled_back", operationId: op });
  });
});
