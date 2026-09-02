import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/storage-backup-recovery.md", "utf8");

test("D2210: one supervisor owns one inherited open-file description", () => {
  assert.match(rfc, /`storage-supervisor` is the only process allowed to acquire the storage lock/);
  assert.match(rfc, /opens[\s\S]*?`\/data\/\.tabiya-storage\.lock` as FD 3 without `O_CLOEXEC`/);
  assert.match(rfc, /same open-file description exists before inspection,[\s\S]*before HTTP open,[\s\S]*HTTP lifetime/);
  assert.match(rfc, /independently opened same-inode FD[\s\S]*contends/);
  assert.match(rfc, /Children never release or reacquire[\s\S]*the inherited lock/);
  assert.match(rfc, /normative ownership sequence is `exec 3>>lock-path`, `flock -n 3`/);
});

test("D2210: the lock contract crosses every preflight to HTTP boundary", () => {
  assert.match(rfc, /before preflight, during backup\/migration, after staged installation but before[\s\S]*HTTP open, during HTTP service, and after owner death/);
  assert.match(rfc, /storage-supervisor serve[^\n]*node apps\/server\/dist\/main\.js/);
});

test("D2211: upgrade and restore share the exact SQLite-triplet installer", () => {
  assert.match(rfc, /Upgrade and restore install bytes through one `replaceSqliteTriplet` primitive/);
  assert.match(rfc, /target set is exactly `<live>`, `<live>-wal`, and[\s\S]*`<live>-shm`/);
  assert.equal((rfc.match(/invokes? `replaceSqliteTriplet`/g) ?? []).length, 2);
});

test("D2211: crash recovery refuses mixed main WAL and SHM generations", () => {
  assert.match(rfc, /crashes at every rename,[\s\S]*directory-fsync boundary/);
  assert.match(rfc, /committed rows resident in[\s\S]*WAL and a pre-existing SHM/);
  assert.match(rfc, /exact old triplet or the fully verified[\s\S]*new standalone database, never a mixed set/);
});

test("D2212: backup identity has one domain-separated recomputable image", () => {
  assert.match(rfc, /tabiya-storage-backup-id-v1\\0/);
  assert.match(rfc, /backupId\s+= basic\(createdAt\) \+ "-" \+ firstLowerHex\(SHA256\(digestImage\), 12\)/);
  assert.match(rfc, /Verification recomputes `backupId`/);
});

test("D2212: legacy-partial and final collisions never overwrite and retry is bounded", () => {
  assert.match(rfc, /Either an existing legacy partial path or final path is a collision/);
  assert.match(rfc, /neither is opened, removed,[\s\S]*renamed, or overwritten/);
  assert.match(rfc, /before retrying reservation, at most 16 times/);
  assert.match(rfc, /atomically unlinks `.publishing`/);
  assert.match(rfc, /unlink is the validity commit/);
});

test("D2213: one versioned discriminated receipt binds all five operations", () => {
  assert.match(rfc, /type StorageAdminReceiptV1 = StorageReceiptBaseV1 &/);
  for (const operation of ["backup", "verify", "prepare_start", "restore", "rehearsal"]) {
    assert.match(rfc, new RegExp(`operation: "${operation}"; readonly result: "succeeded"`));
  }
});

test("D2213: stdout grammar and exit mapping are closed", () => {
  assert.match(rfc, /exactly one canonical JSON value followed[\s\S]*by one newline and no other stdout bytes/);
  assert.match(rfc, /Unknown receipt versions\/fields, more than one JSON value,[\s\S]*protocol failures/);
  assert.match(rfc, /`0` for `succeeded`; `2` for `refused`; `3` for every declared `failed`/);
  assert.match(rfc, /`4` only for `INTERNAL_ERROR`/);
});
