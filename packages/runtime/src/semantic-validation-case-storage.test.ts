import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { SEMANTIC_VALIDATION_CASES_PATH } from "./semantic-validation.js";
import { loadSemanticValidationCases, readSemanticValidationCases } from "./semantic-validation-case-storage.js";

const PART = "packages/runtime/src/semantic-validation-cases/";
// Parser fixtures only: no authority row is issued or source qualification claimed here.
const example = (id: string) => ({
  id, version: 1, subject: { kind: "event", projection: { id: "derived.tactic.defender_exposure", version: 2 } },
  arm: "positive", operation: { id: "runtime.semantic.breadth_edge", version: 1 },
  input: { kind: "edge", beforeFen: "r3k3/8/1n6/2B5/8/8/8/R3K3 w - - 0 1", moveUci: "c5b6", afterFen: "r3k3/8/1B6/8/8/8/8/R3K3 b - - 0 1" },
  authority: { kind: "owner_authored", id: "storage-fixture", version: 1 },
  expectation: { kind: "emits", minimum: 1 },
});
const part = (cases: readonly unknown[]) => JSON.stringify({ schemaVersion: 1, cases });
const index = (parts: readonly string[]) => JSON.stringify({ schemaVersion: 2, parts: parts.map(name => `semantic-validation-cases/${name}.json`) });
function fixture(): Record<string, string> {
  return {
    [SEMANTIC_VALIDATION_CASES_PATH]: index(["first", "second"]),
    [`${PART}first.json`]: part([example("storage.one")]),
    [`${PART}second.json`]: part([example("storage.two"), example("storage.three")]),
  };
}
const read = (files: Readonly<Record<string, string>>) => (path: string): string | undefined => files[path];
const directories: string[] = [];
afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

describe("one complete tree supplies each canonical case read", () => {
  it("retains every recorded object in index order and then part order", () => {
    const files = fixture(), paths: string[] = [];
    const value = readSemanticValidationCases(path => { paths.push(path); return files[path]; });
    expect(value).toEqual({ schemaVersion: 1, cases: [example("storage.one"), example("storage.two"), example("storage.three")] });
    expect(paths).toEqual([SEMANTIC_VALIDATION_CASES_PATH, `${PART}first.json`, `${PART}second.json`]);
  });

  it("preserves normalized serialization on repartition and changes it for order or case changes", () => {
    const files = fixture(), original = readSemanticValidationCases(read(files));
    files[`${PART}first.json`] = part(original.cases.slice(0, 2));
    files[`${PART}second.json`] = part(original.cases.slice(2));
    expect(JSON.stringify(readSemanticValidationCases(read(files)))).toBe(JSON.stringify(original));
    files[SEMANTIC_VALIDATION_CASES_PATH] = index(["second", "first"]);
    expect(JSON.stringify(readSemanticValidationCases(read(files)))).not.toBe(JSON.stringify(original));
    for (const change of [
      { expectation: { kind: "emits", minimum: 1, operandMatch: { fixture: "changed" } } },
      { authority: { kind: "owner_authored", id: "another-fixture", version: 1 } },
      { input: { ...example("unused").input, beforeFen: "7k/8/8/8/8/8/8/7K w - - 0 1" } },
    ]) {
      const changed = fixture();
      changed[`${PART}first.json`] = part([{ ...example("storage.one"), ...change }]);
      expect(JSON.stringify(readSemanticValidationCases(read(changed)))).not.toBe(JSON.stringify(original));
    }
  });

  it("reads the same declared path independently from two different trees", () => {
    const a = fixture(), b = fixture(), seenA: string[] = [], seenB: string[] = [];
    b[`${PART}first.json`] = part([example("storage.different")]);
    const first = readSemanticValidationCases(path => { seenA.push(path); return a[path]; });
    const second = readSemanticValidationCases(path => { seenB.push(path); return b[path]; });
    expect(first.cases[0]!.id).toBe("storage.one");
    expect(second.cases[0]!.id).toBe("storage.different");
    expect(seenA).toEqual(seenB);
    delete a[`${PART}second.json`];
    expect(() => readSemanticValidationCases(read(a))).toThrow(/missing.*second\.json/u);
  });

  it("the filesystem wrapper uses that same index and every declared part", () => {
    const root = mkdtempSync(join(tmpdir(), "tabiya-case-storage-")); directories.push(root);
    const files = fixture();
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true }); writeFileSync(join(root, path), text);
    }
    expect(loadSemanticValidationCases(root)).toEqual(readSemanticValidationCases(read(files)));
    rmSync(join(root, `${PART}second.json`));
    expect(() => loadSemanticValidationCases(root)).toThrow(/missing.*second\.json/u);
  });

  it.each([
    null, [], {}, { schemaVersion: 1, cases: [] }, { schemaVersion: 3, parts: [] },
    { schemaVersion: 2, parts: [] }, { schemaVersion: 2, parts: [1] },
    { schemaVersion: 2, parts: ["semantic-validation-cases/a.json"], extra: true },
    ...["", "/absolute.json", "../a.json", "semantic-validation-cases/../a.json", "semantic-validation-cases/nested/a.json",
      "semantic-validation-cases\\a.json", "semantic-validation-cases/a.txt", "semantic-validation-cases/.json", "semantic-validation-cases/a\u0000.json"]
      .map(path => ({ schemaVersion: 2, parts: [path] })),
    { schemaVersion: 2, parts: ["semantic-validation-cases/first.json", "semantic-validation-cases/first.json"] },
  ])("rejects a malformed or unsafe index %# before reading any part", value => {
    const paths: string[] = [];
    expect(() => readSemanticValidationCases(path => { paths.push(path); return JSON.stringify(value); })).toThrow();
    expect(paths).toEqual([SEMANTIC_VALIDATION_CASES_PATH]);
  });

  it.each([null, [], {}, { schemaVersion: 2, cases: [] }, { schemaVersion: 1, cases: {} },
    { schemaVersion: 1, cases: [example("storage.one")], extra: true }, { schemaVersion: 1, cases: [{ id: "invalid" }] },
  ])("rejects the complete read for an invalid part %#", value => {
    const files = fixture(); files[`${PART}second.json`] = JSON.stringify(value);
    expect(() => readSemanticValidationCases(read(files))).toThrow();
  });

  it.each(["within", "across"])("rejects duplicate case identity %s parts", where => {
    const files = fixture();
    files[`${PART}second.json`] = part(where === "within" ? [example("storage.two"), example("storage.two")] : [example("storage.one")]);
    expect(() => readSemanticValidationCases(read(files))).toThrow(/duplicate case/u);
  });

  it.each([SEMANTIC_VALIDATION_CASES_PATH, `${PART}first.json`, `${PART}second.json`])("rejects missing and malformed JSON at %s", path => {
    const files = fixture(); delete files[path];
    expect(() => readSemanticValidationCases(read(files))).toThrow(/missing/u);
    files[path] = "{";
    expect(() => readSemanticValidationCases(read(files))).toThrow(/malformed JSON/u);
  });
});
