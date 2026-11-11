import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { decodeSemanticValidationReceipt, encodeSemanticValidationReceipt } from "./semantic-validation-receipt-storage.js";
import type { SemanticValidationReceiptDocument } from "./semantic-validation.js";
import { SEMANTIC_VALIDATION_RECEIPT } from "./semantic-validation-receipt.generated.js";
import { decodeGitValidationReceipt } from "../../../tools/d3367-provider-source-history/validation-receipt.js";

const a = "a".repeat(64), b = "b".repeat(64);
const target = (sourceDigests: readonly string[]) => ({ projection: "example@1", operandDigest: a,
  factory: "fixture", inputDigest: b, payloadDigest: a, sourceDigests });
function fixture(): SemanticValidationReceiptDocument {
  const row = { case: "a@1", subject: "event:example@1", arm: "positive", operation: "fixture@1", inputDigest: a,
    invocations: 1, resultKind: "completed", unavailableReason: null, targetCount: 2, otherCount: 0,
    targets: [target([a, b, a]), target([])], reach: "direct", authority: { kind: "fixture" }, status: "passed", failure: null };
  return { schemaVersion: 1, writer: "make semantic-validation-update", rootDigest: a, profileDigest: b,
    caseDigest: a, externalDigest: b, operations: [], population: null, populations: [], externals: [], verdicts: [],
    cases: [row, { ...row, case: "b@1", targets: [target([a, b, a]), target([b, a, a])],
      status: "failed", failure: { code: "fixture-error", message: "Preserve this failure", operands: [1, false, null] } },
    { ...row, case: "quiet@1", targetCount: 0, targets: [] }] };
}
type Stored = ReturnType<typeof JSON.parse>;
const stored = (): Stored => JSON.parse(encodeSemanticValidationReceipt(fixture()));
const encode = (value: unknown) => JSON.stringify(value);

describe("lossless complete validation receipt storage", () => {
  it("round-trips the actual complete generated artifact within the unchanged source bound", () => {
    const text = readFileSync(new URL("./semantic-validation-receipt.generated.json", import.meta.url), "utf8");
    const document = decodeSemanticValidationReceipt(text);
    expect(document.schemaVersion).toBe(1); expect(document.cases.length).toBeGreaterThan(0);
    expect(encodeSemanticValidationReceipt(document)).toBe(text);
    expect(Buffer.byteLength(text)).toBeLessThan(5 * 1024 * 1024);
    expect(createHash("sha256").update(text).digest("hex")).toBe(SEMANTIC_VALIDATION_RECEIPT.receiptSha256);
  });
  it("preserves every field, order, empty list, failure and vector multiplicity", () => {
    const before = fixture(), copy = structuredClone(before), text = encodeSemanticValidationReceipt(before), value = JSON.parse(text);
    expect(before).toEqual(copy);
    expect(value.schemaVersion).toBe(2);
    expect(value.sourceDigestVectors).toEqual([[a, b, a], [], [b, a, a]]);
    expect(value.cases.map((row: { targets: { sourceDigestVector: number }[] }) => row.targets.map(target => target.sourceDigestVector)))
      .toEqual([[0, 1], [0, 2], []]);
    expect(decodeSemanticValidationReceipt(text)).toEqual(before);
    expect(encodeSemanticValidationReceipt(decodeSemanticValidationReceipt(text))).toBe(text);
  });

  it("makes shared decoded vectors immutable", () => {
    const value = decodeSemanticValidationReceipt(encodeSemanticValidationReceipt(fixture()));
    const first = (value.cases[0]!.targets as { sourceDigests: string[] }[])[0]!.sourceDigests;
    const second = (value.cases[1]!.targets as { sourceDigests: string[] }[])[0]!.sourceDigests;
    expect(first).toBe(second); expect(Object.isFrozen(first)).toBe(true);
    expect(() => first.push(a)).toThrow(); expect(second).toEqual([a, b, a]);
  });

  it("preserves an entirely empty target population", () => {
    const value = fixture(), empty = { ...value, cases: [] };
    expect(decodeSemanticValidationReceipt(encodeSemanticValidationReceipt(empty))).toEqual(empty);
  });

  it.each([
    ["schema1 current", (value: Stored) => { value.schemaVersion = 1; }],
    ["unknown version", (value: Stored) => { value.schemaVersion = 3; }],
    ["missing dictionary", (value: Stored) => { delete value.sourceDigestVectors; }],
    ["object dictionary", (value: Stored) => { value.sourceDigestVectors = {}; }],
    ["invalid vector", (value: Stored) => { value.sourceDigestVectors[0] = null; }],
    ["invalid digest", (value: Stored) => { value.sourceDigestVectors[0][0] = "wrong"; }],
    ["uppercase digest", (value: Stored) => { value.sourceDigestVectors[0][0] = a.toUpperCase(); }],
    ["newline-suffixed digest", (value: Stored) => { value.sourceDigestVectors[0][0] = `${a}\n`; }],
    ["nonstring digest", (value: Stored) => { value.sourceDigestVectors[0][0] = 5; }],
    ["duplicate vector", (value: Stored) => { value.sourceDigestVectors.push(value.sourceDigestVectors[0]); }],
    ["unused vector", (value: Stored) => { value.sourceDigestVectors.push([b]); }],
    ["extra root key", (value: Stored) => { value.unknown = true; }],
    ["missing root key", (value: Stored) => { delete value.operations; }],
    ["extra case key", (value: Stored) => { value.cases[0].unknown = 1; }],
    ["missing case key", (value: Stored) => { delete value.cases[0].failure; }],
    ["nonarray cases", (value: Stored) => { value.cases = null; }],
    ["nonarray targets", (value: Stored) => { value.cases[0].targets = {}; }],
    ["extra target key", (value: Stored) => { value.cases[0].targets[0].unknown = 1; }],
    ["both target representations", (value: Stored) => { value.cases[0].targets[0].sourceDigests = [a]; }],
    ["missing index", (value: Stored) => { delete value.cases[0].targets[0].sourceDigestVector; }],
    ["negative index", (value: Stored) => { value.cases[0].targets[0].sourceDigestVector = -1; }],
    ["fractional index", (value: Stored) => { value.cases[0].targets[0].sourceDigestVector = 0.5; }],
    ["string index", (value: Stored) => { value.cases[0].targets[0].sourceDigestVector = "0"; }],
    ["null index", (value: Stored) => { value.cases[0].targets[0].sourceDigestVector = null; }],
    ["out of range", (value: Stored) => { value.cases[0].targets[0].sourceDigestVector = 3; }],
  ])("refuses %s", (_name, mutate) => {
    const value = stored(); mutate(value);
    expect(() => decodeSemanticValidationReceipt(encode(value))).toThrow(/SEMANTIC_VALIDATION_RECEIPT_STORAGE_INVALID/u);
  });

  it("refuses malformed text and encoder-side malformed vectors without modifying input", () => {
    expect(() => decodeSemanticValidationReceipt("{")).toThrow();
    expect(() => decodeSemanticValidationReceipt(null as unknown as string)).toThrow();
    const value = fixture(), row = value.cases[0]!;
    (row.targets as { sourceDigests: unknown }[])[0]!.sourceDigests = ["wrong"];
    const copy = structuredClone(value);
    expect(() => encodeSemanticValidationReceipt(value)).toThrow(); expect(value).toEqual(copy);
    expect(() => encodeSemanticValidationReceipt({ ...fixture(), schemaVersion: 2 } as unknown as SemanticValidationReceiptDocument)).toThrow();
    expect(() => decodeSemanticValidationReceipt(encode(stored()).replace('"sourceDigestVector":0', '"sourceDigestVector":-0'))).toThrow();
  });
});

const repos: string[] = [];
afterEach(() => { for (const root of repos.splice(0)) rmSync(root, { recursive: true, force: true }); });
describe("explicit previous-Git receipt decoding", () => {
  it("handles frozen schema1 BASELINE, pre-cutover HEAD and post-cutover storage2 HEAD", () => {
    const root = mkdtempSync(join(tmpdir(), "tabiya-receipt-history-")); repos.push(root);
    const git = (...args: string[]) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    git("init", "--initial-branch=main");
    const path = "packages/runtime/src/semantic-validation-receipt.generated.json";
    mkdirSync(join(root, "packages/runtime/src"), { recursive: true });
    writeFileSync(join(root, path), JSON.stringify(fixture())); git("add", path);
    git("-c", "user.name=Receipt Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "schema1 baseline");
    const baseline = git("rev-parse", "HEAD").trim();
    const oldHead = git("show", `HEAD:${path}`);
    expect(decodeGitValidationReceipt(oldHead)).toEqual(fixture());
    expect(() => decodeSemanticValidationReceipt(oldHead)).toThrow();
    writeFileSync(join(root, path), encodeSemanticValidationReceipt(fixture())); git("add", path);
    git("-c", "user.name=Receipt Fixture", "-c", "user.email=fixture@example.invalid", "commit", "-m", "storage2 cutover");
    expect(decodeGitValidationReceipt(git("show", `${baseline}:${path}`))).toEqual(fixture());
    expect(decodeGitValidationReceipt(git("show", `HEAD:${path}`))).toEqual(fixture());
    expect(decodeSemanticValidationReceipt(git("show", `HEAD:${path}`))).toEqual(fixture());
  });
  it("refuses unknown and ambiguous historical formats", () => {
    expect(() => decodeGitValidationReceipt('{"schemaVersion":3}')).toThrow();
    expect(() => decodeGitValidationReceipt(JSON.stringify({ ...fixture(), sourceDigestVectors: [] }))).toThrow();
    const value = fixture(); (value.cases[0]!.targets as Record<string, unknown>[])[0]!.sourceDigestVector = 0;
    expect(() => decodeGitValidationReceipt(JSON.stringify(value))).toThrow();
  });
});
