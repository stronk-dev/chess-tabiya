import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  checkCompatibility,
  checkDigest,
  checkForeignKeys,
  checkIntegrity,
  checkInventory,
  compileChecks,
  generateStorageOperationId,
  parseStorageOperationId,
  reconcileReplacement,
  type ReplacementFsImage,
  type ReplacementJournal,
} from "../d2608-storage-backup-third-author-repair/contract.js";

const model = readFileSync("tools/d2608-storage-backup-third-author-repair/contract.ts", "utf8");
const application = readFileSync("apps/server/src/application.ts", "utf8");
const review = readFileSync("planning/storage-backup-recovery/fourth-fresh-independent-buildability-review-2026-09-05.md", "utf8");
const op = generateStorageOperationId(Uint8Array.from({ length: 16 }, (_, index) => index + 1));
const sha = (character: string): string => `sha256:${character.repeat(64)}`;

describe("D2724-D2729 storage backup fourth fresh review", () => {
  it("D2724 advances replacement recovery without observing any recorded byte digest", () => {
    const journal: ReplacementJournal = {
      phase: "forward_quarantine",
      operationId: op,
      oldMembers: ["main"],
      moved: [],
    };
    const unidentifiableBytes: ReplacementFsImage = {
      live: [],
      quarantineOld: ["main"],
      quarantineNew: false,
      stagedNew: true,
      newMainLive: false,
    };
    expect(reconcileReplacement(journal, unidentifiableBytes)).toMatchObject({
      phase: "forward_install",
    });
    expect(model).not.toMatch(/(?:old|staged|live|quarantine)[A-Za-z]*Digest/u);
  });

  it("D2725 compiles valid checks from unrelated subjects and the wrong operation shape", () => {
    const mixed = [
      checkDigest(op, "same", "same", sha("a")),
      checkIntegrity(op, ["ok"], sha("b")),
      checkForeignKeys(op, [], sha("c")),
      checkInventory(op, ["one"], ["one"], sha("d")),
      // Null is the fresh-database compatibility operand, yet it satisfies a backup receipt.
      checkCompatibility(op, null, 25, [], sha("e")),
    ];
    expect(compileChecks(op, "backup", mixed)).toEqual([
      "digest",
      "integrity",
      "foreign_keys",
      "inventory",
      "compatibility",
    ]);
    expect(new Set(mixed.map((result) => result.operandDigest)).size).toBe(5);
  });

  it("D2726 has state names but no crash-durable journal publication or discovery algebra", () => {
    expect(review).toMatch(/state union, not durable recovery authority/u);
    expect(model).not.toMatch(/(?:write|rename|fsync|open|read).*Journal/u);
  });

  it("D2727 reparses UUID versions that the v4-only ownership contract cannot generate", () => {
    expect(parseStorageOperationId("00112233-4455-1677-8899-aabbccddeeff")).toBe(
      "00112233-4455-1677-8899-aabbccddeeff",
    );
    expect(parseStorageOperationId("00112233-4455-5677-8899-aabbccddeeff")).toBe(
      "00112233-4455-5677-8899-aabbccddeeff",
    );
  });

  it("D2728 omits the application route that must make readiness observable", () => {
    expect(application).toMatch(/url\.pathname === "\/healthz"/u);
    expect(application).not.toMatch(/url\.pathname === "\/readyz"/u);
    expect(model).toMatch(/body !== "ready"/u);
    expect(review).toMatch(/omits `application\.ts`/u);
  });

  it("D2729 leaves the explicitly immutable application revision caller-mintable", () => {
    expect(review).toMatch(/type `applicationRevision` as plain `string`/u);
    expect(model).not.toMatch(/parseApplicationRevision/u);
  });
});
