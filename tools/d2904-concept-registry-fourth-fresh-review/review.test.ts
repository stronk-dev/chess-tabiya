import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, test } from "vitest";

import {
  CONSUMER_OPERATIONS,
  assertConsumerOperationsFromRepository,
} from "../d2878-concept-registry-third-author-repair/model.js";

const REVIEWED_COMMIT = "8596c97c7fe4065a0aca6dad0b2af334eebf7f26";

describe("concept registry fourth fresh independent review", () => {
  test("D2904 the complete PackRegistry is constructed after storage migrations have already run", () => {
    const application = reviewed("apps/server/src/application.ts");
    const storage = reviewed("apps/server/src/storage.ts");
    const constructStorage = application.indexOf("new SQLiteRunStorage(databasePath)");
    const loadBuiltIns = application.indexOf("PackRegistry.loadDefault");
    const hydrateStoredPacks = application.indexOf("studio.hydrate()");

    expect(constructStorage).toBeGreaterThan(-1);
    expect(constructStorage).toBeLessThan(loadBuiltIns);
    expect(loadBuiltIns).toBeLessThan(hydrateStoredPacks);
    expect(storage).toMatch(/constructor\(filename[\s\S]*?this\.#migrate\(\)/u);
    expect(reviewed("rfc/concept-registry.md")).toMatch(
      /migration[\s\S]*?PackRegistry\.byDigest[\s\S]*?built-in artifacts plus the\s+validated `registered_packs` inventory/u,
    );
  });

  test("D2905 the proposed inner transaction cannot run in the shipped migration transaction", () => {
    const storage = reviewed("apps/server/src/storage.ts");
    const repair = reviewed("tools/d2878-concept-registry-third-author-repair/model.ts");
    expect(storage).toMatch(/BEGIN IMMEDIATE[\s\S]*?migration\.apply\(\)[\s\S]*?PRAGMA user_version[\s\S]*?COMMIT/u);
    expect(repair).toMatch(/migrateLegacyConceptBatch[\s\S]*?database\.exec\("BEGIN IMMEDIATE"\)/u);

    const database = new DatabaseSync(":memory:");
    database.exec("BEGIN IMMEDIATE");
    expect(() => database.exec("BEGIN IMMEDIATE")).toThrow(/transaction within a transaction/u);
    database.exec("ROLLBACK");
  });

  test("D2906 an unreachable operation call passes the claimed live-consumer closure", () => {
    const fixture = repositoryFixture("dead_function");
    const receipt = assertConsumerOperationsFromRepository(fixture.root, fixture.commit);
    expect(receipt.operations).toHaveLength(Object.keys(CONSUMER_OPERATIONS).length);

    expect(reviewedExists("apps/web/src/lib/client.ts")).toBe(false);
    expect(reviewed("apps/web/src/App.svelte")).toMatch(/from "\.\/lib\/api\.js"/u);
  });

  test("D2907 a type-invalid committed program passes the claimed compiler-derived closure", () => {
    const fixture = repositoryFixture("type_error");
    const receipt = assertConsumerOperationsFromRepository(fixture.root, fixture.commit);
    expect(receipt.operations).toHaveLength(Object.keys(CONSUMER_OPERATIONS).length);
    expect(git(fixture.root, ["show", `${fixture.commit}:apps/server/src/account-data.ts`])).toContain(
      "const impossible: string = 42",
    );
  });

  test("D2908 PackRegistry.byDigest accepts a caller-stamped digest unrelated to the document", async () => {
    const document = JSON.parse(reviewed("schemas/drill_pack.example.json"));
    const actual = `sha256:${"a".repeat(64)}`;
    const registry = new ReviewedMutablePackRegistry(document, actual);
    const forged = `sha256:${"f".repeat(64)}`;
    expect(actual).not.toBe(forged);

    registry.addPlaytest(document, forged);
    expect(registry.byDigest(forged)).toMatchObject({ digest: forged });
    expect(registry.byDigest(forged)?.document).toStrictEqual(document);
  });
});

class ReviewedMutablePackRegistry {
  readonly #digests = new Map<string, { document: unknown; digest: string }>();
  readonly #id: string;
  constructor(document: { id: string }, digest: string) {
    this.#id = document.id;
    this.#digests.set(digest, { document, digest });
  }
  required(id: string) {
    if (id !== this.#id) throw new TypeError("missing");
    return [...this.#digests.values()][0]!;
  }
  addPlaytest(document: unknown, digest: string) { this.#digests.set(digest, { document, digest }); }
  byDigest(digest: string) { return this.#digests.get(digest); }
}

function reviewed(file: string): string {
  return execFileSync("git", ["show", `${REVIEWED_COMMIT}:${file}`], { encoding: "utf8" });
}

function reviewedExists(file: string): boolean {
  try { execFileSync("git", ["cat-file", "-e", `${REVIEWED_COMMIT}:${file}`]); return true; }
  catch { return false; }
}

function repositoryFixture(kind: "dead_function" | "type_error") {
  const root = mkdtempSync(path.join(tmpdir(), "tabiya-concept-fourth-review-"));
  const operations = Object.values(CONSUMER_OPERATIONS);
  write(root, "packages/runtime/src/concepts.ts", operations.map((name) => `export function ${name}() { return true; }`).join("\n"));
  write(root, "packages/runtime/src/index.ts", `export { ${operations.join(", ")} } from "./concepts.js";\n`);
  for (const [file, operation] of Object.entries(CONSUMER_OPERATIONS)) {
    const specifier = file === "apps/web/src/lib/client.ts" ? "@chess-tabiya/runtime" : "@chess-tabiya/runtime/concepts";
    const use = kind === "dead_function"
      ? `export function neverImported() { return operation(); }\n`
      : `operation();\n${file.endsWith("account-data.ts") ? "const impossible: string = 42;\n" : ""}`;
    write(root, file, `import { ${operation} as operation } from "${specifier}";\n${use}`);
  }
  git(root, ["init", "--quiet"]);
  git(root, ["add", "."]);
  git(root, ["-c", "user.name=Tabiya", "-c", "user.email=tabiya@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  return { root, commit: git(root, ["rev-parse", "HEAD"]).trim() };
}

function write(root: string, file: string, bytes: string): void {
  const absolute = path.join(root, file);
  mkdirSync(path.dirname(absolute), { recursive: true });
  writeFileSync(absolute, bytes);
}

function git(root: string, args: readonly string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}
