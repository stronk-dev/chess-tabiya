import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, test } from "vitest";

import { PackRegistry } from "../../apps/server/src/pack-registry.js";
import {
  CONSUMER_OPERATIONS,
  assertConsumerOperationsFromRepository,
} from "../d2878-concept-registry-third-author-repair/model.js";

describe("concept registry fourth fresh independent review", () => {
  test("D2904 the complete PackRegistry is constructed after storage migrations have already run", () => {
    const application = readFileSync("apps/server/src/application.ts", "utf8");
    const storage = readFileSync("apps/server/src/storage.ts", "utf8");
    const constructStorage = application.indexOf("new SQLiteRunStorage(databasePath)");
    const loadBuiltIns = application.indexOf("PackRegistry.loadDefault");
    const hydrateStoredPacks = application.indexOf("studio.hydrate()");

    expect(constructStorage).toBeGreaterThan(-1);
    expect(constructStorage).toBeLessThan(loadBuiltIns);
    expect(loadBuiltIns).toBeLessThan(hydrateStoredPacks);
    expect(storage).toMatch(/constructor\(filename[\s\S]*?this\.#migrate\(\)/u);
    expect(readFileSync("rfc/concept-registry.md", "utf8")).toMatch(
      /migration[\s\S]*?PackRegistry\.byDigest[\s\S]*?built-in artifacts plus the\s+validated `registered_packs` inventory/u,
    );
  });

  test("D2905 the proposed inner transaction cannot run in the shipped migration transaction", () => {
    const storage = readFileSync("apps/server/src/storage.ts", "utf8");
    const repair = readFileSync("tools/d2878-concept-registry-third-author-repair/model.ts", "utf8");
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

    expect(existsSync("apps/web/src/lib/client.ts")).toBe(false);
    expect(readFileSync("apps/web/src/App.svelte", "utf8")).toMatch(/from "\.\/lib\/api\.js"/u);
  });

  test("D2907 a type-invalid committed program passes the claimed compiler-derived closure", () => {
    const fixture = repositoryFixture("type_error");
    const receipt = assertConsumerOperationsFromRepository(fixture.root, fixture.commit);
    expect(receipt.operations).toHaveLength(Object.keys(CONSUMER_OPERATIONS).length);
    expect(readFileSync(path.join(fixture.root, "apps/server/src/account-data.ts"), "utf8")).toContain(
      "const impossible: string = 42",
    );
  });

  test("D2908 PackRegistry.byDigest accepts a caller-stamped digest unrelated to the document", async () => {
    const document = JSON.parse(readFileSync("schemas/drill_pack.example.json", "utf8"));
    const registry = await PackRegistry.fromDocuments([{ source: "fixture", value: document }]);
    const actual = registry.required(document.id).digest;
    const forged = `sha256:${"f".repeat(64)}`;
    expect(actual).not.toBe(forged);

    registry.addPlaytest(document, forged);
    expect(registry.byDigest(forged)).toMatchObject({ digest: forged });
    expect(registry.byDigest(forged)?.document).toStrictEqual(document);
  });
});

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
