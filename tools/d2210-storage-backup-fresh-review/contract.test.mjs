import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/storage-backup-recovery.md", "utf8");

test("D2210: wrapper lifetime and prepare-start both own the lock while entrypoint shows no handoff", () => {
  const locking = rfc.match(/### 1\. Storage paths and quiescence[\s\S]*?### 2\. Closed backup bundle v1/)?.[0] ?? "";
  const startup = rfc.match(/### 6\. Production startup[\s\S]*?### 7\. Restore/)?.[0] ?? "";
  assert.match(locking, /server wrapper holds it for the complete `prepare-start` \+ HTTP-process lifetime/);
  assert.match(startup, /For an upgradeable version it:[\s\S]*?acquires the storage lock/);
  assert.match(startup, /storage-admin prepare-start[^\n]*\nnode apps\/server\/dist\/main\.js/);
  assert.doesNotMatch(`${locking}\n${startup}`, /LOCK_FD|inherited lock|open-file description/);
});

test("D2211: restore quarantines SQLite sidecars but staged upgrade does not", () => {
  const upgrade = rfc.match(/### 6\. Production startup[\s\S]*?### 7\. Restore/)?.[0] ?? "";
  const restore = rfc.match(/### 7\. Restore[\s\S]*?### 8\. Operator surfaces/)?.[0] ?? "";
  assert.doesNotMatch(upgrade, /-wal|WAL\/SHM|quarantin/);
  assert.match(restore, /`-wal`\/`-shm` files are\s+quarantined/);
});

test("D2212: backup-id promises digest characters without a digest image or collision contract", () => {
  const bundle = rfc.match(/### 2\. Closed backup bundle v1[\s\S]*?### 3\. Backup state machine/)?.[0] ?? "";
  assert.match(bundle, /backupId: string;[^\n]*12 lowercase hex digest chars/);
  assert.doesNotMatch(bundle, /backupId\s*=|backup-id@|collision|retry/);
});

test("D2213: closed stdout receipt has no declared protocol type", () => {
  assert.match(rfc, /output is one closed JSON receipt on stdout/);
  assert.match(rfc, /Every command emits a single terminal result/);
  assert.doesNotMatch(rfc, /(?:interface|type) Storage(?:Admin|Operation|Backup)Receipt/);
});
