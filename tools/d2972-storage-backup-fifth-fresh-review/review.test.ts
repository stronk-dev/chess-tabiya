import { describe, expect, test } from "vitest";

import {
  CHECK_TUPLES,
  JOURNAL_PUBLICATION_STEPS,
  REPLACEMENT_DIRECTORY,
  assertJournalPublication,
  checkCompatibility,
  checkDigest,
  checkForeignKeys,
  checkIntegrity,
  checkInventory,
  compileChecks,
  discoverReplacement,
  generateStorageOperationId,
  inspectBackupSubject,
  parseReadyResponse,
  parseSha256,
  reconcileReplacement,
  serializeReadyResponse,
  serializeReplacementJournal,
  type MemberImage,
  type ReplacementFsImage,
  type ReplacementJournal,
} from "../d2724-storage-backup-fourth-author-repair/contract.js";

const op = generateStorageOperationId(Uint8Array.from({ length: 16 }, (_, index) => index + 1));
const arbitraryBytes = new TextEncoder().encode("this is not a SQLite database");
const arbitraryDigest = parseSha256("sha256:4c80177f34d2d36ba7fc17e6daad17431fc7ad2476e3e7660fdea17fba8cafa9");
const old: readonly MemberImage[] = Object.freeze([
  { member: "main", digest: parseSha256(`sha256:${"a".repeat(64)}`) },
]);
const staged = parseSha256(`sha256:${"b".repeat(64)}`);
const journalBase = {
  operationId: op,
  generation: 1,
  targetBasename: "chess-tabiya.sqlite",
  oldMembers: old,
  stagedDigest: staged,
} as const;

describe("storage backup fifth fresh independent review", () => {
  test("D2972 an exported subject minter turns arbitrary bytes into backup authority", () => {
    const subject = inspectBackupSubject(op, arbitraryBytes, 25);
    expect(subject).toMatchObject({ operationId: op, shape: "backup", sourceVersion: 25 });
    expect(subject.storageDigest).toBe(arbitraryDigest);
  });

  test("D2973 caller-written pragma, inventory and compatibility answers compile as passed", () => {
    const subject = inspectBackupSubject(op, arbitraryBytes, 25);
    const checks = [
      checkDigest(subject, arbitraryDigest, arbitraryBytes),
      checkIntegrity(subject, ["ok"]),
      checkForeignKeys(subject, []),
      checkInventory(subject, ["invented_table"], ["invented_table"]),
      checkCompatibility(subject, 25, []),
    ];
    expect(compileChecks(subject, "backup", checks)).toEqual(CHECK_TUPLES.backup);
  });

  test("D2974 verified keep-new authority ignores contradictory live bytes", () => {
    const verified: ReplacementJournal = { ...journalBase, phase: "verified" };
    const oldStillLive: ReplacementFsImage = {
      live: old,
      quarantineOld: [],
      quarantineNew: null,
      stagedNew: staged,
    };
    expect(reconcileReplacement(verified, oldStillLive)).toBe(verified);
  });

  test("D2975 four caller strings mint durable-publication success without filesystem effects", () => {
    expect(() => assertJournalPublication(JOURNAL_PUBLICATION_STEPS)).not.toThrow();
    expect(JOURNAL_PUBLICATION_STEPS).toEqual([
      "write_temp_exclusive",
      "fsync_temp",
      "rename_temp_over_journal",
      "fsync_transaction_directory",
    ]);
  });

  test("D2976 an unread and unowned leftover journal temp is accepted", () => {
    const journal: ReplacementJournal = { ...journalBase, phase: "prepared" };
    expect(discoverReplacement({
      directoryNames: [REPLACEMENT_DIRECTORY],
      entries: ["journal.json", "journal.tmp"],
      journalBytes: serializeReplacementJournal(journal),
    })).toMatchObject({ kind: "recover", journal: { operationId: op, phase: "prepared" } });
  });

  test("D2977 caller-authored HTTP status and JSON mint application readiness", () => {
    const body = serializeReadyResponse({ representativeData: "ok", status: "ready", storageVersion: 25 });
    expect(parseReadyResponse(200, body, 25)).toEqual({
      representativeData: "ok",
      status: "ready",
      storageVersion: 25,
    });
  });
});
