// DISPOSABLE third fresh independent buildability review — D2608-D2613.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  assertInheritedLockAuthority,
  compileSuccessChecks,
  recordPassedStorageCheck,
  requiredSuccessChecks,
} from "../d2460-storage-backup-second-author-repair/model.js";

const rfc = readFileSync("rfc/storage-backup-recovery.md", "utf8");
const model = readFileSync("tools/d2460-storage-backup-second-author-repair/model.ts", "utf8");

describe("D2608-D2613 storage backup third fresh review", () => {
  it("D2608 cannot attribute EWOULDBLOCK to the inherited open description", () => {
    // These two real states collapse to the same input:
    // A) inherited FD owns the lock; B) a foreign process owns it and FD 3 is merely same-inode.
    const collapsedObservation = {
      inheritedDescriptorMatchesConfiguredInode: true,
      independentSameInodeContention: "would_block" as const,
    };
    expect(() => assertInheritedLockAuthority(collapsedObservation)).not.toThrow();
    expect(model).not.toMatch(/inherited(?:OpenFileDescription|LockOwner)(?:Id|Token|Receipt)/u);
  });

  it("D2609 removes the publication marker without fsyncing its directory afterward", () => {
    expect(rfc).toMatch(/unlink(?:s)? `.publishing` and fsyncs the backup root/u);
    expect(rfc).not.toMatch(/unlink(?:s)? `.publishing`[\s\S]{0,180}fsync(?:s)? the (?:reserved|bundle|final) directory/u);
  });

  it("D2610 requires readiness before main and healthz can exist", () => {
    expect(rfc).toMatch(/PrepareFreshChecks = readonly \["inventory", "compatibility", "readiness"\]/u);
    expect(rfc).toMatch(/waits for a successful receipt and exit,[\s\S]{0,160}then replaces itself with `node apps\/server\/dist\/main\.js`/u);
    expect(rfc).toMatch(/`\/healthz` is not reachable until `prepare-start` succeeds/u);
  });

  it("D2611 exports a generic semantic pass minter", () => {
    const operationId = "caller-invented";
    const shape = { operation: "backup" } as const;
    const invented = requiredSuccessChecks(shape).map((check) => recordPassedStorageCheck(operationId, check));
    expect(compileSuccessChecks(operationId, shape, invented)).toEqual([
      "digest", "integrity", "foreign_keys", "inventory", "compatibility",
    ]);
    expect(model).toMatch(/export function recordPassedStorageCheck/u);
  });

  it("D2612 accepts a non-UUID operation identity as sealed authority", () => {
    const result = recordPassedStorageCheck("not/a/uuid\0or-operation", "digest");
    expect(result.operationId).toBe("not/a/uuid\0or-operation");
    expect(rfc).toMatch(/readonly operationId: string;\s+\/\/ canonical UUID/u);
  });

  it("D2613 has no durable rollback-in-progress state for multi-mutation recovery", () => {
    expect(rfc).toMatch(/`prepared`,\s*`old_quarantined`, and `new_installed` deterministically roll back/u);
    expect(rfc).toMatch(/matches neither the recorded old nor staged state[\s\S]{0,100}`REPLACEMENT_RECOVERY_REQUIRED`/u);
    expect(rfc).not.toMatch(/`roll(?:ing)?_back(?:_[a-z_]+)?`/u);
  });
});
