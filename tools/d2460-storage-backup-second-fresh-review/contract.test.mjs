// DISPOSABLE second fresh independent buildability review — D2460-D2464.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rfc = readFileSync("rfc/storage-backup-recovery.md", "utf8");
const protocol = readFileSync("tools/d2210-storage-backup-author-repair/protocol.proposed.ts", "utf8");

test("D2460 inherited-FD validation proves inode but not flock ownership", () => {
  assert.match(rfc, /validates by `fstat` that FD 3 still names the configured lock inode/u);
  assert.match(rfc, /validate the inherited descriptor\/inode but never acquire or release/u);
  assert.doesNotMatch(rfc, /independent (?:lock )?contention probe|prove[^\n]*flock ownership|unforgeable[^\n]*handoff/iu);
});

test("D2461 failure cleanup still names the superseded partial-directory protocol", () => {
  assert.match(rfc, /randomly named directory[\s\S]*not syntactically a\s+bundle/u);
  assert.match(rfc, /exclusively created final directory is an invalid bundle until publication/u);
  assert.match(rfc, /Failure[\s\S]*retains or removes only the explicitly named `.partial` directory/u);
});

test("D2462 verified phase precedes the installed-main fsync", () => {
  assert.match(rfc, /3\. `new_installed`[\s\S]*then close it;/u);
  assert.match(rfc, /4\. `verified` — fsync the installed main/u);
  assert.match(rfc, /`verified` deterministically keeps the installed main/u);
});

test("D2463 bundle identity remains an arbitrary string in both normative and proposed types", () => {
  assert.match(rfc, /role: "bundle"; readonly identity: string/u);
  assert.match(protocol, /role: "bundle"; readonly identity: string/u);
  assert.doesNotMatch(protocol, /type BackupId|parseBackupId|__backupId/u);
});

test("D2464 succeeded receipts accept empty or irrelevant check arrays", () => {
  assert.match(protocol, /operation: "backup"[\s\S]*checks: readonly Check\[\]/u);
  assert.match(protocol, /operation: "rehearsal"[\s\S]*checks: readonly Check\[\]/u);
  assert.match(protocol, /operation: "backup"[\s\S]*checks: \["digest"\][\s\S]*satisfies Receipt/u);
  assert.doesNotMatch(protocol, /@ts-expect-error[^\n]*(?:empty|irrelevant|duplicate|wrong).*check/iu);
});
