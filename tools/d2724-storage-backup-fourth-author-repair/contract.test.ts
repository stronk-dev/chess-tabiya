import { describe, expect, it } from "vitest";
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
  inspectPrepareFreshSubject,
  parseApplicationRevision,
  parseSha256,
  parseStorageOperationId,
  reconcileReplacement,
  releaseRecoveryEligible,
  serializeReplacementJournal,
  serializeReadyResponse,
  parseReadyResponse,
  type MemberImage,
  type ReplacementFsImage,
  type ReplacementJournal,
} from "./contract.js";

const op = generateStorageOperationId(Uint8Array.from({ length: 16 }, (_, index) => index + 1));
const bytes = new TextEncoder().encode("database-a");
const digest = parseSha256("sha256:174787f0eb983fa3ada09e97ebb9ecf7f08991704dcb022d3c8f3b0ba86c4e44");
const old: readonly MemberImage[] = Object.freeze([{ member: "main", digest: parseSha256(`sha256:${"a".repeat(64)}`) }]);
const staged = parseSha256(`sha256:${"b".repeat(64)}`);
const journalBase = { operationId: op, generation: 1, targetBasename: "chess-tabiya.sqlite", oldMembers: old, stagedDigest: staged } as const;
const fsImage = (patch: Partial<ReplacementFsImage>): ReplacementFsImage => ({ live: old, quarantineOld: [], quarantineNew: null, stagedNew: staged, ...patch });

describe("storage backup fourth author repair", () => {
  it("D2724 reconciles exact old and staged byte identities", () => {
    const journal: ReplacementJournal = { ...journalBase, phase: "forward_quarantine", moved: [] };
    expect(reconcileReplacement(journal, fsImage({ live: [], quarantineOld: old }))).toMatchObject({ phase: "forward_install" });
    expect(() => reconcileReplacement(journal, fsImage({ live: [], quarantineOld: [{ member: "main", digest: staged }] }))).toThrow(/DIGEST/);
    const install: ReplacementJournal = { ...journalBase, phase: "forward_install", newInstalled: false };
    expect(reconcileReplacement(install, fsImage({ live: [{ member: "main", digest: staged }], quarantineOld: old, stagedNew: null }))).toMatchObject({ phase: "forward_verify" });
    expect(() => reconcileReplacement(install, fsImage({ live: [{ member: "main", digest: old[0]!.digest }], quarantineOld: old, stagedNew: null }))).toThrow(/DIGEST/);
  });

  it("D2725 binds every check to one exact operation shape and storage subject", () => {
    const subjectA = inspectBackupSubject(op, bytes, 25);
    const subjectB = inspectBackupSubject(op, new TextEncoder().encode("database-b"), 25);
    const checks = [
      checkDigest(subjectA, digest, bytes),
      checkIntegrity(subjectA, ["ok"]),
      checkForeignKeys(subjectA, []),
      checkInventory(subjectA, ["one"], ["one"]),
      checkCompatibility(subjectA, 25, []),
    ];
    expect(compileChecks(subjectA, "backup", checks)).toEqual(CHECK_TUPLES.backup);
    expect(() => compileChecks(subjectB, "backup", checks)).toThrow(/SUBJECT/);
    const fresh = inspectPrepareFreshSubject(op);
    expect(() => compileChecks(subjectA, "backup", [checks[0]!, checks[1]!, checks[2]!, checks[3]!, checkCompatibility(fresh, 25, [])])).toThrow(/SUBJECT/);
    expect(() => compileChecks(fresh, "backup", [checkCompatibility(fresh, 25, [])])).toThrow(/SHAPE/);
  });

  it("D2726 publishes one fixed discoverable journal or refuses ambiguity", () => {
    expect(() => assertJournalPublication(JOURNAL_PUBLICATION_STEPS)).not.toThrow();
    expect(() => assertJournalPublication(JOURNAL_PUBLICATION_STEPS.slice(0, -1))).toThrow(/DURABLE/);
    const journal: ReplacementJournal = { ...journalBase, phase: "prepared" };
    const journalBytes = serializeReplacementJournal(journal);
    expect(discoverReplacement({ directoryNames: [REPLACEMENT_DIRECTORY], entries: ["journal.json"], journalBytes })).toMatchObject({ kind: "recover" });
    expect(() => discoverReplacement({ directoryNames: [REPLACEMENT_DIRECTORY, ".tabiya-replacement-old"], entries: ["journal.json"], journalBytes })).toThrow(/AMBIGUOUS/);
    expect(() => discoverReplacement({ directoryNames: [REPLACEMENT_DIRECTORY], entries: ["journal.tmp"], journalBytes })).toThrow(/JOURNAL/);
    expect(() => discoverReplacement({ directoryNames: [REPLACEMENT_DIRECTORY], entries: ["journal.json"], journalBytes: `${journalBytes} ` })).toThrow(/NONCANONICAL/);
  });

  it("D2727 reconstructs only canonical RFC-4122 v4 operation identities", () => {
    expect(parseStorageOperationId(op)).toBe(op);
    for (const value of ["00112233-4455-1677-8899-aabbccddeeff", "00112233-4455-5677-8899-aabbccddeeff", "00112233-4455-4677-7899-aabbccddeeff"]) {
      expect(() => parseStorageOperationId(value)).toThrow(/OPERATION_ID/);
    }
  });

  it("D2728 parses one canonical readyz body with storage and representative-data truth", () => {
    const body = serializeReadyResponse({ representativeData: "ok", status: "ready", storageVersion: 25 });
    expect(parseReadyResponse(200, body, 25)).toEqual({ representativeData: "ok", status: "ready", storageVersion: 25 });
    expect(() => parseReadyResponse(200, "ready", 25)).toThrow();
    expect(() => parseReadyResponse(200, serializeReadyResponse({ representativeData: "ok", status: "ready", storageVersion: 24 }), 25)).toThrow(/BODY/);
  });

  it("D2729 parses immutable release/dev revisions and rejects mutable labels", () => {
    const release = parseApplicationRevision("a".repeat(40));
    expect(releaseRecoveryEligible(release)).toBe(true);
    expect(releaseRecoveryEligible(parseApplicationRevision(`dev+${"b".repeat(40)}`))).toBe(false);
    expect(releaseRecoveryEligible(parseApplicationRevision("dev+dirty"))).toBe(false);
    for (const value of ["0.0.0", "latest", "main", "A".repeat(40), "dev+latest"]) expect(() => parseApplicationRevision(value)).toThrow(/REVISION/);
  });
});
